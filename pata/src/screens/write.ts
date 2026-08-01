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
import { s } from '../packs';
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
  const settings = await getSettings();
  const session = await getSession();
  const L = settings.homeLang || settings.lang;
  const t = (k: string) => s(k, L);

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
