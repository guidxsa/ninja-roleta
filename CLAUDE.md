# CLAUDE.md

## Visão geral

Jogo de browser, divertido e de sessões curtas, inspirado no universo ninja de Naruto. Projeto open source, sem fins lucrativos, feito por um fã. Pensado pra matar tempo no celular (ex.: dentro do ônibus).

Inspiração de UX: um site de "roleta" de Pokémon (https://pokemon-roulette.zeroxm.com.br/). A roleta visual é parte da identidade do jogo.

**O RNG é o coração do jogo**: origem do personagem, iniciativa, acerto, dano, eventos, recompensas. Tudo passa por roleta, mas os status do jogador sempre influenciam as chances (a roleta tempera, não substitui, a escolha do jogador).

## Princípios

- **Mobile-first**: controles de um toque, layout vertical, botões grandes.
- **Sessões curtas**: uma luta deve durar de 1 a 3 minutos.
- **Offline**: funcionar sem internet (PWA com service worker).
- **Campanha não persiste**: o estado da campanha vive só em memória. Atualizar a página (F5) reseta a campanha. Isso é intencional e simplifica o jogo.
- **Histórico de runs persiste** em `localStorage` (ver "Histórico de runs"), inclusive runs abandonadas e re-rolls.
- **Sem backend** por enquanto. Tudo roda no cliente.
- **Lógica separada da interface**: regras são funções puras (recebem estado, retornam novo estado), sem tocar no DOM.
- **RNG injetável**: toda função que sorteia recebe um gerador (`rng()`), pra permitir testes determinísticos com seed.
- **Tudo é dado**: origens, elementos, técnicas, vilões, eventos e recompensas ficam em arquivos de dados, não no código. Todos os números abaixo são provisórios e vivem em configuração.
- **Idioma**: português (PT-BR) por enquanto. Todos os textos visíveis ficam em arquivos de dados/strings para permitir tradução para inglês no futuro, sem texto fixo espalhado nos componentes.

## Aviso de propriedade intelectual

Naruto é propriedade intelectual de terceiros. Regras para este repositório:

- Não usar imagens, sprites, logos, músicas ou textos oficiais.
- Os nomes de personagens, clãs, linhagens e vilões neste documento são **nomes de trabalho** do planejamento. Antes de publicar, preferir nomes e descrições próprios ou apenas inspirados, trocando só os arquivos de dados.
- Deixar claro no README que é um projeto de fã, sem fins lucrativos e sem afiliação oficial.
- Se houver link de apoio/doação, mantê-lo discreto (README), não dentro do jogo.

## Mecânicas

### Status principais

| Status | Função |
|---|---|
| HP | Vida. Chegou a 0, é um fracasso (ver "Item de retorno"). |
| Taijutsu | Poder ofensivo físico. Também base da resistência a ataques de taijutsu. |
| Ninjutsu | Poder ofensivo das técnicas com chakra. Também base da resistência a ninjutsu. |
| Genjutsu | Poder ofensivo de ilusões. Também base da resistência a genjutsu. |
| Chakra | Recurso que limita o uso de técnicas. Tem um limite máximo próprio. |
| Speed | Define quem age primeiro (iniciativa probabilística). |

Futuro (fora da v1): um status de **inteligência**, que poderia influenciar provas do exame chunin.

### Origem do personagem (rolagem inicial)

A origem é definida por uma sequência de rolagens, todas visíveis na roleta:

1. **Rolagem de linhagem**: **10%** de chance de ser **especial**, 90% de ser **comum** (valores provisórios).
2. **Se comum**: rola apenas a **afinidade de chakra** (um dos 5 elementos, pesos iguais por padrão). Sem passiva, status base padrão.
3. **Se especial**: uma **segunda roleta**, com distribuição própria, sorteia a linhagem especial (ver tabela abaixo). A linhagem define modificadores de status, afinidade e uma passiva.
4. **Rolagem de jinchuuriki**: roleta **independente** das anteriores, com **5%** de chance (provisório). Pode acontecer em qualquer origem, comum ou especial. Concede um bônus próprio (ver abaixo).

#### Re-roll

- Re-rolls são **infinitos**, disponíveis apenas na tela de origem, **antes da primeira luta**.
- Cada re-roll conta como **uma campanha nova**: a tentativa anterior é registrada no histórico (ver "Histórico de runs") e uma nova run começa do zero.

#### Linhagens especiais (valores provisórios, ajustar nos testes)

| Linhagem (nome de trabalho) | Peso na 2ª roleta | Modificadores | Afinidade | Passiva |
|---|---|---|---|---|
| Uchiha | 30 | Ninjutsu +20%, Genjutsu +20%, Speed +10% | Fogo (fixa) | **Leitura de movimento**: 15% de chance de reduzir à metade o dano recebido. |
| Hyuuga | 30 | Taijutsu +30%, Speed +10%, Chakra +10% | Rolada como as comuns | **Punho preciso**: ataques de taijutsu ignoram 30% do atributo defensivo de taijutsu do vilão. |
| Prodígio do taijutsu (estilo Lee) | 25 | Taijutsu +50%, Speed +30%, HP +10%, Chakra −30%. Ninjutsu e genjutsu zerados. | Nenhuma | **Portões**: uma vez por luta, perde 25% do HP máximo (nunca abaixo de 1) e causa ×1,5 de dano de taijutsu por 3 turnos. **Não aprende técnicas de ninjutsu ou genjutsu.** |
| Uzumaki | 15 | Chakra +50%, HP +20% | Rolada como as comuns | **Vitalidade Uzumaki**: recupera 1 de chakra e 3% do HP máximo por turno. |

Notas:
- **Só o Uchiha tem afinidade fixa (fogo).** Hyuuga e Uzumaki rolam a afinidade normalmente, podendo cair em qualquer um dos 5 elementos.
- Quanto mais rara a linhagem, mais forte. O Uzumaki é a mais rara.
- A passiva do Hyuuga mudou em relação à ideia inicial ("ignora chakra do inimigo"), porque vilões têm atributos defensivos, não reserva de chakra. Fica como proposta.
- A pool de recompensas é filtrada pela origem (o prodígio do taijutsu nunca recebe técnica de ninjutsu ou genjutsu).

#### Jinchuuriki (bônus independente)

- Chakra máximo **+100%**.
- **Surto da besta**: uma vez por luta, ao chegar abaixo de 30% de HP, rola uma roleta de **controle** (60%: dano ×1,5 por 3 turnos e recupera parte do HP) ou **descontrole** (40%: dano ×2 por 3 turnos, mas perde 10% do HP máximo por turno, sem matar: mínimo de 1 HP). Proposta inicial, opcional.
- **Acumula** com linhagem especial (ex.: Uzumaki + jinchuuriki).

### Elementos

- Ciclo de cinco elementos: **fogo > vento > raio > terra > água > fogo** (cada um tem uma vantagem e uma desvantagem).
- Multiplicadores: **1,5x** na vantagem, **0,75x** na desvantagem, 1,0x neutro. Valores em arquivo de configuração.
- **Taijutsu não é elemental** (sempre neutro, inclusive o taijutsu imbuído de chakra).
- Cada técnica de ninjutsu tem um elemento. Cada vilão tem um elemento fixo.
- Elemento secundário pode ser ganho como recompensa de roleta.

### Técnicas

- Cada personagem tem **no máximo uma técnica de cada tipo**: uma de taijutsu, uma de ninjutsu e uma de genjutsu.
- As técnicas podem receber **upgrades** (via recompensa de roleta).
- Quem não tem técnica de um tipo usa a ação básica correspondente. Para taijutsu, a ação básica é o **taijutsu imbuído de chakra**, com **custo de 1 chakra**.
- Ninjutsu e genjutsu consomem chakra. Sem chakra suficiente, a técnica não pode ser usada.

### Combate

- Por turnos, com RNG em vários pontos.
- **Iniciativa**: sorteio ponderado por speed com fórmula **quadrática**: `chance_A = a² / (a² + b²)` (5 vs 3 ≈ 74%).
- **Elementos**: multiplicador de 1,5x / 0,75x aplicado ao dano.
- **Crítico**: multiplicador de **2x**.

#### Fluxo de um ataque

1. **Rolagem de acerto** (dado de acerto): resultado **erro** (dano 0), **acerto** ou **crítico**.
2. Se acertou, calcula o dano. **O dano mínimo de um ataque que acerta é 1** (um golpe pode acertar e ser praticamente inofensivo).
3. Chance base de acerto e o que a modifica (ex.: diferença de speed): **a definir**.

#### Crítico

```
chance_crítico = 5% + diferencial_de_dano_%
```

- Equivale a tirar o **maior valor** do dado de acerto (ex.: 20 em um d20 = 5%).
- `diferencial_de_dano_%` começa em 0 e cresce com recompensas/upgrades, ampliando a faixa de crítico.
- Vale para jogador e vilões (vilões têm seu próprio diferencial, definido nos dados).

#### Dano do jogador

Cada ataque tem um `tipo` (taijutsu, ninjutsu ou genjutsu). Cada vilão tem **3 atributos defensivos** (um por tipo), e o jogador tem **3 atributos ofensivos** (os próprios status de taijutsu, ninjutsu e genjutsu).

```
dif_status = atributo_ofensivo_do_jogador[tipo] − atributo_defensivo_do_vilão[tipo]
bruto      = dano_base_do_ataque_ou_técnica + dif_status
dano       = max(1, bruto × mult_elemento × mult_crítico)
```

- Nesta versão, o atributo defensivo do vilão cumpre também o papel de "resistência": não há uma subtração separada além da diferença acima. (Confirmar.)

#### Dano dos vilões

```
resistência_do_jogador[tipo] = atributo_ofensivo_do_jogador[tipo] / 2 + diferencial_de_resistência
dano = max(1, dano_base_do_vilão × mult_elemento × mult_crítico − resistência_do_jogador[tipo])
```

- `diferencial_de_resistência` **começa em 1** e pode crescer com recompensas/upgrades.
- Cada vilão tem valor base de dano e elemento próprios.

#### Genjutsu

- Aplica o efeito **Debilitado** no alvo: o alvo **fica sem ações** durante o turno.
- Duração base: **1 turno** (pode ser alterada por técnica/upgrade).
- Chance de acerto baseada em genjutsu do atacante vs. genjutsu/chakra do defensor.

### Item de retorno (revive)

- O jogador começa a run com **1 item de retorno**.
- Ao chegar a 0 de HP, se tiver um item, ele é consumido e o jogador volta à luta com **HP e chakra totalmente restaurados** (full restore).
- O item é **acumulável** e pode aparecer como recompensa nas roletas.
- Sem item e com HP 0: fim da run (game over).

### Roleta

- Visível por padrão (animação nos sorteios relevantes).
- Configuração para desligar: modo "resultado instantâneo".
- Componente reutilizável: recebe lista de fatias (rótulo, peso, efeito) e um `rng`, devolve a fatia sorteada. Usada em origem, linhagem, jinchuuriki, iniciativa, acerto/crítico, eventos pré-vilão, exame e recompensas.

## Campanha

### Ordem dos vilões (nomes de trabalho, aberta a mudanças)

1. Mizuki
2. Zabuza e Haku (duas lutas em sequência, HP carrega entre elas)
3. **Exame chunin** (evento especial, ver abaixo)
4. Gaara
5. Quarteto do Som (sequência de 4 lutas curtas, HP carrega)
6. Kabuto
7. Orochimaru (chefe final)

Cada vilão tem: elemento, status, 3 atributos defensivos (tai/nin/gen), dano base, diferencial de crítico, técnicas e uma tabela de recompensas própria. Combate em grupo fica fora do escopo inicial.

### Roleta pré-vilão (eventos)

Antes de cada vilão, uma roleta sorteia um evento. Em blocos com várias lutas (Zabuza e Haku, Quarteto do Som), gira **uma vez antes do bloco**. Não gira antes das lutas do exame chunin (sugestão, confirmar).

| Peso | Evento | Efeito |
|---|---|---|
| 10% | **Nada acontece** | Sem efeito. |
| 10% | **Ajudou uma velhinha e se atrasou** | Desvantagem de ação: o vilão age primeiro no 1º turno (sem rolar iniciativa). |
| 10% | **Ramen muito bom** | O próximo ataque de dano do jogador é **crítico garantido** (pula a rolagem de acerto). |
| 10% | **Encontro misterioso** | Gira a roleta de encontros (ver abaixo). |
| 20% | **Treino** | Sobe **1 estágio** em todos os status. |
| 20% | **Jokenpô com um companheiro de vila** | Mini-jogo (ver abaixo). |
| 20% | **Achou um item** | Gira a roleta de itens (ver abaixo). |

Os pesos são fixos nesta versão (os status não alteram as fatias).

Efeitos de "vantagem/desvantagem de ação" valem só para o **1º turno** da próxima luta.

#### Estágio de status

Unidade de melhoria usada por eventos e recompensas. Proposta: 1 estágio = +1 em Taijutsu, Ninjutsu, Genjutsu e Speed, +5 de HP máximo e +2 de chakra máximo. Valores em configuração. HP e chakra atuais sobem junto com o máximo.

Para o prodígio do taijutsu, ninjutsu e genjutsu continuam zerados (o estágio não os afeta).

#### Jokenpô

- O jogador escolhe pedra, papel ou tesoura com um toque; o companheiro escolhe por `rng` (1/3 cada).
- **Vitória**: sobe **2 estágios** em todos os status.
- **Empate**: nada acontece (sem revanche).
- **Derrota**: desvantagem de ação na próxima luta (o jogador age em segundo no 1º turno).

#### Roleta de itens

Usada no evento "Achou um item" e também pode aparecer nas recompensas.

| Item (nome de trabalho) | Efeito |
|---|---|
| **Item de retorno** | +1 revive (acumulável). |
| **Ferramenta ninja** | Dano base +1 em todos os ataques. Item **único, mas evoluível**: se sair de novo, sobe de nível (+1 a cada nível). |
| **Pergaminho de técnica** | Upgrade em uma técnica do jogador (sorteada entre as que ele tem). Sem técnicas, melhora o taijutsu imbuído. Respeita o filtro de origem. |
| **Item de resistência** | `diferencial_de_resistência` +1. |
| **Item de velocidade** | Speed +1. |

Pesos a definir (sugestão inicial: pesos iguais, item de retorno um pouco mais raro).

#### Roleta de encontros misteriosos

| Encontro | Efeito |
|---|---|
| **Akatsuki** | **Jinchuuriki**: perde 1 item de retorno. Nunca causa game over. Sem item disponível: a definir (sugestão: começa a próxima luta com metade do HP e chakra). **Não jinchuuriki**: a definir (sugestão: eles passam direto, nada acontece). |
| **Invocação** | Aprende a **invocar** (nova ação de combate, ver abaixo). Se já sabe invocar: a definir (sugestão: a invocação sobe de nível). |

Pesos a definir (sugestão: 50/50).

#### Invocação (proposta)

- Nova ação de combate, liberada pelo encontro misterioso.
- Custo alto de chakra (ex.: 5), **uma vez por luta**.
- O animal é sorteado no encontro (nomes de trabalho, um por efeito):
  - **Sapo**: um ataque de ninjutsu forte e neutro.
  - **Cobra**: aplica Debilitado por 1 turno.
  - **Lesma**: cura uma parte do HP.
- Detalhes (dano, cura) em configuração.

### Exame chunin (evento especial)

- Fica entre os vilões iniciais e os finais.
- **A priori, apenas lutas** em sequência (as provas não-combate ficam para o futuro, possivelmente ligadas a um status de inteligência).
- O desempenho acumulado nas lutas define a **recompensa final**: quanto melhor o resultado, melhor a tabela de recompensas da roleta (mais raridade, mais opções).
- **Não causa game over** e **não consome o item de retorno**: perder uma luta do exame apenas reduz o desempenho (e, portanto, a recompensa) e a campanha segue.

### Recompensas

- Após cada vilão derrotado, o jogador gira uma **roleta de recompensa**. Possíveis resultados: estágios de status, nova técnica, upgrade de técnica, elemento secundário, aumento de `diferencial_de_resistência`, aumento de `diferencial_de_dano_%`, recuperação de HP/chakra, ou um giro na **roleta de itens**.
- A pool é **filtrada pela origem** (ex.: sem técnicas de ninjutsu/genjutsu para o prodígio do taijutsu).
- Raridade (comum, raro, lendário) escala com o vilão. No exame, escala com o desempenho.

## Histórico de runs

- Simples, em `localStorage`, chave própria e versionada (ex.: `runs_v1`), separada de qualquer estado de campanha.
- Registro mínimo por run: data/hora, origem sorteada (linhagem ou afinidade, e se era jinchuuriki), resultado (vitória, derrota, **abandonada** ou **re-roll**, e até qual vilão chegou), quantidade de itens de retorno usados.
- **Runs abandonadas entram no histórico.** Como `beforeunload`/`pagehide` são pouco confiáveis no celular, a abordagem sugerida é: ao iniciar a run, gravar um registro com status "em andamento" e atualizá-lo a cada vilão; ao carregar a página, qualquer registro "em andamento" encontrado é marcado como "abandonada".
- **Re-rolls entram no histórico** com status próprio ("re-roll"), já que cada um conta como campanha nova. Como são infinitos e poluiriam a lista, a tela de histórico pode ocultá-los por padrão.
- Tela simples com a lista das últimas runs. Limitar o tamanho (ex.: últimas 100).

## Stack sugerida (a confirmar)

- Vite + TypeScript, sem framework de UI no início (ou algo leve).
- Testes de lógica com Vitest.
- PWA: `manifest.json` + service worker.
- Persistência apenas do histórico, via `localStorage`.

## Estrutura de pastas sugerida

```
/src
  /core        # regras puras: roleta, origem, iniciativa, acerto, dano, elementos, chakra, efeitos, exame
  /data        # linhagens, elementos, técnicas, vilões, eventos, recompensas, textos (JSON/TS)
  /ui          # telas, roleta, componentes
  /state       # estado da campanha (memória) e histórico de runs (localStorage)
/tests         # testes das regras do core
```

## Convenções

- Idioma do código e dos commits: _definir (PT-BR ou EN)_. Idioma do jogo: PT-BR.
- Funções do `core` não acessam DOM, `localStorage` nem `Math.random` diretamente.
- Todo número de balanceamento (multiplicadores, custos, resistências, pesos de fatias, porcentagens de linhagem e jinchuuriki) fica em arquivo de configuração.
- Valores de dano e resistência são arredondados para inteiro ao final do cálculo (sugestão: `Math.floor`).
- Antes de mudar uma fórmula, escrever ou ajustar o teste correspondente.

## Decisões em aberto

- [ ] Chance base de acerto e o que a modifica (ex.: diferença de speed).
- [ ] Custos de chakra das técnicas de ninjutsu e genjutsu (taijutsu imbuído já é 1).
- [ ] Valores finais das origens: 10% de linhagem especial, pesos da 2ª roleta, 5% de jinchuuriki, modificadores e passivas (hoje provisórios).
- [ ] Valor de 1 estágio de status.
- [ ] Akatsuki: efeito para quem não é jinchuuriki e para jinchuuriki sem item de retorno.
- [ ] Invocação: confirmar a proposta e o que acontece se já souber invocar.
- [ ] Pesos da roleta de itens e da roleta de encontros.
- [ ] Eventos pré-vilão giram antes das lutas do exame?
- [ ] Confirmar que o atributo defensivo do vilão substitui a "resistência" (sem subtração dupla).
- [ ] Estrutura exata do exame: quantas lutas e como o desempenho vira pontuação.
- [ ] Nome do projeto e licença (sugestão: MIT).

## Primeiro passo recomendado

Construir apenas o `core` (componente de roleta com RNG injetável, geração de origem em 3 rolagens, iniciativa quadrática, rolagem de acerto/crítico, pipeline de dano com elementos/resistência, gasto de chakra, item de retorno com full restore, debilitado) com testes, e uma simulação em terminal que roda lutas automáticas para ajustar o balanceamento antes de fazer qualquer interface.