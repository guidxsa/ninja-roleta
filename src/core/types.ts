// Tipos compartilhados entre core, dados e simulação.

export type Element = 'fire' | 'wind' | 'lightning' | 'earth' | 'water';

export type AttackType = 'taijutsu' | 'ninjutsu' | 'genjutsu';
export type AttackStats = Record<AttackType, number>;

/** Espaço de técnica: um por tipo de ataque, mais o de ninjutsu médico (suporte). */
export type TechniqueSlot = AttackType | 'medical';

export type StatKey = 'hp' | AttackType | 'chakra' | 'speed';
export type Stats = Record<StatKey, number>;

/** Resistência física (dano de taijutsu e ninjutsu) e mental (genjutsu e efeitos mentais). */
export type ResistanceKind = 'physical' | 'mental';
export type Resistances = Record<ResistanceKind, number>;

/** Pesos das reações de um vilão (fundamentos.md#reações). Resistir é sempre possível. */
export interface ReactionWeights {
  resist: number;
  clash?: number;
  substitution?: number;
}

/** Estado elemental ativo no corpo (Armadura de Raio): conta como encontro de elementos. */
export type ElementalStateId = 'lightningArmor';

// Passivas são comportamento (código); os parâmetros delas ficam em `balance.passives` e `balance.gates`.
export type PassiveKind =
  | 'determination'
  | 'genius'
  | 'heavyBody'
  | 'mindReading'
  | 'hive'
  | 'duo'
  | 'ironBody'
  | 'genjutsuResistance'
  | 'preciseFist'
  | 'vitality';

/** Ativa de linhagem (gasta ou não o turno; parâmetros em `balance`). */
export type ActiveKind = 'gates' | 'expansion' | 'shadowClones';

export type AffinityRule =
  | { kind: 'rolled' }
  | { kind: 'fixed'; element: Element }
  | { kind: 'none' };

/** Técnica ocular ativável em batalha (parâmetros em `balance.dojutsu`). */
export type DojutsuId = 'sharingan' | 'byakugan';

/** Nível de raridade na roleta de linhagem (a cor da fatia). */
export type LineageTier = 'common' | 'clan' | 'rare';

export interface LineageDef {
  id: string;
  tier: LineageTier;
  /** Peso na roleta de linhagem (uma roleta só, com todos os níveis). */
  weight: number;
  /** Status iniciais absolutos (orçamento de 90 pontos com as resistências, ver docs/origens.md). */
  stats: Stats;
  resistance: Resistances;
  affinity: AffinityRule;
  passive: PassiveKind;
  active?: ActiveKind;
  /** Tipos de técnica que a linhagem não pode usar nem aprender. */
  forbiddenAttackTypes?: AttackType[];
  /** Kit inicial além do Punho de Chakra e do ninjutsu básico do elemento. */
  startingTechniques?: string[];
  dojutsu?: DojutsuId;
}

/** `'affinity'` = usa a afinidade de chakra do jogador. */
export type TechniqueElement = Element | null | 'affinity';

/** Efeitos que tiram a vez, atrapalham ou drenam (efeitos.md). */
export type MentalEffect = 'prison' | 'sleep' | 'fear' | 'confusion' | 'torment' | 'possession';
/** Efeitos físicos aplicáveis por chance no acerto. */
export type HitEffect = 'stun' | 'burn';

/** Golpe com lâmina: o crítico de espada causa sangramento; quem sangra toma mais dano de lâminas. */
export type BladeKind = 'sword' | 'cutting';

export interface TechniqueDef {
  id: string;
  /** Tipo de chakra da técnica (filtro de origem). O ninjutsu médico é do tipo ninjutsu. */
  type: AttackType;
  /** Omitido = o próprio tipo. Técnicas de suporte ocupam um espaço próprio. */
  slot?: TechniqueSlot;
  element: TechniqueElement;
  /** Dano base por golpe. */
  baseDamage: number;
  chakraCost: number;
  /** Golpes; cada um rola acerto. Omitido = 1. */
  hits?: number;
  /** Chance de acerto. Omitido = `balance.hit.defaultAccuracy`. 1 = não erra. */
  accuracy?: number;
  /** Somado à chance de crítico. */
  critBonus?: number;
  /** Fração da resistência do alvo ignorada (soma com outras fontes, até o teto). */
  penetration?: number;
  /** Efeito com chance no acerto. */
  onHit?: { effect: HitEffect; chance: number };
  /** Age antes na rodada, mesmo sem a iniciativa. */
  priority?: boolean;
  blade?: BladeKind;
  /**
   * Genjutsu (ou a Imitação de Sombra): efeito mental aplicado ao acertar. Genjutsu com `baseDamage` > 0
   * é uma ilusão de dano (Uchiha): base + genjutsu − resistência mental usada pelo alvo.
   */
  mental?: MentalEffect;
  /** Força base do efeito mental (efeitos.md#duração-dos-efeitos-mentais). */
  mentalStrength?: number;
  /** Poder extra somado ao status do usuário no cálculo da força. */
  mentalPower?: number;
  /** Status usado no lugar do genjutsu na rolagem e na duração (Imitação de Sombra: ninjutsu). */
  mentalStat?: AttackType;
  /** Só ninjutsu médico: fração do HP máximo curada. */
  healPct?: number;
  /** Barreira (ação de turno): pontos do escudo que absorve dano antes do HP. */
  barrier?: number;
  /** Barreira que devolve esta fração do dano bloqueado a quem bateu (Rotação). */
  reflectPct?: number;
  /** Barreira de fogo: chance de queimar quem bate nela com taijutsu. */
  burnOnBreakAttempt?: number;
  /** Barreira de vento: técnicas de vários golpes causam esta fração a menos no escudo. */
  multiHitBonus?: number;
  /** Poder extra na disputa (Rasengan). */
  clashBonus?: number;
  /** Ativa um estado elemental no corpo (Armadura de Raio). */
  state?: ElementalStateId;
  /** Linha de upgrade com nome próprio (linhas elementais, Rasengan) e o nível desta ficha nela. */
  line?: string;
  lineLevel?: number;
  /** Ninjutsu básico do elemento (kit inicial; a recompensa lendária de elemento ensina). */
  elementalBasic?: boolean;
  /** Só o guru ensina. */
  premium?: boolean;
  /** Técnicas de nível: aprendidas sozinhas neste nível. Na pool da recompensa: entra a partir dele. */
  minLevel?: number;
  /** Só estas linhagens aprendem. */
  lineages?: string[];
  /** Só pode ser usada com este dōjutsu ativado. */
  requiresDojutsu?: DojutsuId;
  /** Ao acertar, drena esta quantidade do chakra do vilão. */
  chakraDrain?: number;
}

export interface VillainTechnique {
  id: string;
  type: AttackType;
  baseDamage: number;
  /** Taijutsu é sempre 0. Sem chakra para nenhuma técnica, o vilão concentra chakra. */
  chakraCost: number;
  /** Peso na escolha da técnica pelo vilão (entre as que ele pode pagar). Barreiras: peso na reação. */
  weight: number;
  hits?: number;
  /** Barreira (ação): pontos do escudo. Entra no sorteio só sem escudo ativo. */
  barrier?: number;
  /** Omitido = elemento do vilão. Taijutsu é sempre neutro. */
  element?: Element | null;
  /** Omitido = `balance.hit.defaultAccuracy`. */
  accuracy?: number;
  mentalStrength?: number;
  blade?: BladeKind;
  /** Técnica médica: cura esta fração do HP máximo, sem rolar acerto. */
  healPct?: number;
  /** Só entra no sorteio com o HP abaixo desta fração do máximo. */
  useBelowHpPct?: number;
}

export interface VillainBehavior {
  /** Golpe carregado: ao sortear esta técnica, gasta a vez anunciando; na seguinte, dano ×2 sem crítico. */
  charged?: string;
}

export interface VillainDef {
  id: string;
  element: Element;
  hp: number;
  /** Reserva de chakra do vilão. */
  chakra: number;
  speed: number;
  /** Ataque por tipo (mesma ficha do jogador). */
  offense: AttackStats;
  /** Resistência física e mental (mesma ficha do jogador). */
  resistance: Resistances;
  /** Pesos das reações. Omitido = só resiste. */
  reactions?: ReactionWeights;
  /** Estado elemental a luta toda (Armadura de Areia do Gaara). */
  elementalState?: Element;
  /** Barreira (id de uma técnica dele) já erguida no início da luta, sem custo. */
  startingShield?: string;
  /** Diferencial de crítico do vilão (somado aos 5% base). */
  critBonus: number;
  /** Experiência que o jogador ganha ao derrotar o vilão. */
  xp: number;
  techniques: VillainTechnique[];
  /** Passiva única do vilão. */
  passive?: VillainPassive;
  /** Versão da passiva no modo hardcore (substitui `passive`). */
  hardcorePassive?: VillainPassive;
  behavior?: VillainBehavior;
}

/** Manto: abaixo do limiar de HP, uma vez por luta, por alguns turnos (jinchuuriki, marca da maldição). */
export interface CloakDef {
  hpThresholdPct: number;
  /** Multiplica tai/nin/gen e speed (jogador) ou o dano (vilão) enquanto ativo. */
  statMult: number;
  /** Multiplica as resistências enquanto ativo. */
  resistanceMult: number;
  /** Fração do HP máximo recuperada no início de cada rodada, enquanto ativo. */
  regenPct: number;
  /** Fração do chakra máximo paga no início de cada rodada; sem chakra, o manto se desfaz. */
  chakraPctPerRound: number;
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
  /** Jinchuuriki ou marca da maldição. `resistanceMult` vale a luta toda.
   * `monster` (Gaara no hardcore): ao ser derrotado pela 1ª vez, volta na forma do bijuu com `healPct` do HP,
   * troca as técnicas pelas de monstro e fica com os multiplicadores do manto até morrer (sem custo nem cura). */
  | {
      kind: 'cloak';
      variant: 'beast' | 'curseMark';
      cloak: CloakDef;
      genjutsuImmune: boolean;
      fromStart?: boolean;
      resistanceMult?: Partial<Resistances>;
      monster?: { healPct: number; techniques: VillainTechnique[]; reactions?: ReactionWeights };
    }
  /** Bisturi: crítico extra e críticos fazem sangrar; no hardcore todos os golpes sangram e furam a resistência. */
  | { kind: 'scalpel'; critBonus: number; bleedOnHit?: boolean; resistancePierce?: number }
  /** Insano: cobra (veneno nos acertos). Abaixo do limiar de HP, se não for derrotado em `killWindow`
   * rodadas, revive com `revivePct` do HP máximo, até `maxRevives` vezes por luta (omitido = sem limite).
   * `revivesByDifficulty`: o limite por dificuldade (`scaleVillain` o copia para `maxRevives`; sem
   * escala, vale o do normal). `critImmune` (hardcore): não recebe acerto crítico. */
  | {
      kind: 'insane';
      snakeBonus: number;
      hpThresholdPct: number;
      killWindow: number;
      revivePct: number;
      maxRevives?: number;
      revivesByDifficulty?: { easy: number; normal: number; hard: number };
      critImmune?: boolean;
    };

export interface Origin {
  /** null = comum. */
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

/** Consumíveis da bolsa (ação "Usar item"). */
export type ConsumableId = 'soldierPill' | 'medKit' | 'explosiveTag' | 'smokeBomb';
