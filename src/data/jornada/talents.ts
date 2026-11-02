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
];
