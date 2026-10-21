export type Stage =
  | { kind: 'fight'; villains: string[] } // mais de um vilão = lutas em sequência, HP carrega
  | { kind: 'exam' }; // estrutura em aberto (ver CLAUDE.md)

export const campaign: Stage[] = [
  { kind: 'fight', villains: ['mizuki'] },
  { kind: 'fight', villains: ['zabuza', 'haku'] },
  { kind: 'exam' },
  { kind: 'fight', villains: ['gaara'] },
  { kind: 'fight', villains: ['jirobo', 'kidomaru', 'tayuya', 'sakon'] },
  { kind: 'fight', villains: ['kabuto'] },
  { kind: 'fight', villains: ['orochimaru'] },
];
