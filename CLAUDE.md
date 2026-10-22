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

1. **Rolagem de linhagem**: **20%** de chance de ser **especial**, 80% de ser **comum** (valores provisórios).
2. **Se comum**: rola apenas a **afinidade de chakra** (um dos 5 elementos, pesos iguais por padrão). Sem passiva, status base padrão. Começa com **taijutsu básico (e o fortalecido) + ninjutsu básico do próprio elemento**; sem genjutsu.
3. **Se especial**: uma **segunda roleta**, com distribuição própria, sorteia a linhagem especial (ver tabela abaixo). A linhagem define modificadores de status, afinidade e uma passiva.
4. **Rolagem de jinchuuriki**: roleta **independente** das anteriores, com **10%** de chance (provisório). Pode acontecer em qualquer origem, comum ou especial. Concede um bônus próprio (ver abaixo).

#### Re-roll

- Re-rolls são **infinitos**, disponíveis apenas na tela de origem, **antes da primeira luta**.
- Cada re-roll conta como **uma campanha nova**: a tentativa anterior é registrada no histórico (ver "Histórico de runs") e uma nova run começa do zero.

#### Linhagens especiais (valores provisórios, ajustar nos testes)

Os status iniciais são redistribuídos pela linhagem (modificadores sobre o status base 10 / HP 100).

| Linhagem (nome de trabalho) | Peso na 2ª roleta | Modificadores | Afinidade | Passiva / dōjutsu |
|---|---|---|---|---|
| Uchiha | 30 | Genjutsu +50%, Ninjutsu +30%, Chakra +80%, Speed +10%, **Taijutsu −10%** (o ponto mais fraco) | Fogo (fixa) | **Olhos treinados** (passiva): +6 no genjutsu contra ilusões do vilão. **Sharingan** (ativo, ver abaixo). Único com **genjutsu inicial**. |
| Hyuuga | 30 | Taijutsu +30%, Speed +10%, Chakra +10%, **Ninjutsu −30%** | Rolada como as comuns | **Punho preciso** (passiva): taijutsu ignora 30% da defesa de taijutsu do vilão. **Byakugan** (ativo) e o **golpe inibidor**. |
| Prodígio do taijutsu (estilo Lee) | 25 | Taijutsu +50%, Speed +30%, HP +10%, Chakra −30%. Ninjutsu e genjutsu zerados. | Nenhuma | **Portões**: uma vez por luta, perde 25% do HP máximo (nunca abaixo de 1) e causa ×1,5 de dano de taijutsu por 3 turnos (ataca com o taijutsu grátis mais forte). **Não aprende técnicas de ninjutsu ou genjutsu.** |
| Uzumaki | 15 | HP +30%, Chakra +60%, Ninjutsu +10% | Rolada como as comuns | **Vitalidade Uzumaki**: recupera 1 de chakra e 3% do HP máximo por turno. |

Notas:
- **Só o Uchiha tem afinidade fixa (fogo).** Hyuuga e Uzumaki rolam a afinidade normalmente, podendo cair em qualquer um dos 5 elementos.
- Quanto mais rara a linhagem, mais forte. O Uzumaki é a mais rara.
- **Só o Uchiha começa com genjutsu.** Os outros (menos o prodígio) liberam a categoria ao aprender um genjutsu como recompensa.
- A pool de recompensas é filtrada pela origem (o prodígio do taijutsu nunca recebe técnica de ninjutsu ou genjutsu).

#### Dōjutsu (técnicas oculares ativáveis)

- Ação de combate própria: **ativar gasta o turno** e chakra; ativo, custa chakra **por rodada** (manutenção) e **desliga sozinho** quando falta chakra para pagar. Valores em `balance.dojutsu`.
- **Sharingan (Uchiha)**: ativar 4, manutenção 1. Começa com 1 tomoe e **evolui com o nível** (2 tomoe no nível 4, 3 no nível 7). Ativo: tai/nin/gen +3/+5/+7, speed +1/+2/+3, genjutsu com +10/15/20% de acerto e +3/+6/+9 de poder de aprisionamento, e **leitura de movimento**: 25/30/35% de chance de reduzir à metade o dano recebido.
- **Byakugan (Hyuuga)**: ativar 3, manutenção 1. Ativo: **os golpes (taijutsu e ninjutsu) não erram** (o crítico continua rolando), taijutsu ×1,1 e libera o **golpe inibidor** (taijutsu grátis, dano base 6, drena 6 de chakra do vilão). Só com o Byakugan ativo.

#### Jinchuuriki (bônus independente)

- Chakra máximo **+100%**.
- **Surto da besta**: uma vez por luta, ao chegar abaixo de 30% de HP, rola uma roleta de **controle** (60%: dano ×1,5 por 3 turnos e recupera parte do HP) ou **descontrole** (40%: dano ×2 por 3 turnos, mas perde 10% do HP máximo por turno, sem matar: mínimo de 1 HP). Proposta inicial, opcional.
- **Acumula** com linhagem especial (ex.: Uzumaki + jinchuuriki).

### Elementos

- Ciclo de cinco elementos: **fogo > vento > raio > terra > água > fogo** (cada um tem uma vantagem e uma desvantagem).
- Multiplicadores: **1,5x** na vantagem, **0,75x** na desvantagem, 1,0x neutro. Valores em arquivo de configuração.
- **Taijutsu não é elemental** (sempre neutro, inclusive o taijutsu imbuído de chakra).
- Cada técnica de ninjutsu tem um elemento. Cada vilão tem um elemento fixo.
- **Só se aprende técnica elemental do próprio elemento**: a afinidade ou um elemento secundário. Um ninja de raio nunca recebe técnica de água. Técnicas sem elemento (taijutsu, genjutsu, médico) servem a todos.
- Elemento secundário pode ser ganho como recompensa de roleta.

### Técnicas

- Cada personagem tem um **skill set por categoria** (taijutsu, ninjutsu, genjutsu e ninjutsu médico): pode ter **várias técnicas por categoria** e escolhe qual usar em cada turno (na tela, uma aba por categoria). Aprender uma técnica nova **soma** ao skill set, não substitui.
- **Ações básicas** vêm da origem: taijutsu imbuído de chakra (dano 8, grátis) e **taijutsu fortalecido** (dano 14, **gasta 3 de chakra**) para todos; ninjutsu básico do próprio elemento para quem usa ninjutsu; genjutsu básico só para o Uchiha.
- **Técnicas de nível**: aprendidas sozinhas ao atingir o nível (se a origem permitir a categoria e o jogador dominar o elemento). **Mais fortes, porém mais caras** (inclusive as de taijutsu):

  | Nível | Taijutsu | Ninjutsu (do elemento) | Genjutsu (só quem usa genjutsu) |
  |---|---|---|---|
  | 4 | Combo do furacão (20, 5 ck) | 22 a 25 de dano, 5 a 7 ck | Ilusão do medo (poder +10, 5 ck) |
  | 7 | Lótus oculta (30, 9 ck) | 32 a 36 de dano, 9 a 11 ck | Mundo espelhado (2 turnos base, poder +14, 8 ck) |

- As técnicas podem receber **upgrades** (pergaminho), **por categoria**: o upgrade vale para todas as técnicas dela, inclusive as básicas.
- **Taijutsu não consome chakra**, com exceções: o taijutsu fortalecido e as técnicas de taijutsu de nível (dos vilões, sempre grátis).
- Ninjutsu e genjutsu consomem chakra. Sem chakra suficiente, a técnica não pode ser usada.
- **Genjutsu não causa dano** (ver "Genjutsu" no combate). O pergaminho de técnica no genjutsu aumenta o poder de aprisionamento (+3 por nível), não o dano.

#### Ninjutsu médico

- Técnica de suporte aprendível como recompensa ("nova técnica"). Ocupa um **espaço próprio**: não substitui o ninjutsu de ataque.
- Ação de combate: cura **20% do HP máximo** (sem rolar acerto), custa **4 de chakra**. Indisponível com HP cheio.
- O pergaminho de técnica também a melhora: **+5% de cura por nível**.
- Usa chakra de ninjutsu, então o **prodígio do taijutsu não aprende**.

### Nível

- O jogador começa no **nível 1**. **Nível máximo: 10.**
- Cada vilão derrotado dá **XP** conforme a dificuldade dele (campo `xp` nos dados; no exame, só vitórias dão XP). Nos blocos de várias lutas, cada mini vilão dá menos XP: o jogador **não** sobe de nível a cada luta.
- XP para ir do nível N ao N+1: **100 + 25 × (N − 1)** (100, 125, 150... 300). A sobra passa para o próximo nível; no nível máximo o XP não acumula. (Era 100 + 20; o crescimento maior é um pequeno nerf, ~11% mais XP no total. O 1º nível segue em 100 para o Mizuki dar nível antes do Zabuza.)
- Com todas as vitórias, o jogador chega a Orochimaru por volta do nível 9.
- Todo nível: **HP máximo +12** e **chakra máximo +2**.
- **Subir de nível restaura HP e chakra por completo.** É o único gatilho de recuperação fora do item de retorno: **terminar uma luta ou etapa não restaura** (`campaign.restoreBetweenStages: false`). Exceção: entre as lutas do exame chunin o jogador volta cheio (`exam.restoreBetweenFights`), senão uma derrota, que deixa 1 de HP, perderia todas as lutas seguintes.
- Depois, a **roleta de nível** sorteia um status para um bônus extra:

| Status | Peso | Bônus |
|---|---|---|
| Taijutsu | 2 | +3 |
| Ninjutsu | 2 | +3 |
| Genjutsu | 2 | +3 |
| Speed | 2 | +1 |
| HP máximo | 2 | +15 |
| Chakra máximo | 1 | +4 |
| Resistência (`diferencial_de_resistência`) | 1 | +1 |

- Tipos proibidos pela origem (ninjutsu e genjutsu do prodígio do taijutsu) saem da roleta.
- Ganhos por nível subiram (eram +8 HP, +1 chakra e +2/+12/+3 na roleta) para compensar menos níveis por campanha.

### Dificuldade

- Escolhida na tela de origem, antes da primeira luta (fica salva como preferência do aparelho e no histórico da run).
- Multiplica a **força dos vilões**: HP, dano base das técnicas e atributos defensivos. Speed, chakra, crítico e XP não mudam.

| Dificuldade | Força dos vilões |
|---|---|
| Fácil | 75% |
| Médio | 100% (base) |
| Difícil | 150% |

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

#### Chakra dos vilões

- Cada vilão tem uma **reserva de chakra** e cada técnica dele tem custo (taijutsu é grátis).
- O vilão sorteia a técnica (pelos pesos) **só entre as que pode pagar**. Sem chakra para nenhuma, perde a vez **concentrando chakra** (+4).

#### Passivas dos vilões

Vilões, principalmente os mais avançados, podem ter uma passiva única (`passive` em `villains.ts`):

| Vilão | Passiva | Efeito |
|---|---|---|
| Gaara | **Jinchuuriki** | Uma vez por luta, abaixo de 30% do HP: cura 15% do HP máximo e causa ×1,4 de dano por 3 turnos. |
| Kabuto | **Ninjutsu médico** | Abaixo de 50% do HP, troca o ataque por uma cura de 20% do HP máximo (6 de chakra), até 2 vezes por luta. |
| Orochimaru | **Invocação de cobra** | Golpe que acerta um jogador sem veneno aplica **veneno 5** (fim da rodada: perde o valor em HP, cai 1). Veneno pode derrubar (usa o item de retorno, que limpa o veneno). |

#### Genjutsu

- **Não causa dano.** Se acertar, **aprisiona** o alvo (efeito Debilitado, "Aprisionado" na tela): ele **perde a vez** por alguns turnos. Vale para jogador e vilões.
- Chance de acerto: genjutsu do atacante vs. genjutsu do defensor (`genjutsuHit`). Não tem crítico e não gasta o crítico garantido do ramen.
- Turnos de aprisionamento:
  ```
  poder  = genjutsu do atacante + poder da técnica + 3 × nível do pergaminho de genjutsu
  turnos = clamp(turnos_base_da_técnica + floor(max(0, poder − genjutsu_do_alvo) / 8), 1, 3)
  ```
  Para o vilão, o poder é o atributo de genjutsu dele e o alvo usa o genjutsu do jogador, somado à resistência passiva do Uchiha (o prodígio do taijutsu, com genjutsu 0, fica preso por mais tempo).
- Técnica básica: 1 turno base. Ilusão dos corvos: 1 turno base e +6 de poder.
- Anti-trava: ao sair do aprisionamento, o alvo age ao menos uma vez antes de poder ser aprisionado de novo.

### Item de retorno (revive)

- O jogador começa a run com **1 item de retorno**.
- Ao chegar a 0 de HP, se tiver um item, ele é consumido e o jogador volta à luta com **HP e chakra totalmente restaurados** (full restore).
- O item é **acumulável** e pode aparecer como recompensa nas roletas.
- Sem item e com HP 0: fim da run (game over).

### Roleta

- Visível por padrão (animação nos sorteios relevantes).
- Configuração para desligar: modo "resultado instantâneo".
- Componente reutilizável: recebe lista de fatias (rótulo, peso, efeito) e um `rng`, devolve a fatia sorteada. Usada em origem, linhagem, jinchuuriki, iniciativa, acerto/crítico, eventos pré-vilão, exame, recompensas e nível.

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
| **Pergaminho de técnica** | Upgrade em uma categoria do jogador (sorteada entre as que ele usa: tai, nin, gen, médico); vale para todas as técnicas dela. Respeita o filtro de origem. |
| **Amuleto de resistência** | `diferencial_de_resistência` +1. Permanente; fica na bolsa (acumula). |
| **Amuleto de velocidade** | Speed +1. Permanente; fica na bolsa (acumula). |

Pesos a definir (sugestão inicial: pesos iguais, item de retorno um pouco mais raro).

#### Roleta de encontros misteriosos

| Encontro | Efeito |
|---|---|
| **Akatsuki** | **Jinchuuriki**: perde 1 item de retorno. Nunca causa game over. Sem item disponível: começa a próxima luta com metade do HP e chakra. **Não jinchuuriki**: eles procuram um jinchuuriki e passam direto, mas o jogador assiste à luta deles de longe e aprende a mirar nos pontos vitais: **chance de crítico +5%** (`diferencial_de_dano_%`). |
| **Invocação** | Aprende a **invocar** (passiva, ver abaixo). Se já sabe invocar: a invocação sobe de nível (o animal não muda). |

Pesos a definir (sugestão: 50/50).

#### Invocação (passiva)

- Liberada pelo encontro misterioso. **Não é uma ação de combate**: o animal acompanha o jogador e complementa as características dele em todas as lutas, sem custo de chakra.
- O animal é sorteado no encontro (nomes de trabalho, um por efeito). "Por nível" conta a partir do nível 2:
  - **Sapo** (suporte de dano): **+3 de dano base** em todos os ataques, +2 por nível.
  - **Cobra** (veneno): um ataque que acerta um alvo **sem veneno** aplica **veneno 5** (+2 por nível). No fim de cada rodada o veneno causa o seu valor em dano e cai 1; ao chegar a 0, a condição some e pode ser reaplicada. Veneno 5 = 5+4+3+2+1 = 15 de dano.
  - **Lesma** (cura passiva): cura **4% do HP máximo** no início de cada rodada, +2% por nível.
- Detalhes em configuração.

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
- **Toda funcionalidade ou versão nova termina publicada**: testar, commitar, fazer push e subir a tag `vX.Y.Z`, sem esperar pedido (passo a passo na skill `.claude/skills/lancar-versao`). Nunca `--force`; só não publicar se o usuário disser para segurar.

## Decisões em aberto

- [ ] Chance base de acerto e o que a modifica (ex.: diferença de speed).
- [ ] Custos de chakra das técnicas de ninjutsu e genjutsu (taijutsu não gasta chakra).
- [ ] Valores finais das origens: 20% de linhagem especial, pesos da 2ª roleta, 10% de jinchuuriki, modificadores e passivas (hoje provisórios).
- [ ] Valor de 1 estágio de status.
- [ ] Valores de nível (HP/chakra por nível, bônus e pesos da roleta de nível) e de chakra dos vilões.
- [ ] Gaara virou o gargalo da campanha na simulação (defesa alta + lutas longas). Com a v0.6.0 (sem restauração ao fim da luta) ficou pior: 69% das runs no Médio param nele. Na v0.7.0 ganhou a passiva de jinchuuriki e foi aliviado (HP 160 → 140, defesa tai/nin 14 → 12). O muro real é o **chakra**: sem restauração entre etapas, quase todos chegam nele com ~0 de chakra.
- [ ] Equilíbrio entre linhagens no Médio (simulação v0.7.0, `npm run sim:origens`): Comum ~4%, Uchiha ~8%, Prodígio ~20%, Hyuuga ~50%, Uzumaki ~94% de vitórias. O Uchiha depende de chakra (Sharingan, ninjutsu, genjutsu) e sofre mais com a falta de restauração; o Hyuuga tem golpes grátis fortes.
- [ ] Dōjutsu: ativar gasta o turno (simples para um toque). Alternativa: ativação grátis, com custo maior. Confirmar.
- [ ] Desativar o dōjutsu manualmente (hoje só desliga sem chakra).
- [ ] Exame chunin restaura HP/chakra entre as lutas (exceção à regra "só o nível restaura"). Confirmar.
- [ ] Recompensa "recuperação de HP/chakra" está na lista de recompensas mas não existe no jogo; ficou mais relevante sem a restauração entre etapas.
- [ ] Pesos da roleta de itens e da roleta de encontros.
- [ ] Eventos pré-vilão giram antes das lutas do exame?
- [ ] Confirmar que o atributo defensivo do vilão substitui a "resistência" (sem subtração dupla).
- [ ] Estrutura exata do exame: quantas lutas e como o desempenho vira pontuação.
- [ ] Nome do projeto e licença (sugestão: MIT).

## Primeiro passo recomendado

Construir apenas o `core` (componente de roleta com RNG injetável, geração de origem em 3 rolagens, iniciativa quadrática, rolagem de acerto/crítico, pipeline de dano com elementos/resistência, gasto de chakra, item de retorno com full restore, debilitado) com testes, e uma simulação em terminal que roda lutas automáticas para ajustar o balanceamento antes de fazer qualquer interface.