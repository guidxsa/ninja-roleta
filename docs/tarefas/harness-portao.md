---
objetivo: O portão do staging e as etiquetas de aprovação só abrem com aprovação real, do commit revisado e do contrato como estava quando o usuário aprovou.
escopo: [".github/workflows/staging.yml", ".github/workflows/ci.yml", ".github/workflows/revisao-claude.yml", ".github/workflows/aprovacao.yml", "scripts/check-escopo.ts", "scripts/check-aprovacao.ts", "tests/checkEscopo.test.ts", "tests/checkAprovacao.test.ts", ".claude/settings.json", "AGENTS.md", "docs/processo/fluxo.md", "docs/processo/revisao.md", "docs/processo/issues.md", "docs/processo/codex.md", "docs/processo/plano-harness.md", "docs/tarefas/harness-portao.md"]
fora: ["src/**", "prototype/**", "public/**", "package.json", "package-lock.json", ".githooks/**", ".github/workflows/issues-claude.yml", ".github/workflows/pages.yml", "scripts/harness.ts", "scripts/check-regras.ts"]
pronto: ["npm run check verde", "testes novos para a leitura do estado do Codex, o filtro de etiquetas por autor e a aprovação vencida", "leitura do estado do Codex conferida contra os comentários reais dos PRs #42, #44 e #45", "PR para o staging sem Co-Authored-By"]
agente: claude
revisor: claude (revisão com contexto zerado por @claude revise) + usuário; a revisão do Codex fica dispensada por falta de cota (decisão do usuário em 21/11/2026)
---

# Portão e aprovações que não se abrem sozinhos

## Pedido

Avaliação do processo em 21/11/2026, que virou as issues #47 a #63. O usuário pediu para resolver as issues só com o Claude (cota do Codex zerada) e pôr tudo no staging atual, junto com a reformulação do plano A, na v0.96.0. Esta é a primeira de três tarefas: portão e aprovações. As outras (`harness-protecao` e `harness-docs`) terão contrato próprio.

## Contexto

- Issues: #47, #49, #57, #59, #62 (resolvidas aqui); #48 (decisão abaixo).
- O Codex publica, em todo PR que revisa, um comentário com um bloco legível por máquina, editado a cada revisão:
  `<!-- codex-review-state:v1 {"code_review":{"commit_sha":"<sha completo>","has_any_findings":false,"has_unresolved_findings":false,"status":"completed"}, ...} -->`
  (visto nos PRs #42, #44 e #45). Ele diz o commit revisado e se sobrou achado, sem depender da frase "Didn't find any major issues" nem de horário.
- Os agentes locais (Claude Code e Codex) usam o `gh` autenticado como o usuário: no GitHub, a etiqueta que eles põem aparece como posta pelo dono. Conferir o autor da etiqueta barra só os agentes que rodam no Actions (revisão do Claude, loop das issues, bots); os locais ficam barrados pelas negações do `.claude/settings.json` (Claude) e pela regra escrita (Codex, que não tem negação equivalente).

## Plano

1. **Portão pela aprovação do Codex (#49, #62).** No `staging.yml`, o job `portao` passa a reagir a comentário criado **ou editado** pelo `chatgpt-codex-connector[bot]` e lê o bloco `codex-review-state:v1` do comentário de resumo: verde só se `status` é `completed`, `has_unresolved_findings` é `false` e `commit_sha` é igual à ponta do PR. Sai a comparação de horários e a busca pela frase. Se o Codex comentar e o bloco não existir ou não puder ser lido, um aviso no PR (uma vez, com marcador), para o formato novo não travar o portão em silêncio.
2. **Etiquetas valem só postas pelo dono (#47, #59).** Novo `scripts/check-aprovacao.ts`, chamado pelo `ci.yml` no PR: lê a timeline do PR (e da issue, em `feature/issue-<n>`) e devolve só as etiquetas cujo último evento `labeled` tem `actor` igual ao dono do repositório. O `check:escopo` recebe essa lista em vez da lista crua. O mesmo filtro vale para `revisao-dispensada` no portão.
3. **Aprovação vencida (#59).** Novo workflow `aprovacao.yml` (`pull_request_target`, tipo `labeled`, só para `contrato-aprovado`, sem checkout nem execução de código do PR): grava num comentário do `github-actions[bot]` o blob de cada `docs/tarefas/*.md` do PR naquele momento. O `check:escopo` compara com o blob atual do contrato: se mudou depois da etiqueta, a aprovação não vale (aviso até 02/12/2026, erro depois, como a falta da etiqueta), com a mensagem "tire e ponha a etiqueta de novo".
4. **Agente não põe etiqueta de aprovação (#47).** Negações no `.claude/settings.json` (Bash e PowerShell) para `gh` que ponha `contrato-aprovado`, `revisao-dispensada` ou `correcao-automatica`, e para `gh api` em etiquetas. AGENTS.md e `issues.md`: agente sempre abre issue com `precisa-decisao`; só o usuário põe `correcao-automatica`. O prompt da revisão do Claude (`revisao-claude.yml`) diz o mesmo.
5. **Sem o segredo (#57).** O job `automatica` comenta no PR (uma vez, com marcador) que o portão espera a revisão ou a `revisao-dispensada`; o cabeçalho do workflow e o `revisao.md` deixam de dizer que a revisão não é obrigatória.
6. Testes em `tests/checkAprovacao.test.ts` e `tests/checkEscopo.test.ts`; docs (`fluxo.md`, `revisao.md`, `issues.md`, `codex.md`, a linha 219 do `plano-harness.md`) e `docs/registro.md` no mesmo commit.

## Fora do escopo

- #48 (quem revisa), até a decisão abaixo.
- #50, #51, #53, #55 e a parte versionada da #52: tarefa `harness-protecao`.
- #56, #58, #60, #61, #63: tarefa `harness-docs`.
- #54 e o `.claude/settings.local.json`: decisão pessoal do usuário, sem PR.
- O job `corrige` (loop do PR do Claude) continua disparando pela revisão do Codex com achados, como hoje.

## Decisões para o usuário

1. **#48, quem revisa.** Os commits do Claude e do Codex local saem com o mesmo autor; o "Implementou" é a única diferença, e um agente sempre pode escrevê-lo errado. Opções:
   - **(recomendada)** cada agente com um e-mail de commit próprio (o Claude pelo `env` do `.claude/settings.json`; o Codex pela configuração dele), e a CI recusa o PR em que o "Implementou" não bate com os autores dos commits. Pega o erro, não um agente mal-intencionado (ele usa as suas credenciais). Fica para a tarefa `harness-protecao`, porque mexe na identidade dos commits.
   - aceitar o risco e só documentar.
2. **Revisão desta tarefa.** Sem o Codex, a revisão é o `@claude revise` (contexto zerado, mesmo modelo) mais a sua leitura, e o portão abre com `revisao-dispensada`, que só você põe.
3. **Negação de `gh` com etiquetas** (passo 4) também bloqueia o Claude local de **ler** com `gh issue list --label correcao-automatica`. Ele lê sem o filtro e filtra a saída.

## Achados

- O caminho do comentário do Codex no portão (`issue_comment`) roda a versão do `staging.yml` que está no `master`: a correção da #49 e da #62 só vale nesse caminho depois da release. Documentado em `fluxo.md`; sem issue nova.
- Nenhuma inconsistência nova fora do escopo.
