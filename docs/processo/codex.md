# Codex neste projeto

Guia para quem usa o Codex. As regras são as mesmas do Claude Code e estão no [AGENTS.md](../../AGENTS.md), que o Codex lê sozinho quando a sessão abre na raiz do repositório. A configuração do Codex fica na máquina de quem usa (`~/.codex/config.toml`), não no repositório; por isso este guia.

## Configuração recomendada

- **Abra a sessão na raiz do repositório**, para ele carregar o `AGENTS.md`.
- **Escrita só no workspace e aprovação para o resto**: sandbox que deixa escrever só na pasta do projeto e pede aprovação para rede e para comandos fora dela. Nas versões atuais, algo como:

  ```toml
  # ~/.codex/config.toml (confira os nomes na documentação da sua versão)
  approval_policy = "on-request"
  sandbox_mode = "workspace-write"
  ```

- **Rode `npm install` uma vez** no clone: o script `prepare` liga os git hooks (`git config core.hooksPath .githooks`). Confira com `git config core.hooksPath` (deve responder `.githooks`).

## O que segura a qualidade do Codex

O Codex não tem um hook equivalente ao `Stop` do Claude Code (que impede encerrar com a verificação vermelha). O que vale para ele, e para qualquer um:

| Momento | O que roda | Onde |
|---|---|---|
| `git commit` | typecheck e `check:regras` | `.githooks/pre-commit` |
| `git push` | `npm run check`; recusa push no `master` e push forçado | `.githooks/pre-push` |
| PR e push em `feature/**` | `npm run check` (no PR, `check:regras` estrito) | `.github/workflows/ci.yml` |
| Merge no `master` | só por PR com a CI verde | proteção de branch no GitHub |

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
