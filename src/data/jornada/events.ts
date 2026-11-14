import { SHOP_CURSE, type EventDef } from '../../core/jornada/events';

// Eventos da História (docs/jornada/historia.md#eventos). Textos em strings/jornada.ts.
// Marcas (`flag`) ligam um evento a outro: ajudar o Tazuna dá desconto no mercador do País das Ondas.
// `face` é quem aparece no quadro da cena (só apresentação; quem não tem ficha fica com o rosto de quem está junto).

export const events: EventDef[] = [
  {
    id: 'graduation',
    category: 'narrative',
    face: 'iruka',
    options: [
      // A bandana do Iruka toma o lugar dos óculos de aviador nas duas escolhas.
      { id: 'ramen', effects: [{ kind: 'storyRelic', id: 'irukaHeadband' }, { kind: 'healFull' }, { kind: 'ryo', n: 15 }] },
      { id: 'train', effects: [{ kind: 'storyRelic', id: 'irukaHeadband' }, { kind: 'talent', n: 1 }] },
    ],
  },
  {
    id: 'tazuna',
    category: 'narrative',
    face: 'kakashiAlly',
    options: [
      { id: 'protect', effects: [{ kind: 'flag', id: 'helpedTazuna' }, { kind: 'ryo', n: 20 }] },
      { id: 'charge', effects: [{ kind: 'ryo', n: 45 }] },
    ],
  },
  {
    id: 'treeClimbing',
    category: 'training',
    face: 'kakashiAlly',
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
    category: 'narrative',
    face: 'naruto',
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
    category: 'narrative',
    face: 'kakashiAlly',
    options: [
      { id: 'ebisu', effects: [{ kind: 'xp', n: 80 }] },
      { id: 'hospital', effects: [{ kind: 'healTeam', hp: 50, chakra: 15 }, { kind: 'item', id: 'hpKit', n: 1 }] },
    ],
  },
  {
    id: 'toadSummon',
    category: 'training',
    face: 'jiraiya',
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
    category: 'narrative',
    face: 'sasuke',
    options: [
      { id: 'chase', effects: [{ kind: 'xp', n: 50 }, { kind: 'maxStat', who: 'team', stat: 'hp', n: 6 }] },
      { id: 'stay', effects: [{ kind: 'healTeam', hp: 40, chakra: 12 }, { kind: 'ryo', n: 20 }] },
    ],
  },
  {
    id: 'rasenganTraining',
    category: 'training',
    face: 'jiraiya',
    options: [
      // Rasengan III (bola de borracha): o Rasengan vem de qualquer jeito (marco da campanha).
      { id: 'ball', minigame: 'seals', effects: [{ kind: 'talent', n: 1 }], onLose: [{ kind: 'xp', n: 30 }] },
      { id: 'allNight', effects: [{ kind: 'xp', n: 40 }, { kind: 'hurtTeam', pct: 0.15 }] },
    ],
  },
  {
    id: 'sasukeLeft',
    category: 'narrative',
    face: 'sakura',
    options: [
      { id: 'promise', effects: [{ kind: 'talent', n: 1 }, { kind: 'healTeam', hp: 50, chakra: 15 }] },
      { id: 'jokenpo', minigame: 'jokenpo', effects: [{ kind: 'relic', tier: 'event' }], onLose: [{ kind: 'ryo', n: 20 }] },
    ],
  },
  // Cronologia da v0.68.0 (docs/jornada/cronologia.md): treinos, cenas presenciadas e narrativas novas.
  // Toda escolha tem pelo menos duas opções (v0.70.0). Treino: o minijogo (prêmio maior se acertar) ou a insistência
  // (prêmio certo, com custo de HP). Cena presenciada: duas reações do Naruto, de valor parecido e tipos diferentes; a
  // primeira é o prêmio que a cena já dava.
  {
    // O pergaminho proibido: o Kage Bunshin vem de qualquer jeito (marco da campanha).
    id: 'sealScroll',
    category: 'training',
    face: 'mizuki',
    options: [
      { id: 'scroll', minigame: 'seals', effects: [{ kind: 'xp', n: 20 }], onLose: [{ kind: 'xp', n: 10 }] },
      { id: 'stubborn', effects: [{ kind: 'xp', n: 12 }, { kind: 'hurtTeam', pct: 0.1 }] },
    ],
  },
  {
    id: 'team7',
    category: 'narrative',
    face: 'kakashiAlly',
    options: [
      { id: 'hokage', effects: [{ kind: 'talent', n: 1 }] },
      { id: 'rival', effects: [{ kind: 'xp', n: 40 }] },
    ],
  },
  {
    id: 'hakuForest',
    category: 'narrative',
    face: 'haku',
    options: [
      { id: 'precious', effects: [{ kind: 'healTeam', hp: 30, chakra: 9 }] },
      { id: 'stronger', effects: [{ kind: 'talent', n: 1 }] },
    ],
  },
  {
    id: 'hakuFarewell',
    category: 'witness',
    face: 'zabuza',
    options: [
      { id: 'ownWay', effects: [{ kind: 'talent', n: 1 }] },
      { id: 'bury', effects: [{ kind: 'healTeam', hp: 50, chakra: 15 }, { kind: 'xp', n: 20 }] },
    ],
  },
  {
    // Quem guarda os movimentos da areia entra na luta do Gaara já sabendo desviar dela (marca `viuGaara`).
    id: 'leeGaara',
    category: 'witness',
    face: 'gaara',
    options: [
      { id: 'watch', effects: [{ kind: 'xp', n: 40 }, { kind: 'flag', id: 'viuGaara' }] },
      { id: 'visit', effects: [{ kind: 'healTeam', hp: 40, chakra: 12 }, { kind: 'item', id: 'hpKit', n: 1 }] },
    ],
  },
  {
    id: 'hinataOintment',
    category: 'narrative',
    face: 'naruto',
    options: [
      { id: 'thanks', effects: [{ kind: 'healTeam', hp: 40, chakra: 0 }] },
      { id: 'weird', effects: [{ kind: 'item', id: 'hpKit', n: 1 }] },
    ],
  },
  {
    // A promessa liga a determinação na luta contra o Neji (marca `promessaNeji`).
    id: 'hinataNeji',
    category: 'witness',
    face: 'neji',
    options: [
      { id: 'promise', effects: [{ kind: 'flag', id: 'promessaNeji' }] },
      { id: 'carry', effects: [{ kind: 'healTeam', hp: 40, chakra: 12 }, { kind: 'xp', n: 30 }] },
    ],
  },
  {
    id: 'jiraiyaJourney',
    category: 'narrative',
    face: 'jiraiya',
    options: [
      { id: 'teach', effects: [{ kind: 'xp', n: 40 }] },
      { id: 'find', effects: [{ kind: 'ryo', n: 20 }] },
    ],
  },
  {
    id: 'rasengan1',
    category: 'training',
    face: 'jiraiya',
    options: [
      { id: 'water', minigame: 'seals', effects: [{ kind: 'talent', n: 1 }], onLose: [{ kind: 'xp', n: 30 }] },
      { id: 'grind', effects: [{ kind: 'xp', n: 40 }, { kind: 'hurtTeam', pct: 0.1 }] },
    ],
  },
  {
    id: 'rasengan2',
    category: 'training',
    face: 'jiraiya',
    options: [
      { id: 'rubber', minigame: 'seals', effects: [{ kind: 'talent', n: 1 }], onLose: [{ kind: 'xp', n: 30 }] },
      { id: 'grind', effects: [{ kind: 'xp', n: 40 }, { kind: 'hurtTeam', pct: 0.1 }] },
    ],
  },
  {
    id: 'tsunade',
    category: 'narrative',
    face: 'tsunade',
    options: [
      { id: 'challenge', effects: [{ kind: 'maxStat', who: 'hero', stat: 'hp', n: 10 }] },
      { id: 'bet', effects: [{ kind: 'ryo', n: 40 }] },
    ],
  },
  {
    // A Tsunade entrega o colar do Primeiro Hokage nas duas escolhas (toma o lugar da bandana do Iruka).
    id: 'sannin',
    category: 'witness',
    face: 'tsunade',
    options: [
      { id: 'thank', effects: [{ kind: 'storyRelic', id: 'firstHokageNecklace' }, { kind: 'healFull' }, { kind: 'talent', n: 1 }] },
      { id: 'spar', effects: [{ kind: 'storyRelic', id: 'firstHokageNecklace' }, { kind: 'talent', n: 1 }, { kind: 'maxStat', who: 'hero', stat: 'hp', n: 8 }] },
    ],
  },
  {
    id: 'chojiStays',
    category: 'witness',
    face: 'choji',
    options: [
      { id: 'pills', effects: [{ kind: 'item', id: 'chakraKit', n: 1 }] },
      { id: 'promise', effects: [{ kind: 'xp', n: 40 }] },
    ],
  },
  {
    id: 'nejiStays',
    category: 'witness',
    face: 'nejiAlly',
    options: [
      { id: 'trust', effects: [{ kind: 'xp', n: 50 }] },
      { id: 'kit', effects: [{ kind: 'item', id: 'hpKit', n: 1 }] },
    ],
  },
  {
    id: 'shikamaruStays',
    category: 'witness',
    face: 'shikamaru',
    options: [
      { id: 'go', effects: [{ kind: 'talent', n: 1 }] },
      { id: 'plan', effects: [{ kind: 'xp', n: 50 }] },
    ],
  },
  {
    id: 'kibaStays',
    category: 'witness',
    face: 'kibaAlly',
    options: [
      { id: 'kit', effects: [{ kind: 'item', id: 'hpKit', n: 1 }] },
      { id: 'shout', effects: [{ kind: 'xp', n: 40 }] },
    ],
  },
  {
    id: 'valleyTalk',
    category: 'narrative',
    face: 'sasuke',
    options: [
      { id: 'friend', effects: [{ kind: 'flag', id: 'valleyFriend' }] },
      { id: 'force', effects: [{ kind: 'flag', id: 'valleyForce' }] },
    ],
  },
  {
    // A última fala muda o texto da tela de vitória (marcas `endPromise` e `endStronger`).
    id: 'returnKonoha',
    category: 'witness',
    face: 'kakashiAlly',
    options: [
      { id: 'promise', effects: [{ kind: 'flag', id: 'endPromise' }] },
      { id: 'stronger', effects: [{ kind: 'flag', id: 'endStronger' }] },
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
      // Sem ryō e sem a velhinha, ainda há escolha (toda escolha tem pelo menos duas opções, v0.70.0).
      { id: 'dishes', effects: [{ kind: 'healTeam', hp: 30, chakra: 9 }] },
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
      // Sem a maldição, a escolha é entre descansar e treinar a concentração (pelo menos duas opções, v0.70.0).
      { id: 'meditate', effects: [{ kind: 'xp', n: 25 }] },
    ],
  },
];

export const eventsById: Record<string, EventDef> = Object.fromEntries([...events, ...genericEvents].map((e) => [e.id, e]));
