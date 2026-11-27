// Tipos do UI Lab (docs/ui-lab/ARCHITECTURE.md). Só o lab importa de prototype/lab/.
import type { Profile } from '../../src/state/profile';
import type { KeyValueStorage } from '../../src/state/runHistory';
import type { JornadaHost } from '../jornada/host';
import type { Rng } from '../../src/core/rng';

/** Seções do catálogo: as categorias do inventário (docs/ui-lab/SCREEN_INVENTORY.md). */
export type Group = 'Entrada' | 'Roleta' | 'Jornada' | 'Narrativa' | 'Combate' | 'Progressão' | 'Recompensas' | 'Loja' | 'Fim da run' | 'Sistemas';

/** Preferências do quadro: vêm da URL (o catálogo monta a URL). */
export interface LabPrefs {
  instant: boolean;
}

export interface LabContext {
  /** Armazenamento em memória do cenário (perfil, histórico, save da Jornada). Nunca o do navegador. */
  storage: KeyValueStorage;
  /** RNG do cenário (seed fixa). */
  rng: Rng;
  seed: number;
  prefs: LabPrefs;
  /** O JornadaHost do jogo, ligado à sessão em memória do cenário. */
  jornadaHost: JornadaHost;
}

export interface Scenario {
  /** Id do inventário + variante: `jornada.entry:saved`. Único (tests/uilab.test.ts). */
  id: string;
  title: string;
  group: Group;
  /** Seed do RNG e do `Math.random` do quadro (padrão 1). */
  seed?: number;
  /** Perfil de partida (padrão: vazio). */
  profile?: () => Profile;
  /** Prepara o armazenamento antes da sessão: histórico de runs, save da Jornada. */
  setup?: (storage: KeyValueStorage) => void;
  /** Monta a tela real do jogo. Resolve quando a tela termina. */
  mount: (ctx: LabContext) => Promise<unknown>;
  /**
   * Para telas que sorteiam ao abrir: confere, com um RNG novo da seed do cenário, que o sorteio dá o resultado que o
   * título promete. O teste roda todos; se falhar (peso mudou), `npm run lab:seed -- <id>` acha outra seed.
   */
  expect?: (rng: Rng) => boolean;
}
