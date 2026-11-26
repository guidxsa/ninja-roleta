---
objetivo: A faixa expansível "Registro do ninja" da Ficha tem alvo de toque de pelo menos 44px em ponteiro grosseiro.
escopo: ["docs/tarefas/issue-73.md", "prototype/styles/a11y.css", "changelog.d/issue-73.md"]
fora: ["src/**", "src/data/balance*", "AGENTS.md", "CLAUDE.md", ".github/**", ".githooks/**", ".claude/**", "scripts/**", "CHANGELOG.md", "package.json", "package-lock.json"]
pronto: ["npm run check verde", "summary do Registro com min-height 44px em (pointer: coarse)", "PR para staging com Closes #73"]
agente: claude
revisor: codex
issue: 73
---

# Registro do ninja com 44px no toque

## Pedido
Issue #73: o `summary` de `.jmodes .ninja-record` mede 36px em ponteiro grosseiro; a regra é 44px (`docs/visual.md`, "Alvos de toque").

## Contexto
Os alvos pequenos sobem para 44px no bloco `@media (pointer: coarse)` de `prototype/styles/a11y.css`. O desenho não muda, só a área que responde.

## Plano
Acrescentar a regra no bloco de toque do `a11y.css`, com especificidade igual ou maior que a de `detalhes.css`. O `docs/visual.md` já descreve a regra; não muda.

## Fora do escopo
Outros alvos de toque, mudança de desenho.

## Decisões para o usuário
Nenhuma.

## Achados
Nenhum.
