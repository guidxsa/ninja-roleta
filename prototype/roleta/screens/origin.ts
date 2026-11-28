// Roleta: roletas de origem (a dificuldade se escolhe antes, no lobby).
import { crest, clanPaint } from '../../lineageEmblems';
import { hasElementalNinjutsu } from '../../../src/core/nature';
import { lineageOf, type OriginStep, rollOrigin } from '../../../src/core/origin';
import { type PlayerState } from '../../../src/core/player';
import { createRoletaPlayer } from '../../../src/core/roleta/player';
import { newRoletaRun } from '../../../src/core/roleta/run';
import { emptyRunStats } from '../../../src/core/runStats';
import { type Element } from '../../../src/core/types';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { startRun } from '../../../src/state/runHistory';
import { icon, clanSymbol } from '../../art';
import { show, h, sleep, choose } from '../../dom';
import { ELEMENT_COLORS, ELEMENT_ICON } from '../../tips';
import { tip } from '../../tooltip';
import { type WheelSlice } from '../../wheel';
import { diffChip, elChip, data, TIER_COLORS, progressDots, nextRunSeed, hardcoreUnlocked, rstage, bigWheel, syncSheetBtn, playerPanel, track, checkAchievements, NO_MODS } from '../common';
import { ses, DEFAULT_DIFFICULTY } from '../session';

// ---------------------------------------------------------------------------
// Tela: origem

/** Cores da roleta de quantidade de elementos (0 a 3). */
export const COUNT_COLORS = ['#5d6168', '#3f5f9e', '#7d4d8f', '#b8892f'];

/**
 * Chip da natureza (src/core/nature.ts): a Kekkei Genkai, que é uma natureza só, ou o elemento. Quem não usa ninjutsu
 * elemental tem a natureza "silenciosa": o chip mostra, com a dica de que ela não dá técnica.
 */
export function elementChips(elements: Element[], kg: string | null = null, silent = false): string {
  const k = kg ? S.kekkeiGenkai[kg] : null;
  if (k) return `<span class="chip kg-chip"${tip(k.name, k.desc)}>${icon('sparkle')} ${k.name}</span>`;
  if (!elements.length) return `<span class="chip"${tip(S.ui.noAffinity, S.tips.noElement)}>${S.ui.noAffinity}</span>`;
  if (silent) return elements.map((e) => `<span class="chip el silent" style="--c:${ELEMENT_COLORS[e]}"${tip(S.elements[e], S.tips.silentNature)}>${icon(ELEMENT_ICON[e])} ${S.elements[e]}</span>`).join('');
  return elements.map((e) => elChip(e)).join('');
}

/** A natureza do jogador é silenciosa (origem sem ninjutsu elemental). */
export const silentNature = (p: PlayerState) => !hasElementalNinjutsu(lineageOf(p.origin.lineageId, data));

export function originStepSlices(step: OriginStep): WheelSlice[] {
  const L = S.sliceLabels;
  return step.slices.map((s) => {
    switch (step.kind) {
      case 'jinchuuriki':
        return {
          label: L[s.value]!,
          weight: s.weight,
          color: s.value === 'yes' ? '#c4501f' : TIER_COLORS.common,
          icon: s.value === 'yes' ? clanSymbol('jinchuuriki') : undefined,
        };
      case 'element': {
        const el = s.value as Element;
        return { label: S.elements[el], weight: s.weight, color: ELEMENT_COLORS[el], icon: icon(ELEMENT_ICON[el]) };
      }
      case 'kekkeiGenkai':
        return { label: S.kekkeiGenkai[s.value]?.name ?? s.value, weight: s.weight, color: s.value === 'none' ? TIER_COLORS.common : TIER_COLORS.legendary };
      case 'elementCount': {
        const n = Number(s.value);
        // Roleta de proficiência do Comum: sem proficiência vira o Prodígio; com, uma natureza (v0.59.0).
        return { label: n === 0 ? S.sliceLabels.prodigy! : S.sliceLabels.proficient!, weight: s.weight, color: COUNT_COLORS[n] ?? TIER_COLORS.common };
      }
      case 'lineage': {
        // Cada origem tem cor e emblema próprios; o tom da raridade cobre origens sem paleta.
        const tier = lineageOf(s.value, data).tier;
        return { label: S.lineages[s.value] ?? s.value, weight: s.weight, color: clanPaint[s.value] ?? TIER_COLORS[tier], originId: s.value, icon: crest(s.value) || clanSymbol(s.value) };
      }
    }
  });
}

export function stepResultText(step: OriginStep): string {
  const v = step.slices[step.index]!.value;
  switch (step.kind) {
    case 'lineage': {
      const tier = lineageOf(v, data).tier;
      return `${crest(v) || clanSymbol(v)}${S.lineages[v] ?? v}${tier === 'common' ? '' : ` · ${S.lineageTiers[tier]}`}`;
    }
    case 'element':
      return `${icon(ELEMENT_ICON[v as Element])}${S.elements[v as Element]}`;
    case 'elementCount':
      return Number(v) === 0 ? `${clanSymbol('taijutsuProdigy')}${S.origin.noElementProdigy}` : S.origin.proficient;
    case 'kekkeiGenkai':
      return v === 'none' ? `${S.roulettes.kekkeiGenkai} ${S.kekkeiGenkai.none!.name}` : `${icon('sparkle')}${S.kekkeiGenkai[v]?.name ?? v}`;
    case 'jinchuuriki':
      return v === 'yes' ? `${clanSymbol('jinchuuriki')}${S.origin.jinchuuriki}` : `${S.origin.jinchuuriki}: ${S.sliceLabels.no}`;
  }
}

export async function originScreen(): Promise<void> {
  progressDots(-1);
  for (;;) {
    const seed = nextRunSeed();
    const roll = rollOrigin(ses.rng, data);
    const runId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    // Hardcore bloqueado (ainda não venceu no Difícil): cai para a dificuldade padrão (o lobby já faz; aqui é a garantia).
    if (ses.settings.difficulty === 'hardcore' && !hardcoreUnlocked()) ses.settings.difficulty = DEFAULT_DIFFICULTY;
    const player = createRoletaPlayer(roll.origin, rdata, ses.settings.difficulty);
    ses.camp = {
      runId,
      origin: roll.origin,
      player,
      difficulty: ses.settings.difficulty,
      run: newRoletaRun(player, ses.settings.difficulty),
      mods: { ...NO_MODS },
      seed,
      trail: [],
      log: {},
      stats: emptyRunStats(),
    };
    ses.campLive = true;
    // A Ficha da barra só aparece depois das roletas: antes, entregaria a classe sorteada.
    document.body.classList.remove('has-sheet');

    const root = show(
      h(`<div class="screen rwheel rorigin"><i class="festival-lamp" aria-hidden="true"></i><h2>${S.ui.title}</h2><div class="chips-line" id="origin-chips"></div>
        <div class="rstage-box">${rstage('roleta', 'konoha')}<div id="slot"></div></div>
        <div class="rside"><div id="ohud"></div><div id="after"></div></div></div>`),
    );
    const chips = root.querySelector<HTMLElement>('#origin-chips')!;
    const slot = root.querySelector<HTMLElement>('#slot')!;
    for (const step of roll.steps) {
      await bigWheel(slot, S.roulettes[step.kind], originStepSlices(step), step.index);
      chips.insertAdjacentHTML('beforeend', `<span class="chip origin-chip pop">${stepResultText(step)}</span>`);
      chips.scrollLeft = chips.scrollWidth;
      await sleep(ses.settings.instant ? 0 : 500);
    }
    syncSheetBtn();
    root.classList.add('rolled');
    // A ficha vai para a coluna da direita; no PC a última roleta fica no palco (no celular o CSS a esconde).
    const ohud = root.querySelector<HTMLElement>('#ohud')!;
    ohud.innerHTML = playerPanel(player);
    slot.classList.add('done');
    const after = root.querySelector<HTMLElement>('#after')!;
    // A dificuldade vem do lobby (lobby.ts): aqui só aparece, ao lado do Re-rolar e do Começar.
    after.innerHTML = `<p class="center small rorigin-diff">${S.roleta.lobby.chosenDifficulty}: ${diffChip(ses.camp.difficulty)}</p>
    <div class="actions-row">
      <button class="btn" data-choice="reroll">${icon('dice')} ${S.ui.reroll}</button>
      <button class="btn primary" data-choice="start">${S.ui.startCampaign}</button></div>`;
    const choice = await choose<'reroll' | 'start'>(after);
    if (choice === 'start') {
      // A run só entra no histórico quando começa: re-rolar ou sair durante o sorteio não deixa registro.
      startRun(ses.storage, { id: runId, origin: roll.origin, now: new Date(), ...(seed !== null ? { seed } : {}) }, data.balance.history.maxRuns);
      track({ difficulty: ses.camp.difficulty });
      checkAchievements('inProgress', null);
      return;
    }
  }
}
