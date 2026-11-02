# Run da Jornada

Estrutura de uma run: tipos de run, paradas, eventos e minijogos, dificuldade e salvamento.

## Tipos de run

- **Canônica** (implementada na v0.35.0): a história do Naruto, **linear**, sem escolha de caminho. Estágios, paradas e confrontos em [canonica.md](canonica.md).
- **Genérica** (rascunho, não implementada): é a que aproveita o mapa ramificado, a parada "desconhecido", as classes e os encontros variados (ver abaixo).

## Paradas

| Parada | O que acontece |
|---|---|
| História | Confronto do mangá, com quem estava lá (pode ser o Naruto sozinho) |
| Luta | Inimigos comuns; recompensa padrão ([progressao.md](progressao.md#recompensa-por-luta)) |
| Elite | Inimigo forte; mais ryō e XP e 1 ponto de talento |
| Chefe | Fim do estágio; escolher 1 de 3 relíquias lendárias ([reliquias.md](reliquias.md)) |
| Evento | Duas escolhas, às vezes com minijogo; algumas dependem de escolhas anteriores |
| Mercador | Relíquias, consumíveis, treino (+1 ponto de talento, 60 ryō) e tratamento (cura 50% da equipe, 30 ryō) |
| Descanso | Curar 40% da equipe ou treinar (+1 ponto de talento) |
| Tesouro | Relíquia sorteada pela raridade |
| Desconhecido | Só nas runs genéricas: sorteia entre luta, evento ou outra parada |

- Na trilha, o caminho do estágio aparece inteiro, com a legenda, e a parada atual fica marcada.
- Na trilha dá para abrir a árvore de talentos, o moveset e as relíquias a qualquer momento.
- **Moeda (ryō)**: ganha em lutas e eventos, gasta no mercador.

## Eventos

- **Condicionais e encadeados**: uma escolha deixa uma marca na run, e a marca muda paradas seguintes (proteger o Tazuna barateia o mercador do País das Ondas em 20%).
- Os eventos da run canônica estão em [canonica.md](canonica.md#eventos).

## Minijogos

Recompensas interativas no lugar da roleta visual. Ganhar dá o prêmio do evento; perder dá um prêmio menor.

| Minijogo | Regra |
|---|---|
| Memória | 6 pares de selos de mão; pode errar 5 vezes |
| Sequência de selos | Decore 5 selos mostrados um a um e repita na ordem, entre 8 opções; um erro perde |
| Jokenpô | Pedra, papel ou tesoura; empate joga de novo |

## Dificuldade

- As 4 do Roleta ([campanha.md](../roleta/campanha.md#dificuldade)), com a mesma força nos inimigos.
- A Vontade do Fogo só existe no Fácil (1 por run) e por relíquia: recomeça uma luta perdida.
- O Hardcore da Jornada libera ao vencer a run canônica no Difícil.

## Salvamento

- A run **fica salva no aparelho** (`localStorage`, `jornada_run_v1`) a cada parada: uma Jornada dura mais que uma sessão. É a exceção ao "F5 reseta", só neste modo.
- Uma luta em andamento não é salva: o F5 volta para o começo da parada.
- Começar uma nova jornada apaga a salva; terminar (vitória ou derrota) também.

## Mapa ramificado (runs genéricas)

Rascunho, ainda não implementado:

- Cada estágio é um mapa com 3 começos e caminhos que às vezes seguem retos e às vezes se ramificam. Depois de cada parada, o jogador escolhe a próxima entre as ligadas à atual.
- Tesouro um por rota, perto do meio; descanso antes do chefe; chefe fixo no fim, o mesmo em qualquer caminho.
- Encontros diferentes dos da canônica, com a mesma dificuldade.
