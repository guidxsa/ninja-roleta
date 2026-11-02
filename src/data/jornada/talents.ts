import type { TalentNode } from '../../core/jornada/talents';

// Árvore do Naruto (docs/jornada/talentos.md). Três ramos de quatro nós; cada nó pede o anterior.
// Kyuubi abre depois do Haku (estágio 2) e Rasengan quando o Jiraiya ensina (estágio 3).
// A Ōdama só aparece depois de vencer a run canônica uma vez (conquista `j_canonWin`).

export const talents: TalentNode[] = [
  { id: 'tMoreClones', owner: 'naruto', branch: 'clones', tier: 1, cost: 1, mods: { extraClones: 1 } },
  { id: 'tRendan', owner: 'naruto', branch: 'clones', tier: 2, cost: 2, learn: 'jRendan' },
  { id: 'tCloneGuard', owner: 'naruto', branch: 'clones', tier: 3, cost: 2, mods: { startClones: 1, taijutsuFlat: 2 } },
  { id: 'tTajuu', owner: 'naruto', branch: 'clones', tier: 4, cost: 3, learn: 'jTajuuBunshin' },

  { id: 'tKyuubiRegen', owner: 'naruto', branch: 'kyuubi', tier: 1, cost: 1, fromStage: 1, mods: { regenPct: 0.03 } },
  { id: 'tKyuubiCloak', owner: 'naruto', branch: 'kyuubi', tier: 2, cost: 2, fromStage: 1, learn: 'jKyuubiCloak' },
  { id: 'tChakraBurst', owner: 'naruto', branch: 'kyuubi', tier: 3, cost: 2, fromStage: 1, learn: 'jChakraBurst', mods: { lowHpDamageMult: 1.2 } },
  { id: 'tKyuubiFury', owner: 'naruto', branch: 'kyuubi', tier: 4, cost: 3, fromStage: 1, mods: { surviveOnce: true, lowHpDamageMult: 1.1 } },

  { id: 'tRasengan', owner: 'naruto', branch: 'rasengan', tier: 1, cost: 1, fromStage: 2, learn: 'jRasengan' },
  { id: 'tRasenganMastery', owner: 'naruto', branch: 'rasengan', tier: 2, cost: 2, fromStage: 2, mods: { techDamageMult: { jRasengan: 1.25 }, techChakraDiscount: { jRasengan: 2 } } },
  { id: 'tRasenganFocus', owner: 'naruto', branch: 'rasengan', tier: 3, cost: 2, fromStage: 2, mods: { critBonus: 0.1 } },
  { id: 'tOdama', owner: 'naruto', branch: 'rasengan', tier: 4, cost: 3, fromStage: 2, account: 'j_canonWin', learn: 'jOdama' },

  // Comum (runs genéricas): o ramo Elemento ensina as técnicas do elemento sorteado.
  { id: 'tElement2', owner: 'commonNinja', branch: 'element', tier: 1, cost: 1, learnByElement: { fire: 'jFireball', wind: 'jGale', lightning: 'jLightningCurrent', earth: 'jEarthSpear', water: 'jWaterShark' } },
  { id: 'tElementPower', owner: 'commonNinja', branch: 'element', tier: 2, cost: 2, mods: { typeDamageMult: { ninjutsu: 1.15 } } },
  { id: 'tElement3', owner: 'commonNinja', branch: 'element', tier: 3, cost: 2, learnByElement: { fire: 'jGreatBlaze', wind: 'jVacuumSphere', lightning: 'jLightningBlade', earth: 'jEarthDragon', water: 'jWaterfall' } },
  { id: 'tElementMaster', owner: 'commonNinja', branch: 'element', tier: 4, cost: 3, mods: { chakraDiscount: 2, critBonus: 0.05 } },
  { id: 'tKunaiPro', owner: 'commonNinja', branch: 'tools', tier: 1, cost: 1, mods: { taijutsuFlat: 2 } },
  { id: 'tExplosiveTag', owner: 'commonNinja', branch: 'tools', tier: 2, cost: 2, learn: 'jExplosiveTag' },
  { id: 'tWireTrap', owner: 'commonNinja', branch: 'tools', tier: 3, cost: 2, learn: 'jWireTrap' },
  { id: 'tSubstitution', owner: 'commonNinja', branch: 'tools', tier: 4, cost: 3, mods: { evasion: 0.1, extraClones: 1 } },
  { id: 'tDetermination', owner: 'commonNinja', branch: 'will', tier: 1, cost: 1, xpMult: 1.25 },
  { id: 'tGrit', owner: 'commonNinja', branch: 'will', tier: 2, cost: 2, mods: { lowHpDamageMult: 1.25 } },
  { id: 'tHardWork', owner: 'commonNinja', branch: 'will', tier: 3, cost: 2, mods: { damageMult: 1.1 } },
  { id: 'tWillOfFire', owner: 'commonNinja', branch: 'will', tier: 4, cost: 3, mods: { surviveOnce: true, regenPct: 0.02 } },

  // Prodígio (Comum sem elemento): o kit do prodígio do Roleta.
  { id: 'tGateOpen', owner: 'prodigy', branch: 'gates', tier: 1, cost: 1, learn: 'jGatesHigh' },
  { id: 'tGateBody', owner: 'prodigy', branch: 'gates', tier: 2, cost: 2, mods: { startShieldPct: 0.1 } },
  { id: 'tPrimaryLotus', owner: 'prodigy', branch: 'gates', tier: 3, cost: 2, learn: 'jPrimaryLotus' },
  { id: 'tHiddenLotus', owner: 'prodigy', branch: 'gates', tier: 4, cost: 3, learn: 'jHiddenLotus' },
  { id: 'tYouth', owner: 'prodigy', branch: 'youth', tier: 1, cost: 1, mods: { critBonus: 0.05, accuracyBonus: 0.05 } },
  { id: 'tLeafHurricane', owner: 'prodigy', branch: 'youth', tier: 2, cost: 2, learn: 'jLeafHurricane' },
  { id: 'tDrunkenFist', owner: 'prodigy', branch: 'youth', tier: 3, cost: 2, learn: 'jDrunkenFist' },
  { id: 'tSpringtime', owner: 'prodigy', branch: 'youth', tier: 4, cost: 3, mods: { damageMult: 1.1, regenPct: 0.02 } },
  { id: 'tWeights', owner: 'prodigy', branch: 'training', tier: 1, cost: 1, mods: { evasion: 0.05 } },
  { id: 'tDynamicEntry', owner: 'prodigy', branch: 'training', tier: 2, cost: 2, learn: 'jDynamicEntry' },
  { id: 'tTaijutsuMaster', owner: 'prodigy', branch: 'training', tier: 3, cost: 2, mods: { typeDamageMult: { taijutsu: 1.15 } } },
  { id: 'tEndurance', owner: 'prodigy', branch: 'training', tier: 4, cost: 3, mods: { surviveOnce: true } },
];
