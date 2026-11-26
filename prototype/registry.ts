// Páginas do Registro ninja: Histórico, Livro Bingo, Relíquias e Conquistas.
import { type AchievementCategory } from '../src/core/achievements';
import { achievements } from '../src/data/achievements';
import { campaign } from '../src/data/campaign';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { lineages as allLineages } from '../src/data/lineages';
import { roletaVillains as villains } from '../src/data/roleta/villains';
import { ptBR as S } from '../src/data/strings/ptBR';
import { loadJornada } from '../src/state/jornadaSave';
import { originRecords } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { achievementIcon } from './achievementIcons';
import { icon } from './art';
import { h, show } from './dom';
import { navigateGate, difficultyStats } from './gate';
import { relicCollection } from './jornada/relics';
import { data, foePortrait, villainName, stageName, originLabel, diffChip } from './roleta/common';
import { ses } from './roleta/session';

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
    if (page !== 'history') {
      body.innerHTML = page === 'bingo' ? bingoTab() : achievementsTab();
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
      : `<p class="muted">${D.historyEmpty[mode]}</p>`}${jornadaAchievementsSection(new Set(Object.keys(ses.profile.achievements)))}`;
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

export function bingoTab(): string {
  const P = S.profile;
  return `<p class="muted small">${P.bingoIntro}</p><ul class="bingo">${villains
    .map((v) => {
      const r = ses.profile.villains[v.id];
      if (!r || r.faced === 0) {
        return `<li class="bingo-card unknown">${foePortrait(v.id, 'sm')}<span><b>${P.unknownVillain}</b></span><span class="bingo-stamp kanji" aria-hidden="true">謎</span></li>`;
      }
      const lines = [P.faced(r.faced), P.defeated(r.defeated), r.killedYou ? P.killedYou(r.killedYou) : '']
        .filter(Boolean)
        .join(' · ');
      const stamp = r.defeated > 0 ? '<span class="bingo-stamp kanji" aria-hidden="true">勝</span>' : '';
      return `<li class="bingo-card${r.defeated > 0 ? ' beaten' : ''}">${foePortrait(v.id, 'sm')}<span><b>${villainName(v.id)}</b><small>${lines}</small>
        <small class="muted">${P.bestHit(r.bestHit)} · ${P.worstHit(r.worstHit)}</small></span>${stamp}</li>`;
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

  const render = (withRerolls: boolean) => {
    const shown = runs.filter((r) => withRerolls || r.status !== 'reroll');
    list.innerHTML = shown.length
      ? shown
          .map((r) => {
            const date = new Date(r.startedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const o = r.origin;
            const origin = `${originLabel(o)}${o.elements.map((e) => ` · ${S.elements[e]}`).join('')}${o.jinchuuriki ? ` · ${S.origin.jinchuuriki}` : ''}`;

            const stage = campaign[r.furthestStage];
            // Roleta enxuto: ciclo e lutas; registros antigos: a etapa da campanha.
            const reached =
              r.status === 'reroll'
                ? ''
                : r.fights !== undefined
                  ? ` · ${S.roleta.run.reached((r.cycle ?? 0) + 1, r.fights)}`
                  : r.status !== 'victory' && stage
                    ? ` · ${S.ui.reachedStage(stageName(stage))}`
                    : '';
            const diff = r.difficulty ? ` ${diffChip(r.difficulty)}` : '';
            return `<li><div class="row between"><b>${origin}</b><span>${diff} <span class="chip st-${r.status}">${S.ui.runStatus[r.status]}</span></span></div>
              <small class="muted">${date}${reached}${r.revivesUsed > 0 ? ` · ${S.ui.revivesUsed(r.revivesUsed)}` : ''}</small></li>`;
          })
          .join('')
      : `<li class="muted">${S.ui.historyEmpty}</li>`;
  };
  render(false);
  container.querySelector<HTMLInputElement>('#show-rerolls')!.addEventListener('change', (e) => {
    render((e.target as HTMLInputElement).checked);
  });
}
