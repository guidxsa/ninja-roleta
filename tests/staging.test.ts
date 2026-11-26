// Staging e release (docs/processo/fluxo.md; scripts/staging.ts).
import { describe, expect, it } from 'vitest';
import { aplicarRelease, arquivosDeProcesso, montarPr, parseFragmento, parseIntegrados, proximaVersao } from '../scripts/staging';

const changelog = ['# Changelog', '', '| Versão | O que mudou |', '|---|---|', '| v0.95.1 | Retratos. |', '| v0.95.2 | Jinchuuriki. |', ''].join('\n');

describe('fragmentos', () => {
  it('lê o peso e junta o texto numa linha, escapando a barra da tabela', () => {
    expect(parseFragmento('veneno', '---\npeso: alto\n---\n**Veneno acumula.**\nCada golpe soma | um.\n')).toEqual({
      tema: 'veneno',
      peso: 'alto',
      texto: '**Veneno acumula.** Cada golpe soma \\| um.',
    });
    expect(parseFragmento('link', 'Corrige um link.\r\n').peso).toBe('normal');
  });
});

describe('release', () => {
  it('a release sobe o y e zera o z', () => {
    expect(proximaVersao('0.95.2')).toBe('0.96.0');
    expect(proximaVersao('1.0.3')).toBe('1.1.0');
  });

  it('junta os fragmentos numa linha nova no fim da tabela', () => {
    const fr = [parseFragmento('a', 'Primeiro.'), parseFragmento('b', 'Segundo.')];
    const novo = aplicarRelease(changelog, '0.96.0', fr);
    expect(novo.split('\n')).toContain('| v0.96.0 | Primeiro. Segundo. |');
    expect(novo.indexOf('v0.96.0')).toBeGreaterThan(novo.indexOf('v0.95.2'));
    expect(() => aplicarRelease(novo, '0.96.0', fr)).toThrow(/já está/);
    expect(() => aplicarRelease(changelog, '0.96.0', [])).toThrow(/sem fragmentos/);
  });
});

describe('PR permanente', () => {
  it('lista os PRs integrados pelo log de merges', () => {
    const log = 'Merge pull request #40 from guidxsa/feature/issue-27\x1fCorrige links\n\nmais\x1e\nMerge branch x\x1f\x1e';
    expect(parseIntegrados(log)).toEqual([
      { pr: 40, titulo: 'Corrige links' },
      { pr: null, titulo: 'Merge branch x' },
    ]);
  });

  it('propõe a próxima versão e sugere a release com item de peso alto ou com muitos itens', () => {
    const normal = [parseFragmento('a', 'Um.')];
    const pr = montarPr('0.95.2', normal, [{ pr: 40, titulo: 'Corrige links' }], 'abc1234', 'https://x/staging/', 8);
    expect(pr.titulo).toBe('Próxima versão (proposta v0.96.0)');
    expect(pr.corpo).toContain('- #40 Corrige links');
    expect(pr.corpo).toContain('`abc1234`');
    expect(pr.sugerir).toBe(false);
    expect(montarPr('0.95.2', [parseFragmento('b', '---\npeso: alto\n---\nTela nova.')], [], 'x', 'p', 8).sugerir).toBe(true);
    expect(montarPr('0.95.2', Array.from({ length: 8 }, (_, i) => parseFragmento(`f${i}`, 'x')), [], 'x', 'p', 8).sugerir).toBe(true);
    expect(pr.sugestao).toContain('<!-- staging:sugestao -->');
  });

  it('lista à parte os arquivos de processo do lote, onde o usuário revisa sem revisão cruzada no staging', () => {
    const alterados = ['src/core/a.ts', '.github/workflows/ci.yml', 'docs/processo/fluxo.md', 'AGENTS.md', 'prototype/x.ts', 'package.json', '.claude/skills/lancar-versao/SKILL.md'];
    const processo = arquivosDeProcesso(alterados);
    expect(processo).toEqual(['.claude/skills/lancar-versao/SKILL.md', '.github/workflows/ci.yml', 'AGENTS.md', 'docs/processo/fluxo.md', 'package.json']);
    const pr = montarPr('0.95.2', [], [], 'x', 'p', 8, processo);
    expect(pr.corpo).toContain('## Mudanças no processo (5 arquivo(s))');
    expect(pr.corpo).toContain('- `.github/workflows/ci.yml`');
    expect(montarPr('0.95.2', [], [], 'x', 'p', 8).corpo).toContain('## Mudanças no processo (0 arquivo(s))\n\n- Nenhuma.');
  });
});
