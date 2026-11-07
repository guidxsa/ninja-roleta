# Árvores de talentos

> Implementada na v0.35.0; bifurcações, níveis, seis ramos do Naruto e a tela nova na v0.41.0 ([README.md](README.md)). Dados em `src/data/jornada/talents.ts`.

A árvore **reinicia a cada run** e custa pontos de talento ([progressao.md](progressao.md)).

- **Liberar**: cada nó pede o anterior do mesmo ramo, ou um dos nós indicados depois de uma bifurcação. Basta o anterior no **nível 1**.
- **Bifurcação**: alguns pontos do ramo oferecem dois caminhos. Escolher um fecha o outro nesta run ("Você escolheu o outro caminho").
- **Níveis**: a maioria dos talentos é **única**, principalmente os passivos. Alguns, quase sempre técnicas, sobem de nível, com limite de 2 ou 3 e um custo próprio por nível. Dá para voltar e subir um talento antigo a qualquer momento, mesmo depois de avançar no ramo.
- **Ramos canônicos** abrem pelo estágio da história: Sapos e Kyuubi depois do Haku (estágio 2), Rasengan quando o Jiraiya ensina (estágio 3).
- **Nós da conta** ficam liberados de vez por um objetivo: a Ōdama Rasengan pede a conquista *Vale do Fim* (vencer a História).
- O Modo Sennin ficou de fora: é pós-timeskip, e a run termina no Vale do Fim. No lugar entrou o ramo da Kyuubi.
- Nós que só existem com um elemento (ramo Raio do Uchiha) ficam escondidos para quem não tem o elemento.

## Árvore completa

Implementada na v0.44.0. Quando não sobra nada para aprender nem subir na árvore do protagonista, **cada ponto de talento ganho vira 30 ryō na hora** (metade do Treino do mercador; `talentTree.completeRyoPerPoint`). O ryō convertido não passa pelo multiplicador de ryō das relíquias.

- Conta como "nunca": o caminho fechado de uma bifurcação, o nó escondido pelo elemento e o nó preso a uma conquista que a conta ainda não tem. O nó preso a um estágio da História conta como "ainda vem".
- Vale para todo ponto: nível, recompensa de luta, evento, relíquia, descanso. Comprar o último talento converte o que sobrou.
- Com a árvore completa, o Treino some da loja e o Treinar do descanso mostra "+30 ryō". A tela da árvore mostra o chip "Árvore completa".
- Na prática, só as árvores pequenas (Comum, prodígio, Uchiha, Hyuuga) fecham, e quase sempre no [modo infinito](run.md#modo-infinito); a do Naruto custa mais do que a História rende.
- Uma conquista nova pode reabrir a árvore (o ramo do Sasuke sai no meio da run do Uchiha com raio): a run guarda as conquistas que liberam nós e as renova quando sai conquista.

## Na tela

- Tela cheia com o **tema da classe**: cor, padrão de fundo e brasão (Naruto: laranja e espiral; Comum: folha, na cor do elemento sorteado; prodígio: verde e vermelho com faixas; Uchiha: vermelho e preto com tomoe; Hyuuga: lavanda com hexagrama). Tudo também no tema claro.
- Cada talento é um selo em losango; os traços entre eles acendem na cor da classe quando aprendidos. Quem dá para aprender pulsa; o caminho fechado fica tracejado e riscado. Talentos com níveis mostram marcas de nível embaixo.
- **Celular**: um ramo por vez, em abas (com a marca de quem tem algo para comprar). **PC**: todos os ramos lado a lado.
- Tocar seleciona: o cartão de baixo mostra o efeito, o nível e o botão **Aprender** ou **Subir para o nível N**. Aprender tem um carimbo no selo e a tinta correndo pelo traço.

## Naruto

Seis ramos custando cerca de 55 pontos, fora os níveis, para os cerca de 30 que uma run rende: dá para fechar dois ramos ou misturar três. Clones, Pegadinhas e Laços abrem desde o começo, então nenhum ponto fica preso no estágio 1.

| Ramo | Nó | Custo | Níveis | Efeito |
|---|---|---|---|---|
| Clones | Multiclones | 1 | | Kage Bunshin cria 1 clone a mais |
| Clones | Rendan Uzumaki **ou** | 2 | 3 (+1 cada) | Aprende o Rendan: 1 golpe + 1 por clone (até +3). Cada nível: +20% de dano |
| Clones | Guarda de clones | 2 | | Começa toda luta com 1 clone; +2 de dano no taijutsu |
| Clones | Clones explosivos | 2 | | Quem acerta um clone leva 5 de dano |
| Clones | Mil Clones | 3 | | Aprende o Tajū Kage Bunshin: 2 golpes em todos os inimigos e 3 clones |
| Clones | Exército de sombras | 3 | | Limite de clones +2; +3% de dano por clone ativo |
| Pegadinhas | Rei das pegadinhas | 1 | | Esquiva 4%; Sexy no Jutsu custa 1 de chakra a menos |
| Pegadinhas | Harem no Jutsu **ou** | 2 | | Aprende o Harem no Jutsu: pode atordoar todos |
| Pegadinhas | Bomba de fumaça | 2 | | Ativa: +30% de esquiva por 2 turnos |
| Pegadinhas | Shuriken das sombras | 2 | 3 (+1 cada) | Aprende a Shuriken das sombras (3 golpes). Cada nível: +20% de dano |
| Pegadinhas | Emboscada | 2 | | +30% de dano em alvo atordoado |
| Pegadinhas | Mestre da trapaça | 3 | | +15% de chance de aplicar efeitos; +10% de crítico |
| Laços | Não vou desistir | 1 | | A equipe recupera 1 de HP por rodada |
| Laços | Equipe 7 **ou** | 2 | | +15% de HP máximo dos suportes |
| Laços | Grito de guerra | 2 | 3 (+1 cada) | Aprende o Grito de guerra: cura 20 de HP de um aliado e tira atordoar e bloqueio. Cada nível: 1 de chakra a menos |
| Laços | Proteger os amigos | 2 | | +8% de dano da equipe |
| Laços | Ninguém fica para trás | 2 | | Aprende Reanimação; a equipe começa as lutas com escudo de 5% |
| Laços | Futuro Hokage | 3 | | +7% de dano e +5% de acerto da equipe |
| Sapos | Contrato com os sapos | 1 | | +8% de dano de ninjutsu |
| Sapos | Gamakichi **ou** | 2 | 3 (+1 cada) | Aprende a invocar o Gamakichi: óleo em chamas em todos os inimigos. Cada nível: +20% de dano |
| Sapos | Gamatatsu | 2 | | Ativa: escudo de 25% do HP |
| Sapos | Gamabunta | 3 | 2 (+2) | Aprende a invocar o Gamabunta: dano enorme em todos, pode atordoar. Nível 2: +20% de dano |
| Sapos | Chefe dos sapos | 2 | | Técnicas custam 1 de chakra a menos; Gamabunta com +20% de dano |
| Kyuubi | Chakra da raposa | 1 | | Recupera 3 de HP por rodada |
| Kyuubi | Manto da Kyuubi **ou** | 2 | | Ativa de classe: paga 8% do HP, ganha escudo de 20% |
| Kyuubi | Uma cauda | 2 | | Ativa: paga 10% do HP, +35% de dano por 3 turnos |
| Kyuubi | Explosão de chakra | 2 | 2 (+1) | Aprende a Explosão (todos os inimigos); +20% de dano abaixo da metade do HP. Nível 2: +20% de dano da Explosão |
| Kyuubi | Fúria da Kyuubi | 3 | | Uma vez por luta fica com 1 de HP em vez de cair; +10% de dano com HP baixo |
| Rasengan | Rasengan | 1 | 3 (+2 cada) | Aprende o Rasengan. Cada nível: +15% de dano e 1 de chakra a menos |
| Rasengan | Domínio do Rasengan | 2 | | Rasengan: +25% de dano, 2 de chakra a menos |
| Rasengan | Foco **ou** | 2 | | +10% de crítico |
| Rasengan | Rasengan com clone | 2 | 2 (+1) | Aprende o Rasengan com clone: +1 golpe por clone (até +2). Nível 2: +20% de dano |
| Rasengan | Ōdama Rasengan | 3 | | Aprende a Ōdama (conta: vencer a História) |

## Níveis nas outras classes

| Classe | Talento | Níveis | Cada nível |
|---|---|---|---|
| Comum | Nível II (ramo Elemento) | 3 (+1 cada) | +20% de dano |
| Comum | Selo explosivo | 2 (+1) | +25% de dano |
| Prodígio | Furacão da Folha | 3 (+1 cada) | +20% de dano |
| Prodígio | Lótus Primária | 2 (+2) | +20% de dano |
| Prodígio | Entrada dinâmica | 2 (+1) | +25% de dano |
| Uchiha | Flor de Fênix | 3 (+1 cada) | +20% de dano |
| Uchiha | Ilusão dos corvos | 3 (+1 cada) | +20% de dano |
| Uchiha | Combo do Leão | 2 (+1) | +25% de dano |
| Hyuuga | 64 Palmas | 2 (+2) | +25% de dano |
| Hyuuga | Palma do Vácuo | 3 (+1 cada) | +20% de dano |

## Comum (Caminho Ninja)

O ramo Elemento ensina as técnicas do elemento sorteado ([classes.md](classes.md#sorteio-do-elemento)).

| Ramo | Nó | Custo | Efeito |
|---|---|---|---|
| Elemento | Nível II | 1 | Aprende o nível II do elemento (Bola de Fogo, Rajada, Corrente elétrica, Lança de terra, Tubarão de água) |
| Elemento | Afinidade | 2 | +15% de dano de ninjutsu |
| Elemento | Nível III | 2 | Aprende o nível III (Grande Labareda, Esfera de vácuo, Lâmina de raio, Dragão de terra, Cachoeira) |
| Elemento | Mestre do elemento | 3 | Técnicas custam 2 de chakra a menos; +5% de crítico |
| Ferramentas | Kunai afiada | 1 | +2 de dano no taijutsu |
| Ferramentas | Selo explosivo | 2 | Aprende o Selo explosivo (todos os inimigos) |
| Ferramentas | Armadilha de fios | 2 | Aprende a Armadilha de fios |
| Ferramentas | Substituição | 3 | Esquiva 10%; o Bunshin no Jutsu cria 1 clone a mais |
| Determinação | Determinação | 1 | +25% de XP |
| Determinação | Garra | 2 | +25% de dano abaixo da metade do HP |
| Determinação | Trabalho duro | 2 | +10% de dano |
| Determinação | Vontade do Fogo | 3 | Uma vez por luta fica com 1 de HP; recupera 2 de HP por rodada |
| Determinação | Primeiros socorros | 2 | Aprende Reanimação |

## Prodígio (Caminho Ninja)

| Ramo | Nó | Custo | Efeito |
|---|---|---|---|
| Portões | Portão da Vida | 1 | Libera o 2º e o 3º portão (Descanso e Vida) |
| Portões | Corpo treinado | 2 | Começa as lutas com escudo de 10% do HP |
| Portões | Lótus Primária | 2 | Aprende a Lótus Primária |
| Portões | Lótus Oculta | 3 | Aprende a Lótus Oculta (4 golpes, paga 15% do HP) e libera o 4º e o 5º portão (Dor e Limite) |
| Juventude | Juventude | 1 | +5% de crítico e de acerto |
| Juventude | Furacão da Folha | 2 | Aprende o Furacão da Folha |
| Juventude | Punho Bêbado | 2 | Aprende o Punho Bêbado (3 golpes, crítico alto) |
| Juventude | Primavera | 3 | +10% de dano; recupera 2 de HP por rodada |
| Treino | Pesos fora | 1 | Esquiva 5% |
| Treino | Entrada dinâmica | 2 | Aprende a Entrada dinâmica |
| Treino | Mestre do taijutsu | 2 | +15% de dano de taijutsu |
| Treino | Resistência | 3 | Uma vez por luta fica com 1 de HP |

## Uchiha (Caminho Ninja)

| Ramo | Nó | Custo | Efeito |
|---|---|---|---|
| Sharingan | 3 tomoe | 1 | Ativa nova: +20% de acerto, +25% de esquiva e +10% de dano por 4 turnos |
| Sharingan | Olhar copiador | 2 | +5% de crítico e de acerto |
| Sharingan | Previsão | 2 | Esquiva 7% |
| Sharingan | Fluxo do Sharingan | 3 | +10% de dano; recupera 2 de HP por rodada |
| Fogo | Flor de Fênix | 1 | Aprende a Flor de Fênix |
| Fogo | Chama do clã | 2 | +15% de dano de ninjutsu |
| Fogo | Grande Labareda | 2 | Aprende a Grande Labareda |
| Fogo | Mestre do fogo | 3 | Técnicas custam 2 de chakra a menos |
| Ilusões | Ilusão dos corvos | 1 | Aprende a Ilusão dos corvos |
| Ilusões | Mestre das ilusões | 2 | +20% de dano de genjutsu |
| Ilusões | Olhar do medo | 2 | +5% de acerto e de crítico |
| Ilusões | Tsukuyomi | 3 | Aprende o Tsukuyomi |
| Raio (só com raio) | Chidori | 2 | Aprende o Chidori; libera o easter egg do Sasuke ([classes.md](classes.md#easter-eggs)) |
| Sasuke (conta) | Combo do Leão | 1 | Aprende o Combo do Leão |
| Sasuke (conta) | Lâmina de raio | 2 | Aprende a Lâmina de raio |
| Sasuke (conta) | Vingador | 2 | +25% de dano abaixo da metade do HP |
| Sasuke (conta) | Selo amaldiçoado | 3 | Ativa: dano ×1,4 por 3 turnos, paga 10% do HP |

## Hyuuga (Caminho Ninja)

A Palma do Vácuo, que estava pendente desde o Roleta, entra no ramo Rotação.

| Ramo | Nó | Custo | Efeito |
|---|---|---|---|
| Byakugan | Visão ampla | 1 | +5% de acerto; Byakugan custa 1 de chakra a menos |
| Byakugan | Pontos vitais | 2 | +10% de crítico |
| Byakugan | Byakugan desperto | 2 | Ativa nova: não erra, +30% de penetração e +15% de dano por 4 turnos |
| Byakugan | Olhos que tudo veem | 3 | Esquiva 10% |
| Punho Suave | Punho Suave | 1 | +10% de dano de taijutsu |
| Punho Suave | 64 Palmas | 2 | Aprende as 64 Palmas |
| Punho Suave | Tenketsu | 2 | Palma Suave: +30% de dano |
| Punho Suave | 128 Palmas | 3 | Aprende as 128 Palmas |
| Rotação | Rotação | 1 | Aprende a Rotação (escudo) |
| Rotação | Postura do clã | 2 | Começa as lutas com escudo de 10% do HP |
| Rotação | Palma do Vácuo | 2 | Aprende a Palma do Vácuo |
| Rotação | Paredão de vácuo | 3 | Aprende o Paredão de vácuo (todos os inimigos) |
