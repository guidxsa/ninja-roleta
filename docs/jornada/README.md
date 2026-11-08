# Jornada

> **História na v0.35.0; Caminho Ninja na v0.36.0; Uchiha, Hyuuga e o easter egg do Sasuke na v0.37.0; modo infinito do Caminho Ninja na v0.44.0.** As pendências estão no fim.

O jogo tem dois modos, escolhidos na tela inicial:

- **Roleta**: o modo original ([campanha.md](../roleta/campanha.md)), que vai ficar enxuto: run mais curta e um combate refeito, extremamente simples e bem mais na sorte.
- **Jornada**: um roguelike mais lento e com mais controle, com equipe, talentos, relíquias e a história do Naruto. Tem um combate de equipe próprio, que usa as fórmulas da base ([fundamentos.md](../base/fundamentos.md)).

| Arquivo | Conteúdo |
|---|---|
| [historia.md](historia.md) | História: estágios, paradas, quem luta, vitórias especiais, eventos |
| [run.md](run.md) | Tipos de run, paradas, eventos e minijogos, dificuldade, salvamento, mapa ramificado, modo infinito |
| [combate.md](combate.md) | Combate de equipe, ordem, ações, efeitos, levantar, bolsa, moveset, interface |
| [personagens.md](personagens.md) | Fichas, técnicas e comportamento automático dos aliados |
| [inimigos.md](inimigos.md) | Fichas e técnicas dos inimigos |
| [talentos.md](talentos.md) | Árvores de talentos (Naruto, Comum, prodígio, Uchiha, Hyuuga) |
| [progressao.md](progressao.md) | XP, nível, recompensas, entre lutas |
| [reliquias.md](reliquias.md) | Relíquias: classificações, de onde vêm, evolução, coleção, catálogo |
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
- **Caminho Ninja**: protagonista de uma classe de origem com o elemento escolhido ou sorteado ([classes.md](classes.md)), mapa ramificado, encontros diferentes com a mesma dificuldade; 2 suportes com classe (entre as liberadas) e nome sorteados ([caminho-ninja.md](caminho-ninja.md)). Vencido, segue no **modo infinito**: de volta ao estágio 1 com os inimigos mais fortes a cada ciclo ([run.md](run.md#modo-infinito)).
- Um personagem nunca é protagonista e suporte na mesma run.

## Campanhas

A História é organizada em **campanhas** (`CampaignDef` em `src/core/jornada/data.ts`, dados em `src/data/jornada/campaigns.ts`). Cada campanha é a perspectiva de um personagem, com seus arcos em ordem, e se liga ao dia ou à noite da identidade visual. Combate, loja, relíquias, talentos e eventos são os mesmos para todas; muda o que se conta e como.

- **Naruto** (dia): a única jogável, em 4 arcos ([historia.md](historia.md)).
- **Sasuke** (noite): em design ([historia-sasuke.md](historia-sasuke.md)).
- Fluxo de entrada: a entrada da Jornada tem os cards **Modo História** (abre a escolha da perspectiva: Naruto ou Sasuke, em breve) e **Caminho Ninja** (abre a preparação: classe e elemento); o Progresso continua a run salva direto ([visual.md](../visual.md#entrada-da-jornada)).
- A run guarda a campanha (`campaign`; sem ela, Naruto) e lê os arcos por `storyStages`. Shippuden entra como campanhas novas, sem sistema novo.

## Perfil e conquistas

- O perfil é um só para os dois modos ([perfil.md](../base/perfil.md)); a aba Conquistas tem a categoria Jornada.
- Conquistas da Jornada: Sino na mão, Ponte do Naruto, Coração de chunin, Vale do Fim (libera a Ōdama Rasengan), Hokage um dia (libera o Hardcore da Jornada), Lenda de Konoha, Ninguém fica para trás, Gama-chan gordo, Colecionador, Caminho próprio (vencer uma run do Caminho Ninja), Chama do clã (libera o Uchiha), Olhos abertos (libera o Hyuuga), Herdeiro do clã, Destino quebrado, Mais uma volta, Treino sem fim e Vontade inabalável (vencer os ciclos 2, 3 e 5 do modo infinito) e duas secretas.
- Como a Jornada tem progressão permanente, é o modo que mais justifica contas para sincronizar o perfil ([decisoes.md](../decisoes.md), item 8).

## Simulação

`npm run sim:jornada -- [runs] [seed] [ciclos]`: um bot joga a História e o Caminho Ninja (Comum, prodígio, Uchiha, Hyuuga) por dificuldade e mostra a taxa de vitória e onde as runs param. O bot joga pior que um humano (não monta o moveset, compra sem planejar); antes de agir, usa uma ativa grátis como a IA dos suportes. A linha do Comum sorteia o elemento (e ganha a relíquia do sorteio); a do prodígio escolhe direto o Comum sem elemento. Com `ciclos` > 0, os vencedores do Caminho Ninja seguem no modo infinito até cair (no máximo esse número de ciclos) e sai a curva: a fração das runs que venceu cada ciclo, a média de ciclos vencidos e o nível final.

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
