import type { GameData } from '../core/gameData';
import { balance } from './balance';
import { BEATS, elementWeights } from './elements';
import { akatsukiOutcomes, guruOutcomes, items, preFightEvents, rewards, summonAnimals } from './events';
import { lineages } from './lineages';
import { kekkeiGenkaiLevelTechniques, levelTechniques, techniques, techniquesById } from './techniques';
import { copyTechniques } from './copies';
import { kekkeiGenkai } from './kekkeiGenkai';

export const gameData: GameData = {
  balance,
  lineages,
  elementWeights,
  beats: BEATS,
  techniquesById: { ...techniquesById, ...copyTechniques },
  techniques,
  levelTechniques: [...levelTechniques, ...kekkeiGenkaiLevelTechniques],
  preFightEvents,
  items,
  akatsukiOutcomes,
  guruOutcomes,
  summonAnimals,
  rewards,
  kekkeiGenkai,
};
