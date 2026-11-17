# Proposta: inimigos novos no Caminho Ninja e Hyuuga no cânone (para aprovar)

Itens 43 e 44 de [decisoes.md](../decisoes.md). Nada daqui está no código. Os números são o ponto de partida, na escala das fichas de hoje ([inimigos.md](inimigos.md)); os finais saem da simulação, no rebalanceamento para a meta 90/65/40/15 que vem depois destas fichas.

## Parte 1 · Inimigos novos no Caminho Ninja

Hoje cada estágio tem 2 chefes, 2 ou 3 elites e 4 lutas, todos já vistos na História ou no Roleta ([caminho-ninja.md](caminho-ninja.md#pools-por-estágio)). A proposta dá a cada estágio **+1 chefe, +2 elites e +2 lutas**, com personagens do mangá que o jogo ainda não usa, e **Itachi e Kisame como elite rara** no estágio 3.

### Pools depois da mudança

| Estágio | Lutas novas | Elites novas | Chefe novo |
|---|---|---|---|
| 1 · Terras de ninguém | 2 samurais errantes · caçador da Névoa e bandido | **Zōri e Waraji** (guarda-costas do Gatō) · **2 caçadores da Névoa** | **Gatō e os mercenários**: Gatō com Zōri, Waraji e 2 mercenários |
| 2 · Vilas em guerra | 2 genins da Areia · genin da Areia e ninja da Grama | **Yoroi e Misumi** (equipe do Kabuto no Exame) · **3 genins da Areia** | **Kankurō e Temari** |
| 3 · Rastro do Som | 2 guardas do esconderijo · guarda e cobra | **Tayuya e os Doki** (os três demônios da flauta) · **2 guardas e Kidōmaru** | **Sakon e Ukon** (marca da maldição nível 2, dois corpos) |
| 3 · elite rara | — | **Itachi e Kisame**: 10% de chance de tomar o lugar de uma elite do estágio 3 | — |

Os chefes continuam sorteados no começo da run, agora entre 3.

### Fichas

| Inimigo | HP | Chakra | Speed | Tai/Nin/Gen | Res. física/mental | Elemento | IA | Técnicas | Passiva |
|---|---|---|---|---|---|---|---|---|---|
| Samurai errante | 60 | 0 | 9 | 9/0/0 | 5/3 | — | brute | Corte rápido, Katana | — |
| Caçador da Névoa | 70 | 20 | 13 | 8/9/4 | 6/6 | água | striker | Senbon, Projétil de água | — |
| Zōri | 95 | 0 | 10 | 11/0/0 | 7/4 | — | brute | Katana, Corte rápido | — |
| Waraji | 105 | 0 | 8 | 12/0/0 | 8/4 | — | brute | Machado pesado, Porrete | — |
| Gatō | 50 | 0 | 7 | 4/0/0 | 3/3 | — | coward | Bengala, Ordem: atacar | Covarde: com Zōri ou Waraji de pé, os golpes de alvo único nele caem no guarda-costas; com os dois caídos, foge (a luta acaba em vitória) |
| Genin da Areia | 70 | 18 | 11 | 8/9/5 | 6/6 | vento | striker | Kunai, Lâmina de vento | — |
| Yoroi | 110 | 30 | 11 | 10/8/4 | 7/7 | — | tactician | Mão que suga chakra, Kunai | Rouba chakra: a mão que acerta tira 6 de chakra do alvo e dá para ele |
| Misumi | 100 | 20 | 12 | 10/6/4 | 8/6 | — | tactician | Corpo flexível, Kunai | Agarrar: o Corpo flexível prende (atordoa) e o alvo toma +20% de dano dele enquanto preso |
| Kankurō | 140 | 36 | 11 | 7/12/6 | 8/8 | — | tactician | Karasu: lâminas envenenadas, Karasu: abraço, Kunai | Marionete: 30% dos golpes de alvo único nele caem na Karasu (que tem 60 de HP); com a Karasu destruída, perde as técnicas dela |
| Temari | 130 | 40 | 13 | 7/14/4 | 7/8 | vento | striker | Grande leque: rajada, Lâmina de vento, Kunai | — |
| Guarda do esconderijo | 80 | 16 | 11 | 10/8/5 | 7/6 | — | striker | Kunai, Lâmina sonora | — |
| Doki | 80 | 0 | 9 | 11/0/0 | 7/7 | — | brute | Golpe dos demônios | invocados da flauta: lutam junto da Tayuya desde o começo |
| Sakon e Ukon | 260 | 40 | 14 | 15/10/6 | 10/8 | — | brute | Golpe gêmeo, Fusão parasita, Rashōmon | Dois corpos: a 50% do HP o Ukon se separa e luta junto (60% do HP do Sakon, mesmas técnicas); fúria abaixo de 40% (dano ×1,25) |
| Itachi | 240 | 60 | 18 | 13/16/18 | 10/14 | fogo | tactician | Tsukuyomi, Amaterasu, Kunai, Clone de corvos | Sharingan: 20% de esquiva a mais; imune a Medo |
| Kisame | 300 | 70 | 13 | 16/14/4 | 12/8 | água | brute | Samehada, Tubarão de água, Prisão de água | Samehada: cada golpe que acerta rouba 5 de chakra do alvo |

**Itachi e Kisame:** a luta vence de dois jeitos, **derrubar os dois** ou **resistir 6 rodadas** com o protagonista de pé (eles se retiram, como quando o Jiraiya chega no mangá; o motor já tem a vitória por resistir, `survive`). Derrubar os dois dá uma relíquia rara a mais; resistir dá a recompensa de elite. Eles nunca aparecem no 1º ciclo do Fácil.

### Técnicas novas

| Técnica | Tipo | Elemento | Alvo | Dano | Chakra | Precisão | Extra |
|---|---|---|---|---|---|---|---|
| Corte rápido | Taijutsu | — | um inimigo | 8 | 0 | 90% | 2 golpes |
| Machado pesado | Taijutsu | — | um inimigo | 16 | 0 | 75% | atordoar 15% (2 t) |
| Bengala | Taijutsu | — | um inimigo | 4 | 0 | 85% | — |
| Ordem: atacar | — | — | aliados | — | 0 | — | os aliados dele ganham +20% de dano por 2 turnos; espera 3 |
| Lâmina de vento | Ninjutsu | vento | um inimigo | 11 | 3 | 85% | — |
| Mão que suga chakra | Taijutsu | — | um inimigo | 10 | 2 | 85% | tira 6 de chakra do alvo e dá para quem usa |
| Corpo flexível | Taijutsu | — | um inimigo | 8 | 3 | 80% | atordoar 100% (2 t); espera 4 |
| Karasu: lâminas envenenadas | Taijutsu | — | um inimigo | 9 | 3 | 85% | 2 golpes; veneno 40% |
| Karasu: abraço | Taijutsu | — | um inimigo | 6 | 5 | 80% | atordoar 100% (2 t); espera 4 |
| Grande leque: rajada | Ninjutsu | vento | todos os inimigos | 12 | 8 | 85% | espera 2 |
| Golpe dos demônios | Taijutsu | — | um inimigo | 10 | 0 | 85% | — |
| Fusão parasita | Taijutsu | — | um inimigo | 14 | 4 | 85% | veneno 30% |
| Rashōmon | Ninjutsu | — | em si | — | 8 | — | barreira de 25% do HP; espera 4 |
| Tsukuyomi | Genjutsu | — | um inimigo | 20 | 12 | 85% | atordoar 60% (2 t); medo 100% (2 t); espera 4 |
| Amaterasu | Ninjutsu | fogo | um inimigo | 16 | 15 | 85% | queimar 100% (3 t); espera 4 |
| Clone de corvos | Genjutsu | — | em si | — | 6 | — | o próximo golpe de alvo único nele erra; espera 3 |
| Samehada | Taijutsu | — | um inimigo | 18 | 0 | 85% | rouba 5 de chakra |
| Tubarão de água | Ninjutsu | água | todos os inimigos | 15 | 10 | 85% | espera 2 |

As fichas que precisam de regra nova são três (as outras são só dados): o **Covarde** do Gatō, a **Marionete** do Kankurō e os **dois corpos** do Sakon e Ukon. O resto usa o que o motor já tem: atordoar, veneno, barreira, roubo de chakra, grupos de inimigos e a vitória por resistir (`survive`).

### Para decidir

1. Os 3 chefes novos (Gatō e os mercenários, Kankurō e Temari, Sakon e Ukon) e as 6 elites.
2. Itachi e Kisame como elite rara de 10%, com a vitória por resistir 6 rodadas.
3. As três regras novas (Covarde, Marionete, dois corpos), ou trocar alguma por uma ficha sem regra nova.

## Parte 2 · Hyuuga no cânone

**O problema:** o Hyuuga do Caminho Ninja entra nas lutas com 97–99% do chakra (diagnóstico 2, J6). A Palma Suave, a técnica dele, custa 0, e as outras quase nada, então relíquias e talentos de chakra não fazem nada para ele, e ele bate no Difícil acima de todos (87% com o bot novo).

**A direção, pelo mangá:** o Punho Suave é chakra. O Byakugan fica ativo gastando chakra, cada palma fecha um ponto do sistema de chakra do alvo, e a Rotação e as 64 Palmas são técnicas caras, que o Neji só usa quando precisa. O chakra vira o recurso do Hyuuga, e quem o enfrenta perde o dele.

### Técnicas

| Técnica | Hoje | Proposta |
|---|---|---|
| Byakugan (ativa) | 3 de chakra, 3 turnos, espera 4: não erra e +20% de penetração | **Postura**: liga e desliga (sem espera); 2 para ligar e **2 por turno** enquanto aceso; o taijutsu não erra, +20% de penetração, vê através da névoa e da esquiva dos clones. Sem chakra para manter, apaga |
| Byakugan desperto | 4 de chakra, 4 turnos: +30% de penetração e +15% de dano | Mesma postura, manutenção 3: +30% de penetração e +15% de dano |
| Palma Suave | 10 de dano, 0 de chakra, 95%, 30% de bloqueio de chakra | 12 de dano, **2 de chakra**; **fecha pontos: tira 3 de chakra do alvo**; com o Byakugan aceso, tira 5 e o bloqueio sobe para 45% |
| Rotação | 4 de chakra, escudo de 25%, espera 3 | **8 de chakra**, escudo de 30% e **devolve 30%** do que segura (antes só com o talento final), espera 3 |
| 64 Palmas | 8 de chakra, 5 × 4 golpes, espera 3 | **12 de chakra, só com o Byakugan aceso**; 6 × 4 golpes; cada golpe tira 2 de chakra do alvo |
| 128 Palmas | 12 de chakra, 4 × 8 golpes, espera 4 | **18 de chakra, só com o Byakugan aceso**; 5 × 8 golpes; cada golpe tira 2 de chakra |
| Palma do Vácuo | 4 de chakra, 16 de dano | 6 de chakra, 18 de dano |
| Paredão de vácuo | 8 de chakra, 12 em todos | 10 de chakra, 14 em todos |

**Status:** chakra do Hyuuga **28 → 40** (para caber a postura e as palmas). O resto igual.

### Talentos que mudam junto

| Talento | Hoje | Proposta |
|---|---|---|
| Visão ampla | o Byakugan custa 1 a menos | a manutenção do Byakugan custa 1 a menos |
| Fechar pontos (bifurcação) | cada taijutsu que acerta tira 2 de chakra | cada taijutsu que acerta tira +2 de chakra, e **1 do chakra tirado volta para você** |
| Giro rápido (bifurcação) | a Rotação custa 2 a menos | a Rotação custa 3 a menos |
| Defesa absoluta (final) | o escudo devolve 75% | o escudo devolve 75% (antes 0 → 75%; agora 30% → 75%) |
| Campo dos trigramas (final) | taijutsu tira 1 de chakra; +30% contra alvo sem chakra | igual: o chakra do alvo acaba mais rápido, então o final pesa mais cedo |

A relíquia inicial (Pergaminho do Punho Suave: Palmas +15% e +5% de crítico) e a evolução dela ficam iguais. Os suportes Hyuuga (guardiã e atacante) seguem com a Palma Suave nova; a IA deles liga o Byakugan só com chakra acima de 50%.

**O que se espera:** o Hyuuga passa a gastar chakra de verdade e a escolher entre manter o Byakugan, as Palmas e a Rotação. As relíquias e talentos de chakra passam a valer para ele. A força deve cair no Difícil, que hoje está muito acima da meta; o rebalanceamento acerta depois.

### Para decidir

1. O Byakugan como postura com manutenção por turno, no lugar da ativa de 3 turnos.
2. A Palma Suave pagando 2 de chakra e fechando pontos.
3. Palmas só com o Byakugan aceso e a Rotação que devolve dano desde o começo.
4. O chakra 28 → 40.
