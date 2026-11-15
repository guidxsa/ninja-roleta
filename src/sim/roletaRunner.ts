// Simulação do Roleta enxuto (docs/roleta/combate.md): bot simples e a campanha com eventos e recompensas diretos.
// O bot joga pior que um humano: escolhe o golpe de mais dano esperado, usa a ativa logo e quase não defende.
import { gateUpkeep } from '../core/gates';
import type { Difficulty } from '../core/difficulty';
import type { ConsumableId } from '../core/types';
import { canLevelUp, equipTrainingWeights, gainXp, recoverAfterWin, trainingWeightsWin, type PlayerState } from '../core/player';
import {
  applyAkatsuki,
  applyItem,
  applySimpleEvent,
  applySummonEncounter,
  applyTraining,
  HANDS,
  levelUp,
  playJokenpo,
  rollAkatsuki,
  rollItem,
  rollSummonAnimal,
  rollTraining,
  rollWeighted,
  type Step,
} from '../core/progression';
import {
  activeCost,
  battleTechniques,
  buffOn,
  canUseActive,
  canUseItem,
  canUseTechnique,
  gateForceChance,
  kitActives,
  playerAttackOdds,
  playerHitDamage,
  playRoletaRound,
  startRoletaBattle,
  useActive,
  useRoletaItem,
  type RAction,
  type RBattle,
  type RBattleOptions,
} from '../core/roleta/battle';
import type { RoletaData } from '../core/roleta/data';
import {
  chooseChest,
  continueRoletaCycle,
  contractFor,
  drawVillain,
  finishRoletaFight,
  gainRoletaRelic,
  newRoletaRun,
  canContinueRoleta,
  rewardXp,
  rollRelicReward,
  villainFor,
} from '../core/roleta/run';
import type { RCategory } from '../data/roleta/villains';
import type { RActive } from '../data/roleta/kits';
import type { RTechniqueDef } from '../data/roleta/techniques';
import type { Rng } from '../core/rng';
import type { VillainDef } from '../core/types';
import { auditRoletaFight, type FightAudit } from './audit';

/** Teto de segurança contra lutas infinitas. */
export const MAX_ROUNDS = 200;

/** Dano esperado de uma técnica agora (acerto × dano × golpes, com o crítico). */
function damageValue(s: RBattle, t: RTechniqueDef, data: RoletaData): number {
  if (t.damageless || t.barrierPct || t.clone) return 0;
  const odds = playerAttackOdds(s, t, data);
  const per = playerHitDamage(s, t, data);
  const critMult = data.base.balance.crit.multiplier;
  return (odds.hit - odds.crit + odds.crit * critMult) * per * (t.hits ?? 1);
}

/**
 * Valor da técnica para o bot: o dano esperado; a que só atordoa (Olhar Hipnótico, Correntes) vale 1,5 golpe do
 * melhor dano, se o vilão pode ser atordoado e ainda tem HP para isso valer.
 */
function expected(s: RBattle, t: RTechniqueDef, data: RoletaData): number {
  if (!t.damageless) return damageValue(s, t, data);
  const v = s.villain;
  if (t.effect?.kind !== 'stun' || v.effects.some((e) => e.kind === 'stun' || e.kind === 'stunGuard') || v.hp < v.maxHp * 0.3) return 0;
  const best = Math.max(0, ...battleTechniques(s, data).map((x) => damageValue(s, x, data)));
  return playerAttackOdds(s, t, data).hit * best * 1.5;
}

/** Item do bot antes da ação (não gasta a ação, um por turno): só nos apertos ou para pagar o golpe mais forte. */
export function chooseRoletaItem(s: RBattle, data: RoletaData): ConsumableId | null {
  const p = s.player;
  const ok = (id: ConsumableId) => canUseItem(s, id);
  if (ok('explosiveTag') && s.villain.hp <= data.r.items.explosiveTagDamage) return 'explosiveTag';
  if (ok('medKit') && p.hp < p.maxHp * 0.3 && s.fx.effects.some((e) => e.kind !== 'stunGuard')) return 'medKit';
  if (ok('smokeBomb') && p.hp < p.maxHp * 0.25) return 'smokeBomb';
  if (ok('soldierPill')) {
    const techs = battleTechniques(s, data).filter((t) => !t.clone);
    const best = (list: typeof techs) => list.map((t) => ({ t, e: expected(s, t, data) })).sort((a, b) => b.e - a.e)[0];
    const bestNow = best(techs.filter((t) => canUseTechnique(s, t, data)));
    const bestAll = best(techs);
    if (bestAll && bestAll.t.id !== bestNow?.t.id && bestAll.e > (bestNow?.e ?? 0) * 1.5 && p.hp > p.maxHp * 0.5) return 'soldierPill';
  }
  return null;
}

/** Ação do bot: o golpe de mais dano esperado que dá para pagar, ou Concentrar se valer a pena. */
export function chooseRoletaAction(s: RBattle, data: RoletaData): RAction {
  const p = s.player;
  const all = battleTechniques(s, data);
  const bunshin = all.find((t) => t.clone);
  if (bunshin && !s.fx.clone && p.hp < p.maxHp * 0.7 && canUseTechnique(s, bunshin, data)) return `tech:${bunshin.id}`;
  const techs = all.filter((t) => !t.clone);
  const affordable = techs.filter((t) => canUseTechnique(s, t, data));
  // Técnica que pede dōjutsu ou Portão fora de hora não conta como "a melhor para juntar chakra".
  const reachable = techs.filter((t) => !t.requiresBuff && !t.requiresGate);
  const best = (list: typeof techs) => list.map((t) => ({ t, e: expected(s, t, data) })).sort((a, b) => b.e - a.e)[0];
  const bestNow = best(affordable);
  const bestAll = best([...reachable, ...affordable]);
  if (bestAll && bestNow && bestAll.t.id !== bestNow.t.id && bestAll.e > bestNow.e * 1.5 && p.hp > p.maxHp * 0.5) return 'rest';
  return bestNow ? `tech:${bestNow.t.id}` : 'rest';
}

/** Ordem em que o bot olha as ativas (uma por turno). */
const ACTIVE_ORDER: RActive[] = ['gates', 'sharingan', 'byakugan', 'expansion', 'beast', 'effort', 'seal', 'copy', 'pills', 'drunkenFist', 'shadow', 'mindTransfer', 'plague'];

/**
 * Ativa grátis do bot (uma por turno): usa logo o que liga fortalecimento, se sobra chakra para golpear; os Portões só
 * com HP alto (e fecha abaixo de 25%), Forçar com 60% ou mais; o Selamento contra a técnica mais forte do vilão; a
 * Cópia quando não tem nada copiado; as pílulas com o vilão acima de 40% do HP.
 */
function chooseActive(s: RBattle, data: RoletaData): { kind: RActive; force?: boolean } | null {
  const p = s.player;
  const mine = kitActives(p, data);
  const cheapest = Math.min(...battleTechniques(s, data).filter((t) => t.chakra > 0 && !t.clone && !t.barrierPct).map((t) => t.chakra), 99);
  for (const kind of ACTIVE_ORDER) {
    if (!mine.includes(kind)) continue;
    if (kind === 'gates' && s.fx.gate) {
      if (p.hp < p.maxHp * 0.25 && canUseActive(s, data, kind)) return { kind };
      continue;
    }
    if (!canUseActive(s, data, kind)) continue;
    const spare = p.chakra - activeCost(s, kind, data);
    switch (kind) {
      case 'gates': {
        const g = data.base.balance.gateCosts;
        if (p.hp < p.maxHp * 0.5 || spare < gateUpkeep(1, g) + gateUpkeep(2, g)) continue;
        const chance = gateForceChance(s, data);
        if (chance !== null && chance >= 0.6 && p.hp > p.maxHp * 0.6 && canUseActive(s, data, kind, { force: true })) return { kind, force: true };
        return { kind };
      }
      case 'sharingan':
      case 'byakugan':
      case 'expansion':
      case 'beast':
        if (spare < Math.min(cheapest, 4)) continue;
        return { kind };
      case 'seal': {
        const intent = s.villain.intent;
        const top = [...s.villain.techniques].sort((a, b) => b.baseDamage - a.baseDamage)[0];
        if (intent?.kind !== 'tech' || intent.id !== top?.id) continue;
        return { kind };
      }
      case 'copy':
        if (s.fx.copied) continue;
        return { kind };
      case 'pills':
        if (s.villain.hp < s.villain.maxHp * 0.4) continue;
        return { kind };
      case 'drunkenFist':
        if (buffOn(s, 'exhausted')) continue;
        return { kind };
      default:
        return { kind };
    }
  }
  return null;
}

export function runRoletaBattle(
  player: PlayerState,
  villain: VillainDef,
  rng: Rng,
  data: RoletaData,
  options: Partial<RBattleOptions> = {},
  /** Auditoria: recebe o estado da abertura (depois da iniciativa), sem mexer no rng. */
  onStart?: (s: RBattle) => void,
): RBattle {
  let s = startRoletaBattle(player, villain, options, data, rng);
  onStart?.(s);
  while (s.status === 'ongoing' && s.round < MAX_ROUNDS) {
    const active = chooseActive(s, data);
    if (active) s = useActive(s, data, rng, active.kind, { force: active.force });
    if (s.status !== 'ongoing') break;
    const item = chooseRoletaItem(s, data);
    if (item) s = useRoletaItem(s, item, data, rng);
    if (s.status !== 'ongoing') break;
    s = playRoletaRound(s, chooseRoletaAction(s, data), data, rng);
  }
  return s;
}

/** Sobe de nível enquanto houver XP (sem upgrades à escolha no Roleta enxuto). */
export function roletaLevelUps(player: PlayerState, data: RoletaData): PlayerState {
  let p = player;
  while (canLevelUp(p, data.base)) p = levelUp(p, data.base).player;
  return p;
}

/** Vitória: recupera parte do HP e do chakra, ganha o XP do vilão (e o taijutsu dos pesos de treino) e sobe de nível. */
export function roletaAwardXp(player: PlayerState, villain: VillainDef, data: RoletaData, exam = false): PlayerState {
  const recovered = recoverAfterWin(player, data.base);
  const p = exam ? recovered : trainingWeightsWin(recovered, data.base);
  return roletaLevelUps(gainXp(p, villain.xp, data.base), data);
}

function autoItem(player: PlayerState, rng: Rng, data: RoletaData): Step {
  const item = rollItem(player, rng, data.base);
  return applyItem(player, item.value, rng, data.base);
}

/** Pesos de treino ganhos como relíquia: o bot equipa e nunca tira. */
const autoWeights = (p: PlayerState, data: RoletaData) => (p.trainingWeights === 'stored' ? equipTrainingWeights(p, data.base) : p);

/** Roleta de relíquia pós-luta, direta (sem nenhuma para sortear, o XP de uma recompensa rara). */
export function autoRelicReward(player: PlayerState, category: RCategory, cycle: number, rng: Rng, data: RoletaData): PlayerState {
  const roll = rollRelicReward(player, category, cycle, data, rng);
  const p = roll.relic ? autoWeights(gainRoletaRelic(player, roll.relic, data), data) : gainXp(player, rewardXp(player, 2, data), data.base);
  return roletaLevelUps(p, data);
}

/** Evento pré-luta direto. A Invocação dá o contrato do animal (ou sobe o nível de quem já tem). */
export function autoRoletaEvent(player: PlayerState, rng: Rng, data: RoletaData): Step {
  const ev = rollWeighted(data.base.preFightEvents, rng).value;
  switch (ev) {
    case 'oldLady':
    case 'ramen':
      return applySimpleEvent(player, ev);
    case 'training':
      return applyTraining(player, rollTraining(player, rng, data.base).value, data.base);
    case 'jokenpo':
      return playJokenpo(player, HANDS[0]!, rng, data.base);
    case 'foundItem':
      return autoItem(player, rng, data);
    case 'summon':
      return summonEvent(player, rng, data);
    case 'akatsuki':
      return applyAkatsuki(player, rollAkatsuki(player, rng, data.base).value, data.base);
    default:
      // Guru e Lição do clã não existem no Roleta enxuto.
      return applySimpleEvent(player, 'ramen');
  }
}

/** Invocação: sem animal, sorteia um e ganha o contrato (relíquia); com animal, ele sobe de nível. */
export function summonEvent(player: PlayerState, rng: Rng, data: RoletaData): Step {
  if (player.summon) return applySummonEncounter(player, player.summon.animal);
  const animal = rollSummonAnimal(rng, data.base).value;
  const step = applySummonEncounter(player, animal);
  const contract = contractFor(animal, data);
  return contract ? { ...step, player: gainRoletaRelic(step.player, contract, data) } : step;
}

export interface RoletaRunResult {
  /** Venceu o 1º ciclo. */
  won: boolean;
  /** Ciclos vencidos (até o teto pedido). */
  cyclesWon: number;
  villainReached: string | null;
  rounds: number[];
  level: number;
  /** Relíquias ao fim da run. */
  relics: string[];
  /** Vontades do Fogo usadas na run. */
  revivesUsed: number;
}

/** Auditoria (docs/balanceamento/benchmark.md): cada luta, com a categoria do vilão e o ciclo. */
export type RoletaFightHook = (fight: FightAudit, category: RCategory, cycle: number, itemsUsed: number) => void;

/** Run do Roleta enxuto com o bot: ciclos de lutas sorteadas por categoria, até cair ou vencer `maxCycles` ciclos. */
export function runRoletaRun(
  initial: PlayerState,
  villainsById: Record<string, VillainDef>,
  rng: Rng,
  data: RoletaData,
  difficulty: Difficulty = 'normal',
  maxCycles = 1,
  progression = true,
  onFight?: RoletaFightHook,
): RoletaRunResult {
  let run = newRoletaRun(initial, difficulty);
  const rounds: number[] = [];
  let cyclesWon = 0;
  const done = (won: boolean, villainReached: string | null): RoletaRunResult => ({
    won,
    cyclesWon,
    villainReached,
    rounds,
    level: run.player.level,
    relics: run.player.relics ?? [],
    revivesUsed: run.player.revivesUsed,
  });
  for (let guard = 0; guard < 400; guard++) {
    if (!run.villainId) run = drawVillain(run, data, rng);
    if (progression) {
      const ev = autoRoletaEvent(run.player, rng, data);
      run = { ...run, player: roletaLevelUps(ev.player, data), mods: { ...run.mods, ...ev.mods } };
    }
    let start: RBattle | null = null;
    const fight = runRoletaBattle(run.player, villainFor(run, villainsById, data), rng, data, run.mods, onFight ? (s) => (start = s) : undefined);
    rounds.push(fight.round);
    if (onFight && start) onFight(auditRoletaFight(start, fight), data.cycle[run.step] ?? 'genin', run.cycle, fight.log.filter((e) => e.type === 'item').length);
    const villainId = run.villainId;
    const res = finishRoletaFight(run, fight, data, rng);
    run = res.run;
    if (!res.outcome.won) return done(cyclesWon > 0, villainId);
    run = { ...run, player: roletaLevelUps(run.player, data) };
    if (progression && !res.outcome.boss) run = { ...run, player: autoRelicReward(run.player, data.cycle[run.step - 1] ?? 'genin', run.cycle, rng, data) };
    if (run.bossChoice) run = chooseChest(run, run.bossChoice[0]!, data);
    if (res.outcome.boss) {
      cyclesWon++;
      if (cyclesWon >= maxCycles) return done(true, null);
      if (run.status === 'victory') {
        // O modo infinito existe só no Hardcore.
        if (!canContinueRoleta(run)) return done(true, null);
        run = continueRoletaCycle(run);
      }
    }
  }
  throw new Error('run sem fim');
}
