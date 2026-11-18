# CLAUDE.md

As regras do projeto ficam no `AGENTS.md`, a fonte única para o Claude Code e o Codex. Não duplicar regra aqui.

@AGENTS.md

## Só do Claude Code

- As skills de `.claude/skills/` carregam sozinhas; a tabela "Skills e fluxos" do `AGENTS.md` diz quando cada uma vale.
- `.claude/settings.json` (versionado) nega push no `master`, push forçado, `--no-verify` e troca do `core.hooksPath`.
- Hook `Stop` (`.claude/hooks/stop-check.sh`): com código alterado e não commitado, roda typecheck e `check:regras` e não deixa encerrar a vez com erro. Erro que não dá para corrigir: explicar ao usuário, nunca contornar.
- Configurações pessoais ficam em `.claude/settings.local.json` (fora do git) e não afrouxam as regras acima.
