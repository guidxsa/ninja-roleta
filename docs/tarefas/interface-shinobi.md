---
objetivo: Incorporar ao jogo a composição das oito telas da prévia integrada aprovada.
escopo: ["prototype/styles/**", "prototype/gate.ts", "prototype/wheel.ts", "prototype/lineageEmblems.ts", "prototype/battleArt.ts", "prototype/jornada/index.ts", "prototype/jornada/battle.ts", "prototype/jornada/scene.ts", "prototype/jornada/branchScenery.ts", "prototype/jornada/talentTree.ts", "prototype/roleta/screens/battle.ts", "prototype/roleta/screens/origin.ts", "prototype/roleta/screens/rewards.ts", "scripts/page-build.ts", "public/img/shinobi/**", "docs/visual.md"]
fora: ["src/**", "prototype/lab/**", ".github/**"]
pronto: ["npm run check aprovado", "oito telas comparadas às capturas da prévia integrada no UI Lab e no protótipo", "controles conferidos nos fluxos do jogo"]
agente: codex
revisor: claude
---

# Composição Shinobi nas telas jogáveis

A referência da Tarefa 0 é a prévia integrada aprovada em 19/11. O Portão, a entrada da Jornada e as seis telas de partida usam os mesmos módulos no jogo e no UI Lab. As artes de cenário, madeira, tecido e papel acompanham os dois builds para uso offline.

| Tela | O que conferir |
|---|---|
| Portão da Vila | Ilustração e letreiro sobre a cena. Modos e progresso abaixo, com Registro do ninja recolhível na ficha de desktop. |
| Entrada da Jornada | Progresso da run salva e acesso a História e Caminho Ninja nos pergaminhos. |
| Linhagem | Cada fatia tem emblema. A legenda reúne nome, símbolo e probabilidade. Tocar em uma origem destaca a fatia e preserva o sorteio. |
| Mapa do Caminho Ninja | O mapa e os botões compartilham os destinos disponíveis. Rotas do mesmo tipo recebem números. No celular, a ficha abre a partir do resumo de vida, chakra e ryō. |
| Combate da História | A luta contra Haku usa a ponte. Retratos, fichas e ações acompanham o estado da equipe, com carregamento prévio das artes da luta. |
| O Time 7 | Faixa do capítulo, Kakashi no cenário e opções no pergaminho. |
| Relíquia da vitória | Roda, cartão da relíquia, Ficha e Continuar. O Sino do Kakashi tem arte própria quando sai no sorteio. |
| Árvore de talentos | A classe e o ramo ativo determinam a paisagem. O detalhe e o custo acompanham o talento selecionado. |

## Conferência

Comparar o protótipo de `npm run proto` e os cenários de `npm run lab` com as capturas de PC (1440 × 900) e celular (390 × 844) em Sumi e Pergaminho. No Lab, usar um Portão com save, o chefe Haku, o evento O Time 7 e o sorteio de relíquia jounin. No protótipo, continuar a run a partir do Portão e chegar à recompensa pelo combate do Roleta. Nome, conquistas, falas, barras e recompensas refletem o estado de cada partida.

A entrega é o PR #35 para staging. A prévia, os atalhos e os instrumentos usados na comparação ficam fora do pacote do jogo.
