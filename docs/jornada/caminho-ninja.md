# Caminho Ninja

> Implementadas na v0.36.0 ([README.md](README.md)). Dados em `src/data/jornada/generic.ts` e `events.ts`.

A run que aproveita o **mapa ramificado** ([run.md](run.md#mapa-ramificado)): o jogador escolhe o caminho, com encontros variados e a mesma dificuldade da História. Protagonista de uma classe ([classes.md](classes.md)) e 2 suportes sorteados entre os genéricos e as versões suporte das classes liberadas ([classes.md](classes.md#suportes-genéricos-versão-suporte)).

## Estrutura

- 3 estágios, cada um com um mapa de 12 linhas e um **chefe sorteado no começo da run** (aparece no topo do mapa).
- As lutas das 3 primeiras linhas saem de um pool mais leve.
- Vencer o chefe: equipe cheia e 1 de 3 relíquias lendárias, como na História.

## Pools por estágio

| Estágio | Lutas leves (linhas 0–2) | Lutas | Elites | Chefes (um sorteado) |
|---|---|---|---|---|
| 1 · Terras de ninguém | 2 bandidos · capanga e bandido · renegado da Névoa · ninja renegado | 3 bandidos · 2 capangas e bandido · renegado da Névoa e bandido · ninja renegado e capanga | Irmãos Demônio · 2 ninjas renegados e renegado da Névoa | Zabuza · Haku |
| 2 · Vilas em guerra | ninja da Grama · ninja da Chuva e bandido · ninja do Som | 2 da Grama · 2 da Chuva · Som e Grama · renegado, Chuva e bandido | Trio da Chuva · Dosu, Zaku e Kin · Kabuto e ninja do Som | Gaara · Neji |
| 3 · Rastro do Som | ninja do Som e bandido · cobra · 2 ninjas renegados | 2 do Som e cobra · 2 cobras · Som, renegado e Som | Jirobo · Kidomaru e Tayuya · Sakon e cobra | Orochimaru · Kimimaro |

Fichas: [inimigos.md](inimigos.md).

## Eventos

Saem do **desconhecido** (50% das vezes). Um evento não repete na mesma run enquanto houver outro novo. Alguns lembram o Roleta.

| Evento | Escolhas |
|---|---|
| A velhinha | Ajudar (+1 kit de HP e marca *ajudou a velhinha*) · Seguir (+15 ryō) |
| Barraca de ramen | Pagar (15 ryō, cura 60%) · De graça se ajudou a velhinha (cura 60%) · Treinar (+20 XP) |
| Treino na clareira | Selos: +1 ponto de talento e +30 XP (perdeu: +30 XP) · Treino pesado (+60 XP, equipe perde 15% do HP) |
| Jokenpô | Jogar: relíquia rara (perdeu: +10 ryō) · Vender o pergaminho (+20 ryō) |
| O guru | Pagar 40 ryō: +2 pontos de talento · Memória: +1 ponto de talento · Ir embora |
| Mantos de nuvem vermelha | Memória: +40 ryō (perdeu: equipe perde 30% do HP) · Fugir (equipe perde 15% do HP) |
| Achado | +1 Pílula de reanimação · +50 XP |
| Contrato de invocação | Selos: relíquia rara (perdeu: equipe perde 10% do HP) · +6 de HP máximo da equipe |

- Opção com custo em ryō só aparece com ryō suficiente.
- Perder HP em evento nunca derruba ninguém (fica pelo menos 1).
