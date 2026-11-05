# CLAUDE.md

## Visão geral

Jogo de browser, divertido e de sessões curtas, inspirado no universo ninja de Naruto. Projeto open source, sem fins lucrativos, feito por um fã. Pensado pra matar tempo no celular (ex.: dentro do ônibus).

Inspiração de UX: um site de "roleta" de Pokémon (https://pokemon-roulette.zeroxm.com.br/). A roleta visual é parte da identidade do jogo.

**O RNG é o coração do jogo**: origem, iniciativa, acerto, dano, eventos, recompensas. Tudo passa por roleta, mas os status do jogador sempre influenciam as chances.

## Documentação do jogo

As regras do jogo vivem em `docs/`, em três pastas; o índice completo está em [docs/README.md](docs/README.md). Este arquivo trata só de como trabalhar no projeto.

| Pasta | Conteúdo |
|---|---|
| [docs/base/](docs/README.md) | Regras dos dois modos: fundamentos, origens, técnicas, efeitos, vilões, progressão, perfil (hoje implementadas no Roleta; a Jornada herda) |
| [docs/roleta/](docs/README.md) | Só do Roleta: campanha e itens |
| [docs/jornada/](docs/jornada/README.md) | Só da Jornada (rascunho, não implementado): run, combate de equipe, classes, progressão, relíquias |

### Regras para os docs

- **Os docs são o design; os dados são a implementação.** Os números de balanceamento vivem em `balance` e `data/*.ts`. Os docs devem bater com eles.
- Ao mudar uma regra ou um número no código, atualizar o doc correspondente no mesmo commit.
- Se o código e o doc divergirem e não estiver listado em "Mudanças de design pendentes", perguntar antes de escolher um lado.
- Cada regra é descrita em **um** arquivo; os outros apontam com link.
- Regra usada pelos dois modos fica em `docs/base/`; regra de um modo só, na pasta dele. A Jornada só descreve o que muda em relação à base.
- `tests/docs.test.ts` confere que toda técnica do jogador está em `docs/base/tecnicas.md` e toda técnica de vilão em `docs/base/viloes.md`. Técnica nova sem linha no doc quebra o teste.
- Futuro: um script que gera as tabelas numéricas dos docs a partir dos dados.

## Mudanças de design pendentes

Combinado em 31/10/2026 (brainstorm com o usuário). Os números são rascunho: a simulação decide e o usuário faz o ajuste fino. Cada frente vira uma versão própria.

5. **Kit do prodígio (v0.34.0, feito em parte)**: entraram Folha Furacão (nível 1), Lótus Primária presa aos Portões (nível 4), Punho Bêbado (nível 4) e Lótus Oculta com o 3º portão (nível 7); a Lótus Primaveril e o Redemoinho saíram. **Ficou de fora: Pesos de treino como ativa do prodígio** (+3 de speed e +2 de taijutsu ao tirar), porque conflita com o item Pesos de treino que já existe; decidir com o usuário como os dois convivem. Os kits de níveis 4/7 das outras origens ficam para a árvore de talentos da Jornada (item 7); o combate rico vai para lá, e o Roleta será simplificado (item 8).
6. **Hyuuga**: sem técnica nova no nível 1. O kit é taijutsu básico + Selo dos Pontos Vitais (só com o Byakugan); a identidade é abrir o olho. A **Palma do Vácuo** (taijutsu de distância, só com o Byakugan) fica para a **árvore de talentos da Jornada** (item 7).
7. **Modo Jornada (v0.35.0, feito em parte)**: tela inicial com a escolha de modo; **História do Naruto completa** (3 estágios lineares, confrontos do mangá, Sasuke no Vale do Fim como chefe final), com motor de combate de equipe próprio (`src/core/jornada/`, até 3 × 3, só o protagonista controlado), tela de batalha nova com animação por evento, árvore de talentos do Naruto (Clones, Kyuubi no lugar do Modo Sennin, Rasengan), relíquias com tiers, ryō, mercador, descanso, tesouro, eventos com minijogos (memória, selos, jokenpô), run salva no aparelho e conquistas na categoria Jornada. Decisões tomadas sozinho e registradas nos docs (o usuário revisa): a Sakura é tática, não médica (mangá antes do timeskip); as paradas entre os confrontos, os inimigos genéricos, as relíquias e os números. **v0.36.0: Caminho Ninja** com mapa ramificado de 12 linhas (`src/core/jornada/map.ts`), desconhecido, chefe sorteado por estágio, classe Comum com elemento sorteado (sem elemento = prodígio, 20%), árvores do Comum e do prodígio, suportes genéricos (Daichi e Hana) e eventos genéricos; Uchiha e Hyuuga aparecem com cadeado (as conquistas que os liberam já contam). Decidido sozinho na v0.36.0: chefes do Caminho Ninja lutam sozinhos (Zabuza ou Haku, Gaara ou Neji, Orochimaru ou Kimimaro); 3 primeiras linhas com lutas leves; mapa de 12 linhas. Simulação do Caminho Ninja (Comum, 1000 runs, seed 2): Fácil 100%, Médio 40%, Difícil e Hardcore 5% — o bot escolhe caminho de forma simples; alvo a combinar. **v0.37.0**: Uchiha (fogo fixo + segundo elemento sorteado, Sharingan, ramos Sharingan/Fogo/Ilusões) e Hyuuga (Byakugan, Punho Suave, Rotação com a Palma do Vácuo) liberados pelas conquistas; versões suporte (Ren Uchiha, Mio Hyuuga) entram no sorteio de parceiros; easter egg do Sasuke (Uchiha com raio aprende o Chidori → conquista secreta libera o ramo Sasuke e o visual). Simulação (500 runs, seed 2, Médio): Comum 37%, Uchiha 46%, Hyuuga 52%. **v0.37.1**: as runs passam a se chamar **História** (ids internos seguem `canon`) e **Caminho Ninja** (`generic`); relíquias com texto genérico, 22 novas com ganchos novos (`xpMult`, `shopDiscount`, `grant.ryo`, `grant.talentPoints`), ícone por relíquia e barra/painel na tela; simulação quase igual (História 77 → 78% no Médio; Caminho Ninja ±1). **v0.39.0**: protagonista caído não encerra a run (suportes de pé levantam, até 3 vezes por luta: `combat.supportRevivesPerFight`, limite decidido sozinho para evitar laço de cair e levantar sem o jogador agir); equipe de resgate no estágio 3; nome do jogador no perfil (`playerName`). Simulação (1000 runs, seed 2), Médio antes → depois: História 79 → 78%, Comum 37 → 43%, Uchiha 45 → 52%, Hyuuga 50 → 54%; Difícil: História 6 → 5%, Comum 3 → 5%, Uchiha 4 → 7%, Hyuuga 7 → 9%. A História quase não muda porque muitas lutas dela são solo. **v0.40.0**: relíquias com as classificações do pedido do usuário, 94 no total, elite deixa relíquia nos dois modos, inicial por personagem e evolução (`relics.starterEvolveChance` 50%, decidido sozinho; pesos do tesouro 40/35/25, preços 40/60/90/70). Simulação (1000 runs, seed 2), Médio v0.39.0 → v0.40.0: História 78 → 85%, Comum 43 → 41%, Uchiha 52 → 54%, Hyuuga 54 → 56%; Difícil: História 5 → 12%, Comum 5 → 5%, Uchiha 7 → 8%, Hyuuga 9 → 10%. A História sobe mais porque o bot passa por todas as 7 elites; no mapa, ele só entra em elite com HP alto. **v0.41.0**: árvore do Naruto com 6 ramos e bifurcações, níveis de talento em todas as classes (decidido com o usuário: a maioria é única, sobem principalmente técnicas), tela nova da árvore por classe e mapa aprimorado. Ramos, nós novos e números decididos sozinho, o usuário revisa. Simulação (1000 runs, seed 2), Médio v0.40.0 → v0.41.0: História 85 → 91%, Comum 41 → 40%, Uchiha 54 → 49%, Hyuuga 56 → 52%; Difícil: História 12 → 30%, Comum 5 → 5%, Uchiha 8 → 5%, Hyuuga 10 → 9%. Antes da v0.39.0 (Médio/Difícil): História 79/6, Comum 37/3, Uchiha 45/4, Hyuuga 50/7. A História ficou bem mais fácil para o bot: decidir com o usuário se compensa; alavancas: levantar com menos HP, menos ponto de talento na elite, força dos inimigos. Nada foi compensado. **v0.42.0** (pedido do usuário): custo de HP de técnica visível na hora (era cobrado, mas a barra só pulava no fim da animação); ativas de classe não gastam o turno, uma por turno, e o fortalecimento conta o turno da ativação; Portões em 5 níveis canônicos (Abertura, Descanso, Vida, Dor, Limite), acumulativos, uma troca por turno (subir, descer, fechar) sem renovar o tempo, desgaste por turno no lugar do custo na abertura; dano dos botões com talentos, níveis e portão; botões simples nos dois modos. Decidido sozinho (o usuário revisa): números dos portões (×1,15 a ×1,68, desgaste de 2% a 8% por turno), 4 turnos abertos, espera 3 ao fechar, desgaste não derruba, o talento Portão da Vida libera até o 3º e a Lótus Oculta até o 5º. Simulação (1000 runs, seed 2; nova linha do prodígio), Médio antes → depois: História 91 → 98%, Comum 40 → 69%, prodígio 68 → 91%, Uchiha 49 → 76%, Hyuuga 52 → 84%; Difícil: História 30 → 65%, Comum 5 → 19%, prodígio 16 → 56%, Uchiha 5 → 22%, Hyuuga 9 → 31%. O salto vem quase todo da regra das ativas grátis: o bot gastava muitos turnos refazendo clones e fortalecimentos (com espera 2 nos clones, quase nada muda: História 98%, Comum 67%). Nada foi compensado: decidir com o usuário (alavancas: força dos inimigos da Jornada, chakra/espera das ativas, clones com menos chance de segurar o golpe, números dos portões). **v0.43.0** (pedido do usuário): botão do Portão da Vila volta ao menu sem recarregar (Roleta: run abandonada; Jornada: salva no começo da parada) e Ficha só com run; Ficha da equipe na Jornada; moveset com o tema da classe; recuperação depois da vitória vira configuração da run pela dificuldade (`run.afterWinRecovery`: Fácil 35%, Médio 25%, Difícil 20%, Hardcore 15%, decidido com o usuário); relíquias iniciais narrativas sem a recuperação (Bandana do Iruka, Manual da Academia, Macacão verde, Leque do clã, Pergaminho do Punho Suave; evoluções Colar do Primeiro Hokage, Colete de chunin, Macacão da Juventude, Brasão Uchiha, Pergaminho dos Oito Trigramas; a relíquia de chefe da Vontade do Fogo virou Talismã da Vontade do Fogo; `RELIC_RENAMES` migra saves e coleção); o Comum escolhe o elemento (ou o prodígio) ou sorteia e ganha uma relíquia comum; Hyuuga sem elemento; suportes com classe sorteada entre as liberadas (pode repetir a do protagonista), ficha e nome sorteados (fichas novas Kaede Uchiha e Sei Hyuuga). Decidido sozinho (o usuário revisa): os efeitos e números das iniciais e evoluções, as listas de nomes, as duas fichas novas e o prodígio dentro da escolha. Simulação (1000 runs, seed 2), Médio/Difícil/Hardcore antes → depois: História 98/65/65 → 98/69/60, Comum 69/19/19 → 79/28/26, prodígio 91/56/56 → 92/59/56, Uchiha 76/22/22 → 75/19/16, Hyuuga 84/31/31 → 85/35/30. O Comum sobe com a relíquia do sorteio e o Manual (XP); o Hardcore agora se separa do Difícil pela recuperação menor. Nada foi compensado. **Falta**: versão suporte do prodígio, mais easter eggs e sprites. Simulação da História (`npm run sim:jornada`, 1000 runs, seed 2): Fácil 100%, Médio 74%, Difícil 4%, Hardcore 4%; v0.35.1 (Tigela do Ichiraku cura também quem ficou fora da luta, estágio vencido restaura tudo): Médio 78%, Difícil e Hardcore 6% (igual ao Difícil: os inimigos da Jornada não têm passiva hardcore). Alvo a combinar com o usuário. Tudo em [docs/jornada/README.md](docs/jornada/README.md).
8. **Roleta enxuto**: o modo atual vira o rápido, para sessões curtas: run mais curta e um combate refeito, extremamente simples e bem mais na sorte. O combate atual migra para a Jornada. Detalhar com o usuário antes de mexer.

9. **Retratos dos personagens (pedido do usuário, ainda sem versão)**: hoje os vilões têm desenho próprio, mas os ninjas usam um molde único que só troca as cores (`ninjaPortrait` em `prototype/art.ts`), então Naruto, Sasuke, Kakashi, Lee e outros quase não se parecem com os personagens. Proposta: desenho próprio em SVG para os cerca de 20 principais; arte própria pode entrar depois em `public/img/jornada/<id>.webp`. Combinar antes de começar.

Última rodada concluída: "rebalanceamento das origens"
 (27/10/2026) foi implementada na v0.18.0: 25% de HP e chakra por vitória, controles com tenacidade e vulnerabilidade, barreiras como escudo (ação de turno), ilusões de dano do Uchiha e Sharingan grátis, Possessão do Yamanaka, Gênio do Nara, Determinação mais forte e nerf do prodígio, Akimichi, Inuzuka e Uzumaki. Decisões tomadas junto: o Gênio é ativa com usos por luta (2, +1 nos níveis 4 e 7) e vale nas roletas de combate do jogador; o genjutsu de dano do Uchiha fere de verdade e o do Yamanaka é controle mental com autoferimento; controle em cadeia é contido pela tenacidade (cai por rodada), não por regra de chefe; a meta é não ter origens muito acima ou abaixo das outras.

Observação em aberto (não é mudança de design): na simulação, a fatia "nova técnica" da recompensa vale bem menos que as outras (sem ela, o comum vence ~20 pontos a mais). Vale discutir com o usuário antes de mexer.

Alvo da simulação (31/10/2026): o bot joga pior que um humano, sobretudo nas origens de kit complexo. Alvo do bot no **Médio: 60–70%**; Aburame, Nara, Yamanaka e Uchiha **50–60%**. Ajustes para chegar no alvo são propostos ao usuário com a tabela de antes e depois, nunca aplicados sozinhos.

Observação em aberto (v0.31.1): vilões 90/110/125/135% (Fácil/Médio/Difícil/Hardcore), manutenção dos dōjutsu 2 e Colônia 1 de chakra a cada 5 insetos. Campanha por origem (1000 runs, seed 2), Médio v0.31.0 → v0.31.1: Comum 87 → 73%, Nara 90 → 78%, Akimichi 88 → 73%, Yamanaka 86 → 73%, Aburame 57 → **30%**, Inuzuka 86 → 72%, prodígio 84 → 70%, Uchiha 79 → 61%, Hyuuga 84 → 70%, Uzumaki 90 → 81%. Difícil: de 17% (Uchiha) a 38% (Yamanaka, Uzumaki); Aburame 4%. Quase todas chegaram perto do alvo (60–70%); Nara (78%) e Uzumaki (81%) seguem acima, e o Aburame voltou a ficar bem abaixo (a Colônia mais fraca tirou o chakra que sustentava o Devorar). Nada foi compensado: decidir com o usuário. v0.31.2 (Devorar usa todos os insetos, deixa 40% presos e suga 5–20% do chakra máximo do vilão; bot devora também quando falta chakra para o Enxame): Aburame 30 → 37% no Médio, 4 → 6% no Difícil; as outras origens não mudam. Continua abaixo do alvo de kit complexo (50–60%); o usuário testou o Hardcore à mão e achou complicado. Próximo passo combinado: testar à mão antes de mexer de novo. v0.31.3 (Colônia passiva: 1 de dano a cada 2 insetos, até 6, e 1 de chakra a cada 5, até 3, por rodada; Enxame com 4 de dano fixo; Devorar não deixa os insetos se soltarem; Hardcore com a força do Difícil, 125%): Aburame 37 → 73% no Médio, 6 → 31% no Difícil, 0 → 4% no Hardcore. O Hardcore das outras origens subiu para 1–11% (era 0–7%). O Aburame agora está acima do alvo de kit complexo (50–60%), junto com Comum, Akimichi, Inuzuka e Yamanaka; Nara (78%) e Uzumaki (80%) seguem os mais altos. Consultar o usuário antes de mexer. v0.32.0 (Senju): 93% no Médio, 51% no Difícil, 12% no Hardcore, o mais forte de propósito, mas 1 ponto acima do teto combinado (~92%). A alavanca combinada é tirar a cura +25% da Força vital; não foi aplicada (consultar). v0.33.0 (kekkei genkai): quase nada muda na média por origem (Comum 73 → 76% no Médio; quem tem kekkei genkai é uma fatia pequena das runs). Não há linha própria na simulação para "com kekkei genkai". v0.34.0 (kit do prodígio): prodígio 68 → **91%** no Médio, 20 → 62% no Difícil, 1 → 29% no Hardcore. A Folha Furacão (2×9 por 2 de chakra desde o nível 1) e o Punho Bêbado pesaram muito: o prodígio virou a origem mais forte junto com o Senju (93%). Consultar o usuário: candidatos naturais são a Folha Furacão (dano 9 → 6, ou custo 2 → 4) e o Punho Bêbado (roleta ×0,5/×1/×1,5 sem o ×2). v0.34.2 (prodígio com Juventude, taijutsu pela metade e Punho Bêbado mais fraco; Quarteto do Som e Kabuto mais fortes; Mizuki sem se acovardar), Médio: Comum 69%, Nara 67%, Akimichi 61%, Yamanaka 70%, Aburame 60%, Inuzuka 61%, prodígio 91 → 75%, Uchiha 46%, Hyuuga 58%, Uzumaki 77%, Senju 86%. Difícil de 10% (Uchiha) a 37% (Senju); Hardcore de 1% a 10%. O Uchiha ficou abaixo do alvo de kit complexo (50–60%); prodígio, Uzumaki e Senju seguem acima. Consultar antes de mexer.

Roteiro de contas e progresso (combinado em 30/10/2026; a fase 1, o Laboratório `?teste` com `?seed=`, foi implementada na v0.27.0):
- **Fase 2, perfil local**: conquistas, Livro Bingo e estatísticas por origem implementados na v0.29.0 (`profile_v1`, [docs/base/perfil.md](docs/base/perfil.md)); falta desbloqueios/personalização (títulos, skins da roleta, nome do ninja; só cosméticos). A run continua só em memória (F5 reseta).

- **Fase 3, contas opcionais**: só para sincronizar o perfil local; o jogo segue jogável offline e sem conta. Usar um serviço com login pronto (Supabase ou Firebase, a decidir), nunca guardar senha. Pede política de privacidade (LGPD) e revisar o princípio "Sem backend". A Jornada (item 7), com progressão permanente, é o motivo principal para ter contas.

Quando o design mudar antes do código, listar aqui o que falta implementar.

## Princípios

- **Mobile-first**: controles de um toque, layout vertical, botões grandes.
- **Sessões curtas**: uma luta deve durar de 1 a 3 minutos.
- **Offline**: PWA com service worker.
- **Campanha só em memória**: F5 reseta a run (exceto a Jornada, salva a cada parada em `jornada_run_v1`; ver docs/jornada/run.md). Só o histórico de runs persiste (`localStorage`).
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

## Interface (design system "Shinobi")

- Estilos em `prototype/styles/` (camadas: `tokens.css` → `fonts.css` → `base.css` → `components.css` → telas); o build junta tudo com o esbuild e embute as fontes.
- Cores, fontes, durações e forma só por tokens (`var(--...)`); os temas escuro (Sumi) e claro (Pergaminho) trocam só os tokens.
- **Nada de emoji como ícone**: ícones são SVG do `ICONS` em `prototype/art.ts` (`icon(nome)`); ícone novo entra lá, no mesmo traço 24×24 em `currentColor`. A exceção é o texto de compartilhar (vai para o WhatsApp).
- Forma: cantos retos (`--radius: 2px`) e chanfro (`--cut`) nos painéis; o chanfro fica nas camadas `::before`/`::after`, nunca no elemento (cortaria números flutuantes e o foco).
- Pincel (`--font-display`) só em letreiro grande (logo, título de tela, nomes, chamada de jutsu); texto em `--font-body`; números e rótulos em `--font-hud`. Kanji de selo em `--font-kanji`: kanji novo precisa entrar no recorte (`prototype/fonts/LEIAME.md`).
- Ids, `data-*` e classes que o TS consulta (`.primary` dos botões de roleta, `.jf`, `.sticky-cta`...) são contrato: mudar o visual não pode mexer neles.
- **Botões simples, detalhes na dica** (pedido do usuário, v0.42.0): botão leva ícone, nome e os números principais (dano, custo, usos). Efeitos, regras, penalidades e motivo de bloqueio ficam na dica (`tip()`: passar o mouse ou segurar o dedo). Nada de instrução no botão ("grátis", "não gasta o turno", "toque para...").

## Convenções

- Idioma do código e dos commits: _definir (PT-BR ou EN)_.
- Funções do `core` não acessam DOM, `localStorage` nem `Math.random`.
- Todo número de balanceamento fica em configuração (`balance`), nunca espalhado no código.
- Dano e resistência arredondados para baixo no fim do cálculo.
- Antes de mudar uma fórmula, escrever ou ajustar o teste correspondente.
- **Toda funcionalidade ou versão nova termina publicada**: testar, commitar, fazer push e subir a tag `vX.Y.Z`, sem esperar pedido (passo a passo na skill `.claude/skills/lancar-versao`). Nunca `--force`; só não publicar se o usuário disser para segurar.