# Decisões em aberto

O que espera o usuário. Um item por decisão; o histórico e os números completos estão no [registro.md](registro.md). Resolvido, o item sai daqui e a regra vai para o doc dela. Design que mudou antes do código também entra aqui, com o que falta implementar.

**Alvo do bot** (31/10/2026): no Médio, 60–70%; Aburame, Nara, Yamanaka e Uchiha 50–60%. O bot joga pior que um humano. Ajuste é proposto com a tabela de antes e depois, nunca aplicado sozinho.

## Balanceamento

1. **Roleta enxuto fora do alvo** (v0.47.1, `npm run sim:origens -- --runs 1000 --seed 2`, Médio): Comum 35%, Nara 42%, Akimichi 70%, Yamanaka 49%, Aburame 63%, Inuzuka 75%, prodígio 85%, Uchiha 47%, Hyuuga 56%, Uzumaki 59%, Senju 77%. O Orochimaru é onde a maioria para. Alavancas: XP por luta ou ciclo mais longo, força do chefe, kits de taijutsu, força dos vilões, esquiva, Portões, Dupla, fração de resistência 0,4.
2. **Jornada fácil para o bot** (v0.43.0, 1000 runs, seed 2; Médio/Difícil/Hardcore): História 98/69/60, Comum 79/28/26, prodígio 92/59/56, Uchiha 75/19/16, Hyuuga 85/35/30. Alvo da Jornada ainda não combinado. Alavancas: força dos inimigos, chakra e espera das ativas, chance dos clones segurarem o golpe, números dos Portões, levantar com menos HP, menos ponto de talento na elite.
3. **Fatias do modo infinito**: Jornada `infinite.enemyPerCycle` 0,4 (Uchiha e Hyuuga caem mais rápido; curva no registro, v0.44.0); Roleta 0,3 por ciclo. Ambas são rascunho.
4. **Revisar o que foi decidido sozinho** da v0.36.0 à v0.47.0 (marcado "decidido sozinho" no registro): chefes solo do Caminho Ninja, números das relíquias e dos Portões, kits enxutos, esquiva, efeitos, Orochimaru do Roleta com 1 volta, fichas dos vilões novos.

## Design

5. **Pesos de treino como ativa do prodígio** (+3 de speed e +2 de taijutsu ao tirar): ficou de fora porque conflita com a relíquia Pesos de treino.
6. **Retratos dos personagens**: desenho próprio em SVG para os cerca de 20 principais no lugar do molde `ninjaPortrait` (`prototype/art.ts`); arte opcional em `public/img/jornada/<id>.webp`. Combinar antes de começar.
7. **Jornada, o que falta**: versão suporte do prodígio, mais easter eggs por combinação, sprites, nomes das paradas com sabor ninja.
8. **Perfil**: fase 2 sem os cosméticos (títulos, skins da roleta); fase 3, contas opcionais só para sincronizar (Supabase ou Firebase, sem guardar senha, política de privacidade LGPD, rever o princípio "Sem backend").
9. **Idioma do código e dos commits**: não definido. Na prática, commits em PT-BR sem acentos (skill `lancar-versao`).
10. **Ferramenta (futuro)**: script que gera as tabelas numéricas dos docs a partir dos dados.
