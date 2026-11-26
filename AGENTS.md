# AGENTS.md

Regras do projeto para qualquer agente (Claude Code, Codex) e para quem contribui. É a fonte única: o `CLAUDE.md` só importa este arquivo e acrescenta o que é específico do Claude Code.

## Visão geral

Jogo de browser feito para o celular, inspirado no universo ninja de Naruto. Projeto de fã, open source, sem fins lucrativos. A roleta visual é a identidade do jogo (inspiração: https://pokemon-roulette.zeroxm.com.br/).

**O RNG é o coração do jogo**: origem, iniciativa, acerto, dano, eventos e recompensas passam por sorteio, e os status do jogador sempre influenciam as chances. No Roleta, a roleta aparece na tela; na Jornada, a sorte pesa menos e só o resultado aparece.

### Modos

Três modos, cada um com uma finalidade:

| Modo | Finalidade | Como se joga |
|---|---|---|
| **Roleta** | Rápido e simples: uma sessão curta no celular (lutas de poucas rodadas, combate explosivo) | Origem sorteada; kit de 1 passiva que evolui com o nível e 2–3 técnicas-chave, sem ativas para gerenciar; ciclo de 6 lutas com evento e relíquia sorteados; infinito no Hardcore |
| **História** (Jornada) | Longa e narrativa: viver a história do Naruto | Linear, segue o mangá; equipe, roteiro de luta, cenas e treinos; a rejogabilidade vem da variedade de talentos |
| **Caminho Ninja** (Jornada) | Roguelike de builds | Classe e elemento escolhidos, mapa ramificado, relíquias, loja e árvore; a rejogabilidade vem dos inimigos, dos caminhos e das builds; infinito no Hardcore |

História e Caminho Ninja dividem o combate de equipe, a loja, as relíquias e as árvores (a run da Jornada é salva a cada parada). Em desenvolvimento: campanha do Sasuke e outras classes na Jornada.

**Meta de vitória do bot** (por origem ou classe, ±5): Fácil 90%, Médio 65%, Difícil 40%, Hardcore 15% ([docs/decisoes.md](docs/decisoes.md)).

## Onde está cada coisa

| Arquivo | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice das regras do jogo |
| [docs/decisoes.md](docs/decisoes.md) | **O que espera o usuário**: balanceamento fora do alvo e design em aberto. Ler antes de mexer em regra ou número |
| [docs/visual.md](docs/visual.md) | Direção visual: identidade por modo, locais e regra da arte. Ler antes de mexer na interface |
| [docs/registro.md](docs/registro.md) | Histórico das decisões e das simulações por versão. Só consulta: não ler inteiro sem motivo |
| [docs/balanceamento/](docs/balanceamento/benchmark.md) | Benchmark (cenários, comandos `--auditoria`, `--reliquias`, `--iniciais`, linha de base) e o diagnóstico de balanceamento. Ler antes de propor ajuste |
| `CHANGELOG.md` | Histórico de versões (o que mudou para quem joga) |
| [docs/ui-lab/](docs/ui-lab/ARCHITECTURE.md) | UI Lab: inventário das telas e arquitetura do laboratório (cenários em `prototype/lab/`) |
| `.claude/skills/` | `nova-mecanica` (fluxo de regra nova) e `lancar-versao` (preparar e, com aprovação, publicar) |

Pastas dos docs: `base/` (regras comuns ao Roleta e à Jornada), `roleta/`, `jornada/` e `reserva/` (combate clássico guardado para a Jornada).

### Regras para os docs

- **Os docs são o design; os dados são a implementação.** Os números vivem em `balance` e `src/data/`; os docs devem bater com eles.
- Mudou regra ou número no código: atualizar o doc no mesmo commit.
- Código e doc divergem e não está em `docs/decisoes.md`: perguntar antes de escolher um lado.
- Cada regra é descrita em **um** arquivo; os outros apontam com link. Regra comum ao Roleta e à Jornada fica em `docs/base/`; a Jornada só descreve o que muda.
- Decisão tomada sem o usuário: registrar em `docs/registro.md` (frase curta + simulação de antes e depois) e, se ele precisa revisar, um item em `docs/decisoes.md`.
- `tests/docs.test.ts` confere que toda técnica do jogador está em `docs/base/tecnicas.md` e toda de vilão em `docs/base/viloes.md`.
- **Não apagar o clássico**: reações, disputa, barreiras, estados elementais, linhas elementais e kits ricos ficam no código (com testes, `npm run sim:classico`) e em `docs/reserva/`.

## Princípios

- **Celular e desktop são pares**: no celular, um toque, layout vertical e botões grandes; no desktop, composição própria (colunas, painéis fixos), não o celular ampliado. Mesma lógica nos dois; faixas e situação por tela em [docs/visual.md](docs/visual.md).
- **Offline**: PWA com service worker (`prototype/sw.ts`; [docs/base/plataforma.md](docs/base/plataforma.md)). **Sem backend.**
- **Run do Roleta só em memória** (F5 reseta); a Jornada é salva a cada parada (`jornada_run_v1`). Perfil e histórico em `localStorage`.
- **Lógica separada da interface**: regras são funções puras, sem DOM.
- **RNG injetável**: toda função que sorteia recebe `rng()`; testes com seed.
- **Tudo é dado**: origens, técnicas, vilões, eventos, itens e recompensas em arquivos de dados; textos em PT-BR nos arquivos de strings.
- README deixa claro que é projeto de fã, sem afiliação oficial.

## Stack e estrutura

TypeScript sem framework de UI; Vitest; esbuild gera o protótipo (`scripts/build-prototype.ts`: um HTML só, mais `sw.js`, manifesto e ícones). Não há Vite. A CI roda `npm run check` em toda `feature/**` e PR (`.github/workflows/ci.yml`; no PR, o `check:regras` é estrito); o `pages.yml` publica o `master`.

```
docs/                design (ver acima)
src/core/            regras puras comuns; roleta/ (motor e run do Roleta); jornada/ (combate de equipe, mapa, talentos, relíquias)
src/data/            balance e dados; roleta/ e jornada/ com os de cada modo; strings/ptBR.ts
src/sim/             bots da simulação
src/state/           save da Jornada
prototype/           interface jogável: main.ts (inicialização), roleta/ (session.ts com o estado, telas em screens/), jornada/,
                     shell.ts, gate.ts, registry.ts, art.ts com ícones e símbolos, portraits/ com os retratos (um desenho por
                     personagem), styles/
scripts/             simulações e build
tests/               testes do core
```

Comandos: `npm run check` (verificação completa, a mesma do pre-push e da CI), `npm run check:meta` (guarda da meta de vitória, só na CI por ser lenta), `npm test`, `npm run typecheck`, `npm run proto`, `npm run lab` (UI Lab, só local: `dist-lab/`, [docs/ui-lab/](docs/ui-lab/ARCHITECTURE.md); `npm run lab:seed -- --all` refaz as seeds dos cenários de sorteio), `npm run sim:origens -- --runs 300 --seed 2` (Roleta), `npm run sim:jornada -- [runs] [seed] [ciclos]`, `npm run sim:classico`. Auditoria de balanceamento: as mesmas simulações com `--auditoria`, `--reliquias` ou `--iniciais` ([docs/balanceamento/benchmark.md](docs/balanceamento/benchmark.md)).

## Interface (design system "Shinobi")

A direção está em [docs/visual.md](docs/visual.md): a interface deve parecer parte do universo.

- Estilos em `prototype/styles/` (camadas: `tokens.css` → `fonts.css` → `base.css` → `components.css` → `ornaments.css` → telas); o build junta e embute as fontes.
- Cores, fontes, durações e forma só por tokens (`var(--...)`); o tema é um só, Sumi (grafite), e mora nos tokens; o papel de cena (`.parchment`) leva a tinta escura. Texto confere contraste WCAG AA sobre o grafite e sobre o papel. `--primary` é ação e navegação e `--accent` é perigo, chefe e carimbo (hoje o mesmo vermelho). Cor solta só em arte (cenário, roda, cards de modo).
- **Nada de emoji como ícone**: SVG do `ICONS` em `prototype/art.ts` (`icon(nome)`), traço 24×24 em `currentColor`. Exceção: o texto de compartilhar.
- Cantos retos (`--radius: 2px`) e chanfro (`--cut`) nos painéis, sempre em `::before`/`::after`, nunca no elemento (cortaria números flutuantes e o foco).
- Painel no estilo das referências: `.parchment` (pergaminho rasgado), nuvens (`cloud()`), `.scroll-banner`.
- `--font-display` (pincel) só em letreiro grande; `--font-hand` (manuscrita) em título de pergaminho e citação; texto em `--font-body`; números e rótulos em `--font-hud`; kanji em `--font-kanji` (kanji novo entra no recorte, `prototype/fonts/LEIAME.md`).
- Ids, `data-*` e classes que o TS consulta (`.primary`, `.jf`, `.sticky-cta`...) são contrato: o visual não mexe neles.
- **Botões simples, detalhes na dica**: ícone, nome e números principais (dano, custo, usos). Efeitos, regras e motivo de bloqueio na dica (`tip()`). Nada de instrução no botão.

## Convenções

- `core` não acessa DOM, `localStorage` nem `Math.random`.
- Número de balanceamento só em configuração (`balance`).
- Dano e resistência arredondados para baixo no fim do cálculo.
- Antes de mudar uma fórmula, escrever ou ajustar o teste.
- Balanceamento: proposto ao usuário com a tabela de antes e depois, nunca compensado sozinho (alvo em `docs/decisoes.md`).
- **Branches e versões** ([docs/processo/fluxo.md](docs/processo/fluxo.md)): cada trabalho vai numa branch `feature/<tema>` com PR para o **`staging`**: testar, commitar, dar push só da branch e abrir o PR, sem esperar pedido (skill `lancar-versao`). O staging é o **playground** dos agentes: o PR entra sozinho (auto-merge) com `check` e `meta` verdes, sem revisão cruzada; erro de jogo pode entrar, build quebrado não. A **revisão humana é a release**, no PR permanente staging → master. O `master` é produção (o Pages publica a cada push) e só recebe o PR permanente do staging (release, sobe o y) e `hotfix/<tema>` (sobe o z), com merge, tag `vX.Y.Z` e deploy só com aprovação explícita do usuário ("publica vX.Y.Z"). No staging não há versão: quem joga nota a mudança, fragmento em `changelog.d/<tema>.md`. **Nada de push direto em `master` ou `staging`**; nunca `--force`.
- **Limpeza de branches** (Claude e Codex), para não acumular branch morta:
  - **`npm run limpar`** (`scripts/limpar-branches.ts`) faz a limpeza: sem argumento mostra o plano; `-- --aplicar` apaga no clone e no GitHub cada branch integrada (ponta no `origin/staging` ou no `origin/master`, ou igual à ponta de um PR mergeado, o que cobre o squash); `-- --aplicar --worktrees` também remove o worktree limpo dessas branches (no Windows, a pasta que o git não consegue apagar sai pelo Node). Compara com as bases remotas, não com o HEAD: o `git branch -d` recusa branch integrada quando o `master` local está atrasado. Branch com commit fora das bases e sem PR mergeado naquela ponta não é integrada e fica.
  - **Depois do merge**: o GitHub apaga a branch remota sozinho ("Automatically delete head branches", ligado em 19/11/2026); quem fez o merge roda `npm run limpar -- --aplicar --worktrees` para o clone.
  - **No começo de cada tarefa**: `npm run limpar -- --aplicar`. No Claude Code roda sozinho no início da sessão (hook `SessionStart`, `.claude/hooks/limpar-branches.sh`); o Codex roda à mão. Worktree de branch integrada só sai com `--worktrees`, depois de conferir que não é de outra sessão.
  - **Sem merge e parada há mais de 30 dias** (data do último commit): listar para o usuário (nome, último commit, PR, se houver) e apagar só com aprovação dele, porque o trabalho se perde.
  - **Nunca apagar**: `master`, `main` e `staging`; branch com PR aberto; branch em uso por outro agente ou sessão (com worktree ou commit recente de outro agente); tags.
- **Commits e PRs sem `Co-Authored-By`** nem outra linha de atribuição.

## Como trabalhar (dois agentes)

O projeto é feito pelo Claude Code e pelo Codex, com as mesmas regras. Plano de implantação deste processo: [docs/processo/plano-harness.md](docs/processo/plano-harness.md).

### Escopo

- Toda tarefa começa por um **contrato** com objetivo, o que fica de fora, caminhos que podem ser tocados, critério de pronto e o agente que implementa (modelo em [docs/processo/tarefa-modelo.md](docs/processo/tarefa-modelo.md); o arquivo fica em `docs/tarefas/<tema>.md`, com `<tema>` igual ao da branch `feature/<tema>`). O agente escreve o contrato a partir do pedido. É o plano e o limite de escopo da tarefa.
- Mexer só no que o contrato permite. Precisou sair do escopo: parar e pedir para atualizar o contrato; não ampliar sozinho. O `npm run check:escopo` (dentro do `npm run check`) compara o diff com o `escopo` e o `fora` do contrato; `CHANGELOG.md`, `changelog.d/*.md`, `docs/registro.md` e `docs/decisoes.md` sempre podem mudar; `package.json` e `package-lock.json`, só na versão do projeto (o resto muda o que se instala e precisa estar no escopo). O tema vem da branch `feature/<tema>` (ou `hotfix/<tema>`) ou, numa branch com outro nome (Codex na nuvem), do único `docs/tarefas/<tema>.md` alterado. Sem tema ou sem contrato é aviso, e vira erro a partir de 02/12/2026, na CI e na máquina (branch sem tema: `CHECK_TEMA=<tema>`).
- **Aprovação do contrato**: não há etiqueta. Com o usuário na conversa, o agente mostra o contrato antes do código e, com o "aprovado" dele, grava `aprovado: AAAA-MM-DD` no frontmatter; se o contrato mudar depois, pede de novo. Sem o usuário (Codex na nuvem, loop das issues), o agente segue: o controle do usuário é a release. A CI não confere o campo. **Agente nunca põe nem tira a etiqueta `correcao-automatica`** (o `.claude/settings.json` nega o `gh` com ela): ela é do usuário e libera o loop das issues.
- Achou bug, melhoria ou doc desatualizado fora do escopo: anotar em **Achados** no resumo final e no PR **e** abrir uma issue descritiva (ver [Issues](#issues)), sem corrigir na tarefa atual.
- Nada de refatoração, renomeação ou formatação "de passagem".

### Definição de pronto

Uma tarefa só está pronta quando:

1. `npm run check` passa (typecheck, testes, `check:regras`, `check:escopo` e build), com a saída mostrada no resumo. Os git hooks: `pre-commit` (`check:regras` sobre o que vai no commit) e `pre-push` (`npm run check` na branch que sobe, com a árvore limpa; recusa push no `master` e no `staging`, push forçado, push de uma branch que não é a atual e push com mudanças fora do commit). Eles só valem para push feito do próprio clone: a garantia final é a CI, a proteção do `staging` e do `master` no GitHub e a release. Hook nunca é pulado (`--no-verify` é proibido); se ele falha, corrige-se a causa. Os hooks e o `check:escopo` contam arquivo não rastreado como mudança: nota ou arquivo local vai em `.git/info/exclude` do clone, não no `.gitignore` versionado ([codex.md](docs/processo/codex.md#skills)).
2. Regra ou número mudou: o doc correspondente mudou no mesmo commit.
3. O jogador nota a mudança: fragmento `changelog.d/<tema>.md` (a linha do `CHANGELOG.md` sai na release; no hotfix, a linha direto).
4. Houve decisão sem o usuário: registrada em `docs/registro.md` e, se ele precisa revisar, em `docs/decisoes.md`.
5. Balanceamento: a tabela de antes e depois está no resumo e nada foi compensado sozinho. A CI roda a guarda da meta (`npm run check:meta`, job próprio, ~1 min): se ela quebrar, **não ajuste número para passar**; pare e proponha ao usuário com a tabela de antes e depois.
6. Só arquivos dentro do escopo do contrato aparecem no diff.
7. Commit e push só da branch `feature/<tema>`, PR para o `staging`; release, hotfix, tag e deploy só com aprovação explícita.

O resumo final segue o modelo de PR (`.github/pull_request_template.md`): objetivo, fora do escopo, caminhos tocados, como verificou, docs atualizados, achados e o agente que implementou.

### Skills e fluxos

As skills são instruções em markdown e valem para os dois agentes. **Antes de uma tarefa do tipo da tabela, ler o `SKILL.md` correspondente e seguir o fluxo dele.** O agente que não carrega skills sozinho (Codex) lê o arquivo pelo caminho. A coluna "Quem faz" é a área de cada agente ([Dois agentes](#dois-agentes)).

| Tipo de tarefa | Skill | Quem faz |
|---|---|---|
| Regra nova ou alterada, ajuste de fórmula ou balanceamento, reclamação de comportamento de jogo | [.claude/skills/nova-mecanica/SKILL.md](.claude/skills/nova-mecanica/SKILL.md) | Claude |
| PR para o staging, preparar e publicar release, hotfix (commit, push da branch, merge, tag) | [.claude/skills/lancar-versao/SKILL.md](.claude/skills/lancar-versao/SKILL.md) | Claude (e quem abre o PR) |
| Retrato ilustrado novo, refeito ou trocado (`public/img/ninja`, `viloes`, `jornada`) | [.claude/skills/novo-retrato/SKILL.md](.claude/skills/novo-retrato/SKILL.md) | Codex |
| Medir o balanceamento contra a meta, check:meta quebrado, antes de propor número | [.claude/skills/auditar-balanceamento/SKILL.md](.claude/skills/auditar-balanceamento/SKILL.md) | Claude |
| Conferir tela depois de mexer em interface (fotos do UI Lab em celular e desktop, grafite e menos movimento) | [.claude/skills/revisar-visual/SKILL.md](.claude/skills/revisar-visual/SKILL.md) | Codex |
| CSS, layout, composição e acabamento de tela (skill de terceiros Impeccable, abaixo) | `impeccable` | Codex |

Skill nova entra nesta tabela no mesmo commit.

**Skill de terceiros (Impeccable)**: design de interface (`impeccable`, de `pbakaus/impeccable`). O repositório guarda só a configuração: a versão fixada em `skills-lock.json` (4.9.0), o contexto de design (`PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`) e os hooks do Codex (`.codex/hooks.json`, que acham o launcher pela raiz do git, de qualquer subpasta). A skill em si é instalada por agente e fica fora do git: `npx skills add pbakaus/impeccable`, escolhendo Claude Code (`.claude/skills/impeccable/`) e Codex (`.agents/skills/impeccable/`). É opcional: sem ela, os hooks não fazem nada e as regras de interface continuam as deste arquivo e do `docs/visual.md`.

### Dois agentes

- **Área de cada agente** (coluna "Quem faz" da tabela de skills): o **Codex** faz o visual (CSS, layout, composição, acabamento de tela, Impeccable, revisão visual, retratos e imagens); o **Claude** faz a implementação (mecânica nova, balanceamento, estrutura, dados salvos, core, lógica e TS das telas, testes, docs de regra, processo). O `agente:` do contrato diz quem implementa, e o `check:escopo` avisa (sem barrar) quando um contrato mexe na área do outro.
- **Pedido da área do outro agente: delegar, não fazer.** O Claude que recebe um pedido visual escreve o contrato com `agente: codex` e um briefing (arquivos, cenários do UI Lab, o que melhorar, ids e `data-*` que não mudam) e aciona o Codex local com `npm run delegar -- <tema>`; o Codex implementa e commita, e o Claude confere, dá push e abre o PR ([docs/processo/delegacao.md](docs/processo/delegacao.md)). O usuário autoriza aqui, de forma permanente, essa delegação. Tarefa com as duas partes vira duas branches em sequência: o Claude entrega a funcionalidade com estrutura estável e CSS mínimo, e o Codex faz o acabamento depois do merge.
- Uma branch tem **um agente por vez**: Claude e Codex nunca trabalham juntos na mesma branch. Na delegação, o Claude só commita o contrato antes e só faz o push depois.
- **Sem revisão cruzada**: o staging é o playground e a revisão do usuário é a release, no PR permanente, que lista à parte os arquivos de processo alterados no lote. No "prepara a v0.Y.0", o agente publica no PR permanente uma revisão de IA do lote inteiro (`codex exec review`), que só informa ([docs/processo/revisao.md](docs/processo/revisao.md)). Revisão de um PR à mão, quando o usuário quiser: `@claude revise` num comentário.
- **Merge**: no `staging`, o GitHub mergeia sozinho com `check` e `meta` verdes, menos o PR de processo (`feature/harness*`), que é do usuário ([fluxo.md](docs/processo/fluxo.md#entrada-no-staging)). No `master`, só o usuário, como merge commit: o PR permanente do staging e os hotfix.
- Cada sessão começa lendo este arquivo e o contrato da tarefa. Configuração de cada agente: `CLAUDE.md` (Claude Code) e [docs/processo/codex.md](docs/processo/codex.md) (Codex).
- Este arquivo, o `CLAUDE.md`, os hooks, os scripts de verificação, os `scripts` do `package.json`, os workflows, as skills, os modelos de PR e issue, o `docs/processo/` e as configurações dos agentes só mudam numa tarefa de processo pedida pelo usuário, na branch `feature/harness` ou `feature/harness-<tema>` (o `check:regras` confere o nome): o agente não afrouxa as próprias regras.

### Issues

Toda inconsistência achada (em revisão, numa tarefa, numa simulação) vira uma **issue descritiva** no GitHub, pelo modelo e com a triagem de [docs/processo/issues.md](docs/processo/issues.md):

- **Abrir**: o agente que acha (fora do escopo da tarefa) e quem revisa (cada "melhoria futura" e cada achado recusado por sair do escopo). Procurar duplicata antes; o número da issue vai no resumo e no PR.
- **Triagem**: etiqueta `inconsistencia` e mais uma. `correcao-automatica` só para erro claro, com uma única resposta certa (bug evidente, regra deste arquivo violada, link quebrado, doc que não acompanhou mudança registrada, teste faltando, erro de texto). `precisa-decisao` para o resto (balanceamento, código × doc sem registro, design, regra nova, processo) e na dúvida. **O agente sempre abre com `precisa-decisao`**; só o usuário promove para `correcao-automatica` (a CI só aceita a branch do loop com a etiqueta posta pelo dono).
- **Loop**: o workflow `.github/workflows/issues-claude.yml` corrige sozinho a issue com `correcao-automatica`: branch `feature/issue-<n>`, contrato `docs/tarefas/issue-<n>.md` gerado da issue (com `issue: <n>`), `npm run check`, PR com `Closes #<n>`. A etiqueta, posta pelo dono do repositório, é o que libera a branch do loop; a correção automática nunca toca balanceamento nem processo. Se não for erro claro, a issue volta para `precisa-decisao`. Com `check` e `meta` verdes, o PR entra sozinho no staging e o `staging.yml` fecha a issue. A correção chega à produção na release, **com o merge do usuário no `master`**.
- **Modelo e métricas**: o loop escolhe o modelo por perfil (leve ou padrão, com escalada) e registra o consumo de cada execução na issue; regras do piloto, escolha de executor e critério de promoção em [docs/processo/metricas.md](docs/processo/metricas.md).

## Review guidelines

Seção lida por quem revisa: a revisão à mão (`@claude revise`) e a revisão de IA da release (`codex exec review`). As instruções completas estão em [docs/processo/revisao.md](docs/processo/revisao.md):

- Confira o PR contra este arquivo e o contrato da tarefa (`docs/tarefas/<tema>.md`): faz o que o contrato pede e só isso. Na release, o lote inteiro, com atenção aos arquivos de processo alterados.
- Prioridade: bug real; regra deste arquivo burlável num uso normal; arquivo fora do escopo; doc que não acompanha a mudança; balanceamento compensado sem o usuário.
- Separe "bloqueia o merge" de "melhoria futura", com arquivo:linha e um cenário concreto. Cada melhoria futura vira uma issue descritiva ([docs/processo/issues.md](docs/processo/issues.md)). Não reabra decisões registradas no contrato ou em `docs/decisoes.md`.
- Termine com o veredito: aprovado, aprovado com ressalvas ou precisa de mudanças. É só revisão: não altere arquivos. O veredito informa o usuário; não trava o merge.
