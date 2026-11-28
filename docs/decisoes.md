# Decisões em aberto

O que espera o usuário. Um item por decisão; o histórico e os números completos estão no [registro.md](registro.md). Resolvido, o item sai daqui e a regra vai para o doc dela. Design que mudou antes do código também entra aqui, com o que falta implementar. Números novos continuam a sequência (não reaproveitar um número que já saiu).

**Meta de vitória do bot** (17/11/2026, por origem ou classe, com ±5 de folga): **Fácil 90%, Médio 65%, Difícil 40%, Hardcore 15%**, nos três modos. Substitui o alvo antigo (Médio 60–70%, kits complexos 50–60%, Hardcore livre). O bot joga pior que um humano. Ajuste é proposto com a tabela de antes e depois, nunca aplicado sozinho.

**Revisão de 17/11/2026**: o usuário aceitou tudo o que estava marcado "decidido sozinho, para revisar" até a v0.88.3 e pediu manter as decisões como recomendadas ([registro](registro.md#revisão-geral-dos-três-modos-17112026)). Os itens abaixo são os que continuam abertos.

## Balanceamento

51. **Classe aleatória e o Comum sem o Sortear** (tarefa `modos-jornada`, 27/11/2026, [registro](registro.md#classe-aleatória-com-relíquia-27112026)). O usuário decidiu: a Classe aleatória sempre dá a relíquia extra, e o Sortear saiu do cardápio. Nada foi compensado. Fora de ±5: o **Comum escolhido** (agora sempre sem relíquia) fica em 30,7% no Difícil (meta 40); o **Hyuuga sorteado** sobe para 79% no Médio (já estava em 74); a Classe aleatória fica em 95,3% no Fácil. A guarda da meta (`check:meta`) continua medindo o Comum com a relíquia (o sorteio antigo), que não é mais o caminho do cardápio. Alavancas possíveis: devolver a relíquia ao Comum escolhido, trocar a relíquia da Classe aleatória por algo menor, ou passar a guarda a medir o Comum escolhido.

| Modo (vitória %, 300 runs, seed 2) | Fácil | Médio | Difícil | Hardcore |
|---|---:|---:|---:|---:|
| Comum, elemento sorteado + relíquia (o "Sortear" antigo) | 90,0 | 64,0 | 38,7 | 18,7 |
| Comum escolhido no cardápio, sem relíquia | 90,0 | 63,0 | 30,7 | 14,0 |
| Uchiha escolhido | 91,0 | 69,0 | 38,0 | 14,0 |
| Uchiha sorteado + relíquia | 95,0 | 68,0 | 40,3 | 19,3 |
| Hyuuga escolhido | 98,7 | 74,3 | 37,0 | 11,7 |
| Hyuuga sorteado + relíquia | 98,0 | 79,0 | 44,3 | 12,0 |
| Classe aleatória (a mistura das três) | 95,3 | 67,3 | 43,0 | 16,3 |

49. **Jornada na meta: conferir** (v0.95.0, [registro](registro.md#jornada-na-meta-90654015-v0950-17112026)). Tudo dentro de ±5, menos o Hyuuga no Fácil e no Médio (99 e 74). Para revisar: as alavancas decididas sozinho (força por dificuldade de cada tipo de run, Hardcore da História por estágio, status das classes) e o infinito, que quase não aperta.
38. **Os três modos contra a meta nova** (v0.88.3, 300 runs, seed 2; Fácil / Médio / Difícil / Hardcore):

    | Modo | Hoje | Fora da meta |
    |---|---|---|
    | Roleta (8 origens, v0.92.0) | 88–94 / 59–70 / 38–46 / 13–22 | Quase tudo dentro (item 40); fora por 6 a 7 pontos: Inuzuka e Uzumaki no Hardcore, Senju no Médio |
    | História | 100 / 72 / 50 / 1 | Fácil, Médio e Difícil acima; Hardcore 14 pontos abaixo (45% das runs caem no Haku) |
    | Caminho Ninja | 96–97 / 64–70 / 31–44 / 12–16 | Fácil acima; Difícil do Hyuuga (31) e do prodígio (34) |

    O Roleta entrou na meta com a reforma da v0.92.0 ([registro](registro.md#roleta-rápido-e-explosivo-v0920-17112026)); a Jornada, depois do bot novo (item 39), pela força por dificuldade (`storyStrength`, `enemyStrength`; o Difícil do Caminho Ninja pode ganhar tabela própria por estágio).
39. **Bot da Jornada mais inteligente**: compra de talentos por plano de build (não o mais barato), controle e ilusões no inimigo mais perigoso, gasto do chakra que sobra, proteção só com um aliado perto de cair, e uso das relíquias que hoje não fazem nada para ele (Pílulas de soldado, Contas de meditação, Pedra de chakra, Pergaminho dos mil, Selo de cliente, Colete acolchoado, Linha de sombra). Se mesmo assim valerem perto de zero, propor refazê-las.
41. **Ramos dominantes nas árvores** (v0.88.3): Punho Bêbado 98/85, Armas do clã 92/62, Oito Trigramas 87/58 e Estilo da Folha 86/64; diferença entre ramos no Difícil de 17 a 29 pontos. O padrão que se repete: a técnica de vários golpes barata ganha. No Naruto, Sapos e Rasengan chegam tarde. Vai para o estudo de árvore nova (item 45), não para mais um ajuste de número.
42. **Medida das relíquias do Roleta** (R2 do [diagnóstico 2](balanceamento/diagnostico-2.md)): quase todas medem entre −5 e +5, e a medida mistura o efeito da relíquia com o que a roleta sorteia depois. Refazer a medida junto com a roleta de relíquia nova (item 40).

## Design

40. **Roleta rápido e explosivo: conferir** (feito na v0.92.0 com a ficha aprovada; [registro](registro.md#roleta-rápido-e-explosivo-v0920-17112026), regras em [roleta/combate.md](roleta/combate.md#kits)). Para revisar: os números decididos sozinho na calibração (listados no registro) e o ritmo, já que as lutas ficaram entre 5 e 8 rodadas no Médio (Uzumaki e Akimichi perto de 8; a ficha pedia 3 a 6, e o chefe 6 a 8). Se quiser lutas mais curtas, a alavanca é o HP dos vilões (`villainPower`) junto com o dano das técnicas, nas mesmas proporções, para não mudar a vitória.
43. **Caminho Ninja: inimigos novos, conferir** (feito na v0.94.0 com as fichas aprovadas; [registro](registro.md#inimigos-novos-do-caminho-ninja-e-hyuuga-no-cânone-v0940-17112026)). Para revisar o que foi decidido na implementação: o chefe do Gatō sem os mercenários e com os guarda-costas mais fracos, o Pagamento extra no lugar da Ordem, a Karasu como lutador à parte, a relíquia rara no lugar (e não além) da de elite contra Itachi e Kisame, e os retratos provisórios.
44. **Hyuuga no cânone, conferir** (feito na v0.94.0 com a ficha aprovada). Byakugan como postura, Palma Suave que paga e fecha pontos, Palmas só com o Byakugan, Rotação que devolve 30%, chakra 40. Na simulação o Hyuuga caiu de 97/87/51 para 96/80/40 (Médio/Difícil/Hardcore), ainda acima da meta; o ajuste fino vem com o rebalanceamento (item 38). Para revisar: os limiares da IA para ligar e desligar a postura (40% e 15% do chakra).
45. **Árvore de talentos e controle de builds** (antes do rebalanceamento do v1.0.0, item 50): estudar um jeito mais divertido de montar a build, talvez uma nova organização da árvore. A rejogabilidade da História vem da variedade de talentos. Proposta em `docs/jornada/proposta-arvore.md`, para aprovar antes de implementar.
50. **Caminho até o v1.0.0** (decidido pelo usuário em 27/11/2026, [registro](registro.md#caminho-até-o-v100-27112026)). O v1.0.0 sai do staging quando o usuário sentir que há uma entrega completa, depois de um rebalanceamento feito com todas as mudanças abaixo já no jogo. Antes do 1.0, nesta ordem:
    1. **Plano visual**: lobby do Arcade e palco de combate com sprites, depois os pontos que sobraram (símbolos e legenda da roleta de linhagem, fundo da árvore por classe, composição do mapa do Caminho Ninja).
    2. **Harness**: as incongruências de processo (issues #51 a #55, #58, #60, #68 e #81), em paralelo ao visual.
    3. **Conceitos e incongruências narrativas da História**: revisão do usuário (item 47).
    4. **Árvore de talentos nova** (item 45), que absorve os ramos dominantes (item 41). Vem antes do rebalanceamento porque mexe na vitória.
    5. **Rebalanceamento final** contra a meta (itens 38, 39, 42, 44, 49 e 51).

    Depois do 1.0: personagens e classes novas (versão suporte do prodígio, item 7; outras classes, item 11; campanha do Sasuke, item 20), minijogos novos (item 46) e o perfil (item 8). Dos critérios antigos do README, o nome definitivo está cumprido (Ninshu Roots, 19/11/2026) e "campanha completa" vira a lista acima. **Para confirmar**: se "interface final em `src/ui`" e "textos prontos para tradução" ainda valem para o 1.0.
46. **Minijogos** (depois do v1.0.0, item 50): hoje Memória e Sequência de selos (os dois de selos) e Jokenpô. Propor 3 ou 4 de outro tipo, curtos e de um toque. Proposta em `docs/jornada/proposta-minijogos.md`.
7. **Jornada, o que falta**: **versão suporte do prodígio** (aprovada em 17/11/2026; entra depois do v1.0.0, item 50), mais easter eggs por combinação, nomes das paradas com sabor ninja.
20. **Campanha do Sasuke** (em desenvolvimento; depois do v1.0.0, item 50): proposta em [jornada/historia-sasuke.md](jornada/historia-sasuke.md). Ainda aguarda revisão antes de qualquer implementação. `sasuke2.webp` fica reservada para ela. O avatar "Visual do Sasuke" (conquista `j_sasukeEgg`, que não dispara mais desde a v0.86.0) segue só nos perfis que já tinham e volta com essa campanha.
11. **Outras classes na Jornada** (em desenvolvimento; aprovado em 12/11/2026; depois do v1.0.0, item 50): Akimichi, Uzumaki, Inuzuka, Nara, Senju, Aburame e Yamanaka entram como protagonistas e suportes, uma por versão, nessa ordem. A ficha de cada uma (ramos, desbloqueio, parceiro) vai ao usuário antes. Nara, Yamanaka e Aburame estão fora do Roleta desde a v0.52.0 esperando por isso.
47. **Revisão dos eventos canônicos da História** (o usuário fará antes do v1.0.0, item 50, junto com os conceitos e as incongruências narrativas do modo): inclui conferir o arco Sannin (v0.58.0) e jogar a run inteira à mão.
8. **Perfil** (depois do 1.0, decidido em 12/11/2026): fase 2 sem os cosméticos (títulos, skins da roleta); fase 3, contas opcionais só para sincronizar (Supabase ou Firebase, sem guardar senha, política de privacidade LGPD, rever o princípio "Sem backend").
10. **Ferramenta**: as tabelas de status já são geradas dos dados (`scripts/doc-tables.ts`, v0.64.0); falta estender às outras tabelas numéricas dos docs.

### Visual: aguardando o teste do usuário

As decisões visuais foram aceitas em 17/11/2026; o que falta é o teste no aparelho e o julgamento do resultado.

37. **Retratos: auditoria por imagem base** (v0.90.0, aguardando as imagens do usuário; [lista](../prototype/lab/refs/LEIAME.md)): uma imagem por chave em `prototype/lab/refs/`, ajuste de um retrato por vez, conferindo na galeria `meta.portraits` do UI Lab. Os sprites novos aparecem como retrato de fúria (metade do HP ou menos, só visual); dizer se prefere outro gatilho (uma fala do roteiro, a fúria do chefe, uma técnica).
52. **Emoções nos ícones de personagem** (para depois). Diversificar as expressões dos retratos.
30. **Etapas visuais 1 a 4** (v0.72.0 a v0.76.0): falta o teste das etapas 1 e 2. Sobrou da etapa 0: cerca de 40 durações de animação fixas (o modo instantâneo não as alcança), o branco sobre as barras de HP e XP (2,4 a 3,4:1, com sombra de apoio) e cores soltas nos CSS de tela. Do combate: as confirmações nativas do modo Roleta e a dica própria nos ícones de estado.
48. **Retratos e símbolos que faltam**: Hinata, Tazuna, Ebisu, Ibiki, Itachi e Kisame aparecem só com o nome (Iruka, Kakashi e o Haku sem máscara ganharam desenho na v0.90.0). Símbolos de Hyuuga, Nara, Akimichi, Yamanaka, Aburame e Senju sem referência confiável. Cada um entra quando houver desenho ou imagem do usuário (`public/img/LEIAME.md`, `public/img/jornada/`).
16. **Casca do PC e Roleta no PC** (aguardando o teste local). Backlog: decidir se as imagens provisórias sobem para o jogo publicado ou ficam só locais; Registro só em popup; papel mais envelhecido e vagas de textura em `img/ui/`; cenas animadas (vídeo nas vagas de `cenas/`), com os modos Leve (padrão) e Animado.
17. **Celular: adotar a linguagem da casca do PC**: se o design do PC agradar, levar ao celular os pergaminhos, o popup do Registro e a direção de arte. O tablet em pé herda o visual do celular até lá.
25. **Proporções de tela: checklist no aparelho real** ([visual.md](visual.md#celular-e-desktop)):
    - [ ] Base: faixas, alvos de toque, janelas, piso de altura (a página rola um pouco abaixo de 620px)
    - [ ] Arte dos cards: preenche o espaço, com os rostos no quadro, em cada tamanho (cards de modo, pôsteres, arcos, trilha)
    - [ ] Composição: nada se sobrepõe; o que sai quando falta espaço está na ordem certa
    - [ ] Início: tablet em pé (cena maior, modos lado a lado), tablet deitado (cards com a arte em cima), notebook baixo
    - [ ] Jornada: entrada, perspectiva (2 colunas no tablet), trilha, mapa e luta (técnicas 2 por linha na janela baixa)
    - [ ] Roleta: sorteio (roda pela altura, legenda em 3 colunas), mapa do ciclo, luta e fim
    - [ ] Modais, árvore e minigames
