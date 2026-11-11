// Relíquias na interface da Jornada: barra de ícones no HUD e na luta, painel agrupado por raridade,
// card de revelação e brilho quando uma relíquia age. As regras ficam em src/core/jornada/relics.ts.
import { relicInMode, type RelicDef, type RelicMode, type RelicTier } from '../../src/core/jornada/relics';
import { allRelics, relicsById } from '../../src/data/relics';
import type { JRun } from '../../src/core/jornada/run';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { icon } from '../art';
import { h, openDialog, sleep } from '../dom';
import { tip } from '../tooltip';
import { relicIcon } from './relicIcons';

const J = S.jornada;
const U = J.ui;
const TIERS: RelicTier[] = ['starter', 'common', 'uncommon', 'rare', 'boss', 'shop', 'event', 'special'];

// Catálogo único (as da Jornada e as do Roleta). `mode`: o efeito mostrado é o desse modo.
const def = (id: string): RelicDef | undefined => relicsById[id];
const RR = S.roleta.relics;
export const relicName = (id: string) => J.relics.list[id]?.name ?? RR[id]?.name ?? id;
export const relicDesc = (id: string, mode: RelicMode = 'jornada') => (mode === 'roleta' ? RR[id]?.desc : J.relics.list[id]?.desc) ?? J.relics.list[id]?.desc ?? RR[id]?.desc ?? '';
export const relicTier = (id: string): RelicTier => def(id)?.tier ?? 'common';
export const isEvolution = (id: string) => Boolean(def(id)?.evolves);
const tierName = (id: string) => (isEvolution(id) ? J.relics.evolution : (J.relics.tiers[relicTier(id)] ?? ''));
const relicTip = (id: string, mode: RelicMode = 'jornada') => tip(relicName(id), `<span class="tip-tier tier-${relicTier(id)}">${tierName(id)}</span><br>${relicDesc(id, mode)}`);

// Relíquias que o jogador já viu na barra: as que chegam depois entram com brilho.
const seen = new Set<string>();
/** Marca as relíquias da run como já vistas (ao começar ou continuar, para não brilhar tudo). */
export function markRelicsSeen(ids: readonly string[]): void {
  for (const id of ids) seen.add(id);
}

/** Ícone de uma relíquia. `button` abre o painel (data-open); `span` só mostra a dica. */
export function relicSlot(id: string, as: 'button' | 'span' = 'button', extraCls = '', mode: RelicMode = 'jornada'): string {
  const cls = `jrslot tier-${relicTier(id)}${extraCls ? ` ${extraCls}` : ''}`;
  return as === 'button'
    ? `<button type="button" class="${cls}" data-open="relics" data-relic="${id}" aria-label="${relicName(id)}"${relicTip(id, mode)}>${relicIcon(id)}</button>`
    : `<span class="${cls}" data-relic="${id}" role="img" aria-label="${relicName(id)}"${relicTip(id, mode)}>${relicIcon(id)}</span>`;
}

/** Barra de relíquias do HUD: as novas entram com brilho uma vez. */
export function relicBar(run: JRun): string {
  if (!run.relics.length) return '';
  const slots = run.relics
    .map((id) => {
      const fresh = !seen.has(id);
      seen.add(id);
      return relicSlot(id, 'button', fresh ? 'is-new' : '');
    })
    .join('');
  return `<div class="jrbar" role="list" aria-label="${U.relicsTitle}">${slots}</div>`;
}

/** Fileira compacta para a tela de luta (só dica, sem abrir painel). */
export function relicStrip(run: JRun): string {
  return run.relics.length ? `<span class="jrstrip">${run.relics.map((id) => relicSlot(id, 'span')).join('')}</span>` : '';
}

/** Card grande: ícone, nome, raridade e efeito. */
export function relicCard(id: string, extra = '', cls = '', mode: RelicMode = 'jornada'): string {
  return `<div class="jrcard tier-${relicTier(id)}${cls ? ` ${cls}` : ''}" data-relic="${id}">
    <span class="jrcard-ico">${relicIcon(id)}</span>
    <span class="jrcard-txt"><b>${relicName(id)}</b><small class="jrcard-tier">${tierName(id)}</small><small>${relicDesc(id, mode)}</small></span>${extra}</div>`;
}

// ---------------------------------------------------------------------------
// Quando cada relíquia age (para brilhar na hora certa). Lido dos dados, sem regra nova.

const acts = (r: RelicDef, k: 'openingDamage' | 'startShieldPct' | 'startClones') =>
  k === 'openingDamage' ? Boolean(r.openingDamage) : Boolean(r.mods?.[k] || r.teamMods?.[k]);

/** Relíquias que agem no começo da luta (dano de abertura, escudo, clones). */
export const startRelics = (run: JRun) =>
  run.relics.filter((id) => {
    const r = def(id);
    return r && (acts(r, 'openingDamage') || acts(r, 'startShieldPct') || acts(r, 'startClones'));
  });
/** Relíquias que curam depois da vitória. */
export const winRelics = (run: JRun) => run.relics.filter((id) => def(id)?.afterWin);

/** Faz as relíquias brilharem em sequência dentro de `root`. */
export async function flashRelics(root: ParentNode, ids: readonly string[], instant: boolean): Promise<void> {
  for (const id of ids) {
    const el = root.querySelector<HTMLElement>(`[data-relic="${id}"]`);
    if (!el) continue;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 900);
    await sleep(instant ? 0 : 180);
  }
}

// ---------------------------------------------------------------------------
// Painel de relíquias

/** Painel com todas as relíquias da run, agrupadas por raridade; tocar mostra o detalhe embaixo. */
export function relicsModal(run: JRun, focus?: string): void {
  const groups = TIERS.map((t) => ({ t, ids: run.relics.filter((id) => relicTier(id) === t) })).filter((g) => g.ids.length);
  const el = h(`<div class="modal" aria-label="${U.relicsTitle}"><div class="modal-body jmodal jrpanel">
    <div class="modal-head"><h2>${U.relicsTitle} <small class="muted">${U.relicsCount(run.relics.length)}</small></h2><button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></div>
    ${run.relics.length ? '' : `<p class="muted">${U.noRelics}</p>`}
    ${groups
      .map(
        ({ t, ids }) => `<section class="jrgroup tier-${t}"><h3>${J.relics.tiers[t]} <small class="muted">${ids.length}</small></h3>
        <div class="jrgrid">${ids.map((id) => `<button type="button" class="jrslot big tier-${t}" data-pick="${id}" aria-label="${relicName(id)}">${relicIcon(id)}</button>`).join('')}</div></section>`,
      )
      .join('')}
    ${run.willOfFire ? `<p class="jrwill">${icon('willOfFire')} ${U.willOfFire(run.willOfFire)}</p>` : ''}
    <div class="jrdetail" aria-live="polite"></div>
  </div></div>`);
  openDialog(el);
  const detail = el.querySelector<HTMLElement>('.jrdetail')!;
  const select = (id: string | undefined) => {
    el.querySelectorAll('[data-pick]').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.pick === id));
    detail.innerHTML = id ? relicCard(id, '', 'pop') : run.relics.length ? `<p class="muted center">${U.relicsHint}</p>` : '';
  };
  select(focus && run.relics.includes(focus) ? focus : undefined);
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === el || t.closest('[data-close]')) return el.remove();
    const b = t.closest<HTMLElement>('[data-pick]');
    if (b) select(b.dataset.pick);
  });
}

// ---------------------------------------------------------------------------
// Coleção (aba do Registro ninja)

/** Coleção de todas as relíquias, por classificação: as não encontradas ficam escondidas. */
export function relicCollection(container: HTMLElement, found: Readonly<Record<string, string>>): void {
  const P = S.profile;
  let mode: RelicMode | 'all' = 'all';
  const render = () => {
    const pool = allRelics.filter((r) => mode === 'all' || relicInMode(r, mode));
    const total = pool.length;
    const count = pool.filter((r) => r.id in found).length;
    // Evoluções vêm com as de chefe, depois das outras.
    const inTier = (t: RelicTier) => pool.filter((r) => r.tier === t).sort((a, b) => Number(Boolean(a.evolves)) - Number(Boolean(b.evolves)));
    const shownMode: RelicMode = mode === 'roleta' ? 'roleta' : 'jornada';
    // Bloco próprio: o contêiner é reaproveitado entre as abas, e o clique não pode ficar preso nele.
    const root = h(`<div class="jrcollection"><p class="muted small">${P.relicsIntro}</p>
      <div class="segmented jrmode" role="group">${(['all', 'jornada', 'roleta'] as const)
        .map((m) => `<button type="button" class="btn seg" data-mode="${m}" aria-pressed="${m === mode}">${P.relicModes[m]}</button>`)
        .join('')}</div>
      <p class="jrcount"><b>${P.relicsCount(count, total)}</b></p>
      <div class="bar bar-xp jrcount-bar"><div class="fill" style="width:${total ? (count / total) * 100 : 0}%"></div></div>
      ${TIERS.map((t) => {
        const list = inTier(t);
        if (!list.length) return '';
        const n = list.filter((r) => r.id in found).length;
        return `<section class="jrgroup tier-${t}"><h3>${J.relics.tiers[t]} <small class="muted">${n}/${list.length}</small></h3>
          <p class="muted small jrgroup-desc">${J.relics.tierDesc[t]}</p>
          <div class="jrgrid">${list
            .map((r) =>
              r.id in found
                ? `<button type="button" class="jrslot big tier-${t}" data-pick="${r.id}" aria-label="${relicName(r.id)}">${relicIcon(r.id)}</button>`
                : `<span class="jrslot big jrhidden" role="img" aria-label="${P.relicHidden}"><b class="jq">?</b></span>`,
            )
            .join('')}</div></section>`;
      }).join('')}
      <div class="jrdetail" aria-live="polite"><p class="muted center">${P.relicsHint}</p></div></div>`);
    const detail = root.querySelector<HTMLElement>('.jrdetail')!;
    root.addEventListener('click', (e) => {
      const m = (e.target as HTMLElement).closest<HTMLElement>('[data-mode]');
      if (m) {
        mode = m.dataset.mode as RelicMode | 'all';
        return render();
      }
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-pick]');
      if (!b) return;
      root.querySelectorAll('[data-pick]').forEach((x) => x.classList.toggle('on', x === b));
      detail.innerHTML = relicCard(b.dataset.pick!, '', 'pop', shownMode);
    });
    container.replaceChildren(root);
  };
  render();
}

// ---------------------------------------------------------------------------
// Baú do tesouro (aberto e fechado)

const chest = (open: boolean) =>
  `<svg class="jrchest-svg" viewBox="0 0 64 56" aria-hidden="true">
    <rect x="6" y="24" width="52" height="28" rx="3" fill="#8a5a2b" stroke="#0007"/>
    <path d="M6 32h52M6 44h52" stroke="#5e3a19" stroke-width="2"/>
    <path d="M14 24v28M50 24v28" stroke="#d6a83a" stroke-width="3"/>
    ${
      open
        ? `<path d="M8 24 14 6h36l6 18z" fill="#6e4423" stroke="#0007"/><ellipse cx="32" cy="24" rx="22" ry="4" fill="#ffe08a" opacity=".85"/>`
        : `<path d="M6 24c0-10 6-16 13-16h26c7 0 13 6 13 16z" fill="#a0703c" stroke="#0007"/><path d="M14 10v14M50 10v14" stroke="#d6a83a" stroke-width="3"/><rect x="28" y="20" width="8" height="10" rx="1.5" fill="#d6a83a" stroke="#0007"/>`
    }
  </svg>`;
export const chestClosed = () => chest(false);
export const chestOpen = () => chest(true);
