// Conferência de escopo pelo contrato da tarefa (AGENTS.md, "Escopo"; scripts/check-escopo.ts).
import { describe, expect, it } from 'vitest';
import { checkEscopo, EXIGIR_CONTRATO_A_PARTIR, parseContrato, temaDaBranch } from '../scripts/check-escopo';

const contrato = (escopo: string[], fora: string[] = []) =>
  `---\nobjetivo: Teste.\nescopo: ${JSON.stringify(escopo)}\nfora: ${JSON.stringify(fora)}\n---\n\n# Tarefa\n`;
const run = (files: string[], md: string | null, over: Partial<Parameters<typeof checkEscopo>[0]> = {}) =>
  checkEscopo({ branch: 'feature/veneno', files, contrato: md, hoje: '2026-11-20', ...over });
const rules = (f: ReturnType<typeof checkEscopo>) => f.map((x) => `${x.level}:${x.rule}`);

describe('contrato', () => {
  it('lê o frontmatter com listas JSON', () => {
    expect(parseContrato(contrato(['src/core/**'], ['prototype/**']))).toMatchObject({
      objetivo: 'Teste.',
      escopo: ['src/core/**'],
      fora: ['prototype/**'],
    });
    expect(parseContrato('# sem frontmatter')).toBeNull();
  });

  it('o tema vem da branch feature/<tema>', () => {
    expect(temaDaBranch('feature/veneno')).toBe('veneno');
    expect(temaDaBranch('master')).toBeNull();
  });
});

describe('escopo', () => {
  const md = contrato(['src/core/roleta/**', 'tests/roleta*.test.ts', 'docs/roleta/**'], ['src/data/balance*']);

  it('dentro do escopo passa, com os arquivos de sempre e o próprio contrato', () => {
    const files = ['src/core/roleta/battle.ts', 'tests/roleta.test.ts', 'docs/roleta/combate.md', 'CHANGELOG.md', 'package.json', 'docs/tarefas/veneno.md'];
    expect(run(files, md)).toEqual([]);
  });

  it('arquivo fora do escopo é erro e aparece na lista', () => {
    const f = run(['src/core/roleta/battle.ts', 'prototype/roleta/session.ts'], md);
    expect(rules(f)).toEqual(['erro:fora-do-escopo']);
    expect(f[0]!.files).toEqual(['prototype/roleta/session.ts']);
  });

  it('"fora" vence o escopo', () => {
    const f = run(['src/data/balance.ts'], contrato(['src/**'], ['src/data/balance*']));
    expect(f[0]!.files).toEqual(['src/data/balance.ts']);
  });

  it('sem contrato: aviso antes da data, erro a partir dela', () => {
    expect(rules(run(['a.ts'], null))).toEqual(['aviso:contrato']);
    expect(rules(run(['a.ts'], null, { hoje: EXIGIR_CONTRATO_A_PARTIR }))).toEqual(['erro:contrato']);
  });

  it('contrato sem escopo ou com lista inválida é erro', () => {
    expect(rules(run([], '---\nobjetivo: x\n---\n'))).toEqual(['erro:contrato']);
    expect(rules(run([], "---\nescopo: ['a']\n---\n"))).toEqual(['erro:contrato']);
  });

  it('fora de feature/* só avisa', () => {
    expect(rules(run(['qualquer.ts'], null, { branch: 'ccr-123' }))).toEqual(['aviso:escopo']);
  });
});
