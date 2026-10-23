// Tipos compartilhados entre core, dados e simulação.

export type Element = 'fire' | 'wind' | 'lightning' | 'earth' | 'water';

export type AttackType = 'taijutsu' | 'ninjutsu' | 'genjutsu';
export type AttackStats = Record<AttackType, number>;

/** Espaço de técnica: um por tipo de ataque, mais o de ninjutsu médico (suporte). */
export type TechniqueSlot = AttackType | 'medical';

export type StatKey = 'hp' | AttackType | 'chakra' | 'speed';
export type Stats = Record<StatKey, number>;

// Passivas são comportamento (código); os parâmetros delas são dados.
// Os estágios dos portões ficam em `balance.gates` (evoluem com o taijutsu, como o Sharingan com o nível).
export type PassiveDef =
  | { kind: 'genjutsuResistance'; bonus: number }
  | { kind: 'preciseFist'; defensePierce: number }
  | { kind: 'gates' }
  | { kind: 'vitality'; chakraPerTurn: number; hpPctPerTurn: number };

export type AffinityRule =
  | { kind: 'rolled' }
  | { kind: 'fixed'; element: Element }
  | { kind: 'none' };

/** Técnica ocular ativável em batalha (parâmetros em `balance.dojutsu`). */
export type DojutsuId = 'sharingan' | 'byakugan';

export interface LineageDef {
  id: string;
  /** Peso na roleta de linhagem (a fatia "comum" tem `balance.origin.commonWeight`). */
  weight: number;
  /** Modificadores percentuais sobre o status base (0.2 = +20%). */
  modifiers: Partial<Stats>;
  zeroedStats?: StatKey[];
  affinity: AffinityRule;
  passive: PassiveDef;
  /** Tipos de técnica que a linhagem não pode usar nem aprender. */
  forbiddenAttackTypes?: AttackType[];
  /** Tipos com ação básica desde o início. Omitido = `balance.commonStartingTypes` (taijutsu e ninjutsu). */
  startingTypes?: AttackType[];
  /** Técnicas que a linhagem já conhece ao nascer (ex.: golpe inibidor do Hyuuga). */
  startingTechniques?: string[];
  dojutsu?: DojutsuId;
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
  /** Aprendida sozinha ao atingir este nível (se a origem e o elemento permitirem). */
  minLevel?: number;
  /** Só estas linhagens aprendem (ex.: combos avançados de taijutsu, só do prodígio). */
  lineages?: string[];
  /** Só pode ser usada com este dōjutsu ativado. */
  requiresDojutsu?: DojutsuId;
  /** Ao acertar, drena esta quantidade do chakra do vilão. */
  chakraDrain?: number;
}

/** Golpe com lâmina: o crítico de espada causa sangramento; quem sangra toma mais dano de lâminas. */
export type BladeKind = 'sword' | 'cutting';

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
  blade?: BladeKind;
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
  /** Passiva única do vilão. */
  passive?: VillainPassive;
  /** Versão da passiva no modo hardcore (substitui `passive`). */
  hardcorePassive?: VillainPassive;
}

/** Manto: abaixo do limiar de HP, uma vez por luta, por alguns turnos (jinchuuriki, marca da maldição). */
export interface CloakDef {
  hpThresholdPct: number;
  /** Multiplica dano e defesas do vilão enquanto ativo. */
  statMult: number;
  /** Fração do HP máximo recuperada no início de cada rodada, enquanto ativo. */
  regenPct: number;
  /** Fração do dano causado que volta como dano no próprio vilão (nunca o derruba). */
  recoilPct: number;
  turns: number;
}

export type VillainPassive =
  /** Enganador: sobrevive ao primeiro golpe fatal com 1 de HP e perde a vez acovardado
   * (`counterCrit`: no lugar de perder a vez, o próximo ataque dele é crítico garantido). */
  | { kind: 'trickster'; counterCrit?: boolean }
  /** Espelhos: `actions` ações por turno, cada uma com `damageMult` do dano. */
  | { kind: 'mirrors'; actions: number; damageMult: number }
  /** Névoa oculta: começa a luta na névoa; a chance de erro do jogador × `evasionMult`.
   * `lastStand` (hardcore): ao tomar o golpe fatal, volta com parte do HP, mais forte e fazendo sangrar. */
  | {
      kind: 'mist';
      turns: number;
      evasionMult: number;
      lastStand?: { healPct: number; damageMult: number };
    }
  /** Jinchuuriki ou marca da maldição. `defenseMult` (hardcore) vale a luta toda. */
  | {
      kind: 'cloak';
      variant: 'beast' | 'curseMark';
      cloak: CloakDef;
      genjutsuImmune: boolean;
      fromStart?: boolean;
      defenseMult?: number;
    }
  /** Bisturi: cura passiva por rodada; no hardcore os golpes fazem sangrar e furam a resistência. */
  | { kind: 'scalpel'; regenPct: number; bleedOnHit?: boolean; resistancePierce?: number }
  /** Insano: cobra (veneno nos acertos). Abaixo do limiar de HP, se não for derrotado em `killWindow`
   * rodadas, revive com o maior entre `reviveMinPct` do HP máximo e `reviveCurrentMult` × o HP atual. */
  | {
      kind: 'insane';
      snakeBonus: number;
      hpThresholdPct: number;
      killWindow: number;
      reviveMinPct: number;
      reviveCurrentMult: number;
      reviveFull?: boolean;
    };

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
