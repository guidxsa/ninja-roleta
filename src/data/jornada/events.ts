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

export const eventsById: Record<string, EventDef> = Object.fromEntries(events.map((e) => [e.id, e]));
