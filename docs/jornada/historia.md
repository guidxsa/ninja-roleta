# História do Naruto

> Implementada na v0.35.0 ([README.md](README.md)). Dados em `src/data/jornada/stages.ts` e `events.ts`.

A história do mangá, do Mizuki ao Vale do Fim. **Linear**: sem ramificação nem escolha de caminho (o mapa ramificado é do Caminho Ninja, [run.md](run.md#mapa-ramificado)). Liberada desde o início.

## Estágios

São quatro arcos, um por estágio (v0.58.0): **País das Ondas, Exame chunin, Sannin e Vale do Fim**. Cada arco tem uma arte própria (as vagas `arco-*` de [visual.md](../visual.md#vagas-de-ilustração)). A campanha é a perspectiva do Naruto, o dia da dualidade; a do Sasuke, a noite, está em design em [historia-sasuke.md](historia-sasuke.md).

Cada estágio é uma sequência fixa de paradas. Os confrontos de história (`História`) são do mangá, com quem estava lá; o último de cada estágio é o chefe.

Desde a v0.67.0, os momentos fundamentais do mangá acontecem dentro das lutas, pelo roteiro ([roteiro.md](roteiro.md)): falas, transformações, reforços e troca de fase. A árvore de talentos decide *como* o Naruto cresce, nunca *se* esses momentos acontecem. A seção [Momentos canônicos](#momentos-canônicos) lista cada um.

### 1 · Academia e País das Ondas

Equipe nas lutas comuns: Sasuke e Sakura. Cenário: floresta.

| # | Parada | Tipo | Quem luta |
|---|---|---|---|
| 1 | Naruto × Mizuki | História | Naruto sozinho |
| 2 | Formatura | Evento | |
| 3 | Teste do sino (Kakashi) | História | Equipe 7 · vitória especial |
| 4 | Capangas do Gatō | Luta | Equipe 7 |
| 5 | O construtor Tazuna | Evento | |
| 6 | Irmãos Demônio | Elite | Equipe 7 |
| 7 | Zabuza, o Demônio da Névoa | Elite | Equipe 7; o Kakashi entra no lugar da Sakura |
| 8 | Subir na árvore | Evento | |
| 9 | Ninjas renegados | Luta | Equipe 7 |
| 10 | Esconderijo do Gatō | Tesouro | |
| 11 | Casa do Tazuna | Descanso | |
| 12 | Naruto e Sasuke × Haku | Chefe | Naruto e Sasuke · Kyuubi |

### 2 · Exame chunin

Equipe nas lutas comuns: Sasuke e Sakura. Cenário: arena.

| # | Parada | Tipo | Quem luta |
|---|---|---|---|
| 1 | Prova escrita | Evento (minijogo da memória) | |
| 2 | Ninjas da Grama | Luta | Equipe 7 |
| 3 | Orochimaru na Floresta da Morte | História | Equipe 7 · resistir (v0.67.0) |
| 4 | Floresta da Morte (Dosu, Zaku e Kin) | História | Equipe 7 · selo do Sasuke |
| 5 | Trio da Chuva | Elite | Equipe 7 |
| 6 | Preliminares | Evento | |
| 7 | Naruto × Kiba (e Akamaru) | História | Naruto sozinho |
| 8 | O eremita dos sapos | Evento · marco: Kuchiyose | |
| 9 | Pergaminho do céu | Tesouro | |
| 10 | Naruto × Neji | História | Naruto sozinho · Kyuubi |
| 11 | Espião do Som (Kabuto) | Elite | Equipe 7 |
| 12 | Invasão de Konoha | Luta | Equipe 7 |
| 13 | Hospital de Konoha | Descanso | |
| 14 | Naruto × Gaara | Chefe | Naruto sozinho · Shukaku e Gamabunta |

### 3 · Os Sannin

A busca pela Tsunade com o Jiraiya (vol. 16 a 19). Equipe: Jiraiya. Cenário: floresta.

| # | Parada | Tipo | Quem luta |
|---|---|---|---|
| 1 | Itachi e Kisame | Evento | |
| 2 | Treino do Rasengan | Evento · marco: Rasengan | |
| 3 | Pousada de Tanzaku | Descanso | |
| 4 | Tanzaku: Orochimaru e Kabuto | História | Naruto, Jiraiya e Tsunade |
| 5 | Naruto × Kabuto | Chefe | Naruto sozinho · finalizador: Rasengan |

O Itachi e Kisame (cap. 139 a 147) e a pousada entraram na v0.58.0, quando a antiga "Busca e resgate" virou dois arcos, e o Kabuto passou de História a chefe (clímax do arco: recompensa e relíquia de chefe). Estão em revisão em [decisoes.md](../decisoes.md).

### 4 · Vale do Fim

O resgate do Sasuke com a equipe do mangá (Shikamaru, Chōji, Kiba e Neji). Cada luta leva quem estava lá. Cenário: Vale do Fim.

| # | Parada | Tipo | Quem luta |
|---|---|---|---|
| 1 | Naruto × Sasuke (hospital) | História | Naruto sozinho · vitória especial |
| 2 | O Sasuke foi embora | Evento | |
| 3 | Emboscada do Som | Luta | Naruto, Shikamaru e Kiba |
| 4 | Jirobo | Elite | Naruto, Chōji e Shikamaru |
| 5 | Bolsa do Quarteto | Tesouro | |
| 6 | Kidomaru e Tayuya | Elite | Naruto, Neji e Shikamaru |
| 7 | Sakon e Ukon | Elite | Naruto, Kiba e Neji |
| 8 | Naruto × Kimimaro | História | Naruto sozinho; chegam o Lee e o Gaara · resistir |
| 9 | Acampamento | Descanso | |
| 10 | Vale do Fim (Sasuke) | Chefe | Naruto sozinho · selo nível 2 contra a Kyuubi |

Runs salvas quando os dois arcos eram um estágio só voltam na mesma parada (`src/state/jornadaSave.ts`).

## Vitórias especiais

- **Teste do sino**: levar o HP do Kakashi a 50% ou menos vence (pegar o sino). Desde a v0.66.0 a luta tem roteiro (falas de abertura e do sino; [roteiro.md](roteiro.md)).
- **Orochimaru na Floresta da Morte**: aguentar 4 rodadas, ou levar o HP dele a 80%, vence.
- **Kabuto**: só cai com o Rasengan (finalizador, [roteiro.md](roteiro.md#condições-de-vitória)). Outro golpe fatal deixa 1 de HP. O Rasengan entra na luta mesmo fora do moveset.
- **Kimimaro**: aguentar 8 rodadas, ou levar o HP dele a 30%, vence (a doença o derruba, como no mangá).
- **Vale do Fim**: com o Sasuke a 20%, o Rasengan e o Chidori se chocam e a luta termina como vitória; o Sasuke parte.
- **Hospital**: aguentar 5 rodadas de pé, ou levar o HP do Sasuke a 50%, vence (o Kakashi interrompe).
- As outras lutas se vencem derrubando todos os inimigos.

## Momentos canônicos

Os momentos fundamentais do mangá (v0.67.0), com o roteiro de cada luta ([roteiro.md](roteiro.md)). Cada momento canônico é um pico de poder, não um castigo: quando o roteiro tira algo do jogador, devolve mais.

| Luta | O que acontece |
|---|---|
| Teste do sino | Falas do Kakashi e do Naruto ao pegar o sino |
| Zabuza | A 60% do Zabuza, o Kakashi se solta da prisão de água e entra; a Sakura sai para proteger o Tazuna (volta de pé para a run) |
| Haku | A 55% do Haku, o Sasuke cai protegendo o Naruto; quando ele cai (pelo roteiro ou antes), o Naruto libera o **chakra da Kyuubi** (ataques e resistências ×1,25, cura 30%, Garras da Kyuubi) e ganha a marca que abre o ramo Kyuubi da árvore. A 20%, o Naruto reconhece o rosto, para o golpe e a luta termina como vitória |
| Orochimaru (Floresta da Morte) | Resistir; o Sasuke recebe o selo amaldiçoado. Naruto abaixo de 50%: chakra da Kyuubi por 3 turnos |
| Dosu, Zaku e Kin | Sasuke abaixo de 50%: o **selo amaldiçoado** desperta por 4 turnos (×1,3, cura 15%) |
| Neji | Naruto abaixo de 40%: o Naruto pede o chakra da Kyuubi (3 turnos) |
| Gaara | A 40% do Gaara, ele vira **Shukaku**; o Naruto invoca e o **Gamabunta** entra como aliado. Vence quando o Shukaku cai |
| Kabuto | Finalizador: só cai com o Rasengan |
| Kimimaro | Começa com o Naruto sozinho; o Lee chega na rodada 3 e o Gaara na 5. Resistir |
| Vale do Fim | Sasuke a 60%: **selo nível 2**. Naruto a 45%: **manto de uma cauda** (×1,35, cura 30%). Sasuke a 20%: o choque final e a partida do Sasuke |

**Marcos da história** (técnicas que a campanha dá, sem passar pela árvore):

- **Kuchiyose no Jutsu**: no contrato com os sapos (Exame). O Naruto clássico não escolhe o sapo: a invocação sorteia girinos, Gamakichi, Gamatatsu ou, raramente, o Gamabunta ([personagens.md](personagens.md)). A escolha do evento passou a ser só o bônus extra.
- **Rasengan**: no treino com o Jiraiya (Sannin).
- **Chakra da Kyuubi**: depois do Haku (a marca carimba a raiz do ramo Kyuubi).

## Eventos

Cada evento tem duas escolhas. As com minijogo ([run.md](run.md#minijogos)) dão o efeito ao ganhar e um prêmio menor ao perder.

| Evento | Escolhas |
|---|---|
| Formatura | Comer ramen (cura tudo, +15 ryō) · Treinar (+1 ponto de talento) |
| O construtor Tazuna | Proteger de graça (+20 ryō e marca: 20% de desconto na loja durante o País das Ondas) · Cobrar (+45 ryō) |
| Subir na árvore | Selos: +6 de chakra máximo da equipe e +40 XP (perdeu: +2) · Descansar (+30 de HP, +9 de chakra) |
| Prova escrita | Memória: +1 ponto de talento e +20 ryō (perdeu: +5 ryō) · Décima pergunta (+1 ponto de talento) |
| Preliminares | Ebisu (+80 XP) · Visitar o Lee (+50 de HP, +15 de chakra, +1 kit de HP) |
| O eremita dos sapos | Selos: relíquia de evento (perdeu: +20 ryō) · "Pesquisa" (+30 ryō) |
| Itachi e Kisame | Correr atrás do Sasuke (+50 XP, +6 de HP máximo da equipe) · Esperar o Jiraiya (+40 de HP, +12 de chakra, +20 ryō) |
| Treino do Rasengan | Selos: +2 pontos de talento (perdeu: +1) · Apostar com a Tsunade (+40 ryō, +10 de HP máximo) |
| O Sasuke foi embora | Prometer (+1 ponto de talento, +50 de HP, +15 de chakra) · Jokenpô: relíquia de evento (perdeu: +20 ryō) |
