# Ninja Roleta (nome provisório)

Jogo de browser de sessões curtas, movido a roletas, inspirado no universo ninja de Naruto.

> **Projeto de fã, sem fins lucrativos e sem afiliação oficial.**

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

## Modo de teste

Dois parâmetros na URL do protótipo, para testar e reproduzir bugs:

- `?seed=42`: fixa as roletas. A mesma seed dá a mesma sequência de sorteios.
- `?teste`: abre o **Laboratório** no lugar da roleta de origem. Ali se monta a ficha à mão (linhagem, afinidade, jinchuuriki, dificuldade, nível, status, técnicas extras e bolsa) e se escolhe uma luta avulsa contra qualquer vilão ou uma etapa da campanha para começar. A última montagem fica salva no aparelho. Runs do laboratório não entram no histórico.

Os dois combinam: https://guidxsa.github.io/ninja-roleta/?teste&seed=42

## Estrutura

```
docs        design do jogo (regras e números de cada sistema)
src/core    regras puras: roleta, origem, iniciativa, acerto, dano, elementos, combate
src/data    números de balanceamento, linhagens, técnicas, vilões, campanha, textos (PT-BR)
src/state   histórico de runs (localStorage injetável)
src/sim     jogador automático e executor de lutas/campanha
prototype   protótipo jogável (HTML + TS), usa o core real; arte em SVG original (prototype/art.ts)
public/img  imagens próprias opcionais que substituem os retratos (ver public/img/LEIAME.md)
public/audio  música de fundo (naruto_theme.mp3), embutida no protótipo pelo build
scripts     simulate.ts, build-prototype.ts
tests       testes do core
```

Todo número de balanceamento fica em `src/data/balance.ts` e nos arquivos de dados ao lado.

## Licença

MIT. Veja o arquivo [LICENSE](LICENSE).

## Versionamento

O jogo está em **0.x** (protótipo) e ainda longe do 1.0. Depois do `v0.9.0` vem o `v0.10.0`, depois `v0.11.0` e assim por diante; o número do meio pode passar de 9 quantas vezes for preciso.

- **Minor** (`v0.10.0` → `v0.11.0`): muda como se joga ou traz um sistema novo: mecânica, regra, origem ou vilão refeito, rebalanceamento de fórmulas, tela ou modo novo.
- **Patch** (`v0.10.0` → `v0.10.1`): ajuste ou complemento do que já existe: correção de bug, números, texto, documentação, polimento de interface, uma opção a mais numa tela ou na ferramenta de teste.

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
| v0.12.1 | README: aviso de projeto de fã mais curto. |
| v0.13.0 | Vilão sem chakra concentra com a mesma fórmula do jogador: 15% do chakra máximo (mínimo 1), no lugar dos +4 fixos. |
| v0.14.0 | Segunda fase dos vilões (Zabuza no último suspiro, Gaara como Shukaku, Orochimaru trocando de pele): o chakra volta na mesma fração do HP, sem baixar o que ele já tinha. |
| v0.15.0 | Visual novo do protótipo: tema claro e escuro que segue o aparelho, com paleta da vila da Folha; retratos desenhados dos vilões e do ninja (por linhagem, com marcas de jinchuuriki), símbolos dos clãs nas roletas e na ficha; ficha do vilão no mapa e na luta com passivas e técnicas; células de ataque com cor e ícone por elemento e tipo; condições de batalha com ícones; dicas ao passar o mouse ou segurar o dedo em técnicas, passivas, condições e status; nomes das roletas cabem nas fatias. Imagens próprias em `public/img/` substituem os retratos. |
| v0.16.0 | Botão de modo dia/noite (a escolha fica salva; sem escolha, segue o aparelho). Sons sintetizados no navegador, sem arquivos: cliques da roleta a cada fatia, batida ao parar, som bom, neutro ou ruim conforme o resultado, vitória e derrota. Música de fundo original em escala japonesa, ligada pelo botão de música. |
| v0.16.1 | Correção: o modo instantâneo virou um botão de ícone (⚡) no cabeçalho e não sobrepõe mais o título; em telas estreitas o título dá lugar só ao selo. |
| v0.16.2 | A barra superior fica só com os botões (instantâneo, dia/noite, som, música, ficha e histórico), centralizados; o título sai do cabeçalho. |
| v0.17.0 | Música de fundo trocada pela faixa `public/audio/naruto_theme.mp3`, tocada em loop pelo botão de música; o build embute o MP3 no HTML para o protótipo seguir em um arquivo só e offline. |
| v0.18.0 | Rebalanceamento das origens. Cada vitória devolve 25% do HP e do chakra. Controles com tenacidade (controle em cadeia fica difícil e volta ao normal aos poucos) e alvo controlado toma +25% de dano; atordoamento, pavor, confusão e tormento mais fortes. Barreiras viram escudos (ação de turno com pontos que absorvem dano por 3 rodadas; o elemento pesa no escudo), sem quebra de guarda. Uchiha com ilusões de dano (Ilusão da Dor, Tsukuyomi) e Sharingan sem gastar o turno; Yamanaka com Possessão (o vilão se fere) e status maiores; Nara com o Gênio (gira a roleta duas vezes e fica com a melhor); Determinação do comum com +25% de XP e +1 no maior ataque por nível; prodígio, Akimichi, Inuzuka e Uzumaki mais fracos. No Médio, as origens vão de 4%–97% de vitória para ~55%–80%. |
| v0.19.0 | Ativas de linhagem sem gastar o turno: Portões, Expansão e Byakugan viram escolhas grátis como o Sharingan e os Clones (Portões e Expansão já valem na rodada da ativação). Sem o modo Pavor do Sharingan: cada genjutsu aplica o próprio efeito. Todo controle (Aprisionado, Sono, Possessão, paralisia) dura +1 turno. Pavor também reduz as resistências física e mental do alvo em 25%. Na simulação, o jogador não fica mais em postura contra golpe carregado de vilão controlado. Campanha no Médio: 69% → 77% de vitórias. |
| v0.20.0 | Efeitos mentais sem dano (Aprisionado, Sono, Possessão, Pavor, Confusão, Tormento) sem turnos fixos: o 1º turno é garantido e, depois de cada turno, o alvo gira a roleta para se livrar. A chance cresce com o quadrado dos turnos até 100%, e a força do golpe (poder contra resistência, que antes dava os turnos) baixa a chance inicial e o crescimento. Sai o "+1 turno de controle": a Paralisia passa a 2 vezes fixas, e o Sono tem +1 de força. Na tela, as técnicas e as condições mostram a chance de fuga. Campanha no Médio estável (~77%). |
| v0.21.0 | Ativas para as linhagens que não tinham: Esforço do comum (+3 em tai/nin/gen por 3 rodadas; 1 uso por luta, +1 nos níveis 4 e 7), Fera de quatro patas do Inuzuka (speed +3, Dupla com 60% e Substituição com o cão como isca), Devorar do Aburame (a Colônia deixa insetos no vilão; Devorar drena 3 de chakra por inseto e o resto vira dano) e Transmissão mental do Yamanaka (cancela um golpe carregado e tira a vez do vilão). Na Possessão, o Yamanaka escolhe a técnica que o vilão usa em si mesmo, e o vilão paga o chakra dela. Campanha por origem no Médio: de 70%–84% para 76%–85% (o comum, de 70% para 76%). |
| v0.22.0 | Linhagens mais fundas. Cópia do Uchiha (ativa com o Sharingan, no turno ou junto com a reação), Byakugan que vê através da névoa e das ilusões e 64 Palmas do Hyuuga, Sombra costurada do Nara (mantém a prisão pagando chakra), Pílulas do clã do Akimichi (roleta de 3 pílulas), Forçar os portões do prodígio (roleta de risco, com 4º portão), Uzumaki com Selamento e Correntes de Chakra (os Clones saem do kit). Despertar de cada linhagem nos níveis 4 e 7. Novo evento Lição do clã. A versão do jogo aparece no rodapé. Campanha por origem no Médio: 74%–89%. |
| v0.22.1 | Correções: a técnica copiada pelo Sharingan aparece nos botões (e pode disputar); ativas grátis valem na mesma rodada (Tsukuyomi e Cópia com o Sharingan aceso agora) e a tela atualiza ações e números ao marcá-las; reações no turno do vilão não gastam o chakra reservado para a ação, o chakra nunca fica negativo e o ataque básico de custo 0 está sempre disponível; a Fera do Inuzuka tem 1 uso por luta (+1 no nível 7), acabando com as substituições infinitas. |
| v0.23.0 | Guru: charlatão cai para 20%, e o guru oferece 2 premium diferentes para o jogador escolher 1. Premium novas: Clones das Sombras (o ataque sai inteiro e 2 clones repetem os golpes com 35% do dano; +1 clone por nível) e Corpo Cintilante (age primeiro na 1ª rodada; o nível 2 dá +2 de speed). O Sapo deixa de dar penetração e passa a causar dano verdadeiro de 6% do HP máximo do vilão por ataque que acerta (+2% por nível). Campanha por origem no Médio: 76%–88%. |
| v0.24.0 | Aburame refeito: Enxame de golpes pequenos que prendem insetos (2 golpes de 4; +2 golpes e +1 de dano por nível), Colônia que drena 1 de chakra por inseto no fim de cada rodada, nova ativa Praga (dobra insetos e o teto por 3 rodadas) e Devorar como técnica de ninjutsu que custa 1 de chakra por inseto. Akimichi: Rolo Colossal com dano 20; Corpo pesado pela razão de peso (HP máximo) contra o vilão, só bônus, até ×1,3; Expansão aumenta o peso e libera até ×1,5. O ataque básico passa a se chamar Taijutsu básico, e os nomes taijutsu/ninjutsu/genjutsu aparecem por extenso. Menos contas na tela: as roletas e as dicas não mostram porcentagens, as técnicas mostram dano base e precisão base, e as descrições ficaram em palavras. Campanha por origem no Médio: 77%–88% (Aburame de 86% para 80%). |
| v0.25.0 | Aburame mais fraco: Enxame com 2 golpes de 4 (+2 de dano e +1 golpe por nível) e status de volta ao original. Ataques de vários golpes rolam acerto e crítico em cada golpe (um erro não para os seguintes), para o jogador e os vilões. Quem vence uma disputa com técnica de vários golpes agora bate todos os golpes, não só o primeiro. Passivas e itens com textos de habilidade; passivas que juntam várias mecânicas aparecem separadas; no card da luta, chips das passivas e dica com tudo ao passar no nome da linhagem; jinchuuriki formatado como na ficha. |
| v0.26.0 | Rebalanceamento de Nara, Aburame e Akimichi. Nara: sai a Sombra costurada e entra o Enforcamento por Sombra, ninjutsu do kit que só funciona com o vilão preso pela Imitação de Sombra e causa força do controle × 6 + ninjutsu − resistência física (não erra e não solta; +1 de força no nível 7). Aburame: Enxame com 1 de dano fixo por golpe e +2 golpes por nível (2/4/6), só para aplicar insetos; Devorar causa de 1% a 3% do HP máximo do vilão por inseto pela razão ninjutsu base ÷ resistência física (+0,5% no nível 7), sem drenar chakra e custando 1 de chakra a cada 2 insetos. Akimichi: Pílulas do clã só a partir do nível 7. |
| v0.27.0 | Modo de teste: `?seed=N` fixa as roletas (reproduz uma run ou um bug) e `?teste` abre o Laboratório, onde se monta a ficha à mão (linhagem, afinidade, jinchuuriki, dificuldade, nível, técnicas extras e bolsa) e se escolhe uma luta avulsa contra qualquer vilão ou a etapa da campanha onde começar. Runs do laboratório não entram no histórico. Roteiro de conquistas, perfil local e contas opcionais registrado no CLAUDE.md. |
| v0.27.1 | Laboratório: status editáveis (HP e chakra máximos, taijutsu, ninjutsu, genjutsu, speed e resistências); campo em branco segue a ficha montada, que aparece como dica. Versionamento: ajustes e complementos do que já existe sobem patch, não minor. |
| v0.28.0 |
| v0.29.0 | **Perfil** (botão 📜): abas Histórico, Conquistas, Livro Bingo e Origens. 48 conquistas em marcos, sorte e azar, estilo e segredos (easter eggs como "Uzumaki Naruto": Uzumaki + jinchuuriki + vento), com aviso ao liberar e os marcos do histórico liberados de volta. Livro Bingo com lutas, vitórias, derrotas e maiores golpes por vilão. Estatísticas por origem tiradas do histórico. Laboratório não conta. |
| v0.29.1 | Documentação reorganizada: `tecnicas.md` vira o catálogo único de técnicas, com a seção "Técnicas de linhagem" (entram 64 Palmas, os nomes da linha do Enxame, o Ataque do cão e o Selo explosivo) e as fórmulas do Enforcamento e do Devorar; `origens.md` fica só com identidade, passivas, ativas e despertar; marcos de nível sem lista repetida. Teste novo confere que toda técnica dos dados está no doc. Decisões da revisão das próximas versões (ordem, Hyuuga, alvo da simulação) no CLAUDE.md. |
| v0.30.0 | **Reforma elemental**: o sorteio gira a quantidade de elementos (Comum 1/2/3; Uchiha fogo + chance de um segundo; clãs, Hyuuga e Uzumaki 0/1/2; prodígio nenhum) e cada elemento, sem repetir. Não se aprende elemento novo na run (a fatia "Elemento secundário" saiu; o peso foi para "Nova técnica"). Potencial elemental: o Comum e o fogo do Uchiha começam com o básico e vão até o III; as origens de kit dedicado não começam com ele e param no II. O Treino ganha o foco elemental. Status de todas as origens redistribuídos pela lore. Ataques novos de nível 1: Sombra Cortante (Nara), Mão Expandida (Akimichi), Pétalas Ilusórias (Yamanaka) e Etiqueta Explosiva (Uzumaki). Histórico e Laboratório convertem o formato antigo. |
| v0.31.0 | **Aburame refeito**: o Enxame prende 2 insetos por acerto (+1 a cada 5 de ninjutsu a partir de 15), o crítico dobra e a Praga dobra; o teto vem do nível do Enxame (10/15/20, o dobro na Praga); depois da Praga o excesso fica, mas não cresce; rodada sem acerto do Enxame solta 2 insetos. A Colônia suga 1 de chakra a cada 2 insetos para o Aburame e, sem chakra no vilão, rói 1 de HP a cada 3 que faltaram. Devorar com a tabela pela metade (0,5% a 1,5% por inseto) e despertar +0,25% nos níveis 4 e 7. Corrige a disputa de ninjutsu que não prendia insetos. **Regeneração passiva de chakra**: todos recuperam 5% do máximo (mínimo 1) por rodada. Bot da simulação do Aburame melhorado. |
| v0.31.1 | Balanceamento: vilões mais fortes em toda a escada (Fácil 90%, Médio 110%, Difícil 125%, Hardcore 135%); manutenção do Sharingan e do Byakugan de 1 para 2 por rodada (com a regeneração, a de 1 se pagava sozinha); Colônia do Aburame rouba 1 de chakra a cada 5 insetos (era 1 a cada 2). |
| v0.31.2 | Aburame: o Devorar usa todos os insetos presos no dano, deixa 40% deles no vilão e suga chakra do vilão para o Aburame (5% a 20% do chakra máximo dele, pela quantidade de insetos). A prévia e o log mostram o chakra sugado e os insetos que ficam. |
| v0.31.3 | Aburame: a Colônia vira passiva com teto por rodada (os insetos roem 1 de HP a cada 2, até 6, e sugam 1 de chakra a cada 5, até 3); o Enxame causa 4 de dano fixo por golpe; a rodada do Devorar não solta insetos. Hardcore com a mesma força do Difícil (125%): a diferença são as passivas hardcore. |
| v0.32.0 | **Origem Senju** (lendária, peso 3): status no formato do Uzumaki um degrau acima (HP 125, chakra 40), potencial elemental pleno com 1/2/3 elementos (40/40/20). **Herdeiro do fundador**: +1 Vontade do Fogo. **Força vital**: abaixo de 30% do HP, regenera 4% por rodada por 3 rodadas (5% e +2 de chakra no nível 4; 2 vezes por luta no nível 7); curas recebidas +25%. Símbolo, retrato, Lição do clã e conquistas novas (Vontade do fundador, Segundo Hokage, Princesa das Lesmas). |
| v0.33.0 | **Kekkei genkai de natureza**: quem tem potencial elemental pleno e os dois elementos-pai gira uma roleta no sorteio (25%; Madeira 30%, só Senju). Gelo (congela), Areia (escudo no início da luta, Caixão e Funeral do Deserto), Lava (queima e derrete escudos), Tempestade (rajadas com prioridade e penetração), Vapor (envenena; Armadura de Vapor), Explosão (passa pelo escudo) e Madeira (cura com o dano e desfaz o manto de chakra). Linhas I/II/III e técnica de nível 4; no encontro de elementos contam como o pai mais vantajoso. Status novo: congelado. Conquistas: Vingador, Espelhos de gelo, Areia que protege, Deus dos Shinobi e Domador de bijuu. |
 Toda run tem uma seed (fica no histórico; `?seed=N` repete as roletas). Botão **Reportar** no cabeçalho: nota opcional + relatório pronto para copiar (versão, seed, link, ficha, estado da luta e as últimas linhas do log). Botão **Compartilhar** no fim da run: resumo estilo Wordle com o caminho em emojis, para colar no grupo. Design das próximas rodadas (conquistas, reforma elemental, Senju, kits de linhagem) registrado no CLAUDE.md. |

