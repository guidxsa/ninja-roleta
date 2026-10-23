import type { Balance } from '../data/balance';
import type { AkatsukiOutcome, GuruOutcome, ItemId, PreFightEventId, RewardId, Weighted } from '../data/events';
import type { AttackType, Element, LineageDef, SummonAnimal, TechniqueDef } from './types';

/** Pacote de dados que o core recebe por parâmetro (nunca importa diretamente). */
export interface GameData {
  balance: Balance;
  lineages: LineageDef[];
  elementWeights: Record<Element, number>;
  beats: Record<Element, Element>;
  /** Ações básicas por tipo (o jogador só tem as dos tipos iniciais da origem). */
  basicTechniques: Record<AttackType, TechniqueDef[]>;
  techniquesById: Record<string, TechniqueDef>;
  /** Técnicas aprendíveis (pool da recompensa "nova técnica"). */
  techniques: TechniqueDef[];
  /** Técnicas aprendidas sozinhas ao atingir um nível (`minLevel`). */
  levelTechniques: TechniqueDef[];
  preFightEvents: Weighted<PreFightEventId>[];
  items: Weighted<ItemId>[];
  akatsukiOutcomes: { jinchuuriki: Weighted<AkatsukiOutcome>[]; others: Weighted<AkatsukiOutcome>[] };
  guruOutcomes: Weighted<GuruOutcome>[];
  summonAnimals: Weighted<SummonAnimal>[];
  rewards: Weighted<RewardId>[];
}
