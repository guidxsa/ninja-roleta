# Delegação entre os agentes

Cada agente tem a sua área ([AGENTS.md](../../AGENTS.md#dois-agentes)): o **Codex** faz o visual (CSS, layout, composição, acabamento de tela, Impeccable, revisão visual, retratos e imagens) e o **Claude** faz a implementação (mecânica nova, balanceamento, estrutura, dados salvos, core, lógica e TS das telas, testes, docs de regra, processo). Quando o usuário pede ao Claude algo da área do Codex, o Claude não faz: escreve o contrato e aciona o Codex local. Decisão do usuário em 26/11/2026, que autoriza a delegação de forma permanente.

## Como o Claude delega

1. **Contrato** `docs/tarefas/<tema>.md` pelo [modelo](tarefa-modelo.md), com `agente: codex`, o escopo estreito (em geral `prototype/styles/**`, os cenários do UI Lab, `public/img/**`, `docs/visual.md`) e a seção **Briefing visual**: arquivos e telas, cenários do UI Lab para conferir, o que melhorar e por quê, e os ids, `data-*` e classes que não mudam. Com o usuário na conversa, ele aprova antes. O contrato pode ser escrito em qualquer pasta (o scratchpad, por exemplo), sem sujar o clone.
2. **Conferir sem rodar**: `npm run delegar -- <tema> --contrato <arquivo> --seco` mostra a pasta, a branch, o comando e o prompt.
3. **Delegar**: `npm run delegar -- <tema> --contrato <arquivo>`, em segundo plano (pode levar dezenas de minutos). O script (`scripts/delegar.ts`):
   - recusa contrato sem `agente: codex` ou sem `escopo`, e tema de processo, de issue ou de release;
   - cria o worktree da `feature/<tema>` a partir do `origin/staging` em `~/worktrees/ninja-roleta/<tema>` (fora do OneDrive, que trava a remoção de worktrees; outra pasta com `DELEGAR_PASTA`) e roda o `npm ci`;
   - commita o contrato (commit do Claude, antes de o Codex começar);
   - roda `codex exec -s workspace-write -C <worktree> --add-dir <.git comum> -o <tema>.resultado.md` com o prompt padrão pela entrada padrão. O sandbox escreve só no worktree e no `.git` (onde o commit grava) e fica **sem rede**;
   - no fim, mostra o código de saída, o resumo do Codex, os commits novos e se sobrou mudança sem commit. O log fica em `<tema>.log`, ao lado.
4. **O Codex** lê o `AGENTS.md` e o contrato, segue a skill da tarefa (Impeccable e `revisar-visual`, que estão instalados na máquina), não muda ids nem `data-*`, roda `npm run check`, commita sem `Co-Authored-By` e termina com o resumo no formato do modelo de PR. Não dá push, não abre PR e não troca de branch.
5. **O Claude confere** o resumo, o diff (`git -C <worktree> diff origin/staging...HEAD`) e as fotos, se houver. Faltou algo: roda de novo com `--nota "<o que corrigir>"`, no mesmo worktree. Pronto: `git -C <worktree> push -u origin feature/<tema>` (o `pre-push` roda o `npm run check`) e `gh pr create --base staging`, com "Agente: codex (delegado pelo Claude)" no corpo. O PR entra no staging com `check` e `meta`, como qualquer outro.
6. **Depois do merge**: `npm run limpar -- --aplicar --worktrees` remove o worktree limpo da branch integrada, também fora do clone (ele lê o `git worktree list`). O resumo e o log ficam na pasta até alguém apagar.

A regra de um agente por branch continua: o Claude só commita o contrato antes e só faz o push depois; enquanto o Codex trabalha, ninguém mais mexe na branch.

## Tarefa com as duas partes

Vira duas branches em sequência. Primeiro o Claude entrega a funcionalidade com estrutura estável (ids, `data-*` e as classes que o TS consulta) e um CSS mínimo, e escreve o briefing visual no PR. Depois do merge no staging, delega o acabamento ao Codex com um contrato próprio. Como o staging aceita erro, a tela pode ficar crua entre os dois PRs.

## Fora daqui (por enquanto)

- **Do Codex para o Claude** (o Codex recebe um pedido de mecânica e aciona o Claude com `claude -p`): fica para depois de a ida estar testada.
- **Codex na nuvem** (`@codex` numa issue): sem o Impeccable e sem navegador no container; o caminho local é o padrão.
