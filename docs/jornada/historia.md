# História do Naruto

> Implementada na v0.35.0 ([README.md](README.md)). Dados em `src/data/jornada/stages.ts` e `events.ts`.

A história do mangá, do Mizuki ao Vale do Fim. **Linear**: sem ramificação nem escolha de caminho (o mapa ramificado é do Caminho Ninja, [run.md](run.md#mapa-ramificado)). Liberada desde o início.

## Estágios

São quatro arcos, um por estágio (v0.58.0): **País das Ondas, Exame chunin, Sannin e Vale do Fim**. Cada arco tem uma arte própria (as vagas `arco-*` de [visual.md](../visual.md#vagas-de-ilustração)). A campanha é a perspectiva do Naruto, o dia da dualidade; a do Sasuke, a noite, está em design em [historia-sasuke.md](historia-sasuke.md).

Desde a v0.68.0, a História segue a **jornada do Naruto**: entra o que ele vive, presencia ou descobre. As lutas de outros personagens que ele não protagoniza (os duelos do Quarteto do Som, os Sannin em Tanzaku) viram cenas presenciadas. **Cada parada, na ordem, com categoria, acontecimento, mecânica e recompensa, está em [cronologia.md](cronologia.md)**, a fonte única. Os roteiros das lutas (falas, formas, fases) seguem [roteiro.md](roteiro.md).

- Cada estágio é uma sequência fixa de paradas; a última luta de cada um é o chefe. Depois do chefe pode vir uma cena (o adeus ao Haku, os três Sannin, a volta a Konoha).
- Categorias das paradas: combate, chefe, **presenciado** (cena sem escolha, com efeito fixo), **narrativo** (2 reações do Naruto), **treino** (minijogo; às vezes dá um marco), descanso e tesouro. A tela do evento mostra a categoria.
- A árvore de talentos decide *como* o Naruto cresce, nunca *se* os momentos fundamentais acontecem ([roteiro.md](roteiro.md)).

## Vitórias especiais

- **Teste do sino**: **derrota inevitável, em campo** (v0.70.0). Ninguém pega o sino: o Kakashi derruba a Sakura (75% do HP dele), o Sasuke (50%) e o Naruto (25%, ou na rodada 5), e a luta termina. A tela diz "Lição", não "Derrota"; não gasta Vontade do Fogo nem encerra a run, e a equipe sai como entrou. Detalhes em [roteiro.md](roteiro.md#exemplo-o-teste-do-sino).
- **Orochimaru na Floresta da Morte**: aguentar 4 rodadas, ou levar o HP dele a 80%, vence.
- **Kabuto**: só cai com o Rasengan (finalizador, [roteiro.md](roteiro.md#condições-de-vitória)).
- **Hospital**: aguentar 5 rodadas de pé, ou levar o HP do Sasuke a 50%, vence (o Kakashi interrompe).
- **Kimimaro**: na rodada 4, ou com o Kimimaro a 50%, o Lee chega e manda o Naruto seguir: a luta termina como vitória.
- **Vale do Fim**: com o Sasuke a 20%, o Rasengan e o Chidori se chocam e a luta termina como vitória; o Sasuke parte.
- As outras lutas se vencem derrubando todos os inimigos.

Runs salvas antes da cronologia nova voltam na primeira parada que ainda faltava, pelo id da parada (`withJourney`, `src/state/jornadaSave.ts`).
