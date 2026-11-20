// Estado do protótipo: o que vem do aparelho (armazenamento, preferências, perfil), o RNG e a run do Roleta em memória.
// O jogo monta a sessão a partir do localStorage (prototype/main.ts); o UI Lab monta a dele, em memória
// (docs/ui-lab/ARCHITECTURE.md). As telas leem `ses` em vez de variáveis soltas, para a origem dos dados poder mudar.
import type { Difficulty } from '../../src/core/difficulty';
import type { PlayerState } from '../../src/core/player';
import type { NextFightMods } from '../../src/core/progression';
import { createRng, type Rng } from '../../src/core/rng';
import type { RRun } from '../../src/core/roleta/run';
import type { RunStats } from '../../src/core/runStats';
import type { TrailEntry } from '../../src/core/share';
import type { Origin } from '../../src/core/types';
import { roletaData as rdata } from '../../src/data/roleta/index';
import { loadProfile, type Profile } from '../../src/state/profile';
import type { KeyValueStorage } from '../../src/state/runHistory';
import { storageDoCanal } from '../../src/state/canal';
import { CANAL } from '../canal';

export const SETTINGS_KEY = 'proto_settings_v1';
export const DIFFICULTIES = Object.keys(rdata.base.balance.difficulty.multipliers) as Difficulty[];
export const DEFAULT_DIFFICULTY: Difficulty = rdata.base.balance.difficulty.default;

/** Preferências do aparelho (não é estado de campanha). A dificuldade é a última escolhida. */
export interface Settings {
  instant: boolean;
  difficulty: Difficulty;
  /** Efeitos sonoros (ligados por padrão). */
  sfx: boolean;
  /** Música de fundo (desligada por padrão). */
  music: boolean;
  /** Cenas animadas (vídeo nas vagas de ilustração); desligado é o modo Leve, o padrão. */
  animated: boolean;
  /** Minijogos de tempo da Jornada sem pressa (v0.91.0). */
  calmGames?: boolean;
}

/** Run do Roleta (só em memória). */
export interface Campaign {
  runId: string;
  origin: Origin;
  player: PlayerState;
  difficulty: Difficulty;
  /** Run do Roleta enxuto (ciclo, passo, vilão sorteado, baú). `player` e `mods` vivem aqui ao lado. */
  run: RRun;
  mods: NextFightMods;
  /** Seed das roletas (null quando não dá para repetir). */
  seed: number | null;
  /** Resultado de cada etapa jogada, para o Compartilhar. */
  trail: TrailEntry[];
  /** Estatísticas da run, para as conquistas. */
  stats: RunStats;
  /** O que aconteceu em cada etapa (chave `ciclo:etapa`): o evento e os textos das mudanças. A trilha mostra ao expandir. */
  log: Record<string, StepLog>;
}

export interface StepLog {
  event?: string;
  items: string[];
}

export interface Session {
  storage: KeyValueStorage;
  settings: Settings;
  /** Perfil: conquistas, Livro Bingo, relíquias, nome e avatar. */
  profile: Profile;
  /** Seed fixa (`?seed=N`); null = cada run sorteia a sua. */
  seed: number | null;
  /** A seed fixa já foi usada (só a primeira run da página a repete). */
  seedUsed: boolean;
  rng: Rng;
  /** Run do Roleta em andamento (null fora dela). */
  camp: Campaign | null;
  /** A run do Roleta ainda está em andamento (a tela de fim já apareceu = false). */
  campLive: boolean;
  /** Jogador da luta em andamento, para a Ficha mostrar HP e chakra da luta. */
  battlePlayer: (() => PlayerState) | null;
  /** Ficha da Jornada: abre a da run em andamento (null = sem run da Jornada). */
  jornadaSheet: (() => void) | null;
  /** Etapa em andamento (a do mapa), para o registro; -1 fora de uma etapa. */
  logStep: number;
}

/** A sessão atual. Vazia até `initSession`. */
export const ses = {} as Session;

/** Preferências gravadas, com os padrões no que faltar ou estiver inválido. */
export function loadSettings(storage: KeyValueStorage): Settings {
  try {
    const saved = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>;
    const difficulty = saved.difficulty && DIFFICULTIES.includes(saved.difficulty) ? saved.difficulty : DEFAULT_DIFFICULTY;
    return { instant: Boolean(saved.instant), difficulty, sfx: saved.sfx !== false, music: Boolean(saved.music), animated: Boolean(saved.animated), calmGames: Boolean(saved.calmGames) };
  } catch {
    return { instant: false, difficulty: DEFAULT_DIFFICULTY, sfx: true, music: false, animated: false };
  }
}

export function saveSettings(): void {
  try {
    ses.storage.setItem(SETTINGS_KEY, JSON.stringify(ses.settings));
  } catch {
    /* conveniência */
  }
}

/** Monta a sessão: preferências e perfil lidos do `storage`, RNG pela seed (ou aleatório), sem run. */
export function initSession(storage: KeyValueStorage, seed: number | null): void {
  Object.assign(ses, {
    storage,
    settings: loadSettings(storage),
    profile: loadProfile(storage),
    seed,
    seedUsed: false,
    rng: seed !== null ? createRng(seed) : () => Math.random(),
    camp: null,
    campLive: false,
    battlePlayer: null,
    jornadaSheet: null,
    logStep: -1,
  } satisfies Session);
}

/**
 * O `localStorage` do navegador; bloqueado (modo privado, permissão), um mapa em memória. No preview do staging, com
 * prefixo nas chaves (src/state/canal.ts), para não mexer no save de quem joga na produção.
 */
export function browserStorage(): KeyValueStorage {
  try {
    const ls = window.localStorage;
    ls.getItem('probe');
    return storageDoCanal(ls, CANAL);
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}
