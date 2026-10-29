# Origens

A origem do personagem é sorteada no início da run: linhagem, afinidade elemental e jinchuuriki. Ela define os status iniciais, as técnicas de partida e as habilidades exclusivas.

## Sorteio

1. **Roleta de linhagem**: uma roleta só, com três níveis de raridade (a cor da fatia indica o nível).
2. **Afinidade**: se a linhagem não tem afinidade fixa, rola um dos 5 elementos (pesos iguais).
3. **Jinchuuriki**: roleta independente, **10%**. Acumula com qualquer linhagem.

| Nível | Linhagem | Peso |
|---|---|---|
| Comum | Comum | 30 |
| Clã | Nara | 8 |
| Clã | Akimichi | 8 |
| Clã | Yamanaka | 8 |
| Clã | Aburame | 8 |
| Clã | Inuzuka | 8 |
| Rara | Prodígio do taijutsu | 9 |
| Rara | Uchiha | 7 |
| Rara | Hyuuga | 7 |
| Rara | Uzumaki | 7 |

Total: 30% comum, 40% clã, 30% rara.

### Re-roll

- Infinito, só na tela de origem, antes da primeira luta.
- Cada re-roll conta como campanha nova e entra no histórico com status "re-roll".

## Status iniciais

O ponto de partida é um **orçamento de 90 pontos**: 70 em status mais **20 em resistências**. Conversão: tai, nin, gen e as duas resistências valem 1 ponto; speed vale 1,5; 10 de HP vale 1; 2 de chakra valem 1.

Na simulação, os pontos não valem o mesmo na prática: genjutsu e resistência mental pesam menos que corpo e HP. Por isso a v0.18 recalibrou algumas origens fora do orçamento (coluna "Pontos"), para que nenhuma fique muito acima ou abaixo das outras.

| Origem | Tai | Nin | Gen | Res. física | Res. mental | Speed | HP | Chakra | Afinidade | Pontos |
|---|---|---|---|---|---|---|---|---|---|---|
| Comum | 10 | 10 | 10 | 10 | 10 | 10 | 100 | 30 | Rolada | 90 |
| Nara | 10 | 13 | 8 | 10 | 10 | 9 | 105 | 32 | Rolada | 91 |
| Akimichi | 15 | 8 | 5 | 14 | 6 | 6 | 145 | 34 | Rolada | 88,5 |
| Yamanaka | 10 | 9 | 15 | 10 | 14 | 10 | 110 | 30 | Rolada | 99 |
| Aburame | 8 | 12 | 10 | 9 | 11 | 8 | 110 | 34 | Rolada | 90 |
| Inuzuka | 14 | 8 | 6 | 12 | 8 | 13 | 95 | 24 | Rolada | 89 |
| Prodígio do taijutsu | 17 | 0 | 0 | 11 | 9 | 12 | 110 | 28 | Nenhuma | 80 |
| Uchiha | 12 | 9 | 12 | 10 | 10 | 10 | 105 | 26 | Fogo (fixa) | 91,5 |
| Hyuuga | 16 | 6 | 8 | 11 | 9 | 11 | 100 | 27 | Rolada | 90 |
| Uzumaki | 10 | 11 | 6 | 12 | 8 | 9 | 105 | 35 | Rolada | 88,5 |

Lógica das resistências (provisória): clãs de corpo (Akimichi, Inuzuka, Uzumaki) puxam para a física; clãs de mente e ilusão (Yamanaka) puxam para a mental. O prodígio tem a mental mais baixa que a física: é um alvo natural de genjutsu, como na série.

Jinchuuriki soma **+100% de chakra máximo** sobre a origem.

## Habilidades por linhagem

Visão geral. Detalhes de cada técnica em [tecnicas.md](tecnicas.md).

| Origem | Passiva | Ativa | Kit inicial | Exclusivas | Restrições |
|---|---|---|---|---|---|
| Comum | Determinação | Esforço | Punho de Chakra, ninjutsu básico | — | — |
| Nara | Gênio, Sombra costurada | — | Punho de Chakra, ninjutsu básico, Imitação de Sombra | Imitação de Sombra | — |
| Akimichi | Corpo pesado | Expansão, Pílulas do clã | Punho de Chakra, ninjutsu básico | Rolo Colossal (nível 4) | — |
| Yamanaka | Leitura mental, Mente no controle | Transmissão mental | Punho de Chakra, ninjutsu básico, Transferência de Mente | Transferência de Mente | — |
| Aburame | Colônia | Devorar | Punho de Chakra, ninjutsu básico, Enxame | Enxame | — |
| Inuzuka | Dupla | Fera de quatro patas | Punho de Chakra, ninjutsu básico, Presas Giratórias | Presas Giratórias | — |
| Prodígio do taijutsu | Corpo de ferro | Portões (com Forçar) | Punho de Chakra | Redemoinho da Folha (4), Lótus Primaveril (7) | Sem ninjutsu, genjutsu e médico |
| Uchiha | Olhos treinados | Sharingan, Cópia | Punho de Chakra, Fagulha do Dragão, Olhar Hipnótico, Ilusão da Dor | Ilusões de dano, Tsukuyomi (nível 7) | — |
| Hyuuga | Punho preciso | Byakugan | Punho de Chakra, ninjutsu básico | Selo dos Pontos Vitais, Rotação (nível 4), 64 Palmas (nível 7) | — |
| Uzumaki | Vitalidade | Selamento | Punho de Chakra, ninjutsu básico | Correntes de Chakra (nível 4) | — |

"Ninjutsu básico" = o nível I da linha de ataque do elemento sorteado (ver [tecnicas.md](tecnicas.md#linhas-de-ataque)).

Toda **ativa** de linhagem é uma **escolha grátis**: ativa junto com a ação da rodada, sem gastar o turno, se houver chakra para as duas ([fundamentos.md](fundamentos.md)).

## Detalhe por linhagem

### Comum

- **Determinação** (passiva): +25% de XP ganho e, a cada nível, **+1 no maior status de ataque** (empate: taijutsu, ninjutsu, genjutsu). Combina com o nível sem limite: o comum não nasce forte, mas cresce mais rápido.
- **Esforço** (ativa): escolha grátis, sem custo de chakra. **+3 em taijutsu, ninjutsu e genjutsu** por 3 rodadas, contando a da ativação. **1 uso por luta, +1 nos níveis 4 e 7**: o comum cresce treinando.

### Nara (sombras)

- **Gênio** (passiva com usos): a tela mostra a próxima ação do vilão antes de o jogador escolher a sua. E, **2 vezes por luta (+1 nos níveis 4 e 7)**, uma escolha grátis (não gasta o turno) arma a próxima roleta do Nara: ela gira duas vezes e fica com o melhor resultado. Vale para acerto (de golpes, genjutsu e Imitação de Sombra), Substituição e disputa.
- **Imitação de Sombra**: ninjutsu sem dano que prende o alvo (efeito Aprisionado). Por ser ninjutsu, funciona contra quem é imune a genjutsu (Gaara).
- **Sombra costurada**: com o vilão preso pela Imitação de Sombra, uma escolha grátis **mantém a sombra**: naquela vez, a roleta de fuga dele não gira ([efeitos.md](efeitos.md#duração-dos-efeitos-mentais)). Custa **3 de chakra, +1 a cada vez já mantida** (3, 4, 5...). Não soma tenacidade (não é um controle novo). Controle longo, mas caro.

### Akimichi (expansão)

- **Corpo pesado** (passiva): dano de taijutsu × (0,7 + 0,4 × HP atual / HP máximo). ×1,1 com HP cheio, ×0,7 perto de zero.
- **Expansão** (ativa): **escolha grátis** (não gasta o turno) que custa 6 de chakra. Por 3 rodadas, contando a da ativação: taijutsu ×1,5 e speed −3. Pode ser usada de novo quando acabar.
- **Rolo Colossal** (nível 4): taijutsu exclusivo.
- **Pílulas do clã** (ativa): escolha grátis, sem chakra, **1 vez por luta**. Gira uma roleta pura das 3 pílulas; o efeito vale 3 rodadas, contando a da ativação, e multiplica junto com a Expansão. O HP pago nunca deixa abaixo de 1.

  | Pílula | Chance | Efeito | Custo |
  |---|---|---|---|
  | Verde | 50% | Taijutsu ×1,3 | 10% do HP máximo |
  | Amarela | 35% | Taijutsu ×1,6 e resistência física +3 | 20% |
  | Vermelha | 15% | Taijutsu ×2 e speed +3 | 30%; quando acaba, fica **exausto** por 2 rodadas (taijutsu ×0,5, speed −3) |

### Yamanaka (mente)

- **Leitura mental** (passiva): ataques do vilão contra o Yamanaka têm −10 de acerto.
- **Mente no controle** (passiva): com o vilão possuído, o Yamanaka escolhe qual técnica de dano ele usa em si mesmo, e o vilão **paga o chakra** dela. Sem escolha, ele usa a de mais dano que puder pagar. Técnica que ele não pode pagar não entra nas opções.
- **Transmissão mental** (ativa): escolha grátis, 5 de chakra. Só contra um **golpe carregado** anunciado: rola o acerto de genjutsu do Yamanaka contra a resistência mental do vilão (como um genjutsu). Se pegar, o golpe se perde (o chakra já foi gasto) e o vilão perde a vez. **1 uso por luta, +1 nos níveis 4 e 7.** Não funciona em quem é imune a genjutsu.
- **Transferência de Mente**: genjutsu inicial com efeito **Possessão**: o vilão perde a vez golpeando a si mesmo com a própria técnica de dano mais forte ([efeitos.md](efeitos.md#efeitos-de-genjutsu)). É o potencial ofensivo do Yamanaka: quanto mais forte o vilão, mais ele se fere. Junto com o Uchiha, é a única origem que nasce com genjutsu.

### Aburame (insetos)

- **Colônia** (passiva): cada golpe que acerta drena 2 de chakra do vilão e deixa **1 inseto** nele (até 10).
- **Devorar** (ativa): escolha grátis, 3 de chakra, com ao menos 1 inseto no vilão. Consome todos os insetos: cada um drena **3 de chakra**; os que sobram com o vilão sem chakra causam **2 de dano direto** cada (sem resistência). Vilão sem chakra fica só com as técnicas que não custam chakra.
- **Enxame**: ninjutsu neutro de 4 golpes pequenos. O acerto rola uma vez para os 4 golpes; cada golpe que acerta drena chakra e deixa um inseto pela Colônia.

### Inuzuka (parceiro canino)

- **Dupla** (passiva): depois de cada ataque do jogador que acerta, 25% de chance de o cão atacar também (taijutsu, 40% do dano base do ataque, rola acerto próprio).
- **Fera de quatro patas** (ativa): escolha grátis, 5 de chakra. Por 3 rodadas, contando a da ativação: **speed +3**, a Dupla ataca com **60%** de chance e a Substituição usa o cão como **isca** (custa o chakra, mas não gasta usos). Pode ser usada de novo quando acabar.
- **Presas Giratórias**: taijutsu inicial de 2 golpes.

### Prodígio do taijutsu (estilo Lee)

- **Corpo de ferro** (passiva): contra **taijutsu**, a reação Resistir usa 100% da resistência física (como em postura defensiva). Contra ninjutsu, Resistir normal (70%).
- **Portões** (ativa): uma vez por luta (2 no nível 7). Abrir é uma **escolha grátis** (não gasta o turno); o bônus vale por 3 rodadas, contando a da abertura. Abre o maior portão liberado pelo taijutsu atual. Custa chakra e HP (nunca abaixo de 1).

  | Portão | Taijutsu mínimo | Dano de taijutsu | Chakra | HP |
  |---|---|---|---|---|
  | 1º | 17 (inicial) | ×1,3 | 5 | 20% do máximo |
  | 2º | 21 | ×1,5 | 7 | 25% |
  | 3º | 25 | ×1,7 | 9 | 30% |
  | 4º | 29 | ×1,9 | 11 | 35% |

- **Forçar os portões**: junto com a abertura, o jogador pode tentar abrir **um portão além do liberado**, numa roleta de risco. Chance = **50% + 3% por ponto de taijutsu acima do mínimo do portão forçado** (abaixo dele, a chance cai), entre 20% e 80% (+10% no nível 4). Abriu: paga o custo do portão forçado. Falhou: abre o liberado e perde mais **10% do HP máximo**.

- Nunca aprende ninjutsu, genjutsu ou ninjutsu médico; a roleta de recompensas é filtrada.
- Sem ninjutsu, não disputa nem ergue barreiras. Responde a ninjutsu com Resistir ou Substituição; contra escudos, o taijutsu é neutro ([fundamentos.md](fundamentos.md#escudos)).

### Uchiha

- **Olhos treinados** (passiva): +6 na resistência mental ao resistir a ilusões.
- **Ilusão da Dor**: genjutsu de dano do kit inicial (15 de dano base; fere com genjutsu contra a resistência mental). No nível 7, **Tsukuyomi** (só com o Sharingan): 22 de dano e aprisiona.
- **Sharingan** (ativa, dōjutsu): ativar é uma **escolha grátis** (não gasta o turno) que custa 4 de chakra; manutenção 1 por rodada, dura 5 rodadas ou até faltar chakra. Evolui com o nível.

  | Estágio | Nível | Tai/Nin/Gen | Speed | Genjutsu: acerto / poder | Leitura de movimento |
  |---|---|---|---|---|---|
  | 1 tomoe | 1 | +3 | +1 | +10% / +3 | 20% |
  | 2 tomoe | 4 | +5 | +2 | +15% / +6 | 25% |
  | 3 tomoe | 7 | +7 | +3 | +20% / +9 | 30% |

  Leitura de movimento: chance de reduzir à metade o dano recebido.
- Cada genjutsu do Uchiha aplica o próprio efeito (não há mais o modo Pavor do Sharingan; o Pavor vem do Teatro do Pavor). O poder do Sharingan soma no dano das ilusões.
- **Cópia** (ativa, com o Sharingan ligado): escolha grátis que custa **3 de chakra** por tentativa e rola a chance do estágio do Sharingan: **50% / 65% / 80%** (1, 2 e 3 tomoe).
  - **No turno** (não gasta o turno): copia a última técnica de taijutsu ou ninjutsu de dano que o vilão usou na luta.
  - **Na reação** (não gasta a reação): copia a técnica de taijutsu ou ninjutsu que está vindo, junto com Resistir, Substituição ou disputa.
  - A técnica copiada fica entre as técnicas do Uchiha **até o fim da luta**, com o dano base, os golpes, a precisão e o elemento da original, os status dele e o custo de chakra dela. Uma cópia por vez: copiar outra substitui. Genjutsu, barreiras e curas não são copiados.

### Hyuuga

- **Punho preciso** (passiva): taijutsu ignora 30% da resistência física do alvo (conta como penetração).
- **Byakugan** (ativa, dōjutsu): **escolha grátis** (não gasta o turno); ativar 3, manutenção 1, dura 5 rodadas (7 a partir do nível 4). Ativo: taijutsu não erra (crítico ainda rola), taijutsu ×1,1, **ignora a evasão da névoa** do Zabuza, o **genjutsu do vilão tem −20 de acerto** contra o Hyuuga e libera o Selo dos Pontos Vitais.
- **Rotação** (nível 4): barreira neutra exclusiva: escudo que devolve metade do dano bloqueado (ver [tecnicas.md](tecnicas.md#ninjutsu-de-linhagem)).
- **64 Palmas** (nível 7, só com o Byakugan): taijutsu de 4 golpes; cada golpe que acerta fecha um ponto de chakra e drena 3 do vilão.

### Uzumaki

Identidade: resistência e selos.

- **Vitalidade** (passiva): recupera 1 de chakra e 2% do HP máximo no início de cada rodada (2 de chakra no nível 7).
- **Selamento** (ativa): escolha grátis, 6 de chakra, **1 uso por luta** (+1 no nível 7). Sela a próxima técnica do vilão (a sorteada para a próxima ação ou o golpe carregado): ela **sai da roleta dele por 2 rodadas** (3 no nível 7) e ele sorteia outra ação. Um golpe carregado selado se perde (o chakra já foi gasto).
- **Correntes de Chakra** (nível 4): ninjutsu exclusivo que prende como a Imitação de Sombra (ninjutsu contra a resistência física, força base 1). O vilão preso pelas correntes perde **3 de chakra** a cada vez perdida.
- Os Clones das Sombras saíram do kit do Uzumaki e vão virar premium do guru.

## Despertar

Nos níveis 4 e 7, cada linhagem desperta: a tela da subida de nível mostra o que mudou, e a ficha lista o despertar já alcançado. Onde a linhagem já ganhava algo nesses níveis (tomoe, técnicas de nível, usos extras), isso faz parte do despertar.

| Linhagem | Nível 4 | Nível 7 |
|---|---|---|
| Comum | **Nunca desistir**: na 1ª vez na luta em que o HP cai abaixo de 25%, recupera 15% do HP máximo. | **Esforço supremo**: o Esforço dá +5 e dura 4 rodadas. |
| Nara | A Imitação de Sombra ganha +1 de força. | **Estrangulamento**: a cada vez mantida pela Sombra costurada, o vilão perde 5% do HP máximo. |
| Akimichi | Corpo pesado nunca abaixo de ×0,8; Rolo Colossal. | A Expansão não reduz mais a speed. |
| Yamanaka | Leitura mental: −15 de acerto nos ataques do vilão; +1 uso da Transmissão. | Na Possessão, o vilão se fere ×1,25; +1 uso da Transmissão. |
| Aburame | A Colônia guarda até 15 insetos e o Enxame deixa 2 por golpe. | O Devorar drena 4 de chakra e causa 3 de dano por inseto. |
| Inuzuka | O cão da Dupla bate com 60% do dano base. | A Fera custa 3 de chakra e dura 4 rodadas. |
| Prodígio do taijutsu | Forçar os portões: +10% de chance; Redemoinho da Folha. | Portões: 2 usos por luta; Lótus Primaveril. |
| Uchiha | Sharingan de 2 tomoe (Cópia com 65%). | Sharingan de 3 tomoe (Cópia com 80%) e Tsukuyomi. |
| Hyuuga | O Byakugan dura 7 rodadas; Rotação. | 64 Palmas. |
| Uzumaki | Correntes de Chakra. | Selamento com +1 uso e 3 rodadas; Vitalidade com 2 de chakra por rodada. |

Configuração: `balance.awakening`.

## Jinchuuriki

- **Chakra máximo +100%.**
- **Manto de chakra**: uma vez por luta, ao ficar abaixo de 50% do HP (inclusive no início da rodada).
  - Dura até 5 rodadas: tai, nin, gen e speed ×1,5, resistências ×1,25, e regenera 5% do HP máximo no início de cada rodada.
  - **Custo: 10% do chakra máximo por rodada.** Sem chakra para pagar a rodada, o manto se desfaz. Não há recoil.
- **Demônio interno**: imune a genjutsu.
- O Gaara usa o mesmo manto (ver [viloes.md](viloes.md)).