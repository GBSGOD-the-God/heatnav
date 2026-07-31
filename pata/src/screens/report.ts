// She speaks; the form drafts. She reviews and submits — NEVER auto-submit
// (spec §7.4). Counts only; no per-child attendance anywhere (§10).
import { allReports, getSettings, saveReport, uid } from '../db';
import { getLang, t } from '../i18n';
import { canListen, listen } from '../speech';
import type { DailyReport } from '../types';
import { el, esc, toast } from '../ui';

const SAMPLE_SENTENCE: Record<'hi' | 'en', string> = {
  hi: 'आज 34 बच्चे उपस्थित रहे, भोजन 32 को मिला, 2 जाँचें पूरी हुईं, विषय हासिल वाला घटाव',
  en: 'Today 34 children were present, meals went to 32, 2 checks completed, topic subtraction with borrowing',
};

/** Pull counts out of a spoken sentence: nearest number to each keyword. */
export function parseReportSpeech(raw: string): Partial<DailyReport> {
  // Normalise Devanagari digits.
  const text = raw.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));
  const numbers: Array<{ value: number; at: number }> = [];
  for (const m of text.matchAll(/\d+/g)) numbers.push({ value: parseInt(m[0], 10), at: m.index! });

  const nearest = (keywords: string[]): number | null => {
    let best: number | null = null;
    let bestDist = Infinity;
    for (const kw of keywords) {
      const at = text.toLowerCase().indexOf(kw);
      if (at < 0) continue;
      for (const n of numbers) {
        const dist = Math.abs(n.at - at);
        if (dist < bestDist && dist < 30) {
          bestDist = dist;
          best = n.value;
        }
      }
    }
    return best;
  };

  const topicMatch = text.match(/(?:विषय|topic)[:\s]*(.+?)(?:[।.]|$)/i);
  return {
    presentCount: nearest(['बच्चे', 'उपस्थित', 'present', 'children']),
    mealsCount: nearest(['भोजन', 'meal']),
    checksDone: nearest(['जाँच', 'जांच', 'check']),
    topicsTaught: topicMatch ? topicMatch[1].trim() : '',
  };
}

export async function renderReport(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  await getSettings();
  const lang = getLang();

  const screen = el(`
    <div>
      <h1>${esc(t('reportTitle'))}</h1>
      <p class="sub">${esc(t('reportHint'))}</p>
      <div class="row">
        <button class="btn" id="voiceBtn">🎤 ${esc(t('reportSpeak'))}</button>
        <button class="btn ghost" id="demoBtn">${esc(t('reportDemoFill'))}</button>
      </div>
      <p class="tiny">${esc(t('reportSimNote'))}</p>
      <p class="tiny" id="heard" hidden></p>

      <form class="paper report-form" id="reportForm">
        <label>${esc(t('reportPresent'))}<input type="number" name="present" min="0" inputmode="numeric" /></label>
        <label>${esc(t('reportMeals'))}<input type="number" name="meals" min="0" inputmode="numeric" /></label>
        <label>${esc(t('reportChecks'))}<input type="number" name="checks" min="0" inputmode="numeric" /></label>
        <label>${esc(t('reportTopics'))}<input type="text" name="topics" /></label>
        <label>${esc(t('reportNotes'))}<textarea name="notes" rows="2"></textarea></label>
        <button type="submit" class="btn primary big">${esc(t('reportSubmit'))}</button>
        <p class="tiny center">${esc(t('reportNeverAuto'))}</p>
      </form>
      <div id="past"></div>
    </div>`);
  root.appendChild(screen);

  const form = screen.querySelector<HTMLFormElement>('#reportForm')!;
  const heard = screen.querySelector<HTMLElement>('#heard')!;

  const fillForm = (transcript: string) => {
    heard.hidden = false;
    heard.textContent = `${t('reportHeard')} “${transcript}”`;
    const parsed = parseReportSpeech(transcript);
    const set = (name: string, v: number | string | null | undefined) => {
      if (v === null || v === undefined || v === '') return;
      (form.elements.namedItem(name) as HTMLInputElement).value = String(v);
    };
    set('present', parsed.presentCount);
    set('meals', parsed.mealsCount);
    set('checks', parsed.checksDone);
    set('topics', parsed.topicsTaught);
  };

  screen.querySelector('#voiceBtn')!.addEventListener('click', async () => {
    if (!canListen()) {
      fillForm(SAMPLE_SENTENCE[lang]);
      return;
    }
    heard.hidden = false;
    heard.textContent = t('prepListening');
    try {
      fillForm(await listen(lang === 'hi' ? 'hi-IN' : 'en-IN', 10000));
    } catch {
      fillForm(SAMPLE_SENTENCE[lang]);
    }
  });
  screen.querySelector('#demoBtn')!.addEventListener('click', () => fillForm(SAMPLE_SENTENCE[lang]));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const num = (name: string) => {
      const v = String(data.get(name) ?? '').trim();
      return v === '' ? null : Number(v);
    };
    const report: DailyReport = {
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      presentCount: num('present'),
      mealsCount: num('meals'),
      checksDone: num('checks'),
      topicsTaught: String(data.get('topics') ?? ''),
      notes: String(data.get('notes') ?? ''),
      ts: Date.now(),
    };
    await saveReport(report);
    toast(t('reportSubmitted'));
    form.reset();
    heard.hidden = true;
    await renderPast();
  });

  const renderPast = async () => {
    const past = await allReports();
    const holder = screen.querySelector('#past')!;
    if (!past.length) {
      holder.innerHTML = '';
      return;
    }
    holder.innerHTML = `
      <h3>${esc(t('reportPast'))}</h3>
      <div class="list">
        ${past.slice(0, 7).map(
          (r) => `<div class="list-item static">
            <strong>${esc(r.date)}</strong>
            <span class="meta">${r.presentCount ?? '—'} · ${esc(t('reportChecks'))}: ${r.checksDone ?? '—'} · ${esc(r.topicsTaught)}</span>
          </div>`
        ).join('')}
      </div>`;
  };
  await renderPast();
}
