import { describe, expect, it } from 'vitest';
import { newAchievements, type AchievementContext } from '../src/core/achievements';
import type { BattleEvent, BattleState } from '../src/core/combat';
import type { Origin } from '../src/core/types';
import { addEffect, addJokenpo, addPreEvent, emptyRunStats, summarizeFight, type FightSummary } from '../src/core/runStats';
import { achievements, ORIGIN_ACHIEVEMENT_LINEAGES, winAchievementId } from '../src/data/achievements';
import { ptBR as S } from '../src/data/strings/ptBR';
import {
  achievementsFromHistory,
  emptyProfile,
  killedByCounts,
  loadProfile,
  originRecords,
  PROFILE_STORAGE_KEY,
  recordFight,
  saveProfile,
  unlockAchievements,
} from '../src/state/profile';
import type { KeyValueStorage, RunRecord } from '../src/state/runHistory';

function battle(log: BattleEvent[], status: 'won' | 'lost', hp = 50, maxHp = 100): BattleState {
  return { status, log, player: { hp, maxHp } } as unknown as BattleState;
}

const attack = (side: 'player' | 'villain', damage: number, crit = false): BattleEvent => ({
  type: 'attack',
  side,
  techniqueId: 'x',
  attackType: 'taijutsu',
  outcome: crit ? 'crit' : 'hit',
  damage,
  elementMult: 1,
  hitChance: 1,
  critChance: 0,
  chakra: 0,
});

function fight(over: Partial<FightSummary> = {}): FightSummary {
  return {
    villainId: 'mizuki',
    exam: false,
    won: true,
    damageTaken: 10,
    hpPctEnd: 0.5,
    bestHit: 10,
    bestCrit: 0,
    worstHit: 5,
    villainSelfHits: 0,
    copies: 0,
    itemsUsed: 0,
    revivesUsed: 0,
    maxGate: 0,
    redPill: false,
    devourFinish: false,
    cloakSuppressed: false,
    ...over,
  };
}

function ctx(over: Partial<AchievementContext> = {}): AchievementContext {
  return {
    stats: emptyRunStats(),
    origin: { lineageId: null, elements: ['fire'], jinchuuriki: false },
    difficulty: 'normal',
    level: 1,
    summon: null,
    result: 'inProgress',
    fallenTo: null,
    killedBy: {},
    unlocked: new Set(),
    ...over,
  };
}

const withFights = (...fights: FightSummary[]) => ({ ...emptyRunStats(), fights });

describe('resumo da luta', () => {
  it('lê dano sofrido, maior crítico, autoferimento, portões, pílula e o golpe final', () => {
    const s = summarizeFight(
      'zabuza',
      false,
      battle(
        [
          attack('villain', 10),
          { type: 'burnTick', target: 'player', damage: 3 },
          { type: 'burnTick', target: 'villain', damage: 4 },
          attack('player', 55, true),
          { type: 'possessed', side: 'villain', techniqueId: 'x', damage: 7 },
          { type: 'copy', chance: 0.5, success: true, techniqueId: 'x' },
          { type: 'copy', chance: 0.5, success: false, techniqueId: 'x' },
          { type: 'gates', stage: 2, hpLost: 10, chakra: 5 },
          { type: 'pill', pill: 'red', hpLost: 30 },
          { type: 'item', item: 'medKit', amount: 0 },
          { type: 'devour', insects: 5, pct: 0.02, damage: 20 },
          { type: 'end', status: 'won' },
        ],
        'won',
        5,
      ),
    );
    expect(s).toMatchObject({
      won: true,
      damageTaken: 13,
      worstHit: 10,
      hpPctEnd: 0.05,
      bestHit: 55,
      bestCrit: 55,
      villainSelfHits: 1,
      copies: 1,
      maxGate: 2,
      redPill: true,
      itemsUsed: 1,
      devourFinish: true,
    });
  });

  it('o Devorar só conta como golpe final se foi o último dano e a luta foi ganha', () => {
    const log: BattleEvent[] = [{ type: 'devour', insects: 2, pct: 0.02, damage: 4 }, attack('player', 8)];
    expect(summarizeFight('x', false, battle(log, 'won')).devourFinish).toBe(false);
    expect(summarizeFight('x', false, battle([log[0]!], 'lost')).devourFinish).toBe(false);
  });
});

describe('estatísticas da run', () => {
  it('conta eventos, jokenpô e efeitos', () => {
    let s = addPreEvent(addPreEvent(emptyRunStats(), 'ramen'), 'ramen');
    s = addJokenpo(s, 'loss');
    s = addEffect(s, { kind: 'guruCharlatan' });
    s = addEffect(s, { kind: 'summonLevel', animal: 'toad', level: 3 });
    expect(s.preEvents.ramen).toBe(2);
    expect(s.jokenpo.loss).toBe(1);
    expect(s.guruCharlatan).toBe(1);
    expect(s.summonLevel).toBe(3);
  });
});

describe('conquistas', () => {
  it('toda conquista tem nome e descrição nos textos', () => {
    for (const a of achievements) {
      expect(S.achievements.list[a.id], a.id).toBeDefined();
    }
  });

  it('Uzumaki Naruto sai logo no sorteio; Dattebayo só vencendo', () => {
    const naruto: Origin = { lineageId: 'uzumaki', elements: ['wind'], jinchuuriki: true };
    expect(newAchievements(achievements, ctx({ origin: naruto }))).toEqual(['narutoUzumaki']);
    const end = newAchievements(achievements, ctx({ origin: naruto, result: 'victory', unlocked: new Set(['narutoUzumaki']) }));
    expect(end).toContain('dattebayo');
    expect(end).toContain(winAchievementId('uzumaki'));
    expect(newAchievements(achievements, ctx({ origin: { ...naruto, elements: ['fire', 'earth'] } }))).toEqual([]);
  });

  it('Mestre dos clãs sai na mesma checagem da última origem que faltava', () => {
    const others = ORIGIN_ACHIEVEMENT_LINEAGES.filter((l) => l !== 'hyuuga').map(winAchievementId);
    const got = newAchievements(
      achievements,
      ctx({ origin: { lineageId: 'hyuuga', elements: ['earth'], jinchuuriki: false }, result: 'victory', unlocked: new Set(others) }),
    );
    expect(got).toContain(winAchievementId('hyuuga'));
    expect(got).toContain('clanMaster');
    const clan = achievements.find((a) => a.id === 'clanMaster')!;
    expect(clan.progress!(new Set(others))).toEqual([9, 10]);
  });

  it('exame 3/3 dá Chunin; 0/3 e vencer dá Reprovado, mas vivo', () => {
    const exam = (won: boolean) => fight({ exam: true, won, villainId: 'examSand' });
    expect(newAchievements(achievements, ctx({ stats: withFights(exam(true), exam(true), exam(true)) }))).toContain('chunin');
    const failed = newAchievements(achievements, ctx({ stats: withFights(exam(false), exam(false), exam(false)), result: 'victory' }));
    expect(failed).toContain('failedButAlive');
    expect(failed).not.toContain('chunin');
  });

  it('derrota para o Orochimaru ou para o Mizuki; Zabuza 5 vezes no perfil', () => {
    expect(newAchievements(achievements, ctx({ result: 'defeat', fallenTo: 'orochimaru' }))).toContain('soClose');
    expect(newAchievements(achievements, ctx({ result: 'defeat', fallenTo: 'mizuki' }))).toContain('shame');
    expect(newAchievements(achievements, ctx({ killedBy: { zabuza: 4 } }))).not.toContain('mistDemon');
    expect(newAchievements(achievements, ctx({ killedBy: { zabuza: 5 } }))).toContain('mistDemon');
  });

  it('Intocável só contra chefe e sem dano; Por um fio com HP baixo', () => {
    expect(newAchievements(achievements, ctx({ stats: withFights(fight({ villainId: 'gaara', damageTaken: 0 })) }))).toContain('untouchable');
    expect(newAchievements(achievements, ctx({ stats: withFights(fight({ damageTaken: 0 })) }))).not.toContain('untouchable');
    expect(newAchievements(achievements, ctx({ stats: withFights(fight({ hpPctEnd: 0.04 })) }))).toContain('closeCall');
  });

  it('Pura força: prodígio vence sem abrir portões', () => {
    const prodigy = { lineageId: 'taijutsuProdigy', elements: [], jinchuuriki: false };
    expect(newAchievements(achievements, ctx({ origin: prodigy, result: 'victory', stats: withFights(fight()) }))).toContain('pureStrength');
    expect(
      newAchievements(achievements, ctx({ origin: prodigy, result: 'victory', stats: withFights(fight({ maxGate: 1 })) })),
    ).not.toContain('pureStrength');
  });

  it('não repete o que já saiu', () => {
    expect(newAchievements(achievements, ctx({ result: 'victory', unlocked: new Set(['leafNinja']) }))).not.toContain('leafNinja');
  });
});

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const run = (over: Partial<RunRecord>): RunRecord => ({
  id: 'r',
  startedAt: '',
  updatedAt: '',
  origin: { lineageId: null, elements: ['fire'], jinchuuriki: false },
  status: 'defeat',
  furthestStage: 0,
  revivesUsed: 0,
  ...over,
});

describe('perfil', () => {
  it('soma lutas no Livro Bingo e guarda os maiores golpes', () => {
    let p = recordFight(emptyProfile(), fight({ villainId: 'zabuza', won: false, bestHit: 20, worstHit: 30 }));
    p = recordFight(p, fight({ villainId: 'zabuza', won: true, bestHit: 12, worstHit: 40 }));
    expect(p.villains.zabuza).toEqual({ faced: 2, defeated: 1, killedYou: 1, bestHit: 20, worstHit: 40 });
    expect(killedByCounts(p)).toEqual({ zabuza: 1 });
  });

  it('salva, carrega e sobrevive a JSON quebrado', () => {
    const st = memoryStorage();
    const p = unlockAchievements(emptyProfile(), ['genin'], new Date('2026-10-31T00:00:00Z'));
    saveProfile(st, p);
    expect(loadProfile(st).achievements.genin).toBe('2026-10-31T00:00:00.000Z');
    st.data.set(PROFILE_STORAGE_KEY, '{quebrado');
    expect(loadProfile(st)).toEqual(emptyProfile());
  });

  it('desbloquear de novo não muda a data', () => {
    const p = unlockAchievements(emptyProfile(), ['genin'], new Date('2026-01-01T00:00:00Z'));
    expect(unlockAchievements(p, ['genin'], new Date('2026-12-01T00:00:00Z')).achievements.genin).toBe('2026-01-01T00:00:00.000Z');
  });

  it('libera os marcos que o histórico já prova', () => {
    const ids = achievementsFromHistory([
      run({ status: 'victory', difficulty: 'hardcore', furthestStage: 6 }),
      run({ status: 'defeat', furthestStage: 2, origin: { lineageId: 'nara', elements: ['water'], jinchuuriki: true } }),
      run({ status: 'reroll', origin: { lineageId: 'uchiha', elements: ['fire'], jinchuuriki: false } }),
    ]);
    expect(ids.sort()).toEqual(['genin', 'hokage', 'leafNinja', 'legend', 'noFear', winAchievementId('common')].sort());
  });

  it('estatísticas por origem ignoram re-roll e run em andamento', () => {
    const rec = originRecords([
      run({ status: 'victory', furthestStage: 6 }),
      run({ status: 'defeat', furthestStage: 3 }),
      run({ status: 'reroll' }),
      run({ status: 'inProgress', furthestStage: 5 }),
    ]);
    expect(rec).toEqual({ common: { runs: 2, wins: 1, furthestStage: 6 } });
  });
});
