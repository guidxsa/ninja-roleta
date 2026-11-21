// Aprovações que só o usuário dá (AGENTS.md, "Escopo"; docs/processo/fluxo.md, "Entrada no staging"): lê a timeline e os
// comentários do PR que os workflows baixam com o gh e decide o que vale.
// - Etiqueta só conta se o último evento "labeled" dela foi do dono do repositório (bot e agente no Actions não aprovam).
// - Aprovação do contrato vale para o contrato como estava quando a etiqueta foi posta: o aprovacao.yml grava o blob de
//   cada docs/tarefas/*.md num comentário do github-actions[bot], e o check:escopo compara com o atual.
// - A aprovação do Codex vale para o commit que ele revisou: o bloco codex-review-state:v1 do comentário de resumo dele.
// Sem import de outros scripts: roda com `node` (Node 24 tira os tipos), sem npm ci, no portão do staging.
// Uso (entrada em arquivos com a saída de `gh api --paginate`, uma página ou várias):
//   node scripts/check-aprovacao.ts ci      DONO, ATUAIS_PR, TIMELINE_PR, COMENTARIOS_PR [, ATUAIS_ISSUE, TIMELINE_ISSUE]
//   node scripts/check-aprovacao.ts dono    DONO, ETIQUETA (posta no PR), TIMELINE → "sim" se o dono a pôs por último
//   node scripts/check-aprovacao.ts codex   PONTA, COMENTARIOS                 → veredito (VereditoCodex)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const BOT_CODEX = 'chatgpt-codex-connector[bot]';
export const BOT_ACTIONS = 'github-actions[bot]';
export const ETIQUETA_APROVADO = 'contrato-aprovado';
/** Marcador do comentário que o aprovacao.yml publica quando o usuário aprova o contrato. */
export const MARCADOR_APROVACAO = 'contrato-aprovado:v1';

export interface EventoTimeline {
  event?: string;
  label?: { name?: string } | null;
  actor?: { login?: string } | null;
  created_at?: string;
}
export interface Comentario {
  user?: { login?: string } | null;
  body?: string | null;
  created_at?: string;
}

const mesmo = (a: string | undefined, b: string) => !!a && a.toLowerCase() === b.toLowerCase();

/** Último evento "labeled" de cada etiqueta (a timeline vem em ordem cronológica). */
function ultimoLabeled(timeline: EventoTimeline[]): Map<string, EventoTimeline> {
  const ultimo = new Map<string, EventoTimeline>();
  for (const ev of timeline) if (ev.event === 'labeled' && ev.label?.name) ultimo.set(ev.label.name, ev);
  return ultimo;
}

/** Das etiquetas atuais, só as que o dono pôs por último (outra conta pondo de novo tira o valor). */
export function etiquetasDoDono(atuais: string[], timeline: EventoTimeline[], dono: string): string[] {
  const ultimo = ultimoLabeled(timeline);
  return atuais.filter((l) => mesmo(ultimo.get(l)?.actor?.login ?? undefined, dono));
}

export const marcadorAprovacao = (head: string, contratos: Record<string, string>): string =>
  `<!-- ${MARCADOR_APROVACAO} ${JSON.stringify({ head, contratos })} -->`;

/**
 * Blobs dos contratos no momento da última aprovação do dono: o registro do github-actions[bot] publicado depois dela.
 * null se o dono não aprovou ou se não há registro dessa aprovação.
 */
export function contratosAprovados(timeline: EventoTimeline[], comentarios: Comentario[], dono: string): Record<string, string> | null {
  const aprovacao = ultimoLabeled(timeline).get(ETIQUETA_APROVADO);
  if (!aprovacao || !mesmo(aprovacao.actor?.login ?? undefined, dono) || !aprovacao.created_at) return null;
  const re = new RegExp(`<!--\\s*${MARCADOR_APROVACAO}\\s+(\\{.*?\\})\\s*-->`, 's');
  let achado: Record<string, string> | null = null;
  for (const c of comentarios) {
    if (!mesmo(c.user?.login ?? undefined, BOT_ACTIONS) || !c.created_at || c.created_at < aprovacao.created_at) continue;
    const m = re.exec(c.body ?? '');
    if (!m) continue;
    try {
      const dados = JSON.parse(m[1]!) as { contratos?: unknown };
      if (dados.contratos && typeof dados.contratos === 'object') achado = dados.contratos as Record<string, string>;
    } catch {
      // registro ilegível não aprova
    }
  }
  return achado;
}

export interface EstadoCodex {
  commitSha: string | null;
  status: string | null;
  temAchados: boolean | null;
}

/** O bloco `<!-- codex-review-state:v1 {...} -->` que o Codex mantém no comentário de resumo do PR. */
export function lerEstadoCodex(body: string): EstadoCodex | null {
  const m = /<!--\s*codex-review-state:v1\s+(\{.*?\})\s*-->/s.exec(body);
  if (!m) return null;
  try {
    const cr = (JSON.parse(m[1]!) as { code_review?: { commit_sha?: unknown; status?: unknown; has_unresolved_findings?: unknown } }).code_review;
    if (!cr) return null;
    return {
      commitSha: typeof cr.commit_sha === 'string' ? cr.commit_sha : null,
      status: typeof cr.status === 'string' ? cr.status : null,
      temAchados: typeof cr.has_unresolved_findings === 'boolean' ? cr.has_unresolved_findings : null,
    };
  } catch {
    return null;
  }
}

export type VereditoCodex = 'aprovado' | 'achados' | 'outro-commit' | 'em-andamento' | 'sem-estado';

/** O Codex aprovou a ponta do PR? Vale o último bloco de estado publicado por ele. */
export function vereditoCodex(comentarios: Comentario[], ponta: string): VereditoCodex {
  let estado: EstadoCodex | null = null;
  for (const c of comentarios) {
    if (!mesmo(c.user?.login ?? undefined, BOT_CODEX)) continue;
    estado = lerEstadoCodex(c.body ?? '') ?? estado;
  }
  if (!estado) return 'sem-estado';
  if (estado.status !== 'completed') return 'em-andamento';
  if (!estado.commitSha || !mesmo(estado.commitSha, ponta)) return 'outro-commit';
  return estado.temAchados === false ? 'aprovado' : 'achados';
}

export interface ResumoCi {
  etiquetas: string[];
  issueEtiquetas: string[] | null;
  contratos: Record<string, string> | null;
  /** O dono pôs contrato-aprovado e o registro ainda não apareceu (o aprovacao.yml roda junto com a CI). */
  faltaRegistro: boolean;
}

export function resumoCi(input: {
  dono: string;
  atuaisPr: string[];
  timelinePr: EventoTimeline[];
  comentariosPr: Comentario[];
  atuaisIssue?: string[] | null;
  timelineIssue?: EventoTimeline[] | null;
}): ResumoCi {
  const etiquetas = etiquetasDoDono(input.atuaisPr, input.timelinePr, input.dono);
  const contratos = contratosAprovados(input.timelinePr, input.comentariosPr, input.dono);
  return {
    etiquetas,
    issueEtiquetas: input.atuaisIssue && input.timelineIssue ? etiquetasDoDono(input.atuaisIssue, input.timelineIssue, input.dono) : null,
    contratos,
    faltaRegistro: etiquetas.includes(ETIQUETA_APROVADO) && contratos === null,
  };
}

/**
 * Saída do `gh api --paginate` de uma lista: um array JSON por página, colados (`[...][...]`). Junta as páginas num array
 * só, separando os valores pelo nível dos colchetes fora de strings (um "][" dentro de um comentário não engana).
 */
export function lerPaginas<T>(txt: string): T[] {
  const out: T[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '[' || c === '{') {
      if (depth++ === 0) start = i;
    } else if ((c === ']' || c === '}') && --depth === 0) {
      const v = JSON.parse(txt.slice(start, i + 1)) as T | T[];
      if (Array.isArray(v)) out.push(...v);
      else out.push(v);
    }
  }
  if (depth !== 0 || inString) throw new Error('check-aprovacao: JSON incompleto');
  return out;
}

const lista = (s: string | undefined): string[] => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const json = <T>(arquivo: string | undefined, padrao: T[]): T[] => (arquivo ? lerPaginas<T>(readFileSync(arquivo, 'utf8')) : padrao);
const exigir = (nome: string): string => {
  const v = process.env[nome];
  if (!v) throw new Error(`check-aprovacao: falta ${nome}`);
  return v;
};

function main(): void {
  const env = process.env;
  switch (process.argv[2]) {
    case 'ci': {
      const temIssue = !!env.TIMELINE_ISSUE;
      const r = resumoCi({
        dono: exigir('DONO'),
        atuaisPr: lista(env.ATUAIS_PR),
        timelinePr: json<EventoTimeline>(exigir('TIMELINE_PR'), []),
        comentariosPr: json<Comentario>(exigir('COMENTARIOS_PR'), []),
        atuaisIssue: temIssue ? lista(env.ATUAIS_ISSUE) : null,
        timelineIssue: temIssue ? json<EventoTimeline>(env.TIMELINE_ISSUE, []) : null,
      });
      // Formato do GITHUB_OUTPUT: uma linha chave=valor por saída.
      console.log(`etiquetas=${r.etiquetas.join(',')}`);
      console.log(`issue_etiquetas=${(r.issueEtiquetas ?? []).join(',')}`);
      console.log(`contratos=${r.contratos ? JSON.stringify(r.contratos) : ''}`);
      console.log(`falta_registro=${r.faltaRegistro}`);
      break;
    }
    case 'dono':
      console.log(etiquetasDoDono([exigir('ETIQUETA')], json<EventoTimeline>(exigir('TIMELINE'), []), exigir('DONO')).length ? 'sim' : 'nao');
      break;
    case 'codex':
      console.log(vereditoCodex(json<Comentario>(exigir('COMENTARIOS'), []), exigir('PONTA')));
      break;
    default:
      throw new Error('check-aprovacao: use ci, dono ou codex');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
