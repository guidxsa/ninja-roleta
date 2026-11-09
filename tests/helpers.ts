import { startBattle, type BattleOptions, type BattleState, type MentalHold, type Side } from '../src/core/combat';
import type { PlayerState } from '../src/core/player';
import type { Rng } from '../src/core/rng';
import type { GameData } from '../src/core/gameData';
import type { VillainDef } from '../src/core/types';
import { gameData } from '../src/data/index';

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

/** Dados do jogo sem a regeneração passiva de chakra (para isolar outra mecânica de chakra). */
export const noRegen: GameData = { ...gameData, balance: { ...gameData.balance, chakraRegen: { pct: 0, min: 0 } } };

/**
 * Base fixa para os testes de fórmula (combate clássico, reações, habilidades, progressão, laboratório): as origens com
 * os status e elementos de antes do rebalanceamento da v0.59.0. Esses testes medem as fórmulas, não o balanceamento;
 * assim um ajuste de números nas origens não reescreve dezenas de contas esperadas. Os testes de origem usam os dados reais.
 */
const LEGACY_LINEAGES: Record<string, Pick<GameData['lineages'][number], 'weight' | 'stats' | 'resistance' | 'elements'>> = {
  common: { weight: 30, stats: { taijutsu: 10, ninjutsu: 10, genjutsu: 10, speed: 10, hp: 100, chakra: 30 }, resistance: { physical: 10, mental: 10 }, elements: { countWeights: [0, 50, 35, 15] } },
  inuzuka: { weight: 8, stats: { taijutsu: 14, ninjutsu: 7, genjutsu: 5, speed: 14, hp: 100, chakra: 24 }, resistance: { physical: 12, mental: 7 }, elements: { countWeights: [30, 55, 15] } },
  taijutsuProdigy: { weight: 9, stats: { taijutsu: 18, ninjutsu: 0, genjutsu: 0, speed: 13, hp: 110, chakra: 22 }, resistance: { physical: 12, mental: 8 }, elements: { countWeights: [1] } },
  uchiha: { weight: 7, stats: { taijutsu: 11, ninjutsu: 11, genjutsu: 13, speed: 11, hp: 100, chakra: 28 }, resistance: { physical: 9, mental: 11 }, elements: { fixed: 'fire', countWeights: [0, 65, 35] } },
  uzumaki: { weight: 7, stats: { taijutsu: 10, ninjutsu: 10, genjutsu: 5, speed: 9, hp: 120, chakra: 38 }, resistance: { physical: 12, mental: 9 }, elements: { countWeights: [30, 55, 15] } },
  senju: { weight: 3, stats: { taijutsu: 11, ninjutsu: 11, genjutsu: 6, speed: 10, hp: 125, chakra: 40 }, resistance: { physical: 12, mental: 10 }, elements: { countWeights: [0, 40, 40, 20] } },
};
const CLAN_LEGACY = { countWeights: [30, 55, 15] };
export const formulaData: GameData = {
  ...gameData,
  // Origens de antes da v0.59.0: clãs, Hyuuga e Uzumaki com potencial parcial (o Uzumaki com a Etiqueta Explosiva).
  lineages: gameData.lineages.map((l) => {
    const partial = l.tier === 'clan' || l.id === 'hyuuga' || l.id === 'uzumaki';
    return {
      ...l,
      ...(partial ? { elements: CLAN_LEGACY, elementalPotential: 'partial' as const } : {}),
      ...(LEGACY_LINEAGES[l.id] ?? {}),
      ...(l.id === 'uzumaki' ? { startingTechniques: ['explosiveSeal'] } : {}),
    };
  }),
};
