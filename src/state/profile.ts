import { lineageKey } from '../core/achievements';
import type { FightSummary } from '../core/runStats';
import { winAchievementId } from '../data/achievements';
import type { KeyValueStorage, RunRecord } from './runHistory';

/**
 * Perfil local (Fase 2): conquistas liberadas e o Livro Bingo (contadores por vilão).
 * As estatísticas por origem não ficam aqui: saem do histórico de runs (`runs_v1`).
 */
export const PROFILE_STORAGE_KEY = 'profile_v1';

export interface VillainRecord {
  faced: number;
  defeated: number;
  /** Lutas perdidas para ele (inclusive no exame). */
  killedYou: number;
  /** Maior golpe do jogador nele e maior golpe dele no jogador. */
  bestHit: number;
  worstHit: number;
}

export interface Profile {
  /** Id da conquista → data em que saiu (ISO). */
  achievements: Record<string, string>;
  villains: Record<string, VillainRecord>;
  /** As conquistas que dá para deduzir do histórico já foram liberadas. */
  backfilled: boolean;
  /** Nome do jogador. Sem o campo: nunca perguntado; vazio: preferiu não dizer. No futuro pode vir do login. */
  playerName?: string;
}

export const PLAYER_NAME_MAX = 16;

/** Nome pronto para guardar: sem espaços sobrando nem caracteres de controle, até o limite. */
export function cleanPlayerName(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PLAYER_NAME_MAX)
    .trim();
}

export function emptyProfile(): Profile {
  return { achievements: {}, villains: {}, backfilled: false };
}

export function loadProfile(storage: KeyValueStorage): Profile {
  try {
    const raw = storage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Profile>) : {};
    const base = emptyProfile();
    return {
      achievements: parsed.achievements && typeof parsed.achievements === 'object' ? parsed.achievements : base.achievements,
      villains: parsed.villains && typeof parsed.villains === 'object' ? parsed.villains : base.villains,
      backfilled: parsed.backfilled === true,
      ...(typeof parsed.playerName === 'string' ? { playerName: cleanPlayerName(parsed.playerName) } : {}),
    };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(storage: KeyValueStorage, profile: Profile): void {
  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Armazenamento cheio ou bloqueado: o perfil é conveniência, o jogo segue.
  }
}

export function recordFight(profile: Profile, fight: FightSummary): Profile {
  const v = profile.villains[fight.villainId] ?? { faced: 0, defeated: 0, killedYou: 0, bestHit: 0, worstHit: 0 };
  const next: VillainRecord = {
    faced: v.faced + 1,
    defeated: v.defeated + (fight.won ? 1 : 0),
    killedYou: v.killedYou + (fight.won ? 0 : 1),
    bestHit: Math.max(v.bestHit, fight.bestHit),
    worstHit: Math.max(v.worstHit, fight.worstHit),
  };
  return { ...profile, villains: { ...profile.villains, [fight.villainId]: next } };
}

export function unlockAchievements(profile: Profile, ids: string[], now: Date): Profile {
  if (ids.length === 0) return profile;
  const achievements = { ...profile.achievements };
  for (const id of ids) achievements[id] ??= now.toISOString();
  return { ...profile, achievements };
}

export function killedByCounts(profile: Profile): Record<string, number> {
  return Object.fromEntries(Object.entries(profile.villains).map(([id, v]) => [id, v.killedYou]));
}

/** Marcos que o histórico de runs já prova (para quem jogou antes das conquistas existirem). */
export function achievementsFromHistory(runs: RunRecord[]): string[] {
  const ids = new Set<string>();
  for (const r of runs) {
    if (r.status === 'reroll') continue;
    if (r.furthestStage >= 1 || r.status === 'victory') ids.add('genin');
    if (r.status !== 'victory') continue;
    const lineage = lineageKey(r.origin);
    ids.add('leafNinja');
    ids.add(winAchievementId(lineage));
    if (r.origin.jinchuuriki) ids.add('innerBeast');
    if (r.difficulty === 'hard' || r.difficulty === 'hardcore') ids.add('noFear');
    if (r.difficulty === 'hardcore') ids.add('legend');
    if (r.difficulty === 'hardcore' && lineage === 'common') ids.add('hokage');
  }
  return [...ids];
}

/** Uma linha por linhagem jogada: runs (sem re-roll e sem a em andamento), vitórias e etapa mais longe. */
export interface OriginRecord {
  runs: number;
  wins: number;
  furthestStage: number;
}

export function originRecords(runs: RunRecord[]): Record<string, OriginRecord> {
  const out: Record<string, OriginRecord> = {};
  for (const r of runs) {
    if (r.status === 'reroll' || r.status === 'inProgress') continue;
    const key = lineageKey(r.origin);
    const o = (out[key] ??= { runs: 0, wins: 0, furthestStage: 0 });
    o.runs++;
    if (r.status === 'victory') o.wins++;
    o.furthestStage = Math.max(o.furthestStage, r.furthestStage);
  }
  return out;
}
