import type { StageDef } from '../../core/jornada/trail';

// História do Naruto (docs/jornada/cronologia.md): a jornada dele, na ordem do mangá. Entra o que o Naruto vive,
// presencia ou descobre; luta de outros personagens vira cena presenciada (evento sem escolha). Linear, sem escolha de
// caminho. Os roteiros das lutas (falas, formas, fases) seguem docs/jornada/roteiro.md.

export const stages: StageDef[] = [
  {
    id: 'waves',
    team: ['sasuke', 'sakura'],
    scene: 'forest',
    stops: [
      { kind: 'event', id: 'sealScroll', scene: 'konoha', event: 'sealScroll' },
      // Mizuki: o Iruka se joga na frente da Fūma Shuriken; o Naruto responde com centenas de clones.
      {
        kind: 'story',
        id: 'mizuki',
        scene: 'konoha',
        enemies: ['mizuki'],
        team: [],
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'mizuki', line: 'mizukiStart' }, { do: 'enter', who: 'iruka' }] },
          {
            when: { on: 'hpBelow', who: 'mizuki', pct: 0.6 },
            do: [
              { do: 'say', who: 'mizuki', line: 'mizukiShuriken' },
              { do: 'knock', who: 'iruka' },
              { do: 'say', who: 'iruka', line: 'irukaShield' },
              { do: 'say', who: 'naruto', line: 'mizukiClones' },
              { do: 'form', who: 'naruto', form: 'massClones' },
            ],
          },
        ],
      },
      { kind: 'event', id: 'graduation', scene: 'konoha', event: 'graduation' },
      { kind: 'event', id: 'team7', scene: 'konoha', event: 'team7' },
      // Teste do sino: derrota inevitável. Ninguém pega o sino; a lição libera a raiz do ramo Laços.
      {
        kind: 'story',
        id: 'bells',
        scene: 'konoha',
        enemies: ['kakashi'],
        inevitableLoss: true,
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'kakashi', line: 'bellsStart' }, { do: 'flag', id: 'bellsLesson' }] },
          { when: { on: 'hpBelow', who: 'kakashi', pct: 0.5 }, do: [{ do: 'say', who: 'kakashi', line: 'bellsLog' }, { do: 'end', status: 'lost' }] },
          { when: { on: 'round', round: 4 }, do: [{ do: 'say', who: 'kakashi', line: 'bellsTime' }, { do: 'end', status: 'lost' }] },
        ],
      },
      { kind: 'elite', id: 'demonBrothers', enemies: ['gozu', 'meizu'] },
      { kind: 'event', id: 'tazuna', event: 'tazuna' },
      // Zabuza: o Kakashi preso na Prisão de Água é solto e entra; a Sakura sai para proteger o Tazuna.
      {
        kind: 'elite',
        id: 'zabuza',
        enemies: ['zabuza'],
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'zabuza', line: 'zabuzaStart' }] },
          {
            when: { on: 'hpBelow', who: 'zabuza', pct: 0.6 },
            do: [
              { do: 'say', who: 'sakura', line: 'zabuzaSakura' },
              { do: 'replace', who: 'sakura', with: 'kakashiAlly' },
              { do: 'say', who: 'kakashiAlly', line: 'zabuzaKakashi' },
            ],
          },
        ],
      },
      { kind: 'event', id: 'treeClimbing', event: 'treeClimbing' },
      { kind: 'event', id: 'hakuForest', event: 'hakuForest' },
      // Os capangas do Gatō atacam a casa do Tazuna (a Tsunami e o Inari).
      {
        kind: 'fight',
        id: 'thugs',
        enemies: ['gatoThug', 'gatoThug', 'gatoThug'],
        script: [{ when: { on: 'start' }, do: [{ do: 'say', who: 'narrator', line: 'thugsInari' }] }],
      },
      { kind: 'treasure', id: 'treasure1' },
      { kind: 'rest', id: 'rest1' },
      // Ponte: o Sharingan do Sasuke, o Sasuke cai, a Kyuubi; o Haku se sacrifica e chegam os mercenários do Gatō.
      {
        kind: 'boss',
        id: 'haku',
        enemies: ['haku'],
        team: ['sasuke'],
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'haku', line: 'hakuStart' }] },
          { when: { on: 'hpBelow', who: 'haku', pct: 0.75 }, do: [{ do: 'say', who: 'sasuke', line: 'hakuSharingan' }, { do: 'form', who: 'sasuke', form: 'sharingan' }] },
          // Se o Sasuke ainda estiver de pé, ele se joga na frente do Naruto; se já caiu, a regra seguinte já disparou.
          { when: { on: 'hpBelow', who: 'haku', pct: 0.55 }, do: [{ do: 'knock', who: 'sasuke' }] },
          {
            when: { on: 'down', who: 'sasuke' },
            do: [
              { do: 'say', who: 'sasuke', line: 'hakuSasuke' },
              { do: 'say', who: 'naruto', line: 'hakuRage' },
              { do: 'form', who: 'naruto', form: 'kyuubi' },
              { do: 'flag', id: 'kyuubiAwakened' },
            ],
          },
          {
            when: { on: 'hpBelow', who: 'haku', pct: 0.2 },
            do: [
              { do: 'say', who: 'naruto', line: 'hakuMask' },
              { do: 'say', who: 'narrator', line: 'hakuSacrifice' },
              { do: 'replace', who: 'haku', with: 'gatoMerc' },
              { do: 'enter', who: 'gatoMerc' },
              { do: 'enter', who: 'gatoMerc' },
              { do: 'say', who: 'narrator', line: 'gatoArrives' },
            ],
          },
        ],
      },
      { kind: 'event', id: 'hakuFarewell', event: 'hakuFarewell' },
    ],
  },
  {
    id: 'exam',
    team: ['sasuke', 'sakura'],
    scene: 'arena',
    stops: [
      { kind: 'event', id: 'writtenTest', event: 'writtenTest' },
      // Um dos ninjas da Grama é o Orochimaru disfarçado.
      {
        kind: 'fight',
        id: 'grass',
        scene: 'deathForest',
        enemies: ['grassNinja', 'grassNinja'],
        script: [{ when: { on: 'down', who: 'grassNinja' }, do: [{ do: 'say', who: 'narrator', line: 'grassDisguise' }] }],
      },
      // Orochimaru na Floresta da Morte: resistir; o Sasuke sai com o selo amaldiçoado.
      {
        kind: 'story',
        id: 'orochimaruForest',
        scene: 'deathForest',
        enemies: ['orochimaru'],
        win: { kind: 'survive', rounds: 4, target: 'orochimaru', pct: 0.8 },
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'orochimaru', line: 'orochiStart' }, { do: 'flag', id: 'curseMark' }] },
          { when: { on: 'round', round: 2 }, do: [{ do: 'say', who: 'orochimaru', line: 'orochiMark' }] },
          { when: { on: 'hpBelow', who: 'naruto', pct: 0.5 }, do: [{ do: 'say', who: 'naruto', line: 'orochiNaruto' }, { do: 'form', who: 'naruto', form: 'kyuubiBrief' }] },
        ],
      },
      // Trio do Som: o selo do Sasuke desperta quando ele se fere.
      {
        kind: 'story',
        id: 'forest',
        scene: 'deathForest',
        enemies: ['dosu', 'zaku', 'kin'],
        script: [
          {
            when: { on: 'hpBelow', who: 'sasuke', pct: 0.5 },
            if: { flag: 'curseMark' },
            do: [{ do: 'say', who: 'sasuke', line: 'forestCurse' }, { do: 'form', who: 'sasuke', form: 'curseMark' }],
          },
        ],
      },
      { kind: 'elite', id: 'rainTrio', scene: 'deathForest', enemies: ['rainNinja', 'rainNinja', 'rainNinja'] },
      { kind: 'event', id: 'leeGaara', event: 'leeGaara' },
      { kind: 'story', id: 'kiba', enemies: ['kiba', 'akamaru'], team: [] },
      { kind: 'event', id: 'hinataOintment', event: 'hinataOintment' },
      { kind: 'event', id: 'hinataNeji', event: 'hinataNeji' },
      { kind: 'event', id: 'preliminaries', event: 'preliminaries' },
      { kind: 'event', id: 'toadSummon', event: 'toadSummon' },
      { kind: 'treasure', id: 'treasure2' },
      // Neji fecha os pontos de chakra; o Naruto pede o chakra da Kyuubi. A promessa à Hinata dá determinação.
      {
        kind: 'story',
        id: 'neji',
        enemies: ['neji'],
        team: [],
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'neji', line: 'nejiStart' }] },
          { when: { on: 'start' }, if: { flag: 'promessaNeji' }, do: [{ do: 'say', who: 'naruto', line: 'nejiPromise' }, { do: 'form', who: 'naruto', form: 'resolve' }] },
          { when: { on: 'hpBelow', who: 'naruto', pct: 0.4 }, do: [{ do: 'say', who: 'naruto', line: 'nejiKyuubi' }, { do: 'form', who: 'naruto', form: 'kyuubiBrief' }] },
        ],
      },
      { kind: 'fight', id: 'invasion', scene: 'konoha', enemies: ['soundNinja', 'soundNinja', 'grassNinja'] },
      { kind: 'rest', id: 'rest2', scene: 'konoha' },
      // Gaara em três fases: Gaara, Shukaku contra o Gamabunta (com a Kyuubi), e o Gaara exausto depois da cabeçada.
      {
        kind: 'boss',
        id: 'gaara',
        enemies: ['gaara'],
        team: [],
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'gaara', line: 'gaaraStart' }] },
          { when: { on: 'start' }, if: { flag: 'viuGaara' }, do: [{ do: 'say', who: 'naruto', line: 'gaaraLee' }] },
          {
            when: { on: 'hpBelow', who: 'gaara', pct: 0.4 },
            do: [
              { do: 'say', who: 'gaara', line: 'gaaraShukaku' },
              { do: 'replace', who: 'gaara', with: 'shukaku' },
              { do: 'say', who: 'naruto', line: 'gaaraSummon' },
              { do: 'enter', who: 'gamabuntaAlly' },
              { do: 'form', who: 'naruto', form: 'kyuubi' },
            ],
          },
          {
            when: { on: 'hpBelow', who: 'shukaku', pct: 0.3 },
            do: [
              { do: 'say', who: 'narrator', line: 'gaaraHeadbutt' },
              { do: 'replace', who: 'shukaku', with: 'gaaraWeak' },
              { do: 'leave', who: 'gamabuntaAlly' },
            ],
          },
          { when: { on: 'down', who: 'gaaraWeak' }, do: [{ do: 'say', who: 'naruto', line: 'gaaraBonds' }] },
        ],
      },
    ],
  },
  {
    id: 'sannin',
    // A busca pela Tsunade com o Jiraiya (vol. 16 a 19): o treino do Rasengan em três etapas, a Tsunade e o Kabuto.
    team: ['jiraiya'],
    scene: 'forest',
    stops: [
      { kind: 'event', id: 'jiraiyaJourney', scene: 'konoha', event: 'jiraiyaJourney' },
      { kind: 'event', id: 'itachiKisame', scene: 'konoha', event: 'itachiKisame' },
      { kind: 'event', id: 'rasengan1', event: 'rasengan1' },
      { kind: 'event', id: 'rasengan2', event: 'rasengan2' },
      { kind: 'event', id: 'tsunade', event: 'tsunade' },
      { kind: 'rest', id: 'rest4' },
      { kind: 'event', id: 'rasenganTraining', event: 'rasenganTraining' },
      // Kabuto: só o Rasengan o derruba (finalizador); o Naruto termina exausto.
      {
        kind: 'boss',
        id: 'kabuto',
        enemies: ['kabuto'],
        team: [],
        win: { kind: 'finisher', target: 'kabuto', technique: 'jRasengan' },
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'kabuto', line: 'kabutoStart' }] },
          { when: { on: 'hpBelow', who: 'kabuto', pct: 0.25 }, do: [{ do: 'say', who: 'kabuto', line: 'kabutoHeal' }] },
          { when: { on: 'tech', tech: 'jRasengan', who: 'naruto' }, do: [{ do: 'say', who: 'naruto', line: 'kabutoRasengan' }] },
          { when: { on: 'down', who: 'kabuto' }, do: [{ do: 'say', who: 'narrator', line: 'kabutoExhausted' }] },
        ],
      },
      { kind: 'event', id: 'sannin', event: 'sannin' },
    ],
  },
  {
    id: 'retrieval',
    // Vale do Fim: do hospital ao Vale. A equipe de resgate se separa: cada amigo fica para trás contra um do Quarteto.
    team: ['shikamaru', 'choji'],
    scene: 'valley',
    stops: [
      {
        kind: 'story',
        id: 'hospital',
        scene: 'konoha',
        enemies: ['sasukeHospital'],
        team: [],
        win: { kind: 'survive', rounds: 5, target: 'sasukeHospital', pct: 0.5 },
        script: [{ when: { on: 'start' }, do: [{ do: 'say', who: 'sasukeHospital', line: 'hospitalStart' }] }],
      },
      { kind: 'event', id: 'sasukeLeft', scene: 'konoha', event: 'sasukeLeft' },
      { kind: 'fight', id: 'soundAmbush', enemies: ['soundNinja', 'snake', 'soundNinja'], team: ['shikamaru', 'kibaAlly'] },
      { kind: 'elite', id: 'jirobo', enemies: ['jirobo'], team: ['choji', 'shikamaru'] },
      { kind: 'event', id: 'chojiStays', event: 'chojiStays' },
      { kind: 'treasure', id: 'treasure3' },
      { kind: 'event', id: 'nejiStays', event: 'nejiStays' },
      { kind: 'event', id: 'shikamaruStays', event: 'shikamaruStays' },
      { kind: 'event', id: 'kibaStays', event: 'kibaStays' },
      // Kimimaro: o Naruto luta sozinho até o Lee chegar e mandá-lo seguir atrás do Sasuke.
      {
        kind: 'story',
        id: 'kimimaro',
        enemies: ['kimimaro'],
        team: [],
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'kimimaro', line: 'kimimaroStart' }] },
          { when: { on: 'round', round: 4 }, do: [{ do: 'say', who: 'lee', line: 'kimimaroLee' }, { do: 'say', who: 'narrator', line: 'kimimaroGo' }, { do: 'end', status: 'won' }] },
          { when: { on: 'hpBelow', who: 'kimimaro', pct: 0.5 }, do: [{ do: 'say', who: 'lee', line: 'kimimaroLee' }, { do: 'say', who: 'narrator', line: 'kimimaroGo' }, { do: 'end', status: 'won' }] },
        ],
      },
      { kind: 'rest', id: 'rest3' },
      { kind: 'event', id: 'valleyTalk', scene: 'valleyEnd', event: 'valleyTalk' },
      // Vale do Fim: selo nível 2 contra o manto de uma cauda; no fim, o choque e o Sasuke parte.
      {
        kind: 'boss',
        id: 'valley',
        scene: 'valleyEnd',
        enemies: ['sasukeFinal'],
        team: [],
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'sasukeFinal', line: 'valleyStart' }] },
          { when: { on: 'start' }, if: { flag: 'valleyFriend' }, do: [{ do: 'form', who: 'naruto', form: 'resolve' }] },
          { when: { on: 'hpBelow', who: 'sasukeFinal', pct: 0.6 }, do: [{ do: 'say', who: 'sasukeFinal', line: 'valleyCurse' }, { do: 'form', who: 'sasukeFinal', form: 'curseMark2' }] },
          { when: { on: 'hpBelow', who: 'naruto', pct: 0.6 }, if: { flag: 'valleyForce' }, do: [{ do: 'say', who: 'naruto', line: 'valleyKyuubi' }, { do: 'form', who: 'naruto', form: 'oneTail' }] },
          { when: { on: 'hpBelow', who: 'naruto', pct: 0.45 }, do: [{ do: 'say', who: 'naruto', line: 'valleyKyuubi' }, { do: 'form', who: 'naruto', form: 'oneTail' }] },
          {
            when: { on: 'hpBelow', who: 'sasukeFinal', pct: 0.2 },
            do: [
              { do: 'say', who: 'naruto', line: 'valleyRasengan' },
              { do: 'say', who: 'sasukeFinal', line: 'valleyChidori' },
              { do: 'say', who: 'narrator', line: 'valleyEnd' },
              { do: 'end', status: 'won' },
            ],
          },
        ],
      },
      { kind: 'event', id: 'returnKonoha', scene: 'konoha', event: 'returnKonoha' },
    ],
  },
];
