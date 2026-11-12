// O que a Jornada precisa do resto do protótipo (main.ts): armazenamento, preferências, perfil e som.
import type { Difficulty } from '../../src/core/difficulty';
import type { JRun } from '../../src/core/jornada/run';
import type { JornadaReach } from '../../src/state/profile';
import type { KeyValueStorage } from '../../src/state/runHistory';
import type { Mood } from '../audio';

export interface JornadaHost {
  storage: KeyValueStorage;
  /** Modo instantâneo ligado (animações curtas). */
  instant: () => boolean;
  /** Seed fixa do `?seed=` (uma vez); sem ela, sorteia. */
  nextSeed: () => number;
  /** Conquistas liberadas no perfil. */
  unlocked: () => ReadonlySet<string>;
  /** Libera conquistas no perfil e mostra o aviso. */
  unlock: (ids: string[]) => void;
  difficulty: () => Difficulty;
  setDifficulty: (d: Difficulty) => void;
  mood: (m: Mood) => void;
  /** Pergunta o nome do jogador se ainda não perguntou (uma vez, no perfil). */
  ensurePlayerName: () => Promise<void>;
  /** Nome do jogador ('' = não informou). */
  playerName: () => string;
  /** Relíquias que apareceram: entram na coleção do perfil. */
  discoverRelics: (ids: readonly string[]) => void;
  /** Liga a Ficha do cabeçalho para a run em andamento (null = sem run). */
  setSheet: (open: (() => void) | null) => void;
  /** Recorde do modo infinito do Caminho Ninja (null = nenhum). */
  jornadaRecord: () => JornadaReach | null;
  /** Grava até onde a run do Caminho Ninja chegou; devolve se bateu o recorde. Nada no Laboratório. */
  recordJornada: (run: JRun) => boolean;
  /** As conquistas mais recentes do perfil, da mais nova para a mais antiga (dias desde que saíram). */
  /** `onlyJornada`: só as conquistas da Jornada (a entrada da Jornada); sem ele, todas (o Início). */
  recentAchievements: (limit: number, onlyJornada?: boolean) => { id: string; name: string; desc: string; days: number }[];
  /** Aviso curto (toast). */
  notify: (text: string, icon?: string) => void;
}
