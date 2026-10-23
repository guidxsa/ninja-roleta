import type { LineageDef } from '../core/types';

// Nomes de trabalho. Textos visíveis ficam em strings/ptBR.ts.
// Status iniciais redistribuídos por linhagem (modificadores sobre `balance.baseStats`).
// `weight`: peso na roleta de linhagem, ao lado da fatia comum (`balance.origin.commonWeight`).
export const lineages: LineageDef[] = [
  {
    // Bom chakra, foco em genjutsu, ninjutsu bom; taijutsu é o ponto fraco. Único com genjutsu inicial.
    id: 'uchiha',
    weight: 10,
    modifiers: { taijutsu: -0.1, ninjutsu: 0.3, genjutsu: 0.5, chakra: 0.8, speed: 0.1 },
    affinity: { kind: 'fixed', element: 'fire' },
    passive: { kind: 'genjutsuResistance', bonus: 6 },
    startingTypes: ['taijutsu', 'ninjutsu', 'genjutsu'],
    dojutsu: 'sharingan',
  },
  {
    // Foco em taijutsu, pouco ninjutsu.
    id: 'hyuuga',
    weight: 10,
    modifiers: { taijutsu: 0.6, ninjutsu: -0.3, speed: 0.1, chakra: 0.1 },
    affinity: { kind: 'rolled' },
    passive: { kind: 'preciseFist', defensePierce: 0.3 },
    startingTechniques: ['chakraBlockStrike'],
    dojutsu: 'byakugan',
  },
  {
    // Portões evoluem com o taijutsu (estágios em `balance.gates`).
    id: 'taijutsuProdigy',
    weight: 20,
    modifiers: { taijutsu: 0.8, speed: 0.3, hp: 0.1, chakra: -0.3 },
    zeroedStats: ['ninjutsu', 'genjutsu'],
    affinity: { kind: 'none' },
    passive: { kind: 'gates' },
    forbiddenAttackTypes: ['ninjutsu', 'genjutsu'],
    startingTypes: ['taijutsu'],
  },
  {
    // Muita vitalidade e chakra.
    id: 'uzumaki',
    weight: 10,
    modifiers: { hp: 0.5, chakra: 1.0, ninjutsu: 0.1 },
    affinity: { kind: 'rolled' },
    passive: { kind: 'vitality', chakraPerTurn: 1, hpPctPerTurn: 0.03 },
  },
];
