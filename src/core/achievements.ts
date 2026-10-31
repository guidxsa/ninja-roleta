import type { Difficulty } from './difficulty';
import type { RunStats } from './runStats';
import type { Origin, SummonState } from './types';

/** Categorias da tela de conquistas. Os segredos são easter eggs, todos escondidos. */
export type AchievementCategory = 'milestone' | 'luck' | 'style' | 'secret';

export interface AchievementContext {
  stats: RunStats;
  origin: Origin;
  difficulty: Difficulty;
  level: number;
  summon: SummonState | null;
  result: 'inProgress' | 'victory' | 'defeat';
  /** Vilão que derrotou o jogador (só na derrota). */
  fallenTo: string | null;
  /** Do perfil, já com esta run: quantas vezes cada vilão derrotou o jogador. */
  killedBy: Record<string, number>;
  /** Conquistas liberadas (as do perfil e as que acabaram de sair nesta checagem). */
  unlocked: ReadonlySet<string>;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  /** Aparece como "???" até ser liberada. */
  hidden?: boolean;
  check: (ctx: AchievementContext) => boolean;
  /** Progresso [atual, meta], para as conquistas de coleção. */
  progress?: (unlocked: ReadonlySet<string>) => [number, number];
}

/** Linhagem da origem, com o comum como `common` (o id nos dados). */
export function lineageKey(origin: Origin): string {
  return origin.lineageId ?? 'common';
}

/**
 * Conquistas que passam a valer agora, na ordem da lista. Uma que depende de outras (Mestre dos clãs)
 * enxerga as liberadas antes dela na mesma checagem.
 */
export function newAchievements(defs: readonly AchievementDef[], ctx: AchievementContext): string[] {
  const unlocked = new Set(ctx.unlocked);
  const found: string[] = [];
  for (const def of defs) {
    if (unlocked.has(def.id)) continue;
    if (!def.check({ ...ctx, unlocked })) continue;
    unlocked.add(def.id);
    found.push(def.id);
  }
  return found;
}
