import type { JTechnique } from '../../core/jornada/types';

// Técnicas da Jornada (docs/jornada/personagens.md e docs/jornada/inimigos.md). Nomes em strings/jornada.ts.
// Prefixo `j` para não colidir com o catálogo do Roleta.

/** Do Naruto e dos aliados. */
export const allyTechniques: JTechnique[] = [
  // Comuns a todo ninja
  { id: 'jStrike', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 8, chakraCost: 0, accuracy: 0.9 },
  { id: 'jShuriken', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 5, hits: 2, chakraCost: 0, accuracy: 0.8 },

  // Naruto
  { id: 'jKageBunshin', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 5, clones: 2, active: true },
  { id: 'jSexyJutsu', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 0, chakraCost: 3, accuracy: 0.75, onHit: { effect: 'stun', chance: 0.6, turns: 1 }, cooldown: 3 },
  { id: 'jRendan', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, hits: 1, hitsPerClone: 1, maxCloneHits: 3, chakraCost: 3, accuracy: 0.85 },
  { id: 'jTajuuBunshin', type: 'ninjutsu', element: null, target: 'allEnemies', baseDamage: 9, hits: 2, chakraCost: 12, clones: 3 },
  { id: 'jKyuubiCloak', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, hpCostPct: 0.08, shieldPct: 0.2, active: true, cooldown: 4 },
  { id: 'jChakraBurst', type: 'ninjutsu', element: null, target: 'allEnemies', baseDamage: 14, chakraCost: 8, accuracy: 0.9 },
  { id: 'jRasengan', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 28, chakraCost: 10, accuracy: 0.9, critBonus: 0.05 },
  { id: 'jOdama', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 44, chakraCost: 16, accuracy: 0.85, penetration: 0.2, onHit: { effect: 'stun', chance: 0.3, turns: 1 } },

  // Sasuke
  { id: 'jFireball', type: 'ninjutsu', element: 'fire', target: 'enemy', baseDamage: 16, chakraCost: 5, onHit: { effect: 'burn', chance: 0.25 } },
  { id: 'jPhoenixFlower', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 8, chakraCost: 7, onHit: { effect: 'burn', chance: 0.2 } },
  { id: 'jLionBarrage', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 18, chakraCost: 4, accuracy: 0.85 },
  { id: 'jChidori', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 30, chakraCost: 10, accuracy: 0.85, penetration: 0.3 },

  // Sakura (no mangá, antes do timeskip, ela ainda não é médica: apoio tático)
  { id: 'jKunai', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 9, chakraCost: 0, accuracy: 0.9 },
  { id: 'jWireTrap', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 4, chakraCost: 3, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.4, turns: 1 }, cooldown: 2 },
  { id: 'jRelease', type: 'genjutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 2, cleanse: true, healPct: 0.1 },

  // Jiraiya
  { id: 'jToadOil', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 14, chakraCost: 8, onHit: { effect: 'burn', chance: 0.3 } },
  { id: 'jNeedleJizo', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, shieldPct: 0.25, cooldown: 3 },
  { id: 'jSanninStrike', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 14, chakraCost: 0, accuracy: 0.9 },

  // Tsunade
  { id: 'jTsunadePunch', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 24, chakraCost: 3, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.25, turns: 1 } },
  { id: 'jMysticPalm', type: 'ninjutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 5, healPct: 0.3, cleanse: true },

  // Rock Lee
  { id: 'jLeafWhirlwind', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, chakraCost: 0, accuracy: 0.9 },
  { id: 'jLeafHurricane', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 8, hits: 2, chakraCost: 0, accuracy: 0.85 },
  { id: 'jPrimaryLotus', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 32, chakraCost: 0, hpCostPct: 0.1, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.3, turns: 1 }, cooldown: 3 },

  // Gaara (aliado)
  { id: 'jSandShieldAlly', type: 'ninjutsu', element: 'earth', target: 'ally', baseDamage: 0, chakraCost: 5, shieldPct: 0.25, cooldown: 2 },
  { id: 'jSandCoffinAlly', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 20, chakraCost: 7, onHit: { effect: 'stun', chance: 0.3, turns: 1 } },
  { id: 'jSandShuriken', type: 'ninjutsu', element: 'earth', target: 'allEnemies', baseDamage: 8, chakraCost: 5 },
];

/** Linhas elementais (níveis I, II e III) do Comum e dos suportes genéricos (docs/jornada/personagens.md). */
export const elementalTechniques: JTechnique[] = [
  { id: 'jFireSpark', type: 'ninjutsu', element: 'fire', target: 'enemy', baseDamage: 11, chakraCost: 2, onHit: { effect: 'burn', chance: 0.15 } },
  { id: 'jGreatBlaze', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 15, chakraCost: 10, accuracy: 0.85, onHit: { effect: 'burn', chance: 0.3 } },
  { id: 'jWindBlade', type: 'ninjutsu', element: 'wind', target: 'enemy', baseDamage: 10, chakraCost: 2, accuracy: 0.9, critBonus: 0.05 },
  { id: 'jGale', type: 'ninjutsu', element: 'wind', target: 'enemy', baseDamage: 9, hits: 2, chakraCost: 5, critBonus: 0.1 },
  { id: 'jVacuumSphere', type: 'ninjutsu', element: 'wind', target: 'allEnemies', baseDamage: 7, hits: 2, chakraCost: 10, critBonus: 0.1 },
  { id: 'jSpark', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 12, chakraCost: 2, accuracy: 0.8, penetration: 0.1 },
  { id: 'jLightningCurrent', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 20, chakraCost: 6, accuracy: 0.8, penetration: 0.2, onHit: { effect: 'stun', chance: 0.15, turns: 1 } },
  { id: 'jLightningBlade', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 32, chakraCost: 11, accuracy: 0.75, penetration: 0.3 },
  { id: 'jRockFist', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 9, chakraCost: 2, accuracy: 0.95 },
  { id: 'jEarthSpear', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 17, chakraCost: 5, accuracy: 0.95, onHit: { effect: 'stun', chance: 0.2, turns: 1 } },
  { id: 'jEarthDragon', type: 'ninjutsu', element: 'earth', target: 'allEnemies', baseDamage: 13, chakraCost: 9, accuracy: 0.9, onHit: { effect: 'stun', chance: 0.15, turns: 1 } },
  { id: 'jWaterBullet', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 10, chakraCost: 2, accuracy: 0.9 },
  { id: 'jWaterShark', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 18, chakraCost: 5, accuracy: 0.9 },
  { id: 'jWaterfall', type: 'ninjutsu', element: 'water', target: 'allEnemies', baseDamage: 14, chakraCost: 9, accuracy: 0.9 },
];

/** Comum e prodígio das runs genéricas (docs/jornada/classes.md). */
export const classTechniques: JTechnique[] = [
  { id: 'jBunshin', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, clones: 1, active: true },
  { id: 'jExplosiveTag', type: 'taijutsu', element: null, target: 'allEnemies', baseDamage: 11, chakraCost: 4, accuracy: 0.85, cooldown: 2 },
  { id: 'jGates', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, hpCostPct: 0.08, boost: { damageMult: 1.3, turns: 3 }, active: true, cooldown: 4 },
  { id: 'jGatesHigh', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, hpCostPct: 0.15, boost: { damageMult: 1.6, accuracy: 0.1, turns: 3 }, active: true, cooldown: 5 },
  { id: 'jDynamicEntry', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 15, chakraCost: 0, accuracy: 0.9, critBonus: 0.1, cooldown: 2 },
  { id: 'jHiddenLotus', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, hits: 4, chakraCost: 0, hpCostPct: 0.15, accuracy: 0.85, cooldown: 4 },
  { id: 'jDrunkenFist', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, hits: 3, chakraCost: 0, accuracy: 0.75, critBonus: 0.15 },

  // Uchiha (v0.37.0)
  { id: 'jSharingan', type: 'genjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, boost: { accuracy: 0.15, evasion: 0.15, turns: 3 }, active: true, cooldown: 4 },
  { id: 'jSharingan3', type: 'genjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, boost: { accuracy: 0.2, evasion: 0.25, damageMult: 1.1, turns: 4 }, active: true, cooldown: 4 },
  { id: 'jCrowIllusion', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 12, chakraCost: 4, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.25, turns: 1 } },
  { id: 'jTsukuyomi', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 30, chakraCost: 12, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.5, turns: 1 }, cooldown: 4 },
  { id: 'jCursedSeal', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, hpCostPct: 0.1, boost: { damageMult: 1.4, turns: 3 }, active: true, cooldown: 5 },

  // Hyuuga (v0.37.0)
  { id: 'jByakugan', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, boost: { accuracy: 1, penetration: 0.2, turns: 3 }, active: true, cooldown: 4 },
  { id: 'jByakugan2', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, boost: { accuracy: 1, penetration: 0.3, damageMult: 1.15, turns: 4 }, active: true, cooldown: 4 },
  { id: 'jGentlePalm', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 10, chakraCost: 0, accuracy: 0.95, penetration: 0.2, onHit: { effect: 'chakraBlock', chance: 0.3 } },
  { id: 'jSixtyFourPalms', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 5, hits: 4, chakraCost: 8, accuracy: 0.95, penetration: 0.3, onHit: { effect: 'chakraBlock', chance: 0.5, turns: 3 }, cooldown: 3 },
  { id: 'jHundredTwentyEight', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 4, hits: 8, chakraCost: 12, accuracy: 0.95, penetration: 0.3, onHit: { effect: 'chakraBlock', chance: 0.6, turns: 3 }, cooldown: 4 },
  { id: 'jRotation', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, shieldPct: 0.25, cooldown: 3 },
  { id: 'jVacuumPalm', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 16, chakraCost: 4, accuracy: 0.9, penetration: 0.2 },
  { id: 'jVacuumWall', type: 'taijutsu', element: null, target: 'allEnemies', baseDamage: 12, chakraCost: 8, accuracy: 0.9, cooldown: 2 },
];

/** Dos inimigos (fichas em data/jornada/enemies.ts). */
export const enemyTechniques: JTechnique[] = [
  { id: 'jeClub', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, chakraCost: 0, accuracy: 0.85 },
  { id: 'jeAmbush', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 6, hits: 2, chakraCost: 0, accuracy: 0.8 },
  { id: 'jeMissingStrike', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 13, chakraCost: 3, accuracy: 0.85, onHit: { effect: 'poison', chance: 0.25 } },
  { id: 'jeKatana', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 10, chakraCost: 0, accuracy: 0.75 },
  { id: 'jeKunai', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 8, chakraCost: 0, accuracy: 0.9 },
  { id: 'jeGiantShuriken', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 13, chakraCost: 0, accuracy: 0.75 },
  { id: 'jeWaterBullet', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 11, chakraCost: 3 },
  { id: 'jeChainClaw', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 9, chakraCost: 0, accuracy: 0.85, onHit: { effect: 'poison', chance: 0.35 } },
  { id: 'jeChainSweep', type: 'taijutsu', element: null, target: 'allEnemies', baseDamage: 6, chakraCost: 2, accuracy: 0.8 },
  // Kakashi (teste do sino)
  { id: 'jeThousandYears', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 6, chakraCost: 0, onHit: { effect: 'stun', chance: 0.35, turns: 1 } },
  { id: 'jeHeadHunter', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 13, chakraCost: 4, onHit: { effect: 'stun', chance: 0.2, turns: 1 } },
  { id: 'jeKakashiKick', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 11, chakraCost: 0, accuracy: 0.9 },
  // Zabuza
  { id: 'jeCleaver', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 17, chakraCost: 0, accuracy: 0.8, penetration: 0.15 },
  { id: 'jeWaterPrison', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 0, chakraCost: 5, accuracy: 0.8, onHit: { effect: 'stun', chance: 1, turns: 2 }, cooldown: 4 },
  { id: 'jeWaterDragon', type: 'ninjutsu', element: 'water', target: 'allEnemies', baseDamage: 13, chakraCost: 8 },
  // Haku
  { id: 'jeSenbon', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 5, hits: 3, chakraCost: 0, accuracy: 0.85 },
  { id: 'jeIceMirrors', type: 'ninjutsu', element: 'water', target: 'allEnemies', baseDamage: 8, hits: 2, chakraCost: 8, cooldown: 2 },
  { id: 'jePressurePoint', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 6, chakraCost: 2, onHit: { effect: 'stun', chance: 0.3, turns: 1 } },
  // Exame: Trio do Som
  { id: 'jeSoundWave', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 11, chakraCost: 3, onHit: { effect: 'stun', chance: 0.2, turns: 1 } },
  { id: 'jeAirBlast', type: 'ninjutsu', element: 'wind', target: 'allEnemies', baseDamage: 8, chakraCost: 5 },
  { id: 'jeBellGenjutsu', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 7, chakraCost: 3, onHit: { effect: 'stun', chance: 0.3, turns: 1 } },
  // Ninjas da Grama e da Chuva
  { id: 'jeUmbrellaNeedles', type: 'taijutsu', element: null, target: 'allEnemies', baseDamage: 4, hits: 2, chakraCost: 3, accuracy: 0.75 },
  { id: 'jeRainClone', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 9, chakraCost: 2 },
  // Kabuto
  { id: 'jeChakraScalpel', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 13, chakraCost: 4, onHit: { effect: 'chakraBlock', chance: 0.4 } },
  { id: 'jeMedicalHeal', type: 'ninjutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 5, healPct: 0.25, cooldown: 2 },
  // Kiba e Akamaru
  { id: 'jeFangOverFang', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 10, hits: 2, chakraCost: 4, accuracy: 0.8 },
  { id: 'jeDogBite', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, chakraCost: 0, accuracy: 0.9 },
  { id: 'jeStinkBomb', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 0, chakraCost: 2, onHit: { effect: 'stun', chance: 0.4, turns: 1 }, cooldown: 3 },
  // Neji
  { id: 'jeGentleFist', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, chakraCost: 0, accuracy: 0.95, penetration: 0.3, onHit: { effect: 'chakraBlock', chance: 0.35 } },
  { id: 'jeRotation', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, shieldPct: 0.2, cooldown: 3 },
  { id: 'jeSixtyFourPalms', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 4, hits: 4, chakraCost: 8, accuracy: 0.95, penetration: 0.3, onHit: { effect: 'chakraBlock', chance: 0.5, turns: 3 }, cooldown: 3 },
  // Gaara (exame)
  { id: 'jeSandCoffin', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 18, chakraCost: 6, onHit: { effect: 'stun', chance: 0.35, turns: 1 } },
  { id: 'jeSandShield', type: 'ninjutsu', element: 'earth', target: 'self', baseDamage: 0, chakraCost: 4, shieldPct: 0.15, cooldown: 3 },
  { id: 'jeSandTsunami', type: 'ninjutsu', element: 'earth', target: 'allEnemies', baseDamage: 14, chakraCost: 9 },
  { id: 'jeShukakuClaw', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 22, chakraCost: 3, accuracy: 0.8 },
  // Orochimaru
  { id: 'jeSnakeHands', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 11, hits: 2, chakraCost: 4, onHit: { effect: 'poison', chance: 0.3 } },
  { id: 'jeKusanagi', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 20, chakraCost: 0, accuracy: 0.85, penetration: 0.3 },
  { id: 'jeManda', type: 'ninjutsu', element: null, target: 'allEnemies', baseDamage: 17, chakraCost: 12, cooldown: 3 },
  // Ninjas do Som, cobra e Quarteto do Som
  { id: 'jeSoundBlade', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 10, chakraCost: 0 },
  { id: 'jeSnakeBite', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, chakraCost: 0, onHit: { effect: 'poison', chance: 0.4 } },
  { id: 'jeEarthDome', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 6, chakraCost: 5, onHit: { effect: 'chakraBlock', chance: 0.6, turns: 2 }, cooldown: 2 },
  { id: 'jeHeavyPunch', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 18, chakraCost: 0, accuracy: 0.8 },
  { id: 'jeGoldenArrow', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 24, chakraCost: 6, accuracy: 0.8, penetration: 0.2 },
  { id: 'jeSpiderWeb', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 4, chakraCost: 3, onHit: { effect: 'stun', chance: 0.45, turns: 1 }, cooldown: 2 },
  { id: 'jeDemonFlute', type: 'genjutsu', element: null, target: 'allEnemies', baseDamage: 9, chakraCost: 6, onHit: { effect: 'stun', chance: 0.2, turns: 1 } },
  { id: 'jeTwinStrike', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 9, hits: 2, chakraCost: 0, accuracy: 0.85 },
  // Kimimaro
  { id: 'jeBoneDrill', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 22, chakraCost: 4, penetration: 0.3 },
  { id: 'jeBoneBullets', type: 'taijutsu', element: null, target: 'allEnemies', baseDamage: 8, hits: 2, chakraCost: 6 },
  { id: 'jeBoneDance', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 9, hits: 3, chakraCost: 3, accuracy: 0.85 },
  // Sasuke rival (hospital e Vale do Fim)
  { id: 'jeSasukeChidori', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 28, chakraCost: 10, accuracy: 0.85, penetration: 0.3 },
  { id: 'jeSasukeFireball', type: 'ninjutsu', element: 'fire', target: 'enemy', baseDamage: 16, chakraCost: 5, onHit: { effect: 'burn', chance: 0.3 } },
  { id: 'jeSasukeLion', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 15, chakraCost: 2, accuracy: 0.9 },
  { id: 'jeDragonFlame', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 14, chakraCost: 9, onHit: { effect: 'burn', chance: 0.3 }, cooldown: 2 },
];

export const jTechniques: JTechnique[] = [...allyTechniques, ...elementalTechniques, ...classTechniques, ...enemyTechniques];

/** Linha de cada elemento: níveis I, II e III. A Bola de Fogo é a do Sasuke. */
export const elementLines = {
  fire: ['jFireSpark', 'jFireball', 'jGreatBlaze'],
  wind: ['jWindBlade', 'jGale', 'jVacuumSphere'],
  lightning: ['jSpark', 'jLightningCurrent', 'jLightningBlade'],
  earth: ['jRockFist', 'jEarthSpear', 'jEarthDragon'],
  water: ['jWaterBullet', 'jWaterShark', 'jWaterfall'],
} as const satisfies Record<string, readonly [string, string, string]>;
export const jTechniquesById: Record<string, JTechnique> = Object.fromEntries(jTechniques.map((t) => [t.id, t]));
