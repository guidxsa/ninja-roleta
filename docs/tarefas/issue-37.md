---
objetivo: Trocar as cores literais das regras de componente de prototype/styles/shinobi/*.css por tokens e travar a regra com um teste.
escopo: ["prototype/styles/shinobi/**", "tests/shinobi-tokens.test.ts", "tests/docs-links.test.ts", "docs/visual.md", "docs/tarefas/issue-37.md"]
fora: ["src/**", "prototype/**/*.ts", "prototype/styles/tokens.css", "public/img/**", "scripts/**", ".github/**"]
pronto: ["npm run check verde", "teste shinobi-tokens sem cor literal fora de :root e máscara", "telas Shinobi sem diferença visível no UI Lab"]
agente: claude
revisor: codex
issue: 37
---

# Cores soltas nas folhas Shinobi viram tokens

## Pedido
Issue #37, achado na revisão do PR #35: cerca de 120 cores literais em regras de componente de `prototype/styles/shinobi/*.css`. O usuário decidiu: "resolva movendo para tokens".

## Contexto
O AGENTS.md diz que cor só entra por token (`var(--...)`), com cor solta só em arte. As folhas Shinobi chegam pelo PR #35, que ainda não entrou no staging. Por isso esta branch sai de `feature/interface-shinobi` e só deve entrar depois dele.

## Plano
1. Paleta `--sh-<família>-<n>` no `:root` de `shinobi/base.css`. As famílias são papel, ouro, terra, tinta, laca, folha, noite, uva e sumi, numeradas da mais clara para a mais escura.
2. Cores quase iguais (distância RGB até 14, imperceptível) viram um token só. A cor que coincide com um token existente sem variação de tema usa esse token (`--paper`, `--paper-ink`, `--paper-muted`, `--shinobi-bone`, `--shinobi-muted`...).
3. Transparência por `color-mix(in srgb, var(--token) N%, transparent)`.
4. Ficam literais:
   - as definições de token nos blocos `:root`;
   - as máscaras (`mask`, `mask-image`), onde o preto é só o canal alfa.
5. Teste `tests/shinobi-tokens.test.ts` falha se uma cor literal voltar a uma regra de componente.

## Fora do escopo
Rever a paleta em si (unificar com os tokens globais, tema único). Fica para a tarefa de identidade do plano de telas.

## Decisões para o usuário
Nenhuma: a decisão "tokens em vez de exceção" é dele.

## Achados
- `tests/docs-links.test.ts` falhava no Windows (CRLF) porque esta branch saiu do #35, anterior à correção que o staging já tinha (#34). O arquivo ficou idêntico ao do staging: o diff do PR não o toca, mas ele continua no escopo porque a branch o altera em relação ao #35.
