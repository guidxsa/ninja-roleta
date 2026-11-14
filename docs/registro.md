# Registro de design

Histórico das decisões e das simulações por versão, movido do `CLAUDE.md` na v0.47.2 sem cortes. É consulta: as regras vigentes estão nos outros docs e o que falta decidir está em [decisoes.md](decisoes.md). Ao fechar uma versão que muda o design, acrescentar o resumo e a simulação na frente certa.

## Frentes combinadas (itens 5 a 9)

Combinado em 31/10/2026 (brainstorm com o usuário). Os números são rascunho: a simulação decide e o usuário faz o ajuste fino. Cada frente vira uma versão própria.

5. **Kit do prodígio (v0.34.0, feito em parte)**: entraram Folha Furacão (nível 1), Lótus Primária presa aos Portões (nível 4), Punho Bêbado (nível 4) e Lótus Oculta com o 3º portão (nível 7); a Lótus Primaveril e o Redemoinho saíram. **Ficou de fora: Pesos de treino como ativa do prodígio** (+3 de speed e +2 de taijutsu ao tirar), porque conflita com o item Pesos de treino que já existe; decidir com o usuário como os dois convivem. Os kits de níveis 4/7 das outras origens ficam para a árvore de talentos da Jornada (item 7); o combate rico vai para lá, e o Roleta será simplificado (item 8).
6. **Hyuuga**: sem técnica nova no nível 1. O kit é taijutsu básico + Selo dos Pontos Vitais (só com o Byakugan); a identidade é abrir o olho. A **Palma do Vácuo** (taijutsu de distância, só com o Byakugan) fica para a **árvore de talentos da Jornada** (item 7).
7. **Modo Jornada (v0.35.0, feito em parte)**: tela inicial com a escolha de modo; **História do Naruto completa** (3 estágios lineares, confrontos do mangá, Sasuke no Vale do Fim como chefe final), com motor de combate de equipe próprio (`src/core/jornada/`, até 3 × 3, só o protagonista controlado), tela de batalha nova com animação por evento, árvore de talentos do Naruto (Clones, Kyuubi no lugar do Modo Sennin, Rasengan), relíquias com tiers, ryō, mercador, descanso, tesouro, eventos com minijogos (memória, selos, jokenpô), run salva no aparelho e conquistas na categoria Jornada. Decisões tomadas sozinho e registradas nos docs (o usuário revisa): a Sakura é tática, não médica (mangá antes do timeskip); as paradas entre os confrontos, os inimigos genéricos, as relíquias e os números. **v0.36.0: Caminho Ninja** com mapa ramificado de 12 linhas (`src/core/jornada/map.ts`), desconhecido, chefe sorteado por estágio, classe Comum com elemento sorteado (sem elemento = prodígio, 20%), árvores do Comum e do prodígio, suportes genéricos (Daichi e Hana) e eventos genéricos; Uchiha e Hyuuga aparecem com cadeado (as conquistas que os liberam já contam). Decidido sozinho na v0.36.0: chefes do Caminho Ninja lutam sozinhos (Zabuza ou Haku, Gaara ou Neji, Orochimaru ou Kimimaro); 3 primeiras linhas com lutas leves; mapa de 12 linhas. Simulação do Caminho Ninja (Comum, 1000 runs, seed 2): Fácil 100%, Médio 40%, Difícil e Hardcore 5% — o bot escolhe caminho de forma simples; alvo a combinar. **v0.37.0**: Uchiha (fogo fixo + segundo elemento sorteado, Sharingan, ramos Sharingan/Fogo/Ilusões) e Hyuuga (Byakugan, Punho Suave, Rotação com a Palma do Vácuo) liberados pelas conquistas; versões suporte (Ren Uchiha, Mio Hyuuga) entram no sorteio de parceiros; easter egg do Sasuke (Uchiha com raio aprende o Chidori → conquista secreta libera o ramo Sasuke e o visual). Simulação (500 runs, seed 2, Médio): Comum 37%, Uchiha 46%, Hyuuga 52%. **v0.37.1**: as runs passam a se chamar **História** (ids internos seguem `canon`) e **Caminho Ninja** (`generic`); relíquias com texto genérico, 22 novas com ganchos novos (`xpMult`, `shopDiscount`, `grant.ryo`, `grant.talentPoints`), ícone por relíquia e barra/painel na tela; simulação quase igual (História 77 → 78% no Médio; Caminho Ninja ±1). **v0.39.0**: protagonista caído não encerra a run (suportes de pé levantam, até 3 vezes por luta: `combat.supportRevivesPerFight`, limite decidido sozinho para evitar laço de cair e levantar sem o jogador agir); equipe de resgate no estágio 3; nome do jogador no perfil (`playerName`). Simulação (1000 runs, seed 2), Médio antes → depois: História 79 → 78%, Comum 37 → 43%, Uchiha 45 → 52%, Hyuuga 50 → 54%; Difícil: História 6 → 5%, Comum 3 → 5%, Uchiha 4 → 7%, Hyuuga 7 → 9%. A História quase não muda porque muitas lutas dela são solo. **v0.40.0**: relíquias com as classificações do pedido do usuário, 94 no total, elite deixa relíquia nos dois modos, inicial por personagem e evolução (`relics.starterEvolveChance` 50%, decidido sozinho; pesos do tesouro 40/35/25, preços 40/60/90/70). Simulação (1000 runs, seed 2), Médio v0.39.0 → v0.40.0: História 78 → 85%, Comum 43 → 41%, Uchiha 52 → 54%, Hyuuga 54 → 56%; Difícil: História 5 → 12%, Comum 5 → 5%, Uchiha 7 → 8%, Hyuuga 9 → 10%. A História sobe mais porque o bot passa por todas as 7 elites; no mapa, ele só entra em elite com HP alto. **v0.41.0**: árvore do Naruto com 6 ramos e bifurcações, níveis de talento em todas as classes (decidido com o usuário: a maioria é única, sobem principalmente técnicas), tela nova da árvore por classe e mapa aprimorado. Ramos, nós novos e números decididos sozinho, o usuário revisa. Simulação (1000 runs, seed 2), Médio v0.40.0 → v0.41.0: História 85 → 91%, Comum 41 → 40%, Uchiha 54 → 49%, Hyuuga 56 → 52%; Difícil: História 12 → 30%, Comum 5 → 5%, Uchiha 8 → 5%, Hyuuga 10 → 9%. Antes da v0.39.0 (Médio/Difícil): História 79/6, Comum 37/3, Uchiha 45/4, Hyuuga 50/7. A História ficou bem mais fácil para o bot: decidir com o usuário se compensa; alavancas: levantar com menos HP, menos ponto de talento na elite, força dos inimigos. Nada foi compensado. **v0.42.0** (pedido do usuário): custo de HP de técnica visível na hora (era cobrado, mas a barra só pulava no fim da animação); ativas de classe não gastam o turno, uma por turno, e o fortalecimento conta o turno da ativação; Portões em 5 níveis canônicos (Abertura, Descanso, Vida, Dor, Limite), acumulativos, uma troca por turno (subir, descer, fechar) sem renovar o tempo, desgaste por turno no lugar do custo na abertura; dano dos botões com talentos, níveis e portão; botões simples nos dois modos. Decidido sozinho (o usuário revisa): números dos portões (×1,15 a ×1,68, desgaste de 2% a 8% por turno), 4 turnos abertos, espera 3 ao fechar, desgaste não derruba, o talento Portão da Vida libera até o 3º e a Lótus Oculta até o 5º. Simulação (1000 runs, seed 2; nova linha do prodígio), Médio antes → depois: História 91 → 98%, Comum 40 → 69%, prodígio 68 → 91%, Uchiha 49 → 76%, Hyuuga 52 → 84%; Difícil: História 30 → 65%, Comum 5 → 19%, prodígio 16 → 56%, Uchiha 5 → 22%, Hyuuga 9 → 31%. O salto vem quase todo da regra das ativas grátis: o bot gastava muitos turnos refazendo clones e fortalecimentos (com espera 2 nos clones, quase nada muda: História 98%, Comum 67%). Nada foi compensado: decidir com o usuário (alavancas: força dos inimigos da Jornada, chakra/espera das ativas, clones com menos chance de segurar o golpe, números dos portões). **v0.43.0** (pedido do usuário): botão do Portão da Vila volta ao menu sem recarregar (Roleta: run abandonada; Jornada: salva no começo da parada) e Ficha só com run; Ficha da equipe na Jornada; moveset com o tema da classe; recuperação depois da vitória vira configuração da run pela dificuldade (`run.afterWinRecovery`: Fácil 35%, Médio 25%, Difícil 20%, Hardcore 15%, decidido com o usuário); relíquias iniciais narrativas sem a recuperação (Bandana do Iruka, Manual da Academia, Macacão verde, Leque do clã, Pergaminho do Punho Suave; evoluções Colar do Primeiro Hokage, Colete de chunin, Macacão da Juventude, Brasão Uchiha, Pergaminho dos Oito Trigramas; a relíquia de chefe da Vontade do Fogo virou Talismã da Vontade do Fogo; `RELIC_RENAMES` migra saves e coleção); o Comum escolhe o elemento (ou o prodígio) ou sorteia e ganha uma relíquia comum; Hyuuga sem elemento; suportes com classe sorteada entre as liberadas (pode repetir a do protagonista), ficha e nome sorteados (fichas novas Kaede Uchiha e Sei Hyuuga). Decidido sozinho (o usuário revisa): os efeitos e números das iniciais e evoluções, as listas de nomes, as duas fichas novas e o prodígio dentro da escolha. Simulação (1000 runs, seed 2), Médio/Difícil/Hardcore antes → depois: História 98/65/65 → 98/69/60, Comum 69/19/19 → 79/28/26, prodígio 91/56/56 → 92/59/56, Uchiha 76/22/22 → 75/19/16, Hyuuga 84/31/31 → 85/35/30. O Comum sobe com a relíquia do sorteio e o Manual (XP); o Hardcore agora se separa do Difícil pela recuperação menor. Nada foi compensado. **v0.44.0** (pedido do usuário): **modo infinito só no Caminho Ninja** (a História termina no Vale do Fim): depois do 3º chefe, segue para o ciclo 2, 3... de volta ao estágio 1 com chefes e mapa novos, mantendo tudo, e os inimigos × (1 + `infinite.enemyPerCycle` × ciclo), somando (decidido com o usuário; fatia 0,4 de rascunho); **árvore completa vira ryō**, 30 por ponto (decidido com o usuário); recorde no perfil e conquistas dos ciclos 2, 3 e 5. Decidido sozinho (o usuário revisa): a continuação fica salva na vitória (fechar o app não perde o ciclo); a Vontade do Fogo volta ao mínimo da dificuldade a cada ciclo; marcas dos eventos limpas e contas da run somando; ryō convertido sem o multiplicador; a run guarda as conquistas que liberam nós da árvore (`unlocks`) para o core saber se a árvore fechou; nomes das conquistas e o ícone do ciclo. O 1º ciclo não muda na simulação (a árvore quase nunca fecha nele). Curva do infinito (`npm run sim:jornada -- 60 2 8`, Médio/Difícil, fração das runs que vence cada ciclo; C1 = 1º ciclo): fatia **0,4**: Comum C2 75% · C5 60% · C8 12% (Difícil C2 15%), prodígio C2 82% · C5 73% · C8 27% (Difícil 48%), Uchiha C2 50% · C5 22% · C8 3% (Difícil 8%), Hyuuga C2 57% · C5 33% · C8 3% (Difícil 13%); fatia **0,7**: Comum C2 50% · C3 22% (Difícil 8%), prodígio C2 58% · C3 33% (Difícil 13%), Uchiha C2 23% (Difícil 0%), Hyuuga C2 23% (Difícil 7%); fatia **1,0** (100 runs): Comum C2 12%, prodígio 21%, Uchiha 2%, Hyuuga 7%. Com 0,4 quem vence o 1º ciclo no Médio vai longe (o nível continua subindo); decidir com o usuário a fatia e se Uchiha/Hyuuga, que caem mais rápido, pedem ajuste. **Falta**: versão suporte do prodígio, mais easter eggs e sprites. Simulação da História (`npm run sim:jornada`, 1000 runs, seed 2): Fácil 100%, Médio 74%, Difícil 4%, Hardcore 4%; v0.35.1 (Tigela do Ichiraku cura também quem ficou fora da luta, estágio vencido restaura tudo): Médio 78%, Difícil e Hardcore 6% (igual ao Difícil: os inimigos da Jornada não têm passiva hardcore). Alvo a combinar com o usuário. Tudo em [docs/jornada/README.md](docs/jornada/README.md).
8. **Roleta enxuto (detalhado com o usuário em 05/11/2026; v0.45.0 a v0.47.0)**: o Roleta vira o modo rápido, simples e direto; a carga complexa fica na Jornada. Decidido com o usuário:
   - **Run**: lutas sorteadas por categoria de vilão (genin → chunin → jounin → chefe) num ciclo curto, infinito (depois do chefe volta ao genin com os vilões mais fortes); sem blocos, exame chunin nem lore; eventos pré-luta diretos (saem guru, Lição do clã e o foco elemental); mais vilões no sorteio (fichas vindas dos inimigos da Jornada).
   - **Progressão**: técnicas sobem sozinhas com o nível (acabam os upgrades à escolha, a fatia "Nova técnica" e o Pergaminho de técnica); 1 técnica por elemento (sem linhas I–IV); recompensa direta depois de toda luta (Status, XP, Item, Relíquia, Cura); invocações e itens permanentes (Ferramenta ninja, amuletos, Pesos de treino com a mecânica de hoje) viram relíquias.
   - **Combate**: sem reações (defesa automática; a Substituição vira esquiva pela speed), sem disputa de ninjutsu, barreiras e estados elementais, **sem multiplicador de elemento no dano** (ninjutsu é dano comum), 4 efeitos com duração fixa (Queimar, Veneno, Atordoar, Medo), ritmo mais rápido.
   - **Origens**: kits enxutos, 1 passiva e 1 ativa simples por linhagem (proposta no plano da v0.44.0; o usuário pode ajustar).
   - **Relíquias**: catálogo único marcado por modo (números próprios do Roleta; as de equipe, ryō e talento só na Jornada; exclusivas do Roleta); no Roleta saem da fatia "Relíquia" da recompensa e do baú de chefe (1 de 3); sem relíquia inicial por enquanto; coleção única com filtro.
   - **Não apagar os conceitos que saem do Roleta**: reações, disputa, barreiras, estados elementais, efeitos mentais com fuga, linhas elementais, kits ricos e premium do guru ficam guardados (código clássico com os testes e `docs/reserva/`), porque o usuário talvez os leve para a Jornada.
   - Ordem: v0.45.0 combate, kits e progressão; v0.46.0 run no core, infinito e relíquias; v0.47.0 mais vilões.
   - **v0.45.0 (feito)**: motor novo `src/core/roleta/` (um toque por turno, esquiva pela speed, dano sem elemento, 4 efeitos, ativa grátis), kits enxutos das 11 linhagens (`src/data/roleta/kits.ts`), técnicas fixas que sobem com o nível (`src/data/roleta/techniques.ts`), eventos/itens/recompensa diretos (`roletaData.base`), Laboratório com o kit fixo, conquistas impossíveis viram "clássicas" (`legacy`). O clássico segue no código com os testes (`npm run sim:classico`) e em `docs/reserva/`. Decidido sozinho (o usuário revisa): todos os números dos kits e das técnicas, a esquiva 5% + 2% por speed (teto 30%), Queimar 5%/2 turnos, Veneno 4%/3, Medo −25% de dano e −15% de acerto, Concentrar 25%, Orochimaru do hardcore volta no máximo 3 vezes (no clássico era a janela de tempo); ajuste inicial do prodígio (Folha Furacão 8 → 6, Portões ×1,5 → ×1,3) e do Inuzuka (Presas 7 → 6). Simulação (`npm run sim:origens -- --runs 300 --seed 2`), Médio clássico → enxuto: Comum 68 → 75%, Nara 68 → 75%, Akimichi 61 → 88%, Yamanaka 70 → 77%, Aburame 61 → 84%, Inuzuka 59 → 94%, prodígio 76 → 95%, Uchiha 45 → 79%, Hyuuga 58 → 87%, Uzumaki 80 → 85%, Senju 87 → 96%; Difícil de 12–39% para 22–65%; Hardcore de 1–9% para 4–33%. Lutas de 3 a 6 rodadas (clássico: 7 a 20+). O enxuto ficou mais fácil para o bot e as linhagens de taijutsu (prodígio, Inuzuka, Akimichi) e o Senju passam do alvo (Médio 60–70%): decidir com o usuário (alavancas: força dos vilões no Roleta, fração de resistência 0,4, esquiva, Portões e Dupla).
   - **v0.46.0 (feito)**: run no core (`src/core/roleta/run.ts`): ciclo de 6 lutas sorteadas por categoria (`src/data/roleta/villains.ts`: 2 genin, 2 chunin, 1 jounin, chefe), sem blocos, exame nem lore; evento antes de cada luta e recompensa depois de cada vitória (comum/comum/rara); chefe cura tudo e abre o baú (1 de 3 relíquias de chefe); modo infinito (vilões × 1 + 0,3 × ciclo, rascunho; a vitória do 1º ciclo conta como vitória da run). Relíquias com **catálogo único** (`src/data/relics.ts`; `RelicDef.modes` e `roleta`): 31 da Jornada saem também no Roleta com números próprios, 5 exclusivas (Ferramenta ninja, amuletos, Contratos das cobras e das lesmas); Contrato dos sapos e Pesos de treino têm efeito diferente em cada modo; fatia **Relíquia** na recompensa; a roleta de itens fica só com recursos e consumíveis; coleção única com filtro. Histórico com ciclo e lutas, recorde do Roleta, conquistas dos ciclos 2/3/5; Chunin e Reprovado, mas vivo viram clássicas. Decidido sozinho (o usuário revisa): quais relíquias da Jornada saem no Roleta e os números, a fatia Relíquia com peso 15, os pesos da roleta de itens, um contrato por vez, e o **Orochimaru do Roleta volta só 1 vez** (`villains.insaneRevivesCap`): com o ciclo curto (5 lutas antes do chefe, contra 13 e o exame na campanha antiga), o jogador chega mais fraco e o Orochimaru com 2 voltas segurava até 60% das runs (Médio de 23% a 85%). Simulação (`npm run sim:origens -- --runs 200 --seed 2`, vence o 1º ciclo; entre parênteses, os ciclos 2/3), Médio: Comum 43% (33/30), Nara 47%, Akimichi 77%, Yamanaka 46%, Aburame 68%, Inuzuka 84%, prodígio 87% (73/71), Uchiha 58%, Hyuuga 61%, Uzumaki 68%, Senju 90%; Difícil de 12% (Comum, Nara) a 60% (prodígio); Hardcore de 5% a 37%. O Orochimaru segue sendo onde a maioria para. O Comum, o Nara e o Yamanaka ficaram abaixo do alvo, e as linhagens de taijutsu e o Senju acima: decidir com o usuário (alavancas: XP por luta ou ciclo mais longo, força do chefe, os kits de taijutsu).
   - **v0.47.0 (feito)**: 11 vilões só do Roleta, adaptados dos inimigos da Jornada (`roletaExtraVillains` em `src/data/roleta/villains.ts`, retrato emprestado da Jornada por `VillainDef.portrait`): genin Bandido, Capanga do Gatō, Renegado da Névoa, Ninja da Grama e Ninja da Chuva; chunin Irmãos Demônio (duas ações a 60%), Dosu, Zaku e Kin; jounin Kimimaro (marca da maldição) e Neji. O chefe segue só o Orochimaru. Fichas e números decididos sozinho (o usuário revisa). Simulação (200 runs, seed 2), Médio v0.46.0 → v0.47.0: Comum 43 → 35%, Nara 47 → 40%, Akimichi 77 → 68%, Yamanaka 46 → 47%, Aburame 68 → 62%, Inuzuka 84 → 82%, prodígio 87 → 79%, Uchiha 58 → 45%, Hyuuga 61 → 57%, Uzumaki 68 → 54%, Senju 90 → 80%; Difícil de 10% a 53%; Hardcore de 6% a 37%. Ficou um pouco mais difícil (os genin novos dão menos XP que o Mizuki). Nada foi compensado: o balanceamento do Roleta enxuto segue para o usuário decidir (alvo Médio 60–70%).
   - **v0.47.1** (decidido com o usuário): os Espelhos (Haku, Irmãos Demônio) giram uma roleta por ataque, como toda técnica de vários golpes; antes giravam duas, contra os docs. A fumaça anula o ataque inteiro. Simulação (1000 runs, seed 2), Médio antes → depois: Comum 35 → 35%, Nara 45 → 42%, Akimichi 70 → 70%, Yamanaka 48 → 49%, Aburame 65 → 63%, Inuzuka 74 → 75%, prodígio 82 → 85%, Uchiha 45 → 47%, Hyuuga 55 → 56%, Uzumaki 55 → 59%, Senju 78 → 77%. Em todas as dificuldades, nenhuma célula muda mais de 4 pontos: dentro do ruído. Nada foi compensado.

9. **Retratos dos personagens (pedido do usuário, ainda sem versão)**: hoje os vilões têm desenho próprio, mas os ninjas usam um molde único que só troca as cores (`ninjaPortrait` em `prototype/art.ts`), então Naruto, Sasuke, Kakashi, Lee e outros quase não se parecem com os personagens. Proposta: desenho próprio em SVG para os cerca de 20 principais; arte própria pode entrar depois em `public/img/jornada/<id>.webp`. Combinar antes de começar. **Combinado na v0.54.0**: arte oficial liberada nos retratos, com os arquivos fornecidos pelo usuário.

## Correções do jogador (06/11/2026)

Lista de problemas apontada pelo usuário jogando. Decidido com ele: pílula automática no protagonista, regen fixo menos no chefe, loja com aumento por compra e por estágio, ativa Esforço do Comum, infinito ×1,5 composto só no Hardcore, inimigos calibrados para o bot em 60–70% no Médio, recompensa do Roleta forte e escalando, Yamanaka, Nara e Aburame fora do Roleta.

- **v0.47.3**: abertura da luta não adianta o dano; nome de fatia estreita na roleta.
- **v0.48.0, reviver como habilidade**: só pílula (automática no protagonista) e técnica levantam; saem a ação Levantar e o limite de 3. Decidido sozinho (o usuário revisa): Reanimação 15 de chakra, espera 2, 50% do HP; quem tem (Tsunade, ficha nova de suporte Mika no sorteio do Comum, talentos Ninguém fica para trás e Primeiros socorros); Kabuto com Reanimação proibida (15, espera 3, 30%). **Efeito inesperado**: a simulação subiu. Antes, inimigos táticos e curandeiros levantavam aliados de graça, sem limite e com 50% do HP, o que os docs nunca descreveram. Decomposição por variantes (400 runs, Médio; dados alterados só em memória): tirar esse reviver dos inimigos dá +6 a +14 pontos; tirar o reviver grátis da equipe, −1 a −6; a Mika, quase nada. Simulação (1000 runs, seed 2), Médio/Difícil/Hardcore antes → depois: História 98/69/60 → 100/68/56, Comum 79/28/26 → 81/29/26, prodígio 92/59/56 → 98/67/62, Uchiha 75/19/16 → 83/18/16, Hyuuga 85/35/30 → 90/37/32. Compensado na calibragem dos inimigos, depois das outras mudanças.
- **v0.49.0, regen em valor fixo**: recuperação pós-vitória (HP/chakra: Fácil 35/10, Médio 25/8, Difícil 20/6, Hardcore 15/5), descanso 40/12, tratamento 50/15, kits 35 HP e 12 de chakra, Concentrar 8, regen por rodada 1–4 de HP, técnicas de cura 10–30 HP, eventos e relíquias. Decidido com o usuário: o chefe segue curando tudo. Decidido sozinho (o usuário revisa): valores iguais ao % antigo no nível 1 (HP 100, chakra 30); ramen da formatura segue cura total; reviver, aliado caído voltando e Vontade do Fogo seguem em % (são retorno, não regen); cura de técnica do inimigo escala com a força dele. Simulação (1000 runs, seed 2), Médio/Difícil/Hardcore v0.48.0 → v0.49.0: História 100/68/56 → 97/43/34, Comum 81/29/26 → 76/24/20, prodígio 98/67/62 → 96/58/48, Uchiha 83/18/16 → 76/13/11, Hyuuga 90/37/32 → 86/32/27.
- **v0.50.0, loja sempre aberta**: sai o nó de mercador do mapa e da História; botão Loja no HUD. Decidido com o usuário: +10% por compra e +25% por estágio, somando, com estoque salvo por estágio. Decidido sozinho (o usuário revisa): os pesos do mercador no mapa viram luta (45 → 53) e os do desconhecido, metade evento e metade luta; treino e tratamento sem limite, contidos só pelo preço (antes, 1 tratamento por visita); os estágios contam entre os ciclos do infinito; não abre durante a luta nem nas telas de evento e tesouro. O bot compra a cada parada: kit de HP abaixo de 50% da vida, senão a relíquia mais barata. Simulação (1000 runs, seed 2), Médio/Difícil v0.49.0 → v0.50.0: História 97/43 → 93/43, Comum 76/24 → 82/27, prodígio 96/58 → 98/64, Uchiha 76/13 → 79/15, Hyuuga 86/32 → 89/36. A História cai um pouco porque perdeu as 3 paradas sem risco com loja garantida; no mapa, sobem as lutas e o XP.
- **v0.51.0, Comum, infinito e inimigos**. Decidido com o usuário: ativa Esforço; Bunshin no Jutsu como técnica de turno; infinito ×1,5 composto só no Hardcore; bot no Médio em 60–70%. Decidido sozinho (o usuário revisa): Esforço +3 nos ataques, 3 turnos, 3 de chakra, espera 4; o Kunai segue conhecido, fora do moveset inicial; o talento "Esforço" vira Trabalho duro, para não repetir o nome; a IA cria clone com o Bunshin 40% das vezes quando não tem nenhum; run antiga em ciclo 2+ fora do Hardcore termina o ciclo e não segue. **Força dos inimigos**: a Jornada ganhou a própria (`enemyStrength`, 98/120/136/136%; antes vinha do Roleta, 90/110/125/125%), e o fator passa a contar uma vez só no dano (entrava no ataque e em `damageMult`; com isso, ×1,5 valeria ×2,25). A curva é íngreme: 1,15 dá Comum 71%, 1,21 dá 59%, 1,24 dá 53%, 1,4 dá 20%. Escolhido 1,2: o Comum entra no alvo; subir mais o derrubaria sem trazer os outros. Simulação (1000 runs, seed 2), Médio/Difícil/Hardcore v0.50.0 → v0.51.0: História 93/43/36 → 93/61/55, Comum 82/27/24 → 61/27/23, prodígio 98/64/57 → 96/69/64, Uchiha 79/15/13 → 69/26/22, Hyuuga 89/36/34 → 85/50/42. **Fora do alvo no Médio**: História 93%, prodígio 96%, Hyuuga 85%, Uchiha 69% (alvo 50–60%); um multiplicador só não resolve: ver [decisoes.md](decisoes.md). O Difícil e o Hardcore subiram em algumas classes porque o fator deixou de contar duas vezes no dano. Curva do infinito no Hardcore (`npm run sim:jornada -- 300 2 8`, fração das runs que vence cada ciclo): Comum C1 22% · C2 17% · C3 12% · C4 8% · C5 1%; prodígio 68 · 50 · 35 · 15 · 3%; Uchiha 24 · 20 · 12 · 5 · 1%; Hyuuga 43 · 31 · 20 · 8 · 3%; ninguém vence o C6.
- **v0.52.0, Roleta**. Decidido com o usuário: roleta forte e escalando; Yamanaka, Nara e Aburame fora do sorteio, guardados para a Jornada. Decidido sozinho (o usuário revisa): pesos Status 35, Relíquia 22, XP 20, Itens 18, Jackpot 5; Status junta estágios, resistência (2/4/6) e crítico (1/2/3%; a fatia antiga dava 2/4/6% sem o resto); XP 50/100/150% do custo do nível; Jackpot com relíquia rara e cura de 25%; raridade +1 por ciclo; as conquistas Bom de ouvido e Que problemático viram clássicas junto com as de vitória; Mestre dos clãs pede 8 origens; o peso do Comum não mudou. Simulação (`npm run sim:origens -- --runs 1000 --seed 2`), Fácil/Médio/Difícil/Hardcore antes → depois: Comum 82/35/12/5 → 88/47/16/9, Akimichi 93/70/34/23 → 97/76/48/35, Inuzuka 94/75/40/29 → 98/82/54/39, prodígio 97/85/57/40 → 99/88/64/49, Uchiha 83/47/15/9 → 91/56/26/16, Hyuuga 89/56/21/14 → 93/69/33/21, Uzumaki 90/59/24/12 → 94/67/33/22, Senju 98/77/41/29 → 99/84/54/38. **Efeito a decidir**: quem vence o 1º ciclo quase não cai mais (Médio, ciclos 2/3: Comum 42/42, prodígio 84/84; antes 21/18 e 68/60): a raridade cresce mais rápido que os vilões. Nada foi compensado.
- **v0.53.0, dōjutsu que evolui e chakra na hora**. Decidido com o usuário: 3 tomoe e Byakugan desperto substituem a forma básica (campo `evolves`); nomes Sharingan (3 tomoe) e Byakugan (desperto). Decidido sozinho (o usuário revisa): os descontos do Leque do clã, do Pergaminho do Punho Suave e de Visão ampla valem também para a forma evoluída, para evoluir não encarecer a ativa. Simulação (1000 runs, seed 2), Médio/Difícil/Hardcore v0.52.0 → sem o desconto novo → v0.53.0: Uchiha 69/26/22 → 73/28/23 → 76/28/25, Hyuuga 85/50/42 → 85/53/48 → 85/53/48; as outras classes e o Roleta não mudam. **A alta vem de um limite do bot**: ele usa a primeira ativa de fortalecimento da lista, que era a forma fraca; agora só existe a forte. Um humano, que podia alternar as duas para ficar quase sempre fortalecido, perde essa opção, e a simulação não mede isso. Nada foi compensado.

## Direção visual (v0.54.0, 07/11/2026)

Orientação do usuário: a interface deve parecer parte do universo ([visual.md](visual.md)). Decidido com ele: arte oficial liberada nos retratos, piloto de 3 telas antes de estender, cor por modo mantendo os 2 temas, 8 a 10 locais marcantes (3 no piloto). Decidido sozinho (o usuário revisa): os itens listados em [decisoes.md](decisoes.md), item 6. Só visual: `scene` não sorteia nem entra em regra. Simulações antes → depois idênticas, linha a linha (`npm run sim:jornada -- 100 2` e `npm run sim:origens -- --runs 100 --seed 2`).

**v0.55.0** (pedido do usuário): os rostos do Monumento saem; Konoha fica com céu, sol, torre e telhados. Verde, Laranja e Marrom substituem dia/noite nos dois modos: sai o modo noturno, a cor por modo e a preferência por modo. Só visual; simulações antes → depois idênticas, linha a linha (mesmos comandos).

**v0.56.0** (pedido do usuário, com referências): volta a paleta antiga (Sumi e Pergaminho com dia/noite); saem as três cores. O Portão e a entrada da Jornada ganham a estrutura dos mockups (pergaminho rasgado, nuvens, letra manuscrita, citação, cards com arte, barra inferior, progresso e conquistas recentes) e vagas para ilustrações do usuário; a liberação de arte oficial passa a valer também para elas. `journeyProgress` no core só lê a run. Simulações antes → depois idênticas, linha a linha (mesmos comandos).

## Dualidade Naruto e Sasuke (v0.58.0, 08/11/2026)

Pedido do usuário: a dualidade Naruto/Sasuke como eixo da identidade. Decidido com ele: 4 arcos (conteúdo novo conferido com o mangá e apresentado), `sasuke.webp` como arte do Vale do Fim, campanha do Sasuke só em arquitetura e design doc. Feito: Portão dia/noite (Naruto e Sasuke), mapa único de artes `SCENE_ART`, faixa de arcos, campanhas (`CampaignDef`) e migração do save. Decidido sem ele, para revisar ([decisoes.md](decisoes.md) item 19): o evento Itachi e Kisame, o descanso Pousada de Tanzaku e o Kabuto como chefe. Simulação (300 runs, seed 2), vitória antes → depois: Fácil 100 → 100%, Médio 92 → 92%, Difícil 58 → 59%, Hardcore 50 → 51%.

## Origens: Prodígio no Comum e máximo de 2 elementos (v0.59.0, 08/11/2026)

Pedido do usuário, com os números do Inuzuka, Uchiha, Uzumaki e Senju definidos por ele (o Comum seguiu a proposta: 12/13/5, res. 10/9, chakra 32). Regra: o Comum que tira 0 elementos é o Prodígio do taijutsu (peso dele passou ao Comum, 39; elementos do Comum [18, 36, 24]); clãs 1 a 2 (75/25); Senju 1 a 2 (50/50); máximo 2 para todos. Os testes de fórmula do clássico usam uma base congelada das origens antigas (`formulaData`, `tests/helpers.ts`). Simulação do Roleta (1000 runs, seed 2), Médio antes → depois: Comum 47 → 68%, Akimichi 76 → 76%, Inuzuka 82 → 86%, Prodígio 88 → 88%, Uchiha 56 → 62%, Hyuuga 69 → 66%, Uzumaki 67 → 80%, Senju 84 → 93%. Jornada sem mudança.

## Roleta reformulada (v0.59.0, 08/11/2026)

Pedido do usuário: lutas com HP e chakra cheios, roleta de relíquia pós-luta com pesos por categoria (sem escolha; o baú do chefe fica), infinito só no Hardcore com o ciclo novo acima do último chefe, e a correção do Hardcore que não liberava (a vitória era sobrescrita por "abandonada" ao sair depois de vencer). Decidido sem ele: os pesos da roleta de relíquia, o piso do infinito e a força dos vilões (Chefe ×0,9; os outros ×1). Simulação do Roleta (1000 runs, seed 2), média do Médio: antes 74%, só com a regra nova 59%, com o Chefe ×0,9 65%.

## Revisão estrutural: natureza, Bunshin, Portões e chakra (v0.59.0, 08/11/2026)

Pedido do usuário com as respostas: o Comum também usa ninjutsu elemental; a natureza das outras origens é silenciosa; as outras Kekkei Genkai saem do jogador; os Portões novos valem nos dois modos. Regras comuns em `src/core/nature.ts`, `clones.ts` e `gates.ts`. Decidido sozinho: Mokuton em 3% dos Senju; Bunshin com 5 de chakra no Roleta; Portões com abertura 4 (Roleta) e 3 por portão (Jornada), manutenção `ceil(2 × 1,5^(n−1))` e peso de nível +25%; o vilão do Roleta fica com a regeneração e o Concentrar antigos; a IA da Jornada só cria clone com HP < 70%. Simulação (Roleta 1000 runs e Jornada 300, seed 2), Médio ponderado do Roleta: 64% → 58%; tabelas em [decisoes.md](decisoes.md) (item 24).

## Proporções de tela (v0.59.1, 10/11/2026)

Pedido do usuário: o layout ficou apertado, sobreposto e com tamanhos errados em notebook (1366×768 e Full HD com escala) e tablet. Checklist fechado com ele: composição por largura e altura, tablet em pé como celular expandido, tablet deitado como desktop compacto com toque, piso de altura, escala fluida, todas as telas. Os números foram decididos sozinho ([decisoes.md](decisoes.md) item 25). Só visual: nenhuma regra nem número de balanceamento mudou; testes (570) iguais.

**Arte e composição** (11/11/2026, mesma versão): depois do teste, o usuário apontou que as imagens dos cards não se ajustavam e que as peças brigavam entre si. Decidido com ele: a arte preenche a célula com foco (moldura única, proporção lida no build, foco no `SCENE_ART`), fica dentro do card, e cada peça ocupa o seu espaço, sem sobreposição. Limites de corte, focos e ordem de saída decididos sozinho ([decisoes.md](decisoes.md) item 25). Só visual; 576 testes (6 novos, do leitor de dimensões).

## Revisão da História, parte 2: narrativa, cenas e progressão canônica (v0.70.0, 14/11/2026)

Segunda das três versões do plano aprovado. Pedidos do usuário ao aprovar: toda escolha com pelo menos 2 opções; talentos de combinação entre árvores (fica para a parte 3); melhoria visual com animação nas interações.

O que entrou: pilha de formas (a forma temporária sai sem levar a permanente: era o bug da determinação contra o Neji); ações de roteiro `effect`, `boost`, `teach` e a condição `ifNot`; evento em etapas na mesma parada, com a lista do que a escolha deu; Kage Bunshin pelo pergaminho e Mil Clones depois do Mizuki, como marcos; Colar do Primeiro Hokage entregue pela Tsunade; falas reescritas; Gaara com o henge em raposa e a Cabeçada do jogador; teste do sino em campo, com "Lição"; cinco sequências de eventos juntadas (54 → 48 paradas) e evento seguido de evento sem voltar à trilha; opções sem a consequência entre parênteses e faixa "O que mudou"; 13 eventos da História e 2 do Caminho Ninja ganharam a segunda opção; cena de relíquia de história; retratos de forma; movimento das interações; migração de saves (`withMergedStops`).

Decidido sozinho (o usuário revisa, [decisoes.md](decisoes.md) item 27):
- **Aberturas de luta podem ser só fala.** O plano dizia fundir toda fala de abertura numa regra com efeito; ficou "a abertura e o fecho podem vir sozinhos, toda interrupção no meio muda algo" (teste em `tests/roteiro.test.ts`). Ganharam efeito na abertura só as que tinham um natural: névoa do Zabuza e espelhos do Haku (+20% de esquiva por 2 turnos), capanga atordoado pela besta do Inari, esquiva de quem viu o Lee (+20% por 3 turnos).
- **No meio da luta**: mordida do Orochimaru atordoa o Sasuke por 2 turnos; 64 palmas do Neji na rodada 2 (bloqueio de chakra por 2 turnos, novo); Kabuto cura 15% a 25% do HP; o primeiro Rasengan atordoa o Kabuto por 2 turnos. A fala do disfarce dos Ninjas da Grama saiu.
- **Gaara**: raposa com status ×1,15 e Presas da raposa (22 de dano, atordoar 50%); Cabeçada com 10 de dano e 100% de acerto; o gatilho da raposa em 50% do Shukaku (era a cabeçada do narrador em 30%); rede de segurança em 15%.
- **Sino**: quedas em 75/50/25% do Kakashi e limite na rodada 5 (era fim em 50% ou na rodada 4). A equipe derrubada pelo roteiro saía com 30% do HP para os Irmãos Demônio (História 67/29/12 no meio do caminho); por isso **a lição não custa HP nem chakra**: a equipe sai como entrou.
- **Mil Clones grátis**, e o talento `tTajuu` virou +20% de dano na técnica (mesmo custo; a parte 3 refaz o ramo e devolve os pontos).
- **Colar garantido** na cena dos Sannin (antes, 50% de chance por chefe vencido).
- **Segunda opção de cada cena e treino**: a primeira opção mantém o prêmio que a cena dava; a segunda vale parecido, em outra moeda. Os Sannin davam cura total e +1 ponto: as duas opções mantêm o ponto. Treinos: +40 XP certos com −10% do HP (−15% no Rasengan III), contra o ponto de talento do minijogo.
- **Kanji da Lição**: 修, que já estava no recorte da fonte (o 教 pediria baixar a fonte de novo).
- **Contagem de paradas**: 48, não as 49 do plano (erro de conta do plano).

Simulação (`npm run sim:jornada -- 300 2`), v0.69.0 → v0.70.0, Médio/Difícil/Hardcore: **História 90/60/27 → 87/43/18**; Fácil 100%. O Caminho Ninja não foi mexido. A História ficou mais difícil no Difícil e no Hardcore; onde o bot para no Difícil: Haku 22%, Trio da Chuva 15%, Kiba 8%, Neji 7%. O bot escolhe sempre a primeira opção dos eventos (o prêmio de antes) e não usa a Cabeçada (a cena do Gaara acontece pela rede de segurança). Nada foi compensado.

Não verificado no navegador: as animações dentro da luta (entrada e saída de forma, banner da Lição, a raposa) e a cena do colar. Verificado: o pergaminho, a faixa "O que mudou" no celular e no PC, a cena da bandana, a Formatura emendada no Time 7 e o carimbo.

## Revisão da História, parte 1: combate de equipe e economia (v0.69.0, 13/11/2026)

Pedido do usuário depois de testar a v0.68: revisão ampla da História em três versões (plano aprovado: 1. combate e economia; 2. narrativa, cenas e progressão canônica; 3. árvores do Naruto), parando ao fim de cada uma. Decidido com ele: controle com no mínimo 2 turnos para todos (aliados e inimigos), com trava e chances um pouco menores; regras de combate e os 60 ryō valem nos dois modos.

O que entrou: atordoar e bloqueio de chakra duram no mínimo 2 turnos (`combat.minControlTurns`); quem sai do atordoamento fica firme por 1 turno próprio (`combat.stunImmunityTurns`); **Levantar** como ação de qualquer integrante da equipe (gasta o turno, 15% do HP), sem valer para inimigos; Primeiros socorros da Sakura (35%); IA por valor útil (não desperdiça golpe forte em alvo quase caído, dá valor a efeitos, usa controle em área e o Kuchiyose, não reaplica controle); moveset de 6; 60 ryō iniciais.

Decidido sozinho (o usuário revisa): Levantar com 15% do HP; Primeiros socorros com 35%, 6 de chakra e espera 2; trava de 1 turno e só para o atordoamento (o bloqueio de chakra não tem); chances de atordoar das técnicas com dano × 0,8 arredondado (50→40, 45→35, 40→30, 35→30, 30→25, 25→20, 20→15, 15→10), controle puro igual; quem cai pelo roteiro (Iruka, Sasuke contra o Haku) não pode ser levantado naquela luta; suporte sem técnica levanta o protagonista sempre e outro suporte só com 40% do HP ou mais; ninguém levanta se um golpe encerra a luta; pesos da IA (derrubar soma a ameaça do alvo, bloqueio de chakra vale metade do atordoar, tático dá 1,5× ao controle puro, custo de chakra de 0,3 a 0,8 por ponto conforme o chakra que sobra); botões mais baixos na luta com 5 ou 6 técnicas.

Simulação (`npm run sim:jornada -- 300 2`), v0.68.1 → v0.69.0, Médio/Difícil/Hardcore: História 82/37/11 → 90/60/27; Comum 62/21/5 → 70/35/9; prodígio 69/28/9 → 77/39/11; Uchiha 60/21/6 → 66/26/9; Hyuuga 63/22/5 → 72/33/6. Fácil não muda (98–100%). **O jogo ficou mais fácil nos dois modos**, e nada foi compensado. De onde vem: sem os 60 ryō (mesma versão, `startRyo: 0`), Médio/Difícil ficam em História 86/60, Comum 68/26, prodígio 73/27, Uchiha 61/22, Hyuuga 68/25. Ou seja, no Caminho Ninja quase todo o ganho do Difícil vem dos 60 ryō (kit ou relíquia a mais no começo); na História, o salto do Difícil (37 → 60) vem das regras de combate (equipe que se levanta e IA que não desperdiça). A redução das chances de atordoar quase não pesa (com as chances antigas: História 90/64, Comum 69/38). Alavancas para o usuário escolher: força dos inimigos por dificuldade (`enemyStrength`, `storyStrength`), HP do Levantar, ryō inicial só na História.

Dois testes de roteiro que jogam a luta inteira com a IA trocaram de semente (Gaara e Kimimaro): o cenário do teste (Naruto sem talentos) já vencia o Gaara em só 4 de 30 sementes antes; agora 2 de 30. Não é o cenário de uma run real, mas mostra que a luta solo do Gaara ficou um pouco mais dura com o atordoamento de 2 turnos do Caixão de areia.

## Óculos de aviador do Naruto (v0.68.1, 13/11/2026)

Pedido do usuário: o Naruto começa com os **óculos de aviador**, que viram a **Bandana do Iruka** depois da Formatura e são mais fracos que ela. Decidido sozinho (o usuário revisa): os números dos óculos (+5 de HP máximo e +10% de dano abaixo de 50% do HP, metade da bandana em cada efeito, mantendo a mesma família de bônus para a troca parecer evolução); a troca acontece nas duas escolhas da Formatura (efeito de evento `storyRelic`, campo `storyEvolves`); id novo `aviatorGoggles`, porque `goggles` já é a relíquia comum Óculos de aprendiz; a evolução passou a somar ao HP atual só a diferença para a relíquia que saiu (antes o Colar somava os 20 inteiros por cima dos 10 da bandana); saves antigos com a bandana ficam com ela. Simulação da História (`npm run sim:jornada -- 300 2`), antes → depois: Fácil 100 → 100%, Médio 82 → 82%, Difícil 37 → 37%, Hardcore 12 → 11%. Só a luta com o Mizuki usa os óculos, então quase nada muda.

## A jornada do Naruto: cronologia categorizada (v0.68.0, 13/11/2026)

Pedido do usuário: as diretrizes "Jornada do Naruto" (a História é a jornada dele, não uma enciclopédia do mangá; entra o que ele vive, presencia ou descobre; eventos categorizados). Comparado com a cronologia anterior e adaptado com o usuário ponto a ponto:
- **Categorias**: presenciado sem escolha e narrativo com escolha.
- **Quarteto do Som**: as separações viram cenas.
- **Tanzaku**: o Kabuto é o chefe; os Sannin são presenciados.
- **Kimimaro**: o Lee chega e o Naruto segue.
- **Gaara**: luta em três fases.
- **Neji**: a promessa à Hinata dá determinação na luta.
- **Rasengan**: três treinos.
- **Cenas**: todas as novas entram.
- **O que sai**: o ataque ao hospital (o Naruto não estava lá) e a emboscada no lago.

Antes disso, também com o usuário:
- o Iruka cai protegendo o Naruto no Mizuki;
- o teste do sino vira derrota inevitável, que libera a raiz dos Laços;
- o encontro com o Haku na floresta;
- o Sharingan do Sasuke como marco;
- os mercenários do Gatō dentro da luta do Haku.

A fonte única é [cronologia.md](jornada/cronologia.md). Motor: categoria de evento, derrota inevitável, formas com modificadores, ação `leave`, reserva com repetição, e a migração de save pelo id da parada (`withJourney`).

Decidido sozinho: as recompensas das cenas e treinos novos (+1 ponto, kits, XP), as falas e textos, as fichas do Iruka, dos mercenários e do Gaara exausto, e os limiares dos gatilhos.

Simulação (`npm run sim:jornada -- 1000 2`), vitória da História; o Caminho Ninja ficou idêntico:

| Versão | Fácil | Médio | Difícil | Hardcore |
|---|---|---|---|---|
| v0.67.0 (× 1,1) | 100 | 87 | 46 | 14 |
| v0.68.0 com × 1,1 | 100 | 95 | 70 | 40 |
| v0.68.0 com × 1,2 (escolhido) | 100 | 81 | 40 | 13 |
| v0.68.0 com × 1,3 (testado) | 100 | 61 | 14 | 3 |

Saíram 5 lutas de desgaste e as cenas dão cura, pontos e kits. O usuário escolheu × 1,2, que volta perto do equilíbrio da v0.67.0.

## A História canônica do Naruto (v0.67.0, 12/11/2026)

Pedido do usuário: a História fiel aos momentos fundamentais do mangá e divertida de jogar; a árvore decide como o Naruto cresce, nunca se o cânone acontece. Decidido com o usuário:
- Kyuubi quando o Sasuke cai (Haku), com o desmaio só narrativo;
- Gaara em fases numa luta só, com o Gamabunta aliado;
- Kuchiyose com sapo sorteado;
- Orochimaru como parada nova de resistir;
- Vale do Fim vencido com o Sasuke a 20%, e ele parte;
- sem a Ōdama Rasengan, que não pertence ao Naruto clássico;
- a força da História mantida em × 1,1.

O que entrou:
- **Motor**: ação `knock`, condição de marca nas regras, formas temporárias e com técnicas a mais, técnica sorteada (`roll`, pesos por talento), finalizador garantido na luta, e a IA fechando com o finalizador (concentra chakra se faltar).
- **Momentos** (tabela em [historia.md](jornada/historia.md#momentos-canônicos)):
  - o Kakashi solto contra o Zabuza, no lugar da Sakura;
  - o Sasuke cai e a Kyuubi desperta no Haku;
  - Orochimaru e o selo do Sasuke;
  - a Kyuubi contra o Neji;
  - Shukaku e Gamabunta;
  - o Rasengan como finalizador no Kabuto;
  - reforços em ondas contra o Kimimaro;
  - selo nível 2 contra o manto de uma cauda no Vale.
- **Marcos**: Kuchiyose (contrato com os sapos) e Rasengan (treino com o Jiraiya). A marca `kyuubiAwakened` vem do Haku.
- **Árvore do Naruto**: as raízes de Sapos, Kyuubi e Rasengan são dadas pela história. Os Sapos mexem no sorteio do Kuchiyose. O talento final do Rasengan é o Rasengan da Kyuubi. Os talentos finais ganharam marca na tela.
- **Migração de save**: a parada nova desloca o Exame, quem já passou do Haku ganha a marca da Kyuubi, e os nós que mudaram devolvem os pontos.

Decidido sozinho: os números das formas (Kyuubi × 1,25, manto de uma cauda × 1,35, selo × 1,3 por 4 turnos, selo nível 2 × 1,2), os pesos do Kuchiyose (girinos 30, Gamakichi 35, Gamatatsu 25, Gamabunta 10) e dos talentos dos Sapos, as fichas do Kakashi aliado, do Gamabunta e do Shukaku, os retratos desenhados do Gamabunta e do Shukaku, as falas (escritas por mim, sem transcrever o mangá), os limiares de cada gatilho, e a Sakura saindo para o Kakashi entrar (cada lado tem no máximo 3 lutadores).

Simulação (`npm run sim:jornada -- 1000 2`), vitória v0.66.0 → v0.67.0. O Caminho Ninja ficou idêntico.

| Run | Fácil | Médio | Difícil | Hardcore |
|---|---|---|---|---|
| História | 99 → 100 | 62 → **87** | 18 → 46 | 3 → 14 |

Testado à parte (500 runs): História × 1,18 → 100/69/20/2; × 1,24 → 100/49/5/0. O usuário preferiu manter × 1,1: a História fica acima do alvo, mais festiva.

## Roteiro de luta e marcos da história (v0.66.0, 12/11/2026)

Pedido do usuário: a História fiel aos acontecimentos fundamentais do mangá, separando progressão narrativa obrigatória de personalização. A proposta de arquitetura foi aprovada, e esta versão entra só com a infraestrutura, sem mudar o conteúdo (a História canônica será discutida antes da v0.67.0):
- **Roteiro de luta** (`src/core/jornada/script.ts`): regras "quando → faça" no dado da parada. Gatilhos: abertura, rodada, HP abaixo de X%, alguém caiu, técnica usada. Ações: fala, forma, entrar, trocar de lutador, curar, marca na run, fim roteirizado. O motor confere em pontos fixos (abertura, perda de HP, virada de rodada, depois da técnica) e cada regra dispara uma vez.
- **Formas** nas fichas (transformações); **finalizador** como condição de vitória.
- **Marcos da história** (`grants` na campanha) no lugar do `stageTechniques`: o Chidori do Sasuke migrou sem mudar nada. Efeito de evento novo `learn`.
- Os sinos do Kakashi ganharam falas pelo roteiro (prova do formato).

Decidido sozinho: o lutador que entra age a partir da rodada seguinte; quem entra pelo roteiro não vira membro da equipe; os marcos valem só na História; os textos das falas dos sinos.

Simulação (`npm run sim:jornada -- 1000 2`): idêntica à da v0.65.0 (as falas não mexem no combate).

## Jornada mais forte e classes niveladas (v0.65.0, 12/11/2026)

Pedido do usuário (item 12): tudo um pouco mais forte na Jornada, sobretudo a História, e o Hardcore acima do Difícil. Números escolhidos pelo usuário entre conjuntos simulados:
- força dos inimigos (`enemyStrength`) 98/120/136/136% → **100/125/140/150%** (Fácil/Médio/Difícil/Hardcore);
- multiplicador novo da História (`storyStrength`) **× 1,1** por cima da dificuldade;
- ajuste por classe (`jornada.hero.adjust`), pedido do usuário depois de ver o desnível: Comum +15 HP, +4 chakra, +1 taijutsu e +1 ninjutsu; Prodígio −10 HP e −3 taijutsu (alvo dele: perto de 70% no Médio); o ajuste do Hyuuga da v0.64.0 saiu (o −1 de taijutsu e −5 de HP testados anulavam o +1 e +5).

A curva é muito sensível: o Médio de 1,2 para 1,3, igual para tudo, derrubava a História para 77% e o Comum para 38% (300 runs). Por isso a História ganhou multiplicador próprio e as classes, ajuste próprio. O experimento com as fichas trocadas só na memória não recalculava o crescimento por nível; com o crescimento real, −4 de taijutsu levava o Prodígio a 56%, e o ajuste final ficou em −3.

Simulação (`npm run sim:jornada -- 1000 2`), vitória v0.64.0 → v0.65.0:

| Run | Fácil | Médio | Difícil | Hardcore |
|---|---|---|---|---|
| História | 100 → 99 | 92 → **62** | 60 → 18 | 54 → 3 |
| Comum | 98 → 98 | 62 → **60** | 26 → 22 | 21 → 7 |
| Prodígio | 100 → 100 | 95 → **70** | 65 → 29 | 60 → 8 |
| Uchiha | 100 → 99 | 72 → **61** | 29 → 19 | 22 → 4 |
| Hyuuga | 100 → 99 | 82 → **61** | 42 → 26 | 35 → 7 |

O Médio ficou todo no alvo (60–70%). O Hardcore ficou bem difícil (3 a 8%), dentro do que o usuário já aceitou para o modo.

## Origens e classes numa base só (v0.64.0, 12/11/2026)

Pedido do usuário (item 22, unificação completa com status derivados; item 10, tabelas geradas). As classes do Caminho Ninja saem do bloco `jornada` das origens (`src/data/lineages.ts`) e os status do protagonista vêm da fórmula `originScale` (ataques × 0,75, resistências × 0,7, HP e chakra × 1, speed + 1; crescimento por nível proporcional ao status inicial). Decidido sozinho: os números da fórmula (calibrados pela média dos protagonistas de antes), deixar de fora os personagens da História e as fichas de suporte, e a lore das origens sair da tabela para uma lista (a tabela agora é gerada).

Protagonistas antes → depois (HP, chakra, speed, tai/nin/gen, res. física/mental):
- Comum: 100, 30, 11, 9/9/4, 7/6 → 100, 32, 11, 9/9/3, 7/6
- Prodígio: 115, 22, 13, 12/0/0, 8/5 → 110, 22, 14, 13/0/0, 8/5
- Uchiha: 105, 32, 12, 10/12/8, 7/8 → 100, 28, 12, 7/9/9, 7/7
- Hyuuga: 105, 26, 12, 12/6/4, 8/7 → 100, 28, 13, 11/4/4, 7/7

Simulação (`npm run sim:origens -- --runs 1000 --seed 2`): o Roleta ficou idêntico. Jornada (`npm run sim:jornada -- 1000 2`), vitória v0.63.0 → v0.64.0 (a História não muda: os personagens dela são escritos à mão):

| Classe | Fácil | Médio | Difícil | Hardcore |
|---|---|---|---|---|
| Comum | 98 → 98 | 61 → 62 | 24 → 26 | 21 → 21 |
| Prodígio | 100 → 100 | 92 → 95 | 61 → 65 | 54 → 60 |
| Uchiha | 100 → 99 | 66 → **40** | 21 → 6 | 15 → 4 |
| Hyuuga | 100 → 100 | 81 → 74 | 41 → 30 | 34 → 25 |

O Uchiha da origem distribui os ataques por igual (10/12/13), e na Jornada as técnicas dele (Bola de Fogo, Sharingan) são de ninjutsu e taijutsu: com 7/9/9 o dano cai muito. O Hyuuga perdeu taijutsu e HP.

**Ajuste por classe** (escolhido pelo usuário entre as opções): o Uchiha volta ao perfil de antes (+5 HP, +4 chakra, +3 taijutsu, +3 ninjutsu, −1 genjutsu, +1 res. mental → 105, 32, 10/12/8, 7/8) e o Hyuuga ganha +1 taijutsu e +5 HP (105, 12/4/4). Vitória com o ajuste (Fácil/Médio/Difícil/Hardcore): Uchiha 100/72/29/22 (antes da base única 100/66/21/15) e Hyuuga 100/82/42/35 (100/81/41/34). O Uchiha passou um pouco do de antes porque o crescimento por nível agora vem da fórmula (taijutsu 1, ninjutsu 1,2, HP 8,4 por nível, contra 0,9, 1,1 e 7 da tabela antiga). Comum e Prodígio não mudam com o ajuste.

## Conquistas com ícone e avatar editável (v0.63.0, 12/11/2026)

Pedido do usuário (itens 18 e 16): ícone próprio por conquista, por enquanto desenhado por mim, e avatar escolhido entre os personagens jogáveis já liberados, em SVG por enquanto. Decidido sozinho: o ícone de cada conquista (as vitórias por origem usam o símbolo do clã; desenho novo do sino), o que libera cada avatar (origens jogadas ou vencidas no Roleta; na Jornada, Naruto, Uchiha, Hyuuga e o visual do Sasuke pelas conquistas) e onde ele aparece (Ficha do ninja do PC e topo do Registro ninja). Sem mudança de regra nem de balanceamento.

## Loja da Jornada: atualizar relíquias e maldição do mercador (v0.62.0, 12/11/2026)

Pedido do usuário (item 14): botão pago para atualizar as relíquias da loja, mais caro a cada uso; estoque novo e melhor a cada estágio; comprar não encarece; "cada compra encarece" vira efeito de um evento de má sorte, que sai por outro evento, por um item da loja ou no fim da run. Números propostos por mim e aprovados pelo usuário: Atualizar 20 ryō (+15 por uso, volta no estágio novo), pesos da prateleira 50/33/17 → 40/37/23 → 30/40/30, Amuleto de purificação 60 ryō, maldição +10% por compra, Sino do mercador (primeira atualização do estágio grátis). Decidido sozinho: os eventos novos (Mercador de mau agouro e Santuário na estrada) só no Caminho Ninja, porque a História tem eventos fixos; a maldição segue nos ciclos do infinito; as relíquias da prateleira anterior não voltam ao atualizar, se houver outras.

Simulação (`npm run sim:jornada -- 1000 2`), vitória v0.61.0 → v0.62.0. O bot compra a relíquia mais barata, não atualiza e escolhe a primeira opção dos eventos (aceita a barganha e se purifica):

| Run | Fácil | Médio | Difícil | Hardcore |
|---|---|---|---|---|
| História | 100 → 100 | 90 → 92 | 61 → 60 | 51 → 54 |
| Comum | 98 → 98 | 58 → 61 | 23 → 24 | 19 → 21 |
| Prodígio | 100 → 100 | 91 → 92 | 59 → 61 | 52 → 54 |
| Uchiha | 99 → 100 | 65 → 66 | 19 → 21 | 16 → 15 |
| Hyuuga | 100 → 100 | 80 → 81 | 39 → 41 | 32 → 34 |

Até 3 pontos a mais, quase tudo pelo fim do encarecimento por compra. Nada foi compensado.

## Decisões do usuário e cura depois da luta no Roleta (v0.61.0, 12/11/2026)

O usuário decidiu os itens parados de `decisoes.md`: loja com "atualizar relíquias" (14), base única de origens e classes (22), classes novas na Jornada como protagonistas e suportes (11), ícones próprios das conquistas (18), avatar com os personagens liberados (16), símbolos que faltam esperam as imagens dele (15), perfil fase 2 e 3 depois do 1.0 (8) e Pesos de treino como ativa do prodígio descartado (5). O que entrou nesta versão:
- **Cura depois da vitória** (decidido com o usuário): a cura total do Roleta passou do começo da luta para o fim da vitória. O que acontece entre as lutas chega na seguinte.
- **Akatsuki** (decidido com o usuário): o corte de metade do HP e do chakra volta a valer, porque a luta seguinte não cura mais.
- **Cupom do Ichiraku no Roleta** (efeito escolhido pelo usuário, número decidido sozinho): começa a luta com 20% de HP e de chakra acima do máximo, em vez de recuperar 10% depois da vitória. O excedente só se gasta: cura, regeneração, Concentrar e pílula param no máximo e não o tiram. A Jornada não mudou.
- **Código morto** (decidido com o usuário): saíram a roleta de recompensa (`applyRoletaReward`, `applyJackpot`, `rewardRelic`, `rewardTierFor`, `autoRoletaReward`, `roletaRewards`) e o rótulo "Recompensa comum/rara" da trilha e da dica da categoria, que virou "Relíquia da vitória".
- **XP da vitória na Jornada** (bug, decidido sozinho): a tela mostrava o XP sem os bônus de talentos e relíquias; agora mostra o ganho de verdade.

Simulação (`npm run sim:origens -- --runs 1000 --seed 2`), vence o 1º ciclo, v0.60.0 → v0.61.0:

| Origem | Médio | Difícil |
|---|---|---|
| Comum | 42 → 48 | 14 → 16 |
| Akimichi | 73 → 76 | 43 → 47 |
| Inuzuka | 73 → 74 | 36 → 41 |
| Prodígio | 85 → 85 | 60 → 63 |
| Uchiha | 32 → 40 | 10 → 11 |
| Hyuuga | 60 → 64 | 25 → 29 |
| Uzumaki | 68 → 71 | 32 → 35 |
| Senju | 85 → 87 | 58 → 61 |

O Cupom acima do máximo vale mais que a cura de 10% de antes, e a Akatsuki voltar a doer não chega a compensar. Nada foi compensado.

## Confiabilidade, acessibilidade e offline (v0.60.0, 11/11/2026)

Pedido do usuário: analisar o jogo como produto e escolher as melhorias. Escolhido: corrigir bugs que mudam a regra ou perdem dados, tirar do alcance só do mouse a informação que vive nas dicas, e cumprir o princípio de PWA offline. Balanceamento, visual e composição ficaram de fora (aguardam o usuário).

**Bugs de regra** (testes antes da correção; simulação `npm run sim:origens -- --runs 1000 --seed 2`):
- **Turno sem chakra no Roleta** (decidido sozinho, é bug): quando a técnica escolhida ficava sem chakra (a manutenção dos Portões cobra depois da escolha), o turno se repetia numa cópia: queimar e veneno doíam duas vezes, os efeitos perdiam 2 turnos, e a queda ou a Vontade do Fogo caíam na cópia. Agora concentra no mesmo turno.
- **Juventude do Prodígio** (decidido com o usuário): o +5% de crítico era somado na ficha e de novo na luta (10%). Agora 5%, como no doc e no texto da passiva. `youthCrit` saiu do `roleta/balance.ts`; vale `passives.youth.critBonus`.
- **Natureza silenciosa na Jornada** (decidido sozinho, é bug): o carregamento zerava a natureza de Hyuuga e Prodígio (sobra da v0.43.0, quando eles não tinham elemento); um F5 tirava a vantagem elemental de vez. Saves afetados recebem a da seed.

Simulação do Roleta, vitória no 1º ciclo (Médio / Difícil), antes → sem o turno repetido → com a Juventude em 5%:

| Origem | Médio | Difícil |
|---|---|---|
| Comum | 42 → 42 → 42 | 14 → 14 → 14 |
| Akimichi | 73 → 73 → 73 | 43 → 43 → 43 |
| Inuzuka | 73 → 73 → 73 | 36 → 36 → 36 |
| Prodígio | 85 → 86 → 85 | 62 → 66 → 60 |
| Uchiha | 33 → 33 → 32 | 10 → 10 → 10 |
| Hyuuga | 59 → 60 → 60 | 24 → 24 → 25 |
| Uzumaki | 66 → 67 → 68 | 31 → 31 → 32 |
| Senju | 85 → 85 → 85 | 58 → 58 → 58 |

Hardcore do Prodígio 47 → 46 → 44%; as outras células do Hardcore variam até 2 pontos. Nada foi compensado.

**Dados do jogador**: Hardcore liberado guardado no perfil (o histórico guarda só 100 runs); dado corrompido vai para `<chave>_backup` antes de ser sobrescrito; falha ao salvar a Jornada avisa; a Jornada antiga só é trocada quando a nova é salva; uma exceção numa tela mostra um aviso e volta ao Portão (antes a interface congelava). Detalhes em [perfil.md](base/perfil.md) e [jornada/run.md](jornada/run.md#salvamento).

## Rodadas antigas

Última rodada concluída: "rebalanceamento das origens"
 (27/10/2026) foi implementada na v0.18.0: 25% de HP e chakra por vitória, controles com tenacidade e vulnerabilidade, barreiras como escudo (ação de turno), ilusões de dano do Uchiha e Sharingan grátis, Possessão do Yamanaka, Gênio do Nara, Determinação mais forte e nerf do prodígio, Akimichi, Inuzuka e Uzumaki. Decisões tomadas junto: o Gênio é ativa com usos por luta (2, +1 nos níveis 4 e 7) e vale nas roletas de combate do jogador; o genjutsu de dano do Uchiha fere de verdade e o do Yamanaka é controle mental com autoferimento; controle em cadeia é contido pela tenacidade (cai por rodada), não por regra de chefe; a meta é não ter origens muito acima ou abaixo das outras.

Observação em aberto (não é mudança de design): na simulação, a fatia "nova técnica" da recompensa vale bem menos que as outras (sem ela, o comum vence ~20 pontos a mais). Vale discutir com o usuário antes de mexer.

Alvo da simulação (31/10/2026): o bot joga pior que um humano, sobretudo nas origens de kit complexo. Alvo do bot no **Médio: 60–70%**; Aburame, Nara, Yamanaka e Uchiha **50–60%**. Ajustes para chegar no alvo são propostos ao usuário com a tabela de antes e depois, nunca aplicados sozinhos.

Observação em aberto (v0.31.1): vilões 90/110/125/135% (Fácil/Médio/Difícil/Hardcore), manutenção dos dōjutsu 2 e Colônia 1 de chakra a cada 5 insetos. Campanha por origem (1000 runs, seed 2), Médio v0.31.0 → v0.31.1: Comum 87 → 73%, Nara 90 → 78%, Akimichi 88 → 73%, Yamanaka 86 → 73%, Aburame 57 → **30%**, Inuzuka 86 → 72%, prodígio 84 → 70%, Uchiha 79 → 61%, Hyuuga 84 → 70%, Uzumaki 90 → 81%. Difícil: de 17% (Uchiha) a 38% (Yamanaka, Uzumaki); Aburame 4%. Quase todas chegaram perto do alvo (60–70%); Nara (78%) e Uzumaki (81%) seguem acima, e o Aburame voltou a ficar bem abaixo (a Colônia mais fraca tirou o chakra que sustentava o Devorar). Nada foi compensado: decidir com o usuário. v0.31.2 (Devorar usa todos os insetos, deixa 40% presos e suga 5–20% do chakra máximo do vilão; bot devora também quando falta chakra para o Enxame): Aburame 30 → 37% no Médio, 4 → 6% no Difícil; as outras origens não mudam. Continua abaixo do alvo de kit complexo (50–60%); o usuário testou o Hardcore à mão e achou complicado. Próximo passo combinado: testar à mão antes de mexer de novo. v0.31.3 (Colônia passiva: 1 de dano a cada 2 insetos, até 6, e 1 de chakra a cada 5, até 3, por rodada; Enxame com 4 de dano fixo; Devorar não deixa os insetos se soltarem; Hardcore com a força do Difícil, 125%): Aburame 37 → 73% no Médio, 6 → 31% no Difícil, 0 → 4% no Hardcore. O Hardcore das outras origens subiu para 1–11% (era 0–7%). O Aburame agora está acima do alvo de kit complexo (50–60%), junto com Comum, Akimichi, Inuzuka e Yamanaka; Nara (78%) e Uzumaki (80%) seguem os mais altos. Consultar o usuário antes de mexer. v0.32.0 (Senju): 93% no Médio, 51% no Difícil, 12% no Hardcore, o mais forte de propósito, mas 1 ponto acima do teto combinado (~92%). A alavanca combinada é tirar a cura +25% da Força vital; não foi aplicada (consultar). v0.33.0 (kekkei genkai): quase nada muda na média por origem (Comum 73 → 76% no Médio; quem tem kekkei genkai é uma fatia pequena das runs). Não há linha própria na simulação para "com kekkei genkai". v0.34.0 (kit do prodígio): prodígio 68 → **91%** no Médio, 20 → 62% no Difícil, 1 → 29% no Hardcore. A Folha Furacão (2×9 por 2 de chakra desde o nível 1) e o Punho Bêbado pesaram muito: o prodígio virou a origem mais forte junto com o Senju (93%). Consultar o usuário: candidatos naturais são a Folha Furacão (dano 9 → 6, ou custo 2 → 4) e o Punho Bêbado (roleta ×0,5/×1/×1,5 sem o ×2). v0.34.2 (prodígio com Juventude, taijutsu pela metade e Punho Bêbado mais fraco; Quarteto do Som e Kabuto mais fortes; Mizuki sem se acovardar), Médio: Comum 69%, Nara 67%, Akimichi 61%, Yamanaka 70%, Aburame 60%, Inuzuka 61%, prodígio 91 → 75%, Uchiha 46%, Hyuuga 58%, Uzumaki 77%, Senju 86%. Difícil de 10% (Uchiha) a 37% (Senju); Hardcore de 1% a 10%. O Uchiha ficou abaixo do alvo de kit complexo (50–60%); prodígio, Uzumaki e Senju seguem acima. Consultar antes de mexer.

## Roteiro de contas

Roteiro de contas e progresso (combinado em 30/10/2026; a fase 1, o Laboratório `?teste` com `?seed=`, foi implementada na v0.27.0):
- **Fase 2, perfil local**: conquistas, Livro Bingo e estatísticas por origem implementados na v0.29.0 (`profile_v1`, [docs/base/perfil.md](docs/base/perfil.md)); falta desbloqueios/personalização (títulos, skins da roleta, nome do ninja; só cosméticos). A run continua só em memória (F5 reseta).

- **Fase 3, contas opcionais**: só para sincronizar o perfil local; o jogo segue jogável offline e sem conta. Usar um serviço com login pronto (Supabase ou Firebase, a decidir), nunca guardar senha. Pede política de privacidade (LGPD) e revisar o princípio "Sem backend". A Jornada (item 7), com progressão permanente, é o motivo principal para ter contas.

