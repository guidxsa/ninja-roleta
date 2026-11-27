---
objetivo: A limpeza de branches deixa de depender da memória do agente: script `npm run limpar`, hook de início de sessão e auto-delete do GitHub.
escopo: ["scripts/limpar-branches.ts", "tests/limparBranches.test.ts", "package.json", ".claude/settings.json", ".claude/hooks/limpar-branches.sh", "AGENTS.md", ".claude/skills/lancar-versao/SKILL.md"]
fora: ["src/**", "prototype/**", "src/data/balance*", ".github/**", ".githooks/**"]
pronto: ["npm run check verde", "npm run limpar mostra o plano sem apagar", "teste cobre integrada, squash, protegidas, PR aberto, worktree sujo, parada e sem gh"]
agente: claude
revisor: codex
---

# Limpeza de branches automática

## Pedido
"As branches não parecem estar sendo limpas." O usuário escolheu ligar o auto-delete do GitHub e criar o script de limpeza (19/11/2026).

## Contexto
A regra do AGENTS.md ("Limpeza de branches") era só manual e falhava por três motivos, vistos no clone do usuário:

1. Nenhum agente rodava a limpeza depois do merge, e o repositório não apagava a branch do PR sozinho.
2. `git branch -d` compara com o HEAD; com o `master` local atrasado, recusava branches já no staging, e o PR mergeado por squash nunca aparece como integrado.
3. No Windows, o git não consegue apagar as pastas dos worktrees (a pasta OneDrive tem uma permissão que nega excluir subpasta, posta pelo sandbox do Codex): `git worktree remove` e `git fetch --prune` saíam com "Permission denied" e os restos ficavam.

Limpeza feita à mão nesta sessão: 18 branches locais, 5 remotas e 7 worktrees. Ficaram `feature/interface-shinobi` (PR aberto), `feature/docs-alinhamento` e `feature/harness-autorizacao-issues` (trabalho que nunca entrou).

## Plano
1. `scripts/limpar-branches.ts`: plano puro (`planejarLimpeza`) e execução; `npm run limpar`.
2. Teste do plano em `tests/limparBranches.test.ts`.
3. Hook `SessionStart` (`.claude/hooks/limpar-branches.sh`) com `--aplicar`, sem worktrees.
4. Regra do AGENTS.md e passo da `lancar-versao` apontando para o script.
5. Fora do código: "Automatically delete head branches" ligado no repositório.

## Fora do escopo
Mudar a permissão da pasta OneDrive (é do usuário e do sandbox do Codex); apagar as branches sem merge que sobraram.

## Decisões para o usuário
Nenhuma além das já tomadas.

## Achados
- A pasta `C:\Users\guird\OneDrive` tem uma permissão explícita "Todos: negar excluir subpasta" junto do grupo `CodexSandboxUsers`. O script contorna, mas outras ferramentas que usam o git para apagar pastas vão continuar esbarrando nela.
