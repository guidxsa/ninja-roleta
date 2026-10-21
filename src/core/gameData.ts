import type { Balance } from '../data/balance';
import type { EncounterId, ItemId, PreFightEventId, RewardId, Weighted } from '../data/events';
import type { AttackType, Element, LineageDef, SummonAnimal, TechniqueDef } from './types';

/** Pacote de dados que o core recebe por parâmetro (nunca importa diretamente). */
export interface GameData {
  balance: Balance;
  lineages: LineageDef[];
  elementWeights: Record<Element, number>;
  beats: Record<Element, Element>;
  basicTechniques: Record<AttackType, TechniqueDef>;
  techniquesById: Record<string, TechniqueDef>;
  /** Técnicas aprendíveis (pool da recompensa "nova técnica"). */
  techniques: TechniqueDef[];
  preFightEvents: Weighted<PreFightEventId>[];
  items: Weighted<ItemId>[];
  encounters: Weighted<EncounterId>[];
  summonAnimals: Weighted<SummonAnimal>[];
  rewards: Weighted<RewardId>[];
}
