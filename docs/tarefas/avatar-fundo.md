---
objetivo: O avatar da Ficha do ninja mostra o retrato com o fundo original da arte, sem o recorte de silhueta sobre o papel.
escopo: ["docs/tarefas/avatar-fundo.md", "prototype/gate.ts", "prototype/art.ts", "prototype/styles/shinobi/detalhes.css", "prototype/styles/profile.css", "prototype/lab/scenarios/gate.ts", "docs/base/perfil.md", "docs/visual.md", "DESIGN.md", "docs/ui-lab/SCREEN_INVENTORY.md", "changelog.d/avatar-fundo.md"]
fora: ["src/**", "public/img/**", "prototype/portraits/**", "prototype/registry.ts", "prototype/bingoSheet.ts", "package.json", "package-lock.json", "CHANGELOG.md", ".github/**", "plano-codex-telas.md", "prompts-codex-telas.md", "correcao-pr46.md", "imagens-codex.md", "arte-codex/**"]
pronto: ["npm run check verde", "na Ficha (celular, tablet e desktop) o avatar aparece com o fundo da arte, enquadrado, sem recorte", "na escolha de avatar, os liberados com o fundo original e os bloqueados continuam em silhueta", "UI Lab em 360, 390, 768, 1024 e 1440 px sem rolagem horizontal nem erro no console", "docs e fragmento no mesmo commit, PR para staging, sem Co-Authored-By"]
agente: claude
revisor: codex
---

# Avatar com o fundo original

## Pedido

"Pode fazer uma alteração nos ícones de perfil e manter o fundo original dos ícones."

## Contexto

Hoje (staging `af8028c`, PR #46), o avatar da Ficha é recortado em silhueta por `AVATAR_CUTS` (`prototype/art.ts`, `avatarArt` em `prototype/gate.ts`). O fundo do retrato some e o papel da Ficha (`--profile-paper`) aparece no lugar. Para isso, o CSS troca o fundo dos desenhos SVG pela cor do papel (`prototype/styles/shinobi/detalhes.css`). Na janela de escolha, os liberados já aparecem com o fundo original; só os bloqueados usam a silhueta. Docs lidos: [docs/base/perfil.md](../base/perfil.md#avatar) e [docs/visual.md](../visual.md).

## Plano

1. **Ficha:** o avatar mostra o retrato inteiro, com o fundo da arte, num quadro com borda fina de tinta, no estilo dos retratos do Livro Bingo. Sai o recorte na Ficha (celular, tablet e desktop) e sai a troca do fundo SVG pela cor do papel.
2. **Escolha:** os liberados continuam como estão. Os bloqueados continuam em silhueta, com o recorte de cada retrato ou a silhueta genérica, porque a silhueta é o que diz que está bloqueado.
3. **`AVATAR_CUTS`:** fica no código, usado só pela silhueta dos bloqueados. O cenário de galeria "Ficha com cada avatar" passa a mostrar os retratos com o fundo.
4. **UI Lab:** fotos de `gate.home`, `gate.avatar` e `gate.avatar:few` em 360, 390, 768, 1024 e 1440 px.
5. **Docs:** `docs/base/perfil.md` (Avatar), `docs/visual.md` (Ficha), `DESIGN.md` se citar o recorte, e o fragmento `changelog.d/avatar-fundo.md`.

## Fora do escopo

- Os desenhos e as imagens dos retratos (`public/img`, `prototype/portraits`).
- Quem se libera como avatar.
- O Livro Bingo e o Histórico (PR #70).

## Decisões para o usuário

- **Interpretação do pedido:** entendi que a alteração é tirar o recorte e mostrar o fundo original. Se você quer outra mudança nos ícones além disso (tamanho, moldura, forma), diga antes de aprovar.
- **Bloqueados:** continuam em silhueta, sem fundo.

## Achados

Preenchido durante o trabalho, com o número da issue de cada achado fora do escopo ([issues.md](../processo/issues.md)).
