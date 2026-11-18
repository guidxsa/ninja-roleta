// Relatório do piloto de perfis (docs/processo/metricas.md): `npm run metricas` (precisa do gh autenticado).
// Lê os marcadores <!-- metricas:… --> das issues com a etiqueta inconsistencia e o estado dos PRs feature/issue-<n>.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { lerMarcadores, porGrupo, porIssue, tabelaMarkdown, type InfoIssue, type Registro } from './metricas';

const gh = (...args: string[]): string => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const json = <T>(...args: string[]): T => JSON.parse(gh(...args)) as T;

/** Categoria pela etiqueta cat:<nome>; sem etiqueta, sem-categoria. */
export const categoriaDe = (etiquetas: string[]): string => etiquetas.find((e) => e.startsWith('cat:'))?.slice(4) || 'sem-categoria';

function main(): void {
  const issues = json<{ number: number; labels: { name: string }[] }[]>('issue', 'list', '--label', 'inconsistencia', '--state', 'all', '--limit', '500', '--json', 'number,labels');
  const registros: Registro[] = [];
  const info: InfoIssue[] = [];
  for (const i of issues) {
    const texto = gh('api', `repos/{owner}/{repo}/issues/${i.number}/comments`, '--paginate', '--jq', '.[] | .body | gsub("\\n"; " ")');
    const rs = lerMarcadores(texto);
    if (rs.length === 0) continue;
    registros.push(...rs);
    const prs = json<{ number: number; state: string }[]>('pr', 'list', '--head', `feature/issue-${i.number}`, '--state', 'all', '--json', 'number,state');
    const pr = prs.find((p) => p.state === 'MERGED') ?? prs[0];
    let revisoesComAchados = 0;
    if (pr) {
      // Sem achados, o Codex só comenta (não publica revisão): toda revisão dele no PR tem achados (revisao.md, "Loop").
      const ids = gh('api', `repos/{owner}/{repo}/pulls/${pr.number}/reviews`, '--paginate', '--jq', '.[] | select(.user.login == "chatgpt-codex-connector[bot]") | .id');
      revisoesComAchados = ids.split('\n').filter((x) => x.trim()).length;
    }
    info.push({ issue: i.number, categoria: categoriaDe(i.labels.map((l) => l.name)), mergeado: pr?.state === 'MERGED', revisoesComAchados });
  }
  if (registros.length === 0) {
    console.log('Nenhuma issue com registro de métricas ainda.');
    return;
  }
  const linhas = porIssue(registros, info);
  process.stdout.write(tabelaMarkdown(linhas, porGrupo(linhas)));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
