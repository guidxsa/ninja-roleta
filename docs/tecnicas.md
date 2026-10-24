# Técnicas

Catálogo de ações de combate: ações universais, técnicas por categoria e técnicas exclusivas de linhagem. Os nomes são nomes de trabalho e podem mudar.

## Regras gerais

- Cada personagem tem um **skill set por categoria**: taijutsu, ninjutsu, genjutsu e ninjutsu médico. Pode ter várias técnicas em cada uma e escolhe qual usar no turno (uma aba por categoria).
- Aprender uma técnica **soma** ao skill set.
- Formas de aprender: kit inicial da origem ([origens.md](origens.md)), técnicas de nível (automáticas ao atingir o nível), roleta de recompensa ("nova técnica") e guru.
- **Upgrades** (pergaminho de técnica) valem por categoria: o nível do pergaminho melhora todas as técnicas dela.
  - Dano: +3 de dano base por nível.
  - Genjutsu: +3 de poder por nível.
  - Médico: +5% de cura por nível.
- Técnicas elementais só no próprio elemento (afinidade ou secundário).
- O campo `lineages` restringe técnicas exclusivas.

## Ficha padrão

Toda técnica nos dados tem estes campos. Regra de design: todo ponto forte tem um custo (precisão menor, chakra maior ou dano menor).

| Campo | Significado | Padrão |
|---|---|---|
| `nome` | Nome exibido | — |
| `categoria` | taijutsu, ninjutsu, genjutsu, médico | — |
| `elemento` | Um dos 5 ou neutro | neutro |
| `dano` | Dano base por golpe | — |
| `golpes` | Quantos golpes; cada um rola acerto | 1 |
| `custo` | Chakra | 0 |
| `precisão` | Chance de acerto | 85% |
| `bônusCrítico` | Somado à chance de crítico | 0 |
| `penetração` | Parte da defesa ignorada | 0 |
| `efeito` | Efeito e chance no acerto (ver [efeitos.md](efeitos.md)) | — |
| `prioridade` | Age antes na rodada | não |
| `blade` | Golpe cortante (espada, kunai etc.) | — |
| `nível` | Nível em que é aprendida sozinha | — |
| `lineages` | Origens que podem ter | todas |

## Ações universais

| Ação | Custo | Efeito |
|---|---|---|
| Concentrar chakra | Turno | Recupera 4 de chakra. |
| Substituição | Turno + 2 de chakra | 50% de chance de esquivar do próximo ataque inteiro (dura até o próximo ataque recebido ou até o fim da próxima rodada). |
| Usar item | Turno | Usa um consumível da bolsa (ver [itens.md](itens.md)). |

## Taijutsu

| Técnica | Nível | Dano | Golpes | Chakra | Precisão | Especial | Quem |
|---|---|---|---|---|---|---|---|
| Punho de Chakra | Inicial | 8 | 1 | 0 | 90% | — | Todos |
| Impacto Concentrado | Recompensa | 14 | 1 | 3 | 85% | — | Todos |
| Presas Giratórias | Inicial | 7 | 2 | 3 | 85% | — | Inuzuka |
| Rolo Colossal | 4 | 24 | 1 | 6 | 80% | 20% de atordoar no acerto | Akimichi |
| Redemoinho da Folha | 4 | 20 | 1 | 5 | 90% | — | Prodígio |
| Lótus Primaveril | 7 | 30 | 1 | 9 | 80% | +10% de crítico | Prodígio |
| Selo dos Pontos Vitais | Byakugan | 6 | 1 | 0 | não erra | Drena 6 de chakra do vilão | Hyuuga (só com Byakugan) |

## Ninjutsu elemental

Cada elemento tem uma identidade:

- **Fogo**: confiável, queima.
- **Vento**: preciso, críticos e vários golpes.
- **Raio**: dano alto, erra mais, fura defesa.
- **Terra**: quase não erra, dano menor, atordoa.
- **Água**: equilibrado, prioridade.

| Elemento | Técnica | Nível | Dano | Golpes | Chakra | Precisão | Especial |
|---|---|---|---|---|---|---|---|
| Fogo | Fagulha do Dragão | Inicial | 12 | 1 | 2 | 85% | — |
| Fogo | Serpente de Chamas | 4 | 23 | 1 | 6 | 85% | 20% de queimar no acerto |
| Fogo | Inferno da Fênix | 7 | 34 | 1 | 10 | 80% | 30% de queimar no acerto |
| Vento | Lâmina de Vento | Inicial | 11 | 1 | 2 | 90% | +5% de crítico |
| Vento | Vendaval Cortante | 4 | 12 | 2 | 6 | 85% | +10% de crítico |
| Vento | Tufão das Mil Lâminas | 7 | 9 | 4 | 10 | 85% | +10% de crítico |
| Raio | Faísca | Inicial | 13 | 1 | 2 | 80% | Penetração 10% |
| Raio | Lança Trovejante | 4 | 26 | 1 | 7 | 75% | Penetração 20% |
| Raio | Corte do Relâmpago | 7 | 38 | 1 | 11 | 70% | Penetração 30% |
| Terra | Punho de Rocha | Inicial | 10 | 1 | 2 | 95% | — |
| Terra | Muralha Esmagadora | 4 | 22 | 1 | 5 | 95% | 15% de atordoar no acerto |
| Terra | Avalanche da Montanha | 7 | 32 | 1 | 9 | 90% | 25% de atordoar no acerto |
| Água | Projétil d'Água | Inicial | 11 | 1 | 2 | 90% | — |
| Água | Torrente Serpente | 4 | 23 | 1 | 6 | 90% | Prioridade |
| Água | Maremoto do Abismo | 7 | 33 | 1 | 10 | 85% | Prioridade |

Os críticos elementais continuam aplicando os efeitos de [efeitos.md](efeitos.md) (queimadura, paralisia, atordoamento).

A técnica inicial de um elemento secundário entra na pool da "nova técnica" (a recompensa lendária de elemento já a ensina).

## Ninjutsu de linhagem

| Técnica | Dano | Golpes | Chakra | Precisão | Efeito | Quem |
|---|---|---|---|---|---|---|
| Imitação de Sombra | 0 | 1 | 5 | 80% | Aprisionado (1 turno base; duração pela fórmula do genjutsu usando ninjutsu) | Nara |
| Enxame | 5 | 4 | 5 | 85% | Cada golpe drena chakra (Colmeia) | Aburame |

## Genjutsu

Genjutsu não causa dano. Se acertar, aplica um efeito mental (ver [efeitos.md](efeitos.md#efeitos-de-genjutsu)).

| Técnica | Nível | Chakra | Turnos base | Poder extra | Efeito | Quem |
|---|---|---|---|---|---|---|
| Olhar Hipnótico | Inicial | 3 | 1 | 0 | Aprisionado | Uchiha |
| Transferência de Mente | Inicial | 4 | 1 | +2 | Confusão | Yamanaka |
| Revoada de Corvos | Recompensa | 4 | 1 | +6 | Aprisionado | Quem usa genjutsu |
| Canção do Sono | Recompensa | 4 | 2 | 0 | Sono | Quem usa genjutsu |
| Sussurro Vazio | Recompensa | 5 | 2 | +2 | Tormento | Quem usa genjutsu |
| Teatro do Pavor | 4 | 5 | 2 | +10 | Pavor | Quem usa genjutsu |
| Prisão dos Espelhos | 7 | 8 | 2 | +14 | Aprisionado | Quem usa genjutsu |

"Quem usa genjutsu" = qualquer origem exceto o prodígio, a partir do momento em que tem ao menos uma técnica de genjutsu.

## Ninjutsu médico

| Técnica | Chakra | Efeito | Quem |
|---|---|---|---|
| Palma Curativa | 4 | Cura 20% do HP máximo, sem rolar acerto. Indisponível com HP cheio. | Todos, menos o prodígio |

## Técnicas defensivas

| Técnica | Chakra | Efeito | Quem |
|---|---|---|---|
| Rotação | 5 | Gasta o turno e age antes (prioridade). Bloqueia o próximo ataque de taijutsu ou ninjutsu recebido nesta rodada e devolve 50% do dano que ele causaria. | Hyuuga (nível 4) |

## Técnicas de nível futuro

O nível não tem limite (ver [progressao.md](progressao.md)). Há espaço reservado para um terceiro tier de técnicas no **nível 10**, a definir.