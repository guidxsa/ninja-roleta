# Combate da Jornada

> Implementado na v0.35.0 ([README.md](README.md)). Código em `src/core/jornada/battle.ts`, números em `src/data/jornada/balance.ts`.

Um motor próprio, de equipe, separado do combate do Roleta. Compartilha com a base só as fórmulas: acerto e crítico ([fundamentos.md](../base/fundamentos.md)), dano (`base + ataque − resistência usada`, arredondado para baixo, mínimo 1) e a força da dificuldade. Fichas: [personagens.md](personagens.md) e [inimigos.md](inimigos.md).

## Equipes

- Até 3 lutadores de cada lado, todos com HP e chakra. Vilões podem ter seus próprios suportes (Akamaru, Kabuto).
- O jogador controla **só o protagonista**. Os suportes e os inimigos agem sozinhos ([personagens.md](personagens.md#comportamento)).

## Ordem

- A cada rodada, todos os lutadores de pé entram numa ordem por speed × (1 ± 15%). A variação é pequena: a sorte pesa menos que no Roleta.
- No começo de cada rodada, quem tem regeneração recupera HP.

## Turno

1. Queimar e veneno tiram 5% e 6% do HP máximo.
2. Atordoado perde a vez.
3. O lutador age. Antes da ação, pode usar **uma ativa de classe** (Kage Bunshin, Sharingan, Byakugan, Portões, Manto da Kyuubi...): ela **não gasta o turno**, é uma por turno, e o turno continua. Fortalecimentos contam o turno da ativação (o Sharingan de 3 turnos vale para a ação deste turno e das 2 seguintes). O protagonista escolhe:
   - **técnica** do moveset, tocando no alvo (inimigo ou aliado; técnicas em todos os inimigos e em si não pedem alvo);
   - **Defender**: usa a resistência inteira (100% no lugar de 50%) até o próximo turno dele;
   - **Concentrar**: recupera 25% do chakra máximo;
   - **item da bolsa**: não gasta o turno, um por turno (ver abaixo).
4. Fim do turno: desgaste dos Portões, depois efeitos, portão e esperas descontam 1.

Custo em HP (Lótus, Manto da Kyuubi, Uma cauda, Selo amaldiçoado) e desgaste dos Portões aparecem na hora: a barra cai, sobe um número na cor de alerta e o log registra.

## Portões

Ativa do prodígio (v0.42.0). Números em `jornadaBalance.gates`; o portão N soma os bônus e o desgaste do 1º ao N.

| Portão | Bruto | Desgaste bruto | Total: dano | Total: desgaste por turno |
|---|---|---|---|---|
| 1º Abertura (Kaimon) | dano ×1,15 | 2% do HP máximo | ×1,15 | 2% |
| 2º Descanso (Kyūmon) | ×1,1 | +1% | ×1,26 | 3% |
| 3º Vida (Seimon) | ×1,1 e +10% de acerto | +1% | ×1,39 (+10% de acerto) | 4% |
| 4º Dor (Shōmon) | ×1,1 | +2% | ×1,53 | 6% |
| 5º Limite (Tomon) | ×1,1 e +5% de crítico | +2% | ×1,68 (+10% de acerto, +5% de crítico) | 8% |

- **Uma troca por turno** (é a ativa do turno): com tudo fechado, abrir qualquer portão liberado; aberto, subir ou descer para qualquer outro, ou fechar. Não gasta a vez.
- Aberto, fica no máximo **4 turnos, contando o da abertura**. Subir ou descer **não renova** o tempo.
- **Sem custo na abertura.** No fim de cada turno com um portão aberto (inclusive atordoado), **desgaste**: perde a fração do HP máximo do portão atual. O desgaste nunca derruba: para em 1 de HP.
- Fechou (pelo jogador ou pelo tempo): **espera 3 turnos** para abrir de novo. Caiu: os portões fecham, sem espera.
- Liberação: o prodígio começa com a Abertura; o talento Portão da Vida libera até o 3º e a Lótus Oculta, até o 5º ([talentos.md](talentos.md#prodígio-caminho-ninja)).
- Na tela: um botão Portões. Com um portão só para abrir, abre direto; com mais, um submenu com cada portão (nome, dano e desgaste em HP por turno) e Fechar. O lutador ganha um selo com o número do portão e os turnos que restam. A dica traz bônus, desgaste, tempo e espera.

## Acerto e dano

- Chance de acerto = precisão da técnica (padrão 85%) + bônus de acerto de quem ataca − esquiva do alvo, entre 5% e 100%. Crítico: 5% + bônus, até 50%, ×2 no dano.
- Técnicas de vários golpes rolam cada golpe.
- Resistência usada: física contra taijutsu e ninjutsu, mental contra genjutsu; 50% dela (100% defendendo), menos a penetração da técnica (até 60%).
- **Elementos**: a técnica contra o elemento do alvo. Vantagem ×1,25, desvantagem ×0,8 (ciclo fogo > vento > raio > terra > água > fogo).
- Multiplicadores de quem ataca: talentos, relíquias, HP baixo e fúria (passiva de alguns inimigos abaixo de uma fração do HP).

## Efeitos

| Efeito | O que faz | Duração padrão |
|---|---|---|
| Atordoar | Perde a vez | a da técnica (geralmente 1) |
| Queimar | −5% do HP máximo no começo do turno | 2 |
| Veneno | −6% do HP máximo no começo do turno | 2 |
| Bloqueio de chakra | Só taijutsu | 2 (64 Palmas: 3) |

- **Escudo** absorve dano antes do HP e não some sozinho.
- **Clones** (Kage Bunshin): cada golpe de alvo único tem 50% de chance de acertar um clone no lugar do dono (o clone some). Técnicas em área ignoram os clones, mesmo sobrando um inimigo só. No máximo 5 clones.
- **Kai** e **Palma mística** tiram atordoar e bloqueio de chakra.

## Cair e levantar

- Quem chega a 0 de HP cai: perde efeitos, escudo e clones.
- **Levantar não é regra geral** (v0.48.0): só a **Pílula de reanimação** e quem tem uma **técnica de reanimar** levantam. Sem isso, quem caiu fica no chão até o fim da luta.
- **Reanimação** (técnica): gasta o turno, 15 de chakra, espera 2, volta com 50% do HP, alvo aliado caído. Quem tem: Tsunade, a médica de campo Mika ([classes.md](classes.md#suportes-genéricos-versão-suporte)) e quem aprende na árvore (Ninguém fica para trás do Naruto, Primeiros socorros do Comum). Quem tem a técnica levanta antes de tudo, o protagonista primeiro. A técnica do Kabuto é a Reanimação proibida ([inimigos.md](inimigos.md)).
- **Pílula no protagonista**: se ele cair com pílula na bolsa, uma é usada sozinha, sem gastar turno, inclusive lutando solo.
- **Protagonista caído sem pílula não encerra a luta** enquanto houver suporte de pé: a luta anda sozinha com os suportes, que ainda podem vencer.
- **Derrota é todos os aliados no chão.** Lutando sozinho, cair é derrota. Fúria da Kyuubi (talento) segura o Naruto com 1 de HP uma vez por luta.
- Pílula em um suporte: item da bolsa, pelo protagonista de pé. Volta com 50% do HP. Bônus de relíquia (Apito de socorro, Talismã da segunda chance) valem para técnica e pílula.

## Bolsa

Itens não gastam o turno, mas é um por turno. Limite de 5 na bolsa.

| Item | Efeito |
|---|---|
| Kit de HP | Cura 35% do HP de um aliado |
| Kit de chakra | Recupera 40% do chakra de um aliado |
| Pílula de reanimação | Levanta um aliado caído com 50% do HP; no protagonista caído, é usada sozinha |

## Moveset

- **4 técnicas** equipadas, mais as **ativas de classe** numa área separada (Kage Bunshin, Manto da Kyuubi).
- O moveset fica salvo entre as lutas; editar (botão Moveset na trilha) é opcional. Técnica nova da árvore entra sozinha se houver espaço.
- **Tela do moveset** (v0.43.0): tela cheia com o tema da classe, como a árvore de talentos (cor, padrão e brasão; no Comum, a cor do elemento). Em cima, as 4 vagas em selos (tocar tira); depois as ativas de classe, sempre disponíveis; embaixo, as técnicas conhecidas agrupadas por origem (kit inicial, elemento, talentos e eventos), com o dano e o custo da run. Com as 4 vagas cheias, tocar numa técnica nova avisa para tirar uma antes.

## Vitória e derrota

- Vence quem derruba todos os inimigos, ou cumpre a vitória especial da luta ([historia.md](historia.md#vitórias-especiais)).
- Derrota (todos os aliados no chão) acaba a run. No **Fácil**, a Vontade do Fogo (1 por run e por ciclo do modo infinito, ou por relíquia) recomeça a luta com a equipe em pelo menos 50% do HP e do chakra.

## Interface

- Tela dedicada: cenário por estágio (silhuetas em nanquim), inimigos em cima, equipe embaixo. Cada lutador é um estandarte: retrato em destaque, nome, barras de HP e chakra e ícones de efeito (SVG, sem emoji).
- Quem age tem um losango dourado embaixo; na hora de escolher o alvo, os alvos válidos ganham uma retícula vermelha.
- Entrada com varrida de pergaminho; cada evento do log anima (avançar no ataque, tremer ao tomar dano, número flutuante, brilho do elemento, cair e levantar), inclusive quando os suportes e os inimigos agem. O nome da técnica aparece numa pincelada na cor do elemento (ou do tipo); o crítico ganha um corte dourado. A barra de HP cai e deixa um rastro claro que alcança depois. O modo instantâneo encurta tudo.
- Técnica em espera (cooldown) mostra um selo com as rodadas que faltam e um anel do quanto ainda falta.
- **Botões simples**: nome e os números principais (dano por golpe com os bônus de talentos, níveis, portão e fortalecimento, golpes e custo). Dano acima do base fica dourado; custo que não dá fica vermelho. Alvo, efeitos, regras, penalidades e motivo de bloqueio ficam na dica.
- **Clones na tela**: uma cópia do retrato atrás do lutador por clone; a que recebe o golpe vira fumaça, com o aviso "clone recebeu!". O botão da técnica diz quantos clones ela cria; a dica traz a regra inteira.
- **Fortalecimento e portão**: selo no lutador com os turnos que restam; ao ativar, número flutuante e linha no log.
- **Protagonista caído**: uma faixa avisa que os suportes seguem lutando, e outra anuncia quem o levantou (ou a pílula).
- Log curto (tocar abre o histórico). Sem roleta na tela: só o resultado.
- Dicas: passar o mouse ou segurar o dedo numa técnica mostra a ficha dela (motivo de bloqueio, tipo, elemento, alvo, dano, precisão, efeitos, fortalecimento, custo, espera); num lutador, HP, chakra, elemento, comportamento, passiva, portão, fortalecimento, efeitos e técnicas.
- No PC, a batalha usa duas colunas (arena à esquerda, menu e log à direita) e a trilha mostra o HUD ao lado do caminho.
- **Ficha da equipe** (v0.43.0; botão Ficha do cabeçalho ou do HUD, também no meio da luta): o pergaminho da Ficha do Roleta, com uma aba por membro (o protagonista e os suportes da próxima luta). Cada aba traz classe, nível, elemento, HP e chakra (os de agora, na luta), atributos com régua, as técnicas com o dano e o custo da run (protagonista: moveset e ativas; suportes: o kit e o papel da IA) e os bônus de talentos e relíquias. A aba do protagonista mostra também a dificuldade, a recuperação por vitória, as relíquias e a bolsa.
- Pronta para sprites: cada lutador é um bloco com poses em classes CSS; uma imagem própria em `public/img/jornada/<id>.webp` substitui o retrato.
