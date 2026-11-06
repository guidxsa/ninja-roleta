// Kits enxutos do Roleta (docs/roleta/combate.md#kits): 1 passiva e 1 ativa simples por linhagem, mais as técnicas
// próprias (em techniques.ts). Os números ficam em `roletaBalance.kits`. Textos em strings/roleta.ts.

/** Passiva da linhagem no Roleta enxuto. */
export type RPassive =
  | 'determination' // Comum: +25% de XP; +1 no maior ataque por nível
  | 'genius' // Nara: vê a próxima ação do vilão
  | 'heavyBody' // Akimichi: +% de dano de taijutsu
  | 'mindReading' // Yamanaka: o vilão tem −acerto
  | 'hive' // Aburame: o veneno do Enxame dói mais (dobra na Praga)
  | 'duo' // Inuzuka: o cão bate junto
  | 'youth' // Prodígio: +crítico
  | 'trainedEyes' // Uchiha: imune a Medo
  | 'preciseFist' // Hyuuga: taijutsu ignora parte da resistência
  | 'vitality' // Uzumaki: recupera HP por rodada
  | 'vitalForce'; // Senju: abaixo de 30% do HP, regenera por algumas rodadas (1 vez por luta)

/** Ativa da linhagem: grátis (não gasta o turno), uma por turno, com usos por luta. */
export type RActive = 'effort' | 'shadow' | 'expansion' | 'mindTransfer' | 'plague' | 'beast' | 'gates' | 'sharingan' | 'byakugan' | 'seal';

export interface RKit {
  passive: RPassive;
  active?: RActive;
}

/** Linhagem → kit (null = Comum). */
export const roletaKits: Record<string, RKit> = {
  common: { passive: 'determination', active: 'effort' },
  nara: { passive: 'genius', active: 'shadow' },
  akimichi: { passive: 'heavyBody', active: 'expansion' },
  yamanaka: { passive: 'mindReading', active: 'mindTransfer' },
  aburame: { passive: 'hive', active: 'plague' },
  inuzuka: { passive: 'duo', active: 'beast' },
  taijutsuProdigy: { passive: 'youth', active: 'gates' },
  uchiha: { passive: 'trainedEyes', active: 'sharingan' },
  hyuuga: { passive: 'preciseFist', active: 'byakugan' },
  uzumaki: { passive: 'vitality', active: 'seal' },
  senju: { passive: 'vitalForce' },
};
