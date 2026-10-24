import { describe, expect, it } from 'vitest';
import { availableActions, playerTechnique, playRound, slugHealPct, startBattle, toadPenetration, type BattleEvent } from '../src/core/combat';
import { scaleVillain } from '../src/core/difficulty';
import {
  applyLevelUp,
  applyStatStages,
  canLevelUp,
  createPlayer,
  equipTrainingWeights,
  gainXp,
  learnTechnique,
  removeTrainingWeights,
  trainingWeightsWin,
  withDifficulty,
  xpToNextLevel,
} from '../src/core/player';
import {
  applyAkatsuki,
  applyGuru,
  applyItem,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  guruPool,
  itemPool,
  learnableTechniques,
  levelUp,
  offensiveLearnable,
  playJokenpo,
  rewardItemSpins,
  rewardPool,
  rollAkatsuki,
  rollRewardChoices,
  spendCoin,
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
  it('o início de cada combate restaura HP e chakra e começa sem efeitos', () => {
    const p = { ...createPlayer(common, gameData), hp: 10, chakra: 0 };
    const s0 = startBattle(p, testVillain(), {}, gameData);
    expect([s0.player.hp, s0.player.chakra]).toEqual([100, 30]);
    expect(s0.playerFx).toMatchObject({ poison: null, bleeding: false, burn: 0 });
  });

  it('com restore: false (HP carregando no bloco), o HP fica como estava', () => {
    const p = { ...createPlayer(common, gameData), hp: 10 };
    expect(startBattle(p, testVillain(), { restore: false }).player.hp).toBe(10);
  });

  it('penalidades de início (Akatsuki) valem depois da restauração', () => {
    const p = { ...createPlayer(common, gameData), hp: 10 };
    const s0 = startBattle(p, testVillain(), { startHpPct: 0.5, startChakraPct: 0.5 }, gameData);
    expect([s0.player.hp, s0.player.chakra]).toEqual([50, 15]);
  });
});

describe('estágios de status', () => {
  it('sobe todos os status; HP e chakra atuais sobem junto', () => {
    const p = { ...createPlayer(common, gameData), hp: 50 };
    const up = applyStatStages(p, 2, gameData);
    expect(up.offense).toEqual({ taijutsu: 12, ninjutsu: 12, genjutsu: 12 });
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
    expect(up.offense).toEqual({ taijutsu: 23, ninjutsu: 0, genjutsu: 0 });
  });
});

describe('eventos pré-vilão', () => {
  it('velhinha: vilão age primeiro; ramen: jogador age primeiro; treino: +1 estágio', () => {
    const p = createPlayer(common, gameData);
    expect(applySimpleEvent(p, 'oldLady', gameData).mods).toEqual({ villainStartsFirst: true, playerStartsFirst: false });
    expect(applySimpleEvent(p, 'ramen', gameData).mods).toEqual({ playerStartsFirst: true, villainStartsFirst: false });
    expect(applySimpleEvent(p, 'training', gameData).player.speed).toBe(11);
  });

  it('roleta pré-vilão: invocações, velhinha, ramen, Akatsuki, treino, jokenpô, item e guru', () => {
    const total = gameData.preFightEvents.reduce((a, e) => a + e.weight, 0);
    expect(Object.fromEntries(gameData.preFightEvents.map((e) => [e.id, e.weight / total]))).toEqual({
      summon: 0.1,
      oldLady: 0.1,
      ramen: 0.1,
      akatsuki: 0.1,
      training: 0.2,
      jokenpo: 0.2,
      foundItem: 0.1,
      guru: 0.1,
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

  it('pergaminho sorteia uma categoria que o jogador usa e dá +3 de dano a todas as técnicas dela', () => {
    const step = applyItem(p, 'techniqueScroll', seq(0.1), gameData);
    expect(step.effect).toEqual({ kind: 'techniqueUpgrade', type: 'taijutsu', level: 1 });
    expect(playerTechnique(step.player, 'basicTaijutsu', gameData).baseDamage).toBe(11);
    expect(playerTechnique(learnTechnique(step.player, 'empoweredTaijutsu', gameData), 'empoweredTaijutsu', gameData).baseDamage).toBe(17);
  });

  it('pergaminho de quem não usa genjutsu nunca cai no genjutsu', () => {
    for (const r of [0.01, 0.5, 0.99]) {
      expect(applyItem(p, 'techniqueScroll', seq(r), gameData).effect).not.toMatchObject({ type: 'genjutsu' });
    }
  });

  it('retorno, resistência, velocidade e pergaminho de experiência', () => {
    expect(applyItem(p, 'revive', seq(0.5), gameData).player.revives).toBe(2);
    expect(applyItem(p, 'resistanceItem', seq(0.5), gameData).player.resistanceBonus).toBe(2);
    expect(applyItem(p, 'speedItem', seq(0.5), gameData).player.speed).toBe(11);
    // +100 de XP, com a Determinação do comum: 110
    expect(applyItem(p, 'xpScroll', seq(0.5), gameData)).toMatchObject({ player: { xp: 110 }, effect: { kind: 'xp', amount: 110 } });
  });

  it('amuletos de resistência e velocidade ficam guardados na bolsa e acumulam', () => {
    expect(p.amulets).toEqual({ speed: 0, resistance: 0 });
    let q = applyItem(p, 'speedItem', seq(0.5), gameData).player;
    q = applyItem(q, 'speedItem', seq(0.5), gameData).player;
    q = applyItem(q, 'resistanceItem', seq(0.5), gameData).player;
    expect(q.amulets).toEqual({ speed: 2, resistance: 1 });
    expect([q.speed, q.resistanceBonus]).toEqual([12, 2]);
  });

  it('consumíveis vão para a bolsa (máximo 3 de cada); o excedente vira 30 de XP', () => {
    let q = createPlayer(uchiha, gameData);
    for (let i = 0; i < 3; i++) q = applyItem(q, 'soldierPill', seq(0.5), gameData).player;
    expect(q.bag.soldierPill).toBe(3);
    const over = applyItem(q, 'soldierPill', seq(0.5), gameData);
    expect(over.effect).toEqual({ kind: 'bagItem', item: 'soldierPill', overflowXp: 30 });
    expect([over.player.bag.soldierPill, over.player.xp]).toEqual([3, 30]);
  });

  it('a bolsa sobrevive à restauração do início do combate', () => {
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

  it('Akatsuki: caçado perde 1 Vontade do Fogo; sem nenhuma, a próxima luta começa enfraquecida', () => {
    const took = applyAkatsuki(jin(), 'hunted', gameData);
    expect(took.effect).toEqual({ kind: 'akatsukiTookRevive', reason: 'hunted' });
    expect(took.player.revives).toBe(0);
    const weak = applyAkatsuki(took.player, 'hunted', gameData);
    expect(weak.effect).toEqual({ kind: 'akatsukiWeakened', reason: 'hunted' });
    // O HP só cai na luta (depois da restauração): ver "penalidades de início".
    expect(weak.player).toEqual(took.player);
  });

  it('guru: charlatão dá desvantagem de ação; técnica ensina uma ofensiva adequada; foco libera o crítico garantido', () => {
    const p = createPlayer(common, gameData);
    expect(applyGuru(p, 'charlatan', seq(0.5), gameData).mods).toEqual({ villainStartsFirst: true, playerStartsFirst: false });
    expect(applyGuru(p, 'technique', seq(0.5), gameData).effect.kind).toBe('newTechnique');
    expect(offensiveLearnable(p, gameData)).not.toContain('medicalNinjutsu');
    const focus = applyGuru(p, 'focus', seq(0.5), gameData);
    expect(focus.player.focusCrit).toBe(true);
    expect(guruPool(focus.player, gameData).map((o) => o.id)).toEqual(['charlatan', 'technique']);
  });

  it('guru: o prodígio só aprende taijutsu; sem o que ensinar, a fatia de técnica some', () => {
    let p = createPlayer(prodigy, gameData);
    expect(offensiveLearnable(p, gameData)).toEqual(['empoweredTaijutsu']);
    p = learnTechnique(p, 'empoweredTaijutsu', gameData);
    expect(guruPool(p, gameData).map((o) => o.id)).toEqual(['charlatan', 'focus']);
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

  it('foco do guru: 1×/luta, o próximo ataque é crítico mesmo com um rng que erraria', () => {
    const p = { ...createPlayer(common, gameData), focusCrit: true };
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.01), gameData, true);
    // (8 + 10 − 5) × 2 = 26
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'crit', damage: 26 });
    expect(() => playRound(s1, 'tech:basicTaijutsu', seq(0.01), gameData, true)).toThrow();
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.01), gameData);
    expect(ofType(s2.log, 'attack').filter((a) => a.side === 'player').at(-1)).toMatchObject({ outcome: 'miss' });
  });

  it('foco sem ter aprendido com o guru: indisponível', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    expect(() => playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData, true)).toThrow();
  });
});

describe('invocações (passivas)', () => {
  it('não são uma ação de combate', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(availableActions(startBattle(p, testVillain()), gameData)).toEqual(['tech:basicTaijutsu', 'tech:fireSpark', 'rest', 'substitution']);
  });

  it('sapo: penetração de 25%, +10% por nível', () => {
    const lv1 = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(toadPenetration(lv1, gameData)).toBeCloseTo(0.25);
    expect(toadPenetration(applySummonEncounter(lv1, 'toad').player, gameData)).toBeCloseTo(0.35);
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

  it('o pergaminho também melhora a cura (+5%)', () => {
    const step = applyItem(medic(), 'techniqueScroll', seq(0.9), gameData);
    expect(step.effect).toEqual({ kind: 'techniqueUpgrade', type: 'medical', level: 1 });
    const s1 = playRound(battle({ ...step.player, hp: 50 }, testVillain(), { playerStartsFirst: true }), 'medical', seq(0.01), gameData);
    expect(ofType(s1.log, 'medical')).toEqual([{ type: 'medical', healed: 25, chakra: 4 }]);
  });

  it('o prodígio do taijutsu não aprende', () => {
    expect(learnableTechniques(createPlayer(prodigy, gameData), gameData)).not.toContain('medicalNinjutsu');
    expect(learnableTechniques(createPlayer(common, gameData), gameData)).toContain('medicalNinjutsu');
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
    expect(pool).toEqual(expect.arrayContaining(['empoweredTaijutsu', 'crowIllusion', 'sleepSong', 'hollowWhisper', 'medicalNinjutsu']));
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

  it('subir de nível aumenta HP e chakra máximos, mas não restaura', () => {
    const p = { ...createPlayer(common, gameData), xp: 100, hp: 50, chakra: 1 };
    const up = applyLevelUp(p, gameData);
    expect([up.maxHp, up.hp]).toEqual([108, 58]);
    expect([up.maxChakra, up.chakra]).toEqual([31, 2]);
    expect(up.offense).toEqual(p.offense);
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
    expect(step.effect).toEqual({ kind: 'levelUp', level: 2, hp: 8, chakra: 1, learned: [] });
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
  const v = testVillain({ hp: 100, defense: { taijutsu: 10, ninjutsu: 8, genjutsu: 6 } });

  it('médio mantém o vilão original', () => {
    expect(scaleVillain(v, 'normal', gameData)).toBe(v);
  });

  it('fácil (85%), difícil (115%) e hardcore (125%) escalam HP, dano base e defesa', () => {
    const easy = scaleVillain(v, 'easy', gameData);
    expect(easy.hp).toBe(85);
    expect(easy.defense).toEqual({ taijutsu: 8, ninjutsu: 6, genjutsu: 5 });
    expect(easy.techniques[0]!.baseDamage).toBe(8);
    const hard = scaleVillain(v, 'hard', gameData);
    expect(hard.hp).toBe(114);
    expect(hard.techniques[0]!.baseDamage).toBe(11);
    expect(scaleVillain(v, 'hardcore', gameData).techniques[0]!.baseDamage).toBe(12);
  });

  it('hardcore troca as passivas dos vilões pelas versões hardcore', () => {
    for (const id of ['mizuki', 'haku', 'zabuza', 'gaara', 'jirobo', 'kabuto', 'orochimaru']) {
      const def = villainsById[id]!;
      expect(scaleVillain(def, 'hard', gameData).passive).toEqual(def.passive);
      expect(scaleVillain(def, 'hardcore', gameData).passive).toEqual(def.hardcorePassive);
    }
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
    expect(applyReward(p, 'resistance', 2, seq(0.5), gameData).player.resistanceBonus).toBe(3);
    expect(applyReward(p, 'critBonus', 1, seq(0.5), gameData).player.critBonus).toBeCloseTo(0.02);
    expect([1, 2, 3].map((t) => rewardItemSpins(t, gameData))).toEqual([1, 2, 3]);
  });

  it('nova técnica: rara dá 1 pergaminho na categoria; lendária, 2', () => {
    const rare = applyReward(p, 'newTechnique', 2, seq(0.0), gameData);
    expect(rare.effect).toEqual({ kind: 'newTechnique', techniqueId: 'empoweredTaijutsu', scrolls: 1 });
    expect(rare.player.techniqueLevels).toEqual({ taijutsu: 1 });
    expect(applyReward(p, 'newTechnique', 3, seq(0.0), gameData).player.techniqueLevels).toEqual({ taijutsu: 2 });
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

  it('raridade por confronto e exame pelo número de vitórias', () => {
    const tiers = Object.fromEntries(
      campaign.flatMap((st) => (st.kind === 'fight' ? st.villains.map((id, j) => [id, st.rewardTiers[j]]) : [])),
    );
    expect(tiers).toEqual({
      mizuki: 1,
      haku: 1,
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
