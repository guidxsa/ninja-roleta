import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Issue #37: nas folhas Shinobi, cor de componente só por token (var(--...)). Cor literal só na definição dos
// tokens (blocos :root) e em máscara, onde o preto é só o canal alfa.
const DIR = join(__dirname, '..', 'prototype', 'styles', 'shinobi');
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/g;
const MASK = /^(-webkit-)?mask(-image)?$/;

function literalColors(src: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inRoot = false;
  let prop = '';
  src.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (depth === 0 && /^:root\b/.test(t)) inRoot = true;
    const m = t.match(/^([-\w]+)\s*:/);
    if (m?.[1] && depth > 0) prop = m[1];
    const tokenDef = inRoot && prop.startsWith('--');
    if (depth > 0 && !tokenDef && !MASK.test(prop)) {
      for (const c of line.matchAll(COLOR)) out.push(`${i + 1}: ${c[0]}`);
    }
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}' && --depth === 0) inRoot = false;
    }
    if (/[;{}]$/.test(t)) prop = '';
  });
  return out;
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
      for (const block of src.matchAll(/^:root\s*\{([\s\S]*?)^\}/gm)) {
        for (const m of (block[1] ?? '').matchAll(/(--sh-[\w-]+)\s*:/g)) defined.add(m[1]!);
      }
      for (const m of src.matchAll(/var\((--sh-[\w-]+)/g)) used.add(m[1]!);
    }
    expect([...used].filter((n) => !defined.has(n))).toEqual([]);
  });

  it('pega cor literal numa regra e ignora token e máscara', () => {
    const css = ':root {\n  --x: #123456;\n}\n.a {\n  color: #fff;\n  mask: linear-gradient(#000, transparent);\n}\n';
    expect(literalColors(css)).toEqual(['5: #fff']);
  });
});
