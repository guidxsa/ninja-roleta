import type { LineageDef } from '../core/types';

// Nomes de trabalho. Textos visíveis ficam em strings/ptBR.ts.
export const lineages: LineageDef[] = [
  {
    id: 'uchiha',
    weight: 30,
    modifiers: { ninjutsu: 0.2, genjutsu: 0.2, speed: 0.1 },
    affinity: { kind: 'fixed', element: 'fire' },
    passive: { kind: 'movementReading', chance: 0.15, damageFactor: 0.5 },
  },
  {
    id: 'hyuuga',
    weight: 30,
    modifiers: { taijutsu: 0.3, speed: 0.1, chakra: 0.1 },
    affinity: { kind: 'rolled' },
    passive: { kind: 'preciseFist', defensePierce: 0.3 },
  },
  {
    id: 'taijutsuProdigy',
    weight: 25,
    modifiers: { taijutsu: 0.5, speed: 0.3, hp: 0.1, chakra: -0.3 },
    zeroedStats: ['ninjutsu', 'genjutsu'],
    affinity: { kind: 'none' },
    passive: { kind: 'gates', hpCostPct: 0.25, taijutsuMult: 1.5, turns: 3 },
    forbiddenAttackTypes: ['ninjutsu', 'genjutsu'],
  },
  {
    id: 'uzumaki',
    weight: 15,
    modifiers: { chakra: 0.5, hp: 0.2 },
    affinity: { kind: 'rolled' },
    passive: { kind: 'vitality', chakraPerTurn: 1, hpPctPerTurn: 0.03 },
  },
];
