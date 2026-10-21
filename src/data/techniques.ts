import type { AttackType, TechniqueDef } from '../core/types';
import { balance } from './balance';

/** Ações básicas: usadas quando o jogador não tem técnica do tipo. */
export const basicTechniques: Record<AttackType, TechniqueDef> = {
  taijutsu: {
    id: 'basicTaijutsu',
    type: 'taijutsu',
    element: null,
    ...balance.basicActions.taijutsu,
  },
  ninjutsu: {
    id: 'basicNinjutsu',
    type: 'ninjutsu',
    element: 'affinity',
    ...balance.basicActions.ninjutsu,
  },
  genjutsu: {
    id: 'basicGenjutsu',
    type: 'genjutsu',
    element: null,
    ...balance.basicActions.genjutsu,
  },
};

// Técnicas aprendíveis (via recompensa). Nomes de trabalho. Taijutsu não gasta chakra.
export const techniques: TechniqueDef[] = [
  { id: 'leafWhirlwind', type: 'taijutsu', element: null, baseDamage: 13, chakraCost: 0 },
  { id: 'fireball', type: 'ninjutsu', element: 'fire', baseDamage: 16, chakraCost: 4 },
  { id: 'windBlade', type: 'ninjutsu', element: 'wind', baseDamage: 15, chakraCost: 3 },
  { id: 'lightningSpear', type: 'ninjutsu', element: 'lightning', baseDamage: 17, chakraCost: 5 },
  { id: 'earthWall', type: 'ninjutsu', element: 'earth', baseDamage: 14, chakraCost: 3 },
  { id: 'waterDragon', type: 'ninjutsu', element: 'water', baseDamage: 16, chakraCost: 4 },
  { id: 'crowIllusion', type: 'genjutsu', element: null, baseDamage: 6, chakraCost: 4, debilitateTurns: 1 },
  // Suporte: ocupa um espaço próprio (não substitui o ninjutsu de ataque). Cura sem rolar acerto.
  // Usa chakra de ninjutsu, então o prodígio do taijutsu não aprende.
  {
    id: 'medicalNinjutsu',
    type: 'ninjutsu',
    slot: 'medical',
    element: null,
    baseDamage: 0,
    chakraCost: 4,
    healPct: 0.2,
  },
];

export const techniquesById: Record<string, TechniqueDef> = Object.fromEntries(
  techniques.map((t) => [t.id, t]),
);
