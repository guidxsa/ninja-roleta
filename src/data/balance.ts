// Todos os números de balanceamento. Valores provisórios: ajustar com `npm run sim`.
// O design de cada regra está em docs/ (o arquivo indicado em cada bloco).

export const balance = {
  origin: {
    // Jinchuuriki: roleta independente da linhagem (origens.md). Os pesos das linhagens ficam em lineages.ts.
    jinchuurikiChance: 0.1,
  },

  elements: { advantage: 1.5, disadvantage: 0.75, neutral: 1 },

  // Rolagem de acerto (fundamentos.md): chance = precisão da técnica + bônus − penalidades, entre min e max.
  hit: { defaultAccuracy: 0.85, min: 0.05, max: 1 },
  // Genjutsu do atacante vs. genjutsu do defensor.
  genjutsuHit: { base: 0.6, perPoint: 0.02, min: 0.2, max: 0.9 },
  // Efeitos mentais: turnos = turnos base da técnica + 1 a cada `pointsPerExtraTurn` de vantagem
  // (poder do atacante − genjutsu do alvo), entre 1 e `maxTurns`. Pergaminho: +3 de poder por nível.
  genjutsuPrison: { pointsPerExtraTurn: 8, maxTurns: 3 },

  // Crítico: 5% + diferencial_de_dano_% + bônus da técnica, no máximo 50% e nunca acima do acerto.
  crit: { baseChance: 0.05, multiplier: 2, max: 0.5 },

  // Resistência do jogador = max(piso, status / 2) + diferencial (começa em 1). Corpo de ferro: piso 4 em nin e gen.
  resistance: { offenseDivisor: 2, initialBonus: 1, floor: 2, ironBodyFloor: 4 },

  // Penetração: soma de técnica, sapo e Punho preciso, com teto.
  penetration: { max: 0.6 },

  // Restauração (fundamentos.md): o início de cada combate restaura HP e chakra e limpa os efeitos.
  // `restoreWithinBlock: false` faz o HP carregar entre as lutas de um bloco.
  combat: { restoreOnStart: true, restoreWithinBlock: true },

  // Ações universais (tecnicas.md).
  rest: { chakraRecovered: 4 },
  substitution: { chakraCost: 2, dodgeChance: 0.5 },

  // Golpe carregado dos vilões: dano × `damageMult`, sem crítico.
  charged: { damageMult: 2 },

  // Dōjutsu: ativar gasta o turno e `activationCost`; ativo, custa `upkeep` no fim de cada rodada e se
  // desliga depois de `duration` rodadas (contadas a partir da seguinte) ou quando falta chakra.
  dojutsu: {
    duration: 5,
    // Sharingan: evolui com o nível (1, 2 e 3 tomoe).
    sharingan: {
      activationCost: 4,
      upkeep: 1,
      readDamageFactor: 0.5,
      stages: [
        { minLevel: 1, statBonus: 3, speed: 1, genjutsuHit: 0.1, genjutsuPower: 3, readChance: 0.2 },
        { minLevel: 4, statBonus: 5, speed: 2, genjutsuHit: 0.15, genjutsuPower: 6, readChance: 0.25 },
        { minLevel: 7, statBonus: 7, speed: 3, genjutsuHit: 0.2, genjutsuPower: 9, readChance: 0.3 },
      ],
    },
    // Byakugan: taijutsu não erra, ×`taijutsuMult` e libera o Selo dos Pontos Vitais.
    byakugan: { activationCost: 3, upkeep: 1, taijutsuMult: 1.1 },
  },

  // Portões (prodígio do taijutsu): uma vez por luta; abrir gasta o turno e o bônus vale `turns` rodadas
  // a partir da seguinte. Abre o maior portão liberado pelo taijutsu atual.
  gates: {
    turns: 5,
    stages: [
      { minTaijutsu: 22, taijutsuMult: 1.5, chakraCost: 5, hpCostPct: 0.15 },
      { minTaijutsu: 26, taijutsuMult: 1.75, chakraCost: 7, hpCostPct: 0.2 },
      { minTaijutsu: 30, taijutsuMult: 2, chakraCost: 9, hpCostPct: 0.25 },
    ],
  },

  // Passivas e ativas de linhagem (origens.md).
  passives: {
    determination: { xpBonusPct: 0.1 },
    heavyBody: { base: 0.8, perHpPct: 0.4 },
    mindReading: { villainHitPenalty: 0.1 },
    hive: { chakraDrainPerHit: 2 },
    duo: { chance: 0.3, damagePct: 0.4 },
    genjutsuResistance: { bonus: 6 },
    preciseFist: { penetration: 0.3 },
    vitality: { chakraPerTurn: 1, hpPctPerTurn: 0.03 },
  },
  expansion: { chakraCost: 6, turns: 3, taijutsuMult: 1.5, speedPenalty: 3 },
  shadowClones: { chakraCost: 6, hitsMult: 3, damagePct: 0.4 },
  rotation: { reflectPct: 0.5 },

  // Efeitos (efeitos.md). Valem para jogador e vilões.
  status: {
    paralysis: { turns: 1 },
    stun: { turns: 2, hitPenalty: 0.1 },
    // O n-ésimo tique causa 2^n % do HP máximo, no máximo `maxPct`.
    burn: { turns: 2, extendPerHit: 1, reigniteTurns: 1, maxPct: 0.16 },
    // Tique = `basePct` do HP máximo + bônus da fonte + 1 por tique anterior, no máximo `maxPct`.
    // Teste de cura depois de cada tique a partir de `cureFromTick`. Acerto em alvo envenenado soma `hitBonus`.
    poison: { basePct: 0.01, growthPerTick: 1, maxPct: 0.3, cureChance: 0.4, cureFromTick: 2, hitBonus: 1 },
    bleed: { bladeDamageMult: 1.5 },
    // Efeitos de genjutsu.
    sleepExtraTurns: 1,
    fear: { damageMult: 0.75 },
    confusion: { failChance: 0.3, selfHitShare: 0.5 },
    torment: { chakraPerRound: 4 },
  },

  // Vilão sem chakra para nenhuma técnica concentra chakra no lugar de atacar.
  villainRest: { chakraRecovered: 4 },

  // Anti-trava: após sair de um efeito que tira a vez, o alvo age ao menos uma vez antes de perder a vez de novo.
  debilitated: { immunityActions: 1 },

  revive: { initialItems: 1 },

  // 1 estágio de status: +1 em tai/nin/gen/speed; HP e chakra máximos iguais a uma subida de nível.
  statStage: { taijutsu: 1, ninjutsu: 1, genjutsu: 1, speed: 1 },

  // Upgrade de técnica (pergaminho), por categoria e por nível.
  techniqueUpgrade: { baseDamagePerLevel: 3, healPctPerLevel: 0.05, genjutsuPowerPerLevel: 3 },

  // Ferramenta ninja: dano base extra em todos os ataques, por nível.
  ninjaTool: { baseDamagePerLevel: 1 },

  // Invocações (campanha.md). "Por nível" conta a partir do nível 2.
  summon: {
    toad: { penetration: 0.25, penetrationPerLevel: 0.1 },
    snake: { poisonBonus: 2, poisonBonusPerLevel: 2 },
    slug: { healPct: 0.03, healPctPerLevel: 0.01, cureChancePerLevel: 0.1 },
  },

  // Nível sem limite (progressao.md). XP do nível N ao N+1: xpBase + xpGrowth × (N − 1).
  // Subir de nível não restaura (quem restaura é o início do combate).
  level: {
    xpBase: 100,
    xpGrowth: 25,
    growth: {
      easy: { hp: 10, chakra: 2 },
      normal: { hp: 8, chakra: 1 },
      hard: { hp: 6, chakra: 1 },
      hardcore: { hp: 6, chakra: 1 },
    },
  },

  // Dificuldade (campanha.md): multiplica HP, dano base e defesas dos vilões.
  difficulty: {
    default: 'normal' as const,
    multipliers: { easy: 0.85, normal: 1, hard: 1.15, hardcore: 1.25 },
    hardcoreUnlockedBy: 'hard' as const,
  },

  events: {
    trainingStages: 1,
    jokenpoWinStages: 2,
    akatsukiCritBonus: 0.05,
    // Sem Vontade do Fogo para perder: começa a próxima luta assim (depois da restauração).
    akatsukiNoReviveHpPct: 0.5,
    akatsukiNoReviveChakraPct: 0.5,
  },

  // Itens e bolsa (itens.md).
  items: {
    xpScroll: 100,
    bagMax: 3,
    bagOverflowXp: 30,
    soldierPill: { chakraPct: 0.5 },
    explosiveTag: { damage: 15 },
    trainingWeights: { speedPenalty: 2, taijutsuPerWin: 1, removeSpeedBonus: 3 },
  },

  // Roleta de recompensa por raridade (1 comum, 2 rara, 3 lendária). Índice = raridade − 1.
  rewards: {
    stages: [1, 2, 3],
    techniqueScrolls: [0, 1, 2],
    xp: [60, 120, 200],
    itemSpins: [1, 2, 3],
    resistance: [1, 2, 3],
    critBonus: [0.02, 0.04, 0.06],
    // Lendária: gira tantas vezes e o jogador escolhe 1.
    legendaryChoices: 3,
  },

  exam: {
    // Índice = vitórias no exame. 0 = sem recompensa.
    rewardTierByWins: [0, 1, 2, 3],
  },

  jinchuuriki: {
    chakraBonusPct: 1.0,
    // Manto de chakra: uma vez por luta, abaixo do limiar de HP. Paga 10% do chakra máximo por rodada.
    cloak: { hpThresholdPct: 0.5, statMult: 1.5, regenPct: 0.05, chakraPctPerRound: 0.1, turns: 5 },
    genjutsuImmune: true,
  },

  history: { maxRuns: 100 },
};

export type Balance = typeof balance;
