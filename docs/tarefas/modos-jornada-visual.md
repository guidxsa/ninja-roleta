---
objetivo: Dar o acabamento visual às telas de modo da História e da Campanha e às três janelas (perspectiva, cardápio de classes e classe aleatória), mantendo a composição aprovada pelo usuário e sem mudar o que elas fazem.
escopo: ["docs/tarefas/modos-jornada-visual.md", "prototype/styles/**", "prototype/lab/**", "docs/visual.md", "DESIGN.md", "docs/ui-lab/**", "changelog.d/modos-jornada-visual.md"]
fora: ["src/**", "prototype/*.ts", "prototype/jornada/**", "prototype/roleta/**", "public/img/**", "scripts/**", ".claude/**", ".github/**", "package.json", "package-lock.json", "CHANGELOG.md", "AGENTS.md", "CLAUDE.md"]
pronto: ["npm run check verde", "as duas telas e as três janelas em 390, 768, 1280, 1920, 2560 e 3840 sem rolagem horizontal; no desktop com altura ≥ 620, a tela cabe na janela e o botão principal da janela fica visível", "fotos de antes e depois de todos os cenários do briefing", "o resto do jogo sem mudança visual (Portão, Registro, Arcade, run da Jornada)", "o CSS morto da estrutura anterior removido", "docs/visual.md e DESIGN.md com o acabamento", "fragmento changelog.d/modos-jornada-visual.md"]
agente: codex
aprovado: 2026-11-27
---

# Acabamento das telas de modo da História e da Campanha

## Pedido

"Deixe o Codex aperfeiçoar agora" (usuário, 27/11/2026), depois de aprovar a composição do PR #98 ("a composição do Modo História me agradou muito"). A estrutura e a funcionalidade são do Claude e já estão no staging; esta tarefa é só o acabamento.

## Contexto

- **História** (`.gate.jgate.jhub.jstory`): painel com a arte `jornada` e o letreiro "Modo História"; cards **Naruto** e **Sasuke** (em breve); coluna com a run salva (`.jprogress` com o Continuar, ou o aviso `.jother-saved`), a dificuldade e as conquistas recentes.
- **Janela da perspectiva** (`.jpersp-modal` / `.jpersp`): arte, descrição, os quatro arcos (`.jarc` com `.is-done`, `.is-now`, sem classe para o próximo e `.is-ahead`; cada arco tem uma dica `data-tip` com a descrição breve) e os botões (`data-pick="start"` e, com a História salva, `data-pick="continue"`).
- **Campanha** (`.gate.jgate.jhub.jcamp`): mesma composição; cards **Escolher a classe** (`data-choice="pick"`, arte `modo-caminho`) e **Classe aleatória** (`data-choice="random"`, os retratos das classes em leque `.jarc-fan`); coluna com a run salva, a dificuldade, o recorde (`.jbest`) e as conquistas.
- **Cardápio** (`.jclass-modal` / `.jclass-menu`): a lista `.jclasses` e, ao lado, `.jclass-detail` com o retrato `[data-class-face]` em destaque e o nome e a descrição (`[data-class-name]`, `[data-class-info]`); embaixo, o elemento do Comum (`.jel-pick`) e o Começar.
- **Classe aleatória** (`.jrandom-modal` / `.jrandom-class`): a descrição, as classes que podem sair (`.jrandom-pool`) e a recompensa (`.jrandom-reward`), com o "Sortear e começar".
- O CSS atual é o mínimo do Claude (`prototype/styles/jornada.css`, bloco "Telas de modo na casca do Portão"). Ele desfaz, com `.gate.jgate.jhub`, duas coisas que o tema faz na casca `.jgate` (`shinobi/entradas.css`): o letreiro pintado "Modo Jornada" e a troca da arte dos cards por pergaminhos fixos. Hoje a arte do card fica por cima do pergaminho pintado, provisoriamente.
- A faixa de monitores grandes (≥ 2200×1200) já vale para essas telas.

## Briefing visual

**Cenários do UI Lab** (`npm run lab`): `jornada.story.pick`, `:saved`, `:other`, `:history`, `:full`; `jornada.story.dialog`, `:sasuke`; `jornada.path.setup`, `:saved`, `:other`, `:full`; `jornada.path.menu`, `:locked`; `jornada.path.random`.

**Tamanhos:** 390×844, 768×1024, 1280×800, 1920×1080, 2560×1440 e 3840×2160.

**O que acabar:**
- **Cards** das duas telas: a arte de cada card limpa e bem enquadrada no pergaminho (sem a arte "colada" por cima do pergaminho pintado), com o nome e o botão legíveis. O Sasuke travado precisa ler "em breve" sem parecer quebrado.
- **Letreiro** de cada modo ("Modo História", "Modo Campanha") no mesmo nível do letreiro pintado de antes (fonte de pincel, `--font-display`, ou o tratamento que o tema usa), sem imagem nova.
- **Janela da perspectiva**: maior que as outras, a arte em destaque, os arcos com os quatro estados legíveis de longe (o "ainda não alcançado" com forma além do cinza) e a dica do arco com cara de bloco informativo do tema.
- **Cardápio**: o retrato da classe grande e em destaque, com a descrição ao lado (pedido do usuário: "a imagem da classe destacada e uma descrição ao lado"); a lista de classes clara, com as travadas legíveis.
- **Classe aleatória**: a recompensa em destaque e as classes que podem sair como uma fileira de retratos.
- **Painel da Campanha**: a arte é provisória (a mesma da História); só enquadre bem, sem imagem nova.
- **Limpeza**: remover o CSS morto da estrutura anterior das duas telas em `jornada.css` (`.jc-duo`, regras de `.jcampaigns` e `.jpath`, `.jsub-head`, `.jmode-top`). O `.jc-panel` fica (as cenas usam).
- Seguir o [visual.md](../visual.md) e o `DESIGN.md`: só tokens (`var(--...)`), chanfro em `::before`/`::after`, ícones do `ICONS`, nada de emoji, botões simples com os detalhes na dica.

**Não mudar** (o TS consulta; são contrato): `data-choice` (`naruto`, `sasuke`, `pick`, `random`, `continue`, `back`), `data-pick` (`start`, `continue`), `data-close`, `data-diff`, `data-recovery`, `data-arc`, `data-tip`, `data-campaign`, `data-class`, `data-class-face`, `data-class-name`, `data-class-info`, `data-element`, `data-elements`, `aria-*`, e as classes `.jhub`, `.jstory`, `.jcamp`, `.jpersp`, `.jpersp-modal`, `.jclass-modal`, `.jclass-menu`, `.jrandom-modal`, `.jrandom-class`, `.mode-card`, `.jarc`, `.is-now`, `.is-done`, `.is-ahead`, `.difficulty-box`, `.segmented`, `.jprogress`, `.jother-saved`, `.jstart-face`, `.jclasses`, `.jel-pick`, `.jstart-back`, `.gate`, `.jgate`, `.gate-modes`, `.gate-aside`.

**A ordem do HTML é a da tela, também no celular** (issue #95, resolvida no PR #98): não reordene com `order` de um jeito que faça o foco do teclado pular.

## Fora do escopo

Qualquer TS, regra ou número; imagens novas (a arte própria do painel da Campanha vem num lote de imagens à parte); Portão, Registro, Arcade, a run da Jornada e a entrada antiga (`jornada.entry`, só do UI Lab).

## Decisões para o usuário

Nenhuma prévia: se o acabamento pedir mudança de estrutura no HTML, pare e descreva no resumo, sem mexer no TS.

## Achados

- Com recorde da Campanha, a nota do cardápio põe um `<p>` dentro de outro (`bestLine` dentro do parágrafo da nota) e perde a formatação de texto auxiliar. É do TS do PR #98, fora deste escopo: issue #99 (aberta pelo Claude; o conector do Codex pedia aprovação).
