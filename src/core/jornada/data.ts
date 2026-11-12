import type { Balance } from '../../data/balance';
import type { JornadaBalance } from '../../data/jornada/balance';
import type { Element, KekkeiGenkaiDef } from '../types';
import type { EventDef } from './events';
import type { RelicDef } from './relics';
import type { GenericDef, StageDef } from './trail';
import type { TalentNode } from './talents';
import type { CharacterDef, EnemyDef, JTechnique } from './types';

/**
 * Uma campanha da História: a perspectiva de um personagem, com seus arcos (estágios) em ordem. Os sistemas são os
 * mesmos para todas; muda o que se conta e como (docs/jornada/README.md#campanhas). `time` liga a campanha ao dia ou
 * à noite da identidade visual.
 */
/**
 * Marco da história (docs/jornada/roteiro.md#marcos): técnica que a campanha dá a um personagem (protagonista ou
 * aliado) a partir de um estágio (índice, contando do 0) ou depois de uma parada. Não passa pela árvore de talentos.
 */
export interface StoryGrant {
  who: string;
  learn: string;
  at: { stage: number } | { stop: string };
}

export interface CampaignDef {
  id: string;
  perspective: 'naruto' | 'sasuke';
  time: 'day' | 'night';
  stages: StageDef[];
  /** Marcos da história: técnicas que a campanha dá (substitui o antigo `stageTechniques`, v0.66.0). */
  grants?: StoryGrant[];
}

/** Pacote de dados que o core da Jornada recebe por parâmetro (nunca importa os dados diretamente). */
export interface JornadaData {
  /** `balance` do jogo: acerto, crítico, penetração e dificuldade são os mesmos do Roleta. */
  base: Pick<Balance, 'hit' | 'crit' | 'penetration' | 'difficulty' | 'clones' | 'gateCosts'>;
  j: JornadaBalance;
  beats: Record<Element, Element>;
  techniques: Record<string, JTechnique>;
  characters: Record<string, CharacterDef>;
  enemies: Record<string, EnemyDef>;
  /** Técnicas que um aliado ganha ao chegar no estágio (índice do estágio). */
  /** Kekkei Genkai (as mesmas da base): pais de cada natureza para a vantagem (src/core/nature.ts). */
  kekkeiGenkai: KekkeiGenkaiDef[];
  /** Arcos da campanha do Naruto (o mesmo que `campaigns.naruto.stages`). */
  stages: StageDef[];
  campaigns: Record<string, CampaignDef>;
  talents: TalentNode[];
  relics: RelicDef[];
  events: Record<string, EventDef>;
  /** Linha de técnicas de cada elemento (níveis I, II e III) para o Comum e os suportes genéricos. */
  elementLines: Record<Element, readonly [string, string, string]>;
  generic: GenericDef;
}
