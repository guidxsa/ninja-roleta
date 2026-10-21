import { playerDamage, villainDamage } from './damage';
import { elementMultiplier } from './elements';
import type { GameData } from './gameData';
import { critChance, genjutsuHitChance, hitChance, rollHit, type HitOutcome } from './hit';
import { initiativeChance, rollInitiative } from './initiative';
import { medicalHealPct, type PlayerState } from './player';
import type { Rng } from './rng';
import { chanceSlices, spin } from './roulette';
import type { AttackType, Element, SummonAnimal, TechniqueDef, VillainDef } from './types';

export type PlayerAction = AttackType | 'gates' | 'medical' | 'rest';
export type Side = 'player' | 'villain';
export type BattleStatus = 'ongoing' | 'won' | 'lost';
export type SurgeMode = 'control' | 'frenzy';

export interface StatusFx {
  /** Ações que o lutador ainda vai perder (Debilitado). */
  debilitated: number;
  /** Ações que o lutador precisa fazer antes de poder ser debilitado de novo. */
  debilitateImmunity: number;
}

export interface PlayerFx extends StatusFx {
  gatesUsed: boolean;
  gatesTurns: number;
  surgeUsed: boolean;
  surgeTurns: number;
  surgeMode: SurgeMode | null;
  /** Ramen: o próximo ataque do jogador é crítico garantido. */
  guaranteedCrit: boolean;
}

export interface VillainState {
  def: VillainDef;
  hp: number;
  chakra: number;
  /** Veneno da cobra: dano no fim da rodada, cai 1 por rodada. 0 = sem veneno. */
  poison: number;
  fx: StatusFx;
}

export interface BattleOptions {
  /** false no exame chunin: o item de retorno não é consumido e perder só encerra a luta. */
  allowRevive: boolean;
  /** Emboscada: o jogador age primeiro na 1ª rodada. */
  playerStartsFirst: boolean;
  /** Desvantagem de ação (velhinha, derrota no jokenpô): o vilão age primeiro na 1ª rodada. */
  villainStartsFirst: boolean;
  /** Ramen: o primeiro ataque do jogador é crítico garantido (pula a rolagem de acerto). */
  guaranteedCrit: boolean;
  /** Buff temporário do vilão (evento pré-luta). */
  villainDamageMult: number;
}

export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'ambush' }
  | { type: 'late' }
  | { type: 'guaranteedCrit' }
  | { type: 'initiative'; first: Side; playerChance: number }
  | { type: 'skip'; side: Side }
  | { type: 'rest'; chakra: number }
  | { type: 'villainRest'; chakra: number }
  | { type: 'medical'; healed: number }
  | { type: 'gates'; hpLost: number }
  | {
      type: 'attack';
      side: Side;
      techniqueId: string;
      attackType: AttackType;
      outcome: HitOutcome;
      damage: number;
      elementMult: number;
      hitChance: number;
      critChance: number;
    }
  | { type: 'movementReading'; damageBefore: number; damage: number }
  | { type: 'debilitate'; target: Side; turns: number }
  | { type: 'debilitateResisted'; target: Side }
  | { type: 'summonRegen'; hp: number }
  | { type: 'poison'; value: number }
  | { type: 'poisonTick'; damage: number; remaining: number }
  | { type: 'regen'; hp: number; chakra: number }
  | { type: 'surge'; mode: SurgeMode; healed: number }
  | { type: 'surgeDrain'; hpLost: number }
  | { type: 'revive'; revivesLeft: number }
  | { type: 'end'; status: 'won' | 'lost' };

export interface BattleState {
  round: number;
  status: BattleStatus;
  player: PlayerState;
  playerFx: PlayerFx;
  villain: VillainState;
  options: BattleOptions;
  /** Log acumulado da luta, em ordem. A UI anima a partir dele. */
  log: BattleEvent[];
}

const DEFAULT_OPTIONS: BattleOptions = {
  allowRevive: true,
  playerStartsFirst: false,
  villainStartsFirst: false,
  guaranteedCrit: false,
  villainDamageMult: 1,
};

export function startBattle(
  player: PlayerState,
  villain: VillainDef,
  options: Partial<BattleOptions> = {},
): BattleState {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return {
    round: 0,
    status: 'ongoing',
    player,
    playerFx: {
      debilitated: 0,
      debilitateImmunity: 0,
      gatesUsed: false,
      gatesTurns: 0,
      surgeUsed: false,
      surgeTurns: 0,
      surgeMode: null,
      guaranteedCrit: opts.guaranteedCrit,
    },
    villain: {
      def: villain,
      hp: villain.hp,
      chakra: villain.chakra,
      poison: 0,
      fx: { debilitated: 0, debilitateImmunity: 0 },
    },
    options: opts,
    log: [],
  };
}

/** "Por nível" das invocações conta a partir do nível 2. */
function summonBonus(player: PlayerState, animal: SummonAnimal): number | null {
  return player.summon?.animal === animal ? player.summon.level - 1 : null;
}

/** Sapo: dano base extra em todos os ataques. */
export function toadDamageBonus(player: PlayerState, data: GameData): number {
  const extra = summonBonus(player, 'toad');
  if (extra === null) return 0;
  const cfg = data.balance.summon.toad;
  return cfg.baseDamage + cfg.baseDamagePerLevel * extra;
}

/** Cobra: valor inicial do veneno aplicado. 0 = não tem cobra. */
export function snakePoison(player: PlayerState, data: GameData): number {
  const extra = summonBonus(player, 'snake');
  if (extra === null) return 0;
  const cfg = data.balance.summon.snake;
  return cfg.poison + cfg.poisonPerLevel * extra;
}

/** Lesma: fração do HP máximo curada no início de cada rodada. 0 = não tem lesma. */
export function slugHealPct(player: PlayerState, data: GameData): number {
  const extra = summonBonus(player, 'slug');
  if (extra === null) return 0;
  const cfg = data.balance.summon.slug;
  return cfg.healPct + cfg.healPctPerLevel * extra;
}

/**
 * Técnica que o jogador usa para um tipo: a aprendida ou a ação básica, com elemento resolvido
 * e dano base já somado aos upgrades do tipo, à ferramenta ninja e ao sapo.
 */
export function playerTechnique(
  player: PlayerState,
  type: AttackType,
  data: GameData,
): TechniqueDef & { element: Element | null } {
  const { balance } = data;
  const id = player.techniques[type];
  const tech = (id && data.techniquesById[id]) || data.basicTechniques[type];
  const element = type === 'taijutsu' ? null : tech.element === 'affinity' ? player.affinity : tech.element;
  const baseDamage =
    tech.baseDamage +
    (player.techniqueLevels[type] ?? 0) * balance.techniqueUpgrade.baseDamagePerLevel +
    player.ninjaToolLevel * balance.ninjaTool.baseDamagePerLevel +
    toadDamageBonus(player, data);
  return { ...tech, element, baseDamage };
}

/** Ninjutsu médico do jogador (null = não sabe). */
export function playerMedical(player: PlayerState, data: GameData): TechniqueDef | null {
  const id = player.techniques.medical;
  return (id && data.techniquesById[id]) || null;
}

export function availableActions(state: BattleState, data: GameData): PlayerAction[] {
  const p = state.player;
  const actions: PlayerAction[] = [];
  for (const type of ['taijutsu', 'ninjutsu', 'genjutsu'] as const) {
    if (p.forbiddenAttackTypes.includes(type)) continue;
    if (p.chakra >= playerTechnique(p, type, data).chakraCost) actions.push(type);
  }
  if (
    p.passive?.kind === 'gates' &&
    !state.playerFx.gatesUsed &&
    p.chakra >= playerTechnique(p, 'taijutsu', data).chakraCost
  ) {
    actions.push('gates');
  }
  const medical = playerMedical(p, data);
  if (medical && p.chakra >= medical.chakraCost && p.hp < p.maxHp) actions.push('medical');
  actions.push('rest');
  return actions;
}

/**
 * Joga uma rodada: iniciativa, ação de cada lado, efeitos de fim de rodada.
 * Pura: devolve um novo estado e não altera `prev`.
 */
export function playRound(prev: BattleState, action: PlayerAction, rng: Rng, data: GameData): BattleState {
  if (prev.status !== 'ongoing') throw new Error('A luta já terminou');
  if (!availableActions(prev, data).includes(action)) throw new Error(`Ação indisponível: ${action}`);

  const s = structuredClone(prev);
  s.round++;
  s.log.push({ type: 'round', round: s.round });

  startOfRound(s, data);

  let playerFirst: boolean;
  if (s.round === 1 && s.options.playerStartsFirst) {
    s.log.push({ type: 'ambush' });
    playerFirst = true;
  } else if (s.round === 1 && s.options.villainStartsFirst) {
    s.log.push({ type: 'late' });
    playerFirst = false;
  } else {
    const chance = initiativeChance(s.player.speed, s.villain.def.speed);
    playerFirst = rollInitiative(s.player.speed, s.villain.def.speed, rng) === 'a';
    s.log.push({ type: 'initiative', first: playerFirst ? 'player' : 'villain', playerChance: chance });
  }

  const order: Side[] = playerFirst ? ['player', 'villain'] : ['villain', 'player'];
  for (const side of order) {
    if (s.status !== 'ongoing') break;
    if (side === 'player') playerTurn(s, action, rng, data);
    else villainTurn(s, rng, data);
  }

  if (s.status === 'ongoing') endOfRound(s, data);
  return s;
}

// ---------------------------------------------------------------------------
// Internos: operam sobre o clone criado em playRound.

function finish(s: BattleState, status: 'won' | 'lost'): void {
  s.status = status;
  s.log.push({ type: 'end', status });
}

/** Debilitado: consome uma ação perdida. Devolve true se o lutador perdeu a vez. */
function consumeSkip(s: BattleState, fx: StatusFx, side: Side, data: GameData): boolean {
  if (fx.debilitated <= 0) return false;
  fx.debilitated--;
  if (fx.debilitated === 0) fx.debilitateImmunity = data.balance.debilitated.immunityActions;
  s.log.push({ type: 'skip', side });
  return true;
}

function afterAction(fx: StatusFx): void {
  if (fx.debilitateImmunity > 0) fx.debilitateImmunity--;
}

function applyDebilitate(s: BattleState, fx: StatusFx, target: Side, turns: number): void {
  if (fx.debilitateImmunity > 0) {
    s.log.push({ type: 'debilitateResisted', target });
    return;
  }
  fx.debilitated = Math.max(fx.debilitated, turns);
  s.log.push({ type: 'debilitate', target, turns });
}

function startOfRound(s: BattleState, data: GameData): void {
  const p = s.player;
  if (p.passive?.kind === 'vitality') {
    const hp = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * p.passive.hpPctPerTurn));
    const chakra = Math.min(p.maxChakra - p.chakra, p.passive.chakraPerTurn);
    if (hp > 0 || chakra > 0) {
      p.hp += hp;
      p.chakra += chakra;
      s.log.push({ type: 'regen', hp, chakra });
    }
  }
  const slugPct = slugHealPct(p, data);
  if (slugPct > 0) {
    const hp = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * slugPct));
    if (hp > 0) {
      p.hp += hp;
      s.log.push({ type: 'summonRegen', hp });
    }
  }
}

function endOfRound(s: BattleState, data: GameData): void {
  const v = s.villain;
  if (v.poison > 0) {
    const damage = Math.min(v.hp, v.poison);
    v.hp -= damage;
    v.poison--;
    s.log.push({ type: 'poisonTick', damage, remaining: v.poison });
    if (v.hp === 0) {
      finish(s, 'won');
      return;
    }
  }

  const p = s.player;
  const fx = s.playerFx;
  if (fx.gatesTurns > 0) fx.gatesTurns--;
  if (fx.surgeTurns > 0) {
    if (fx.surgeMode === 'frenzy') {
      const loss = Math.floor(p.maxHp * data.balance.jinchuuriki.surge.frenzy.hpLossPctPerTurn);
      const newHp = Math.max(1, p.hp - loss);
      s.log.push({ type: 'surgeDrain', hpLost: p.hp - newHp });
      p.hp = newHp;
    }
    fx.surgeTurns--;
    if (fx.surgeTurns === 0) fx.surgeMode = null;
  }
}

function surgeDamageMult(s: BattleState, data: GameData): number {
  const { surgeTurns, surgeMode } = s.playerFx;
  if (surgeTurns <= 0 || !surgeMode) return 1;
  return data.balance.jinchuuriki.surge[surgeMode].damageMult;
}

/** Surto da besta: uma vez por luta, ao cair abaixo do limiar de HP. */
function checkSurge(s: BattleState, rng: Rng, data: GameData): void {
  const p = s.player;
  const fx = s.playerFx;
  const cfg = data.balance.jinchuuriki.surge;
  if (!p.jinchuuriki || fx.surgeUsed || p.hp <= 0 || p.hp >= p.maxHp * cfg.hpThresholdPct) return;

  const mode = spin(
    chanceSlices<SurgeMode>(
      cfg.controlChance,
      { label: 'control', value: 'control' },
      { label: 'frenzy', value: 'frenzy' },
    ),
    rng,
  ).slice.value;
  fx.surgeUsed = true;
  fx.surgeMode = mode;
  fx.surgeTurns = cfg.turns;
  let healed = 0;
  if (mode === 'control') {
    healed = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * cfg.control.healPct));
    p.hp += healed;
  }
  s.log.push({ type: 'surge', mode, healed });
}

function playerTurn(s: BattleState, action: PlayerAction, rng: Rng, data: GameData): void {
  if (consumeSkip(s, s.playerFx, 'player', data)) return;
  const p = s.player;

  if (action === 'rest') {
    const gained = Math.min(p.maxChakra - p.chakra, data.balance.rest.chakraRecovered);
    p.chakra += gained;
    s.log.push({ type: 'rest', chakra: gained });
  } else if (action === 'gates') {
    if (p.passive?.kind !== 'gates') throw new Error('Portões exigem a passiva correspondente');
    const hpLost = Math.min(Math.floor(p.maxHp * p.passive.hpCostPct), p.hp - 1);
    p.hp -= hpLost;
    s.playerFx.gatesUsed = true;
    s.playerFx.gatesTurns = p.passive.turns;
    s.log.push({ type: 'gates', hpLost });
    checkSurge(s, rng, data);
    playerAttack(s, 'taijutsu', rng, data);
  } else if (action === 'medical') {
    // Ninjutsu médico: cura sem rolar acerto.
    const tech = playerMedical(p, data);
    if (!tech) throw new Error('O jogador não sabe ninjutsu médico');
    p.chakra -= tech.chakraCost;
    const healed = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * medicalHealPct(p, data)));
    p.hp += healed;
    s.log.push({ type: 'medical', healed });
  } else {
    playerAttack(s, action, rng, data);
  }
  afterAction(s.playerFx);
}

function playerAttack(s: BattleState, type: AttackType, rng: Rng, data: GameData): void {
  const { balance } = data;
  const p = s.player;
  const v = s.villain;
  const tech = playerTechnique(p, type, data);
  p.chakra -= tech.chakraCost;

  const hitP =
    type === 'genjutsu'
      ? genjutsuHitChance(p.offense.genjutsu, v.def.defense.genjutsu, balance.genjutsuHit)
      : hitChance(p.speed, v.def.speed, balance.hit);
  const critP = critChance(p.critBonus, balance.crit.baseChance);
  let outcome: HitOutcome;
  if (s.playerFx.guaranteedCrit) {
    s.playerFx.guaranteedCrit = false;
    s.log.push({ type: 'guaranteedCrit' });
    outcome = 'crit';
  } else {
    outcome = rollHit(hitP, critP, rng);
  }
  const elementMult = elementMultiplier(tech.element, v.def.element, data.beats, balance.elements);

  let damage = 0;
  if (outcome !== 'miss') {
    const gatesMult =
      type === 'taijutsu' && s.playerFx.gatesTurns > 0 && p.passive?.kind === 'gates' ? p.passive.taijutsuMult : 1;
    damage = playerDamage({
      baseDamage: tech.baseDamage,
      offense: p.offense[type],
      defense: v.def.defense[type],
      defensePierce: type === 'taijutsu' && p.passive?.kind === 'preciseFist' ? p.passive.defensePierce : 0,
      elementMult,
      critMult: outcome === 'crit' ? balance.crit.multiplier : 1,
      extraMult: gatesMult * surgeDamageMult(s, data),
    });
    v.hp = Math.max(0, v.hp - damage);
  }
  s.log.push({
    type: 'attack',
    side: 'player',
    techniqueId: tech.id,
    attackType: type,
    outcome,
    damage,
    elementMult,
    hitChance: hitP,
    critChance: critP,
  });

  if (v.hp === 0) {
    finish(s, 'won');
    return;
  }
  if (outcome === 'miss') return;
  if (tech.debilitateTurns) applyDebilitate(s, v.fx, 'villain', tech.debilitateTurns);
  // Cobra: um golpe que acerta envenena o alvo, se ele ainda não estiver envenenado.
  const poison = snakePoison(p, data);
  if (poison > 0 && v.poison === 0) {
    v.poison = poison;
    s.log.push({ type: 'poison', value: poison });
  }
}

function villainTurn(s: BattleState, rng: Rng, data: GameData): void {
  const v = s.villain;
  if (consumeSkip(s, v.fx, 'villain', data)) return;
  const { balance } = data;
  const p = s.player;

  // O vilão só escolhe entre as técnicas que pode pagar; sem nenhuma, concentra chakra.
  const affordable = v.def.techniques.filter((t) => t.chakraCost <= v.chakra);
  if (affordable.length === 0) {
    const gained = Math.min(v.def.chakra - v.chakra, balance.villainRest.chakraRecovered);
    v.chakra += gained;
    s.log.push({ type: 'villainRest', chakra: gained });
    afterAction(v.fx);
    return;
  }
  const tech = spin(
    affordable.map((t) => ({ label: t.id, weight: t.weight, value: t })),
    rng,
  ).slice.value;
  v.chakra -= tech.chakraCost;

  const hitP =
    tech.type === 'genjutsu'
      ? genjutsuHitChance(v.def.defense.genjutsu, p.offense.genjutsu, balance.genjutsuHit)
      : hitChance(v.def.speed, p.speed, balance.hit);
  const critP = critChance(v.def.critBonus, balance.crit.baseChance);
  const outcome = rollHit(hitP, critP, rng);
  const element = tech.type === 'taijutsu' ? null : tech.element === undefined ? v.def.element : tech.element;
  const elementMult = elementMultiplier(element, p.affinity, data.beats, balance.elements);

  let damage = 0;
  if (outcome !== 'miss') {
    damage = villainDamage({
      baseDamage: tech.baseDamage,
      playerOffense: p.offense[tech.type],
      resistanceBonus: p.resistanceBonus,
      offenseDivisor: balance.resistance.offenseDivisor,
      elementMult,
      critMult: outcome === 'crit' ? balance.crit.multiplier : 1,
      extraMult: s.options.villainDamageMult,
    });
    if (p.passive?.kind === 'movementReading') {
      const read = spin(
        chanceSlices(p.passive.chance, { label: 'read', value: true }, { label: 'noRead', value: false }),
        rng,
      ).slice.value;
      if (read) {
        const reduced = Math.max(1, Math.floor(damage * p.passive.damageFactor));
        s.log.push({ type: 'movementReading', damageBefore: damage, damage: reduced });
        damage = reduced;
      }
    }
    p.hp = Math.max(0, p.hp - damage);
  }
  s.log.push({
    type: 'attack',
    side: 'villain',
    techniqueId: tech.id,
    attackType: tech.type,
    outcome,
    damage,
    elementMult,
    hitChance: hitP,
    critChance: critP,
  });
  afterAction(v.fx);

  if (p.hp === 0) {
    handleKnockout(s);
    return;
  }
  if (outcome !== 'miss' && tech.debilitateTurns) applyDebilitate(s, s.playerFx, 'player', tech.debilitateTurns);
  checkSurge(s, rng, data);
}

/** HP 0: usa o item de retorno (restauração total) ou encerra a luta. */
function handleKnockout(s: BattleState): void {
  const p = s.player;
  if (s.options.allowRevive && p.revives > 0) {
    p.revives--;
    p.revivesUsed++;
    p.hp = p.maxHp;
    p.chakra = p.maxChakra;
    s.log.push({ type: 'revive', revivesLeft: p.revives });
    return;
  }
  finish(s, 'lost');
}
