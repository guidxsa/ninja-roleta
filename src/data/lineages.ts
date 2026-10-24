import { COMMON_LINEAGE } from '../core/origin';
import type { LineageDef } from '../core/types';

// Origens (docs/origens.md). Textos visíveis ficam em strings/ptBR.ts.
// Uma roleta só: comum 30%, clãs 40% (8 cada), raras 30%.
// Status iniciais absolutos com o mesmo orçamento de 90 pontos: tai/nin/gen e as resistências valem 1, speed 1,5,
// 10 de HP valem 1 e 2 de chakra valem 1. A diferença de poder vem das habilidades.
// Kit inicial de todos: Punho de Chakra e o ninjutsu básico do elemento (se a origem usa ninjutsu).

export const lineages: LineageDef[] = [
  {
    id: COMMON_LINEAGE,
    tier: 'common',
    weight: 30,
    stats: { taijutsu: 10, ninjutsu: 10, genjutsu: 10, speed: 10, hp: 100, chakra: 30 },
    resistance: { physical: 10, mental: 10 },
    affinity: { kind: 'rolled' },
    passive: 'determination',
  },
  {
    id: 'nara',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 7, ninjutsu: 13, genjutsu: 11, speed: 9, hp: 95, chakra: 32 },
    resistance: { physical: 8, mental: 12 },
    affinity: { kind: 'rolled' },
    passive: 'strategist',
    startingTechniques: ['shadowImitation'],
  },
  {
    id: 'akimichi',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 15, ninjutsu: 8, genjutsu: 5, speed: 6, hp: 160, chakra: 34 },
    resistance: { physical: 14, mental: 6 },
    affinity: { kind: 'rolled' },
    passive: 'heavyBody',
    active: 'expansion',
  },
  {
    id: 'yamanaka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 7, ninjutsu: 9, genjutsu: 15, speed: 10, hp: 90, chakra: 30 },
    resistance: { physical: 6, mental: 14 },
    affinity: { kind: 'rolled' },
    passive: 'mindReading',
    startingTechniques: ['mindTransfer'],
  },
  {
    id: 'aburame',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 8, ninjutsu: 12, genjutsu: 10, speed: 8, hp: 110, chakra: 34 },
    resistance: { physical: 9, mental: 11 },
    affinity: { kind: 'rolled' },
    passive: 'hive',
    startingTechniques: ['insectSwarm'],
  },
  {
    id: 'inuzuka',
    tier: 'clan',
    weight: 8,
    stats: { taijutsu: 14, ninjutsu: 8, genjutsu: 6, speed: 13, hp: 105, chakra: 24 },
    resistance: { physical: 12, mental: 8 },
    affinity: { kind: 'rolled' },
    passive: 'duo',
    startingTechniques: ['fangOverFang'],
  },
  {
    // Portões evoluem com o taijutsu (estágios em `balance.gates`).
    id: 'taijutsuProdigy',
    tier: 'rare',
    weight: 9,
    stats: { taijutsu: 22, ninjutsu: 0, genjutsu: 0, speed: 14, hp: 130, chakra: 28 },
    resistance: { physical: 14, mental: 6 },
    affinity: { kind: 'none' },
    passive: 'ironBody',
    active: 'gates',
    forbiddenAttackTypes: ['ninjutsu', 'genjutsu'],
  },
  {
    id: 'uchiha',
    tier: 'rare',
    weight: 7,
    stats: { taijutsu: 7, ninjutsu: 12, genjutsu: 14, speed: 10, hp: 90, chakra: 26 },
    resistance: { physical: 8, mental: 12 },
    affinity: { kind: 'fixed', element: 'fire' },
    passive: 'genjutsuResistance',
    startingTechniques: ['basicGenjutsu'],
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
    stats: { taijutsu: 10, ninjutsu: 11, genjutsu: 6, speed: 9, hp: 120, chakra: 35 },
    resistance: { physical: 12, mental: 8 },
    affinity: { kind: 'rolled' },
    passive: 'vitality',
    active: 'shadowClones',
  },
];

export const lineagesById: Record<string, LineageDef> = Object.fromEntries(lineages.map((l) => [l.id, l]));
