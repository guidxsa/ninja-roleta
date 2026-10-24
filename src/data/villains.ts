import type { CloakDef, VillainDef } from '../core/types';
import { balance } from './balance';

// Fichas dos vilões (docs/viloes.md). Nomes de trabalho e valores provisórios.
// Vilões também gastam chakra: taijutsu é grátis; ninjutsu e genjutsu custam. Sem chakra para
// nenhuma técnica, o vilão perde a vez concentrando chakra.
// `xp`: curva planejada em docs/progressao.md.
// `passive`/`hardcorePassive`: passiva única; a versão hardcore substitui a normal nesse modo.
// `behavior.charged`: golpe carregado (anuncia numa vez, solta ×2 sem crítico na seguinte).

// Marca da maldição: o manto do jinchuuriki pela metade.
const CURSE_MARK_CLOAK: CloakDef = { hpThresholdPct: 0.5, statMult: 1.25, regenPct: 0.025, chakraPctPerRound: 0.05, turns: 5 };
const curseMark = { kind: 'cloak', variant: 'curseMark', cloak: CURSE_MARK_CLOAK, genjutsuImmune: false } as const;

export const villains: VillainDef[] = [
  {
    id: 'mizuki',
    element: 'wind',
    hp: 70,
    chakra: 10,
    speed: 9,
    defense: { taijutsu: 7, ninjutsu: 6, genjutsu: 6 },
    critBonus: 0,
    xp: 100,
    techniques: [
      { id: 'kunaiStrike', type: 'taijutsu', baseDamage: 13, chakraCost: 0, weight: 3, blade: 'cutting' },
      { id: 'giantShuriken', type: 'taijutsu', baseDamage: 16, chakraCost: 0, weight: 1, blade: 'cutting' },
    ],
    passive: { kind: 'trickster' },
    hardcorePassive: { kind: 'trickster', counterCrit: true },
  },
  {
    id: 'haku',
    element: 'water',
    hp: 80,
    chakra: 18,
    speed: 14,
    defense: { taijutsu: 7, ninjutsu: 10, genjutsu: 9 },
    critBonus: 0.05,
    xp: 125,
    techniques: [
      { id: 'senbon', type: 'taijutsu', baseDamage: 12, chakraCost: 0, weight: 3 },
      { id: 'iceMirrors', type: 'ninjutsu', baseDamage: 15, chakraCost: 5, weight: 2 },
    ],
    // Espelhos: duas ações por turno, cada uma com 60% do dano (100% no hardcore).
    passive: { kind: 'mirrors', actions: 2, damageMult: 0.6 },
    hardcorePassive: { kind: 'mirrors', actions: 2, damageMult: 1 },
  },
  {
    id: 'zabuza',
    element: 'water',
    hp: 110,
    chakra: 20,
    speed: 11,
    defense: { taijutsu: 10, ninjutsu: 9, genjutsu: 7 },
    critBonus: 0.02,
    xp: 150,
    techniques: [
      { id: 'cleaverSwing', type: 'taijutsu', baseDamage: 16, chakraCost: 0, weight: 3, blade: 'sword' },
      { id: 'waterDragonBullet', type: 'ninjutsu', baseDamage: 18, chakraCost: 5, weight: 2 },
    ],
    behavior: { charged: 'cleaverSwing' },
    passive: { kind: 'mist', turns: 4, evasionMult: 1.5 },
    hardcorePassive: { kind: 'mist', turns: 4, evasionMult: 1.5, lastStand: { healPct: 0.5, damageMult: 1.1 } },
  },
  // Exame chunin: genins genéricos (nomes próprios, não do universo original).
  {
    id: 'examSand',
    element: 'wind',
    hp: 90,
    chakra: 15,
    speed: 11,
    defense: { taijutsu: 9, ninjutsu: 10, genjutsu: 8 },
    critBonus: 0.02,
    xp: 60,
    techniques: [
      { id: 'fanGust', type: 'ninjutsu', baseDamage: 16, chakraCost: 4, weight: 2 },
      { id: 'kunaiStrike', type: 'taijutsu', baseDamage: 13, chakraCost: 0, weight: 2, blade: 'cutting' },
    ],
  },
  {
    id: 'examSound',
    element: 'lightning',
    hp: 85,
    chakra: 12,
    speed: 12,
    defense: { taijutsu: 9, ninjutsu: 9, genjutsu: 11 },
    critBonus: 0.03,
    xp: 60,
    techniques: [
      { id: 'soundWave', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, mentalTurns: 1 },
      { id: 'kunaiStrike', type: 'taijutsu', baseDamage: 14, chakraCost: 0, weight: 3, blade: 'cutting' },
    ],
  },
  {
    id: 'examLeaf',
    element: 'fire',
    hp: 100,
    chakra: 12,
    speed: 12,
    defense: { taijutsu: 12, ninjutsu: 9, genjutsu: 9 },
    critBonus: 0.03,
    xp: 60,
    techniques: [
      { id: 'palmStrike', type: 'taijutsu', baseDamage: 17, chakraCost: 0, weight: 3 },
      { id: 'fireballVillain', type: 'ninjutsu', baseDamage: 15, chakraCost: 4, weight: 1 },
    ],
  },
  {
    id: 'gaara',
    element: 'earth',
    // Era 160 de HP e defesa 14/14: aliviado por ser o gargalo da campanha.
    hp: 140,
    chakra: 36,
    speed: 9,
    defense: { taijutsu: 12, ninjutsu: 12, genjutsu: 10 },
    critBonus: 0.02,
    xp: 200,
    techniques: [
      { id: 'sandCoffin', type: 'ninjutsu', baseDamage: 20, chakraCost: 4, weight: 3 },
      { id: 'sandTsunami', type: 'ninjutsu', baseDamage: 26, chakraCost: 8, weight: 1 },
      // Grátis: com o manto drenando o chakra, ele bate em vez de concentrar.
      { id: 'sandFist', type: 'taijutsu', baseDamage: 14, chakraCost: 0, weight: 2 },
    ],
    behavior: { charged: 'sandTsunami' },
    passive: { kind: 'cloak', variant: 'beast', cloak: balance.jinchuuriki.cloak, genjutsuImmune: true },
    // Hardcore: defesa absoluta, defesa de taijutsu dobrada a luta toda.
    hardcorePassive: {
      kind: 'cloak',
      variant: 'beast',
      cloak: balance.jinchuuriki.cloak,
      genjutsuImmune: true,
      defenseMult: { taijutsu: 2 },
    },
  },
  {
    id: 'jirobo',
    element: 'earth',
    hp: 70,
    chakra: 15,
    speed: 8,
    defense: { taijutsu: 13, ninjutsu: 11, genjutsu: 8 },
    critBonus: 0,
    xp: 60,
    techniques: [
      { id: 'earthPrison', type: 'ninjutsu', baseDamage: 17, chakraCost: 5, weight: 2 },
      { id: 'heavyPunch', type: 'taijutsu', baseDamage: 18, chakraCost: 0, weight: 2 },
    ],
    passive: curseMark,
    hardcorePassive: { ...curseMark, fromStart: true },
  },
  {
    id: 'kidomaru',
    element: 'lightning',
    hp: 65,
    chakra: 16,
    speed: 12,
    defense: { taijutsu: 10, ninjutsu: 11, genjutsu: 10 },
    critBonus: 0.05,
    xp: 60,
    techniques: [
      { id: 'goldenArrow', type: 'ninjutsu', baseDamage: 18, chakraCost: 5, weight: 2 },
      { id: 'spiderWeb', type: 'taijutsu', baseDamage: 14, chakraCost: 0, weight: 2 },
    ],
    passive: curseMark,
    hardcorePassive: { ...curseMark, fromStart: true },
  },
  {
    id: 'tayuya',
    element: 'wind',
    hp: 60,
    chakra: 16,
    speed: 11,
    defense: { taijutsu: 8, ninjutsu: 10, genjutsu: 14 },
    critBonus: 0.02,
    xp: 60,
    techniques: [
      { id: 'demonFlute', type: 'genjutsu', baseDamage: 0, chakraCost: 5, weight: 1, mentalTurns: 1 },
      { id: 'summonedOgre', type: 'taijutsu', baseDamage: 16, chakraCost: 0, weight: 2 },
    ],
    passive: curseMark,
    hardcorePassive: { ...curseMark, fromStart: true },
  },
  {
    id: 'sakon',
    element: 'wind',
    hp: 75,
    chakra: 14,
    speed: 12,
    defense: { taijutsu: 12, ninjutsu: 11, genjutsu: 10 },
    critBonus: 0.03,
    xp: 60,
    techniques: [
      { id: 'twinStrike', type: 'taijutsu', baseDamage: 17, chakraCost: 0, weight: 3 },
      { id: 'parasiteBody', type: 'ninjutsu', baseDamage: 15, chakraCost: 4, weight: 1 },
    ],
    behavior: { charged: 'twinStrike' },
    passive: curseMark,
    hardcorePassive: { ...curseMark, fromStart: true },
  },
  {
    id: 'kabuto',
    element: 'earth',
    hp: 150,
    chakra: 25,
    speed: 13,
    defense: { taijutsu: 13, ninjutsu: 13, genjutsu: 13 },
    critBonus: 0.05,
    xp: 250,
    techniques: [
      { id: 'chakraScalpel', type: 'taijutsu', baseDamage: 20, chakraCost: 0, weight: 3, blade: 'cutting' },
      { id: 'deadSoul', type: 'ninjutsu', baseDamage: 18, chakraCost: 5, weight: 1 },
      // Palma Mística: só abaixo de 50% de HP; cada cura gasta a vez e 7 de chakra.
      { id: 'mysticPalm', type: 'ninjutsu', baseDamage: 0, chakraCost: 7, weight: 2, healPct: 0.15, useBelowHpPct: 0.5 },
    ],
    // Bisturi: +10% de crítico e os críticos fazem sangrar. Hardcore: todos os golpes sangram e furam 30% da resistência.
    passive: { kind: 'scalpel', critBonus: 0.1 },
    hardcorePassive: { kind: 'scalpel', critBonus: 0.1, bleedOnHit: true, resistancePierce: 0.3 },
  },
  {
    id: 'orochimaru',
    element: 'wind',
    hp: 220,
    chakra: 40,
    speed: 14,
    defense: { taijutsu: 16, ninjutsu: 16, genjutsu: 16 },
    critBonus: 0.05,
    xp: 300,
    techniques: [
      { id: 'hiddenSnakes', type: 'ninjutsu', baseDamage: 24, chakraCost: 5, weight: 3 },
      { id: 'grassSword', type: 'taijutsu', baseDamage: 22, chakraCost: 0, weight: 2, blade: 'sword' },
      { id: 'killingIntent', type: 'genjutsu', baseDamage: 0, chakraCost: 6, weight: 1, mentalTurns: 1 },
    ],
    behavior: { charged: 'hiddenSnakes' },
    // Insano: acertos envenenam (bônus 1). Abaixo de 50% de HP, precisa ser derrotado em 5 rodadas,
    // senão revive com 50% do HP máximo (sempre que cair abaixo de 50%).
    passive: { kind: 'insane', snakeBonus: 1, hpThresholdPct: 0.5, killWindow: 5, revivePct: 0.5 },
    // Hardcore: veneno com bônus 3, prazo de 4 rodadas, revive com o HP cheio.
    hardcorePassive: { kind: 'insane', snakeBonus: 3, hpThresholdPct: 0.5, killWindow: 4, revivePct: 1 },
  },
];

export const villainsById: Record<string, VillainDef> = Object.fromEntries(villains.map((v) => [v.id, v]));
