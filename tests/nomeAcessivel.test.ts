import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('botão de editar nome da Ficha (WCAG 2.5.3, Rótulo no Nome)', () => {
  const gate = readFileSync('prototype/gate.ts', 'utf8');
  const linha = gate.split('\n').find((l) => l.includes('class="name-btn"'))!;

  it('não troca o nome acessível por um aria-label que omite o texto visível', () => {
    expect(linha).not.toMatch(/aria-label/);
  });

  it('a ação de editar entra como texto só para leitor de tela, depois do nome visível', () => {
    expect(linha.indexOf('data-display-name')).toBeLessThan(linha.indexOf('sr-only'));
    expect(linha).toContain('${D.nameEdit}');
  });
});
