import type { VillainDef } from '../core/types';

// Nomes de trabalho e valores provisórios.
export const villains: VillainDef[] = [
  {
    id: 'mizuki',
    element: 'wind',
    hp: 70,
    speed: 9,
    defense: { taijutsu: 7, ninjutsu: 6, genjutsu: 6 },
    critBonus: 0,
    techniques: [
      { id: 'kunaiStrike', type: 'taijutsu', baseDamage: 13, weight: 3 },
      { id: 'giantShuriken', type: 'taijutsu', baseDamage: 16, weight: 1 },
    ],
  },
  {
    id: 'zabuza',
    element: 'water',
    hp: 110,
    speed: 11,
    defense: { taijutsu: 10, ninjutsu: 9, genjutsu: 7 },
    critBonus: 0.02,
    techniques: [
      { id: 'cleaverSwing', type: 'taijutsu', baseDamage: 16, weight: 3 },
      { id: 'waterDragonBullet', type: 'ninjutsu', baseDamage: 18, weight: 2 },
    ],
  },
  {
    id: 'haku',
    element: 'water',
    hp: 80,
    speed: 14,
    defense: { taijutsu: 7, ninjutsu: 10, genjutsu: 9 },
    critBonus: 0.05,
    techniques: [
      { id: 'senbon', type: 'taijutsu', baseDamage: 12, weight: 3 },
      { id: 'iceMirrors', type: 'ninjutsu', baseDamage: 15, weight: 2 },
    ],
  },
  {
    id: 'gaara',
    element: 'earth',
    hp: 160,
    speed: 9,
    defense: { taijutsu: 14, ninjutsu: 14, genjutsu: 10 },
    critBonus: 0.02,
    techniques: [
      { id: 'sandCoffin', type: 'ninjutsu', baseDamage: 20, weight: 3 },
      { id: 'sandTsunami', type: 'ninjutsu', baseDamage: 26, weight: 1 },
    ],
  },
  {
    id: 'jirobo',
    element: 'earth',
    hp: 70,
    speed: 8,
    defense: { taijutsu: 13, ninjutsu: 11, genjutsu: 8 },
    critBonus: 0,
    techniques: [
      { id: 'earthPrison', type: 'ninjutsu', baseDamage: 17, weight: 2 },
      { id: 'heavyPunch', type: 'taijutsu', baseDamage: 18, weight: 2 },
    ],
  },
  {
    id: 'kidomaru',
    element: 'lightning',
    hp: 65,
    speed: 12,
    defense: { taijutsu: 10, ninjutsu: 11, genjutsu: 10 },
    critBonus: 0.05,
    techniques: [
      { id: 'goldenArrow', type: 'ninjutsu', baseDamage: 18, weight: 2 },
      { id: 'spiderWeb', type: 'taijutsu', baseDamage: 14, weight: 2 },
    ],
  },
  {
    id: 'tayuya',
    element: 'wind',
    hp: 60,
    speed: 11,
    defense: { taijutsu: 8, ninjutsu: 10, genjutsu: 14 },
    critBonus: 0.02,
    techniques: [
      { id: 'demonFlute', type: 'genjutsu', baseDamage: 10, weight: 1, debilitateTurns: 1 },
      { id: 'summonedOgre', type: 'taijutsu', baseDamage: 16, weight: 2 },
    ],
  },
  {
    id: 'sakon',
    element: 'wind',
    hp: 75,
    speed: 12,
    defense: { taijutsu: 12, ninjutsu: 11, genjutsu: 10 },
    critBonus: 0.03,
    techniques: [
      { id: 'twinStrike', type: 'taijutsu', baseDamage: 17, weight: 3 },
      { id: 'parasiteBody', type: 'ninjutsu', baseDamage: 15, weight: 1 },
    ],
  },
  {
    id: 'kabuto',
    element: 'earth',
    hp: 150,
    speed: 13,
    defense: { taijutsu: 13, ninjutsu: 13, genjutsu: 13 },
    critBonus: 0.05,
    techniques: [
      { id: 'chakraScalpel', type: 'taijutsu', baseDamage: 20, weight: 3 },
      { id: 'deadSoul', type: 'ninjutsu', baseDamage: 18, weight: 1 },
    ],
  },
  {
    id: 'orochimaru',
    element: 'wind',
    hp: 220,
    speed: 14,
    defense: { taijutsu: 16, ninjutsu: 16, genjutsu: 16 },
    critBonus: 0.05,
    techniques: [
      { id: 'hiddenSnakes', type: 'ninjutsu', baseDamage: 24, weight: 3 },
      { id: 'grassSword', type: 'taijutsu', baseDamage: 22, weight: 2 },
      { id: 'killingIntent', type: 'genjutsu', baseDamage: 12, weight: 1, debilitateTurns: 1 },
    ],
  },
];

export const villainsById: Record<string, VillainDef> = Object.fromEntries(
  villains.map((v) => [v.id, v]),
);
