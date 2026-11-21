// Aprovações do usuário e do Codex (scripts/check-aprovacao.ts; docs/processo/fluxo.md, "Entrada no staging").
import { describe, expect, it } from 'vitest';
import {
  BOT_ACTIONS,
  BOT_CODEX,
  contratosAprovados,
  etiquetasDoDono,
  lerEstadoCodex,
  lerPaginas,
  marcadorAprovacao,
  resumoCi,
  vereditoCodex,
  type Comentario,
  type EventoTimeline,
} from '../scripts/check-aprovacao';

const DONO = 'guidxsa';
const labeled = (name: string, login: string, created_at = '2026-11-21T10:00:00Z'): EventoTimeline => ({ event: 'labeled', label: { name }, actor: { login }, created_at });
const comentario = (login: string, body: string, created_at = '2026-11-21T10:00:30Z'): Comentario => ({ user: { login }, body, created_at });

// Formato real do comentário de resumo do Codex (PR #45, 20/11/2026), cortado.
const resumoCodex = (sha: string, achados: boolean, status = 'completed') =>
  `<!-- codex-pull-request-review-summary -->\n<!-- codex-review-state:v1 {"code_review":{"commit_sha":"${sha}","has_any_findings":${achados},"has_unresolved_findings":${achados},"status":"${status}"},"security_review":{"commit_sha":null,"has_any_findings":null,"has_unresolved_findings":null,"status":null}} -->\n\n<details>\n<summary><strong>Codex Review Summary</strong>: ✅ Completed</summary>\n</details>`;
const SHA = '555690042e7b0d7854b50bf32b82e65b4c174422';
const OUTRO = 'ad73941e949d9240e75f29aeadd0fc35fdf75a66';

describe('saída paginada do gh', () => {
  it('junta as páginas, sem se enganar com colchetes e aspas dentro das strings', () => {
    const txt = '[{"body":"a ][ b \\"[\\" {"}]\n[{"body":"c"}]';
    expect(lerPaginas<{ body: string }>(txt).map((c) => c.body)).toEqual(['a ][ b "[" {', 'c']);
    expect(lerPaginas('[]')).toEqual([]);
    expect(() => lerPaginas('[{"a":1}')).toThrow();
  });
});

describe('etiquetas do dono', () => {
  it('só conta a etiqueta que o dono pôs por último', () => {
    const timeline = [labeled('contrato-aprovado', DONO), labeled('revisao-dispensada', 'claude[bot]'), labeled('outra', 'GuidXsa')];
    expect(etiquetasDoDono(['contrato-aprovado', 'revisao-dispensada', 'outra'], timeline, DONO)).toEqual(['contrato-aprovado', 'outra']);
  });

  it('outra conta pondo de novo tira o valor; etiqueta sem evento não conta', () => {
    const timeline = [labeled('contrato-aprovado', DONO, '2026-11-21T10:00:00Z'), labeled('contrato-aprovado', 'github-actions[bot]', '2026-11-21T11:00:00Z')];
    expect(etiquetasDoDono(['contrato-aprovado'], timeline, DONO)).toEqual([]);
    expect(etiquetasDoDono(['contrato-aprovado'], [], DONO)).toEqual([]);
  });
});

describe('contrato aprovado como estava', () => {
  const registro = (contratos: Record<string, string>, created_at?: string) => comentario(BOT_ACTIONS, `Registrado.\n\n${marcadorAprovacao(SHA, contratos)}`, created_at);

  it('lê o registro do github-actions publicado depois da aprovação do dono', () => {
    const timeline = [labeled('contrato-aprovado', DONO)];
    expect(contratosAprovados(timeline, [registro({ 'docs/tarefas/x.md': 'b1' })], DONO)).toEqual({ 'docs/tarefas/x.md': 'b1' });
  });

  it('registro antigo, de outra conta ou sem aprovação do dono não vale', () => {
    const timeline = [labeled('contrato-aprovado', DONO, '2026-11-21T12:00:00Z')];
    expect(contratosAprovados(timeline, [registro({ a: 'b' }, '2026-11-21T11:00:00Z')], DONO)).toBeNull();
    expect(contratosAprovados(timeline, [comentario(DONO, marcadorAprovacao(SHA, { a: 'b' }), '2026-11-21T12:01:00Z')], DONO)).toBeNull();
    expect(contratosAprovados([labeled('contrato-aprovado', 'claude[bot]')], [registro({ a: 'b' })], DONO)).toBeNull();
  });

  it('vale o registro mais recente; marcador quebrado não aprova', () => {
    const timeline = [labeled('contrato-aprovado', DONO)];
    const quebrado = comentario(BOT_ACTIONS, '<!-- contrato-aprovado:v1 {quebrado} -->', '2026-11-21T10:00:40Z');
    expect(contratosAprovados(timeline, [registro({ a: '1' }), registro({ a: '2' }, '2026-11-21T10:00:35Z'), quebrado], DONO)).toEqual({ a: '2' });
    expect(contratosAprovados(timeline, [quebrado], DONO)).toBeNull();
  });

  it('resumo da CI: falta o registro enquanto o aprovacao.yml não publicou', () => {
    const base = { dono: DONO, atuaisPr: ['contrato-aprovado'], timelinePr: [labeled('contrato-aprovado', DONO)] };
    expect(resumoCi({ ...base, comentariosPr: [] })).toMatchObject({ etiquetas: ['contrato-aprovado'], contratos: null, faltaRegistro: true, issueEtiquetas: null });
    expect(resumoCi({ ...base, comentariosPr: [registro({ a: 'b' })] }).faltaRegistro).toBe(false);
    const issue = resumoCi({ ...base, comentariosPr: [], atuaisIssue: ['correcao-automatica'], timelineIssue: [labeled('correcao-automatica', 'claude[bot]')] });
    expect(issue.issueEtiquetas).toEqual([]);
  });
});

describe('aprovação do Codex', () => {
  it('lê o bloco de estado do comentário de resumo', () => {
    expect(lerEstadoCodex(resumoCodex(SHA, false))).toEqual({ commitSha: SHA, status: 'completed', temAchados: false });
    expect(lerEstadoCodex('Codex Review: Didn’t find any major issues.')).toBeNull();
    expect(lerEstadoCodex('<!-- codex-review-state:v1 {nada} -->')).toBeNull();
  });

  it('aprova só a ponta revisada, concluída e sem achados', () => {
    expect(vereditoCodex([comentario(BOT_CODEX, resumoCodex(SHA, false))], SHA)).toBe('aprovado');
    expect(vereditoCodex([comentario(BOT_CODEX, resumoCodex(SHA, false))], OUTRO)).toBe('outro-commit');
    expect(vereditoCodex([comentario(BOT_CODEX, resumoCodex(SHA, true))], SHA)).toBe('achados');
    expect(vereditoCodex([comentario(BOT_CODEX, resumoCodex(SHA, false, 'in_progress'))], SHA)).toBe('em-andamento');
  });

  it('ignora o bloco escrito por outra conta e acusa a falta de estado', () => {
    expect(vereditoCodex([comentario(DONO, resumoCodex(SHA, false))], SHA)).toBe('sem-estado');
    expect(vereditoCodex([comentario(BOT_CODEX, 'Codex Review: Didn’t find any major issues.')], SHA)).toBe('sem-estado');
  });

  it('vale o último estado publicado pelo Codex', () => {
    const c = [comentario(BOT_CODEX, resumoCodex(OUTRO, false)), comentario(BOT_CODEX, 'recibo sem bloco'), comentario(BOT_CODEX, resumoCodex(SHA, false))];
    expect(vereditoCodex(c, SHA)).toBe('aprovado');
    expect(vereditoCodex(c.slice(0, 2), SHA)).toBe('outro-commit');
  });
});
