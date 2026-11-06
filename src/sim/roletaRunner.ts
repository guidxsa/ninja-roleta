// Simulação do Roleta enxuto (docs/roleta/combate.md): bot simples e a campanha com eventos e recompensas diretos.
// O bot joga pior que um humano: escolhe o golpe de mais dano esperado, usa a ativa logo e quase não defende.
import type { Difficulty } from '../core/difficulty';
import { canLevelUp, equipTrainingWeights, gainXp, recoverAfterWin, trainingWeightsWin, type PlayerState } from '../core/player';
import {
  applyAkatsuki,
  applyItem,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  applyTraining,
  HANDS,
  levelUp,
  playJokenpo,
  rewardItemSpins,
  rollAkatsuki,
  rollItem,
  rollReward,
  rollSummonAnimal,
  rollTraining,
  rollWeighted,
  type Step,
} from '../core/progression';
import {
  canUseActive,
  canUseTechnique,
  kitOf,
  playerAttackOdds,
  playerHitDamage,
  playRoletaRound,
  startRoletaBattle,
  useActive,
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
  rewardRelic,
  villainFor,
} from '../core/roleta/run';
import { playerTechniques } from '../core/roleta/player';
import type { Rng } from '../core/rng';
import type { VillainDef } from '../core/types';

/** Teto de segurança contra lutas infinitas. */
export const MAX_ROUNDS = 200;

/** Dano esperado de uma técnica agora (acerto × dano × golpes, com o crítico). */
function expected(s: RBattle, id: string, data: RoletaData): number {
  const t = data.techniques[id]!;
  const odds = playerAttackOdds(s, t, data);
  const per = playerHitDamage(s, t, data);
  const critMult = data.base.balance.crit.multiplier;
  return (odds.hit - odds.crit + odds.crit * critMult) * per * (t.hits ?? 1);
}

/** Ação do bot: itens nos apertos, o golpe de mais dano esperado que dá para pagar, ou Concentrar se valer a pena. */
export function chooseRoletaAction(s: RBattle, data: RoletaData): RAction {
  const p = s.player;
  const bag = p.bag;
  if (bag.explosiveTag > 0 && s.villain.hp <= data.r.items.explosiveTagDamage) return 'item:explosiveTag';
  if (bag.medKit > 0 && p.hp < p.maxHp * 0.3 && s.fx.effects.length > 0) return 'item:medKit';
  if (bag.smokeBomb > 0 && p.hp < p.maxHp * 0.25) return 'item:smokeBomb';
  const techs = playerTechniques(p, data);
  const affordable = techs.filter((t) => canUseTechnique(s, t, data));
  const best = (list: typeof techs) => list.map((t) => ({ t, e: expected(s, t.id, data) })).sort((a, b) => b.e - a.e)[0];
  const bestNow = best(affordable);
  const bestAll = best(techs);
  if (bestAll && bestNow && bestAll.t.id !== bestNow.t.id && bestAll.e > bestNow.e * 1.5 && p.hp > p.maxHp * 0.5) {
    if (bag.soldierPill > 0) return 'item:soldierPill';
    return 'rest';
  }
  return bestNow ? `tech:${bestNow.t.id}` : 'rest';
}

/** Ativa grátis: o bot usa logo (os Portões só com HP alto). */
function wantsActive(s: RBattle, data: RoletaData): boolean {
  if (!canUseActive(s, data)) return false;
  const kind = kitOf(s.player, data).active;
  if (kind === 'gates') return s.player.hp > s.player.maxHp * 0.5;
  return true;
}

export function runRoletaBattle(player: PlayerState, villain: VillainDef, rng: Rng, data: RoletaData, options: Partial<RBattleOptions> = {}): RBattle {
  let s = startRoletaBattle(player, villain, options, data, rng);
  while (s.status === 'ongoing' && s.round < MAX_ROUNDS) {
    if (wantsActive(s, data)) s = useActive(s, data, rng);
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

/** Recompensa direta: um giro (a lendária só tem valores maiores); a fatia Relíquia dá uma da raridade. */
export function autoRoletaReward(player: PlayerState, tier: number, rng: Rng, data: RoletaData): PlayerState {
  const id = rollReward(player, rng, data.base).value;
  let p = player;
  if (id === 'item') for (let i = 0; i < rewardItemSpins(tier, data.base); i++) p = autoItem(p, rng, data).player;
  else if (id === 'relic') {
    const relic = rewardRelic(p, tier, data, rng);
    p = relic ? autoWeights(gainRoletaRelic(p, relic, data), data) : gainXp(p, data.base.balance.rewards.xp[tier - 1]!, data.base);
  } else p = applyReward(p, id, tier, rng, data.base).player;
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
}

/** Run do Roleta enxuto com o bot: ciclos de lutas sorteadas por categoria, até cair ou vencer `maxCycles` ciclos. */
export function runRoletaRun(
  initial: PlayerState,
  villainsById: Record<string, VillainDef>,
  rng: Rng,
  data: RoletaData,
  difficulty: Difficulty = 'normal',
  maxCycles = 1,
  progression = true,
): RoletaRunResult {
  let run = newRoletaRun(initial, difficulty);
  const rounds: number[] = [];
  let cyclesWon = 0;
  for (let guard = 0; guard < 400; guard++) {
    if (!run.villainId) run = drawVillain(run, data, rng);
    if (progression) {
      const ev = autoRoletaEvent(run.player, rng, data);
      run = { ...run, player: roletaLevelUps(ev.player, data), mods: { ...run.mods, ...ev.mods } };
    }
    const fight = runRoletaBattle(run.player, villainFor(run, villainsById, data), rng, data, run.mods);
    rounds.push(fight.round);
    const villainId = run.villainId;
    const res = finishRoletaFight(run, fight, data, rng);
    run = res.run;
    if (!res.outcome.won) return { won: cyclesWon > 0, cyclesWon, villainReached: villainId, rounds, level: run.player.level };
    run = { ...run, player: roletaLevelUps(run.player, data) };
    if (progression && res.outcome.tier > 0) run = { ...run, player: autoRoletaReward(run.player, res.outcome.tier, rng, data) };
    if (run.bossChoice) run = chooseChest(run, run.bossChoice[0]!, data);
    if (res.outcome.boss) {
      cyclesWon++;
      if (cyclesWon >= maxCycles) return { won: true, cyclesWon, villainReached: null, rounds, level: run.player.level };
      if (run.status === 'victory') run = continueRoletaCycle(run);
    }
  }
  throw new Error('run sem fim');
}
