import './style.css';
import { getSettings, saveSettings } from './db';
import { getLang, setLang, t } from './i18n';
import { ensureSeeded } from './seed';
import { el, esc, go } from './ui';
import { renderPrep } from './screens/prep';
import { renderCheck } from './screens/check';
import { renderResult } from './screens/result';
import { renderHome } from './screens/home';
import { renderReport } from './screens/report';
import { renderInsight } from './screens/insight';
import { renderRoster } from './screens/roster';
import { renderSettings } from './screens/settings';
import { renderLanguage, renderLogin } from './screens/onboard';
import { renderStudent } from './screens/student';
import { renderWrite } from './screens/write';
import { getSession, signOut } from './session';
import { s as pack } from './packs';
import { stopSpeak } from './speech';

type Renderer = (root: HTMLElement, params: URLSearchParams) => Promise<void> | void;

const ROUTES: Record<string, Renderer> = {
  prep: renderPrep,
  check: renderCheck,
  result: renderResult,
  home: renderHome,
  report: renderReport,
  insight: renderInsight,
  roster: renderRoster,
  settings: renderSettings,
  language: renderLanguage,
  login: renderLogin,
  my: renderStudent,
  write: renderWrite,
};

/** Screens each role is allowed to open. A child must never reach the class's
 *  marks, and the teacher's screens are no use to them (§5). */
const TEACHER_SCREENS = ['prep', 'check', 'result', 'insight', 'report', 'home', 'roster', 'settings', 'write'];
const STUDENT_SCREENS = ['my', 'home', 'write', 'settings'];

const TEACHER_NAV: Array<[string, string, string]> = [
  ['prep', 'navPrep', '✎'],
  ['check', 'navCheck', '✓'],
  ['insight', 'navInsight', '☰'],
  ['report', 'navReport', '✉'],
  ['home', 'navHome', '⌂'],
];

/** The child's app is three things, not eight. */
const STUDENT_NAV: Array<[string, string, string]> = [
  ['my', 'navMy', '★'],
  ['home', 'navHome', '⌂'],
  ['write', 'navWrite', '✎'],
];

function parseHash(): { screen: string; params: URLSearchParams } {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  return { screen: path, params: new URLSearchParams(query) };
}

async function render(): Promise<void> {
  stopSpeak();
  const { screen, params } = parseHash();

  const app = document.getElementById('app')!;
  app.innerHTML = '';
  const main = el('<main class="screen"></main>');

  const settings = await getSettings();
  const session = await getSession();

  // --- gates, in order ---
  // 1. Language first: you cannot read a login form in a script you don't read.
  if (!settings.languageChosen) {
    app.appendChild(main);
    await renderLanguage(main);
    return;
  }
  // 2. Then who you are. No chrome on these screens — nothing to navigate to yet.
  if (!session) {
    app.appendChild(main);
    await (screen === 'language' ? renderLanguage : renderLogin)(main);
    return;
  }

  const isTeacher = session.role === 'teacher';
  const allowed = isTeacher ? TEACHER_SCREENS : STUDENT_SCREENS;
  const home = isTeacher ? 'prep' : 'my';

  // Let someone re-pick their language without signing out.
  if (screen === 'language') {
    app.appendChild(main);
    await renderLanguage(main);
    return;
  }

  // A child who lands on a teacher screen goes to their own, not an error.
  const target = allowed.includes(screen) ? screen : home;
  const renderer = ROUTES[target] ?? (isTeacher ? renderPrep : renderStudent);

  const L = settings.homeLang || settings.lang;
  const header = el(`
    <header class="topbar">
      <button class="brand" id="brandBtn" aria-label="PATA">
        <span class="brand-mark">प</span>
        <span class="brand-name">${esc(t('appName'))}</span>
      </button>
      ${isTeacher ? `<span class="sample-badge">${esc(t('sampleBadge'))}</span>` : ''}
      <div class="topbar-actions">
        <button class="icon-btn" id="langBtn" aria-label="${esc(t('settingsLang'))}">${getLang() === 'hi' ? 'En' : 'हि'}</button>
        ${isTeacher ? `<button class="icon-btn" id="rosterBtn" aria-label="${esc(t('rosterTitle'))}">☷</button>` : ''}
        <button class="icon-btn" id="settingsBtn" aria-label="${esc(t('settingsTitle'))}">⚙</button>
        <button class="icon-btn" id="outBtn" aria-label="${esc(pack('signOut', L))}">⏻</button>
      </div>
    </header>`);
  header.querySelector('#brandBtn')!.addEventListener('click', () => go('/' + home));
  header.querySelector('#rosterBtn')?.addEventListener('click', () => go('/roster'));
  header.querySelector('#settingsBtn')!.addEventListener('click', () => go('/settings'));
  header.querySelector('#outBtn')!.addEventListener('click', async () => {
    await signOut();
    go('/login');
    render();
  });
  header.querySelector('#langBtn')!.addEventListener('click', async () => {
    const cur = await getSettings();
    cur.lang = cur.lang === 'hi' ? 'en' : 'hi';
    await saveSettings(cur);
    setLang(cur.lang);
    render();
  });
  app.appendChild(header);
  app.appendChild(main);

  const navScreen =
    target === 'result' ? 'check' : ['roster', 'settings'].includes(target) ? '' : target;
  const NAV = isTeacher ? TEACHER_NAV : STUDENT_NAV;
  const nav = el(
    `<nav class="bottombar">${NAV.map(
      ([key, label, icon]) =>
        `<button class="nav-item ${key === navScreen ? 'active' : ''}" data-nav="${key}">
          <span class="nav-icon">${icon}</span><span>${esc(isTeacher ? t(label) : pack(label, L))}</span>
        </button>`
    ).join('')}</nav>`
  );
  nav.querySelectorAll<HTMLElement>('[data-nav]').forEach((b) =>
    b.addEventListener('click', () => go('/' + b.dataset.nav))
  );
  app.appendChild(nav);

  await renderer(main, params);
  main.scrollTop = 0;
}

async function boot(): Promise<void> {
  await ensureSeeded();
  const settings = await getSettings();
  setLang(settings.lang);
  window.addEventListener('hashchange', render);
  await render();
}

boot();
