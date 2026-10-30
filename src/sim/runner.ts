import { playRound, startBattle, type BattleOptions, type BattleState } from '../core/combat';
import type { GameData } from '../core/gameData';
import { scaleVillain, type Difficulty } from '../core/difficulty';
import { canLevelUp, equipTrainingWeights, fullRestore, gainXp, recoverAfterWin, trainingWeightsWin, type PlayerState } from '../core/player';
import {
  applyAkatsuki,
  applyClanLesson,
  applyGuru,
  applyItem,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  applyTraining,
  chooseUpgrade,
  examRecover,
  forfeitUpgrade,
  HANDS,
  levelUp,
  playJokenpo,
  rewardItemSpins,
  rollAkatsuki,
  rollGuru,
  rollPremiumChoices,
  rollItem,
  rollReward,
  rollRewardChoices,
  rollSummonAnimal,
  rollTraining,
  rollWeighted,
  type NextFightMods,
  type Step,
} from '../core/progression';
import type { Rng } from '../core/rng';
import type { VillainDef } from '../core/types';
import type { PremiumId, RewardId } from '../data/events';
import type { Stage } from '../data/campaign';
import { chooseExtras, choosePlayerAction, chooseReaction, chooseUpgradeTarget } from './policy';

/** Teto de segurança contra lutas infinitas (ex.: ambos só descansando). */
export const MAX_ROUNDS = 200;

export function runBattle(
  player: PlayerState,
  villain: VillainDef,
  rng: Rng,
  data: GameData,
  options: Partial<BattleOptions> = {},
): BattleState {
  let state = startBattle(player, villain, options, data, rng);
  while (state.status === 'ongoing' && state.round < MAX_ROUNDS) {
    const action = choosePlayerAction(state, data);
    state = playRound(state, action, rng, data, chooseExtras(state, action, data), chooseReaction);
  }
  return state;
}

/** Gasta os upgrades à escolha pendentes (o XP de um upgrade sem alvo pode subir de nível de novo). */
function spendUpgrades(player: PlayerState, data: GameData): PlayerState {
  let p = player;
  while (p.pendingUpgrades > 0) {
    const target = chooseUpgradeTarget(p, data);
    p = target ? chooseUpgrade(p, target, data).player : forfeitUpgrade(p, data).player;
  }
  return p;
}

/** Sobe de nível enquanto houver XP para isso e gasta os upgrades à escolha. */
function levelUps(player: PlayerState, data: GameData): PlayerState {
  let p = spendUpgrades(player, data);
  while (canLevelUp(p, data)) p = spendUpgrades(levelUp(p, data).player, data);
  return p;
}

/** Vitória: recupera parte do HP e do chakra, ganha o XP do vilão (e o taijutsu dos pesos de treino) e sobe de nível. */
export function awardXp(player: PlayerState, villain: VillainDef, data: GameData, exam = false): PlayerState {
  const recovered = recoverAfterWin(player, data);
  const p = exam ? recovered : trainingWeightsWin(recovered, data);
  return levelUps(gainXp(p, villain.xp, data), data);
}

export interface CampaignOptions {
  /** Simula também eventos pré-vilão e recompensas, com escolhas automáticas. */
  progression?: boolean;
}

export interface CampaignResult {
  won: boolean;
  /** Índice da etapa onde a run terminou (ou o total, se venceu). */
  stageReached: number;
  villainReached: string | null;
  revivesUsed: number;
  rounds: number[];
  /** Nível com que o jogador chegou a cada luta, na ordem. */
  levels: number[];
  /** Vitórias no exame chunin. */
  examWins: number;
}

// Escolhas automáticas fora do combate (simulação com progressão).

/** Ordem de preferência na recompensa lendária (o jogador escolhe 1 de 3). */
/** Escolha automática entre as premium oferecidas pelo guru. */
const PREMIUM_PREFERENCE: PremiumId[] = ['rasengan', 'shadowClones', 'focus', 'glimmer', 'substitution', 'medical'];

function autoGuru(player: PlayerState, rng: Rng, data: GameData): Step {
  const outcome = rollGuru(player, rng, data).value;
  if (outcome === 'charlatan') return applyGuru(player, outcome, null, data);
  const choices = rollPremiumChoices(player, rng, data).map((r) => r.value);
  return applyGuru(player, outcome, PREMIUM_PREFERENCE.find((id) => choices.includes(id)) ?? choices[0]!, data);
}

const REWARD_PREFERENCE: RewardId[] = ['newTechnique', 'stages', 'secondaryElement', 'item', 'xp', 'resistance', 'critBonus'];

function autoItem(player: PlayerState, rng: Rng, data: GameData): Step {
  const item = rollItem(player, rng, data);
  const step = applyItem(player, item.value, rng, data);
  // Pesos de treino: o jogador automático equipa e nunca tira.
  return step.effect.kind === 'trainingWeights' ? { ...step, player: equipTrainingWeights(step.player, data) } : step;
}

function autoReward(player: PlayerState, tier: number, rng: Rng, data: GameData): PlayerState {
  let id: RewardId;
  if (tier >= 3) {
    const choices = rollRewardChoices(player, rng, data).map((r) => r.value);
    id = REWARD_PREFERENCE.find((r) => choices.includes(r)) ?? choices[0]!;
  } else {
    id = rollReward(player, rng, data).value;
  }
  let p = player;
  if (id === 'item') {
    for (let i = 0; i < rewardItemSpins(tier, data); i++) p = autoItem(p, rng, data).player;
  } else {
    p = applyReward(p, id, tier, rng, data).player;
  }
  return levelUps(p, data);
}

function autoEvent(player: PlayerState, rng: Rng, data: GameData): Step {
  const ev = rollWeighted(data.preFightEvents, rng).value;
  switch (ev) {
    case 'oldLady':
    case 'ramen':
      return applySimpleEvent(player, ev);
    case 'training':
      return applyTraining(player, rollTraining(player, rng).value, data);
    case 'jokenpo':
      return playJokenpo(player, HANDS[0]!, rng, data);
    case 'foundItem':
      return autoItem(player, rng, data);
    case 'summon':
      return applySummonEncounter(player, player.summon?.animal ?? rollSummonAnimal(rng, data).value);
    case 'akatsuki':
      return applyAkatsuki(player, rollAkatsuki(player, rng, data).value, data);
    case 'guru':
      return autoGuru(player, rng, data);
    case 'clanLesson':
      return applyClanLesson(player, data);
  }
}

/**
 * Campanha com XP e nível. HP e chakra seguem entre as lutas; só subir de nível, o fim do exame e a
 * Vontade do Fogo restauram. No exame, perder não encerra a run nem gasta a Vontade do Fogo (segue com
 * metade do HP e do chakra); só vencer dá XP. Com `progression`, simula também eventos e recompensas.
 */
export function runCampaign(
  initial: PlayerState,
  stages: Stage[],
  villainsById: Record<string, VillainDef>,
  rng: Rng,
  data: GameData,
  difficulty: Difficulty = 'normal',
  options: CampaignOptions = {},
): CampaignResult {
  let player = initial;
  const rounds: number[] = [];
  const levels: number[] = [];
  let examWins = 0;
  const villain = (id: string) => scaleVillain(villainsById[id]!, difficulty, data);
  const result = (won: boolean, stageReached: number, villainReached: string | null): CampaignResult => ({
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
      for (const villainId of stage.villains) {
        levels.push(player.level);
        const fight = runBattle(player, villain(villainId), rng, data, { allowRevive: false });
        rounds.push(fight.round);
        player = fight.player;
        if (fight.status === 'won') {
          wins++;
          player = awardXp(player, villainsById[villainId]!, data, true);
        } else {
          player = examRecover(player, data);
        }
      }
      examWins = wins;
      // Fim do exame: sai totalmente restaurado, qualquer que seja o resultado.
      player = fullRestore(player);
      const tier = data.balance.exam.rewardTierByWins[wins] ?? 0;
      if (options.progression && tier > 0) player = autoReward(player, tier, rng, data);
      continue;
    }

    let mods: Partial<NextFightMods> = {};
    if (options.progression) {
      const ev = autoEvent(player, rng, data);
      player = levelUps(ev.player, data);
      mods = ev.mods;
    }
    for (let j = 0; j < stage.villains.length; j++) {
      const villainId = stage.villains[j]!;
      levels.push(player.level);
      const fightOptions: Partial<BattleOptions> = j === 0 ? mods : {};
      const fight = runBattle(player, villain(villainId), rng, data, fightOptions);
      rounds.push(fight.round);
      player = fight.player;
      if (fight.status !== 'won') return result(false, i, villainId);
      player = awardXp(player, villainsById[villainId]!, data);
      const tier = stage.rewardTiers[j];
      if (options.progression && tier) player = autoReward(player, tier, rng, data);
    }
  }
  return result(true, stages.length, null);
}
