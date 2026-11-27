// Confere se o diff da tarefa cabe no contrato (AGENTS.md, "Escopo"; modelo em docs/processo/tarefa-modelo.md).
// O tema vem de CHECK_TEMA, da branch feature/<tema> ou do único docs/tarefas/<tema>.md alterado no diff (branches com
// nome próprio, como as do Codex na nuvem). O contrato não tem etiqueta de aprovação: o staging é o playground dos
// agentes e a revisão do usuário é a release (docs/processo/fluxo.md). Na correção automática de uma issue (branch
// feature/issue-<n>), a CI do PR (CHECK_PR=true) traz em CHECK_ISSUE_ETIQUETAS as etiquetas que o dono pôs na issue: a
// branch do loop só vale com a `correcao-automatica` dele e o contrato com `issue: <n>` (docs/processo/issues.md).
// Uso: npm run check:escopo
import { pathToFileURL } from 'node:url';
import { currentBranch, gitChanges, inCi, lockfileOnlyVersion, matchesAny, packageJsonChange, readVersion, report, type Finding } from './harness';

/** Sem contrato (ou sem tema): aviso até esta data, erro a partir dela (o hábito pegar). */
export const EXIGIR_CONTRATO_A_PARTIR = '2026-12-02';
/** Etiqueta da issue que o loop corrige sozinho, posta pelo usuário: o que libera a branch feature/issue-<n>. */
export const ETIQUETA_AUTOMATICA = 'correcao-automatica';
/** O que a correção automática nunca toca: balanceamento é sempre do usuário (AGENTS.md, "Convenções"). */
export const NUNCA_AUTOMATICO = ['src/data/balance*'];
/**
 * Área de cada agente (AGENTS.md, "Dois agentes"): o Codex no visual, o Claude na implementação. Arquivo da área do outro
 * agente, pelo `agente:` do contrato, dá aviso (às vezes um ajuste pequeno do outro lado faz sentido).
 */
export const AREA_VISUAL = ['prototype/styles/**', 'public/img/**'];
export const AREA_IMPLEMENTACAO = ['src/core/**', 'src/data/balance*', 'src/data/*/balance*'];
/** Branch da correção automática de uma issue. */
export const ISSUE_BRANCH = /^feature\/issue-(\d+)$/;
/**
 * Branch da release (docs/processo/fluxo.md, "Release"): contrato implícito, sem docs/tarefas nem etiqueta, porque o
 * "prepara a v0.Y.0" do usuário é a aprovação. O diff só pode juntar os fragmentos no CHANGELOG e subir a versão.
 */
export const RELEASE_BRANCH = /^feature\/release-v\d+\.\d+\.\d+$/;
export const ESCOPO_RELEASE = ['CHANGELOG.md', 'changelog.d/*.md'];

/**
 * Sempre dentro do escopo: changelog e registro de decisões, que toda tarefa pode tocar. O package.json e o
 * package-lock.json, à parte: passam sozinhos só se mudar apenas a versão do projeto (o resto muda o que se instala).
 */
export const SEMPRE = ['CHANGELOG.md', 'changelog.d/*.md', 'docs/registro.md', 'docs/decisoes.md'];

export interface Contrato {
  objetivo?: string;
  agente?: string;
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
  const fromBranch = /^(?:feature|hotfix)\/(.+)$/.exec(branch)?.[1];
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
  /** Etiquetas que o dono pôs na issue <n> numa branch feature/issue-<n> (na CI do PR), ou null fora do PR. */
  issueLabels?: string[] | null;
}

export function checkEscopo({
  branch,
  files,
  contrato,
  hoje,
  env = {},
  packageOnlyVersion = false,
  lockOnlyVersion = false,
  issueLabels = null,
}: EscopoInput): Finding[] {
  const exigido = hoje >= EXIGIR_CONTRATO_A_PARTIR;
  // staging e master juntam várias tarefas, cada uma conferida no próprio PR (docs/processo/fluxo.md).
  if (/^(staging|master)$/.test(branch) && !env.CHECK_TEMA) return [];
  if (RELEASE_BRANCH.test(branch) && !env.CHECK_TEMA) {
    const soltos = files.filter(
      (f) => !matchesAny(f, ESCOPO_RELEASE) && !(f === 'package.json' && packageOnlyVersion) && !(f === 'package-lock.json' && lockOnlyVersion),
    );
    return soltos.length
      ? [
          {
            level: 'erro',
            rule: 'fora-do-escopo',
            message: `A branch de release só junta os fragmentos (CHANGELOG.md, changelog.d/*.md) e sobe a versão do package.json; o resto vai numa feature/<tema> com contrato:`,
            files: soltos,
          },
        ]
      : [];
  }
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
  // A branch do loop só vale para a issue que o usuário promoveu, com o contrato gerado dela (docs/processo/issues.md).
  if (issue && issueLabels !== null && (!issueLabels.includes(ETIQUETA_AUTOMATICA) || String(c.issue ?? '') !== issue))
    out.push({
      level: exigido ? 'erro' : 'aviso',
      rule: 'correcao-automatica',
      message: `A branch feature/issue-${issue} é do loop das issues: precisa da etiqueta "${ETIQUETA_AUTOMATICA}" posta pelo usuário na issue #${issue} e de "issue: ${issue}" em ${path}. Outra tarefa vai numa feature/<tema>.`,
    });
  const automaticos = issue ? files.filter((f) => matchesAny(f, NUNCA_AUTOMATICO)) : [];
  if (automaticos.length)
    out.push({
      level: 'erro',
      rule: 'correcao-automatica',
      message: `A correção automática da issue #${issue} não mexe em balanceamento (troque a etiqueta da issue por "precisa-decisao"; a mudança vai numa feature/<tema>):`,
      files: automaticos,
    });
  const outraArea =
    c.agente === 'claude' ? files.filter((f) => matchesAny(f, AREA_VISUAL)) : c.agente === 'codex' ? files.filter((f) => matchesAny(f, AREA_IMPLEMENTACAO)) : [];
  if (outraArea.length)
    out.push({
      level: 'aviso',
      rule: 'area-do-agente',
      message: `O contrato é do ${c.agente}, e estes arquivos são da área do ${c.agente === 'claude' ? 'Codex (visual)' : 'Claude (implementação)'} (AGENTS.md, "Dois agentes"). Se não for um ajuste pequeno, delegue ao outro agente:`,
      files: outraArea,
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
  const lockOnlyVersion =
    changes.files.includes('package-lock.json') && !!changes.base && lockfileOnlyVersion(readVersion('package-lock.json', { base: changes.base }), readVersion('package-lock.json', 'tree'));
  // Etiquetas que o dono pôs na issue <n> (branch feature/issue-<n>), lidas pela CI do PR; vazio quando a issue não existe ou não foi lida.
  const issueLabels =
    process.env.CHECK_PR === 'true' && ISSUE_BRANCH.test(branch) ? (process.env.CHECK_ISSUE_ETIQUETAS ?? '').split(',').map((l) => l.trim()).filter(Boolean) : null;
  const hoje = new Date().toISOString().slice(0, 10);
  findings.push(
    ...checkEscopo({ branch, files: changes.files, contrato, hoje, env: process.env, packageOnlyVersion, lockOnlyVersion, issueLabels }),
  );
  process.exitCode = report(`check:escopo (${branch || '?'}${tema ? `, tema ${tema}` : ''})`, findings);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
