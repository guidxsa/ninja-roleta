---
objetivo: O portão revisao-cruzada fica verde com a revisão do Claude, e o loop de correção roda quando o Codex revisa um PR do Claude.
escopo: [".github/workflows/revisao-claude.yml", "docs/processo/revisao.md", "docs/tarefas/harness-revisao.md"]
fora: ["prototype/**", "src/**", "scripts/**", "AGENTS.md", "CLAUDE.md", "package.json"]
pronto: ["npm run check verde", "leitura do veredito conferida contra os comentários reais dos PRs #35 e #42", "PR para staging sem Co-Authored-By"]
agente: claude
revisor: codex
---

# Revisão cruzada que não trava

## Pedido

O usuário notou que o portão `revisao-cruzada` trava várias vezes e pediu a correção em 20/11/2026.

## Contexto

- Job `automatica`: com `track_progress: true`, a action manda o Claude publicar o resumo no comentário de progresso, que sai sem o marcador `<!-- revisao-claude:veredito=... -->`. O passo do portão não acha veredito e o status fica pendente. Aconteceu nas três revisões do Claude (duas no #35, uma no #42).
- Job `corrige`: a action recusa a execução disparada pela revisão de `chatgpt-codex-connector` ("Workflow initiated by non-human actor", execução 44658293728 no #38). O mesmo vale para o `automatica` disparado por push do Codex.

## Plano

1. Tirar o `track_progress` do `automatica`, para o resumo sair por `gh pr comment`, como pede o prompt.
2. Reserva no passo do portão: sem o marcador, ler a linha "Veredito: ..." dos comentários do Claude desta execução, com aviso no log.
3. `allowed_bots: chatgpt-codex-connector` no `automatica` e no `corrige`.
4. `docs/processo/revisao.md` no mesmo commit.

## Fora do escopo

Os demais workflows, o `staging.yml` e o prompt da revisão.
