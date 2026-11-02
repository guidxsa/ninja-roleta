# Árvores de talentos

> Implementada na v0.35.0 ([README.md](README.md)). Dados em `src/data/jornada/talents.ts`.

Três ramos de quatro nós. Cada nó pede o anterior do mesmo ramo e custa pontos de talento ([progressao.md](progressao.md)). A árvore **reinicia a cada run**.

- **Ramos canônicos** abrem pelo estágio da história: Kyuubi depois do Haku (estágio 2), Rasengan quando o Jiraiya ensina (estágio 3).
- **Nós da conta** ficam liberados de vez por um objetivo: a Ōdama Rasengan pede a conquista *Vale do Fim* (vencer a run canônica).
- O Modo Sennin ficou de fora: é pós-timeskip, e a run termina no Vale do Fim. No lugar entrou o ramo da Kyuubi.

| Ramo | Nó | Custo | Efeito |
|---|---|---|---|
| Clones | Multiclones | 1 | Kage Bunshin cria 1 clone a mais |
| Clones | Rendan Uzumaki | 2 | Aprende o Rendan: 1 golpe + 1 por clone (até +3) |
| Clones | Guarda de clones | 2 | Começa toda luta com 1 clone; +2 de dano no taijutsu |
| Clones | Mil Clones | 3 | Aprende o Tajū Kage Bunshin: 2 golpes em todos os inimigos e 3 clones |
| Kyuubi | Chakra da raposa | 1 | Recupera 3% do HP por rodada |
| Kyuubi | Manto da Kyuubi | 2 | Ativa de classe: paga 8% do HP, ganha escudo de 20% |
| Kyuubi | Explosão de chakra | 2 | Aprende a Explosão (todos os inimigos); +20% de dano abaixo da metade do HP |
| Kyuubi | Fúria da Kyuubi | 3 | Uma vez por luta fica com 1 de HP em vez de cair; +10% de dano com HP baixo |
| Rasengan | Rasengan | 1 | Aprende o Rasengan |
| Rasengan | Domínio do Rasengan | 2 | Rasengan: +25% de dano, 2 de chakra a menos |
| Rasengan | Foco | 2 | +10% de crítico |
| Rasengan | Ōdama Rasengan | 3 | Aprende a Ōdama (conta: vencer a run canônica) |

## Comum (runs genéricas)

O ramo Elemento ensina as técnicas do elemento sorteado ([classes.md](classes.md#sorteio-do-elemento)).

| Ramo | Nó | Custo | Efeito |
|---|---|---|---|
| Elemento | Nível II | 1 | Aprende o nível II do elemento (Bola de Fogo, Rajada, Corrente elétrica, Lança de terra, Tubarão de água) |
| Elemento | Afinidade | 2 | +15% de dano de ninjutsu |
| Elemento | Nível III | 2 | Aprende o nível III (Grande Labareda, Esfera de vácuo, Lâmina de raio, Dragão de terra, Cachoeira) |
| Elemento | Mestre do elemento | 3 | Técnicas custam 2 de chakra a menos; +5% de crítico |
| Ferramentas | Kunai afiada | 1 | +2 de dano no taijutsu |
| Ferramentas | Selo explosivo | 2 | Aprende o Selo explosivo (todos os inimigos) |
| Ferramentas | Armadilha de fios | 2 | Aprende a Armadilha de fios |
| Ferramentas | Substituição | 3 | Esquiva 10%; o Bunshin cria 1 clone a mais |
| Determinação | Determinação | 1 | +25% de XP |
| Determinação | Garra | 2 | +25% de dano abaixo da metade do HP |
| Determinação | Esforço | 2 | +10% de dano |
| Determinação | Vontade do Fogo | 3 | Uma vez por luta fica com 1 de HP; recupera 2% do HP por rodada |

## Prodígio (runs genéricas)

| Ramo | Nó | Custo | Efeito |
|---|---|---|---|
| Portões | Quinto portão | 1 | Ativa nova: dano ×1,6 e +10% de acerto por 3 turnos, paga 15% do HP |
| Portões | Corpo treinado | 2 | Começa as lutas com escudo de 10% do HP |
| Portões | Lótus Primária | 2 | Aprende a Lótus Primária |
| Portões | Lótus Oculta | 3 | Aprende a Lótus Oculta (4 golpes, paga 15% do HP) |
| Juventude | Juventude | 1 | +5% de crítico e de acerto |
| Juventude | Furacão da Folha | 2 | Aprende o Furacão da Folha |
| Juventude | Punho Bêbado | 2 | Aprende o Punho Bêbado (3 golpes, crítico alto) |
| Juventude | Primavera | 3 | +10% de dano; recupera 2% do HP por rodada |
| Treino | Pesos fora | 1 | Esquiva 5% |
| Treino | Entrada dinâmica | 2 | Aprende a Entrada dinâmica |
| Treino | Mestre do taijutsu | 2 | +15% de dano de taijutsu |
| Treino | Resistência | 3 | Uma vez por luta fica com 1 de HP |
