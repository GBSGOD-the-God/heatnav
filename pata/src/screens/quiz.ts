// The quiz a child takes after they think they have understood.
//
// Five questions, one at a time, multiple choice. Get one right and the next
// is harder; get one wrong and the next is easier — so a child who has the
// idea is stretched instead of bored, and a child who has not is taken back to
// something they can do instead of being drowned. Both of those matter more
// than the score.
//
// What is recorded is not just how many they got. Every wrong answer in this
// app encodes a NAMED misconception (§4), and generated ones are computed by
// actually making that mistake — so the result tells the teacher which error
// the child is making, not merely that they got three out of five.
import { getCheck, getSettings, saveResult, uid } from '../db';
import { BANK } from '../bank';
import { getLang, t, translate } from '../i18n';
import { langDef } from '../packs';
import {
  makeQuestion, makeRng, nextLevel, QUIZ_LENGTH, START_LEVEL,
  type QuizOption, type QuizQuestion,
} from '../quiz';
import { currentStudent, getSession } from '../session';
import { pushPending, queueForSync } from '../sync';
import type { Bi, QuizAnswer, QuizResult } from '../types';
import { el, esc, go } from '../ui';
import { isReading, readAloud, stopReading } from '../voice';

export async function renderQuiz(root: HTMLElement, params: URLSearchParams): Promise<void> {
  root.innerHTML = '';
  await getSettings();
  const lang = getLang();
  const speechLocale = langDef(lang).speech;
  const me = await currentStudent();
  const session = await getSession();

  if (!me || session?.role !== 'student') {
    root.appendChild(el(`<div class="empty"><p>${esc(t('loginFailed'))}</p></div>`));
    return;
  }

  const topicKey = params.get('topic') ?? '';
  const assignmentId = params.get('a');
  // The label in every language we have it, from the record itself rather than
  // from the URL that got us here.
  const check = params.get('check') ? await getCheck(params.get('check')!) : undefined;
  const topicLabel: Bi =
    check?.topicLabel
    ?? BANK.find((b) => b.key === topicKey)?.label
    ?? { hi: topicKey, en: topicKey };

  // Seeded once per attempt: reloading the page gives the same question back
  // rather than a fresh one to shop around for.
  const seed = Number(params.get('seed')) || Date.now();
  const rnd = makeRng(seed);

  const answers: QuizAnswer[] = [];
  let level = START_LEVEL;
  let index = 0;
  let peak = 0;

  const screen = el(`
    <div class="quiz">
      <div class="quiz-head">
        <p class="quiz-topic">${esc(translate(topicLabel) || t('quizTitle'))}</p>
        <div class="quiz-dots" id="dots"></div>
      </div>
      <div id="stage"></div>
    </div>`);
  root.appendChild(screen);

  const dots = screen.querySelector('#dots')!;
  const stage = screen.querySelector<HTMLElement>('#stage')!;

  const paintDots = () => {
    dots.innerHTML = Array.from({ length: QUIZ_LENGTH }, (_, i) => {
      const a = answers[i];
      const cls = a ? (a.correct ? 'dot good' : 'dot bad') : i === index ? 'dot now' : 'dot';
      return `<span class="${cls}"></span>`;
    }).join('');
  };

  const finish = async () => {
    const correct = answers.filter((a) => a.correct).length;
    const result: QuizResult = {
      id: uid(),
      assignmentId,
      studentId: me.id,
      studentName: me.name,
      topicKey,
      topicLabel,
      correct,
      total: answers.length,
      peakLevel: peak,
      answers,
      seen: false,
      ts: Date.now(),
    };
    await saveResult(result);
    // Local first, network second. If the teacher is on this same phone the
    // result is already where it needs to be; if she is not, this hands it
    // over — and if that fails it stays queued for the next time.
    await queueForSync(result);
    void pushPending(me.school);

    // What went wrong, not just how much. If the same misconception came up
    // more than once, that is the thing to say — to the child too, not only
    // to the teacher.
    const counts = new Map<string, { n: number; mis: Bi }>();
    for (const a of answers) {
      if (!a.misconception) continue;
      const k = a.misconception.en;
      counts.set(k, { n: (counts.get(k)?.n ?? 0) + 1, mis: a.misconception });
    }
    const worst = [...counts.values()].sort((x, y) => y.n - x.n)[0];

    const verdict = correct >= 4 ? 'quizGreat' : correct >= 2 ? 'quizOk' : 'quizKeep';
    stage.innerHTML = `
      <div class="quiz-done">
        <p class="quiz-score">${correct} / ${answers.length}</p>
        <p class="verdict ${correct >= 4 ? 'good' : ''}">${esc(t(verdict))}</p>
        ${worst ? `<div class="paper">
          <p class="tiny">${esc(t('quizWatch'))}</p>
          <p>${esc(translate(worst.mis))}</p>
        </div>` : ''}
        <p class="tiny center">${esc(t('quizSent'))}</p>
        <div class="row">
          <button class="btn primary big" id="againBtn">${esc(t('quizAgain'))}</button>
          <button class="btn big" id="doneBtn">${esc(t('quizDone'))}</button>
        </div>
      </div>`;
    paintDots();
    stage.querySelector('#againBtn')!.addEventListener('click', () => {
      const q = new URLSearchParams(params);
      q.set('seed', String(Date.now()));
      go('/quiz?' + q.toString());
    });
    stage.querySelector('#doneBtn')!.addEventListener('click', () => go('/my'));
  };

  const ask = () => {
    if (index >= QUIZ_LENGTH) return void finish();

    const question = makeQuestion(topicKey, level, lang, rnd);
    if (!question) return void finish(); // nothing we can ask honestly — stop

    paintDots();
    stage.innerHTML = '';
    stage.appendChild(questionCard(question, index, (chosen) => {
      answers.push({
        level: question.level,
        correct: chosen.correct,
        misconception: chosen.correct ? null : chosen.misconception,
      });
      if (chosen.correct) peak = Math.max(peak, question.level);
      level = nextLevel(level, chosen.correct);
      index++;
    }, () => ask(), lang, speechLocale));
  };

  ask();
}

/**
 * One question. The answer is revealed before moving on — a quiz a child never
 * sees the answers to teaches nothing — and when they get it wrong the
 * misconception behind the option they PICKED is named, in their language.
 */
function questionCard(
  question: QuizQuestion,
  index: number,
  record: (chosen: QuizOption) => void,
  next: () => void,
  lang: ReturnType<typeof getLang>,
  speechLocale: string
): HTMLElement {
  const card = el(`
    <div class="quiz-card">
      <div class="row spread">
        <p class="quiz-count">${index + 1} / ${QUIZ_LENGTH}</p>
        <button class="btn small" data-listen aria-label="${esc(t('readBack'))}">🔊</button>
      </div>
      <p class="quiz-stem">${esc(question.stem)}</p>
      <div class="quiz-options">
        ${question.options.map((o, i) =>
          `<button class="quiz-opt" data-opt="${i}"><span class="opt-key">${'ABCD'[i]}</span> ${esc(o.text)}</button>`
        ).join('')}
      </div>
      <div id="after"></div>
    </div>`);

  const after = card.querySelector<HTMLElement>('#after')!;

  card.querySelector('[data-listen]')!.addEventListener('click', async () => {
    if (isReading()) return void stopReading();
    const spoken = [question.stem, ...question.options.map((o, i) => `${'ABCD'[i]}. ${o.text}`)].join('. ');
    await readAloud(spoken, lang, speechLocale);
  });

  let answered = false;
  card.querySelectorAll<HTMLButtonElement>('[data-opt]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const chosen = question.options[Number(btn.dataset.opt)];
      record(chosen);

      card.querySelectorAll<HTMLButtonElement>('[data-opt]').forEach((b, i) => {
        b.disabled = true;
        if (question.options[i].correct) b.classList.add('right');
        else if (b === btn) b.classList.add('wrong');
      });

      after.innerHTML = `
        <p class="verdict ${chosen.correct ? 'good' : ''}">
          ${esc(t(chosen.correct ? 'quizRight' : 'quizWrong'))}
        </p>
        ${!chosen.correct && chosen.misconception
          ? `<p class="gap-mis">${esc(translate(chosen.misconception))}</p>` : ''}
        <button class="btn primary big" id="nextBtn">${esc(t('quizNext'))}</button>`;
      after.querySelector('#nextBtn')!.addEventListener('click', () => { void stopReading(); next(); });
      after.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
  );

  return card;
}
