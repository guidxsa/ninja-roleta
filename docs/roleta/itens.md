# Itens e recompensas

Itens que o jogador ganha nas roletas, a bolsa de consumíveis e a roleta de recompensa pós-vilão.

## Roleta de itens

Usada no evento "Achou um item" e nas fatias de item da roleta de recompensa.

| Item | Peso | Tipo | Efeito |
|---|---|---|---|
| Vontade do Fogo | 10 | Permanente, acumula | +1 revive (ver [fundamentos.md](../base/fundamentos.md#vontade-do-fogo-revive)). |
| Ferramenta ninja | 14 | Único, evolui | +1 de dano base em todos os ataques; se sair de novo, +1 nível. |
| Amuleto de resistência | 12 | Permanente, acumula | +2 numa resistência sorteada (física ou mental, 50% cada). |
| Amuleto de velocidade | 12 | Permanente, acumula | Speed +1. |
| Pergaminho de experiência | 12 | Imediato | +100 de XP. |
| Pílula de soldado | 9 | Consumível | Recupera 50% do chakra máximo. |
| Kit médico | 9 | Consumível | Limpa os efeitos e cura 15% do HP. |
| Selo explosivo | 8 | Consumível | 15 de dano, sem roleta de acerto. |
| Bomba de fumaça | 6 | Consumível | Esquiva garantida do próximo ataque. |
| Moeda viciada | 4 | Acumula | Fora de combate, permite girar de novo uma roleta (evento, item ou recompensa), uma vez. A escolha aparece logo depois do giro. |
| Pesos de treino | 4 | Único | Ver abaixo. |

O Pergaminho de técnica saiu na v0.45.0: no Roleta enxuto as técnicas sobem sozinhas com o nível.

### Bolsa e consumíveis

- Consumíveis ficam na bolsa entre as lutas. Como HP e chakra não se restauram no início da luta, a Pílula de soldado vale também para o chakra que sobrou da luta anterior.
- Máximo de **3 de cada** consumível. Excedente vira 30 de XP.
- **Usar item** é uma ação universal que gasta o turno.

### Pesos de treino

- Ao ganhar, o jogador escolhe se equipa. Se não equipar, ficam guardados e podem ser equipados depois, fora de combate.
- Equipado: **−2 de speed**, e cada vitória contra vilão dá **+1 de taijutsu** (as lutas do exame não contam).
- Pode tirar a qualquer momento fora de combate: devolve os 2 de speed e dá **+3 de speed** extra. Depois de tirados, não voltam.

## Roleta de recompensa

Gira depois de cada vilão ou bloco derrotado. A raridade define a força de cada fatia.

| Fatia | Peso | Comum | Rara | Lendária |
|---|---|---|---|---|
| Estágio de status | 25 | +1 | +2 | +3 |
| XP | 25 | +60 | +120 | +200 |
| Roleta de itens | 20 | 1 giro | 2 giros | 3 giros |
| Resistência | 15 | +2 | +4 | +6 |
| Crítico | 15 | +2% | +4% | +6% |

- **Recompensa direta** (v0.45.0): um giro em todas as raridades; a lendária só tem valores maiores. A fatia "Nova técnica" saiu (as técnicas sobem sozinhas) e o "gira 3, escolhe 1" da lendária também.
- Fatias impossíveis somem (ex.: nova técnica sem nada para aprender nem subir).
- Não há fatia de elemento: os elementos vêm só do sorteio da origem ([origens.md](../base/origens.md#elementos-e-potencial-elemental)). A antiga fatia "Elemento secundário" (peso 5) saiu na v0.30 e o peso foi para "Nova técnica".
- A pool de técnicas respeita a origem e o elemento (ver [tecnicas.md](../base/tecnicas.md)) e não tem as premium (só o guru ensina). Sem técnica nova para aprender, a "nova técnica" vira upgrade.
- **Resistência**: os pontos são distribuídos um a um por roleta entre física e mental (50% cada).

### Raridade por confronto

| Confronto | Raridade |
|---|---|
| Mizuki | Comum |
| Haku e Zabuza (fim do bloco) | Rara |
| Exame chunin | Pelo desempenho (ver [campanha.md](campanha.md#exame-chunin)) |
| Gaara | Rara |
| Quarteto do Som (fim do bloco) | Rara |
| Kabuto | Lendária |
| Orochimaru | Fim da run, sem recompensa |