# Revisão de PR

Instruções de revisão para os dois agentes (AGENTS.md, "Review guidelines"). Quem implementa não revisa: o PR do Codex é revisado pelo Claude e o do Claude, pelo Codex. A revisão informa; quem decide e faz o merge é o usuário.

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
2. Achados, do mais grave ao menos grave, separados em **bloqueia o merge** (bug real ou regra burlável num uso normal) e **melhoria futura**. Cada achado tem arquivo:linha, o problema, um cenário concreto e a correção sugerida, sem aplicar.
3. Na última linha, o veredito: **aprovado**, **aprovado com ressalvas** ou **precisa de mudanças**.

Achado específico vai como comentário na linha; o resumo com o veredito vai num comentário do PR.
