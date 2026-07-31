// The 20-second capture (spec §3). Big question, seating grid, visible timer.
// Teacher taps the SMALLER group, flips if needed, confirms, optionally taps
// which wrong answer was most common. Effort is measured, not estimated (C5).
import { allLessons, allStudents, getLesson, saveCheck, uid } from '../db';
import { bi, t } from '../i18n';
import type { CheckRecord, Lesson, OptionKey, Student } from '../types';
import { el, esc, go } from '../ui';

const KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export async function renderCheck(root: HTMLElement, params: URLSearchParams): Promise<void> {
  root.innerHTML = '';
  const lessonId = params.get('lesson');
  let lesson: Lesson | undefined = lessonId ? await getLesson(lessonId) : undefined;
  if (!lesson) lesson = (await allLessons())[0];

  if (!lesson) {
    const empty = el(`
      <div class="empty">
        <p>${esc(t('checkNoLesson'))}</p>
        <button class="btn primary" id="goPrep">${esc(t('navPrep'))}</button>
      </div>`);
    empty.querySelector('#goPrep')!.addEventListener('click', () => go('/prep'));
    root.appendChild(empty);
    return;
  }

  const students = await allStudents();
  const qi = Math.min(Number(params.get('q') ?? 0), lesson.questions.length - 1);
  const q = lesson.questions[qi];

  // Marked = the group the teacher is tapping. Default: those who did NOT get it.
  const marked = new Set<string>();
  let markingUnderstood = false;
  const startedAt = Date.now();

  const screen = el(`
    <div class="check-screen live">
      <div class="check-top">
        <div class="q-tabs">
          ${lesson.questions.map(
            (_, i) => `<button class="q-tab ${i === qi ? 'active' : ''}" data-q="${i}">${i + 1}</button>`
          ).join('')}
        </div>
        <div class="timer" id="timer" aria-live="off">0 ${esc(t('checkSeconds'))}</div>
      </div>
      <div class="check-question">
        <p class="big-q">${esc(bi(q.text))}</p>
        <div class="big-opts">
          ${KEYS.map((k) => `<span class="big-opt"><b>${k}</b> ${esc(bi(q.options[k].text))}</span>`).join('')}
        </div>
      </div>
      <p class="tiny center">${esc(t('checkReadAloud'))}</p>
      <div class="mark-row">
        <span class="mark-label" id="markLabel">${esc(t('checkMarkingNot'))}</span>
        <button class="link-btn" id="flipBtn">${esc(t('checkFlip'))}</button>
      </div>
      <p class="grid-hint">${esc(t('checkTapSmaller'))}</p>
      <div class="seat-grid" id="grid" role="group"></div>
      <div class="check-footer">
        <span class="tally" id="tally"></span>
        <button class="btn accent big" id="confirmBtn">${esc(t('checkConfirm'))}</button>
      </div>
    </div>`);
  root.appendChild(screen);

  screen.querySelectorAll<HTMLElement>('[data-q]').forEach((tab) =>
    tab.addEventListener('click', () => {
      go(`/check?lesson=${lesson!.id}&q=${tab.dataset.q}`);
    })
  );

  const timerEl = screen.querySelector('#timer')!;
  const timerId = setInterval(() => {
    timerEl.textContent = `${Math.round((Date.now() - startedAt) / 1000)} ${t('checkSeconds')}`;
  }, 1000);
  // The router clears the DOM on navigation; stop ticking when this screen goes.
  new MutationObserver((_, obs) => {
    if (!document.body.contains(screen)) {
      clearInterval(timerId);
      obs.disconnect();
    }
  }).observe(document.getElementById('app')!, { childList: true, subtree: true });

  const grid = screen.querySelector('#grid')!;
  const tally = screen.querySelector('#tally')!;

  const seatBtn = (s: Student): HTMLElement => {
    const b = el(
      `<button class="seat" data-id="${s.id}" aria-pressed="false">
        <span class="seat-name">${esc(bi(s.name))}</span>
      </button>`
    );
    b.addEventListener('click', () => {
      if (marked.has(s.id)) {
        marked.delete(s.id);
        b.classList.remove('marked');
        b.setAttribute('aria-pressed', 'false');
      } else {
        marked.add(s.id);
        b.classList.add('marked');
        b.setAttribute('aria-pressed', 'true');
      }
      updateTally();
    });
    return b;
  };
  students.forEach((s) => grid.appendChild(seatBtn(s)));

  const updateTally = () => {
    const markedCount = marked.size;
    const otherCount = students.length - markedCount;
    const notCount = markingUnderstood ? otherCount : markedCount;
    const gotCount = students.length - notCount;
    tally.textContent = `${gotCount} ${t('understoodShort')} · ${notCount} ${t('notUnderstoodShort')}`;
  };
  updateTally();

  screen.querySelector('#flipBtn')!.addEventListener('click', () => {
    markingUnderstood = !markingUnderstood;
    screen.querySelector('#markLabel')!.textContent = markingUnderstood
      ? t('checkMarkingUnderstood')
      : t('checkMarkingNot');
    grid.classList.toggle('marking-understood', markingUnderstood);
    updateTally();
  });

  screen.querySelector('#confirmBtn')!.addEventListener('click', () => {
    clearInterval(timerId);
    const markedIds = [...marked];
    const otherIds = students.filter((s) => !marked.has(s.id)).map((s) => s.id);
    const understoodIds = markingUnderstood ? markedIds : otherIds;
    const notUnderstoodIds = markingUnderstood ? otherIds : markedIds;

    // Phase 2 — one optional extra tap: which wrong answer dominated?
    const wrongKeys = KEYS.filter((k) => !q.options[k].correct);
    const overlay = el(`
      <div class="overlay">
        <div class="overlay-card">
          <h3>${esc(t('checkWrongPick'))}</h3>
          <div class="wrong-opts">
            ${wrongKeys.map(
              (k) => `<button class="btn wrong-opt" data-k="${k}"><b>${k}</b> ${esc(bi(q.options[k].text))}</button>`
            ).join('')}
          </div>
          <button class="link-btn" id="skipWrong">${esc(t('checkSkip'))}</button>
        </div>
      </div>`);
    const finish = async (wrong: OptionKey | null) => {
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      const check: CheckRecord = {
        id: uid(),
        lessonId: lesson!.id,
        topicKey: lesson!.topicKey,
        topicLabel: lesson!.topicLabel,
        qIndex: qi,
        questionText: q.text,
        understoodIds,
        notUnderstoodIds,
        dominantWrong: wrong,
        misconception: wrong ? q.options[wrong].mis ?? null : null,
        durationSec,
        ts: Date.now(),
      };
      await saveCheck(check);
      go('/result?check=' + check.id);
    };
    overlay.querySelectorAll<HTMLElement>('[data-k]').forEach((b) =>
      b.addEventListener('click', () => finish(b.dataset.k as OptionKey))
    );
    overlay.querySelector('#skipWrong')!.addEventListener('click', () => finish(null));
    screen.appendChild(overlay);
  });
}
