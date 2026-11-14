// Registro ninja (popup): Histórico, Livro Bingo, Relíquias e Conquistas.
import { type AchievementCategory } from '../src/core/achievements';
import { achievements } from '../src/data/achievements';
import { campaign } from '../src/data/campaign';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { lineages as allLineages } from '../src/data/lineages';
import { roletaVillains as villains } from '../src/data/roleta/villains';
import { ptBR as S } from '../src/data/strings/ptBR';
import { PLAYER_NAME_MAX, originRecords } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { achievementIcon } from './achievementIcons';
import { icon } from './art';
import { h, esc, openDialog } from './dom';
import { avatarButton, setPlayerName, openAvatarPicker, difficultyStats } from './gate';
import { relicCollection } from './jornada/relics';
import { data, foePortrait, villainName, stageName, originLabel, diffChip } from './roleta/common';
import { ses } from './roleta/session';

export type ProfileTab = 'history' | 'achievements' | 'bingo' | 'origins' | 'relics';
export type RegistryPage = 'history' | 'bingo' | 'relics' | 'achievements';
export type HistoryFilter = 'general' | 'origins' | 'difficulty';
/** Selo de cada seção do Registro: 歴 histórico, 功 conquistas, 手配 Livro Bingo (procurados), 宝 relíquias. */
export const REGISTRY_KANJI: Record<RegistryPage, string> = { history: '歴', achievements: '功', bingo: '手配', relics: '宝' };

/** Entradas antigas (barra superior, barra do Portão, faixa de Conquistas): Origens vira o filtro do Histórico. */
export function openProfile(tab: ProfileTab = 'history') {
  if (tab === 'origins') openRegistry('history', 'origins');
  else openRegistry(tab);
}

/**
 * Registro em popup (um padrão só, em todo lugar): uma seção por vez, num pergaminho com rolos. O Histórico filtra por
 * Geral, Origens e Dificuldade. O nome do jogador aparece no topo só no celular (no PC ele fica na Ficha do Início).
 */
export function openRegistry(page: RegistryPage, filter: HistoryFilter = 'general') {
  const D = S.ui.desk;
  const k = REGISTRY_KANJI[page];
  const overlay = h(`<div class="modal" aria-label="${D.nav[page]}"><div class="modal-body profile registry">
    <span class="scroll-roll t" aria-hidden="true"></span><span class="scroll-roll b" aria-hidden="true"></span>
    <div class="modal-head"><span class="seal${k.length > 1 ? ' two' : ''}" aria-hidden="true">${k}</span><h2>${D.nav[page]}</h2><button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></div>
    <div class="reg-id">${avatarButton('sm')}<label class="field profile-name reg-name"><span>${S.ui.playerName.label}</span><input type="text" data-player-name maxlength="${PLAYER_NAME_MAX}" autocomplete="nickname" placeholder="${S.ui.playerName.placeholder}" value="${esc(ses.profile.playerName ?? '')}"></label></div>
    ${page === 'history' ? `<div class="segmented desk-filters">${(['general', 'origins', 'difficulty'] as const).map((f) => `<button class="btn seg" data-filter="${f}" aria-pressed="${f === filter}">${D.filters[f]}</button>`).join('')}</div>` : ''}
    <div class="profile-body"></div></div></div>`);
  const body = overlay.querySelector<HTMLElement>('.profile-body')!;
  overlay.querySelector('[data-player-name]')!.addEventListener('change', (e) => setPlayerName((e.target as HTMLInputElement).value));
  overlay.querySelector('[data-avatar]')?.addEventListener('click', openAvatarPicker);
  const fill = (f: HistoryFilter) => {
    body.replaceChildren();
    if (page === 'history') {
      if (f === 'general') historyTab(body);
      else body.innerHTML = f === 'origins' ? originsTab() : difficultyStats();
    } else if (page === 'relics') relicCollection(body, ses.profile.relics);
    else body.innerHTML = page === 'bingo' ? bingoTab() : achievementsTab();
  };
  overlay.querySelector('.desk-filters')?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-filter]');
    if (!b) return;
    overlay.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    fill(b.dataset.filter as HistoryFilter);
  });
  // Escape, foco e o fim do listener ficam com openDialog (antes o keydown ficava preso quando goHome fechava a janela).
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('[data-close]')) overlay.remove();
  });
  fill(filter);
  openDialog(overlay);
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
  const counted = achievements.filter((a) => !a.legacy);
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
              <small class="muted">${date}${reached} · ${S.ui.revivesUsed(r.revivesUsed)}</small></li>`;
          })
          .join('')
      : `<li class="muted">${S.ui.historyEmpty}</li>`;
  };
  render(false);
  container.querySelector<HTMLInputElement>('#show-rerolls')!.addEventListener('change', (e) => {
    render((e.target as HTMLInputElement).checked);
  });
}
