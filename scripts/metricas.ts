// Perfis de modelo e métricas do loop de issues (docs/processo/metricas.md). Funções puras: quem lê arquivo, chama
// o gh ou escreve no GitHub são metricas-execucao.ts e metricas-relatorio.ts.

export type Perfil = 'leve' | 'padrao';

/** Modelos de cada perfil. O esforço fica no padrão do modelo na fase 1 (uma variável por vez). */
export const MODELOS: Record<Perfil, string> = {
  leve: 'claude-haiku-5-5',
  padrao: 'claude-sonnet-5-5',
};

export const MARCADOR = 'metricas';
export const MARCADOR_TENTATIVA = '<!-- loop-issues:tentativa -->';

export interface Tokens {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

export interface Execucao {
  /** Tokens por modelo, com o cache em campos separados. */
  porModelo: Record<string, Tokens>;
  duracaoMs: number | null;
  turnos: number | null;
  /** Custo estimado pelo Claude Code; o loop usa o token da assinatura, então não é cobrança. */
  custoUsd: number | null;
  erro: boolean;
}

export type Etapa = 'issue' | `revisao-${number}`;
export type Resultado = 'pr-aberto' | 'sem-pr' | 'precisa-decisao' | 'corrigido' | 'sem-commit' | 'nao-rodou';
/** `ambiente`: falha que não é da mudança (token, npm ci, runner) e não conta para a escalada. */
export type Falha = '' | 'mudanca' | 'execucao' | 'ambiente';

export interface Registro extends Execucao {
  v: 1;
  issue: number;
  pr: number | null;
  etapa: Etapa;
  tentativa: number;
  perfil: Perfil;
  modelo: string;
  resultado: Resultado;
  falha: Falha;
  quando: string;
}

const zero = (): Tokens => ({ input: 0, output: 0, cacheRead: 0, cacheCreation: 0 });
const num = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
const numOuNull = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {});

/** Entrada comparável entre agentes: a métrica de entrada do Claude Code exclui as leituras e gravações do cache. */
export const entradaNormalizada = (t: Tokens): number => t.input + t.cacheRead + t.cacheCreation;
export const totalNormalizado = (t: Tokens): number => entradaNormalizada(t) + t.output;

export function somaTokens(lista: Tokens[]): Tokens {
  const s = zero();
  for (const t of lista) {
    s.input += t.input;
    s.output += t.output;
    s.cacheRead += t.cacheRead;
    s.cacheCreation += t.cacheCreation;
  }
  return s;
}

/**
 * Soma o `execution_file` do claude-code-action (lista de mensagens do Claude Code, ou uma mensagem por linha).
 * Usa o `modelUsage` da mensagem final quando ele traz tokens; senão soma o `usage` das mensagens do assistente,
 * contando cada id uma vez (o mesmo id se repete a cada bloco de conteúdo, com o mesmo uso).
 */
export function somaExecucao(texto: string): Execucao {
  let mensagens: unknown[] = [];
  const limpo = texto.trim();
  if (limpo.startsWith('[')) {
    try {
      mensagens = JSON.parse(limpo) as unknown[];
    } catch {
      mensagens = [];
    }
  } else {
    for (const linha of limpo.split('\n')) {
      try {
        mensagens.push(JSON.parse(linha));
      } catch {
        // linha que não é JSON: ignora
      }
    }
  }

  const resultado = mensagens.map(obj).filter((m) => m.type === 'result').at(-1);
  const exec: Execucao = {
    porModelo: {},
    duracaoMs: numOuNull(resultado?.duration_ms),
    turnos: numOuNull(resultado?.num_turns),
    custoUsd: numOuNull(resultado?.total_cost_usd),
    erro: resultado ? resultado.is_error === true : true,
  };

  const usoFinal = obj(resultado?.modelUsage);
  for (const [modelo, u] of Object.entries(usoFinal)) {
    const x = obj(u);
    const t: Tokens = { input: num(x.inputTokens), output: num(x.outputTokens), cacheRead: num(x.cacheReadInputTokens), cacheCreation: num(x.cacheCreationInputTokens) };
    if (totalNormalizado(t) > 0) exec.porModelo[modelo] = t;
  }
  if (Object.keys(exec.porModelo).length > 0) return exec;

  const vistos = new Set<string>();
  for (const m of mensagens.map(obj)) {
    if (m.type !== 'assistant') continue;
    const msg = obj(m.message);
    const id = typeof msg.id === 'string' ? msg.id : null;
    if (id) {
      if (vistos.has(id)) continue;
      vistos.add(id);
    }
    const u = obj(msg.usage);
    const modelo = typeof msg.model === 'string' ? msg.model : '?';
    const t = (exec.porModelo[modelo] ??= zero());
    t.input += num(u.input_tokens);
    t.output += num(u.output_tokens);
    t.cacheRead += num(u.cache_read_input_tokens);
    t.cacheCreation += num(u.cache_creation_input_tokens);
  }
  return exec;
}

// ---------------------------------------------------------------- marcadores

const ABRE = `<!-- ${MARCADOR}:`;

export const marcador = (r: Registro): string => `${ABRE}${JSON.stringify(r).replaceAll('--', '\\u002d\\u002d')} -->`;

/** Registros nos marcadores de um texto (comentários de uma issue juntos). Marcador inválido é ignorado. */
export function lerMarcadores(texto: string): Registro[] {
  const out: Registro[] = [];
  let i = texto.indexOf(ABRE);
  while (i >= 0) {
    const fim = texto.indexOf(' -->', i);
    if (fim < 0) break;
    try {
      const r = JSON.parse(texto.slice(i + ABRE.length, fim)) as Registro;
      if (r && r.v === 1 && typeof r.issue === 'number') out.push(r);
    } catch {
      // marcador quebrado: ignora
    }
    i = texto.indexOf(ABRE, fim);
  }
  return out;
}

const fmt = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : String(n));

/** Corpo do comentário: uma linha legível e o marcador com o registro inteiro. */
export function comentario(r: Registro): string {
  const t = somaTokens(Object.values(r.porModelo));
  const modelos = Object.keys(r.porModelo).join(', ') || '—';
  const partes = [
    `**Métricas** (${r.etapa}, tentativa ${r.tentativa}): perfil ${r.perfil} (${r.modelo}), resultado ${r.resultado}${r.falha ? `, falha ${r.falha}` : ''}.`,
    `Tokens: entrada ${fmt(t.input)}, cache lido ${fmt(t.cacheRead)}, cache gravado ${fmt(t.cacheCreation)}, saída ${fmt(t.output)} (${modelos}).`,
    `Tempo ${r.duracaoMs === null ? '—' : `${Math.round(r.duracaoMs / 1000)} s`}, ${r.turnos ?? '—'} turnos, custo estimado ${r.custoUsd === null ? '—' : `US$ ${r.custoUsd.toFixed(2)}`} (docs/processo/metricas.md).`,
  ];
  return `${partes.join('\n')}\n\n${marcador(r)}\n`;
}

// ---------------------------------------------------------------- perfil

export interface PerfilInput {
  issue: number;
  piloto: boolean;
  /** Registros já feitos na issue (de todas as etapas). */
  registros: Registro[];
  /** Etapa que vai rodar. */
  etapa: Etapa;
  /** Tentativas sem PR já marcadas na issue (`<!-- loop-issues:tentativa -->`). */
  tentativasMarcadas?: number;
}

/** Perfil com que a issue começa: ímpar leve, par padrão (piloto ligado). */
export const perfilInicial = (issue: number, piloto: boolean): Perfil => (piloto && issue % 2 === 1 ? 'leve' : 'padrao');

/**
 * Perfil de uma execução. Começa no perfil inicial da issue e sobe para o padrão, sem voltar, quando:
 * - na etapa da issue, já houve uma tentativa sem PR que não foi falha de ambiente;
 * - na revisão, a rodada é a 2ª ou depois.
 * O perfil inicial registrado vale mais que a paridade (o piloto pode ter sido desligado no meio).
 */
export function escolhePerfil({ issue, piloto, registros, etapa, tentativasMarcadas = 0 }: PerfilInput): Perfil {
  const daIssue = registros.filter((r) => r.issue === issue);
  const primeira = daIssue.find((r) => r.etapa === 'issue' && r.falha !== 'ambiente');
  const inicial = primeira ? primeira.perfil : perfilInicial(issue, piloto);
  if (inicial === 'padrao') return 'padrao';
  if (etapa === 'issue') {
    const ambiente = daIssue.filter((r) => r.etapa === 'issue' && r.falha === 'ambiente').length;
    const falhas = Math.max(daIssue.filter((r) => r.etapa === 'issue' && r.resultado === 'sem-pr' && r.falha !== 'ambiente').length, tentativasMarcadas - ambiente);
    return falhas > 0 ? 'padrao' : 'leve';
  }
  const rodada = Number(etapa.slice('revisao-'.length));
  return rodada >= 2 ? 'padrao' : 'leve';
}

// ---------------------------------------------------------------- relatório

export const mediana = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

export interface InfoIssue {
  issue: number;
  categoria: string;
  /** PR da issue mergeado (o master exige os checks verdes para o merge). */
  mergeado: boolean;
  /** Revisões do Codex com achados no PR. */
  revisoesComAchados: number;
}

export interface LinhaIssue extends InfoIssue {
  perfilInicial: Perfil;
  escalou: boolean;
  execucoes: number;
  rodadas: number;
  tokens: Tokens;
  duracaoMs: number;
  custoUsd: number;
}

export function porIssue(registros: Registro[], info: InfoIssue[]): LinhaIssue[] {
  return info
    .map((i) => {
      const rs = registros.filter((r) => r.issue === i.issue);
      if (rs.length === 0) return null;
      const validos = rs.filter((r) => r.falha !== 'ambiente');
      const primeira = validos.find((r) => r.etapa === 'issue') ?? validos[0] ?? rs[0]!;
      return {
        ...i,
        perfilInicial: primeira.perfil,
        escalou: validos.some((r) => r.perfil !== primeira.perfil),
        execucoes: rs.length,
        rodadas: rs.filter((r) => r.etapa !== 'issue').length,
        tokens: somaTokens(rs.flatMap((r) => Object.values(r.porModelo))),
        duracaoMs: rs.reduce((s, r) => s + (r.duracaoMs ?? 0), 0),
        custoUsd: rs.reduce((s, r) => s + (r.custoUsd ?? 0), 0),
      };
    })
    .filter((x): x is LinhaIssue => x !== null);
}

export interface LinhaGrupo {
  categoria: string;
  perfilInicial: Perfil;
  issues: number;
  concluidas: number;
  /** Mediana dos tokens normalizados (entrada com cache + saída), com as tentativas que falharam somadas. */
  medianaTokens: number | null;
  medianaDuracaoMs: number | null;
  escalaram: number;
}

export function porGrupo(linhas: LinhaIssue[]): LinhaGrupo[] {
  const grupos = new Map<string, LinhaIssue[]>();
  for (const l of linhas) {
    const k = `${l.categoria}\0${l.perfilInicial}`;
    grupos.set(k, [...(grupos.get(k) ?? []), l]);
  }
  return [...grupos.entries()]
    .map(([k, ls]) => {
      const [categoria, perfil] = k.split('\0') as [string, Perfil];
      return {
        categoria,
        perfilInicial: perfil,
        issues: ls.length,
        concluidas: ls.filter((l) => l.mergeado).length,
        medianaTokens: mediana(ls.map((l) => totalNormalizado(l.tokens))),
        medianaDuracaoMs: mediana(ls.map((l) => l.duracaoMs)),
        escalaram: ls.filter((l) => l.escalou).length,
      };
    })
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.perfilInicial.localeCompare(b.perfilInicial));
}

export function tabelaMarkdown(linhas: LinhaIssue[], grupos: LinhaGrupo[]): string {
  const out = ['## Por categoria e perfil inicial', '', '| Categoria | Perfil | Issues | Concluídas | Mediana de tokens | Mediana de tempo | Escalaram |', '|---|---|---|---|---|---|---|'];
  for (const g of grupos) {
    out.push(`| ${g.categoria} | ${g.perfilInicial} | ${g.issues} | ${g.concluidas} | ${g.medianaTokens === null ? '—' : fmt(g.medianaTokens)} | ${g.medianaDuracaoMs === null ? '—' : `${Math.round(g.medianaDuracaoMs / 1000)} s`} | ${g.escalaram} |`);
  }
  out.push('', '## Por issue', '', '| Issue | Categoria | Perfil | Escalou | Execuções | Rodadas | Achados do Codex | Tokens | Custo estimado | Mergeado |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const l of linhas) {
    out.push(`| #${l.issue} | ${l.categoria} | ${l.perfilInicial} | ${l.escalou ? 'sim' : 'não'} | ${l.execucoes} | ${l.rodadas} | ${l.revisoesComAchados} | ${fmt(totalNormalizado(l.tokens))} | US$ ${l.custoUsd.toFixed(2)} | ${l.mergeado ? 'sim' : 'não'} |`);
  }
  return `${out.join('\n')}\n`;
}
