---
name: lancar-versao
description: Fecha uma versão do Ninja Roleta - testa, commita, faz push e sobe a tag vX.Y.Z no GitHub. Use sempre que terminar uma funcionalidade, mecânica, ajuste de balanceamento ou correção neste projeto (inclusive ao fim da skill nova-mecanica), sem esperar o usuário pedir "commita" - ele quer que toda versão nova seja publicada assim por padrão. Também use quando ele disser "sobe a versão", "fecha a versão", "publica", "lança", "manda pro github" ou "faz a tag".
---

# Lançar versão (Ninja Roleta)

O usuário pediu, de forma permanente, que **toda funcionalidade ou versão nova termine publicada**: testada, commitada, enviada ao GitHub e com a tag da versão. Não pergunte "posso commitar?" ao fim do trabalho; isso já está autorizado. Só pare e pergunte nos casos descritos em "Quando parar".

Repositório: `origin` → https://github.com/guidxsa/ninja-roleta, branch `master`.

## 1. Descobrir a versão

O histórico de versões fica na tabela **Histórico de versões** do `README.md`, e cada versão publicada tem uma tag (`git tag -l`).

- Se o README já tem uma linha nova cuja versão ainda não virou tag, use essa versão.
- Se não tem, crie a linha, subindo a partir da última tag:
  - **menor** (`v0.5.0` → `v0.6.0`): funcionalidade ou mecânica nova, mudança de regra, tela nova;
  - **patch** (`v0.5.0` → `v0.5.1`): correção de bug, ajuste só de números, texto, documentação.
- Se o trabalho pendente junta mais de uma versão do README sem tag (ex.: v0.4.0 e v0.5.0 nos mesmos arquivos), não tente separar: publique como a versão mais alta e mencione as duas no commit.
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
3. Mensagem no padrão do repositório: em PT-BR, sem acentos (como os commits anteriores), título no imperativo com a versão entre parênteses e um item por mudança importante:
   ```
   Adiciona nivel por XP e dificuldade (v0.5.0)
   - Cada vilao da XP pela dificuldade; nivel maximo 10
   - Dificuldade facil/medio/dificil escala HP, dano e defesa dos viloes
   - Ficha ninja com retrato e bolsa de itens; tema visual ninja

   Co-Authored-By: <linha de atribuição indicada pela sessão>
   ```
   Use a linha `Co-Authored-By` que a sessão indicar para commits.

## 4. Tag

Tag **anotada**, no mesmo padrão das anteriores (`v0.3.1 - Licenca MIT e historico de versoes`):

```bash
git tag -a v0.6.0 -m "v0.6.0 - Resumo curto sem acentos"
```

## 5. Push

```bash
git push origin master && git push origin v0.6.0
```

- Se o push for recusado porque o remoto tem commits novos, rode `git fetch` e `git pull --rebase origin master`. Se o rebase der conflito, pare e explique ao usuário.
- **Nunca** use `--force` nem apague ou mova tags já publicadas. Se precisar corrigir uma versão publicada, lance uma versão de patch.

## 6. Relatar

Ao usuário, curto: a versão, o que entrou, o resultado dos testes, o hash do commit e os links:
- commit: `https://github.com/guidxsa/ninja-roleta/commit/<hash>`
- tag: `https://github.com/guidxsa/ninja-roleta/releases/tag/vX.Y.Z`

## Quando parar e perguntar em vez de publicar

- O usuário disse para não subir ainda ("não commita", "ainda tô testando", "só local").
- Os testes falham por algo que não é do trabalho atual.
- `git status` mostra arquivos estranhos ao trabalho que você não sabe se são dele (ex.: arquivos novos fora de `src/`, `tests/`, `prototype/`, `scripts/` e docs).
- O branch atual não é `master`, ou o push exige rebase com conflito.
