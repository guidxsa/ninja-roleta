import { jornadaClasses } from '../../core/jornada/classes';
import type { GenericDef } from '../../core/jornada/trail';
import { lineages } from '../lineages';

// Caminho Ninja (docs/jornada/caminho-ninja.md): classes, suportes e pools de cada estágio do mapa ramificado.
// Mesma dificuldade da História; um chefe de cada estágio é sorteado no começo da run.

const EVENTS = ['gOldLady', 'gRamen', 'gTraining', 'gJokenpo', 'gGuru', 'gAkatsuki', 'gFoundItem', 'gSummon', 'gBadOmen', 'gShrine'];

export const generic: GenericDef = {
  // Cada suporte sorteia a classe entre as liberadas (pode ser a do protagonista), depois uma ficha ainda não
  // usada da classe e um nome. Nomes originais, sem personagens do mangá.
  // Classes montadas das origens com bloco `jornada` (base única, v0.64.0; src/data/lineages.ts).
  classes: jornadaClasses(lineages),
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
        // v0.94.0: inimigos novos (docs/jornada/proposta-fichas.md).
        ['samurai', 'samurai'],
        ['mistHunter', 'bandit'],
      ],
      elites: [['gozu', 'meizu'], ['missingNin', 'missingNin', 'mistRogue'], ['zori', 'waraji'], ['mistHunter', 'mistHunter']],
      bosses: [['zabuza'], ['haku'], ['gato', 'zori', 'waraji']],
      encounters: {
        // O Gatō se esconde atrás dos guarda-costas (`protects`) e foge quando os dois caem: a luta acaba em vitória.
        'gato+zori+waraji': {
          script: [
            { when: { on: 'down', who: 'zori' }, if: { flag: 'gatoWarajiDown' }, do: [{ do: 'say', who: 'gato', line: 'gatoFlee' }, { do: 'leave', who: 'gato' }, { do: 'end', status: 'won' }] },
            { when: { on: 'down', who: 'zori' }, ifNot: { flag: 'gatoWarajiDown' }, do: [{ do: 'flag', id: 'gatoZoriDown' }] },
            { when: { on: 'down', who: 'waraji' }, if: { flag: 'gatoZoriDown' }, do: [{ do: 'say', who: 'gato', line: 'gatoFlee' }, { do: 'leave', who: 'gato' }, { do: 'end', status: 'won' }] },
            { when: { on: 'down', who: 'waraji' }, ifNot: { flag: 'gatoZoriDown' }, do: [{ do: 'flag', id: 'gatoWarajiDown' }] },
          ],
        },
      },
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
        ['sandGenin', 'sandGenin'],
        ['sandGenin', 'grassNinja'],
      ],
      elites: [['rainNinja', 'rainNinja', 'rainNinja'], ['dosu', 'zaku', 'kin'], ['kabutoSpy', 'soundNinja'], ['yoroi', 'misumi'], ['sandGenin', 'sandGenin', 'sandGenin']],
      // Kankurō luta com a Karasu: a marionete toma parte dos golpes nele (`protects`).
      bosses: [['gaara'], ['neji'], ['kankuro', 'karasu', 'temari']],
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
        ['hideoutGuard', 'hideoutGuard'],
        ['hideoutGuard', 'snake'],
      ],
      elites: [['jirobo'], ['kidomaru', 'tayuya'], ['sakon', 'snake'], ['tayuya', 'doki', 'doki', 'doki'], ['hideoutGuard', 'hideoutGuard', 'kidomaru']],
      bosses: [['orochimaru'], ['kimimaro'], ['sakon2']],
      encounters: {
        // Dois corpos: a 50% do HP o Ukon se separa do Sakon e entra na luta.
        sakon2: { script: [{ when: { on: 'hpBelow', who: 'sakon2', pct: 0.5 }, do: [{ do: 'say', who: 'sakon2', line: 'sakonSplit' }, { do: 'enter', who: 'ukon' }] }] },
        // Itachi e Kisame: vence quem derruba os dois ou resiste 6 rodadas (eles se retiram). Sem alvo: só as rodadas.
        'itachi+kisame': {
          win: { kind: 'survive', rounds: 6, target: '-', pct: 0 },
          script: [{ when: { on: 'start' }, do: [{ do: 'say', who: 'itachi', line: 'itachiOpen' }] }],
          routRelic: true,
        },
      },
      rareElite: { chance: 0.1, enemies: ['itachi', 'kisame'] },
      events: EVENTS,
    },
  ],
};
