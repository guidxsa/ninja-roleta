---
objetivo: Com movimento reduzido, as 3 opções do baú do chefe aparecem juntas, sem atraso nem animação de entrada.
escopo: ["prototype/styles/a11y.css", "docs/tarefas/issue-88.md", "changelog.d/issue-88.md"]
fora: ["src/data/balance*", "src/core/**", "AGENTS.md", "CLAUDE.md", ".github/**", ".githooks/**", ".claude/**", "scripts/check-*"]
pronto: ["npm run check verde", "bloco prefers-reduced-motion do a11y.css zera a animação de .jrboss-opt"]
agente: claude
issue: 88
---

# Opções do baú do chefe com movimento reduzido

## Pedido
Issue #88: com `prefers-reduced-motion`, a 2ª e a 3ª relíquia do baú do chefe respondem ao toque por até 240 ms enquanto ainda invisíveis (`relicReveal` com atraso).

## Contexto
`prototype/styles/jornada.css:168-172` anima `.jrboss-opt` com `both` e atraso; o bloco de movimento reduzido do `a11y.css` não a zera.

## Plano
Acrescentar `.jrboss-opt { animation: none; }` ao bloco `prefers-reduced-motion` do `a11y.css`. Só CSS, sem fórmula (nada a testar em unidade).

## Fora do escopo
Mudar a animação normal ou o visual das opções.

## Decisões para o usuário
Nenhuma.

## Achados
Nenhum.
