import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Issue #37: nas folhas Shinobi, cor de componente só por token (var(--...)). Cor literal só na definição dos
// tokens (blocos :root) e em máscara, onde o preto é só o canal alfa.
const DIR = join(__dirname, '..', 'prototype', 'styles', 'shinobi');
// Cores nomeadas do CSS (transparent e currentColor ficam de fora: não são cor de paleta).
const NAMED = (
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
  'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray ' +
  'darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
  'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue ' +
  'firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew ' +
  'hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
  'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray ' +
  'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue ' +
  'mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred ' +
  'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
  'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple ' +
  'rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue ' +
  'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white ' +
  'whitesmoke yellow yellowgreen'
).split(' ');
const COLOR = new RegExp(
  '#[0-9a-fA-F]{3,8}\\b|(?<![\\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|' +
    `(?<![\\w-])(?:${NAMED.join('|')})(?![\\w-])`,
  'gi',
);
/** Tira o que não é cor mas pode ter as mesmas letras: nomes de variável, URLs e textos entre aspas. */
const stripNonColor = (v: string) =>
  v.replace(/url\([^)]*\)/gi, 'url()').replace(/(['"]).*?\1/g, '""').replace(/--[\w-]+/g, '--v');
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
    .flatMap((d) => [...stripNonColor(d.value).matchAll(COLOR)].map((c) => `${d.line}: ${c[0]}`));
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

  it('pega cor nomeada e funções de cor, sem confundir com variável, URL, texto ou palavra-chave', () => {
    const css = [
      '.a { color: red; }',
      '.b { background: hsl(0 100% 50%); border-color: oklch(70% .1 40); }',
      '.c { outline: 1px solid White; }',
      ".d { color: var(--gold-2); background: url('img/gold.png'); content: 'red'; }",
      '.e { color: transparent; fill: currentColor; font-family: Georgia, serif; }',
    ].join('\n');
    expect(literalColors(css)).toEqual(['1: red', '2: hsl(', '2: oklch(', '3: White']);
  });
});
