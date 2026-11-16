// Auditoria de balanceamento (docs/balanceamento/benchmark.md): indicadores tirados do estado e do log das lutas, sem
// mudar regra nem gastar o rng. Usada pelos scripts de simulação com `--auditoria`.
import type { JBattle } from '../core/jornada/types';
import type { RBattle } from '../core/roleta/battle';

/** Uma luta: como o lado do jogador entrou, quanto durou, o dano dos dois lados e quem caiu. */
export interface FightAudit {
  /** HP e chakra do protagonista ao entrar (fração do máximo). */
  hpPct: number;
  chakraPct: number;
  /** HP da equipe ao entrar (soma do HP ÷ soma do máximo; no Roleta, igual ao do jogador). */
  teamHpPct: number;
  rounds: number;
  /** Dano no lado inimigo e no lado do jogador (golpes, efeitos por turno, clones). */
  dealt: number;
  taken: number;
  /** Aliados que caíram (não conta quem caiu pelo roteiro). */
  downed: number;
  won: boolean;
}

const frac = (a: number, b: number) => (b > 0 ? a / b : 0);
/** Lado de um lutador da Jornada pelo uid ('a0', 'e1'...). */
const enemyUid = (uid: string) => uid.startsWith('e');

/** Luta da Jornada: `start` é o estado na abertura (antes de alguém agir), `end` o do fim. */
export function auditJornadaFight(start: JBattle, end: JBattle): FightAudit {
  const allies = start.fighters.filter((f) => f.side === 'ally');
  const hero = allies.find((f) => f.protagonist) ?? allies[0];
  let dealt = 0;
  let taken = 0;
  let downed = 0;
  for (const e of end.log) {
    if (e.type === 'damage' || e.type === 'tick' || e.type === 'cloneStrike') {
      if (enemyUid(e.target)) dealt += e.amount;
      else taken += e.amount;
    } else if (e.type === 'down' && !enemyUid(e.target) && !e.scripted) downed++;
  }
  return {
    hpPct: hero ? frac(hero.hp, hero.maxHp) : 0,
    chakraPct: hero ? frac(hero.chakra, hero.maxChakra) : 0,
    teamHpPct: frac(
      allies.reduce((a, f) => a + f.hp, 0),
      allies.reduce((a, f) => a + f.maxHp, 0),
    ),
    rounds: end.round,
    dealt,
    taken,
    downed,
    won: end.status === 'won',
  };
}

/** Luta do Roleta: `start` é o estado depois da iniciativa, `end` o do fim. */
export function auditRoletaFight(start: RBattle, end: RBattle): FightAudit {
  let dealt = 0;
  let taken = 0;
  for (const e of end.log) {
    if (e.type !== 'damage') continue;
    if (e.side === 'villain') dealt += e.amount;
    else taken += e.amount;
  }
  const hpPct = frac(start.player.hp, start.player.maxHp);
  return {
    hpPct,
    chakraPct: frac(start.player.chakra, start.player.maxChakra),
    teamHpPct: hpPct,
    rounds: end.round,
    dealt,
    taken,
    downed: 0,
    won: end.status === 'won',
  };
}

export type RelicCategory = 'ofensiva' | 'defensiva' | 'economia' | 'sinergia' | 'utilidade';

const CATEGORY_KEYS: Record<RelicCategory, string[]> = {
  sinergia: ['startClones', 'extraClones', 'cloneCounter', 'maxClonesBonus', 'damagePerClone', 'cloneShield', 'teamMods', 'allyHpPct', 'rollWeights', 'summon'],
  economia: ['ryoMult', 'shopDiscount', 'freeRefresh', 'ryo', 'xpMult', 'talentPoints'],
  ofensiva: ['damageMult', 'typeDamageMult', 'techDamageMult', 'critBonus', 'accuracyBonus', 'taijutsuFlat', 'lowHpDamageMult', 'stunnedDamageMult', 'effectChanceBonus', 'openingDamage', 'flatDamage', 'onKillChakra'],
  defensiva: ['hp', 'evasion', 'dodgeBonus', 'startShieldPct', 'surviveOnce', 'regenHp', 'regenPct', 'afterWin', 'reviveHpBonus', 'resistance', 'startOverPct', 'guardHeal', 'willOfFire', 'revives'],
  utilidade: ['chakra', 'chakraDiscount', 'startChakra', 'startChakraPct', 'restBonus', 'items', 'bagBonus', 'kitBonusPct', 'speed', 'healMult'],
};

/** Todas as chaves de um efeito, descendo nos objetos (`mods`, `grant`, `stats`...). */
function keysOf(o: unknown, out: string[] = []): string[] {
  if (!o || typeof o !== 'object') return out;
  for (const [k, v] of Object.entries(o)) {
    out.push(k);
    if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'typeDamageMult' && k !== 'techDamageMult' && k !== 'items') keysOf(v, out);
  }
  return out;
}

/**
 * Categoria de uma relíquia para a auditoria (ofensiva, defensiva, economia, sinergia, utilidade), pelos campos do
 * efeito. Vence a que tem mais campos; no empate, a ordem acima. É um instrumento de leitura, não regra do jogo.
 */
export function relicCategory(effect: object): RelicCategory {
  const keys = keysOf(effect);
  let best: RelicCategory = 'utilidade';
  let score = 0;
  for (const cat of Object.keys(CATEGORY_KEYS) as RelicCategory[]) {
    const n = keys.filter((k) => CATEGORY_KEYS[cat].includes(k)).length;
    if (n > score) [best, score] = [cat, n];
  }
  return best;
}

/** Soma de amostras por chave, para tirar médias e totais nos relatórios. */
export class Tally {
  private sums = new Map<string, number>();
  private counts = new Map<string, number>();

  add(key: string, value: number): void {
    this.sums.set(key, (this.sums.get(key) ?? 0) + value);
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  /** Soma as médias de cada campo numérico da luta, com o prefixo dado ("e1:hpPct"...). */
  addFight(prefix: string, f: FightAudit): void {
    this.add(`${prefix}hpPct`, f.hpPct);
    this.add(`${prefix}chakraPct`, f.chakraPct);
    this.add(`${prefix}teamHpPct`, f.teamHpPct);
    this.add(`${prefix}rounds`, f.rounds);
    this.add(`${prefix}dealtPerRound`, frac(f.dealt, f.rounds));
    this.add(`${prefix}takenPerRound`, frac(f.taken, f.rounds));
    this.add(`${prefix}downed`, f.downed);
  }

  mean(key: string): number {
    return frac(this.sums.get(key) ?? 0, this.counts.get(key) ?? 0);
  }

  sum(key: string): number {
    return this.sums.get(key) ?? 0;
  }

  count(key: string): number {
    return this.counts.get(key) ?? 0;
  }
}
