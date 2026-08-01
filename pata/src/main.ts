import './style.css';
import { getSettings } from './db';
import { setLang, t } from './i18n';
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
// No Settings for the child: it configures a district's AI server, which is
// not theirs to set. The address is stored per device, so the teacher setting
// it once covers the child on the same phone.
const STUDENT_SCREENS = ['my', 'home', 'write'];

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

/**
 * Renders overlap. Signing out changes the hash AND the session, so two runs
 * of render() can be in flight at once; both read the database, both wake up,
 * and both append their own header/main/nav — which is the screen appearing
 * twice. Two things stop that: every run takes a ticket and abandons itself if
 * a newer one has started, and the screen is only ever installed with one
 * atomic replaceChildren() rather than cleared first and filled in later.
 */
let renderTicket = 0;

async function render(): Promise<void> {
  const ticket = ++renderTicket;
  stopSpeak();
  const { screen, params } = parseHash();

  const app = document.getElementById('app')!;
  const main = el('<main class="screen"></main>');

  const settings = await getSettings();
  const session = await getSession();
  if (ticket !== renderTicket) return; // a newer render started while we waited

  // --- gates, in order ---
  // 1. Language first: you cannot read a login form in a script you don't read.
  if (!settings.languageChosen) {
    app.replaceChildren(main);
    await renderLanguage(main);
    return;
  }
  // 2. Then who you are. No chrome on these screens — nothing to navigate to yet.
  if (!session) {
    app.replaceChildren(main);
    await (screen === 'language' ? renderLanguage : renderLogin)(main);
    return;
  }

  const isTeacher = session.role === 'teacher';
  const allowed = isTeacher ? TEACHER_SCREENS : STUDENT_SCREENS;
  const home = isTeacher ? 'prep' : 'my';

  // Let someone re-pick their language without signing out.
  if (screen === 'language') {
    app.replaceChildren(main);
    await renderLanguage(main);
    return;
  }

  // A child who lands on a teacher screen goes to their own, not an error.
  const target = allowed.includes(screen) ? screen : home;
  const renderer = ROUTES[target] ?? (isTeacher ? renderPrep : renderStudent);

  const header = el(`
    <header class="topbar">
      <button class="brand" id="brandBtn" aria-label="PATA">
        <span class="brand-mark">प</span>
        <span class="brand-name">${esc(t('appName'))}</span>
      </button>
      ${isTeacher ? `<span class="sample-badge">${esc(t('sampleBadge'))}</span>` : ''}
      <div class="topbar-actions">
        <button class="icon-btn" id="langBtn" aria-label="${esc(t('pickLanguage'))}">🌐</button>
        ${isTeacher ? `<button class="icon-btn" id="rosterBtn" aria-label="${esc(t('rosterTitle'))}">☷</button>` : ''}
        ${isTeacher ? `<button class="icon-btn" id="settingsBtn" aria-label="${esc(t('settingsTitle'))}">⚙</button>` : ''}
        <button class="icon-btn" id="outBtn" aria-label="${esc(t('signOut'))}">⏻</button>
      </div>
    </header>`);
  header.querySelector('#brandBtn')!.addEventListener('click', () => go('/' + home));
  header.querySelector('#rosterBtn')?.addEventListener('click', () => go('/roster'));
  header.querySelector('#settingsBtn')?.addEventListener('click', () => go('/settings'));
  header.querySelector('#outBtn')!.addEventListener('click', async () => {
    await signOut();
    // go() only redraws by way of hashchange, which does not fire if we are
    // already on that hash. Render directly in that one case instead of always
    // — rendering twice is what put two screens on top of each other.
    if (location.hash === '#/login') void render();
    else go('/login');
  });
  // One button, one meaning, for both roles: choose from all twelve. It used
  // to be a Hindi/English toggle for the teacher, which is precisely why her
  // language appeared to reset the moment she left the screen that honoured
  // her real choice.
  header.querySelector('#langBtn')!.addEventListener('click', () => go('/language'));

  const navScreen =
    target === 'result' ? 'check' : ['roster', 'settings'].includes(target) ? '' : target;
  const NAV = isTeacher ? TEACHER_NAV : STUDENT_NAV;
  const nav = el(
    `<nav class="bottombar">${NAV.map(
      ([key, label, icon]) =>
        `<button class="nav-item ${key === navScreen ? 'active' : ''}" data-nav="${key}">
          <span class="nav-icon">${icon}</span><span>${esc(t(label))}</span>
        </button>`
    ).join('')}</nav>`
  );
  nav.querySelectorAll<HTMLElement>('[data-nav]').forEach((b) =>
    b.addEventListener('click', () => go('/' + b.dataset.nav))
  );

  app.replaceChildren(header, main, nav);
  await renderer(main, params);
  main.scrollTop = 0;
}

async function boot(): Promise<void> {
  await ensureSeeded();
  const settings = await getSettings();
  setLang(settings.lang);
  window.addEventListener('hashchange', render);
  // The Home screen can change the language from inside the page; the header
  // and the navigation bar are outside it and have to be redrawn too.
  window.addEventListener('pata:lang', () => void render());
  await render();
}

boot();
