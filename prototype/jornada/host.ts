// O que a Jornada precisa do resto do protótipo (main.ts): armazenamento, preferências, perfil e som.
import type { Difficulty } from '../../src/core/difficulty';
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
}
