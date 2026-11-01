import type { GameData } from './gameData';
import type { Rng } from './rng';
import { chanceSlices, spin, type Slice } from './roulette';
import type { Element, KekkeiGenkaiId, LineageDef, Origin } from './types';

export type OriginStepKind = 'lineage' | 'elementCount' | 'element' | 'kekkeiGenkai' | 'jinchuuriki';

/** Uma roleta girada na criação, com as fatias e o resultado, para a UI animar. */
export interface OriginStep {
  kind: OriginStepKind;
  slices: Slice<string>[];
  index: number;
}

export interface OriginRoll {
  origin: Origin;
  steps: OriginStep[];
}

/** Id da origem comum na roleta (no `Origin`, a comum é `lineageId: null`). */
export const COMMON_LINEAGE = 'common';

/** Definição da origem (a comum também é uma linhagem nos dados). */
export function lineageOf(lineageId: string | null, data: GameData): LineageDef {
  const id = lineageId ?? COMMON_LINEAGE;
  const lineage = data.lineages.find((l) => l.id === id);
  if (!lineage) throw new Error(`Linhagem desconhecida: ${id}`);
  return lineage;
}

function step(kind: OriginStepKind, slices: Slice<string>[], rng: Rng): OriginStep {
  return { kind, slices, index: spin(slices, rng).index };
}

function stepValue(s: OriginStep): string {
  return s.slices[s.index]!.value;
}

/**
 * Elementos da origem: a quantidade (roleta, se houver mais de uma possível) e depois um giro por elemento,
 * sem repetir. O elemento fixo da linhagem entra primeiro e conta na quantidade.
 */
export function rollElements(lineage: LineageDef, rng: Rng, data: GameData): { elements: Element[]; steps: OriginStep[] } {
  const steps: OriginStep[] = [];
  const rule = lineage.elements;
  const counts = rule.countWeights.map((weight, n) => ({ label: String(n), weight, value: String(n) })).filter((s) => s.weight > 0);
  let count = Number(counts[0]?.value ?? 0);
  if (counts.length > 1) {
    const countStep = step('elementCount', counts, rng);
    steps.push(countStep);
    count = Number(stepValue(countStep));
  }
  const elements: Element[] = rule.fixed ? [rule.fixed] : [];
  while (elements.length < count) {
    const pool = (Object.keys(data.elementWeights) as Element[]).filter((e) => !elements.includes(e));
    const elementStep = step(
      'element',
      pool.map((e) => ({ label: e, weight: data.elementWeights[e], value: e })),
      rng,
    );
    steps.push(elementStep);
    elements.push(stepValue(elementStep) as Element);
  }
  return { elements, steps };
}

/** Kekkei genkai possíveis: os dois pais entre os elementos e potencial pleno (a Madeira só para o Senju). */
export function kekkeiGenkaiCandidates(lineage: LineageDef, elements: Element[], data: GameData) {
  const full = lineage.elementalPotential === 'full' || lineage.elementalPotential === 'fixedOnly';
  return data.kekkeiGenkai.filter(
    (k) => full && k.parents.every((e) => elements.includes(e)) && (!k.lineages || k.lineages.includes(lineage.id)),
  );
}

/**
 * Roleta da kekkei genkai: uma fatia por candidata (a chance dividida entre elas) e o resto para "nenhuma".
 * Sem candidata, não gira.
 */
export function rollKekkeiGenkai(
  lineage: LineageDef,
  elements: Element[],
  rng: Rng,
  data: GameData,
): { kekkeiGenkai: KekkeiGenkaiId | null; steps: OriginStep[] } {
  const candidates = kekkeiGenkaiCandidates(lineage, elements, data);
  if (candidates.length === 0) return { kekkeiGenkai: null, steps: [] };
  const total = Math.max(...candidates.map((k) => k.chance));
  const slices = [
    ...candidates.map((k) => ({ label: k.id, weight: total / candidates.length, value: k.id as string })),
    { label: 'none', weight: 1 - total, value: 'none' },
  ];
  const kgStep = step('kekkeiGenkai', slices, rng);
  const value = stepValue(kgStep);
  return { kekkeiGenkai: value === 'none' ? null : (value as KekkeiGenkaiId), steps: [kgStep] };
}

/**
 * Sequência de rolagens da origem:
 * 1. linhagem: uma roleta só, com os níveis comum, clã e rara;
 * 2. quantidade de elementos e cada elemento (`rollElements`);
 * 3. jinchuuriki, independente das anteriores.
 */
export function rollOrigin(rng: Rng, data: GameData): OriginRoll {
  const steps: OriginStep[] = [];

  const lineageStep = step(
    'lineage',
    data.lineages.map((l) => ({ label: l.id, weight: l.weight, value: l.id })),
    rng,
  );
  steps.push(lineageStep);

  const lineage = lineageOf(stepValue(lineageStep), data);
  const rolled = rollElements(lineage, rng, data);
  steps.push(...rolled.steps);
  const kg = rollKekkeiGenkai(lineage, rolled.elements, rng, data);
  steps.push(...kg.steps);

  const jinStep = step(
    'jinchuuriki',
    chanceSlices(data.balance.origin.jinchuurikiChance, { label: 'yes', value: 'yes' }, { label: 'no', value: 'no' }),
    rng,
  );
  steps.push(jinStep);

  return {
    origin: {
      lineageId: lineage.id === COMMON_LINEAGE ? null : lineage.id,
      elements: rolled.elements,
      jinchuuriki: stepValue(jinStep) === 'yes',
      kekkeiGenkai: kg.kekkeiGenkai,
    },
    steps,
  };
}
