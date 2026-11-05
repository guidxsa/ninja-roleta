# Classes da Jornada

> Comum e prodígio na v0.36.0; Uchiha, Hyuuga, versões suporte e o easter egg do Sasuke na v0.37.0; escolha do elemento, Hyuuga sem elemento e suportes com classe e nome sorteados na v0.43.0 ([README.md](README.md)). Dados em `src/data/jornada/generic.ts` e `characters.ts`.

As classes são as protagonistas do Caminho Ninja ([caminho-ninja.md](caminho-ninja.md)). Vêm das origens do Roleta ([origens.md](../base/origens.md)), com um corte: cada classe é uma árvore de talentos inteira ([talentos.md](talentos.md)).

## Elemento: escolher ou sortear

- **Comum**: na tela de início, o jogador **escolhe** o elemento (fogo, vento, raio, terra, água ou **Prodígio**, sem elemento) ou **sorteia**. O sorteio é escondido (sem roleta na tela): os 5 elementos com peso 16 cada e **nenhum** com peso 20 (20%). **Quem sorteia ganha uma relíquia comum aleatória** no começo da run (`elementDraw.randomBonus`), mostrada na revelação.
- **Comum sem elemento é o prodígio do taijutsu**: outra ficha (só taijutsu, mais HP e speed), outra árvore e a ativa Portões no lugar do Bunshin.
- **Uchiha**: fogo fixo e um **segundo elemento** sorteado (pode sair nenhum; nunca fogo de novo). O nível I do segundo elemento também entra no kit. Não escolhe.
- **Hyuuga**: **sem elemento** (v0.43.0): luta com o Byakugan e o Punho Suave, sem técnica elemental (`noElement`).
- Com elemento, o protagonista começa com a técnica de nível I dele no moveset; no Comum, II e III vêm da árvore.
- O sorteio acontece sempre por baixo, mesmo com escolha: a mesma seed dá o mesmo mapa, os mesmos suportes e os mesmos chefes.
- Os 2 suportes sorteiam o elemento (nunca "nenhum"), a menos que a ficha tenha um fixo (Uchiha: fogo) ou seja sem elemento (Hyuuga).
- A tela de revelação mostra o elemento, a relíquia bônus (quando sorteou) e os parceiros.

## Desbloqueios

| Classe | Como libera |
|---|---|
| Comum | Inicial |
| Prodígio | Subclasse do Comum: o Comum que sai sem elemento |
| Uchiha | Vencer uma run do Caminho Ninja no Médio ou acima com um Comum de fogo (conquista *Chama do clã*) |
| Hyuuga | Vencer uma run do Caminho Ninja no Médio ou acima com o prodígio (conquista *Olhos abertos*) |

Na tela de início, a classe trancada aparece com cadeado e a condição. Com a escolha do elemento (v0.43.0), dá para mirar direto no Comum de fogo ou no prodígio.

## Ativas de classe

| Classe | Ativa | Efeito |
|---|---|---|
| Comum | Bunshin | 1 clone (3 de chakra) |
| Prodígio | Portões | Abre, troca ou fecha um dos 5 portões: dano maior com desgaste de HP por turno ([combate.md](combate.md#portões)) |
| Uchiha | Sharingan | Fortalece: +15% de acerto e +15% de esquiva por 3 turnos (3 de chakra, espera 4) |
| Hyuuga | Byakugan | Fortalece: não erra e +20% de penetração por 3 turnos (3 de chakra, espera 4) |

Ativas de classe não gastam o turno: saem junto com a ação, uma por turno ([combate.md](combate.md#turno)). Fortalecimento: um bônus temporário em quem usa (dano, acerto, esquiva, penetração) que dura os turnos indicados, contando o da ativação; usar de novo renova.

## Suportes genéricos (versão suporte)

- Cada um dos 2 parceiros sorteia a **classe** entre as liberadas (Comum sempre; Uchiha e Hyuuga pelas conquistas), **inclusive a do protagonista**, depois uma das **fichas** da classe que o outro parceiro não pegou, e um **nome** da lista da classe (v0.43.0; nomes originais, sem personagens do mangá).
- Fichas de suporte (2 por classe, para dois parceiros da mesma classe não repetirem): Comum — atacante (Kunai, Shuriken) e tática (Kunai, Armadilha de fios, Kai); Uchiha — atacante (Kunai, Ilusão dos corvos) e tática (Shuriken, Armadilha de fios), fogo fixo; Hyuuga — guardiã (Palma Suave, Rotação, Kunai) e atacante (Palma Suave, Shuriken, Palma do Vácuo), sem elemento.
- O nome leva o clã: Comum só o nome ("Daichi"); Uchiha e Hyuuga com o sobrenome ("Kaede Uchiha", "Sei Hyuuga"). Saves antigos, sem nome sorteado, usam o nome da ficha (Daichi, Hana, Ren Uchiha, Mio Hyuuga).
- Versão suporte: ficha menor que a de protagonista, sem árvore, sobe de nível com o protagonista ([personagens.md](personagens.md)).

## Easter eggs

- **Sasuke**: um Uchiha que sorteou **raio** como segundo elemento tem o ramo **Raio** na árvore (escondido para os outros), com o Chidori. Aprender o Chidori libera de vez a conquista secreta *Mil pássaros*, que abre:
  - o **ramo Sasuke** da árvore do Uchiha (Combo do Leão, Lâmina de raio, Vingador, Selo amaldiçoado), em toda run de Uchiha;
  - o **visual do Sasuke** (retrato com a roupa azul), escolhido na tela de início para runs de Uchiha.
- Antes de liberado, o ramo Sasuke aparece como "???".
