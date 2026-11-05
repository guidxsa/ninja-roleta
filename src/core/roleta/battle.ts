// Combate do Roleta enxuto (docs/roleta/combate.md). Funções puras: estado entra, estado sai; o log de eventos é o que
// a interface anima. Um toque por turno: técnica, Defender, Concentrar ou Item; a ativa da linhagem é grátis.
// Sem reações, sem disputa de ninjutsu, sem barreiras nem multiplicador de elemento. Quatro efeitos com duração fixa.
import { damage } from '../damage';
import { critChance, hitChance, rollHit, type HitOutcome } from '../hit';
import { rollInitiative, initiativeChance } from '../initiative';
import { clamp, type Rng } from '../rng';
import type { AttackType, ConsumableId, ResistanceKind, VillainDef, VillainTechnique } from '../types';
import type { PlayerState } from '../player';
import type { RoletaData } from './data';
import type { REffectKind, RTechniqueDef } from '../../data/roleta/techniques';
import type { RActive } from '../../data/roleta/kits';

export type Side = 'player' | 'villain';

export interface REffect {
  kind: REffectKind;
  turns: number;
}

/** Próxima ação do vilão (a interface só mostra para o Nara). */
export type RIntent = { kind: 'tech'; id: string } | { kind: 'rest' };

export interface RVillain {
  /** Ficha já com a dificuldade (e o ciclo) aplicada. */
  def: VillainDef;
  hp: number;
  maxHp: number;
  chakra: number;
  effects: REffect[];
  techniques: VillainTechnique[];
  intent: RIntent | null;
  /** Perde a próxima ação (Selamento, Transferência de Mente, Enganador). */
  skipNext: 'seal' | 'mind' | 'trickster' | null;
  survived: boolean;
  counterCrit: boolean;
  mistTurns: number;
  lastStand: boolean;
  cloakTurns: number;
  cloakUsed: boolean;
  monster: boolean;
  revivesUsed: number;
}

export interface RPlayerFx {
  effects: REffect[];
  /** Usos da ativa que sobram nesta luta. */
  activeUses: number;
  /** Fortalecimento da ativa em andamento (turnos contando o da ativação). */
  buff: { kind: RActive; turns: number } | null;
  guarding: boolean;
  /** Bomba de fumaça: esquiva garantida do próximo ataque. */
  dodgeNext: boolean;
  shield: number;
  cloakTurns: number;
  cloakUsed: boolean;
  vitalTurns: number;
  vitalUsed: boolean;
}

export type RAction = `tech:${string}` | 'guard' | 'rest' | `item:${ConsumableId}`;

export type REvent =
  | { type: 'initiative'; playerFirst: boolean; chance: number; forced: boolean }
  | { type: 'round'; round: number }
  | { type: 'attack'; side: Side; techId: string; hitChance: number; critChance: number; outcome: HitOutcome; hits: number; auto?: boolean }
  | { type: 'damage'; side: Side; amount: number; crit?: boolean; source: 'attack' | 'burn' | 'poison' | 'toad' | 'dog' | 'tag' | 'self' | 'gates' }
  | { type: 'shield'; side: Side; absorbed: number }
  | { type: 'heal'; side: Side; amount: number; source: string }
  | { type: 'effect'; side: Side; kind: REffectKind; turns: number }
  | { type: 'skip'; side: Side; reason: 'stun' | 'seal' | 'mind' | 'trickster' }
  | { type: 'dodge'; side: Side }
  | { type: 'rest'; side: Side; amount: number }
  | { type: 'guard' }
  | { type: 'item'; id: ConsumableId }
  | { type: 'active'; kind: RActive; success: boolean; chance?: number }
  | { type: 'passive'; side: Side; kind: string }
  | { type: 'revive'; side: Side; source: 'willOfFire' | 'insane' }
  | { type: 'end'; status: 'won' | 'lost' };

export interface RBattleOptions {
  playerStartsFirst?: boolean;
  villainStartsFirst?: boolean;
  /** Vontade do Fogo pode levantar o jogador. */
  allowRevive: boolean;
}

export interface RBattle {
  player: PlayerState;
  villain: RVillain;
  fx: RPlayerFx;
  round: number;
  playerFirst: boolean;
  status: 'ongoing' | 'won' | 'lost';
  log: REvent[];
  options: RBattleOptions;
  /** A ativa da linhagem já foi usada neste turno. */
  activeUsed: boolean;
}

// ---------------------------------------------------------------------------
// Início

export function startRoletaBattle(player: PlayerState, def: VillainDef, options: Partial<RBattleOptions>, data: RoletaData, rng: Rng): RBattle {
  const b = data.r;
  const kit = kitOf(player, data);
  const passive = def.passive;
  const villain: RVillain = {
    def,
    hp: def.hp,
    maxHp: def.hp,
    chakra: def.chakra,
    effects: [],
    techniques: def.techniques.filter((t) => t.barrier === undefined),
    intent: null,
    skipNext: null,
    survived: false,
    counterCrit: false,
    mistTurns: passive?.kind === 'mist' ? passive.turns : 0,
    lastStand: false,
    cloakTurns: 0,
    cloakUsed: false,
    monster: false,
    revivesUsed: 0,
  };
  const s: RBattle = {
    player: { ...player, hp: Math.max(1, player.hp) },
    villain,
    fx: {
      effects: [],
      activeUses: kit.active ? b.kits.uses[kit.active] ?? 1 : 0,
      buff: null,
      guarding: false,
      dodgeNext: false,
      shield: player.kekkeiGenkai === 'sand' ? Math.floor(player.maxHp * b.sandShieldPct) : 0,
      cloakTurns: 0,
      cloakUsed: false,
      vitalTurns: 0,
      vitalUsed: false,
    },
    round: 0,
    playerFirst: true,
    status: 'ongoing',
    log: [],
    options: { allowRevive: true, ...options },
    activeUsed: false,
  };
  // Marca da maldição desde o começo (hardcore).
  if (passive?.kind === 'cloak' && passive.fromStart) openVillainCloak(s);
  const forced = Boolean(options.playerStartsFirst || options.villainStartsFirst);
  const chance = initiativeChance(effectiveSpeed(s, 'player', data), def.speed);
  s.playerFirst = options.playerStartsFirst ? true : options.villainStartsFirst ? false : rollInitiative(effectiveSpeed(s, 'player', data), def.speed, rng) === 'a';
  s.log.push({ type: 'initiative', playerFirst: s.playerFirst, chance, forced });
  s.villain.intent = rollIntent(s, rng);
  return s;
}

const clone = (s: RBattle): RBattle => structuredClone(s);

export const kitOf = (p: PlayerState, data: RoletaData) => data.kits[p.origin.lineageId ?? 'common'] ?? data.kits.common!;

// ---------------------------------------------------------------------------
// Números da luta

/** Dano base de uma técnica do jogador no nível atual (mais a Ferramenta ninja). */
export function techBase(p: PlayerState, t: RTechniqueDef, data: RoletaData): number {
  return t.base + t.perLevel * (p.level - 1) + p.ninjaToolLevel * data.base.balance.ninjaTool.baseDamagePerLevel;
}

const buff = (s: RBattle, kind: RActive) => s.fx.buff?.kind === kind && s.fx.buff.turns > 0;
const has = (effects: REffect[], kind: REffectKind) => effects.some((e) => e.kind === kind && e.turns > 0);

export function effectiveSpeed(s: RBattle, side: Side, data: RoletaData): number {
  if (side === 'villain') return s.villain.def.speed;
  return s.player.speed + (buff(s, 'beast') ? data.r.kits.beast.speed : 0);
}

/** Ataque do jogador no tipo, com Esforço, Sharingan e o manto do jinchuuriki. */
export function playerOffense(s: RBattle, type: AttackType, data: RoletaData): number {
  const k = data.r.kits;
  let v = s.player.offense[type];
  if (buff(s, 'effort')) v += k.effort.offense;
  if (buff(s, 'sharingan')) v += k.sharingan.offense;
  if (s.fx.cloakTurns > 0) v *= data.r.cloak.offenseMult;
  return v;
}

function playerResistance(s: RBattle, kind: ResistanceKind, data: RoletaData): number {
  return s.player.resistance[kind] + (kind === 'physical' && buff(s, 'expansion') ? data.r.kits.expansion.physical : 0);
}

function villainResistance(s: RBattle, kind: ResistanceKind): number {
  const p = s.villain.def.passive;
  const cloakOn = p?.kind === 'cloak' && (s.villain.cloakTurns > 0 || s.villain.monster);
  return s.villain.def.resistance[kind] * (cloakOn ? p.cloak.resistanceMult : 1);
}

const resistanceKind = (type: AttackType): ResistanceKind => (type === 'genjutsu' ? 'mental' : 'physical');

/** Esquiva (antiga Substituição): base + diferença de speed × fator, entre 0 e o teto. */
export function dodgeChance(defenderSpeed: number, attackerSpeed: number, data: RoletaData): number {
  const d = data.r.dodge;
  return clamp(d.base + (defenderSpeed - attackerSpeed) * d.perSpeed, 0, d.max);
}

/** Chances do golpe do jogador (para a interface mostrar e para rolar). */
export function playerAttackOdds(s: RBattle, t: RTechniqueDef, data: RoletaData): { hit: number; crit: number; auto: boolean } {
  const cfg = data.base.balance;
  const k = data.r.kits;
  const auto = t.type === 'taijutsu' && buff(s, 'byakugan');
  let bonus = buff(s, 'sharingan') ? k.sharingan.accuracy : 0;
  if (has(s.fx.effects, 'fear')) bonus += data.r.effects.fear.accuracy;
  bonus -= dodgeChance(s.villain.def.speed, effectiveSpeed(s, 'player', data), data);
  let hit = auto ? 1 : hitChance(t.accuracy, bonus, cfg.hit);
  // Névoa (Zabuza): a chance de erro do jogador × evasionMult.
  const p = s.villain.def.passive;
  if (!auto && p?.kind === 'mist' && s.villain.mistTurns > 0) hit = clamp(1 - (1 - hit) * p.evasionMult, cfg.hit.min, cfg.hit.max);
  const critImmune = p?.kind === 'insane' && p.critImmune;
  const youth = kitOf(s.player, data).passive === 'youth' ? data.r.passives.youthCrit : 0;
  const crit = critImmune ? 0 : critChance(s.player.critBonus + (t.critBonus ?? 0) + youth, cfg.crit, hit);
  return { hit, crit, auto };
}

/** Multiplicador extra do golpe do jogador (Corpo pesado, Expansão, Portões, Medo). */
function playerExtraMult(s: RBattle, t: RTechniqueDef, data: RoletaData): number {
  const k = data.r.kits;
  let m = 1;
  if (t.type === 'taijutsu') {
    if (kitOf(s.player, data).passive === 'heavyBody') m *= data.r.passives.heavyBodyMult;
    if (buff(s, 'expansion')) m *= k.expansion.taijutsuMult;
    if (buff(s, 'gates')) m *= k.gates.taijutsuMult;
  }
  if (has(s.fx.effects, 'fear')) m *= data.r.effects.fear.damageMult;
  return m;
}

/** Dano por golpe da técnica do jogador (sem crítico), para a interface e para o golpe. */
export function playerHitDamage(s: RBattle, t: RTechniqueDef, data: RoletaData, critMult = 1): number {
  const pen = (t.penetration ?? 0) + (t.type === 'taijutsu' && kitOf(s.player, data).passive === 'preciseFist' ? data.r.passives.preciseFistPen : 0);
  return damage({
    baseDamage: techBase(s.player, t, data),
    offense: playerOffense(s, t.type, data),
    resistance: villainResistance(s, resistanceKind(t.type)),
    fraction: data.r.resistance.passive,
    penetration: Math.min(data.base.balance.penetration.max, pen),
    elementMult: 1,
    critMult,
    extraMult: playerExtraMult(s, t, data),
  });
}

/** Técnicas que o jogador pode usar agora (com chakra). */
export const canUseTechnique = (s: RBattle, t: RTechniqueDef) => s.player.chakra >= t.chakra;

// ---------------------------------------------------------------------------
// Ativa da linhagem (grátis, uma por turno)

export function canUseActive(s: RBattle, data: RoletaData): boolean {
  const kit = kitOf(s.player, data);
  return s.status === 'ongoing' && Boolean(kit.active) && s.fx.activeUses > 0 && !s.activeUsed && !s.fx.buff;
}

export function useActive(prev: RBattle, data: RoletaData, rng: Rng): RBattle {
  if (!canUseActive(prev, data)) throw new Error('ativa indisponível');
  const s = clone(prev);
  const kind = kitOf(s.player, data).active!;
  const k = data.r.kits;
  s.activeUsed = true;
  s.fx.activeUses--;
  const timed = (turns: number) => (s.fx.buff = { kind, turns });
  switch (kind) {
    case 'effort':
      timed(k.effort.turns);
      break;
    case 'expansion':
      timed(k.expansion.turns);
      break;
    case 'beast':
      timed(k.beast.turns);
      break;
    case 'sharingan':
      timed(k.sharingan.turns);
      break;
    case 'byakugan':
      timed(k.byakugan.turns);
      break;
    case 'plague':
      timed(k.plague.turns);
      addEffect(s, 'villain', 'poison', data);
      break;
    case 'gates': {
      timed(k.gates.turns);
      const cost = Math.floor(s.player.maxHp * k.gates.hpCostPct);
      s.player.hp = Math.max(1, s.player.hp - cost);
      s.log.push({ type: 'damage', side: 'player', amount: cost, source: 'gates' });
      break;
    }
    case 'shadow': {
      const ok = rng() < k.shadow.chance;
      s.log.push({ type: 'active', kind, success: ok, chance: k.shadow.chance });
      if (ok) addEffect(s, 'villain', 'stun', data);
      return s;
    }
    case 'mindTransfer': {
      const immune = genjutsuImmune(s);
      const chance = immune ? 0 : k.mindTransfer.chance;
      const ok = rng() < chance;
      s.log.push({ type: 'active', kind, success: ok, chance });
      if (ok) {
        // O vilão perde a vez e se fere com a técnica de dano mais forte que tem.
        s.villain.skipNext = 'mind';
        const strongest = [...s.villain.techniques].filter((t) => t.baseDamage > 0).sort((a, b) => b.baseDamage - a.baseDamage)[0];
        if (strongest) {
          const amount = damage({
            baseDamage: strongest.baseDamage,
            offense: s.villain.def.offense[strongest.type],
            resistance: villainResistance(s, resistanceKind(strongest.type)),
            fraction: data.r.resistance.passive,
            elementMult: 1,
            critMult: 1,
          });
          hurtVillain(s, amount, 'self', data, rng);
        }
      }
      return s;
    }
    case 'seal':
      s.villain.skipNext = 'seal';
      break;
  }
  s.log.push({ type: 'active', kind, success: true });
  return s;
}

// ---------------------------------------------------------------------------
// Rodada

export function playRoletaRound(prev: RBattle, action: RAction, data: RoletaData, rng: Rng): RBattle {
  if (prev.status !== 'ongoing') throw new Error('a luta acabou');
  const s = clone(prev);
  s.round++;
  s.log.push({ type: 'round', round: s.round });
  startOfRound(s, data);
  const order: Side[] = s.playerFirst ? ['player', 'villain'] : ['villain', 'player'];
  for (const side of order) {
    if (s.status !== 'ongoing') break;
    if (side === 'player') playerTurn(s, action, data, rng);
    else villainTurn(s, data, rng);
  }
  if (s.status === 'ongoing') endOfRound(s, data, rng);
  return s;
}

function startOfRound(s: RBattle, data: RoletaData): void {
  const r = data.r;
  // Regeneração de chakra (silenciosa).
  const regen = (max: number) => Math.max(r.chakraRegen.min, Math.floor(max * r.chakraRegen.pct));
  s.player.chakra = Math.min(s.player.maxChakra, s.player.chakra + regen(s.player.maxChakra));
  s.villain.chakra = Math.min(s.villain.def.chakra, s.villain.chakra + regen(s.villain.def.chakra));
  const kit = kitOf(s.player, data);
  // Senju: Força vital (1 vez por luta, abaixo do limiar).
  if (kit.passive === 'vitalForce' && !s.fx.vitalUsed && s.player.hp < s.player.maxHp * r.passives.vitalForce.belowPct) {
    s.fx.vitalUsed = true;
    s.fx.vitalTurns = r.passives.vitalForce.turns;
    s.log.push({ type: 'passive', side: 'player', kind: 'vitalForce' });
  }
  // Jinchuuriki: manto abaixo do limiar, 1 vez por luta.
  if (s.player.jinchuuriki && !s.fx.cloakUsed && s.player.hp < s.player.maxHp * r.cloak.belowPct) {
    s.fx.cloakUsed = true;
    s.fx.cloakTurns = r.cloak.turns;
    s.log.push({ type: 'passive', side: 'player', kind: 'cloak' });
  }
  let healPct = 0;
  if (kit.passive === 'vitality') healPct += r.passives.vitalityPct;
  if (s.fx.vitalTurns > 0) healPct += r.passives.vitalForce.regenPct;
  if (s.player.summon?.animal === 'slug') healPct += r.summons.slugPct + r.summons.slugPerLevel * (s.player.summon.level - 1);
  if (healPct > 0) healPlayer(s, Math.floor(s.player.maxHp * healPct), kit.passive === 'vitality' ? 'vitality' : 'regen');
  // Vilão: manto abaixo do limiar e regeneração dele.
  const vp = s.villain.def.passive;
  if (vp?.kind === 'cloak' && !s.villain.cloakUsed && s.villain.hp < s.villain.maxHp * vp.cloak.hpThresholdPct) openVillainCloak(s);
  if (vp?.kind === 'cloak' && s.villain.cloakTurns > 0 && vp.cloak.regenPct > 0) {
    const amount = Math.min(s.villain.maxHp - s.villain.hp, Math.floor(s.villain.maxHp * vp.cloak.regenPct));
    if (amount > 0) {
      s.villain.hp += amount;
      s.log.push({ type: 'heal', side: 'villain', amount, source: 'cloak' });
    }
  }
}

function openVillainCloak(s: RBattle): void {
  const vp = s.villain.def.passive;
  if (vp?.kind !== 'cloak') return;
  s.villain.cloakUsed = true;
  s.villain.cloakTurns = vp.cloak.turns;
  s.log.push({ type: 'passive', side: 'villain', kind: vp.variant });
}

function endOfRound(s: RBattle, data: RoletaData, rng: Rng): void {
  if (s.fx.buff) {
    s.fx.buff.turns--;
    if (s.fx.buff.turns <= 0) s.fx.buff = null;
  }
  if (s.fx.cloakTurns > 0) s.fx.cloakTurns--;
  if (s.fx.vitalTurns > 0) s.fx.vitalTurns--;
  if (s.villain.mistTurns > 0) s.villain.mistTurns--;
  if (s.villain.cloakTurns > 0) s.villain.cloakTurns--;
  s.activeUsed = false;
  s.villain.intent = rollIntent(s, rng);
  void data;
}

/** Queimar e Veneno doem no começo do turno de quem sofre; depois os efeitos perdem um turno. */
function tickEffects(s: RBattle, side: Side, data: RoletaData, rng: Rng): void {
  const effects = side === 'player' ? s.fx.effects : s.villain.effects;
  const max = side === 'player' ? s.player.maxHp : s.villain.maxHp;
  for (const e of effects) {
    if (e.turns <= 0 || (e.kind !== 'burn' && e.kind !== 'poison')) continue;
    let pct = e.kind === 'burn' ? data.r.effects.burn.pct : data.r.effects.poison.pct;
    // Aburame: a Praga dobra o veneno no vilão.
    if (side === 'villain' && e.kind === 'poison' && buff(s, 'plague')) pct *= 2;
    const amount = Math.max(1, Math.floor(max * pct));
    if (side === 'player') hurtPlayer(s, amount, e.kind, data);
    else hurtVillain(s, amount, e.kind, data, rng);
    if (s.status !== 'ongoing') return;
  }
}

/** Perde a vez se estiver atordoado (o efeito acaba aí). Os efeitos com tempo perdem um turno. */
function consumeTurnEffects(effects: REffect[]): boolean {
  let stunned = false;
  for (const e of effects) {
    if (e.turns <= 0) continue;
    if (e.kind === 'stun') stunned = true;
    e.turns--;
  }
  for (let i = effects.length - 1; i >= 0; i--) if (effects[i]!.turns <= 0) effects.splice(i, 1);
  return stunned;
}

function addEffect(s: RBattle, side: Side, kind: REffectKind, data: RoletaData): void {
  const turns = data.r.effects[kind].turns;
  const effects = side === 'player' ? s.fx.effects : s.villain.effects;
  const cur = effects.find((e) => e.kind === kind);
  if (cur) cur.turns = Math.max(cur.turns, turns);
  else effects.push({ kind, turns });
  s.log.push({ type: 'effect', side, kind, turns });
}

const genjutsuImmune = (s: RBattle) => {
  const p = s.villain.def.passive;
  return p?.kind === 'cloak' && p.genjutsuImmune;
};

// ---------------------------------------------------------------------------
// Turno do jogador

function playerTurn(s: RBattle, action: RAction, data: RoletaData, rng: Rng): void {
  s.fx.guarding = false;
  tickEffects(s, 'player', data, rng);
  if (s.status !== 'ongoing') return;
  if (consumeTurnEffects(s.fx.effects)) {
    s.log.push({ type: 'skip', side: 'player', reason: 'stun' });
    return;
  }
  if (action === 'guard') {
    s.fx.guarding = true;
    s.log.push({ type: 'guard' });
    return;
  }
  if (action === 'rest') {
    const amount = Math.min(s.player.maxChakra - s.player.chakra, Math.max(1, Math.floor(s.player.maxChakra * data.r.rest.chakraPct)));
    s.player.chakra += amount;
    s.log.push({ type: 'rest', side: 'player', amount });
    return;
  }
  if (action.startsWith('item:')) return useItem(s, action.slice(5) as ConsumableId, data, rng);
  const t = data.techniques[action.slice(5)];
  if (!t || !s.player.techniques.includes(t.id)) throw new Error(`técnica desconhecida: ${action}`);
  if (!canUseTechnique(s, t)) {
    // Sem chakra: concentra no lugar (a interface não deixa escolher).
    return playerTurn({ ...s }, 'rest', data, rng);
  }
  s.player.chakra -= t.chakra;
  playerAttack(s, t, data, rng);
}

function useItem(s: RBattle, id: ConsumableId, data: RoletaData, rng: Rng): void {
  if ((s.player.bag[id] ?? 0) <= 0) throw new Error('item acabou');
  s.player.bag = { ...s.player.bag, [id]: s.player.bag[id] - 1 };
  s.log.push({ type: 'item', id });
  const it = data.r.items;
  if (id === 'soldierPill') s.player.chakra = Math.min(s.player.maxChakra, s.player.chakra + Math.floor(s.player.maxChakra * it.soldierPillPct));
  else if (id === 'medKit') {
    s.fx.effects = [];
    healPlayer(s, Math.floor(s.player.maxHp * it.medKitHealPct), 'medKit');
  } else if (id === 'explosiveTag') hurtVillain(s, it.explosiveTagDamage, 'tag', data, rng);
  else if (id === 'smokeBomb') s.fx.dodgeNext = true;
}

function playerAttack(s: RBattle, t: RTechniqueDef, data: RoletaData, rng: Rng): void {
  const odds = playerAttackOdds(s, t, data);
  const outcome = odds.auto ? (rng() < odds.crit ? 'crit' : 'hit') : rollHit(odds.hit, odds.crit, rng);
  const hits = t.hits ?? 1;
  s.log.push({ type: 'attack', side: 'player', techId: t.id, hitChance: odds.hit, critChance: odds.crit, outcome, hits, ...(odds.auto ? { auto: true } : {}) });
  if (outcome === 'miss') return;
  const crit = outcome === 'crit';
  const per = playerHitDamage(s, t, data, crit ? data.base.balance.crit.multiplier : 1);
  const dealt = hurtVillain(s, per * hits, 'attack', data, rng, crit);
  if (t.lifesteal && dealt > 0) healPlayer(s, Math.floor(dealt * t.lifesteal), 'lifesteal');
  if (s.status !== 'ongoing') return;
  // Efeito da técnica (Aburame com a Praga: o Enxame sempre envenena). Imune a genjutsu ignora efeito de genjutsu.
  const plague = t.id === 'rSwarm' && buff(s, 'plague');
  if (t.effect && !(t.type === 'genjutsu' && genjutsuImmune(s)) && (plague || rng() < t.effect.chance)) addEffect(s, 'villain', t.effect.kind, data);
  // Invocações e o cão do Inuzuka.
  const summon = s.player.summon;
  if (summon?.animal === 'toad') {
    const pct = data.r.summons.toadPct + data.r.summons.toadPerLevel * (summon.level - 1);
    hurtVillain(s, Math.max(1, Math.floor(s.villain.maxHp * pct)), 'toad', data, rng);
  } else if (summon?.animal === 'snake' && !has(s.villain.effects, 'poison')) addEffect(s, 'villain', 'poison', data);
  if (s.status !== 'ongoing') return;
  if (kitOf(s.player, data).passive === 'duo') {
    const chance = buff(s, 'beast') ? data.r.kits.beast.dogChance : data.r.passives.duoChance;
    if (rng() < chance) hurtVillain(s, Math.max(1, Math.floor(per * data.r.passives.dogDamagePct)), 'dog', data, rng);
  }
}

// ---------------------------------------------------------------------------
// Turno do vilão

/** Sorteia a próxima ação do vilão entre as técnicas que ele pode pagar (pesos). Sem nenhuma, concentra. */
function rollIntent(s: RBattle, rng: Rng): RIntent {
  const v = s.villain;
  const options = v.techniques.filter(
    (t) => t.chakraCost <= v.chakra && (t.healPct === undefined || (v.hp < v.maxHp * (t.useBelowHpPct ?? 1) && v.hp < v.maxHp)),
  );
  if (!options.length) return { kind: 'rest' };
  let x = rng() * options.reduce((a, t) => a + t.weight, 0);
  for (const t of options) if ((x -= t.weight) < 0) return { kind: 'tech', id: t.id };
  return { kind: 'tech', id: options.at(-1)!.id };
}

function villainTurn(s: RBattle, data: RoletaData, rng: Rng): void {
  const v = s.villain;
  tickEffects(s, 'villain', data, rng);
  if (s.status !== 'ongoing') return;
  const stunned = consumeTurnEffects(v.effects);
  if (v.skipNext || stunned) {
    s.log.push({ type: 'skip', side: 'villain', reason: v.skipNext ?? 'stun' });
    v.skipNext = null;
    return;
  }
  const intent = v.intent ?? rollIntent(s, rng);
  const tech = intent.kind === 'tech' ? v.techniques.find((t) => t.id === intent.id) : undefined;
  if (!tech || tech.chakraCost > v.chakra) {
    const amount = Math.min(v.def.chakra - v.chakra, Math.max(1, Math.floor(v.def.chakra * data.r.rest.chakraPct)));
    v.chakra += amount;
    s.log.push({ type: 'rest', side: 'villain', amount });
    return;
  }
  v.chakra -= tech.chakraCost;
  if (tech.healPct !== undefined) {
    const amount = Math.min(v.maxHp - v.hp, Math.floor(v.maxHp * tech.healPct));
    v.hp += amount;
    s.log.push({ type: 'heal', side: 'villain', amount, source: tech.id });
    return;
  }
  const p = v.def.passive;
  const actions = p?.kind === 'mirrors' ? p.actions : 1;
  for (let i = 0; i < actions && s.status === 'ongoing'; i++) villainAttack(s, tech, p?.kind === 'mirrors' ? p.damageMult : 1, data, rng);
}

/** Chances do golpe do vilão contra o jogador. */
export function villainAttackOdds(s: RBattle, tech: VillainTechnique, data: RoletaData): { hit: number; crit: number } {
  const cfg = data.base.balance;
  const kit = kitOf(s.player, data);
  let bonus = -dodgeChance(effectiveSpeed(s, 'player', data), s.villain.def.speed, data);
  if (kit.passive === 'mindReading') bonus -= data.r.passives.mindReadingAccuracy;
  if (buff(s, 'sharingan')) bonus -= data.r.kits.sharingan.dodge;
  if (has(s.villain.effects, 'fear')) bonus += data.r.effects.fear.accuracy;
  const hit = hitChance(tech.accuracy, bonus, cfg.hit);
  const p = s.villain.def.passive;
  const scalpel = p?.kind === 'scalpel' ? p.critBonus : 0;
  const crit = s.villain.counterCrit ? hit : critChance(s.villain.def.critBonus + scalpel, cfg.crit, hit);
  return { hit, crit };
}

function villainAttack(s: RBattle, tech: VillainTechnique, mult: number, data: RoletaData, rng: Rng): void {
  const v = s.villain;
  if (s.fx.dodgeNext) {
    s.fx.dodgeNext = false;
    s.log.push({ type: 'attack', side: 'villain', techId: tech.id, hitChance: 0, critChance: 0, outcome: 'miss', hits: tech.hits ?? 1 });
    s.log.push({ type: 'dodge', side: 'player' });
    return;
  }
  const odds = villainAttackOdds(s, tech, data);
  const outcome = rollHit(odds.hit, odds.crit, rng);
  if (v.counterCrit) v.counterCrit = false;
  const hits = tech.hits ?? 1;
  s.log.push({ type: 'attack', side: 'villain', techId: tech.id, hitChance: odds.hit, critChance: odds.crit, outcome, hits });
  if (outcome === 'miss') return;
  const kit = kitOf(s.player, data);
  // Genjutsu sem dano: só o efeito (Medo). Uchiha e jinchuuriki são imunes.
  if (tech.baseDamage <= 0) {
    if (kit.passive !== 'trainedEyes' && !s.player.jinchuuriki) addEffect(s, 'player', 'fear', data);
    return;
  }
  const p = v.def.passive;
  const kind = resistanceKind(tech.type);
  const cloakOn = p?.kind === 'cloak' && (v.cloakTurns > 0 || v.monster);
  let extra = mult * (cloakOn ? p.cloak.statMult : 1) * (v.lastStand && p?.kind === 'mist' && p.lastStand ? p.lastStand.damageMult : 1);
  if (has(v.effects, 'fear')) extra *= data.r.effects.fear.damageMult;
  const pierce = p?.kind === 'scalpel' ? (p.resistancePierce ?? 0) : 0;
  const per = damage({
    baseDamage: tech.baseDamage,
    offense: v.def.offense[tech.type],
    resistance: playerResistance(s, kind, data),
    fraction: s.fx.guarding ? data.r.resistance.guard : data.r.resistance.passive,
    penetration: pierce,
    elementMult: 1,
    critMult: outcome === 'crit' ? data.base.balance.crit.multiplier : 1,
    extraMult: extra,
  });
  hurtPlayer(s, per * hits, 'attack', data, outcome === 'crit');
  if (s.status !== 'ongoing') return;
  // Cobra do Orochimaru e bisturi do Kabuto (hardcore): veneno no acerto.
  if ((p?.kind === 'insane' && p.snakeBonus > 0) || (p?.kind === 'scalpel' && p.bleedOnHit)) {
    if (!has(s.fx.effects, 'poison')) addEffect(s, 'player', 'poison', data);
  }
}

// ---------------------------------------------------------------------------
// Dano, cura, quedas

function healPlayer(s: RBattle, amount: number, source: string): void {
  const n = Math.min(s.player.maxHp - s.player.hp, Math.max(0, amount));
  if (n <= 0) return;
  s.player.hp += n;
  s.log.push({ type: 'heal', side: 'player', amount: n, source });
}

function hurtPlayer(s: RBattle, amount: number, source: 'attack' | 'burn' | 'poison', data: RoletaData, crit = false): void {
  let n = amount;
  if (s.fx.shield > 0) {
    const absorbed = Math.min(s.fx.shield, n);
    s.fx.shield -= absorbed;
    n -= absorbed;
    s.log.push({ type: 'shield', side: 'player', absorbed });
  }
  if (n <= 0) return;
  s.player.hp = Math.max(0, s.player.hp - n);
  s.log.push({ type: 'damage', side: 'player', amount: n, source, ...(crit ? { crit } : {}) });
  if (s.player.hp > 0) return;
  // Vontade do Fogo: volta inteiro.
  if (s.options.allowRevive && s.player.revives > 0) {
    s.player = { ...s.player, revives: s.player.revives - 1, revivesUsed: s.player.revivesUsed + 1, hp: s.player.maxHp, chakra: s.player.maxChakra };
    s.fx.effects = [];
    s.log.push({ type: 'revive', side: 'player', source: 'willOfFire' });
    return;
  }
  s.status = 'lost';
  s.log.push({ type: 'end', status: 'lost' });
  void data;
}

/** Fere o vilão e resolve as passivas de queda (Enganador, Último fôlego, Shukaku, Insano). Devolve o dano causado. */
function hurtVillain(s: RBattle, amount: number, source: 'attack' | 'burn' | 'poison' | 'toad' | 'dog' | 'tag' | 'self', data: RoletaData, rng: Rng, crit = false): number {
  const v = s.villain;
  const n = Math.max(0, Math.min(v.hp, amount));
  v.hp -= n;
  s.log.push({ type: 'damage', side: 'villain', amount: n, source, ...(crit ? { crit } : {}) });
  if (v.hp > 0) return n;
  const p = v.def.passive;
  if (p?.kind === 'trickster' && !v.survived) {
    v.survived = true;
    v.hp = 1;
    if (p.counterCrit) v.counterCrit = true;
    else v.skipNext = 'trickster';
    s.log.push({ type: 'passive', side: 'villain', kind: 'trickster' });
    return n;
  }
  if (p?.kind === 'mist' && p.lastStand && !v.lastStand) {
    v.lastStand = true;
    v.hp = Math.floor(v.maxHp * p.lastStand.healPct);
    s.log.push({ type: 'passive', side: 'villain', kind: 'lastStand' });
    return n;
  }
  if (p?.kind === 'cloak' && p.monster && !v.monster) {
    v.monster = true;
    v.hp = Math.floor(v.maxHp * p.monster.healPct);
    v.techniques = p.monster.techniques.filter((t) => t.barrier === undefined);
    v.intent = rollIntent(s, rng);
    s.log.push({ type: 'passive', side: 'villain', kind: 'monster' });
    return n;
  }
  if (p?.kind === 'insane' && v.revivesUsed < (p.maxRevives ?? data.r.villains.insaneMaxRevives)) {
    v.revivesUsed++;
    v.hp = Math.floor(v.maxHp * p.revivePct);
    s.log.push({ type: 'revive', side: 'villain', source: 'insane' });
    return n;
  }
  s.status = 'won';
  s.log.push({ type: 'end', status: 'won' });
  void data;
  return n;
}
