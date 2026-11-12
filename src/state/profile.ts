import { lineageKey } from '../core/achievements';
import type { FightSummary } from '../core/runStats';
import { winAchievementId } from '../data/achievements';
import { RELIC_RENAMES } from '../data/jornada/relics';
import type { Difficulty } from '../core/difficulty';
import { backupUnreadable, isHardcoreUnlocked, type KeyValueStorage, type RunRecord } from './runHistory';

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

/** Até onde uma run do modo infinito chegou: ciclo e estágio contando do 1; `won` = venceu esse ciclo. */
export interface JornadaReach {
  cycle: number;
  stage: number;
  won: boolean;
}

export interface Profile {
  /** Id da conquista → data em que saiu (ISO). */
  achievements: Record<string, string>;
  villains: Record<string, VillainRecord>;
  /** As conquistas que dá para deduzir do histórico já foram liberadas. */
  backfilled: boolean;
  /** Nome do jogador. Sem o campo: nunca perguntado; vazio: preferiu não dizer. No futuro pode vir do login. */
  playerName?: string;
  /** Coleção da Jornada: id da relíquia → data em que apareceu pela primeira vez (ISO). */
  relics: Record<string, string>;
  /** Recorde do modo infinito da Jornada (só o Caminho Ninja tem). Sem o campo: nunca registrou. */
  jornada?: { generic?: JornadaReach };
  /** Recorde do Roleta (v0.46.0): ciclo alcançado (contando do 1) e lutas vencidas na run. */
  roleta?: RoletaReach;
  /** Hardcore liberado (v0.60.0). Sem o campo: vale o histórico (`syncHardcoreUnlock`). */
  hardcoreUnlocked?: true;
  /** Avatar escolhido (chave de retrato, `ninja:<chave>`; v0.63.0). Sem o campo: o padrão. */
  avatar?: string;
}

export interface RoletaReach {
  cycle: number;
  fights: number;
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
  return { achievements: {}, villains: {}, backfilled: false, relics: {} };
}

/** Coleção com os ids de relíquia que mudaram trocados (fica a data mais antiga). */
function renameCollection(relics: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, at] of Object.entries(relics)) {
    const key = RELIC_RENAMES[id] ?? id;
    if (!out[key] || at < out[key]) out[key] = at;
  }
  return out;
}

export function loadProfile(storage: KeyValueStorage): Profile {
  let raw: string | null = null;
  try {
    raw = storage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Profile>) : {};
    const base = emptyProfile();
    return {
      achievements: parsed.achievements && typeof parsed.achievements === 'object' ? parsed.achievements : base.achievements,
      villains: parsed.villains && typeof parsed.villains === 'object' ? parsed.villains : base.villains,
      backfilled: parsed.backfilled === true,
      relics: parsed.relics && typeof parsed.relics === 'object' ? renameCollection(parsed.relics) : base.relics,
      ...(typeof parsed.playerName === 'string' ? { playerName: cleanPlayerName(parsed.playerName) } : {}),
      ...(isReach(parsed.jornada?.generic) ? { jornada: { generic: parsed.jornada!.generic } } : {}),
      ...(typeof parsed.roleta?.cycle === 'number' && typeof parsed.roleta?.fights === 'number' ? { roleta: parsed.roleta } : {}),
      ...(parsed.hardcoreUnlocked === true ? { hardcoreUnlocked: true as const } : {}),
      ...(typeof parsed.avatar === 'string' && parsed.avatar.length <= 64 ? { avatar: parsed.avatar } : {}),
    };
  } catch {
    if (raw) backupUnreadable(storage, PROFILE_STORAGE_KEY, raw);
    return emptyProfile();
  }
}

/**
 * Hardcore liberado fica no perfil: o histórico guarda só as últimas runs, e a vitória que liberou pode sair dele.
 * Sem mudança, devolve o mesmo perfil.
 */
export function syncHardcoreUnlock(profile: Profile, runs: RunRecord[], unlockedBy: Difficulty): Profile {
  if (profile.hardcoreUnlocked || !isHardcoreUnlocked(runs, unlockedBy)) return profile;
  return { ...profile, hardcoreUnlocked: true };
}

/** Melhor ciclo do Roleta (contando do 1): o recorde do perfil, ou o do histórico para quem jogou antes dele. */
export function bestRoletaCycle(profile: Profile, runs: RunRecord[]): number | null {
  const cycles = runs.filter((r) => r.fights !== undefined).map((r) => (r.cycle ?? 0) + 1);
  if (profile.roleta) cycles.push(profile.roleta.cycle);
  return cycles.length ? Math.max(...cycles) : null;
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

/** Relíquias que apareceram (na run, no mercador, na escolha do chefe): entram na coleção. A data é a da primeira vez. */
export function discoverRelics(profile: Profile, ids: readonly string[], now: Date): Profile {
  const fresh = ids.filter((id) => !(id in profile.relics));
  if (!fresh.length) return profile;
  const relics = { ...profile.relics };
  for (const id of fresh) relics[id] = now.toISOString();
  return { ...profile, relics };
}

function isReach(r: unknown): r is JornadaReach {
  const x = r as JornadaReach | undefined;
  return Boolean(x) && typeof x!.cycle === 'number' && typeof x!.stage === 'number' && typeof x!.won === 'boolean';
}

/** Até onde a run chegou (ciclo e estágio contando do 1). */
export function reachOf(run: { cycle?: number; stageIndex: number; status: string }): JornadaReach {
  return { cycle: (run.cycle ?? 0) + 1, stage: run.stageIndex + 1, won: run.status === 'victory' };
}

/** `a` passa `b`: ciclo maior; no mesmo ciclo, vencer passa qualquer estágio; senão, estágio maior. */
export function reachBeats(a: JornadaReach, b?: JornadaReach): boolean {
  if (!b) return true;
  if (a.cycle !== b.cycle) return a.cycle > b.cycle;
  if (a.won !== b.won) return a.won;
  return a.stage > b.stage;
}

/** Grava o recorde do modo infinito do Caminho Ninja. Sem melhora, devolve o mesmo perfil. */
export function recordJornadaReach(profile: Profile, reach: JornadaReach): Profile {
  if (!reachBeats(reach, profile.jornada?.generic)) return profile;
  return { ...profile, jornada: { ...profile.jornada, generic: reach } };
}

/** Recorde do Roleta: ciclo maior passa; no mesmo ciclo, mais lutas vencidas. Sem melhora, devolve o mesmo perfil. */
export function recordRoletaReach(profile: Profile, reach: RoletaReach): Profile {
  const b = profile.roleta;
  const beats = !b || reach.cycle > b.cycle || (reach.cycle === b.cycle && reach.fights > b.fights);
  return beats ? { ...profile, roleta: reach } : profile;
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
  /** Roleta enxuto: mais lutas vencidas numa run (−1 = nenhuma run nova). */
  bestFights: number;
}

export function originRecords(runs: RunRecord[]): Record<string, OriginRecord> {
  const out: Record<string, OriginRecord> = {};
  for (const r of runs) {
    if (r.status === 'reroll' || r.status === 'inProgress') continue;
    const key = lineageKey(r.origin);
    const o = (out[key] ??= { runs: 0, wins: 0, furthestStage: 0, bestFights: -1 });
    o.runs++;
    if (r.status === 'victory') o.wins++;
    if (r.fights !== undefined) o.bestFights = Math.max(o.bestFights, r.fights);
    else o.furthestStage = Math.max(o.furthestStage, r.furthestStage);
  }
  return out;
}
