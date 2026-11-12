// Eventos da trilha (docs/jornada/run.md#eventos): escolhas com efeito, algumas com minijogo e algumas
// que dependem de escolhas anteriores (marcas da run).
import type { RelicTier } from './relics';
import type { ConsumableId } from './types';

export type Minigame = 'memory' | 'seals' | 'jokenpo';

export type EventEffect =
  | { kind: 'ryo'; n: number }
  | { kind: 'talent'; n: number }
  | { kind: 'xp'; n: number }
  | { kind: 'healTeam'; hp: number; chakra: number }
  | { kind: 'healFull' }
  | { kind: 'relic'; tier: RelicTier }
  | { kind: 'item'; id: ConsumableId; n: number }
  | { kind: 'flag'; id: string }
  | { kind: 'maxStat'; who: 'hero' | 'team'; stat: 'hp' | 'chakra'; n: number }
  /** Perde uma fração do HP atual da equipe (nunca abaixo de 1). */
  | { kind: 'hurtTeam'; pct: number }
  /** Maldição do mercador: cada compra encarece a loja até ela sair (marca `SHOP_CURSE`). */
  | { kind: 'curse' }
  /** Tira a maldição do mercador. */
  | { kind: 'cleanse' }
  /** O protagonista aprende uma técnica (marco da história ou treino de evento; não passa pela árvore). */
  | { kind: 'learn'; technique: string };

/** Marca da maldição do mercador (docs/jornada/run.md#loja). */
export const SHOP_CURSE = 'shopCurse';

export interface EventOption {
  id: string;
  /** Só aparece com esta marca na run. */
  requires?: string;
  /** Some com esta marca. */
  hiddenBy?: string;
  /** Minijogo antes do efeito: ganhar dá `effects`, perder dá `onLose`. */
  minigame?: Minigame;
  /** Ryō pago ao escolher (a opção some sem ryō suficiente). */
  cost?: number;
  effects: EventEffect[];
  onLose?: EventEffect[];
}

export interface EventDef {
  id: string;
  options: EventOption[];
}

export function eventOptions(def: EventDef, flags: readonly string[], ryo = Infinity): EventOption[] {
  return def.options.filter(
    (o) => (!o.requires || flags.includes(o.requires)) && (!o.hiddenBy || !flags.includes(o.hiddenBy)) && (o.cost ?? 0) <= ryo,
  );
}
