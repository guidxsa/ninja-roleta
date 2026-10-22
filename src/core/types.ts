// Tipos compartilhados entre core, dados e simulação.

export type Element = 'fire' | 'wind' | 'lightning' | 'earth' | 'water';

export type AttackType = 'taijutsu' | 'ninjutsu' | 'genjutsu';
export type AttackStats = Record<AttackType, number>;

/** Espaço de técnica: um por tipo de ataque, mais o de ninjutsu médico (suporte). */
export type TechniqueSlot = AttackType | 'medical';

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
  /** Tipo de chakra da técnica (filtro de origem). O ninjutsu médico é do tipo ninjutsu. */
  type: AttackType;
  /** Omitido = o próprio tipo. Técnicas de suporte ocupam um espaço próprio. */
  slot?: TechniqueSlot;
  element: TechniqueElement;
  baseDamage: number;
  chakraCost: number;
  /** Só genjutsu: turnos base de aprisionamento aplicados ao acertar. */
  debilitateTurns?: number;
  /** Só genjutsu: poder extra somado ao genjutsu do usuário (mais turnos de aprisionamento). */
  genjutsuPower?: number;
  /** Só ninjutsu médico: fração do HP máximo curada. */
  healPct?: number;
}

export interface VillainTechnique {
  id: string;
  type: AttackType;
  baseDamage: number;
  /** Taijutsu é sempre 0. Sem chakra para nenhuma técnica, o vilão concentra chakra. */
  chakraCost: number;
  /** Peso na escolha da técnica pelo vilão (entre as que ele pode pagar). */
  weight: number;
  /** Omitido = elemento do vilão. Taijutsu é sempre neutro. */
  element?: Element | null;
  debilitateTurns?: number;
}

export interface VillainDef {
  id: string;
  element: Element;
  hp: number;
  /** Reserva de chakra do vilão. */
  chakra: number;
  speed: number;
  /** Atributos defensivos por tipo. O de genjutsu também mede o poder de ilusão do vilão. */
  defense: AttackStats;
  /** Diferencial de crítico do vilão (somado aos 5% base). */
  critBonus: number;
  /** Experiência que o jogador ganha ao derrotar o vilão (escala com a dificuldade dele). */
  xp: number;
  techniques: VillainTechnique[];
}

export interface Origin {
  lineageId: string | null;
  affinity: Element | null;
  jinchuuriki: boolean;
}

export type SummonAnimal = 'toad' | 'snake' | 'slug';

/** Invocação passiva: o animal acompanha o jogador em todas as lutas. */
export interface SummonState {
  animal: SummonAnimal;
  /** Começa em 1; sobe quando o encontro de invocação se repete. */
  level: number;
}
