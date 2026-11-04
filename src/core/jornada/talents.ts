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

export type TalentState = 'owned' | 'upgradable' | 'maxed' | 'available' | 'noPoints' | 'locked' | 'excluded' | 'stageLocked' | 'accountLocked' | 'hidden';

export const talentMaxRank = (node: TalentNode) => node.maxRank ?? 1;
export const talentRankCost = (node: TalentNode) => node.rankCost ?? node.cost;
export const talentRank = (node: TalentNode, ctx: Pick<TalentContext, 'owned' | 'ranks'>) => (ctx.owned.includes(node.id) ? (ctx.ranks?.[node.id] ?? 1) : 0);

/** Nós que liberam este: os de `requires`, ou o da linha anterior do mesmo ramo. */
export function talentRequirements(node: TalentNode, nodes: readonly TalentNode[]): string[] {
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
  if (node.account && !ctx.unlocked.has(node.account)) return 'accountLocked';
  if (node.fromStage !== undefined && ctx.stageIndex < node.fromStage) return 'stageLocked';
  if (node.excludes?.some((id) => ctx.owned.includes(id))) return 'excluded';
  const reqs = talentRequirements(node, nodes);
  if (reqs.length && !reqs.some((id) => ctx.owned.includes(id))) return 'locked';
  return ctx.points >= node.cost ? 'available' : 'noPoints';
}

/** Dá para aprender (ou subir o nível) agora. */
export function canBuyTalent(node: TalentNode, nodes: readonly TalentNode[], ctx: TalentContext): boolean {
  const st = talentState(node, nodes, ctx);
  return st === 'available' || st === 'upgradable';
}

/** Ramos de um personagem, na ordem dos dados. */
export function branchesOf(owner: string, nodes: readonly TalentNode[]): string[] {
  return [...new Set(nodes.filter((n) => n.owner === owner).map((n) => n.branch))];
}
