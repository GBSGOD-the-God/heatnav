// The child's own screen.
//
// This is what "send home" was missing. The teacher marks who did not get a
// question; the child opens the app at home and sees exactly that — their own
// lesson, the questions they personally missed, and the misconception named in
// their own language. Not a class list, not anyone else's marks: only theirs.
//
// It is a home screen by design (§5): the phone is the gate before class and
// the check after, never a device in the child's hands during a lesson (C1).
//
// Everything the app says is in the child's own language. Content the teacher
// typed may not be — a lesson drafted on the spot exists only in the language
// it was drafted in — so it is read through translate(), which falls back
// honestly, and the screen says when it had to.
import { aiAvailable, aiExplainConcept } from '../ai';
import { allChecks, allLessons, assignmentsFor } from '../db';
import { getSettings } from '../db';
import { conceptFor, langDef } from '../packs';
import { getLang, isFallback, t, translate, translateList } from '../i18n';
import { currentStudent, getSession } from '../session';
import { pullAssignments, pushPending } from '../sync';
import { isReading, readAloud, stopReading } from '../voice';
import type { Bi, Lang } from '../types';
import { el, esc, go } from '../ui';

const DAY = 24 * 60 * 60 * 1000;

export async function renderStudent(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const session = await getSession();
  const me = await currentStudent();
  await getSettings();
  const L = getLang();
  const speechLang = langDef(L).speech;

  if (!me || !session) {
    root.appendChild(el(`<div class="empty"><p>${esc(t('loginFailed'))}</p></div>`));
    return;
  }

  // Anything the teacher sent from her own phone. Best-effort and quick to
  // fail: on a shared device there is nothing to fetch, and offline this
  // returns immediately. Also flush any result that could not be handed over
  // last time — a child's score should not sit on their phone forever because
  // the network happened to be down the moment they finished.
  void pullAssignments(me.school, me.id).then((n) => { if (n) void renderStudent(root); });
  void pushPending(me.school);

  const checks = await allChecks();
  const lessons = await allLessons();

  // Only this child's results, only recent. A child never sees a classmate.
  const mine = checks.filter(
    (c) => c.ts > Date.now() - 3 * DAY &&
      (c.notUnderstoodIds.includes(me.id) || c.understoodIds.includes(me.id))
  );

  /**
   * What this child has to work on, from either direction.
   *
   * On a shared phone it comes from the check record itself. On their own
   * phone that record does not exist — the check happened on the teacher's
   * device — so it comes from the assignment she sent. Same card either way,
   * de-duplicated by the check it came from.
   */
  const gaps: Gap[] = mine
    .filter((c) => c.notUnderstoodIds.includes(me.id))
    .map((c) => ({
      key: c.id,
      topicKey: c.topicKey,
      topicLabel: c.topicLabel,
      questionText: c.questionText,
      misconception: c.misconception,
    }));
  const seen = new Set(gaps.map((g) => g.key));
  for (const a of await assignmentsFor(me.id)) {
    if (a.createdAt < Date.now() - 3 * DAY || seen.has(a.checkId)) continue;
    seen.add(a.checkId);
    gaps.push({
      key: a.checkId || a.id,
      topicKey: a.topicKey,
      topicLabel: a.topicLabel,
      questionText: a.questionText,
      misconception: a.misconception,
    });
  }

  const todaysLesson = lessons[0] ?? null;

  // Say it plainly when the teacher's own text is not in the child's language.
  const scriptNote =
    todaysLesson && isFallback(todaysLesson.material)
      ? `<p class="tiny">${esc(t('teacherScript'))}</p>`
      : '';

  const screen = el(`
    <div>
      <div class="who-strip">
        <span class="who-name">${esc(translate(me.name))}</span>
        <span class="who-meta">${esc(t('yourClass'))} ${me.grade} · ${esc(t('yourRoll'))} ${me.roll}</span>
      </div>

      ${todaysLesson ? `
        <h3>${esc(t('myLesson'))}</h3>
        <div class="paper">
          <p><b>${esc(translate(todaysLesson.topicLabel))}</b></p>
          ${translateList(todaysLesson.material).slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join('')}
        </div>
        ${scriptNote}` : ''}

      <h3>${esc(t('myGaps'))}</h3>
      <div id="gaps"></div>
    </div>`);
  root.appendChild(screen);

  const holder = screen.querySelector('#gaps')!;

  if (!gaps.length) {
    holder.innerHTML = `<p class="verdict good">✓ ${esc(t('noGaps'))}</p>`;
    return;
  }

  for (const gap of gaps) {
    holder.appendChild(gapCard(gap, L, speechLang));
  }
}

/** One thing to work on, whichever device the record reached us from. */
interface Gap {
  key: string;
  topicKey: string;
  topicLabel: Bi;
  questionText: Bi | null;
  misconception: Bi | null;
}

function gapCard(check: Gap, L: Lang, speechLang: string): HTMLElement {
  const card = el(`
    <div class="gap-card">
      <p class="gap-topic">${esc(translate(check.topicLabel))}</p>
      <p class="gap-q">${esc(translate(check.questionText))}</p>
      ${check.misconception
        ? `<p class="gap-mis">${esc(translate(check.misconception))}</p>`
        : ''}
      <div class="row">
        <button class="btn small" data-advice>💡 ${esc(t('getAdvice'))}</button>
      </div>
      <div class="advice"></div>
    </div>`);

  const advice = card.querySelector<HTMLElement>('.advice')!;
  const btn = card.querySelector<HTMLButtonElement>('[data-advice]')!;

  /**
   * What the app can say entirely on its own. For the topics it ships with
   * this is a full explanation in the child's own language — the network is
   * not what makes those twelve languages work. For anything else it is the
   * misconception named plus the question, which is short but true.
   */
  const offlineAdvice = (): string => {
    const concept = conceptFor(check.topicKey);
    const own = concept?.explain[L];
    if (own) return own;
    return check.misconception
      ? `${translate(check.misconception)}. ${translate(check.questionText)}`
      : translate(check.questionText);
  };

  const show = (text: string, offline: boolean) => {
    advice.innerHTML = `
      <div class="explain-box">
        <div class="row spread">
          <h3>${esc(t('whatToDo'))}</h3>
          <button class="btn small" data-listen>▶</button>
        </div>
        <p class="explain-text">${esc(text)}</p>
        ${offline ? `<p class="tiny">${esc(t('adviceOffline'))}</p>` : ''}
        <button class="btn primary big" data-quiz>${esc(t('understoodQuiz'))}</button>
      </div>`;

    // Reading an explanation is not the same as having understood it, and a
    // child cannot tell the difference from the inside. Five questions can.
    advice.querySelector('[data-quiz]')!.addEventListener('click', () => {
      // Pass the check's id, not its label. A URL can only carry the two
      // languages we would think to put in it, and the result would then be
      // filed under an English topic name on a Malayalam screen.
      const q = new URLSearchParams({
        topic: check.topicKey,
        check: check.key,
        seed: String(Date.now()),
      });
      go('/quiz?' + q.toString());
    });
    const listen = advice.querySelector<HTMLButtonElement>('[data-listen]')!;
    listen.addEventListener('click', () => {
      if (isReading()) {
        stopReading();
        listen.textContent = '▶';
      } else {
        void readAloud(text, L, speechLang);
        listen.textContent = '⏹';
      }
    });
  };

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = '…';
    try {
      let text = '';
      if (await aiAvailable()) {
        try {
          text = await aiExplainConcept(
            check.topicLabel.en,
            check.questionText?.en ?? '',
            check.misconception?.en ?? '',
            langDef(L).english
          );
        } catch {
          // A server that is unset, unreachable, rate limited, or simply older
          // than the /advise route must not leave the child with nothing —
          // this button is the whole point of the screen. Fall through.
          text = '';
        }
      }
      if (text.trim()) show(text, false);
      else show(offlineAdvice(), true);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  return card;
}
