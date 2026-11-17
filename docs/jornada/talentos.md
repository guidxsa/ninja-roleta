# Árvores de talentos

> Implementada na v0.35.0; bifurcações, níveis, seis ramos do Naruto e a tela nova na v0.41.0 ([README.md](README.md)). Dados em `src/data/jornada/talents.ts`.

A árvore **reinicia a cada run** e custa pontos de talento ([progressao.md](progressao.md)).

- **Liberar**: cada nó pede o anterior do mesmo ramo, ou um dos nós indicados depois de uma bifurcação. Basta o anterior no **nível 1**.
- **Bifurcação**: alguns pontos do ramo oferecem dois caminhos. Escolher um fecha o outro nesta run ("Você escolheu o outro caminho").
- **Níveis**: a maioria dos talentos é **única**, principalmente os passivos. Alguns, quase sempre técnicas, sobem de nível, com limite de 2 ou 3 e um custo próprio por nível. Dá para voltar e subir um talento antigo a qualquer momento, mesmo depois de avançar no ramo.
- **Ramos canônicos** (v0.67.0): a raiz de Sapos, Kyuubi e Rasengan é **dada pela história** (`grantedBy`): entra carimbada, sem custo, no marco ([historia.md](historia.md#momentos-canônicos)). Antes disso, aparece tracejada como "Vem pela história", e o resto do ramo fica fechado. Os níveis da raiz continuam pagos.
- **Laços** (v0.68.0): a raiz (Não vou desistir) também vem pela história: a lição do teste do sino.
- **Talento final** (`capstone`): o último nó de cada ramo do Naruto, com aro dourado na tela; desde a v0.71.0, cada um muda uma regra do combate. Desde a v0.84.0 o Comum também tem, o prodígio desde a v0.85.0, o Uchiha desde a v0.86.0 e o Hyuuga desde a v0.87.0 (revisão em [decisoes.md](../decisoes.md)).
- **Combinação** (`requiresAll`, v0.71.0): talento que pede a junção de dois ramos ([abaixo](#combinações)).
- **Nós da conta** ficam liberados de vez por um objetivo (o ramo do Sasuke no Uchiha, o único, saiu na v0.86.0; o campo `account` segue no código). A Ōdama Rasengan saiu na v0.67.0: não pertence ao Naruto clássico e fica guardada para uma campanha Shippuden.
- O Modo Sennin ficou de fora: é pós-timeskip, e a run termina no Vale do Fim. No lugar entrou o ramo da Kyuubi.
- Nós que só existem com um elemento (`requiresElement`) ficam escondidos para quem não tem o elemento (o ramo Raio do Uchiha saiu na v0.86.0).

## Rascunho

Implementado na v0.91.0, primeiro no **Comum** (as outras classes e o Naruto seguem a árvore em ordem por enquanto). Proposta e próximos passos em [proposta-arvore.md](proposta-arvore.md); números em `talentDraft` (`src/data/jornada/balance.ts`), código em `src/core/jornada/draft.ts`.

- **Núcleo**: no começo da run, antes da primeira parada, o protagonista escolhe um entre **3 núcleos** sorteados pela seed (um de dano, um de apoio e um livre). O núcleo é de graça e vale a run toda: dá a técnica do estilo e uma versão fraca da regra final (a raiz do ramo vinha junto até a v0.91.1; agora sai no rascunho como os outros nós, e só o Elemento e a Determinação trazem um nó junto, por `coreGrants`: o Nível II e o +25% de XP). Os outros núcleos ficam fechados.
- **Oferta**: a árvore não se compra mais em ordem. A tela mostra **3 talentos** sorteados que dá para aprender ou subir (**4** com 3 pontos ou mais guardados), e só eles se compram. O primeiro cartão é do ramo do núcleo enquanto houver. Os outros saem por peso: 1, +3 se for do ramo do núcleo, +1 por tag em comum com as relíquias da run, +2 se for combinação ou talento final. A oferta sai da seed e do número de compras: reabrir a tela mostra a mesma, e ela muda a cada compra.
- **Trocar**: uma troca grátis por estágio (de cada ciclo) sorteia outra oferta.
- **Sem ordem no ramo**: no rascunho, os nós não pedem o anterior. Continuam valendo a **bifurcação** (escolher um lado fecha o outro) e as **combinações** e **assinaturas** (pedem os nós indicados).
- **Talento final**: pede **4 talentos do ramo** (sem contar o núcleo, o final e as combinações), de qualquer linha.
- **Tags**: saem dos bônus do talento e da relíquia (`modTags`): taijutsu, ninjutsu, genjutsu, clones, controle, equipe, defesa e crítico. Nenhuma relíquia precisa de tag escrita à mão.
- **Na tela**: o núcleo aparece no cabeçalho da árvore; a oferta fica acima dos ramos, com o botão **Trocar (n)**. A árvore vira o registro da build: o que dá para comprar e não está na oferta mostra "Aparece no rascunho", e o final mostra quanto falta (por exemplo, 2/4).
- Save antigo (sem o campo `draft`) segue na árvore em ordem. O prodígio (o Comum que escolhe ficar sem elemento) não usa rascunho.

### Núcleos do Comum

| Núcleo | Tipo | Ganha de graça |
|---|---|---|
| Elemento | dano | O Nível II do elemento; o ninjutsu ignora 10% da resistência |
| Ferramentas | apoio | A Armadilha de fios; inimigo atordoado leva +15% de dano da equipe |
| Estilo da Folha | dano | O Furacão da Folha; cada golpe seguido de taijutsu +3% |
| Clones | apoio | Começa as lutas com 1 clone; com clone de pé, −10% de acerto dos inimigos |
| Equipe | apoio | +5% de HP máximo dos suportes; escudo de 4% na equipe |
| Determinação | dano | Determinação (+25% de XP); 1 de HP por rodada; +10% de dano abaixo da metade do HP |

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
- Tocar seleciona: o cartão de baixo mostra o efeito, o nível e o botão **Aprender** ou **Subir para o nível N**. Aprender tem um carimbo no selo e a tinta correndo pelo traço; o contador de pontos afunda, o nível novo pinga como tinta, o caminho recusado da bifurcação é riscado e, no talento final, o kanji do ramo acende atrás do selo ([visual.md](../visual.md#movimento)).
- **Combinações**: aparecem no pé dos dois ramos que ligam, com selo redondo, linha tracejada e o nome do ramo parceiro; o cartão diz de quais ramos é e o que falta aprender.

## Naruto

Refeita na v0.71.0. Seis ramos, cada um com um **estilo**, uma **bifurcação**, uma junção e um **talento final que muda uma regra** do combate. Um ramo focado custa de 7 a 10 pontos (fora os níveis) e uma run rende cerca de 30: dá para fechar três ramos, ou dois e as combinações deles. Clones e Pegadinhas abrem desde o começo; as raízes dos outros quatro vêm da história.

| Ramo | Estilo | Bifurcação | Talento final (a regra que muda) |
|---|---|---|---|
| Clones | enxame | Rendan (ataque) ou Guarda (defesa) | Com clone ativo, o golpe de alvo único cai **sempre** no clone, sem o sorteio de 50% |
| Pegadinhas | controle | Harem (área) ou Bomba de fumaça (esquiva) | Todo golpe seu que acerta um alvo atordoado é **crítico** |
| Laços | suporte | Equipe 7 (vida) ou Grito de guerra (cura) | Uma vez por luta, **cada integrante** da equipe fica com 1 de HP em vez de cair |
| Sapos | sorteio | Gamakichi ou Gamatatsu | O Kuchiyose **gira duas vezes** e fica com o melhor sapo |
| Kyuubi | risco | Manto (escudo) ou Uma cauda (dano) | Em vez de cair, fica com 1 de HP e **entra no chakra da Kyuubi** por 3 turnos |
| Rasengan | golpe único | Foco (precisão) ou Domínio (força) | O dano que sobra de um Rasengan fatal **atravessa** para o próximo inimigo |

| Ramo | Nó | Custo | Níveis | Efeito |
|---|---|---|---|---|
| Clones | Multiclones | 1 | | O Kage Bunshin custa 2 de chakra a menos |
| Clones | Rendan Uzumaki **ou** | 2 | 3 (+1 cada) | Aprende o Rendan: 1 golpe + 1 por clone (até +2). Cada nível: +15% de dano |
| Clones | Guarda de clones | 2 | | Começa toda luta com 1 clone; +2 de dano no taijutsu |
| Clones | Clones explosivos | 2 | | Quem acerta um clone leva 4 de dano; o Kage Bunshin cria 1 clone a mais |
| Clones | Mil Clones | 2 | 2 (+1) | O Tajū Kage Bunshin causa 20% mais dano (a técnica vem da história). Nível 2: 2 de chakra a menos |
| Clones | **Exército de sombras** (final) | 3 | | Com clone ativo, o golpe de alvo único cai sempre nele; limite de clones +2 |
| Pegadinhas | Rei das pegadinhas | 1 | | Esquiva 14%; +15% de chance de aplicar efeitos; Sexy no Jutsu custa 1 de chakra a menos |
| Pegadinhas | Harem no Jutsu **ou** | 2 | | Aprende o Harem no Jutsu: pode atordoar todos |
| Pegadinhas | Bomba de fumaça | 2 | | Ativa: +30% de esquiva por 2 turnos |
| Pegadinhas | Shuriken das sombras | 2 | 3 (+1 cada) | Aprende a Shuriken das sombras (3 golpes): o dano do ramo. Cada nível: +25% de dano |
| Pegadinhas | Emboscada | 2 | | A **equipe** causa +40% de dano em alvo atordoado |
| Pegadinhas | **Mestre da trapaça** (final) | 3 | | Golpe seu que acerta alvo atordoado é sempre crítico; +5% de crítico |
| Laços | Não vou desistir | história | | Dado pela lição do teste do sino: a equipe recupera 1 de HP por rodada |
| Laços | Equipe 7 **ou** | 2 | | +12% de HP máximo dos suportes |
| Laços | Grito de guerra | 2 | 3 (+1 cada) | Aprende o Grito de guerra: cura 20 de HP de um aliado e tira atordoar e bloqueio. Cada nível: 1 de chakra a menos |
| Laços | Proteger os amigos | 2 | | +6% de dano da equipe |
| Laços | Ninguém fica para trás | 2 | | Aprende Reanimação; a equipe começa as lutas com escudo de 5% |
| Laços | **Futuro Hokage** (final) | 3 | | Uma vez por luta, cada integrante fica com 1 de HP em vez de cair; +5% de acerto da equipe |
| Sapos | Kuchiyose no Jutsu | história | | Dado pelo contrato com os sapos: invoca um sapo sorteado |
| Sapos | Gamakichi **ou** | 2 | 3 (+1 cada) | O Gamakichi sai mais no sorteio (+15 de peso) e o óleo em chamas causa +20% de dano. Cada nível: +20% de dano |
| Sapos | Gamatatsu | 2 | | O Gamatatsu sai mais no sorteio (+15 de peso); escudo de 5% no começo das lutas |
| Sapos | Laço com o chefe | 2 | 3 (+2 cada) | O Gamabunta sai mais (+8 de peso). Cada nível: +6 de peso |
| Sapos | Fôlego do contrato | 2 | | O Kuchiyose custa 3 de chakra a menos; Gamabunta +20% de dano |
| Sapos | **Chefe dos sapos** (final) | 3 | | O Kuchiyose gira duas vezes e fica com o sapo que vem depois na lista (girinos, Gamakichi, Gamatatsu, Gamabunta) |
| Kyuubi | Chakra da raposa | história | | Dado depois do Haku: recupera 3 de HP por rodada |
| Kyuubi | Manto da Kyuubi **ou** | 2 | | Ativa de classe: paga 8% do HP, ganha escudo de 20% |
| Kyuubi | Uma cauda | 2 | | Ativa: paga 10% do HP, +35% de dano por 3 turnos |
| Kyuubi | Explosão de chakra | 2 | 2 (+1) | Aprende a Explosão (todos os inimigos); +20% de dano abaixo da metade do HP. Nível 2: +20% de dano da Explosão |
| Kyuubi | Chakra vermelho | 2 | | +10% de dano abaixo da metade do HP; recupera mais 2 de HP por rodada |
| Kyuubi | **Fúria da Kyuubi** (final) | 3 | | Uma vez por luta, em vez de cair fica com 1 de HP e entra no chakra da Kyuubi por 3 turnos (cura 15%, +20% nos status, Garras da Kyuubi) |
| Rasengan | Rasengan | história | 3 (+2 cada) | Dado pelo treino com o Jiraiya. Cada nível: +15% de dano e 1 de chakra a menos |
| Rasengan | Foco **ou** | 2 | | +10% de crítico e +5% de acerto |
| Rasengan | Domínio do Rasengan | 2 | | Rasengan: +25% de dano, 2 de chakra a menos |
| Rasengan | Rotação estável | 2 | | Rasengan +10% de dano; derrubar um inimigo devolve 3 de chakra |
| Rasengan | **Rasengan que atravessa** (final) | 3 | | O dano que sobra de um Rasengan fatal passa para o próximo inimigo de pé (uma vez, sem corrente); Rasengan +15% de dano |

### Combinações

Os ramos não são independentes: seis talentos de **combinação** ligam ramos vizinhos, em anel. Cada um pede a **junção dos dois ramos** (o nó logo depois da bifurcação), custa 2 pontos e aparece no pé dos dois ramos, com selo redondo, linha tracejada e o nome do ramo parceiro. Quem investe em dois ramos ganha um talento que nenhum deles dá sozinho.

| Combinação | Talento | Pede | Efeito |
|---|---|---|---|
| Clones + Pegadinhas | Clone disfarçado | Clones explosivos e Shuriken das sombras | O Kage Bunshin cria 1 clone a mais; +10% de chance de aplicar efeitos |
| Pegadinhas + Laços | Distração | Shuriken das sombras e Proteger os amigos | A equipe inteira ganha +15% de chance de aplicar efeitos |
| Laços + Sapos | Sapos de guarda | Proteger os amigos e Laço com o chefe | A equipe começa as lutas com mais 8% de escudo |
| Sapos + Kyuubi | Chakra emprestado | Laço com o chefe e Explosão de chakra | Com o HP abaixo da metade, o Gamabunta sai muito mais no Kuchiyose (+30 de peso) |
| Kyuubi + Rasengan | Rasengan da Kyuubi | Explosão de chakra e Rotação estável | Rasengan +20% de dano; +15% de dano abaixo da metade do HP |
| Rasengan + Clones | Rasengan com clone (2 níveis) | Rotação estável e Clones explosivos | Aprende o Rasengan com clone: +1 golpe por clone (até +2). Nível 2: +20% de dano |

No código: `requiresAll` no nó (`src/core/jornada/talents.ts`); as regras dos talentos finais são campos de `FighterMods` (`cloneShield`, `stunnedAlwaysCrit`, `rollTwice`, `surviveForm`, `techOverflow`, `lowHpRollWeights`), com testes em `tests/talentos.test.ts`.

### Medir as builds

`npm run sim:jornada -- 300 2 --ramos` joga a História com uma build focada por ramo e por combinação (gasta primeiro no ramo, guarda pontos para ele e monta o moveset com as técnicas dele) e mostra a vitória de cada uma, onde ela cai e a diferença entre a melhor e a pior. `--so-ramos` deixa as combinações de fora, `--ramo=<nome>` roda uma build só e `--talentos` lista os talentos mais comprados. Os números da v0.71.0 estão no [registro](../registro.md).

## Níveis nas outras classes

| Classe | Talento | Níveis | Cada nível |
|---|---|---|---|
| Comum | Nível II (ramo Elemento) | 3 (+1 cada) | +20% de dano |
| Comum | Selo explosivo | 2 (+1) | +25% de dano |
| Comum | Furacão da Folha (Estilo da Folha) | 3 (+1 cada) | +15% de dano |
| Prodígio | Furacão da Folha | 3 (+1 cada) | +20% de dano |
| Prodígio | Lótus Primária | 2 (+2) | +20% de dano |
| Prodígio | Entrada dinâmica | 2 (+1) | +25% de dano |
| Uchiha | Flor de Fênix | 3 (+1 cada) | +20% de dano |
| Uchiha | Ilusão dos corvos | 3 (+1 cada) | +20% de dano |
| Uchiha | Shuriken giratória | 3 (+1 cada) | +25% de dano |
| Hyuuga | 64 Palmas | 2 (+2) | +25% de dano |
| Hyuuga | Palma do Vácuo | 3 (+1 cada) | +20% de dano |

## Comum (Caminho Ninja)

Refeita na v0.84.0, no molde do Naruto: o ninja que faz de tudo. Desde a v0.91.0 se compra pelo [rascunho](#rascunho), com um núcleo por ramo. **Seis ramos em anel**, cada um com raiz, **bifurcação**, junção, um nó a mais e um **talento final** que muda uma regra; **seis combinações** ligam ramos vizinhos e **três assinaturas** premiam combos fortes. Um ramo custa 10 pontos; a árvore toda, uns 80, e uma run rende ~18: dá para fechar um ramo e meio, ou montar um combo. O ramo Elemento ensina as técnicas do elemento sorteado ([classes.md](classes.md#sorteio-do-elemento)).

| Ramo | Estilo | Bifurcação | Talento final (a regra que muda) |
|---|---|---|---|
| Elemento | poder | Afinidade (dano) ou Fluxo de chakra (custo e efeito) | O ninjutsu **ignora 30% da resistência** |
| Ferramentas | controle | Selo explosivo (área) ou Armadilha de fios (atordoar) | Inimigo atordoado leva **+40% de dano de toda a equipe** |
| Estilo da Folha | sequência | Furacão da Folha (golpes) ou Punho firme (penetração) | Técnicas de taijutsu ganham **1 golpe** e cada golpe seguido bate +7% (até +30%) |
| Clones | enganação | Kawarimi (esquiva) ou Clone de ataque (o clone bate) | Com clone de pé, os inimigos têm **−25% de acerto** em você |
| Equipe | suporte | Comando (dano) ou Cuidado (cura) | Uma vez por luta, **cada integrante** fica com 1 de HP em vez de cair |
| Determinação | resistência | Garra (HP baixo) ou Teimosia (regeneração) | Fica com 1 de HP em vez de cair, **recupera 25% e fica firme** |

| Ramo | Nó | Custo | Níveis | Efeito |
|---|---|---|---|---|
| Elemento | Nível II | 1 | 3 (+1 cada) | Aprende o nível II do elemento. Cada nível: +20% de dano |
| Elemento | Afinidade **ou** | 2 | | +15% de dano de ninjutsu; a barreira do elemento (o raio não tem) |
| Elemento | Fluxo de chakra | 2 | | Técnicas custam 1 a menos; +10% de chance de efeito |
| Elemento | Nível III | 2 | | Aprende o nível III do elemento; +25% de dano de ninjutsu (v0.88.3) |
| Elemento | Natureza dominada | 2 | | Os efeitos que você aplica duram 1 turno a mais |
| Elemento | **Mestre do elemento** (final) | 3 | | Ninjutsu ignora 30% da resistência; técnicas custam 1 a menos |
| Ferramentas | Kunai afiada | 1 | | +2 de dano no taijutsu |
| Ferramentas | Selo explosivo **ou** | 2 | 2 (+1) | Aprende o Selo explosivo (todos os inimigos). Nível 2: +25% de dano |
| Ferramentas | Armadilha de fios | 2 | | Aprende a Armadilha de fios; os efeitos duram 1 turno a mais |
| Ferramentas | Bolsa ninja | 2 | | Kits rendem +25%; começa as lutas com +5 de chakra; +20% de dano de taijutsu, +5% de acerto e +10% de dano (v0.88.3) |
| Ferramentas | Arsenal | 2 | | Selo e Armadilha custam 2 a menos; +10% de chance de efeito |
| Ferramentas | **Mestre das armadilhas** (final) | 3 | | Inimigo atordoado leva +40% de dano da equipe |
| Estilo da Folha | Treino básico | 1 | | +1 de dano no taijutsu; +5% de acerto |
| Estilo da Folha | Furacão da Folha **ou** | 2 | 3 (+1 cada) | Aprende o Furacão da Folha (2 golpes, sem chakra). Cada nível: +15% de dano |
| Estilo da Folha | Punho firme | 2 | | O taijutsu ignora 20% da resistência |
| Estilo da Folha | Ritmo de luta | 2 | | Cada golpe de taijutsu que acerta devolve 1 de chakra |
| Estilo da Folha | Reflexos | 2 | | Esquiva 6%; +5% de crítico |
| Estilo da Folha | **Combo da Folha** (final) | 3 | | Taijutsu +1 golpe; cada golpe seguido +7% (até +30%) |
| Clones | Bunshin aprimorado | 1 | | O clone custa 1 de chakra a menos |
| Clones | Kawarimi **ou** | 2 | | Esquiva 12% |
| Clones | Clone de ataque | 2 | | O clone bate junto com 25% do dano de um golpe |
| Clones | Multiclones | 2 | | O clone sai com 1 a mais; começa as lutas com 2 clones; +10% de dano (v0.88.3) |
| Clones | Clone explosivo | 2 | | Quem acerta um clone leva 4 de dano |
| Clones | **Ilusão perfeita** (final) | 3 | | Com clone de pé, −25% de acerto dos inimigos; limite de clones +1 |
| Equipe | Trabalho em equipe | 1 | | +8% de HP máximo dos suportes |
| Equipe | Comando **ou** | 2 | | A equipe causa +10% de dano |
| Equipe | Cuidado | 2 | | Curas na equipe rendem +25% |
| Equipe | Primeiros socorros | 2 | | Aprende Reanimação |
| Equipe | Formação | 2 | | A equipe começa as lutas com escudo de 8% |
| Equipe | **Líder nato** (final) | 3 | | Uma vez por luta, cada integrante fica com 1 de HP em vez de cair |
| Determinação | Determinação | 1 | | +25% de XP |
| Determinação | Garra **ou** | 2 | | +25% de dano abaixo da metade do HP |
| Determinação | Teimosia | 2 | | 2 de HP por rodada; Defender cura 8% |
| Determinação | Trabalho duro | 2 | | +10% de dano |
| Determinação | Resiliência | 2 | | Esquiva 6%; 1 de HP por rodada |
| Determinação | **Vontade do Fogo** (final) | 3 | | Uma vez por luta fica com 1 de HP, recupera 25% e fica firme |

### Combinações e assinaturas do Comum

As combinações (2 pontos) pedem a junção dos dois ramos vizinhos, em anel. As assinaturas (3 pontos) pedem o talento final de um ramo e a junção do outro: são os combos fortes entre si.

| Tipo | Talento | Pede | Efeito |
|---|---|---|---|
| Combinação | Selo elemental | Nível III e Bolsa ninja | Selo e Armadilha +20% de dano; +10% de chance de efeito |
| Combinação | Kunai e punho | Bolsa ninja e Ritmo de luta | +3 de dano no taijutsu; +5% de crítico |
| Combinação | Sombra da Folha | Ritmo de luta e Multiclones | O clone bate junto com 35% do dano |
| Combinação | Cobertura | Multiclones e Primeiros socorros | Cada integrante começa as lutas com 1 clone |
| Combinação | Laço de aço | Primeiros socorros e Trabalho duro | Abaixo da metade do HP, cada integrante causa +15% |
| Combinação | Chama interior | Trabalho duro e Nível III | +15% de dano abaixo da metade do HP; técnicas custam 1 a menos |
| Assinatura | **Explosão em cadeia** | Mestre das armadilhas e Nível III | Ninjutsu em inimigo atordoado espalha 50% do dano nos outros. *A armadilha prende, o elemento castiga em área.* |
| Assinatura | **Mil golpes** | Combo da Folha e Multiclones | Cada clone de pé dá 1 golpe a mais ao taijutsu (até +2). *O combo vira uma sequência enorme.* |
| Assinatura | **Nunca sozinho** | Vontade do Fogo e Primeiros socorros | Ao ficar de pé com 1 de HP, o resto da equipe recupera 15%. *Vira o jogo na beira da derrota.* |

No código: os talentos finais e as assinaturas usam campos de `FighterMods` (`typePen`, `cloneEnemyAccuracy`, `taijutsuExtraHits`, `taijutsuHitsPerClone`, `comboStepPct`, `taijutsuHitChakra`, `cloneStrikePct`, `stunnedSplashPct`, `surviveHealPct`, `surviveTeamHealPct`), com testes em `tests/balanceamento.test.ts`. Builds: `npm run sim:jornada -- 300 2 --ramos --classe=commonNinja`.

## Prodígio (Caminho Ninja)

Refeita na v0.85.0, no molde do Comum. O prodígio é um personagem genérico: os nomes não citam personagens da obra (as técnicas do kit, Lótus, Furacão da Folha e Punho Bêbado, são as mesmas do Roleta). **Seis ramos em anel**, bifurcação e talento final em cada, **seis combinações** e **três assinaturas**. Começa com o Portão da Abertura; Portão da Vida libera até o 3º portão e a Lótus Oculta até o 5º.

| Ramo | Estilo | Bifurcação | Talento final (a regra que muda) |
|---|---|---|---|
| Portões | risco | Abertura rápida (abrir custa menos) ou Corpo treinado (escudo) | Abaixo de 25% do HP, o portão aberto **sobe um nível sozinho**, sem custo |
| Juventude | moral e crítico | Vigor (regeneração) ou Promessa (HP baixo) | O crítico causa **×2** (em vez de ×1,5) e devolve 2 de chakra |
| Punho Bêbado | caos | Gole extra (crítico) ou Cambalear (esquiva) | O Punho Bêbado ganha **2 golpes** e +15% de dano |
| Treino | preparo | Mil voltas (escudo) ou Flexões (dano) | O **primeiro golpe de cada luta** é crítico; +10% de dano |
| Rivalidade | duelo | Contra-ataque (revide) ou Desafio (alvo saudável) | Contra quem tem **mais HP máximo** que você: +30% de dano e +10% de acerto |
| Mestre e pupilo | suporte | Treino em dupla (dano) ou Olho do mestre (HP dos suportes) | Uma vez por luta, quando alguém da equipe cai, **os de pé ganham +20% de dano** por 3 turnos |

| Ramo | Nó | Custo | Níveis | Efeito |
|---|---|---|---|---|
| Portões | Portão da Vida | 1 | | Libera o 2º e o 3º portão |
| Portões | Abertura rápida **ou** | 2 | | Abrir cada portão custa 1 de chakra a menos |
| Portões | Corpo treinado | 2 | | Começa as lutas com escudo de 10% |
| Portões | Lótus Primária | 2 | 2 (+2) | Aprende a Lótus Primária. Nível 2: +20% de dano |
| Portões | Lótus Oculta | 2 | | Aprende a Lótus Oculta e libera o 4º e o 5º portão |
| Portões | **Portões sem freio** (final) | 3 | | Abaixo de 25% do HP, o portão sobe sozinho |
| Juventude | Juventude | 1 | | +5% de crítico e de acerto |
| Juventude | Vigor **ou** | 2 | | 2 de HP por rodada |
| Juventude | Promessa | 2 | | +25% de dano abaixo da metade do HP |
| Juventude | Furacão da Folha | 2 | 3 (+1 cada) | Aprende o Furacão da Folha. Cada nível: +20% de dano |
| Juventude | Espírito incansável | 2 | | +10% de dano |
| Juventude | **Chama da juventude** (final) | 3 | | Crítico ×2 e devolve 2 de chakra |
| Punho Bêbado | Corpo solto | 1 | | +5% de acerto |
| Punho Bêbado | Gole extra **ou** | 2 | | +8% de crítico |
| Punho Bêbado | Cambalear | 2 | | Esquiva 8% |
| Punho Bêbado | Punho Bêbado | 2 | | Aprende o Punho Bêbado (3 golpes, crítico alto) |
| Punho Bêbado | Garrafa vazia | 2 | | Derrubar um inimigo devolve 3 de chakra |
| Punho Bêbado | **Bêbado de verdade** (final) | 3 | | Punho Bêbado +2 golpes e +15% de dano |
| Treino | Pesos fora | 1 | | Esquiva 5% |
| Treino | Mil voltas **ou** | 2 | | Escudo de 10% no começo das lutas |
| Treino | Flexões | 2 | | +3 de dano no taijutsu |
| Treino | Mestre do taijutsu | 2 | | +30% de dano de taijutsu e +10% de dano; esquiva 10% (v0.88.3) |
| Treino | Resistência | 2 | | Uma vez por luta fica com 1 de HP |
| Treino | **Tirar os pesos** (final) | 3 | | 1º golpe da luta crítico; +10% de dano; esquiva +5% |
| Rivalidade | Entrada dinâmica | 1 | 2 (+1) | Aprende a Entrada dinâmica. Nível 2: +25% de dano |
| Rivalidade | Contra-ataque **ou** | 2 | | 30% de revidar com 8 de dano ao apanhar de golpe de alvo único |
| Rivalidade | Desafio | 2 | | +20% de dano contra inimigo acima da metade do HP |
| Rivalidade | Espírito de rival | 2 | | +5% de acerto, +10% de crítico e +25% de dano (v0.88.3) |
| Rivalidade | Não vou perder | 2 | | +25% de dano abaixo da metade do HP; Defender cura 6% |
| Rivalidade | **Duelo** (final) | 3 | | Contra quem tem mais HP máximo: +30% de dano, +10% de acerto |
| Mestre e pupilo | Grito de incentivo | 1 | | A equipe +5% de acerto |
| Mestre e pupilo | Treino em dupla **ou** | 2 | | A equipe +2 de dano no taijutsu |
| Mestre e pupilo | Olho do mestre | 2 | | +10% de HP máximo dos suportes |
| Mestre e pupilo | Aula prática | 2 | | A equipe +5% de acerto e de crítico e +25% de dano (v0.88.3) |
| Mestre e pupilo | Espírito de equipe | 2 | | A equipe recupera 2 de HP por rodada |
| Mestre e pupilo | **Lição do mestre** (final) | 3 | | Quando alguém cai, os de pé +20% de dano por 3 turnos |

### Combinações e assinaturas do prodígio

| Tipo | Talento | Pede | Efeito |
|---|---|---|---|
| Combinação | Lótus da juventude | Lótus Primária e Furacão da Folha | Lótus Primária e Oculta +20% de dano |
| Combinação | Euforia | Furacão da Folha e Punho Bêbado | Punho Bêbado e Furacão +20% de dano |
| Combinação | Golpe solto | Punho Bêbado e Mestre do taijutsu | O taijutsu ignora 15% da resistência |
| Combinação | Disciplina | Mestre do taijutsu e Espírito de rival | Esquiva 8%; +2 de dano no taijutsu |
| Combinação | Nunca perder | Espírito de rival e Aula prática | Contra quem tem mais HP máximo, a equipe +10% de dano |
| Combinação | Fogo compartilhado | Aula prática e Lótus Primária | A equipe começa as lutas com escudo de 5% |
| Assinatura | **Lótus Oculta perfeita** | Portões sem freio e Espírito de rival | Com o 5º portão aberto, as técnicas não cobram HP |
| Assinatura | **Furacão embriagado** | Bêbado de verdade e Furacão da Folha | Furacão +1 golpe; +10% de crítico |
| Assinatura | **Vigor compartilhado** | Lição do mestre e Furacão da Folha | A equipe recupera 2 de HP por rodada |

No código: `gateOpenDiscount`, `gateAutoUp`, `critMultBonus`, `critChakra`, `techExtraHits`, `openingCrit`, `counterChance`/`counterDamage`, `duelDamageMult`/`duelAccuracy`, `healthyTargetMult`, `fallenRally` e `hpCostFreeAtGate` em `FighterMods`. Builds: `npm run sim:jornada -- 300 2 --ramos --classe=prodigy`.

## Uchiha (Caminho Ninja)

Refeita na v0.86.0, no molde do Comum: um ninja genérico do clã. **Seis ramos em anel**, bifurcação e talento final em cada, **seis combinações** e **três assinaturas**. O ramo do Sasuke (easter egg da conta) e o ramo Raio (Chidori) saíram: o Sasuke vai ganhar a própria História.

| Ramo | Estilo | Bifurcação | Talento final (a regra que muda) |
|---|---|---|---|
| Sharingan | leitura | Olhar copiador (crítico e acerto) ou Previsão (esquiva) | Com o Sharingan ligado, **30% de chance de anular** um golpe de alvo único |
| Fogo do clã | dano em área | Chama do clã (ninjutsu) ou Fagulha rápida (custo e efeito) | A queimadura que você aplica **dói em dobro**; os efeitos duram +1 turno |
| Ilusões | controle | Olhar do medo (Medo) ou Prisão (atordoar) | Genjutsu contra alvo controlado **não erra**; +35% de dano contra eles |
| Armas do clã | precisão | Shuriken dupla (+1 golpe) ou Fios de aço (Armadilha de fios) | As técnicas de arma acertam **também os outros inimigos** com 50% do dano |
| Orgulho do clã | duelo e vingança | Frieza (crítico) ou Raiva (HP baixo) | Abaixo de 30% do HP ou com alguém da equipe caído: **+50% de dano** |
| Polícia do clã | suporte e ordem | Vigia (HP dos suportes) ou Interrogatório (efeitos +1 turno) | Inimigo controlado leva **+30% de dano de toda a equipe** |

| Ramo | Nó | Custo | Níveis | Efeito |
|---|---|---|---|---|
| Sharingan | 3 tomoe | 1 | | Evolui o Sharingan: +20% de acerto, +25% de esquiva e +10% de dano por 4 turnos |
| Sharingan | Olhar copiador **ou** | 2 | | +5% de crítico e de acerto |
| Sharingan | Previsão | 2 | | Esquiva 8% |
| Sharingan | Leitura de movimento | 2 | | +5% de acerto, +10% de crítico e +10% de dano; esquiva 5% (v0.88.3) |
| Sharingan | Fluxo do Sharingan | 2 | | +10% de dano; 2 de HP por rodada |
| Sharingan | **Leitura total** (final) | 3 | | Com o Sharingan ligado, 30% de anular um golpe de alvo único |
| Fogo do clã | Flor de Fênix | 1 | 3 (+1 cada) | Aprende a Flor de Fênix. Cada nível: +20% de dano |
| Fogo do clã | Chama do clã **ou** | 2 | | +15% de dano de ninjutsu |
| Fogo do clã | Fagulha rápida | 2 | | Técnicas custam 1 a menos; +10% de chance de efeito |
| Fogo do clã | Grande Labareda | 2 | | Aprende a Grande Labareda |
| Fogo do clã | Mestre do fogo | 2 | | Técnicas custam 1 a menos |
| Fogo do clã | **Fogo que não apaga** (final) | 3 | | Queimadura em dobro; efeitos +1 turno |
| Ilusões | Ilusão dos corvos | 1 | 3 (+1 cada) | Aprende a Ilusão dos corvos. Cada nível: +20% de dano |
| Ilusões | Olhar do medo **ou** | 2 | | Cada golpe que acerta: 20% de Medo |
| Ilusões | Prisão | 2 | | Cada golpe de genjutsu que acerta: 20% de atordoar |
| Ilusões | Mestre das ilusões | 2 | | +50% de dano de genjutsu e +10% de dano; Medo em 15% dos golpes (v0.88.3) |
| Ilusões | Tsukuyomi | 2 | | Aprende o Tsukuyomi |
| Ilusões | **Mundo da ilusão** (final) | 3 | | Genjutsu em alvo controlado não erra; +35% de dano contra eles |
| Armas do clã | Mãos rápidas | 1 | | Shuriken giratória e Armadilha de fios custam 1 a menos; +5% de acerto |
| Armas do clã | Shuriken dupla **ou** | 2 | | A Shuriken giratória ganha 1 golpe |
| Armas do clã | Fios de aço | 2 | | Aprende a Armadilha de fios |
| Armas do clã | Shuriken giratória | 2 | 3 (+1 cada) | Aprende a Shuriken giratória (4 ×3, 3 de chakra). Cada nível: +25% de dano |
| Armas do clã | Lâmina afiada | 2 | | +2 de dano no taijutsu; +5% de crítico |
| Armas do clã | **Chuva de shuriken** (final) | 3 | | As técnicas de arma acertam também os outros inimigos com 50% |
| Orgulho do clã | Orgulho do clã | 1 | | +8% de dano |
| Orgulho do clã | Frieza **ou** | 2 | | +8% de crítico |
| Orgulho do clã | Raiva | 2 | | +30% de dano abaixo da metade do HP |
| Orgulho do clã | Olhar frio | 2 | | +5% de acerto, +10% de crítico e +20% de dano (v0.88.3) |
| Orgulho do clã | Orgulho ferido | 2 | | Defender cura 8%; 1 de HP por rodada |
| Orgulho do clã | **Vingança** (final) | 3 | | Abaixo de 30% do HP ou com aliado caído: +50% de dano |
| Polícia do clã | Patrulha | 1 | | A equipe +5% de acerto |
| Polícia do clã | Vigia **ou** | 2 | | +10% de HP máximo dos suportes |
| Polícia do clã | Interrogatório | 2 | | Os efeitos que você aplica duram 1 turno a mais |
| Polícia do clã | Disciplina do clã | 2 | | A equipe +5% de acerto e de crítico e +25% de dano (v0.88.3) |
| Polícia do clã | Custódia | 2 | | A equipe +10% de chance de efeito |
| Polícia do clã | **Ordem do clã** (final) | 3 | | Inimigo controlado leva +30% de dano da equipe |

### Combinações e assinaturas do Uchiha

| Tipo | Talento | Pede | Efeito |
|---|---|---|---|
| Combinação | Olho da chama | Leitura de movimento e Grande Labareda | +5% de acerto; +10% de dano de ninjutsu |
| Combinação | Chama ilusória | Grande Labareda e Mestre das ilusões | Mais 10% de chance de dar Medo por golpe |
| Combinação | Arma ilusória | Mestre das ilusões e Shuriken giratória | Todo golpe em alvo atordoado é crítico |
| Combinação | Precisão fria | Shuriken giratória e Olhar frio | +10% de crítico |
| Combinação | Honra do clã | Olhar frio e Disciplina do clã | Abaixo da metade do HP, cada integrante +10% de dano |
| Combinação | Vigilância | Disciplina do clã e Leitura de movimento | A equipe esquiva 5% |
| Assinatura | **Inferno ilusório** | Fogo que não apaga e Mestre das ilusões | Inimigo queimando leva +30% de dano |
| Assinatura | **Leitura de lâminas** | Leitura total e Shuriken giratória | Ao anular um golpe, revida com 8 de dano |
| Assinatura | **Olhos da vingança** | Vingança e Leitura de movimento | Com a Vingança valendo, +20% de acerto |

No código: `readNullChance`/`readCounterDamage`, `burnMult`, `genjutsuStunChance`, `illusionSureHit`, `techSplash`, `vengeanceMult`/`vengeanceAccuracy` e `burningDamageMult` em `FighterMods`. Builds: `npm run sim:jornada -- 300 2 --ramos --classe=uchihaNinja`.

## Hyuuga (Caminho Ninja)

Reformulado na v0.87.0, no molde do Comum: um ninja genérico do clã. **Seis ramos**, bifurcação e talento final em cada, **sete combinações** e **três assinaturas**. **Casa principal e Casa secundária se excluem pela raiz**: o Hyuuga nasce numa só, então cada run usa cinco ramos (cinco das sete combinações). A Palma do Vácuo, pendente desde o Roleta, fica na bifurcação dos Oito Trigramas.

| Ramo | Estilo | Bifurcação | Talento final (a regra que muda) |
|---|---|---|---|
| Byakugan | visão | Byakugan desperto (evolui o olho) ou Pontos vitais (crítico) | Os seus golpes **ignoram a esquiva** dos inimigos; esquiva +10% |
| Punho Suave | chakra do alvo | Fechar pontos (drena 2 de chakra por golpe) ou Golpe interno (penetração) | Todo taijutsu que acerta tem **30% de bloquear o chakra** |
| Rotação | defesa | Postura do clã (escudo) ou Giro rápido (Rotação mais barata) | O seu escudo **devolve 75%** do dano que segura |
| Oito Trigramas | sequência | Palma do Vácuo (à distância) ou Ritmo das palmas (+1 golpe) | Cada taijutsu que acerta tira 1 de chakra; contra alvo **sem chakra, +30% de dano** |
| Casa principal | comando | Ordem (equipe +dano) ou Linhagem (HP dos suportes) | Ao ligar o Byakugan, **a equipe ganha o acerto dele** |
| Casa secundária | proteção | Guarda-costas (Defendendo, protege o mais ferido) ou Vigília (equipe +esquiva) | **35% dos golpes** de alvo único contra aliados **caem em você** |

| Ramo | Nó | Custo | Níveis | Efeito |
|---|---|---|---|---|
| Byakugan | Visão ampla | 1 | | +5% de acerto; o Byakugan custa 1 a menos |
| Byakugan | Byakugan desperto **ou** | 2 | | Evolui o Byakugan: não erra, +30% de penetração e +15% de dano por 4 turnos |
| Byakugan | Pontos vitais | 2 | | +10% de crítico |
| Byakugan | Olhos que tudo veem | 2 | | Esquiva 8%; +10% de crítico e +10% de dano (v0.88.3) |
| Byakugan | Leitura do chakra | 2 | | +5% de acerto e de dano; derrubar um inimigo devolve 3 de chakra |
| Byakugan | **Visão de 360°** (final) | 3 | | Ignora a esquiva dos inimigos; esquiva +10% |
| Punho Suave | Punho Suave | 1 | | +15% de dano de taijutsu |
| Punho Suave | Fechar pontos **ou** | 2 | | Cada taijutsu que acerta tira 2 de chakra do alvo |
| Punho Suave | Golpe interno | 2 | | O taijutsu ignora 25% da resistência |
| Punho Suave | Tenketsu | 2 | | Palma Suave +30% de dano; +20% de dano de taijutsu (v0.88.3) |
| Punho Suave | Fluxo interrompido | 2 | | +30% de dano em alvo com o chakra bloqueado |
| Punho Suave | **Tenketsu selado** (final) | 3 | | Taijutsu que acerta: 30% de bloquear o chakra |
| Rotação | Rotação | 1 | | Aprende a Rotação (escudo) |
| Rotação | Postura do clã **ou** | 2 | | Escudo de 12% no começo das lutas |
| Rotação | Giro rápido | 2 | | A Rotação custa 2 a menos |
| Rotação | Paredão de vácuo | 2 | | Aprende o Paredão de vácuo; +15% de dano; esquiva 8% (v0.88.3) |
| Rotação | Equilíbrio | 2 | | Defender cura 8%; 2 de HP por rodada |
| Rotação | **Defesa absoluta** (final) | 3 | | O escudo devolve 75% do que segura |
| Oito Trigramas | Postura dos trigramas | 1 | | +5% de acerto; +1 de dano no taijutsu |
| Oito Trigramas | Palma do Vácuo **ou** | 2 | 3 (+1 cada) | Aprende a Palma do Vácuo. Cada nível: +20% de dano |
| Oito Trigramas | Ritmo das palmas | 2 | | 64 e 128 Palmas +1 golpe |
| Oito Trigramas | 64 Palmas | 2 | 2 (+2) | Aprende as 64 Palmas. Nível 2: +25% de dano |
| Oito Trigramas | 128 Palmas | 2 | | Aprende as 128 Palmas |
| Oito Trigramas | **Campo dos trigramas** (final) | 3 | | Taijutsu tira 1 de chakra; +30% contra alvo sem chakra |
| Casa principal | Herança da casa principal | 1 | | A equipe +5% de acerto. **Fecha a Casa secundária** |
| Casa principal | Ordem **ou** | 2 | | A equipe +15% de dano |
| Casa principal | Linhagem | 2 | | +10% de HP máximo dos suportes |
| Casa principal | Autoridade | 2 | | A equipe +5% de crítico |
| Casa principal | Postura de comando | 2 | | A equipe recupera 2 de HP por rodada |
| Casa principal | **Herdeiro do clã** (final) | 3 | | O acerto do seu Byakugan vale para a equipe |
| Casa secundária | Dever da casa secundária | 1 | | Esquiva 8%; Defender cura 5%. **Fecha a Casa principal** |
| Casa secundária | Guarda-costas **ou** | 2 | | Defendendo, toma os golpes de alvo único no lugar do aliado mais ferido |
| Casa secundária | Vigília | 2 | | A equipe esquiva 5% |
| Casa secundária | Lealdade | 2 | | Esquiva 8%; 5 de HP por rodada; começa as lutas com escudo de 12%; +10% de dano (v0.88.3) |
| Casa secundária | Corpo de escudo | 2 | | Escudo de 12% no começo das lutas |
| Casa secundária | **Guardião** (final) | 3 | | 35% dos golpes contra aliados caem em você; 2 de HP por rodada |

### Combinações e assinaturas do Hyuuga

O anel passa pela casa escolhida: Byakugan, Punho Suave, Rotação, Oito Trigramas, a casa e de volta ao Byakugan.

| Tipo | Talento | Pede | Efeito |
|---|---|---|---|
| Combinação | Mira nos pontos | Olhos que tudo veem e Tenketsu | Todo golpe em alvo com o chakra bloqueado é crítico |
| Combinação | Giro suave | Tenketsu e Paredão de vácuo | Quem bate no seu escudo perde 3 de chakra |
| Combinação | Trigrama defensivo | Paredão de vácuo e 64 Palmas | As Palmas que acertam dão escudo de 5% |
| Combinação | Técnica do clã | 64 Palmas e Autoridade (casa principal) | Palmas +20% de dano |
| Combinação | Trigrama protetor | 64 Palmas e Lealdade (casa secundária) | As Palmas que acertam dão escudo de 5% ao aliado mais ferido |
| Combinação | Byakugan do herdeiro | Autoridade (casa principal) e Olhos que tudo veem | Fortalecimentos +2 turnos; a equipe +10% de crítico |
| Combinação | Olhos do guardião | Lealdade (casa secundária) e Olhos que tudo veem | Ao tomar um golpe por um aliado, revida com 8 |
| Assinatura | **Oito Trigramas, 128 Palmas** | Campo dos trigramas e Tenketsu | Contra alvo sem chakra, cada golpe das Palmas: 30% de atordoar |
| Assinatura | **Ordem do patriarca** | Herdeiro do clã e Tenketsu | Efeitos +1 turno; a equipe +20% de dano em alvo bloqueado |
| Assinatura | **Esfera absoluta** | Guardião e Paredão de vácuo | O escudo que você ergue vale também para a equipe (metade) |

No código: `ignoreEvasion`, `taiHitDrain`, `chakraBlockedDamageMult`, `taiChakraBlockChance`, `shieldReflectPct`, `shieldDrain`, `noChakraDamageMult`, `shareBoost`, `boostTurnsBonus`, `protectChance`, `guardProtect`, `protectCounter`, `shieldShare`, `techShieldOnHit`/`allyShieldOnHit`, `blockedAlwaysCrit` e `techStunNoChakra` em `FighterMods`; a exclusão das casas usa `excludes` nas raízes. Builds: `npm run sim:jornada -- 300 2 --ramos --classe=hyuugaNinja`.
