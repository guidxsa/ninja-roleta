import type { GateLevel } from '../../core/jornada/types';

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
    // Quantas vezes por luta os suportes levantam o protagonista. Evita laço de cair e levantar sem o jogador agir.
    supportRevivesPerFight: 3,
    // Concentrar chakra: recupera esta fração do chakra máximo.
    restChakraPct: 0.25,
    // Kits: fração do máximo.
    hpKitPct: 0.35,
    chakraKitPct: 0.4,
    // Vontade do Fogo (só no Fácil e por relíquia): levanta o protagonista com esta fração do HP.
    willOfFireHpPct: 0.5,
  },

  // Portões do prodígio (docs/jornada/combate.md#portões). Números brutos de cada portão; o portão N soma do 1º ao N.
  // Uma troca por turno (abrir, subir, descer ou fechar); aberto, dura no máximo `maxTurns` turnos contando o da
  // abertura, e trocar não renova. Sem custo na abertura: desgaste no fim de cada turno aberto (nunca derruba).
  // Fechou (à mão ou pelo tempo): espera `cooldown` turnos para abrir de novo. Começa com o 1º liberado.
  gates: {
    maxTurns: 4,
    cooldown: 3,
    levels: [
      { damageMult: 1.15, drainPct: 0.02 }, // Abertura
      { damageMult: 1.1, drainPct: 0.01 }, // Descanso
      { damageMult: 1.1, accuracy: 0.1, drainPct: 0.01 }, // Vida
      { damageMult: 1.1, drainPct: 0.02 }, // Dor
      { damageMult: 1.1, critBonus: 0.05, drainPct: 0.02 }, // Limite
    ] as GateLevel[],
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

  // Relíquias por classificação (docs/jornada/reliquias.md).
  relics: {
    // Elite vencida deixa uma relíquia com estas chances.
    eliteWeights: { common: 50, uncommon: 33, rare: 17 },
    treasureWeights: { common: 40, uncommon: 35, rare: 25 },
    // O mercador tem 1 vaga fixa de relíquia de loja; as outras saem destes pesos.
    shopWeights: { common: 50, uncommon: 33, rare: 17 },
    price: { common: 40, uncommon: 60, rare: 90, shop: 70 } as Record<string, number>,
    bossChoices: 3,
    // Chance de uma das opções do chefe ser a evolução da relíquia inicial.
    starterEvolveChance: 0.5,
  },

  // Mapa ramificado do Caminho Ninja (docs/jornada/run.md#mapa-ramificado). 12 linhas: começo, 10 do meio, chefe.
  map: {
    rows: 12,
    cols: 4,
    treasureRow: 6,
    eliteFromRow: 2,
    // Linhas do começo com lutas leves ('easyFights').
    easyRows: 3,
    restFromRow: 3,
    weights: { fight: 45, unknown: 22, elite: 12, shop: 8, rest: 8 },
    // Desconhecido: o que ele vira ao entrar.
    unknown: { event: 50, fight: 30, shop: 10, treasure: 10 },
  },
  // Sorteio do elemento no Caminho Ninja: peso de cada elemento e de nenhum (Comum sem elemento = prodígio).
  elementDraw: { element: 16, none: 20 },

  // Minijogos dos eventos (docs/jornada/run.md#minijogos).
  minigames: { memoryPairs: 6, memoryMaxMisses: 5, sealLength: 5, sealPool: 8 },

  shop: {
    relics: 3,
    consumablePrice: { hpKit: 20, chakraKit: 20, reviveKit: 35 } as Record<string, number>,
    trainingPrice: 60,
    treatmentPrice: 30,
    treatmentHealPct: 0.5,
    // Teto do desconto somado (relíquias + Tazuna).
    maxDiscount: 0.4,
  },
};

export type JornadaBalance = typeof jornadaBalance;
