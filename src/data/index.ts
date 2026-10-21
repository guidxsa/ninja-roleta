import type { GameData } from '../core/gameData';
import { balance } from './balance';
import { BEATS, elementWeights } from './elements';
import { lineages } from './lineages';
import { basicTechniques, techniquesById } from './techniques';

export const gameData: GameData = {
  balance,
  lineages,
  elementWeights,
  beats: BEATS,
  basicTechniques,
  techniquesById,
};
