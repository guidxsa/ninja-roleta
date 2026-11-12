import type { StageDef } from '../../core/jornada/trail';

// História do Naruto (docs/jornada/historia.md): os confrontos do mangá na ordem, com paradas entre eles.
// Linear: sem escolha de caminho. Os confrontos de história são `story` e o último de cada estágio é `boss`.

export const stages: StageDef[] = [
  {
    id: 'waves',
    team: ['sasuke', 'sakura'],
    scene: 'forest',
    stops: [
      { kind: 'story', id: 'mizuki', scene: 'konoha', enemies: ['mizuki'], team: [] },
      { kind: 'event', id: 'graduation', scene: 'konoha', event: 'graduation' },
      // Teste do sino: o molde do roteiro de luta (docs/jornada/roteiro.md, v0.66.0).
      {
        kind: 'story',
        id: 'bells',
        scene: 'konoha',
        enemies: ['kakashi'],
        win: { kind: 'hpThreshold', target: 'kakashi', pct: 0.5 },
        script: [
          { when: { on: 'start' }, do: [{ do: 'say', who: 'kakashi', line: 'bellsStart' }] },
          { when: { on: 'hpBelow', who: 'kakashi', pct: 0.5 }, do: [{ do: 'say', who: 'naruto', line: 'bellsGot' }] },
        ],
      },
      { kind: 'fight', id: 'thugs', enemies: ['gatoThug', 'gatoThug', 'gatoThug'] },
      { kind: 'event', id: 'tazuna', event: 'tazuna' },
      { kind: 'elite', id: 'demonBrothers', enemies: ['gozu', 'meizu'] },
      { kind: 'elite', id: 'zabuza', enemies: ['zabuza'] },
      { kind: 'event', id: 'treeClimbing', event: 'treeClimbing' },
      { kind: 'fight', id: 'mistRogues', enemies: ['mistRogue', 'gatoThug', 'mistRogue'] },
      { kind: 'treasure', id: 'treasure1' },
      { kind: 'rest', id: 'rest1' },
      { kind: 'boss', id: 'haku', enemies: ['haku'], team: ['sasuke'] },
    ],
  },
  {
    id: 'exam',
    team: ['sasuke', 'sakura'],
    scene: 'arena',
    stops: [
      { kind: 'event', id: 'writtenTest', event: 'writtenTest' },
      { kind: 'fight', id: 'grass', scene: 'deathForest', enemies: ['grassNinja', 'grassNinja'] },
      { kind: 'story', id: 'forest', scene: 'deathForest', enemies: ['dosu', 'zaku', 'kin'] },
      { kind: 'elite', id: 'rainTrio', scene: 'deathForest', enemies: ['rainNinja', 'rainNinja', 'rainNinja'] },
      { kind: 'event', id: 'preliminaries', event: 'preliminaries' },
      { kind: 'story', id: 'kiba', enemies: ['kiba', 'akamaru'], team: [] },
      { kind: 'event', id: 'toadSummon', event: 'toadSummon' },
      { kind: 'treasure', id: 'treasure2' },
      { kind: 'story', id: 'neji', enemies: ['neji'], team: [] },
      { kind: 'elite', id: 'kabutoSpy', enemies: ['kabutoSpy', 'soundNinja'] },
      { kind: 'fight', id: 'invasion', scene: 'konoha', enemies: ['soundNinja', 'soundNinja', 'grassNinja'] },
      { kind: 'rest', id: 'rest2', scene: 'konoha' },
      { kind: 'boss', id: 'gaara', enemies: ['gaara'], team: [] },
    ],
  },
  {
    id: 'sannin',
    // Busca pela Tsunade (vol. 16 a 19): Itachi em Konoha, o treino do Rasengan, Tanzaku e o Kabuto.
    team: ['jiraiya'],
    scene: 'forest',
    stops: [
      { kind: 'event', id: 'itachiKisame', scene: 'konoha', event: 'itachiKisame' },
      { kind: 'event', id: 'rasenganTraining', event: 'rasenganTraining' },
      { kind: 'rest', id: 'rest4' },
      { kind: 'story', id: 'tanzaku', enemies: ['orochimaru', 'kabuto'], team: ['jiraiya', 'tsunade'] },
      { kind: 'boss', id: 'kabuto', enemies: ['kabuto'], team: [] },
    ],
  },
  {
    id: 'retrieval',
    // Vale do Fim: do hospital ao Vale. Equipe de resgate do mangá (Shikamaru, Chōji, Kiba, Neji); cada parada leva quem estava lá.
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
      },
      { kind: 'event', id: 'sasukeLeft', scene: 'konoha', event: 'sasukeLeft' },
      { kind: 'fight', id: 'soundAmbush', enemies: ['soundNinja', 'snake', 'soundNinja'], team: ['shikamaru', 'kibaAlly'] },
      { kind: 'elite', id: 'jirobo', enemies: ['jirobo'], team: ['choji', 'shikamaru'] },
      { kind: 'treasure', id: 'treasure3' },
      { kind: 'elite', id: 'kidomaruTayuya', enemies: ['kidomaru', 'tayuya'], team: ['nejiAlly', 'shikamaru'] },
      { kind: 'elite', id: 'sakon', enemies: ['sakon', 'snake'], team: ['kibaAlly', 'nejiAlly'] },
      { kind: 'story', id: 'kimimaro', enemies: ['kimimaro'], team: ['lee', 'gaaraAlly'] },
      { kind: 'rest', id: 'rest3' },
      { kind: 'boss', id: 'valley', scene: 'valleyEnd', enemies: ['sasukeFinal'], team: [] },
    ],
  },
];
