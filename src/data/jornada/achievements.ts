import type { JRun } from '../../core/jornada/run';

// Conquistas da Jornada (docs/base/perfil.md#categorias): ficam no mesmo perfil, na categoria Jornada.
// Algumas liberam coisas de vez: `j_canonWin` abre a Ōdama Rasengan na árvore; `j_canonHard`, o Hardcore.

export interface JornadaAchievement {
  id: string;
  hidden?: boolean;
  check: (run: JRun) => boolean;
}

const won = (r: JRun) => r.status === 'victory';
const hard = (r: JRun) => r.difficulty === 'hard' || r.difficulty === 'hardcore';

export const jornadaAchievements: JornadaAchievement[] = [
  { id: 'j_bell', check: (r) => r.cleared.includes('bells') },
  { id: 'j_waves', check: (r) => r.cleared.includes('haku') },
  { id: 'j_exam', check: (r) => r.cleared.includes('gaara') },
  { id: 'j_canonWin', check: won },
  { id: 'j_canonHard', check: (r) => won(r) && hard(r) },
  { id: 'j_canonHardcore', check: (r) => won(r) && r.difficulty === 'hardcore' },
  { id: 'j_noneLeftBehind', check: (r) => won(r) && r.stats.alliesLost === 0 },
  { id: 'j_rich', check: (r) => r.ryo >= 200 },
  { id: 'j_collector', check: (r) => r.relics.length >= 8 },
  { id: 'j_sexy', hidden: true, check: (r) => r.cleared.includes('valley') && r.moveset.includes('jSexyJutsu') },
];

/** Conquistas que a run libera agora. */
export function newJornadaAchievements(run: JRun, unlocked: ReadonlySet<string>): string[] {
  return jornadaAchievements.filter((a) => !unlocked.has(a.id) && a.check(run)).map((a) => a.id);
}
