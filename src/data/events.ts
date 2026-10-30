import type { ConsumableId, SummonAnimal } from '../core/types';

// Roletas fora do combate (docs/campanha.md e docs/itens.md). Textos visíveis ficam em strings/ptBR.ts.

export type PreFightEventId =
  | 'summon'
  | 'oldLady'
  | 'ramen'
  | 'akatsuki'
  | 'training'
  | 'jokenpo'
  | 'foundItem'
  | 'guru'
  | 'clanLesson';

export type ItemId =
  | 'revive'
  | 'ninjaTool'
  | 'techniqueScroll'
  | 'resistanceItem'
  | 'speedItem'
  | 'xpScroll'
  | ConsumableId
  | 'loadedCoin'
  | 'trainingWeights';

/** Encontro com a Akatsuki: o jinchuuriki é caçado (ou passa despercebido); os outros assistem (ou se metem). */
export type AkatsukiOutcome = 'hunted' | 'unnoticed' | 'insight' | 'meddled';

/** Encontro com o guru: charlatão ou uma premium (campanha.md#guru). */
export type GuruOutcome = 'charlatan' | 'premium';

/** Premium do guru: técnicas e talentos sem elemento. */
export type PremiumId = 'rasengan' | 'medical' | 'focus' | 'substitution' | 'shadowClones' | 'glimmer';

export type RewardId = 'stages' | 'newTechnique' | 'xp' | 'item' | 'resistance' | 'critBonus' | 'secondaryElement';

export interface Weighted<T> {
  id: T;
  weight: number;
}

/** Roleta pré-vilão. Pesos fixos nesta versão. */
export const preFightEvents: Weighted<PreFightEventId>[] = [
  { id: 'summon', weight: 10 },
  { id: 'oldLady', weight: 10 },
  { id: 'ramen', weight: 10 },
  { id: 'akatsuki', weight: 10 },
  { id: 'training', weight: 20 },
  { id: 'jokenpo', weight: 20 },
  { id: 'foundItem', weight: 10 },
  { id: 'guru', weight: 10 },
  { id: 'clanLesson', weight: 10 },
];

/** Roleta de itens ("Achou um item" e a fatia de itens da recompensa). */
export const items: Weighted<ItemId>[] = [
  { id: 'revive', weight: 10 },
  { id: 'ninjaTool', weight: 12 },
  { id: 'techniqueScroll', weight: 13 },
  { id: 'resistanceItem', weight: 10 },
  { id: 'speedItem', weight: 10 },
  { id: 'xpScroll', weight: 10 },
  { id: 'soldierPill', weight: 8 },
  { id: 'medKit', weight: 8 },
  { id: 'explosiveTag', weight: 7 },
  { id: 'smokeBomb', weight: 5 },
  { id: 'loadedCoin', weight: 4 },
  { id: 'trainingWeights', weight: 3 },
];

export const CONSUMABLES: readonly ConsumableId[] = ['soldierPill', 'medKit', 'explosiveTag', 'smokeBomb'];

export const akatsukiOutcomes: { jinchuuriki: Weighted<AkatsukiOutcome>[]; others: Weighted<AkatsukiOutcome>[] } = {
  jinchuuriki: [
    { id: 'hunted', weight: 70 },
    { id: 'unnoticed', weight: 30 },
  ],
  others: [
    { id: 'insight', weight: 70 },
    { id: 'meddled', weight: 30 },
  ],
};

/** Sem premium para ensinar, a fatia some. A premium é sorteada depois, pelo perfil do jogador. */
export const guruOutcomes: Weighted<GuruOutcome>[] = [
  { id: 'charlatan', weight: 20 },
  { id: 'premium', weight: 80 },
];

export const summonAnimals: Weighted<SummonAnimal>[] = [
  { id: 'toad', weight: 1 },
  { id: 'snake', weight: 1 },
  { id: 'slug', weight: 1 },
];

/** Roleta de recompensa após cada vilão ou bloco. A raridade define a força de cada fatia. */
export const rewards: Weighted<RewardId>[] = [
  { id: 'stages', weight: 20 },
  { id: 'newTechnique', weight: 20 },
  { id: 'xp', weight: 20 },
  { id: 'item', weight: 15 },
  { id: 'resistance', weight: 10 },
  { id: 'critBonus', weight: 10 },
  { id: 'secondaryElement', weight: 5 },
];
