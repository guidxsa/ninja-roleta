# Ninja Roleta (nome provisório)

Jogo de browser de sessões curtas, movido a roletas, inspirado no universo ninja de Naruto.

> **Projeto de fã, sem fins lucrativos e sem afiliação oficial.** Naruto e seus personagens são propriedade de seus respectivos donos. Este repositório não usa imagens, músicas, logos ou textos oficiais; os nomes presentes nos dados são nomes de trabalho.

## Estado atual

Só o núcleo de regras (`src/core`), com testes e uma simulação em terminal para ajustar o balanceamento. Ainda não há interface.

## Comandos

```bash
npm install
npm test                                   # testes das regras (Vitest)
npm run typecheck                          # checagem de tipos
npm run sim -- --fights 2000 --seed 42     # simulação de balanceamento
```

## Estrutura

```
src/core    regras puras: roleta, origem, iniciativa, acerto, dano, elementos, combate
src/data    números de balanceamento, linhagens, técnicas, vilões, campanha, textos (PT-BR)
src/state   histórico de runs (localStorage injetável)
src/sim     jogador automático e executor de lutas/campanha
scripts     simulate.ts
tests       testes do core
```

Todo número de balanceamento fica em `src/data/balance.ts` e nos arquivos de dados ao lado.

## Licença

MIT (a confirmar).
