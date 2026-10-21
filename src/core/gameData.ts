import type { Balance } from '../data/balance';
import type { AttackType, Element, LineageDef, TechniqueDef } from './types';

/** Pacote de dados que o core recebe por parâmetro (nunca importa diretamente). */
export interface GameData {
  balance: Balance;
  lineages: LineageDef[];
  elementWeights: Record<Element, number>;
  beats: Record<Element, Element>;
  basicTechniques: Record<AttackType, TechniqueDef>;
  techniquesById: Record<string, TechniqueDef>;
}
