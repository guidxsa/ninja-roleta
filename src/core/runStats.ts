import type { BattleEvent, BattleState } from './combat';
import type { ProgressEffect } from './progression';

/**
 * Estatísticas de uma run, para as conquistas e o Livro Bingo. Acumuladas pela UI a cada luta
 * (`summarizeFight` + `addFight`) e a cada evento (`addPreEvent`, `addJokenpo`, `addEffect`).
 */

/** Resumo de uma luta, lido do log. */
export interface FightSummary {
  villainId: string;
  exam: boolean;
  won: boolean;
  /** Dano que o jogador sofreu (golpes, disputas, queimadura, veneno, autoferimento). */
  damageTaken: number;
  /** HP no fim ÷ HP máximo. */
  hpPctEnd: number;
  /** Maior golpe do jogador e maior crítico dele. */
  bestHit: number;
  bestCrit: number;
  /** Maior golpe que o jogador levou. */
  worstHit: number;
  /** Vezes que o vilão se feriu possuído (Yamanaka). */
  villainSelfHits: number;
  copies: number;
  itemsUsed: number;
  revivesUsed: number;
  /** Maior portão aberto na luta (0 = nenhum). */
  maxGate: number;
  redPill: boolean;
  /** O último dano do jogador foi o Devorar (Aburame). */
  devourFinish: boolean;
  /** O jogador desfez o manto de chakra do vilão (reservado para a Madeira). */
  cloakSuppressed: boolean;
}

export interface RunStats {
  fights: FightSummary[];
  /** Eventos pré-vilão sorteados, por id. */
  preEvents: Record<string, number>;
  jokenpo: { win: number; draw: number; loss: number };
  guruCharlatan: number;
  akatsukiTookRevive: number;
  /** Nível mais alto da invocação. */
  summonLevel: number;
  /** Técnicas aprendidas pelo guru (ids de premium). */
  premiums: string[];
}

export function emptyRunStats(): RunStats {
  return { fights: [], preEvents: {}, jokenpo: { win: 0, draw: 0, loss: 0 }, guruCharlatan: 0, akatsukiTookRevive: 0, summonLevel: 0, premiums: [] };
}

/** Dano que um evento causa ao jogador (0 se não causa). */
function damageToPlayer(e: BattleEvent): number {
  switch (e.type) {
    case 'attack':
      return e.side === 'villain' ? e.damage : 0;
    case 'clashHit':
    case 'burnTick':
    case 'poisonTick':
      return e.target === 'player' ? e.damage : 0;
    case 'possessed':
      return e.side === 'player' ? e.damage : 0;
    case 'confusionFail':
      return e.side === 'player' ? e.selfHit : 0;
    default:
      return 0;
  }
}

/** Dano que o jogador causa num evento, e de que tipo (para saber o golpe final). */
function damageByPlayer(e: BattleEvent): number {
  switch (e.type) {
    case 'attack':
      return e.side === 'player' ? e.damage : 0;
    case 'clashHit':
      return e.target === 'villain' ? e.damage : 0;
    case 'devour':
    case 'strangle':
    case 'toad':
      return e.damage;
    case 'possessed':
      return e.side === 'villain' ? e.damage : 0;
    default:
      return 0;
  }
}

export function summarizeFight(villainId: string, exam: boolean, battle: BattleState): FightSummary {
  const s: FightSummary = {
    villainId,
    exam,
    won: battle.status === 'won',
    damageTaken: 0,
    hpPctEnd: battle.player.maxHp > 0 ? battle.player.hp / battle.player.maxHp : 0,
    bestHit: 0,
    bestCrit: 0,
    worstHit: 0,
    villainSelfHits: 0,
    copies: 0,
    itemsUsed: 0,
    revivesUsed: 0,
    maxGate: 0,
    redPill: false,
    devourFinish: false,
    cloakSuppressed: false,
  };
  let lastPlayerDamage: BattleEvent['type'] | null = null;
  for (const e of battle.log) {
    const taken = damageToPlayer(e);
    s.damageTaken += taken;
    if (e.type === 'attack' || e.type === 'clashHit') s.worstHit = Math.max(s.worstHit, taken);
    const dealt = damageByPlayer(e);
    if (dealt > 0) {
      lastPlayerDamage = e.type;
      s.bestHit = Math.max(s.bestHit, dealt);
      if (e.type === 'attack' && e.outcome === 'crit') s.bestCrit = Math.max(s.bestCrit, dealt);
    }
    if (e.type === 'possessed' && e.side === 'villain') s.villainSelfHits++;
    if (e.type === 'copy' && e.success) s.copies++;
    if (e.type === 'item') s.itemsUsed++;
    if (e.type === 'revive') s.revivesUsed++;
    if (e.type === 'gates') s.maxGate = Math.max(s.maxGate, e.stage);
    if (e.type === 'pill' && e.pill === 'red') s.redPill = true;
  }
  s.devourFinish = s.won && lastPlayerDamage === 'devour';
  return s;
}

export function addFight(stats: RunStats, fight: FightSummary): RunStats {
  return { ...stats, fights: [...stats.fights, fight] };
}

export function addPreEvent(stats: RunStats, id: string): RunStats {
  return { ...stats, preEvents: { ...stats.preEvents, [id]: (stats.preEvents[id] ?? 0) + 1 } };
}

export function addJokenpo(stats: RunStats, result: 'win' | 'draw' | 'loss'): RunStats {
  return { ...stats, jokenpo: { ...stats.jokenpo, [result]: stats.jokenpo[result] + 1 } };
}

/** Efeitos de evento que as conquistas contam. */
export function addEffect(stats: RunStats, e: ProgressEffect): RunStats {
  switch (e.kind) {
    case 'guruCharlatan':
      return { ...stats, guruCharlatan: stats.guruCharlatan + 1 };
    case 'akatsukiTookRevive':
      return { ...stats, akatsukiTookRevive: stats.akatsukiTookRevive + 1 };
    case 'summonLearned':
      return { ...stats, summonLevel: Math.max(stats.summonLevel, 1) };
    case 'summonLevel':
      return { ...stats, summonLevel: Math.max(stats.summonLevel, e.level) };
    case 'guruPremium':
      return stats.premiums.includes(e.premium) ? stats : { ...stats, premiums: [...stats.premiums, e.premium] };
    default:
      return stats;
  }
}
