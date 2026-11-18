# Codex neste projeto

Guia para quem usa o Codex, na máquina ou na nuvem. As regras são as mesmas do Claude Code e estão no [AGENTS.md](../../AGENTS.md), que o Codex lê sozinho quando a sessão abre na raiz do repositório. A configuração do Codex fica na máquina de quem usa (`~/.codex/config.toml`), não no repositório; por isso este guia.

## Codex na máquina

- **Abra a sessão na raiz do repositório**, para ele carregar o `AGENTS.md`.
- **Escrita só no workspace e aprovação para o resto**: sandbox que deixa escrever só na pasta do projeto e pede aprovação para rede e para comandos fora dela. Nas versões atuais, algo como:

  ```toml
  # ~/.codex/config.toml (confira os nomes na documentação da sua versão)
  approval_policy = "on-request"
  sandbox_mode = "workspace-write"
  ```

- **Rode `npm install` uma vez** no clone: o script `prepare` liga os git hooks (`git config core.hooksPath .githooks`). Confira com `git config core.hooksPath` (deve responder `.githooks`).

## Codex na nuvem (chatgpt.com/codex)

Funciona sem a máquina. Cada tarefa roda num container com o repositório e termina numa resposta ou num PR.

1. **Ambiente** (Environments): repositório `guidxsa/ninja-roleta`, setup script `npm ci`. O `npm ci` também liga os git hooks pelo `prepare`. A internet do agente pode ficar desligada: o `npm run check` e o `check:meta` não precisam dela.
2. **Na nuvem não há** `config.toml` nem modo de aprovação: o container é isolado e você revisa o resultado antes de virar PR. O botão de publicar transforma as mudanças da tarefa num PR. Numa tarefa só de revisão, não clique.
3. **Branch**: o Codex cria branches com o nome dele. Peça no prompt `feature/<tema>`. Se o nome vier outro, o `check:escopo` acha o tema pelo único `docs/tarefas/<tema>.md` alterado no diff; sem nenhum, é aviso até 02/12/2026 e erro depois, na nuvem, na CI e na máquina; nesse caso, defina `CHECK_TEMA=<tema>`.
4. **O push quem faz é a plataforma**, ao abrir o PR, então o `pre-push` não roda. Quem garante é a CI (`check` e `meta`) e a proteção do `master`.
5. **Revisão de PR**: uma tarefa com o prompt de revisão abaixo (rodando os checks) ou o comentário `@codex review` no PR, se a integração do Codex com o GitHub estiver ligada.
6. **Sem navegador**: o container pode não ter o Chromium do Playwright. A skill `revisar-visual` fica com o Claude, ou use `--chromium=<caminho>`.

### Prompt de revisão (testado em 18/11/2026)

Escolha a branch do PR ao criar a tarefa:

```
Você vai revisar um trabalho feito por outro agente neste repositório. É só revisão: NÃO altere, crie nem apague
arquivos, NÃO faça commit e NÃO abra PR.

Passo 1. git fetch origin master <branch> && git checkout -B <branch> origin/<branch> && npm ci
Passo 2. Leia o AGENTS.md e o contrato em docs/tarefas/<tema>.md.
Passo 3. Rode e mostre: npm run check, npm run check:meta (se a tarefa mexe no jogo) e git config core.hooksPath.
Passo 4. Revise git diff origin/master...HEAD contra o AGENTS.md e o contrato: bugs, regra que dá para burlar sem
nenhuma verificação perceber, falso positivo, contradição entre AGENTS.md, CLAUDE.md, skills e docs, e arquivo fora
do escopo.
Resposta: saída resumida do passo 3; achados do mais grave ao menos grave, cada um com arquivo:linha, problema,
cenário concreto e correção sugerida (sem aplicar); no fim, "aprovado", "aprovado com ressalvas" ou "precisa de mudanças".
```

## O que segura a qualidade do Codex

O Codex não tem um hook equivalente ao `Stop` do Claude Code (que impede encerrar com a verificação vermelha). O que vale para ele, e para qualquer um:

| Momento | O que roda | Onde |
|---|---|---|
| `git commit` | `check:regras` sobre o que vai no commit | `.githooks/pre-commit` |
| `git push` deste clone | `npm run check` na branch que sobe, com a árvore limpa; recusa push no `master`, push forçado, push de branch que não é a atual e push com mudanças fora do commit | `.githooks/pre-push` |
| PR e push em `feature/**` | `npm run check` (no PR, `check:regras` estrito e etiqueta `contrato-aprovado`) e `check:meta` | `.github/workflows/ci.yml` |
| Merge no `master` | só por PR com a CI verde | proteção de branch no GitHub, **configurada pelo usuário** (enquanto não estiver ligada, nada impede um push direto feito fora dos hooks) |

## Skills

O Codex usa as mesmas skills do Claude lendo o arquivo: a tabela "Skills e fluxos" do `AGENTS.md` diz qual `SKILL.md` ler para cada tipo de tarefa. Se a sua versão do Codex carregar skills sozinha, aponte para `.claude/skills/` em vez de copiar (uma cópia só, para não divergir).

## Prompt de início de tarefa

```
Leia AGENTS.md. Tarefa: <pedido>.
Antes de codar, escreva o contrato em docs/tarefas/<tema>.md (modelo em docs/processo/tarefa-modelo.md)
e espere minha aprovação. Depois, trabalhe na branch feature/<tema>, rode npm run check e
termine com o resumo no formato do .github/pull_request_template.md.
```

## Revisão

Quem implementa não revisa. Um PR feito pelo Codex é revisado pelo Claude Code (`/code-review`) e vice-versa; o merge é do usuário.
