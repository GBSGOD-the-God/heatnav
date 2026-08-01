// She speaks; the form drafts. She reviews and submits — NEVER auto-submit
// (spec §7.4). Counts only; no per-child attendance anywhere (§10).
//
// Two ways to fill it by voice, because one long sentence is fragile:
//   - the mic on a single field: say just "चौंतीस". Almost always right.
//   - the mic at the top: say the whole sentence, all fields at once.
// Both parse spoken number WORDS, not just digits, and both try every guess
// the recogniser offers rather than only its top pick.
import { Share } from '@capacitor/share';
import { allReports, getSettings, saveReport, uid } from '../db';
import { getLang, t } from '../i18n';
import { langDef } from '../packs';
import { findNumbers, normaliseDigits, parseSingleNumber } from '../numbers';
import { canListen, listenAll } from '../speech';
import { isReading, readAloud, stopReading } from '../voice';
import type { DailyReport } from '../types';
import { el, esc, go, toast } from '../ui';

/** Only the two languages whose spoken number WORDS the parser knows; the
 *  demo button falls back to one of them. Digits typed or spoken as numerals
 *  are understood in every Indian script (see normaliseDigits). */
const SAMPLE_SENTENCE: Record<'hi' | 'en', string> = {
  hi: 'आज चौंतीस बच्चे उपस्थित रहे, भोजन बत्तीस को मिला, दो जाँचें पूरी हुईं, विषय हासिल वाला घटाव',
  en: 'Today thirty four children were present, meals went to thirty two, two checks completed, topic subtraction with borrowing',
};

/** Words that mark each field. More synonyms = more forgiving. */
const FIELD_WORDS = {
  present: ['बच्चे', 'बच्चों', 'उपस्थित', 'हाज़िर', 'हाजिर', 'present', 'children', 'attendance', 'attended'],
  meals: ['भोजन', 'खाना', 'मध्याह्न', 'meal', 'meals', 'lunch', 'food'],
  checks: ['जाँच', 'जांच', 'जाँचें', 'जांचें', 'check', 'checks'],
};

/**
 * Pull counts out of a spoken sentence: for each field, the number sitting
 * closest to one of its marker words.
 */
export function parseReportSpeech(raw: string): Partial<DailyReport> {
  const text = normaliseDigits(raw);
  const lower = text.toLowerCase();
  const numbers = findNumbers(text); // digits AND spoken words

  const nearest = (keywords: string[]): number | null => {
    let best: number | null = null;
    let bestDist = Infinity;
    for (const kw of keywords) {
      // Every occurrence, not just the first — "भोजन" may appear twice.
      let at = lower.indexOf(kw.toLowerCase());
      while (at >= 0) {
        for (const n of numbers) {
          const dist = Math.abs(n.at - at);
          // Widened from 30: a spoken number word plus a postposition can sit
          // further from its marker than a bare digit does.
          if (dist < bestDist && dist < 45) {
            bestDist = dist;
            best = n.value;
          }
        }
        at = lower.indexOf(kw.toLowerCase(), at + 1);
      }
    }
    return best;
  };

  const topicMatch = text.match(/(?:विषय|पाठ|topic|lesson)[:\s]*(.+?)(?:[।.]|$)/i);
  return {
    presentCount: nearest(FIELD_WORDS.present),
    mealsCount: nearest(FIELD_WORDS.meals),
    checksDone: nearest(FIELD_WORDS.checks),
    topicsTaught: topicMatch ? topicMatch[1].trim() : '',
  };
}

/** Score a parse so we can pick the best of several recogniser guesses. */
function score(p: Partial<DailyReport>): number {
  let n = 0;
  if (p.presentCount != null) n += 2; // the field that matters most
  if (p.mealsCount != null) n++;
  if (p.checksDone != null) n++;
  if (p.topicsTaught) n++;
  return n;
}

export async function renderReport(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  await getSettings();
  const lang = getLang();
  const speechLocale = langDef(lang).speech;

  const numField = (name: string, label: string) => `
    <label>${esc(label)}
      <span class="field-row">
        <input type="number" name="${name}" min="0" inputmode="numeric" />
        <button type="button" class="mic-btn" data-mic="${name}" aria-label="${esc(t('reportSpeak'))}">🎤</button>
      </span>
    </label>`;

  const screen = el(`
    <div>
      <h1>${esc(t('reportTitle'))}</h1>
      <p class="sub">${esc(t('reportHint'))}</p>
      <p class="tiny">${esc(t('reportFieldMicHint'))}</p>
      <div class="row">
        <button class="btn" id="voiceBtn">🎤 ${esc(t('reportSpeakAll'))}</button>
        <button class="btn ghost" id="demoBtn">${esc(t('reportDemoFill'))}</button>
      </div>
      <p class="tiny" id="heard" hidden></p>

      <form class="paper report-form" id="reportForm">
        ${numField('present', t('reportPresent'))}
        ${numField('meals', t('reportMeals'))}
        ${numField('checks', t('reportChecks'))}
        <label>${esc(t('reportTopics'))}
          <span class="field-row">
            <input type="text" name="topics" />
            <button type="button" class="mic-btn" data-mic="topics" aria-label="${esc(t('reportSpeak'))}">🎤</button>
          </span>
        </label>
        <label>${esc(t('reportNotes'))}<textarea name="notes" rows="2"></textarea></label>
        <button type="submit" class="btn primary big">${esc(t('reportSubmit'))}</button>
        <div class="row">
          <button type="button" class="btn big" id="shareBtn">📤 ${esc(t('reportShare'))}</button>
          <button type="button" class="btn big" id="readBtn">🔊 ${esc(t('readBack'))}</button>
        </div>
        <p class="tiny center">${esc(t('reportNeverAuto'))} · ${esc(t('reportShareHint'))}</p>
      </form>
      <details class="advanced" id="freeReport">
        <summary>${esc(t('reportFreeTitle'))}</summary>
        <p class="sub small">${esc(t('reportFreeHint'))}</p>
        <button class="btn big" id="freeBtn">✎ ${esc(t('reportFreeOpen'))}</button>
      </details>

      <div id="past"></div>
    </div>`);
  root.appendChild(screen);

  // Anything the fixed form does not cover — an incident, a request, a note to
  // the BRC — goes in the free-form writer, which exports a PDF.
  screen.querySelector('#freeBtn')!.addEventListener('click', () => go('/write'));

  const form = screen.querySelector<HTMLFormElement>('#reportForm')!;
  const heard = screen.querySelector<HTMLElement>('#heard')!;
  const field = (n: string) => form.elements.namedItem(n) as HTMLInputElement;

  // --- per-field mic: say one value, nothing else ---
  screen.querySelectorAll<HTMLButtonElement>('[data-mic]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.mic!;
      const input = field(name);
      if (!canListen()) {
        toast(t('homeVoiceUnavailable'));
        input.focus();
        return;
      }
      btn.classList.add('listening');
      btn.textContent = '●';
      try {
        const guesses = await listenAll(speechLocale, 8000);
        if (name === 'topics') {
          input.value = guesses[0];
        } else {
          // Take the first guess that actually contains a number — the
          // recogniser's top pick often does not.
          const hit = guesses.map(parseSingleNumber).find((v) => v != null);
          if (hit == null) {
            heard.hidden = false;
            heard.textContent = `${t('reportHeard')} “${guesses[0]}” — ${t('reportNoNumber')}`;
            input.focus();
            return;
          }
          input.value = String(hit);
        }
        heard.hidden = false;
        heard.textContent = `${t('reportHeard')} “${guesses[0]}”`;
      } catch {
        toast(t('homeVoiceUnavailable'));
        input.focus();
      } finally {
        btn.classList.remove('listening');
        btn.textContent = '🎤';
      }
    });
  });

  // --- whole-sentence mic ---
  const fillFrom = (parsed: Partial<DailyReport>) => {
    const set = (name: string, v: number | string | null | undefined) => {
      if (v === null || v === undefined || v === '') return;
      field(name).value = String(v);
    };
    set('present', parsed.presentCount);
    set('meals', parsed.mealsCount);
    set('checks', parsed.checksDone);
    set('topics', parsed.topicsTaught);
  };

  screen.querySelector('#voiceBtn')!.addEventListener('click', async () => {
    if (!canListen()) {
      heard.hidden = false;
      heard.textContent = t('homeVoiceUnavailable');
      return;
    }
    heard.hidden = false;
    heard.textContent = t('prepListening');
    try {
      const guesses = await listenAll(speechLocale, 12000);
      // Parse every guess, keep whichever filled the most fields.
      const best = guesses
        .map((g) => ({ g, p: parseReportSpeech(g) }))
        .sort((a, b) => score(b.p) - score(a.p))[0];
      fillFrom(best.p);
      heard.textContent =
        `${t('reportHeard')} “${best.g}”` + (score(best.p) === 0 ? ` — ${t('reportNoNumber')}` : '');
    } catch {
      heard.textContent = t('homeVoiceUnavailable');
    }
  });

  screen.querySelector('#demoBtn')!.addEventListener('click', () => {
    const sentence = SAMPLE_SENTENCE[lang === 'en' ? 'en' : 'hi'];
    fillFrom(parseReportSpeech(sentence));
    heard.hidden = false;
    heard.textContent = `${t('reportHeard')} “${sentence}”`;
  });

  /** The report as plain text — this is what reaches the head teacher. */
  const reportText = (): string => {
    const data = new FormData(form);
    const v = (n: string) => String(data.get(n) ?? '').trim() || '—';
    return [
      `${t('reportTitle')} — ${new Date().toLocaleDateString()}`,
      `${t('reportPresent')}: ${v('present')}`,
      `${t('reportMeals')}: ${v('meals')}`,
      `${t('reportChecks')}: ${v('checks')}`,
      `${t('reportTopics')}: ${v('topics')}`,
      v('notes') !== '—' ? `${t('reportNotes')}: ${v('notes')}` : '',
      '— PATA',
    ].filter(Boolean).join('\n');
  };

  // Hear the whole thing before submitting it. She has typed or dictated a
  // page of numbers and is about to send it to the head teacher; reading it
  // back is how you catch "thirty two" that was heard as "thirty two hundred"
  // without having to re-read a form in poor light at the end of the day.
  const readBtn = screen.querySelector<HTMLButtonElement>('#readBtn')!;
  readBtn.addEventListener('click', async () => {
    if (isReading()) {
      await stopReading();
      readBtn.innerHTML = `🔊 ${esc(t('readBack'))}`;
      return;
    }
    readBtn.innerHTML = `⏹ ${esc(t('stop'))}`;
    await readAloud(reportText(), lang, speechLocale);
    readBtn.innerHTML = `🔊 ${esc(t('readBack'))}`;
  });

  screen.querySelector('#shareBtn')!.addEventListener('click', async () => {
    const text = reportText();
    try {
      await Share.share({ title: t('reportTitle'), text, dialogTitle: t('reportShare') });
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast(t('reportShare'));
      } catch {
        toast(t('aiErrGeneric'));
      }
    }
  });

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
    holder.innerHTML = past.length
      ? `<h3>${esc(t('reportPast'))}</h3>
         <div class="list">
           ${past.slice(0, 7).map(
             (r) => `<div class="list-item static">
               <strong>${esc(r.date)}</strong>
               <span class="meta">${r.presentCount ?? '—'} · ${esc(t('reportChecks'))}: ${r.checksDone ?? '—'} · ${esc(r.topicsTaught)}</span>
             </div>`
           ).join('')}
         </div>`
      : '';
  };
  await renderPast();
}
