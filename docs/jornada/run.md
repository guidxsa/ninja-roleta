# Run da Jornada

Estrutura de uma run: tipos de run, paradas, eventos e minijogos, dificuldade e salvamento.

## Tipos de run

- **História** (implementada na v0.35.0): a história do Naruto, **linear**, sem escolha de caminho. Estágios, paradas e confrontos em [historia.md](historia.md).
- **Caminho Ninja** (implementado na v0.36.0): mapa ramificado, parada "desconhecido", classes e encontros variados ([caminho-ninja.md](caminho-ninja.md)).

## Tela de início

De cima para baixo: Continuar (quando há run salva, com a dificuldade dela), **Dificuldade da Jornada** (uma só, vale para as duas runs), um cartão da História e um do Caminho Ninja, cada um com o seu botão de começar. A dificuldade da run salva não muda: ela vale para a próxima run.

## Paradas

| Parada | O que acontece |
|---|---|
| História | Confronto do mangá, com quem estava lá (pode ser o Naruto sozinho) |
| Luta | Inimigos comuns; recompensa padrão ([progressao.md](progressao.md#recompensa-por-luta)) |
| Elite | Inimigo forte; mais ryō e XP, 1 ponto de talento e 1 relíquia ([reliquias.md](reliquias.md#de-onde-vêm)) |
| Chefe | Fim do estágio; escolher 1 de 3 relíquias de chefe, uma pode ser a evolução da inicial ([reliquias.md](reliquias.md)) |
| Evento | Duas escolhas, às vezes com minijogo; algumas dependem de escolhas anteriores |
| Mercador | Relíquias, consumíveis, treino (+1 ponto de talento, 60 ryō) e tratamento (cura 50% da equipe, 30 ryō) |
| Descanso | Curar 40% da equipe ou treinar (+1 ponto de talento) |
| Tesouro | Relíquia sorteada pela classificação |
| Desconhecido | Só no Caminho Ninja: sorteia entre luta, evento ou outra parada |

- Na trilha, o caminho do estágio aparece inteiro, com a legenda, e a parada atual fica marcada.
- Na trilha dá para abrir a árvore de talentos, o moveset e as relíquias a qualquer momento.
- **Moeda (ryō)**: ganha em lutas e eventos, gasta no mercador.

## Eventos

- **Condicionais e encadeados**: uma escolha deixa uma marca na run, e a marca muda paradas seguintes (proteger o Tazuna barateia o mercador do País das Ondas em 20%).
- Os eventos da História estão em [historia.md](historia.md#eventos).

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
- O Hardcore da Jornada libera ao vencer a História no Difícil.

## Salvamento

- A run **fica salva no aparelho** (`localStorage`, `jornada_run_v1`) a cada parada: uma Jornada dura mais que uma sessão. É a exceção ao "F5 reseta", só neste modo.
- Uma luta em andamento não é salva: o F5 volta para o começo da parada.
- Começar uma nova jornada apaga a salva; terminar (vitória ou derrota) também.

## Mapa ramificado

Do Caminho Ninja ([caminho-ninja.md](caminho-ninja.md)), implementado na v0.36.0 (`src/core/jornada/map.ts`).

- Cada estágio é um mapa de **12 linhas** em 4 colunas, de baixo para cima: a linha 0 tem **3 começos**; as linhas do meio têm 2 a 4 nós; a última é o **chefe**, ligado a todos.
- Cada nó liga a 1 ou 2 nós da linha de cima (a coluna mais próxima); todo nó é alcançável e tem saída. Depois de cada parada, o jogador escolhe a próxima entre as ligadas à atual.
- Regras de linha: a linha 0 só tem lutas; a linha 6 só tesouros (um por rota); a penúltima só descansos; elite a partir da linha 2; descanso a partir da linha 3; mercador nunca logo depois de mercador.
- Pesos dos outros nós: luta 45, desconhecido 22, elite 12, mercador 8, descanso 8.
- **Desconhecido**: ao entrar, vira evento (50%), luta (30%), mercador (10%) ou tesouro (10%).
- Na tela, os nós feitos ficam marcados, os que dá para escolher pulsam e o chefe sorteado aparece no topo com o retrato.
