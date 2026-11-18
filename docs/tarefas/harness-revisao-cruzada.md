---
objetivo: A revisão cruzada acontece sozinha no PR - o Claude revisa os PRs do Codex e o Codex revisa os do Claude, com as mesmas instruções de revisão.
escopo: [".github/workflows/revisao-claude.yml", ".github/pull_request_template.md", "AGENTS.md", "CLAUDE.md", "docs/processo/**", "docs/tarefas/harness-revisao-cruzada.md", "PRODUCT.md", "docs/jornada/README.md"]
fora: ["src/**", "prototype/**", "tests/**", "scripts/**", ".githooks/**", ".claude/**", "package.json", "package-lock.json"]
pronto: ["npm run check verde", "workflow validado (sintaxe e condição de disparo)", "um PR de teste recebe a revisão automática depois que o usuário configurar o segredo e o Codex"]
agente: claude
revisor: codex
---

# Revisão cruzada automática

## Pedido
"Principalmente o item 2 eu gostaria que fosse automatizado": o pedido de revisão ao outro agente, que hoje é manual (copiar o prompt para o Codex e trazer a resposta).

## Contexto
O harness (PR #18) definiu que quem implementa não revisa. A revisão foi feita pelo Codex na nuvem, em três rodadas, com o prompt de `docs/processo/codex.md` copiado à mão. O GitHub permite automatizar os dois lados:

- **Claude revisa os PRs do Codex** com o GitHub Action oficial (`anthropics/claude-code-action@v1`). Ele roda na CI e comenta a revisão no PR.
- **Codex revisa os PRs do Claude** com a revisão de código da integração do Codex com o GitHub (revisão automática nos PRs ou comentário `@codex review`). O Codex procura instruções de revisão no `AGENTS.md`.

## Plano
1. **Instruções de revisão em um lugar só**: `docs/processo/revisao.md`, com o que conferir (AGENTS.md, contrato da tarefa, `npm run check`, escopo, regras burláveis, falso positivo, contradições entre docs e skills) e o formato da resposta (achados do mais grave ao menos grave, com arquivo:linha, e o veredito "aprovado", "aprovado com ressalvas" ou "precisa de mudanças"). O prompt de `docs/processo/codex.md` passa a apontar para ele.
2. **`AGENTS.md`**: seção `## Review guidelines` (o nome que a revisão do Codex procura) apontando para `docs/processo/revisao.md`. Na seção "Dois agentes", o fluxo automático: o agente que abre o PR preenche "Implementou" no modelo de PR; a revisão do outro chega sozinha.
3. **Workflow `.github/workflows/revisao-claude.yml`**:
   - dispara quando um PR é aberto ou atualizado **e** foi implementado pelo Codex: o corpo do PR tem "Implementou: codex" ou a branch começa com `codex/`. PR do Claude não aciona o Claude (quem implementa não revisa);
   - também dispara num comentário `@claude revise` no PR, para pedir uma revisão à mão;
   - roda o `anthropics/claude-code-action@v1` com o prompt "siga docs/processo/revisao.md" e permissão só de leitura no código e de escrita em comentários do PR;
   - autentica com o token da assinatura do usuário, no segredo `CLAUDE_CODE_OAUTH_TOKEN` (sem custo extra além do limite do plano). Sem o segredo, o job avisa e não falha, para não bloquear PR nenhum.
   - Não é um check obrigatório: a revisão informa, quem decide é o usuário.
4. **PRs do Claude** são revisados pela revisão automática do Codex, que o usuário liga nas configurações do Codex. O `AGENTS.md` e o `docs/processo/codex.md` explicam como ligar; se ela não estiver ligada, o comentário `@codex review` no PR pede a revisão à mão.
5. **Proteção do `master` como está configurada**: PR e checks `check` e `meta` obrigatórios, sem aprovação no GitHub, merge pelo dono com bypass. Fica registrado no `AGENTS.md` e no `docs/processo/codex.md`.
6. **Pendências do PR #18**: o `PRODUCT.md` e o `docs/jornada/README.md` passam a apontar para o `AGENTS.md` em vez do `CLAUDE.md`.

## Fora do escopo
Mudar regra, número ou tela do jogo. Mudar as verificações (`scripts/`, hooks) ou as configurações do Claude Code (`.claude/`). Tornar a revisão automática um check obrigatório.

## Decisões do usuário (18/11/2026)
- **Chave do Claude no GitHub**: token da assinatura (`claude setup-token`, gerado uma vez na máquina do usuário) no segredo `CLAUDE_CODE_OAUTH_TOKEN`. Chave de API descartada por ser cobrada à parte. Até o token existir, o workflow pula a revisão sem falhar.
- **Codex**: o usuário liga a revisão automática de PRs nas configurações do Codex.

## Achados
