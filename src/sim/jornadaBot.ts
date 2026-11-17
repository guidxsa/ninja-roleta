// Bot do protagonista na simulação da Jornada (fase 2b, docs/balanceamento/benchmark.md). Só joga: não muda regra nem
// número. Três partes: o plano de talentos (um ramo até o final, a junção do vizinho e as combinações), a ação da luta
// por valor esperado (dano, controle, chakra, Defender só com limiar) e o uso dos itens. Os suportes e os inimigos
// seguem a IA do jogo (src/core/jornada/ai.ts).
import type { Rng } from '../core/rng';
import { chooseAiAction, chooseAiActive, expectedDamage } from '../core/jornada/ai';
import {
  accuracyAgainst,
  alive,
  blockedReason,
  canRaise,
  downed,
  fearImmune,
  hasEffect,
  hitDamage,
  hitsOf,
  hpCost,
  opponentSide,
  techniqueCost,
  validTargets,
} from '../core/jornada/battle';
import type { JornadaData } from '../core/jornada/data';
import { comboBranches, talentMaxRank, talentRank, talentRankCost, talentState, canBuyTalent, type TalentContext, type TalentNode } from '../core/jornada/talents';
import type { ConsumableId, Fighter, JAction, JBattle, JEffect, JFreeAction, JTechnique } from '../core/jornada/types';

// ---------------------------------------------------------------------------
// Talentos: plano de build

/**
 * Ramos preferidos de cada árvore, do melhor para o pior (medidos com `--ramos`, este bot, Médio e Difícil; ver
 * docs/registro.md). Ramo fora da lista (árvore nova) entra depois, na ordem dos dados.
 */
export const BRANCH_PREFS: Record<string, string[]> = {
  naruto: ['kyuubi', 'pranks', 'rasengan', 'toads', 'bonds', 'clones'],
  commonNinja: ['leafStyle', 'team', 'element', 'will', 'clones', 'tools'],
  prodigy: ['drunken', 'training', 'gates', 'mentor', 'rivalry', 'youth'],
  uchihaNinja: ['illusions', 'fire', 'pride', 'police', 'weapons', 'sharingan'],
  hyuugaNinja: ['trigrams', 'gentleFist', 'branchHouse', 'mainHouse', 'rotation', 'byakugan'],
};

/** Um passo do plano: aprender o nó, ou subir um nível dele (`rank`). */
export interface PlanStep {
  id: string;
  rank?: boolean;
}

export interface BuildPlan {
  /** Ramo principal (vai até o final) e o vizinho (até a junção, as combinações e depois o resto). */
  primary: string;
  secondary: string | null;
  steps: PlanStep[];
}

const isCombo = (n: TalentNode) => Boolean(n.requiresAll?.length);

/** Bônus que viram dano direto na hora de escolher um lado da bifurcação. */
const DAMAGE_MODS = ['damageMult', 'typeDamageMult', 'techDamageMult', 'critBonus', 'taijutsuFlat', 'typePen', 'techExtraHits', 'taijutsuExtraHits'];

/** Nota de um nó na bifurcação: técnica de dano nova e bônus de dano primeiro; depois qualquer bônus. */
function forkScore(n: TalentNode, data: JornadaData): number {
  const tech = n.learn ? data.techniques[n.learn] : undefined;
  let score = tech ? (tech.baseDamage > 0 || tech.roll ? 4 : 2) : n.learnByElement ? 4 : 0;
  for (const k of Object.keys(n.mods ?? {})) score += DAMAGE_MODS.includes(k) ? 2 : 1;
  score += Object.keys(n.teamMods ?? {}).length * 1.5 + (n.allyHpPct ? 1 : 0) + (n.maxRank ? 1 : 0);
  return score;
}

/** Caminho de um ramo (sem as combinações), um nó por linha: na bifurcação, o já aprendido ou o de maior nota. */
function branchPath(owner: string, branch: string, nodes: readonly TalentNode[], ctx: TalentContext, data: JornadaData): TalentNode[] {
  const list = nodes.filter((n) => n.owner === owner && n.branch === branch && !isCombo(n) && talentState(n, nodes, ctx) !== 'hidden');
  const tiers = [...new Set(list.map((n) => n.tier))].sort((a, b) => a - b);
  const out: TalentNode[] = [];
  for (const tier of tiers) {
    const opts = list.filter((n) => n.tier === tier);
    const owned = opts.find((n) => ctx.owned.includes(n.id));
    const open = opts.filter((n) => !['excluded', 'accountLocked'].includes(talentState(n, nodes, ctx)));
    const pick = owned ?? [...open].sort((a, b) => forkScore(b, data) - forkScore(a, data))[0];
    if (pick) out.push(pick);
  }
  return out;
}

/** O ramo dá para seguir: tem caminho e a raiz não está fechada (escolha exclusiva com outro ramo, conquista). */
function viable(path: TalentNode[], nodes: readonly TalentNode[], ctx: TalentContext): boolean {
  const root = path[0];
  return Boolean(root) && !['excluded', 'accountLocked', 'hidden'].includes(talentState(root!, nodes, ctx));
}

const prefRank = (owner: string, branch: string, all: string[]) => {
  const i = (BRANCH_PREFS[owner] ?? []).indexOf(branch);
  return i >= 0 ? i : 100 + all.indexOf(branch);
};

/**
 * Plano de build: o ramo principal até o talento final; o vizinho (que tem combinação com ele) até a junção; as
 * combinações dos dois; os níveis a mais do principal; o resto do vizinho e os níveis dele. `focus` força os ramos
 * (`--ramos`); sem ele, os de `BRANCH_PREFS`.
 */
export function planBuild(owner: string, nodes: readonly TalentNode[], ctx: TalentContext, data: JornadaData, focus: string[] = []): BuildPlan | null {
  const mine = nodes.filter((n) => n.owner === owner);
  const branches = [...new Set(mine.map((n) => n.branch))];
  const byPref = [...branches].sort((a, b) => prefRank(owner, a, branches) - prefRank(owner, b, branches));
  const path = (b: string) => branchPath(owner, b, nodes, ctx, data);
  // Foco de outra árvore (o Comum sem elemento vira prodígio): vale o plano preferido.
  focus = focus.filter((b) => branches.includes(b));
  const primary = focus[0] ?? byPref.find((b) => viable(path(b), nodes, ctx));
  if (!primary) return null;
  const main = path(primary);
  // Vizinhos: ramos ligados ao principal por uma combinação, sem raiz exclusiva com o caminho dele.
  const combos = mine.filter(isCombo);
  const partners = new Set(combos.map((n) => comboBranches(n, nodes)).filter((bs) => bs.includes(primary)).flatMap((bs) => bs.filter((b) => b !== primary)));
  const blocked = (b: string) => path(b).some((n) => n.excludes?.some((id) => main.some((m) => m.id === id)));
  const secondary = focus[1] ?? byPref.find((b) => partners.has(b) && !blocked(b) && viable(path(b), nodes, ctx)) ?? null;
  const steps: PlanStep[] = main.map((n) => ({ id: n.id }));
  const ranks = (list: TalentNode[]) => list.filter((n) => talentMaxRank(n) > 1).map((n) => ({ id: n.id, rank: true }));
  if (secondary) {
    const side = path(secondary);
    const pair = combos.filter((n) => comboBranches(n, nodes).every((b) => b === primary || b === secondary));
    // Junção do vizinho: o nó mais fundo dele que alguma combinação do par pede.
    const needed = pair.flatMap((n) => n.requiresAll!).map((id) => side.find((s) => s.id === id)?.tier ?? 0);
    const junction = Math.max(0, ...needed);
    steps.push(...side.filter((n) => n.tier <= junction).map((n) => ({ id: n.id })));
    steps.push(...pair.map((n) => ({ id: n.id })));
    steps.push(...ranks(main));
    steps.push(...side.filter((n) => n.tier > junction).map((n) => ({ id: n.id })));
    steps.push(...ranks([...side, ...pair]));
  } else steps.push(...ranks(main));
  return { primary, secondary, steps };
}

/**
 * Próximo talento a comprar pelo plano. 'wait': o próximo passo do plano só espera ponto (guarda). null: nada a
 * comprar. Passo preso ao estágio, à história ou à bifurcação pula para o seguinte; com o plano esgotado, o mais
 * barato que der.
 */
export function nextTalent(owner: string, nodes: readonly TalentNode[], ctx: TalentContext, plan: BuildPlan | null): string | 'wait' | null {
  for (const step of plan?.steps ?? []) {
    const n = nodes.find((x) => x.id === step.id);
    if (!n) continue;
    const st = talentState(n, nodes, ctx);
    if (step.rank) {
      if (!ctx.owned.includes(n.id) || talentRank(n, ctx) >= talentMaxRank(n)) continue;
      return ctx.points >= talentRankCost(n) ? n.id : 'wait';
    }
    if (st === 'available') return n.id;
    if (st === 'noPoints') return 'wait';
  }
  const cheapest = nodes
    .filter((n) => n.owner === owner && canBuyTalent(n, nodes, ctx))
    .sort((a, b) => a.cost - b.cost || a.tier - b.tier)[0];
  return cheapest?.id ?? null;
}

// ---------------------------------------------------------------------------
// Luta: estimativas

/** Turnos que um inimigo derrubado deixaria de bater (o valor de derrubar). */
const KILL_TURNS = 2;
/** Peso do chakra: com o chakra cheio vale ~0 (o Hyuuga entrava nas lutas com 97–99% sem gastar). */
const CHAKRA_WEIGHT = 0.5;
/** Defender para proteger: só com um aliado abaixo desta fração do HP (o "Defender sempre" do J4 piorou o bot). */
export const PROTECT_BELOW = 0.3;
/** Defender para curar (Colete acolchoado, talentos): só com o próprio HP abaixo desta fração. */
export const GUARD_HEAL_BELOW = 0.45;

const usableTech = (f: Fighter, t: JTechnique | undefined, ignoreChakra: boolean): t is JTechnique => {
  if (!t || t.active || t.gates) return false;
  const why = blockedReason(f, t);
  return !why || (ignoreChakra && why === 'chakra');
};

/** Dano esperado por turno de um inimigo no alvo (o melhor golpe dele); `taiOnly`: com o chakra bloqueado. */
function foeHitOn(s: JBattle, e: Fighter, target: Fighter, data: JornadaData, taiOnly = false): number {
  let best = 0;
  for (const id of e.techniques) {
    const t = data.techniques[id];
    if (!t || t.active || t.baseDamage <= 0 || (taiOnly && t.type !== 'taijutsu') || ((e.cooldowns[id] ?? 0) > 0) || e.chakra < techniqueCost(e, t)) continue;
    best = Math.max(best, expectedDamage(s, e, target, t, data) / (t.target === 'allEnemies' ? Math.max(1, alive(s, target.side).length) : 1));
  }
  return best;
}

/** Ameaça de um inimigo: o dano esperado por turno na equipe (área conta todos). */
function foeDps(s: JBattle, e: Fighter, data: JornadaData, taiOnly = false): number {
  const team = alive(s, opponentSide(e.side));
  if (!team.length) return 0;
  const per = team.map((x) => foeHitOn(s, e, x, data, taiOnly));
  return Math.max(...per);
}

/** Dano esperado que o lutador leva na próxima rodada (cada inimigo escolhe um alvo da equipe ao acaso). */
function incoming(s: JBattle, x: Fighter, data: JornadaData): number {
  const n = Math.max(1, alive(s, x.side).length);
  return alive(s, opponentSide(x.side)).reduce((a, e) => a + (hasEffect(e, 'stun') ? 0 : foeHitOn(s, e, x, data) / n), 0);
}

/** Melhor dano esperado do protagonista no alvo agora (para o valor de amplificar o dano num alvo controlado). */
function heroHit(s: JBattle, f: Fighter, t: Fighter, data: JornadaData): number {
  let best = 0;
  for (const id of f.techniques) {
    const tech = data.techniques[id];
    if (!usableTech(f, tech, false) || tech.baseDamage <= 0) continue;
    best = Math.max(best, expectedDamage(s, f, t, tech, data));
  }
  return best;
}

/** Chance de cada efeito sair da técnica no alvo (o da técnica e os dos talentos e relíquias por golpe). */
function effectOdds(f: Fighter, t: Fighter, tech: JTechnique, hits: number): Partial<Record<JEffect, number>> {
  const odds: Partial<Record<JEffect, number>> = {};
  const add = (e: JEffect, p: number, n: number) => {
    if (p <= 0) return;
    const q = 1 - (1 - Math.min(1, p)) ** n;
    odds[e] = 1 - (1 - (odds[e] ?? 0)) * (1 - q);
  };
  if (tech.onHit) add(tech.onHit.effect, tech.onHit.chance + f.mods.effectChanceBonus, tech.baseDamage > 0 ? hits : 1);
  if (tech.baseDamage > 0) {
    if (tech.type === 'genjutsu') add('stun', f.mods.genjutsuStunChance, hits);
    if (tech.type === 'taijutsu') add('chakraBlock', f.mods.taiChakraBlockChance, hits);
    add('fear', f.mods.fearOnHit, hits);
    const dry = f.mods.techStunNoChakra[tech.id] ?? 0;
    if (dry && t.maxChakra > 0 && t.chakra <= 0) add('stun', dry, 1);
  }
  return odds;
}

/** Multiplicador de dano do protagonista contra o alvo com este controle (Linha de sombra, talentos). */
function controlBonus(f: Fighter, e: JEffect): number {
  const m = f.mods;
  let mult = m.controlledDamageMult;
  if (e === 'stun') mult *= m.stunnedDamageMult * (m.stunnedAlwaysCrit ? 1.3 : 1);
  if (e === 'chakraBlock') mult *= m.chakraBlockedDamageMult * (m.blockedAlwaysCrit ? 1.3 : 1);
  return mult;
}

/**
 * Valor dos efeitos no alvo, na escala do dano: controle vale o dano que o alvo deixa de dar pelos turnos (o mais
 * perigoso vale mais) mais o dano a mais do protagonista nele (Linha de sombra e talentos de controle); queimar e
 * veneno valem o dano por turno.
 */
function effectValue(s: JBattle, f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData): number {
  const odds = effectOdds(f, t, tech, tech.baseDamage > 0 ? hitsOf(f, tech) : 1);
  const fx = data.base.effects;
  let value = 0;
  for (const [e, p] of Object.entries(odds) as [JEffect, number][]) {
    if (!p || hasEffect(t, e)) continue;
    const turns = (e === 'burn' || e === 'poison' ? fx[e].turns : Math.max(fx.minControlTurns, fx[e as 'stun'].turns)) + f.mods.effectTurnsBonus;
    let v = 0;
    if (e === 'stun') v = hasEffect(t, 'stunGuard') ? 0 : foeDps(s, t, data) * turns;
    else if (e === 'fear') v = fearImmune(t, data) ? 0 : foeDps(s, t, data) * turns * (1 - fx.fear.damageMult);
    else if (e === 'chakraBlock') v = Math.max(0, foeDps(s, t, data) - foeDps(s, t, data, true)) * turns;
    else if (e === 'burn' || e === 'poison') v = t.maxHp * fx[e].pct * turns * (e === 'burn' ? Math.max(1, f.mods.burnMult) : 1);
    if (v > 0 || e === 'stun' || e === 'fear' || e === 'chakraBlock') {
      const amp = controlBonus(f, e) - 1;
      if (amp > 0 && !(e === 'stun' && hasEffect(t, 'stunGuard')) && !(e === 'fear' && fearImmune(t, data))) v += amp * heroHit(s, f, t, data) * Math.min(turns, 2);
    }
    value += v * p;
  }
  return value;
}

/** Valor de um golpe num alvo: o HP que de fato tira, a ameaça que sai de campo se derruba e os efeitos. */
function hitValue(s: JBattle, f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData): { value: number; kills: boolean } {
  const acc = accuracyAgainst(f, t, tech, data);
  if (tech.baseDamage <= 0) return { value: effectValue(s, f, t, tech, data) * acc, kills: false };
  const raw = hitDamage(f, t, tech, data) * hitsOf(f, tech);
  const kills = raw >= t.hp + t.shield;
  // Vitória por HP (sino do Kakashi, aguentar): o alvo da condição vale mais.
  const w = s.win;
  const goal = (w.kind === 'hpThreshold' || w.kind === 'survive') && t.defId === w.target ? 1.5 : 1;
  const dealt = Math.min(raw, t.hp + t.shield) * goal + (kills ? foeDps(s, t, data) * KILL_TURNS : 0);
  return { value: dealt * acc + (kills ? 0 : effectValue(s, f, t, tech, data) * acc), kills };
}

/** Clones de pé valem os golpes que seguram e o dano a mais por clone. */
function cloneValue(s: JBattle, f: Fighter, tech: JTechnique, data: JornadaData): number {
  const max = data.j.combat.maxClones + f.mods.maxClonesBonus;
  const add = Math.min(max - f.clones, (tech.clones ?? 0) + f.mods.extraClones);
  if (add <= 0) return 0;
  const kind = data.base.clones.kinds[tech.cloneKind ?? 'kage'];
  const block = incoming(s, f, data) * (kind?.blockChance ?? 0.5) * (f.clones === 0 ? 1 : 0.5);
  const perClone = f.mods.damagePerClone * heroBestAny(s, f, data) * 2;
  return block * Math.min(add, 2) + perClone * add;
}

/** Melhor dano esperado do protagonista em qualquer inimigo. */
function heroBestAny(s: JBattle, f: Fighter, data: JornadaData): number {
  return Math.max(0, ...alive(s, opponentSide(f.side)).map((t) => heroHit(s, f, t, data)));
}

/** Escudo vale o que ele deve segurar nas próximas duas rodadas (e o que devolve, com a Defesa absoluta). */
function shieldValue(s: JBattle, giver: Fighter, x: Fighter, tech: JTechnique, data: JornadaData): number {
  if (tech.barrier ? x.barrier : x.shield > 0) return 0;
  const amount = Math.floor(giver.maxHp * (tech.shieldPct ?? 0));
  const held = Math.min(amount, incoming(s, x, data) * 2);
  return held * (x.hp < x.maxHp * 0.5 ? 1 : 0.6) * (1 + giver.mods.shieldReflectPct * 0.5);
}

/** Peso de cada ponto de chakra: zero com o chakra cheio, sobe quando falta (Contas de meditação barateiam). */
function chakraWeight(f: Fighter, data: JornadaData): number {
  const r = f.chakra / Math.max(1, f.maxChakra);
  const rest = data.j.combat.restChakra;
  return CHAKRA_WEIGHT * (1 - r) ** 1.5 * (rest / (rest + f.mods.restBonus));
}

export interface Option {
  action: JAction;
  value: number;
  kills: boolean;
  /** Chakra que a ação custa (para saber se dá agora). */
  chakra: number;
}

/** Ações de técnica do protagonista e o valor líquido de cada uma. `ignoreChakra`: como seria com chakra de sobra. */
export function techOptions(s: JBattle, f: Fighter, data: JornadaData, ignoreChakra = false): Option[] {
  const out: Option[] = [];
  const foes = alive(s, opponentSide(f.side));
  const friends = alive(s, f.side);
  const weight = chakraWeight(f, data);
  for (const id of f.techniques) {
    const tech = data.techniques[id];
    if (!usableTech(f, tech, ignoreChakra)) continue;
    const chakra = techniqueCost(f, tech);
    const hpPaid = hpCost(f, tech);
    const cost = chakra * weight + hpPaid * (f.hp < f.maxHp * 0.5 ? 1 : 0.5) + (tech.cooldown ?? 0) * 0.5;
    const push = (target: Fighter, value: number, kills = false) => {
      if (value > 0) out.push({ action: { kind: 'tech', techId: tech.id, target: target.uid }, value: value - cost, kills, chakra });
    };
    const variants = tech.roll?.map((v) => ({ tech: data.techniques[v.tech]!, w: Math.max(0, v.weight + (f.mods.rollWeights[v.tech] ?? 0)) })).filter((v) => v.tech && v.w > 0);
    const single = (t: Fighter, x: JTechnique) => (x.target === 'allEnemies' ? foes.reduce((a, y) => a + hitValue(s, f, y, x, data).value, 0) : hitValue(s, f, t, x, data).value);
    if (variants?.length) {
      const total = variants.reduce((a, v) => a + v.w, 0);
      for (const t of tech.target === 'allEnemies' ? foes.slice(0, 1) : validTargets(s, f, tech)) {
        push(t, variants.reduce((a, v) => a + (v.tech.target === 'self' ? cloneValue(s, f, v.tech, data) : single(t, v.tech)) * v.w, 0) / total);
      }
      continue;
    }
    if (tech.target === 'enemy' || tech.target === 'allEnemies') {
      if (tech.baseDamage <= 0 && !tech.onHit) continue;
      if (tech.target === 'allEnemies') {
        const each = foes.map((t) => hitValue(s, f, t, tech, data));
        if (foes[0]) push(foes[0], each.reduce((a, x) => a + x.value, 0), each.some((x) => x.kills));
      } else
        for (const t of foes) {
          const { value, kills } = hitValue(s, f, t, tech, data);
          push(t, value, kills);
        }
    } else if (tech.target === 'self') {
      let v = 0;
      if (tech.shieldPct) v += shieldValue(s, f, f, tech, data);
      if (tech.clones) v += cloneValue(s, f, tech, data);
      if (tech.healHp) v += Math.min(tech.healHp, f.maxHp - f.hp) * (f.hp < f.maxHp * 0.4 ? 1.2 : 0.4);
      push(f, v);
    } else if (tech.target === 'ally') {
      for (const x of friends) {
        let v = 0;
        if (tech.healHp) v += Math.min(Math.floor(tech.healHp * f.mods.healMult), x.maxHp - x.hp) * (x.hp < x.maxHp * 0.4 ? 1.5 : 0.5);
        if (tech.shieldPct) v += shieldValue(s, f, x, tech, data);
        if (tech.cleanse && (hasEffect(x, 'stun') || hasEffect(x, 'chakraBlock') || hasEffect(x, 'fear'))) v += foeDps(s, x, data) * 2;
        push(x, v);
      }
    }
  }
  return out.sort((a, b) => b.value - a.value);
}

/** Valor de Defender: a cura (Colete acolchoado, talentos), o dano que a resistência inteira segura e a proteção (Guarda-costas). */
export function guardValue(s: JBattle, f: Fighter, data: JornadaData): number {
  const m = f.mods;
  const heal = m.guardHeal + Math.floor(f.maxHp * m.guardHealPct);
  const lowHp = f.hp < f.maxHp * GUARD_HEAL_BELOW;
  // Proteção: o aliado mais ferido (que não é ele) abaixo do limiar recebe os golpes de alvo único no lugar.
  const team = alive(s, f.side);
  const hurt = [...team].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const protect = m.guardProtect && hurt && hurt.uid !== f.uid && hurt.hp < hurt.maxHp * PROTECT_BELOW;
  if (!protect && !(heal > 0 && lowHp)) return 0;
  const guarded = { ...f, guarding: true };
  const mitigated = Math.max(0, incoming(s, f, data) - incoming({ ...s, fighters: s.fighters.map((x) => (x.uid === f.uid ? guarded : x)) }, guarded, data));
  let value = mitigated + (lowHp ? Math.min(heal, f.maxHp - f.hp) : 0);
  if (protect) {
    const onAlly = incoming(s, hurt!, data);
    // Aliado que um golpe derrubaria: vale também o dano que ele ainda daria na luta.
    const lethal = alive(s, opponentSide(f.side)).some((e) => foeHitOn(s, e, hurt!, data) >= hurt!.hp);
    const saved = lethal ? foeDps(s, hurt!, data) * KILL_TURNS : 0;
    value += onAlly + saved - incoming({ ...s, fighters: s.fighters.map((x) => (x.uid === f.uid ? guarded : x)) }, guarded, data) * 0.5;
  }
  return value;
}

/** Concentrar compensa: a melhor ação com chakra vale mais que duas da melhor de agora e o descanso paga ela. */
function restPays(f: Fighter, now: Option | undefined, ideal: Option | undefined, data: JornadaData): boolean {
  if (!ideal || ideal.chakra <= f.chakra) return false;
  if (now?.kills) return false;
  const gain = Math.min(f.maxChakra - f.chakra, data.j.combat.restChakra + f.mods.restBonus);
  if (f.chakra + gain < ideal.chakra) return false;
  return ideal.value > 2 * Math.max(0, now?.value ?? 0);
}

/**
 * Ação de turno do protagonista: finalizador e levantar quem caiu como a IA do jogo; depois a de maior valor entre
 * as técnicas, Defender (só com limiar) e Concentrar.
 */
export function heroAction(s: JBattle, f: Fighter, data: JornadaData, rng: Rng): JAction {
  const foes = alive(s, opponentSide(f.side));
  const w = s.win;
  if (w.kind === 'finisher') {
    const target = foes.find((x) => x.defId === w.target);
    const fin = data.techniques[w.technique];
    if (target && target.hp <= target.maxHp * 0.3 && f.techniques.includes(w.technique)) {
      if (usableTech(f, fin, false)) return { kind: 'tech', techId: w.technique, target: target.uid };
      if (!f.cooldowns[w.technique]) return { kind: 'rest' };
    }
  }
  const opts = techOptions(s, f, data);
  const best = opts[0];
  const fallen = downed(s, f.side);
  if (fallen.length && !(best?.kills && foes.length === 1)) {
    const target = fallen[0]!;
    const revive = f.techniques.map((id) => data.techniques[id]).find((t): t is JTechnique => usableTech(f, t, false) && Boolean(t.reviveHpPct));
    if (revive) return { kind: 'tech', techId: revive.id, target: target.uid };
    if (canRaise(s, f).includes(target) && f.hp >= f.maxHp * 0.4) return { kind: 'raise', target: target.uid };
  }
  const guard = guardValue(s, f, data);
  if (guard > 0 && guard > (best?.value ?? 0) && !best?.kills) return { kind: 'guard' };
  if (restPays(f, best, techOptions(s, f, data, true)[0], data)) return { kind: 'rest' };
  if (best && best.value > 0) return best.action;
  return chooseAiAction(s, f, data, rng);
}

/**
 * Ativa grátis: a da IA do jogo (escudo ferido, Portões, fortalecimento, clones do zero); sem ela, refaz clones com o
 * chakra sobrando ou com bônus de clone (Pergaminho dos mil).
 */
export function heroFree(s: JBattle, f: Fighter, data: JornadaData, rng: Rng): JFreeAction | null {
  const core = chooseAiActive(s, f, data, rng);
  if (core || s.activeUsed) return core;
  const clones = f.techniques.map((id) => data.techniques[id]).find((t): t is JTechnique => Boolean(t?.active && t.clones && t.target === 'self' && !blockedReason(f, t)));
  if (!clones) return null;
  const max = data.j.combat.maxClones + f.mods.maxClonesBonus;
  const bonus = f.mods.maxClonesBonus > 0 || f.mods.damagePerClone > 0;
  const spare = f.chakra - techniqueCost(f, clones) >= f.maxChakra * 0.5;
  if (f.clones < max && (bonus || (f.clones < 2 && spare)) && cloneValue(s, f, clones, data) > techniqueCost(f, clones) * chakraWeight(f, data)) {
    return { kind: 'active', techId: clones.id, target: f.uid };
  }
  return null;
}

/** Bolsa que o bot olha (a da run). */
export type Bag = Record<ConsumableId, number>;

/**
 * Item do turno (não gasta a vez, um por turno): reanimar quem caiu; kit de HP no protagonista abaixo de 35% (ou num
 * aliado quase caindo, com kit sobrando); kit de chakra quando falta chakra para a melhor técnica.
 */
export function heroItem(s: JBattle, f: Fighter, bag: Bag, data: JornadaData): { item: ConsumableId; target: string } | null {
  if (s.itemUsed) return null;
  const fallen = downed(s, 'ally');
  if (fallen.length && bag.reviveKit > 0) return { item: 'reviveKit', target: (fallen.find((x) => x.protagonist) ?? fallen[0]!).uid };
  if (f.hp < f.maxHp * 0.35 && bag.hpKit > 0) return { item: 'hpKit', target: f.uid };
  const dying = alive(s, 'ally').find((x) => x.uid !== f.uid && x.hp < x.maxHp * 0.25 && incoming(s, x, data) >= x.hp);
  if (dying && bag.hpKit > 1) return { item: 'hpKit', target: dying.uid };
  if (bag.chakraKit > 0) {
    const kit = Math.floor(data.j.combat.chakraKit * (1 + f.mods.kitBonusPct));
    const now = techOptions(s, f, data)[0];
    const ideal = techOptions(s, f, data, true)[0];
    const short = ideal && ideal.chakra > f.chakra && f.chakra + kit >= ideal.chakra && ideal.value > Math.max(0, now?.value ?? 0) * 1.2;
    const dry = f.chakra < f.maxChakra * 0.15 && f.techniques.some((id) => usableTech(f, data.techniques[id], true) && techniqueCost(f, data.techniques[id]!) > f.chakra);
    if (short || dry) return { item: 'chakraKit', target: f.uid };
  }
  return null;
}
