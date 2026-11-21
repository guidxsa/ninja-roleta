# Fluxo de branches e versões

Como o trabalho chega à produção. Decisão do usuário em 18/11/2026: uma camada `staging` abaixo do `master`, que recebe sozinha o que os agentes aprovaram e chega ao `master` em releases maiores. O v1.0.0 sai do staging, numa das próximas releases, quando o usuário pedir.

```
feature/<tema>, feature/issue-<n>, codex/*  ──PR, auto-merge──▶  staging  ──PR permanente, "publica v0.Y.0"──▶  master (Pages)
hotfix/<tema>  ──PR, merge do usuário, tag v0.Y.Z──▶  master  ──PR de sincronização, auto-merge──▶  staging
```

| Branch | O que é | Quem faz o merge |
|---|---|---|
| `master` | Produção, publicada no Pages | Só o usuário: o PR permanente (release) e os hotfix |
| `staging` | Tudo o que os agentes aprovaram e espera a próxima release | O GitHub, sozinho (auto-merge), com CI e revisão cruzada aprovadas |
| `feature/<tema>`, `feature/issue-<n>`, `codex/*` | Uma tarefa; PR para o `staging` | — |
| `hotfix/<tema>` | Correção urgente; sai do `master` e volta para ele | — |

Push direto em `master` ou `staging` é bloqueado (hook `pre-push`, `.claude/settings.json` e a proteção no GitHub).

## Entrada no staging

1. O agente abre o PR com base `staging` (é o padrão para todo trabalho, inclusive o loop das [issues](issues.md)).
2. O workflow `.github/workflows/staging.yml` liga o auto-merge nativo do GitHub (merge commit).
3. O merge acontece quando três checks ficam verdes no commit da ponta:
   - `check` e `meta` (CI, `.github/workflows/ci.yml`);
   - `revisao-cruzada`, o **portão**: um status de commit verde quando o outro agente aprovou. O Codex aprova o PR do Claude pelo bloco `codex-review-state:v1` que ele mantém no comentário de resumo: revisão concluída, sem achado pendente e **do commit da ponta** (`scripts/check-aprovacao.ts`; a frase e o horário do comentário não contam). Se o Codex comentar e o bloco não aparecer, o portão avisa no PR uma vez. O veredito `aprovado` ou `ressalvas` do Claude ([revisao.md](revisao.md)) aprova o do Codex. Commit novo começa sem o status e bloqueia de novo sozinho. O caminho do comentário do Codex roda a versão do `staging.yml` que está no `master` (o GitHub usa o branch padrão para `issue_comment`): uma mudança nele só vale depois da release.
4. A etiqueta `revisao-dispensada` abre o portão (PR humano ou exceção) só se foi posta pelo dono do repositório (a timeline do PR diz quem pôs). O contrato continua precisando da etiqueta `contrato-aprovado` (ou da issue com `correcao-automatica`, também posta pelo dono), registrada pelo `aprovacao.yml` e vencida se o contrato mudar depois, como no [AGENTS.md](../../AGENTS.md#escopo): o usuário aprova o plano, não o merge.
5. Depois do merge, o workflow fecha as issues do `Closes #n` com um aviso (no staging o GitHub não fecha sozinho), atualiza o preview e reescreve o PR permanente.

**Fora do auto-merge**: PR de fork, rascunho e PR para o `master`.

## Versão: o y e o z

Formato `x.y.z`. O jogo segue em `0.y.z` até o usuário pedir o v1.0.0; o major nunca sobe sozinho.

- **No staging não há versão nem tag**: o `package.json` só muda na release e no hotfix. Cada PR que quem joga nota traz um fragmento `changelog.d/<tema>.md` ([LEIAME](../../changelog.d/LEIAME.md)) em vez de editar o `CHANGELOG.md`: com merges seguidos, editar a mesma tabela daria conflito a cada PR.
- **y, release**: o staging acumulado vai para o `master` de uma vez (`0.95.2` → `0.96.0`).
- **z, hotfix**: correção urgente direto no `master` (`0.96.0` → `0.96.1`).

## Release (y)

1. **Sugestão**: o PR permanente `staging → master` (título "Próxima versão (proposta v0.Y.0)") é reescrito a cada push no staging com os fragmentos, os PRs integrados e o link do preview. Com um fragmento de `peso: alto` ou 8 itens, o workflow comenta uma sugestão de release, uma vez por ciclo. O agente também sugere no resumo quando vê algo de peso.
2. **Preparar** (o usuário pede "prepara a v0.Y.0"): o agente abre `feature/release-v0.Y.0` a partir do staging com `npx tsx scripts/staging.ts release 0.Y.0` (junta os fragmentos numa linha do `CHANGELOG.md` e os apaga) e `npm version 0.Y.0 --no-git-tag-version`; o PR entra no staging pelo auto-merge.
3. **Testar**: o usuário abre o preview do staging.
4. **Publicar** (só com "publica v0.Y.0"): merge do PR permanente com **Create a merge commit**, tag anotada `v0.Y.0` no merge commit e push só da tag (skill `lancar-versao`). O push no `master` publica o Pages e abre a sincronização.

## Hotfix (z)

Só para o que não pode esperar a release (jogo quebrado em produção).

1. `hotfix/<tema>` a partir do `master`, com contrato `docs/tarefas/<tema>.md` (o `check:escopo` lê o tema de `hotfix/<tema>`), a linha `v0.Y.Z` no `CHANGELOG.md` e `npm version 0.Y.Z --no-git-tag-version`.
2. PR para o `master`; revisão cruzada como sempre; merge e tag só com aprovação do usuário.
3. O workflow abre o PR `master → staging` e ele entra sozinho (o portão passa direto: o conteúdo já foi aprovado no `master`). Conflito: o agente resolve numa `feature/sincroniza-<data>` a partir do staging, com merge do `master`, e abre o PR para o staging.

## Preview

O Pages publica a produção na raiz e o staging em `/staging/` (`.github/workflows/pages.yml`, a cada push no `master` e quando o `staging.yml` pede). O preview é gerado com `npm run proto -- --canal=staging`:

- versão marcada (`0.95.2-staging.<commit>`) e título "Ninshu Roots (staging)";
- chaves do `localStorage` com prefixo `staging:` (`src/state/canal.ts`): mesma origem que a produção, então sem o prefixo o preview leria e gravaria o save de quem joga;
- service worker com cache próprio; o da produção não responde por `/staging/` nem apaga os caches do staging.

## Configuração (uma vez, pelo usuário)

- Segredo `STAGING_TOKEN`: token fino do dono, só deste repositório, com **Contents** e **Pull requests** de escrita. Merge e PR feitos com o `GITHUB_TOKEN` do Actions não disparam outros workflows (CI do staging, preview, PR permanente); com o token do dono, disparam. Sem ele, o workflow avisa e o merge no staging fica à mão.
- Repositório: **Allow auto-merge** ligado.
- Proteção do `staging`: PR obrigatório; checks `check`, `meta` e `revisao-cruzada`, sem exigir branch atualizada (com merges seguidos, cada PR ficaria para trás do outro; a CI do push no staging confere o resultado junto); sem force-push e sem apagar; sem aprovação humana.
- Proteção do `master`: PR obrigatório e checks `check` e `meta`.
- Etiqueta `revisao-dispensada`.

## O que é do usuário

Aprovar o contrato (`contrato-aprovado`), dispensar a revisão quando quiser (`revisao-dispensada`), decidir a release ("prepara" e "publica v0.Y.0"), aprovar hotfix e o v1.0.0.
