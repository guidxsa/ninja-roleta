// Árvore de talentos (docs/jornada/talentos.md): reinicia a cada run; alguns nós liberam pelo estágio da
// história e outros só depois de um objetivo da conta (uma conquista).
import type { Element } from '../types';
import type { FighterMods } from './types';

export interface TalentNode {
  id: string;
  /** Personagem dono da árvore. */
  owner: string;
  branch: string;
  /** Posição no ramo (1 = raiz). Cada nó pede o anterior do mesmo ramo. */
  tier: number;
  cost: number;
  /** Estágio (índice) a partir do qual o ramo abre na run canônica. */
  fromStage?: number;
  /** Conquista da conta que libera o nó de vez. */
  account?: string;
  learn?: string;
  /** Técnica aprendida conforme o elemento sorteado do protagonista (ramo Elemento do Comum). */
  learnByElement?: Partial<Record<Element, string>>;
  mods?: Partial<FighterMods>;
  /** XP ganho × este valor (Determinação). */
  xpMult?: number;
  /** Só existe para quem tem este elemento (principal ou segundo): fica escondido sem ele. */
  requiresElement?: Element;
}

export interface TalentContext {
  owned: readonly string[];
  points: number;
  stageIndex: number;
  /** Conquistas liberadas no perfil. */
  unlocked: ReadonlySet<string>;
  /** Elementos do protagonista (principal e segundo). */
  elements?: readonly (Element | null)[];
}

export type TalentState = 'owned' | 'available' | 'noPoints' | 'locked' | 'stageLocked' | 'accountLocked' | 'hidden';

export function talentState(node: TalentNode, nodes: readonly TalentNode[], ctx: TalentContext): TalentState {
  if (node.requiresElement && !ctx.elements?.includes(node.requiresElement)) return 'hidden';
  if (ctx.owned.includes(node.id)) return 'owned';
  if (node.account && !ctx.unlocked.has(node.account)) return 'accountLocked';
  if (node.fromStage !== undefined && ctx.stageIndex < node.fromStage) return 'stageLocked';
  const prev = nodes.find((n) => n.owner === node.owner && n.branch === node.branch && n.tier === node.tier - 1);
  if (prev && !ctx.owned.includes(prev.id)) return 'locked';
  return ctx.points >= node.cost ? 'available' : 'noPoints';
}

export function canBuyTalent(node: TalentNode, nodes: readonly TalentNode[], ctx: TalentContext): boolean {
  return talentState(node, nodes, ctx) === 'available';
}

/** Ramos de um personagem, na ordem dos dados. */
export function branchesOf(owner: string, nodes: readonly TalentNode[]): string[] {
  return [...new Set(nodes.filter((n) => n.owner === owner).map((n) => n.branch))];
}
