---
objetivo: Aproveitar melhor o espaço das telas em monitores grandes (2560×1440 e 3840×2160), sem mudar o que já está bom em Full HD (1920×1080) e abaixo.
escopo: ["docs/tarefas/telas-4k.md", "prototype/styles/**", "prototype/lab/**", "docs/visual.md", "DESIGN.md", "docs/ui-lab/**", "changelog.d/telas-4k.md"]
fora: ["src/**", "prototype/*.ts", "prototype/roleta/**", "prototype/jornada/**", "prototype/combat/**", "public/img/**", "scripts/**", ".claude/**", ".github/**", "package.json", "package-lock.json", "CHANGELOG.md", "AGENTS.md", "CLAUDE.md"]
pronto: ["npm run check verde", "em 1920×1080, 1440×900 e 1280×800 as telas ficam iguais às de antes (fotos de antes e depois)", "em 2560×1440 e 3840×2160 o conteúdo ocupa a largura e a altura úteis, com texto, botões e barra lateral em tamanho legível, sem faixas vazias grandes nem rolagem horizontal", "celular (390) e tablet (768) sem mudança", "docs/visual.md e DESIGN.md com as faixas de tela novas e o --shell-max certo", "fragmento changelog.d/telas-4k.md"]
agente: codex
aprovado: 2026-11-26
---

# Telas em monitores grandes (2K e 4K)

## Pedido

"Não gostei muito da disposição dos elementos na resolução de 4K (em Full HD ficou ótimo); sinto que os espaços deveriam ser melhor aproveitados (utilize o Codex)." Pedido do usuário em 27/11/2026, depois da v0.96.0.

## Contexto

Medido no site publicado (v0.96.0) pelo Claude:

- **3840×2160 (4K, escala 100%):** a casca para em `--shell-max: 1920px` (`prototype/styles/tokens.css`). O jogo ocupa só a metade do meio (de x=1040 a x=2960), com 1040 px vazios de cada lado; a fonte do corpo continua 15px e a barra lateral, 160px. Tudo fica pequeno e longe.
- **2560×1440 (2K, ou 4K com escala de 150% do Windows):** no Portão, a Ficha e as Conquistas viram uma coluna estreita (cerca de 325 px) à direita, com espaço vazio embaixo; os rótulos da barra lateral ficam miúdos. Na escolha da perspectiva da História, a arte cresce, mas o pergaminho embaixo fica baixo e pequeno.
- **1920×1080:** aprovado pelo usuário, é a referência e não deve mudar.
- **Divergência:** o [visual.md](../visual.md#celular-e-desktop) diz que o desktop vai "até `--shell-max` (2240px)", mas o token está em 1920px. Decidir o valor e deixar doc e token iguais.

## Briefing visual

**Telas para conferir** (UI Lab, `npm run lab`, cenários atuais): Portão (`gate.home`, perfis vazio, médio e cheio), páginas do Registro (Histórico, Livro Bingo com a ficha aberta, Relíquias, Conquistas), Arcade (origem, roda, mapa, luta, recompensas, fim) e, na Jornada, trilha, mapa, loja, árvore e luta.

**Tamanhos:** 1280×800, 1440×900 e 1920×1080 (não podem mudar: fotos de antes e depois); 2560×1440 e 3840×2160 (os que melhoram). Celular 390×844 e tablet 768×1024, só para ver que nada mudou.

**O que melhorar e por quê:**
- Uma faixa nova de tela grande (por exemplo, a partir de 2200px de largura e 1200px de altura) que **escale a interface** em vez de só esticar a casca: tamanho de fonte, espaçamentos, barra lateral, ícones e alvos crescem juntos, por tokens (`--fs-*`, `--sp-*` ou um fator na raiz), sem número solto nas telas.
- Rever o `--shell-max` para a faixa grande, para a casca não deixar faixas vazias enormes, mas também sem linhas de texto longas demais (o texto corrido continua com medida de leitura confortável).
- No Portão, a Ficha e as Conquistas ganham proporção da tela (hoje ficam presas a uma coluna fixa). Os três pergaminhos de modo e a pintura do Monte Hokage dividem a altura.
- Nas telas com palco (roda, mapa, luta), o palco e os painéis laterais crescem juntos, e a roda acompanha a altura, como já faz.
- Seguir o [visual.md](../visual.md) e o `DESIGN.md`: só tokens (`var(--...)`), chanfro em `::before`/`::after`, ícones do `ICONS`, sem emoji.

**Não mexer:**
- Ids, `data-*` e as classes que o TS consulta (`.primary`, `.jf`, `.sticky-cta`, `.mode-card`, `[data-nav]`, `#side-nav`, `#gate-nav`, `.gate`, `.jmodes` e as demais): são contrato.
- A escolha da perspectiva da História (`.jcampaigns`) e a preparação da Campanha (`.jpath`) mudam de estrutura na Tarefa 3 (`feature/historia-campanha`), do Claude. Ficam de fora desta tarefa e ganham o acabamento delas, inclusive o 4K, depois que ela entrar.
- Arquivos TS, imagens e regras do jogo.

## Fora do escopo

Celular, tablet e desktop até 1920 px; telas de entrada da História e da Campanha; arte nova; qualquer regra ou número do jogo.

## Decisões para o usuário

- O valor do `--shell-max` (o doc diz 2240px e o token, 1920px): o Codex propõe, com as fotos, e registra em `docs/registro.md`.

## Achados

(preenchido durante o trabalho)
