import { COMMON_LINEAGE } from '../core/origin';
import type { ElementRule, LineageDef } from '../core/types';

// Origens (docs/origens.md). Textos visíveis ficam em strings/ptBR.ts.
// Uma roleta só: comum 30%, clãs 40% (8 cada), raras 30%.
// Status iniciais absolutos com o orçamento de referência de 90 pontos: taijutsu/ninjutsu/genjutsu e as resistências valem 1,
// speed 1,5, 10 de HP valem 1 e 2 de chakra valem 1. Distribuição pela lore (v0.30), com o total perto de 90. Kit inicial: Taijutsu básico; o ninjutsu básico do elemento principal só no potencial
// pleno (Comum e o fogo do Uchiha). As origens com kit dedicado começam com as técnicas da linhagem.

/** Clãs e raras com kit dedicado: podem não ter elemento nenhum (docs/origens.md#sorteio). */
const CLAN_ELEMENTS: ElementRule = { countWeights: [30, 55, 15] };


export const lineages: LineageDef[] = [
  {
    id: COMMON_LINEAGE,
    tier: 'common',
    weight: 30,
    stats: { taijutsu: 10, ninjutsu: 10, genjutsu: 10, speed: 10, hp: 100, chakra: 30 },
    resistance: { physical: 10, mental: 10 },
    elements: { countWeights: [0, 50, 35, 15] },
    elementalPotential: 'full',
    passive: 'determination',
    active: 'effort',
  },
  {
    id: 'nara',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 7, ninjutsu: 14, genjutsu: 9, speed: 9, hp: 100, chakra: 34 },
    resistance: { physical: 9, mental: 12 },
    elements: CLAN_ELEMENTS,
    elementalPotential: 'partial',
    passive: 'genius',
    startingTechniques: ['shadowImitation', 'shadowStrangle', 'shadowSlash'],
  },
  {
    id: 'akimichi',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 15, ninjutsu: 7, genjutsu: 4, speed: 6, hp: 150, chakra: 34 },
    resistance: { physical: 14, mental: 7 },
    elements: CLAN_ELEMENTS,
    elementalPotential: 'partial',
    passive: 'heavyBody',
    active: 'expansion',
    startingTechniques: ['expandedHand'],
  },
  {
    id: 'yamanaka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 8, ninjutsu: 9, genjutsu: 16, speed: 10, hp: 100, chakra: 32 },
    resistance: { physical: 8, mental: 15 },
    elements: CLAN_ELEMENTS,
    elementalPotential: 'partial',
    passive: 'mindReading',
    active: 'transmission',
    startingTechniques: ['mindTransfer', 'petalIllusion'],
  },
  {
    id: 'aburame',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 7, ninjutsu: 13, genjutsu: 8, speed: 8, hp: 105, chakra: 38 },
    resistance: { physical: 11, mental: 12 },
    elements: CLAN_ELEMENTS,
    elementalPotential: 'partial',
    passive: 'hive',
    active: 'plague',
    startingTechniques: ['insectSwarm', 'insectDevour'],
  },
  {
    id: 'inuzuka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 14, ninjutsu: 7, genjutsu: 5, speed: 14, hp: 100, chakra: 24 },
    resistance: { physical: 12, mental: 7 },
    elements: CLAN_ELEMENTS,
    elementalPotential: 'partial',
    passive: 'duo',
    active: 'beast',
    startingTechniques: ['fangOverFang'],
  },
  {
    // Portões evoluem com o taijutsu (estágios em `balance.gates`).
    id: 'taijutsuProdigy',
    tier: 'rare',
    weight: 9,
    stats: { taijutsu: 18, ninjutsu: 0, genjutsu: 0, speed: 13, hp: 110, chakra: 22 },
    resistance: { physical: 12, mental: 8 },
    elements: { countWeights: [1] },
    elementalPotential: 'none',
    passive: 'youth',
    // O taijutsu dele já é concentrado: cresce pela metade.
    taijutsuGrowth: 0.5,
    active: 'gates',
    startingTechniques: ['leafHurricane'],
    forbiddenAttackTypes: ['ninjutsu', 'genjutsu'],
  },
  {
    id: 'uchiha',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 11, ninjutsu: 11, genjutsu: 13, speed: 11, hp: 100, chakra: 28 },
    resistance: { physical: 9, mental: 11 },
    elements: { fixed: 'fire', countWeights: [0, 65, 35] },
    elementalPotential: 'fixedOnly',
    passive: 'genjutsuResistance',
    startingTechniques: ['basicGenjutsu', 'painIllusion'],
    dojutsu: 'sharingan',
  },
  {
    id: 'hyuuga',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 15, ninjutsu: 6, genjutsu: 6, speed: 12, hp: 100, chakra: 28 },
    resistance: { physical: 11, mental: 10 },
    elements: CLAN_ELEMENTS,
    elementalPotential: 'partial',
    passive: 'preciseFist',
    startingTechniques: ['chakraBlockStrike'],
    dojutsu: 'byakugan',
  },
  {
    id: 'uzumaki',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 10, ninjutsu: 10, genjutsu: 5, speed: 9, hp: 120, chakra: 38 },
    resistance: { physical: 12, mental: 9 },
    elements: CLAN_ELEMENTS,
    elementalPotential: 'partial',
    passive: 'vitality',
    active: 'seal',
    startingTechniques: ['explosiveSeal'],
  },
  {
    // Senju (lendária): vida e chakra como o Uzumaki, um degrau acima; domina qualquer elemento.
    id: 'senju',
    tier: 'legendary',
    weight: 3,
    stats: { taijutsu: 11, ninjutsu: 11, genjutsu: 6, speed: 10, hp: 125, chakra: 40 },
    resistance: { physical: 12, mental: 10 },
    elements: { countWeights: [0, 40, 40, 20] },
    elementalPotential: 'full',
    passive: 'vitalForce',
    extraRevives: 1,
  },
];

export const lineagesById: Record<string, LineageDef> = Object.fromEntries(lineages.map((l) => [l.id, l]));
