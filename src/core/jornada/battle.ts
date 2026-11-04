// Combate de equipe da Jornada (docs/jornada/combate.md). Funções puras: estado entra, estado sai.
// Até 3 × 3. O jogador decide só o turno do protagonista; os outros lutadores usam a IA (ai.ts).
import { damage } from '../damage';
import { elementMultiplier } from '../elements';
import { critChance, hitChance } from '../hit';
import { clamp, type Rng } from '../rng';
import type { AttackType } from '../types';
import { chooseAiAction, chooseAiActive } from './ai';
import type { JornadaData } from './data';
import type {
  ConsumableId,
  Fighter,
  FighterMods,
  JAction,
  JBattle,
  JEffect,
  JEvent,
  JFreeAction,
  JTechnique,
  TeamSide,
  WinCondition,
} from './types';

export function emptyMods(): FighterMods {
  return {
    damageMult: 1,
    typeDamageMult: {},
    taijutsuFlat: 0,
    critBonus: 0,
    accuracyBonus: 0,
    evasion: 0,
    regenPct: 0,
    lowHpDamageMult: 1,
    startClones: 0,
    extraClones: 0,
    startShieldPct: 0,
    chakraDiscount: 0,
    techDamageMult: {},
    techChakraDiscount: {},
    surviveOnce: false,
    cloneCounter: 0,
    maxClonesBonus: 0,
    damagePerClone: 0,
    stunnedDamageMult: 1,
    effectChanceBonus: 0,
    reviveHpBonus: 0,
    onKillChakra: 0,
    guardHealPct: 0,
    restBonusPct: 0,
    kitBonusPct: 0,
    startChakraPct: 0,
    gateLevels: 0,
  };
}

/** Junta dois conjuntos de bônus: multiplicadores multiplicam, o resto soma. */
export function mergeMods(a: FighterMods, b: Partial<FighterMods>): FighterMods {
  const mulMap = (x: Record<string, number>, y: Record<string, number> = {}) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) out[k] = (out[k] ?? 1) * v;
    return out;
  };
  const addMap = (x: Record<string, number>, y: Record<string, number> = {}) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) out[k] = (out[k] ?? 0) + v;
    return out;
  };
  return {
    damageMult: a.damageMult * (b.damageMult ?? 1),
    typeDamageMult: mulMap(a.typeDamageMult, b.typeDamageMult),
    taijutsuFlat: a.taijutsuFlat + (b.taijutsuFlat ?? 0),
    critBonus: a.critBonus + (b.critBonus ?? 0),
    accuracyBonus: a.accuracyBonus + (b.accuracyBonus ?? 0),
    evasion: a.evasion + (b.evasion ?? 0),
    regenPct: a.regenPct + (b.regenPct ?? 0),
    lowHpDamageMult: a.lowHpDamageMult * (b.lowHpDamageMult ?? 1),
    startClones: a.startClones + (b.startClones ?? 0),
    extraClones: a.extraClones + (b.extraClones ?? 0),
    startShieldPct: a.startShieldPct + (b.startShieldPct ?? 0),
    chakraDiscount: a.chakraDiscount + (b.chakraDiscount ?? 0),
    techDamageMult: mulMap(a.techDamageMult, b.techDamageMult),
    techChakraDiscount: addMap(a.techChakraDiscount, b.techChakraDiscount),
    surviveOnce: a.surviveOnce || Boolean(b.surviveOnce),
    cloneCounter: a.cloneCounter + (b.cloneCounter ?? 0),
    maxClonesBonus: a.maxClonesBonus + (b.maxClonesBonus ?? 0),
    damagePerClone: a.damagePerClone + (b.damagePerClone ?? 0),
    stunnedDamageMult: a.stunnedDamageMult * (b.stunnedDamageMult ?? 1),
    effectChanceBonus: a.effectChanceBonus + (b.effectChanceBonus ?? 0),
    reviveHpBonus: a.reviveHpBonus + (b.reviveHpBonus ?? 0),
    onKillChakra: a.onKillChakra + (b.onKillChakra ?? 0),
    guardHealPct: a.guardHealPct + (b.guardHealPct ?? 0),
    restBonusPct: a.restBonusPct + (b.restBonusPct ?? 0),
    kitBonusPct: a.kitBonusPct + (b.kitBonusPct ?? 0),
    startChakraPct: a.startChakraPct + (b.startChakraPct ?? 0),
    gateLevels: a.gateLevels + (b.gateLevels ?? 0),
  };
}

/** Lutador pronto para entrar (sem uid e lado: `startBattle` define). */
export type FighterSeed = Omit<Fighter, 'uid' | 'side' | 'effects' | 'shield' | 'clones' | 'down' | 'guarding' | 'cooldowns' | 'survivedOnce' | 'enraged' | 'boost' | 'gate'>;

export interface BattleSetup {
  allies: FighterSeed[];
  enemies: FighterSeed[];
  win: WinCondition;
}

const scale = (n: number, mult: number) => (n > 0 ? Math.max(1, Math.floor(n * mult)) : 0);

/** Ficha do inimigo com a dificuldade aplicada (HP, ataques e resistências; o dano base sai em `damageMult`). */
export function enemySeed(defId: string, difficulty: keyof JornadaData['base']['difficulty']['multipliers'], data: JornadaData): FighterSeed {
  const def = data.enemies[defId];
  if (!def) throw new Error(`inimigo desconhecido: ${defId}`);
  const mult = data.base.difficulty.multipliers[difficulty];
  const hp = scale(def.hp, mult);
  return {
    defId,
    protagonist: false,
    maxHp: hp,
    hp,
    maxChakra: def.chakra,
    chakra: def.chakra,
    speed: def.speed,
    offense: { taijutsu: scale(def.offense.taijutsu, mult), ninjutsu: scale(def.offense.ninjutsu, mult), genjutsu: scale(def.offense.genjutsu, mult) },
    resistance: { physical: scale(def.resistance.physical, mult), mental: scale(def.resistance.mental, mult) },
    element: def.element,
    techniques: [...def.techniques],
    ai: def.ai,
    ...(def.passive ? { passive: def.passive } : {}),
    mods: { ...emptyMods(), damageMult: mult },
  };
}

function enter(seed: FighterSeed, side: TeamSide, index: number): Fighter {
  const shieldPct = seed.mods.startShieldPct + (seed.passive?.kind === 'startShieldPct' ? seed.passive.pct : 0);
  return {
    ...seed,
    uid: `${side === 'ally' ? 'a' : 'e'}${index}`,
    side,
    chakra: Math.min(seed.maxChakra, seed.chakra + Math.floor(seed.maxChakra * seed.mods.startChakraPct)),
    effects: [],
    shield: Math.floor(seed.maxHp * shieldPct),
    clones: seed.mods.startClones,
    down: seed.hp <= 0,
    guarding: false,
    cooldowns: {},
    survivedOnce: false,
    enraged: false,
    boost: null,
    gate: null,
  };
}

// ---------------------------------------------------------------------------
// Consultas

export const fighter = (s: JBattle, uid: string): Fighter => {
  const f = s.fighters.find((x) => x.uid === uid);
  if (!f) throw new Error(`lutador desconhecido: ${uid}`);
  return f;
};
export const alive = (s: JBattle, side: TeamSide) => s.fighters.filter((f) => f.side === side && !f.down);
export const downed = (s: JBattle, side: TeamSide) => s.fighters.filter((f) => f.side === side && f.down);
export const opponentSide = (side: TeamSide): TeamSide => (side === 'ally' ? 'enemy' : 'ally');
export const protagonist = (s: JBattle) => s.fighters.find((f) => f.protagonist) ?? null;
export const hasEffect = (f: Fighter, e: JEffect) => f.effects.some((x) => x.kind === e && x.turns > 0);

/** Lutador do turno atual (null fora de turno). */
export function current(s: JBattle): Fighter | null {
  const uid = s.order[s.turnIndex];
  return uid ? fighter(s, uid) : null;
}

/** O jogo espera a ação do protagonista. */
export const awaitingPlayer = (s: JBattle) => s.status === 'ongoing' && s.turnStarted && Boolean(current(s)?.protagonist);

export function techniqueCost(f: Fighter, tech: JTechnique): number {
  return Math.max(0, tech.chakraCost - f.mods.chakraDiscount - (f.mods.techChakraDiscount[tech.id] ?? 0));
}

export function hpCost(f: Fighter, tech: JTechnique): number {
  return tech.hpCostPct ? Math.max(1, Math.floor(f.maxHp * tech.hpCostPct)) : 0;
}

/** Por que a técnica não pode ser usada agora (null = pode). */
export function blockedReason(f: Fighter, tech: JTechnique): 'chakra' | 'cooldown' | 'chakraBlock' | 'hp' | null {
  if ((f.cooldowns[tech.id] ?? 0) > 0) return 'cooldown';
  if (hasEffect(f, 'chakraBlock') && tech.type !== 'taijutsu') return 'chakraBlock';
  if (f.chakra < techniqueCost(f, tech)) return 'chakra';
  if (hpCost(f, tech) >= f.hp) return 'hp';
  return null;
}

/** Alvos possíveis da técnica para quem usa. */
export function validTargets(s: JBattle, user: Fighter, tech: JTechnique): Fighter[] {
  if (tech.target === 'self') return [user];
  if (tech.target === 'ally') return alive(s, user.side);
  return alive(s, opponentSide(user.side));
}

function elementCfg(data: JornadaData) {
  const j = data.j.combat;
  return { advantage: j.elementAdvantage, disadvantage: j.elementDisadvantage, neutral: 1, pierce: j.elementAdvantage };
}

export function elementMult(tech: JTechnique, target: Fighter, data: JornadaData): number {
  return elementMultiplier(tech.element, target.element, data.beats, elementCfg(data));
}

/** Multiplicador de ficha (talentos e relíquias) de uma técnica: o que vale fora da luta. */
export function staticMult(m: FighterMods, tech: JTechnique): number {
  return m.damageMult * (m.typeDamageMult[tech.type] ?? 1) * (m.techDamageMult[tech.id] ?? 1);
}

/** Multiplicador de dano de quem ataca (ficha, HP baixo, fúria, fortalecimento, portão, clones). */
function attackerMult(f: Fighter, tech: JTechnique, data: JornadaData): number {
  const m = f.mods;
  let mult = staticMult(m, tech);
  if (f.hp < f.maxHp * 0.5) mult *= m.lowHpDamageMult;
  if (f.passive?.kind === 'enrage' && f.hp <= f.maxHp * f.passive.atPct) mult *= f.passive.damageMult;
  if (f.boost?.damageMult) mult *= f.boost.damageMult;
  if (f.gate) mult *= gateTotals(f.gate.level, data).damageMult;
  if (m.damagePerClone) mult *= 1 + m.damagePerClone * f.clones;
  return mult;
}

/** Base por golpe com o dano plano de taijutsu. */
const powerBase = (tech: JTechnique, m: FighterMods) => tech.baseDamage + (tech.type === 'taijutsu' ? m.taijutsuFlat : 0);

/**
 * "Dano N" das telas fora da luta (moveset, árvore): base × bônus de ficha, por golpe. Sobe com os talentos e os
 * níveis da técnica. O dano de verdade ainda soma o ataque e tira a resistência do alvo.
 */
export function techPower(tech: JTechnique, mods: FighterMods): number {
  return tech.baseDamage > 0 ? Math.floor(powerBase(tech, mods) * staticMult(mods, tech)) : 0;
}

/** "Dano N" na luta: como `techPower`, mais os bônus do momento (portão, fortalecimento, HP baixo, clones). */
export function battlePower(f: Fighter, tech: JTechnique, data: JornadaData): number {
  return tech.baseDamage > 0 ? Math.floor(powerBase(tech, f.mods) * attackerMult(f, tech, data)) : 0;
}

// ---------------------------------------------------------------------------
// Portões (docs/jornada/combate.md#portões)

export interface GateTotals {
  damageMult: number;
  accuracy: number;
  critBonus: number;
  drainPct: number;
}

/** Bônus e desgaste somados do 1º ao portão `level`. */
export function gateTotals(level: number, data: JornadaData): GateTotals {
  const out: GateTotals = { damageMult: 1, accuracy: 0, critBonus: 0, drainPct: 0 };
  for (const g of data.j.gates.levels.slice(0, level)) {
    out.damageMult *= g.damageMult;
    out.accuracy += g.accuracy ?? 0;
    out.critBonus += g.critBonus ?? 0;
    out.drainPct += g.drainPct;
  }
  return out;
}

/** Id da ativa dos Portões que o lutador conhece (null = não tem). */
export const gatesTech = (f: Fighter, data: JornadaData): string | null => f.techniques.find((id) => data.techniques[id]?.gates) ?? null;

/** Portão mais alto que o lutador pode abrir (0 = não tem Portões). */
export function maxGate(f: Fighter, data: JornadaData): number {
  return gatesTech(f, data) ? Math.min(data.j.gates.levels.length, 1 + f.mods.gateLevels) : 0;
}

/** Desgaste de um turno no portão `level`, em HP (antes do limite de não derrubar). */
export const gateDrain = (f: Fighter, level: number, data: JornadaData) => Math.max(1, Math.floor(f.maxHp * gateTotals(level, data).drainPct));

/**
 * Escolhas de portão agora: os liberados menos o aberto, e 0 (fechar) com um aberto. Vazio se o lutador já usou a
 * ativa do turno, ou está com tudo fechado e em espera.
 */
export function gateChoices(s: JBattle, f: Fighter, data: JornadaData): number[] {
  const id = gatesTech(f, data);
  if (!id || f.down || s.activeUsed) return [];
  if (!f.gate && (f.cooldowns[id] ?? 0) > 0) return [];
  const levels = Array.from({ length: maxGate(f, data) }, (_, i) => i + 1).filter((l) => l !== f.gate?.level);
  return f.gate ? [...levels, 0] : levels;
}

function closeGates(s: JBattle, f: Fighter, data: JornadaData, timeout: boolean): void {
  f.gate = null;
  const id = gatesTech(f, data);
  // +1: o fim do turno em que fechou já desconta.
  if (id) f.cooldowns[id] = data.j.gates.cooldown + 1;
  s.log.push({ type: 'gate', uid: f.uid, level: 0, ...(timeout ? { timeout: true } : {}) });
}

function changeGate(s: JBattle, f: Fighter, level: number, data: JornadaData): void {
  if (!gateChoices(s, f, data).includes(level)) throw new Error(`portão indisponível: ${level}`);
  s.activeUsed = true;
  if (level === 0) return closeGates(s, f, data, false);
  // Subir ou descer não renova o tempo.
  f.gate = { level, turns: f.gate?.turns ?? data.j.gates.maxTurns };
  s.log.push({ type: 'gate', uid: f.uid, level });
}

const resistanceKind = (type: AttackType) => (type === 'genjutsu' ? 'mental' : 'physical');

/** Dano de um golpe sem crítico (prévia e IA). */
export function hitDamage(user: Fighter, target: Fighter, tech: JTechnique, data: JornadaData, crit = false): number {
  const j = data.j.combat;
  return damage({
    baseDamage: tech.baseDamage + (tech.type === 'taijutsu' ? user.mods.taijutsuFlat : 0),
    offense: user.offense[tech.type],
    resistance: target.resistance[resistanceKind(tech.type)],
    fraction: target.guarding ? j.guardFraction : j.resistanceFraction,
    penetration: Math.min(data.base.penetration.max, (tech.penetration ?? 0) + (user.boost?.penetration ?? 0)),
    elementMult: elementMult(tech, target, data),
    critMult: crit ? data.base.crit.multiplier : 1,
    extraMult: attackerMult(user, tech, data) * (hasEffect(target, 'stun') ? user.mods.stunnedDamageMult : 1),
  });
}

export function hitsOf(user: Fighter, tech: JTechnique): number {
  const extra = tech.hitsPerClone ? Math.min(tech.maxCloneHits ?? Infinity, user.clones * tech.hitsPerClone) : 0;
  return (tech.hits ?? 1) + extra;
}

export function accuracyAgainst(user: Fighter, target: Fighter, tech: JTechnique, data: JornadaData): number {
  const acc = user.mods.accuracyBonus + (user.boost?.accuracy ?? 0) + (user.gate ? gateTotals(user.gate.level, data).accuracy : 0);
  const eva = target.mods.evasion + (target.boost?.evasion ?? 0);
  return hitChance(tech.accuracy, acc - eva, data.base.hit);
}

// ---------------------------------------------------------------------------
// Início e fluxo

export function startBattle(setup: BattleSetup, data: JornadaData, rng: Rng): JBattle {
  const fighters = [...setup.allies.map((f, i) => enter(f, 'ally', i)), ...setup.enemies.map((f, i) => enter(f, 'enemy', i))];
  const s: JBattle = { round: 0, fighters, order: [], turnIndex: 0, turnStarted: false, status: 'ongoing', win: setup.win, itemUsed: false, activeUsed: false, heroRevives: 0, log: [] };
  return advance(s, data, rng);
}

function clone(s: JBattle): JBattle {
  return structuredClone(s);
}

function newRound(s: JBattle, data: JornadaData, rng: Rng): void {
  s.round++;
  s.log.push({ type: 'round', round: s.round });
  if (s.win.kind === 'survive' && s.round > s.win.rounds) return end(s, 'won');
  for (const f of s.fighters) {
    if (f.down || f.mods.regenPct <= 0 || f.hp >= f.maxHp) continue;
    const amount = Math.min(f.maxHp - f.hp, Math.max(1, Math.floor(f.maxHp * f.mods.regenPct)));
    f.hp += amount;
    s.log.push({ type: 'regen', target: f.uid, amount });
  }
  const v = data.j.combat.orderVariance;
  s.order = s.fighters
    .filter((f) => !f.down)
    .map((f) => ({ uid: f.uid, score: f.speed * (1 - v + 2 * v * rng()) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.uid);
  s.turnIndex = 0;
  s.turnStarted = false;
}

function end(s: JBattle, status: 'won' | 'lost'): void {
  if (s.status !== 'ongoing') return;
  s.status = status;
  s.log.push({ type: 'end', status });
}

/** Confere vitória e derrota depois de qualquer mudança de HP. */
function checkEnd(s: JBattle): void {
  if (s.status !== 'ongoing') return;
  // Protagonista caído não encerra a luta: os suportes de pé usam o turno para levantá-lo (ai.ts).
  if (alive(s, 'ally').length === 0) return end(s, 'lost');
  if (alive(s, 'enemy').length === 0) return end(s, 'won');
  const w = s.win;
  if (w.kind === 'hpThreshold' || w.kind === 'survive') {
    const t = s.fighters.find((f) => f.side === 'enemy' && f.defId === w.target);
    if (t && (t.down || t.hp <= t.maxHp * w.pct)) end(s, 'won');
  }
}

/** Começo do turno: queimar e veneno, depois o atordoamento (perde a vez). Devolve se o lutador age. */
function startTurn(s: JBattle, f: Fighter, data: JornadaData): boolean {
  s.turnStarted = true;
  f.guarding = false;
  s.log.push({ type: 'turn', uid: f.uid });
  for (const e of ['burn', 'poison'] as const) {
    if (!hasEffect(f, e)) continue;
    const pct = e === 'burn' ? data.j.combat.burnPct : data.j.combat.poisonPct;
    const amount = Math.max(1, Math.floor(f.maxHp * pct));
    s.log.push({ type: 'tick', target: f.uid, effect: e, amount });
    applyHpLoss(s, f, amount);
    if (f.down) return false;
  }
  if (s.status !== 'ongoing') return false;
  if (hasEffect(f, 'stun')) {
    s.log.push({ type: 'skip', uid: f.uid, reason: 'stun' });
    return false;
  }
  return true;
}

/** Fim do turno: desgaste dos Portões, depois efeitos, portão e esperas descontam uma rodada. */
function endTurn(s: JBattle, f: Fighter, data: JornadaData): void {
  f.effects = f.effects.map((e) => ({ ...e, turns: e.turns - 1 })).filter((e) => e.turns > 0);
  if (f.boost && --f.boost.turns <= 0) f.boost = null;
  if (f.gate && !f.down) {
    // O desgaste nunca derruba: para em 1 de HP.
    const amount = Math.min(f.hp - 1, gateDrain(f, f.gate.level, data));
    if (amount > 0) {
      f.hp -= amount;
      s.log.push({ type: 'hpCost', uid: f.uid, amount, source: 'gates' });
    }
    if (--f.gate.turns <= 0) closeGates(s, f, data, true);
  }
  for (const id of Object.keys(f.cooldowns)) {
    f.cooldowns[id] = Math.max(0, f.cooldowns[id]! - 1);
    if (f.cooldowns[id] === 0) delete f.cooldowns[id];
  }
  s.turnIndex++;
  s.turnStarted = false;
  s.itemUsed = false;
  s.activeUsed = false;
}

/**
 * Anda a luta: turnos da IA até chegar a vez do protagonista (ou a luta acabar).
 * Turno perdido (atordoado, caiu no começo) passa direto.
 */
export function advance(state: JBattle, data: JornadaData, rng: Rng): JBattle {
  const s = clone(state);
  let guard = 0;
  while (s.status === 'ongoing') {
    // Com o protagonista caído a luta anda sem o jogador: se ninguém consegue terminar, conta como derrota.
    if (++guard > 500) {
      end(s, 'lost');
      break;
    }
    if (s.turnIndex >= s.order.length) {
      newRound(s, data, rng);
      continue;
    }
    const f = current(s)!;
    if (f.down) {
      s.turnIndex++;
      continue;
    }
    if (!s.turnStarted) {
      const acts = startTurn(s, f, data);
      if (s.status !== 'ongoing') break;
      if (!acts) {
        endTurn(s, f, data);
        continue;
      }
    }
    if (f.protagonist) return s;
    // Ativa grátis antes da ação (hoje só protagonistas têm ativas; fica coerente para a IA).
    const free = chooseAiActive(s, f, data, rng);
    if (free) applyFree(s, f, free, data, rng);
    if (s.status === 'ongoing') execute(s, f, chooseAiAction(s, f, data, rng), data, rng);
    endTurn(s, f, data);
  }
  return s;
}

/** O protagonista age (só na vez dele). Depois, a luta anda até a próxima vez dele. */
export function playerAct(state: JBattle, action: JAction, data: JornadaData, rng: Rng): JBattle {
  if (!awaitingPlayer(state)) throw new Error('não é a vez do protagonista');
  const s = clone(state);
  const f = current(s)!;
  execute(s, f, action, data, rng);
  endTurn(s, f, data);
  return advance(s, data, rng);
}

/** Ativa de classe do protagonista: não gasta o turno, uma por turno (contando a troca de portão). */
export function useActive(state: JBattle, techId: string, targetUid: string, data: JornadaData, rng: Rng): JBattle {
  return useFree(state, { kind: 'active', techId, target: targetUid }, data, rng);
}

/** Abre, troca (subir ou descer, sem renovar o tempo) ou fecha (0) os Portões do protagonista. Conta como a ativa do turno. */
export function setGate(state: JBattle, level: number, data: JornadaData, rng: Rng): JBattle {
  return useFree(state, { kind: 'gate', level }, data, rng);
}

/** Ação grátis do protagonista (ativa ou portão). */
export function useFree(state: JBattle, action: JFreeAction, data: JornadaData, rng: Rng): JBattle {
  if (!awaitingPlayer(state)) throw new Error('não é a vez do protagonista');
  const s = clone(state);
  applyFree(s, current(s)!, action, data, rng);
  return s;
}

function applyFree(s: JBattle, f: Fighter, action: JFreeAction, data: JornadaData, rng: Rng): void {
  if (action.kind === 'gate') return changeGate(s, f, action.level, data);
  const tech = data.techniques[action.techId];
  if (!tech?.active || tech.gates) throw new Error(`ativa indisponível: ${action.techId}`);
  if (s.activeUsed) throw new Error('já usou uma ativa neste turno');
  applyTech(s, f, tech.id, action.target, data, rng);
  s.activeUsed = true;
}

/** Item da bolsa: não gasta o turno, um por turno do protagonista. A run desconta da bolsa. */
export function useItem(state: JBattle, item: ConsumableId, targetUid: string, data: JornadaData): JBattle {
  if (!awaitingPlayer(state) || state.itemUsed) throw new Error('item indisponível agora');
  const s = clone(state);
  const user = current(s)!;
  const t = fighter(s, targetUid);
  const j = data.j.combat;
  if (item === 'reviveKit') {
    if (!t.down || t.side !== user.side) throw new Error('alvo inválido');
    reviveFighter(s, user, t, j.reviveHpPct);
  } else {
    if (t.down || t.side !== user.side) throw new Error('alvo inválido');
    const boost = 1 + user.mods.kitBonusPct;
    if (item === 'hpKit') heal(s, user, t, Math.floor(t.maxHp * j.hpKitPct * boost));
    else {
      const amount = Math.min(t.maxChakra - t.chakra, Math.floor(t.maxChakra * j.chakraKitPct * boost));
      t.chakra += amount;
    }
  }
  s.itemUsed = true;
  s.log.push({ type: 'item', uid: user.uid, item, target: t.uid });
  return s;
}

/** Itens que dá para usar agora e em quem (sem olhar a bolsa). */
export function itemTargets(s: JBattle, item: ConsumableId): Fighter[] {
  if (!awaitingPlayer(s) || s.itemUsed) return [];
  if (item === 'reviveKit') return downed(s, 'ally');
  return alive(s, 'ally');
}

// ---------------------------------------------------------------------------
// Execução

function execute(s: JBattle, f: Fighter, action: JAction, data: JornadaData, rng: Rng): void {
  const j = data.j.combat;
  if (action.kind === 'guard') {
    f.guarding = true;
    s.log.push({ type: 'guard', uid: f.uid });
    if (f.mods.guardHealPct) heal(s, f, f, Math.floor(f.maxHp * f.mods.guardHealPct));
    return;
  }
  if (action.kind === 'rest') {
    const amount = Math.min(f.maxChakra - f.chakra, Math.max(1, Math.floor(f.maxChakra * (j.restChakraPct + f.mods.restBonusPct))));
    f.chakra += amount;
    s.log.push({ type: 'rest', uid: f.uid, chakra: amount });
    return;
  }
  if (action.kind === 'revive') {
    const t = fighter(s, action.target);
    if (!t.down || t.side !== f.side) throw new Error('alvo inválido');
    if (t.protagonist) s.heroRevives++;
    reviveFighter(s, f, t, j.reviveHpPct);
    return;
  }
  if (data.techniques[action.techId]?.active) throw new Error(`ativa não gasta o turno: use useActive (${action.techId})`);
  applyTech(s, f, action.techId, action.target, data, rng);
}

/** Usa a técnica (ação de turno ou ativa grátis). */
function applyTech(s: JBattle, f: Fighter, techId: string, targetUid: string, data: JornadaData, rng: Rng): void {
  const j = data.j.combat;
  const tech = data.techniques[techId];
  if (!tech || !f.techniques.includes(tech.id)) throw new Error(`técnica indisponível: ${techId}`);
  if (tech.gates) throw new Error('Portões: use setGate');
  if (blockedReason(f, tech)) throw new Error(`técnica bloqueada: ${tech.id}`);
  const targets = tech.target === 'allEnemies' ? alive(s, opponentSide(f.side)) : tech.target === 'self' ? [f] : [fighter(s, targetUid)];
  if (targets.some((t) => t.down)) throw new Error('alvo caído');
  f.chakra -= techniqueCost(f, tech);
  if (tech.cooldown) f.cooldowns[tech.id] = tech.cooldown + 1;
  s.log.push({ type: 'tech', uid: f.uid, techId: tech.id, targets: targets.map((t) => t.uid) });
  const hpPaid = hpCost(f, tech);
  if (hpPaid) {
    f.hp -= hpPaid;
    s.log.push({ type: 'hpCost', uid: f.uid, amount: hpPaid, source: tech.id });
  }

  if (tech.boost) {
    // Ativa não gasta o turno: o da ativação já conta como um dos turnos do fortalecimento.
    f.boost = { ...tech.boost, techId: tech.id };
    s.log.push({ type: 'boost', uid: f.uid, techId: tech.id, turns: tech.boost.turns });
  }
  if (tech.clones) {
    f.clones = Math.min(j.maxClones + f.mods.maxClonesBonus, f.clones + tech.clones + f.mods.extraClones);
    s.log.push({ type: 'clones', uid: f.uid, total: f.clones });
  }
  for (const t of targets) {
    if (tech.baseDamage > 0) strike(s, f, t, tech, data, rng);
    else if (tech.onHit && t.side !== f.side) applyStatus(s, f, t, tech, data, rng);
    if (t.down) continue;
    if (tech.healPct) heal(s, f, t, Math.floor(t.maxHp * tech.healPct));
    if (tech.shieldPct) {
      const amount = Math.floor(f.maxHp * tech.shieldPct);
      t.shield += amount;
      s.log.push({ type: 'shield', uid: f.uid, target: t.uid, amount });
    }
    if (tech.cleanse && t.effects.some((e) => e.kind === 'stun' || e.kind === 'chakraBlock')) {
      t.effects = t.effects.filter((e) => e.kind !== 'stun' && e.kind !== 'chakraBlock');
      s.log.push({ type: 'cleanse', uid: f.uid, target: t.uid });
    }
    if (s.status !== 'ongoing') return;
  }
  checkEnrage(s);
  checkEnd(s);
}

/** Técnica sem dano com efeito (Sexy no Jutsu, Prisão de Água): uma rolagem de acerto. */
function applyStatus(s: JBattle, f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData, rng: Rng): void {
  if (rng() >= accuracyAgainst(f, t, tech, data)) {
    s.log.push({ type: 'miss', uid: f.uid, target: t.uid });
    return;
  }
  tryEffect(s, f, t, tech, data, rng);
}

function strike(s: JBattle, f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData, rng: Rng): void {
  const j = data.j.combat;
  const hits = hitsOf(f, tech);
  // Clones só seguram golpe de alvo único; técnica em área passa por eles.
  const single = tech.target !== 'allEnemies';
  for (let i = 0; i < hits && !t.down && !f.down && s.status === 'ongoing'; i++) {
    const chance = accuracyAgainst(f, t, tech, data);
    // Um sorteio só: abaixo do crítico é crítico, abaixo do acerto é acerto (crítico contido no acerto).
    const r = rng();
    const gateCrit = f.gate ? gateTotals(f.gate.level, data).critBonus : 0;
    const outcome = r < critChance((tech.critBonus ?? 0) + f.mods.critBonus + gateCrit, data.base.crit, chance) ? 'crit' : r < chance ? 'hit' : 'miss';
    if (outcome === 'miss') {
      s.log.push({ type: 'miss', uid: f.uid, target: t.uid });
      continue;
    }
    if (single && t.clones > 0 && rng() < j.cloneBlockChance) {
      t.clones--;
      s.log.push({ type: 'cloneBlock', target: t.uid, left: t.clones });
      if (t.mods.cloneCounter) {
        s.log.push({ type: 'damage', uid: t.uid, target: f.uid, amount: t.mods.cloneCounter, crit: false, elementMult: 1, absorbed: 0 });
        applyHpLoss(s, f, t.mods.cloneCounter);
      }
      continue;
    }
    const amount = hitDamage(f, t, tech, data, outcome === 'crit');
    const absorbed = Math.min(t.shield, amount);
    t.shield -= absorbed;
    s.log.push({ type: 'damage', uid: f.uid, target: t.uid, amount: amount - absorbed, crit: outcome === 'crit', elementMult: elementMult(tech, t, data), absorbed });
    applyHpLoss(s, t, amount - absorbed);
    if (t.down && f.mods.onKillChakra) f.chakra = Math.min(f.maxChakra, f.chakra + f.mods.onKillChakra);
    if (!t.down) tryEffect(s, f, t, tech, data, rng);
  }
}

function tryEffect(s: JBattle, f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData, rng: Rng): void {
  const on = tech.onHit;
  if (!on || t.down || rng() >= on.chance + f.mods.effectChanceBonus) return;
  const turns = on.turns ?? data.j.combat.defaultEffectTurns;
  const prev = t.effects.find((e) => e.kind === on.effect);
  if (prev) prev.turns = Math.max(prev.turns, turns);
  else t.effects.push({ kind: on.effect, turns });
  s.log.push({ type: 'effect', target: t.uid, effect: on.effect, turns });
}

function applyHpLoss(s: JBattle, t: Fighter, amount: number): void {
  if (amount <= 0) return;
  t.hp = Math.max(0, t.hp - amount);
  if (t.hp > 0) return checkEnd(s);
  if (t.mods.surviveOnce && !t.survivedOnce) {
    t.survivedOnce = true;
    t.hp = 1;
    s.log.push({ type: 'survive', target: t.uid });
    return;
  }
  t.down = true;
  t.effects = [];
  t.clones = 0;
  t.shield = 0;
  t.guarding = false;
  t.boost = null;
  t.gate = null;
  s.log.push({ type: 'down', target: t.uid });
  checkEnd(s);
}

function heal(s: JBattle, f: Fighter, t: Fighter, amount: number): void {
  const real = clamp(amount, 0, t.maxHp - t.hp);
  if (real <= 0) return;
  t.hp += real;
  s.log.push({ type: 'heal', uid: f.uid, target: t.uid, amount: real });
}

function reviveFighter(s: JBattle, f: Fighter, t: Fighter, pct: number): void {
  t.down = false;
  t.hp = Math.max(1, Math.floor(t.maxHp * Math.min(1, pct + t.mods.reviveHpBonus)));
  s.log.push({ type: 'revive', uid: f.uid, target: t.uid, hp: t.hp });
}

function checkEnrage(s: JBattle): void {
  for (const f of s.fighters) {
    if (f.down || f.enraged || f.passive?.kind !== 'enrage') continue;
    if (f.hp <= f.maxHp * f.passive.atPct) {
      f.enraged = true;
      s.log.push({ type: 'enrage', uid: f.uid });
    }
  }
}

/** Resultado da luta para a run: HP e chakra de cada aliado no fim, por defId. */
export function allyResults(s: JBattle): { defId: string; hp: number; chakra: number; down: boolean }[] {
  return s.fighters.filter((f) => f.side === 'ally').map((f) => ({ defId: f.defId, hp: f.hp, chakra: f.chakra, down: f.down }));
}

export type { JEvent };
