---
objetivo: Dar à História e à Campanha telas de modo completas, com a dificuldade da Jornada, o Continuar e o Recomeçar da run salva e os arcos da História com o progresso do jogador, sem mudar regra nem número do jogo.
escopo: ["docs/tarefas/historia-campanha.md", "src/state/jornadaRuns.ts", "src/data/strings/jornada.ts", "tests/jornadaRuns.test.ts", "tests/uilab.test.ts", "prototype/jornada/index.ts", "prototype/jornada/host.ts", "prototype/jornadaHost.ts", "prototype/styles/jornada*.css", "prototype/styles/shinobi/jornada*.css", "prototype/lab/scenarios/jornada.ts", "prototype/lab/fixtures/*.ts", "docs/jornada/run.md", "docs/jornada/README.md", "docs/visual.md", "docs/ui-lab/SCREEN_INVENTORY.md", "changelog.d/historia-campanha.md"]
fora: ["src/core/**", "src/sim/**", "src/data/balance*.ts", "src/data/**/balance*.ts", "src/data/jornada/stages.ts", "src/data/jornada/generic.ts", "src/data/roleta/**", "prototype/roleta/**", "prototype/gate.ts", "prototype/main.ts", "public/img/**", "prototype/portraits/**", "package.json", "package-lock.json", "CHANGELOG.md", ".github/**", "plano-codex-telas.md", "prompts-codex-telas.md", "correcao-pr46.md", "imagens-codex.md", "arte-codex/**"]
pronto: ["npm run check verde", "a dificuldade da Jornada se escolhe na tela da História e na da Campanha, com o Hardcore travado até j_canonHard", "com run salva do modo, a tela dele mostra Continuar (segue a run) e Recomeçar (confirma, grava a antiga como abandonada)", "com run salva do outro modo, começar avisa que ela será substituída", "cada arco da História mostra concluído, atual ou ainda não alcançado, pelo histórico e pela run salva", "save e histórico antigos carregam sem erro (com teste)", "UI Lab em 360, 390, 768, 1024 e 1440 px sem rolagem horizontal nem erro no console", "sim:origens e sim:jornada iguais a antes (nada de jogo mudou)", "docs e fragmento no mesmo commit, briefing visual do Codex no PR, PR para staging, sem Co-Authored-By"]
agente: claude
aprovado: 2026-11-26
---

# Telas de modo da História e da Campanha

## Pedido

Tarefa 3 do plano das telas (`plano-codex-telas.md`), depois do Portão (#46) e do Registro (#70), já no staging. "A antiga entrada da Jornada vira duas telas, uma da História e uma da Campanha": o seletor de dificuldade vai para as duas, o Continuar ou abandonar da run salva fica na tela do modo dela, e a História mostra um card por arco, bloqueado ou concluído conforme o progresso, citando os arcos do Time 7 (retorno de 24/11). Pelo fluxo de 26/11, o Claude faz a funcionalidade e o acabamento visual vai depois ao Codex, num contrato próprio.

## Contexto

Conferido no `staging` (`a83a083`):

- O Portão abre direto `campaignScreen` (História) e `pathSetupScreen` (Campanha) (`prototype/main.ts:28`, `prototype/jornada/index.ts:129`). A antiga `entryScreen` só aparece no UI Lab.
- **Falha em produção do staging:** o único seletor de dificuldade da Jornada estava na `entryScreen`. Hoje a Jornada começa com a dificuldade que o jogador deixou no Arcade (`ses.settings.difficulty`), sem como trocar dentro dela.
- **Continuar:** só pelo Registro (aba do modo no Histórico). Ao entrar na História com uma run salva, a tela mostra o arco atual mas só oferece "Começar", que pede para substituir a run.
- Os arcos da História vêm de `src/data/jornada/stages.ts` (Ondas, que inclui a Academia e o teste dos guizos; Exame Chunin; Sannin; Resgate do Sasuke) e já têm arte no `SCENE_ART`. O `arcStrip` marca atual e concluído só pela run salva; o histórico `jornada_runs_v1` (#70) já guarda até onde cada run chegou.
- Docs lidos: [AGENTS.md](../../AGENTS.md), [docs/visual.md](../visual.md#entrada-da-jornada), [docs/jornada/run.md](../jornada/run.md#tela-de-início), [docs/decisoes.md](../decisoes.md) e [delegacao.md](../processo/delegacao.md).

## Plano

1. **Progresso dos arcos** (`src/state/jornadaRuns.ts`, função pura com teste): o maior estágio que alguma run da História já passou, por perspectiva, lido do `jornada_runs_v1`. Vitória conta todos os arcos. Registro antigo ou estragado não quebra.
2. **Dificuldade** (`prototype/jornada/index.ts`): o bloco de dificuldade da `entryScreen` vira uma função reaproveitada (`difficultyBox`) e entra na tela da História e na da Campanha, com os mesmos `data-diff`, o Hardcore travado até `j_canonHard` e a linha de recuperação. Continua uma dificuldade só para a Jornada e o Arcade (`ses.settings.difficulty`), como hoje.
3. **Run salva na tela do modo:**
   - run do mesmo modo: o card de progresso (`progressCard`, que já existe) no alto, com **Continuar**, que segue a run sem passar pela preparação, e **Recomeçar**, que usa o `replaceSaved` (confirma e grava a antiga como abandonada);
   - run do outro modo: uma nota curta dizendo que começar substitui a run salva da História ou da Campanha (a confirmação já existe no `replaceSaved`);
   - a dificuldade da run salva aparece no card e não muda; o seletor vale para a próxima.
4. **Arcos da História:** o `arcStrip` usa o progresso do passo 1 além da run salva. Cada arco fica **concluído**, **atual** ou **ainda não alcançado** (desbotado, com cadeado). Só leitura: a História continua linear, sem escolher arco.
5. **Campanha:** a mesma tela de hoje (pôster, estágios, classe, elemento), mais a dificuldade e a run salva. Sem arte nova.
6. **UI Lab:** cenários da História e da Campanha sem run, com run do mesmo modo, com run do outro modo e com o Hardcore liberado; um perfil com runs da História até o Exame.
7. **Docs:** [run.md](../jornada/run.md#tela-de-início) (a tela de início passa a ser a de cada modo), o fluxo de entrada no [README da Jornada](../jornada/README.md), [visual.md](../visual.md#entrada-da-jornada), o `SCREEN_INVENTORY` e o fragmento `changelog.d/historia-campanha.md`.
8. **CSS mínimo** para o que é novo (botões do card, arco ainda não alcançado), só com tokens. No PR, o **briefing visual** para o Codex: telas, cenários do UI Lab, o que acabar e os ids e `data-*` que não mudam.

## Fora do escopo

- O acabamento visual das duas telas e as artes novas de card da Campanha (`campanha-*.webp`): vão ao Codex, num contrato próprio, depois do merge.
- Escolher o arco da História, separar a dificuldade da Jornada da do Arcade, ou qualquer regra, chance ou número.
- O Portão, o Registro e o Arcade (lobby é a Tarefa 4); as subtelas da run (mapa, loja, árvore, cenas, combate).
- Apagar a `entryScreen`: o [visual.md](../visual.md#entrada-da-jornada) a mantém como cenário do UI Lab.

## Decisões para o usuário

- **Dificuldade compartilhada:** a Jornada e o Arcade continuam com uma dificuldade só, como hoje. Separar pede uma chave nova no `proto_settings_v1`; fica para um pedido seu.
- **"Bloqueado" é só visual:** um arco ainda não alcançado aparece desbotado, sem impedir nada, porque a História é linear.

## Achados

(preenchido durante o trabalho)
