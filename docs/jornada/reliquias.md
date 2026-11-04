# Relíquias

> Implementadas na v0.35.0; 22 novas e a barra de relíquias na v0.37.1; classificações, relíquia de elite, iniciais por personagem, evoluções e coleção na v0.40.0 ([README.md](README.md)). Dados em `src/data/jornada/relics.ts`.

- Dão **vantagens passivas** para a run toda ou **recursos** na hora (kits, Vontade do Fogo). Uma run não repete relíquia.
- Saem tanto na História quanto no Caminho Ninja, então o texto não cita personagem: efeito sem sujeito vale para o protagonista; "a equipe" inclui o protagonista; "os suportes" são só os aliados. Os nomes de artefatos marcantes (Sino do Kakashi, Colar do Primeiro Hokage, Chapéu do Hokage, Cachimbo do Gamabunta…) ficam.
- Os itens permanentes do Roleta viraram relíquias (Pesos de treino). A bolsa de consumíveis continua à parte ([combate.md](combate.md#bolsa)).
- O desconto do mercador soma o das relíquias com o do Tazuna (História, País das Ondas), com teto de 40% (`shop.maxDiscount`).

## Classificações

| Classificação | Cor | De onde vem |
|---|---|---|
| Inicial | aço | Toda run começa com a do personagem; nunca sai em sorteio |
| Comum | clara | Elite, tesouro e mercador |
| Incomum | azul | Elite, tesouro e mercador |
| Rara | dourada | Elite, tesouro, mercador e alguns eventos |
| Chefe | vermelha | Escolha de 1 entre 3 depois de vencer um chefe |
| Loja | verde | Só no mercador |
| Evento | roxa | Só em eventos |
| Especial | turquesa | Só quando não sobra relíquia para sortear; nunca falha |

## De onde vêm

| Origem | Chances |
|---|---|
| **Elite** vencida | Comum 50%, incomum 33%, rara 17% |
| **Tesouro** | Comum 40%, incomum 35%, rara 25% |
| **Mercador** | 3 à venda: 2 sorteadas (comum 50%, incomum 33%, rara 17%) e 1 de loja. Preços: comum 40, incomum 60, rara 90, loja 70 ryō |
| **Chefe** | Escolher 1 entre 3 de chefe; com a inicial ainda não evoluída, 50% de chance de uma das 3 ser a evolução dela |
| **Eventos** | Algumas escolhas dão uma relíquia de evento ou rara ([historia.md](historia.md#eventos), [caminho-ninja.md](caminho-ninja.md#eventos)) |

## Iniciais e evolução

Cada personagem começa com a sua. Todas recuperam 25% do HP e do chakra da equipe depois de cada vitória (quem lutou e terminou de pé e quem ficou de fora), porque é daí que vem a recuperação da run; as do Caminho Ninja somam um pequeno bônus de classe. A evolução toma o lugar da inicial na barra.

## Na tela

- **Barra de relíquias** no HUD: um ícone por relíquia, com a borda na cor da classificação (rara e chefe têm cantos marcados). Rola de lado quando não cabe. Segurar (ou passar o mouse) mostra a dica; tocar abre o painel com ela em destaque. A relíquia nova entra com um brilho.
- **Painel**: grade agrupada por classificação; tocar num ícone mostra nome, classificação e efeito embaixo.
- **Na luta**: fileira pequena no topo. Brilham no começo da luta as que agem ali (dano de abertura, escudo, clones) e, na vitória, as que curam.
- **Elite**: depois da tela de recompensa, a relíquia aparece num card revelado. **Tesouro**: um baú que treme e abre. **Chefe**: as 3 lado a lado, com o selo "Evolução da inicial" quando for o caso; tocar destaca, o botão confirma. **Mercador**: prateleira com etiqueta de preço; tocar mostra o efeito e o botão de compra.
- Ícones em `prototype/jornada/relicIcons.ts` (um por relíquia; `tests/jornada.test.ts` confere).

## Coleção

Aba **Relíquias (宝)** do Registro ninja ([perfil.md](../base/perfil.md)): todas as relíquias por classificação, com o total encontrado. As que nunca apareceram ficam escondidas com "?". Uma relíquia entra na coleção ao **aparecer**, mesmo sem pegar: na run, na prateleira do mercador, na escolha do chefe, no tesouro, em evento ou na elite.

## Lista

### Inicial (5)

| Relíquia | Personagem | Efeito |
|---|---|---|
| Tigela do Ichiraku | Naruto | Cada vitória recupera 25% do HP e do chakra de toda a equipe. |
| Cantil da Academia | Comum | Cada vitória recupera 25% do HP e do chakra de toda a equipe. +10% de ryō. |
| Bentô de treino | prodígio | Cada vitória recupera 25% do HP e do chakra de toda a equipe. +1 de dano no taijutsu. |
| Incenso do distrito | Uchiha | Cada vitória recupera 25% do HP e do chakra de toda a equipe. +4 de chakra máximo. |
| Chá da família | Hyuuga | Cada vitória recupera 25% do HP e do chakra de toda a equipe. +3% de acerto. |

### Comum (20)

| Relíquia | Efeito |
|---|---|
| Óculos de aprendiz | +5% de acerto. |
| Bandana da Folha | +10 de HP máximo. |
| Carteira de sapo | +25% de ryō. |
| Bolsa de kunai | +2 de dano no taijutsu. |
| Pesos de treino | +2 de speed. |
| Pílulas de soldado | +6 de chakra máximo. |
| Kit médico | Na hora: 2 kits de HP e 1 de chakra. |
| Fio de aço | Esquiva 5% dos golpes. |
| Cantil de campanha | +10% de HP máximo dos suportes. |
| Selos em branco | Na hora: 2 kits de chakra. |
| Moeda da sorte | Na hora: +60 ryō. |
| Caderno de treino | +15% de XP. |
| Sandálias gastas | +1 de speed; esquiva 2% dos golpes. |
| Bolinhos de arroz | Os kits curam 25% a mais. |
| Pedra de amolar | +4% de crítico. |
| Contas de meditação | Concentrar recupera 10% a mais do chakra. |
| Colete acolchoado | Defender recupera 3% do HP. |
| Bala de chakra | Começa as lutas com 10% a mais do chakra. |
| Cobertor de campanha | O descanso cura 10% a mais. |
| Bolsa reforçada | +2 espaços na bolsa. |

### Incomum (17)

| Relíquia | Efeito |
|---|---|
| Cupom do Ichiraku | Cada vitória cura 10% a mais da equipe. |
| Faixas de mão | +10% de dano de taijutsu. |
| Sacola de ervas | Recupera 2% do HP por rodada. |
| Ficha do mercador | O mercador cobra 15% a menos. |
| Pergaminho de invocação | Começa as lutas com 1 clone. |
| Tambor de guerra | A equipe ganha +5% de acerto. |
| Estojo de senbon | A equipe ganha +5% de crítico. |
| Selo de armazenamento | Na hora: 2 kits de HP e 1 Pílula de reanimação. |
| Pílulas de reanimação | Na hora: 2 kits de levantar. |
| Diário do mestre | Na hora: +1 ponto de talento. |
| Bandana rasgada | Abaixo de 50% do HP, +25% de dano. |
| Marca de caça | Derrubar um inimigo recupera 3 de chakra. |
| Frasco de toxina | +10% de chance de aplicar o efeito das técnicas. |
| Linha de sombra | +20% de dano em alvo atordoado. |
| Apito de socorro | A equipe volta com 15% a mais de HP ao ser levantada. |
| Caco de espelho | Quem acerta um dos seus clones leva 4 de dano. |
| Kunai gêmea | +3% de dano por clone ativo. |

### Rara (15)

| Relíquia | Efeito |
|---|---|
| Pergaminho proibido | Técnicas de clone criam 1 clone a mais. |
| Sino do Kakashi | +10% de crítico. |
| Selos explosivos | Começo de cada luta: 10 de dano em todos os inimigos. |
| Máscara de caçador | A equipe esquiva 6% dos golpes. |
| Cabaça de areia | A equipe começa as lutas com escudo de 10% do HP. |
| Contrato dos sapos | +15% de dano de ninjutsu. |
| Leque de guerra | A equipe causa +10% de dano de ninjutsu. |
| Pedra de chakra | As técnicas custam 1 de chakra a menos. |
| Pergaminho dos mil | O limite de clones sobe em 2; +2% de dano por clone ativo. |
| Kunai do mestre | +10% de dano. |
| Pacto de sangue | Abaixo de 50% do HP, +35% de dano. |
| Incenso dos sonhos | +25% de dano de genjutsu. |
| Amuleto da longevidade | A equipe recupera 2% do HP por rodada. |
| Reserva de chakra | Começa as lutas com 25% a mais do chakra. |
| Pergaminho vital | +25 de HP máximo. |

### Chefe (16)

| Relíquia | Efeito |
|---|---|
| Colar do Primeiro Hokage | +1 Vontade do Fogo: recomeça uma luta perdida. |
| Selo de contenção | Recupera 4% do HP por rodada. |
| Chapéu do Hokage | +15% de dano da equipe. |
| Bandana dos Sannin | +25% de HP máximo dos suportes. |
| Cachimbo do Gamabunta | As técnicas custam 2 de chakra a menos. |
| Lâmina de chakra | +25% de dano. |
| Armadura samurai | A equipe começa as lutas com escudo de 20% do HP. |
| Pergaminhos do Céu e da Terra | Na hora: +2 pontos de talento. |
| Lótus eterna | A equipe recupera 3% do HP por rodada. |
| Bolsa sem fundo | +50% de ryō e o mercador cobra 25% a menos. |
| Pena de fênix | Uma vez por luta, ao cair, fica com 1 de HP. |
| Selo do exército | Começa as lutas com 2 clones; o limite de clones sobe em 1. |
| Manto de Kage | A equipe esquiva 8% dos golpes e ganha +5% de acerto. |
| Núcleo de chakra | +10 de chakra máximo; começa as lutas com 50% a mais do chakra. |
| Talismã da segunda chance | A equipe volta com 30% a mais de HP ao ser levantada. |
| Estandarte de guerra | A equipe ganha +10% de crítico. |

### Evoluções

Só aparecem na escolha depois do chefe, para quem ainda tem a inicial, e tomam o lugar dela.

| Relíquia | Evolui | Efeito |
|---|---|---|
| Tigela especial do Ichiraku | Tigela do Ichiraku | Cada vitória recupera 40% da equipe; +15 de HP máximo. |
| Cantil de chunin | Cantil da Academia | Cada vitória recupera 35% da equipe; +20% de ryō e +10% de XP. |
| Bentô da Juventude | Bentô de treino | Cada vitória recupera 35% da equipe; +3 de dano no taijutsu. |
| Incenso do clã | Incenso do distrito | Cada vitória recupera 35% da equipe; +10 de chakra máximo e +5% de crítico. |
| Chá da Casa Principal | Chá da família | Cada vitória recupera 35% da equipe; +8% de acerto e esquiva 4% dos golpes. |

### Loja (7)

| Relíquia | Efeito |
|---|---|
| Balança do mercador | O mercador cobra 10% a menos; +10% de ryō. |
| Kit completo | Na hora: 2 kits de HP, 2 de chakra e 1 Pílula de reanimação. |
| Selo de cliente | +3 espaços na bolsa. |
| Contrato comercial | +40% de ryō. |
| Encomenda do ferreiro | +4 de dano no taijutsu. |
| Carta de recomendação | +30% de XP. |
| Placa de armadura | +20 de HP máximo. |

### Evento (8)

| Relíquia | Efeito |
|---|---|
| Amuleto da velhinha | +10 de HP máximo; a equipe recupera 1% do HP por rodada. |
| Anel estranho | +8% de crítico e +4% de acerto. |
| Tinta de invocação | Começa as lutas com 1 clone; técnicas de clone criam 1 a mais. |
| Cartão fidelidade do ramen | Cada vitória cura 15% a mais da equipe. |
| Pergaminho do guru | Na hora: +1 ponto de talento e +30 ryō. |
| Dado do jokenpô | +20% de ryō e +3% de crítico. |
| Carta de fã | A equipe ganha +3% de acerto e esquiva 3% dos golpes. |
| Frasco de óleo de sapo | Começo de cada luta: 6 de dano em todos os inimigos. |

### Especial (1)

| Relíquia | Efeito |
|---|---|
| Amuleto vazio | Só aparece quando não sobra relíquia para sortear. Na hora: +25 ryō. |
