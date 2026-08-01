import { aiAvailable, aiErrorKey, aiGenerateLesson } from '../ai';
import { BANK, findBankTopic } from '../bank';
import { langDef } from '../packs';
import { allActions, allChecks, allLessons, saveLesson } from '../db';
import { generateLesson } from '../generator';
import { bi, getLang, t, translate, translateList } from '../i18n';
import { canListen, listen } from '../speech';
import type { Lesson, OptionKey, Question } from '../types';
import { el, esc, go, toast } from '../ui';

const KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

/** Shuffle options so the correct answer is not always in the same slot —
 *  children answering by hand would catch a fixed pattern in one day. */
function shuffleOptions(q: Question): void {
  const entries = KEYS.map((k) => q.options[k]);
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  KEYS.forEach((k, i) => (q.options[k] = entries[i]));
}

function questionCard(lesson: Lesson, qi: number): HTMLElement {
  const q = lesson.questions[qi];
  const lang = getLang();
  const card = el(`
    <div class="q-card" data-qi="${qi}">
      <div class="q-head"><span class="q-num">${qi + 1}</span><span class="q-text">${esc(bi(q.text))}</span></div>
      <div class="q-opts">
        ${KEYS.map((k) => {
          const o = q.options[k];
          return `<div class="q-opt ${o.correct ? 'is-correct' : ''}">
            <span class="opt-key">${k}</span>
            <span class="opt-text">${esc(bi(o.text))}</span>
            ${o.correct
              ? `<span class="opt-tag correct">${esc(t('correctLabel'))}</span>`
              : o.mis
                ? `<span class="opt-tag mis">${esc(bi(o.mis))}</span>`
                : ''}
          </div>`;
        }).join('')}
      </div>
      <button class="link-btn edit-btn">${esc(t('prepEditHint'))}</button>
      <form class="q-edit" hidden>
        <label>${qi + 1}. <input name="qtext" value="${esc(translate(q.text, lang))}" /></label>
        ${KEYS.map(
          (k) => `<label><span class="opt-key">${k}</span><input name="opt${k}" value="${esc(translate(q.options[k].text, lang))}" /></label>`
        ).join('')}
        <div class="row">
          <button type="submit" class="btn small">${esc(t('save'))}</button>
          <button type="button" class="btn small ghost cancel-btn">${esc(t('cancel'))}</button>
        </div>
      </form>
    </div>`);
  const form = card.querySelector('form')!;
  card.querySelector('.edit-btn')!.addEventListener('click', () => (form.hidden = !form.hidden));
  card.querySelector('.cancel-btn')!.addEventListener('click', () => (form.hidden = true));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    q.text[lang] = String(data.get('qtext') || q.text[lang]);
    for (const k of KEYS) q.options[k].text[lang] = String(data.get('opt' + k) || q.options[k].text[lang]);
    await saveLesson(lesson);
    card.replaceWith(questionCard(lesson, qi));
  });
  return card;
}

function lessonView(root: HTMLElement, lesson: Lesson): void {
  const holder = root.querySelector('#lessonHolder')!;
  holder.innerHTML = '';
  const view = el(`
    <section class="lesson">
      <div class="lesson-head">
        <h2>${esc(bi(lesson.topicLabel))}</h2>
        <span class="meta">${esc(bi(lesson.subject))} · ${esc(t('grade'))} ${esc(lesson.gradeBand)}
          · ${esc(lesson.source === 'ai' ? t('aiSourceTag') : t('bankSourceTag'))}</span>
      </div>
      ${lesson.source === 'draft' ? `<p class="note">${esc(t('prepDraftNote'))}</p>` : ''}
      <h3>${esc(t('prepMaterial'))}</h3>
      <div class="paper">
        ${translateList(lesson.material).map((para) => `<p>${esc(para)}</p>`).join('')}
      </div>
      <h3>${esc(t('prepQuestions'))}</h3>
      <div id="qList"></div>
      <button class="btn primary big" id="startCheck">${esc(t('prepStartCheck'))}</button>
    </section>`);
  const qList = view.querySelector('#qList')!;
  lesson.questions.forEach((_, qi) => qList.appendChild(questionCard(lesson, qi)));
  view.querySelector('#startCheck')!.addEventListener('click', () => go('/check?lesson=' + lesson.id));
  holder.appendChild(view);
  view.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Checks the teacher flagged "reteach" — they surface on top of tomorrow's prep. */
async function reteachBanner(): Promise<HTMLElement | null> {
  const [actions, checks] = await Promise.all([allActions(), allChecks()]);
  const flagged = actions
    .filter((a) => a.action === 'reteach')
    .map((a) => checks.find((c) => c.id === a.checkId))
    .filter((c) => !!c)
    .slice(0, 3);
  if (!flagged.length) return null;
  return el(`
    <section class="reteach-banner">
      <h3>${esc(t('actReteach'))}</h3>
      ${flagged
        .map(
          (c) => `<div class="reteach-item">
            <strong>${esc(bi(c!.topicLabel))}</strong>
            <span>${c!.notUnderstoodIds.length} ${esc(t('notUnderstoodShort'))}${
              c!.misconception ? ' — ' + esc(bi(c!.misconception)) : ''
            }</span>
          </div>`
        )
        .join('')}
    </section>`);
}

export async function renderPrep(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const screen = el(`
    <div>
      <h1>${esc(t('prepTitle'))}</h1>
      <p class="sub">${esc(t('prepHint'))}</p>
      <div id="banner"></div>
      <div class="input-row">
        <input id="topicInput" class="topic-input" placeholder="${esc(t('prepPlaceholder'))}" />
        <button class="btn ghost" id="speakBtn">🎤 ${esc(t('prepSpeak'))}</button>
      </div>
      <p class="tiny" id="voiceNote">${esc(t('voiceFallbackNote'))}</p>
      <button class="btn primary big" id="genBtn">${esc(t('prepGenerate'))}</button>
      <p class="sub small">${esc(t('prepQuickPick'))}</p>
      <div class="chips">
        ${BANK.map((b) => `<button class="chip" data-key="${b.key}">${esc(bi(b.label))}</button>`).join('')}
      </div>
      <div id="lessonHolder"></div>
      <div id="recent"></div>
    </div>`);
  root.appendChild(screen);

  const banner = await reteachBanner();
  if (banner) screen.querySelector('#banner')!.appendChild(banner);

  const input = screen.querySelector<HTMLInputElement>('#topicInput')!;
  const voiceNote = screen.querySelector('#voiceNote')!;

  const genBtn = screen.querySelector<HTMLButtonElement>('#genBtn')!;

  const makeLesson = async (topic: string) => {
    if (!topic.trim()) return;
    let lesson = null;
    // Real AI when there's a key + internet (except bank topics picked offline-style,
    // which are instant either way); on-device bank/draft otherwise — never blocked.
    if ((await aiAvailable()) && !findBankTopic(topic)) {
      genBtn.disabled = true;
      genBtn.textContent = t('aiGenerating');
      try {
        lesson = await aiGenerateLesson(topic);
      } catch (err) {
        toast(t(aiErrorKey(err)));
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = t('prepGenerate');
      }
    }
    if (!lesson) {
      lesson = generateLesson(topic);
      lesson.questions.forEach(shuffleOptions);
    }
    await saveLesson(lesson);
    toast(t('prepSaved'));
    lessonView(root, lesson);
  };

  screen.querySelector('#genBtn')!.addEventListener('click', () => makeLesson(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') makeLesson(input.value);
  });

  screen.querySelector('#speakBtn')!.addEventListener('click', async () => {
    if (!canListen()) {
      voiceNote.textContent = t('homeVoiceUnavailable');
      input.focus();
      return;
    }
    voiceNote.textContent = t('prepListening');
    try {
      const heard = await listen(langDef(getLang()).speech);
      input.value = heard;
      voiceNote.textContent = t('voiceFallbackNote');
      makeLesson(heard);
    } catch {
      voiceNote.textContent = t('homeVoiceUnavailable');
      input.focus();
    }
  });

  screen.querySelectorAll<HTMLElement>('.chip[data-key]').forEach((chip) =>
    chip.addEventListener('click', () => {
      const bankTopic = BANK.find((b) => b.key === chip.dataset.key)!;
      input.value = bi(bankTopic.label);
      makeLesson(bi(bankTopic.label));
    })
  );

  const lessons = await allLessons();
  if (lessons.length) {
    const recent = el(`
      <section>
        <h3>${esc(t('prepRecent'))}</h3>
        <div class="list">
          ${lessons.slice(0, 5).map(
            (l) => `<button class="list-item" data-id="${l.id}">
              <strong>${esc(bi(l.topicLabel))}</strong>
              <span class="meta">${new Date(l.createdAt).toLocaleDateString()}</span>
            </button>`
          ).join('')}
        </div>
      </section>`);
    recent.querySelectorAll<HTMLElement>('[data-id]').forEach((b) =>
      b.addEventListener('click', () => {
        const found = lessons.find((l) => l.id === b.dataset.id);
        if (found) lessonView(root, found);
      })
    );
    screen.querySelector('#recent')!.appendChild(recent);
  }
}
