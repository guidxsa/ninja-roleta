// Confere as convenções do AGENTS.md que dá para conferir por máquina. Roda no pre-commit, no `npm run check` e na CI.
// Uso: npm run check:regras [-- --estrito] [-- --preparado]
//   --estrito   balance sem registro vira erro (na CI do PR, CHECK_ESTRITO=true faz o mesmo)
//   --preparado só o que está no índice, para o pre-commit (arquivos e conteúdo do core como vão no commit)
import { pathToFileURL } from 'node:url';
import { currentBranch, gitChanges, inCi, indexFiles, packageJsonChange, readVersion, matchesAny, report, type Finding } from './harness';

/** Arquivos que só mudam numa tarefa de processo pedida pelo usuário: o agente não afrouxa as próprias regras. */
export const PROTECTED = [
  'AGENTS.md',
  'CLAUDE.md',
  '.githooks/**',
  '.claude/settings.json',
  '.claude/hooks/**',
  'scripts/harness.ts',
  'scripts/check-*.ts',
  'scripts/staging.ts',
  'scripts/delegar.ts',
  '.github/workflows/**',
  '.github/pull_request_template.md',
  '.github/ISSUE_TEMPLATE/**',
  'docs/processo/**',
  '.claude/skills/**',
];
/** Branch de processo: `feature/harness` ou `feature/harness-<tema>` (AGENTS.md, "Dois agentes"). */
export const HARNESS_BRANCH = /^feature\/harness(-[a-z0-9-]+)?$/;
/**
 * Branches de integração (docs/processo/fluxo.md): só recebem PRs já conferidos na branch de origem. O PR staging → master
 * e o de sincronização master → staging carregam mudanças de processo aprovadas antes numa feature/harness-<tema>.
 */
export const INTEGRACAO_BRANCH = /^(staging|master)$/;
/** Números de balanceamento de cada modo (`src/data/balance.ts`, `src/data/roleta/balance.ts`...). */
export const BALANCE_FILE = /^src\/data\/(?:.+\/)?balance[^/]*\.ts$/;

const GLOBALS = /(?<![\w$.])(document|window|localStorage|sessionStorage|globalThis)\b(?!\s*:(?!:))/g;

/**
 * Apaga comentários e o conteúdo de strings e templates (vira espaço, mantendo as quebras de linha), para a busca
 * enxergar só código. Devolve também onde começa cada string, para conferir `Math['random']`.
 * Leitor léxico simples (o TypeScript 7 do projeto não expõe a API do compilador). Regex literal é reconhecida pelo
 * que vem antes da barra (operador, abertura ou palavra como return): o conteúdo também é apagado.
 */
export function codeOnly(src: string): { code: string; strings: Map<number, string> } {
  const out = src.split('');
  const strings = new Map<number, string>();
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  const templateDepth: number[] = [];
  /** A barra em `i` abre uma regex? Sim se o último código antes dela não é um valor (nome, número, fecha-parêntese). */
  const startsRegex = (i: number): boolean => {
    let k = i - 1;
    while (k >= 0 && /\s/.test(out[k]!)) k--;
    if (k < 0) return true;
    const prev = out[k]!;
    if (/[(,=:[!&|?{};+\-*%<>~^]/.test(prev)) return true;
    const word = /([A-Za-z_$][\w$]*)$/.exec(out.slice(Math.max(0, k - 12), k + 1).join(''))?.[1];
    return !!word && ['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'do', 'else', 'yield', 'await'].includes(word);
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      const e = src.indexOf('\n', i);
      const end = e < 0 ? src.length : e;
      blank(i, end);
      i = end;
    } else if (c === '/' && n === '*') {
      const e = src.indexOf('*/', i + 2);
      const end = e < 0 ? src.length : e + 2;
      blank(i, end);
      i = end;
    } else if (c === '/' && startsRegex(i)) {
      let j = i + 1;
      let inClass = false;
      while (j < src.length && src[j] !== '\n' && (inClass || src[j] !== '/')) {
        if (src[j] === '\\') j++;
        else if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
    } else if (c === "'" || c === '"' || c === '`' || (c === '}' && templateDepth.length && templateDepth[templateDepth.length - 1] === 0)) {
      const isTemplate = c === '`' || c === '}';
      if (c === '}') templateDepth.pop();
      const quote = isTemplate ? '`' : c;
      let j = i + 1;
      let text = '';
      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\') {
          text += src[j + 1] ?? '';
          j += 2;
          continue;
        }
        if (isTemplate && src[j] === '$' && src[j + 1] === '{') break;
        text += src[j];
        j++;
      }
      strings.set(i, text);
      blank(i + 1, j);
      if (isTemplate && src[j] === '$') {
        templateDepth.push(0);
        i = j + 2;
      } else i = j + 1;
    } else {
      if (templateDepth.length) {
        if (c === '{') templateDepth[templateDepth.length - 1]!++;
        else if (c === '}') templateDepth[templateDepth.length - 1]!--;
      }
      i++;
    }
  }
  return { code: out.join(''), strings };
}

/**
 * Violações de pureza num arquivo do core (strings, regex e comentários não contam): Math.random em qualquer forma
 * (`.random`, `?.random`, `['random']`, `const { random } = Math`), `Math` passado como valor (`const m = Math`, que
 * esconderia o random) e leitura de document, window, localStorage, sessionStorage ou globalThis (inclusive com `?.`).
 */
export function coreViolations(file: string, src: string): string[] {
  const { code, strings } = codeOnly(src);
  const found: string[] = [];
  const lineOf = (pos: number) => code.slice(0, pos).split('\n').length;
  const at = (pos: number, what: string) => found.push(`${file}:${lineOf(pos)}: ${what}`);
  for (const m of code.matchAll(/\bMath\s*\??\.\s*random\b/g)) at(m.index!, 'Math.random (use o rng() injetado)');
  for (const m of code.matchAll(/\bMath\s*(?:\?\.)?\s*\[\s*/g)) {
    const q = m.index! + m[0].length;
    if (strings.get(q) === 'random') at(m.index!, 'Math["random"] (use o rng() injetado)');
  }
  const destructured = new Set<number>();
  for (const m of code.matchAll(/\{[^{}]*\brandom\b[^{}]*\}\s*=\s*Math\b/g)) {
    at(m.index!, 'random tirado de Math (use o rng() injetado)');
    destructured.add(m.index! + m[0].length - 4);
  }
  for (const m of code.matchAll(/(?<![\w$.])Math\b(?!\s*(?:\?\.|\.|\[))/g))
    if (!destructured.has(m.index!)) at(m.index!, 'Math usado como valor (esconde o random; use o rng() injetado)');
  for (const m of code.matchAll(GLOBALS)) at(m.index!, `${m[1]} (o core não acessa DOM nem armazenamento)`);
  return found;
}

export interface RegrasInput {
  files: string[];
  branch: string;
  strict: boolean;
  /** Conteúdo dos arquivos do core (todos, alterados ou não). */
  core: { file: string; src: string }[];
  /** Os scripts do package.json mudaram em relação à base da branch (staging ou master)? */
  scriptsChanged?: boolean;
}

export function checkRegras({ files, branch, strict, core, scriptsChanged = false }: RegrasInput): Finding[] {
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

  const balance = pick(BALANCE_FILE);
  if (balance.length && !files.includes('docs/registro.md'))
    out.push({
      level: strict ? 'erro' : 'aviso',
      rule: 'balance-com-registro',
      message: 'Mudou número de balanceamento sem registrar em docs/registro.md (tabela de antes e depois, aprovada pelo usuário).',
      files: balance,
    });

  const game = pick(/^(src|prototype)\//);
  if (game.length && !has(/^docs\//) && !has(/^changelog\.d\//) && !files.includes('CHANGELOG.md'))
    out.push({
      level: 'aviso',
      rule: 'doc-junto',
      message: 'Mudou o jogo sem mexer em docs/ nem no CHANGELOG.md. Se mudou regra, número ou algo que o jogador nota, atualize no mesmo commit.',
    });

  const prot = [...files.filter((f) => matchesAny(f, PROTECTED)), ...(scriptsChanged ? ['package.json (scripts)'] : [])];
  if (prot.length && !HARNESS_BRANCH.test(branch) && !INTEGRACAO_BRANCH.test(branch))
    out.push({
      level: 'erro',
      rule: 'processo-protegido',
      message: `Arquivos do processo só mudam numa branch feature/harness ou feature/harness-<tema> pedida pelo usuário (branch atual: ${branch || '?'}).`,
      files: prot,
    });

  return out;
}

function main(): void {
  const strict = process.argv.includes('--estrito') || process.env.CHECK_ESTRITO === 'true';
  const staged = process.argv.includes('--preparado');
  const changes = gitChanges(process.env, staged);
  const where = staged ? 'index' : 'tree';
  const core = indexFiles('src/core')
    .filter((f) => f.endsWith('.ts'))
    .map((file) => ({ file, src: readVersion(file, where) }))
    .filter((c): c is { file: string; src: string } => c.src !== null);
  const pkgBefore = changes.base ? readVersion('package.json', { base: changes.base }) : staged ? readVersion('package.json', { base: 'HEAD' }) : null;
  const scriptsChanged = changes.files.includes('package.json') && packageJsonChange(pkgBefore, readVersion('package.json', where)).scriptsChanged;
  const findings = checkRegras({ files: changes.files, branch: currentBranch(), strict, core, scriptsChanged });
  if (changes.problem)
    findings.push({
      level: strict || inCi() ? 'erro' : 'aviso',
      rule: 'contexto-git',
      message: `Não deu para listar os arquivos alterados (${changes.problem}): só a pureza do core foi conferida.`,
    });
  const mode = [strict && 'estrito', staged && 'preparado'].filter(Boolean).join(', ');
  process.exitCode = report(`check:regras${mode ? ` (${mode})` : ''}, ${changes.files.length} arquivo(s) alterado(s)`, findings);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
