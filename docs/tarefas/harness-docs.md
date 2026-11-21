---
objetivo: Os docs do processo batem com o fluxo do staging, a release tem regra de contrato antes de 02/12/2026 e os arquivos locais do usuário não quebram as verificações.
escopo: ["AGENTS.md", "docs/processo/fluxo.md", "docs/processo/revisao.md", "docs/processo/issues.md", "docs/processo/metricas.md", "docs/processo/codex.md", "docs/processo/plano-harness.md", ".claude/skills/lancar-versao/SKILL.md", ".github/workflows/ci.yml", ".github/workflows/issues-claude.yml", ".github/workflows/revisao-claude.yml", "scripts/check-escopo.ts", "scripts/check-regras.ts", "scripts/metricas.ts", "tests/checkEscopo.test.ts", ".gitignore", "docs/tarefas/harness-docs.md"]
fora: ["src/**", "prototype/**", "public/**", "package.json", "package-lock.json", ".githooks/**", ".claude/settings.json", ".claude/hooks/**", ".github/workflows/staging.yml", ".github/workflows/aprovacao.yml", ".github/workflows/pages.yml", "scripts/harness.ts", "scripts/check-aprovacao.ts"]
pronto: ["npm run check verde", "teste novo no checkEscopo para a branch de release", "nenhum doc ou comentário do processo diz que o merge no staging é do usuário", "PR para o staging sem Co-Authored-By"]
agente: claude
revisor: claude (revisão com contexto zerado por @claude revise) + usuário; a revisão do Codex fica dispensada por falta de cota (decisão do usuário em 21/11/2026)
---

# Docs do processo alinhados ao staging

## Pedido

Segunda das três tarefas que saíram da avaliação do processo de 21/11/2026 (issues #47 a #63), resolvidas só pelo Claude e entrando no staging para a v0.96.0. A primeira foi a `harness-portao` (#64). Esta é a dos docs e da release, que tem prazo: a #63 precisa estar no staging antes de "prepara a v0.96.0" e antes de 02/12/2026, quando o `check:escopo` passa a exigir contrato.

## Contexto

- Issues: #56, #58, #60, #61, #63.
- Desde 18-19/11/2026 o PR entra sozinho no staging (auto-merge com `check`, `meta` e `revisao-cruzada`); o merge do usuário é só no `master`.
- O Impeccable já está descrito na seção "Skills e fluxos" do AGENTS.md (parte da #58 resolvida antes). O que sobra é a cópia local das outras cinco skills em `.agents/skills/`, que existe só no clone do usuário, fora do git.
- O portão `revisao-cruzada` só existe para PR com base `staging`; o `master` exige `check` e `meta` e o merge do usuário.

## Plano

1. **Merge no staging é automático (#56).** Trocar "o merge é do usuário" pelo fluxo real (staging automático, `master` do usuário) em AGENTS.md ("Dois agentes" e "Issues"), `revisao.md`, `issues.md`, os comentários de cabeçalho do `issues-claude.yml`, `ci.yml` e `revisao-claude.yml` (onde ainda dizem `origin/master` mas comparam com a base do PR) e o comentário do `check-regras.ts`. Só texto e comentário: nenhuma lógica muda. Exceção: se o `scriptsChanged` do `check-regras.ts` de fato só compara com o `master`, vira achado com issue, não correção aqui.
2. **"Concluída" nas métricas (#56).** `metricas.md` e o comentário em `scripts/metricas.ts`: concluída = PR mergeado no staging (decisão 1). O cálculo não muda (já é `state === 'MERGED'`).
3. **Contrato da release (#63, decisão 2).** No `check:escopo`, a branch `feature/release-v<x.y.z>` tem contrato implícito: o diff só pode ter `CHANGELOG.md`, `changelog.d/*.md` (os fragmentos apagados) e a versão no `package.json`/`package-lock.json`; qualquer outro arquivo é erro. Não precisa de `docs/tarefas/` nem da etiqueta `contrato-aprovado`: o "prepara a v0.Y.0" do usuário é a aprovação, e o que passa já é o que toda tarefa pode mudar. Teste novo; `fluxo.md` e a skill `lancar-versao` dizem isso.
4. **Hotfix (#61, decisão 3).** `fluxo.md` e a skill: no hotfix a revisão cruzada é pedida (`@codex review` ou `@claude revise`), mas não trava; quem garante é o merge do usuário, que confere a revisão antes. Sem portão no `master` (ele travaria também o PR permanente da release).
5. **Arquivos locais (#60).** `.gitignore` ganha as pastas de ferramenta (`.claude/agents/`, `.codex/agents/`, e `.agents/skills/` inteiro, conforme a decisão 4). AGENTS.md (uma frase em "Definição de pronto") e `codex.md`: nota pessoal ou arquivo local vai em `.git/info/exclude`, nunca no `.gitignore` versionado, porque o pre-push, o `check:escopo` e o hook Stop contam arquivo não rastreado como mudança.
6. **Cópia das skills (#58, decisão 4).** `codex.md`: o Codex lê `.claude/skills/` pela tabela do AGENTS.md; `.agents/skills/` guarda só o Impeccable. O `.gitignore` ignora `.agents/skills/` inteiro, e a cópia local das outras cinco você apaga no seu clone (não apago arquivo seu sem pedir).
7. `docs/registro.md` com as decisões, no mesmo commit.

## Fora do escopo

- Lógica do portão (`staging.yml`), hooks (`.githooks/`, `.claude/hooks/`), `harness.ts` e `.claude/settings.json`: a tarefa `harness-protecao` (#48, #50, #51, #52, #53, #55).
- Apagar os arquivos locais do usuário (`correcao-pr46.md`, `plano-codex-telas.md`, `prompts-codex-telas.md`, `.agents/skills/<cópias>`): ação do usuário no clone dele.
- #54 e o `.claude/settings.local.json`.

## Decisões do usuário (21/11/2026)

O usuário escolheu a opção recomendada nas quatro.

1. **#56, "concluída" nas métricas.** (recomendada) PR mergeado no staging: é onde o loop termina; a chegada ao `master` depende da data da release, não do agente. Alternativa: só quando chega ao `master`.
2. **#63, contrato da release.** (recomendada) contrato implícito no `check:escopo` para `feature/release-v<x.y.z>`, restrito a changelog e versão, sem etiqueta. Alternativa: a skill gera `docs/tarefas/release-v0.Y.0.md` e você põe `contrato-aprovado` a cada release.
3. **#61, hotfix.** (recomendada) revisão pedida mas não obrigatória; o seu merge é o portão. Alternativa: exigir `revisao-cruzada` no `master` também, o que obriga a abrir uma exceção para o PR permanente da release.
4. **#58, cópia das skills.** (recomendada) uma cópia só, em `.claude/skills/`; `.agents/skills/` só com o Impeccable e ignorado pelo git. Alternativa: link simbólico de `.agents/skills/<skill>` para `.claude/skills/<skill>` (no Windows, precisa do modo de desenvolvedor).

## Achados

- O `scriptsChanged` do `check-regras.ts` já compara com a base da branch (staging ou master); só o comentário dizia "master". Sem issue nova.
- Nenhuma inconsistência nova fora do escopo.
