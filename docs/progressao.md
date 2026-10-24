# Progressão

Como o personagem cresce durante a run: XP, níveis, estágios de status e marcos de nível.

## Nível

- Começa no **nível 1**. **Não há nível máximo.**
- XP para ir do nível N ao N+1: **100 + 25 × (N − 1)**. A sobra passa para o próximo nível.
- **Subir de nível não restaura HP nem chakra.** A restauração acontece no início de cada combate (ver [fundamentos.md](fundamentos.md#restauração)).
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
| Roleta de recompensa, fatia XP | Comum +60, raro +120, lendário +200 |
| Pergaminho de experiência (roleta de itens) | +100 |
| Passiva Determinação (comum) | +10% sobre todo XP ganho |

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
| 4 | Técnicas de nível 4 da origem e do elemento; Sharingan com 2 tomoe; Rotação (Hyuuga); Rolo Colossal (Akimichi) |
| 7 | Técnicas de nível 7; Sharingan com 3 tomoe |
| 10 | Reservado para um tier futuro de técnicas |

Técnicas de nível só são aprendidas se a origem permitir a categoria e o jogador dominar o elemento.

## Estágio de status

Unidade de melhoria usada por eventos e recompensas. 1 estágio = **+1 em taijutsu, ninjutsu, genjutsu e speed**, mais HP e chakra máximos iguais a uma subida de nível na dificuldade atual.

- O prodígio do taijutsu continua com ninjutsu e genjutsu zerados (o estágio não os afeta).
- Fontes: Treino (+1), vitória no jokenpô (+2), roleta de recompensa.