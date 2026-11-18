// Guarda da meta de vitória do bot (docs/decisoes.md: Fácil 90, Médio 65, Difícil 40, Hardcore 15). Não mede o
// balanceamento (para isso, `npm run sim:origens` e `npm run sim:jornada` com 300 runs e a skill auditar-balanceamento):
// só acusa quando uma mudança mexeu na vitória sem querer. Simulação curta, seed fixa, faixa larga.
// Uso: npm run check:meta   (roda na CI, em job próprio; leva cerca de 1 a 2 minutos)
// Quebrou: não ajuste número para passar. Pare e proponha ao usuário com a tabela de antes e depois (AGENTS.md).
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { report, type Finding } from './harness';
import { roletaData } from '../src/data/roleta/index';

export const META: Record<string, number> = { easy: 0.9, normal: 0.65, hard: 0.4, hardcore: 0.15 };
/** Folga de cada célula (origem ou classe × dificuldade, amostra pequena) e da média de cada modo por dificuldade. */
export const FOLGA_CELULA = 0.2;
export const FOLGA_MEDIA = 0.1;
/** Grupos que cada simulação tem de devolver: as origens dos dados do Roleta e os modos da Jornada (os de sim-jornada.ts). */
export const GRUPOS = {
  Roleta: roletaData.base.lineages.map((l) => l.id),
  Jornada: ['canon', 'generic:common', 'generic:prodigy', 'generic:uchiha', 'generic:hyuuga'],
};
export const SIMS = [
  { modo: 'Roleta' as const, args: ['scripts/sim-origens.ts', '--runs', '60', '--seed', '2', '--ciclos', '1', '--json'] },
  { modo: 'Jornada' as const, args: ['scripts/sim-jornada.ts', '40', '2', '--json'] },
];

export interface MetaRow {
  grupo: string;
  dif: string;
  vitoria: number;
}

export function parseMetaJson(stdout: string): MetaRow[] {
  const line = stdout.split('\n').find((l) => l.startsWith('META_JSON '));
  if (!line) throw new Error('a simulação não imprimiu a linha META_JSON');
  return JSON.parse(line.slice('META_JSON '.length)) as MetaRow[];
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * A simulação cobriu tudo? Ao menos um grupo, uma célula por grupo e dificuldade da meta, sem repetição, e taxas
 * finitas entre 0 e 1. Sem isso, a comparação com a meta ficaria verde sem ter medido nada.
 */
export function validateRows(modo: string, rows: unknown, esperados?: readonly string[]): Finding[] {
  const err = (message: string, files?: string[]): Finding[] => [{ level: 'erro', rule: 'meta-cobertura', message: `${modo}: ${message}`, files }];
  if (!Array.isArray(rows) || rows.length === 0) return err('a simulação não devolveu nenhuma célula.');
  const bad = rows.filter(
    (r) =>
      typeof r !== 'object' || r === null || typeof (r as MetaRow).grupo !== 'string' || typeof (r as MetaRow).dif !== 'string' ||
      typeof (r as MetaRow).vitoria !== 'number' || !Number.isFinite((r as MetaRow).vitoria) || (r as MetaRow).vitoria < 0 || (r as MetaRow).vitoria > 1,
  );
  if (bad.length) return err('células com formato ou taxa inválida (esperado { grupo, dif, vitoria entre 0 e 1 }):', bad.map((r) => JSON.stringify(r)));
  const cells = rows as MetaRow[];
  const keys = cells.map((r) => `${r.grupo} · ${r.dif}`);
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dup.length) return err('células repetidas:', [...new Set(dup)]);
  const groups = esperados ?? [...new Set(cells.map((r) => r.grupo))];
  if (esperados) {
    const extra = [...new Set(cells.map((r) => r.grupo))].filter((g) => !esperados.includes(g));
    if (extra.length) return err('grupos que a simulação não deveria ter:', extra);
  }
  const missing = groups.flatMap((g) => Object.keys(META).filter((d) => !keys.includes(`${g} · ${d}`)).map((d) => `${g} · ${d}`));
  if (missing.length) return err('células faltando (cada grupo precisa das quatro dificuldades):', missing);
  return [];
}

export function checkMeta(modo: string, rows: MetaRow[], esperados?: readonly string[]): Finding[] {
  const invalid = validateRows(modo, rows, esperados);
  if (invalid.length) return invalid;
  const out: Finding[] = [];
  const fora = rows.filter((r) => META[r.dif] !== undefined && Math.abs(r.vitoria - META[r.dif]!) > FOLGA_CELULA);
  if (fora.length)
    out.push({
      level: 'erro',
      rule: 'meta-celula',
      message: `${modo}: vitória fora da meta ±${pct(FOLGA_CELULA)} em ${fora.length} célula(s):`,
      files: fora.map((r) => `${r.grupo} · ${r.dif}: ${pct(r.vitoria)} (meta ${pct(META[r.dif]!)})`),
    });
  for (const [dif, alvo] of Object.entries(META)) {
    const cell = rows.filter((r) => r.dif === dif);
    if (!cell.length) continue;
    const media = cell.reduce((a, r) => a + r.vitoria, 0) / cell.length;
    if (Math.abs(media - alvo) > FOLGA_MEDIA)
      out.push({ level: 'erro', rule: 'meta-media', message: `${modo} · ${dif}: média ${pct(media)}, meta ${pct(alvo)} ±${pct(FOLGA_MEDIA)}.` });
  }
  return out;
}

async function main(): Promise<void> {
  const run = promisify(execFile);
  const results = await Promise.all(
    SIMS.map(async ({ modo, args }) => {
      const { stdout } = await run('npx', ['tsx', ...args], { maxBuffer: 64 * 1024 * 1024 });
      return { modo, rows: parseMetaJson(stdout) };
    }),
  );
  const findings = results.flatMap(({ modo, rows }) => checkMeta(modo, rows, GRUPOS[modo]));
  for (const { modo, rows } of results) {
    const byDif = Object.keys(META).map((d) => {
      const c = rows.filter((r) => r.dif === d);
      return `${d} ${pct(c.reduce((a, r) => a + r.vitoria, 0) / Math.max(1, c.length))}`;
    });
    console.log(`${modo}: ${byDif.join(' · ')} (média das ${new Set(rows.map((r) => r.grupo)).size} origens ou classes)`);
  }
  process.exitCode = report('check:meta', findings);
  if (process.exitCode) console.log('Não ajuste números para passar: proponha ao usuário com a tabela de antes e depois (AGENTS.md).');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) void main();
