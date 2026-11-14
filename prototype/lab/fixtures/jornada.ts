// Runs da Jornada montadas pelas regras reais (seed fixa), para cenários que precisam de save ou de uma run em andamento.
import type { Difficulty } from '../../../src/core/difficulty';
import { newGenericRun, newRun, type JRun } from '../../../src/core/jornada/run';
import { jornadaData } from '../../../src/data/jornada/index';
import { saveJornada } from '../../../src/state/jornadaSave';
import type { KeyValueStorage } from '../../../src/state/runHistory';

/** Run nova da História (campanha do Naruto). */
export const storyRun = (seed = 7, difficulty: Difficulty = 'normal'): JRun => newRun(seed, difficulty, jornadaData);

/** Run nova do Caminho Ninja (Comum, elemento sorteado). */
export const pathRun = (seed = 7, difficulty: Difficulty = 'normal'): JRun => newGenericRun(seed, difficulty, 'common', jornadaData);

/** Grava a run como o save da Jornada (no armazenamento em memória do cenário). */
export function saveRun(storage: KeyValueStorage, run: JRun): void {
  if (!saveJornada(storage, run)) throw new Error('fixture: o save da Jornada não gravou');
}
