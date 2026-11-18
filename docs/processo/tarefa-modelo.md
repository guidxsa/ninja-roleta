# Modelo de contrato de tarefa

Copie para `docs/tarefas/<tema>.md`, com `<tema>` igual ao nome da branch `feature/<tema>`. O agente preenche a partir do pedido e o usuário aprova **antes** do código. Mudou o escopo no meio do caminho: atualiza o contrato e pede nova aprovação. Regras em [AGENTS.md](../../AGENTS.md#como-trabalhar-dois-agentes).

Os campos do topo são lidos pela conferência de escopo (Fase 4 do [plano](plano-harness.md)): `escopo` e `fora` são padrões de caminho (glob) a partir da raiz do repositório. `issue` só existe na correção automática de uma issue (branch `feature/issue-<n>`, [issues.md](issues.md)): apague a linha nas outras tarefas.

```markdown
---
objetivo: Uma frase com o resultado esperado.
escopo: ["src/core/roleta/**", "tests/roleta*.test.ts", "docs/roleta/**", "CHANGELOG.md"]
fora: ["src/data/balance*", "prototype/**"]
pronto: ["npm run check verde", "sim:origens sem sair da meta"]
agente: claude | codex
revisor: codex | claude
issue: 12
---

# <Título da tarefa>

## Pedido
O que o usuário pediu, com as palavras dele quando der.

## Contexto
Docs e decisões lidas (`docs/...`, item de `docs/decisoes.md`), e por que a mudança é necessária.

## Plano
Passos curtos, na ordem da skill que se aplica (por exemplo `nova-mecanica`: dados → core → testes → simulação → protótipo → docs).

## Fora do escopo
O que não será feito nesta tarefa, mesmo que pareça relacionado.

## Decisões para o usuário
Perguntas em aberto ou escolhas feitas sem ele (vão também para `docs/registro.md`).

## Achados
Preenchido durante o trabalho: bugs, melhorias ou docs desatualizados vistos fora do escopo, sem corrigir, cada um com o número da issue aberta para ele ([issues.md](issues.md)).
```
