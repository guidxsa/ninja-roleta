# Revisão de PR

Instruções de revisão para os dois agentes (AGENTS.md, "Review guidelines"). Quem implementa não revisa: o PR do Codex é revisado pelo Claude e o do Claude, pelo Codex. A revisão informa; quem decide e faz o merge é o usuário. Achado que bloqueia o merge volta sozinho para o autor corrigir, em [loop](#loop); a melhoria futura vira uma [issue](issues.md).

## Como chega

| PR implementado por | Quem revisa | Como dispara |
|---|---|---|
| Codex (corpo com "Implementou: codex" ou branch `codex/*`) | Claude | Sozinho: `.github/workflows/revisao-claude.yml`, quando o PR abre ou é atualizado |
| Claude | Codex | Sozinho: revisão automática do Codex, ligada nas configurações do Codex ([codex.md](codex.md#revisão-automática-dos-prs-do-claude)) |
| Qualquer um, à mão | Claude ou Codex | Comentário no PR: `@claude revise` ou `@codex review` |

O "Implementou" vem do modelo de PR (`.github/pull_request_template.md`): quem abre o PR preenche `claude`, `codex` ou `humano`. O workflow procura o texto exato "Implementou" + dois-pontos + "codex" no corpo do PR (sem diferenciar maiúsculas): num PR do Claude, não escreva essa combinação em outro lugar da descrição, ou o Claude revisaria o próprio PR.

**Configuração (uma vez, pelo usuário)**:
- **Claude no GitHub**: na máquina com o Claude Code, `claude setup-token`; o token vai em Settings → Secrets and variables → Actions → New repository secret, com o nome `CLAUDE_CODE_OAUTH_TOKEN`. Usa o limite do plano, sem custo extra. Sem o segredo, o workflow avisa e pula a revisão, sem travar o PR.
- **Codex**: ligar a revisão de código do repositório nas configurações do Codex.
- **App do Claude no repositório** (para o loop): o `claude-code-action` usa o token do app do Claude para publicar e dar push. Instale com `/install-github-app` no Claude Code ou em github.com/apps/claude. Push feito com o token do app dispara a CI; com o `GITHUB_TOKEN` do Actions, não dispararia.

## Loop

A revisão roda em loop no PR, sem ninguém no meio: o revisor aponta achados, o autor corrige e pede nova revisão, até não haver achado ou acabar o limite de rodadas. O merge continua do usuário.

| PR de | Revisão com achados | Correção | Nova revisão | Para quando |
|---|---|---|---|---|
| Claude ("Implementou: claude") | O Codex publica uma revisão (`pull_request_review` de `chatgpt-codex-connector[bot]`) | Job `corrige`: o Claude avalia cada achado, corrige o que procede dentro do contrato, roda `npm run check`, faz commit e push e publica um resumo | O workflow confere o push e comenta `@codex review` | O Codex responde "Didn't find any major issues" (só comentário, sem revisão) |
| Codex ("Implementou: codex" ou `codex/*`) | Job `automatica`: o resumo do Claude termina com o marcador `veredito=mudancas` | O workflow comenta `@codex address that feedback`; o Codex corrige e dá push | O push (`synchronize`) roda o `automatica` de novo | Veredito "aprovado" ou "aprovado com ressalvas" (ressalva é melhoria futura, não volta para o Codex) |

**Travas**:
- **Limite de rodadas**: 3 por PR (`LIMITE_RODADAS` no workflow), os dois sentidos juntos, contadas pelo marcador `<!-- loop-revisao:rodada -->` nos comentários de pedido. No limite, o workflow para de pedir correção e avisa o usuário no PR uma vez (`<!-- loop-revisao:limite -->`). O aviso não menciona o Codex com arroba, para não abrir mais uma rodada.
- **Só PR da própria base**: o loop exige `head.repo` igual ao repositório. PR de fork recebe no máximo a revisão, nunca a correção.
- **O job que corrige executa código do PR** (`npm ci`, `npm run check`) com os segredos: só roda no evento `pull_request_review` de PR da própria base cuja branch começa com `feature/`, nunca em `issue_comment` (o job `comentario` não executa código do PR).
- **Push**: o Claude só tem liberado `git push origin HEAD`, na branch do PR em checkout (sem `--force`, sem outra branch, nunca o `master`). Commit sem `Co-Authored-By`: a atribuição vem desligada nas configurações do Claude no job. Depois, o workflow confere que o commit novo descende do revisado (sem push forçado) e que nenhum commit novo tem `Co-Authored-By`; se falhar, para o loop e avisa no PR.
- **Revisão velha**: se o PR andou depois da revisão do Codex, o job `corrige` não corrige (a revisão do commit novo vale mais).
- **Achado que não procede**: o Claude não corrige o que não procede, sai do escopo do contrato ou depende de decisão do usuário (balanceamento, por exemplo); explica no resumo e, se o achado é real mas fora do escopo, abre uma [issue](issues.md). Sem commit, o workflow não pede nova revisão e avisa que o loop parou.

**O usuário entra** quando o loop para sem aprovação (limite, achado recusado, trava) e no merge. Para pedir mais uma rodada depois do limite, basta comentar à mão `@codex review` (PR do Claude) ou o pedido de correção ao Codex (PR do Codex).

**Pendente de teste real** (depende do segredo e do app do Claude): se o Codex atende `@codex review` e `@codex address that feedback` escritos por um bot (o pedido sai como `github-actions[bot]`). Se não atender, o loop para nessa rodada e o pedido é feito à mão no PR.

## O que conferir

1. **Contexto**: o `AGENTS.md` e o contrato da tarefa (`docs/tarefas/<tema>.md`, citado no PR). O PR faz o que o contrato pede, e só isso?
2. **Verificação**: `npm run check` passa. Mudou o jogo (dano, vida, chance, recompensa): a CI roda o `check:meta`; confira o resultado no PR. Na revisão pedida por `@claude`, o workflow não executa código do PR (o comentário roda com os segredos do repositório, mesmo num PR de fork): a verificação é o resultado da CI (`gh pr checks`).
3. **Escopo**: arquivo fora do `escopo` ou dentro do `fora` do contrato; refatoração "de passagem".
4. **Regras do projeto**:
   - core puro, sem DOM, armazenamento ou `Math.random`;
   - número de balanceamento só em `balance` e nunca compensado sem o usuário;
   - doc atualizado no mesmo commit;
   - teste antes da fórmula;
   - interface só por tokens e ícones do `ICONS`.
5. **Bugs**: casos limite, estado salvo antigo (campos novos opcionais), celular e desktop.
6. **Processo**: regra que um agente consegue burlar sem nenhuma verificação perceber; verificação que barraria um trabalho legítimo; contradição entre `AGENTS.md`, `CLAUDE.md`, skills e `docs/`.

Não reabra decisões registradas no contrato ou em `docs/decisoes.md`; se discordar, diga como observação, sem bloquear.

## Formato da resposta

1. O que foi verificado e o resultado (comandos e saída resumida).
2. Achados, do mais grave ao menos grave, separados em **bloqueia o merge** (bug real ou regra burlável num uso normal) e **melhoria futura**. Cada achado tem arquivo:linha, o problema, um cenário concreto e a correção sugerida, sem aplicar. Cada melhoria futura (e inconsistência fora do escopo do PR) vira uma issue descritiva pelo modelo e com a triagem de [issues.md](issues.md), com o número citado no resumo.
3. Na última linha, o veredito: **aprovado**, **aprovado com ressalvas** ou **precisa de mudanças**. Na revisão automática do Claude, o resumo termina com o marcador do veredito (`<!-- revisao-claude:veredito=aprovado -->`, `=ressalvas` ou `=mudancas`), que o workflow lê para o [loop](#loop).

Achado específico vai como comentário na linha; o resumo com o veredito vai num comentário do PR.
