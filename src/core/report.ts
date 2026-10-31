/**
 * Relatório para os testers mandarem: tudo o que é preciso para entender e repetir um caso
 * (versão, seed, ficha, estado da luta e o fim do log). Recebe os textos já traduzidos.
 */

export interface ReportRun {
  origin: string;
  difficulty: string;
  stage: string;
  level: number;
  revivesUsed: number;
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  /** Pares [rótulo, valor] dos status. */
  stats: [string, number | string][];
  techniques: string[];
  bag: string[];
  summon: string | null;
}

export interface ReportBattle {
  villain: string;
  round: number;
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  /** Linhas do log, da mais antiga para a mais recente. */
  log: string[];
}

export interface ReportInput {
  version: string;
  date: string;
  seed: number | null;
  /** Link que repete as roletas (null sem seed). */
  link: string | null;
  note: string;
  device: string;
  run: ReportRun | null;
  battle: ReportBattle | null;
}

export interface ReportLabels {
  title: (version: string) => string;
  date: string;
  seed: string;
  link: string;
  note: string;
  device: string;
  noRun: string;
  origin: string;
  difficulty: string;
  stage: string;
  level: string;
  revives: string;
  hp: string;
  chakra: string;
  techniques: string;
  bag: string;
  summon: string;
  battle: string;
  round: string;
  log: string;
  none: string;
}

/** Quantas linhas do log entram no relatório (as mais recentes). */
export const REPORT_LOG_LINES = 30;

export function buildReport(r: ReportInput, L: ReportLabels): string {
  const lines: string[] = [L.title(r.version), `${L.date}: ${r.date}`];
  if (r.seed !== null) lines.push(`${L.seed}: ${r.seed}`);
  if (r.link) lines.push(`${L.link}: ${r.link}`);
  const note = r.note.trim();
  if (note) lines.push('', `${L.note}:`, note);
  lines.push('');
  const run = r.run;
  if (!run) {
    lines.push(L.noRun);
  } else {
    lines.push(
      `${L.origin}: ${run.origin}`,
      `${L.difficulty}: ${run.difficulty}`,
      `${L.stage}: ${run.stage}`,
      `${L.level}: ${run.level} · ${L.revives}: ${run.revivesUsed}`,
      `${L.hp}: ${run.hp}/${run.maxHp} · ${L.chakra}: ${run.chakra}/${run.maxChakra}`,
      run.stats.map(([k, v]) => `${k} ${v}`).join(' · '),
      `${L.techniques}: ${run.techniques.join(', ') || L.none}`,
      `${L.bag}: ${run.bag.join(', ') || L.none}`,
      `${L.summon}: ${run.summon ?? L.none}`,
    );
  }
  const b = r.battle;
  if (b) {
    lines.push(
      '',
      `${L.battle}: ${b.villain} · ${L.round} ${b.round}`,
      `${b.villain}: ${L.hp} ${b.hp}/${b.maxHp} · ${L.chakra} ${b.chakra}/${b.maxChakra}`,
      `${L.log}:`,
      ...b.log.slice(-REPORT_LOG_LINES).map((l) => `- ${l}`),
    );
  }
  lines.push('', `${L.device}: ${r.device}`);
  return lines.join('\n');
}
