---
objetivo: Refazer as telas da História e da Campanha na composição do Portão (painel de arte, dois cards com janela própria e coluna lateral), com a dica de cada arco da História e, na Campanha, o cardápio de classes e a classe aleatória com a relíquia extra.
escopo: ["docs/tarefas/modos-jornada.md", "src/core/jornada/run.ts", "tests/jornadaAleatoria.test.ts", "scripts/sim-jornada.ts", "docs/jornada/classes.md", "docs/jornada/caminho-ninja.md", "docs/balanceamento/benchmark.md", "prototype/jornada/index.ts", "src/data/strings/jornada.ts", "prototype/styles/jornada.css", "prototype/lab/scenarios/jornada.ts", "prototype/lab/fixtures/*.ts", "tests/uilab.test.ts", "docs/jornada/run.md", "docs/jornada/README.md", "docs/visual.md", "docs/ui-lab/SCREEN_INVENTORY.md", "changelog.d/modos-jornada.md"]
fora: ["src/core/roleta/**", "src/core/jornada/battle*.ts", "src/sim/**", "src/state/**", "src/data/balance*.ts", "src/data/**/balance*.ts", "src/data/jornada/**", "src/data/roleta/**", "prototype/gate.ts", "prototype/main.ts", "prototype/roleta/**", "public/img/**", "prototype/art.ts", "package.json", "package-lock.json", "CHANGELOG.md", ".github/**"]
pronto: ["npm run check verde", "a História abre na composição do Portão: painel com a arte jornada, cards Naruto e Sasuke (este em breve) e a coluna com a run salva, a dificuldade e as conquistas recentes", "tocar num card abre uma janela grande com a arte, a descrição, os arcos com o progresso e o Começar ou o Continuar e o Recomeçar; Esc e voltar fecham", "cada arco da História mostra uma descrição breve ao passar o mouse ou tocar (dica destacada, não janela)", "a Campanha usa a mesma composição da História: cards Escolher a classe e Classe aleatória, com a dificuldade na coluna", "Escolher a classe abre o cardápio: lista de classes, o retrato da escolhida em destaque com a descrição ao lado (Prodígio no Comum sem elemento) e o elemento do Comum sem a opção de sortear", "Classe aleatória sorteia a classe entre as liberadas (e o elemento, no Comum) e sempre dá a relíquia extra, com teste", "simulação de antes e depois da regra nova, sem compensar balanceamento", "Continuar, Recomeçar, o aviso do outro modo e o progresso dos arcos continuam funcionando", "ordem do foco igual à ordem visual no celular (issue #95)", "UI Lab em 390, 768, 1280, 1920 e 2560 sem rolagem horizontal", "docs e fragmento no mesmo commit, PR para staging"]
agente: claude
aprovado: 2026-11-27
---

# Telas da História e da Campanha na composição do Portão

## Pedido

Retorno do usuário sobre o PR #97 (27/11/2026), avaliando o PC:

1. "As duas telas ficaram muito feias. Use a foto `jornada` (public/img/cenas) como painel de fundo, como era nas versões anteriores. Os cards eram Modo História e Jornada; agora serão Modo História Naruto e Modo História Sasuke, que ao serem clicados abrem um pop-up maior com as características do modo. Se baseie no layout antigo."
2. O celular talvez não esteja ruim.
3. "A tela da Campanha está mal diagramada; a dificuldade pode ficar abaixo da escolha da classe."
4. "A imagem do personagem ao lado da escolha da classe muda de acordo com a classe selecionada."
5. "A imagem desta tela (Campanha) é fraca, um pergaminho, não um painel marcante. Tornar a tela estruturalmente parecida com o padrão do sistema."

Pela divisão de 26/11, a estrutura (HTML gerado, janela, retrato que muda, ordem) é do Claude; o acabamento e a arte nova, do Codex, depois.

## Contexto

- O layout antigo é a `entryScreen()` (`prototype/jornada/index.ts`), hoje só no UI Lab (`jornada.entry`): casca `.gate.jgate` com o painel `gate-banner` (arte `jornada`, letreiro e frase), os cards `modeCard()` em `.gate-modes` e a coluna `.gate-aside` com progresso, dificuldade e conquistas recentes. O CSS dela continua no projeto (`jornada.css`, `shell.css`), então reaproveitar a casca traz o visual de volta sem CSS novo grande.
- As telas atuais (`campaignScreen`, `pathSetupScreen`, PR #94) já têm a lógica: `difficultyBox`, `modeTop` (run salva e aviso do outro modo), `arcStrip` com os estados e `storyArcsCleared`.
- Cada classe da Campanha tem o herói dela (`data.generic.classes[].hero`, e `noElementHero` no Comum sem elemento: o Prodígio); o retrato sai de `data.characters[hero].portrait`.
- O PR #97 (acabamento do Codex sobre a estrutura do #94) perde o sentido com a estrutura nova: é fechado sem merge.

## Plano

1. **História** (`campaignScreen`), na casca `.gate.jgate`:
   - painel com a arte `jornada`, o letreiro "Modo História" e uma frase;
   - dois cards (`modeCard`): **Naruto** (arte `perspectiva-naruto`, selo 陽) e **Sasuke** (arte `perspectiva-sasuke`, selo 影, travado: "Em breve");
   - coluna: a run salva (card de progresso com o Continuar, ou o aviso do outro modo), a dificuldade e as conquistas recentes;
   - tocar num card abre uma **janela grande** (`openDialog`): arte, nome, descrição, os quatro arcos com o progresso e o botão (**Começar a História**, ou **Continuar** e **Recomeçar** com a História salva). A do Sasuke mostra a descrição e o "Em breve". Esc, o X e o voltar do navegador fecham.
2. **Campanha** (`pathSetupScreen`), na mesma casca:
   - painel com a arte da Campanha, o letreiro e os três estágios;
   - área principal: retrato, **classes**, elemento (no Comum), **dificuldade logo abaixo** e o botão de começar;
   - coluna: a run salva (progresso com o Continuar, ou o aviso) e o recorde do modo infinito;
   - o **retrato acompanha a escolha**: Comum, Uchiha, Hyuuga, e o Prodígio quando o Comum escolhe "sem elemento".
3. **Ordem do HTML igual à visual** em cada faixa (fecha a #95).
4. **UI Lab**: os cenários atuais passam a montar as telas novas, mais um cenário com a janela do Naruto aberta e um com a do Sasuke.
5. **CSS mínimo**, só tokens, para a janela e o retrato; o resto vem da casca `.gate.jgate`.
6. **Docs**: `docs/visual.md` (Entrada da Jornada), `docs/jornada/run.md` (Tela de início), README da Jornada, `SCREEN_INVENTORY` e o fragmento `changelog.d/modos-jornada.md`.
7. Fechar o PR #97 e apagar a branch dele.
8. **Depois do merge**: contrato visual para o Codex (acabamento das duas telas e da janela) e o prompt da arte nova do painel da Campanha em `imagens-codex.md`.

## Fora do escopo

Regras, números, saves; o Portão, o Registro, o Arcade e a run da Jornada; imagens novas (a do painel da Campanha vem no passo 8); o acabamento fino (Codex).

## Ampliação (27/11/2026, aprovada pelo usuário na conversa)

Retorno sobre o PR #98: "a composição do Modo História me agradou muito; repetir para a Campanha, com uma alteração conceitual".

- **História:** passar o mouse ou o dedo num arco mostra uma descrição breve dele, num bloco informativo destacado (a dica do projeto, `tip()`), não numa janela. Se poluir, considerar trocar a janela da perspectiva por uma tela.
- **Campanha, na composição da História:** dois cards e a coluna com a run salva, a dificuldade e as conquistas recentes.
  - **Escolher a classe** abre um cardápio: a lista de classes, a imagem da classe escolhida em destaque e a descrição ao lado; no Comum, o elemento (ou o Prodígio). A opção "Sortear o elemento" sai do cardápio (resposta do usuário: "Tirar do cardápio").
  - **Classe aleatória** abre a janela da recompensa e sorteia a classe. Resposta do usuário: "Sorteia classe, sempre relíquia": a classe sai entre as liberadas (e o elemento, no Comum) e a run **sempre** ganha a relíquia extra. Hoje ela só vem quando o Comum sorteia o elemento; Uchiha e Hyuuga, de elemento fixo, não ganham nada. **É regra nova** (skill `nova-mecanica`): core, teste, simulação de antes e depois e docs. Nada de balanceamento é compensado sem o usuário.
- **Core** (`src/core/jornada/run.ts`): `newRandomGenericRun(seed, difficulty, data, unlocked)` sorteia a classe pela seed e chama `newGenericRun` com o elemento sorteado e a marca `classPick: 'random'`, que dá a relíquia do sorteio (`elementDraw.randomBonus`) também às classes de elemento fixo. A revelação mostra a relíquia nos dois casos.
- **Simulação** (`scripts/sim-jornada.ts`): `--aleatoria` mede a classe aleatória e cada classe com e sem a relíquia, sem mudar os grupos padrão da guarda da meta (`check:meta`).

## Decisões para o usuário

- **Arte do painel da Campanha:** não há no projeto uma arte de painel própria (as que existem são pergaminho, retratos de arco ou já usadas pela História e pelas perspectivas). Proposta: gerar uma nova pelo Codex (passo 8) e, até ela chegar, usar provisoriamente a mesma arte `jornada` da História.
- **Conquistas recentes na História:** voltam na coluna, como no layout antigo.
- **Elemento padrão no cardápio do Comum:** sem o "Sortear", o cardápio abre com o Fogo marcado (o primeiro da lista).

## Achados

- O CSS da estrutura anterior das duas telas (`.jc-duo`, regras de `.jcampaigns` e `.jpath`, `.jsub-head`) ficou sem uso em `prototype/styles/jornada.css`; `.jc-panel` continua (as cenas usam). Fica para a limpeza no acabamento visual do Codex (passo 8), que já mexe nesse arquivo.
- O tema (`shinobi/entradas.css`) pinta o letreiro "Modo Jornada" e troca a arte dos cards por pergaminhos fixos na casca `.jgate`; as telas novas desfazem isso com seletores mais específicos (`.gate.jgate.jhub`). O acabamento pode trocar essa solução por um letreiro próprio de cada modo.
