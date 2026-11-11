import type { Difficulty } from '../core/difficulty';
import type { Element, Origin } from '../core/types';


export const RUNS_STORAGE_KEY = 'runs_v1';

export type RunStatus = 'inProgress' | 'victory' | 'defeat' | 'abandoned' | 'reroll';

export interface RunRecord {
  id: string;
  startedAt: string;
  updatedAt: string;
  origin: Origin;
  status: RunStatus;
  /** Índice da etapa da campanha mais avançada alcançada. */
  furthestStage: number;
  revivesUsed: number;
  /** Ausente nos registros antigos (antes da escolha de dificuldade). */
  difficulty?: Difficulty;
  /** Seed das roletas da run (`?seed=` repete). Ausente nos registros antigos. */
  seed?: number;
  /** Roleta enxuto (v0.46.0): ciclo alcançado (contando do 0) e lutas vencidas. Ausentes nos registros da campanha antiga. */
  cycle?: number;
  fights?: number;
}

/** Subconjunto do `localStorage` usado aqui (injetável nos testes). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Guarda o valor que não deu para ler em `<chave>_backup` antes que a próxima gravação o substitua (quem lê devolve
 * vazio, e a gravação seguinte apagaria tudo). Fica a primeira cópia: um segundo problema não apaga a primeira.
 */
export function backupUnreadable(storage: KeyValueStorage, key: string, raw: string): void {
  try {
    const backupKey = `${key}_backup`;
    if (!storage.getItem(backupKey)) storage.setItem(backupKey, raw);
  } catch {
    /* sem espaço: não há o que fazer */
  }
}

/** Registro com o mínimo para as telas (uma linha estragada não derruba o histórico inteiro). */
const isRecord = (r: unknown): r is RunRecord =>
  typeof r === 'object' && r !== null && typeof (r as RunRecord).id === 'string' && typeof (r as RunRecord).origin === 'object' && (r as RunRecord).origin !== null;

export function loadRuns(storage: KeyValueStorage): RunRecord[] {
  let raw: string | null = null;
  try {
    raw = storage.getItem(RUNS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) throw new Error('histórico não é uma lista');
    if (raw && !parsed.every(isRecord)) backupUnreadable(storage, RUNS_STORAGE_KEY, raw);
    return parsed.filter(isRecord).map(migrateOrigin);
  } catch {
    if (raw) backupUnreadable(storage, RUNS_STORAGE_KEY, raw);
    return [];
  }
}

/** Registros de antes da v0.30 guardam `affinity` (um elemento ou null) no lugar de `elements`. */
function migrateOrigin(run: RunRecord): RunRecord {
  const o = run.origin as Origin & { affinity?: Element | null };
  if (Array.isArray(o.elements)) return run;
  const { affinity, ...rest } = o;
  return { ...run, origin: { ...rest, elements: affinity ? [affinity] : [] } };
}

function saveRuns(storage: KeyValueStorage, runs: RunRecord[], maxRuns: number): void {
  try {
    storage.setItem(RUNS_STORAGE_KEY, JSON.stringify(runs.slice(0, maxRuns)));
  } catch {
    // Armazenamento cheio ou bloqueado: o histórico é conveniência, o jogo segue.
  }
}

/** Mais recente primeiro. */
export function startRun(
  storage: KeyValueStorage,
  run: { id: string; origin: Origin; now: Date; seed?: number },
  maxRuns: number,
): RunRecord {
  const record: RunRecord = {
    id: run.id,
    startedAt: run.now.toISOString(),
    updatedAt: run.now.toISOString(),
    origin: run.origin,
    status: 'inProgress',
    furthestStage: 0,
    revivesUsed: 0,
    ...(run.seed !== undefined ? { seed: run.seed } : {}),
  };
  saveRuns(storage, [record, ...loadRuns(storage)], maxRuns);
  return record;
}

export function updateRun(
  storage: KeyValueStorage,
  id: string,
  patch: Partial<Pick<RunRecord, 'status' | 'furthestStage' | 'revivesUsed' | 'difficulty' | 'cycle' | 'fights'>>,
  now: Date,
  maxRuns: number,
): void {
  // Uma run vencida continua vencida: sair, abandonar ou cair depois (no modo infinito) só atualiza até onde chegou.
  const runs = loadRuns(storage).map((r) =>
    r.id === id
      ? { ...r, ...patch, ...(r.status === 'victory' && patch.status && patch.status !== 'victory' ? { status: 'victory' as const } : {}), updatedAt: now.toISOString() }
      : r,
  );
  saveRuns(storage, runs, maxRuns);
}

/**
 * O hardcore só libera depois de vencer uma run na dificuldade `unlockedBy` (ou no próprio hardcore).
 */
export function isHardcoreUnlocked(runs: RunRecord[], unlockedBy: Difficulty): boolean {
  return runs.some((r) => r.status === 'victory' && (r.difficulty === unlockedBy || r.difficulty === 'hardcore'));
}

/** Ao carregar a página: toda run "em andamento" que sobrou foi abandonada (F5, aba fechada). */
export function markAbandonedRuns(storage: KeyValueStorage, now: Date, maxRuns: number): number {
  let count = 0;
  const runs = loadRuns(storage).map((r) => {
    if (r.status !== 'inProgress') return r;
    count++;
    return { ...r, status: 'abandoned' as const, updatedAt: now.toISOString() };
  });
  if (count > 0) saveRuns(storage, runs, maxRuns);
  return count;
}
