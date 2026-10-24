# CLAUDE.md

## Visão geral

Jogo de browser, divertido e de sessões curtas, inspirado no universo ninja de Naruto. Projeto open source, sem fins lucrativos, feito por um fã. Pensado pra matar tempo no celular (ex.: dentro do ônibus).

Inspiração de UX: um site de "roleta" de Pokémon (https://pokemon-roulette.zeroxm.com.br/). A roleta visual é parte da identidade do jogo.

**O RNG é o coração do jogo**: origem, iniciativa, acerto, dano, eventos, recompensas. Tudo passa por roleta, mas os status do jogador sempre influenciam as chances.

## Documentação do jogo

As regras do jogo vivem em `docs/`. Este arquivo trata só de como trabalhar no projeto.

| Arquivo | Conteúdo |
|---|---|
| [docs/fundamentos.md](docs/fundamentos.md) | Status, roleta, restauração, iniciativa, acerto, dano, elementos, chakra, Vontade do Fogo |
| [docs/origens.md](docs/origens.md) | Sorteio de origem, status iniciais, linhagens, habilidades, jinchuuriki |
| [docs/tecnicas.md](docs/tecnicas.md) | Ficha padrão, ações universais, catálogo de técnicas |
| [docs/efeitos.md](docs/efeitos.md) | Efeitos negativos e efeitos de genjutsu |
| [docs/viloes.md](docs/viloes.md) | Fichas, passivas e comportamentos dos vilões |
| [docs/progressao.md](docs/progressao.md) | XP, níveis, estágios de status, marcos |
| [docs/campanha.md](docs/campanha.md) | Ordem, eventos, encontros, invocações, exame, dificuldade, histórico |
| [docs/itens.md](docs/itens.md) | Itens, bolsa e roleta de recompensa |

### Regras para os docs

- **Os docs são o design; os dados são a implementação.** Os números de balanceamento vivem em `balance` e `data/*.ts`. Os docs devem bater com eles.
- Ao mudar uma regra ou um número no código, atualizar o doc correspondente no mesmo commit.
- Se o código e o doc divergirem e não estiver listado em "Mudanças de design pendentes", perguntar antes de escolher um lado.
- Cada regra é descrita em **um** arquivo; os outros apontam com link.
- Futuro: um script que gera as tabelas numéricas dos docs a partir dos dados.

## Mudanças de design pendentes

Nenhuma. A rodada "reações e ficha única" (24/10/2026) foi implementada na v0.10.0: ficha única com resistências física e mental, resistência passiva/Resistir/postura, reações (Resistir, Disputa, Barreira, Substituição) com a rodada pausável na interface, disputa de ninjutsu, quebra de guarda, elementos só em encontros, níveis de técnica, barreiras, Armadura de Raio, premium do guru, restauração por nível e no fim do exame, novo Treino e vilões recalibrados. Decisão tomada junto: na disputa, só a vantagem elemental multiplica o poder (a desvantagem não reduz).

Quando o design mudar antes do código, listar aqui o que falta implementar.

## Princípios

- **Mobile-first**: controles de um toque, layout vertical, botões grandes.
- **Sessões curtas**: uma luta deve durar de 1 a 3 minutos.
- **Offline**: PWA com service worker.
- **Campanha só em memória**: F5 reseta a run. Só o histórico de runs persiste (`localStorage`).
- **Sem backend.**
- **Lógica separada da interface**: regras são funções puras (estado entra, estado sai), sem DOM.
- **RNG injetável**: toda função que sorteia recebe `rng()`; testes com seed.
- **Tudo é dado**: origens, técnicas, vilões, eventos, itens e recompensas em arquivos de dados.
- **Idioma**: jogo em PT-BR; textos visíveis em arquivos de strings, prontos para tradução.

## Propriedade intelectual

- Deixar claro no README que é um projeto de fã, sem fins lucrativos e sem afiliação oficial.

## Stack

- Vite + TypeScript, sem framework de UI no início.
- Testes de lógica com Vitest.
- PWA: `manifest.json` + service worker.

## Estrutura de pastas

```
/docs          # design do jogo (ver tabela acima)
/src
  /core        # regras puras: roleta, origem, iniciativa, acerto, dano, elementos, chakra, efeitos, exame
  /data        # linhagens, técnicas, vilões, eventos, itens, recompensas, textos
  /ui          # telas, roleta, componentes
  /state       # estado da campanha (memória) e histórico (localStorage)
/tests         # testes do core
```

## Convenções

- Idioma do código e dos commits: _definir (PT-BR ou EN)_.
- Funções do `core` não acessam DOM, `localStorage` nem `Math.random`.
- Todo número de balanceamento fica em configuração (`balance`), nunca espalhado no código.
- Dano e resistência arredondados para baixo no fim do cálculo.
- Antes de mudar uma fórmula, escrever ou ajustar o teste correspondente.
- **Toda funcionalidade ou versão nova termina publicada**: testar, commitar, fazer push e subir a tag `vX.Y.Z`, sem esperar pedido (passo a passo na skill `.claude/skills/lancar-versao`). Nunca `--force`; só não publicar se o usuário disser para segurar.