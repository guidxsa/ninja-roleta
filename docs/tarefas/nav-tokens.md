---
objetivo: A navegação do Portão (#gate-nav, celular) e a barra lateral (#side-nav, PC) usam só tokens de cor, e o foco do teclado na #gate-nav fica visível.
escopo: ["prototype/styles/menu.css", "prototype/styles/shell.css", "prototype/styles/tokens.css", "docs/tarefas/nav-tokens.md"]
fora: ["src/**", "prototype/*.ts", "prototype/lab/**", "prototype/styles/shinobi/**", "public/**"]
pronto: ["npm run check verde", "fotos do UI Lab do gate.home em 390px e 1280px antes e depois, iguais fora do foco", "foco de teclado visível nos dois menus"]
agente: codex
aprovado: 2026-11-26
---

# Navegação do Portão e barra lateral só com tokens

## Pedido

O usuário pediu ao Claude, em 26/11/2026, que escolhesse uma tarefa visual pequena para o primeiro teste real da delegação ao Codex (`npm run delegar`). O Claude escolheu esta, porque ela corrige uma regra do `AGENTS.md` ("Cores, fontes, durações e forma só por tokens"; cor solta só em arte).

## Contexto

- `prototype/styles/menu.css`, regras `.gate-nav` (cerca das linhas 165 a 177): cores soltas `#cbbf9f`, `#ece3d0`, `#dcbd78`, `#b5161f` e `#fff`. O foco do teclado (`.gate-nav button:focus-visible`) tira o contorno (`outline: none`) e só clareia o texto e sublinha o kanji: é fraco para quem navega pelo teclado.
- `prototype/styles/shell.css`, regras `.side-nav` (cerca das linhas 22 a 33): cores soltas `#cbbf9f`, `#fff`, `#dcbd78`, `#ffd88a`, `#b5671f`, `#b5161f` e `rgba(255, 222, 170, …)`, `rgba(232, 112, 26, …)`. O foco já tem um contorno interno (`box-shadow: inset 0 0 0 1px #dcbd78`).
- Tokens que já existem em `prototype/styles/tokens.css`: `--text` (#ece3d0), `--gold-2` (#dcbd78), `--accent` e `--seal` (#b5161f), `--muted`. As outras cores precisam de token novo.

## Briefing visual

- **Arquivos**: `menu.css` (`.gate-nav`), `shell.css` (`.side-nav`) e `tokens.css` (tokens novos, com nome pelo papel: por exemplo `--nav-ink`, `--nav-ink-hover`, `--nav-current`, `--nav-current-edge`, `--nav-hover-bg`; o nome é decisão sua).
- **Aparência igual**: troque cada cor solta pelo token de **mesmo valor**. Fora do foco do teclado, nada muda na tela.
- **Foco visível na `.gate-nav`**: um contorno ou anel interno com token, no espírito do `.side-nav button:focus-visible`, sem cortar o traço vermelho do item atual (`[aria-current]::before`) e sem mexer no hover do mouse.
- **Não mudar**: ids (`#gate-nav`, `#side-nav`), classes, `aria-current` e a estrutura do HTML. São contrato com `prototype/shell.ts` e `prototype/gate.ts`.
- **Conferir**: skill `.claude/skills/revisar-visual/SKILL.md`, cenário `gate.home` (e `gate.home:full`) em 390px, onde aparece a `#gate-nav`, e em 1280px, onde aparece a `#side-nav`. Faça uma foto antes e outra depois e confira o foco com Tab.

## Plano

1. Tokens novos em `tokens.css`, ao lado dos de cor.
2. Troca das cores soltas em `menu.css` e `shell.css`.
3. Foco visível na `.gate-nav`.
4. Fotos do UI Lab antes e depois e `npm run check`.

## Fora do escopo

- Outras cores soltas fora da `.gate-nav` e da `.side-nav`.
- Qualquer TS, cenário do UI Lab ou arquivo de `shinobi/`.

## Decisões para o usuário

- Nenhuma: a aparência fica igual, e só o foco do teclado melhora.

## Achados

- (O Codex preenche.)
