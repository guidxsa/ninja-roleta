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

1. **Segredos que dependem das próximas versões** (entram com o item 2, ver [docs/perfil.md](docs/perfil.md)): Vingador (Uchiha com raio), Espelhos de gelo (vencer o Haku com Gelo), Areia que protege (Areia + jinchuuriki), Deus dos Shinobi (Senju com Madeira vence), Domador de bijuu (desfazer o manto do Gaara com Madeira; o campo `cloakSuppressed` do resumo da luta já existe).
2. **Kekkei genkai de natureza (v0.33.0)**: só para o potencial pleno com um par de elementos, por roleta (25%): Gelo (água + vento), Areia (terra + vento), Lava (fogo + terra), Tempestade (raio + água), Vapor (fogo + água), Explosão (terra + raio). Contam como o pai mais vantajoso no encontro de elementos. **Madeira** é exclusiva do Senju com terra + água (roleta de 30%). A reforma elemental em si (quantidade de elementos, potencial, foco do Treino) saiu na v0.30.0.
5. **Ordem e decisões da revisão (31/10/2026)**: v0.30.0 (feita) reforma elemental + status por lore + ataques de nível 1; v0.31.x Aburame e balanceamento (feitas); v0.32.0 Senju (feita); v0.33.0 kekkei genkai **com a mecânica nova completa** (congelar, escudo de areia, derreter escudo, armadura de vapor, ignorar escudo, roubo de vida, desfazer o manto) + Madeira + segredos do item 1; v0.34.0 kit do prodígio (Folha Furacão no nível 1, Pesos de treino como ativa, Lótus Primária presa aos Portões no nível 4, Punho Bêbado no nível 4, Lótus Oculta com o 3º portão no nível 7; confirmar com o usuário antes). A quantidade de elementos é por roleta.
6. **Hyuuga**: sem técnica nova no nível 1. O kit é taijutsu básico + Selo dos Pontos Vitais (só com o Byakugan); a identidade é abrir o olho. A **Palma do Vácuo** (taijutsu de distância, só com o Byakugan) fica para uma futura **árvore de talentos por linhagem** (escolhas de técnica ao subir de nível), a desenhar junto com os kits de níveis 4/7 das outras origens.

Última rodada concluída: "rebalanceamento das origens"
 (27/10/2026) foi implementada na v0.18.0: 25% de HP e chakra por vitória, controles com tenacidade e vulnerabilidade, barreiras como escudo (ação de turno), ilusões de dano do Uchiha e Sharingan grátis, Possessão do Yamanaka, Gênio do Nara, Determinação mais forte e nerf do prodígio, Akimichi, Inuzuka e Uzumaki. Decisões tomadas junto: o Gênio é ativa com usos por luta (2, +1 nos níveis 4 e 7) e vale nas roletas de combate do jogador; o genjutsu de dano do Uchiha fere de verdade e o do Yamanaka é controle mental com autoferimento; controle em cadeia é contido pela tenacidade (cai por rodada), não por regra de chefe; a meta é não ter origens muito acima ou abaixo das outras.

Observação em aberto (não é mudança de design): na simulação, a fatia "nova técnica" da recompensa vale bem menos que as outras (sem ela, o comum vence ~20 pontos a mais). Vale discutir com o usuário antes de mexer.

Alvo da simulação (31/10/2026): o bot joga pior que um humano, sobretudo nas origens de kit complexo. Alvo do bot no **Médio: 60–70%**; Aburame, Nara, Yamanaka e Uchiha **50–60%**. Ajustes para chegar no alvo são propostos ao usuário com a tabela de antes e depois, nunca aplicados sozinhos.

Observação em aberto (v0.31.1): vilões 90/110/125/135% (Fácil/Médio/Difícil/Hardcore), manutenção dos dōjutsu 2 e Colônia 1 de chakra a cada 5 insetos. Campanha por origem (1000 runs, seed 2), Médio v0.31.0 → v0.31.1: Comum 87 → 73%, Nara 90 → 78%, Akimichi 88 → 73%, Yamanaka 86 → 73%, Aburame 57 → **30%**, Inuzuka 86 → 72%, prodígio 84 → 70%, Uchiha 79 → 61%, Hyuuga 84 → 70%, Uzumaki 90 → 81%. Difícil: de 17% (Uchiha) a 38% (Yamanaka, Uzumaki); Aburame 4%. Quase todas chegaram perto do alvo (60–70%); Nara (78%) e Uzumaki (81%) seguem acima, e o Aburame voltou a ficar bem abaixo (a Colônia mais fraca tirou o chakra que sustentava o Devorar). Nada foi compensado: decidir com o usuário. v0.31.2 (Devorar usa todos os insetos, deixa 40% presos e suga 5–20% do chakra máximo do vilão; bot devora também quando falta chakra para o Enxame): Aburame 30 → 37% no Médio, 4 → 6% no Difícil; as outras origens não mudam. Continua abaixo do alvo de kit complexo (50–60%); o usuário testou o Hardcore à mão e achou complicado. Próximo passo combinado: testar à mão antes de mexer de novo. v0.31.3 (Colônia passiva: 1 de dano a cada 2 insetos, até 6, e 1 de chakra a cada 5, até 3, por rodada; Enxame com 4 de dano fixo; Devorar não deixa os insetos se soltarem; Hardcore com a força do Difícil, 125%): Aburame 37 → 73% no Médio, 6 → 31% no Difícil, 0 → 4% no Hardcore. O Hardcore das outras origens subiu para 1–11% (era 0–7%). O Aburame agora está acima do alvo de kit complexo (50–60%), junto com Comum, Akimichi, Inuzuka e Yamanaka; Nara (78%) e Uzumaki (80%) seguem os mais altos. Consultar o usuário antes de mexer. v0.32.0 (Senju): 93% no Médio, 51% no Difícil, 12% no Hardcore, o mais forte de propósito, mas 1 ponto acima do teto combinado (~92%). A alavanca combinada é tirar a cura +25% da Força vital; não foi aplicada (consultar).

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