import type { LevelStatId } from '../data/events';
import type { GameData } from './gameData';
import type {
  AttackStats,
  AttackType,
  Element,
  Origin,
  PassiveDef,
  StatKey,
  SummonState,
  TechniqueDef,
  TechniqueSlot,
} from './types';

export interface PlayerState {
  origin: Origin;
  /** Começa em 1. Sobe ao juntar o XP do nível, até `balance.level.cap`. */
  level: number;
  /** XP acumulado rumo ao próximo nível (zera ao subir). No teto, fica em 0. */
  xp: number;
  maxHp: number;
  hp: number;
  maxChakra: number;
  chakra: number;
  offense: AttackStats;
  speed: number;
  affinity: Element | null;
  secondaryElements: Element[];
  /** diferencial_de_dano_%: somado à chance base de crítico. */
  critBonus: number;
  /** diferencial_de_resistência. */
  resistanceBonus: number;
  /** No máximo uma técnica por espaço. Sem técnica de ataque = ação básica; sem médica = não cura. */
  techniques: Partial<Record<TechniqueSlot, string>>;
  /** Upgrades (pergaminho) por espaço: valem para a técnica que estiver nele, inclusive a básica. */
  techniqueLevels: Partial<Record<TechniqueSlot, number>>;
  /** Ferramenta ninja: item único, evoluível. 0 = não tem. */
  ninjaToolLevel: number;
  summon: SummonState | null;
  forbiddenAttackTypes: AttackType[];
  passive: PassiveDef | null;
  jinchuuriki: boolean;
  revives: number;
  revivesUsed: number;
}

export function createPlayer(origin: Origin, data: GameData): PlayerState {
  const { balance } = data;
  const lineage = origin.lineageId ? data.lineages.find((l) => l.id === origin.lineageId) : undefined;
  if (origin.lineageId && !lineage) throw new Error(`Linhagem desconhecida: ${origin.lineageId}`);

  const stat = (key: StatKey): number => {
    if (lineage?.zeroedStats?.includes(key)) return 0;
    return Math.floor(balance.baseStats[key] * (1 + (lineage?.modifiers[key] ?? 0)));
  };

  let maxChakra = stat('chakra');
  if (origin.jinchuuriki) maxChakra = Math.floor(maxChakra * (1 + balance.jinchuuriki.chakraBonusPct));
  const maxHp = stat('hp');

  return {
    origin,
    level: 1,
    xp: 0,
    maxHp,
    hp: maxHp,
    maxChakra,
    chakra: maxChakra,
    offense: { taijutsu: stat('taijutsu'), ninjutsu: stat('ninjutsu'), genjutsu: stat('genjutsu') },
    speed: stat('speed'),
    affinity: origin.affinity,
    secondaryElements: [],
    critBonus: 0,
    resistanceBonus: balance.resistance.initialBonus,
    techniques: {},
    techniqueLevels: {},
    ninjaToolLevel: 0,
    summon: null,
    forbiddenAttackTypes: [...(lineage?.forbiddenAttackTypes ?? [])],
    passive: lineage?.passive ?? null,
    jinchuuriki: origin.jinchuuriki,
    revives: balance.revive.initialItems,
    revivesUsed: 0,
  };
}

/** Restaura HP e chakra (item de retorno, ou entre etapas da campanha). */
export function fullRestore(player: PlayerState): PlayerState {
  return { ...player, hp: player.maxHp, chakra: player.maxChakra };
}

export function techniqueSlot(tech: TechniqueDef): TechniqueSlot {
  return tech.slot ?? tech.type;
}

/** Ensina uma técnica, substituindo a do mesmo espaço. Respeita a restrição da origem. */
export function learnTechnique(player: PlayerState, techniqueId: string, data: GameData): PlayerState {
  const tech = data.techniquesById[techniqueId];
  if (!tech) throw new Error(`Técnica desconhecida: ${techniqueId}`);
  if (player.forbiddenAttackTypes.includes(tech.type)) {
    throw new Error(`Esta origem não aprende técnicas de ${tech.type}`);
  }
  return { ...player, techniques: { ...player.techniques, [techniqueSlot(tech)]: tech.id } };
}

/** Fração do HP máximo que o ninjutsu médico cura, com os upgrades. 0 = não sabe. */
export function medicalHealPct(player: PlayerState, data: GameData): number {
  const id = player.techniques.medical;
  const tech = id ? data.techniquesById[id] : undefined;
  if (!tech) return 0;
  return (tech.healPct ?? 0) + (player.techniqueLevels.medical ?? 0) * data.balance.techniqueUpgrade.healPctPerLevel;
}

/** Status que a roleta de nível pode sortear: tira os tipos de ataque proibidos pela origem. */
export function levelUpPool(player: PlayerState, data: GameData) {
  return data.levelUpStats.filter((s) => !player.forbiddenAttackTypes.includes(s.id as AttackType));
}

/** XP para sair de `level` e ir ao próximo. `null` no teto de nível. */
export function xpToNextLevel(level: number, data: GameData): number | null {
  const cfg = data.balance.level;
  if (level >= cfg.cap) return null;
  return cfg.xpBase + cfg.xpGrowth * (level - 1);
}

/** Soma XP. Não sobe de nível sozinho: enquanto `canLevelUp`, a UI gira a roleta de nível. */
export function gainXp(player: PlayerState, amount: number, data: GameData): PlayerState {
  if (xpToNextLevel(player.level, data) === null) return { ...player, xp: 0 };
  return { ...player, xp: player.xp + amount };
}

export function canLevelUp(player: PlayerState, data: GameData): boolean {
  const need = xpToNextLevel(player.level, data);
  return need !== null && player.xp >= need;
}

/**
 * Sobe 1 nível, gastando o XP do nível: HP e chakra máximos sobem sempre (os atuais sobem junto)
 * e `stat` recebe o bônus da roleta de nível.
 */
export function applyLevelUp(player: PlayerState, stat: LevelStatId, data: GameData): PlayerState {
  const cfg = data.balance.level;
  if (!canLevelUp(player, data)) throw new Error('XP insuficiente ou nível máximo');
  const gain = cfg.statGains[stat];
  const hp = cfg.hpPerLevel + (stat === 'hp' ? gain : 0);
  const chakra = cfg.chakraPerLevel + (stat === 'chakra' ? gain : 0);
  const level = player.level + 1;
  const leftover = player.xp - xpToNextLevel(player.level, data)!;
  const p: PlayerState = {
    ...player,
    level,
    xp: level >= cfg.cap ? 0 : leftover,
    maxHp: player.maxHp + hp,
    hp: player.hp + hp,
    maxChakra: player.maxChakra + chakra,
    chakra: player.chakra + chakra,
  };
  if (stat === 'taijutsu' || stat === 'ninjutsu' || stat === 'genjutsu') {
    if (!p.forbiddenAttackTypes.includes(stat)) p.offense = { ...p.offense, [stat]: p.offense[stat] + gain };
  } else if (stat === 'speed') {
    p.speed += gain;
  } else if (stat === 'resistance') {
    p.resistanceBonus += gain;
  }
  return p;
}

/**
 * Sobe `n` estágios em todos os status. HP e chakra atuais sobem junto com o máximo.
 * Tipos proibidos pela origem (ex.: ninjutsu do prodígio do taijutsu) continuam zerados.
 */
export function applyStatStages(player: PlayerState, n: number, data: GameData): PlayerState {
  const st = data.balance.statStage;
  const offense = { ...player.offense };
  for (const type of ['taijutsu', 'ninjutsu', 'genjutsu'] as const) {
    if (!player.forbiddenAttackTypes.includes(type)) offense[type] += st[type] * n;
  }
  return {
    ...player,
    offense,
    speed: player.speed + st.speed * n,
    maxHp: player.maxHp + st.hp * n,
    hp: player.hp + st.hp * n,
    maxChakra: player.maxChakra + st.chakra * n,
    chakra: player.chakra + st.chakra * n,
  };
}
