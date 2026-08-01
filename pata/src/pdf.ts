// Minimal PDF writer, no dependencies.
//
// The hard part of PDFs here is script support: a text-based PDF must embed a
// font, and a Devanagari or Tamil font with correct shaping is hundreds of
// kilobytes — times twelve languages. Instead we let the browser do what it
// is already good at: lay the text out on a canvas using the phone's own
// fonts, then wrap that image in a PDF.
//
// Trade-off, stated plainly: the text is a picture, so it cannot be selected
// or searched. For a page a head teacher opens in WhatsApp and reads, that is
// the right trade — and it renders every one of the 12 scripts perfectly,
// which a hand-rolled font subset would not.

const A4 = { w: 595, h: 842 }; // points, at 72dpi
const MARGIN = 48;

export interface PdfDoc {
  title: string;
  /** Rendered as a heading. */
  heading: string;
  /** Small grey line under the heading — date, school, class. */
  subheading?: string;
  /** Body paragraphs. Blank strings become spacing. */
  body: string[];
  /** Small print at the foot of the last page. */
  footer?: string;
}

/** Lay one page out on a canvas at print resolution. */
function renderPage(
  lines: Array<{ text: string; size: number; bold?: boolean; grey?: boolean }>,
  scale: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = A4.w * scale;
  canvas.height = A4.h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'top';

  let y = MARGIN * scale;
  for (const line of lines) {
    ctx.font = `${line.bold ? '700 ' : ''}${line.size * scale}px "Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif`;
    ctx.fillStyle = line.grey ? '#666666' : '#111111';
    ctx.fillText(line.text, MARGIN * scale, y);
    y += line.size * 1.55 * scale;
  }
  return canvas;
}

/** Greedy wrap against real measured width, so Devanagari wraps correctly. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const attempt = line ? line + ' ' + w : w;
    if (ctx.measureText(attempt).width > maxWidth && line) {
      out.push(line);
      line = w;
    } else {
      line = attempt;
    }
  }
  if (line) out.push(line);
  return out;
}

function latin1(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return s;
}

/**
 * Build a one-or-more page PDF and return it as a Blob.
 * Content is rasterised, so any script renders correctly.
 */
export async function makePdf(doc: PdfDoc, scale = 2): Promise<Blob> {
  // Measure with a scratch context before committing to pages.
  const scratch = document.createElement('canvas').getContext('2d')!;
  const contentWidth = (A4.w - MARGIN * 2);

  type Line = { text: string; size: number; bold?: boolean; grey?: boolean };
  const all: Line[] = [];

  scratch.font = `700 20px "Noto Sans Devanagari", system-ui, sans-serif`;
  for (const l of wrap(scratch, doc.heading, contentWidth)) {
    all.push({ text: l, size: 20, bold: true });
  }
  if (doc.subheading) {
    scratch.font = `12px "Noto Sans Devanagari", system-ui, sans-serif`;
    for (const l of wrap(scratch, doc.subheading, contentWidth)) {
      all.push({ text: l, size: 12, grey: true });
    }
  }
  all.push({ text: '', size: 10 });

  scratch.font = `13px "Noto Sans Devanagari", system-ui, sans-serif`;
  for (const para of doc.body) {
    if (!para.trim()) {
      all.push({ text: '', size: 8 });
      continue;
    }
    for (const l of wrap(scratch, para, contentWidth)) {
      all.push({ text: l, size: 13 });
    }
    all.push({ text: '', size: 6 });
  }
  if (doc.footer) {
    all.push({ text: '', size: 10 });
    scratch.font = `10px "Noto Sans Devanagari", system-ui, sans-serif`;
    for (const l of wrap(scratch, doc.footer, contentWidth)) {
      all.push({ text: l, size: 10, grey: true });
    }
  }

  // Split into pages by accumulated height.
  const usable = A4.h - MARGIN * 2;
  const pages: Line[][] = [];
  let current: Line[] = [];
  let used = 0;
  for (const line of all) {
    const h = line.size * 1.55;
    if (used + h > usable && current.length) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(line);
    used += h;
  }
  if (current.length) pages.push(current);

  // Rasterise each page to JPEG.
  const images: Uint8Array[] = [];
  for (const p of pages) {
    const canvas = renderPage(p, scale);
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), 'image/jpeg', 0.86)
    );
    images.push(new Uint8Array(await blob.arrayBuffer()));
  }

  // --- assemble the PDF ---
  const objects: string[] = [];
  const push = (body: string) => objects.push(body) && objects.length;

  const pageIds: number[] = [];
  const imageIds: number[] = [];
  const contentIds: number[] = [];

  // 1 = catalog, 2 = pages tree; children start at 3.
  let next = 3;
  for (let i = 0; i < images.length; i++) {
    pageIds.push(next++);
    imageIds.push(next++);
    contentIds.push(next++);
  }

  const parts: string[] = [];
  const offsets: number[] = [];
  let out = '%PDF-1.4\n';
  const add = (id: number, body: string) => {
    offsets[id] = out.length;
    out += `${id} 0 obj\n${body}\nendobj\n`;
  };

  add(1, '<< /Type /Catalog /Pages 2 0 R >>');
  add(2, `<< /Type /Pages /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);

  for (let i = 0; i < images.length; i++) {
    add(
      pageIds[i],
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] ` +
        `/Resources << /XObject << /Im0 ${imageIds[i]} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`
    );

    const img = images[i];
    offsets[imageIds[i]] = out.length;
    out +=
      `${imageIds[i]} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${A4.w * scale} ` +
      `/Height ${A4.h * scale} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
      `/Filter /DCTDecode /Length ${img.length} >>\nstream\n` +
      latin1(img) +
      '\nendstream\nendobj\n';

    const stream = `q ${A4.w} 0 0 ${A4.h} 0 0 cm /Im0 Do Q`;
    add(contentIds[i], `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  void parts;
  void push;

  const total = next - 1;
  const xrefAt = out.length;
  out += `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= total; i++) {
    out += String(offsets[i] ?? 0).padStart(10, '0') + ' 00000 n \n';
  }
  out += `trailer\n<< /Size ${total + 1} /Root 1 0 R /Info << /Title (${doc.title.replace(/[()\\]/g, '')}) >> >>\nstartxref\n${xrefAt}\n%%EOF`;

  // Latin-1 out: every byte we wrote is already a single byte, including the
  // JPEG payload, so this must not be UTF-8 encoded or the streams corrupt.
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

/** Turn a Blob into a data URL, for sharing or download. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.readAsDataURL(blob);
  });
}
