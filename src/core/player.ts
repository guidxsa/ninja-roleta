import type { Difficulty } from './difficulty';
import type { GameData } from './gameData';
import { lineageOf } from './origin';
import type {
  ActiveKind,
  AttackStats,
  AttackType,
  ConsumableId,
  DojutsuId,
  Element,
  Origin,
  PassiveKind,
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

/** Pesos de treino: nunca ganhou, equipados, guardados (ganhou e não equipou) ou já tirados. */
export type TrainingWeights = 'none' | 'equipped' | 'stored' | 'removed';

export type Bag = Record<ConsumableId, number>;

export const BASIC_TAIJUTSU = 'basicTaijutsu';

export interface PlayerState {
  origin: Origin;
  /** Começa em 1. Não há nível máximo. */
  level: number;
  /** XP acumulado rumo ao próximo nível (a sobra passa adiante). */
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
  /** Skill set: todas as técnicas conhecidas (kit inicial, nível, recompensa), várias por categoria. */
  techniques: string[];
  /** Upgrades (pergaminho) por categoria: valem para todas as técnicas dela. */
  techniqueLevels: Partial<Record<TechniqueSlot, number>>;
  /** Técnica ocular ativável em batalha (Sharingan, Byakugan). */
  dojutsu: DojutsuId | null;
  /** Ativa de linhagem (portões, expansão, clones). */
  active: ActiveKind | null;
  /** Ferramenta ninja: item único, evoluível. 0 = não tem. */
  ninjaToolLevel: number;
  /** Amuletos carregados (efeito permanente). O bônus já está em speed/resistanceBonus. */
  amulets: Amulets;
  /** Consumíveis da bolsa (máximo `balance.items.bagMax` de cada). */
  bag: Bag;
  /** Moedas viciadas: cada uma gira de novo uma roleta fora do combate. */
  coins: number;
  trainingWeights: TrainingWeights;
  summon: SummonState | null;
  forbiddenAttackTypes: AttackType[];
  passive: PassiveKind;
  jinchuuriki: boolean;
  /** Ensinado pelo guru: uma vez por luta, ativa um crítico garantido no próximo ataque. */
  focusCrit: boolean;
  revives: number;
  revivesUsed: number;
}

export const EMPTY_BAG: Bag = { soldierPill: 0, medKit: 0, explosiveTag: 0, smokeBomb: 0 };

/** Ninjutsu básico de um elemento (kit inicial da afinidade). */
export function elementalBasic(element: Element, data: GameData): TechniqueDef | undefined {
  return Object.values(data.techniquesById).find((t) => t.elementalBasic && t.element === element);
}

export function createPlayer(
  origin: Origin,
  data: GameData,
  difficulty: Difficulty = data.balance.difficulty.default,
): PlayerState {
  const { balance } = data;
  const lineage = lineageOf(origin.lineageId, data);
  const st = lineage.stats;
  const forbidden = lineage.forbiddenAttackTypes ?? [];

  let maxChakra = st.chakra;
  if (origin.jinchuuriki) maxChakra = Math.floor(maxChakra * (1 + balance.jinchuuriki.chakraBonusPct));

  // Kit: Punho de Chakra, ninjutsu básico do elemento (se usa ninjutsu) e as técnicas da linhagem.
  const kit = [BASIC_TAIJUTSU];
  const basic = origin.affinity && !forbidden.includes('ninjutsu') ? elementalBasic(origin.affinity, data) : undefined;
  if (basic) kit.push(basic.id);
  kit.push(...(lineage.startingTechniques ?? []));

  return grantLevelTechniques(
    {
      origin,
      level: 1,
      xp: 0,
      growth: { ...balance.level.growth[difficulty] },
      maxHp: st.hp,
      hp: st.hp,
      maxChakra,
      chakra: maxChakra,
      offense: { taijutsu: st.taijutsu, ninjutsu: st.ninjutsu, genjutsu: st.genjutsu },
      speed: st.speed,
      affinity: origin.affinity,
      secondaryElements: [],
      critBonus: 0,
      resistanceBonus: balance.resistance.initialBonus,
      techniques: kit,
      techniqueLevels: {},
      dojutsu: lineage.dojutsu ?? null,
      active: lineage.active ?? null,
      ninjaToolLevel: 0,
      amulets: { speed: 0, resistance: 0 },
      bag: { ...EMPTY_BAG },
      coins: 0,
      trainingWeights: 'none',
      summon: null,
      forbiddenAttackTypes: [...forbidden],
      passive: lineage.passive,
      jinchuuriki: origin.jinchuuriki,
      focusCrit: false,
      revives: balance.revive.initialItems,
      revivesUsed: 0,
    },
    data,
  );
}

/** Troca a dificuldade antes da primeira luta (muda o ganho de HP e chakra por nível). */
export function withDifficulty(player: PlayerState, difficulty: Difficulty, data: GameData): PlayerState {
  return { ...player, growth: { ...data.balance.level.growth[difficulty] } };
}

/** Restaura HP e chakra (início do combate, Vontade do Fogo). */
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

/** O jogador usa a categoria: tem ao menos uma técnica dela (e a origem permite). */
export function canUseType(player: PlayerState, type: AttackType, data: GameData): boolean {
  if (player.forbiddenAttackTypes.includes(type)) return false;
  return player.techniques.some((id) => {
    const t = data.techniquesById[id];
    return t !== undefined && techniqueSlot(t) === type;
  });
}

const SLOT_ORDER: TechniqueSlot[] = ['taijutsu', 'ninjutsu', 'genjutsu', 'medical'];

/** Skill set completo, na ordem das categorias. */
export function knownTechniques(player: PlayerState, data: GameData): TechniqueDef[] {
  const all = player.techniques.map((id) => data.techniquesById[id]).filter((t): t is TechniqueDef => !!t);
  return SLOT_ORDER.flatMap((slot) => all.filter((t) => techniqueSlot(t) === slot));
}

/** Técnicas de nível que o jogador já pode aprender (nível, origem, categoria e elemento). */
export function pendingLevelTechniques(player: PlayerState, data: GameData): string[] {
  return data.levelTechniques
    .filter(
      (t) =>
        (t.minLevel ?? 1) <= player.level &&
        !player.techniques.includes(t.id) &&
        !player.forbiddenAttackTypes.includes(t.type) &&
        // Genjutsu de nível só para quem já usa genjutsu; as exclusivas de linhagem valem sempre.
        (t.type !== 'genjutsu' || canUseType(player, 'genjutsu', data)) &&
        knowsElement(player, t.element) &&
        lineageAllows(player, t),
    )
    .map((t) => t.id);
}

/** Técnica exclusiva de linhagem só serve a quem é dela. */
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

/** XP para sair de `level` e ir ao próximo. */
export function xpToNextLevel(level: number, data: GameData): number {
  const cfg = data.balance.level;
  return cfg.xpBase + cfg.xpGrowth * (level - 1);
}

/** XP efetivamente ganho de uma fonte (a passiva Determinação soma 10%). */
export function xpGain(player: PlayerState, amount: number, data: GameData): number {
  const bonus = player.passive === 'determination' ? data.balance.passives.determination.xpBonusPct : 0;
  return Math.floor(amount * (1 + bonus));
}

/** Soma XP. Não sobe de nível sozinho: enquanto `canLevelUp`, a UI mostra uma subida por vez. */
export function gainXp(player: PlayerState, amount: number, data: GameData): PlayerState {
  return { ...player, xp: player.xp + xpGain(player, amount, data) };
}

export function canLevelUp(player: PlayerState, data: GameData): boolean {
  return player.xp >= xpToNextLevel(player.level, data);
}

/**
 * Sobe 1 nível, gastando o XP do nível: HP e chakra máximos sobem (`growth`, pela dificuldade).
 * Não restaura (quem restaura é o início do combate). Técnicas de nível liberadas são aprendidas na hora.
 */
export function applyLevelUp(player: PlayerState, data: GameData): PlayerState {
  if (!canLevelUp(player, data)) throw new Error('XP insuficiente');
  const p: PlayerState = {
    ...player,
    level: player.level + 1,
    xp: player.xp - xpToNextLevel(player.level, data),
    maxHp: player.maxHp + player.growth.hp,
    hp: player.hp + player.growth.hp,
    maxChakra: player.maxChakra + player.growth.chakra,
    chakra: player.chakra + player.growth.chakra,
  };
  return grantLevelTechniques(p, data);
}

/**
 * Sobe `n` estágios em todos os status. HP e chakra máximos sobem o mesmo que numa subida de nível.
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
  if (player.active !== 'gates') return 0;
  let stage = 0;
  data.balance.gates.stages.forEach((st, i) => {
    if (player.offense.taijutsu >= st.minTaijutsu) stage = i + 1;
  });
  return stage;
}

// ---------------------------------------------------------------------------
// Pesos de treino (itens.md)

/** Equipar os pesos guardados: −2 de speed enquanto equipados. */
export function equipTrainingWeights(player: PlayerState, data: GameData): PlayerState {
  if (player.trainingWeights !== 'stored') throw new Error('Não há pesos para equipar');
  return { ...player, trainingWeights: 'equipped', speed: player.speed - data.balance.items.trainingWeights.speedPenalty };
}

/** Tirar os pesos (fora de combate): devolve o speed e dá o bônus extra. Depois de tirados, não voltam. */
export function removeTrainingWeights(player: PlayerState, data: GameData): PlayerState {
  if (player.trainingWeights !== 'equipped') throw new Error('Os pesos não estão equipados');
  const cfg = data.balance.items.trainingWeights;
  return { ...player, trainingWeights: 'removed', speed: player.speed + cfg.speedPenalty + cfg.removeSpeedBonus };
}

/** Vitória contra vilão com os pesos equipados: +1 de taijutsu. */
export function trainingWeightsWin(player: PlayerState, data: GameData): PlayerState {
  if (player.trainingWeights !== 'equipped') return player;
  const offense = { ...player.offense, taijutsu: player.offense.taijutsu + data.balance.items.trainingWeights.taijutsuPerWin };
  return { ...player, offense };
}
