// Verificações do processo (AGENTS.md, "Como trabalhar"; scripts/check-regras.ts).
import { describe, expect, it } from 'vitest';
import { BALANCE_FILE, checkRegras, codeOnly, coreViolations, HARNESS_BRANCH } from '../scripts/check-regras';
import { globToRegExp, matchesAny, packageJsonChange } from '../scripts/harness';

const run = (files: string[], over: Partial<Parameters<typeof checkRegras>[0]> = {}) =>
  checkRegras({ files, branch: 'feature/tema', strict: false, core: [], ...over });
const rules = (findings: ReturnType<typeof checkRegras>) => findings.map((f) => `${f.level}:${f.rule}`);

describe('globToRegExp', () => {
  it('* não atravessa pasta; ** atravessa', () => {
    expect(globToRegExp('src/*.ts').test('src/a.ts')).toBe(true);
    expect(globToRegExp('src/*.ts').test('src/core/a.ts')).toBe(false);
    expect(globToRegExp('src/**').test('src/core/roleta/a.ts')).toBe(true);
    expect(globToRegExp('src/**/*.ts').test('src/a.ts')).toBe(true);
    expect(globToRegExp('tests/roleta*.test.ts').test('tests/roleta.test.ts')).toBe(true);
  });

  it('ponto é literal', () => {
    expect(matchesAny('AGENTSxmd', ['AGENTS.md'])).toBe(false);
    expect(matchesAny('AGENTS.md', ['AGENTS.md'])).toBe(true);
  });
});

describe('pureza do core', () => {
  const v = (src: string) => coreViolations('a.ts', src).length;

  it('acusa Math.random, DOM e localStorage', () => {
    expect(v('const x = Math.random();')).toBe(1);
    expect(v('document.body; window.foo; localStorage.getItem("k")')).toBe(3);
  });

  it('acusa as formas indiretas (revisão do Codex)', () => {
    expect(v('const { random } = Math;\nrandom();')).toBe(1);
    expect(v('const { floor, random: r } = Math;')).toBe(1);
    expect(v("const r = Math['random']();")).toBe(1);
    expect(v('const r = Math?.random();')).toBe(1);
    expect(v('document?.querySelector("a");')).toBe(1);
    expect(v('const s = `a ${window.innerWidth} b`;')).toBe(1);
    expect(v('globalThis.crypto;')).toBe(1);
  });

  it('ignora strings, comentários e nomes de propriedade (revisão do Codex)', () => {
    expect(v('const a = "Math.random";')).toBe(0);
    expect(v('// sem Math.random aqui\n/* nem document.body */\nconst a = rng();')).toBe(0);
    expect(v('const t = `texto com document.x e ${1}`;')).toBe(0);
    expect(v('const o = { document: 1 }; o.document; o.window;')).toBe(0);
    expect(v('export const f = (rng: () => number) => Math.floor(rng() * 3);')).toBe(0);
  });

  it('o leitor léxico mantém as linhas', () => {
    const { code } = codeOnly('const a = "x\\ny";\n// c\nconst b = 1;');
    expect(code.split('\n')).toHaveLength(3);
    expect(coreViolations('a.ts', '// 1\n// 2\nMath.random()')[0]).toMatch(/^a\.ts:3:/);
  });

  it('vira erro no relatório', () => {
    expect(rules(run([], { core: [{ file: 'src/core/x.ts', src: 'Math.random()' }] }))).toEqual(['erro:core-puro']);
  });
});

describe('regras sobre o diff', () => {
  it('core sem teste é erro; com teste passa', () => {
    expect(rules(run(['src/core/roleta/battle.ts', 'docs/roleta/combate.md']))).toEqual(['erro:core-com-teste']);
    expect(run(['src/core/roleta/battle.ts', 'tests/roleta.test.ts', 'docs/roleta/combate.md'])).toEqual([]);
  });

  it('balance de qualquer modo sem registro é aviso, e erro no modo estrito (revisão do Codex)', () => {
    for (const b of ['src/data/balance.ts', 'src/data/roleta/balance.ts', 'src/data/jornada/balance.ts']) {
      expect(BALANCE_FILE.test(b), b).toBe(true);
      const files = [b, 'docs/roleta/combate.md'];
      expect(rules(run(files)), b).toEqual(['aviso:balance-com-registro']);
      expect(rules(run(files, { strict: true })), b).toEqual(['erro:balance-com-registro']);
      expect(run([...files, 'docs/registro.md'], { strict: true }), b).toEqual([]);
    }
  });

  it('jogo sem doc nem changelog é aviso', () => {
    expect(rules(run(['prototype/roleta/session.ts']))).toEqual(['aviso:doc-junto']);
    expect(run(['prototype/roleta/session.ts', 'CHANGELOG.md'])).toEqual([]);
  });

  it('arquivos do processo e scripts do package.json só mudam em feature/harness(-<tema>)', () => {
    for (const f of ['AGENTS.md', 'CLAUDE.md', '.githooks/pre-push', '.claude/settings.json', 'scripts/check-escopo.ts', '.github/workflows/ci.yml'])
      expect(rules(run([f])), f).toEqual(['erro:processo-protegido']);
    expect(rules(run(['package.json'], { scriptsChanged: true }))).toEqual(['erro:processo-protegido']);
    expect(run(['package.json'], { scriptsChanged: false })).toEqual([]);
    expect(run(['AGENTS.md'], { branch: 'feature/harness-2' })).toEqual([]);
    expect(run(['AGENTS.md'], { branch: 'feature/harness' })).toEqual([]);
  });

  it('o nome da branch de processo é estrito (revisão do Codex)', () => {
    expect(HARNESS_BRANCH.test('feature/harnessidental')).toBe(false);
    expect(HARNESS_BRANCH.test('feature/harness-codex-nuvem')).toBe(true);
  });

  it('docs puros passam', () => {
    expect(run(['docs/visual.md'])).toEqual([]);
  });
});

describe('package.json', () => {
  const pkg = (version: string, scripts: Record<string, string>, extra: Record<string, unknown> = {}) => JSON.stringify({ name: 'x', version, scripts, ...extra });

  it('distingue mudança só de versão, de scripts e de outra coisa', () => {
    expect(packageJsonChange(pkg('1.0.0', { a: 'x' }), pkg('1.0.1', { a: 'x' }))).toEqual({ onlyVersion: true, scriptsChanged: false });
    expect(packageJsonChange(pkg('1.0.0', { a: 'x' }), pkg('1.0.0', { a: 'y' }))).toEqual({ onlyVersion: false, scriptsChanged: true });
    expect(packageJsonChange(pkg('1.0.0', {}), pkg('1.0.0', {}, { dependencies: { z: '1' } }))).toEqual({ onlyVersion: false, scriptsChanged: false });
  });
});
