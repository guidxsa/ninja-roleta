# História do Sasuke (em design)

> **Proposta para revisão.** Nada disto está implementado. Estrutura de campanhas em [README.md](README.md#campanhas).

A mesma Parte I, vista pelos olhos do Sasuke. Ela não repete a campanha do Naruto com outros inimigos. Os mesmos fatos ganham outro peso: onde o Naruto ganha laços, o Sasuke vai perdendo os dele por escolha própria. Nenhum dos dois é o lado "bom". O Naruto tem teimosia e solidão; o Sasuke tem trauma, orgulho e afeto pela Equipe 7 que ele não admite.

A campanha é a **noite** da identidade visual: o Portão escuro, com o Sasuke observando Konoha ([visual.md](../visual.md#dualidade-naruto-e-sasuke)).

## Arcos (cronologia do Sasuke)

| # | Arco | Fatos do mangá | Leitura do Sasuke |
|---|---|---|---|
| 0 | Prólogo: o massacre | Itachi extermina o clã; "odeie-me e sobreviva" | Evento de lembrança, sem luta. Define o objetivo da run |
| 1 | País das Ondas | Teste do sino (ele tenta sozinho), Zabuza, Haku: desperta o Sharingan e cai protegendo o Naruto | "O corpo se mexeu sozinho": o primeiro laço que ele não escolheu |
| 2 | Exame chunin | Floresta da Morte: o Orochimaru dá o selo amaldiçoado; Dosu e Zaku; Yoroi nas preliminares; treino do Chidori com o Kakashi; final contra o Gaara | O poder vem com custo; a primeira vez que o selo vence a vontade |
| 3 | Itachi | O Itachi volta; pousada (Chidori falha, Tsukuyomi); hospital; a luta no telhado contra o Naruto; a oferta do Quarteto do Som | O Naruto ficou mais forte, e isso dói. A decisão de partir |
| 4 | Vale do Fim | A saída de Konoha (a despedida da Sakura), o Quarteto como escolta, o duelo no Vale | O mesmo duelo, do outro lado. Ele poupa o Naruto e vai embora |

`sasuke2.webp` (Itachi e Sasuke) fica reservada para a arte do arco 3.

## Pontos de encontro com a campanha do Naruto

São os mesmos acontecimentos, com regras e sentido trocados.

| Momento | Na campanha do Naruto | Na do Sasuke |
|---|---|---|
| Haku | Chefe em dupla com o Sasuke | O Sasuke cai protegendo o Naruto; o arco termina com o despertar do Sharingan |
| Hospital | Aguentar 5 rodadas (o Kakashi interrompe) | Vencer o Naruto antes da interrupção: Chidori contra Rasengan |
| Vale do Fim | Chefe: o Sasuke | Chefe: o Naruto com o manto da Kyuubi. Vencer não é "o bem vence": é partir |
| Itachi | Evento em que o Jiraiya intervém | Luta que não se vence: aguentar o Tsukuyomi (vitória especial "sobreviver") |

## Identidade de jogo (ideias)

- **A equipe encolhe.** Nos arcos 1 e 2 lutam Naruto e Sakura; no 3 ele fica sozinho; no 4 tem a escolta do Som (aliados frios, que não se curam entre si). É o espelho da equipe que cresce na campanha do Naruto.
- **Selo amaldiçoado**: um poder com custo, oferecido em eventos.
  - Aceitar dá dano e acerto altos, mas drena HP e trava a cura do descanso.
  - Recusar mantém a run estável.
  - O Kakashi sela o poder no fim do Exame; no arco 3 ele volta mais forte (nível 2).
- **Sharingan em evolução** pelos arcos (1, 2 e 3 tomoe), com a ativa que já existe nas técnicas.
- **Talentos próprios**: ramos Chidori, Sharingan e Selo, na árvore do Sasuke. O dono dos nós é `owner: 'sasuke'`, como os do Naruto.
- **Eventos de escolha moral sem certo e errado**: a despedida da Sakura e a oferta do Som. Cada resposta muda relíquias e o rumo da run, sem rótulo de bom ou mau.

## Conquistas cruzadas

- **Dois lados do Vale**: vencer o Vale do Fim nas duas campanhas.
- **O mesmo céu**: terminar as duas campanhas na mesma dificuldade.
- **Laço**: na campanha do Sasuke, recusar o selo amaldiçoado até o arco 3.
- **Espelho**: vencer o hospital nas duas campanhas.

## O que a arquitetura já tem e o que falta

**Já existe:**
- `CampaignDef` (perspectiva, dia ou noite, arcos);
- `JRun.campaign`;
- `storyStages()`;
- combate, loja, relíquias, eventos, minijogos e save compartilhados;
- arte por chave (`SCENE_ART`).

**Falta para jogar:**
- o protagonista por campanha (hoje `newRun` usa o Naruto);
- a relíquia inicial da campanha;
- ~~`stageTechniques` por campanha~~: resolvido na v0.66.0 com os marcos da história (`grants` em cada campanha, [roteiro.md](roteiro.md#marcos));
- o card da campanha na entrada da Jornada;
- os inimigos novos (Itachi, Naruto do Vale, Yoroi);
- os eventos;
- a árvore do Sasuke;
- o recorde por campanha no perfil.

## Shippuden

Cada parte entra como campanhas novas no mesmo `CampaignDef` (por exemplo `naruto-shippuden` e `sasuke-shippuden`), com seus arcos, sem sistema novo. Faltaria só uma regra de liberação (Shippuden depois da Parte I) e o recorde por campanha.
