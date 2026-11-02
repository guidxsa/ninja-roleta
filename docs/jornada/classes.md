# Classes da Jornada

> Comum e prodígio na v0.36.0; Uchiha, Hyuuga, versões suporte e o easter egg do Sasuke na v0.37.0 ([README.md](README.md)). Dados em `src/data/jornada/generic.ts` e `characters.ts`.

As classes são as protagonistas das runs genéricas ([generica.md](generica.md)). Vêm das origens do Roleta ([origens.md](../base/origens.md)), com um corte: cada classe é uma árvore de talentos inteira ([talentos.md](talentos.md)).

## Sorteio do elemento

- Ao começar uma run genérica, um sorteio escondido (sem roleta na tela) define o elemento do protagonista: fogo, vento, raio, terra e água com peso 16 cada, e **nenhum** com peso 20 (20%) quando a classe permite.
- **Comum sem elemento vira prodígio do taijutsu**: outra ficha (só taijutsu, mais HP e speed), outra árvore e a ativa Portões no lugar do Bunshin.
- **Uchiha**: fogo fixo e um **segundo elemento** sorteado (pode sair nenhum; nunca fogo de novo). O nível I do segundo elemento também entra no kit.
- **Hyuuga**: sorteia um elemento (nunca nenhum).
- Com elemento, o protagonista começa com a técnica de nível I dele no moveset; no Comum, II e III vêm da árvore.
- Os 2 suportes também sorteiam o elemento (nunca "nenhum"), a menos que a ficha tenha um fixo (Ren Uchiha: fogo).
- A tela mostra o resultado logo depois do sorteio, com os parceiros.

## Desbloqueios

| Classe | Como libera |
|---|---|
| Comum | Inicial |
| Prodígio | Subclasse do Comum: o Comum que sai sem elemento |
| Uchiha | Vencer uma run genérica no Médio ou acima com um Comum de fogo (conquista *Chama do clã*) |
| Hyuuga | Vencer uma run genérica no Médio ou acima com o prodígio (conquista *Olhos abertos*) |

Na tela de início, a classe trancada aparece com cadeado e a condição.

## Ativas de classe

| Classe | Ativa | Efeito |
|---|---|---|
| Comum | Bunshin | 1 clone (3 de chakra) |
| Prodígio | Portões | Fortalece: dano ×1,3 por 3 turnos, paga 8% do HP (espera 4) |
| Uchiha | Sharingan | Fortalece: +15% de acerto e +15% de esquiva por 3 turnos (3 de chakra, espera 4) |
| Hyuuga | Byakugan | Fortalece: não erra e +20% de penetração por 3 turnos (3 de chakra, espera 4) |

Fortalecimento: um bônus temporário em quem usa (dano, acerto, esquiva, penetração) que dura os turnos indicados; usar de novo renova ([combate.md](combate.md)).

## Suportes genéricos (versão suporte)

- Os parceiros saem de um sorteio: Daichi e Hana (Comuns) sempre entram no sorteio; cada classe liberada traz a sua versão suporte (Ren Uchiha, IA atacante, fogo fixo; Mio Hyuuga, IA guardiã). A própria classe do protagonista não entra.
- Versão suporte: ficha menor que a de protagonista, sem árvore, sobe de nível com o protagonista ([personagens.md](personagens.md)).

## Easter eggs

- **Sasuke**: um Uchiha que sorteou **raio** como segundo elemento tem o ramo **Raio** na árvore (escondido para os outros), com o Chidori. Aprender o Chidori libera de vez a conquista secreta *Mil pássaros*, que abre:
  - o **ramo Sasuke** da árvore do Uchiha (Combo do Leão, Lâmina de raio, Vingador, Selo amaldiçoado), em toda run de Uchiha;
  - o **visual do Sasuke** (retrato com a roupa azul), escolhido na tela de início para runs de Uchiha.
- Antes de liberado, o ramo Sasuke aparece como "???".
