# Personagens da Jornada

> História implementada na v0.35.0 ([README.md](README.md)). Números provisórios: ajustar com `npm run sim:jornada`.

Ficha no nível 1. Os suportes sobem de nível junto com o Naruto; o crescimento por nível fica em `src/data/jornada/characters.ts`. O Naruto é o único controlado pelo jogador; os outros usam a IA da tabela abaixo (`src/core/jornada/ai.ts`).

## Fichas

| Personagem | HP | Chakra | Speed | Tai/Nin/Gen | Res. física/mental | Elemento | IA | Técnicas |
|---|---|---|---|---|---|---|---|---|
| Naruto | 110 | 30 | 10 | 9/8/3 | 7/5 | vento | striker | Golpe, Shuriken, Sexy no Jutsu, Kage Bunshin |
| Sasuke | 90 | 28 | 13 | 10/10/5 | 6/7 | fogo | striker | Golpe, Shuriken, Bola de Fogo, Combo do Leão |
| Sakura | 80 | 26 | 10 | 7/6/8 | 5/9 | terra | tactician | Kunai, Shuriken, Armadilha de fios, Kai (libertar) |
| Jiraiya | 150 | 40 | 12 | 13/14/8 | 10/9 | fogo | striker | Golpe do Sannin, Óleo de sapo em chamas, Cabelo-agulha |
| Tsunade | 140 | 40 | 12 | 15/12/6 | 10/8 | terra | healer | Soco da Tsunade, Palma mística, Golpe, Reanimação |
| Rock Lee | 115 | 10 | 15 | 14/0/0 | 9/5 | — | striker | Redemoinho da Folha, Furacão da Folha, Lótus Primária |
| Gaara | 130 | 40 | 10 | 6/14/4 | 12/8 | terra | guardian | Escudo de areia, Caixão de areia, Shuriken de areia |
| Shikamaru | 95 | 30 | 11 | 8/10/8 | 6/9 | — | tactician | Kunai, Shuriken, Possessão das Sombras |
| Chōji | 165 | 28 | 8 | 13/6/2 | 10/5 | — | guardian | Golpe, Tanque de carne humana, Expansão parcial |
| Kiba | 110 | 22 | 14 | 13/4/2 | 7/5 | — | striker | Kunai, Mordida do Akamaru, Presa sobre Presa |
| Neji | 120 | 28 | 13 | 14/6/4 | 9/8 | — | striker | Palma Suave, 64 Palmas, Rotação |
| Ninja da Folha | 100 | 30 | 11 | 9/9/4 | 7/6 | — | striker | Golpe, Shuriken, Bunshin no Jutsu, Esforço; Kunai fora do moveset inicial |
| Prodígio do taijutsu | 115 | 12 | 13 | 12/0/0 | 8/5 | — | striker | Golpe, Redemoinho da Folha, Shuriken, Portões |
| Daichi | 95 | 24 | 11 | 10/10/3 | 6/5 | — | striker | Kunai, Shuriken |
| Hana | 90 | 26 | 10 | 8/10/6 | 5/7 | — | tactician | Kunai, Armadilha de fios, Kai (libertar) |
| Ninja Uchiha | 105 | 32 | 12 | 10/12/8 | 7/8 | fogo | striker | Golpe, Shuriken, Bola de Fogo, Sharingan |
| Ninja Hyuuga | 105 | 26 | 12 | 12/6/4 | 8/7 | — | striker | Golpe, Palma Suave, Shuriken, Byakugan |
| Ren Uchiha | 85 | 26 | 12 | 8/10/7 | 5/7 | fogo | striker | Kunai, Ilusão dos corvos |
| Kaede Uchiha | 90 | 28 | 11 | 7/10/9 | 5/8 | fogo | tactician | Shuriken, Armadilha de fios |
| Mio Hyuuga | 95 | 22 | 11 | 10/5/4 | 7/6 | — | guardian | Palma Suave, Rotação, Kunai |
| Sei Hyuuga | 100 | 22 | 12 | 11/5/3 | 7/6 | — | striker | Palma Suave, Shuriken, Palma do Vácuo |
| Mika | 85 | 36 | 10 | 6/8/5 | 5/7 | — | healer | Kunai, Kai (libertar), Reanimação |

- O Sasuke aprende o **Chidori** ao chegar no exame chunin (estágio 2).
- As técnicas novas do Naruto vêm da árvore de talentos ([talentos.md](talentos.md)).
- No mangá, antes do timeskip, a Sakura ainda não é médica: o papel dela é tático (soltar aliado preso, armadilhas).
- A equipe de resgate entra no estágio 3 da História ([historia.md](historia.md)). O Akamaru luta dentro do kit do Kiba, porque cada lado tem no máximo 3 lutadores.
- No Caminho Ninja, o protagonista usa o nome do jogador, quando informado ([perfil.md](../base/perfil.md#nome-do-jogador)).
- Caminho Ninja ([classes.md](classes.md)): o Ninja da Folha (Comum) usa o elemento escolhido ou sorteado e os suportes Comuns, o sorteado; todos ganham a técnica de nível I dele. O prodígio é o Comum sem elemento. O Hyuuga (protagonista e suportes) não tem elemento.
- Nos suportes do Caminho Ninja, o nome da tabela é o da ficha; na run, cada suporte ganha um nome sorteado da lista da classe ([classes.md](classes.md#suportes-genéricos-versão-suporte)).

## Comportamento

Os suportes e os inimigos usam o mesmo motor de decisão. Quem tem técnica de reanimar levanta antes de tudo, o protagonista primeiro ([combate.md](combate.md#cair-e-levantar)). Antes de agir, todo lutador usa uma ativa grátis (uma por turno, `chooseAiActive`): escudo próprio quando está ferido; Portões, com tudo fechado, no maior portão cujo desgaste nos 4 turnos deixe pelo menos 40% do HP (fecha abaixo de 30%); fortalecimento quando não tem um; clones quando não tem. Depois escolhe a ação, e às vezes usa um controle sem dano (35%).

| IA | Comportamento |
|---|---|
| striker | Ataca o inimigo mais perigoso (maior ataque) com a técnica de mais dano esperado. |
| tactician | Solta aliado atordoado ou com chakra bloqueado e usa controle no inimigo mais perigoso. |
| healer | Cura o aliado com menos de 55% do HP. |
| guardian | Põe escudo no aliado ferido (protagonista primeiro). |
| brute | Bate no adversário com menos HP. |

Entre as duas melhores opções de dano, a sorte desempata (30%) quando a segunda vale pelo menos 85% da primeira.

## Técnicas

### História

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
| Rasengan com clone | Ninjutsu | — | um inimigo | 18 | 8 | 90% | +1 golpe por clone (até +2) |
| Harem no Jutsu | Genjutsu | — | todos os inimigos | — | 6 | 75% | atordoar 40% (1 t); espera 4 |
| Bomba de fumaça | Taijutsu | — | em si | — | 3 | 85% | fortalece 2 turnos (+30% esquiva); espera 4; ativa de classe |
| Shuriken das sombras | Taijutsu | — | um inimigo | 7 | 3 | 80% | 3 golpes; espera 1 |
| Grito de guerra | Ninjutsu | — | um aliado | — | 5 | 85% | cura 20 de HP; tira atordoar e bloqueio; espera 2 |
| Gamakichi | Ninjutsu | fogo | todos os inimigos | 12 | 6 | 85% | queimar 30% |
| Gamatatsu | Ninjutsu | água | em si | — | 5 | 85% | escudo 25% do HP de quem usa; espera 3; ativa de classe |
| Gamabunta | Ninjutsu | — | todos os inimigos | 26 | 16 | 90% | atordoar 25% (1 t); espera 4 |
| Uma cauda | Ninjutsu | — | em si | — | 0 | 85% | custa 10% do HP; fortalece 3 turnos (dano ×1.35); espera 5; ativa de classe |
| Bola de Fogo | Ninjutsu | fogo | um inimigo | 16 | 5 | 85% | queimar 25% |
| Flor de Fênix | Ninjutsu | fogo | todos os inimigos | 8 | 7 | 85% | queimar 20% |
| Combo do Leão | Taijutsu | — | um inimigo | 18 | 4 | 85% | — |
| Chidori | Ninjutsu | raio | um inimigo | 30 | 10 | 85% | penetração 30% |
| Kunai | Taijutsu | — | um inimigo | 9 | 0 | 90% | — |
| Armadilha de fios | Taijutsu | — | um inimigo | 4 | 3 | 85% | atordoar 40% (1 t); espera 2 |
| Kai (libertar) | Genjutsu | — | um aliado | — | 2 | 85% | cura 10 de HP; tira atordoar e bloqueio |
| Óleo de sapo em chamas | Ninjutsu | fogo | todos os inimigos | 14 | 8 | 85% | queimar 30% |
| Cabelo-agulha | Ninjutsu | — | em si | — | 4 | 85% | escudo 25% do HP de quem usa; espera 3 |
| Golpe do Sannin | Taijutsu | — | um inimigo | 14 | 0 | 90% | — |
| Soco da Tsunade | Taijutsu | — | um inimigo | 24 | 3 | 85% | atordoar 25% (1 t) |
| Palma mística | Ninjutsu | — | um aliado | — | 5 | 85% | cura 30 de HP; tira atordoar e bloqueio |
| Reanimação | Ninjutsu | — | um aliado caído | — | 15 | — | levanta com 50% do HP; espera 2 |
| Redemoinho da Folha | Taijutsu | — | um inimigo | 12 | 0 | 90% | — |
| Furacão da Folha | Taijutsu | — | um inimigo | 8 | 0 | 85% | 2 golpes |
| Lótus Primária | Taijutsu | — | um inimigo | 32 | 0 | 85% | custa 10% do HP; atordoar 30% (1 t); espera 3 |
| Escudo de areia | Ninjutsu | terra | um aliado | — | 5 | 85% | escudo 25% do HP de quem usa; espera 2 |
| Caixão de areia | Ninjutsu | terra | um inimigo | 20 | 7 | 85% | atordoar 30% (1 t) |
| Shuriken de areia | Ninjutsu | terra | todos os inimigos | 8 | 5 | 85% | — |
| Possessão das Sombras | Ninjutsu | — | um inimigo | — | 4 | 90% | atordoar 70% (1 t); espera 3 |
| Tanque de carne humana | Taijutsu | — | um inimigo | 20 | 5 | 80% | — |
| Expansão parcial | Taijutsu | — | um aliado | — | 4 | 85% | escudo 15% do HP de quem usa; espera 2 |
| Mordida do Akamaru | Taijutsu | — | um inimigo | 11 | 0 | 90% | — |
| Presa sobre Presa | Taijutsu | — | um inimigo | 10 | 4 | 80% | 2 golpes |

### Linhas elementais (Caminho Ninja)

Nível I no kit de quem tem o elemento; II e III pela árvore do Comum ([talentos.md](talentos.md)).

| Técnica | Tipo | Elemento | Alvo | Dano | Chakra | Precisão | Extra |
|---|---|---|---|---|---|---|---|
| Faísca de fogo | Ninjutsu | fogo | um inimigo | 11 | 2 | 85% | queimar 15% |
| Grande Labareda | Ninjutsu | fogo | todos os inimigos | 15 | 10 | 85% | queimar 30% |
| Lâmina de vento | Ninjutsu | vento | um inimigo | 10 | 2 | 90% | +5% crítico |
| Rajada | Ninjutsu | vento | um inimigo | 9 | 5 | 85% | 2 golpes; +10% crítico |
| Esfera de vácuo | Ninjutsu | vento | todos os inimigos | 7 | 10 | 85% | 2 golpes; +10% crítico |
| Faísca elétrica | Ninjutsu | raio | um inimigo | 12 | 2 | 80% | penetração 10% |
| Corrente elétrica | Ninjutsu | raio | um inimigo | 20 | 6 | 80% | penetração 20%; atordoar 15% (1 t) |
| Lâmina de raio | Ninjutsu | raio | um inimigo | 32 | 11 | 75% | penetração 30% |
| Punho de pedra | Ninjutsu | terra | um inimigo | 9 | 2 | 95% | — |
| Lança de terra | Ninjutsu | terra | um inimigo | 17 | 5 | 95% | atordoar 20% (1 t) |
| Dragão de terra | Ninjutsu | terra | todos os inimigos | 13 | 9 | 90% | atordoar 15% (1 t) |
| Projétil de água | Ninjutsu | água | um inimigo | 10 | 2 | 90% | — |
| Tubarão de água | Ninjutsu | água | um inimigo | 18 | 5 | 90% | — |
| Cachoeira | Ninjutsu | água | todos os inimigos | 14 | 9 | 90% | — |

### Classes do Caminho Ninja (Comum, prodígio, Uchiha, Hyuuga)

| Técnica | Tipo | Elemento | Alvo | Dano | Chakra | Precisão | Extra |
|---|---|---|---|---|---|---|---|
| Bunshin no Jutsu | Ninjutsu | — | em si | — | 3 | 85% | 1 clone; gasta o turno |
| Esforço | Taijutsu | — | em si | — | 3 | 85% | espera 4; fortalece 3 turnos (+3 nos ataques); ativa de classe |
| Selo explosivo | Taijutsu | — | todos os inimigos | 11 | 4 | 85% | espera 2 |
| Portões | Taijutsu | — | em si | — | 0 | — | abre, troca ou fecha um portão (Abertura, Descanso, Vida, Dor, Limite): dano ×1,15 a ×1,68 com desgaste de 2% a 8% do HP por turno ([combate.md](combate.md#portões)); ativa de classe |
| Entrada dinâmica | Taijutsu | — | um inimigo | 15 | 0 | 90% | +10% crítico; espera 2 |
| Lótus Oculta | Taijutsu | — | um inimigo | 12 | 0 | 85% | 4 golpes; custa 15% do HP; espera 4 |
| Punho Bêbado | Taijutsu | — | um inimigo | 7 | 0 | 75% | 3 golpes; +15% crítico |
| Sharingan | Genjutsu | — | em si | — | 3 | 85% | espera 4; fortalece 3 turnos (+15% acerto); ativa de classe |
| Sharingan (3 tomoe) | Genjutsu | — | em si | — | 4 | 85% | espera 4; fortalece 4 turnos (dano ×1.1) (+20% acerto); ativa de classe |
| Ilusão dos corvos | Genjutsu | — | um inimigo | 12 | 4 | 85% | atordoar 25% (1 t) |
| Tsukuyomi | Genjutsu | — | um inimigo | 30 | 12 | 85% | atordoar 50% (1 t); espera 4 |
| Selo amaldiçoado | Ninjutsu | — | em si | — | 0 | 85% | custa 10% do HP; espera 5; fortalece 3 turnos (dano ×1.4); ativa de classe |
| Byakugan | Taijutsu | — | em si | — | 3 | 85% | espera 4; fortalece 3 turnos (+100% acerto); ativa de classe |
| Byakugan (desperto) | Taijutsu | — | em si | — | 4 | 85% | espera 4; fortalece 4 turnos (dano ×1.15) (+100% acerto); ativa de classe |
| Palma Suave | Taijutsu | — | um inimigo | 10 | 0 | 95% | penetração 20%; bloqueio de chakra 30% |
| 64 Palmas | Taijutsu | — | um inimigo | 5 | 8 | 95% | 4 golpes; penetração 30%; bloqueio de chakra 50% (3 t); espera 3 |
| 128 Palmas | Taijutsu | — | um inimigo | 4 | 12 | 95% | 8 golpes; penetração 30%; bloqueio de chakra 60% (3 t); espera 4 |
| Rotação | Taijutsu | — | em si | — | 4 | 85% | escudo 25% do HP de quem usa; espera 3 |
| Palma do Vácuo | Taijutsu | — | um inimigo | 16 | 4 | 90% | penetração 20% |
| Paredão de vácuo | Taijutsu | — | todos os inimigos | 12 | 8 | 90% | espera 2 |
