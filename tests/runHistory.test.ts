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
import { bestRoletaCycle, emptyProfile, loadProfile, PROFILE_STORAGE_KEY, saveProfile, syncHardcoreUnlock } from '../src/state/profile';
import type { Origin } from '../src/core/types';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

const origin: Origin = { lineageId: null, elements: ['fire'], jinchuuriki: false };
const now = new Date('2026-10-21T12:00:00Z');

describe('histórico de runs', () => {
  it('registro de antes da v0.30 (afinidade única) vira lista de elementos', () => {
    const st = memoryStorage();
    const old = { id: 'x', startedAt: '', updatedAt: '', status: 'defeat', furthestStage: 1, revivesUsed: 0 };
    st.setItem(
      RUNS_STORAGE_KEY,
      JSON.stringify([
        { ...old, origin: { lineageId: 'nara', affinity: 'water', jinchuuriki: false } },
        { ...old, id: 'y', origin: { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false } },
      ]),
    );
    expect(loadRuns(st).map((r) => r.origin)).toEqual([
      { lineageId: 'nara', elements: ['water'], jinchuuriki: false },
      { lineageId: 'taijutsuProdigy', elements: [], jinchuuriki: false },
    ]);
  });

  it('guarda a seed da run quando há uma', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now, seed: 42 }, 100);
    startRun(st, { id: 'b', origin, now }, 100);
    expect(loadRuns(st).map((r) => r.seed)).toEqual([undefined, 42]);
  });

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

  it('o corrompido vai para o backup antes de a próxima run gravar por cima', () => {
    const st = memoryStorage();
    st.data.set(RUNS_STORAGE_KEY, '{oops');
    startRun(st, { id: 'a', origin, now }, 100);
    expect(st.data.get(`${RUNS_STORAGE_KEY}_backup`)).toBe('{oops');
    expect(loadRuns(st).map((r) => r.id)).toEqual(['a']);
    // Um segundo problema não apaga a primeira cópia.
    st.data.set(RUNS_STORAGE_KEY, '"outro"');
    loadRuns(st);
    expect(st.data.get(`${RUNS_STORAGE_KEY}_backup`)).toBe('{oops');
  });

  it('uma linha estragada não leva o histórico inteiro', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now }, 100);
    const good = JSON.parse(st.data.get(RUNS_STORAGE_KEY)!) as unknown[];
    st.data.set(RUNS_STORAGE_KEY, JSON.stringify([...good, { id: 'b', origin: null }, 7]));
    expect(loadRuns(st).map((r) => r.id)).toEqual(['a']);
    expect(st.data.has(`${RUNS_STORAGE_KEY}_backup`)).toBe(true);
  });
});

describe('perfil guardado', () => {
  it('perfil corrompido vai para o backup', () => {
    const st = memoryStorage();
    st.data.set(PROFILE_STORAGE_KEY, '{oops');
    expect(loadProfile(st)).toEqual(emptyProfile());
    expect(st.data.get(`${PROFILE_STORAGE_KEY}_backup`)).toBe('{oops');
  });

  it('o Hardcore liberado fica no perfil mesmo depois que a vitória sai do histórico', () => {
    const st = memoryStorage();
    startRun(st, { id: 'win', origin, now }, 3);
    updateRun(st, 'win', { status: 'victory', difficulty: 'hard' }, now, 3);
    let profile = syncHardcoreUnlock(emptyProfile(), loadRuns(st), 'hard');
    expect(profile.hardcoreUnlocked).toBe(true);
    saveProfile(st, profile);
    for (let i = 0; i < 5; i++) startRun(st, { id: String(i), origin, now }, 3);
    expect(isHardcoreUnlocked(loadRuns(st), 'hard')).toBe(false);
    profile = syncHardcoreUnlock(loadProfile(st), loadRuns(st), 'hard');
    expect(profile.hardcoreUnlocked).toBe(true);
    // Sem vitória que prove, nada muda (e devolve o mesmo perfil).
    const fresh = emptyProfile();
    expect(syncHardcoreUnlock(fresh, loadRuns(st), 'hard')).toBe(fresh);
  });

  it('o melhor ciclo junta o recorde do perfil e o histórico', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now }, 100);
    updateRun(st, 'a', { status: 'defeat', cycle: 1, fights: 8 }, now, 100);
    expect(bestRoletaCycle(emptyProfile(), [])).toBeNull();
    expect(bestRoletaCycle(emptyProfile(), loadRuns(st))).toBe(2);
    expect(bestRoletaCycle({ ...emptyProfile(), roleta: { cycle: 4, fights: 20 } }, loadRuns(st))).toBe(4);
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

  it('a vitória não se desfaz: sair, abandonar ou cair depois (modo infinito) só atualiza até onde chegou', () => {
    const st = memoryStorage();
    startRun(st, { id: 'a', origin, now }, 100);
    updateRun(st, 'a', { status: 'victory', difficulty: 'hard' }, now, 100);
    updateRun(st, 'a', { status: 'abandoned' }, now, 100);
    updateRun(st, 'a', { status: 'defeat', cycle: 2, fights: 9 }, now, 100);
    const r = loadRuns(st)[0]!;
    expect([r.status, r.cycle, r.fights]).toEqual(['victory', 2, 9]);
    expect(isHardcoreUnlocked(loadRuns(st), 'hard')).toBe(true);
  });
});
