---
name: novo-retrato
description: Fluxo para criar, refazer ou trocar o retrato ilustrado (WebP) de um personagem, vilão, forma ou variante do Ninja Roleta, no mesmo estilo dos outros. Use sempre que o usuário pedir retrato novo, arte de personagem, trocar ou corrigir uma imagem de public/img/ninja, viloes ou jornada, ou disser que um rosto "ficou estranho". Não serve para cenários (public/img/cenas) nem para os desenhos SVG de reserva (prototype/portraits).
---

# Novo retrato (Ninja Roleta)

O retrato precisa parecer da mesma série que os outros 94 e funcionar de 24px a 170px. Quem gera a imagem pode ser o usuário, o Codex ou outra ferramenta; este fluxo vale para qualquer um e garante que o retrato possa ser refeito depois.

## 1. Contrato e chave

1. Contrato em `docs/tarefas/<tema>.md` (AGENTS.md, "Escopo"). Escopo típico: `public/img/<pasta>/<chave>.webp`, `public/img/retratos.json` e, se uma ficha passar a usar a imagem, o dado que aponta a chave.
2. A chave é a da ficha (`ninja:<chave>` ou `villain:<chave>`). Pasta: `ninja/` (jogador, equipe, personagens da História), `viloes/` (vilões, formas, invocações) ou `jornada/` (id próprio da Jornada). Regras de nome em `public/img/LEIAME.md`.

## 2. Gerar pela ficha de estilo

1. Leia a [ficha de estilo](../../../docs/visual.md#ficha-de-estilo-dos-retratos): formato, enquadramento, traço, fundo e o que nunca entra.
2. Use o prompt base da ficha. Anexe a referência do personagem e **dois retratos aprovados do mesmo grupo** (aliados ou vilões) como referência de estilo. Variante: anexe o retrato base da mesma pessoa e descreva só o que muda.
3. Exporte em WebP 256 × 256, até 30 KB (qualidade ~80; abaixe até caber).

## 3. Registrar

Acrescente ou atualize a entrada em `public/img/retratos.json`, em ordem de arquivo:

```json
{ "arquivo": "viloes/<chave>.webp", "chave": "<chave>", "uso": "dados", "origem": "ia", "ferramenta": "<ferramenta e modelo>", "data": "AAAA-MM-DD", "prompt": "<prompt completo>", "referencias": ["<origem de cada referência>"], "parametros": { "<nome>": "<valor>" }, "aprovado": false }
```

- `uso`: `dados` se alguma ficha usa a chave, `variante` se a imagem só fica disponível.
- Entrada nova da IA **precisa** de `ferramenta`, `prompt` e `referencias` (o teste cobra). Não invente: se o usuário gerou fora, pergunte.
- `aprovado` fica `false` até o passo 4.

## 4. Conferir com o usuário

1. `npm run lab` e o cenário `meta.portraits` (galeria): o retrato novo ao lado dos outros do grupo, nos temas Sumi e Pergaminho. Confira em tamanho pequeno (ordem de iniciativa) e grande (cena).
2. Mostre ao usuário e só marque `"aprovado": true` com o aval dele. Retrato reprovado: ajuste o prompt (registre o novo) e gere de novo.

## 5. Fechar

1. `npm run check` (o `tests/retratosImagem.test.ts` confere manifesto, tamanho, peso e uso; o `tests/portraits.test.ts`, que toda chave tem desenho de reserva).
2. Linha no `CHANGELOG.md` se o jogador nota a troca; depois, skill `lancar-versao`.

Não apague o desenho SVG de reserva em `prototype/portraits/`: sem a imagem, o jogo usa o desenho.
