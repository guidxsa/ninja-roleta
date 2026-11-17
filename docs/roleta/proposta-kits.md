# Proposta: Roleta rápido e explosivo (para aprovar)

Item 40 de [decisoes.md](../decisoes.md). Nada daqui está no código ainda. Os números são o ponto de partida: os finais saem da simulação, com a meta 90/65/40/15 por origem (±5) e 3 a 6 rodadas por luta (6 a 8 no chefe).

## Princípios

- **Uma passiva por origem**, que evolui nos níveis 4 e 7 e faz sozinha o que as ativas faziam. A dica descreve o efeito em palavras, sem a conta.
- **2 ou 3 técnicas-chave** (sem contar o Taijutsu básico), que sobem sozinhas com o nível.
- **Turno de um toque**: técnica, Defender, Concentrar, mais o item da bolsa (que não gasta a vez). Não existe mais botão de ativa.
- **Saem do Roleta**: as ativas, os clones e as barreiras (ficam na Jornada e no código, com testes). O Jinchuuriki continua: o Manto já é automático.
- **Prodígio sem natureza**: nada de chip, roleta ou dica de natureza.

## Kits

| Origem | Passiva (nível 1 → 4 → 7) | Técnicas-chave |
|---|---|---|
| **Comum** | **Determinação**: +25% de XP e +1 no maior ataque por nível. Na 1ª rodada de cada luta, **Esforço** sozinho (+3 nos ataques por 3 rodadas). 4: Nunca desistir (na 1ª vez abaixo de 25% do HP, recupera 15%). 7: Esforço +5 por 4 rodadas e volta uma vez abaixo de 50% do HP | Técnica do elemento (uma por elemento, até 2) · Kunai (golpe barato e certeiro) |
| **Akimichi** | **Corpo pesado**: taijutsu pela razão de peso. Na 1ª vez abaixo de 50% do HP, **Expansão** sozinha (peso ×1,5; speed −3 até o fim da luta). 4: peso +10%. 7: a Expansão não tira speed e, abaixo de 25% do HP, a **Pílula do clã** dá taijutsu ×1,5 até o fim da luta | Mão Expandida · Rolo Colossal (4) |
| **Inuzuka** | **Dupla**: 35% de o cão bater junto (40% do dano). Nas 2 primeiras rodadas, **Fera de quatro patas** (+3 de speed, +10% de esquiva, Dupla 60%). 4: o cão bate com 60%. 7: a Fera dura 4 rodadas e a Dupla fica em 50% depois dela | Presas Giratórias (2 golpes) · Garra do cão (atordoa 15%) |
| **Prodígio** | **Juventude e Portões**: +5% de crítico; os **Portões abrem sozinhos** pelo HP perdido: 1º portão desde o começo, 2º abaixo de 75%, 3º abaixo de 50% (nível 4), 4º abaixo de 25% (nível 7). Cada portão dá dano e speed e custa 1% do HP por rodada, sem nunca derrubar | Folha Furacão · Lótus Primária (4) · Lótus Oculta (7, com o 3º portão) |
| **Uchiha** | **Sharingan sempre aceso**: +3/+5/+7 nos ataques e +1/+2/+3 de speed (1, 2 e 3 tomoe nos níveis 1, 4 e 7), Leitura de movimento (20/25/30% de o golpe recebido cair pela metade), imune a Medo e **Cópia** sozinha: 30/40/50% de copiar a técnica de dano que o acertou | Bola de Fogo (mais forte que o Fogo do Comum) · Ilusão da Dor · Tsukuyomi (7) |
| **Hyuuga** | **Byakugan sempre aceso**: o taijutsu não erra, ignora 30% da resistência e dá ×1,1; vê através da névoa; o genjutsu do vilão tem −20% de acerto. 4: **Rotação** sozinha, uma vez por luta, no primeiro golpe que tiraria 20% ou mais do HP (devolve metade). 7: duas vezes por luta | Punho Gentil · Selo dos Pontos Vitais (drena chakra) · 64 Palmas (4) |
| **Uzumaki** | **Vitalidade**: 2% do HP e 1 de chakra por rodada. Na 1ª rodada, **Selamento** sozinho: a técnica mais forte do vilão sai da roleta dele por 2 rodadas. 7: 2 de chakra por rodada e Selamento por 3 rodadas | Etiqueta Explosiva · técnica do elemento · Correntes de Chakra (4, atordoa) |
| **Senju** | **Força vital**: curas +25%; abaixo de 30% do HP, regenera 4% por rodada por 3 rodadas. 4: 5% e +2 de chakra por rodada. 7: dispara 2 vezes por luta | Técnica do elemento (até 2) ou Raízes de Madeira (Mokuton) · Punho do Fundador (golpe forte de taijutsu) |

Kunai, Presas, Garra do cão, Punho Gentil e Punho do Fundador são as técnicas novas ou adaptadas; as outras já existem nos dados. Nara, Yamanaka e Aburame seguem fora do sorteio: ficam sem ativas nos dados, só para não quebrar.

## Combate explosivo

Alavancas, nessa ordem, medindo vitória e rodadas a cada passo:

1. HP dos vilões menor (`villainPower`, `villainShape`): ponto de partida ×0,75.
2. Dano das técnicas-chave maior (+20% no `base`).
3. Crítico base mais alto (a Juventude e o Sharingan dão a diferença entre as origens).

## Eventos

| Hoje | Proposta |
|---|---|
| Velhinha (o vilão age primeiro) | **Velhinha agradecida**: uma relíquia Comum garantida |
| Ramen (o jogador age primeiro) | **Ramen do Ichiraku**: +1 estágio em dois status sorteados |

A derrota no Jokenpô continua dando a iniciativa ao vilão. Os pesos ficam iguais, e a simulação diz se mudam.

## Roleta de relíquia

Só 2 raridades vizinhas em cada roleta:

| Categoria | Comum | Incomum | Rara |
|---|---|---|---|
| Genin | 75 | 25 | — |
| Chunin | — | 65 | 35 |
| Jounin | — | 35 | 65 |

No infinito, cada ciclo passa 10 pontos da Incomum para a Rara (Genin: da Comum para a Incomum), sem abrir uma terceira raridade. Raridade esgotada cai para a vizinha. O baú do chefe segue igual. A medida das relíquias do Roleta é refeita junto (item 42).

## Para decidir

1. Tirar clones e barreiras do Roleta (proposta: sim, ficam na Jornada).
2. Os kits acima, origem por origem.
3. Os dois eventos novos.
