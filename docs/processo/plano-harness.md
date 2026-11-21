# Plano: harness comum para Claude Code e Codex (Ninja Roleta)

## Contexto

O projeto passou a ser feito por dois agentes: o Claude Code, que lê o `CLAUDE.md` e o `.claude/skills/`, e o Codex, que lê o `AGENTS.md` (hoje inexistente). As regras que importam (escopo, testes, docs junto com o código, nada no `master`, balanceamento só proposto) existem só como texto, e só um dos agentes lê esse texto.

**Objetivo**: os dois agentes leem as mesmas regras e passam pelas mesmas verificações automáticas. O que não pode falhar fica no git e na CI, que valem para qualquer agente e para você.

**Princípios do plano**
- Uma fonte de verdade: o `AGENTS.md`. O `CLAUDE.md` importa dele.
- A garantia mais forte vale para todos: git hooks, CI e proteção do `master`. As configurações de cada agente são reforço.
- Cada fase é uma branch `feature/harness-<n>` e um PR pequeno. Nenhuma fase mexe em regra, número ou tela do jogo.

---

## Como executar este plano (em qualquer um dos agentes)

1. Salve este arquivo no repositório como `docs/processo/plano-harness.md` (já na Fase 1).
2. Rode uma fase por sessão, com o prompt abaixo (troque o `N`):

```
Leia AGENTS.md (ou CLAUDE.md, se o AGENTS.md ainda não existir) e docs/processo/plano-harness.md.
Execute só a Fase N, numa branch feature/harness-N criada a partir do master atualizado.
Não mexa em nada fora dos "Arquivos" da fase. Não altere regra, número ou tela do jogo.
Ao terminar: rode a "Verificação" da fase, mostre a saída, faça commit e push só da branch e
me entregue o resumo do que mudou, do que ficou de fora e do que precisa da minha ação manual.
```

3. A revisão é sempre do **outro** agente. Se o Codex implementou, peça ao Claude `/code-review` no PR; se o Claude implementou, peça a revisão ao Codex. Você faz o merge.

---

## Fase 1: uma fonte de regras (`AGENTS.md`)

**Arquivos**: `AGENTS.md` (novo), `CLAUDE.md`, `.github/pull_request_template.md` (novo), `docs/processo/plano-harness.md` (novo), `docs/processo/tarefa-modelo.md` (novo).

1. Mova o conteúdo do `CLAUDE.md` para o `AGENTS.md` sem mudar regra nenhuma (visão geral, onde está cada coisa, regras dos docs, princípios, stack, interface, convenções). Acrescente três seções novas:
   - **Definição de pronto**: `npm run check` verde (ou typecheck, testes e `npm run proto`, até a Fase 2 existir); doc atualizado no mesmo commit; `CHANGELOG.md` se o jogador nota a mudança; `docs/registro.md` se houve decisão sem o usuário; nada fora do escopo da tarefa.
   - **Escopo**: toda tarefa começa por um contrato (`docs/tarefas/<tema>.md`, a partir da Fase 4), com objetivo, fora do escopo, caminhos permitidos e critério de pronto. Se o agente achar algo fora do escopo (um bug, uma melhoria), ele anota em "Achados" no resumo e não corrige.
   - **Skills e fluxos**: uma tabela com o caminho de cada `SKILL.md` (`.claude/skills/nova-mecanica`, `.claude/skills/lancar-versao` e as que vierem). A regra: "antes de uma tarefa do tipo X, leia o SKILL.md correspondente". Assim o Codex usa as mesmas skills sem depender do suporte nativo.
   - **Dois agentes**: uma branch tem um agente por vez; quem implementa não revisa.
2. O `CLAUDE.md` passa a ter só `@AGENTS.md` mais o que é específico do Claude Code (hooks e permissões da Fase 3). Mantenha "Commits sem `Co-Authored-By`" no `AGENTS.md`, porque vale para os dois.
3. O `pull_request_template.md` é o contrato resumido, com os campos Objetivo, Fora do escopo, Caminhos tocados, Como verifiquei (comandos e saída), Docs atualizados, Achados fora do escopo e Agente que implementou e agente que revisou.
4. O `tarefa-modelo.md` é o modelo do contrato (ver Fase 4).

**Verificação**: `npm test` (o `tests/docs.test.ts` continua verde) e o `git diff master --stat` só com os arquivos acima. Abra uma sessão nova em cada agente, pergunte "qual a regra para mudar um número de balanceamento?" e confira se os dois respondem igual.

---

## Fase 2: verificação única e git hooks (vale para todos)

**Arquivos**: `package.json` (scripts), `scripts/check-regras.ts` (novo), `.githooks/pre-commit` e `.githooks/pre-push` (novos), `.github/workflows/ci.yml`, `tests/checkRegras.test.ts` (novo), `AGENTS.md` (a definição de pronto aponta para `npm run check`).

1. `scripts/check-regras.ts` transforma as convenções escritas em verificação. Ele compara os arquivos alterados (`git diff --name-only <base>...HEAD` mais o que não foi commitado; base = `origin/master`) e falha com uma mensagem clara quando:
   - um arquivo de `src/core/` usa `Math.random`, `document`, `window` ou `localStorage`, conferido pelo conteúdo e não só pelo diff;
   - mudou `src/data/balance*` ou outro número em `src/data/` e não mudou `docs/registro.md` → aviso (que vira erro com `--estrito`);
   - mudou `src/core/` e nenhum arquivo em `tests/` → erro;
   - mudou o código do jogo (`src/`, `prototype/`) e não mudou nada em `docs/` nem no `CHANGELOG.md` → aviso;
   - mudou `CLAUDE.md`, `AGENTS.md`, `.githooks/` ou `.claude/settings.json` fora de uma branch `feature/harness-*` → erro (os agentes não afrouxam as próprias regras).

   Mantenha a lógica em funções puras testáveis, recebendo a lista de arquivos e o conteúdo, e teste-as em `tests/checkRegras.test.ts`.
2. Scripts no `package.json`:
   - `"check:regras": "tsx scripts/check-regras.ts"`
   - `"check": "npm run typecheck && npm test && npm run check:regras && npm run proto"`
   - `"prepare": "git config core.hooksPath .githooks || true"` (ativa os hooks no `npm install`, sem dependência nova).
3. `.githooks/pre-commit`: `npm run typecheck && npm run check:regras`. `.githooks/pre-push`: `npm run check`, com bloqueio de push para `master` e de push forçado.
4. A CI (`ci.yml`) troca os três passos por `npm run check`, e o `check:regras` roda com `--estrito` no `pull_request`.

**Verificação**:
- `npm run check` verde no estado atual.
- Um commit de teste com `Math.random` em `src/core/` é bloqueado; desfaça depois.
- Um push para `master` é bloqueado pelo hook (teste com `--dry-run`).

---

## Fase 3: reforço em cada agente

**Arquivos**: `.claude/settings.json` (novo, versionado), `.claude/hooks/stop-check.sh` (novo), `CLAUDE.md` (a seção específica), `docs/processo/codex.md` (novo).

**Claude Code** (`.claude/settings.json`):
- `permissions.deny`: `Bash(git push origin master*)`, `Bash(git push*--force*)`, `Bash(git push -f*)`, `Bash(git push*:master*)`.
- Hook `Stop` → `.claude/hooks/stop-check.sh`. Se houver mudança não commitada em `src/`, `prototype/`, `tests/` ou `scripts/`, o hook roda `npm run typecheck && npm run check:regras`. Se falhar, sai com código 2 e manda o erro para o stderr, e o Claude não encerra com a verificação vermelha. Sem mudanças, sai na hora.

**Codex** (`docs/processo/codex.md`, que é instrução para você, porque a configuração do Codex fica na sua máquina):
- Use o modo de aprovação que pede confirmação para rede e para comandos fora do workspace (sandbox de escrita só no workspace).
- Sempre abra a sessão na raiz do repositório, para ele carregar o `AGENTS.md`.
- O Codex não tem um hook equivalente ao `Stop`, e quem segura a qualidade dele é a Fase 2 (pre-commit, pre-push e CI). Por isso a Fase 2 vem antes desta.

**Ação manual sua no GitHub** (nenhum agente faz):
- Proteja o `master` (Settings → Branches): exigir PR, exigir o check `Verificar / check` verde e bloquear push forçado e exclusão.

**Verificação**: no Claude, peça um push para `master` e confira que ele é negado; deixe um erro de tipo de propósito e confira que o hook impede o encerramento. No GitHub, um PR com teste quebrado não pode ser mergeado.

---

## Fase 4: contrato de tarefa e conferência de escopo

**Arquivos**: `docs/processo/tarefa-modelo.md`, `scripts/check-escopo.ts` (novo), `tests/checkEscopo.test.ts` (novo), `package.json` (incluir no `check`), `AGENTS.md`.

1. O contrato fica em `docs/tarefas/<tema>.md`, onde `<tema>` é o nome da branch sem `feature/`. Ele também serve de histórico do que foi pedido. Frontmatter:
   ```yaml
   ---
   objetivo: Uma frase.
   escopo: ["src/core/roleta/**", "tests/roleta*.test.ts", "docs/roleta/**", "CHANGELOG.md"]
   fora: ["src/data/balance*", "prototype/**"]
   pronto: ["npm run check verde", "sim:origens sem sair da meta"]
   ---
   ```
   O corpo tem o contexto e as decisões pedidas. Quem escreve o contrato é o agente, a partir do seu pedido. **Você aprova antes do código.**
2. `scripts/check-escopo.ts` acha o contrato pela branch atual e compara os arquivos alterados com `escopo` e `fora`. Fora do escopo dá erro, listando os arquivos. Sem contrato, numa branch `feature/*`, dá aviso no início e erro depois de duas semanas de uso, quando o hábito pegar. `AGENTS.md`, `package-lock.json` e o próprio contrato sempre passam.
3. No `AGENTS.md`: "se precisar sair do escopo, pare e peça para atualizar o contrato; não amplie sozinho".

**Verificação**: numa branch de teste com um contrato limitado a `docs/**`, editar um arquivo de `src/` faz o `npm run check` falhar com a lista dos arquivos.

---

## Fase 5: guarda da meta de balanceamento

**Arquivos**: `tests/meta.test.ts` (novo) e, se preciso, a extração das funções de simulação de `scripts/sim-origens.ts` e `scripts/sim-jornada.ts` para `src/sim/` (sem mudar comportamento).

1. A simulação é curta e com seed fixa (por exemplo 60 runs por dificuldade e origem ou classe, seed 2), com faixa **larga** (meta ±15) em volta de 90/65/40/15. Ela não mede o balanceamento, só detecta que uma mudança mexeu na taxa de vitória sem querer.
2. Se passar de ~20 s, vira `npm run check:meta` e só a CI roda.
3. No `AGENTS.md`: "se o teste da meta quebrar, não ajuste números para passar. Pare e proponha com a tabela de antes e depois (skill `auditar-balanceamento`)".

**Verificação**: o teste passa no `master`; mudar um número de dano em 50% numa branch de teste faz ele falhar.

---

## Fase 6: arte gerada por IA (retratos)

**Arquivos**: `public/img/retratos.json` (novo, manifesto), `tests/retratosImagem.test.ts` (novo), `docs/visual.md` (seção "Ficha de estilo dos retratos"), `public/img/LEIAME.md`, `.claude/skills/novo-retrato/SKILL.md` (novo).

1. **Ficha de estilo** em `docs/visual.md`:
   - o prompt base fixo, as referências e os parâmetros que você já usa;
   - enquadramento (quadrado 256×256, rosto na parte de cima), luz, paleta, traço e fundo;
   - prompt negativo (sem texto, logo ou moldura).
2. **Manifesto** `retratos.json`, com uma entrada por imagem de `public/img/{ninja,viloes,jornada}`: `{ arquivo, chave, ferramenta, data, prompt, referencias, parametros, aprovado }`. Preencha com o que você lembrar dos retratos atuais e marque `"origem": "desconhecida"` no que faltar.
3. **Teste**:
   - toda imagem tem entrada no manifesto e toda entrada tem arquivo;
   - cada imagem tem 256×256 (reaproveite `scripts/image-size.ts`, que já tem teste em `tests/imageSize.test.ts`) e até 30 KB;
   - nenhuma imagem fica sem uso: a chave aparece nos dados ou na lista de variantes.

   O `tests/portraits.test.ts` já cobre o outro lado (toda chave dos dados tem desenho SVG de reserva) e não muda.
4. **Skill `novo-retrato`**: gerar pela ficha → exportar em WebP 256×256 → registrar no manifesto → conferir na galeria do UI Lab (`prototype/lab/portraitGallery.ts`) nos dois temas → só então integrar.
5. No `LEIAME.md`, uma linha dizendo que os retratos são gerados por IA a partir de referências, e que os direitos continuam com os detentores (o aviso atual continua).

**Verificação**: `npm test` verde; apagar uma entrada do manifesto ou pôr uma imagem de 300×300 faz o teste falhar.

---

## Fase 7: skills de rotina

**Arquivos**: `.claude/skills/auditar-balanceamento/SKILL.md`, `.claude/skills/revisar-visual/SKILL.md` (mais o script em `scripts/`), e a tabela de skills do `AGENTS.md`.

- **auditar-balanceamento**: roda `sim:origens` e `sim:jornada` com `--auditoria`, `--reliquias` ou `--iniciais` (comandos em `docs/balanceamento/benchmark.md`). Monta a tabela de antes e depois contra a meta e **só propõe**. Termina com um item em `docs/decisoes.md`, se for o caso.
- **revisar-visual**: compila o lab (`npm run lab`) e usa o Playwright (já instalado no ambiente) para fotografar os cenários alterados em 390px e 1280px, nos temas Sumi e Pergaminho e com movimento reduzido. Depois lista o que destoa de `docs/visual.md` e das regras de interface do `AGENTS.md`.
- As duas são escritas em markdown neutro e listadas no `AGENTS.md`, para o Codex usar lendo o arquivo.

**Verificação**: rode cada skill uma vez numa branch de teste, nos dois agentes, e compare as saídas.

---

## Dia a dia depois do plano

1. Você descreve o pedido → o agente escreve `docs/tarefas/<tema>.md` → você aprova.
2. O agente implementa na `feature/<tema>`, roda `npm run check` e faz commit e push da branch (hooks e CI conferem).
3. O outro agente revisa o PR (o template mostra escopo, verificação e achados).
4. Você mergeia. Publicar continua só com "publica vX.Y.Z" (skill `lancar-versao`).

## Fora deste plano (para depois)
- Unificar `docs/visual.md`, `DESIGN.md`, `.impeccable/` e `tokens.css` numa fonte só.
- Regressão visual automática com snapshot na CI.
- Fluxo `feature → staging → main` previsto para a v1.0.0.

## Verificação final
- Sessão nova no Claude e no Codex: os dois citam as mesmas regras e as mesmas skills.
- Um commit que viola uma convenção é barrado localmente e na CI, independente do agente.
- Um PR para `master` sem CI verde não pode ser mergeado.

---

## Andamento

Feito pelo Claude Code em 18/11/2026, na branch `feature/harness` (um commit por fase, em vez de uma branch por fase), com o contrato em [docs/tarefas/harness.md](../tarefas/harness.md).

| Fase | Situação | O que ficou de diferente do plano |
|---|---|---|
| 1 | feita | — |
| 2 | feita | A skill `lancar-versao` passou a publicar só pelo merge do PR (o hook recusa push no `master`); apagar branch `feature/*` é permitido |
| 3 | feita | O hook `Stop` bloqueia uma vez por resposta (com `stop_hook_active`, deixa encerrar para não entrar em laço) |
| 4 | feita | Sem contrato: aviso até 02/12/2026, erro depois (`EXIGIR_CONTRATO_A_PARTIR` em `scripts/check-escopo.ts`). Versão, `CHANGELOG.md`, `docs/registro.md` e `docs/decisoes.md` sempre podem mudar |
| 5 | feita | Em vez de extrair o bot para `src/sim/`, as simulações ganharam `--json` e o `scripts/check-meta.ts` roda as duas (job próprio na CI, ~1 min). Faixa: célula ±20, média do modo ±10 |
| 6 | feita | Os 94 retratos entraram no manifesto com `ferramenta`, `prompt` e `referencias` vazios (pendentes); só retrato novo é cobrado |
| 7 | feita | `revisar-visual` usa `scripts/revisar-visual.ts` (fotos em `dist-lab/revisao/`) |

### Revisão do Codex (18/11/2026)

O Codex revisou a branch na nuvem com o prompt de `docs/processo/codex.md`. Respondeu igual ao Claude às perguntas sobre as regras (os dois leem o mesmo `AGENTS.md`), rodou `npm run check` e `check:meta` em verde e apontou dez achados, todos corrigidos:

| # | Achado | Correção |
|---|---|---|
| 1 | O escopo aceitava o `package.json` inteiro e contrato ampliado no próprio diff | Só a linha `version` passa sem estar no escopo; `scripts` do `package.json` viram arquivo do processo; no PR, o contrato vale só com a etiqueta `contrato-aprovado`, que só o usuário põe |
| 2 | O `pre-push` testava a árvore atual mesmo subindo outra branch | Recusa push de branch que não é a atual e quando não dá para conferir a ancestralidade; a proteção do `master` aparece nos docs como pendência do usuário |
| 3 | Sem contexto do git, a verificação ficava verde | Na CI, sem base ou com erro no git, dá erro; o tema vem também do único contrato alterado no diff (branches com nome do Codex) |
| 4 | A skill `nova-mecanica` mandava compensar o balanceamento sozinho | Passa pela skill `auditar-balanceamento` e espera o aval; a regra do registro pega o `balance.ts` de todos os modos |
| 5 | O `pre-commit` olhava a árvore inteira | `check:regras --preparado`: só o que vai no commit; o typecheck foi para o pre-push e a CI |
| 6 | O `check:meta` aceitava simulação vazia | Exige cobertura: cada grupo nas quatro dificuldades, sem repetição, taxas entre 0 e 1 |
| 7 | A captura visual não achava o navegador e aceitava id errado | `--chromium=` / `PW_CHROMIUM`; id desconhecido para antes; "Cenário desconhecido" na tela vira erro |
| 8 | A pureza do core dava falso positivo em string e deixava passar formas indiretas | Leitor léxico que apaga strings e comentários (o TypeScript 7 do projeto não expõe a API do compilador) e padrões para desestruturação, `?.` e `Math['random']` |
| 9 | O padrão da branch de processo aceitava `feature/harnessidental` | `^feature/harness(-[a-z0-9-]+)?$` |
| 10 | O `CLAUDE.md` prometia mais do que o hook `Stop` faz | Descrição fiel (bloqueia uma vez por resposta); o hook observa também os arquivos do processo |

### Segunda revisão do Codex (18/11/2026)

Dos dez achados, o Codex confirmou 4 como corrigidos e 6 como parciais, e trouxe 3 novos. Corrigido no commit seguinte:

| Achado | Correção |
|---|---|
| 1 parcial: a etiqueta vale para o PR inteiro, mesmo com o contrato ampliado depois dela Primeiro virou regra do `AGENTS.md` (achava-se que a CI não sabia quando a etiqueta foi posta). Resolvido por código em 21/11/2026 (#59, tarefa `harness-portao`): a timeline do PR diz quem pôs a etiqueta e quando, o `aprovacao.yml` registra o contrato nesse momento e o `check:escopo` vence a aprovação se ele mudou |
| 2 parcial: o check do `pre-push` rodava na árvore com mudanças fora do commit | O `pre-push` exige árvore limpa |
| 3 parcial: sem tema, fora da CI, era só aviso mesmo depois do prazo | A partir de 02/12/2026, sem tema é erro em qualquer lugar (`CHECK_TEMA=<tema>` resolve) |
| 6 parcial: a Roleta passava com uma origem só | Os grupos esperados vêm dos dados (8 origens) e da lista de modos da Jornada; faltando ou sobrando é erro |
| 8 parcial: `/window/` em regex dava falso positivo e `const rng = Math` passava | O leitor reconhece regex literal; `Math` usado como valor (sem `.`) é violação. Continua heurístico: uma análise com resolução de referências exigiria a API do compilador, que o TypeScript 7 não expõe |
| 10 parcial: edição só no `ci.yml` não disparava o `Stop`, e a mensagem citava o `pre-commit` para tipos | O hook observa também `.github/`; mensagem corrigida |
| Novo 1: etiqueta posta durante o `meta` podia deixá-lo "pulado", que o GitHub aceita | O `meta` roda em todo evento, inclusive de etiqueta |
| Novo 2: o `package-lock.json` passava inteiro sem estar no escopo | Só passa sozinho se mudar apenas a versão do projeto |
| Novo 3: caminho com acento chegava entre aspas do git | Listas do git com `-z` (separadas por NUL) |

### Terceira revisão do Codex (18/11/2026)

Os nove itens da segunda revisão foram confirmados como corrigidos. Um achado novo bloqueava o merge: com a detecção de renomeação do git, mover um arquivo de um caminho proibido para um permitido listava só o destino. Os diffs passaram a usar `--no-renames` (origem e destino entram na lista), com teste num repositório git de verdade, no índice e contra a base. O guia da nuvem passou a dizer que, sem tema, o erro vale em qualquer lugar a partir de 02/12/2026.

Junto: retratos descritos pelo processo real (imagens-modelo do usuário e revisão humana; `referencias` obrigatório, `prompt` opcional, campo `ajustes`) e o guia do Codex na nuvem.

### Revisão cruzada automática (18/11/2026, `feature/harness-revisao-cruzada`)

A revisão do outro agente passou a chegar sozinha no PR: o Claude revisa os PRs do Codex pelo workflow `.github/workflows/revisao-claude.yml` (token do plano do usuário, `CLAUDE_CODE_OAUTH_TOKEN`, sem custo extra) e o Codex revisa os do Claude pela revisão automática dele. As instruções ficam em `docs/processo/revisao.md`, lidas pelos dois (o `AGENTS.md` aponta para elas na seção "Review guidelines"). A proteção do `master` ficou registrada como configurada: PR e checks obrigatórios, sem aprovação no GitHub, merge pelo dono com bypass.

**Pendências do usuário**:
- proteger o `master` no GitHub (exigir PR e os checks `check` e `meta`, sem push forçado);
- criar a etiqueta `contrato-aprovado` e pô-la nos PRs cujo contrato aprovou;
- pedir ao Codex uma segunda revisão;
- preencher, quando quiser, as `referencias` dos retratos atuais.

