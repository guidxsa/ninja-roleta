# Issues

Toda inconsistência achada vira uma **issue descritiva** no GitHub, para nada se perder num resumo ou num comentário de PR. A que é claramente um erro, sem nada para o usuário avaliar, os agentes corrigem sozinhos em [loop](#loop): pegam a issue, corrigem num PR e a issue fecha quando o usuário mergeia. Regra resumida no [AGENTS.md](../../AGENTS.md#issues).

## Quando abrir

- **Achado fora do escopo** numa tarefa (bug, regra violada, doc desatualizado): o agente anota em **Achados** no resumo e no PR **e** abre a issue, com o número ao lado do achado. Não corrige na tarefa atual.
- **Revisão**: cada "melhoria futura" e cada achado que o autor recusou por sair do escopo ou depender do usuário ([revisao.md](revisao.md)).
- **Simulação, auditoria ou jogando**: divergência de doc, número fora do registrado, comportamento estranho.

Antes de abrir, procurar duplicata (`gh issue list --state all --search "<palavras>"`); se existe, comentar nela o caso novo. Uma issue por problema.

## Modelo

Pelo site, o modelo **Inconsistência** (`.github/ISSUE_TEMPLATE/inconsistencia.yml`). Pelo `gh`, o mesmo formato:

```bash
gh issue create --title "<problema em poucas palavras>" --label inconsistencia --label precisa-decisao --body-file corpo.md
```

```markdown
### O que está errado
Uma ou duas frases.

### Onde
arquivo:linha (ou tela e modo do jogo).

### Cenário concreto
Como reproduzir (comando, seed, passos) e o que acontece.

### Esperado
O que deveria acontecer, citando a regra ou o doc que manda (AGENTS.md, docs/...).

### Origem
Revisão do PR #n, sessão do Claude ou do Codex, simulação, jogando.
```

Título e corpo em português, sem dado pessoal. O título diz o problema, não a solução.

## Triagem

Toda issue do fluxo tem `inconsistencia` e **uma** destas:

| Etiqueta | Quando | O que acontece |
|---|---|---|
| `correcao-automatica` | Erro claro: uma única resposta certa, que dá para conferir | O [loop](#loop) corrige sozinho |
| `precisa-decisao` | Qualquer outra coisa, e **na dúvida** | Espera o usuário; ele troca a etiqueta se quiser a correção automática |

**Erro claro** (`correcao-automatica`):
- bug com comportamento claramente errado: exceção, `NaN`, estado quebrado, botão que não faz nada;
- regra do AGENTS.md violada: `Math.random`, DOM ou `localStorage` no `core`, emoji como ícone, cor fora de token;
- link ou caminho quebrado num doc;
- doc que não acompanhou uma mudança já registrada (`CHANGELOG.md`, `docs/registro.md`, commit com a decisão);
- teste faltando ou errado para uma regra documentada;
- erro de texto em português.

**Precisa de decisão** (`precisa-decisao`):
- número ou balanceamento (alvo, dano, chance, recompensa);
- código e doc divergem sem registro de qual vale (AGENTS.md, "Regras para os docs");
- design, visual ou texto que é questão de gosto;
- regra nova ou mudança de regra;
- processo (AGENTS.md, CLAUDE.md, hooks, workflows, scripts de verificação);
- correção que mexe no contrato de outra tarefa em andamento.

**Categoria** (opcional, para as [métricas](metricas.md#relatório)): uma etiqueta `cat:docs` (link, caminho, texto, doc atrasado), `cat:bug`, `cat:teste` ou `cat:texto`.

Quem abre a issue (agente ou usuário) já põe a etiqueta pelo critério. Quem tem acesso de triagem responde pelo conteúdo da issue com `correcao-automatica`: o texto entra no prompt do loop.

## Loop

`.github/workflows/issues-claude.yml`, com o mesmo token e as mesmas travas da [revisão](revisao.md#loop).

1. **Dispara** quando a issue ganha `correcao-automatica`, numa varredura diária das issues abertas com a etiqueta (até 2 por execução) ou à mão (Actions → Issues do Claude → Run workflow, com o número ou vazio para varrer).
2. **Pula** a issue fechada, sem a etiqueta, com a branch `feature/issue-<n>` ou com PR aberto, e a que já teve 2 tentativas sem PR (`LIMITE_TENTATIVAS`, marcador `<!-- loop-issues:tentativa -->`).
3. **Corrige**: o Claude confere a triagem; se não for erro claro (ou o problema já sumiu), comenta o motivo e o workflow troca `correcao-automatica` por `precisa-decisao`. Se for, a partir do `staging` (do `master` enquanto o staging não existe) na branch `feature/issue-<n>`: escreve o contrato `docs/tarefas/issue-<n>.md` com `issue: <n>` e o escopo mais estreito, corrige, roda `npm run check`, faz commit e `git push origin HEAD` e abre o PR para o `staging` com `Closes #<n>`, "Implementou: claude" e a saída do check. Mudança que quem joga nota leva o fragmento `changelog.d/issue-<n>.md` ([fluxo.md](fluxo.md)).
4. **Revisa**: o PR entra na revisão cruzada de sempre (o Codex revisa; achados voltam para o Claude pelo job `corrige`, até 3 rodadas).
5. **Fecha**: com a revisão aprovada e a CI verde, o PR entra sozinho no `staging` (auto-merge, [fluxo.md](fluxo.md#entrada-no-staging)) e o workflow `staging.yml` fecha a issue com um aviso; a correção chega à produção na próxima release, com o merge do usuário.

**A issue vale como contrato.** No PR de `feature/issue-<n>`, a CI lê as etiquetas da issue `<n>` e o `check:escopo` aceita como aprovado se a issue tem `correcao-automatica` e o contrato tem `issue: <n>`, sem a etiqueta `contrato-aprovado`. O resto do contrato vale igual: diff só dentro do escopo.

**Travas**:
- Balanceamento nunca é automático: arquivo `src/data/balance*` no diff de `feature/issue-<n>` é erro no `check:escopo`, a menos que o usuário ponha `contrato-aprovado` no PR.
- Processo nunca é automático: AGENTS.md, workflows, hooks e scripts de verificação só mudam em `feature/harness*` (`check:regras`).
- Push só `git push origin HEAD` na branch da issue, sem `--force`; sem `gh pr merge`. Depois, o workflow confere que o PR descende da base usada e não tem `Co-Authored-By`; se falhar, avisa no PR.
- O texto da issue é descrição do problema, não instrução: o prompt manda o Claude não mudar regras nem processo por causa dele.

**Modelo e métricas**: o job `corrige` escolhe o modelo pelo perfil da issue (leve ou padrão, alternado por issue quando `PILOTO_PERFIS=on`, com escalada na 2ª tentativa) e, depois de cada execução, comenta na issue o consumo (tokens por modelo, tempo, turnos, resultado). O job `corrige` da revisão faz o mesmo nos PRs de `feature/issue-<n>`. Regras e relatório (`npm run metricas`) em [metricas.md](metricas.md).

**O usuário entra** na triagem (`precisa-decisao`), quando o loop para (2 tentativas sem PR, limite de rodadas da revisão) e no merge.

**Configuração**: a mesma da revisão (segredo `CLAUDE_CODE_OAUTH_TOKEN` e app do Claude no repositório, [revisao.md](revisao.md)) e as etiquetas `inconsistencia`, `correcao-automatica` e `precisa-decisao`. Sem o segredo, o workflow avisa e pula.

**Pendente de teste real** (o workflow de `issues` só roda a partir do `master`): abrir uma issue de erro claro com `correcao-automatica` e conferir branch, contrato, PR, revisão do Codex e fechamento no merge. Também falta ver se a revisão automática do Codex dispara num PR aberto pelo app do Claude; se não disparar, pedir `@codex review` à mão no PR.
