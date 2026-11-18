---
objetivo: Alinhar DESIGN.md e .impeccable/design.json ao hover do tema Sumi já implantado (--accent-2 #c92a31).
escopo: ["DESIGN.md", ".impeccable/design.json"]
fora: ["src/data/balance*", "prototype/**", "AGENTS.md", "CLAUDE.md", ".github/**", ".githooks/**", ".claude/**", "scripts/check-*"]
pronto: ["npm run check verde", "DESIGN.md e design.json mostram #c92a31 no hover"]
agente: claude
revisor: codex
issue: 26
---

# Referência de design com o hover antigo

## Pedido
Issue #26: o hover do tema Sumi em `DESIGN.md` e `.impeccable/design.json` ainda é `#db3a40`; o token implantado é `#c92a31`.

## Contexto
`prototype/styles/tokens.css:22` e `docs/registro.md` (linha 391) registram a troca por contraste (4,5:1). Só a documentação ficou para trás.

## Plano
1. `DESIGN.md`: `primary-bright` e o texto da Laca Viva passam a `#c92a31`.
2. `design.json`: exemplo `.ds-btn-primary:hover` passa a `#c92a31`.
3. CSS e paleta do jogo ficam como estão.

## Fora do escopo
Mudar o CSS, a rampa tonal ou qualquer outro token.

## Decisões para o usuário
Nenhuma.

## Achados
Nenhum.
