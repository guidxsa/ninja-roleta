import { BASIC_TAIJUTSU } from '../core/player';
import type { TechniqueDef } from '../core/types';

// Catálogo de técnicas (docs/tecnicas.md). Nomes visíveis em strings/ptBR.ts.
// Ficha: dano por golpe, golpes, chakra, precisão (padrão 85%), bônus de crítico, penetração,
// efeito no acerto e prioridade. Todo ponto forte tem um custo.

// Punho de Chakra (`BASIC_TAIJUTSU`): todo personagem nasce com ele.

/** Ninjutsu básico de cada elemento: kit inicial da afinidade. */
const elementalBasics: TechniqueDef[] = [
  { id: 'fireSpark', type: 'ninjutsu', element: 'fire', baseDamage: 12, chakraCost: 2, elementalBasic: true },
  { id: 'windBlade', type: 'ninjutsu', element: 'wind', baseDamage: 11, chakraCost: 2, accuracy: 0.9, critBonus: 0.05, elementalBasic: true },
  { id: 'spark', type: 'ninjutsu', element: 'lightning', baseDamage: 13, chakraCost: 2, accuracy: 0.8, penetration: 0.1, elementalBasic: true },
  { id: 'rockFist', type: 'ninjutsu', element: 'earth', baseDamage: 10, chakraCost: 2, accuracy: 0.95, elementalBasic: true },
  { id: 'waterBullet', type: 'ninjutsu', element: 'water', baseDamage: 11, chakraCost: 2, accuracy: 0.9, elementalBasic: true },
];

/** Pool das recompensas "nova técnica" e do guru (filtrada por origem e elemento). */
export const techniques: TechniqueDef[] = [
  { id: 'empoweredTaijutsu', type: 'taijutsu', element: null, baseDamage: 14, chakraCost: 3 },
  ...elementalBasics,
  // Genjutsu não causa dano: aplica um efeito mental. Aprender um libera a categoria.
  { id: 'crowIllusion', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 4, mental: 'prison', mentalTurns: 1, mentalPower: 6 },
  { id: 'sleepSong', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 4, mental: 'sleep', mentalTurns: 2, mentalPower: 0 },
  { id: 'hollowWhisper', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 5, mental: 'torment', mentalTurns: 2, mentalPower: 2 },
  // Suporte: espaço próprio, cura sem rolar acerto. O prodígio do taijutsu não aprende (é ninjutsu).
  { id: 'medicalNinjutsu', type: 'ninjutsu', slot: 'medical', element: null, baseDamage: 0, chakraCost: 4, healPct: 0.2 },
];

/** Aprendidas sozinhas ao atingir `minLevel`, se a origem, a categoria e o elemento permitirem. */
export const levelTechniques: TechniqueDef[] = [
  { id: 'whirlwindCombo', type: 'taijutsu', element: null, baseDamage: 20, chakraCost: 5, accuracy: 0.9, minLevel: 4, lineages: ['taijutsuProdigy'] },
  { id: 'hiddenLotus', type: 'taijutsu', element: null, baseDamage: 30, chakraCost: 9, accuracy: 0.8, critBonus: 0.1, minLevel: 7, lineages: ['taijutsuProdigy'] },
  { id: 'humanBoulder', type: 'taijutsu', element: null, baseDamage: 24, chakraCost: 6, accuracy: 0.8, onHit: { effect: 'stun', chance: 0.2 }, minLevel: 4, lineages: ['akimichi'] },
  { id: 'rotation', type: 'ninjutsu', element: null, baseDamage: 0, chakraCost: 5, defensive: 'rotation', minLevel: 4, lineages: ['hyuuga'] },

  { id: 'phoenixFlower', type: 'ninjutsu', element: 'fire', baseDamage: 23, chakraCost: 6, onHit: { effect: 'burn', chance: 0.2 }, minLevel: 4 },
  { id: 'galeBlast', type: 'ninjutsu', element: 'wind', baseDamage: 12, hits: 2, chakraCost: 6, critBonus: 0.1, minLevel: 4 },
  { id: 'lightningCurrent', type: 'ninjutsu', element: 'lightning', baseDamage: 26, chakraCost: 7, accuracy: 0.75, penetration: 0.2, minLevel: 4 },
  { id: 'earthSpear', type: 'ninjutsu', element: 'earth', baseDamage: 22, chakraCost: 5, accuracy: 0.95, onHit: { effect: 'stun', chance: 0.15 }, minLevel: 4 },
  { id: 'waterShark', type: 'ninjutsu', element: 'water', baseDamage: 23, chakraCost: 6, accuracy: 0.9, priority: true, minLevel: 4 },

  { id: 'greatBlaze', type: 'ninjutsu', element: 'fire', baseDamage: 34, chakraCost: 10, accuracy: 0.8, onHit: { effect: 'burn', chance: 0.3 }, minLevel: 7 },
  { id: 'vacuumSphere', type: 'ninjutsu', element: 'wind', baseDamage: 9, hits: 4, chakraCost: 10, critBonus: 0.1, minLevel: 7 },
  { id: 'lightningBlade', type: 'ninjutsu', element: 'lightning', baseDamage: 38, chakraCost: 11, accuracy: 0.7, penetration: 0.3, minLevel: 7 },
  { id: 'earthDragon', type: 'ninjutsu', element: 'earth', baseDamage: 32, chakraCost: 9, accuracy: 0.9, onHit: { effect: 'stun', chance: 0.25 }, minLevel: 7 },
  { id: 'greatWaterfall', type: 'ninjutsu', element: 'water', baseDamage: 33, chakraCost: 10, priority: true, minLevel: 7 },

  { id: 'fearIllusion', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 5, mental: 'fear', mentalTurns: 2, mentalPower: 10, minLevel: 4 },
  { id: 'mirrorWorld', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 8, mental: 'prison', mentalTurns: 2, mentalPower: 14, minLevel: 7 },
];

/** Kit inicial de linhagem (`startingTechniques`): não saem em recompensa. */
export const lineageTechniques: TechniqueDef[] = [
  { id: BASIC_TAIJUTSU, type: 'taijutsu', element: null, baseDamage: 8, chakraCost: 0, accuracy: 0.9 },
  { id: 'fangOverFang', type: 'taijutsu', element: null, baseDamage: 7, hits: 2, chakraCost: 3, lineages: ['inuzuka'] },
  // Selo dos Pontos Vitais (Hyuuga): só com o Byakugan ativo, não erra e drena o chakra do vilão.
  { id: 'chakraBlockStrike', type: 'taijutsu', element: null, baseDamage: 6, chakraCost: 0, accuracy: 1, requiresDojutsu: 'byakugan', chakraDrain: 6, lineages: ['hyuuga'] },
  // Imitação de Sombra (Nara): ninjutsu sem dano que aprisiona, usando ninjutsu na fórmula do genjutsu.
  { id: 'shadowImitation', type: 'ninjutsu', element: null, baseDamage: 0, chakraCost: 5, accuracy: 0.8, mental: 'prison', mentalTurns: 1, mentalPower: 0, mentalStat: 'ninjutsu', lineages: ['nara'] },
  // Enxame (Aburame): 4 golpes pequenos; cada acerto drena chakra pela Colmeia.
  { id: 'insectSwarm', type: 'ninjutsu', element: null, baseDamage: 5, hits: 4, chakraCost: 5, lineages: ['aburame'] },
  { id: 'basicGenjutsu', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 3, mental: 'prison', mentalTurns: 1, mentalPower: 0, lineages: ['uchiha'] },
  { id: 'mindTransfer', type: 'genjutsu', element: null, baseDamage: 0, chakraCost: 4, mental: 'confusion', mentalTurns: 1, mentalPower: 2, lineages: ['yamanaka'] },
];

export const allTechniques: TechniqueDef[] = [...lineageTechniques, ...techniques, ...levelTechniques];

export const techniquesById: Record<string, TechniqueDef> = Object.fromEntries(allTechniques.map((t) => [t.id, t]));
