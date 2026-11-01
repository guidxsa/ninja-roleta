# Perfil

O que fica salvo no aparelho entre as runs: conquistas, Livro Bingo e estatísticas por origem. A run continua só em memória (F5 reseta); o perfil vive no `localStorage` (`profile_v1`), ao lado do histórico de runs ([campanha.md](campanha.md#histórico-de-runs)).

A tela **Perfil** (botão 📜 no cabeçalho) tem quatro abas: Histórico, Conquistas, Livro Bingo e Origens.

## Regras gerais

- Runs do Laboratório (`?teste`) não contam para nada do perfil.
- As conquistas são checadas ao começar a campanha (depois do sorteio), depois de cada evento pré-vilão, depois de cada luta e no fim da run. Cada conquista nova aparece num aviso rápido.
- Na primeira abertura do jogo com o perfil, os marcos que o histórico já prova (vitórias por origem, dificuldade, jinchuuriki, ter passado do Mizuki) são liberados sem aviso.
- Conquistas escondidas aparecem como "???" até alguém conseguir.

## Conquistas

### Marcos

| Conquista | Condição |
|---|---|
| Genin | Vencer o Mizuki |
| Chunin | Vencer as 3 lutas do exame |
| Ninja da Folha | Vencer a campanha |
| Despertar | Chegar ao nível 7 |
| Sem medo do escuro | Vencer no Difícil (ou no Hardcore) |
| Lenda | Vencer no Hardcore |
| Monstro interno | Vencer como jinchuuriki |
| Uma por origem (11) | Vencer com cada origem |
| Mestre dos clãs | Vencer com as 11 origens (mostra o progresso) |

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
| Reprovado, mas vivo (escondida) | Perder as 3 lutas do exame e vencer a campanha |

### Segredos (todos escondidos)

| Conquista | Condição |
|---|---|
| Uzumaki Naruto | Sortear Uzumaki + jinchuuriki + vento |
| Dattebayo! | Vencer a campanha com essa origem |
| Que problemático | Perder no jokenpô sendo Nara |
| Juventude explosiva | Abrir o 4º portão como prodígio |
| Gai-sensei aprovaria | Vencer o Orochimaru como prodígio, abrindo um portão na luta |
| Borboleta | Vencer uma luta como Akimichi depois da pílula vermelha |
| O destino não está escrito | Vencer uma luta como Hyuuga com 5% do HP ou menos |
| Bom de ouvido | Como Yamanaka, fazer o vilão se ferir 3 vezes na mesma luta |
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

Dano sofrido conta golpes, disputas, queimadura, veneno e autoferimento. Os segredos ligados à reforma elemental e ao Senju (ver "Mudanças de design pendentes" no `CLAUDE.md`) entram junto com eles.

## Livro Bingo

Um cartão por vilão (inclusive os rivais do exame), na ordem dos dados. Quem nunca foi enfrentado aparece como silhueta. Para cada um: lutas, vitórias, quantas vezes derrotou o jogador (perder no exame também conta), o maior golpe do jogador nele e o maior golpe dele no jogador.

## Origens

Calculado do histórico de runs, sem guardar nada a mais: por origem, runs terminadas (sem re-roll e sem a em andamento), vitórias, taxa de vitória e a etapa mais longe.
