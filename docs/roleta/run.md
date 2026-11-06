# Run do Roleta

> Implementada na v0.46.0 (Roleta enxuto II). Dados em `src/data/roleta/` (`villains.ts`, `balance.ts`, `index.ts`, `relics.ts`); regras em `src/core/roleta/run.ts`. O combate está em [combate.md](combate.md). A campanha antiga (ordem fixa, blocos, exame chunin, guru e Lição do clã) ficou como reserva: [campanha.md](campanha.md) e [reserva/README.md](../reserva/README.md).

O Roleta é o modo rápido: um ciclo curto de lutas sorteadas, sem história, que se repete cada vez mais forte.

## Ciclo

Um ciclo tem 6 lutas: **2 genin → 2 chunin → 1 jounin → 1 chefe**. Cada luta sorteia um vilão da categoria do passo, sem repetir no mesmo ciclo.

| Categoria | Vilões | Recompensa |
|---|---|---|
| Genin | Mizuki, Genin da Areia, Genin do Som, Genin da Folha, Bandido, Capanga do Gatō, Renegado da Névoa, Ninja da Grama, Ninja da Chuva | Roleta comum |
| Chunin | Haku, Jirobo, Kidomaru, Tayuya, Sakon, Irmãos Demônio, Dosu, Zaku, Kin | Roleta comum |
| Jounin | Zabuza, Gaara, Kabuto, Kimimaro, Neji | Roleta rara |
| Chefe | Orochimaru | Baú do chefe |

- Antes de **cada** luta gira a roleta de eventos; depois de cada vitória, o XP do vilão e a recompensa.
- HP e chakra seguem de uma luta para a outra. Cada vitória devolve 25% (mais as relíquias de cura); subir de nível restaura tudo.
- **Chefe**: vencer cura tudo e abre o **baú**: escolher 1 entre 3 relíquias de chefe.
- O Orochimaru do Roleta volta da derrota no máximo **1 vez** (`villains.insaneRevivesCap`), em qualquer dificuldade, porque o ciclo é curto.

### Vilões vindos da Jornada

Desde a v0.47.0, o sorteio também traz fichas só do Roleta (`roletaExtraVillains` em `src/data/roleta/villains.ts`), adaptadas dos inimigos da Jornada ([inimigos.md](../jornada/inimigos.md)) para o combate enxuto, com o retrato de lá. As fichas dos outros vilões estão em [viloes.md](../base/viloes.md).

| Vilão | Categoria | HP | Chakra | Speed | Tai/Nin/Gen | Res. física/mental | XP | Técnicas | Passiva |
|---|---|---|---|---|---|---|---|---|---|
| Bandido | genin | 70 | 0 | 9 | 8/0/0 | 7/6 | 70 | Porrete (8), Emboscada (5×2) | — |
| Capanga do Gatō | genin | 65 | 0 | 8 | 9/0/0 | 6/6 | 70 | Porrete (8), Golpe de katana (11, 75%) | — |
| Renegado da Névoa | genin | 80 | 14 | 11 | 7/9/3 | 8/8 | 70 | Kunai (8), Projétil d'Água (10, 4 ck) | — |
| Ninja da Grama | genin | 85 | 14 | 11 | 9/8/4 | 9/8 | 70 | Kunai (8), Lâmina de Grama (10, 4 ck) | — |
| Ninja da Chuva | genin | 80 | 16 | 11 | 8/7/9 | 8/9 | 70 | Agulhas do guarda-chuva (5×2), Clone da chuva (genjutsu 9, 4 ck) | — |
| Irmãos Demônio | chunin | 100 | 10 | 12 | 10/4/0 | 11/9 | 100 | Garra de corrente (9) | Cada ataque vale por 2 golpes com 60% do dano, numa roleta só |
| Dosu | chunin | 95 | 18 | 10 | 9/11/5 | 10/10 | 100 | Kunai (8), Onda do Som (11, 5 ck) | — |
| Zaku | chunin | 90 | 18 | 11 | 7/12/4 | 9/9 | 100 | Kunai (8), Ondas de ar (12, 5 ck) | — |
| Kin | chunin | 85 | 18 | 12 | 7/6/12 | 9/12 | 100 | Kunai (8), Sinos ilusórios (genjutsu 9, 4 ck) | — |
| Kimimaro | jounin | 190 | 30 | 14 | 14/6/4 | 16/12 | 220 | Dança dos ossos (7×3, 3 ck), Broca de osso (15, 4 ck) | Marca da maldição |
| Neji | jounin | 160 | 28 | 14 | 14/6/4 | 14/13 | 200 | Punho Gentil (11, 95%), 64 Palmas (4×4, 8 ck) | — |

## Modo infinito

- Vencer o chefe do 1º ciclo é a **vitória da run**: conta no histórico e nas conquistas como antes. A tela de vitória oferece **Seguir para o ciclo 2**.
- Cada ciclo novo volta aos genin com os vilões sorteados de novo e **mais fortes**: HP, ataques, resistências e dano × dificuldade × **(1 + 0,3 × ciclo)**, com o ciclo contando do 0 (`infinite.perCycle`; rascunho).
- Mantém tudo: nível, status, técnicas, relíquias, bolsa e Vontades do Fogo. Do 2º ciclo em diante, o próximo emenda sozinho.
- Cair a partir do ciclo 2 é o "Fim do modo infinito": a run segue registrada como vitória, com o ciclo e as lutas alcançados.
- Recorde no perfil (`roleta`: ciclo e lutas vencidas) e conquistas: Sem descanso (ciclo 2), Roda da fortuna (ciclo 3) e Lenda da roleta (ciclo 5).

## Eventos

| Peso | Evento | Efeito |
|---|---|---|
| 10 | Invocação | Sem animal: sorteia um e ganha o **contrato** dele (relíquia). Com animal: ele sobe de nível |
| 10 | Velhinha | O vilão age primeiro na próxima luta |
| 10 | Ramen | O jogador age primeiro na próxima luta |
| 10 | Akatsuki | Ver [campanha.md](campanha.md#akatsuki) |
| 25 | Treino | +60 de XP e a roleta de destaque de status |
| 20 | Jokenpô | Vitória: +2 estágios de status; derrota: o vilão age primeiro |
| 15 | Achou um item | Gira a roleta de itens |

## Recompensa

Um giro depois de cada vitória (o chefe abre o baú no lugar). A raridade vem da categoria.

| Fatia | Peso | Comum | Rara | Lendária |
|---|---|---|---|---|
| Estágio de status | 22 | +1 | +2 | +3 |
| XP | 20 | +60 | +120 | +200 |
| Roleta de itens | 18 | 1 giro | 2 giros | 3 giros |
| Relíquia | 15 | comum | incomum | rara |
| Resistência | 13 | +2 | +4 | +6 |
| Crítico | 12 | +2% | +4% | +6% |

Sem relíquia para sortear, a fatia Relíquia vira o XP da raridade.

## Itens

| Item | Peso | Efeito |
|---|---|---|
| Vontade do Fogo | 12 | +1 revive |
| Pergaminho de experiência | 22 | +100 de XP |
| Pílula de soldado | 20 | Consumível: +50% do chakra |
| Kit médico | 20 | Consumível: limpa os efeitos e cura 15% |
| Selo explosivo | 18 | Consumível: 15 de dano, sem roleta |
| Moeda viciada | 8 | Gira de novo uma roleta fora da luta |

Bolsa: até 3 de cada consumível (o excedente vira 30 de XP). A Ferramenta ninja, os amuletos e os Pesos de treino viraram relíquias; a Bomba de fumaça saiu (a esquiva agora é passiva).

## Relíquias

O catálogo é o mesmo da Jornada, e cada relíquia diz em que modo sai ([reliquias.md](../jornada/reliquias.md#modos)). No Roleta, elas saem da fatia **Relíquia** da recompensa e do **baú do chefe**, e não há relíquia inicial.

- Os efeitos no Roleta têm números próprios (menos lutas, um lutador só); as de equipe, ryō, clones, talento e mercador ficam só na Jornada.
- Exclusivas do Roleta: Ferramenta ninja, Amuleto de velocidade, Amuleto de resistência e os Contratos das cobras e das lesmas.
- O **Contrato dos sapos** e os **Pesos de treino** saem nos dois modos, com efeitos diferentes. No Roleta são a invocação do sapo e a mecânica de equipar e tirar.
- Contratos: um animal por vez. Com um contrato, os outros não saem.
- A barra de relíquias aparece no painel do jogador e na ficha; a dica mostra o efeito no Roleta.

## Dificuldade e histórico

- Dificuldade: a mesma da base ([campanha.md](campanha.md#dificuldade)). O Hardcore libera ao vencer a run (o 1º ciclo) no Difícil.
- Histórico (`runs_v1`): os registros novos guardam o ciclo e as lutas vencidas (`cycle`, `fights`); as abas Histórico e Origens mostram "Ciclo N · X lutas". Os registros da campanha antiga continuam mostrando a etapa.
