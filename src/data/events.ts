import type { SummonAnimal } from '../core/types';

// Roletas fora do combate. Textos visíveis ficam em strings/ptBR.ts. Pesos provisórios.

export type PreFightEventId =
  | 'summon'
  | 'oldLady'
  | 'ramen'
  | 'akatsuki'
  | 'training'
  | 'jokenpo'
  | 'foundItem'
  | 'guru';

export type ItemId = 'revive' | 'ninjaTool' | 'techniqueScroll' | 'resistanceItem' | 'speedItem';

/** Encontro com a Akatsuki: o jinchuuriki é caçado (ou passa despercebido); os outros assistem (ou se metem). */
export type AkatsukiOutcome = 'hunted' | 'unnoticed' | 'insight' | 'meddled';

/** Encontro com o guru: charlatão, técnica nova ou o segredo do crítico garantido. */
export type GuruOutcome = 'charlatan' | 'technique' | 'focus';

export type RewardId = 'stages' | 'newTechnique' | 'techniqueUpgrade' | 'resistance' | 'critBonus' | 'item';

export interface Weighted<T> {
  id: T;
  weight: number;
}

/** Roleta pré-vilão. Pesos fixos nesta versão (os status não alteram as fatias). */
export const preFightEvents: Weighted<PreFightEventId>[] = [
  { id: 'summon', weight: 10 },
  { id: 'oldLady', weight: 10 },
  { id: 'ramen', weight: 10 },
  { id: 'akatsuki', weight: 10 },
  { id: 'training', weight: 20 },
  { id: 'jokenpo', weight: 20 },
  { id: 'foundItem', weight: 10 },
  { id: 'guru', weight: 10 },
];

/** Sugestão inicial: pesos iguais, Vontade do Fogo um pouco mais rara. */
export const items: Weighted<ItemId>[] = [
  { id: 'revive', weight: 2 },
  { id: 'ninjaTool', weight: 3 },
  { id: 'techniqueScroll', weight: 3 },
  { id: 'resistanceItem', weight: 3 },
  { id: 'speedItem', weight: 3 },
];

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

/** Sem técnica ofensiva para ensinar (ou já sabendo o crítico garantido), a fatia some. */
export const guruOutcomes: Weighted<GuruOutcome>[] = [
  { id: 'charlatan', weight: 30 },
  { id: 'technique', weight: 50 },
  { id: 'focus', weight: 20 },
];

export const summonAnimals: Weighted<SummonAnimal>[] = [
  { id: 'toad', weight: 1 },
  { id: 'snake', weight: 1 },
  { id: 'slug', weight: 1 },
];

/** Roleta de recompensa após cada etapa vencida. */
export const rewards: Weighted<RewardId>[] = [
  { id: 'stages', weight: 4 },
  { id: 'newTechnique', weight: 3 },
  { id: 'techniqueUpgrade', weight: 2 },
  { id: 'resistance', weight: 2 },
  { id: 'critBonus', weight: 2 },
  { id: 'item', weight: 2 },
];
