import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Issue #37: nas folhas Shinobi, cor de componente só por token (var(--...)). Cor literal só na definição dos
// tokens (blocos :root) e em máscara, onde o preto é só o canal alfa.
const DIR = join(__dirname, '..', 'prototype', 'styles', 'shinobi');
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/g;
const MASK = /^(-webkit-)?mask(-image)?$/;

interface Decl {
  prop: string;
  value: string;
  /** Linha (1-based) onde a declaração começa. */
  line: number;
  /** Dentro de um bloco :root (direto ou dentro de @media). */
  inRoot: boolean;
}

/** Declarações do CSS, lidas caractere a caractere: não depende de quebra de linha nem de uma regra por linha. */
function declarations(src: string): Decl[] {
  const css = src.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const out: Decl[] = [];
  const stack: string[] = [];
  let buf = '';
  let start = 0;
  let paren = 0;
  const lineAt = (i: number) => css.slice(0, i).split('\n').length;
  const flush = (end: number) => {
    const colon = buf.indexOf(':');
    if (stack.length && colon > 0) {
      const lead = buf.length - buf.trimStart().length;
      out.push({
        prop: buf.slice(0, colon).trim(),
        value: buf.slice(colon + 1).trim(),
        line: lineAt(start + lead),
        inRoot: stack.some((s) => /^:root\b/.test(s)),
      });
    }
    buf = '';
    start = end + 1;
  };
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]!;
    if (ch === '(') paren++;
    if (ch === ')') paren = Math.max(0, paren - 1);
    if (paren === 0 && ch === '{') {
      stack.push(buf.trim());
      buf = '';
      start = i + 1;
    } else if (paren === 0 && ch === ';') {
      flush(i);
    } else if (paren === 0 && ch === '}') {
      flush(i);
      stack.pop();
    } else {
      buf += ch;
    }
  }
  return out;
}

function literalColors(src: string): string[] {
  return declarations(src)
    .filter((d) => !(d.inRoot && d.prop.startsWith('--')) && !MASK.test(d.prop))
    .flatMap((d) => [...d.value.matchAll(COLOR)].map((c) => `${d.line}: ${c[0]}`));
}

describe('cores das telas Shinobi', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.css'));

  it('encontra as folhas', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s usa só tokens nas regras de componente', (f) => {
    expect(literalColors(readFileSync(join(DIR, f), 'utf8'))).toEqual([]);
  });

  it('todo token --sh-* usado está definido num bloco :root', () => {
    const defined = new Set<string>();
    const used = new Set<string>();
    for (const f of files) {
      const src = readFileSync(join(DIR, f), 'utf8');
      for (const d of declarations(src)) if (d.inRoot && d.prop.startsWith('--sh-')) defined.add(d.prop);
      for (const m of src.matchAll(/var\((--sh-[\w-]+)/g)) used.add(m[1]!);
    }
    expect([...used].filter((n) => !defined.has(n))).toEqual([]);
  });

  it('pega cor literal numa regra e ignora token e máscara', () => {
    const css = ':root {\n  --x: #123456;\n}\n.a {\n  color: #fff;\n  mask: linear-gradient(#000, transparent);\n}\n';
    expect(literalColors(css)).toEqual(['5: #fff']);
  });

  it('pega cor literal em regra de uma linha, em valor de várias linhas e dentro de @media', () => {
    const css = [
      '.a { color: #fff; }',
      '.b { background: linear-gradient(',
      '  rgba(0, 0, 0, .5),',
      '  transparent); }',
      '@media (min-width: 900px) { .c { border: 1px solid #123; } :root { --y: #abc; } }',
      '.d { --local: #456; }',
      '/* .e { color: #789; } */',
    ].join('\n');
    expect(literalColors(css)).toEqual(['1: #fff', '2: rgba(', '5: #123', '6: #456']);
  });
});
