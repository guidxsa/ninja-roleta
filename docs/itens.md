# Itens e recompensas

Itens que o jogador ganha nas roletas, a bolsa de consumíveis e a roleta de recompensa pós-vilão.

## Roleta de itens

Usada no evento "Achou um item" e nas fatias de item da roleta de recompensa.

| Item | Peso | Tipo | Efeito |
|---|---|---|---|
| Vontade do Fogo | 10 | Permanente, acumula | +1 revive (ver [fundamentos.md](fundamentos.md#vontade-do-fogo-revive)). |
| Ferramenta ninja | 12 | Único, evolui | +1 de dano base em todos os ataques; se sair de novo, +1 nível. |
| Pergaminho de técnica | 13 | Permanente | +1 nível de upgrade numa categoria sorteada entre as que o jogador usa (ver [tecnicas.md](tecnicas.md#regras-gerais)). |
| Amuleto de resistência | 10 | Permanente, acumula | `diferencial_de_resistência` +1. |
| Amuleto de velocidade | 10 | Permanente, acumula | Speed +1. |
| Pergaminho de experiência | 10 | Imediato | +100 de XP. |
| Pílula de soldado | 8 | Consumível | Recupera 50% do chakra máximo. |
| Kit médico | 8 | Consumível | Limpa todos os efeitos negativos. |
| Selo explosivo | 7 | Consumível | 15 de dano que ignora defesa e não rola acerto. |
| Bomba de fumaça | 5 | Consumível | Esquiva garantida do próximo ataque. |
| Moeda viciada | 4 | Acumula | Fora de combate, permite girar de novo uma roleta (evento, item ou recompensa), uma vez. A escolha aparece logo depois do giro. |
| Pesos de treino | 3 | Único | Ver abaixo. |

Itens filtrados pela origem: o prodígio nunca recebe pergaminho para categorias que não usa.

### Bolsa e consumíveis

- Consumíveis ficam na bolsa entre as lutas (a restauração do início do combate não mexe neles).
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
| Estágio de status | 20 | +1 | +2 | +3 |
| Nova técnica | 20 | Técnica da pool | Técnica + 1 pergaminho na categoria | Técnica + 2 pergaminhos |
| XP | 20 | +60 | +120 | +200 |
| Roleta de itens | 15 | 1 giro | 2 giros | 3 giros |
| Resistência | 10 | +1 | +2 | +3 |
| Crítico | 10 | +2% | +4% | +6% |
| Elemento secundário | 5 | Um elemento | Um elemento | Um elemento + técnica básica dele |

- **Lendária**: a roleta gira 3 vezes e o jogador escolhe 1 dos resultados.
- Fatias impossíveis somem (ex.: elemento secundário para quem já tem um, ou para o prodígio; nova técnica sem nada para aprender).
- A pool de técnicas respeita a origem e o elemento (ver [tecnicas.md](tecnicas.md)).

### Raridade por confronto

| Confronto | Raridade |
|---|---|
| Mizuki | Comum |
| Haku | Comum |
| Zabuza | Rara |
| Exame chunin | Pelo desempenho (ver [campanha.md](campanha.md#exame-chunin)) |
| Gaara | Rara |
| Quarteto do Som (fim do bloco) | Rara |
| Kabuto | Lendária |
| Orochimaru | Fim da run, sem recompensa |