import type { GameData } from './gameData';
import type { Rng } from './rng';
import { chanceSlices, spin, type Slice } from './roulette';
import type { Element, Origin } from './types';

export type OriginStepKind = 'lineageTier' | 'lineage' | 'affinity' | 'jinchuuriki';

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

function step(kind: OriginStepKind, slices: Slice<string>[], rng: Rng): OriginStep {
  return { kind, slices, index: spin(slices, rng).index };
}

function stepValue(s: OriginStep): string {
  return s.slices[s.index]!.value;
}

/**
 * Sequência de rolagens da origem:
 * 1. comum ou especial; 2a. comum: afinidade; 2b. especial: qual linhagem (+ afinidade se a linhagem rolar);
 * 3. jinchuuriki, independente das anteriores.
 */
export function rollOrigin(rng: Rng, data: GameData): OriginRoll {
  const { origin: cfg } = data.balance;
  const steps: OriginStep[] = [];

  const tier = step(
    'lineageTier',
    chanceSlices(cfg.specialLineageChance, { label: 'special', value: 'special' }, { label: 'common', value: 'common' }),
    rng,
  );
  steps.push(tier);

  let lineageId: string | null = null;
  let affinity: Element | null = null;
  let rollAffinity = true;

  if (stepValue(tier) === 'special') {
    const lineageStep = step(
      'lineage',
      data.lineages.map((l) => ({ label: l.id, weight: l.weight, value: l.id })),
      rng,
    );
    steps.push(lineageStep);
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
