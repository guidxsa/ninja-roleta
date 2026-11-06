# Reserva: combate clássico

> Desde a v0.45.0 (Roleta enxuto), o Roleta usa o combate simples de [roleta/combate.md](../roleta/combate.md). As regras abaixo **não foram apagadas**: o usuário quer talvez levá-las à Jornada, onde fica a carga complexa ([registro.md](../registro.md), item 8).

O código continua no projeto, com os testes:

- `src/core/combat.ts`: o motor clássico;
- `src/core/player.ts`: linhas elementais, upgrades e despertar;
- `src/core/progression.ts`: guru, Lição do clã, foco elemental e Nova técnica.

A simulação dele roda em `npm run sim:classico`.

## O que está guardado e onde está escrito

| Conceito | Onde está a regra |
|---|---|
| Reações (Resistir, Substituição, disputa) e painel de reação | [base/fundamentos.md](../base/fundamentos.md#reações) |
| Disputa de ninjutsu e quebra de guarda | [base/fundamentos.md](../base/fundamentos.md#disputa-de-ninjutsu) |
| Barreiras e escudos como ação, estados elementais (Armadura de Raio), interações de elemento | [base/fundamentos.md](../base/fundamentos.md#escudos), [base/tecnicas.md](../base/tecnicas.md) |
| Efeitos mentais com roleta de fuga, tenacidade e vulnerabilidade | [base/efeitos.md](../base/efeitos.md) |
| Linhas elementais I–IV, teto por nível e potencial da origem, upgrades à escolha | [base/tecnicas.md](../base/tecnicas.md#níveis-de-técnica), [base/progressao.md](../base/progressao.md#marcos-de-nível) |
| Kits completos das origens (Colônia e Devorar, Corpo pesado por peso, Sharingan em 3 estágios com Cópia, Portões com Forçar, Pílulas do clã...) e o despertar dos níveis 4 e 7 | [base/origens.md](../base/origens.md) |
| Premium do guru (Rasengan, Palma Curativa, Foco, Mestre da Substituição, Clones, Corpo Cintilante) e Lição do clã | [roleta/campanha.md](../roleta/campanha.md#guru) |
| Golpe carregado dos vilões | [base/viloes.md](../base/viloes.md) |

Essas páginas continuam valendo como descrição do combate clássico (e da base que a Jornada herda: acerto, crítico, dano, resistência e dificuldade).
