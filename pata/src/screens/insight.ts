// Content-level aggregation only: topics ranked by confusion, class → school →
// district. Zero teacher-identifying fields on this screen or in its data
// model (hard rule 4, C6). Data flows up as a by-product, about content.
import { allActions, allChecks } from '../db';
import { bi, t } from '../i18n';
import { SAMPLE_AGGREGATES } from '../seed';
import type { Bi, CheckRecord } from '../types';
import { el, esc } from '../ui';

interface TopicAgg {
  topicLabel: Bi;
  checks: number;
  confusedPct: number;
  topMisconception: Bi | null;
}

function aggregateClass(checks: CheckRecord[]): TopicAgg[] {
  const byTopic = new Map<string, CheckRecord[]>();
  for (const c of checks) {
    if (!byTopic.has(c.topicKey)) byTopic.set(c.topicKey, []);
    byTopic.get(c.topicKey)!.push(c);
  }
  const rows: TopicAgg[] = [];
  for (const group of byTopic.values()) {
    const pcts = group.map((c) => {
      const total = c.understoodIds.length + c.notUnderstoodIds.length;
      return total ? (c.notUnderstoodIds.length / total) * 100 : 0;
    });
    const misCount = new Map<string, { mis: Bi; n: number }>();
    for (const c of group) {
      if (!c.misconception) continue;
      const key = c.misconception.en;
      const row = misCount.get(key) ?? { mis: c.misconception, n: 0 };
      row.n++;
      misCount.set(key, row);
    }
    const top = [...misCount.values()].sort((a, b) => b.n - a.n)[0];
    rows.push({
      topicLabel: group[0].topicLabel,
      checks: group.length,
      confusedPct: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      topMisconception: top?.mis ?? null,
    });
  }
  return rows.sort((a, b) => b.confusedPct - a.confusedPct);
}

function barRow(label: string, sub: string, pct: number, checks: number): string {
  return `
    <div class="agg-row">
      <div class="agg-top">
        <strong>${esc(label)}</strong>
        <span class="agg-pct">${pct}<small>%</small></span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${Math.min(pct, 100)}%"></div></div>
      <div class="agg-sub">
        <span>${checks} ${esc(t('insightChecks'))}</span>
        ${sub ? `<span class="mis-small">${esc(t('insightTopMis'))}: ${esc(sub)}</span>` : ''}
      </div>
    </div>`;
}

export async function renderInsight(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const [checks, actions] = await Promise.all([allChecks(), allActions()]);

  const screen = el(`
    <div>
      <h1>${esc(t('insightTitle'))}</h1>
      <p class="sub">${esc(t('insightSub'))}</p>
      <div class="tabs" id="scopeTabs">
        <button class="tab active" data-scope="class">${esc(t('insightClass'))}</button>
        <button class="tab" data-scope="school">${esc(t('insightSchool'))}</button>
        <button class="tab" data-scope="district">${esc(t('insightDistrict'))}</button>
      </div>
      <div id="aggHolder"></div>
      <div id="actionsHolder"></div>
      <p class="note privacy">${esc(t('insightPrivacy'))}</p>
    </div>`);
  root.appendChild(screen);

  const holder = screen.querySelector('#aggHolder')!;

  const renderScope = (scope: 'class' | 'school' | 'district') => {
    if (scope === 'class') {
      const rows = aggregateClass(checks);
      holder.innerHTML = rows.length
        ? rows.map((r) => barRow(bi(r.topicLabel), r.topMisconception ? bi(r.topMisconception) : '', r.confusedPct, r.checks)).join('')
        : `<p class="note">${esc(t('insightNoData'))}</p>`;
    } else {
      const rows = SAMPLE_AGGREGATES.filter((r) => r.scope === scope);
      holder.innerHTML =
        `<p class="tiny">${esc(t('insightAggNote'))}</p>` +
        rows
          .sort((a, b) => b.confusedPct - a.confusedPct)
          .map((r) => barRow(`${bi(r.topicLabel)} · ${esc(t('grade'))} ${r.grade}`, bi(r.topMisconception), r.confusedPct, r.checks))
          .join('');
    }
  };
  renderScope('class');

  screen.querySelectorAll<HTMLElement>('[data-scope]').forEach((tab) =>
    tab.addEventListener('click', () => {
      screen.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === tab));
      renderScope(tab.dataset.scope as 'class' | 'school' | 'district');
    })
  );

  // §9 — surface what the teacher actually chose after each result.
  if (actions.length) {
    const counts = { pair: 0, home: 0, reteach: 0, none: 0 };
    for (const a of actions) counts[a.action]++;
    screen.querySelector('#actionsHolder')!.innerHTML = `
      <h3>${esc(t('insightActions'))}</h3>
      <div class="action-counts">
        <span>${esc(t('actPair'))}: <b>${counts.pair}</b></span>
        <span>${esc(t('actHome'))}: <b>${counts.home}</b></span>
        <span>${esc(t('actReteach'))}: <b>${counts.reteach}</b></span>
      </div>`;
  }
}
