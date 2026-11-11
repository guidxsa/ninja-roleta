# Combate do Roleta (enxuto)

> Implementado na v0.45.0 (Roleta enxuto I). Dados em `src/data/roleta/` (`balance.ts`, `techniques.ts`, `kits.ts`); regras em `src/core/roleta/battle.ts`. O combate clássico (reações, disputa, barreiras, estados elementais, efeitos mentais com fuga, linhas elementais, kits completos) ficou guardado como reserva para a Jornada: [reserva/README.md](../reserva/README.md).

O Roleta é o modo rápido: lutas curtas, decisões simples e muita roleta. Acerto, crítico, dano, resistência e dificuldade seguem a base ([fundamentos.md](../base/fundamentos.md)); aqui fica o que é do Roleta.

## Turno

- **Iniciativa**: uma roleta no começo da luta (speed² contra speed²). Ramen e Velhinha trocam a roleta por vantagem ou desvantagem.
- **Um toque por turno**: uma técnica, **Defender** (resistência inteira até o próximo turno), **Concentrar** (+30% do chakra máximo) ou um **item**.
- **Ativa da linhagem**: grátis, uma por turno, com usos por luta (botão acima das ações).
- Sem painel de reação: a defesa é automática.

## Acerto, esquiva e dano

- **Uma roleta por técnica** (Erro / Acerto / Crítico). Técnica de vários golpes resolve todos na mesma roleta: acerto, erro ou crítico vale para a técnica inteira. Os golpes extras dos Espelhos (Haku, Irmãos Demônio) seguem a mesma regra.
- **Esquiva** (a antiga Substituição, agora passiva): 5% + 2% por ponto de speed acima de quem ataca, entre 0% e 30%. Sai da chance de acerto de quem ataca.
- **Dano** = base da técnica + ataque do tipo − resistência × fração (0,4 sem fazer nada; 1 ao Defender), × 2 no crítico. **Sem multiplicador de elemento**: o elemento só diz quem tem a técnica.
- Genjutsu fere com o genjutsu contra a resistência mental; taijutsu e ninjutsu, contra a física.

## Efeitos

Quatro, com duração fixa (turnos de quem sofre), sem roleta de fuga nem tenacidade.

| Efeito | Duração | O que faz |
|---|---|---|
| Queimar | 2 | Perde 5% do HP máximo no começo do turno |
| Veneno | 3 | Perde 4% do HP máximo no começo do turno |
| Atordoar | 1 | Perde o próximo turno |
| Medo | 2 | −25% de dano e −15% de acerto |

O sangramento virou veneno; prisão, sono, possessão e congelar viraram atordoar; confusão e tormento viraram medo.

## Chakra e itens

- Técnicas custam chakra; o taijutsu básico é grátis. No começo de cada rodada, o jogador recupera **3%** do chakra máximo e o vilão **5%** (mínimo 1), sem pausa na tela.
- **Economia de chakra** (v0.59.0, proposta): as técnicas custam o dobro de antes (6 nas de elemento e de clã, inclusive as Presas Giratórias do Inuzuka; 4 nas outras de taijutsu de clã, a Mão Expandida, a Folha Furacão e o Selo dos Pontos Vitais; 8 nas mais fortes, 7 na Madeira; os valores de cada uma estão na tabela de técnicas), a regeneração do jogador caiu de 5% para 3% e Concentrar subiu de 25% para 30%. O vilão segue com o ritmo antigo (5% e 25%), para a mudança não mexer na força dele.
- Itens na luta: Pílula de soldado (+50% do chakra), Kit médico (limpa os efeitos e cura 15%), Selo explosivo (15 de dano, sem roleta), Bomba de fumaça (esquiva garantida do próximo ataque).
- **Vontade do Fogo**: ao cair, volta com HP e chakra cheios ([fundamentos.md](../base/fundamentos.md#vontade-do-fogo-revive)).

## Técnicas

Fixas pela origem e **sobem sozinhas com o nível**: dano base = base + por nível × (nível − 1), mais a Ferramenta ninja. Não há upgrade à escolha, linha elemental nem técnica nova por recompensa.

- Todo mundo: **Taijutsu básico**.
- Quem pode usar ninjutsu (todos, menos o Prodígio): **Bunshin no Jutsu** (v0.59.0). Cria um clone (no máximo 1); cada golpe do vilão tem 50% de chance de cair no clone, que some ao receber dano (`balance.clones`, a mesma regra da Jornada; queimar e veneno não pegam o clone).
- **A técnica da natureza**, só nas origens de ninjutsu elemental (Comum, Uzumaki, Senju, Uchiha); as outras têm natureza, mas sem técnica.
- **Kekkei genkai** (Mokuton do Senju): uma técnica própria; ela é a natureza.
- As técnicas da linhagem.

| Técnica | Quem | Tipo | Dano (por nível) | Golpes | Chakra | Precisão | Extra |
|---|---|---|---|---|---|---|---|
| Taijutsu básico | todos | taijutsu | 8 (+1) | 1 | 0 | 90% | — |
| Bunshin no Jutsu | quem usa ninjutsu | ninjutsu | — | — | 5 | — | cria um clone (até 1) |
| Bola de Fogo | fogo | ninjutsu | 12 (+2) | 1 | 6 | 85% | 25% de Queimar |
| Lâmina de Vento | vento | ninjutsu | 11 (+2) | 1 | 6 | 90% | +10% de crítico |
| Corrente Elétrica | raio | ninjutsu | 13 (+2) | 1 | 6 | 80% | ignora 25% da resistência |
| Punho de Rocha | terra | ninjutsu | 11 (+2) | 1 | 6 | 95% | 10% de Atordoar |
| Projéteis d'Água | água | ninjutsu | 6 (+1) | 2 | 6 | 90% | — |
| Sombra Cortante | Nara | ninjutsu | 10 (+2) | 1 | 6 | 85% | — |
| Mão Expandida | Akimichi | taijutsu | 11 (+2) | 1 | 4 | 85% | 10% de Atordoar |
| Pétalas Ilusórias | Yamanaka | genjutsu | 10 (+2) | 1 | 6 | 85% | 30% de Medo |
| Enxame | Aburame | ninjutsu | 5 (+1) | 2 | 8 | 85% | 50% de Veneno |
| Presas Giratórias | Inuzuka | taijutsu | 6 (+1) | 2 | 6 | 85% | — |
| Folha Furacão | prodígio | taijutsu | 6 (+1) | 2 | 4 | 90% | — |
| Ilusão da Dor | Uchiha | genjutsu | 13 (+2) | 1 | 6 | 85% | 20% de Medo |
| Selo dos Pontos Vitais | Hyuuga | taijutsu | 9 (+2) | 1 | 4 | 85% | 20% de Atordoar |
| Agulhas de Gelo | gelo (guardada) | ninjutsu | 5 (+1) | 3 | 6 | 90% | 15% de Atordoar |
| Shuriken de Areia | areia (guardada) | ninjutsu | 12 (+2) | 1 | 6 | 95% | começa a luta com escudo de 10% do HP |
| Bolha de Lava | lava (guardada) | ninjutsu | 14 (+2) | 1 | 6 | 85% | 30% de Queimar |
| Laser da Tempestade | tempestade (guardada) | ninjutsu | 7 (+1) | 2 | 6 | 85% | ignora 20% da resistência |
| Névoa Ácida | vapor (guardada) | ninjutsu | 10 (+2) | 1 | 6 | 90% | 30% de Veneno |
| Bomba de Argila | explosão (guardada) | ninjutsu | 20 (+3) | 1 | 8 | 70% | — |
| Raízes de Madeira | madeira | ninjutsu | 10 (+2) | 1 | 7 | 90% | recupera 50% do dano como HP |

## Kits

Uma passiva e uma ativa simples por linhagem. A ativa é grátis (uma por turno) e dura 3 rodadas contando a da ativação, quando tem duração.

Yamanaka, Nara e Aburame saíram do sorteio na v0.52.0: funcionam melhor como suporte e ficam guardados para a Jornada (`retiredLineages`). Os kits continuam na tabela e nos dados.

| Linhagem | Passiva | Ativa (usos por luta) |
|---|---|---|
| Comum | Determinação: +25% de XP; +1 no maior ataque por nível | Esforço (1): +3 nos três ataques |
| Nara (guardado) | Gênio: vê a próxima ação do vilão | Imitação de Sombra (2): 80% de chance de atordoar |
| Akimichi | Corpo pesado: +15% de dano de taijutsu | Expansão (1): taijutsu ×1,3 e +3 de resistência física |
| Yamanaka (guardado) | Leitura mental: o vilão tem −10% de acerto | Transferência de Mente (1): 75% de chance; o vilão perde a vez e se fere com a técnica mais forte dele (não pega quem é imune a genjutsu) |
| Aburame (guardado) | Colônia: o Enxame pode envenenar | Praga (1): envenena; o veneno dói em dobro e o Enxame sempre envenena |
| Inuzuka | Dupla: 25% de chance de o cão bater junto (40% do dano) | Fera de quatro patas (1): +3 de speed e Dupla com 60% |
| Prodígio | Juventude: +5% de crítico; sem ninjutsu e genjutsu | Portões: taijutsu ×1,3 enquanto abertos; abrir custa 4 de chakra e manter custa 2, 3, 5, 7, 11... por rodada; sem chakra, fecham sozinhos; podem reabrir ([fundamentos.md](../base/fundamentos.md#portões)) |
| Uchiha | Olhos treinados: imune a Medo | Sharingan (1): +15% de acerto, +10% de esquiva e +3 nos ataques |
| Hyuuga | Punho preciso: o taijutsu ignora 30% da resistência | Byakugan (1): o taijutsu não erra (o crítico rola) |
| Uzumaki | Vitalidade: recupera 2% do HP por rodada | Selamento (1): o vilão perde a próxima ação |
| Senju | +1 Vontade do Fogo; Força vital: uma vez por luta, abaixo de 30% do HP, recupera 4% por rodada por 3 rodadas | — |
| Jinchuuriki | Manto: uma vez por luta, abaixo de 50% do HP, ataques ×1,5 por 3 rodadas; imune a Medo | — |

Invocações (até a v0.46.0, quando viram relíquias): sapo (6% do HP máximo do vilão como dano verdadeiro por ataque que acerta, +2% por nível), cobra (envenena no acerto), lesma (recupera 3% do HP por rodada, +1% por nível).

## Vilões

Mesmas fichas ([viloes.md](../base/viloes.md)), com a dificuldade aplicada. Escolhem a técnica por peso entre as que podem pagar; sem chakra, concentram.

- Golpe carregado vira técnica comum; barreiras saem; a cura do Kabuto continua.
- Genjutsu sem dano (Onda sonora, Flauta, Intenção assassina) aplica **Medo** se acertar.
- Passivas que ficam: Enganador (Mizuki escapa uma vez com 1 de HP), Espelhos (Haku age duas vezes com 60% do dano), Névoa (a chance de erro do jogador ×1,5 nas primeiras rodadas), Manto e marca da maldição (abaixo do limiar: dano e resistência maiores e cura por rodada), Shukaku no hardcore (volta como monstro com outras técnicas), Bisturi (crítico a mais; no hardcore envenena e fura a resistência), Insano (Orochimaru envenena e volta com 50% do HP; no hardcore, no máximo 3 vezes).

## Na tela

- Painel do vilão com HP, chakra, resistências, speed, passiva, técnicas e efeitos; a próxima ação aparece só para o Nara.
- Ações em seções, todas visíveis: **Técnicas**, **Ações** (Defender e Concentrar) e **Consumíveis** (só com item na bolsa). Cada botão de técnica mostra o dano no nível atual (×golpes), a chance de acerto e o custo; efeitos e regras ficam na dica.
- A ativa tem botão próprio no topo das Técnicas, com os usos que sobram.
- Ritmo: a regeneração de chakra é silenciosa, e cada técnica gira uma roleta só.

## Simulação

`npm run sim` e `npm run sim:origens` medem o Roleta enxuto (bot simples: o golpe de mais dano esperado, a ativa logo, itens nos apertos). O clássico continua em `npm run sim:classico`.
