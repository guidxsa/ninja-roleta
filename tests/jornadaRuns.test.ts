import { describe, expect, it } from 'vitest';
import { foeFights } from '../src/core/jornada/foes';
import { newRun } from '../src/core/jornada/run';
import type { JBattle } from '../src/core/jornada/types';
import { jornadaData } from '../src/data/jornada';
import { JORNADA_RUNS_KEY, jornadaRunRecord, loadJornadaRuns, recordJornadaRun } from '../src/state/jornadaRuns';
import { emptyProfile, loadProfile, PROFILE_STORAGE_KEY, recordJornadaFight } from '../src/state/profile';
import type { KeyValueStorage } from '../src/state/runHistory';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const t0 = new Date('2026-11-25T10:00:00Z');
const t1 = new Date('2026-11-25T11:00:00Z');

describe('histórico da Jornada (jornada_runs_v1)', () => {
  it('sem chave ou com lixo: lista vazia, e o valor estragado vai para o backup', () => {
    const st = memoryStorage();
    expect(loadJornadaRuns(st)).toEqual([]);
    st.setItem(JORNADA_RUNS_KEY, '{quebrado');
    expect(loadJornadaRuns(st)).toEqual([]);
    expect(st.data.get(JORNADA_RUNS_KEY + '_backup')).toBe('{quebrado');
  });

  it('grava a run lida do save, com o elemento do protagonista e os números da run', () => {
    const st = memoryStorage();
    const run = { ...newRun(7, 'medium', jornadaData), status: 'defeat' as const, stageIndex: 1, stopIndex: 3, level: 5 };
    run.stats = { fights: 6, wins: 5, alliesLost: 2, bestHit: 41 };
    recordJornadaRun(st, jornadaRunRecord(run, t0), 100);
    const [r] = loadJornadaRuns(st);
    expect(r).toMatchObject({ id: 'canon:7', mode: 'canon', status: 'defeat', stageIndex: 1, stopIndex: 3, level: 5, fights: 6, wins: 5, alliesLost: 2, bestHit: 41 });
    expect(r!.startedAt).toBe(t0.toISOString());
  });

  it('a mesma run regrava o registro (Campanha a cada ciclo): fica no topo, guarda a primeira data e a vitória', () => {
    const st = memoryStorage();
    const run = { ...newRun(9, 'easy', jornadaData), mode: 'generic' as const, status: 'victory' as const };
    recordJornadaRun(st, jornadaRunRecord(run, t0), 100);
    recordJornadaRun(st, jornadaRunRecord({ ...newRun(3, 'easy', jornadaData), status: 'defeat' }, t0), 100);
    recordJornadaRun(st, jornadaRunRecord({ ...run, cycle: 1, status: 'defeat' }, t1), 100);
    const runs = loadJornadaRuns(st);
    expect(runs.map((r) => r.id)).toEqual(['generic:9', 'canon:3']);
    expect(runs[0]).toMatchObject({ status: 'victory', cycle: 1, startedAt: t0.toISOString(), updatedAt: t1.toISOString() });
  });

  it('run trocada por outra conta como abandonada; o teto corta as mais antigas', () => {
    const st = memoryStorage();
    recordJornadaRun(st, jornadaRunRecord(newRun(1, 'easy', jornadaData), t0, true), 2);
    expect(loadJornadaRuns(st)[0]!.status).toBe('abandoned');
    recordJornadaRun(st, jornadaRunRecord(newRun(2, 'easy', jornadaData), t0), 2);
    recordJornadaRun(st, jornadaRunRecord(newRun(3, 'easy', jornadaData), t0), 2);
    expect(loadJornadaRuns(st).map((r) => r.id)).toEqual(['canon:3', 'canon:2']);
  });
});

const fighter = (uid: string, defId: string, side: 'ally' | 'enemy') => ({ uid, defId, side });
const battle = (log: { uid: string; target: string; amount: number }[], status: JBattle['status'] = 'won') =>
  ({
    status,
    fighters: [fighter('a0', 'naruto', 'ally'), fighter('a1', 'sakura', 'ally'), fighter('e0', 'gatoThug', 'enemy'), fighter('e1', 'gatoThug', 'enemy'), fighter('e2', 'zabuza', 'enemy')],
    log: log.map((e) => ({ type: 'damage', crit: false, elementMult: 1, absorbed: 0, ...e })),
  }) as unknown as JBattle;

describe('Livro Bingo da Jornada', () => {
  it('um resumo por tipo de inimigo, com o maior golpe dado e levado', () => {
    const fights = foeFights(
      battle([
        { uid: 'a0', target: 'e0', amount: 12 },
        { uid: 'a1', target: 'e1', amount: 20 },
        { uid: 'e2', target: 'a0', amount: 30 },
        { uid: 'e1', target: 'a1', amount: 8 },
        { uid: 'a0', target: 'a1', amount: 99 },
      ]),
    );
    expect(fights).toEqual([
      { id: 'gatoThug', won: true, bestHit: 20, worstHit: 8 },
      { id: 'zabuza', won: true, bestHit: 0, worstHit: 30 },
    ]);
    expect(foeFights(battle([], 'lost')).every((f) => !f.won)).toBe(true);
  });

  it('o perfil soma as lutas, guarda os aliados e carrega o que gravou', () => {
    let p = recordJornadaFight(emptyProfile(), [{ id: 'zabuza', won: false, bestHit: 10, worstHit: 25 }], ['naruto', 'sakura']);
    p = recordJornadaFight(p, [{ id: 'zabuza', won: true, bestHit: 18, worstHit: 12 }], ['naruto']);
    expect(p.jornadaFoes!.zabuza).toEqual({ faced: 2, defeated: 1, killedYou: 1, bestHit: 18, worstHit: 25 });
    expect(p.jornadaAllies).toEqual(['naruto', 'sakura']);
    expect(p.villains).toEqual({});
    const st = memoryStorage();
    st.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p));
    expect(loadProfile(st).jornadaFoes).toEqual(p.jornadaFoes);
  });

  it('perfil antigo (sem os campos) carrega sem eles; valor estranho é ignorado', () => {
    const st = memoryStorage();
    st.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ achievements: {}, villains: {} }));
    expect(loadProfile(st).jornadaFoes).toBeUndefined();
    st.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ achievements: {}, villains: {}, jornadaFoes: [1], jornadaAllies: ['naruto', 3] }));
    const p = loadProfile(st);
    expect(p.jornadaFoes).toBeUndefined();
    expect(p.jornadaAllies).toEqual(['naruto']);
  });
});
