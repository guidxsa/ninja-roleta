---
objetivo: Dar o acabamento visual ao lobby do Arcade (e ao chip da dificuldade na tela de origem), mantendo a composição da História e sem mudar o que a tela faz.
escopo: ["docs/tarefas/arcade-lobby-visual.md", "prototype/styles/**", "prototype/lab/**", "docs/visual.md", "DESIGN.md", "docs/ui-lab/**", "changelog.d/arcade-lobby-visual.md"]
fora: ["src/**", "prototype/*.ts", "prototype/jornada/**", "prototype/roleta/**", "public/img/**", "scripts/**", ".claude/**", ".github/**", "package.json", "package-lock.json", "CHANGELOG.md", "AGENTS.md", "CLAUDE.md"]
pronto: ["npm run check verde", "o lobby em 390, 768, 1280, 1920, 2560 e 3840 sem rolagem horizontal; no celular, o Girar acima da dobra e no máximo uma tela de rolagem a mais; no desktop com altura ≥ 620, a tela cabe na janela", "fotos de antes e depois dos cenários do briefing", "as telas da História, da Campanha e o resto do jogo sem mudança visual", "docs/visual.md (Lobby do Arcade) e DESIGN.md com o acabamento", "fragmento changelog.d/arcade-lobby-visual.md"]
agente: codex
aprovado: 2026-11-27
---

# Acabamento do lobby do Arcade

## Pedido

"Sim, delegue" (usuário, 27/11/2026), depois do PR #113, que deu ao Arcade o lobby entre o Portão e as roletas de origem com CSS mínimo. Pedido original do usuário para a tarefa: "use o mesmo modus operandi das outras telas e a parceria com o codex" (a História e a Campanha foram #98 → #100). A estrutura e a funcionalidade são do Claude e já estão no staging; esta tarefa é só o acabamento.

## Contexto

- **Lobby** (`prototype/roleta/screens/lobby.ts`, `.screen.gate.jgate.jhub.rlobby`), na casca das telas de modo da Jornada (`shinobi/jornada-modos.css`):
  - `.gate-main`: o painel (`.gate-banner` com a arte `modo-roleta`, o letreiro `.jlogo` "Modo / Arcade" e a frase `.rlobby-tag`) e o bloco de começar `.rlobby-start` (a `.difficulty-box` com o `.segmented`, a descrição `#diff-desc`, a linha de desempenho da escolhida `[data-diff-stats]` e o aviso do Hardcore travado; e o botão `.rlobby-spin`, `data-choice="spin"`).
  - `.gate-aside`: `.rlobby-stats` (os totais `.rlobby-totals` em `dl` e, recolhida, a conta por dificuldade `.rlobby-diffs`, que reaproveita o `difficultyStats()` do Histórico, `ul.history`), `.rlobby-runs.jrecent` (as 3 últimas runs, `li.rlobby-run` com `.seal`, `.rlobby-run-txt` e `.rlobby-run-tags`, e o "Ver histórico" `data-profile="history"`), `.rlobby-ach.jrecent` (as conquistas do Arcade, "Ver todas" `data-profile="achievements"`) e o Voltar `.jstart-back`.
- **Origem** (`.rorigin`): no lugar do seletor de dificuldade, a linha `.rorigin-diff` com o chip da dificuldade escolhida.
- O CSS atual é o mínimo do Claude, em `prototype/styles/roleta-lobby.css` (importado no fim do `index.css`). O resto vem da casca `.jhub`.
- Medido pelo Claude no PR #113: no celular (390×844) a página tem 1577 px e o Girar fica acima da dobra; no desktop a página cabe na janela, e a coluna tem cerca de 246 px em 1280×800 e rola por dentro.

## Briefing visual

**Cenários do UI Lab** (`npm run lab`): `roleta.lobby` (primeiro acesso), `roleta.lobby:mid` (histórico e conquistas), `roleta.lobby:full` (Hardcore liberado, histórico cheio); `roleta.origin` e `roleta.origin:hardcore` (o chip da dificuldade). Para comparar a composição: `jornada.story.pick` e `gate.home`.

**Tamanhos:** 390×844, 768×1024, 1280×800, 1920×1080, 2560×1440 e 3840×2160.

**O que acabar:**
- **Letreiro** "Modo Arcade": hoje herda o tratamento da Jornada (`.jhub .jlogo`). Dar ao Arcade a identidade dele (a ameixa da roleta, `docs/visual.md`, "Identidade por modo"), sem imagem nova e sem mudar o da História e da Campanha.
- **Painel**: a arte `modo-roleta` fica escura e apagada no painel grande. Enquadrar e iluminar como o painel da História, com as mesmas dimensões dele. A frase `.rlobby-tag` não aparece no celular: decidir se entra.
- **Bloco de começar**: o Girar é a peça principal da tela (pode levar a roda como ornamento) e a dificuldade fica junto dele, legível de longe. O botão pressionado do Difícil (`.diff-hard[aria-pressed=true]`) fica com o texto pouco legível sobre o vermelho: corrigir só no lobby, ou no componente se for o mesmo problema em toda parte (então descreva no resumo).
- **Coluna**: ver se cabe mais larga no desktop, nas medidas da grade do Início. Os totais, a conta por dificuldade e as últimas runs em papel, no padrão do tema; os chips de dificuldade e resultado legíveis.
- **Celular**: no máximo uma tela de rolagem a mais, com o Girar sempre acima da dobra.
- **Origem**: o chip da dificuldade no lugar do antigo seletor, alinhado ao Re-rolar e ao Começar.
- Seguir o `docs/visual.md` e o `DESIGN.md`: só tokens (`var(--...)`), chanfro em `::before`/`::after`, ícones do `ICONS`, nada de emoji, botões simples com os detalhes na dica.

**A ordem do HTML é a da tela, também no celular** (issue #95): nada de `order` que faça o foco do teclado pular.

**Não mudar** (o TS consulta; são contrato): `data-choice` (`spin`, `back`, `reroll`, `start`), `data-diff`, `data-diff-stats`, `#diff-desc`, `data-profile` (`history`, `achievements`), `aria-*`, e as classes `.rlobby`, `.rlobby-start`, `.rlobby-spin`, `.rlobby-tag`, `.rlobby-stats`, `.rlobby-totals`, `.rlobby-diffs`, `.rlobby-runs`, `.rlobby-run`, `.rlobby-run-txt`, `.rlobby-run-tags`, `.rlobby-ach`, `.rorigin-diff`, `.difficulty-box`, `.segmented`, `.jrecent`, `.jstart-back`, `.gate`, `.jgate`, `.jhub`, `.gate-main`, `.gate-banner`, `.gate-aside`, `.rorigin`, `.primary`.

## Fora do escopo

TS, textos, regras e números; imagens novas; a História, a Campanha, o Portão e o Registro (as regras de `.jhub` que valem para todos só mudam se o resultado delas ficar igual, conferido nos cenários da Jornada); a Tarefa 5 (palco de combate).

## Decisões para o usuário

(preenchido pelo Codex, se houver)

## Achados

(preenchido durante o trabalho)
