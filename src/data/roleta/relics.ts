import type { RelicDef, RoletaRelicEffect } from '../../core/jornada/relics';

// Relíquias no Roleta enxuto (docs/jornada/reliquias.md#modos e docs/roleta/run.md#relíquias). O catálogo é um só
// (src/data/relics.ts): as da Jornada que fazem sentido num lutador só ganham aqui o efeito no Roleta (números
// próprios); as exclusivas do Roleta são os antigos itens permanentes e as invocações.

/** Efeito no Roleta das relíquias da Jornada que também saem nele (id da Jornada → efeito). */
export const roletaEffects: Record<string, RoletaRelicEffect> = {
  // Comuns
  goggles: { accuracyBonus: 0.05 },
  leafHeadband: { stats: { hp: 10 } },
  kunaiPouch: { typeDamageMult: { taijutsu: 1.08 } },
  // Pesos de treino: no Roleta, a mecânica de equipar e tirar (na Jornada, +2 de speed).
  trainingWeights: { weights: true },
  soldierPills: { stats: { chakra: 4 } },
  steelWire: { dodgeBonus: 0.03 },
  trainingLog: { xpMult: 1.15 },
  wornSandals: { stats: { speed: 1 } },
  whetstone: { critBonus: 0.03 },
  chakraCandy: { startChakraPct: 0.1 },
  // Incomuns
  ichirakuCoupon: { afterWinHealPct: 0.1 },
  handWraps: { typeDamageMult: { taijutsu: 1.1 } },
  herbPouch: { regenPct: 0.02 },
  tornHeadband: { lowHpDamageMult: 1.2 },
  // Raras
  kakashiBell: { critBonus: 0.08 },
  explosiveTags: { openingDamage: 10 },
  sandGourd: { startShieldPct: 0.1 },
  // Contrato dos sapos: no Roleta, a invocação do sapo (na Jornada, +15% de ninjutsu).
  toadContract: { summon: 'toad' },
  chakraStone: { chakraDiscount: 1 },
  masterKunai: { damageMult: 1.08 },
  dreamIncense: { typeDamageMult: { genjutsu: 1.2 } },
  reserveChakra: { startChakraPct: 0.25 },
  vitalScroll: { stats: { hp: 20 } },
  // Chefe (baú do chefe)
  willOfFireCharm: { grant: { revives: 1 } },
  eightTrigramSeal: { regenPct: 0.03 },
  chakraBlade: { damageMult: 1.15 },
  samuraiArmor: { startShieldPct: 0.2 },
  phoenixFeather: { surviveOnce: true },
  chakraCore: { stats: { chakra: 8 } },
  warBanner: { critBonus: 0.08 },
  kageRobe: { dodgeBonus: 0.05, accuracyBonus: 0.05 },
};

/** Exclusivas do Roleta: os antigos itens permanentes e as invocações que faltavam. */
export const roletaOnlyRelics: RelicDef[] = [
  { id: 'ninjaTool', tier: 'common', modes: ['roleta'], roleta: { flatDamage: 2 } },
  { id: 'speedAmulet', tier: 'common', modes: ['roleta'], roleta: { stats: { speed: 2 } } },
  { id: 'resistanceAmulet', tier: 'uncommon', modes: ['roleta'], roleta: { stats: { physical: 3, mental: 3 } } },
  { id: 'snakeContract', tier: 'rare', modes: ['roleta'], roleta: { summon: 'snake' } },
  { id: 'slugContract', tier: 'rare', modes: ['roleta'], roleta: { summon: 'slug' } },
];
