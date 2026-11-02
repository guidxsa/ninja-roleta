# Personagens da Jornada

> Run canônica implementada na v0.35.0 ([README.md](README.md)). Números provisórios: ajustar com `npm run sim:jornada`.

Ficha no nível 1. Os suportes sobem de nível junto com o Naruto; o crescimento por nível fica em `src/data/jornada/characters.ts`. O Naruto é o único controlado pelo jogador; os outros usam a IA da tabela abaixo (`src/core/jornada/ai.ts`).

## Fichas

| Personagem | HP | Chakra | Speed | Tai/Nin/Gen | Res. física/mental | Elemento | IA | Técnicas |
|---|---|---|---|---|---|---|---|---|
| Naruto | 110 | 30 | 10 | 9/8/3 | 7/5 | vento | striker | Golpe, Shuriken, Sexy no Jutsu, Kage Bunshin |
| Sasuke | 90 | 28 | 13 | 10/10/5 | 6/7 | fogo | striker | Golpe, Shuriken, Bola de Fogo, Combo do Leão |
| Sakura | 80 | 26 | 10 | 7/6/8 | 5/9 | terra | tactician | Kunai, Shuriken, Armadilha de fios, Kai (libertar) |
| Jiraiya | 150 | 40 | 12 | 13/14/8 | 10/9 | fogo | striker | Golpe do Sannin, Óleo de sapo em chamas, Cabelo-agulha |
| Tsunade | 140 | 40 | 12 | 15/12/6 | 10/8 | terra | healer | Soco da Tsunade, Palma mística, Golpe |
| Rock Lee | 115 | 10 | 15 | 14/0/0 | 9/5 | — | striker | Redemoinho da Folha, Furacão da Folha, Lótus Primária |
| Gaara | 130 | 40 | 10 | 6/14/4 | 12/8 | terra | guardian | Escudo de areia, Caixão de areia, Shuriken de areia |

- O Sasuke aprende o **Chidori** ao chegar no exame chunin (estágio 2).
- As técnicas novas do Naruto vêm da árvore de talentos ([talentos.md](talentos.md)).
- No mangá, antes do timeskip, a Sakura ainda não é médica: o papel dela é tático (soltar aliado preso, levantar quem caiu, armadilhas).

## Comportamento

Os suportes e os inimigos usam o mesmo motor de decisão. Antes de atacar, todo lutador usa escudo próprio quando está ferido, cria clones quando não tem, e às vezes usa um controle sem dano (35%).

| IA | Comportamento |
|---|---|
| striker | Ataca o inimigo mais perigoso (maior ataque) com a técnica de mais dano esperado. |
| tactician | Levanta quem caiu (o protagonista primeiro), solta aliado atordoado ou com chakra bloqueado e usa controle no inimigo mais perigoso. |
| healer | Levanta quem caiu e cura o aliado com menos de 55% do HP. |
| guardian | Põe escudo no aliado ferido (protagonista primeiro). |
| brute | Bate no adversário com menos HP. |

Entre as duas melhores opções de dano, a sorte desempata (30%) quando a segunda vale pelo menos 85% da primeira.

## Técnicas

| Técnica | Tipo | Elemento | Alvo | Dano | Chakra | Precisão | Extra |
|---|---|---|---|---|---|---|---|
| Golpe | Taijutsu | — | um inimigo | 8 | 0 | 90% | — |
| Shuriken | Taijutsu | — | um inimigo | 5 | 0 | 80% | 2 golpes |
| Kage Bunshin | Ninjutsu | — | em si | — | 5 | 85% | 2 clones; ativa de classe |
| Sexy no Jutsu | Genjutsu | — | um inimigo | — | 3 | 75% | atordoar 60% (1 t); espera 3 |
| Rendan Uzumaki | Taijutsu | — | um inimigo | 7 | 3 | 85% | +1 golpe por clone (até +3) |
| Mil Clones | Ninjutsu | — | todos os inimigos | 9 | 12 | 85% | 2 golpes; 3 clones |
| Manto da Kyuubi | Ninjutsu | — | em si | — | 0 | 85% | custa 8% do HP; escudo 20% do HP de quem usa; espera 4; ativa de classe |
| Explosão de chakra | Ninjutsu | — | todos os inimigos | 14 | 8 | 90% | — |
| Rasengan | Ninjutsu | — | um inimigo | 28 | 10 | 90% | +5% crítico |
| Ōdama Rasengan | Ninjutsu | — | um inimigo | 44 | 16 | 85% | penetração 20%; atordoar 30% (1 t) |
| Bola de Fogo | Ninjutsu | fogo | um inimigo | 16 | 5 | 85% | queimar 25% |
| Flor de Fênix | Ninjutsu | fogo | todos os inimigos | 8 | 7 | 85% | queimar 20% |
| Combo do Leão | Taijutsu | — | um inimigo | 18 | 4 | 85% | — |
| Chidori | Ninjutsu | raio | um inimigo | 30 | 10 | 85% | penetração 30% |
| Kunai | Taijutsu | — | um inimigo | 9 | 0 | 90% | — |
| Armadilha de fios | Taijutsu | — | um inimigo | 4 | 3 | 85% | atordoar 40% (1 t); espera 2 |
| Kai (libertar) | Genjutsu | — | um aliado | — | 2 | 85% | cura 10%; tira atordoar e bloqueio |
| Óleo de sapo em chamas | Ninjutsu | fogo | todos os inimigos | 14 | 8 | 85% | queimar 30% |
| Cabelo-agulha | Ninjutsu | — | em si | — | 4 | 85% | escudo 25% do HP de quem usa; espera 3 |
| Golpe do Sannin | Taijutsu | — | um inimigo | 14 | 0 | 90% | — |
| Soco da Tsunade | Taijutsu | — | um inimigo | 24 | 3 | 85% | atordoar 25% (1 t) |
| Palma mística | Ninjutsu | — | um aliado | — | 5 | 85% | cura 30%; tira atordoar e bloqueio |
| Redemoinho da Folha | Taijutsu | — | um inimigo | 12 | 0 | 90% | — |
| Furacão da Folha | Taijutsu | — | um inimigo | 8 | 0 | 85% | 2 golpes |
| Lótus Primária | Taijutsu | — | um inimigo | 32 | 0 | 85% | custa 10% do HP; atordoar 30% (1 t); espera 3 |
| Escudo de areia | Ninjutsu | terra | um aliado | — | 5 | 85% | escudo 25% do HP de quem usa; espera 2 |
| Caixão de areia | Ninjutsu | terra | um inimigo | 20 | 7 | 85% | atordoar 30% (1 t) |
| Shuriken de areia | Ninjutsu | terra | todos os inimigos | 8 | 5 | 85% | — |
