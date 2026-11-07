# Run da Jornada

Estrutura de uma run: tipos de run, paradas, eventos e minijogos, dificuldade, salvamento e modo infinito.

## Tipos de run

- **História** (implementada na v0.35.0): a história do Naruto, **linear**, sem escolha de caminho. Estágios, paradas e confrontos em [historia.md](historia.md).
- **Caminho Ninja** (implementado na v0.36.0): mapa ramificado, parada "desconhecido", classes e encontros variados ([caminho-ninja.md](caminho-ninja.md)). Vencido, pode seguir no [modo infinito](#modo-infinito) (v0.44.0).

## Tela de início

De cima para baixo: o banner, o card **Progresso da Jornada** (quando há run salva: capítulo, parada, % de conclusão e o botão Continuar, com a dificuldade dela e, no modo infinito, o chip do ciclo), **Dificuldade da Jornada** (uma só, vale para as duas runs), um cartão da História e um do Caminho Ninja, cada um com o seu botão de começar. A dificuldade da run salva não muda: ela vale para a próxima run. O cartão do Caminho Ninja mostra o recorde do modo infinito a partir de um ciclo vencido. No fim, as **Conquistas recentes** (as 3 mais novas do perfil). A conclusão é `journeyProgress` (`src/core/jornada/run.ts`): na História, paradas feitas sobre todas; no Caminho Ninja, estágios vencidos mais as linhas andadas no mapa.

## Paradas

| Parada | O que acontece |
|---|---|
| História | Confronto do mangá, com quem estava lá (pode ser o Naruto sozinho) |
| Luta | Inimigos comuns; recompensa padrão ([progressao.md](progressao.md#recompensa-por-luta)) |
| Elite | Inimigo forte; mais ryō e XP, 1 ponto de talento e 1 relíquia ([reliquias.md](reliquias.md#de-onde-vêm)) |
| Chefe | Fim do estágio; escolher 1 de 3 relíquias de chefe, uma pode ser a evolução da inicial ([reliquias.md](reliquias.md)) |
| Evento | Duas escolhas, às vezes com minijogo; algumas dependem de escolhas anteriores |

| Descanso | Curar (+40 de HP e +12 de chakra em cada um) ou treinar (+1 ponto de talento; com a árvore completa, +30 ryō) |
| Tesouro | Relíquia sorteada pela classificação |
| Desconhecido | Só no Caminho Ninja: sorteia entre luta, evento ou outra parada |

- Na trilha, o caminho do estágio aparece inteiro abaixo de uma faixa com o local da parada atual ([visual.md](../visual.md)), com a legenda, e o retrato do herói marca a parada atual.
- Na trilha dá para abrir a árvore de talentos, o moveset e as relíquias a qualquer momento.
- **Moeda (ryō)**: ganha em lutas e eventos, gasta na [loja](#loja).

## Eventos

- **Condicionais e encadeados**: uma escolha deixa uma marca na run, e a marca muda paradas seguintes (proteger o Tazuna barateia a loja do País das Ondas em 20%).
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
- A Vontade do Fogo só existe no Fácil (1 por run, reposta a cada ciclo do modo infinito) e por relíquia: recomeça uma luta perdida.
- O Hardcore da Jornada libera ao vencer a História no Difícil.

## Salvamento

- A run **fica salva no aparelho** (`localStorage`, `jornada_run_v1`) a cada parada: uma Jornada dura mais que uma sessão. É a exceção ao "F5 reseta", só neste modo.
- Uma luta em andamento não é salva: o F5, ou o botão do Portão da Vila (torii, no cabeçalho, que volta ao menu sem recarregar), leva de volta ao começo da parada. O botão pede confirmação; ao continuar a Jornada, a run segue de onde parou.
- **Abandonar a jornada** acaba a run em derrota (entra no histórico; a Vontade do Fogo não é usada): pelo Abandonar do título do estágio, na trilha e no mapa, ou, desde a v0.57.2, pelo **Desistir** do turno do protagonista, no meio da luta. Os dois pedem confirmação.
- Começar uma nova jornada apaga a salva (a que já andou conta antes para o recorde do modo infinito); terminar também, com uma exceção: o **Caminho Ninja vencido** já salva o próximo ciclo, então fechar o app ou voltar ao início na tela de vitória não perde o modo infinito (o Continuar segue de lá).

## Loja

Sempre aberta (v0.50.0): o botão Loja fica no HUD, no mapa, na trilha e no descanso, sem gastar parada. Não abre no meio da luta. No widescreen (v0.57.1), a loja fica aberta na coluna da build, ao lado da trilha e do mapa, no lugar do botão; abrir conta como acesso (sorteia e salva o estoque), por isso o painel só existe quando aparece.

- **Estoque**: 3 relíquias por estágio, sorteadas no primeiro acesso e salvas na run: fechar e abrir, ou recarregar a página, não troca a prateleira. Muda só no estágio seguinte.
- **À venda**: relíquias, kits (20, 20 e 35 ryō), treino (+1 ponto de talento, 60 ryō; some com a [árvore completa](talentos.md#árvore-completa)) e tratamento (+50 de HP e +15 de chakra em cada um, 30 ryō).
- **Preço** = base × (1 + 0,10 × compras + 0,25 × estágios passados) × (1 − desconto), arredondado para baixo (`shop.perPurchase`, `shop.perStage`). Toda compra conta, na run inteira; os estágios somam entre os ciclos do [modo infinito](#modo-infinito). Relíquias de desconto vêm por cima, com teto de 40%.
- O treino e o tratamento não têm limite: quem segura é o preço.

## Mapa ramificado

Do Caminho Ninja ([caminho-ninja.md](caminho-ninja.md)), implementado na v0.36.0 (`src/core/jornada/map.ts`).

- Cada estágio é um mapa de **12 linhas** em 4 colunas, de baixo para cima: a linha 0 tem **3 começos**; as linhas do meio têm 2 a 4 nós; a última é o **chefe**, ligado a todos.
- Cada nó liga a 1 ou 2 nós da linha de cima (a coluna mais próxima); todo nó é alcançável e tem saída. Depois de cada parada, o jogador escolhe a próxima entre as ligadas à atual.
- Regras de linha: a linha 0 só tem lutas; a linha 6 só tesouros (um por rota); a penúltima só descansos; elite a partir da linha 2; descanso a partir da linha 3.
- Pesos dos outros nós: luta 53, desconhecido 22, elite 12, descanso 8.
- **Desconhecido**: ao entrar, vira evento (55%), luta (35%) ou tesouro (10%).
- **Na tela**: o mapa é uma carta em papel com o relevo da região e uma rosa dos ventos, com um leve deslocamento fixo em cada nó para não parecer uma grade, e os caminhos são curvos. A rota feita é uma pincelada vermelha, os caminhos disponíveis correm tracejados e o que já ficou para trás apaga. Cada tipo de nó é um carimbo com cor e forma próprias (luta em losango, elite estrelada, descanso e desconhecido redondos, mercador quadrado, tesouro dourado, chefe grande com o retrato). O retrato do herói marca a posição; a faixa do chefe sorteado fica no topo e a legenda, sempre visível, embaixo.

## Modo infinito

Só no **Caminho Ninja** e só no **Hardcore** (implementado na v0.44.0; só no Hardcore desde a v0.51.0; a História termina no Vale do Fim). Run antiga já em ciclo 2 ou mais em outra dificuldade termina o ciclo em que está. A vitória conta como hoje (conquistas de vitória, desbloqueios); depois dela, a tela oferece **Seguir para o ciclo N+1** ou Voltar ao início (a run fica salva para seguir depois).

- **Mantém**: nível, XP, talentos e níveis, técnicas e moveset, relíquias, ryō, bolsa, suportes e os elementos sorteados. As contas da run (lutas, vitórias, aliados caídos) somam.
- **Recomeça**: estágio 1, com **chefes e mapa sorteados de novo** (da seed e do ciclo), as marcas dos eventos limpas (os eventos voltam a ser novos) e a equipe cheia. A Vontade do Fogo volta ao mínimo da dificuldade (Fácil: 1), sem tirar as que sobraram.
- **Inimigos mais fortes**: HP, ataques e resistências × dificuldade × **1,5 ^ ciclo**, com o ciclo contando do 0 (`infinite.enemyCycleMult`; rascunho). Ciclo 2: ×1,5; ciclo 3: ×2,25; ciclo 4: ×3,4; ciclo 5: ×5,1.
- Pontos de talento que sobram com a árvore toda comprada viram ryō ([talentos.md](talentos.md#árvore-completa)).
- Com muitos ciclos as relíquias podem acabar: o tesouro fica vazio, a elite não deixa nada e o chefe não oferece escolha (o jogo segue).
- **Na tela**: chip "Ciclo N" no cabeçalho da trilha e do mapa (a dica mostra o +% dos inimigos), no Continuar e na tela final. Cair a partir do ciclo 2 não é uma derrota comum: "Fim do modo infinito", com o ciclo, o estágio e a parada alcançados.
- **Recorde** no perfil (`jornada.generic`: ciclo, estágio e se venceu o ciclo; [perfil.md](../base/perfil.md#recorde-do-modo-infinito)) e conquistas: Mais uma volta (vencer o ciclo 2), Treino sem fim (ciclo 3) e Vontade inabalável (ciclo 5).
