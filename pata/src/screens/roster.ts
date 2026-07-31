// Roster quick-entry: one name per line, 38 names in well under 5 minutes.
// Grades and ability levels keep the seeded spread (C4) by position.
import { allStudents, replaceRoster } from '../db';
import { bi, getLang, t } from '../i18n';
import { buildRoster } from '../seed';
import { el, esc, go, toast } from '../ui';

export async function renderRoster(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const students = await allStudents();
  const lang = getLang();
  const names = students.map((s) => bi(s.name)).join('\n');

  const screen = el(`
    <div>
      <h1>${esc(t('rosterTitle'))}</h1>
      <p class="sub">${esc(t('rosterHint'))}</p>
      <p class="tiny"><b id="count">${students.length}</b> ${esc(t('rosterCount'))}</p>
      <textarea id="names" class="paper roster-area" rows="14" spellcheck="false">${esc(names)}</textarea>
      <div class="row">
        <button class="btn primary big" id="saveBtn">${esc(t('rosterSave'))}</button>
        <button class="btn ghost" id="backBtn">${esc(t('back'))}</button>
      </div>
    </div>`);
  root.appendChild(screen);

  const area = screen.querySelector<HTMLTextAreaElement>('#names')!;
  const count = screen.querySelector('#count')!;
  area.addEventListener('input', () => {
    count.textContent = String(area.value.split('\n').filter((line) => line.trim()).length);
  });

  screen.querySelector('#backBtn')!.addEventListener('click', () => history.back());
  screen.querySelector('#saveBtn')!.addEventListener('click', async () => {
    const lines = area.value.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;
    const roster = buildRoster(
      lines.map((name, i) => {
        const existing = students[i];
        const other = existing ? existing.name[lang === 'hi' ? 'en' : 'hi'] : name;
        return lang === 'hi' ? [name, existing && bi(existing.name) === name ? other : name] : [existing && bi(existing.name) === name ? other : name, name];
      })
    );
    await replaceRoster(roster);
    toast(t('rosterSaved'));
    go('/prep');
  });
}
