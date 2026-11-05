# Progressão da Jornada

> História implementada na v0.35.0 ([README.md](README.md)). Números em `src/data/jornada/balance.ts`.

## XP e nível

- XP para o próximo nível: 100 + 40 × (nível − 1). Cada nível dá **1 ponto de talento** e status (crescimento por personagem em [personagens.md](personagens.md)). Com a árvore toda comprada, o ponto vira ryō ([talentos.md](talentos.md#árvore-completa)).
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

- HP e chakra seguem de uma luta para a outra. Depois de cada vitória, toda a equipe do estágio (inclusive quem ficou de fora da luta) recupera uma fração do HP e do chakra máximos. É uma **configuração da run**, pela dificuldade (`run.afterWinRecovery`), mostrada na tela de início e no aviso de vitória (v0.43.0; antes vinha da relíquia inicial):

  | Fácil | Médio | Difícil | Hardcore |
  |---|---|---|---|
  | 35% | 25% | 20% | 15% |

  Relíquias como o Cupom do Ichiraku somam a esse valor ([reliquias.md](reliquias.md)).
- **Estágio vencido** (o chefe caiu): toda a equipe volta com HP e chakra cheios, inclusive quem caiu.
- Aliado que caiu volta para a próxima luta com 30% do HP.
- Quem nunca lutou entra cheio.

## Árvore de talentos

Por classe, reinicia a cada run; alguns ramos abrem pela história e outros por objetivos da conta. Tem bifurcações e alguns talentos sobem de nível: [talentos.md](talentos.md).

## Futuro (Caminho Ninja)

- Árvore por classe (Comum, prodígio, Uchiha, Hyuuga), com material já pronto: o kit do prodígio e a Palma do Vácuo do Hyuuga ([classes.md](classes.md)).
- Sem bônus comprados entre runs, por enquanto.
