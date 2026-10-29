# Fundamentos

Regras centrais que valem para todo combate: ficha de status, roleta, restauração, turno, reações, acerto, dano, disputa de ninjutsu, escudos, elementos, chakra e Vontade do Fogo. Os números são provisórios e vivem em `balance` / `data/*.ts`.

## Roleta e RNG

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

O Corpo de ferro (prodígio do taijutsu) faz Resistir usar 100% da física, mas só contra taijutsu ([origens.md](origens.md#prodígio-do-taijutsu-estilo-lee)).

## Restauração

- **A luta não começa restaurada.** HP e chakra seguem de uma luta para a outra, inclusive dentro dos blocos (Haku e Zabuza, Quarteto do Som).
- O vilão sempre começa a luta com HP e chakra cheios.
- **Cada vitória recupera 25%** do HP e do chakra máximos (sem passar do máximo), inclusive as vitórias do exame.
- **Restauram tudo** (HP, chakra e efeitos negativos):
  - **subir de nível**;
  - **o fim do exame chunin**, qualquer que seja o resultado (ver [campanha.md](campanha.md#exame-chunin));
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
- Na sua ação, o personagem escolhe:
  - **Técnica** (de uma das categorias do skill set, ver [tecnicas.md](tecnicas.md)).
  - **Ativas de linhagem** (Portões, Expansão, Pílulas do clã, Sharingan, Cópia, Byakugan, Esforço, Fera de quatro patas, Devorar, Transmissão mental, Selamento, Sombra costurada) são todas **escolhas grátis**: feitas junto com a ação, sem gastar o turno, desde que haja chakra para a ativa, a ação e as outras ativas da rodada. Foco e Gênio também são grátis.
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
- **Usos por luta**: 2 (o premium "Mestre da Substituição" do guru dá +1, ver [campanha.md](campanha.md#guru)).
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
- Técnicas com vários golpes rolam acerto e crítico **uma vez**, no começo, e o resultado vale para todos os golpes: erra tudo, acerta tudo ou critica tudo.
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
- `penetração`: da técnica, do sapo, da passiva Hyuuga. Somam, com teto de 60%.
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

## Elementos

**Não existe tabela de tipos contra o personagem.** O elemento do vilão é o tema dele e define as técnicas que usa. Um golpe direto em quem não tem um estado elemental ativo é neutro.

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

- Técnicas elementais só podem ser aprendidas no próprio elemento (afinidade ou elemento secundário).
- Os críticos elementais continuam aplicando os efeitos de [efeitos.md](efeitos.md) (queimadura, paralisia, atordoamento).
- Na tela, todo ataque e toda intenção do vilão mostram o **ícone e a cor do elemento**.

## Chakra

- Ninjutsu, genjutsu, ativas, reações (menos Resistir) e algumas técnicas de taijutsu custam chakra. Sem chakra suficiente, a ação fica indisponível.
- Taijutsu básico é grátis.
- **Concentrar chakra** (ação universal) recupera **15% do chakra máximo** (arredondado para baixo, mínimo 1) gastando o turno.
- Como a luta não começa restaurada, o chakra que sobra de uma luta é o que se tem na próxima.
- Vilões também têm reserva de chakra, concentram chakra com a mesma fórmula e sorteiam a técnica e a reação só entre as que podem pagar (ver [viloes.md](viloes.md)).

## Vontade do Fogo (revive)

- Ao chegar a 0 de HP com uma Vontade do Fogo, ela é consumida e o jogador volta à luta com HP e chakra cheios e sem efeitos negativos.
- Sem nenhuma: fim da run. No exame chunin a derrota não consome o item nem encerra a run (ver [campanha.md](campanha.md#exame-chunin)).
- Como conseguir: [itens.md](itens.md).
