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
  // Kuchiyose no Jutsu (marco do contrato com os sapos): o Naruto clássico não escolhe o sapo. Sorteia a variante pelo
  // peso; a árvore dos Sapos mexe nos pesos (`rollWeights`).
  {
    id: 'jKuchiyose',
    type: 'ninjutsu',
    element: null,
    target: 'enemy',
    baseDamage: 0,
    chakraCost: 8,
    cooldown: 3,
    roll: [
      { tech: 'jTadpole', weight: 30 },
      { tech: 'jGamakichi', weight: 35 },
      { tech: 'jGamatatsu', weight: 25 },
      { tech: 'jGamabunta', weight: 10 },
    ],
  },
  { id: 'jTadpole', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 3, chakraCost: 0, accuracy: 0.9 },
  // Gamabunta aliado (entra pelo roteiro contra o Shukaku).
  { id: 'jbBlade', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 20, chakraCost: 0, accuracy: 0.85 },
  { id: 'jbWaterGun', type: 'ninjutsu', element: 'water', target: 'allEnemies', baseDamage: 14, chakraCost: 8 },
  // Gamabunta transformado em raposa (roteiro do Gaara, v0.70.0): as presas seguram o Shukaku.
  { id: 'jbFoxFang', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 22, chakraCost: 0, accuracy: 0.9, onHit: { effect: 'stun', chance: 0.5 } },
  // Cabeçada no Gaara adormecido: o roteiro dá ao Naruto com a raposa segurando o Shukaku; usar acorda o Gaara.
  { id: 'jHeadbutt', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 10, chakraCost: 0, accuracy: 1 },
  // Quem viu o Lee enfrentar o Gaara já conhece a areia (roteiro: liga na abertura da luta).
  { id: 'jReadSand', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, boost: { evasion: 0.2, turns: 3 }, active: true },
  // Garras da Kyuubi: vem com a forma do chakra da raposa (roteiro), não pela árvore.
  { id: 'jKyuubiClaw', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, hits: 2, chakraCost: 0, accuracy: 0.9 },
  { id: 'jSexyJutsu', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 0, chakraCost: 3, accuracy: 0.75, onHit: { effect: 'stun', chance: 0.6 }, cooldown: 3 },
  { id: 'jRendan', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, hits: 1, hitsPerClone: 1, maxCloneHits: 2, chakraCost: 3, accuracy: 0.85 },
  { id: 'jTajuuBunshin', type: 'ninjutsu', element: null, target: 'allEnemies', baseDamage: 9, hits: 2, chakraCost: 12, clones: 3 },
  { id: 'jKyuubiCloak', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, hpCostPct: 0.08, shieldPct: 0.2, active: true, cooldown: 4 },
  { id: 'jChakraBurst', type: 'ninjutsu', element: null, target: 'allEnemies', baseDamage: 14, chakraCost: 8, accuracy: 0.9 },
  { id: 'jRasengan', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 28, chakraCost: 10, accuracy: 0.9, critBonus: 0.05 },
  { id: 'jOdama', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 44, chakraCost: 16, accuracy: 0.85, penetration: 0.2, onHit: { effect: 'stun', chance: 0.25 } },
  { id: 'jRasenClone', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 18, hits: 1, hitsPerClone: 1, maxCloneHits: 2, chakraCost: 8, accuracy: 0.9 },
  { id: 'jHarem', type: 'genjutsu', element: null, target: 'allEnemies', baseDamage: 0, chakraCost: 6, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.5 }, cooldown: 4 },
  { id: 'jSmokeBomb', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, boost: { evasion: 0.3, turns: 2 }, active: true, cooldown: 4 },
  { id: 'jShadowShuriken', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, hits: 3, chakraCost: 3, accuracy: 0.85 },
  { id: 'jWarCry', type: 'ninjutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 5, healHp: 20, cleanse: true, cooldown: 2 },
  { id: 'jGamakichi', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 12, chakraCost: 6, onHit: { effect: 'burn', chance: 0.3 } },
  { id: 'jGamatatsu', type: 'ninjutsu', element: 'water', target: 'self', baseDamage: 0, chakraCost: 5, shieldPct: 0.25, active: true, cooldown: 3 },
  { id: 'jGamabunta', type: 'ninjutsu', element: null, target: 'allEnemies', baseDamage: 26, chakraCost: 16, accuracy: 0.9, onHit: { effect: 'stun', chance: 0.2 }, cooldown: 4 },
  { id: 'jOneTail', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, hpCostPct: 0.1, boost: { damageMult: 1.35, turns: 3 }, active: true, cooldown: 5 },

  // Sasuke
  { id: 'jFireball', type: 'ninjutsu', element: 'fire', target: 'enemy', baseDamage: 16, chakraCost: 5, onHit: { effect: 'burn', chance: 0.25 } },
  { id: 'jPhoenixFlower', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 8, chakraCost: 7, onHit: { effect: 'burn', chance: 0.2 } },
  { id: 'jLionBarrage', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 18, chakraCost: 4, accuracy: 0.85 },
  { id: 'jChidori', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 30, chakraCost: 10, accuracy: 0.85, penetration: 0.3 },

  // Sakura (no mangá, antes do timeskip, ela ainda não é médica: apoio tático)
  { id: 'jKunai', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 9, chakraCost: 0, accuracy: 0.9 },
  { id: 'jWireTrap', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 4, chakraCost: 3, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.3 }, cooldown: 2 },
  { id: 'jRelease', type: 'genjutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 2, cleanse: true, healHp: 10 },
  // Primeiros socorros da Sakura (v0.69.0): levanta melhor que a ação universal (15%), abaixo da Reanimação da Tsunade (50%). Proposta.
  { id: 'jFirstAid', type: 'ninjutsu', element: null, target: 'downedAlly', baseDamage: 0, chakraCost: 6, cooldown: 2, reviveHpPct: 0.35 },

  // Jiraiya
  { id: 'jToadOil', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 14, chakraCost: 8, onHit: { effect: 'burn', chance: 0.3 } },
  { id: 'jNeedleJizo', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, shieldPct: 0.25, cooldown: 3 },
  { id: 'jSanninStrike', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 14, chakraCost: 0, accuracy: 0.9 },

  // Tsunade
  { id: 'jTsunadePunch', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 24, chakraCost: 3, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.2 } },
  { id: 'jMysticPalm', type: 'ninjutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 5, healHp: 30, cleanse: true },
  // Reanimar é habilidade, não regra geral: caro em chakra e com espera (docs/jornada/combate.md#cair-e-levantar).
  { id: 'jReanimate', type: 'ninjutsu', element: null, target: 'downedAlly', baseDamage: 0, chakraCost: 15, cooldown: 2, reviveHpPct: 0.5 },

  // Rock Lee
  { id: 'jLeafWhirlwind', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, chakraCost: 0, accuracy: 0.9 },
  { id: 'jLeafHurricane', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 8, hits: 2, chakraCost: 0, accuracy: 0.85 },
  { id: 'jPrimaryLotus', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 32, chakraCost: 0, hpCostPct: 0.1, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.25 }, cooldown: 3 },

  // Gaara (aliado)
  { id: 'jSandShieldAlly', type: 'ninjutsu', element: 'earth', kekkeiGenkai: 'sand', target: 'ally', baseDamage: 0, chakraCost: 5, shieldPct: 0.25, cooldown: 2 },
  { id: 'jSandCoffinAlly', type: 'ninjutsu', element: 'earth', kekkeiGenkai: 'sand', target: 'enemy', baseDamage: 20, chakraCost: 7, onHit: { effect: 'stun', chance: 0.25 } },
  { id: 'jSandShuriken', type: 'ninjutsu', element: 'earth', kekkeiGenkai: 'sand', target: 'allEnemies', baseDamage: 8, chakraCost: 5 },

  // Equipe de resgate (Neji usa as técnicas do Hyuuga, em classTechniques)
  { id: 'jShadowBind', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 0, chakraCost: 4, accuracy: 0.9, onHit: { effect: 'stun', chance: 0.7 }, cooldown: 3 },
  { id: 'jMeatTank', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 20, chakraCost: 5, accuracy: 0.8 },
  { id: 'jPartialExpansion', type: 'taijutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 4, shieldPct: 0.15, cooldown: 2 },
  { id: 'jAkamaruBite', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 11, chakraCost: 0, accuracy: 0.9 },
  { id: 'jFangOverFang', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 10, hits: 2, chakraCost: 4, accuracy: 0.8 },
];

/** Linhas elementais (níveis I, II e III) do Comum e dos suportes genéricos (docs/jornada/personagens.md). */
export const elementalTechniques: JTechnique[] = [
  { id: 'jFireSpark', type: 'ninjutsu', element: 'fire', target: 'enemy', baseDamage: 11, chakraCost: 2, onHit: { effect: 'burn', chance: 0.15 } },
  { id: 'jGreatBlaze', type: 'ninjutsu', element: 'fire', target: 'allEnemies', baseDamage: 15, chakraCost: 10, accuracy: 0.85, onHit: { effect: 'burn', chance: 0.3 } },
  { id: 'jWindBlade', type: 'ninjutsu', element: 'wind', target: 'enemy', baseDamage: 10, chakraCost: 2, accuracy: 0.9, critBonus: 0.05 },
  { id: 'jGale', type: 'ninjutsu', element: 'wind', target: 'enemy', baseDamage: 9, hits: 2, chakraCost: 5, critBonus: 0.1 },
  { id: 'jVacuumSphere', type: 'ninjutsu', element: 'wind', target: 'allEnemies', baseDamage: 7, hits: 2, chakraCost: 10, critBonus: 0.1 },
  { id: 'jSpark', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 12, chakraCost: 2, accuracy: 0.8, penetration: 0.1 },
  { id: 'jLightningCurrent', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 20, chakraCost: 6, accuracy: 0.8, penetration: 0.2, onHit: { effect: 'stun', chance: 0.1 } },
  { id: 'jLightningBlade', type: 'ninjutsu', element: 'lightning', target: 'enemy', baseDamage: 32, chakraCost: 11, accuracy: 0.75, penetration: 0.3 },
  { id: 'jRockFist', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 9, chakraCost: 2, accuracy: 0.95 },
  { id: 'jEarthSpear', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 17, chakraCost: 5, accuracy: 0.95, onHit: { effect: 'stun', chance: 0.15 } },
  { id: 'jEarthDragon', type: 'ninjutsu', element: 'earth', target: 'allEnemies', baseDamage: 13, chakraCost: 9, accuracy: 0.9, onHit: { effect: 'stun', chance: 0.1 } },
  { id: 'jWaterBullet', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 10, chakraCost: 2, accuracy: 0.9 },
  { id: 'jWaterShark', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 18, chakraCost: 5, accuracy: 0.9 },
  { id: 'jWaterfall', type: 'ninjutsu', element: 'water', target: 'allEnemies', baseDamage: 14, chakraCost: 9, accuracy: 0.9 },
];

/** Comum e prodígio do Caminho Ninja (docs/jornada/classes.md). */
export const classTechniques: JTechnique[] = [
  // Diferente do Kage Bunshin: gasta o turno e cria só 1 clone.
  { id: 'jBunshin', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, clones: 1 },
  { id: 'jEffort', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, cooldown: 4, boost: { offense: 3, turns: 3 }, active: true },
  { id: 'jExplosiveTag', type: 'taijutsu', element: null, target: 'allEnemies', baseDamage: 11, chakraCost: 4, accuracy: 0.85, cooldown: 2 },
  // Portões: a ativa abre a escolha do portão; bônus, desgaste e tempo em jornadaBalance.gates.
  { id: 'jGates', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, active: true, gates: true },
  { id: 'jDynamicEntry', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 15, chakraCost: 0, accuracy: 0.9, critBonus: 0.1, cooldown: 2 },
  { id: 'jHiddenLotus', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, hits: 4, chakraCost: 0, hpCostPct: 0.15, accuracy: 0.85, cooldown: 4 },
  { id: 'jDrunkenFist', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, hits: 3, chakraCost: 0, accuracy: 0.75, critBonus: 0.15 },

  // Uchiha (v0.37.0)
  { id: 'jSharingan', type: 'genjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, boost: { accuracy: 0.15, evasion: 0.15, turns: 3 }, active: true, cooldown: 4 },
  { id: 'jSharingan3', type: 'genjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, boost: { accuracy: 0.2, evasion: 0.25, damageMult: 1.1, turns: 4 }, active: true, cooldown: 4, evolves: 'jSharingan' },
  { id: 'jCrowIllusion', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 12, chakraCost: 4, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.2 } },
  { id: 'jTsukuyomi', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 30, chakraCost: 12, accuracy: 0.85, onHit: { effect: 'stun', chance: 0.4 }, cooldown: 4 },
  { id: 'jCursedSeal', type: 'ninjutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 0, hpCostPct: 0.1, boost: { damageMult: 1.4, turns: 3 }, active: true, cooldown: 5 },

  // Hyuuga (v0.37.0)
  { id: 'jByakugan', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 3, boost: { accuracy: 1, penetration: 0.2, turns: 3 }, active: true, cooldown: 4 },
  { id: 'jByakugan2', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, boost: { accuracy: 1, penetration: 0.3, damageMult: 1.15, turns: 4 }, active: true, cooldown: 4, evolves: 'jByakugan' },
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
  { id: 'jeThousandYears', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 6, chakraCost: 0, onHit: { effect: 'stun', chance: 0.3 } },
  { id: 'jeHeadHunter', type: 'ninjutsu', element: 'earth', target: 'enemy', baseDamage: 13, chakraCost: 4, onHit: { effect: 'stun', chance: 0.15 } },
  { id: 'jeKakashiKick', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 11, chakraCost: 0, accuracy: 0.9 },
  // Zabuza
  { id: 'jeCleaver', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 17, chakraCost: 0, accuracy: 0.8, penetration: 0.15 },
  { id: 'jeWaterPrison', type: 'ninjutsu', element: 'water', target: 'enemy', baseDamage: 0, chakraCost: 5, accuracy: 0.8, onHit: { effect: 'stun', chance: 1, turns: 2 }, cooldown: 4 },
  // Névoa do Zabuza e espelhos do Haku: o roteiro liga na abertura (não são ações da IA).
  { id: 'jeHiddenMist', type: 'ninjutsu', element: 'water', target: 'self', baseDamage: 0, chakraCost: 0, boost: { evasion: 0.2, turns: 2 }, active: true },
  { id: 'jeMirrorStep', type: 'ninjutsu', element: 'water', kekkeiGenkai: 'ice', target: 'self', baseDamage: 0, chakraCost: 0, boost: { evasion: 0.2, turns: 2 }, active: true },
  { id: 'jeWaterDragon', type: 'ninjutsu', element: 'water', target: 'allEnemies', baseDamage: 13, chakraCost: 8 },
  // Haku
  { id: 'jeSenbon', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 5, hits: 3, chakraCost: 0, accuracy: 0.85 },
  { id: 'jeIceMirrors', type: 'ninjutsu', element: 'water', kekkeiGenkai: 'ice', target: 'allEnemies', baseDamage: 8, hits: 2, chakraCost: 8, cooldown: 2 },
  { id: 'jePressurePoint', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 6, chakraCost: 2, onHit: { effect: 'stun', chance: 0.25 } },
  // Exame: Trio do Som
  { id: 'jeSoundWave', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 11, chakraCost: 3, onHit: { effect: 'stun', chance: 0.15 } },
  { id: 'jeAirBlast', type: 'ninjutsu', element: 'wind', target: 'allEnemies', baseDamage: 8, chakraCost: 5 },
  { id: 'jeBellGenjutsu', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 7, chakraCost: 3, onHit: { effect: 'stun', chance: 0.25 } },
  // Ninjas da Grama e da Chuva
  { id: 'jeUmbrellaNeedles', type: 'taijutsu', element: null, target: 'allEnemies', baseDamage: 4, hits: 2, chakraCost: 3, accuracy: 0.75 },
  { id: 'jeRainClone', type: 'genjutsu', element: null, target: 'enemy', baseDamage: 9, chakraCost: 2 },
  // Kabuto
  { id: 'jeChakraScalpel', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 13, chakraCost: 4, onHit: { effect: 'chakraBlock', chance: 0.4 } },
  { id: 'jeMedicalHeal', type: 'ninjutsu', element: null, target: 'ally', baseDamage: 0, chakraCost: 5, healHp: 25, cooldown: 2 },
  { id: 'jeReanimate', type: 'ninjutsu', element: null, target: 'downedAlly', baseDamage: 0, chakraCost: 15, cooldown: 3, reviveHpPct: 0.3 },
  // Kiba e Akamaru
  { id: 'jeFangOverFang', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 10, hits: 2, chakraCost: 4, accuracy: 0.8 },
  { id: 'jeDogBite', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 7, chakraCost: 0, accuracy: 0.9 },
  { id: 'jeStinkBomb', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 0, chakraCost: 2, onHit: { effect: 'stun', chance: 0.4 }, cooldown: 3 },
  // Neji
  { id: 'jeGentleFist', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 12, chakraCost: 0, accuracy: 0.95, penetration: 0.3, onHit: { effect: 'chakraBlock', chance: 0.35 } },
  { id: 'jeRotation', type: 'taijutsu', element: null, target: 'self', baseDamage: 0, chakraCost: 4, shieldPct: 0.2, cooldown: 3 },
  { id: 'jeSixtyFourPalms', type: 'taijutsu', element: null, target: 'enemy', baseDamage: 4, hits: 4, chakraCost: 8, accuracy: 0.95, penetration: 0.3, onHit: { effect: 'chakraBlock', chance: 0.5, turns: 3 }, cooldown: 3 },
  // Gaara (exame)
  { id: 'jeSandCoffin', type: 'ninjutsu', element: 'earth', kekkeiGenkai: 'sand', target: 'enemy', baseDamage: 18, chakraCost: 6, onHit: { effect: 'stun', chance: 0.3 } },
  { id: 'jeSandShield', type: 'ninjutsu', element: 'earth', kekkeiGenkai: 'sand', target: 'self', baseDamage: 0, chakraCost: 4, shieldPct: 0.15, cooldown: 3 },
  { id: 'jeSandTsunami', type: 'ninjutsu', element: 'earth', kekkeiGenkai: 'sand', target: 'allEnemies', baseDamage: 14, chakraCost: 9 },
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
  { id: 'jeSpiderWeb', type: 'ninjutsu', element: null, target: 'enemy', baseDamage: 4, chakraCost: 3, onHit: { effect: 'stun', chance: 0.35 }, cooldown: 2 },
  { id: 'jeDemonFlute', type: 'genjutsu', element: null, target: 'allEnemies', baseDamage: 9, chakraCost: 6, onHit: { effect: 'stun', chance: 0.15 } },
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
