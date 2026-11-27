---
objetivo: Corrigir os 11 links internos quebrados nos docs e travar com um teste que confere links e âncoras dos Markdown.
escopo: ["docs/base/viloes.md", "docs/decisoes.md", "docs/jornada/personagens.md", "docs/jornada/reliquias.md", "docs/jornada/roteiro.md", "docs/jornada/run.md", "docs/jornada/talentos.md", "docs/registro.md", "tests/docs-links.test.ts", "docs/tarefas/issue-27.md"]
fora: ["src/**", "prototype/**", "src/data/balance*", "AGENTS.md", "CLAUDE.md", ".github/**", ".githooks/**", ".claude/**", "scripts/**"]
pronto: ["npm run check verde", "teste de links passa sem links quebrados"]
agente: claude
revisor: codex
issue: 27
---

# Links internos quebrados nos docs

## Pedido
Issue #27: 11 links para arquivos ou âncoras ausentes nos Markdown.

## Contexto
Erro claro de link quebrado ([issues.md](../processo/issues.md#triagem)). Os destinos atuais: `cronologia.md#cronologia-adaptada` (eventos e marcos da História), `classes.md#elemento-escolher-ou-sortear`, `base/progressao.md#curva-da-campanha-clássica-reserva`, e o título "Jornada na meta" do `registro.md`. Sem mudança de regra.

## Plano
1. Teste que varre os links relativos e âncoras dos `.md` de `docs/` (falha antes).
2. Trocar os destinos.

## Fora do escopo
Regra do jogo, números, outros docs.

## Decisões para o usuário
Nenhuma.

## Achados
Nenhum.
