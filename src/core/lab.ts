import type { Difficulty } from './difficulty';
import type { GameData } from './gameData';
import { lineageOf } from './origin';
import { applyLevelUp, createPlayer, EMPTY_BAG, learnTechnique, xpToNextLevel, type Bag, type PlayerState } from './player';
import type { Element, Origin, TechniqueDef } from './types';

/**
 * Laboratório (modo de teste): monta uma ficha à mão, sem as roletas de origem, para testar
 * habilidades, técnicas e vilões. Ligado pela URL (`?teste`), não entra no histórico.
 */
export interface LabConfig {
  /** Id da linhagem nos dados (`common` = origem comum). */
  lineageId: string;
  /** Usada só quando a linhagem sorteia a afinidade. */
  affinity: Element | null;
  jinchuuriki: boolean;
  difficulty: Difficulty;
  level: number;
  /** Técnicas extras; as que a origem não pode aprender são ignoradas. */
  techniques: string[];
  bag: Partial<Bag>;
  /** Status escritos à mão; o que faltar fica como a ficha montada. Opcional (montagens antigas). */
  stats?: LabStats;
}

/** Status que o laboratório deixa sobrescrever. HP e chakra são os máximos (a luta começa cheia). */
export type LabStatKey = 'hp' | 'chakra' | 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'speed' | 'physical' | 'mental';
export type LabStats = Partial<Record<LabStatKey, number>>;
export const LAB_STAT_KEYS: LabStatKey[] = ['hp', 'chakra', 'taijutsu', 'ninjutsu', 'genjutsu', 'speed', 'physical', 'mental'];

/** Valor atual de cada status sobrescrevível da ficha. */
export function labStatsOf(player: PlayerState): Record<LabStatKey, number> {
  return {
    hp: player.maxHp,
    chakra: player.maxChakra,
    ...player.offense,
    speed: player.speed,
    ...player.resistance,
  };
}

/** Aplica os status escritos à mão (inteiros; HP e chakra máximos ≥ 1, o resto ≥ 0), com HP e chakra cheios. */
export function applyLabStats(player: PlayerState, stats: LabStats): PlayerState {
  const v = (key: LabStatKey, current: number, min = 0) => {
    const n = stats[key];
    return n === undefined || !Number.isFinite(n) ? current : Math.max(min, Math.floor(n));
  };
  const maxHp = v('hp', player.maxHp, 1);
  const maxChakra = v('chakra', player.maxChakra, 1);
  return {
    ...player,
    maxHp,
    hp: maxHp,
    maxChakra,
    chakra: maxChakra,
    offense: { taijutsu: v('taijutsu', player.offense.taijutsu), ninjutsu: v('ninjutsu', player.offense.ninjutsu), genjutsu: v('genjutsu', player.offense.genjutsu) },
    speed: v('speed', player.speed),
    resistance: { physical: v('physical', player.resistance.physical), mental: v('mental', player.resistance.mental) },
  };
}

export interface LabParams {
  lab: boolean;
  /** Seed do RNG (`?seed=42`); null = aleatório. */
  seed: number | null;
}

/** Lê `?teste` e `?seed=N` da URL. */
export function parseLabParams(search: string): LabParams {
  const params = new URLSearchParams(search);
  const raw = params.get('seed');
  const seed = raw !== null && /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : null;
  return { lab: params.has('teste'), seed };
}

/** Origem válida para a linhagem: afinidade fixa ou nenhuma vencem a escolhida. */
export function labOrigin(config: LabConfig, data: GameData): Origin {
  const lineage = lineageOf(config.lineageId, data);
  const rule = lineage.affinity;
  const firstElement = Object.keys(data.elementWeights)[0] as Element;
  const affinity = rule.kind === 'fixed' ? rule.element : rule.kind === 'none' ? null : (config.affinity ?? firstElement);
  return { lineageId: lineage.id === 'common' ? null : lineage.id, affinity, jinchuuriki: config.jinchuuriki };
}

/**
 * Técnicas que esta ficha ainda pode aprender, inclusive as premium e as de nível, sem olhar o nível
 * mínimo. As cópias do Uchiha ficam de fora (vêm da luta).
 */
export function labLearnable(player: PlayerState, data: GameData): TechniqueDef[] {
  return Object.values(data.techniquesById).filter((t) => {
    if (t.copied) return false;
    try {
      return learnTechnique(player, t.id, data) !== player;
    } catch {
      return false;
    }
  });
}

/**
 * Ficha do laboratório: cria o jogador, sobe os níveis (como na campanha, com as técnicas de nível e
 * os upgrades de marco pendentes), ensina as técnicas extras, enche a bolsa (até `items.bagMax`) e aplica
 * os status escritos à mão.
 */
export function buildLabPlayer(config: LabConfig, data: GameData): PlayerState {
  let p = createPlayer(labOrigin(config, data), data, config.difficulty);
  const level = Math.max(1, Math.floor(config.level));
  while (p.level < level) p = applyLevelUp({ ...p, xp: xpToNextLevel(p.level, data) }, data);
  for (const id of config.techniques) {
    try {
      p = learnTechnique(p, id, data);
    } catch {
      // Técnica que a origem não aprende (ou id antigo salvo): ignora.
    }
  }
  const bagMax = data.balance.items.bagMax;
  const bag = { ...EMPTY_BAG };
  for (const id of Object.keys(EMPTY_BAG) as (keyof Bag)[]) {
    bag[id] = Math.min(bagMax, Math.max(0, Math.floor(config.bag[id] ?? 0)));
  }
  return applyLabStats({ ...p, bag }, config.stats ?? {});
}
