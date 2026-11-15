import type { Difficulty } from '../difficulty';
// Combate de equipe da Jornada (docs/jornada/combate.md). Funções puras: estado entra, estado sai.
// Até 3 × 3. O jogador decide só o turno do protagonista; os outros lutadores usam a IA (ai.ts).
import { damage } from '../damage';
import { wearClone } from '../clones';
import { absorbIntoBarrier, barrierMult, raiseBarrier, type BarrierAttack, type BarrierContext } from '../barriers';
import { dotDamage, effectDuration, isControl as isControlKind } from '../effects';
import { gateUpkeep, payGateUpkeep } from '../gates';
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
  FighterSeed,
} from './types';
import { applyForm, endForm, formOf, hasForm, runScript, type ScriptContext, type ScriptRule } from './script';

export function emptyMods(): FighterMods {
  return {
    damageMult: 1,
    typeDamageMult: {},
    taijutsuFlat: 0,
    critBonus: 0,
    accuracyBonus: 0,
    evasion: 0,
    regenHp: 0,
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
    guardHeal: 0,
    restBonus: 0,
    kitBonusPct: 0,
    startChakra: 0,
    healMult: 1,
    gateLevels: 0,
    rollWeights: {},
    cloneShield: false,
    stunnedAlwaysCrit: false,
    rollTwice: false,
    surviveForm: '',
    techOverflow: {},
    lowHpRollWeights: {},
    effectTurnsBonus: 0,
    controlledDamageMult: 1,
    fearOnHit: 0,
    guardHealPct: 0,
    typePen: {},
    cloneEnemyAccuracy: 0,
    taijutsuExtraHits: 0,
    taijutsuHitsPerClone: 0,
    comboStepPct: 0,
    taijutsuHitChakra: 0,
    cloneStrikePct: 0,
    stunnedSplashPct: 0,
    surviveHealPct: 0,
    surviveTeamHealPct: 0,
    gateOpenDiscount: 0,
    gateAutoUp: false,
    critMultBonus: 0,
    critChakra: 0,
    techExtraHits: {},
    openingCrit: false,
    counterChance: 0,
    counterDamage: 0,
    duelDamageMult: 1,
    duelAccuracy: 0,
    healthyTargetMult: 1,
    fallenRally: 0,
    hpCostFreeAtGate: 0,
    readNullChance: 0,
    readCounterDamage: 0,
    burnMult: 1,
    genjutsuStunChance: 0,
    illusionSureHit: false,
    techSplash: {},
    vengeanceMult: 1,
    vengeanceAccuracy: 0,
    burningDamageMult: 1,
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
    // Dano geral soma (v0.78.0, G1 do diagnóstico): +25% e +15% dão +40%. Os outros grupos seguem multiplicando.
    damageMult: a.damageMult + ((b.damageMult ?? 1) - 1),
    typeDamageMult: mulMap(a.typeDamageMult, b.typeDamageMult),
    taijutsuFlat: a.taijutsuFlat + (b.taijutsuFlat ?? 0),
    critBonus: a.critBonus + (b.critBonus ?? 0),
    accuracyBonus: a.accuracyBonus + (b.accuracyBonus ?? 0),
    evasion: a.evasion + (b.evasion ?? 0),
    regenHp: a.regenHp + (b.regenHp ?? 0),
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
    guardHeal: a.guardHeal + (b.guardHeal ?? 0),
    restBonus: a.restBonus + (b.restBonus ?? 0),
    kitBonusPct: a.kitBonusPct + (b.kitBonusPct ?? 0),
    startChakra: a.startChakra + (b.startChakra ?? 0),
    healMult: a.healMult * (b.healMult ?? 1),
    gateLevels: a.gateLevels + (b.gateLevels ?? 0),
    rollWeights: addMap(a.rollWeights, b.rollWeights),
    cloneShield: a.cloneShield || Boolean(b.cloneShield),
    stunnedAlwaysCrit: a.stunnedAlwaysCrit || Boolean(b.stunnedAlwaysCrit),
    rollTwice: a.rollTwice || Boolean(b.rollTwice),
    surviveForm: b.surviveForm || a.surviveForm,
    techOverflow: addMap(a.techOverflow, b.techOverflow),
    lowHpRollWeights: addMap(a.lowHpRollWeights, b.lowHpRollWeights),
    effectTurnsBonus: a.effectTurnsBonus + (b.effectTurnsBonus ?? 0),
    controlledDamageMult: a.controlledDamageMult * (b.controlledDamageMult ?? 1),
    fearOnHit: a.fearOnHit + (b.fearOnHit ?? 0),
    guardHealPct: a.guardHealPct + (b.guardHealPct ?? 0),
    typePen: addMap(a.typePen, b.typePen),
    cloneEnemyAccuracy: a.cloneEnemyAccuracy + (b.cloneEnemyAccuracy ?? 0),
    taijutsuExtraHits: a.taijutsuExtraHits + (b.taijutsuExtraHits ?? 0),
    taijutsuHitsPerClone: a.taijutsuHitsPerClone + (b.taijutsuHitsPerClone ?? 0),
    comboStepPct: a.comboStepPct + (b.comboStepPct ?? 0),
    taijutsuHitChakra: a.taijutsuHitChakra + (b.taijutsuHitChakra ?? 0),
    cloneStrikePct: Math.max(a.cloneStrikePct, b.cloneStrikePct ?? 0),
    stunnedSplashPct: a.stunnedSplashPct + (b.stunnedSplashPct ?? 0),
    surviveHealPct: a.surviveHealPct + (b.surviveHealPct ?? 0),
    surviveTeamHealPct: a.surviveTeamHealPct + (b.surviveTeamHealPct ?? 0),
    gateOpenDiscount: a.gateOpenDiscount + (b.gateOpenDiscount ?? 0),
    gateAutoUp: a.gateAutoUp || Boolean(b.gateAutoUp),
    critMultBonus: a.critMultBonus + (b.critMultBonus ?? 0),
    critChakra: a.critChakra + (b.critChakra ?? 0),
    techExtraHits: addMap(a.techExtraHits, b.techExtraHits),
    openingCrit: a.openingCrit || Boolean(b.openingCrit),
    counterChance: a.counterChance + (b.counterChance ?? 0),
    counterDamage: a.counterDamage + (b.counterDamage ?? 0),
    duelDamageMult: a.duelDamageMult * (b.duelDamageMult ?? 1),
    duelAccuracy: a.duelAccuracy + (b.duelAccuracy ?? 0),
    healthyTargetMult: a.healthyTargetMult * (b.healthyTargetMult ?? 1),
    fallenRally: a.fallenRally + (b.fallenRally ?? 0),
    hpCostFreeAtGate: b.hpCostFreeAtGate ? (a.hpCostFreeAtGate ? Math.min(a.hpCostFreeAtGate, b.hpCostFreeAtGate) : b.hpCostFreeAtGate) : a.hpCostFreeAtGate,
    readNullChance: a.readNullChance + (b.readNullChance ?? 0),
    readCounterDamage: a.readCounterDamage + (b.readCounterDamage ?? 0),
    burnMult: a.burnMult * (b.burnMult ?? 1),
    genjutsuStunChance: a.genjutsuStunChance + (b.genjutsuStunChance ?? 0),
    illusionSureHit: a.illusionSureHit || Boolean(b.illusionSureHit),
    techSplash: addMap(a.techSplash, b.techSplash),
    vengeanceMult: a.vengeanceMult * (b.vengeanceMult ?? 1),
    vengeanceAccuracy: a.vengeanceAccuracy + (b.vengeanceAccuracy ?? 0),
    burningDamageMult: a.burningDamageMult * (b.burningDamageMult ?? 1),
  };
}

export type { FighterSeed };

export interface BattleSetup {
  allies: FighterSeed[];
  enemies: FighterSeed[];
  win: WinCondition;
  /** Pílulas de reanimação na bolsa da run. */
  pills?: number;
  /** Roteiro da parada e os lutadores que ele pode pôr na luta (docs/jornada/roteiro.md). */
  script?: ScriptRule[];
  reserve?: { side: TeamSide; seed: FighterSeed }[];
  /** Marcas da run (condição `if` do roteiro). */
  runFlags?: string[];
}

const scale = (n: number, mult: number) => (n > 0 ? Math.max(1, Math.floor(n * mult)) : 0);

/** Ficha do inimigo com a dificuldade aplicada: HP, ataques e resistências, e a cura das técnicas dele. */
export function enemySeed(defId: string, difficulty: Difficulty, data: JornadaData, cycleMult = 1): FighterSeed {
  const def = data.enemies[defId];
  if (!def) throw new Error(`inimigo desconhecido: ${defId}`);
  // Modo infinito: o ciclo multiplica por cima da dificuldade (docs/jornada/run.md#modo-infinito).
  const mult = data.j.enemyStrength[difficulty] * cycleMult;
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
    ...(def.kekkeiGenkai ? { kekkeiGenkai: def.kekkeiGenkai } : {}),
    techniques: [...def.techniques],
    ai: def.ai,
    ...(def.passive ? { passive: def.passive } : {}),
    mods: { ...emptyMods(), healMult: mult },
  };
}

function enter(seed: FighterSeed, side: TeamSide, index: number): Fighter {
  const shieldPct = seed.mods.startShieldPct + (seed.passive?.kind === 'startShieldPct' ? seed.passive.pct : 0);
  return {
    ...seed,
    uid: `${side === 'ally' ? 'a' : 'e'}${index}`,
    side,
    chakra: Math.min(seed.maxChakra, seed.chakra + seed.mods.startChakra),
    effects: [],
    shield: Math.floor(seed.maxHp * shieldPct),
    barrier: null,
    clones: seed.mods.startClones,
    // Clones do começo da luta (talentos e relíquias): do tipo da técnica de clone que o lutador conhece.
    cloneKind: 'kage',
    cloneWear: 0,
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
/** Caídos que dá para levantar: fora quem saiu da luta e quem caiu pelo roteiro. */
export const downed = (s: JBattle, side: TeamSide) => s.fighters.filter((f) => f.side === side && f.down && !f.gone && !f.knocked);
export const opponentSide = (side: TeamSide): TeamSide => (side === 'ally' ? 'enemy' : 'ally');
export const protagonist = (s: JBattle) => s.fighters.find((f) => f.protagonist) ?? null;
export const hasEffect = (f: Fighter, e: JEffect) => f.effects.some((x) => x.kind === e && x.turns > 0);

/** Imune a Medo (Uchiha e jinchuuriki, como no Roleta). */
export const fearImmune = (f: Fighter, data: JornadaData) => data.j.combat.fearImmune.includes(f.defId);

/** Quem este lutador pode levantar com a ação universal: os caídos da equipe do jogador (inimigos não têm a ação). */
export const canRaise = (s: JBattle, f: Fighter): Fighter[] => (f.side === 'ally' && !f.down ? downed(s, 'ally') : []);

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
  // Lótus Oculta perfeita (prodígio, v0.85.0): com o portão alto aberto, as técnicas não cobram HP.
  if (f.mods.hpCostFreeAtGate && f.gate && f.gate.level >= f.mods.hpCostFreeAtGate) return 0;
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
  if (tech.target === 'downedAlly') return downed(s, user.side);
  return alive(s, opponentSide(user.side));
}

const barrierCtx = (data: JornadaData): BarrierContext => ({ kekkeiGenkai: data.kekkeiGenkai, beats: data.beats, elements: data.base.elements });

/** O golpe da técnica contra uma barreira: taijutsu é neutro; a Kekkei Genkai conta como a natureza dela. */
const barrierAttack = (user: Fighter, tech: JTechnique): BarrierAttack => ({ type: tech.type, nature: tech.kekkeiGenkai ?? tech.element, hits: hitsOf(user, tech) });

/**
 * Encontro de elementos (v0.77.0): só contra a barreira do alvo (src/core/barriers.ts). Sem barreira, 1: o elemento
 * não muda o dano no HP. A interface usa este número para a seta de vantagem.
 */
export function elementMult(tech: JTechnique, target: Fighter, data: JornadaData, user?: Fighter): number {
  if (!target.barrier) return 1;
  const atk = user ? barrierAttack(user, tech) : { type: tech.type, nature: tech.kekkeiGenkai ?? tech.element, hits: tech.hits ?? 1 };
  return barrierMult(target.barrier, atk, barrierCtx(data));
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
  if (vengeful(f)) mult *= m.vengeanceMult;
  if (hasEffect(f, 'fear')) mult *= data.base.effects.fear.damageMult;
  return mult;
}

/** Vingança (Uchiha): abaixo de 30% do HP, ou com alguém da equipe caído nesta luta. */
const vengeful = (f: Fighter) => f.mods.vengeanceMult > 1 && (f.hp < f.maxHp * VENGEANCE_BELOW || Boolean(f.vengeful));
const VENGEANCE_BELOW = 0.3;
/** Sharingan ligado (o fortalecimento de uma das técnicas do Sharingan). */
const sharinganOn = (f: Fighter) => Boolean(f.boost?.techId.startsWith('jSharingan'));
const controlled = (t: Fighter) => hasEffect(t, 'stun') || hasEffect(t, 'fear') || hasEffect(t, 'chakraBlock');

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
  return tech.baseDamage > 0 ? Math.floor((powerBase(tech, f.mods) + (f.boost?.offense ?? 0)) * attackerMult(f, tech, data)) : 0;
}

// ---------------------------------------------------------------------------
// Portões (docs/jornada/combate.md#portões)

export interface GateTotals {
  damageMult: number;
  accuracy: number;
  critBonus: number;
}

/** Bônus somados do 1º ao portão `level`. */
export function gateTotals(level: number, data: JornadaData): GateTotals {
  const out: GateTotals = { damageMult: 1, accuracy: 0, critBonus: 0 };
  for (const g of data.j.gates.levels.slice(0, level)) {
    out.damageMult *= g.damageMult;
    out.accuracy += g.accuracy ?? 0;
    out.critBonus += g.critBonus ?? 0;
  }
  return out;
}

/** Id da ativa dos Portões que o lutador conhece (null = não tem). */
export const gatesTech = (f: Fighter, data: JornadaData): string | null => f.techniques.find((id) => data.techniques[id]?.gates) ?? null;

/** Portão mais alto que o lutador pode abrir (0 = não tem Portões). */
export function maxGate(f: Fighter, data: JornadaData): number {
  return gatesTech(f, data) ? Math.min(data.j.gates.levels.length, 1 + f.mods.gateLevels) : 0;
}

/** Chakra para ir do portão aberto (0 = fechado) ao `level`: cada portão a mais custa a abertura; descer é grátis. */
export const gateOpenCost = (f: Fighter, level: number, data: JornadaData) =>
  Math.max(0, level - (f.gate?.level ?? 0)) * Math.max(1, data.j.gates.activationPerLevel - f.mods.gateOpenDiscount);

/** Manutenção da rodada `n` mantida no portão `level` (src/core/gates.ts, com o peso do nível). */
export const gateUpkeepAt = (level: number, n: number, data: JornadaData) =>
  gateUpkeep(n, data.base.gateCosts, 1 + data.j.gates.upkeepLevelStep * (level - 1));

/** Próxima manutenção de quem está com os Portões abertos (ou a 1ª, se abrisse o `level`). */
export const nextGateUpkeep = (f: Fighter, level: number, data: JornadaData) => gateUpkeepAt(level, (f.gate?.rounds ?? 0) + 1, data);

/**
 * Escolhas de portão agora: os liberados menos o aberto, e 0 (fechar) com um aberto. Vazio se o lutador já usou a
 * ativa do turno, ou está com tudo fechado e em espera.
 */
export function gateChoices(s: JBattle, f: Fighter, data: JornadaData): number[] {
  const id = gatesTech(f, data);
  if (!id || f.down || s.activeUsed) return [];
  if (!f.gate && (f.cooldowns[id] ?? 0) > 0) return [];
  // Subir só com chakra para a abertura; descer e fechar, sempre.
  const levels = Array.from({ length: maxGate(f, data) }, (_, i) => i + 1).filter((l) => l !== f.gate?.level && gateOpenCost(f, l, data) <= f.chakra);
  return f.gate ? [...levels, 0] : levels;
}

function closeGates(s: JBattle, f: Fighter, data: JornadaData, exhausted: boolean): void {
  f.gate = null;
  const id = gatesTech(f, data);
  // +1: o fim do turno em que fechou já desconta.
  if (id) f.cooldowns[id] = data.j.gates.cooldown + 1;
  s.log.push({ type: 'gate', uid: f.uid, level: 0, ...(exhausted ? { exhausted: true } : {}) });
}

function changeGate(s: JBattle, f: Fighter, level: number, data: JornadaData): void {
  if (!gateChoices(s, f, data).includes(level)) throw new Error(`portão indisponível: ${level}`);
  s.activeUsed = true;
  if (level === 0) return closeGates(s, f, data, false);
  // Subir paga a abertura de cada portão a mais; trocar não zera a manutenção.
  const cost = gateOpenCost(f, level, data);
  f.chakra -= cost;
  f.gate = { level, rounds: f.gate?.rounds ?? 0 };
  s.log.push({ type: 'gate', uid: f.uid, level, ...(cost ? { cost } : {}) });
}

const resistanceKind = (type: AttackType) => (type === 'genjutsu' ? 'mental' : 'physical');

/** Dano de um golpe sem crítico (prévia e IA). */
export function hitDamage(user: Fighter, target: Fighter, tech: JTechnique, data: JornadaData, crit = false): number {
  const j = data.j.combat;
  return damage({
    baseDamage: tech.baseDamage + (tech.type === 'taijutsu' ? user.mods.taijutsuFlat : 0),
    offense: user.offense[tech.type] + (user.boost?.offense ?? 0),
    resistance: target.resistance[resistanceKind(tech.type)],
    fraction: target.guarding ? j.guardFraction : j.resistanceFraction,
    penetration: Math.min(data.base.penetration.max, (tech.penetration ?? 0) + (user.boost?.penetration ?? 0) + (user.mods.typePen[tech.type] ?? 0)),
    // Sem multiplicador de elemento no HP (v0.77.0): ele só vale contra a barreira, na hora do golpe.
    elementMult: 1,
    // Chama da juventude (prodígio): o crítico bate mais.
    critMult: crit ? data.base.crit.multiplier + user.mods.critMultBonus : 1,
    extraMult:
      attackerMult(user, tech, data) *
      (hasEffect(target, 'stun') ? user.mods.stunnedDamageMult : 1) *
      (hasEffect(target, 'stun') || hasEffect(target, 'fear') || hasEffect(target, 'chakraBlock') ? user.mods.controlledDamageMult : 1) *
      // Duelo (prodígio): contra quem tem mais HP máximo que você. Desafio: contra quem está acima da metade do HP.
      (target.maxHp > user.maxHp ? user.mods.duelDamageMult : 1) *
      (target.hp > target.maxHp * 0.5 ? user.mods.healthyTargetMult : 1) *
      // Inferno ilusório (Uchiha): contra quem está queimando.
      (hasEffect(target, 'burn') ? user.mods.burningDamageMult : 1),
  });
}

export function hitsOf(user: Fighter, tech: JTechnique): number {
  const extra = tech.hitsPerClone ? Math.min(tech.maxCloneHits ?? Infinity, user.clones * tech.hitsPerClone) : 0;
  // Combo da Folha e Mil golpes (Comum, v0.84.0): técnicas de taijutsu de dano ganham golpes (até +2 pelos clones).
  const m = user.mods;
  const taiExtra = tech.type === 'taijutsu' && tech.baseDamage > 0 ? m.taijutsuExtraHits + Math.min(TAI_CLONE_HITS_MAX, user.clones * m.taijutsuHitsPerClone) : 0;
  return (tech.hits ?? 1) + extra + taiExtra + (m.techExtraHits[tech.id] ?? 0);
}

/** HP abaixo do qual os Portões sem freio sobem sozinhos. */
const GATE_AUTO_BELOW = 0.25;
/** Turnos do fortalecimento da Lição do mestre. */
const RALLY_TURNS = 3;
/** Teto dos golpes de taijutsu a mais pelos clones (Mil golpes). */
const TAI_CLONE_HITS_MAX = 2;
/** Teto do bônus da sequência de taijutsu (Combo da Folha). */
const COMBO_MAX = 0.3;

export function accuracyAgainst(user: Fighter, target: Fighter, tech: JTechnique, data: JornadaData): number {
  const fear = hasEffect(user, 'fear') ? data.base.effects.fear.accuracy : 0;
  // Mokuton: o clone compartilha o que vê.
  const cloneAcc = user.clones > 0 ? (data.base.clones.kinds[user.cloneKind].accuracyBonus ?? 0) : 0;
  // Mundo da ilusão (Uchiha): genjutsu contra alvo controlado não erra.
  if (tech.type === 'genjutsu' && user.mods.illusionSureHit && controlled(target)) return 1;
  const duel = (target.maxHp > user.maxHp ? user.mods.duelAccuracy : 0) + (vengeful(user) ? user.mods.vengeanceAccuracy : 0);
  const acc = user.mods.accuracyBonus + (user.boost?.accuracy ?? 0) + (user.gate ? gateTotals(user.gate.level, data).accuracy : 0) + fear + cloneAcc + duel;
  // Ilusão perfeita (Comum): com clone de pé, quem ataca erra mais.
  const eva = target.mods.evasion + (target.boost?.evasion ?? 0) + (target.clones > 0 ? target.mods.cloneEnemyAccuracy : 0);
  return hitChance(tech.accuracy, acc - eva, data.base.hit);
}

// ---------------------------------------------------------------------------
// Início e fluxo

/** Monta a luta sem andar: ninguém agiu ainda. É o estado que a tela mostra na abertura. */
export function openBattle(setup: BattleSetup, data: JornadaData): JBattle {
  const fighters = [...setup.allies.map((f, i) => enter(f, 'ally', i)), ...setup.enemies.map((f, i) => enter(f, 'enemy', i))].map((f) => ({
    ...f,
    // Clones do começo da luta: do tipo da técnica de clone que o lutador conhece (sem nenhuma, Kage Bunshin).
    cloneKind: f.techniques.map((id) => data.techniques[id]).find((t) => t?.clones)?.cloneKind ?? f.cloneKind,
  }));
  const s: JBattle = {
    round: 0,
    fighters,
    order: [],
    turnIndex: 0,
    turnStarted: false,
    status: 'ongoing',
    win: setup.win,
    itemUsed: false,
    activeUsed: false,
    pills: setup.pills ?? 0,
    pillHpPct: data.j.combat.reviveHpPct,
    log: [],
    script: setup.script ? structuredClone(setup.script) : [],
    fired: [],
    reserve: setup.reserve ? structuredClone(setup.reserve) : [],
    flags: [],
    runFlags: [...(setup.runFlags ?? [])],
  };
  // Regras de abertura (falas, forma desde o começo).
  script(s, data);
  return s;
}

/** Põe na luta um lutador da reserva (roteiro). Entra no fim da fila de uids do lado e age a partir da próxima rodada. */
function enterFromReserve(s: JBattle, defId: string): Fighter | null {
  const i = s.reserve.findIndex((r) => r.seed.defId === defId);
  if (i < 0) return null;
  const [r] = s.reserve.splice(i, 1);
  const f = { ...enter(r!.seed, r!.side, s.fighters.filter((x) => x.side === r!.side).length), guest: true };
  s.fighters.push(f);
  return f;
}

/** Ponto de checagem do roteiro (abertura, perda de HP, virada de rodada, técnica usada). */
function script(s: JBattle, data: JornadaData, ctx: ScriptContext = {}): void {
  if (!s.script.length) return;
  runScript(s, data, enterFromReserve, ctx);
  // O roteiro pode derrubar alguém (knock) ou pôr gente na luta: confere o fim de novo.
  checkEnd(s);
}

export function startBattle(setup: BattleSetup, data: JornadaData, rng: Rng): JBattle {
  return advance(openBattle(setup, data), data, rng);
}

function clone(s: JBattle): JBattle {
  return structuredClone(s);
}

function newRound(s: JBattle, data: JornadaData, rng: Rng): void {
  s.round++;
  s.log.push({ type: 'round', round: s.round });
  if (s.win.kind === 'survive' && s.round > s.win.rounds) return end(s, 'won');
  script(s, data);
  if (s.status !== 'ongoing') return;
  for (const f of s.fighters) {
    if (f.down || f.mods.regenHp <= 0 || f.hp >= f.maxHp) continue;
    const amount = Math.min(f.maxHp - f.hp, f.mods.regenHp);
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
  // Protagonista caído não encerra a luta: os suportes de pé seguem lutando.
  if (alive(s, 'ally').length === 0) return end(s, 'lost');
  if (alive(s, 'enemy').length === 0) return end(s, 'won');
  const w = s.win;
  if (w.kind === 'hpThreshold' || w.kind === 'survive') {
    const t = s.fighters.find((f) => f.side === 'enemy' && f.defId === w.target);
    if (t && (t.down || t.hp <= t.maxHp * w.pct)) end(s, 'won');
  }
  if (w.kind === 'finisher') {
    const t = s.fighters.find((f) => f.side === 'enemy' && f.defId === w.target && !f.gone);
    if (t?.down) end(s, 'won');
  }
}

/** Começo do turno: queimar e veneno, depois o atordoamento (perde a vez). Devolve se o lutador age. */
function startTurn(s: JBattle, f: Fighter, data: JornadaData): boolean {
  s.turnStarted = true;
  f.guarding = false;
  s.log.push({ type: 'turn', uid: f.uid });
  for (const e of ['burn', 'poison'] as const) {
    if (!hasEffect(f, e)) continue;
    const amount = dotDamage(e, f.maxHp, data.base.effects, f.effects.find((x) => x.kind === e)?.mult ?? 1);
    s.log.push({ type: 'tick', target: f.uid, effect: e, amount });
    applyHpLoss(s, f, amount, data);
    if (f.down) return false;
  }
  if (s.status !== 'ongoing') return false;
  // Portões sem freio (prodígio): abaixo de 25% do HP, o portão aberto sobe um nível sozinho, sem custo.
  if (f.gate && f.mods.gateAutoUp && f.hp < f.maxHp * GATE_AUTO_BELOW && f.gate.level < maxGate(f, data)) {
    f.gate = { ...f.gate, level: f.gate.level + 1 };
    s.log.push({ type: 'gate', uid: f.uid, level: f.gate.level });
  }
  if (hasEffect(f, 'stun')) {
    s.log.push({ type: 'skip', uid: f.uid, reason: 'stun' });
    return false;
  }
  return true;
}

/** Fim do turno: efeitos e esperas descontam uma rodada; os Portões cobram a manutenção (ou fecham). */
function endTurn(s: JBattle, f: Fighter, data: JornadaData): void {
  const wasStunned = hasEffect(f, 'stun');
  f.effects = f.effects.map((e) => ({ ...e, turns: e.turns - 1 })).filter((e) => e.turns > 0);
  // Saiu do atordoamento: ganha a trava, que vale até o fim do próximo turno em que ele age.
  if (wasStunned && !hasEffect(f, 'stun') && !f.down) f.effects.push({ kind: 'stunGuard', turns: data.base.effects.stunImmunityTurns });
  // Forma temporária (roteiro ou ativa): conta os turnos de quem a usa.
  for (const x of [...(f.forms ?? [])]) {
    if (!x.turns || --x.turns > 0) continue;
    endForm(f, x.def.id);
    s.log.push({ type: 'formEnd', uid: f.uid, form: x.def.id });
    if (x.def.exitLine && !f.down) s.log.push({ type: 'say', uid: f.uid, who: f.defId, line: x.def.exitLine });
  }
  if (f.boost && --f.boost.turns <= 0) f.boost = null;
  // Barreira: conta os turnos de quem a recebeu.
  if (f.barrier && --f.barrier.turns <= 0) {
    s.log.push({ type: 'barrier', uid: f.uid, action: 'end', techId: f.barrier.techId });
    f.barrier = null;
  }
  if (f.gate && !f.down) {
    const n = f.gate.rounds + 1;
    // Custo misto (v0.79.0): chakra crescente e HP pelo nível do portão; sem como pagar, fecham.
    const paid = payGateUpkeep({ chakra: f.chakra, hp: f.hp, maxHp: f.maxHp }, n, f.gate.level, data.base.gateCosts, 1 + data.j.gates.upkeepLevelStep * (f.gate.level - 1));
    if (paid) {
      f.chakra = paid.chakra;
      f.hp = paid.hp;
      f.gate.rounds = n;
      s.log.push({ type: 'gateUpkeep', uid: f.uid, amount: paid.cost });
      s.log.push({ type: 'hpCost', uid: f.uid, amount: paid.hpCost, source: 'gates' });
    } else closeGates(s, f, data, true);
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
  script(s, data, { tech: tech.id, by: f });
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
    if (!downed(s, user.side).includes(t)) throw new Error('alvo inválido');
    reviveFighter(s, user, t, j.reviveHpPct);
    s.pills = Math.max(0, s.pills - 1);
  } else {
    if (t.down || t.side !== user.side) throw new Error('alvo inválido');
    const boost = 1 + user.mods.kitBonusPct;
    if (item === 'hpKit') heal(s, user, t, Math.floor(j.hpKit * boost));
    else {
      const amount = Math.min(t.maxChakra - t.chakra, Math.floor(j.chakraKit * boost));
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
    if (f.mods.guardHeal) heal(s, f, f, f.mods.guardHeal);
    if (f.mods.guardHealPct) heal(s, f, f, Math.floor(f.maxHp * f.mods.guardHealPct));
    return;
  }
  if (action.kind === 'rest') {
    const amount = Math.min(f.maxChakra - f.chakra, j.restChakra + f.mods.restBonus);
    f.chakra += amount;
    s.log.push({ type: 'rest', uid: f.uid, chakra: amount });
    return;
  }
  if (action.kind === 'raise') {
    const t = fighter(s, action.target);
    if (!canRaise(s, f).includes(t)) throw new Error('alvo inválido');
    reviveFighter(s, f, t, j.raiseHpPct, 'raise');
    return;
  }
  if (data.techniques[action.techId]?.active) throw new Error(`ativa não gasta o turno: use useActive (${action.techId})`);
  applyTech(s, f, action.techId, action.target, data, rng);
  script(s, data, { tech: action.techId, by: f });
}

/** Usa a técnica (ação de turno ou ativa grátis). */
function applyTech(s: JBattle, f: Fighter, techId: string, targetUid: string, data: JornadaData, rng: Rng): void {
  const tech = data.techniques[techId];
  if (!tech || !f.techniques.includes(tech.id)) throw new Error(`técnica indisponível: ${techId}`);
  if (tech.gates) throw new Error('Portões: use setGate');
  if (blockedReason(f, tech)) throw new Error(`técnica bloqueada: ${tech.id}`);
  const targets = tech.target === 'allEnemies' ? alive(s, opponentSide(f.side)) : tech.target === 'self' ? [f] : [fighter(s, targetUid)];
  if (tech.target === 'downedAlly') {
    if (targets.some((t) => !downed(s, f.side).includes(t))) throw new Error('alvo inválido');
  } else if (targets.some((t) => t.down)) throw new Error('alvo caído');
  const cost = techniqueCost(f, tech);
  f.chakra -= cost;
  if (tech.cooldown) f.cooldowns[tech.id] = tech.cooldown + 1;
  s.log.push({ type: 'tech', uid: f.uid, techId: tech.id, targets: targets.map((t) => t.uid), cost });
  // Técnica sorteada: paga a de cima e resolve a variante (com o alvo dela: área, si mesmo ou o escolhido).
  if (tech.roll) {
    const variant = data.techniques[rollVariant(f, tech, rng)];
    if (!variant) return;
    s.log.push({ type: 'roll', uid: f.uid, techId: tech.id, variant: variant.id });
    const vTargets = variant.target === 'allEnemies' ? alive(s, opponentSide(f.side)) : variant.target === 'self' ? [f] : targets;
    return resolveEffects(s, f, variant, vTargets, data, rng);
  }
  const hpPaid = hpCost(f, tech);
  if (hpPaid) {
    f.hp -= hpPaid;
    s.log.push({ type: 'hpCost', uid: f.uid, amount: hpPaid, source: tech.id });
  }

  resolveEffects(s, f, tech, targets, data, rng);
}

/** Sorteia a variante da técnica pelo peso (com os pesos a mais dos talentos; peso 0 ou menos sai do sorteio). */
function rollVariant(f: Fighter, tech: JTechnique, rng: Rng): string {
  // Com o HP abaixo da metade, entram os pesos de HP baixo (Chakra emprestado: a raposa ajuda a chamar o chefe).
  const low = f.hp < f.maxHp * 0.5;
  const opts = tech.roll!
    .map((v) => ({ id: v.tech, w: Math.max(0, v.weight + (f.mods.rollWeights[v.tech] ?? 0) + (low ? (f.mods.lowHpRollWeights[v.tech] ?? 0) : 0)) }))
    .filter((v) => v.w > 0);
  const spin = () => {
    let x = rng() * opts.reduce((a, v) => a + v.w, 0);
    return opts.find((v) => (x -= v.w) < 0) ?? opts[opts.length - 1] ?? { id: tech.roll![0]!.tech, w: 0 };
  };
  const first = spin();
  if (!f.mods.rollTwice) return first.id;
  // Gira duas vezes e fica com a que vem depois na lista da técnica (do sapo mais fraco ao mais forte).
  const second = spin();
  const order = (id: string) => tech.roll!.findIndex((v) => v.tech === id);
  return order(second.id) > order(first.id) ? second.id : first.id;
}

/** Efeitos da técnica nos alvos (depois de pagar o custo). */
function resolveEffects(s: JBattle, f: Fighter, tech: JTechnique, targets: Fighter[], data: JornadaData, rng: Rng): void {
  const j = data.j.combat;
  if (tech.boost) {
    // Ativa não gasta o turno: o da ativação já conta como um dos turnos do fortalecimento.
    f.boost = { ...tech.boost, techId: tech.id };
    s.log.push({ type: 'boost', uid: f.uid, techId: tech.id, turns: tech.boost.turns });
  }
  if (tech.clones) {
    // Tipo novo: os clones que já existiam viram do tipo novo (todos de um tipo só) e o desgaste zera.
    const kind = tech.cloneKind ?? 'kage';
    if (kind !== f.cloneKind) f.cloneWear = 0;
    f.cloneKind = kind;
    f.clones = Math.min(j.maxClones + f.mods.maxClonesBonus, f.clones + tech.clones + f.mods.extraClones);
    s.log.push({ type: 'clones', uid: f.uid, total: f.clones });
  }
  for (const t of targets) {
    if (tech.reviveHpPct) {
      reviveFighter(s, f, t, tech.reviveHpPct);
      continue;
    }
    if (tech.baseDamage > 0) strike(s, f, t, tech, data, rng);
    else if (tech.onHit && t.side !== f.side) applyStatus(s, f, t, tech, data, rng);
    if (t.down) continue;
    if (tech.healHp) heal(s, f, t, Math.floor(tech.healHp * f.mods.healMult));
    if (tech.shieldPct && tech.barrier) {
      // Barreira elemental: substitui a que estava de pé; vale pelos `barrier.turns` turnos seguintes de quem recebe
      // (+1 quando quem ergue é o próprio alvo: o fim deste turno já desconta).
      const nature = tech.kekkeiGenkai ?? tech.element;
      const specials = tech.element ? (data.base.barrierSpecials[tech.element] ?? {}) : {};
      const turns = data.base.barrier.turns + (t === f ? 1 : 0);
      t.barrier = raiseBarrier(tech.id, { pct: tech.shieldPct, ...specials }, f.maxHp, nature, turns);
      s.log.push({ type: 'barrier', uid: t.uid, action: 'raise', techId: tech.id, points: t.barrier.points });
    } else if (tech.shieldPct) {
      const amount = Math.floor(f.maxHp * tech.shieldPct);
      t.shield += amount;
      s.log.push({ type: 'shield', uid: f.uid, target: t.uid, amount });
    }
    if (tech.cleanse && t.effects.some((e) => CLEANSED.includes(e.kind))) {
      t.effects = t.effects.filter((e) => !CLEANSED.includes(e.kind));
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
  const hits = hitsOf(f, tech);
  // Clones só seguram golpe de alvo único; técnica em área passa por eles.
  const single = tech.target !== 'allEnemies';
  let landed = 0;
  for (let i = 0; i < hits && !t.down && !f.down && s.status === 'ongoing'; i++) {
    const chance = accuracyAgainst(f, t, tech, data);
    // Um sorteio só: abaixo do crítico é crítico, abaixo do acerto é acerto (crítico contido no acerto).
    const r = rng();
    const gateCrit = f.gate ? gateTotals(f.gate.level, data).critBonus : 0;
    // Mestre da trapaça: quem acerta um alvo atordoado acerta em cheio.
    // Tirar os pesos (prodígio): o primeiro golpe da luta que acerta é crítico.
    const opener = f.mods.openingCrit && !f.openerUsed;
    if (opener) f.openerUsed = true;
    const sureCrit = (f.mods.stunnedAlwaysCrit && hasEffect(t, 'stun')) || opener;
    const outcome = r < (sureCrit ? chance : critChance((tech.critBonus ?? 0) + f.mods.critBonus + gateCrit, data.base.crit, chance)) ? 'crit' : r < chance ? 'hit' : 'miss';
    if (outcome === 'miss') {
      s.log.push({ type: 'miss', uid: f.uid, target: t.uid });
      continue;
    }
    // Leitura total (Uchiha): com o Sharingan ligado, chance de anular o golpe (e, com a Leitura de lâminas, revidar).
    if (single && sharinganOn(t) && t.mods.readNullChance > 0 && rng() < t.mods.readNullChance) {
      s.log.push({ type: 'miss', uid: f.uid, target: t.uid });
      if (t.mods.readCounterDamage > 0 && !f.down) {
        s.log.push({ type: 'damage', uid: t.uid, target: f.uid, amount: t.mods.readCounterDamage, crit: false, elementMult: 1, absorbed: 0 });
        applyHpLoss(s, f, t.mods.readCounterDamage, data);
      }
      continue;
    }
    if (cloneBlocks(s, f, t, single, data, rng)) continue;
    landed++;
    if (outcome === 'crit' && f.mods.critChakra > 0) {
      const gain = Math.min(f.maxChakra - f.chakra, f.mods.critChakra);
      f.chakra += gain;
      if (gain > 0) s.log.push({ type: 'chakraGain', uid: f.uid, amount: gain });
    }
    // Combo da Folha: cada golpe de taijutsu seguido que acerta bate mais forte (+10% por golpe, até +30%).
    const combo = tech.type === 'taijutsu' && f.mods.comboStepPct > 0 ? 1 + Math.min(COMBO_MAX, f.mods.comboStepPct * (landed - 1)) : 1;
    const stunnedBefore = hasEffect(t, 'stun');
    const raw = Math.floor(hitDamage(f, t, tech, data, outcome === 'crit') * combo);
    // Barreira elemental primeiro (o elemento só pesa nela), depois o escudo comum.
    const bMult = elementMult(tech, t, data, f);
    const amount = hitBarrier(s, t, raw, barrierAttack(f, tech), data, rng);
    const absorbed = Math.min(t.shield, amount);
    t.shield -= absorbed;
    s.log.push({ type: 'damage', uid: f.uid, target: t.uid, amount: amount - absorbed, crit: outcome === 'crit', elementMult: bMult, absorbed: absorbed + raw - amount });
    const hpBefore = t.hp;
    applyHpLoss(s, t, amount - absorbed, data, tech.id);
    // Rasengan que atravessa: o dano que sobrou do golpe fatal passa para o próximo inimigo de pé (uma vez, sem corrente).
    const spill = t.down ? Math.floor((amount - absorbed - hpBefore) * (f.mods.techOverflow[tech.id] ?? 0)) : 0;
    const nextFoe = spill > 0 && s.status === 'ongoing' ? alive(s, t.side).find((x) => x.uid !== t.uid) : undefined;
    if (nextFoe) {
      const soaked = Math.min(nextFoe.shield, spill);
      nextFoe.shield -= soaked;
      s.log.push({ type: 'damage', uid: f.uid, target: nextFoe.uid, amount: spill - soaked, crit: false, elementMult: 1, absorbed: soaked });
      applyHpLoss(s, nextFoe, spill - soaked, data, tech.id);
    }
    // Explosão em cadeia (Comum): ninjutsu em alvo atordoado espalha parte do dano nos outros inimigos.
    // Chuva de shuriken (Uchiha): a técnica de arma acerta também os outros inimigos com uma fração do dano.
    const splashPct = (stunnedBefore && tech.type === 'ninjutsu' ? f.mods.stunnedSplashPct : 0) + (f.mods.techSplash[tech.id] ?? 0);
    if (splashPct > 0 && s.status === 'ongoing') {
      const splash = Math.floor((amount - absorbed) * splashPct);
      for (const o of splash > 0 ? alive(s, t.side).filter((x) => x.uid !== t.uid) : []) {
        s.log.push({ type: 'damage', uid: f.uid, target: o.uid, amount: splash, crit: false, elementMult: 1, absorbed: 0 });
        applyHpLoss(s, o, splash, data, tech.id);
        if (s.status !== 'ongoing') break;
      }
    }
    if (t.down && f.mods.onKillChakra) {
      const amount = Math.min(f.maxChakra - f.chakra, f.mods.onKillChakra);
      f.chakra += amount;
      if (amount > 0) s.log.push({ type: 'chakraGain', uid: f.uid, amount });
    }
    if (!t.down) tryEffect(s, f, t, tech, data, rng);
    // Prisão (Uchiha): as ilusões podem atordoar.
    if (!t.down && tech.type === 'genjutsu' && f.mods.genjutsuStunChance > 0 && s.status === 'ongoing' && rng() < f.mods.genjutsuStunChance) addStatus(s, t, 'stun', data);
    // Contra-ataque (prodígio): quem apanha de golpe de alvo único pode revidar na hora (perda de HP direta).
    if (single && !t.down && !f.down && t.mods.counterChance > 0 && s.status === 'ongoing' && rng() < t.mods.counterChance) {
      s.log.push({ type: 'damage', uid: t.uid, target: f.uid, amount: t.mods.counterDamage, crit: false, elementMult: 1, absorbed: 0 });
      applyHpLoss(s, f, t.mods.counterDamage, data);
    }
    // Incenso dos sonhos: cada golpe que acerta pode dar Medo.
    if (!t.down && f.mods.fearOnHit > 0 && s.status === 'ongoing' && rng() < f.mods.fearOnHit) addStatus(s, t, 'fear', data);
  }
  // Ritmo de luta (Comum): cada golpe de taijutsu que acertou devolve chakra.
  if (landed && tech.type === 'taijutsu' && f.mods.taijutsuHitChakra > 0 && !f.down) {
    const gain = Math.min(f.maxChakra - f.chakra, landed * f.mods.taijutsuHitChakra);
    f.chakra += gain;
    if (gain > 0) s.log.push({ type: 'chakraGain', uid: f.uid, amount: gain });
  }
  // Clones que batem junto (Mizu, Mokuton): cada um, uma fração do dano de um golpe, sem rolagem; a soma não passa do
  // teto (`clones.strikeCap`, 70% de um golpe). Kage e Tajuu batem pelas técnicas com golpe por clone (`hitsPerClone`).
  // Clone de ataque e Sombra da Folha (Comum): o clone de qualquer tipo bate com pelo menos `cloneStrikePct`.
  const kind = data.base.clones.kinds[f.cloneKind];
  const pct = Math.min(Math.max(kind.jornadaStrikePct ?? kind.strikePct, f.mods.cloneStrikePct) * f.clones, data.base.clones.strikeCap);
  if (landed && single && f.clones > 0 && pct > 0 && !t.down && !f.down && s.status === 'ongoing') {
    const amount = Math.max(1, Math.floor(hitDamage(f, t, tech, data) * pct));
    const passes = hitBarrier(s, t, amount, barrierAttack(f, tech), data, rng);
    const absorbed = Math.min(t.shield, passes);
    t.shield -= absorbed;
    s.log.push({ type: 'cloneStrike', uid: f.uid, target: t.uid, amount: passes - absorbed });
    applyHpLoss(s, t, passes - absorbed, data, tech.id);
  }
}

/**
 * O golpe de alvo único cai num clone? (técnica em área passa por eles.) O clone se gasta pelo tipo (o Doton aguenta
 * 2); ao se desfazer, o do raio dá uma descarga em quem bateu e o de areia pode bloquear o chakra dele.
 */
function cloneBlocks(s: JBattle, f: Fighter, t: Fighter, single: boolean, data: JornadaData, rng: Rng): boolean {
  if (!single || t.clones <= 0) return false;
  const rules = data.base.clones;
  const kind = rules.kinds[t.cloneKind];
  // Exército de sombras: com clone ativo, o golpe de alvo único cai sempre nele (sem sorteio).
  if (!t.mods.cloneShield && rng() >= kind.blockChance) return false;
  const worn = wearClone(t.cloneWear, t.cloneKind, rules);
  t.cloneWear = worn.wear;
  if (worn.broken) t.clones--;
  s.log.push({ type: 'cloneBlock', target: t.uid, left: t.clones, kind: t.cloneKind, ...(worn.broken ? { broken: true } : {}) });
  // Um contra-ataque por golpe: o do talento ou relíquia (`cloneCounter`) e a descarga do clone de raio não somam;
  // vale o maior. É perda de HP direta (não é golpe), então não aciona clones nem barreiras de novo.
  const brk = worn.broken ? kind.onBreak : undefined;
  const discharge = brk?.damagePct ? Math.max(1, Math.floor(f.maxHp * brk.damagePct)) : 0;
  const counter = Math.max(t.mods.cloneCounter, discharge);
  if (counter > 0 && !f.down && s.status === 'ongoing') {
    s.log.push({ type: 'damage', uid: t.uid, target: f.uid, amount: counter, crit: false, elementMult: 1, absorbed: 0 });
    applyHpLoss(s, f, counter, data);
  }
  if (brk?.effect && !f.down && s.status === 'ongoing' && rng() < (brk.chance ?? 1)) addStatus(s, f, brk.effect, data);
  return true;
}

/** Aplica um efeito fora de técnica (descarga do clone de raio, areia que prende), com a trava e as imunidades. */
function addStatus(s: JBattle, t: Fighter, effect: 'stun' | 'chakraBlock' | 'fear', data: JornadaData): void {
  if (effect === 'fear' && fearImmune(t, data)) {
    s.log.push({ type: 'resist', target: t.uid, effect });
    return;
  }
  if (effect === 'stun' && hasEffect(t, 'stunGuard')) {
    s.log.push({ type: 'resist', target: t.uid, effect });
    return;
  }
  const turns = effectDuration(effect, data.base.effects);
  const prev = t.effects.find((e) => e.kind === effect);
  if (prev) prev.turns = Math.max(prev.turns, turns);
  else t.effects.push({ kind: effect, turns });
  s.log.push({ type: 'effect', target: t.uid, effect, turns });
}

/** A barreira do alvo recebe o golpe; devolve o que passa (para o escudo comum e o HP). */
function hitBarrier(s: JBattle, t: Fighter, amount: number, atk: BarrierAttack, data: JornadaData, rng: Rng): number {
  const b = t.barrier;
  if (!b || amount <= 0) return amount;
  const r = absorbIntoBarrier(b, amount, atk, barrierCtx(data));
  if (r.absorbed <= 0) return r.passes;
  s.log.push({ type: 'barrier', uid: t.uid, action: 'hit', techId: b.techId, absorbed: r.absorbed, left: b.points, mult: r.mult });
  // Parede d'Água que absorve fogo apaga a queimadura de quem está atrás dela.
  if (r.douse && hasEffect(t, 'burn')) {
    t.effects = t.effects.filter((e) => e.kind !== 'burn');
    s.log.push({ type: 'barrier', uid: t.uid, action: 'douse', techId: b.techId });
  }
  if (r.broken) {
    t.barrier = null;
    s.log.push({ type: 'barrier', uid: t.uid, action: 'break', techId: b.techId });
  }
  // Muralha de Chamas: o atacante de taijutsu pode queimar (quem bate é o lutador da vez).
  const attacker = s.order[s.turnIndex] ? fighter(s, s.order[s.turnIndex]!) : null;
  if (r.touched && attacker && attacker.side !== t.side && rng() < (b.burnOnTouch ?? 0)) {
    const turns = effectDuration('burn', data.base.effects);
    const prev = attacker.effects.find((e) => e.kind === 'burn');
    if (prev) prev.turns = Math.max(prev.turns, turns);
    else attacker.effects.push({ kind: 'burn', turns });
    s.log.push({ type: 'effect', target: attacker.uid, effect: 'burn', turns });
  }
  return r.passes;
}

/** Controle é o que tira ação: atordoar (perde a vez) e bloqueio de chakra (só taijutsu). */
export const isControl = (e: JEffect) => isControlKind(e);

/** O que Kai, Palma mística e Grito de guerra tiram. */
const CLEANSED: JEffect[] = ['stun', 'chakraBlock', 'fear'];

/** Turnos do efeito da técnica (a regra comum, src/core/effects.ts); controle dura no mínimo `minControlTurns`. */
export function effectTurns(tech: JTechnique, data: JornadaData): number {
  const on = tech.onHit;
  if (!on || on.effect === 'stunGuard') return 0;
  return effectDuration(on.effect, data.base.effects, on.turns);
}

function tryEffect(s: JBattle, f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData, rng: Rng): void {
  const on = tech.onHit;
  if (!on || t.down || rng() >= on.chance + f.mods.effectChanceBonus) return;
  // A trava de quem acabou de sair de um atordoamento segura o próximo; Uchiha e jinchuuriki não sentem Medo.
  if ((on.effect === 'stun' && hasEffect(t, 'stunGuard')) || (on.effect === 'fear' && fearImmune(t, data))) {
    s.log.push({ type: 'resist', target: t.uid, effect: on.effect });
    return;
  }
  const turns = effectTurns(tech, data) + f.mods.effectTurnsBonus;
  const prev = t.effects.find((e) => e.kind === on.effect);
  // Fogo que não apaga (Uchiha): a queimadura de quem tem `burnMult` dói mais.
  const mult = on.effect === 'burn' && f.mods.burnMult > 1 ? f.mods.burnMult : undefined;
  if (prev) {
    prev.turns = Math.max(prev.turns, turns);
    if (mult) prev.mult = Math.max(prev.mult ?? 1, mult);
  } else t.effects.push({ kind: on.effect, turns, ...(mult ? { mult } : {}) });
  s.log.push({ type: 'effect', target: t.uid, effect: on.effect, turns });
}

/** Perde HP e confere o fim; depois, o roteiro (HP abaixo de X%, alguém caiu). `techId`: o golpe que causou. */
function applyHpLoss(s: JBattle, t: Fighter, amount: number, data: JornadaData, techId?: string): void {
  lose(s, t, amount, data, techId);
  script(s, data);
}

function lose(s: JBattle, t: Fighter, amount: number, data: JornadaData, techId?: string): void {
  if (amount <= 0) return;
  t.hp = Math.max(0, t.hp - amount);
  // Finalizador: o alvo só cai com a técnica certa; outro golpe fatal deixa 1 de HP.
  const w = s.win;
  if (t.hp === 0 && w.kind === 'finisher' && t.side === 'enemy' && t.defId === w.target && techId !== w.technique) {
    t.hp = 1;
    s.log.push({ type: 'endure', target: t.uid, technique: w.technique });
    return checkEnd(s);
  }
  if (t.hp > 0) return checkEnd(s);
  if (t.mods.surviveOnce && !t.survivedOnce) {
    t.survivedOnce = true;
    t.hp = 1;
    s.log.push({ type: 'survive', target: t.uid });
    // Vontade do Fogo (Comum): fica de pé com parte do HP e firme; Nunca sozinho: a equipe se recupera junto.
    if (t.mods.surviveHealPct > 0) {
      heal(s, t, t, Math.floor(t.maxHp * t.mods.surviveHealPct));
      if (!hasEffect(t, 'stunGuard')) t.effects.push({ kind: 'stunGuard', turns: data.base.effects.stunImmunityTurns });
    }
    if (t.mods.surviveTeamHealPct > 0) for (const a of alive(s, t.side)) if (a.uid !== t.uid) heal(s, t, a, Math.floor(a.maxHp * t.mods.surviveTeamHealPct));
    // Fúria da Kyuubi: em vez de cair, o chakra da raposa toma conta (a forma da ficha, com a cura e os turnos dela).
    const form = t.mods.surviveForm ? formOf(t.defId, t.mods.surviveForm, data) : undefined;
    if (form && !hasForm(t, form.id)) {
      applyForm(t, form);
      s.log.push({ type: 'form', uid: t.uid, form: form.id });
    }
    return;
  }
  t.down = true;
  t.effects = [];
  t.clones = 0;
  t.cloneWear = 0;
  t.shield = 0;
  t.barrier = null;
  t.guarding = false;
  t.boost = null;
  t.gate = null;
  s.log.push({ type: 'down', target: t.uid });
  for (const x of alive(s, t.side)) if (x.mods.vengeanceMult > 1) x.vengeful = true;
  // Lição do mestre (prodígio): uma vez por luta, quando alguém da equipe cai, os de pé ganham dano por 3 turnos.
  const mentor = alive(s, t.side).find((x) => x.mods.fallenRally > 0 && !x.rallied);
  if (mentor) {
    mentor.rallied = true;
    for (const x of alive(s, t.side)) {
      x.boost = { damageMult: 1 + mentor.mods.fallenRally, turns: RALLY_TURNS, techId: 'masterLesson' };
      s.log.push({ type: 'boost', uid: x.uid, techId: 'masterLesson', turns: RALLY_TURNS });
    }
  }
  // Pílula na bolsa levanta o protagonista sozinha, antes de conferir a derrota (vale lutando solo).
  if (t.protagonist && s.pills > 0) {
    s.pills--;
    reviveFighter(s, t, t, s.pillHpPct, 'pill');
    return;
  }
  checkEnd(s);
}

function heal(s: JBattle, f: Fighter, t: Fighter, amount: number): void {
  const real = clamp(amount, 0, t.maxHp - t.hp);
  if (real <= 0) return;
  t.hp += real;
  s.log.push({ type: 'heal', uid: f.uid, target: t.uid, amount: real });
}

function reviveFighter(s: JBattle, f: Fighter, t: Fighter, pct: number, how?: 'pill' | 'raise'): void {
  t.down = false;
  t.hp = Math.max(1, Math.floor(t.maxHp * Math.min(1, pct + t.mods.reviveHpBonus)));
  s.log.push({ type: 'revive', uid: f.uid, target: t.uid, hp: t.hp, ...(how ? { [how]: true } : {}) });
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
  // Quem saiu pelo roteiro (a Sakura protegendo o Tazuna) volta de pé, com o HP que tinha.
  return s.fighters.filter((f) => f.side === 'ally' && !f.guest).map((f) => ({ defId: f.defId, hp: f.hp, chakra: f.chakra, down: f.down && !f.gone }));
}

export type { JEvent };
