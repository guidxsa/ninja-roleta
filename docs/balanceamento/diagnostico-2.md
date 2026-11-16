# Diagnóstico de balanceamento 2 (v0.87.0)

Segundo levantamento, refeito depois do balanceamento aprovado (v0.78.0 a v0.87.0, [registro](../registro.md)), com as mesmas medidas do [primeiro diagnóstico](diagnostico.md) (v0.77.0). **Nenhum número do jogo mudou neste levantamento.** Como rodar: [benchmark.md](benchmark.md).

## Como ler

- Os números saem do bot da simulação, que joga pior que um humano. Desde a v0.82.0 o bot da Jornada usa a loja melhor (tratamento abaixo de 50% do HP, relíquia pelo valor medido, uma atualização da prateleira) e o do Roleta usa Kit médico e Pílula de soldado com critério (v0.81.0). Parte da subida dos números vem disso, não de o jogo ter ficado mais fácil.
- 300 runs por medida (as relíquias da Jornada, 200). Diferenças abaixo de uns **7 pontos** podem ser só ruído.
- Alvo combinado (`docs/decisoes.md`): bot no Médio com 60–70% (kits complexos 50–60%).

## 1. Onde estamos

Vitória do bot, v0.77.0 → v0.87.0 (Fácil / Médio / Difícil / Hardcore):

| Modo | Antes | Agora |
|---|---|---|
| Roleta, Comum | 83 / 48 / 16 / 12 | 94 / **69** / 39 / 25 |
| Roleta, Akimichi | 94 / 72 / 44 / 30 | 95 / 73 / 37 / 24 |
| Roleta, Inuzuka | 94 / 70 / 35 / 28 | 97 / 83 / 56 / 46 |
| Roleta, Prodígio | 98 / 87 / 62 / 52 | 100 / **94** / 75 / 64 |
| Roleta, Uchiha | 80 / 34 / 10 / 10 | 89 / **53** / 21 / 15 |
| Roleta, Hyuuga | 79 / 43 / 12 / 6 | 94 / **68** / 35 / 27 |
| Roleta, Uzumaki | 91 / 65 / 37 / 29 | 95 / 74 / 46 / 42 |
| Roleta, Senju | 97 / 85 / 67 / 53 | 99 / **94** / 78 / 70 |
| História (Naruto) | 100 / 97 / 68 / 12 | 100 / **74** / **20** / 2 |
| Caminho Ninja, Comum | 99 / 80 / 53 / 13 | 100 / **89** / 60 / 28 |
| Caminho Ninja, Prodígio | 100 / 89 / 49 / 12 | 100 / 85 / 50 / 15 |
| Caminho Ninja, Uchiha | 99 / 74 / 34 / 11 | 100 / 85 / 47 / 13 |
| Caminho Ninja, Hyuuga | 99 / 81 / 43 / 12 | 100 / 78 / 43 / 14 |

- **Roleta:** o espalhamento no Médio caiu de 53 pontos (34 a 87%) para 41 (53 a 94%). Comum, Hyuuga e Uchiha entraram no alvo ou perto dele. Prodígio e Senju estão bem acima.
- **História:** caiu para dentro do alvo no Médio, mas o Difícil despencou (68 → 20%).
- **Caminho Ninja:** ficou acima do alvo no Médio (78 a 89%), puxado pelo XP + 30 e pelo bot novo da loja.

## 2. O que o balanceamento resolveu

| Problema do 1º diagnóstico | Como está agora |
|---|---|
| P3, relíquias de equipe dominando | Caíram de valor marginal (Armadura samurai 30,8 → 18,0); as fracas refeitas subiram (Diário do mestre 0,8 → 8,8; Frasco de toxina 0,0 → 10,0). Detalhe na seção 4 (Armadura samurai +18,0 na medição nova). |
| P4, Roleta espalhado pelo dano | Melhorou (ver acima), mas o Uchiha virou o que menos bate (seção 3, R1). |
| P6, o Uchiha dependia da inicial | Resolvido: no Difícil, sem a inicial 48%, com ela 47% (antes 29 contra 35). A evolução vale +19. |
| P7, árvores das classes pequenas | As quatro classes têm árvores de seis ramos, com bifurcações, talentos finais e combinações. |
| P9, multiplicadores de dano empilhando | O dano geral soma desde a v0.78.0. |
| P10, economia impossível de medir | O bot compra pelo valor medido e trata o HP; agora a loja pode ser medida (seção 3, J5). |
| P11, consumíveis do Roleta sem uso | Resolvido: 0,3 a 1,3 item por luta (antes 0,01 a 0,05), com a bolsa inicial e o bot novo. |
| P12, docs desatualizados | Corrigidos na v0.78.0. |

## 3. Problemas que continuam ou surgiram

### J1. História: o Médio e o Difícil ficaram longe demais (prioridade máxima)
- Médio 74%, Difícil 20%, Hardcore 2%. O alvo só fala do Médio, mas um Difícil com 1 vitória em 5 para o bot é duro.
- As derrotas seguem quase todas nos estágios 1 e 2: no Difícil, Haku 33% e Trio da Chuva 29% das runs.
- A força por estágio pesa só no começo: subir os estágios 3 e 4 de ×1,4 para ×2 muda uns 4 pontos no Médio ([registro](../registro.md), v0.82.0). Então qualquer força nos estágios 1 e 2 mexe no Médio e no Difícil juntos.
- **Consequência:** o ajuste que falta é por dificuldade, não por estágio. Por exemplo, a força dos estágios 1 e 2 menor no Difícil que no Médio, ou um degrau menor entre as dificuldades (`enemyStrength`: 125% → 140% hoje).

### J2. O estágio 3 da História virou maratona
| História, Médio | Estágio 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Rodadas por luta | 6,1 | 6,5 | **21,3** | 10,6 |
| Dano dado / recebido por rodada | 46 / 23 | 70 / 31 | 46 / **6** | 60 / 13 |
| Ryō que entra | 225 | 214 | **61** | 135 |

- Com os inimigos a ×1,7, as lutas do estágio 3 ficam três vezes mais longas e quase sem risco: a equipe recebe 6 de dano por rodada.
- **Consequência:** a força por estágio deixou o estágio 3 lento, não difícil. Em vez de HP, ele pede inimigos que batam mais.

### J3. O Caminho Ninja passou do alvo, e o fim continua fácil
- Médio: Comum 89%, prodígio 85%, Uchiha 85%, Hyuuga 78%.
- Comum no Médio: dano dado por rodada de 54 → 77 → 99 do estágio 1 ao 3; dano recebido parado em ~20. No Uchiha, o dano dado chega a 136 no estágio 3.
- **Consequência:** a força por estágio no Caminho Ninja (C1, que estava esperando) é o próximo passo natural: menos força no começo, mais no estágio 3.

### J4. Árvores das classes: diferença entre ramos e o bot padrão
Builds focadas (Médio / Difícil):

| Classe | Melhor ramo | Pior ramo | Diferença no Difícil | Bot padrão |
|---|---|---|---|---|
| Comum | Estilo da Folha 95 / 78 | Clones 93 / 59 | 18,7 | 91 / 64 |
| Prodígio | Punho Bêbado 97 / 76 | Treino 90 / 55 | 21,6 | 85 / 50 |
| Uchiha | Armas do clã 87 / 60 | Ilusões 74 / 36 | 24,0 | 85 / 47 |
| Hyuuga | Oito Trigramas 91 / 64 | Casa secundária 78 / 40 | 24,0 | 78 / 43 |
| Naruto (História) | Clones 82 / 33 | Sapos 69 / 17 | 16,6 | 74 / 20 |

- **O mesmo padrão nas quatro classes:** o ramo que ganha é o que dá uma técnica de vários golpes barata cedo (Furacão da Folha, Punho Bêbado, Shuriken giratória, 64 Palmas). Já movi essas técnicas da raiz para a junção, e mesmo assim esses ramos seguem na frente.
- **Os ramos de suporte e de controle ficam atrás no Difícil:** Ilusões, Orgulho do clã, Polícia do clã, Casa secundária e Treino. O bot não sabe jogar para controlar nem para proteger, então parte disso pode ser limitação dele.
- **No Naruto, Sapos e Rasengan quase não mudam nada como foco:** as raízes vêm da história tarde, e o bot cai antes (Haku e Trio da Chuva).
- **O bot que compra o mais barato caiu** no prodígio e no Hyuuga, porque as técnicas boas ficaram mais caras de alcançar.

### J5. Iniciais e economia
- Vitória no Difícil sem a inicial · com a inicial · com a evolução desde o começo:

  | Classe | Difícil |
  |---|---|
  | Comum | 53 · 60 · 68 |
  | Prodígio | 45 · 50 · 71 |
  | Uchiha | 48 · 47 · 67 |
  | Hyuuga | 44 · 43 · **48** |

- **A evolução do Hyuuga segue fraca** (+5 contra +8 a +21 das outras), e a inicial dele não muda nada: o problema P6 continua só no Hyuuga.
- **H3 quase não aparece:** o estágio 3 da História tem **uma** cena presenciada (Sannin), então o bônus dá só +20 ryō por run.
- **O ryō entra e sai quase igual** em todo estágio (o bot gasta tudo). Baixar o preço por estágio da loja de 0,25 para 0,15 deu ~0,5 compra a mais por estágio e não mudou a vitória ([registro](../registro.md), v0.82.0).

### J6. Chakra: o Hyuuga ainda sobra
- Chakra do protagonista ao entrar na luta (Médio):
  - **Hyuuga:** 97 a 99%.
  - **Prodígio:** 70 a 80% (antes 54 a 66%).
  - **Uchiha:** 72 a 86%.
  - **Comum:** 81 a 88%.
- O kit do Hyuuga quase não gasta chakra, então relíquias e talentos de chakra continuam sem efeito para ele. Isso é o P8, que segue igual.

### R1. Roleta: o Uchiha é o que menos bate, e as lutas dele são as mais longas
| Origem (Médio) | Vitória | Dano dado por rodada (genin → chefe) | Rodadas contra o chefe |
|---|---|---|---|
| Prodígio | 94% | 42 → 45 | 6,9 |
| Senju | 94% | 19 → 23 | 13,4 |
| Inuzuka | 83% | 30 → 33 | 9,3 |
| Uzumaki | 74% | 19 → 19 | 15,4 |
| Akimichi | 73% | 20 → 23 | 12,5 |
| Comum | 69% | 20 → 26 | 11,2 |
| Hyuuga | 68% | 21 → 28 | 9,9 |
| Uchiha | 53% | **13 → 18** | **15,6** |

- **O Uchiha caiu de 20 para 13 de dano por rodada contra genin.** Com o kit completo, o bot gasta chakra no Sharingan e no Olhar Hipnótico e golpeia menos. O Sharingan não dá mais o +15% de acerto em tudo, só no genjutsu.
- **O Prodígio bate o dobro de qualquer outro** e fecha a luta contra o chefe em 7 rodadas.
- **O Senju vence 94% com dano mediano**, por conta da Vontade do Fogo a mais e da Força vital: no Difícil, usa 1,16 Vontade por run.
- **O Akimichi caiu no Difícil (44 → 37%):** o Corpo pesado pela razão de peso rende menos contra os vilões de HP alto.

### R2. Roleta: as relíquias quase não pesam mais
Valor marginal (Comum, Médio, base 72%): quase tudo entre **−5 e +5**, dentro do ruído.
- **Ainda valem:** Talismã da Vontade do Fogo +11,3; Contrato das cobras +9,3; Selo de contenção +8,8; Contrato dos sapos +8,0; Lâmina de chakra +7,3.
- **Valores negativos em várias comuns** (Bala de chakra −8,5, Bolsa de kunai −5,0) apontam um defeito da medida, não das relíquias. Ter a relíquia desde o começo muda o que a roleta de recompensa sorteia depois, e isso pesa contra.
- **Consequência:** com kits completos, bolsa inicial e o bot dos itens, o poder do Roleta saiu das relíquias e foi para a origem. A medida das relíquias do Roleta precisa ser revista antes de se tirar conclusão dela.

## 4. Relíquias da Jornada (valor marginal, v0.87.0)

<!-- relíquias-jornada -->
Valor marginal: vitória com a relíquia desde o começo, menos a linha de base. Difícil, 200 runs; base História 21,5% e Comum 58,5%. Com 200 runs, o ruído chega a uns **10 pontos** por relíquia, então olhe as faixas, não cada número.

| Classificação | Média antes → agora | Mais fortes | Quase nada (≤ 1) |
|---|---|---|---|
| Comum | +3 → +3 | Caderno de treino +10,8, Moeda da sorte +7,0, Pesos de treino +5,8, Kit médico +5,5 | Colete acolchoado +1,0, Cobertor de campanha +1,0, Selos em branco +0,3, Contas de meditação −0,5, Pílulas de soldado −3,0 |
| Incomum | +6 → +7 | Bandana rasgada +11,3, Frasco de toxina +10,0, Cupom do Ichiraku +9,5, Estojo de senbon +9,0 | nenhuma (Linha de sombra +1,5 é a mais fraca) |
| Rara | +9 → +8 | Selos explosivos +16,3, Máscara de caçador +13,0, Pacto de sangue +12,0, Cabaça de areia +11,5 | Pedra de chakra +0,8, Pergaminho dos mil −1,0 |
| Chefe | +15 → +14 | Núcleo de chakra +20,3, Bolsa sem fundo +19,3, Armadura samurai +18,0, Manto de Kage +18,0 | nenhuma |
| Loja | — → +7 | Encomenda do ferreiro +18,5, Carta de recomendação +12,3 | Selo de cliente −1,0 |
| Evento | — → +9 | Cartão fidelidade do ramen +13,2, Carta de fã +10,5, Anel estranho +10,0 | nenhuma |

- **As de equipe pararam de dominar:** a Armadura samurai caiu de +30,8 para +18,0 e já não lidera os chefes; o teto da faixa caiu de 31 para 20.
- **As refeitas na v0.78.0 saíram do zero:** Frasco de toxina 0,0 → +10,0, Diário do mestre 0,8 → +8,8, Bolsa reforçada 0,6 → +4,5, Sino do mercador 1,1 → +5,5. Colete acolchoado e Linha de sombra seguem fracos (o bot não Defende nem joga para atordoar).
- **Economia passou a valer:** a Bolsa sem fundo, que estava entre as mais fracas (+5,6), subiu para +19,3, e a Moeda da sorte para +7,0. É o efeito do bot que usa a loja.
- **Ainda há relíquias que não fazem nada para o bot:** Pílulas de soldado, Contas de meditação, Pedra de chakra, Pergaminho dos mil e Selo de cliente.

<!-- /relíquias-jornada -->

## 5. Recomendações por prioridade

| Prioridade | Recomendação | Evidência |
|---|---|---|
| 1 | **Feito na v0.88.0** (Difícil 1,05 / 1,1; Difícil 20 → 50%). História: separar a força dos estágios 1 e 2 por dificuldade (ou suavizar o degrau Médio → Difícil), para o Difícil voltar a 40–50% sem mexer no Médio | J1 |
| 1 | **Feito na v0.88.0** (HP ×0,65, ataque ×2,3; 21 → 8 rodadas). Estágio 3 da História: trocar parte da força em HP por força em ataque (lutas mais curtas e mais perigosas) | J2 |
| 1 | **Feito na v0.88.1** (0,95 / 1,05 / 1,25; Médio 61–70%). Caminho Ninja: força por estágio (C1), menos no começo e mais no estágio 3 | J3 |
| 2 | **Feito na v0.88.2** (Olhar Hipnótico 3 de chakra, Folha Furacão 1 golpe de 9, Senju sem Vontade extra; Médio Uchiha 56, Prodígio 76, Senju 74). Roleta: subir o Uchiha (ver o custo do Sharingan e do Olhar Hipnótico, ou devolver acerto ao Sharingan) e conter Prodígio e Senju | R1 |
| 2 | **Feito em parte na v0.88.3** (bônus no 3º nível dos ramos fracos; diferença no Difícil 17 a 29). Árvores: dar aos ramos de controle e suporte algo que pese cedo (técnica ou bônus na raiz), em vez de baixar os ramos de técnica | J4 |
| 2 | **Feito na v0.88.2** (inicial com crítico no lugar do desconto de chakra; evolução +12 no Difícil). Hyuuga: evolução da inicial mais forte e um uso para o chakra que sobra | J5, J6 |
| 3 | **Testado e desfeito** (o bot ficou pior nesses ramos: Defender não compensa; [registro](../registro.md)). Bot da simulação: aprender a controlar (atordoar e usar ilusões) e a proteger (Defender com o Guarda-costas), para medir esses ramos de verdade | J4 |
| 3 | Revisar a medida de relíquias do Roleta (separar o efeito da roleta de recompensa) | R2 |
| 3 | H3: mais cenas presenciadas no estágio 3, ou o bônus em outro tipo de parada | J5 |
| — | Decisões já abertas que este levantamento confirma: itens 29, 34, 35 e 36 de `docs/decisoes.md` | |
