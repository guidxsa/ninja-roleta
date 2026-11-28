---
objetivo: Fechar as brechas e alinhar doc com código nas issues de processo #51, #52, #53, #54, #55, #58, #60, #68 e #81, sem afrouxar nenhuma regra.
escopo: ["scripts/check-escopo.ts", "scripts/check-regras.ts", "scripts/revisar-visual.ts", ".claude/hooks/stop-check.sh", ".claude/settings.json", ".claude/skills/revisar-visual/SKILL.md", ".github/workflows/ci.yml", ".github/workflows/issues-claude.yml", "AGENTS.md", "CLAUDE.md", "docs/processo/issues.md", "docs/processo/codex.md", "docs/processo/fluxo.md", "tests/checkEscopo.test.ts", "tests/checkRegras.test.ts", "tests/claudeSettings.test.ts", "tests/revisarVisual.test.ts", "tests/uilab.test.ts", "docs/tarefas/harness-incongruencias.md"]
fora: ["src/**", "prototype/**", "public/**", "package.json", "package-lock.json", ".codex/**", "skills-lock.json", ".gitignore"]
pronto: ["npm run check verde", "teste cobre os três balance.ts na correção automática", "toda negação Bash do settings.json tem a gêmea PowerShell (teste)", "revisar-visual reconhece meta.registry.bingo:story-full (teste)", "PR para o staging com Closes só das issues resolvidas"]
agente: claude
aprovado: 2026-11-27
---

# Incongruências do harness (#51, #52, #53, #54, #55, #58, #60, #68, #81)

## Pedido
Tarefa de processo pedida pelo usuário em 27/11/2026, no roteiro até o v1.0.0: resolver as incongruências do harness registradas nas issues abertas. "Resolver as incongruências do harness é importante." Fechar brechas e alinhar doc com código, sem liberar nada, sem mexer em jogo, balanceamento ou visual.

## Contexto
Lidos: `AGENTS.md`, `CLAUDE.md`, `docs/processo/fluxo.md`, `issues.md`, `delegacao.md`, `codex.md`, `tarefa-modelo.md`, cada issue com os comentários e o código do `origin/staging` (21044a6, release v0.97.0). Parte das issues foi resolvida pelas tarefas de processo de 21 a 26/11; a tabela abaixo diz o que ainda vale.

| Issue | Ainda vale? | Saída |
|---|---|---|
| #51 trava de balanceamento | Sim: `NUNCA_AUTOMATICO = ['src/data/balance*']` não pega `src/data/roleta/balance.ts` nem `src/data/jornada/balance.ts` | Corrigir |
| #52 negações só no Bash | Sim: só `gh` tem gêmea `PowerShell(...)`; `git commit -m x -n`, `git -c core.hooksPath=...`, `git push -u origin master` e `git push origin +x` passam | Corrigir (o `settings.local.json` é do usuário) |
| #53 lista PROTECTED | Em parte: `docs/processo/**`, `.claude/skills/**`, os modelos e o `staging.ts` já entraram. Faltam `.codex/**`, `skills-lock.json`, `scripts/metricas*.ts` (rodam no workflow com segredo), `scripts/limpar-branches.ts` (roda sozinho no SessionStart e apaga branch no GitHub) e `scripts/revisar-visual.ts` (ferramenta de verificação). O hook Stop diz espelhar a lista, mas não olha `docs/processo` | Corrigir |
| #54 hooks do Impeccable | Sim: `.codex/hooks.json` (versionado) e o `settings.local.json` rodam o launcher instalado fora do git | Corrigir pela opção aprovada (abaixo) |
| #55 dois `check` no mesmo commit | Em parte: o gatilho das etiquetas sumiu (PR #80), mas o `push` e o `pull_request` ainda criam dois check runs `check` e `meta` no mesmo commit, e só o do PR confere a etiqueta da issue do loop (`CHECK_PR`, `CHECK_ISSUE_ETIQUETAS`) e roda estrito | Corrigir |
| #58 cópias em `.agents/skills` | Resolvida no repositório: o `.gitignore` ignora `.agents/skills/`, o `codex.md` manda não copiar e o `impeccable` está na tabela do `AGENTS.md`. Na máquina, o clone principal ainda tem cópias velhas de 17/11 (diferentes do staging), que o Codex local carrega | Fechar como resolvida, mais um aviso local (abaixo) |
| #60 arquivos locais | Resolvida: o `AGENTS.md` ("Definição de pronto") e o `codex.md` ("Skills") mandam pôr arquivo local em `.git/info/exclude`, a saída que a issue pedia; o `.gitignore` já cobre as pastas do Impeccable | Fechar como resolvida |
| #68 ids por template | Sim: `scenarioIds()` lê os ids por regex e não acha `meta.registry.bingo:story-full` | Corrigir |
| #81 1280 × 1440 | Sim: a skill diz desktop 1280 px; o script fotografa 360, 390, 768, 1024 e 1440 | Corrigir |

## Plano
1. **#51**: `NUNCA_AUTOMATICO` passa a usar a mesma definição do `check:regras` (`BALANCE_FILE`, que cobre `src/data/**/balance*.ts`), e a `AREA_IMPLEMENTACAO` também (hoje repete `src/data/*/balance*` à mão). Teste com os três arquivos na branch `feature/issue-<n>`. O prompt do `issues-claude.yml` e o `docs/processo/issues.md` passam a dizer `src/data/**/balance*`.
2. **#52**: no `.claude/settings.json`, cada negação `Bash(...)` ganha a gêmea `PowerShell(...)`, e entram os padrões que faltam: push no `master`/`main`/`staging` com flag antes (`git push * master*`), push forçado com `+` (`git push * +*`), `-n` depois de outra flag (`git commit * -n*`) e qualquer forma de mexer no `core.hooksPath` (`git *core.hooksPath*`, que cobre `git -c` e `git config --local`). Teste em `tests/claudeSettings.test.ts`: toda negação Bash tem a gêmea PowerShell, e uma lista de comandos proibidos casa com alguma negação das duas ferramentas. Negação vence liberação no Claude Code, então a sobra `PowerShell(git push -u origin master --tags)` do `settings.local.json` deixa de valer mesmo antes de o usuário limpá-la. `CLAUDE.md` passa a dizer "no Bash e no PowerShell".
3. **#53**: `PROTECTED` ganha `.codex/**`, `skills-lock.json`, `scripts/metricas*.ts`, `scripts/limpar-branches.ts` e `scripts/revisar-visual.ts`; o hook Stop passa a olhar `docs/processo`, `.codex` e `skills-lock.json`. Teste no `checkRegras.test.ts`. O `AGENTS.md` cita os scripts que os workflows e hooks executam entre os arquivos de processo.
4. **#54**: pela opção aprovada (ver "Decisões"). Na recomendada: o `.codex/hooks.json` e o `skills-lock.json` ficam protegidos (passo 3), e o `AGENTS.md` e o `codex.md` registram o risco e a regra: atualizar o Impeccable só numa tarefa de processo, com o `skills-lock.json` no mesmo commit.
5. **#55**: no `ci.yml`, o job do `push` passa a se chamar `check (push)` e `meta (push)`; só o do `pull_request` se chama `check` e `meta`, os exigidos pela proteção. O push continua verificando a branch; ele só não conta (nem trava, cancelado) o portão. `fluxo.md` e `codex.md` dizem isso.
6. **#58**: `check:regras`, na máquina (fora da CI), avisa quando há em `.agents/skills/` uma pasta com o nome de uma skill de `.claude/skills/` (cópia que fica velha). Função pura com teste.
7. **#68**: `scenarioIds()` passa a vir de `SCENARIOS` (`prototype/lab/registry.ts`), como o `tests/uilab.test.ts`, que já o importa sem DOM. Teste em `tests/revisarVisual.test.ts` com `meta.registry.bingo:story-full`. O teste de isolamento do lab (`tests/uilab.test.ts`) ganha a exceção do `scripts/revisar-visual.ts`, ferramenta do lab como os `scripts/lab-*.ts`; o jogo e o build do jogo continuam sem importar do lab (escopo ampliado com o usuário em 27/11/2026).
8. **#81**: pela opção aprovada. Na recomendada: o script ganha 1280×800 (o limite da faixa Widescreen do `docs/visual.md`) e mantém 1440×900; a skill passa a listar os tamanhos que o script usa.
9. **Achado no caminho**: `docs/processo/fluxo.md:41` ainda cita a etiqueta `contrato-aprovado`, que não existe mais (AGENTS.md: "não há etiqueta"). Tirar a menção.
10. `npm run check`, registro em `docs/registro.md`, commit sem `Co-Authored-By`, push da branch e PR para o `staging` com `Closes #51, #52, #53, #54, #55, #58, #60, #68, #81` só para as que este PR resolve de fato (a #58 e a #60 com a prova no PR).

## Fora do escopo
- Jogo, balanceamento, visual (`src/`, `prototype/`, `public/`).
- O conteúdo do Impeccable (`.codex/hooks.json`, `skills-lock.json`, a skill instalada): só a proteção e o doc.
- Arquivos pessoais fora do git: o `.claude/settings.local.json` e as cópias em `.agents/skills/` do clone principal. Só o usuário mexe (ou o agente, com o "sim" dele).
- O `plano-harness.md`, que é histórico e pode citar a etiqueta antiga.
- Proteção de branch no GitHub: não muda (os nomes exigidos continuam `check` e `meta`).

## Decisões para o usuário
1. **#54, Impeccable**. (a) **Recomendada**: manter os hooks, proteger `.codex/**` e `skills-lock.json` e documentar o risco. O código que roda segue fora do git, mas mudar qual versão ou qual hook roda passa a exigir tarefa de processo; na delegação o Codex roda num worktree sem `.agents/skills/`, onde os hooks não fazem nada. (b) Tirar os hooks do `.codex/hooks.json` versionado e deixá-los só na configuração pessoal de cada um: some o código de terceiros automático no repo, mas desfaz a configuração que você montou para o Codex. (c) Versionar a skill no repo e proteger: revisão de verdade, ao custo de trazer código de terceiros grande para o git e atualizá-lo à mão.
2. **#81, tamanho do desktop**. (a) **Recomendada**: 1280 e 1440 (uma foto a mais por cenário e variante). (b) Trocar 1440 por 1280. (c) Manter 1440 e corrigir só a skill.
3. **#55, nome do job do push**. (a) **Recomendada**: `check (push)` e `meta (push)`. (b) Manter e fechar a issue registrando o risco.
4. **#52 e #58, arquivos pessoais**: posso tirar as quatro liberações antigas (v0.3.1) do `.claude/settings.local.json` e apagar as cópias velhas em `.agents/skills/` do clone principal (deixando o `impeccable`)? Ou você faz.

## Achados
- `docs/processo/fluxo.md:41` cita a etiqueta `contrato-aprovado`, removida (corrigido nesta tarefa, passo 9).
- Resíduo do #52 que nenhum padrão pega sem negar commit comum: flags curtas juntas (`git commit -an`). O pre-commit pula, mas o pre-push e a CI continuam barrando.
