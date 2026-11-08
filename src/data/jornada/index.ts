import type { JornadaData } from '../../core/jornada/data';
import { balance } from '../balance';
import { BEATS } from '../elements';
import { jornadaBalance } from './balance';
import { charactersById, stageTechniques } from './characters';
import { enemiesById } from './enemies';
import { eventsById } from './events';
import { relics } from './relics';
import { stages } from './stages';
import { campaigns } from './campaigns';
import { talents } from './talents';
import { generic } from './generic';
import { elementLines, jTechniquesById } from './techniques';

export const jornadaData: JornadaData = {
  base: { hit: balance.hit, crit: balance.crit, penetration: balance.penetration, difficulty: balance.difficulty },
  j: jornadaBalance,
  beats: BEATS,
  techniques: jTechniquesById,
  characters: charactersById,
  enemies: enemiesById,
  stageTechniques,
  stages,
  campaigns,
  talents,
  relics,
  events: eventsById,
  elementLines,
  generic,
};
