# Jornada

> **Rascunho, não implementado.** Design do segundo modo de jogo, combinado com o usuário em 01/11/2026. Nada aqui está no código ainda; as pendências estão no fim.

O jogo passa a ter dois modos:

- **Roleta**: o modo atual ([campanha.md](campanha.md)), que vai ficar enxuto: run mais curta e um combate refeito, extremamente simples e bem mais na sorte.
- **Jornada**: um roguelike de mapa, mais lento e com mais controle. Herda o combate atual, com as fórmulas, técnicas, efeitos e números de `balance`, adaptado para equipes. Mais confrontos, subtramas, eventos e builds.

## Pilares

- **Rejogabilidade**: cada run traz combinações e experiências diferentes.
- **Construção de builds**: árvore de talentos, relíquias e moveset permitem estratégias variadas.
- **A equipe importa**: os suportes lutam, caem e precisam ser protegidos.
- **Descoberta**: classes, ramos da árvore e personalizações se liberam por condições e combinações.
- **Decisões significativas**: caminhos, eventos e recompensas trazem escolhas interessantes.
- **Sorte pesa menos**: o combate segue com os sorteios de hoje (iniciativa, acerto, dano, [fundamentos.md](fundamentos.md)), mas sem roleta na tela, só o resultado. Fora do combate, as recompensas são escolhas ou minijogos, não giros.

## Modos de run

- **Run canônica do Naruto**: liberada desde o início. Protagonista Naruto, com Sasuke e Sakura fixos de suporte. Segue os arcos e chefes da história.
- **Runs genéricas**: protagonista de uma classe de origem (ver "Classes"). Encontros diferentes dos da canônica, com a mesma dificuldade, coerentes com o universo. Os suportes são ninjas das classes genéricas (no começo, 2 Comuns).
- Um personagem nunca é protagonista e suporte na mesma run.

## Estrutura da run

- A run é dividida em **estágios**. Na canônica, um por arco da história, cada um com um **chefe fixo** no fim, o mesmo em qualquer caminho (ex.: Zabuza, Gaara, Orochimaru; o exame chunin vira uma parada especial).
- Cada estágio é um **mapa** com 3 começos e caminhos que às vezes seguem retos e às vezes se ramificam. Depois de cada parada, o jogador escolhe a próxima entre as ligadas à atual.
- O caminho feito fica marcado, e o mapa pode ser aberto a qualquer momento, com uma legenda dos tipos de parada.
- Vencer o chefe: escolher **1 entre 3 relíquias lendárias** e seguir para o próximo estágio.
- **Moeda (ryō)**: ganha em lutas e eventos, gasta no mercador. Números a definir em `balance`.
- **Dificuldade**: as 4 do Roleta ([campanha.md](campanha.md#dificuldade)). A Vontade do Fogo só existe no Fácil (fora isso, só como relíquia).
- A run **fica salva no aparelho** (`localStorage`) a cada parada: uma Jornada dura mais que uma sessão. É uma exceção ao "F5 reseta", só neste modo.

### Paradas

Os nomes com sabor ninja ainda estão a definir.

| Parada | O que acontece |
|---|---|
| Desconhecido | Sorteia entre luta comum, evento (subtramas, encontros) ou outra parada |
| Inimigo | Luta contra inimigos comuns; recompensa padrão |
| Elite | Semichefe, mais forte; recompensa boa ou ótima |
| Mercador | Gastar ryō em relíquias, consumíveis e melhorias |
| Tesouro | Relíquia boa ou ótima; um por rota, perto do meio do mapa |
| Descanso | Escolher entre recuperar HP/chakra ou melhorar algo |
| Chefe | Fim do estágio; 3 relíquias lendárias à escolha |

### Eventos e recompensas interativas

- Eventos podem ser **condicionais** (dependem da classe, da equipe, de escolhas anteriores) e **encadeados** (uma escolha num estágio abre ou fecha eventos nos seguintes).
- Parte das recompensas vem de **minijogos** curtos, de um toque, em vez da roleta visual: jogo da memória, sequência de selos de mão, Jokenpô ([campanha.md](campanha.md#jokenpô)).

## Combate

- **Equipe contra equipe desde a primeira versão**: até 3 lutadores de cada lado, todos com HP, com escolha de alvo dos dois lados. Vilões podem ter seus próprios suportes.
- O jogador controla **só o protagonista**. Os suportes agem sozinhos, cada um com um comportamento próprio (ex.: curar quem está com pouca vida, priorizar o inimigo mais perigoso, controlar).
- **Quem cai pode ser levantado** com 50% do HP: por consumível (não gasta o turno) ou pela ação de ajudar (gasta o turno), feita pelo protagonista ou por outro suporte.
- **Protagonista caído é fim de luta**, mesmo com suportes de pé.
- **Moveset de 4 técnicas**, mais as ativas de classe numa área separada (Gênio, Portões, dōjutsu e afins). O moveset fica salvo entre as lutas; editar antes de uma luta é opcional.

## Classes e desbloqueios

As classes são as origens do Roleta ([origens.md](origens.md)), com um corte: cada classe é uma árvore de talentos inteira.

| Classe | Como libera |
|---|---|
| Comum | Inicial |
| Prodígio | Subclasse do Comum: o Comum que vem sem elementos |
| Uchiha | Vencer no Médio ou acima com um shinobi de fogo |
| Hyuuga | Vencer no Médio ou acima com o prodígio |

- **Easter eggs por combinação**: algumas combinações liberam personalização e ramos especiais da árvore. Ex.: Uchiha + raio + Chidori → personalização do Uchiha e um ramo ligado ao Sasuke.
- Os suportes genéricos precisam de uma **versão suporte** de cada classe: comportamento automático e progressão simples, sem árvore.

## Progressão

- **XP e nível** continuam ([progressao.md](progressao.md)). Os suportes sobem de nível junto com o protagonista.
- **Recompensa padrão de luta**: ryō e pontos de talento. Os pontos vêm das lutas e da subida de nível.
- **Árvore de talentos por classe**, que reinicia a cada run. Alguns ramos ficam liberados de vez por objetivos da conta (podem ou não ser conquistas).
- Material já pronto para as árvores: o kit do prodígio (Folha Furacão, Portões, Punho Bêbado, Lótus) e a Palma do Vácuo do Hyuuga.
- Sem bônus comprados entre runs, por enquanto.

## Relíquias

- Dão **vantagens passivas** para a run toda ou **recursos** (ex.: 3 kits de HP e chakra, uma Vontade do Fogo).
- Têm **tiers** de raridade.
- Vêm de tesouro, elite, chefe (3 lendárias à escolha), mercador e eventos. Quando não são uma recompensa específica de evento, saem de um sorteio escondido, pela raridade.
- Os itens permanentes do Roleta, como os Pesos de treino ([itens.md](itens.md)), viram relíquias. A bolsa de consumíveis continua à parte.

## Perfil e conquistas

- O perfil é um só para os dois modos ([perfil.md](perfil.md)), com as conquistas separadas por categoria (Roleta, Jornada).
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
