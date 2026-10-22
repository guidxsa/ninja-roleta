// Todos os números de balanceamento. Valores provisórios: ajustar com `npm run sim`.

export const balance = {
  baseStats: { hp: 100, taijutsu: 10, ninjutsu: 10, genjutsu: 10, chakra: 10, speed: 10 },

  // Tipos com ação básica para quem não define `startingTypes` na linhagem (comuns e Uzumaki):
  // taijutsu e ninjutsu do próprio elemento. Genjutsu inicial é só do Uchiha.
  commonStartingTypes: ['taijutsu', 'ninjutsu'] as ('taijutsu' | 'ninjutsu' | 'genjutsu')[],

  origin: {
    specialLineageChance: 0.2,
    jinchuurikiChance: 0.1,
  },

  elements: { advantage: 1.5, disadvantage: 0.75, neutral: 1 },

  // Decisão em aberto no CLAUDE.md: chance base de acerto. Proposta: base + diferença de speed.
  hit: { base: 0.85, perSpeedPoint: 0.01, min: 0.6, max: 0.95 },
  // Genjutsu do atacante vs. genjutsu do defensor.
  genjutsuHit: { base: 0.6, perPoint: 0.02, min: 0.2, max: 0.9 },
  // Genjutsu não causa dano: aprisiona o alvo (perde a vez). Turnos = turnos base da técnica
  // + 1 a cada `pointsPerExtraTurn` de vantagem (poder de genjutsu do atacante − genjutsu do alvo),
  // entre 1 e `maxTurns`. Proposta.
  genjutsuPrison: { pointsPerExtraTurn: 8, maxTurns: 3 },

  crit: { baseChance: 0.05, multiplier: 2 },

  resistance: { offenseDivisor: 2, initialBonus: 1 },

  // Ações básicas de cada tipo. O taijutsu básico não gasta chakra; o fortalecido gasta chakra
  // para bater mais forte (exceção à regra "taijutsu não gasta chakra").
  basicActions: {
    taijutsu: { baseDamage: 8, chakraCost: 0 },
    empoweredTaijutsu: { baseDamage: 14, chakraCost: 3 },
    ninjutsu: { baseDamage: 10, chakraCost: 3 },
    genjutsu: { baseDamage: 0, chakraCost: 3, debilitateTurns: 1 },
  },

  // "Concentrar chakra": recupera chakra no lugar de atacar.
  rest: { chakraRecovered: 3 },

  // Dōjutsu: ativar gasta o turno e `activationCost`; ativo, custa `upkeep` de chakra no fim de cada
  // rodada e se desliga sozinho quando falta chakra. Proposta.
  dojutsu: {
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
    // Byakugan: ativo, os golpes (taijutsu e ninjutsu) não erram, o taijutsu causa ×`taijutsuMult`
    // e libera o golpe inibidor (drena chakra do vilão).
    byakugan: { activationCost: 3, upkeep: 1, taijutsuMult: 1.1 },
  },

  // Vilão sem chakra para nenhuma técnica concentra chakra no lugar de atacar.
  villainRest: { chakraRecovered: 4 },

  // Proposta anti-trava: após sair de Debilitado, o alvo age ao menos uma vez antes de poder ser debilitado de novo.
  debilitated: { immunityActions: 1 },

  revive: { initialItems: 1 },

  // 1 estágio de status (eventos de treino, jokenpô e recompensas). Proposta.
  statStage: { taijutsu: 1, ninjutsu: 1, genjutsu: 1, speed: 1, hp: 5, chakra: 2 },

  // Upgrade de técnica (pergaminho): dano base extra por nível, por tipo de técnica.
  // No ninjutsu médico, cada nível aumenta a cura; no genjutsu, o poder de aprisionamento.
  techniqueUpgrade: { baseDamagePerLevel: 2, healPctPerLevel: 0.05, genjutsuPowerPerLevel: 3 },

  // Ferramenta ninja: dano base extra em todos os ataques, por nível.
  ninjaTool: { baseDamagePerLevel: 1 },

  // Invocação: passiva, vale em todas as lutas. "Por nível" conta a partir do nível 2.
  summon: {
    // Sapo: dano base extra em todos os ataques.
    toad: { baseDamage: 3, baseDamagePerLevel: 2 },
    // Cobra: ao acertar um alvo sem veneno, aplica veneno. No fim de cada rodada o veneno causa
    // o seu valor em dano e cai 1; em 0, some (5 → 5+4+3+2+1 = 15 de dano por aplicação).
    snake: { poison: 5, poisonPerLevel: 2 },
    // Lesma: cura uma fração do HP máximo no início de cada rodada.
    slug: { healPct: 0.04, healPctPerLevel: 0.02 },
  },

  // Nível: cada vilão derrotado dá XP (`xp` em villains.ts). Juntando o XP do nível, sobe 1.
  // XP para ir do nível N ao N+1: xpBase + xpGrowth × (N − 1). No teto, o XP deixa de acumular.
  // HP e chakra máximos sobem sempre; depois a roleta de nível sorteia um status para um bônus
  // extra (pesos em events.ts). Subir de nível restaura HP e chakra (terminar uma luta não restaura).
  // XP 100/25 (era 100/20): pequeno nerf, ~11% mais XP até o nível 10. O 1º nível segue em 100
  // para o Mizuki ainda dar nível antes do Zabuza.
  level: {
    cap: 10,
    xpBase: 100,
    xpGrowth: 25,
    hpPerLevel: 12,
    chakraPerLevel: 2,
    statGains: { taijutsu: 3, ninjutsu: 3, genjutsu: 3, speed: 1, hp: 15, chakra: 4, resistance: 1 },
  },

  // Dificuldade: multiplica a força dos vilões (HP, dano base das técnicas e atributos defensivos).
  // Speed, chakra e XP não mudam.
  difficulty: {
    default: 'normal' as const,
    multipliers: { easy: 0.75, normal: 1, hard: 1.5 },
  },

  events: {
    trainingStages: 1,
    jokenpoWinStages: 2,
    // Akatsuki com quem não é jinchuuriki: viu a luta deles de longe e aprendeu a mirar pontos vitais.
    akatsukiCritBonus: 0.05,
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
    surge: {
      hpThresholdPct: 0.3,
      controlChance: 0.6,
      turns: 3,
      control: { damageMult: 1.5, healPct: 0.25 },
      frenzy: { damageMult: 2, hpLossPctPerTurn: 0.1 },
    },
  },

  // Terminar uma etapa não restaura HP nem chakra: quem restaura é a subida de nível.
  campaign: { restoreBetweenStages: false },

  history: { maxRuns: 100 },
};

export type Balance = typeof balance;
