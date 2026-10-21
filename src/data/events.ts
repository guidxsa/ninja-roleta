import type { SummonAnimal } from '../core/types';

// Roletas fora do combate. Textos visíveis ficam em strings/ptBR.ts. Pesos provisórios.

export type PreFightEventId =
  | 'nothing'
  | 'oldLady'
  | 'ramen'
  | 'mysteriousEncounter'
  | 'training'
  | 'jokenpo'
  | 'foundItem';

export type ItemId = 'revive' | 'ninjaTool' | 'techniqueScroll' | 'resistanceItem' | 'speedItem';

export type EncounterId = 'akatsuki' | 'summon';

export type RewardId = 'stages' | 'newTechnique' | 'techniqueUpgrade' | 'resistance' | 'critBonus' | 'item';

/** Status que a roleta de nível pode melhorar. Quanto de cada: `balance.level.statGains`. */
export type LevelStatId = 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'speed' | 'hp' | 'chakra' | 'resistance';

export interface Weighted<T> {
  id: T;
  weight: number;
}

/** Roleta de nível. Status proibidos pela origem (ex.: ninjutsu do prodígio) saem da roleta. */
export const levelUpStats: Weighted<LevelStatId>[] = [
  { id: 'taijutsu', weight: 2 },
  { id: 'ninjutsu', weight: 2 },
  { id: 'genjutsu', weight: 2 },
  { id: 'speed', weight: 2 },
  { id: 'hp', weight: 2 },
  { id: 'chakra', weight: 1 },
  { id: 'resistance', weight: 1 },
];

/** Roleta pré-vilão. Pesos fixos nesta versão (os status não alteram as fatias). */
export const preFightEvents: Weighted<PreFightEventId>[] = [
  { id: 'nothing', weight: 10 },
  { id: 'oldLady', weight: 10 },
  { id: 'ramen', weight: 10 },
  { id: 'mysteriousEncounter', weight: 10 },
  { id: 'training', weight: 20 },
  { id: 'jokenpo', weight: 20 },
  { id: 'foundItem', weight: 20 },
];

/** Sugestão inicial: pesos iguais, item de retorno um pouco mais raro. */
export const items: Weighted<ItemId>[] = [
  { id: 'revive', weight: 2 },
  { id: 'ninjaTool', weight: 3 },
  { id: 'techniqueScroll', weight: 3 },
  { id: 'resistanceItem', weight: 3 },
  { id: 'speedItem', weight: 3 },
];

export const encounters: Weighted<EncounterId>[] = [
  { id: 'akatsuki', weight: 1 },
  { id: 'summon', weight: 1 },
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
