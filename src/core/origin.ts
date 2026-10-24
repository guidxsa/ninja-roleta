import type { GameData } from './gameData';
import type { Rng } from './rng';
import { chanceSlices, spin, type Slice } from './roulette';
import type { Element, LineageDef, Origin } from './types';

export type OriginStepKind = 'lineage' | 'affinity' | 'jinchuuriki';

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
 * Sequência de rolagens da origem:
 * 1. linhagem: uma roleta só, com os níveis comum, clã e rara;
 * 2. afinidade, se a linhagem não tem afinidade fixa (nem é o prodígio, que não tem nenhuma);
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
  let affinity: Element | null = null;
  if (lineage.affinity.kind === 'fixed') {
    affinity = lineage.affinity.element;
  } else if (lineage.affinity.kind === 'rolled') {
    const affinityStep = step(
      'affinity',
      (Object.keys(data.elementWeights) as Element[]).map((e) => ({
        label: e,
        weight: data.elementWeights[e],
        value: e,
      })),
      rng,
    );
    steps.push(affinityStep);
    affinity = stepValue(affinityStep) as Element;
  }

  const jinStep = step(
    'jinchuuriki',
    chanceSlices(data.balance.origin.jinchuurikiChance, { label: 'yes', value: 'yes' }, { label: 'no', value: 'no' }),
    rng,
  );
  steps.push(jinStep);

  return {
    origin: {
      lineageId: lineage.id === COMMON_LINEAGE ? null : lineage.id,
      affinity,
      jinchuuriki: stepValue(jinStep) === 'yes',
    },
    steps,
  };
}
