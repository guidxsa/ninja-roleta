import { describe, expect, it } from 'vitest';
import { achievements } from '../src/data/achievements';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { arcadeLobbySummary, difficultyRecord, recentArcadeAchievements } from '../src/state/arcadeLobby';
import { emptyProfile } from '../src/state/profile';
import type { RunRecord } from '../src/state/runHistory';

const run = (id: string, startedAt: string, patch: Partial<RunRecord> = {}): RunRecord => ({
  id,
  startedAt,
  updatedAt: startedAt,
  origin: { lineageId: null, elements: ['fire'], kekkeiGenkai: null, jinchuuriki: false } as RunRecord['origin'],
  status: 'defeat',
  furthestStage: 0,
  revivesUsed: 0,
  difficulty: 'normal',
  cycle: 0,
  fights: 2,
  ...patch,
});

describe('resumo do lobby do Arcade', () => {
  it('histórico vazio: zeros, sem melhor ciclo e sem últimas runs', () => {
    expect(arcadeLobbySummary(emptyProfile(), [])).toEqual({ runs: 0, wins: 0, bestCycle: null, originsPlayed: 0, originsWon: 0, lastRuns: [] });
  });

  it('re-rolls não contam; vitórias, melhor ciclo e origens vêm do histórico', () => {
    const runs = [
      run('a', '2026-11-20T10:00:00Z', { status: 'victory', cycle: 1, fights: 9, origin: { lineageId: 'uchiha', elements: ['fire'], kekkeiGenkai: null, jinchuuriki: false } as RunRecord['origin'] }),
      run('b', '2026-11-19T10:00:00Z', { status: 'reroll', cycle: 4 }),
      run('c', '2026-11-18T10:00:00Z'),
    ];
    const s = arcadeLobbySummary(emptyProfile(), runs);
    expect(s.runs).toBe(2);
    expect(s.wins).toBe(1);
    expect(s.bestCycle).toBe(2);
    expect(s.originsPlayed).toBe(2);
    expect(s.originsWon).toBe(1);
    expect(s.lastRuns.map((r) => r.id)).toEqual(['a', 'c']);
  });

  it('o recorde do perfil entra no melhor ciclo', () => {
    const profile = { ...emptyProfile(), roleta: { cycle: 5, fights: 30 } };
    expect(arcadeLobbySummary(profile, [run('a', '2026-11-20T10:00:00Z')]).bestCycle).toBe(5);
  });

  it('últimas runs: as mais novas primeiro, no limite pedido', () => {
    const runs = [run('velha', '2026-11-01T10:00:00Z'), run('nova', '2026-11-25T10:00:00Z'), run('meio', '2026-11-10T10:00:00Z'), run('sem-data', '')];
    expect(arcadeLobbySummary(emptyProfile(), runs, 2).lastRuns.map((r) => r.id)).toEqual(['nova', 'meio']);
    expect(arcadeLobbySummary(emptyProfile(), runs, 0).lastRuns).toEqual([]);
  });
});

describe('desempenho por dificuldade', () => {
  it('conta só a dificuldade pedida, sem re-rolls, com o melhor ciclo', () => {
    const runs = [
      run('a', '2026-11-20T10:00:00Z', { difficulty: 'hard', status: 'victory', cycle: 0 }),
      run('b', '2026-11-19T10:00:00Z', { difficulty: 'hard', status: 'reroll', cycle: 3 }),
      run('c', '2026-11-18T10:00:00Z', { difficulty: 'hard', cycle: 1 }),
      run('d', '2026-11-17T10:00:00Z', { difficulty: 'easy', status: 'victory' }),
    ];
    expect(difficultyRecord(runs, 'hard')).toEqual({ runs: 2, wins: 1, bestCycle: 2 });
    expect(difficultyRecord(runs, 'hardcore')).toEqual({ runs: 0, wins: 0, bestCycle: null });
  });

  it('registro da campanha antiga (sem lutas) conta a run, mas não o ciclo', () => {
    const old = run('a', '2026-01-01T10:00:00Z', { cycle: undefined, fights: undefined, difficulty: 'normal' });
    expect(difficultyRecord([old], 'normal')).toEqual({ runs: 1, wins: 0, bestCycle: null });
  });
});

describe('conquistas recentes do Arcade', () => {
  const arcadeIds = achievements.map((a) => a.id);
  const now = new Date('2026-11-27T12:00:00Z');

  it('só as do Arcade, das mais novas para as mais antigas, com os dias', () => {
    const jornadaId = jornadaAchievements[0]!.id;
    const [a, b, c, d] = arcadeIds;
    const profile = {
      ...emptyProfile(),
      achievements: {
        [a!]: '2026-11-20T12:00:00Z',
        [jornadaId]: '2026-11-27T11:00:00Z',
        [b!]: '2026-11-27T08:00:00Z',
        [c!]: '2026-11-25T12:00:00Z',
        [d!]: '2026-10-01T12:00:00Z',
        antiga_sem_catalogo: '2026-11-27T10:00:00Z',
      },
    };
    expect(recentArcadeAchievements(profile, arcadeIds, now)).toEqual([
      { id: b, days: 0 },
      { id: c, days: 2 },
      { id: a, days: 7 },
    ]);
  });

  it('data estragada fica de fora e o futuro conta como hoje', () => {
    const [a, b] = arcadeIds;
    const profile = { ...emptyProfile(), achievements: { [a!]: 'não é data', [b!]: '2026-11-28T12:00:00Z' } };
    expect(recentArcadeAchievements(profile, arcadeIds, now, 5)).toEqual([{ id: b, days: 0 }]);
  });
});
