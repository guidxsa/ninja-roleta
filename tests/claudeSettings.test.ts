// Negações do Claude Code (.claude/settings.json; CLAUDE.md, "Só do Claude Code"): valem igual no Bash e no PowerShell,
// a ferramenta principal no Windows (#52). O curinga `*` do Claude Code casa qualquer texto, espaços inclusive.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const deny: string[] = JSON.parse(readFileSync('.claude/settings.json', 'utf8')).permissions.deny;
const regra = /^(Bash|PowerShell)\((.*)\)$/;
const padroes = (ferramenta: string) => deny.map((d) => regra.exec(d)).filter((m) => m?.[1] === ferramenta).map((m) => m![2]!);
const casa = (padrao: string, cmd: string) => new RegExp(`^${padrao.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`).test(cmd);
const negado = (ferramenta: string, cmd: string) => padroes(ferramenta).some((p) => casa(p, cmd));

describe('negações do .claude/settings.json', () => {
  it('toda negação vale no Bash e no PowerShell', () => {
    for (const d of deny) expect(regra.test(d), d).toBe(true);
    expect(padroes('PowerShell')).toEqual(padroes('Bash'));
  });

  it.each(['Bash', 'PowerShell'])('%s nega push em master, main e staging, push forçado e pular hook', (ferramenta) => {
    for (const cmd of [
      'git push origin master',
      'git push -u origin master --tags',
      'git push origin HEAD:master',
      'git push origin main',
      'git push origin staging',
      'git push -u origin staging',
      'git push origin HEAD:staging',
      'git push --force origin feature/x',
      'git push origin feature/x --force-with-lease',
      'git push -f origin feature/x',
      'git push origin +feature/x',
      'git commit --no-verify -m x',
      'git commit -n -m x',
      'git commit -m "x" -n',
      'git -c core.hooksPath=/dev/null commit -m x',
      'git config core.hooksPath .outro',
      'git config --local core.hooksPath .outro',
      'gh issue edit 5 --add-label correcao-automatica',
      'gh api repos/o/r/issues/5/labels -f labels[]=x',
    ])
      expect(negado(ferramenta, cmd), cmd).toBe(true);
  });

  it.each(['Bash', 'PowerShell'])('%s deixa o fluxo normal da branch de trabalho', (ferramenta) => {
    for (const cmd of [
      'git push -u origin feature/harness-incongruencias',
      'git push origin HEAD',
      'git commit -m "Corrige a trava"',
      'git status',
      'gh pr create --base staging',
      'gh issue view 51',
    ])
      expect(negado(ferramenta, cmd), cmd).toBe(false);
  });
});
