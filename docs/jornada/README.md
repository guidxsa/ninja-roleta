# Jornada

> **Rascunho, não implementado.** Design do segundo modo de jogo, combinado com o usuário em 01/11/2026. Nada aqui está no código ainda; as pendências estão no fim.

O jogo passa a ter dois modos:

- **Roleta**: o modo atual ([campanha.md](../roleta/campanha.md)), que vai ficar enxuto: run mais curta e um combate refeito, extremamente simples e bem mais na sorte.
- **Jornada**: um roguelike de mapa, mais lento e com mais controle. Herda o combate atual ([base/](../base/fundamentos.md)), com as fórmulas, técnicas, efeitos e números de `balance`, adaptado para equipes. Mais confrontos, subtramas, eventos e builds.

| Arquivo | Conteúdo |
|---|---|
| [run.md](run.md) | Estágios, mapa, paradas, eventos e minijogos, dificuldade, salvamento |
| [combate.md](combate.md) | Combate de equipe, alvos, levantar quem caiu, moveset |
| [classes.md](classes.md) | Classes, desbloqueios, easter eggs, versão suporte |
| [progressao.md](progressao.md) | XP, pontos e árvore de talentos |
| [reliquias.md](reliquias.md) | Relíquias: tiers, de onde vêm |

## Pilares

- **Rejogabilidade**: cada run traz combinações e experiências diferentes.
- **Construção de builds**: árvore de talentos, relíquias e moveset permitem estratégias variadas.
- **A equipe importa**: os suportes lutam, caem e precisam ser protegidos.
- **Descoberta**: classes, ramos da árvore e personalizações se liberam por condições e combinações.
- **Decisões significativas**: caminhos, eventos e recompensas trazem escolhas interessantes.
- **Sorte pesa menos**: o combate segue com os sorteios de hoje (iniciativa, acerto, dano, [fundamentos.md](../base/fundamentos.md)), mas sem roleta na tela, só o resultado. Fora do combate, as recompensas são escolhas ou minijogos, não giros.

## Modos de run

- **Run canônica do Naruto**: liberada desde o início. Protagonista Naruto, com Sasuke e Sakura fixos de suporte. Segue os arcos e chefes da história.
- **Runs genéricas**: protagonista de uma classe de origem ([classes.md](classes.md)). Encontros diferentes dos da canônica, com a mesma dificuldade, coerentes com o universo. Os suportes são ninjas das classes genéricas (no começo, 2 Comuns).
- Um personagem nunca é protagonista e suporte na mesma run.

## Perfil e conquistas

- O perfil é um só para os dois modos ([perfil.md](../base/perfil.md)), com as conquistas separadas por categoria (Roleta, Jornada).
- Como a Jornada tem progressão permanente (classes e ramos liberados), é o modo que mais justifica contas para sincronizar o perfil (fase 3 do roteiro no CLAUDE.md).

## Interface

- Tela de batalha dedicada: cenário, equipes frente a frente, menu de ações do protagonista e log curto. Animações a partir dos eventos de combate (o core já registra cada evento da luta), inclusive quando os suportes agem, respeitando o modo instantâneo.
- Depois: sprites originais dos protagonistas, suportes e vilões (poses parado, ataque e dano), com o retrato SVG atual como reserva quando faltar imagem.

## Ordem de construção sugerida

1. Combate de equipe no core (vários lutadores por lado, alvos, levantar quem caiu).
2. Run canônica do Naruto, primeiro estágio, como fatia vertical para ver se é divertido.
3. Mapa completo, mercador, descanso, tesouro, relíquias, salvamento.
4. Classes genéricas (Comum, prodígio, Uchiha, Hyuuga) com suas árvores.

## Pendências

- Como o Comum "vem sem elementos" na Jornada (sorteio ou escolha) para virar prodígio.
- Tamanho da run: quantos estágios e quantas paradas por mapa (referência: os roguelikes de mapa).
- Economia: ganhos e preços.
- Chefes, elites e encontros das runs genéricas.
- Comportamento automático dos suportes e a versão suporte de cada classe.
- Nomes das paradas.
