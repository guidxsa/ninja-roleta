// Tipos do modo Jornada (docs/jornada/). O combate é de equipe e não depende do combate do Roleta;
// só as fórmulas puras (acerto, dano, elementos) são compartilhadas.
import type { AttackStats, AttackType, Element, Resistances } from '../types';

export type TeamSide = 'ally' | 'enemy';

/** Efeitos com duração em turnos de quem sofre (docs/jornada/combate.md#efeitos). */
export type JEffect = 'stun' | 'burn' | 'poison' | 'chakraBlock';

/** Bônus temporário em quem usa: dano, acerto, esquiva e penetração por `turns` turnos dele. */
export interface Boost {
  damageMult?: number;
  accuracy?: number;
  evasion?: number;
  penetration?: number;
  turns: number;
}

/** Quem a técnica atinge. `allEnemies`: todos os adversários de pé. */
export type JTarget = 'enemy' | 'allEnemies' | 'ally' | 'self';

export interface JTechnique {
  id: string;
  /** Status de ataque usado. Genjutsu enfrenta a resistência mental; os outros, a física. */
  type: AttackType;
  element: Element | null;
  target: JTarget;
  /** Dano base por golpe (0 = técnica sem dano). */
  baseDamage: number;
  hits?: number;
  /** Golpes a mais por clone ativo de quem usa (Rendan Uzumaki), até `maxCloneHits`. */
  hitsPerClone?: number;
  maxCloneHits?: number;
  chakraCost: number;
  /** Fração do HP máximo que custa (Portões, Lótus). */
  hpCostPct?: number;
  accuracy?: number;
  critBonus?: number;
  penetration?: number;
  onHit?: { effect: JEffect; chance: number; turns?: number };
  /** Cura do alvo, em fração do HP máximo dele. */
  healPct?: number;
  /** Escudo no alvo, em fração do HP máximo de quem usa. */
  shieldPct?: number;
  /** Tira atordoamento e bloqueio de chakra do alvo. */
  cleanse?: boolean;
  /** Clones criados em quem usa. */
  clones?: number;
  /** Rodadas de espera depois de usar. */
  cooldown?: number;
  /** Ativa de classe: não ocupa espaço no moveset (docs/jornada/combate.md#moveset). */
  active?: boolean;
  /** Fortalecimento em quem usa por alguns turnos (Portões, Sharingan, Byakugan). */
  boost?: Boost;
}

/** Como um lutador automático escolhe a ação (docs/jornada/personagens.md). */
export type AiProfile = 'striker' | 'tactician' | 'healer' | 'guardian' | 'brute';

/** Passiva de inimigo. `enrage`: abaixo de `atPct` do HP, dano × `damageMult`. */
export type EnemyPassive =
  | { kind: 'enrage'; atPct: number; damageMult: number }
  | { kind: 'startShieldPct'; pct: number };

/** Bônus somados de talentos, relíquias e passivas (aplicados no lutador no início da luta). */
export interface FighterMods {
  damageMult: number;
  /** Dano extra por tipo de ataque (mult). */
  typeDamageMult: Partial<Record<AttackType, number>>;
  /** Dano plano somado ao base de taijutsu. */
  taijutsuFlat: number;
  critBonus: number;
  accuracyBonus: number;
  /** Chance a menos de ser acertado (esquiva). */
  evasion: number;
  /** Fração do HP máximo recuperada no começo de cada rodada. */
  regenPct: number;
  /** Abaixo de 50% do HP, dano × este valor. */
  lowHpDamageMult: number;
  /** Clones no começo da luta. */
  startClones: number;
  /** Clones a mais em cada técnica que cria clones. */
  extraClones: number;
  /** Escudo no começo da luta (fração do HP máximo). */
  startShieldPct: number;
  /** Chakra a menos em toda técnica (mínimo 0). */
  chakraDiscount: number;
  /** Técnica → multiplicador de dano próprio (Domínio do Rasengan). */
  techDamageMult: Record<string, number>;
  /** Técnica → chakra a menos. */
  techChakraDiscount: Record<string, number>;
  /** Uma vez por luta, ao cair, fica com 1 de HP (Fúria da Kyuubi). */
  surviveOnce: boolean;
}

export interface CharacterDef {
  id: string;
  hp: number;
  chakra: number;
  speed: number;
  offense: AttackStats;
  resistance: Resistances;
  element: Element | null;
  /** Técnicas conhecidas no início (as aprendidas depois vêm de talentos e eventos). */
  techniques: string[];
  ai: AiProfile;
  /** Ganho por nível acima do 1 (frações acumulam; arredonda para baixo). */
  growth: { hp: number; chakra: number; speed: number; offense: AttackStats; resistance: Resistances };
  /** Retrato: arte de vilão (`villain:<id>`) ou de ninja por linhagem (`ninja:<chave>`). */
  portrait: string;
}

export interface EnemyDef {
  id: string;
  hp: number;
  chakra: number;
  speed: number;
  offense: AttackStats;
  resistance: Resistances;
  element: Element | null;
  techniques: string[];
  ai: AiProfile;
  passive?: EnemyPassive;
  portrait: string;
}

export interface Fighter {
  /** Id único na luta ('a0', 'e1'...). */
  uid: string;
  defId: string;
  side: TeamSide;
  protagonist: boolean;
  maxHp: number;
  hp: number;
  maxChakra: number;
  chakra: number;
  speed: number;
  offense: AttackStats;
  resistance: Resistances;
  element: Element | null;
  techniques: string[];
  ai: AiProfile;
  passive?: EnemyPassive;
  mods: FighterMods;
  effects: { kind: JEffect; turns: number }[];
  shield: number;
  clones: number;
  down: boolean;
  /** Postura defensiva até o próximo turno dele: usa a resistência inteira. */
  guarding: boolean;
  cooldowns: Record<string, number>;
  survivedOnce: boolean;
  /** A passiva de fúria já disparou (só para o log). */
  enraged: boolean;
  /** Fortalecimento ativo (uma técnica de boost por vez; usar de novo renova). */
  boost: (Boost & { techId: string }) | null;
}

/** Como a luta se vence (docs/jornada/canonica.md#vitórias-especiais). */
export type WinCondition =
  | { kind: 'defeatAll' }
  /** Levar o inimigo `target` (defId) a `pct` do HP máximo ou menos (sino do Kakashi). */
  | { kind: 'hpThreshold'; target: string; pct: number }
  /** Aguentar `rounds` rodadas de pé, ou levar `target` a `pct` (Sasuke no hospital). */
  | { kind: 'survive'; rounds: number; target: string; pct: number };

export type BattleStatus = 'ongoing' | 'won' | 'lost';

export type JEvent =
  | { type: 'round'; round: number }
  | { type: 'turn'; uid: string }
  | { type: 'skip'; uid: string; reason: 'stun' }
  | { type: 'tech'; uid: string; techId: string; targets: string[] }
  | { type: 'miss'; uid: string; target: string }
  | { type: 'damage'; uid: string; target: string; amount: number; crit: boolean; elementMult: number; absorbed: number }
  | { type: 'cloneBlock'; target: string; left: number }
  | { type: 'heal'; uid: string; target: string; amount: number }
  | { type: 'shield'; uid: string; target: string; amount: number }
  | { type: 'clones'; uid: string; total: number }
  | { type: 'effect'; target: string; effect: JEffect; turns: number }
  | { type: 'cleanse'; uid: string; target: string }
  | { type: 'tick'; target: string; effect: JEffect; amount: number }
  | { type: 'regen'; target: string; amount: number }
  | { type: 'down'; target: string }
  | { type: 'survive'; target: string }
  | { type: 'revive'; uid: string; target: string; hp: number }
  | { type: 'item'; uid: string; item: string; target: string }
  | { type: 'guard'; uid: string }
  | { type: 'rest'; uid: string; chakra: number }
  | { type: 'enrage'; uid: string }
  | { type: 'boost'; uid: string; techId: string; turns: number }
  | { type: 'end'; status: BattleStatus };

export interface JBattle {
  round: number;
  fighters: Fighter[];
  /** Ordem dos turnos da rodada (uids). */
  order: string[];
  turnIndex: number;
  /** O turno atual já começou (efeitos do começo do turno aplicados). */
  turnStarted: boolean;
  status: BattleStatus;
  win: WinCondition;
  /** O protagonista já usou um item neste turno (item não gasta o turno, mas é um por turno). */
  itemUsed: boolean;
  log: JEvent[];
}

/** Ação do protagonista. */
export type JAction =
  | { kind: 'tech'; techId: string; target: string }
  | { kind: 'revive'; target: string }
  | { kind: 'guard' }
  | { kind: 'rest' };

export type ConsumableId = 'hpKit' | 'chakraKit' | 'reviveKit';
