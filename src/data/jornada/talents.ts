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
  { id: 'tShadowShuriken', owner: 'naruto', branch: 'pranks', tier: 3, cost: 2, requires: ['tHarem', 'tSmokeBomb'], learn: 'jShadowShuriken', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jShadowShuriken: 1.25 } } },
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

  // Comum (Caminho Ninja), refeito na v0.84.0: o ninja que faz de tudo. Seis ramos em anel (Elemento, Ferramentas,
  // Estilo da Folha, Clones, Equipe, Determinação), cada um com raiz, bifurcação, junção, um nó a mais e um talento
  // final que muda uma regra. Seis combinações ligam ramos vizinhos (pedem as duas junções) e três assinaturas premiam
  // combos fortes (pedem o talento final de um ramo e a junção do outro). A árvore toda custa ~80; uma run rende ~18.
  // Elemento (poder): as técnicas do elemento sorteado. Final: o ninjutsu atravessa a resistência.
  { id: 'tElement2', owner: 'commonNinja', branch: 'element', tier: 1, cost: 1, learnByElement: { fire: 'jFireball', wind: 'jGale', lightning: 'jLightningCurrent', earth: 'jEarthSpear', water: 'jWaterShark' }, maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jFireball: 1.2, jGale: 1.2, jLightningCurrent: 1.2, jEarthSpear: 1.2, jWaterShark: 1.2 } } },
  // Afinidade também ensina a barreira do elemento (v0.77.0; o raio não tem).
  { id: 'tElementPower', owner: 'commonNinja', branch: 'element', tier: 2, col: -1, cost: 2, excludes: ['tCChakraFlow'], mods: { typeDamageMult: { ninjutsu: 1.15 } }, learnByElement: { fire: 'jFireWall', wind: 'jWindShield', earth: 'jEarthWall', water: 'jWaterWall' } },
  { id: 'tCChakraFlow', owner: 'commonNinja', branch: 'element', tier: 2, col: 1, cost: 2, excludes: ['tElementPower'], mods: { chakraDiscount: 1, effectChanceBonus: 0.1 } },
  { id: 'tElement3', owner: 'commonNinja', branch: 'element', tier: 3, cost: 2, requires: ['tElementPower', 'tCChakraFlow'], learnByElement: { fire: 'jGreatBlaze', wind: 'jVacuumSphere', lightning: 'jLightningBlade', earth: 'jEarthDragon', water: 'jWaterfall' } },
  { id: 'tCNatureMastery', owner: 'commonNinja', branch: 'element', tier: 4, cost: 2, mods: { effectTurnsBonus: 1 } },
  { id: 'tElementMaster', owner: 'commonNinja', branch: 'element', tier: 5, cost: 3, capstone: true, mods: { typePen: { ninjutsu: 0.3 }, chakraDiscount: 1 } },
  // Ferramentas (controle): área ou atordoar. Final: inimigo atordoado leva mais dano de toda a equipe.
  { id: 'tKunaiPro', owner: 'commonNinja', branch: 'tools', tier: 1, cost: 1, mods: { taijutsuFlat: 2 } },
  { id: 'tExplosiveTag', owner: 'commonNinja', branch: 'tools', tier: 2, col: -1, cost: 2, excludes: ['tWireTrap'], learn: 'jExplosiveTag', maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jExplosiveTag: 1.25 } } },
  { id: 'tWireTrap', owner: 'commonNinja', branch: 'tools', tier: 2, col: 1, cost: 2, excludes: ['tExplosiveTag'], learn: 'jWireTrap', mods: { effectTurnsBonus: 1 } },
  { id: 'tCNinjaPouch', owner: 'commonNinja', branch: 'tools', tier: 3, cost: 2, requires: ['tExplosiveTag', 'tWireTrap'], mods: { kitBonusPct: 0.25, startChakra: 5 } },
  { id: 'tCArsenal', owner: 'commonNinja', branch: 'tools', tier: 4, cost: 2, mods: { techChakraDiscount: { jExplosiveTag: 2, jWireTrap: 2 }, effectChanceBonus: 0.1 } },
  { id: 'tCTrapMaster', owner: 'commonNinja', branch: 'tools', tier: 5, cost: 3, capstone: true, teamMods: { stunnedDamageMult: 1.4 } },
  // Estilo da Folha (sequência): taijutsu de vários golpes. Final: +1 golpe e cada golpe seguido bate mais.
  { id: 'tCBasicTraining', owner: 'commonNinja', branch: 'leafStyle', tier: 1, cost: 1, mods: { taijutsuFlat: 1, accuracyBonus: 0.05 } },
  { id: 'tCHurricane', owner: 'commonNinja', branch: 'leafStyle', tier: 2, col: -1, cost: 2, excludes: ['tCFirmFist'], learn: 'jLeafHurricane', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jLeafHurricane: 1.15 } } },
  { id: 'tCFirmFist', owner: 'commonNinja', branch: 'leafStyle', tier: 2, col: 1, cost: 2, excludes: ['tCHurricane'], mods: { typePen: { taijutsu: 0.2 } } },
  { id: 'tCFightRhythm', owner: 'commonNinja', branch: 'leafStyle', tier: 3, cost: 2, requires: ['tCHurricane', 'tCFirmFist'], mods: { taijutsuHitChakra: 1 } },
  { id: 'tCReflexes', owner: 'commonNinja', branch: 'leafStyle', tier: 4, cost: 2, mods: { evasion: 0.06, critBonus: 0.05 } },
  { id: 'tCLeafCombo', owner: 'commonNinja', branch: 'leafStyle', tier: 5, cost: 3, capstone: true, mods: { taijutsuExtraHits: 1, comboStepPct: 0.07 } },
  // Clones (enganação): esquiva ou clone que bate. Final: com clone de pé, o inimigo erra mais.
  { id: 'tCCloneBasics', owner: 'commonNinja', branch: 'clones', tier: 1, cost: 1, mods: { techChakraDiscount: { jBunshin: 1, jMizuBunshin: 1, jDotonBunshin: 1, jRaitonBunshin: 1, jMokutonBunshin: 1, jSunaBunshin: 1 } } },
  { id: 'tSubstitution', owner: 'commonNinja', branch: 'clones', tier: 2, col: -1, cost: 2, excludes: ['tCAttackClone'], mods: { evasion: 0.12 } },
  { id: 'tCAttackClone', owner: 'commonNinja', branch: 'clones', tier: 2, col: 1, cost: 2, excludes: ['tSubstitution'], mods: { cloneStrikePct: 0.25 } },
  { id: 'tCMultiClones', owner: 'commonNinja', branch: 'clones', tier: 3, cost: 2, requires: ['tSubstitution', 'tCAttackClone'], mods: { extraClones: 1, startClones: 1 } },
  { id: 'tCCloneBlast', owner: 'commonNinja', branch: 'clones', tier: 4, cost: 2, mods: { cloneCounter: 4 } },
  { id: 'tCPerfectIllusion', owner: 'commonNinja', branch: 'clones', tier: 5, cost: 3, capstone: true, mods: { cloneEnemyAccuracy: 0.25, maxClonesBonus: 1 } },
  // Equipe (suporte): suportes fortes e protegidos. Final: uma vez por luta, ninguém da equipe cai de primeira.
  { id: 'tCTeamwork', owner: 'commonNinja', branch: 'team', tier: 1, cost: 1, allyHpPct: 0.08 },
  { id: 'tCCommand', owner: 'commonNinja', branch: 'team', tier: 2, col: -1, cost: 2, excludes: ['tCCare'], teamMods: { damageMult: 1.1 } },
  { id: 'tCCare', owner: 'commonNinja', branch: 'team', tier: 2, col: 1, cost: 2, excludes: ['tCCommand'], teamMods: { healMult: 1.25 } },
  { id: 'tFieldMedic', owner: 'commonNinja', branch: 'team', tier: 3, cost: 2, requires: ['tCCommand', 'tCCare'], learn: 'jReanimate' },
  { id: 'tCFormation', owner: 'commonNinja', branch: 'team', tier: 4, cost: 2, teamMods: { startShieldPct: 0.08 } },
  { id: 'tCBornLeader', owner: 'commonNinja', branch: 'team', tier: 5, cost: 3, capstone: true, teamMods: { surviveOnce: true } },
  // Determinação (resistência): crescer e aguentar. Final: cai de pé, recupera e fica firme.
  { id: 'tDetermination', owner: 'commonNinja', branch: 'will', tier: 1, cost: 1, xpMult: 1.25 },
  { id: 'tGrit', owner: 'commonNinja', branch: 'will', tier: 2, col: -1, cost: 2, excludes: ['tCStubborn'], mods: { lowHpDamageMult: 1.25 } },
  { id: 'tCStubborn', owner: 'commonNinja', branch: 'will', tier: 2, col: 1, cost: 2, excludes: ['tGrit'], mods: { regenHp: 2, guardHealPct: 0.08 } },
  { id: 'tHardWork', owner: 'commonNinja', branch: 'will', tier: 3, cost: 2, requires: ['tGrit', 'tCStubborn'], mods: { damageMult: 1.1 } },
  { id: 'tCResilience', owner: 'commonNinja', branch: 'will', tier: 4, cost: 2, mods: { evasion: 0.06, regenHp: 1 } },
  { id: 'tWillOfFire', owner: 'commonNinja', branch: 'will', tier: 5, cost: 3, capstone: true, mods: { surviveOnce: true, surviveHealPct: 0.25 } },
  // Combinações (anel): pedem a junção dos dois ramos vizinhos.
  { id: 'tCElementalSeal', owner: 'commonNinja', branch: 'element', tier: 6, cost: 2, requiresAll: ['tElement3', 'tCNinjaPouch'], mods: { techDamageMult: { jExplosiveTag: 1.2, jWireTrap: 1.2 }, effectChanceBonus: 0.1 } },
  { id: 'tCKunaiFist', owner: 'commonNinja', branch: 'tools', tier: 6, cost: 2, requiresAll: ['tCNinjaPouch', 'tCFightRhythm'], mods: { taijutsuFlat: 3, critBonus: 0.05 } },
  { id: 'tCLeafShadow', owner: 'commonNinja', branch: 'leafStyle', tier: 6, cost: 2, requiresAll: ['tCFightRhythm', 'tCMultiClones'], mods: { cloneStrikePct: 0.35 } },
  { id: 'tCCover', owner: 'commonNinja', branch: 'clones', tier: 6, cost: 2, requiresAll: ['tCMultiClones', 'tFieldMedic'], teamMods: { startClones: 1 } },
  { id: 'tCSteelBond', owner: 'commonNinja', branch: 'team', tier: 6, cost: 2, requiresAll: ['tFieldMedic', 'tHardWork'], teamMods: { lowHpDamageMult: 1.15 } },
  { id: 'tCInnerFlame', owner: 'commonNinja', branch: 'will', tier: 6, cost: 2, requiresAll: ['tHardWork', 'tElement3'], mods: { lowHpDamageMult: 1.15, chakraDiscount: 1 } },
  // Assinaturas: combos fortes entre si (o talento final de um ramo e a junção do outro).
  { id: 'tCChainBlast', owner: 'commonNinja', branch: 'tools', tier: 7, cost: 3, requiresAll: ['tCTrapMaster', 'tElement3'], mods: { stunnedSplashPct: 0.5 } },
  { id: 'tCThousandBlows', owner: 'commonNinja', branch: 'leafStyle', tier: 7, cost: 3, requiresAll: ['tCLeafCombo', 'tCMultiClones'], mods: { taijutsuHitsPerClone: 1 } },
  { id: 'tCNeverAlone', owner: 'commonNinja', branch: 'will', tier: 7, cost: 3, requiresAll: ['tWillOfFire', 'tFieldMedic'], mods: { surviveTeamHealPct: 0.15 } },

  // Prodígio (Comum sem elemento), refeito na v0.85.0 no molde do Comum: seis ramos em anel (Portões, Juventude, Punho
  // Bêbado, Treino, Rivalidade, Mestre e pupilo), bifurcação e talento final em cada, seis combinações e três
  // assinaturas. Personagem genérico: nada de nomes de personagens da obra. Começa com o Portão da Abertura; Portão da
  // Vida libera até o 3º portão e a Lótus Oculta até o 5º (Limite).
  // Portões (risco). Final: abaixo de 25% do HP, o portão sobe sozinho.
  { id: 'tGateOpen', owner: 'prodigy', branch: 'gates', tier: 1, cost: 1, mods: { gateLevels: 2 } },
  { id: 'tPQuickOpen', owner: 'prodigy', branch: 'gates', tier: 2, col: -1, cost: 2, excludes: ['tGateBody'], mods: { gateOpenDiscount: 1 } },
  { id: 'tGateBody', owner: 'prodigy', branch: 'gates', tier: 2, col: 1, cost: 2, excludes: ['tPQuickOpen'], mods: { startShieldPct: 0.1 } },
  { id: 'tPrimaryLotus', owner: 'prodigy', branch: 'gates', tier: 3, cost: 2, requires: ['tPQuickOpen', 'tGateBody'], learn: 'jPrimaryLotus', maxRank: 2, rankCost: 2, rankMods: { techDamageMult: { jPrimaryLotus: 1.2 } } },
  { id: 'tHiddenLotus', owner: 'prodigy', branch: 'gates', tier: 4, cost: 2, learn: 'jHiddenLotus', mods: { gateLevels: 2 } },
  { id: 'tPUnbound', owner: 'prodigy', branch: 'gates', tier: 5, cost: 3, capstone: true, mods: { gateAutoUp: true } },
  // Juventude (moral e crítico). Final: o crítico bate mais e devolve chakra.
  { id: 'tYouth', owner: 'prodigy', branch: 'youth', tier: 1, cost: 1, mods: { critBonus: 0.05, accuracyBonus: 0.05 } },
  { id: 'tSpringtime', owner: 'prodigy', branch: 'youth', tier: 2, col: -1, cost: 2, excludes: ['tPPromise'], mods: { regenHp: 2 } },
  { id: 'tPPromise', owner: 'prodigy', branch: 'youth', tier: 2, col: 1, cost: 2, excludes: ['tSpringtime'], mods: { lowHpDamageMult: 1.25 } },
  { id: 'tLeafHurricane', owner: 'prodigy', branch: 'youth', tier: 3, cost: 2, requires: ['tSpringtime', 'tPPromise'], learn: 'jLeafHurricane', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jLeafHurricane: 1.2 } } },
  { id: 'tPTireless', owner: 'prodigy', branch: 'youth', tier: 4, cost: 2, mods: { damageMult: 1.1 } },
  { id: 'tPYouthFlame', owner: 'prodigy', branch: 'youth', tier: 5, cost: 3, capstone: true, mods: { critMultBonus: 0.5, critChakra: 2 } },
  // Punho Bêbado (caos). Final: o Punho Bêbado ganha golpes.
  // A técnica vem na junção: na raiz (1 ponto), 3 golpes sem chakra logo no começo dominavam a run (medição v0.85.0).
  { id: 'tPLooseBody', owner: 'prodigy', branch: 'drunken', tier: 1, cost: 1, mods: { accuracyBonus: 0.05 } },
  { id: 'tPExtraSip', owner: 'prodigy', branch: 'drunken', tier: 2, col: -1, cost: 2, excludes: ['tPStagger'], mods: { critBonus: 0.08 } },
  { id: 'tPStagger', owner: 'prodigy', branch: 'drunken', tier: 2, col: 1, cost: 2, excludes: ['tPExtraSip'], mods: { evasion: 0.08 } },
  { id: 'tDrunkenFist', owner: 'prodigy', branch: 'drunken', tier: 3, cost: 2, requires: ['tPExtraSip', 'tPStagger'], learn: 'jDrunkenFist' },
  { id: 'tPEmptyBottle', owner: 'prodigy', branch: 'drunken', tier: 4, cost: 2, mods: { onKillChakra: 3 } },
  { id: 'tPTrueDrunk', owner: 'prodigy', branch: 'drunken', tier: 5, cost: 3, capstone: true, mods: { techExtraHits: { jDrunkenFist: 2 }, techDamageMult: { jDrunkenFist: 1.15 } } },
  // Treino (preparo). Final: o primeiro golpe da luta é crítico.
  { id: 'tWeights', owner: 'prodigy', branch: 'training', tier: 1, cost: 1, mods: { evasion: 0.05 } },
  { id: 'tPLaps', owner: 'prodigy', branch: 'training', tier: 2, col: -1, cost: 2, excludes: ['tPPushups'], mods: { startShieldPct: 0.1 } },
  { id: 'tPPushups', owner: 'prodigy', branch: 'training', tier: 2, col: 1, cost: 2, excludes: ['tPLaps'], mods: { taijutsuFlat: 3 } },
  { id: 'tTaijutsuMaster', owner: 'prodigy', branch: 'training', tier: 3, cost: 2, requires: ['tPLaps', 'tPPushups'], mods: { typeDamageMult: { taijutsu: 1.2 } } },
  { id: 'tEndurance', owner: 'prodigy', branch: 'training', tier: 4, cost: 2, mods: { surviveOnce: true } },
  { id: 'tPDropWeights', owner: 'prodigy', branch: 'training', tier: 5, cost: 3, capstone: true, mods: { openingCrit: true, evasion: 0.05, damageMult: 1.1 } },
  // Rivalidade (duelo). Final: contra quem tem mais HP máximo, bate mais e acerta mais.
  { id: 'tDynamicEntry', owner: 'prodigy', branch: 'rivalry', tier: 1, cost: 1, learn: 'jDynamicEntry', maxRank: 2, rankCost: 1, rankMods: { techDamageMult: { jDynamicEntry: 1.25 } } },
  { id: 'tPCounter', owner: 'prodigy', branch: 'rivalry', tier: 2, col: -1, cost: 2, excludes: ['tPChallenge'], mods: { counterChance: 0.3, counterDamage: 8 } },
  { id: 'tPChallenge', owner: 'prodigy', branch: 'rivalry', tier: 2, col: 1, cost: 2, excludes: ['tPCounter'], mods: { healthyTargetMult: 1.2 } },
  { id: 'tPRivalSpirit', owner: 'prodigy', branch: 'rivalry', tier: 3, cost: 2, requires: ['tPCounter', 'tPChallenge'], mods: { accuracyBonus: 0.05, critBonus: 0.05, damageMult: 1.1 } },
  { id: 'tPNeverYield', owner: 'prodigy', branch: 'rivalry', tier: 4, cost: 2, mods: { lowHpDamageMult: 1.25, guardHealPct: 0.06 } },
  { id: 'tPDuel', owner: 'prodigy', branch: 'rivalry', tier: 5, cost: 3, capstone: true, mods: { duelDamageMult: 1.3, duelAccuracy: 0.1 } },
  // Mestre e pupilo (suporte). Final: quando alguém cai, a equipe ganha dano.
  { id: 'tPCheer', owner: 'prodigy', branch: 'mentor', tier: 1, cost: 1, teamMods: { accuracyBonus: 0.05 } },
  { id: 'tPPairTraining', owner: 'prodigy', branch: 'mentor', tier: 2, col: -1, cost: 2, excludes: ['tPWatchful'], teamMods: { taijutsuFlat: 2 } },
  { id: 'tPWatchful', owner: 'prodigy', branch: 'mentor', tier: 2, col: 1, cost: 2, excludes: ['tPPairTraining'], allyHpPct: 0.1 },
  { id: 'tPFieldLesson', owner: 'prodigy', branch: 'mentor', tier: 3, cost: 2, requires: ['tPPairTraining', 'tPWatchful'], teamMods: { critBonus: 0.05, damageMult: 1.1 } },
  { id: 'tPTeamSpirit', owner: 'prodigy', branch: 'mentor', tier: 4, cost: 2, teamMods: { regenHp: 2 } },
  { id: 'tPMasterLesson', owner: 'prodigy', branch: 'mentor', tier: 5, cost: 3, capstone: true, mods: { fallenRally: 0.2 } },
  // Combinações (anel): a junção dos dois ramos vizinhos.
  { id: 'tPYouthLotus', owner: 'prodigy', branch: 'gates', tier: 6, cost: 2, requiresAll: ['tPrimaryLotus', 'tLeafHurricane'], mods: { techDamageMult: { jPrimaryLotus: 1.2, jHiddenLotus: 1.2 } } },
  { id: 'tPEuphoria', owner: 'prodigy', branch: 'youth', tier: 6, cost: 2, requiresAll: ['tLeafHurricane', 'tDrunkenFist'], mods: { techDamageMult: { jDrunkenFist: 1.2, jLeafHurricane: 1.2 } } },
  { id: 'tPLooseStrike', owner: 'prodigy', branch: 'drunken', tier: 6, cost: 2, requiresAll: ['tDrunkenFist', 'tTaijutsuMaster'], mods: { typePen: { taijutsu: 0.15 } } },
  { id: 'tPDiscipline', owner: 'prodigy', branch: 'training', tier: 6, cost: 2, requiresAll: ['tTaijutsuMaster', 'tPRivalSpirit'], mods: { evasion: 0.08, taijutsuFlat: 2 } },
  { id: 'tPNeverLose', owner: 'prodigy', branch: 'rivalry', tier: 6, cost: 2, requiresAll: ['tPRivalSpirit', 'tPFieldLesson'], teamMods: { duelDamageMult: 1.1 } },
  { id: 'tPSharedFire', owner: 'prodigy', branch: 'mentor', tier: 6, cost: 2, requiresAll: ['tPFieldLesson', 'tPrimaryLotus'], teamMods: { startShieldPct: 0.05 } },
  // Assinaturas: o talento final de um ramo e a junção do outro.
  { id: 'tPPerfectLotus', owner: 'prodigy', branch: 'gates', tier: 7, cost: 3, requiresAll: ['tPUnbound', 'tPRivalSpirit'], mods: { hpCostFreeAtGate: 5 } },
  { id: 'tPDrunkenHurricane', owner: 'prodigy', branch: 'drunken', tier: 7, cost: 3, requiresAll: ['tPTrueDrunk', 'tLeafHurricane'], mods: { techExtraHits: { jLeafHurricane: 1 }, critBonus: 0.1 } },
  { id: 'tPSharedVigor', owner: 'prodigy', branch: 'mentor', tier: 7, cost: 3, requiresAll: ['tPMasterLesson', 'tLeafHurricane'], teamMods: { regenHp: 2 } },

  // Uchiha (Caminho Ninja), refeito na v0.86.0 no molde do Comum: seis ramos em anel (Sharingan, Fogo do clã, Ilusões,
  // Armas do clã, Orgulho do clã, Polícia do clã), bifurcação e talento final em cada, seis combinações e três
  // assinaturas. Personagem genérico do clã. O ramo do Sasuke (easter egg da conta) e o ramo Raio saíram: o Sasuke vai
  // ganhar a própria História.
  // Sharingan (leitura). Final: com o Sharingan ligado, chance de anular o golpe recebido.
  { id: 'tSharingan3', owner: 'uchihaNinja', branch: 'sharingan', tier: 1, cost: 1, learn: 'jSharingan3' },
  { id: 'tCopyEye', owner: 'uchihaNinja', branch: 'sharingan', tier: 2, col: -1, cost: 2, excludes: ['tInsight'], mods: { critBonus: 0.05, accuracyBonus: 0.05 } },
  { id: 'tInsight', owner: 'uchihaNinja', branch: 'sharingan', tier: 2, col: 1, cost: 2, excludes: ['tCopyEye'], mods: { evasion: 0.08 } },
  { id: 'tUReading', owner: 'uchihaNinja', branch: 'sharingan', tier: 3, cost: 2, requires: ['tCopyEye', 'tInsight'], mods: { accuracyBonus: 0.05, evasion: 0.05 } },
  { id: 'tSharinganFlow', owner: 'uchihaNinja', branch: 'sharingan', tier: 4, cost: 2, mods: { damageMult: 1.1, regenHp: 2 } },
  { id: 'tUTotalRead', owner: 'uchihaNinja', branch: 'sharingan', tier: 5, cost: 3, capstone: true, mods: { readNullChance: 0.3 } },
  // Fogo do clã (dano em área). Final: a queimadura dói em dobro e dura mais.
  { id: 'tPhoenix', owner: 'uchihaNinja', branch: 'fire', tier: 1, cost: 1, learn: 'jPhoenixFlower', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jPhoenixFlower: 1.2 } } },
  { id: 'tFirePower', owner: 'uchihaNinja', branch: 'fire', tier: 2, col: -1, cost: 2, excludes: ['tUQuickSpark'], mods: { typeDamageMult: { ninjutsu: 1.15 } } },
  { id: 'tUQuickSpark', owner: 'uchihaNinja', branch: 'fire', tier: 2, col: 1, cost: 2, excludes: ['tFirePower'], mods: { chakraDiscount: 1, effectChanceBonus: 0.1 } },
  { id: 'tGreatBlazeU', owner: 'uchihaNinja', branch: 'fire', tier: 3, cost: 2, requires: ['tFirePower', 'tUQuickSpark'], learn: 'jGreatBlaze' },
  { id: 'tFireMaster', owner: 'uchihaNinja', branch: 'fire', tier: 4, cost: 2, mods: { chakraDiscount: 1 } },
  { id: 'tUEternalFlame', owner: 'uchihaNinja', branch: 'fire', tier: 5, cost: 3, capstone: true, mods: { burnMult: 2, effectTurnsBonus: 1 } },
  // Ilusões (controle). Final: genjutsu contra alvo controlado não erra e todo golpe nele bate mais.
  { id: 'tCrow', owner: 'uchihaNinja', branch: 'illusions', tier: 1, cost: 1, learn: 'jCrowIllusion', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jCrowIllusion: 1.2 } } },
  { id: 'tFearGaze', owner: 'uchihaNinja', branch: 'illusions', tier: 2, col: -1, cost: 2, excludes: ['tUPrison'], mods: { fearOnHit: 0.2 } },
  { id: 'tUPrison', owner: 'uchihaNinja', branch: 'illusions', tier: 2, col: 1, cost: 2, excludes: ['tFearGaze'], mods: { genjutsuStunChance: 0.2 } },
  { id: 'tGenjutsuPower', owner: 'uchihaNinja', branch: 'illusions', tier: 3, cost: 2, requires: ['tFearGaze', 'tUPrison'], mods: { typeDamageMult: { genjutsu: 1.25 } } },
  { id: 'tTsukuyomi', owner: 'uchihaNinja', branch: 'illusions', tier: 4, cost: 2, learn: 'jTsukuyomi' },
  { id: 'tUIllusionWorld', owner: 'uchihaNinja', branch: 'illusions', tier: 5, cost: 3, capstone: true, mods: { illusionSureHit: true, controlledDamageMult: 1.35 } },
  // Armas do clã (precisão). Final: as técnicas de arma acertam também os outros inimigos.
  // A técnica vem na junção: na raiz, 3 golpes baratos logo no começo dominavam a run (medição v0.86.0, como o Punho
  // Bêbado do prodígio).
  { id: 'tUQuickHands', owner: 'uchihaNinja', branch: 'weapons', tier: 1, cost: 1, mods: { techChakraDiscount: { jUWindmill: 1, jWireTrap: 1 }, accuracyBonus: 0.05 } },
  { id: 'tUTwinShuriken', owner: 'uchihaNinja', branch: 'weapons', tier: 2, col: -1, cost: 2, excludes: ['tUSteelWire'], mods: { techExtraHits: { jUWindmill: 1 } } },
  { id: 'tUSteelWire', owner: 'uchihaNinja', branch: 'weapons', tier: 2, col: 1, cost: 2, excludes: ['tUTwinShuriken'], learn: 'jWireTrap' },
  { id: 'tUWindmill', owner: 'uchihaNinja', branch: 'weapons', tier: 3, cost: 2, requires: ['tUTwinShuriken', 'tUSteelWire'], learn: 'jUWindmill', maxRank: 3, rankCost: 1, rankMods: { techDamageMult: { jUWindmill: 1.25 } } },
  { id: 'tUSharpEdge', owner: 'uchihaNinja', branch: 'weapons', tier: 4, cost: 2, mods: { taijutsuFlat: 2, critBonus: 0.05 } },
  { id: 'tUShurikenRain', owner: 'uchihaNinja', branch: 'weapons', tier: 5, cost: 3, capstone: true, mods: { techSplash: { jUWindmill: 0.5, jWireTrap: 0.5 } } },
  // Orgulho do clã (duelo e vingança). Final: no aperto ou com um aliado caído, bate muito mais.
  { id: 'tUClanPride', owner: 'uchihaNinja', branch: 'pride', tier: 1, cost: 1, mods: { damageMult: 1.08 } },
  { id: 'tUCold', owner: 'uchihaNinja', branch: 'pride', tier: 2, col: -1, cost: 2, excludes: ['tURage'], mods: { critBonus: 0.08 } },
  { id: 'tURage', owner: 'uchihaNinja', branch: 'pride', tier: 2, col: 1, cost: 2, excludes: ['tUCold'], mods: { lowHpDamageMult: 1.3 } },
  { id: 'tUColdEyes', owner: 'uchihaNinja', branch: 'pride', tier: 3, cost: 2, requires: ['tUCold', 'tURage'], mods: { accuracyBonus: 0.05, critBonus: 0.05 } },
  { id: 'tUWoundedPride', owner: 'uchihaNinja', branch: 'pride', tier: 4, cost: 2, mods: { guardHealPct: 0.08, regenHp: 1 } },
  { id: 'tUVengeance', owner: 'uchihaNinja', branch: 'pride', tier: 5, cost: 3, capstone: true, mods: { vengeanceMult: 1.5 } },
  // Polícia do clã (suporte e ordem). Final: quem a equipe controla leva mais dano de todos.
  { id: 'tUPatrol', owner: 'uchihaNinja', branch: 'police', tier: 1, cost: 1, teamMods: { accuracyBonus: 0.05 } },
  { id: 'tUWatch', owner: 'uchihaNinja', branch: 'police', tier: 2, col: -1, cost: 2, excludes: ['tUInterrogation'], allyHpPct: 0.1 },
  { id: 'tUInterrogation', owner: 'uchihaNinja', branch: 'police', tier: 2, col: 1, cost: 2, excludes: ['tUWatch'], mods: { effectTurnsBonus: 1 } },
  { id: 'tUClanDiscipline', owner: 'uchihaNinja', branch: 'police', tier: 3, cost: 2, requires: ['tUWatch', 'tUInterrogation'], teamMods: { critBonus: 0.05, damageMult: 1.1 } },
  { id: 'tUCustody', owner: 'uchihaNinja', branch: 'police', tier: 4, cost: 2, teamMods: { effectChanceBonus: 0.1 } },
  { id: 'tUClanOrder', owner: 'uchihaNinja', branch: 'police', tier: 5, cost: 3, capstone: true, teamMods: { controlledDamageMult: 1.3 } },
  // Combinações (anel).
  { id: 'tUFlameEye', owner: 'uchihaNinja', branch: 'sharingan', tier: 6, cost: 2, requiresAll: ['tUReading', 'tGreatBlazeU'], mods: { accuracyBonus: 0.05, typeDamageMult: { ninjutsu: 1.1 } } },
  { id: 'tUIllusoryFlame', owner: 'uchihaNinja', branch: 'fire', tier: 6, cost: 2, requiresAll: ['tGreatBlazeU', 'tGenjutsuPower'], mods: { fearOnHit: 0.1 } },
  { id: 'tUIllusoryBlade', owner: 'uchihaNinja', branch: 'illusions', tier: 6, cost: 2, requiresAll: ['tGenjutsuPower', 'tUWindmill'], mods: { stunnedAlwaysCrit: true } },
  { id: 'tUColdPrecision', owner: 'uchihaNinja', branch: 'weapons', tier: 6, cost: 2, requiresAll: ['tUWindmill', 'tUColdEyes'], mods: { critBonus: 0.1 } },
  { id: 'tUClanHonor', owner: 'uchihaNinja', branch: 'pride', tier: 6, cost: 2, requiresAll: ['tUColdEyes', 'tUClanDiscipline'], teamMods: { lowHpDamageMult: 1.1 } },
  { id: 'tUVigilance', owner: 'uchihaNinja', branch: 'police', tier: 6, cost: 2, requiresAll: ['tUClanDiscipline', 'tUReading'], teamMods: { evasion: 0.05 } },
  // Assinaturas.
  { id: 'tUIllusoryInferno', owner: 'uchihaNinja', branch: 'fire', tier: 7, cost: 3, requiresAll: ['tUEternalFlame', 'tGenjutsuPower'], mods: { burningDamageMult: 1.3 } },
  { id: 'tUBladeReading', owner: 'uchihaNinja', branch: 'sharingan', tier: 7, cost: 3, requiresAll: ['tUTotalRead', 'tUWindmill'], mods: { readCounterDamage: 8 } },
  { id: 'tUVengefulEyes', owner: 'uchihaNinja', branch: 'pride', tier: 7, cost: 3, requiresAll: ['tUVengeance', 'tUReading'], mods: { vengeanceAccuracy: 0.2 } },

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
