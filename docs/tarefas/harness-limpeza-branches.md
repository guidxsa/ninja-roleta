---
objetivo: Branches já mergeadas e antigas não se acumulam - todo agente apaga a branch depois do merge e limpa as que sobraram, com regra única no AGENTS.md.
escopo: ["AGENTS.md", ".claude/skills/lancar-versao/SKILL.md", "docs/tarefas/harness-limpeza-branches.md", "tests/checkEscopo.test.ts"]
fora: ["src/**", "prototype/**", "scripts/**", ".githooks/**", ".github/**", "package.json", "package-lock.json"]
pronto: ["npm run check verde", "regra no AGENTS.md (vale para Claude e Codex)", "skill lancar-versao aponta para a regra"]
agente: claude
revisor: codex
---

# Limpeza de branches

## Pedido
"Adicione como parte das instruções gerais o delete de branches já aprovadas e antigas."

## Contexto
A skill `lancar-versao` já apaga a branch no passo 6.4, mas só no fluxo de versão e só para o Claude. Merges de processo (como o PR #19) e os PRs do Codex ficam de fora, e as branches locais se acumulam: em 18/11/2026 havia 11 branches locais já mergeadas no `master`, 1 remota mergeada e 1 remota sem merge (`feature/docs-alinhamento`, de 17/11).

## Plano
1. **`AGENTS.md`, em Convenções**: regra única de limpeza, válida para os dois agentes:
   - depois do merge: apagar a branch no GitHub e no clone (worktree antes);
   - no começo de cada tarefa: `git fetch --prune` e apagar as locais já mergeadas no `origin/master`;
   - branch sem merge e parada há mais de 30 dias: listar e apagar só com aprovação do usuário;
   - nunca apagar `master`, `main`, `staging`, branch com PR aberto, branch em uso por outro agente, nem tags.
2. **Skill `lancar-versao`, passo 6.4**: aponta para a regra do `AGENTS.md` em vez de repetir.
3. **Teste que corrompia o repositório** (escopo ampliado com aprovação do usuário, 18/11/2026): `tests/checkEscopo.test.ts` cria um repositório temporário com `git init` e `git config`. No `pre-push` de um worktree, o git exporta `GIT_DIR` absoluto, e esses comandos caíam no repositório real: `core.bare=true` (git status e commit quebrados em todos os checkouts), `core.hooksPath=/dev/null` (hooks desligados) e usuário "teste". O teste passa a limpar as variáveis `GIT_*` antes de usar o git.

## Fora do escopo
Mudar hooks ou scripts (o `pre-push` já permite apagar branch remota de trabalho). Ligar no GitHub o "Automatically delete head branches", que é configuração do repositório e fica com o usuário.

## Achados
- O GitHub pode apagar a branch do PR sozinho no merge (Settings → General → "Automatically delete head branches"). Ligado, cobre a parte remota sem depender do agente.
