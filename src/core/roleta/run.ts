// Run do Roleta enxuto (docs/roleta/run.md): ciclo curto de lutas sorteadas por categoria de vilão (2 genin, 2
// chunin, 1 jounin e o chefe), infinito e com relíquias. Funções puras; a interface e a simulação usam as mesmas.
// Depois do chefe: cura total, baú com 3 relíquias de chefe e o próximo ciclo, com os vilões mais fortes.
import { scaleVillain, type Difficulty } from '../difficulty';
import type { GameData } from '../gameData';
import { bossChoices, dropRelic, type RelicDef, type RoletaRelicEffect } from '../jornada/relics';
import { spin, type Slice } from '../roulette';
import { fullRestore, gainXp, trainingWeightsWin, xpGain, xpToNextLevel, type PlayerState } from '../player';
import { applyReward, xpStep, type NextFightMods, type Step } from '../progression';
import type { Rng } from '../rng';
import type { VillainDef } from '../types';
import type { RBattle } from './battle';
import type { RoletaData } from './data';
import type { RCategory } from '../../data/roleta/villains';

export interface RRun {
  player: PlayerState;
  difficulty: Difficulty;
  /** Ciclo atual, contando do 0 (a tela mostra "Ciclo N", N = cycle + 1). */
  cycle: number;
  /** Passo no ciclo (índice em `data.cycle`). */
  step: number;
  /** Vilão sorteado para o passo atual (null = ainda não sorteado). */
  villainId: string | null;
  /** Vilões já enfrentados neste ciclo (não repetem). */
  used: string[];
  /** Vantagem ou desvantagem de iniciativa na próxima luta (eventos). */
  mods: NextFightMods;
  /** `victory`: venceu o chefe do 1º ciclo (a run pode seguir no modo infinito). */
  status: 'inProgress' | 'victory' | 'defeat';
  /** Baú do chefe pendente (3 relíquias de chefe). */
  bossChoice: string[] | null;
  /** Lutas vencidas na run toda. */
  wins: number;
  /** Status do último chefe vencido (já escalados): o piso do ciclo seguinte no modo infinito. */
  lastBoss?: VillainStats | null;
}

/** Status de um vilão que o piso do modo infinito compara (o kit não entra). */
export interface VillainStats {
  hp: number;
  chakra: number;
  speed: number;
  offense: VillainDef['offense'];
  resistance: VillainDef['resistance'];
}

const statsOf = (v: VillainDef): VillainStats => ({ hp: v.hp, chakra: v.chakra, speed: v.speed, offense: { ...v.offense }, resistance: { ...v.resistance } });

/** O modo infinito existe só no Hardcore: só a run vencida nele segue para o próximo ciclo. */
export const canContinueRoleta = (run: RRun) => run.status === 'victory' && run.difficulty === 'hardcore';

/** Toda luta começa com HP e chakra cheios (v0.59.0). */
export const readyForFight = (player: PlayerState): PlayerState => fullRestore(player);

export function newRoletaRun(player: PlayerState, difficulty: Difficulty): RRun {
  return {
    player: { ...player, relics: player.relics ?? [] },
    difficulty,
    cycle: 0,
    step: 0,
    villainId: null,
    used: [],
    mods: { villainStartsFirst: false, playerStartsFirst: false },
    status: 'inProgress',
    bossChoice: null,
    wins: 0,
  };
}

export const currentCategory = (run: RRun, data: RoletaData): RCategory => data.cycle[run.step]!;
export const isBossStep = (run: RRun, data: RoletaData) => currentCategory(run, data) === 'boss';

/** Sorteia o vilão do passo: um da categoria que ainda não lutou neste ciclo (se todos já lutaram, qualquer um). */
export function drawVillain(prev: RRun, data: RoletaData, rng: Rng): RRun {
  const pool = data.categories[currentCategory(prev, data)];
  const fresh = pool.filter((id) => !prev.used.includes(id));
  const list = fresh.length ? fresh : pool;
  return { ...prev, villainId: list[Math.floor(rng() * list.length)]! };
}

/** Força dos vilões no ciclo (multiplica por cima da dificuldade). */
export const cycleMult = (run: RRun, data: RoletaData) => 1 + data.r.infinite.perCycle * run.cycle;

/** Ficha do vilão com a dificuldade e o ciclo aplicados. */
export function villainFor(run: RRun, villains: Record<string, VillainDef>, data: RoletaData): VillainDef {
  const mult = cycleMult(run, data);
  const base = data.base;
  const scaled: GameData =
    mult === 1
      ? base
      : {
          ...base,
          balance: {
            ...base.balance,
            difficulty: {
              ...base.balance.difficulty,
              multipliers: { ...base.balance.difficulty.multipliers, [run.difficulty]: base.balance.difficulty.multipliers[run.difficulty] * mult },
            },
          },
        };
  const cat = currentCategory(run, data);
  const v = scaleVillain(villains[run.villainId!]!, run.difficulty, scaled);
  // Força da categoria (as lutas começam com HP cheio, v0.59.0): × HP e ataques.
  const pow = data.r.villainPower[cat] ?? 1;
  let out: VillainDef =
    pow === 1
      ? v
      : {
          ...v,
          hp: Math.floor(v.hp * pow),
          offense: { taijutsu: Math.floor(v.offense.taijutsu * pow), ninjutsu: Math.floor(v.offense.ninjutsu * pow), genjutsu: Math.floor(v.offense.genjutsu * pow) },
        };
  // Modo infinito: o ciclo novo parte dos status do último chefe (cada status ≥ o do chefe × piso da categoria).
  const last = run.cycle > 0 ? run.lastBoss : null;
  if (last) {
    const f = data.r.infinite.floor[cat] ?? 1;
    const up = (own: number, boss: number) => Math.max(own, Math.ceil(boss * f));
    out = {
      ...out,
      hp: up(out.hp, last.hp),
      chakra: up(out.chakra, last.chakra),
      speed: up(out.speed, last.speed),
      offense: { taijutsu: up(out.offense.taijutsu, last.offense.taijutsu), ninjutsu: up(out.offense.ninjutsu, last.offense.ninjutsu), genjutsu: up(out.offense.genjutsu, last.offense.genjutsu) },
      resistance: { physical: up(out.resistance.physical, last.resistance.physical), mental: up(out.resistance.mental, last.resistance.mental) },
    };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Relíquias

/** Efeitos das relíquias do jogador no Roleta, somados (multiplicadores multiplicam). */
export function relicEffects(player: PlayerState, data: RoletaData): Required<Pick<RoletaRelicEffect, 'damageMult' | 'flatDamage' | 'critBonus' | 'accuracyBonus' | 'dodgeBonus' | 'regenPct' | 'startShieldPct' | 'startChakraPct' | 'openingDamage' | 'afterWinHealPct' | 'chakraDiscount' | 'lowHpDamageMult' | 'xpMult'>> & {
  typeDamageMult: Record<string, number>;
  surviveOnce: boolean;
} {
  const out = {
    damageMult: 1,
    flatDamage: 0,
    critBonus: 0,
    accuracyBonus: 0,
    dodgeBonus: 0,
    regenPct: 0,
    startShieldPct: 0,
    startChakraPct: 0,
    openingDamage: 0,
    afterWinHealPct: 0,
    chakraDiscount: 0,
    lowHpDamageMult: 1,
    xpMult: 1,
    typeDamageMult: {} as Record<string, number>,
    surviveOnce: false,
  };
  for (const id of player.relics ?? []) {
    const e = data.relics.find((r) => r.id === id)?.roleta;
    if (!e) continue;
    out.damageMult *= e.damageMult ?? 1;
    out.lowHpDamageMult *= e.lowHpDamageMult ?? 1;
    out.xpMult *= e.xpMult ?? 1;
    for (const k of ['flatDamage', 'critBonus', 'accuracyBonus', 'dodgeBonus', 'regenPct', 'startShieldPct', 'startChakraPct', 'openingDamage', 'afterWinHealPct', 'chakraDiscount'] as const) out[k] += e[k] ?? 0;
    for (const [t, m] of Object.entries(e.typeDamageMult ?? {})) out.typeDamageMult[t] = (out.typeDamageMult[t] ?? 1) * (m ?? 1);
    if (e.surviveOnce) out.surviveOnce = true;
  }
  return out;
}

/** Contrato de invocação que o jogador já tem (só um animal por vez). */
const ownedContract = (player: PlayerState, data: RoletaData) => (player.relics ?? []).find((id) => data.relics.find((r) => r.id === id)?.roleta?.summon);

/** Relíquias que ainda podem sair para o jogador (com um contrato, os outros contratos ficam de fora). */
export function relicPool(player: PlayerState, data: RoletaData): RelicDef[] {
  const contract = ownedContract(player, data);
  return data.relics.filter((r) => !(contract && r.roleta?.summon && r.id !== contract));
}

/** Ganha a relíquia: status na ficha, Vontades, invocação e Pesos de treino. */
export function gainRoletaRelic(player: PlayerState, id: string, data: RoletaData): PlayerState {
  const def = data.relics.find((r) => r.id === id);
  if (!def || (player.relics ?? []).includes(id)) return player;
  const e = def.roleta ?? {};
  const st = e.stats ?? {};
  let p: PlayerState = {
    ...player,
    relics: [...(player.relics ?? []), id],
    maxHp: player.maxHp + (st.hp ?? 0),
    hp: player.hp + (st.hp ?? 0),
    maxChakra: player.maxChakra + (st.chakra ?? 0),
    chakra: player.chakra + (st.chakra ?? 0),
    speed: player.speed + (st.speed ?? 0),
    resistance: { physical: player.resistance.physical + (st.physical ?? 0), mental: player.resistance.mental + (st.mental ?? 0) },
    revives: player.revives + (e.grant?.revives ?? 0),
  };
  if (e.summon && p.summon?.animal !== e.summon) p = { ...p, summon: { animal: e.summon, level: 1 } };
  if (e.weights && p.trainingWeights === 'none') p = { ...p, trainingWeights: 'stored' };
  return p;
}

/** Fatia "Relíquia" da recompensa: uma relíquia da classificação da raridade (null = nada para sortear). */
export function rewardRelic(player: PlayerState, tier: number, data: RoletaData, rng: Rng): string | null {
  const relicTier = data.r.relicTierByReward[tier] ?? 'common';
  return dropRelic(relicPool(player, data), player.relics ?? [], { [relicTier]: 1 }, rng);
}

/** Raridades da roleta de relíquia pós-luta. */
const RELIC_REWARD_TIERS = ['common', 'uncommon', 'rare'] as const;
export type RelicRewardTier = (typeof RELIC_REWARD_TIERS)[number];

export interface RelicRewardRoll {
  /** Roleta da raridade (pesos da categoria; só as raridades com relíquia para sortear). */
  tierStep: { slices: Slice<RelicRewardTier>[]; index: number } | null;
  /** Roleta da relíquia (as da raridade que o jogador ainda não tem, peso igual). */
  relicStep: { slices: Slice<string>[]; index: number } | null;
  relic: string | null;
}

/** Pesos da raridade para a categoria e o ciclo (cada ciclo do infinito passa pontos de Comum para Rara). */
export function relicRewardWeights(category: RCategory, cycle: number, data: RoletaData): Record<RelicRewardTier, number> {
  const w = data.r.relicReward.weights[category] ?? data.r.relicReward.weights.genin!;
  const shift = Math.min(w.common, data.r.relicReward.cycleShift * cycle);
  return { common: w.common - shift, uncommon: w.uncommon, rare: w.rare + shift };
}

/**
 * Roleta de relíquia depois da luta (fora o chefe): a raridade pelos pesos da categoria e, nela, uma relíquia que o
 * jogador ainda não tem. Raridade esgotada sai da roleta; sem nenhuma relíquia para sortear, `relic` é null.
 */
export function rollRelicReward(player: PlayerState, category: RCategory, cycle: number, data: RoletaData, rng: Rng): RelicRewardRoll {
  const owned = player.relics ?? [];
  const pool = relicPool(player, data).filter((r) => !owned.includes(r.id));
  const weights = relicRewardWeights(category, cycle, data);
  const tierSlices = RELIC_REWARD_TIERS.filter((t) => weights[t] > 0 && pool.some((r) => r.tier === t)).map((t) => ({ label: t, weight: weights[t], value: t }));
  if (!tierSlices.length) return { tierStep: null, relicStep: null, relic: null };
  const tierIndex = spin(tierSlices, rng).index;
  const tier = tierSlices[tierIndex]!.value;
  const relicSlices = pool.filter((r) => r.tier === tier).map((r) => ({ label: r.id, weight: 1, value: r.id }));
  const relicIndex = spin(relicSlices, rng).index;
  return { tierStep: { slices: tierSlices, index: tierIndex }, relicStep: { slices: relicSlices, index: relicIndex }, relic: relicSlices[relicIndex]!.value };
}

/** Contrato do animal (evento Invocação): a relíquia que corresponde a ele. */
export const contractFor = (animal: string, data: RoletaData) => data.relics.find((r) => r.roleta?.summon === animal)?.id ?? null;

// ---------------------------------------------------------------------------
// Fim da luta

export interface RFightOutcome {
  won: boolean;
  xp: number;
  /** Raridade da recompensa (0 = sem roleta: o chefe abre o baú). */
  tier: number;
  boss: boolean;
}

/**
 * Fecha a luta: vitória recupera (mais as relíquias), conta os Pesos e o XP (sem subir de nível: a interface mostra
 * uma subida por vez) e avança o passo. Depois do chefe: cura total e o baú. Derrota encerra a run.
 */
export function finishRoletaFight(prev: RRun, battle: RBattle, data: RoletaData, rng: Rng): { run: RRun; outcome: RFightOutcome } {
  const won = battle.status === 'won';
  const boss = isBossStep(prev, data);
  if (!won) return { run: { ...prev, player: battle.player, status: 'defeat' }, outcome: { won, xp: 0, tier: 0, boss } };
  const fx = relicEffects(battle.player, data);
  // Sem recuperação parcial: a próxima luta começa com HP e chakra cheios (`readyForFight`).
  let p = trainingWeightsWin(battle.player, data.base);
  // XP do vilão (a ficha da base; o ciclo não muda o XP), com as relíquias de XP.
  const xp = Math.floor(battle.villain.def.xp * fx.xpMult);
  p = gainXp(p, xp, data.base);
  const category = currentCategory(prev, data);
  const run: RRun = { ...prev, player: p, wins: prev.wins + 1, used: [...prev.used, prev.villainId!], villainId: null, mods: { villainStartsFirst: false, playerStartsFirst: false } };
  if (boss) {
    run.player = fullRestore(run.player);
    run.lastBoss = statsOf(battle.villain.def);
    const choices = bossChoices(relicPool(run.player, data), run.player.relics ?? [], data.r.run.bossChoices, 0, rng);
    run.bossChoice = choices.length ? choices : null;
    if (!run.bossChoice) endCycle(run);
  } else run.step++;
  return { run, outcome: { won, xp: xpGain(battle.player, xp, data.base), tier: rewardTierFor(category, prev.cycle, data), boss } };
}

/** Raridade da recompensa: a da categoria, mais 1 por ciclo do modo infinito (o chefe abre o baú, sem raridade). */
export function rewardTierFor(category: RCategory, cycle: number, data: RoletaData): number {
  const base = data.r.run.rewardTier[category] ?? 0;
  return base === 0 ? 0 : Math.min(data.r.run.maxRewardTier, base + cycle);
}

/** XP da fatia: fração do custo do nível atual, para não perder valor com o nível. */
export const rewardXp = (player: PlayerState, tier: number, data: RoletaData) => Math.floor(xpToNextLevel(player.level, data.base) * data.r.rewards.xpPct[tier - 1]!);

/**
 * Fatias diretas da recompensa do Roleta. Status junta estágios, resistência e crítico; o XP acompanha o custo do nível.
 * Item, relíquia e jackpot têm tela própria (`rewardRelic`, `applyJackpot`).
 */
export function applyRoletaReward(player: PlayerState, reward: 'stages' | 'xp', tier: number, rng: Rng, data: RoletaData): Step[] {
  if (reward === 'xp') return [xpStep(player, rewardXp(player, tier, data), data.base)];
  const stages = applyReward(player, 'stages', tier, rng, data.base);
  const resistance = applyReward(stages.player, 'resistance', tier, rng, data.base);
  return [stages, resistance, applyReward(resistance.player, 'critBonus', tier, rng, data.base)];
}

/** Jackpot: relíquia rara (ou, sem nenhuma para sortear, o XP da raridade máxima) e cura. */
export function applyJackpot(player: PlayerState, rng: Rng, data: RoletaData): { player: PlayerState; relic: string | null; healed: number } {
  const relic = rewardRelic(player, data.r.run.maxRewardTier, data, rng);
  let p = relic ? gainRoletaRelic(player, relic, data) : gainXp(player, rewardXp(player, data.r.run.maxRewardTier, data), data.base);
  const healed = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * data.r.rewards.jackpotHealPct));
  p = { ...p, hp: p.hp + healed };
  return { player: p, relic, healed };
}

/** Escolhe a relíquia do baú do chefe e fecha o ciclo. */
export function chooseChest(prev: RRun, id: string, data: RoletaData): RRun {
  if (!prev.bossChoice?.includes(id)) throw new Error('relíquia fora do baú');
  const run: RRun = { ...prev, player: gainRoletaRelic(prev.player, id, data), bossChoice: null };
  endCycle(run);
  return run;
}

/** Fim do ciclo: no 1º, a run conta como vencida (conquistas de vitória); a interface oferece o próximo ciclo. */
function endCycle(run: RRun): void {
  if (run.cycle === 0) run.status = 'victory';
  else continueInPlace(run);
}

function continueInPlace(run: RRun): void {
  run.cycle++;
  run.step = 0;
  run.used = [];
  run.villainId = null;
  run.status = 'inProgress';
}

/** Modo infinito: depois da vitória do 1º ciclo, segue para o próximo (dos seguintes, o ciclo emenda sozinho). */
export function continueRoletaCycle(prev: RRun): RRun {
  if (!canContinueRoleta(prev)) throw new Error('só a run vencida no Hardcore segue de ciclo');
  const run = { ...prev };
  continueInPlace(run);
  return run;
}
