import type { CloakDef, VillainDef } from '../core/types';
import { balance } from './balance';

// Fichas dos vilões (docs/viloes.md). Nomes de trabalho e valores provisórios.
// Mesma ficha do jogador: ataques (tai/nin/gen) e resistências física e mental. O dano de uma técnica é
// base + ataque do tipo − resistência usada pelo jogador, igual ao do jogador.
// Vilões também gastam chakra: taijutsu é grátis; ninjutsu e genjutsu custam. Sem chakra para
// nenhuma técnica, o vilão perde a vez concentrando chakra.
// `reactions`: pesos de Resistir, Disputa e Substituição. Barreiras são ações (entram no sorteio sem escudo ativo).
// `xp`: curva planejada em docs/progressao.md.
// `passive`/`hardcorePassive`: passiva única; a versão hardcore substitui a normal nesse modo.
// `behavior.charged`: golpe carregado (anuncia numa vez, solta ×2 sem crítico na seguinte).

// Marca da maldição: mesmos valores do manto do jinchuuriki.
const CURSE_MARK_CLOAK: CloakDef = { ...balance.jinchuuriki.cloak };
const curseMark = { kind: 'cloak', variant: 'curseMark', cloak: CURSE_MARK_CLOAK, genjutsuImmune: false } as const;

export const villains: VillainDef[] = [
  {
    id: 'mizuki',
    element: 'wind',
    hp: 70,
    chakra: 10,
    speed: 9,
    offense: { taijutsu: 7, ninjutsu: 5, genjutsu: 3 },
    resistance: { physical: 8, mental: 9 },
    reactions: { resist: 4, substitution: 1 },
    critBonus: 0,
    xp: 100,
    techniques: [
      { id: 'kunaiStrike', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 3, blade: 'cutting' },
      { id: 'giantShuriken', type: 'taijutsu', baseDamage: 11, chakraCost: 0, weight: 1, blade: 'cutting' },
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
    offense: { taijutsu: 7, ninjutsu: 9, genjutsu: 6 },
    resistance: { physical: 8, mental: 13 },
    reactions: { resist: 2, clash: 1, substitution: 2 },
    critBonus: 0.05,
    xp: 125,
    techniques: [
      { id: 'senbon', type: 'taijutsu', baseDamage: 7, chakraCost: 0, weight: 3 },
      { id: 'iceMirrors', type: 'ninjutsu', baseDamage: 8, chakraCost: 5, weight: 2 },
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
    offense: { taijutsu: 9, ninjutsu: 9, genjutsu: 5 },
    resistance: { physical: 12, mental: 10 },
    reactions: { resist: 2, clash: 2, substitution: 1 },
    critBonus: 0.02,
    xp: 150,
    techniques: [
      { id: 'cleaverSwing', type: 'taijutsu', baseDamage: 9, chakraCost: 0, weight: 3, blade: 'sword' },
      { id: 'waterDragonBullet', type: 'ninjutsu', baseDamage: 11, chakraCost: 5, weight: 2 },
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
    offense: { taijutsu: 7, ninjutsu: 9, genjutsu: 5 },
    resistance: { physical: 10, mental: 11 },
    reactions: { resist: 3, clash: 1, substitution: 1 },
    critBonus: 0.02,
    xp: 60,
    techniques: [
      { id: 'fanGust', type: 'ninjutsu', baseDamage: 9, chakraCost: 4, weight: 2 },
      { id: 'kunaiStrike', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 2, blade: 'cutting' },
    ],
  },
  {
    id: 'examSound',
    element: 'lightning',
    hp: 85,
    chakra: 12,
    speed: 12,
    offense: { taijutsu: 8, ninjutsu: 7, genjutsu: 8 },
    resistance: { physical: 10, mental: 16 },
    reactions: { resist: 3, clash: 1, substitution: 1 },
    critBonus: 0.03,
    xp: 60,
    techniques: [
      { id: 'soundWave', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, mentalStrength: 1 },
      { id: 'kunaiStrike', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 3, blade: 'cutting' },
    ],
  },
  {
    id: 'examLeaf',
    element: 'fire',
    hp: 100,
    chakra: 12,
    speed: 12,
    offense: { taijutsu: 9, ninjutsu: 8, genjutsu: 5 },
    resistance: { physical: 14, mental: 13 },
    reactions: { resist: 3, clash: 1, substitution: 1 },
    critBonus: 0.03,
    xp: 60,
    techniques: [
      { id: 'palmStrike', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 3 },
      { id: 'fireballVillain', type: 'ninjutsu', baseDamage: 9, chakraCost: 4, weight: 1 },
    ],
  },
  {
    id: 'gaara',
    element: 'earth',
    // Era 160 de HP e defesa 14/14: aliviado por ser o gargalo da campanha.
    hp: 140,
    chakra: 36,
    speed: 9,
    offense: { taijutsu: 8, ninjutsu: 11, genjutsu: 6 },
    resistance: { physical: 14, mental: 14 },
    // A areia defende sozinha: começa a luta com o Escudo de Areia e o ergue de novo quando cai.
    reactions: { resist: 2, clash: 1 },
    startingShield: 'sandShield',
    // Armadura de Areia: terra no corpo a luta toda (raio perfura).
    elementalState: 'earth',
    critBonus: 0.02,
    xp: 200,
    techniques: [
      { id: 'sandCoffin', type: 'ninjutsu', baseDamage: 11, chakraCost: 4, weight: 3 },
      { id: 'sandTsunami', type: 'ninjutsu', baseDamage: 17, chakraCost: 8, weight: 1 },
      // Grátis: com o manto drenando o chakra, ele bate em vez de concentrar.
      { id: 'sandFist', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 2 },
      { id: 'sandShield', type: 'ninjutsu', baseDamage: 0, chakraCost: 4, weight: 2, barrier: 30 },
    ],
    behavior: { charged: 'sandTsunami' },
    passive: { kind: 'cloak', variant: 'beast', cloak: balance.jinchuuriki.cloak, genjutsuImmune: true },
    // Hardcore: Monstro. Derrotado pela 1ª vez, volta como Shukaku com metade do HP, golpes de monstro
    // (mais dano, menos precisão) e os multiplicadores do manto até morrer.
    hardcorePassive: {
      kind: 'cloak',
      variant: 'beast',
      cloak: balance.jinchuuriki.cloak,
      genjutsuImmune: true,
      monster: {
        healPct: 0.5,
        reactions: { resist: 3, clash: 1 },
        techniques: [
          { id: 'shukakuClaw', type: 'taijutsu', baseDamage: 14, chakraCost: 0, weight: 3, accuracy: 0.65 },
          { id: 'airBullet', type: 'ninjutsu', baseDamage: 20, chakraCost: 4, weight: 2, accuracy: 0.6, element: 'wind' },
          { id: 'sandBurial', type: 'ninjutsu', baseDamage: 26, chakraCost: 8, weight: 1, accuracy: 0.55 },
        ],
      },
    },
  },
  {
    id: 'jirobo',
    element: 'earth',
    hp: 70,
    chakra: 15,
    speed: 8,
    offense: { taijutsu: 10, ninjutsu: 8, genjutsu: 4 },
    resistance: { physical: 15, mental: 11 },
    reactions: { resist: 1 },
    critBonus: 0,
    xp: 60,
    techniques: [
      { id: 'earthPrison', type: 'ninjutsu', baseDamage: 11, chakraCost: 5, weight: 2 },
      { id: 'heavyPunch', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 2 },
      { id: 'earthWall', type: 'ninjutsu', baseDamage: 0, chakraCost: 5, weight: 1, barrier: 28, element: 'earth' },
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
    offense: { taijutsu: 8, ninjutsu: 10, genjutsu: 6 },
    resistance: { physical: 12, mental: 14 },
    reactions: { resist: 2, clash: 2, substitution: 1 },
    critBonus: 0.05,
    xp: 60,
    techniques: [
      { id: 'goldenArrow', type: 'ninjutsu', baseDamage: 10, chakraCost: 5, weight: 2 },
      { id: 'spiderWeb', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 2 },
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
    offense: { taijutsu: 7, ninjutsu: 7, genjutsu: 11 },
    resistance: { physical: 9, mental: 20 },
    reactions: { resist: 3, substitution: 1 },
    critBonus: 0.02,
    xp: 60,
    techniques: [
      { id: 'demonFlute', type: 'genjutsu', baseDamage: 0, chakraCost: 5, weight: 1, mentalStrength: 1 },
      { id: 'summonedOgre', type: 'taijutsu', baseDamage: 11, chakraCost: 0, weight: 2 },
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
    offense: { taijutsu: 10, ninjutsu: 8, genjutsu: 6 },
    resistance: { physical: 14, mental: 14 },
    reactions: { resist: 2, clash: 1, substitution: 2 },
    critBonus: 0.03,
    xp: 60,
    techniques: [
      { id: 'twinStrike', type: 'taijutsu', baseDamage: 9, chakraCost: 0, weight: 3 },
      { id: 'parasiteBody', type: 'ninjutsu', baseDamage: 9, chakraCost: 4, weight: 1 },
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
    offense: { taijutsu: 10, ninjutsu: 10, genjutsu: 10 },
    resistance: { physical: 15, mental: 19 },
    reactions: { resist: 2, clash: 1, substitution: 3 },
    critBonus: 0.05,
    xp: 250,
    techniques: [
      { id: 'chakraScalpel', type: 'taijutsu', baseDamage: 12, chakraCost: 0, weight: 3, blade: 'cutting' },
      { id: 'deadSoul', type: 'ninjutsu', baseDamage: 10, chakraCost: 5, weight: 1 },
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
    offense: { taijutsu: 12, ninjutsu: 12, genjutsu: 13 },
    resistance: { physical: 18, mental: 23 },
    // Troca de pele: escorregadio.
    reactions: { resist: 2, clash: 2, substitution: 2 },
    critBonus: 0.05,
    xp: 300,
    techniques: [
      { id: 'hiddenSnakes', type: 'ninjutsu', baseDamage: 14, chakraCost: 5, weight: 3 },
      { id: 'grassSword', type: 'taijutsu', baseDamage: 12, chakraCost: 0, weight: 2, blade: 'sword' },
      { id: 'killingIntent', type: 'genjutsu', baseDamage: 0, chakraCost: 6, weight: 1, mentalStrength: 1 },
    ],
    behavior: { charged: 'hiddenSnakes' },
    // Insano: acertos envenenam (bônus 1). Abaixo de 50% de HP, precisa ser derrotado em 5 rodadas,
    // senão revive com 50% do HP máximo: no máximo 1 vez no fácil, 2 no normal e 3 no difícil.
    passive: {
      kind: 'insane',
      snakeBonus: 1,
      hpThresholdPct: 0.5,
      killWindow: 5,
      revivePct: 0.5,
      revivesByDifficulty: { easy: 1, normal: 2, hard: 3 },
    },
    // Hardcore: veneno com bônus 3, prazo de 4 rodadas, revive sem limite e não recebe crítico.
    hardcorePassive: { kind: 'insane', snakeBonus: 3, hpThresholdPct: 0.5, killWindow: 4, revivePct: 0.5, critImmune: true },
  },
];

export const villainsById: Record<string, VillainDef> = Object.fromEntries(villains.map((v) => [v.id, v]));
