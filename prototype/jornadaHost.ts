// O que a Jornada usa do protótipo (JornadaHost), ligado à sessão.
import { ptBR as S } from '../src/data/strings/ptBR';
import { foeFights } from '../src/core/jornada/foes';
import { balance } from '../src/data/balance';
import { jornadaRunRecord, recordJornadaRun } from '../src/state/jornadaRuns';
import { unlockAchievements, saveProfile, discoverRelics, recordJornadaReach, recordJornadaFight, reachOf } from '../src/state/profile';
import { mood } from './audio';
import { ensurePlayerName } from './gate';
import { type JornadaHost } from './jornada/host';
import { nextRunSeed, toast, syncSheetBtn } from './roleta/common';
import { ses, saveSettings } from './roleta/session';

/** O que a Jornada usa do protótipo: armazenamento, preferências, perfil e som. */
export const jornadaHost: JornadaHost = {
  get storage() {
    return ses.storage;
  },
  instant: () => ses.settings.instant,
  calmGames: () => Boolean(ses.settings.calmGames),
  setCalmGames: (on) => {
    ses.settings.calmGames = on;
    saveSettings();
  },
  nextSeed: () => nextRunSeed() ?? Math.floor(Math.random() * 2 ** 31),
  unlocked: () => new Set(Object.keys(ses.profile.achievements)),
  unlock: (ids) => {
    if (!ids.length) return;
    ses.profile = unlockAchievements(ses.profile, ids, new Date());
    saveProfile(ses.storage, ses.profile);
    const name = (id: string) => S.jornada.achievements.list[id]?.name ?? S.achievements.list[id]?.name ?? id;
    ids.forEach((id, i) => setTimeout(() => toast(S.achievements.unlocked(name(id)), 'medal'), i * 2800));
  },
  difficulty: () => ses.settings.difficulty,
  setDifficulty: (d) => {
    ses.settings.difficulty = d;
    saveSettings();
  },
  mood,
  ensurePlayerName,
  playerName: () => ses.profile.playerName ?? '',
  setSheet: (open) => {
    ses.jornadaSheet = open;
    syncSheetBtn();
  },
  discoverRelics: (ids) => {
    const next = discoverRelics(ses.profile, ids, new Date());
    if (next === ses.profile) return;
    ses.profile = next;
    saveProfile(ses.storage, ses.profile);
  },
  jornadaRecord: () => ses.profile.jornada?.generic ?? null,
  recordJornada: (run, abandoned = false) => {
    recordJornadaRun(ses.storage, jornadaRunRecord(run, new Date(), abandoned), balance.history.maxRuns);
    if (run.mode !== 'generic') return false;
    const next = recordJornadaReach(ses.profile, reachOf(run));
    if (next === ses.profile) return false;
    ses.profile = next;
    saveProfile(ses.storage, ses.profile);
    return true;
  },
  noteFight: (battle, won) => {
    const allies = [...new Set(battle.fighters.filter((f) => f.side === 'ally').map((f) => f.defId))];
    ses.profile = recordJornadaFight(ses.profile, foeFights(battle, won), allies);
    saveProfile(ses.storage, ses.profile);
  },
  recentAchievements: (limit, onlyJornada = false) =>
    Object.entries(ses.profile.achievements)
      .filter(([id]) => !onlyJornada || id in S.jornada.achievements.list)
      .sort((x, y) => y[1].localeCompare(x[1]))
      .slice(0, limit)
      .map(([id, at]) => {
        const t = S.jornada.achievements.list[id] ?? S.achievements.list[id];
        return { id, name: t?.name ?? id, desc: t?.desc ?? '', days: Math.max(0, Math.floor((Date.now() - Date.parse(at)) / 86_400_000)) };
      }),
  notify: (text, ico = 'sparkle') => toast(text, ico),
};
