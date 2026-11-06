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
  rest: { chakraPct: 0.25 },
  chakraRegen: { pct: 0.05, min: 1 },
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
    youthCrit: 0.05,
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
    gates: { turns: 3, taijutsuMult: 1.3, hpCostPct: 0.2 },
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
  // Run (docs/roleta/run.md): raridade da recompensa por categoria (1 comum, 2 rara, 3 lendária; o chefe abre o baú),
  // força dos vilões por ciclo (× 1 + perCycle × ciclo, contando do 0; rascunho) e relíquias.
  run: { rewardTier: { genin: 1, chunin: 1, jounin: 2, boss: 0 } as Record<string, number>, bossChoices: 3 },
  infinite: { perCycle: 0.3 },
  // Fatia "Relíquia" da recompensa: classificação pela raridade (comum → comum, rara → incomum, lendária → rara).
  relicTierByReward: { 1: 'common', 2: 'uncommon', 3: 'rare' } as Record<number, 'common' | 'uncommon' | 'rare'>,
  // Consumíveis na luta.
  items: { soldierPillPct: 0.5, medKitHealPct: 0.15, explosiveTagDamage: 15 },
};

export type RoletaBalance = typeof roletaBalance;
