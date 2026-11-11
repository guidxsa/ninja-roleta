/**
 * Texto de compartilhar a run (estilo Wordle): uma linha por informação, emojis no caminho.
 * Recebe os nomes já traduzidos; não acessa DOM.
 */

export type FightResult = 'win' | 'loss';

/** Uma etapa da campanha: um vilão, um bloco ou o exame. */
export interface TrailEntry {
  name: string;
  exam: boolean;
  results: FightResult[];
}

export interface ShareSummary {
  version: string;
  difficulty: string;
  origin: string;
  level: number;
  trail: TrailEntry[];
  /** A run foi vencida (o chefe do 1º ciclo caiu). Cair depois, no modo infinito, não desfaz. */
  won: boolean;
  /** Quem derrotou o jogador (null na vitória sem queda e no abandono). */
  fallenTo: string | null;
  /** Ciclo alcançado, contando do 1. */
  cycle: number;
  revivesUsed: number;
  seed: number | null;
  /** Endereço que repete as roletas da run (`?seed=`); null quando não há seed ou o jogo não está num endereço web. */
  replayUrl: string | null;
}

export interface ShareLabels {
  title: (version: string, difficulty: string) => string;
  level: (n: number) => string;
  win: string;
  loss: string;
  examWin: string;
  examLoss: string;
  victory: string;
  /** Ciclo alcançado (modo infinito), quando passou do 1º. */
  cycle: (n: number) => string;
  fallenTo: (name: string) => string;
  /** Queda no modo infinito: a run já tinha sido vencida. */
  fallenInCycle: (cycle: number, name: string) => string;
  revives: (n: number) => string;
  seed: (n: number) => string;
  replay: (url: string) => string;
}

const SEP = ' · ';

/** Endereço que repete a run: a página atual com `?seed=` (sem os outros parâmetros). Só em http(s). */
export function replayUrl(location: { protocol: string; origin: string; pathname: string }, seed: number | null): string | null {
  if (seed === null || !/^https?:$/.test(location.protocol)) return null;
  return `${location.origin}${location.pathname}?seed=${seed}`;
}

export function buildShareText(s: ShareSummary, L: ShareLabels): string {
  const mark = (e: TrailEntry, r: FightResult) =>
    e.exam ? (r === 'win' ? L.examWin : L.examLoss) : r === 'win' ? L.win : L.loss;
  const trail = s.trail
    .filter((e) => e.results.length > 0)
    .map((e) => `${e.name} ${e.results.map((r) => mark(e, r)).join('')}`)
    .join(SEP);
  // Vitória no 1º ciclo e queda no infinito são as duas coisas: a run foi vencida e terminou num ciclo seguinte.
  const outcome = s.won
    ? [L.victory, s.fallenTo ? L.fallenInCycle(s.cycle, s.fallenTo) : s.cycle > 1 ? L.cycle(s.cycle) : null]
    : [s.fallenTo ? L.fallenTo(s.fallenTo) : null];
  const end = [...outcome, L.revives(s.revivesUsed), s.seed !== null ? L.seed(s.seed) : null]
    .filter((x): x is string => Boolean(x))
    .join(SEP);
  return [L.title(s.version, s.difficulty), `${s.origin}${SEP}${L.level(s.level)}`, trail, end, s.replayUrl ? L.replay(s.replayUrl) : '']
    .filter(Boolean)
    .join('\n');
}
