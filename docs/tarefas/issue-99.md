---
objetivo: Tirar o parágrafo do recorde de dentro do parágrafo da nota do modo infinito no cardápio da Campanha.
escopo: ["docs/tarefas/issue-99.md", "prototype/jornada/index.ts", "tests/jornadaMarkup.test.ts", "changelog.d/issue-99.md"]
fora: ["src/data/balance*", "src/core/**", "AGENTS.md", "CLAUDE.md", ".github/**", ".claude/**", "scripts/**"]
pronto: ["npm run check verde", "teste falha antes e passa depois"]
agente: claude
issue: 99
---

# Parágrafo aninhado no cardápio da Campanha

## Pedido
Issue #99: `bestLine` devolve um `<p>` e é usado dentro de outro `<p>` em `classMenuDialog`.

## Plano
Teste que acusa o aninhamento, depois recorde e nota como irmãos.

## Fora do escopo
Qualquer mudança visual além da nota recuperar o estilo auxiliar.
