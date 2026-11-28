---
objetivo: Dar ao Arcade uma tela de entrada (lobby) entre o Portão e as roletas de origem, com a escolha da dificuldade, o desempenho do jogador no modo e um botão Girar grande, sem mudar regra nem número do jogo.
escopo: ["docs/tarefas/arcade-lobby.md", "src/state/arcadeLobby.ts", "tests/arcadeLobby.test.ts", "src/data/strings/roleta.ts", "prototype/roleta/screens/lobby.ts", "prototype/roleta/screens/origin.ts", "prototype/roleta/run.ts", "prototype/main.ts", "prototype/styles/roleta-lobby.css", "prototype/styles/index.css", "prototype/lab/scenarios/roleta.ts", "prototype/lab/fixtures/*.ts", "tests/uilab.test.ts", "docs/roleta/run.md", "docs/roleta/campanha.md", "docs/visual.md", "docs/ui-lab/SCREEN_INVENTORY.md", "changelog.d/arcade-lobby.md"]
fora: ["src/core/**", "src/sim/**", "src/data/balance*.ts", "src/data/**/balance*.ts", "src/data/roleta/**", "src/data/achievements.ts", "src/state/profile.ts", "src/state/runHistory.ts", "prototype/gate.ts", "prototype/registry.ts", "prototype/jornada/**", "prototype/roleta/screens/battle.ts", "prototype/roleta/screens/map.ts", "prototype/styles/shinobi/**", "public/img/**", "prototype/art.ts", "package.json", "package-lock.json", "CHANGELOG.md", ".github/**"]
pronto: ["npm run check verde", "o card Arcade do Portão abre o lobby; Voltar (e o voltar do navegador) leva ao Portão", "a dificuldade se escolhe no lobby, com ses.settings.difficulty como padrão e o Hardcore travado até hardcoreUnlocked(); a escolha fica salva", "a tela de origem não tem mais o seletor de dificuldade: mostra a dificuldade escolhida num chip", "o lobby mostra o desempenho por dificuldade (difficultyStats), o melhor ciclo, as origens vencidas, as últimas runs do runs_v1 e as conquistas recentes só do Arcade", "Girar segue para o nome (primeira vez), as roletas de origem e a run; o Nova run do fim da run volta ao lobby", "resumo do lobby em função pura com teste (histórico vazio, re-rolls fora, ordem das últimas runs, conquistas só do Arcade)", "no celular (390 px) o lobby cabe em no máximo uma tela de rolagem; UI Lab em 390, 768, 1280 e 1920 sem rolagem horizontal nem erro no console", "sim:origens igual a antes (nada de jogo mudou)", "docs e fragmento no mesmo commit, briefing visual do Codex no PR, PR para staging, sem Co-Authored-By"]
agente: claude
aprovado: 2026-11-27
---

# Lobby do Arcade

## Pedido

Tarefa 4 do plano das telas: "uma tela curta antes da run do Arcade, em que se escolhe a dificuldade e se vê o próprio desempenho no modo". Fluxo Portão → lobby → nome → origem → run; o `.difficulty-box` sai da tela de origem e vai para o lobby; as informações reaproveitam o que já existe; um botão principal grande ("Girar") e no máximo uma tela de rolagem no celular. Pela divisão de 26/11, o Claude faz a funcionalidade com CSS mínimo e o Codex faz o acabamento numa segunda branch, depois do merge.

## Contexto

Conferido no `staging` (`cb31db3`):

- `prototype/main.ts:28`: o card Arcade do Portão vai direto para `ensurePlayerName()` → `originScreen()` → `runCampaign()`. No fim da run, **Nova run** só encerra a rodada, e o jogador cai no Portão.
- A dificuldade do Arcade se escolhe na tela de origem, depois das roletas (`prototype/roleta/screens/origin.ts`, bloco `#after`); trocar refaz `withDifficulty` e `newRoletaRun` sobre o jogador já sorteado. O Hardcore cai para o padrão quando ainda não foi liberado (`hardcoreUnlocked()`).
- Dados já prontos: `difficultyStats()` (`prototype/gate.ts`, HTML com runs, vitórias, % e melhor ciclo por dificuldade), `bestRoletaCycle()` e `originRecords()` (`src/state/profile.ts`), `loadRuns()` (`runs_v1`, mais recente primeiro) e `profile.achievements` (id → data). As conquistas do Arcade são as de `src/data/achievements.ts`; o `recentAchievements` do host da Jornada só sabe filtrar as da Jornada.
- Modelo de composição: as telas da História e da Campanha (PRs #94 e #98) usam a casca do Portão `.screen.gate.jgate.jhub` — `gate-main` com o painel de arte (`gate-banner`, letreiro "Modo …") e os cards, e a `gate-aside` com a dificuldade, a run salva e as conquistas recentes. O usuário aprovou essa composição ("me agradou muito", 27/11).
- Docs lidos: [AGENTS.md](../../AGENTS.md), [docs/visual.md](../visual.md#roleta-no-pc), [docs/roleta/run.md](../roleta/run.md#dificuldade-e-histórico), [docs/roleta/campanha.md](../roleta/campanha.md#dificuldade), [fluxo.md](../processo/fluxo.md) e [delegacao.md](../processo/delegacao.md).

## Plano

1. **Resumo puro** (`src/state/arcadeLobby.ts`, com teste em `tests/arcadeLobby.test.ts`): a partir do perfil, do `runs_v1` e da data, devolve runs, vitórias, melhor ciclo (`bestRoletaCycle`), origens jogadas e vencidas (`originRecords`), as últimas N runs (sem re-roll) e as conquistas recentes só do Arcade, com os dias desde cada uma. Sem DOM nem `Date.now`.
2. **Tela** (`prototype/roleta/screens/lobby.ts`, `arcadeLobby(): Promise<'spin' | 'back'>`), na casca da História (`.screen.gate.jgate.jhub.rlobby`), na ordem da leitura:
   - `gate-main`: o painel com a arte `modo-roleta` e o letreiro "Modo Arcade"; embaixo, o bloco de começar (`.rlobby-start`) com a **Dificuldade** (`.difficulty-box`, os mesmos `data-diff`, a descrição e o aviso do Hardcore travado) e o botão grande **Girar** (`data-choice="spin"`, `.primary.big`);
   - `gate-aside`: **Desempenho** (`.rlobby-stats`: runs, vitórias, melhor ciclo e origens vencidas numa linha, e o `difficultyStats()` por dificuldade), **Últimas runs** (`.rlobby-runs`, as 3 mais novas: símbolo da origem, nome, ciclo e lutas, chips de dificuldade e resultado, com o "Ver tudo" para o Histórico, `data-profile="history"`), **Conquistas recentes do Arcade** (`.rlobby-ach`, 3, com o "Ver tudo", `data-profile="achievements"`) e o **Voltar** (`data-choice="back"`).
   - Histórico vazio: uma frase curta no lugar das listas.
3. **Fluxo** (`prototype/roleta/run.ts`, `playArcade()`): lobby → `ensurePlayerName` → `originScreen` → `runCampaign`, em laço: o fim da run (Nova run ou abandono) volta ao lobby; o Voltar do lobby volta ao Portão. `prototype/main.ts` chama `playArcade()`.
4. **Origem** (`origin.ts`): sai o `.difficulty-box`; a run nasce com a dificuldade do lobby (o Hardcore travado continua caindo para o padrão) e a tela mostra um chip da dificuldade (`diffChip`) junto do Re-rolar e do Começar.
5. **CSS mínimo** (`prototype/styles/roleta-lobby.css`, importado no `index.css`), só com tokens: a ordem das peças no celular (a `.jgate` usa `display: contents` na coluna), o bloco de começar e as listas compactas. O resto vem da casca `.jhub`.
6. **UI Lab**: cenários `roleta.lobby` (perfil vazio), `roleta.lobby:mid` e `roleta.lobby:full` (Hardcore liberado, histórico e conquistas), com fixtures de `runs_v1` quando faltar; `roleta.origin` passa a mostrar o chip.
7. **Docs**: [run.md](../roleta/run.md#dificuldade-e-histórico) e [campanha.md](../roleta/campanha.md#dificuldade) (a dificuldade se escolhe no lobby), [visual.md](../visual.md) (lobby do Arcade e o sorteio da origem sem a dificuldade), o `SCREEN_INVENTORY` (árvore da navegação e a linha da tela) e o fragmento `changelog.d/arcade-lobby.md` com `peso: alto`.
8. **PR** para o `staging` com a seção **Briefing visual para o Codex**.

## Fica para o Codex (segunda branch, depois do merge)

Aprovação do usuário (27/11/2026): "use o mesmo modus operandi das outras telas e a parceria com o codex". Como na História e na Campanha (#98 → #100): depois do merge deste PR, o Claude escreve o contrato `docs/tarefas/arcade-lobby-visual.md` (`agente: codex`, escopo `prototype/styles/**`, `prototype/lab/**`, `docs/visual.md`, `DESIGN.md`, `docs/ui-lab/**`) com o briefing abaixo, delega com `npm run delegar -- arcade-lobby-visual`, confere, commita e abre o PR.

O acabamento do lobby: a composição fina no celular, no tablet e no desktop (ocupar a célula da cena como na História), o letreiro próprio do Arcade (hoje o `.jhub` herda o estilo da Jornada), o tratamento do botão Girar como peça principal (talvez com a roda como ornamento), as listas de desempenho e de últimas runs em papel, e a revisão visual (`revisar-visual`). Ids, `data-diff`, `data-choice`, `data-profile` e as classes `.rlobby*` e `.difficulty-box` não mudam.

## Fora do escopo

- Regras de combate, balanceamento, chances, números e saves (nenhuma chave nova no `localStorage`).
- A Tarefa 5 (palco de combate com sprites), as telas da Jornada, o Portão e o Registro.
- Separar a dificuldade do Arcade da da Jornada (continua uma só, `ses.settings.difficulty`).
- Mexer no `difficultyStats()`, no `gate.ts` ou no `registry.ts`: o lobby só os usa.

## Decisões para o usuário

- **Nova run volta ao lobby**, não ao Portão: é o caminho mais curto para jogar de novo e dá chance de trocar a dificuldade.
- **Casca da História** (`.jgate.jhub`) reaproveitada para o lobby, com o modificador `.rlobby`: mesma composição que você aprovou, sem CSS novo grande; o Codex troca o letreiro e o que for da Jornada no acabamento.
- **Arte do painel**: a `modo-roleta` (a mesma do card do Portão), até o Codex propor outra.

## Achados

(preenchido durante o trabalho)
