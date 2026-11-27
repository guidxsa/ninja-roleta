// Livro Bingo do Registro (docs/base/perfil.md#livro-bingo): seções Arcade, História e Campanha, e a ficha de cada
// inimigo já visto. No celular a ficha abre em tela cheia (janela: voltar, Esc e o voltar do navegador fecham); no
// desktop, num painel ao lado da lista.
import { pathFoeGroups, storyFoeGroups, type FoeTier } from '../src/core/jornada/foes';
import type { Element, VillainDef } from '../src/core/types';
import { jornadaData } from '../src/data/jornada';
import { enemiesById } from '../src/data/jornada/enemies';
import { jTechniquesById } from '../src/data/jornada/techniques';
import { roletaCategories, roletaVillainsById } from '../src/data/roleta/villains';
import { foeDescs } from '../src/data/strings/bingo';
import { ptBR as S } from '../src/data/strings/ptBR';
import type { VillainRecord } from '../src/state/profile';
import { fighterPortrait, icon, sceneImage } from './art';
import { h, openDialog } from './dom';
import { elChip, foePortrait, techName, villainName } from './roleta/common';
import { villainPassiveChips } from './roleta/screens/battle';
import { ses } from './roleta/session';
import { tip } from './tooltip';

export type BingoMode = 'roleta' | 'story' | 'path';
const MODES: readonly BingoMode[] = ['roleta', 'story', 'path'];

/** Fundo da ficha (lote 2 de imagens): o arco da História, o estágio equivalente da Campanha ou o cartaz do Arcade. */
const THEMES: Record<string, string> = { waves: 'ondas', exam: 'exame', sannin: 'sannin', retrieval: 'resgate', g1: 'ondas', g2: 'exame', g3: 'sannin' };
/** Grau do vilão do Arcade pela categoria: genin é comum, chunin e jounin são elite, o chefe é chefe. */
const ARCADE_TIER: Record<string, FoeTier> = { genin: 'common', chunin: 'elite', jounin: 'elite', boss: 'boss' };

interface Foe {
  id: string;
  mode: BingoMode;
  group: string;
  tier: FoeTier;
  theme: string;
}

const isEnemy = (id: string) => Boolean(enemiesById[id]);

function sections(mode: BingoMode): { id: string; name: string; foes: Foe[] }[] {
  if (mode === 'roleta') {
    return Object.entries(roletaCategories).map(([cat, ids]) => ({
      id: cat,
      name: S.roleta.run.categories[cat] ?? cat,
      foes: ids.filter((id) => roletaVillainsById[id]).map((id) => ({ id, mode, group: cat, tier: ARCADE_TIER[cat] ?? 'common', theme: 'arcade' })),
    }));
  }
  const groups = mode === 'story' ? storyFoeGroups(jornadaData.stages, isEnemy) : pathFoeGroups(jornadaData.generic, isEnemy);
  return groups.map((g) => ({
    id: g.id,
    name: S.jornada.stages[g.id] ?? g.id,
    foes: g.foes.map((f) => ({ id: f.id, mode, group: g.id, tier: f.tier, theme: THEMES[g.id] ?? 'arcade' })),
  }));
}

const recordOf = (foe: Pick<Foe, 'id' | 'mode'>): VillainRecord | undefined =>
  (foe.mode === 'roleta' ? ses.profile.villains : ses.profile.jornadaFoes ?? {})[foe.id];
const seen = (foe: Pick<Foe, 'id' | 'mode'>) => (recordOf(foe)?.faced ?? 0) > 0;

const foeName = (foe: Pick<Foe, 'id' | 'mode'>) => (foe.mode === 'roleta' ? villainName(foe.id) : S.jornada.names[foe.id] ?? foe.id);
function foeFace(foe: Pick<Foe, 'id' | 'mode'>, size: 'sm' | 'md' | 'lg'): string {
  if (foe.mode === 'roleta') return foePortrait(foe.id, size);
  const def = enemiesById[foe.id];
  return fighterPortrait(foe.id, def?.portrait ?? 'ninja:thug', size);
}

/** Cartão da lista: o visto é um botão que abre a ficha; o que nunca apareceu fica na sombra, com 謎. */
function card(foe: Foe): string {
  const P = S.profile;
  const r = recordOf(foe);
  if (!r || r.faced === 0) {
    return `<li class="bingo-card unknown">${foeFace(foe, 'sm')}<span><b>${P.unknownVillain}</b></span><span class="bingo-stamp kanji" aria-hidden="true">謎</span></li>`;
  }
  const lines = [P.faced(r.faced), P.defeated(r.defeated), r.killedYou ? P.killedYou(r.killedYou) : ''].filter(Boolean).join(' · ');
  const stamp = r.defeated > 0 ? '<span class="bingo-stamp kanji" aria-hidden="true">勝</span>' : '';
  return `<li class="bingo-card seen${r.defeated > 0 ? ' beaten' : ''}" data-tier="${foe.tier}"><button type="button" class="bingo-open" data-foe="${foe.id}" data-group="${foe.group}" aria-haspopup="dialog">
      ${foeFace(foe, 'sm')}<span class="bingo-text"><b>${foeName(foe)}</b><small>${lines}</small></span>${stamp}</button></li>`;
}

interface SheetStats {
  hp: number;
  chakra: number;
  speed: number;
  offense: { taijutsu: number; ninjutsu: number; genjutsu: number };
  resistance: { physical: number; mental: number };
  element: Element | null;
  techniques: { id: string; type: string; baseDamage: number; chakraCost: number; hits?: number }[];
  passive: string;
}

function statsOf(foe: Foe): SheetStats | null {
  const B = S.profile.bingo;
  if (foe.mode === 'roleta') {
    const v: VillainDef | undefined = roletaVillainsById[foe.id];
    if (!v) return null;
    return { ...v, techniques: v.techniques, passive: villainPassiveChips(v) };
  }
  const e = enemiesById[foe.id];
  if (!e) return null;
  const p = e.passive;
  const passive = !p ? '' : p.kind === 'enrage' ? B.enrage(Math.round(p.atPct * 100), p.damageMult) : B.startShield(Math.round(p.pct * 100));
  const techniques = e.techniques.map((id) => jTechniquesById[id]).filter((t): t is NonNullable<typeof t> => Boolean(t));
  return { ...e, techniques, passive: passive ? `<p class="small">${passive}</p>` : '' };
}

/** A ficha: retrato grande, nome, descrição, técnicas, atributos, passiva e os números do jogador contra ele. */
function sheet(foe: Foe): string {
  const P = S.profile;
  const B = P.bingo;
  const r = recordOf(foe)!;
  const st = statsOf(foe);
  const techName_ = (id: string) => (foe.mode === 'roleta' ? techName(id) : S.jornada.techniques[id] ?? id);
  const techs = st?.techniques.length
    ? `<ul class="sheet-techs">${st.techniques
        .map((t) => {
          const type = S.tips.types[t.type]?.name ?? t.type;
          return `<li${tip(techName_(t.id), B.techTip(type, t.baseDamage, t.chakraCost, t.hits ?? 1))}>${icon(t.type in S.tips.types ? t.type : 'taijutsu')}<span>${techName_(t.id)}</span>${t.baseDamage > 0 ? `<b>${t.baseDamage}${(t.hits ?? 1) > 1 ? `×${t.hits}` : ''}</b>` : ''}</li>`;
        })
        .join('')}</ul>`
    : `<p class="muted small">${B.noTechniques}</p>`;
  const stat = (label: string, value: number | string) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  const stats = st
    ? `<dl class="sheet-stats">${[
        stat(S.stats.hp, st.hp),
        stat(S.stats.chakra, st.chakra),
        stat(S.stats.speed, st.speed),
        stat(S.stats.taijutsu, st.offense.taijutsu),
        stat(S.stats.ninjutsu, st.offense.ninjutsu),
        stat(S.stats.genjutsu, st.offense.genjutsu),
        stat(S.statsShort.physical, st.resistance.physical),
        stat(S.statsShort.mental, st.resistance.mental),
      ].join('')}</dl><p class="sheet-element"><span class="muted">${B.element}</span> ${elChip(st.element)}</p>`
    : '';
  const record = [P.faced(r.faced), P.defeated(r.defeated), r.killedYou ? P.killedYou(r.killedYou) : '', P.bestHit(r.bestHit), P.worstHit(r.worstHit)].filter(Boolean);
  const group = foe.mode === 'roleta' ? S.roleta.run.categories[foe.group] ?? foe.group : S.jornada.stages[foe.group] ?? foe.group;
  const bg = sceneImage(`bingo-${foe.theme}`);
  return `<article class="bingo-sheet" data-tier="${foe.tier}" data-theme="${foe.theme}"${bg ? ` style="--sheet-bg:url('${bg}')"` : ''}>
    <header class="sheet-head">
      <div class="sheet-face">${foeFace(foe, 'lg')}</div>
      <div class="sheet-title"><small>${B.sections[foe.mode]} · ${group}</small><h2>${foeName(foe)}</h2>
        <span class="chip sheet-tier">${B.tiers[foe.tier]}</span></div>
      ${foe.tier === 'boss' ? `<span class="sheet-wanted" aria-label="${B.wanted}"><span class="kanji" aria-hidden="true">手配</span></span>` : ''}
      <button type="button" class="btn small sheet-close" data-close aria-label="${B.close}">${icon('close')}</button>
    </header>
    ${foeDescs[foe.id] ? `<p class="sheet-desc">${foeDescs[foe.id]}</p>` : ''}
    <section><h3 class="run-sub">${B.techniques}</h3>${techs}</section>
    ${stats ? `<section><h3 class="run-sub">${B.stats}</h3>${stats}</section>` : ''}
    ${st?.passive ? `<section><h3 class="run-sub">${B.passive}</h3><div class="sheet-passive">${st.passive}</div></section>` : ''}
    <section><h3 class="run-sub">${B.record}</h3><ul class="sheet-record">${record.map((x) => `<li>${x}</li>`).join('')}</ul></section>
  </article>`;
}

/** Ficha no painel ao lado (desktop) ou em tela cheia (celular e tablet). */
const sidePanel = () => window.matchMedia('(min-width: 1024px)').matches;

/** Página do Livro Bingo: as três seções, a lista por categoria, arco ou estágio, e a ficha. */
export function bingoPage(body: HTMLElement, start: BingoMode = 'roleta'): void {
  const P = S.profile;
  const B = P.bingo;
  let mode = start;
  body.innerHTML = `<p class="muted small">${P.bingoIntro} ${B.pick}</p>
    <div class="bingo-modes segmented" role="group" aria-label="${B.sectionsLabel}">${MODES.map(
      (id) => `<button type="button" class="btn seg" data-bingo-mode="${id}" aria-pressed="${id === mode}">${B.sections[id]}</button>`,
    ).join('')}</div>
    <div class="bingo-book"><div class="bingo-lists"></div><aside class="bingo-panel" aria-live="polite" hidden></aside></div>`;
  const lists = body.querySelector<HTMLElement>('.bingo-lists')!;
  const panel = body.querySelector<HTMLElement>('.bingo-panel')!;
  let foes: Foe[] = [];

  const fill = () => {
    const secs = sections(mode);
    foes = secs.flatMap((s) => s.foes);
    panel.hidden = true;
    panel.replaceChildren();
    lists.innerHTML = secs
      .map((s) => {
        const n = s.foes.filter(seen).length;
        return `<h3 class="ach-cat">${s.name} <small class="muted">${B.count(n, s.foes.length)}</small></h3><ul class="bingo">${s.foes.map(card).join('')}</ul>`;
      })
      .join('');
  };

  const open = (foe: Foe, from: HTMLElement) => {
    if (sidePanel()) {
      panel.innerHTML = sheet(foe);
      panel.hidden = false;
      lists.querySelectorAll('.bingo-open[aria-current]').forEach((b) => b.removeAttribute('aria-current'));
      from.setAttribute('aria-current', 'true');
      panel.querySelector<HTMLElement>('[data-close]')!.addEventListener('click', () => {
        panel.hidden = true;
        from.removeAttribute('aria-current');
        from.focus();
      });
      panel.querySelector<HTMLElement>('h2')!.setAttribute('tabindex', '-1');
      panel.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
      return;
    }
    const overlay = h(`<div class="bingo-overlay" aria-label="${foeName(foe)}">${sheet(foe)}</div>`);
    overlay.querySelector<HTMLElement>('[data-close]')!.addEventListener('click', () => overlay.remove());
    openDialog(overlay);
  };

  body.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const modeBtn = target.closest<HTMLButtonElement>('[data-bingo-mode]');
    if (modeBtn) {
      mode = modeBtn.dataset.bingoMode as BingoMode;
      body.querySelectorAll<HTMLElement>('[data-bingo-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bingoMode === mode)));
      fill();
      return;
    }
    const openBtn = target.closest<HTMLButtonElement>('.bingo-open');
    if (!openBtn) return;
    const foe = foes.find((f) => f.id === openBtn.dataset.foe && f.group === openBtn.dataset.group);
    if (foe) open(foe, openBtn);
  });
  fill();
}
