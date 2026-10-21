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
