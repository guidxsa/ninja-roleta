# Jornada

> **História na v0.35.0; Caminho Ninja na v0.36.0; Uchiha, Hyuuga e o easter egg do Sasuke na v0.37.0.** As pendências estão no fim.

O jogo tem dois modos, escolhidos na tela inicial:

- **Roleta**: o modo original ([campanha.md](../roleta/campanha.md)), que vai ficar enxuto: run mais curta e um combate refeito, extremamente simples e bem mais na sorte.
- **Jornada**: um roguelike mais lento e com mais controle, com equipe, talentos, relíquias e a história do Naruto. Tem um combate de equipe próprio, que usa as fórmulas da base ([fundamentos.md](../base/fundamentos.md)).

| Arquivo | Conteúdo |
|---|---|
| [historia.md](historia.md) | História: estágios, paradas, quem luta, vitórias especiais, eventos |
| [run.md](run.md) | Tipos de run, paradas, eventos e minijogos, dificuldade, salvamento, mapa ramificado |
| [combate.md](combate.md) | Combate de equipe, ordem, ações, efeitos, levantar, bolsa, moveset, interface |
| [personagens.md](personagens.md) | Fichas, técnicas e comportamento automático dos aliados |
| [inimigos.md](inimigos.md) | Fichas e técnicas dos inimigos |
| [talentos.md](talentos.md) | Árvores de talentos (Naruto, Comum, prodígio, Uchiha, Hyuuga) |
| [progressao.md](progressao.md) | XP, nível, recompensas, entre lutas |
| [reliquias.md](reliquias.md) | Relíquias: tiers, de onde vêm, catálogo |
| [caminho-ninja.md](caminho-ninja.md) | Caminho Ninja: estrutura, pools por estágio, chefes, eventos |
| [classes.md](classes.md) | Classes, sorteio do elemento, desbloqueios, ativas, suportes genéricos |

## Pilares

- **Rejogabilidade**: cada run traz combinações e experiências diferentes.
- **Construção de builds**: árvore de talentos, relíquias e moveset permitem estratégias variadas.
- **A equipe importa**: os suportes lutam, caem e precisam ser protegidos.
- **Descoberta**: classes, ramos da árvore e personalizações se liberam por condições e combinações.
- **Decisões significativas**: caminhos, eventos e recompensas trazem escolhas interessantes.
- **Sorte pesa menos**: o combate segue com sorteios, mas sem roleta na tela, só o resultado. Fora do combate, as recompensas são escolhas ou minijogos, não giros.

## Tipos de run

- **História do Naruto**: liberada desde o início, linear, com os confrontos do mangá ([historia.md](historia.md)).
- **Caminho Ninja**: protagonista de uma classe de origem com o elemento sorteado ([classes.md](classes.md)), mapa ramificado, encontros diferentes com a mesma dificuldade; suportes genéricos (2 Comuns, Daichi e Hana) ([caminho-ninja.md](caminho-ninja.md)).
- Um personagem nunca é protagonista e suporte na mesma run.

## Perfil e conquistas

- O perfil é um só para os dois modos ([perfil.md](../base/perfil.md)); a aba Conquistas tem a categoria Jornada.
- Conquistas da Jornada: Sino na mão, Ponte do Naruto, Coração de chunin, Vale do Fim (libera a Ōdama Rasengan), Hokage um dia (libera o Hardcore da Jornada), Lenda de Konoha, Ninguém fica para trás, Gama-chan gordo, Colecionador, Caminho próprio (vencer uma run do Caminho Ninja), Chama do clã (libera o Uchiha), Olhos abertos (libera o Hyuuga), Herdeiro do clã, Destino quebrado e duas secretas.
- Como a Jornada tem progressão permanente, é o modo que mais justifica contas para sincronizar o perfil (fase 3 do roteiro no CLAUDE.md).

## Simulação

`npm run sim:jornada -- [runs] [seed]`: um bot joga a História por dificuldade e mostra a taxa de vitória e onde as runs param. O bot joga pior que um humano (não monta o moveset, compra sem planejar).

## Ordem de construção

1. ~~Combate de equipe no core~~ (v0.35.0).
2. ~~História do Naruto completa, com a tela de batalha nova~~ (v0.35.0).
3. Sprites dos personagens e vilões (a tela já tem as poses prontas).
4. ~~Caminho Ninja: mapa ramificado, desconhecido, Comum e prodígio, suportes genéricos~~ (v0.36.0).
5. ~~Uchiha e Hyuuga com árvores, desbloqueios, versões suporte e o easter egg do Sasuke~~ (v0.37.0).

## Pendências

- Alvo de vitória do bot na Jornada (v0.35.1: Médio 78%, Difícil 6%).
- Versão suporte do prodígio e mais easter eggs por combinação.
- Nomes das paradas com sabor ninja.
