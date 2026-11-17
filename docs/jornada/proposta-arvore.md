# Proposta: árvore de talentos e controle de builds

> **Proposta, não implementada** (17/11/2026). Só design: nada mudou no código nem nos dados. Vai ao usuário para aprovação antes de qualquer implementação. Regras atuais em [talentos.md](talentos.md); números medidos em [diagnóstico 2](../balanceamento/diagnostico-2.md) (J4) e nos itens 28 e 29 de [decisoes.md](../decisoes.md).

**Pedido:** controle de builds mais divertido e, se valer a pena, outra forma de organizar a árvore da Jornada (História e Caminho Ninja). Decisão do usuário: **a rejogabilidade da História vem da variedade de talentos**. Meta de vitória do bot: 90/65/40/15 (Fácil/Médio/Difícil/Hardcore) por classe.

## 1. Diagnóstico

O que foi medido (Médio / Difícil, build focada num ramo):

| Classe | Ramo que ganha | Ramo que perde | Bot padrão (compra o mais barato) |
|---|---|---|---|
| Comum | Estilo da Folha 95 / 78 | Clones 93 / 59 | 91 / 64 |
| Prodígio | Punho Bêbado 97 / 76 (98/85 na v0.88.3) | Treino 90 / 55 | 85 / 50 |
| Uchiha | Armas do clã 87 / 60 | Ilusões 74 / 36 | 85 / 47 |
| Hyuuga | Oito Trigramas 91 / 64 | Casa secundária 78 / 40 | 78 / 43 |
| Naruto (História) | Clones 82 / 33 | Sapos 69 / 17 | 74 / 20 |

Cinco causas, em ordem de peso:

1. **Vários golpes multiplicam todo o resto.** Em `strike` (`src/core/jornada/battle.ts`) cada golpe sorteia acerto e crítico à parte, soma o dano fixo (+2 no taijutsu), tenta o efeito e conta para o combo. Uma técnica de 3 golpes recebe 3 vezes cada bônus "por golpe" e ainda erra menos no total (a variância cai). Por isso Punho Bêbado, Shuriken giratória, 64 Palmas e Furacão da Folha vencem: não pela técnica em si, mas porque tudo que se compra depois rende mais nelas. Mover a técnica da raiz para a junção (v0.85.0 a v0.87.0) só atrasou dois pontos; o efeito composto continua.
2. **O momento decide a run.** O Caminho Ninja rende 15 a 18 pontos e um ramo custa 10. Quem tem a técnica forte nos primeiros 3 a 5 pontos joga o estágio 1 inteiro com ela; o resto da árvore quase não chega a importar. No Naruto é o contrário: Sapos, Kyuubi e Rasengan abrem pela história **depois** do Haku, onde a maioria das runs cai, então a build "focada" neles joga o primeiro arco sem nada (item 28).
3. **A escolha real é uma só.** Dentro do ramo, tirando a bifurcação, os nós vêm numa ordem fixa. A decisão que importa é "qual ramo" no primeiro ponto, e ela já tem resposta certa por classe. Resposta certa conhecida mata a rejogabilidade: a quinta run do prodígio é igual à segunda.
4. **O caminho barato é uma armadilha.** As raízes custam 1 e não ensinam técnica; quem espalha pontos ganha cinco passivos pequenos e nenhuma técnica (o bot padrão caiu no prodígio, no Uchiha e no Hyuuga, item 29). Um humano novato faz a mesma coisa.
5. **Controle e suporte dependem de saber jogar.** Ilusões, Polícia, Casa secundária e Treino pedem atordoar na hora certa ou Defender pelo aliado. O bot não sabe (o teste da v0.88.3 foi desfeito), e o jogador no celular, com um toque por turno, também tende a não planejar isso. Parte da diferença é do bot, parte é do design: o retorno desses ramos é invisível.

Conclusão: **não é só número**. Baixar os ramos fortes de novo repete o ciclo que o item 29 descreve. O problema é de estrutura (ordem fixa, técnica no meio do ramo, bônus por golpe) e de oferta (uma escolha com resposta certa).

## 2. Princípios da proposta

- **Toda build tem o seu "momento bom" cedo.** Nenhum estilo depende de chegar ao 6º ponto para existir.
- **Bônus por técnica, não por golpe.** Dano fixo, chance de efeito e devolução de chakra valem uma vez por uso (ou são divididos pelos golpes); o crítico e o acerto continuam por golpe, que é o que dá sabor aos vários golpes.
- **Várias escolhas pequenas em vez de uma grande.** Cada ponto é uma decisão, com pelo menos duas boas respostas.
- **A sorte oferece, o jogador escolhe.** Combina com o "RNG é o coração do jogo" e com o pilar "sorte pesa menos" da Jornada: sorteia-se o que aparece, nunca o que se ganha.
- **Celular primeiro:** cada decisão cabe em uma tela com até 3 cartões e um toque. Detalhe na dica.
- **O bot consegue jogar:** a regra de escolha precisa caber numa função de pontuação simples, para a simulação continuar medindo.

## 3. Alternativas

### A. Rascunho: 3 cartões por ponto

A árvore vira um **baralho por classe**. A cada ponto ganho, o jogo sorteia 3 talentos que dá para aprender agora e o jogador fica com 1 (ou guarda o ponto). Os pesos do sorteio favorecem o que combina com o que ele já tem. Os pré-requisitos continuam existindo (o nó pede outro), mas a ordem não é mais fixa: aparece o que o sorteio trouxe.

**Exemplo, prodígio.** Nível 2: saem *Gole extra* (+8% crítico), *Corpo treinado* (escudo de 10%) e *Entrada dinâmica* (técnica). O jogador pega a Entrada. Nível 3: o peso da tag *rival* subiu, saem *Desafio*, *Contra-ataque* e *Furacão da Folha*. Ele pode seguir o rival ou mudar de rumo. O Punho Bêbado só vem se o sorteio trouxer, e cada run monta uma combinação diferente.

| | Prós | Contras |
|---|---|---|
| Celular | 3 cartões, um toque, nada de navegar em abas | A tela da árvore perde o papel principal (vira o "registro" da build) |
| Rejogabilidade | A maior das três: a ordem muda toda run, mesmo na História linear | Pode frustrar quem quer uma build exata; precisa de uma troca (ver abaixo) |
| Simulação | O bot escolhe por pontuação de tag; a variância vira parte do que se mede | O ramo "focado" deixa de existir como cenário; medir por tag em vez de por ramo |

Controle mínimo para não virar só sorte: **1 troca grátis por estágio** (sorteia os 3 de novo) e a opção de **guardar o ponto** para o próximo rascunho, que sai com 4 cartões.

### B. Núcleo + modificadores

Cada classe tem **6 núcleos** (os estilos de hoje: Punho Bêbado, Portões, Juventude...). O jogador escolhe **um núcleo no início da run** e recebe na hora a técnica e a regra que o definem. Os outros pontos compram **modificadores** soltos, sem ramo, cada um com tags (*taijutsu*, *vários golpes*, *crítico*, *controle*, *equipe*, *clone*, *elemento*, *escudo*). Um segundo núcleo pode ser comprado mais tarde, caro.

**Exemplo, Hyuuga.** Núcleo *Casa secundária*: começa com o Guarda-costas e a regra do Guardião em versão fraca (15% dos golpes contra aliados caem em você). Modificadores que valem para ele: *Lealdade* (+escudo), *Equilíbrio* (cura ao Defender), *Olhos do guardião* (revide). O núcleo *Oito Trigramas* começa com as 64 Palmas, mas sem os bônus fixos por golpe que hoje o fazem dominar. Os dois núcleos começam a run com a mesma força no papel.

| | Prós | Contras |
|---|---|---|
| Celular | A escolha mais importante é uma tela só, no início; o resto é uma lista curta filtrada por tag | A lista de modificadores pode ficar longa (40+ por classe) |
| Rejogabilidade | Cada núcleo é uma run diferente desde o primeiro turno; resolve o "momento" (causa 2) | Depois de escolher o núcleo, a melhor compra tende a ter resposta certa de novo |
| Simulação | Mede direto cada núcleo, como o `--ramos` faz hoje | Para comparar núcleos, ainda depende do bot saber jogar controle e suporte |

### C. Sinergias por tag e nós que reagem a relíquias

Mantém a árvore em ramos, mas cada nó carrega **tags**, e juntar tags dá **bônus de conjunto** em degraus (2, 4 e 6 nós de *controle*, por exemplo), como as combinações de hoje, só que contadas. As **relíquias também têm tags** e contam. Alguns nós mudam conforme a relíquia que a equipe carrega (a "reação").

**Exemplo, Uchiha.** Tag *controle*: 2 nós dão +10% de chance de efeito; 4 nós, alvo controlado leva +20% de dano da equipe; 6 nós, a regra da Ordem do clã. *Prisão* (Ilusões) e *Interrogatório* (Polícia) contam juntos, então misturar ramos de controle vale mais que fechar um. Reação: com o **Incenso dos sonhos** (relíquia de genjutsu), o nó *Mestre das ilusões* ganha "+1 turno no Medo". Com a **Cabaça de areia**, *Previsão* vira "ao começar com escudo, +10% de esquiva".

| | Prós | Contras |
|---|---|---|
| Celular | Cabe na tela atual: um contador de tag no topo e o selo do nó com o ícone da tag | Mais informação por nó (tag, degrau, reação); exige dica bem escrita |
| Rejogabilidade | As relíquias, que já são sorteadas, mudam a build de uma run para outra | Sozinha, não muda a ordem fixa dos ramos (causa 3) |
| Simulação | Fácil de medir (contar tags); o bot ganha um critério claro | Mais combinações para cobrir; risco de uma tag dominar como hoje um ramo |

## 4. Recomendação

**Núcleo + rascunho de modificadores, com tags como cola** (B como estrutura, A como forma de oferecer, C para combinações e relíquias). Em resumo:

1. **Início da run: escolher o núcleo** entre 3 dos 6 da classe (sorteados; os 3 sempre de estilos diferentes: um de dano, um de controle ou suporte, um livre). O núcleo dá a técnica e uma regra fraca na hora. Resolve o momento (causa 2) e o caminho barato (causa 4): ninguém fica sem técnica.
2. **Cada ponto: rascunho de 3 modificadores**, pesado pelas tags do núcleo e das relíquias. 1 troca grátis por estágio; guardar o ponto dá 4 cartões no próximo. Resolve a resposta certa (causa 3) sem tirar o controle.
3. **A regra final do núcleo** (o talento final de hoje) entra quando a build junta 4 modificadores da tag do núcleo, não no fim de um corredor. Combinações e assinaturas viram **degraus de tag** entre dois núcleos ou entre núcleo e relíquia.
4. **Bônus por técnica, não por golpe** (causa 1), em todas as classes. Isso é o que de fato contém Punho Bêbado e afins, sem enfraquecer a técnica em si.
5. **Controle e suporte com retorno visível** (causa 5): o núcleo de controle mostra "atordoou 2 inimigos, +X de dano" no fim da luta; os modificadores de suporte dão algo passivo que o bot não precisa saber usar (escudo no início, cura por rodada), com o ativo como bônus.

**Por que este e não um só:** A sozinho é sorte demais para uma build "de verdade"; B sozinho volta a ter resposta certa depois do núcleo; C sozinho não mexe na ordem fixa. Juntos, cada run tem um começo diferente (núcleo sorteado), um meio diferente (rascunho) e um fim que depende das relíquias (tags).

### Naruto na História

A História é linear, então a variedade tem que vir dos talentos (decisão do usuário). Com a recomendação:

- **Núcleos do Naruto:** Clones e Pegadinhas desde o início; Laços, Sapos, Kyuubi e Rasengan chegam pelo marco da história, como hoje. A técnica do marco (Kuchiyose, Rasengan) vem para todos, com ou sem o núcleo.
- **Cartões de semente** resolvem o "tarde demais": no rascunho do primeiro arco podem sair cartões como *Promessa do Ero-sennin* ("+5% de dano agora; quando aprender o Rasengan, ele já vem no nível 2") ou *Cheiro de sapo* ("+1 de chakra por rodada; quando assinar o contrato, o Kuchiyose sai com +15 de peso no Gamabunta"). Investir cedo num ramo da história passa a ter efeito no primeiro arco e um retorno grande depois.
- Como o rascunho muda toda run, duas Histórias seguidas têm builds diferentes mesmo com os mesmos chefes.

### Números de partida (para simular, não aprovados)

| Item | Valor |
|---|---|
| Núcleos oferecidos no início | 3 de 6 |
| Cartões por rascunho | 3 (4 com ponto guardado) |
| Trocas grátis | 1 por estágio |
| Custo de um modificador | 1 ponto (os de 2 pontos de hoje viram 2 cartões fracos ou 1 forte com custo 2) |
| Regra final do núcleo | 4 modificadores da tag do núcleo |
| Segundo núcleo | 4 pontos, a partir do estágio 2 |
| Meta de diferença entre núcleos (Difícil) | até 10 pontos, hoje 17 a 29 |

## 5. O que mudaria no código

Ordem sugerida: **primeiro o Comum** (Caminho Ninja, o mais estável), medir, depois prodígio, Uchiha, Hyuuga e por último o Naruto (que tem os marcos da história). O clássico não se apaga: a árvore atual fica no código atrás de uma opção até a nova ser aprovada.

**Core (`src/core/jornada/`)**
- `talents.ts`: `TalentNode` ganha `tags`, `core` (nó de núcleo) e `seed` (efeito guardado até um marco). Funções puras novas: `offerCores(rng, owner, data)`, `draftTalents(run, rng, data, n)` (pesos por tag do núcleo e das relíquias) e `tagCounts(run, data)`. `talentState` continua valendo para pré-requisitos; `treeComplete` passa a olhar o baralho.
- `battle.ts`: separar em `FighterMods` o que é por golpe (crítico, acerto) do que é por técnica (dano fixo, chance de efeito, chakra por golpe). Hoje `hitDamage` soma o fixo em cada golpe dentro de `strike`; a proposta é aplicar uma vez no primeiro golpe que acerta, ou dividir pelos golpes. Teste antes da fórmula, como manda o CLAUDE.md.
- `run.ts`: estado do rascunho na run (`draft`, `rerolls`, `heldPoints`, `core`), salvo em `jornada_run_v1` (precisa de migração do save em `src/state/`). O ganho de ponto deixa de ir direto para a conta e abre o rascunho.
- `relics.ts`: `RelicDef` ganha `tags` para pesar o rascunho e contar degraus; as reações ficam no nó (`reactsTo: relicId`).

**Dados (`src/data/jornada/`)**
- `talents.ts`: reescrever as cinco árvores como núcleos + modificadores com tags. A maior parte dos efeitos atuais serve: muda a organização, não a lista.
- `relics.ts`: tags nas ~90 relíquias.
- `balance.ts`: os números da tabela acima (`talentDraft`), nunca soltos no código.
- `strings/ptBR.ts`: textos dos cartões, das tags e dos núcleos.

**Bot (`src/sim/`, `scripts/sim-jornada.ts`)**
- O `spendTalents` de hoje (mais barato, ou o ramo focado) vira **escolher no rascunho por pontuação**: tag do núcleo > técnica nova > degrau de tag perto de fechar > o resto. Guardar o ponto quando nenhum cartão serve.
- `--ramos` vira `--nucleos` (um cenário por núcleo) e `--tags` (vitória por tag dominante). O "bot padrão" passa a ser o núcleo sorteado + rascunho com a pontuação acima, que é o que um jogador médio faria.
- Aviso: outra sessão está mexendo no bot da simulação agora; a mudança no `spendTalents` precisa esperar ou ser combinada com ela.

**Interface (`prototype/jornada/talentTree.ts` e telas)**
- Tela nova de **rascunho** (3 cartões, botão de troca, guardar ponto), reaproveitando o cartão canônico de técnica.
- Tela de **escolha do núcleo** no início da run (3 cartões grandes, no tema da classe).
- A árvore atual vira o **registro da build**: selos aprendidos, contadores de tag e degraus. Celular: lista por tag; PC: painel fixo ao lado da batalha.

**Docs:** `talentos.md` reescrito, `progressao.md` (ponto abre rascunho), `reliquias.md` (tags) e `docs/registro.md` com a simulação de antes e depois.

## 6. Para decidir

1. Aceitar a direção (núcleo + rascunho + tags) ou ficar com uma das três sozinha.
2. O núcleo no início é **sorteado entre 3** ou **livre entre os 6**. Sorteado dá mais variedade; livre dá mais controle.
3. Bônus por técnica em vez de por golpe vale também para o Roleta, ou só na Jornada.
4. A árvore atual fica como opção ("modo clássico") ou sai quando a nova entrar.
5. Começar pelo Comum, como sugerido, ou direto pelo Naruto da História.
