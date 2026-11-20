// Contexto de um cenário: armazenamento em memória, sessão do jogo montada sobre ele, seed fixa e dados congelados.
// Nada aqui toca o armazenamento do navegador: o perfil, as preferências e os saves do cenário vivem e morrem com o quadro.
import { createRng } from '../../src/core/rng';
import { gameData } from '../../src/data/index';
import { jornadaData } from '../../src/data/jornada/index';
import { roletaData } from '../../src/data/roleta/index';
import { allRelics } from '../../src/data/relics';
import { emptyProfile, saveProfile } from '../../src/state/profile';
import type { KeyValueStorage } from '../../src/state/runHistory';
import { jornadaHost } from '../jornadaHost';
import { DEFAULT_DIFFICULTY, initSession, SETTINGS_KEY, type Settings } from '../roleta/session';
import type { LabContext, LabPrefs, Scenario } from './types';

/** Data em que o lab congela `Date.now` (os "há N dias" das conquistas ficam estáveis). */
export const LAB_NOW = Date.parse('2026-11-01T12:00:00.000Z');

/** `KeyValueStorage` num mapa, opcionalmente já com valores. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { keys(): string[] } {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    keys: () => [...map.keys()],
  };
}

/** Congela os dados do jogo: um cenário que tentar mudar regra ou número quebra na hora, em vez de passar despercebido. */
export function freezeGameData(): void {
  const seen = new WeakSet<object>();
  const deep = (o: unknown): void => {
    if (o === null || (typeof o !== 'object' && typeof o !== 'function') || seen.has(o as object)) return;
    seen.add(o as object);
    for (const k of Reflect.ownKeys(o as object)) deep((o as Record<PropertyKey, unknown>)[k]);
    Object.freeze(o);
  };
  for (const d of [gameData, roletaData, jornadaData, allRelics]) deep(d);
}

/** Torna o quadro determinístico: `Math.random` pela seed e `Date.now` parado em LAB_NOW. Só na página do lab. */
export function makeDeterministic(seed: number): void {
  Math.random = createRng((seed * 2654435761) >>> 0);
  Date.now = () => LAB_NOW;
}

/** Monta a sessão do jogo sobre um armazenamento novo, com o perfil e as preferências do cenário. */
export function labContext(scenario: Scenario, prefs: LabPrefs, seed = scenario.seed ?? 1): LabContext {
  const storage = memoryStorage();
  saveProfile(storage, { ...(scenario.profile?.() ?? emptyProfile()), backfilled: true });
  const settings: Settings = { instant: prefs.instant, difficulty: DEFAULT_DIFFICULTY, sfx: false, music: false, animated: false };
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  scenario.setup?.(storage);
  initSession(storage, seed);
  return { storage, rng: createRng(seed), seed, prefs, jornadaHost };
}
