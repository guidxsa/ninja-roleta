import type { Balance } from '../../data/balance';
import type { JornadaBalance } from '../../data/jornada/balance';
import type { Element } from '../types';
import type { EventDef } from './events';
import type { RelicDef } from './relics';
import type { GenericDef, StageDef } from './trail';
import type { TalentNode } from './talents';
import type { CharacterDef, EnemyDef, JTechnique } from './types';

/** Pacote de dados que o core da Jornada recebe por parâmetro (nunca importa os dados diretamente). */
export interface JornadaData {
  /** `balance` do jogo: acerto, crítico, penetração e dificuldade são os mesmos do Roleta. */
  base: Pick<Balance, 'hit' | 'crit' | 'penetration' | 'difficulty'>;
  j: JornadaBalance;
  beats: Record<Element, Element>;
  techniques: Record<string, JTechnique>;
  characters: Record<string, CharacterDef>;
  enemies: Record<string, EnemyDef>;
  /** Técnicas que um aliado ganha ao chegar no estágio (índice do estágio). */
  stageTechniques: Record<string, Record<number, string[]>>;
  stages: StageDef[];
  talents: TalentNode[];
  relics: RelicDef[];
  events: Record<string, EventDef>;
  /** Linha de técnicas de cada elemento (níveis I, II e III) para o Comum e os suportes genéricos. */
  elementLines: Record<Element, readonly [string, string, string]>;
  generic: GenericDef;
}
