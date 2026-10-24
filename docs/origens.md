# Origens

A origem do personagem é sorteada no início da run: linhagem, afinidade elemental e jinchuuriki. Ela define os status iniciais, as técnicas de partida e as habilidades exclusivas.

## Sorteio

1. **Roleta de linhagem**: uma roleta só, com três níveis de raridade (a cor da fatia indica o nível).
2. **Afinidade**: se a linhagem não tem afinidade fixa, rola um dos 5 elementos (pesos iguais).
3. **Jinchuuriki**: roleta independente, **10%**. Acumula com qualquer linhagem.

| Nível | Linhagem | Peso |
|---|---|---|
| Comum | Comum | 30 |
| Clã | Nara | 8 |
| Clã | Akimichi | 8 |
| Clã | Yamanaka | 8 |
| Clã | Aburame | 8 |
| Clã | Inuzuka | 8 |
| Rara | Prodígio do taijutsu | 9 |
| Rara | Uchiha | 7 |
| Rara | Hyuuga | 7 |
| Rara | Uzumaki | 7 |

Total: 30% comum, 40% clã, 30% rara.

### Re-roll

- Infinito, só na tela de origem, antes da primeira luta.
- Cada re-roll conta como campanha nova e entra no histórico com status "re-roll".

## Status iniciais

Todas as origens têm o mesmo **orçamento de 90 pontos**: os 70 de antes mais **20 em resistências**. A diferença de poder vem das habilidades, não dos números.

Conversão: tai, nin, gen e as duas resistências valem 1 ponto; speed vale 1,5; 10 de HP vale 1; 2 de chakra valem 1.

| Origem | Tai | Nin | Gen | Res. física | Res. mental | Speed | HP | Chakra | Afinidade |
|---|---|---|---|---|---|---|---|---|---|
| Comum | 10 | 10 | 10 | 10 | 10 | 10 | 100 | 30 | Rolada |
| Nara | 7 | 13 | 11 | 8 | 12 | 9 | 95 | 32 | Rolada |
| Akimichi | 15 | 8 | 5 | 14 | 6 | 6 | 160 | 34 | Rolada |
| Yamanaka | 7 | 9 | 15 | 6 | 14 | 10 | 90 | 30 | Rolada |
| Aburame | 8 | 12 | 10 | 9 | 11 | 8 | 110 | 34 | Rolada |
| Inuzuka | 14 | 8 | 6 | 12 | 8 | 13 | 105 | 24 | Rolada |
| Prodígio do taijutsu | 22 | 0 | 0 | 14 | 6 | 14 | 130 | 28 | Nenhuma |
| Uchiha | 7 | 12 | 14 | 8 | 12 | 10 | 90 | 26 | Fogo (fixa) |
| Hyuuga | 16 | 6 | 8 | 11 | 9 | 11 | 100 | 27 | Rolada |
| Uzumaki | 10 | 11 | 6 | 12 | 8 | 9 | 120 | 35 | Rolada |

Lógica das resistências (provisória): clãs de corpo (Akimichi, Inuzuka, prodígio, Uzumaki) puxam para a física; clãs de mente e ilusão (Yamanaka, Nara, Uchiha) puxam para a mental. O prodígio tem mental baixa: é o alvo natural de genjutsu, como na série.

Jinchuuriki soma **+100% de chakra máximo** sobre a origem.

## Habilidades por linhagem

Visão geral. Detalhes de cada técnica em [tecnicas.md](tecnicas.md).

| Origem | Passiva | Ativa | Kit inicial | Exclusivas | Restrições |
|---|---|---|---|---|---|
| Comum | Determinação | — | Punho de Chakra, ninjutsu básico | — | — |
| Nara | Estrategista | — | Punho de Chakra, ninjutsu básico, Imitação de Sombra | Imitação de Sombra | — |
| Akimichi | Corpo pesado | Expansão | Punho de Chakra, ninjutsu básico | Rolo Colossal (nível 4) | — |
| Yamanaka | Leitura mental | — | Punho de Chakra, ninjutsu básico, Transferência de Mente | Transferência de Mente | — |
| Aburame | Colmeia | — | Punho de Chakra, ninjutsu básico, Enxame | Enxame | — |
| Inuzuka | Dupla | — | Punho de Chakra, ninjutsu básico, Presas Giratórias | Presas Giratórias | — |
| Prodígio do taijutsu | Corpo de ferro | Portões | Punho de Chakra | Redemoinho da Folha (4), Lótus Primaveril (7) | Sem ninjutsu, genjutsu e médico |
| Uchiha | Olhos treinados | Sharingan | Punho de Chakra, Fagulha do Dragão, Olhar Hipnótico | Efeitos extras de genjutsu com Sharingan | — |
| Hyuuga | Punho preciso | Byakugan | Punho de Chakra, ninjutsu básico | Selo dos Pontos Vitais, Rotação (nível 4) | — |
| Uzumaki | Vitalidade | Clones das Sombras | Punho de Chakra, ninjutsu básico | Clones das Sombras | — |

"Ninjutsu básico" = o nível I da linha de ataque do elemento sorteado (ver [tecnicas.md](tecnicas.md#linhas-de-ataque)).

## Detalhe por linhagem

### Comum

- **Determinação** (passiva): +10% de XP ganho. Combina com o nível sem limite: o comum não nasce forte, mas cresce mais rápido.

### Nara (sombras)

- **Estrategista** (passiva): a tela mostra a próxima ação do vilão antes de o jogador escolher a sua.
- **Imitação de Sombra**: ninjutsu sem dano que prende o alvo (efeito Aprisionado). Por ser ninjutsu, funciona contra quem é imune a genjutsu (Gaara).

### Akimichi (expansão)

- **Corpo pesado** (passiva): dano de taijutsu × (0,8 + 0,4 × HP atual / HP máximo). ×1,2 com HP cheio, ×0,8 perto de zero.
- **Expansão** (ativa): gasta o turno e 6 de chakra. Por 3 rodadas, a partir da seguinte: taijutsu ×1,5 e speed −3. Pode ser usada de novo quando acabar.
- **Rolo Colossal** (nível 4): taijutsu exclusivo.

### Yamanaka (mente)

- **Leitura mental** (passiva): ataques do vilão contra o Yamanaka têm −10 de acerto.
- **Transferência de Mente**: genjutsu inicial com efeito Confusão. Junto com o Uchiha, é a única origem que nasce com genjutsu.

### Aburame (insetos)

- **Colmeia** (passiva): cada golpe que acerta drena 2 de chakra do vilão.
- **Enxame**: ninjutsu neutro de 4 golpes pequenos. Cada golpe rola acerto e drena chakra pela Colmeia.

### Inuzuka (parceiro canino)

- **Dupla** (passiva): depois de cada ataque do jogador que acerta, 30% de chance de o cão atacar também (taijutsu, 40% do dano base do ataque, rola acerto próprio).
- **Presas Giratórias**: taijutsu inicial de 2 golpes.

### Prodígio do taijutsu (estilo Lee)

- **Corpo de ferro** (passiva): a reação Resistir usa 100% da resistência física (como em postura defensiva).
- **Portões** (ativa): uma vez por luta. Abrir gasta o turno; o bônus vale por 5 rodadas a partir da seguinte. Abre o maior portão liberado pelo taijutsu atual. Custa chakra e HP (nunca abaixo de 1).

  | Portão | Taijutsu mínimo | Dano de taijutsu | Chakra | HP |
  |---|---|---|---|---|
  | 1º | 22 (inicial) | ×1,5 | 5 | 15% do máximo |
  | 2º | 26 | ×1,75 | 7 | 20% |
  | 3º | 30 | ×2 | 9 | 25% |

- Nunca aprende ninjutsu, genjutsu ou ninjutsu médico; a roleta de recompensas é filtrada.
- Sem ninjutsu, não disputa nem ergue barreiras. Responde a ninjutsu com Resistir ou Substituição, e quebra barreiras com taijutsu ([fundamentos.md](fundamentos.md#quebra-de-guarda)).

### Uchiha

- **Olhos treinados** (passiva): +6 na resistência mental ao resistir a ilusões.
- **Sharingan** (ativa, dōjutsu): ativar 4 de chakra, manutenção 1 por rodada, dura 5 rodadas ou até faltar chakra. Evolui com o nível.

  | Estágio | Nível | Tai/Nin/Gen | Speed | Genjutsu: acerto / poder | Leitura de movimento |
  |---|---|---|---|---|---|
  | 1 tomoe | 1 | +3 | +1 | +10% / +3 | 20% |
  | 2 tomoe | 4 | +5 | +2 | +15% / +6 | 25% |
  | 3 tomoe | 7 | +7 | +3 | +20% / +9 | 30% |

  Leitura de movimento: chance de reduzir à metade o dano recebido.
- Com o Sharingan ativo, o genjutsu do Uchiha pode aplicar Pavor em vez do efeito da técnica (escolha do jogador).

### Hyuuga

- **Punho preciso** (passiva): taijutsu ignora 30% da resistência física do alvo (conta como penetração).
- **Byakugan** (ativa, dōjutsu): ativar 3, manutenção 1, dura 5 rodadas. Ativo: taijutsu não erra (crítico ainda rola), taijutsu ×1,1 e libera o Selo dos Pontos Vitais.
- **Rotação** (nível 4): barreira neutra exclusiva, usada como reação (ver [tecnicas.md](tecnicas.md#ninjutsu-de-linhagem)).

### Uzumaki

- **Vitalidade** (passiva): recupera 1 de chakra e 3% do HP máximo no início de cada rodada.
- **Clones das Sombras** (ativa): gasta 6 de chakra, não gasta o turno. O próximo ataque vira 3 golpes de 40% do dano, cada um com acerto e crítico próprios (técnica de vários golpes: cada golpe vira 3).

## Jinchuuriki

- **Chakra máximo +100%.**
- **Manto de chakra**: uma vez por luta, ao ficar abaixo de 50% do HP (inclusive no início da rodada).
  - Dura até 5 rodadas: tai, nin, gen e speed ×1,5, resistências ×1,25, e regenera 5% do HP máximo no início de cada rodada.
  - **Custo: 10% do chakra máximo por rodada.** Sem chakra para pagar a rodada, o manto se desfaz. Não há recoil.
- **Demônio interno**: imune a genjutsu.
- O Gaara usa o mesmo manto (ver [viloes.md](viloes.md)).