# Progressão

Como o personagem cresce durante a run: XP, níveis, estágios de status e marcos de nível.

## Nível

- Começa no **nível 1**. **Não há nível máximo.**
- XP para ir do nível N ao N+1: **100 + 25 × (N − 1)**. A sobra passa para o próximo nível.
- **Subir de nível restaura tudo**: HP, chakra e efeitos negativos (ver [fundamentos.md](fundamentos.md#restauração)). Como a luta não começa restaurada (cada vitória devolve só 25%), o nível novo é o principal respiro da run.
- Ganho por nível, sem roleta:

| Dificuldade | HP máximo | Chakra máximo |
|---|---|---|
| Fácil | +10 | +2 |
| Médio | +8 | +1 |
| Difícil e Hardcore | +6 | +1 |

### XP acumulado

| Nível | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XP total | 100 | 225 | 375 | 550 | 750 | 975 | 1225 | 1500 | 1800 | 2125 | 2475 | 2850 | 3250 | 3675 |

## Fontes de XP

| Fonte | XP |
|---|---|
| Vilão derrotado | Campo `xp` de cada vilão (ver [viloes.md](viloes.md)) |
| Luta do exame chunin | 60 por vitória (derrota não dá XP) |
| Evento Treino | +60, garantido ([campanha.md](campanha.md#treino)) |
| Roleta de recompensa, fatia XP | Comum +60, raro +120, lendário +200 |
| Pergaminho de experiência (roleta de itens) | +100 |
| Passiva Determinação (comum) | +25% sobre todo XP ganho (e +1 no maior status de ataque a cada nível, ver [origens.md](origens.md#comum)) |

## Curva planejada

A tabela abaixo usa só o XP dos vilões e do exame. As fatias de XP das roletas adiantam essa curva, então um jogador com sorte chega ao fim no nível 10 ou mais.

| Confronto | XP | Total | Nível depois | Intenção |
|---|---|---|---|---|
| Mizuki | 100 | 100 | 2 | Primeiro nível logo de cara |
| Haku | 125 | 225 | 3 | |
| Zabuza | 150 | 375 | 4 | Técnicas de nível 4 antes do exame |
| Exame (3 lutas × 60) | até 180 | até 555 | 5 só vencendo tudo | O exame passa a importar |
| Gaara | 200 | 755 | 6 | |
| Quarteto (4 lutas × 60) | 240 | 995 | 7 | Técnicas de nível 7 antes do Kabuto |
| Kabuto | 250 | 1245 | 8 | |
| Orochimaru | 300 | 1545 | 9 | Fim da run |

## Marcos de nível

| Nível | O que destrava |
|---|---|
| 4 | Teto de técnica no nível II e **1 upgrade grátis**; barreiras entram na pool; Sharingan com 2 tomoe; Rotação (Hyuuga); Rolo Colossal (Akimichi); Redemoinho da Folha (prodígio) |
| 7 | Teto no nível III e **1 upgrade grátis**; Armadura de Raio entra na pool; Sharingan com 3 tomoe; Lótus Primaveril (prodígio) |
| 10 | Teto no nível IV (reservado) e **1 upgrade grátis** |

- Técnicas de nível só são aprendidas se a origem permitir a categoria e o jogador dominar o elemento.
- A linha elemental não sobe sozinha: o upgrade grátis do marco é escolhido pelo jogador (ver [tecnicas.md](tecnicas.md#níveis-de-técnica)).

## Estágio de status

Unidade de melhoria usada por eventos e recompensas. 1 estágio = **+1 em taijutsu, ninjutsu, genjutsu, resistência física, resistência mental e speed**, mais HP e chakra máximos iguais a uma subida de nível na dificuldade atual. Não restaura HP nem chakra.

- O prodígio do taijutsu continua com ninjutsu e genjutsu zerados (o estágio não os afeta).
- Fontes: vitória no jokenpô (+2), roleta de recompensa. O Treino dá XP e um destaque num status só ([campanha.md](campanha.md#treino)).