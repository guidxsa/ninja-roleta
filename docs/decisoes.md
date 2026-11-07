# Decisões em aberto

O que espera o usuário. Um item por decisão; o histórico e os números completos estão no [registro.md](registro.md). Resolvido, o item sai daqui e a regra vai para o doc dela. Design que mudou antes do código também entra aqui, com o que falta implementar.

**Alvo do bot** (31/10/2026): no Médio, 60–70%; Aburame, Nara, Yamanaka e Uchiha 50–60%. O bot joga pior que um humano. Ajuste é proposto com a tabela de antes e depois, nunca aplicado sozinho.

## Balanceamento

1. **Roleta enxuto fora do alvo** (v0.47.1, `npm run sim:origens -- --runs 1000 --seed 2`, Médio): Comum 35%, Nara 42%, Akimichi 70%, Yamanaka 49%, Aburame 63%, Inuzuka 75%, prodígio 85%, Uchiha 47%, Hyuuga 56%, Uzumaki 59%, Senju 77%. O Orochimaru é onde a maioria para. Alavancas: XP por luta ou ciclo mais longo, força do chefe, kits de taijutsu, força dos vilões, esquiva, Portões, Dupla, fração de resistência 0,4.
2. **Jornada fora do alvo em algumas classes** (v0.51.0, 1000 runs, seed 2; Médio/Difícil/Hardcore): História 93/61/55, Comum 61/27/23, prodígio 96/69/64, Uchiha 69/26/22, Hyuuga 85/50/42. O Comum entrou no alvo com a força dos inimigos em 1,2; a curva é íngreme e um multiplicador só não leva todos. Alavancas: ativas grátis (Portões e Byakugan pesam no prodígio e no Hyuuga), Portões, lutas e chefes da História. Falta combinar também o alvo da História.
3. **Modo infinito**: Jornada ×1,5 composto por ciclo, só no Hardcore (curva no registro, v0.51.0; rascunho); Roleta 0,3 por ciclo, somando. O Roleta não foi mudado: decidir se segue o mesmo modelo.
4. **Revisar o que foi decidido sozinho** da v0.36.0 à v0.51.0 (marcado "decidido sozinho" no registro): chefes solo do Caminho Ninja, números das relíquias e dos Portões, kits enxutos, esquiva, efeitos, Orochimaru do Roleta com 1 volta, fichas dos vilões novos.

## Design

5. **Pesos de treino como ativa do prodígio** (+3 de speed e +2 de taijutsu ao tirar): ficou de fora porque conflita com a relíquia Pesos de treino.
6. **Retratos dos personagens**: desenho próprio em SVG para os cerca de 20 principais no lugar do molde `ninjaPortrait` (`prototype/art.ts`); arte opcional em `public/img/jornada/<id>.webp`. Combinar antes de começar.
7. **Jornada, o que falta**: versão suporte do prodígio, mais easter eggs por combinação, sprites, nomes das paradas com sabor ninja.
8. **Perfil**: fase 2 sem os cosméticos (títulos, skins da roleta); fase 3, contas opcionais só para sincronizar (Supabase ou Firebase, sem guardar senha, política de privacidade LGPD, rever o princípio "Sem backend").
9. **Idioma do código e dos commits**: não definido. Na prática, commits em PT-BR sem acentos (skill `lancar-versao`).
10. **Ferramenta (futuro)**: script que gera as tabelas numéricas dos docs a partir dos dados.
