---
objetivo: Toda inconsistência achada vira uma issue descritiva no GitHub, e a que é erro claro é corrigida sozinha em loop (branch, PR com Closes #n, revisão cruzada), com o merge continuando do usuário.
escopo: ["AGENTS.md", "docs/processo/**", "docs/tarefas/harness-issues.md", ".github/ISSUE_TEMPLATE/**", ".github/pull_request_template.md", ".github/workflows/issues-claude.yml", ".github/workflows/revisao-claude.yml", ".github/workflows/ci.yml", "scripts/check-escopo.ts", "tests/checkEscopo.test.ts"]
fora: ["src/**", "prototype/**", ".githooks/**", ".claude/**", "package.json", "package-lock.json", ".github/workflows/pages.yml"]
pronto: ["npm run check verde", "testes do check:escopo cobrindo a aprovação pela issue e a trava de balanceamento", "docs descrevem triagem, modelo, loop e travas", "PR aberto com o teste real do loop descrito como pendente (só roda a partir do master)"]
agente: claude
revisor: codex
---

# Issues descritivas e loop de correção automática

## Pedido
"Ao serem encontradas inconsistências deverão ser adicionadas Issues Descritivas. Vocês devem operar tentando resolver as issues, quando o problema for claramente algum erro que não precisa de uma avaliação humana é para continuar na forma de loop, checando issue, resolvendo a partir de um PR e fechando a issue quando solucionado. Essas inconsistências podem ser encontradas em revisões, por exemplo."

Decisões do usuário: o loop roda num workflow do GitHub; o merge continua do usuário (a issue fecha no merge, pelo `Closes #n`); a issue com a etiqueta `correcao-automatica` vale como contrato aprovado.

## Contexto
Hoje o achado fora do escopo fica só em **Achados** no resumo (AGENTS.md, "Escopo") e a "melhoria futura" da revisão cruzada fica no comentário do PR (docs/processo/revisao.md): nada rastreia nem resolve depois. A revisão cruzada já tem loop e travas (`revisao-claude.yml`); o loop das issues reaproveita o mesmo token, as mesmas travas e entrega o PR para essa revisão.

## Plano
1. `check:escopo`: na branch `feature/issue-<n>`, contrato com `issue: <n>` e issue com `correcao-automatica` (etiquetas lidas pela CI em `CHECK_ISSUE_ETIQUETAS`) dispensam `contrato-aprovado`; `src/data/balance*` no diff é erro sem a aprovação do usuário. Testes antes.
2. `ci.yml`: passo que lê as etiquetas da issue no PR de `feature/issue-<n>`.
3. `issues-claude.yml`: gatilho por etiqueta, varredura diária (2 por execução) e manual; pula issue com branch, PR ou 2 tentativas sem PR; Claude corrige ou devolve para `precisa-decisao`; conferência de push e atribuição.
4. `revisao-claude.yml`: o revisor e o job `corrige` podem listar e abrir issues.
5. Modelo de issue, `docs/processo/issues.md` (fonte única), AGENTS.md (seção Issues, Escopo, Review guidelines), revisao.md, codex.md, tarefa-modelo.md, modelo de PR.
6. Etiquetas `inconsistencia`, `correcao-automatica` e `precisa-decisao` criadas no repositório.

## Fora do escopo
Merge automático; correção automática de balanceamento ou processo; loop rodando no Codex (o Codex abre issues e revisa o PR da correção).

## Decisões para o usuário
- Varredura diária às 09:17 UTC, 2 issues por execução e 2 tentativas por issue: números escolhidos sem o usuário, fáceis de mudar no workflow.
- A triagem (`correcao-automatica` ou `precisa-decisao`) é feita pelo agente que abre a issue, pelo critério de issues.md; o Claude no loop confere de novo e devolve o que não for erro claro.

## Achados
