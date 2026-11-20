---
objetivo: Fazer do Portão da Vila o acesso direto a Arcade, História e Campanha, com cena ilustrada e retomada da run no card correspondente.
escopo: ["docs/tarefas/portao-ninshu.md", "public/img/cenas/portao.webp", "prototype/art.ts", "prototype/gate.ts", "prototype/modeCard.ts", "prototype/main.ts", "prototype/jornada/index.ts", "prototype/shell.ts", "prototype/index.html", "prototype/styles/tokens.css", "prototype/styles/base.css", "prototype/styles/a11y.css", "prototype/styles/menu.css", "prototype/styles/shell.css", "prototype/styles/shinobi/base.css", "prototype/styles/shinobi/entradas.css", "prototype/styles/shinobi/detalhes.css", "prototype/lab/lab.html", "prototype/lab/scenarios/gate.ts", "prototype/lab/fixtures/jornada.ts", "tests/uilab.test.ts", "src/data/strings/ptBR.ts", "src/data/strings/jornada.ts", "docs/visual.md", "DESIGN.md", "docs/ui-lab/SCREEN_INVENTORY.md", "changelog.d/portao-ninshu.md"]
fora: ["src/core/**", "src/state/**", "src/sim/**", "src/data/**/balance*.ts", "src/data/balance*.ts", "prototype/roleta/**", "prototype/jornada/battle.ts", "public/img/portraits/**", "package.json", "package-lock.json", "CHANGELOG.md", ".github/**", "plano-codex-telas.md", "prompts-codex-telas.md"]
pronto: ["npm run check verde", "UI Lab em 360, 390, 768, 1024 e 1440 px com capturas no PR", "Portão → cada modo → uma luta → voltar ao Portão", "F5 com save canon ou generic mostra Continuar só no card correspondente e retoma a parada salva", "barra superior acessível por mouse, toque e teclado", "docs e fragmento no commit de implementação e PR para staging sem Co-Authored-By"]
agente: codex
revisor: claude
---

# Portão da Vila e três modos

## Pedido

Fazer somente a Tarefa 2. Quem chega ao Portão escolhe Arcade, História ou Campanha em um toque. Quem volta com uma Jornada salva encontra **Continuar** no card do seu modo.

## Contexto

A branch `feature/portao-ninshu` parte de `origin/staging` em `b4b060b`, já com a identidade Ninshu Roots. No Portão atual, a imagem vem do pôster noturno de Sasuke, dois cards levam a Roleta ou Jornada, e o painel de progresso contém a ação de retomada. A leitura da run já distingue História (`canon`) e Campanha (`generic`). As referências são o mockup `portao-da-vila.png`, a Tarefa 2 do plano local, as [regras do projeto](../../AGENTS.md), a [direção visual](../visual.md), o [design system](../../DESIGN.md) e o [fluxo de entrega](../processo/fluxo.md).

## Plano

1. Ilustrar uma vila ao entardecer, sem personagem, com telhados em silhueta, céu azul e sombras grafite. Reservar espaço de leitura para o letreiro. Entregar `public/img/cenas/portao.webp`, registrar a chave `portao` e seu foco em `SCENE_ART` e dissolver a parte inferior da cena no grafite. Conferir o recorte estreito e o panorâmico, além do fallback SVG de Konoha. Retirar os slots `portao-dia` e `portao-noite` e manter os pôsteres das perspectivas da História com seus arquivos e enquadramentos atuais.
2. Montar três entradas em `nav.gate-modes` com `modeCard()`. Arcade usa `data-choice="roleta"`, a arte `modo-roleta` e o fluxo atual de origem. História usa `story` e abre a escolha de perspectiva. Campanha usa `path` e abre a preparação de classe e elemento. Passar a entrada escolhida a `runJornada` e fazer **Voltar** retornar ao Portão sem passar por `entryScreen()`.
3. Ler a run pela API de save existente. Oferecer **Continuar** dentro do card de História para `canon` e de Campanha para `generic`. Distinguir retomar a parada salva de iniciar outra partida. Entrar e voltar pelo outro modo deve preservar o save. Iniciar outra run segue a confirmação de substituição já existente. Retirar `progressSlot()` e `.gate-resume` do Portão, inclusive da coluna do desktop.
4. Usar um único token de superfície na Ficha do ninja e atrás do avatar em `profileCard()`. Conferir o resultado ao trocar entre avatares, mantendo a edição do nome, a troca de retrato e o Registro do ninja.
5. Recolher `header.top` numa faixa com alça de Konoha. Abrir por aproximação de ponteiro fino na borda superior, toque na alça ou Tab. Manter a faixa aberta enquanto o foco percorre os controles e recolher ao sair ou dispensar por toque. Preservar foco visível, nomes acessíveis e os comandos existentes, inclusive `#home-btn`, `#sheet-btn` e `#history-btn`. Usar tokens de duração e respeitar `prefers-reduced-motion`.
6. No celular, retirar o pergaminho de conquistas do Portão e oferecer em `#gate-nav` os destinos **Início, Arcade, História, Campanha e Registro**, com área de toque de pelo menos 44 px, espaço para a área segura inferior e conteúdo final alcançável. No desktop, a lateral leva aos mesmos destinos e a Ficha ocupa sua coluna. Reutilizar as ações de navegação e confirmação em vigor. Usar strings PT-BR, ícones de `ICONS`, tokens por `var(--...)`, chanfros nos pseudoelementos e detalhes em `tip()`.
7. Atualizar os cenários de `prototype/lab/scenarios/gate.ts` para os perfis vazio, médio e cheio, com e sem run salva, cobrindo os dois tipos de save e o modo Animado. Gerar com `npm run lab` e conferir 360, 390, 768, 1024 e 1440 px, incluindo foco, toque, movimento reduzido, corte de texto e rolagem. Rodar `npm run lab:seed -- --all` caso um cenário de sorteio quebre.
8. Testar no jogo o percurso Portão → cada modo → uma luta → voltar. Recarregar com F5 depois de salvar em cada modo da Jornada, verificar a localização exclusiva de **Continuar** e confirmar que a ação retoma a parada correta. Conferir também o Portão sem save e o cancelamento da troca de run.
9. Atualizar `docs/visual.md`, `DESIGN.md` e `docs/ui-lab/SCREEN_INVENTORY.md`, criar `changelog.d/portao-ninshu.md` e rodar `npm run check`. Incluir implementação, docs e fragmento no mesmo commit. Subir somente a branch da tarefa e abrir PR para `staging` com capturas e revisão cruzada do Claude, sem linha de coautoria.

## Fora do escopo

As novas telas de História e Campanha e a distribuição do seletor de dificuldade pertencem à Tarefa 3. O lobby do Arcade pertence à Tarefa 4. Combate, sprites, mecânicas, balanceamento e redesenho do progresso da Jornada ficam fora desta entrega. Preservar ids internos, seletores consumidos pelo TypeScript e chaves de save, inclusive `runs_v1`, `profile_v1`, `jornada_run_v1` e `proto_settings_v1`. Os arquivos locais do plano e dos prompts ficam fora do commit.

## Decisões para o usuário

Proposta para o card com save: manter a entrada para uma nova partida do modo e oferecer **Continuar** como ação própria no mesmo card, com controles irmãos acessíveis por teclado. Isso permite recomeçar no mesmo modo sem perder a confirmação de substituição. O roteamento direto usa a dificuldade vigente até a distribuição do seletor nas telas da Tarefa 3.

## Achados

Registrar aqui a issue de cada achado fora do escopo durante a implementação e a conferência.
