// Páginas do Registro ninja: Histórico, Livro Bingo, Relíquias e Conquistas.
import { type AchievementCategory } from '../src/core/achievements';
import { achievements } from '../src/data/achievements';
import { campaign } from '../src/data/campaign';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { lineages as allLineages } from '../src/data/lineages';
import { ptBR as S } from '../src/data/strings/ptBR';
import { loadJornada } from '../src/state/jornadaSave';
import { originRecords } from '../src/state/profile';
import { storyStages } from '../src/core/jornada/run';
import { jornadaData } from '../src/data/jornada';
import { loadJornadaRuns, type JornadaRunRecord } from '../src/state/jornadaRuns';
import { loadRuns, type RunRecord } from '../src/state/runHistory';
import { achievementIcon } from './achievementIcons';
import { bingoPage } from './bingoSheet';
import { clanSymbol, icon } from './art';
import { esc, h, show } from './dom';
import { navigateGate, difficultyStats } from './gate';
import { relicCollection, relicName } from './jornada/relics';
import { data, foePortrait, villainName, stageName, originLabel, diffChip } from './roleta/common';
import { ses } from './roleta/session';
import { tip } from './tooltip';

export type ProfileTab = 'history' | 'achievements' | 'bingo' | 'origins' | 'relics';
export type RegistryPage = 'history' | 'bingo' | 'relics' | 'achievements';
export const registryPages: readonly RegistryPage[] = ['history', 'bingo', 'relics', 'achievements'];
export type HistoryMode = 'roleta' | 'story' | 'path';
export type HistoryFilter = 'general' | 'origins' | 'difficulty';
/** Selo de cada seção do Registro: 歴 histórico, 功 conquistas, 手配 Livro Bingo (procurados), 宝 relíquias. */
export const REGISTRY_KANJI: Record<RegistryPage, string> = { history: '歴', achievements: '功', bingo: '手配', relics: '宝' };

/** Os atalhos antigos de Origens continuam no filtro do Arcade. */
export function openProfile(tab: ProfileTab = 'history') {
  navigateGate(tab === 'origins' ? { page: 'history', filter: 'origins' } : { page: tab });
}

export function registryScreen(page: RegistryPage, filter: HistoryFilter = 'general', mode: HistoryMode = 'roleta'): HTMLElement {
  const D = S.ui.desk;
  const k = REGISTRY_KANJI[page];
  const root = show(h(`<section class="screen registry profile">
    <header class="registry-head"><span class="seal${k.length > 1 ? ' two' : ''}" aria-hidden="true">${k}</span>
      <h1>${D.nav[page]}</h1><button type="button" class="btn small" data-back>${S.ui.back}</button></header>
    <nav class="registry-tabs" aria-label="${D.nav.registry}">${registryPages.map(id =>
      `<button type="button" class="btn" data-page="${id}"${id === page ? ' aria-current="page"' : ''}>${D.nav[id]}</button>`).join('')}</nav>
    ${page === 'history' ? `<div class="history-modes segmented" role="group" aria-label="${S.jornada.modes.title}">${(['roleta', 'story', 'path'] as const).map(id =>
      `<button type="button" class="btn seg" data-mode="${id}" aria-pressed="${id === mode}">${D.nav[id]}</button>`).join('')}</div>
      <div class="desk-filters segmented" role="group" aria-label="${D.nav.roleta}">${(['general', 'origins', 'difficulty'] as const).map(id =>
      `<button type="button" class="btn seg" data-filter="${id}" aria-pressed="${id === filter}">${D.filters[id]}</button>`).join('')}</div>` : ''}
    <div class="profile-body"></div></section>`));
  const body = root.querySelector<HTMLElement>('.profile-body')!;
  const fill = () => {
    body.replaceChildren();
    if (page === 'relics') return relicCollection(body, ses.profile.relics);
    if (page === 'bingo') return bingoPage(body);
    if (page !== 'history') {
      body.innerHTML = achievementsTab();
      return;
    }
    root.querySelector<HTMLElement>('.desk-filters')!.hidden = mode !== 'roleta';
    if (mode === 'roleta') {
      if (filter === 'general') historyTab(body);
      else body.innerHTML = filter === 'origins' ? originsTab() : difficultyStats();
      return;
    }
    const saved = loadJornada(ses.storage);
    const matching = saved && saved.mode === (mode === 'story' ? 'canon' : 'generic');
    const best = mode === 'path' && ses.profile.jornada?.generic;
    const record = mode === 'path' ? `<p><b>${D.campaignRecord}</b> · ${best ? D.campaignResult(best.cycle, best.stage, best.won) : D.none}</p>` : '';
    body.innerHTML = `${record}${matching
      ? `<div class="registry-save"><strong>${D.savedStop(saved.stageIndex + 1, saved.stopIndex + 1)}</strong><button type="button" class="btn primary" data-choice="continue">${S.ui.continue}</button></div>`
      : `<p class="muted">${D.historyEmpty[mode]}</p>`}${jornadaHistory(mode)}${jornadaAchievementsSection(new Set(Object.keys(ses.profile.achievements)))}`;
    const list = body.querySelector<HTMLElement>('.history');
    if (list) bindRunRows(list);
  };
  root.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.hasAttribute('data-back')) return navigateGate({ page: 'home' });
    if (button.dataset.page) return navigateGate({ page: button.dataset.page as RegistryPage });
    if (button.dataset.choice === 'continue') return navigateGate({ mode, resume: true });
    if (button.dataset.mode) mode = button.dataset.mode as HistoryMode;
    else if (button.dataset.filter) filter = button.dataset.filter as HistoryFilter;
    else return;
    root.querySelectorAll<HTMLElement>('[data-mode], [data-filter]').forEach(el =>
      el.setAttribute('aria-pressed', String(el.dataset.mode === mode || el.dataset.filter === filter)));
    fill();
  });
  fill();
  return root;
}

/** Selo da conquista: o ícone dela num selo dourado quando liberada; contorno com cadeado quando não. */
export const achSeal = (on: boolean, id: string) =>
  on ? `<span class="ach-ico seal gold" aria-hidden="true">${achievementIcon(id)}</span>` : `<span class="ach-ico seal ghost" aria-hidden="true">${icon('lock')}</span>`;

export function achievementsTab(): string {
  const A = S.achievements;
  const unlocked = new Set(Object.keys(ses.profile.achievements));
  const cats: AchievementCategory[] = ['milestone', 'luck', 'style', 'secret'];
  // Clássicas (mecânica que saiu do Roleta) só aparecem para quem já tem, e não contam no total.
  const shown = achievements.filter((a) => !a.legacy || unlocked.has(a.id));
  // O total soma as da Jornada (seção no fim da página), como a ficha do Início: antes aqui dava 0 de 45 e lá 0/64.
  const counted = [...achievements.filter((a) => !a.legacy), ...jornadaAchievements];
  const got = counted.filter((a) => unlocked.has(a.id)).length;
  return `<p class="muted small center">${A.count(got, counted.length)}</p>${cats
    .map((cat) => {
      const list = shown.filter((a) => a.category === cat);
      const n = list.filter((a) => unlocked.has(a.id)).length;
      return `<h3 class="ach-cat">${A.categories[cat]} <small class="muted">${A.progress(n, list.length)}</small></h3><ul class="ach-list">${list
        .map((a) => {
          const on = unlocked.has(a.id);
          const txt = !on && a.hidden ? { name: A.hiddenName, desc: A.hiddenDesc } : A.list[a.id] ?? { name: a.id, desc: '' };
          const prog = !on && a.progress ? ` <small class="muted">${A.progress(...a.progress(unlocked))}</small>` : '';
          return `<li class="ach ${on ? 'on' : 'off'}">${achSeal(on, a.id)}<span><b>${txt.name}</b>${prog}<small>${txt.desc}</small></span></li>`;
        })
        .join('')}</ul>`;
    })
    .join('')}${jornadaAchievementsSection(unlocked)}`;
}

/** Conquistas da Jornada: mesma aba, categoria própria (docs/base/perfil.md#categorias). */
export function jornadaAchievementsSection(unlocked: ReadonlySet<string>): string {
  const A = S.achievements;
  const JA = S.jornada.achievements;
  const n = jornadaAchievements.filter((a) => unlocked.has(a.id)).length;
  return `<h3 class="ach-cat">${JA.category} <small class="muted">${A.progress(n, jornadaAchievements.length)}</small></h3><ul class="ach-list">${jornadaAchievements
    .map((a) => {
      const on = unlocked.has(a.id);
      const txt = !on && a.hidden ? { name: A.hiddenName, desc: A.hiddenDesc } : JA.list[a.id] ?? { name: a.id, desc: '' };
      return `<li class="ach ${on ? 'on' : 'off'}">${achSeal(on, a.id)}<span><b>${txt.name}</b><small>${txt.desc}</small></span></li>`;
    })
    .join('')}</ul>`;
}

export function originsTab(): string {
  const P = S.profile;
  const rec = originRecords(loadRuns(ses.storage));
  // Linhagem fora do sorteio só aparece para quem jogou com ela.
  const lineages = allLineages.filter((l) => data.lineages.some((x) => x.id === l.id) || rec[l.id]);
  return `<p class="muted small">${P.originsIntro}</p><ul class="history">${lineages
    .map((l) => {
      const r = rec[l.id];
      const name = l.id === 'common' ? S.origin.common : S.lineages[l.id] ?? l.id;
      if (!r) return `<li><div class="row between"><b>${name}</b><small class="muted">${P.neverPlayed}</small></div></li>`;
      const pct = Math.round((r.wins / r.runs) * 100);
      const stage = campaign[r.furthestStage];
      const far = r.wins > 0 ? S.ui.runStatus.victory : r.bestFights >= 0 ? S.roleta.run.reached(1, r.bestFights) : stage ? P.furthest(stageName(stage)) : '';
      return `<li><div class="row between"><b>${name}</b><b>${P.winRate(pct)}</b></div>
        <small class="muted">${P.originLine(r.runs, r.wins)} · ${far}</small></li>`;
    })
    .join('')}</ul>`;
}

export function historyTab(container: HTMLElement) {
  const runs = loadRuns(ses.storage);
  container.innerHTML = `<label class="toggle"><input type="checkbox" id="show-rerolls"> ${S.ui.showRerolls}</label>
    <ul class="history"></ul>`;
  const list = container.querySelector<HTMLElement>('.history')!;
  bindRunRows(list);

  const render = (withRerolls: boolean) => {
    const shown = runs.filter((r) => withRerolls || r.status !== 'reroll');
    list.innerHTML = shown.length
      ? shown
          .map((r, i) => {
            const o = r.origin;
            const origin = `${originLabel(o)}${o.elements.map((e) => ` · ${S.elements[e]}`).join('')}${o.jinchuuriki ? ` · ${S.origin.jinchuuriki}` : ''}`;
            const stage = campaign[r.furthestStage];
            // Roleta enxuto: ciclo e lutas; registros antigos: a etapa da campanha.
            const reached =
              r.status === 'reroll'
                ? ''
                : r.fights !== undefined
                  ? S.roleta.run.reached((r.cycle ?? 0) + 1, r.fights)
                  : r.status !== 'victory' && stage
                    ? S.ui.reachedStage(stageName(stage))
                    : '';
            const line = [runDate(r.startedAt), reached, r.revivesUsed > 0 ? S.ui.revivesUsed(r.revivesUsed) : ''].filter(Boolean).join(' · ');
            const tags = `${r.difficulty ? diffChip(r.difficulty) : ''} <span class="chip st-${r.status}">${S.ui.runStatus[r.status]}</span>`;
            return runRow(`r${i}`, clanSymbol(o.lineageId), 'roleta', origin, line, tags, roletaDetails(r, origin, reached));
          })
          .join('')
      : `<li class="muted">${S.ui.historyEmpty}</li>`;
  };
  render(false);
  container.querySelector<HTMLInputElement>('#show-rerolls')!.addEventListener('change', (e) => {
    render((e.target as HTMLInputElement).checked);
  });
}

const runDate = (iso: string) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');

/** Ícone de cada modo na linha do Histórico (os mesmos da navegação). */
const MODE_ICONS: Record<HistoryMode, string> = { roleta: 'fortuneWheel', story: 'navScroll', path: 'navRoute' };

/**
 * Linha do Histórico: o cabeçalho é um botão que abre os detalhes (`aria-expanded`), com o símbolo da origem ou da
 * classe, o ícone do modo, o nome, a linha curta e os chips de dificuldade e resultado.
 */
function runRow(id: string, symbol: string, mode: HistoryMode, title: string, line: string, tags: string, details: string): string {
  return `<li class="run-row"><button type="button" class="run-head" aria-expanded="false" aria-controls="run-${id}">
      <span class="run-sym" aria-hidden="true">${symbol}<span class="run-mode">${icon(MODE_ICONS[mode])}</span></span>
      <span class="run-main"><b>${title}</b><small class="muted">${line}</small></span>
      <span class="run-tags">${tags}</span><span class="run-caret" aria-hidden="true">${icon('chevron')}</span></button>
    <div class="run-details" id="run-${id}" role="region" aria-label="${S.profile.run.details}" hidden>${details}</div></li>`;
}

/** Abre e fecha a linha tocada (mais de uma pode ficar aberta, para comparar runs). */
function bindRunRows(list: HTMLElement) {
  list.addEventListener('click', (event) => {
    const head = (event.target as HTMLElement).closest<HTMLButtonElement>('.run-head');
    if (!head) return;
    const open = head.getAttribute('aria-expanded') !== 'true';
    head.setAttribute('aria-expanded', String(open));
    head.closest('.run-row')!.classList.toggle('open', open);
    list.querySelector<HTMLElement>(`#${head.getAttribute('aria-controls')}`)!.hidden = !open;
  });
}

const fact = (label: string, value: string) => (value ? `<dt>${label}</dt><dd>${value}</dd>` : '');
const relicList = (ids: readonly string[] | undefined) => (ids?.length ? ids.map((id) => esc(relicName(id))).join(', ') : S.profile.run.none);

function roletaDetails(r: RunRecord, origin: string, reached: string): string {
  const R = S.profile.run;
  if (r.status === 'reroll') return `<p class="muted small">${R.oldRecord}</p>`;
  const old = r.foes === undefined;
  const foes = r.foes?.length
    ? `<ol class="run-foes">${r.foes
        .map(
          (f) =>
            `<li class="${f.won ? 'won' : 'lost'}"${tip(villainName(f.id), f.won ? R.won : R.lost)}>${foePortrait(f.id, 'sm')}<span class="run-foe-mark" aria-hidden="true">${icon(f.won ? 'check' : 'close')}</span><span class="sr-only">${villainName(f.id)}: ${f.won ? R.won : R.lost}</span></li>`,
        )
        .join('')}</ol>`
    : '';
  const events =
    r.events && Object.keys(r.events).length
      ? Object.entries(r.events)
          .map(([id, n]) => `${S.events[id]?.name ?? id}${n > 1 ? ` ×${n}` : ''}`)
          .join(', ')
      : R.none;
  const facts = [
    fact(R.origin, origin),
    fact(R.difficulty, r.difficulty ? S.difficulty[r.difficulty].name : ''),
    fact(R.reached, reached),
    old ? '' : fact(R.fallenTo, r.fallenTo ? villainName(r.fallenTo) : ''),
    old ? '' : fact(R.relics, relicList(r.relics)),
    old ? '' : fact(R.events, events),
    old ? '' : fact(R.bestHit, String(r.bestHit ?? 0)),
    fact(R.revives, String(r.revivesUsed)),
    fact(R.date, runDate(r.startedAt)),
    fact(R.seed, r.seed !== undefined ? String(r.seed) : ''),
  ].join('');
  return `<dl class="run-facts">${facts}</dl>${foes ? `<h4 class="run-sub">${R.foes}</h4>${foes}` : ''}${old ? `<p class="muted small">${R.oldRecord}</p>` : ''}`;
}

/** Clã do protagonista da Jornada: o Naruto é Uzumaki, o Sasuke é Uchiha; no Caminho Ninja, a classe. */
const jornadaClan = (r: JornadaRunRecord) => (r.hero === 'naruto' ? 'uzumaki' : r.hero === 'sasuke' ? 'uchiha' : r.classId === 'common' ? null : r.classId);

function jornadaStageName(r: JornadaRunRecord): string {
  const stages = r.mode === 'generic' ? jornadaData.generic.stages : storyStages({ campaign: r.campaign }, jornadaData);
  const id = stages[r.stageIndex]?.id;
  return id ? S.jornada.stages[id] ?? id : '';
}

/** As runs terminadas da História ou da Campanha (`jornada_runs_v1`), mais recente primeiro. */
export function jornadaHistory(mode: 'story' | 'path'): string {
  const R = S.profile.run;
  const J = S.jornada;
  const runs = loadJornadaRuns(ses.storage).filter((r) => r.mode === (mode === 'story' ? 'canon' : 'generic'));
  if (!runs.length) return `<p class="muted">${R.empty[mode]}</p>`;
  return `<h3 class="run-sub">${R.finished}</h3><ul class="history">${runs
    .map((r, i) => {
      const hero = J.names[r.hero] ?? r.hero;
      const klass = r.mode === 'generic' ? J.genericStart.classes[r.classId]?.name ?? r.classId : '';
      const element = [r.element, r.secondElement]
        .filter((e): e is NonNullable<typeof e> => Boolean(e))
        .map((e) => S.elements[e])
        .join(' · ');
      const title = [r.mode === 'generic' ? klass : hero, element].filter(Boolean).join(' · ');
      const reached = R.stage(r.cycle + 1, r.stageIndex + 1, r.stopIndex + 1, jornadaStageName(r));
      const line = [runDate(r.updatedAt), reached].filter(Boolean).join(' · ');
      const tags = `${diffChip(r.difficulty)} <span class="chip st-${r.status}">${S.ui.runStatus[r.status]}</span>`;
      const facts = [
        fact(R.hero, hero),
        fact(R.klass, klass),
        fact(R.element, element),
        fact(R.difficulty, S.difficulty[r.difficulty].name),
        fact(R.reached, reached),
        fact(R.level, String(r.level)),
        fact(R.foes, R.fights(r.fights, r.wins)),
        fact(R.alliesLost, String(r.alliesLost)),
        fact(R.bestHit, String(r.bestHit)),
        fact(R.relics, relicList(r.relics)),
        fact(R.date, runDate(r.startedAt)),
      ].join('');
      return runRow(`${mode}${i}`, clanSymbol(jornadaClan(r)), mode, title, line, tags, `<dl class="run-facts">${facts}</dl>`);
    })
    .join('')}</ul>`;
}
