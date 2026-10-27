# Ninja Roleta (nome provisório)

Jogo de browser de sessões curtas, movido a roletas, inspirado no universo ninja de Naruto.

> **Projeto de fã, sem fins lucrativos e sem afiliação oficial.** Naruto e seus personagens são propriedade de seus respectivos donos. Este repositório não usa imagens, músicas, logos ou textos oficiais; os nomes presentes nos dados são nomes de trabalho.

## Estado atual

Núcleo de regras (`src/core`) com testes, uma simulação em terminal para ajustar o balanceamento e um **protótipo jogável** em HTML (`prototype/`), feito só para visualizar o jogo: roletas animadas, eventos pré-luta, combate com barras de HP/chakra, inventário, recompensas, exame chunin e histórico de runs. Não é a interface final.

**Jogar no navegador (celular ou PC):** https://guidxsa.github.io/ninja-roleta/ — atualizado automaticamente a cada push no `master`.

## Comandos

```bash
npm install
npm test                                   # testes das regras (Vitest)
npm run typecheck                          # checagem de tipos
npm run sim -- --fights 2000 --seed 42     # simulação de balanceamento (--bare: sem eventos nem recompensas)
npm run sim:origens -- --runs 300          # campanha completa por origem, com eventos e recompensas automáticos
npm run proto                              # gera dist/prototipo.html (abre direto no navegador, funciona offline)
```

## Estrutura

```
docs        design do jogo (regras e números de cada sistema)
src/core    regras puras: roleta, origem, iniciativa, acerto, dano, elementos, combate
src/data    números de balanceamento, linhagens, técnicas, vilões, campanha, textos (PT-BR)
src/state   histórico de runs (localStorage injetável)
src/sim     jogador automático e executor de lutas/campanha
prototype   protótipo jogável (HTML + TS), usa o core real
scripts     simulate.ts, build-prototype.ts
tests       testes do core
```

Todo número de balanceamento fica em `src/data/balance.ts` e nos arquivos de dados ao lado.

## Licença

MIT. Veja o arquivo [LICENSE](LICENSE).

## Versionamento

O jogo está em **0.x** (protótipo) e ainda longe do 1.0. Depois do `v0.9.0` vem o `v0.10.0`, depois `v0.11.0` e assim por diante; o número do meio pode passar de 9 quantas vezes for preciso.

- **Minor** (`v0.10.0` → `v0.11.0`): mecânica nova, mudança de regra, tela nova.
- **Patch** (`v0.10.0` → `v0.10.1`): correção de bug, ajuste só de números, texto ou documentação.

O **v1.0.0** fica para quando o jogo estiver completo para quem joga:

- interface final em `src/ui` no lugar do protótipo;
- PWA instalável e offline (manifest + service worker);
- nome definitivo;
- campanha completa e balanceada, com todos os sistemas dos `docs/` implementados;
- textos visíveis em arquivos de strings, prontos para tradução.

## Histórico de versões

| Versão | O que mudou |
|---|---|
| v0.1.0 | Núcleo de regras (roleta, origem, iniciativa, acerto, dano, elementos, combate), testes e simulação de balanceamento. |
| v0.2.0 | Progressão (estágios de status, itens, encontros, jokenpô), eventos pré-vilão, novos vilões e textos PT-BR. |
| v0.3.0 | Protótipo jogável em HTML com roletas animadas, combate, inventário, recompensas e histórico de runs. |
| v0.3.1 | Licença MIT e histórico de versões no README. |
| v0.4.0 | Balanceamento: sistema de nível com roleta de status, taijutsu sem custo de chakra, ninjutsu médico, chakra dos vilões, invocações passivas (sapo, cobra com veneno, lesma) e Akatsuki dá crítico a quem não é jinchuuriki. |
| v0.5.0 | Nível por XP (cada vilão dá XP pela dificuldade, nível máximo 10), dificuldade fácil/médio/difícil, ficha ninja com retrato e bolsa de itens, visual com tema ninja e skills do projeto (nova mecânica, lançar versão). |
| v0.6.0 | Genjutsu não causa dano: aprisiona o alvo por 1 a 3 turnos conforme a proficiência. Subir de nível restaura HP e chakra (terminar luta não restaura). Técnicas elementais só do próprio elemento (correção). Amuletos de speed e resistência na bolsa. XP um pouco mais lento. Linhagem especial 20% e jinchuuriki 10%. |
| v0.6.1 | Protótipo publicado no GitHub Pages (https://guidxsa.github.io/ninja-roleta/) via GitHub Actions. |
| v0.7.0 | Linhagens reformuladas: status iniciais por linhagem, Sharingan (ativável, evolui com o nível, resistência a genjutsu) e Byakugan (golpes não erram, golpe inibidor de chakra). Skill set por categoria com abas na luta, taijutsu fortalecido que gasta chakra, técnicas aprendidas nos níveis 4 e 7. Só o Uchiha começa com genjutsu. Passivas de vilões: Gaara jinchuuriki, Kabuto médico, Orochimaru com cobras. Simulação por origem (`npm run sim:origens`). |
| v0.8.0 | Jogabilidade: origem numa roleta só (50% comum), linhagens rebalanceadas, portões que evoluem com o taijutsu (custam chakra e HP, gastam o turno), dōjutsu dura 5 rodadas, jinchuuriki com manto de chakra e imunidade a genjutsu. Efeitos negativos (paralisia, atordoamento, queimadura, envenenamento, sangramento). Passivas novas para todos os vilões, com versões do modo Hardcore (125%, libera após vencer no Difícil). Nível sem roleta (HP/chakra por dificuldade), iniciativa rolada uma vez por luta, crítico máximo de 50%, combos de taijutsu só do prodígio e taijutsu fortalecido como recompensa. Eventos novos: invocações, Akatsuki 70/30 e guru (técnica ou foco com crítico garantido). Haku antes do Zabuza. |
| v0.8.1 | Correções: o histórico de runs não revela mais a origem antes das roletas girarem; velhinha, ramen, derrota no jokenpô e guru charlatão agora definem quem ataca primeiro na próxima luta contra vilão, no lugar da roleta de iniciativa. |
| v0.9.0 | Design reorganizado em `docs/` e implementado: toda luta começa restaurada (subir de nível não restaura), nível sem limite com XP pela curva planejada, Determinação e Pergaminho de experiência. Origens numa roleta de três níveis (comum 30%, clãs 40%, raras 30%) com os clãs Nara, Akimichi, Yamanaka, Aburame e Inuzuka e status absolutos de 70 pontos. Ficha de técnica (precisão, golpes, crítico, penetração, efeito no acerto, prioridade) e catálogo novo, com Rotação e Clones das Sombras. Ações universais (Concentrar chakra, Substituição, Usar item), efeitos de genjutsu (Sono, Pavor, Confusão, Tormento), manto pago com chakra, golpe carregado, Palma Mística do Kabuto e Punho de Areia do Gaara. Bolsa de consumíveis, Moeda viciada, Pesos de treino, recompensa por raridade com escolha na lendária e exame com recompensa por vitórias. Simulação com eventos e recompensas automáticos. |
| v0.9.1 | Versionamento definido no README: a numeração segue em 0.x (v0.10.0, v0.11.0…) e o v1.0.0 tem critérios próprios. |
| v0.9.2 | Design (só docs): ficha única com resistências física e mental, reações (Resistir, Disputa, Barreira, Substituição), disputa de ninjutsu, elementos por encontro, níveis de técnica, premium do guru, novo Treino e restauração por nível e fim do exame. Implementação pendente. |
| v0.10.0 | Implementa a v0.9.2: ficha única e fórmula de dano para jogador e vilão, painel de reação no meio da rodada (Resistir, Disputa, Barreira, Substituição), postura defensiva, disputa de ninjutsu e quebra de guarda, elementos só em encontros, linhas de técnica com upgrades à escolha, barreiras, Armadura de Raio, premium do guru, Treino com roleta de destaque, HP carregando entre lutas e vilões recalibrados. |
| v0.11.0 | Ajustes de vilões e combate: Gaara no hardcore ganha a passiva Monstro (volta como Shukaku com golpes de monstro e manto permanente); marca da maldição com os valores do manto do jinchuuriki; Orochimaru revive até 1/2/3 vezes (fácil/normal/difícil), sem limite no hardcore, sempre com 50% do HP, e no hardcore não sofre crítico. Ataques de vários golpes (e os Espelhos do Haku) rolam acerto, crítico e reação uma vez para todos; Concentrar chakra recupera 15% do chakra máximo; o Foco do guru dá +25% de chance de crítico em vez de crítico garantido; Haku e Zabuza dão recompensa só no fim do bloco; tocar na roleta prossegue como o botão. |
| v0.12.0 | Substituição não gasta mais ação (continua custando 2 de chakra e 1 dos usos da luta) e pode ser usada mesmo devendo a ação por outra reação. Vale para jogador e vilão. |
