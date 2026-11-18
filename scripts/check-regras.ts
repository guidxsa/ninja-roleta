// Confere as convenções do AGENTS.md que dá para conferir por máquina. Roda no pre-commit, no `npm run check` e na CI.
// Uso: npm run check:regras [-- --estrito]   (na CI do PR, CHECK_ESTRITO=true faz o mesmo)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { currentBranch, gitChanges, matchesAny, report, type Finding } from './harness';

/** Arquivos que só mudam numa tarefa de processo (feature/harness*): o agente não afrouxa as próprias regras. */
export const PROTECTED = [
  'AGENTS.md',
  'CLAUDE.md',
  '.githooks/**',
  '.claude/settings.json',
  '.claude/hooks/**',
  'scripts/harness.ts',
  'scripts/check-*.ts',
  '.github/workflows/**',
];
export const HARNESS_BRANCH = /^feature\/harness/;

/** O que o core não pode usar (AGENTS.md, Convenções): DOM, armazenamento do navegador e sorteio sem rng injetado. */
const CORE_FORBIDDEN: [RegExp, string][] = [
  [/\bMath\.random\b/, 'Math.random (use o rng() injetado)'],
  [/\bdocument\s*\./, 'document (DOM)'],
  [/\bwindow\s*\./, 'window (DOM)'],
  [/\blocalStorage\b/, 'localStorage'],
  [/\bsessionStorage\b/, 'sessionStorage'],
];

/** Tira comentários para não acusar "sem Math.random" escrito num comentário. */
export const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');

/** Violações de pureza num arquivo do core (conteúdo inteiro, não só o diff). */
export function coreViolations(file: string, src: string): string[] {
  const code = stripComments(src);
  return CORE_FORBIDDEN.filter(([re]) => re.test(code)).map(([, what]) => `${file}: ${what}`);
}

export interface RegrasInput {
  files: string[];
  branch: string;
  strict: boolean;
  /** Conteúdo dos arquivos do core (todos, alterados ou não). */
  core: { file: string; src: string }[];
}

export function checkRegras({ files, branch, strict, core }: RegrasInput): Finding[] {
  const out: Finding[] = [];
  const has = (re: RegExp) => files.some((f) => re.test(f));
  const pick = (re: RegExp) => files.filter((f) => re.test(f));

  const impure = core.flatMap(({ file, src }) => coreViolations(file, src));
  if (impure.length)
    out.push({ level: 'erro', rule: 'core-puro', message: 'src/core não acessa DOM, armazenamento nem Math.random.', files: impure });

  const coreChanged = pick(/^src\/core\/.+\.ts$/);
  if (coreChanged.length && !has(/^tests\//))
    out.push({
      level: 'erro',
      rule: 'core-com-teste',
      message: 'Mudou regra em src/core sem mudar nenhum teste em tests/ (escreva ou ajuste o teste antes da fórmula).',
      files: coreChanged,
    });

  const balance = pick(/^src\/data\/balance[^/]*\.ts$/);
  if (balance.length && !files.includes('docs/registro.md'))
    out.push({
      level: strict ? 'erro' : 'aviso',
      rule: 'balance-com-registro',
      message: 'Mudou número de balanceamento sem registrar em docs/registro.md (tabela de antes e depois).',
      files: balance,
    });

  const game = pick(/^(src|prototype)\//);
  if (game.length && !has(/^docs\//) && !files.includes('CHANGELOG.md'))
    out.push({
      level: 'aviso',
      rule: 'doc-junto',
      message: 'Mudou o jogo sem mexer em docs/ nem no CHANGELOG.md. Se mudou regra, número ou algo que o jogador nota, atualize no mesmo commit.',
    });

  const prot = files.filter((f) => matchesAny(f, PROTECTED));
  if (prot.length && !HARNESS_BRANCH.test(branch))
    out.push({
      level: 'erro',
      rule: 'processo-protegido',
      message: `Arquivos do processo só mudam numa branch feature/harness* pedida pelo usuário (branch atual: ${branch || '?'}).`,
      files: prot,
    });

  return out;
}

function listTs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? listTs(p) : e.name.endsWith('.ts') ? [p.replaceAll('\\', '/')] : [];
  });
}

function main(): void {
  const strict = process.argv.includes('--estrito') || process.env.CHECK_ESTRITO === 'true';
  const { base, files } = gitChanges();
  const core = listTs('src/core').map((file) => ({ file, src: readFileSync(file, 'utf8') }));
  const findings = checkRegras({ files, branch: currentBranch(), strict, core });
  if (!base) findings.push({ level: 'aviso', rule: 'base', message: 'Sem origin/master nem master: só a pureza do core foi conferida.' });
  process.exitCode = report(`check:regras${strict ? ' (estrito)' : ''}, ${files.length} arquivo(s) alterado(s)`, findings);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
