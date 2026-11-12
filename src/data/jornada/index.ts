import type { JornadaData } from '../../core/jornada/data';
import { balance } from '../balance';
import { BEATS } from '../elements';
import { kekkeiGenkai } from '../kekkeiGenkai';
import { jornadaBalance } from './balance';
import { charactersById } from './characters';
import { enemiesById } from './enemies';
import { eventsById } from './events';
import { relics } from './relics';
import { stages } from './stages';
import { campaigns } from './campaigns';
import { talents } from './talents';
import { generic } from './generic';
import { elementLines, jTechniquesById } from './techniques';

export const jornadaData: JornadaData = {
  base: { hit: balance.hit, crit: balance.crit, penetration: balance.penetration, difficulty: balance.difficulty, clones: balance.clones, gateCosts: balance.gateCosts },
  j: jornadaBalance,
  beats: BEATS,
  techniques: jTechniquesById,
  characters: charactersById,
  enemies: enemiesById,
  kekkeiGenkai,
  stages,
  campaigns,
  talents,
  relics,
  events: eventsById,
  elementLines,
  generic,
};
