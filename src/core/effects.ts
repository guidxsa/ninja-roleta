// Efeitos de combate comuns ao Roleta e à Jornada (docs/base/efeitos.md). Números em `balance.effects`.
// Cada motor guarda os efeitos do jeito dele; aqui ficam a duração, o dano por turno e o que é controle.

export type EffectKind = 'burn' | 'poison' | 'stun' | 'chakraBlock' | 'fear';

export interface EffectRules {
  burn: { turns: number; pct: number };
  poison: { turns: number; pct: number };
  stun: { turns: number };
  chakraBlock: { turns: number };
  fear: { turns: number; damageMult: number; accuracy: number };
  minControlTurns: number;
  stunImmunityTurns: number;
}

/** Controle é o que tira ação: atordoar (perde a vez) e bloqueio de chakra (só taijutsu). */
export const isControl = (kind: string): boolean => kind === 'stun' || kind === 'chakraBlock';

/** Turnos do efeito (o pedido pela técnica ou o padrão); controle dura no mínimo `minControlTurns`. */
export function effectDuration(kind: EffectKind, rules: EffectRules, requested?: number): number {
  const turns = requested ?? rules[kind].turns;
  return isControl(kind) ? Math.max(turns, rules.minControlTurns) : turns;
}

/** Dano de Queimar ou Veneno no começo do turno (pelo menos 1). `mult`: a Praga do Aburame dobra o veneno. */
export function dotDamage(kind: 'burn' | 'poison', maxHp: number, rules: EffectRules, mult = 1): number {
  return Math.max(1, Math.floor(maxHp * rules[kind].pct * mult));
}
