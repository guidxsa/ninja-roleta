import { COMMON_LINEAGE } from '../core/origin';
import type { ElementRule, LineageDef } from '../core/types';

// Origens (docs/base/origens.md). Textos visíveis ficam em strings/ptBR.ts.
// Uma roleta só: comum 30%, clãs 40% (8 cada), raras 30%.
// Status iniciais absolutos com o orçamento de referência de 90 pontos: taijutsu/ninjutsu/genjutsu e as resistências valem 1,
// speed 1,5, 10 de HP valem 1 e 2 de chakra valem 1. Distribuição pela lore (v0.30), com o total perto de 90. Kit inicial: Taijutsu básico; o ninjutsu básico do elemento principal só no potencial
// pleno (Comum e o fogo do Uchiha). As origens com kit dedicado começam com as técnicas da linhagem.

/**
 * Natureza das origens sem ninjutsu elemental (docs/base/origens.md#natureza): uma, sorteada em silêncio (sem roleta),
 * só na ficha e na vantagem elemental (v0.59.0).
 */
const SILENT_NATURE: ElementRule = { countWeights: [0, 1], silent: true };


export const lineages: LineageDef[] = [
  {
    id: COMMON_LINEAGE,
    tier: 'common',
    // Leva o peso do Prodígio do taijutsu (30 + 9): o Comum sem elemento vira Prodígio (`rollOrigin`).
    weight: 39,
    // Base de ninjutsu elemental; genjutsu baixo (antes 10/10/10, com o genjutsu desperdiçado).
    stats: { taijutsu: 12, ninjutsu: 13, genjutsu: 5, speed: 10, hp: 100, chakra: 32 },
    resistance: { physical: 10, mental: 9 },
    // Roleta de proficiência: sem proficiência (9 de 39 no total) = Prodígio do taijutsu; com, uma natureza (v0.59.0).
    elements: { countWeights: [18, 60] },
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
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'genius',
    startingTechniques: ['shadowImitation', 'shadowStrangle', 'shadowSlash'],
  },
  {
    id: 'akimichi',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 15, ninjutsu: 7, genjutsu: 4, speed: 6, hp: 150, chakra: 34 },
    resistance: { physical: 14, mental: 7 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
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
    elements: SILENT_NATURE,
    elementalPotential: 'none',
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
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'hive',
    active: 'plague',
    startingTechniques: ['insectSwarm', 'insectDevour'],
  },
  {
    id: 'inuzuka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 15, ninjutsu: 7, genjutsu: 5, speed: 14, hp: 100, chakra: 24 },
    resistance: { physical: 13, mental: 7 },
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'duo',
    active: 'beast',
    startingTechniques: ['fangOverFang'],
  },
  {
    // Portões evoluem com o taijutsu (estágios em `balance.gates`).
    id: 'taijutsuProdigy',
    tier: 'rare',
    // Fora da roleta da linhagem: sai do Comum que tira 0 elementos (`rollOrigin`).
    weight: 0,
    stats: { taijutsu: 18, ninjutsu: 0, genjutsu: 0, speed: 13, hp: 110, chakra: 22 },
    resistance: { physical: 12, mental: 8 },
    elements: SILENT_NATURE,
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
    stats: { taijutsu: 10, ninjutsu: 12, genjutsu: 13, speed: 11, hp: 100, chakra: 28 },
    resistance: { physical: 10, mental: 11 },
    // Sempre e só Fogo (v0.59.0).
    elements: { fixed: 'fire', countWeights: [0, 1] },
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
    elements: SILENT_NATURE,
    elementalPotential: 'none',
    passive: 'preciseFist',
    startingTechniques: ['chakraBlockStrike'],
    dojutsu: 'byakugan',
  },
  {
    id: 'uzumaki',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 12, ninjutsu: 12, genjutsu: 3, speed: 11, hp: 120, chakra: 38 },
    resistance: { physical: 12, mental: 9 },
    // Uma natureza com ninjutsu elemental: ela ocupa o lugar da Etiqueta Explosiva no kit (v0.59.0).
    elements: { countWeights: [0, 1] },
    elementalPotential: 'full',
    passive: 'vitality',
    active: 'seal',
  },
  {
    // Senju (lendária): vida e chakra como o Uzumaki, um degrau acima; domina qualquer elemento.
    id: 'senju',
    tier: 'legendary',
    weight: 3,
    stats: { taijutsu: 12, ninjutsu: 13, genjutsu: 5, speed: 12, hp: 125, chakra: 40 },
    resistance: { physical: 12, mental: 10 },
    // Uma natureza; a rolagem especial do Mokuton está em kekkeiGenkai.ts.
    elements: { countWeights: [0, 1] },
    elementalPotential: 'full',
    passive: 'vitalForce',
    extraRevives: 1,
  },
];

export const lineagesById: Record<string, LineageDef> = Object.fromEntries(lineages.map((l) => [l.id, l]));
