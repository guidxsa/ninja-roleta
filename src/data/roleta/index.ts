import type { RoletaData } from '../../core/roleta/data';
import type { ItemId, PreFightEventId, RewardId, Weighted } from '../events';
import { gameData } from '../index';
import { roletaBalance } from './balance';
import { roletaKits } from './kits';
import { roletaTechniquesById } from './techniques';

// Pacote de dados do Roleta enxuto (docs/roleta/). Reaproveita a base (`gameData`: linhagens, níveis, dificuldade,
// eventos, itens e recompensas), sem o que saiu do modo: pool de técnicas, técnicas de nível, upgrades dos marcos,
// guru, Lição do clã, Pergaminho de técnica e a fatia "Nova técnica".

/** Roleta pré-luta direta: sem guru e sem Lição do clã (o peso foi para Treino e Achou item). */
export const roletaPreFightEvents: Weighted<PreFightEventId>[] = [
  { id: 'summon', weight: 10 },
  { id: 'oldLady', weight: 10 },
  { id: 'ramen', weight: 10 },
  { id: 'akatsuki', weight: 10 },
  { id: 'training', weight: 25 },
  { id: 'jokenpo', weight: 20 },
  { id: 'foundItem', weight: 15 },
];

/** Roleta de itens sem o Pergaminho de técnica (as técnicas sobem sozinhas). */
export const roletaItems: Weighted<ItemId>[] = [
  { id: 'revive', weight: 10 },
  { id: 'ninjaTool', weight: 14 },
  { id: 'resistanceItem', weight: 12 },
  { id: 'speedItem', weight: 12 },
  { id: 'xpScroll', weight: 12 },
  { id: 'soldierPill', weight: 9 },
  { id: 'medKit', weight: 9 },
  { id: 'explosiveTag', weight: 8 },
  { id: 'smokeBomb', weight: 6 },
  { id: 'loadedCoin', weight: 4 },
  { id: 'trainingWeights', weight: 4 },
];

/** Recompensa direta: sem "Nova técnica". */
export const roletaRewards: Weighted<RewardId>[] = [
  { id: 'stages', weight: 25 },
  { id: 'xp', weight: 25 },
  { id: 'item', weight: 20 },
  { id: 'resistance', weight: 15 },
  { id: 'critBonus', weight: 15 },
];

export const roletaData: RoletaData = {
  base: {
    ...gameData,
    techniques: [],
    levelTechniques: [],
    preFightEvents: roletaPreFightEvents,
    items: roletaItems,
    rewards: roletaRewards,
    balance: { ...gameData.balance, techniqueUpgrade: { ...gameData.balance.techniqueUpgrade, milestones: [] } },
  },
  r: roletaBalance,
  techniques: roletaTechniquesById,
  kits: roletaKits,
};
