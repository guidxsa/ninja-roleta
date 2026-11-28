---
objetivo: Dar ao lobby do Arcade uma pintura panorâmica própria do duelo entre um ninja Uchiha e Orochimaru, na mesma família visual da História e da Campanha.
escopo: ["docs/tarefas/painel-arcade.md", "public/img/cenas/arcade.webp", "prototype/art.ts", "prototype/roleta/screens/lobby.ts", "prototype/styles/**", "prototype/lab/**", "docs/visual.md", "changelog.d/painel-arcade.md"]
fora: ["src/**", "public/img/cenas/modo-roleta.webp", "public/img/ninja/**", "public/img/viloes/**", "prototype/jornada/**"]
pronto: ["Pintura escolhida pelo usuário e exportada em WebP 1774 × 887", "Dois lutadores visíveis no celular e textos legíveis nas cinco resoluções", "Card do Arcade preservado no Portão", "Tabela de cenas e fragmento atualizados", "npm run check verde", "PR para staging com prompt final, ajustes e fotos de antes e depois"]
agente: codex
aprovado: 2026-11-28
---

# Pintura do painel do Arcade

## Pedido

Levar o duelo do card do Portão para uma arena de pedra em forma de roleta. O painel deve mostrar a tensão antes do primeiro golpe e deixar espaço para ler o letreiro e a frase.

## Contexto

O lobby usa `sceneMedia('modo-roleta')` e amplia a pintura monocromática de um card 3:2. História e Campanha já têm cenas próprias para seus painéis. As referências de direção são [visual.md](../visual.md) e [DESIGN.md](../../DESIGN.md). O trabalho segue o [AGENTS.md](../../AGENTS.md) e o [fluxo para staging](../processo/fluxo.md).

## Plano

1. Aguardar a aprovação deste contrato. Registrar o antes no UI Lab.
2. Passar as cinco referências ao gerador e apresentar duas variações em 2:1. Uma aproxima o ninja e a outra abre o plano para mostrar mais da roda. Aguardar a escolha do usuário antes de integrar e registrar cada ajuste que ele pedir.
3. Reduzir a pintura escolhida para 1774 × 887 px em `public/img/cenas/arcade.webp`. Medir o ponto focal entre os lutadores e registrá-lo na nova entrada `arcade` de `SCENE_ART`. No TS do lobby, trocar apenas o argumento de `sceneMedia` para `'arcade'`. Eventual ajuste de enquadramento fica em `prototype/styles/roleta-lobby.css`.
4. Conferir os recortes e a leitura no UI Lab, documentar a vaga `arcade` na tabela de cenas e escrever o fragmento do changelog.
5. Rodar `npm run check`, conferir o diff, commitar sem linha de coautoria e enviar apenas `feature/painel-arcade`. Abrir PR para `staging` com “Agente: codex”, prompt final, ajustes pedidos e fotos de antes e depois. Registrar achados fora do escopo em issues.

## Briefing visual

- Usar `public/img/cenas/modo-roleta.webp` para o duelo e a composição. Usar `public/img/cenas/caminho-ninja.webp` e `public/img/cenas/jornada.webp` para o nanquim, o cel shading e a luz dramática. Usar `public/img/ninja/uchiha.webp` e `public/img/viloes/orochimaru.webp` para os personagens.
- Mostrar o ninja da origem Uchiha de costas, com rosto oculto, gola alta e leque nas costas. Do outro lado da roda, Orochimaru tem cabelo preto longo, pele pálida, olhos dourados com marcas roxas, túnica clara e corda roxa na cintura. A cobra aos pés reforça a silhueta.
- A arena em ruínas tem fatias de pedra com luz colorida, entalhes no aro e um ponteiro de metal. Folhas de bordo, talismãs e armas em suspensão sugerem o giro. O céu em camadas passa do crepúsculo à noite, com luz ameixa e violeta e pontos âmbar das lanternas. A pintura é original e livre de texto, moldura e elementos de interface.
- Usar como ponto de partida o Uchiha a 48% da largura e Orochimaru a 76%, com o centro do duelo perto de 62% × 50%. Reservar áreas escuras à esquerda para o letreiro em cima e a frase embaixo. O recorte estreito deve incluir os dois lutadores e parte da roda.
- Conferir `roleta.lobby`, `roleta.lobby:mid` e `roleta.lobby:full` em 390 × 844, 768 × 1024, 1280 × 800, 1920 × 1080 e 2560 × 1440. Comparar com `jornada.story.pick` e `jornada.path.setup` e conferir o card original em `gate.home`.
- Preservar `data-choice`, `data-diff`, `data-diff-stats`, `#diff-desc`, `data-profile`, `aria-*` e as classes `.rlobby*`, `.gate-banner`, `.jlogo`, `.jhub`, `.gate-main` e `.gate-aside`.

## Fora do escopo

Regras e dados do jogo, arte e entrada de cena do card do Portão, retratos, telas da Jornada e casca compartilhada dos painéis. Os arquivos locais `prompts-codex-arcade.md`, `imagens-codex.md`, `plano-codex-telas.md` e `prompts-codex-telas.md` ficam fora dos commits.

## Decisões para o usuário

Aprovar o contrato antes da geração. Depois de ver as duas pinturas, escolher a que será integrada e indicar eventuais ajustes.

## Achados

Nenhum registrado na preparação do contrato.
