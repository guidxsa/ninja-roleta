import type { RelicDef } from '../../core/jornada/relics';

// Relíquias (docs/jornada/reliquias.md). Inicial por personagem, comum, incomum, rara, de chefe, de loja,
// de evento e especial. A recuperação depois de cada vitória não vem das relíquias: é da dificuldade
// (`jornadaBalance.run.afterWinRecovery`); o Cupom do Ichiraku e o Cartão do ramen somam a ela.

/** Ids que mudaram (antigo → novo): saves e a coleção do perfil trocam ao carregar. */
export const RELIC_RENAMES: Record<string, string> = {
  ichirakuBowl: 'irukaHeadband',
  ichirakuDeluxe: 'firstHokageNecklace',
  academyFlask: 'academyManual',
  chuninFlask: 'chuninVest',
  trainingBento: 'greenJumpsuit',
  youthBento: 'youthJumpsuit',
  clanIncense: 'uchihaFan',
  uchihaIncense: 'uchihaCrest',
  familyTea: 'gentleFistScroll',
  mainHouseTea: 'eightTrigramsScroll',
  hokageNecklace: 'willOfFireCharm',
};

const FIRE = ['jFireSpark', 'jFireball', 'jPhoenixFlower', 'jGreatBlaze'];
const GENTLE_FIST = ['jGentlePalm', 'jSixtyFourPalms', 'jHundredTwentyEight'];
const each = (ids: string[], n: number) => Object.fromEntries(ids.map((id) => [id, n]));

export const relics: RelicDef[] = [
  // Iniciais: uma por classe, com um objeto da história dela. O Comum leva a mesma em qualquer elemento.
  { id: 'irukaHeadband', tier: 'starter', starterFor: ['naruto'], stats: { hp: 10 }, mods: { lowHpDamageMult: 1.15 } },
  { id: 'academyManual', tier: 'starter', starterFor: ['commonNinja'], xpMult: 1.1, mods: { accuracyBonus: 0.05 } },
  { id: 'greenJumpsuit', tier: 'starter', starterFor: ['prodigy'], stats: { speed: 1 }, mods: { taijutsuFlat: 1 } },
  { id: 'uchihaFan', tier: 'starter', starterFor: ['uchihaNinja'], mods: { techChakraDiscount: { jSharingan: 1 }, techDamageMult: each(FIRE, 1.1) } },
  { id: 'gentleFistScroll', tier: 'starter', starterFor: ['hyuugaNinja'], mods: { techChakraDiscount: { jByakugan: 1 }, techDamageMult: each(GENTLE_FIST, 1.1) } },

  // Evoluções: aparecem só na escolha depois do chefe e substituem a inicial.
  { id: 'firstHokageNecklace', tier: 'boss', evolves: 'irukaHeadband', stats: { hp: 20 }, mods: { lowHpDamageMult: 1.3 } },
  { id: 'chuninVest', tier: 'boss', evolves: 'academyManual', stats: { hp: 15 }, xpMult: 1.15, mods: { accuracyBonus: 0.08 } },
  { id: 'youthJumpsuit', tier: 'boss', evolves: 'greenJumpsuit', stats: { speed: 2 }, mods: { taijutsuFlat: 3, critBonus: 0.05 } },
  {
    id: 'uchihaCrest',
    tier: 'boss',
    evolves: 'uchihaFan',
    mods: { techChakraDiscount: { jSharingan: 2, jSharingan3: 2 }, techDamageMult: each(FIRE, 1.2), critBonus: 0.05 },
  },
  {
    id: 'eightTrigramsScroll',
    tier: 'boss',
    evolves: 'gentleFistScroll',
    mods: { techChakraDiscount: { jByakugan: 2, jByakugan2: 2 }, techDamageMult: each(GENTLE_FIST, 1.2), evasion: 0.04 },
  },

  // Comuns
  { id: 'goggles', tier: 'common', mods: { accuracyBonus: 0.05 } },
  { id: 'leafHeadband', tier: 'common', stats: { hp: 10 } },
  { id: 'frogWallet', tier: 'common', ryoMult: 1.25 },
  { id: 'kunaiPouch', tier: 'common', mods: { taijutsuFlat: 2 } },
  { id: 'trainingWeights', tier: 'common', stats: { speed: 2 } },
  { id: 'soldierPills', tier: 'common', stats: { chakra: 6 } },
  { id: 'medKit', tier: 'common', grant: { items: { hpKit: 2, chakraKit: 1 } } },
  { id: 'steelWire', tier: 'common', mods: { evasion: 0.05 } },
  { id: 'fieldCanteen', tier: 'common', allyHpPct: 0.1 },
  { id: 'blankSeals', tier: 'common', grant: { items: { chakraKit: 2 } } },
  { id: 'luckyCoin', tier: 'common', grant: { ryo: 60 } },
  { id: 'trainingLog', tier: 'common', xpMult: 1.15 },
  { id: 'wornSandals', tier: 'common', stats: { speed: 1 }, mods: { evasion: 0.02 } },
  { id: 'riceBalls', tier: 'common', mods: { kitBonusPct: 0.25 } },
  { id: 'whetstone', tier: 'common', mods: { critBonus: 0.04 } },
  { id: 'meditationBeads', tier: 'common', mods: { restBonus: 3 } },
  { id: 'paddedVest', tier: 'common', mods: { guardHeal: 3 } },
  { id: 'chakraCandy', tier: 'common', mods: { startChakra: 3 } },
  { id: 'campBlanket', tier: 'common', restBonus: { hp: 10, chakra: 3 } },
  { id: 'sturdyBag', tier: 'common', bagBonus: 2 },

  // Incomuns
  { id: 'ichirakuCoupon', tier: 'uncommon', afterWin: { hp: 10, chakra: 3 } },
  { id: 'handWraps', tier: 'uncommon', mods: { typeDamageMult: { taijutsu: 1.1 } } },
  { id: 'herbPouch', tier: 'uncommon', mods: { regenHp: 2 } },
  { id: 'merchantToken', tier: 'uncommon', shopDiscount: 0.15 },
  { id: 'summoningScroll', tier: 'uncommon', mods: { startClones: 1 } },
  { id: 'warDrum', tier: 'uncommon', teamMods: { accuracyBonus: 0.05 } },
  { id: 'senbonCase', tier: 'uncommon', teamMods: { critBonus: 0.05 } },
  { id: 'storageSeal', tier: 'uncommon', grant: { items: { hpKit: 2, reviveKit: 1 } } },
  { id: 'revivalPills', tier: 'uncommon', grant: { items: { reviveKit: 2 } } },
  { id: 'mastersJournal', tier: 'uncommon', grant: { talentPoints: 1 } },
  { id: 'tornHeadband', tier: 'uncommon', mods: { lowHpDamageMult: 1.25 } },
  { id: 'huntingMark', tier: 'uncommon', mods: { onKillChakra: 3 } },
  { id: 'toxinVial', tier: 'uncommon', mods: { effectChanceBonus: 0.1 } },
  { id: 'shadowThread', tier: 'uncommon', mods: { stunnedDamageMult: 1.2 } },
  { id: 'rescueWhistle', tier: 'uncommon', teamMods: { reviveHpBonus: 0.15 } },
  { id: 'mirrorShard', tier: 'uncommon', mods: { cloneCounter: 4 } },
  { id: 'twinKunai', tier: 'uncommon', mods: { damagePerClone: 0.03 } },

  // Raras
  { id: 'forbiddenScroll', tier: 'rare', mods: { extraClones: 1 } },
  { id: 'kakashiBell', tier: 'rare', mods: { critBonus: 0.1 } },
  { id: 'explosiveTags', tier: 'rare', openingDamage: 10 },
  { id: 'hakuMask', tier: 'rare', teamMods: { evasion: 0.06 } },
  { id: 'sandGourd', tier: 'rare', teamMods: { startShieldPct: 0.1 } },
  { id: 'toadContract', tier: 'rare', mods: { typeDamageMult: { ninjutsu: 1.15 } } },
  { id: 'warFan', tier: 'rare', teamMods: { typeDamageMult: { ninjutsu: 1.1 } } },
  { id: 'chakraStone', tier: 'rare', mods: { chakraDiscount: 1 } },
  { id: 'thousandScroll', tier: 'rare', mods: { maxClonesBonus: 2, damagePerClone: 0.02 } },
  { id: 'masterKunai', tier: 'rare', mods: { damageMult: 1.1 } },
  { id: 'bloodPact', tier: 'rare', mods: { lowHpDamageMult: 1.35 } },
  { id: 'dreamIncense', tier: 'rare', mods: { typeDamageMult: { genjutsu: 1.25 } } },
  { id: 'longevityCharm', tier: 'rare', teamMods: { regenHp: 2 } },
  { id: 'reserveChakra', tier: 'rare', mods: { startChakra: 8 } },
  { id: 'vitalScroll', tier: 'rare', stats: { hp: 25 } },

  // De chefe
  { id: 'willOfFireCharm', tier: 'boss', grant: { willOfFire: 1 } },
  { id: 'eightTrigramSeal', tier: 'boss', mods: { regenHp: 4 } },
  { id: 'hokageHat', tier: 'boss', teamMods: { damageMult: 1.15 } },
  { id: 'sanninBand', tier: 'boss', allyHpPct: 0.25 },
  { id: 'gamabuntaPipe', tier: 'boss', mods: { chakraDiscount: 2 } },
  { id: 'chakraBlade', tier: 'boss', mods: { damageMult: 1.25 } },
  { id: 'samuraiArmor', tier: 'boss', teamMods: { startShieldPct: 0.2 } },
  { id: 'heavenEarthScrolls', tier: 'boss', grant: { talentPoints: 2 } },
  { id: 'eternalLotus', tier: 'boss', teamMods: { regenHp: 3 } },
  { id: 'bottomlessPouch', tier: 'boss', ryoMult: 1.5, shopDiscount: 0.25 },
  { id: 'phoenixFeather', tier: 'boss', mods: { surviveOnce: true } },
  { id: 'armySeal', tier: 'boss', mods: { startClones: 2, maxClonesBonus: 1 } },
  { id: 'kageRobe', tier: 'boss', teamMods: { evasion: 0.08, accuracyBonus: 0.05 } },
  { id: 'chakraCore', tier: 'boss', stats: { chakra: 10 }, mods: { startChakra: 15 } },
  { id: 'secondChance', tier: 'boss', teamMods: { reviveHpBonus: 0.3 } },
  { id: 'warBanner', tier: 'boss', teamMods: { critBonus: 0.1 } },

  // De loja
  { id: 'merchantScale', tier: 'shop', shopDiscount: 0.1, ryoMult: 1.1 },
  { id: 'fullKit', tier: 'shop', grant: { items: { hpKit: 2, chakraKit: 2, reviveKit: 1 } } },
  { id: 'clientSeal', tier: 'shop', bagBonus: 3 },
  { id: 'tradeContract', tier: 'shop', ryoMult: 1.4 },
  { id: 'smithOrder', tier: 'shop', mods: { taijutsuFlat: 4 } },
  { id: 'tutorLetter', tier: 'shop', xpMult: 1.3 },
  { id: 'armorPlate', tier: 'shop', stats: { hp: 20 } },

  // De evento
  { id: 'oldLadyCharm', tier: 'event', stats: { hp: 10 }, teamMods: { regenHp: 1 } },
  { id: 'strangeRing', tier: 'event', mods: { critBonus: 0.08, accuracyBonus: 0.04 } },
  { id: 'summonerInk', tier: 'event', mods: { startClones: 1, extraClones: 1 } },
  { id: 'ramenCard', tier: 'event', afterWin: { hp: 15, chakra: 4 } },
  { id: 'guruScroll', tier: 'event', grant: { talentPoints: 1, ryo: 30 } },
  { id: 'jokenpoDice', tier: 'event', ryoMult: 1.2, mods: { critBonus: 0.03 } },
  { id: 'fanLetter', tier: 'event', teamMods: { accuracyBonus: 0.03, evasion: 0.03 } },
  { id: 'toadOilFlask', tier: 'event', openingDamage: 6 },

  // Especial: só quando não sobra nada para sortear.
  { id: 'emptyCharm', tier: 'special', grant: { ryo: 25 } },
];
