// Confere se o diff da tarefa cabe no contrato (AGENTS.md, "Escopo"; modelo em docs/processo/tarefa-modelo.md).
// O tema vem de CHECK_TEMA, da branch feature/<tema> ou do único docs/tarefas/<tema>.md alterado no diff (branches com
// nome próprio, como as do Codex na nuvem). Na CI do PR (CHECK_PR=true), CHECK_ETIQUETAS traz as etiquetas: o contrato só vale com a
// etiqueta `contrato-aprovado`, que só o usuário põe, ou, na correção automática de uma issue (branch feature/issue-<n>, contrato
// com `issue: <n>`), com a etiqueta `correcao-automatica` na issue, lida pela CI em CHECK_ISSUE_ETIQUETAS (docs/processo/issues.md).
// Uso: npm run check:escopo
import { pathToFileURL } from 'node:url';
import { currentBranch, gitChanges, inCi, lockfileOnlyVersion, matchesAny, packageJsonChange, readVersion, report, type Finding } from './harness';

/** Sem contrato, ou sem a etiqueta de aprovação no PR: aviso até esta data, erro a partir dela (o hábito pegar). */
export const EXIGIR_CONTRATO_A_PARTIR = '2026-12-02';
export const ETIQUETA_APROVADO = 'contrato-aprovado';
/** Etiqueta da issue que o loop corrige sozinho: vale como aprovação do contrato gerado a partir dela. */
export const ETIQUETA_AUTOMATICA = 'correcao-automatica';
/** O que a correção automática nunca toca: balanceamento é sempre do usuário (AGENTS.md, "Convenções"). */
export const NUNCA_AUTOMATICO = ['src/data/balance*'];
/** Branch da correção automática de uma issue. */
export const ISSUE_BRANCH = /^feature\/issue-(\d+)$/;

/**
 * Sempre dentro do escopo: changelog e registro de decisões, que toda tarefa pode tocar. O package.json e o
 * package-lock.json, à parte: passam sozinhos só se mudar apenas a versão do projeto (o resto muda o que se instala).
 */
export const SEMPRE = ['CHANGELOG.md', 'docs/registro.md', 'docs/decisoes.md'];

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

export const caminhoDoContrato = (tema: string): string => `docs/tarefas/${tema.replaceAll('/', '-')}.md`;

/** De onde vem o tema da tarefa, nesta ordem: variável, branch feature/<tema>, único contrato alterado no diff. */
export function temaDaTarefa(branch: string, files: string[], env: NodeJS.ProcessEnv = {}): { tema: string | null; origem: string } {
  if (env.CHECK_TEMA) return { tema: env.CHECK_TEMA, origem: 'CHECK_TEMA' };
  const fromBranch = /^feature\/(.+)$/.exec(branch)?.[1];
  if (fromBranch) return { tema: fromBranch, origem: `branch ${branch}` };
  const contratos = files.filter((f) => /^docs\/tarefas\/[^/]+\.md$/.test(f));
  if (contratos.length === 1) return { tema: contratos[0]!.slice('docs/tarefas/'.length, -3), origem: `contrato alterado (${contratos[0]})` };
  return { tema: null, origem: contratos.length > 1 ? `${contratos.length} contratos alterados no diff` : 'nenhum contrato no diff' };
}

export interface EscopoInput {
  branch: string;
  files: string[];
  /** Conteúdo do contrato, ou null se o arquivo não existe. */
  contrato: string | null;
  hoje: string; // AAAA-MM-DD
  env?: NodeJS.ProcessEnv;
  /** O package.json mudou só na versão? (o resto do arquivo precisa estar no escopo) */
  packageOnlyVersion?: boolean;
  /** O package-lock.json mudou só na versão do projeto? */
  lockOnlyVersion?: boolean;
  /** Etiquetas do PR (na CI do PR), ou null fora de PR. */
  labels?: string[] | null;
  /** Etiquetas da issue <n> numa branch feature/issue-<n> (na CI do PR), ou null. */
  issueLabels?: string[] | null;
}

export function checkEscopo({ branch, files, contrato, hoje, env = {}, packageOnlyVersion = false, lockOnlyVersion = false, labels = null, issueLabels = null }: EscopoInput): Finding[] {
  const exigido = hoje >= EXIGIR_CONTRATO_A_PARTIR;
  const { tema, origem } = temaDaTarefa(branch, files, env);
  if (!tema)
    return [
      {
        // A partir da data, sem tema é erro em qualquer lugar (na CI e na máquina): use CHECK_TEMA se a branch não diz.
        level: exigido ? 'erro' : 'aviso',
        rule: 'escopo',
        message: `Não achei o tema da tarefa na branch "${branch || '?'}" (${origem}): use feature/<tema>, CHECK_TEMA ou altere um único docs/tarefas/<tema>.md. Escopo não conferido.`,
      },
    ];
  const path = caminhoDoContrato(tema);
  if (contrato === null)
    return [
      {
        level: exigido ? 'erro' : 'aviso',
        rule: 'contrato',
        message: `Sem contrato em ${path} (tema pela ${origem}; modelo em docs/processo/tarefa-modelo.md). Obrigatório a partir de ${EXIGIR_CONTRATO_A_PARTIR}.`,
      },
    ];
  let c: Contrato | null;
  try {
    c = parseContrato(contrato);
  } catch (e) {
    return [{ level: 'erro', rule: 'contrato', message: (e as Error).message }];
  }
  if (!c?.escopo?.length) return [{ level: 'erro', rule: 'contrato', message: `${path} sem frontmatter com a lista "escopo".` }];

  const out: Finding[] = [];
  const issue = ISSUE_BRANCH.exec(branch)?.[1];
  const aprovadoPeloUsuario = labels?.includes(ETIQUETA_APROVADO) ?? false;
  const aprovadoPelaIssue = !!issue && String(c.issue ?? '') === issue && (issueLabels?.includes(ETIQUETA_AUTOMATICA) ?? false);
  if (labels !== null && !aprovadoPeloUsuario && !aprovadoPelaIssue)
    out.push({
      level: exigido ? 'erro' : 'aviso',
      rule: 'contrato-aprovado',
      message: issue
        ? `O PR não tem a etiqueta "${ETIQUETA_APROVADO}" e a issue #${issue} não aprova sozinha (precisa da etiqueta "${ETIQUETA_AUTOMATICA}" e de "issue: ${issue}" em ${path}).`
        : `O PR não tem a etiqueta "${ETIQUETA_APROVADO}": o usuário ainda não aprovou o contrato ${path} (agente nunca põe essa etiqueta).`,
    });
  const automaticos = issue && !aprovadoPeloUsuario ? files.filter((f) => matchesAny(f, NUNCA_AUTOMATICO)) : [];
  if (automaticos.length)
    out.push({
      level: 'erro',
      rule: 'correcao-automatica',
      message: `A correção automática da issue #${issue} não mexe em balanceamento (troque a etiqueta da issue por "precisa-decisao"):`,
      files: automaticos,
    });

  const fora = c.fora ?? [];
  const dentro = [...c.escopo, ...SEMPRE, path];
  const livre = (f: string) =>
    matchesAny(f, dentro) || (f === 'package.json' && packageOnlyVersion) || (f === 'package-lock.json' && lockOnlyVersion);
  const proibidos = files.filter((f) => matchesAny(f, fora) && f !== path && !automaticos.includes(f));
  const soltos = files.filter((f) => !proibidos.includes(f) && !automaticos.includes(f) && !livre(f));
  if (proibidos.length)
    out.push({ level: 'erro', rule: 'fora-do-escopo', message: `Arquivos que o contrato (${path}) marca como "fora":`, files: proibidos });
  if (soltos.length)
    out.push({
      level: 'erro',
      rule: 'fora-do-escopo',
      message: `Arquivos fora do "escopo" de ${path}${soltos.some((f) => f.startsWith('package')) ? ' (package.json e package-lock.json só passam sozinhos se mudar apenas a versão)' : ''}. Pare e peça ao usuário para ampliar o contrato, ou desfaça:`,
      files: soltos,
    });
  return out;
}

function main(): void {
  const branch = currentBranch();
  const ci = inCi();
  const changes = gitChanges();
  const findings: Finding[] = [];
  if (changes.problem)
    findings.push({ level: ci ? 'erro' : 'aviso', rule: 'contexto-git', message: `Não deu para listar os arquivos alterados (${changes.problem}).` });
  const { tema } = temaDaTarefa(branch, changes.files, process.env);
  const path = tema ? caminhoDoContrato(tema) : null;
  const contrato = path ? readVersion(path, 'tree') : null;
  const packageOnlyVersion =
    changes.files.includes('package.json') && !!changes.base && packageJsonChange(readVersion('package.json', { base: changes.base }), readVersion('package.json', 'tree')).onlyVersion;
  // Só no PR (CHECK_PR=true, posto pela CI) as etiquetas contam; fora dele não há onde o usuário aprovar.
  const lockOnlyVersion =
    changes.files.includes('package-lock.json') && !!changes.base && lockfileOnlyVersion(readVersion('package-lock.json', { base: changes.base }), readVersion('package-lock.json', 'tree'));
  const labels = process.env.CHECK_PR === 'true' ? (process.env.CHECK_ETIQUETAS ?? '').split(',').map((l) => l.trim()).filter(Boolean) : null;
  // Etiquetas da issue <n> (branch feature/issue-<n>), lidas pela CI do PR; vazio quando a issue não existe ou não foi lida.
  const issueLabels =
    process.env.CHECK_PR === 'true' && ISSUE_BRANCH.test(branch) ? (process.env.CHECK_ISSUE_ETIQUETAS ?? '').split(',').map((l) => l.trim()).filter(Boolean) : null;
  const hoje = new Date().toISOString().slice(0, 10);
  findings.push(...checkEscopo({ branch, files: changes.files, contrato, hoje, env: process.env, packageOnlyVersion, lockOnlyVersion, labels, issueLabels }));
  process.exitCode = report(`check:escopo (${branch || '?'}${tema ? `, tema ${tema}` : ''})`, findings);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
