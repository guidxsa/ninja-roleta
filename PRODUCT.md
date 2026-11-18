# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fãs de Naruto que também curtem roguelike. Jogam principalmente no celular, em sessões curtas (1 a 3 minutos por luta), e também no desktop. Querem uma partida rápida na Roleta ou profundidade estratégica na Jornada (equipe, talentos, relíquias).

## Product Purpose

Ninja Roleta (nome provisório) é um jogo de browser inspirado no universo ninja de Naruto. Origem, iniciativa, acerto, dano, eventos e recompensas passam por uma roleta visual, e os status do jogador sempre pesam nas chances. Sucesso: partidas curtas e satisfatórias, com a sensação de estar dentro do mundo shinobi.

Dois modos:
- **Roleta**: rápido e simples; a run segue em ciclos infinitos.
- **Jornada**: roguelike de equipe com talentos e relíquias; runs História e Caminho Ninja.

## Positioning

A roleta visual como identidade e como motor das regras (inspiração: pokemon-roulette.zeroxm.com.br), combinada com um roguelike de equipe, dentro de uma interface que parece parte do universo shinobi (pergaminhos, selos, carimbos, kanji) e não um site com tema de Naruto.

## Operating Context

- Celular e desktop são pares: toque único, layout vertical e botões grandes no celular; composição própria (colunas, painéis fixos) no desktop.
- PWA offline, publicado no GitHub Pages; sem backend.
- Run do Roleta só em memória; a Jornada é salva a cada parada; perfil e histórico em `localStorage`.

## Capabilities and Constraints

- TypeScript sem framework de UI; esbuild gera um HTML único, `sw.js`, manifesto e ícones.
- Regras são funções puras separadas da interface; RNG injetável; tudo é dado, com textos em PT-BR.
- A interface não muda regra, fórmula nem balanceamento.
- Projeto de fã, open source, sem fins lucrativos e sem afiliação oficial (código MIT; a licença não cobre imagens de personagens).

## Brand Commitments

Nome provisório. Direção visual, temas Sumi/Pergaminho e regras de interface estão registrados em `docs/visual.md` e no `AGENTS.md` (seção Interface).

## Evidence on Hand

Jogo jogável online (https://guidxsa.github.io/ninja-roleta/), docs de design em `docs/`, e vagas opcionais de ilustração em `public/img/`. Não há dados de uso nem depoimentos de jogadores; não inventar.

## Product Principles

- A roleta é o coração: o sorteio visível é a identidade e nada se resolve sem ele.
- O mundo reconhecível mesmo sem personagens: objetos do universo no lugar de componentes genéricos.
- Função primeiro: legibilidade, toque e layout de celular não cedem à ambientação.
- Sessões curtas, decisões claras: botões simples, detalhes na dica.

## Accessibility & Inclusion

Teclado, leitor de tela e menos movimento (`prefers-reduced-motion`) são tratados como requisito; detalhes em `docs/base/plataforma.md`.
