// Trilha da run canônica (docs/jornada/canonica.md): cada estágio é uma sequência fixa de paradas, sem
// ramificação. O mapa ramificado é das runs genéricas (ainda não implementadas).
import type { Element } from '../types';
import type { WinCondition } from './types';

export type FightKind = 'story' | 'fight' | 'elite' | 'boss';

export type StopDef =
  | {
      kind: FightKind;
      id: string;
      enemies: string[];
      /** Suportes desta luta (ids); `[]` = o Naruto sozinho. Sem o campo, a equipe do estágio. */
      team?: string[];
      win?: WinCondition;
    }
  | { kind: 'event'; id: string; event: string }
  | { kind: 'shop'; id: string }
  | { kind: 'rest'; id: string }
  | { kind: 'treasure'; id: string };

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

/** Classe das runs genéricas (docs/jornada/classes.md). */
export interface ClassDef {
  id: string;
  /** Personagem protagonista; o Comum sem elemento vira `noElementHero` (prodígio). */
  hero: string;
  noElementHero?: string;
  /** Elemento fixo (Uchiha: fogo); sem ele, o elemento é sorteado (pode sair nenhum). */
  fixedElement?: Element;
  /** Sorteia um segundo elemento (pode sair nenhum), diferente do fixo. */
  secondElement?: boolean;
  /** Conquista que libera a classe (sem o campo, liberada desde o início). */
  unlock?: string;
  /** Versão suporte da classe: entra no sorteio de suportes quando a classe está liberada. */
  support?: string;
}

/** Estágio de uma run genérica: pools sorteados no mapa (mesma dificuldade da canônica). */
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
  classes: ClassDef[];
  /** Suportes das runs genéricas (versão suporte; elemento sorteado). */
  supports: string[];
  stages: GenericStage[];
}
