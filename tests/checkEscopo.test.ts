// Conferência de escopo pelo contrato da tarefa (AGENTS.md, "Escopo"; scripts/check-escopo.ts).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { gitChanges } from '../scripts/harness';
import { checkEscopo, ETIQUETA_AUTOMATICA, EXIGIR_CONTRATO_A_PARTIR, parseContrato, temaDaTarefa } from '../scripts/check-escopo';

const contrato = (escopo: string[], fora: string[] = []) =>
  `---\nobjetivo: Teste.\nescopo: ${JSON.stringify(escopo)}\nfora: ${JSON.stringify(fora)}\n---\n\n# Tarefa\n`;
const run = (files: string[], md: string | null, over: Partial<Parameters<typeof checkEscopo>[0]> = {}) =>
  checkEscopo({ branch: 'feature/veneno', files, contrato: md, hoje: '2026-11-20', ...over });
const rules = (f: ReturnType<typeof checkEscopo>) => f.map((x) => `${x.level}:${x.rule}`);
const DEPOIS = EXIGIR_CONTRATO_A_PARTIR;

describe('contrato', () => {
  it('lê o frontmatter com listas JSON', () => {
    expect(parseContrato(contrato(['src/core/**'], ['prototype/**']))).toMatchObject({
      objetivo: 'Teste.',
      escopo: ['src/core/**'],
      fora: ['prototype/**'],
    });
    expect(parseContrato('# sem frontmatter')).toBeNull();
  });

  it('o tema vem de CHECK_TEMA, da branch feature/<tema> ou do único contrato alterado', () => {
    expect(temaDaTarefa('qualquer', [], { CHECK_TEMA: 'x' }).tema).toBe('x');
    expect(temaDaTarefa('feature/veneno', []).tema).toBe('veneno');
    expect(temaDaTarefa('codex/abc', ['docs/tarefas/veneno.md', 'src/a.ts']).tema).toBe('veneno');
    expect(temaDaTarefa('codex/abc', ['docs/tarefas/a.md', 'docs/tarefas/b.md']).tema).toBeNull();
    expect(temaDaTarefa('work', ['src/a.ts']).tema).toBeNull();
  });
});

describe('escopo', () => {
  const md = contrato(['src/core/roleta/**', 'tests/roleta*.test.ts', 'docs/roleta/**'], ['src/data/balance*']);

  it('dentro do escopo passa, com os arquivos de sempre e o próprio contrato', () => {
    const files = ['src/core/roleta/battle.ts', 'tests/roleta.test.ts', 'docs/roleta/combate.md', 'CHANGELOG.md', 'docs/tarefas/veneno.md'];
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

  it('package.json só passa fora do escopo se mudar apenas a versão (revisão do Codex)', () => {
    const docs = contrato(['docs/**']);
    expect(run(['docs/a.md', 'package.json'], docs, { packageOnlyVersion: true })).toEqual([]);
    expect(run(['docs/a.md', 'package.json'], docs, { packageOnlyVersion: false })[0]!.files).toEqual(['package.json']);
  });

  it('o contrato não precisa de etiqueta de aprovação: o staging é o playground (docs/processo/fluxo.md)', () => {
    expect(run(['src/core/roleta/battle.ts'], md, { hoje: DEPOIS })).toEqual([]);
  });

  it('correção automática: a branch do loop precisa da etiqueta do dono na issue e de issue: <n> no contrato', () => {
    const md7 = `---
objetivo: Corrige a issue 7.
issue: 7
escopo: ["docs/**"]
---
`;
    const issue = { branch: 'feature/issue-7', hoje: DEPOIS };
    expect(run(['docs/a.md'], md7, { ...issue, issueLabels: [ETIQUETA_AUTOMATICA] })).toEqual([]);
    // fora do PR não há como ler a issue: não confere
    expect(run(['docs/a.md'], md7, { ...issue, issueLabels: null })).toEqual([]);
    expect(rules(run(['docs/a.md'], md7, { ...issue, issueLabels: ['precisa-decisao'] }))).toEqual(['erro:correcao-automatica']);
    expect(rules(run(['docs/a.md'], md7, { ...issue, issueLabels: ['precisa-decisao'], hoje: '2026-11-20' }))).toEqual(['aviso:correcao-automatica']);
    expect(rules(run(['docs/a.md'], md7, { branch: 'feature/issue-8', hoje: DEPOIS, issueLabels: [ETIQUETA_AUTOMATICA] }))).toEqual([
      'erro:correcao-automatica',
    ]);
  });

  it('correção automática nunca mexe em balanceamento, nem com o arquivo no escopo', () => {
    const md7 = `---
objetivo: x
issue: 7
escopo: ["src/**"]
---
`;
    const f = run(['src/data/balance.ts', 'src/core/a.ts'], md7, { branch: 'feature/issue-7', issueLabels: [ETIQUETA_AUTOMATICA] });
    expect(rules(f)).toEqual(['erro:correcao-automatica']);
    expect(f[0]!.files).toEqual(['src/data/balance.ts']);
    expect(rules(run(['src/data/balance.ts'], md7, { branch: 'feature/issue-7' }))).toEqual(['erro:correcao-automatica']);
  });

  it('arquivo da área do outro agente dá aviso, sem barrar (AGENTS.md, "Dois agentes")', () => {
    const tudo = (agente: string) => `---\nobjetivo: x\nescopo: ["src/**", "prototype/**", "public/**"]\nagente: ${agente}\n---\n`;
    const visual = ['prototype/styles/shinobi/a.css', 'public/img/ninja/x.webp'];
    const logica = ['src/core/roleta/battle.ts', 'src/data/balance.ts', 'src/data/roleta/balance.ts'];
    const claude = run([...visual, ...logica], tudo('claude'));
    expect(rules(claude)).toEqual(['aviso:area-do-agente']);
    expect(claude[0]!.files).toEqual(visual);
    const codex = run([...visual, ...logica], tudo('codex'));
    expect(rules(codex)).toEqual(['aviso:area-do-agente']);
    expect(codex[0]!.files).toEqual(logica);
    expect(run([...visual, ...logica], tudo('humano'))).toEqual([]);
  });

  it('sem contrato: aviso antes da data, erro a partir dela', () => {
    expect(rules(run(['a.ts'], null))).toEqual(['aviso:contrato']);
    expect(rules(run(['a.ts'], null, { hoje: DEPOIS }))).toEqual(['erro:contrato']);
  });

  it('contrato sem escopo ou com lista inválida é erro', () => {
    expect(rules(run([], '---\nobjetivo: x\n---\n'))).toEqual(['erro:contrato']);
    expect(rules(run([], "---\nescopo: ['a']\n---\n"))).toEqual(['erro:contrato']);
  });

  it('sem tema: aviso antes da data, erro a partir dela, na CI e na máquina (revisão do Codex)', () => {
    expect(rules(run(['qualquer.ts'], null, { branch: 'work' }))).toEqual(['aviso:escopo']);
    expect(rules(run(['qualquer.ts'], null, { branch: 'work', hoje: DEPOIS }))).toEqual(['erro:escopo']);
    expect(run(['docs/a.md'], contrato(['docs/**']), { branch: 'work', hoje: DEPOIS, env: { CHECK_TEMA: 'veneno' } })).toEqual([]);
  });

  it('package-lock.json só passa fora do escopo se mudar apenas a versão do projeto (2ª revisão do Codex)', () => {
    const docs = contrato(['docs/**']);
    expect(run(['docs/a.md', 'package-lock.json'], docs, { lockOnlyVersion: true })).toEqual([]);
    expect(run(['docs/a.md', 'package-lock.json'], docs)[0]!.files).toEqual(['package-lock.json']);
  });

  it('branch com nome próprio usa o contrato alterado no diff', () => {
    const files = ['docs/tarefas/veneno.md', 'src/core/roleta/battle.ts', 'prototype/x.ts'];
    expect(run(files, md, { branch: 'codex/veneno-acumula' })[0]!.files).toEqual(['prototype/x.ts']);
  });
});

describe('renomeação conta a origem e o destino (3ª revisão do Codex)', () => {
  // Dentro de um git hook (o pre-push roda o npm run check), o git exporta GIT_DIR e afins; num worktree o GIT_DIR é
  // absoluto e venceria o cwd: o `git init` e o `git config` abaixo cairiam no repositório real (core.bare=true,
  // hooks desligados, usuário "teste"). O repositório temporário precisa de um ambiente sem essas variáveis.
  for (const k of Object.keys(process.env)) if (k.startsWith('GIT_')) delete process.env[k];
  const dir = mkdtempSync(join(tmpdir(), 'escopo-renome-'));
  const g = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  g('init', '-q');
  g('config', 'user.email', 'teste@exemplo');
  g('config', 'user.name', 'teste');
  g('config', 'core.hooksPath', '/dev/null');
  mkdirSync(join(dir, 'proibido'));
  mkdirSync(join(dir, 'permitido'));
  writeFileSync(join(dir, 'proibido/a.md'), 'conteúdo longo o bastante para o git reconhecer o renome\n'.repeat(5));
  g('add', '.');
  g('commit', '-q', '-m', 'base');
  const base = g('rev-parse', 'HEAD');
  g('mv', 'proibido/a.md', 'permitido/a.md');
  const md = contrato(['permitido/**'], ['proibido/**']);

  it('no índice (pre-commit)', () => {
    const { files } = gitChanges({}, true, dir);
    expect(files).toEqual(['permitido/a.md', 'proibido/a.md']);
    expect(run(files, md)[0]!.files).toEqual(['proibido/a.md']);
  });

  it('contra a base, depois do commit (pre-push e CI)', () => {
    g('commit', '-q', '-m', 'renome');
    const { files } = gitChanges({ CHECK_BASE: base }, false, dir);
    expect(files).toEqual(['permitido/a.md', 'proibido/a.md']);
    expect(run(files, md)[0]!.files).toEqual(['proibido/a.md']);
  });
});

describe('fluxo com staging (docs/processo/fluxo.md)', () => {
  it('staging e master não conferem contrato (cada tarefa foi conferida no próprio PR)', () => {
    expect(run(['src/core/a.ts'], null, { branch: 'staging', hoje: DEPOIS })).toEqual([]);
    expect(run(['src/core/a.ts'], null, { branch: 'master', hoje: DEPOIS })).toEqual([]);
  });

  it('feature/release-v<x.y.z> tem contrato implícito: só changelog e versão, sem etiqueta (#63)', () => {
    const release = { branch: 'feature/release-v0.96.0', hoje: DEPOIS, packageOnlyVersion: true, lockOnlyVersion: true };
    expect(run(['CHANGELOG.md', 'changelog.d/telas.md', 'package.json', 'package-lock.json'], null, release)).toEqual([]);
    const f = run(['CHANGELOG.md', 'src/core/a.ts'], null, release);
    expect(rules(f)).toEqual(['erro:fora-do-escopo']);
    expect(f[0]!.files).toEqual(['src/core/a.ts']);
    expect(rules(run(['package.json'], null, { ...release, packageOnlyVersion: false }))).toEqual(['erro:fora-do-escopo']);
    // Nome fora do padrão não ganha a exceção.
    expect(rules(run(['CHANGELOG.md'], null, { ...release, branch: 'feature/release-proxima' }))).toEqual(['erro:contrato']);
  });

  it('hotfix/<tema> usa o contrato do tema e changelog.d sempre pode mudar', () => {
    expect(temaDaTarefa('hotfix/texto', []).tema).toBe('texto');
    const md = contrato(['docs/roleta/**']);
    expect(run(['docs/roleta/a.md', 'changelog.d/texto.md', 'docs/tarefas/texto.md'], md, { branch: 'hotfix/texto' })).toEqual([]);
  });
});
