---
objetivo: Mostrar o Uchiha e Orochimaru nas bordas opostas da roleta na ilustração do card Arcade do Portão, com o figurino de Orochimaru corrigido.
escopo: ["docs/tarefas/banner-arcade.md", "public/img/cenas/modo-roleta.webp", "docs/visual.md", "changelog.d/banner-arcade.md"]
fora: ["public/img/cenas/arcade.webp", "public/img/ninja/**", "public/img/viloes/**", "prototype/**", "src/**"]
pronto: ["WebP transparente em 840 × 560, em tinta ameixa", "Figurino reconhecível e personagens em lados opostos no card", "Conferência de gate.home em 390, 768, 1280, 1920 e 2560 px", "npm run check verde e PR para staging"]
agente: codex
aprovado: 2026-11-28
---

# Duelo no card Arcade do Portão

## Pedido

Aplicar ao banner enviado o enquadramento aprovado no painel do Arcade e corrigir o desenho de Orochimaru.

## Contexto

O Portão usa a ilustração transparente `modo-roleta.webp`. A referência de composição é a pintura aprovada para o lobby, com o Uchiha grande, de costas, e Orochimaru menor, de frente, sobre a borda distante. A identidade dos cards está em [visual.md](../visual.md).

## Plano

1. Com o contrato aprovado, usar o WebP original, a pintura aprovada e o modelo de corpo inteiro como referências. Preservar o formato 3:2, as áreas transparentes, a tinta ameixa e as marcas de pincel.
2. Desenhar o Uchiha com a kunai baixa e Orochimaru na outra extremidade do círculo. Deixar o eixo da roda entre os dois. Manter as mãos discretas, túnica de mangas curtas sobre mangas escuras, corda única na cintura, ataduras nas canelas e sandálias abertas. Usar o negativo do papel para distinguir esses detalhes em tamanho de card.
3. Mostrar a arte para escolha antes de substituir o WebP. Conferir a transparência e a leitura no Portão, comparar antes e depois e registrar a mudança na tabela de cenas e no fragmento.
4. Rodar `npm run check` e abrir PR da branch para `staging`.

## Fora do escopo

Pintura do lobby, composição da interface, textos e comportamento dos controles, demais cards, retratos e regras do jogo.

## Decisão para o usuário

Aprovar o contrato e conferir a nova ilustração monocromática antes da integração.
