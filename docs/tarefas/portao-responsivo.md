---
objetivo: Separar a Ficha e os pergaminhos no Portão em tablet e assegurar 44 px no controle de expandir o Registro do ninja em telas de toque.
escopo: ["docs/tarefas/portao-responsivo.md", "prototype/styles/shinobi/detalhes.css", "changelog.d/portao-responsivo.md"]
fora: ["src/**", "prototype/styles/shell.css", "prototype/gate.ts", "public/img/**"]
pronto: ["Ficha e Conquistas acima dos pergaminhos em 900×600 e 1023×768", "controle Registro do ninja com 44 px no toque", "capturas do UI Lab sem rolagem horizontal", "npm run check verde"]
agente: codex
revisor: claude
---

# Portão responsivo e Registro do ninja no toque

## Pedido

Aplicar as correções confirmadas na revisão visual do Portão. Este contrato cobre as issues #72 e #73. A correção do nome acessível (#74) já entrou no `staging` pelo PR #77.

## Contexto

A [direção visual](../visual.md#telas-no-estilo-novo) reserva uma linha para Ficha e Conquistas, seguida pelos três pergaminhos, na faixa de 768 a 1023 px. A partir de 900 px, a casca geral muda o conteúdo para flex e comprime as linhas do Portão. Na Ficha, a altura fixa de 36 px desconsidera o token de toque de 44 px.

## Plano

1. Restaurar o fluxo do conteúdo do Portão na faixa de tablet, mantendo as três áreas da grade e os destinos na barra inferior.
2. Aplicar o token `--tap` ao controle que expande o Registro do ninja.
3. Conferir os tamanhos que reproduziam o problema e as larguras adjacentes no navegador. Repetir as capturas do UI Lab com os perfis vazio, médio e completo.

## Fora do escopo

Arte, alterações de conteúdo nos pergaminhos, casca das outras telas e regras do jogo.

## Achados

Os PRs #75 e #76 foram verificados no navegador. A correção automatizada após a revisão terminou sem atualizar as branches. Este trabalho parte do `staging` e entrega os dois ajustes nessas áreas.
