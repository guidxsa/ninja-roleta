---
objetivo: Registrar cada run dos três modos com detalhes, mostrar e expandir cada uma no Histórico e dar ao Livro Bingo os inimigos da Jornada e uma ficha temática por inimigo, sem mudar regra nem número do jogo.
escopo: ["docs/tarefas/registro-fichas.md", "src/state/runHistory.ts", "src/state/profile.ts", "src/state/jornadaRuns.ts", "src/core/avatar.ts", "src/core/jornada/foes.ts", "src/data/strings/ptBR.ts", "src/data/strings/jornada.ts", "src/data/strings/bingo.ts", "tests/runHistory*.test.ts", "tests/profile*.test.ts", "tests/jornadaRuns.test.ts", "tests/jornadaFoes.test.ts", "tests/avatar.test.ts", "tests/uilab.test.ts", "prototype/roleta/common.ts", "prototype/roleta/run.ts", "prototype/jornadaHost.ts", "prototype/jornada/host.ts", "prototype/jornada/index.ts", "prototype/registry.ts", "prototype/bingoSheet.ts", "prototype/gate.ts", "prototype/art.ts", "prototype/back.ts", "prototype/styles/index.css", "prototype/styles/profile.css", "prototype/styles/shinobi/detalhes.css", "prototype/styles/shinobi/bingo.css", "public/img/cenas/bingo-*.webp", "prototype/lab/scenarios/meta.ts", "prototype/lab/scenarios/gate.ts", "prototype/lab/fixtures/*.ts", "docs/base/perfil.md", "docs/visual.md", "DESIGN.md", "docs/ui-lab/SCREEN_INVENTORY.md", "changelog.d/registro-fichas.md"]
fora: ["src/core/roleta/**", "src/core/jornada/run.ts", "src/core/jornada/battle*.ts", "src/sim/**", "src/data/balance*.ts", "src/data/**/balance*.ts", "src/data/jornada/enemies.ts", "src/data/jornada/stages.ts", "src/data/jornada/generic.ts", "src/data/roleta/**", "public/img/ninja/**", "public/img/viloes/**", "public/img/jornada/**", "prototype/portraits/**", "package.json", "package-lock.json", "CHANGELOG.md", ".github/**", "plano-codex-telas.md", "prompts-codex-telas.md", "correcao-pr46.md", "imagens-codex.md", "arte-codex/**"]
pronto: ["npm run check verde", "registro e perfil antigos carregam sem erro (com teste)", "uma run de cada modo aparece no Histórico com os detalhes ao expandir", "o Livro Bingo tem as seções Arcade, História e Campanha, e cada inimigo visto abre a ficha", "inimigo não visto continua ???", "ficha em tela cheia no celular e em painel ao lado no desktop, fechada por voltar, Esc e o voltar do navegador", "UI Lab em 360, 390, 768, 1024 e 1440 px sem rolagem horizontal nem erro no console", "sim:origens e sim:jornada com o mesmo resultado de antes (nada de jogo mudou)", "docs e fragmento no mesmo commit, PR para staging, sem Co-Authored-By"]
agente: claude
revisor: codex
---

# Histórico detalhado e fichas do Livro Bingo

## Pedido

Tarefa 2b do plano das telas, depois do Portão (PR #46, já no staging). Cada run fica registrada com detalhes nos três modos, o Histórico mostra e expande cada uma, e o Livro Bingo ganha os inimigos da Jornada e uma ficha temática de cada inimigo. Os fundos das fichas vêm do lote 2 de imagens, gerado pelo Codex.

## Contexto

Conferido no `staging` (`af8028c`):

- O `RunRecord` (`src/state/runHistory.ts`, chave `runs_v1`) guarda só origem, status, etapa, revives, dificuldade, seed, ciclo e lutas.
- A Jornada não tem histórico: o `jornada_run_v1` é apagado no fim, e o `recordJornada` (`prototype/jornadaHost.ts`) só guarda o recorde da Campanha (`profile.jornada.generic`).
- O Livro Bingo (`bingoTab`, `prototype/registry.ts`) lê só `profile.villains`, que o `noteFight` do Arcade grava. Os 43 inimigos da Jornada (`src/data/jornada/enemies.ts`) não aparecem.
- Durante a run do Arcade já existem os dados que faltam ao registro: as lutas em ordem com o resultado (`camp.stats.fights`), os eventos sorteados (`camp.stats.preEvents`) e as relíquias (`camp.player.relics`).

Docs lidos: [AGENTS.md](../../AGENTS.md), [docs/visual.md](../visual.md), [docs/base/perfil.md](../base/perfil.md), [docs/decisoes.md](../decisoes.md) e o plano local das telas.

## Plano

1. **Dados salvos** (só campos novos opcionais; save antigo carrega sem erro, com teste):
   - **Arcade (`runs_v1`)**: o `RunRecord` ganha `foes` (vilões em ordem, com o resultado de cada luta), `fallenTo` (quem derrotou o jogador), `relics`, `events` e `bestHit`. O `track()` e o fim da run (`prototype/roleta/common.ts` e `run.ts`) preenchem esses campos a partir do que a run já tem.
   - **Jornada**: uma chave nova, `jornada_runs_v1` (`src/state/jornadaRuns.ts`), com o mesmo teto do Arcade (`balance.history.maxRuns`, só leitura). Ela é gravada pelo `recordJornada` no fim da run, nos dois modos, e ao substituir um save (como abandonada). Cada registro guarda modo, herói ou classe, campanha, elemento, dificuldade, estágio e parada alcançados, ciclo, nível, relíquias, aliados caídos, lutas e vitórias, maior golpe e datas, tudo lido do `JRun`. Fica separada do `runs_v1` para não mexer nas contas do Arcade (recordes por origem, melhor ciclo, desempenho por dificuldade e o texto de compartilhar).
   - **Livro Bingo da Jornada**: `profile.jornadaFoes`, no formato de `VillainRecord`, gravado no fim de cada luta da Jornada (`prototype/jornada/index.ts`, logo depois do `finishFight`). O resumo por inimigo (vencido ou não, maior golpe dado e levado) sai de uma função pura nova, `src/core/jornada/foes.ts`, que só lê o `JBattle`. Fica separado do `profile.villains` porque o mesmo personagem tem números diferentes em cada modo.
   - **Avatares**: os aliados que lutaram na Jornada e os inimigos enfrentados nela entram no pool do `avatarChoices` (`src/core/avatar.ts`).
2. **Histórico** (`historyTab` e as abas História e Campanha em `prototype/registry.ts`):
   - Cada linha mostra o símbolo da origem ou da classe e o ícone do modo.
   - Tocar na linha a expande (botão com `aria-expanded`). No Arcade, a linha aberta mostra:
     - origem, elementos, dificuldade, ciclo e lutas;
     - os vilões em ordem, com mini-retrato e resultado, e quem derrotou o jogador;
     - relíquias, eventos, maior golpe, revives, data e seed.
   - Na Jornada, a linha aberta mostra herói ou classe, elemento, dificuldade, estágio e parada, nível, relíquias, aliados caídos, lutas e vitórias, maior golpe e data.
   - Um registro antigo mostra o que tem, com a nota "detalhes não registrados nesta run".
   - As abas História e Campanha listam as runs terminadas, além do Continuar da run salva.
3. **Livro Bingo** (`bingoTab` e um módulo novo, `prototype/bingoSheet.ts`):
   - **Seções:**
     - Arcade, por categoria (genin, chunin, jounin, chefe);
     - História, por arco (Ondas, Exame, Sannin, Resgate, de `stages.ts`);
     - Campanha, por estágio (g1 a g3, de `generic.ts`).
   - Tocar num inimigo já visto abre a **ficha**, com:
     - retrato grande e nome;
     - uma descrição curta original em PT-BR (`src/data/strings/bingo.ts`, uma por inimigo);
     - as técnicas, com tipo, dano e custo na dica;
     - os atributos (HP, chakra, velocidade, ataques e resistências) e a passiva;
     - o histórico do jogador contra ele (enfrentado, derrotado, derrotou você, maior e menor golpe).
   - Inimigo não visto não abre ficha e continua "???".
   - **Tema da ficha**:
     - o fundo vem do arco, ou da categoria no Arcade (lote 2: `bingo-ondas`, `bingo-exame`, `bingo-sannin`, `bingo-resgate` e `bingo-arcade`, registrados no `SCENE_ART`);
     - a moldura sobe de grau com o nível do inimigo: comum (luta ou genin), elite (chunin ou jounin) e chefe, com carimbo de procurado. Na Jornada, o nível vem do `kind` da parada.
   - **Celular:** a ficha abre em tela cheia e fecha pelo voltar, pelo Esc e pelo voltar do navegador (`prototype/back.ts`).
   - **Desktop:** a ficha abre num painel ao lado da lista.
   - Estilos num arquivo novo, `prototype/styles/shinobi/bingo.css`.
4. **UI Lab**: cenários de histórico vazio, cheio e antigo nos três modos, Bingo vazio e cheio, e uma ficha por tema e nível (`prototype/lab/scenarios/meta.ts`). Conferir com `scripts/revisar-visual.ts` em 360, 390, 768, 1024 e 1440 px.
5. **Docs**:
   - `docs/base/perfil.md`: as chaves e os campos novos;
   - `docs/visual.md` e `DESIGN.md`: a ficha, os temas e as molduras;
   - `docs/ui-lab/SCREEN_INVENTORY.md`: os cenários novos;
   - `changelog.d/registro-fichas.md`.

## Fora do escopo

- Regras de combate, chances, números e balanceamento: o registro só lê o que a run já calcula. As simulações devem dar o mesmo resultado de antes.
- Retratos novos (inimigo sem retrato usa o que já existe).
- As telas de modo da Tarefa 3, o lobby da Tarefa 4 e o palco de combate da Tarefa 5.
- Os arquivos locais de plano, prompts e imagens ficam fora dos commits.

## Decisões para o usuário

- **Descrições dos inimigos:** escrevo as 65 descrições curtas (22 do Arcade e 43 da Jornada), originais e sem citar falas do mangá. Elas ficam no PR para você conferir.
- **Mesmo personagem nos dois modos** (Zabuza, Haku, Gaara, Orochimaru...): uma entrada em cada seção, com os números de cada modo.
- **Fundos da Campanha:** os estágios g1 a g3 usam os fundos dos arcos equivalentes (g1 Ondas, g2 Exame, g3 Sannin), sem imagem própria no lote 2.
- **Runs antigas da Jornada:** não há como recuperá-las. O histórico da Jornada começa a contar nesta versão, e o recorde da Campanha continua valendo.

## Achados

- #67: `docs/roleta/campanha.md` (seção "Histórico de runs") não cita os campos novos do registro do Arcade; o arquivo ficou fora do escopo aprovado.
- #68: `scripts/revisar-visual.ts` não acha cenários do Lab com id montado por template (as fotos desta tarefa saíram de um executor à parte, fora do repositório).
- #69: o Livro Bingo da História mostra duas fichas chamadas "Gaara" (`gaara` e `gaaraWeak`).
