# Perfil

O que fica salvo no aparelho entre as runs: conquistas, Livro Bingo, estatísticas por origem, coleção de relíquias, recorde do modo infinito e nome do jogador. A run continua só em memória (F5 reseta); o perfil vive no `localStorage` (`profile_v1`), ao lado do histórico de runs ([campanha.md](../roleta/campanha.md#histórico-de-runs)).

A tela **Registro ninja** (o perfil; botão do livro no cabeçalho, a barra inferior do Portão da Vila ou a faixa de Conquistas) tem cinco abas, cada uma com o seu selo: Histórico (歴), Conquistas (功), Livro Bingo (手配), Origens (族) e Relíquias (宝, a coleção da Jornada: [reliquias.md](../jornada/reliquias.md#coleção)). No Livro Bingo, quem já foi derrotado ganha o carimbo 勝; quem nunca apareceu fica na sombra com 謎.

## Nome do jogador

- Perguntado **uma vez**, na primeira entrada no Roleta ou no Caminho Ninja. Dá para pular; o Laboratório não pergunta. Na História, o protagonista continua sendo o Naruto.
- Fica no perfil (`playerName`), com até 16 caracteres, e dá para mudar no topo do Registro ninja. Sem o campo, ainda não foi perguntado; vazio, a pessoa preferiu não dizer. É só cosmético e, no futuro, pode vir do login (Fase 3 do roteiro).
- **Roleta**: aparece no painel do jogador, com a origem embaixo, e no título da ficha.
- **Caminho Ninja**: é o nome do protagonista. Comum e prodígio usam o nome; Uchiha e Hyuuga, "Nome Uchiha" e "Nome Hyuuga".

## Recorde do modo infinito

- **Roleta** (v0.46.0): o perfil guarda o ciclo alcançado e as lutas vencidas na melhor run (`roleta`); ciclo maior passa, no mesmo ciclo mais lutas. A tela final mostra "Recorde!" quando bate ([roleta/run.md](../roleta/run.md#modo-infinito)).

- O Caminho Ninja vencido pode seguir de ciclo ([run.md](../jornada/run.md#modo-infinito)). O perfil guarda até onde uma run chegou (`jornada.generic`): o ciclo e o estágio (contando do 1) e se venceu esse ciclo. Ciclo maior passa; no mesmo ciclo, vencer passa qualquer estágio; senão, o estágio maior.
- Grava no fim da run (vitória ou queda) e quando uma run salva que já andou é apagada por uma nova. Sem o campo, nunca registrou.
- Aparece no cartão do Caminho Ninja, na tela de início da Jornada, a partir de um ciclo vencido; a tela final mostra "Recorde!" quando bate.

## Regras gerais

- Runs do Laboratório (`?teste`) não contam para nada do perfil.
- As conquistas são checadas ao começar a campanha (depois do sorteio), depois de cada evento pré-vilão, depois de cada luta e no fim da run. Cada conquista nova aparece num aviso rápido.
- Na primeira abertura do jogo com o perfil, os marcos que o histórico já prova (vitórias por origem, dificuldade, jinchuuriki, ter passado do Mizuki) são liberados sem aviso.
- Conquistas escondidas aparecem como "???" até alguém conseguir.
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

## Livro Bingo

Um cartão por vilão (inclusive os rivais do exame), na ordem dos dados. Quem nunca foi enfrentado aparece como silhueta. Para cada um: lutas, vitórias, quantas vezes derrotou o jogador (perder no exame também conta), o maior golpe do jogador nele e o maior golpe dele no jogador.

## Origens

Calculado do histórico de runs, sem guardar nada a mais: por origem, runs terminadas (sem re-roll e sem a em andamento), vitórias, taxa de vitória e a etapa mais longe.
