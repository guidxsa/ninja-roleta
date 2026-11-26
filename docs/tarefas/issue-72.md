---
objetivo: No tablet de 900 a 1023 px, a Ficha e Conquistas do Portão ficam numa linha própria, sem os pergaminhos de modo por cima.
escopo: ["prototype/styles/shinobi/detalhes.css", "docs/visual.md", "docs/registro.md", "changelog.d/issue-72.md", "docs/tarefas/issue-72.md"]
fora: ["src/data/balance*", "src/core/**", "prototype/styles/shell.css"]
pronto: ["npm run check verde", "Portão a 900×600 e 1023×768 sem sobreposição (override CSS, não conferido em navegador no loop)"]
agente: claude
revisor: codex
issue: 72
---

# Pergaminhos do Portão cobrem a Ficha no tablet entre 900 e 1023 px

## Pedido
Issue #72: entre 900 e 1023 px a grade de modos invade a linha da Ficha e de Conquistas.

## Contexto
`shell.css` (casca do PC, ≥900×560) deixa o Portão em `'main aside'`, enquanto `detalhes.css` (tablet, 768–1023) usa três linhas. `docs/visual.md` manda barra inferior e a composição do tablet até 1023 px.

## Plano
Um override CSS em `detalhes.css` para 900–1023 px (altura ≥560): uma coluna, cena e modos na primeira linha, Ficha e Conquistas lado a lado na seguinte.

## Fora do escopo
Mudar a casca do PC, o desktop ≥1024 px e as demais telas.

## Decisões para o usuário
Nenhuma.

## Achados
Nenhum.
