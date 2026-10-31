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
| [docs/perfil.md](docs/perfil.md) | Perfil local: conquistas, Livro Bingo e estatísticas por origem |

### Regras para os docs

- **Os docs são o design; os dados são a implementação.** Os números de balanceamento vivem em `balance` e `data/*.ts`. Os docs devem bater com eles.
- Ao mudar uma regra ou um número no código, atualizar o doc correspondente no mesmo commit.
- Se o código e o doc divergirem e não estiver listado em "Mudanças de design pendentes", perguntar antes de escolher um lado.
- Cada regra é descrita em **um** arquivo; os outros apontam com link.
- Futuro: um script que gera as tabelas numéricas dos docs a partir dos dados.

## Mudanças de design pendentes

Combinado em 31/10/2026 (brainstorm com o usuário). Os números são rascunho: a simulação decide e o usuário faz o ajuste fino. Cada frente vira uma versão própria.

1. **Segredos que dependem da reforma** (entram com os itens 2 e 3, ver [docs/perfil.md](docs/perfil.md)): Vingador (Uchiha com raio), Espelhos de gelo (vencer o Haku com Gelo), Areia que protege (Areia + jinchuuriki), Princesa das Lesmas (Senju + lesma + Palma Curativa), Deus dos Shinobi (Senju com Madeira vence), Segundo Hokage (Senju com água principal vence), Domador de bijuu (desfazer o manto do Gaara com Madeira; o campo `cloakSuppressed` do resumo da luta já existe). As conquistas por origem passam a incluir o Senju (Mestre dos clãs vira 11).
2. **Reforma elemental (v0.30.0)**:
   - roleta de **quantidade de elementos** no sorteio (Comum 1/2/3 = 50/35/15; Uchiha fogo + 35% de um extra; clãs 0/1/2 = 30/55/15; prodígio 0), com `affinity` + `secondaryElements` virando `elements[]`;
   - **não se aprende elemento novo na run** (a fatia "Elemento secundário" sai e o peso vai para "Nova técnica");
   - **potencial elemental**: pleno (Comum, Senju, o fogo do Uchiha) começa com o básico e chega ao III; parcial (clãs, Hyuuga, Uzumaki, o elemento extra do Uchiha) **não começa com o básico** e só chega ao II;
   - o Treino ganha a escolha "foco elemental";
   - **kekkei genkai de natureza** só para o grupo pleno com um par, por roleta (25%): Gelo (água + vento), Areia (terra + vento), Lava (fogo + terra), Tempestade (raio + água), Vapor (fogo + água), Explosão (terra + raio). Contam como o pai mais vantajoso no encontro de elementos.
   - **Madeira** é exclusiva do Senju com terra + água (roleta de 30%).
3. **Origem Senju** (lendária, peso 3): status no formato do Uzumaki, um degrau acima (tai 11, nin 11, gen 6, res. 12/10, speed 10, HP 125, chakra 40). Passivas: **Herdeiro do fundador** (+1 Vontade do Fogo) e **Força vital** (na 1ª vez abaixo de 30% do HP, 4% do HP máximo por rodada por 3 rodadas; curas recebidas +25%). Despertar: no nível 4, 5% por rodada e +2 de chakra por rodada; no nível 7, 2 vezes por luta. O Mokuton prende, drena e desfaz o manto de chakra.
4. **Nova distribuição de status das origens pela lore** (o usuário faz o ajuste fino; o total fica perto do atual, menos o Senju):

   | Origem | Tai | Nin | Gen | Res. fís. | Res. ment. | Speed | HP | Chakra | Pontos |
   |---|---|---|---|---|---|---|---|---|---|
   | Comum | 10 | 10 | 10 | 10 | 10 | 10 | 100 | 30 | 90 |
   | Nara | 7 | 14 | 9 | 9 | 12 | 9 | 100 | 34 | 91,5 |
   | Akimichi | 15 | 7 | 4 | 14 | 7 | 6 | 150 | 34 | 88 |
   | Yamanaka | 8 | 9 | 16 | 8 | 15 | 10 | 100 | 32 | 97 |
   | Aburame | 7 | 13 | 8 | 11 | 12 | 8 | 105 | 38 | 92,5 |
   | Inuzuka | 14 | 7 | 5 | 12 | 7 | 14 | 100 | 24 | 88 |
   | Prodígio | 18 | 0 | 0 | 12 | 8 | 13 | 110 | 22 | 79,5 |
   | Uchiha | 11 | 11 | 13 | 9 | 11 | 11 | 100 | 28 | 95,5 |
   | Hyuuga | 15 | 6 | 6 | 11 | 10 | 12 | 100 | 28 | 90 |
   | Uzumaki | 10 | 10 | 5 | 12 | 9 | 9 | 120 | 38 | 90,5 |
   | Senju | 11 | 11 | 6 | 12 | 10 | 10 | 125 | 40 | 97,5 |

5. **Kits de linhagem (v0.31+)**: com o básico elemental fora dos kits dedicados, cada origem precisa de 2 ataques próprios no nível 1 e técnicas novas nos níveis 4 e 7. Começa pelo **prodígio**: Folha Furacão no nível 1, Pesos de treino (tirar = +3 de speed e +2 de taijutsu), Lótus Primária presa aos Portões (4), Punho Bêbado com roleta de dano (4), Lótus Oculta com o 3º portão (7). As outras origens vêm uma por vez, depois dos comentários do usuário.

Última rodada concluída: "rebalanceamento das origens"
 (27/10/2026) foi implementada na v0.18.0: 25% de HP e chakra por vitória, controles com tenacidade e vulnerabilidade, barreiras como escudo (ação de turno), ilusões de dano do Uchiha e Sharingan grátis, Possessão do Yamanaka, Gênio do Nara, Determinação mais forte e nerf do prodígio, Akimichi, Inuzuka e Uzumaki. Decisões tomadas junto: o Gênio é ativa com usos por luta (2, +1 nos níveis 4 e 7) e vale nas roletas de combate do jogador; o genjutsu de dano do Uchiha fere de verdade e o do Yamanaka é controle mental com autoferimento; controle em cadeia é contido pela tenacidade (cai por rodada), não por regra de chefe; a meta é não ter origens muito acima ou abaixo das outras.

Observação em aberto (não é mudança de design): na simulação, a fatia "nova técnica" da recompensa vale bem menos que as outras (sem ela, o comum vence ~20 pontos a mais). Vale discutir com o usuário antes de mexer.

Observação em aberto (v0.26.0): campanha por origem (1000 runs, seed 2) no Médio de 77% (Uchiha, prodígio) a 88% (Hyuuga, Uzumaki), fora o Aburame, que caiu de 57% (v0.25.0) para 45% (Difícil 13%) com o Enxame de dano fixo e o Devorar em % do HP máximo. O usuário testou a v0.25.0 à mão e achou o Aburame forte demais; o bot ainda subestima o Aburame (heurística simples para quando devorar e para a Praga). Não compensar pela simulação sem conversar; melhorar o bot do Aburame é o próximo passo para medir de verdade.

Roteiro de contas e progresso (combinado em 30/10/2026; a fase 1, o Laboratório `?teste` com `?seed=`, foi implementada na v0.27.0):
- **Fase 2, perfil local**: conquistas, Livro Bingo e estatísticas por origem implementados na v0.29.0 (`profile_v1`, [docs/perfil.md](docs/perfil.md)); falta desbloqueios/personalização (títulos, skins da roleta, nome do ninja; só cosméticos). A run continua só em memória (F5 reseta).

- **Fase 3, contas opcionais**: só para sincronizar o perfil local; o jogo segue jogável offline e sem conta. Usar um serviço com login pronto (Supabase ou Firebase, a decidir), nunca guardar senha. Pede política de privacidade (LGPD) e revisar o princípio "Sem backend".

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