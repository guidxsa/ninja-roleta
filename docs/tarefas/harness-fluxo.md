---
objetivo: O staging vira playground sem revisão cruzada, só com check e meta; a revisão humana passa a ser a release (staging → master); cada agente tem a sua área, e o Claude delega ao Codex local o que é visual.
escopo: ["AGENTS.md", "CLAUDE.md", "docs/processo/**", "docs/tarefas/harness-fluxo.md", ".github/workflows/staging.yml", ".github/workflows/revisao-claude.yml", ".github/workflows/aprovacao.yml", ".github/workflows/ci.yml", ".github/workflows/issues-claude.yml", ".github/pull_request_template.md", "scripts/check-escopo.ts", "scripts/check-aprovacao.ts", "scripts/check-regras.ts", "scripts/staging.ts", "scripts/delegar.ts", "package.json", "tests/checkEscopo.test.ts", "tests/checkAprovacao.test.ts", "tests/checkRegras.test.ts", "tests/staging.test.ts", "tests/delegar.test.ts", ".claude/settings.json", ".claude/skills/lancar-versao/SKILL.md", ".claude/skills/revisar-visual/SKILL.md", ".claude/skills/novo-retrato/SKILL.md"]
fora: ["src/**", "prototype/**", "public/**", "docs/base/**", "docs/roleta/**", "docs/jornada/**", "docs/reserva/**", ".githooks/**", ".github/workflows/pages.yml", "scripts/harness.ts", "package-lock.json"]
pronto: ["npm run check verde", "testes ajustados para o check:escopo sem etiqueta e para a seção de processo do PR permanente", "npm run delegar testado com uma tarefa visual pequena, escolhida e aprovada pelo usuário", "PR para o staging com merge do usuário (PR de processo não entra sozinho)"]
agente: claude
revisor: usuário (no merge deste PR e na release)
aprovado: 2026-11-26
---

# Staging como playground, revisão na release e delegação por área

## Pedido

Conversa de 26/11/2026, depois da revisão do fluxo dos agentes:

- "gostaria de remover o revisao cruzada. e a aprovacao/revisao humana deve ser entre a staging > master. A staging é uma branch que eu ainda permito erros, como um playground."
- "deixar o codex com as mudanças visuais e voce com as implementações novas/balanceamento/estruturação. O codex parece ser superior com as skills do impecable"
- Sobre delegar: "eu faço um prompt para voce que seria mais adequado para o codex pelo contrato e voce simplesmente aciona o codex". Caminho escolhido: o Codex CLI local (`codex exec`), já instalado e logado (codex-cli 0.172.0, teste só de leitura em 26/11 com saída 0).

## Contexto

- **A revisão cruzada não funcionava na prática.** 9 dos últimos 13 PRs entraram com `revisao-dispensada`. Motivos: cota do Codex (decisão de 21/11) e a action do Claude, que recusa rodar quando o `revisao-claude.yml` do PR difere do que está no `master` (#79).
- **O caminho do comentário do Codex no portão** roda o `staging.yml` do `master`, que ainda tem a lógica antiga. Por isso as correções da #49 e da #62 não valem até a release.
- **A etiqueta `contrato-aprovado`** só existe no PR, depois do código pronto, e cerca de metade dos PRs recentes entrou sem ela. A partir de 02/12/2026 a falta dela vira erro.
- **Os agentes locais usam o `gh` com a conta do usuário**, então a CI não os distingue dele. As travas passam a mirar o erro, não a sabotagem: a trava dura é a release, que só o usuário publica.
- **Issues de processo resolvidas por esta tarefa:** #48, #49, #50, #57, #59, #61, #62, #79 e, em parte, #53.

## Plano

1. **Staging sem portão de revisão.**
   - Sai o job `portao` do `staging.yml` e o status `revisao-cruzada`.
   - O auto-merge passa a esperar só `check` e `meta`.
   - PR de processo (`feature/harness*`) não recebe auto-merge: o merge é do usuário (#50).
2. **Sem revisão cruzada automática.**
   - Saem os jobs `automatica` e `corrige` do `revisao-claude.yml` e o loop de rodadas.
   - Fica o `@claude revise` à mão (job `comentario`).
   - O "Implementou" sai do modelo de PR (#48).
   - O `revisao.md` encolhe para a revisão à mão e a revisão da release.
3. **Contrato sem etiqueta.**
   - Saem o `aprovacao.yml`, a etiqueta `contrato-aprovado` e a conferência no `check:escopo` e no `ci.yml`.
   - Saem a `revisao-dispensada` e o modo `codex` do `check-aprovacao.ts`. O que ainda servir (a `correcao-automatica` posta pelo dono, no loop de issues) continua.
   - O contrato continua obrigatório a partir de 02/12/2026, como plano e limite de escopo.
   - A aprovação no chat fica registrada no campo opcional `aprovado: AAAA-MM-DD`. A CI não confere esse campo.
4. **Release como revisão humana.**
   - O PR permanente ganha uma seção com cada arquivo de processo alterado no lote: workflows, hooks, `AGENTS.md`, `CLAUDE.md`, scripts de verificação, skills e `docs/processo/` (`scripts/staging.ts`).
   - No "prepara a v0.Y.0", o agente roda uma revisão de IA local do lote inteiro (`codex exec review` ou um subagente do Claude) e publica no PR permanente. Ela só informa e não trava nada (skill `lancar-versao`).
5. **Área de cada agente.**
   - A tabela "Skills e fluxos" do `AGENTS.md` ganha a coluna "quem faz": Codex no visual (CSS, layout, acabamento, Impeccable, `revisar-visual`, retratos e imagens); Claude em mecânica nova, balanceamento, estrutura, dados salvos, core, testes, docs de regra e processo.
   - Tarefa com as duas partes vira duas branches em sequência: o Claude entrega a funcionalidade com ids, `data-*` e classes estáveis e um briefing visual; o Codex faz o acabamento depois do merge.
   - O `check:escopo` dá **aviso** quando o `agente:` do contrato não bate com a área dos arquivos: Claude em `prototype/styles/**` ou `public/img/**`; Codex em `src/core/**` ou nos `balance`.
6. **Delegação ao Codex local (`npm run delegar -- <tema>`, `scripts/delegar.ts`).** O Claude:
   1. escreve o contrato com `agente: codex` e o briefing visual;
   2. roda o script, que cria o worktree da `feature/<tema>` a partir do `origin/staging` numa pasta fora do OneDrive e commita o contrato;
   3. o script roda `codex exec -s workspace-write -C <worktree> -o <resultado>` com o prompt padrão (ler `AGENTS.md` e o contrato, implementar, `npm run check`, sem rede);
   4. com o Codex terminado, o Claude confere o resultado e o `check`, commita o que ele fez, dá push da branch (o `pre-push` roda) e abre o PR com base `staging`.
   - O Codex não commita, não dá push nem abre PR: o sandbox dele fica sem rede e com o `.git` só de leitura (visto no 1º teste, PR #82; o plano dizia que ele commitaria). A regra de um agente por branch continua: o Claude só escreve o contrato antes e, depois, confere, commita e publica.
   - O guia fica em `docs/processo/delegacao.md`.
7. **Proteção do processo (#53, em parte).** A `PROTECTED` do `check-regras.ts` ganha `docs/processo/**`, `.claude/skills/**`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/**`, `scripts/staging.ts` e `scripts/delegar.ts`.
8. **Docs no mesmo commit.**
   - Atualizar: `AGENTS.md` ("Escopo", "Definição de pronto", "Dois agentes", "Issues", "Review guidelines"), `fluxo.md`, `revisao.md`, `codex.md`, `issues.md`, `tarefa-modelo.md` e as skills que citam revisão cruzada ou dono da tarefa.
   - Registrar no `docs/registro.md`.
   - O PR leva `Closes` para #48, #49, #50, #57, #59, #61, #62 e #79, que o `staging.yml` fecha no merge. A #53 recebe um comentário com o que ficou de fora.

## Fora do escopo

- **Delegação do Codex para o Claude** (`claude -p` a partir do Codex): fica para depois de a ida estar testada.
- **#51, #52, #54, #55 e #60:** continuam abertas, sem mudança.
- **Hooks do Impeccable no Claude Code:** estão no `.claude/settings.local.json`, que é pessoal e fica fora do git. A troca é do usuário.
- **Configuração no GitHub, que é do usuário:**
  - tirar `revisao-cruzada` dos checks obrigatórios do staging;
  - desligar a revisão automática do Codex;
  - apagar as etiquetas `contrato-aprovado` e `revisao-dispensada`.
  A lista vai no PR.
- **Mudar o `master`, a tag ou o deploy:** este PR vai para o staging, e o processo novo vale no caminho do comentário só depois da release.

## Decisões para o usuário

1. **Esta tarefa num PR só ou em dois.** Um só (staging, contrato e release) seria mais fácil de revisar de uma vez; dois, com a delegação à parte, separariam o risco. Recomendação: um só, porque as mudanças se tocam no `AGENTS.md`.
2. **Revisão da release:** `codex exec review` (recomendado, porque não gasta a cota do Claude e dá uma segunda opinião de outro modelo) ou subagente do Claude.
3. **Pasta dos worktrees do Codex:** fora do OneDrive, por exemplo `C:\Users\guird\worktrees\ninja\<tema>`. O OneDrive já travou a remoção de worktrees em `.git/worktrees/`.
4. **Data de 02/12/2026:** passa a exigir só o contrato, sem etiqueta. Se preferir, pode ser adiada.

## Achados

- `scripts/metricas.ts:217`: comentário ainda cita `revisao-cruzada` (fora do escopo).
- #53: corrigida só em parte (faltam `scripts/metricas*.ts`, `.agents/**` e `.codex/**`).
- #81: `revisar-visual` fala em 1280 px e o script usa 1440 px (achado do Codex no 1º teste).
