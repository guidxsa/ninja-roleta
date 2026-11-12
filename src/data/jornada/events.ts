import { SHOP_CURSE, type EventDef } from '../../core/jornada/events';

// Eventos da História (docs/jornada/historia.md#eventos). Textos em strings/jornada.ts.
// Marcas (`flag`) ligam um evento a outro: ajudar o Tazuna dá desconto no mercador do País das Ondas.

export const events: EventDef[] = [
  {
    id: 'graduation',
    options: [
      { id: 'ramen', effects: [{ kind: 'healFull' }, { kind: 'ryo', n: 15 }] },
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
      { id: 'rest', effects: [{ kind: 'healTeam', hp: 30, chakra: 9 }] },
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
      { id: 'hospital', effects: [{ kind: 'healTeam', hp: 50, chakra: 15 }, { kind: 'item', id: 'hpKit', n: 1 }] },
    ],
  },
  {
    id: 'toadSummon',
    options: [
      // O contrato vem de qualquer jeito (marco); a escolha é o bônus.
      {
        id: 'summon',
        minigame: 'seals',
        effects: [{ kind: 'relic', tier: 'event' }],
        onLose: [{ kind: 'xp', n: 30 }],
      },
      { id: 'peek', effects: [{ kind: 'ryo', n: 30 }, { kind: 'flag', id: 'peeked' }] },
    ],
  },
  {
    // Itachi e Kisame vêm atrás do Naruto; o Sasuke o enfrenta na pousada e o Jiraiya intervém (cap. 139 a 147).
    id: 'itachiKisame',
    options: [
      { id: 'chase', effects: [{ kind: 'xp', n: 50 }, { kind: 'maxStat', who: 'team', stat: 'hp', n: 6 }] },
      { id: 'stay', effects: [{ kind: 'healTeam', hp: 40, chakra: 12 }, { kind: 'ryo', n: 20 }] },
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
      { id: 'promise', effects: [{ kind: 'talent', n: 1 }, { kind: 'healTeam', hp: 50, chakra: 15 }] },
      { id: 'jokenpo', minigame: 'jokenpo', effects: [{ kind: 'relic', tier: 'event' }], onLose: [{ kind: 'ryo', n: 20 }] },
    ],
  },
];

/** Eventos do Caminho Ninja (docs/jornada/caminho-ninja.md#eventos), sorteados pelo desconhecido. */
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
      { id: 'eat', cost: 15, effects: [{ kind: 'healTeam', hp: 60, chakra: 18 }] },
      { id: 'grateful', requires: 'helpedOldLady', effects: [{ kind: 'healTeam', hp: 60, chakra: 18 }] },
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
      { id: 'contract', minigame: 'seals', effects: [{ kind: 'relic', tier: 'event' }], onLose: [{ kind: 'hurtTeam', pct: 0.1 }] },
      { id: 'share', effects: [{ kind: 'maxStat', who: 'team', stat: 'hp', n: 6 }] },
    ],
  },
  // Má sorte (v0.62.0): a maldição do mercador faz cada compra encarecer a loja até sair (santuário ou amuleto da loja).
  {
    id: 'gBadOmen',
    options: [
      { id: 'bargain', effects: [{ kind: 'ryo', n: 35 }, { kind: 'curse' }] },
      { id: 'ward', minigame: 'seals', effects: [{ kind: 'xp', n: 20 }], onLose: [{ kind: 'curse' }] },
    ],
  },
  {
    id: 'gShrine',
    options: [
      { id: 'purify', requires: SHOP_CURSE, effects: [{ kind: 'cleanse' }] },
      { id: 'pray', effects: [{ kind: 'healTeam', hp: 30, chakra: 9 }] },
    ],
  },
];

export const eventsById: Record<string, EventDef> = Object.fromEntries([...events, ...genericEvents].map((e) => [e.id, e]));
