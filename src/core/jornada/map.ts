// Mapa ramificado do Caminho Ninja (docs/jornada/run.md#mapa-ramificado): linhas de baixo para cima,
// 3 começos, cada nó liga a 1–2 da linha seguinte e todos chegam ao chefe. Puro e com seed.
import type { Rng } from '../rng';
import type { JornadaData } from './data';

export type NodeKind = 'fight' | 'elite' | 'unknown' | 'rest' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  row: number;
  col: number;
  kind: NodeKind;
  next: string[];
}

export interface StageMap {
  rows: number;
  cols: number;
  nodes: MapNode[];
}

const nodeId = (row: number, col: number) => `n${row}-${col}`;

function pick<T>(list: readonly T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length)]!;
}

function weighted<T extends string>(weights: Partial<Record<T, number>>, rng: Rng): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let x = rng() * total;
  for (const [k, w] of entries) if ((x -= w) < 0) return k;
  return entries[entries.length - 1]![0];
}

/** Colunas ocupadas de cada linha: 3 começos, depois 2–4 nós por linha, chefe sozinho no topo. */
function layout(rows: number, cols: number, rng: Rng): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < rows; r++) {
    if (r === rows - 1) {
      out.push([Math.floor(cols / 2)]);
      continue;
    }
    const n = r === 0 ? 3 : 2 + Math.floor(rng() * (cols - 1));
    const all = Array.from({ length: cols }, (_, i) => i);
    const chosen: number[] = [];
    while (chosen.length < Math.min(n, cols)) {
      const c = pick(all.filter((x) => !chosen.includes(x)), rng);
      chosen.push(c);
    }
    out.push(chosen.sort((a, b) => a - b));
  }
  return out;
}

/** Liga cada nó a 1–2 nós da linha de cima (coluna mais próxima), sem deixar nó sem entrada. */
function connect(layoutRows: number[][], rng: Rng): Map<string, string[]> {
  const edges = new Map<string, string[]>();
  for (let r = 0; r < layoutRows.length - 1; r++) {
    const cur = layoutRows[r]!;
    const up = layoutRows[r + 1]!;
    const near = (c: number) => [...up].sort((a, b) => Math.abs(a - c) - Math.abs(b - c));
    for (const c of cur) {
      const options = near(c);
      const targets = [options[0]!];
      if (options[1] !== undefined && Math.abs(options[1] - c) <= 1 && rng() < 0.45) targets.push(options[1]);
      edges.set(nodeId(r, c), targets.map((u) => nodeId(r + 1, u)));
    }
    // Nó de cima sem entrada: recebe uma aresta do nó mais próximo de baixo.
    for (const u of up) {
      const id = nodeId(r + 1, u);
      if ([...edges.values()].some((list) => list.includes(id))) continue;
      const from = [...cur].sort((a, b) => Math.abs(a - u) - Math.abs(b - u))[0]!;
      edges.get(nodeId(r, from))!.push(id);
    }
  }
  return edges;
}

/** Tipo de cada nó pelas regras de linha (docs/jornada/run.md#mapa-ramificado). */
function kindFor(row: number, rows: number, rng: Rng, data: JornadaData): NodeKind {
  const g = data.j.map;
  if (row === rows - 1) return 'boss';
  if (row === 0) return 'fight';
  if (row === g.treasureRow) return 'treasure';
  if (row === rows - 2) return 'rest';
  const w: Partial<Record<NodeKind, number>> = { ...g.weights };
  if (row < g.eliteFromRow) delete w.elite;
  if (row < g.restFromRow) delete w.rest;
  return weighted(w, rng);
}

export function generateMap(rng: Rng, data: JornadaData): StageMap {
  const rows = data.j.map.rows;
  const cols = data.j.map.cols;
  const lay = layout(rows, cols, rng);
  const edges = connect(lay, rng);
  const nodes: MapNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (const c of lay[r]!) {
      const id = nodeId(r, c);
      const kind = kindFor(r, rows, rng, data);
      nodes.push({ id, row: r, col: c, kind, next: edges.get(id) ?? [] });
    }
  }
  return { rows, cols, nodes };
}

export const mapNode = (map: StageMap, id: string): MapNode => {
  const n = map.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`nó desconhecido: ${id}`);
  return n;
};

/** Nós que dá para escolher agora: os começos (sem nó atual) ou os ligados ao último nó feito. */
export function nextNodes(map: StageMap, lastDone: string | null): MapNode[] {
  if (!lastDone) return map.nodes.filter((n) => n.row === 0);
  return mapNode(map, lastDone).next.map((id) => mapNode(map, id));
}

/** Nós alcançáveis a partir dos começos (teste: todo nó precisa estar aqui). */
export const reachable = (map: StageMap): Set<string> => reachableFrom(map, map.nodes.filter((n) => n.row === 0).map((n) => n.id));

/** Nós alcançáveis a partir destes (eles inclusos). A tela apaga o que já ficou para trás. */
export function reachableFrom(map: StageMap, starts: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [...starts];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...mapNode(map, id).next);
  }
  return seen;
}
