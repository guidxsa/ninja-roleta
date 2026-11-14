import type { TalentNode } from '../../core/jornada/talents';

// Árvore do Naruto (docs/jornada/talentos.md, refeita na v0.71.0). Seis ramos, cada um com um estilo, uma
// bifurcação (escolha exclusiva), uma junção e um talento final que muda uma regra do combate. Clones e Pegadinhas
// abrem no começo; as raízes de Laços, Sapos, Kyuubi e Rasengan vêm da história (`grantedBy`).
// Os ramos não são independentes: seis talentos de combinação (`requiresAll`) pedem a junção de dois ramos vizinhos,
// em anel (Clones, Pegadinhas, Laços, Sapos, Kyuubi, Rasengan e de volta aos Clones).
// Um ramo focado custa de 9 a 12 pontos; uma run rende cerca de 30. A maioria dos talentos é única.

export const talents: TalentNode[] = [
  // Clones (enxame): mais clones, e eles viram ataque (Rendan) ou defesa (Guarda). Final: o clone sempre leva o golpe.
  // A raiz só barateia o Kage Bunshin: o clone a mais (o talento mais forte do começo, na medição) fica na junção.
  { id: 'tMoreClones', owner: 'naruto', branch: 'clones', tier: 1, cost: 1, mods: { techChakraDiscount: { jKageBunshin: 2 } } },
  { id: 'tRendan', owner: 'naruto', branch: 'clones', tier: 2, col: -1, cost: 2, excludes: ['tCloneGuard'], learn: 'jRendan', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jRendan: 1.15 } } },
  { id: 'tCloneGuard', owner: 'naruto', branch: 'clones', tier: 2, col: 1, cost: 2, excludes: ['tRendan'], mods: { startClones: 1, taijutsuFlat: 2 } },
  { id: 'tCloneBlast', owner: 'naruto', branch: 'clones', tier: 3, cost: 2, requires: ['tRendan', 'tCloneGuard'], mods: { cloneCounter: 4, extraClones: 1 } },
  // O Mil Clones vem da história (marco do Mizuki, v0.70.0); o talento o deixa mais forte e, no nível 2, mais barato.
  { id: 'tTajuu', owner: 'naruto', branch: 'clones', tier: 4, cost: 2, mods: { techDamageMult: { jTajuuBunshin: 1.2 } }, maxRank: 2, rankCost: 1, rankMods: { techChakraDiscount: { jTajuuBunshin: 2 } } },
  { id: 'tShadowArmy', owner: 'naruto', branch: 'clones', tier: 5, cost: 3, capstone: true, mods: { cloneShield: true, maxClonesBonus: 2 } },

  // Pegadinhas (controle): atordoar e bater em quem está atordoado. Final: golpe em alvo atordoado é sempre crítico.
  { id: 'tPrankKing', owner: 'naruto', branch: 'pranks', tier: 1, cost: 1, mods: { evasion: 0.14, effectChanceBonus: 0.15, techChakraDiscount: { jSexyJutsu: 1 } } },
  { id: 'tHarem', owner: 'naruto', branch: 'pranks', tier: 2, col: -1, cost: 2, excludes: ['tSmokeBomb'], learn: 'jHarem' },
  { id: 'tSmokeBomb', owner: 'naruto', branch: 'pranks', tier: 2, col: 1, cost: 2, excludes: ['tHarem'], learn: 'jSmokeBomb' },
  // A Shuriken das sombras é o dano do ramo (sem ela, a build de Pegadinhas só atordoa e não derruba ninguém).
  { id: 'tShadowShuriken', owner: 'naruto', branch: 'pranks', tier: 3, cost: 2, requires: ['tHarem', 'tSmokeBomb'], learn: 'jShadowShuriken', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jShadowShuriken: 1.2 } } },
  // Emboscada vale para a equipe: quem controla abre o alvo para os outros baterem.
  { id: 'tAmbush', owner: 'naruto', branch: 'pranks', tier: 4, cost: 2, teamMods: { stunnedDamageMult: 1.4 } },
  { id: 'tTrickMaster', owner: 'naruto', branch: 'pranks', tier: 5, cost: 3, capstone: true, mods: { stunnedAlwaysCrit: true, critBonus: 0.05 } },

  // Laços (suporte; a raiz vem da lição do teste do sino): a equipe aguenta mais. Final: cada um não cai uma vez.
  { id: 'tNeverGiveUp', owner: 'naruto', branch: 'bonds', tier: 1, cost: 0, grantedBy: { flag: 'bellsLesson' }, teamMods: { regenHp: 1 } },
  { id: 'tTeam7', owner: 'naruto', branch: 'bonds', tier: 2, col: -1, cost: 2, excludes: ['tWarCry'], allyHpPct: 0.12 },
  { id: 'tWarCry', owner: 'naruto', branch: 'bonds', tier: 2, col: 1, cost: 2, excludes: ['tTeam7'], learn: 'jWarCry', maxRank: 3, rankCost: 1, rankMods: { techChakraDiscount: { jWarCry: 1 } } },
  { id: 'tProtectFriends', owner: 'naruto', branch: 'bonds', tier: 3, cost: 2, requires: ['tTeam7', 'tWarCry'], teamMods: { damageMult: 1.06 } },
  { id: 'tNoOneLeft', owner: 'naruto', branch: 'bonds', tier: 4, cost: 2, learn: 'jReanimate', teamMods: { startShieldPct: 0.05 } },
  { id: 'tFutureHokage', owner: 'naruto', branch: 'bonds', tier: 5, cost: 3, capstone: true, teamMods: { surviveOnce: true, accuracyBonus: 0.05 } },

  // Sapos (sorteio; a raiz é o Kuchiyose, do contrato): mexe nos pesos do sapo. Final: gira duas vezes, fica o melhor.
  { id: 'tKuchiyose', owner: 'naruto', branch: 'toads', tier: 1, cost: 0, grantedBy: { technique: 'jKuchiyose' } },
  { id: 'tGamakichi', owner: 'naruto', branch: 'toads', tier: 2, col: -1, cost: 2, excludes: ['tGamatatsu'], mods: { rollWeights: { jGamakichi: 15 }, techDamageMult: { jGamakichi: 1.2 } }, maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jGamakichi: 1.2 } } },
  { id: 'tGamatatsu', owner: 'naruto', branch: 'toads', tier: 2, col: 1, cost: 2, excludes: ['tGamakichi'], mods: { rollWeights: { jGamatatsu: 15 }, startShieldPct: 0.05 } },
  { id: 'tToadContract', owner: 'naruto', branch: 'toads', tier: 3, cost: 2, requires: ['tGamakichi', 'tGamatatsu'], mods: { rollWeights: { jGamabunta: 8 } }, maxRank: 3, rankCost: 2, rankMods: { rollWeights: { jGamabunta: 6 } } },
  { id: 'tToadBreath', owner: 'naruto', branch: 'toads', tier: 4, cost: 2, mods: { techChakraDiscount: { jKuchiyose: 3 }, techDamageMult: { jGamabunta: 1.2 } } },
  { id: 'tToadBoss', owner: 'naruto', branch: 'toads', tier: 5, cost: 3, capstone: true, mods: { rollTwice: true } },

  // Kyuubi (risco; a raiz é o chakra da raposa, depois do Haku): mais forte com o HP baixo. Final: em vez de cair,
  // o manto toma conta.
  { id: 'tKyuubiRegen', owner: 'naruto', branch: 'kyuubi', tier: 1, cost: 0, grantedBy: { flag: 'kyuubiAwakened' }, mods: { regenHp: 3 } },
  { id: 'tKyuubiCloak', owner: 'naruto', branch: 'kyuubi', tier: 2, col: -1, cost: 2, excludes: ['tOneTail'], learn: 'jKyuubiCloak' },
  { id: 'tOneTail', owner: 'naruto', branch: 'kyuubi', tier: 2, col: 1, cost: 2, excludes: ['tKyuubiCloak'], learn: 'jOneTail' },
  { id: 'tChakraBurst', owner: 'naruto', branch: 'kyuubi', tier: 3, cost: 2, requires: ['tKyuubiCloak', 'tOneTail'], learn: 'jChakraBurst', mods: { lowHpDamageMult: 1.2 }, maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jChakraBurst: 1.2 } } },
  { id: 'tRedChakra', owner: 'naruto', branch: 'kyuubi', tier: 4, cost: 2, mods: { lowHpDamageMult: 1.1, regenHp: 2 } },
  { id: 'tKyuubiFury', owner: 'naruto', branch: 'kyuubi', tier: 5, cost: 3, capstone: true, mods: { surviveOnce: true, surviveForm: 'kyuubiBrief' } },

  // Rasengan (golpe único; a raiz é o Rasengan, do treino com o Jiraiya, e os níveis são pagos): precisão ou força.
  // Final: o dano que sobra do golpe fatal atravessa para o próximo inimigo. Sem a Ōdama (Shippuden).
  { id: 'tRasengan', owner: 'naruto', branch: 'rasengan', tier: 1, cost: 0, grantedBy: { technique: 'jRasengan' }, maxRank: 3, rankCost: 2, rankMods: { techDamageMult: { jRasengan: 1.15 }, techChakraDiscount: { jRasengan: 1 } } },
  { id: 'tRasenganFocus', owner: 'naruto', branch: 'rasengan', tier: 2, col: -1, cost: 2, excludes: ['tRasenganMastery'], mods: { critBonus: 0.1, accuracyBonus: 0.05 } },
  { id: 'tRasenganMastery', owner: 'naruto', branch: 'rasengan', tier: 2, col: 1, cost: 2, excludes: ['tRasenganFocus'], mods: { techDamageMult: { jRasengan: 1.25 }, techChakraDiscount: { jRasengan: 2 } } },
  { id: 'tRasenganSpin', owner: 'naruto', branch: 'rasengan', tier: 3, cost: 2, requires: ['tRasenganFocus', 'tRasenganMastery'], mods: { techDamageMult: { jRasengan: 1.1 }, onKillChakra: 3 } },
  { id: 'tRasenganBreak', owner: 'naruto', branch: 'rasengan', tier: 4, cost: 3, capstone: true, mods: { techOverflow: { jRasengan: 1 }, techDamageMult: { jRasengan: 1.15 } } },

  // Combinações (v0.71.0): cada uma pede a junção de dois ramos vizinhos e fica no pé dos dois.
  { id: 'tCloneDecoy', owner: 'naruto', branch: 'clones', tier: 6, cost: 2, requiresAll: ['tCloneBlast', 'tShadowShuriken'], mods: { extraClones: 1, effectChanceBonus: 0.1 } },
  { id: 'tDistraction', owner: 'naruto', branch: 'pranks', tier: 6, cost: 2, requiresAll: ['tShadowShuriken', 'tProtectFriends'], teamMods: { effectChanceBonus: 0.15 } },
  { id: 'tToadGuard', owner: 'naruto', branch: 'bonds', tier: 6, cost: 2, requiresAll: ['tProtectFriends', 'tToadContract'], teamMods: { startShieldPct: 0.08 } },
  { id: 'tBorrowedChakra', owner: 'naruto', branch: 'toads', tier: 6, cost: 2, requiresAll: ['tToadContract', 'tChakraBurst'], mods: { lowHpRollWeights: { jGamabunta: 30 } } },
  { id: 'tRasenganKyuubi', owner: 'naruto', branch: 'kyuubi', tier: 6, cost: 2, requiresAll: ['tChakraBurst', 'tRasenganSpin'], mods: { techDamageMult: { jRasengan: 1.2 }, lowHpDamageMult: 1.15 } },
  { id: 'tRasenClone', owner: 'naruto', branch: 'rasengan', tier: 6, cost: 2, requiresAll: ['tRasenganSpin', 'tCloneBlast'], learn: 'jRasenClone', maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jRasenClone: 1.2 } } },

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
