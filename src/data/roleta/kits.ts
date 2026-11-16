// Kits do Roleta (docs/roleta/combate.md#kits; docs/base/origens.md). Desde a v0.80.0, as 8 origens do sorteio voltam
// aos kits completos do clássico (passivas, várias ativas e o despertar dos níveis 4 e 7), adaptados ao combate de hoje.
// Os números ficam no `balance` da base (`passives`, `awakening`, `dojutsu`, `gates`, `expansion`, `pills`...) e em
// `roletaBalance`. Textos em strings/roleta.ts. Yamanaka, Aburame e Nara seguem guardados (fora do sorteio).

/** Passiva da linhagem no Roleta. */
export type RPassive =
  | 'determination' // Comum: +25% de XP; +1 no maior ataque por nível; Nunca desistir (nível 4)
  | 'genius' // Nara (guardado): vê a próxima ação do vilão
  | 'heavyBody' // Akimichi: taijutsu pela razão de peso
  | 'mindReading' // Yamanaka (guardado): o vilão tem −acerto
  | 'hive' // Aburame (guardado): o veneno do Enxame dói mais
  | 'duo' // Inuzuka: o cão bate junto
  | 'youth' // Prodígio: +crítico
  | 'trainedEyes' // Uchiha: imune a Medo
  | 'preciseFist' // Hyuuga: taijutsu ignora parte da resistência
  | 'vitality' // Uzumaki: recupera chakra e HP por rodada
  | 'vitalForce'; // Senju: abaixo de 30% do HP, regenera por algumas rodadas; curas rendem mais

/** Ativa da linhagem: grátis (não gasta o turno), uma ativa por turno. */
export type RActive =
  | 'effort'
  | 'expansion'
  | 'pills'
  | 'beast'
  | 'gates'
  | 'drunkenFist'
  | 'sharingan'
  | 'copy'
  | 'byakugan'
  | 'seal'
  // Guardadas com as linhagens fora do sorteio.
  | 'shadow'
  | 'mindTransfer'
  | 'plague';

export interface RKitActive {
  kind: RActive;
  /** Nível em que a ativa aparece (despertar). */
  minLevel?: number;
}

export interface RKit {
  passive: RPassive;
  actives: RKitActive[];
}

/** Linhagem → kit (null = Comum). */
export const roletaKits: Record<string, RKit> = {
  common: { passive: 'determination', actives: [{ kind: 'effort' }] },
  akimichi: { passive: 'heavyBody', actives: [{ kind: 'expansion' }, { kind: 'pills', minLevel: 7 }] },
  inuzuka: { passive: 'duo', actives: [{ kind: 'beast' }] },
  taijutsuProdigy: { passive: 'youth', actives: [{ kind: 'gates' }, { kind: 'drunkenFist', minLevel: 4 }] },
  uchiha: { passive: 'trainedEyes', actives: [{ kind: 'sharingan' }, { kind: 'copy' }] },
  hyuuga: { passive: 'preciseFist', actives: [{ kind: 'byakugan' }] },
  uzumaki: { passive: 'vitality', actives: [{ kind: 'seal' }] },
  senju: { passive: 'vitalForce', actives: [] },
  // Guardados (fora do sorteio desde a v0.52.0): os kits enxutos de antes, para o dado não se perder.
  nara: { passive: 'genius', actives: [{ kind: 'shadow' }] },
  yamanaka: { passive: 'mindReading', actives: [{ kind: 'mindTransfer' }] },
  aburame: { passive: 'hive', actives: [{ kind: 'plague' }] },
};
