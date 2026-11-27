---
objetivo: Trocar a arte dos dois cards da Campanha: Escolher a classe mostra os retratos das classes e Classe aleatória mostra os retratos em sombra, uma interrogação e o selo da vantagem.
escopo: ["docs/tarefas/campanha-cards.md", "prototype/jornada/index.ts", "src/data/strings/jornada.ts", "prototype/styles/jornada.css", "docs/visual.md", "changelog.d/campanha-cards.md"]
fora: ["src/core/**", "src/sim/**", "src/state/**", "src/data/balance*.ts", "src/data/**/balance*.ts", "public/img/**", "prototype/styles/shinobi/**"]
pronto: ["npm run check verde", "o card Escolher a classe com o leque de retratos das classes", "o card Classe aleatória com os retratos em sombra, a interrogação e o selo +1 relíquia", "UI Lab sem rolagem horizontal", "PR para staging"]
agente: claude
aprovado: 2026-11-27
---

# Arte dos cards da Campanha

## Pedido

Retorno do usuário sobre o PR #100 (27/11/2026): "O card Escolher a classe pode receber a mídia com os cartões das classes atuais (como o atual Classe aleatória é)" e "no card Classe aleatória, elementos que remetam a algo desconhecido ou misterioso, como um símbolo de interrogação ou uma sombra como um personagem escondido, e algo que remeta a uma vantagem, algo positivo".

## Contexto

Os cards estão em `pathSetupScreen` (`prototype/jornada/index.ts`, PR #98). O acabamento visual das telas de modo está no PR #100 (Codex), que recebe esta marcação depois do merge e dá o acabamento final.

## Plano

1. `classFan()` vira a arte de Escolher a classe (classe `.jclass-fan`).
2. `mysteryFan()`: os mesmos retratos com `.jfan-mystery` (em sombra), `.jfan-mark` (a interrogação) e `.jfan-bonus` (baú e "+1 relíquia", string `randomBonusBadge`).
3. CSS mínimo em `jornada.css`, só tokens; o acabamento vai ao Codex no PR #100.
4. `docs/visual.md` e o fragmento.

## Fora do escopo

Regras, números, imagens novas e o acabamento fino (PR #100).

## Decisões para o usuário

Nenhuma.

## Achados

Nenhum.
