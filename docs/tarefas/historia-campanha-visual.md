---
objetivo: Dar acabamento visual às telas da História (escolha da perspectiva) e da Campanha (preparação), reorganizando o topo com a run salva e a dificuldade, sem mudar o que elas fazem.
escopo: ["docs/tarefas/historia-campanha-visual.md", "prototype/styles/**", "prototype/lab/**", "docs/visual.md", "DESIGN.md", "docs/ui-lab/**", "changelog.d/historia-campanha-visual.md"]
fora: ["src/**", "prototype/*.ts", "prototype/jornada/**", "prototype/roleta/**", "public/img/**", "scripts/**", ".claude/**", ".github/**", "package.json", "package-lock.json", "CHANGELOG.md", "AGENTS.md", "CLAUDE.md"]
pronto: ["npm run check verde", "as duas telas em 390, 768, 1280, 1920, 2560 e 3840 sem rolagem horizontal e, no desktop com altura ≥ 620, cabendo na janela", "os cenários com run salva, com a run do outro modo, com histórico e com tudo liberado conferidos com fotos de antes e depois", "o resto do jogo sem mudança visual (Portão, Registro, Arcade e a run da Jornada)", "docs/visual.md com a composição nova", "fragmento changelog.d/historia-campanha-visual.md"]
agente: codex
aprovado: 2026-11-26
---

# Acabamento visual da História e da Campanha

## Pedido

"Sim, delegar a tarefa da reorganização visual ao Codex" (usuário, 26/11/2026). É a parte visual da Tarefa 3 do plano das telas. A funcionalidade entrou no staging pelo PR #94 (Claude), que deixou o briefing abaixo.

## Contexto

- O PR #94 pôs no topo das duas telas uma faixa `.jmode-top` com a run salva e a **Dificuldade da Jornada**, e deu aos arcos da História um estado novo. O CSS é mínimo (`prototype/styles/jornada.css`, bloco "Topo das telas de modo"), só para funcionar.
  - Run salva **do mesmo modo**: o card `.jprogress` com o **Continuar** (`data-choice="continue"`). O botão de começar vira secundário: "Recomeçar a História" ou "Começar uma nova run".
  - Run salva **do outro modo**: o aviso `.jother-saved`, que diz que começar ali substitui essa run.
  - Arcos (`.jarc`): `.is-done` (concluído, sépia), `.is-now` (você está aqui, moldura), sem classe (o próximo a jogar) e `.is-ahead` (ainda não alcançado: hoje só cinza com cadeado).
- Problemas vistos pelo Claude em 1920×1080: o card de progresso e a dificuldade ocupam muito do topo e empurram os pôsteres para baixo; o seletor de dificuldade quebra em 2×2; o aviso do outro modo é um pergaminho solto; as artes dos arcos ficam achatadas.
- A faixa de monitores grandes (≥ 2200×1200, PR #89) exclui essas duas telas de propósito (`:not(:has(.jcampaigns, .jpath))` em `tokens.css` e `wide-desktop.css`), à espera desta tarefa.
- Retorno do usuário em 24/11 (plano das telas): os painéis da História citam os arcos canônicos do Time 7, com o nome e a arte de cada arco e o Time 7 presente, no espírito do card da História no Portão. Nada de painel genérico.

## Briefing visual

**Telas:** `.jcampaigns` (`campaignScreen`) e `.jpath` (`pathSetupScreen`), em `prototype/jornada/index.ts` (só leitura para você).

**Cenários do UI Lab** (`npm run lab`): `jornada.story.pick`, `jornada.story.pick:saved`, `:other`, `:history`, `:full`; `jornada.path.setup`, `jornada.path.setup:saved`, `:other`, `:full`.

**Tamanhos:** 390×844, 768×1024, 1280×800, 1920×1080, 2560×1440 e 3840×2160. No desktop com altura ≥ 620, a tela cabe na janela (docs/visual.md, "Quanto menos rolagem, melhor").

**O que acabar e por quê:**
- **Topo** (`.jmode-top`): uma faixa compacta, que não roube a altura dos pôsteres. O Continuar é a ação principal quando há run salva do modo; a dificuldade é secundária (por exemplo, um seletor segmentado numa linha, com a recuperação e a nota do Hardcore na dica `tip()` ou em letra menor). No celular, a ordem é: run salva, pôster com os arcos e o botão de começar, dificuldade.
- **Aviso do outro modo** (`.jother-saved`): curto, ligado ao botão de começar, sem parecer um bloco solto.
- **Arcos**: os quatro estados legíveis de longe. O ainda não alcançado precisa de algo além do cinza (o cadeado já está no texto; dá para dar forma, como papel dobrado ou selo). Nos painéis grandes, os arcos com a arte inteira, citando o Time 7 (retorno de 24/11).
- **Monitores grandes**: incluir as duas telas na faixa ≥ 2200×1200 (tirar a exclusão de `tokens.css` e `wide-desktop.css` só para elas, com a composição própria).
- Seguir o [visual.md](../visual.md) e o `DESIGN.md`: só tokens (`var(--...)`), chanfro em `::before`/`::after`, ícones do `ICONS`, nada de emoji, botões simples com os detalhes na dica.

**Não mudar** (o TS consulta; são contrato): `data-choice` (`back`, `continue`, `naruto`, `sasuke`, `generic`), `data-diff`, `data-recovery`, `data-arc`, `data-campaign`, `data-class`, `data-element`, `data-elements`, `aria-current`, `aria-pressed`, `aria-disabled`, e as classes `.jcampaigns`, `.jpath`, `.jarcs`, `.jarc`, `.is-now`, `.is-done`, `.is-ahead`, `.difficulty-box`, `.segmented`, `.jprogress`, `.jmode-top`, `.jother-saved`, `.jc-panel`, `.jclasses`, `.jel-pick`.

## Fora do escopo

- Qualquer arquivo TS e o que as telas fazem; imagens novas (as artes de card da Campanha, `campanha-*.webp`, ficam para um lote de imagens à parte).
- Portão, Registro, Arcade, a run da Jornada (trilha, mapa, loja, árvore, luta) e a entrada antiga (`jornada.entry`, só do UI Lab).
- Regras e números do jogo.

## Decisões para o usuário

Nenhuma prévia: se a composição pedir mudança de estrutura no HTML, pare e descreva no resumo, sem mexer no TS.

## Achados

(preenchido durante o trabalho)
