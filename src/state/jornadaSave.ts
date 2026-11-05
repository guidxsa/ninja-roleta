import { heroMovable, MOVESET_SIZE, type JRun } from '../core/jornada/run';
import { jornadaData } from '../data/jornada';
import { RELIC_RENAMES } from '../data/jornada/relics';
import { jTechniquesById } from '../data/jornada/techniques';
import type { KeyValueStorage } from './runHistory';

// Run da Jornada salva no aparelho a cada parada (docs/jornada/run.md#salvamento). É a exceção ao
// "F5 reseta": uma Jornada dura mais que uma sessão. Uma luta em andamento não é salva: volta para o
// começo da parada.

export const JORNADA_SAVE_KEY = 'jornada_run_v1';
const STARTER_RELIC = 'irukaHeadband';
const STARTER_EVOLVED = 'firstHokageNecklace';

/** Troca os ids de relíquia que mudaram (v0.43.0: iniciais novas e o Talismã da Vontade do Fogo). */
export const renameRelicIds = (ids: readonly string[]) => [...new Set(ids.map((id) => RELIC_RENAMES[id] ?? id))];

export function loadJornada(storage: KeyValueStorage): JRun | null {
  try {
    const raw = storage.getItem(JORNADA_SAVE_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as JRun;
    if (run?.version !== 1 || run.status !== 'inProgress' || typeof run.stageIndex !== 'number') return null;
    run.relics = renameRelicIds(run.relics ?? []);
    // Runs da História salvas antes da v0.35.1 não tinham a relíquia inicial (ou a sua evolução).
    const hasStarter = (run.mode ?? 'canon') !== 'canon' || run.relics.includes(STARTER_RELIC) || run.relics.includes(STARTER_EVOLVED);
    const relics = hasStarter ? run.relics : [STARTER_RELIC, ...run.relics];
    // Runs de antes do Caminho Ninja (v0.36.0) são da História.
    const legacy = {
      mode: 'canon' as const,
      hero: 'naruto',
      classId: 'naruto',
      elements: {},
      secondElement: null,
      elementPick: 'fixed' as const,
      skin: null,
      supports: [],
      names: {},
      map: null,
      nodeId: null,
      path: [],
      bossPlan: [],
    };
    // Técnicas que saíram do jogo (o Quinto portão virou os Portões em níveis na v0.42.0) somem da run.
    const known = (ids: string[]) => ids.filter((id) => id in jTechniquesById);
    // Antes do modo infinito (v0.44.0) não havia ciclo nem o retrato das conquistas da árvore.
    const cycle = typeof run.cycle === 'number' ? run.cycle : 0;
    const unlocks = Array.isArray(run.unlocks) ? run.unlocks : [];
    const loaded: JRun = { ...legacy, ...run, cycle, unlocks, learned: known(run.learned ?? []), moveset: known(run.moveset ?? []), cleared: run.cleared ?? [], relics, talentRanks: run.talentRanks ?? {} };
    return withoutStaleElements(loaded);
  } catch {
    return null;
  }
}

/**
 * Fichas sem elemento (Hyuuga, desde a v0.43.0) perdem o elemento sorteado em saves antigos, e o moveset perde a
 * técnica elemental que o protagonista não conhece mais.
 */
function withoutStaleElements(run: JRun): JRun {
  const stale = Object.keys(run.elements).filter((id) => jornadaData.characters[id]?.noElement && run.elements[id] !== null);
  const heroCls = jornadaData.generic.classes.find((c) => c.hero === run.hero);
  if (run.mode === 'generic' && heroCls?.noElement && run.elements[run.hero]) stale.push(run.hero);
  if (!stale.length) return run;
  const elements = { ...run.elements };
  for (const id of stale) elements[id] = null;
  const next = { ...run, elements };
  const movable = heroMovable(next, jornadaData);
  const moveset = next.moveset.filter((id) => movable.includes(id));
  return { ...next, moveset: moveset.length ? moveset : movable.slice(0, MOVESET_SIZE) };
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
