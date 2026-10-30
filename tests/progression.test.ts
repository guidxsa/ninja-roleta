import { describe, expect, it } from 'vitest';
import { availableActions, playerTechnique, playRound, slugHealPct, startBattle, toadDamagePct, type BattleEvent } from '../src/core/combat';
import { scaleVillain, type Difficulty } from '../src/core/difficulty';
import {
  applyLevelUp,
  applyStatStages,
  canLevelUp,
  createPlayer,
  equipTrainingWeights,
  gainXp,
  learnTechnique,
  recoverAfterWin,
  removeTrainingWeights,
  trainingWeightsWin,
  withDifficulty,
  xpToNextLevel,
} from '../src/core/player';
import {
  applyAkatsuki,
  applyGuru,
  rollPremiumChoices,
  applyItem,
  applyPremium,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  applyTraining,
  chooseUpgrade,
  examRecover,
  forfeitUpgrade,
  guruPool,
  itemPool,
  learnableTechniques,
  levelUp,
  playJokenpo,
  premiumPool,
  rewardItemSpins,
  rewardPool,
  rollAkatsuki,
  rollRewardChoices,
  rollTraining,
  spendCoin,
  trainingPool,
  upgradeOptions,
} from '../src/core/progression';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { campaign } from '../src/data/campaign';
import { gameData } from '../src/data/index';
import { villainsById } from '../src/data/villains';
import { battle, seq, testVillain, withInitiative } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
const uchiha: Origin = { lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false };
const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };
const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);

describe('restauração', () => {
  it('a luta não começa restaurada: HP e chakra seguem como estavam, mas sem efeitos', () => {
    const p = { ...createPlayer(common, gameData), hp: 10, chakra: 0 };
    const s0 = startBattle(p, testVillain(), {}, gameData);
    expect([s0.player.hp, s0.player.chakra]).toEqual([10, 0]);
    expect(s0.playerFx).toMatchObject({ poison: null, bleeding: false, burn: 0 });
  });

  it('o vilão sempre começa cheio; `restore: true` ainda restaura o jogador', () => {
    const p = { ...createPlayer(common, gameData), hp: 10 };
    const s0 = startBattle(p, testVillain(), { restore: true });
    expect([s0.player.hp, s0.villain.hp]).toEqual([100, 50]);
  });

  it('subir de nível restaura HP e chakra por completo', () => {
    const p = { ...createPlayer(common, gameData), xp: 100, hp: 5, chakra: 0 };
    const up = applyLevelUp(p, gameData);
    expect([up.hp, up.maxHp, up.chakra, up.maxChakra]).toEqual([108, 108, 31, 31]);
  });

  it('exame: quem perde segue para a próxima luta com 50% do HP e do chakra máximos', () => {
    const p = { ...createPlayer(common, gameData), hp: 0, chakra: 3 };
    expect(examRecover(p, gameData)).toMatchObject({ hp: 50, chakra: 15 });
    // Quem tem mais do que isso não perde nada.
    expect(examRecover({ ...p, hp: 80 }, gameData).hp).toBe(80);
  });
});

describe('estágios de status', () => {
  it('sobe todos os status, inclusive as resistências; HP e chakra atuais sobem junto', () => {
    const p = { ...createPlayer(common, gameData), hp: 50 };
    const up = applyStatStages(p, 2, gameData);
    expect(up.offense).toEqual({ taijutsu: 12, ninjutsu: 12, genjutsu: 12 });
    expect(up.resistance).toEqual({ physical: 12, mental: 12 });
    expect(up.speed).toBe(12);
    // HP e chakra máximos sobem o mesmo que 2 níveis no Médio (+8 HP e +1 chakra cada).
    expect([up.maxHp, up.hp]).toEqual([116, 66]);
    expect([up.maxChakra, up.chakra]).toEqual([32, 32]);
  });

  it('o ganho de HP e chakra do estágio segue a dificuldade', () => {
    const easy = applyStatStages(createPlayer(common, gameData, 'easy'), 1, gameData);
    expect([easy.maxHp, easy.maxChakra]).toEqual([110, 32]);
    const hard = applyStatStages(createPlayer(common, gameData, 'hard'), 1, gameData);
    expect([hard.maxHp, hard.maxChakra]).toEqual([106, 31]);
  });

  it('prodígio do taijutsu: ninjutsu e genjutsu continuam zerados', () => {
    const up = applyStatStages(createPlayer(prodigy, gameData), 1, gameData);
    expect(up.offense).toEqual({ taijutsu: 18, ninjutsu: 0, genjutsu: 0 });
  });
});

describe('eventos pré-vilão', () => {
  it('velhinha: vilão age primeiro; ramen: jogador age primeiro', () => {
    const p = createPlayer(common, gameData);
    expect(applySimpleEvent(p, 'oldLady').mods).toEqual({ villainStartsFirst: true, playerStartsFirst: false });
    expect(applySimpleEvent(p, 'ramen').mods).toEqual({ playerStartsFirst: true, villainStartsFirst: false });
  });

  it('treino: XP garantido e +3 no status em destaque (speed +2)', () => {
    const p = createPlayer(common, gameData);
    const step = applyTraining(p, 'taijutsu', gameData);
    // +60 de XP com a Determinação do comum: 75
    expect(step.effect).toEqual({ kind: 'training', stat: 'taijutsu', amount: 3, xp: 75 });
    expect([step.player.offense.taijutsu, step.player.xp]).toEqual([13, 75]);
    expect(applyTraining(p, 'speed', gameData).player.speed).toBe(12);
    expect(applyTraining(p, 'mental', gameData).player.resistance.mental).toBe(13);
  });

  it('treino: a roleta de destaque pesa pelos próprios status; status zerado não entra', () => {
    const akimichi = createPlayer({ lineageId: 'akimichi', affinity: 'earth', jinchuuriki: false }, gameData);
    expect(Object.fromEntries(trainingPool(akimichi).map((w) => [w.id, w.weight]))).toEqual({
      taijutsu: 15,
      ninjutsu: 8,
      genjutsu: 5,
      physical: 14,
      mental: 6,
      speed: 6,
    });
    const lee = createPlayer(prodigy, gameData);
    expect(trainingPool(lee).map((w) => w.id)).toEqual(['taijutsu', 'physical', 'mental', 'speed']);
    expect(rollTraining(lee, seq(0.0)).value).toBe('taijutsu');
  });

  it('roleta pré-vilão: invocações, velhinha, ramen, Akatsuki, treino, jokenpô, item, guru e lição do clã', () => {
    expect(Object.fromEntries(gameData.preFightEvents.map((e) => [e.id, e.weight]))).toEqual({
      summon: 10,
      oldLady: 10,
      ramen: 10,
      akatsuki: 10,
      training: 20,
      jokenpo: 20,
      foundItem: 10,
      guru: 10,
      clanLesson: 10,
    });
  });

  it('jokenpô: vitória dá 2 estágios, empate nada, derrota dá desvantagem de ação', () => {
    const p = createPlayer(common, gameData);
    // 0.0 → pedra, 0.5 → papel, 0.9 → tesoura
    const win = playJokenpo(p, 'paper', seq(0.0), gameData);
    expect(win.result).toBe('win');
    expect(win.player.speed).toBe(12);
    expect(playJokenpo(p, 'paper', seq(0.5), gameData)).toMatchObject({ result: 'draw', mods: {} });
    expect(playJokenpo(p, 'paper', seq(0.9), gameData)).toMatchObject({ result: 'loss', mods: { villainStartsFirst: true } });
  });
});

describe('itens', () => {
  const p = createPlayer(common, gameData);

  it('roleta de itens com os pesos do design', () => {
    expect(Object.fromEntries(gameData.items.map((i) => [i.id, i.weight]))).toEqual({
      revive: 10,
      ninjaTool: 12,
      techniqueScroll: 13,
      resistanceItem: 10,
      speedItem: 10,
      xpScroll: 10,
      soldierPill: 8,
      medKit: 8,
      explosiveTag: 7,
      smokeBomb: 5,
      loadedCoin: 4,
      trainingWeights: 3,
    });
  });

  it('ferramenta ninja é única e evolui: +1 de dano base por nível em todos os ataques', () => {
    const lv1 = applyItem(p, 'ninjaTool', seq(0.5), gameData).player;
    const lv2 = applyItem(lv1, 'ninjaTool', seq(0.5), gameData).player;
    expect(lv2.ninjaToolLevel).toBe(2);
    expect(playerTechnique(lv2, 'basicTaijutsu', gameData).baseDamage).toBe(10);
    expect(playerTechnique(lv2, 'fireSpark', gameData).baseDamage).toBe(14);
  });

  it('pergaminho: +1 nível numa técnica à escolha, respeitando o teto; sem alvo, vira 30 de XP', () => {
    const step = applyItem(p, 'techniqueScroll', seq(0.1), gameData);
    expect(step.effect).toEqual({ kind: 'upgradeGranted', n: 1 });
    expect(step.player.pendingUpgrades).toBe(1);
    // Nível 1: teto no nível I, nada sobe. O upgrade vira XP (30, com a Determinação: 37).
    expect(upgradeOptions(step.player, gameData)).toEqual([]);
    expect(forfeitUpgrade(step.player, gameData)).toMatchObject({ player: { pendingUpgrades: 0, xp: 37 }, effect: { kind: 'upgradeForfeit', xp: 37 } });
    // Nível 4: o Punho de Chakra sobe genericamente (+3 de dano; continua grátis).
    const lv4 = { ...step.player, level: 4 };
    expect(upgradeOptions(lv4, gameData)).toEqual(['basicTaijutsu', 'fireSpark']);
    const up = chooseUpgrade(lv4, 'basicTaijutsu', gameData);
    expect(up.effect).toEqual({ kind: 'techniqueUpgrade', from: 'basicTaijutsu', techniqueId: 'basicTaijutsu', level: 2 });
    expect(playerTechnique(up.player, 'basicTaijutsu', gameData)).toMatchObject({ baseDamage: 11, chakraCost: 0 });
  });

  it('retorno, resistência, velocidade e pergaminho de experiência', () => {
    expect(applyItem(p, 'revive', seq(0.5), gameData).player.revives).toBe(2);
    // Amuleto: +2 numa resistência sorteada (0.0 física, 0.5 mental).
    expect(applyItem(p, 'resistanceItem', seq(0.0), gameData).player.resistance).toEqual({ physical: 12, mental: 10 });
    const mental = applyItem(p, 'resistanceItem', seq(0.5), gameData);
    expect(mental.player.resistance).toEqual({ physical: 10, mental: 12 });
    expect(mental.effect).toEqual({ kind: 'resistance', physical: 0, mental: 2 });
    expect(applyItem(p, 'speedItem', seq(0.5), gameData).player.speed).toBe(11);
    // +100 de XP, com a Determinação do comum: 125
    expect(applyItem(p, 'xpScroll', seq(0.5), gameData)).toMatchObject({ player: { xp: 125 }, effect: { kind: 'xp', amount: 125 } });
  });

  it('amuletos de resistência e velocidade ficam guardados na bolsa e acumulam', () => {
    expect(p.amulets).toEqual({ speed: 0, resistance: 0 });
    let q = applyItem(p, 'speedItem', seq(0.5), gameData).player;
    q = applyItem(q, 'speedItem', seq(0.5), gameData).player;
    q = applyItem(q, 'resistanceItem', seq(0.5), gameData).player;
    expect(q.amulets).toEqual({ speed: 2, resistance: 1 });
    expect([q.speed, q.resistance.mental]).toEqual([12, 12]);
  });

  it('consumíveis vão para a bolsa (máximo 3 de cada); o excedente vira 30 de XP', () => {
    let q = createPlayer(uchiha, gameData);
    for (let i = 0; i < 3; i++) q = applyItem(q, 'soldierPill', seq(0.5), gameData).player;
    expect(q.bag.soldierPill).toBe(3);
    const over = applyItem(q, 'soldierPill', seq(0.5), gameData);
    expect(over.effect).toEqual({ kind: 'bagItem', item: 'soldierPill', overflowXp: 30 });
    expect([over.player.bag.soldierPill, over.player.xp]).toEqual([3, 30]);
  });

  it('a bolsa segue para a luta', () => {
    const q = applyItem(p, 'medKit', seq(0.5), gameData).player;
    expect(startBattle(q, testVillain(), {}, gameData).player.bag.medKit).toBe(1);
    expect(availableActions(startBattle(q, testVillain()), gameData)).toContain('item:medKit');
  });

  it('Moeda viciada: acumula e cada uma permite girar de novo uma roleta', () => {
    const q = applyItem(applyItem(p, 'loadedCoin', seq(0.5), gameData).player, 'loadedCoin', seq(0.5), gameData).player;
    expect(q.coins).toBe(2);
    expect(spendCoin(q).coins).toBe(1);
    expect(() => spendCoin(p)).toThrow();
  });

  it('Pesos de treino: −2 de speed equipados, +1 de taijutsu por vitória; tirar devolve o speed e dá +3', () => {
    const got = applyItem(p, 'trainingWeights', seq(0.5), gameData).player;
    expect(got.trainingWeights).toBe('stored');
    expect(itemPool(got, gameData).map((i) => i.id)).not.toContain('trainingWeights');
    const on = equipTrainingWeights(got, gameData);
    expect(on.speed).toBe(8);
    const won = trainingWeightsWin(trainingWeightsWin(on, gameData), gameData);
    expect(won.offense.taijutsu).toBe(12);
    const off = removeTrainingWeights(won, gameData);
    expect([off.speed, off.trainingWeights]).toEqual([13, 'removed']);
    expect(trainingWeightsWin(off, gameData).offense.taijutsu).toBe(12);
    expect(() => equipTrainingWeights(off, gameData)).toThrow();
  });
});

describe('encontros', () => {
  const jin = () => createPlayer({ ...common, jinchuuriki: true }, gameData);

  it('Akatsuki: 70/30, com fatias diferentes para quem é jinchuuriki', () => {
    expect(rollAkatsuki(jin(), seq(0.5), gameData).value).toBe('hunted');
    expect(rollAkatsuki(jin(), seq(0.8), gameData).value).toBe('unnoticed');
    expect(rollAkatsuki(createPlayer(common, gameData), seq(0.5), gameData).value).toBe('insight');
    expect(rollAkatsuki(createPlayer(common, gameData), seq(0.8), gameData).value).toBe('meddled');
  });

  it('Akatsuki: quem não é jinchuuriki e assiste de longe ganha chance de crítico', () => {
    const p = createPlayer(common, gameData);
    const step = applyAkatsuki(p, 'insight', gameData);
    expect(step.effect).toEqual({ kind: 'akatsukiInsight', amount: 0.05 });
    expect(step.player.critBonus).toBeCloseTo(0.05);
  });

  it('Akatsuki: caçado perde 1 Vontade do Fogo; sem nenhuma, perde metade do HP e do chakra que tem', () => {
    const took = applyAkatsuki(jin(), 'hunted', gameData);
    expect(took.effect).toEqual({ kind: 'akatsukiTookRevive', reason: 'hunted' });
    expect(took.player.revives).toBe(0);
    const weak = applyAkatsuki({ ...took.player, hp: 81 }, 'hunted', gameData);
    expect(weak.effect).toEqual({ kind: 'akatsukiWeakened', reason: 'hunted' });
    expect([weak.player.hp, weak.player.chakra]).toEqual([40, 30]);
    // O HP nunca fica abaixo de 1.
    expect(applyAkatsuki({ ...took.player, hp: 1 }, 'hunted', gameData).player.hp).toBe(1);
  });

  it('guru: 20% de charlatão; a premium é sorteada pelo perfil, 2 opções diferentes, e o jogador escolhe', () => {
    const p = createPlayer(common, gameData);
    expect(gameData.guruOutcomes).toEqual([
      { id: 'charlatan', weight: 20 },
      { id: 'premium', weight: 80 },
    ]);
    expect(applyGuru(p, 'charlatan', null, gameData).mods).toEqual({ villainStartsFirst: true, playerStartsFirst: false });
    // Pesos: Rasengan e Clones = ninjutsu, Palma Curativa = chakra ÷ 3, Foco = taijutsu,
    // Substituição e Corpo Cintilante = speed.
    expect(premiumPool(p, gameData)).toEqual([
      { id: 'rasengan', weight: 10 },
      { id: 'medical', weight: 10 },
      { id: 'focus', weight: 10 },
      { id: 'substitution', weight: 10 },
      { id: 'shadowClones', weight: 10 },
      { id: 'glimmer', weight: 10 },
    ]);
    expect(rollPremiumChoices(p, seq(0.0, 0.0), gameData).map((r) => r.value)).toEqual(['rasengan', 'medical']);
    // Só uma premium para ensinar: só uma opção.
    const one = { ...p, forbiddenAttackTypes: ['ninjutsu' as const], focusUses: 3, substitutionBonus: 3 };
    expect(rollPremiumChoices(one, seq(0.0, 0.0), gameData).map((r) => r.value)).toEqual(['glimmer']);
    const rasengan = applyGuru(p, 'premium', 'rasengan', gameData);
    expect(rasengan.effect).toEqual({ kind: 'guruPremium', premium: 'rasengan', techniqueId: 'rasengan', level: 1 });
    expect(rasengan.player.techniques).toContain('rasengan');
    // Nível 1: o Rasengan II passa do teto, então ele some da roleta.
    expect(premiumPool(rasengan.player, gameData).map((w) => w.id)).not.toContain('rasengan');
  });

  it('guru: já tendo a premium, ensina o próximo nível dela; talentos dão +1 uso por luta', () => {
    const lv4 = { ...createPlayer(common, gameData), level: 4 };
    const first = applyPremium(lv4, 'rasengan', gameData).player;
    expect(applyPremium(first, 'rasengan', gameData)).toMatchObject({
      effect: { kind: 'guruPremium', premium: 'rasengan', techniqueId: 'rasengan2', level: 2 },
    });
    const focus = applyPremium(lv4, 'focus', gameData);
    expect([focus.player.focusUses, focus.effect]).toEqual([1, { kind: 'guruPremium', premium: 'focus', techniqueId: null, level: 1 }]);
    expect(applyPremium(lv4, 'substitution', gameData).player.substitutionBonus).toBe(1);
    const medic = applyPremium(lv4, 'medical', gameData).player;
    expect(applyPremium(medic, 'medical', gameData).player.techniqueLevels).toEqual({ medicalNinjutsu: 1 });
  });

  it('guru: o prodígio só recebe talentos; sem nada para ensinar, só sobra o charlatão', () => {
    const p = createPlayer(prodigy, gameData);
    expect(premiumPool(p, gameData).map((w) => w.id)).toEqual(['focus', 'substitution', 'glimmer']);
    const maxed = { ...p, focusUses: 3, substitutionBonus: 3, glimmerLevel: 2 };
    expect(guruPool(maxed, gameData).map((o) => o.id)).toEqual(['charlatan']);
  });

  it('invocação: aprende o animal; se já sabe, sobe de nível sem trocar o animal', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(p.summon).toEqual({ animal: 'toad', level: 1 });
    expect(applySummonEncounter(p, 'slug').player.summon).toEqual({ animal: 'toad', level: 2 });
  });
});

describe('combate: efeitos de eventos', () => {
  it('velhinha: o vilão ataca primeiro a luta toda, sem rolar iniciativa', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 200 }), { villainStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'late')).toHaveLength(1);
    expect(ofType(s1.log, 'initiative')).toHaveLength(0);
    expect(ofType(s1.log, 'attack')[0]!.side).toBe('villain');
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'attack')[0]!.side).toBe('villain');
  });

  it('ramen: o jogador ataca primeiro a luta toda, sem rolar iniciativa', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'ambush')).toHaveLength(1);
    expect(s1.initiative).toBe('player');
    expect(ofType(s1.log, 'attack')[0]!.side).toBe('player');
  });

  it('foco do guru: 1×/luta, +25% de chance de crítico só no próximo ataque', () => {
    const p = { ...createPlayer(common, gameData), focusUses: 1 };
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    const base = ofType(playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData).log, 'attack')[0]!.critChance;
    // 0,8 cai na faixa de crítico só com o foco (crítico = topo da roleta): (8 + 10 − 7) × 2 = 22
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.8), gameData, true);
    const first = ofType(s1.log, 'attack')[0]!;
    expect(first.critChance).toBeCloseTo(base + 0.25);
    expect(first).toMatchObject({ side: 'player', outcome: 'crit', damage: 22 });
    expect(s1.playerFx.focusArmed).toBe(false);
    expect(() => playRound(s1, 'tech:basicTaijutsu', seq(0.8), gameData, true)).toThrow();
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.8), gameData);
    expect(ofType(s2.log, 'attack').filter((a) => a.side === 'player').at(-1)).toMatchObject({ outcome: 'hit', critChance: base });
  });

  it('foco sem ter aprendido com o guru: indisponível', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    expect(() => playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData, true)).toThrow();
  });
});

describe('invocações (passivas)', () => {
  it('não são uma ação de combate', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(availableActions(startBattle(p, testVillain()), gameData)).toEqual(['tech:basicTaijutsu', 'tech:fireSpark', 'rest', 'stance']);
  });

  it('sapo: dano verdadeiro de 6% do HP máximo do vilão por ataque que acerta, +2% por nível', () => {
    const lv1 = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(toadDamagePct(lv1, gameData)).toBeCloseTo(0.06);
    expect(toadDamagePct(applySummonEncounter(lv1, 'toad').player, gameData)).toBeCloseTo(0.08);
  });

  // Rng depois do ataque do jogador: técnica do vilão, acerto do vilão, (teste de cura), próxima intenção.
  it('cobra: acerto envenena com bônus 2; o tique é 1% do HP máximo + bônus e cresce 1 por rodada', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 300 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01, 0.99), gameData);
    expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'villain', kind: 'poison', turns: 0 }]);
    expect(ofType(s1.log, 'poisonTick')).toEqual([{ type: 'poisonTick', target: 'villain', damage: 3 + 2 }]);
    const s2 = playRound(s1, 'rest', seq(0.01, 0.99, 0.99), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'poisonTick')).toEqual([{ type: 'poisonTick', target: 'villain', damage: 3 + 2 + 1 }]);
    expect(s2.villain.fx.poison).toEqual({ bonus: 2, ticks: 2 });
  });

  it('cobra: acertar um alvo já envenenado soma +1 ao veneno', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s1 = playRound(withInitiative(startBattle(p, testVillain({ hp: 300 }))), 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01, 0.99), gameData);
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5, 0.01, 0.99, 0.99), gameData);
    expect(ofType(s2.log, 'poisonUp')).toHaveLength(1);
    expect(s2.villain.fx.poison).toEqual({ bonus: 3, ticks: 2 });
  });

  it('veneno: o dano por rodada não passa de 30% do HP máximo do alvo', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ hp: 100 })));
    const poisoned = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, poison: { bonus: 1, ticks: 60 } } } };
    const s1 = playRound(poisoned, 'rest', seq(0.5, 0.01, 0.99), gameData);
    expect(ofType(s1.log, 'poisonTick')).toEqual([{ type: 'poisonTick', target: 'villain', damage: 30 }]);
  });

  it('veneno: teste de cura (40%) só a partir do 2º tique; curado, a cobra reaplica do zero', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 300 })));
    // 1º tique: sem teste de cura, mesmo com 0.1.
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01, 0.1), gameData);
    expect(ofType(s1.log, 'poisonCured')).toHaveLength(0);
    // 2º tique: 0.1 < 40%, cura.
    const s2 = playRound(s1, 'rest', seq(0.01, 0.1, 0.5), gameData);
    expect(ofType(s2.log, 'poisonCured')).toEqual([{ type: 'poisonCured', target: 'villain' }]);
    const s3 = playRound(s2, 'tech:basicTaijutsu', seq(0.5, 0.01, 0.99), gameData);
    expect(s3.villain.fx.poison).toEqual({ bonus: 2, ticks: 1 });
  });

  it('lesma: cura 3% do HP no início de cada rodada, +1% por nível', () => {
    const p = { ...applySummonEncounter(createPlayer(common, gameData), 'slug').player, hp: 40 };
    const s1 = playRound(battle(p, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    expect(ofType(s1.log, 'summonRegen')).toEqual([{ type: 'summonRegen', hp: 3 }]);
    const lv2 = applySummonEncounter(p, 'slug').player;
    expect(slugHealPct(lv2, gameData)).toBeCloseTo(0.04);
  });
});

describe('ninjutsu médico', () => {
  const medic = () => learnTechnique(createPlayer(common, gameData), 'medicalNinjutsu', gameData);

  it('ocupa um espaço próprio: não substitui o ninjutsu de ataque', () => {
    expect(medic().techniques).toEqual(['basicTaijutsu', 'fireSpark', 'medicalNinjutsu']);
    expect(availableActions(battle({ ...medic(), hp: 50 }, testVillain()), gameData)).toEqual(
      expect.arrayContaining(['tech:fireSpark', 'medical']),
    );
  });

  it('cura 20% do HP máximo, gasta chakra e não rola acerto', () => {
    const s0 = battle({ ...medic(), hp: 50 }, testVillain(), { playerStartsFirst: true });
    const s1 = playRound(s0, 'medical', seq(0.01), gameData);
    expect(ofType(s1.log, 'medical')).toEqual([{ type: 'medical', healed: 20, chakra: 4 }]);
    expect(s1.player.chakra).toBe(26);
  });

  it('indisponível com HP cheio ou sem chakra', () => {
    expect(availableActions(startBattle(medic(), testVillain()), gameData)).not.toContain('medical');
    expect(availableActions(battle({ ...medic(), hp: 50, chakra: 3 }, testVillain()), gameData)).not.toContain('medical');
  });

  it('o upgrade melhora a cura (+5%) e custa +1 de chakra', () => {
    const upgraded = { ...medic(), techniqueLevels: { medicalNinjutsu: 1 } };
    const s1 = playRound(battle({ ...upgraded, hp: 50 }, testVillain(), { playerStartsFirst: true }), 'medical', seq(0.01), gameData);
    expect(ofType(s1.log, 'medical')).toEqual([{ type: 'medical', healed: 25, chakra: 5 }]);
  });

  it('é premium: só o guru ensina, e o prodígio do taijutsu não recebe', () => {
    expect(learnableTechniques(createPlayer(common, gameData), gameData)).not.toContain('medicalNinjutsu');
    expect(premiumPool(createPlayer(common, gameData), gameData).map((w) => w.id)).toContain('medical');
    expect(premiumPool(createPlayer(prodigy, gameData), gameData).map((w) => w.id)).not.toContain('medical');
  });
});

describe('técnicas elementais respeitam o elemento do jogador', () => {
  const lightning: Origin = { lineageId: null, affinity: 'lightning', jinchuuriki: false };
  const basics = ['fireSpark', 'windBlade', 'spark', 'rockFist', 'waterBullet'];

  it('um ninja de raio nunca aprende técnica de água pela recompensa "nova técnica"', () => {
    const rng = createRng(7);
    for (let i = 0; i < 300; i++) {
      const step = applyReward(createPlayer(lightning, gameData), 'newTechnique', 1, rng, gameData);
      expect(step.player.techniques).not.toContain('waterBullet');
    }
  });

  it('a pool tem as técnicas sem elemento; a básica da afinidade já vem no kit', () => {
    const pool = learnableTechniques(createPlayer(lightning, gameData), gameData);
    expect(pool.filter((id) => basics.includes(id))).toEqual([]);
    expect(pool).toEqual(expect.arrayContaining(['empoweredTaijutsu', 'crowIllusion', 'sleepSong', 'hollowWhisper']));
  });

  it('barreiras e a Armadura de Raio entram na pool pelo nível mínimo e pelo elemento', () => {
    const lightning1 = createPlayer(lightning, gameData);
    expect(learnableTechniques(lightning1, gameData)).not.toContain('lightningArmor');
    expect(learnableTechniques({ ...lightning1, level: 7 }, gameData)).toContain('lightningArmor');
    const earth4 = { ...createPlayer({ lineageId: null, affinity: 'earth', jinchuuriki: false }, gameData), level: 4 };
    const pool = learnableTechniques(earth4, gameData);
    expect(pool).toContain('earthWall');
    expect(pool).not.toContain('waterWall');
  });

  it('elemento secundário libera as técnicas dele', () => {
    const p = { ...createPlayer(lightning, gameData), secondaryElements: ['water' as const] };
    expect(learnableTechniques(p, gameData).filter((id) => basics.includes(id))).toEqual(['waterBullet']);
  });

  it('learnTechnique recusa técnica de elemento que o jogador não domina', () => {
    expect(() => learnTechnique(createPlayer(lightning, gameData), 'waterBullet', gameData)).toThrow();
  });
});

describe('nível e XP', () => {
  it('começa no nível 1, sem XP', () => {
    const p = createPlayer(common, gameData);
    expect([p.level, p.xp]).toEqual([1, 0]);
  });

  it('XP do nível N ao N+1: 100 + 25 × (N − 1), sem nível máximo', () => {
    expect(xpToNextLevel(1, gameData)).toBe(100);
    expect(xpToNextLevel(2, gameData)).toBe(125);
    expect(xpToNextLevel(10, gameData)).toBe(325);
    let p = { ...createPlayer(uchiha, gameData), xp: 100_000 };
    while (canLevelUp(p, gameData)) p = applyLevelUp(p, gameData);
    expect(p.level).toBeGreaterThan(20);
  });

  it('ganhar XP não sobe de nível sozinho; subir gasta o XP do nível e guarda a sobra', () => {
    const p = gainXp(createPlayer(uchiha, gameData), 130, gameData);
    expect([p.level, p.xp]).toEqual([1, 130]);
    const up = applyLevelUp(p, gameData);
    expect([up.level, up.xp]).toEqual([2, 30]);
    expect(canLevelUp(up, gameData)).toBe(false);
    expect(() => applyLevelUp(gainXp(createPlayer(uchiha, gameData), 99, gameData), gameData)).toThrow();
  });

  it('subir de nível aumenta HP e chakra máximos e restaura', () => {
    const p = { ...createPlayer(uchiha, gameData), xp: 100, hp: 50, chakra: 1 };
    const up = applyLevelUp(p, gameData);
    expect([up.maxHp, up.hp]).toEqual([p.maxHp + 8, p.maxHp + 8]);
    expect([up.maxChakra, up.chakra]).toEqual([p.maxChakra + 1, p.maxChakra + 1]);
    expect(up.offense).toEqual(p.offense);
  });

  it('Determinação (comum): cada nível dá +1 no maior status de ataque (empate: taijutsu)', () => {
    const p = { ...createPlayer(common, gameData), xp: 100 };
    const up = applyLevelUp(p, gameData);
    expect(up.offense).toEqual({ taijutsu: 11, ninjutsu: 10, genjutsu: 10 });
    const nin = applyLevelUp({ ...p, offense: { taijutsu: 10, ninjutsu: 13, genjutsu: 12 } }, gameData);
    expect(nin.offense).toEqual({ taijutsu: 10, ninjutsu: 14, genjutsu: 12 });
  });

  it('vitória recupera 25% do HP e do chakra máximos, sem passar do máximo', () => {
    const p = { ...createPlayer(common, gameData), hp: 10, chakra: 2 };
    expect(recoverAfterWin(p, gameData)).toMatchObject({ hp: 35, chakra: 9 });
    expect(recoverAfterWin({ ...p, hp: 95, chakra: 29 }, gameData)).toMatchObject({ hp: 100, chakra: 30 });
  });

  it('marcos 4, 7 e 10 dão 1 upgrade à escolha', () => {
    let p = createPlayer(common, gameData);
    const gained: number[] = [];
    while (p.level < 10) {
      const step = levelUp(gainXp(p, 10_000, gameData), gameData);
      if (step.effect.kind === 'levelUp' && step.effect.upgrades > 0) gained.push(step.effect.level);
      p = step.player;
    }
    expect(gained).toEqual([4, 7, 10]);
    expect(p.pendingUpgrades).toBe(3);
  });

  it('o ganho por nível depende da dificuldade', () => {
    const gain = (d: 'easy' | 'normal' | 'hard' | 'hardcore') => {
      const p = { ...createPlayer(common, gameData, d), xp: 100 };
      const up = applyLevelUp(p, gameData);
      return [up.maxHp - p.maxHp, up.maxChakra - p.maxChakra];
    };
    expect(gain('easy')).toEqual([10, 2]);
    expect(gain('normal')).toEqual([8, 1]);
    expect(gain('hard')).toEqual([6, 1]);
    expect(gain('hardcore')).toEqual([6, 1]);
    expect(withDifficulty(createPlayer(common, gameData), 'easy', gameData).growth).toEqual({ hp: 10, chakra: 2 });
  });

  it('levelUp descreve o efeito para a UI', () => {
    const step = levelUp({ ...createPlayer(common, gameData), xp: 100 }, gameData);
    expect(step.effect).toEqual({ kind: 'levelUp', level: 2, hp: 8, chakra: 1, learned: [], upgrades: 0 });
  });

  it('curva planejada: só com vilões e exame, chega ao Orochimaru no nível 8 e termina com 1545 de XP', () => {
    const xp = campaign.flatMap((st) => st.villains).map((id) => villainsById[id]!.xp);
    expect(xp.reduce((a, b) => a + b, 0)).toBe(1545);
    let p = createPlayer(uchiha, gameData);
    for (const amount of xp.slice(0, -1)) {
      p = gainXp(p, amount, gameData);
      while (canLevelUp(p, gameData)) p = applyLevelUp(p, gameData);
    }
    expect(p.level).toBe(8);
  });

  it('o Quarteto (4 lutas de 60) dá 1 nível a quem chega no nível 6', () => {
    let p = { ...createPlayer(uchiha, gameData), level: 6 };
    let ups = 0;
    for (const id of ['jirobo', 'kidomaru', 'tayuya', 'sakon']) {
      p = gainXp(p, villainsById[id]!.xp, gameData);
      while (canLevelUp(p, gameData)) {
        p = applyLevelUp(p, gameData);
        ups++;
      }
    }
    expect(ups).toBe(1);
  });
});

describe('dificuldade', () => {
  const v = testVillain({
    hp: 100,
    offense: { taijutsu: 4, ninjutsu: 0, genjutsu: 6 },
    resistance: { physical: 10, mental: 8 },
  });

  it('médio mantém o vilão original', () => {
    expect(scaleVillain(v, 'normal', gameData)).toBe(v);
  });

  it('fácil (85%), difícil (115%) e hardcore (125%) escalam HP, dano base, ataques e resistências', () => {
    const easy = scaleVillain(v, 'easy', gameData);
    expect(easy.hp).toBe(85);
    // Ataque zerado continua zerado.
    expect(easy.offense).toEqual({ taijutsu: 3, ninjutsu: 0, genjutsu: 5 });
    expect(easy.resistance).toEqual({ physical: 8, mental: 6 });
    expect(easy.techniques[0]!.baseDamage).toBe(8);
    const hard = scaleVillain(v, 'hard', gameData);
    expect(hard.hp).toBe(114);
    expect(hard.techniques[0]!.baseDamage).toBe(11);
    expect(scaleVillain(v, 'hardcore', gameData).techniques[0]!.baseDamage).toBe(12);
  });

  it('hardcore troca as passivas dos vilões pelas versões hardcore', () => {
    for (const id of ['mizuki', 'haku', 'zabuza', 'jirobo', 'kabuto']) {
      const def = villainsById[id]!;
      expect(scaleVillain(def, 'hard', gameData).passive).toEqual(def.passive);
      expect(scaleVillain(def, 'hardcore', gameData).passive).toEqual(def.hardcorePassive);
    }
    expect(scaleVillain(villainsById.gaara!, 'hardcore', gameData).passive).toMatchObject({ kind: 'cloak', monster: { healPct: 0.5 } });
    expect(scaleVillain(villainsById.orochimaru!, 'hardcore', gameData).passive).toMatchObject({ kind: 'insane', critImmune: true });
  });

  it('Orochimaru revive no máximo 1× no fácil, 2× no normal, 3× no difícil e sem limite no hardcore', () => {
    const max = (d: Difficulty) => {
      const passive = scaleVillain(villainsById.orochimaru!, d, gameData).passive;
      return passive?.kind === 'insane' ? passive.maxRevives : null;
    };
    expect([max('easy'), max('normal'), max('hard'), max('hardcore')]).toEqual([1, 2, 3, undefined]);
  });

  it('a forma de monstro do Gaara também escala com a dificuldade', () => {
    const passive = scaleVillain(villainsById.gaara!, 'hardcore', gameData).passive;
    const base = villainsById.gaara!.hardcorePassive;
    if (passive?.kind !== 'cloak' || base?.kind !== 'cloak') throw new Error('manto esperado');
    expect(passive.monster!.techniques[0]!.baseDamage).toBe(Math.floor(base.monster!.techniques[0]!.baseDamage * 1.25));
  });

  it('speed, chakra e XP não mudam', () => {
    const hard = scaleVillain(v, 'hard', gameData);
    expect([hard.speed, hard.chakra, hard.xp]).toEqual([v.speed, v.chakra, v.xp]);
  });
});

describe('recompensas por raridade', () => {
  const p = createPlayer(uchiha, gameData);

  it('roleta de recompensa com os pesos do design', () => {
    expect(Object.fromEntries(gameData.rewards.map((r) => [r.id, r.weight]))).toEqual({
      stages: 20,
      newTechnique: 20,
      xp: 20,
      item: 15,
      resistance: 10,
      critBonus: 10,
      secondaryElement: 5,
    });
  });

  it('comum, rara e lendária: estágios, XP, resistência, crítico e giros de item', () => {
    expect(applyReward(p, 'stages', 3, seq(0.5), gameData).player.speed).toBe(13);
    expect(applyReward(p, 'xp', 1, seq(0.5), gameData).player.xp).toBe(60);
    expect(applyReward(p, 'xp', 2, seq(0.5), gameData).player.xp).toBe(120);
    expect(applyReward(p, 'xp', 3, seq(0.5), gameData).player.xp).toBe(200);
    // Rara: 4 pontos, um a um entre física e mental (0.5 → mental). Uchiha: mental 10 → 14.
    expect(applyReward(p, 'resistance', 2, seq(0.5), gameData)).toMatchObject({
      player: { resistance: { physical: 10, mental: 14 } },
      effect: { kind: 'resistance', physical: 0, mental: 4 },
    });
    expect(applyReward(p, 'resistance', 1, seq(0.0, 0.5), gameData).effect).toEqual({ kind: 'resistance', physical: 1, mental: 1 });
    expect(applyReward(p, 'critBonus', 1, seq(0.5), gameData).player.critBonus).toBeCloseTo(0.02);
    expect([1, 2, 3].map((t) => rewardItemSpins(t, gameData))).toEqual([1, 2, 3]);
  });

  it('nova técnica: rara dá também 1 upgrade à escolha; lendária, 2', () => {
    const rare = applyReward(p, 'newTechnique', 2, seq(0.0), gameData);
    expect(rare.effect).toEqual({ kind: 'newTechnique', techniqueId: 'empoweredTaijutsu', upgrades: 1 });
    expect(rare.player.pendingUpgrades).toBe(1);
    expect(applyReward(p, 'newTechnique', 3, seq(0.0), gameData).player.pendingUpgrades).toBe(2);
  });

  it('nova técnica sem técnica para aprender vira upgrade (se houver o que subir)', () => {
    const lee = learnTechnique({ ...createPlayer(prodigy, gameData), level: 4 }, 'empoweredTaijutsu', gameData);
    expect(learnableTechniques(lee, gameData)).toEqual([]);
    expect(rewardPool(lee, gameData).map((r) => r.id)).toContain('newTechnique');
    const step = applyReward(lee, 'newTechnique', 1, seq(0.0), gameData);
    expect(step.effect).toEqual({ kind: 'newTechnique', techniqueId: null, upgrades: 1 });
    expect(step.player.pendingUpgrades).toBe(1);
  });

  it('elemento secundário: um elemento; na lendária, também a técnica básica dele', () => {
    const one = applyReward(p, 'secondaryElement', 1, seq(0.0), gameData);
    expect(one.effect).toEqual({ kind: 'secondaryElement', element: 'wind', techniqueId: null });
    expect(one.player.secondaryElements).toEqual(['wind']);
    const legendary = applyReward(p, 'secondaryElement', 3, seq(0.0), gameData);
    expect(legendary.effect).toEqual({ kind: 'secondaryElement', element: 'wind', techniqueId: 'windBlade' });
    expect(legendary.player.techniques).toContain('windBlade');
    // Quem já tem um, ou o prodígio, não recebe a fatia.
    expect(rewardPool(one.player, gameData).map((r) => r.id)).not.toContain('secondaryElement');
    expect(rewardPool(createPlayer(prodigy, gameData), gameData).map((r) => r.id)).not.toContain('secondaryElement');
  });

  it('lendária: gira 3 vezes para o jogador escolher 1', () => {
    expect(rollRewardChoices(p, createRng(3), gameData)).toHaveLength(3);
  });

  it('nova técnica respeita a origem: o prodígio só aprende taijutsu e a fatia some depois', () => {
    let q = createPlayer(prodigy, gameData);
    const step = applyReward(q, 'newTechnique', 1, createRng(7), gameData);
    expect(step.effect).toMatchObject({ kind: 'newTechnique', techniqueId: 'empoweredTaijutsu' });
    q = step.player;
    expect(rewardPool(q, gameData).map((r) => r.id)).not.toContain('newTechnique');
  });

  it('grupos de vilões (vários no mesmo bloco) só dão recompensa no confronto final', () => {
    for (const st of campaign) {
      if (st.kind !== 'fight' || st.villains.length < 2) continue;
      expect(st.rewardTiers.slice(0, -1).every((t) => t === null)).toBe(true);
    }
  });

  it('raridade por confronto e exame pelo número de vitórias', () => {
    const tiers = Object.fromEntries(
      campaign.flatMap((st) => (st.kind === 'fight' ? st.villains.map((id, j) => [id, st.rewardTiers[j]]) : [])),
    );
    expect(tiers).toEqual({
      mizuki: 1,
      haku: null,
      zabuza: 2,
      gaara: 2,
      jirobo: null,
      kidomaru: null,
      tayuya: null,
      sakon: 2,
      kabuto: 3,
      orochimaru: null,
    });
    expect(gameData.balance.exam.rewardTierByWins).toEqual([0, 1, 2, 3]);
  });
});
