// Trilha da História (docs/jornada/historia.md): cada estágio é uma sequência fixa de paradas, sem
// ramificação. O mapa ramificado é do Caminho Ninja (ainda não implementadas).
import type { Element } from '../types';
import type { ScriptRule } from './script';
import type { WinCondition } from './types';

export type FightKind = 'story' | 'fight' | 'elite' | 'boss';

export type StopDef = (
  | {
      kind: FightKind;
      id: string;
      enemies: string[];
      /** Suportes desta luta (ids); `[]` = o Naruto sozinho. Sem o campo, a equipe do estágio. */
      team?: string[];
      win?: WinCondition;
      /** Roteiro da luta: gatilhos e ações (docs/jornada/roteiro.md). */
      script?: ScriptRule[];
      /**
       * Derrota inevitável (teste do sino, v0.68.0): qualquer fim de luta conta como progresso. Não gasta Vontade do
       * Fogo nem encerra a run; a recompensa da luta continua.
       */
      inevitableLoss?: boolean;
    }
  /** `then`: eventos seguintes na mesma parada (etapas), abertos em sequência sem voltar à trilha (v0.70.0). */
  | { kind: 'event'; id: string; event: string; then?: string[] }
  | { kind: 'rest'; id: string }
  | { kind: 'treasure'; id: string }
) & {
  /** Local desta parada (só visual); sem o campo, o cenário do estágio. */
  scene?: string;
};

export interface StageDef {
  id: string;
  /** Suportes das lutas sem equipe própria. */
  team: string[];
  /** Cenário da tela de batalha. */
  scene: string;
  stops: StopDef[];
}

export const isFight = (s: StopDef): s is Extract<StopDef, { enemies: string[] }> =>
  s.kind === 'story' || s.kind === 'fight' || s.kind === 'elite' || s.kind === 'boss';

/** Suportes de uma luta. */
export function teamFor(stage: StageDef, stop: StopDef): string[] {
  return isFight(stop) ? (stop.team ?? stage.team) : stage.team;
}

/** Classe do Caminho Ninja (docs/jornada/classes.md). */
export interface ClassDef {
  id: string;
  /** Personagem protagonista; o Comum sem elemento vira `noElementHero` (prodígio). */
  hero: string;
  noElementHero?: string;
  /** Elemento fixo (Uchiha: fogo); sem ele, o elemento é sorteado (pode sair nenhum). */
  fixedElement?: Element;
  /** Sorteia um segundo elemento (pode sair nenhum), diferente do fixo. */
  secondElement?: boolean;
  /** Classe sem elemento (Hyuuga): nem sorteia nem ganha a técnica elemental. */
  noElement?: boolean;
  /** Conquista que libera a classe (sem o campo, liberada desde o início). */
  unlock?: string;
  /** Fichas da versão suporte da classe (ids distintos: dois suportes da mesma classe não repetem ficha). */
  supports: string[];
  /** Chaves de nome sorteadas para os suportes da classe (textos em strings/jornada.ts). */
  supportNames: string[];
}

/** Estágio de uma run do Caminho Ninja: pools sorteados no mapa (mesma dificuldade da História). */
export interface GenericStage {
  id: string;
  scene: string;
  /** Lutas das primeiras linhas do mapa (até 'easyRows' do balance), mais leves. */
  easyFights: string[][];
  fights: string[][];
  elites: string[][];
  /** Um chefe é sorteado no começo da run e aparece no topo do mapa. */
  bosses: string[][];
  events: string[];
}

export interface GenericDef {
  /** Classes; os suportes do Caminho Ninja saem das versões suporte das classes liberadas. */
  classes: ClassDef[];
  stages: GenericStage[];
}
