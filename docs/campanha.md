# Campanha

Estrutura de uma run: ordem dos confrontos, eventos entre eles, encontros, invocações, exame chunin, dificuldade e histórico.

## Ordem

1. Mizuki
2. Haku e Zabuza (bloco de duas lutas)
3. Exame chunin
4. Gaara
5. Quarteto do Som (bloco de quatro lutas)
6. Kabuto
7. Orochimaru (chefe final)

- Toda luta começa com o jogador restaurado (ver [fundamentos.md](fundamentos.md#restauração)), inclusive dentro dos blocos.
- Fichas dos vilões: [viloes.md](viloes.md).
- Combate em grupo fica fora do escopo inicial.

## Roleta pré-vilão

Antes de cada vilão (uma vez antes de cada bloco) gira uma roleta de eventos. Não gira antes das lutas do exame.

| Peso | Evento | Efeito |
|---|---|---|
| 10 | Encontro com invocações | Ver "Invocações". |
| 10 | Ajudou uma velhinha e se atrasou | Desvantagem de ação: o vilão ataca primeiro na próxima luta. |
| 10 | Ramen muito bom | Vantagem de ação: o jogador ataca primeiro na próxima luta. |
| 10 | Encontro com a Akatsuki | Ver "Akatsuki". |
| 20 | Treino | +1 estágio de status. |
| 20 | Jokenpô com um companheiro | Ver "Jokenpô". |
| 10 | Achou um item | Gira a roleta de itens ([itens.md](itens.md)). |
| 10 | Encontro com guru | Ver "Guru". |

- Vantagem e desvantagem de ação substituem a roleta de iniciativa na próxima luta contra vilão (no bloco Haku e Zabuza, só na primeira; o exame não consome).
- Pesos fixos nesta versão.

### Jokenpô

O jogador escolhe pedra, papel ou tesoura; o companheiro sorteia (1/3 cada).

| Resultado | Efeito |
|---|---|
| Vitória | +2 estágios de status |
| Empate | Nada |
| Derrota | Desvantagem de ação na próxima luta |

### Akatsuki

| Situação | 70% | 30% |
|---|---|---|
| Jinchuuriki | É caçado: perde 1 Vontade do Fogo | Não é percebido |
| Não jinchuuriki | Assiste à luta deles de longe: +5% de chance de crítico | Se mete onde não devia: perde 1 Vontade do Fogo |

Nunca causa game over. Sem Vontade do Fogo para perder, começa a próxima luta com metade do HP e do chakra.

### Guru

| Chance | Resultado |
|---|---|
| 30% | Charlatão: desvantagem de ação na próxima luta. |
| 50% | Ensina uma técnica ofensiva adequada (pool da "nova técnica", sem o médico). |
| 20% | Ensina o **Foco**: uma vez por luta, um botão grátis (não gasta o turno) deixa o próximo ataque com crítico garantido. |

Sem técnica para ensinar, ou já sabendo o Foco, a fatia correspondente some.

## Invocações

O encontro sorteia um animal, que passa a acompanhar o jogador como **passiva** em todas as lutas, sem custo de chakra. Se já tiver um, o animal sobe de nível (não muda). "Por nível" conta a partir do nível 2.

| Animal | Papel | Efeito | Por nível |
|---|---|---|---|
| Sapo | Dano contra chefes | Penetração de 25% nas defesas do alvo | +10% de penetração |
| Cobra | Veneno | Acerto em alvo não envenenado aplica envenenamento (bônus inicial 2) | +2 de bônus inicial |
| Lesma | Sustentação | Cura 3% do HP máximo no início de cada rodada | +1% de cura e +10% na chance de curar envenenamento |

Regras do veneno em [efeitos.md](efeitos.md#envenenamento). A penetração soma com outras fontes até o teto de 60%.

## Exame chunin

- Três lutas em sequência contra rivais genin, de dificuldade crescente. Toda luta começa restaurada.
- **Não causa game over e não consome a Vontade do Fogo.** Perder só reduz o desempenho.
- Cada vitória dá 60 de XP.
- O número de vitórias define a recompensa final:

| Vitórias | Recompensa |
|---|---|
| 0 | Nenhuma |
| 1 | Roleta de recompensa comum |
| 2 | Roleta de recompensa rara |
| 3 | Roleta de recompensa lendária (gira 3, escolhe 1) |

- Futuro: provas sem combate ligadas a um status de inteligência.

## Dificuldade

Escolhida na tela de origem; fica salva como preferência do aparelho e no histórico.

| Dificuldade | Força dos vilões (HP, dano, defesas) |
|---|---|
| Fácil | 85% |
| Médio | 100% |
| Difícil | 115% |
| Hardcore | 125% + passivas hardcore |

- O hardcore só é liberado depois de uma vitória no difícil (consulta o histórico).
- A dificuldade também define o ganho por nível ([progressao.md](progressao.md)).

## Histórico de runs

- `localStorage`, chave versionada (`runs_v1`), separada do estado da campanha (que vive só em memória; F5 reseta a run).
- Registro: data e hora, origem (linhagem, afinidade, jinchuuriki), dificuldade, resultado (vitória, derrota, abandonada ou re-roll), até qual vilão chegou, nível final e Vontades do Fogo usadas.
- Ao iniciar a run, grava um registro "em andamento" e atualiza a cada vilão. Ao abrir a página, qualquer registro "em andamento" vira "abandonada".
- Re-rolls ficam ocultos por padrão na tela de histórico. Limite: últimas 100 runs.