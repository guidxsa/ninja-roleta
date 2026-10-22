import type { AttackType, TechniqueDef } from '../core/types';
import { balance } from './balance';

/**
 * Ações básicas de cada tipo. O jogador só tem as dos tipos iniciais da origem
 * (`startingTypes`): comuns têm taijutsu e ninjutsu do próprio elemento; genjutsu, só o Uchiha.
 */
export const basicTechniques: Record<AttackType, TechniqueDef[]> = {
  taijutsu: [
    { id: 'basicTaijutsu', type: 'taijutsu', element: null, ...balance.basicActions.taijutsu },
    // Taijutsu fortalecido: gasta chakra para bater mais forte.
    { id: 'empoweredTaijutsu', type: 'taijutsu', element: null, ...balance.basicActions.empoweredTaijutsu },
  ],
  ninjutsu: [{ id: 'basicNinjutsu', type: 'ninjutsu', element: 'affinity', ...balance.basicActions.ninjutsu }],
  genjutsu: [{ id: 'basicGenjutsu', type: 'genjutsu', element: null, ...balance.basicActions.genjutsu }],
};

// Técnicas aprendíveis (via recompensa). Nomes de trabalho. Taijutsu não gasta chakra.
export const techniques: TechniqueDef[] = [
  { id: 'leafWhirlwind', type: 'taijutsu', element: null, baseDamage: 13, chakraCost: 0 },
  { id: 'fireball', type: 'ninjutsu', element: 'fire', baseDamage: 16, chakraCost: 4 },
  { id: 'windBlade', type: 'ninjutsu', element: 'wind', baseDamage: 15, chakraCost: 3 },
  { id: 'lightningSpear', type: 'ninjutsu', element: 'lightning', baseDamage: 17, chakraCost: 5 },
  { id: 'earthWall', type: 'ninjutsu', element: 'earth', baseDamage: 14, chakraCost: 3 },
  { id: 'waterDragon', type: 'ninjutsu', element: 'water', baseDamage: 16, chakraCost: 4 },
  // Genjutsu não causa dano: aprisiona o alvo. `genjutsuPower` soma ao genjutsu do usuário no cálculo dos turnos.
  // Para quem não é Uchiha, aprender esta técnica libera a categoria de genjutsu.
  { id: 'crowIllusion', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 4, debilitateTurns: 1, genjutsuPower: 6 },
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

/**
 * Técnicas de nível: aprendidas sozinhas ao atingir `minLevel`, se a origem permitir o tipo e o
 * jogador dominar o elemento. Mais fortes, porém mais caras (inclusive as de taijutsu).
 * Genjutsu de nível só para quem já usa genjutsu (Uchiha, ou quem aprendeu um).
 */
export const levelTechniques: TechniqueDef[] = [
  { id: 'whirlwindCombo', type: 'taijutsu', element: null, baseDamage: 20, chakraCost: 5, minLevel: 4 },
  { id: 'hiddenLotus', type: 'taijutsu', element: null, baseDamage: 30, chakraCost: 9, minLevel: 7 },

  { id: 'phoenixFlower', type: 'ninjutsu', element: 'fire', baseDamage: 24, chakraCost: 6, minLevel: 4 },
  { id: 'galeBlast', type: 'ninjutsu', element: 'wind', baseDamage: 23, chakraCost: 5, minLevel: 4 },
  { id: 'lightningCurrent', type: 'ninjutsu', element: 'lightning', baseDamage: 25, chakraCost: 7, minLevel: 4 },
  { id: 'earthSpear', type: 'ninjutsu', element: 'earth', baseDamage: 22, chakraCost: 5, minLevel: 4 },
  { id: 'waterShark', type: 'ninjutsu', element: 'water', baseDamage: 24, chakraCost: 6, minLevel: 4 },

  { id: 'greatBlaze', type: 'ninjutsu', element: 'fire', baseDamage: 34, chakraCost: 10, minLevel: 7 },
  { id: 'vacuumSphere', type: 'ninjutsu', element: 'wind', baseDamage: 33, chakraCost: 9, minLevel: 7 },
  { id: 'lightningBlade', type: 'ninjutsu', element: 'lightning', baseDamage: 36, chakraCost: 11, minLevel: 7 },
  { id: 'earthDragon', type: 'ninjutsu', element: 'earth', baseDamage: 32, chakraCost: 9, minLevel: 7 },
  { id: 'greatWaterfall', type: 'ninjutsu', element: 'water', baseDamage: 34, chakraCost: 10, minLevel: 7 },

  { id: 'fearIllusion', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 5, debilitateTurns: 1, genjutsuPower: 10, minLevel: 4 },
  { id: 'mirrorWorld', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 8, debilitateTurns: 2, genjutsuPower: 14, minLevel: 7 },
];

/** Técnicas de linhagem (`startingTechniques`): não saem em recompensa. */
export const lineageTechniques: TechniqueDef[] = [
  // Golpe inibidor (Hyuuga): só com o Byakugan ativo. Taijutsu que drena o chakra do vilão.
  {
    id: 'chakraBlockStrike',
    type: 'taijutsu',
    element: null,
    baseDamage: 6,
    chakraCost: 0,
    requiresDojutsu: 'byakugan',
    chakraDrain: 6,
  },
];

export const techniquesById: Record<string, TechniqueDef> = Object.fromEntries(
  [...Object.values(basicTechniques).flat(), ...techniques, ...levelTechniques, ...lineageTechniques].map((t) => [
    t.id,
    t,
  ]),
);
