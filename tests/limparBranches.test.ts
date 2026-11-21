// Limpeza de branches (scripts/limpar-branches.ts; regra em AGENTS.md, "Limpeza de branches").
import { describe, expect, it } from 'vitest';
import { lerWorktrees, planejarLimpeza, type Branch, type Estado } from '../scripts/limpar-branches';

const DIA = 86_400_000;
const AGORA = 100 * DIA;
const b = (nome: string, sha = nome, dias = 1): Branch => ({ nome, sha, data: AGORA - dias * DIA });

function estado(over: Partial<Estado> = {}): Estado {
  return {
    atual: 'master',
    locais: [],
    remotas: [],
    worktrees: [{ caminho: '/repo', branch: 'master', sujo: false, principal: true }],
    integrados: new Set(),
    prMergeado: new Map(),
    prAberto: new Set(),
    agora: AGORA,
    ...over,
  };
}

describe('limpeza de branches', () => {
  it('apaga a branch cuja ponta já está numa base remota, no clone e no GitHub', () => {
    const p = planejarLimpeza(estado({ locais: [b('feature/a')], remotas: [b('feature/a')], integrados: new Set(['feature/a']) }));
    expect(p.apagarLocal).toEqual([{ nome: 'feature/a', motivo: 'integrada' }]);
    expect(p.apagarRemota).toEqual([{ nome: 'feature/a', motivo: 'integrada' }]);
  });

  it('reconhece o merge por squash pela ponta do PR mergeado', () => {
    const p = planejarLimpeza(estado({ locais: [b('feature/sq', 'abc')], prMergeado: new Map([['feature/sq', new Set(['abc'])]]) }));
    expect(p.apagarLocal).toEqual([{ nome: 'feature/sq', motivo: 'pr-mergeado' }]);
  });

  it('commit novo depois do merge do PR mantém a branch', () => {
    const p = planejarLimpeza(estado({ locais: [b('feature/sq', 'novo')], prMergeado: new Map([['feature/sq', new Set(['abc'])]]) }));
    expect(p.apagarLocal).toEqual([]);
  });

  it('nunca apaga master, main, staging, a branch atual nem branch com PR aberto', () => {
    const nomes = ['master', 'main', 'staging', 'feature/atual', 'feature/pr'];
    const p = planejarLimpeza(
      estado({
        atual: 'feature/atual',
        locais: nomes.map((n) => b(n)),
        remotas: nomes.map((n) => b(n)),
        integrados: new Set(nomes),
        prAberto: new Set(['feature/pr']),
      }),
    );
    expect(p.apagarLocal).toEqual([]);
    expect(p.apagarRemota).toEqual([]);
  });

  it('worktree sujo segura a branch; o limpo entra na lista de remoção', () => {
    const p = planejarLimpeza(
      estado({
        locais: [b('feature/suja'), b('feature/limpa')],
        integrados: new Set(['feature/suja', 'feature/limpa']),
        worktrees: [
          { caminho: '/repo', branch: 'master', sujo: false, principal: true },
          { caminho: '/wt/suja', branch: 'feature/suja', sujo: true, principal: false },
          { caminho: '/wt/limpa', branch: 'feature/limpa', sujo: false, principal: false },
        ],
      }),
    );
    expect(p.apagarLocal.map((x) => x.nome)).toEqual(['feature/limpa']);
    expect(p.removerWorktree).toEqual([{ caminho: '/wt/limpa', branch: 'feature/limpa' }]);
    expect(p.mantidas[0]?.nome).toBe('feature/suja');
  });

  it('sem merge e parada há mais de 30 dias só é listada, uma vez', () => {
    const p = planejarLimpeza(estado({ locais: [b('feature/velha', 'v', 45), b('feature/nova', 'n', 3)], remotas: [b('feature/velha', 'v', 45)] }));
    expect(p.apagarLocal).toEqual([]);
    expect(p.apagarRemota).toEqual([]);
    expect(p.paradas).toEqual([{ nome: 'feature/velha', dias: 45 }]);
  });

  it('sem o gh, não mexe nas remotas', () => {
    const p = planejarLimpeza(
      estado({ locais: [b('feature/a')], remotas: [b('feature/a')], integrados: new Set(['feature/a']), prAberto: null, prMergeado: null }),
    );
    expect(p.apagarLocal.map((x) => x.nome)).toEqual(['feature/a']);
    expect(p.apagarRemota).toEqual([]);
  });

  it('lê o git worktree list --porcelain', () => {
    const out = 'worktree C:/repo\nHEAD 1\nbranch refs/heads/master\n\nworktree C:/wt/x\nHEAD 2\nbranch refs/heads/feature/x\n\nworktree C:/wt/solto\nHEAD 3\ndetached\n';
    expect(lerWorktrees(out)).toEqual([
      { caminho: 'C:/repo', branch: 'master', principal: true },
      { caminho: 'C:/wt/x', branch: 'feature/x', principal: false },
      { caminho: 'C:/wt/solto', branch: null, principal: false },
    ]);
  });
});
