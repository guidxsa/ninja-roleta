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
- `tests/docs.test.ts` confere que toda técnica do jogador está em `docs/tecnicas.md` e toda técnica de vilão em `docs/viloes.md`. Técnica nova sem linha no doc quebra o teste.
- Futuro: um script que gera as tabelas numéricas dos docs a partir dos dados.

## Mudanças de design pendentes

Combinado em 31/10/2026 (brainstorm com o usuário). Os números são rascunho: a simulação decide e o usuário faz o ajuste fino. Cada frente vira uma versão própria.

1. **Segredos que dependem das próximas versões** (entram com os itens 2 e 3, ver [docs/perfil.md](docs/perfil.md)): Vingador (Uchiha com raio), Espelhos de gelo (vencer o Haku com Gelo), Areia que protege (Areia + jinchuuriki), Princesa das Lesmas (Senju + lesma + Palma Curativa), Deus dos Shinobi (Senju com Madeira vence), Segundo Hokage (Senju com água principal vence), Domador de bijuu (desfazer o manto do Gaara com Madeira; o campo `cloakSuppressed` do resumo da luta já existe). As conquistas por origem passam a incluir o Senju (Mestre dos clãs vira 11).
2. **Kekkei genkai de natureza (v0.32.0)**: só para o potencial pleno com um par de elementos, por roleta (25%): Gelo (água + vento), Areia (terra + vento), Lava (fogo + terra), Tempestade (raio + água), Vapor (fogo + água), Explosão (terra + raio). Contam como o pai mais vantajoso no encontro de elementos. **Madeira** é exclusiva do Senju com terra + água (roleta de 30%). A reforma elemental em si (quantidade de elementos, potencial, foco do Treino) saiu na v0.30.0.
3. **Origem Senju** (lendária, peso 3, potencial elemental pleno, quantidade 1/2/3 = 40/40/20): status no formato do Uzumaki, um degrau acima (tai 11, nin 11, gen 6, res. 12/10, speed 10, HP 125, chakra 40; 97,5 pontos). Passivas: **Herdeiro do fundador** (+1 Vontade do Fogo) e **Força vital** (na 1ª vez abaixo de 30% do HP, 4% do HP máximo por rodada por 3 rodadas; curas recebidas +25%). Despertar: no nível 4, 5% por rodada e +2 de chakra por rodada; no nível 7, 2 vezes por luta. O Mokuton prende, drena e desfaz o manto de chakra.
5. **Ordem e decisões da revisão (31/10/2026)**: v0.30.0 (feita) reforma elemental + status por lore + ataques de nível 1; v0.31.0 Senju; v0.32.0 kekkei genkai **com a mecânica nova completa** (congelar, escudo de areia, derreter escudo, armadura de vapor, ignorar escudo, roubo de vida, desfazer o manto) + Madeira + segredos do item 1; v0.33.0 kit do prodígio (Folha Furacão no nível 1, Pesos de treino como ativa, Lótus Primária presa aos Portões no nível 4, Punho Bêbado no nível 4, Lótus Oculta com o 3º portão no nível 7; confirmar com o usuário antes). A quantidade de elementos é por roleta.
6. **Hyuuga**: sem técnica nova no nível 1. O kit é taijutsu básico + Selo dos Pontos Vitais (só com o Byakugan); a identidade é abrir o olho. A **Palma do Vácuo** (taijutsu de distância, só com o Byakugan) fica para uma futura **árvore de talentos por linhagem** (escolhas de técnica ao subir de nível), a desenhar junto com os kits de níveis 4/7 das outras origens.

Última rodada concluída: "rebalanceamento das origens"
 (27/10/2026) foi implementada na v0.18.0: 25% de HP e chakra por vitória, controles com tenacidade e vulnerabilidade, barreiras como escudo (ação de turno), ilusões de dano do Uchiha e Sharingan grátis, Possessão do Yamanaka, Gênio do Nara, Determinação mais forte e nerf do prodígio, Akimichi, Inuzuka e Uzumaki. Decisões tomadas junto: o Gênio é ativa com usos por luta (2, +1 nos níveis 4 e 7) e vale nas roletas de combate do jogador; o genjutsu de dano do Uchiha fere de verdade e o do Yamanaka é controle mental com autoferimento; controle em cadeia é contido pela tenacidade (cai por rodada), não por regra de chefe; a meta é não ter origens muito acima ou abaixo das outras.

Observação em aberto (não é mudança de design): na simulação, a fatia "nova técnica" da recompensa vale bem menos que as outras (sem ela, o comum vence ~20 pontos a mais). Vale discutir com o usuário antes de mexer.

Alvo da simulação (31/10/2026): o bot joga pior que um humano, sobretudo nas origens de kit complexo. Alvo do bot no **Médio: 60–70%**; Aburame, Nara, Yamanaka e Uchiha **50–60%**. Ajustes para chegar no alvo são propostos ao usuário com a tabela de antes e depois, nunca aplicados sozinhos.

Observação em aberto (v0.30.0): campanha por origem (1000 runs, seed 2), Médio, antes → depois da reforma elemental e dos status por lore: Comum 86 → 85%, Nara 85 → 70%, Akimichi 87 → 82%, Yamanaka 84 → 77%, Aburame 45 → **30%**, Inuzuka 84 → 82%, prodígio 77 → 82%, Uchiha 77 → 71%, Hyuuga 88 → 86%, Uzumaki 88 → 85%. Difícil: de 28% (Nara, Uchiha) a 54% (Uzumaki); Aburame 13 → 4%. Comparado ao alvo (60–70%; kits complexos 50–60%): Nara e Uchiha já estão perto; Comum, Hyuuga, Uzumaki, Akimichi, Inuzuka e prodígio seguem acima; o Aburame ficou bem abaixo (o bot ainda o subestima, mas 30% é longe demais). Nada foi compensado: o próximo passo é propor ao usuário (Aburame primeiro, e depois se o Médio sobe a força dos vilões ou se mexe por origem).

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