import type { JRun } from '../../core/jornada/run';

// Conquistas da Jornada (docs/base/perfil.md#categorias): ficam no mesmo perfil, na categoria Jornada.
// Algumas liberam coisas de vez: `j_canonWin` abre a Ōdama Rasengan na árvore; `j_canonHard`, o Hardcore.

export interface JornadaAchievement {
  id: string;
  hidden?: boolean;
  check: (run: JRun) => boolean;
}

const won = (r: JRun) => r.status === 'victory' && r.mode === 'canon';
const wonGeneric = (r: JRun) => r.status === 'victory' && r.mode === 'generic';
const notEasy = (r: JRun) => r.difficulty !== 'easy';
/** Modo infinito do Caminho Ninja: venceu o ciclo `n` (contando do 1). */
const beatCycle = (n: number) => (r: JRun) => wonGeneric(r) && (r.cycle ?? 0) >= n - 1;
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
  { id: 'j_genericWin', check: wonGeneric },
  // Desbloqueios de classe (docs/jornada/classes.md#desbloqueios).
  { id: 'j_unlockUchiha', check: (r) => wonGeneric(r) && notEasy(r) && r.hero === 'commonNinja' && r.elements[r.hero] === 'fire' },
  { id: 'j_unlockHyuuga', check: (r) => wonGeneric(r) && notEasy(r) && r.hero === 'prodigy' },
  { id: 'j_winUchiha', check: (r) => wonGeneric(r) && r.hero === 'uchihaNinja' },
  { id: 'j_winHyuuga', check: (r) => wonGeneric(r) && r.hero === 'hyuugaNinja' },
  // Modo infinito (docs/jornada/run.md#modo-infinito).
  { id: 'j_cycle2', check: beatCycle(2) },
  { id: 'j_cycle3', check: beatCycle(3) },
  { id: 'j_cycle5', check: beatCycle(5) },
  // Easter egg: Uchiha com raio que aprende o Chidori libera o visual e o ramo do Sasuke (docs/jornada/classes.md#easter-eggs).
  { id: 'j_sasukeEgg', hidden: true, check: (r) => r.hero === 'uchihaNinja' && r.secondElement === 'lightning' && r.learned.includes('jChidori') },
  { id: 'j_sexy', hidden: true, check: (r) => r.cleared.includes('valley') && r.moveset.includes('jSexyJutsu') },
];

/** Conquistas que a run libera agora. */
export function newJornadaAchievements(run: JRun, unlocked: ReadonlySet<string>): string[] {
  return jornadaAchievements.filter((a) => !unlocked.has(a.id) && a.check(run)).map((a) => a.id);
}
