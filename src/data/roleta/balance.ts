import type { RActive } from './kits';

// Números do Roleta enxuto (docs/roleta/combate.md). Valores provisórios: ajustar com `npm run sim`.
// Acerto, crítico, dano, dificuldade, níveis, eventos e recompensas vêm do `balance` da base.

export const roletaBalance = {
  // Defesa automática: fração da resistência usada sem fazer nada e ao Defender (até o próximo turno).
  resistance: { passive: 0.4, guard: 1 },
  // Esquiva (antiga Substituição): base + (speed de quem defende − speed de quem ataca) × perSpeed, entre 0 e max.
  // Sai da chance de acerto de quem ataca (a roleta continua uma só).
  dodge: { base: 0.05, perSpeed: 0.02, max: 0.3 },
  // Concentrar: recupera esta fração do chakra máximo. Regeneração silenciosa no começo de cada rodada.
  // Economia de chakra (v0.59.0, proposta): técnicas custam o dobro, a regeneração caiu de 5% para 3% e Concentrar subiu
  // de 25% para 30%, para técnica ser escolha a cada 2 ou 3 rodadas e não toda rodada. O vilão segue com o ritmo antigo
  // (`villainChakra`), para a mudança não mexer na força dele.
  rest: { chakraPct: 0.3 },
  chakraRegen: { pct: 0.03, min: 1 },
  villainChakra: { restPct: 0.25, regenPct: 0.05 },
  // Os 4 efeitos, com duração fixa (turnos de quem sofre). Queimar e Veneno: fração do HP máximo por turno.
  // Medo: dano × damageMult e acerto + accuracy.
  effects: {
    burn: { turns: 2, pct: 0.05 },
    poison: { turns: 3, pct: 0.04 },
    stun: { turns: 1 },
    fear: { turns: 2, damageMult: 0.75, accuracy: -0.15 },
  },
  // Passivas das linhagens (kits enxutos).
  passives: {
    heavyBodyMult: 1.15,
    mindReadingAccuracy: 0.1,
    duoChance: 0.25,
    dogDamagePct: 0.4,
    preciseFistPen: 0.3,
    vitalityPct: 0.02,
    vitalForce: { belowPct: 0.3, regenPct: 0.04, turns: 3 },
  },
  // Ativas: usos por luta e efeito (turnos contando o da ativação).
  kits: {
    uses: { effort: 1, shadow: 2, expansion: 1, mindTransfer: 1, plague: 1, beast: 1, gates: 1, sharingan: 1, byakugan: 1, seal: 1 } as Record<RActive, number>,
    effort: { turns: 3, offense: 3 },
    shadow: { chance: 0.8 },
    expansion: { turns: 3, taijutsuMult: 1.3, physical: 3 },
    mindTransfer: { chance: 0.75 },
    plague: { turns: 3 },
    beast: { turns: 3, speed: 3, dogChance: 0.6 },
    // Portões (src/core/gates.ts): abrir custa `activation` de chakra; manter custa a manutenção comum a cada rodada,
    // sem limite de rodadas (fecham sozinhos sem chakra); podem reabrir. Sem custo de HP (v0.59.0).
    gates: { activation: 4, taijutsuMult: 1.3 },
    sharingan: { turns: 3, accuracy: 0.15, dodge: 0.1, offense: 3 },
    byakugan: { turns: 3 },
  },
  // Manto do jinchuuriki: abaixo de belowPct do HP, 1 vez por luta, ataques × offenseMult por `turns` rodadas.
  cloak: { belowPct: 0.5, offenseMult: 1.5, turns: 3 },
  // Kekkei genkai Areia: começa a luta com escudo desta fração do HP máximo.
  sandShieldPct: 0.1,
  // Invocações (passivas): sapo (dano verdadeiro em % do HP máximo do vilão por ataque que acerta), lesma (cura por rodada).
  summons: { toadPct: 0.06, toadPerLevel: 0.02, slugPct: 0.03, slugPerLevel: 0.01 },
  // Vilões: Insano (Orochimaru) sem limite nos dados (hardcore) volta no máximo esta quantidade de vezes.
  // `insaneRevivesCap`: teto de volta do Orochimaru no Roleta em qualquer dificuldade (o ciclo é curto).
  villains: { insaneMaxRevives: 3, insaneRevivesCap: 1 },
  // Run (docs/roleta/run.md): relíquias do baú do chefe.
  run: { bossChoices: 3 },
  // Sem relíquia para sortear na roleta pós-luta: XP em fração do custo do nível atual (acompanha o nível).
  rewards: { xpPct: [0.5, 1, 1.5] },
  // Linhagens que saíram do sorteio do Roleta (v0.52.0): funcionam melhor como suporte e ficam guardadas para a Jornada.
  // As conquistas delas viram clássicas e os dados seguem em `gameData`.
  retiredLineages: ['nara', 'yamanaka', 'aburame'] as readonly string[],
  // Modo infinito (só no Hardcore): força por ciclo e o piso do ciclo novo, que parte dos status do último chefe
  // (cada status do vilão ≥ o do chefe × floor da categoria; proposta, v0.59.0).
  infinite: { perCycle: 0.3, floor: { genin: 1.05, chunin: 1.1, jounin: 1.18, boss: 1.28 } as Record<string, number> },
  // Toda luta começa com HP e chakra cheios (v0.59.0): força dos vilões por categoria (× HP e ataques). Calibrado pela
  // simulação (`npm run sim:origens`): sem a roleta de recompensa o jogador cresce menos, e o Médio só volta a ~65% com o
  // chefe a ×0,9. Proposta para o usuário.
  villainPower: { genin: 1, chunin: 1, jounin: 1, boss: 0.9 } as Record<string, number>,
  // Roleta de relíquia depois da luta (fora o chefe): pesos da raridade por categoria; cada ciclo do infinito passa
  // `cycleShift` pontos de Comum para Rara (proposta, v0.59.0).
  relicReward: {
    weights: {
      genin: { common: 70, uncommon: 25, rare: 5 },
      chunin: { common: 45, uncommon: 40, rare: 15 },
      jounin: { common: 20, uncommon: 45, rare: 35 },
    } as Record<string, { common: number; uncommon: number; rare: number }>,
    cycleShift: 10,
  },
  // Consumíveis na luta.
  items: { soldierPillPct: 0.5, medKitHealPct: 0.15, explosiveTagDamage: 15 },
};

export type RoletaBalance = typeof roletaBalance;
