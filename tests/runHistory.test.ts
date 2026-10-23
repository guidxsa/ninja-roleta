import { describe, expect, it } from 'vitest';
import {
  RUNS_STORAGE_KEY,
  isHardcoreUnlocked,
  loadRuns,
  markAbandonedRuns,
  startRun,
  updateRun,
  type KeyValueStorage,
} from '../src/state/runHistory';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

const origin = { lineageId: null, affinity: 'fire' as const, jinchuuriki: false };
const now = new Date('2026-10-21T12:00:00Z');

describe('histórico de runs', () => {
  it('grava a run como em andamento, mais recente primeiro', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now }, 100);
    startRun(st, { id: 'b', origin, now }, 100);
    expect(loadRuns(st).map((r) => [r.id, r.status])).toEqual([
      ['b', 'inProgress'],
      ['a', 'inProgress'],
    ]);
  });

  it('atualiza progresso e resultado', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now }, 100);
    updateRun(st, 'a', { furthestStage: 3, status: 'defeat', revivesUsed: 1 }, now, 100);
    expect(loadRuns(st)[0]).toMatchObject({ furthestStage: 3, status: 'defeat', revivesUsed: 1 });
  });

  it('ao carregar a página, runs em andamento viram abandonadas', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now }, 100);
    startRun(st, { id: 'b', origin, now }, 100);
    updateRun(st, 'b', { status: 'reroll' }, now, 100);
    expect(markAbandonedRuns(st, now, 100)).toBe(1);
    expect(loadRuns(st).map((r) => r.status)).toEqual(['reroll', 'abandoned']);
  });

  it('limita a quantidade guardada', () => {
    const st = memoryStorage();
    for (let i = 0; i < 5; i++) startRun(st, { id: String(i), origin, now }, 3);
    expect(loadRuns(st).map((r) => r.id)).toEqual(['4', '3', '2']);
  });

  it('dado corrompido não quebra o jogo', () => {
    const st = memoryStorage();
    st.data.set(RUNS_STORAGE_KEY, '{oops');
    expect(loadRuns(st)).toEqual([]);
  });
});

describe('hardcore', () => {
  it('só libera depois de vencer uma run no Difícil (ou no próprio hardcore)', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now }, 100);
    updateRun(st, 'a', { status: 'victory', difficulty: 'normal' }, now, 100);
    startRun(st, { id: 'b', origin, now }, 100);
    updateRun(st, 'b', { status: 'defeat', difficulty: 'hard' }, now, 100);
    expect(isHardcoreUnlocked(loadRuns(st), 'hard')).toBe(false);
    startRun(st, { id: 'c', origin, now }, 100);
    updateRun(st, 'c', { status: 'victory', difficulty: 'hard' }, now, 100);
    expect(isHardcoreUnlocked(loadRuns(st), 'hard')).toBe(true);
  });
});
