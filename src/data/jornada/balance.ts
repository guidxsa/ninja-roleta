// Números do modo Jornada (docs/jornada/). Valores provisórios: ajustar com `npm run sim:jornada`.
// Acerto, crítico e dificuldade vêm do `balance` do jogo (base); aqui fica só o que é da Jornada.

export const jornadaBalance = {
  combat: {
    // Ordem da rodada: speed × (1 ± variação). Pequena: a sorte pesa menos (docs/jornada/combate.md#ordem).
    orderVariance: 0.15,
    // Fração da resistência usada normalmente e em postura defensiva.
    resistanceFraction: 0.5,
    guardFraction: 1,
    // Elemento da técnica contra o elemento do alvo.
    elementAdvantage: 1.25,
    elementDisadvantage: 0.8,
    // Chance de um clone receber o golpe no lugar de quem tem clones (o clone some).
    cloneBlockChance: 0.5,
    maxClones: 5,
    // Queimar e veneno tiram esta fração do HP máximo no começo do turno de quem sofre.
    burnPct: 0.05,
    poisonPct: 0.06,
    defaultEffectTurns: 2,
    // Levantar um aliado (ação de turno ou kit): volta com esta fração do HP máximo.
    reviveHpPct: 0.5,
    // Concentrar chakra: recupera esta fração do chakra máximo.
    restChakraPct: 0.25,
    // Kits: fração do máximo.
    hpKitPct: 0.35,
    chakraKitPct: 0.4,
    // Vontade do Fogo (só no Fácil e por relíquia): levanta o protagonista com esta fração do HP.
    willOfFireHpPct: 0.5,
  },

  // Entre lutas (docs/jornada/run.md).
  run: {
    // Aliado que caiu na luta volta para a próxima com esta fração do HP.
    downedAllyReturnPct: 0.3,
    restHealPct: 0.4,
    bagLimit: 5,
    startConsumables: { hpKit: 1, chakraKit: 1 } as Record<string, number>,
    // Vontades do Fogo por dificuldade (só o Fácil tem).
    willOfFire: { easy: 1, normal: 0, hard: 0, hardcore: 0 } as Record<string, number>,
  },

  // Recompensa por tipo de luta (docs/jornada/progressao.md).
  rewards: {
    fight: { ryo: 15, talent: 0, xp: 40 },
    elite: { ryo: 35, talent: 1, xp: 80 },
    story: { ryo: 25, talent: 1, xp: 70 },
    boss: { ryo: 50, talent: 1, xp: 120 },
  },

  // XP para o próximo nível: base + porNível × (nível − 1). Cada nível dá 1 ponto de talento.
  xp: { base: 100, perLevel: 40, talentPerLevel: 1 },

  // Relíquias por raridade (docs/jornada/reliquias.md).
  relics: {
    treasureWeights: { common: 40, rare: 50, legendary: 10 },
    shopWeights: { common: 60, rare: 35, legendary: 5 },
    price: { common: 40, rare: 80, legendary: 150 },
    bossChoices: 3,
  },

  // Minijogos dos eventos (docs/jornada/run.md#minijogos).
  minigames: { memoryPairs: 6, memoryMaxMisses: 5, sealLength: 5, sealPool: 8 },

  shop: {
    relics: 3,
    consumablePrice: { hpKit: 20, chakraKit: 20, reviveKit: 35 } as Record<string, number>,
    trainingPrice: 60,
    treatmentPrice: 30,
    treatmentHealPct: 0.5,
  },
};

export type JornadaBalance = typeof jornadaBalance;
