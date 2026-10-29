// Tudo o que acontece fora do combate: eventos pré-vilão, jokenpô, itens, encontros, guru, recompensas e nível.
// Funções puras: recebem o jogador e devolvem um novo, mais a descrição do efeito para a UI.
import type { AkatsukiOutcome, GuruOutcome, ItemId, PremiumId, RewardId, Weighted } from '../data/events';
import type { ClanLessonBonus } from '../data/balance';
import type { GameData } from './gameData';
import { COMMON_LINEAGE } from './origin';
import {
  applyLevelUp,
  applyStatStages,
  elementalBasic,
  gainXp,
  grantLevelTechniques,
  highestOffense,
  knownLine,
  knowsElement,
  learnTechnique,
  lineageAllows,
  techniqueLevel,
  upgradableTechniques,
  upgradeTechnique,
  xpGain,
  type PlayerState,
} from './player';
import type { Rng } from './rng';
import { spin, type Slice } from './roulette';
import type { ConsumableId, Element, ResistanceKind, SummonAnimal } from './types';

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
  /** Upgrade aplicado: `techniqueId` é a ficha depois do upgrade (nas linhas, a técnica nova). */
  | { kind: 'techniqueUpgrade'; from: string; techniqueId: string; level: number }
  /** Upgrades à escolha ganhos (resolvidos depois com `chooseUpgrade`). */
  | { kind: 'upgradeGranted'; n: number }
  /** Upgrade sem técnica para subir: vira XP. */
  | { kind: 'upgradeForfeit'; xp: number }
  | { kind: 'resistance'; physical: number; mental: number }
  | { kind: 'training'; stat: TrainingStat; amount: number; xp: number }
  | { kind: 'speed'; amount: number }
  | { kind: 'critBonus'; amount: number }
  | { kind: 'xp'; amount: number }
  /** `overflowXp` > 0: a bolsa estava cheia e o item virou XP. */
  | { kind: 'bagItem'; item: ConsumableId; overflowXp: number }
  | { kind: 'coin'; coins: number }
  | { kind: 'trainingWeights' }
  /** `techniqueId` null: sem técnica para aprender, a recompensa virou só upgrades. */
  | { kind: 'newTechnique'; techniqueId: string | null; upgrades: number }
  | { kind: 'secondaryElement'; element: Element; techniqueId: string | null }
  | { kind: 'akatsukiTookRevive'; reason: AkatsukiReason }
  | { kind: 'akatsukiWeakened'; reason: AkatsukiReason }
  | { kind: 'akatsukiInsight'; amount: number }
  | { kind: 'akatsukiUnnoticed' }
  | { kind: 'guruCharlatan' }
  /** Premium ensinada (`level` = nível dela agora; `techniqueId` nas técnicas). */
  | { kind: 'guruPremium'; premium: PremiumId; techniqueId: string | null; level: number }
  /** `learned`: técnicas de nível aprendidas junto com a subida. `upgrades`: upgrade grátis do marco. */
  | { kind: 'levelUp'; level: number; hp: number; chakra: number; learned: string[]; upgrades: number }
  | { kind: 'summonLearned'; animal: SummonAnimal }
  /** Lição do clã: XP e bônus permanente da linhagem. */
  | { kind: 'clanLesson'; lineageId: string; xp: number; bonus: ClanLessonBonus }
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
export type SimpleEventId = 'oldLady' | 'ramen';

export function applySimpleEvent(player: PlayerState, id: SimpleEventId): Step {
  switch (id) {
    case 'oldLady':
      return step(player, { kind: 'villainFirst' }, { villainStartsFirst: true, playerStartsFirst: false });
    case 'ramen':
      return step(player, { kind: 'playerFirst' }, { playerStartsFirst: true, villainStartsFirst: false });
  }
}

// ---------------------------------------------------------------------------
// Treino (campanha.md#treino)

/** Status que a roleta de destaque do treino pode sortear. */
export type TrainingStat = 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'physical' | 'mental' | 'speed';
export const TRAINING_STATS: readonly TrainingStat[] = ['taijutsu', 'ninjutsu', 'genjutsu', 'physical', 'mental', 'speed'];

function trainingValue(player: PlayerState, stat: TrainingStat): number {
  if (stat === 'speed') return player.speed;
  if (stat === 'physical' || stat === 'mental') return player.resistance[stat];
  return player.offense[stat];
}

/** Fatias do destaque: os pesos são os próprios status (status zerado não entra). */
export function trainingPool(player: PlayerState): Weighted<TrainingStat>[] {
  return TRAINING_STATS.map((id) => ({ id, weight: trainingValue(player, id) })).filter((w) => w.weight > 0);
}

export function rollTraining(player: PlayerState, rng: Rng): Roll<TrainingStat> {
  return rollWeighted(trainingPool(player), rng);
}

/** Treino: XP garantido e +3 no status em destaque (speed +2). */
export function applyTraining(player: PlayerState, stat: TrainingStat, data: GameData): Step {
  const cfg = data.balance.events.training;
  const amount = stat === 'speed' ? cfg.speedHighlight : cfg.highlight;
  let p: PlayerState;
  if (stat === 'speed') p = { ...player, speed: player.speed + amount };
  else if (stat === 'physical' || stat === 'mental') p = { ...player, resistance: { ...player.resistance, [stat]: player.resistance[stat] + amount } };
  else p = { ...player, offense: { ...player.offense, [stat]: player.offense[stat] + amount } };
  const xp = xpGain(p, cfg.xp, data);
  return step(gainXp(p, cfg.xp, data), { kind: 'training', stat, amount, xp });
}

// ---------------------------------------------------------------------------
// Lição do clã (campanha.md#lição-do-clã)

/** Lição do clã: XP e o bônus permanente da linhagem (status, HP ou chakra máximos). */
export function applyClanLesson(player: PlayerState, data: GameData): Step {
  const cfg = data.balance.events.clanLesson;
  const lineageId = player.origin.lineageId ?? COMMON_LINEAGE;
  const bonus = cfg.bonus[lineageId] ?? {};
  const offense = { ...player.offense };
  offense.taijutsu += bonus.taijutsu ?? 0;
  offense.ninjutsu += bonus.ninjutsu ?? 0;
  offense.genjutsu += bonus.genjutsu ?? 0;
  if (bonus.highestOffense) offense[highestOffense(player)] += bonus.highestOffense;
  const p: PlayerState = {
    ...player,
    offense,
    speed: player.speed + (bonus.speed ?? 0),
    maxHp: player.maxHp + (bonus.hp ?? 0),
    hp: player.hp + (bonus.hp ?? 0),
    maxChakra: player.maxChakra + (bonus.chakra ?? 0),
    chakra: player.chakra + (bonus.chakra ?? 0),
  };
  const xp = xpGain(p, cfg.xp, data);
  return step(gainXp(p, cfg.xp, data), { kind: 'clanLesson', lineageId, xp, bonus });
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
    case 'techniqueScroll':
      // +1 nível numa técnica à escolha (resolvido depois com `chooseUpgrade`).
      return grantUpgrades(player, 1);
    // Amuletos: efeito permanente; ficam na bolsa.
    case 'resistanceItem': {
      const kind = rollResistanceKind(rng);
      const amount = data.balance.items.resistanceAmulet;
      const p = addResistance({ ...player, amulets: { ...player.amulets, resistance: player.amulets.resistance + 1 } }, kind, amount);
      return step(p, resistanceEffect(kind === 'physical' ? amount : 0, kind === 'mental' ? amount : 0));
    }
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

/** Física ou mental, 50% cada (amuleto e recompensa de resistência). */
function rollResistanceKind(rng: Rng): ResistanceKind {
  return spin<ResistanceKind>(
    [
      { label: 'physical', weight: 1, value: 'physical' },
      { label: 'mental', weight: 1, value: 'mental' },
    ],
    rng,
  ).slice.value;
}

function addResistance(player: PlayerState, kind: ResistanceKind, amount: number): PlayerState {
  return { ...player, resistance: { ...player.resistance, [kind]: player.resistance[kind] + amount } };
}

const resistanceEffect = (physical: number, mental: number): ProgressEffect => ({ kind: 'resistance', physical, mental });

// ---------------------------------------------------------------------------
// Upgrades de técnica à escolha (tecnicas.md#níveis-de-técnica)

/** Ganha upgrades à escolha. A UI (ou a simulação) resolve um por vez com `chooseUpgrade`/`forfeitUpgrade`. */
export function grantUpgrades(player: PlayerState, n: number): Step {
  return step({ ...player, pendingUpgrades: player.pendingUpgrades + n }, { kind: 'upgradeGranted', n });
}

/** Técnicas que o upgrade pendente pode subir agora. Vazia = o upgrade vira XP (`forfeitUpgrade`). */
export function upgradeOptions(player: PlayerState, data: GameData): string[] {
  return upgradableTechniques(player, data);
}

/** Gasta um upgrade pendente na técnica escolhida. */
export function chooseUpgrade(player: PlayerState, techniqueId: string, data: GameData): Step {
  if (player.pendingUpgrades <= 0) throw new Error('Nenhum upgrade pendente');
  const p = upgradeTechnique({ ...player, pendingUpgrades: player.pendingUpgrades - 1 }, techniqueId, data);
  const after = p.techniques.find((id) => !player.techniques.includes(id)) ?? techniqueId;
  return step(p, { kind: 'techniqueUpgrade', from: techniqueId, techniqueId: after, level: techniqueLevel(p, after, data) });
}

/** Upgrade pendente sem técnica para subir: vira XP. */
export function forfeitUpgrade(player: PlayerState, data: GameData): Step {
  if (player.pendingUpgrades <= 0) throw new Error('Nenhum upgrade pendente');
  const amount = data.balance.techniqueUpgrade.noTargetXp;
  const p = { ...player, pendingUpgrades: player.pendingUpgrades - 1 };
  return step(gainXp(p, amount, data), { kind: 'upgradeForfeit', xp: xpGain(p, amount, data) });
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
 * Akatsuki: caça jinchuuriki. Nunca causa game over: sem Vontade do Fogo para perder, o jogador perde
 * metade do HP e do chakra que tem (o HP nunca fica abaixo de 1).
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
  const weakened = {
    ...player,
    hp: Math.max(1, Math.floor(player.hp * (1 - cfg.akatsukiNoReviveHpPct))),
    chakra: Math.floor(player.chakra * (1 - cfg.akatsukiNoReviveChakraPct)),
  };
  return step(weakened, { kind: 'akatsukiWeakened', reason });
}

// ---------------------------------------------------------------------------
// Guru: premium (campanha.md#guru)

const RASENGAN = 'rasengan';
const MEDICAL = 'medicalNinjutsu';

/** A técnica premium pode ser ensinada agora (nova, ou o próximo nível dentro do teto). */
function premiumTechniqueOpen(player: PlayerState, id: string, data: GameData): boolean {
  const tech = data.techniquesById[id]!;
  if (player.forbiddenAttackTypes.includes(tech.type)) return false;
  const known = tech.line ? knownLine(player, tech.line, data) : player.techniques.includes(id) ? tech : null;
  return known === null || upgradableTechniques(player, data).includes(known.id);
}

/** Roleta das premium, ponderada pelo perfil. Premium sem nível para subir ou proibida some. */
export function premiumPool(player: PlayerState, data: GameData): Weighted<PremiumId>[] {
  const cfg = data.balance.guru;
  const pool: Weighted<PremiumId>[] = [];
  if (premiumTechniqueOpen(player, RASENGAN, data)) pool.push({ id: 'rasengan', weight: player.offense.ninjutsu });
  if (premiumTechniqueOpen(player, MEDICAL, data)) {
    pool.push({ id: 'medical', weight: Math.floor(player.maxChakra / cfg.medicalChakraDivisor) });
  }
  if (player.focusUses < cfg.focusMaxLevel) pool.push({ id: 'focus', weight: player.offense.taijutsu });
  if (player.substitutionBonus < cfg.substitutionMaxLevel) pool.push({ id: 'substitution', weight: player.speed });
  return pool.map((w) => ({ ...w, weight: Math.max(1, w.weight) }));
}

export function rollPremium(player: PlayerState, rng: Rng, data: GameData): Roll<PremiumId> {
  return rollWeighted(premiumPool(player, data), rng);
}

/** Ensina a premium: técnica nova, o próximo nível dela, ou +1 uso por luta (Foco, Substituição). */
export function applyPremium(player: PlayerState, premium: PremiumId, data: GameData): Step {
  if (premium === 'focus') {
    const level = player.focusUses + 1;
    return step({ ...player, focusUses: level }, { kind: 'guruPremium', premium, techniqueId: null, level });
  }
  if (premium === 'substitution') {
    const level = player.substitutionBonus + 1;
    return step({ ...player, substitutionBonus: level }, { kind: 'guruPremium', premium, techniqueId: null, level });
  }
  const id = premium === 'rasengan' ? RASENGAN : MEDICAL;
  const tech = data.techniquesById[id]!;
  const known = tech.line ? knownLine(player, tech.line, data) : player.techniques.includes(id) ? tech : null;
  let p: PlayerState;
  let techniqueId: string;
  if (known) {
    p = upgradeTechnique(player, known.id, data);
    techniqueId = p.techniques.find((t) => !player.techniques.includes(t)) ?? known.id;
  } else {
    p = learnTechnique(player, id, data);
    techniqueId = id;
  }
  return step(p, { kind: 'guruPremium', premium, techniqueId, level: techniqueLevel(p, techniqueId, data) });
}

/** Roleta do guru: sem premium para ensinar, a fatia some. */
export function guruPool(player: PlayerState, data: GameData): Weighted<GuruOutcome>[] {
  return data.guruOutcomes.filter((o) => o.id !== 'premium' || premiumPool(player, data).length > 0);
}

export function rollGuru(player: PlayerState, rng: Rng, data: GameData): Roll<GuruOutcome> {
  return rollWeighted(guruPool(player, data), rng);
}

/** Guru: charlatão (desvantagem de ação) ou uma premium sorteada pelo perfil. */
export function applyGuru(player: PlayerState, outcome: GuruOutcome, rng: Rng, data: GameData): Step {
  if (outcome === 'charlatan') {
    return step(player, { kind: 'guruCharlatan' }, { villainStartsFirst: true, playerStartsFirst: false });
  }
  return applyPremium(player, rollPremium(player, rng, data).value, data);
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
// Exame chunin

/** Derrota no exame: os médicos atendem e o jogador segue com metade do HP e do chakra máximos. */
export function examRecover(player: PlayerState, data: GameData): PlayerState {
  const pct = data.balance.exam.lossRecoverPct;
  return {
    ...player,
    hp: Math.max(player.hp, Math.floor(player.maxHp * pct)),
    chakra: Math.max(player.chakra, Math.floor(player.maxChakra * pct)),
  };
}

// ---------------------------------------------------------------------------
// Nível

/** Sobe 1 nível: HP e chakra máximos pela dificuldade, restauração total, técnicas de nível e o upgrade do marco. */
export function levelUp(player: PlayerState, data: GameData): Step {
  const next = applyLevelUp(player, data);
  const learned = next.techniques.filter((id) => !player.techniques.includes(id));
  return step(next, {
    kind: 'levelUp',
    level: next.level,
    hp: next.maxHp - player.maxHp,
    chakra: next.maxChakra - player.maxChakra,
    learned,
    upgrades: next.pendingUpgrades - player.pendingUpgrades,
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
 * Técnicas que a recompensa "nova técnica" pode ensinar: respeita a origem e o nível mínimo, ignora as
 * já aprendidas (e linhas que o jogador já tem) e só oferece técnicas elementais dos elementos que ele
 * domina (afinidade ou secundário). As premium não entram (só o guru ensina).
 */
export function learnableTechniques(player: PlayerState, data: GameData): string[] {
  return data.techniques
    .filter(
      (t) =>
        !t.premium &&
        (t.minLevel ?? 1) <= player.level &&
        !player.forbiddenAttackTypes.includes(t.type) &&
        !player.techniques.includes(t.id) &&
        !(t.line && knownLine(player, t.line, data)) &&
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

/** Pool filtrada: fatias impossíveis somem (técnica sem nada para aprender nem subir, elemento secundário). */
export function rewardPool(player: PlayerState, data: GameData): Weighted<RewardId>[] {
  const canLearn = learnableTechniques(player, data).length > 0 || upgradableTechniques(player, data).length > 0;
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
      // Rara e lendária: upgrades à escolha junto. Sem técnica para aprender, vira 1 upgrade a mais.
      const pool = learnableTechniques(player, data);
      const extra = cfg.techniqueUpgrades[i]!;
      if (pool.length === 0) {
        if (upgradableTechniques(player, data).length === 0) throw new Error('Nenhuma técnica para aprender nem subir');
        const p = grantUpgrades(player, extra + 1).player;
        return step(p, { kind: 'newTechnique', techniqueId: null, upgrades: extra + 1 });
      }
      const techniqueId = pickOne(pool, rng);
      const p = grantUpgrades(learnTechnique(player, techniqueId, data), extra).player;
      return step(p, { kind: 'newTechnique', techniqueId, upgrades: extra });
    }
    case 'xp':
      return xpStep(player, cfg.xp[i]!, data);
    case 'resistance': {
      // Pontos distribuídos um a um entre física e mental (50% cada).
      let p = player;
      const gained = { physical: 0, mental: 0 };
      for (let n = 0; n < cfg.resistance[i]!; n++) {
        const kind = rollResistanceKind(rng);
        gained[kind]++;
        p = addResistance(p, kind, 1);
      }
      return step(p, resistanceEffect(gained.physical, gained.mental));
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
