// Tipos compartilhados entre core, dados e simulação.

export type Element = 'fire' | 'wind' | 'lightning' | 'earth' | 'water';

export type AttackType = 'taijutsu' | 'ninjutsu' | 'genjutsu';
export type AttackStats = Record<AttackType, number>;

export type StatKey = 'hp' | AttackType | 'chakra' | 'speed';
export type Stats = Record<StatKey, number>;

// Passivas são comportamento (código); os parâmetros delas são dados.
export type PassiveDef =
  | { kind: 'movementReading'; chance: number; damageFactor: number }
  | { kind: 'preciseFist'; defensePierce: number }
  | { kind: 'gates'; hpCostPct: number; taijutsuMult: number; turns: number }
  | { kind: 'vitality'; chakraPerTurn: number; hpPctPerTurn: number };

export type AffinityRule =
  | { kind: 'rolled' }
  | { kind: 'fixed'; element: Element }
  | { kind: 'none' };

export interface LineageDef {
  id: string;
  /** Peso na 2ª roleta (linhagem especial). */
  weight: number;
  /** Modificadores percentuais sobre o status base (0.2 = +20%). */
  modifiers: Partial<Stats>;
  zeroedStats?: StatKey[];
  affinity: AffinityRule;
  passive: PassiveDef;
  /** Tipos de técnica que a linhagem não pode usar nem aprender. */
  forbiddenAttackTypes?: AttackType[];
}

/** `'affinity'` = usa a afinidade de chakra do jogador (ações básicas). */
export type TechniqueElement = Element | null | 'affinity';

export interface TechniqueDef {
  id: string;
  type: AttackType;
  element: TechniqueElement;
  baseDamage: number;
  chakraCost: number;
  /** Só genjutsu: turnos de Debilitado aplicados ao acertar. */
  debilitateTurns?: number;
}

export interface VillainTechnique {
  id: string;
  type: AttackType;
  baseDamage: number;
  /** Peso na escolha da técnica pelo vilão. */
  weight: number;
  /** Omitido = elemento do vilão. Taijutsu é sempre neutro. */
  element?: Element | null;
  debilitateTurns?: number;
}

export interface VillainDef {
  id: string;
  element: Element;
  hp: number;
  speed: number;
  /** Atributos defensivos por tipo. O de genjutsu também mede o poder de ilusão do vilão. */
  defense: AttackStats;
  /** Diferencial de crítico do vilão (somado aos 5% base). */
  critBonus: number;
  techniques: VillainTechnique[];
}

export interface Origin {
  lineageId: string | null;
  affinity: Element | null;
  jinchuuriki: boolean;
}
