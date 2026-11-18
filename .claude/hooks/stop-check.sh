#!/bin/sh
# Hook Stop do Claude Code (.claude/settings.json): bloqueia o fim da vez, uma vez por resposta, se os tipos ou as regras
# do processo estão quebrados. Só roda se há mudança não commitada no código ou no processo; o teste completo fica no
# pre-push e na CI, que continuam barrando se o Claude encerrar na segunda tentativa.
input=$(cat)
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -z "$(git status --porcelain -- src prototype tests scripts AGENTS.md CLAUDE.md .githooks .claude package.json 2>/dev/null)" ] && exit 0
if out=$( { npm run --silent typecheck && npm run --silent check:regras; } 2>&1 ); then
  exit 0
fi
# Já bloqueou uma vez nesta resposta: deixa encerrar (o pre-commit e a CI continuam barrando) para não entrar em laço.
if printf '%s' "$input" | grep -q '"stop_hook_active" *: *true'; then
  echo "stop-check: verificação ainda falhando; o pre-commit e a CI vão barrar." >&2
  exit 0
fi
printf 'Verificação falhou (typecheck ou check:regras). Corrija antes de encerrar ou explique ao usuário por que não dá:\n%s\n' "$(printf '%s' "$out" | tail -n 40)" >&2
exit 2
