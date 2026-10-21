import type { Rng } from './rng';
import { spin } from './roulette';

/** Chance de A agir primeiro: a² / (a² + b²). */
export function initiativeChance(speedA: number, speedB: number): number {
  const a2 = speedA * speedA;
  const b2 = speedB * speedB;
  if (a2 + b2 === 0) return 0.5;
  return a2 / (a2 + b2);
}

export function initiativeSlices(speedA: number, speedB: number) {
  const chance = initiativeChance(speedA, speedB);
  return [
    { label: 'a', weight: chance, value: 'a' as const },
    { label: 'b', weight: 1 - chance, value: 'b' as const },
  ];
}

export function rollInitiative(speedA: number, speedB: number, rng: Rng): 'a' | 'b' {
  return spin(initiativeSlices(speedA, speedB), rng).slice.value;
}
