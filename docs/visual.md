# Direção visual

O jogo deve parecer parte do universo de Naruto, e não um site com tema de Naruto. O critério de qualidade: **quem conhece a obra, ao abrir o jogo, sente que está navegando pelo mundo shinobi?** As regras técnicas de estilo (tokens, ícones, chanfro) estão no `AGENTS.md`, seção Interface. O visual nunca muda regra, fórmula ou balanceamento.

## Princípios

- **O mundo reconhecível mesmo sem personagens**: vilas, clãs, selos, pergaminhos, mapas, kanji e caligrafia.
- **Objetos do universo no lugar de componentes genéricos**: fichas, pergaminhos, carimbos, placas de madeira, etiquetas de arquivo e cartas de mapa, em vez de cards, gradientes modernos e sombras difusas.
- **Coerência**: cada tela usa poucas referências, ligadas ao que acontece nela, e não uma coleção de referências soltas.
- **Função primeiro**: legibilidade, toque e layout de celular não cedem à ambientação. Teclado, leitor de tela e menos movimento também ([plataforma.md](base/plataforma.md#acessibilidade)).

## Cores

Ninshu Roots usa um único tema Sumi. O fundo vai do grafite `#1a1918` ao cinza `#24221f`. Vermelho marca ação e perigo, e dourado marca conquistas. O nome e a folha de Konoha em traço claro sobre azulejo vermelho identificam o jogo e o PWA.

- `--primary` (ação e navegação) existe separado de `--accent` (perigo, chefe, carimbo), mas hoje aponta para o mesmo vermelho.
- **Peças com cor fixa**, por serem objetos do mundo: a barraca da roda, a carta do mapa, os cenários, os cards de modo e a barra inferior do Portão.

## Linguagem das referências

Referências do usuário (07/11/2026): o painel do Project Rasengan, o logo de Shadow Rising e dois mockups "Jornada Naruto" (desktop e celular). O que veio delas, em `prototype/styles/ornaments.css`:

- **Pergaminho de borda rasgada** (`.parchment`): papel com grão, manchas e borda queimada sobre o fundo; os tons de texto dentro dele são sempre os escuros do papel.
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

- **Portão da Vila.** O letreiro Ninshu Roots ocupa o céu da vila. Na base da pintura, três pergaminhos ilustrados abrem Arcade, História e Campanha. Cada pergaminho é um único controle. A retomada de uma Jornada salva fica na aba do modo no Histórico.
- **Celular, abaixo de 768 px.** Sob a cena, a Ficha compacta mostra avatar, nome, runs e vitórias do Arcade e recorde da Campanha. Um toque expande o Registro do ninja com os números do perfil. Os pergaminhos se empilham com a arte acima do texto. A navegação inferior reúne Início, Arcade, História, Campanha e Registro. Cada alvo tem pelo menos 44 px.
- **Tablet, de 768 a 1023 px.** Sob a cena larga, Ficha e Conquistas dividem uma linha. Os três pergaminhos ocupam colunas de mesma altura. A navegação segue no rodapé.
- **Desktop, a partir de 1024 px.** A lateral fixa dá acesso aos modos e às quatro seções do Registro. Cena e pergaminhos ocupam o centro. Ficha e Conquistas ficam à direita. A citação aparece em `#quote-strip`.
- **Navegação compartilhada.** No desktop, a lateral, a marca e a alça de Konoha conservam largura, tamanho e alinhamento entre o Início, o Registro e os modos. A lateral fica disponível em janelas largas e baixas a partir de 1024 px e rola por dentro se faltar altura. Em larguras menores, Início, Registro e entradas dos modos usam a barra inferior.
- **Registro.** Histórico, Livro Bingo, Relíquias e Conquistas abrem na área principal. No celular e no tablet, as seções também têm abas no topo. No Histórico, Arcade oferece os filtros Geral, Origens e Dificuldade. História e Campanha mostram o save correspondente, as runs terminadas e as conquistas da Jornada. Campanha inclui seu recorde. Cada run é uma linha-botão (`aria-expanded`): o símbolo da origem ou da classe com o ícone do modo no canto, o nome, a data e até onde foi, os chips de dificuldade e resultado e uma seta. Aberta, mostra os detalhes numa lista de rótulo e valor e, no Arcade, os vilões em ordem com o retrato e a marca de vitória ou derrota. Mais de uma linha pode ficar aberta, para comparar. A run de antes do histórico detalhado mostra o que tem e a nota "detalhes não registrados". Voltar e Início retornam ao Portão.
- **Livro Bingo** (`prototype/bingoSheet.ts`). Três seções (Arcade, História e Campanha) num seletor segmentado; dentro, um grupo por categoria, arco ou estágio, com quantos já foram vistos. O inimigo visto é uma linha-botão que abre a **ficha**; o que nunca apareceu fica na sombra, com 謎. A ficha é papel de cartaz: o fundo vem do arco (lote 2: `bingo-ondas`, `bingo-exame`, `bingo-sannin`, `bingo-resgate` e `bingo-arcade`; a Campanha usa o arco equivalente) com o miolo liso para a leitura, e enquanto a imagem não existe, uma vinheta da cor do arco. A moldura sobe de grau: comum com filete simples, elite com filete duplo dourado e chefe com borda vermelha grossa e o carimbo 手配 (procurado) sobre o canto do retrato. No celular e no tablet a ficha cobre a tela (janela: voltar, Esc e o voltar do navegador fecham); a partir de 1024 px, abre num painel ao lado da lista, que acompanha a rolagem.
- **Voltar e Esc** (`prototype/back.ts`). Esc fecha a camada de cima, nesta ordem: a dica, o campo em edição, a janela e a página (Registro, ou a tela com botão de voltar, como as entradas da História e da Campanha). O botão voltar do navegador (e do Android) faz o mesmo: cada janela e o Registro inteiro põem uma entrada no histórico (trocar de aba não empilha). No Portão, o voltar sai da página, sem armadilha. Dentro da partida, o Esc não tira o jogador da luta e o voltar pede a mesma confirmação do botão do Portão.
- **Ficha.** Avatar e nome no topo, sempre à vista, cada um com o lápis de editar ([perfil.md](base/perfil.md#avatar)). O nome fica numa linha só e encolhe com a coluna; as linhas de números quebram só entre o rótulo e o valor. O avatar mostra o retrato com o fundo original da arte, num quadro de tinta com sombra dura, como os retratos do Livro Bingo. Na escolha, o avatar bloqueado aparece em silhueta (o retrato sem recorte usa a silhueta genérica de cabeça e ombros).
- **Ferramentas.** A alça de Konoha abre a barra superior por toque, foco do teclado ou aproximação do mouse à borda superior. Os controles permanecem acessíveis enquanto recebem foco. A barra recolhe ao sair, tocar fora, tocar novamente na alça ou usar Escape. Com movimento reduzido a mudança é imediata.

### Composição Shinobi nas telas jogáveis

- Na barraca de linhagem, os emblemas aparecem na roda e na legenda, junto do nome e da chance. Tocar no emblema da legenda destaca a fatia. Na vitória, a relíquia sorteada ganha um cartão junto da roda, com acesso à Ficha e à próxima parada.
- No mapa do Caminho Ninja, os botões abaixo da carta correspondem aos nós acessíveis. Quando dois destinos têm o mesmo tipo, o número de rota liga cada botão ao seu nó. No celular, vida, chakra e ryō ficam à vista com um botão para expandir a ficha.
- O Time 7 abre com a faixa do capítulo, Kakashi no telhado e as escolhas no pergaminho. Na batalha da ponte, as artes dos combatentes carregam na abertura. O campo acompanha mudanças de forma e de equipe, e as ações seguem o estado do turno.
- Na árvore de talentos, a paisagem e o símbolo acompanham a classe e o ramo. No desktop largo, as abas escolhem o ramo da carta à esquerda, com nome, efeito e custo do talento à direita. No celular, o detalhe fica no rodapé.


## Três materiais

Regra de quando usar cada superfície (auditoria de design, v0.72.0). O jogo tinha duas linguagens, o mundo fora da run e o painel grafite dentro dela; a regra abaixo fecha essa fronteira.

| Material | Papel | Onde |
|---|---|---|
| **Papel** (pergaminho, tinta escura, selo) | história, decisão e recompensa | evento, fala, lição, vitória, relíquia, fim de run |
| **Noite** (fundo de tinta, cenário em nanquim) | o palco onde as coisas acontecem | combate, mapa, trilha, o quadro das cenas |
| **Laca** (grafite chanfrado, filete dourado) | ferramenta e navegação | HUD, barra lateral, menus de ação, dicas |

O card grafite não carrega história: é ferramenta.

## Cena narrativa

Um componente só (`prototype/jornada/scene.ts`, `styles/jornada-scene.css`) para evento, vitória, lição, estágio concluído, ciclo e relíquia ganha:

- **Quadro**: o local da parada como requadro de mangá (margem grossa de tinta, o cenário em nanquim) e **quem está em cena** no canto, com o nome numa tira de papel. Cada evento da História diz quem está de fato na cena (`face` no dado); a regra do retrato está em [Quem aparece na cena](#quem-aparece-na-cena).
- **Pergaminho**: o título em letra de mão, o texto e um **selo** no canto com o tipo do momento (話 presenciado, 縁 narrativo, 修 treino ou lição, 勝 vitória, 巻 estágio, 宝 relíquia, 火 Vontade do Fogo, 道 ciclo, 謎 desconhecido).
- **Opções** como tiras de papel, não botões de painel; a escolhida leva o carimbo.
- **Vitória e lição**: as linhas entram uma a uma; na lição, quem está em cena é quem a deu, e a primeira linha lê como fala.
- **PC**: **local ao fundo, evento à frente** (referência: os eventos de Slay the Spire). O quadro de mangá vira o palco inteiro (até 1560px, na altura da janela), com o desenho do local apagado e um véu do lado do texto. O pergaminho grande fica **centrado**, com título, texto e opções em tamanho de PC, e é o foco. Uma vinheta escurece atrás dele e deixa o local mais à vista nas bordas. Quem está em cena fica pequeno no canto de baixo à esquerda (até 170px), na margem. Nos picos, o carimbo grande fica no canto de cima do pergaminho. No **minijogo**, o pergaminho alarga (centrado, sem encostar no retrato) e leva o tabuleiro: memória em 6×2, selos em 8×1, cartas medidas pela altura e mãos grandes no jokenpô; nos de tempo (v0.91.0), o tabuleiro é um botão grande: a faixa do alvo sobre madeira, o medidor vertical de chakra, a fila de figuras e o livro com o sino. Quando o conteúdo passa da altura (o relatório do fim da run), o palco cresce e a página rola. Histórico: até a v0.76.11 era a coluna do celular presa em 46vw; na v0.76.12 virou página dupla, mas o quadro tirava o foco do evento (pedido do usuário: "composição, mas não o foco"); na v0.76.13 o pergaminho ficava à direita, e na v0.76.14 foi centralizado.
- **Paradas e recompensas no PC** (v0.76.14): descanso, tesouro, relíquia de história e escolha da relíquia do chefe usam o mesmo palco: o local da parada ao fundo (`.jstage-bg` em `.jstaged`, com moldura, desenho apagado e a mesma vinheta) e o conteúdo centrado na frente. No celular o fundo não aparece.

**Fala na luta: corte de quadro.** A luta escurece, quem fala entra numa faixa de papel em diagonal com o retrato (pela esquerda o aliado, pela direita o inimigo; o narrador, sem retrato) e **o jogador toca para seguir** (Enter e espaço também; no modo instantâneo segue sozinha). A faixa de pincel fica só para os jutsus. A fala de abertura das lutas passou a aparecer: antes, a animação pulava os eventos da abertura.

### Quem aparece na cena

Regra (revisão da etapa 1, v0.72.1): **a cena nunca usa o rosto de outro personagem no lugar de alguém, nem o ninja genérico.** Quem não tem representação própria aparece só com o nome, na tira de papel, até existir um recurso visual. Pôr uma imagem em `public/img/jornada/<id>` resolve o caso sem mudar código (`hasOwnPortrait` em `prototype/art.ts`). O corte de quadro da luta segue a mesma regra para quem fala sem estar em campo.

Exceção (v0.76.9): o herói do **Caminho Ninja** é o ninja da classe; o retrato dele é o desenho da origem, então a cena mostra o retrato (antes o fim da run ficava com o nome solto, sem rosto).

**Picos da Jornada** (v0.76.9): vitória, estágio concluído, ciclo novo e fim da run usam o selo como **carimbo grande** (96 a 128px), batido no alto do pergaminho, e o título em letreiro (`.jc-peak`). Os outros momentos mantêm o selo pequeno no canto.

| Situação | Personagens | Na cena |
|---|---|---|
| **Desenho próprio** (v0.90.0) | Todos os nomeados com retrato: Naruto (e as formas da Kyuubi e de uma cauda), Sasuke (Sharingan, marca da maldição, hospital, Vale do Fim e nível 2), Sakura, Kakashi (e o Sharingan à mostra), Iruka, Neji (e o Byakugan ativo), Lee, Shikamaru, Chōji, Kiba, Akamaru, Jiraiya, Tsunade; Mizuki, Zabuza (com e sem as faixas), Haku (com a máscara, sem ela e de quimono na floresta), Gōzu, Meizu, Gaara (e o insano), Shukaku, Gamabunta (e a raposa), Dosu, Zaku, Kin, Jirobo, Kidomaru, Tayuya e Sakon (cada um também na marca da maldição nível 2), Kimimaro, Kabuto (e o genin do Exame), Orochimaru e a cobra | Retrato |
| **Desenho da origem** | Os genins criados para o jogo (Daichi, Hana, Mika, Ren e Kaede Uchiha, Mio e Sei Hyuuga) e o herói do Caminho Ninja | Retrato |
| **Sem recurso: só o nome** | Tazuna, Ebisu, Ibiki, Itachi e Kisame | Tira de papel com o nome, quadro só com o local |

Capangas e ninjas das vilas (Névoa, Grama, Chuva, Areia, Som) têm um desenho por tipo: valem na luta, mas não são rosto de cena.

A partir da v0.95.1, as fichas com ilustração carregam os WebPs de 256 × 256 em [`public/img/`](../public/img/LEIAME.md). A chave da ficha aponta para o mesmo arquivo no Roleta, na Jornada e no avatar. A Hinata tem retrato nas cenas em que é identificada pelo próprio id. Quando uma imagem está indisponível, a ficha usa o desenho correspondente em SVG. Por enquanto o jinchūriki usa o mesmo retrato da origem, sem mudança visual.

## Acabamento

Etapa 4 da evolução visual (v0.76.0), em `prototype/styles/acabamento.css`.

- **Roleta no celular**: o botão Girar fica preso ao pé da tela, mesmo com a legenda empurrando a roda para baixo.
- **Tela do nome**: o registro ninja em papel, com o selo 忍, em vez do card escuro com formulário.
- **Trilha**: a próxima parada e a dica ninja são papel; o HUD, a loja embutida e o resumo da run continuam em laca (ferramenta), como a regra dos três materiais manda.
- **Sombras**: sem brilho difuso. Estado ativo na árvore, no mapa e nos pontos de talento se marca com anel e sombra dura (a linguagem do carimbo e do papel); sobram só os brilhos de dano e de entrada de forma, que são efeitos de uma batida.

## Cartões

Etapa 3 da evolução visual (v0.75.0), em `prototype/jornada/cards.ts` e `styles/jornada-cards.css`.

- **Cartão de técnica canônico** (`techCard`): ícone quadrado na cor do elemento ou do tipo, nome e os números principais (dano com os bônus, cura, escudo, clones, custo). Moveset e ficha usam o mesmo desenho (na ficha, sobre papel, com o tipo antes dos números); antes eram dois. O **botão de luta** (`.jmove`) continua à parte de propósito: carrega estado (espera, bloqueio, vantagem). As vagas do moveset são selos, não cartões.
- **Cartão de relíquia**: já era um só (`relicCard`, com variações de tamanho: `reveal`, `pop`, `stack`); o que variava era o container, e isso agora segue a regra dos [três materiais](#três-materiais).
- **Loja**: um container só, o de papel, no celular (tela cheia) e no PC (painel ao lado da trilha).
- **Fim da run como relatório de missão**, na mesma cena da narrativa: números (lutas vencidas, nível, melhor golpe), o **caminho percorrido** (um selo por parada na História, a derrota em vermelho e o que faltou tracejado), a equipe (quem caiu fica cinza), as relíquias e os talentos finais. Os números e o caminho entram em sequência.

## Fundamentos

Etapa 0 da evolução visual (v0.74.0), em `prototype/styles/tokens.css` e `a11y.css`.

- **Escala tipográfica** em tokens (`--fs-xs` 12px a `--fs-6xl` 32px). **Nada de texto abaixo de 12px**; os 280 tamanhos soltos dos CSS de tela foram para a escala (display e kanji seguem os próprios `clamp`). Tamanho novo entra na escala, não em px solto.
- **Escala de espaço** (`--sp-1` 4px a `--sp-6` 32px) para o que for escrito daqui em diante; os paddings antigos não foram reescritos.
- **Paleta Shinobi** (`--sh-<família>-<n>` no `:root` de `prototype/styles/shinobi/base.css`, issue #37). As famílias são papel, ouro, terra, tinta, laca, folha, noite, uva e sumi, numeradas da mais clara para a mais escura. Nas folhas `shinobi/`, cor de componente só por token, e transparência por `color-mix(... N%, transparent)`. Cor nova entra na paleta; as exceções são as máscaras, onde o preto é só alfa. `tests/shinobi-tokens.test.ts` confere.
- **Contraste** (WCAG AA, 4,5:1 para texto): `--accent-text` é o vermelho para texto e ícone sobre superfície (o fundo vermelho segue com `--accent`).
- **Foco**: todo controle tem anel visível (regra de especificidade zero, que não atrapalha os que já tinham o seu); selos da árvore, cards de lutador, nós do mapa e as barras de navegação ganharam anel próprio.
- **Alvos de toque**: a área que responde tem 44px mesmo quando o desenho é menor (recolher painel, nó do mapa, relíquias na luta); botões pequenos e de fechar sobem para 44px em tela de toque.
- **Movimento**: os pulsos de chamada tocam algumas vezes e param; com menos movimento, o número de dano aparece parado em vez de sumir.

## Combate

Etapa 2 da evolução visual (v0.73.0), em `prototype/styles/jornada-combat.css`. O campo é o palco (noite); o menu é ferramenta (laca).

- **Celular**: o menu é uma bandeja de laca presa ao pé da tela, com abas. As ações de todo turno ficam ao alcance do polegar, sem rolar; a bandeja tem altura mínima fixa para não pular ao trocar de aba.
- **A informação que decide fica onde se decide**: a vantagem de elemento aparece no botão da técnica e numa etiqueta de papel em cada alvo, e a ordem da rodada sobe para o celular.
- **Confirmações** são do jogo: um aviso em papel com duas ações, no lugar do diálogo do navegador.
- Detalhes da tela em [combate.md](jornada/combate.md#interface).

## Movimento

O movimento responde a um gesto ou explica uma troca de estado; nada se mexe só por enfeite (v0.70.0, `prototype/styles/jornada-motion.css` e `prototype/jornada/motion.ts`).

- **O carimbo é o momento de autoria.** Ao escolher numa cena, a opção leva o hanko 道 ("o caminho") e as outras esmaecem, antes de a tela seguir. É como o mundo shinobi firma uma decisão.
- **Pincelada** entre um evento e o seguinte, quando abrem em sequência: a tela entra da esquerda para a direita, como tinta.
- **Faixa "O que mudou"**: etiqueta de papel no alto da tela seguinte, com os ganhos entrando um a um (no máximo meio segundo no total).
- **Troca de relíquia**: a antiga se desfaz em tinta e a nova se revela no mesmo lugar.
- **Formas na luta**: o retrato acende na cor do perigo ao entrar e desbota ao sair, com o banner nas duas pontas.
- **Árvore de talentos** (v0.71.0): aprender carimba o selo e pinta o traço; o contador de pontos afunda; o nível novo pinga como tinta; o caminho recusado da bifurcação é riscado da esquerda para a direita; no talento final, o kanji do ramo (影 幻 縁 油 火 風) acende atrás do selo e o aro dourado abre.
- **Cena viva** (v0.89.0): a única exceção ao "nada se mexe só por enfeite", e só no modo **Animado** (botão da barra, desligado por padrão). Nos painéis grandes (Portão, destaque da entrada da Jornada, pôsteres da perspectiva e do Caminho Ninja, arte do arco na trilha) a arte respira devagar em volta do foco, uma névoa atravessa, caem folhas de dia e piscam vaga-lumes à noite; nos pôsteres da perspectiva, as folhas ficam no do dia e os vaga-lumes no da noite, e o pôster bloqueado não se mexe. Cards de modo, faixa de arcos e miniaturas ficam parados. A camada é `sceneFx()` (`prototype/art.ts`) com o CSS `.scene-fx` em `prototype/styles/art.css`; durações em `--dur-breath`, `--dur-drift`, `--dur-fall` e `--dur-glow`. No modo Leve, no Instantâneo ou com `prefers-reduced-motion`, tudo fica parado.
- **Regras**: durações pelos tokens (`--dur-*`), para o modo instantâneo encurtar tudo; o conteúdo já nasce visível (sem animação, nada some); com `prefers-reduced-motion`, saem o deslocamento e a pincelada e ficam a cor e a opacidade. Kanji novo só do recorte (`prototype/fonts/LEIAME.md`): a "Lição" do teste do sino usa 修, que já estava nele.

## Vagas de ilustração

O jogador pode pôr ilustrações em `public/img/cenas/` ([instruções](../public/img/LEIAME.md)). Sem a imagem, vale o desenho próprio. Hoje as vagas têm **imagens provisórias** (`.svg` com o nome do arquivo escrito), para ver o efeito: troque por uma imagem com o mesmo nome e apague o `.svg`. Cada vaga aceita também um **vídeo curto em loop** (`.webm` ou `.mp4`, sem som) com o mesmo nome: o botão **Animado** da barra superior troca entre o modo **Leve**, com a imagem parada e padrão, e o animado (vídeo nas vagas que têm e a cena viva dos painéis grandes, ver [Movimento](#movimento)); com `prefers-reduced-motion`, sempre a imagem. As artes de `cenas/` usadas em painel grande (Portão, entrada da Jornada, trilha de arco) ficam em cerca de 2x o tamanho exibido, em `.webp` (ampliadas com Real-ESRGAN, modelo de anime).

**A arte se ajusta ao espaço** (decidido com o usuário, 11/11/2026: "preencher com foco"). Uma regra só para toda ilustração, a moldura `.art-frame` (`prototype/styles/art.css`):
- o layout dá a célula e a arte a **preenche**, cortando as sobras em volta do **foco** (onde estão os rostos);
- a **forma** de cada imagem é lida no build (`scripts/image-size.ts`, largura e altura de PNG, JPEG, WebP e SVG) e já vem no HTML em `--ratio`, então nada pula ao carregar; vídeo mede ao carregar;
- o **limite de corte**: onde a célula pode escolher a forma, ela usa a proporção da arte dentro de uma faixa (`aspect-ratio: clamp(mín, var(--ratio), máx)`);
- quando o corte passaria do limite, o card **troca de arranjo** pela largura dele, não pela tela (arte ao lado ↔ arte em cima).

Nenhuma vaga tem tamanho ou enquadramento próprio no CSS.

O código pede a arte por **chave**, e um mapa único (`SCENE_ART` em `prototype/art.ts`) liga a chave ao arquivo e ao **foco** da arte (em % da imagem; sem entrada, o centro um pouco acima). É o único lugar com nome de arquivo e com enquadramento: trocar uma arte é trocar o arquivo, ou uma linha do mapa. Sem entrada no mapa, a chave é o próprio nome do arquivo.

| Chave | Arquivo hoje | Onde | Sem a imagem |
|---|---|---|---|
| `portao` | `portao.webp` | O portão da vila e o Monte Hokage (os cinco rostos) ao pôr do sol, céu em brasa e sombras índigo, lanternas acesas | Cena SVG de Konoha |
| `perspectiva-naruto`, `perspectiva-sasuke` | `dia`, `noite` | Pôsteres das perspectivas da História | Painel de perspectiva |
| `jornada` | `jornada` | Banner da entrada da Jornada | Cena de Konoha |
| `modo-jornada`, `modo-roleta` | os mesmos | Arte dos cards de modo (`modo-jornada`: o Time 7 de costas sobre o telhado, em tinta laranja; `modo-roleta`: um duelo na arena de fatias, a origem Uchiha de costas contra o Orochimaru, em tinta ameixa) | Emblema em aquarela |
| `arco-waves`, `arco-exam`, `arco-sannin`, `arco-retrieval` | `waves`, `chunnin`, `sannin`, `sasuke` (a equipe do resgate) | Faixa de arcos da História e miniatura do card de progresso | Cenário do estágio |
| `g1`, `g2`, `g3` | os mesmos | Miniatura do Caminho Ninja | Cenário do estágio |
| `roleta` | (vazia) | Palco do sorteio da origem no PC | Cenário desenhado de Konoha |
| `roleta-genin`, `roleta-chunin`, `roleta-jounin`, `roleta-boss` | `roleta-genin`, `roleta-chunin`, `roleta-jounin`, `roleta-chefe` (vazias) | Roleta no PC: painel do mapa do ciclo, palco das roletas e fundo da arena da luta, pela categoria da luta atual | Cenário desenhado: Konoha, arena, floresta, Vale do Fim |
| `modo-caminho` | `modo-caminho.webp` | Pergaminho da Campanha: um ninja de costas na encruzilhada, com a placa de setas e os caminhos se dividindo, em tinta verde | Emblema da Jornada |
| `caminho-ninja` | `caminho-ninja` (Minato) | Pôster da preparação da Campanha | Arte `jornada` |

`sasuke2` (Itachi e Sasuke) está reservada para a campanha do Sasuke ([historia-sasuke.md](jornada/historia-sasuke.md)).

### Cena do Portão

O Monte Hokage é o centro da pintura e nada o cobre. No tablet (768 a 1023 px), a pintura aparece inteira e o letreiro fica no alto da faixa escura da esquerda; no celular e no desktop, onde essa faixa não comporta o letreiro, ele desce para baixo dos rostos, sobre os telhados. O foco mantém os cinco rostos e o portão nos recortes estreitos. O modo Animado acrescenta névoa e vaga-lumes.

### Roleta no PC

O Roleta tem composição própria no PC (`prototype/styles/roleta-desk.css`), nos moldes da Jornada, e cabe na janela; no celular nada muda.
- **Sorteio da origem**: a roda no centro, sobre a arte `roleta`; com os resultados, a roda some e entram as opções centradas (a Ficha à esquerda; a Dificuldade, o Re-rolar e o Começar à direita). O botão Ficha da barra só aparece depois das roletas, para não entregar a classe.
- **Outras telas de roleta** (evento, recompensa, nível, melhoria, aviso: `.rwheel`): a roda sozinha no centro, sobre a arte da vaga, sem a Ficha. Durante as roletas, o nome do evento fica como etiqueta no alto do palco; no fim, o resultado e as mudanças aparecem num popup sobre o palco, com **Ficha** (abre a janela) e a ação. Nas telas com carimbo grande e sem roda (aviso, nível, melhoria), o carimbo fica no palco à esquerda e o card à direita, sem escurecer: o popup escondia o carimbo. O jokenpô do evento usa mãos grandes no palco.
- **Roda parada no lugar** (v0.76.15): roletas seguidas nascem na mesma posição. No PC a roda fica presa no alto do palco (centrada, ela subia e descia quando a caixa mudava de altura); no evento, o espaço da etiqueta fica reservado desde a primeira roleta, com a roda um pouco menor para a legenda caber. No celular o "Girar" usado some sem tirar o espaço, e os resultados da origem ficam numa linha só, que rola de lado. No combate, as ações aparecem desativadas já durante a iniciativa (entrando depois, o painel mudava a grade e a arena pulava), a faixa de acerto tem a altura reservada e só a primeira entra com o pop.
- **Mapa do ciclo** (`.rmap`), em duas colunas: à esquerda, a **Ficha aberta em painéis minimizáveis** (ficha e atributos, relíquias e bolsa, técnicas, passivas), como os da Jornada; à direita, o título, a trilha e a cena da categoria com o **vilão por cima** da arte, e o Lutar embaixo.
- **Trilha** (PC e celular): cada etapa tem duas linhas, o **Evento** pré-luta (dado, etiqueta dourada; depois de acontecer, o nome) e o **Confronto** (marco, rosto, categoria e vilão; etiqueta vermelha). Etapa vencida expande e mostra o que deu (XP, status, nível, itens, relíquia do baú), pelo registro da run.
- **Luta** (`.rb-desk`): o layout da luta da Jornada. A arte da categoria é o fundo da luta; no centro, o vilão em cima, a arena (faixas de iniciativa e de acerto) no meio e você embaixo, sem caixa; à esquerda, a ficha do vilão (atributos, passivas, técnicas) e o registro da luta; à direita, as ações. Até 1279px, duas colunas (o campo e as ações; a ficha e o registro embaixo do campo).
- **Mapa**: o botão principal é "Seguir: evento pré-luta" até o evento acontecer, depois "Lutar"; embaixo, **Abandonar run** em cor de perigo (também no pé das ações da luta). O vilão fica no meio da cena.
- **Cores**: a Ficha aberta do mapa usa o papel da janela da ficha.
- **Fim da run**: à esquerda, um pergaminho com o selo e o carimbo 勝/敗, o título e os números; à direita, a trilha (com o que cada etapa deu) e a Ficha resumida; as ações embaixo.

### Entrada da Jornada

A antiga entrada da Jornada permanece disponível como cenário do UI Lab e usa a **composição do Início** (a mesma casca `.gate`, com o modificador `.jgate`):
- destaque com a arte `jornada`, o título "Modo Jornada" no lugar do logo e uma frase em pergaminho;
- dois cards-pergaminho sobre a cena: **Modo História** (selo 史, arte em leque com os quatro arcos) e **Caminho Ninja** (selo 道);
- à direita, Progresso da Jornada (Continuar direto), Dificuldade e Conquistas recentes. No celular, a pilha: destaque, progresso, modos, dificuldade e conquistas.

No jogo, os cards **História** e **Campanha** do Portão abrem as telas de modo (`.gate.jgate.jhub`). O letreiro em pincel fica no canto da arte. Cada card é um pergaminho de papel liso, com rolos de madeira, uma ilustração com borda de tinta e a ação junto ao nome.
- **Modo História** (`.jstory`): o painel com a arte `jornada` e uma frase; dois cards, **Naruto** (arte `perspectiva-naruto`, selo 陽) e **Sasuke** (arte `perspectiva-sasuke`, selo 影, "Em breve"); na coluna, a run salva (Progresso da Jornada com o Continuar, ou o aviso de que começar substitui a da Campanha), a **Dificuldade da Jornada** e as Conquistas recentes. As perspectivas vêm das campanhas (`data.campaigns`); a do Sasuke destrava quando os dados dela existirem.
- **Janela da perspectiva** (`.jpersp`): o card abre uma janela maior que as outras, com a arte, a descrição, os quatro arcos com o progresso ([Arcos da Jornada](#arcos-da-jornada); passar o mouse, tocar ou focar um arco mostra a descrição breve dele numa dica destacada) e o **Começar a História**, ou o **Continuar** e o **Recomeçar a História** quando a História está salva. A do Sasuke mostra a descrição e o "Em breve". Fecha pelo X, pelo fundo, pelo Esc e pelo voltar.
- **Modo Campanha** (`.jcamp`), na composição da História: o painel com a arte (provisoriamente a `jornada`, até a arte própria) e os três estágios. **Escolher a classe** apresenta os retratos das classes em leque (`.jclass-fan`). **Classe aleatória** mostra as silhuetas dos personagens sobre papel, a interrogação e o selo com baú e "+1 relíquia" (`.jfan-mystery`). Na coluna ficam a run salva, a dificuldade, o recorde e as Conquistas recentes.
- **Cardápio** (`.jclass-menu`). A lista de classes se distingue da ficha em papel, com o retrato grande e a descrição ao lado. O retrato acompanha a escolha e, no Comum, mostra o Prodígio sem elemento. O cadeado, o contorno tracejado e o texto legível identificam as classes travadas. A janela mantém as dimensões e a posição de **Começar** ao trocar de classe. O espaço dos elementos fica reservado quando o grupo é ocultado.
- **Classe aleatória** (`.jrandom-class`). As classes que podem sair formam uma fileira de retratos com nome. Uma faixa de papel com ícone de baú destaca a relíquia extra acima de **Sortear e começar**.

No celular, o painel de arte e os dois pergaminhos aparecem em pilha, seguidos da coluna com progresso, dificuldade e conquistas. A partir de 600 px os pergaminhos ficam lado a lado. Na faixa desktop, a coluna passa à direita. A partir de 1024 px, História e Campanha compartilham as medidas da grade do Início, e o painel de arte ocupa a mesma célula da cena do Portão, inclusive em monitores grandes. A ordem do foco acompanha a leitura nas três faixas. Em janela desktop baixa, o texto menor dos pergaminhos cede espaço para título, arte e ação.

### Dualidade Naruto e Sasuke

Na escolha da perspectiva, a ilustração diurna identifica Naruto e a noturna identifica Sasuke. Ambas aparecem sobre o mesmo grafite.

### Arcos da Jornada

Na janela do Naruto, os quatro arcos ficam em duas colunas no celular e em uma fileira a partir de 600 px. Cada arco traz arte, número em selo (一 a 四) e nome em letra de mão.

- **Concluído** tem filete duplo dourado e marca de confirmação.
- **Você está aqui** tem moldura e selo de laca com o nome do estado.
- **Próximo** tem filete simples.
- **Ainda não alcançado** tem moldura tracejada, cadeado e arte dessaturada.

A dica de cada arco usa papel, título manuscrito e filete de laca. O toque e o foco de teclado permitem ler a descrição com a grade aberta.

O foco de cada arte (onde estão os rostos) vem do `SCENE_ART`. Na run da História, o painel da trilha mostra a arte do arco atual no lugar do cenário desenhado: no PC, a lista de paradas numa célula (rola por dentro) e a arte na célula ao lado, com a borda de tinta; no celular e no tablet, a arte no alto do painel. Número e nome do arco vão em selo e letra de mão, dentro da arte. Sem arte, volta o cenário do local. O combate continua com o local da parada.

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
- **Um desenho por personagem** (v0.90.0, `prototype/portraits/`): o SVG segue a aparência do personagem na obra (cabelo, olhos, marcas no rosto, traje, acessório e objeto de cena), em traço próprio com contorno de tinta. As peças comuns (rosto, olhos, boca, bandana, ombros) ficam em `kit.ts`; cabelo e traje são de cada um (`konoha.ts`, `villains.ts`, `generic.ts`). Antes, os ninjas dividiam um molde que só trocava a cor.
  - **Genéricos lembram a origem, sem copiar o nomeado**: o Uchiha genérico tem o cabelo preto e a gola alta, mas não a franja do Sasuke; o Nara tem o abacaxi com cavanhaque e cicatrizes; o prodígio tem a tigela repartida e o colete. Ninjas das vilas levam o traje típico (respirador da Chuva, chapéu de palha da Grama, turbante da Areia).
  - Tem que se ler de 24px (ordem de iniciativa) a 170px (cena): o que distingue é silhueta, cabelo e cor, não detalhe fino.
  - **Auditoria por imagem base** (v0.90.0): o traço de anime de uma rodada intermediária (olhos grandes, queixo fino, sombra chapada, disco no fundo) não agradou e saiu; vale o traço da primeira rodada. O usuário vai enviar uma imagem base para cada retrato e ajustar um a um. As imagens ficam em `prototype/lab/refs/<chave>` ([lista e situação](../prototype/lab/refs/LEIAME.md)), fora do git e do jogo, e a galeria do UI Lab mostra cada uma ao lado do desenho.
  - **Retrato de fúria** (v0.90.0, só visual, `src/data/portraits.ts`): com metade do HP ou menos, o lutador mostra outra face. Kakashi revela o Sharingan, Neji ativa o Byakugan, Zabuza e Haku perdem a máscara, Gaara enlouquece e o Quarteto do Som entra na marca da maldição nível 2. Vale nos dois modos e não muda nenhuma regra. Forma ligada pelo roteiro e visual escolhido pelo jogador têm prioridade. O Haku de quimono é só da cena da floresta (`scenePortraits`).
  - Conferência: o cenário `meta.portraits` do UI Lab mostra todos lado a lado; `tests/portraits.test.ts` garante que toda chave dos dados tem desenho e que nenhum se repete.
- **Nada de rostos desenhados nos cenários**: o Monumento dos Hokages foi tentado na v0.54.0 e saiu na v0.55.0, a pedido do usuário, porque ficou ruim.

### Ficha de estilo dos retratos

Os retratos ilustrados da v0.95.1 foram gerados por IA a partir de imagens-modelo escolhidas pelo usuário. Esta ficha existe para que um retrato novo, ou refeito, saia no mesmo estilo dos outros, seja qual for a ferramenta ou o agente. O passo a passo está na skill [`novo-retrato`](../.claude/skills/novo-retrato/SKILL.md); o registro de cada arquivo, em [`public/img/retratos.json`](../public/img/retratos.json).

| Item | Padrão (tirado dos retratos atuais) |
|---|---|
| Formato | WebP quadrado, 256 × 256, até 30 KB |
| Enquadramento | Busto de frente, do peito para cima; a cabeça ocupa o terço de cima e o centro, sem cortar o cabelo nem a bandana |
| Traço | Anime em cel shading: contorno limpo, sombra em duas ou três tonalidades, sem brilho exagerado nem textura de pintura |
| Rosto | Fiel à obra no formato, olhos e marcas; expressão própria do personagem. Fora: olhos enormes, queixo fino demais e sombra chapada (o traço rejeitado na v0.90.0) |
| Fundo | Liso, uma cor só e discreta, com textura leve de papel, sem cenário, disco ou moldura. Tons frios (azul-petróleo, ardósia) nos aliados e nos vilões; a cor não pode brigar com o vermelho de perigo da interface |
| Leitura | Tem que se reconhecer de 24px a 170px: silhueta, cabelo, cor do traje e acessório |
| Variantes | Mesma pessoa, mesmo enquadramento e mesmo fundo; muda só o que a forma muda (Sharingan, marca da maldição, sem máscara) |
| Nunca | Texto, logotipo, marca-d'água, assinatura ou moldura |

**Como os retratos são feitos** (processo do usuário na v0.95.1):

1. **Imagens-modelo**: o usuário escolhe imagens com as características que quer no retrato (traço, enquadramento, expressão, detalhe do traje) e as guarda em `prototype/lab/refs/<chave>` (fora do git e do jogo; a galeria do UI Lab mostra cada uma ao lado do retrato).
2. **Instrução**: um texto curto dizendo o que pegar de cada imagem e o que seguir da tabela acima. Para manter a série, junte dois retratos já aprovados do mesmo grupo (aliados ou vilões).
3. **Geração** pela ferramenta de IA.
4. **Revisão humana**: o usuário compara na galeria e em tamanho pequeno e grande, e pede ajustes até aprovar. Cada pedido vai para `ajustes` no manifesto.

## Celular e desktop

Decidido com o usuário (07/11/2026): **celular e desktop são pares**. Compartilham regras, estado, mecânicas e identidade visual, mas cada um tem a sua composição. O desktop **compõe** a tela de outro jeito (colunas, painéis laterais fixos, menos rolagem) em vez de ampliar a do celular. Nenhuma regra muda com a largura: o layout é só CSS (Grid com `grid-template-areas`) e, quando falta um painel, HTML de apresentação, nunca lógica duplicada.

**A composição olha a largura e a altura** (decidido com o usuário, 10/11/2026, depois do teste em notebook e tablet): só a largura punha o desktop apertado em tablet deitado e notebook baixo, e deixava o tablet em pé com a coluna de 520px.

| Faixa | Condição | Composição |
|---|---|---|
| Celular | < 600px | Vertical, por prioridade; a base de todo arquivo de estilo |
| Tablet ("celular expandido") | ≥ 600px, fora do desktop | A ordem do celular usando a largura: coluna até 860px (`--col-max`), cena e logo maiores, cards e painéis em 2 colunas (modos lado a lado com a arte em cima, as duas perspectivas, ficha e opções da origem), roda pela altura. Barra inferior, sem barra lateral. O celular deitado (altura < 560) também fica aqui |
| Desktop | ≥ 900px **e** altura ≥ 560px | Colunas e painéis laterais, com `--shell-max` de 1920px. Tablet deitado é desktop compacto |
| Widescreen | ≥ 1280px **e** altura ≥ 560px | Mais uma região (equipe, campo e ações; contexto ao lado do mapa) |
| Monitor grande | ≥ 2200px **e** altura ≥ 1200px | Casca até 3600px. A unidade `--ui-unit` cresce com a menor dimensão até 1,8× e dimensiona texto, ícones, alvos e espaços. No Portão, Ficha e Conquistas ganham até 24% da largura da casca. A escolha da perspectiva da História e a preparação da Campanha usam a faixa Desktop |
| Compacta | desktop **e** altura ≤ 720px | Menos detalhe: cena, roda e citação menores, técnicas da luta 2 por linha com botões mais baixos, legenda da roda em 3 colunas |
| Piso | desktop **e** altura < 620px (`--floor-h`) | A tela é montada com 620px de altura e a página rola um pouco, em vez de espremer e sobrepor |
| Toque | `pointer: coarse` | Alvos de pelo menos 44px (`--tap`) nos botões pequenos; as dicas já abrem com o toque longo |

- **Componentes olham o próprio espaço** (container queries), não só a tela: os cards de modo põem a arte em cima do texto quando o centro tem menos de 720px, a citação sai quando a cena fica baixa ou estreita, e a coluna direita solta peças quando fica baixa.
- **Cada peça no seu espaço** (decidido com o usuário, 11/11/2026): em todas as telas, as peças ocupam células de uma grade com o mesmo espaçamento (`--gap`, `--gap-lg`) e nada cruza a borda de nada; ornamento (selo, rolo, kunai) fica dentro da própria peça. Quando falta espaço, as peças saem nesta ordem: 1) citação; 2) descrição do card (encurta, depois some); 3) conquistas recentes; 4) números da ficha e notas da dificuldade. **Nunca saem**: botão de ação, progresso da Jornada e título.
- **Notebook estreito** (900–1279px): barra lateral de 76px, coluna direita do Início e coluna da build mais estreitas.
- **Escala fluida pela menor dimensão**: arte, retratos e roda usam `clamp` com `min(vw, vh)`, para crescer com a tela sem estourar a altura.
- Telas simples da Jornada (sorteio, nome, descanso, baú, fim) ficam numa coluna central de leitura no desktop.
- Janelas: 520px no celular, 720px no tablet e 860px no desktop (`--modal-max`). Em monitor grande, o limite do desktop acompanha a unidade da interface.

A CSS não aceita `var()` em `@media`, então as condições se repetem nas telas; a referência fica no topo de `prototype/styles/base.css` e, para o TS, em `prototype/layout.ts` (`DESK`, `WIDE`).

**Quanto menos rolagem, melhor** (pedido do usuário, v0.57.2). No desktop, trilha, mapa e luta cabem na janela pelo layout, não por um número: o corpo tem a altura da tela e a tela do jogo ocupa o que sobra entre a barra e o rodapé (flex). Só a trilha, a carta e as colunas rolam por dentro, e só se faltar altura. As medidas que pesam na altura acompanham a janela com `clamp(mín, Xvh, máx)`: faixa do cenário da trilha, espaço entre as paradas e retratos da luta. A carta do mapa estica até a coluna (nós em % de um campo interno com margem) e só rola abaixo de 48px por linha; no celular, 74px por linha, como sempre.

**Layout fluido** (v0.57.5): as peças crescem e se reorganizam com a janela. As colunas laterais usam proporções com limites e as grades que usam `repeat(auto-fill, minmax(...))` ganham colunas quando sobra largura. Retratos e espaços acompanham a largura e a altura úteis. O detalhe acompanha a altura: abaixo de 760px só o essencial, a partir de 880px a ficha completa.

Toda tela nova precisa das composições de celular, tablet e desktop, conferidas nos tamanhos reais da área do navegador, sem rolagem horizontal. Nas telas que cabem na janela no desktop com altura ≥ 620px, só os painéis internos rolam. As referências incluem 390×844 (celular), 768×1024 e 820×1180 (tablet em pé), 1024×768 e 1180×820 (tablet deitado), 1100×800, 1280×620 (Full HD com escala de 150%), 1280×800, 1366×650, 1366×657 e 1440×900 (notebook), 1536×730 (Full HD com escala de 125%), 1920×950 e 1920×1080 (Full HD), 2560×1300 e 2560×1440 (2K ou 4K com escala) e 3840×2160 (4K).

| Tela | Desktop | Situação |
|---|---|---|
| Combate da Jornada | Notebook: campo e ações em colunas, com o registro embaixo. Widescreen: campo clássico ao centro (inimigos em cima, equipe embaixo, o local cobrindo o fundo); à esquerda, a **ordem da rodada**, a **ficha dos inimigos** (HP e chakra, elemento, comportamento, contra o que é fraco e forte, passiva, estados e, a partir de 880px de altura, as técnicas com o dano) e o **registro recolhível** (fechado mostra 4 linhas; o toque abre); à direita, a **ficha da equipe** e as ações. As fichas acompanham cada golpe. Em janela baixa (≤ 760px) a ficha da equipe sai. O **Desistir da jornada** é um botão próprio em cor de perigo no pé das ações, em todos os tamanhos. A v0.57.0 pôs a equipe numa coluna e os inimigos ao centro; o usuário achou ruim e saiu na v0.57.1 | Feito (v0.57.5) |
| Trilha e mapa da Jornada | A tela cabe na janela e só a trilha, a carta e as colunas rolam por dentro. No topo do centro, o **título do estágio** ("Estágio n/t", o nome em letreiro e, no mapa, "Escolha o próximo destino"), com ciclo, dificuldade e o **Abandonar jornada** em cor de perigo, como o Desistir da luta (v0.57.7). Notebook: build e o que vem empilhados ao lado. Widescreen: **build** à esquerda (HUD e a loja aberta; o botão Loja some), trilha ou carta no centro e **o que vem** à direita (na trilha, a próxima parada com os inimigos, as seguintes e o Seguir; no mapa, o chefe, os caminhos abertos e o card **Sua run**), com a dica de jogo. A carta tem margem interna (nenhum símbolo toca a borda) e a **legenda fica embaixo** dela. No celular, título, HUD, (chefe,) trilha ou carta e legenda, nessa ordem | Feito (v0.57.3) |
| Entrada da Jornada e painéis minimizáveis | Entrada: título com o Voltar, banner baixo e, embaixo, três colunas (no notebook, duas): progresso e dificuldade; a História com as conquistas recentes embaixo; o Caminho Ninja. No celular, a pilha de sempre. **Painéis minimizáveis** no widescreen (botão no canto, a escolha fica no navegador): na trilha e no mapa, relíquias e bolsa, loja, próxima parada, caminhos abertos, sua run e dica; na luta, ordem da rodada e as fichas (o registro já recolhe; as ações nunca) | Feito (v0.57.6) |
| Portão e barra superior | Casca do PC (barra lateral, Início em painéis, páginas do Registro, faixa de frases) e a barra superior com o nome de cada ferramenta | Feito (aguardando aprovação do usuário) |
| Roleta, árvore de talentos, modais e minigames | O Roleta tem composição própria no PC ("Roleta no PC"); roda e legenda acompanham a altura. Modais por faixa; minigames com o tabuleiro na página da direita da cena no PC (v0.76.12) | Feito (v0.59.1), aguardando o teste do usuário |
| Proporções (tablet, notebook baixo) | Faixas por largura e altura, compacta, piso, toque e container queries (acima) | Feito (v0.59.1), aguardando o teste do usuário |

## Situação

O piloto cobre o Portão da Vila e a entrada da Jornada no estilo novo (v0.56.0), e a trilha, o mapa e o sorteio do Roleta (v0.54.0). O que falta está em [decisoes.md](decisoes.md).
