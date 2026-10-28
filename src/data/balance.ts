// Todos os números de balanceamento. Valores provisórios: ajustar com `npm run sim`.
// O design de cada regra está em docs/ (o arquivo indicado em cada bloco).

export const balance = {
  origin: {
    // Jinchuuriki: roleta independente da linhagem (origens.md). Os pesos das linhagens ficam em lineages.ts.
    jinchuurikiChance: 0.1,
  },

  // Elementos só contam em encontros: disputa, barreira ou estado elemental (fundamentos.md#elementos).
  // `pierce`: raio contra barreira ou estado de terra. `fireAbsorbsWind`: fogo que vence vento na disputa.
  elements: { advantage: 1.5, disadvantage: 0.75, neutral: 1, pierce: 2, fireAbsorbsWind: 1.25 },

  // Rolagem de acerto (fundamentos.md): chance = precisão da técnica + bônus − penalidades, entre min e max.
  hit: { defaultAccuracy: 0.85, min: 0.05, max: 1 },
  // Genjutsu do atacante vs. resistência mental usada pelo alvo.
  genjutsuHit: { base: 0.6, perPoint: 0.02, min: 0.2, max: 0.9 },
  // Efeitos mentais: turnos = turnos base da técnica + 1 a cada `pointsPerExtraTurn` de vantagem
  // (poder do atacante − resistência mental usada pelo alvo), entre 1 e `maxTurns`.
  genjutsuPrison: { pointsPerExtraTurn: 8, maxTurns: 3 },

  // Crítico: 5% + diferencial_de_dano_% + bônus da técnica, no máximo 50% e nunca acima do acerto.
  crit: { baseChance: 0.05, multiplier: 2, max: 0.5 },

  // Fração da resistência usada (fundamentos.md#resistência-passiva-e-ativa): passiva (não reagiu ou não
  // pode reagir), Resistir (reação grátis) e postura defensiva (ação de turno).
  resistance: { passive: 0.4, resist: 0.7, stance: 1 },

  // Penetração: soma de técnica, sapo e Punho preciso, com teto.
  penetration: { max: 0.6 },

  // Restauração (fundamentos.md): a luta não começa restaurada; HP e chakra seguem entre as lutas.
  // Cada vitória recupera `recoverAfterWinPct` do HP e do chakra máximos (no exame também).
  combat: { restoreOnStart: false, recoverAfterWinPct: 0.25 },

  // Ações universais (tecnicas.md).
  // Concentrar chakra (jogador e vilão): recupera esta fração do chakra máximo (arredonda para baixo, mínimo 1).
  rest: { chakraPct: 0.15 },
  // Reação Substituição: chance = base + (speed de quem reage − speed do atacante) × perSpeed, entre min e max.
  substitution: { chakraCost: 2, baseChance: 0.5, perSpeed: 0.03, min: 0.25, max: 0.85, usesPerFight: 2 },

  // Disputa de ninjutsu (fundamentos.md#disputa-de-ninjutsu): poder = dano (ou barreira) + ninjutsu × statFactor.
  // Roleta: poder_A², poder_B² e cancelWeight × A × B. O vencedor passa max(minPassThrough, 1 − perdedor/vencedor)
  // do dano; com poder ≥ crushRatio × o do outro, passa inteiro. A quebra de guarda usa o mesmo statFactor.
  clash: { statFactor: 0.5, cancelWeight: 0.5, minPassThrough: 0.25, crushRatio: 2 },

  // Estados elementais (tecnicas.md#estados-elementais). Duram `turns` rodadas a partir da seguinte.
  states: {
    lightningArmor: { element: 'lightning' as const, turns: 3, offenseMult: 1.25, resistanceMult: 1.3, speed: 2 },
  },

  // Barreiras (tecnicas.md#barreiras): ação de turno; o escudo dura `turns` rodadas a partir da seguinte.
  barrier: { turns: 3 },

  // Golpe carregado dos vilões: dano × `damageMult`, sem crítico.
  charged: { damageMult: 2 },

  // Dōjutsu: ativar é escolha grátis da rodada (não gasta o turno) e custa `activationCost`; ativo, custa
  // `upkeep` no fim de cada rodada e se desliga depois de `duration` rodadas (contadas a partir da
  // seguinte) ou quando falta chakra.
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

  // Portões (prodígio do taijutsu): uma vez por luta; abrir é escolha grátis e o bônus vale `turns`
  // rodadas, contando a da abertura. Abre o maior portão liberado pelo taijutsu atual.
  gates: {
    turns: 3,
    stages: [
      { minTaijutsu: 17, taijutsuMult: 1.3, chakraCost: 5, hpCostPct: 0.2 },
      { minTaijutsu: 21, taijutsuMult: 1.5, chakraCost: 7, hpCostPct: 0.25 },
      { minTaijutsu: 25, taijutsuMult: 1.7, chakraCost: 9, hpCostPct: 0.3 },
    ],
  },

  // Passivas e ativas de linhagem (origens.md).
  passives: {
    // Comum: +25% de XP e, a cada nível, +1 no maior status de ataque (empate: tai, nin, gen).
    determination: { xpBonusPct: 0.25, offensePerLevel: 1 },
    // Gênio (Nara): vê a próxima ação do vilão e, `uses` vezes por luta (+1 em cada nível de
    // `extraUseLevels`), arma de graça a próxima roleta dele: gira duas vezes e fica com a melhor.
    genius: { uses: 2, extraUseLevels: [4, 7] },
    heavyBody: { base: 0.7, perHpPct: 0.4 },
    mindReading: { villainHitPenalty: 0.1 },
    hive: { chakraDrainPerHit: 2 },
    duo: { chance: 0.25, damagePct: 0.4 },
    genjutsuResistance: { bonus: 6 },
    preciseFist: { penetration: 0.3 },
    vitality: { chakraPerTurn: 1, hpPctPerTurn: 0.02 },
  },
  // Expansão (Akimichi): escolha grátis; vale `turns` rodadas, contando a da ativação.
  expansion: { chakraCost: 6, turns: 3, taijutsuMult: 1.5, speedPenalty: 3 },
  shadowClones: { chakraCost: 6, hitsMult: 3, damagePct: 0.35 },

  // Efeitos (efeitos.md). Valem para jogador e vilões.
  status: {
    paralysis: { turns: 1 },
    stun: { turns: 2, hitPenalty: 0.2 },
    // O n-ésimo tique causa 2^n % do HP máximo, no máximo `maxPct`.
    burn: { turns: 2, extendPerHit: 1, reigniteTurns: 1, maxPct: 0.16 },
    // Tique = `basePct` do HP máximo + bônus da fonte + 1 por tique anterior, no máximo `maxPct`.
    // Teste de cura depois de cada tique a partir de `cureFromTick`. Acerto em alvo envenenado soma `hitBonus`.
    poison: { basePct: 0.01, growthPerTick: 1, maxPct: 0.3, cureChance: 0.4, cureFromTick: 2, hitBonus: 1 },
    bleed: { bladeDamageMult: 1.5 },
    // Efeitos de genjutsu.
    sleepExtraTurns: 1,
    // Pavor: o apavorado causa `damageMult` do dano e tem as resistências × `resistanceMult`.
    fear: { damageMult: 0.65, resistanceMult: 0.75 },
    confusion: { failChance: 0.4, selfHitShare: 0.5 },
    torment: { chakraPerRound: 5 },
    // Possessão (Yamanaka): perde a vez e golpeia a si mesmo com a técnica de dano mais forte, contra a
    // própria resistência física passiva, × `selfDamageMult`.
    possession: { selfDamageMult: 1 },
  },


  // Anti-trava: após sair de um efeito que tira a vez, o alvo age ao menos uma vez antes de perder a vez de novo.
  debilitated: { immunityActions: 1 },

  // Controles (efeitos.md#controles): quem perde a vez (Aprisionado, Sono, Paralisia, Possessão) ganha
  // tenacidade, que multiplica a chance do próximo controle por (1 − tenacidade). Cai `decayPerRound` por
  // rodada em que não está controlado. Alvo que perdeu a vez recebe dano × `vulnerableDamageMult`.
  // Todo controle que pega dura `extraTurns` a mais (genjutsu, Imitação de Sombra, Possessão e paralisia).
  control: { tenacityPerControl: 0.5, decayPerRound: 0.15, maxTenacity: 0.9, vulnerableDamageMult: 1.25, extraTurns: 1 },

  revive: { initialItems: 1 },

  // 1 estágio de status: +1 em tai/nin/gen/speed e nas resistências; HP e chakra máximos iguais a uma subida de nível.
  statStage: { taijutsu: 1, ninjutsu: 1, genjutsu: 1, speed: 1, physical: 1, mental: 1 },

  // Níveis de técnica (tecnicas.md#níveis-de-técnica). Teto = 1 + floor((nível do personagem − 1) / levelsPerTier):
  // I do 1, II do 4, III do 7, IV do 10. Upgrade genérico (técnicas sem linha própria), por nível acima do I.
  // Marcos dão 1 upgrade grátis à escolha. Sem técnica para subir, o upgrade vira `noTargetXp`.
  techniqueUpgrade: {
    levelsPerTier: 3,
    milestones: [4, 7, 10],
    baseDamagePerLevel: 3,
    barrierPerLevel: 4,
    healPctPerLevel: 0.05,
    genjutsuPowerPerLevel: 3,
    chakraPerLevel: 1,
    noTargetXp: 30,
  },

  // Ferramenta ninja: dano base extra em todos os ataques, por nível.
  ninjaTool: { baseDamagePerLevel: 1 },

  // Invocações (campanha.md). "Por nível" conta a partir do nível 2.
  summon: {
    toad: { penetration: 0.25, penetrationPerLevel: 0.1 },
    snake: { poisonBonus: 2, poisonBonusPerLevel: 2 },
    slug: { healPct: 0.03, healPctPerLevel: 0.01, cureChancePerLevel: 0.1 },
  },

  // Nível sem limite (progressao.md). XP do nível N ao N+1: xpBase + xpGrowth × (N − 1).
  // Subir de nível restaura HP e chakra por completo.
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

  // Dificuldade (campanha.md): multiplica HP, dano base, ataques e resistências dos vilões.
  difficulty: {
    default: 'normal' as const,
    multipliers: { easy: 0.85, normal: 1, hard: 1.15, hardcore: 1.25 },
    hardcoreUnlockedBy: 'hard' as const,
  },

  events: {
    // Treino: XP garantido e +highlight no status sorteado (speed ganha speedHighlight). Pesos = os próprios status.
    training: { xp: 60, highlight: 3, speedHighlight: 2 },
    jokenpoWinStages: 2,
    akatsukiCritBonus: 0.05,
    // Sem Vontade do Fogo para perder: perde esta fração do HP e do chakra que tem (HP nunca abaixo de 1).
    akatsukiNoReviveHpPct: 0.5,
    akatsukiNoReviveChakraPct: 0.5,
  },

  // Guru (campanha.md#guru): premium sorteada por peso do perfil. Palma Curativa pesa chakra máximo ÷ divisor.
  // Foco e Mestre da Substituição: +1 uso por luta a cada vez, até maxLevel. O foco soma `focusCritBonus`
  // à chance de crítico do próximo ataque (ainda limitada pelo teto do crítico e pela chance de acerto).
  guru: { medicalChakraDivisor: 3, focusMaxLevel: 3, substitutionMaxLevel: 3, focusCritBonus: 0.25 },

  // Itens e bolsa (itens.md).
  items: {
    resistanceAmulet: 2,
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
    // Upgrades que acompanham a técnica nova (ou que ela vira, sem técnica para aprender).
    techniqueUpgrades: [0, 1, 2],
    xp: [60, 120, 200],
    itemSpins: [1, 2, 3],
    // Pontos de resistência, distribuídos um a um entre física e mental (50% cada).
    resistance: [2, 4, 6],
    critBonus: [0.02, 0.04, 0.06],
    // Lendária: gira tantas vezes e o jogador escolhe 1.
    legendaryChoices: 3,
  },

  exam: {
    // Índice = vitórias no exame. 0 = sem recompensa.
    rewardTierByWins: [0, 1, 2, 3],
    // Quem perde uma luta do exame segue para a próxima com esta fração do HP e do chakra máximos.
    lossRecoverPct: 0.5,
  },

  jinchuuriki: {
    chakraBonusPct: 1.0,
    // Manto de chakra: uma vez por luta, abaixo do limiar de HP. Paga 10% do chakra máximo por rodada.
    cloak: { hpThresholdPct: 0.5, statMult: 1.5, resistanceMult: 1.25, regenPct: 0.05, chakraPctPerRound: 0.1, turns: 5 },
    genjutsuImmune: true,
  },

  history: { maxRuns: 100 },
};

export type Balance = typeof balance;
