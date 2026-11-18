---
objetivo: A revisão cruzada roda em loop no PR sem ninguém no meio - o revisor aponta achados, o autor corrige e pede nova revisão, até não haver achado ou acabar o limite de rodadas; o merge continua com o usuário.
escopo: [".github/workflows/revisao-claude.yml", "AGENTS.md", "docs/processo/**", "docs/tarefas/harness-loop-revisao.md"]
fora: ["src/**", "prototype/**", "tests/**", "scripts/**", ".githooks/**", ".claude/**", "package.json", "package-lock.json", ".github/workflows/ci.yml", ".github/workflows/pages.yml"]
pronto: ["npm run check verde", "workflow aceito pelo parser do GitHub (actionlint e a aba Actions sem erro de sintaxe)", "docs descrevem o loop e as travas", "PR aberto com o teste real descrito como pendente (depende do segredo CLAUDE_CODE_OAUTH_TOKEN)"]
agente: claude
revisor: codex
---

# Loop da revisão cruzada

## Pedido
Fazer a revisão cruzada entre Claude e Codex rodar sozinha no GitHub: o revisor aponta achados, o autor corrige, pede nova revisão e repete até não haver achado. Depois o usuário mergeia.

## Contexto
O PR #19 criou a revisão cruzada (`.github/workflows/revisao-claude.yml`, `docs/processo/revisao.md`). Nele o loop foi feito à mão: o Codex achou P1 e P2, o Claude corrigiu no 23910e0, alguém comentou `@codex review` e o Codex aprovou. Hoje:

- o Claude só revisa os PRs do Codex e nunca corrige os próprios PRs a partir da revisão do Codex;
- a revisão do Codex dispara na abertura do PR, ao marcar pronto ou com `@codex review`, e não a cada push.

Como o Codex responde (visto no PR #19): **com achados**, uma revisão (`pull_request_review`, autor `chatgpt-codex-connector[bot]`, "Here are some automated review suggestions") com comentários na linha; **sem achados**, só um comentário "Didn't find any major issues", sem evento de revisão. Por isso o loop para sozinho quando o Codex não acha nada.

## Plano
1. **PR do Claude** (corpo com "Implementou: claude"): novo job `corrige` no `revisao-claude.yml`, disparado pela revisão do Codex com achados. Ele roda o `claude-code-action` na branch do PR para avaliar os achados, corrigir o que procede, rodar `npm run check`, fazer commit e push. Um passo do próprio workflow (não o Claude) confere o push e comenta `@codex review` com o marcador de rodada.
2. **PR do Codex**: o job `automatica` passa a terminar a revisão com um marcador de veredito. Se for "precisa de mudanças", um passo comenta `@codex address that feedback` com o marcador de rodada. O push do Codex dispara o `automatica` de novo (evento `synchronize`).
3. **Travas**:
   - **Limite de rodadas**: 3 por PR, contadas pelo marcador `<!-- loop-revisao:rodada -->` nos comentários. Ao atingir o limite, o workflow para de pedir correção e avisa o usuário no PR (uma vez, marcador `<!-- loop-revisao:limite -->`).
   - **Só PR da própria base**: `head.repo` igual ao repositório; PR de fork nunca entra no loop.
   - **O job que corrige executa código do PR** (`npm ci`, `npm run check`): só roda em `pull_request_review` de PR da própria base, nunca em `issue_comment` (a correção do P1 no 23910e0).
   - **Push**: só `git push origin HEAD` na branch do PR, já em checkout (o Claude só tem essa forma de push liberada: sem `--force`, sem outra branch); a branch tem de começar com `feature/` (nunca o `master`). Depois do push, o workflow confere que o novo commit descende do anterior e que nenhum commit novo tem `Co-Authored-By`; se falhar, para o loop e avisa no PR.
   - **Revisão velha**: se o PR andou depois da revisão do Codex (`review.commit_id` diferente da ponta atual), o job não corrige.
   - **Sem correção**: se o Claude não fizer commit (achados que não procedem), o workflow não pede nova revisão e avisa o usuário.
4. **Docs**: `docs/processo/revisao.md` ganha a seção do loop (como roda nos dois sentidos, travas, o que o usuário configura) e a seção "Dois agentes" do `AGENTS.md` passa a descrever o loop. O `docs/processo/codex.md` aponta para o loop onde fala da revisão automática.

## Fora do escopo
Mudar regra, número ou tela do jogo. Mudar as verificações (`scripts/`, hooks), a CI (`ci.yml`, `pages.yml`) ou as configurações do Claude Code (`.claude/`). Tornar a revisão um check obrigatório. Merge automático: o merge continua do usuário.

## Decisões para o usuário
- **Limite de 3 rodadas** por PR (contando os dois sentidos juntos). Dá para mudar na variável `LIMITE_RODADAS` do workflow.
- **Pendências do teste real** (depende do segredo `CLAUDE_CODE_OAUTH_TOKEN` e do app do Claude instalado no repositório):
  - se o Codex atende `@codex review` e `@codex address that feedback` escritos por um bot (o comentário sai como `github-actions[bot]`). Se não atender, o loop para nessa rodada e o usuário comenta à mão;
  - se o push do `claude-code-action` dispara a CI (dispara quando o push é feito com o token do app do Claude; com o `GITHUB_TOKEN` o GitHub não dispara workflows).

## Achados
