// Eventos da trilha (docs/jornada/run.md#eventos): escolhas com efeito, algumas com minijogo e algumas
// que dependem de escolhas anteriores (marcas da run).
import type { RelicTier } from './relics';
import type { ConsumableId } from './types';

export type Minigame = 'memory' | 'seals' | 'jokenpo';

export type EventEffect =
  | { kind: 'ryo'; n: number }
  | { kind: 'talent'; n: number }
  | { kind: 'xp'; n: number }
  | { kind: 'healTeam'; pct: number }
  | { kind: 'relic'; tier: RelicTier }
  | { kind: 'item'; id: ConsumableId; n: number }
  | { kind: 'flag'; id: string }
  | { kind: 'maxStat'; who: 'hero' | 'team'; stat: 'hp' | 'chakra'; n: number };

export interface EventOption {
  id: string;
  /** Só aparece com esta marca na run. */
  requires?: string;
  /** Some com esta marca. */
  hiddenBy?: string;
  /** Minijogo antes do efeito: ganhar dá `effects`, perder dá `onLose`. */
  minigame?: Minigame;
  effects: EventEffect[];
  onLose?: EventEffect[];
}

export interface EventDef {
  id: string;
  options: EventOption[];
}

export function eventOptions(def: EventDef, flags: readonly string[]): EventOption[] {
  return def.options.filter((o) => (!o.requires || flags.includes(o.requires)) && (!o.hiddenBy || !flags.includes(o.hiddenBy)));
}
