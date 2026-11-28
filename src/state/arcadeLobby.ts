// Resumo do lobby do Arcade (docs/roleta/run.md, "Dificuldade e histórico"): o desempenho do jogador no modo, lido do
// perfil e do histórico `runs_v1`. Puro: recebe a data, não lê o relógio nem o armazenamento.
import type { Difficulty } from '../core/difficulty';
import { bestRoletaCycle, originRecords, type Profile } from './profile';
import type { RunRecord } from './runHistory';

export interface ArcadeLobbySummary {
  /** Runs começadas (re-rolls não contam). */
  runs: number;
  wins: number;
  /** Melhor ciclo alcançado (contando do 1), ou null sem nenhuma run do Arcade enxuto. */
  bestCycle: number | null;
  /** Origens com alguma run terminada, e com pelo menos uma vitória. */
  originsPlayed: number;
  originsWon: number;
  /** As runs mais novas primeiro, sem os re-rolls. */
  lastRuns: RunRecord[];
}

const DAY_MS = 86_400_000;

/** Desempenho no Arcade: totais, melhor ciclo, origens e as últimas `lastLimit` runs. */
export function arcadeLobbySummary(profile: Profile, runs: readonly RunRecord[], lastLimit = 3): ArcadeLobbySummary {
  const played = runs.filter((r) => r.status !== 'reroll');
  const origins = Object.values(originRecords([...played]));
  const time = (r: RunRecord) => Date.parse(r.startedAt) || 0;
  return {
    runs: played.length,
    wins: played.filter((r) => r.status === 'victory').length,
    bestCycle: bestRoletaCycle(profile, [...played]),
    originsPlayed: origins.length,
    originsWon: origins.filter((o) => o.wins > 0).length,
    // O histórico já vem do mais novo para o mais antigo; a ordenação estável só protege de um registro fora de ordem.
    lastRuns: [...played].sort((a, b) => time(b) - time(a)).slice(0, Math.max(0, lastLimit)),
  };
}

export interface DifficultyRecord {
  runs: number;
  wins: number;
  /** Melhor ciclo nesta dificuldade (contando do 1), ou null sem run do Arcade enxuto nela. */
  bestCycle: number | null;
}

/** Desempenho numa dificuldade (a linha do seletor do lobby), com as mesmas contas do filtro Dificuldade do Histórico. */
export function difficultyRecord(runs: readonly RunRecord[], difficulty: Difficulty): DifficultyRecord {
  const mine = runs.filter((r) => r.status !== 'reroll' && r.difficulty === difficulty);
  const cycles = mine.filter((r) => r.fights !== undefined).map((r) => (r.cycle ?? 0) + 1);
  return {
    runs: mine.length,
    wins: mine.filter((r) => r.status === 'victory').length,
    bestCycle: cycles.length ? Math.max(...cycles) : null,
  };
}

export interface RecentAchievement {
  id: string;
  /** Dias inteiros desde a conquista (0 = hoje). */
  days: number;
}

/** As conquistas do Arcade (`arcadeIds`) mais novas do perfil; as da Jornada e as de data estragada ficam de fora. */
export function recentArcadeAchievements(profile: Profile, arcadeIds: Iterable<string>, now: Date, limit = 3): RecentAchievement[] {
  const ids = new Set(arcadeIds);
  return Object.entries(profile.achievements)
    .filter(([id, at]) => ids.has(id) && !Number.isNaN(Date.parse(at)))
    .map(([id, at]) => ({ id, at: Date.parse(at) }))
    .sort((a, b) => b.at - a.at)
    .slice(0, Math.max(0, limit))
    .map(({ id, at }) => ({ id, days: Math.max(0, Math.floor((now.getTime() - at) / DAY_MS)) }));
}
