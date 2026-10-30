import { COMMON_LINEAGE } from '../core/origin';
import type { LineageDef } from '../core/types';

// Origens (docs/origens.md). Textos visíveis ficam em strings/ptBR.ts.
// Uma roleta só: comum 30%, clãs 40% (8 cada), raras 30%.
// Status iniciais absolutos com o orçamento de referência de 90 pontos: taijutsu/ninjutsu/genjutsu e as resistências valem 1,
// speed 1,5, 10 de HP valem 1 e 2 de chakra valem 1. Exceções calibradas na simulação (v0.18): Nara, Yamanaka e
// Uchiha acima (genjutsu e resistência mental valem menos na prática); prodígio, Akimichi, Inuzuka e Uzumaki abaixo.
// Kit inicial de todos: Taijutsu básico e o ninjutsu básico do elemento (se a origem usa ninjutsu).

export const lineages: LineageDef[] = [
  {
    id: COMMON_LINEAGE,
    tier: 'common',
    weight: 30,
    stats: { taijutsu: 10, ninjutsu: 10, genjutsu: 10, speed: 10, hp: 100, chakra: 30 },
    resistance: { physical: 10, mental: 10 },
    affinity: { kind: 'rolled' },
    passive: 'determination',
    active: 'effort',
  },
  {
    id: 'nara',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 10, ninjutsu: 13, genjutsu: 8, speed: 9, hp: 105, chakra: 32 },
    resistance: { physical: 10, mental: 10 },
    affinity: { kind: 'rolled' },
    passive: 'genius',
    startingTechniques: ['shadowImitation'],
  },
  {
    id: 'akimichi',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 15, ninjutsu: 8, genjutsu: 5, speed: 6, hp: 145, chakra: 34 },
    resistance: { physical: 14, mental: 6 },
    affinity: { kind: 'rolled' },
    passive: 'heavyBody',
    active: 'expansion',
  },
  {
    id: 'yamanaka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 10, ninjutsu: 9, genjutsu: 15, speed: 10, hp: 110, chakra: 30 },
    resistance: { physical: 10, mental: 14 },
    affinity: { kind: 'rolled' },
    passive: 'mindReading',
    active: 'transmission',
    startingTechniques: ['mindTransfer'],
  },
  {
    id: 'aburame',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 8, ninjutsu: 16, genjutsu: 6, speed: 8, hp: 110, chakra: 34 },
    resistance: { physical: 9, mental: 11 },
    affinity: { kind: 'rolled' },
    passive: 'hive',
    active: 'plague',
    startingTechniques: ['insectSwarm', 'insectDevour'],
  },
  {
    id: 'inuzuka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 14, ninjutsu: 8, genjutsu: 6, speed: 13, hp: 95, chakra: 24 },
    resistance: { physical: 12, mental: 8 },
    affinity: { kind: 'rolled' },
    passive: 'duo',
    active: 'beast',
    startingTechniques: ['fangOverFang'],
  },
  {
    // Portões evoluem com o taijutsu (estágios em `balance.gates`).
    id: 'taijutsuProdigy',
    tier: 'rare',
    weight: 9,
    stats: { taijutsu: 17, ninjutsu: 0, genjutsu: 0, speed: 12, hp: 110, chakra: 28 },
    resistance: { physical: 11, mental: 9 },
    affinity: { kind: 'none' },
    passive: 'ironBody',
    active: 'gates',
    forbiddenAttackTypes: ['ninjutsu', 'genjutsu'],
  },
  {
    id: 'uchiha',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 12, ninjutsu: 9, genjutsu: 12, speed: 10, hp: 105, chakra: 26 },
    resistance: { physical: 10, mental: 10 },
    affinity: { kind: 'fixed', element: 'fire' },
    passive: 'genjutsuResistance',
    startingTechniques: ['basicGenjutsu', 'painIllusion'],
    dojutsu: 'sharingan',
  },
  {
    id: 'hyuuga',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 16, ninjutsu: 6, genjutsu: 8, speed: 11, hp: 100, chakra: 27 },
    resistance: { physical: 11, mental: 9 },
    affinity: { kind: 'rolled' },
    passive: 'preciseFist',
    startingTechniques: ['chakraBlockStrike'],
    dojutsu: 'byakugan',
  },
  {
    id: 'uzumaki',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 10, ninjutsu: 11, genjutsu: 6, speed: 9, hp: 105, chakra: 35 },
    resistance: { physical: 12, mental: 8 },
    affinity: { kind: 'rolled' },
    passive: 'vitality',
    active: 'seal',
  },
];

export const lineagesById: Record<string, LineageDef> = Object.fromEntries(lineages.map((l) => [l.id, l]));
