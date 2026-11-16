# Diagnóstico de balanceamento (Etapa 1)

Auditoria quantitativa pedida pela proposta de balanceamento (15/11/2026), sobre a v0.77.0. **Nenhum número do jogo mudou nesta etapa.** Como rodar cada medida e a linha de base completa: [benchmark.md](benchmark.md).

## Como ler

- Todos os números saem do bot da simulação, que joga pior que um humano: o do Roleta usa a ativa logo e quase não defende; o da Jornada compra a relíquia mais barata e um kit de HP abaixo de 50%, não atualiza a prateleira nem compra tratamento, escolhe a primeira relíquia do chefe e a primeira opção dos eventos. Conclusões sobre **economia** dependem desse bot.
- 300 ou 400 runs por medida. Diferenças abaixo de uns **7 pontos** entre duas medidas podem ser só ruído.
- Alvo combinado (`docs/decisoes.md`): bot no Médio com 60–70% (kits complexos 50–60%).

## 1. Onde estamos

| Modo | Fácil | Médio | Difícil | Hardcore |
|---|---|---|---|---|
| Roleta, Comum | 83% | 48% | 16% | 12% |
| Roleta, Prodígio | 98% | 87% | 62% | 52% |
| Roleta, Uchiha / Hyuuga | 80% / 79% | 34% / 43% | 10% / 12% | 10% / 6% |
| História | 100% | 97% | 68% | 12% |
| Caminho Ninja (Comum, prodígio, Uchiha, Hyuuga) | 99–100% | 80 / 89 / 74 / 81% | 53 / 49 / 34 / 43% | 11–13% |

O Roleta está espalhado demais entre origens; a Jornada está acima do alvo no Médio, sobretudo a História.

## 2. Problemas encontrados

### P1. A dificuldade da Jornada está toda no começo (prioridade máxima)
**Evidência** (auditoria por estágio, Médio):

| | Estágio 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| História: dano dado / recebido por rodada | 47 / 22 | 71 / 30 | 62 / 6 | 99 / 15 |
| História: HP do protagonista ao entrar | 93% | 83% | 98% | 96% |
| Caminho Ninja, Comum: dano dado / recebido | 53 / 20 | 78 / 22 | 96 / 21 | — |

- Quase todas as derrotas acontecem no estágio 1 ou 2: Haku, Trio da Chuva, Neji e Kiba na História; lutas e elites do estágio 1 no Caminho Ninja (no Hardcore, 29% das runs caem numa luta comum do estágio 1).
- Nos estágios 3 e 4 da História o time recebe de 6 a 15 de dano por rodada e causa de 60 a 100: o crescimento do jogador passa muito o dos inimigos.
- **Consequência:** subir ou baixar a força global dos inimigos (`enemyStrength`, `storyStrength`) mexe ao mesmo tempo no começo, que já é o gargalo, e no fim, que já é fácil. O ajuste certo é **por estágio**.

### P2. O desgaste só pesa no Difícil, e só no começo
- O protagonista entra nas lutas com 83% a 98% do HP no Médio, e de 78% a 98% no Difícil.
- Derrotas por run, "por desgaste" (entrou abaixo de 50% do HP) contra "de frente":
  - Médio: perto de zero nas duas.
  - Difícil: o desgaste aparece no começo (Uchiha, estágio 1: 0,3 contra 0,1; História, estágio 2: 0,1 contra 0,2).
  - Hardcore: quase tudo de frente (0,5 a 0,7 por run no estágio 1).
- Kits usados: 1 a 2 por estágio. Vontade do Fogo: 0,0 a 0,5 por estágio.
- **Consequência:** a cura de 10% ao subir de nível (Etapa 2.2 da proposta) ajudaria só no começo do Difícil, e deixaria o fim da Jornada, que já é fácil, mais fácil. Recomendo esperar o ajuste por estágio (P1) antes de decidir.

### P3. Relíquias de equipe dominam; as situacionais valem quase nada
Valor marginal (vitória com a relíquia desde o começo, menos a linha de base; Difícil; média de História e Comum):

| Classificação | Média | Mais fortes | Quase nada (≤ 1) |
|---|---|---|---|
| Comum | +3 | Caderno de treino +5,9, Fio de aço +5,6, Bolsa de kunai +5,4 | Colete acolchoado −0,1, Cobertor de campanha +0,5, Bolsa reforçada +0,6, Pílulas de soldado +1,0 |
| Incomum | +6 | Cupom do Ichiraku +11,6, Bandana rasgada +10,6, Pílulas de reanimação +10,5, Selo de armazenamento +10,4 | Frasco de toxina 0,0, Linha de sombra 0,0, Diário do mestre +0,8 |
| Rara | +9 | Cabaça de areia +18,0, Amuleto da longevidade +14,5, Pacto de sangue +13,8, Máscara de caçador +13,3 | Incenso dos sonhos +0,6 |
| Chefe | +15 | **Armadura samurai +30,8**, Manto de Kage +23,4, Lâmina de chakra +22,8, Lótus eterna +19,3 | — (as mais fracas: Bolsa sem fundo +5,6, Pergaminhos do Céu e da Terra +5,9, Talismã da Vontade do Fogo +8,8) |
| Loja | — | Carta de recomendação +15,5, Encomenda do ferreiro +12,6 | Selo de cliente +0,8, Sino do mercador +1,1 |
| Evento | — | Cartão fidelidade do ramen +14,6, Anel estranho +12,1, Carta de fã +12,1 | — |

- O que mais pesa é **escudo, regeneração, esquiva ou dano na equipe inteira**: o efeito vale três vezes.
- O que menos pesa é o **situacional**: genjutsu, alvo atordoado, chance de efeito, clones fora do Naruto, ryō, bolsa e descanso.
- A raridade quase não ordena o poder dentro de cada faixa: há comuns acima de raras (Bolsa de kunai acima de Incenso dos sonhos e do Contrato dos sapos).
- XP vale muito (Carta de recomendação e Caderno de treino estão entre as melhores da faixa delas). O nível pesa no resultado.

### P4. O Roleta está espalhado entre origens pelo dano
| Origem (Médio) | Vitória | Dano dado por rodada (genin → chefe) |
|---|---|---|
| Prodígio | 87% | 40 → 42 (até 49 contra jounin) |
| Inuzuka | 70% | 29 → 29 |
| Akimichi | 72% | 22 → 23 |
| Comum | 48% | 21 → 25 |
| Uzumaki | 65% | 18 → 22 |
| Hyuuga | 43% | 17 → 22 |
| Uchiha | 34% | 20 → 21 |

- O dano recebido é parecido entre as origens (7 a 18 por rodada). Quem vence mais é quem bate mais.
- As lutas de chefe são longas: 12 a 16 rodadas. O Orochimaru é onde a maioria para.
- O Senju vence 85% com dano mediano porque usa 1,0 Vontade do Fogo por run: o extra de revive dele carrega a run.

### P5. A Vontade do Fogo e a regeneração mandam no Roleta
Valor marginal no Roleta (Comum, Médio, base 46,8%):
- **Talismã da Vontade do Fogo +25,5**; Selo de contenção +18,8; Cupom do Ichiraku +16,5; Sacola de ervas +12,8.
- Contratos: sapos +19,8, cobras +16,5, lesmas +12,0.
- Quase nada: Óculos de aprendiz +0,5, Reserva de chakra +1,5, Selos explosivos +3,0, Incenso dos sonhos +3,3 (o Comum não tem genjutsu), Núcleo de chakra +4,0 (sendo de chefe).
- Pesos de treino −7: o bot equipa e nunca tira. É defeito do bot, não da relíquia.

Revive extra e cura por rodada valem muito porque as lutas de chefe são longas.

### P6. Iniciais das classes: o Uchiha depende da dele, e a evolução do Hyuuga vale pouco
Vitória sem a inicial · com a inicial · com a evolução desde o começo:

| Classe | Médio | Difícil |
|---|---|---|
| Comum (Manual → Colete de chunin) | 78 · 83 · 88 | 43 · 50 · 62 |
| Prodígio (Macacão → Macacão da Juventude) | 86 · 89 · 94 | 45 · 50 · 67 |
| Uchiha (Leque → Brasão) | 66 · **74** · 82 | 29 · 35 · 49 |
| Hyuuga (Punho Suave → Oito Trigramas) | 77 · 80 · 85 | 40 · 44 · **45** |

- O Uchiha perde 7,5 pontos sem a inicial: é a classe que mais depende dela.
- A evolução do Hyuuga dá +2 no Difícil, contra +12 a +17 das outras. O princípio da proposta ("prêmio, não condição") está quebrado nos dois sentidos.

### P7. Pontos de talento: classes recebem a metade do Naruto
- História (Médio): uns **34 pontos** por run. As classes do Caminho Ninja: **15 a 18**.
- A diferença vem das lutas de história, que dão 1 ponto cada.
- As árvores das classes são menores (item 29 de `docs/decisoes.md`), então fecham só no modo infinito. Uma árvore com bifurcações (Etapa 3) precisa considerar esse orçamento.
- Árvore do Naruto (builds focadas): diferença entre o melhor e o pior ramo de **4,7 pontos no Médio e 12 no Difícil**. Pegadinhas é o mais fraco (62% no Difícil, parado no Trio da Chuva); Clones e Laços os mais fortes (74%). Algumas builds de combinação dão o mesmo número de um ramo só: a medida não consegue focar ramos cuja raiz vem da história. É limite da simulação.

### P8. Chakra: o Hyuuga sobra, o prodígio aperta
- Chakra do protagonista ao entrar na luta (Médio): **Hyuuga 92–97%**, prodígio 54–66%, Comum e Uchiha 71–81%.
- O kit do Hyuuga quase não gasta chakra, então relíquias de chakra não fazem nada por ele.

### P9. Todos os multiplicadores de dano se multiplicam entre si
Nos dois modos, cada fonte de dano multiplica a outra (`mergeMods` e `attackerMult` em `src/core/jornada/battle.ts`, `relicEffects` em `src/core/roleta/run.ts`). Exemplo de teto teórico do Rasengan do Naruto:

| Grupo | Fontes | Produto |
|---|---|---|
| Dano geral | Lâmina de chakra ×1,25, Chapéu do Hokage ×1,15, Kunai do mestre ×1,10, Proteger os amigos ×1,06 | ×1,68 |
| Da técnica | Rasengan nível 3 (×1,15²), Domínio ×1,25, Rotação estável ×1,10, talento final ×1,15, Rasengan da Kyuubi ×1,20 | ×2,51 |
| Do tipo | Contrato dos sapos ×1,15, Leque de guerra ×1,10 | ×1,27 |
| HP baixo | Pacto de sangue ×1,35, Bandana rasgada ×1,25, Colar ×1,30, Explosão ×1,20, Chakra vermelho ×1,10, Rasengan da Kyuubi ×1,15 | ×3,33 |
| Momento | Uma cauda ×1,35 | ×1,35 |

No total, até ~24× sobre a parte "base + ataque − resistência". Ninguém junta tudo numa run, mas no **modo infinito** (×1,5 por ciclo nos inimigos) é esse empilhamento que decide quem passa. Antes de mexer na curva do infinito (Etapa 4), vale decidir se alguns grupos passam a **somar** em vez de multiplicar (por exemplo, todo "+x% de dano geral" somando entre si).

### P10. Economia: não dá para concluir com o bot de hoje
- O bot ganha e gasta praticamente o mesmo ryō por estágio (História no Médio: 236 de entrada e 168 de saída no estágio 1; 205 e 192 no 4). Compra 3 a 5 coisas por estágio.
- O estágio 3 da História rende pouco (64 ryō), porque tem poucas lutas.
- Como o bot gasta tudo na relíquia mais barata, subir o ryō (Etapa 2.1) só vai mostrar "mais relíquias baratas". Para medir loja, atualização e tratamento, o bot precisa decidir como um jogador.
- Relíquias de economia (Carteira de sapo, Bolsa sem fundo, Contrato comercial) ficam entre as mais fracas, mas isso também reflete o bot.

### P11. Consumíveis do Roleta quase não aparecem
Itens usados: 0,01 a 0,05 por luta. O bot só usa nos apertos e a roleta de itens dá poucos. Hoje os consumíveis não pesam no balanceamento do Roleta.

### P12. Docs desatualizados (só apontados)
- `docs/jornada/progressao.md`: a seção "Futuro (Caminho Ninja)" descreve árvores que já existem.
- `docs/base/progressao.md`: a "Curva planejada" é da campanha clássica (Mizuki, exame), não do ciclo do Roleta.

## 3. Recomendações por prioridade

| Prioridade | Recomendação | Etapa | Evidência |
|---|---|---|---|
| 1 | Força dos inimigos da Jornada **por estágio**: aliviar os picos do estágio 1–2 (Haku, Trio da Chuva, primeiras lutas do Caminho Ninja) e endurecer os estágios 3–4, em vez de mexer no multiplicador global. Objetivo: Médio na faixa de 60–70% com a dificuldade espalhada pela run. | 4 | P1, P2 |
| 1 | Revisar as relíquias de equipe mais fortes (Armadura samurai, Manto de Kage, Lâmina de chakra, Cabaça de areia, Lótus eterna, Amuleto da longevidade) e refazer as que valem quase nada (Frasco de toxina, Linha de sombra, Incenso dos sonhos, Colete, Cobertor, Bolsa reforçada, Diário, Selo de cliente, Sino do mercador). | 3 | P3 |
| 1 | Roleta: aproximar o dano das origens (subir Uchiha, Hyuuga e Comum ou descer o Prodígio), olhando a origem e não o vilão. | 3 | P4 |
| 2 | Roleta: reavaliar o peso da Vontade do Fogo (Talismã, Senju) e da regeneração; considerar encurtar as lutas de chefe. | 3 | P4, P5 |
| 2 | Iniciais: reforçar a evolução do Hyuuga e diminuir a dependência do Uchiha (mover parte do poder do Leque para o kit). | 3 | P6 |
| 2 | XP da Jornada (100 + 30 por nível): testar **junto** com a força por estágio. Sozinho, subiria ainda mais um Médio que já está em 97%. | 2 | P1, P3 |
| 3 | Antes de mexer no ryō, ensinar o bot a usar a loja como um jogador (atualizar a prateleira, comprar tratamento, escolher relíquia pela build). | 2 | P10 |
| 3 | Decidir se os multiplicadores de dano de mesma natureza passam a somar, antes da curva nova do infinito. | 4 | P9 |
| 3 | Cura de 10% ao subir de nível: decidir depois do ajuste por estágio (hoje ajudaria só no começo do Difícil). | 2 | P2 |
| 3 | Corrigir os docs desatualizados na Etapa 5. | 5 | P12 |
| — | Itens que já estavam em aberto e entram nesta fila: Hyuuga do Roleta a 43% e Jornada acima do alvo (item 33), Roleta fora do alvo (item 1), árvores das classes (item 29), infinito (item 3). | — | — |
