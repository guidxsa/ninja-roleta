# Jornada

> **Rascunho, não implementado.** Design do segundo modo de jogo, combinado com o usuário em 01/11/2026. Nada aqui está no código ainda; as pendências estão no fim.

O jogo passa a ter dois modos:

- **Roleta**: o modo atual ([campanha.md](campanha.md)), enxuto e rápido, para sessões curtas.
- **Jornada**: um roguelike de mapa, mais lento e com mais controle. Mais confrontos, subtramas, eventos, habilidades e builds.

## Pilares

- **Rejogabilidade**: cada run traz combinações e experiências diferentes.
- **Identidade dos personagens**: cada protagonista tem uma experiência própria.
- **Construção de builds**: árvores de talentos e sinergias permitem estratégias variadas.
- **A equipe importa**: os suportes têm peso estratégico.
- **Descoberta**: desbloqueios por conquista incentivam explorar e experimentar.
- **Decisões significativas**: caminhos, recrutamentos e eventos trazem escolhas interessantes.
- **Combate acessível, mas profundo**: o protagonista concentra as decisões; os suportes complementam.
- **O RNG continua no centro**: técnicas com custo de chakra, acerto e dano por roleta influenciada pelos status, como no Roleta ([fundamentos.md](fundamentos.md)). Não é um jogo de cartas.

## Estrutura da run

- A run é dividida em **estágios**, um por arco da história. Cada estágio termina num **chefe fixo**, o mesmo em qualquer caminho (ex.: Zabuza, Gaara, Orochimaru; o exame chunin vira uma parada especial).
- Cada estágio é um **mapa** com 3 começos e caminhos que às vezes seguem retos e às vezes se ramificam. Depois de cada parada, o jogador escolhe a próxima entre as ligadas à atual.
- O caminho feito fica marcado, e o mapa pode ser aberto a qualquer momento, com uma legenda dos tipos de parada.
- Vencer o chefe: escolher **1 entre 3 recompensas lendárias** e seguir para o próximo estágio.
- **Moeda (ryō)**: ganha em lutas e eventos, gasta no mercador. Números a definir em `balance`.
- A run **fica salva no aparelho** (`localStorage`) a cada parada: uma Jornada dura mais que uma sessão. É uma exceção ao "F5 reseta", só neste modo.

### Paradas

Os nomes com sabor ninja ainda estão a definir.

| Parada | O que acontece |
|---|---|
| Desconhecido | Sorteia entre luta comum, evento (subtramas, encontros) ou outra parada |
| Inimigo | Luta contra inimigo comum, recompensa padrão |
| Elite | Semichefe, mais forte, recompensa boa ou ótima |
| Mercador | Gastar ryō em itens, técnicas e melhorias |
| Tesouro | Recompensa boa ou ótima; um por rota, perto do meio do mapa |
| Descanso | Escolher entre recuperar HP/chakra ou melhorar algo (status ou técnica) |
| Chefe | Fim do estágio; 3 lendárias à escolha |

## Equipe

- **1 protagonista** controlado pelo jogador e **2 suportes** automáticos. Exemplo inicial: Naruto, com Sasuke e Sakura de suporte.
- **Primeira versão**: a luta continua 1 contra 1, e os suportes entram como **companheiros** que agem sozinhos depois do jogador, como o cão do Inuzuka (passiva Dupla, [origens.md](origens.md)), sem ser alvo. O combate de equipe completo (vários lutadores por lado) vem depois, porque o combate de hoje é todo 1 contra 1.
- Cada suporte tem um comportamento próprio, que pode ser configurável:

| Suporte | Comportamento |
|---|---|
| Sakura | Cura quem está com pouca vida (curandeira, combatente ou equilibrada) |
| Sasuke | Prioriza o inimigo mais perigoso |
| Shikamaru | Controle e neutralização |
| Hinata | Ataca inimigos vulneráveis |
| Rock Lee | Dano físico |

- **Recrutar e substituir**: novos personagens aparecem em eventos e missões; trocar um suporte é uma decisão estratégica.
- Futuro: habilidades do protagonista que comandam os suportes em momentos pontuais, sem virar comando de três personagens por turno.

## Personagens

- **Protagonistas são personagens canônicos**, cada um com origem predefinida, status próprios, habilidades características e **árvore de talentos exclusiva** com especializações. Exemplo, Naruto: Clones (mais ações e combos), Rasengan (dano concentrado), Modo Sennin (resistência e energia).
- A **árvore de talentos é só da Jornada**. No Roleta, os kits dos níveis 4 e 7 chegam fixos.
- **Suportes** têm progressão simples e padronizada: status, habilidades e especialidade próprios, mas sem árvore.

## Sinergias

Algumas combinações liberam ataques em dupla ou bônus, para a equipe não ser só "os mais fortes":

- Naruto + Sasuke: ataques combinados.
- Naruto + Hinata: habilidades de dupla.
- Ino + Shikamaru + Choji: formação Ino-Shika-Cho.
- Jiraiya + Tsunade + Orochimaru: os Sannin.

Os suportes também podem mudar as opções de build do protagonista.

## Desbloqueios e conquistas

A Jornada tem **conquistas próprias**, separadas das do Roleta ([perfil.md](perfil.md)). Novos protagonistas se desbloqueiam por condições ligadas à personalidade e à história de cada um:

| Personagem | Condição (exemplos) |
|---|---|
| Naruto | Inicial |
| Sasuke | Concluir uma missão específica com o Naruto |
| Shikamaru | Vencer um chefe usando habilidades de controle |
| Rock Lee | Vencer uma run sem usar ninjutsu |
| Gaara | Concluir um desafio especial de defesa |

Como a Jornada tem progressão permanente, é o modo que mais justifica contas para sincronizar o perfil (fase 3 do roteiro no CLAUDE.md).

## Camadas de progressão

1. **Permanente**: protagonistas, suportes, conteúdos e conquistas desbloqueados.
2. **Do protagonista, na run**: árvore de talentos, especializações, build.
3. **Da equipe, na run**: recrutamento, troca de suportes, melhorias temporárias, sinergias.

## Interface

- Tela de batalha dedicada, só na Jornada: cenário, vilão em cima, jogador embaixo, menu de ações e log curto. Animações a partir dos eventos de combate (o core já registra cada evento da luta), respeitando o modo instantâneo.
- Depois: sprites originais dos protagonistas, suportes e vilões (poses parado, ataque e dano), com o retrato SVG atual como reserva quando faltar imagem.

## Pendências

- Evolução dos suportes: níveis individuais ou não?
- Como calcular as prioridades do comportamento automático.
- Equipamentos e itens próprios da Jornada.
- Economia da run: ganhos e preços.
- O que é permanente e o que reinicia a cada run.
- Chefes, elites e eventos especiais de cada estágio.
- Quando entra o combate de equipe completo.
- Nomes das paradas.
