# Decisões em aberto

O que espera o usuário. Um item por decisão; o histórico e os números completos estão no [registro.md](registro.md). Resolvido, o item sai daqui e a regra vai para o doc dela. Design que mudou antes do código também entra aqui, com o que falta implementar.

**Alvo do bot** (31/10/2026): no Médio, 60–70%; Aburame, Nara, Yamanaka e Uchiha 50–60%. O bot joga pior que um humano. Ajuste é proposto com a tabela de antes e depois, nunca aplicado sozinho.

## Balanceamento

1. **Roleta enxuto fora do alvo** (v0.52.0, `npm run sim:origens -- --runs 1000 --seed 2`, Médio): Comum 47%, Akimichi 76%, Inuzuka 82%, prodígio 88%, Uchiha 56%, Hyuuga 69%, Uzumaki 67%, Senju 84%. O Orochimaru é onde a maioria para. O Comum, que agora é 38% da roleta de origem, segue abaixo do alvo, e as linhagens de taijutsu e o Senju acima. Alavancas: peso do Comum, XP por luta, força do chefe, kits de taijutsu.
2. **Jornada fora do alvo em algumas classes** (v0.53.0, 1000 runs, seed 2; Médio/Difícil/Hardcore): História 93/61/55, Comum 61/27/23, prodígio 96/69/64, Uchiha 76/28/25, Hyuuga 85/53/48. O Uchiha subiu com o dōjutsu único (registro, v0.53.0) e está mais longe do alvo de 50–60%. O Comum entrou no alvo com a força dos inimigos em 1,2; a curva é íngreme e um multiplicador só não leva todos. Alavancas: ativas grátis (Portões e Byakugan pesam no prodígio e no Hyuuga), Portões, lutas e chefes da História. Falta combinar também o alvo da História.
3. **Modo infinito**: Jornada ×1,5 composto por ciclo, só no Hardcore (curva no registro, v0.51.0; rascunho). **Roleta perdeu a pressão**: com a raridade subindo por ciclo (v0.52.0), quem vence o 1º ciclo quase não cai (Médio, ciclos 2/3: Comum 42/42, prodígio 84/84); os vilões só crescem +30% por ciclo, somando. Alavanca natural: multiplicador composto, como na Jornada, ou raridade subindo mais devagar.
4. **Revisar o que foi decidido sozinho** da v0.36.0 à v0.51.0 (marcado "decidido sozinho" no registro): chefes solo do Caminho Ninja, números das relíquias e dos Portões, kits enxutos, esquiva, efeitos, Orochimaru do Roleta com 1 volta, fichas dos vilões novos.

## Design

5. **Pesos de treino como ativa do prodígio** (+3 de speed e +2 de taijutsu ao tirar): ficou de fora porque conflita com a relíquia Pesos de treino.
6. **Direção visual: avaliar o piloto** (v0.56.0, [visual.md](visual.md)). O usuário trouxe referências (pergaminho rasgado, nuvens, letra manuscrita, ilustração) e pediu a paleta antiga de volta; o Portão e a entrada da Jornada seguem a estrutura do mockup. Falta julgar o resultado. Decidido sozinho: as frases da citação, os itens da barra inferior, laranja e roxo nos cards, o desenho das nuvens e dos emblemas, a fonte Kalam, a Jornada antes do Roleta no Portão e quais paradas usam cada local. Aprovado: levar o estilo a trilha, mapa, luta, loja, ficha e árvore; os locais que faltam (Academia, Ponte das Ondas, Arena do Exame, Hospital, Tanzaku). **Imagens**: arte oficial liberada nos retratos e nas vagas de ilustração; faltam os arquivos do usuário (`public/img/LEIAME.md`). Até lá, valem o molde `ninjaPortrait` e os desenhos próprios.
7. **Jornada, o que falta**: versão suporte do prodígio, mais easter eggs por combinação, nomes das paradas com sabor ninja.
8. **Perfil**: fase 2 sem os cosméticos (títulos, skins da roleta); fase 3, contas opcionais só para sincronizar (Supabase ou Firebase, sem guardar senha, política de privacidade LGPD, rever o princípio "Sem backend").
9. **Idioma do código e dos commits**: não definido. Na prática, commits em PT-BR sem acentos (skill `lancar-versao`).
10. **Ferramenta (futuro)**: script que gera as tabelas numéricas dos docs a partir dos dados.
11. **Outras classes na Jornada** (pedido do usuário, futuro): Nara, Akimichi, Yamanaka, Aburame, Inuzuka, Uzumaki e Senju, com adaptações e lógicas novas de desbloqueio. Ordem sugerida pelo que já existe nos dados: Akimichi, Uzumaki, Inuzuka, Nara, Senju, Aburame, Yamanaka. Yamanaka, Nara e Aburame, que saíram do Roleta, podem entrar antes como suportes.
12. **Sugestões para discutir**: separar a força do Hardcore da do Difícil na Jornada (hoje iguais; a diferença é só a recuperação); o bot da Jornada usar kit de chakra; limite por estágio no treino e no tratamento da loja, hoje contidos só pelo preço.
13. **Desktop: avaliar a etapa 1 e escolher a próxima tela** (v0.57.0, [visual.md](visual.md#celular-e-desktop)). Feitos o combate, a trilha e o mapa da Jornada. Decidido sozinho: as faixas (600/900/1280), a largura de 1440px, a equipe à esquerda e os inimigos ao centro no combate widescreen, a grade de duas colunas com 3 ou mais aliados, e a tela que cabe na janela com só a trilha ou a carta rolando. Próximas, por ganho: Roleta, árvore, Portão, entrada da Jornada, modais e minigames.
