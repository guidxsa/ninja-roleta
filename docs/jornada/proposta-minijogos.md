# Proposta: minijogos novos da Jornada

> **Proposta de design, não implementada (17/11/2026).** Aguarda a aprovação do usuário. Nada aqui vale como regra até entrar em [run.md](run.md#minijogos); os números são rascunho e iriam para `balance` (`src/data/jornada/balance.ts`, `minigames`).

## Por quê

O usuário pediu mais variedade: hoje, dos 3 minijogos ([run.md](run.md#minijogos)), 2 são de selos (Memória e Sequência), e eles ocupam 12 das 14 opções com minijogo nos eventos (`src/data/jornada/events.ts`): a Sequência aparece em 9, a Memória em 3 e o Jokenpô em 2. Na História, quase todo treino termina em "decore os selos".

A proposta traz **4 minijogos novos**, cada um com um verbo diferente dos selos (mirar, equilibrar, rastrear e reagir), e redistribui os eventos: a Sequência cai de 9 para 5 das 14 opções, e os selos deixam de ser maioria.

## Regras comuns

Valem para os 4 e seguem o que já existe:

- **Um toque**: cada jogo se joga tocando um ponto da tela (ou a barra de espaço / Enter no desktop). Nada de arrastar, deslizar nem gesto de dois dedos.
- **Curto**: de 5 a 15 segundos de jogo. O texto de ajuda fica em uma linha; o resto vai na dica (`tip()`), como manda o CLAUDE.md.
- **Ganhar ou perder** usa o que já existe: ganhar dá `effects`, perder dá `onLose` (`resolveEvent(run, optionId, wonMinigame, data)`). Os prêmios dos eventos não mudam.
- **Sorteio no core**: cada jogo tem uma função pura que recebe `rng()` e devolve o roteiro inteiro (posições, tempos, trocas) e uma função que julga a jogada. A tela só anima o roteiro e manda os toques. Assim o mesmo seed dá o mesmo jogo, e os testes conferem a regra sem DOM.
- **Tempo em ticks**: os jogos de tempo andam em passos fixos (o "tick", 50 ms) calculados no core; a tela só desenha o passo atual. Com isso o teste simula "tocou no tick 37" e o leitor de tela e o menos movimento usam o mesmo roteiro com passos maiores.
- **Modo instantâneo** não encurta a parte jogável (como a memorização da Sequência hoje): só a entrada e o resultado.
- **Menos movimento** (`prefers-reduced-motion` ou o modo Leve, [visual.md](../visual.md#movimento)): o que desliza passa a saltar entre posições fixas, sem interpolação, e a janela de acerto fica um pouco maior para compensar. Nenhum jogo depende só de cor: o estado tem sempre forma ou texto.
- **Leitor de tela**: o tabuleiro tem `role="group"` com nome; o estado muda numa região `aria-live` curta ("No centro", "Alto demais"). Onde o tempo de leitura atrapalha um jogo de reflexo, há uma **variante sem pressa** (descrita em cada jogo), escolhida sozinha quando o aparelho pede menos movimento e por um interruptor nas opções (proposta: "Minijogos sem pressa", guardado no perfil).
- **Visual** ([visual.md](../visual.md)): o tabuleiro fica no pergaminho do evento, como os de hoje (no PC, o pergaminho alarga). Ícones do `ICONS` (`kunai`, `bell`, `sharingan` e `byakugan` já existem), cores por token, cantos retos. O jogo aparece parado e só se mexe depois do toque em **Começar** (o movimento responde a um gesto).
- **Status pesam**: pela regra do projeto (o RNG sempre sofre influência do jogador), cada jogo tem um ponto em que a classe, um talento ou uma relíquia ajuda. Os ganchos estão em cada jogo; ligar ou não é uma pergunta em [Em aberto](#em-aberto).

## 1. Kunai no alvo

**Base**: o treino de arremesso no campo de treino de Konoha (os alvos de madeira nos troncos).

- **Regra**: um marcador corre de um lado para o outro numa faixa sobre o alvo, com velocidade constante. Toque para soltar a kunai: onde o marcador estava é onde ela crava. A faixa tem três zonas: **centro**, **anel** e **fora**. São **3 kunai**; cada uma sai com um marcador mais rápido.
- **Pontos**: centro 2, anel 1, fora 0. **Vence com 4 pontos** (por exemplo, dois centros, ou um centro e dois anéis).
- **Controle**: um toque em qualquer ponto do tabuleiro (ou espaço / Enter).
- **Duração**: cerca de 6 a 9 segundos.
- **Variante "força"** (mesma regra, outra pele): em vez do alvo, uma barra de chakra que enche e esvazia; soltar no topo é o centro. Serve à bola de borracha do Rasengan.
- **Dificuldade**: tamanho do centro e do anel e velocidade do marcador. Rascunho: centro de 16% da faixa no Fácil, 12% no Médio, 10% no Difícil e 8% no Hardcore; velocidade +15% a cada kunai.
- **Gancho de status**: uma relíquia de precisão (nova, a definir no catálogo de [reliquias.md](reliquias.md)) alarga o centro em 2 pontos percentuais.
- **Acessibilidade**: com menos movimento, o marcador salta entre 12 posições fixas (uma por passo de 150 ms) e o centro ocupa 2 delas. Variante sem pressa: o marcador para em cada posição até o jogador tocar **Próxima** ou **Soltar**; a ordem das posições é sorteada (rng), então é um jogo de ler e decidir, não de reflexo. O leitor anuncia a posição ("Anel, à esquerda", "Centro").
- **Eventos**: `gTraining` (Caminho Ninja, treino de arremesso no lugar dos selos) e `rasengan2` (História, bola de borracha, na variante força).

## 2. Andar sobre a água

**Base**: o controle de chakra do treino de escalar a árvore e de andar sobre a água: chakra de menos afunda, chakra demais repele.

- **Regra**: um medidor vertical com uma faixa "no ponto" no meio. O ponteiro desce sozinho (o chakra se dispersa) e, de tempos em tempos, uma onda o empurra para cima ou para baixo (sorteada pelo rng no roteiro). Cada toque injeta chakra e sobe o ponteiro um degrau. Fique **8 segundos**.
- **Vencer ou perder**: perde quem passar mais de **1,5 s no total** fora da faixa (afundou ou foi repelido). Um contador mostra o tempo que sobra e uma linha de água mostra o quanto já se perdeu.
- **Controle**: um toque por impulso, em qualquer ponto do tabuleiro (ou espaço / Enter). Segurar não conta: é ritmo, não força.
- **Duração**: 8 segundos.
- **Dificuldade**: largura da faixa, força das ondas e tolerância fora da faixa. Rascunho: faixa de 30% / 25% / 22% / 18% do medidor; tolerância de 2,0 / 1,5 / 1,2 / 1,0 s.
- **Gancho de status**: o chakra máximo do protagonista alarga a faixa (por exemplo, +1 ponto percentual a cada 20 de chakra acima do inicial, com teto). Combina com o tema e faz o treino da árvore (que dá chakra máximo) conversar com o resto.
- **Acessibilidade**: o jogo já é por ticks; com menos movimento, o ponteiro salta de degrau em degrau sem deslizar e as ondas aparecem como uma seta, não como água mexendo. O leitor anuncia só as mudanças de estado ("Afundando", "No ponto", "Repelido"). Variante sem pressa: o ponteiro só anda quando o jogador age; a cada passo ele escolhe **Concentrar** (sobe) ou **Soltar** (desce), vendo a próxima onda anunciada, e precisa terminar 10 passos com no máximo 2 fora da faixa.
- **Eventos**: `treeClimbing` (pele de árvore: o ponteiro é a altura dos pés no tronco) e `rasengan1` (pele de balão d'água: a faixa é a rotação certa). No Caminho Ninja, um evento novo de treino, ou trocar o `ward` do `gBadOmen` (proposta: ficar de pé sobre o lago do santuário).

## 3. O clone verdadeiro

**Base**: o Kage Bunshin e o Bunshin; o Byakugan e o Sharingan enxergam o fluxo de chakra que denuncia o verdadeiro.

- **Regra**: 4 figuras iguais do inimigo ficam em fila. O verdadeiro brilha por um instante (o fluxo de chakra), então todos trocam de lugar algumas vezes, dois a dois. Toque no verdadeiro.
- **Vencer ou perder**: um toque; acertou, venceu. Para não ser cara ou coroa no fim, quem erra vê o verdadeiro se revelar (o clone tocado some em fumaça).
- **Controle**: um toque na figura escolhida (ou setas e Enter no desktop; cada figura é um botão).
- **Duração**: 5 a 8 segundos.
- **Dificuldade**: número de figuras, de trocas e velocidade da troca. Rascunho: 3 figuras e 4 trocas no Fácil; 4 e 5 no Médio; 4 e 7 no Difícil; 5 e 8 no Hardcore.
- **Gancho de status** (o mais natural dos 4): protagonista **Hyuuga** ou **Uchiha** (ou com o Sharingan / Byakugan desbloqueado) vê o fluxo durante toda a troca, mais fraco, em vez de só no começo. Suporte Hyuuga ou Uchiha na equipe dá um segundo brilho no meio das trocas. É o primeiro minijogo em que a classe muda a chance, e reforça a descoberta dos clãs ([classes.md](classes.md)).
- **Acessibilidade**: com menos movimento, cada troca é instantânea (as duas figuras trocam de lugar sem atravessar a fila), marcada por um traço entre as duas posições. O leitor anuncia o roteiro como texto ("O verdadeiro está na posição 2. Trocam 2 e 4. Trocam 1 e 2..."), uma troca por vez, e o jogo espera a leitura antes da próxima (variante sem pressa: o jogador toca **Próxima** a cada troca).
- **Eventos**: `gAkatsuki` (Caminho Ninja: a ilusão do Itachi espalha cópias do aliado; achar o verdadeiro para fugir, no lugar da Memória). Na História, nenhum evento atual pede clones sem forçar a cena; ver [Em aberto](#em-aberto).

## 4. Pegar o sino

**Base**: o teste do sino do Kakashi: pegar o guizo no instante em que ele se distrai.

- **Regra**: o mestre segura o sino e lê o livro. Em um momento sorteado (rng, entre 1,5 e 4 s), ele vira a página: é o **sinal** (o livro abre, um traço de "agora" e o texto "Agora!"). Toque depois do sinal e antes de ele levantar os olhos. **Melhor de 3**.
- **Vencer ou perder**: tocar antes do sinal é queimar a largada (perde a rodada); tocar depois da janela também perde. Ganhar 2 rodadas vence.
- **Controle**: um toque em qualquer ponto do tabuleiro (ou espaço / Enter).
- **Duração**: 6 a 12 segundos.
- **Dificuldade**: largura da janela depois do sinal. Rascunho: 900 / 700 / 550 / 450 ms. Para não punir a latência do toque no celular, a janela nunca fica abaixo de 400 ms.
- **Gancho de status**: o atributo de velocidade (iniciativa) do protagonista alarga a janela um pouco; ou uma relíquia de reflexo.
- **Acessibilidade**: o sinal é uma troca de desenho e de texto, sem deslocamento, então funciona com menos movimento sem mudança; o aparelho vibra no sinal quando permite (`navigator.vibrate`, opcional). O leitor de tela não anuncia a tempo um jogo de 500 ms, então a variante sem pressa troca o reflexo por leitura: o mestre "vira a página" e o jogador decide em cada uma de 5 páginas se **Espera** ou **Pega**; o texto descreve o olhar do mestre ("ainda lendo", "os olhos descem a página", "vira a página") e só uma delas é a certa.
- **Eventos**: `gGuru` (Caminho Ninja: o velho mestre propõe o teste do sino no lugar da Memória). A luta do teste do sino na História continua luta.

## Como fica a distribuição

| Evento | Modo | Hoje | Proposta |
|---|---|---|---|
| `sealScroll` | História | Sequência | Sequência (os selos do Kage Bunshin) |
| `treeClimbing` | História | Sequência | **Andar sobre a água** (pele de árvore) |
| `writtenTest` | História | Memória | Memória (colar na prova) |
| `toadSummon` | História | Sequência | Sequência (os selos da invocação) |
| `rasengan1` | História | Sequência | **Andar sobre a água** (balão d'água) |
| `rasengan2` | História | Sequência | **Kunai no alvo**, variante força (bola de borracha) |
| `rasenganTraining` | História | Sequência | Sequência (a combinação final) |
| `sasukeLeft` | História | Jokenpô | Jokenpô |
| `gTraining` | Caminho Ninja | Sequência | **Kunai no alvo** |
| `gJokenpo` | Caminho Ninja | Jokenpô | Jokenpô |
| `gGuru` | Caminho Ninja | Memória | **Pegar o sino** |
| `gAkatsuki` | Caminho Ninja | Memória | **O clone verdadeiro** |
| `gSummon` | Caminho Ninja | Sequência | Sequência (o contrato) |
| `gBadOmen` | Caminho Ninja | Sequência | Sequência, ou **Andar sobre a água** (em aberto) |

Resultado: Sequência de 9 para 5 opções (4 com o `gBadOmen` trocado), Memória de 3 para 1, Jokenpô 2, Andar sobre a água 2 ou 3, Kunai 2, Clone 1, Sino 1. A Sequência fica onde o selo **é** a cena (clone, invocação, selo de proteção). Os prêmios dos eventos não mudam: só o jogo que decide entre `effects` e `onLose`.

## O que muda no código

Nada disso está feito; é o roteiro da implementação, pela skill `nova-mecanica`.

- **Tipo**: `Minigame` em `src/core/jornada/events.ts` ganha `'kunai' | 'water' | 'clone' | 'bell'`; o `kunai` aceita uma pele (`skin?: 'target' | 'power'`) na opção do evento, e o `water` também (`'tree' | 'balloon' | 'lake'`). A pele é só apresentação (texto e desenho), não muda a regra.
- **Core** (`src/core/jornada/minigames.ts`, ou uma pasta `minigames/` se crescer): funções puras, sem DOM, com `rng()` injetado.
  - `kunaiRound(cfg, rng)`: devolve as velocidades e a fase inicial das 3 kunai; `kunaiScore(cfg, tick)`: zona e pontos de um toque no tick dado; `kunaiResult(pontos, cfg)`.
  - `waterScript(cfg, rng)`: as ondas por tick; `waterStep(estado, tocou, onda, cfg)`: o próximo estado (posição, tempo fora); `waterResult(estado, cfg)`.
  - `cloneScript(cfg, rng)`: posição inicial do verdadeiro e lista de trocas; `clonePosition(script)`: onde ele termina; `cloneCheck(script, escolha)`.
  - `bellScript(cfg, rng)`: o tick do sinal de cada rodada; `bellJudge(cfg, sinal, tick)`: `'early' | 'hit' | 'late'`.
  - As variantes sem pressa usam os mesmos roteiros, com o julgamento por passo em vez de por tick.
  - Os ganchos de status entram como um parâmetro `bonus` calculado a partir da run (`minigameBonus(run, kind, data)`), para a regra continuar pura.
- **Dados**: `minigames` em `src/data/jornada/balance.ts` ganha os números de cada jogo por dificuldade (`byDifficulty`). Hoje a dificuldade não pesa nos minijogos; essa seria a primeira vez (ver [Em aberto](#em-aberto)). Opções dos eventos trocadas em `src/data/jornada/events.ts`.
- **Textos**: `S.jornada.minigames` (`src/data/strings/jornada.ts`) com título, ajuda de uma linha, estados do leitor de tela e as falas das peles.
- **Tela**: `prototype/jornada/minigames.ts` ganha uma função por jogo (ou vira a pasta `prototype/jornada/minigames/`, um arquivo por jogo, com o `playMinigame` despachando). Um laço de `requestAnimationFrame` converte o tempo em tick e só desenha; o julgamento é do core. Estilos em `prototype/styles/minigames.css`, por tokens; durações por `--dur-*`. O interruptor "Minijogos sem pressa" vive no perfil e é lido pelo `playMinigame`.
- **Simulação**: o bot ganha hoje 60% de qualquer minijogo (`scripts/sim-jornada.ts`, `rng() < 0.6`). A proposta é manter 60% para todos, para a linha de base não mudar; se a dificuldade passar a pesar, a chance do bot vira um número por jogo e dificuldade em `balance` e a mudança vai com a tabela de antes e depois.
- **Testes**: em `tests/jornada.test.ts`, um por regra com seed fixa (zonas da kunai, tolerância da água, posição final do clone, largada queimada do sino) e que as variantes sem pressa têm solução.
- **UI Lab**: um cenário por jogo em `prototype/lab/`, para revisar celular, desktop, Pergaminho e Sumi.
- **Docs**: a tabela de [run.md](run.md#minijogos) ganha as 4 linhas; [cronologia.md](cronologia.md) e [caminho-ninja.md](caminho-ninja.md#eventos) trocam o minijogo das paradas; [plataforma.md](../base/plataforma.md#acessibilidade) ganha a variante sem pressa; CHANGELOG.

## Ordem sugerida

1. **Andar sobre a água** e **Kunai no alvo**: trocam 4 eventos da História, onde a repetição dos selos mais aparece.
2. **O clone verdadeiro**: o primeiro com efeito de classe; precisa do Caminho Ninja com Hyuuga e Uchiha.
3. **Pegar o sino**: o mais sensível a latência; vale testar no celular antes de fixar a janela.

## Em aberto

Perguntas para o usuário antes de implementar:

1. **A dificuldade pesa nos minijogos?** Hoje não pesa (os números são os mesmos do Fácil ao Hardcore). A proposta usa a dificuldade para apertar janelas e faixas; a alternativa é deixar igual em todas e só a Hardcore apertar.
2. **Ganchos de status**: ligar os 4 (chakra na água, clã no clone, velocidade no sino, relíquia na kunai) ou só o do clone, que é o mais temático?
3. **Clone e sino na História**: nenhum evento atual pede essas cenas. Opções: deixar os dois só no Caminho Ninja; ou dar a uma parada nova de treino (por exemplo, uma etapa de treino com o Kakashi antes do exame chunin) o sino, e ao `sealScroll` uma segunda opção de clone.
4. **`gBadOmen`**: o selo de proteção continua na Sequência ou vira Andar sobre a água no lago do santuário?
5. **Variante sem pressa**: ligada automaticamente com `prefers-reduced-motion`, ou só pelo interruptor das opções?
