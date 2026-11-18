---
name: lancar-versao
description: Entrega e lança versões do Ninja Roleta pelo fluxo feature → staging → master. Contribuir (ao fim de toda funcionalidade, mecânica, ajuste ou correção, inclusive ao fim da skill nova-mecanica, sem esperar o usuário pedir "commita") - testa, commita numa branch feature/*, escreve o fragmento changelog.d, faz push só da branch e abre o PR para o staging, que entra sozinho com a revisão aprovada. Preparar release (o usuário pede "prepara a v0.Y.0" ou o PR permanente sugere) - junta os fragmentos no CHANGELOG e sobe a versão no staging. Publicar release e hotfix - merge no master, tag vX.Y.Z e deploy, só com aprovação explícita. Também use quando ele disser "sobe a versão", "fecha a versão", "publica", "lança", "manda pro github", "hotfix" ou "faz a tag".
---

# Lançar versão (Ninja Roleta)

Regras do fluxo em [docs/processo/fluxo.md](../../../docs/processo/fluxo.md). Resumo:

- **Contribuir**: todo trabalho vai num PR para o **`staging`**, que entra sozinho (auto-merge) com `check`, `meta` e a revisão cruzada aprovada. Sem perguntar "posso commitar?".
- **Release (sobe o y)**: o staging vai para o `master` de uma vez, com aprovação do usuário.
- **Hotfix (sobe o z)**: correção urgente direto no `master`, com aprovação do usuário.

**Nunca dê push direto no `master` nem no `staging`** (o Pages publica a cada push no `master`). Commits, tags e PRs **sem `Co-Authored-By`** nem outra linha de atribuição. Aprovação de uma versão não vale para a seguinte. O major (`v1.0.0`) só sobe quando o usuário pedir.

Repositório: `origin` → https://github.com/guidxsa/ninja-roleta. Produção: `master`. Integração: `staging`.

## Testar (vale para as quatro rotinas)

```bash
npm run check
```

Se falhar, **não commite**: corrija se o erro for do trabalho atual; se não for, pare e explique ao usuário.

## Commitar (vale para as quatro rotinas)

1. Confira o que vai entrar: `git status --short`. Adicione os arquivos pelo nome (`git add <arquivos>`), não `git add -A`.
2. **Nunca** commite: `dist/`, `node_modules/`, `.claude/settings.local.json`, saídas de simulação ou capturas de tela, nem arquivo com credenciais. Skills em `.claude/skills/` fazem parte do projeto.
3. Mensagem em PT-BR, sem acentos (como os commits anteriores), título no imperativo, **uma linha em branco** e um item por mudança importante. Sem número de versão no título, exceto na release e no hotfix:
   ```
   Veneno acumula ate tres pilhas

   - Cada golpe envenenado soma uma pilha
   - Doc em docs/base/estados.md e fragmento em changelog.d
   ```

## A. Contribuir (sem pedir)

1. Branch a partir do staging: `git fetch origin staging && git switch -c feature/<tema> origin/staging` (o trabalho já pode estar numa `feature/*`; se ela saiu do `master`, faça rebase em `origin/staging` antes do push, se ainda não foi publicada).
2. Implementação, testes e docs no mesmo commit (AGENTS.md).
3. Quem joga nota a mudança: fragmento `changelog.d/<tema>.md` ([LEIAME](../../../changelog.d/LEIAME.md)), com `peso: alto` para mecânica, tela, modo ou sistema novo. **Não** edite o `CHANGELOG.md` nem a versão do `package.json`.
4. Testar, commitar e `git push -u origin feature/<tema>`.
5. PR: `gh pr create --base staging` pelo modelo `.github/pull_request_template.md`, com "Implementou: claude". Título com o que muda, nunca o nome da branch.
6. Relato curto ao usuário: o que entrou, testes, link do PR. Diga que ele entra sozinho no staging quando o Codex aprovar (e, se o contrato não é de issue, depois da etiqueta `contrato-aprovado`). Se a mudança tem peso, sugira a release.

## B. Preparar release (o usuário pede "prepara a v0.Y.0")

1. Estado: `git fetch origin`; o staging contém o master (`git merge-base --is-ancestor origin/master origin/staging`) e não há PR para o staging esperando (`gh pr list --base staging`); se houver, diga ao usuário e pergunte se espera.
2. Versão: a do `package.json` do `master` com o y + 1 e o z zerado (`0.95.2` → `0.96.0`), ou a que o usuário disser (o `1.0.0` só por pedido dele).
3. `git switch -c feature/release-v0.Y.0 origin/staging`, depois:
   ```bash
   npx tsx scripts/staging.ts release 0.Y.0
   npm version 0.Y.0 --no-git-tag-version
   ```
   Confira a linha nova no fim da tabela do `CHANGELOG.md` e ajuste o texto se precisar (é o que quem joga lê).
4. Testar, commitar (`Prepara a release v0.Y.0`), push e PR para o `staging`. Ele entra pelo auto-merge como qualquer contribuição.
5. Relate: versão, o que entra, link do preview (https://guidxsa.github.io/ninja-roleta/staging/) e do PR permanente. **Pare** e peça o "publica v0.Y.0".

## C. Publicar release (só com "publica v0.Y.0" nesta conversa)

1. Confira: o PR permanente `staging → master` tem a versão certa no `package.json`, CI verde e nenhum PR novo entrou depois do que o usuário testou (se entrou, diga e pergunte).
2. Merge do PR permanente com **Create a merge commit** (`gh pr merge <n> --merge`; nunca squash, nunca `--admin`).
3. `git fetch origin master`, tag anotada no merge commit e push só da tag (seção Tag).
4. O push no `master` publica o Pages e abre o PR de sincronização `master → staging` (entra sozinho).
5. Limpeza de branches (AGENTS.md, "Limpeza de branches") e relato: versão, links do commit, da tag e do site.

## D. Hotfix (o usuário pede, ou o jogo quebrou em produção)

Só para o que não pode esperar a release. Na dúvida, contribuição normal (A).

1. `git fetch origin master && git switch -c hotfix/<tema> origin/master`; contrato `docs/tarefas/<tema>.md`.
2. Correção, teste e doc; linha `v0.Y.Z` no fim da tabela do `CHANGELOG.md` (o z sobe a partir da última tag do `master`) e `npm version 0.Y.Z --no-git-tag-version`.
3. Testar, commitar (`Corrige <o que> (v0.Y.Z)`), push e PR para o `master`. **Pare** e peça aprovação.
4. Com o "publica v0.Y.Z": merge com **Create a merge commit**, tag no merge commit, push da tag. A sincronização com o staging é automática; com conflito, resolva numa `feature/sincroniza-<data>` a partir do staging, com merge do `master`, e PR para o staging.

## Tag (só na publicação)

**Toda versão do `CHANGELOG.md` tem uma tag**, sempre **anotada**, no padrão das anteriores:

```bash
git tag -a v0.96.0 <merge commit> -m "v0.96.0 - Resumo curto sem acentos"
git push origin v0.96.0
```

- Antes de criar, confira o `package.json` do commit, se ele está no `master` (`git merge-base --is-ancestor <commit> origin/master`) e se a tag já existe no remoto (`git ls-remote --tags origin vX.Y.Z`). Tag publicada não muda de lugar; para corrigir, lance um hotfix.
- Tag atrasada ou versão sem commit próprio: aponte para o commit que levou a versão ao `master`, explique num segundo `-m` ("Tag retroativa criada em <data>. ...") e adicione uma linha à tabela de tags do `README.md` (seção Versionamento).

## Quando parar e perguntar

- O usuário disse para não subir ainda ("não commita", "ainda tô testando", "só local").
- Os testes falham por algo que não é do trabalho atual.
- `git status` mostra arquivos estranhos ao trabalho que você não sabe se são dele.
- Rebase ou sincronização com conflito.
- Qualquer passo que toque o `master` (release, hotfix, tag) sem a aprovação explícita desta versão.
