// Issue #99: o recorde (`bestLine`) é um <p>; ele não pode ficar dentro de outro <p> (HTML inválido).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('marcação da Jornada', () => {
  it('bestLine não é colocado dentro de um parágrafo', () => {
    const src = readFileSync('prototype/jornada/index.ts', 'utf8');
    expect(src).not.toMatch(/<p[^>]*>\s*\$\{bestLine\(/);
  });
});
