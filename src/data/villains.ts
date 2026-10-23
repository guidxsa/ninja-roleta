import type { VillainDef } from '../core/types';
import { balance } from './balance';

// Nomes de trabalho e valores provisórios.
// Vilões também gastam chakra: taijutsu é grátis; ninjutsu e genjutsu custam. Sem chakra para
// nenhuma técnica, o vilão perde a vez concentrando chakra.
// `xp`: experiência dada ao jogador, pela dificuldade do vilão. Nos blocos (Haku e Zabuza,
// Quarteto do Som) cada luta dá menos, para o jogador não subir de nível a cada mini vilão.
// O Haku (1º do bloco) dá XP para subir de nível antes do Zabuza: sem isso, não haveria restauração entre os dois.
// `passive`/`hardcorePassive`: passiva única; a versão hardcore substitui a normal nesse modo.
// `blade`: golpe com lâmina (o crítico de espada faz sangrar; quem sangra toma mais dano de lâminas).

const CURSE_MARK_CLOAK = { hpThresholdPct: 0.5, statMult: 1.25, regenPct: 0.025, recoilPct: 0.25, turns: 5 };
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
    // Enganador: sobrevive ao primeiro golpe fatal, mas se acovarda e perde a vez.
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
    xp: 140,
    techniques: [
      { id: 'senbon', type: 'taijutsu', baseDamage: 12, chakraCost: 0, weight: 3 },
      { id: 'iceMirrors', type: 'ninjutsu', baseDamage: 15, chakraCost: 5, weight: 2 },
    ],
    // Espelhos: duas ações por turno, cada uma com 80% do dano (100% no hardcore).
    passive: { kind: 'mirrors', actions: 2, damageMult: 0.8 },
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
    xp: 120,
    techniques: [
      { id: 'cleaverSwing', type: 'taijutsu', baseDamage: 16, chakraCost: 0, weight: 3, blade: 'sword' },
      { id: 'waterDragonBullet', type: 'ninjutsu', baseDamage: 18, chakraCost: 5, weight: 2 },
    ],
    // Demônio da névoa oculta: começa a luta na névoa (4 rodadas), com evasão 50% maior.
    passive: { kind: 'mist', turns: 4, evasionMult: 1.5 },
    // Hardcore: ao tomar o golpe fatal, Haku se sacrifica e Zabuza volta com 50% do HP, 10% mais forte
    // e fazendo sangrar em todos os golpes.
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
    xp: 110,
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
    xp: 110,
    techniques: [
      { id: 'soundWave', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, debilitateTurns: 1 },
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
    xp: 120,
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
    xp: 250,
    techniques: [
      { id: 'sandCoffin', type: 'ninjutsu', baseDamage: 20, chakraCost: 4, weight: 3 },
      { id: 'sandTsunami', type: 'ninjutsu', baseDamage: 26, chakraCost: 8, weight: 1 },
    ],
    // Jinchuuriki: a mesma passiva do jogador (manto de chakra abaixo de 50% de HP, imune a genjutsu).
    passive: { kind: 'cloak', variant: 'beast', cloak: balance.jinchuuriki.cloak, genjutsuImmune: true },
    // Hardcore: defesa absoluta, defesas dobradas a luta toda.
    hardcorePassive: {
      kind: 'cloak',
      variant: 'beast',
      cloak: balance.jinchuuriki.cloak,
      genjutsuImmune: true,
      defenseMult: 2,
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
    xp: 90,
    techniques: [
      { id: 'earthPrison', type: 'ninjutsu', baseDamage: 17, chakraCost: 5, weight: 2 },
      { id: 'heavyPunch', type: 'taijutsu', baseDamage: 18, chakraCost: 0, weight: 2 },
    ],
    // Marca da maldição: como o manto do jinchuuriki, com os efeitos pela metade (desde o início no hardcore).
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
    xp: 90,
    techniques: [
      { id: 'goldenArrow', type: 'ninjutsu', baseDamage: 18, chakraCost: 5, weight: 2 },
      { id: 'spiderWeb', type: 'taijutsu', baseDamage: 14, chakraCost: 0, weight: 2 },
    ],
    // Marca da maldição: como o manto do jinchuuriki, com os efeitos pela metade (desde o início no hardcore).
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
    xp: 90,
    techniques: [
      { id: 'demonFlute', type: 'genjutsu', baseDamage: 0, chakraCost: 5, weight: 1, debilitateTurns: 1 },
      { id: 'summonedOgre', type: 'taijutsu', baseDamage: 16, chakraCost: 0, weight: 2 },
    ],
    // Marca da maldição: como o manto do jinchuuriki, com os efeitos pela metade (desde o início no hardcore).
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
    xp: 110,
    techniques: [
      { id: 'twinStrike', type: 'taijutsu', baseDamage: 17, chakraCost: 0, weight: 3 },
      { id: 'parasiteBody', type: 'ninjutsu', baseDamage: 15, chakraCost: 4, weight: 1 },
    ],
    // Marca da maldição: como o manto do jinchuuriki, com os efeitos pela metade (desde o início no hardcore).
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
    xp: 300,
    techniques: [
      { id: 'chakraScalpel', type: 'taijutsu', baseDamage: 20, chakraCost: 0, weight: 3, blade: 'cutting' },
      { id: 'deadSoul', type: 'ninjutsu', baseDamage: 18, chakraCost: 5, weight: 1 },
    ],
    // Bisturi: cura 6% do HP máximo por rodada. Hardcore: golpes fazem sangrar e furam 30% da resistência.
    passive: { kind: 'scalpel', regenPct: 0.06 },
    hardcorePassive: { kind: 'scalpel', regenPct: 0.06, bleedOnHit: true, resistancePierce: 0.3 },
  },
  {
    id: 'orochimaru',
    element: 'wind',
    hp: 220,
    chakra: 40,
    speed: 14,
    defense: { taijutsu: 16, ninjutsu: 16, genjutsu: 16 },
    critBonus: 0.05,
    xp: 500,
    techniques: [
      { id: 'hiddenSnakes', type: 'ninjutsu', baseDamage: 24, chakraCost: 5, weight: 3 },
      { id: 'grassSword', type: 'taijutsu', baseDamage: 22, chakraCost: 0, weight: 2, blade: 'sword' },
      { id: 'killingIntent', type: 'genjutsu', baseDamage: 0, chakraCost: 6, weight: 1, debilitateTurns: 1 },
    ],
    // Insano: cobra (acertos envenenam). Abaixo de 50% de HP, precisa ser derrotado em 3 rodadas, senão
    // revive com o maior entre 50% do HP máximo e o dobro do HP atual (sempre que cair abaixo de 50%).
    passive: {
      kind: 'insane',
      snakeBonus: balance.summon.snake.poisonBonus,
      hpThresholdPct: 0.5,
      killWindow: 3,
      reviveMinPct: 0.5,
      reviveCurrentMult: 2,
    },
    // Hardcore: cobra nível 2, 2 rodadas de tolerância e revive com o HP cheio.
    hardcorePassive: {
      kind: 'insane',
      snakeBonus: balance.summon.snake.poisonBonus + balance.summon.snake.poisonBonusPerLevel,
      hpThresholdPct: 0.5,
      killWindow: 2,
      reviveMinPct: 1,
      reviveCurrentMult: 2,
      reviveFull: true,
    },
  },
];

export const villainsById: Record<string, VillainDef> = Object.fromEntries(
  villains.map((v) => [v.id, v]),
);
