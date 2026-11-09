import type { Difficulty } from '../../core/difficulty';
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
    maxClones: 5,
    // Queimar e veneno tiram esta fração do HP máximo no começo do turno de quem sofre.
    burnPct: 0.05,
    poisonPct: 0.06,
    defaultEffectTurns: 2,
    // Pílula de reanimação: volta com esta fração do HP máximo. As técnicas de reanimar têm a própria (`reviveHpPct`).
    reviveHpPct: 0.5,
    // Regen em valor fixo (v0.49.0): não cresce com o HP e o chakra máximos, para não virar muleta no fim da run.
    // Concentrar chakra: recupera este valor.
    restChakra: 8,
    // Kits: valor curado.
    hpKit: 35,
    chakraKit: 12,
    // Vontade do Fogo (só no Fácil e por relíquia): levanta o protagonista com esta fração do HP.
    willOfFireHpPct: 0.5,
  },

  // Portões do prodígio (docs/jornada/combate.md#portões). Números brutos de cada portão; o portão N soma do 1º ao N.
  // Uma troca por turno (abrir, subir, descer ou fechar), sem gastar a vez. Abrir ou subir custa
  // `activationPerLevel` de chakra por portão aberto a mais; descer é grátis. Aberto, paga no fim de cada turno a
  // manutenção comum (src/core/gates.ts) × (1 + `upkeepLevelStep` × (nível − 1)); sem chakra para ela, fecha
  // sozinho. Sem limite de turnos e sem custo de HP (v0.59.0). Fechou: espera `cooldown` turnos. Começa com o 1º.
  gates: {
    activationPerLevel: 3,
    upkeepLevelStep: 0.25,
    cooldown: 3,
    levels: [
      { damageMult: 1.15 }, // Abertura
      { damageMult: 1.1 }, // Descanso
      { damageMult: 1.1, accuracy: 0.1 }, // Vida
      { damageMult: 1.1 }, // Dor
      { damageMult: 1.1, critBonus: 0.05 }, // Limite
    ] as GateLevel[],
  },

  // Entre lutas (docs/jornada/run.md).
  run: {
    // Aliado que caiu na luta volta para a próxima com esta fração do HP.
    downedAllyReturnPct: 0.3,
    restHeal: { hp: 40, chakra: 12 },
    // Recuperação de HP e chakra de cada membro da equipe depois de cada vitória, pela dificuldade (configuração da run).
    // Relíquias como o Cupom do Ichiraku somam a ela.
    afterWinRecovery: {
      easy: { hp: 35, chakra: 10 },
      normal: { hp: 25, chakra: 8 },
      hard: { hp: 20, chakra: 6 },
      hardcore: { hp: 15, chakra: 5 },
    } as Record<string, { hp: number; chakra: number }>,
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
    // A loja tem 1 vaga fixa de relíquia de loja; as outras saem destes pesos.
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
    weights: { fight: 53, unknown: 22, elite: 12, rest: 8 },
    // Desconhecido: o que ele vira ao entrar.
    unknown: { event: 55, fight: 35, treasure: 10 },
  },
  // Sorteio do elemento no Caminho Ninja: peso de cada elemento e de nenhum (Comum sem elemento = prodígio).
  // Quem prefere sortear o elemento do Comum (em vez de escolher) ganha uma relíquia destes pesos no começo.
  elementDraw: { element: 16, none: 20, randomBonus: { common: 1 } as Record<string, number> },

  // Árvore completa (docs/jornada/talentos.md#árvore-completa): com nada mais a aprender ou subir, cada ponto de
  // talento ganho vira ryō na hora (metade do Treino do mercador). O ryō convertido não passa pelo multiplicador.
  talentTree: { completeRyoPerPoint: 30 },

  // Modo infinito do Caminho Ninja, só no Hardcore (docs/jornada/run.md#modo-infinito): os inimigos ficam × dificuldade
  // × enemyCycleMult ^ ciclo, com o ciclo contando do 0. Rascunho: a simulação decide e o usuário ajusta.
  infinite: { enemyCycleMult: 1.5, difficulty: 'hardcore' as Difficulty },

  // Força dos inimigos da Jornada por dificuldade (própria: o Roleta usa a dele). Multiplica HP, ataques e resistências.
  // Calibrada com o bot na v0.51.0 (docs/registro.md); antes de a Jornada ter a própria, o dano contava o fator duas vezes.
  enemyStrength: { easy: 0.98, normal: 1.2, hard: 1.36, hardcore: 1.36 } as Record<Difficulty, number>,

  // Minijogos dos eventos (docs/jornada/run.md#minijogos).
  minigames: { memoryPairs: 6, memoryMaxMisses: 5, sealLength: 5, sealPool: 8 },

  // Loja sempre aberta (docs/jornada/run.md#loja): preço × (1 + compras × perPurchase + estágios passados × perStage).
  shop: {
    relics: 3,
    perPurchase: 0.1,
    perStage: 0.25,
    consumablePrice: { hpKit: 20, chakraKit: 20, reviveKit: 35 } as Record<string, number>,
    trainingPrice: 60,
    treatmentPrice: 30,
    treatmentHeal: { hp: 50, chakra: 15 },
    // Teto do desconto somado (relíquias + Tazuna).
    maxDiscount: 0.4,
  },
};

export type JornadaBalance = typeof jornadaBalance;
