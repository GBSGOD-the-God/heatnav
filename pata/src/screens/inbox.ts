// What came back from the children.
//
// This is the other end of "send home": the teacher marked who did not get it,
// the child practised at home, and this is where she finds out how that went —
// per child, by name, never as a class average (C4).
//
// A score alone would be close to useless. What is shown first is the
// misconception the child kept picking, because that is what she can teach
// tomorrow. "3 of 5" tells her nothing she can act on; "still taking the
// smaller digit from the larger" tells her exactly what to put on the board.
import { allResults, markResultsSeen } from '../db';
import { t, translate } from '../i18n';
import { MAX_LEVEL } from '../quiz';
import type { Bi, QuizResult } from '../types';
import { el, esc } from '../ui';

/** The misconception a child hit most often in one attempt, if any. */
function dominant(r: QuizResult): Bi | null {
  const counts = new Map<string, { n: number; mis: Bi }>();
  for (const a of r.answers) {
    if (!a.misconception) continue;
    const k = a.misconception.en;
    counts.set(k, { n: (counts.get(k)?.n ?? 0) + 1, mis: a.misconception });
  }
  return [...counts.values()].sort((x, y) => y.n - x.n)[0]?.mis ?? null;
}

export async function renderInbox(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const results = await allResults();

  const screen = el(`
    <div>
      <h1>${esc(t('inboxTitle'))}</h1>
      <p class="sub">${esc(t('inboxSub'))}</p>
      <div id="list"></div>
    </div>`);
  root.appendChild(screen);

  const list = screen.querySelector('#list')!;
  if (!results.length) {
    list.innerHTML = `<div class="empty"><p>${esc(t('inboxEmpty'))}</p></div>`;
    return;
  }

  list.innerHTML = `<div class="list">${results.map((r) => {
    const mis = dominant(r);
    const strong = r.correct >= 4;
    return `<div class="list-item static ${r.seen ? '' : 'fresh'}">
      <div class="row spread">
        <strong>${esc(translate(r.studentName))}</strong>
        <span class="quiz-score-chip ${strong ? 'good' : ''}">${r.correct}/${r.total}</span>
      </div>
      <span class="meta">${esc(translate(r.topicLabel))}</span>
      <span class="meta tiny">${esc(t('inboxReached'))} ${r.peakLevel || 1}/${MAX_LEVEL} · ${new Date(r.ts).toLocaleDateString()}</span>
      ${mis ? `<span class="mis-text">${esc(t('misLabel'))}: ${esc(translate(mis))}</span>` : ''}
    </div>`;
  }).join('')}</div>`;

  // Opening the screen IS reading them; the badge is a prompt, not a task list.
  // Only tell the shell when something actually changed — the badge lives
  // outside this screen, and redrawing it redraws this screen too.
  if (await markResultsSeen()) window.dispatchEvent(new Event('pata:results'));
}
