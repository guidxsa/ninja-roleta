# Run da Jornada

> Rascunho, não implementado ([README.md](README.md)).

Estrutura de uma run: estágios, mapa, paradas, eventos, dificuldade e salvamento.

## Estágios e mapa

- A run é dividida em **estágios**. Na canônica, um por arco da história, cada um com um **chefe fixo** no fim, o mesmo em qualquer caminho (ex.: Zabuza, Gaara, Orochimaru; o exame chunin vira uma parada especial).
- Cada estágio é um **mapa** com 3 começos e caminhos que às vezes seguem retos e às vezes se ramificam. Depois de cada parada, o jogador escolhe a próxima entre as ligadas à atual.
- O caminho feito fica marcado, e o mapa pode ser aberto a qualquer momento, com uma legenda dos tipos de parada.
- Vencer o chefe: escolher **1 entre 3 relíquias lendárias** ([reliquias.md](reliquias.md)) e seguir para o próximo estágio.
- **Moeda (ryō)**: ganha em lutas e eventos, gasta no mercador. Números a definir em `balance`.

## Paradas

Os nomes com sabor ninja ainda estão a definir.

| Parada | O que acontece |
|---|---|
| Desconhecido | Sorteia entre luta comum, evento (subtramas, encontros) ou outra parada |
| Inimigo | Luta contra inimigos comuns; recompensa padrão |
| Elite | Semichefe, mais forte; recompensa boa ou ótima |
| Mercador | Gastar ryō em relíquias, consumíveis e melhorias |
| Tesouro | Relíquia boa ou ótima; um por rota, perto do meio do mapa |
| Descanso | Escolher entre recuperar HP/chakra ou melhorar algo |
| Chefe | Fim do estágio; 3 relíquias lendárias à escolha |

## Eventos e recompensas interativas

- Eventos podem ser **condicionais** (dependem da classe, da equipe, de escolhas anteriores) e **encadeados** (uma escolha num estágio abre ou fecha eventos nos seguintes).
- Parte das recompensas vem de **minijogos** curtos, de um toque, em vez da roleta visual: jogo da memória, sequência de selos de mão, Jokenpô ([campanha.md](../roleta/campanha.md#jokenpô)).

## Dificuldade

- As 4 do Roleta ([campanha.md](../roleta/campanha.md#dificuldade)).
- A Vontade do Fogo só existe no Fácil (fora isso, só como relíquia).

## Salvamento

- A run **fica salva no aparelho** (`localStorage`) a cada parada: uma Jornada dura mais que uma sessão. É uma exceção ao "F5 reseta", só neste modo.
