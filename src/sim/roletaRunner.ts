// Simulação do Roleta enxuto (docs/roleta/combate.md): bot simples e a campanha com eventos e recompensas diretos.
// O bot joga pior que um humano: escolhe o golpe de mais dano esperado, usa a ativa logo e quase não defende.
import type { Difficulty } from '../core/difficulty';
import { scaleVillain } from '../core/difficulty';
import { canLevelUp, equipTrainingWeights, fullRestore, gainXp, recoverAfterWin, trainingWeightsWin, type PlayerState } from '../core/player';
import {
  applyAkatsuki,
  applyItem,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  applyTraining,
  examRecover,
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
  type NextFightMods,
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
import { playerTechniques } from '../core/roleta/player';
import type { Rng } from '../core/rng';
import type { VillainDef } from '../core/types';
import type { Stage } from '../data/campaign';

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
  const affordable = techs.filter((t) => canUseTechnique(s, t));
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
  const step = applyItem(player, item.value, rng, data.base);
  // Pesos de treino: o bot equipa e nunca tira.
  return step.effect.kind === 'trainingWeights' ? { ...step, player: equipTrainingWeights(step.player, data.base) } : step;
}

/** Recompensa direta: um giro (a lendária só tem valores maiores). */
export function autoRoletaReward(player: PlayerState, tier: number, rng: Rng, data: RoletaData): PlayerState {
  const id = rollReward(player, rng, data.base).value;
  let p = player;
  if (id === 'item') for (let i = 0; i < rewardItemSpins(tier, data.base); i++) p = autoItem(p, rng, data).player;
  else p = applyReward(p, id, tier, rng, data.base).player;
  return roletaLevelUps(p, data);
}

/** Evento pré-luta direto (sem guru, Lição do clã nem foco elemental). */
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
      return applySummonEncounter(player, player.summon?.animal ?? rollSummonAnimal(rng, data.base).value);
    case 'akatsuki':
      return applyAkatsuki(player, rollAkatsuki(player, rng, data.base).value, data.base);
    default:
      // Guru e Lição do clã não existem no Roleta enxuto.
      return applySimpleEvent(player, 'ramen');
  }
}

export interface RoletaCampaignResult {
  won: boolean;
  stageReached: number;
  villainReached: string | null;
  revivesUsed: number;
  rounds: number[];
  levels: number[];
  examWins: number;
}

/** Campanha (ordem de hoje, com o exame) com o combate e a progressão enxutos. */
export function runRoletaCampaign(
  initial: PlayerState,
  stages: Stage[],
  villainsById: Record<string, VillainDef>,
  rng: Rng,
  data: RoletaData,
  difficulty: Difficulty = 'normal',
  progression = true,
): RoletaCampaignResult {
  let player = initial;
  const rounds: number[] = [];
  const levels: number[] = [];
  let examWins = 0;
  const villain = (id: string) => scaleVillain(villainsById[id]!, difficulty, data.base);
  const result = (won: boolean, stageReached: number, villainReached: string | null): RoletaCampaignResult => ({
    won,
    stageReached,
    villainReached,
    revivesUsed: player.revivesUsed,
    rounds,
    levels,
    examWins,
  });
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    if (stage.kind === 'exam') {
      let wins = 0;
      for (const id of stage.villains) {
        levels.push(player.level);
        const fight = runRoletaBattle(player, villain(id), rng, data, { allowRevive: false });
        rounds.push(fight.round);
        player = fight.player;
        if (fight.status === 'won') {
          wins++;
          player = roletaAwardXp(player, villainsById[id]!, data, true);
        } else player = examRecover(player, data.base);
      }
      examWins = wins;
      player = fullRestore(player);
      const tier = data.base.balance.exam.rewardTierByWins[wins] ?? 0;
      if (progression && tier > 0) player = autoRoletaReward(player, tier, rng, data);
      continue;
    }
    let mods: Partial<NextFightMods> = {};
    if (progression) {
      const ev = autoRoletaEvent(player, rng, data);
      player = roletaLevelUps(ev.player, data);
      mods = ev.mods;
    }
    for (let j = 0; j < stage.villains.length; j++) {
      const id = stage.villains[j]!;
      levels.push(player.level);
      const fight = runRoletaBattle(player, villain(id), rng, data, j === 0 ? mods : {});
      rounds.push(fight.round);
      player = fight.player;
      if (fight.status !== 'won') return result(false, i, id);
      player = roletaAwardXp(player, villainsById[id]!, data);
      const tier = stage.rewardTiers[j];
      if (progression && tier) player = autoRoletaReward(player, tier, rng, data);
    }
  }
  return result(true, stages.length, null);
}
