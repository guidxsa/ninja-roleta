// Delegação ao Codex local (docs/processo/delegacao.md; AGENTS.md, "Dois agentes"). O Claude escreve o contrato com
// `agente: codex` e o briefing; este script cria o worktree da feature/<tema> a partir do origin/staging, commita o
// contrato e roda o `codex exec` nele, sem rede. O Codex implementa e roda o npm run check, sem commitar (o sandbox dele
// não grava no .git, visto no 1º teste, 26/11/2026); o Claude confere, commita, dá push e abre o PR.
// Uso: npm run delegar -- <tema> [--contrato <arquivo>] [--nota "<texto>"] [--seco]
//   <tema>       a branch será feature/<tema> e o contrato, docs/tarefas/<tema>.md
//   --contrato   onde está o contrato escrito pelo Claude (padrão: docs/tarefas/<tema>.md no diretório atual)
//   --nota   texto a mais para o Codex (uma correção pedida numa segunda rodada, por exemplo)
//   --seco   só mostra o que faria (pasta, branch, comando e prompt), sem criar nada nem rodar o Codex
// Pasta dos worktrees: DELEGAR_PASTA ou ~/worktrees/ninja-roleta (fora do OneDrive, que trava a remoção de worktrees).
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { caminhoDoContrato, parseContrato } from './check-escopo';

export const TEMA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function pastaPadrao(env: NodeJS.ProcessEnv = process.env, home = homedir()): string {
  return env.DELEGAR_PASTA || join(home, 'worktrees', 'ninja-roleta');
}

/** O contrato pode ser delegado ao Codex? Devolve o motivo da recusa, ou null. */
export function motivoRecusa(tema: string, contrato: string | null): string | null {
  if (!TEMA.test(tema)) return `tema "${tema}" inválido: use letras minúsculas, números e hífen (vira feature/${tema}).`;
  if (tema.startsWith('harness') || tema.startsWith('issue-') || tema.startsWith('release-'))
    return `feature/${tema} é de processo, do loop das issues ou da release: não se delega ao Codex.`;
  if (contrato === null) return `sem contrato em ${caminhoDoContrato(tema)}: escreva-o antes (docs/processo/tarefa-modelo.md).`;
  let c;
  try {
    c = parseContrato(contrato);
  } catch (e) {
    return (e as Error).message;
  }
  if (!c?.escopo?.length) return `${caminhoDoContrato(tema)} sem a lista "escopo".`;
  if (c.agente !== 'codex') return `${caminhoDoContrato(tema)} diz "agente: ${c.agente ?? '?'}": só se delega contrato com "agente: codex".`;
  return null;
}

/** Instruções para o Codex: o contrato manda; o push e o PR ficam com o Claude. */
export function montarPrompt(tema: string, nota = ''): string {
  return [
    `Tarefa delegada pelo Claude. O contrato está em ${caminhoDoContrato(tema)} ("agente: codex") e já está commitado nesta`,
    `branch, feature/${tema}, criada a partir do origin/staging. Você está sozinho nela até terminar.`,
    '',
    '1. Leia o AGENTS.md e o contrato. Mexa só no que o "escopo" permite e nada do "fora". Se precisar sair do escopo,',
    '   pare e explique no resumo final, sem alterar o que está fora.',
    '2. Siga a skill que a tabela "Skills e fluxos" do AGENTS.md indica para o tipo de tarefa. Interface: docs/visual.md e',
    '   a skill impeccable, se estiver instalada; para conferir a tela, .claude/skills/revisar-visual/SKILL.md.',
    '3. Não mude ids, data-* nem as classes que o TS consulta (são contrato, AGENTS.md "Interface").',
    '4. Rode npm run check até passar. Se o jogador nota a mudança, escreva changelog.d/' + tema + '.md (docs/processo/fluxo.md).',
    '5. Não faça commit (o sandbox não grava no .git), não dê push, não abra PR, não troque de branch e não apague o',
    '   worktree: deixe as mudanças no worktree. O Claude confere, commita e publica.',
    '6. Termine com um resumo no formato de .github/pull_request_template.md: objetivo, fora do escopo, caminhos tocados,',
    '   como verificou (com a saída do npm run check) e achados fora do escopo.',
    ...(nota.trim() ? ['', 'Nota do Claude para esta rodada:', nota.trim()] : []),
  ].join('\n');
}

/** Argumentos do `codex exec`: escrita só no worktree, sem rede; o prompt vai pela entrada padrão. */
export function argsCodex(worktree: string, saida: string): string[] {
  return ['exec', '-s', 'workspace-write', '-C', worktree, '-o', saida, '-'];
}

/** Linha de comando para o shell (no Windows o codex é o atalho codex.cmd do npm): aspas em volta do que tem espaço. */
export function linhaDeComando(args: string[]): string {
  return ['codex', ...args.map((a) => (/[\s"]/.test(a) ? `"${a.replaceAll('"', '\\"')}"` : a))].join(' ');
}

const git = (cwd: string, ...args: string[]): string => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const temBranch = (cwd: string, ref: string): boolean => {
  try {
    git(cwd, 'rev-parse', '--verify', '--quiet', ref);
    return true;
  } catch {
    return false;
  }
};

export interface Args {
  tema: string;
  contrato: string | null;
  nota: string;
  seco: boolean;
}

/** `<tema> [--contrato <arquivo>] [--nota "<texto>"] [--seco]`, em qualquer ordem. */
export function lerArgs(argv: string[]): Args {
  const out: Args = { tema: '', contrato: null, nota: '', seco: false };
  for (let k = 0; k < argv.length; k++) {
    const a = argv[k]!;
    if (a === '--seco') out.seco = true;
    else if (a === '--nota') out.nota = argv[++k] ?? '';
    else if (a === '--contrato') out.contrato = argv[++k] ?? null;
    else if (!a.startsWith('--') && !out.tema) out.tema = a;
  }
  return out;
}

function main(): void {
  const { tema, contrato: arquivo, nota, seco } = lerArgs(process.argv.slice(2));
  const origemContrato = resolve(arquivo ?? caminhoDoContrato(tema || 'x'));
  const contrato = tema && existsSync(origemContrato) ? readFileSync(origemContrato, 'utf8') : null;
  const recusa = motivoRecusa(tema, contrato);
  if (recusa) {
    console.error(`delegar: ${recusa}`);
    process.exit(2);
  }

  const raiz = git(process.cwd(), 'rev-parse', '--show-toplevel');
  const pasta = pastaPadrao();
  const worktree = join(pasta, tema);
  const saida = join(pasta, `${tema}.resultado.md`);
  const log = join(pasta, `${tema}.log`);
  const branch = `feature/${tema}`;
  const prompt = montarPrompt(tema, nota);
  const args = argsCodex(worktree, saida);

  if (seco) {
    console.log(JSON.stringify({ worktree, branch, saida, log, comando: linhaDeComando(args), prompt }, null, 2));
    return;
  }

  mkdirSync(pasta, { recursive: true });
  if (!existsSync(worktree)) {
    git(raiz, 'fetch', '-q', 'origin', 'staging');
    if (temBranch(raiz, `refs/heads/${branch}`)) git(raiz, 'worktree', 'add', worktree, branch);
    else git(raiz, 'worktree', 'add', '-b', branch, worktree, 'origin/staging');
    console.log(`delegar: worktree ${worktree} na ${branch}; npm ci...`);
    execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: worktree, stdio: 'inherit', shell: process.platform === 'win32' });
  }
  // Contrato novo ou mudado: entra num commit do Claude antes do Codex começar.
  const destino = join(worktree, caminhoDoContrato(tema));
  if (!existsSync(destino) || readFileSync(destino, 'utf8') !== contrato) {
    copyFileSync(origemContrato, destino);
    git(worktree, 'add', caminhoDoContrato(tema));
    git(worktree, 'commit', '-q', '-m', `Contrato da tarefa ${tema} (delegada ao Codex)`);
  }

  console.log(`delegar: rodando o Codex em ${worktree} (log em ${log})...`);
  const fd = openSync(log, 'a');
  // Uma linha só para o shell: com a lista de argumentos e shell, o Node concatena sem aspas (aviso DEP0190).
  const r = spawnSync(linhaDeComando(args), { input: prompt, stdio: ['pipe', fd, fd], shell: true });
  const mudancas = git(worktree, 'status', '--porcelain');
  console.log(
    [
      `delegar: o Codex terminou (código ${r.status ?? r.error?.message ?? '?'}).`,
      `Resumo dele: ${saida}`,
      `Mudanças para conferir (sem commit):\n${mudancas || '(nenhuma)'}`,
      `Próximo passo (Claude): git -C "${worktree}" diff; conferir contra o contrato; git add <arquivos> e commit; git -C "${worktree}" push -u origin ${branch}; gh pr create --base staging.`,
    ].join('\n\n'),
  );
  if (r.status !== 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
