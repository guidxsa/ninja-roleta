import type { GameData } from '../core/gameData';
import { balance } from './balance';
import { BEATS, elementWeights } from './elements';
import { encounters, items, levelUpStats, preFightEvents, rewards, summonAnimals } from './events';
import { lineages } from './lineages';
import { basicTechniques, levelTechniques, techniques, techniquesById } from './techniques';

export const gameData: GameData = {
  balance,
  lineages,
  elementWeights,
  beats: BEATS,
  basicTechniques,
  techniquesById,
  techniques,
  levelTechniques,
  preFightEvents,
  items,
  encounters,
  summonAnimals,
  rewards,
  levelUpStats,
};
