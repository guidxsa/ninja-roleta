import type { JRun } from '../core/jornada/run';
import type { KeyValueStorage } from './runHistory';

// Run da Jornada salva no aparelho a cada parada (docs/jornada/run.md#salvamento). É a exceção ao
// "F5 reseta": uma Jornada dura mais que uma sessão. Uma luta em andamento não é salva: volta para o
// começo da parada.

export const JORNADA_SAVE_KEY = 'jornada_run_v1';
const STARTER_RELIC = 'ichirakuBowl';

export function loadJornada(storage: KeyValueStorage): JRun | null {
  try {
    const raw = storage.getItem(JORNADA_SAVE_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as JRun;
    if (run?.version !== 1 || run.status !== 'inProgress' || typeof run.stageIndex !== 'number') return null;
    // Runs salvas antes da v0.35.1 não tinham a relíquia inicial.
    const relics = run.relics.includes(STARTER_RELIC) ? run.relics : [STARTER_RELIC, ...run.relics];
    // Runs de antes do Caminho Ninja (v0.36.0) são da História.
    const legacy = { mode: 'canon' as const, hero: 'naruto', classId: 'naruto', elements: {}, secondElement: null, skin: null, supports: [], map: null, nodeId: null, path: [], bossPlan: [] };
    return { ...legacy, ...run, cleared: run.cleared ?? [], relics };
  } catch {
    return null;
  }
}

export function saveJornada(storage: KeyValueStorage, run: JRun): void {
  try {
    if (run.status === 'inProgress') storage.setItem(JORNADA_SAVE_KEY, JSON.stringify(run));
    else clearJornada(storage);
  } catch {
    // Armazenamento cheio ou bloqueado: a run segue em memória.
  }
}

export function clearJornada(storage: KeyValueStorage): void {
  try {
    storage.setItem(JORNADA_SAVE_KEY, '');
  } catch {
    /* conveniência */
  }
}
