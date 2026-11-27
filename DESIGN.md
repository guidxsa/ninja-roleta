---
name: Ninshu Roots
description: Mesa de escriba shinobi em papel, tinta e laca vermelha, com tema único escuro grafite.
colors:
  primary: "#b5161f"
  primary-bright: "#c92a31"
  primary-deep: "#5e0b10"
  primary-ink: "#f6ecd6"
  gold: "#b8954f"
  gold-bright: "#dcbd78"
  gold-deep: "#6e5428"
  sumi-bg: "#1a1918"
  sumi-bg-raised: "#24221f"
  sumi-surface: "#292725"
  sumi-surface-2: "#302d2a"
  sumi-surface-3: "#36332f"
  sumi-line: "#36332f"
  steel: "#8a919a"
  sumi-text: "#ece3d0"
  sumi-muted: "#afa79b"
  paper: "#e8dcc0"
  paper-deep: "#d4c39e"
  paper-ink: "#24190f"
  paper-muted: "#574632"
  wood: "#4a2f1c"
  hp: "#5f9a5c"
  hp-low: "#c4412c"
  chakra: "#3d6fc4"
  good: "#7fb476"
  bad: "#dc5a4f"
  jinchuuriki: "#e0682e"
typography:
  display:
    fontFamily: "Shojumaru, Impact, 'Arial Black', serif"
    fontSize: "clamp(28px, 6vw, 56px)"
    fontWeight: 400
    lineHeight: 1.05
  hand:
    fontFamily: "Kalam, 'Segoe Print', 'Comic Sans MS', cursive"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "'Zen Kaku Gothic New', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  hud:
    fontFamily: "'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "0.08em"
  kanji:
    fontFamily: "'Yuji Boku', 'Hiragino Mincho ProN', 'Yu Mincho', serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1
rounded:
  base: "2px"
spacing:
  gap: "12px"
  gap-lg: "clamp(14px, 1.6vw, 28px)"
  tap: "36px"
  tap-touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.hud}"
    rounded: "{rounded.base}"
    padding: "11px 14px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-bright}"
  button-primary-active:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "{colors.sumi-surface-2}"
    textColor: "{colors.sumi-text}"
    rounded: "{rounded.base}"
    padding: "11px 14px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.sumi-muted}"
    rounded: "{rounded.base}"
  panel:
    backgroundColor: "{colors.sumi-surface}"
    textColor: "{colors.sumi-text}"
    rounded: "{rounded.base}"
    padding: "12px"
  parchment:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    padding: "16px 16px 14px"
  chip:
    backgroundColor: "{colors.sumi-surface-3}"
    textColor: "{colors.sumi-text}"
    typography: "{typography.hud}"
    rounded: "{rounded.base}"
    padding: "1px 7px"
  seal:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    size: "40px"
---

# Design System: Ninshu Roots

## Overview

**Creative North Star: "A Mesa do Escriba Ninja"**

A interface é um conjunto de objetos de papel, tinta, madeira e laca pousados numa mesa: pergaminhos de borda rasgada, selos (hanko) carimbados, pinceladas, placas e cartas de mapa. Nada parece componente de site. Quem conhece a obra deve sentir que está navegando pelo mundo shinobi, mesmo sem nenhum personagem na tela.

O letreiro do Portão usa `--font-display` e a escala fluida `--fs-brand`, de 36 a 90 px nas faixas padrão e com teto de 162 px em monitores grandes. A folha de Konoha em traço marfim sobre um azulejo vermelho identifica Ninshu Roots. O fundo Sumi é grafite. Os pergaminhos usam tinta escura sobre papel envelhecido.

A voz é artesanal e ritual (cada ação tem gesto: carimbar, desenrolar, pingar tinta), tensa e contida (vermelho raro, dourado só para conquista) e direta e legível (toque grande, números claros, a ambientação nunca atrapalha a função). A exceção festiva é a roleta, que ganha cor e ritmo de barraca de festival contra o resto sóbrio. Celular e desktop são pares, cada um com composição própria.

**Key Characteristics:**
- Objetos do universo no lugar de cards, gradientes e sombras difusas.
- Cantos retos com chanfro como assinatura dos painéis.
- Vermelho laca para ação e perigo; dourado para conquista.
- Cada peça no seu espaço: arte preenche a célula e nunca vaza do papel.
- Movimento só explica gesto ou troca de estado.

## Colors

Paleta de tinta e papel: grafite quase preto, papel envelhecido, vermelho laca e dourado fosco, com poucas cores funcionais dessaturadas para viver nela.

### Primary
- **Vermelho Laca** (#b5161f): ação e navegação (botão principal, abas, progresso) e também perigo, chefe e carimbo. Hoje `--primary` e `--accent` apontam para o mesmo vermelho, mas ficam separados para poder divergir.
- **Laca Viva** (#c92a31): hover. **Laca Funda** (#5e0b10): pressionado e sombra dura dos letreiros. **Marfim de Carimbo** (#f6ecd6): texto sobre o vermelho.

### Secondary
- **Dourado Envelhecido** (#b8954f): conquista e destaque raro, filetes e foco. **Ouro Claro** (#dcbd78) para brilho; **Ouro Fundo** (#6e5428). No papel claro escurece para #7d5d1f, para ler.

### Neutral
- **Sumi** (#1a1918): fundo noturno; camadas de superfície em #24221f, #292725, #302d2a e #36332f; filete #36332f e aço #8a919a.
- **Texto Marfim** (#ece3d0) e **Cinza de Cinza** (#afa79b) para texto secundário.
- **Pergaminho** (#e8dcc0 / #d4c39e) com **Tinta de Papel** (#24190f) e #574632 para texto: dentro de `.parchment` os tons de texto são sempre os escuros do papel.
- **Madeira** (#4a2f1c) para rolos e placas.

### Functional
- Vida #5f9a5c, vida baixa #c4412c, chakra #3d6fc4, bom #7fb476, ruim #dc5a4f, jinchuuriki #e0682e. Tipos de técnica têm cor própria (taijutsu, ninjutsu, genjutsu, médico, especial).

### Named Rules
**The Lacquer Rarity Rule.** O vermelho é ação ou perigo, nunca decoração. Se tudo na tela é vermelho, nada é ação.

**The Tokens Only Rule.** Cor, fonte, duração e forma só por `var(--...)`. Cor solta existe apenas em arte: cenário, roda, cards de modo, barraca, carta do mapa e barra do Portão.

**Sumi.** Todas as telas usam o fundo grafite, inclusive quando o aparelho prefere a aparência clara.

## Typography

**Display Font:** Shojumaru (com Impact, Arial Black)
**Body Font:** Zen Kaku Gothic New (com system-ui)
**Label/HUD Font:** Barlow Condensed
**Hand Font:** Kalam
**Kanji Font:** Yuji Boku (recorte; kanji novo entra no recorte)

**Character:** pincel grande nos letreiros, caligrafia à mão nos títulos de pergaminho, e uma voz condensada de HUD para números e rótulos. O corpo é neutro e legível.

### Hierarchy
- **Display** (Shojumaru 400, escala fluida, 1.05): só letreiro grande, com sombra dura `2px 2px 0` em vermelho fundo.
- **Hand** (Kalam 700, 22 a 23px, 1.1): título de pergaminho, citação e nome dos modos.
- **Body** (Zen Kaku 400/700, 15px, 1.5): texto corrido.
- **HUD** (Barlow Condensed 600/700, 13 a 18px, caixa alta, +0.05 a +0.14em): números, rótulos, botão primário, chips, títulos de seção.
- **Kanji** (Yuji Boku, 64% do lado do selo): selos e carimbos, nunca texto corrido.

### Named Rules
**The One Brush Rule.** Pincel (display) só em letreiro grande. Texto de leitura nunca usa display nem hand.

## Layout

Celular e desktop são pares, cada um com composição própria. Celular: coluna vertical (largura útil até 520px, 860px em tablet), um toque por ação, botões grandes e CTA fixo no pé (`.sticky-cta`). Desktop (≥ 900 × 560 px): barra lateral persistente, painéis em colunas e `--shell-max` de 1920px. A partir de 1280 × 560 px, as telas de jogo podem abrir uma terceira região. Com menos de 620px de altura, a página rola.

Em monitores grandes (≥ 2200 × 1200 px), `--shell-max` sobe para 3600px. A unidade `--ui-unit` cresce de 1,1× a 1,8× segundo a largura e a altura úteis. Ela dimensiona os tokens `--fs-*`, `--sp-*`, a navegação, os alvos e as peças de jogo. A escolha da perspectiva da História e a preparação da Campanha usam a faixa Desktop.

O ritmo parte de `--gap` de 12px e usa `--gap-lg` fluido no desktop. Os alvos partem de 36px, ou 44px em ponteiro grosseiro, e crescem em monitores grandes.

**Cada peça no seu espaço.** A arte preenche a célula com foco nos rostos, sem moldura e sem vazar; peças não se sobrepõem nem cruzam bordas. A forma de cada imagem é lida no build e reservada, para nada pular ao carregar.

## Elevation & Depth

Profundidade vem de camadas de papel e do deslocamento, não de sombra difusa. Painéis são chapados com filete; pergaminhos têm sombra dura, o mesmo recorte rasgado deslocado (`translate(2px, 4px)`), e os vizinhos alternam o espelho do rasgo. Dicas usam sombra larga e escura só por serem flutuantes.

### Named Rules
**The Hard Shadow Rule.** Sombra é o próprio recorte deslocado ou um letreiro duro. Nada de sombra difusa genérica em painel.

## Shapes

Cantos retos (`--radius: 2px`) e **chanfro** (`--cut` 10px, 6px pequeno, 14px em janelas) como assinatura dos painéis. O recorte vive em `::before` e `::after`, nunca no elemento, para não cortar números flutuantes e o foco. Bordas de pergaminho são rasgadas e queimadas (polígono `--torn`). Selos são quadrados laqueados levemente tortos (-3°); o selo do clã é um losango. Etiquetas são retas, com cor só no filete e no ícone. Ícones são SVG 24×24 em `currentColor`, traço único, nunca emoji.

## Components

### Buttons
- **Shape:** reto com chanfro nos dois cantos opostos (10px) no primário.
- **Primary:** laca vermelha, HUD caixa alta 18px, filete dourado interno e base mais escura (inset), mínimo 48px (56px em `.big`). Foco: anel dourado por dentro, porque o chanfro cortaria o contorno.
- **Hover / Active:** laca viva no hover, laca funda e 1px para baixo no toque.
- **Secondary:** grafite com filete de aço; hover leva o filete ao dourado. Foco por contorno dourado de 2px.
- **Ghost:** transparente, mutado; hover sublinha em vermelho.
- **Segmentado** (`.seg`): dificuldade pinta o selecionado (folha, dourado, vermelho, tinta).
- **Regra:** botão tem ícone, nome e números principais; efeitos e bloqueios vão para a dica.

### Portão da Vila

O letreiro em pincel ocupa o céu à esquerda. A pintura da vila se dissolve no grafite, e os três pergaminhos se aproximam de sua base. Cada um tem rolos de madeira nas extremidades e uma ilustração em tinta sobre papel. A barraca de Arcade usa violeta, a História usa laranja e a estrada da Campanha usa verde. O card da História é o único com personagens: o Time 7 de costas olhando a vila (Naruto, Sasuke, Sakura e Kakashi), porque o modo segue os arcos canônicos do time; a descrição cita os arcos, do teste dos sinos ao Vale do Fim. O pergaminho inteiro abre o modo.

Abaixo de 768 px, a Ficha compacta fica entre a cena e os pergaminhos empilhados. De 768 a 1023 px, Ficha e Conquistas ficam lado a lado e cada modo ocupa uma coluna. A partir de 1024 px, a lateral fixa reúne os destinos e a coluna direita recebe Ficha e Conquistas. O avatar fica num quadro de tinta, com o fundo original do retrato, sobre o papel da Ficha (`--profile-paper`). A alça com a folha de Konoha abre as ferramentas por toque, foco ou aproximação do mouse.

Início, Registro e os modos usam a mesma largura de barra lateral, tamanho de marca e centro da alça de Konoha. Em janelas largas e baixas, a lateral permanece acessível com rolagem interna. Abaixo de 1024 px, a barra inferior acompanha o Início, o Registro e as entradas dos modos.

Em monitores grandes, a pintura do Monte Hokage ocupa a linha maior da grade e os três pergaminhos dividem a linha abaixo. A coluna de Ficha e Conquistas acompanha a largura útil, até 24% da casca.

O Registro ocupa a área principal. Em telas com barra inferior, quatro abas dão acesso às seções. Dentro do Histórico, o jogador escolhe Arcade, História ou Campanha. A ação **Continuar** fica junto da parada salva no modo correspondente. Cada run do Histórico é uma linha que abre os detalhes. No Livro Bingo, a ficha de cada inimigo é papel de cartaz com o fundo do arco e a moldura pelo grau (comum, elite e chefe com o carimbo 手配), em tela cheia no celular e num painel ao lado no desktop.

### História e Campanha

As telas de modo usam o letreiro em pincel sobre a arte. Os pergaminhos abaixo têm rolos de madeira, papel liso e ilustração com borda de tinta em uma área própria. A etiqueta de laca indica a ação disponível. Um contorno tracejado marca o **Em breve** do Sasuke. Desktop distribui o painel de arte e os pergaminhos no centro e o progresso, a dificuldade e as conquistas à direita. Celular empilha essas regiões na ordem do HTML.

A partir de 1024 px, o painel de arte tem as dimensões da cena do Início. Na Campanha, o leque de retratos de **Escolher a classe** contrasta com as silhuetas de tinta no papel de **Classe aleatória**. A interrogação identifica o sorteio e o selo com baú destaca a relíquia extra.

A perspectiva abre a janela mais larga. Os quatro arcos usam filete duplo dourado, moldura de laca, filete simples e contorno tracejado para expressar, respectivamente, concluído, atual, próximo e ainda não alcançado. A dica de arco usa papel e título manuscrito. No cardápio, as classes aparecem em uma lista de laca e a classe selecionada tem uma ficha de papel com retrato e descrição lado a lado. A janela reserva espaço para os elementos do Comum e conserva o tamanho ao trocar de classe. A janela de classe aleatória mostra os retratos em fileira e destaca a recompensa numa faixa de papel com o baú.

### Panels
- **Painel laqueado** (`.card`, `.panel`, `.chamfer`): grafite com grão, filete de aço desenhado pela camada de baixo, aba vermelha curta no topo marcando o dono. Padding 12px.
- **Pergaminho** (`.parchment`): papel com grão, manchas e borda queimada; título em Kalam. Botão primário dentro usa dourado claro.
- **Faixa de pergaminho** (`.scroll-banner`): rolos de madeira nas pontas, título em hand, selo à esquerda.

### Chips
Etiquetas retas em HUD 13px; cor só no filete e no ícone; variantes de bom, ruim, jinchuuriki, dificuldade e tier.

### Seal (Hanko)
Quadrado laqueado com kanji em pincel, torto como carimbo; variantes ouro e fantasma; entrada animada de carimbo.

### Tips
Tira de pergaminho clara com borda superior vermelha, título em HUD vermelho, sem cantos arredondados; abre por mouse, toque, foco por teclado e botão bloqueado.

### Roda (assinatura)
A roleta é a peça central do Roleta: barraca de festival de cor fixa, onde a identidade festiva vive. O resultado é lido pelo leitor de tela; com menos movimento, a roda para direto no resultado.

### Movimento
Responde a um gesto ou explica troca de estado. O carimbo (hanko 道) firma a escolha; pincelada liga cenas em sequência; a relíquia antiga se desfaz em tinta. Durações pelos tokens `--dur-*`; o conteúdo já nasce visível; com `prefers-reduced-motion` saem deslocamento e pincelada e ficam cor e opacidade.

## Do's and Don'ts

### Do:
- **Do** usar objetos do universo (pergaminho, selo, carimbo, placa, carta de mapa) no lugar de componentes genéricos.
- **Do** usar só tokens `var(--...)`.
- **Do** manter o chanfro em `::before`/`::after` e o foco por dentro quando o elemento é chanfrado.
- **Do** usar SVG de `ICONS` em `art.ts` (`icon(nome)`) para todo ícone.
- **Do** manter botões simples (ícone, nome, números) e levar regras e motivos de bloqueio para a dica.
- **Do** preservar ids, `data-*` e classes que o TS consulta (`.primary`, `.jf`, `.sticky-cta`); o visual não mexe nelas.
- **Do** garantir teclado, leitor de tela e `prefers-reduced-motion` em todo gesto novo.

### Don't:
- **Don't** usar emoji como ícone (exceção: o texto de compartilhar).
- **Don't** usar cantos arredondados, cards genéricos, gradientes modernos ou sombras difusas.
- **Don't** usar neon, glassmorphism ou estética de painel gamer/e-sports.
- **Don't** reintroduzir as cores Verde, Laranja e Marrom de tema (v0.55.0, retiradas na v0.56.0).
- **Don't** voltar ao Portão "Vila com placas", rejeitado.
- **Don't** sobrepor peças, deixar a arte vazar do papel ou cruzar a borda; cada peça fica no seu espaço.
- **Don't** usar o pincel (display) ou a manuscrita em texto de leitura.
- **Don't** pôr cor solta no CSS fora de arte, nem deixar o visual mudar regra, fórmula ou balanceamento.
- **Don't** depender de arte de terceiros: retratos são opcionais e o desenho em SVG próprio sempre fecha a tela.
