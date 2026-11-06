# CLAUDE.md

## Visão geral

Jogo de browser de sessões curtas (1 a 3 minutos por luta, feito para o celular), inspirado no universo ninja de Naruto. Projeto de fã, open source, sem fins lucrativos. A roleta visual é a identidade do jogo (inspiração: https://pokemon-roulette.zeroxm.com.br/).

**O RNG é o coração do jogo**: origem, iniciativa, acerto, dano, eventos e recompensas passam por roleta, mas os status do jogador sempre influenciam as chances.

Dois modos: **Roleta** (rápido e simples; run em ciclos infinitos) e **Jornada** (roguelike de equipe com talentos e relíquias; runs História e Caminho Ninja).

## Onde está cada coisa

| Arquivo | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice das regras do jogo |
| [docs/decisoes.md](docs/decisoes.md) | **O que espera o usuário**: balanceamento fora do alvo e design em aberto. Ler antes de mexer em regra ou número |
| [docs/registro.md](docs/registro.md) | Histórico das decisões e das simulações por versão. Só consulta: não ler inteiro sem motivo |
| `CHANGELOG.md` | Histórico de versões (o que mudou para quem joga) |
| `.claude/skills/` | `nova-mecanica` (fluxo de regra nova) e `lancar-versao` (publicar) |

Pastas dos docs: `base/` (regras dos dois modos), `roleta/`, `jornada/` e `reserva/` (combate clássico guardado para a Jornada).

### Regras para os docs

- **Os docs são o design; os dados são a implementação.** Os números vivem em `balance` e `src/data/`; os docs devem bater com eles.
- Mudou regra ou número no código: atualizar o doc no mesmo commit.
- Código e doc divergem e não está em `docs/decisoes.md`: perguntar antes de escolher um lado.
- Cada regra é descrita em **um** arquivo; os outros apontam com link. Regra dos dois modos fica em `docs/base/`; a Jornada só descreve o que muda.
- Decisão tomada sem o usuário: registrar em `docs/registro.md` (frase curta + simulação de antes e depois) e, se ele precisa revisar, um item em `docs/decisoes.md`.
- `tests/docs.test.ts` confere que toda técnica do jogador está em `docs/base/tecnicas.md` e toda de vilão em `docs/base/viloes.md`.
- **Não apagar o clássico**: reações, disputa, barreiras, estados elementais, linhas elementais e kits ricos ficam no código (com testes, `npm run sim:classico`) e em `docs/reserva/`.

## Princípios

- **Mobile-first**: um toque, layout vertical, botões grandes.
- **Offline**: PWA com service worker. **Sem backend.**
- **Run só em memória** (F5 reseta), exceto a Jornada, salva a cada parada (`jornada_run_v1`). Perfil e histórico em `localStorage`.
- **Lógica separada da interface**: regras são funções puras, sem DOM.
- **RNG injetável**: toda função que sorteia recebe `rng()`; testes com seed.
- **Tudo é dado**: origens, técnicas, vilões, eventos, itens e recompensas em arquivos de dados; textos em PT-BR nos arquivos de strings.
- README deixa claro que é projeto de fã, sem afiliação oficial.

## Stack e estrutura

Vite + TypeScript sem framework de UI; Vitest; esbuild gera o protótipo.

```
docs/                design (ver acima)
src/core/            regras puras comuns; roleta/ (motor e run do Roleta); jornada/ (combate de equipe, mapa, talentos, relíquias)
src/data/            balance e dados; roleta/ e jornada/ com os de cada modo; strings/ptBR.ts
src/sim/             bots da simulação
src/state/           save da Jornada
prototype/           interface jogável (main.ts, jornada/, art.ts com retratos e ícones, styles/)
scripts/             simulações e build
tests/               testes do core
```

Comandos: `npm test`, `npm run typecheck`, `npm run proto`, `npm run sim:origens -- --runs 300 --seed 2` (Roleta), `npm run sim:jornada -- [runs] [seed] [ciclos]`, `npm run sim:classico`.

## Interface (design system "Shinobi")

- Estilos em `prototype/styles/` (camadas: `tokens.css` → `fonts.css` → `base.css` → `components.css` → telas); o build junta e embute as fontes.
- Cores, fontes, durações e forma só por tokens (`var(--...)`); os temas Sumi (escuro) e Pergaminho (claro) trocam só os tokens.
- **Nada de emoji como ícone**: SVG do `ICONS` em `prototype/art.ts` (`icon(nome)`), traço 24×24 em `currentColor`. Exceção: o texto de compartilhar.
- Cantos retos (`--radius: 2px`) e chanfro (`--cut`) nos painéis, sempre em `::before`/`::after`, nunca no elemento (cortaria números flutuantes e o foco).
- `--font-display` (pincel) só em letreiro grande; texto em `--font-body`; números e rótulos em `--font-hud`; kanji em `--font-kanji` (kanji novo entra no recorte, `prototype/fonts/LEIAME.md`).
- Ids, `data-*` e classes que o TS consulta (`.primary`, `.jf`, `.sticky-cta`...) são contrato: o visual não mexe neles.
- **Botões simples, detalhes na dica**: ícone, nome e números principais (dano, custo, usos). Efeitos, regras e motivo de bloqueio na dica (`tip()`). Nada de instrução no botão.

## Convenções

- `core` não acessa DOM, `localStorage` nem `Math.random`.
- Número de balanceamento só em configuração (`balance`).
- Dano e resistência arredondados para baixo no fim do cálculo.
- Antes de mudar uma fórmula, escrever ou ajustar o teste.
- Balanceamento: proposto ao usuário com a tabela de antes e depois, nunca compensado sozinho (alvo em `docs/decisoes.md`).
- **Toda versão termina publicada** (testar, commitar, push e tag `vX.Y.Z`) sem esperar pedido: skill `lancar-versao`. Nunca `--force`; só segurar se o usuário pedir.
