---
objetivo: O botão Jogar do primeiro pergaminho do Portão fica inteiro, dentro do papel, em 360 px.
escopo: ["prototype/styles/shinobi/entradas.css", "docs/tarefas/issue-41.md"]
fora: ["src/**", "prototype/**/*.ts", "AGENTS.md", "CLAUDE.md", ".github/**", "package.json"]
pronto: ["npm run check verde", "gate.home em 360 × 780: rótulo e alvo do Jogar acima do rolo de baixo", "sem rolagem horizontal em 360, 390, 768 e 1024 px"]
agente: claude
revisor: codex
issue: 41
---

# Jogar cortado no Portão em 360 px

## Pedido

Resolver a [issue #41](https://github.com/guidxsa/ninja-roleta/issues/41) (pedido do usuário em 20/11/2026).

## Contexto

No celular (`max-width: 899px` ou `max-height: 559px`), o card de modo do Portão tinha altura fixa `clamp(164px, 22vh, 208px)`: 172 px em 360 × 780. A descrição da Jornada ocupa cinco linhas na coluna de 58% e empurra o botão para baixo do rolo inferior. Esta branch parte de `feature/ninshu-identidade` (PR #42), onde o problema foi visto.

## Plano

1. A altura do card vira mínima (`min-height`), não fixa. O card vira coluna flex e o corpo ocupa o resto, para o botão seguir no pé do papel.
2. Conferir `gate.home`, `gate.home:mid` e `gate.home:full` em 360, 390, 768 e 1024 × 500.

## Fora do escopo

Recompor o card do Portão (Tarefa 2 do plano de telas), texto das descrições e o desktop.

## Achados

- Em 768 × 1024 o botão encosta 2 px no rolo de baixo (já era assim antes desta correção).
