import type { GameData } from '../core/gameData';
import { balance } from './balance';
import { BEATS, elementWeights } from './elements';
import { akatsukiOutcomes, guruOutcomes, items, preFightEvents, rewards, summonAnimals } from './events';
import { lineages } from './lineages';
import { levelTechniques, techniques, techniquesById } from './techniques';
import { copyTechniques } from './copies';

export const gameData: GameData = {
  balance,
  lineages,
  elementWeights,
  beats: BEATS,
  techniquesById: { ...techniquesById, ...copyTechniques },
  techniques,
  levelTechniques,
  preFightEvents,
  items,
  akatsukiOutcomes,
  guruOutcomes,
  summonAnimals,
  rewards,
};
