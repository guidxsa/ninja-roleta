import { startBattle, type BattleOptions, type BattleState, type MentalHold, type Side } from '../src/core/combat';
import type { PlayerState } from '../src/core/player';
import type { Rng } from '../src/core/rng';
import type { VillainDef } from '../src/core/types';

/** RNG que devolve os valores dados em sequência (e repete o último). */
export function seq(...values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

/** Efeito mental valendo, para montar estados de teste. */
export function hold(strength = 1, served = 0): MentalHold {
  return { strength, served };
}

/** Fixa a iniciativa da luta (sem gastar um número do rng com a rolagem da 1ª rodada). */
export function withInitiative(s: BattleState, side: Side = 'player'): BattleState {
  return { ...s, initiative: side };
}

/**
 * Vilão de teste: sem ataque (o dano é só o da técnica) e resistências 10, que Resistindo (70%) valem 7.
 * Sem `reactions`: só resiste, sem gastar números do rng.
 */
export function testVillain(overrides: Partial<VillainDef> = {}): VillainDef {
  return {
    id: 'dummy',
    element: 'earth',
    hp: 50,
    chakra: 20,
    speed: 10,
    offense: { taijutsu: 0, ninjutsu: 0, genjutsu: 0 },
    resistance: { physical: 10, mental: 10 },
    critBonus: 0,
    xp: 50,
    techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 1 }],
    ...overrides,
  };
}

/** Começa uma luta sem a restauração do início (para testar HP e chakra baixos). */
export function battle(player: PlayerState, villain: VillainDef, options: Partial<BattleOptions> = {}): BattleState {
  return startBattle(player, villain, { restore: false, ...options });
}
