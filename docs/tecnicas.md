# Técnicas

Catálogo de ações de combate: ações universais, reações, técnicas por categoria, níveis de técnica, barreiras, estados elementais, técnicas de linhagem e premium. Os nomes são nomes de trabalho e podem mudar. As fórmulas de reação, disputa e quebra de guarda estão em [fundamentos.md](fundamentos.md#reações).

## Regras gerais

- Cada personagem tem um **skill set por categoria**: taijutsu, ninjutsu, genjutsu e ninjutsu médico. Pode ter várias técnicas em cada uma e escolhe qual usar no turno (uma aba por categoria).
- Aprender uma técnica **soma** ao skill set.
- Formas de aprender: kit inicial da origem ([origens.md](origens.md)), técnicas de nível (automáticas ao atingir o nível), roleta de recompensa ("nova técnica") e, para as premium, o guru ([campanha.md](campanha.md#guru)).
- Técnicas elementais só no próprio elemento (afinidade ou secundário).
- O campo `lineages` restringe técnicas exclusivas.
- Vilões usam as mesmas fichas de técnica (ver [viloes.md](viloes.md)).

## Níveis de técnica

Toda técnica tem **níveis** (I, II, III...). Subir o nível de uma técnica a deixa mais forte e mais cara, **sem ocupar um espaço novo** no skill set. Aprender técnicas diferentes continua possível.

- **Teto pelo nível do personagem**: nível I a partir do 1, II a partir do 4, III a partir do 7, IV a partir do 10 (reservado).
- **Linhas com nome próprio**: as técnicas elementais de ataque mudam de nome e de ficha a cada nível (ver "Ninjutsu elemental").
- **Upgrade genérico** (técnicas sem linha própria), por nível acima do I:

  | Categoria | Ganho por nível | Custo por nível |
  |---|---|---|
  | Dano (taijutsu e ninjutsu) | +3 de dano base por golpe | +1 de chakra (técnicas grátis continuam grátis) |
  | Barreira | +4 de poder de barreira | +1 de chakra |
  | Genjutsu | +3 de poder | +1 de chakra |
  | Médico | +5% de cura | +1 de chakra |

- **De onde vêm os upgrades** (sempre respeitando o teto):

  | Fonte | Efeito |
  |---|---|
  | Marco de nível (4, 7, 10) | Sobe o teto e dá **1 upgrade grátis** à escolha do jogador |
  | Pergaminho de técnica | +1 nível numa técnica à escolha ([itens.md](itens.md)) |
  | Roleta de recompensa, "nova técnica" | Técnica nova; sem técnica nova para aprender, vira upgrade. Rara e lendária somam upgrades ([itens.md](itens.md#roleta-de-recompensa)) |
  | Guru | Premium nova, ou o próximo nível de uma premium que já tem |

- Sem técnica abaixo do teto para subir, o upgrade vira 30 de XP.

## Ficha padrão

Toda técnica nos dados tem estes campos. Regra de design: todo ponto forte tem um custo (precisão menor, chakra maior ou dano menor).

| Campo | Significado | Padrão |
|---|---|---|
| `nome` | Nome exibido | — |
| `categoria` | taijutsu, ninjutsu, genjutsu, médico | — |
| `elemento` | Um dos 5 ou neutro | neutro |
| `dano` | Dano base por golpe | — |
| `golpes` | Quantos golpes; o acerto e o crítico rolam uma vez para todos | 1 |
| `custo` | Chakra | 0 |
| `precisão` | Chance de acerto | 85% |
| `bônusCrítico` | Somado à chance de crítico | 0 |
| `penetração` | Parte da resistência ignorada | 0 |
| `efeito` | Efeito e chance no acerto (ver [efeitos.md](efeitos.md)) | — |
| `prioridade` | Age antes na rodada | não |
| `blade` | Golpe cortante (espada, kunai etc.) | — |
| `uso` | `ação` (no turno), `reação` (barreiras) ou os dois (ninjutsu de ataque pode ser usado na disputa) | ninjutsu de ataque: os dois; barreira: reação; demais: ação |
| `barreira` | Poder de barreira (só técnicas defensivas) | — |
| `estado` | Estado elemental que a técnica ativa (ver "Estados elementais") | — |
| `linha` / `nível` | Linha de upgrade e nível atual | nível I |
| `nívelMínimo` | Nível do personagem em que é aprendida sozinha ou entra na pool | — |
| `lineages` | Origens que podem ter | todas |
| `premium` | Só o guru ensina | não |

## Ações universais

| Ação | Custo | Efeito |
|---|---|---|
| Concentrar chakra | Turno | Recupera 15% do chakra máximo. |
| Postura defensiva | Turno | Até o seu próximo turno, Resistir usa 100% da resistência (física e mental). As outras reações continuam disponíveis. |
| Usar item | Turno | Usa um consumível da bolsa (ver [itens.md](itens.md)). |

## Reações

Resumo; as regras completas estão em [fundamentos.md](fundamentos.md#reações).

| Reação | Custo | Efeito |
|---|---|---|
| Resistir | Grátis | 70% da resistência (100% em postura). |
| Disputa de ninjutsu | Chakra da técnica + próxima ação | Roleta de poder entre os dois jutsus. |
| Barreira | Chakra da técnica + próxima ação | Disputa contra ninjutsu; quebra de guarda contra taijutsu. |
| Substituição | 2 de chakra + 1 uso (2 por luta); não gasta ação | Roleta de esquiva pela speed. |

## Taijutsu

| Técnica | Nível mínimo | Dano | Golpes | Chakra | Precisão | Especial | Quem |
|---|---|---|---|---|---|---|---|
| Punho de Chakra | Inicial | 8 | 1 | 0 | 90% | — | Todos |
| Impacto Concentrado | Recompensa | 14 | 1 | 3 | 85% | — | Todos |
| Presas Giratórias | Inicial | 7 | 2 | 3 | 85% | — | Inuzuka |
| Rolo Colossal | 4 | 24 | 1 | 6 | 80% | 20% de atordoar no acerto | Akimichi |
| Redemoinho da Folha | 4 | 20 | 1 | 5 | 90% | — | Prodígio |
| Lótus Primaveril | 7 | 30 | 1 | 9 | 80% | +10% de crítico | Prodígio |
| Selo dos Pontos Vitais | Byakugan | 6 | 1 | 0 | não erra | Drena 6 de chakra do alvo | Hyuuga (só com Byakugan) |

O taijutsu é a resposta às barreiras: contra uma barreira, rola a quebra de guarda ([fundamentos.md](fundamentos.md#quebra-de-guarda)).

## Ninjutsu elemental

Cada elemento tem uma identidade:

- **Fogo**: confiável, queima.
- **Vento**: preciso, críticos e vários golpes.
- **Raio**: dano alto, erra mais, fura resistência e barreiras de terra.
- **Terra**: quase não erra, dano menor, atordoa, a melhor barreira.
- **Água**: equilibrado, prioridade.

### Linhas de ataque

Cada elemento tem uma **linha de ataque**: a técnica básica do kit inicial é o nível I, e os níveis II e III são upgrades dela (mesmo espaço no skill set).

| Elemento | Nível | Nome | Dano | Golpes | Chakra | Precisão | Especial |
|---|---|---|---|---|---|---|---|
| Fogo | I | Fagulha do Dragão | 12 | 1 | 2 | 85% | — |
| Fogo | II | Serpente de Chamas | 23 | 1 | 6 | 85% | 20% de queimar no acerto |
| Fogo | III | Inferno da Fênix | 34 | 1 | 10 | 80% | 30% de queimar no acerto |
| Vento | I | Lâmina de Vento | 11 | 1 | 2 | 90% | +5% de crítico |
| Vento | II | Vendaval Cortante | 12 | 2 | 6 | 85% | +10% de crítico |
| Vento | III | Tufão das Mil Lâminas | 9 | 4 | 10 | 85% | +10% de crítico |
| Raio | I | Faísca | 13 | 1 | 2 | 80% | Penetração 10% |
| Raio | II | Lança Trovejante | 26 | 1 | 7 | 75% | Penetração 20% |
| Raio | III | Corte do Relâmpago | 38 | 1 | 11 | 70% | Penetração 30% |
| Terra | I | Punho de Rocha | 10 | 1 | 2 | 95% | — |
| Terra | II | Muralha Esmagadora | 22 | 1 | 5 | 95% | 15% de atordoar no acerto |
| Terra | III | Avalanche da Montanha | 32 | 1 | 9 | 90% | 25% de atordoar no acerto |
| Água | I | Projétil d'Água | 11 | 1 | 2 | 90% | — |
| Água | II | Torrente Serpente | 23 | 1 | 6 | 90% | Prioridade |
| Água | III | Maremoto do Abismo | 33 | 1 | 10 | 85% | Prioridade |

- Nível IV de cada linha: reservado para o marco do nível 10.
- A linha de um elemento secundário entra na pool da "nova técnica" no nível I (a recompensa lendária de elemento já a ensina).
- Os críticos elementais continuam aplicando os efeitos de [efeitos.md](efeitos.md) (queimadura, paralisia, atordoamento).

### Barreiras

Ninjutsu defensivo, usado só como **reação** (ver [fundamentos.md](fundamentos.md#reações)). Entram na pool da "nova técnica" a partir do nível 4, no elemento do jogador. Sobem de nível pelo upgrade genérico.

| Elemento | Técnica | Nível mínimo | Chakra | Poder de barreira | Especial |
|---|---|---|---|---|---|
| Terra | Muralha de Terra | 4 | 5 | 28 | A barreira mais forte; raio perfura (×2). |
| Água | Parede d'Água | 4 | 5 | 24 | Se aguentar um ataque de fogo, apaga a queimadura de quem a ergueu. |
| Fogo | Muralha de Chamas | 4 | 4 | 20 | Quem tentar quebrar com taijutsu tem 30% de chance de queimar. |
| Vento | Escudo de Vento | 4 | 4 | 20 | +25% de poder contra técnicas de vários golpes. |

O raio não tem barreira: a resposta defensiva dele é a Armadura de Raio.

### Estados elementais

Técnicas que deixam um **elemento ativo** no corpo de quem as usa. Enquanto o estado dura, golpes elementais contra essa pessoa contam como encontro de elementos (vantagem ×1,5, desvantagem ×0,75; ver [fundamentos.md](fundamentos.md#elementos)).

| Técnica | Elemento | Nível mínimo | Chakra | Duração | Efeito | Quem |
|---|---|---|---|---|---|---|
| Armadura de Raio | Raio | 7 | 8 | 3 rodadas, a partir da seguinte | Ataque de taijutsu e ninjutsu ×1,25, resistência física ×1,3, speed +2. Vento ignora o bônus de resistência. | Afinidade raio |
| Armadura de Areia | Terra | — | — | Luta inteira | Ver [viloes.md](viloes.md) (Gaara). Raio perfura (×2). | Gaara |

Ativar um estado gasta o turno. O manto do jinchuuriki é um estado **neutro** (não conta como encontro).

## Ninjutsu de linhagem

| Técnica | Dano | Golpes | Chakra | Precisão | Efeito | Quem |
|---|---|---|---|---|---|---|
| Imitação de Sombra | 0 | 1 | 5 | 80% | Aprisionado (1 turno base; duração pela fórmula do genjutsu usando ninjutsu contra a resistência física) | Nara |
| Enxame | 5 | 4 | 5 | 85% | Cada golpe drena chakra (Colmeia) | Aburame |
| Rotação | — | — | 5 | — | Barreira neutra (reação), poder 26. Se aguentar, devolve 50% do dano que o golpe causaria. | Hyuuga (nível 4) |

## Genjutsu

Genjutsu não causa dano. Se acertar, aplica um efeito mental (ver [efeitos.md](efeitos.md#efeitos-de-genjutsu)). A única reação contra ele é Resistir, com a resistência mental.

| Técnica | Nível mínimo | Chakra | Turnos base | Poder extra | Efeito | Quem |
|---|---|---|---|---|---|---|
| Olhar Hipnótico | Inicial | 3 | 1 | 0 | Aprisionado | Uchiha |
| Transferência de Mente | Inicial | 4 | 1 | +2 | Confusão | Yamanaka |
| Revoada de Corvos | Recompensa | 4 | 1 | +6 | Aprisionado | Quem usa genjutsu |
| Canção do Sono | Recompensa | 4 | 2 | 0 | Sono | Quem usa genjutsu |
| Sussurro Vazio | Recompensa | 5 | 2 | +2 | Tormento | Quem usa genjutsu |
| Teatro do Pavor | 4 | 5 | 2 | +10 | Pavor | Quem usa genjutsu |
| Prisão dos Espelhos | 7 | 8 | 2 | +14 | Aprisionado | Quem usa genjutsu |

"Quem usa genjutsu" = qualquer origem exceto o prodígio, a partir do momento em que tem ao menos uma técnica de genjutsu.

## Premium (guru)

Técnicas e talentos **sem elemento** que só o guru ensina. O guru oferece a que mais combina com o perfil do jogador (ver [campanha.md](campanha.md#guru)). Saem da pool da "nova técnica".

| Premium | Tipo | Nível I | Por nível | Quem |
|---|---|---|---|---|
| Rasengan | Ninjutsu neutro de ataque (linha própria) | Dano 26, chakra 8, precisão 85%. Na disputa, +25% de poder. | II, Rasengan Gigante: dano 34, chakra 10. III, Rasengan Supremo: dano 44, chakra 13. | Quem usa ninjutsu |
| Palma Curativa (ninjutsu médico) | Médico | Cura 20% do HP máximo, chakra 4, sem rolar acerto. Indisponível com HP cheio. | +5% de cura, +1 de chakra | Todos, menos o prodígio |
| Foco | Talento | Uma vez por luta, um botão grátis (não gasta o turno) soma +25% à chance de crítico do próximo ataque. | +1 uso por luta (até 3) | Todos |
| Mestre da Substituição | Talento | +1 uso de Substituição por luta. | +1 uso por luta (até 3) | Todos |

Os níveis das premium respeitam o teto pelo nível do personagem: no nível 1, o guru não ensina o Rasengan II.

## Técnicas de nível futuro

O nível não tem limite (ver [progressao.md](progressao.md)). O marco do **nível 10** libera o nível IV das técnicas, a definir.
