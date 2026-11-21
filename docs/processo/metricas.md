# Modelos, esforço e métricas

Como escolher quem executa uma tarefa, com que modelo e esforço, e como medir o consumo até o PR ficar pronto para merge. A fase 1 é um piloto no [loop das issues](issues.md#loop), só com o Claude.

## Como escolher

1. **Ambiente e ferramentas**: quem consegue reproduzir e verificar (o `check:meta` no Windows pede a máquina; mudança visual pede UI Lab e navegador, hoje com o Claude, [codex.md](codex.md)).
2. **Qualidade observada**: entre os que têm as ferramentas, quem fecha tarefas parecidas com checks verdes, menos achados bloqueantes na primeira revisão e menos rodadas.
3. **Consumo até o PR pronto**, com a revisão do outro agente incluída. Tempo e cota disponível desempatam.

O executor e o modelo são escolhas separadas: se a tarefa passa do Claude para o Codex, o Claude revisa; se o executor só sobe de modelo, o revisor continua o outro agente.

| Dificuldade | Exemplos | Configuração inicial |
|---|---|---|
| Baixa | Link, texto ou caminho com destino conhecido | Modelo leve (Haiku no Claude) ou esforço baixo no Codex |
| Média | Bug reproduzível, tela com comportamento definido | Modelo padrão, esforço médio; checks e a verificação da tarefa |
| Alta | Motor de combate, migração de save, CI e permissões | Modelo mais capaz desde o início; esforço alto se o diagnóstico pedir |

## Piloto no loop das issues (fase 1)

| Perfil | Modelo | Esforço |
|---|---|---|
| `leve` | `claude-haiku-5-5` | padrão do modelo |
| `padrao` | `claude-sonnet-5-5` (o que o loop usava) | padrão do modelo |

Os modelos estão em `MODELOS` (`scripts/metricas.ts`). O esforço só vira variável depois de fechada a comparação de modelo.

- **Liga** com a variável de repositório `PILOTO_PERFIS=on` (Settings → Secrets and variables → Actions → Variables). Desligado, tudo roda no padrão; o registro vale sempre.
- **Alternância**: issue ímpar começa no `leve`, par no `padrao`. O perfil com que a issue começou fica registrado e vale mais que a paridade.
- **Escalada** (sobe para o `padrao`, nunca desce na mesma issue): na 2ª tentativa da issue (a 1ª terminou sem PR) e, no PR de `feature/issue-<n>`, da 2ª rodada de correção da revisão em diante. Falha de ambiente (o `npm ci` quebrou) não escala.
- **Fora do piloto**: os jobs `automatica` e `comentario` da revisão (PR do Codex) e as tarefas comuns seguem como estão.

## Registro

Cada execução do Claude no loop (correção da issue e cada rodada de correção no PR) deixa um comentário na issue com uma linha legível e um marcador `<!-- metricas:{...} -->` (`scripts/metricas-execucao.ts registra`); a mesma linha vai no resumo do job. Nada é gravado no repositório.

| Campo | O que é |
|---|---|
| `issue`, `pr`, `etapa`, `tentativa` | `etapa` é `issue` ou `revisao-<rodada>` |
| `perfil`, `modelo` | o pedido no `--model` |
| `porModelo` | tokens por modelo: `input`, `output`, `cacheRead`, `cacheCreation` (o Claude Code usa o Haiku em tarefas de fundo, por isso aparece mesmo no perfil padrão) |
| `duracaoMs`, `turnos`, `custoUsd` | da mensagem final do Claude Code; o custo é estimado (o loop usa o token da assinatura) |
| `resultado` | `pr-aberto`, `sem-pr`, `precisa-decisao`, `corrigido`, `sem-commit` ou `nao-rodou` |
| `falha` | vazio, `mudanca` (terminou sem PR), `execucao` (a action falhou) ou `ambiente` |

Os tokens vêm do `execution_file` do `claude-code-action`. **Entrada normalizada** = `input + cacheRead + cacheCreation`: a métrica de entrada do Claude Code exclui o cache, então só a normalizada se compara com outro agente.

## Relatório

`npm run metricas` (com o `gh` autenticado) lê os marcadores das issues com `inconsistencia` e o estado dos PRs `feature/issue-<n>`, e imprime duas tabelas em Markdown:

- **por issue**: perfil inicial, se escalou, execuções e rodadas somadas (as tentativas que falharam entram), revisões do Codex com achados, tokens normalizados, custo estimado, se o PR foi mergeado;
- **por categoria × perfil inicial**: issues, **concluídas** (PR mergeado no `staging`, que exige `check`, `meta` e `revisao-cruzada`; a chegada ao `master` depende da data da release, não do agente), **mediana de tokens normalizados até o PR pronto**, mediana de tempo, quantas escalaram.

A categoria vem da etiqueta `cat:<nome>` posta na triagem ([issues.md](issues.md#triagem)); sem ela, `sem-categoria`.

## Critério de promoção

Categoria do piloto: **correções documentais verificáveis** (`cat:docs`: links, caminhos, texto, doc que não acompanhou mudança registrada). O perfil leve vira o inicial da categoria quando, com **pelo menos 6 issues em cada perfil**:

- concluídas do leve ≥ concluídas do padrão menos 1;
- mediana de tokens normalizados do leve (com a escalada somada) ≤ 70% da do padrão;
- no máximo 1 em 3 issues leves escalou.

Se escalar mais ou concluir menos, volta ao padrão e o leve fica para uma subcategoria mais previsível (só links, por exemplo). A decisão é do usuário, registrada em `docs/registro.md` e, se mudar o padrão, em `docs/decisoes.md`. Os números deste critério foram propostos sem dados e podem mudar com o piloto.

Linha de base: as issues #26 e #27 rodaram no perfil padrão antes do registro; os números delas estão no log do job (a #27: 15 turnos, 81 s, US$ 0,26 estimados).

## Fase 2 (fora deste piloto)

Alternar Claude e Codex em tarefas parecidas, cada issue com um executor. A revisão automática do Codex roda na nuvem dele e não expõe tokens; medir o Codex pede execuções controladas com `codex exec --json` (eventos de uso) e `model_reasoning_effort`, num plano próprio. Para comparar, acompanhar a cota de cada plano em separado.
