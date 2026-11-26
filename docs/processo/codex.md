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
4. **O push quem faz é a plataforma**, ao abrir o PR, então o `pre-push` não roda. Quem garante é a CI (`check` e `meta`) e a proteção do `master` e do `staging`. Ao abrir o PR, escolha a base `staging` ([fluxo.md](fluxo.md)).
5. **Sem navegador e sem o Impeccable**: o container pode não ter o Chromium do Playwright, e o Impeccable fica fora do git. Por isso a tarefa visual roda no Codex local ([delegacao.md](delegacao.md)); na nuvem, use `--chromium=<caminho>` se houver navegador.

## Codex acionado pelo Claude

O Claude aciona o Codex desta máquina, sem interface, quando recebe um pedido visual: `npm run delegar -- <tema>` roda o `codex exec` num worktree da `feature/<tema>`, sem rede, com o contrato já commitado. O Codex implementa, roda o `npm run check` e commita; o push e o PR ficam com o Claude. Passo a passo em [delegacao.md](delegacao.md). Pré-requisito: o Codex CLI instalado (`npm i -g @openai/codex`) e logado (`codex login`, conta do ChatGPT).

## O que segura a qualidade do Codex

O Codex não tem um hook equivalente ao `Stop` do Claude Code (que impede encerrar com a verificação vermelha). O que vale para ele, e para qualquer um:

| Momento | O que roda | Onde |
|---|---|---|
| `git commit` | `check:regras` sobre o que vai no commit | `.githooks/pre-commit` |
| `git push` deste clone | `npm run check` na branch que sobe, com a árvore limpa; recusa push no `master` e no `staging`, push forçado, push de branch que não é a atual e push com mudanças fora do commit | `.githooks/pre-push` |
| PR e push em `feature/**`, `hotfix/**` e `staging` | `npm run check` (no PR, `check:regras` estrito) e `check:meta` | `.github/workflows/ci.yml` |
| Merge no `staging` | sozinho (auto-merge) com `check` e `meta` verdes; o PR de processo, o dono ([fluxo.md](fluxo.md)) | `.github/workflows/staging.yml` e proteção do `staging` |
| Merge no `master` | só o dono, que revisa o lote: o PR permanente do staging (release) e os hotfix, com `check` e `meta` verdes | proteção de branch no GitHub, configurada pelo usuário |

## Skills

O Codex usa as mesmas skills do Claude lendo o arquivo: a tabela "Skills e fluxos" do `AGENTS.md` diz qual `SKILL.md` ler para cada tipo de tarefa. Se a sua versão do Codex carregar skills sozinha, aponte para `.claude/skills/` em vez de copiar (uma cópia só, para não divergir). O `.gitignore` ignora `.agents/skills/` inteiro: uma cópia ali não aparece no `git status` e fica velha sem ninguém ver, então não copie as skills do projeto para lá; se já copiou, apague as cópias e deixe só o Impeccable.

**Arquivo local** (nota, prompt, rascunho que não vai para o git): ponha em `.git/info/exclude` do seu clone, nunca no `.gitignore` versionado. O pre-push, o `check:escopo` e o hook Stop do Claude contam arquivo não rastreado como mudança, e um arquivo solto na raiz quebra o push ou aparece como fora do escopo.

A exceção é a skill de terceiros Impeccable, instalada por agente em `.agents/skills/impeccable/` (instalação e versão no [AGENTS.md](../../AGENTS.md#skills-e-fluxos)). Os hooks dela ficam em `.codex/hooks.json` e acham o launcher pela raiz do git, então funcionam com a sessão aberta em qualquer subpasta; sem a skill instalada, não fazem nada.

## Prompt de início de tarefa

```
Leia AGENTS.md. Tarefa: <pedido>.
Antes de codar, escreva o contrato em docs/tarefas/<tema>.md (modelo em docs/processo/tarefa-modelo.md,
com agente: codex) e espere minha aprovação. Depois, trabalhe na branch feature/<tema> a partir do staging, rode npm run check,
abra o PR com base staging e termine com o resumo no formato do .github/pull_request_template.md.
```

## Revisão

Não há revisão cruzada: o staging é o playground e a revisão do usuário é a release ([revisao.md](revisao.md)). No "prepara a v0.Y.0", o Codex local revisa o lote inteiro com `codex exec review`, e o resultado vai para o PR permanente, só para informar. A revisão automática do Codex nos PRs fica desligada (chatgpt.com/codex → Settings → Code review).

## Issues

O Codex segue as mesmas regras: inconsistência achada fora do escopo (ou "melhoria futura" numa revisão) vira uma issue descritiva pelo modelo e com a triagem de [issues.md](issues.md). Sem `gh` no ambiente (Codex na nuvem), o achado vai no resumo e no PR com o texto da issue pronto, e quem pega o PR abre a issue. A correção automática das issues é do Claude, pelo workflow `issues-claude.yml`.
