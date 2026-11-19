// Limpeza de branches (AGENTS.md, "Limpeza de branches"). Apaga, no clone e no GitHub, as branches já integradas:
// a ponta está no origin/staging ou no origin/master, ou é a ponta de um PR mergeado (merge por squash). Compara com as
// bases remotas, não com o HEAD: o `git branch -d` recusa branch integrada quando o master local está desatualizado.
// Uso:
//   npm run limpar                         só mostra o plano
//   npm run limpar -- --aplicar            apaga as branches integradas sem worktree (local e remota)
//   npm run limpar -- --aplicar --worktrees  também remove o worktree limpo de uma branch integrada
// Nunca apaga master, main, staging, a branch atual, branch com PR aberto, nem branch com worktree sujo. Branch sem merge
// e parada há mais de 30 dias só é listada: apagar perde o trabalho, então é com o usuário.
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PROTEGIDAS = ['master', 'main', 'staging', 'HEAD'];
export const BASES = ['origin/staging', 'origin/master'];
export const DIAS_PARADA = 30;

export interface Branch {
  nome: string;
  sha: string;
  /** Data do último commit, em ms. */
  data: number;
}

export interface Worktree {
  caminho: string;
  branch: string | null;
  /** Mudanças não commitadas (arquivos rastreados ou novos não ignorados). */
  sujo: boolean;
  principal: boolean;
}

export interface Estado {
  atual: string;
  locais: Branch[];
  /** Branches do origin, sem o prefixo. */
  remotas: Branch[];
  worktrees: Worktree[];
  /** shas que já estão numa das bases. */
  integrados: Set<string>;
  /** Branch → pontas dos PRs mergeados dela. null: sem o gh, não deu para saber. */
  prMergeado: Map<string, Set<string>> | null;
  /** Branches com PR aberto. null: sem o gh, não deu para saber. */
  prAberto: Set<string> | null;
  agora: number;
}

export type Motivo = 'integrada' | 'pr-mergeado';

export interface Plano {
  apagarLocal: { nome: string; motivo: Motivo }[];
  apagarRemota: { nome: string; motivo: Motivo }[];
  /** Worktree limpo de branch integrada: removido só com --worktrees. */
  removerWorktree: { caminho: string; branch: string }[];
  /** Integradas que ficam, e por quê. */
  mantidas: { nome: string; motivo: string }[];
  /** Sem merge e paradas há mais de 30 dias: para o usuário decidir. */
  paradas: { nome: string; dias: number }[];
}

function motivoIntegrada(b: Branch, e: Estado): Motivo | null {
  if (e.integrados.has(b.sha)) return 'integrada';
  if (e.prMergeado?.get(b.nome)?.has(b.sha)) return 'pr-mergeado';
  return null;
}

/** Decide o que apagar. Função pura: todo o estado do repositório chega em `e`. */
export function planejarLimpeza(e: Estado): Plano {
  const plano: Plano = { apagarLocal: [], apagarRemota: [], removerWorktree: [], mantidas: [], paradas: [] };
  const worktreeDe = new Map(e.worktrees.filter((w) => w.branch).map((w) => [w.branch!, w]));
  const bloqueio = (nome: string): string | null => {
    if (PROTEGIDAS.includes(nome)) return 'protegida';
    if (nome === e.atual) return 'branch atual';
    if (e.prAberto?.has(nome)) return 'PR aberto';
    return null;
  };
  const vistas = new Set<string>();
  const parada = (b: Branch) => {
    if (vistas.has(b.nome)) return;
    vistas.add(b.nome);
    const dias = Math.floor((e.agora - b.data) / 86_400_000);
    if (dias > DIAS_PARADA) plano.paradas.push({ nome: b.nome, dias });
  };

  for (const b of e.locais) {
    if (bloqueio(b.nome)) continue;
    const motivo = motivoIntegrada(b, e);
    if (!motivo) {
      parada(b);
      continue;
    }
    const wt = worktreeDe.get(b.nome);
    if (wt?.principal) plano.mantidas.push({ nome: b.nome, motivo: 'em uso no clone principal' });
    else if (wt?.sujo) plano.mantidas.push({ nome: b.nome, motivo: `worktree com mudanças não commitadas (${wt.caminho})` });
    else {
      if (wt) plano.removerWorktree.push({ caminho: wt.caminho, branch: b.nome });
      plano.apagarLocal.push({ nome: b.nome, motivo });
    }
  }

  // Remota só com o gh: sem ele, não dá para saber se há PR aberto.
  for (const b of e.remotas) {
    const motivoBloqueio = bloqueio(b.nome);
    if (motivoBloqueio) continue;
    if (e.prAberto === null) {
      if (motivoIntegrada(b, e)) plano.mantidas.push({ nome: `origin/${b.nome}`, motivo: 'sem o gh para conferir PR aberto' });
      continue;
    }
    const motivo = motivoIntegrada(b, e);
    if (motivo) plano.apagarRemota.push({ nome: b.nome, motivo });
    else parada(b);
  }
  return plano;
}

// ---------------------------------------------------------------- repositório

const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
const tryRun = (cmd: string, args: string[]): string | null => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};

function lerBranches(ref: string, prefixo: string): Branch[] {
  return git('for-each-ref', ref, '--format=%(refname)%09%(objectname)%09%(committerdate:unix)')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [nome, sha, data] = l.split('\t') as [string, string, string];
      return { nome: nome.slice(prefixo.length), sha, data: Number(data) * 1000 };
    })
    .filter((b) => b.nome !== 'HEAD');
}

export function lerWorktrees(porcelain: string): Omit<Worktree, 'sujo'>[] {
  return porcelain
    .split(/\r?\n\r?\n/)
    .map((bloco) => bloco.split(/\r?\n/))
    .filter((linhas) => linhas[0]?.startsWith('worktree '))
    .map((linhas, i) => ({
      caminho: linhas[0]!.slice('worktree '.length),
      branch: linhas.find((l) => l.startsWith('branch refs/heads/'))?.slice('branch refs/heads/'.length) ?? null,
      principal: i === 0,
    }));
}

function lerEstado(): Estado {
  // Sem rede, segue com as referências que o clone já tem (o gh também falha e as remotas ficam de fora).
  if (tryRun('git', ['fetch', '--prune', '--quiet', 'origin']) === null) console.log('limpar: git fetch falhou; usando as referências locais.');
  git('worktree', 'prune');
  const locais = lerBranches('refs/heads', 'refs/heads/');
  const remotas = lerBranches('refs/remotes/origin', 'refs/remotes/origin/');
  const worktrees = lerWorktrees(git('worktree', 'list', '--porcelain')).map((w) => ({
    ...w,
    sujo: existsSync(w.caminho) ? (tryRun('git', ['-C', w.caminho, 'status', '--porcelain']) ?? 'x').trim() !== '' : false,
  }));
  const integrados = new Set<string>();
  for (const b of [...locais, ...remotas]) {
    if (BASES.some((base) => tryRun('git', ['merge-base', '--is-ancestor', b.sha, base]) !== null)) integrados.add(b.sha);
  }
  const prs = (estado: string) => {
    const out = tryRun('gh', ['pr', 'list', '--state', estado, '--limit', '200', '--json', 'headRefName,headRefOid']);
    return out === null ? null : (JSON.parse(out) as { headRefName: string; headRefOid: string }[]);
  };
  const mergeados = prs('merged');
  const abertos = prs('open');
  let prMergeado: Estado['prMergeado'] = null;
  if (mergeados) {
    prMergeado = new Map();
    for (const p of mergeados) prMergeado.set(p.headRefName, (prMergeado.get(p.headRefName) ?? new Set()).add(p.headRefOid));
  }
  return {
    atual: git('rev-parse', '--abbrev-ref', 'HEAD').trim(),
    locais,
    remotas,
    worktrees,
    integrados,
    prMergeado,
    prAberto: abertos ? new Set(abertos.map((p) => p.headRefName)) : null,
    agora: Date.now(),
  };
}

/** `git worktree remove` e, se a pasta sobrar (no Windows o git esbarra na permissão de apagar subpasta), o Node apaga. */
function removerWorktree(caminho: string): void {
  tryRun('git', ['worktree', 'remove', caminho]);
  if (existsSync(caminho)) rmSync(caminho, { recursive: true, force: true });
  git('worktree', 'prune');
}

function main(): void {
  const args = process.argv.slice(2);
  const aplicar = args.includes('--aplicar');
  const comWorktrees = args.includes('--worktrees');
  const e = lerEstado();
  const p = planejarLimpeza(e);
  if (e.prAberto === null) console.log('limpar: sem o gh (ou sem rede): só as branches locais integradas; as remotas ficam.');

  const semWorktree = new Set(p.removerWorktree.map((w) => w.branch));
  const locais = p.apagarLocal.filter((b) => comWorktrees || !semWorktree.has(b.nome));
  const adiadas = p.apagarLocal.filter((b) => !comWorktrees && semWorktree.has(b.nome));
  const linha = (rotulo: string, itens: string[]) => itens.length && console.log(`${rotulo}:\n  ${itens.join('\n  ')}`);

  linha(aplicar ? 'Apagando no clone' : 'Apagaria no clone', locais.map((b) => `${b.nome} (${b.motivo})`));
  linha(aplicar ? 'Apagando no GitHub' : 'Apagaria no GitHub', p.apagarRemota.map((b) => `origin/${b.nome} (${b.motivo})`));
  linha('Integradas com worktree limpo (removidos com --worktrees)', adiadas.map((b) => `${b.nome}: ${p.removerWorktree.find((w) => w.branch === b.nome)!.caminho}`));
  linha('Integradas que ficam', p.mantidas.map((m) => `${m.nome}: ${m.motivo}`));
  linha(`Sem merge e paradas há mais de ${DIAS_PARADA} dias (só com aprovação do usuário)`, p.paradas.map((b) => `${b.nome}: ${b.dias} dias`));
  if (!locais.length && !p.apagarRemota.length && !adiadas.length && !p.paradas.length) console.log('limpar: nada a apagar.');
  if (!aplicar) return;

  for (const b of locais) {
    const wt = p.removerWorktree.find((w) => w.branch === b.nome);
    if (wt) removerWorktree(wt.caminho);
    git('branch', '-D', b.nome); // integrada, conferido acima contra as bases remotas ou o PR mergeado
  }
  if (p.apagarRemota.length) git('push', 'origin', '--delete', ...p.apagarRemota.map((b) => b.nome));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
