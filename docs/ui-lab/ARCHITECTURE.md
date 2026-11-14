# Arquitetura do UI Lab (etapa 2)

Proposta para o laboratório de testes visuais que substitui o `?teste`. Parte do [inventário](SCREEN_INVENTORY.md)
aprovado. Ainda não implementada.

## Resumo

- O lab é **outra página** (`lab.html`), com **outro ponto de entrada** (`prototype/lab/main.ts`) e **outro build**
  (`npm run lab` → `dist-lab/`). O jogo publicado não importa nada dele e o Pages não o copia.
- O lab chama **as mesmas funções de tela** do jogo (`mapScreen`, `jornadaBattle`, `shopScreen`...). O que muda é de onde
  vêm os dados: no jogo, do `localStorage` e do sorteio; no lab, de um **cenário** (fixture tipada + seed fixa).
- O lab roda com **armazenamento em memória**: nenhuma tela consegue ler nem gravar o save, o perfil ou as preferências
  reais.
- Para isso o jogo precisa de **poucas costuras** (ver [§3](#3-costuras-no-código-do-jogo)), sem mudar comportamento:
  separar a inicialização das telas da Roleta e exportar as telas da Jornada.

## 1. Como se encaixa no projeto

O projeto já tem as peças que o lab precisa:

| Já existe | O lab usa para |
|---|---|
| Regras puras em `src/core/` (sem DOM, `localStorage` nem `Math.random`) | Montar estados válidos rodando as próprias regras (`newRun`, `buildLabPlayer`, `newRoletaRun`...) |
| RNG injetável (`createRng(seed)`) | Cenários determinísticos |
| `KeyValueStorage` (interface do armazenamento) | Trocar o `localStorage` por um mapa em memória |
| `JornadaHost` (`prototype/jornada/host.ts`): a Jornada só fala com o resto por ele | O lab é **outro host**, com perfil, preferências e armazenamento de mentira |
| `loadJornada` normaliza e migra saves antigos | Validar fixtures de run da Jornada (e aceitar runs capturadas do jogo) |
| `src/core/lab.ts` (`buildLabPlayer`, `labOrigin`, `applyLabStats`) | Montar o jogador da Roleta, como o lab antigo |
| Telas como funções `async` que escrevem em `#screen` e resolvem com a escolha | Montar uma tela sozinha, sem o fluxo em volta |

O padrão é o do `JornadaHost`, estendido à Roleta: **a tela recebe o contexto, não o busca**. Não entra framework, roteador
nem dependência nova.

## 2. Arquitetura

```
 dist-lab/lab.html   (só local, nunca no Pages)
 ┌──────────────────────────────────────────────────────────────────────┐
 │ Catálogo (lab/catalog.ts)                                            │
 │  lista de cenários · busca · tema · instantâneo · menos movimento    │
 │  larguras: 360 · 390 · 768 · 1024 · 1440                             │
 │        │ ?s=<id>&frame=1&theme=…                                     │
 │        ▼                                                             │
 │  ┌─ <iframe> lab.html em modo quadro ──────────────────────────────┐ │
 │  │ casca real (header, #screen, navs)  ← mesmo HTML e CSS do jogo  │ │
 │  │ lab/frame.ts: lê ?s= → registry → cenário                       │ │
 │  │   ctx = { storage em memória, rng(seed), perfil, prefs, host }  │ │
 │  │   cenário.mount(ctx) → tela real do jogo                        │ │
 │  └─────────────────────────────────────────────────────────────────┘ │
 └──────────────────────────────────────────────────────────────────────┘
```

**Por que um iframe:** as faixas de tela (`DESK`, `WIDE`, `max-width: 380px`) são media queries e `matchMedia`. Só um
iframe do tamanho certo dispara as mesmas regras que o aparelho; encolher uma `div` não. O modo quadro também é a URL
direta de um cenário (abre sozinho, sem o catálogo).

### 2.1 Cenário

Um cenário é um objeto pequeno: identificador, título, os dados de partida e a função que monta a tela real.

```ts
// prototype/lab/types.ts
export interface Scenario {
  /** Id do inventário + variante: `jornada.shop:cursed`. Único (teste). */
  id: string;
  title: string;
  /** Seção do catálogo (as categorias do inventário). */
  group: Group;
  /** Seed do RNG do cenário (padrão 1). */
  seed?: number;
  /** Perfil de partida (padrão: `profiles.empty`). */
  profile?: Profile;
  /** Preferências (tema, instantâneo...) quando o cenário depende delas; o catálogo pode sobrepor. */
  prefs?: Partial<LabPrefs>;
  /** Monta a tela real. Resolve quando a tela termina (o catálogo mostra "fim do cenário"). */
  mount(ctx: LabContext): Promise<unknown>;
  /** Conferências que o teste roda sem DOM (ex.: a seed ainda sorteia o evento esperado). */
  expect?: (ctx: LabContext) => void;
}
```

`LabContext` reúne o que o jogo hoje busca sozinho: `storage` (memória), `rng`, `profile`, `prefs`, `jornadaHost` e a
sessão da Roleta (§3). É montado do zero a cada abertura do cenário, então abrir de novo dá o mesmo resultado.

### 2.2 Identificadores

- Formato `modo.sistema.tela[:variante]`, os mesmos ids do inventário: `roleta.event.guru:charlatan`,
  `jornada.battle:downed-ally`, `jornada.talents:all-states`.
- Sem variante é o estado padrão da tela.
- Um teste garante: id único, formato válido e que o prefixo (antes de `:`) existe no `SCREEN_INVENTORY.md`. Assim o
  inventário e o lab não se separam.

### 2.3 Registro

Explícito, sem descoberta automática de arquivos (o esbuild não faz glob e um import esquecido aparece no teste de
cobertura):

```ts
// prototype/lab/registry.ts
import { gate } from './scenarios/gate';
import { roleta } from './scenarios/roleta';
import { jornada } from './scenarios/jornada';
import { meta } from './scenarios/meta';

export const SCENARIOS: readonly Scenario[] = [...gate, ...roleta, ...jornada, ...meta];
export const byId = new Map(SCENARIOS.map((s) => [s.id, s]));
```

Cada arquivo de `scenarios/` exporta uma lista. Cadastrar uma tela nova é acrescentar um item numa lista; nada mais muda.
Quando um arquivo crescer demais, ele vira pasta (`scenarios/jornada/battle.ts`) sem mexer no resto.

### 2.4 Renderização

1. `lab/frame.ts` lê `?s=` e acha o cenário (id desconhecido mostra a lista com os parecidos).
2. Monta o contexto: armazenamento em memória já com o perfil do cenário, `rng = createRng(seed)`, preferências.
3. Liga a **casca real** (cabeçalho, dicas, dobras, tema, fontes), pelas mesmas funções que o jogo usa (§3).
4. Chama `scenario.mount(ctx)`, que chama a tela real.
5. Quando a tela resolve, uma faixa do lab (fora de `#screen`) mostra o resultado e os botões **Repetir** e **Próximo**.
6. O botão Portão do cabeçalho, no lab, recarrega o cenário em vez de ir ao Portão (o `goHome()` corta a tela como hoje).

### 2.5 Carregamento por URL

| Parâmetro | Efeito |
|---|---|
| `?s=<id>` | Cenário (sem ele: catálogo) |
| `&frame=1` | Só a tela, sem catálogo (é o que o iframe abre) |
| `&theme=light\|dark` | Tema |
| `&instant=1` | Modo instantâneo |
| `&still=1` | Simula menos movimento (classe no `<html>`; o `matchMedia` real não dá para forçar) |
| `&art=0` | Sem arte: força o cenário desenhado em CSS |
| `&seed=N` | Troca a seed do cenário (explorar variações) |
| `&w=390` | Largura do iframe no catálogo |

O catálogo guarda a última escolha só para conveniência, em `localStorage` sob a chave `uilab_prefs_v1` (a única chave
que o lab grava; nenhuma do jogo).

## 3. Costuras no código do jogo

O lab só funciona se as telas puderem ser chamadas de fora. Hoje a Jornada quase pode; a Roleta não. As mudanças abaixo
**não mudam comportamento** e vão numa versão própria, antes do lab, testadas jogando.

| # | Mudança | Por quê |
|---|---|---|
| 1 | Separar `prototype/main.ts` em **inicialização** (`main.ts`: lê `localStorage`, monta o estado, chama `main()`) e **módulos sem efeito ao importar** | Hoje importar `main.ts` já inicia o jogo (`void main()` no fim) |
| 2 | Estado da Roleta numa **sessão** (`prototype/roleta/session.ts`): `storage`, `settings`, `profile`, `rng`, `camp`, `campLive`, `battlePlayer`. As telas leem `ses.camp` em vez da variável solta | É o que o lab troca. Mesmo padrão do `JornadaHost`, sem classe nem framework |
| 3 | Telas da Roleta em módulos (`prototype/roleta/screens/*.ts`), exportadas | Hoje são funções internas de um arquivo de 3.100 linhas |
| 4 | Casca em `prototype/shell.ts`: `installHeaderToggles`, `installSideNav`, `installQuoteStrip`, `loadFonts`, `applyTheme` | O lab liga a mesma casca |
| 5 | Exportar as telas da Jornada (`playStop`, `mapScreen`, `eventStop`, `fightStop`, `restStop`, `treasureStop`, `bossChoiceScreen`, `notice`, `endScreen`, `revealScreen`...) e um setter para `pendingGains` | Já recebem `host` e `run`: falta só exportar |
| 6 | `jornadaBattle` e `battleScreen` aceitam um **estado inicial opcional** da luta | Para abrir uma luta no meio (aliado caído, forma ativa, Portões). Sem ele, igual a hoje |

Fica de fora de propósito: nenhuma regra, número, texto ou classe CSS muda. Ids, `data-*` e classes continuam contrato.

## 4. Dados de demonstração

### 4.1 Princípio

Fixtures descrevem **estado**, nunca regra. Elas escolhem onde a run está, quanto ryō tem, quais relíquias; não tocam em
`balance` nem em `src/data/`. O estado é montado **rodando as regras reais** sempre que possível, para nascer válido.

### 4.2 Três tipos

| Tipo | Arquivo | Como monta | Exemplo |
|---|---|---|---|
| **Construtor** (preferido) | `fixtures/roleta.ts`, `fixtures/jornada.ts` | Função tipada que chama o core com seed fixa e aplica um ajuste parcial | `roletaCamp({ lineage: 'uchiha', level: 5, step: 2 })`, `jornadaRun({ campaign: 'naruto', stage: 1, stop: 3, ryo: 400 })` |
| **Captura** | `fixtures/saves/*.json` | Run da Jornada copiada do jogo (`jornada_run_v1`), lida por `loadJornada` (normaliza e migra) | Estado difícil de montar à mão: final da História, árvore quase completa |
| **Perfil** | `fixtures/profiles.ts` | `emptyProfile()` + `unlockAchievements`/`discoverRelics` com data fixa | `profiles.empty`, `profiles.mid`, `profiles.full` |

Construtores ficam em TypeScript, não em JSON solto: quando o tipo `JRun` ou `PlayerState` muda, o `typecheck` aponta a
fixture quebrada. As capturas passam pela mesma migração dos saves reais, então sobrevivem a versões novas como um save
de jogador sobreviveria.

### 4.3 Determinismo

- **RNG do jogo**: sempre `createRng(seed)` do cenário.
- **`Math.random` da interface** (frases, ids de run, sorteio de citação): no lab, `frame.ts` troca `Math.random` por um
  gerador com a seed do cenário antes de tudo. Só na página do lab; o jogo não muda.
- **Datas** ("há 3 dias", data no histórico): os perfis usam datas fixas e o lab congela `Date.now` no dia do cenário.
- **Animações**: o catálogo pode abrir com instantâneo, para a captura de tela não pegar a roleta no meio.

### 4.4 Telas que sorteiam ao abrir

Origem, evento pré-luta, recompensa e luta da Roleta sorteiam dentro da própria tela. Para mostrar um resultado
específico (guru charlatão, invocação nova) sem mudar a tela, o cenário escolhe uma **seed que produz aquele resultado**
e declara o que espera:

```ts
expect: (ctx) => assert(rollWeighted(data.preFightEvents, ctx.rng).value === 'guru')
```

O teste roda o `expect` de todo cenário sem DOM. Se uma mudança de peso fizer a seed sortear outra coisa, a CI quebra e
`npm run lab:seed -- <id>` procura uma seed nova. Assim o lab acompanha o balanceamento sem forçar resultado dentro do
jogo.

## 5. Organização de arquivos

```
prototype/
  main.ts                 inicialização do jogo (lê localStorage, chama main)
  shell.ts                casca compartilhada (costura 4)
  roleta/
    session.ts            estado da Roleta (costura 2)
    screens/*.ts          telas da Roleta (costura 3)
  jornada/                como hoje, com as telas exportadas (costura 5)
  lab/                    ← só o lab importa daqui
    main.ts               entrada do lab.html: decide catálogo ou quadro
    catalog.ts            lista, filtros, iframe, larguras
    frame.ts              monta o contexto e chama o cenário
    context.ts            armazenamento em memória, host de mentira, sessão
    registry.ts           lista de cenários
    types.ts
    scenarios/            gate.ts, roleta.ts, jornada.ts, meta.ts
    fixtures/             roleta.ts, jornada.ts, profiles.ts, saves/*.json
    lab.html              template (mesma casca do index.html + faixa do lab)
    lab.css               estilo só do catálogo e da faixa
scripts/
  build-prototype.ts      o jogo (sem mudar o que sai)
  build-lab.ts            o lab → dist-lab/
  lab-seed.ts             procura seed para um cenário
tests/
  uilab.test.ts           ids, inventário, expect dos cenários, isolamento
```

O empacotamento comum (esbuild do JS, CSS com fontes, marcadores do template) sai de `build-prototype.ts` para uma
função que os dois scripts usam. O jogo continua gerando o mesmo `dist/prototipo.html`.

## 6. Isolamento

### 6.1 Saves e progresso

| Risco | Proteção |
|---|---|
| Tela grava save, perfil ou preferência | O lab nunca entrega `window.localStorage` a ninguém: `context.ts` cria um `KeyValueStorage` em memória, novo a cada cenário |
| Conquista, recorde ou relíquia vai para o perfil real | O perfil vive na mesma memória; o host do lab grava nela e descarta ao trocar de cenário |
| Código do lab acessa o `localStorage` direto | Teste: dentro de `prototype/lab/`, só `catalog.ts` cita `localStorage`, e só com a chave `uilab_prefs_v1` |
| Fixture altera dados do jogo | O lab congela (`Object.freeze` profundo) `data`, `rdata` e os dados da Jornada ao iniciar: uma mutação vira erro na hora |
| Service worker | O lab não registra o SW. E como o SW atual guarda **qualquer navegação** como a página do jogo, o lab nunca é servido no mesmo endereço do jogo instalado (ver riscos) |

### 6.2 Versão pública

| Barreira | Como |
|---|---|
| Código | Nada fora de `prototype/lab/` importa dele. Teste confere os imports |
| Build | `npm run proto` não compila o lab; só `npm run lab` compila, e em `dist-lab/`, fora de `dist/` |
| Deploy | O `pages.yml` copia uma lista fechada de arquivos de `dist/`. O lab não está em `dist/` |
| Conferência | Teste: o JS gerado do jogo não contém a marca `__UILAB__` (constante definida só no build do lab) |
| Uso local | Entrada nova no `.claude/launch.json` servindo `dist-lab/` noutra porta |

## 7. Exemplo de cadastro

Variante "loja com maldição" (estado difícil de reproduzir jogando):

```ts
// prototype/lab/scenarios/jornada.ts
import { jornadaRun } from '../fixtures/jornada';
import { profiles } from '../fixtures/profiles';
import { shopScreen } from '../../jornada';

export const jornada: Scenario[] = [
  {
    id: 'jornada.shop:cursed',
    title: 'Loja com maldição e inflação alta',
    group: 'Loja',
    profile: profiles.mid,
    mount: (ctx) =>
      shopScreen(
        ctx.jornadaHost,
        jornadaRun(ctx, { campaign: 'naruto', stage: 2, ryo: 900, curse: true, shopPurchases: 4 }),
      ),
  },
];
```

Cenário de luta no meio, com a costura 6:

```ts
{
  id: 'jornada.battle:downed-ally',
  title: 'Luta com aliado caído (aba Reerguer)',
  group: 'Combate',
  mount: (ctx) => {
    const run = jornadaRun(ctx, { campaign: 'naruto', stage: 1, stop: 'zabuzaFight' });
    const setup = battleSetup(run, jornadaData);
    return jornadaBattle(ctx.jornadaHost, jornadaData, run, setup, ctx.rng, 'Ponte', 'bridge', null, {
      from: battleAt(setup, { hp: { sakura: 0 } }),
    });
  },
}
```

Os nomes `curse`, `stop` e `battleAt` são do construtor de fixture (a definir na implementação); o que importa é que a
tela é a real e só o estado de partida é fabricado.

## 8. Fluxo de dados

```
URL ?s=jornada.shop:cursed
  └─► registry.byId ──► Scenario
        │
        ├─► context.ts: memória ← perfil do cenário · createRng(seed) · Math.random e Date.now fixos
        │                         prefs (cenário ← URL) · jornadaHost do lab · sessão da Roleta do lab
        ├─► shell.ts: casca real com as prefs
        └─► scenario.mount(ctx)
              └─► fixture (construtor/captura) ──► core real ──► estado válido
                    └─► tela real do jogo ──► #screen
                          └─► escolhas do usuário mudam só a memória
                                └─► tela resolve ──► faixa do lab: resultado · Repetir · Próximo
```

## 9. Riscos e limitações

| Risco | Efeito | Mitigação |
|---|---|---|
| Refatorar `main.ts` (costuras 1–4) | Regressão no jogo, que não tem teste de interface | Versão própria, só movendo código, sem mudar regra; jogar Roleta inteira e conferir typecheck, testes e build idênticos |
| Seeds ligadas ao balanceamento | Mudar peso quebra cenários de sorteio | `expect` em teste + `lab:seed` para achar outra |
| Fixture fora do alcançável (ex.: 9.999 ryō) | A tela aparece num estado que o jogador nunca vê | Permitido para testar limites, mas nomeado como tal no id (`:overflow`) |
| Telas interativas terminam | Depois de um toque o cenário segue o fluxo e sai do estado | "Repetir" remonta do zero; instantâneo ajuda a capturar |
| Menos movimento não se força | O `matchMedia` real não muda | `still=1` liga a mesma classe que o CSS usa onde possível; o resto fica anotado |
| Service worker guarda qualquer navegação como a página do jogo | Se o lab fosse servido no mesmo endereço do jogo instalado, o SW poderia guardar o lab no lugar do jogo | Lab só local, noutra porta. Se um dia for publicado, o SW precisa passar a guardar só a raiz (decisão sua) |
| Lab antigo (`?teste`) convivendo com o novo | Duas ferramentas e o antigo grava `proto_lab_v1` no aparelho | Manter até o novo cobrir o que ele faz; depois remover (decisão sua, ver abaixo) |
| Captura de save com dados pessoais (nome do jogador) | Nome real numa fixture versionada | `lab:capture` troca o nome por um fixo |

### Decisões para você

1. **Publicar o lab?** A proposta é só local. O `?teste` de hoje é público; se quiser o novo publicado (ex.:
   `/lab.html`), precisa de proteção no service worker e de decidir se fica visível para jogadores.
2. **Remover o `?teste` antigo** quando o novo cobrir montar a ficha, lutar contra um vilão e começar a campanha numa
   etapa. O `?seed=` fica (é o replay do Compartilhar).
3. **Ordem**: primeiro as costuras (uma versão sem mudança visível), depois o lab com os cenários de prioridade alta do
   inventário.
