---
objetivo: Resolver as issues de processo #23, #24, #25, #28 e #29 com as decisões do usuário de 18/11/2026.
escopo: ["scripts/check-meta.ts", "vitest.config.ts", ".gitignore", "skills-lock.json", ".codex/hooks.json", ".claude/launch.json", "AGENTS.md", "docs/processo/codex.md", "docs/ui-lab/ARCHITECTURE.md", ".claude/skills/revisar-visual/SKILL.md", "scripts/revisar-visual.ts", ".claude/skills/nova-mecanica/evals/**", "tests/checkMeta.test.ts", "tests/docs-links.test.ts"]
fora: ["src/**", "prototype/**", "src/data/balance*", ".github/**", ".githooks/**", "package.json"]
pronto: ["npm run check verde", "npm run check:meta roda no Windows", "Vitest lista só os testes de tests/", "clone limpo tem launch.json, skills-lock.json, hooks do Codex e as instruções de instalação"]
agente: claude
revisor: codex
---

# Pendências de processo (#23, #24, #25, #28, #29)

## Pedido
"Resolva as pendências que estão em aberto no repositório." As issues com `precisa-decisao` foram decididas pelo usuário na sessão de 18/11/2026.

## Contexto
Issues abertas pela auditoria do Codex no commit `596f75d`. Decisões do usuário:

- **#23** `check:meta` no Windows: rodar as simulações com `process.execPath` e o CLI do `tsx` em `node_modules`, sem `npx` nem shell.
- **#24** Vitest e worktrees: `vitest.config.ts` com `include` em `tests/**` e `exclude` de `.claude/worktrees/**`; `.claude/worktrees/` no `.gitignore`.
- **#25** Impeccable: versionar a configuração (`skills-lock.json` com a versão fixada, `.codex/hooks.json` resolvendo o launcher a partir da raiz do git) e documentar a instalação no AGENTS.md; a skill em si continua instalada por agente (fora do git).
- **#28** Preview e captura: versionar `.claude/launch.json`; Playwright fica opcional e o pré-requisito (`npm i --no-save playwright` e `npx playwright install chromium`) fica explícito no SKILL.md e no ARCHITECTURE.md.
- **#29** Evals da `nova-mecanica`: os graders passam a cobrar o doc de design do sistema alterado e o fragmento `changelog.d/`, como a skill manda hoje.

## Plano
1. `scripts/check-meta.ts`: trocar `npx tsx` pelo Node atual com o CLI do `tsx`.
2. `vitest.config.ts` e `.gitignore`.
3. `skills-lock.json`, `.codex/hooks.json`, `.gitignore` das cópias instaladas, seção no AGENTS.md e em `docs/processo/codex.md`.
4. `.claude/launch.json`, pré-requisitos no SKILL.md da `revisar-visual` e no ARCHITECTURE.md do UI Lab.
5. Evals: graders e `expected_outcome` dos três casos.

## Fora do escopo
Código do jogo, números de balanceamento, workflows da CI, `package.json` (Playwright não entra nas dependências).

## Decisões para o usuário
Nenhuma além das já tomadas.

## Achados
- `tests/docs-links.test.ts` (PR #31, já no staging) quebrava no checkout do Windows: com `core.autocrlf`, o `\r` do fim da linha virava um `-` em todas as âncoras (253 links falsos), e o `npm run check` local e o `pre-push` ficavam vermelhos. Escopo ampliado para esse arquivo nesta tarefa: `split(/\r?\n/)`. A CI (Linux) não via o problema.
