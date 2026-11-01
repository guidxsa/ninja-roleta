# Origens

A origem do personagem é sorteada no início da run: linhagem, elementos e jinchuuriki. Ela define os status iniciais, as técnicas de partida e as habilidades exclusivas.

## Sorteio

1. **Roleta de linhagem**: uma roleta só, com três níveis de raridade (a cor da fatia indica o nível).
2. **Quantidade de elementos**: roleta pelos pesos da origem (tabela abaixo). Não gira quando só há uma quantidade possível.
3. **Elementos**: um giro por elemento, sem repetir (cada giro tira o já sorteado; os 5 elementos têm o mesmo peso). O **primeiro** é o **elemento principal**. O elemento fixo da origem (o fogo do Uchiha) entra primeiro e conta na quantidade.
4. **Jinchuuriki**: roleta independente, **10%**. Acumula com qualquer linhagem.

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

### Elementos e potencial elemental

Não se aprende elemento novo durante a run: os elementos são os do sorteio. O **potencial elemental** diz até onde a origem leva as técnicas dos seus elementos ([tecnicas.md](tecnicas.md#níveis-de-técnica)).

| Origem | 0 elementos | 1 | 2 | 3 | Potencial | Começa com o básico do principal? |
|---|---|---|---|---|---|---|
| Comum | — | 50 | 35 | 15 | **Pleno** em todos (até III; IV no nível 10) | Sim |
| Uchiha | — | 65 (só fogo) | 35 (fogo + 1) | — | **Pleno** no fogo; **parcial** no outro | Sim (Fagulha do Dragão) |
| Nara, Akimichi, Yamanaka, Aburame, Inuzuka, Hyuuga, Uzumaki | 30 | 55 | 15 | — | **Parcial** (até o nível de técnica II) | Não |
| Prodígio do taijutsu | sempre 0 | — | — | — | Nenhum | — |

- **Pleno**: as linhas elementais sobem até o teto do nível do personagem.
- **Parcial**: o nível I vem pela recompensa "nova técnica" ou pelo foco elemental do Treino ([campanha.md](campanha.md#treino)), e a linha para no **II**. A barreira do elemento (nível 4) entra; a Armadura de Raio (nível 7) não. O potencial dessas origens está no kit da linhagem.
- Com vários elementos, os upgrades se dividem entre as linhas: quem tem 3 elementos demora mais para levar cada um ao topo.

### Re-roll

- Infinito, só na tela de origem, antes da primeira luta.
- Cada re-roll conta como campanha nova e entra no histórico com status "re-roll".

## Status iniciais

Referência: **90 pontos**, cerca de 70 em status e 20 em resistências. Conversão: taijutsu, ninjutsu, genjutsu e as duas resistências valem 1 ponto; speed vale 1,5; 10 de HP vale 1; 2 de chakra valem 1. A distribuição segue a lore (v0.30), com o total perto de 90; a coluna "Pontos" mostra quanto cada origem fica acima ou abaixo.

| Origem | Taijutsu | Ninjutsu | Genjutsu | Res. física | Res. mental | Speed | HP | Chakra | Pontos | Leitura da lore |
|---|---|---|---|---|---|---|---|---|---|---|
| Comum | 10 | 10 | 10 | 10 | 10 | 10 | 100 | 30 | 90 | Sem dom, sem defeito: a régua |
| Nara | 7 | 14 | 9 | 9 | 12 | 9 | 100 | 34 | 91,5 | Cabeça e sombras; corpo preguiçoso |
| Akimichi | 15 | 7 | 4 | 14 | 7 | 6 | 150 | 34 | 88 | Massa, vida e força; lento e fácil de iludir |
| Yamanaka | 8 | 9 | 16 | 8 | 15 | 10 | 100 | 32 | 97 | Mente forte, corpo frágil |
| Aburame | 7 | 13 | 8 | 11 | 12 | 8 | 105 | 38 | 92,5 | Reserva grande de chakra, calmo e defensivo |
| Inuzuka | 14 | 7 | 5 | 12 | 7 | 14 | 100 | 24 | 88 | Selvagem e rápido; pouco chakra |
| Prodígio do taijutsu | 18 | 0 | 0 | 12 | 8 | 13 | 110 | 22 | 79,5 | Só corpo; quase sem chakra |
| Uchiha | 11 | 11 | 13 | 9 | 11 | 11 | 100 | 28 | 95,5 | Talento em tudo, olhos treinados |
| Hyuuga | 15 | 6 | 6 | 11 | 10 | 12 | 100 | 28 | 90 | Punho Gentil, precisão e reflexo |
| Uzumaki | 10 | 10 | 5 | 12 | 9 | 9 | 120 | 38 | 90,5 | Vitalidade e chakra enormes; péssimo em genjutsu |

Lógica das resistências (provisória): clãs de corpo (Akimichi, Inuzuka, Uzumaki) puxam para a física; clãs de mente e ilusão (Yamanaka) puxam para a mental. O prodígio tem a mental mais baixa que a física: é um alvo natural de genjutsu, como na série.

Jinchuuriki soma **+100% de chakra máximo** sobre a origem.

## Habilidades por linhagem

Visão geral. Detalhes de cada técnica em [tecnicas.md](tecnicas.md).

| Origem | Passiva | Ativa | Kit inicial | Exclusivas | Restrições |
|---|---|---|---|---|---|
| Comum | Determinação | Esforço | Taijutsu básico, básico do elemento principal | — | — |
| Nara | Gênio | — | Taijutsu básico, Imitação de Sombra, Enforcamento por Sombra, Sombra Cortante | Imitação de Sombra, Enforcamento por Sombra, Sombra Cortante | — |
| Akimichi | Corpo pesado | Expansão, Pílulas do clã (nível 7) | Taijutsu básico, Mão Expandida | Mão Expandida, Rolo Colossal (nível 4) | — |
| Yamanaka | Leitura mental, Mente no controle | Transmissão mental | Taijutsu básico, Transferência de Mente, Pétalas Ilusórias | Transferência de Mente, Pétalas Ilusórias | — |
| Aburame | Colônia | Praga | Taijutsu básico, Enxame, Devorar | Enxame, Devorar | — |
| Inuzuka | Dupla | Fera de quatro patas | Taijutsu básico, Presas Giratórias | Presas Giratórias | — |
| Prodígio do taijutsu | Corpo de ferro | Portões (com Forçar) | Taijutsu básico | Redemoinho da Folha (4), Lótus Primaveril (7) | Sem ninjutsu, genjutsu e médico |
| Uchiha | Olhos treinados | Sharingan, Cópia | Taijutsu básico, Fagulha do Dragão, Olhar Hipnótico, Ilusão da Dor | Ilusões de dano, Tsukuyomi (nível 7) | — |
| Hyuuga | Punho preciso | Byakugan | Taijutsu básico, Selo dos Pontos Vitais (só com o Byakugan) | Selo dos Pontos Vitais, Rotação (nível 4), 64 Palmas (nível 7) | — |
| Uzumaki | Vitalidade | Selamento | Taijutsu básico, Etiqueta Explosiva | Etiqueta Explosiva, Correntes de Chakra (nível 4) | — |

"Básico do elemento principal" = o nível I da linha de ataque do primeiro elemento sorteado ([tecnicas.md](tecnicas.md#linhas-de-ataque)); só no potencial pleno.

Toda **ativa** de linhagem é uma **escolha grátis**: ativa junto com a ação da rodada, sem gastar o turno, se houver chakra para as duas ([fundamentos.md](fundamentos.md)).

## Detalhe por linhagem

### Comum

- **Determinação** (passiva): +25% de XP ganho e, a cada nível, **+1 no maior status de ataque** (empate: taijutsu, ninjutsu, genjutsu). Combina com o nível sem limite: o comum não nasce forte, mas cresce mais rápido.
- **Esforço** (ativa): escolha grátis, sem custo de chakra. **+3 em taijutsu, ninjutsu e genjutsu** por 3 rodadas, contando a da ativação. **1 uso por luta, +1 nos níveis 4 e 7**: o comum cresce treinando.

### Nara (sombras)

- **Gênio** (passiva com usos): a tela mostra a próxima ação do vilão antes de o jogador escolher a sua. E, **2 vezes por luta (+1 nos níveis 4 e 7)**, uma escolha grátis (não gasta o turno) arma a próxima roleta do Nara: ela gira duas vezes e fica com o melhor resultado. Vale para acerto (de golpes, genjutsu e Imitação de Sombra), Substituição e disputa.
- **Kit**: Imitação de Sombra (prende, e por ser ninjutsu pega até quem é imune a genjutsu, como o Gaara) e Enforcamento por Sombra (dano só contra o vilão preso). Fichas em [tecnicas.md](tecnicas.md#técnicas-de-linhagem).

### Akimichi (expansão)

- **Peso**: o HP máximo do Akimichi (o HP atual não pesa). Mudar o peso não muda o HP.
- **Corpo pesado** (passiva): o taijutsu ganha um multiplicador pela **razão de peso** = peso do Akimichi ÷ HP máximo do vilão. Só bônus, nunca debuff:

  | Razão | Taijutsu |
  |---|---|
  | abaixo de 1 | ×1 |
  | 1 | ×1,05 |
  | 1,25 | ×1,1 |
  | 1,5 | ×1,2 |
  | 2 | ×1,3 (teto normal) |
  | 2,5 (só na Expansão) | ×1,4 |
  | 3 (só na Expansão) | ×1,5 |

- **Expansão** (ativa): **escolha grátis** (não gasta o turno) que custa 6 de chakra. Por 3 rodadas, contando a da ativação: **peso ×1,5** e libera os degraus do Corpo pesado acima do teto normal; speed −3. Pode ser usada de novo quando acabar.
- **Rolo Colossal** (nível 4): taijutsu exclusivo ([tecnicas.md](tecnicas.md#técnicas-de-linhagem)).
- **Pílulas do clã** (ativa, a partir do **nível 7**): escolha grátis, sem chakra, **1 vez por luta**. Gira uma roleta pura das 3 pílulas; o efeito vale 3 rodadas, contando a da ativação, e multiplica junto com a Expansão. O HP pago nunca deixa abaixo de 1.

  | Pílula | Chance | Efeito | Custo |
  |---|---|---|---|
  | Verde | 50% | Taijutsu ×1,3 | 10% do HP máximo |
  | Amarela | 35% | Taijutsu ×1,6 e resistência física +3 | 20% |
  | Vermelha | 15% | Taijutsu ×2 e speed +3 | 30%; quando acaba, fica **exausto** por 2 rodadas (taijutsu ×0,5, speed −3) |

### Yamanaka (mente)

- **Leitura mental** (passiva): ataques do vilão contra o Yamanaka têm −10 de acerto.
- **Mente no controle** (passiva): com o vilão possuído, o Yamanaka escolhe qual técnica de dano ele usa em si mesmo, e o vilão **paga o chakra** dela. Sem escolha, ele usa a de mais dano que puder pagar. Técnica que ele não pode pagar não entra nas opções.
- **Transmissão mental** (ativa): escolha grátis, 5 de chakra. Só contra um **golpe carregado** anunciado: rola o acerto de genjutsu do Yamanaka contra a resistência mental do vilão (como um genjutsu). Se pegar, o golpe se perde (o chakra já foi gasto) e o vilão perde a vez. **1 uso por luta, +1 nos níveis 4 e 7.** Não funciona em quem é imune a genjutsu.
- **Transferência de Mente** (kit, [tecnicas.md](tecnicas.md#técnicas-de-linhagem)): a Possessão faz o vilão perder a vez golpeando a si mesmo com a própria técnica de dano mais forte. É o potencial ofensivo do Yamanaka: quanto mais forte o vilão, mais ele se fere. Junto com o Uchiha, é a única origem que nasce com genjutsu.

### Aburame (insetos)

- **Colônia** (passiva):
  - cada golpe do **Enxame** que acerta prende insetos no vilão: **2 por acerto**, +1 a cada 5 de ninjutsu base a partir de 15 (tabela abaixo). O **crítico** do Enxame prende o dobro naquele golpe. Outros ataques não prendem insetos;
  - o Enxame que **vence uma disputa de ninjutsu** (atacando ou defendendo) também prende, um lote por golpe que passa (a disputa não rola crítico);
  - o **teto** de insetos no vilão vem do nível do Enxame: **10 / 15 / 20** (Enxame, Enxame Voraz, Nuvem de Insetos). Acima do teto não entra inseto novo;
  - no **fim de cada rodada**, a cada **5 insetos** (para baixo), **1 de chakra** do vilão vai para o Aburame (até o máximo dele). O que o vilão não tinha para pagar vira **dano direto: 1 a cada 3 de chakra que faltou** (para baixo);
  - **rodada sem nenhum acerto do Enxame**: depois da Colônia, o vilão se livra de **2 insetos**. Para acumular muito, o Enxame precisa continuar batendo.

  | Ninjutsu base | Insetos por acerto |
  |---|---|
  | até 14 | 2 |
  | 15 a 19 | 3 |
  | 20 a 24 | 4 |
  | 25 ou mais | 5 |

- **Kit**: Enxame (prende os insetos, em linha própria) e Devorar (consome os insetos). Fichas e a tabela de dano do Devorar em [tecnicas.md](tecnicas.md#técnicas-de-linhagem).
- **Praga** (ativa): escolha grátis, 6 de chakra, **1 uso por luta** (+1 no nível 7). Por 3 rodadas, contando a da ativação, o Enxame prende o **dobro de insetos** por acerto (×4 num crítico) e o teto **dobra** (20 / 30 / 40). Quando acaba, os insetos acima do teto normal **ficam**, mas não entra inseto novo até o vilão baixar do teto (o Devorar consome tudo).
- O Devorar usa todos os insetos, suga chakra do vilão e deixa 40% deles presos ([tecnicas.md](tecnicas.md#técnicas-de-linhagem)). O HP máximo do vilão não muda.

### Inuzuka (parceiro canino)

- **Dupla** (passiva): depois de cada ataque do jogador que acerta, 25% de chance de o cão atacar também (taijutsu, 40% do dano base do ataque, rola acerto próprio).
- **Fera de quatro patas** (ativa): escolha grátis, 5 de chakra. Por 3 rodadas, contando a da ativação: **speed +3**, a Dupla ataca com **60%** de chance e a Substituição usa o cão como **isca** (custa o chakra, mas não gasta usos). **1 uso por luta** (+1 no nível 7).
- **Presas Giratórias** (kit): taijutsu de 2 golpes ([tecnicas.md](tecnicas.md#técnicas-de-linhagem)).

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
- **Kit**: Olhar Hipnótico (prende) e Ilusão da Dor (ilusão de dano, que fere com genjutsu contra a resistência mental). No nível 7, Tsukuyomi (só com o Sharingan). Fichas em [tecnicas.md](tecnicas.md#técnicas-de-linhagem).
- **Sharingan** (ativa, dōjutsu): ativar é uma **escolha grátis** (não gasta o turno) que custa 4 de chakra; manutenção 2 por rodada, dura 5 rodadas ou até faltar chakra. Evolui com o nível.

  | Estágio | Nível | Taijutsu/Ninjutsu/Genjutsu | Speed | Genjutsu: acerto / poder | Leitura de movimento |
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
- **Byakugan** (ativa, dōjutsu): **escolha grátis** (não gasta o turno); ativar 3, manutenção 2, dura 5 rodadas (7 a partir do nível 4). Ativo: taijutsu não erra (crítico ainda rola), taijutsu ×1,1, **ignora a evasão da névoa** do Zabuza, o **genjutsu do vilão tem −20 de acerto** contra o Hyuuga e libera o Selo dos Pontos Vitais e as 64 Palmas. Não tem limite de usos por luta: só o chakra limita.

- **Kit**: Selo dos Pontos Vitais (só com o Byakugan), Rotação no nível 4 (barreira que devolve metade do dano bloqueado; não precisa do Byakugan) e 64 Palmas no nível 7 (só com o Byakugan). Fichas em [tecnicas.md](tecnicas.md#técnicas-de-linhagem).

### Uzumaki

Identidade: resistência e selos.

- **Vitalidade** (passiva): recupera 1 de chakra e 2% do HP máximo no início de cada rodada (2 de chakra no nível 7).
- **Selamento** (ativa): escolha grátis, 6 de chakra, **1 uso por luta** (+1 no nível 7). Sela a próxima técnica do vilão (a sorteada para a próxima ação ou o golpe carregado): ela **sai da roleta dele por 2 rodadas** (3 no nível 7) e ele sorteia outra ação. Um golpe carregado selado se perde (o chakra já foi gasto).
- **Correntes de Chakra** (nível 4): prende como a Imitação de Sombra e drena 3 de chakra do vilão a cada vez perdida ([tecnicas.md](tecnicas.md#técnicas-de-linhagem)).
- Os Clones das Sombras saíram do kit do Uzumaki e viraram premium do guru ([tecnicas.md](tecnicas.md#premium-guru)).

## Despertar

Nos níveis 4 e 7, cada linhagem desperta: a tela da subida de nível mostra o que mudou, e a ficha lista o despertar já alcançado. Onde a linhagem já ganhava algo nesses níveis (tomoe, técnicas de nível, usos extras), isso faz parte do despertar.

| Linhagem | Nível 4 | Nível 7 |
|---|---|---|
| Comum | **Nunca desistir**: na 1ª vez na luta em que o HP cai abaixo de 25%, recupera 15% do HP máximo. | **Esforço supremo**: o Esforço dá +5 e dura 4 rodadas. |
| Nara | A Imitação de Sombra ganha +1 de força. | O Enforcamento por Sombra soma +1 de força do controle no dano. |
| Akimichi | Peso +10%; Rolo Colossal. | Pílulas do clã; a Expansão não reduz mais a speed. |
| Yamanaka | Leitura mental: −15 de acerto nos ataques do vilão; +1 uso da Transmissão. | Na Possessão, o vilão se fere ×1,25; +1 uso da Transmissão. |
| Aburame | O Devorar causa +0,25% do HP máximo por inseto. | Mais +0,25% por inseto no Devorar (+0,5% no total); Praga com +1 uso. |
| Inuzuka | O cão da Dupla bate com 60% do dano base. | A Fera custa 3 de chakra e dura 4 rodadas. |
| Prodígio do taijutsu | Forçar os portões: +10% de chance; Redemoinho da Folha. | Portões: 2 usos por luta; Lótus Primaveril. |
| Uchiha | Sharingan de 2 tomoe (Cópia com 65%). | Sharingan de 3 tomoe (Cópia com 80%) e Tsukuyomi. |
| Hyuuga | O Byakugan dura 7 rodadas; Rotação. | 64 Palmas. |
| Uzumaki | Correntes de Chakra. | Selamento com +1 uso e 3 rodadas; Vitalidade com 2 de chakra por rodada. |

Configuração: `balance.awakening`.

## Jinchuuriki

- **Chakra máximo +100%.**
- **Manto de chakra**: uma vez por luta, ao ficar abaixo de 50% do HP (inclusive no início da rodada).
  - Dura até 5 rodadas: taijutsu, ninjutsu, genjutsu e speed ×1,5, resistências ×1,25, e regenera 5% do HP máximo no início de cada rodada.
  - **Custo: 10% do chakra máximo por rodada.** Sem chakra para pagar a rodada, o manto se desfaz. Não há recoil.
- **Demônio interno**: imune a genjutsu.
- O Gaara usa o mesmo manto (ver [viloes.md](viloes.md)).