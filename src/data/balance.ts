// Todos os números de balanceamento. Valores provisórios: ajustar com `npm run sim`.

export const balance = {
  baseStats: { hp: 100, taijutsu: 10, ninjutsu: 10, genjutsu: 10, chakra: 10, speed: 10 },

  origin: {
    specialLineageChance: 0.1,
    jinchuurikiChance: 0.05,
  },

  elements: { advantage: 1.5, disadvantage: 0.75, neutral: 1 },

  // Decisão em aberto no CLAUDE.md: chance base de acerto. Proposta: base + diferença de speed.
  hit: { base: 0.85, perSpeedPoint: 0.01, min: 0.6, max: 0.95 },
  // Genjutsu do atacante vs. genjutsu do defensor.
  genjutsuHit: { base: 0.6, perPoint: 0.02, min: 0.2, max: 0.9 },

  crit: { baseChance: 0.05, multiplier: 2 },

  resistance: { offenseDivisor: 2, initialBonus: 1 },

  // Ações básicas: usadas quando o jogador não tem técnica daquele tipo.
  basicActions: {
    taijutsu: { baseDamage: 8, chakraCost: 1 },
    ninjutsu: { baseDamage: 10, chakraCost: 3 },
    genjutsu: { baseDamage: 4, chakraCost: 3, debilitateTurns: 1 },
  },

  // Proposta: sem chakra o jogador ficaria sem ação nenhuma, então existe "concentrar chakra".
  rest: { chakraRecovered: 3 },

  // Proposta anti-trava: após sair de Debilitado, o alvo age ao menos uma vez antes de poder ser debilitado de novo.
  debilitated: { immunityActions: 1 },

  revive: { initialItems: 1 },

  // 1 estágio de status (eventos de treino, jokenpô e recompensas). Proposta.
  statStage: { taijutsu: 1, ninjutsu: 1, genjutsu: 1, speed: 1, hp: 5, chakra: 2 },

  // Upgrade de técnica (pergaminho): dano base extra por nível, por tipo de técnica.
  techniqueUpgrade: { baseDamagePerLevel: 2 },

  // Ferramenta ninja: dano base extra em todos os ataques, por nível.
  ninjaTool: { baseDamagePerLevel: 1 },

  // Invocação: uma vez por luta. Sempre funciona (não rola acerto).
  summon: {
    chakraCost: 5,
    toad: { baseDamage: 18, baseDamagePerLevel: 6 },
    snake: { baseDamage: 6, baseDamagePerLevel: 3, debilitateTurns: 1 },
    slug: { healPct: 0.3, healPctPerLevel: 0.1 },
  },

  events: {
    trainingStages: 1,
    jokenpoWinStages: 2,
    // Akatsuki com jinchuuriki sem item de retorno: começa a próxima luta assim.
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
    surge: {
      hpThresholdPct: 0.3,
      controlChance: 0.6,
      turns: 3,
      control: { damageMult: 1.5, healPct: 0.25 },
      frenzy: { damageMult: 2, hpLossPctPerTurn: 0.1 },
    },
  },

  campaign: { restoreBetweenStages: true },

  history: { maxRuns: 100 },
};

export type Balance = typeof balance;
