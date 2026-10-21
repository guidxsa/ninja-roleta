---
name: nova-mecanica
description: Fluxo ponta a ponta para adicionar ou mudar uma mecânica do jogo Ninja Roleta (dados → core puro → testes → simulação → protótipo → CLAUDE.md/README). Use sempre que o usuário pedir uma regra nova ou alterada no jogo — nível/XP, itens, eventos pré-vilão, vilões, técnicas, passivas, linhagens, dificuldade, recompensas, inventário, ficha, roletas — ou reclamar de um comportamento de jogo ("o player tá subindo de nível demais", "quero que o veneno acumule"), mesmo que não diga "mecânica". Também vale para ajustes de balanceamento que mexem em fórmulas, não só em números.
---

# Nova mecânica (Ninja Roleta)

O jogo tem uma arquitetura em camadas com regras fortes (ver `CLAUDE.md`). Uma mecânica só está pronta quando atravessa todas as camadas de forma coerente: se ela existe no core mas a simulação não a conhece, o balanceamento mente; se existe na UI mas não nos testes, vai quebrar na próxima mudança. Este fluxo existe para que nenhuma camada fique para trás.

## 0. Entender e medir antes de mexer

1. Leia a seção do `CLAUDE.md` que trata do assunto e a lista **Decisões em aberto**. Se o pedido conflita com uma regra escrita, a regra nova do usuário vence, mas o `CLAUDE.md` precisa ser atualizado depois (passo 6).
2. Ambiguidade de regra (ex.: "o que conta como força do vilão?"): escolha o padrão mais simples e coerente com o resto do jogo, siga em frente e diga a escolha no relatório final. Só pergunte se a resposta muda muito o trabalho.
3. Tire a linha de base, para comparar depois:
   ```bash
   npm test 2>&1 | tail -5
   npm run sim -- --fights 1000 > "$SCRATCH/sim-antes.txt"
   ```
   A simulação demora ~1 min; use o scratchpad da sessão para a saída.

## 1. Dados primeiro

"Tudo é dado": nenhum número de balanceamento nem texto visível mora no código.

- **Números** → `src/data/balance.ts`, com um comentário curto dizendo o que o número faz e se é proposta.
- **Listas e pesos** (eventos, itens, roletas) → `src/data/events.ts`; vilões → `src/data/villains.ts`; técnicas → `src/data/techniques.ts`; linhagens → `src/data/lineages.ts`.
- **Textos** → `src/data/strings/ptBR.ts`. Quando as chaves são uma união conhecida (ex.: `Difficulty`), não use `as Record<string, ...>`: o objeto literal deixa o índice tipado e evita `possibly undefined`.
- Campo novo em `VillainDef` ou `PlayerState`: preencha em **todos** os vilões, em `createPlayer` e em `testVillain` (`tests/helpers.ts`), senão o typecheck quebra em lugares distantes.

## 2. Core puro

Em `src/core/`. As regras são funções puras porque a simulação roda milhares de lutas e os testes precisam ser determinísticos.

- Recebem estado + `data: GameData` (+ `rng: Rng` se sorteiam) e devolvem estado novo. Nunca `Math.random`, DOM ou `localStorage`.
- Fora do combate, siga o padrão `Step` de `progression.ts` (`{ player, mods, effect }`): o `effect` é o que a UI descreve ao jogador.
- Prefira separar "acumular" de "aplicar" quando a UI precisa de uma roleta no meio (ex.: `gainXp` só soma; `canLevelUp` + `applyLevelUp` sobem um nível por vez, para a roleta de nível girar a cada um).
- Mecânica nova e independente pode ganhar arquivo próprio (`src/core/difficulty.ts` é um exemplo).

## 3. Testes

Em `tests/*.test.ts` (Vitest), usando `gameData` real e `seq(...)` de `tests/helpers.ts` para fixar o RNG.

- Escreva um teste que **reproduz o comportamento que o usuário descreveu** (ex.: "no Quarteto do Som, 4 lutas dão só 1 nível"). Esse é o teste que prova que o pedido foi atendido.
- Cubra limites: teto, zero, origem que proíbe o tipo (prodígio do taijutsu), acúmulo.
- Testes antigos que quebram por causa da mudança: ajuste os valores esperados e diga quais no relatório; não os apague.

## 4. Simulação

A simulação (`src/sim/runner.ts`, `scripts/simulate.ts`) é como o projeto mede balanceamento. Se a mecânica afeta poder do jogador ou dos vilões, a simulação precisa usá-la, senão os números ficam falsos.

- Faça o runner usar a mesma função do core que a UI usa.
- Rode de novo e compare com `sim-antes.txt`. Se a mudança deixou o jogo muito mais fácil ou difícil sem o usuário pedir, compense em `balance.ts` (ex.: menos níveis por campanha → ganhos maiores por nível) e reporte antes/depois.
- Se a simulação não cobre algo (eventos e recompensas não entram na campanha simulada), diga isso ao interpretar os números.

## 5. Protótipo

`prototype/main.ts` só tem fluxo e animação; toda regra vem do core.

- Estado da campanha vive só em memória (`camp`). Preferência do aparelho (ex.: última dificuldade) vai em `settings`. Histórico de runs: campos novos em `RunRecord` são **opcionais**, porque registros antigos já estão no `localStorage` das pessoas.
- Textos sempre via `S.*` (ptBR). Layout mobile-first: botões grandes, nada de rolagem horizontal em 360px.
- Janelas sobrepostas (ficha, histórico) são anexadas ao `body`, fora de `#screen`, para não interferir no `choose()` da tela atual.
- Compile: `npm run proto` → `dist/prototipo.html`.
- Se mexeu em algo visível, confira de verdade: `python .claude/skills/nova-mecanica/scripts/capturas.py` gera capturas em 360px das telas principais (veja o `--help`). Abra os PNGs com Read e olhe: corte à direita, texto sobreposto, contraste.

## 6. Documentação

- `CLAUDE.md`: atualize a seção da mecânica com as regras e números novos; risque ou edite o item em **Decisões em aberto** se foi resolvido; acrescente um novo se surgiu dúvida.
- `README.md`: nova linha no **Histórico de versões**, em ordem crescente. A regra de qual número usar está na skill `lancar-versao`.

## 7. Verificar e relatar

```bash
npx tsc --noEmit && npx vitest run 2>&1 | tail -4 && npm run proto | tail -1
```

Com tudo verde, publique a versão seguindo a skill `lancar-versao` (testa, commita, faz push e sobe a tag). O usuário quer isso ao fim de toda funcionalidade, sem precisar pedir. No relatório final (em PT-BR, para o usuário, não um changelog):
- o que a mecânica faz agora, com os números escolhidos;
- simulação antes/depois e o que isso significa para o jogador;
- decisões que você tomou sozinho e riscos (ex.: "Difícil não vence nenhuma campanha na simulação").

## Armadilhas já vistas neste projeto

- No Windows, heredocs grandes de Python dentro do Bash podem falhar com "unexpected EOF". Para editar código, use a ferramenta Edit; para scripts, escreva um arquivo e rode-o.
- Os arquivos alternam LF/CRLF; escreva com `newline=''` em Python para não converter tudo.
- A captura com o Edge headless direto em 400px tem largura mínima de janela e parece cortada; o script usa um iframe de 360px por isso.
