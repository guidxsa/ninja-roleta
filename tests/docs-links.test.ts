import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function mdFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? mdFiles(p) : p.endsWith('.md') ? [p] : [];
  });
}

function slug(t: string): string {
  return t
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

function anchors(file: string): Set<string> {
  const out = new Set<string>();
  let fence = false;
  // \r?\n: no checkout do Windows (autocrlf) o \r sobraria no título e viraria um "-" no fim da âncora.
  for (const l of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (l.startsWith('```')) fence = !fence;
    const m = fence ? null : /^#{1,6}\s+(.*)$/.exec(l);
    if (m?.[1]) out.add(slug(m[1]));
  }
  return out;
}

describe('links internos dos docs', () => {
  it('apontam para arquivos e âncoras que existem', () => {
    const quebrados: string[] = [];
    for (const f of mdFiles('docs')) {
      let fence = false;
      readFileSync(f, 'utf8').split(/\r?\n/).forEach((l, i) => {
        if (l.startsWith('```')) fence = !fence;
        if (fence) return;
        for (const m of l.replace(/`[^`]*`/g, '').matchAll(/\]\(([^)\s]+)\)/g)) {
          const alvo = m[1] ?? '';
          if (/^[a-z]+:/i.test(alvo)) continue;
          const [caminho, ancora] = alvo.split('#');
          const destino = caminho ? resolve(dirname(f), caminho) : resolve(f);
          if (!existsSync(destino) || statSync(destino).isDirectory()) {
            if (!existsSync(destino)) quebrados.push(`${f}:${i + 1} ${alvo}`);
            continue;
          }
          if (ancora && destino.endsWith('.md') && !anchors(destino).has(decodeURIComponent(ancora))) {
            quebrados.push(`${f}:${i + 1} ${alvo}`);
          }
        }
      });
    }
    expect(quebrados).toEqual([]);
  });
});
