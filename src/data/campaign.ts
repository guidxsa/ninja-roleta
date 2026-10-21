export type Stage =
  // Mais de um vilão = lutas em sequência, HP carrega. `rewardTier`: 1 comum, 2 raro, 3 lendário.
  | { kind: 'fight'; villains: string[]; rewardTier: number }
  // Estrutura em aberto (ver CLAUDE.md). Proposta: lutas avulsas, sem game over nem item de retorno.
  | { kind: 'exam'; villains: string[] };

export const campaign: Stage[] = [
  { kind: 'fight', villains: ['mizuki'], rewardTier: 1 },
  { kind: 'fight', villains: ['zabuza', 'haku'], rewardTier: 1 },
  { kind: 'exam', villains: ['examSand', 'examSound', 'examLeaf'] },
  { kind: 'fight', villains: ['gaara'], rewardTier: 2 },
  { kind: 'fight', villains: ['jirobo', 'kidomaru', 'tayuya', 'sakon'], rewardTier: 2 },
  { kind: 'fight', villains: ['kabuto'], rewardTier: 3 },
  { kind: 'fight', villains: ['orochimaru'], rewardTier: 3 },
];
