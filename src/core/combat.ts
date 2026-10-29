import { damage as computeDamage } from './damage';
import { elementMultiplier } from './elements';
import type { GameData } from './gameData';
import { critChance, genjutsuHitChance, hitChance, rollHit, type HitOutcome } from './hit';
import { initiativeChance, rollInitiative } from './initiative';
import {
  BASIC_TAIJUTSU,
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
  | 'medical'
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
 * Reação a um ataque recebido (fundamentos.md#reações): Resistir (grátis), Substituição ou Disputa com um
 * ninjutsu de ataque (`clash:<id>`), que gasta a próxima ação. Barreiras são ações de turno (escudo).
 */
export type ReactionChoice = 'resist' | 'substitution' | `clash:${string}`;

export const clashReaction = (id: string): ReactionChoice => `clash:${id}`;

/** Id da técnica de uma reação de disputa (null para as outras). */
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
  /** Ativa o dōjutsu (Sharingan, Byakugan). */
  dojutsu?: boolean;
  /** Abre os portões (prodígio do taijutsu). */
  gates?: boolean;
  /** Expansão (Akimichi). */
  expansion?: boolean;
  /** Gênio (Nara): a próxima roleta do jogador gira duas vezes e fica com a melhor. */
  genius?: boolean;
}

export type Side = 'player' | 'villain';
export type BattleStatus = 'ongoing' | 'won' | 'lost';

/** Por que o lutador perdeu a vez. `reacted` = a ação foi gasta numa reação. */
export type SkipReason = 'prison' | 'sleep' | 'paralysis' | 'possession' | 'cower' | 'reacted';
/** Efeitos que aparecem como "status" na luta. */
export type StatusKind = 'stun' | 'burn' | 'poison' | 'bleed';
/** Efeitos que tiram a vez (anti-trava). */
export type DebilitateKind = 'prison' | 'sleep' | 'paralysis' | 'possession';

/** Como quem recebe o golpe usa a resistência: passiva (40%) ou Resistir (70%, 100% em postura). */
export type Guard = 'passive' | 'resist';

/** Envenenamento em curso: bônus da fonte e quantos tiques já causou. */
export interface PoisonState {
  bonus: number;
  ticks: number;
}

/**
 * Escudo de uma barreira (tecnicas.md#barreiras): pontos que absorvem o dano de taijutsu e ninjutsu
 * antes do HP, por algumas rodadas. O elemento do golpe contra o do escudo multiplica o dano nele.
 */
export interface ShieldState {
  techniqueId: string;
  element: Element | null;
  points: number;
  max: number;
  /** Rodadas restantes, contadas a partir da seguinte à que ergueu. */
  turns: number;
  round: number;
  /** Rotação: devolve esta fração do dano bloqueado a quem bateu. */
  reflectPct?: number;
  /** Muralha de Chamas: chance de queimar quem bate com taijutsu. */
  burnOnTouch?: number;
  /** Escudo de Vento: técnicas de vários golpes causam esta fração a menos no escudo. */
  multiHitResist?: number;
}

/** Estado de luta comum ao jogador e ao vilão. */
/**
 * Efeito mental valendo (efeitos.md#duração-dos-efeitos-mentais): não tem turnos fixos. Depois de cada
 * turno cumprido, o alvo gira para se livrar com uma chance que cresce com `served` e cai com `strength`.
 */
export interface MentalHold {
  strength: number;
  /** Turnos já cumpridos. */
  served: number;
}

export interface StatusFx {
  /** Aprisionado: perde a vez. */
  debilitated: MentalHold | null;
  /** Dormindo: perde a vez e acorda ao tomar dano. */
  asleep: MentalHold | null;
  /** Ações que o lutador ainda vai perder paralisado (crítico de raio). */
  paralyzed: number;
  /** Possuído (Yamanaka): perde a vez golpeando a si mesmo. */
  possessed: MentalHold | null;
  /** Ações que o lutador precisa fazer antes de poder perder a vez de novo. */
  debilitateImmunity: number;
  /** Tenacidade (0 a 1): a chance do próximo controle × (1 − tenacidade). Sobe ao ser controlado e cai por rodada. */
  tenacity: number;
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
  /** Pavor: ações com menos dano e menos resistência. */
  feared: MentalHold | null;
  /** Confusão: ações com chance de falhar (e de acertar a si mesmo). */
  confused: MentalHold | null;
  /** Tormento: rodadas perdendo chakra no início. */
  tormented: MentalHold | null;
  /** Rodadas restantes do manto (jinchuuriki, marca da maldição). */
  cloakTurns: number;
  cloakUsed: boolean;
  /** O próximo ataque é crítico garantido (Mizuki no hardcore). */
  guaranteedCrit: boolean;
  /** Gastou a próxima ação numa reação: perde o próximo turno. */
  owesAction: boolean;
  /** Substituições usadas nesta luta. */
  substitutionsUsed: number;
  /** Escudo de barreira ativo. */
  shield: ShieldState | null;
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
  /** Rodadas de portões que faltam (a da abertura conta). */
  gatesTurns: number;
  /** Sharingan/Byakugan ativado. */
  dojutsuActive: boolean;
  dojutsuTurns: number;
  dojutsuRound: number;
  /** Expansão (Akimichi): rodadas que faltam (a da ativação conta). */
  expansionTurns: number;
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
  /** Usos do Gênio nesta luta e se ele está armado para a próxima roleta. */
  geniusUsed: number;
  geniusArmed: boolean;
}

/** Próxima ação do vilão, sorteada no fim da rodada anterior (Gênio mostra). */
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

export type ReactionKind = 'passive' | 'resist' | 'substitution' | 'clash';

export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'ambush' }
  | { type: 'late' }
  | { type: 'focus' }
  | { type: 'geniusArmed' }
  /** Gênio: a roleta girou duas vezes; `kept` é o resultado que ficou. */
  | { type: 'genius'; results: [string, string]; kept: string }
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
  /** Barreira erguida: escudo de `points` pontos em `side`. */
  | { type: 'shield'; side: Side; techniqueId: string; points: number; chakra: number }
  /** O escudo de `side` absorveu dano (`elementMult`: encontro de elementos com o golpe). */
  | { type: 'shieldHit'; side: Side; absorbed: number; left: number; elementMult: number }
  | { type: 'shieldBreak'; side: Side }
  | { type: 'shieldEnd'; side: Side }
  | { type: 'shieldReflect'; side: Side; damage: number }
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
  /** Perdeu a vez: `turns` na paralisia; nos efeitos mentais, `escape` é a chance de se livrar após o 1º turno. */
  | { type: 'debilitate'; target: Side; kind: DebilitateKind; turns?: number; escape?: number }
  | { type: 'mental'; target: Side; effect: Exclude<MentalEffect, 'prison' | 'sleep' | 'possession'>; escape: number }
  /** O alvo se livrou do efeito mental na roleta de fuga. */
  | { type: 'mentalBroken'; side: Side; effect: MentalEffect }
  /** Possuído: perdeu a vez golpeando a si mesmo com a própria técnica. */
  | { type: 'possessed'; side: Side; techniqueId: string; damage: number }
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
    debilitated: null,
    asleep: null,
    paralyzed: 0,
    possessed: null,
    debilitateImmunity: 0,
    tenacity: 0,
    stunned: 0,
    burn: 0,
    burnTicks: 0,
    burnUnlocked: false,
    poison: null,
    bleeding: false,
    feared: null,
    confused: null,
    tormented: null,
    cloakTurns: 0,
    cloakUsed: false,
    guaranteedCrit: false,
    owesAction: false,
    substitutionsUsed: 0,
    shield: null,
  };
}

/**
 * Começa a luta. HP e chakra seguem como estão (a luta não começa restaurada), salvo `restore: true`.
 * Com `rng`, a primeira intenção do vilão já fica sorteada (Gênio mostra na 1ª rodada).
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
      dojutsuActive: false,
      dojutsuTurns: 0,
      dojutsuRound: 0,
      expansionTurns: 0,
      clonesArmed: false,
      armorTurns: 0,
      armorRound: 0,
      stance: false,
      dodge: null,
      focusUsed: 0,
      focusArmed: false,
      geniusUsed: 0,
      geniusArmed: false,
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
  if (isIllusion(tech)) return { ...tech, element: null };
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

/** Ilusão de dano: genjutsu com dano base (rola o acerto do genjutsu e fere contra a resistência mental). */
export function isIllusion(tech: TechniqueDef): boolean {
  return tech.type === 'genjutsu' && tech.baseDamage > 0;
}

/** Barreira: ação de turno que ergue um escudo. */
export function isBarrier(tech: { barrier?: number }): boolean {
  return tech.barrier !== undefined;
}

/** Técnicas de ação do skill set (tai, nin e gen, inclusive barreiras), na ordem das categorias. Médico fica de fora. */
export function attackTechniques(player: PlayerState, data: GameData): TechniqueDef[] {
  return knownTechniques(player, data).filter((t) => techniqueSlot(t) !== 'medical');
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

/** Ativas de linhagem que são escolhas grátis da rodada (não gastam o turno). */
export type FreeActive = 'clones' | 'dojutsu' | 'gates' | 'expansion';

/** Chakra que a ativa grátis custa (null = o jogador não a tem ou não pode usá-la agora). */
export function freeActiveCost(s: BattleState, kind: FreeActive, data: GameData): number | null {
  const p = s.player;
  const fx = s.playerFx;
  switch (kind) {
    case 'clones':
      return p.active === 'shadowClones' && !fx.clonesArmed ? data.balance.shadowClones.chakraCost : null;
    case 'dojutsu':
      return fx.dojutsuActive ? null : dojutsuActivationCost(p, data);
    case 'gates':
      return fx.gatesUsed ? null : (gatesToOpen(p, data)?.chakraCost ?? null);
    case 'expansion':
      return p.active === 'expansion' && fx.expansionTurns === 0 ? data.balance.expansion.chakraCost : null;
  }
}

const FREE_ACTIVES: FreeActive[] = ['dojutsu', 'gates', 'expansion', 'clones'];

/** Chakra das ativas grátis já escolhidas em `ex`. */
function chosenActivesCost(s: BattleState, ex: RoundExtras, data: GameData): number {
  return FREE_ACTIVES.reduce((sum, k) => sum + (ex[k] ? (freeActiveCost(s, k, data) ?? 0) : 0), 0);
}

/**
 * A ativa grátis pode ser usada junto com esta ação: há chakra para ela, para a ação e para as
 * outras ativas já escolhidas em `chosen`.
 */
export function canFreeActive(s: BattleState, kind: FreeActive, action: PlayerAction, data: GameData, chosen: RoundExtras = {}): boolean {
  const cost = freeActiveCost(s, kind, data);
  if (cost === null) return false;
  const others = chosenActivesCost(s, { ...chosen, [kind]: false }, data);
  return s.player.chakra >= cost + others + actionCost(s, action, data);
}

/** Os Clones das Sombras podem ser armados junto com esta ação (chakra para os dois). */
export function canClones(s: BattleState, action: PlayerAction, data: GameData, chosen: RoundExtras = {}): boolean {
  return canFreeActive(s, 'clones', action, data, chosen);
}

/** Chakra que a ação gasta. */
export function actionCost(s: BattleState, action: PlayerAction, data: GameData): number {
  const p = s.player;
  const techId = actionTechniqueId(action);
  if (techId) return leveledTechnique(p, techId, data).chakraCost;
  if (action === 'medical') return playerMedical(p, data)?.chakraCost ?? 0;
  return 0;
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
  return s.playerFx.expansionTurns > 0;
}

/** Pavor: o lado apavorado tem as resistências multiplicadas por `fear.resistanceMult`. */
function fearResistanceMult(fx: StatusFx, data: GameData): number {
  return fx.feared ? data.balance.status.fear.resistanceMult : 1;
}

/**
 * Resistência total do jogador (manto ×1,25; Armadura de Raio ×1,3 na física; pavor). `ignoreArmor`: o
 * vento ignora o bônus da armadura.
 */
export function playerResistance(s: BattleState, kind: ResistanceKind, data: GameData, ignoreArmor = false): number {
  let value = s.player.resistance[kind] * (playerCloak(s, data)?.resistanceMult ?? 1) * fearResistanceMult(s.playerFx, data);
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

/** Resistência total do vilão: multiplicador da passiva, manto ativo e pavor. */
export function villainResistance(s: BattleState, kind: ResistanceKind, data: GameData): number {
  const cloak = villainCloak(s);
  const base = s.villain.def.resistance[kind] * fearResistanceMult(s.villain.fx, data);
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
  if (v.fx.feared) mult *= data.balance.status.fear.damageMult;
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

/** Perde a vez agora (aprisionado, dormindo ou paralisado): recebe o golpe com dano extra. */
export function isControlled(fx: StatusFx): boolean {
  return fx.debilitated !== null || fx.asleep !== null || fx.paralyzed > 0 || fx.possessed !== null;
}

/** Multiplicador da chance de um controle contra o alvo: 1 − tenacidade. */
export function controlChanceMult(fx: StatusFx): number {
  return 1 - fx.tenacity;
}

/** Efeito mental que tira a vez (sofre a tenacidade). */
export function isControlEffect(effect: MentalEffect): boolean {
  return effect === 'prison' || effect === 'sleep' || effect === 'possession';
}

function stunPenalty(fx: StatusFx, data: GameData): number {
  return fx.stunned > 0 ? data.balance.status.stun.hitPenalty : 0;
}

/** O lutador pode reagir: não está aprisionado, dormindo, paralisado nem acovardado. */
export function canReact(s: BattleState, side: Side): boolean {
  const fx = fxOf(s, side);
  if (side === 'villain' && s.villain.cowering) return false;
  return !isControlled(fx);
}

/**
 * Fração da resistência usada. Passiva: 40%. Resistir: 70%; 100% em postura defensiva e, contra
 * taijutsu, com o Corpo de ferro (prodígio do taijutsu).
 */
export function guardFraction(
  s: BattleState,
  side: Side,
  guard: Guard,
  kind: ResistanceKind,
  data: GameData,
  attackType?: AttackType,
): number {
  const cfg = data.balance.resistance;
  if (guard === 'passive') return cfg.passive;
  if (side === 'player') {
    if (s.playerFx.stance) return cfg.stance;
    if (kind === 'physical' && attackType === 'taijutsu' && s.player.passive === 'ironBody') return cfg.stance;
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
 * Força de um efeito mental que acerta: força base da técnica + a vantagem do poder do atacante sobre a
 * resistência usada pelo alvo, a cada `pointsPerStrength` (sem arredondar). O Sono soma `sleepStrengthBonus`.
 */
export function mentalStrength(power: number, targetResistance: number, baseStrength: number, effect: MentalEffect, data: GameData): number {
  const sleep = effect === 'sleep' ? data.balance.status.sleepStrengthBonus : 0;
  return baseStrength + Math.max(0, power - targetResistance) / data.balance.mentalHold.pointsPerStrength + sleep;
}

/**
 * Chance de se livrar depois do `served`-ésimo turno cumprido (1, 2, 3...): a inicial cai com a força e
 * cresce com o quadrado dos turnos, mais devagar quanto mais forte. Sempre chega a 100%.
 */
export function mentalEscapeChance(strength: number, served: number, data: GameData): number {
  const cfg = data.balance.mentalHold;
  const initial = clamp(cfg.escapeBase - cfg.escapePerStrength * (strength - 1), cfg.escapeMin, 1);
  return Math.min(1, initial + (cfg.escapeGrowth / Math.max(1, strength)) * (served - 1) ** 2);
}

/** Duração média (em turnos) de um efeito mental com essa força. */
export function expectedMentalTurns(strength: number, data: GameData): number {
  let stays = 1;
  let total = 0;
  for (let served = 1; stays > 1e-9; served++) {
    total += stays;
    stays *= 1 - mentalEscapeChance(strength, served, data);
  }
  return total;
}

/** Status que a técnica mental usa (genjutsu, ou ninjutsu na Imitação de Sombra). */
function mentalStat(tech: TechniqueDef): AttackType {
  return tech.mentalStat ?? 'genjutsu';
}

/** Resistência que o vilão opõe ao efeito mental: mental contra genjutsu, física contra a Imitação de Sombra. */
function villainMentalDefense(s: BattleState, tech: TechniqueDef, data: GameData): number {
  const kind: ResistanceKind = mentalStat(tech) === 'genjutsu' ? 'mental' : 'physical';
  return villainResistance(s, kind, data) * guardFraction(s, 'villain', defaultGuard(s, 'villain'), kind, data);
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

/** Força do efeito mental do jogador no vilão, se acertar. */
export function playerMentalStrength(s: BattleState, techniqueId: string, data: GameData): number {
  const tech = playerTechnique(s.player, techniqueId, data);
  const power = playerGenjutsuPower(s, techniqueId, data);
  return mentalStrength(power, villainMentalDefense(s, tech, data), tech.mentalStrength ?? 1, tech.mental ?? 'prison', data);
}

/** Chance de o efeito mental do jogador pegar (0 contra alvo imune a genjutsu). */
export function playerGenjutsuHitChance(s: BattleState, data: GameData, techniqueId?: string): number {
  const tech = techniqueId ? data.techniquesById[techniqueId] : undefined;
  // Imitação de Sombra: é ninjutsu, rola a precisão da técnica e funciona em jinchuuriki.
  // Controles (perder a vez) sofrem a tenacidade do alvo.
  const tenacity = tech?.mental && isControlEffect(tech.mental) ? controlChanceMult(s.villain.fx) : 1;
  if (tech && tech.type !== 'genjutsu') {
    return hitChance(tech.accuracy, -stunPenalty(s.playerFx, data), data.balance.hit) * tenacity;
  }
  if (genjutsuImmune(s, 'villain', data)) return 0;
  const cfg = data.balance.genjutsuHit;
  const bonus = activeSharingan(s, data)?.genjutsuHit ?? 0;
  const defense = villainResistance(s, 'mental', data) * guardFraction(s, 'villain', defaultGuard(s, 'villain'), 'mental', data);
  const base = genjutsuHitChance(effectiveOffense(s, 'genjutsu', data), defense, cfg);
  return clamp(base + bonus - stunPenalty(s.playerFx, data), 0, 1) * tenacity;
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
    if (fx.gatesTurns > 0 && fx.gatesStage > 0) {
      mult *= data.balance.gates.stages[fx.gatesStage - 1]!.taijutsuMult;
    }
    if (byakuganActive(s)) mult *= data.balance.dojutsu.byakugan.taijutsuMult;
    if (expansionActive(s)) mult *= data.balance.expansion.taijutsuMult;
    if (p.passive === 'heavyBody') {
      const cfg = data.balance.passives.heavyBody;
      mult *= cfg.base + cfg.perHpPct * (p.hp / p.maxHp);
    }
  }
  if (fx.feared) mult *= data.balance.status.fear.damageMult;
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
  const resistance = defender === 'player' ? playerResistance(s, 'physical', data, ignoreArmor) : villainResistance(s, 'physical', data);
  const offense = attacker === 'player' ? effectiveOffense(s, tech.type, data) : villainOffense(s, tech.type);
  const sideMult = attacker === 'player' ? playerDamageMult(s, tech.type, data) : villainDamageMult(s, data);
  // Alvo que perdeu a vez (aprisionado, dormindo, paralisado) recebe mais dano.
  const vulnerable = isControlled(fxOf(s, defender)) ? data.balance.control.vulnerableDamageMult : 1;
  return {
    damage: computeDamage({
      baseDamage: tech.baseDamage,
      offense,
      resistance,
      fraction: guardFraction(s, defender, guard, 'physical', data, tech.type),
      penetration: attacker === 'player' ? playerPenetration(s, tech, data) : villainPenetration(s, data),
      elementMult,
      critMult,
      extraMult: sideMult * extraMult * vulnerable,
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

/** Usos do Gênio por luta: base + 1 por nível de `extraUseLevels` já alcançado. 0 = não é Nara. */
export function geniusUses(player: PlayerState, data: GameData): number {
  if (player.passive !== 'genius') return 0;
  const cfg = data.balance.passives.genius;
  return cfg.uses + cfg.extraUseLevels.filter((lv) => player.level >= lv).length;
}

/** O Gênio pode ser armado nesta rodada. */
export function canGenius(s: BattleState, data: GameData): boolean {
  return !s.playerFx.geniusArmed && s.playerFx.geniusUsed < geniusUses(s.player, data);
}

/**
 * Roleta do jogador: com o Gênio armado, gira duas vezes e fica com o melhor resultado (`rank` maior)
 * e desarma; sem ele, gira uma vez.
 */
function playerRoll<T>(s: BattleState, roll: () => T, rank: (value: T) => number): T {
  if (!s.playerFx.geniusArmed) return roll();
  s.playerFx.geniusArmed = false;
  const a = roll();
  const b = roll();
  const kept = rank(b) > rank(a) ? b : a;
  s.log.push({ type: 'genius', results: [String(a), String(b)], kept: String(kept) });
  return kept;
}

const HIT_RANK: Record<HitOutcome, number> = { miss: 0, hit: 1, crit: 2 };

/** O dōjutsu pode ser ativado junto com esta ação (chakra para os dois). */
export function canDojutsuExtra(s: BattleState, action: PlayerAction, data: GameData, chosen: RoundExtras = {}): boolean {
  return canFreeActive(s, 'dojutsu', action, data, chosen);
}

export function availableActions(state: BattleState, data: GameData): PlayerAction[] {
  const p = state.player;
  const fx = state.playerFx;
  // A ação já foi gasta numa reação: o turno passa.
  if (fx.owesAction) return ['pass'];
  const actions: PlayerAction[] = [];
  for (const tech of attackTechniques(p, data)) {
    if (tech.state && fx.armorTurns > 0) continue;
    if (isBarrier(tech) && fx.shield) continue;
    if (canUseTechnique(state, tech, data)) actions.push(techAction(tech.id));
  }
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
    if (incoming.type === 'ninjutsu' && tech.type === 'ninjutsu' && dealsDamage(tech)) options.push(clashReaction(tech.id));
  }
  return options;
}

/** Ninjutsu de ataque que o vilão pode pagar agora para disputar. */
function villainClashTechs(s: BattleState, incoming: IncomingAttack): VillainTechnique[] {
  const v = s.villain;
  if (incoming.type !== 'ninjutsu') return [];
  return v.def.techniques.filter((t) => t.chakraCost <= v.chakra && t.type === 'ninjutsu' && t.baseDamage > 0 && !isBarrier(t) && !t.healPct);
}

/** Reação do vilão: sorteada pelos pesos de `reactions`, só entre as possíveis (Resistir sempre). */
function chooseVillainReaction(s: BattleState, incoming: IncomingAttack, rng: Rng, data: GameData): ReactionChoice | 'passive' {
  if (!canReact(s, 'villain')) return 'passive';
  const v = s.villain;
  const weights = v.def.reactions ?? { resist: 1 };
  if (incoming.type === 'genjutsu') return 'resist';
  // Devendo a ação, só a Substituição (que não gasta ação) continua no sorteio.
  const clash = v.fx.owesAction ? [] : villainClashTechs(s, incoming);
  const kinds: { label: string; weight: number; value: 'resist' | 'clash' | 'substitution' }[] = [
    { label: 'resist', weight: weights.resist, value: 'resist' },
  ];
  if (weights.clash && clash.length) kinds.push({ label: 'clash', weight: weights.clash, value: 'clash' });
  if (weights.substitution && canSubstitute(s, 'villain', data)) {
    kinds.push({ label: 'substitution', weight: weights.substitution, value: 'substitution' });
  }
  if (kinds.length === 1) return 'resist';
  const kind = spin(kinds, rng).slice.value;
  if (kind === 'resist' || kind === 'substitution') return kind;
  const tech = clash.length === 1 ? clash[0]! : spin(clash.map((t) => ({ label: t.id, weight: Math.max(1, t.weight), value: t })), rng).slice.value;
  return clashReaction(tech.id);
}

/** Ficha da técnica de disputa de quem defende. */
function defenderTech(s: BattleState, side: Side, techniqueId: string, data: GameData): CombatTech {
  return side === 'player' ? playerCombatTech(s, techniqueId, data) : villainCombatTech(s, villainTech(s, techniqueId));
}

/** Poder na disputa: dano × golpes + ninjutsu × 0,5; Rasengan +25%; golpe carregado ×2. */
function clashPower(s: BattleState, side: Side, tech: CombatTech, charged: boolean, data: GameData): number {
  const ninjutsu = side === 'player' ? effectiveOffense(s, 'ninjutsu', data) : villainOffense(s, 'ninjutsu');
  let power = tech.baseDamage * tech.hits + ninjutsu * data.balance.clash.statFactor;
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
 * Poderes dos dois lados na disputa. Só a vantagem elemental multiplica (×1,5): a desvantagem não
 * reduz, para um jutsu básico com vantagem não anular um grande.
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
  attackPower *= edge(elementMultiplier(atk.element, def.element, data.beats, cfg));
  let defensePower = clashPower(s, other(attacker), def, false, data);
  defensePower *= edge(elementMultiplier(def.element, atk.element, data.beats, cfg));
  return { attackPower, defensePower };
}

/** Prévia de uma reação do jogador ao ataque pendente (a UI mostra as chances). */
export type ReactionPreview =
  | { kind: 'resist'; fraction: number }
  | { kind: 'substitution'; chance: number; usesLeft: number }
  | { kind: 'clash'; attackPower: number; defensePower: number; odds: [number, number, number] };

export function reactionPreview(s: BattleState, incoming: IncomingAttack, choice: ReactionChoice, data: GameData): ReactionPreview {
  if (choice === 'resist') {
    const kind: ResistanceKind = incoming.type === 'genjutsu' ? 'mental' : 'physical';
    return { kind: 'resist', fraction: guardFraction(s, 'player', 'resist', kind, data, incoming.type) };
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

/** Ergue o escudo de uma barreira em `side` (substitui um escudo anterior). */
function raiseShield(
  s: BattleState,
  side: Side,
  tech: { id: string; barrier?: number; reflectPct?: number; burnOnBreakAttempt?: number; multiHitBonus?: number },
  element: Element | null,
  chakra: number,
  data: GameData,
): void {
  const points = tech.barrier ?? 0;
  fxOf(s, side).shield = {
    techniqueId: tech.id,
    element,
    points,
    max: points,
    turns: data.balance.barrier.turns,
    round: s.round,
    ...(tech.reflectPct ? { reflectPct: tech.reflectPct } : {}),
    ...(tech.burnOnBreakAttempt ? { burnOnTouch: tech.burnOnBreakAttempt } : {}),
    ...(tech.multiHitBonus ? { multiHitResist: tech.multiHitBonus } : {}),
  };
  s.log.push({ type: 'shield', side, techniqueId: tech.id, points, chakra });
}

/**
 * Escudo de `owner` recebe o golpe: o dano no escudo é × o encontro de elementos (raio contra terra ×2;
 * Escudo de Vento aguenta mais contra vários golpes). Devolve o dano que passa para o HP.
 * Rotação devolve parte do bloqueado; Muralha de Chamas pode queimar quem bate com taijutsu;
 * Parede d'Água que absorve fogo apaga a queimadura de quem a ergueu.
 */
function shieldAbsorb(s: BattleState, owner: Side, damage: number, atk: CombatTech, rng: Rng, data: GameData): number {
  const fx = fxOf(s, owner);
  const sh = fx.shield;
  if (!sh || damage <= 0) return damage;
  let mult = elementMultiplier(atk.element, sh.element, data.beats, data.balance.elements, true);
  if (sh.multiHitResist && atk.hits > 1) mult *= 1 - sh.multiHitResist;
  const load = damage * mult;
  const absorbed = Math.min(sh.points, Math.ceil(load));
  sh.points -= absorbed;
  const passes = Math.max(0, Math.floor((load - absorbed) / mult));
  s.log.push({ type: 'shieldHit', side: owner, absorbed, left: sh.points, elementMult: mult });
  const attacker = other(owner);
  if (sh.element === 'water' && atk.element === 'fire') extinguish(s, owner);
  if (sh.burnOnTouch && atk.type === 'taijutsu' && fxOf(s, attacker).burn === 0 && chance(sh.burnOnTouch, rng)) {
    igniteBurn(s, attacker, data.balance.status.burn.turns);
  }
  if (sh.points <= 0) {
    fx.shield = null;
    s.log.push({ type: 'shieldBreak', side: owner });
  }
  if (sh.reflectPct) {
    const reflected = Math.floor((damage - passes) * sh.reflectPct);
    if (reflected > 0) {
      s.log.push({ type: 'shieldReflect', side: owner, damage: reflected });
      hurt(s, attacker, reflected, data);
    }
  }
  return passes;
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
  const slices = [
    { label: 'attacker', weight: odds[0], value: 'attacker' as const },
    { label: 'cancel', weight: odds[1], value: 'cancel' as const },
    { label: 'defender', weight: odds[2], value: 'defender' as const },
  ];
  // Gênio: o jogador fica com o resultado melhor para ele (vencer > anular > perder).
  const playerRank = { attacker: attacker === 'player' ? 2 : 0, cancel: 1, defender: attacker === 'player' ? 0 : 2 };
  const result = playerRoll(s, () => spin(slices, rng).slice.value, (r) => playerRank[r]);
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
  const [winner, tech, loserTech] = result === 'attacker' ? [attacker, atk, def] : [defender, def, atk];
  const loser = other(winner);
  const fireBonus = tech.element === 'fire' && loserTech.element === 'wind' ? data.balance.elements.fireAbsorbsWind : 1;
  const chargedMult = result === 'attacker' && charged ? data.balance.charged.damageMult : 1;
  const amount = wholeTechDamage(s, winner, tech, 'passive', passPct * fireBonus * chargedMult, data);
  s.log.push({ type: 'clashHit', target: loser, techniqueId: tech.id, damage: amount, passPct });
  hurt(s, loser, shieldAbsorb(s, loser, amount, tech, rng, data), data);
  if (s.status !== 'ongoing') return;
  if (s.status !== 'ongoing') return;
  applyElementalHit(s, loser, tech.element, 'hit', data, rng);
  if (tech.onHit) applyOnHit(s, loser, tech, rng, data);
}

/**
 * Aplica a reação de quem recebe o ataque. Devolve se o golpe ainda vai acontecer (e com qual guarda)
 * ou se a reação já resolveu tudo (esquiva, disputa).
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
  // Substituição não gasta ação; a disputa gasta a próxima.
  if (choice === 'substitution') {
    const cost = data.balance.substitution.chakraCost;
    spendChakra(s, defender, cost);
    fx.substitutionsUsed++;
    s.log.push({ type: 'reaction', side: defender, kind: 'substitution', techniqueId: null, chakra: cost });
    const p = substitutionChance(s, defender, data);
    const success = defender === 'player' ? playerRoll(s, () => chance(p, rng), (ok) => (ok ? 1 : 0)) : chance(p, rng);
    s.log.push({ type: 'substitutionRoll', side: defender, chance: p, success });
    return success ? { kind: 'resolved' } : { kind: 'strike', guard: 'passive' };
  }
  fx.owesAction = true;
  const def = defenderTech(s, defender, reactionTechniqueId(choice)!, data);
  spendChakra(s, defender, def.chakraCost);
  s.log.push({ type: 'reaction', side: defender, kind: 'clash', techniqueId: def.id, chakra: def.chakraCost });
  resolveClash(s, attacker, atk, charged, def, rng, data);
  return { kind: 'resolved' };
}

// ---------------------------------------------------------------------------
// Rodada

/**
 * Joga uma rodada: ordem (iniciativa rolada só na 1ª; prioridade passa na frente), ação de cada lado,
 * efeitos de fim de rodada e a próxima intenção do vilão.
 * `extras`: escolhas grátis (foco, Gênio e as ativas de linhagem). `true` = só o foco (atalho antigo).
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
  for (const k of FREE_ACTIVES) {
    if (ex[k] && !canFreeActive(prev, k, action, data, ex)) throw new Error(`Ativa indisponível: ${k}`);
  }
  if (ex.genius && !canGenius(prev, data)) throw new Error('Gênio indisponível');

  const s = structuredClone(prev);
  s.round++;
  s.log.push({ type: 'round', round: s.round });

  startOfRound(s, rng, data);
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
  if (ex.dojutsu) activateDojutsu(s, data);
  if (ex.gates) openGates(s, data);
  if (ex.expansion) activateExpansion(s, data);
  if (ex.genius) {
    s.playerFx.geniusUsed++;
    s.playerFx.geniusArmed = true;
    s.log.push({ type: 'geniusArmed' });
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
      playerTurn(s, plan.action, rng, data);
      plan.index++;
      continue;
    }
    const v = s.villain;
    if (!plan.villainStarted) {
      plan.villainStarted = true;
      if (consumeSkip(s, 'villain', rng, data)) {
        v.intent = null;
        endTurn(s, 'villain', false, rng, data);
        plan.index++;
        continue;
      }
    }
    if (plan.villainActions === 0) {
      if (villainAction(s, rng, data, react)) return;
      plan.villainActions++;
    }
    endTurn(s, 'villain', true, rng, data);
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
  if (fx.asleep) {
    fx.asleep = null;
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
function consumeSkip(s: BattleState, side: Side, rng: Rng, data: GameData): boolean {
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
  } else if (fx.asleep) {
    reason = 'sleep';
  } else if (fx.debilitated) {
    reason = 'prison';
  } else if (fx.possessed) {
    reason = 'possession';
  } else {
    return false;
  }
  s.log.push({ type: 'skip', side, reason });
  if (reason === 'possession') possessedSelfHit(s, side, data);
  if (reason !== 'paralysis') serveMental(s, side, MENTAL_SLOT[reason], rng, data);
  if (!isControlled(fx)) {
    fx.debilitateImmunity = data.balance.debilitated.immunityActions;
  }
  return true;
}

/** Possuído: golpeia a si mesmo com a técnica de dano mais forte, contra a própria resistência física passiva. */
function possessedSelfHit(s: BattleState, side: Side, data: GameData): void {
  let best: CombatTech | null = null;
  if (side === 'villain') {
    for (const t of s.villain.def.techniques) {
      if (t.baseDamage <= 0 || t.barrier !== undefined || t.healPct || t.type === 'genjutsu') continue;
      const c = villainCombatTech(s, t);
      if (!best || c.baseDamage * c.hits > best.baseDamage * best.hits) best = c;
    }
  } else {
    best = playerCombatTech(s, BASIC_TAIJUTSU, data);
  }
  if (!best) return;
  const damage = Math.floor(selfHitDamage(s, side, { ...best, baseDamage: best.baseDamage * best.hits }, data) * data.balance.status.possession.selfDamageMult);
  s.log.push({ type: 'possessed', side, techniqueId: best.id, damage });
  if (damage > 0) hurt(s, side, damage, data);
}

/** Fim da vez do lutador: conta a anti-trava e o atordoamento; o pavor e a confusão giram a fuga. */
function endTurn(s: BattleState, side: Side, acted: boolean, rng: Rng, data: GameData): void {
  const fx = fxOf(s, side);
  if (acted && fx.debilitateImmunity > 0) fx.debilitateImmunity--;
  if (fx.stunned > 0) fx.stunned--;
  serveMental(s, side, 'feared', rng, data);
  serveMental(s, side, 'confused', rng, data);
}

type MentalSlot = 'debilitated' | 'asleep' | 'possessed' | 'feared' | 'confused' | 'tormented';

const MENTAL_SLOT: Record<MentalEffect, MentalSlot> = {
  prison: 'debilitated',
  sleep: 'asleep',
  possession: 'possessed',
  fear: 'feared',
  confusion: 'confused',
  torment: 'tormented',
};

/** O efeito mental cumpriu mais um turno: o alvo gira a roleta para se livrar. */
function serveMental(s: BattleState, side: Side, slot: MentalSlot, rng: Rng, data: GameData): void {
  const fx = fxOf(s, side);
  const hold = fx[slot];
  if (!hold) return;
  hold.served++;
  if (!chance(mentalEscapeChance(hold.strength, hold.served, data), rng)) return;
  fx[slot] = null;
  const effect = (Object.keys(MENTAL_SLOT) as MentalEffect[]).find((e) => MENTAL_SLOT[e] === slot)!;
  s.log.push({ type: 'mentalBroken', side, effect });
}

/** Põe (ou renova) o efeito mental: fica a força maior e a contagem recomeça. */
function holdMental(fx: StatusFx, slot: MentalSlot, strength: number): MentalHold {
  const hold = { strength: Math.max(strength, fx[slot]?.strength ?? 0), served: 0 };
  fx[slot] = hold;
  return hold;
}

/**
 * Tira a vez do alvo. `amount` = turnos na paralisia, força nos efeitos mentais. Com `rng`, rola antes a
 * tenacidade (controles sem rolagem própria, como a paralisia do crítico de raio); os genjutsu já a
 * contam na chance de acerto. Pegou: soma tenacidade.
 */
function applyDebilitate(s: BattleState, target: Side, amount: number, kind: DebilitateKind, data: GameData, rng?: Rng): void {
  const fx = fxOf(s, target);
  if (fx.debilitateImmunity > 0 || (rng && fx.tenacity > 0 && !chance(controlChanceMult(fx), rng))) {
    s.log.push({ type: 'debilitateResisted', target });
    return;
  }
  // Só um controle novo soma tenacidade (renovar um que ainda está valendo não soma de novo).
  const cfg = data.balance.control;
  if (!isControlled(fx)) fx.tenacity = Math.min(cfg.maxTenacity, fx.tenacity + cfg.tenacityPerControl);
  if (kind === 'paralysis') {
    fx.paralyzed = Math.max(fx.paralyzed, amount);
    s.log.push({ type: 'debilitate', target, kind, turns: amount });
    return;
  }
  const hold = holdMental(fx, MENTAL_SLOT[kind], amount);
  s.log.push({ type: 'debilitate', target, kind, escape: mentalEscapeChance(hold.strength, 1, data) });
}

/** Aplica um efeito mental com a força calculada (`mentalStrength`). */
function applyMental(s: BattleState, target: Side, effect: MentalEffect, strength: number, data: GameData): void {
  if (effect === 'prison' || effect === 'sleep' || effect === 'possession') {
    applyDebilitate(s, target, strength, effect, data);
    return;
  }
  const hold = holdMental(fxOf(s, target), MENTAL_SLOT[effect], strength);
  s.log.push({ type: 'mental', target, effect, escape: mentalEscapeChance(hold.strength, 1, data) });
}

/**
 * Efeito de um acerto elemental no alvo. Crítico de raio paralisa; de vento, terra ou água atordoa;
 * de fogo queima. Queimando, todo acerto de fogo prolonga; depois de queimar uma vez, um acerto de
 * fogo comum reacende.
 */
function applyElementalHit(s: BattleState, target: Side, element: Element | null, outcome: HitOutcome, data: GameData, rng: Rng): void {
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
  if (element === 'lightning') applyDebilitate(s, target, cfg.paralysis.turns, 'paralysis', data, rng);
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
  fx.feared = null;
  fx.confused = null;
  fx.tormented = null;
  fx.debilitated = null;
  fx.asleep = null;
  fx.paralyzed = 0;
  fx.possessed = null;
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

function startOfRound(s: BattleState, rng: Rng, data: GameData): void {
  const p = s.player;
  const v = s.villain;
  const vPassive = v.def.passive;
  const { balance } = data;

  if (s.round === 1) {
    const start = v.def.startingShield ? v.def.techniques.find((t) => t.id === v.def.startingShield) : undefined;
    if (start) raiseShield(s, 'villain', start, villainTechElement(v.def, start), 0, data);
    if (vPassive?.kind === 'mist') {
      v.mistTurns = vPassive.turns;
      s.log.push({ type: 'mist', turns: vPassive.turns });
    }
  }

  // Tormento: perde chakra no início da rodada.
  for (const side of ['player', 'villain'] as Side[]) {
    const fx = fxOf(s, side);
    if (!fx.tormented) continue;
    const lost = Math.min(chakraOf(s, side), balance.status.torment.chakraPerRound);
    spendChakra(s, side, lost);
    s.log.push({ type: 'torment', side, chakra: lost });
    serveMental(s, side, 'tormented', rng, data);
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

  // Escudos duram `barrier.turns` rodadas a partir da seguinte à que foram erguidos.
  for (const side of ['player', 'villain'] as Side[]) {
    const f = fxOf(s, side);
    if (!f.shield || f.shield.round === s.round) continue;
    f.shield.turns--;
    if (f.shield.turns <= 0) {
      f.shield = null;
      s.log.push({ type: 'shieldEnd', side });
    }
  }

  // Tenacidade cai a cada rodada em que o lutador não está controlado.
  for (const f of [v.fx, fx]) {
    if (f.tenacity > 0 && !isControlled(f)) f.tenacity = Math.max(0, f.tenacity - data.balance.control.decayPerRound);
  }

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

  // Portões e expansão contam a rodada da ativação (são grátis); Armadura de Raio e dōjutsu, a partir da seguinte.
  if (fx.gatesTurns > 0) fx.gatesTurns--;
  if (fx.expansionTurns > 0) {
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

function playerTurn(s: BattleState, action: PlayerAction, rng: Rng, data: GameData): void {
  const fx = s.playerFx;
  // A postura vale até o próximo turno do jogador.
  fx.stance = false;
  if (consumeSkip(s, 'player', rng, data)) {
    endTurn(s, 'player', false, rng, data);
    return;
  }
  const p = s.player;
  const { balance } = data;

  const techId = actionTechniqueId(action);
  const itemId = actionItemId(action);
  if (techId) {
    const tech = leveledTechnique(p, techId, data);
    if (isBarrier(tech)) {
      p.chakra -= tech.chakraCost;
      raiseShield(s, 'player', tech, playerTechnique(p, techId, data).element, tech.chakraCost, data);
    } else if (tech.state) {
      p.chakra -= tech.chakraCost;
      fx.armorTurns = balance.states[tech.state].turns;
      fx.armorRound = s.round;
      s.log.push({ type: 'armor', techniqueId: tech.id, chakra: tech.chakraCost });
    } else if (tech.mental || isIllusion(tech)) {
      playerMentalTechnique(s, techId, rng, data);
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
  } else if (action === 'medical') {
    // Ninjutsu médico: cura sem rolar acerto.
    const tech = playerMedical(p, data);
    if (!tech) throw new Error('O jogador não sabe ninjutsu médico');
    p.chakra -= tech.chakraCost;
    s.log.push({ type: 'medical', healed: heal(s, 'player', medicalHealPct(p, data)), chakra: tech.chakraCost });
  }
  endTurn(s, 'player', true, rng, data);
}

/** Ativa o dōjutsu: paga a ativação e conta a duração a partir da rodada seguinte. */
function activateDojutsu(s: BattleState, data: GameData): void {
  const p = s.player;
  const fx = s.playerFx;
  if (!p.dojutsu) throw new Error('O jogador não tem dōjutsu');
  const cost = data.balance.dojutsu[p.dojutsu].activationCost;
  p.chakra -= cost;
  fx.dojutsuActive = true;
  fx.dojutsuTurns = data.balance.dojutsu.duration;
  fx.dojutsuRound = s.round;
  s.log.push({ type: 'dojutsu', dojutsu: p.dojutsu, stage: sharinganStage(p, data), chakra: cost });
}

/** Abre os portões (escolha grátis): o bônus já vale nesta rodada, que conta na duração. */
function openGates(s: BattleState, data: GameData): void {
  const p = s.player;
  const fx = s.playerFx;
  const gates = gatesToOpen(p, data);
  if (!gates) throw new Error('Portões exigem a ativa correspondente');
  const hpLost = gatesHpCost(p, gates.hpCostPct);
  p.chakra -= gates.chakraCost;
  p.hp -= hpLost;
  fx.gatesUsed = true;
  fx.gatesStage = gates.stage;
  fx.gatesTurns = data.balance.gates.turns;
  s.log.push({ type: 'gates', stage: gates.stage, hpLost, chakra: gates.chakraCost });
  checkPlayerCloak(s, data);
}

/** Expansão (escolha grátis): vale já nesta rodada, que conta na duração. */
function activateExpansion(s: BattleState, data: GameData): void {
  const cfg = data.balance.expansion;
  s.player.chakra -= cfg.chakraCost;
  s.playerFx.expansionTurns = cfg.turns;
  s.log.push({ type: 'expansion', chakra: cfg.chakraCost });
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
  if (!fx.confused || !chance(cfg.failChance, rng)) return false;
  const selfHit = selfDamage > 0 && chance(cfg.selfHitShare, rng) ? selfDamage : 0;
  s.log.push({ type: 'confusionFail', side, selfHit });
  if (selfHit > 0) hurt(s, side, selfHit, data);
  return true;
}

/** Golpe confuso no próprio corpo: técnica + ataque contra a própria resistência física passiva. */
function selfHitDamage(s: BattleState, side: Side, tech: CombatTech, data: GameData): number {
  if (tech.type === 'genjutsu' || tech.baseDamage <= 0) return 0;
  const offense = side === 'player' ? effectiveOffense(s, tech.type, data) : villainOffense(s, tech.type);
  const resistance = side === 'player' ? playerResistance(s, 'physical', data) : villainResistance(s, 'physical', data);
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
 * Genjutsu (ou Imitação de Sombra): não tem crítico; se acertar, aplica o efeito mental. Ilusão de dano
 * (Uchiha) fere com a fórmula do genjutsu.
 * A única reação do vilão é Resistir (com a resistência mental; física contra a sombra).
 */
function playerMentalTechnique(s: BattleState, techId: string, rng: Rng, data: GameData): void {
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
  const outcome = playerRoll(s, () => rollHit(hitP, 0, rng), (o) => HIT_RANK[o]);
  s.log.push({
    type: 'attack',
    side: 'player',
    techniqueId: tech.id,
    attackType: tech.type,
    outcome,
    damage: outcome === 'miss' ? 0 : illusionDamage(s, techId, data),
    elementMult: 1,
    hitChance: hitP,
    critChance: 0,
    chakra: tech.chakraCost,
  });
  if (outcome === 'miss') return;
  if (isIllusion(tech)) {
    // O dano vem antes do efeito: quem acorda com a dor não volta a dormir por ele.
    hurtVillain(s, illusionDamage(s, techId, data));
    if (s.status !== 'ongoing') return;
  }
  const effect = tech.mental;
  if (effect) applyMental(s, 'villain', effect, playerMentalStrength(s, techId, data), data);
}

/**
 * Dano da ilusão (Uchiha): base + poder de genjutsu (status efetivo e Sharingan) − resistência mental
 * usada pelo vilão, × pavor do jogador e vulnerabilidade de quem perdeu a vez. Sem crítico.
 */
export function illusionDamage(s: BattleState, techniqueId: string, data: GameData): number {
  const tech = playerTechnique(s.player, techniqueId, data);
  if (!isIllusion(tech)) return 0;
  const sharingan = activeSharingan(s, data)?.genjutsuPower ?? 0;
  const vulnerable = isControlled(s.villain.fx) ? data.balance.control.vulnerableDamageMult : 1;
  const fear = s.playerFx.feared ? data.balance.status.fear.damageMult : 1;
  return computeDamage({
    baseDamage: tech.baseDamage,
    offense: effectiveOffense(s, 'genjutsu', data) + sharingan,
    resistance: villainResistance(s, 'mental', data),
    fraction: guardFraction(s, 'villain', defaultGuard(s, 'villain'), 'mental', data),
    elementMult: 1,
    critMult: 1,
    extraMult: vulnerable * fear,
  });
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
  const outcome = rolled ?? playerRoll(s, () => rollHit(hitP, critP, rng), (o) => HIT_RANK[o]);
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
  return { outcome, dealt: hurtVillain(s, shieldAbsorb(s, 'villain', damage, tech, rng, data)) };
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
    applyElementalHit(s, 'villain', tech.element, outcome, data, rng);
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

/** Técnicas que o vilão pode usar no turno: chakra suficiente, condição de HP (cura); barreira sem escudo ativo. */
function villainOptions(s: BattleState): VillainTechnique[] {
  const v = s.villain;
  return v.def.techniques.filter(
    (t) =>
      (!isBarrier(t) || !v.fx.shield) &&
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

  if (isBarrier(tech)) {
    raiseShield(s, 'villain', tech, villainTechElement(v.def, tech), tech.chakraCost, data);
    return false;
  }
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
  const hitP = clamp(genjutsuHitChance(power, defense, balance.genjutsuHit) - penalty, 0, 1) * controlChanceMult(s.playerFx);
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
  if (outcome !== 'miss') applyMental(s, 'player', 'prison', mentalStrength(power, defense, tech.mentalStrength ?? 1, 'prison', data), data);
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

  hurtPlayer(s, shieldAbsorb(s, 'player', damage, tech, rng, data), data);
  if (s.status !== 'ongoing') return outcome;
  // Cobra do Orochimaru: acertos envenenam.
  if (passive?.kind === 'insane') applyPoison(s, 'player', passive.snakeBonus, data);
  // Sangramento: crítico de espada ou do bisturi, ou todo acerto (Kabuto no hardcore, último suspiro do Zabuza).
  const bleedOnHit = (passive?.kind === 'scalpel' && passive.bleedOnHit) || (passive?.kind === 'mist' && v.lastStand);
  const bleedOnCrit = tech.blade === 'sword' || passive?.kind === 'scalpel';
  if (bleedOnHit || (bleedOnCrit && outcome === 'crit')) applyBleed(s, 'player');
  applyElementalHit(s, 'player', tech.element, outcome, data, rng);
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
