// Base comum das verificações do processo (check-regras.ts e check-escopo.ts; AGENTS.md, "Como trabalhar").
// As regras são funções puras sobre a lista de arquivos alterados; só gitChanges() e currentBranch() tocam o git.
import { execFileSync } from 'node:child_process';

export interface Finding {
  level: 'erro' | 'aviso';
  rule: string;
  message: string;
  files?: string[];
}

const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const tryGit = (...args: string[]): string | null => {
  try {
    return git(...args);
  } catch {
    return null;
  }
};

/** Branch atual: na CI vem do GitHub (no PR, a branch de origem); fora dela, do git. */
export function currentBranch(env: NodeJS.ProcessEnv = process.env): string {
  return env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || tryGit('rev-parse', '--abbrev-ref', 'HEAD') || '';
}

/**
 * Arquivos alterados em relação ao ponto em que a branch saiu do master (commits, área de preparo, mudanças não
 * preparadas e arquivos novos). Base: CHECK_BASE, senão origin/master, senão master. Sem base, lista vazia.
 */
export function gitChanges(env: NodeJS.ProcessEnv = process.env): { base: string | null; files: string[] } {
  const candidates = [env.CHECK_BASE, 'origin/master', 'master'].filter((b): b is string => !!b);
  const ref = candidates.find((b) => tryGit('rev-parse', '--verify', '--quiet', `${b}^{commit}`) !== null);
  if (!ref) return { base: null, files: [] };
  const base = tryGit('merge-base', 'HEAD', ref) ?? ref;
  const changed = (tryGit('diff', '--name-only', base) ?? '').split('\n');
  const untracked = (tryGit('ls-files', '--others', '--exclude-standard') ?? '').split('\n');
  const files = [...new Set([...changed, ...untracked].map((f) => f.trim()).filter(Boolean))].sort();
  return { base: ref, files };
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
