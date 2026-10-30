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
 * os upgrades de marco pendentes), ensina as técnicas extras e enche a bolsa (até `items.bagMax`).
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
  return { ...p, bag };
}
