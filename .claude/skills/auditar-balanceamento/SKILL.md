---
name: auditar-balanceamento
description: Mede o balanceamento do Ninja Roleta contra a meta de vitória do bot (Fácil 90, Médio 65, Difícil 40, Hardcore 15, ±5) e monta a tabela de antes e depois para o usuário decidir, sem ajustar nada sozinho. Use quando o usuário disser "tá fácil/difícil demais", "confere a meta", "como ficou o balanceamento", quando o check:meta da CI quebrar, ao fim de uma mecânica que mexe em dano, vida, chance ou recompensa (skill nova-mecanica, passo de simulação), ou antes de propor qualquer número novo.
---

# Auditar balanceamento (Ninja Roleta)

A regra do projeto: **balanceamento é proposto ao usuário com a tabela de antes e depois, nunca compensado sozinho** (AGENTS.md). Esta skill mede e propõe; quem decide é o usuário.

## 1. Situar

1. Leia o item de meta e os itens abertos de balanceamento em `docs/decisoes.md` e os cenários e comandos em `docs/balanceamento/benchmark.md`. No `docs/registro.md` (grande), busque com grep só a linha de base mais recente do modo.
2. Defina a pergunta: um modo inteiro, uma origem ou classe, uma dificuldade, uma relíquia? Isso escolhe o comando.

## 2. Medir o "antes"

Sempre 300 runs e seed 2 (a linha de base do projeto), no código **sem** a mudança (o `master`, ou o commit anterior com `git stash` / `git worktree`):

| Pergunta | Comando |
|---|---|
| Roleta por origem | `npm run sim:origens -- --runs 300 --seed 2` |
| Roleta, como as lutas correm | `npm run sim:origens -- --runs 300 --seed 2 --auditoria` |
| Jornada por modo e dificuldade | `npm run sim:jornada -- 300 2` |
| Só um modo ou dificuldade | `npm run sim:jornada -- 300 2 --modo=canon --dif=normal,hard` |
| Relíquias e iniciais | `--reliquias`, `--iniciais` (tempos em `benchmark.md`) |

Rode as simulações longas em segundo plano e salve a saída em arquivo (scratchpad), para comparar depois.

## 3. Medir o "depois"

O mesmo comando, mesma seed, com a mudança. Nada de comparar seeds ou runs diferentes.

## 4. Montar a tabela

Uma linha por origem ou classe, uma coluna por dificuldade, com antes → depois e a meta:

```
| Origem | Fácil (90) | Médio (65) | Difícil (40) | Hardcore (15) |
|---|---|---|---|---|
| Comum | 88 → 91 | 60 → 64 | 40 → 41 | 10 → 12 |
```

- Marque o que sai de ±5 da meta.
- Diga o que mais pesou (onde as runs param, rodadas por luta, da `--auditoria`), em uma ou duas frases.
- Diferença menor que ~4 pontos com 300 runs é ruído: diga isso, não venda como efeito.

## 5. Propor, não aplicar

1. Mostre a tabela e, se fizer sentido, **até três alavancas** (qual número em `src/data/balance.ts` ou nos dados, para quanto, efeito esperado). Não mude nenhuma sem aval.
2. Com o aval: aplique, meça de novo e mostre a tabela final.
3. Registre em `docs/registro.md` (frase curta + simulação de antes e depois). Se ficou algo para o usuário revisar, um item em `docs/decisoes.md`.

## Se o check:meta da CI quebrou

O `npm run check:meta` (60/40 runs, faixa larga) só avisa que a vitória mudou. Rode o passo 2 e o 3 com 300 runs para saber quanto e onde, e leve a tabela ao usuário. Nunca mexa em número, folga ou seed do `scripts/check-meta.ts` para fazer passar.
