---
objetivo: Harness comum para Claude Code e Codex - regras num AGENTS.md só e verificações automáticas iguais para os dois.
escopo: ["AGENTS.md", "CLAUDE.md", "package.json", ".github/**", ".githooks/**", ".claude/**", "docs/processo/**", "docs/tarefas/**", "scripts/harness.ts", "scripts/check-*.ts", "tests/check*.test.ts", "tests/meta.test.ts", "src/sim/**", "scripts/sim-*.ts", "public/img/retratos.json", "public/img/LEIAME.md", "tests/retratosImagem.test.ts", "docs/visual.md", "scripts/revisar-visual.ts"]
fora: ["src/core/**", "src/data/**", "prototype/**"]
pronto: ["npm run check verde", "verificação de cada fase do plano mostrada no resumo"]
agente: claude
revisor: codex
---

# Harness comum (Claude Code e Codex)

## Pedido
"Me mande um plano em md para eu executar tanto no Codex quanto no Claude Code, para os dois estarem na mesma sintonia" e, depois, "pode prosseguir com o plano; deixe claro os passos que eu mesmo tenho que resolver".

## Contexto
Plano completo em [docs/processo/plano-harness.md](../processo/plano-harness.md). As regras existiam só no `CLAUDE.md`, que o Codex não lê, e nenhuma convenção era conferida por máquina.

## Fora do escopo
Regra, número ou tela do jogo (`src/core`, `src/data`, `prototype`). Unificar `DESIGN.md`, `.impeccable/` e `docs/visual.md`.

## Decisões para o usuário
- Todas as fases numa branch só (`feature/harness`), um commit por fase, em vez de uma branch por fase.
- Publicar passa a ser só pelo merge do PR (a skill `lancar-versao` deixou de dar push no `master`).

## Revisão do Codex (18/11/2026)
O Codex revisou a branch na nuvem e apontou dez achados; os dez foram corrigidos (detalhes em [docs/processo/plano-harness.md](../processo/plano-harness.md#andamento)). O `package.json` entrou no escopo porque esta tarefa muda os scripts dele.

## Achados
- `PRODUCT.md` e `docs/jornada/README.md` ainda mandam ler o "`CLAUDE.md`" para regras que agora estão no `AGENTS.md` (fora do escopo; `docs/visual.md` e a skill `nova-mecanica` foram corrigidos aqui). Os graders das evals da `nova-mecanica` também citam o `CLAUDE.md`.
- O `tests/portraits.test.ts` já conferia 256 × 256 nas imagens ligadas a chaves; o teste novo cobre todas.
