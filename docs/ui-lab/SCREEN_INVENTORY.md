# Inventário de interfaces (UI Lab, etapa 1)

Levantamento de todas as telas, estados e sobreposições do protótipo, como base do laboratório de testes visuais que vai
substituir o `?teste` atual. Feito pela leitura do código em 14/11/2026, sobre o `master` em `a46bde4` (v0.76.0).

> **Inspeção visual: nenhuma.** Tudo aqui saiu da leitura do código. Nenhuma tela foi aberta no navegador nesta etapa, então
> a coluna "Visto" de todas as entradas está como **não**. Encontrar o componente não quer dizer que a tela renderiza
> como o código sugere.

## Como ler

- **Id**: identificador sugerido para o lab (`modo.sistema.tela[:estado]`).
- **Onde**: arquivo e função que montam a tela.
- **Acesso**: o caminho no jogo até ela.
- **Dados**: o que ela precisa existir para renderizar.
- **Direto?**: se dá para abrir sem jogar até lá. Hoje: **Sim** (URL ou um clique a partir do início), **Lab** (só pelo
  `?teste` atual), **Não** (só jogando).
- **Responsivo**: as faixas são as de `prototype/layout.ts`: celular (< 900px), PC `DESK` (≥ 900×560) e widescreen `WIDE`
  (≥ 1280×560). O CSS também usa ≤ 380px (celular estreito), 600–899px (tablet) e alturas baixas (≤ 680/720/760/800px)
  no PC.

## 1. Arquitetura da navegação

Não existe roteador. O jogo é **uma página só** (`prototype/index.html`, montada pelo esbuild num único HTML) e cada tela
é uma função `async` que troca o conteúdo de `<main id="screen">` (`show()` em `prototype/dom.ts`) e espera um toque
(`choose()`, que resolve com o `data-choice` do botão). A "rota" é a pilha de chamadas:

```
main()  (prototype/main.ts)
 ├─ ?teste → labFlow() → labScreen() → battleScreen() | runCampaign()
 └─ modeScreen()  (Portão da Vila)
     ├─ roleta  → ensurePlayerName() → originScreen() → runCampaign()
     ├─ story   → runJornada({entry: 'story'}) → perspectiva ou parada salva
     └─ path    → runJornada({entry: 'path'}) → preparação ou parada salva
```

Mecanismos de navegação:

| Mecanismo | Onde | Efeito |
|---|---|---|
| URL `?teste` | `parseLabParams` em `src/core/lab.ts` | Abre o laboratório antigo no lugar do Portão (só Roleta) |
| URL `?seed=N` | idem | Fixa o RNG da **primeira** run da página (Roleta e Jornada) |
| Botão Portão (`#home-btn`) | `askHome()` | `goHome()` corta a tela atual (símbolo `HOME`) e volta ao Portão; pede `window.confirm` com run em andamento |
| Barra lateral (`#side-nav`, só PC) | `installSideNav()` | Início, Arcade, História, Campanha, Histórico, Livro Bingo, Relíquias e Conquistas |
| Barra inferior (`#gate-nav`, só celular) | `installSideNav()` | Início, Arcade, História, Campanha e Registro no Portão e nas páginas do Registro até 1023 px |
| Cabeçalho | `installHeaderToggles()` | Instantâneo, Animado, Efeitos, Música, Ficha, Registro |
| Erro no fluxo | `errorScreen()` | Captura exceção, mostra o aviso e volta ao Portão |

Não há `history.pushState` nem hash: **F5 sempre volta ao Portão** (a Jornada retoma pelo save `jornada_run_v1`).

### Páginas HTML independentes

| Página | Papel |
|---|---|
| `prototype/index.html` | O jogo inteiro (casca, cabeçalho, `#screen`, navs, rodapé) |
| `prototype/pwa/icon.html` | Fonte do ícone do PWA (512×512), aberta só para gerar os PNGs. Não faz parte do jogo |

### Casca comum (fica em volta de todas as telas)

| Id | Elemento | Estados |
|---|---|---|
| `shell.header` | `header.top`: marca, `#home-btn`, grupos de botões, `#dots` | Alça de Konoha por toque, mouse e Tab. Rótulos dos botões só ≥ 1280px; botão Ficha some sem run (`syncSheetBtn`) |
| `shell.dots` | `progressDots()` em `#dots` | Progresso do ciclo da Roleta; vazio no Portão e na Jornada |
| `shell.sidenav` | `#side-nav` | Só PC; item ativo por `aria-current` |
| `shell.gatenav` | `#gate-nav` | Só celular |
| `shell.footer` | Faixa de frases (`installQuoteStrip`, troca a cada 20 s, sorteada) + aviso legal + versão | Versão ganha "· Laboratório" e "· seed N" com os parâmetros |
| `shell.body-classes` | `at-gate`, `mode-jornada`, `has-sheet`, `data-theme`, `data-instant`, `mood(...)` | Mudam fundo, cores e layout de todas as telas |

## 2. Inventário por sistema

Legenda da última coluna: **Direto?** / **Visto**.

### 2.1 Entrada e navegação

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Responsivo | Direto? / Visto |
|---|---|---|---|---|---|---|---|
| `gate.home` | Portão da Vila | `modeScreen()` em `gate.ts` | Abrir o jogo | Perfil, `jornada_run_v1`, conquistas recentes, arte `portao` | Vazio (`gate.home`, `:empty-story`), médio (`:mid-new`, `:mid` com Campanha), cheio (`:full`, `:full-story`), cena viva (`:animado`). O próprio card abre o modo | Celular com Ficha compacta e modos em pilha. Tablet com Ficha e Conquistas lado a lado e três modos em colunas. Desktop com lateral fixa | Sim / sim |
| `gate.name` | Pedir o nome do ninja | `askPlayerName()` em `playerName.ts` | 1ª entrada no Roleta ou no Caminho Ninja | `profile.playerName` indefinido | Confirmar ou pular | Pergaminho centralizado | Não (some depois da 1ª vez) / não |
| `gate.avatar` | Escolha do avatar (modal) | `openAvatarPicker()` | Avatar no topo da Ficha do Portão | Catálogo (`avatarCatalog`) e liberados (`avatarChoices`: origens, elenco dos arcos, vilões do Livro Bingo) | Poucos (`gate.avatar:few`) ou muitos (`gate.avatar`) liberados; bloqueados em silhueta; atual marcado | Grade por grupo (Origens, Aliados, Vilões). `gate.avatar:paper` mostra cada retrato com o fundo, ao lado da silhueta de bloqueado feita pelo recorte de `AVATAR_CUTS` | Sim / não |
| `gate.error` | Tela de erro | `errorScreen()` | Exceção dentro de uma tela | Erro capturado | Detalhe técnico em `<details>` | Simples | Não (precisa forçar erro) / não |
| `gate.toast` | Aviso flutuante | `toast()` | Conquista, compartilhar, erro fora do fluxo, salvar falhou, ryō convertido | Texto + ícone | Vários em fila (conquistas a cada 2,8 s) | Fixo sobre a tela | Não / não |
| `gate.confirm-native` | `window.confirm` do navegador | `askHome()`, `installSideNav()`, abandono da Roleta | Sair com run em andamento | — | — | Nativo, fora do design system | Não / não |

### 2.2 Roleta

Fluxo: Portão → nome → origem → (mapa → evento → luta → recompensas)* → fim. Tudo em `prototype/main.ts`, estado em
`camp` (só em memória).

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Responsivo | Direto? / Visto |
|---|---|---|---|---|---|---|---|
| `roleta.origin` | Roletas de origem + dificuldade | `originScreen()` | Card Arcade no Portão | RNG, `rollOrigin`, perfil (Hardcore liberado?) | Antes, durante e depois dos giros (`rolled`); 1 a N roletas conforme a linhagem (elementos, kekkei genkai, jinchuuriki); Hardcore travado ou liberado; "Girar de novo" | `rwheel`: palco + coluna `rside` lado a lado no PC | Sim (1 clique) / não |
| `roleta.map` | Mapa do ciclo | `mapScreen(eventDone)` | Depois da origem e entre lutas | `camp.run`, vilão sorteado, `camp.log` | Botão "Evento" ou "Lutar" (`eventDone`); chip de ciclo só do ciclo 2; botão Pesos (equipar/tirar) só com o item; trilha com etapas feitas que expandem (`<details>`); categoria genin/chunin/jounin/chefe muda arte e selo | Ficha em painéis (`sheetPanels`) no PC; `sticky-cta` | Lab (campanha a partir de etapa) / não |
| `roleta.event` | Evento pré-luta | `eventScreen()` | Botão Evento no mapa | RNG (`roletaPreFightEvents`, 7 eventos com peso, total 100) | Um subfluxo por evento (abaixo); Moeda viciada oferece girar de novo (`spinRoll`); resultado com efeito e HUD pulsando | `rwheel` | Não / não |
| `roleta.event.training` | Treino | `eventScreen` case `training` | Evento sorteado | RNG | Escolha de foco elemental existe no código mas `focus` está sempre vazio (só a roleta roda) | — | Não / não |
| `roleta.event.jokenpo` | Jokenpô | `jokenpoFlow()` | Evento sorteado | RNG | Vitória, empate, derrota; animação de embaralhar (pulada no instantâneo) | Mãos em linha | Não / não |
| `roleta.event.item` | Item encontrado | `itemFlow()` | Evento sorteado | RNG | Pesos de treino perguntam se equipa | — | Não / não |
| `roleta.event.summon` | Invocação | `summonFlow()` | Evento sorteado | RNG, `player.summon` | Sem invocação: roleta do animal; com invocação: sobe de nível sem roleta | — | Não / não |
| `roleta.event.akatsuki` | Akatsuki | `eventScreen` case `akatsuki` | Evento sorteado | RNG | Resultados da roleta | — | Não / não |
| `roleta.event.guru` | Guru | `eventScreen` case `guru` | **Inalcançável no Roleta atual** (fora de `roletaPreFightEvents`; corrigido na etapa 3) | RNG | Charlatão (sem prêmio); 1 ou mais roletas de prêmio; escolha entre prêmios | — | Não / não |
| `roleta.event.simple` | Velhinha e Ramen (a Lição do clã está fora da roleta do Roleta) | `applySimpleEvent` | Evento sorteado | — | Só o card de resultado | — | Não / não |
| `roleta.levelup` | Subiu de nível | `levelUpScreen()` | XP suficiente após luta, evento ou recompensa | `camp.player` | Bloco de despertar existe no código mas está desligado (`awakening` sempre `undefined`) | `rwheel` | Não / não |
| `roleta.upgrade` | Upgrade de técnica | `upgradeScreen()` | `pendingUpgrades > 0` | `upgradeOptions` | Lista de opções ou "nenhuma" (vira XP) | `rwheel` | Não / não |
| `roleta.relic` | Relíquia da vitória | `relicRewardScreen(cat)` | Vitória fora do chefe | RNG, categoria, relíquias que faltam | Roleta de raridade + roleta da relíquia; sem relíquia disponível: vira XP | `rwheel` | Não / não |
| `roleta.chest` | Baú do chefe | `chestScreen(options)` | Vitória sobre o chefe | `run.bossChoice` (3 relíquias) | Nada escolhido (botão desligado) ou uma destacada com o card | `jrboss` (mesmo da Jornada) | Não / não |
| `roleta.notice` | Aviso entre ciclos | `noticeScreen()` | Começo de cada ciclo depois do 1º | Ciclo, multiplicador | — | `rwheel` | Não / não |
| `roleta.end` | Fim da run | `endScreen(won, ...)` | Derrota, vitória do ciclo 1 ou abandono | `camp` inteiro | Vitória (com ou sem "Seguir para o ciclo 2", que é só Hardcore), derrota, queda no modo infinito (ciclo ≥ 2, conta como vencida), abandonada; chip de recorde; Compartilhar (menu nativo ou cópia + toast) | `rend-l` + `rend-r` lado a lado no PC | Não / não |

### 2.3 Jornada

Fluxo: Portão → História (perspectiva) ou Campanha (preparação e revelação) → paradas → fim. Continuar retoma diretamente a parada salva.
Tudo em `prototype/jornada/`, run salva a cada parada (`jornada_run_v1`). Duas variantes de run com telas diferentes:
**História** (`mode: 'canon'`, trilha linear de paradas) e **Caminho Ninja** (`mode: 'generic'`, mapa de nós).

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Responsivo | Direto? / Visto |
|---|---|---|---|---|---|---|---|
| `jornada.entry` | Entrada da Jornada | `entryScreen()` em `jornada/index.ts` | Cenário legado do UI Lab | Save, conquistas (`j_canonHard` libera Hardcore), recentes | Com ou sem card de progresso; Hardcore travado/liberado; com ou sem conquistas recentes; frase sorteada | Composição do Portão: `gate-main` + `gate-aside` | Sim (1 clique) / não |
| `jornada.story.pick` | Modo História: escolher perspectiva | `campaignScreen()` | Card História | `data.campaigns`, save, `jornada_runs_v1`, conquistas (`j_canonHard`) | Naruto aberto; Sasuke travado ("em breve") enquanto não houver `campaigns.sasuke`; topo com a dificuldade e o card de progresso (Continuar) da História salva ou o aviso da Campanha salva (`:saved`, `:other`); arcos concluídos, atual, próximo e ainda não alcançados (`:history`); Hardcore travado ou aberto (`:full`); confirmação de sobrescrever save | Dois painéis dia/noite; arcos rolam de lado no celular | Sim (2 cliques) / não |
| `jornada.path.setup` | Caminho Ninja: preparação | `pathSetupScreen()` | Card Campanha | Conquistas (classes Uchiha/Hyuuga, `j_canonHard`), recorde, save | Classes travadas/abertas; seletor de elemento só no Comum; linha de recorde só a partir de 1 ciclo vencido; topo com a dificuldade e o Continuar da Campanha salva ou o aviso da História salva (`:saved`, `:other`) | Pôster + painel | Sim (2 cliques) / não |
| `jornada.path.reveal` | Revelação do herói | `revealScreen()` | Começar o Caminho Ninja | Run nova (RNG) | Elemento sorteado vs escolhido; prodígio sem elemento; Hyuuga sem elemento; 2º elemento do Uchiha; relíquia bônus de quem sorteou | Coluna centralizada | Não / não |
| `jornada.trail` | Trilha da História (parada atual) | `playStop()` (ramo canon) | Cada parada da História | Run, `stages`, arte do arco | Próxima parada é luta (inimigos, IA, objetivo especial) ou não; faixa "O que mudou" no topo depois de evento; equipe da luta; dica rotativa; legenda; chip de ciclo; loja fixa só no widescreen | Celular: coluna. PC: `jcol-l` (HUD) + trilha + `jcol-r`. WIDE: loja acoplada (`dockShop`). Seções dobráveis (`fold.ts`, guardado no aparelho) | Não (só com save) / não |
| `jornada.map` | Mapa do Caminho Ninja | `mapScreen()` / `mapView()` | Escolha de nó no Caminho Ninja | `run.map` (gerado por seed), `path` | Nós feito, escolha, adiante, morto; chefe no topo com retrato; nó "?" desconhecido; card "Sua run"; loja acoplada no WIDE | Mapa vertical; colunas no PC | Não / não |
| `jornada.notice` | Cena de aviso | `notice()` + `sceneScreen()` em `jornada/scene.ts` | Estágio concluído, ciclo novo, vitória, lição, tentar de novo, nó desconhecido revelado | Local, rosto, selo | Selos: `stage`, `cycle`, `victory`, `lesson`, `retry`, `unknown` (dourado em vitória/estágio); linhas entram uma a uma | Cena com retrato | Não / não |
| `jornada.end` | Relatório de missão (fim) | `endScreen()` + `missionReport()` | Fim da run ou do ciclo | Run inteira | Vitória História (texto pelo flag do final), vitória Caminho Ninja com "Seguir ciclo"/"Voltar", queda no infinito, derrota; trilha de paradas só na História; talentos finais só se houver; chip de recorde | Cena com relatório em grade | Não / não |

### 2.4 Narrativa

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Responsivo | Direto? / Visto |
|---|---|---|---|---|---|---|---|
| `jornada.event` | Evento (cena com opções) | `eventStop()` + `sceneScreen()` | Parada de evento | `currentEvent`, flags, ryō | Categorias `narrative`, `training`, `witness` (selo próprio); opções dependem de flags e ryō; ícone de carta quando há minijogo; etapas encadeadas com `inkWipe`; carimbo da escolha (`stampChoice`) | Cena | Não / não |
| `jornada.minigame.memory` | Minijogo da memória | `memory()` em `minigames.ts` | Opção com minijogo | RNG da parada | Vitória/derrota | Dentro da cena | Não / não |
| `jornada.minigame.seals` | Minijogo dos selos | `seals()` | idem | RNG | Vitória/derrota | idem | Não / não |
| `jornada.minigame.rps` | Jokenpô da Jornada | `rps()` | idem | RNG | Vitória/derrota | idem | Não / não |
| `jornada.minigame.kunai` | Kunai no alvo (e a pele `:power`, bola de borracha) | `kunaiGame()` em `minigamesTimed.ts` | idem | RNG | Vitória/derrota | idem | Não / não |
| `jornada.minigame.water` | Andar sobre a água (e `:calm`, a variante sem pressa) | `waterGame()` | idem | RNG | Vitória/derrota | idem | Não / não |
| `jornada.minigame.clone` | O clone verdadeiro | `cloneGame()` | idem | RNG | Vitória/derrota | idem | Não / não |
| `jornada.minigame.bell` | Pegar o sino | `bellGame()` | idem | RNG | Vitória/derrota | idem | Não / não |
| `jornada.story-relic` | Relíquia de história | `storyRelicScene()` | Evento que entrega relíquia com fala (bandana, colar) | `storyRelicLines` | Com ou sem relíquia substituída (troca à vista) | Coluna | Não / não |
| `jornada.battle.cutin` | Fala em corte de quadro | `cutIn()` em `jornada/battle.ts` | Evento `say` do roteiro da luta | Roteiro da parada | Narrador, aliado, inimigo; segue sozinho no instantâneo | Faixa diagonal sobre a luta | Não / não |

### 2.5 Combate

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Responsivo | Direto? / Visto |
|---|---|---|---|---|---|---|---|
| `roleta.battle` | Luta da Roleta (1×1) | `battleScreen()` em `main.ts` | Lutar no mapa; ou Lab "Lutar" | `camp.player`, vilão escalado, RNG | Roletas em faixa de iniciativa e acerto (`stripRoulette`); números flutuantes (dano, crítico, cura, esquiva); badges de efeito; ativa disponível ou não; botões desligados fora do turno; log curto que expande; overlay de vitória/derrota com XP; abandonar (só na run) | Celular: pilha. PC (`DESK`): `rb-desk` move ficha do vilão e log para o painel `rb-intel` | Lab / não |
| `jornada.battle` | Luta da Jornada (equipe) | `jornadaBattle()` em `jornada/battle.ts` | Parada de luta, elite ou chefe | Run, `battleSetup`, RNG da parada | Intro em varrida; relíquias que piscam no começo e na vitória; objetivo especial (`jb-goal`); solo vs equipe; formas (entrada/saída); clones; Portões | Celular: menu em bandeja com abas. PC: abas somem, grupos todos visíveis. WIDE: painéis de ordem, inimigos e equipe | Não / não |
| `jornada.battle.menu` | Menu do turno | `playerTurn()` | Turno do protagonista | Técnicas, ativas, bolsa | Abas Técnicas, Ativas (com contagem), Ações, Reerguer (só com aliado caído, abre nela); itens desligados; "muitas técnicas" (`many`) | Bandeja (celular) vs lista (PC) | Não / não |
| `jornada.battle.target` | Escolha de alvo | `pickTarget()` | Técnica com mais de um alvo | Lutadores | Badge de vantagem/desvantagem elemental por alvo; Cancelar | Cartões `targetable` | Não / não |
| `jornada.battle.bag` | Bolsa na luta | `pickItem()` | Ação Bolsa | `run.bag` | Lista de itens | Menu | Não / não |
| `jornada.battle.end` | Fim da luta | final de `jornadaBattle()` | Fim da luta | Status | Vitória 勝, derrota 敗, lição 修 (derrota inevitável) | Faixa | Não / não |

### 2.6 Progressão

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Responsivo | Direto? / Visto |
|---|---|---|---|---|---|---|---|
| `jornada.talents` | Árvore de talentos (sobreposição) | `talentTreeScreen()` em `talentTree.ts` | Botão Talentos no HUD | Run, `data.talents`, conquistas | Por nó: `owned`, `upgradable`, `maxed`, `available`, `noPoints`, `locked`, `excluded`, `stageLocked`, `storyLocked`, `accountLocked`, `hidden`; abas por ramo; combinações entre ramos; tema por herói (5 temas) e cor do elemento no Comum; tinta ao comprar | `jtree-screen` em tela cheia | Não / não |
| `jornada.moveset` | Moveset (sobreposição) | `movesetScreen()` em `moveset.ts` | Botão Moveset no HUD | Técnicas conhecidas, ativas | Slots vazios/cheios; aviso de cheio; grupos kit, elemento, talentos | `jtree-screen` | Não / não |
| `jornada.hud` | HUD da run | `hud()` | Trilha, mapa, descanso | Run | Badge de pontos de talento; Vontade do Fogo; bolsa; relíquias dobráveis | Coluna esquerda no PC | Não / não |
| `roleta.levelup` / `roleta.upgrade` | (ver Roleta) | | | | | | |

### 2.7 Recompensas

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Direto? / Visto |
|---|---|---|---|---|---|---|
| `jornada.treasure` | Tesouro | `treasureStop()` | Parada de tesouro | `openTreasure` | Baú fechado → abrindo → aberto; com relíquia ou vazio | Não / não |
| `jornada.rest` | Descanso (acrescentado na etapa 3) | `restStop()` | Parada de descanso | `restHeal`, árvore de talentos | Curar ou treinar; treinar vira ryō com a árvore completa | Não / não |
| `jornada.relic-reveal` | Relíquia revelada (cena) | `relicReveal()` | Relíquia de elite ou de evento | Local, relíquia | Raridade muda o brilho | Não / não |
| `jornada.boss-choice` | Escolha do chefe | `bossChoiceScreen()` | Depois do chefe (`run.bossChoice`) | 3 relíquias | Nada escolhido; uma destacada; opção de evolução (`jrboss-evo`) | Não / não |
| `jornada.gains` | Faixa "O que mudou" | `gainsStrip()` | Tela seguinte a um evento | `pendingGains` | Uma ou várias linhas; "nada mudou"; no Caminho Ninja vira toasts | Não / não |
| `roleta.relic`, `roleta.chest` | (ver Roleta) | | | | | |

### 2.8 Loja

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Responsivo | Direto? / Visto |
|---|---|---|---|---|---|---|---|
| `jornada.shop` | Loja (sobreposição) | `shopScreen()` + `shopPanel()` | Botão Loja no HUD (celular e PC) | `shopOffer`, ryō, inflação, maldição | Prateleira com relíquia destacada, vendida ou sem dinheiro; atualizar prateleira (habilitado ou não); bolsa cheia; treino some com árvore completa; Purificar só amaldiçoado; chip de inflação (some em 0%) e de maldição | `jtree-screen` | Não / não |
| `jornada.shop.dock` | Loja acoplada | `dockShop()` | Trilha e mapa, só `WIDE` | idem | Aparece e some ao cruzar 1280px (`matchMedia`) | Só widescreen | Não / não |

### 2.9 Encerramento da run

`roleta.end` e `jornada.end` (acima). Também contam: o overlay de fim de luta (`roleta.battle` e `jornada.battle.end`), o
abandono (Roleta: `window.confirm`; Jornada: `confirmDialog`) e o compartilhar (só Roleta).

### 2.10 Configurações e demais sistemas

| Id | Tela | Onde | Acesso | Dados | Estados alternativos | Direto? / Visto |
|---|---|---|---|---|---|---|
| `meta.registry.history` | Registro: Histórico | `registryScreen('history')`, `historyTab()`, `jornadaHistory()` | Barra lateral, barra inferior ou cabeçalho | `runs_v1`, `jornada_runs_v1`, save da Jornada | Arcade com filtros Geral, Origens e Dificuldade. História (`:story`, `:story-full`) e Campanha (`:path`, `:path-full`) com estados vazios e cheios. Continuar na aba do save. Linha aberta: Arcade com uma run detalhada e uma antiga (`:open`), História e Campanha (`:story-open`, `:path-open`) | Sim / não |
| `meta.registry.bingo` | Registro: Livro Bingo | `bingoPage()` em `bingoSheet.ts` | idem | `profile.villains`, `profile.jornadaFoes` | Seções Arcade, História (`:story`, `:story-full`) e Campanha (`:path`, `:path-full`). Inimigo desconhecido, visto, derrotado (carimbo). Ficha por tema e grau (`:sheet-arcade-common`, `-elite`, `-boss`, `:sheet-ondas-common`, `-elite`, `-boss`, `:sheet-exame-boss`, `:sheet-sannin-boss`, `:sheet-resgate-boss`, `:sheet-campanha-elite`) | Sim / não |
| `meta.registry.relics` | Registro: Relíquias | `relicCollection()` em `jornada/relics.ts` | idem | `profile.relics` | Descobertas e não descobertas | Sim / não |
| `meta.registry.achievements` | Registro: Conquistas | `achievementsTab()` | Registro → Conquistas | `profile.achievements` | Liberada, travada, oculta, com progresso; categorias + seção da Jornada | Sim / não |
| `meta.sheet.roleta` | Ficha ninja da Roleta | `openSheet()` + `sheetHtml()` | Botão Ficha (cabeçalho, painel, luta) | `camp` | Durante a luta usa o jogador da luta (`battlePlayer`) | Não (precisa run) / não |
| `meta.sheet.jornada` | Ficha da Jornada | `openJornadaSheet()` em `sheet.ts` | Ficha no cabeçalho ou no HUD | Run (ou a da luta) | Abas por membro (só com equipe) | Não / não |
| `meta.relics-modal` | Relíquias da run | `relicsModal()` | Relíquia no HUD | Run | Foco numa relíquia | Não / não |
| `meta.confirm` | Diálogo de confirmação | `confirmDialog()` em `dom.ts` | Abandonar e sobrescrever save (Jornada) | Texto | `danger` ou não | Não / não |
| `meta.tooltip` | Dica (tip) | `tip()` / `installTooltips()` em `tooltip.ts` | Passar o mouse, focar ou tocar | — | Toque vs ponteiro | Sim / não |
| `meta.toggles` | Botões do cabeçalho | `installHeaderToggles()` | Sempre | `proto_settings_v1` | Instantâneo, Animado, Efeitos, Música (ligado/desligado) | Sim / não |
| `meta.portraits` | Galeria de retratos (só no lab) | `portraitGallery()` em `lab/portraitGallery.ts` | Catálogo do lab | `PORTRAIT_KEYS` | Imagem base (`lab/refs/`) ao lado de cada desenho em 120, 78, 48 e 24px; filtro `refs=com` / `refs=sem` | Não (só lab) / não |
| `meta.lab` | Laboratório antigo | `labScreen()` / `labFlow()` | `?teste` | `proto_lab_v1` | Linhagem, elementos, dificuldade, nível, jinchuuriki, status, bolsa, vilão, etapa; lista de técnicas sempre vazia (`learnable` fixo em `[]`) | Sim (`?teste`) / não |

## 3. Componentes compartilhados

| Componente | Onde | Usado por |
|---|---|---|
| `show` / `choose` / `h` / `openDialog` / `confirmDialog` / `untilHome` | `prototype/dom.ts` | Todas as telas e sobreposições |
| `createWheel` / `bigWheel` / `spinRoll` | `wheel.ts`, `main.ts` | Origem, eventos, treino, guru, invocação, relíquia da Roleta |
| `stripRoulette` | `wheel.ts` | Iniciativa e acerto na luta da Roleta |
| `playerPanel` (+ `bar`, `xpBar`, chips, passivas, relíquias) | `main.ts` | Origem, mapa, eventos, nível, upgrade, relíquia, aviso, fim, lab |
| `sheetHtml` / `sheetPanels` / `stageTrail` | `main.ts` | Ficha, mapa e fim da Roleta |
| `villainCard` / `villainPanel` / `villainKit` | `main.ts` | Mapa e luta da Roleta |
| `sceneScreen` / `sceneLines` / `scenePortrait` | `jornada/scene.ts` | Evento, aviso, relíquia revelada, fim da Jornada |
| `hud` / `wireHud` / `stageTitle` / `dockShop` | `jornada/index.ts` | Trilha, mapa, descanso |
| `relicCard` / `relicSlot` / `relicBar` / `relicStrip` | `jornada/relics.ts` | Jornada inteira, baú e relíquia da Roleta, Registro |
| `jrboss` (3 relíquias lado a lado) | `chestScreen` e `bossChoiceScreen` | Baú da Roleta e escolha do chefe (HTML quase igual, duplicado) |
| `modeCard` | `modeCard.ts` | Portão e entrada da Jornada |
| `jtree-screen` + `themeOf` / `themeStyle` | `jornada/theme.ts` | Talentos, moveset, loja |
| `fighterPortrait` / `ninjaPortrait` / `foePortrait` / `icon` / `cloud` / `sceneMedia` | `art.ts` (desenhos dos retratos em `portraits/`) | Todas |
| `foldAttrs` / `foldButton` | `jornada/fold.ts` | HUD, próxima parada, dica, loja, painéis da luta |
| `techCard` / `techBits` | `jornada/cards.ts` | Moveset e luta da Jornada |
| `tip` | `tooltip.ts` | Todas |
| `toast` | `main.ts` (exposto à Jornada por `host.notify`) | Avisos |
| `stampChoice` / `inkWipe` | `jornada/motion.ts` | Eventos da Jornada |

## 4. Mapa de dependências

```
                          localStorage
       ┌──────────────┬──────────────┬───────────────┬──────────────┐
  proto_settings_v1   perfil/runs    jornada_run_v1   proto_lab_v1   fold (aparelho)
  (instant,           (conquistas,   (save da run)    (lab antigo)   (seções dobradas)
   dificuldade, som)   vilões, relíq.)
       │                    │              │
       ▼                    ▼              ▼
  casca + ritmo      Portão, Registro,  entrada/progresso
  (todas as telas)   avatares, Hardcore  da Jornada, retomar
                     liberado, classes

  RNG (seed) ──► Roleta: origem → vilão → evento → acerto/dano → relíquia → baú
             └─► Jornada: run nova → mapa (Caminho) → RNG por parada → luta/minijogo/tesouro

  Estado em memória ──► Roleta: `camp` (run inteira), `campLive`, `battlePlayer`
                    └─► Jornada: `live`, `liveBattle`, `pendingGains`

  Mídia (public/img) ──► sceneMedia: com arte = imagem/vídeo; sem arte = cenário em CSS (`jscene scene-*`)
                         (hoje: 21 arquivos em cenas/, 0 em ninja/ e viloes/ → retratos sempre desenhados)

  Media queries ──► celular / DESK ≥900 / WIDE ≥1280 mudam a composição (e a loja acoplada só existe no WIDE)
```

Dependências entre telas (o que precisa ter acontecido antes):

| Tela | Pré-condição |
|---|---|
| Roleta: qualquer tela de run | `camp` montado (origem ou lab) |
| `roleta.event.*` específico | Sorteio do evento (peso 10 a 25 num total de 100) |
| `roleta.chest` | Vencer o chefe (fim do ciclo) |
| `roleta.end` com "Seguir" | Vencer o ciclo 1 no Hardcore (que exige ter liberado o Hardcore) |
| `roleta.notice` | Ciclo 2 em diante |
| `jornada.trail` / `jornada.map` | Run da História / Caminho Ninja em andamento |
| `jornada.story-relic` | Eventos específicos da História |
| `jornada.boss-choice` | Vencer o chefe de um estágio |
| `jornada.talents` com ramos ocultos/abertos | Conquistas de conta e estágio da run |
| `jornada.shop` com Purificar | Run amaldiçoada |
| `jornada.end` com "Seguir ciclo" | Vencer o Caminho Ninja |
| Classes Uchiha/Hyuuga, Hardcore da Jornada | Conquistas no perfil |

## 5. Estados especiais

Estados que mudam muito a interface e valem um caso próprio no lab:

1. **Aparência**: grafite em todas as larguras, inclusive com a preferência clara do aparelho.
2. **Modo instantâneo** (`data-instant`): sem botão Girar, sem animação de jokenpô, falas seguem sozinhas.
3. **Menos movimento** (`prefers-reduced-motion`): roletas param direto no resultado; 11 blocos de CSS.
4. **Modo Animado**: vídeo nas vagas de cena e a cena viva dos painéis grandes (cenários `gate.home:animado`, `jornada.entry:animado` e `jornada.trail:animado`).
5. **Faixa de tela**: celular estreito (≤ 380), celular, tablet (600–899), PC `DESK`, `WIDE`, e PC com altura baixa.
6. **Toque vs ponteiro** (`pointer: coarse`): dicas e tamanhos.
7. **Mood** (`mood('good'|'bad'|'neutral')`): muda o clima da tela depois de resultados.
8. **Dificuldade**: chips e cores `diff-*`; Hardcore travado com cadeado.
9. **Ciclo infinito** (ciclo ≥ 2): chip de ciclo, fim "queda no infinito" em vez de derrota.
10. **Perfil vazio vs cheio**: Portão sem recentes/progresso, Registro vazio, Bingo todo "desconhecido", poucos avatares.
11. **Sem arte vs com arte**: cenário em CSS no lugar da ilustração.
12. **Herói/tema da Jornada**: 5 temas (Naruto, Comum com cor do elemento, Prodígio, Uchiha, Hyuuga).
13. **Equipe vs solo** na luta da Jornada; aliado caído (aba Reerguer); formas e clones.
14. **Laboratório e seed**: a versão no rodapé ganha os rótulos; o lab não grava recordes nem conquistas.

## 6. Lacunas

### Difíceis de acessar

- **Quase tudo além do Portão depende de jogar.** Diretas hoje: Portão e as duas telas de início da
  Jornada, o Registro, o avatar, as dicas e os botões do cabeçalho. Pelo lab antigo: a origem montada, o mapa da Roleta
  a partir de uma etapa e a luta da Roleta contra um vilão.
- **A Jornada não está no lab antigo.** Nenhuma tela de run da Jornada abre sem jogar ou ter um save.
- **Telas de uma vez só**: o pedido de nome some depois da primeira resposta.
- **Tela de erro**: só aparece com uma exceção real.
- **Sobreposições de run** (Fichas, talentos, moveset, loja, relíquias): precisam de run em andamento.
- **Loja acoplada**: só existe com a janela ≥ 1280×560.

### Dependem de aleatoriedade

- Origem (linhagem, elementos, kekkei genkai, jinchuuriki) e qual vilão sai em cada categoria.
- Qual evento pré-luta sai (7 opções no Roleta) e o resultado de cada roleta interna (treino, akatsuki, invocação).
- Acerto, crítico, iniciativa e dano nas duas lutas; vitória ou derrota.
- Raridade e relíquia da recompensa da Roleta; as 3 do baú e da escolha do chefe.
- Mapa do Caminho Ninja (nós e "?"), tesouro, minijogos, prateleira da loja.
- Frases do Portão, da entrada e do rodapé.
- `?seed=N` torna a run reproduzível, mas só a primeira da página, e não deixa escolher o resultado.

### Difíceis de reproduzir

- Fim de ciclo da Roleta com "Seguir para o ciclo 2" (Hardcore vencido) e a queda no infinito.
- Fim da Jornada em cada variante (cada final da História pelo flag, Caminho vencido, infinito, derrota).
- Lição (derrota inevitável) e "tentar de novo" da Jornada.
- Relíquia de história com troca; relíquia de evolução na escolha do chefe.
- Árvore de talentos com todos os 11 estados de nó ao mesmo tempo; árvore completa (treino vira ryō).
- Run amaldiçoada (Purificar, chip de maldição), inflação alta, bolsa cheia.
- Luta com formas, clones, Portões, aliado caído, muitos inimigos, muitas técnicas (`many`).
- Conquistas ocultas/legadas, Registro cheio, todos os avatares.
- Vários toasts em fila; falha ao salvar (aparelho cheio).

### Código que não aparece

Encontrados no código mas inalcançáveis hoje (não contam como telas): Guru e Lição do clã no Roleta (a roleta de eventos do modo é `roletaPreFightEvents`, sem os dois; correção da etapa 3), foco elemental do treino da Roleta (`focus`
sempre vazio), bloco de despertar no nível (`awakening` sempre `undefined`) e lista de técnicas do lab (`learnable`
sempre vazia). A perspectiva do Sasuke só aparece travada.

## 7. Interfaces que precisam de mecanismo de demonstração

Prioridade pelo quanto a tela é vista e o quanto é difícil chegar nela.

| Prioridade | Telas | O que o lab precisaria |
|---|---|---|
| Alta | `roleta.battle`, `jornada.battle` (+ menu, alvo, bolsa, cut-in, fim) | Montar lutadores e estado da luta (HP, efeitos, formas, clones, caídos) e pausar num momento |
| Alta | `jornada.trail`, `jornada.map`, `jornada.hud`, `jornada.shop` (+ dock) | Run da Jornada fabricada (estágio, parada, ryō, bolsa, relíquias, maldição, ciclo) |
| Alta | `roleta.event.*` | Forçar o evento e o resultado de cada roleta interna |
| Alta | `roleta.end`, `jornada.end` | Fabricar a run no fim, em cada variante |
| Média | `jornada.event`, minijogos, `jornada.story-relic`, `jornada.notice` | Escolher evento, etapa e selo |
| Média | `jornada.talents`, `jornada.moveset` | Run com talentos, pontos e técnicas escolhidos |
| Média | `roleta.relic`, `roleta.chest`, `jornada.boss-choice`, `jornada.treasure`, `jornada.relic-reveal` | Escolher as relíquias e o resultado |
| Média | `roleta.origin` | Forçar a origem sorteada (o lab antigo monta a ficha, mas não mostra as roletas) |
| Média | `roleta.levelup`, `roleta.upgrade`, `roleta.notice` | Jogador com XP ou upgrades pendentes |
| Baixa | `gate.name`, `gate.error`, toasts, `meta.confirm`, `gate.confirm-native` | Abrir sob demanda |
| Baixa | Portão, Registro, avatar | Perfis prontos (vazio, médio, completo) |
| Transversal | Todas | Trocar instantâneo, menos movimento, faixa de tela e com/sem arte sem recarregar |

## 8. Cobertura do inventário

| Item | Situação |
|---|---|
| Arquivos de interface lidos | `main.ts`, `jornada/index.ts`, `jornada/battle.ts` (início, menu, alvo e fim), `dom.ts`, `playerName.ts`, `layout.ts`, `index.html`; outros por estrutura (talentos, moveset, ficha, relíquias, minijogos, cena) |
| Funções de tela rastreadas | Todas as chamadas de `show()`, `openDialog()` e `sceneScreen()` em `prototype/` |
| Telas e estados inventariados | 62 entradas com id na seção 2, mais 6 da casca |
| Lido em detalhe | Fluxos, telas e estados da Roleta e da Jornada, navegação, lab antigo |
| Lido só pela estrutura | Interior dos minijogos, desenho da árvore de talentos, conteúdo da Ficha por membro, loop de animação da luta da Jornada (eventos `JEvent` além dos citados), CSS por tela |
| Inspecionado visualmente | **0%** (nenhuma tela aberta) |

Estimativa: **~90% das telas e sobreposições** estão listadas (o fluxo é linear e todas as chamadas de `show()`,
`openDialog()` e `sceneScreen()` foram rastreadas). A **cobertura dos estados** fica em torno de **70%**: as variações
dentro da luta da Jornada, da árvore de talentos e de cada evento da Jornada (texto e opções) foram agrupadas, não listadas uma
a uma. O lab antigo (publicado em `?teste`) foi lido no código, não aberto.
