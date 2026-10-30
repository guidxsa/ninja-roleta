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

- HP e chakra seguem de uma luta para a outra, inclusive dentro dos blocos. Cada vitória devolve 25% do HP e do chakra máximos; só restauram tudo ao subir de nível, ao fim do exame chunin e pela Vontade do Fogo (ver [fundamentos.md](fundamentos.md#restauração)).
- Fichas dos vilões: [viloes.md](viloes.md).
- Um bloco com vários vilões (Haku e Zabuza, Quarteto do Som) conta como **um grupo**: a roleta de recompensa só gira depois do confronto final (ver [itens.md](itens.md#raridade-por-confronto)). XP e subida de nível continuam depois de cada luta.
- Combate em grupo fica fora do escopo inicial.

## Roleta pré-vilão

Antes de cada vilão (uma vez antes de cada bloco) gira uma roleta de eventos. Não gira antes das lutas do exame.

| Peso | Evento | Efeito |
|---|---|---|
| 10 | Encontro com invocações | Ver "Invocações". |
| 10 | Ajudou uma velhinha e se atrasou | Desvantagem de ação: o vilão ataca primeiro na próxima luta. |
| 10 | Ramen muito bom | Vantagem de ação: o jogador ataca primeiro na próxima luta. |
| 10 | Encontro com a Akatsuki | Ver "Akatsuki". |
| 20 | Treino | XP garantido e roleta de destaque. Ver "Treino". |
| 20 | Jokenpô com um companheiro | Ver "Jokenpô". |
| 10 | Achou um item | Gira a roleta de itens ([itens.md](itens.md)). |
| 10 | Encontro com guru | Ver "Guru". |
| 10 | Lição do clã | Ver "Lição do clã". |

- Vantagem e desvantagem de ação substituem a roleta de iniciativa na próxima luta contra vilão (no bloco Haku e Zabuza, só na primeira; o exame não consome).
- Pesos fixos nesta versão.

### Treino

1. **+60 de XP, garantido** (é um treino).
2. **Roleta de destaque**: "você se destacou em...". A fatia sorteada ganha **+3** (speed ganha +2).

| Fatia | Peso |
|---|---|
| Taijutsu | Valor atual de taijutsu |
| Ninjutsu | Valor atual de ninjutsu |
| Genjutsu | Valor atual de genjutsu |
| Resistência física | Valor atual |
| Resistência mental | Valor atual |
| Speed | Valor atual |

- Os pesos são os próprios status: quem já é bom em algo tende a se destacar nisso (um Hyuuga cai mais em taijutsu, um Yamanaka em genjutsu e resistência mental).
- Status zerado não entra (o prodígio nunca cai em ninjutsu ou genjutsu).

### Jokenpô

O jogador escolhe pedra, papel ou tesoura; o companheiro sorteia (1/3 cada).

| Resultado | Efeito |
|---|---|
| Vitória | +2 estágios de status |
| Empate | Nada |
| Derrota | Desvantagem de ação na próxima luta |

### Lição do clã

Alguém do clã ensina algo: **+40 de XP** e um bônus permanente com a cara da linhagem.

| Linhagem | Lição | Bônus |
|---|---|---|
| Comum | Treino até cair | +2 no maior status de ataque |
| Nara | Shogi com o seu pai | +2 de ninjutsu |
| Akimichi | Churrasco do clã | +15 de HP máximo |
| Yamanaka | Floricultura da família | +2 de genjutsu |
| Aburame | A colmeia cresce | +2 de ninjutsu |
| Inuzuka | Corrida com o cão | +1 de speed e +1 de taijutsu |
| Prodígio do taijutsu | Mil flexões ao pôr do sol | +2 de taijutsu |
| Uchiha | Lição no templo Naka | +2 de genjutsu |
| Hyuuga | Treino do Punho Gentil | +2 de taijutsu |
| Uzumaki | Pergaminho dos selos | +5 de chakra máximo |

Configuração: `balance.events.clanLesson`.

### Akatsuki

| Situação | 70% | 30% |
|---|---|---|
| Jinchuuriki | É caçado: perde 1 Vontade do Fogo | Não é percebido |
| Não jinchuuriki | Assiste à luta deles de longe: +5% de chance de crítico | Se mete onde não devia: perde 1 Vontade do Fogo |

Nunca causa game over. Sem Vontade do Fogo para perder, perde metade do HP e do chakra que tem (o HP nunca fica abaixo de 1).

### Guru

| Chance | Resultado |
|---|---|
| 20% | Charlatão: desvantagem de ação na próxima luta. |
| 80% | Ensina uma **premium** ([tecnicas.md](tecnicas.md#premium-guru)): técnicas e talentos sem elemento. |

O guru gira a roleta das premium, ponderada pelo perfil do jogador, **duas vezes sem repetir** e o jogador **escolhe 1** das duas (se só houver uma para ensinar, é ela):

| Premium | Peso |
|---|---|
| Rasengan | Ninjutsu |
| Palma Curativa | Chakra máximo ÷ 3 |
| Foco | Taijutsu |
| Mestre da Substituição | Speed |
| Clones das Sombras | Ninjutsu |
| Corpo Cintilante | Speed |

- Já tendo a premium sorteada, o guru ensina o próximo nível dela. Premium sem nível para subir, ou proibida pela origem (Rasengan, Palma Curativa e Clones das Sombras para o prodígio), some da roleta.
- Futuro: mais premium (selos etc.).

## Invocações

O encontro sorteia um animal, que passa a acompanhar o jogador como **passiva** em todas as lutas, sem custo de chakra. Se já tiver um, o animal sobe de nível (não muda). "Por nível" conta a partir do nível 2.

| Animal | Papel | Efeito | Por nível |
|---|---|---|---|
| Sapo | Dano contra chefes | Cada ataque que acerta causa **dano verdadeiro** (ignora resistência e escudo) de 6% do HP máximo do vilão, uma vez por ataque (vários golpes ou clones contam uma vez) | +2% do HP máximo |
| Cobra | Veneno | Acerto em alvo não envenenado aplica envenenamento (bônus inicial 2) | +2 de bônus inicial |
| Lesma | Sustentação | Cura 3% do HP máximo no início de cada rodada | +1% de cura e +10% na chance de curar envenenamento |

Regras do veneno em [efeitos.md](efeitos.md#envenenamento). O sapo não vale em ilusões, na disputa nem no golpe do cão do Inuzuka.

## Exame chunin

- Três lutas em sequência contra rivais genin, de dificuldade crescente. HP e chakra seguem de uma luta para a outra.
- **Não causa game over e não consome a Vontade do Fogo.** Perder só reduz o desempenho. Quem perde uma luta é atendido pelos médicos do exame e segue para a próxima com 50% do HP e do chakra máximos.
- **Ao fim do exame, qualquer que seja o resultado, o jogador sai totalmente restaurado** (HP, chakra e efeitos).
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

| Dificuldade | Força dos vilões (HP, ataques e resistências) |
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