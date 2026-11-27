# Perfil

O que fica salvo no aparelho entre as runs: conquistas, Livro Bingo, estatísticas por origem, coleção de relíquias, recorde do modo infinito e nome do jogador. A run continua só em memória (F5 reseta); o perfil vive no `localStorage` (`profile_v1`), ao lado do histórico de runs ([campanha.md](../roleta/campanha.md#histórico-de-runs)).

A tela **Registro ninja** (o perfil; botão do livro no cabeçalho, a barra lateral do PC, a barra inferior do Portão da Vila ou a faixa de Conquistas) abre na área principal, uma seção por vez, cada uma com o seu selo: Histórico (歴, com os filtros Geral, Origens e Dificuldade), Conquistas (功), Livro Bingo (手配) e Relíquias (宝, a coleção da Jornada: [reliquias.md](../jornada/reliquias.md#coleção)). No Livro Bingo, quem já foi derrotado ganha o carimbo 勝; quem nunca apareceu fica na sombra com 謎.

**Dados que não deu para ler** (v0.60.0): se o histórico ou o perfil estiverem corrompidos, o jogo segue com eles vazios, mas antes guarda o conteúdo em `runs_v1_backup`, `jornada_runs_v1_backup` ou `profile_v1_backup` (a primeira cópia fica), para a gravação seguinte não apagar tudo sem volta. Uma linha estragada do histórico sai sozinha, sem levar as outras.

## Nome do jogador

- Perguntado **uma vez**, na primeira entrada no Roleta ou no Caminho Ninja. Dá para pular. Na História, o protagonista continua sendo o Naruto.
- Fica no perfil (`playerName`), com até 16 caracteres, e dá para mudar no topo do Registro ninja. Sem o campo, ainda não foi perguntado; vazio, a pessoa preferiu não dizer. É só cosmético e, no futuro, pode vir do login (Fase 3 do roteiro).
- **Roleta**: aparece no painel do jogador, com a origem embaixo, e no título da ficha.
- **Caminho Ninja**: é o nome do protagonista. Comum e prodígio usam o nome; Uchiha e Hyuuga, "Nome Uchiha" e "Nome Hyuuga".

## Avatar

- O avatar e o nome ficam no topo da Ficha do ninja, sempre à vista (também na faixa do celular). Tocar no avatar abre a escolha; tocar no nome vira um campo no lugar (Enter ou sair grava, Esc cancela). Um lápis ao lado de cada um mostra que é editável. O “Registro do ninja” recolhível guarda só os números.
- Dá para escolher entre os personagens **já liberados ou vistos** (`avatarChoices`, `src/core/avatar.ts`), só na forma base (sem marca da maldição, Sharingan ou transformação):
  - o ninja comum, sempre;
  - cada origem jogada no Arcade (pelo histórico) ou com a vitória registrada (`win_<linhagem>`, que fica mesmo depois de a run sair do histórico);
  - Uchiha (Chama do clã) e Hyuuga (Olhos abertos) pelas conquistas da Jornada, e o visual do Sasuke (Mil pássaros) para quem já tinha;
  - o **elenco de cada arco** da História, pela conquista do arco (`ARC_CAST`): Sino na mão libera o Time 7 (Naruto, Sasuke, Sakura, Kakashi), Iruka e Mizuki; Ponte do Naruto, os Irmãos Demônio, Zabuza e Haku; Coração de chunin, os genins do Exame (Shikamaru, Chōji, Kiba, Rock Lee, Neji), o trio do Som, Kabuto, Gaara e Orochimaru; Vale do Fim, Jiraiya, Tsunade e os Quatro do Som com Kimimaro;
  - os **vilões já enfrentados no Arcade** (Livro Bingo), pelo retrato de cada um;
  - quem já **lutou na Jornada**, dos dois lados (`jornadaAllies` e `jornadaFoes`), se estiver no elenco acima: lutar com a Sakura ou contra o Zabuza libera o retrato sem esperar a conquista do arco. Os ninjas genéricos e as transformações não entram.
- A escolha agrupa Origens, Aliados e Vilões, com o total liberado de cada grupo. O bloqueado aparece em silhueta, com a dica de onde se libera (`avatarCatalog`).
- Na Ficha, o avatar mostra o retrato inteiro, com o fundo original da arte, num quadro de tinta. O recorte de `AVATAR_CUTS` (`prototype/art.ts`) só desenha a silhueta do avatar bloqueado na escolha (sem recorte próprio, a silhueta genérica), conferido no cenário “Ficha com cada avatar” do UI Lab.
- Fica no perfil (`avatar`) como a chave do retrato (`ninja:<chave>`; a imagem vem de img/ninja ou img/viloes). Se o escolhido deixar de estar liberado, vale o padrão.

## Recorde do modo infinito

- **Roleta** (v0.46.0): o perfil guarda o ciclo alcançado e as lutas vencidas na melhor run (`roleta`); ciclo maior passa, no mesmo ciclo mais lutas. A tela final mostra "Recorde!" quando bate ([roleta/run.md](../roleta/run.md#modo-infinito)). O "Melhor ciclo" da Ficha do ninja vem desse recorde (e do histórico, para quem jogou antes dele).
- **Hardcore do Roleta liberado** (`hardcoreUnlocked`, v0.60.0): fica no perfil. Antes era recalculado do histórico, que guarda só as últimas 100 runs, e a vitória no Difícil que liberou podia sair dele e travar o Hardcore de novo.

- O Caminho Ninja vencido pode seguir de ciclo ([run.md](../jornada/run.md#modo-infinito)). O perfil guarda até onde uma run chegou (`jornada.generic`): o ciclo e o estágio (contando do 1) e se venceu esse ciclo. Ciclo maior passa; no mesmo ciclo, vencer passa qualquer estágio; senão, o estágio maior.
- Grava no fim da run (vitória ou queda) e quando uma run salva que já andou é apagada por uma nova. Sem o campo, nunca registrou.
- Aparece no cartão do Caminho Ninja, na tela de início da Jornada, a partir de um ciclo vencido; a tela final mostra "Recorde!" quando bate.

## Regras gerais

- As conquistas são checadas ao começar a campanha (depois do sorteio), depois de cada evento pré-vilão, depois de cada luta e no fim da run. Cada conquista nova aparece num aviso rápido.
- Na primeira abertura do jogo com o perfil, os marcos que o histórico já prova (vitórias por origem, dificuldade, jinchuuriki, ter passado do Mizuki) são liberados sem aviso.
- Conquistas escondidas aparecem como "???" até alguém conseguir.
- **Ícones** (v0.63.0): cada conquista liberada mostra um ícone próprio no selo dourado (desenhos do jogo, `prototype/achievementIcons.ts`); as vitórias por origem usam o símbolo do clã. Bloqueada, mostra o cadeado.
- **Clássicas** (v0.45.0): as que dependiam de mecânica que saiu do Roleta (Enganado pelo guru, Copiador, Juventude dos portões, Borboleta, Insetos famintos, Domador de bijuu, Princesa lesma) não saem mais. Quem já tem continua tendo; para os outros, não aparecem nem contam no total.

## Categorias

O perfil é um só para os dois modos. A aba Conquistas mostra as do Roleta (Marcos, Sorte e azar, Estilo, Segredos) e, por último, a categoria **Jornada** ([jornada/README.md](../jornada/README.md#perfil-e-conquistas)). As conquistas da Jornada são checadas a cada parada e no fim da run, e algumas liberam coisas de vez (a Ōdama Rasengan, o Hardcore da Jornada).

## Conquistas

### Marcos

| Conquista | Condição |
|---|---|
| Genin | Vencer um vilão genin (até a v0.45.0: o Mizuki) |
| Chunin | *Clássica desde a v0.46.0 (o exame saiu do Roleta)*: vencer as 3 lutas do exame |
| Ninja da Folha | Vencer a run (o chefe do 1º ciclo) |
| Sem descanso | No modo infinito do Roleta, vencer o ciclo 2 |
| Roda da fortuna | No modo infinito do Roleta, vencer o ciclo 3 |
| Lenda da roleta | No modo infinito do Roleta, vencer o ciclo 5 |
| Despertar | Chegar ao nível 7 |
| Sem medo do escuro | Vencer no Difícil (ou no Hardcore) |
| Lenda | Vencer no Hardcore |
| Monstro interno | Vencer como jinchuuriki |
| Uma por origem (8) | Vencer com cada origem que sai no Roleta; Yamanaka, Nara e Aburame viraram clássicas (v0.52.0) |
| Mestre dos clãs | Vencer com as 8 origens (mostra o progresso) |

### Sorte e azar

| Conquista | Condição |
|---|---|
| Por um fio | Vencer uma luta com 5% do HP ou menos |
| Pé frio | Perder o jokenpô 3 vezes na mesma run |
| Sorte de principiante | Ganhar o jokenpô 3 vezes na mesma run |
| Filho da velhinha | Se atrasar 2 vezes na mesma run |
| Caí no conto | Cair no guru charlatão |
| Visto pela Akatsuki | Perder uma Vontade do Fogo para a Akatsuki |
| Golpe do destino | Crítico de 50 de dano ou mais |
| Amigo dos bichos | Invocação no nível 3 |
| Morreu na praia (escondida) | Cair para o Orochimaru |
| Que vergonha (escondida) | Cair para o Mizuki |

### Estilo

| Conquista | Condição |
|---|---|
| Vontade inabalável | Vencer sem usar a Vontade do Fogo |
| Mãos vazias | Vencer sem usar itens |
| Intocável | Vencer o Gaara, o Kabuto ou o Orochimaru sem levar dano |
| Pura força | Vencer como prodígio sem abrir os portões |
| Ladrão de técnicas | Copiar 3 técnicas com o Sharingan na mesma run |
| Reprovado, mas vivo (escondida) | *Clássica desde a v0.46.0*: perder as 3 lutas do exame e vencer a campanha |

### Segredos (todos escondidos)

| Conquista | Condição |
|---|---|
| Uzumaki Naruto | Sortear Uzumaki + jinchuuriki + vento |
| Dattebayo! | Vencer a campanha com essa origem |
| Que problemático | Perder no jokenpô sendo Nara (clássica desde a v0.52.0) |
| Juventude explosiva | Abrir o 4º portão como prodígio |
| Gai-sensei aprovaria | Vencer o Orochimaru como prodígio, abrindo um portão na luta |
| Borboleta | Vencer uma luta como Akimichi depois da pílula vermelha |
| O destino não está escrito | Vencer uma luta como Hyuuga com 5% do HP ou menos |
| Bom de ouvido | Como Yamanaka, fazer o vilão se ferir 3 vezes na mesma luta (clássica desde a v0.52.0) |
| Fome de insetos | Derrubar um vilão com o Devorar (último dano da luta) |
| Ichiraku de novo | Evento do ramen 3 vezes na mesma run |
| Ero-sennin | Sapo no nível 3 |
| Quero esse corpo | Uchiha com a invocação de cobra |
| Hokage | Vencer o Hardcore com a origem Comum |
| Segundo Hokage | Vencer como Senju com água como elemento principal |
| Princesa das Lesmas | Senju com a invocação de lesma e a Palma Curativa |
| Vingador | Uchiha com raio |
| Espelhos de gelo | Vencer o Haku com o Elemento Gelo |
| Areia que protege | Elemento Areia e jinchuuriki |
| Deus dos Shinobi | Vencer a campanha como Senju com o Elemento Madeira |
| Domador de bijuu | Desfazer o manto do Gaara com a Madeira |
| Demônio da Névoa | Cair para o Zabuza 5 vezes (somando todas as runs) |

Dano sofrido conta golpes, disputas, queimadura, veneno e autoferimento. Os segredos ligados à reforma elemental e ao Senju (ver [registro.md](../registro.md)) entram junto com eles.

## Histórico da Jornada

- `localStorage`, chave própria (`jornada_runs_v1`), separada do histórico do Arcade (`runs_v1`): as runs da Jornada não entram nos recordes por origem, no melhor ciclo, no desempenho por dificuldade nem no texto de compartilhar. Mesmo limite: as últimas 100 runs.
- Grava no fim da run, nos dois modos (História e Caminho Ninja), e quando uma run salva que já andou é trocada por uma nova (como abandonada). O Caminho Ninja regrava o mesmo registro a cada ciclo; uma run que venceu um ciclo continua vencida se cair depois, como no Arcade.
- Registro (`jornadaRunRecord`, `src/state/jornadaRuns.ts`): modo, protagonista e classe, perspectiva da História, elemento (e o segundo, do Uchiha), dificuldade, resultado, ciclo, estágio e parada alcançados, nível, relíquias, aliados caídos, lutas e vitórias, maior golpe e as datas.
- As runs jogadas antes deste histórico não aparecem: não ficaram salvas. O recorde do Caminho Ninja continua valendo.

## Livro Bingo

Um cartão por inimigo, em três seções: **Arcade** (os vilões do Roleta, por categoria), **História** (os inimigos da Jornada, por arco) e **Campanha** (os do Caminho Ninja, por estágio). O mesmo personagem nos dois modos tem uma entrada em cada seção, com os números de cada um. Quem nunca foi enfrentado aparece como silhueta, com 謎. Para cada um: lutas, vitórias, quantas vezes derrotou o jogador (perder no exame, ou gastar uma Vontade do Fogo na Jornada, também conta), o maior golpe do jogador nele e o maior golpe dele no jogador.

- **Arcade**: `villains`, gravado no fim de cada luta do Roleta.
- **Jornada** (`jornadaFoes`): gravado no fim de cada luta (`foeFights`, `src/core/jornada/foes.ts`). Vários inimigos do mesmo tipo na luta (os capangas do Gatō) contam como uma luta só; a lição do sino conta como vitória.
- Tocar num inimigo já visto abre a **ficha**: retrato grande, nome, uma descrição curta, as técnicas (tipo, dano e custo na dica), os atributos, a passiva e os números do jogador contra ele. O fundo segue o arco (ou a categoria, no Arcade) e a moldura sobe de grau com o nível: comum, elite e chefe, com o carimbo de procurado ([visual.md](../visual.md#telas-no-estilo-novo)).

## Origens

Calculado do histórico de runs, sem guardar nada a mais: por origem, runs terminadas (sem re-roll e sem a em andamento), vitórias, taxa de vitória e a etapa mais longe.
