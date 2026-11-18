#!/bin/sh
# Hook Stop do Claude Code (.claude/settings.json): o Claude não encerra a vez com tipos ou regras do processo
# quebrados. Só roda se há mudança não commitada no código; o teste completo fica no pre-push e na CI.
input=$(cat)
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -z "$(git status --porcelain -- src prototype tests scripts 2>/dev/null)" ] && exit 0
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
