// Ordem da campanha (docs/campanha.md). Toda luta começa com o jogador restaurado.
// `rewardTiers`: raridade da recompensa depois de cada luta (1 comum, 2 rara, 3 lendária, null = nenhuma).
// Nos blocos, a roleta pré-vilão gira uma vez antes da primeira luta.
export type Stage =
  | { kind: 'fight'; villains: string[]; rewardTiers: (number | null)[] }
  // Exame chunin: sem game over nem Vontade do Fogo; a recompensa vem do número de vitórias.
  | { kind: 'exam'; villains: string[] };

export const campaign: Stage[] = [
  { kind: 'fight', villains: ['mizuki'], rewardTiers: [1] },
  { kind: 'fight', villains: ['haku', 'zabuza'], rewardTiers: [1, 2] },
  { kind: 'exam', villains: ['examSand', 'examSound', 'examLeaf'] },
  { kind: 'fight', villains: ['gaara'], rewardTiers: [2] },
  { kind: 'fight', villains: ['jirobo', 'kidomaru', 'tayuya', 'sakon'], rewardTiers: [null, null, null, 2] },
  { kind: 'fight', villains: ['kabuto'], rewardTiers: [3] },
  // Chefe final: fim da run, sem recompensa.
  { kind: 'fight', villains: ['orochimaru'], rewardTiers: [null] },
];
