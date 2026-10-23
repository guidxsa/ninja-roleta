import { playerDamage, villainDamage } from './damage';
import { elementMultiplier } from './elements';
import type { GameData } from './gameData';
import { critChance, genjutsuHitChance, hitChance, rollHit, type HitOutcome } from './hit';
import { initiativeChance, rollInitiative } from './initiative';
import { gatesStage, knownTechniques, medicalHealPct, techniqueSlot, type PlayerState } from './player';
import type { Rng } from './rng';
import { clamp } from './rng';
import { chanceSlices, spin } from './roulette';
import type { AttackType, CloakDef, DojutsuId, Element, SummonAnimal, TechniqueDef, VillainDef } from './types';

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

/** Por que o lutador perdeu a vez. */
export type SkipReason = 'prison' | 'paralysis' | 'cower';
/** Efeitos negativos que aparecem como "status" na luta. */
export type StatusKind = 'stun' | 'burn' | 'poison' | 'bleed';

/** Envenenamento em curso: bônus da fonte e quantos tiques já causou. */
export interface PoisonState {
  bonus: number;
  ticks: number;
}

/** Estado de luta comum ao jogador e ao vilão. */
export interface StatusFx {
  /** Ações que o lutador ainda vai perder aprisionado no genjutsu. */
  debilitated: number;
  /** Ações que o lutador ainda vai perder paralisado (crítico de raio). */
  paralyzed: number;
  /** Ações que o lutador precisa fazer antes de poder perder a vez de novo. */
  debilitateImmunity: number;
  /** Próximas ações com a chance de acerto reduzida (crítico de vento, terra ou água). */
  stunned: number;
  /** Rodadas de queimadura restantes. */
  burn: number;
  /** Tiques da queimadura atual (o próximo causa 2^(tiques+1) %). Zera ao apagar. */
  burnTicks: number;
  /** Já queimou nesta luta: um acerto de fogo comum reacende. */
  burnUnlocked: boolean;
  poison: PoisonState | null;
  /** Sangramento: dura a luta toda. */
  bleeding: boolean;
  /** Rodadas restantes do manto (jinchuuriki, marca da maldição). */
  cloakTurns: number;
  cloakUsed: boolean;
  /** O próximo ataque é crítico garantido (foco do guru; Mizuki no hardcore). */
  guaranteedCrit: boolean;
}

export interface PlayerFx extends StatusFx {
  gatesUsed: boolean;
  /** Portão aberto (1, 2, 3...). */
  gatesStage: number;
  gatesTurns: number;
  /** Rodada em que os portões abriram (a contagem começa na seguinte). */
  gatesRound: number;
  /** Sharingan/Byakugan ativado. */
  dojutsuActive: boolean;
  dojutsuTurns: number;
  dojutsuRound: number;
  /** Foco do guru já usado nesta luta. */
  focusUsed: boolean;
}

export interface VillainState {
  def: VillainDef;
  hp: number;
  chakra: number;
  fx: StatusFx;
  /** Rodadas restantes da névoa oculta (Zabuza). */
  mistTurns: number;
  /** Enganador (Mizuki) já usado. */
  tricksterUsed: boolean;
  /** Acovardado: perde a próxima vez. */
  cowering: boolean;
  /** Último suspiro do Zabuza (hardcore) ativo: mais forte e fazendo sangrar. */
  lastStand: boolean;
  /** Rodadas para derrotar o Orochimaru antes que ele reviva. 0 = sem contagem. */
  insaneTimer: number;
}

export interface BattleOptions {
  /** false no exame chunin: a Vontade do Fogo não é consumida e perder só encerra a luta. */
  allowRevive: boolean;
  /** Vantagem de ação (ramen): o jogador age primeiro na 1ª rodada. */
  playerStartsFirst: boolean;
  /** Desvantagem de ação (velhinha, derrota no jokenpô, guru charlatão): o vilão age primeiro na 1ª rodada. */
  villainStartsFirst: boolean;
  /** Buff temporário do vilão (evento pré-luta). */
  villainDamageMult: number;
}

export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'ambush' }
  | { type: 'late' }
  | { type: 'focus' }
  | { type: 'guaranteedCrit'; side: Side }
  | { type: 'initiative'; first: Side; playerChance: number }
  | { type: 'skip'; side: Side; reason: SkipReason }
  | { type: 'rest'; chakra: number }
  | { type: 'villainRest'; chakra: number }
  | { type: 'medical'; healed: number }
  | { type: 'gates'; stage: number; hpLost: number; chakra: number }
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
  | { type: 'dojutsuEnd'; dojutsu: DojutsuId; reason: 'time' | 'chakra' }
  | { type: 'chakraDrain'; amount: number }
  | { type: 'debilitate'; target: Side; turns: number; kind: 'prison' | 'paralysis' }
  | { type: 'debilitateResisted'; target: Side }
  | { type: 'genjutsuImmune'; target: Side }
  | { type: 'status'; target: Side; kind: StatusKind; turns: number }
  | { type: 'burnExtend'; target: Side; turns: number }
  | { type: 'burnTick'; target: Side; damage: number }
  | { type: 'burnOut'; target: Side }
  | { type: 'poisonTick'; target: Side; damage: number }
  | { type: 'poisonCured'; target: Side }
  | { type: 'cloak'; side: Side }
  | { type: 'cloakRegen'; side: Side; hp: number }
  | { type: 'recoil'; side: Side; damage: number }
  | { type: 'regen'; hp: number; chakra: number }
  | { type: 'summonRegen'; hp: number }
  | { type: 'villainRegen'; hp: number }
  | { type: 'mist'; turns: number }
  | { type: 'mistEnd' }
  | { type: 'trickster'; counterCrit: boolean }
  | { type: 'lastStand'; healed: number }
  | { type: 'insaneTimer'; rounds: number }
  | { type: 'insaneRevive'; hp: number }
  | { type: 'revive'; revivesLeft: number }
  | { type: 'end'; status: 'won' | 'lost' };

export interface BattleState {
  round: number;
  status: BattleStatus;
  player: PlayerState;
  playerFx: PlayerFx;
  villain: VillainState;
  options: BattleOptions;
  /** Quem age primeiro: rolado uma vez no início da luta, vale a luta toda (exceto a 1ª rodada com vantagem/desvantagem de ação). */
  initiative: Side | null;
  /** Log acumulado da luta, em ordem. A UI anima a partir dele. */
  log: BattleEvent[];
}

const DEFAULT_OPTIONS: BattleOptions = {
  allowRevive: true,
  playerStartsFirst: false,
  villainStartsFirst: false,
  villainDamageMult: 1,
};

function newFx(): StatusFx {
  return {
    debilitated: 0,
    paralyzed: 0,
    debilitateImmunity: 0,
    stunned: 0,
    burn: 0,
    burnTicks: 0,
    burnUnlocked: false,
    poison: null,
    bleeding: false,
    cloakTurns: 0,
    cloakUsed: false,
    guaranteedCrit: false,
  };
}

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
      ...newFx(),
      gatesUsed: false,
      gatesStage: 0,
      gatesTurns: 0,
      gatesRound: 0,
      dojutsuActive: false,
      dojutsuTurns: 0,
      dojutsuRound: 0,
      focusUsed: false,
    },
    villain: {
      def: villain,
      hp: villain.hp,
      chakra: villain.chakra,
      fx: newFx(),
      mistTurns: 0,
      tricksterUsed: false,
      cowering: false,
      lastStand: false,
      insaneTimer: 0,
    },
    options: opts,
    initiative: null,
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

/** Cobra: bônus inicial do envenenamento aplicado. null = não tem cobra. */
export function snakePoisonBonus(player: PlayerState, data: GameData): number | null {
  const extra = summonBonus(player, 'snake');
  if (extra === null) return null;
  const cfg = data.balance.summon.snake;
  return cfg.poisonBonus + cfg.poisonBonusPerLevel * extra;
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
// Dōjutsu e portões

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

/** Portão que o jogador abriria agora (o maior liberado pelo taijutsu). null = não tem portões. */
export function gatesToOpen(player: PlayerState, data: GameData) {
  const stage = gatesStage(player, data);
  return stage > 0 ? { stage, ...data.balance.gates.stages[stage - 1]! } : null;
}

/** HP que abrir os portões custaria (nunca abaixo de 1). */
export function gatesHpCost(player: PlayerState, hpCostPct: number): number {
  return Math.max(0, Math.min(Math.floor(player.maxHp * hpCostPct), player.hp - 1));
}

// ---------------------------------------------------------------------------
// Atributos efetivos na luta

/** Manto do jinchuuriki ativo no jogador (multiplica tai/nin/gen e speed). */
function playerCloak(s: BattleState, data: GameData): CloakDef | null {
  return s.player.jinchuuriki && s.playerFx.cloakTurns > 0 ? data.balance.jinchuuriki.cloak : null;
}

/** Atributo ofensivo efetivo na luta (Sharingan, manto). Tipos proibidos continuam zerados. */
export function effectiveOffense(s: BattleState, type: AttackType, data: GameData): number {
  const base = s.player.offense[type];
  if (s.player.forbiddenAttackTypes.includes(type)) return base;
  const value = base + (activeSharingan(s, data)?.statBonus ?? 0);
  return Math.floor(value * (playerCloak(s, data)?.statMult ?? 1));
}

export function effectiveSpeed(s: BattleState, data: GameData): number {
  const value = s.player.speed + (activeSharingan(s, data)?.speed ?? 0);
  return Math.floor(value * (playerCloak(s, data)?.statMult ?? 1));
}

/** Genjutsu do jogador contra ilusões do vilão: genjutsu efetivo + resistência passiva (Uchiha). */
export function playerGenjutsuDefense(s: BattleState, data: GameData): number {
  const p = s.player;
  const passive = p.passive?.kind === 'genjutsuResistance' ? p.passive.bonus : 0;
  return effectiveOffense(s, 'genjutsu', data) + passive;
}

/** Manto do vilão (jinchuuriki ou marca da maldição) e se está ativo agora. */
function villainCloak(s: BattleState) {
  const passive = s.villain.def.passive;
  return passive?.kind === 'cloak' ? passive : null;
}

/** Defesa efetiva do vilão no tipo: defesa absoluta (hardcore) e manto ativo. */
export function villainDefense(s: BattleState, type: AttackType): number {
  const cloak = villainCloak(s);
  if (!cloak) return s.villain.def.defense[type];
  const active = s.villain.fx.cloakTurns > 0 ? cloak.cloak.statMult : 1;
  return Math.floor(s.villain.def.defense[type] * (cloak.defenseMult ?? 1) * active);
}

/** Multiplicador de dano do vilão: evento, manto ativo, espelhos e último suspiro. */
function villainDamageMult(s: BattleState): number {
  const v = s.villain;
  const passive = v.def.passive;
  let mult = s.options.villainDamageMult;
  if (passive?.kind === 'cloak' && v.fx.cloakTurns > 0) mult *= passive.cloak.statMult;
  if (passive?.kind === 'mirrors') mult *= passive.damageMult;
  if (passive?.kind === 'mist' && passive.lastStand && v.lastStand) mult *= passive.lastStand.damageMult;
  return mult;
}

/** O alvo é imune a genjutsu (demônio interno do jinchuuriki). */
export function genjutsuImmune(s: BattleState, target: Side, data: GameData): boolean {
  if (target === 'player') return s.player.jinchuuriki && data.balance.jinchuuriki.genjutsuImmune;
  return villainCloak(s)?.genjutsuImmune ?? false;
}

function stunPenalty(fx: StatusFx, data: GameData): number {
  return fx.stunned > 0 ? data.balance.status.stun.hitPenalty : 0;
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

/** Chance de o genjutsu do jogador pegar (0 contra alvo imune). */
export function playerGenjutsuHitChance(s: BattleState, data: GameData): number {
  if (genjutsuImmune(s, 'villain', data)) return 0;
  const cfg = data.balance.genjutsuHit;
  const bonus = activeSharingan(s, data)?.genjutsuHit ?? 0;
  const base = genjutsuHitChance(effectiveOffense(s, 'genjutsu', data), s.villain.def.defense.genjutsu, cfg);
  return clamp(base + bonus - stunPenalty(s.playerFx, data), 0, 1);
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

/**
 * Chance de acerto de um ataque do jogador: speed contra speed, menos o atordoamento; na névoa,
 * a chance de erro cresce. O Byakugan faz o taijutsu não errar.
 */
function playerHitChance(s: BattleState, type: AttackType, data: GameData): number {
  if (type === 'taijutsu' && byakuganActive(s)) return 1;
  let hit = hitChance(effectiveSpeed(s, data), s.villain.def.speed, data.balance.hit) - stunPenalty(s.playerFx, data);
  const passive = s.villain.def.passive;
  if (passive?.kind === 'mist' && s.villain.mistTurns > 0) hit = 1 - (1 - hit) * passive.evasionMult;
  return clamp(hit, 0, 1);
}

export function attackPreview(s: BattleState, techniqueId: string, data: GameData): AttackPreview {
  const { balance } = data;
  const p = s.player;
  const v = s.villain.def;
  const tech = playerTechnique(p, techniqueId, data);
  const type = tech.type;
  const elementMult = elementMultiplier(tech.element, v.element, data.beats, balance.elements);
  const damage = playerDamage({
    baseDamage: tech.baseDamage,
    offense: effectiveOffense(s, type, data),
    defense: villainDefense(s, type),
    defensePierce: type === 'taijutsu' && p.passive?.kind === 'preciseFist' ? p.passive.defensePierce : 0,
    elementMult,
    critMult: 1,
    extraMult: playerDamageMult(s, type, data),
  });
  return { hitChance: playerHitChance(s, type, data), critChance: critChance(p.critBonus, balance.crit), elementMult, damage };
}

/** Multiplicadores de dano do jogador: portões e Byakugan (taijutsu). */
function playerDamageMult(s: BattleState, type: AttackType, data: GameData): number {
  const fx = s.playerFx;
  let mult = 1;
  if (type === 'taijutsu') {
    if (fx.gatesTurns > 0 && fx.gatesStage > 0) mult *= data.balance.gates.stages[fx.gatesStage - 1]!.taijutsuMult;
    if (byakuganActive(s)) mult *= data.balance.dojutsu.byakugan.taijutsuMult;
  }
  return mult;
}

/** Ninjutsu médico do jogador (null = não sabe). */
export function playerMedical(player: PlayerState, data: GameData): TechniqueDef | null {
  return knownTechniques(player, data).find((t) => techniqueSlot(t) === 'medical') ?? null;
}

/** A técnica pode ser usada agora (dōjutsu exigido ativo e chakra suficiente). */
export function canUseTechnique(s: BattleState, tech: TechniqueDef): boolean {
  const p = s.player;
  if (p.forbiddenAttackTypes.includes(tech.type)) return false;
  if (tech.requiresDojutsu && !(s.playerFx.dojutsuActive && p.dojutsu === tech.requiresDojutsu)) return false;
  return p.chakra >= tech.chakraCost;
}

/** O foco do guru (crítico garantido no próximo ataque) pode ser ativado nesta rodada. */
export function canFocus(s: BattleState): boolean {
  return s.player.focusCrit && !s.playerFx.focusUsed;
}

export function availableActions(state: BattleState, data: GameData): PlayerAction[] {
  const p = state.player;
  const actions: PlayerAction[] = [];
  for (const tech of attackTechniques(p, data)) {
    if (canUseTechnique(state, tech)) actions.push(techAction(tech.id));
  }
  const gates = gatesToOpen(p, data);
  if (gates && !state.playerFx.gatesUsed && p.chakra >= gates.chakraCost) actions.push('gates');
  const dojutsuCost = dojutsuActivationCost(p, data);
  if (dojutsuCost !== null && !state.playerFx.dojutsuActive && p.chakra >= dojutsuCost) actions.push('dojutsu');
  const medical = playerMedical(p, data);
  if (medical && p.chakra >= medical.chakraCost && p.hp < p.maxHp) actions.push('medical');
  actions.push('rest');
  return actions;
}

/**
 * Joga uma rodada: ordem (iniciativa rolada só na 1ª), ação de cada lado, efeitos de fim de rodada.
 * `focus`: ativa o foco do guru antes da ação (o próximo ataque é crítico garantido).
 * Pura: devolve um novo estado e não altera `prev`.
 */
export function playRound(
  prev: BattleState,
  action: PlayerAction,
  rng: Rng,
  data: GameData,
  focus = false,
): BattleState {
  if (prev.status !== 'ongoing') throw new Error('A luta já terminou');
  if (!availableActions(prev, data).includes(action)) throw new Error(`Ação indisponível: ${action}`);
  if (focus && !canFocus(prev)) throw new Error('Foco indisponível');

  const s = structuredClone(prev);
  s.round++;
  s.log.push({ type: 'round', round: s.round });

  startOfRound(s, data);
  if (s.status !== 'ongoing') return s;

  if (s.initiative === null) {
    const speed = effectiveSpeed(s, data);
    const chance = initiativeChance(speed, s.villain.def.speed);
    s.initiative = rollInitiative(speed, s.villain.def.speed, rng) === 'a' ? 'player' : 'villain';
    s.log.push({ type: 'initiative', first: s.initiative, playerChance: chance });
  }
  let playerFirst = s.initiative === 'player';
  if (s.round === 1 && s.options.playerStartsFirst) {
    s.log.push({ type: 'ambush' });
    playerFirst = true;
  } else if (s.round === 1 && s.options.villainStartsFirst) {
    s.log.push({ type: 'late' });
    playerFirst = false;
  }

  if (focus) {
    s.playerFx.focusUsed = true;
    s.playerFx.guaranteedCrit = true;
    s.log.push({ type: 'focus' });
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

function fxOf(s: BattleState, side: Side): StatusFx {
  return side === 'player' ? s.playerFx : s.villain.fx;
}

function maxHpOf(s: BattleState, side: Side): number {
  return side === 'player' ? s.player.maxHp : s.villain.def.hp;
}

function chance(p: number, rng: Rng): boolean {
  return spin(chanceSlices(p, { label: 'yes', value: true }, { label: 'no', value: false }), rng).slice.value;
}

/**
 * Dano no vilão vindo de qualquer fonte. Golpe fatal passa pelas passivas que o evitam
 * (enganador, último suspiro); se nada evitar, o jogador vence. Devolve o dano causado.
 */
function hurtVillain(s: BattleState, amount: number): number {
  const v = s.villain;
  const dealt = Math.min(v.hp, amount);
  v.hp -= dealt;
  if (v.hp === 0) {
    villainDown(s);
    return dealt;
  }
  checkVillainThresholds(s);
  return dealt;
}

function villainDown(s: BattleState): void {
  const v = s.villain;
  const passive = v.def.passive;
  if (passive?.kind === 'trickster' && !v.tricksterUsed) {
    v.tricksterUsed = true;
    v.hp = 1;
    if (passive.counterCrit) v.fx.guaranteedCrit = true;
    else v.cowering = true;
    s.log.push({ type: 'trickster', counterCrit: Boolean(passive.counterCrit) });
    return;
  }
  if (passive?.kind === 'mist' && passive.lastStand && !v.lastStand) {
    v.lastStand = true;
    v.hp = Math.max(1, Math.floor(v.def.hp * passive.lastStand.healPct));
    s.log.push({ type: 'lastStand', healed: v.hp });
    return;
  }
  finish(s, 'won');
}

/** Manto do vilão abaixo do limiar e contagem do Orochimaru. */
function checkVillainThresholds(s: BattleState): void {
  const v = s.villain;
  const passive = v.def.passive;
  if (passive?.kind === 'cloak' && !v.fx.cloakUsed && v.hp < v.def.hp * passive.cloak.hpThresholdPct) {
    activateCloak(s, 'villain', passive.cloak);
  }
  if (passive?.kind === 'insane' && v.insaneTimer === 0 && v.hp < v.def.hp * passive.hpThresholdPct) {
    v.insaneTimer = passive.killWindow;
    s.log.push({ type: 'insaneTimer', rounds: passive.killWindow });
  }
}

function activateCloak(s: BattleState, side: Side, cloak: CloakDef): void {
  const fx = fxOf(s, side);
  fx.cloakUsed = true;
  fx.cloakTurns = cloak.turns;
  s.log.push({ type: 'cloak', side });
}

/** Dano no jogador vindo de qualquer fonte: HP 0 usa a Vontade do Fogo ou encerra a luta. */
function hurtPlayer(s: BattleState, amount: number, data: GameData): number {
  const p = s.player;
  const dealt = Math.min(p.hp, amount);
  p.hp -= dealt;
  if (p.hp === 0) handleKnockout(s);
  else checkPlayerCloak(s, data);
  return dealt;
}

/** Manto de chakra: uma vez por luta, ao cair abaixo do limiar de HP. */
function checkPlayerCloak(s: BattleState, data: GameData): void {
  const p = s.player;
  const cfg = data.balance.jinchuuriki.cloak;
  if (!p.jinchuuriki || s.playerFx.cloakUsed || p.hp <= 0 || p.hp >= p.maxHp * cfg.hpThresholdPct) return;
  activateCloak(s, 'player', cfg);
}

/** Recoil do manto: parte do dano causado volta no atacante, sem derrubá-lo. */
function applyRecoil(s: BattleState, side: Side, dealt: number, recoilPct: number): void {
  const hp = side === 'player' ? s.player.hp : s.villain.hp;
  const damage = Math.min(Math.floor(dealt * recoilPct), hp - 1);
  if (damage <= 0) return;
  if (side === 'player') s.player.hp -= damage;
  else s.villain.hp -= damage;
  s.log.push({ type: 'recoil', side, damage });
}

/** Perde a vez (acovardado, paralisado ou aprisionado). Devolve true se o lutador perdeu a vez. */
function consumeSkip(s: BattleState, side: Side, data: GameData): boolean {
  if (side === 'villain' && s.villain.cowering) {
    s.villain.cowering = false;
    s.log.push({ type: 'skip', side, reason: 'cower' });
    return true;
  }
  const fx = fxOf(s, side);
  let reason: SkipReason;
  if (fx.paralyzed > 0) {
    fx.paralyzed--;
    reason = 'paralysis';
  } else if (fx.debilitated > 0) {
    fx.debilitated--;
    reason = 'prison';
  } else {
    return false;
  }
  if (fx.paralyzed === 0 && fx.debilitated === 0) fx.debilitateImmunity = data.balance.debilitated.immunityActions;
  s.log.push({ type: 'skip', side, reason });
  return true;
}

/** Fim da vez do lutador: conta a imunidade anti-trava e o atordoamento. */
function endTurn(fx: StatusFx, acted: boolean): void {
  if (acted && fx.debilitateImmunity > 0) fx.debilitateImmunity--;
  if (fx.stunned > 0) fx.stunned--;
}

function applyDebilitate(s: BattleState, target: Side, turns: number, kind: 'prison' | 'paralysis'): void {
  const fx = fxOf(s, target);
  if (fx.debilitateImmunity > 0) {
    s.log.push({ type: 'debilitateResisted', target });
    return;
  }
  if (kind === 'prison') fx.debilitated = Math.max(fx.debilitated, turns);
  else fx.paralyzed = Math.max(fx.paralyzed, turns);
  s.log.push({ type: 'debilitate', target, turns, kind });
}

/**
 * Efeito de um acerto elemental no alvo. Crítico de raio paralisa; de vento, terra ou água atordoa;
 * de fogo queima. Queimando, todo acerto de fogo prolonga; depois de queimar uma vez, um acerto de
 * fogo comum reacende.
 */
function applyElementalHit(s: BattleState, target: Side, element: Element | null, outcome: HitOutcome, data: GameData): void {
  if (!element || outcome === 'miss') return;
  const fx = fxOf(s, target);
  const cfg = data.balance.status;
  if (element === 'fire') {
    if (fx.burn > 0) {
      fx.burn += cfg.burn.extendPerHit;
      s.log.push({ type: 'burnExtend', target, turns: fx.burn });
    } else if (outcome === 'crit' || fx.burnUnlocked) {
      fx.burn = outcome === 'crit' ? cfg.burn.turns : cfg.burn.reigniteTurns;
      fx.burnTicks = 0;
      fx.burnUnlocked = true;
      s.log.push({ type: 'status', target, kind: 'burn', turns: fx.burn });
    }
    return;
  }
  if (outcome !== 'crit') return;
  if (element === 'lightning') {
    applyDebilitate(s, target, cfg.paralysis.turns, 'paralysis');
  } else {
    fx.stunned = Math.max(fx.stunned, cfg.stun.turns);
    s.log.push({ type: 'status', target, kind: 'stun', turns: fx.stunned });
  }
}

function applyPoison(s: BattleState, target: Side, bonus: number): void {
  const fx = fxOf(s, target);
  if (fx.poison) return;
  fx.poison = { bonus, ticks: 0 };
  s.log.push({ type: 'status', target, kind: 'poison', turns: 0 });
}

function applyBleed(s: BattleState, target: Side): void {
  const fx = fxOf(s, target);
  if (fx.bleeding) return;
  fx.bleeding = true;
  s.log.push({ type: 'status', target, kind: 'bleed', turns: 0 });
}

function heal(s: BattleState, side: Side, pct: number): number {
  const max = maxHpOf(s, side);
  const hp = side === 'player' ? s.player.hp : s.villain.hp;
  const amount = Math.min(max - hp, Math.floor(max * pct));
  if (amount <= 0) return 0;
  if (side === 'player') s.player.hp += amount;
  else s.villain.hp += amount;
  return amount;
}

function startOfRound(s: BattleState, data: GameData): void {
  const p = s.player;
  const v = s.villain;
  const vPassive = v.def.passive;

  if (s.round === 1) {
    if (vPassive?.kind === 'mist') {
      v.mistTurns = vPassive.turns;
      s.log.push({ type: 'mist', turns: vPassive.turns });
    }
    if (vPassive?.kind === 'cloak' && vPassive.fromStart) activateCloak(s, 'villain', vPassive.cloak);
  }

  if (p.passive?.kind === 'vitality') {
    const hp = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * p.passive.hpPctPerTurn));
    const chakra = Math.min(p.maxChakra - p.chakra, p.passive.chakraPerTurn);
    if (hp > 0 || chakra > 0) {
      p.hp += hp;
      p.chakra += chakra;
      s.log.push({ type: 'regen', hp, chakra });
    }
  }
  // Quem já começa a rodada abaixo do limiar (lutas não restauram HP) também desperta o manto.
  checkPlayerCloak(s, data);
  const slugPct = slugHealPct(p, data);
  if (slugPct > 0) {
    const hp = heal(s, 'player', slugPct);
    if (hp > 0) s.log.push({ type: 'summonRegen', hp });
  }
  const cloak = playerCloak(s, data);
  if (cloak) {
    const hp = heal(s, 'player', cloak.regenPct);
    if (hp > 0) s.log.push({ type: 'cloakRegen', side: 'player', hp });
  }

  if (vPassive?.kind === 'scalpel') {
    const hp = heal(s, 'villain', vPassive.regenPct);
    if (hp > 0) s.log.push({ type: 'villainRegen', hp });
  }
  if (vPassive?.kind === 'cloak' && v.fx.cloakTurns > 0) {
    const hp = heal(s, 'villain', vPassive.cloak.regenPct);
    if (hp > 0) s.log.push({ type: 'cloakRegen', side: 'villain', hp });
  }
}

/** Queimadura e veneno no fim da rodada. Devolve false se a luta acabou. */
function tickStatus(s: BattleState, side: Side, rng: Rng, data: GameData): boolean {
  const fx = fxOf(s, side);
  const cfg = data.balance.status;
  const max = maxHpOf(s, side);
  const hurt = (n: number) => (side === 'player' ? hurtPlayer(s, n, data) : hurtVillain(s, n));

  if (fx.burn > 0) {
    fx.burnTicks++;
    const pct = Math.min(2 ** fx.burnTicks / 100, cfg.burn.maxPct);
    const damage = hurt(Math.max(1, Math.floor(max * pct)));
    s.log.push({ type: 'burnTick', target: side, damage });
    if (s.status !== 'ongoing') return false;
    fx.burn--;
    if (fx.burn === 0) {
      fx.burnTicks = 0;
      s.log.push({ type: 'burnOut', target: side });
    }
  }
  if (fx.poison) {
    const raw = Math.floor(max * cfg.poison.basePct) + fx.poison.bonus + fx.poison.ticks * cfg.poison.growthPerTick;
    const damage = hurt(Math.max(1, Math.min(raw, Math.floor(max * cfg.poison.maxPct))));
    s.log.push({ type: 'poisonTick', target: side, damage });
    if (s.status !== 'ongoing') return false;
    // A Vontade do Fogo limpa o veneno: só testa a resistência se ele ainda estiver lá.
    if (fx.poison) {
      fx.poison.ticks++;
      if (chance(cfg.poison.cureChance, rng)) {
        fx.poison = null;
        s.log.push({ type: 'poisonCured', target: side });
      }
    }
  }
  return true;
}

function endOfRound(s: BattleState, rng: Rng, data: GameData): void {
  const v = s.villain;
  const p = s.player;
  const fx = s.playerFx;

  if (!tickStatus(s, 'villain', rng, data)) return;
  if (!tickStatus(s, 'player', rng, data)) return;

  if (v.mistTurns > 0) {
    v.mistTurns--;
    if (v.mistTurns === 0) s.log.push({ type: 'mistEnd' });
  }
  if (v.fx.cloakTurns > 0) v.fx.cloakTurns--;
  if (fx.cloakTurns > 0) fx.cloakTurns--;

  // Orochimaru: não derrotado a tempo, revive.
  const passive = v.def.passive;
  if (passive?.kind === 'insane' && v.insaneTimer > 0) {
    v.insaneTimer--;
    if (v.insaneTimer === 0) {
      const revived = passive.reviveFull
        ? v.def.hp
        : Math.max(Math.floor(v.def.hp * passive.reviveMinPct), v.hp * passive.reviveCurrentMult);
      v.hp = Math.min(v.def.hp, revived);
      s.log.push({ type: 'insaneRevive', hp: v.hp });
    }
  }

  // Portões e dōjutsu contam a partir da rodada seguinte à ativação.
  if (fx.gatesTurns > 0 && fx.gatesRound !== s.round) fx.gatesTurns--;
  if (fx.dojutsuActive && p.dojutsu) {
    if (fx.dojutsuRound !== s.round) fx.dojutsuTurns--;
    const upkeep = data.balance.dojutsu[p.dojutsu].upkeep;
    if (fx.dojutsuTurns <= 0) {
      fx.dojutsuActive = false;
      s.log.push({ type: 'dojutsuEnd', dojutsu: p.dojutsu, reason: 'time' });
    } else if (p.chakra >= upkeep) {
      p.chakra -= upkeep;
    } else {
      fx.dojutsuActive = false;
      s.log.push({ type: 'dojutsuEnd', dojutsu: p.dojutsu, reason: 'chakra' });
    }
  }
}

function playerTurn(s: BattleState, action: PlayerAction, rng: Rng, data: GameData): void {
  if (consumeSkip(s, 'player', data)) {
    endTurn(s.playerFx, false);
    return;
  }
  const p = s.player;
  const fx = s.playerFx;

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
    fx.dojutsuActive = true;
    fx.dojutsuTurns = data.balance.dojutsu.duration;
    fx.dojutsuRound = s.round;
    s.log.push({ type: 'dojutsu', dojutsu: p.dojutsu, stage: sharinganStage(p, data) });
  } else if (action === 'gates') {
    // Abrir os portões gasta o turno (não é golpe); o bônus vale a partir da próxima rodada.
    const gates = gatesToOpen(p, data);
    if (!gates) throw new Error('Portões exigem a passiva correspondente');
    const hpLost = gatesHpCost(p, gates.hpCostPct);
    p.chakra -= gates.chakraCost;
    p.hp -= hpLost;
    fx.gatesUsed = true;
    fx.gatesStage = gates.stage;
    fx.gatesTurns = data.balance.gates.turns;
    fx.gatesRound = s.round;
    s.log.push({ type: 'gates', stage: gates.stage, hpLost, chakra: gates.chakraCost });
    checkPlayerCloak(s, data);
  } else if (action === 'medical') {
    // Ninjutsu médico: cura sem rolar acerto.
    const tech = playerMedical(p, data);
    if (!tech) throw new Error('O jogador não sabe ninjutsu médico');
    p.chakra -= tech.chakraCost;
    s.log.push({ type: 'medical', healed: heal(s, 'player', medicalHealPct(p, data)) });
  }
  endTurn(fx, true);
}

/** Genjutsu: não causa dano nem consome o crítico garantido; se acertar, aprisiona o vilão. */
function playerGenjutsu(s: BattleState, techId: string, rng: Rng, data: GameData): void {
  const p = s.player;
  const tech = playerTechnique(p, techId, data);
  p.chakra -= tech.chakraCost;
  if (genjutsuImmune(s, 'villain', data)) {
    s.log.push({ type: 'genjutsuImmune', target: 'villain' });
    return;
  }
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
  if (outcome !== 'miss') applyDebilitate(s, 'villain', playerGenjutsuTurns(s, techId, data), 'prison');
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
    s.log.push({ type: 'guaranteedCrit', side: 'player' });
    outcome = 'crit';
  } else {
    outcome = rollHit(preview.hitChance, preview.critChance, rng);
  }

  let damage = 0;
  if (outcome !== 'miss') {
    damage = playerDamage({
      baseDamage: tech.baseDamage,
      offense: effectiveOffense(s, type, data),
      defense: villainDefense(s, type),
      defensePierce: type === 'taijutsu' && p.passive?.kind === 'preciseFist' ? p.passive.defensePierce : 0,
      elementMult: preview.elementMult,
      critMult: outcome === 'crit' ? balance.crit.multiplier : 1,
      extraMult: playerDamageMult(s, type, data),
    });
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
  if (outcome === 'miss') return;

  const dealt = hurtVillain(s, damage);
  if (s.status !== 'ongoing') return;
  const cloak = playerCloak(s, data);
  if (cloak) applyRecoil(s, 'player', dealt, cloak.recoilPct);
  // Golpe inibidor: drena o chakra do vilão.
  if (tech.chakraDrain) {
    const amount = Math.min(v.chakra, tech.chakraDrain);
    v.chakra -= amount;
    s.log.push({ type: 'chakraDrain', amount });
  }
  // Cobra: um golpe que acerta envenena o alvo, se ele ainda não estiver envenenado.
  const bonus = snakePoisonBonus(p, data);
  if (bonus !== null) applyPoison(s, 'villain', bonus);
  applyElementalHit(s, 'villain', tech.element, outcome, data);
}

function villainTurn(s: BattleState, rng: Rng, data: GameData): void {
  const v = s.villain;
  if (consumeSkip(s, 'villain', data)) {
    endTurn(v.fx, false);
    return;
  }
  // Espelhos (Haku): mais de uma ação por turno.
  const passive = v.def.passive;
  const actions = passive?.kind === 'mirrors' ? passive.actions : 1;
  for (let i = 0; i < actions && s.status === 'ongoing'; i++) villainAction(s, rng, data);
  endTurn(v.fx, true);
}

function villainAction(s: BattleState, rng: Rng, data: GameData): void {
  const v = s.villain;
  const { balance } = data;
  const p = s.player;
  const passive = v.def.passive;

  // O vilão só escolhe entre as técnicas que pode pagar; sem nenhuma, concentra chakra.
  const affordable = v.def.techniques.filter((t) => t.chakraCost <= v.chakra);
  if (affordable.length === 0) {
    const gained = Math.min(v.def.chakra - v.chakra, balance.villainRest.chakraRecovered);
    v.chakra += gained;
    s.log.push({ type: 'villainRest', chakra: gained });
    return;
  }
  const tech = spin(
    affordable.map((t) => ({ label: t.id, weight: t.weight, value: t })),
    rng,
  ).slice.value;
  v.chakra -= tech.chakraCost;

  if (tech.type === 'genjutsu') {
    // Genjutsu do vilão: sem dano; o poder dele é o atributo de genjutsu, contra o genjutsu do jogador
    // (com a resistência passiva do Uchiha). Jinchuuriki é imune.
    if (genjutsuImmune(s, 'player', data)) {
      s.log.push({ type: 'genjutsuImmune', target: 'player' });
      return;
    }
    const defense = playerGenjutsuDefense(s, data);
    const hitP = clamp(genjutsuHitChance(v.def.defense.genjutsu, defense, balance.genjutsuHit) - stunPenalty(v.fx, data), 0, 1);
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
    if (outcome !== 'miss') {
      const turns = genjutsuTurns(v.def.defense.genjutsu, defense, tech.debilitateTurns ?? 1, data);
      applyDebilitate(s, 'player', turns, 'prison');
    }
    return;
  }

  const hitP = clamp(hitChance(v.def.speed, effectiveSpeed(s, data), balance.hit) - stunPenalty(v.fx, data), 0, 1);
  const critP = critChance(v.def.critBonus, balance.crit);
  let outcome: HitOutcome;
  if (v.fx.guaranteedCrit) {
    v.fx.guaranteedCrit = false;
    s.log.push({ type: 'guaranteedCrit', side: 'villain' });
    outcome = 'crit';
  } else {
    outcome = rollHit(hitP, critP, rng);
  }
  const element = tech.type === 'taijutsu' ? null : tech.element === undefined ? v.def.element : tech.element;
  const elementMult = elementMultiplier(element, p.affinity, data.beats, balance.elements);
  const bleedMult = tech.blade && s.playerFx.bleeding ? balance.status.bleed.bladeDamageMult : 1;

  let damage = 0;
  if (outcome !== 'miss') {
    damage = villainDamage({
      baseDamage: tech.baseDamage,
      playerOffense: effectiveOffense(s, tech.type, data),
      resistanceBonus: p.resistanceBonus,
      offenseDivisor: balance.resistance.offenseDivisor,
      resistancePierce: passive?.kind === 'scalpel' ? (passive.resistancePierce ?? 0) : 0,
      elementMult,
      critMult: outcome === 'crit' ? balance.crit.multiplier : 1,
      extraMult: villainDamageMult(s) * bleedMult,
    });
    // Sharingan ativo: chance de ler o movimento e reduzir o dano.
    const sharingan = activeSharingan(s, data);
    if (sharingan && chance(sharingan.readChance, rng)) {
      const reduced = Math.max(1, Math.floor(damage * balance.dojutsu.sharingan.readDamageFactor));
      s.log.push({ type: 'movementReading', damageBefore: damage, damage: reduced });
      damage = reduced;
    }
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
  if (outcome === 'miss') return;

  const dealt = hurtPlayer(s, damage, data);
  if (s.status !== 'ongoing') return;
  if (passive?.kind === 'cloak' && v.fx.cloakTurns > 0) applyRecoil(s, 'villain', dealt, passive.cloak.recoilPct);
  // Cobra do Orochimaru: acertos envenenam.
  if (passive?.kind === 'insane') applyPoison(s, 'player', passive.snakeBonus);
  // Sangramento: crítico de espada, ou todo acerto (Kabuto no hardcore, último suspiro do Zabuza).
  const bleedOnHit =
    (passive?.kind === 'scalpel' && passive.bleedOnHit) || (passive?.kind === 'mist' && v.lastStand);
  if (bleedOnHit || (tech.blade === 'sword' && outcome === 'crit')) applyBleed(s, 'player');
  applyElementalHit(s, 'player', element, outcome, data);
}

/** HP 0: usa a Vontade do Fogo (restauração total, limpa os efeitos negativos) ou encerra a luta. */
function handleKnockout(s: BattleState): void {
  const p = s.player;
  if (s.options.allowRevive && p.revives > 0) {
    p.revives--;
    p.revivesUsed++;
    p.hp = p.maxHp;
    p.chakra = p.maxChakra;
    const fx = s.playerFx;
    fx.poison = null;
    fx.burn = 0;
    fx.burnTicks = 0;
    fx.bleeding = false;
    fx.stunned = 0;
    s.log.push({ type: 'revive', revivesLeft: p.revives });
    return;
  }
  finish(s, 'lost');
}
