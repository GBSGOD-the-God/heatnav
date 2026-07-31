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
};

const NAV: Array<[string, string, string]> = [
  ['prep', 'navPrep', '✎'],
  ['check', 'navCheck', '✓'],
  ['insight', 'navInsight', '☰'],
  ['report', 'navReport', '✉'],
  ['home', 'navHome', '⌂'],
];

function parseHash(): { screen: string; params: URLSearchParams } {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  return { screen: path || 'prep', params: new URLSearchParams(query) };
}

async function render(): Promise<void> {
  stopSpeak();
  const { screen, params } = parseHash();
  const renderer = ROUTES[screen] ?? renderPrep;

  const app = document.getElementById('app')!;
  app.innerHTML = '';

  const header = el(`
    <header class="topbar">
      <button class="brand" id="brandBtn" aria-label="PATA">
        <span class="brand-mark">प</span>
        <span class="brand-name">${esc(t('appName'))}</span>
      </button>
      <span class="sample-badge">${esc(t('sampleBadge'))}</span>
      <div class="topbar-actions">
        <button class="icon-btn" id="langBtn" aria-label="${esc(t('settingsLang'))}">${getLang() === 'hi' ? 'En' : 'हि'}</button>
        <button class="icon-btn" id="rosterBtn" aria-label="${esc(t('rosterTitle'))}">☷</button>
      </div>
    </header>`);
  header.querySelector('#brandBtn')!.addEventListener('click', () => go('/prep'));
  header.querySelector('#rosterBtn')!.addEventListener('click', () => go('/roster'));
  header.querySelector('#langBtn')!.addEventListener('click', async () => {
    const s = await getSettings();
    s.lang = s.lang === 'hi' ? 'en' : 'hi';
    await saveSettings(s);
    setLang(s.lang);
    render();
  });
  app.appendChild(header);

  const main = el('<main class="screen"></main>');
  app.appendChild(main);

  const navScreen = screen === 'result' ? 'check' : screen === 'roster' ? '' : screen;
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
