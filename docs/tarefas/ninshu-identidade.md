---
objetivo: Exibir a marca Ninshu Roots com a folha de Konoha e um único tema escuro grafite no jogo, no PWA e no UI Lab.
escopo: ["prototype/index.html", "prototype/art.ts", "prototype/gate.ts", "prototype/shell.ts", "prototype/roleta/session.ts", "prototype/sw.ts", "prototype/pwa/icon.html", "prototype/pwa/icon-192.png", "prototype/pwa/icon-512.png", "prototype/pwa/LEIAME.md", "prototype/styles/**", "prototype/lab/lab.html", "prototype/lab/catalog.ts", "prototype/lab/frame.ts", "prototype/lab/context.ts", "prototype/lab/types.ts", "prototype/lab/scenarios/gate.ts", "prototype/lab/scenarios/meta.ts", "src/data/strings/ptBR.ts", "scripts/build-prototype.ts", "scripts/revisar-visual.ts", "tests/share.test.ts", "tests/uilab.test.ts", "README.md", "PRODUCT.md", "DESIGN.md", ".impeccable/design.json", ".claude/skills/*/SKILL.md", "docs/visual.md", "docs/ui-lab/SCREEN_INVENTORY.md", "docs/ui-lab/ARCHITECTURE.md", "docs/processo/fluxo.md", "docs/base/plataforma.md", "public/img/LEIAME.md", "docs/registro.md", "changelog.d/ninshu-identidade.md"]
fora: ["src/core/**", "src/state/**", "src/data/**/balance*.ts", "src/data/balance*.ts", "package.json", "package-lock.json", "CHANGELOG.md", "AGENTS.md", "CLAUDE.md", ".github/**", "public/img/cenas/**", "plano-codex-telas.md", "prompts-codex-telas.md"]
pronto: ["npm run check verde", "UI Lab conferido em 360, 390, 768, 1024 e 1440 px no tema escuro, com capturas no PR", "save antigo com theme light abre no escuro e preserva as outras preferências", "PWA de produção e staging apagam os caches ninja-roleta- antigos do próprio canal e abrem offline", "docs e fragmento no mesmo commit, PR para staging sem Co-Authored-By"]
agente: codex
revisor: claude
---

# Identidade de Ninshu Roots

## Pedido

Aplicar somente a Tarefa 1 do plano `plano-codex-telas.md`. O jogo passa a se chamar **Ninshu Roots**, com a folha de Konoha do mockup `portao-da-vila.png` como ícone e um único tema escuro grafite. Saem o tema Pergaminho, o botão de tema e a alternância dia/noite do Portão da Vila.

## Contexto

A branch `feature/ninshu-identidade` parte de `origin/staging` em `2104ffa`, que já inclui o PR #35 com a composição Shinobi. A referência do ícone é o azulejo vermelho com a folha em traço claro no canto da barra lateral do mockup. A direção visual e as regras de entrega estão em [Direção visual](../visual.md), [DESIGN.md](../../DESIGN.md), [AGENTS.md](../../AGENTS.md) e [Fluxo de branches e versões](../processo/fluxo.md).

## Plano

1. Usar **Ninshu Roots** no título, na marca da interface, no compartilhamento, no UI Lab e no manifesto do PWA. Manter a identificação do preview de staging e atualizar a expectativa de `tests/share.test.ts`. Atualizar as menções ao nome do jogo nos docs, no contexto do Impeccable e nos textos das skills.
2. Criar `icon('konoha')` em `ICONS`, com traço 24×24 em `currentColor`, e usar a folha nos selos de marca da interface. Atualizar a fonte do ícone do PWA em `prototype/pwa/icon.html`, os PNGs de 192 e 512 px e o LEIAME.
3. Fixar a aparência escura desde o primeiro carregamento, com fundos entre `#1a1918` e `#24221f`, contraste WCAG AA e cor do navegador e do manifesto coerentes com a paleta. Remover seletor, leitura de preferência do aparelho e regras do tema claro, inclusive nas camadas Shinobi. O pergaminho de cena continua com papel e tinta escura. Usar apenas tokens para cor, fonte, duração e forma na interface. Manter chanfros nos pseudoelementos e detalhes dos controles em `tip()`.
4. Apresentar uma cena no Portão, com a arte noturna existente, citação e selo únicos por carregamento, sem camadas sobrepostas nem transição dia/noite. Preservar o fallback de Konoha e a cena viva no modo Animado. As artes de dia e de noite continuam disponíveis para os pôsteres da Jornada.
5. Ignorar o campo legado `theme` ao ler `proto_settings_v1`. Conferir no protótipo com uma preferência gravada como `light`, inclusive em navegador configurado no modo claro, e verificar que as demais opções continuam funcionando. Migrar os prefixos do service worker para `ninshu-roots-` e `ninshu-roots-staging-`. Testar instalação, ativação e abertura offline nos dois canais, com caches legados, caches do outro canal e um cache alheio na mesma origem. Cada ativação deve remover os caches legados e obsoletos do próprio canal e preservar os demais.
6. Atualizar os cenários afetados do UI Lab e remover seu seletor de tema. Gerar com `npm run lab` e conferir em 360, 390, 768, 1024 e 1440 px. Cobrir Portão vazio, com perfil médio e run salva, perfil cheio e modo Animado, além de exemplos de navegação, combate e pergaminho que usam os tokens globais. Conferir legibilidade, foco, toque, menos movimento e rolagem horizontal. Rodar `npm run lab:seed -- --all` se um sorteio quebrar. Anexar capturas ao PR.
7. Atualizar `docs/visual.md`, `DESIGN.md`, `docs/ui-lab/SCREEN_INVENTORY.md` e as referências diretas ao nome ou à escolha de tema. Registrar a decisão de 19/11 em `docs/registro.md` e criar `changelog.d/ninshu-identidade.md`. Rodar `npm run check`, commitar implementação e docs juntos, subir a branch e abrir PR para `staging` com revisão cruzada do Claude.

## Fora do escopo

- Composição das telas, reformulação do Portão, modos, navegação, lobby, palco de combate, sprites e artes novas de cenário.
- Mecânicas, balanceamento, nomes ou identificadores internos dos modos, seletores de fluxos existentes consultados pelo TypeScript, repositório, dependências e chaves de `localStorage`. Em `src/data`, o escopo desta tarefa é `src/data/strings/ptBR.ts`.
- Arquivos locais do plano e dos prompts, alterações de processo, release, tag e publicação em produção.

## Decisões para o usuário

- Para o Portão desta etapa, a proposta é reaproveitar a arte noturna e as citações já usadas no Sumi, mantendo a composição atual até a Tarefa 2.
- O plano menciona `AGENTS.md` e `CLAUDE.md`, mas a validação `processo-protegido` impede alterações nesses arquivos em `feature/ninshu-identidade`. O `CLAUDE.md` da base já aponta para o `AGENTS.md` e não repete a regra de tema. A proposta é atualizar a regra visual nos docs desta tarefa e encaminhar a referência antiga do `AGENTS.md` para uma issue de processo.

## Achados

- A referência a dois temas em `AGENTS.md` requer uma tarefa de processo. Acompanhamento na [issue #40](https://github.com/guidxsa/ninja-roleta/issues/40).
- Em 360 px, a borda inferior do pergaminho da Jornada corta o rótulo Jogar. Acompanhamento na [issue #41](https://github.com/guidxsa/ninja-roleta/issues/41).
