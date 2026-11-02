import type { EventDef } from '../../core/jornada/events';

// Eventos da run canônica (docs/jornada/canonica.md#eventos). Textos em strings/jornada.ts.
// Marcas (`flag`) ligam um evento a outro: ajudar o Tazuna dá desconto no mercador do País das Ondas.

export const events: EventDef[] = [
  {
    id: 'graduation',
    options: [
      { id: 'ramen', effects: [{ kind: 'healTeam', pct: 1 }, { kind: 'ryo', n: 15 }] },
      { id: 'train', effects: [{ kind: 'talent', n: 1 }] },
    ],
  },
  {
    id: 'tazuna',
    options: [
      { id: 'protect', effects: [{ kind: 'flag', id: 'helpedTazuna' }, { kind: 'ryo', n: 20 }] },
      { id: 'charge', effects: [{ kind: 'ryo', n: 45 }] },
    ],
  },
  {
    id: 'treeClimbing',
    options: [
      {
        id: 'climb',
        minigame: 'seals',
        effects: [{ kind: 'maxStat', who: 'team', stat: 'chakra', n: 6 }, { kind: 'xp', n: 40 }],
        onLose: [{ kind: 'maxStat', who: 'team', stat: 'chakra', n: 2 }],
      },
      { id: 'rest', effects: [{ kind: 'healTeam', pct: 0.3 }] },
    ],
  },
  {
    id: 'writtenTest',
    options: [
      {
        id: 'cheat',
        minigame: 'memory',
        effects: [{ kind: 'talent', n: 1 }, { kind: 'ryo', n: 20 }],
        onLose: [{ kind: 'ryo', n: 5 }],
      },
      { id: 'tenth', effects: [{ kind: 'talent', n: 1 }] },
    ],
  },
  {
    id: 'preliminaries',
    options: [
      { id: 'ebisu', effects: [{ kind: 'xp', n: 80 }] },
      { id: 'hospital', effects: [{ kind: 'healTeam', pct: 0.5 }, { kind: 'item', id: 'hpKit', n: 1 }] },
    ],
  },
  {
    id: 'toadSummon',
    options: [
      {
        id: 'summon',
        minigame: 'seals',
        effects: [{ kind: 'relic', tier: 'rare' }],
        onLose: [{ kind: 'ryo', n: 20 }],
      },
      { id: 'peek', effects: [{ kind: 'ryo', n: 30 }, { kind: 'flag', id: 'peeked' }] },
    ],
  },
  {
    id: 'rasenganTraining',
    options: [
      {
        id: 'balloon',
        minigame: 'seals',
        effects: [{ kind: 'talent', n: 2 }],
        onLose: [{ kind: 'talent', n: 1 }],
      },
      { id: 'bet', effects: [{ kind: 'ryo', n: 40 }, { kind: 'maxStat', who: 'hero', stat: 'hp', n: 10 }] },
    ],
  },
  {
    id: 'sasukeLeft',
    options: [
      { id: 'promise', effects: [{ kind: 'talent', n: 1 }, { kind: 'healTeam', pct: 0.5 }] },
      { id: 'jokenpo', minigame: 'jokenpo', effects: [{ kind: 'relic', tier: 'legendary' }], onLose: [{ kind: 'ryo', n: 20 }] },
    ],
  },
];

/** Eventos das runs genéricas (docs/jornada/generica.md#eventos), sorteados pelo desconhecido. */
export const genericEvents: EventDef[] = [
  {
    id: 'gOldLady',
    options: [
      { id: 'help', effects: [{ kind: 'flag', id: 'helpedOldLady' }, { kind: 'item', id: 'hpKit', n: 1 }] },
      { id: 'ignore', effects: [{ kind: 'ryo', n: 15 }] },
    ],
  },
  {
    id: 'gRamen',
    options: [
      { id: 'eat', cost: 15, effects: [{ kind: 'healTeam', pct: 0.6 }] },
      { id: 'grateful', requires: 'helpedOldLady', effects: [{ kind: 'healTeam', pct: 0.6 }] },
      { id: 'skip', effects: [{ kind: 'xp', n: 20 }] },
    ],
  },
  {
    id: 'gTraining',
    options: [
      { id: 'seals', minigame: 'seals', effects: [{ kind: 'talent', n: 1 }, { kind: 'xp', n: 30 }], onLose: [{ kind: 'xp', n: 30 }] },
      { id: 'spar', effects: [{ kind: 'xp', n: 60 }, { kind: 'hurtTeam', pct: 0.15 }] },
    ],
  },
  {
    id: 'gJokenpo',
    options: [
      { id: 'play', minigame: 'jokenpo', effects: [{ kind: 'relic', tier: 'rare' }], onLose: [{ kind: 'ryo', n: 10 }] },
      { id: 'decline', effects: [{ kind: 'ryo', n: 20 }] },
    ],
  },
  {
    id: 'gGuru',
    options: [
      { id: 'pay', cost: 40, effects: [{ kind: 'talent', n: 2 }] },
      { id: 'test', minigame: 'memory', effects: [{ kind: 'talent', n: 1 }], onLose: [] },
      { id: 'leave', effects: [] },
    ],
  },
  {
    id: 'gAkatsuki',
    options: [
      { id: 'hide', minigame: 'memory', effects: [{ kind: 'ryo', n: 40 }, { kind: 'flag', id: 'hidFromAkatsuki' }], onLose: [{ kind: 'hurtTeam', pct: 0.3 }] },
      { id: 'run', effects: [{ kind: 'hurtTeam', pct: 0.15 }] },
    ],
  },
  {
    id: 'gFoundItem',
    options: [
      { id: 'pills', effects: [{ kind: 'item', id: 'reviveKit', n: 1 }] },
      { id: 'scroll', effects: [{ kind: 'xp', n: 50 }] },
    ],
  },
  {
    id: 'gSummon',
    options: [
      { id: 'contract', minigame: 'seals', effects: [{ kind: 'relic', tier: 'rare' }], onLose: [{ kind: 'hurtTeam', pct: 0.1 }] },
      { id: 'share', effects: [{ kind: 'maxStat', who: 'team', stat: 'hp', n: 6 }] },
    ],
  },
];

export const eventsById: Record<string, EventDef> = Object.fromEntries([...events, ...genericEvents].map((e) => [e.id, e]));
