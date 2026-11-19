---
objetivo: Os PRs aprovados pelos agentes entram sozinhos numa branch staging, que chega ao master em releases (sobe o y) aprovadas pelo usuário; hotfix sobe o z direto no master; o staging tem preview em /staging/.
escopo: ["AGENTS.md", "CLAUDE.md", "README.md", "docs/processo/**", "docs/tarefas/harness-staging.md", ".github/**", ".githooks/pre-push", ".claude/settings.json", ".claude/skills/lancar-versao/**", ".claude/skills/nova-mecanica/**", "scripts/harness.ts", "scripts/check-regras.ts", "scripts/check-escopo.ts", "scripts/staging.ts", "scripts/build-prototype.ts", "tests/checkRegras.test.ts", "tests/checkEscopo.test.ts", "tests/staging.test.ts", "tests/canal.test.ts", "src/state/canal.ts", "prototype/canal.ts", "prototype/sw.ts", "prototype/roleta/session.ts", "prototype/jornada/fold.ts", "changelog.d/**"]
fora: ["src/core/**", "src/data/**", "package.json", "package-lock.json"]
pronto: ["npm run check verde", "testes da base do diff, do hotfix, do changelog.d, do canal de armazenamento e da junção dos fragmentos", "build do canal staging com chaves, cache e título próprios", "docs descrevem fluxo, portão, release, hotfix e preview", "PR aberto com o corte descrito como passos do usuário"]
agente: claude
revisor: codex
---

# Staging com auto-merge e versão y/z

## Pedido
"Adicionar um nível de desenvolvimento que esteja abaixo da master e receba as implementações aprovadas pelos agentes (não é direto para a master, portanto não precisa da segurança humana). O principal objetivo é concentrar mínimos detalhes em updates mais significantes que não aumentem indefinidamente as versões release, as tags. [...] em um formato x.y.z esse estado seja justamente o y. Enquanto o z seriam aquelas mudanças/correções de uma hora que precisam resolver um bug logo. O merge de pull requests para essa branch/estado deve ser automático."

Decisões do usuário (18/11/2026): staging já, e o v1.0.0 sai dele em breve; manter o nome `master`; auto-merge com CI verde e revisão cruzada aprovada; preview no Pages em `/staging/`; a release é decisão dele, com sugestão do agente.

## Contexto
Substitui o plano adiado de 10/11/2026 (feature → staging → main só no corte do v1.0.0). Regras novas em `docs/processo/fluxo.md`.

## Plano
1. Checks: base do diff pelo destino (staging ou master), `hotfix/<tema>`, `changelog.d/` sempre permitido, staging e master como branches de integração. Testes antes.
2. Canal `staging` no build: chaves de armazenamento com prefixo, cache e título próprios; o service worker da produção ignora `/staging/`.
3. Workflows: portão `revisao-cruzada`, `staging.yml` (auto-merge, fechamento de issues, PR permanente, sincronização), `pages.yml` com o preview, CI em `staging` e `hotfix/**`, loop de issues com base `staging`.
4. `scripts/staging.ts`: PR permanente e junção dos fragmentos na release.
5. Docs e skills.

## Fora do escopo
Renomear o `master`; cortar o v1.0.0; mudar a revisão cruzada além do portão; configuração no GitHub (é o corte, com aprovação do usuário).

## Decisões para o usuário
- Fragmentos em `changelog.d/` em vez de editar o `CHANGELOG.md` a cada PR.
- Sugestão de release com um item de peso alto ou 8 itens.
- Proteção do staging sem exigir branch atualizada.
- Segredo `STAGING_TOKEN` (token fino do dono) para o auto-merge disparar CI e preview.
- Critérios antigos do v1.0.0 no README viraram item 50 de `docs/decisoes.md`.

## Achados
- A proteção do `master` no GitHub não exige nenhum check (`required_status_checks.checks` vazio), embora `AGENTS.md` e `codex.md` digam `check` e `meta`. Corrigido no corte, com aprovação.
- O passo do perfil em `issues-claude.yml` (PR #32) tinha YAML inválido; corrigido na branch do #32.
