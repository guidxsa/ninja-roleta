# Vilões

Fichas dos vilões da campanha: status, moveset, passiva, versão hardcore, comportamento e XP. A fonte dos números é `data/villains.ts`; este arquivo descreve o design e precisa bater com ele.

## Ficha padrão

| Campo | Conteúdo |
|---|---|
| `element` | Um dos 5. É o tema do vilão e define as técnicas dele; não dá vantagem nem desvantagem por si só ([fundamentos.md](fundamentos.md#elementos)) |
| `hp`, `chakra`, `speed` | Status base (antes da dificuldade) |
| `taijutsu`, `ninjutsu`, `genjutsu` | Ataque por tipo, igual ao do jogador |
| `physicalRes`, `mentalRes` | Resistência física e mental, igual à do jogador |
| `critBonus` | Somado aos 5% base de crítico |
| `techniques` | Fichas de técnica (as mesmas do jogador, com nível), mais o peso no sorteio e, nas de cura, `useBelowHpPct` (ver [tecnicas.md](tecnicas.md)) |
| `reactions` | Pesos de Resistir, Disputa e Substituição (ver "Reações") |
| `startingShield` | Barreira (técnica dele) já erguida no início da luta, sem custo |
| `passive` / `hardcorePassive` | Passiva normal e a do hardcore |
| `behavior` | Comportamentos especiais (ex.: golpe carregado) |
| `xp` | XP dado ao ser derrotado (ver [progressao.md](progressao.md)) |

**O vilão usa a mesma ficha e as mesmas fórmulas do jogador** ([fundamentos.md](fundamentos.md#ficha-de-status)): o dano dele soma o ataque do tipo, e o genjutsu dele usa o status Genjutsu contra a resistência mental do jogador.

## Regras de combate dos vilões

- **Chakra**: cada técnica tem custo (taijutsu é grátis). O vilão sorteia a técnica pelos pesos, só entre as que pode pagar. Sem chakra para nenhuma, concentra chakra e perde a vez, recuperando o mesmo que o jogador: 15% do chakra máximo ([fundamentos.md](fundamentos.md#chakra)). Hoje todo vilão tem uma técnica grátis, então isso só acontece com vilões sem taijutsu grátis.
- **Segunda fase**: quando o vilão volta à luta (Haku se sacrifica pelo Zabuza, Gaara vira Shukaku, Orochimaru troca de pele), o chakra volta na mesma fração do HP: se volta com 50% do HP, o chakra sobe para 50% do máximo. Se ele já tinha mais chakra que isso, mantém.
- **Precisão**: as técnicas dos vilões usam a precisão padrão (85%) e a mesma rolagem de três fatias do jogador ([fundamentos.md](fundamentos.md#rolagem-de-acerto)).
- **Cura**: técnica médica de vilão cura uma fração do HP máximo sem rolar acerto e só entra no sorteio com o HP abaixo do limite indicado (`useBelowHpPct`).
- **Intenção**: a próxima ação do vilão é sorteada no fim da rodada anterior. A passiva Gênio (Nara) mostra essa intenção na tela.
- **Barreiras**: são ações. A técnica de barreira entra no sorteio da intenção (pelo peso) só quando o vilão não tem escudo ativo ([fundamentos.md](fundamentos.md#escudos)).
- **Reações**: ao receber um ataque, o vilão sorteia a reação pelos pesos de `reactions`, só entre as que pode pagar e as que valem contra aquele ataque. Resistir é sempre possível. Na Disputa, a técnica é sorteada pelos pesos normais entre os ninjutsu de ataque que ele pode pagar.
- **Dificuldade**: multiplica HP, dano base, ataques e resistências (ver [campanha.md](campanha.md#dificuldade)). No hardcore, `passive` vira `hardcorePassive`.
- **Golpe carregado**: quando sorteia a técnica marcada, o vilão gasta a vez (e o chakra) concentrando e anuncia o golpe; na vez seguinte solta o ataque com dano ×2, que não pode ser crítico. A tela mostra o aviso, e o jogador decide entre postura defensiva, Bomba de fumaça ou esperar para reagir (Substituição ou disputa; na disputa, o poder do golpe carregado também dobra) ou erguer um escudo na vez do aviso. Usado pelos vilões marcados abaixo, com a técnica indicada (`behavior.charged`).

## Status base

Calibrados na simulação para que o dano médio fique perto do da v0.9: o ataque de cada tipo saiu do `baseDamage` das técnicas (novo dano base = antigo + 1 − ataque do tipo, e depois +1 no ataque de taijutsu e ninjutsu para compensar as reações). A resistência física fica uns 15% acima da antiga defesa de taijutsu; a mental, na antiga defesa de genjutsu ÷ 0,7 (o jogador quase sempre Resiste, a 70%).

| # | Vilão | Elemento | HP | Chakra | Speed | Tai | Nin | Gen | Res. física | Res. mental | Crítico extra | XP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Mizuki | Vento | 70 | 10 | 9 | 7 | 5 | 3 | 8 | 9 | — | 100 |
| 2a | Haku | Água | 80 | 18 | 14 | 7 | 9 | 6 | 8 | 13 | +5% | 125 |
| 2b | Zabuza | Água | 110 | 20 | 11 | 9 | 9 | 5 | 12 | 10 | +2% | 150 |
| 3a | Genin da Areia (exame) | Vento | 90 | 15 | 11 | 7 | 9 | 5 | 10 | 11 | +2% | 60 |
| 3b | Genin do Som (exame) | Raio | 85 | 12 | 12 | 8 | 7 | 8 | 10 | 16 | +3% | 60 |
| 3c | Genin da Folha (exame) | Fogo | 100 | 12 | 12 | 9 | 8 | 5 | 14 | 13 | +3% | 60 |
| 4 | Gaara | Terra | 140 | 36 | 9 | 8 | 11 | 6 | 14 | 14 | +2% | 200 |
| 5a | Jirobo | Terra | 70 | 15 | 8 | 10 | 8 | 4 | 15 | 11 | — | 60 |
| 5b | Kidomaru | Raio | 65 | 16 | 12 | 8 | 10 | 6 | 12 | 14 | +5% | 60 |
| 5c | Tayuya | Vento | 60 | 16 | 11 | 7 | 7 | 11 | 9 | 20 | +2% | 60 |
| 5d | Sakon | Vento | 75 | 14 | 12 | 10 | 8 | 6 | 14 | 14 | +3% | 60 |
| 6 | Kabuto | Terra | 150 | 25 | 13 | 10 | 10 | 10 | 15 | 19 | +5% | 250 |
| 7 | Orochimaru | Vento | 220 | 40 | 14 | 12 | 12 | 13 | 18 | 23 | +5% | 300 |

O manto do Gaara e a marca da maldição multiplicam o dano ×1,5 e as resistências ×1,25.

## Reações

Pesos de `reactions` (provisórios). Resistir é o padrão; as outras só entram no sorteio quando valem contra o ataque e o vilão pode pagar. Substituição: 2 usos por luta, como o jogador.

| Vilão | Resistir | Disputa | Substituição | Personalidade |
|---|---|---|---|---|
| Mizuki | 4 | — | 1 | Covarde: foge quando dá. |
| Haku | 2 | 1 | 2 | Rápido, esquiva entre os espelhos. |
| Zabuza | 2 | 2 | 1 (clone d'água) | Gosta de trocar jutsu com jutsu. |
| Genins do exame | 3 | 1 | 1 | Genérico. |
| Gaara | 2 | 1 | — | A areia defende sozinha: começa com o Escudo de Areia e o ergue de novo quando cai. |
| Jirobo | 1 | — | — | Muralha: ergue a Muralha de Terra como ação. |
| Kidomaru | 2 | 2 | 1 | Arqueiro, troca tiros. |
| Tayuya | 3 | — | 1 | Depende do ogro e da flauta. |
| Sakon | 2 | 1 | 2 | Escapa pelo corpo do irmão. |
| Kabuto | 2 | 1 | 3 | Médico calculista. |
| Orochimaru | 2 | 2 | 2 (troca de pele) | Escorregadio. |

Os genins do exame têm nomes próprios no jogo (não são do universo original). O Gaara foi aliviado de 160 de HP por ser o gargalo da campanha. O XP segue a curva planejada em [progressao.md](progressao.md#curva-planejada).

## Moveset

Nomes em português são sugestões para a tela; o `id` é o do código. "Chance" é o peso convertido em porcentagem, quando o vilão pode pagar todas. "Dano" é o dano base: o golpe soma o ataque do tipo e desconta a resistência usada pelo jogador ([fundamentos.md](fundamentos.md#dano)).

| Vilão | Técnica (`id`) | Tipo | Dano | Chakra | Peso (chance) | Especial |
|---|---|---|---|---|---|---|
| Mizuki | Golpe de Kunai (`kunaiStrike`) | Taijutsu | 8 | 0 | 3 (75%) | Cortante |
| Mizuki | Shuriken Gigante (`giantShuriken`) | Taijutsu | 11 | 0 | 1 (25%) | Cortante |
| Haku | Agulhas Senbon (`senbon`) | Taijutsu | 7 | 0 | 3 (60%) | — |
| Haku | Espelhos de Gelo (`iceMirrors`) | Ninjutsu | 8 | 5 | 2 (40%) | — |
| Zabuza | Golpe do Espadão (`cleaverSwing`) | Taijutsu | 9 | 0 | 3 (60%) | Espada (sangra no crítico); golpe carregado |
| Zabuza | Projétil do Dragão d'Água (`waterDragonBullet`) | Ninjutsu | 11 | 5 | 2 (40%) | — |
| Genin da Areia | Rajada do Leque (`fanGust`) | Ninjutsu | 9 | 4 | 2 (50%) | — |
| Genin da Areia | Golpe de Kunai (`kunaiStrike`) | Taijutsu | 8 | 0 | 2 (50%) | Cortante |
| Genin do Som | Onda Sonora (`soundWave`) | Genjutsu | 0 | 4 | 1 (25%) | Aprisiona 1 turno base |
| Genin do Som | Golpe de Kunai (`kunaiStrike`) | Taijutsu | 8 | 0 | 3 (75%) | Cortante |
| Genin da Folha | Golpe de Palma (`palmStrike`) | Taijutsu | 10 | 0 | 3 (75%) | — |
| Genin da Folha | Bola de Fogo (`fireballVillain`) | Ninjutsu | 9 | 4 | 1 (25%) | — |
| Gaara | Caixão de Areia (`sandCoffin`) | Ninjutsu | 11 | 4 | 3 (38%) | — |
| Gaara | Tsunami de Areia (`sandTsunami`) | Ninjutsu | 17 | 8 | 1 (12%) | Golpe carregado |
| Gaara | Punho de Areia (`sandFist`) | Taijutsu | 8 | 0 | 2 (25%) | Grátis: sem chakra, o Gaara bate em vez de concentrar |
| Gaara | Escudo de Areia (`sandShield`) | Barreira (terra) | — | 4 | 2 (25%, só sem escudo) | Escudo de 30; já começa a luta erguido. Raio fura (×2 no escudo). |
| Jirobo | Prisão de Terra (`earthPrison`) | Ninjutsu | 11 | 5 | 2 (40%; 50% com escudo) | — |
| Jirobo | Soco Pesado (`heavyPunch`) | Taijutsu | 10 | 0 | 2 (40%; 50% com escudo) | — |
| Jirobo | Muralha de Terra (`earthWall`) | Barreira (terra) | — | 5 | 1 (20%, só sem escudo) | Escudo de 28 (ver [tecnicas.md](tecnicas.md#barreiras)). |
| Kidomaru | Flecha Dourada (`goldenArrow`) | Ninjutsu | 10 | 5 | 2 (50%) | — |
| Kidomaru | Teia de Aranha (`spiderWeb`) | Taijutsu | 8 | 0 | 2 (50%) | — |
| Tayuya | Flauta Demoníaca (`demonFlute`) | Genjutsu | 0 | 5 | 1 (33%) | Aprisiona 1 turno base |
| Tayuya | Ogro Invocado (`summonedOgre`) | Taijutsu | 11 | 0 | 2 (67%) | — |
| Sakon | Golpe Gêmeo (`twinStrike`) | Taijutsu | 9 | 0 | 3 (75%) | Golpe carregado |
| Sakon | Corpo Parasita (`parasiteBody`) | Ninjutsu | 9 | 4 | 1 (25%) | — |
| Kabuto | Bisturi de Chakra (`chakraScalpel`) | Taijutsu | 12 | 0 | 3 (75%; 50% com a cura liberada) | Cortante |
| Kabuto | Alma Morta (`deadSoul`) | Ninjutsu | 10 | 5 | 1 (25%; 17% com a cura liberada) | — |
| Kabuto | Palma Mística (`mysticPalm`) | Médico | — | 7 | 2 (33%, só abaixo de 50% de HP) | Cura 15% do HP máximo, sem rolar acerto |
| Orochimaru | Serpentes Ocultas (`hiddenSnakes`) | Ninjutsu | 14 | 5 | 3 (50%) | Golpe carregado |
| Orochimaru | Espada da Grama (`grassSword`) | Taijutsu | 12 | 0 | 2 (33%) | Espada (sangra no crítico) |
| Orochimaru | Intenção Assassina (`killingIntent`) | Genjutsu | 0 | 6 | 1 (17%) | Aprisiona 1 turno base |

Ordem das lutas no Quarteto do Som: Jirobo, Kidomaru, Tayuya e Sakon.

## Passivas

| Vilão | Passiva | Efeito | Hardcore |
|---|---|---|---|
| Mizuki | Enganador | Sobrevive ao primeiro golpe fatal com 1 de HP, mas se acovarda e perde a próxima vez. | No lugar de se acovardar, o próximo ataque dele é crítico garantido. |
| Haku | Espelhos | Cada ataque vale por 2 golpes com 60% do dano. Como toda técnica de vários golpes, é uma reação, um acerto e um crítico para os dois. | Os 2 golpes com 100% do dano. |
| Zabuza | Demônio da névoa oculta | Começa na névoa por 4 rodadas: a chance de erro do jogador ×1,5. | Ao tomar o golpe fatal, Haku se sacrifica: volta com 50% do HP (e o chakra em 50% do máximo), 10% mais forte e fazendo sangrar em todos os golpes. |
| Genins do exame | — | Sem passiva. | — |
| Gaara | Jinchuuriki | Mesmo manto do jogador (ver [origens.md](origens.md#jinchuuriki)), pagando com o chakra dele, e imune a genjutsu. **Armadura de Areia** a luta toda: estado elemental de terra, então golpes de raio contam ×2 e de água ×0,75 (ver [tecnicas.md](tecnicas.md#estados-elementais)). | **Monstro**: ao ser derrotado pela 1ª vez, volta na forma do Shukaku com 50% do HP (e o chakra em 50% do máximo), troca as técnicas pelas de monstro (Garra do Shukaku, Bala de Ar e Funeral de Areia: mais dano, precisão de 55% a 65%) e fica com os multiplicadores do manto (×1,5 no dano, ×1,25 nas resistências) até morrer, sem custo de chakra e sem regeneração. |
| Quarteto do Som | Marca da maldição | Mesmos valores do manto do jinchuuriki: ×1,5 no dano, ×1,25 nas resistências, regenera 5%, custo de 10% do chakra por rodada, 5 rodadas. Sem imunidade a genjutsu. | A marca já começa ativa. |
| Kabuto | Bisturi | Chance de crítico +10%, e os críticos causam sangramento. | Todos os golpes fazem sangrar e furam 30% da resistência do jogador. |
| Orochimaru | Insano | Acertos envenenam (bônus 1). Abaixo de 50% de HP, precisa ser derrotado em 5 rodadas, senão revive com 50% do HP máximo. Vale sempre que cair abaixo de 50%, até **1 vez no fácil, 2 no normal e 3 no difícil**; esgotado o limite, a contagem não começa mais. | Veneno com bônus 3, prazo de 4 rodadas, revive com 50% do HP **sem limite** e **não recebe acerto crítico**. |

## Observações de balanceamento

- Como a luta não começa mais restaurada, os blocos (Haku e Zabuza, Quarteto) voltam a ser maratonas de HP e chakra. Subir de nível no meio do bloco é o respiro. A simulação precisa conferir se o Quarteto não ficou pesado demais; o ajuste natural é aliviar cada luta do bloco.
- A Muralha de Terra do Jirobo e o Escudo de Areia do Gaara são a vez do raio brilhar: contra terra, o raio causa ×2 no escudo. A água (×0,75) sofre.
- Sem a cura por rodada, o Kabuto passa a ser uma luta de pressão: o sangramento no crítico pune os golpes cortantes dele mesmo. Respostas naturais: Kit médico, Substituição e Lesma.
- A Palma Mística devolve ao Kabuto um pouco de sustentação, mas limitada: só abaixo de 50% de HP, cada uso gasta a vez dele e 7 dos 25 de chakra (no máximo 3 curas, 45% do HP, se não usar mais nada). Quem segura o dano para o fim é punido; quem mantém a pressão, não.
- O Punho de Areia evita que o Gaara perca vezes concentrando chakra quando o manto (que custa chakra) esvazia a reserva. O dano médio por vez cai um pouco (de 21,5 para 18,3, sem contar o golpe carregado), compensando as vezes que ele deixa de perder.
- A Imitação de Sombra do Nara é a única forma de prender o Gaara.