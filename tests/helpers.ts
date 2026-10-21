import type { Rng } from '../src/core/rng';
import type { VillainDef } from '../src/core/types';

/** RNG que devolve os valores dados em sequência (e repete o último). */
export function seq(...values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

export function testVillain(overrides: Partial<VillainDef> = {}): VillainDef {
  return {
    id: 'dummy',
    element: 'earth',
    hp: 50,
    chakra: 20,
    speed: 10,
    defense: { taijutsu: 5, ninjutsu: 5, genjutsu: 5 },
    critBonus: 0,
    xp: 50,
    techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 1 }],
    ...overrides,
  };
}
