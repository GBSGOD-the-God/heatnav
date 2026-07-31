// Result: counts, the misconception in plain words (never the letter), the
// children named, and three one-tap actions — each choice is logged (§9).
import { allChecks, allStudents, getCheck, logAction, uid } from '../db';
import { bi, t } from '../i18n';
import type { CheckRecord, Student } from '../types';
import { el, esc, toast } from '../ui';

function pairUp(understood: Student[], not: Student[]): Array<[Student, Student]> {
  // Strongest helper with the child furthest behind; helpers repeat if needed.
  const helpers = [...understood].sort((a, b) => b.level - a.level);
  const learners = [...not].sort((a, b) => a.level - b.level);
  return learners.map((learner, i) => [helpers[i % Math.max(helpers.length, 1)], learner]);
}

export async function renderResult(root: HTMLElement, params: URLSearchParams): Promise<void> {
  root.innerHTML = '';
  const id = params.get('check');
  let check: CheckRecord | undefined = id ? await getCheck(id) : undefined;
  if (!check) check = (await allChecks()).find((c) => !c.sample);
  if (!check) {
    root.appendChild(el(`<div class="empty"><p>${esc(t('checkNoLesson'))}</p></div>`));
    return;
  }

  const students = await allStudents();
  const byId = new Map(students.map((s) => [s.id, s]));
  const notStudents = check.notUnderstoodIds.map((sid) => byId.get(sid)).filter((s): s is Student => !!s);
  const gotStudents = check.understoodIds.map((sid) => byId.get(sid)).filter((s): s is Student => !!s);
  const gotN = check.understoodIds.length;
  const notN = check.notUnderstoodIds.length;

  const screen = el(`
    <div>
      <h1>${esc(t('resultTitle'))}</h1>
      <p class="sub">${esc(bi(check.topicLabel))} — ${esc(bi(check.questionText))}</p>

      <div class="result-numbers">
        <div class="result-num got"><span class="n">${gotN}</span><span class="lbl">${esc(t('resultUnderstood'))}</span></div>
        <div class="result-num not"><span class="n">${notN}</span><span class="lbl">${esc(t('resultNot'))}</span></div>
      </div>

      ${check.misconception
        ? `<div class="mis-box"><span class="mis-intro">${esc(t('resultMisIntro'))}</span>
             <strong class="mis-text">${esc(bi(check.misconception))}</strong></div>`
        : `<p class="note">${esc(t('resultNoMis'))}</p>`}

      <p class="tiny">${esc(t('resultCaptured'))}: <b>${check.durationSec} ${esc(t('checkSeconds'))}</b>
        ${check.durationSec <= 60 ? ' ✓' : ''}</p>

      <h3>${esc(t('resultWho'))} (${notN})</h3>
      <div class="chips readonly">
        ${notStudents.map((s) => `<span class="chip name">${esc(bi(s.name))}</span>`).join('')}
      </div>

      <div class="actions">
        <button class="action-btn" data-act="pair">
          <strong>${esc(t('actPair'))}</strong><span>${esc(t('actPairSub'))}</span>
        </button>
        <button class="action-btn" data-act="home">
          <strong>${esc(t('actHome'))}</strong><span>${esc(t('actHomeSub'))}</span>
        </button>
        <button class="action-btn" data-act="reteach">
          <strong>${esc(t('actReteach'))}</strong><span>${esc(t('actReteachSub'))}</span>
        </button>
      </div>
      <div id="consequence"></div>
    </div>`);
  root.appendChild(screen);

  const consequence = screen.querySelector('#consequence')!;
  screen.querySelectorAll<HTMLElement>('[data-act]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const action = btn.dataset.act as 'pair' | 'home' | 'reteach';
      await logAction({ id: uid(), checkId: check!.id, action, ts: Date.now() });
      screen.querySelectorAll('.action-btn').forEach((b) => b.classList.remove('chosen'));
      btn.classList.add('chosen');
      toast(t('actDone'));

      if (action === 'pair') {
        const pairs = pairUp(gotStudents, notStudents);
        consequence.innerHTML = `
          <h3>${esc(t('pairTitle'))}</h3>
          <div class="paper pairs">
            ${pairs.map(
              ([h, l]) => `<div class="pair-row"><b>${esc(bi(h.name))}</b>
                <span class="pair-arrow">${esc(t('pairTeaches'))} →</span> ${esc(bi(l.name))}</div>`
            ).join('')}
          </div>`;
      } else if (action === 'home') {
        consequence.innerHTML = `
          <h3>${esc(t('actHome'))}</h3>
          <p class="note">${esc(t('homeQueued'))}</p>
          <div class="chips readonly">
            ${notStudents.map((s) => `<span class="chip name">${esc(bi(s.name))}</span>`).join('')}
          </div>`;
      } else {
        consequence.innerHTML = `<h3>${esc(t('actReteach'))}</h3><p class="note">${esc(t('reteachQueued'))}</p>`;
      }
      consequence.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
  );
}
