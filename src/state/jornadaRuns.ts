import type { Difficulty } from '../core/difficulty';
import type { JRun } from '../core/jornada/run';
import type { Element } from '../core/types';
import { backupUnreadable, type KeyValueStorage } from './runHistory';

// Histórico das runs da Jornada (docs/base/perfil.md#histórico-da-jornada): separado do `runs_v1` do Arcade, para não
// entrar nos recordes por origem, no melhor ciclo nem no desempenho por dificuldade.

export const JORNADA_RUNS_KEY = 'jornada_runs_v1';

export type JornadaRunStatus = 'victory' | 'defeat' | 'abandoned';

export interface JornadaRunRecord {
  /** Modo e seed da run: a Campanha regrava o mesmo registro a cada ciclo. */
  id: string;
  mode: 'canon' | 'generic';
  hero: string;
  classId: string;
  /** História: a perspectiva (sem o campo: a do Naruto). */
  campaign?: string;
  element: Element | null;
  secondElement: Element | null;
  difficulty: Difficulty;
  status: JornadaRunStatus;
  /** Ciclo, estágio e parada alcançados, contando do 0 como no save. */
  cycle: number;
  stageIndex: number;
  stopIndex: number;
  level: number;
  relics: string[];
  alliesLost: number;
  fights: number;
  wins: number;
  bestHit: number;
  startedAt: string;
  updatedAt: string;
}

const isRecord = (r: unknown): r is JornadaRunRecord =>
  typeof r === 'object' && r !== null && typeof (r as JornadaRunRecord).id === 'string' && typeof (r as JornadaRunRecord).mode === 'string';

/** Mais recente primeiro. Uma linha estragada não derruba o histórico inteiro. */
export function loadJornadaRuns(storage: KeyValueStorage): JornadaRunRecord[] {
  let raw: string | null = null;
  try {
    raw = storage.getItem(JORNADA_RUNS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) throw new Error('histórico não é uma lista');
    if (raw && !parsed.every(isRecord)) backupUnreadable(storage, JORNADA_RUNS_KEY, raw);
    return parsed.filter(isRecord);
  } catch {
    if (raw) backupUnreadable(storage, JORNADA_RUNS_KEY, raw);
    return [];
  }
}

/** O registro de uma run, lido do save. `abandoned`: a run foi trocada por outra antes de acabar. */
export function jornadaRunRecord(run: JRun, now: Date, abandoned = false): JornadaRunRecord {
  const at = now.toISOString();
  return {
    id: `${run.mode}:${run.seed}`,
    mode: run.mode,
    hero: run.hero,
    classId: run.classId,
    ...(run.campaign ? { campaign: run.campaign } : {}),
    element: run.elements[run.hero] ?? null,
    secondElement: run.secondElement,
    difficulty: run.difficulty,
    status: run.status === 'victory' ? 'victory' : run.status === 'defeat' && !abandoned ? 'defeat' : 'abandoned',
    cycle: run.cycle,
    stageIndex: run.stageIndex,
    stopIndex: run.stopIndex,
    level: run.level,
    relics: [...run.relics],
    alliesLost: run.stats.alliesLost,
    fights: run.stats.fights,
    wins: run.stats.wins,
    bestHit: run.stats.bestHit,
    startedAt: at,
    updatedAt: at,
  };
}

/**
 * Grava (ou regrava) a run no topo do histórico. A Campanha passa aqui a cada ciclo: o registro guarda a primeira data,
 * e uma run que já venceu um ciclo continua vencida se cair depois (como no Arcade).
 */
export function recordJornadaRun(storage: KeyValueStorage, record: JornadaRunRecord, maxRuns: number): void {
  const runs = loadJornadaRuns(storage);
  const prev = runs.find((r) => r.id === record.id);
  const next: JornadaRunRecord = prev
    ? { ...record, startedAt: prev.startedAt, ...(prev.status === 'victory' ? { status: 'victory' as const } : {}) }
    : record;
  try {
    storage.setItem(JORNADA_RUNS_KEY, JSON.stringify([next, ...runs.filter((r) => r.id !== record.id)].slice(0, maxRuns)));
  } catch {
    // Armazenamento cheio ou bloqueado: o histórico é conveniência, o jogo segue.
  }
}
