import type { TalentNode } from '../../core/jornada/talents';

// Árvore do Naruto (docs/jornada/talentos.md): seis ramos com bifurcações (escolha exclusiva), custando bem mais
// do que uma run rende: dá para fechar dois ramos ou misturar três. Clones, Pegadinhas e Laços abrem no começo;
// Sapos e Kyuubi depois do Haku (estágio 2); Rasengan quando o Jiraiya ensina (estágio 3).
// A Ōdama só aparece depois de vencer a História uma vez (conquista `j_canonWin`).
// A maioria dos talentos é única; só algumas técnicas sobem de nível (`maxRank`).

export const talents: TalentNode[] = [
  { id: 'tMoreClones', owner: 'naruto', branch: 'clones', tier: 1, cost: 1, mods: { extraClones: 1 } },
  { id: 'tRendan', owner: 'naruto', branch: 'clones', tier: 2, col: -1, cost: 2, excludes: ['tCloneGuard'], learn: 'jRendan', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jRendan: 1.2 } } },
  { id: 'tCloneGuard', owner: 'naruto', branch: 'clones', tier: 2, col: 1, cost: 2, excludes: ['tRendan'], mods: { startClones: 1, taijutsuFlat: 2 } },
  { id: 'tCloneBlast', owner: 'naruto', branch: 'clones', tier: 3, cost: 2, requires: ['tRendan', 'tCloneGuard'], mods: { cloneCounter: 5 } },
  { id: 'tTajuu', owner: 'naruto', branch: 'clones', tier: 4, cost: 3, learn: 'jTajuuBunshin' },
  { id: 'tShadowArmy', owner: 'naruto', branch: 'clones', tier: 5, cost: 3, capstone: true, mods: { maxClonesBonus: 2, damagePerClone: 0.03 } },

  { id: 'tPrankKing', owner: 'naruto', branch: 'pranks', tier: 1, cost: 1, mods: { evasion: 0.04, techChakraDiscount: { jSexyJutsu: 1 } } },
  { id: 'tHarem', owner: 'naruto', branch: 'pranks', tier: 2, col: -1, cost: 2, excludes: ['tSmokeBomb'], learn: 'jHarem' },
  { id: 'tSmokeBomb', owner: 'naruto', branch: 'pranks', tier: 2, col: 1, cost: 2, excludes: ['tHarem'], learn: 'jSmokeBomb' },
  { id: 'tShadowShuriken', owner: 'naruto', branch: 'pranks', tier: 3, cost: 2, requires: ['tHarem', 'tSmokeBomb'], learn: 'jShadowShuriken', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jShadowShuriken: 1.2 } } },
  { id: 'tAmbush', owner: 'naruto', branch: 'pranks', tier: 4, cost: 2, mods: { stunnedDamageMult: 1.3 } },
  { id: 'tTrickMaster', owner: 'naruto', branch: 'pranks', tier: 5, cost: 3, capstone: true, mods: { effectChanceBonus: 0.15, critBonus: 0.1 } },

  { id: 'tNeverGiveUp', owner: 'naruto', branch: 'bonds', tier: 1, cost: 1, teamMods: { regenHp: 1 } },
  { id: 'tTeam7', owner: 'naruto', branch: 'bonds', tier: 2, col: -1, cost: 2, excludes: ['tWarCry'], allyHpPct: 0.15 },
  { id: 'tWarCry', owner: 'naruto', branch: 'bonds', tier: 2, col: 1, cost: 2, excludes: ['tTeam7'], learn: 'jWarCry', maxRank: 3, rankCost: 1, rankMods: { techChakraDiscount: { jWarCry: 1 } } },
  { id: 'tProtectFriends', owner: 'naruto', branch: 'bonds', tier: 3, cost: 2, requires: ['tTeam7', 'tWarCry'], teamMods: { damageMult: 1.08 } },
  { id: 'tNoOneLeft', owner: 'naruto', branch: 'bonds', tier: 4, cost: 2, learn: 'jReanimate', teamMods: { startShieldPct: 0.05 } },
  { id: 'tFutureHokage', owner: 'naruto', branch: 'bonds', tier: 5, cost: 3, capstone: true, teamMods: { damageMult: 1.07, accuracyBonus: 0.05 } },

  // Sapos (v0.67.0): a raiz é o Kuchiyose, dado pelo contrato com os sapos. O resto mexe no sorteio do sapo.
  { id: 'tKuchiyose', owner: 'naruto', branch: 'toads', tier: 1, cost: 0, grantedBy: { technique: 'jKuchiyose' } },
  { id: 'tGamakichi', owner: 'naruto', branch: 'toads', tier: 2, col: -1, cost: 2, excludes: ['tGamatatsu'], mods: { rollWeights: { jGamakichi: 15 }, techDamageMult: { jGamakichi: 1.2 } }, maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jGamakichi: 1.2 } } },
  { id: 'tGamatatsu', owner: 'naruto', branch: 'toads', tier: 2, col: 1, cost: 2, excludes: ['tGamakichi'], mods: { rollWeights: { jGamatatsu: 15 }, startShieldPct: 0.05 } },
  { id: 'tToadContract', owner: 'naruto', branch: 'toads', tier: 3, cost: 2, requires: ['tGamakichi', 'tGamatatsu'], mods: { rollWeights: { jGamabunta: 8 } }, maxRank: 3, rankCost: 2, rankMods: { rollWeights: { jGamabunta: 6 } } },
  { id: 'tToadBoss', owner: 'naruto', branch: 'toads', tier: 4, cost: 3, capstone: true, mods: { rollWeights: { jTadpole: -100 }, techChakraDiscount: { jKuchiyose: 3 }, techDamageMult: { jGamabunta: 1.2 } } },

  // Kyuubi (v0.67.0): a raiz é o chakra da raposa, dado depois do Haku. O resto é o uso voluntário.
  { id: 'tKyuubiRegen', owner: 'naruto', branch: 'kyuubi', tier: 1, cost: 0, grantedBy: { flag: 'kyuubiAwakened' }, mods: { regenHp: 3 } },
  { id: 'tKyuubiCloak', owner: 'naruto', branch: 'kyuubi', tier: 2, col: -1, cost: 2, excludes: ['tOneTail'], learn: 'jKyuubiCloak' },
  { id: 'tOneTail', owner: 'naruto', branch: 'kyuubi', tier: 2, col: 1, cost: 2, excludes: ['tKyuubiCloak'], learn: 'jOneTail' },
  { id: 'tChakraBurst', owner: 'naruto', branch: 'kyuubi', tier: 3, cost: 2, requires: ['tKyuubiCloak', 'tOneTail'], learn: 'jChakraBurst', mods: { lowHpDamageMult: 1.2 }, maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jChakraBurst: 1.2 } } },
  { id: 'tKyuubiFury', owner: 'naruto', branch: 'kyuubi', tier: 4, cost: 3, capstone: true, mods: { surviveOnce: true, lowHpDamageMult: 1.1 } },

  // Rasengan (v0.67.0): a raiz é o Rasengan, dado pelo treino com o Jiraiya (os níveis são pagos). Sem a Ōdama
  // (Shippuden): o talento final é o Rasengan com o chakra da Kyuubi, como no Vale do Fim.
  { id: 'tRasengan', owner: 'naruto', branch: 'rasengan', tier: 1, cost: 0, grantedBy: { technique: 'jRasengan' }, maxRank: 3, rankCost: 2, rankMods: { techDamageMult: { jRasengan: 1.15 }, techChakraDiscount: { jRasengan: 1 } } },
  { id: 'tRasenganMastery', owner: 'naruto', branch: 'rasengan', tier: 2, cost: 2, mods: { techDamageMult: { jRasengan: 1.25 }, techChakraDiscount: { jRasengan: 2 } } },
  { id: 'tRasenganFocus', owner: 'naruto', branch: 'rasengan', tier: 3, col: -1, cost: 2, excludes: ['tRasenClone'], mods: { critBonus: 0.1 } },
  { id: 'tRasenClone', owner: 'naruto', branch: 'rasengan', tier: 3, col: 1, cost: 2, excludes: ['tRasenganFocus'], learn: 'jRasenClone', maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jRasenClone: 1.2 } } },
  { id: 'tRasenganKyuubi', owner: 'naruto', branch: 'rasengan', tier: 4, cost: 3, capstone: true, requires: ['tRasenganFocus', 'tRasenClone'], mods: { techDamageMult: { jRasengan: 1.3 }, lowHpDamageMult: 1.15 } },

  // Comum (Caminho Ninja): o ramo Elemento ensina as técnicas do elemento sorteado.
  { id: 'tElement2', owner: 'commonNinja', branch: 'element', tier: 1, cost: 1, learnByElement: { fire: 'jFireball', wind: 'jGale', lightning: 'jLightningCurrent', earth: 'jEarthSpear', water: 'jWaterShark' }, maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jFireball: 1.2, jGale: 1.2, jLightningCurrent: 1.2, jEarthSpear: 1.2, jWaterShark: 1.2 } } },
  { id: 'tElementPower', owner: 'commonNinja', branch: 'element', tier: 2, cost: 2, mods: { typeDamageMult: { ninjutsu: 1.15 } } },
  { id: 'tElement3', owner: 'commonNinja', branch: 'element', tier: 3, cost: 2, learnByElement: { fire: 'jGreatBlaze', wind: 'jVacuumSphere', lightning: 'jLightningBlade', earth: 'jEarthDragon', water: 'jWaterfall' } },
  { id: 'tElementMaster', owner: 'commonNinja', branch: 'element', tier: 4, cost: 3, mods: { chakraDiscount: 2, critBonus: 0.05 } },
  { id: 'tKunaiPro', owner: 'commonNinja', branch: 'tools', tier: 1, cost: 1, mods: { taijutsuFlat: 2 } },
  { id: 'tExplosiveTag', owner: 'commonNinja', branch: 'tools', tier: 2, cost: 2, learn: 'jExplosiveTag', maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jExplosiveTag: 1.25 } } },
  { id: 'tWireTrap', owner: 'commonNinja', branch: 'tools', tier: 3, cost: 2, learn: 'jWireTrap' },
  { id: 'tSubstitution', owner: 'commonNinja', branch: 'tools', tier: 4, cost: 3, mods: { evasion: 0.1, extraClones: 1 } },
  { id: 'tDetermination', owner: 'commonNinja', branch: 'will', tier: 1, cost: 1, xpMult: 1.25 },
  { id: 'tGrit', owner: 'commonNinja', branch: 'will', tier: 2, cost: 2, mods: { lowHpDamageMult: 1.25 } },
  { id: 'tHardWork', owner: 'commonNinja', branch: 'will', tier: 3, cost: 2, mods: { damageMult: 1.1 } },
  { id: 'tWillOfFire', owner: 'commonNinja', branch: 'will', tier: 4, cost: 3, mods: { surviveOnce: true, regenHp: 2 } },
  { id: 'tFieldMedic', owner: 'commonNinja', branch: 'will', tier: 5, cost: 2, learn: 'jReanimate' },

  // Prodígio (Comum sem elemento): o kit do prodígio do Roleta. Começa com o Portão da Abertura; o talento Portão da
  // Vida libera até o 3º portão e a Lótus Oculta até o 5º (Limite).
  { id: 'tGateOpen', owner: 'prodigy', branch: 'gates', tier: 1, cost: 1, mods: { gateLevels: 2 } },
  { id: 'tGateBody', owner: 'prodigy', branch: 'gates', tier: 2, cost: 2, mods: { startShieldPct: 0.1 } },
  { id: 'tPrimaryLotus', owner: 'prodigy', branch: 'gates', tier: 3, cost: 2, learn: 'jPrimaryLotus', maxRank: 2, rankCost: 2, rankMods: { techDamageMult: { jPrimaryLotus: 1.2 } } },
  { id: 'tHiddenLotus', owner: 'prodigy', branch: 'gates', tier: 4, cost: 3, learn: 'jHiddenLotus', mods: { gateLevels: 2 } },
  { id: 'tYouth', owner: 'prodigy', branch: 'youth', tier: 1, cost: 1, mods: { critBonus: 0.05, accuracyBonus: 0.05 } },
  { id: 'tLeafHurricane', owner: 'prodigy', branch: 'youth', tier: 2, cost: 2, learn: 'jLeafHurricane', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jLeafHurricane: 1.2 } } },
  { id: 'tDrunkenFist', owner: 'prodigy', branch: 'youth', tier: 3, cost: 2, learn: 'jDrunkenFist' },
  { id: 'tSpringtime', owner: 'prodigy', branch: 'youth', tier: 4, cost: 3, mods: { damageMult: 1.1, regenHp: 2 } },
  { id: 'tWeights', owner: 'prodigy', branch: 'training', tier: 1, cost: 1, mods: { evasion: 0.05 } },
  { id: 'tDynamicEntry', owner: 'prodigy', branch: 'training', tier: 2, cost: 2, learn: 'jDynamicEntry', maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jDynamicEntry: 1.25 } } },
  { id: 'tTaijutsuMaster', owner: 'prodigy', branch: 'training', tier: 3, cost: 2, mods: { typeDamageMult: { taijutsu: 1.15 } } },
  { id: 'tEndurance', owner: 'prodigy', branch: 'training', tier: 4, cost: 3, mods: { surviveOnce: true } },

  // Uchiha (v0.37.0). O ramo Raio só existe para quem sorteou raio como segundo elemento; aprender o Chidori
  // ali libera o easter egg do Sasuke (conquista `j_sasukeEgg`), que abre o ramo Sasuke de vez.
  { id: 'tSharingan3', owner: 'uchihaNinja', branch: 'sharingan', tier: 1, cost: 1, learn: 'jSharingan3' },
  { id: 'tCopyEye', owner: 'uchihaNinja', branch: 'sharingan', tier: 2, cost: 2, mods: { critBonus: 0.05, accuracyBonus: 0.05 } },
  { id: 'tInsight', owner: 'uchihaNinja', branch: 'sharingan', tier: 3, cost: 2, mods: { evasion: 0.07 } },
  { id: 'tSharinganFlow', owner: 'uchihaNinja', branch: 'sharingan', tier: 4, cost: 3, mods: { damageMult: 1.1, regenHp: 2 } },
  { id: 'tPhoenix', owner: 'uchihaNinja', branch: 'fire', tier: 1, cost: 1, learn: 'jPhoenixFlower', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jPhoenixFlower: 1.2 } } },
  { id: 'tFirePower', owner: 'uchihaNinja', branch: 'fire', tier: 2, cost: 2, mods: { typeDamageMult: { ninjutsu: 1.15 } } },
  { id: 'tGreatBlazeU', owner: 'uchihaNinja', branch: 'fire', tier: 3, cost: 2, learn: 'jGreatBlaze' },
  { id: 'tFireMaster', owner: 'uchihaNinja', branch: 'fire', tier: 4, cost: 3, mods: { chakraDiscount: 2 } },
  { id: 'tCrow', owner: 'uchihaNinja', branch: 'illusions', tier: 1, cost: 1, learn: 'jCrowIllusion', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jCrowIllusion: 1.2 } } },
  { id: 'tGenjutsuPower', owner: 'uchihaNinja', branch: 'illusions', tier: 2, cost: 2, mods: { typeDamageMult: { genjutsu: 1.2 } } },
  { id: 'tFearGaze', owner: 'uchihaNinja', branch: 'illusions', tier: 3, cost: 2, mods: { accuracyBonus: 0.05, critBonus: 0.05 } },
  { id: 'tTsukuyomi', owner: 'uchihaNinja', branch: 'illusions', tier: 4, cost: 3, learn: 'jTsukuyomi' },
  // O Uchiha é sempre Fogo (v0.59.0): o Chidori virou técnica aprendida no treino (como o do Sasuke com o Kakashi).
  { id: 'tChidoriU', owner: 'uchihaNinja', branch: 'lightning', tier: 1, cost: 2, learn: 'jChidori' },
  { id: 'tLionU', owner: 'uchihaNinja', branch: 'sasuke', tier: 1, cost: 1, account: 'j_sasukeEgg', learn: 'jLionBarrage', maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jLionBarrage: 1.25 } } },
  { id: 'tLightningBladeU', owner: 'uchihaNinja', branch: 'sasuke', tier: 2, cost: 2, account: 'j_sasukeEgg', learn: 'jLightningBlade' },
  { id: 'tAvenger', owner: 'uchihaNinja', branch: 'sasuke', tier: 3, cost: 2, account: 'j_sasukeEgg', mods: { lowHpDamageMult: 1.25 } },
  { id: 'tCursedSeal', owner: 'uchihaNinja', branch: 'sasuke', tier: 4, cost: 3, account: 'j_sasukeEgg', learn: 'jCursedSeal' },

  // Hyuuga (v0.37.0): a Palma do Vácuo, pendente desde o Roleta, entra no ramo Rotação.
  { id: 'tByakuganRange', owner: 'hyuugaNinja', branch: 'byakugan', tier: 1, cost: 1, mods: { accuracyBonus: 0.05, techChakraDiscount: { jByakugan: 1, jByakugan2: 1 } } },
  { id: 'tVitalPoints', owner: 'hyuugaNinja', branch: 'byakugan', tier: 2, cost: 2, mods: { critBonus: 0.1 } },
  { id: 'tByakugan2', owner: 'hyuugaNinja', branch: 'byakugan', tier: 3, cost: 2, learn: 'jByakugan2' },
  { id: 'tAllSeeing', owner: 'hyuugaNinja', branch: 'byakugan', tier: 4, cost: 3, mods: { evasion: 0.1 } },
  { id: 'tGentleFist', owner: 'hyuugaNinja', branch: 'gentleFist', tier: 1, cost: 1, mods: { typeDamageMult: { taijutsu: 1.1 } } },
  { id: 'tSixtyFour', owner: 'hyuugaNinja', branch: 'gentleFist', tier: 2, cost: 2, learn: 'jSixtyFourPalms', maxRank: 2, rankCost: 2, rankMods: { techDamageMult: { jSixtyFourPalms: 1.25 } } },
  { id: 'tChakraPoints', owner: 'hyuugaNinja', branch: 'gentleFist', tier: 3, cost: 2, mods: { techDamageMult: { jGentlePalm: 1.3 } } },
  { id: 'tHundredTwentyEight', owner: 'hyuugaNinja', branch: 'gentleFist', tier: 4, cost: 3, learn: 'jHundredTwentyEight' },
  { id: 'tRotation', owner: 'hyuugaNinja', branch: 'rotation', tier: 1, cost: 1, learn: 'jRotation' },
  { id: 'tGuardStance', owner: 'hyuugaNinja', branch: 'rotation', tier: 2, cost: 2, mods: { startShieldPct: 0.1 } },
  { id: 'tVacuumPalm', owner: 'hyuugaNinja', branch: 'rotation', tier: 3, cost: 2, learn: 'jVacuumPalm', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jVacuumPalm: 1.2 } } },
  { id: 'tVacuumWall', owner: 'hyuugaNinja', branch: 'rotation', tier: 4, cost: 3, learn: 'jVacuumWall' },
];
