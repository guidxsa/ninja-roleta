# Combate da Jornada

> Implementado na v0.35.0 ([README.md](README.md)). Código em `src/core/jornada/battle.ts`, números em `src/data/jornada/balance.ts`.

Um motor próprio, de equipe, separado do combate do Roleta. Compartilha com a base só as fórmulas: acerto e crítico ([fundamentos.md](../base/fundamentos.md)), dano (`base + ataque − resistência usada`, arredondado para baixo, mínimo 1) e a força da dificuldade. Fichas: [personagens.md](personagens.md) e [inimigos.md](inimigos.md).

## Equipes

- Até 3 lutadores de cada lado, todos com HP e chakra. Vilões podem ter seus próprios suportes (Akamaru, Kabuto).
- O jogador controla **só o protagonista**. Os suportes e os inimigos agem sozinhos ([personagens.md](personagens.md#comportamento)).

## Ordem

- A cada rodada, todos os lutadores de pé entram numa ordem por speed × (1 ± 15%). A variação é pequena: a sorte pesa menos que no Roleta.
- No começo de cada rodada, quem tem regeneração recupera HP. **Regen é valor fixo** (v0.49.0): recuperação, kits, Concentrar e técnicas de cura não crescem com o HP e o chakra máximos. Em fração seguem queimar, veneno, Portões, custos de técnica, reviver e escudos.

## Turno

1. Queimar e veneno tiram 5% e 6% do HP máximo.
2. Atordoado perde a vez.
3. O lutador age. Antes da ação, pode usar **uma ativa de classe** (Kage Bunshin, Sharingan, Byakugan, Portões, Manto da Kyuubi...): ela **não gasta o turno**, é uma por turno, e o turno continua. Fortalecimentos contam o turno da ativação (o Sharingan de 3 turnos vale para a ação deste turno e das 2 seguintes). **Postura** (Byakugan, v0.94.0): não tem prazo; custa chakra no fim de cada turno de quem usa a partir do turno seguinte ao que ligou, e apaga sem chakra para pagar; usar de novo desliga, sem custo. Técnicas podem pedir um fortalecimento ligado (as Palmas pedem o Byakugan). O protagonista escolhe:
   - **técnica** do moveset, tocando no alvo (inimigo ou aliado; técnicas em todos os inimigos e em si não pedem alvo);
   - **Defender**: usa a resistência inteira (100% no lugar de 50%) até o próximo turno dele;
   - **Concentrar**: recupera 8 de chakra;
   - **item da bolsa**: não gasta o turno, um por turno (ver abaixo).
4. Fim do turno: desgaste dos Portões, depois efeitos, portão e esperas descontam 1.

Custo em HP (Lótus, Manto da Kyuubi, Uma cauda, Selo amaldiçoado) e desgaste dos Portões aparecem na hora: a barra cai, sobe um número na cor de alerta e o log registra.

## Portões

Ativa do prodígio (v0.42.0; custo em chakra desde a v0.59.0, regra comum em [fundamentos.md](../base/fundamentos.md#portões)). Números em `jornadaBalance.gates` e `balance.gateCosts`; o portão N soma os bônus do 1º ao N.

| Portão | Bruto | Total: dano | Manutenção (× da regra comum) |
|---|---|---|---|
| 1º Abertura (Kaimon) | dano ×1,15 | ×1,15 | ×1 |
| 2º Descanso (Kyūmon) | ×1,1 | ×1,26 | ×1,25 |
| 3º Vida (Seimon) | ×1,1 e +10% de acerto | ×1,39 (+10% de acerto) | ×1,5 |
| 4º Dor (Shōmon) | ×1,1 | ×1,53 | ×1,75 |
| 5º Limite (Tomon) | ×1,1 e +5% de crítico | ×1,68 (+10% de acerto, +5% de crítico) | ×2 |

- **Uma troca por turno** (é a ativa do turno): com tudo fechado, abrir qualquer portão liberado; aberto, subir ou descer para qualquer outro, ou fechar. Não gasta a vez.
- **Abrir ou subir** custa **3 de chakra por portão a mais** (abrir o 5º direto custa 15); descer é grátis. Só aparecem os portões que dá para pagar.
- **Manutenção** no fim de cada turno aberto (inclusive atordoado), em chakra e HP (custo misto, v0.79.0; [fundamentos.md](../base/fundamentos.md#portões)): chakra 1, 2, 3, 4, 6, 8... × o peso do portão atual (arredondado para cima), e 1% do HP máximo por nível do portão. Trocar de portão não zera a contagem.
- **Sem limite de turnos**: sem chakra, ou sem HP para pagar e ficar com 1, fecham sozinhos.
- Fechou (pelo jogador ou por falta de chakra): **espera 3 turnos** para abrir de novo. Caiu: os portões fecham, sem espera.
- Liberação: o prodígio começa com a Abertura; o talento Portão da Vida libera até o 3º e a Lótus Oculta, até o 5º ([talentos.md](talentos.md#prodígio-caminho-ninja)).
- Chakra: o Prodígio tem 22 e o Lee 20 (eram 12 e 10), porque a Jornada não regenera chakra na luta.
- IA: abre o portão mais alto que dá para abrir e manter por 2 turnos; deixa fechar sozinho.
- Na tela: um botão Portões com o portão aberto e a próxima manutenção. Com um portão só para abrir, abre direto; com mais, um submenu com cada portão (nome, dano e custo de abertura) e Fechar. A dica traz bônus, custos e espera.

## Acerto e dano

- Chance de acerto = precisão da técnica (padrão 85%) + bônus de acerto de quem ataca − esquiva do alvo, entre 5% e 100%. Crítico: 5% + bônus, até 50%, ×2 no dano.
- Técnicas de vários golpes rolam cada golpe (o Roleta também, desde a v0.77.0).
- **Bônus por técnica, não por golpe** (v0.93.0, `combat.flatPerTechnique`): o dano fixo do taijutsu (Kunai afiada, Treino básico, Bolsa de kunai...) entra só no **primeiro golpe que acerta**, e o chakra devolvido pelo taijutsu (Ritmo de luta) volta **uma vez por uso**. Acerto, crítico e o combo continuam por golpe. Assim, uma técnica de vários golpes não multiplica esses bônus ([proposta-arvore.md](proposta-arvore.md)). Só a Jornada.
- Resistência usada: física contra taijutsu e ninjutsu, mental contra genjutsu; 50% dela (100% defendendo), menos a penetração da técnica (até 60%).
- **Elementos** (v0.77.0): não mudam o dano no HP. Só pesam contra uma **barreira** elemental: vantagem ×1,5 e desvantagem ×0,75 no escudo, raio contra terra ×2 ([fundamentos.md](../base/fundamentos.md#barreiras-no-roleta-e-na-jornada)). Antes valia ×1,25 e ×0,8 contra o elemento do alvo.
- Multiplicadores de quem ataca: talentos, relíquias, HP baixo e fúria (passiva de alguns inimigos abaixo de uma fração do HP).

## Efeitos

Os mesmos do Roleta (v0.77.0): Atordoar, Bloqueio de chakra (64 Palmas: 3 turnos), Queimar, Veneno (5% por 3; era 6% por 2) e **Medo** (novo na Jornada: −25% de dano e −15% de acerto por 2 turnos). Tabela, trava firme e imunidades em [fundamentos.md](../base/fundamentos.md#efeitos-roleta-e-jornada).

- **Controle dura no mínimo 2 turnos** (v0.69.0, `balance.effects.minControlTurns`): atordoar e bloqueio de chakra, de aliados e de inimigos. Para compensar, as chances de atordoar das técnicas com dano caíram cerca de 20% (as de controle puro, como o Sexy no Jutsu e a Possessão das Sombras, não mudaram).
- **Trava** (`balance.effects.stunImmunityTurns`): quem sai de um atordoamento fica **firme** até o fim do próximo turno em que age, e nenhum atordoamento pega nesse intervalo. Ninguém fica preso em cadeia: depois de perder 2 turnos, o lutador age pelo menos uma vez. O bloqueio de chakra não tem trava (quem está bloqueado ainda age com taijutsu).
- **Medo**: o Sino ilusório da Kin, a Flauta demoníaca da Tayuya e a Ilusão dos corvos davam atordoar e passaram a dar Medo (35%, 30% e 30%). Imunes (Uchiha e jinchuuriki, como no Roleta): Naruto, Sasuke, Kakashi, os Uchiha do Caminho Ninja, Gaara e o Shukaku (`combat.fearImmune`).

- **Escudo** absorve dano antes do HP e não some sozinho.
- **Barreira** (v0.77.0): escudo com elemento, por 3 turnos de quem recebe; o golpe passa por ela antes do escudo comum, e só nela o elemento pesa. Muralha de Terra, Parede d'Água, Muralha de Chamas e Escudo de Vento (o Comum aprende a do elemento no talento Poder elemental; o Jirobo tem a Muralha de Terra); o Escudo de areia e o Gamatatsu viraram barreiras. Regra em [fundamentos.md](../base/fundamentos.md#barreiras-no-roleta-e-na-jornada).
- **Clones** (tipos desde a v0.77.0; regra comum em [fundamentos.md](../base/fundamentos.md#clones)): cada golpe de alvo único pode acertar um clone no lugar do dono (uma rolagem por golpe: Bunshin 50%; Doton e Mokuton 65% e aguentam 2 golpes). Técnicas em área ignoram os clones, mesmo sobrando um inimigo só. No máximo 5 clones, todos do mesmo tipo. Na luta, quem tem ninjutsu elemental troca o Bunshin no Jutsu pelo clone da natureza (Mizu Bunshin no Jutsu, Doton Kage Bunshin, Raiton Kage Bunshin, Mokuton Bunshin, Suna Bunshin); Mizu e Mokuton batem junto (25% de um golpe por clone, até 70% somados), Raiton e Suna reagem ao se desfazer. Um contra-ataque por golpe: o do talento e a descarga do raio não somam (vale o maior).
- **Kai**, **Palma mística** e o **Grito de guerra** tiram atordoar, bloqueio de chakra e Medo (não dão a trava).

## Cair e levantar

- Quem chega a 0 de HP cai: perde efeitos, escudo e clones.
- **Levantar é de todos** (v0.69.0): qualquer integrante da equipe do jogador, o protagonista incluído, tem a ação **Levantar**: gasta o turno e o aliado caído volta com **15% do HP** (`combat.raiseHpPct`, proposta). Quem levanta escolhe quem; o levantado age a partir da rodada seguinte. Os **inimigos não têm a ação**: só levantam com técnica (Kabuto), como desde a v0.48.0.
- **Técnicas de levantar** devolvem mais HP: **Primeiros socorros** da Sakura (35%, 6 de chakra, espera 2) e **Reanimação** (50%, 15 de chakra, espera 2; Tsunade, a médica de campo Mika ([classes.md](classes.md#suportes-genéricos-versão-suporte)) e quem aprende na árvore: Ninguém fica para trás do Naruto, Primeiros socorros do Comum). A técnica do Kabuto é a Reanimação proibida ([inimigos.md](inimigos.md)).
- **Na tela**: com alguém caído, o menu do turno abre com o bloco **Aliado caído** antes das técnicas: a ação Levantar, a técnica de levantar (se tiver) e a Pílula.
- **Quem cai por cena não levanta**: o Iruka protegendo o Naruto, o Sasuke contra o Haku. Caiu pelo roteiro, fica no chão até o fim daquela luta (nem ação, nem técnica, nem pílula).
- **Os suportes levantam sozinhos** ([personagens.md](personagens.md#comportamento)): o protagonista sempre; outro suporte, só se quem levanta está com 40% do HP ou mais. Com a técnica, usam a técnica.
- **Pílula no protagonista**: se ele cair com pílula na bolsa, uma é usada sozinha, sem gastar turno, inclusive lutando solo.
- **Protagonista caído sem pílula não encerra a luta** enquanto houver suporte de pé: a luta anda sozinha com os suportes, que ainda podem vencer.
- **Derrota é todos os aliados no chão.** Lutando sozinho, cair é derrota. Fúria da Kyuubi (talento final) segura o Naruto com 1 de HP uma vez por luta e liga o chakra da Kyuubi por 3 turnos; Futuro Hokage (talento final dos Laços) dá a mesma queda evitada a cada integrante da equipe ([talentos.md](talentos.md#naruto)).
- Pílula em um suporte: item da bolsa, pelo protagonista de pé. Volta com 50% do HP. Bônus de relíquia (Apito de socorro, Talismã da segunda chance) valem para técnica e pílula.

## Bolsa

Itens não gastam o turno, mas é um por turno. Limite de 5 na bolsa.

| Item | Efeito |
|---|---|
| Kit de HP | Cura 35 de HP de um aliado |
| Kit de chakra | Recupera 12 de chakra de um aliado |
| Pílula de reanimação | Levanta um aliado caído com 50% do HP; no protagonista caído, é usada sozinha |

## Moveset

- **6 técnicas** equipadas (v0.69.0; eram 4), mais as **ativas de classe** numa área separada (Kage Bunshin, Manto da Kyuubi).
- O moveset fica salvo entre as lutas; editar (botão Moveset na trilha) é opcional. Técnica nova da árvore entra sozinha se houver espaço.
- **Tela do moveset** (v0.43.0): tela cheia com o tema da classe, como a árvore de talentos (cor, padrão e brasão; no Comum, a cor do elemento). Em cima, as 6 vagas em selos (tocar tira); depois as ativas de classe, sempre disponíveis; embaixo, as técnicas conhecidas agrupadas por origem (kit inicial, elemento, talentos e eventos), com o dano e o custo da run. Com as 6 vagas cheias, tocar numa técnica nova avisa para tirar uma antes. Na luta, com 5 ou 6 técnicas os botões ficam mais baixos para o menu caber.

## Vitória e derrota

- Vence quem derruba todos os inimigos, ou cumpre a vitória especial da luta ([historia.md](historia.md#vitórias-especiais)).
- Derrota (todos os aliados no chão) acaba a run. Até o **Difícil**, a Vontade do Fogo (Fácil 2, Médio 1, Difícil 1 por run; reposta a cada ciclo do modo infinito; ou por relíquia; v0.77.0) recomeça a luta com a equipe em pelo menos 50% do HP e do chakra. O Hardcore não tem.

## Interface

- Tela dedicada: cenário da parada ou do estágio ([visual.md](../visual.md)), inimigos em cima, equipe embaixo. Cada lutador é um estandarte: retrato em destaque, nome, barras de HP e chakra e ícones de efeito (SVG, sem emoji).
- Quem age tem um losango dourado embaixo; na hora de escolher o alvo, os alvos válidos ganham uma retícula vermelha.
- Entrada com varrida de pergaminho; cada evento do log anima (avançar no ataque, tremer ao tomar dano, número flutuante, brilho do elemento, cair e levantar), inclusive quando os suportes e os inimigos agem. O nome da técnica aparece numa pincelada na cor do elemento (ou do tipo); o crítico ganha um corte dourado. A barra de HP cai e deixa um rastro claro que alcança depois. O modo instantâneo encurta tudo.
- Técnica em espera (cooldown) mostra um selo com as rodadas que faltam e um anel do quanto ainda falta.
- **Botões simples**: nome e os números principais (dano por golpe com os bônus de talentos, níveis, portão e fortalecimento, golpes e custo). Dano acima do base fica dourado; custo que não dá fica vermelho. Alvo, efeitos, regras, penalidades e motivo de bloqueio ficam na dica.
- **Clones na tela**: uma cópia do retrato atrás do lutador por clone; a que recebe o golpe vira fumaça, com o aviso "clone recebeu!". O botão da técnica diz quantos clones ela cria; a dica traz a regra inteira.
- **Fortalecimento e portão**: selo no lutador com os turnos que restam; ao ativar, número flutuante e linha no log.
- **Protagonista caído**: uma faixa avisa que os suportes seguem lutando, e outra anuncia quem o levantou (ou a pílula).
- Log curto (tocar abre o histórico). Sem roleta na tela: só o resultado.
- **Menu no celular** (v0.73.0): uma bandeja fixa no pé da tela, com uma aba por grupo (Técnicas, Ativas com a contagem, Ações; Aliado caído quando há alguém no chão, já aberta). Nenhuma ação pede rolagem. A aba em que o jogador estava continua aberta no turno seguinte. Desistir fica no fim da aba de Ações, e abre uma confirmação do próprio jogo (não a do navegador), com o foco em "Continuar jogando". No PC as abas somem e os grupos aparecem todos, com título.
- **Vantagem de elemento à vista** (v0.73.0; desde a v0.77.0, só contra barreira): o botão da técnica mostra o multiplicador no escudo de quem está de pé com uma barreira (seta para cima e verde quando há vantagem, para baixo e vermelho quando só há desvantagem), e, ao escolher o alvo, cada alvo com barreira ganha uma etiqueta com o multiplicador. Sem barreira, sem seta: o elemento não muda o dano no HP. A ficha do inimigo no widescreen mostra contra o que a barreira dele é fraca e forte.
- **Ordem da rodada no celular** (v0.73.0): uma fileira de rostos pequenos abaixo das relíquias, o da vez maior.
- **Falas do roteiro**: corte de quadro que espera o toque ([visual.md](../visual.md#cena-narrativa)).
- **Widescreen** (v0.57.4, v0.57.5): à esquerda, a ordem da rodada, a ficha dos inimigos (com contra o que cada um é fraco e forte e as técnicas com o dano) e o registro recolhível; à direita, a ficha da equipe e as ações. Cada linha tem a mesma dica do lutador. Não são alvo: a escolha de alvo é no campo. Layout em [visual.md](../visual.md#celular-e-desktop). O **Desistir da jornada**, no pé das ações do protagonista, acaba a run em derrota ([run.md](run.md#salvamento)).
- Dicas: passar o mouse ou segurar o dedo numa técnica mostra a ficha dela (motivo de bloqueio, tipo, elemento, alvo, dano, precisão, efeitos, fortalecimento, custo, espera); num lutador, HP, chakra, elemento, comportamento, passiva, portão, fortalecimento, efeitos e técnicas.
- No PC, a batalha usa duas colunas (arena à esquerda, menu e log à direita) e a trilha mostra o HUD ao lado do caminho.
- **Ficha da equipe** (v0.43.0; botão Ficha do cabeçalho ou do HUD, também no meio da luta): o pergaminho da Ficha do Roleta, com uma aba por membro (o protagonista e os suportes da próxima luta). Cada aba traz classe, nível, elemento, HP e chakra (os de agora, na luta), atributos com régua, as técnicas com o dano e o custo da run (protagonista: moveset e ativas; suportes: o kit e o papel da IA) e os bônus de talentos e relíquias. A aba do protagonista mostra também a dificuldade, a recuperação por vitória, as relíquias e a bolsa.
- Pronta para sprites: cada lutador é um bloco com poses em classes CSS; uma imagem própria em `public/img/jornada/<id>.webp` substitui o retrato.
