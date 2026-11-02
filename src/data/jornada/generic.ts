import type { GenericDef } from '../../core/jornada/trail';

// Runs genéricas (docs/jornada/generica.md): classes, suportes e pools de cada estágio do mapa ramificado.
// Mesma dificuldade da canônica; um chefe de cada estágio é sorteado no começo da run.

const EVENTS = ['gOldLady', 'gRamen', 'gTraining', 'gJokenpo', 'gGuru', 'gAkatsuki', 'gFoundItem', 'gSummon'];

export const generic: GenericDef = {
  classes: [{ id: 'common', hero: 'commonNinja', noElementHero: 'prodigy' }],
  supports: ['leafGeninA', 'leafGeninB'],
  stages: [
    {
      id: 'g1',
      scene: 'forest',
      easyFights: [['bandit', 'bandit'], ['gatoThug', 'bandit'], ['mistRogue'], ['missingNin']],
      fights: [
        ['bandit', 'bandit', 'bandit'],
        ['gatoThug', 'gatoThug', 'bandit'],
        ['mistRogue', 'bandit'],
        ['missingNin', 'gatoThug'],
      ],
      elites: [['gozu', 'meizu'], ['missingNin', 'missingNin', 'mistRogue']],
      bosses: [['zabuza'], ['haku']],
      events: EVENTS,
    },
    {
      id: 'g2',
      scene: 'arena',
      easyFights: [['grassNinja'], ['rainNinja', 'bandit'], ['soundNinja']],
      fights: [
        ['grassNinja', 'grassNinja'],
        ['rainNinja', 'rainNinja'],
        ['soundNinja', 'grassNinja'],
        ['missingNin', 'rainNinja', 'bandit'],
      ],
      elites: [['rainNinja', 'rainNinja', 'rainNinja'], ['dosu', 'zaku', 'kin'], ['kabutoSpy', 'soundNinja']],
      bosses: [['gaara'], ['neji']],
      events: EVENTS,
    },
    {
      id: 'g3',
      scene: 'valley',
      easyFights: [['soundNinja', 'bandit'], ['snake'], ['missingNin', 'missingNin']],
      fights: [
        ['soundNinja', 'soundNinja', 'snake'],
        ['snake', 'snake'],
        ['soundNinja', 'missingNin', 'soundNinja'],
      ],
      elites: [['jirobo'], ['kidomaru', 'tayuya'], ['sakon', 'snake']],
      bosses: [['orochimaru'], ['kimimaro']],
      events: EVENTS,
    },
  ],
};
