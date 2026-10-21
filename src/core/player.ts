import type { GameData } from './gameData';
import type { AttackStats, AttackType, Element, Origin, PassiveDef, StatKey, SummonState } from './types';

export interface PlayerState {
  origin: Origin;
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
  /** No máximo uma técnica por tipo. Sem técnica = ação básica. */
  techniques: Partial<Record<AttackType, string>>;
  /** Upgrades (pergaminho) por tipo: valem para a técnica que estiver naquele tipo, inclusive a básica. */
  techniqueLevels: Partial<Record<AttackType, number>>;
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

/** Ensina uma técnica, substituindo a do mesmo tipo. Respeita a restrição da origem. */
export function learnTechnique(player: PlayerState, techniqueId: string, data: GameData): PlayerState {
  const tech = data.techniquesById[techniqueId];
  if (!tech) throw new Error(`Técnica desconhecida: ${techniqueId}`);
  if (player.forbiddenAttackTypes.includes(tech.type)) {
    throw new Error(`Esta origem não aprende técnicas de ${tech.type}`);
  }
  return { ...player, techniques: { ...player.techniques, [tech.type]: tech.id } };
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
