#!/bin/sh
# Hook Stop do Claude Code (.claude/settings.json): bloqueia o fim da vez, uma vez por resposta, se os tipos ou as regras
# do processo estão quebrados. Só roda se há mudança não commitada no código ou no processo; o teste completo fica no
# pre-push e na CI, que continuam barrando se o Claude encerrar na segunda tentativa.
input=$(cat)
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
# Os caminhos do jogo e todos os do processo (a lista PROTECTED de scripts/check-regras.ts, mais package.json).
[ -z "$(git status --porcelain -- src prototype tests scripts AGENTS.md CLAUDE.md .githooks .claude .github package.json 2>/dev/null)" ] && exit 0
if out=$( { npm run --silent typecheck && npm run --silent check:regras; } 2>&1 ); then
  exit 0
fi
# Já bloqueou uma vez nesta resposta: deixa encerrar para não entrar em laço. O pre-commit barra as regras do processo;
# o tipo quebrado, o pre-push e a CI.
if printf '%s' "$input" | grep -q '"stop_hook_active" *: *true'; then
  echo "stop-check: verificação ainda falhando; o pre-commit (regras), o pre-push e a CI (tipos e testes) vão barrar." >&2
  exit 0
fi
printf 'Verificação falhou (typecheck ou check:regras). Corrija antes de encerrar ou explique ao usuário por que não dá:\n%s\n' "$(printf '%s' "$out" | tail -n 40)" >&2
exit 2
