---
name: novo-retrato
description: Fluxo para criar, refazer ou trocar o retrato ilustrado (WebP) de um personagem, vilão, forma ou variante do Ninja Roleta, no mesmo estilo dos outros. Use sempre que o usuário pedir retrato novo, arte de personagem, trocar ou corrigir uma imagem de public/img/ninja, viloes ou jornada, ou disser que um rosto "ficou estranho". Não serve para cenários (public/img/cenas) nem para os desenhos SVG de reserva (prototype/portraits).
---

# Novo retrato (Ninja Roleta)

O retrato precisa parecer da mesma série que os outros 94 e funcionar de 24px a 170px. Ele sai de imagens-modelo escolhidas pelo usuário e de uma revisão humana com ajustes até a aprovação. Quem gera a imagem pode ser o usuário, o Codex ou outra ferramenta; este fluxo vale para qualquer um e guarda o necessário para refazer o retrato depois.

## 1. Contrato e chave

1. Contrato em `docs/tarefas/<tema>.md` (AGENTS.md, "Escopo"). Escopo típico: `public/img/<pasta>/<chave>.webp`, `public/img/retratos.json` e, se uma ficha passar a usar a imagem, o dado que aponta a chave.
2. A chave é a da ficha (`ninja:<chave>` ou `villain:<chave>`). Pasta: `ninja/` (jogador, equipe, personagens da História), `viloes/` (vilões, formas, invocações) ou `jornada/` (id próprio da Jornada). Regras de nome em `public/img/LEIAME.md`.

## 2. Imagens-modelo e instrução

O retrato nasce das **imagens-modelo do usuário**, não de um prompt solto ([processo na ficha de estilo](../../../docs/visual.md#ficha-de-estilo-dos-retratos)).

1. Peça ao usuário as imagens-modelo e o que ele gosta em cada uma (traço, enquadramento, expressão, detalhe do traje). Elas ficam em `prototype/lab/refs/<chave>` (fora do git; ver `prototype/lab/refs/LEIAME.md`).
2. Escreva a instrução: o que pegar de cada imagem e o padrão da tabela da ficha (formato, enquadramento, traço, fundo, o que nunca entra). Para manter a série, junte **dois retratos aprovados do mesmo grupo** (aliados ou vilões). Variante: o retrato base da mesma pessoa e só o que muda.
3. Gere e exporte em WebP 256 × 256, até 30 KB (qualidade ~80; abaixe até caber).

## 3. Registrar

Acrescente ou atualize a entrada em `public/img/retratos.json`, em ordem de arquivo:

```json
{ "arquivo": "viloes/<chave>.webp", "chave": "<chave>", "uso": "dados", "origem": "ia", "ferramenta": "<ferramenta e modelo>", "data": "AAAA-MM-DD", "referencias": ["prototype/lab/refs/<chave>/<imagem>", "<o que se pegou dela>"], "prompt": "<a instrução escrita>", "ajustes": [], "parametros": null, "aprovado": false }
```

- `uso`: `dados` se alguma ficha usa a chave, `variante` se a imagem só fica disponível.
- Entrada nova da IA **precisa** de `referencias` (as imagens-modelo) e `ferramenta`, e só entra no jogo com `aprovado: true` (o teste cobra). O `prompt` é opcional. Não invente: se o usuário gerou fora, pergunte.

## 4. Revisão humana (ciclo até aprovar)

1. `npm run lab` e o cenário `meta.portraits` (galeria): o retrato novo ao lado da imagem-modelo e dos outros do grupo, nos temas Sumi e Pergaminho, em tamanho pequeno (ordem de iniciativa) e grande (cena). A skill `revisar-visual` tira as fotos (`npx tsx scripts/revisar-visual.ts meta.portraits`).
2. Mostre ao usuário. Cada ajuste pedido vai para `ajustes` no manifesto; ajuste a instrução, gere de novo e mostre outra vez.
3. Só com o aval dele: `"aprovado": true`.

## 5. Fechar

1. `npm run check` (o `tests/retratosImagem.test.ts` confere manifesto, tamanho, peso e uso; o `tests/portraits.test.ts`, que toda chave tem desenho de reserva).
2. Linha no `CHANGELOG.md` se o jogador nota a troca; depois, skill `lancar-versao`.

Não apague o desenho SVG de reserva em `prototype/portraits/`: sem a imagem, o jogo usa o desenho.
