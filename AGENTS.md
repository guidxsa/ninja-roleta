# AGENTS.md

Regras do projeto para qualquer agente (Claude Code, Codex) e para quem contribui. É a fonte única: o `CLAUDE.md` só importa este arquivo e acrescenta o que é específico do Claude Code.

## Visão geral

Jogo de browser feito para o celular, inspirado no universo ninja de Naruto. Projeto de fã, open source, sem fins lucrativos. A roleta visual é a identidade do jogo (inspiração: https://pokemon-roulette.zeroxm.com.br/).

**O RNG é o coração do jogo**: origem, iniciativa, acerto, dano, eventos e recompensas passam por sorteio, e os status do jogador sempre influenciam as chances. No Roleta, a roleta aparece na tela; na Jornada, a sorte pesa menos e só o resultado aparece.

### Modos

Três modos, cada um com uma finalidade:

| Modo | Finalidade | Como se joga |
|---|---|---|
| **Roleta** | Rápido e simples: uma sessão curta no celular (lutas de poucas rodadas, combate explosivo) | Origem sorteada; kit de 1 passiva que evolui com o nível e 2–3 técnicas-chave, sem ativas para gerenciar; ciclo de 6 lutas com evento e relíquia sorteados; infinito no Hardcore |
| **História** (Jornada) | Longa e narrativa: viver a história do Naruto | Linear, segue o mangá; equipe, roteiro de luta, cenas e treinos; a rejogabilidade vem da variedade de talentos |
| **Caminho Ninja** (Jornada) | Roguelike de builds | Classe e elemento escolhidos, mapa ramificado, relíquias, loja e árvore; a rejogabilidade vem dos inimigos, dos caminhos e das builds; infinito no Hardcore |

História e Caminho Ninja dividem o combate de equipe, a loja, as relíquias e as árvores (a run da Jornada é salva a cada parada). Em desenvolvimento: campanha do Sasuke e outras classes na Jornada.

**Meta de vitória do bot** (por origem ou classe, ±5): Fácil 90%, Médio 65%, Difícil 40%, Hardcore 15% ([docs/decisoes.md](docs/decisoes.md)).

## Onde está cada coisa

| Arquivo | Conteúdo |
|---|---|
| [docs/README.md](docs/README.md) | Índice das regras do jogo |
| [docs/decisoes.md](docs/decisoes.md) | **O que espera o usuário**: balanceamento fora do alvo e design em aberto. Ler antes de mexer em regra ou número |
| [docs/visual.md](docs/visual.md) | Direção visual: identidade por modo, locais e regra da arte. Ler antes de mexer na interface |
| [docs/registro.md](docs/registro.md) | Histórico das decisões e das simulações por versão. Só consulta: não ler inteiro sem motivo |
| [docs/balanceamento/](docs/balanceamento/benchmark.md) | Benchmark (cenários, comandos `--auditoria`, `--reliquias`, `--iniciais`, linha de base) e o diagnóstico de balanceamento. Ler antes de propor ajuste |
| `CHANGELOG.md` | Histórico de versões (o que mudou para quem joga) |
| [docs/ui-lab/](docs/ui-lab/ARCHITECTURE.md) | UI Lab: inventário das telas e arquitetura do laboratório (cenários em `prototype/lab/`) |
| `.claude/skills/` | `nova-mecanica` (fluxo de regra nova) e `lancar-versao` (preparar e, com aprovação, publicar) |

Pastas dos docs: `base/` (regras comuns ao Roleta e à Jornada), `roleta/`, `jornada/` e `reserva/` (combate clássico guardado para a Jornada).

### Regras para os docs

- **Os docs são o design; os dados são a implementação.** Os números vivem em `balance` e `src/data/`; os docs devem bater com eles.
- Mudou regra ou número no código: atualizar o doc no mesmo commit.
- Código e doc divergem e não está em `docs/decisoes.md`: perguntar antes de escolher um lado.
- Cada regra é descrita em **um** arquivo; os outros apontam com link. Regra comum ao Roleta e à Jornada fica em `docs/base/`; a Jornada só descreve o que muda.
- Decisão tomada sem o usuário: registrar em `docs/registro.md` (frase curta + simulação de antes e depois) e, se ele precisa revisar, um item em `docs/decisoes.md`.
- `tests/docs.test.ts` confere que toda técnica do jogador está em `docs/base/tecnicas.md` e toda de vilão em `docs/base/viloes.md`.
- **Não apagar o clássico**: reações, disputa, barreiras, estados elementais, linhas elementais e kits ricos ficam no código (com testes, `npm run sim:classico`) e em `docs/reserva/`.

## Princípios

- **Celular e desktop são pares**: no celular, um toque, layout vertical e botões grandes; no desktop, composição própria (colunas, painéis fixos), não o celular ampliado. Mesma lógica nos dois; faixas e situação por tela em [docs/visual.md](docs/visual.md).
- **Offline**: PWA com service worker (`prototype/sw.ts`; [docs/base/plataforma.md](docs/base/plataforma.md)). **Sem backend.**
- **Run do Roleta só em memória** (F5 reseta); a Jornada é salva a cada parada (`jornada_run_v1`). Perfil e histórico em `localStorage`.
- **Lógica separada da interface**: regras são funções puras, sem DOM.
- **RNG injetável**: toda função que sorteia recebe `rng()`; testes com seed.
- **Tudo é dado**: origens, técnicas, vilões, eventos, itens e recompensas em arquivos de dados; textos em PT-BR nos arquivos de strings.
- README deixa claro que é projeto de fã, sem afiliação oficial.

## Stack e estrutura

TypeScript sem framework de UI; Vitest; esbuild gera o protótipo (`scripts/build-prototype.ts`: um HTML só, mais `sw.js`, manifesto e ícones). Não há Vite. A CI roda `npm run check` em toda `feature/**` e PR (`.github/workflows/ci.yml`; no PR, o `check:regras` é estrito); o `pages.yml` publica o `master`.

```
docs/                design (ver acima)
src/core/            regras puras comuns; roleta/ (motor e run do Roleta); jornada/ (combate de equipe, mapa, talentos, relíquias)
src/data/            balance e dados; roleta/ e jornada/ com os de cada modo; strings/ptBR.ts
src/sim/             bots da simulação
src/state/           save da Jornada
prototype/           interface jogável: main.ts (inicialização), roleta/ (session.ts com o estado, telas em screens/), jornada/,
                     shell.ts, gate.ts, registry.ts, art.ts com ícones e símbolos, portraits/ com os retratos (um desenho por
                     personagem), styles/
scripts/             simulações e build
tests/               testes do core
```

Comandos: `npm run check` (verificação completa, a mesma do pre-push e da CI), `npm run check:meta` (guarda da meta de vitória, só na CI por ser lenta), `npm test`, `npm run typecheck`, `npm run proto`, `npm run lab` (UI Lab, só local: `dist-lab/`, [docs/ui-lab/](docs/ui-lab/ARCHITECTURE.md); `npm run lab:seed -- --all` refaz as seeds dos cenários de sorteio), `npm run sim:origens -- --runs 300 --seed 2` (Roleta), `npm run sim:jornada -- [runs] [seed] [ciclos]`, `npm run sim:classico`. Auditoria de balanceamento: as mesmas simulações com `--auditoria`, `--reliquias` ou `--iniciais` ([docs/balanceamento/benchmark.md](docs/balanceamento/benchmark.md)).

## Interface (design system "Shinobi")

A direção está em [docs/visual.md](docs/visual.md): a interface deve parecer parte do universo.

- Estilos em `prototype/styles/` (camadas: `tokens.css` → `fonts.css` → `base.css` → `components.css` → `ornaments.css` → telas); o build junta e embute as fontes.
- Cores, fontes, durações e forma só por tokens (`var(--...)`); os temas Sumi (escuro) e Pergaminho (claro) trocam só os tokens. `--primary` é ação e navegação e `--accent` é perigo, chefe e carimbo (hoje o mesmo vermelho). Cor solta só em arte (cenário, roda, cards de modo).
- **Nada de emoji como ícone**: SVG do `ICONS` em `prototype/art.ts` (`icon(nome)`), traço 24×24 em `currentColor`. Exceção: o texto de compartilhar.
- Cantos retos (`--radius: 2px`) e chanfro (`--cut`) nos painéis, sempre em `::before`/`::after`, nunca no elemento (cortaria números flutuantes e o foco).
- Painel no estilo das referências: `.parchment` (pergaminho rasgado), nuvens (`cloud()`), `.scroll-banner`.
- `--font-display` (pincel) só em letreiro grande; `--font-hand` (manuscrita) em título de pergaminho e citação; texto em `--font-body`; números e rótulos em `--font-hud`; kanji em `--font-kanji` (kanji novo entra no recorte, `prototype/fonts/LEIAME.md`).
- Ids, `data-*` e classes que o TS consulta (`.primary`, `.jf`, `.sticky-cta`...) são contrato: o visual não mexe neles.
- **Botões simples, detalhes na dica**: ícone, nome e números principais (dano, custo, usos). Efeitos, regras e motivo de bloqueio na dica (`tip()`). Nada de instrução no botão.

## Convenções

- `core` não acessa DOM, `localStorage` nem `Math.random`.
- Número de balanceamento só em configuração (`balance`).
- Dano e resistência arredondados para baixo no fim do cálculo.
- Antes de mudar uma fórmula, escrever ou ajustar o teste.
- Balanceamento: proposto ao usuário com a tabela de antes e depois, nunca compensado sozinho (alvo em `docs/decisoes.md`).
- **Nada de push direto no `master`** (produção; o Pages publica a cada push). Cada trabalho vai numa branch `feature/<tema>`: testar, commitar e dar push só da branch, sem esperar pedido (skill `lancar-versao`). Merge no `master`, tag `vX.Y.Z` e deploy só com aprovação explícita do usuário ("publica vX.Y.Z"). Nunca `--force`.
- **Commits e PRs sem `Co-Authored-By`** nem outra linha de atribuição.
- A partir do `v1.0.0` entra o fluxo `feature/* → staging → main` com PR WIP permanente (plano aprovado, ainda não implementado).

## Como trabalhar (dois agentes)

O projeto é feito pelo Claude Code e pelo Codex, com as mesmas regras. Plano de implantação deste processo: [docs/processo/plano-harness.md](docs/processo/plano-harness.md).

### Escopo

- Toda tarefa começa por um **contrato** com objetivo, o que fica de fora, caminhos que podem ser tocados e critério de pronto (modelo em [docs/processo/tarefa-modelo.md](docs/processo/tarefa-modelo.md); o arquivo fica em `docs/tarefas/<tema>.md`, com `<tema>` igual ao da branch `feature/<tema>`). O agente escreve o contrato a partir do pedido; o usuário aprova antes do código.
- Mexer só no que o contrato permite. Precisou sair do escopo: parar e pedir para atualizar o contrato; não ampliar sozinho. O `npm run check:escopo` (dentro do `npm run check`) compara o diff com o `escopo` e o `fora` do contrato; `CHANGELOG.md`, `docs/registro.md` e `docs/decisoes.md` sempre podem mudar; `package.json` e `package-lock.json`, só na versão do projeto (o resto muda o que se instala e precisa estar no escopo). O tema vem da branch `feature/<tema>` ou, numa branch com outro nome (Codex na nuvem), do único `docs/tarefas/<tema>.md` alterado. Sem tema ou sem contrato é aviso, e vira erro a partir de 02/12/2026, na CI e na máquina (branch sem tema: `CHECK_TEMA=<tema>`).
- **Aprovação do contrato**: no PR, o usuário põe a etiqueta `contrato-aprovado`; a CI confere (aviso até 02/12/2026, erro depois). **Agente nunca põe, tira nem pede para pular essa etiqueta.** A etiqueta vale para o contrato como estava quando o usuário a pôs (a CI não sabe quando foi posta): se o contrato mudar depois disso, o agente avisa no resumo e no PR que a aprovação precisa ser refeita, e o usuário tira e põe a etiqueta de novo depois de conferir.
- Achou bug, melhoria ou doc desatualizado fora do escopo: anotar em **Achados** no resumo final e no PR, sem corrigir.
- Nada de refatoração, renomeação ou formatação "de passagem".

### Definição de pronto

Uma tarefa só está pronta quando:

1. `npm run check` passa (typecheck, testes, `check:regras`, `check:escopo` e build), com a saída mostrada no resumo. Os git hooks: `pre-commit` (`check:regras` sobre o que vai no commit) e `pre-push` (`npm run check` na branch que sobe, com a árvore limpa; recusa push no `master`, push forçado, push de uma branch que não é a atual e push com mudanças fora do commit). Eles só valem para push feito do próprio clone: a garantia final é a CI e a proteção do `master` no GitHub. Hook nunca é pulado (`--no-verify` é proibido); se ele falha, corrige-se a causa.
2. Regra ou número mudou: o doc correspondente mudou no mesmo commit.
3. O jogador nota a mudança: linha no `CHANGELOG.md`.
4. Houve decisão sem o usuário: registrada em `docs/registro.md` e, se ele precisa revisar, em `docs/decisoes.md`.
5. Balanceamento: a tabela de antes e depois está no resumo e nada foi compensado sozinho. A CI roda a guarda da meta (`npm run check:meta`, job próprio, ~1 min): se ela quebrar, **não ajuste número para passar**; pare e proponha ao usuário com a tabela de antes e depois.
6. Só arquivos dentro do escopo do contrato aparecem no diff.
7. Commit e push só da branch `feature/<tema>`; merge, tag e deploy só com aprovação explícita.

O resumo final segue o modelo de PR (`.github/pull_request_template.md`): objetivo, fora do escopo, caminhos tocados, como verificou, docs atualizados, achados e quem implementou e quem revisou.

### Skills e fluxos

As skills são instruções em markdown e valem para os dois agentes. **Antes de uma tarefa do tipo da tabela, ler o `SKILL.md` correspondente e seguir o fluxo dele.** O agente que não carrega skills sozinho (Codex) lê o arquivo pelo caminho.

| Tipo de tarefa | Skill |
|---|---|
| Regra nova ou alterada, ajuste de fórmula ou balanceamento, reclamação de comportamento de jogo | [.claude/skills/nova-mecanica/SKILL.md](.claude/skills/nova-mecanica/SKILL.md) |
| Fechar ou publicar versão (commit, push da branch, merge, tag) | [.claude/skills/lancar-versao/SKILL.md](.claude/skills/lancar-versao/SKILL.md) |
| Retrato ilustrado novo, refeito ou trocado (`public/img/ninja`, `viloes`, `jornada`) | [.claude/skills/novo-retrato/SKILL.md](.claude/skills/novo-retrato/SKILL.md) |
| Medir o balanceamento contra a meta, check:meta quebrado, antes de propor número | [.claude/skills/auditar-balanceamento/SKILL.md](.claude/skills/auditar-balanceamento/SKILL.md) |
| Conferir tela depois de mexer em interface (fotos do UI Lab em celular e desktop, dois temas) | [.claude/skills/revisar-visual/SKILL.md](.claude/skills/revisar-visual/SKILL.md) |

Skill nova entra nesta tabela no mesmo commit.

### Dois agentes

- Uma branch tem **um agente por vez**: Claude e Codex nunca trabalham juntos na mesma branch.
- **Quem implementa não revisa**: o PR do Codex é revisado pelo Claude (`/code-review`) e vice-versa. O merge é do usuário.
- Cada sessão começa lendo este arquivo e o contrato da tarefa. Configuração de cada agente: `CLAUDE.md` (Claude Code) e [docs/processo/codex.md](docs/processo/codex.md) (Codex).
- Este arquivo, o `CLAUDE.md`, os hooks, os scripts de verificação, os `scripts` do `package.json` e as configurações dos agentes só mudam numa tarefa de processo pedida pelo usuário, na branch `feature/harness` ou `feature/harness-<tema>` (o `check:regras` confere o nome): o agente não afrouxa as próprias regras.
