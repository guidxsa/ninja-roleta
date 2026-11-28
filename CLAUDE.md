# CLAUDE.md

As regras do projeto ficam no `AGENTS.md`, a fonte única para o Claude Code e o Codex. Não duplicar regra aqui.

@AGENTS.md

## Só do Claude Code

- As skills de `.claude/skills/` carregam sozinhas; a tabela "Skills e fluxos" do `AGENTS.md` diz quando cada uma vale.
- `.claude/settings.json` (versionado) nega, no Bash e no PowerShell, push no `master` e no `staging`, push forçado, `--no-verify` e `-n` e qualquer troca do `core.hooksPath` (`tests/claudeSettings.test.ts` confere as duas listas). Negação vence liberação: o `settings.local.json` não reabre o que ela fecha.
- Hook `Stop` (`.claude/hooks/stop-check.sh`): com código ou arquivo do processo alterado e não commitado, roda typecheck e `check:regras` e, se falhar, impede o fim da vez **uma vez por resposta** (na segunda tentativa deixa encerrar e avisa, para não entrar em laço; o pre-commit continua barrando as regras do processo, e o pre-push e a CI, os tipos e os testes). Erro que não dá para corrigir: explicar ao usuário, nunca contornar.
- Configurações pessoais ficam em `.claude/settings.local.json` (fora do git) e não afrouxam as regras acima.
