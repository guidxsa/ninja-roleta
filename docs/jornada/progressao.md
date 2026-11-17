# Progressão da Jornada

> História implementada na v0.35.0 ([README.md](README.md)). Números em `src/data/jornada/balance.ts`.

## XP e nível

- XP para o próximo nível: 100 + 30 × (nível − 1) (era + 40 até a v0.81.0). Cada nível dá **1 ponto de talento** e status (crescimento por personagem em [personagens.md](personagens.md)). Com a árvore toda comprada, o ponto vira ryō ([talentos.md](talentos.md#árvore-completa)).
- Os suportes sobem de nível junto com o protagonista.
- Subir de nível não restaura HP nem chakra.

## Recompensa por luta

| Luta | Ryō | Pontos de talento | XP |
|---|---|---|---|
| Comum | 15 | 0 | 40 |
| Elite | 35 | 1 | 80 (+ 1 relíquia) |
| História | 25 | 1 | 70 |
| Chefe | 50 | 1 | 120 (+ 1 de 3 relíquias de chefe) |

## Entre as lutas

- HP e chakra seguem de uma luta para a outra. Depois de cada vitória, toda a equipe do estágio (inclusive quem ficou de fora da luta) recupera um **valor fixo** de HP e de chakra. É uma **configuração da run**, pela dificuldade (`run.afterWinRecovery`), mostrada na tela de início e no aviso de vitória (v0.43.0; antes vinha da relíquia inicial):

  | | Fácil | Médio | Difícil | Hardcore |
  |---|---|---|---|---|
  | HP | 35 | 25 | 20 | 15 |
  | Chakra | 10 | 8 | 6 | 5 |

  Relíquias como o Cupom do Ichiraku somam a esse valor ([reliquias.md](reliquias.md)).
- **Estágio vencido** (o chefe caiu): toda a equipe volta com HP e chakra cheios, inclusive quem caiu.
- Aliado que caiu volta para a próxima luta com 30% do HP.
- Quem nunca lutou entra cheio.

## Árvore de talentos

Por classe, reinicia a cada run; alguns ramos abrem pela história e outros por objetivos da conta. Tem bifurcações e alguns talentos sobem de nível: [talentos.md](talentos.md). No Comum, desde a v0.91.0, os pontos se gastam no [rascunho](talentos.md#rascunho): núcleo escolhido no começo e 3 talentos oferecidos por vez.

## Quanto se ganha numa run

Na auditoria da v0.77.0 ([benchmark](../balanceamento/benchmark.md)), no Médio: a História termina perto do nível 9 com uns 34 pontos de talento; as classes do Caminho Ninja, perto do nível 7 a 8 com 15 a 18 pontos (as lutas de história dão 1 ponto cada, e o Caminho Ninja não tem). As árvores das classes ([talentos.md](talentos.md)) ainda são lineares; mais diversidade está em decisão com o usuário, uma classe por vez ([decisoes.md](../decisoes.md)). Não há bônus comprados entre runs.
