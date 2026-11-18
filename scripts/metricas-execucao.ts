// Perfil e registro de uma execução do Claude nos workflows do loop (docs/processo/metricas.md).
//   tsx scripts/metricas-execucao.ts perfil    → escreve perfil=… e modelo=… em $GITHUB_OUTPUT
//   tsx scripts/metricas-execucao.ts registra  → soma o execution_file, comenta na issue e escreve o resumo do job
// Entrada pelo ambiente: ISSUE, ETAPA (issue | revisao-<k>), PILOTO_PERFIS (on liga o piloto), e no registra
// EXECUTION_FILE, PR, TENTATIVA, PERFIL, MODELO, RESULTADO, FALHA. Usa o gh com GH_TOKEN e GH_REPO.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  comentario,
  escolhePerfil,
  lerMarcadores,
  MARCADOR_TENTATIVA,
  MODELOS,
  somaExecucao,
  type Etapa,
  type Falha,
  type Perfil,
  type Registro,
  type Resultado,
} from './metricas';

const gh = (...args: string[]): string => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Comentários da issue juntos, um por linha. */
export function comentariosDaIssue(issue: number): string {
  const repo = process.env.GH_REPO ?? '';
  return gh('api', `repos/${repo}/issues/${issue}/comments`, '--paginate', '--jq', '.[] | .body | gsub("\\n"; " ")');
}

const etapaValida = (s: string): s is Etapa => s === 'issue' || /^revisao-\d+$/.test(s);
const RESULTADOS: Resultado[] = ['pr-aberto', 'sem-pr', 'precisa-decisao', 'corrigido', 'sem-commit', 'nao-rodou'];
const FALHAS: Falha[] = ['', 'mudanca', 'execucao', 'ambiente'];

function saida(linhas: Record<string, string>): void {
  const texto = Object.entries(linhas).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, texto);
  process.stdout.write(texto);
}

function perfil(issue: number, etapa: Etapa): void {
  let texto = '';
  try {
    texto = comentariosDaIssue(issue);
  } catch (e) {
    console.warn(`::warning::Sem os comentários da issue #${issue} (${(e as Error).message}): perfil pela paridade.`);
  }
  const tentativasMarcadas = texto.split('\n').filter((l) => l.includes(MARCADOR_TENTATIVA)).length;
  const p: Perfil = escolhePerfil({ issue, piloto: process.env.PILOTO_PERFIS === 'on', registros: lerMarcadores(texto), etapa, tentativasMarcadas });
  saida({ perfil: p, modelo: MODELOS[p], tentativa: String(tentativasMarcadas + 1) });
}

function registra(issue: number, etapa: Etapa): void {
  const env = process.env;
  const arquivo = env.EXECUTION_FILE ?? '';
  const exec = arquivo && existsSync(arquivo) ? somaExecucao(readFileSync(arquivo, 'utf8')) : somaExecucao('');
  const resultado = (RESULTADOS as string[]).includes(env.RESULTADO ?? '') ? (env.RESULTADO as Resultado) : 'nao-rodou';
  let falha = (FALHAS as string[]).includes(env.FALHA ?? '') ? (env.FALHA as Falha) : '';
  if (!falha && resultado === 'nao-rodou') falha = 'ambiente';
  const perfilPedido: Perfil = env.PERFIL === 'leve' ? 'leve' : 'padrao';
  const r: Registro = {
    v: 1,
    issue,
    pr: Number(env.PR) > 0 ? Number(env.PR) : null,
    etapa,
    tentativa: Math.max(1, Number(env.TENTATIVA) || 1),
    perfil: perfilPedido,
    modelo: env.MODELO || MODELOS[perfilPedido],
    resultado,
    falha,
    quando: new Date().toISOString(),
    ...exec,
  };
  const corpo = comentario(r);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${corpo}\n`);
  const tmp = join(env.RUNNER_TEMP || tmpdir(), `metricas-${issue}-${etapa}.md`);
  writeFileSync(tmp, corpo);
  gh('issue', 'comment', String(issue), '--body-file', tmp);
  process.stdout.write(corpo);
}

function main(): void {
  const [cmd] = process.argv.slice(2);
  const issue = Number(process.env.ISSUE);
  const etapa = process.env.ETAPA ?? 'issue';
  if (!Number.isInteger(issue) || issue <= 0 || !etapaValida(etapa)) {
    console.error(`metricas-execucao: ISSUE (${process.env.ISSUE}) ou ETAPA (${etapa}) inválida.`);
    process.exit(2);
  }
  if (cmd === 'perfil') perfil(issue, etapa);
  else if (cmd === 'registra') registra(issue, etapa);
  else {
    console.error('uso: tsx scripts/metricas-execucao.ts perfil|registra');
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
