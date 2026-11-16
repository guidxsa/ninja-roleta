# Benchmark de balanceamento

Cenários padronizados para acompanhar o desempenho dos três modos a cada mudança de balanceamento. O diagnóstico atual está em [diagnostico-2.md](diagnostico-2.md) (v0.87.0); o primeiro, em [diagnostico.md](diagnostico.md) (v0.77.0). A coleta fica em `src/sim/audit.ts` (funções puras que leem o log das lutas, sem gastar o rng); os números sem as flags de auditoria não mudam.

## Como rodar

| Medida | Comando | Tempo aproximado |
|---|---|---|
| Vitória por origem (Roleta) | `npm run sim:origens -- --runs 300 --seed 2` | 2 min |
| Auditoria do Roleta (nível, relíquias por raridade, como as lutas correm) | `npm run sim:origens -- --runs 300 --seed 2 --auditoria` | 2 min |
| Valor marginal das relíquias do Roleta (Comum, Médio) | `npm run sim:origens -- --runs 400 --seed 2 --reliquias` | 4 min |
| Vitória por run e dificuldade (Jornada) | `npm run sim:jornada -- 300 2` | 3 min |
| Auditoria da Jornada, por estágio | `npm run sim:jornada -- 300 2 --auditoria` | 3 min |
| Só um modo e algumas dificuldades | `npm run sim:jornada -- 300 2 --modo=canon --dif=normal,hard` (combina com `--auditoria`) | 20 s |
| Valor marginal das relíquias da Jornada (História e Comum, Difícil) e iniciais | `npm run sim:jornada -- 400 2 --reliquias` | 25 min |
| Só as iniciais das classes | `npm run sim:jornada -- 400 2 --iniciais` | 3 min |
| Builds da árvore do Naruto | `npm run sim:jornada -- 300 2 --ramos --talentos` | 5 min |
| Builds de uma classe do Caminho Ninja | `npm run sim:jornada -- 300 2 --ramos --classe=commonNinja` (ou `prodigy`, `uchihaNinja`, `hyuugaNinja`) | 4 min |
| Modo infinito do Caminho Ninja (até N ciclos) | `npm run sim:jornada -- 300 2 5` | varia |

Ruído: com 300 a 400 runs, diferenças abaixo de uns 7 pontos entre duas medidas podem ser só ruído. Para comparar antes e depois, use sempre a mesma seed.

## Indicadores

| Indicador | Roleta | Jornada |
|---|---|---|
| Vitória (taxa de conclusão) | por origem e dificuldade | por run, classe e dificuldade |
| Nível alcançado | ao fim do ciclo | ao fim de cada estágio |
| Pontos de talento (e quantos vieram de treino) e talentos novos | — | por estágio |
| Ryō recebido e gasto, compras | — | por estágio |
| Relíquias adquiridas | por raridade | — (ver o valor marginal) |
| HP e chakra ao entrar na luta | por categoria do vilão | protagonista e equipe, por estágio |
| Rodadas por luta | por categoria | por estágio |
| Dano causado e recebido por rodada | por categoria | por estágio |
| Consumíveis usados | itens por luta | kits por estágio |
| Aliados caídos | — | por luta |
| Vontade do Fogo usada | por run | por estágio |
| Derrota por desgaste ou de frente | — | por estágio |
| Ciclo máximo no infinito | `--ciclos` | argumento `ciclos` |

Nas colunas por estágio da Jornada, os totais (pontos, ryō, compras, kits, Vontades, derrotas) são médias **por run iniciada**: as runs que caíram antes contam como zero nos estágios seguintes. As colunas de luta (entrada, rodadas, dano, caídos) são médias por luta.

## Cenários de referência

| Cenário | Como medir | Linha de base (v0.77.0, seed 2) | Atual (v0.82.0) |
|---|---|---|---|
| Roleta no Difícil | `sim:origens` | Comum 16%, Prodígio 62%, Uchiha 10%, Hyuuga 12%, Senju 67% | Comum 39%, Prodígio 75%, Uchiha 21%, Hyuuga 35%, Senju 78% (Akimichi 37%) |
| História com o Naruto | `sim:jornada` (canon) | Médio 97%, Difícil 68%, Hardcore 12%; nível médio 8,6 no Médio | Médio 74%, Difícil 20%, Hardcore 2%; nível médio 8,7 |
| Comum no Caminho Ninja | `sim:jornada` (generic:common) | Médio 80%, Difícil 53% | Médio 90%, Difícil 66% |
| Prodígio no Caminho Ninja | `sim:jornada` (generic:prodigy) | Médio 89%, Difícil 49% | Médio 94%, Difícil 68% |
| Uchiha no Caminho Ninja | `sim:jornada` (generic:uchiha) | Médio 74%, Difícil 34% | Médio 81%, Difícil 45% |
| Hyuuga no Caminho Ninja | `sim:jornada` (generic:hyuuga) | Médio 81%, Difícil 43% | Médio 88%, Difícil 53% |
| Caminho Ninja no Hardcore | `sim:jornada` | 11% a 13% nas quatro classes; a maioria cai no estágio 1 | 11% a 29% |
| Infinito | `sim:jornada -- 300 2 5` | a medir na Etapa 4 | — |

## Linha de base detalhada (v0.77.0)

Os números por versão depois desta (v0.78.0 a v0.80.0) estão no [registro](../registro.md).

### Roleta, Médio (`--auditoria`)

| Origem | Vitória | Nível no fim | Relíquias (com/inc/rara/chefe) | Vontades usadas | Chefe: rodadas, dano dado/recebido por rodada |
|---|---|---|---|---|---|
| Comum | 48% | 5,9 | 2,5 / 1,5 / 1,1 / 0,5 | 0,71 | 12,5 · 25,4 / 16,5 |
| Akimichi | 72% | 5,8 | 2,4 / 1,7 / 1,1 / 0,7 | 0,58 | 14,3 · 23,4 / 16,5 |
| Inuzuka | 70% | 5,7 | 2,4 / 1,7 / 1,1 / 0,7 | 0,57 | 11,6 · 29,4 / 14,2 |
| Prodígio | 87% | 6,1 | 2,5 / 1,8 / 1,2 / 0,9 | 0,36 | 8,2 · 41,7 / 18,3 |
| Uchiha | 34% | 5,0 | 2,4 / 1,6 / 1,1 / 0,3 | 0,83 | 13,0 · 21,3 / 16,1 |
| Hyuuga | 43% | 5,2 | 2,4 / 1,6 / 1,0 / 0,4 | 0,87 | 13,0 · 22,5 / 16,1 |
| Uzumaki | 65% | 5,6 | 2,4 / 1,7 / 1,1 / 0,6 | 0,62 | 14,7 · 22,4 / 16,2 |
| Senju | 85% | 6,0 | 2,5 / 1,8 / 1,1 / 0,8 | 1,01 | 15,7 · 21,7 / 15,9 |

### Jornada, Médio (`--auditoria`)

| Run | Estágio | Nível | Pontos (de treino) | Ryō +/− | HP/chakra ao entrar | Rodadas | Dano dado/recebido por rodada | Caídos por luta |
|---|---|---|---|---|---|---|---|---|
| História | 1 | 4,0 | 11,2 (1,0) | 236 / 168 | 93% / 75% | 5,4 | 47 / 22 | 0,39 |
| História | 2 | 6,7 | 10,0 (0,6) | 276 / 234 | 83% / 64% | 5,6 | 71 / 30 | 0,37 |
| História | 3 | 7,4 | 5,4 (1,0) | 64 / 155 | 98% / 98% | 6,4 | 62 / 6 | 0,00 |
| História | 4 | 8,7 | 7,9 (0,7) | 205 / 192 | 96% / 91% | 3,3 | 99 / 15 | 0,00 |
| Comum | 1 / 2 / 3 | 4,0 / 6,4 / 8,3 | 6,7 / 5,7 / 5,1 | ~205 / ~195 | 92–95% / 78–81% | 3,3 / 2,8 / 3,1 | 53 / 78 / 96 contra 20–22 | 0,57 / 0,27 / 0,39 |
| Prodígio | 1 / 2 / 3 | 3,7 / 5,8 / 7,4 | 6,4 / 5,6 / 5,1 | ~210 / ~195 | 93–98% / 60–66% | 3,5 / 2,7 / 2,7 | 51 / 83 / 113 contra 16–19 | 0,70 / 0,20 / 0,24 |
| Uchiha | 1 / 2 / 3 | 3,6 / 5,8 / 7,4 | 6,4 / 5,5 / 4,9 | ~205 / ~190 | 95–98% / 71–81% | 3,2 / 2,6 / 2,7 | 56 / 87 / 119 contra 19–21 | 0,70 / 0,13 / 0,48 |
| Hyuuga | 1 / 2 / 3 | 3,6 / 5,7 / 7,4 | 6,1 / 5,1 / 4,7 | ~200 / ~185 | 91–98% / 92–97% | 3,7 / 2,7 / 2,4 | 49 / 85 / 125 contra 14–19 | 0,81 / 0,23 / 0,15 |

### Relíquias (`--reliquias` e `--iniciais`)
Tabelas completas e o que elas mostram em [diagnostico.md](diagnostico.md#p3-relíquias-de-equipe-dominam-as-situacionais-valem-quase-nada) (P3, P5 e P6). Linha de base do valor marginal: História 66,0% e Comum 49,8% no Difícil; Roleta, Comum, 46,8% no Médio.
