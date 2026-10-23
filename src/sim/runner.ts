import { playRound, startBattle, type BattleOptions, type BattleState } from '../core/combat';
import type { GameData } from '../core/gameData';
import { scaleVillain, type Difficulty } from '../core/difficulty';
import { canLevelUp, fullRestore, gainXp, type PlayerState } from '../core/player';
import { levelUp } from '../core/progression';
import type { Rng } from '../core/rng';
import type { VillainDef } from '../core/types';
import type { Stage } from '../data/campaign';
import { choosePlayerAction, shouldFocus } from './policy';

/** Teto de segurança contra lutas infinitas (ex.: ambos só descansando). */
export const MAX_ROUNDS = 200;

export function runBattle(
  player: PlayerState,
  villain: VillainDef,
  rng: Rng,
  data: GameData,
  options: Partial<BattleOptions> = {},
): BattleState {
  let state = startBattle(player, villain, options);
  while (state.status === 'ongoing' && state.round < MAX_ROUNDS) {
    const action = choosePlayerAction(state, data);
    state = playRound(state, action, rng, data, shouldFocus(state, action, data));
  }
  return state;
}

/** Ganha o XP do vilão derrotado e sobe de nível enquanto houver XP para isso. */
export function awardXp(player: PlayerState, villain: VillainDef, data: GameData): PlayerState {
  let p = gainXp(player, villain.xp, data);
  while (canLevelUp(p, data)) p = levelUp(p, data).player;
  return p;
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
}

/**
 * Campanha com XP e subida de nível, sem eventos nem recompensas: mede a curva de dificuldade.
 * No exame, como no jogo, perder não encerra a run nem gasta a Vontade do Fogo; só vencer dá XP.
 */
export function runCampaign(
  initial: PlayerState,
  stages: Stage[],
  villainsById: Record<string, VillainDef>,
  rng: Rng,
  data: GameData,
  difficulty: Difficulty = 'normal',
): CampaignResult {
  let player = initial;
  const rounds: number[] = [];
  const levels: number[] = [];
  const villain = (id: string) => scaleVillain(villainsById[id]!, difficulty, data);
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    if (stage.kind === 'exam') {
      for (const villainId of stage.villains) {
        if (data.balance.exam.restoreBetweenFights) player = fullRestore(player);
        levels.push(player.level);
        const result = runBattle(player, villain(villainId), rng, data, { allowRevive: false });
        rounds.push(result.round);
        player = { ...result.player, hp: Math.max(1, result.player.hp) };
        if (result.status === 'won') player = awardXp(player, villainsById[villainId]!, data);
      }
      if (data.balance.campaign.restoreBetweenStages) player = fullRestore(player);
      continue;
    }
    for (const villainId of stage.villains) {
      levels.push(player.level);
      const result = runBattle(player, villain(villainId), rng, data);
      rounds.push(result.round);
      player = result.player;
      if (result.status !== 'won') {
        return { won: false, stageReached: i, villainReached: villainId, revivesUsed: player.revivesUsed, rounds, levels };
      }
      player = awardXp(player, villainsById[villainId]!, data);
    }
    if (data.balance.campaign.restoreBetweenStages) player = fullRestore(player);
  }
  return { won: true, stageReached: stages.length, villainReached: null, revivesUsed: player.revivesUsed, rounds, levels };
}
