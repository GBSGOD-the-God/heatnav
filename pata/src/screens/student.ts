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
// Two languages are at work here and they are not the same one:
//   L  — the language the child chose. Everything the APP says is in L, all
//        twelve of them, including the explanation when a topic is one the
//        app knows.
//   C  — the script the teacher's own words are stored in, which the data
//        model only carries in two. When C is not L the screen says so
//        instead of quietly serving Hindi to a child who reads Tamil.
import { aiAvailable, aiExplainConcept } from '../ai';
import { allChecks, allLessons } from '../db';
import { getSettings } from '../db';
import { conceptFor, contentScript, langDef, s, type L as PackLang } from '../packs';
import { currentStudent, getSession } from '../session';
import { isSpeaking, speak, stopSpeak } from '../speech';
import type { CheckRecord } from '../types';
import { el, esc } from '../ui';

const DAY = 24 * 60 * 60 * 1000;

export async function renderStudent(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const session = await getSession();
  const me = await currentStudent();
  const settings = await getSettings();
  const L = settings.homeLang || settings.lang;
  const C = contentScript(L);
  const t = (k: string) => s(k, L);
  const speechLang = langDef(L).speech;

  if (!me || !session) {
    root.appendChild(el(`<div class="empty"><p>${esc(t('loginFailed'))}</p></div>`));
    return;
  }

  const checks = await allChecks();
  const lessons = await allLessons();

  // Only this child's results, only recent. A child never sees a classmate.
  const mine = checks.filter(
    (c) => c.ts > Date.now() - 3 * DAY &&
      (c.notUnderstoodIds.includes(me.id) || c.understoodIds.includes(me.id))
  );
  const missed = mine.filter((c) => c.notUnderstoodIds.includes(me.id));
  const todaysLesson = lessons[0] ?? null;

  // Say it plainly when the stored text is not in the child's own language.
  const scriptNote = C === L ? '' : `<p class="tiny">${esc(t('teacherScript'))}</p>`;

  const screen = el(`
    <div>
      <div class="who-strip">
        <span class="who-name">${esc(me.name[C])}</span>
        <span class="who-meta">${esc(t('yourClass'))} ${me.grade} · ${esc(t('yourRoll'))} ${me.roll}</span>
      </div>

      ${todaysLesson ? `
        <h3>${esc(t('myLesson'))}</h3>
        <div class="paper">
          <p><b>${esc(todaysLesson.topicLabel[C])}</b></p>
          ${todaysLesson.material[C].slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join('')}
        </div>
        ${scriptNote}` : ''}

      <h3>${esc(t('myGaps'))}</h3>
      <div id="gaps"></div>
    </div>`);
  root.appendChild(screen);

  const gaps = screen.querySelector('#gaps')!;

  if (!missed.length) {
    gaps.innerHTML = `<p class="verdict good">✓ ${esc(t('noGaps'))}</p>`;
    return;
  }

  for (const check of missed) {
    gaps.appendChild(gapCard(check, L, C, t, speechLang));
  }
}

function gapCard(
  check: CheckRecord,
  L: string,
  C: 'hi' | 'en',
  t: (k: string) => string,
  speechLang: string
): HTMLElement {
  const card = el(`
    <div class="gap-card">
      <p class="gap-topic">${esc(check.topicLabel[C])}</p>
      <p class="gap-q">${esc(check.questionText[C])}</p>
      ${check.misconception
        ? `<p class="gap-mis">${esc(check.misconception[C])}</p>`
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
    const own = concept?.explain[L as PackLang];
    if (own) return own;
    return check.misconception
      ? `${check.misconception[C]}. ${check.questionText[C]}`
      : check.questionText[C];
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
      </div>`;
    const listen = advice.querySelector<HTMLButtonElement>('[data-listen]')!;
    listen.addEventListener('click', () => {
      if (isSpeaking()) {
        stopSpeak();
        listen.textContent = '▶';
      } else {
        speak(text, speechLang);
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
            check.questionText.en,
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
