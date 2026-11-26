---
objetivo: O botão de nome da Ficha anuncia o texto visível (nome ou "Registre seu nome") seguido da ação de editar.
escopo: ["docs/tarefas/issue-74.md", "prototype/gate.ts", "tests/nomeAcessivel.test.ts", "changelog.d/issue-74.md"]
fora: ["src/data/balance*", "AGENTS.md", "CLAUDE.md", ".github/**", ".githooks/**", ".claude/**", "scripts/**", "CHANGELOG.md", "package.json", "package-lock.json"]
pronto: ["npm run check verde", "o nome acessível do botão começa pelo texto visível"]
agente: claude
revisor: codex
issue: 74
---

# Rótulo no nome do botão de editar nome

## Pedido
Issue #74: o botão mostra "Registre seu nome" ou o nome, mas o aria-label "Trocar nome" omite o texto visível (axe `label-content-name-mismatch`, WCAG 2.5.3).

## Contexto
`prototype/gate.ts` (`deskProfile`). O texto visível já é atualizado por `data-display-name`; sem `aria-label`, o nome acessível acompanha o texto.

## Plano
Teste, remover o `aria-label` e acrescentar a ação em `.sr-only` depois do texto visível; fragmento do changelog.

## Fora do escopo
Outros controles e o avatar.

## Decisões para o usuário
Nenhuma.

## Achados
Nenhum.
