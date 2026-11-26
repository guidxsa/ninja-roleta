<!-- Contrato resumido da tarefa (AGENTS.md, "Como trabalhar"). Apague o que não se aplica.
     Base do PR: staging (todo trabalho; entra sozinho com check e meta verdes, e o PR de processo com o merge do
     usuário). master só para hotfix/<tema> e para o PR permanente do staging (docs/processo/fluxo.md). -->

## Objetivo
<!-- Uma frase. Contrato: docs/tarefas/<tema>.md -->

## Fora do escopo
<!-- O que esta mudança não faz, de propósito. -->

## Caminhos tocados
<!-- Pastas ou arquivos principais; devem bater com o escopo do contrato. -->

## Como verifiquei
<!-- Comandos rodados e o resultado (typecheck, testes, build, simulação com seed). -->
- [ ] `npm run check` (typecheck, testes, `check:regras`, `check:escopo` e build)

## Docs e registro
- [ ] Doc da regra atualizado no mesmo commit (ou não se aplica)
- [ ] Fragmento `changelog.d/<tema>.md` (se o jogador nota a mudança; no hotfix, a linha no `CHANGELOG.md`)
- [ ] `docs/registro.md` / `docs/decisoes.md` (se houve decisão sem o usuário)
- [ ] Balanceamento: tabela de antes e depois (ou não se aplica)

## Achados fora do escopo
<!-- Bugs, melhorias ou docs desatualizados vistos e não corrigidos, cada um com a issue aberta (#n; docs/processo/issues.md). -->

## Agente
<!-- Quem implementou, como no "agente:" do contrato (claude, codex ou humano). Delegado ao Codex: diga (docs/processo/delegacao.md). -->
- Agente: 
