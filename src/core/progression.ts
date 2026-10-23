// Tudo o que acontece fora do combate: eventos pré-vilão, jokenpô, itens, encontros, guru, recompensas e nível.
// Funções puras: recebem o jogador e devolvem um novo, mais a descrição do efeito para a UI.
import type { AkatsukiOutcome, GuruOutcome, ItemId, RewardId, Weighted } from '../data/events';
import type { GameData } from './gameData';
import {
  applyLevelUp,
  applyStatStages,
  canUseType,
  knownTechniques,
  knowsElement,
  learnTechnique,
  lineageAllows,
  techniqueSlot,
  type PlayerState,
} from './player';
import type { Rng } from './rng';
import { spin, type Slice } from './roulette';
import type { SummonAnimal, TechniqueSlot } from './types';

/** Uma roleta girada, com as fatias e o resultado, para a UI animar. */
export interface Roll<T> {
  slices: Slice<T>[];
  index: number;
  value: T;
}

export function rollWeighted<T extends string>(list: readonly Weighted<T>[], rng: Rng): Roll<T> {
  const slices = list.map((w) => ({ label: w.id, weight: w.weight, value: w.id }));
  const { index, slice } = spin(slices, rng);
  return { slices, index, value: slice.value };
}

/** Vantagem ou desvantagem de ação: vale só para o 1º turno da próxima luta. */
export interface NextFightMods {
  villainStartsFirst: boolean;
  playerStartsFirst: boolean;
}

/** Por que a Akatsuki tirou uma Vontade do Fogo: caçou o jinchuuriki ou o jogador se meteu. */
export type AkatsukiReason = 'hunted' | 'meddled';

export type ProgressEffect =
  | { kind: 'none' }
  | { kind: 'villainFirst' }
  | { kind: 'playerFirst' }
  | { kind: 'stages'; n: number }
  | { kind: 'revive' }
  | { kind: 'ninjaTool'; level: number }
  | { kind: 'techniqueUpgrade'; type: TechniqueSlot; level: number }
  | { kind: 'resistance'; amount: number }
  | { kind: 'speed'; amount: number }
  | { kind: 'critBonus'; amount: number }
  | { kind: 'newTechnique'; techniqueId: string }
  | { kind: 'akatsukiTookRevive'; reason: AkatsukiReason }
  | { kind: 'akatsukiWeakened'; reason: AkatsukiReason }
  | { kind: 'akatsukiInsight'; amount: number }
  | { kind: 'akatsukiUnnoticed' }
  | { kind: 'guruCharlatan' }
  | { kind: 'guruFocus' }
  /** `learned`: técnicas de nível aprendidas junto com a subida. */
  | { kind: 'levelUp'; level: number; hp: number; chakra: number; learned: string[] }
  | { kind: 'summonLearned'; animal: SummonAnimal }
  | { kind: 'summonLevel'; animal: SummonAnimal; level: number };

export interface Step {
  player: PlayerState;
  mods: Partial<NextFightMods>;
  effect: ProgressEffect;
}

const step = (player: PlayerState, effect: ProgressEffect, mods: Partial<NextFightMods> = {}): Step => ({
  player,
  mods,
  effect,
});

// ---------------------------------------------------------------------------
// Eventos pré-vilão

/** Eventos que se resolvem sem outra roleta nem escolha do jogador. */
export type SimpleEventId = 'oldLady' | 'ramen' | 'training';

export function applySimpleEvent(player: PlayerState, id: SimpleEventId, data: GameData): Step {
  switch (id) {
    case 'oldLady':
      return step(player, { kind: 'villainFirst' }, { villainStartsFirst: true, playerStartsFirst: false });
    case 'ramen':
      return step(player, { kind: 'playerFirst' }, { playerStartsFirst: true, villainStartsFirst: false });
    case 'training': {
      const n = data.balance.events.trainingStages;
      return step(applyStatStages(player, n, data), { kind: 'stages', n });
    }
  }
}

// ---------------------------------------------------------------------------
// Jokenpô

export type Hand = 'rock' | 'paper' | 'scissors';
export const HANDS: readonly Hand[] = ['rock', 'paper', 'scissors'];
const HAND_BEATS: Record<Hand, Hand> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

export interface JokenpoResult extends Step {
  roll: Roll<Hand>;
  result: 'win' | 'draw' | 'loss';
}

/** O jogador escolhe; o companheiro sorteia (1/3 cada). Empate: nada (sem revanche). */
export function playJokenpo(player: PlayerState, choice: Hand, rng: Rng, data: GameData): JokenpoResult {
  const roll = rollWeighted(
    HANDS.map((id) => ({ id, weight: 1 })),
    rng,
  );
  const opponent = roll.value;
  if (choice === opponent) return { roll, result: 'draw', ...step(player, { kind: 'none' }) };
  if (HAND_BEATS[choice] === opponent) {
    const n = data.balance.events.jokenpoWinStages;
    return { roll, result: 'win', ...step(applyStatStages(player, n, data), { kind: 'stages', n }) };
  }
  return {
    roll,
    result: 'loss',
    ...step(player, { kind: 'villainFirst' }, { villainStartsFirst: true, playerStartsFirst: false }),
  };
}

// ---------------------------------------------------------------------------
// Itens

export function rollItem(rng: Rng, data: GameData): Roll<ItemId> {
  return rollWeighted(data.items, rng);
}

export function applyItem(player: PlayerState, item: ItemId, rng: Rng, data: GameData): Step {
  switch (item) {
    case 'revive':
      return step({ ...player, revives: player.revives + 1 }, { kind: 'revive' });
    case 'ninjaTool': {
      const level = player.ninjaToolLevel + 1;
      return step({ ...player, ninjaToolLevel: level }, { kind: 'ninjaTool', level });
    }
    case 'techniqueScroll': {
      // Sorteia entre as categorias que o jogador usa; o upgrade vale para todas as técnicas dela.
      const types: TechniqueSlot[] = (['taijutsu', 'ninjutsu', 'genjutsu'] as const).filter((t) =>
        canUseType(player, t, data),
      );
      if (knownTechniques(player, data).some((t) => techniqueSlot(t) === 'medical')) types.push('medical');
      const type = spin(
        types.map((t) => ({ label: t, weight: 1, value: t })),
        rng,
      ).slice.value;
      const level = (player.techniqueLevels[type] ?? 0) + 1;
      return step(
        { ...player, techniqueLevels: { ...player.techniqueLevels, [type]: level } },
        { kind: 'techniqueUpgrade', type, level },
      );
    }
    // Amuletos: efeito permanente; ficam na bolsa.
    case 'resistanceItem':
      return step(
        {
          ...player,
          resistanceBonus: player.resistanceBonus + 1,
          amulets: { ...player.amulets, resistance: player.amulets.resistance + 1 },
        },
        { kind: 'resistance', amount: 1 },
      );
    case 'speedItem':
      return step(
        { ...player, speed: player.speed + 1, amulets: { ...player.amulets, speed: player.amulets.speed + 1 } },
        { kind: 'speed', amount: 1 },
      );
  }
}

// ---------------------------------------------------------------------------
// Encontros: Akatsuki, invocação e guru

/** Roleta da Akatsuki: as fatias dependem de o jogador ser jinchuuriki. */
export function rollAkatsuki(player: PlayerState, rng: Rng, data: GameData): Roll<AkatsukiOutcome> {
  return rollWeighted(player.jinchuuriki ? data.akatsukiOutcomes.jinchuuriki : data.akatsukiOutcomes.others, rng);
}

/**
 * Akatsuki: caça jinchuuriki. Nunca causa game over: sem Vontade do Fogo para perder, o jogador começa
 * a próxima luta com metade do HP e do chakra.
 * Quem não é jinchuuriki costuma só assistir a uma luta deles e aprender a mirar pontos vitais (+crítico).
 */
export function applyAkatsuki(player: PlayerState, outcome: AkatsukiOutcome, data: GameData): Step {
  const cfg = data.balance.events;
  if (outcome === 'unnoticed') return step(player, { kind: 'akatsukiUnnoticed' });
  if (outcome === 'insight') {
    const amount = cfg.akatsukiCritBonus;
    return step({ ...player, critBonus: player.critBonus + amount }, { kind: 'akatsukiInsight', amount });
  }
  const reason = outcome;
  if (player.revives > 0) {
    return step({ ...player, revives: player.revives - 1 }, { kind: 'akatsukiTookRevive', reason });
  }
  return step(
    {
      ...player,
      hp: Math.max(1, Math.floor(player.maxHp * cfg.akatsukiNoReviveHpPct)),
      chakra: Math.floor(player.maxChakra * cfg.akatsukiNoReviveChakraPct),
    },
    { kind: 'akatsukiWeakened', reason },
  );
}

/** Técnicas ofensivas que o guru pode ensinar (as aprendíveis, menos o ninjutsu médico). */
export function offensiveLearnable(player: PlayerState, data: GameData): string[] {
  return learnableTechniques(player, data).filter((id) => techniqueSlot(data.techniquesById[id]!) !== 'medical');
}

/** Roleta do guru: sem técnica para ensinar (ou já sabendo o foco), a fatia some. */
export function guruPool(player: PlayerState, data: GameData): Weighted<GuruOutcome>[] {
  return data.guruOutcomes.filter(
    (o) =>
      (o.id !== 'technique' || offensiveLearnable(player, data).length > 0) && (o.id !== 'focus' || !player.focusCrit),
  );
}

export function rollGuru(player: PlayerState, rng: Rng, data: GameData): Roll<GuruOutcome> {
  return rollWeighted(guruPool(player, data), rng);
}

/** Guru: charlatão (desvantagem de ação), técnica ofensiva adequada ou o foco (crítico garantido 1×/luta). */
export function applyGuru(player: PlayerState, outcome: GuruOutcome, rng: Rng, data: GameData): Step {
  switch (outcome) {
    case 'charlatan':
      return step(player, { kind: 'guruCharlatan' }, { villainStartsFirst: true, playerStartsFirst: false });
    case 'focus':
      return step({ ...player, focusCrit: true }, { kind: 'guruFocus' });
    case 'technique': {
      const pool = offensiveLearnable(player, data);
      if (pool.length === 0) throw new Error('Nenhuma técnica ofensiva disponível para esta origem');
      const techniqueId = spin(
        pool.map((id) => ({ label: id, weight: 1, value: id })),
        rng,
      ).slice.value;
      return step(learnTechnique(player, techniqueId, data), { kind: 'newTechnique', techniqueId });
    }
  }
}

export function rollSummonAnimal(rng: Rng, data: GameData): Roll<SummonAnimal> {
  return rollWeighted(data.summonAnimals, rng);
}

/** Aprende a invocar o animal sorteado. Se já sabe, a invocação atual sobe de nível (o animal não é trocado). */
export function applySummonEncounter(player: PlayerState, animal: SummonAnimal): Step {
  if (player.summon) {
    const summon = { ...player.summon, level: player.summon.level + 1 };
    return step({ ...player, summon }, { kind: 'summonLevel', animal: summon.animal, level: summon.level });
  }
  return step({ ...player, summon: { animal, level: 1 } }, { kind: 'summonLearned', animal });
}

// ---------------------------------------------------------------------------
// Nível

/** Sobe 1 nível (HP e chakra máximos pela dificuldade, restauração total e técnicas de nível). */
export function levelUp(player: PlayerState, data: GameData): Step {
  const next = applyLevelUp(player, data);
  const learned = next.techniques.filter((id) => !player.techniques.includes(id));
  return step(next, {
    kind: 'levelUp',
    level: next.level,
    hp: next.maxHp - player.maxHp,
    chakra: next.maxChakra - player.maxChakra,
    learned,
  });
}

// ---------------------------------------------------------------------------
// Recompensas

/**
 * Técnicas que a recompensa "nova técnica" pode ensinar: respeita a origem, ignora as já aprendidas
 * e só oferece técnicas elementais dos elementos que o jogador domina (afinidade ou secundários).
 */
export function learnableTechniques(player: PlayerState, data: GameData): string[] {
  return data.techniques
    .filter(
      (t) =>
        !player.forbiddenAttackTypes.includes(t.type) &&
        !player.techniques.includes(t.id) &&
        knowsElement(player, t.element) &&
        lineageAllows(player, t),
    )
    .map((t) => t.id);
}

/** Pool filtrada pela origem: sem técnica para aprender, a fatia some. */
export function rewardPool(player: PlayerState, data: GameData): Weighted<RewardId>[] {
  const canLearn = learnableTechniques(player, data).length > 0;
  return data.rewards.filter((r) => r.id !== 'newTechnique' || canLearn);
}

export function rollReward(player: PlayerState, rng: Rng, data: GameData): Roll<RewardId> {
  return rollWeighted(rewardPool(player, data), rng);
}

/**
 * Aplica uma recompensa. `tier` (1 comum, 2 raro, 3 lendário) multiplica a quantidade.
 * A recompensa "item" é resolvida pela roleta de itens (`rollItem` + `applyItem`).
 */
export function applyReward(
  player: PlayerState,
  reward: Exclude<RewardId, 'item'>,
  tier: number,
  rng: Rng,
  data: GameData,
): Step {
  const cfg = data.balance.rewards;
  switch (reward) {
    case 'stages': {
      const n = cfg.stagesPerTier * tier;
      return step(applyStatStages(player, n, data), { kind: 'stages', n });
    }
    case 'newTechnique': {
      const pool = learnableTechniques(player, data);
      if (pool.length === 0) throw new Error('Nenhuma técnica disponível para esta origem');
      const techniqueId = spin(
        pool.map((id) => ({ label: id, weight: 1, value: id })),
        rng,
      ).slice.value;
      return step(learnTechnique(player, techniqueId, data), { kind: 'newTechnique', techniqueId });
    }
    case 'techniqueUpgrade':
      return applyItem(player, 'techniqueScroll', rng, data);
    case 'resistance': {
      const amount = cfg.resistancePerTier * tier;
      return step({ ...player, resistanceBonus: player.resistanceBonus + amount }, { kind: 'resistance', amount });
    }
    case 'critBonus': {
      const amount = cfg.critBonusPerTier * tier;
      return step({ ...player, critBonus: player.critBonus + amount }, { kind: 'critBonus', amount });
    }
  }
}
