// Etiqueta que só o usuário dá: a correcao-automatica da issue (scripts/check-aprovacao.ts; docs/processo/issues.md).
import { describe, expect, it } from 'vitest';
import { etiquetasDoDono, lerPaginas, type EventoTimeline } from '../scripts/check-aprovacao';

const DONO = 'guidxsa';
const labeled = (name: string, login: string, created_at = '2026-11-21T10:00:00Z'): EventoTimeline => ({ event: 'labeled', label: { name }, actor: { login }, created_at });

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
    const timeline = [labeled('correcao-automatica', DONO), labeled('precisa-decisao', 'claude[bot]'), labeled('outra', 'GuidXsa')];
    expect(etiquetasDoDono(['correcao-automatica', 'precisa-decisao', 'outra'], timeline, DONO)).toEqual(['correcao-automatica', 'outra']);
  });

  it('outra conta pondo de novo tira o valor; etiqueta sem evento não conta', () => {
    const timeline = [labeled('correcao-automatica', DONO, '2026-11-21T10:00:00Z'), labeled('correcao-automatica', 'github-actions[bot]', '2026-11-21T11:00:00Z')];
    expect(etiquetasDoDono(['correcao-automatica'], timeline, DONO)).toEqual([]);
    expect(etiquetasDoDono(['correcao-automatica'], [], DONO)).toEqual([]);
  });
});
