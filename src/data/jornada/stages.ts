import type { StageDef } from '../../core/jornada/trail';

// História do Naruto (docs/jornada/historia.md): os confrontos do mangá na ordem, com paradas entre eles.
// Linear: sem escolha de caminho. Os confrontos de história são `story` e o último de cada estágio é `boss`.

export const stages: StageDef[] = [
  {
    id: 'waves',
    team: ['sasuke', 'sakura'],
    scene: 'forest',
    stops: [
      { kind: 'story', id: 'mizuki', enemies: ['mizuki'], team: [] },
      { kind: 'event', id: 'graduation', event: 'graduation' },
      { kind: 'story', id: 'bells', enemies: ['kakashi'], win: { kind: 'hpThreshold', target: 'kakashi', pct: 0.5 } },
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
      { kind: 'fight', id: 'grass', enemies: ['grassNinja', 'grassNinja'] },
      { kind: 'story', id: 'forest', enemies: ['dosu', 'zaku', 'kin'] },
      { kind: 'elite', id: 'rainTrio', enemies: ['rainNinja', 'rainNinja', 'rainNinja'] },
      { kind: 'event', id: 'preliminaries', event: 'preliminaries' },
      { kind: 'story', id: 'kiba', enemies: ['kiba', 'akamaru'], team: [] },
      { kind: 'event', id: 'toadSummon', event: 'toadSummon' },
      { kind: 'treasure', id: 'treasure2' },
      { kind: 'story', id: 'neji', enemies: ['neji'], team: [] },
      { kind: 'elite', id: 'kabutoSpy', enemies: ['kabutoSpy', 'soundNinja'] },
      { kind: 'fight', id: 'invasion', enemies: ['soundNinja', 'soundNinja', 'grassNinja'] },
      { kind: 'rest', id: 'rest2' },
      { kind: 'boss', id: 'gaara', enemies: ['gaara'], team: [] },
    ],
  },
  {
    id: 'retrieval',
    // Equipe de resgate do mangá (Shikamaru, Chōji, Kiba, Neji); cada parada leva quem estava lá.
    team: ['shikamaru', 'choji'],
    scene: 'valley',
    stops: [
      { kind: 'event', id: 'rasenganTraining', event: 'rasenganTraining' },
      { kind: 'story', id: 'tanzaku', enemies: ['orochimaru', 'kabuto'], team: ['jiraiya', 'tsunade'] },
      { kind: 'story', id: 'kabuto', enemies: ['kabuto'], team: [] },
      {
        kind: 'story',
        id: 'hospital',
        enemies: ['sasukeHospital'],
        team: [],
        win: { kind: 'survive', rounds: 5, target: 'sasukeHospital', pct: 0.5 },
      },
      { kind: 'event', id: 'sasukeLeft', event: 'sasukeLeft' },
      { kind: 'fight', id: 'soundAmbush', enemies: ['soundNinja', 'snake', 'soundNinja'], team: ['shikamaru', 'kibaAlly'] },
      { kind: 'elite', id: 'jirobo', enemies: ['jirobo'], team: ['choji', 'shikamaru'] },
      { kind: 'treasure', id: 'treasure3' },
      { kind: 'elite', id: 'kidomaruTayuya', enemies: ['kidomaru', 'tayuya'], team: ['nejiAlly', 'shikamaru'] },
      { kind: 'elite', id: 'sakon', enemies: ['sakon', 'snake'], team: ['kibaAlly', 'nejiAlly'] },
      { kind: 'story', id: 'kimimaro', enemies: ['kimimaro'], team: ['lee', 'gaaraAlly'] },
      { kind: 'rest', id: 'rest3' },
      { kind: 'boss', id: 'valley', enemies: ['sasukeFinal'], team: [] },
    ],
  },
];
