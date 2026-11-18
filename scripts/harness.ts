// Base comum das verificações do processo (check-regras.ts e check-escopo.ts; AGENTS.md, "Como trabalhar").
// As regras são funções puras sobre a lista de arquivos alterados; só as funções de git abaixo tocam o repositório.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

export interface Finding {
  level: 'erro' | 'aviso';
  rule: string;
  message: string;
  files?: string[];
}

/** Roda o git na pasta `cwd` (padrão: a atual); null se ele falhar. */
const tryGitAt = (cwd: string | undefined, ...args: string[]): string | null => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};
const tryGit = (...args: string[]): string | null => tryGitAt(undefined, ...args);

/** Saída do git com -z: caminhos separados por NUL, sem aspas nem escapes (acentos e espaços chegam como são). */
const paths = (s: string | null): string[] => (s ?? '').split('\0').filter(Boolean);

/** Na CI (GitHub Actions) toda falta de contexto vira erro: a verificação não pode ficar verde sem ter conferido. */
export const inCi = (env: NodeJS.ProcessEnv = process.env): boolean => env.CI === 'true' || env.GITHUB_ACTIONS === 'true';

/** Branch atual: na CI vem do GitHub (no PR, a branch de origem); fora dela, do git. */
export function currentBranch(env: NodeJS.ProcessEnv = process.env): string {
  return env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || tryGit('rev-parse', '--abbrev-ref', 'HEAD')?.trim() || '';
}

export interface Changes {
  /** Ponto de comparação (merge-base com o master), ou null no modo do índice e quando não há base. */
  base: string | null;
  files: string[];
  /** Por que não deu para listar os arquivos (sem base, git falhou). Quem chama decide se é aviso ou erro. */
  problem?: string;
}

/**
 * Arquivos alterados em relação ao ponto em que a branch saiu do master: commits, área de preparo, mudanças não
 * preparadas e arquivos novos. Base: CHECK_BASE, senão origin/master, senão master.
 * Com `staged`, só o que está preparado para o próximo commit (pre-commit). Renomeação conta como remoção da origem
 * mais criação do destino (`--no-renames`): mover um arquivo de um caminho proibido para um permitido não esconde a origem.
 */
export function gitChanges(env: NodeJS.ProcessEnv = process.env, staged = false, cwd?: string): Changes {
  const tryGit = (...args: string[]) => tryGitAt(cwd, ...args);
  if (staged) {
    const out = tryGit('diff', '--cached', '--name-only', '-z', '--no-renames', '--diff-filter=ACMD');
    return out === null ? { base: null, files: [], problem: 'git diff --cached falhou' } : { base: null, files: paths(out).sort() };
  }
  const candidates = [env.CHECK_BASE, 'origin/master', 'master'].filter((b): b is string => !!b);
  const ref = candidates.find((b) => tryGit('rev-parse', '--verify', '--quiet', `${b}^{commit}`) !== null);
  if (!ref) return { base: null, files: [], problem: 'sem origin/master nem master para comparar (faça git fetch origin master)' };
  const base = tryGit('merge-base', 'HEAD', ref)?.trim();
  if (!base) return { base: null, files: [], problem: `sem ponto comum entre HEAD e ${ref}` };
  const changed = tryGit('diff', '--name-only', '-z', '--no-renames', base);
  const untracked = tryGit('ls-files', '-z', '--others', '--exclude-standard');
  if (changed === null || untracked === null) return { base, files: [], problem: 'git diff falhou' };
  return { base, files: [...new Set([...paths(changed), ...paths(untracked)])].sort() };
}

/** Conteúdo de um arquivo: na base (`git show <base>:arq`), no índice (`git show :arq`) ou na árvore de trabalho. */
export function readVersion(path: string, where: { base: string } | 'index' | 'tree'): string | null {
  if (where === 'tree') return existsSync(path) ? readFileSync(path, 'utf8') : null;
  return tryGit('show', where === 'index' ? `:${path}` : `${where.base}:${path}`);
}

/** Arquivos versionados sob uma pasta, como estão no índice (para conferir o que vai no commit). */
export const indexFiles = (dir: string): string[] => paths(tryGit('ls-files', '-z', '--cached', '--', dir));

/** O que mudou no package.json entre duas versões: só a versão do jogo, ou os scripts (que definem as verificações). */
export function packageJsonChange(before: string | null, after: string | null): { onlyVersion: boolean; scriptsChanged: boolean } {
  if (before === null || after === null) return { onlyVersion: false, scriptsChanged: before !== after };
  try {
    const a = JSON.parse(before) as Record<string, unknown>;
    const b = JSON.parse(after) as Record<string, unknown>;
    const scriptsChanged = JSON.stringify(a.scripts ?? null) !== JSON.stringify(b.scripts ?? null);
    const strip = (o: Record<string, unknown>) => JSON.stringify({ ...o, version: null });
    return { onlyVersion: strip(a) === strip(b), scriptsChanged };
  } catch {
    return { onlyVersion: false, scriptsChanged: true };
  }
}

/**
 * O package-lock.json mudou só na versão do projeto (a raiz e `packages[""]`, que o lançamento de versão atualiza)?
 * Qualquer outra mudança muda o que o `npm ci` instala e precisa estar no escopo do contrato.
 */
export function lockfileOnlyVersion(before: string | null, after: string | null): boolean {
  if (before === null || after === null) return false;
  try {
    const strip = (txt: string) => {
      const o = JSON.parse(txt) as { version?: unknown; packages?: Record<string, { version?: unknown }> };
      const root = o.packages?.[''];
      return JSON.stringify({ ...o, version: null, packages: o.packages ? { ...o.packages, '': root ? { ...root, version: null } : root } : o.packages });
    };
    return strip(before) === strip(after);
  } catch {
    return false;
  }
}

/** Converte um padrão glob (`*`, `**`, `?`) em expressão regular sobre caminhos com `/`. */
export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === '*') {
      if (glob[i + 1] === '*') {
        const slash = glob[i + 2] === '/';
        re += slash ? '(?:.*/)?' : '.*';
        i += slash ? 2 : 1;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export const matchesAny = (file: string, globs: readonly string[]): boolean => globs.some((g) => globToRegExp(g).test(file));

/** Imprime os achados e devolve o código de saída (1 se houver erro). */
export function report(title: string, findings: Finding[], out: (s: string) => void = console.log): number {
  const errors = findings.filter((f) => f.level === 'erro');
  const warnings = findings.filter((f) => f.level === 'aviso');
  for (const f of [...errors, ...warnings]) {
    out(`${f.level === 'erro' ? 'ERRO ' : 'AVISO'} [${f.rule}] ${f.message}`);
    for (const file of f.files ?? []) out(`        ${file}`);
  }
  out(`${title}: ${errors.length ? `${errors.length} erro(s)` : 'ok'}${warnings.length ? `, ${warnings.length} aviso(s)` : ''}`);
  return errors.length ? 1 : 0;
}
