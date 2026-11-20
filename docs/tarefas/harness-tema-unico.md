---
objetivo: Alinhar as instruções de interface e de revisão visual ao tema único grafite de Ninshu Roots.
escopo: ["AGENTS.md", ".claude/skills/revisar-visual/SKILL.md", ".claude/skills/novo-retrato/SKILL.md", "docs/tarefas/harness-tema-unico.md", "docs/registro.md"]
fora: ["prototype/**", "src/**", "scripts/**", ".github/**", "CLAUDE.md", "package.json"]
pronto: ["npm run check verde", "nenhuma instrução pede o tema Pergaminho ou capturas em dois temas", "PR para staging sem Co-Authored-By"]
agente: claude
revisor: codex
---

# Tema único nas instruções

## Pedido

Resolver a [issue #40](https://github.com/guidxsa/ninja-roleta/issues/40) (pedido do usuário em 20/11/2026): a seção Interface do `AGENTS.md` e as skills de revisão visual e de retratos ainda descrevem Sumi e Pergaminho como dois temas.

## Contexto

O PR #42 (`feature/ninshu-identidade`) remove o tema Pergaminho e o seletor do jogo e do UI Lab. `AGENTS.md` só muda numa branch `feature/harness-<tema>` (`check:regras`), por isso a correção ficou fora daquele PR. Esta branch parte de `feature/ninshu-identidade` e deve entrar depois dele.

## Plano

1. `AGENTS.md`, Interface: um tema só, Sumi (grafite), nos tokens; o papel de cena com tinta escura; contraste WCAG AA no grafite e no papel. Tabela de skills: capturas em grafite e com menos movimento.
2. Skill `revisar-visual`: fotos em Sumi e Sumi com menos movimento (o que `scripts/revisar-visual.ts` já faz) e a conferência de contraste no grafite e no papel.
3. Skill `novo-retrato`: conferir o retrato sobre o grafite e sobre o papel.

## Fora do escopo

Código, estilos, o `CLAUDE.md` (importa o `AGENTS.md`) e o histórico em `docs/processo/plano-harness.md`.

## Achados

- Comentário em `prototype/jornada/relicIcons.ts` ainda fala em "dois temas" (sem efeito no jogo).
