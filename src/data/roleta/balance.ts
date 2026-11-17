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
  // Passivas automáticas (v0.92.0, decisoes.md item 40, aprovado pelo usuário; números de partida para a simulação):
  // o que as ativas faziam acontece sozinho, sem custo de chakra e sem botão.
  auto: {
    // Comum: Esforço na 1ª rodada; no nível 7 dura mais e volta uma vez abaixo de 50% do HP.
    effort: { turns: 4, lv7Turns: 5, lv7AgainBelowPct: 0.5, bonus: 5, lv7Bonus: 7 },
    // Akimichi: Expansão na 1ª vez abaixo de 60% do HP (até o fim da luta); Pílula do clã no nível 7 abaixo de 25%.
    expansion: { belowPct: 0.6 },
    clanPill: { level: 7, belowPct: 0.25, taijutsuMult: 1.5 },
    // Inuzuka: Fera nas primeiras rodadas; chance de o cão bater junto (com a Fera e, no nível 7, depois dela).
    beast: { turns: 1, lv7Turns: 2 },
    duo: { chance: 0.18, beastChance: 0.3, lv7Chance: 0.25 },
    // Prodígio: o portão aberto é o maior cujo limiar de HP (fração do máximo) e nível foram alcançados; custo de HP por
    // rodada por portão aberto, nunca abaixo de 1.
    gates: { thresholds: [0.6, 0.45, 0.3, 0.15], levels: [1, 1, 4, 7], hpPctPerGate: 0.01 },
    // Uchiha: o Sharingan aceso a luta inteira dá esta fração do bônus de ataque do estágio.
    sharingan: { statMult: 0.5 },
    // Uchiha: chance de copiar a técnica de dano que o acertou, pelo estágio do Sharingan (1, 2, 3 tomoe).
    copy: { chances: [0.15, 0.2, 0.3] },
    // Hyuuga: o Byakugan aceso a luta inteira não dá o ×1,1 do taijutsu (só o acerto garantido).
    byakugan: { taijutsuMult: 1 },
    // Hyuuga: Rotação no golpe que tiraria esta fração do HP máximo ou mais: corta pela metade e devolve o que cortou.
    rotation: { level: 4, uses: 1, lv7Uses: 2, minDamagePct: 0.2, cutPct: 0.5 },
    // Uzumaki: Selamento na 1ª rodada, na técnica de mais dano do vilão.
    seal: { turns: 2, lv7Turns: 3 },
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
  // Força dos vilões por dificuldade só no Roleta (v0.92.0, × HP e ataques, por cima de `balance.difficulty`), calibrada
  // pela simulação para a curva bater a meta 90/65/40/15 (decisoes.md). Com a base (0,9 / 1,1 / 1,25 / 1,25), o total
  // fica ~1,17 / 1,32 / 1,40 / 1,53: o Hardcore ganha um degrau próprio acima do Difícil.
  difficultyPower: { easy: 1.3, normal: 1.2, hard: 1.12, hardcore: 1.22 } as Record<string, number>,
  // Forma da categoria por cima da força (v0.81.0, R2 aprovado pelo usuário): o chefe com 15% menos HP e 10% mais
  // ataque, para a luta ficar mais curta e mais perigosa (antes durava ~13 rodadas no Médio).
  villainShape: { boss: { hp: 0.85, offense: 1.1 } } as Record<string, { hp: number; offense: number }>,
  // Bolsa no começo da run (v0.81.0, R4 aprovado pelo usuário).
  startBag: { medKit: 1, soldierPill: 1 },
  // Roleta de relíquia depois da luta (fora o chefe), v0.92.0 (aprovado pelo usuário): só 2 raridades vizinhas por
  // categoria. Cada ciclo do infinito passa `cycleShift` pontos da mais baixa para a mais alta das duas, sem abrir uma
  // terceira.
  relicReward: {
    weights: {
      genin: { common: 75, uncommon: 25, rare: 0 },
      chunin: { common: 0, uncommon: 65, rare: 35 },
      jounin: { common: 0, uncommon: 35, rare: 65 },
    } as Record<string, { common: number; uncommon: number; rare: number }>,
    cycleShift: 10,
  },
  // Eventos pré-luta que viraram força de combate (v0.92.0): a Velhinha agradecida dá uma relíquia desta raridade (sem
  // nenhuma para dar, XP como a roleta de relíquia); o Ramen do Ichiraku dá +1 estágio em `ramenStats` status sorteados.
  events: { oldLadyTier: 'common' as const, ramenStats: 2 },
  // Consumíveis na luta.
  items: { soldierPillPct: 0.5, medKitHealPct: 0.15, explosiveTagDamage: 15 },
};

export type RoletaBalance = typeof roletaBalance;
