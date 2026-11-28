---
objetivo: Registrar o caminho até o v1.0.0 que o usuário decidiu em 27/11/2026, no decisoes.md, no registro e no README.
escopo: ["docs/decisoes.md", "docs/registro.md", "README.md", "docs/tarefas/roteiro-1-0.md"]
fora: ["src/**", "prototype/**", "scripts/**", "tests/**"]
pronto: ["npm run check verde", "item 50 do decisoes.md com a ordem decidida", "README aponta para o item 50"]
agente: claude
---

# Caminho até o v1.0.0

## Pedido
Na revisão dos planos e das entregas pendentes (27/11/2026), o usuário disse: "A v1.0.0 vai surgir depois de um rebalanceamento após todas as mudanças, vai surgir quando eu sentir que tem uma entrega pelo menos. Eu ainda vou revisar conceitos do modo história e incongruências narrativas. A adição de novos personagens fica para depois dessa primeira versão estabilizada." Ele também pediu para lançar a v0.97.0 e para seguir com o plano visual e com o harness.

Nas perguntas seguintes, ele escolheu:
- a árvore de talentos nova (item 45) entra antes do 1.0, e os minijogos (item 46), depois;
- a versão suporte do prodígio (item 7) fica para depois do 1.0;
- o harness e o plano visual andam em paralelo.

## Contexto
`docs/decisoes.md` (item 50: critérios do v1.0.0, aberto desde 18/11/2026) e o README, que ainda lista os critérios antigos.

## Plano
1. Reescrever o item 50 com a ordem decidida e o que fica para depois do 1.0.
2. Marcar nos itens 7, 11, 20, 45, 46 e 47 se cada um vem antes ou depois do 1.0.
3. Pôr no README um parágrafo curto que aponta para o item 50, no lugar dos critérios antigos.
4. Escrever uma entrada curta no `docs/registro.md`.

## Fora do escopo
- Qualquer código, número ou regra do jogo.
- A renumeração do item 49 duplicado, que fica na issue #107.

## Decisões para o usuário
- Confirmar se "interface final em `src/ui`" e "textos prontos para tradução" ainda valem para o 1.0. Os dois ficaram como "para confirmar" no item 50.

## Achados
- Nenhum.
