# Fundamentos

> **Combate clássico (reserva)**: desde a v0.45.0, o Roleta usa o combate enxuto de [roleta/combate.md](../roleta/combate.md). Esta página segue valendo como descrição do combate clássico, guardado para a Jornada ([reserva/README.md](../reserva/README.md)); acerto, crítico, dano, resistência e dificuldade continuam valendo para todos.

Regras centrais que valem para todo combate: ficha de status, roleta, restauração, turno, reações, acerto, dano, disputa de ninjutsu, escudos, elementos, chakra e Vontade do Fogo. Os números são provisórios e vivem em `balance` / `data/*.ts`.

## Roleta e RNG

Na tela, as roletas e as dicas não mostram porcentagens nem contas: as técnicas mostram **dano base** e **precisão base**, e os efeitos são descritos em palavras. Os números ficam nestes docs e em `balance`.

- Toda decisão aleatória passa por uma **roleta**: uma lista de fatias (rótulo, peso, efeito) e um `rng()` injetável que devolve a fatia sorteada.
- A roleta é visível por padrão (animação). Configuração para desligar: modo "resultado instantâneo".
- Funções do `core` nunca chamam `Math.random`; recebem o `rng`, para testes com seed.

## Ficha de status

**Jogador e vilões usam a mesma ficha e as mesmas fórmulas.** O que muda entre eles são os números, as técnicas e as passivas.

| Status | Função |
|---|---|
| HP | Vida. Chegou a 0, é um fracasso (ver "Vontade do Fogo"). |
| Chakra | Recurso das técnicas e das reações. Tem máximo próprio. |
| Speed | Iniciativa e chance da Substituição. |
| Taijutsu | **Ataque** físico. |
| Ninjutsu | **Ataque** das técnicas com chakra e poder na disputa de ninjutsu. |
| Genjutsu | **Ataque** das ilusões (acerto, duração e, nas ilusões de dano do Uchiha, o dano). |
| Resistência física | Reduz o dano de taijutsu e de ninjutsu. |
| Resistência mental | Resiste a genjutsu e efeitos mentais (acerto, duração e dano das ilusões de dano, ver [efeitos.md](efeitos.md#efeitos-de-genjutsu)). |

- Os status de ataque não dão defesa. Bater forte e aguentar pancada são investimentos separados.
- Os valores iniciais vêm da origem ([origens.md](origens.md#status-iniciais)) e da ficha do vilão ([viloes.md](viloes.md)). Todos podem subir na run ([progressao.md](progressao.md)).

### Resistência passiva e ativa

A resistência total (física ou mental) é usada numa fração que depende da situação de quem recebe o golpe:

| Situação | Fração da resistência | Custo |
|---|---|---|
| **Passiva**: não reagiu ou não pode reagir (Aprisionado, Sono, Paralisia, Possessão, Substituição que falhou, perdeu uma disputa) | 40% | — |
| **Resistir** (reação) | 70% | Grátis, não gasta o turno |
| **Postura defensiva** (ação de turno) | 100% até o próximo turno de quem a usou | Gasta o turno |

Configuração: `combat.resistance: { passive: 0.4, resist: 0.7, stance: 1.0 }`.


## Restauração

- **A luta não começa restaurada.** HP e chakra seguem de uma luta para a outra, inclusive dentro dos blocos (Haku e Zabuza, Quarteto do Som).
- O vilão sempre começa a luta com HP e chakra cheios.
- **Cada vitória recupera 25%** do HP e do chakra máximos (sem passar do máximo), inclusive as vitórias do exame.
- **Restauram tudo** (HP, chakra e efeitos negativos):
  - **subir de nível**;
  - **o fim do exame chunin**, qualquer que seja o resultado (ver [campanha.md](../roleta/campanha.md#exame-chunin));
  - a Vontade do Fogo (ver abaixo).
- **O fim de cada luta limpa os efeitos negativos** (queimadura, veneno, sangramento etc.), mas não devolve HP nem chakra.
- Dentro da luta, só restauram parcialmente: técnicas de cura, consumíveis, passivas de regeneração, invocações e Concentrar chakra.
- Penalidades de "começar a próxima luta com X" (ex.: Akatsuki) valem sobre o HP e o chakra que o jogador tem.
- Configuração: `combat: { restoreOnStart: false, recoverAfterWinPct: 0.25 }`.

## Turno e ações

- **Iniciativa**: rolada uma vez no início da luta; define a ordem da luta toda.
  ```
  chance_A = speedA² / (speedA² + speedB²)
  ```
  Vantagem ou desvantagem de ação (eventos) substitui essa roleta na próxima luta contra vilão.
- Cada rodada tem **uma ação de cada lado**, na ordem da iniciativa.
- Técnicas com **prioridade** agem antes naquela rodada, mesmo sem a iniciativa. Dois lados com prioridade: vale a iniciativa.
- **Corpo Cintilante** (premium do guru, [tecnicas.md](tecnicas.md#premium-guru)): o jogador age primeiro na 1ª rodada, sem mudar a iniciativa sorteada.
- Na sua ação, o personagem escolhe:
  - **Técnica** (de uma das categorias do skill set, ver [tecnicas.md](tecnicas.md)).
  - **Ativas de linhagem** (Portões, Expansão, Pílulas do clã, Sharingan, Cópia, Byakugan, Esforço, Fera de quatro patas, Praga, Transmissão mental, Selamento) são todas **escolhas grátis**: feitas junto com a ação, sem gastar o turno, desde que haja chakra para a ativa, a ação e as outras ativas da rodada. Foco e Gênio também são grátis. O que a ativa liga já vale para a ação da mesma rodada: com o Sharingan aceso agora, dá para usar o Tsukuyomi ou a Cópia nesse turno.
  - **Ações universais**: Concentrar chakra, Postura defensiva, Usar item (ver [tecnicas.md](tecnicas.md#ações-universais)).

## Reações

Quem recebe um ataque escolhe uma **reação** antes da rolagem. Vale igual para jogador e vilão.

| Reação | Contra | Custo | Efeito |
|---|---|---|---|
| **Resistir** | Qualquer ataque | Grátis | Usa 70% da resistência. É a reação padrão. |
| **Disputa de ninjutsu** | Ninjutsu | Chakra da técnica + **a próxima ação** | Lança um ninjutsu contra o outro (ver "Disputa de ninjutsu"). |
| **Substituição** | Taijutsu ou ninjutsu | 2 de chakra + 1 uso da luta (**não gasta ação**) | Roleta de esquiva (ver abaixo). |

As barreiras não são reação: são ações de turno que erguem um **escudo** (ver "Escudos").

- **Contra genjutsu, só Resistir** (com a resistência mental).
- **A próxima ação**: se quem reage ainda não agiu na rodada, perde a ação desta rodada. Se já agiu, perde a primeira ação da rodada seguinte. Sem ação livre pela frente (já gasta por outra reação), só pode Resistir ou usar a Substituição.
- **Sem reação**: quem está Aprisionado, Dormindo, Paralisado ou Possuído não reage e recebe o golpe com a resistência passiva (e o dano extra de quem perdeu a vez, ver [efeitos.md](efeitos.md#controles)).
- Em **Postura defensiva**, Resistir já usa 100%; as outras reações continuam disponíveis.
- Técnica de vários golpes (e os Espelhos do Haku) recebe **uma reação** para a técnica inteira.
- **Golpe carregado**: pode receber qualquer reação. Na disputa, o poder dele já conta o ×2. Um escudo erguido no aviso também segura o golpe.
- Na tela: quando o jogador é atacado, aparece o painel de reação com **Resistir** em destaque; só pede um toque a mais quando há Disputa ou Substituição disponíveis.
- O vilão escolhe a reação por pesos próprios (`reactions` na ficha, ver [viloes.md](viloes.md)), só entre as que pode pagar. Se ele gasta a próxima ação reagindo, a intenção sorteada para ela é descartada.

### Substituição

```
chance = clamp(50% + (speed_de_quem_reage − speed_do_atacante) × 3%, 25%, 85%)
```

- **Sucesso**: esquiva do ataque inteiro.
- **Falha**: recebe o golpe com a resistência **passiva**.
- **Não gasta ação**: quem se substitui age normalmente na rodada (ou na seguinte, se já agiu).
- **Chakra reservado**: reagir no turno do vilão (Substituição, Cópia) não pode gastar o chakra da ação que o jogador escolheu e ainda vai fazer. O chakra nunca fica negativo, e técnicas de custo 0 (como o Taijutsu básico) estão sempre disponíveis.
- **Usos por luta**: 2 (o premium "Mestre da Substituição" do guru dá +1, ver [campanha.md](../roleta/campanha.md#guru)).
- O Gênio do Nara vale na roleta da Substituição dele (gira duas vezes, fica com a melhor).

Configuração: `substitution: { chakraCost: 2, baseChance: 0.5, perSpeed: 0.03, min: 0.25, max: 0.85, usesPerFight: 2 }`.

## Rolagem de acerto

Toda técnica de dano que não passou por disputa rola uma roleta de três fatias: **crítico**, **acerto** e **erro**.

```
chance_acerto  = clamp(precisão_da_técnica + bônus_de_acerto − penalidades, 5%, 100%)
chance_crítico = min(50%, 5% + diferencial_de_dano_% + bônus_de_crítico_da_técnica, chance_acerto)

r = rng() × 100
r < chance_crítico  → crítico
r < chance_acerto   → acerto
senão               → erro (dano 0)
```

- Precisão padrão de uma técnica: **85%**. Cada técnica tem a sua (ver a ficha em [tecnicas.md](tecnicas.md)).
- Penalidades comuns: Atordoado −10, passiva Yamanaka −10 nos ataques do vilão. A névoa do Zabuza multiplica a chance de **erro** por 1,5.
- Técnicas com vários golpes rolam acerto e crítico **em cada golpe**: um golpe que erra não impede os seguintes. A reação do alvo acontece uma vez só, antes dos golpes. O que vale "por ataque que acerta" (sapo, cão do Inuzuka) conta se ao menos um golpe acertou. Vale para o jogador, os clones e os vilões (Espelhos do Haku).
- Genjutsu usa uma rolagem própria (ver [efeitos.md](efeitos.md#efeitos-de-genjutsu)) e não tem crítico.
- O **Foco** (guru) soma +25% à chance de crítico do próximo ataque, ainda limitada a 50% e à chance de acerto.
- O **Gênio** (Nara) gira a roleta duas vezes e fica com o melhor resultado (crítico > acerto > erro).
- O crítico garantido (Mizuki no hardcore) pula a roleta: o golpe é crítico.

## Dano

Uma fórmula só, para os dois lados. Cada técnica de dano tem um `tipo` (taijutsu ou ninjutsu); genjutsu não causa dano.

```
resistência_usada = resistência_física_do_alvo × fração_da_situação     (40%, 70% ou 100%)
defesa            = resistência_usada × (1 − penetração)
bruto             = dano_base_da_técnica + bônus_de_dano + ataque_do_atacante[tipo] − defesa
dano              = max(1, bruto × mult_crítico × mult_elemento × outros_mult)
```

- `bônus_de_dano`: ferramenta ninja e similares.
- `penetração`: da técnica e da passiva Hyuuga. Somam, com teto de 60%.
- `mult_elemento`: só quando há um encontro de elementos (ver "Elementos"); senão ×1.
- `outros_mult`: portões, manto, expansão, pavor, resultado da disputa, alvo que perdeu a vez (×1,25) etc.
- Técnicas de vários golpes descontam a defesa em cada golpe.
- Se o alvo tem um **escudo**, o dano passa por ele antes do HP (ver "Escudos").

### Multiplicadores

| Multiplicador | Valor |
|---|---|
| Crítico | ×2 |
| Elemento em vantagem (em um encontro) | ×1,5 |
| Elemento em desvantagem (em um encontro) | ×0,75 |
| Sem encontro de elementos | ×1 |

Valores arredondados para baixo (`Math.floor`) no fim do cálculo. Um ataque que acerta causa no mínimo **1** de dano.

## Disputa de ninjutsu

Acontece quando um ninjutsu é respondido com outro ninjutsu (reação Disputa).

```
poder = dano_base × golpes + ninjutsu × 0,5
poder × 1,5 para quem tem a vantagem elemental
```

- **Só a vantagem multiplica**: a desvantagem não reduz o poder de quem a tem. Assim a vantagem pesa muito, mas um jutsu básico com vantagem não anula um grande.
- Rasengan: +25% de poder. Golpe carregado: ×2.

Os dois poderes vão para uma roleta de três fatias, no espírito da iniciativa:

```
peso_atacante = poder_atacante²
peso_defensor = poder_defensor²
peso_anular   = 0,5 × poder_atacante × poder_defensor
```

| Resultado | O que acontece |
|---|---|
| **Anulam** | Os dois jutsus se desfazem. Ninguém leva dano; os dois gastaram o chakra. |
| **Um supera** | O jutsu vencedor atinge o outro lado com `dano × max(25%, 1 − poder_perdedor / poder_vencedor)`, contra a resistência **passiva** de quem perdeu. |
| **Esmagadora** (o vencedor tem poder ≥ 2× o do outro) | O dano passa inteiro. |

- Se o **defensor** vence, é um contra-ataque: o jutsu dele atinge o atacante.
- O Gênio do Nara vale na roleta da disputa (fica com o resultado melhor para ele).
- O dano que passa pela disputa não rola acerto nem crítico. Os efeitos de chance no acerto (queimar, atordoar) rolam normalmente.
- Vencedor com **vários golpes** bate **cada golpe** com a parte que passa (o status de ataque e a resistência contam em cada golpe), não um golpe só.
- Na tela: um cabo de guerra com a cor de cada elemento e a fatia de anulação no meio.

Exemplo (Ninjutsu 10 dos dois lados): Projétil d'Água I (11 + 5 = 16, ×1,5 por vantagem = **24**) contra Inferno da Fênix III (34 + 5 = **39**). Água vence em ~22%, anulam em ~18%, fogo vence em ~59%. A vantagem elemental pesa, mas não transforma um jutsu básico num grande.

Configuração: `clash: { statFactor: 0.5, cancelWeight: 0.5, minPassThrough: 0.25, crushRatio: 2 }`.

## Escudos

Barreira é uma **ação de turno** (gasta o turno e o chakra): ergue um **escudo** com os pontos da técnica, que dura **3 rodadas** a partir da seguinte ou até quebrar. Vale igual para jogador e vilão.

```
dano_no_escudo = dano_do_golpe × encontro_de_elementos(golpe, escudo)
absorvido      = min(pontos, dano_no_escudo)
dano_no_HP     = (dano_no_escudo − absorvido) ÷ encontro
```

- Absorve **taijutsu e ninjutsu** (cada golpe de uma técnica de vários golpes, um por vez), inclusive o golpe carregado e o dano da disputa. Genjutsu, veneno, queimadura e o Selo explosivo passam direto.
- O elemento do golpe contra o do escudo multiplica o dano **no escudo** (vantagem ×1,5, desvantagem ×0,75; raio contra terra ×2). Taijutsu é neutro.
- Com um escudo de pé, não dá para erguer outro; o vilão só sorteia a barreira sem escudo ativo.
- Especiais (ver [tecnicas.md](tecnicas.md#barreiras)): Rotação devolve 50% do bloqueado; Muralha de Chamas pode queimar quem bate com taijutsu; Parede d'Água que absorve fogo apaga a queimadura; Escudo de Vento aguenta mais contra vários golpes.

Configuração: `barrier: { turns: 3 }`.

### Barreiras no Roleta e na Jornada

Desde a v0.77.0 a mesma regra vale nos dois modos (`src/core/barriers.ts`), com estas diferenças do clássico:

- Os pontos são uma **fração do HP máximo** de quem ergue (campo da técnica), para acompanhar o crescimento da ficha. Os vilões do Roleta usam os pontos fixos da ficha deles.
- Dura **3 turnos de quem recebe** depois daquele em que foi erguida. Uma de pé por vez: no Roleta, a técnica fica bloqueada enquanto houver uma; na Jornada, erguer de novo troca a que estava.
- O golpe passa primeiro pela barreira e depois pelo escudo comum (Escudo de areia, relíquias, Kyuubi).
- Não há disputa nem estados elementais nos modos: **o escudo é o único lugar onde o elemento pesa**.

| Barreira | Pontos (do HP máximo) | Chakra (Roleta / Jornada) | Especial |
|---|---|---|---|
| Muralha de Terra | 28% | 6 / 5 | O escudo mais forte; raio fura (×2 no escudo) |
| Parede d'Água | 24% | 6 / 5 | Se absorver fogo, apaga a queimadura de quem está atrás dela |
| Muralha de Chamas | 20% | 5 / 4 | Quem bate nela com taijutsu tem 30% de chance de queimar |
| Escudo de Vento | 20% | 5 / 4 | Técnicas de vários golpes gastam 25% a menos |

Raio não tem barreira. Quem tem: no Roleta, as origens de ninjutsu elemental, a do próprio elemento; Gaara (Escudo de areia, 30) e Jirobo (Muralha de Terra, 28) voltam a erguer a deles. Na Jornada, o Comum aprende a do elemento no talento Poder elemental; o Escudo de areia (Gaara) e o Gamatatsu viram barreiras do elemento deles; o Jirobo ganha a Muralha de Terra. Especiais em `balance.barrierSpecials` (proposta).

## Elementos

**Não existe tabela de tipos contra o personagem.** O elemento do vilão é o tema dele e define as técnicas que usa. Um golpe direto em quem não tem um estado elemental ativo é neutro. Vale também no Roleta e na Jornada (v0.77.0; a Jornada tinha ×1,25 e ×0,8 contra o elemento do alvo): lá, o único encontro é a [barreira](#barreiras-no-roleta-e-na-jornada).

O elemento só pesa quando **dois elementos se encontram**:

- numa **disputa** (só a vantagem multiplica o poder);
- contra um **escudo** (dano no escudo × vantagem ou desvantagem);
- contra um **estado elemental** ativo no alvo, como Armadura de Raio ou Armadura de Areia (dano × vantagem). Ver [tecnicas.md](tecnicas.md#estados-elementais).

Ciclo de vantagem: **fogo > vento > raio > terra > água > fogo**. Taijutsu e técnicas sem elemento são neutros.

### Interações especiais

| Encontro | Efeito |
|---|---|
| Raio contra escudo ou estado de **terra** | Perfura: ×2 no lugar de ×1,5. |
| Fogo contra **vento** | O fogo absorve o vento: se vencer a disputa, +25% de dano. |
| Água contra **fogo** | Se vencer ou anular a disputa (ou se a Parede d'Água absorver fogo), apaga a queimadura de quem usou a água. |
| Vento contra **Armadura de Raio** | Vantagem e ignora o bônus de resistência da armadura. |

Futuro: estado **Molhado** (acertos de água) que deixa o alvo vulnerável a raio.

- Técnicas elementais só podem ser aprendidas nos elementos do jogador, até o potencial elemental da origem ([origens.md](origens.md#natureza-e-ninjutsu-elemental)).
- Os críticos elementais continuam aplicando os efeitos de [efeitos.md](efeitos.md) (queimadura, paralisia, atordoamento).
- Na tela, todo ataque e toda intenção do vilão mostram o **ícone e a cor do elemento**.

## Natureza

Regra comum aos três modos (v0.59.0, `src/core/nature.ts`). Todo ninja tem **uma natureza**: um dos 5 elementos ou uma Kekkei Genkai. A Kekkei Genkai **é** uma natureza (não se soma a um elemento). Só Comum (com proficiência), Uzumaki, Senju e Uchiha usam ninjutsu elemental; nas outras origens a natureza é sorteada em silêncio e só aparece na ficha ([origens.md](origens.md#natureza-e-ninjutsu-elemental)). **Exceção:** o Prodígio do taijutsu não tem natureza nenhuma, nem a silenciosa, e fica fora da vantagem elemental: no Caminho Ninja desde a v0.87.1 e no Roleta (e no sorteio de origem) desde a v0.92.0, pedidos do usuário.

## Kekkei genkai

Dois elementos-pai fundidos numa natureza nova. No encontro de elementos, conta como o **pai mais vantajoso** (a mesma função no clássico, no Roleta e na Jornada).

- **Jogador**: só o **Mokuton do Senju** (3% dos Senju, depois da roleta de natureza; [origens.md](origens.md#sorteio)).
- **Vilões**: **Gelo** é a natureza do Haku e **Areia** a do Gaara, em todos os modos. A Areia dá o escudo de início de luta também no Roleta (10% do HP).
- Lava, Tempestade, Vapor e Explosão ficam guardadas nos dados, sem sorteio (v0.59.0).

| Kekkei genkai | Pais | Quem tem | Identidade |
|---|---|---|---|
| Gelo | Água + vento | Haku | Precisão e controle: congela |
| Areia | Terra + vento | Gaara | Defesa: escudo no início de cada luta; prende e esmaga |
| Madeira | Terra + água | Senju (3%) | Prende, cura com o dano e desfaz o manto de chakra |
| Lava, Tempestade, Vapor, Explosão | — | ninguém (guardadas) | — |

- Quem tem a kekkei genkai começa com o nível I da linha dela (e a prisão, na Areia e na Madeira); a técnica do nível 4 entra sozinha. As fichas estão em [tecnicas.md](tecnicas.md#kekkei-genkai).
- As técnicas de kekkei genkai não têm elemento próprio: **no encontro de elementos** (disputa, escudo, estado) contam como o **pai mais vantajoso** naquele encontro.
- **Areia**: no início de cada luta, um escudo de **10% do HP máximo**.
- **Madeira**: cada golpe cura **50% do dano causado**; um acerto num vilão com **manto de chakra** (Gaara) desfaz o manto.

## Chakra

- Ninjutsu, genjutsu, ativas, reações (menos Resistir) e algumas técnicas de taijutsu custam chakra. Sem chakra suficiente, a ação fica indisponível.
- Taijutsu básico é grátis.
- **Regeneração passiva**: no início de cada rodada, todos (jogador e vilão) recuperam **5% do chakra máximo** (para baixo, **mínimo 1**), sem passar do máximo. A Vitalidade do Uzumaki soma por cima. A manutenção dos dōjutsu (Sharingan e Byakugan) é 2 por rodada, para não se pagar sozinha com a regeneração.
- **Concentrar chakra** (ação universal) recupera **15% do chakra máximo** (arredondado para baixo, mínimo 1) gastando o turno.
- Como a luta não começa restaurada, o chakra que sobra de uma luta é o que se tem na próxima.
- Vilões também têm reserva de chakra, concentram chakra com a mesma fórmula e sorteiam a técnica e a reação só entre as que podem pagar (ver [viloes.md](viloes.md)).

## Efeitos (Roleta e Jornada)

Desde a v0.77.0 os dois modos usam os mesmos efeitos e os mesmos números (`balance.effects`, `src/core/effects.ts`). A duração conta os turnos de quem sofre e desconta no fim de cada turno dele (agindo ou não). O combate clássico segue com os efeitos de [efeitos.md](efeitos.md).

| Efeito | Duração | O que faz |
|---|---|---|
| Atordoar | 2 (mínimo) | Perde a vez. Ao sair, fica **firme**: nenhum atordoamento pega até o fim do próximo turno em que age |
| Bloqueio de chakra | 2 (mínimo) | Só usa taijutsu. Sem trava |
| Queimar | 2 | Perde 5% do HP máximo no começo do turno |
| Veneno | 3 | Perde 5% do HP máximo no começo do turno |
| Medo | 2 | −25% de dano e −15% de acerto. Uchiha e jinchuuriki são imunes |

- **Controle** (atordoar e bloqueio de chakra) dura no mínimo 2 turnos, de qualquer lutador, mesmo que a técnica peça menos (`minControlTurns`).
- Repetir um efeito que já está no alvo renova a duração (fica a maior).
- Na Jornada, Kai, Palma mística e Grito de guerra tiram atordoar, bloqueio de chakra e Medo; no Roleta, o Kit médico limpa todos.
- Antes da v0.77.0: o Roleta tinha Atordoar de 1 turno, Veneno de 4% por 3 e não tinha bloqueio nem trava; a Jornada tinha Veneno de 6% por 2 e não tinha Medo.

## Clones

Regra comum ao Roleta e à Jornada (`src/core/clones.ts`, tipos desde a v0.77.0; números em `balance.clones`, da especificação de balanceamento dos clones de 15/11/2026). Cada clone resolve um problema diferente: nenhum é a versão mais forte do anterior. O nível de especialização orienta a raridade e o custo, não é escala de poder.

- Criar um clone é uma técnica sem dano e sem roleta de acerto. Gasta o turno (o Kage Bunshin da Jornada é ativa).
- Cada golpe de alvo único pode cair no clone em vez do ninja: **uma rolagem por golpe**, com a chance do tipo, por mais clones que haja. Técnicas em área, queimar e veneno passam direto.
- **Golpe junto**: quando o dono acerta pelo menos um golpe de uma técnica de dano de alvo único, sai uma fração do dano de um golpe, sem roleta e sem crítico, que passa pela barreira do alvo.
- O atordoar do Raiton respeita a trava (quem acabou de sair de um atordoamento fica firme).

| Nível | Técnica | Identidade | Segura | Aguenta | Golpe junto | Ao se desfazer | Chakra (Roleta / Jornada) |
|---|---|---|---|---|---|---|---|
| I | Bunshin no Jutsu | Enganação: ilusão, sem dano | 50% | 1 | — | — | 5 / 3 |
| II | Mizu Bunshin | Eficiência: barato | 50% | 1 | 25% por clone | — | 6 / 4 |
| III | Doton Kage Bunshin | Resistência | 65% | **2** | — | — | 6 / 4 |
| III | Suna Bunshin | Controle | 50% | 1 | — | 25% de bloqueio de chakra em quem bateu | 6 / 4 |
| IV | Raiton Kage Bunshin | Contra-ataque | 50% | 1 | — | Descarga: 5% do HP máximo de quem bateu e 25% de atordoar | 7 / 5 |
| V | Kage Bunshin no Jutsu | Autonomia e multiplicação | 50% | 1 | Roleta: 35%, uma vez por técnica. Jornada: só pelas técnicas com golpe por clone (Rendan, Rasengan) | — | 8 / 5 (ativa) |
| VI | Mokuton Bunshin | Versatilidade e estratégia | 65% | **2** | 25% por clone | Enquanto existe: +10% de acerto do dono (uma vez, com qualquer número de clones) e, no Roleta, mostra a próxima ação do vilão | 8 / 6 |
| VII | Tajuu Kage Bunshin (Mil Clones) | Superioridade numérica | 50% | 1 | como o Kage: nada passivo na Jornada | — | — / 12 (ataque em área que cria 3 clones) |

**Roleta**: no máximo 1 clone, que começa cada luta zerado; não dá para recriar enquanto ele está de pé. Só o jogador tem clone. O clone não tem progressão própria (o golpe junto cresce com o dano da técnica usada).

**Jornada**: até 5 clones (mais com talentos e relíquias), todos do mesmo tipo (o último criado manda); dá para criar mais até o limite.
- **Teto do golpe junto**: a soma de todos os clones não passa de **70% de um golpe** por técnica (`clones.strikeCap`). Mizu e Mokuton: 1 clone dá 25%, 2 dão 50%, 3 ou mais ficam em 70%.
- **Exército de sombras** (talento final dos Clones): o golpe sempre vai para um clone, mas cada golpe gasta um; acabaram os clones, o dono volta a apanhar.
- **Um contra-ataque por golpe**: o contra-ataque do talento ou da relíquia e a descarga do clone de raio não somam; vale o maior. O contra-ataque é perda de HP direta, então não aciona clones nem barreiras de novo.
- Talentos e relíquias de clone (quantos começam, quantos cada técnica cria, limite, dano por clone) valem para qualquer tipo.

**Quem tem**, no lugar do Bunshin:
- Kage Bunshin: Uzumaki e jinchuuriki (Roleta); Naruto (Jornada, com o Mil Clones depois do Mizuki).
- O clone da natureza em quem tem ninjutsu elemental: água, Mizu; terra, Doton; raio, Raiton; madeira, Mokuton; areia, Suna. Fogo, vento e natureza silenciosa ficam com o Bunshin.
- **Kekkei Genkai** não dá clone elemental sozinha: gelo, lava, tempestade, vapor e explosão ficam com o Bunshin. O Mokuton é raro (só o Senju que tira a madeira, no Roleta; ninguém na Jornada) e o Suna fica com quem domina a areia (os dois Gaara).
- Na Jornada a troca é feita na luta (o moveset salvo continua com o Bunshin): o Iruka luta com o Mizu, o Kakashi com o Raiton, a Sakura e a Tsunade com o Doton, o Gaara aliado com o Suna. Inimigos: Zabuza (Mizu), Kakashi (Raiton), Gaara (Suna), Jirobo (Doton).

## Portões

Regra comum ao Roleta e à Jornada (v0.59.0, `src/core/gates.ts`):

- **abrir** custa chakra (Roleta: 4; Jornada: 3 por portão aberto a mais, descer é grátis);
- **manter** custa, a cada rodada, **chakra e HP** (custo misto, v0.79.0, proposta):
  - chakra: metade da conta antiga, `ceil(2 × 1,5^(n−1) × 0,5)` → **1, 2, 3, 4, 6, 8...** (na Jornada, × 1 + 0,25 × (nível − 1) antes da metade);
  - HP: **1% do HP máximo por nível** do portão aberto (o 5º portão custa 5% por rodada), no mínimo 1;
  - o HP nunca chega a 0 pelos Portões: sem chakra, ou sem HP para pagar e ficar com 1, fecham sozinhos;
- **sem limite de rodadas**; até a v0.78.0 a manutenção era só em chakra (2, 3, 5, 7, 11, 16...);
- abrir e fechar não gastam a vez. No Roleta dá para reabrir na mesma luta; na Jornada, fechar põe 3 turnos de espera.

O combate clássico (reserva) mantém os Portões antigos.

## Vontade do Fogo (revive)

- Ao chegar a 0 de HP com uma Vontade do Fogo, ela é consumida e o jogador volta à luta com HP e chakra cheios e sem efeitos negativos.
- Na Jornada ela funciona diferente: recomeça a luta perdida, e vem por dificuldade (Fácil 2, Médio 1, Difícil 1, Hardcore nenhuma; v0.77.0) ([jornada/run.md](../jornada/run.md#dificuldade)).
- Sem nenhuma: fim da run. No exame chunin a derrota não consome o item nem encerra a run (ver [campanha.md](../roleta/campanha.md#exame-chunin)).
- Como conseguir: [itens.md](../roleta/itens.md).
