#!/bin/sh
# Hook SessionStart do Claude Code (.claude/settings.json): no começo de cada sessão, apaga as branches já integradas
# (AGENTS.md, "Limpeza de branches"; scripts/limpar-branches.ts). Worktrees ficam: podem ser de outra sessão, e saem com
# `npm run limpar -- --aplicar --worktrees`. Nunca bloqueia a sessão: qualquer falha só vira aviso.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -d node_modules ] || exit 0
npm run --silent limpar -- --aplicar 2>&1 | tail -n 20
exit 0
