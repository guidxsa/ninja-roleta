// Verificações do processo (AGENTS.md, "Como trabalhar"; scripts/check-regras.ts).
import { describe, expect, it } from 'vitest';
import { checkRegras, coreViolations, stripComments } from '../scripts/check-regras';
import { globToRegExp, matchesAny } from '../scripts/harness';

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
  it('acusa Math.random, DOM e localStorage', () => {
    expect(coreViolations('a.ts', 'const x = Math.random();')).toHaveLength(1);
    expect(coreViolations('a.ts', 'document.body; window.foo; localStorage.getItem("k")')).toHaveLength(3);
  });

  it('ignora comentários', () => {
    expect(coreViolations('a.ts', '// sem Math.random aqui\n/* nem document.body */\nconst a = rng();')).toEqual([]);
    expect(stripComments('const u = "https://x"; // nota')).toBe('const u = "https://x"; ');
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

  it('balance sem registro é aviso, e erro no modo estrito', () => {
    const files = ['src/data/balance.ts', 'docs/roleta/combate.md'];
    expect(rules(run(files))).toEqual(['aviso:balance-com-registro']);
    expect(rules(run(files, { strict: true }))).toEqual(['erro:balance-com-registro']);
    expect(run([...files, 'docs/registro.md'], { strict: true })).toEqual([]);
  });

  it('jogo sem doc nem changelog é aviso', () => {
    expect(rules(run(['prototype/roleta/session.ts']))).toEqual(['aviso:doc-junto']);
    expect(run(['prototype/roleta/session.ts', 'CHANGELOG.md'])).toEqual([]);
  });

  it('arquivos do processo só mudam em feature/harness*', () => {
    for (const f of ['AGENTS.md', 'CLAUDE.md', '.githooks/pre-push', '.claude/settings.json', 'scripts/check-escopo.ts', '.github/workflows/ci.yml'])
      expect(rules(run([f])), f).toEqual(['erro:processo-protegido']);
    expect(run(['AGENTS.md'], { branch: 'feature/harness-2' })).toEqual([]);
  });

  it('docs puros passam', () => {
    expect(run(['docs/visual.md'])).toEqual([]);
  });
});
