// The child's own screen.
//
// This is what "send home" was missing. The teacher marks who did not get a
// question; the child opens the app at home and sees exactly that — their own
// lesson, the questions they personally missed, and the misconception named in
// their own language. Not a class list, not anyone else's marks: only theirs.
//
// It is a home screen by design (§5): the phone is the gate before class and
// the check after, never a device in the child's hands during a lesson (C1).
import { aiAvailable, aiErrorKey, aiExplainConcept } from '../ai';
import { allChecks, allLessons } from '../db';
import { getSettings } from '../db';
import { langDef, s } from '../packs';
import { currentStudent, getSession } from '../session';
import { isSpeaking, speak, stopSpeak } from '../speech';
import type { CheckRecord } from '../types';
import { el, esc, toast } from '../ui';

const DAY = 24 * 60 * 60 * 1000;

export async function renderStudent(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const session = await getSession();
  const me = await currentStudent();
  const settings = await getSettings();
  const L = settings.homeLang || settings.lang;
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

  const screen = el(`
    <div>
      <div class="who-strip">
        <span class="who-name">${esc(me.name.hi)}</span>
        <span class="who-meta">${esc(t('yourClass'))} ${me.grade} · ${esc(t('yourRoll'))} ${me.roll}</span>
      </div>

      ${todaysLesson ? `
        <h3>${esc(t('myLesson'))}</h3>
        <div class="paper">
          <p><b>${esc(todaysLesson.topicLabel.hi)}</b></p>
          ${todaysLesson.material.hi.slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join('')}
        </div>` : ''}

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
    gaps.appendChild(gapCard(check, L, t, speechLang));
  }
}

function gapCard(
  check: CheckRecord,
  L: string,
  t: (k: string) => string,
  speechLang: string
): HTMLElement {
  const card = el(`
    <div class="gap-card">
      <p class="gap-topic">${esc(check.topicLabel.hi)}</p>
      <p class="gap-q">${esc(check.questionText.hi)}</p>
      ${check.misconception
        ? `<p class="gap-mis">${esc(check.misconception.hi)}</p>`
        : ''}
      <div class="row">
        <button class="btn small" data-advice>💡 ${esc(t('getAdvice'))}</button>
      </div>
      <div class="advice"></div>
    </div>`);

  const advice = card.querySelector<HTMLElement>('.advice')!;
  const btn = card.querySelector<HTMLButtonElement>('[data-advice]')!;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = '…';
    try {
      let text: string;
      if (await aiAvailable()) {
        text = await aiExplainConcept(
          check.topicLabel.en,
          check.questionText.en,
          check.misconception?.en ?? '',
          langDef(L).english
        );
      } else {
        // Offline: the misconception itself, named plainly, plus the one
        // instruction that actually addresses it. Better than nothing and
        // honest about being brief.
        text = check.misconception
          ? `${check.misconception.hi}. ${check.questionText.hi}`
          : check.questionText.hi;
      }
      advice.innerHTML = `
        <div class="explain-box">
          <div class="row spread">
            <h3>${esc(t('whatToDo'))}</h3>
            <button class="btn small" data-listen>▶</button>
          </div>
          <p class="explain-text">${esc(text)}</p>
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
    } catch (err) {
      toast(t(aiErrorKey(err) === 'aiErrOffline' ? 'whatToDo' : 'whatToDo'));
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  return card;
}
