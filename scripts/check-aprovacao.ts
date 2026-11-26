// Etiqueta que só o usuário dá (docs/processo/issues.md, "Loop"): a `correcao-automatica` da issue libera a branch
// feature/issue-<n>. Lê a timeline que a CI baixa com o gh e devolve só as etiquetas que o dono do repositório pôs por
// último (bot e agente no Actions não promovem issue). O contrato e a revisão não têm etiqueta: o staging é o playground
// dos agentes e a revisão do usuário é a release (docs/processo/fluxo.md).
// Sem import de outros scripts: roda com `node` (Node 24 tira os tipos), sem npm ci.
// Uso (entrada em arquivos com a saída de `gh api --paginate`, uma página ou várias):
//   node scripts/check-aprovacao.ts ci      DONO, ATUAIS_ISSUE, TIMELINE_ISSUE → issue_etiquetas=<lista>
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export interface EventoTimeline {
  event?: string;
  label?: { name?: string } | null;
  actor?: { login?: string } | null;
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
const exigir = (nome: string): string => {
  const v = process.env[nome];
  if (!v) throw new Error(`check-aprovacao: falta ${nome}`);
  return v;
};

function main(): void {
  if (process.argv[2] !== 'ci') throw new Error('check-aprovacao: use ci');
  const env = process.env;
  const etiquetas = env.TIMELINE_ISSUE
    ? etiquetasDoDono(lista(env.ATUAIS_ISSUE), lerPaginas<EventoTimeline>(readFileSync(env.TIMELINE_ISSUE, 'utf8')), exigir('DONO'))
    : [];
  // Formato do GITHUB_OUTPUT: uma linha chave=valor por saída.
  console.log(`issue_etiquetas=${etiquetas.join(',')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
