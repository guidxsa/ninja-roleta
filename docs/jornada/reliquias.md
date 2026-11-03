# Relíquias

> Implementadas na v0.35.0; nomes genéricos, 22 novas e a barra de relíquias na v0.38.0 ([README.md](README.md)). Dados em `src/data/jornada/relics.ts`.

- Dão **vantagens passivas** para a run toda ou **recursos** na hora (kits, Vontade do Fogo).
- Tiers: **inicial** (toda run começa com ela, nunca sai em sorteio), comum, rara e lendária. Uma run não repete relíquia.
- De onde vêm:
  - **Tesouro**: sorteio escondido (comum 40, rara 50, lendária 10).
  - **Mercador**: 3 à venda, sorteadas (comum 60, rara 35, lendária 5), por 40/80/150 ryō.
  - **Chefe**: escolher 1 entre 3 lendárias.
  - **Eventos**: algumas escolhas dão uma relíquia de um tier ([historia.md](historia.md#eventos)).
- Os itens permanentes do Roleta viraram relíquias (Pesos de treino). A bolsa de consumíveis continua à parte ([combate.md](combate.md#bolsa)).
- Saem tanto na História quanto no Caminho Ninja, então o texto não cita personagem: efeito sem sujeito vale para o protagonista; "a equipe" inclui o protagonista; "os suportes" são só os aliados. Os nomes de artefatos marcantes (Sino do Kakashi, Colar do Primeiro Hokage, Chapéu do Hokage, Cachimbo do Gamabunta…) ficam.
- O desconto do mercador soma o das relíquias com o do Tazuna (História, País das Ondas), com teto de 40% (`shop.maxDiscount`).

## Na tela

- **Barra de relíquias** no HUD: um ícone por relíquia, com a borda na cor da raridade (inicial laranja, comum neutra, rara azul, lendária dourada). Rola de lado quando não cabe. Segurar (ou passar o mouse) mostra a dica; tocar abre o painel com ela em destaque. A relíquia nova entra com um brilho.
- **Painel**: grade agrupada por raridade; tocar num ícone mostra nome, raridade e efeito embaixo.
- **Na luta**: fileira pequena no topo. Brilham no começo da luta as que agem ali (dano de abertura, escudo, clones) e, na vitória, as que curam.
- **Tesouro**: um baú que treme e abre, revelando a relíquia. **Chefe**: as 3 lendárias lado a lado; tocar destaca, o botão confirma. **Mercador**: prateleira com etiqueta de preço; tocar mostra o efeito e o botão de compra.
- Ícones em `prototype/jornada/relicIcons.ts` (um por relíquia; `tests/jornada.test.ts` confere).

| Relíquia | Tier | Efeito |
|---|---|---|
| Tigela do Ichiraku | Inicial | Cada vitória recupera 25% do HP e do chakra de toda a equipe do estágio (quem lutou e terminou de pé e quem ficou de fora) |
| Óculos de aprendiz | Comum | +5% de acerto |
| Bandana da Folha | Comum | +10 de HP máximo |
| Carteira de sapo | Comum | +25% de ryō |
| Bolsa de kunai | Comum | +2 de dano no taijutsu |
| Cupom do Ichiraku | Comum | Cada vitória recupera 10% a mais (soma com a Tigela) |
| Pesos de treino | Comum | +2 de speed |
| Pílulas de soldado | Comum | +6 de chakra máximo |
| Kit médico | Comum | Na hora: 2 kits de HP e 1 de chakra |
| Faixas de mão | Comum | +10% de dano de taijutsu |
| Fio de aço | Comum | Esquiva 5% dos golpes |
| Cantil de campanha | Comum | +10% de HP máximo dos suportes |
| Sacola de ervas | Comum | Recupera 2% do HP por rodada |
| Selos em branco | Comum | Na hora: 2 kits de chakra |
| Moeda da sorte | Comum | Na hora: +60 ryō |
| Caderno de treino | Comum | +15% de XP |
| Ficha do mercador | Comum | O mercador cobra 15% a menos |
| Pergaminho proibido | Rara | Técnicas de clone criam 1 clone a mais |
| Sino do Kakashi | Rara | +10% de crítico |
| Selos explosivos | Rara | Começo de cada luta: 10 de dano em todos os inimigos |
| Máscara de caçador | Rara | A equipe esquiva 6% dos golpes |
| Cabaça de areia | Rara | A equipe começa as lutas com escudo de 10% do HP |
| Contrato dos sapos | Rara | +15% de dano de ninjutsu |
| Pílulas de reanimação | Rara | Na hora: 2 Pílulas de reanimação |
| Bandana rasgada | Rara | Abaixo de 50% do HP, +25% de dano |
| Pergaminho de invocação | Rara | Começa as lutas com 1 clone |
| Leque de guerra | Rara | A equipe causa +10% de dano de ninjutsu |
| Estojo de senbon | Rara | A equipe ganha +5% de crítico |
| Selo de armazenamento | Rara | Na hora: 2 kits de HP e 1 Pílula de reanimação |
| Pedra de chakra | Rara | As técnicas custam 1 de chakra a menos |
| Tambor de guerra | Rara | A equipe ganha +5% de acerto |
| Diário do mestre | Rara | Na hora: +1 ponto de talento |
| Colar do Primeiro Hokage | Lendária | +1 Vontade do Fogo |
| Selo de contenção | Lendária | Recupera 4% do HP por rodada |
| Chapéu do Hokage | Lendária | +15% de dano da equipe |
| Bandana dos Sannin | Lendária | +25% de HP máximo dos suportes |
| Cachimbo do Gamabunta | Lendária | As técnicas custam 2 de chakra a menos |
| Lâmina de chakra | Lendária | +25% de dano |
| Armadura samurai | Lendária | A equipe começa as lutas com escudo de 20% do HP |
| Pergaminhos do Céu e da Terra | Lendária | Na hora: +2 pontos de talento |
| Lótus eterna | Lendária | A equipe recupera 3% do HP por rodada |
| Bolsa sem fundo | Lendária | +50% de ryō e o mercador cobra 25% a menos |
| Pena de fênix | Lendária | Uma vez por luta, ao cair, fica com 1 de HP |

Simulação (`npm run sim:jornada -- 500 2`, Médio) antes → depois das 22 novas (v0.38.0): História 77 → 78%; Caminho Ninja Comum 37 → 36%, Uchiha 46 → 45%, Hyuuga 52 → 51%. Difícil de 2–6% para 4–7%. As novas diluem o sorteio tanto quanto somam; os números são rascunho.
