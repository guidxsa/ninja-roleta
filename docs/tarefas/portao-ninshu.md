---
objetivo: Compor o Portão da Vila para celular, tablet e desktop, com três modos de acesso direto, Ficha visível e Registro navegável por seção e modo.
escopo: ["docs/tarefas/portao-ninshu.md", "public/img/cenas/portao.webp", "public/img/cenas/modo-roleta.webp", "public/img/cenas/modo-jornada.webp", "public/img/cenas/modo-caminho.webp", "prototype/art.ts", "prototype/gate.ts", "prototype/registry.ts", "prototype/jornada/relics.ts", "prototype/modeCard.ts", "prototype/main.ts", "prototype/jornada/index.ts", "prototype/shell.ts", "prototype/index.html", "prototype/styles/tokens.css", "prototype/styles/base.css", "prototype/styles/a11y.css", "prototype/styles/menu.css", "prototype/styles/profile.css", "prototype/styles/shell.css", "prototype/styles/shinobi/base.css", "prototype/styles/shinobi/entradas.css", "prototype/styles/shinobi/detalhes.css", "prototype/lab/lab.html", "prototype/lab/scenarios/gate.ts", "prototype/lab/scenarios/meta.ts", "prototype/lab/fixtures/jornada.ts", "tests/uilab.test.ts", "src/data/strings/ptBR.ts", "src/data/strings/jornada.ts", "docs/visual.md", "DESIGN.md", "docs/ui-lab/SCREEN_INVENTORY.md", "changelog.d/portao-ninshu.md"]
fora: ["src/core/**", "src/state/**", "src/sim/**", "src/data/**/balance*.ts", "src/data/balance*.ts", "prototype/roleta/**", "prototype/jornada/battle.ts", "public/img/portraits/**", "public/img/ninja/**", "package.json", "package-lock.json", "CHANGELOG.md", ".github/**", "plano-codex-telas.md", "prompts-codex-telas.md", "correcao-pr46.md"]
pronto: ["npm run check verde", "UI Lab em 360, 390, 768, 1024 e 1440 px com uma captura legível por largura fora do repositório", "em 1024×768 cena, cards e Ficha visíveis sem rolar", "Portão → cada modo → uma luta → voltar ao Portão", "Registro por seção e Histórico por modo, com perfil vazio e cheio", "F5 com canon ou generic oferece Continuar no card e na aba corretos e retoma a parada salva", "galeria do Lab com todos os recortes sobre papel", "barra superior acessível por mouse, toque e teclado", "docs e fragmento no commit de implementação no PR #46 para staging, sem Co-Authored-By", "disposição conferida pelo usuário no UI Lab"]
agente: codex
revisor: claude
---

# Portão da Vila e Registro do ninja

## Pedido

Quem chega ao Portão escolhe Arcade, História ou Campanha em um toque. Quem volta com uma Jornada salva pode continuá-la tanto pelo pergaminho do modo quanto pela aba correspondente do Histórico. A Ficha mostra quem está jogando em qualquer largura. O Registro reúne histórico e coleções em páginas da área principal.

## Contexto

A primeira versão da Tarefa 2 está no [PR #46](https://github.com/guidxsa/ninja-roleta/pull/46), na branch `feature/portao-ninshu`, com base em `staging`. Na revisão pelo UI Lab, o usuário encontrou cards baixos e espaço ocioso em 768 px, colunas apertadas em 1024 px, a Ficha ausente no celular e edição de identidade repetida nas seções do Registro. A referência visual é a composição do Portão “Ninja Roleta”. O letreiro do jogo continua **Ninshu Roots**. Orientam a entrega as [regras do projeto](../../AGENTS.md), a [direção visual](../visual.md), o [design system](../../DESIGN.md) e o [fluxo de entrega](../processo/fluxo.md).

## Plano

1. Levar a vila azul e grafite de `SCENE_ART.portao` de ponta a ponta no topo da área principal, com o letreiro em pincel sobre a cena e os telhados se dissolvendo no grafite. A citação aparece uma vez, em `#quote-strip`. Aproximar os três pergaminhos da base da cena, com leve sobreposição onde as peças são contíguas e rolos `.scroll-roll` em cima e embaixo.
2. Substituir as três artes de modo por ilustrações originais monocromáticas sobre o próprio papel. Arcade usa uma barraca de feira com roleta em violeta. História usa portão, pergaminho e mapa em laranja. Campanha usa uma rota ramificada com estrada ou acampamento em azul ou verde. As três cenas são desabitadas. Preservar as chaves de `SCENE_ART` e os fallbacks SVG. Conferir a fusão e a leitura da arte em 360 e 1440 px.
3. Compor cada faixa conforme a tabela. A barra superior recolhida continua acessível por aproximação do mouse na borda, toque na alça e foco de teclado.

| Largura | Composição do Portão |
|---|---|
| Abaixo de 768 px | Cena, Ficha compacta e três pergaminhos empilhados, com arte acima do texto. Navegação inferior com Início, Arcade, História, Campanha e Registro. Conquistas acessíveis pelo Registro. |
| 768 a 1023 px | Cena larga, Ficha e Conquistas lado a lado e três pergaminhos verticais em colunas de mesma altura. A composição ocupa a altura disponível e usa a navegação inferior. |
| A partir de 1024 px | Lateral fixa, cena e três pergaminhos no centro, Ficha e Conquistas à direita. Em 1024×768, cena, cards e Ficha cabem sem rolar. Em 1440 px, conferir as proporções contra a referência. |

4. Na Ficha compacta, mostrar avatar, nome, runs e vitórias do Arcade e recorde da Campanha. Tocar na faixa expande o “Registro do ninja” do `<details>` de `profileCard()`. Concentrar a edição de nome e avatar na Ficha e usar o mesmo token de papel em todos os retratos. Refazer apenas `AVATAR_CUTS.naruto` rente ao cabelo, à ponta da faixa e aos ombros. Conferir todos os recortes sobre papel no cenário **Ficha com cada avatar**, inclusive os espaços entre as pontas do cabelo de Naruto.
5. Preservar as entradas diretas em `nav.gate-modes`: Arcade (`roleta`) abre o sorteio de origem, História (`story`) abre a perspectiva, Campanha (`path`) abre a preparação de classe e elemento. Voltar retorna ao Portão. A retomada usa o save existente e fica no card do modo. Nova partida preserva a confirmação de substituição. O progresso da Jornada fica fora do Portão.
6. Na lateral, oferecer Início, Arcade, História e Campanha, depois um divisor e Histórico, Livro Bingo, Relíquias e Conquistas. Usar ícones de casa, roleta, pergaminho, kunai ou rota, relógio, livro, baú e troféu de `ICONS`, em traço 24×24 e `currentColor`. Marcar o destino ativo com `aria-current`. Preservar os alvos de toque de 44 px e a área segura inferior.
7. Abrir as quatro seções do Registro na área principal. No celular, mostrar as quatro abas no topo da página. Voltar ou Início retorna ao Portão. Remover `openRegistryMenu()`, o popup de escolha e a faixa de edição `.reg-id`. Preservar o destino de `openProfile()`, `#history-btn`, `[data-profile]` e “Ver todas” em Conquistas. O escopo de `prototype/jornada/relics.ts` limita-se a adaptar a coleção para renderizar fora do modal, se necessário.
8. Organizar o Histórico em três abas, com estado vazio em PT-BR para cada uma. Arcade reutiliza `historyTab`, `originsTab` e `difficultyStats` nos filtros Geral, Origens e Dificuldade. História mostra parada, estágio e **Continuar** para save `canon` e as conquistas de História. Campanha mostra o recorde de `ses.profile.jornada.generic`, o save `generic` com **Continuar** e as conquistas de Campanha. Se o catálogo só distinguir Jornada, exibir as conquistas comuns nas duas abas e registrar essa limitação em issue, após verificar duplicatas.

## Verificação e entrega

- Atualizar os cenários do Portão em `prototype/lab/scenarios/gate.ts` (perfis vazio, médio e cheio, com e sem save, incluindo canon e generic, modo Animado e todos os avatares). Em `prototype/lab/scenarios/meta.ts`, cobrir cada seção do Registro e cada aba do Histórico com perfil vazio e cheio, incluindo os filtros do Arcade.
- Gerar o Lab com `npm run lab` e conferir 360, 390, 768, 1024 e 1440 px. Verificar leitura, recorte, foco, toque, movimento reduzido, acesso ao último controle e ausência de rolagem horizontal. Se algum sorteio quebrar, rodar `npm run lab:seed -- --all`.
- No protótipo, entrar nos três modos, jogar uma luta e voltar. Abrir cada seção pela lateral e retornar por Início. No celular, entrar por Registro e percorrer as abas. Recarregar com F5 após salvar em História e Campanha e retomar pelo card e pelo Histórico, conferindo modo e parada. Testar também perfil sem run e cancelamento da substituição.
- Salvar uma captura legível por largura fora do repositório. Anexar ao PR quando possível ou indicar os caminhos no resumo. Usar arquivos de imagem, sem base64 no PR.
- Atualizar `docs/visual.md`, `DESIGN.md`, `docs/ui-lab/SCREEN_INVENTORY.md` e `changelog.d/portao-ninshu.md` no mesmo commit da implementação. Rodar `npm run check` e enviar à mesma branch do PR #46, com revisão cruzada do Claude e conferência da disposição pelo usuário no Lab.

## Fora do escopo

A tarefa é de apresentação. Preservar mecânicas, balanceamento, arquivos de retrato, IDs internos, seletores usados pelo TypeScript e chaves de save, inclusive `runs_v1`, `profile_v1`, `jornada_run_v1` e `proto_settings_v1`. Ler apenas dados de jogo existentes. Usar tokens por `var(--...)`, chanfros em pseudoelementos e detalhes de botões em `tip()`. As entradas internas da História e da Campanha, o seletor de dificuldade e o lobby do Arcade pertencem às outras tarefas do plano. Os arquivos locais de plano, prompts e correção ficam fora dos commits.

## Decisões para o usuário

A correção amplia o escopo da aprovação original para incluir o Registro, as artes de modo e o recorte de Naruto. O usuário aprova este contrato antes do código e reaplica a etiqueta `contrato-aprovado` no PR para esta revisão. A avaliação da disposição final acontece no UI Lab.

## Achados

Registrar no PR e no resumo a issue de cada achado fora do escopo, conforme as [regras de triagem](../processo/issues.md).
