import type { Difficulty } from './difficulty';
import type { GameData } from './gameData';
import type {
  AttackStats,
  AttackType,
  DojutsuId,
  Element,
  Origin,
  PassiveDef,
  StatKey,
  SummonState,
  TechniqueDef,
  TechniqueElement,
  TechniqueSlot,
} from './types';

/** Quantos amuletos de cada tipo o jogador carrega. */
export interface Amulets {
  speed: number;
  resistance: number;
}

export interface PlayerState {
  origin: Origin;
  /** Começa em 1. Sobe ao juntar o XP do nível, até `balance.level.cap`. */
  level: number;
  /** XP acumulado rumo ao próximo nível (zera ao subir). No teto, fica em 0. */
  xp: number;
  /** HP e chakra máximos ganhos por nível (e por estágio de status), conforme a dificuldade. */
  growth: { hp: number; chakra: number };
  maxHp: number;
  hp: number;
  maxChakra: number;
  chakra: number;
  offense: AttackStats;
  speed: number;
  affinity: Element | null;
  secondaryElements: Element[];
  /** diferencial_de_dano_%: somado à chance base de crítico. */
  critBonus: number;
  /** diferencial_de_resistência. */
  resistanceBonus: number;
  /** Tipos com ação básica desde o início (genjutsu só no Uchiha). */
  basicTypes: AttackType[];
  /**
   * Skill set: técnicas aprendidas (recompensa, nível ou linhagem), várias por categoria.
   * As ações básicas não entram aqui (vêm de `basicTypes`).
   */
  techniques: string[];
  /** Upgrades (pergaminho) por categoria: valem para todas as técnicas dela, inclusive as básicas. */
  techniqueLevels: Partial<Record<TechniqueSlot, number>>;
  /** Técnica ocular ativável em batalha (Sharingan, Byakugan). */
  dojutsu: DojutsuId | null;
  /** Ferramenta ninja: item único, evoluível. 0 = não tem. */
  ninjaToolLevel: number;
  /** Amuletos carregados (efeito permanente, aparecem na bolsa). O bônus já está em speed/resistanceBonus. */
  amulets: Amulets;
  summon: SummonState | null;
  forbiddenAttackTypes: AttackType[];
  passive: PassiveDef | null;
  jinchuuriki: boolean;
  /** Ensinado pelo guru: uma vez por luta, ativa um crítico garantido no próximo ataque. */
  focusCrit: boolean;
  revives: number;
  revivesUsed: number;
}

export function createPlayer(
  origin: Origin,
  data: GameData,
  difficulty: Difficulty = data.balance.difficulty.default,
): PlayerState {
  const { balance } = data;
  const lineage = origin.lineageId ? data.lineages.find((l) => l.id === origin.lineageId) : undefined;
  if (origin.lineageId && !lineage) throw new Error(`Linhagem desconhecida: ${origin.lineageId}`);

  const stat = (key: StatKey): number => {
    if (lineage?.zeroedStats?.includes(key)) return 0;
    return Math.floor(balance.baseStats[key] * (1 + (lineage?.modifiers[key] ?? 0)));
  };

  let maxChakra = stat('chakra');
  if (origin.jinchuuriki) maxChakra = Math.floor(maxChakra * (1 + balance.jinchuuriki.chakraBonusPct));
  const maxHp = stat('hp');
  const forbidden = lineage?.forbiddenAttackTypes ?? [];
  const basicTypes = (lineage?.startingTypes ?? balance.commonStartingTypes).filter((t) => !forbidden.includes(t));

  return grantLevelTechniques({
    origin,
    level: 1,
    xp: 0,
    growth: { ...balance.level.growth[difficulty] },
    maxHp,
    hp: maxHp,
    maxChakra,
    chakra: maxChakra,
    offense: { taijutsu: stat('taijutsu'), ninjutsu: stat('ninjutsu'), genjutsu: stat('genjutsu') },
    speed: stat('speed'),
    affinity: origin.affinity,
    secondaryElements: [],
    critBonus: 0,
    resistanceBonus: balance.resistance.initialBonus,
    basicTypes,
    techniques: [...(lineage?.startingTechniques ?? [])],
    techniqueLevels: {},
    dojutsu: lineage?.dojutsu ?? null,
    ninjaToolLevel: 0,
    amulets: { speed: 0, resistance: 0 },
    summon: null,
    forbiddenAttackTypes: [...forbidden],
    passive: lineage?.passive ?? null,
    jinchuuriki: origin.jinchuuriki,
    focusCrit: false,
    revives: balance.revive.initialItems,
    revivesUsed: 0,
  }, data);
}

/** Troca a dificuldade antes da primeira luta (muda o ganho de HP e chakra por nível). */
export function withDifficulty(player: PlayerState, difficulty: Difficulty, data: GameData): PlayerState {
  return { ...player, growth: { ...data.balance.level.growth[difficulty] } };
}

/** Restaura HP e chakra (Vontade do Fogo, ou entre etapas da campanha). */
export function fullRestore(player: PlayerState): PlayerState {
  return { ...player, hp: player.maxHp, chakra: player.maxChakra };
}

export function techniqueSlot(tech: TechniqueDef): TechniqueSlot {
  return tech.slot ?? tech.type;
}

/**
 * Ensina uma técnica e a soma ao skill set (não substitui as da mesma categoria).
 * Respeita a restrição da origem. Aprender um genjutsu libera a categoria (e as técnicas de nível dela).
 */
export function learnTechnique(player: PlayerState, techniqueId: string, data: GameData): PlayerState {
  const tech = data.techniquesById[techniqueId];
  if (!tech) throw new Error(`Técnica desconhecida: ${techniqueId}`);
  if (player.forbiddenAttackTypes.includes(tech.type)) {
    throw new Error(`Esta origem não aprende técnicas de ${tech.type}`);
  }
  if (!knowsElement(player, tech.element)) throw new Error(`O jogador não domina o elemento ${tech.element}`);
  if (!lineageAllows(player, tech)) throw new Error(`Esta origem não aprende ${tech.id}`);
  if (player.techniques.includes(tech.id)) return player;
  return grantLevelTechniques({ ...player, techniques: [...player.techniques, tech.id] }, data);
}

/** O jogador tem ações desse tipo: ação básica da origem ou alguma técnica aprendida do tipo. */
export function canUseType(player: PlayerState, type: AttackType, data: GameData): boolean {
  if (player.forbiddenAttackTypes.includes(type)) return false;
  if (player.basicTypes.includes(type)) return true;
  return player.techniques.some((id) => {
    const t = data.techniquesById[id];
    return t !== undefined && t.type === type && techniqueSlot(t) === type;
  });
}

const SLOT_ORDER: TechniqueSlot[] = ['taijutsu', 'ninjutsu', 'genjutsu', 'medical'];

/** Skill set completo, por categoria: ações básicas da origem + técnicas aprendidas. */
export function knownTechniques(player: PlayerState, data: GameData): TechniqueDef[] {
  const basics = player.basicTypes.flatMap((t) => data.basicTechniques[t]);
  const learned = player.techniques.map((id) => data.techniquesById[id]).filter((t): t is TechniqueDef => !!t);
  const all = [...basics, ...learned];
  return SLOT_ORDER.flatMap((slot) => all.filter((t) => techniqueSlot(t) === slot));
}

/** Técnicas de nível que o jogador já pode aprender (nível, origem, categoria e elemento). */
export function pendingLevelTechniques(player: PlayerState, data: GameData): string[] {
  return data.levelTechniques
    .filter(
      (t) =>
        (t.minLevel ?? 1) <= player.level &&
        !player.techniques.includes(t.id) &&
        canUseType(player, t.type, data) &&
        knowsElement(player, t.element) &&
        lineageAllows(player, t),
    )
    .map((t) => t.id);
}

/** Técnica exclusiva de linhagem (ex.: combos avançados do prodígio) só serve a quem é dela. */
export function lineageAllows(player: PlayerState, tech: TechniqueDef): boolean {
  return !tech.lineages || (player.origin.lineageId !== null && tech.lineages.includes(player.origin.lineageId));
}

/** Aprende as técnicas de nível já liberadas. */
export function grantLevelTechniques(player: PlayerState, data: GameData): PlayerState {
  const ids = pendingLevelTechniques(player, data);
  return ids.length ? { ...player, techniques: [...player.techniques, ...ids] } : player;
}

/** Técnica sem elemento (ou da afinidade) serve a qualquer um; elemental exige dominar o elemento. */
export function knowsElement(player: PlayerState, element: TechniqueElement): boolean {
  if (element === null || element === 'affinity') return true;
  return player.affinity === element || player.secondaryElements.includes(element);
}

/** Fração do HP máximo que o ninjutsu médico cura, com os upgrades. 0 = não sabe. */
export function medicalHealPct(player: PlayerState, data: GameData): number {
  const tech = knownTechniques(player, data).find((t) => techniqueSlot(t) === 'medical');
  if (!tech) return 0;
  return (tech.healPct ?? 0) + (player.techniqueLevels.medical ?? 0) * data.balance.techniqueUpgrade.healPctPerLevel;
}

/** XP para sair de `level` e ir ao próximo. `null` no teto de nível. */
export function xpToNextLevel(level: number, data: GameData): number | null {
  const cfg = data.balance.level;
  if (level >= cfg.cap) return null;
  return cfg.xpBase + cfg.xpGrowth * (level - 1);
}

/** Soma XP. Não sobe de nível sozinho: enquanto `canLevelUp`, a UI mostra uma subida por vez. */
export function gainXp(player: PlayerState, amount: number, data: GameData): PlayerState {
  if (xpToNextLevel(player.level, data) === null) return { ...player, xp: 0 };
  return { ...player, xp: player.xp + amount };
}

export function canLevelUp(player: PlayerState, data: GameData): boolean {
  const need = xpToNextLevel(player.level, data);
  return need !== null && player.xp >= need;
}

/**
 * Sobe 1 nível, gastando o XP do nível: HP e chakra máximos sobem (`growth`, pela dificuldade) e
 * são restaurados por completo (o único gatilho de recuperação fora da Vontade do Fogo).
 * Técnicas de nível liberadas são aprendidas na hora.
 */
export function applyLevelUp(player: PlayerState, data: GameData): PlayerState {
  const cfg = data.balance.level;
  if (!canLevelUp(player, data)) throw new Error('XP insuficiente ou nível máximo');
  const level = player.level + 1;
  const leftover = player.xp - xpToNextLevel(player.level, data)!;
  const p: PlayerState = {
    ...player,
    level,
    xp: level >= cfg.cap ? 0 : leftover,
    maxHp: player.maxHp + player.growth.hp,
    maxChakra: player.maxChakra + player.growth.chakra,
  };
  return grantLevelTechniques(fullRestore(p), data);
}

/**
 * Sobe `n` estágios em todos os status. HP e chakra máximos sobem o mesmo que numa subida de nível,
 * e os atuais sobem junto com o máximo.
 * Tipos proibidos pela origem (ex.: ninjutsu do prodígio do taijutsu) continuam zerados.
 */
export function applyStatStages(player: PlayerState, n: number, data: GameData): PlayerState {
  const st = data.balance.statStage;
  const offense = { ...player.offense };
  for (const type of ['taijutsu', 'ninjutsu', 'genjutsu'] as const) {
    if (!player.forbiddenAttackTypes.includes(type)) offense[type] += st[type] * n;
  }
  return {
    ...player,
    offense,
    speed: player.speed + st.speed * n,
    maxHp: player.maxHp + player.growth.hp * n,
    hp: player.hp + player.growth.hp * n,
    maxChakra: player.maxChakra + player.growth.chakra * n,
    chakra: player.chakra + player.growth.chakra * n,
  };
}

/** Maior portão liberado pelo atributo de taijutsu (1, 2, 3...). 0 = não tem portões ou não liberou. */
export function gatesStage(player: PlayerState, data: GameData): number {
  if (player.passive?.kind !== 'gates') return 0;
  let stage = 0;
  data.balance.gates.stages.forEach((st, i) => {
    if (player.offense.taijutsu >= st.minTaijutsu) stage = i + 1;
  });
  return stage;
}
