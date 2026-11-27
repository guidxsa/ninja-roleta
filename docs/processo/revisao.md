# Revisão

Instruções de revisão para os dois agentes (AGENTS.md, "Review guidelines"). Desde 26/11/2026 não há revisão cruzada nem portão de revisão: o `staging` é o playground dos agentes, onde o PR entra com `check` e `meta` verdes, e **a revisão humana é a release**, no PR permanente staging → master ([fluxo.md](fluxo.md)). A revisão de IA serve para informar o usuário e não trava nada.

## Quando há revisão

| Momento | Quem revisa | Como |
|---|---|---|
| Release ("prepara a v0.Y.0") | Codex local, sobre o lote inteiro | O agente que prepara roda `codex exec review` na `feature/release-v0.Y.0` contra o `origin/master` e publica o resultado no PR permanente (skill `lancar-versao`) |
| Qualquer PR, quando o usuário quiser | Claude no GitHub | Comentário no PR com `@claude revise` (workflow `.github/workflows/revisao-claude.yml`, job `comentario`) |

A revisão da release olha com atenção a seção "Mudanças no processo" do PR permanente: sem revisão cruzada, um agente pode afrouxar uma verificação no staging, e é ali que o usuário vê.

**Configuração (uma vez, pelo usuário)**:
- **Claude no GitHub**: na máquina com o Claude Code, `claude setup-token`; o token vai em Settings → Secrets and variables → Actions → New repository secret, com o nome `CLAUDE_CODE_OAUTH_TOKEN`. Usa o limite do plano, sem custo extra. Sem o segredo, o `@claude revise` é pulado com um aviso no log. A action só roda se o `revisao-claude.yml` do PR for igual ao do `master`: uma mudança nele vale depois da release.
- **Codex local**: `codex login` (conta do ChatGPT). A revisão automática do Codex nos PRs fica desligada nas configurações do Codex (chatgpt.com/codex → Settings → Code review).

## O que conferir

1. **Contexto**: o `AGENTS.md` e o contrato da tarefa (`docs/tarefas/<tema>.md`, citado no PR). O PR faz o que o contrato pede, e só isso? Na release, cada contrato dos PRs integrados.
2. **Verificação**: `npm run check` passa. Mudou o jogo (dano, vida, chance, recompensa): a CI roda o `check:meta`; confira o resultado. Na revisão pedida por `@claude`, o workflow não executa código do PR (o comentário roda com os segredos do repositório, mesmo num PR de fork): a verificação é o resultado da CI (`gh pr checks`).
3. **Escopo**: arquivo fora do `escopo` ou dentro do `fora` do contrato; refatoração "de passagem"; agente fora da sua área sem motivo.
4. **Regras do projeto**:
   - core puro, sem DOM, armazenamento ou `Math.random`;
   - número de balanceamento só em `balance` e nunca compensado sem o usuário;
   - doc atualizado no mesmo commit;
   - teste antes da fórmula;
   - interface só por tokens e ícones do `ICONS`.
5. **Bugs**: casos limite, estado salvo antigo (campos novos opcionais), celular e desktop.
6. **Processo**: regra que um agente consegue burlar sem nenhuma verificação perceber; verificação que barraria um trabalho legítimo; contradição entre `AGENTS.md`, `CLAUDE.md`, skills e `docs/`.

Não reabra decisões registradas no contrato ou em `docs/decisoes.md`; se discordar, diga como observação.

## Formato da resposta

1. O que foi verificado e o resultado (comandos e saída resumida).
2. Achados, do mais grave ao menos grave, separados em **bloqueia o merge** (bug real ou regra burlável num uso normal) e **melhoria futura**. Cada achado tem arquivo:linha, o problema, um cenário concreto e a correção sugerida, sem aplicar. Cada melhoria futura (e inconsistência fora do escopo do PR) vira uma issue descritiva pelo modelo e com a triagem de [issues.md](issues.md), com o número citado no resumo.
3. Na última linha, o veredito: **aprovado**, **aprovado com ressalvas** ou **precisa de mudanças**. O veredito informa o usuário, que decide: no staging, corrigir numa `feature/<tema>`; na release, corrigir antes do "publica" ou publicar assim mesmo.

Achado específico vai como comentário na linha; o resumo com o veredito vai num comentário do PR.
