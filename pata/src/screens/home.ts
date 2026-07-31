// Student side, at home, on the family phone — voluntary (spec §5). The only
// camera use in the product photographs a PAGE, never a person (§7.2, C9).
//
// Photographing a page ALWAYS reads the real page:
//   offline → on-device OCR (src/ocr.ts), then a bundled explanation in the
//             child's language if the topic is known, else the page read aloud
//   online  → the same OCR result, plus Claude explaining it properly
// Every voice moment has a visible tap fallback (rule 7).
import { aiAvailable, aiErrorKey, aiExplainPage, aiJudgeExplanation } from '../ai';
import { getLang } from '../i18n';
import { readPage } from '../ocr';
import { LANGUAGES, langDef, matchConcept, s, type L } from '../packs';
import { SAMPLE_PAGES, type SamplePage } from '../pages';
import { canListen, isSpeaking, listen, speak, stopSpeak } from '../speech';
import { summarise } from '../summarise';
import { el, esc, toast } from '../ui';

let lang: string = 'hi';
const speechLang = () => langDef(lang).speech;

/** One shape for sample pages, OCR pages and AI pages alike. */
interface ResolvedPage {
  title: string;
  bookLine: string;
  pageLines: string[];
  explanation: string;
  concepts: Array<{ id: string; label: string; keywords: string[]; wrong: boolean }>;
  /** Shown in small type so it's always clear where the words came from (§12). */
  provenance: string;
  confidence?: number;
}

function resolveSample(page: SamplePage): ResolvedPage {
  const cl: 'hi' | 'en' = lang === 'en' ? 'en' : 'hi';
  return {
    title: page.title[cl],
    bookLine: page.bookLine[cl],
    pageLines: page.pageLines.map((line) => line[cl]),
    explanation: page.explanation[cl],
    concepts: page.concepts.map((c) => ({
      id: c.id,
      label: c.label[cl],
      keywords: c.keywords,
      wrong: !!c.wrong,
    })),
    provenance: '',
  };
}

/** Downscale before OCR/upload — camera images are huge and a page is
 *  perfectly readable at 1600px on the long edge. */
async function toDataUrl(file: File, maxEdge = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

function pageView(root: HTMLElement, page: ResolvedPage): void {
  const holder = root.querySelector('#pageHolder')!;
  holder.innerHTML = '';
  const view = el(`
    <section>
      <h3>${esc(s('pageRead', lang))}</h3>
      <div class="paper page-photo">
        ${page.bookLine ? `<p class="meta">${esc(page.bookLine)}</p>` : ''}
        ${page.pageLines.length
          ? page.pageLines.map((line) => `<p>${esc(line)}</p>`).join('')
          : `<p>${esc(s('noText', lang))}</p>`}
      </div>
      ${
        // Say plainly when the read went badly, and why. Tesseract is trained
        // on printed text — handwriting is genuinely out of reach on-device.
        page.confidence !== undefined && (page.confidence < 65 || page.pageLines.length === 0)
          ? `<p class="note">${esc(s('lowConfidence', lang))}</p>`
          : ''
      }
      ${page.provenance ? `<p class="tiny">${esc(page.provenance)}${
        page.confidence !== undefined ? ` · ${page.confidence}%` : ''
      }</p>` : ''}

      ${page.pageLines.length ? `
      <button class="btn primary big" id="sumBtn">✂ ${esc(s('summarise', lang))}</button>
      <div id="summaryHolder"></div>` : ''}

      ${page.explanation ? `
      <div class="explain-box">
        <div class="row spread">
          <h3>${esc(page.title)}</h3>
          <button class="btn small" id="listenBtn">▶ ${esc(s('listen', lang))}</button>
        </div>
        <p class="explain-text">${esc(page.explanation)}</p>
      </div>` : ''}

      ${page.concepts.length ? `
      <h3>${esc(s('explainBack', lang))}</h3>
      <p class="sub small">${esc(s('explainHint', lang))}</p>
      <div class="row">
        <button class="btn" id="voiceBtn">🎤 ${esc(s('speakBtn', lang))}</button>
        <button class="btn ghost" id="tapBtn">${esc(s('tapBtn', lang))}</button>
      </div>
      <p class="tiny" id="voiceState"></p>
      <div id="judge"></div>` : ''}
    </section>`);
  holder.appendChild(view);
  view.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Summarise — the point of reading the page. Runs on-device, in the child's
  // language, and every line shown is a real line from the page.
  const sumBtn = view.querySelector<HTMLButtonElement>('#sumBtn');
  sumBtn?.addEventListener('click', () => {
    const holder = view.querySelector('#summaryHolder')!;
    const result = summarise(page.pageLines.join(' '), lang, 3);
    if (!result.sentences.length || result.summaryWords >= result.originalWords * 0.9) {
      holder.innerHTML = `<p class="note">${esc(s('tooShort', lang))}</p>`;
      return;
    }
    holder.innerHTML = `
      <div class="explain-box summary">
        <div class="row spread">
          <h3>${esc(s('summaryTitle', lang))}</h3>
          <button class="btn small" id="sumListen">▶ ${esc(s('listen', lang))}</button>
        </div>
        ${result.sentences.map((line) => `<p class="summary-line">${esc(line)}</p>`).join('')}
        ${result.keywords.length
          ? `<p class="tiny"><b>${esc(s('keywords', lang))}:</b> ${result.keywords.map(esc).join(' · ')}</p>`
          : ''}
        <p class="tiny">${result.originalWords} ${esc(s('summaryStat', lang))} ${result.summaryWords}
          · ${esc(s('summaryNote', lang))}</p>
      </div>`;
    const sumText = result.sentences.join(' ');
    const sumListen = holder.querySelector<HTMLButtonElement>('#sumListen')!;
    sumListen.addEventListener('click', () => {
      if (isSpeaking()) {
        stopSpeak();
        sumListen.textContent = `▶ ${s('listen', lang)}`;
      } else {
        speak(sumText, speechLang());
        sumListen.textContent = `⏹ ${s('stop', lang)}`;
      }
    });
    holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  const listenBtn = view.querySelector<HTMLButtonElement>('#listenBtn');
  // With no explanation (unknown page), reading the page itself aloud is the
  // useful thing — that's what a struggling reader actually needs.
  const spoken = page.explanation || page.pageLines.join('. ');
  listenBtn?.addEventListener('click', () => {
    if (isSpeaking()) {
      stopSpeak();
      listenBtn.textContent = `▶ ${s('listen', lang)}`;
    } else {
      speak(spoken, speechLang());
      listenBtn.textContent = `⏹ ${s('stop', lang)}`;
    }
  });

  // Unknown page with text but no explanation: still offer to read it aloud.
  if (!page.explanation && page.pageLines.length) {
    const readBtn = el(`<button class="btn primary big">🔊 ${esc(s('readAloudOffer', lang))}</button>`);
    readBtn.addEventListener('click', () => {
      if (isSpeaking()) {
        stopSpeak();
        readBtn.innerHTML = `🔊 ${esc(s('readAloudOffer', lang))}`;
      } else {
        speak(spoken, speechLang());
        readBtn.innerHTML = `⏹ ${esc(s('stop', lang))}`;
      }
    });
    view.appendChild(readBtn);
  }

  if (!page.concepts.length) return;
  const judge = view.querySelector('#judge')!;
  const voiceState = view.querySelector('#voiceState')!;
  const realConcepts = page.concepts.filter((c) => !c.wrong);

  const showVerdict = (hitIds: string[], wrongPicked: string | null) => {
    const missing = realConcepts.filter((c) => !hitIds.includes(c.id));
    let html: string;
    if (wrongPicked) {
      const wrong = page.concepts.find((c) => c.id === wrongPicked)!;
      html = `<p class="verdict partial">${esc(s('partial', lang))} <b>${esc(wrong.label)}</b> ✗</p>`;
    } else if (missing.length === 0) {
      html = `<p class="verdict good">✓ ${esc(s('good', lang))}</p>`;
    } else if (hitIds.length > 0) {
      html = `<p class="verdict partial">${esc(s('partial', lang))} <b>${esc(missing[0].label)}</b></p>`;
    } else {
      html = `<button class="btn ghost" id="flagBtn">${esc(s('flagBtn', lang))}</button>`;
    }
    judge.innerHTML = html;
    judge.querySelector('#flagBtn')?.addEventListener('click', () => {
      judge.innerHTML = `<p class="verdict flag">${esc(s('flagged', lang))}</p>`;
      toast(s('flagged', lang));
    });
  };

  // §7.3 — semantic and tolerant. AI judge when online; keyword prior offline.
  const judgeTranscript = async (transcript: string) => {
    voiceState.textContent = `“${transcript}”`;
    if (await aiAvailable()) {
      try {
        const result = await aiJudgeExplanation(
          `${page.title} — ${(page.explanation || page.pageLines.join(' ')).slice(0, 400)}`,
          realConcepts.map((c) => c.label),
          transcript,
          langDef(lang).english
        );
        const cls = result.verdict === 'good' ? 'good' : result.verdict === 'partial' ? 'partial' : 'flag';
        judge.innerHTML = `<p class="verdict ${cls}">${result.verdict === 'good' ? '✓ ' : ''}${esc(result.feedback)}</p>`;
        return;
      } catch {
        /* fall through to the offline keyword judge */
      }
    }
    const low = transcript.toLowerCase();
    const hit = realConcepts.filter((c) =>
      c.keywords.some((k) => k && low.includes(k.toLowerCase()))
    );
    showVerdict(hit.map((c) => c.id), null);
  };

  const showTap = () => {
    judge.innerHTML = `
      <p class="sub small">${esc(s('tapQ', lang))}</p>
      <div class="concept-list">
        ${page.concepts.map(
          (c) => `<label class="concept"><input type="checkbox" value="${c.id}" /> <span>${esc(c.label)}</span></label>`
        ).join('')}
      </div>
      <button class="btn primary" id="checkConcepts">${esc(s('check', lang))}</button>`;
    judge.querySelector('#checkConcepts')!.addEventListener('click', () => {
      const picked = [...judge.querySelectorAll<HTMLInputElement>('input:checked')].map((i) => i.value);
      const wrongPicked = page.concepts.find((c) => c.wrong && picked.includes(c.id));
      showVerdict(picked.filter((pid) => realConcepts.some((c) => c.id === pid)), wrongPicked?.id ?? null);
    });
  };

  view.querySelector('#voiceBtn')!.addEventListener('click', async () => {
    if (!canListen()) {
      voiceState.textContent = s('voiceUnavailable', lang);
      showTap();
      return;
    }
    voiceState.textContent = s('listening', lang);
    try {
      await judgeTranscript(await listen(speechLang(), 12000));
    } catch {
      voiceState.textContent = s('voiceUnavailable', lang);
      showTap();
    }
  });
  view.querySelector('#tapBtn')!.addEventListener('click', showTap);
}

export async function renderHome(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  lang = getLang();

  const screen = el(`
    <div>
      <h1>${esc(s('title', lang))}</h1>
      <p class="sub" id="introLine">${esc(s('intro', lang))}</p>

      <p class="sub small" id="langLine">${esc(s('language', lang))}</p>
      <div class="chips" id="langChips">
        ${LANGUAGES.map(
          (l) => `<button class="chip ${l.code === lang ? 'active' : ''}" data-lang="${l.code}">${esc(l.label)}</button>`
        ).join('')}
      </div>

      <label class="btn primary big photo-btn">
        📖 <span id="photoLabel">${esc(s('photo', lang))}</span>
        <input type="file" accept="image/*" capture="environment" hidden id="photoInput" />
      </label>
      <div class="bar" id="ocrBar" hidden><div class="bar-fill" id="ocrFill" style="width:0%"></div></div>

      <p class="sub small" id="sampleLine">${esc(s('samplePages', lang))}</p>
      <div class="list" id="sampleList"></div>
      <div id="pageHolder"></div>
    </div>`);
  root.appendChild(screen);

  let openSampleId: string | null = null;
  const photoLabel = screen.querySelector('#photoLabel')!;
  const ocrBar = screen.querySelector<HTMLElement>('#ocrBar')!;
  const ocrFill = screen.querySelector<HTMLElement>('#ocrFill')!;

  const paintSamples = () => {
    const cl: 'hi' | 'en' = lang === 'en' ? 'en' : 'hi';
    screen.querySelector('#sampleList')!.innerHTML = SAMPLE_PAGES.map(
      (p) => `<button class="list-item" data-page="${p.id}">
        <strong>${esc(p.title[cl])}</strong>
        <span class="meta">${esc(p.bookLine[cl])}</span>
      </button>`
    ).join('');
    screen.querySelectorAll<HTMLElement>('[data-page]').forEach((b) =>
      b.addEventListener('click', () => {
        const page = SAMPLE_PAGES.find((p) => p.id === b.dataset.page)!;
        openSampleId = page.id;
        pageView(root, resolveSample(page));
      })
    );
  };
  paintSamples();

  const repaintLabels = () => {
    screen.querySelector('#introLine')!.textContent = s('intro', lang);
    screen.querySelector('#langLine')!.textContent = s('language', lang);
    screen.querySelector('#sampleLine')!.textContent = s('samplePages', lang);
    screen.querySelector('h1')!.textContent = s('title', lang);
    photoLabel.textContent = s('photo', lang);
    paintSamples();
  };

  screen.querySelectorAll<HTMLElement>('[data-lang]').forEach((chip) =>
    chip.addEventListener('click', () => {
      lang = chip.dataset.lang!;
      screen.querySelectorAll('[data-lang]').forEach((c) => c.classList.toggle('active', c === chip));
      repaintLabels();
      if (openSampleId) {
        const page = SAMPLE_PAGES.find((p) => p.id === openSampleId)!;
        pageView(root, resolveSample(page));
      }
    })
  );

  const photoInput = screen.querySelector<HTMLInputElement>('#photoInput')!;
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    photoInput.value = '';
    if (!file) return;
    openSampleId = null;
    photoLabel.textContent = s('reading', lang);
    ocrBar.hidden = false;
    ocrFill.style.width = '0%';

    try {
      const dataUrl = await toDataUrl(file);

      // 1. Always read the page on-device first — this works with no network,
      //    and it is what actually tells the child what is on their page.
      const ocr = await readPage(dataUrl, lang, (pct) => (ocrFill.style.width = pct + '%'));

      // 2. Online: hand the same photo to Claude for a proper explanation.
      if (await aiAvailable()) {
        try {
          const ai = await aiExplainPage(dataUrl.split(',')[1], langDef(lang).english);
          pageView(root, {
            title: ai.title,
            bookLine: ai.bookLine,
            pageLines: ai.pageLines.length ? ai.pageLines : ocr.lines,
            explanation: ai.explanation,
            concepts: (ai.concepts ?? []).map((c, i) => ({
              id: 'c' + i,
              label: c.label,
              keywords: c.keywords ?? [],
              wrong: !!c.wrong,
            })),
            provenance: s('aiNote', lang),
          });
          return;
        } catch (err) {
          toast(s('offlineNote', lang));
          void aiErrorKey(err);
        }
      }

      // 3. Offline: bundled explanation when we recognise the topic; otherwise
      //    show what was read and offer to read it aloud.
      const concept = matchConcept(ocr.lines.join(' '));
      const key = lang as L;
      pageView(root, {
        title: concept ? concept.title[key] : s('topicFound', lang),
        bookLine: '',
        pageLines: ocr.lines,
        explanation: concept ? concept.explain[key] : '',
        concepts: concept
          ? concept.ideas.map((idea, i) => ({
              id: 'c' + i,
              label: idea.label[key],
              keywords: idea.keywords[key] ?? [],
              wrong: !!idea.wrong,
            }))
          : [],
        provenance: s('offlineNote', lang),
        confidence: ocr.confidence,
      });
    } catch {
      toast(s('noText', lang));
    } finally {
      photoLabel.textContent = s('photo', lang);
      ocrBar.hidden = true;
    }
  });
}
