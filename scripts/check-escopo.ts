// Confere se o diff da branch cabe no contrato da tarefa (AGENTS.md, "Escopo"; modelo em docs/processo/tarefa-modelo.md).
// A branch feature/<tema> procura docs/tarefas/<tema>.md e compara os arquivos alterados com `escopo` e `fora`.
// Uso: npm run check:escopo
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { currentBranch, gitChanges, matchesAny, report, type Finding } from './harness';

/** Sem contrato numa feature/*: aviso até esta data, erro a partir dela (tempo para o hábito pegar). */
export const EXIGIR_CONTRATO_A_PARTIR = '2026-12-02';

/** Sempre dentro do escopo: versão, changelog e registro de decisões, que toda tarefa pode tocar. */
export const SEMPRE = ['package.json', 'package-lock.json', 'CHANGELOG.md', 'docs/registro.md', 'docs/decisoes.md'];

export interface Contrato {
  objetivo?: string;
  escopo?: string[];
  fora?: string[];
  [k: string]: unknown;
}

/** Lê o frontmatter do contrato: `chave: valor` por linha; listas no formato JSON (`["a/**", "b.md"]`). */
export function parseContrato(md: string): Contrato | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!m) return null;
  const out: Contrato = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    const kv = /^(\w+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    const [, key, raw] = kv as unknown as [string, string, string];
    if (raw.startsWith('[')) {
      try {
        out[key] = JSON.parse(raw);
      } catch {
        throw new Error(`contrato: a lista "${key}" não é JSON válido (use aspas duplas): ${raw}`);
      }
    } else out[key] = raw;
  }
  return out;
}

export const temaDaBranch = (branch: string): string | null => /^feature\/(.+)$/.exec(branch)?.[1] ?? null;
export const caminhoDoContrato = (tema: string): string => `docs/tarefas/${tema.replaceAll('/', '-')}.md`;

export interface EscopoInput {
  branch: string;
  files: string[];
  /** Conteúdo do contrato, ou null se o arquivo não existe. */
  contrato: string | null;
  hoje: string; // AAAA-MM-DD
}

export function checkEscopo({ branch, files, contrato, hoje }: EscopoInput): Finding[] {
  const tema = temaDaBranch(branch);
  if (!tema) return [{ level: 'aviso', rule: 'escopo', message: `Branch "${branch || '?'}" não é feature/<tema>: escopo não conferido.` }];
  const path = caminhoDoContrato(tema);
  if (contrato === null) {
    const level = hoje >= EXIGIR_CONTRATO_A_PARTIR ? 'erro' : 'aviso';
    return [{ level, rule: 'contrato', message: `Sem contrato em ${path} (modelo em docs/processo/tarefa-modelo.md). Obrigatório a partir de ${EXIGIR_CONTRATO_A_PARTIR}.` }];
  }
  let c: Contrato | null;
  try {
    c = parseContrato(contrato);
  } catch (e) {
    return [{ level: 'erro', rule: 'contrato', message: (e as Error).message }];
  }
  if (!c?.escopo?.length) return [{ level: 'erro', rule: 'contrato', message: `${path} sem frontmatter com a lista "escopo".` }];

  const fora = c.fora ?? [];
  const dentro = [...c.escopo, ...SEMPRE, path];
  const proibidos = files.filter((f) => matchesAny(f, fora) && f !== path);
  const soltos = files.filter((f) => !proibidos.includes(f) && !matchesAny(f, dentro));
  const out: Finding[] = [];
  if (proibidos.length)
    out.push({ level: 'erro', rule: 'fora-do-escopo', message: `Arquivos que o contrato (${path}) marca como "fora":`, files: proibidos });
  if (soltos.length)
    out.push({
      level: 'erro',
      rule: 'fora-do-escopo',
      message: `Arquivos fora do "escopo" de ${path}. Pare e peça ao usuário para ampliar o contrato, ou desfaça:`,
      files: soltos,
    });
  return out;
}

function main(): void {
  const branch = currentBranch();
  const { files } = gitChanges();
  const tema = temaDaBranch(branch);
  const path = tema ? caminhoDoContrato(tema) : null;
  const contrato = path && existsSync(path) ? readFileSync(path, 'utf8') : null;
  const hoje = new Date().toISOString().slice(0, 10);
  process.exitCode = report(`check:escopo (${branch || '?'})`, checkEscopo({ branch, files, contrato, hoje }));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
