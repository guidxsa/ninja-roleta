// Combate do Roleta enxuto (docs/roleta/combate.md). Funções puras: estado entra, estado sai; o log de eventos é o que
// a interface anima. Um toque por turno: técnica, Defender ou Concentrar; a ativa da linhagem e um item são grátis.
// Sem reações nem disputa de ninjutsu. Efeitos, barreiras e clones seguem as regras comuns com a Jornada
// (src/core/effects.ts, barriers.ts, clones.ts; docs/base/fundamentos.md): o elemento só pesa contra a barreira.
import { damage } from '../damage';
import { critChance, hitChance, rollHit, type HitOutcome } from '../hit';
import { rollInitiative, initiativeChance } from '../initiative';
import { clamp, type Rng } from '../rng';
import { wearClone, type CloneKind } from '../clones';
import { dotDamage, effectDuration } from '../effects';
import { absorbIntoBarrier, barrierMult, raiseBarrier, type BarrierAttack, type BarrierContext, type BarrierSpec, type BarrierState } from '../barriers';
import type { Nature } from '../nature';
import { payGateUpkeep } from '../gates';
import type { AttackType, ConsumableId, ResistanceKind, VillainDef, VillainTechnique } from '../types';
import type { PlayerState } from '../player';
import type { RoletaData } from './data';
import type { REffectKind, RTechniqueDef } from '../../data/roleta/techniques';
import type { RActive } from '../../data/roleta/kits';
import { relicEffects } from './run';

export type Side = 'player' | 'villain';

export interface REffect {
  kind: REffectKind | 'stunGuard';
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
  /** Escudo de areia do vilão (natureza Areia): absorve dano antes do HP. */
  shield: number;
  /** Barreira elemental de pé (src/core/barriers.ts), ou null. */
  barrier: BarrierState | null;
}

export interface RPlayerFx {
  effects: REffect[];
  /** Usos da ativa que sobram nesta luta. */
  activeUses: number;
  /** Fortalecimento da ativa em andamento (turnos contando o da ativação). */
  buff: { kind: RActive; turns: number } | null;
  /** Portões: rodadas já mantidas desde a abertura (a manutenção da próxima é a de número gateRounds + 1). */
  gateRounds: number;
  guarding: boolean;
  /** Bomba de fumaça: esquiva garantida do próximo ataque. */
  dodgeNext: boolean;
  shield: number;
  /** Barreira elemental de pé (src/core/barriers.ts), ou null. */
  barrier: BarrierState | null;
  cloakTurns: number;
  cloakUsed: boolean;
  vitalTurns: number;
  vitalUsed: boolean;
  /** Pena de fênix já usada nesta luta. */
  survivedOnce: boolean;
  /** Clone ativo (no máximo 1) e quantos golpes já segurou (src/core/clones.ts). */
  clone: { kind: CloneKind; wear: number } | null;
}

/** Ação do turno. O item não é ação: usa-se antes, com `useRoletaItem` (um por turno). */
export type RAction = `tech:${string}` | 'guard' | 'rest';

export type REvent =
  | { type: 'initiative'; playerFirst: boolean; chance: number; forced: boolean }
  | { type: 'round'; round: number }
  /** Clone: criado, segurou um golpe (`broken`: desfez-se) ou bateu junto. */
  | { type: 'clone'; side: Side; action: 'create' | 'block' | 'strike'; kind: CloneKind; broken?: boolean }
  | { type: 'gates'; action: 'upkeep'; cost: number }
  | { type: 'gates'; action: 'close'; reason: 'manual' | 'chakra' }
  /** Uma roleta: `strike` de `of` golpes da técnica (cada golpe rola, v0.77.0). */
  | { type: 'attack'; side: Side; techId: string; hitChance: number; critChance: number; outcome: HitOutcome; hits: number; strike?: number; of?: number; auto?: boolean }
  | { type: 'damage'; side: Side; amount: number; crit?: boolean; source: 'attack' | 'burn' | 'poison' | 'toad' | 'dog' | 'tag' | 'self' | 'opening' | 'clone' }
  | { type: 'shield'; side: Side; absorbed: number }
  /** Barreira elemental: erguida, golpeada (com o encontro de elementos no escudo), quebrada, apagou o fogo ou acabou. */
  | { type: 'barrier'; side: Side; action: 'raise' | 'hit' | 'break' | 'douse' | 'end'; techId: string; points?: number; absorbed?: number; left?: number; mult?: number }
  | { type: 'heal'; side: Side; amount: number; source: string }
  | { type: 'effect'; side: Side; kind: REffectKind | 'stunGuard'; turns: number }
  /** A trava (firme) segurou um atordoamento, ou o alvo é imune ao efeito. */
  | { type: 'resist'; side: Side; kind: REffectKind }
  | { type: 'skip'; side: Side; reason: 'stun' | 'seal' | 'mind' | 'trickster' }
  | { type: 'dodge'; side: Side }
  | { type: 'rest'; side: Side; amount: number }
  /** Chakra mudou fora do Concentrar (regeneração, custo de golpe, pílula): `value` é o total depois da mudança. */
  | { type: 'chakra'; side: Side; value: number }
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
  /** Um item da bolsa já foi usado neste turno (não gasta a ação). */
  itemUsed: boolean;
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
    techniques: def.techniques,
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
    // Natureza Areia (jogador ou vilão): escudo de areia no começo da luta (`sandShieldPct`).
    shield: def.kekkeiGenkai === 'sand' ? Math.floor(def.hp * b.sandShieldPct) : 0,
    barrier: null,
  };
  const s: RBattle = {
    player: { ...player, hp: Math.max(1, player.hp) },
    villain,
    fx: {
      effects: [],
      activeUses: kit.active ? b.kits.uses[kit.active] ?? 1 : 0,
      buff: null,
      gateRounds: 0,
      guarding: false,
      dodgeNext: false,
      shield: player.kekkeiGenkai === 'sand' ? Math.floor(player.maxHp * b.sandShieldPct) : 0,
      barrier: null,
      cloakTurns: 0,
      cloakUsed: false,
      vitalTurns: 0,
      vitalUsed: false,
      survivedOnce: false,
      clone: null,
    },
    round: 0,
    playerFirst: true,
    status: 'ongoing',
    log: [],
    options: { allowRevive: true, ...options },
    activeUsed: false,
    itemUsed: false,
  };
  // Marca da maldição desde o começo (hardcore).
  if (passive?.kind === 'cloak' && passive.fromStart) openVillainCloak(s);
  // Relíquias de começo de luta: escudo, chakra a mais e dano de abertura.
  const fx = relicEffects(s.player, data);
  if (fx.startShieldPct > 0) s.fx.shield += Math.floor(s.player.maxHp * fx.startShieldPct);
  if (fx.startChakraPct > 0) gainPlayerChakra(s, Math.floor(s.player.maxChakra * fx.startChakraPct));
  // Cupom do Ichiraku: começa acima do máximo (o excedente não volta: cura e regeneração param no máximo).
  if (fx.startOverPct > 0) {
    s.player.hp += Math.floor(s.player.maxHp * fx.startOverPct);
    s.player.chakra += Math.floor(s.player.maxChakra * fx.startOverPct);
  }
  if (fx.openingDamage > 0) {
    const n = Math.min(s.villain.hp - 1, fx.openingDamage);
    s.villain.hp -= n;
    s.log.push({ type: 'damage', side: 'villain', amount: n, source: 'opening' });
  }
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
  return t.base + t.perLevel * (p.level - 1) + p.ninjaToolLevel * data.base.balance.ninjaTool.baseDamagePerLevel + relicEffects(p, data).flatDamage;
}

const buff = (s: RBattle, kind: RActive) => s.fx.buff?.kind === kind && s.fx.buff.turns > 0;
const has = (effects: REffect[], kind: REffect['kind']) => effects.some((e) => e.kind === kind && e.turns > 0);

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
  if (has(s.fx.effects, 'fear')) bonus += data.base.balance.effects.fear.accuracy;
  bonus -= dodgeChance(s.villain.def.speed, effectiveSpeed(s, 'player', data), data);
  const relic = relicEffects(s.player, data);
  bonus += relic.accuracyBonus;
  // Mokuton: o clone compartilha o que vê.
  if (s.fx.clone) bonus += cloneRules(data).kinds[s.fx.clone.kind].accuracyBonus ?? 0;
  let hit = auto ? 1 : hitChance(t.accuracy, bonus, cfg.hit);
  // Névoa (Zabuza): a chance de erro do jogador × evasionMult.
  const p = s.villain.def.passive;
  if (!auto && p?.kind === 'mist' && s.villain.mistTurns > 0) hit = clamp(1 - (1 - hit) * p.evasionMult, cfg.hit.min, cfg.hit.max);
  const critImmune = p?.kind === 'insane' && p.critImmune;
  // A Juventude do Prodígio já vem no critBonus da ficha (createPlayer); não soma de novo aqui.
  const crit = critImmune ? 0 : critChance(s.player.critBonus + (t.critBonus ?? 0) + relic.critBonus, cfg.crit, hit);
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
  if (has(s.fx.effects, 'fear')) m *= data.base.balance.effects.fear.damageMult;
  // Relíquias: dano geral, por tipo e com HP baixo.
  const relic = relicEffects(s.player, data);
  m *= relic.damageMult * (relic.typeDamageMult[t.type] ?? 1);
  if (s.player.hp < s.player.maxHp * 0.5) m *= relic.lowHpDamageMult;
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
/** Custo da técnica com as relíquias (nunca abaixo de 0). */
export const techCost = (s: RBattle, t: RTechniqueDef, data: RoletaData) => Math.max(0, t.chakra - (t.chakra > 0 ? relicEffects(s.player, data).chakraDiscount : 0));
export const canUseTechnique = (s: RBattle, t: RTechniqueDef, data: RoletaData) =>
  s.player.chakra >= techCost(s, t, data) &&
  !(t.type !== 'taijutsu' && chakraBlocked(s.fx.effects)) &&
  // Uma barreira e um clone por vez: não dá para erguer outra nem recriar o clone enquanto o atual está de pé.
  !(t.barrierPct && s.fx.barrier) &&
  !(t.clone && s.fx.clone);

// ---------------------------------------------------------------------------
// Ativa da linhagem (grátis, uma por turno)

export function canUseActive(s: RBattle, data: RoletaData): boolean {
  const kit = kitOf(s.player, data);
  // Portões: abrir (com chakra para a abertura) ou fechar, uma vez por turno, quantas vezes quiser na luta.
  if (kit.active === 'gates') {
    return s.status === 'ongoing' && !s.activeUsed && (buff(s, 'gates') || (!s.fx.buff && s.player.chakra >= data.r.kits.gates.activation));
  }
  return s.status === 'ongoing' && Boolean(kit.active) && s.fx.activeUses > 0 && !s.activeUsed && !s.fx.buff;
}

export function useActive(prev: RBattle, data: RoletaData, rng: Rng): RBattle {
  if (!canUseActive(prev, data)) throw new Error('ativa indisponível');
  const s = clone(prev);
  const kind = kitOf(s.player, data).active!;
  const k = data.r.kits;
  s.activeUsed = true;
  if (kind === 'gates') {
    // Aberto: fecha. Fechado: paga a abertura; a manutenção começa na próxima rodada (src/core/gates.ts).
    if (buff(s, 'gates')) {
      s.fx.buff = null;
      s.log.push({ type: 'gates', action: 'close', reason: 'manual' });
      return s;
    }
    s.player.chakra -= k.gates.activation;
    logChakra(s, 'player');
    s.fx.buff = { kind, turns: 1 };
    s.fx.gateRounds = 0;
    s.log.push({ type: 'active', kind, success: true });
    return s;
  }
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

/** Avisa a interface do chakra atual, para a barra acompanhar a animação. */
function logChakra(s: RBattle, side: Side): void {
  s.log.push({ type: 'chakra', side, value: side === 'player' ? s.player.chakra : s.villain.chakra });
}

function startOfRound(s: RBattle, data: RoletaData): void {
  const r = data.r;
  // Regeneração de chakra (sem texto no registro; só a barra sobe).
  const regen = (max: number, pct = r.chakraRegen.pct) => Math.max(r.chakraRegen.min, Math.floor(max * pct));
  const playerChakra = s.player.chakra;
  const villainChakra = s.villain.chakra;
  gainPlayerChakra(s, regen(s.player.maxChakra) + relicEffects(s.player, data).chakraRegen);
  s.villain.chakra = Math.min(s.villain.def.chakra, s.villain.chakra + regen(s.villain.def.chakra, r.villainChakra.regenPct));
  if (s.player.chakra !== playerChakra) logChakra(s, 'player');
  if (s.villain.chakra !== villainChakra) logChakra(s, 'villain');
  // Portões abertos: manutenção crescente; sem chakra para ela, fecham sozinhos.
  if (buff(s, 'gates')) {
    s.fx.gateRounds++;
    const paid = payGateUpkeep(s.player.chakra, s.fx.gateRounds, data.base.balance.gateCosts);
    if (paid) {
      s.player.chakra = paid.chakra;
      s.log.push({ type: 'gates', action: 'upkeep', cost: paid.cost });
      logChakra(s, 'player');
    } else {
      s.fx.buff = null;
      s.log.push({ type: 'gates', action: 'close', reason: 'chakra' });
    }
  }
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
  healPct += relicEffects(s.player, data).regenPct;
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
  // Os Portões não contam rodadas: ficam até fechar (à mão ou sem chakra).
  if (s.fx.buff && s.fx.buff.kind !== 'gates') {
    s.fx.buff.turns--;
    if (s.fx.buff.turns <= 0) s.fx.buff = null;
  }
  if (s.fx.cloakTurns > 0) s.fx.cloakTurns--;
  if (s.fx.vitalTurns > 0) s.fx.vitalTurns--;
  if (s.villain.mistTurns > 0) s.villain.mistTurns--;
  if (s.villain.cloakTurns > 0) s.villain.cloakTurns--;
  s.activeUsed = false;
  s.itemUsed = false;
  s.villain.intent = rollIntent(s, rng);
  void data;
}

/** Queimar e Veneno doem no começo do turno de quem sofre; depois os efeitos perdem um turno. */
function tickEffects(s: RBattle, side: Side, data: RoletaData, rng: Rng): void {
  const effects = side === 'player' ? s.fx.effects : s.villain.effects;
  const max = side === 'player' ? s.player.maxHp : s.villain.maxHp;
  for (const e of effects) {
    if (e.turns <= 0 || (e.kind !== 'burn' && e.kind !== 'poison')) continue;
    // Aburame: a Praga dobra o veneno no vilão.
    const mult = side === 'villain' && e.kind === 'poison' && buff(s, 'plague') ? 2 : 1;
    const amount = dotDamage(e.kind, max, data.base.balance.effects, mult);
    if (side === 'player') hurtPlayer(s, amount, e.kind, data);
    else hurtVillain(s, amount, e.kind, data, rng);
    if (s.status !== 'ongoing') return;
  }
}

/**
 * Fim do turno de quem sofre (agiu ou perdeu a vez): os efeitos perdem um turno. Saiu do atordoamento: ganha a trava
 * (firme) até o fim do próximo turno em que age (a mesma regra da Jornada, docs/base/efeitos.md).
 */
function endSideTurn(s: RBattle, side: Side, data: RoletaData): void {
  const effects = side === 'player' ? s.fx.effects : s.villain.effects;
  const wasStunned = has(effects, 'stun');
  for (const e of effects) if (e.turns > 0) e.turns--;
  for (let i = effects.length - 1; i >= 0; i--) if (effects[i]!.turns <= 0) effects.splice(i, 1);
  if (wasStunned && !has(effects, 'stun') && s.status === 'ongoing') {
    const turns = data.base.balance.effects.stunImmunityTurns;
    effects.push({ kind: 'stunGuard', turns });
    s.log.push({ type: 'effect', side, kind: 'stunGuard', turns });
  }
  // Barreira: conta os turnos de quem ergueu.
  const b = side === 'player' ? s.fx.barrier : s.villain.barrier;
  if (b && --b.turns <= 0) {
    if (side === 'player') s.fx.barrier = null;
    else s.villain.barrier = null;
    s.log.push({ type: 'barrier', side, action: 'end', techId: b.techId });
  }
}

function addEffect(s: RBattle, side: Side, kind: REffectKind, data: RoletaData): void {
  const effects = side === 'player' ? s.fx.effects : s.villain.effects;
  if (kind === 'stun' && has(effects, 'stunGuard')) {
    s.log.push({ type: 'resist', side, kind });
    return;
  }
  const turns = effectDuration(kind, data.base.balance.effects);
  const cur = effects.find((e) => e.kind === kind);
  if (cur) cur.turns = Math.max(cur.turns, turns);
  else effects.push({ kind, turns });
  s.log.push({ type: 'effect', side, kind, turns });
}

/** Bloqueio de chakra: só taijutsu. */
const chakraBlocked = (effects: REffect[]) => has(effects, 'chakraBlock');

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
  if (has(s.fx.effects, 'stun')) s.log.push({ type: 'skip', side: 'player', reason: 'stun' });
  else playerAction(s, action, data, rng);
  endSideTurn(s, 'player', data);
}

function playerAction(s: RBattle, action: RAction, data: RoletaData, rng: Rng): void {
  if (action === 'guard') {
    s.fx.guarding = true;
    s.log.push({ type: 'guard' });
    return;
  }
  if (action === 'rest') return concentrate(s, data);
  const t = data.techniques[action.slice(5)];
  if (!t || !s.player.techniques.includes(t.id)) throw new Error(`técnica desconhecida: ${action}`);
  // Sem chakra (a manutenção dos Portões, no começo da rodada, pode ter gasto depois da escolha): concentra no lugar,
  // no mesmo turno. Repetir o turno faria os efeitos doerem e perderem a duração duas vezes.
  if (!canUseTechnique(s, t, data)) return concentrate(s, data);
  const cost = techCost(s, t, data);
  s.player.chakra -= cost;
  if (cost > 0) logChakra(s, 'player');
  playerAttack(s, t, data, rng);
}

/** Concentrar: recupera uma fração do chakra máximo (pelo menos 1). */
function concentrate(s: RBattle, data: RoletaData): void {
  const amount = gainPlayerChakra(s, Math.max(1, Math.floor(s.player.maxChakra * data.r.rest.chakraPct)));
  s.log.push({ type: 'rest', side: 'player', amount });
}

/** Item da bolsa: não gasta a ação, um por turno (como na Jornada). Atordoado não usa (perde o turno inteiro). */
export function canUseItem(s: RBattle, id: ConsumableId): boolean {
  return s.status === 'ongoing' && !s.itemUsed && (s.player.bag[id] ?? 0) > 0 && !has(s.fx.effects, 'stun');
}

/** Usa um item antes da ação do turno (como a ativa): o efeito vale na hora. */
export function useRoletaItem(prev: RBattle, id: ConsumableId, data: RoletaData, rng: Rng): RBattle {
  if (!canUseItem(prev, id)) throw new Error('item indisponível agora');
  const s = clone(prev);
  s.itemUsed = true;
  applyItem(s, id, data, rng);
  return s;
}

function applyItem(s: RBattle, id: ConsumableId, data: RoletaData, rng: Rng): void {
  s.player.bag = { ...s.player.bag, [id]: s.player.bag[id] - 1 };
  s.log.push({ type: 'item', id });
  const it = data.r.items;
  if (id === 'soldierPill') {
    gainPlayerChakra(s, Math.floor(s.player.maxChakra * it.soldierPillPct));
    logChakra(s, 'player');
  } else if (id === 'medKit') {
    s.fx.effects = [];
    healPlayer(s, Math.floor(s.player.maxHp * it.medKitHealPct), 'medKit');
  } else if (id === 'explosiveTag') hurtVillain(s, it.explosiveTagDamage, 'tag', data, rng);
  else if (id === 'smokeBomb') s.fx.dodgeNext = true;
}

function playerAttack(s: RBattle, t: RTechniqueDef, data: RoletaData, rng: Rng): void {
  // Clone: cria (no máximo 1; um novo substitui), sem roleta de acerto.
  if (t.clone) {
    s.fx.clone = { kind: t.clone, wear: 0 };
    s.log.push({ type: 'clone', side: 'player', action: 'create', kind: t.clone });
    return;
  }
  // Barreira: ergue o escudo do elemento, sem roleta.
  if (t.barrierPct) return raiseSideBarrier(s, 'player', t.id, barrierSpec(t.barrierPct, t.element, data), t.kekkeiGenkai ?? t.element ?? null, data);
  // Cada golpe tem a sua roleta (v0.77.0, como na Jornada): acerto, erro ou crítico vale só para aquele golpe.
  const hits = t.hits ?? 1;
  let dealt = 0;
  let landed = 0;
  for (let i = 0; i < hits && s.status === 'ongoing'; i++) {
    const odds = playerAttackOdds(s, t, data);
    const outcome = odds.auto ? (rng() < odds.crit ? 'crit' : 'hit') : rollHit(odds.hit, odds.crit, rng);
    s.log.push({ type: 'attack', side: 'player', techId: t.id, hitChance: odds.hit, critChance: odds.crit, outcome, hits: 1, strike: i + 1, of: hits, ...(odds.auto ? { auto: true } : {}) });
    if (outcome === 'miss') continue;
    landed++;
    const crit = outcome === 'crit';
    dealt += hurtVillain(s, playerHitDamage(s, t, data, crit ? data.base.balance.crit.multiplier : 1), 'attack', data, rng, crit, t);
  }
  if (!landed) return;
  const per = playerHitDamage(s, t, data);
  // Clone que bate junto (Kage, Mizu, Mokuton): um golpe a mais, com uma fração do dano de um golpe, sem roleta.
  const cl = s.fx.clone;
  const strikePct = cl ? cloneRules(data).kinds[cl.kind].strikePct : 0;
  if (cl && strikePct > 0 && s.status === 'ongoing') {
    s.log.push({ type: 'clone', side: 'player', action: 'strike', kind: cl.kind });
    dealt += hurtVillain(s, Math.max(1, Math.floor(per * strikePct)), 'clone', data, rng, false, t);
  }
  if (t.lifesteal && dealt > 0) healPlayer(s, Math.floor(dealt * t.lifesteal), 'lifesteal');
  if (s.status !== 'ongoing') return;
  // Efeito da técnica, uma chance por técnica que acertou pelo menos um golpe (Aburame com a Praga: o Enxame sempre
  // envenena). Imune a genjutsu ignora efeito de genjutsu.
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
    (t) =>
      t.chakraCost <= v.chakra &&
      (t.type === 'taijutsu' || !chakraBlocked(v.effects)) &&
      // Barreira só sem uma de pé.
      (t.barrier === undefined || !v.barrier) &&
      (t.healPct === undefined || (v.hp < v.maxHp * (t.useBelowHpPct ?? 1) && v.hp < v.maxHp)),
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
  if (v.skipNext || has(v.effects, 'stun')) {
    s.log.push({ type: 'skip', side: 'villain', reason: v.skipNext ?? 'stun' });
    v.skipNext = null;
  } else villainAction(s, data, rng);
  endSideTurn(s, 'villain', data);
}

function villainAction(s: RBattle, data: RoletaData, rng: Rng): void {
  const v = s.villain;
  const first = v.intent ?? rollIntent(s, rng);
  const find = (i: RIntent) => (i.kind === 'tech' ? v.techniques.find((t) => t.id === i.id) : undefined);
  // Bloqueio de chakra depois do sorteio: a técnica que não é taijutsu sai, e ele sorteia de novo.
  const planned = find(first);
  const tech = planned && planned.type !== 'taijutsu' && chakraBlocked(v.effects) ? find(rollIntent(s, rng)) : planned;
  if (!tech || tech.chakraCost > v.chakra) {
    const amount = Math.min(v.def.chakra - v.chakra, Math.max(1, Math.floor(v.def.chakra * data.r.villainChakra.restPct)));
    v.chakra += amount;
    s.log.push({ type: 'rest', side: 'villain', amount });
    return;
  }
  v.chakra -= tech.chakraCost;
  if (tech.chakraCost > 0) logChakra(s, 'villain');
  if (tech.barrier !== undefined) {
    if (v.barrier) return;
    return raiseSideBarrier(s, 'villain', tech.id, { points: tech.barrier }, tech.element ?? villainNature(v.def), data);
  }
  if (tech.healPct !== undefined) {
    const amount = Math.min(v.maxHp - v.hp, Math.floor(v.maxHp * tech.healPct));
    v.hp += amount;
    s.log.push({ type: 'heal', side: 'villain', amount, source: tech.id });
    return;
  }
  villainAttack(s, tech, data, rng);
}

/** Chances do golpe do vilão contra o jogador. */
export function villainAttackOdds(s: RBattle, tech: VillainTechnique, data: RoletaData): { hit: number; crit: number } {
  const cfg = data.base.balance;
  const kit = kitOf(s.player, data);
  let bonus = -dodgeChance(effectiveSpeed(s, 'player', data), s.villain.def.speed, data) - relicEffects(s.player, data).dodgeBonus;
  if (kit.passive === 'mindReading') bonus -= data.r.passives.mindReadingAccuracy;
  if (buff(s, 'sharingan')) bonus -= data.r.kits.sharingan.dodge;
  if (has(s.villain.effects, 'fear')) bonus += data.base.balance.effects.fear.accuracy;
  const hit = hitChance(tech.accuracy, bonus, cfg.hit);
  const p = s.villain.def.passive;
  const scalpel = p?.kind === 'scalpel' ? p.critBonus : 0;
  const crit = s.villain.counterCrit ? hit : critChance(s.villain.def.critBonus + scalpel, cfg.crit, hit);
  return { hit, crit };
}

function villainAttack(s: RBattle, tech: VillainTechnique, data: RoletaData, rng: Rng): void {
  const v = s.villain;
  const p = v.def.passive;
  // Espelhos: os golpes extras são do mesmo ataque; cada golpe tem a sua roleta (v0.77.0).
  const mirrors = p?.kind === 'mirrors' ? p : null;
  const hits = (tech.hits ?? 1) * (mirrors?.actions ?? 1);
  // Bomba de fumaça: esquiva o ataque inteiro (todos os golpes).
  if (s.fx.dodgeNext) {
    s.fx.dodgeNext = false;
    s.log.push({ type: 'attack', side: 'villain', techId: tech.id, hitChance: 0, critChance: 0, outcome: 'miss', hits });
    s.log.push({ type: 'dodge', side: 'player' });
    return;
  }
  const kit = kitOf(s.player, data);
  const kind = resistanceKind(tech.type);
  const cloakOn = p?.kind === 'cloak' && (v.cloakTurns > 0 || v.monster);
  let extra = (mirrors?.damageMult ?? 1) * (cloakOn ? p.cloak.statMult : 1) * (v.lastStand && p?.kind === 'mist' && p.lastStand ? p.lastStand.damageMult : 1);
  if (has(v.effects, 'fear')) extra *= data.base.balance.effects.fear.damageMult;
  const pierce = p?.kind === 'scalpel' ? (p.resistancePierce ?? 0) : 0;
  let landed = 0;
  for (let i = 0; i < hits && s.status === 'ongoing'; i++) {
    const odds = villainAttackOdds(s, tech, data);
    const outcome = rollHit(odds.hit, odds.crit, rng);
    // Contra-ataque do Kabuto: só o primeiro golpe é crítico garantido.
    if (v.counterCrit) v.counterCrit = false;
    s.log.push({ type: 'attack', side: 'villain', techId: tech.id, hitChance: odds.hit, critChance: odds.crit, outcome, hits: 1, strike: i + 1, of: hits });
    if (outcome === 'miss') continue;
    // Clone: o golpe (alvo único) pode cair nele (src/core/clones.ts).
    if (cloneBlocks(s, data, rng)) continue;
    landed++;
    // Genjutsu sem dano: só o efeito (Medo), uma vez. Uchiha e jinchuuriki são imunes.
    if (tech.baseDamage <= 0) {
      if (kit.passive === 'trainedEyes' || s.player.jinchuuriki) s.log.push({ type: 'resist', side: 'player', kind: 'fear' });
      else addEffect(s, 'player', 'fear', data);
      return;
    }
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
    hurtPlayer(s, per, 'attack', data, outcome === 'crit', { tech, rng });
  }
  if (!landed || s.status !== 'ongoing') return;
  // Cobra do Orochimaru e bisturi do Kabuto (hardcore): veneno no acerto.
  if ((p?.kind === 'insane' && p.snakeBonus > 0) || (p?.kind === 'scalpel' && p.bleedOnHit)) {
    if (!has(s.fx.effects, 'poison')) addEffect(s, 'player', 'poison', data);
  }
}

// ---------------------------------------------------------------------------
// Dano, cura, quedas

/** Chakra do jogador até o máximo; acima dele (Cupom do Ichiraku) não sobe nem desce. Devolve o ganho. */
function gainPlayerChakra(s: RBattle, amount: number): number {
  const n = Math.max(0, Math.min(s.player.maxChakra - s.player.chakra, amount));
  s.player.chakra += n;
  return n;
}

function healPlayer(s: RBattle, amount: number, source: string): void {
  const n = Math.min(s.player.maxHp - s.player.hp, Math.max(0, amount));
  if (n <= 0) return;
  s.player.hp += n;
  s.log.push({ type: 'heal', side: 'player', amount: n, source });
}

// ---------------------------------------------------------------------------
// Clones (src/core/clones.ts)

const cloneRules = (data: RoletaData) => data.base.balance.clones;

/**
 * O golpe do vilão cai no clone? Se cair, o clone se gasta (o Doton aguenta 2) e, ao se desfazer, o do raio dá uma
 * descarga em quem bateu e o de areia pode bloquear o chakra dele.
 */
function cloneBlocks(s: RBattle, data: RoletaData, rng: Rng): boolean {
  const cl = s.fx.clone;
  if (!cl) return false;
  const rules = cloneRules(data);
  const kind = rules.kinds[cl.kind];
  if (rng() >= kind.blockChance) return false;
  const worn = wearClone(cl.wear, cl.kind, rules);
  s.log.push({ type: 'clone', side: 'player', action: 'block', kind: cl.kind, ...(worn.broken ? { broken: true } : {}) });
  if (!worn.broken) {
    cl.wear = worn.wear;
    return true;
  }
  s.fx.clone = null;
  const brk = kind.onBreak;
  if (brk?.damagePct) hurtVillain(s, Math.max(1, Math.floor(s.villain.maxHp * brk.damagePct)), 'clone', data, rng);
  if (brk?.effect && s.status === 'ongoing' && rng() < (brk.chance ?? 1)) addEffect(s, 'villain', brk.effect, data);
  return true;
}

/** O clone mostra a próxima ação do vilão (Mokuton), como o Gênio do Nara. */
export const cloneRevealsIntent = (s: RBattle, data: RoletaData) => Boolean(s.fx.clone && cloneRules(data).kinds[s.fx.clone.kind].revealsIntent);

// ---------------------------------------------------------------------------
// Barreiras elementais (src/core/barriers.ts)

const barrierCtx = (data: RoletaData): BarrierContext => ({ kekkeiGenkai: data.base.kekkeiGenkai, beats: data.base.beats, elements: data.base.balance.elements });

/** Natureza do vilão: a Kekkei Genkai, senão o elemento. */
const villainNature = (def: VillainDef): Nature | null => def.kekkeiGenkai ?? def.element ?? null;

/** O golpe do vilão contra uma barreira: taijutsu é neutro; o ninjutsu tem o elemento da técnica ou o dele. */
function villainAttackInfo(s: RBattle, tech: VillainTechnique): BarrierAttack {
  const mirrors = s.villain.def.passive?.kind === 'mirrors' ? s.villain.def.passive.actions : 1;
  return { type: tech.type, nature: tech.type === 'taijutsu' ? null : (tech.element ?? villainNature(s.villain.def)), hits: (tech.hits ?? 1) * mirrors };
}

/** Multiplicador do golpe do jogador na barreira do vilão (1 sem barreira): a interface mostra a seta. */
export function playerBarrierMult(s: RBattle, t: RTechniqueDef, data: RoletaData): number {
  const b = s.villain.barrier;
  return b ? barrierMult(b, { type: t.type, nature: t.kekkeiGenkai ?? t.element ?? null, hits: t.hits ?? 1 }, barrierCtx(data)) : 1;
}

/** A barreira de quem é atingido (`owner`) recebe o golpe; devolve o que passa para o HP. */
function hitBarrier(s: RBattle, owner: Side, amount: number, atk: BarrierAttack, data: RoletaData, rng: Rng): number {
  const b = owner === 'player' ? s.fx.barrier : s.villain.barrier;
  if (!b || amount <= 0) return amount;
  const r = absorbIntoBarrier(b, amount, atk, barrierCtx(data));
  if (r.absorbed <= 0) return r.passes;
  s.log.push({ type: 'barrier', side: owner, action: 'hit', techId: b.techId, absorbed: r.absorbed, left: b.points, mult: r.mult });
  const effects = owner === 'player' ? s.fx.effects : s.villain.effects;
  // Parede d'Água que absorve fogo apaga a queimadura de quem a ergueu.
  if (r.douse && has(effects, 'burn')) {
    const i = effects.findIndex((e) => e.kind === 'burn');
    effects.splice(i, 1);
    s.log.push({ type: 'barrier', side: owner, action: 'douse', techId: b.techId });
  }
  // Muralha de Chamas: quem bate com taijutsu pode queimar.
  if (r.touched && rng() < (b.burnOnTouch ?? 0)) addEffect(s, owner === 'player' ? 'villain' : 'player', 'burn', data);
  if (r.broken) {
    if (owner === 'player') s.fx.barrier = null;
    else s.villain.barrier = null;
    s.log.push({ type: 'barrier', side: owner, action: 'break', techId: b.techId });
  }
  return r.passes;
}

/** Ergue a barreira do lado `side` (uma de pé por vez). */
function raiseSideBarrier(s: RBattle, side: Side, techId: string, spec: BarrierSpec | { points: number }, nature: Nature | null, data: RoletaData): void {
  const maxHp = side === 'player' ? s.player.maxHp : s.villain.maxHp;
  // +1: o fim do turno em que ergueu já desconta; o escudo vale pelos `barrier.turns` turnos seguintes.
  const b = raiseBarrier(techId, spec, maxHp, nature, data.base.balance.barrier.turns + 1);
  if (side === 'player') s.fx.barrier = b;
  else s.villain.barrier = b;
  s.log.push({ type: 'barrier', side, action: 'raise', techId, points: b.points });
}

/** Especiais da barreira pelo elemento (Muralha de Chamas, Escudo de Vento). */
const barrierSpec = (pct: number, element: string | null | undefined, data: RoletaData): BarrierSpec => ({ pct, ...(element ? data.base.balance.barrierSpecials[element] ?? {} : {}) });

function hurtPlayer(
  s: RBattle,
  amount: number,
  source: 'attack' | 'burn' | 'poison',
  data: RoletaData,
  crit = false,
  hit?: { tech: VillainTechnique; rng: Rng },
): void {
  // Barreira elemental primeiro (só golpes de técnica), depois o escudo comum.
  let n = hit ? hitBarrier(s, 'player', amount, villainAttackInfo(s, hit.tech), data, hit.rng) : amount;
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
  // Pena de fênix: uma vez por luta, fica com 1 de HP.
  if (!s.fx.survivedOnce && relicEffects(s.player, data).surviveOnce) {
    s.fx.survivedOnce = true;
    s.player.hp = 1;
    s.log.push({ type: 'passive', side: 'player', kind: 'phoenix' });
    return;
  }
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
function hurtVillain(
  s: RBattle,
  amount: number,
  source: 'attack' | 'burn' | 'poison' | 'toad' | 'dog' | 'tag' | 'self' | 'clone',
  data: RoletaData,
  rng: Rng,
  crit = false,
  tech?: RTechniqueDef,
): number {
  const v = s.villain;
  let left = tech ? hitBarrier(s, 'villain', amount, { type: tech.type, nature: tech.kekkeiGenkai ?? tech.element ?? null, hits: tech.hits ?? 1 }, data, rng) : amount;
  if (v.shield > 0 && left > 0) {
    const absorbed = Math.min(v.shield, left);
    v.shield -= absorbed;
    left -= absorbed;
    s.log.push({ type: 'shield', side: 'villain', absorbed });
  }
  const n = Math.max(0, Math.min(v.hp, left));
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
    v.techniques = p.monster.techniques;
    v.intent = rollIntent(s, rng);
    s.log.push({ type: 'passive', side: 'villain', kind: 'monster' });
    return n;
  }
  if (p?.kind === 'insane' && v.revivesUsed < Math.min(p.maxRevives ?? data.r.villains.insaneMaxRevives, data.r.villains.insaneRevivesCap)) {
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
