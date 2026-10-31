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
  won: boolean;
  /** Quem derrotou o jogador (null na vitória). */
  fallenTo: string | null;
  revivesUsed: number;
  seed: number | null;
}

export interface ShareLabels {
  title: (version: string, difficulty: string) => string;
  level: (n: number) => string;
  win: string;
  loss: string;
  examWin: string;
  examLoss: string;
  victory: string;
  fallenTo: (name: string) => string;
  revives: (n: number) => string;
  seed: (n: number) => string;
}

const SEP = ' · ';

export function buildShareText(s: ShareSummary, L: ShareLabels): string {
  const mark = (e: TrailEntry, r: FightResult) =>
    e.exam ? (r === 'win' ? L.examWin : L.examLoss) : r === 'win' ? L.win : L.loss;
  const trail = s.trail
    .filter((e) => e.results.length > 0)
    .map((e) => `${e.name} ${e.results.map((r) => mark(e, r)).join('')}`)
    .join(SEP);
  const end = [s.won ? L.victory : s.fallenTo ? L.fallenTo(s.fallenTo) : null, L.revives(s.revivesUsed), s.seed !== null ? L.seed(s.seed) : null]
    .filter((x): x is string => Boolean(x))
    .join(SEP);
  return [L.title(s.version, s.difficulty), `${s.origin}${SEP}${L.level(s.level)}`, trail, end].filter(Boolean).join('\n');
}
