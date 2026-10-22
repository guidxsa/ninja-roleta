import { playerDamage, villainDamage } from './damage';
import { elementMultiplier } from './elements';
import type { GameData } from './gameData';
import { critChance, genjutsuHitChance, hitChance, rollHit, type HitOutcome } from './hit';
import { initiativeChance, rollInitiative } from './initiative';
import { knownTechniques, medicalHealPct, techniqueSlot, type PlayerState } from './player';
import type { Rng } from './rng';
import { chanceSlices, spin } from './roulette';
import type { AttackType, DojutsuId, Element, SummonAnimal, TechniqueDef, VillainDef } from './types';

/** Usar uma técnica do skill set: `tech:<id>`. */
export type TechniqueAction = `tech:${string}`;
export type PlayerAction = TechniqueAction | 'gates' | 'medical' | 'dojutsu' | 'rest';

export const techAction = (id: string): TechniqueAction => `tech:${id}`;

/** Id da técnica de uma ação `tech:<id>` (null para as ações especiais). */
export function actionTechniqueId(action: PlayerAction): string | null {
  return action.startsWith('tech:') ? action.slice(5) : null;
}
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
  /** Sharingan/Byakugan ativado. */
  dojutsuActive: boolean;
  /** Veneno no jogador (cobras do Orochimaru): dano no fim da rodada, cai 1 por rodada. */
  poison: number;
}

export interface VillainState {
  def: VillainDef;
  hp: number;
  chakra: number;
  /** Veneno da cobra: dano no fim da rodada, cai 1 por rodada. 0 = sem veneno. */
  poison: number;
  fx: StatusFx;
  /** Usos da passiva do vilão nesta luta (surto ou cura). */
  passiveUses: number;
  /** Turnos restantes do surto da besta do vilão. */
  surgeTurns: number;
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
  | { type: 'dojutsu'; dojutsu: DojutsuId; stage: number }
  | { type: 'dojutsuEnd'; dojutsu: DojutsuId }
  | { type: 'chakraDrain'; amount: number }
  | { type: 'villainSurge'; healed: number }
  | { type: 'villainMedical'; healed: number }
  | { type: 'playerPoisoned'; value: number }
  | { type: 'playerPoisonTick'; damage: number; remaining: number }
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
      dojutsuActive: false,
      poison: 0,
    },
    villain: {
      def: villain,
      hp: villain.hp,
      chakra: villain.chakra,
      poison: 0,
      fx: { debilitated: 0, debilitateImmunity: 0 },
      passiveUses: 0,
      surgeTurns: 0,
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
 * Técnica do skill set com elemento resolvido e dano base já somado aos upgrades da categoria,
 * à ferramenta ninja e ao sapo. Genjutsu não causa dano: o dano base fica 0
 * (os upgrades dele aumentam o poder de aprisionamento).
 */
export function playerTechnique(
  player: PlayerState,
  techniqueId: string,
  data: GameData,
): TechniqueDef & { element: Element | null } {
  const { balance } = data;
  const tech = data.techniquesById[techniqueId];
  if (!tech) throw new Error(`Técnica desconhecida: ${techniqueId}`);
  const type = tech.type;
  const element = type === 'taijutsu' ? null : tech.element === 'affinity' ? player.affinity : tech.element;
  if (type === 'genjutsu' || techniqueSlot(tech) === 'medical') return { ...tech, element, baseDamage: 0 };
  const baseDamage =
    tech.baseDamage +
    (player.techniqueLevels[type] ?? 0) * balance.techniqueUpgrade.baseDamagePerLevel +
    player.ninjaToolLevel * balance.ninjaTool.baseDamagePerLevel +
    toadDamageBonus(player, data);
  return { ...tech, element, baseDamage };
}

/** Técnicas de ataque do skill set (tai, nin e gen), na ordem das categorias. */
export function attackTechniques(player: PlayerState, data: GameData): TechniqueDef[] {
  return knownTechniques(player, data).filter((t) => techniqueSlot(t) !== 'medical');
}

// ---------------------------------------------------------------------------
// Dōjutsu

/** Estágio do Sharingan pelo nível (1, 2 ou 3 tomoe). 0 = não tem Sharingan. */
export function sharinganStage(player: PlayerState, data: GameData): number {
  if (player.dojutsu !== 'sharingan') return 0;
  const stages = data.balance.dojutsu.sharingan.stages;
  let stage = 0;
  stages.forEach((st, i) => {
    if (player.level >= st.minLevel) stage = i + 1;
  });
  return stage;
}

/** Bônus do Sharingan ativo (null se não estiver ativo). */
function activeSharingan(s: BattleState, data: GameData) {
  if (!s.playerFx.dojutsuActive || s.player.dojutsu !== 'sharingan') return null;
  const stage = sharinganStage(s.player, data);
  return stage > 0 ? data.balance.dojutsu.sharingan.stages[stage - 1]! : null;
}

function byakuganActive(s: BattleState): boolean {
  return s.playerFx.dojutsuActive && s.player.dojutsu === 'byakugan';
}

/** Custo para ativar o dōjutsu do jogador (null = não tem). */
export function dojutsuActivationCost(player: PlayerState, data: GameData): number | null {
  return player.dojutsu ? data.balance.dojutsu[player.dojutsu].activationCost : null;
}

/** Atributo ofensivo efetivo na luta (com o Sharingan ativo). Tipos proibidos continuam zerados. */
export function effectiveOffense(s: BattleState, type: AttackType, data: GameData): number {
  const base = s.player.offense[type];
  if (s.player.forbiddenAttackTypes.includes(type)) return base;
  return base + (activeSharingan(s, data)?.statBonus ?? 0);
}

export function effectiveSpeed(s: BattleState, data: GameData): number {
  return s.player.speed + (activeSharingan(s, data)?.speed ?? 0);
}

/** Genjutsu do jogador contra ilusões do vilão: genjutsu efetivo + resistência passiva (Uchiha). */
export function playerGenjutsuDefense(s: BattleState, data: GameData): number {
  const p = s.player;
  const passive = p.passive?.kind === 'genjutsuResistance' ? p.passive.bonus : 0;
  return effectiveOffense(s, 'genjutsu', data) + passive;
}

// ---------------------------------------------------------------------------
// Genjutsu

/**
 * Turnos de aprisionamento de um genjutsu que acerta: turnos base da técnica + 1 a cada
 * `pointsPerExtraTurn` de vantagem do poder do atacante sobre o genjutsu do alvo, entre 1 e o teto.
 */
export function genjutsuTurns(power: number, targetGenjutsu: number, baseTurns: number, data: GameData): number {
  const cfg = data.balance.genjutsuPrison;
  const extra = Math.floor(Math.max(0, power - targetGenjutsu) / cfg.pointsPerExtraTurn);
  return Math.min(cfg.maxTurns, Math.max(1, baseTurns + extra));
}

/** Poder de genjutsu do jogador: genjutsu efetivo + bônus da técnica + upgrades + Sharingan. */
export function playerGenjutsuPower(s: BattleState, techniqueId: string, data: GameData): number {
  const tech = playerTechnique(s.player, techniqueId, data);
  return (
    effectiveOffense(s, 'genjutsu', data) +
    (tech.genjutsuPower ?? 0) +
    (s.player.techniqueLevels.genjutsu ?? 0) * data.balance.techniqueUpgrade.genjutsuPowerPerLevel +
    (activeSharingan(s, data)?.genjutsuPower ?? 0)
  );
}

/** Turnos que o genjutsu do jogador aprisiona o vilão, se acertar. */
export function playerGenjutsuTurns(s: BattleState, techniqueId: string, data: GameData): number {
  const tech = playerTechnique(s.player, techniqueId, data);
  return genjutsuTurns(
    playerGenjutsuPower(s, techniqueId, data),
    s.villain.def.defense.genjutsu,
    tech.debilitateTurns ?? 1,
    data,
  );
}

export function playerGenjutsuHitChance(s: BattleState, data: GameData): number {
  const cfg = data.balance.genjutsuHit;
  const bonus = activeSharingan(s, data)?.genjutsuHit ?? 0;
  return Math.min(1, genjutsuHitChance(effectiveOffense(s, 'genjutsu', data), s.villain.def.defense.genjutsu, cfg) + bonus);
}

// ---------------------------------------------------------------------------
// Prévia de ataque (UI e jogador automático usam a mesma conta do combate)

export interface AttackPreview {
  hitChance: number;
  critChance: number;
  elementMult: number;
  /** Dano de um acerto normal (sem crítico nem passivas aleatórias). */
  damage: number;
}

export function attackPreview(s: BattleState, techniqueId: string, data: GameData): AttackPreview {
  const { balance } = data;
  const p = s.player;
  const v = s.villain.def;
  const tech = playerTechnique(p, techniqueId, data);
  const type = tech.type;
  const elementMult = elementMultiplier(tech.element, v.element, data.beats, balance.elements);
  const hitP = byakuganActive(s) ? 1 : hitChance(effectiveSpeed(s, data), v.speed, balance.hit);
  const critP = critChance(p.critBonus, balance.crit.baseChance);
  const damage = playerDamage({
    baseDamage: tech.baseDamage,
    offense: effectiveOffense(s, type, data),
    defense: v.defense[type],
    defensePierce: type === 'taijutsu' && p.passive?.kind === 'preciseFist' ? p.passive.defensePierce : 0,
    elementMult,
    critMult: 1,
    extraMult: playerDamageMult(s, type, data),
  });
  return { hitChance: hitP, critChance: critP, elementMult, damage };
}

/** Multiplicadores de dano do jogador: portões, Byakugan (taijutsu) e surto da besta. */
function playerDamageMult(s: BattleState, type: AttackType, data: GameData): number {
  const p = s.player;
  let mult = surgeDamageMult(s, data);
  if (type === 'taijutsu') {
    if (s.playerFx.gatesTurns > 0 && p.passive?.kind === 'gates') mult *= p.passive.taijutsuMult;
    if (byakuganActive(s)) mult *= data.balance.dojutsu.byakugan.taijutsuMult;
  }
  return mult;
}

/** Ninjutsu médico do jogador (null = não sabe). */
export function playerMedical(player: PlayerState, data: GameData): TechniqueDef | null {
  return knownTechniques(player, data).find((t) => techniqueSlot(t) === 'medical') ?? null;
}

/** Taijutsu sem custo mais forte do jogador: o golpe que acompanha a abertura dos portões. */
export function gatesTechnique(player: PlayerState, data: GameData): TechniqueDef {
  const free = attackTechniques(player, data).filter(
    (t) => t.type === 'taijutsu' && t.chakraCost === 0 && !t.requiresDojutsu,
  );
  return free.reduce((a, b) => (b.baseDamage > a.baseDamage ? b : a));
}

/** A técnica pode ser usada agora (dōjutsu exigido ativo e chakra suficiente). */
export function canUseTechnique(s: BattleState, tech: TechniqueDef): boolean {
  const p = s.player;
  if (p.forbiddenAttackTypes.includes(tech.type)) return false;
  if (tech.requiresDojutsu && !(s.playerFx.dojutsuActive && p.dojutsu === tech.requiresDojutsu)) return false;
  return p.chakra >= tech.chakraCost;
}

export function availableActions(state: BattleState, data: GameData): PlayerAction[] {
  const p = state.player;
  const actions: PlayerAction[] = [];
  for (const tech of attackTechniques(p, data)) {
    if (canUseTechnique(state, tech)) actions.push(techAction(tech.id));
  }
  if (p.passive?.kind === 'gates' && !state.playerFx.gatesUsed) actions.push('gates');
  const dojutsuCost = dojutsuActivationCost(p, data);
  if (dojutsuCost !== null && !state.playerFx.dojutsuActive && p.chakra >= dojutsuCost) actions.push('dojutsu');
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
    const speed = effectiveSpeed(s, data);
    const chance = initiativeChance(speed, s.villain.def.speed);
    playerFirst = rollInitiative(speed, s.villain.def.speed, rng) === 'a';
    s.log.push({ type: 'initiative', first: playerFirst ? 'player' : 'villain', playerChance: chance });
  }

  const order: Side[] = playerFirst ? ['player', 'villain'] : ['villain', 'player'];
  for (const side of order) {
    if (s.status !== 'ongoing') break;
    if (side === 'player') playerTurn(s, action, rng, data);
    else villainTurn(s, rng, data);
  }

  if (s.status === 'ongoing') endOfRound(s, rng, data);
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

function endOfRound(s: BattleState, rng: Rng, data: GameData): void {
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
    checkVillainSurge(s);
  }
  if (v.surgeTurns > 0) v.surgeTurns--;

  const p = s.player;
  const fx = s.playerFx;
  if (fx.poison > 0) {
    const damage = Math.min(p.hp, fx.poison);
    p.hp -= damage;
    fx.poison--;
    s.log.push({ type: 'playerPoisonTick', damage, remaining: fx.poison });
    if (p.hp === 0) {
      handleKnockout(s);
      if (s.status !== 'ongoing') return;
    } else {
      checkSurge(s, rng, data);
    }
  }
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
  // Dōjutsu ativo custa chakra a cada rodada; sem chakra para pagar, desliga.
  if (fx.dojutsuActive && p.dojutsu) {
    const upkeep = data.balance.dojutsu[p.dojutsu].upkeep;
    if (p.chakra >= upkeep) {
      p.chakra -= upkeep;
    } else {
      fx.dojutsuActive = false;
      s.log.push({ type: 'dojutsuEnd', dojutsu: p.dojutsu });
    }
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

  const techId = actionTechniqueId(action);
  if (techId) {
    const tech = data.techniquesById[techId]!;
    if (tech.type === 'genjutsu') playerGenjutsu(s, techId, rng, data);
    else playerAttack(s, techId, rng, data);
  } else if (action === 'rest') {
    const gained = Math.min(p.maxChakra - p.chakra, data.balance.rest.chakraRecovered);
    p.chakra += gained;
    s.log.push({ type: 'rest', chakra: gained });
  } else if (action === 'dojutsu') {
    if (!p.dojutsu) throw new Error('O jogador não tem dōjutsu');
    p.chakra -= data.balance.dojutsu[p.dojutsu].activationCost;
    s.playerFx.dojutsuActive = true;
    s.log.push({ type: 'dojutsu', dojutsu: p.dojutsu, stage: sharinganStage(p, data) });
  } else if (action === 'gates') {
    if (p.passive?.kind !== 'gates') throw new Error('Portões exigem a passiva correspondente');
    const hpLost = Math.min(Math.floor(p.maxHp * p.passive.hpCostPct), p.hp - 1);
    p.hp -= hpLost;
    s.playerFx.gatesUsed = true;
    s.playerFx.gatesTurns = p.passive.turns;
    s.log.push({ type: 'gates', hpLost });
    checkSurge(s, rng, data);
    playerAttack(s, gatesTechnique(p, data).id, rng, data);
  } else if (action === 'medical') {
    // Ninjutsu médico: cura sem rolar acerto.
    const tech = playerMedical(p, data);
    if (!tech) throw new Error('O jogador não sabe ninjutsu médico');
    p.chakra -= tech.chakraCost;
    const healed = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * medicalHealPct(p, data)));
    p.hp += healed;
    s.log.push({ type: 'medical', healed });
  }
  afterAction(s.playerFx);
}

/** Genjutsu: não causa dano nem consome o crítico garantido; se acertar, aprisiona o vilão. */
function playerGenjutsu(s: BattleState, techId: string, rng: Rng, data: GameData): void {
  const p = s.player;
  const v = s.villain;
  const tech = playerTechnique(p, techId, data);
  p.chakra -= tech.chakraCost;
  const hitP = playerGenjutsuHitChance(s, data);
  const outcome = rollHit(hitP, 0, rng);
  s.log.push({
    type: 'attack',
    side: 'player',
    techniqueId: tech.id,
    attackType: 'genjutsu',
    outcome,
    damage: 0,
    elementMult: 1,
    hitChance: hitP,
    critChance: 0,
  });
  if (outcome !== 'miss') applyDebilitate(s, v.fx, 'villain', playerGenjutsuTurns(s, techId, data));
}

function playerAttack(s: BattleState, techId: string, rng: Rng, data: GameData): void {
  const { balance } = data;
  const p = s.player;
  const v = s.villain;
  const tech = playerTechnique(p, techId, data);
  const type = tech.type;
  const preview = attackPreview(s, techId, data);
  p.chakra -= tech.chakraCost;

  let outcome: HitOutcome;
  if (s.playerFx.guaranteedCrit) {
    s.playerFx.guaranteedCrit = false;
    s.log.push({ type: 'guaranteedCrit' });
    outcome = 'crit';
  } else {
    outcome = rollHit(preview.hitChance, preview.critChance, rng);
  }

  let damage = 0;
  if (outcome !== 'miss') {
    damage = playerDamage({
      baseDamage: tech.baseDamage,
      offense: effectiveOffense(s, type, data),
      defense: v.def.defense[type],
      defensePierce: type === 'taijutsu' && p.passive?.kind === 'preciseFist' ? p.passive.defensePierce : 0,
      elementMult: preview.elementMult,
      critMult: outcome === 'crit' ? balance.crit.multiplier : 1,
      extraMult: playerDamageMult(s, type, data),
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
    elementMult: preview.elementMult,
    hitChance: preview.hitChance,
    critChance: preview.critChance,
  });

  if (v.hp === 0) {
    finish(s, 'won');
    return;
  }
  if (outcome === 'miss') return;
  // Golpe inibidor: drena o chakra do vilão.
  if (tech.chakraDrain) {
    const amount = Math.min(v.chakra, tech.chakraDrain);
    v.chakra -= amount;
    s.log.push({ type: 'chakraDrain', amount });
  }
  // Cobra: um golpe que acerta envenena o alvo, se ele ainda não estiver envenenado.
  const poison = snakePoison(p, data);
  if (poison > 0 && v.poison === 0) {
    v.poison = poison;
    s.log.push({ type: 'poison', value: poison });
  }
  checkVillainSurge(s);
}

/** Surto da besta do vilão (Gaara): uma vez por luta, abaixo do limiar de HP. */
function checkVillainSurge(s: BattleState): void {
  const v = s.villain;
  const passive = v.def.passive;
  if (passive?.kind !== 'beastSurge' || v.passiveUses > 0 || v.hp <= 0) return;
  if (v.hp >= v.def.hp * passive.hpThresholdPct) return;
  v.passiveUses++;
  v.surgeTurns = passive.turns;
  const healed = Math.min(v.def.hp - v.hp, Math.floor(v.def.hp * passive.healPct));
  v.hp += healed;
  s.log.push({ type: 'villainSurge', healed });
}

function villainTurn(s: BattleState, rng: Rng, data: GameData): void {
  const v = s.villain;
  if (consumeSkip(s, v.fx, 'villain', data)) return;
  const { balance } = data;
  const p = s.player;
  const passive = v.def.passive;

  // Ninjutsu médico do vilão (Kabuto): abaixo do limiar, cura no lugar de atacar.
  if (
    passive?.kind === 'medical' &&
    v.passiveUses < passive.maxUses &&
    v.hp < v.def.hp * passive.hpThresholdPct &&
    v.chakra >= passive.chakraCost
  ) {
    v.passiveUses++;
    v.chakra -= passive.chakraCost;
    const healed = Math.min(v.def.hp - v.hp, Math.floor(v.def.hp * passive.healPct));
    v.hp += healed;
    s.log.push({ type: 'villainMedical', healed });
    afterAction(v.fx);
    return;
  }

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

  if (tech.type === 'genjutsu') {
    // Genjutsu do vilão: sem dano; o poder dele é o atributo de genjutsu, contra o genjutsu do jogador
    // (com a resistência passiva do Uchiha).
    const defense = playerGenjutsuDefense(s, data);
    const hitP = genjutsuHitChance(v.def.defense.genjutsu, defense, balance.genjutsuHit);
    const outcome = rollHit(hitP, 0, rng);
    s.log.push({
      type: 'attack',
      side: 'villain',
      techniqueId: tech.id,
      attackType: 'genjutsu',
      outcome,
      damage: 0,
      elementMult: 1,
      hitChance: hitP,
      critChance: 0,
    });
    afterAction(v.fx);
    if (outcome !== 'miss') {
      const turns = genjutsuTurns(v.def.defense.genjutsu, defense, tech.debilitateTurns ?? 1, data);
      applyDebilitate(s, s.playerFx, 'player', turns);
    }
    return;
  }

  const hitP = hitChance(v.def.speed, effectiveSpeed(s, data), balance.hit);
  const critP = critChance(v.def.critBonus, balance.crit.baseChance);
  const outcome = rollHit(hitP, critP, rng);
  const element = tech.type === 'taijutsu' ? null : tech.element === undefined ? v.def.element : tech.element;
  const elementMult = elementMultiplier(element, p.affinity, data.beats, balance.elements);
  const surgeMult = v.surgeTurns > 0 && passive?.kind === 'beastSurge' ? passive.damageMult : 1;

  let damage = 0;
  if (outcome !== 'miss') {
    damage = villainDamage({
      baseDamage: tech.baseDamage,
      playerOffense: effectiveOffense(s, tech.type, data),
      resistanceBonus: p.resistanceBonus,
      offenseDivisor: balance.resistance.offenseDivisor,
      elementMult,
      critMult: outcome === 'crit' ? balance.crit.multiplier : 1,
      extraMult: s.options.villainDamageMult * surgeMult,
    });
    // Sharingan ativo: chance de ler o movimento e reduzir o dano.
    const sharingan = activeSharingan(s, data);
    if (sharingan) {
      const read = spin(
        chanceSlices(sharingan.readChance, { label: 'read', value: true }, { label: 'noRead', value: false }),
        rng,
      ).slice.value;
      if (read) {
        const reduced = Math.max(1, Math.floor(damage * balance.dojutsu.sharingan.readDamageFactor));
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
  // Cobras do vilão (Orochimaru): golpe que acerta envenena, se o jogador ainda não estiver envenenado.
  if (outcome !== 'miss' && passive?.kind === 'snakeSummon' && s.playerFx.poison === 0) {
    s.playerFx.poison = passive.poison;
    s.log.push({ type: 'playerPoisoned', value: passive.poison });
  }
  checkSurge(s, rng, data);
}

/** HP 0: usa o item de retorno (restauração total, limpa o veneno) ou encerra a luta. */
function handleKnockout(s: BattleState): void {
  const p = s.player;
  if (s.options.allowRevive && p.revives > 0) {
    p.revives--;
    p.revivesUsed++;
    p.hp = p.maxHp;
    p.chakra = p.maxChakra;
    s.playerFx.poison = 0;
    s.log.push({ type: 'revive', revivesLeft: p.revives });
    return;
  }
  finish(s, 'lost');
}
