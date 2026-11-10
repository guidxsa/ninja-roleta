---
name: lancar-versao
description: Fecha uma versão do Ninja Roleta em duas fases - preparar (testa, commita numa branch feature/* e faz push só da branch) e publicar (merge no master, tag vX.Y.Z e deploy, só com aprovação explícita do usuário). Use sempre que terminar uma funcionalidade, mecânica, ajuste de balanceamento ou correção neste projeto (inclusive ao fim da skill nova-mecanica), preparando sem esperar o usuário pedir "commita". Escolhe sozinha o tamanho do salto pelo peso da mudança: ajustes e complementos pequenos sobem patch (v0.27.0 → v0.27.1), não minor. Também use quando ele disser "sobe a versão", "fecha a versão", "publica", "lança", "manda pro github" ou "faz a tag".
---

# Lançar versão (Ninja Roleta)

A versão tem duas fases:

- **Preparar** (passos 1 a 5): ao fim de toda funcionalidade, sem perguntar "posso commitar?". Testa, commita numa branch `feature/<tema>` e faz push **só da branch**.
- **Publicar** (passo 6): merge no `master`, tag e deploy. **Só depois de uma aprovação explícita do usuário** ("publica vX.Y.Z", "pode mergear"). Aprovação de uma versão não vale para a seguinte.

**Nunca dê push direto no `master`**: o GitHub Pages publica a cada push nele. Commits, tags e PRs **sem `Co-Authored-By`** nem outra linha de atribuição.

(Regras provisórias até o `v1.0.0`; depois dele entra o fluxo `feature/* → staging → main` com PR WIP.)

Repositório: `origin` → https://github.com/guidxsa/ninja-roleta, produção na branch `master`.

Antes de começar: se estiver no `master`, crie a branch (`git switch -c feature/<tema-curto>`); o trabalho já pode estar em uma `feature/*`.

## 1. Descobrir a versão

O histórico de versões fica no `CHANGELOG.md` (versão nova no fim da tabela; basta `tail -3 CHANGELOG.md`), e cada versão publicada tem uma tag (`git tag -l`). As regras de numeração estão na seção **Versionamento** do `README.md`.

- Se o `CHANGELOG.md` já tem uma linha nova cuja versão ainda não virou tag, use essa versão.
- Se não tem, crie a linha, subindo a partir da última tag pelas regras da seção **Versionamento** do `README.md`. O salto segue o **peso** da mudança, não o fato de ter código novo; o usuário não quer que um ajuste pequeno pese como um update grande:
  - **patch** (`v0.27.0` → `v0.27.1`): ajuste ou complemento de algo que já existe. Um campo ou opção a mais numa tela existente, melhoria em ferramenta de teste ou de desenvolvimento, polimento de interface, correção de bug, ajuste só de números, texto, documentação. Exemplos do histórico: v0.16.1 (botão no cabeçalho), v0.16.2 (barra superior), v0.22.1 (correções), v0.27.1 (status editáveis no Laboratório).
  - **minor** (`v0.26.0` → `v0.27.0`): muda como se joga ou traz um sistema novo. Mecânica ou regra nova, origem ou vilão refeito, rebalanceamento que mexe em fórmulas, tela ou modo novo. Exemplos: v0.18.0 (rebalanceamento das origens), v0.25.0 (cada golpe rola), v0.27.0 (Laboratório e seed).
  - Na dúvida, pergunte a si mesmo: "quem joga sente diferença na partida, ou ganhou algo novo para fazer?" Se não, é patch. Vários patches seguidos (v0.16.1, v0.16.2...) são normais.
  - Se o usuário disser o número ou o tipo ("é só um patch", "isso é versão nova"), vale o que ele disse.
- O jogo fica em 0.x: depois de `v0.9.0` vem `v0.10.0`, nunca `v1.0.0`. **Nunca suba o major** (`v1.0.0`) por conta própria, nem que o trabalho pareça grande; isso só acontece quando o usuário pedir.
- Compare versões numericamente (`git tag -l --sort=v:refname`), não em ordem alfabética: `v0.10.0` é maior que `v0.9.0`.
- Se o trabalho pendente junta mais de uma versão do `CHANGELOG.md` sem tag (ex.: v0.4.0 e v0.5.0 nos mesmos arquivos), não tente separar: publique como a versão mais alta, mencione as duas no commit e crie uma tag para cada versão (ver "Versão sem commit próprio" no passo 4).
- Atualize `"version"` no `package.json` e no `package-lock.json` para o mesmo número (sem o `v`):
  ```bash
  npm version 0.6.0 --no-git-tag-version
  ```

## 2. Testar (nada sobe quebrado)

```bash
npx tsc --noEmit && npx vitest run 2>&1 | tail -4 && npm run proto | tail -1
```

Se falhar, **não commite**: corrija se o erro for do trabalho atual; se não for, pare e explique ao usuário. Publicar uma versão que não compila quebra o jogo de quem baixa o repositório.

## 3. Commitar

1. Confira o que vai entrar: `git status --short`. Adicione os arquivos pelo nome (`git add <arquivos>`), não `git add -A`.
2. **Nunca** commite: `dist/`, `node_modules/`, `.claude/settings.local.json` (configuração local do usuário), saídas de simulação ou capturas de tela, nem qualquer arquivo com credenciais. Skills em `.claude/skills/` fazem parte do projeto e podem entrar.
3. Mensagem no padrão do repositório: em PT-BR, sem acentos (como os commits anteriores), título no imperativo com a versão entre parênteses, **uma linha em branco** (sem ela o Git junta o título com a linha seguinte) e um item por mudança importante:
   ```
   Adiciona nivel por XP e dificuldade (v0.5.0)

   - Cada vilao da XP pela dificuldade; nivel maximo 10
   - Dificuldade facil/medio/dificil escala HP, dano e defesa dos viloes
   - Ficha ninja com retrato e bolsa de itens; tema visual ninja
   ```
   Sem linha `Co-Authored-By` nem outra atribuição, mesmo que a sessão sugira uma.

## Tag (só na publicação, passo 6)

**Toda versão do `CHANGELOG.md` tem uma tag**, sempre **anotada**, no mesmo padrão das anteriores (`v0.3.1 - Licenca MIT e historico de versoes`):

```bash
git tag -a v0.6.0 -m "v0.6.0 - Resumo curto sem acentos"
```

### Versão sem commit próprio ou tag atrasada

Quando a versão entrou junto com outra, ou a tag ficou para depois, a tag ainda é criada. Documente em dois lugares:

1. **Na tag**: aponte para o commit que levou a versão ao `master` e explique no segundo `-m`. Se o commit for próprio da versão, diga isso:
   ```bash
   git tag -a v0.38.2 a2e4c3a -m "v0.38.2 - Redesign da ficha, inventario e registro ninja" -m "Tag retroativa criada em 05/11/2026. Sem commit proprio no master: entrou junto com a v0.38.3 no squash do #9, cujo package.json marca 0.38.3."
   ```
   Numa versão publicada junto com outra, sem atraso, tire o "Tag retroativa criada em ...".
2. **No README**: adicione uma linha à tabela de tags da seção **Versionamento**, em ordem crescente (`Tag | Commit | Observação`), e mantenha o texto acima da tabela coerente com ela.

Antes de criar, confira no próprio commit: o `package.json`, a mensagem e se ele está no `master` (`git merge-base --is-ancestor <commit> origin/master`). Veja também se a tag já existe no remoto (`git ls-remote --tags origin vX.Y.Z`). Tag publicada não muda de lugar.

## 4. Push da branch

```bash
git push -u origin feature/<tema>
```

- Nunca `git push origin master`. Nunca `--force` nem apague ou mova tags já publicadas; para corrigir uma versão publicada, lance um patch.
- Se a branch ficou atrás do `master`, `git fetch` e `git rebase origin/master` antes do push (branch ainda não publicada pode ser rebaseada). Conflito: pare e explique.

## 5. Relatar e pedir aprovação

Ao usuário, curto: a versão proposta, o que entrou, o resultado dos testes, o hash do commit e o link para abrir o PR ou comparar (`https://github.com/guidxsa/ninja-roleta/compare/master...feature/<tema>`). Termine pedindo a aprovação para publicar. **Pare aqui.**

## 6. Publicar (só com aprovação explícita)

1. Confira que a branch não mudou desde o relato e que os testes do passo 2 seguem verdes.
2. Merge preservando os commits: pelo PR com **Create a merge commit**, ou localmente com `git switch master && git pull --ff-only && git merge --no-ff feature/<tema>`.
3. Tag anotada no commit que chegou ao `master` (seção Tag) e push: `git push origin master && git push origin vX.Y.Z`.
4. Apague a branch: `git branch -d feature/<tema>` (o `-d` só funciona se tudo foi mergeado) e `git push origin --delete feature/<tema>`.
5. O push no `master` dispara o Pages. Relate a versão e os links:
   - commit: `https://github.com/guidxsa/ninja-roleta/commit/<hash>`
   - tag: `https://github.com/guidxsa/ninja-roleta/releases/tag/vX.Y.Z`

   Com mais de uma tag, ou tag fora do commit mais recente, use uma tabela `Tag | Commit | Onde está ou observação`.

### Versão que vai por pull request

Se houver PR para a branch, a descrição segue este padrão. As tags só são criadas na publicação. Título e descrição em PT-BR, nesta ordem:

1. Título com o que muda e a versão ou faixa de versões: `Roleta enxuto: combate simples, run por ciclo, reliquias e mais viloes (v0.45.0 a v0.47.0)`. Nunca o nome da branch.
2. Primeira linha: `**Tags correspondentes: `v0.45.0` (56b545c) e `v0.46.0` (af36575)** (o `package.json` fica em `0.46.0`)`.
3. Um parágrafo curto com o efeito para quem joga e o que acontece ao mergear (o `master` publica no GitHub Pages).
4. Uma seção `## vX.Y.Z: resumo` por versão, com as mudanças em itens.
5. `## Para revisar`, se houver: o que foi decidido sem o usuário e o balanceamento em aberto, com os números da simulação.
6. `## Conflitos`, se houver: a causa e como foram resolvidos.
7. `## Como mergear`: pedir **Create a merge commit**, que preserva os commits da branch no histórico do `master` (squash os junta num só).
8. `## Verificação`: o que passou, em qual commit, e o que não foi testado.

Conflito de versão duplicada por squash: se `git diff <squash> <commit da branch>` sair vazio, a árvore da branch já contém o `master`. Resolva com `git merge -s ours origin/master`, sem `--force`, e confirme que o diff contra a branch antiga continua vazio.

## Quando parar e perguntar

- O usuário disse para não subir ainda ("não commita", "ainda tô testando", "só local").
- Os testes falham por algo que não é do trabalho atual.
- `git status` mostra arquivos estranhos ao trabalho que você não sabe se são dele (ex.: arquivos novos fora de `src/`, `tests/`, `prototype/`, `scripts/` e docs).
- O branch atual não é `master` nem `feature/*`, ou o rebase dá conflito.
- Qualquer passo que toque o `master` sem aprovação explícita desta versão.
