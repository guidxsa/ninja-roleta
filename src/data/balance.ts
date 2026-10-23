// Todos os números de balanceamento. Valores provisórios: ajustar com `npm run sim`.

export const balance = {
  baseStats: { hp: 100, taijutsu: 10, ninjutsu: 10, genjutsu: 10, chakra: 10, speed: 10 },

  // Tipos com ação básica para quem não define `startingTypes` na linhagem (comuns e Uzumaki):
  // taijutsu e ninjutsu do próprio elemento. Genjutsu inicial é só do Uchiha.
  commonStartingTypes: ['taijutsu', 'ninjutsu'] as ('taijutsu' | 'ninjutsu' | 'genjutsu')[],

  origin: {
    // Uma roleta só: a fatia "comum" tem este peso; as linhagens especiais, os pesos de lineages.ts
    // (10 + 10 + 20 + 10 = 50, ou seja, 50% comum).
    commonWeight: 50,
    jinchuurikiChance: 0.1,
  },

  elements: { advantage: 1.5, disadvantage: 0.75, neutral: 1 },

  // Chance base de acerto: base + diferença de speed. Proposta.
  hit: { base: 0.85, perSpeedPoint: 0.01, min: 0.6, max: 0.95 },
  // Genjutsu do atacante vs. genjutsu do defensor.
  genjutsuHit: { base: 0.6, perPoint: 0.02, min: 0.2, max: 0.9 },
  // Genjutsu não causa dano: aprisiona o alvo (perde a vez). Turnos = turnos base da técnica
  // + 1 a cada `pointsPerExtraTurn` de vantagem (poder de genjutsu do atacante − genjutsu do alvo),
  // entre 1 e `maxTurns`. Proposta.
  genjutsuPrison: { pointsPerExtraTurn: 8, maxTurns: 3 },

  // Crítico: 5% + diferencial_de_dano_%, no máximo 50%.
  crit: { baseChance: 0.05, multiplier: 2, max: 0.5 },

  resistance: { offenseDivisor: 2, initialBonus: 1 },

  // Ações básicas de cada tipo. O taijutsu fortalecido não é básico: sai na recompensa "nova técnica".
  basicActions: {
    taijutsu: { baseDamage: 8, chakraCost: 0 },
    empoweredTaijutsu: { baseDamage: 14, chakraCost: 3 },
    ninjutsu: { baseDamage: 10, chakraCost: 3 },
    genjutsu: { baseDamage: 0, chakraCost: 3, debilitateTurns: 1 },
  },

  // "Concentrar chakra": recupera chakra no lugar de atacar.
  rest: { chakraRecovered: 3 },

  // Dōjutsu: ativar gasta o turno e `activationCost`; ativo, custa `upkeep` de chakra no fim de cada
  // rodada e se desliga sozinho depois de `duration` rodadas (contadas a partir da seguinte à ativação)
  // ou quando falta chakra. Pode ser ativado de novo. Proposta.
  dojutsu: {
    duration: 5,
    // Sharingan: evolui com o nível (1, 2 e 3 tomoe). Ativo, soma `statBonus` a tai/nin/gen,
    // `speed`, melhora o genjutsu (acerto e poder de aprisionamento) e tem chance de ler o
    // movimento do vilão (dano recebido × `readDamageFactor`).
    sharingan: {
      activationCost: 4,
      upkeep: 1,
      readDamageFactor: 0.5,
      stages: [
        { minLevel: 1, statBonus: 3, speed: 1, genjutsuHit: 0.1, genjutsuPower: 3, readChance: 0.25 },
        { minLevel: 4, statBonus: 5, speed: 2, genjutsuHit: 0.15, genjutsuPower: 6, readChance: 0.3 },
        { minLevel: 7, statBonus: 7, speed: 3, genjutsuHit: 0.2, genjutsuPower: 9, readChance: 0.35 },
      ],
    },
    // Byakugan: ativo, os golpes de taijutsu não erram, o taijutsu causa ×`taijutsuMult`
    // e libera o golpe inibidor (drena chakra do vilão).
    byakugan: { activationCost: 3, upkeep: 1, taijutsuMult: 1.1 },
  },

  // Portões (prodígio do taijutsu): uma vez por luta. Abrir gasta o turno (não é golpe), custa chakra
  // e HP (nunca abaixo de 1) e dá taijutsu ×`taijutsuMult` por `turns` rodadas, a partir da seguinte.
  // Evoluem com o atributo de taijutsu (o prodígio nasce com 18): abre sempre o maior portão liberado.
  // Quanto maior o portão, maior o custo. Proposta.
  gates: {
    turns: 5,
    stages: [
      { minTaijutsu: 18, taijutsuMult: 1.5, chakraCost: 5, hpCostPct: 0.15 },
      { minTaijutsu: 22, taijutsuMult: 1.75, chakraCost: 7, hpCostPct: 0.2 },
      { minTaijutsu: 26, taijutsuMult: 2, chakraCost: 9, hpCostPct: 0.25 },
    ],
  },

  // Efeitos negativos causados por ataques (valem para jogador e vilões).
  status: {
    // Crítico de ataque elemental de raio: perde a vez.
    paralysis: { turns: 1 },
    // Crítico de ataque elemental de vento, terra ou água: −`hitPenalty` na chance de acerto das
    // próximas `turns` ações do atordoado.
    stun: { turns: 2, hitPenalty: 0.1 },
    // Crítico de ataque elemental de fogo: queima por `turns` rodadas. O n-ésimo tique causa 2^n % do
    // HP máximo do alvo (2, 4, 8, 16...), no máximo `maxPct`. Queimando, cada acerto de fogo prolonga
    // 1 rodada; depois de apagar, a contagem volta ao início e um acerto de fogo comum reacende (1 rodada).
    burn: { turns: 2, extendPerHit: 1, reigniteTurns: 1, maxPct: 0.16 },
    // Envenenamento: tique = `basePct` do HP máximo do alvo + bônus da fonte + 1 a cada tique anterior,
    // no máximo `maxPct` do HP máximo. Não acaba sozinho: depois de cada tique o alvo tem
    // `cureChance` de resistir e se curar (teste favorável a ele). Proposta.
    poison: { basePct: 0.01, growthPerTick: 1, maxPct: 0.3, cureChance: 0.6 },
    // Sangramento: crítico de golpe de espada. Dura a luta; quem sangra toma ×`bladeDamageMult` de lâminas.
    bleed: { bladeDamageMult: 1.5 },
  },

  // Vilão sem chakra para nenhuma técnica concentra chakra no lugar de atacar.
  villainRest: { chakraRecovered: 4 },

  // Proposta anti-trava: após sair de Debilitado, o alvo age ao menos uma vez antes de poder ser debilitado de novo.
  debilitated: { immunityActions: 1 },

  revive: { initialItems: 1 },

  // 1 estágio de status (eventos de treino, jokenpô e recompensas). HP e chakra máximos sobem o mesmo
  // que numa subida de nível (`level.growth` da dificuldade).
  statStage: { taijutsu: 1, ninjutsu: 1, genjutsu: 1, speed: 1 },

  // Upgrade de técnica (pergaminho): dano base extra por nível, por tipo de técnica.
  // No ninjutsu médico, cada nível aumenta a cura; no genjutsu, o poder de aprisionamento.
  techniqueUpgrade: { baseDamagePerLevel: 2, healPctPerLevel: 0.05, genjutsuPowerPerLevel: 3 },

  // Ferramenta ninja: dano base extra em todos os ataques, por nível.
  ninjaTool: { baseDamagePerLevel: 1 },

  // Invocação: passiva, vale em todas as lutas. "Por nível" conta a partir do nível 2.
  summon: {
    // Sapo: dano base extra em todos os ataques.
    toad: { baseDamage: 4, baseDamagePerLevel: 2 },
    // Cobra: um acerto envenena o alvo (se ele ainda não estiver envenenado) com este bônus inicial.
    snake: { poisonBonus: 1, poisonBonusPerLevel: 2 },
    // Lesma: cura uma fração do HP máximo no início de cada rodada.
    slug: { healPct: 0.03, healPctPerLevel: 0.03 },
  },

  // Nível: cada vilão derrotado dá XP (`xp` em villains.ts). Juntando o XP do nível, sobe 1.
  // XP para ir do nível N ao N+1: xpBase + xpGrowth × (N − 1). No teto, o XP deixa de acumular.
  // Cada nível soma HP e chakra máximos conforme a dificuldade e restaura HP e chakra
  // (terminar uma luta não restaura). Chakra nunca sobe menos de 1.
  level: {
    cap: 10,
    xpBase: 100,
    xpGrowth: 25,
    growth: {
      easy: { hp: 10, chakra: 2 },
      normal: { hp: 8, chakra: 1 },
      hard: { hp: 6, chakra: 1 },
      hardcore: { hp: 6, chakra: 1 },
    },
  },

  // Dificuldade: multiplica a força dos vilões (HP, dano base das técnicas e atributos defensivos).
  // O hardcore também troca as passivas dos vilões pelas versões hardcore e só libera depois de
  // vencer uma run no `hardcoreUnlockedBy`.
  difficulty: {
    default: 'normal' as const,
    multipliers: { easy: 0.85, normal: 1, hard: 1.15, hardcore: 1.25 },
    hardcoreUnlockedBy: 'hard' as const,
  },

  events: {
    trainingStages: 1,
    jokenpoWinStages: 2,
    // Akatsuki com quem não é jinchuuriki (e escapou): viu a luta deles e aprendeu a mirar pontos vitais.
    akatsukiCritBonus: 0.05,
    // Akatsuki tirou uma Vontade do Fogo, mas o jogador não tinha nenhuma: começa a próxima luta assim.
    akatsukiNoReviveHpPct: 0.5,
    akatsukiNoReviveChakraPct: 0.5,
  },

  // Recompensas: a "camada" (1 comum, 2 raro, 3 lendário) multiplica a quantidade.
  rewards: {
    stagesPerTier: 1,
    resistancePerTier: 1,
    critBonusPerTier: 0.03,
  },

  exam: {
    // Exceção à regra "só o nível restaura": entre as lutas do exame o jogador volta cheio,
    // senão uma derrota (que deixa 1 de HP) perderia todas as lutas seguintes.
    restoreBetweenFights: true,
    // Índice = vitórias no exame.
    rewardByWins: [
      { tier: 1, spins: 1 },
      { tier: 1, spins: 1 },
      { tier: 2, spins: 2 },
      { tier: 3, spins: 2 },
    ],
  },

  jinchuuriki: {
    chakraBonusPct: 1.0,
    // Manto de chakra: uma vez por luta, abaixo do limiar de HP. Por `turns` rodadas: tai/nin/gen e
    // speed ×`statMult`, regenera `regenPct` do HP máximo por rodada e sofre `recoilPct` do dano que
    // causa (o recoil nunca derruba).
    cloak: { hpThresholdPct: 0.5, statMult: 1.5, regenPct: 0.05, recoilPct: 0.5, turns: 5 },
    // Demônio interno: imune a genjutsu.
    genjutsuImmune: true,
  },

  // Terminar uma etapa não restaura HP nem chakra: quem restaura é a subida de nível.
  campaign: { restoreBetweenStages: false },

  history: { maxRuns: 100 },
};

export type Balance = typeof balance;
