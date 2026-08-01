// Writing → PDF → send.
//
// Shared by both sides: a child writing an essay or an answer, and a teacher
// writing a report that the fixed form does not cover. Same screen, same
// export, different heading.
//
// The PDF is generated on the phone (src/pdf.ts) and handed to the share
// sheet, so it reaches WhatsApp, SMS or email without a server. Works offline
// — the file is made locally; only the sending needs a network, and the
// messaging app queues that itself.
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { getSettings, kvGet, kvSet } from '../db';
import { getLang, t } from '../i18n';
import { langDef } from '../packs';
import { canListen, listen } from '../speech';
import { isReading, readAloud, stopReading } from '../voice';
import { blobToDataUrl, makePdf } from '../pdf';
import { getSession } from '../session';
import { el, esc, toast } from '../ui';

interface Draft {
  title: string;
  body: string;
  savedAt: number;
}

export async function renderWrite(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  await getSettings();
  const session = await getSession();

  const key = session?.role === 'teacher' ? 'draft:teacher' : 'draft:student';
  const saved = (await kvGet<Draft>(key)) ?? { title: '', body: '', savedAt: 0 };

  const screen = el(`
    <div>
      <h1>${esc(t('myWriting'))}</h1>
      <p class="sub">${esc(t('writingHint'))}</p>
      <form class="paper report-form" id="writeForm">
        <label>${esc(t('writingTitle'))}
          <input name="title" value="${esc(saved.title)}" autocomplete="off" />
        </label>
        <label>
          <textarea name="body" rows="14" class="write-area">${esc(saved.body)}</textarea>
        </label>
        <div class="row">
          <button type="button" class="btn big" id="dictateBtn">🎤 ${esc(t('dictate'))}</button>
          <button type="button" class="btn big" id="readBtn">🔊 ${esc(t('readBack'))}</button>
        </div>
        <p class="tiny" id="writeState" hidden></p>
        <button type="button" class="btn primary big" id="pdfBtn">📄 ${esc(t('makePdf'))}</button>
      </form>
    </div>`);
  root.appendChild(screen);

  const form = screen.querySelector<HTMLFormElement>('#writeForm')!;
  const titleEl = form.elements.namedItem('title') as HTMLInputElement;
  const bodyEl = form.elements.namedItem('body') as HTMLTextAreaElement;

  // Autosave: a child on a shared phone will be interrupted mid-sentence.
  let timer: number | undefined;
  const autosave = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      void kvSet(key, { title: titleEl.value, body: bodyEl.value, savedAt: Date.now() });
    }, 600);
  };
  titleEl.addEventListener('input', autosave);
  bodyEl.addEventListener('input', autosave);

  const lang = getLang();
  const speechLocale = langDef(lang).speech;
  const state = screen.querySelector<HTMLElement>('#writeState')!;

  // Dictating an essay. A child who can say far more than they can spell — or
  // a teacher writing a letter one-handed at the end of a day — should not be
  // stuck at the keyboard. It APPENDS rather than replaces, so a long piece is
  // built a few sentences at a time and nothing already written is ever lost.
  const dictateBtn = screen.querySelector<HTMLButtonElement>('#dictateBtn')!;
  dictateBtn.addEventListener('click', async () => {
    if (!canListen()) {
      state.hidden = false;
      state.textContent = t('voiceUnavailable');
      bodyEl.focus();
      return;
    }
    dictateBtn.classList.add('listening');
    dictateBtn.innerHTML = `● ${esc(t('listening'))}`;
    try {
      const heard = (await listen(speechLocale, 15000)).trim();
      if (heard) {
        const sep = bodyEl.value && !/\s$/.test(bodyEl.value) ? ' ' : '';
        bodyEl.value = bodyEl.value + sep + heard;
        autosave();
        bodyEl.scrollTop = bodyEl.scrollHeight;
        state.hidden = false;
        state.textContent = `${t('reportHeard')} “${heard}”`;
      }
    } catch {
      state.hidden = false;
      state.textContent = t('voiceUnavailable');
      bodyEl.focus();
    } finally {
      dictateBtn.classList.remove('listening');
      dictateBtn.innerHTML = `🎤 ${esc(t('dictate'))}`;
    }
  });

  // Hearing your own writing read back is how you catch the sentence that does
  // not work — and for a child it is the whole point of writing it.
  const readBtn = screen.querySelector<HTMLButtonElement>('#readBtn')!;
  readBtn.addEventListener('click', async () => {
    if (isReading()) {
      await stopReading();
      readBtn.innerHTML = `🔊 ${esc(t('readBack'))}`;
      return;
    }
    const text = [titleEl.value.trim(), bodyEl.value.trim()].filter(Boolean).join('. ');
    if (!text) {
      toast(t('writeSomething'));
      bodyEl.focus();
      return;
    }
    readBtn.innerHTML = `⏹ ${esc(t('stop'))}`;
    await readAloud(text, lang, speechLocale);
    readBtn.innerHTML = `🔊 ${esc(t('readBack'))}`;
  });

  screen.querySelector('#pdfBtn')!.addEventListener('click', async () => {
    const title = titleEl.value.trim();
    const body = bodyEl.value.trim();
    if (!body) {
      toast(t('writeSomething'));
      bodyEl.focus();
      return;
    }

    const heading = title || t('myWriting');
    const who = session
      ? `${session.name}${session.grade ? ` · ${t('yourClass')} ${session.grade}` : ''} · ${session.school}`
      : '';

    const blob = await makePdf({
      title: heading,
      heading,
      subheading: `${who} · ${new Date().toLocaleDateString()}`,
      body: body.split(/\n{2,}/),
      footer: 'PATA',
    });

    const filename = (title || 'pata').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) + '.pdf';

    try {
      if (Capacitor.isNativePlatform()) {
        // Share sheets need a real file URI, not a blob.
        const dataUrl = await blobToDataUrl(blob);
        const written = await Filesystem.writeFile({
          path: filename,
          data: dataUrl.split(',')[1],
          directory: Directory.Cache,
        });
        await Share.share({ title: heading, files: [written.uri] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      toast(t('pdfMade'));
    } catch {
      // Sharing can be cancelled or unavailable; the file still exists.
      toast(t('pdfMade'));
    }
  });
}
