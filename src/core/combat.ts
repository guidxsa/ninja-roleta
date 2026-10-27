import { damage as computeDamage } from './damage';
import { elementMultiplier } from './elements';
import type { GameData } from './gameData';
import { critChance, genjutsuHitChance, hitChance, rollHit, type HitOutcome } from './hit';
import { initiativeChance, rollInitiative } from './initiative';
import {
  fullRestore,
  gatesStage,
  knownTechniques,
  leveledTechnique,
  medicalHealPct,
  techniqueSlot,
  type PlayerState,
} from './player';
import type { Rng } from './rng';
import { clamp } from './rng';
import { chanceSlices, spin } from './roulette';
import type {
  AttackType,
  BladeKind,
  CloakDef,
  ConsumableId,
  DojutsuId,
  Element,
  HitEffect,
  MentalEffect,
  ResistanceKind,
  SummonAnimal,
  TechniqueDef,
  VillainDef,
  VillainTechnique,
} from './types';

/** Usar uma técnica do skill set: `tech:<id>`. */
export type TechniqueAction = `tech:${string}`;
/** Usar um consumível da bolsa: `item:<id>`. */
export type ItemAction = `item:${ConsumableId}`;
/**
 * Ação do turno. `stance` = postura defensiva. `pass` = a ação já foi gasta numa reação
 * (única opção enquanto o jogador deve a ação).
 */
export type PlayerAction =
  | TechniqueAction
  | ItemAction
  | 'gates'
  | 'expansion'
  | 'medical'
  | 'dojutsu'
  | 'rest'
  | 'stance'
  | 'pass';

export const techAction = (id: string): TechniqueAction => `tech:${id}`;
export const itemAction = (id: ConsumableId): ItemAction => `item:${id}`;

/** Id da técnica de uma ação `tech:<id>` (null para as outras). */
export function actionTechniqueId(action: PlayerAction): string | null {
  return action.startsWith('tech:') ? action.slice(5) : null;
}

export function actionItemId(action: PlayerAction): ConsumableId | null {
  return action.startsWith('item:') ? (action.slice(5) as ConsumableId) : null;
}

/**
 * Reação a um ataque recebido (fundamentos.md#reações): Resistir (grátis), Substituição, Disputa com um
 * ninjutsu de ataque (`clash:<id>`) ou Barreira (`barrier:<id>`). As três últimas gastam a próxima ação.
 */
export type ReactionChoice = 'resist' | 'substitution' | `clash:${string}` | `barrier:${string}`;

export const clashReaction = (id: string): ReactionChoice => `clash:${id}`;
export const barrierReaction = (id: string): ReactionChoice => `barrier:${id}`;

/** Id da técnica de uma reação de disputa ou barreira (null para as outras). */
export function reactionTechniqueId(choice: ReactionChoice): string | null {
  const i = choice.indexOf(':');
  return i >= 0 ? choice.slice(i + 1) : null;
}

/** Ataque que está chegando, como quem reage o vê. */
export interface IncomingAttack {
  attacker: Side;
  techniqueId: string;
  type: AttackType;
  element: Element | null;
  hits: number;
  /** Golpe carregado (×2 no dano e no poder da disputa). */
  charged: boolean;
}

/** Reação do jogador pendente: a rodada parou esperando a escolha (`resumeRound`). */
export interface PendingReaction {
  incoming: IncomingAttack;
  options: ReactionChoice[];
  /** Chakra que o vilão gastou no ataque (para o log). */
  chakra: number;
}

/** Escolha automática da reação do jogador (simulação, testes). */
export type ReactionPolicy = (s: BattleState, incoming: IncomingAttack, options: ReactionChoice[], data: GameData) => ReactionChoice;

/** Escolhas grátis da rodada, feitas junto com a ação (não gastam o turno). */
export interface RoundExtras {
  /** Foco do guru: o próximo ataque é crítico garantido. */
  focus?: boolean;
  /** Clones das Sombras (Uzumaki): o próximo ataque vira 3× os golpes, com 40% do dano cada. */
  clones?: boolean;
  /** Sharingan ativo: o genjutsu aplica Pavor em vez do efeito da técnica. */
  fear?: boolean;
}

export type Side = 'player' | 'villain';
export type BattleStatus = 'ongoing' | 'won' | 'lost';

/** Por que o lutador perdeu a vez. `reacted` = a ação foi gasta numa reação. */
export type SkipReason = 'prison' | 'sleep' | 'paralysis' | 'cower' | 'reacted';
/** Efeitos que aparecem como "status" na luta. */
export type StatusKind = 'stun' | 'burn' | 'poison' | 'bleed';
/** Efeitos que tiram a vez (anti-trava). */
export type DebilitateKind = 'prison' | 'sleep' | 'paralysis';

/** Como quem recebe o golpe usa a resistência: passiva (40%) ou Resistir (70%, 100% em postura). */
export type Guard = 'passive' | 'resist';

/** Envenenamento em curso: bônus da fonte e quantos tiques já causou. */
export interface PoisonState {
  bonus: number;
  ticks: number;
}

/** Estado de luta comum ao jogador e ao vilão. */
export interface StatusFx {
  /** Ações que o lutador ainda vai perder aprisionado. */
  debilitated: number;
  /** Ações que o lutador ainda vai perder dormindo (acorda ao tomar dano). */
  asleep: number;
  /** Ações que o lutador ainda vai perder paralisado (crítico de raio). */
  paralyzed: number;
  /** Ações que o lutador precisa fazer antes de poder perder a vez de novo. */
  debilitateImmunity: number;
  /** Próximas ações com a chance de acerto reduzida. */
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
  /** Pavor: próximas ações com menos dano. */
  feared: number;
  /** Confusão: próximas ações com chance de falhar (e de acertar a si mesmo). */
  confused: number;
  /** Tormento: rodadas perdendo chakra no início. */
  tormented: number;
  /** Rodadas restantes do manto (jinchuuriki, marca da maldição). */
  cloakTurns: number;
  cloakUsed: boolean;
  /** O próximo ataque é crítico garantido (Mizuki no hardcore). */
  guaranteedCrit: boolean;
  /** Gastou a próxima ação numa reação: perde o próximo turno. */
  owesAction: boolean;
  /** Substituições usadas nesta luta. */
  substitutionsUsed: number;
}

/** Esquiva preparada (Bomba de fumaça): vale para o próximo ataque recebido. */
export interface Dodge {
  chance: number;
  /** Expira no fim desta rodada. */
  untilRound: number;
  source: 'smokeBomb';
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
  /** Expansão (Akimichi). */
  expansionTurns: number;
  expansionRound: number;
  /** Clones das Sombras armados para o próximo ataque. */
  clonesArmed: boolean;
  /** Armadura de Raio (estado elemental), contada a partir da rodada seguinte à ativação. */
  armorTurns: number;
  armorRound: number;
  /** Postura defensiva: Resistir usa 100% até o próximo turno do jogador. */
  stance: boolean;
  dodge: Dodge | null;
  /** Usos do foco do guru nesta luta. */
  focusUsed: number;
  /** Foco ativo: o próximo ataque soma `balance.guru.focusCritBonus` à chance de crítico. */
  focusArmed: boolean;
}

/** Próxima ação do vilão, sorteada no fim da rodada anterior (Estrategista mostra). */
export type VillainIntent = { kind: 'technique'; id: string } | { kind: 'rest' };

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
  /** Vezes que o Orochimaru já reviveu nesta luta. */
  insaneRevives: number;
  /** Forma de monstro (Gaara no hardcore): técnicas trocadas e manto permanente. */
  monster: boolean;
  intent: VillainIntent | null;
  /** Golpe carregado anunciado: sai na próxima vez dele. */
  charging: string | null;
}

export interface BattleOptions {
  /** false no exame chunin: a Vontade do Fogo não é consumida e perder só encerra a luta. */
  allowRevive: boolean;
  /** Vantagem de ação (ramen): o jogador age primeiro, sem rolar iniciativa. */
  playerStartsFirst: boolean;
  /** Desvantagem de ação: o vilão age primeiro, sem rolar iniciativa. */
  villainStartsFirst: boolean;
  /** Buff temporário do vilão (evento pré-luta). */
  villainDamageMult: number;
  /** Restaura HP e chakra no início (padrão: `balance.combat.restoreOnStart`, desligado). */
  restore: boolean;
  /**
   * A interface escolhe a reação do jogador: a rodada para em `pending` quando há mais de uma
   * reação possível. Sem isso (simulação), vale a política passada ou Resistir.
   */
  interactive: boolean;
}

export type ReactionKind = 'passive' | 'resist' | 'substitution' | 'clash' | 'barrier';

export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'ambush' }
  | { type: 'late' }
  | { type: 'focus' }
  | { type: 'guaranteedCrit'; side: Side }
  | { type: 'initiative'; first: Side; playerChance: number }
  | { type: 'priority'; side: Side }
  | { type: 'skip'; side: Side; reason: SkipReason }
  | { type: 'rest'; chakra: number }
  | { type: 'villainRest'; chakra: number }
  | { type: 'stance' }
  | { type: 'medical'; healed: number; chakra: number }
  | { type: 'villainHeal'; techniqueId: string; healed: number }
  | { type: 'gates'; stage: number; hpLost: number; chakra: number }
  | { type: 'expansion'; chakra: number }
  | { type: 'expansionEnd' }
  | { type: 'clones'; chakra: number }
  | { type: 'armor'; techniqueId: string; chakra: number }
  | { type: 'armorEnd' }
  /** Quem ataca anuncia a técnica antes da reação do outro lado. */
  | { type: 'declare'; side: Side; techniqueId: string; attackType: AttackType; element: Element | null; chakra: number }
  | { type: 'reaction'; side: Side; kind: ReactionKind; techniqueId: string | null; chakra: number }
  | { type: 'substitutionRoll'; side: Side; chance: number; success: boolean }
  | {
      type: 'clash';
      attacker: Side;
      attackTechnique: string;
      defenseTechnique: string;
      attackPower: number;
      defensePower: number;
      /** Fatias da roleta: vitória do atacante, anulação, vitória do defensor (somam 1). */
      odds: [number, number, number];
      result: 'attacker' | 'cancel' | 'defender';
      crushed: boolean;
    }
  | { type: 'clashHit'; target: Side; techniqueId: string; damage: number; passPct: number }
  | { type: 'guardBreak'; attacker: Side; techniqueId: string; barrierId: string; breakChance: number; broken: boolean }
  | { type: 'barrierHold'; side: Side; techniqueId: string; reflected: number }
  | { type: 'extinguish'; side: Side }
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
      chakra: number;
    }
  | { type: 'charge'; techniqueId: string; chakra: number }
  | { type: 'chargeRelease'; techniqueId: string }
  | { type: 'movementReading'; damageBefore: number; damage: number }
  | { type: 'dojutsu'; dojutsu: DojutsuId; stage: number; chakra: number }
  | { type: 'dojutsuEnd'; dojutsu: DojutsuId; reason: 'time' | 'chakra' }
  | { type: 'chakraDrain'; amount: number; source: 'seal' | 'hive' }
  | { type: 'debilitate'; target: Side; turns: number; kind: DebilitateKind }
  | { type: 'mental'; target: Side; effect: Exclude<MentalEffect, 'prison' | 'sleep'>; turns: number }
  | { type: 'debilitateResisted'; target: Side }
  | { type: 'genjutsuImmune'; target: Side }
  | { type: 'wake'; side: Side }
  | { type: 'confusionFail'; side: Side; selfHit: number }
  | { type: 'torment'; side: Side; chakra: number }
  | { type: 'status'; target: Side; kind: StatusKind; turns: number }
  | { type: 'burnExtend'; target: Side; turns: number }
  | { type: 'burnTick'; target: Side; damage: number }
  | { type: 'burnOut'; target: Side }
  | { type: 'poisonTick'; target: Side; damage: number }
  | { type: 'poisonUp'; target: Side }
  | { type: 'poisonCured'; target: Side }
  | { type: 'cloak'; side: Side }
  | { type: 'cloakCost'; side: Side; chakra: number }
  | { type: 'cloakFade'; side: Side }
  | { type: 'cloakRegen'; side: Side; hp: number }
  | { type: 'regen'; hp: number; chakra: number }
  | { type: 'summonRegen'; hp: number }
  | { type: 'mist'; turns: number }
  | { type: 'mistEnd' }
  | { type: 'trickster'; counterCrit: boolean }
  | { type: 'lastStand'; healed: number; chakra: number }
  | { type: 'insaneTimer'; rounds: number }
  | { type: 'insaneRevive'; hp: number; chakra: number }
  | { type: 'monster'; hp: number; chakra: number }
  | { type: 'dodge'; source: Dodge['source'] }
  | { type: 'item'; item: ConsumableId; amount: number }
  | { type: 'revive'; revivesLeft: number }
  | { type: 'end'; status: 'won' | 'lost' };

/** Rodada em andamento: guarda onde parar e retomar quando a reação do jogador está pendente. */
export interface RoundPlan {
  action: PlayerAction;
  extras: RoundExtras;
  order: Side[];
  /** Posição em `order` do turno atual. */
  index: number;
  /** O turno do vilão já começou (passou pela checagem de perder a vez). */
  villainStarted: boolean;
  /** Ações do vilão já resolvidas neste turno. */
  villainActions: number;
}

export interface BattleState {
  round: number;
  status: BattleStatus;
  player: PlayerState;
  playerFx: PlayerFx;
  villain: VillainState;
  options: BattleOptions;
  /** Quem age primeiro: rolado uma vez no início da luta (ou definido pela vantagem/desvantagem de ação). */
  initiative: Side | null;
  /** Rodada parada no meio (só com `pending`). */
  plan: RoundPlan | null;
  /** Reação do jogador esperando escolha (`resumeRound`). */
  pending: PendingReaction | null;
  /** Log acumulado da luta, em ordem. A UI anima a partir dele. */
  log: BattleEvent[];
}

/** Id usado no log para o ataque do cão (Dupla, Inuzuka). */
export const DOG_ATTACK = 'dogAttack';
/** Id usado no log para o Selo explosivo. */
export const EXPLOSIVE_TAG = 'explosiveTag';

function newFx(): StatusFx {
  return {
    debilitated: 0,
    asleep: 0,
    paralyzed: 0,
    debilitateImmunity: 0,
    stunned: 0,
    burn: 0,
    burnTicks: 0,
    burnUnlocked: false,
    poison: null,
    bleeding: false,
    feared: 0,
    confused: 0,
    tormented: 0,
    cloakTurns: 0,
    cloakUsed: false,
    guaranteedCrit: false,
    owesAction: false,
    substitutionsUsed: 0,
  };
}

/**
 * Começa a luta. HP e chakra seguem como estão (a luta não começa restaurada), salvo `restore: true`.
 * Com `rng`, a primeira intenção do vilão já fica sorteada (Estrategista mostra na 1ª rodada).
 */
export function startBattle(
  player: PlayerState,
  villain: VillainDef,
  options: Partial<BattleOptions> = {},
  data?: GameData,
  rng?: Rng,
): BattleState {
  const opts: BattleOptions = {
    allowRevive: true,
    playerStartsFirst: false,
    villainStartsFirst: false,
    villainDamageMult: 1,
    restore: data?.balance.combat.restoreOnStart ?? false,
    interactive: false,
    ...options,
  };
  const s: BattleState = {
    round: 0,
    status: 'ongoing',
    player: opts.restore ? fullRestore(player) : { ...player },
    playerFx: {
      ...newFx(),
      gatesUsed: false,
      gatesStage: 0,
      gatesTurns: 0,
      gatesRound: 0,
      dojutsuActive: false,
      dojutsuTurns: 0,
      dojutsuRound: 0,
      expansionTurns: 0,
      expansionRound: 0,
      clonesArmed: false,
      armorTurns: 0,
      armorRound: 0,
      stance: false,
      dodge: null,
      focusUsed: 0,
      focusArmed: false,
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
      insaneRevives: 0,
      monster: false,
      intent: null,
      charging: null,
    },
    options: opts,
    initiative: null,
    plan: null,
    pending: null,
    log: [],
  };
  if (data && rng) s.villain.intent = rollIntent(s, rng);
  return s;
}

// ---------------------------------------------------------------------------
// Invocações

/** "Por nível" das invocações conta a partir do nível 2. */
function summonBonus(player: PlayerState, animal: SummonAnimal): number | null {
  return player.summon?.animal === animal ? player.summon.level - 1 : null;
}

/** Sapo: penetração na resistência do alvo. */
export function toadPenetration(player: PlayerState, data: GameData): number {
  const extra = summonBonus(player, 'toad');
  if (extra === null) return 0;
  const cfg = data.balance.summon.toad;
  return cfg.penetration + cfg.penetrationPerLevel * extra;
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

/** Lesma: chance extra de curar o envenenamento (a partir do nível 2). */
function slugCureBonus(player: PlayerState, data: GameData): number {
  const extra = summonBonus(player, 'slug');
  return extra === null ? 0 : data.balance.summon.slug.cureChancePerLevel * extra;
}

// ---------------------------------------------------------------------------
// Técnicas

/**
 * Técnica do skill set com elemento resolvido, upgrade genérico e a ferramenta ninja somada ao dano
 * base. Técnicas sem dano (genjutsu, médico, barreiras, estados, Imitação de Sombra) ficam com 0 de dano.
 */
export function playerTechnique(
  player: PlayerState,
  techniqueId: string,
  data: GameData,
): TechniqueDef & { element: Element | null } {
  const tech = leveledTechnique(player, techniqueId, data);
  const element = tech.type === 'taijutsu' ? null : tech.element === 'affinity' ? player.affinity : tech.element;
  if (!dealsDamage(tech)) return { ...tech, element, baseDamage: 0 };
  const baseDamage = tech.baseDamage + player.ninjaToolLevel * data.balance.ninjaTool.baseDamagePerLevel;
  return { ...tech, element, baseDamage };
}

/** A técnica causa dano (rola acerto e crítico). */
export function dealsDamage(tech: TechniqueDef): boolean {
  return (
    tech.type !== 'genjutsu' &&
    techniqueSlot(tech) !== 'medical' &&
    !tech.mental &&
    tech.barrier === undefined &&
    tech.state === undefined
  );
}

/** Barreira: só pode ser usada como reação. */
export function isBarrier(tech: TechniqueDef): boolean {
  return tech.barrier !== undefined;
}

/** Técnicas de ação do skill set (tai, nin e gen), na ordem das categorias. Médico e barreiras ficam de fora. */
export function attackTechniques(player: PlayerState, data: GameData): TechniqueDef[] {
  return knownTechniques(player, data).filter((t) => techniqueSlot(t) !== 'medical' && !isBarrier(t));
}

/** Barreiras do skill set (reação). */
export function barrierTechniques(player: PlayerState, data: GameData): TechniqueDef[] {
  return knownTechniques(player, data).filter(isBarrier);
}

/** Ficha comum aos dois lados para golpes, disputas e barreiras. */
interface CombatTech {
  id: string;
  type: AttackType;
  element: Element | null;
  /** Dano por golpe (já com upgrades e ferramenta ninja). */
  baseDamage: number;
  hits: number;
  chakraCost: number;
  accuracy?: number;
  critBonus?: number;
  penetration?: number;
  onHit?: { effect: HitEffect; chance: number };
  blade?: BladeKind;
  barrier?: number;
  reflectPct?: number;
  burnOnBreakAttempt?: number;
  multiHitBonus?: number;
  clashBonus?: number;
}

function playerCombatTech(s: BattleState, techniqueId: string, data: GameData): CombatTech {
  const t = playerTechnique(s.player, techniqueId, data);
  return { ...t, hits: t.hits ?? 1 };
}

/** Elemento de uma técnica do vilão: o dele, salvo indicação; taijutsu é neutro. */
function villainTechElement(def: VillainDef, tech: VillainTechnique): Element | null {
  if (tech.type === 'taijutsu') return null;
  return tech.element === undefined ? def.element : tech.element;
}

/** Espelhos (Haku): as ações extras viram golpes do mesmo ataque (um acerto, uma reação, um crítico). */
function villainCombatTech(s: BattleState, tech: VillainTechnique): CombatTech {
  const passive = s.villain.def.passive;
  const mirrors = passive?.kind === 'mirrors' && tech.barrier === undefined ? passive.actions : 1;
  return {
    id: tech.id,
    type: tech.type,
    element: villainTechElement(s.villain.def, tech),
    baseDamage: tech.baseDamage,
    hits: (tech.hits ?? 1) * mirrors,
    chakraCost: tech.chakraCost,
    ...(tech.accuracy !== undefined ? { accuracy: tech.accuracy } : {}),
    ...(tech.blade ? { blade: tech.blade } : {}),
    ...(tech.barrier !== undefined ? { barrier: tech.barrier } : {}),
  };
}

function villainTech(s: BattleState, id: string): VillainTechnique {
  const tech = s.villain.def.techniques.find((t) => t.id === id);
  if (!tech) throw new Error(`Técnica do vilão desconhecida: ${id}`);
  return tech;
}

/** Ficha de quem ataca, a partir do ataque anunciado. */
function incomingTech(s: BattleState, incoming: IncomingAttack, data: GameData): CombatTech {
  return incoming.attacker === 'player'
    ? playerCombatTech(s, incoming.techniqueId, data)
    : villainCombatTech(s, villainTech(s, incoming.techniqueId));
}

// ---------------------------------------------------------------------------
// Dōjutsu, portões, expansão e clones

/** Estágio do Sharingan pelo nível (1, 2 ou 3 tomoe). 0 = não tem Sharingan. */
export function sharinganStage(player: PlayerState, data: GameData): number {
  if (player.dojutsu !== 'sharingan') return 0;
  let stage = 0;
  data.balance.dojutsu.sharingan.stages.forEach((st, i) => {
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

export function sharinganActive(s: BattleState): boolean {
  return s.playerFx.dojutsuActive && s.player.dojutsu === 'sharingan';
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

/** Os Clones das Sombras podem ser armados junto com esta ação (chakra para os dois). */
export function canClones(s: BattleState, action: PlayerAction, data: GameData): boolean {
  if (s.player.active !== 'shadowClones' || s.playerFx.clonesArmed) return false;
  return s.player.chakra >= data.balance.shadowClones.chakraCost + actionCost(s, action, data);
}

/** Chakra que a ação gasta. */
export function actionCost(s: BattleState, action: PlayerAction, data: GameData): number {
  const p = s.player;
  const techId = actionTechniqueId(action);
  if (techId) return leveledTechnique(p, techId, data).chakraCost;
  switch (action) {
    case 'gates':
      return gatesToOpen(p, data)?.chakraCost ?? 0;
    case 'expansion':
      return data.balance.expansion.chakraCost;
    case 'dojutsu':
      return dojutsuActivationCost(p, data) ?? 0;
    case 'medical':
      return playerMedical(p, data)?.chakraCost ?? 0;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Atributos efetivos na luta

/** Manto do jinchuuriki ativo no jogador (multiplica tai/nin/gen, speed e as resistências). */
function playerCloak(s: BattleState, data: GameData): CloakDef | null {
  return s.player.jinchuuriki && s.playerFx.cloakTurns > 0 ? data.balance.jinchuuriki.cloak : null;
}

/** Armadura de Raio ativa (vale a partir da rodada seguinte à ativação). */
export function armorActive(s: BattleState): boolean {
  return s.playerFx.armorTurns > 0 && s.playerFx.armorRound !== s.round;
}

/** Ataque efetivo na luta (Sharingan, manto, Armadura de Raio). Tipos proibidos continuam zerados. */
export function effectiveOffense(s: BattleState, type: AttackType, data: GameData): number {
  const base = s.player.offense[type];
  if (s.player.forbiddenAttackTypes.includes(type)) return base;
  let value = (base + (activeSharingan(s, data)?.statBonus ?? 0)) * (playerCloak(s, data)?.statMult ?? 1);
  if (type !== 'genjutsu' && armorActive(s)) value *= data.balance.states.lightningArmor.offenseMult;
  return Math.floor(value);
}

export function effectiveSpeed(s: BattleState, data: GameData): number {
  let value = s.player.speed + (activeSharingan(s, data)?.speed ?? 0);
  if (expansionActive(s)) value -= data.balance.expansion.speedPenalty;
  if (armorActive(s)) value += data.balance.states.lightningArmor.speed;
  return Math.max(1, Math.floor(value * (playerCloak(s, data)?.statMult ?? 1)));
}

function expansionActive(s: BattleState): boolean {
  return s.playerFx.expansionTurns > 0 && s.playerFx.expansionRound !== s.round;
}

/**
 * Resistência total do jogador (manto ×1,25; Armadura de Raio ×1,3 na física). `ignoreArmor`: o vento
 * ignora o bônus da armadura.
 */
export function playerResistance(s: BattleState, kind: ResistanceKind, data: GameData, ignoreArmor = false): number {
  let value = s.player.resistance[kind] * (playerCloak(s, data)?.resistanceMult ?? 1);
  if (kind === 'physical' && armorActive(s) && !ignoreArmor) value *= data.balance.states.lightningArmor.resistanceMult;
  return value;
}

/** Manto do vilão (jinchuuriki ou marca da maldição). */
function villainCloak(s: BattleState) {
  const passive = s.villain.def.passive;
  return passive?.kind === 'cloak' ? passive : null;
}

/** Manto do vilão valendo agora: ativo ou forma de monstro (permanente). */
function villainCloakActive(s: BattleState): boolean {
  return s.villain.fx.cloakTurns > 0 || s.villain.monster;
}

/** Resistência total do vilão: multiplicador da passiva e manto ativo. */
export function villainResistance(s: BattleState, kind: ResistanceKind): number {
  const cloak = villainCloak(s);
  const base = s.villain.def.resistance[kind];
  if (!cloak) return base;
  const active = villainCloakActive(s) ? cloak.cloak.resistanceMult : 1;
  return base * (cloak.resistanceMult?.[kind] ?? 1) * active;
}

/** Ataque do vilão no tipo. O manto e as outras passivas multiplicam o dano (`villainDamageMult`). */
function villainOffense(s: BattleState, type: AttackType): number {
  return s.villain.def.offense[type];
}

/** Multiplicador de dano do vilão: evento, manto ativo, espelhos, último suspiro e pavor. */
function villainDamageMult(s: BattleState, data: GameData): number {
  const v = s.villain;
  const passive = v.def.passive;
  let mult = s.options.villainDamageMult;
  if (passive?.kind === 'cloak' && villainCloakActive(s)) mult *= passive.cloak.statMult;
  if (passive?.kind === 'mirrors') mult *= passive.damageMult;
  if (passive?.kind === 'mist' && passive.lastStand && v.lastStand) mult *= passive.lastStand.damageMult;
  if (v.fx.feared > 0) mult *= data.balance.status.fear.damageMult;
  return mult;
}

/** Estado elemental ativo no lutador (Armadura de Raio, Armadura de Areia). */
export function elementalStateOf(s: BattleState, side: Side, data: GameData): Element | null {
  if (side === 'player') return armorActive(s) ? data.balance.states.lightningArmor.element : null;
  return s.villain.def.elementalState ?? null;
}

/** O alvo é imune a genjutsu (demônio interno do jinchuuriki). */
export function genjutsuImmune(s: BattleState, target: Side, data: GameData): boolean {
  if (target === 'player') return s.player.jinchuuriki && data.balance.jinchuuriki.genjutsuImmune;
  return villainCloak(s)?.genjutsuImmune ?? false;
}

function stunPenalty(fx: StatusFx, data: GameData): number {
  return fx.stunned > 0 ? data.balance.status.stun.hitPenalty : 0;
}

/** O lutador pode reagir: não está aprisionado, dormindo, paralisado nem acovardado. */
export function canReact(s: BattleState, side: Side): boolean {
  const fx = fxOf(s, side);
  if (side === 'villain' && s.villain.cowering) return false;
  return fx.debilitated === 0 && fx.asleep === 0 && fx.paralyzed === 0;
}

/**
 * Fração da resistência usada. Passiva: 40%. Resistir: 70%; 100% em postura defensiva e, na física,
 * com o Corpo de ferro (prodígio do taijutsu).
 */
export function guardFraction(s: BattleState, side: Side, guard: Guard, kind: ResistanceKind, data: GameData): number {
  const cfg = data.balance.resistance;
  if (guard === 'passive') return cfg.passive;
  if (side === 'player') {
    if (s.playerFx.stance) return cfg.stance;
    if (kind === 'physical' && s.player.passive === 'ironBody') return cfg.stance;
  }
  return cfg.resist;
}

/** Guarda padrão de quem é atacado sem escolher reação: Resistir se pode reagir, senão passiva. */
function defaultGuard(s: BattleState, side: Side): Guard {
  return canReact(s, side) ? 'resist' : 'passive';
}

// ---------------------------------------------------------------------------
// Efeitos mentais (genjutsu e Imitação de Sombra)

/**
 * Turnos de um efeito mental que acerta: turnos base da técnica + 1 a cada `pointsPerExtraTurn`
 * de vantagem do poder do atacante sobre a resistência usada pelo alvo, entre 1 e o teto.
 */
export function genjutsuTurns(power: number, targetResistance: number, baseTurns: number, data: GameData): number {
  const cfg = data.balance.genjutsuPrison;
  const extra = Math.floor(Math.max(0, power - targetResistance) / cfg.pointsPerExtraTurn);
  return Math.min(cfg.maxTurns, Math.max(1, baseTurns + extra));
}

/** Status que a técnica mental usa (genjutsu, ou ninjutsu na Imitação de Sombra). */
function mentalStat(tech: TechniqueDef): AttackType {
  return tech.mentalStat ?? 'genjutsu';
}

/** Resistência que o vilão opõe ao efeito mental: mental contra genjutsu, física contra a Imitação de Sombra. */
function villainMentalDefense(s: BattleState, tech: TechniqueDef, data: GameData): number {
  const kind: ResistanceKind = mentalStat(tech) === 'genjutsu' ? 'mental' : 'physical';
  return villainResistance(s, kind) * guardFraction(s, 'villain', defaultGuard(s, 'villain'), kind, data);
}

/**
 * Resistência mental usada pelo jogador contra ilusões: total × fração (Resistir, postura ou passiva)
 * + Olhos treinados (Uchiha).
 */
export function playerMentalDefense(s: BattleState, data: GameData): number {
  const bonus = s.player.passive === 'genjutsuResistance' ? data.balance.passives.genjutsuResistance.bonus : 0;
  const fraction = guardFraction(s, 'player', defaultGuard(s, 'player'), 'mental', data);
  return playerResistance(s, 'mental', data) * fraction + bonus;
}

/** Poder mental do jogador: status efetivo + poder da técnica (com upgrades) + Sharingan (no genjutsu). */
export function playerGenjutsuPower(s: BattleState, techniqueId: string, data: GameData): number {
  const tech = playerTechnique(s.player, techniqueId, data);
  const stat = mentalStat(tech);
  const sharingan = stat === 'genjutsu' ? (activeSharingan(s, data)?.genjutsuPower ?? 0) : 0;
  return effectiveOffense(s, stat, data) + (tech.mentalPower ?? 0) + sharingan;
}

/** Turnos do efeito mental do jogador no vilão, se acertar. */
export function playerGenjutsuTurns(s: BattleState, techniqueId: string, data: GameData): number {
  const tech = playerTechnique(s.player, techniqueId, data);
  return genjutsuTurns(playerGenjutsuPower(s, techniqueId, data), villainMentalDefense(s, tech, data), tech.mentalTurns ?? 1, data);
}

/** Chance de o efeito mental do jogador pegar (0 contra alvo imune a genjutsu). */
export function playerGenjutsuHitChance(s: BattleState, data: GameData, techniqueId?: string): number {
  const tech = techniqueId ? data.techniquesById[techniqueId] : undefined;
  // Imitação de Sombra: é ninjutsu, rola a precisão da técnica e funciona em jinchuuriki.
  if (tech && tech.type !== 'genjutsu') {
    return hitChance(tech.accuracy, -stunPenalty(s.playerFx, data), data.balance.hit);
  }
  if (genjutsuImmune(s, 'villain', data)) return 0;
  const cfg = data.balance.genjutsuHit;
  const bonus = activeSharingan(s, data)?.genjutsuHit ?? 0;
  const defense = villainResistance(s, 'mental') * guardFraction(s, 'villain', defaultGuard(s, 'villain'), 'mental', data);
  const base = genjutsuHitChance(effectiveOffense(s, 'genjutsu', data), defense, cfg);
  return clamp(base + bonus - stunPenalty(s.playerFx, data), 0, 1);
}

// ---------------------------------------------------------------------------
// Dano

/** Penetração do golpe do jogador: técnica, sapo e Punho preciso (taijutsu), com teto. */
function playerPenetration(s: BattleState, tech: CombatTech, data: GameData): number {
  let pen = (tech.penetration ?? 0) + toadPenetration(s.player, data);
  if (tech.type === 'taijutsu' && s.player.passive === 'preciseFist') pen += data.balance.passives.preciseFist.penetration;
  return Math.min(pen, data.balance.penetration.max);
}

/** Penetração do golpe do vilão (Kabuto no hardcore). */
function villainPenetration(s: BattleState, data: GameData): number {
  const passive = s.villain.def.passive;
  return Math.min(passive?.kind === 'scalpel' ? (passive.resistancePierce ?? 0) : 0, data.balance.penetration.max);
}

/** Multiplicadores de dano do jogador: portões, Byakugan, expansão, corpo pesado e pavor. */
function playerDamageMult(s: BattleState, type: AttackType, data: GameData): number {
  const fx = s.playerFx;
  const p = s.player;
  let mult = 1;
  if (type === 'taijutsu') {
    if (fx.gatesTurns > 0 && fx.gatesStage > 0 && fx.gatesRound !== s.round) {
      mult *= data.balance.gates.stages[fx.gatesStage - 1]!.taijutsuMult;
    }
    if (byakuganActive(s)) mult *= data.balance.dojutsu.byakugan.taijutsuMult;
    if (expansionActive(s)) mult *= data.balance.expansion.taijutsuMult;
    if (p.passive === 'heavyBody') {
      const cfg = data.balance.passives.heavyBody;
      mult *= cfg.base + cfg.perHpPct * (p.hp / p.maxHp);
    }
  }
  if (fx.feared > 0) mult *= data.balance.status.fear.damageMult;
  return mult;
}

const other = (side: Side): Side => (side === 'player' ? 'villain' : 'player');

/**
 * Dano de um golpe de `attacker` (fórmula única): base + ataque − resistência física usada pelo alvo,
 * × elemento (contra o estado elemental do alvo) × crítico × multiplicadores do lado e `extraMult`.
 */
function strikeDamage(
  s: BattleState,
  attacker: Side,
  tech: CombatTech,
  guard: Guard,
  critMult: number,
  extraMult: number,
  data: GameData,
): { damage: number; elementMult: number } {
  const defender = other(attacker);
  const state = elementalStateOf(s, defender, data);
  const elementMult = elementMultiplier(tech.element, state, data.beats, data.balance.elements, true);
  // Vento contra a Armadura de Raio: ignora o bônus de resistência dela.
  const ignoreArmor = defender === 'player' && tech.element === 'wind';
  const resistance = defender === 'player' ? playerResistance(s, 'physical', data, ignoreArmor) : villainResistance(s, 'physical');
  const offense = attacker === 'player' ? effectiveOffense(s, tech.type, data) : villainOffense(s, tech.type);
  const sideMult = attacker === 'player' ? playerDamageMult(s, tech.type, data) : villainDamageMult(s, data);
  return {
    damage: computeDamage({
      baseDamage: tech.baseDamage,
      offense,
      resistance,
      fraction: guardFraction(s, defender, guard, 'physical', data),
      penetration: attacker === 'player' ? playerPenetration(s, tech, data) : villainPenetration(s, data),
      elementMult,
      critMult,
      extraMult: sideMult * extraMult,
    }),
    elementMult,
  };
}

// ---------------------------------------------------------------------------
// Prévia de ataque (UI e jogador automático usam a mesma conta do combate)

export interface AttackPreview {
  hitChance: number;
  critChance: number;
  elementMult: number;
  /** Dano de um golpe normal contra o vilão resistindo (sem crítico nem passivas aleatórias). */
  damage: number;
  hits: number;
}

/** Chance de acerto do jogador: precisão − atordoamento; névoa aumenta o erro; Byakugan: taijutsu não erra. */
function playerHitChance(s: BattleState, tech: CombatTech, data: GameData): number {
  if (tech.type === 'taijutsu' && byakuganActive(s)) return 1;
  let hit = hitChance(tech.accuracy, -stunPenalty(s.playerFx, data), data.balance.hit);
  const passive = s.villain.def.passive;
  if (passive?.kind === 'mist' && s.villain.mistTurns > 0) hit = 1 - (1 - hit) * passive.evasionMult;
  return clamp(hit, data.balance.hit.min, data.balance.hit.max);
}

/** Chance de crítico do jogador: bônus dele e da técnica + foco armado; 0 contra quem não sofre crítico. */
function techCritChance(s: BattleState, tech: CombatTech, hit: number, data: GameData): number {
  const passive = s.villain.def.passive;
  if (passive?.kind === 'insane' && passive.critImmune) return 0;
  const focus = s.playerFx.focusArmed ? data.balance.guru.focusCritBonus : 0;
  return critChance(s.player.critBonus + (tech.critBonus ?? 0) + focus, data.balance.crit, hit);
}

export function attackPreview(s: BattleState, techniqueId: string, data: GameData): AttackPreview {
  const tech = playerCombatTech(s, techniqueId, data);
  const { damage, elementMult } = strikeDamage(s, 'player', tech, defaultGuard(s, 'villain'), 1, 1, data);
  const hit = playerHitChance(s, tech, data);
  return { hitChance: hit, critChance: techCritChance(s, tech, hit, data), elementMult, damage, hits: tech.hits };
}

/** Ninjutsu médico do jogador (null = não sabe). */
export function playerMedical(player: PlayerState, data: GameData): TechniqueDef | null {
  const tech = knownTechniques(player, data).find((t) => techniqueSlot(t) === 'medical');
  return tech ? leveledTechnique(player, tech.id, data) : null;
}

/** A técnica pode ser usada agora (dōjutsu exigido ativo e chakra suficiente, com upgrades). */
export function canUseTechnique(s: BattleState, tech: TechniqueDef, data?: GameData): boolean {
  const p = s.player;
  if (p.forbiddenAttackTypes.includes(tech.type)) return false;
  if (tech.requiresDojutsu && !(s.playerFx.dojutsuActive && p.dojutsu === tech.requiresDojutsu)) return false;
  const cost = data ? leveledTechnique(p, tech.id, data).chakraCost : tech.chakraCost;
  return p.chakra >= cost;
}

/** Chakra que Concentrar chakra recupera: 15% do chakra máximo (mínimo 1). Vale para o jogador e o vilão. */
export function restChakraFor(maxChakra: number, data: GameData): number {
  return Math.max(1, Math.floor(maxChakra * data.balance.rest.chakraPct));
}

/** Chakra que o jogador recupera com Concentrar chakra. */
export function restChakra(player: PlayerState, data: GameData): number {
  return restChakraFor(player.maxChakra, data);
}

/** O foco do guru (+25% de chance de crítico no próximo ataque) pode ser ativado nesta rodada. */
export function canFocus(s: BattleState): boolean {
  return s.player.focusUses > s.playerFx.focusUsed;
}

/** O Uchiha pode trocar o efeito do genjutsu por Pavor (Sharingan ativo). */
export function canFearVariant(s: BattleState, action: PlayerAction, data: GameData): boolean {
  const id = actionTechniqueId(action);
  return id !== null && sharinganActive(s) && data.techniquesById[id]?.type === 'genjutsu';
}

export function availableActions(state: BattleState, data: GameData): PlayerAction[] {
  const p = state.player;
  const fx = state.playerFx;
  const { balance } = data;
  // A ação já foi gasta numa reação: o turno passa.
  if (fx.owesAction) return ['pass'];
  const actions: PlayerAction[] = [];
  for (const tech of attackTechniques(p, data)) {
    if (tech.state && fx.armorTurns > 0) continue;
    if (canUseTechnique(state, tech, data)) actions.push(techAction(tech.id));
  }
  const gates = gatesToOpen(p, data);
  if (gates && !fx.gatesUsed && p.chakra >= gates.chakraCost) actions.push('gates');
  if (p.active === 'expansion' && fx.expansionTurns === 0 && p.chakra >= balance.expansion.chakraCost) actions.push('expansion');
  const dojutsuCost = dojutsuActivationCost(p, data);
  if (dojutsuCost !== null && !fx.dojutsuActive && p.chakra >= dojutsuCost) actions.push('dojutsu');
  const medical = playerMedical(p, data);
  if (medical && p.chakra >= medical.chakraCost && p.hp < p.maxHp) actions.push('medical');
  actions.push('rest', 'stance');
  for (const [id, n] of Object.entries(p.bag) as [ConsumableId, number][]) {
    if (n > 0) actions.push(itemAction(id));
  }
  return actions;
}

// ---------------------------------------------------------------------------
// Reações (fundamentos.md#reações)

/** Usos de Substituição por luta: 2, mais o Mestre da Substituição do jogador. */
export function substitutionUses(s: BattleState, side: Side, data: GameData): number {
  const base = data.balance.substitution.usesPerFight;
  return side === 'player' ? base + s.player.substitutionBonus : base;
}

/** Chance da Substituição: 50% + 3% por ponto de speed a favor de quem reage, entre 25% e 85%. */
export function substitutionChance(s: BattleState, side: Side, data: GameData): number {
  const cfg = data.balance.substitution;
  const playerSpeed = effectiveSpeed(s, data);
  const villainSpeed = s.villain.def.speed;
  const diff = side === 'player' ? playerSpeed - villainSpeed : villainSpeed - playerSpeed;
  return clamp(cfg.baseChance + diff * cfg.perSpeed, cfg.min, cfg.max);
}

function chakraOf(s: BattleState, side: Side): number {
  return side === 'player' ? s.player.chakra : s.villain.chakra;
}

function spendChakra(s: BattleState, side: Side, amount: number): void {
  if (side === 'player') s.player.chakra -= amount;
  else s.villain.chakra -= amount;
}

function canSubstitute(s: BattleState, side: Side, data: GameData): boolean {
  const fx = fxOf(s, side);
  return chakraOf(s, side) >= data.balance.substitution.chakraCost && fx.substitutionsUsed < substitutionUses(s, side, data);
}

/**
 * Reações possíveis do jogador contra o ataque. Vazia = não pode reagir (recebe com a passiva).
 * Genjutsu: só Resistir. Sem ação livre pela frente: Resistir ou Substituição (que não gasta ação).
 */
export function playerReactionOptions(s: BattleState, incoming: IncomingAttack, data: GameData): ReactionChoice[] {
  if (!canReact(s, 'player')) return [];
  const options: ReactionChoice[] = ['resist'];
  if (incoming.type === 'genjutsu') return options;
  if (canSubstitute(s, 'player', data)) options.push('substitution');
  if (s.playerFx.owesAction) return options;
  for (const tech of knownTechniques(s.player, data)) {
    if (!canUseTechnique(s, tech, data)) continue;
    if (isBarrier(tech)) options.push(barrierReaction(tech.id));
    else if (incoming.type === 'ninjutsu' && tech.type === 'ninjutsu' && dealsDamage(tech)) options.push(clashReaction(tech.id));
  }
  return options;
}

/** Barreiras e ninjutsu de ataque que o vilão pode pagar agora. */
function villainReactionTechs(s: BattleState, incoming: IncomingAttack) {
  const v = s.villain;
  const affordable = v.def.techniques.filter((t) => t.chakraCost <= v.chakra);
  return {
    clash:
      incoming.type === 'ninjutsu'
        ? affordable.filter((t) => t.type === 'ninjutsu' && t.baseDamage > 0 && t.barrier === undefined && !t.healPct)
        : [],
    barrier: incoming.type === 'genjutsu' ? [] : affordable.filter((t) => t.barrier !== undefined),
  };
}

/** Reação do vilão: sorteada pelos pesos de `reactions`, só entre as possíveis (Resistir sempre). */
function chooseVillainReaction(s: BattleState, incoming: IncomingAttack, rng: Rng, data: GameData): ReactionChoice | 'passive' {
  if (!canReact(s, 'villain')) return 'passive';
  const v = s.villain;
  const weights = v.def.reactions ?? { resist: 1 };
  if (incoming.type === 'genjutsu') return 'resist';
  // Devendo a ação, só a Substituição (que não gasta ação) continua no sorteio.
  const techs = v.fx.owesAction ? { clash: [], barrier: [] } : villainReactionTechs(s, incoming);
  const kinds: { label: string; weight: number; value: 'resist' | 'clash' | 'barrier' | 'substitution' }[] = [
    { label: 'resist', weight: weights.resist, value: 'resist' },
  ];
  if (weights.clash && techs.clash.length) kinds.push({ label: 'clash', weight: weights.clash, value: 'clash' });
  if (weights.barrier && techs.barrier.length) kinds.push({ label: 'barrier', weight: weights.barrier, value: 'barrier' });
  if (weights.substitution && canSubstitute(s, 'villain', data)) {
    kinds.push({ label: 'substitution', weight: weights.substitution, value: 'substitution' });
  }
  if (kinds.length === 1) return 'resist';
  const kind = spin(kinds, rng).slice.value;
  if (kind === 'resist' || kind === 'substitution') return kind;
  const list = techs[kind];
  const tech = list.length === 1 ? list[0]! : spin(list.map((t) => ({ label: t.id, weight: Math.max(1, t.weight), value: t })), rng).slice.value;
  return kind === 'clash' ? clashReaction(tech.id) : barrierReaction(tech.id);
}

/** Ficha da técnica de reação de quem defende. */
function defenderTech(s: BattleState, side: Side, techniqueId: string, data: GameData): CombatTech {
  return side === 'player' ? playerCombatTech(s, techniqueId, data) : villainCombatTech(s, villainTech(s, techniqueId));
}

/** Poder na disputa: (dano × golpes ou barreira) + ninjutsu × 0,5; Rasengan +25%; golpe carregado ×2. */
function clashPower(s: BattleState, side: Side, tech: CombatTech, charged: boolean, data: GameData): number {
  const ninjutsu = side === 'player' ? effectiveOffense(s, 'ninjutsu', data) : villainOffense(s, 'ninjutsu');
  let power = (tech.barrier ?? tech.baseDamage * tech.hits) + ninjutsu * data.balance.clash.statFactor;
  if (tech.clashBonus) power *= 1 + tech.clashBonus;
  if (charged) power *= data.balance.charged.damageMult;
  return power;
}

/** Fatias da disputa: vitória do atacante (A²), anulação (0,5 × A × D) e vitória do defensor (D²). */
export function clashOdds(attackPower: number, defensePower: number, data: GameData): [number, number, number] {
  const a = attackPower ** 2;
  const d = defensePower ** 2;
  const c = data.balance.clash.cancelWeight * attackPower * defensePower;
  const total = a + c + d;
  return total > 0 ? [a / total, c / total, d / total] : [0, 1, 0];
}

/**
 * Poderes dos dois lados na disputa. Só a vantagem elemental multiplica (×1,5; raio contra barreira
 * de terra ×2): a desvantagem não reduz, para um jutsu básico com vantagem não anular um grande.
 */
function clashPowers(
  s: BattleState,
  attacker: Side,
  atk: CombatTech,
  charged: boolean,
  def: CombatTech,
  data: GameData,
): { attackPower: number; defensePower: number } {
  const cfg = data.balance.elements;
  const edge = (mult: number) => Math.max(1, mult);
  let attackPower = clashPower(s, attacker, atk, charged, data);
  attackPower *= edge(elementMultiplier(atk.element, def.element, data.beats, cfg, def.barrier !== undefined));
  let defensePower = clashPower(s, other(attacker), def, false, data);
  defensePower *= edge(elementMultiplier(def.element, atk.element, data.beats, cfg));
  if (def.multiHitBonus && atk.hits > 1) defensePower *= 1 + def.multiHitBonus;
  return { attackPower, defensePower };
}

/** Chance de o taijutsu quebrar a barreira: (dano × golpes + taijutsu × 0,5)² contra barreira². */
function guardBreakChance(s: BattleState, attacker: Side, atk: CombatTech, charged: boolean, barrier: CombatTech, data: GameData): number {
  const taijutsu = attacker === 'player' ? effectiveOffense(s, 'taijutsu', data) : villainOffense(s, 'taijutsu');
  let breakPower = atk.baseDamage * atk.hits + taijutsu * data.balance.clash.statFactor;
  if (charged) breakPower *= data.balance.charged.damageMult;
  const hold = clashPower(s, other(attacker), barrier, false, data);
  const b = breakPower ** 2;
  const h = hold ** 2;
  return b + h > 0 ? b / (b + h) : 0;
}

/** Prévia de uma reação do jogador ao ataque pendente (a UI mostra as chances). */
export type ReactionPreview =
  | { kind: 'resist'; fraction: number }
  | { kind: 'substitution'; chance: number; usesLeft: number }
  | { kind: 'clash'; attackPower: number; defensePower: number; odds: [number, number, number] }
  | { kind: 'guard'; holdChance: number };

export function reactionPreview(s: BattleState, incoming: IncomingAttack, choice: ReactionChoice, data: GameData): ReactionPreview {
  if (choice === 'resist') {
    const kind: ResistanceKind = incoming.type === 'genjutsu' ? 'mental' : 'physical';
    return { kind: 'resist', fraction: guardFraction(s, 'player', 'resist', kind, data) };
  }
  if (choice === 'substitution') {
    return {
      kind: 'substitution',
      chance: substitutionChance(s, 'player', data),
      usesLeft: substitutionUses(s, 'player', data) - s.playerFx.substitutionsUsed,
    };
  }
  const atk = incomingTech(s, incoming, data);
  const def = playerCombatTech(s, reactionTechniqueId(choice)!, data);
  if (incoming.type === 'taijutsu') {
    return { kind: 'guard', holdChance: 1 - guardBreakChance(s, incoming.attacker, atk, incoming.charged, def, data) };
  }
  const { attackPower, defensePower } = clashPowers(s, incoming.attacker, atk, incoming.charged, def, data);
  return { kind: 'clash', attackPower, defensePower, odds: clashOdds(attackPower, defensePower, data) };
}

/** Dano estimado do ataque que chega, se o jogador só Resistir (sem crítico; golpe carregado ×2). */
export function incomingDamagePreview(s: BattleState, incoming: IncomingAttack, data: GameData): number {
  if (incoming.type === 'genjutsu') return 0;
  const atk = incomingTech(s, incoming, data);
  const chargedMult = incoming.charged ? data.balance.charged.damageMult : 1;
  return strikeDamage(s, incoming.attacker, atk, 'resist', 1, chargedMult, data).damage * atk.hits;
}

type ReactionOutcome = { kind: 'strike'; guard: Guard } | { kind: 'resolved' };

/** Água que não perde para fogo apaga a queimadura de quem a usou. */
function extinguish(s: BattleState, side: Side): void {
  const fx = fxOf(s, side);
  if (fx.burn <= 0) return;
  fx.burn = 0;
  fx.burnTicks = 0;
  s.log.push({ type: 'extinguish', side });
}

function hurt(s: BattleState, side: Side, amount: number, data: GameData): number {
  return side === 'player' ? hurtPlayer(s, amount, data) : hurtVillain(s, amount);
}

/** Dano da técnica inteira (todos os golpes de uma vez), usado quando ela vence uma disputa ou é refletida. */
function wholeTechDamage(s: BattleState, attacker: Side, tech: CombatTech, guard: Guard, extraMult: number, data: GameData): number {
  return strikeDamage(s, attacker, { ...tech, baseDamage: tech.baseDamage * tech.hits }, guard, 1, extraMult, data).damage;
}

/** Barreira aguentou: Rotação devolve parte do dano; Muralha de Chamas pode queimar quem bateu. */
function barrierHolds(
  s: BattleState,
  defender: Side,
  barrier: CombatTech,
  attacker: Side,
  atk: CombatTech,
  charged: boolean,
  rng: Rng,
  data: GameData,
): void {
  let reflected = 0;
  if (barrier.reflectPct) {
    const chargedMult = charged ? data.balance.charged.damageMult : 1;
    const would = wholeTechDamage(s, attacker, atk, 'resist', chargedMult, data);
    reflected = Math.max(1, Math.floor(would * barrier.reflectPct));
  }
  s.log.push({ type: 'barrierHold', side: defender, techniqueId: barrier.id, reflected });
  if (reflected > 0) hurt(s, attacker, reflected, data);
  if (s.status !== 'ongoing') return;
  if (atk.type === 'taijutsu' && barrier.burnOnBreakAttempt && chance(barrier.burnOnBreakAttempt, rng) && fxOf(s, attacker).burn === 0) {
    igniteBurn(s, attacker, data.balance.status.burn.turns);
  }
}

/** Disputa de ninjutsu (fundamentos.md#disputa-de-ninjutsu). */
function resolveClash(
  s: BattleState,
  attacker: Side,
  atk: CombatTech,
  charged: boolean,
  def: CombatTech,
  rng: Rng,
  data: GameData,
): void {
  const defender = other(attacker);
  const cfg = data.balance.clash;
  const { attackPower, defensePower } = clashPowers(s, attacker, atk, charged, def, data);
  const odds = clashOdds(attackPower, defensePower, data);
  const result = spin(
    [
      { label: 'attacker', weight: odds[0], value: 'attacker' as const },
      { label: 'cancel', weight: odds[1], value: 'cancel' as const },
      { label: 'defender', weight: odds[2], value: 'defender' as const },
    ],
    rng,
  ).slice.value;
  const [winnerPower, loserPower] = result === 'defender' ? [defensePower, attackPower] : [attackPower, defensePower];
  const crushed = result !== 'cancel' && winnerPower >= cfg.crushRatio * loserPower;
  s.log.push({
    type: 'clash',
    attacker,
    attackTechnique: atk.id,
    defenseTechnique: def.id,
    attackPower,
    defensePower,
    odds,
    result,
    crushed,
  });

  // Água que não perde para fogo apaga a queimadura de quem a usou.
  if (def.element === 'water' && atk.element === 'fire' && result !== 'attacker') extinguish(s, defender);
  if (atk.element === 'water' && def.element === 'fire' && result !== 'defender') extinguish(s, attacker);
  if (result === 'cancel') return;

  const passPct = crushed ? 1 : Math.max(cfg.minPassThrough, 1 - loserPower / winnerPower);
  if (result === 'defender' && def.barrier !== undefined) {
    barrierHolds(s, defender, def, attacker, atk, charged, rng, data);
    return;
  }
  const [winner, tech, loserTech] = result === 'attacker' ? [attacker, atk, def] : [defender, def, atk];
  const loser = other(winner);
  const fireBonus = tech.element === 'fire' && loserTech.element === 'wind' ? data.balance.elements.fireAbsorbsWind : 1;
  const chargedMult = result === 'attacker' && charged ? data.balance.charged.damageMult : 1;
  const amount = wholeTechDamage(s, winner, tech, 'passive', passPct * fireBonus * chargedMult, data);
  s.log.push({ type: 'clashHit', target: loser, techniqueId: tech.id, damage: amount, passPct });
  hurt(s, loser, amount, data);
  if (s.status !== 'ongoing') return;
  applyElementalHit(s, loser, tech.element, 'hit', data);
  if (tech.onHit) applyOnHit(s, loser, tech, rng, data);
}

/**
 * Aplica a reação de quem recebe o ataque. Devolve se o golpe ainda vai acontecer (e com qual guarda)
 * ou se a reação já resolveu tudo (esquiva, barreira, disputa).
 */
function performReaction(
  s: BattleState,
  attacker: Side,
  atk: CombatTech,
  charged: boolean,
  choice: ReactionChoice | 'passive',
  rng: Rng,
  data: GameData,
): ReactionOutcome {
  const defender = other(attacker);
  const fx = fxOf(s, defender);
  if (choice === 'passive' || choice === 'resist') {
    s.log.push({ type: 'reaction', side: defender, kind: choice, techniqueId: null, chakra: 0 });
    return { kind: 'strike', guard: choice };
  }
  // Substituição não gasta ação; disputa e barreira gastam a próxima.
  if (choice === 'substitution') {
    const cost = data.balance.substitution.chakraCost;
    spendChakra(s, defender, cost);
    fx.substitutionsUsed++;
    s.log.push({ type: 'reaction', side: defender, kind: 'substitution', techniqueId: null, chakra: cost });
    const p = substitutionChance(s, defender, data);
    const success = chance(p, rng);
    s.log.push({ type: 'substitutionRoll', side: defender, chance: p, success });
    return success ? { kind: 'resolved' } : { kind: 'strike', guard: 'passive' };
  }
  fx.owesAction = true;
  const def = defenderTech(s, defender, reactionTechniqueId(choice)!, data);
  spendChakra(s, defender, def.chakraCost);
  s.log.push({
    type: 'reaction',
    side: defender,
    kind: def.barrier !== undefined ? 'barrier' : 'clash',
    techniqueId: def.id,
    chakra: def.chakraCost,
  });
  if (atk.type === 'taijutsu') {
    // Quebra de guarda: só barreira responde a taijutsu.
    const p = guardBreakChance(s, attacker, atk, charged, def, data);
    const broken = chance(p, rng);
    s.log.push({ type: 'guardBreak', attacker, techniqueId: atk.id, barrierId: def.id, breakChance: p, broken });
    if (broken) return { kind: 'strike', guard: 'passive' };
    barrierHolds(s, defender, def, attacker, atk, charged, rng, data);
    return { kind: 'resolved' };
  }
  resolveClash(s, attacker, atk, charged, def, rng, data);
  return { kind: 'resolved' };
}

// ---------------------------------------------------------------------------
// Rodada

/**
 * Joga uma rodada: ordem (iniciativa rolada só na 1ª; prioridade passa na frente), ação de cada lado,
 * efeitos de fim de rodada e a próxima intenção do vilão.
 * `extras`: escolhas grátis (foco, clones, pavor). `true` = só o foco (atalho antigo).
 * `react`: política para a reação do jogador. Com `options.interactive` e sem política, a rodada para
 * em `pending` quando há escolha; continue com `resumeRound`.
 * Pura: devolve um novo estado e não altera `prev`.
 */
export function playRound(
  prev: BattleState,
  action: PlayerAction,
  rng: Rng,
  data: GameData,
  extras: RoundExtras | boolean = {},
  react?: ReactionPolicy,
): BattleState {
  const ex: RoundExtras = typeof extras === 'boolean' ? { focus: extras } : extras;
  if (prev.status !== 'ongoing') throw new Error('A luta já terminou');
  if (prev.pending) throw new Error('Há uma reação pendente (resumeRound)');
  if (!availableActions(prev, data).includes(action)) throw new Error(`Ação indisponível: ${action}`);
  if (ex.focus && !canFocus(prev)) throw new Error('Foco indisponível');
  if (ex.clones && !canClones(prev, action, data)) throw new Error('Clones indisponíveis');
  if (ex.fear && !canFearVariant(prev, action, data)) throw new Error('Pavor só com o Sharingan ativo');

  const s = structuredClone(prev);
  s.round++;
  s.log.push({ type: 'round', round: s.round });

  startOfRound(s, data);
  if (s.status !== 'ongoing') return s;

  // Vantagem/desvantagem de ação substitui a roleta de iniciativa: define quem ataca primeiro na luta.
  if (s.initiative === null && s.options.playerStartsFirst) {
    s.initiative = 'player';
    s.log.push({ type: 'ambush' });
  } else if (s.initiative === null && s.options.villainStartsFirst) {
    s.initiative = 'villain';
    s.log.push({ type: 'late' });
  } else if (s.initiative === null) {
    const speed = effectiveSpeed(s, data);
    const c = initiativeChance(speed, s.villain.def.speed);
    s.initiative = rollInitiative(speed, s.villain.def.speed, rng) === 'a' ? 'player' : 'villain';
    s.log.push({ type: 'initiative', first: s.initiative, playerChance: c });
  }

  if (ex.focus) {
    s.playerFx.focusUsed++;
    s.playerFx.focusArmed = true;
    s.log.push({ type: 'focus' });
  }
  if (ex.clones) {
    const cost = data.balance.shadowClones.chakraCost;
    s.player.chakra -= cost;
    s.playerFx.clonesArmed = true;
    s.log.push({ type: 'clones', chakra: cost });
  }

  // Técnica com prioridade passa na frente da iniciativa nesta rodada.
  const techId = actionTechniqueId(action);
  const priority = Boolean(techId && data.techniquesById[techId]?.priority);
  let playerFirst = s.initiative === 'player';
  if (priority && !playerFirst) {
    playerFirst = true;
    s.log.push({ type: 'priority', side: 'player' });
  }

  s.plan = {
    action,
    extras: ex,
    order: playerFirst ? ['player', 'villain'] : ['villain', 'player'],
    index: 0,
    villainStarted: false,
    villainActions: 0,
  };
  runPlan(s, rng, data, react);
  return s;
}

/** Continua a rodada parada com a reação escolhida pelo jogador. Pura. */
export function resumeRound(prev: BattleState, choice: ReactionChoice, rng: Rng, data: GameData, react?: ReactionPolicy): BattleState {
  const pending = prev.pending;
  if (!pending || !prev.plan) throw new Error('Nenhuma reação pendente');
  if (!pending.options.includes(choice)) throw new Error(`Reação indisponível: ${choice}`);
  const s = structuredClone(prev);
  s.pending = null;
  resolveVillainAttack(s, villainTech(s, pending.incoming.techniqueId), pending.incoming.charged, pending.chakra, choice, rng, data);
  s.plan!.villainActions++;
  runPlan(s, rng, data, react);
  return s;
}

/** Executa os turnos que faltam na rodada (para se o jogador precisar escolher uma reação). */
function runPlan(s: BattleState, rng: Rng, data: GameData, react?: ReactionPolicy): void {
  const plan = s.plan!;
  while (plan.index < plan.order.length && s.status === 'ongoing') {
    const side = plan.order[plan.index]!;
    if (side === 'player') {
      playerTurn(s, plan.action, plan.extras, rng, data);
      plan.index++;
      continue;
    }
    const v = s.villain;
    if (!plan.villainStarted) {
      plan.villainStarted = true;
      if (consumeSkip(s, 'villain', data)) {
        v.intent = null;
        endTurn(v.fx, false);
        plan.index++;
        continue;
      }
    }
    if (plan.villainActions === 0) {
      if (villainAction(s, rng, data, react)) return;
      plan.villainActions++;
    }
    endTurn(v.fx, true);
    plan.index++;
  }
  if (s.status === 'ongoing') endOfRound(s, rng, data);
  s.plan = null;
}

// ---------------------------------------------------------------------------
// Internos: operam sobre o clone criado em playRound/resumeRound.

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
  return spin(chanceSlices(clamp(p, 0, 1), { label: 'yes', value: true }, { label: 'no', value: false }), rng).slice.value;
}

/** Quem dorme acorda ao tomar dano. */
function wakeUp(s: BattleState, side: Side): void {
  const fx = fxOf(s, side);
  if (fx.asleep > 0) {
    fx.asleep = 0;
    s.log.push({ type: 'wake', side });
  }
}

/**
 * Dano no vilão vindo de qualquer fonte. Golpe fatal passa pelas passivas que o evitam
 * (enganador, último suspiro); se nada evitar, o jogador vence. Devolve o dano causado.
 */
function hurtVillain(s: BattleState, amount: number): number {
  const v = s.villain;
  const dealt = Math.min(v.hp, amount);
  v.hp -= dealt;
  if (dealt > 0) wakeUp(s, 'villain');
  if (v.hp === 0) {
    villainDown(s);
    return dealt;
  }
  checkVillainThresholds(s);
  return dealt;
}

/** Segunda fase do vilão: o chakra volta na mesma fração do HP (sem baixar o que ele já tem). */
function restoreVillainChakra(v: BattleState['villain'], pct: number): number {
  v.chakra = Math.max(v.chakra, Math.floor(v.def.chakra * pct));
  return v.chakra;
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
  if (passive?.kind === 'cloak' && passive.monster && !v.monster) {
    const m = passive.monster;
    v.monster = true;
    v.hp = Math.max(1, Math.floor(v.def.hp * m.healPct));
    v.def = { ...v.def, techniques: m.techniques, ...(m.reactions ? { reactions: m.reactions } : {}) };
    v.charging = null;
    v.intent = null;
    v.fx.cloakUsed = true;
    v.fx.cloakTurns = 0;
    clearNegatives(v.fx);
    const chakra = restoreVillainChakra(v, m.healPct);
    s.log.push({ type: 'monster', hp: v.hp, chakra });
    return;
  }
  if (passive?.kind === 'mist' && passive.lastStand && !v.lastStand) {
    v.lastStand = true;
    v.hp = Math.max(1, Math.floor(v.def.hp * passive.lastStand.healPct));
    const chakra = restoreVillainChakra(v, passive.lastStand.healPct);
    s.log.push({ type: 'lastStand', healed: v.hp, chakra });
    return;
  }
  finish(s, 'won');
}

/** Manto do vilão abaixo do limiar e contagem do Orochimaru. */
function checkVillainThresholds(s: BattleState): void {
  const v = s.villain;
  const passive = v.def.passive;
  if (passive?.kind === 'cloak' && !v.fx.cloakUsed && !v.monster && v.hp < v.def.hp * passive.cloak.hpThresholdPct) {
    activateCloak(s, 'villain', passive.cloak);
  }
  if (passive?.kind === 'insane' && v.insaneTimer === 0 && insaneRevivesLeft(s) && v.hp < v.def.hp * passive.hpThresholdPct) {
    v.insaneTimer = passive.killWindow;
    s.log.push({ type: 'insaneTimer', rounds: passive.killWindow });
  }
}

/** O Orochimaru ainda pode reviver nesta luta (limite da dificuldade; sem escala, o do normal). */
export function insaneRevivesLeft(s: BattleState): boolean {
  const passive = s.villain.def.passive;
  if (passive?.kind !== 'insane') return false;
  const max = passive.maxRevives ?? passive.revivesByDifficulty?.normal ?? Infinity;
  return s.villain.insaneRevives < max;
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
  if (dealt > 0) wakeUp(s, 'player');
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

/**
 * Perde a vez (acovardado, reação já gasta, paralisado, dormindo ou aprisionado).
 * Devolve true se perdeu a vez.
 */
function consumeSkip(s: BattleState, side: Side, data: GameData): boolean {
  if (side === 'villain' && s.villain.cowering) {
    s.villain.cowering = false;
    s.log.push({ type: 'skip', side, reason: 'cower' });
    return true;
  }
  const fx = fxOf(s, side);
  if (fx.owesAction) {
    fx.owesAction = false;
    s.log.push({ type: 'skip', side, reason: 'reacted' });
    return true;
  }
  let reason: SkipReason;
  if (fx.paralyzed > 0) {
    fx.paralyzed--;
    reason = 'paralysis';
  } else if (fx.asleep > 0) {
    fx.asleep--;
    reason = 'sleep';
  } else if (fx.debilitated > 0) {
    fx.debilitated--;
    reason = 'prison';
  } else {
    return false;
  }
  if (fx.paralyzed === 0 && fx.debilitated === 0 && fx.asleep === 0) {
    fx.debilitateImmunity = data.balance.debilitated.immunityActions;
  }
  s.log.push({ type: 'skip', side, reason });
  return true;
}

/** Fim da vez do lutador: conta a anti-trava, o atordoamento, o pavor e a confusão. */
function endTurn(fx: StatusFx, acted: boolean): void {
  if (acted && fx.debilitateImmunity > 0) fx.debilitateImmunity--;
  if (fx.stunned > 0) fx.stunned--;
  if (fx.feared > 0) fx.feared--;
  if (fx.confused > 0) fx.confused--;
}

function applyDebilitate(s: BattleState, target: Side, turns: number, kind: DebilitateKind): void {
  const fx = fxOf(s, target);
  if (fx.debilitateImmunity > 0) {
    s.log.push({ type: 'debilitateResisted', target });
    return;
  }
  if (kind === 'prison') fx.debilitated = Math.max(fx.debilitated, turns);
  else if (kind === 'sleep') fx.asleep = Math.max(fx.asleep, turns);
  else fx.paralyzed = Math.max(fx.paralyzed, turns);
  s.log.push({ type: 'debilitate', target, turns, kind });
}

/** Aplica um efeito mental com a duração já calculada (o Sono dura +1 turno). */
function applyMental(s: BattleState, target: Side, effect: MentalEffect, turns: number, data: GameData): void {
  const fx = fxOf(s, target);
  switch (effect) {
    case 'prison':
      applyDebilitate(s, target, turns, 'prison');
      return;
    case 'sleep':
      applyDebilitate(s, target, turns + data.balance.status.sleepExtraTurns, 'sleep');
      return;
    case 'fear':
      fx.feared = Math.max(fx.feared, turns);
      break;
    case 'confusion':
      fx.confused = Math.max(fx.confused, turns);
      break;
    case 'torment':
      fx.tormented = Math.max(fx.tormented, turns);
      break;
  }
  s.log.push({ type: 'mental', target, effect, turns });
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
      igniteBurn(s, target, outcome === 'crit' ? cfg.burn.turns : cfg.burn.reigniteTurns);
    }
    return;
  }
  if (outcome !== 'crit') return;
  if (element === 'lightning') applyDebilitate(s, target, cfg.paralysis.turns, 'paralysis');
  else applyStun(s, target, data);
}

function igniteBurn(s: BattleState, target: Side, turns: number): void {
  const fx = fxOf(s, target);
  fx.burn = turns;
  fx.burnTicks = 0;
  fx.burnUnlocked = true;
  s.log.push({ type: 'status', target, kind: 'burn', turns });
}

function applyStun(s: BattleState, target: Side, data: GameData): void {
  const fx = fxOf(s, target);
  fx.stunned = Math.max(fx.stunned, data.balance.status.stun.turns);
  s.log.push({ type: 'status', target, kind: 'stun', turns: fx.stunned });
}

/** Efeito com chance no acerto (campo `onHit` da técnica). Queimadura acesa já pelo crítico só prolonga. */
function applyOnHit(s: BattleState, target: Side, tech: { onHit?: { effect: HitEffect; chance: number } }, rng: Rng, data: GameData): void {
  if (!tech.onHit || !chance(tech.onHit.chance, rng)) return;
  if (tech.onHit.effect === 'stun') applyStun(s, target, data);
  else if (fxOf(s, target).burn === 0) igniteBurn(s, target, data.balance.status.burn.turns);
}

/** Envenena; se o alvo já está envenenado, o próximo tique cresce. */
function applyPoison(s: BattleState, target: Side, bonus: number, data: GameData): void {
  const fx = fxOf(s, target);
  if (fx.poison) {
    fx.poison.bonus += data.balance.status.poison.hitBonus;
    s.log.push({ type: 'poisonUp', target });
    return;
  }
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

/** Limpa os efeitos negativos do jogador (Kit médico, Vontade do Fogo). */
function clearNegatives(fx: StatusFx): void {
  fx.poison = null;
  fx.burn = 0;
  fx.burnTicks = 0;
  fx.bleeding = false;
  fx.stunned = 0;
  fx.feared = 0;
  fx.confused = 0;
  fx.tormented = 0;
  fx.debilitated = 0;
  fx.asleep = 0;
  fx.paralyzed = 0;
}

/** Manto ativo: paga a rodada com chakra (desde a seguinte à ativação); sem chakra, se desfaz. */
function payCloak(s: BattleState, side: Side, cloak: CloakDef): void {
  const fx = fxOf(s, side);
  if (fx.cloakTurns <= 0) return;
  const max = side === 'player' ? s.player.maxChakra : s.villain.def.chakra;
  const cost = Math.max(1, Math.floor(max * cloak.chakraPctPerRound));
  if (chakraOf(s, side) < cost) {
    fx.cloakTurns = 0;
    s.log.push({ type: 'cloakFade', side });
    return;
  }
  spendChakra(s, side, cost);
  s.log.push({ type: 'cloakCost', side, chakra: cost });
}

function startOfRound(s: BattleState, data: GameData): void {
  const p = s.player;
  const v = s.villain;
  const vPassive = v.def.passive;
  const { balance } = data;

  if (s.round === 1) {
    if (vPassive?.kind === 'mist') {
      v.mistTurns = vPassive.turns;
      s.log.push({ type: 'mist', turns: vPassive.turns });
    }
  }

  // Tormento: perde chakra no início da rodada.
  for (const side of ['player', 'villain'] as Side[]) {
    const fx = fxOf(s, side);
    if (fx.tormented <= 0) continue;
    fx.tormented--;
    const lost = Math.min(chakraOf(s, side), balance.status.torment.chakraPerRound);
    spendChakra(s, side, lost);
    s.log.push({ type: 'torment', side, chakra: lost });
  }

  // Mantos já ativos pagam a rodada; quem desperta agora só paga a partir da próxima.
  if (p.jinchuuriki) payCloak(s, 'player', balance.jinchuuriki.cloak);
  if (vPassive?.kind === 'cloak') payCloak(s, 'villain', vPassive.cloak);
  if (s.round === 1 && vPassive?.kind === 'cloak' && vPassive.fromStart) activateCloak(s, 'villain', vPassive.cloak);

  if (p.passive === 'vitality') {
    const cfg = balance.passives.vitality;
    const hp = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * cfg.hpPctPerTurn));
    const chakra = Math.min(p.maxChakra - p.chakra, cfg.chakraPerTurn);
    if (hp > 0 || chakra > 0) {
      p.hp += hp;
      p.chakra += chakra;
      s.log.push({ type: 'regen', hp, chakra });
    }
  }
  // Quem já começa a rodada abaixo do limiar também desperta o manto.
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

  if (fx.burn > 0) {
    fx.burnTicks++;
    const pct = Math.min(2 ** fx.burnTicks / 100, cfg.burn.maxPct);
    const amount = hurt(s, side, Math.max(1, Math.floor(max * pct)), data);
    s.log.push({ type: 'burnTick', target: side, damage: amount });
    if (s.status !== 'ongoing') return false;
    fx.burn--;
    if (fx.burn === 0) {
      fx.burnTicks = 0;
      s.log.push({ type: 'burnOut', target: side });
    }
  }
  if (fx.poison) {
    const raw = Math.floor(max * cfg.poison.basePct) + fx.poison.bonus + fx.poison.ticks * cfg.poison.growthPerTick;
    const amount = hurt(s, side, Math.max(1, Math.min(raw, Math.floor(max * cfg.poison.maxPct))), data);
    s.log.push({ type: 'poisonTick', target: side, damage: amount });
    if (s.status !== 'ongoing') return false;
    // A Vontade do Fogo limpa o veneno: só testa a cura se ele ainda estiver lá (a partir do 2º tique).
    if (fx.poison) {
      fx.poison.ticks++;
      const cure = cfg.poison.cureChance + (side === 'player' ? slugCureBonus(s.player, data) : 0);
      if (fx.poison.ticks >= cfg.poison.cureFromTick && chance(cure, rng)) {
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
      v.hp = Math.max(v.hp, Math.floor(v.def.hp * passive.revivePct));
      v.insaneRevives++;
      const chakra = restoreVillainChakra(v, passive.revivePct);
      s.log.push({ type: 'insaneRevive', hp: v.hp, chakra });
    }
  }

  // Portões, expansão, Armadura de Raio e dōjutsu contam a partir da rodada seguinte à ativação.
  if (fx.gatesTurns > 0 && fx.gatesRound !== s.round) fx.gatesTurns--;
  if (fx.expansionTurns > 0 && fx.expansionRound !== s.round) {
    fx.expansionTurns--;
    if (fx.expansionTurns === 0) s.log.push({ type: 'expansionEnd' });
  }
  if (fx.armorTurns > 0 && fx.armorRound !== s.round) {
    fx.armorTurns--;
    if (fx.armorTurns === 0) s.log.push({ type: 'armorEnd' });
  }
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
  if (fx.dodge && fx.dodge.untilRound <= s.round) fx.dodge = null;

  // Próxima ação do vilão (o golpe carregado já está decidido).
  v.intent = v.charging ? { kind: 'technique', id: v.charging } : rollIntent(s, rng);
}

// ---------------------------------------------------------------------------
// Jogador

function playerTurn(s: BattleState, action: PlayerAction, ex: RoundExtras, rng: Rng, data: GameData): void {
  const fx = s.playerFx;
  // A postura vale até o próximo turno do jogador.
  fx.stance = false;
  if (consumeSkip(s, 'player', data)) {
    endTurn(fx, false);
    return;
  }
  const p = s.player;
  const { balance } = data;

  const techId = actionTechniqueId(action);
  const itemId = actionItemId(action);
  if (techId) {
    const tech = leveledTechnique(p, techId, data);
    if (tech.state) {
      p.chakra -= tech.chakraCost;
      fx.armorTurns = balance.states[tech.state].turns;
      fx.armorRound = s.round;
      s.log.push({ type: 'armor', techniqueId: tech.id, chakra: tech.chakraCost });
    } else if (tech.mental) {
      playerMentalTechnique(s, techId, Boolean(ex.fear), rng, data);
    } else {
      playerAttack(s, techId, rng, data);
    }
  } else if (itemId) {
    useItem(s, itemId, data);
  } else if (action === 'rest') {
    const gained = Math.min(p.maxChakra - p.chakra, restChakra(p, data));
    p.chakra += gained;
    s.log.push({ type: 'rest', chakra: gained });
  } else if (action === 'stance') {
    fx.stance = true;
    s.log.push({ type: 'stance' });
  } else if (action === 'dojutsu') {
    if (!p.dojutsu) throw new Error('O jogador não tem dōjutsu');
    const cost = balance.dojutsu[p.dojutsu].activationCost;
    p.chakra -= cost;
    fx.dojutsuActive = true;
    fx.dojutsuTurns = balance.dojutsu.duration;
    fx.dojutsuRound = s.round;
    s.log.push({ type: 'dojutsu', dojutsu: p.dojutsu, stage: sharinganStage(p, data), chakra: cost });
  } else if (action === 'gates') {
    // Abrir os portões gasta o turno (não é golpe); o bônus vale a partir da próxima rodada.
    const gates = gatesToOpen(p, data);
    if (!gates) throw new Error('Portões exigem a ativa correspondente');
    const hpLost = gatesHpCost(p, gates.hpCostPct);
    p.chakra -= gates.chakraCost;
    p.hp -= hpLost;
    fx.gatesUsed = true;
    fx.gatesStage = gates.stage;
    fx.gatesTurns = balance.gates.turns;
    fx.gatesRound = s.round;
    s.log.push({ type: 'gates', stage: gates.stage, hpLost, chakra: gates.chakraCost });
    checkPlayerCloak(s, data);
  } else if (action === 'expansion') {
    const cfg = balance.expansion;
    p.chakra -= cfg.chakraCost;
    fx.expansionTurns = cfg.turns;
    fx.expansionRound = s.round;
    s.log.push({ type: 'expansion', chakra: cfg.chakraCost });
  } else if (action === 'medical') {
    // Ninjutsu médico: cura sem rolar acerto.
    const tech = playerMedical(p, data);
    if (!tech) throw new Error('O jogador não sabe ninjutsu médico');
    p.chakra -= tech.chakraCost;
    s.log.push({ type: 'medical', healed: heal(s, 'player', medicalHealPct(p, data)), chakra: tech.chakraCost });
  }
  endTurn(fx, true);
}

function useItem(s: BattleState, item: ConsumableId, data: GameData): void {
  const p = s.player;
  const cfg = data.balance.items;
  p.bag = { ...p.bag, [item]: p.bag[item] - 1 };
  switch (item) {
    case 'soldierPill': {
      const amount = Math.min(p.maxChakra - p.chakra, Math.floor(p.maxChakra * cfg.soldierPill.chakraPct));
      p.chakra += amount;
      s.log.push({ type: 'item', item, amount });
      return;
    }
    case 'medKit':
      clearNegatives(s.playerFx);
      s.log.push({ type: 'item', item, amount: 0 });
      return;
    case 'explosiveTag': {
      // Ignora resistência, não rola acerto e não permite reação.
      s.log.push({ type: 'item', item, amount: cfg.explosiveTag.damage });
      hurtVillain(s, cfg.explosiveTag.damage);
      return;
    }
    case 'smokeBomb':
      s.playerFx.dodge = { chance: 1, untilRound: s.round + 1, source: 'smokeBomb' };
      s.log.push({ type: 'item', item, amount: 0 });
      return;
  }
}

/** Confusão: a ação pode falhar; metade das falhas acerta o próprio lutador. Devolve true se falhou. */
function confusionFails(s: BattleState, side: Side, selfDamage: number, rng: Rng, data: GameData): boolean {
  const fx = fxOf(s, side);
  const cfg = data.balance.status.confusion;
  if (fx.confused <= 0 || !chance(cfg.failChance, rng)) return false;
  const selfHit = selfDamage > 0 && chance(cfg.selfHitShare, rng) ? selfDamage : 0;
  s.log.push({ type: 'confusionFail', side, selfHit });
  if (selfHit > 0) hurt(s, side, selfHit, data);
  return true;
}

/** Golpe confuso no próprio corpo: técnica + ataque contra a própria resistência física passiva. */
function selfHitDamage(s: BattleState, side: Side, tech: CombatTech, data: GameData): number {
  if (tech.type === 'genjutsu' || tech.baseDamage <= 0) return 0;
  const offense = side === 'player' ? effectiveOffense(s, tech.type, data) : villainOffense(s, tech.type);
  const resistance = side === 'player' ? playerResistance(s, 'physical', data) : villainResistance(s, 'physical');
  return computeDamage({
    baseDamage: tech.baseDamage,
    offense,
    resistance,
    fraction: data.balance.resistance.passive,
    elementMult: 1,
    critMult: 1,
  });
}

/**
 * Genjutsu (ou Imitação de Sombra): não causa dano nem consome o crítico garantido; se acertar,
 * aplica o efeito mental. Com o Sharingan, o Uchiha pode trocar o efeito por Pavor.
 * A única reação do vilão é Resistir (com a resistência mental; física contra a sombra).
 */
function playerMentalTechnique(s: BattleState, techId: string, fear: boolean, rng: Rng, data: GameData): void {
  const p = s.player;
  const tech = playerTechnique(p, techId, data);
  p.chakra -= tech.chakraCost;
  if (confusionFails(s, 'player', 0, rng, data)) return;
  s.log.push({ type: 'declare', side: 'player', techniqueId: tech.id, attackType: tech.type, element: tech.element, chakra: tech.chakraCost });
  if (tech.type === 'genjutsu' && genjutsuImmune(s, 'villain', data)) {
    s.log.push({ type: 'genjutsuImmune', target: 'villain' });
    return;
  }
  const hitP = playerGenjutsuHitChance(s, data, techId);
  const outcome = rollHit(hitP, 0, rng);
  s.log.push({
    type: 'attack',
    side: 'player',
    techniqueId: tech.id,
    attackType: tech.type,
    outcome,
    damage: 0,
    elementMult: 1,
    hitChance: hitP,
    critChance: 0,
    chakra: tech.chakraCost,
  });
  if (outcome === 'miss') return;
  applyMental(s, 'villain', fear ? 'fear' : tech.mental!, playerGenjutsuTurns(s, techId, data), data);
}

/** Um golpe do jogador contra o vilão. Devolve o resultado e o dano causado. */
function playerStrike(
  s: BattleState,
  tech: CombatTech,
  techniqueId: string,
  damageFactor: number,
  chakra: number,
  guard: Guard,
  rng: Rng,
  data: GameData,
  rolled?: HitOutcome,
): { outcome: HitOutcome; dealt: number } {
  const { balance } = data;
  const hitP = playerHitChance(s, tech, data);
  const critP = techCritChance(s, tech, hitP, data);
  // Golpes seguintes de um ataque múltiplo repetem o resultado do primeiro.
  const outcome = rolled ?? rollHit(hitP, critP, rng);
  s.playerFx.focusArmed = false;
  const critMult = outcome === 'crit' ? balance.crit.multiplier : 1;
  const { damage, elementMult } = strikeDamage(s, 'player', tech, guard, critMult, damageFactor, data);
  s.log.push({
    type: 'attack',
    side: 'player',
    techniqueId,
    attackType: tech.type,
    outcome,
    damage: outcome === 'miss' ? 0 : damage,
    elementMult,
    hitChance: hitP,
    critChance: critP,
    chakra,
  });
  if (outcome === 'miss') return { outcome, dealt: 0 };
  return { outcome, dealt: hurtVillain(s, damage) };
}

function playerAttack(s: BattleState, techId: string, rng: Rng, data: GameData): void {
  const { balance } = data;
  const p = s.player;
  const v = s.villain;
  const fx = s.playerFx;
  const base = playerCombatTech(s, techId, data);
  p.chakra -= base.chakraCost;

  if (confusionFails(s, 'player', selfHitDamage(s, 'player', base, data), rng, data)) return;

  // Clones das Sombras: o ataque vira 3× os golpes, cada um com 40% do dano.
  let tech = base;
  let factor = 1;
  if (fx.clonesArmed) {
    fx.clonesArmed = false;
    tech = { ...base, hits: base.hits * balance.shadowClones.hitsMult };
    factor = balance.shadowClones.damagePct;
  }

  s.log.push({ type: 'declare', side: 'player', techniqueId: tech.id, attackType: tech.type, element: tech.element, chakra: tech.chakraCost });
  // Reação do vilão: disputa e barreira usam a técnica inteira (com os clones já aplicados).
  const incoming: IncomingAttack = { attacker: 'player', techniqueId: tech.id, type: tech.type, element: tech.element, hits: tech.hits, charged: false };
  const reactionTech = factor === 1 ? tech : { ...tech, baseDamage: Math.max(1, Math.floor(tech.baseDamage * factor)) };
  const reaction = performReaction(s, 'player', reactionTech, false, chooseVillainReaction(s, incoming, rng, data), rng, data);
  if (reaction.kind === 'resolved' || s.status !== 'ongoing') return;

  // Ataque múltiplo: acerto e crítico rolam uma vez, no primeiro golpe, e valem para todos.
  let rolled: HitOutcome | undefined;
  for (let i = 0; i < tech.hits && s.status === 'ongoing'; i++) {
    const { outcome } = playerStrike(s, tech, tech.id, factor, i === 0 ? tech.chakraCost : 0, reaction.guard, rng, data, rolled);
    rolled = outcome;
    if (s.status !== 'ongoing') return;
    if (outcome === 'miss') break;
    // Selo dos Pontos Vitais e Colmeia (Aburame): drenam o chakra do vilão.
    const drain = (data.techniquesById[techId]?.chakraDrain ?? 0) + (p.passive === 'hive' ? balance.passives.hive.chakraDrainPerHit : 0);
    if (drain > 0) {
      const amount = Math.min(v.chakra, drain);
      v.chakra -= amount;
      if (amount > 0) s.log.push({ type: 'chakraDrain', amount, source: data.techniquesById[techId]?.chakraDrain ? 'seal' : 'hive' });
    }
    // Cobra: um golpe que acerta envenena (ou faz o veneno crescer).
    const bonus = snakePoisonBonus(p, data);
    if (bonus !== null) applyPoison(s, 'villain', bonus, data);
    applyElementalHit(s, 'villain', tech.element, outcome, data);
    applyOnHit(s, 'villain', tech, rng, data);
  }

  // Dupla (Inuzuka): depois de um ataque que acerta, o cão pode atacar também.
  if (rolled !== undefined && rolled !== 'miss' && s.status === 'ongoing' && p.passive === 'duo') {
    const cfg = balance.passives.duo;
    if (chance(cfg.chance, rng)) {
      const dog: CombatTech = {
        id: DOG_ATTACK,
        type: 'taijutsu',
        element: null,
        baseDamage: Math.floor(tech.baseDamage * cfg.damagePct),
        hits: 1,
        chakraCost: 0,
      };
      playerStrike(s, dog, DOG_ATTACK, 1, 0, reaction.guard, rng, data);
    }
  }
}

// ---------------------------------------------------------------------------
// Vilão

/** Técnicas que o vilão pode usar no turno: chakra suficiente, condição de HP (cura); barreiras não. */
function villainOptions(s: BattleState): VillainTechnique[] {
  const v = s.villain;
  return v.def.techniques.filter(
    (t) =>
      t.barrier === undefined &&
      t.chakraCost <= v.chakra &&
      (t.useBelowHpPct === undefined || v.hp < v.def.hp * t.useBelowHpPct),
  );
}

/** Sorteia a próxima ação do vilão pelos pesos, entre as que ele pode usar. */
function rollIntent(s: BattleState, rng: Rng): VillainIntent {
  const options = villainOptions(s);
  if (options.length === 0) return { kind: 'rest' };
  const tech = spin(
    options.map((t) => ({ label: t.id, weight: t.weight, value: t })),
    rng,
  ).slice.value;
  return { kind: 'technique', id: tech.id };
}

/** Uma ação do vilão. Devolve true se a rodada parou esperando a reação do jogador. */
function villainAction(s: BattleState, rng: Rng, data: GameData, react?: ReactionPolicy): boolean {
  const v = s.villain;

  // Golpe carregado anunciado na vez anterior: sai agora.
  if (v.charging) {
    const tech = villainTech(s, v.charging);
    v.charging = null;
    v.intent = null;
    s.log.push({ type: 'chargeRelease', techniqueId: tech.id });
    return villainAttack(s, tech, true, 0, rng, data, react);
  }

  // A intenção sorteada antes vale se ainda puder ser usada (o tormento pode ter drenado o chakra).
  const options = villainOptions(s);
  const planned = v.intent;
  v.intent = null;
  const plannedId = planned?.kind === 'technique' ? planned.id : null;
  const stillValid = planned !== null && (plannedId ? options.some((t) => t.id === plannedId) : options.length === 0);
  const intent = stillValid ? planned : rollIntent(s, rng);
  if (intent.kind === 'rest') {
    const gained = Math.min(v.def.chakra - v.chakra, restChakraFor(v.def.chakra, data));
    v.chakra += gained;
    s.log.push({ type: 'villainRest', chakra: gained });
    return false;
  }
  const tech = villainTech(s, intent.id);
  v.chakra -= tech.chakraCost;

  if (tech.healPct) {
    if (confusionFails(s, 'villain', 0, rng, data)) return false;
    s.log.push({ type: 'villainHeal', techniqueId: tech.id, healed: heal(s, 'villain', tech.healPct) });
    return false;
  }
  if (v.def.behavior?.charged === tech.id) {
    v.charging = tech.id;
    s.log.push({ type: 'charge', techniqueId: tech.id, chakra: tech.chakraCost });
    return false;
  }
  return villainAttack(s, tech, false, tech.chakraCost, rng, data, react);
}

/**
 * Ataque do vilão até a reação do jogador. Genjutsu só admite Resistir. Com a interface escolhendo
 * (`interactive`) e mais de uma reação possível, guarda o ataque em `pending` e devolve true.
 */
function villainAttack(
  s: BattleState,
  tech: VillainTechnique,
  charged: boolean,
  chakra: number,
  rng: Rng,
  data: GameData,
  react?: ReactionPolicy,
): boolean {
  const fx = s.playerFx;
  const combat = villainCombatTech(s, tech);

  if (confusionFails(s, 'villain', selfHitDamage(s, 'villain', combat, data), rng, data)) return false;
  s.log.push({ type: 'declare', side: 'villain', techniqueId: tech.id, attackType: tech.type, element: combat.element, chakra });

  // Esquiva preparada (Bomba de fumaça): vale para o próximo ataque recebido.
  if (fx.dodge) {
    const dodge = fx.dodge;
    fx.dodge = null;
    if (chance(dodge.chance, rng)) {
      s.log.push({ type: 'dodge', source: dodge.source });
      return false;
    }
  }

  if (tech.type === 'genjutsu') {
    villainGenjutsu(s, tech, chakra, rng, data);
    return false;
  }

  const incoming: IncomingAttack = { attacker: 'villain', techniqueId: tech.id, type: tech.type, element: combat.element, hits: combat.hits, charged };
  const options = playerReactionOptions(s, incoming, data);
  let choice: ReactionChoice | 'passive';
  if (options.length === 0) choice = 'passive';
  else if (react) choice = react(s, incoming, options, data);
  else if (s.options.interactive && options.length > 1) {
    s.pending = { incoming, options, chakra };
    return true;
  } else choice = 'resist';
  resolveVillainAttack(s, tech, charged, chakra, choice, rng, data);
  return false;
}

/** Genjutsu do vilão: sem dano; o ataque de genjutsu dele contra a resistência mental usada pelo jogador. */
function villainGenjutsu(s: BattleState, tech: VillainTechnique, chakra: number, rng: Rng, data: GameData): void {
  const { balance } = data;
  if (genjutsuImmune(s, 'player', data)) {
    s.log.push({ type: 'genjutsuImmune', target: 'player' });
    return;
  }
  s.log.push({ type: 'reaction', side: 'player', kind: canReact(s, 'player') ? 'resist' : 'passive', techniqueId: null, chakra: 0 });
  const mindReading = s.player.passive === 'mindReading' ? balance.passives.mindReading.villainHitPenalty : 0;
  const penalty = stunPenalty(s.villain.fx, data) + mindReading;
  const power = villainOffense(s, 'genjutsu');
  const defense = playerMentalDefense(s, data);
  const hitP = clamp(genjutsuHitChance(power, defense, balance.genjutsuHit) - penalty, 0, 1);
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
    chakra,
  });
  if (outcome !== 'miss') applyMental(s, 'player', 'prison', genjutsuTurns(power, defense, tech.mentalTurns ?? 1, data), data);
}

/** Resolve o ataque do vilão com a reação do jogador já escolhida. */
function resolveVillainAttack(
  s: BattleState,
  tech: VillainTechnique,
  charged: boolean,
  chakra: number,
  choice: ReactionChoice | 'passive',
  rng: Rng,
  data: GameData,
): void {
  const combat = villainCombatTech(s, tech);
  const reaction = performReaction(s, 'villain', combat, charged, choice, rng, data);
  if (reaction.kind === 'resolved' || s.status !== 'ongoing') return;
  // Ataque múltiplo: acerto e crítico rolam uma vez, no primeiro golpe, e valem para todos.
  let rolled: HitOutcome | undefined;
  for (let i = 0; i < combat.hits && s.status === 'ongoing'; i++) {
    rolled = villainStrike(s, combat, charged, i === 0 ? chakra : 0, reaction.guard, rng, data, rolled);
    if (rolled === 'miss') break;
  }
}

function villainStrike(
  s: BattleState,
  tech: CombatTech,
  charged: boolean,
  chakra: number,
  guard: Guard,
  rng: Rng,
  data: GameData,
  rolled?: HitOutcome,
): HitOutcome {
  const v = s.villain;
  const { balance } = data;
  const p = s.player;
  const fx = s.playerFx;
  const passive = v.def.passive;

  const mindReading = p.passive === 'mindReading' ? balance.passives.mindReading.villainHitPenalty : 0;
  const penalty = stunPenalty(v.fx, data) + mindReading;
  const hitP = hitChance(tech.accuracy, -penalty, balance.hit);
  const scalpelCrit = passive?.kind === 'scalpel' ? passive.critBonus : 0;
  // Golpe carregado não pode ser crítico.
  const critP = charged ? 0 : critChance(v.def.critBonus + scalpelCrit, balance.crit, hitP);
  let outcome: HitOutcome;
  if (rolled) {
    outcome = rolled;
  } else if (v.fx.guaranteedCrit && !charged) {
    v.fx.guaranteedCrit = false;
    s.log.push({ type: 'guaranteedCrit', side: 'villain' });
    outcome = 'crit';
  } else {
    outcome = rollHit(hitP, critP, rng);
  }
  const bleedMult = tech.blade && fx.bleeding ? balance.status.bleed.bladeDamageMult : 1;
  const chargedMult = charged ? balance.charged.damageMult : 1;
  const critMult = outcome === 'crit' ? balance.crit.multiplier : 1;
  let { damage, elementMult } = strikeDamage(s, 'villain', tech, guard, critMult, bleedMult * chargedMult, data);
  if (outcome !== 'miss') {
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
    damage: outcome === 'miss' ? 0 : damage,
    elementMult,
    hitChance: hitP,
    critChance: critP,
    chakra,
  });
  if (outcome === 'miss') return outcome;

  hurtPlayer(s, damage, data);
  if (s.status !== 'ongoing') return outcome;
  // Cobra do Orochimaru: acertos envenenam.
  if (passive?.kind === 'insane') applyPoison(s, 'player', passive.snakeBonus, data);
  // Sangramento: crítico de espada ou do bisturi, ou todo acerto (Kabuto no hardcore, último suspiro do Zabuza).
  const bleedOnHit = (passive?.kind === 'scalpel' && passive.bleedOnHit) || (passive?.kind === 'mist' && v.lastStand);
  const bleedOnCrit = tech.blade === 'sword' || passive?.kind === 'scalpel';
  if (bleedOnHit || (bleedOnCrit && outcome === 'crit')) applyBleed(s, 'player');
  applyElementalHit(s, 'player', tech.element, outcome, data);
  return outcome;
}

/** HP 0: usa a Vontade do Fogo (restauração total, limpa os efeitos negativos) ou encerra a luta. */
function handleKnockout(s: BattleState): void {
  const p = s.player;
  if (s.options.allowRevive && p.revives > 0) {
    p.revives--;
    p.revivesUsed++;
    p.hp = p.maxHp;
    p.chakra = p.maxChakra;
    clearNegatives(s.playerFx);
    s.log.push({ type: 'revive', revivesLeft: p.revives });
    return;
  }
  finish(s, 'lost');
}
