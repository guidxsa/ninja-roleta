import type { GameData } from './gameData';
import type { Rng } from './rng';
import { chanceSlices, spin, type Slice } from './roulette';
import type { Element, Origin } from './types';

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

/** Valor da fatia "comum" na roleta de linhagem. */
export const COMMON_LINEAGE = 'common';

function step(kind: OriginStepKind, slices: Slice<string>[], rng: Rng): OriginStep {
  return { kind, slices, index: spin(slices, rng).index };
}

function stepValue(s: OriginStep): string {
  return s.slices[s.index]!.value;
}

/**
 * Sequência de rolagens da origem:
 * 1. linhagem: uma roleta só, com a fatia comum e as linhagens especiais;
 * 2. afinidade, se a linhagem rolar (comuns, Hyuuga, Uzumaki);
 * 3. jinchuuriki, independente das anteriores.
 */
export function rollOrigin(rng: Rng, data: GameData): OriginRoll {
  const { origin: cfg } = data.balance;
  const steps: OriginStep[] = [];

  const lineageStep = step(
    'lineage',
    [
      { label: COMMON_LINEAGE, weight: cfg.commonWeight, value: COMMON_LINEAGE },
      ...data.lineages.map((l) => ({ label: l.id, weight: l.weight, value: l.id })),
    ],
    rng,
  );
  steps.push(lineageStep);

  let lineageId: string | null = null;
  let affinity: Element | null = null;
  let rollAffinity = true;

  if (stepValue(lineageStep) !== COMMON_LINEAGE) {
    lineageId = stepValue(lineageStep);
    const lineage = data.lineages.find((l) => l.id === lineageId)!;
    if (lineage.affinity.kind === 'fixed') {
      affinity = lineage.affinity.element;
      rollAffinity = false;
    } else if (lineage.affinity.kind === 'none') {
      rollAffinity = false;
    }
  }

  if (rollAffinity) {
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
    chanceSlices(cfg.jinchuurikiChance, { label: 'yes', value: 'yes' }, { label: 'no', value: 'no' }),
    rng,
  );
  steps.push(jinStep);

  return {
    origin: { lineageId, affinity, jinchuuriki: stepValue(jinStep) === 'yes' },
    steps,
  };
}
