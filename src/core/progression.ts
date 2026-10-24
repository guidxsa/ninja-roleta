// Tudo o que acontece fora do combate: eventos pré-vilão, jokenpô, itens, encontros, guru, recompensas e nível.
// Funções puras: recebem o jogador e devolvem um novo, mais a descrição do efeito para a UI.
import type { AkatsukiOutcome, GuruOutcome, ItemId, RewardId, Weighted } from '../data/events';
import type { GameData } from './gameData';
import {
  applyLevelUp,
  applyStatStages,
  canUseType,
  elementalBasic,
  gainXp,
  grantLevelTechniques,
  knownTechniques,
  knowsElement,
  learnTechnique,
  lineageAllows,
  techniqueSlot,
  xpGain,
  type PlayerState,
} from './player';
import type { Rng } from './rng';
import { spin, type Slice } from './roulette';
import type { ConsumableId, Element, SummonAnimal, TechniqueSlot } from './types';

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

/** Vantagem ou desvantagem de ação na próxima luta contra vilão. */
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
  | { kind: 'xp'; amount: number }
  /** `overflowXp` > 0: a bolsa estava cheia e o item virou XP. */
  | { kind: 'bagItem'; item: ConsumableId; overflowXp: number }
  | { kind: 'coin'; coins: number }
  | { kind: 'trainingWeights' }
  | { kind: 'newTechnique'; techniqueId: string; scrolls: number }
  | { kind: 'secondaryElement'; element: Element; techniqueId: string | null }
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
// Itens e bolsa

/** Itens possíveis para o jogador: os Pesos de treino são únicos. */
export function itemPool(player: PlayerState, data: GameData): Weighted<ItemId>[] {
  return data.items.filter((i) => i.id !== 'trainingWeights' || player.trainingWeights === 'none');
}

export function rollItem(player: PlayerState, rng: Rng, data: GameData): Roll<ItemId> {
  return rollWeighted(itemPool(player, data), rng);
}

/** Soma XP e devolve o efeito com o valor efetivo (Determinação incluída). */
function xpStep(player: PlayerState, amount: number, data: GameData): Step {
  return step(gainXp(player, amount, data), { kind: 'xp', amount: xpGain(player, amount, data) });
}

/** Consumível vai para a bolsa (máximo 3 de cada); o excedente vira XP. */
function addToBag(player: PlayerState, item: ConsumableId, data: GameData): Step {
  const cfg = data.balance.items;
  if (player.bag[item] >= cfg.bagMax) {
    const xp = xpGain(player, cfg.bagOverflowXp, data);
    return step(gainXp(player, cfg.bagOverflowXp, data), { kind: 'bagItem', item, overflowXp: xp });
  }
  return step({ ...player, bag: { ...player.bag, [item]: player.bag[item] + 1 } }, { kind: 'bagItem', item, overflowXp: 0 });
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
      const types = usedSlots(player, data);
      const type = spin(
        types.map((t) => ({ label: t, weight: 1, value: t })),
        rng,
      ).slice.value;
      return scrollStep(player, type, 1);
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
    case 'xpScroll':
      return xpStep(player, data.balance.items.xpScroll, data);
    case 'soldierPill':
    case 'medKit':
    case 'explosiveTag':
    case 'smokeBomb':
      return addToBag(player, item, data);
    case 'loadedCoin':
      return step({ ...player, coins: player.coins + 1 }, { kind: 'coin', coins: player.coins + 1 });
    case 'trainingWeights':
      // A UI pergunta se equipa na hora (`equipTrainingWeights`).
      return step({ ...player, trainingWeights: 'stored' }, { kind: 'trainingWeights' });
  }
}

/** Categorias com técnica no skill set (o pergaminho só melhora essas). */
function usedSlots(player: PlayerState, data: GameData): TechniqueSlot[] {
  const types: TechniqueSlot[] = (['taijutsu', 'ninjutsu', 'genjutsu'] as const).filter((t) => canUseType(player, t, data));
  if (knownTechniques(player, data).some((t) => techniqueSlot(t) === 'medical')) types.push('medical');
  return types;
}

function scrollStep(player: PlayerState, type: TechniqueSlot, n: number): Step {
  const level = (player.techniqueLevels[type] ?? 0) + n;
  return step(
    { ...player, techniqueLevels: { ...player.techniqueLevels, [type]: level } },
    { kind: 'techniqueUpgrade', type, level },
  );
}

/** Moeda viciada: gasta uma para girar de novo uma roleta fora do combate. */
export function spendCoin(player: PlayerState): PlayerState {
  if (player.coins <= 0) throw new Error('Sem moeda viciada');
  return { ...player, coins: player.coins - 1 };
}

// ---------------------------------------------------------------------------
// Encontros: Akatsuki, invocação e guru

/** Roleta da Akatsuki: as fatias dependem de o jogador ser jinchuuriki. */
export function rollAkatsuki(player: PlayerState, rng: Rng, data: GameData): Roll<AkatsukiOutcome> {
  return rollWeighted(player.jinchuuriki ? data.akatsukiOutcomes.jinchuuriki : data.akatsukiOutcomes.others, rng);
}

/**
 * Akatsuki: caça jinchuuriki. Nunca causa game over: sem Vontade do Fogo para perder, o jogador começa
 * a próxima luta com metade do HP e do chakra (a UI passa isso para a luta, depois da restauração).
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
  return step(player, { kind: 'akatsukiWeakened', reason });
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
      const techniqueId = pickOne(pool, rng);
      return step(learnTechnique(player, techniqueId, data), { kind: 'newTechnique', techniqueId, scrolls: 0 });
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

/** Sobe 1 nível (HP e chakra máximos pela dificuldade e técnicas de nível). Não restaura. */
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

function pickOne<T extends string>(pool: T[], rng: Rng): T {
  return spin(
    pool.map((id) => ({ label: id, weight: 1, value: id })),
    rng,
  ).slice.value;
}

/**
 * Técnicas que a recompensa "nova técnica" pode ensinar: respeita a origem, ignora as já aprendidas
 * e só oferece técnicas elementais dos elementos que o jogador domina (afinidade ou secundário).
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

/** Elementos que o jogador pode ganhar como secundário (nenhum para o prodígio ou quem já tem um). */
export function secondaryElementOptions(player: PlayerState, data: GameData): Element[] {
  if (player.secondaryElements.length > 0 || player.affinity === null || player.forbiddenAttackTypes.includes('ninjutsu')) {
    return [];
  }
  return (Object.keys(data.elementWeights) as Element[]).filter((e) => e !== player.affinity);
}

/** Pool filtrada: fatias impossíveis somem (técnica sem nada para aprender, elemento secundário). */
export function rewardPool(player: PlayerState, data: GameData): Weighted<RewardId>[] {
  const canLearn = learnableTechniques(player, data).length > 0;
  const canElement = secondaryElementOptions(player, data).length > 0;
  return data.rewards.filter(
    (r) => (r.id !== 'newTechnique' || canLearn) && (r.id !== 'secondaryElement' || canElement),
  );
}

export function rollReward(player: PlayerState, rng: Rng, data: GameData): Roll<RewardId> {
  return rollWeighted(rewardPool(player, data), rng);
}

/** Lendária: gira várias vezes e o jogador escolhe 1 dos resultados. */
export function rollRewardChoices(player: PlayerState, rng: Rng, data: GameData): Roll<RewardId>[] {
  return Array.from({ length: data.balance.rewards.legendaryChoices }, () => rollReward(player, rng, data));
}

/** Giros da roleta de itens que a fatia "item" dá nesta raridade. */
export function rewardItemSpins(tier: number, data: GameData): number {
  return data.balance.rewards.itemSpins[tier - 1]!;
}

/**
 * Aplica uma recompensa na raridade `tier` (1 comum, 2 rara, 3 lendária).
 * A fatia "item" é resolvida pela roleta de itens (`rewardItemSpins` giros de `rollItem` + `applyItem`).
 */
export function applyReward(
  player: PlayerState,
  reward: Exclude<RewardId, 'item'>,
  tier: number,
  rng: Rng,
  data: GameData,
): Step {
  const cfg = data.balance.rewards;
  const i = tier - 1;
  switch (reward) {
    case 'stages': {
      const n = cfg.stages[i]!;
      return step(applyStatStages(player, n, data), { kind: 'stages', n });
    }
    case 'newTechnique': {
      const pool = learnableTechniques(player, data);
      if (pool.length === 0) throw new Error('Nenhuma técnica disponível para esta origem');
      const techniqueId = pickOne(pool, rng);
      let p = learnTechnique(player, techniqueId, data);
      // Rara e lendária: pergaminhos na categoria da técnica aprendida.
      const scrolls = cfg.techniqueScrolls[i]!;
      if (scrolls > 0) p = scrollStep(p, techniqueSlot(data.techniquesById[techniqueId]!), scrolls).player;
      return step(p, { kind: 'newTechnique', techniqueId, scrolls });
    }
    case 'xp':
      return xpStep(player, cfg.xp[i]!, data);
    case 'resistance': {
      const amount = cfg.resistance[i]!;
      return step({ ...player, resistanceBonus: player.resistanceBonus + amount }, { kind: 'resistance', amount });
    }
    case 'critBonus': {
      const amount = cfg.critBonus[i]!;
      return step({ ...player, critBonus: player.critBonus + amount }, { kind: 'critBonus', amount });
    }
    case 'secondaryElement': {
      const options = secondaryElementOptions(player, data);
      if (options.length === 0) throw new Error('Sem elemento secundário possível');
      const element = pickOne(options, rng);
      let p: PlayerState = { ...player, secondaryElements: [...player.secondaryElements, element] };
      // Lendária: aprende também a técnica básica do elemento.
      let techniqueId: string | null = null;
      const basic = tier >= 3 ? elementalBasic(element, data) : undefined;
      if (basic) {
        p = learnTechnique(p, basic.id, data);
        techniqueId = basic.id;
      }
      // O elemento novo pode liberar técnicas de nível já alcançado.
      return step(grantLevelTechniques(p, data), { kind: 'secondaryElement', element, techniqueId });
    }
  }
}
