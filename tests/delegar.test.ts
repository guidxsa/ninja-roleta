// Delegação ao Codex local (scripts/delegar.ts; docs/processo/delegacao.md).
import { describe, expect, it } from 'vitest';
import { argsCodex, lerArgs, montarPrompt, motivoRecusa, pastaPadrao } from '../scripts/delegar';

const contrato = (agente: string, escopo = '["prototype/styles/**"]') => `---\nobjetivo: x\nescopo: ${escopo}\nagente: ${agente}\n---\n`;

describe('o que pode ser delegado', () => {
  it('só contrato com agente: codex e escopo', () => {
    expect(motivoRecusa('letreiro', contrato('codex'))).toBeNull();
    expect(motivoRecusa('letreiro', contrato('claude'))).toMatch(/agente: claude/);
    expect(motivoRecusa('letreiro', contrato('codex', '[]'))).toMatch(/escopo/);
    expect(motivoRecusa('letreiro', null)).toMatch(/sem contrato em docs\/tarefas\/letreiro\.md/);
  });

  it('tema vira nome de branch; processo, issue e release não se delegam', () => {
    expect(motivoRecusa('Letreiro Novo', contrato('codex'))).toMatch(/inválido/);
    for (const t of ['harness-x', 'issue-12', 'release-v0-96-0']) expect(motivoRecusa(t, contrato('codex')), t).toMatch(/não se delega/);
  });
});

describe('como o Codex roda', () => {
  it('lê os argumentos em qualquer ordem', () => {
    expect(lerArgs(['letreiro'])).toEqual({ tema: 'letreiro', contrato: null, nota: '', seco: false });
    expect(lerArgs(['--nota', 'corrija o contraste', 'letreiro', '--seco', '--contrato', 'c.md'])).toEqual({
      tema: 'letreiro',
      contrato: 'c.md',
      nota: 'corrija o contraste',
      seco: true,
    });
  });

  it('escrita só no worktree e no .git comum, sem rede, prompt pela entrada padrão', () => {
    expect(argsCodex('/wt/letreiro', '/repo/.git', '/wt/letreiro.resultado.md')).toEqual([
      'exec',
      '-s',
      'workspace-write',
      '-C',
      '/wt/letreiro',
      '--add-dir',
      '/repo/.git',
      '-o',
      '/wt/letreiro.resultado.md',
      '-',
    ]);
  });

  it('o prompt aponta o contrato e deixa push e PR com o Claude', () => {
    const p = montarPrompt('letreiro');
    expect(p).toContain('docs/tarefas/letreiro.md');
    expect(p).toContain('feature/letreiro');
    expect(p).toMatch(/Não dê push, não abra PR/);
    expect(p).toContain('sem Co-Authored-By');
    expect(p).not.toContain('Nota do Claude');
    expect(montarPrompt('letreiro', ' mais contraste ')).toMatch(/Nota do Claude para esta rodada:\nmais contraste$/);
  });

  it('worktrees fora do OneDrive, com a pasta ajustável', () => {
    expect(pastaPadrao({}, '/home/u').replaceAll('\\', '/')).toBe('/home/u/worktrees/ninja-roleta');
    expect(pastaPadrao({ DELEGAR_PASTA: 'D:/wt' }, '/home/u')).toBe('D:/wt');
  });
});
