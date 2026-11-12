import type { GenericDef } from '../../core/jornada/trail';

// Caminho Ninja (docs/jornada/caminho-ninja.md): classes, suportes e pools de cada estágio do mapa ramificado.
// Mesma dificuldade da História; um chefe de cada estágio é sorteado no começo da run.

const EVENTS = ['gOldLady', 'gRamen', 'gTraining', 'gJokenpo', 'gGuru', 'gAkatsuki', 'gFoundItem', 'gSummon', 'gBadOmen', 'gShrine'];

export const generic: GenericDef = {
  // Cada suporte sorteia a classe entre as liberadas (pode ser a do protagonista), depois uma ficha ainda não
  // usada da classe e um nome. Nomes originais, sem personagens do mangá.
  classes: [
    {
      id: 'common',
      hero: 'commonNinja',
      noElementHero: 'prodigy',
      supports: ['leafGeninA', 'leafGeninB', 'leafMedic'],
      supportNames: ['daichi', 'hana', 'kenta', 'yui', 'sora', 'aiko', 'haruto', 'rin', 'takumi', 'mei', 'riku', 'nanami'],
    },
    // Uchiha: sempre e só Fogo (v0.59.0; a mesma regra da origem do Roleta).
    {
      id: 'uchiha',
      hero: 'uchihaNinja',
      fixedElement: 'fire',
      unlock: 'j_unlockUchiha',
      supports: ['uchihaGenin', 'uchihaGeninB'],
      supportNames: ['ren', 'akane', 'hikaru', 'tetsu', 'kaede', 'ryo', 'suzu', 'jin', 'kiyomi', 'nao'],
    },
    // Hyuuga: natureza sorteada em silêncio, sem ninjutsu elemental (Byakugan e Punho Suave bastam; v0.59.0).
    {
      id: 'hyuuga',
      hero: 'hyuugaNinja',
      noElement: true,
      unlock: 'j_unlockHyuuga',
      supports: ['hyuugaGenin', 'hyuugaGeninB'],
      supportNames: ['mio', 'sei', 'haru', 'yuki', 'kenji', 'emi', 'tomo', 'aya', 'shun', 'mai'],
    },
  ],
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
