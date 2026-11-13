# Inimigos da Jornada

> História implementada na v0.35.0 ([README.md](README.md)). Números provisórios: ajustar com `npm run sim:jornada`.

Fichas só da Jornada (as do Roleta ficam em [viloes.md](../base/viloes.md)). A dificuldade multiplica HP, ataques, resistências e a cura das técnicas dos inimigos por uma força própria da Jornada (`enemyStrength`): 100/125/140/150% (Fácil/Médio/Difícil/Hardcore, v0.65.0; antes 98/120/136/136%). Na **História**, a força ainda é multiplicada por 1,1 (`storyStrength`, v0.65.0): a trilha fixa e os aliados fortes deixavam a História bem mais fácil que o Caminho Ninja. O fator entra uma vez só: antes da v0.51.0 entrava também no dano final. No [modo infinito](run.md#modo-infinito) do Caminho Ninja (só no Hardcore), o ciclo multiplica por cima: × 1,5 ^ ciclo. Comportamento (IA): [personagens.md](personagens.md#comportamento).

## Fichas

| Inimigo | HP | Chakra | Speed | Tai/Nin/Gen | Res. física/mental | Elemento | IA | Técnicas | Passiva |
|---|---|---|---|---|---|---|---|---|---|
| Mizuki | 65 | 10 | 9 | 7/5/3 | 6/6 | vento | brute | Kunai, Shuriken gigante | — |
| Kakashi | 170 | 40 | 15 | 11/11/9 | 9/9 | raio | tactician | Chute, Mil Anos de Morte, Decapitação | — |
| Capanga | 38 | 0 | 7 | 6/0/0 | 3/2 | — | brute | Porrete, Katana | — |
| Bandido | 42 | 0 | 9 | 7/0/0 | 3/3 | — | brute | Emboscada, Porrete | — |
| Ninja renegado | 70 | 18 | 11 | 9/9/4 | 6/5 | — | striker | Kunai, Golpe traiçoeiro | — |
| Renegado da Névoa | 55 | 14 | 10 | 6/8/2 | 5/4 | água | striker | Kunai, Projétil de água | — |
| Gōzu | 62 | 8 | 11 | 8/3/0 | 5/4 | água | brute | Garra envenenada, Corrente | — |
| Meizu | 62 | 8 | 11 | 8/3/0 | 5/4 | água | brute | Garra envenenada, Corrente | — |
| Zabuza | 160 | 30 | 12 | 12/11/3 | 9/6 | água | brute | Kubikiribōchō, Prisão de água, Dragão de água | — |
| Haku | 150 | 34 | 16 | 9/11/6 | 7/8 | água | tactician | Senbon, Espelhos de gelo, Ponto vital | fúria abaixo de 40% (dano ×1.25) |
| Dosu | 80 | 20 | 10 | 8/10/4 | 6/6 | — | striker | Kunai, Onda sonora | — |
| Zaku | 75 | 20 | 11 | 6/11/3 | 5/5 | vento | striker | Kunai, Rajada de ar | — |
| Kin | 70 | 20 | 12 | 6/5/11 | 5/7 | — | tactician | Kunai, Sino ilusório | — |
| Ninja da Grama | 65 | 16 | 11 | 9/8/4 | 6/5 | terra | striker | Kunai, Projétil de água | — |
| Ninja da Chuva | 60 | 18 | 11 | 8/7/8 | 6/6 | água | striker | Chuva de agulhas, Clone de névoa | — |
| Kabuto | 130 | 30 | 13 | 10/12/6 | 8/8 | — | healer | Kunai, Bisturi de chakra, Cura médica, Reanimação proibida | — |
| Kiba | 100 | 18 | 13 | 11/4/2 | 7/5 | — | brute | Presa sobre presa, Bomba de fedor, Kunai | — |
| Akamaru | 45 | 0 | 15 | 9/0/0 | 4/3 | — | brute | Mordida | — |
| Neji | 150 | 30 | 14 | 14/6/4 | 9/9 | — | tactician | Punho Suave, Rotação, 64 Palmas | — |
| Gaara | 230 | 45 | 10 | 8/15/4 | 12/8 | terra | brute | Caixão de areia, Escudo de areia, Tsunami de areia, Garra do Shukaku | escudo inicial 15% |
| Gaara (exausto) | 90 | 20 | 8 | 6/10/3 | 8/6 | areia (Kekkei Genkai) | brute | Escudo de areia, Caixão de areia | volta no lugar do Shukaku depois da cabeçada do Naruto ([roteiro.md](roteiro.md)) |
| Mercenário do Gatō | 45 | 0 | 8 | 7/0/0 | 4/3 | — | brute | Porrete, Katana | chegam à ponte depois do sacrifício do Haku |
| Shukaku | 300 | 60 | 8 | 12/16/4 | 13/9 | areia (Kekkei Genkai) | brute | Garra do Shukaku, Tsunami de areia, Caixão de areia | entra no lugar do Gaara a 40% do HP ([roteiro.md](roteiro.md)) |
| Ninja do Som | 75 | 16 | 12 | 10/8/6 | 6/6 | — | striker | Lâmina sonora, Onda sonora | — |
| Orochimaru | 240 | 50 | 13 | 13/15/12 | 10/10 | — | brute | Mãos de cobra, Kusanagi, Manda | fúria abaixo de 50% (dano ×1.2) |
| Kabuto | 170 | 36 | 14 | 12/13/6 | 9/9 | — | healer | Kunai, Bisturi de chakra, Cura médica, Reanimação proibida | — |
| Sasuke | 170 | 34 | 15 | 13/13/7 | 8/8 | fogo | striker | Chidori, Bola de Fogo, Combo do Leão | — |
| Cobra | 90 | 0 | 9 | 11/0/0 | 7/4 | — | brute | Picada | — |
| Jirobo | 180 | 30 | 9 | 14/8/2 | 11/6 | terra | brute | Soco pesado, Domo de terra | — |
| Kidomaru | 160 | 30 | 13 | 12/10/4 | 8/7 | — | tactician | Flecha dourada, Teia, Kunai | — |
| Tayuya | 150 | 34 | 12 | 8/8/14 | 7/9 | — | tactician | Flauta demoníaca, Kunai | — |
| Sakon | 150 | 26 | 13 | 13/8/4 | 9/6 | — | brute | Golpe gêmeo, Lâmina sonora | — |
| Kimimaro | 290 | 40 | 14 | 17/6/4 | 12/8 | — | brute | Broca de osso, Balas de osso, Dança do salgueiro | fúria abaixo de 50% (dano ×1.25) |
| Sasuke (selo) | 330 | 50 | 16 | 15/16/8 | 10/10 | fogo | striker | Chidori, Chamas do dragão, Combo do Leão, Bola de Fogo | fúria abaixo de 50% (dano ×1.3) |

## Técnicas

| Técnica | Tipo | Elemento | Alvo | Dano | Chakra | Precisão | Extra |
|---|---|---|---|---|---|---|---|
| Porrete | Taijutsu | — | um inimigo | 7 | 0 | 85% | — |
| Emboscada | Taijutsu | — | um inimigo | 6 | 0 | 80% | 2 golpes |
| Golpe traiçoeiro | Ninjutsu | — | um inimigo | 13 | 3 | 85% | veneno 25% |
| Katana | Taijutsu | — | um inimigo | 10 | 0 | 75% | — |
| Kunai | Taijutsu | — | um inimigo | 8 | 0 | 90% | — |
| Shuriken gigante | Taijutsu | — | um inimigo | 13 | 0 | 75% | — |
| Projétil de água | Ninjutsu | água | um inimigo | 11 | 3 | 85% | — |
| Garra envenenada | Taijutsu | — | um inimigo | 9 | 0 | 85% | veneno 35% |
| Corrente | Taijutsu | — | todos os inimigos | 6 | 2 | 80% | — |
| Mil Anos de Morte | Taijutsu | — | um inimigo | 6 | 0 | 85% | atordoar 35% (1 t) |
| Decapitação | Ninjutsu | terra | um inimigo | 13 | 4 | 85% | atordoar 20% (1 t) |
| Chute | Taijutsu | — | um inimigo | 11 | 0 | 90% | — |
| Kubikiribōchō | Taijutsu | — | um inimigo | 17 | 0 | 80% | penetração 15% |
| Prisão de água | Ninjutsu | água | um inimigo | — | 5 | 80% | atordoar 100% (2 t); espera 4 |
| Dragão de água | Ninjutsu | água | todos os inimigos | 13 | 8 | 85% | — |
| Senbon | Taijutsu | — | um inimigo | 5 | 0 | 85% | 3 golpes |
| Espelhos de gelo | Ninjutsu | água | todos os inimigos | 8 | 8 | 85% | 2 golpes; espera 2 |
| Ponto vital | Taijutsu | — | um inimigo | 6 | 2 | 85% | atordoar 30% (1 t) |
| Onda sonora | Ninjutsu | — | um inimigo | 11 | 3 | 85% | atordoar 20% (1 t) |
| Rajada de ar | Ninjutsu | vento | todos os inimigos | 8 | 5 | 85% | — |
| Sino ilusório | Genjutsu | — | um inimigo | 7 | 3 | 85% | atordoar 30% (1 t) |
| Chuva de agulhas | Taijutsu | — | todos os inimigos | 4 | 3 | 75% | 2 golpes |
| Clone de névoa | Genjutsu | — | um inimigo | 9 | 2 | 85% | — |
| Bisturi de chakra | Ninjutsu | — | um inimigo | 13 | 4 | 85% | bloqueio de chakra 40% |
| Cura médica | Ninjutsu | — | um aliado | — | 5 | 85% | cura 25 de HP × força do inimigo; espera 2 |
| Reanimação proibida | Ninjutsu | — | um aliado caído | — | 15 | — | levanta com 30% do HP; espera 3 |
| Presa sobre presa | Taijutsu | — | um inimigo | 10 | 4 | 80% | 2 golpes |
| Mordida | Taijutsu | — | um inimigo | 7 | 0 | 90% | — |
| Bomba de fedor | Taijutsu | — | um inimigo | — | 2 | 85% | atordoar 40% (1 t); espera 3 |
| Punho Suave | Taijutsu | — | um inimigo | 12 | 0 | 95% | penetração 30%; bloqueio de chakra 35% |
| Rotação | Taijutsu | — | em si | — | 4 | 85% | escudo 20% do HP de quem usa; espera 3 |
| 64 Palmas | Taijutsu | — | um inimigo | 4 | 8 | 95% | 4 golpes; penetração 30%; bloqueio de chakra 50% (3 t); espera 3 |
| Caixão de areia | Ninjutsu | terra | um inimigo | 18 | 6 | 85% | atordoar 35% (1 t) |
| Escudo de areia | Ninjutsu | terra | em si | — | 4 | 85% | escudo 15% do HP de quem usa; espera 3 |
| Tsunami de areia | Ninjutsu | terra | todos os inimigos | 14 | 9 | 85% | — |
| Garra do Shukaku | Taijutsu | — | um inimigo | 22 | 3 | 80% | — |
| Mãos de cobra | Ninjutsu | — | um inimigo | 11 | 4 | 85% | 2 golpes; veneno 30% |
| Kusanagi | Taijutsu | — | um inimigo | 20 | 0 | 85% | penetração 30% |
| Manda | Ninjutsu | — | todos os inimigos | 17 | 12 | 85% | espera 3 |
| Lâmina sonora | Taijutsu | — | um inimigo | 10 | 0 | 85% | — |
| Picada | Taijutsu | — | um inimigo | 12 | 0 | 85% | veneno 40% |
| Domo de terra | Ninjutsu | terra | um inimigo | 6 | 5 | 85% | bloqueio de chakra 60% (2 t); espera 2 |
| Soco pesado | Taijutsu | — | um inimigo | 18 | 0 | 80% | — |
| Flecha dourada | Taijutsu | — | um inimigo | 24 | 6 | 80% | penetração 20% |
| Teia | Ninjutsu | — | um inimigo | 4 | 3 | 85% | atordoar 45% (1 t); espera 2 |
| Flauta demoníaca | Genjutsu | — | todos os inimigos | 9 | 6 | 85% | atordoar 20% (1 t) |
| Golpe gêmeo | Taijutsu | — | um inimigo | 9 | 0 | 85% | 2 golpes |
| Broca de osso | Taijutsu | — | um inimigo | 22 | 4 | 85% | penetração 30% |
| Balas de osso | Taijutsu | — | todos os inimigos | 8 | 6 | 85% | 2 golpes |
| Dança do salgueiro | Taijutsu | — | um inimigo | 9 | 3 | 85% | 3 golpes |
| Chidori | Ninjutsu | raio | um inimigo | 28 | 10 | 85% | penetração 30% |
| Bola de Fogo | Ninjutsu | fogo | um inimigo | 16 | 5 | 85% | queimar 30% |
| Combo do Leão | Taijutsu | — | um inimigo | 15 | 2 | 90% | — |
| Chamas do dragão | Ninjutsu | fogo | todos os inimigos | 14 | 9 | 85% | queimar 30%; espera 2 |
