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
- **Entrada da Jornada**: banner com a chamada, card **Progresso da Jornada** (capítulo, parada, miniatura, % de conclusão e o botão Continuar), painéis em pergaminho e **Conquistas recentes** (as 3 mais novas do perfil).

## Vagas de ilustração

O jogador pode pôr ilustrações em `public/img/cenas/` ([instruções](../public/img/LEIAME.md)). Sem a imagem, vale o desenho próprio.

| Arquivo | Onde | Sem a imagem |
|---|---|---|
| `portao` | Destaque do Portão | Cena de Konoha |
| `jornada` | Banner da entrada da Jornada | Cena de Konoha |
| `modo-jornada`, `modo-roleta` | Arte dos cards de modo | Emblema em aquarela |
| `waves`, `exam`, `retrieval`, `g1`, `g2`, `g3` | Miniatura do capítulo no card de progresso | Cenário do estágio |

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
- Cenários desenhados, ícones e demais ornamentos seguem em desenho próprio. **Símbolos da obra liberados** (pedido do usuário, v0.57.4): a folha de Konoha, as vilas e os clãs (espiral Uzumaki, leque Uchiha...) podem seguir o desenho da obra, refeitos em SVG no `art.ts`; hoje ainda são versões simplificadas (a fazer, junto com o Portão).
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
| Portão e barra superior | Controles da barra superior e a navegação do Portão espalhados pela tela; as citações num lugar próprio | A fazer (etapa 4) |
| Roleta, árvore de talentos, modais e minigames | Ainda na coluna de 520px (a árvore já mostra os ramos lado a lado) | A fazer |

## Situação

O piloto cobre o Portão da Vila e a entrada da Jornada no estilo novo (v0.56.0), e a trilha, o mapa e o sorteio do Roleta (v0.54.0). O que falta está em [decisoes.md](decisoes.md).
