// Guarda da meta de vitória (scripts/check-meta.ts; meta em docs/decisoes.md).
import { describe, expect, it } from 'vitest';
import { checkMeta, GRUPOS, parseMetaJson, type MetaRow } from '../scripts/check-meta';

const rows = (v: Record<string, number>, grupo = 'comum'): MetaRow[] => Object.entries(v).map(([dif, vitoria]) => ({ grupo, dif, vitoria }));
const naMeta = { easy: 0.9, normal: 0.65, hard: 0.4, hardcore: 0.15 };

describe('check:meta', () => {
  it('lê a linha META_JSON da saída da simulação', () => {
    expect(parseMetaJson(`tabela\nMETA_JSON [{"grupo":"a","dif":"easy","vitoria":0.9}]\n`)).toEqual([{ grupo: 'a', dif: 'easy', vitoria: 0.9 }]);
    expect(() => parseMetaJson('sem linha')).toThrow();
  });

  it('na meta passa', () => {
    expect(checkMeta('Roleta', rows(naMeta))).toEqual([]);
  });

  it('célula muito longe da meta é erro', () => {
    const f = checkMeta('Roleta', [...rows(naMeta, 'a'), ...rows(naMeta, 'b'), ...rows(naMeta, 'c'), ...rows({ ...naMeta, hard: 0.65 }, 'd')]);
    expect(f.map((x) => x.rule)).toEqual(['meta-celula']);
  });

  it('média do modo fora da folga é erro, mesmo com cada célula dentro', () => {
    const f = checkMeta('Jornada', rows({ ...naMeta, normal: 0.8 }));
    expect(f.map((x) => x.rule)).toEqual(['meta-media']);
  });
});

describe('check:meta: cobertura (revisão do Codex)', () => {
  it('simulação vazia é erro', () => {
    expect(checkMeta('Roleta', []).map((f) => f.rule)).toEqual(['meta-cobertura']);
  });

  it('dificuldade faltando, célula repetida e taxa inválida são erro', () => {
    const semHardcore = rows({ easy: 0.9, normal: 0.65, hard: 0.4 });
    expect(checkMeta('Roleta', semHardcore)[0]!.files).toEqual(['comum · hardcore']);
    expect(checkMeta('Roleta', [...rows(naMeta), { grupo: 'comum', dif: 'easy', vitoria: 0.9 }])[0]!.message).toMatch(/repetidas/);
    for (const vitoria of [NaN, -0.1, 1.5, Infinity]) expect(checkMeta('Roleta', rows({ ...naMeta, easy: vitoria }))[0]!.rule).toBe('meta-cobertura');
  });
});

describe('check:meta: grupos esperados (2ª revisão do Codex)', () => {
  it('uma origem só não basta: faltam as outras', () => {
    const f = checkMeta('Roleta', rows(naMeta, GRUPOS.Roleta[0]!), GRUPOS.Roleta);
    expect(f[0]!.rule).toBe('meta-cobertura');
    expect(f[0]!.files!.length).toBe((GRUPOS.Roleta.length - 1) * 4);
  });

  it('todas as origens passam; grupo a mais é erro', () => {
    const all = GRUPOS.Jornada.flatMap((g) => rows(naMeta, g));
    expect(checkMeta('Jornada', all, GRUPOS.Jornada)).toEqual([]);
    expect(checkMeta('Jornada', [...all, ...rows(naMeta, 'intruso')], GRUPOS.Jornada)[0]!.files).toEqual(['intruso']);
  });

  it('a Roleta espera as 8 origens', () => {
    expect(GRUPOS.Roleta).toHaveLength(8);
  });
});
