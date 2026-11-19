---
objetivo: Aplicar às telas jogáveis a composição da simulação Shinobi aprovada.
escopo: ["prototype/styles/**", "prototype/roleta/screens/rewards.ts", "prototype/jornada/talentTree.ts", "docs/visual.md"]
fora: ["src/**", "public/img/**", "scripts/**", ".github/**"]
pronto: ["npm run check aprovado", "oito telas conferidas no UI Lab em celular e desktop nos dois temas", "roleta, mapa, combate e talentos testados pelo fluxo normal"]
agente: codex
revisor: claude
---

# Composição Shinobi nas telas jogáveis

## Pedido

O usuário aprovou a disposição e o design, pediu uma simulação com as artes do jogo e solicitou a aplicação das mudanças: “agora faça as suas alteraçoes propostas nesse modelo”.

## Telas

Portão da Vila, entrada da Jornada, sorteio de linhagem, mapa do Caminho Ninja, combate da História, evento O Time 7, relíquia da vitória e árvore de talentos. A implementação usa o sistema Shinobi e os recursos do repositório.

## Plano

Ajustar as folhas de estilo das telas e reunir a relíquia e suas ações num estado próprio. Conferir os cenários jogáveis em celular e desktop nos dois temas, inclusive com menos movimento, e atualizar a direção visual e o fragmento do changelog.

## Limites

A contribuição trata de apresentação. Dados, regras, pesos, persistência e arquivos de arte ficam fora do escopo.
