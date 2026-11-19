# Fragmentos do CHANGELOG

Cada PR para o `staging` que quem joga nota traz um arquivo `changelog.d/<tema>.md`, com o mesmo `<tema>` da branch. Na release, `npx tsx scripts/staging.ts release 0.Y.0` junta todos numa linha nova do `CHANGELOG.md` e apaga os fragmentos ([fluxo](../docs/processo/fluxo.md#release-y)).

```markdown
---
peso: alto
---
**Veneno acumula.** Cada golpe envenenado soma uma pilha, até três.
```

- Texto para quem joga, como as linhas do `CHANGELOG.md`: começa por um título curto em negrito.
- `peso: alto` para mecânica, tela, modo ou sistema novo (conta para a sugestão de release); sem o frontmatter, peso normal.
- Correção só de doc, processo ou ferramenta, que quem joga não nota, não precisa de fragmento.
