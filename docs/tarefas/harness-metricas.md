---
objetivo: O loop de issues escolhe o modelo por perfil (leve ou padrão, alternado por issue, com escalada) e registra o consumo de cada execução do Claude na issue, para comparar o custo até o PR ficar pronto.
escopo: ["AGENTS.md", "docs/processo/**", "docs/tarefas/harness-metricas.md", ".github/workflows/issues-claude.yml", ".github/workflows/revisao-claude.yml", "scripts/metricas*.ts", "tests/metricas.test.ts", "package.json"]
fora: ["src/**", "prototype/**", ".githooks/**", ".claude/**", "package-lock.json", ".github/workflows/pages.yml", ".github/workflows/ci.yml"]
pronto: ["npm run check verde", "testes da soma por modelo, da escolha de perfil e do relatório", "docs descrevem perfis, escalada, registro e critério de promoção", "PR aberto com o teste real descrito como pendente (o loop de issues só roda a partir do master)"]
agente: claude
revisor: codex
---

# Perfis de modelo e métricas no loop de issues (fase 1)

## Pedido
Montar o plano de "Estratégia de agentes, modelos e consumo de tokens": escolher modelo e esforço por dificuldade e medir a economia até o PR ficar pronto para merge, começando por correções documentais verificáveis, com perfil leve e critério de escalada.

Decisões do usuário: a fase 1 mede só o Claude (a revisão do Codex na nuvem não expõe tokens; o Codex fica para a fase 2); o perfil leve é alternado por issue (ímpar começa leve, par começa no padrão).

## Contexto
`docs/processo/issues.md` ("Loop") e `docs/processo/revisao.md` ("Loop"). O loop de issues roda sem `--model` (Sonnet 5.5). O `claude-code-action` grava a conversa em `execution_file`, com o uso de tokens por mensagem.

## Plano
1. `scripts/metricas.ts`: funções puras (soma por modelo, escolha de perfil, marcador, relatório). Testes antes.
2. `scripts/metricas-execucao.ts`: escolhe o perfil (`perfil`) e registra a execução (`registra`) no resumo do job e num comentário da issue.
3. `scripts/metricas-relatorio.ts` e `npm run metricas`.
4. `issues-claude.yml` e `revisao-claude.yml` (job `corrige`): perfil, `--model` e registro.
5. `docs/processo/metricas.md` (novo), `issues.md`, `AGENTS.md`.

## Fora do escopo
Medir o Codex; mudar o esforço (`--effort`); tarefas fora do loop de issues; mudar a triagem.

## Decisões para o usuário
- Critério de promoção (6 issues por perfil, mediana ≤ 70%, no máximo 1 em 3 escalou): proposto sem dados, revisável.
- Variável de repositório `PILOTO_PERFIS`: o piloto só liga com `on` (Settings → Secrets and variables → Actions → Variables).
- Etiquetas `cat:*` precisam ser criadas no repositório.

## Achados
