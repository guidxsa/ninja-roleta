import type { RoletaData } from '../../core/roleta/data';
import type { ItemId, PreFightEventId, RewardId, Weighted } from '../events';
import { gameData } from '../index';
import { roletaBalance } from './balance';
import { roletaKits } from './kits';
import { roletaTechniquesById } from './techniques';
import { roletaRelics } from '../relics';
import { roletaCategories, roletaCycle } from './villains';

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
  // Ferramenta ninja, amuletos e Pesos de treino viraram relíquias (v0.46.0); a Bomba de fumaça saiu (a esquiva é
  // passiva). Ficam recursos e consumíveis.
  { id: 'revive', weight: 12 },
  { id: 'xpScroll', weight: 22 },
  { id: 'soldierPill', weight: 20 },
  { id: 'medKit', weight: 20 },
  { id: 'explosiveTag', weight: 18 },
  { id: 'loadedCoin', weight: 8 },
];

/** Recompensa direta: sem "Nova técnica"; com a fatia "Relíquia" (v0.46.0). */
export const roletaRewards: Weighted<RewardId>[] = [
  // Status junta estágios, resistência e crítico (v0.52.0).
  { id: 'stages', weight: 35 },
  { id: 'relic', weight: 22 },
  { id: 'xp', weight: 20 },
  { id: 'item', weight: 18 },
  { id: 'jackpot', weight: 5 },
];

export const roletaData: RoletaData = {
  base: {
    ...gameData,
    lineages: gameData.lineages.filter((l) => !roletaBalance.retiredLineages.includes(l.id)),
    techniques: [],
    levelTechniques: [],
    preFightEvents: roletaPreFightEvents,
    items: roletaItems,
    rewards: roletaRewards,
    balance: {
      ...gameData.balance,
      techniqueUpgrade: { ...gameData.balance.techniqueUpgrade, milestones: [] },
      rewards: { ...gameData.balance.rewards, critBonus: roletaBalance.rewards.critBonus },
    },
  },
  r: roletaBalance,
  techniques: roletaTechniquesById,
  kits: roletaKits,
  relics: roletaRelics,
  categories: roletaCategories,
  cycle: roletaCycle,
};
