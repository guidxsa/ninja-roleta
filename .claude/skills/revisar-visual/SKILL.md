---
name: revisar-visual
description: Revisão visual de telas do Ninja Roleta pelo UI Lab - fotografa os cenários afetados em celular (390px) e desktop (1280px), nos temas Sumi e Pergaminho e com menos movimento, e confere contra docs/visual.md e as regras de interface do AGENTS.md. Use depois de mexer em interface (prototype/, estilos, art.ts, retratos), antes de fechar uma versão com mudança visual, ou quando o usuário disser "como ficou", "confere a tela", "ficou feio no celular".
---

# Revisar visual (Ninja Roleta)

O jogo deve parecer parte do universo shinobi (critério de `docs/visual.md`) e celular e desktop são pares, cada um com sua composição. Esta skill olha as telas de verdade, não o código.

## 1. Escolher os cenários

1. Veja o que mudou (`git diff --name-only origin/master...`) e ache os cenários do UI Lab que mostram essas telas: `docs/ui-lab/SCREEN_INVENTORY.md` liga tela a cenário, e os ids estão em `prototype/lab/scenarios/`.
2. Poucos e certeiros: a tela mudada, um estado extremo (lista cheia, nome longo, HP baixo) e uma tela vizinha que usa o mesmo componente.

## 2. Fotografar

**Pré-requisito (uma vez por máquina)**: a captura usa o Playwright, que não está nas dependências do projeto (pesaria o `npm ci` de todos). Instale só na sua máquina:

```
npm i --no-save playwright
npx playwright install chromium
```

Sem ele, o script para com `Playwright não encontrado` (um `npm ci` ou `npm install` depois remove o módulo: instale de novo). `--chromium=<caminho>` (ou `PW_CHROMIUM`) só troca o navegador: o módulo `playwright` continua necessário. Para olhar o lab à mão, o `.claude/launch.json` serve `dist-lab/` na porta 4178 (configuração `ui-lab`; é um `python -m http.server`, qualquer servidor estático serve).

```
npm run lab
npx tsx scripts/revisar-visual.ts <id> <id> ...      # ou --prefixo=jornada.shop, ou --todos
```

Sai uma foto por cenário × {celular, desktop} × {Sumi, Pergaminho, Sumi com menos movimento} em `dist-lab/revisao/` (fora do git). O terminal marca `VER` quando há rolagem horizontal ou erro no console.

Olhe as fotos (o agente lê as imagens). Fotos que o usuário vai ver: gere de novo com `deviceScaleFactor: 2` se precisar de nitidez.

## 3. Conferir

**Regras de interface** (AGENTS.md, "Interface"):
- Cor, fonte e duração só por token; nada de cor solta fora de arte.
- Ícones do `ICONS` (`icon()`), nada de emoji como ícone.
- Cantos retos, chanfro em `::before`/`::after`; números flutuantes e foco não cortados.
- Fonte certa por papel: pincel só em letreiro grande, manuscrita em título de pergaminho, números em `--font-hud`.
- Botão simples (ícone, nome, números principais); regra, efeito e motivo de bloqueio na dica.

**Direção visual** (`docs/visual.md`):
- A tela usa os objetos do mundo (pergaminho, placa, carimbo) e poucas referências ligadas ao que acontece nela.
- Celular: um toque, vertical, botões grandes, sem rolagem horizontal. Desktop: composição própria (colunas, painéis), não o celular esticado; quanto menos rolagem, melhor.
- Os dois temas legíveis (contraste do texto sobre o papel e sobre o sumi).
- Menos movimento: nada essencial depende de animação.

## 4. Relatar

Uma lista curta por cenário: **ok** ou o problema, com a foto e a regra que ele fere (link para a seção do doc). Separe o que é defeito (quebra regra) do que é gosto (sugestão). Não corrija o que está fora do escopo da tarefa: vai para "Achados".
