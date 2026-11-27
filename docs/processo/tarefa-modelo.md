# Modelo de contrato de tarefa

Copie para `docs/tarefas/<tema>.md`, com `<tema>` igual ao nome da branch `feature/<tema>` (ou `hotfix/<tema>`, [fluxo.md](fluxo.md)). O agente preenche a partir do pedido. Com o usuário na conversa, mostra o contrato **antes** do código e, com o "aprovado" dele, grava `aprovado: AAAA-MM-DD`; mudou o escopo no meio do caminho, atualiza o contrato e pede de novo. Sem o usuário, segue: a revisão dele é a release ([fluxo.md](fluxo.md)). Regras em [AGENTS.md](../../AGENTS.md#como-trabalhar-dois-agentes).

Os campos do topo são lidos pela conferência de escopo (Fase 4 do [plano](plano-harness.md)): `escopo` e `fora` são padrões de caminho (glob) a partir da raiz do repositório. `agente` diz quem implementa, pela área de cada um (`codex` no visual, `claude` na implementação; [AGENTS.md](../../AGENTS.md#dois-agentes)): o `check:escopo` avisa quando o diff entra na área do outro, e só contrato com `agente: codex` pode ser [delegado](delegacao.md). `aprovado` é opcional e a CI não confere. `issue` só existe na correção automática de uma issue (branch `feature/issue-<n>`, [issues.md](issues.md)): apague a linha nas outras tarefas.

```markdown
---
objetivo: Uma frase com o resultado esperado.
escopo: ["src/core/roleta/**", "tests/roleta*.test.ts", "docs/roleta/**", "CHANGELOG.md"]
fora: ["src/data/balance*", "prototype/**"]
pronto: ["npm run check verde", "sim:origens sem sair da meta"]
agente: claude | codex
aprovado: 2026-11-26
issue: 12
---

# <Título da tarefa>

## Pedido
O que o usuário pediu, com as palavras dele quando der.

## Contexto
Docs e decisões lidas (`docs/...`, item de `docs/decisoes.md`), e por que a mudança é necessária.

## Plano
Passos curtos, na ordem da skill que se aplica (por exemplo `nova-mecanica`: dados → core → testes → simulação → protótipo → docs).

## Briefing visual (só no contrato delegado ao Codex)
Arquivos e telas, cenários do UI Lab para conferir, o que melhorar e por quê, e os ids, `data-*` e classes que não mudam ([delegacao.md](delegacao.md)).

## Fora do escopo
O que não será feito nesta tarefa, mesmo que pareça relacionado.

## Decisões para o usuário
Perguntas em aberto ou escolhas feitas sem ele (vão também para `docs/registro.md`).

## Achados
Preenchido durante o trabalho: bugs, melhorias ou docs desatualizados vistos fora do escopo, sem corrigir, cada um com o número da issue aberta para ele ([issues.md](issues.md)).
```
