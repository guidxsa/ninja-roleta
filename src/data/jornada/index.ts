import type { JornadaData } from '../../core/jornada/data';
import { balance } from '../balance';
import { BEATS } from '../elements';
import { jornadaBalance } from './balance';
import { charactersById, stageTechniques } from './characters';
import { enemiesById } from './enemies';
import { eventsById } from './events';
import { relics } from './relics';
import { stages } from './stages';
import { talents } from './talents';
import { jTechniquesById } from './techniques';

export const jornadaData: JornadaData = {
  base: { hit: balance.hit, crit: balance.crit, penetration: balance.penetration, difficulty: balance.difficulty },
  j: jornadaBalance,
  beats: BEATS,
  techniques: jTechniquesById,
  characters: charactersById,
  enemies: enemiesById,
  stageTechniques,
  stages,
  talents,
  relics,
  events: eventsById,
};
