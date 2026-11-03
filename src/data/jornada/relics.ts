import type { RelicDef } from '../../core/jornada/relics';

// Relíquias (docs/jornada/reliquias.md). Comuns, raras e lendárias; o chefe oferece 3 lendárias.

export const relics: RelicDef[] = [
  // Inicial: toda run começa com ela; recupera a equipe depois de cada vitória.
  { id: 'ichirakuBowl', tier: 'starter', afterWinHealPct: 0.25 },
  // Comuns
  { id: 'goggles', tier: 'common', mods: { accuracyBonus: 0.05 } },
  { id: 'leafHeadband', tier: 'common', stats: { hp: 10 } },
  { id: 'frogWallet', tier: 'common', ryoMult: 1.25 },
  { id: 'kunaiPouch', tier: 'common', mods: { taijutsuFlat: 2 } },
  { id: 'ichirakuCoupon', tier: 'common', afterWinHealPct: 0.1 },
  { id: 'trainingWeights', tier: 'common', stats: { speed: 2 } },
  { id: 'soldierPills', tier: 'common', stats: { chakra: 6 } },
  { id: 'medKit', tier: 'common', grant: { items: { hpKit: 2, chakraKit: 1 } } },
  { id: 'handWraps', tier: 'common', mods: { typeDamageMult: { taijutsu: 1.1 } } },
  { id: 'steelWire', tier: 'common', mods: { evasion: 0.05 } },
  { id: 'fieldCanteen', tier: 'common', allyHpPct: 0.1 },
  { id: 'herbPouch', tier: 'common', mods: { regenPct: 0.02 } },
  { id: 'blankSeals', tier: 'common', grant: { items: { chakraKit: 2 } } },
  { id: 'luckyCoin', tier: 'common', grant: { ryo: 60 } },
  { id: 'trainingLog', tier: 'common', xpMult: 1.15 },
  { id: 'merchantToken', tier: 'common', shopDiscount: 0.15 },
  // Raras
  { id: 'forbiddenScroll', tier: 'rare', mods: { extraClones: 1 } },
  { id: 'kakashiBell', tier: 'rare', mods: { critBonus: 0.1 } },
  { id: 'explosiveTags', tier: 'rare', openingDamage: 10 },
  { id: 'hakuMask', tier: 'rare', teamMods: { evasion: 0.06 } },
  { id: 'sandGourd', tier: 'rare', teamMods: { startShieldPct: 0.1 } },
  { id: 'toadContract', tier: 'rare', mods: { typeDamageMult: { ninjutsu: 1.15 } } },
  { id: 'revivalPills', tier: 'rare', grant: { items: { reviveKit: 2 } } },
  { id: 'tornHeadband', tier: 'rare', mods: { lowHpDamageMult: 1.25 } },
  { id: 'summoningScroll', tier: 'rare', mods: { startClones: 1 } },
  { id: 'warFan', tier: 'rare', teamMods: { typeDamageMult: { ninjutsu: 1.1 } } },
  { id: 'senbonCase', tier: 'rare', teamMods: { critBonus: 0.05 } },
  { id: 'storageSeal', tier: 'rare', grant: { items: { hpKit: 2, reviveKit: 1 } } },
  { id: 'chakraStone', tier: 'rare', mods: { chakraDiscount: 1 } },
  { id: 'warDrum', tier: 'rare', teamMods: { accuracyBonus: 0.05 } },
  { id: 'mastersJournal', tier: 'rare', grant: { talentPoints: 1 } },
  // Lendárias
  { id: 'hokageNecklace', tier: 'legendary', grant: { willOfFire: 1 } },
  { id: 'eightTrigramSeal', tier: 'legendary', mods: { regenPct: 0.04 } },
  { id: 'hokageHat', tier: 'legendary', teamMods: { damageMult: 1.15 } },
  { id: 'sanninBand', tier: 'legendary', allyHpPct: 0.25 },
  { id: 'gamabuntaPipe', tier: 'legendary', mods: { chakraDiscount: 2 } },
  { id: 'chakraBlade', tier: 'legendary', mods: { damageMult: 1.25 } },
  { id: 'samuraiArmor', tier: 'legendary', teamMods: { startShieldPct: 0.2 } },
  { id: 'heavenEarthScrolls', tier: 'legendary', grant: { talentPoints: 2 } },
  { id: 'eternalLotus', tier: 'legendary', teamMods: { regenPct: 0.03 } },
  { id: 'bottomlessPouch', tier: 'legendary', ryoMult: 1.5, shopDiscount: 0.25 },
  { id: 'phoenixFeather', tier: 'legendary', mods: { surviveOnce: true } },
];
