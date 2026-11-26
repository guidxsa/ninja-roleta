// Perfis prontos para os cenários: vazio, médio e completo. Datas fixas (o lab congela o relógio) e nada sorteado.
// Descrevem estado do perfil, nunca regra: as conquistas e relíquias são as dos dados do jogo.
import { createRng } from '../../../src/core/rng';
import { rollOrigin } from '../../../src/core/origin';
import { achievements } from '../../../src/data/achievements';
import { jornadaAchievements } from '../../../src/data/jornada/achievements';
import { enemies } from '../../../src/data/jornada/enemies';
import { newRun } from '../../../src/core/jornada/run';
import { jornadaData } from '../../../src/data/jornada';
import { allRelics } from '../../../src/data/relics';
import { roletaData } from '../../../src/data/roleta/index';
import { roletaVillains } from '../../../src/data/roleta/villains';
import { discoverRelics, emptyProfile, unlockAchievements, type Profile, type VillainRecord } from '../../../src/state/profile';
import { startRun, updateRun, type KeyValueStorage, type RunStatus } from '../../../src/state/runHistory';
import { jornadaRunRecord, recordJornadaRun } from '../../../src/state/jornadaRuns';

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n, 12));

/** Nome fixo dos perfis de teste (nunca o nome real de quem joga). */
export const FIXTURE_NAME = 'Ninja de Teste';

const villain = (faced: number, defeated: number, killedYou: number): VillainRecord => ({ faced, defeated, killedYou, bestHit: 18 + faced, worstHit: 9 + killedYou });

export const profiles = {
  /** Primeiro acesso: nada liberado, sem nome. */
  empty: (): Profile => ({ ...emptyProfile(), backfilled: true }),

  /** Algumas semanas de jogo: parte das conquistas, alguns vilões e relíquias, nome e recorde da Jornada. */
  mid: (): Profile => {
    let p: Profile = { ...emptyProfile(), backfilled: true, playerName: FIXTURE_NAME };
    const ach = achievements.filter((a) => !a.legacy).slice(0, 8).map((a) => a.id);
    ach.forEach((id, i) => (p = unlockAchievements(p, [id], day(i * 2))));
    p = unlockAchievements(p, jornadaAchievements.slice(0, 2).map((a) => a.id), day(28));
    p = discoverRelics(p, allRelics.slice(0, 10).map((r) => r.id), day(10));
    const villains = Object.fromEntries(roletaVillains.slice(0, 6).map((v, i) => [v.id, villain(i + 2, i + 1, i % 2)]));
    const jornadaFoes = Object.fromEntries(enemies.slice(0, 8).map((e, i) => [e.id, villain(i + 1, i, i % 2)]));
    return { ...p, villains, jornadaFoes, jornadaAllies: ['naruto', 'sasuke', 'sakura'], jornada: { generic: { cycle: 1, stage: 3, won: false } }, roleta: { cycle: 1, fights: 4 } };
  },

  /** Tudo liberado: todas as conquistas (com as legadas), vilões, relíquias, Hardcore e recordes altos. */
  full: (): Profile => {
    let p: Profile = { ...emptyProfile(), backfilled: true, playerName: FIXTURE_NAME, hardcoreUnlocked: true };
    p = unlockAchievements(p, achievements.map((a) => a.id), day(0));
    p = unlockAchievements(p, jornadaAchievements.map((a) => a.id), day(20));
    p = discoverRelics(p, allRelics.map((r) => r.id), day(5));
    const villains = Object.fromEntries(roletaVillains.map((v, i) => [v.id, villain(5 + i, 4 + i, 1 + (i % 3))]));
    const jornadaFoes = Object.fromEntries(enemies.map((e, i) => [e.id, villain(3 + (i % 5), 2 + (i % 4), i % 3)]));
    return { ...p, villains, jornadaFoes, jornada: { generic: { cycle: 4, stage: 2, won: false } }, roleta: { cycle: 3, fights: 17 } };
  },
};

/** Histórico de runs do Roleta: `count` runs com origens de uma seed fixa e status variados. */
export function seedRunHistory(storage: KeyValueStorage, count: number): void {
  const data = roletaData.base;
  const max = data.balance.history.maxRuns;
  const rng = createRng(4242);
  const statuses: RunStatus[] = ['victory', 'defeat', 'abandoned', 'defeat', 'reroll'];
  const difficulties = Object.keys(data.balance.difficulty.multipliers) as (keyof typeof data.balance.difficulty.multipliers)[];
  for (let i = 0; i < count; i++) {
    const id = `lab-${i}`;
    startRun(storage, { id, origin: rollOrigin(rng, data).origin, now: day(i), seed: 1000 + i }, max);
    // A cada quatro, uma run de antes do histórico detalhado (sem vilões, relíquias nem eventos).
    const details = i % 4 === 3 ? {} : runDetailsFixture(i);
    updateRun(storage, id, { status: statuses[i % statuses.length]!, difficulty: difficulties[i % difficulties.length]!, cycle: i % 3, fights: 2 + (i % 6), ...details }, day(i), max);
  }
}

/** Detalhes de uma run do Arcade para o lab: vilões em ordem, relíquias e eventos dos dados, nada sorteado. */
function runDetailsFixture(i: number) {
  const foes = roletaVillains.slice(i % 5, (i % 5) + 2 + (i % 4)).map((v, k, all) => ({ id: v.id, won: k < all.length - 1 || i % 5 === 0 }));
  const last = foes[foes.length - 1];
  return {
    foes,
    ...(last && !last.won ? { fallenTo: last.id } : {}),
    relics: allRelics.filter((r) => r.roleta).slice(i % 3, (i % 3) + 1 + (i % 3)).map((r) => r.id),
    events: i % 2 ? { ramen: 1, training: 1 } : { oldLady: 2 },
    bestHit: 20 + i * 3,
  };
}

/** Histórico da Jornada para o lab: `count` runs de cada modo, com resultados variados. */
export function seedJornadaHistory(storage: KeyValueStorage, count: number): void {
  const max = roletaData.base.balance.history.maxRuns;
  const statuses = ['defeat', 'victory', 'abandoned'] as const;
  for (let i = 0; i < count * 2; i++) {
    const generic = i % 2 === 1;
    const base = newRun(300 + i, i % 3 === 0 ? 'hard' : 'normal', jornadaData);
    const status = statuses[i % 3]!;
    const run = {
      ...base,
      mode: generic ? ('generic' as const) : ('canon' as const),
      hero: generic ? 'commonNinja' : base.hero,
      classId: generic ? (['common', 'uchiha', 'hyuuga'] as const)[i % 3]! : base.classId,
      elements: { ...base.elements, [generic ? 'commonNinja' : base.hero]: (['fire', 'wind', 'water'] as const)[i % 3]! },
      status: status === 'abandoned' ? ('defeat' as const) : status,
      cycle: generic && status === 'victory' ? 1 : 0,
      stageIndex: i % 3,
      stopIndex: 2 + (i % 5),
      level: 4 + i,
      relics: jornadaData.relics.slice(i % 4, (i % 4) + 2 + (i % 3)).map((r) => r.id),
      stats: { fights: 6 + i, wins: 5 + i, alliesLost: i % 3, bestHit: 30 + i * 4 },
    };
    recordJornadaRun(storage, jornadaRunRecord(run, day(i), status === 'abandoned'), max);
  }
}
