---
objetivo: Trocar entre Arcade, História e Campanha (e do Registro para um modo) sem passar pelo Início não pode tirar o jogador do site.
escopo: ["docs/tarefas/troca-modo.md", "prototype/back.ts", "tests/back.test.ts", "CHANGELOG.md", "package.json", "package-lock.json"]
fora: ["src/**", "prototype/gate.ts", "prototype/main.ts", "prototype/styles/**", "public/**"]
pronto: ["npm run check verde", "teste novo em tests/back.test.ts que falha sem a correção", "no navegador, várias trocas seguidas pela barra lateral e pela inferior mantêm uma entrada só do app no histórico", "o voltar do navegador numa partida leva ao Portão, dentro do site", "linha v0.96.1 no CHANGELOG e package.json em 0.96.1", "PR hotfix/troca-modo para o master, sem Co-Authored-By"]
agente: claude
---

# Troca de modo sem passar pelo Início fecha a guia

## Pedido

"Quando eu troco entre as telas Arcade, História e Campanha sem passar pelo Início, ele fecha a guia e abre uma guia nova no navegador." Bug crítico em produção (v0.96.0): hotfix.

## Contexto

- Cada partida põe uma entrada no histórico (`pushLayer`, `prototype/back.ts`), para o voltar do celular pedir a confirmação de saída ([visual.md](../visual.md#telas-no-estilo-novo)). Ao trocar de modo, o `modeScreen` (`prototype/gate.ts`) solta a camada da partida antiga com `history.back()` e logo abre a da nova com `pushState`.
- No navegador, o `back()` só é aplicado depois do `pushState` e mira a entrada de antes dele. Ele desfaz a entrada nova, e o app desce uma entrada a cada troca. Na troca seguinte, o `back()` sai do site e vai para a página anterior; numa guia aberta só para o jogo, essa página é a de "nova guia".
- Reproduzido no site publicado em 27/11/2026: depois da 2ª troca pela barra lateral, `history.state` já era `null` com uma partida aberta. O mesmo acontece do Registro direto para um modo (`releasePage` seguido do `pushLayer` da partida).

## Plano

1. Teste em `tests/back.test.ts` com um histórico de mentira que aplica o `back()` depois, como o navegador.
2. `back.ts`: enquanto um `back()` nosso está a caminho, a camada nova espera o `popstate` dele para ganhar a entrada. Uma camada solta antes disso não tira entrada nenhuma. O Esc só usa o voltar numa camada que já tem entrada.
3. Conferir no protótipo: trocas seguidas pela barra lateral (desktop) e pela inferior (celular), e o voltar do navegador.
4. Linha v0.96.1 no `CHANGELOG.md` e `npm version 0.96.1 --no-git-tag-version`.

## Fora do escopo

Mudar o fluxo do Portão (`gate.ts`), a confirmação de saída ou a regra do voltar.

## Decisões para o usuário

Nenhuma: a regra do voltar em [visual.md](../visual.md#telas-no-estilo-novo) não muda, só volta a valer.

## Achados

Nenhum.
