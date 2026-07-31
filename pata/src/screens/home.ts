// Student side, at home, on the family phone — voluntary (spec §5). The only
// camera use in the product photographs a PAGE, never a person (§7.2, C9).
// Every voice moment has a visible tap fallback (rule 7).
import { bi, getLang, t } from '../i18n';
import { SAMPLE_PAGES, type SamplePage } from '../pages';
import { canListen, isSpeaking, listen, speak, stopSpeak } from '../speech';
import { el, esc, toast } from '../ui';

// C7: 12 languages, not 1,369 dialects. Demo content is complete in hi/en.
const LANGS: Array<[string, string, string]> = [
  ['hi', 'हिन्दी', 'hi-IN'], ['en', 'English', 'en-IN'], ['mr', 'मराठी', 'mr-IN'],
  ['bn', 'বাংলা', 'bn-IN'], ['ta', 'தமிழ்', 'ta-IN'], ['te', 'తెలుగు', 'te-IN'],
  ['kn', 'ಕನ್ನಡ', 'kn-IN'], ['ml', 'മലയാളം', 'ml-IN'], ['gu', 'ગુજરાતી', 'gu-IN'],
  ['or', 'ଓଡ଼ିଆ', 'or-IN'], ['pa', 'ਪੰਜਾਬੀ', 'pa-IN'], ['as', 'অসমীয়া', 'as-IN'],
];

let chosenLang = 'hi';

function contentLang(): 'hi' | 'en' {
  return chosenLang === 'en' ? 'en' : 'hi';
}
function speechLang(): string {
  return LANGS.find(([code]) => code === chosenLang)?.[2] ?? 'hi-IN';
}

function pageView(root: HTMLElement, page: SamplePage): void {
  const holder = root.querySelector('#pageHolder')!;
  holder.innerHTML = '';
  const cl = contentLang();
  const fallbackNote = chosenLang !== 'hi' && chosenLang !== 'en';

  const view = el(`
    <section>
      <div class="paper page-photo">
        <p class="meta">${esc(page.bookLine[cl])}</p>
        ${page.pageLines.map((line) => `<p>${esc(line[cl])}</p>`).join('')}
      </div>
      ${fallbackNote ? `<p class="tiny">${esc(t('homeLangDemoNote'))}</p>` : ''}
      <div class="explain-box">
        <div class="row spread">
          <h3>${esc(page.title[cl])}</h3>
          <button class="btn small" id="listenBtn">▶ ${esc(t('homeListen'))}</button>
        </div>
        <p class="explain-text">${esc(page.explanation[cl])}</p>
      </div>

      <h3>${esc(t('homeExplainBack'))}</h3>
      <p class="sub small">${esc(t('homeExplainHint'))}</p>
      <div class="row">
        <button class="btn" id="voiceBtn">🎤 ${esc(t('homeSpeakBtn'))}</button>
        <button class="btn ghost" id="tapBtn">${esc(t('homeTapBtn'))}</button>
      </div>
      <p class="tiny" id="voiceState"></p>
      <div id="judge"></div>
    </section>`);
  holder.appendChild(view);
  view.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const listenBtn = view.querySelector<HTMLButtonElement>('#listenBtn')!;
  listenBtn.addEventListener('click', () => {
    if (isSpeaking()) {
      stopSpeak();
      listenBtn.textContent = `▶ ${t('homeListen')}`;
    } else {
      speak(page.explanation[cl], speechLang());
      listenBtn.textContent = `⏹ ${t('homeStop')}`;
    }
  });

  const judge = view.querySelector('#judge')!;
  const realConcepts = page.concepts.filter((c) => !c.wrong);

  // §7.3 — semantic and tolerant: did the right concepts appear? We know which
  // page they are explaining, so we decode against that strong prior.
  const judgeTranscript = (transcript: string) => {
    const low = transcript.toLowerCase();
    const hit = realConcepts.filter((c) => c.keywords.some((k) => low.includes(k)));
    showVerdict(hit.map((c) => c.id), null);
  };

  const showVerdict = (hitIds: string[], wrongPicked: string | null) => {
    const missing = realConcepts.filter((c) => !hitIds.includes(c.id));
    let html: string;
    if (wrongPicked) {
      const wrong = page.concepts.find((c) => c.id === wrongPicked)!;
      html = `<p class="verdict partial">${esc(t('homeJudgePartial'))} <b>${esc(wrong.label[cl])}</b> ✗</p>`;
    } else if (missing.length === 0) {
      html = `<p class="verdict good">✓ ${esc(t('homeJudgeGood'))}</p>`;
    } else if (hitIds.length > 0) {
      html = `<p class="verdict partial">${esc(t('homeJudgePartial'))} <b>${esc(missing[0].label[cl])}</b></p>`;
    } else {
      html = `<button class="btn ghost" id="flagBtn">${esc(t('homeFlagBtn'))}</button>`;
    }
    judge.innerHTML = html;
    judge.querySelector('#flagBtn')?.addEventListener('click', () => {
      judge.innerHTML = `<p class="verdict flag">${esc(t('homeJudgeFlag'))}</p>`;
      toast(t('homeJudgeFlag'));
    });
  };

  const voiceState = view.querySelector('#voiceState')!;
  view.querySelector('#voiceBtn')!.addEventListener('click', async () => {
    if (!canListen()) {
      voiceState.textContent = t('homeVoiceUnavailable');
      showTap();
      return;
    }
    voiceState.textContent = t('prepListening');
    try {
      const transcript = await listen(speechLang(), 10000);
      voiceState.textContent = `“${transcript}”`;
      judgeTranscript(transcript);
    } catch {
      voiceState.textContent = t('homeVoiceUnavailable');
      showTap();
    }
  });

  const showTap = () => {
    // Tap fallback: pick the true concepts; one option is a planted misconception.
    judge.innerHTML = `
      <p class="sub small">${esc(t('homeTapQ'))}</p>
      <div class="concept-list">
        ${page.concepts.map(
          (c) => `<label class="concept"><input type="checkbox" value="${c.id}" /> <span>${esc(c.label[cl])}</span></label>`
        ).join('')}
      </div>
      <button class="btn primary" id="checkConcepts">${esc(t('homeCheckAnswers'))}</button>`;
    judge.querySelector('#checkConcepts')!.addEventListener('click', () => {
      const picked = [...judge.querySelectorAll<HTMLInputElement>('input:checked')].map((i) => i.value);
      const wrongPicked = page.concepts.find((c) => c.wrong && picked.includes(c.id));
      showVerdict(picked.filter((pid) => realConcepts.some((c) => c.id === pid)), wrongPicked?.id ?? null);
    });
  };
  view.querySelector('#tapBtn')!.addEventListener('click', showTap);
}

export async function renderHome(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  chosenLang = getLang();
  const screen = el(`
    <div>
      <h1>${esc(t('homeTitle'))}</h1>
      <p class="sub">${esc(t('homeIntro'))}</p>

      <p class="sub small">${esc(t('homeLangLabel'))}</p>
      <div class="chips" id="langChips">
        ${LANGS.map(
          ([code, label]) => `<button class="chip ${code === chosenLang ? 'active' : ''}" data-lang="${code}">${esc(label)}</button>`
        ).join('')}
      </div>

      <label class="btn primary big photo-btn">
        📖 ${esc(t('homePhoto'))}
        <input type="file" accept="image/*" capture="environment" hidden id="photoInput" />
      </label>
      <p class="tiny">${esc(t('homeSimNote'))}</p>

      <p class="sub small">${esc(t('homeSamplePages'))}</p>
      <div class="list" id="sampleList">
        ${SAMPLE_PAGES.map(
          (p) => `<button class="list-item" data-page="${p.id}">
            <strong>${esc(p.title[contentLang()])}</strong>
            <span class="meta">${esc(p.bookLine[contentLang()])}</span>
          </button>`
        ).join('')}
      </div>
      <div id="pageHolder"></div>
    </div>`);
  root.appendChild(screen);

  screen.querySelectorAll<HTMLElement>('[data-lang]').forEach((chip) =>
    chip.addEventListener('click', () => {
      chosenLang = chip.dataset.lang!;
      screen.querySelectorAll('[data-lang]').forEach((c) => c.classList.toggle('active', c === chip));
      const open = screen.querySelector('#pageHolder')!.hasChildNodes();
      if (open) {
        const currentId = screen.querySelector('#pageHolder section')?.getAttribute('data-page-id');
        const page = SAMPLE_PAGES.find((p) => p.id === currentId) ?? SAMPLE_PAGES[0];
        pageView(root, page);
        screen.querySelector('#pageHolder section')?.setAttribute('data-page-id', page.id);
      }
    })
  );

  const openPage = (page: SamplePage) => {
    pageView(root, page);
    screen.querySelector('#pageHolder section')?.setAttribute('data-page-id', page.id);
  };

  screen.querySelectorAll<HTMLElement>('[data-page]').forEach((b) =>
    b.addEventListener('click', () => {
      const page = SAMPLE_PAGES.find((p) => p.id === b.dataset.page)!;
      openPage(page);
    })
  );

  // A real photo arrives → in the demo, OCR is pre-prepared for sample pages,
  // so ask which page it is (said plainly on screen — §12).
  screen.querySelector('#photoInput')!.addEventListener('change', () => {
    toast(t('homeSimNote'));
    openPage(SAMPLE_PAGES[0]);
  });
}
