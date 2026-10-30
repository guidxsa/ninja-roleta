// Todos os números de balanceamento. Valores provisórios: ajustar com `npm run sim`.
// O design de cada regra está em docs/ (o arquivo indicado em cada bloco).

/** Bônus permanente da Lição do clã. */
export interface ClanLessonBonus {
  taijutsu?: number;
  ninjutsu?: number;
  genjutsu?: number;
  highestOffense?: number;
  speed?: number;
  hp?: number;
  chakra?: number;
}

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
  // Efeitos mentais sem dano (efeitos.md#duração-dos-efeitos-mentais): força = força base da técnica +
  // vantagem / `pointsPerStrength` (poder do atacante − resistência usada pelo alvo), sem arredondar.
  // O 1º turno é garantido; depois de cada turno cumprido (k), o alvo gira para se livrar com
  // min(1, fuga_inicial + `escapeGrowth` / força × (k − 1)²), em que
  // fuga_inicial = clamp(`escapeBase` − `escapePerStrength` × (força − 1), `escapeMin`, 1). Sem teto de turnos.
  mentalHold: { pointsPerStrength: 8, escapeBase: 0.35, escapePerStrength: 0.15, escapeMin: 0.05, escapeGrowth: 0.1 },

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
        { minLevel: 1, statBonus: 3, speed: 1, genjutsuHit: 0.1, genjutsuPower: 3, readChance: 0.2, copyChance: 0.5 },
        { minLevel: 4, statBonus: 5, speed: 2, genjutsuHit: 0.15, genjutsuPower: 6, readChance: 0.25, copyChance: 0.65 },
        { minLevel: 7, statBonus: 7, speed: 3, genjutsuHit: 0.2, genjutsuPower: 9, readChance: 0.3, copyChance: 0.8 },
      ],
    },
    // Byakugan: taijutsu não erra, ×`taijutsuMult` e libera o Selo dos Pontos Vitais.
    // Byakugan: também ignora a evasão da névoa e tira `genjutsuHitPenalty` do acerto do genjutsu do vilão.
    byakugan: { activationCost: 3, upkeep: 1, taijutsuMult: 1.1, genjutsuHitPenalty: 0.2 },
  },

  // Portões (prodígio do taijutsu): uma vez por luta; abrir é escolha grátis e o bônus vale `turns`
  // rodadas, contando a da abertura. Abre o maior portão liberado pelo taijutsu atual.
  gates: {
    turns: 3,
    stages: [
      { minTaijutsu: 17, taijutsuMult: 1.3, chakraCost: 5, hpCostPct: 0.2 },
      { minTaijutsu: 21, taijutsuMult: 1.5, chakraCost: 7, hpCostPct: 0.25 },
      { minTaijutsu: 25, taijutsuMult: 1.7, chakraCost: 9, hpCostPct: 0.3 },
      { minTaijutsu: 29, taijutsuMult: 1.9, chakraCost: 11, hpCostPct: 0.35 },
    ],
    // Forçar: tenta abrir um portão além do liberado. Chance = `base` + `perPoint` × (taijutsu − mínimo do
    // portão forçado), entre `min` e `max`. Falhou: abre o liberado e fere mais `failHpPct` do HP máximo.
    force: { base: 0.5, perPoint: 0.03, min: 0.2, max: 0.8, failHpPct: 0.1 },
    usesPerFight: 1,
  },

  // Passivas e ativas de linhagem (origens.md).
  passives: {
    // Comum: +25% de XP e, a cada nível, +1 no maior status de ataque (empate: taijutsu, ninjutsu, genjutsu).
    determination: { xpBonusPct: 0.25, offensePerLevel: 1 },
    // Gênio (Nara): vê a próxima ação do vilão e, `uses` vezes por luta (+1 em cada nível de
    // `extraUseLevels`), arma de graça a próxima roleta dele: gira duas vezes e fica com a melhor.
    genius: { uses: 2, extraUseLevels: [4, 7] },
    // Corpo pesado (Akimichi): peso = HP máximo (não muda com o HP atual). Pela razão peso do Akimichi ÷ HP máximo
    // do vilão, o taijutsu ganha o multiplicador do maior degrau alcançado (nunca menos que ×1). A Expansão libera
    // os degraus de `expansionTable` acima do teto normal.
    heavyBody: {
      table: [
        { ratio: 1, mult: 1.05 },
        { ratio: 1.25, mult: 1.1 },
        { ratio: 1.5, mult: 1.2 },
        { ratio: 2, mult: 1.3 },
      ],
      expansionTable: [
        { ratio: 2.5, mult: 1.4 },
        { ratio: 3, mult: 1.5 },
      ],
    },
    mindReading: { villainHitPenalty: 0.1 },
    // Colônia (Aburame): cada golpe do Enxame que acerta deixa `insectsPerHit` insetos no vilão (até `maxInsects`);
    // no fim de cada rodada, cada inseto preso drena `chakraPerInsect` de chakra do vilão.
    hive: { insectsPerHit: 1, maxInsects: 10, chakraPerInsect: 1 },
    duo: { chance: 0.25, damagePct: 0.4 },
    genjutsuResistance: { bonus: 6 },
    preciseFist: { penetration: 0.3 },
    vitality: { chakraPerTurn: 1, hpPctPerTurn: 0.02 },
  },
  // Expansão (Akimichi): escolha grátis; vale `turns` rodadas, contando a da ativação.
  // Expansão (Akimichi): multiplica o peso do Corpo pesado (sem mudar o HP) e libera os degraus acima do teto.
  expansion: { chakraCost: 6, turns: 3, weightMult: 1.5, speedPenalty: 3 },
  // Clones das Sombras (premium do guru): o ataque principal sai inteiro e cada clone repete os golpes com
  // `damagePct` do dano. Clones = baseClones + (nível − 1).
  shadowClones: { chakraCost: 6, damagePct: 0.35, baseClones: 2 },
  // Ativas das linhagens sem ativa (origens.md). Todas são escolhas grátis; as com duração contam a rodada da ativação.
  // Esforço (comum): +`offenseBonus` em taijutsu/ninjutsu/genjutsu; `uses` por luta, +1 em cada nível de `extraUseLevels`.
  effort: { chakraCost: 0, turns: 3, offenseBonus: 3, uses: 1, extraUseLevels: [4, 7] },
  // Fera de quatro patas (Inuzuka): speed +`speedBonus`, Dupla com `duoChance` e Substituição sem gastar usos.
  beast: { chakraCost: 5, turns: 3, speedBonus: 3, duoChance: 0.6, uses: 1, extraUseLevels: [7] },
  // Devorar (Aburame): cada inseto drena `chakraPerInsect`; os que sobram com o vilão sem chakra causam `damagePerInsect`.
  // Praga (Aburame, ativa grátis): por `turns` rodadas (contando a da ativação), os insetos por acerto e o teto
  // de insetos são multiplicados por `mult`. Ao acabar, o excesso cai para o teto normal.
  plague: { chakraCost: 6, turns: 3, mult: 2, uses: 1, extraUseLevels: [7] },
  // Devorar (Aburame, técnica de ninjutsu): custa `chakraCostPerInsect` por inseto; cada inseto drena
  // `chakraPerInsect` do vilão e os que sobram com ele sem chakra causam `damagePerInsect` de dano direto.
  devour: { chakraCostPerInsect: 1, chakraPerInsect: 3, damagePerInsect: 2 },
  // Transmissão mental (Yamanaka): contra golpe carregado, rola o acerto de genjutsu; pegou, o vilão perde o golpe e a vez.
  transmission: { chakraCost: 5, uses: 1, extraUseLevels: [4, 7] },
  // Cópia (Uchiha, com o Sharingan): cada tentativa custa `chakraCost`; a chance vem do estágio do Sharingan.
  copy: { chakraCost: 3 },
  // Selamento (Uzumaki): a próxima técnica do vilão sai da roleta dele por `turns` rodadas.
  seal: { chakraCost: 6, uses: 1, turns: 2 },
  // Sombra costurada (Nara): manter a Imitação de Sombra custa `baseCost` + `perHold` por vez já mantida.
  shadowHold: { baseCost: 3, perHold: 1 },
  // Pílulas do clã (Akimichi): 1×/luta, roleta pura. Valem `turns` rodadas, contando a da ativação.
  pills: {
    usesPerFight: 1,
    turns: 3,
    options: [
      { id: 'green', weight: 50, taijutsuMult: 1.3, physical: 0, speed: 0, hpCostPct: 0.1, exhaustTurns: 0 },
      { id: 'yellow', weight: 35, taijutsuMult: 1.6, physical: 3, speed: 0, hpCostPct: 0.2, exhaustTurns: 0 },
      { id: 'red', weight: 15, taijutsuMult: 2, physical: 0, speed: 3, hpCostPct: 0.3, exhaustTurns: 2 },
    ],
    // Exausto (depois da pílula vermelha): taijutsu × `taijutsuMult` e speed − `speedPenalty`.
    exhausted: { taijutsuMult: 0.5, speedPenalty: 3 },
  },
  // Despertar (origens.md#despertar): melhoras de cada linhagem nos níveis 4 e 7.
  awakening: {
    common: { comeback: { level: 4, hpBelowPct: 0.25, healPct: 0.15 }, effort: { level: 7, offenseBonus: 5, turns: 4 } },
    nara: { shadow: { level: 4, strengthBonus: 1 }, strangle: { level: 7, hpPct: 0.05 } },
    akimichi: { heavyBody: { level: 4, weightMult: 1.1 }, expansion: { level: 7 } },
    yamanaka: { mindReading: { level: 4, villainHitPenalty: 0.15 }, possession: { level: 7, selfDamageMult: 1.25 } },
    aburame: { colony: { level: 4, maxInsects: 15 }, devour: { level: 7, chakraPerInsect: 4, damagePerInsect: 3 } },
    inuzuka: { duo: { level: 4, damagePct: 0.6 }, beast: { level: 7, chakraCost: 3, turns: 4 } },
    taijutsuProdigy: { force: { level: 4, chanceBonus: 0.1 }, gates: { level: 7, usesPerFight: 2 } },
    hyuuga: { byakugan: { level: 4, duration: 7 } },
    uzumaki: { seal: { level: 7, extraUses: 1, turns: 3 }, vitality: { level: 7, chakraPerTurn: 2, hpPctPerTurn: 0.02 } },
  },

  // Efeitos (efeitos.md). Valem para jogador e vilões.
  status: {
    paralysis: { turns: 2 },
    stun: { turns: 2, hitPenalty: 0.2 },
    // O n-ésimo tique causa 2^n % do HP máximo, no máximo `maxPct`.
    burn: { turns: 2, extendPerHit: 1, reigniteTurns: 1, maxPct: 0.16 },
    // Tique = `basePct` do HP máximo + bônus da fonte + 1 por tique anterior, no máximo `maxPct`.
    // Teste de cura depois de cada tique a partir de `cureFromTick`. Acerto em alvo envenenado soma `hitBonus`.
    poison: { basePct: 0.01, growthPerTick: 1, maxPct: 0.3, cureChance: 0.4, cureFromTick: 2, hitBonus: 1 },
    bleed: { bladeDamageMult: 1.5 },
    // Efeitos de genjutsu. O Sono soma força ao efeito.
    sleepStrengthBonus: 1,
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
  control: { tenacityPerControl: 0.5, decayPerRound: 0.15, maxTenacity: 0.9, vulnerableDamageMult: 1.25 },

  revive: { initialItems: 1 },

  // 1 estágio de status: +1 em taijutsu/ninjutsu/genjutsu/speed e nas resistências; HP e chakra máximos iguais a uma subida de nível.
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
    // Sapo: dano verdadeiro (ignora resistência e escudo) de uma fração do HP máximo do vilão, uma vez por ataque que acerta.
    toad: { trueDamagePct: 0.06, trueDamagePctPerLevel: 0.02 },
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
    // Lição do clã (campanha.md#lição-do-clã): XP e um bônus permanente com a cara da linhagem.
    // `highestOffense`: soma no maior status de ataque (comum).
    clanLesson: {
      xp: 40,
      bonus: {
        common: { highestOffense: 2 },
        nara: { ninjutsu: 2 },
        akimichi: { hp: 15 },
        yamanaka: { genjutsu: 2 },
        aburame: { ninjutsu: 2 },
        inuzuka: { speed: 1, taijutsu: 1 },
        taijutsuProdigy: { taijutsu: 2 },
        uchiha: { genjutsu: 2 },
        hyuuga: { taijutsu: 2 },
        uzumaki: { chakra: 5 },
      } as Record<string, ClanLessonBonus>,
    },
  },

  // Guru (campanha.md#guru): premium sorteada por peso do perfil. Palma Curativa pesa chakra máximo ÷ divisor.
  // Foco e Mestre da Substituição: +1 uso por luta a cada vez, até maxLevel. O foco soma `focusCritBonus`
  // à chance de crítico do próximo ataque (ainda limitada pelo teto do crítico e pela chance de acerto).
  // Clones das Sombras: até `clonesMaxLevel`, sem passar do teto de nível de técnica do personagem.
  // Corpo Cintilante: age primeiro na 1ª rodada; o nível 2 dá +`glimmerSpeedBonus` de speed.
  // O guru sorteia `premiumChoices` premium diferentes e o jogador escolhe 1.
  guru: {
    medicalChakraDivisor: 3,
    focusMaxLevel: 3,
    substitutionMaxLevel: 3,
    focusCritBonus: 0.25,
    clonesMaxLevel: 3,
    glimmerMaxLevel: 2,
    glimmerSpeedBonus: 2,
    premiumChoices: 2,
  },

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
