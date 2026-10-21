import { playRound, startBattle, type BattleOptions, type BattleState } from '../core/combat';
import type { GameData } from '../core/gameData';
import { fullRestore, type PlayerState } from '../core/player';
import type { Rng } from '../core/rng';
import type { VillainDef } from '../core/types';
import type { Stage } from '../data/campaign';
import { choosePlayerAction } from './policy';

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
    state = playRound(state, choosePlayerAction(state, data), rng, data);
  }
  return state;
}

export interface CampaignResult {
  won: boolean;
  /** Índice da etapa onde a run terminou (ou o total, se venceu). */
  stageReached: number;
  villainReached: string | null;
  revivesUsed: number;
  rounds: number[];
}

/** Campanha sem eventos, recompensas e exame: mede a curva de dificuldade crua. */
export function runCampaign(
  initial: PlayerState,
  stages: Stage[],
  villainsById: Record<string, VillainDef>,
  rng: Rng,
  data: GameData,
): CampaignResult {
  let player = initial;
  const rounds: number[] = [];
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    if (stage.kind === 'exam') continue;
    for (const villainId of stage.villains) {
      const result = runBattle(player, villainsById[villainId]!, rng, data);
      rounds.push(result.round);
      player = result.player;
      if (result.status !== 'won') {
        return { won: false, stageReached: i, villainReached: villainId, revivesUsed: player.revivesUsed, rounds };
      }
    }
    if (data.balance.campaign.restoreBetweenStages) player = fullRestore(player);
  }
  return { won: true, stageReached: stages.length, villainReached: null, revivesUsed: player.revivesUsed, rounds };
}
