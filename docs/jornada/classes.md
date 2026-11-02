# Classes da Jornada

> Comum e prodígio implementados na v0.36.0; Uchiha e Hyuuga vêm na v0.37.0 ([README.md](README.md)). Dados em `src/data/jornada/generic.ts` e `characters.ts`.

As classes são as protagonistas das runs genéricas ([generica.md](generica.md)). Vêm das origens do Roleta ([origens.md](../base/origens.md)), com um corte: cada classe é uma árvore de talentos inteira ([talentos.md](talentos.md)).

## Sorteio do elemento

- Ao começar uma run genérica, um sorteio escondido (sem roleta na tela) define o elemento do protagonista: fogo, vento, raio, terra e água com peso 16 cada, e **nenhum** com peso 20 (20%).
- **Comum sem elemento vira prodígio do taijutsu**: outra ficha (só taijutsu, mais HP e speed), outra árvore e a ativa Portões no lugar do Bunshin.
- Com elemento, o Comum começa com a técnica de nível I dele no moveset; II e III vêm da árvore.
- Os 2 suportes também sorteiam o elemento (nunca "nenhum") e ganham o nível I.
- A tela mostra o resultado logo depois do sorteio, com os parceiros.

## Desbloqueios

| Classe | Como libera |
|---|---|
| Comum | Inicial |
| Prodígio | Subclasse do Comum: o Comum que sai sem elemento |
| Uchiha | Vencer uma run genérica no Médio ou acima com um Comum de fogo (conquista *Chama do clã*) |
| Hyuuga | Vencer uma run genérica no Médio ou acima com o prodígio (conquista *Olhos abertos*) |

Na v0.36.0, Uchiha e Hyuuga aparecem com cadeado na tela de início; as conquistas que os liberam já contam.

## Ativas de classe

| Classe | Ativa | Efeito |
|---|---|---|
| Comum | Bunshin | 1 clone (3 de chakra) |
| Prodígio | Portões | Fortalece: dano ×1,3 por 3 turnos, paga 8% do HP (espera 4) |

Fortalecimento: um bônus temporário em quem usa (dano, acerto, esquiva, penetração) que dura os turnos indicados; usar de novo renova ([combate.md](combate.md)).

## Suportes genéricos (versão suporte)

- Daichi (atacante, IA striker) e Hana (tática, IA tactician): fichas menores que as de protagonista, sem árvore, sobem de nível com o protagonista ([personagens.md](personagens.md)).
- Futuro: suportes das classes liberadas (versão suporte de Uchiha, Hyuuga e prodígio).

## Easter eggs (v0.37.0)

- Uchiha que sorteia raio e aprende o Chidori libera de vez a personalização "Sasuke" e um ramo extra da árvore.
