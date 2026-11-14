// Árvore de talentos (docs/jornada/talentos.md): reinicia a cada run; alguns nós liberam pelo estágio da
// história e outros só depois de um objetivo da conta (uma conquista). Ramos podem bifurcar (escolha exclusiva)
// e alguns talentos sobem de nível; a maioria é única.
import type { Element } from '../types';
import type { FighterMods } from './types';

export interface TalentNode {
  id: string;
  /** Personagem dono da árvore. */
  owner: string;
  branch: string;
  /** Linha no ramo (1 = raiz). Sem `requires`, o nó pede o da linha anterior do mesmo ramo. */
  tier: number;
  /** Posição na linha (−1 esquerda, 0 centro, 1 direita). */
  col?: -1 | 0 | 1;
  cost: number;
  /** Nós que liberam este (basta um, no nível 1). Obrigatório depois de uma bifurcação. */
  requires?: string[];
  /**
   * Talento de combinação (v0.71.0): pede **todos** estes nós, de ramos diferentes (a junção de cada um). O nó pertence
   * ao primeiro ramo (`branch`) e aparece também no pé do outro.
   */
  requiresAll?: string[];
  /** Escolha exclusiva: com um destes aprendido, este fica fechado. */
  excludes?: string[];
  /** Estágio (índice) a partir do qual o ramo abre na História. */
  fromStage?: number;
  /** Conquista da conta que libera o nó de vez. */
  account?: string;
  learn?: string;
  /** Técnica aprendida conforme o elemento sorteado do protagonista (ramo Elemento do Comum). */
  learnByElement?: Partial<Record<Element, string>>;
  mods?: Partial<FighterMods>;
  /** Bônus em toda a equipe (protagonista incluído). */
  teamMods?: Partial<FighterMods>;
  /** HP máximo a mais dos suportes (fração). */
  allyHpPct?: number;
  /** XP ganho × este valor (Determinação). */
  xpMult?: number;
  /** Só existe para quem tem este elemento (principal ou segundo): fica escondido sem ele. */
  requiresElement?: Element;
  /** Nível máximo. Sem o campo, o talento é único. */
  maxRank?: number;
  /** Custo de cada nível acima do 1 (padrão: `cost`). */
  rankCost?: number;
  /** Bônus de cada nível acima do 1. */
  rankMods?: Partial<FighterMods>;
  /**
   * Nó dado pela história (v0.67.0): entra carimbado, sem custo, quando o marco acontece (a técnica é conhecida ou a run
   * tem a marca). Antes disso, "vem pela história". Os níveis acima do 1 continuam pagos.
   */
  grantedBy?: { technique?: string; flag?: string };
  /** Talento final do ramo: caro e que muda o estilo de jogo. */
  capstone?: boolean;
}

export interface TalentContext {
  owned: readonly string[];
  /** Nível dos talentos aprendidos (sem entrada: nível 1). */
  ranks?: Readonly<Record<string, number>>;
  points: number;
  stageIndex: number;
  /** Conquistas liberadas no perfil. */
  unlocked: ReadonlySet<string>;
  /** Elementos do protagonista (principal e segundo). */
  elements?: readonly (Element | null)[];
}

export type TalentState = 'owned' | 'upgradable' | 'maxed' | 'available' | 'noPoints' | 'locked' | 'excluded' | 'stageLocked' | 'storyLocked' | 'accountLocked' | 'hidden';

export const talentMaxRank = (node: TalentNode) => node.maxRank ?? 1;
export const talentRankCost = (node: TalentNode) => node.rankCost ?? node.cost;
export const talentRank = (node: TalentNode, ctx: Pick<TalentContext, 'owned' | 'ranks'>) => (ctx.owned.includes(node.id) ? (ctx.ranks?.[node.id] ?? 1) : 0);

/** Nós que liberam este: os de `requires`, ou o da linha anterior do mesmo ramo. */
export function talentRequirements(node: TalentNode, nodes: readonly TalentNode[]): string[] {
  if (node.requiresAll) return node.requiresAll;
  if (node.requires) return node.requires;
  return nodes.filter((n) => n.owner === node.owner && n.branch === node.branch && n.tier === node.tier - 1).map((n) => n.id);
}

export function talentState(node: TalentNode, nodes: readonly TalentNode[], ctx: TalentContext): TalentState {
  if (node.requiresElement && !ctx.elements?.includes(node.requiresElement)) return 'hidden';
  if (ctx.owned.includes(node.id)) {
    const rank = talentRank(node, ctx);
    if (talentMaxRank(node) === 1) return 'owned';
    if (rank >= talentMaxRank(node)) return 'maxed';
    return ctx.points >= talentRankCost(node) ? 'upgradable' : 'owned';
  }
  // Nó da história que ainda não chegou: não se compra (a sincronização da run o carimba no marco).
  if (node.grantedBy) return 'storyLocked';
  if (node.account && !ctx.unlocked.has(node.account)) return 'accountLocked';
  if (node.fromStage !== undefined && ctx.stageIndex < node.fromStage) return 'stageLocked';
  if (node.excludes?.some((id) => ctx.owned.includes(id))) return 'excluded';
  if (node.requiresAll) {
    if (!node.requiresAll.every((id) => ctx.owned.includes(id))) return 'locked';
  } else {
    const reqs = talentRequirements(node, nodes);
    if (reqs.length && !reqs.some((id) => ctx.owned.includes(id))) return 'locked';
  }
  return ctx.points >= node.cost ? 'available' : 'noPoints';
}

/** Dá para aprender (ou subir o nível) agora. */
export function canBuyTalent(node: TalentNode, nodes: readonly TalentNode[], ctx: TalentContext): boolean {
  const st = talentState(node, nodes, ctx);
  return st === 'available' || st === 'upgradable';
}

/**
 * Árvore completa (docs/jornada/talentos.md#árvore-completa): nada mais a aprender ou subir, nem com pontos infinitos e
 * todos os estágios abertos. Nó fechado por bifurcação, escondido por elemento ou preso a conquista não liberada conta
 * como "nunca"; nó preso a estágio da História conta como "ainda vem". Basta olhar o que dá para comprar agora: todo nó
 * alcançável que falta tem um antecessor comprável.
 */
export function treeComplete(owner: string, nodes: readonly TalentNode[], ctx: TalentContext): boolean {
  const open: TalentContext = { ...ctx, points: Infinity, stageIndex: Infinity };
  // Nó da história que ainda não chegou conta como "ainda vem", como o preso a estágio.
  if (nodes.some((n) => n.owner === owner && n.grantedBy && !ctx.owned.includes(n.id))) return false;
  return !nodes.some((n) => n.owner === owner && canBuyTalent(n, nodes, open));
}

/** Ramos que um talento de combinação liga (o dele e os dos nós que ele pede), na ordem dos dados. */
export function comboBranches(node: TalentNode, nodes: readonly TalentNode[]): string[] {
  if (!node.requiresAll) return [];
  return [...new Set(node.requiresAll.map((id) => nodes.find((n) => n.id === id)?.branch).filter((b): b is string => Boolean(b)))];
}

/** Ramos de um personagem, na ordem dos dados. */
export function branchesOf(owner: string, nodes: readonly TalentNode[]): string[] {
  return [...new Set(nodes.filter((n) => n.owner === owner).map((n) => n.branch))];
}
