import type { GameData } from './gameData';
import type { VillainDef } from './types';

export type Difficulty = keyof GameData['balance']['difficulty']['multipliers'];

const scale = (n: number, mult: number) => Math.max(1, Math.floor(n * mult));

/**
 * Aplica o modificador de força da dificuldade ao vilão: HP, dano base das técnicas e atributos
 * defensivos. Speed, chakra, crítico e XP ficam iguais. No hardcore, a passiva do vilão vira a
 * versão hardcore (`hardcorePassive`), quando ele tem uma.
 */
export function scaleVillain(def: VillainDef, difficulty: Difficulty, data: GameData): VillainDef {
  const mult = data.balance.difficulty.multipliers[difficulty];
  const passive = difficulty === 'hardcore' ? (def.hardcorePassive ?? def.passive) : def.passive;
  if (mult === 1 && passive === def.passive) return def;
  return {
    ...def,
    hp: scale(def.hp, mult),
    defense: {
      taijutsu: scale(def.defense.taijutsu, mult),
      ninjutsu: scale(def.defense.ninjutsu, mult),
      genjutsu: scale(def.defense.genjutsu, mult),
    },
    techniques: def.techniques.map((t) => ({ ...t, baseDamage: scale(t.baseDamage, mult) })),
    ...(passive ? { passive } : {}),
  };
}
