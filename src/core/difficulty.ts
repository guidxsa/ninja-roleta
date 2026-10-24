import type { GameData } from './gameData';
import type { VillainDef } from './types';

export type Difficulty = keyof GameData['balance']['difficulty']['multipliers'];

const scale = (n: number, mult: number) => Math.max(1, Math.floor(n * mult));

/**
 * Aplica o modificador de força da dificuldade ao vilão: HP, dano base e barreira das técnicas, ataques
 * e resistências. Speed, chakra, crítico e XP ficam iguais. No hardcore, a passiva do vilão vira a
 * versão hardcore (`hardcorePassive`), quando ele tem uma.
 */
export function scaleVillain(def: VillainDef, difficulty: Difficulty, data: GameData): VillainDef {
  const mult = data.balance.difficulty.multipliers[difficulty];
  const passive = difficulty === 'hardcore' ? (def.hardcorePassive ?? def.passive) : def.passive;
  if (mult === 1 && passive === def.passive) return def;
  // Ataques zerados continuam zerados (o 0 não vira 1).
  const stat = (n: number) => (n > 0 ? scale(n, mult) : 0);
  return {
    ...def,
    hp: scale(def.hp, mult),
    offense: { taijutsu: stat(def.offense.taijutsu), ninjutsu: stat(def.offense.ninjutsu), genjutsu: stat(def.offense.genjutsu) },
    resistance: { physical: stat(def.resistance.physical), mental: stat(def.resistance.mental) },
    techniques: def.techniques.map((t) => ({
      ...t,
      baseDamage: t.baseDamage > 0 ? scale(t.baseDamage, mult) : 0,
      ...(t.barrier !== undefined ? { barrier: scale(t.barrier, mult) } : {}),
    })),
    ...(passive ? { passive } : {}),
  };
}
