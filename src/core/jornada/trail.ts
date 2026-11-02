// Trilha da run canônica (docs/jornada/canonica.md): cada estágio é uma sequência fixa de paradas, sem
// ramificação. O mapa ramificado é das runs genéricas (ainda não implementadas).
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
