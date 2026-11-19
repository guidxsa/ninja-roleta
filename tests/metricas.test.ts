// Perfis de modelo e métricas do loop de issues (docs/processo/metricas.md; scripts/metricas.ts).
import { describe, expect, it } from 'vitest';
import {
  comentario,
  entradaNormalizada,
  escolhePerfil,
  lerMarcadores,
  mediana,
  MODELOS,
  perfilInicial,
  porGrupo,
  porIssue,
  somaExecucao,
  tabelaMarkdown,
  totalNormalizado,
  type Registro,
} from '../scripts/metricas';
import { categoriaDe } from '../scripts/metricas-relatorio';

const assistente = (id: string, model: string, u: Record<string, number>) => ({ type: 'assistant', message: { id, model, usage: u } });
const final = (extra: Record<string, unknown> = {}) => ({ type: 'result', subtype: 'success', is_error: false, duration_ms: 80841, num_turns: 15, total_cost_usd: 0.2598, ...extra });

const reg = (over: Partial<Registro>): Registro => ({
  v: 1,
  issue: 27,
  pr: null,
  etapa: 'issue',
  tentativa: 1,
  perfil: 'leve',
  modelo: MODELOS.leve,
  resultado: 'pr-aberto',
  falha: '',
  quando: '2026-11-18T22:06:35Z',
  porModelo: { [MODELOS.leve]: { input: 100, output: 50, cacheRead: 1000, cacheCreation: 200 } },
  duracaoMs: 60000,
  turnos: 10,
  custoUsd: 0.1,
  erro: false,
  ...over,
});

describe('soma do execution_file', () => {
  it('soma o uso por modelo, contando cada id de mensagem uma vez, com o cache separado', () => {
    const msgs = [
      { type: 'system', subtype: 'init' },
      assistente('a', 'claude-sonnet-5-5', { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 20 }),
      assistente('a', 'claude-sonnet-5-5', { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 20 }),
      assistente('b', 'claude-sonnet-5-5', { input_tokens: 3, output_tokens: 7, cache_read_input_tokens: 200, cache_creation_input_tokens: 0 }),
      assistente('c', 'claude-haiku-5-5', { input_tokens: 1, output_tokens: 1 }),
      final({ modelUsage: { 'claude-sonnet-5-5': { contextWindow: 1000000, maxOutputTokens: 128000 } } }),
    ];
    const e = somaExecucao(JSON.stringify(msgs));
    expect(e.porModelo['claude-sonnet-5-5']).toEqual({ input: 13, output: 12, cacheRead: 300, cacheCreation: 20 });
    expect(e.porModelo['claude-haiku-5-5']).toEqual({ input: 1, output: 1, cacheRead: 0, cacheCreation: 0 });
    expect(e).toMatchObject({ duracaoMs: 80841, turnos: 15, custoUsd: 0.2598, erro: false });
  });

  it('prefere o modelUsage final quando ele traz tokens', () => {
    const msgs = [
      assistente('a', 'claude-sonnet-5-5', { input_tokens: 1, output_tokens: 1 }),
      final({ modelUsage: { 'claude-sonnet-5-5': { inputTokens: 40, outputTokens: 30, cacheReadInputTokens: 900, cacheCreationInputTokens: 60 } } }),
    ];
    expect(somaExecucao(JSON.stringify(msgs)).porModelo).toEqual({ 'claude-sonnet-5-5': { input: 40, output: 30, cacheRead: 900, cacheCreation: 60 } });
  });

  it('aceita uma mensagem por linha; sem resultado final ou arquivo vazio, marca erro', () => {
    const linhas = [assistente('a', 'm', { input_tokens: 2, output_tokens: 3 }), 'lixo'].map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n');
    const e = somaExecucao(linhas);
    expect(e.porModelo.m).toEqual({ input: 2, output: 3, cacheRead: 0, cacheCreation: 0 });
    expect(e.erro).toBe(true);
    expect(somaExecucao('')).toMatchObject({ porModelo: {}, duracaoMs: null, erro: true });
  });

  it('a entrada normalizada soma o cache (a do Claude Code o exclui)', () => {
    const t = { input: 10, output: 5, cacheRead: 100, cacheCreation: 20 };
    expect(entradaNormalizada(t)).toBe(130);
    expect(totalNormalizado(t)).toBe(135);
  });
});

describe('marcador', () => {
  it('o comentário traz uma linha legível e o registro inteiro, lido de volta', () => {
    const r = reg({ modelo: 'x--y' });
    const c = comentario(r);
    expect(c).toContain('perfil leve');
    expect(c.match(/-->/g)).toHaveLength(1);
    expect(lerMarcadores(`antes ${c.replaceAll('\n', ' ')} depois`)).toEqual([r]);
  });

  it('ignora marcador quebrado e lê vários', () => {
    const a = reg({ issue: 1 });
    const b = reg({ issue: 2 });
    const texto = `${comentario(a)}\n<!-- metricas:{quebrado -->\n${comentario(b)}`;
    expect(lerMarcadores(texto).map((r) => r.issue)).toEqual([1, 2]);
  });
});

describe('perfil', () => {
  it('com o piloto, ímpar começa leve e par no padrão; sem o piloto, tudo padrão', () => {
    expect(perfilInicial(27, true)).toBe('leve');
    expect(perfilInicial(26, true)).toBe('padrao');
    expect(perfilInicial(27, false)).toBe('padrao');
  });

  it('sobe para o padrão na 2ª tentativa, menos depois de falha de ambiente', () => {
    const base = { issue: 27, piloto: true, etapa: 'issue' as const };
    expect(escolhePerfil({ ...base, registros: [] })).toBe('leve');
    expect(escolhePerfil({ ...base, registros: [reg({ resultado: 'sem-pr', falha: 'mudanca' })], tentativasMarcadas: 1 })).toBe('padrao');
    expect(escolhePerfil({ ...base, registros: [reg({ resultado: 'nao-rodou', falha: 'ambiente' })], tentativasMarcadas: 1 })).toBe('leve');
    // Marcador de tentativa sem registro (execução antiga ou registro que falhou) também conta.
    expect(escolhePerfil({ ...base, registros: [], tentativasMarcadas: 1 })).toBe('padrao');
  });

  it('na revisão, a 1ª rodada segue o perfil inicial e a 2ª em diante usa o padrão', () => {
    const registros = [reg({})];
    expect(escolhePerfil({ issue: 27, piloto: true, registros, etapa: 'revisao-1' })).toBe('leve');
    expect(escolhePerfil({ issue: 27, piloto: true, registros, etapa: 'revisao-2' })).toBe('padrao');
  });

  it('o perfil inicial registrado vale mais que a paridade e o piloto', () => {
    expect(escolhePerfil({ issue: 27, piloto: false, registros: [reg({})], etapa: 'revisao-1' })).toBe('leve');
    expect(escolhePerfil({ issue: 27, piloto: true, registros: [reg({ perfil: 'padrao' })], etapa: 'revisao-1' })).toBe('padrao');
    expect(escolhePerfil({ issue: 26, piloto: true, registros: [], etapa: 'issue' })).toBe('padrao');
  });
});

describe('relatório', () => {
  it('mediana', () => {
    expect(mediana([])).toBeNull();
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 2, 3])).toBe(2.5);
  });

  it('soma tentativas e rodadas por issue, marca a escalada e agrupa por categoria e perfil inicial', () => {
    const t = (n: number) => ({ m: { input: n, output: 0, cacheRead: 0, cacheCreation: 0 } });
    const registros = [
      reg({ issue: 1, resultado: 'sem-pr', falha: 'mudanca', porModelo: t(100) }),
      reg({ issue: 1, tentativa: 2, perfil: 'padrao', porModelo: t(300) }),
      reg({ issue: 1, etapa: 'revisao-1', perfil: 'padrao', porModelo: t(50) }),
      reg({ issue: 3, porModelo: t(200) }),
      reg({ issue: 2, perfil: 'padrao', porModelo: t(1000) }),
    ];
    const info = [
      { issue: 1, categoria: 'docs', mergeado: true, revisoesComAchados: 1 },
      { issue: 2, categoria: 'docs', mergeado: true, revisoesComAchados: 0 },
      { issue: 3, categoria: 'docs', mergeado: false, revisoesComAchados: 0 },
      { issue: 4, categoria: 'docs', mergeado: false, revisoesComAchados: 0 },
    ];
    const linhas = porIssue(registros, info);
    expect(linhas.map((l) => l.issue)).toEqual([1, 2, 3]);
    expect(linhas[0]).toMatchObject({ perfilInicial: 'leve', escalou: true, execucoes: 3, rodadas: 1, tokens: { input: 450 } });
    const grupos = porGrupo(linhas);
    expect(grupos).toEqual([
      { categoria: 'docs', perfilInicial: 'leve', issues: 2, concluidas: 1, medianaTokens: 325, medianaDuracaoMs: 120000, escalaram: 1 },
      { categoria: 'docs', perfilInicial: 'padrao', issues: 1, concluidas: 1, medianaTokens: 1000, medianaDuracaoMs: 60000, escalaram: 0 },
    ]);
    expect(tabelaMarkdown(linhas, grupos)).toContain('| docs | leve | 2 | 1 |');
  });

  it('categoria pela etiqueta cat:', () => {
    expect(categoriaDe(['inconsistencia', 'cat:docs'])).toBe('docs');
    expect(categoriaDe(['inconsistencia'])).toBe('sem-categoria');
  });
});

describe('falha de ambiente', () => {
  it('não define o perfil inicial nem conta como escalada', () => {
    const amb = reg({ perfil: 'padrao', modelo: '', resultado: 'nao-rodou', falha: 'ambiente', porModelo: {} });
    expect(escolhePerfil({ issue: 27, piloto: true, registros: [amb], etapa: 'issue', tentativasMarcadas: 1 })).toBe('leve');
    const [linha] = porIssue([amb, reg({})], [{ issue: 27, categoria: 'docs', mergeado: true, revisoesComAchados: 0 }]);
    expect(linha).toMatchObject({ perfilInicial: 'leve', escalou: false, execucoes: 2 });
  });
});
