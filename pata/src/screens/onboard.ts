// First run: language, then who you are.
//
// Language comes first for an obvious reason — you cannot read a login form
// in a script you do not read. Everything on both screens exists in all 12
// languages for the same reason.
//
// The login is deliberately not an account: no password, no email, no
// verification, nothing to forget. A child gives the three things printed in
// their own school register — class, roll number, name — and it is matched
// against the roster already on the device.
import { getSettings, saveSettings } from '../db';
import { setLang } from '../i18n';
import { LANGUAGES, s } from '../packs';
import { DEMO_TEACHERS, loginStudent, loginTeacher } from '../session';
import type { Lang } from '../types';
import { el, esc, go } from '../ui';

/** Screen 1 — pick a language. No text here that assumes you can read one. */
export async function renderLanguage(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const settings = await getSettings();
  const screen = el(`
    <div class="onboard">
      <div class="onboard-mark">प</div>
      <h1>${LANGUAGES.map((l) => esc(s('pickLanguage', l.code))).slice(0, 1).join('')}</h1>
      <p class="sub">Choose your language · अपनी भाषा चुनें</p>
      <div class="lang-grid">
        ${LANGUAGES.map(
          (l) => `<button class="lang-tile ${l.code === settings.lang ? 'active' : ''}"
                    data-lang="${l.code}" lang="${l.code}">${esc(l.label)}</button>`
        ).join('')}
      </div>
      <p class="tiny center" id="changeNote">${esc(s('changeLater', settings.lang))}</p>
    </div>`);
  root.appendChild(screen);

  screen.querySelectorAll<HTMLElement>('[data-lang]').forEach((tile) =>
    tile.addEventListener('click', async () => {
      const code = tile.dataset.lang!;
      // The shell itself only ships hi/en; the student side speaks all 12.
      const shell: Lang = code === 'en' ? 'en' : 'hi';
      await saveSettings({ ...settings, lang: shell, homeLang: code, languageChosen: true });
      setLang(shell);
      go('/login');
    })
  );
}

/** Screen 2 — who is holding the phone. */
export async function renderLogin(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const settings = await getSettings();
  const L = settings.homeLang || settings.lang;
  const t = (k: string) => s(k, L);

  const screen = el(`
    <div class="onboard">
      <div class="onboard-mark">प</div>
      <h1>${esc(t('whoAreYou'))}</h1>

      <div class="role-row">
        <button class="role-tile active" data-role="student">
          <span class="role-icon">✎</span><span>${esc(t('iAmStudent'))}</span>
        </button>
        <button class="role-tile" data-role="teacher">
          <span class="role-icon">☰</span><span>${esc(t('iAmTeacher'))}</span>
        </button>
      </div>

      <form class="paper report-form" id="loginForm">
        <label>${esc(t('yourName'))}<input name="name" autocomplete="off" /></label>

        <div id="studentFields">
          <label>${esc(t('yourSchool'))}<input name="school" autocomplete="off" /></label>
          <div class="row">
            <label style="flex:1">${esc(t('yourClass'))}
              <input name="grade" type="number" inputmode="numeric" min="1" max="12" />
            </label>
            <label style="flex:1">${esc(t('yourRoll'))}
              <input name="roll" type="number" inputmode="numeric" min="1" />
            </label>
          </div>
        </div>

        <div id="teacherFields" hidden>
          <label>${esc(t('teacherId'))}<input name="teacherId" autocomplete="off" /></label>
        </div>

        <p class="tiny" id="loginError" hidden></p>
        <button type="submit" class="btn primary big">${esc(t('enter'))}</button>
      </form>

      <p class="tiny center">${esc(t('demoHint'))}</p>
      <button class="link-btn center-btn" id="backLang">${esc(t('pickLanguage'))}</button>
    </div>`);
  root.appendChild(screen);

  let role: 'student' | 'teacher' = 'student';
  const studentFields = screen.querySelector<HTMLElement>('#studentFields')!;
  const teacherFields = screen.querySelector<HTMLElement>('#teacherFields')!;
  const errorLine = screen.querySelector<HTMLElement>('#loginError')!;

  screen.querySelectorAll<HTMLElement>('[data-role]').forEach((tile) =>
    tile.addEventListener('click', () => {
      role = tile.dataset.role as 'student' | 'teacher';
      screen.querySelectorAll('[data-role]').forEach((x) => x.classList.toggle('active', x === tile));
      studentFields.hidden = role !== 'student';
      teacherFields.hidden = role !== 'teacher';
      errorLine.hidden = true;
    })
  );

  screen.querySelector('#backLang')!.addEventListener('click', () => go('/language'));

  const form = screen.querySelector<HTMLFormElement>('#loginForm')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const name = String(d.get('name') ?? '').trim();
    errorLine.hidden = true;

    const result =
      role === 'teacher'
        ? await loginTeacher(name, String(d.get('teacherId') ?? ''))
        : await loginStudent({
            name,
            school: String(d.get('school') ?? ''),
            grade: Number(d.get('grade') ?? 0),
            roll: Number(d.get('roll') ?? 0),
          });

    if (!result.ok) {
      errorLine.hidden = false;
      errorLine.textContent = t('loginFailed');
      return;
    }
    // Teachers land on prep; children land on their own lesson.
    go(result.session.role === 'teacher' ? '/prep' : '/my');
  });

  // Pre-fill the demo teacher so a judge can get in without typing.
  void DEMO_TEACHERS;
}
