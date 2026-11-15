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
  // Efeitos: os mesmos da Jornada, em `balance.effects` (v0.77.0).
  // Kits completos do clássico (v0.80.0): passivas, ativas e despertar usam os números da base (`balance.passives`,
  // `awakening`, `dojutsu`, `gates`, `expansion`, `effort`, `beast`, `drunkenFist`, `pills`, `seal`, `copy`,
  // `vitalForce`, `jinchuuriki`). Aqui fica só o que o Roleta adapta, e os kits enxutos das linhagens guardadas.
  passives: {
    // Yamanaka (guardado): −acerto do vilão.
    mindReadingAccuracy: 0.1,
  },
  kits: {
    // Fera de quatro patas: a isca da Substituição (que não existe no Roleta) vira esquiva a mais.
    beast: { dodge: 0.1 },
    // Linhagens guardadas (fora do sorteio): os kits enxutos de antes.
    shadow: { chance: 0.8, uses: 2 },
    mindTransfer: { chance: 0.75, uses: 1 },
    plague: { turns: 3, uses: 1 },
  },
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
