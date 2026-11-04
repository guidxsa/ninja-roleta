# História do Naruto

> Implementada na v0.35.0 ([README.md](README.md)). Dados em `src/data/jornada/stages.ts` e `events.ts`.

A história do mangá, do Mizuki ao Vale do Fim. **Linear**: sem ramificação nem escolha de caminho (o mapa ramificado é do Caminho Ninja, [run.md](run.md#mapa-ramificado)). Liberada desde o início.

## Estágios

Cada estágio é uma sequência fixa de paradas. Os confrontos de história (`História`) são do mangá, com quem estava lá; o último de cada estágio é o chefe.

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
| 7 | Mercado do País das Ondas | Mercador | |
| 8 | Zabuza, o Demônio da Névoa | Elite | Equipe 7 |
| 9 | Subir na árvore | Evento | |
| 10 | Ninjas renegados | Luta | Equipe 7 |
| 11 | Esconderijo do Gatō | Tesouro | |
| 12 | Casa do Tazuna | Descanso | |
| 13 | Naruto e Sasuke × Haku | Chefe | Naruto e Sasuke |

### 2 · Exame chunin

Equipe nas lutas comuns: Sasuke e Sakura. Cenário: arena.

| # | Parada | Tipo | Quem luta |
|---|---|---|---|
| 1 | Prova escrita | Evento (minijogo da memória) | |
| 2 | Ninjas da Grama | Luta | Equipe 7 |
| 3 | Floresta da Morte (Dosu, Zaku e Kin) | História | Equipe 7 |
| 4 | Trio da Chuva | Elite | Equipe 7 |
| 5 | Preliminares | Evento | |
| 6 | Naruto × Kiba (e Akamaru) | História | Naruto sozinho |
| 7 | Barraca da vila | Mercador | |
| 8 | O eremita dos sapos | Evento | |
| 9 | Pergaminho do céu | Tesouro | |
| 10 | Naruto × Neji | História | Naruto sozinho |
| 11 | Espião do Som (Kabuto) | Elite | Equipe 7 |
| 12 | Invasão de Konoha | Luta | Equipe 7 |
| 13 | Hospital de Konoha | Descanso | |
| 14 | Naruto × Gaara | Chefe | Naruto sozinho |

### 3 · Busca e resgate

A primeira metade é a busca pela Tsunade, com o Jiraiya; a segunda é o resgate do Sasuke, com a equipe do mangá (Shikamaru, Chōji, Kiba e Neji). Cada luta leva quem estava lá. Cenário: Vale do Fim.

| # | Parada | Tipo | Quem luta |
|---|---|---|---|
| 1 | Treino do Rasengan | Evento | |
| 2 | Tanzaku: Orochimaru e Kabuto | História | Naruto, Jiraiya e Tsunade |
| 3 | Naruto × Kabuto | História | Naruto sozinho |
| 4 | Cassino de Tanzaku | Mercador | |
| 5 | Naruto × Sasuke (hospital) | História | Naruto sozinho · vitória especial |
| 6 | O Sasuke foi embora | Evento | |
| 7 | Emboscada do Som | Luta | Naruto, Shikamaru e Kiba |
| 8 | Jirobo | Elite | Naruto, Chōji e Shikamaru |
| 9 | Bolsa do Quarteto | Tesouro | |
| 10 | Kidomaru e Tayuya | Elite | Naruto, Neji e Shikamaru |
| 11 | Sakon e Ukon | Elite | Naruto, Kiba e Neji |
| 12 | Naruto, Lee e Gaara × Kimimaro | História | Naruto, Lee e Gaara |
| 13 | Acampamento | Descanso | |
| 14 | Vale do Fim (Sasuke) | Chefe | Naruto sozinho |

## Vitórias especiais

- **Teste do sino**: levar o HP do Kakashi a 50% ou menos vence (pegar o sino).
- **Hospital**: aguentar 5 rodadas de pé, ou levar o HP do Sasuke a 50%, vence (o Kakashi interrompe).
- As outras lutas se vencem derrubando todos os inimigos.

## Eventos

Cada evento tem duas escolhas. As com minijogo ([run.md](run.md#minijogos)) dão o efeito ao ganhar e um prêmio menor ao perder.

| Evento | Escolhas |
|---|---|
| Formatura | Comer ramen (cura tudo, +15 ryō) · Treinar (+1 ponto de talento) |
| O construtor Tazuna | Proteger de graça (+20 ryō e marca: 20% de desconto no mercador do País das Ondas) · Cobrar (+45 ryō) |
| Subir na árvore | Selos: +6 de chakra máximo da equipe e +40 XP (perdeu: +2) · Descansar (cura 30%) |
| Prova escrita | Memória: +1 ponto de talento e +20 ryō (perdeu: +5 ryō) · Décima pergunta (+1 ponto de talento) |
| Preliminares | Ebisu (+80 XP) · Visitar o Lee (cura 50%, +1 kit de HP) |
| O eremita dos sapos | Selos: relíquia de evento (perdeu: +20 ryō) · "Pesquisa" (+30 ryō) |
| Treino do Rasengan | Selos: +2 pontos de talento (perdeu: +1) · Apostar com a Tsunade (+40 ryō, +10 de HP máximo) |
| O Sasuke foi embora | Prometer (+1 ponto de talento, cura 50%) · Jokenpô: relíquia de evento (perdeu: +20 ryō) |
