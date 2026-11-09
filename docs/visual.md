# Direção visual

O jogo deve parecer parte do universo de Naruto, e não um site com tema de Naruto. O critério de qualidade: **quem conhece a obra, ao abrir o jogo, sente que está navegando pelo mundo shinobi?** As regras técnicas de estilo (tokens, ícones, chanfro) estão no `CLAUDE.md`, seção Interface. O visual nunca muda regra, fórmula ou balanceamento.

## Princípios

- **O mundo reconhecível mesmo sem personagens**: vilas, clãs, selos, pergaminhos, mapas, kanji e caligrafia.
- **Objetos do universo no lugar de componentes genéricos**: fichas, pergaminhos, carimbos, placas de madeira, etiquetas de arquivo e cartas de mapa, em vez de cards, gradientes modernos e sombras difusas.
- **Coerência**: cada tela usa poucas referências, ligadas ao que acontece nela, e não uma coleção de referências soltas.
- **Função primeiro**: legibilidade, toque e layout de celular não cedem à ambientação.

## Cores

A paleta é a de sempre: temas **Sumi** (escuro) e **Pergaminho** (claro), com o botão dia/noite; sem escolha, o jogo segue o aparelho. Vermelho é ação e perigo, dourado é conquista. As três cores da v0.55.0 (Verde, Laranja e Marrom) saíram na v0.56.0, a pedido do usuário.

- `--primary` (ação e navegação) existe separado de `--accent` (perigo, chefe, carimbo), mas hoje aponta para o mesmo vermelho.
- **Peças com cor fixa**, por serem objetos do mundo: a barraca da roda, a carta do mapa, os cenários, os cards de modo e a barra inferior do Portão.

## Linguagem das referências

Referências do usuário (07/11/2026): o painel do Project Rasengan, o logo de Shadow Rising e dois mockups "Jornada Naruto" (desktop e celular). O que veio delas, em `prototype/styles/ornaments.css`:

- **Pergaminho de borda rasgada** (`.parchment`): papel com grão, manchas e borda queimada sobre o fundo; os tons de texto dentro dele são sempre os escuros do papel, nos dois temas.
- **Nuvens em espiral** (`cloud()` em `prototype/art.ts`), como ornamento.
- **Faixa de pergaminho** com rolos (`.scroll-banner`).
- **Letra manuscrita** (`--font-hand`, Kalam) em títulos de painel, citação e nome dos modos; letreiros seguem em pincel (`--font-display`).
- **Cards de modo com arte**: Jornada em laranja com a Folha, Roleta em roxo com a espiral.

## Identidade por modo

| | Roleta | Jornada |
|---|---|---|
| Sensação | Sorte, expectativa, recompensa, ritmo | Aventura, estratégia, exploração, equipe |
| Peça central | Barraca de festival da roda | Carta do mapa, trilha com o local e cenários |

## Telas no estilo novo

- **Portão da Vila**: logo com nuvens, destaque (ilustração ou Konoha), citação sorteada em pergaminho, cards Jornada e Roleta, faixa de Conquistas e **barra inferior** com o Registro ninja (Início, Histórico, Livro Bingo, Relíquias, Origens), que só aparece no Portão.
- **Casca do PC** (pedido do usuário, a partir de uma referência de composição): **barra lateral** persistente em todas as telas (Início, Jornada, Roleta; Histórico, Livro Bingo, Relíquias, Conquistas); o **Início** em painéis, com o destaque (imagem `portao`, logo e citação) e os dois modos lado a lado no centro e, à direita, a **Ficha do ninja** (nome, avatar padrão e números do perfil), o **Progresso da Jornada** (o botão continua a run direto) e as **Conquistas recentes**; o **Registro abre em popup** em qualquer tela e em qualquer entrada (barra lateral, botão Registro, barra do Portão no celular), uma seção por vez, num pergaminho vertical com rolos; o Histórico filtra por Geral, Origens e Dificuldade; a janela antiga de abas saiu (pedido do usuário: um padrão só); no pé, a **faixa de frases** sorteadas. O Portão "Vila com placas" foi tentado antes e rejeitado. **Direção de arte** (pedido do usuário: "menos caixas, mais composição"): a ilustração do destaque é a cena, sem moldura, com a borda dissolvida em tinta; os modos são pergaminhos desenrolados com rolos de madeira que sobem sobre ela, com a arte saindo do papel, um selo (道, 運) costurando imagem e texto e a ação numa pincelada vermelha; a coluna direita é uma pilha de pergaminhos levemente desalinhados, presa por uma kunai, com selo, títulos sublinhados a pincel, miniatura colada torta e o avatar num medalhão; o papel dos pergaminhos do Início é envelhecido (mais quente, queimado nas bordas, com manchas e tinta mais escura); as pinceladas têm falhas de cerda. **Vagas de textura** em `public/img/ui/` (`papel`, `madeira`, `pincel`, `fundo`): cada imagem que existir entra no lugar do desenho do CSS. Se o PC agradar, o usuário pretende levar essa linguagem ao celular.
- **Entrada da Jornada**: banner com a chamada, card **Progresso da Jornada** (capítulo, parada, miniatura, % de conclusão e o botão Continuar), painéis em pergaminho e **Conquistas recentes** (as 3 mais novas do perfil).

## Vagas de ilustração

O jogador pode pôr ilustrações em `public/img/cenas/` ([instruções](../public/img/LEIAME.md)). Sem a imagem, vale o desenho próprio. Hoje as vagas têm **imagens provisórias** (`.svg` com o nome do arquivo escrito), para ver o efeito: troque por uma imagem com o mesmo nome e apague o `.svg`. Cada vaga aceita também um **vídeo curto em loop** (`.webm` ou `.mp4`, sem som) com o mesmo nome: o botão **Animado** da barra superior (só aparece quando há vídeo) troca entre o modo **Leve**, com a imagem parada e padrão, e o animado; com `prefers-reduced-motion`, sempre a imagem.

**Proporção**: cada vaga respeita a proporção da imagem (o jogo mede a arte ao carregar e põe `--ratio` no contêiner). Corte, só nas bordas que se dissolvem em tinta, ou quando a arte é mais alta que o espaço; o enquadramento fica numa variável por vaga (`--pos-*`, `--arc-pos`).

O código pede a arte por **chave**, e um mapa único (`SCENE_ART` em `prototype/art.ts`) liga a chave ao arquivo. É o único lugar com nome de arquivo: trocar uma arte é trocar o arquivo, ou uma linha do mapa. Sem entrada no mapa, a chave é o próprio nome do arquivo.

| Chave | Arquivo hoje | Onde | Sem a imagem |
|---|---|---|---|
| `portao-dia`, `portao-noite` | `dia`, `noite` | Destaque do Portão (dualidade, abaixo) | `portao`, e depois a cena de Konoha |
| `jornada` | `jornada` | Banner da entrada da Jornada | Cena de Konoha |
| `modo-jornada`, `modo-roleta` | os mesmos | Arte dos cards de modo | Emblema em aquarela |
| `arco-waves`, `arco-exam`, `arco-sannin`, `arco-retrieval` | `waves`, `chunnin`, `sannin`, `sasuke` (a equipe do resgate) | Faixa de arcos da História e miniatura do card de progresso | Cenário do estágio |
| `g1`, `g2`, `g3` | os mesmos | Miniatura do Caminho Ninja | Cenário do estágio |
| `roleta` | (vazia) | Palco do sorteio da origem no PC | Cenário desenhado de Konoha |
| `roleta-genin`, `roleta-chunin`, `roleta-jounin`, `roleta-boss` | `roleta-genin`, `roleta-chunin`, `roleta-jounin`, `roleta-chefe` (vazias) | Roleta no PC: painel do mapa do ciclo, palco das roletas e fundo da arena da luta, pela categoria da luta atual | Cenário desenhado: Konoha, arena, floresta, Vale do Fim |
| `modo-caminho` | `caminho-ninja` (o Minato) | Card e pôster do Caminho Ninja | Retrato do ninja comum no card; a arte `jornada` no pôster |

`sasuke2` (Itachi e Sasuke) está reservada para a campanha do Sasuke ([historia-sasuke.md](jornada/historia-sasuke.md)).

### Dualidade Naruto e Sasuke

A dualidade é o eixo da identidade. O Portão mostra **o Naruto observando Konoha de dia** e **o Sasuke à noite**, conforme o tema: o claro (Pergaminho) é o dia e o escuro (Sumi), a noite.

- As duas versões ficam montadas (`.duo-day` e `.duo-night`) e o CSS por `data-theme` troca devagar (`--dur-dawn`), como um amanhecer. A cena do dia fica sempre opaca por baixo e só a da noite entra e sai por cima: nenhum quadro da troca fica sem imagem (o desenho de Konoha do fundo só aparece quando não há arte).
- Junto da cena mudam a frase (falas do personagem da vez), o selo 陽/影 e a legenda "Naruto/Sasuke observa Konoha". Não é só um papel de parede.
- Os dois estão em lados opostos da arte (o Naruto à direita, o Sasuke à esquerda): um espelha o outro. O enquadramento fica em `--pos-day` e `--pos-night`.
- Leitura: o logo do PC fica claro com sombra nos dois temas, e há uma sombra de tinta no canto do logo.
- Nenhum dos dois é o lado "bom". As falas mostram o que move cada um.
- Animado: `dia.webm` e `noite.webm` viram as versões em vídeo sem mudar código.

### Roleta no PC

O Roleta tem composição própria no PC (`prototype/styles/roleta-desk.css`), nos moldes da Jornada, e cabe na janela; no celular nada muda.
- **Sorteio da origem**: a roda no centro, sobre a arte `roleta`; com os resultados, a roda some e entram as opções centradas (a Ficha à esquerda; a Dificuldade, o Re-rolar e o Começar à direita). O botão Ficha da barra só aparece depois das roletas, para não entregar a classe.
- **Outras telas de roleta** (evento, recompensa, nível, melhoria, aviso: `.rwheel`): a roda sozinha no centro, sobre a arte da vaga, sem a Ficha. Durante as roletas, o nome do evento fica como etiqueta no alto do palco; no fim, o resultado e as mudanças aparecem num popup sobre o palco, com **Ficha** (abre a janela) e a ação.
- **Mapa do ciclo** (`.rmap`), em duas colunas: à esquerda, a **Ficha aberta em painéis minimizáveis** (ficha e atributos, relíquias e bolsa, técnicas, passivas), como os da Jornada; à direita, o título, a trilha e a cena da categoria com o **vilão por cima** da arte, e o Lutar embaixo.
- **Trilha** (PC e celular): cada etapa tem duas linhas, o **Evento** pré-luta (dado, etiqueta dourada; depois de acontecer, o nome) e o **Confronto** (marco, rosto, categoria e vilão; etiqueta vermelha). Etapa vencida expande e mostra o que deu (XP, status, nível, itens, relíquia do baú), pelo registro da run.
- **Luta** (`.rb-desk`): o layout da luta da Jornada. A arte da categoria é o fundo da luta; no centro, o vilão em cima, a arena (faixas de iniciativa e de acerto) no meio e você embaixo, sem caixa; à esquerda, a ficha do vilão (atributos, passivas, técnicas) e o registro da luta; à direita, as ações. Até 1279px, duas colunas (o campo e as ações; a ficha e o registro embaixo do campo).
- **Mapa**: o botão principal é "Seguir: evento pré-luta" até o evento acontecer, depois "Lutar"; embaixo, **Abandonar run** em cor de perigo (também no pé das ações da luta). O vilão fica no meio da cena.
- **Cores**: no tema claro o dourado (`--gold`, `--gold-2`) é escuro o bastante para o papel; a Ficha aberta do mapa usa o papel da janela da ficha nos dois temas.
- **Fim da run**: à esquerda, um pergaminho com o selo e o carimbo 勝/敗, o título e os números; à direita, a trilha (com o que cada etapa deu) e a Ficha resumida; as ações embaixo.

### Entrada da Jornada

A entrada da Jornada usa a **composição do Início** (a mesma casca `.gate`, com o modificador `.jgate`):
- destaque com a arte `jornada`, o título "Modo Jornada" no lugar do logo e uma frase em pergaminho;
- dois cards-pergaminho sobre a cena: **Modo História** (selo 史, arte em leque com os quatro arcos) e **Caminho Ninja** (selo 道);
- à direita, Progresso da Jornada (Continuar direto), Dificuldade e Conquistas recentes. No celular, a pilha: destaque, progresso, modos, dificuldade e conquistas.

Cada card abre a sua tela:
- **Modo História → Escolha a perspectiva**: dois pôsteres lado a lado, o Naruto de dia (arte `portao-dia`, os arcos e o Começar) e o Sasuke à noite (arte `portao-noite`, papel frio, travado: "Em breve"). As perspectivas vêm das campanhas (`data.campaigns`); a do Sasuke destrava quando os dados dela existirem.
- **Caminho Ninja → Preparar**: o pôster com os três estágios e, ao lado, classe, elemento e Começar.

### Arcos da Jornada

Na escolha da perspectiva, o painel do Naruto mostra os quatro arcos como **pergaminhos abertos**:
- a arte de cada arco recortada em retrato, com a borda de tinta no PC e o papel rasgado no celular;
- o número em selo (一 a 四) e o nome em letra de mão;
- o arco da run salva sobe com a moldura ("Você está aqui") e os anteriores desbotam ("Concluído");
- no celular, a faixa rola de lado e abre no arco atual.

O enquadramento de cada arte (onde estão os rostos) fica em `--arc-pos`, por arco, em `jornada.css`. Na run da História, o painel da trilha mostra a arte do arco atual no lugar do cenário desenhado: no PC, a metade direita do painel, com a borda de tinta, fundindo no papel, e a lista de paradas à esquerda; no celular, no alto do painel. Número e nome do arco vão em selo e letra de mão. Sem arte, volta o cenário do local. O combate continua com o local da parada.

## Locais

Cada parada da História pode ter um local (`scene` nos dados, `src/data/jornada/stages.ts`); sem ele, vale o cenário do estágio. A lista está em `src/data/jornada/scenes.ts` e o desenho em `prototype/styles/scenes.css`, em SVG próprio.

| Local | Situação | Paradas |
|---|---|---|
| Konoha: torre redonda e telhados | Feito | Naruto × Mizuki, Formatura, Teste do sino, Invasão, Hospital de Konoha, Naruto × Sasuke, O Sasuke foi embora; também o Portão da Vila |
| Floresta da Morte | Feito | Ninjas da Grama, Floresta da Morte, Trio da Chuva |
| Vale do Fim | Feito | Vale do Fim |
| Academia, Ponte das Ondas, Arena do Exame, Hospital, Tanzaku | A fazer | Depois da avaliação do piloto |

Na luta, o local fica no alto, atrás dos inimigos, e some antes dos botões. O mapa do Caminho Ninja é uma carta em papel com relevo por região (`--map-art`), rosa dos ventos e nós em forma de carimbo.

## Personagens

Decidido com o usuário: **a arte oficial é liberada nos retratos de personagens e, desde a v0.56.0, nas ilustrações das vagas acima**. Quem joga deve reconhecer a personagem pelas cores, roupas, acessórios e silhueta.

- Os arquivos entram em `public/img/` ([instruções](../public/img/LEIAME.md)) e são fornecidos pelo usuário. A lista dos primeiros está lá.
- Sem o arquivo, vale o desenho em SVG, então nenhuma tela depende de imagem.
- Os direitos dessas imagens são dos detentores e não entram na licença MIT do código. A arte é retirada se houver pedido.
- Cenários desenhados, ícones e demais ornamentos seguem em desenho próprio. **Símbolos da obra** (liberados pelo usuário): a folha de Konoha, a Névoa, a Areia e o Som (nas bandanas e no `ICONS`), o leque Uchiha, o redemoinho Uzumaki e as presas Inuzuka seguem o desenho da obra, em SVG no `art.ts`. Hyuuga, Nara, Akimichi, Yamanaka, Aburame e Senju ainda são desenhos próprios, à espera de referência do usuário.
- **Nada de rostos desenhados nos cenários**: o Monumento dos Hokages foi tentado na v0.54.0 e saiu na v0.55.0, a pedido do usuário, porque ficou ruim.

## Celular e desktop

Decidido com o usuário (07/11/2026): **celular e desktop são pares**. Compartilham regras, estado, mecânicas e identidade visual, mas cada um tem a sua composição. O desktop **compõe** a tela de outro jeito (colunas, painéis laterais fixos, menos rolagem) em vez de ampliar a do celular. Nenhuma regra muda com a largura: o layout é só CSS (Grid com `grid-template-areas`) e, quando falta um painel, HTML de apresentação, nunca lógica duplicada.

| Faixa | Largura | Composição |
|---|---|---|
| Celular | < 600px | Vertical, por prioridade; a base de todo arquivo de estilo |
| Tablet | 600–899px | A do celular, com mais folga |
| Notebook | ≥ 900px | Colunas e painéis laterais, até `--shell-max` (2240px) |
| Widescreen | ≥ 1280px | Mais uma região (equipe, campo e ações; contexto ao lado do mapa) |

A CSS não aceita `var()` em `@media`, então os números se repetem nas telas; a referência fica no topo de `prototype/styles/base.css`.

**Quanto menos rolagem, melhor** (pedido do usuário, v0.57.2). No desktop, trilha, mapa e luta cabem na janela pelo layout, não por um número: o corpo tem a altura da tela e a tela do jogo ocupa o que sobra entre a barra e o rodapé (flex). Só a trilha, a carta e as colunas rolam por dentro, e só se faltar altura. As medidas que pesam na altura acompanham a janela com `clamp(mín, Xvh, máx)`: faixa do cenário da trilha, espaço entre as paradas e retratos da luta. A carta do mapa estica até a coluna (nós em % de um campo interno com margem) e só rola abaixo de 48px por linha; no celular, 74px por linha, como sempre.

**Layout fluido** (v0.57.5): as peças crescem e se reorganizam com a janela, sem degraus fixos. As colunas laterais têm largura em `vw` com `clamp` (mínimo, proporção, máximo); as grades de botões usam `repeat(auto-fill, minmax(...))` e ganham colunas quando sobra largura (as técnicas da luta: 2 por linha no Full HD, 3 no 4K); retratos e espaços seguem `vw` e `vh`. O detalhe acompanha a altura: abaixo de 760px só o essencial, a partir de 880px a ficha completa.

Toda tela nova precisa das duas composições, conferidas nos tamanhos reais da área do navegador, sem rolagem horizontal e, no desktop, sem rolagem da página: 390×844 (celular), 1100×800, 1366×650 (notebook), 1536×730 (Full HD com escala de 125%), 1920×950 (Full HD) e 2560×1300 (4K com escala).

| Tela | Desktop | Situação |
|---|---|---|
| Combate da Jornada | Notebook: campo e ações em colunas, com o registro embaixo. Widescreen: campo clássico ao centro (inimigos em cima, equipe embaixo, o local cobrindo o fundo); à esquerda, a **ordem da rodada**, a **ficha dos inimigos** (HP e chakra, elemento, comportamento, contra o que é fraco e forte, passiva, estados e, a partir de 880px de altura, as técnicas com o dano) e o **registro recolhível** (fechado mostra 4 linhas; o toque abre); à direita, a **ficha da equipe** e as ações. As fichas acompanham cada golpe. Em janela baixa (≤ 760px) a ficha da equipe sai. O **Desistir da jornada** é um botão próprio em cor de perigo no pé das ações, em todos os tamanhos. A v0.57.0 pôs a equipe numa coluna e os inimigos ao centro; o usuário achou ruim e saiu na v0.57.1 | Feito (v0.57.5) |
| Trilha e mapa da Jornada | A tela cabe na janela e só a trilha, a carta e as colunas rolam por dentro. No topo do centro, o **título do estágio** ("Estágio n/t", o nome em letreiro e, no mapa, "Escolha o próximo destino"), com ciclo, dificuldade e o **Abandonar jornada** em cor de perigo, como o Desistir da luta (v0.57.7). Notebook: build e o que vem empilhados ao lado. Widescreen: **build** à esquerda (HUD e a loja aberta; o botão Loja some), trilha ou carta no centro e **o que vem** à direita (na trilha, a próxima parada com os inimigos, as seguintes e o Seguir; no mapa, o chefe, os caminhos abertos e o card **Sua run**), com a dica de jogo. A carta tem margem interna (nenhum símbolo toca a borda) e a **legenda fica embaixo** dela. No celular, título, HUD, (chefe,) trilha ou carta e legenda, nessa ordem | Feito (v0.57.3) |
| Entrada da Jornada e painéis minimizáveis | Entrada: título com o Voltar, banner baixo e, embaixo, três colunas (no notebook, duas): progresso e dificuldade; a História com as conquistas recentes embaixo; o Caminho Ninja. No celular, a pilha de sempre. **Painéis minimizáveis** no widescreen (botão no canto, a escolha fica no navegador): na trilha e no mapa, relíquias e bolsa, loja, próxima parada, caminhos abertos, sua run e dica; na luta, ordem da rodada e as fichas (o registro já recolhe; as ações nunca) | Feito (v0.57.6) |
| Portão e barra superior | Casca do PC (barra lateral, Início em painéis, páginas do Registro, faixa de frases) e a barra superior com o nome de cada ferramenta | Feito (aguardando aprovação do usuário) |
| Roleta, árvore de talentos, modais e minigames | Ainda na coluna de 520px (a árvore já mostra os ramos lado a lado) | A fazer |

## Situação

O piloto cobre o Portão da Vila e a entrada da Jornada no estilo novo (v0.56.0), e a trilha, o mapa e o sorteio do Roleta (v0.54.0). O que falta está em [decisoes.md](decisoes.md).
