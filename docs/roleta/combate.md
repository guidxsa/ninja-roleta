# Combate do Roleta

> Turno de um toque desde a v0.45.0 (Roleta enxuto I); efeitos e barreiras unificados com a Jornada na v0.77.0; kits completos das origens desde a v0.80.0. Dados em `src/data/roleta/` (`balance.ts`, `techniques.ts`, `kits.ts`); regras em `src/core/roleta/battle.ts`. O que ficou só no combate clássico (reações, disputa de ninjutsu, estados elementais, efeitos mentais com fuga, linhas elementais) está na reserva: [reserva/README.md](../reserva/README.md).
>
> **v0.92.0, Roleta rápido e explosivo** ([decisoes.md](../decisoes.md), item 40): kits curtos (uma passiva que faz o que as ativas faziam e 2 ou 3 técnicas-chave), sem clones nem barreiras, lutas de 5 a 8 rodadas no Médio.

O Roleta é o modo rápido: lutas curtas, decisões simples e muita roleta. Acerto, crítico, dano, resistência e dificuldade seguem a base ([fundamentos.md](../base/fundamentos.md)); aqui fica o que é do Roleta.

## Turno

- **Iniciativa**: uma roleta no começo da luta (speed² contra speed²). Ramen e Velhinha trocam a roleta por vantagem ou desvantagem.
- **Um toque por turno**: uma técnica, **Defender** (resistência inteira até o próximo turno) ou **Concentrar** (+30% do chakra máximo).
- **Item da bolsa**: não gasta a vez, **um por turno**, antes da ação (v0.77.0, como na Jornada). Atordoado não usa.
- **Sem ativa**: a passiva da origem faz sozinha o que as ativas faziam (v0.92.0, [Kits](#kits)).
- Sem painel de reação: a defesa é automática.

## Acerto, esquiva e dano

- **Uma roleta por golpe** (Erro / Acerto / Crítico; v0.77.0, como na Jornada). Técnica de vários golpes gira a roleta uma vez por golpe: um pode errar e o outro acertar. Os golpes extras dos Espelhos (Haku, Irmãos Demônio) também. O efeito da técnica rola uma vez, se pelo menos um golpe acertou; a Bomba de fumaça esquiva o ataque inteiro.
- **Esquiva** (a antiga Substituição, agora passiva): 5% + 2% por ponto de speed acima de quem ataca, entre 0% e 30%. Sai da chance de acerto de quem ataca.
- **Dano** = base da técnica + ataque do tipo − resistência × fração (0,4 sem fazer nada; 1 ao Defender), × 2 no crítico. **Sem multiplicador de elemento no HP**: o elemento só pesa contra uma [barreira](../base/fundamentos.md#barreiras-no-roleta-e-na-jornada).
- Genjutsu fere com o genjutsu contra a resistência mental; taijutsu e ninjutsu, contra a física.

## Efeitos

Os mesmos da Jornada, sem roleta de fuga nem tenacidade: Atordoar (2 turnos e a trava firme), Bloqueio de chakra, Queimar, Veneno (5% por 3) e Medo. Tabela e regras em [fundamentos.md](../base/fundamentos.md#efeitos-roleta-e-jornada).

O sangramento virou veneno; prisão, sono, possessão e congelar viraram atordoar; confusão e tormento viraram medo. O Selo dos Pontos Vitais do Hyuuga bloqueia o chakra (25%) no lugar de atordoar (v0.77.0). O vilão bloqueado só sorteia taijutsu (ou concentra).

## Chakra e itens

- Técnicas custam chakra; o taijutsu básico é grátis. No começo de cada rodada, o jogador recupera **3%** do chakra máximo e o vilão **5%** (mínimo 1), sem pausa na tela.
- **Economia de chakra** (v0.59.0, proposta): as técnicas custam o dobro de antes (6 nas de elemento e de clã, inclusive as Presas Giratórias do Inuzuka; 4 nas outras de taijutsu de clã, a Mão Expandida, a Folha Furacão e o Selo dos Pontos Vitais; 8 nas mais fortes, 7 na Madeira; os valores de cada uma estão na tabela de técnicas), a regeneração do jogador caiu de 5% para 3% e Concentrar subiu de 25% para 30%. O vilão segue com o ritmo antigo (5% e 25%), para a mudança não mexer na força dele.
- Itens na luta: Pílula de soldado (+50% do chakra), Kit médico (limpa os efeitos e cura 15%), Selo explosivo (15 de dano, sem roleta), Bomba de fumaça (esquiva garantida do próximo ataque).
- **Força dos vilões por dificuldade** só no Roleta (`difficultyPower`, v0.92.0): × HP e ataques por cima da base, Fácil 1,3, Médio 1,2, Difícil 1,12 e Hardcore 1,22 (no total ~1,17 / 1,32 / 1,40 / 1,53), calibrada para a meta 90/65/40/15.
- **Vontade do Fogo**: ao cair, volta com HP e chakra cheios ([fundamentos.md](../base/fundamentos.md#vontade-do-fogo-revive)).

## Técnicas

Fixas pela origem e **sobem sozinhas com o nível**: dano base = base + por nível × (nível − 1), mais a Ferramenta ninja. Não há upgrade à escolha, linha elemental nem técnica nova por recompensa.

Desde a v0.92.0 (kits curtos, [decisoes.md](../decisoes.md) item 40) o kit é:

- Todo mundo: **Taijutsu básico**.
- **A técnica da natureza** (uma por elemento), só no Comum, no Uzumaki e no Senju; a kekkei genkai (Mokuton do Senju) toma o lugar das dos elementos-pai. As outras origens têm natureza, mas sem técnica; o Prodígio não tem natureza.
- **2 ou 3 técnicas-chave da linhagem**. As do despertar entram no nível 4 ou 7; algumas pedem o dōjutsu ou um Portão aberto, que a passiva liga sozinha.
- **Sem clones nem barreiras no Roleta**: as técnicas continuam nos dados e no motor (com testes) e ficam na Jornada ([fundamentos.md](../base/fundamentos.md#clones)). Na tabela abaixo, as que só existem guardadas estão marcadas.

| Técnica | Quem | Tipo | Dano (por nível) | Golpes | Chakra | Precisão | Extra |
|---|---|---|---|---|---|---|---|
| Taijutsu básico | todos | taijutsu | 8 (+1) | 1 | 0 | 90% | — |
| Kunai | Comum | taijutsu | 12 (+3) | 1 | 2 | 95% | — |
| Bola de Fogo | fogo | ninjutsu | 12 (+2) | 1 | 6 | 85% | 25% de Queimar |
| Lâmina de Vento | vento | ninjutsu | 11 (+2) | 1 | 6 | 90% | +10% de crítico |
| Corrente Elétrica | raio | ninjutsu | 13 (+2) | 1 | 6 | 80% | ignora 25% da resistência |
| Punho de Rocha | terra | ninjutsu | 11 (+2) | 1 | 6 | 95% | 10% de Atordoar |
| Projéteis d'Água | água | ninjutsu | 6 (+1) | 2 | 6 | 90% | — |
| Mão Expandida | Akimichi | taijutsu | 12 (+2) | 1 | 4 | 85% | 10% de Atordoar |
| Rolo Colossal | Akimichi, nível 4 | taijutsu | 14 (+3) | 1 | 8 | 80% | 20% de Atordoar |
| Presas Giratórias | Inuzuka | taijutsu | 5 (+1) | 2 | 6 | 85% | — |
| Garra do Cão | Inuzuka | taijutsu | 8 (+1) | 1 | 4 | 85% | 15% de Atordoar |
| Folha Furacão | prodígio | taijutsu | 8 (+1) | 1 | 4 | 90% | — |
| Lótus Primária | prodígio, nível 4 | taijutsu | 12 (+2) | 1 | 8 | 85% | só com um Portão aberto; 25% de Atordoar |
| Lótus Oculta | prodígio, nível 7 | taijutsu | 5 (+1) | 5 | 12 | 85% | só com o 3º Portão ou acima |
| Grande Bola de Fogo | Uchiha | ninjutsu | 11 (+2) | 1 | 6 | 85% | 30% de Queimar |
| Ilusão da Dor | Uchiha | genjutsu | 11 (+2) | 1 | 6 | 85% | 20% de Medo |
| Tsukuyomi | Uchiha, nível 7 | genjutsu | 20 (+3) | 1 | 12 | 85% | só com o Sharingan (sempre aceso); 50% de Atordoar |
| Punho Gentil | Hyuuga | taijutsu | 8 (+1) | 1 | 3 | 95% | tira 2 de chakra |
| Selo dos Pontos Vitais | Hyuuga | taijutsu | 9 (+2) | 1 | 4 | 100% | só com o Byakugan (sempre aceso); 25% de Bloqueio de chakra; tira 3 de chakra |
| 64 Palmas | Hyuuga, nível 7 | taijutsu | 5 (+1) | 4 | 10 | 100% | só com o Byakugan; cada golpe tira 2 de chakra |
| Etiqueta Explosiva | Uzumaki | ninjutsu | 12 (+2) | 1 | 6 | 85% | ignora 50% da resistência |
| Correntes de Chakra | Uzumaki, nível 4 | ninjutsu | — | 1 | 8 | 75% | sem dano: atordoa e tira 4 de chakra se acertar |
| Punho do Fundador | Senju | taijutsu | 14 (+2) | 1 | 5 | 85% | — |
| Raízes de Madeira | madeira (Senju) | ninjutsu | 10 (+2) | 1 | 7 | 90% | recupera 50% do dano como HP |
| Agulhas de Gelo | gelo (guardada) | ninjutsu | 5 (+1) | 3 | 6 | 90% | 15% de Atordoar |
| Shuriken de Areia | areia (guardada) | ninjutsu | 12 (+2) | 1 | 6 | 95% | começa a luta com escudo de 10% do HP |
| Bolha de Lava | lava (guardada) | ninjutsu | 14 (+2) | 1 | 6 | 85% | 30% de Queimar |
| Laser da Tempestade | tempestade (guardada) | ninjutsu | 7 (+1) | 2 | 6 | 85% | ignora 20% da resistência |
| Névoa Ácida | vapor (guardada) | ninjutsu | 10 (+2) | 1 | 6 | 90% | 30% de Veneno |
| Bomba de Argila | explosão (guardada) | ninjutsu | 20 (+3) | 1 | 8 | 70% | — |
| Olhar Hipnótico | Uchiha (guardada desde a v0.92.0) | genjutsu | — | 1 | 3 | 80% | sem dano: atordoa se acertar |
| Rotação | Hyuuga (guardada: virou parte da passiva na v0.92.0) | ninjutsu | — | — | 6 | — | barreira neutra de 26% do HP que devolve metade do que segura |
| Sombra Cortante | Nara (guardado) | ninjutsu | 10 (+2) | 1 | 6 | 85% | — |
| Pétalas Ilusórias | Yamanaka (guardado) | genjutsu | 10 (+2) | 1 | 6 | 85% | 30% de Medo |
| Enxame | Aburame (guardado) | ninjutsu | 5 (+1) | 2 | 8 | 85% | 50% de Veneno |
| Bunshin no Jutsu | guardada | ninjutsu | — | — | 5 | — | enganação: clone ilusório (até 1) |
| Kage Bunshin no Jutsu | guardada | ninjutsu | — | — | 8 | — | autonomia: clone que bate junto (35%, uma vez por técnica) |
| Mizu Bunshin no Jutsu | guardada | ninjutsu | — | — | 6 | — | eficiência: clone que bate junto (25%) |
| Doton Kage Bunshin | guardada | ninjutsu | — | — | 6 | — | resistência: clone que segura 65% e aguenta 2 golpes |
| Raiton Kage Bunshin | guardada | ninjutsu | — | — | 7 | — | contra-ataque: ao se desfazer, descarga de 5% do HP e 25% de atordoar |
| Mokuton Bunshin | guardada | ninjutsu | — | — | 8 | — | versatilidade: segura 65%, aguenta 2, bate junto (25%), +10% de acerto, mostra a ação do vilão |
| Suna Bunshin | guardada | ninjutsu | — | — | 6 | — | controle: 25% de bloquear o chakra de quem o destrói |
| Muralha de Terra | guardada | ninjutsu | — | — | 6 | — | barreira de 28% do HP |
| Parede d'Água | guardada | ninjutsu | — | — | 6 | — | barreira de 24% do HP |
| Muralha de Chamas | guardada | ninjutsu | — | — | 5 | — | barreira de 20% do HP |
| Escudo de Vento | guardada | ninjutsu | — | — | 5 | — | barreira de 20% do HP |

## Kits

Desde a v0.92.0 (Roleta rápido e explosivo, aprovado pelo usuário), cada origem tem **uma passiva**, que evolui nos níveis 4 e 7 e faz sozinha o que as ativas faziam: **não há botão de ativa nem custo de chakra** para ela. A dica descreve o efeito em palavras, sem a conta. Os números ficam em `roletaBalance.auto` (`src/data/roleta/balance.ts`) e no `balance` da base (`passives`, `awakening`, `dojutsu`, `gates`, `vitalForce`, `jinchuuriki`); os kits em `src/data/roleta/kits.ts` (`auto`, `techniques`, `elementTechniques`).

| Origem | Passiva | Nível 4 | Nível 7 |
|---|---|---|---|
| Comum | **Determinação**: +25% de XP; +1 no maior ataque por nível. **Esforço** sozinho no começo da luta: +5 nos três ataques por 4 rodadas | Nunca desistir (na 1ª vez abaixo de 25% do HP, recupera 15%) | Esforço +7 por 5 rodadas, e volta uma vez abaixo de 50% do HP |
| Akimichi | **Corpo pesado**: taijutsu pela razão HP máximo ÷ HP máximo do vilão (×1,05 / 1,1 / 1,2 / 1,3). **Expansão** sozinha na 1ª vez abaixo de 60% do HP, até o fim da luta: peso ×1,5 (libera ×1,4 e ×1,5) e speed −3 | Peso +10%; Rolo Colossal | A Expansão não tira speed; **Pílula do clã** abaixo de 25% do HP: taijutsu ×1,5 até o fim da luta, sem custo |
| Inuzuka | **Dupla**: 18% de o cão bater junto (40% do dano). **Fera de quatro patas** na 1ª rodada: +3 de speed, +10% de esquiva e Dupla com 30% | O cão bate com 60% do dano | A Fera dura 2 rodadas; depois dela, Dupla com 25% |
| Prodígio | **Juventude e Portões**: +5% de crítico; sem ninjutsu, genjutsu nem natureza. Os **Portões abrem sozinhos** pelo HP: 1º abaixo de 60%, 2º abaixo de 45% (taijutsu ×1,3 / ×1,5); custam 1% do HP máximo por portão aberto a cada rodada, nunca abaixo de 1, e não fecham | 3º portão abaixo de 30% (×1,7); Lótus Primária | 4º portão abaixo de 15% (×1,9); Lótus Oculta |
| Uchiha | **Sharingan** aceso a luta inteira, sem manutenção: metade do bônus de ataque do estágio (+1/+2/+3; genjutsu também +1/+3/+4 de poder) e +1 de speed, genjutsu com +10% de acerto, Leitura de movimento (20% de o golpe recebido cair pela metade), imune a Medo. **Cópia** sozinha: 15% de copiar a técnica de taijutsu ou ninjutsu de dano que o acertou, até o fim da luta | 2 tomoe (+2 de speed, +15% no genjutsu, Leitura 25%); Cópia 20% | 3 tomoe (+3 de speed, +20%, Leitura 30%); Cópia 30%; Tsukuyomi |
| Hyuuga | **Byakugan** aceso a luta inteira, sem manutenção: o taijutsu não erra e ignora 30% da resistência, enxerga através da névoa e o genjutsu do vilão tem −20% de acerto | **Rotação** sozinha uma vez por luta: o golpe que tiraria 20% do HP máximo ou mais cai pela metade e a metade cortada volta para o vilão | Rotação duas vezes por luta; 64 Palmas |
| Uzumaki | **Vitalidade**: 1 de chakra e 2% do HP por rodada. **Selamento** sozinho na 1ª rodada: a técnica de mais dano do vilão sai da roleta dele por 2 rodadas | Correntes de Chakra | Selamento por 3 rodadas; Vitalidade com 2 de chakra |
| Senju | **Força vital**: curas +25%; abaixo de 30% do HP, recupera 4% por rodada por 3 rodadas | Força vital 5% e 2 de chakra por rodada | Dispara 2 vezes por luta |
| Jinchuuriki | Manto: uma vez por luta, abaixo de 50% do HP, ataques e speed ×1,5, resistências ×1,25 e 5% de HP por rodada, até 5 rodadas; custa 10% do chakra máximo por rodada; imune a Medo | — | — |
| Nara (guardado) | Gênio: vê a próxima ação do vilão. Ativa Imitação de Sombra (2): 80% de atordoar | — | — |
| Yamanaka (guardado) | Leitura mental: o vilão tem −10% de acerto. Ativa Transferência de Mente (1): 75%; o vilão perde a vez e se fere | — | — |
| Aburame (guardado) | Colônia: o Enxame pode envenenar. Ativa Praga (1): envenena; veneno em dobro | — | — |

Yamanaka, Nara e Aburame saíram do sorteio na v0.52.0 (`retiredLineages`) e seguem com os kits enxutos de antes, guardados nos dados; só eles ainda têm botão de ativa. As ativas antigas das origens do sorteio (Portões com Forçar, Punho Bêbado, Pílulas em roleta, Sharingan e Byakugan com manutenção, Cópia e Selamento no botão) continuam no motor (`useActive`), sem kit que as use.

Invocações (até a v0.46.0, quando viram relíquias): sapo (6% do HP máximo do vilão como dano verdadeiro por ataque que acerta, +2% por nível), cobra (envenena no acerto), lesma (recupera 3% do HP por rodada, +1% por nível).

## Vilões

Mesmas fichas ([viloes.md](../base/viloes.md)), com a dificuldade aplicada. Escolhem a técnica por peso entre as que podem pagar; sem chakra, concentram.

- Golpe carregado vira técnica comum; a cura do Kabuto continua. As barreiras voltaram na v0.77.0: Gaara (Escudo de areia, 30) e Jirobo (Muralha de Terra, 28) erguem a deles quando não têm uma de pé.
- Genjutsu sem dano (Onda sonora, Flauta, Intenção assassina) aplica **Medo** se acertar.
- Passivas que ficam: Enganador (Mizuki escapa uma vez com 1 de HP), Espelhos (Haku age duas vezes com 60% do dano), Névoa (a chance de erro do jogador ×1,5 nas primeiras rodadas), Manto e marca da maldição (abaixo do limiar: dano e resistência maiores e cura por rodada), Shukaku no hardcore (volta como monstro com outras técnicas), Bisturi (crítico a mais; no hardcore envenena e fura a resistência), Insano (Orochimaru envenena e volta com 50% do HP; no hardcore, no máximo 3 vezes).

## Na tela

- Painel do vilão com HP, chakra, resistências, speed, passiva, técnicas e efeitos; a próxima ação aparece para o Nara e para quem tem o clone de madeira (Mokuton). A barreira de pé aparece como um selo com os pontos e os turnos.
- Ações em seções, todas visíveis: **Técnicas**, **Ações** (Defender e Concentrar) e **Consumíveis** (só com item na bolsa; usar um item não gasta a vez e trava a seção até o próximo turno). Cada botão de técnica mostra o dano no nível atual (×golpes), a chance de acerto e o custo; efeitos e regras ficam na dica.
- O que a passiva liga aparece como selo no painel do jogador (Esforço, Fera, Sharingan, Byakugan, Expansão, Pílula do clã, o portão aberto), sem contagem quando dura a luta inteira; a dica é a da passiva.
- Ritmo: a regeneração de chakra é silenciosa, e cada golpe gira a sua roleta (o título diz qual golpe é: 1/2, 2/2). Contra uma barreira, o botão da técnica mostra o encontro de elementos no escudo (×1,5, ×0,75).

## Simulação

`npm run sim` e `npm run sim:origens` medem o Roleta (bot: o golpe de mais dano esperado; a passiva age sozinha; Kit médico e Pílula de soldado nos apertos). O clássico continua em `npm run sim:classico`.
