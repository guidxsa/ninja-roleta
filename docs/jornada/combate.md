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
3. O lutador age. O protagonista escolhe:
   - **técnica** do moveset ou ativa de classe, tocando no alvo (inimigo ou aliado; técnicas em todos os inimigos e em si não pedem alvo);
   - **Defender**: usa a resistência inteira (100% no lugar de 50%) até o próximo turno dele;
   - **Concentrar**: recupera 25% do chakra máximo;
   - **Levantar** um aliado caído: gasta o turno, ele volta com 50% do HP;
   - **item da bolsa**: não gasta o turno, um por turno (ver abaixo).
4. Fim do turno: efeitos e esperas descontam 1.

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
- **Clones** (Kage Bunshin): cada golpe de alvo único tem 50% de chance de acertar um clone no lugar do dono (o clone some). No máximo 5 clones.
- **Kai** e **Palma mística** tiram atordoar e bloqueio de chakra.

## Cair e levantar

- Quem chega a 0 de HP cai: perde efeitos, escudo e clones.
- **Protagonista caído é derrota**, mesmo com suportes de pé. Fúria da Kyuubi (talento) segura o Naruto com 1 de HP uma vez por luta.
- Levantar: ação de turno (do protagonista ou de um suporte tático/curandeiro) ou Pílula de reanimação (item). Volta com 50% do HP.

## Bolsa

Itens não gastam o turno, mas é um por turno. Limite de 5 na bolsa.

| Item | Efeito |
|---|---|
| Kit de HP | Cura 35% do HP de um aliado |
| Kit de chakra | Recupera 40% do chakra de um aliado |
| Pílula de reanimação | Levanta um aliado caído com 50% do HP |

## Moveset

- **4 técnicas** equipadas, mais as **ativas de classe** numa área separada (Kage Bunshin, Manto da Kyuubi).
- O moveset fica salvo entre as lutas; editar (botão Moveset na trilha) é opcional. Técnica nova da árvore entra sozinha se houver espaço.

## Vitória e derrota

- Vence quem derruba todos os inimigos, ou cumpre a vitória especial da luta ([historia.md](historia.md#vitórias-especiais)).
- Derrota acaba a run. No **Fácil**, a Vontade do Fogo (1 por run, ou por relíquia) recomeça a luta com a equipe em pelo menos 50% do HP e do chakra.

## Interface

- Tela dedicada: cenário por estágio, inimigos em cima, equipe embaixo, retratos com barras de HP e chakra e ícones de efeito.
- Entrada com varrida de pergaminho; cada evento do log anima (avançar no ataque, tremer ao tomar dano, número flutuante, brilho do elemento, cair e levantar), inclusive quando os suportes e os inimigos agem. O modo instantâneo encurta tudo.
- Log curto (tocar abre o histórico). Sem roleta na tela: só o resultado.
- Dicas: passar o mouse ou segurar o dedo numa técnica mostra a ficha dela (tipo, elemento, alvo, dano, precisão, efeitos, custo, espera); num lutador, HP, chakra, elemento, comportamento, passiva, efeitos e técnicas.
- No PC, a batalha usa duas colunas (arena à esquerda, menu e log à direita) e a trilha mostra o HUD ao lado do caminho. O botão Ficha (do Roleta) some na Jornada.
- Pronta para sprites: cada lutador é um bloco com poses em classes CSS; uma imagem própria em `public/img/jornada/<id>.webp` substitui o retrato.
