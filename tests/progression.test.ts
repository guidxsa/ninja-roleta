import { describe, expect, it } from 'vitest';
import { availableActions, playerTechnique, playRound, startBattle, type BattleEvent } from '../src/core/combat';
import { scaleVillain } from '../src/core/difficulty';
import {
  applyLevelUp,
  applyStatStages,
  canLevelUp,
  createPlayer,
  gainXp,
  learnTechnique,
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
  learnableTechniques,
  levelUp,
  offensiveLearnable,
  playJokenpo,
  rewardPool,
  rollAkatsuki,
} from '../src/core/progression';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { gameData } from '../src/data/index';
import { villainsById } from '../src/data/villains';
import { seq, testVillain, withInitiative } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };
const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);

describe('estágios de status', () => {
  it('sobe todos os status; HP e chakra atuais sobem junto', () => {
    const p = { ...createPlayer(common, gameData), hp: 50 };
    const up = applyStatStages(p, 2, gameData);
    expect(up.offense).toEqual({ taijutsu: 12, ninjutsu: 12, genjutsu: 12 });
    expect(up.speed).toBe(12);
    // HP e chakra máximos sobem o mesmo que 2 níveis no Médio (+8 HP e +1 chakra cada).
    expect([up.maxHp, up.hp]).toEqual([116, 66]);
    expect([up.maxChakra, up.chakra]).toEqual([12, 12]);
  });

  it('o ganho de HP e chakra do estágio segue a dificuldade', () => {
    const easy = applyStatStages(createPlayer(common, gameData, 'easy'), 1, gameData);
    expect([easy.maxHp, easy.maxChakra]).toEqual([110, 12]);
    const hard = applyStatStages(createPlayer(common, gameData, 'hard'), 1, gameData);
    expect([hard.maxHp, hard.maxChakra]).toEqual([106, 11]);
  });

  it('prodígio do taijutsu: ninjutsu e genjutsu continuam zerados', () => {
    const up = applyStatStages(createPlayer(prodigy, gameData), 1, gameData);
    expect(up.offense).toEqual({ taijutsu: 19, ninjutsu: 0, genjutsu: 0 });
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
    expect(playJokenpo(p, 'paper', seq(0.9), gameData)).toMatchObject({
      result: 'loss',
      mods: { villainStartsFirst: true },
    });
  });
});

describe('itens', () => {
  const p = createPlayer(common, gameData);

  it('ferramenta ninja é única e evolui: +1 de dano base por nível em todos os ataques', () => {
    const lv1 = applyItem(p, 'ninjaTool', seq(0.5), gameData).player;
    const lv2 = applyItem(lv1, 'ninjaTool', seq(0.5), gameData).player;
    expect(lv2.ninjaToolLevel).toBe(2);
    expect(playerTechnique(lv2, 'basicTaijutsu', gameData).baseDamage).toBe(10);
    expect(playerTechnique(lv2, 'basicNinjutsu', gameData).baseDamage).toBe(12);
  });

  it('pergaminho sorteia uma categoria que o jogador usa e melhora todas as técnicas dela', () => {
    const step = applyItem(p, 'techniqueScroll', seq(0.1), gameData);
    expect(step.effect).toEqual({ kind: 'techniqueUpgrade', type: 'taijutsu', level: 1 });
    expect(playerTechnique(step.player, 'basicTaijutsu', gameData).baseDamage).toBe(10);
    expect(playerTechnique(learnTechnique(step.player, 'leafWhirlwind', gameData), 'leafWhirlwind', gameData).baseDamage).toBe(15);
  });

  it('pergaminho de quem não usa genjutsu nunca cai no genjutsu', () => {
    for (const r of [0.01, 0.5, 0.99]) {
      expect(applyItem(p, 'techniqueScroll', seq(r), gameData).effect).not.toMatchObject({ type: 'genjutsu' });
    }
  });

  it('pergaminho sorteia entre as categorias, inclusive a das técnicas aprendidas', () => {
    const learned = learnTechnique(p, 'fireball', gameData);
    const step = applyItem(learned, 'techniqueScroll', seq(0.9), gameData);
    expect(step.effect).toMatchObject({ type: 'ninjutsu' });
  });

  it('retorno, resistência e velocidade', () => {
    expect(applyItem(p, 'revive', seq(0.5), gameData).player.revives).toBe(2);
    expect(applyItem(p, 'resistanceItem', seq(0.5), gameData).player.resistanceBonus).toBe(2);
    expect(applyItem(p, 'speedItem', seq(0.5), gameData).player.speed).toBe(11);
  });

  it('amuletos de resistência e velocidade ficam guardados na bolsa e acumulam', () => {
    expect(p.amulets).toEqual({ speed: 0, resistance: 0 });
    let q = applyItem(p, 'speedItem', seq(0.5), gameData).player;
    q = applyItem(q, 'speedItem', seq(0.5), gameData).player;
    q = applyItem(q, 'resistanceItem', seq(0.5), gameData).player;
    expect(q.amulets).toEqual({ speed: 2, resistance: 1 });
    expect([q.speed, q.resistanceBonus]).toEqual([12, 2]);
  });
});

describe('encontros', () => {
  const jin = () => createPlayer({ ...common, jinchuuriki: true }, gameData);

  it('Akatsuki: 70/30, com fatias diferentes para quem é jinchuuriki', () => {
    // 0.5 cai nos 70%; 0.8 nos 30%.
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
    expect(step.player.revives).toBe(p.revives);
  });

  it('Akatsuki: caçado (ou se meteu) perde 1 Vontade do Fogo; sem nenhuma, começa enfraquecido', () => {
    const took = applyAkatsuki(jin(), 'hunted', gameData);
    expect(took.effect).toEqual({ kind: 'akatsukiTookRevive', reason: 'hunted' });
    expect(took.player.revives).toBe(0);
    const weak = applyAkatsuki(took.player, 'hunted', gameData);
    expect(weak.effect).toEqual({ kind: 'akatsukiWeakened', reason: 'hunted' });
    expect([weak.player.hp, weak.player.chakra]).toEqual([50, 10]);
    const meddled = applyAkatsuki(createPlayer(common, gameData), 'meddled', gameData);
    expect(meddled.effect).toEqual({ kind: 'akatsukiTookRevive', reason: 'meddled' });
    expect(meddled.player.revives).toBe(0);
  });

  it('Akatsuki: jinchuuriki despercebido não perde nada', () => {
    const p = jin();
    expect(applyAkatsuki(p, 'unnoticed', gameData)).toMatchObject({ player: p, effect: { kind: 'akatsukiUnnoticed' } });
  });

  it('guru: charlatão dá desvantagem de ação; técnica ensina uma ofensiva adequada; foco libera o crítico garantido', () => {
    const p = createPlayer(common, gameData);
    expect(applyGuru(p, 'charlatan', seq(0.5), gameData).mods).toEqual({ villainStartsFirst: true, playerStartsFirst: false });
    const tech = applyGuru(p, 'technique', seq(0.5), gameData);
    expect(tech.effect.kind).toBe('newTechnique');
    expect(offensiveLearnable(p, gameData)).not.toContain('medicalNinjutsu');
    const focus = applyGuru(p, 'focus', seq(0.5), gameData);
    expect(focus.player.focusCrit).toBe(true);
    // Já sabe o foco: a fatia some da roleta do guru.
    expect(guruPool(focus.player, gameData).map((o) => o.id)).toEqual(['charlatan', 'technique']);
  });

  it('guru: o prodígio só aprende taijutsu; sem o que ensinar, a fatia de técnica some', () => {
    let p = createPlayer(prodigy, gameData);
    expect(offensiveLearnable(p, gameData).sort()).toEqual(['empoweredTaijutsu', 'leafWhirlwind']);
    p = learnTechnique(learnTechnique(p, 'empoweredTaijutsu', gameData), 'leafWhirlwind', gameData);
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
    expect(s1.initiative).toBe('villain');
    expect(ofType(s1.log, 'attack')[0]!.side).toBe('villain');
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'attack')[0]!.side).toBe('villain');
  });

  it('ramen: o jogador ataca primeiro a luta toda, sem rolar iniciativa', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'ambush')).toHaveLength(1);
    expect(ofType(s1.log, 'initiative')).toHaveLength(0);
    expect(s1.initiative).toBe('player');
    expect(ofType(s1.log, 'attack')[0]!.side).toBe('player');
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'attack')[0]!.side).toBe('player');
  });

  it('foco do guru: 1×/luta, o próximo ataque é crítico mesmo com um rng que erraria', () => {
    const p = { ...createPlayer(common, gameData), focusCrit: true };
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.01), gameData, true);
    // (8 + 10 − 5) × 2 = 26
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'crit', damage: 26 });
    expect(s1.playerFx.guaranteedCrit).toBe(false);
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
    expect(availableActions(startBattle(p, testVillain()), gameData)).toEqual([
      'tech:basicTaijutsu',
      'tech:basicNinjutsu',
      'rest',
    ]);
  });

  it('sapo: dano base extra em todos os ataques, maior a cada nível', () => {
    const lv1 = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(playerTechnique(lv1, 'basicTaijutsu', gameData).baseDamage).toBe(12); // 8 + 4
    expect(playerTechnique(lv1, 'basicNinjutsu', gameData).baseDamage).toBe(14); // 10 + 4
    const lv2 = applySummonEncounter(lv1, 'toad').player;
    expect(playerTechnique(lv2, 'basicTaijutsu', gameData).baseDamage).toBe(14); // 8 + 4 + 2
  });

  // Rng depois do ataque do jogador: técnica do vilão, acerto do vilão, teste de resistência ao veneno.
  it('cobra: acerto envenena; o tique é 1% do HP máximo + bônus e cresce 1 por rodada', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 300 })));
    // 0.99 no teste de resistência: não se cura.
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01, 0.99), gameData);
    expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'villain', kind: 'poison', turns: 0 }]);
    expect(ofType(s1.log, 'poisonTick')).toEqual([{ type: 'poisonTick', target: 'villain', damage: 3 + 1 }]);
    const s2 = playRound(s1, 'rest', seq(0.5, 0.01, 0.99), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'poisonTick')).toEqual([{ type: 'poisonTick', target: 'villain', damage: 3 + 1 + 1 }]);
    // Novo acerto com o alvo já envenenado não reaplica nem zera o crescimento.
    expect(s2.villain.fx.poison).toEqual({ bonus: 1, ticks: 2 });
  });

  it('veneno: o dano por rodada não passa de 30% do HP máximo do alvo', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ hp: 100 })));
    const poisoned = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, poison: { bonus: 1, ticks: 60 } } } };
    const s1 = playRound(poisoned, 'rest', seq(0.5, 0.01, 0.99), gameData);
    expect(ofType(s1.log, 'poisonTick')).toEqual([{ type: 'poisonTick', target: 'villain', damage: 30 }]);
  });

  it('veneno: depois de cada tique o alvo pode resistir e se curar; a cobra reaplica no próximo acerto', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 300 })));
    // 0.1 no teste de resistência (chance de 60%): curou.
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01, 0.1), gameData);
    expect(ofType(s1.log, 'poisonCured')).toEqual([{ type: 'poisonCured', target: 'villain' }]);
    expect(s1.villain.fx.poison).toBeNull();
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01, 0.99), gameData);
    expect(s2.villain.fx.poison).toEqual({ bonus: 1, ticks: 1 });
  });

  it('cobra: o veneno pode derrotar o vilão', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 14 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(s1.status).toBe('won');
    expect(ofType(s1.log, 'poisonTick')).toEqual([{ type: 'poisonTick', target: 'villain', damage: 1 }]);
  });

  it('lesma: cura uma parte do HP no início de cada rodada', () => {
    const p = { ...applySummonEncounter(createPlayer(common, gameData), 'slug').player, hp: 40 };
    const s1 = playRound(startBattle(p, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    expect(ofType(s1.log, 'summonRegen')).toEqual([{ type: 'summonRegen', hp: 3 }]);
    const lv2 = { ...applySummonEncounter(p, 'slug').player, hp: 40 };
    const s2 = playRound(startBattle(lv2, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    expect(ofType(s2.log, 'summonRegen')).toEqual([{ type: 'summonRegen', hp: 6 }]);
  });
});

describe('ninjutsu médico', () => {
  const medic = () => learnTechnique(createPlayer(common, gameData), 'medicalNinjutsu', gameData);

  it('ocupa um espaço próprio: não substitui o ninjutsu de ataque', () => {
    const p = learnTechnique(medic(), 'fireball', gameData);
    expect(p.techniques).toEqual(['medicalNinjutsu', 'fireball']);
    expect(availableActions(startBattle(p, testVillain()), gameData)).toContain('tech:fireball');
  });

  it('cura 20% do HP máximo, gasta chakra e não rola acerto', () => {
    const p = { ...medic(), hp: 50 };
    const s0 = startBattle(p, testVillain(), { playerStartsFirst: true });
    expect(availableActions(s0, gameData)).toContain('medical');
    const s1 = playRound(s0, 'medical', seq(0.01), gameData);
    expect(ofType(s1.log, 'medical')).toEqual([{ type: 'medical', healed: 20 }]);
    expect(s1.player.chakra).toBe(6);
  });

  it('indisponível com HP cheio ou sem chakra', () => {
    expect(availableActions(startBattle(medic(), testVillain()), gameData)).not.toContain('medical');
    const broke = { ...medic(), hp: 50, chakra: 3 };
    expect(availableActions(startBattle(broke, testVillain()), gameData)).not.toContain('medical');
  });

  it('o pergaminho também melhora a cura', () => {
    const step = applyItem(medic(), 'techniqueScroll', seq(0.9), gameData);
    expect(step.effect).toEqual({ kind: 'techniqueUpgrade', type: 'medical', level: 1 });
    const p = { ...step.player, hp: 50 };
    const s1 = playRound(startBattle(p, testVillain(), { playerStartsFirst: true }), 'medical', seq(0.01), gameData);
    expect(ofType(s1.log, 'medical')).toEqual([{ type: 'medical', healed: 25 }]);
  });

  it('o prodígio do taijutsu não aprende', () => {
    expect(learnableTechniques(createPlayer(prodigy, gameData), gameData)).not.toContain('medicalNinjutsu');
    expect(learnableTechniques(createPlayer(common, gameData), gameData)).toContain('medicalNinjutsu');
  });
});

describe('técnicas elementais respeitam o elemento do jogador', () => {
  const lightning: Origin = { lineageId: null, affinity: 'lightning', jinchuuriki: false };
  const elemental = ['fireball', 'windBlade', 'lightningSpear', 'earthWall', 'waterDragon'];

  it('um ninja de raio nunca aprende técnica de água pela recompensa "nova técnica"', () => {
    const rng = createRng(7);
    for (let i = 0; i < 300; i++) {
      const step = applyReward(createPlayer(lightning, gameData), 'newTechnique', 1, rng, gameData);
      expect(step.effect).not.toEqual({ kind: 'newTechnique', techniqueId: 'waterDragon' });
      expect(step.player.techniques.filter((id) => elemental.includes(id))).not.toContain('waterDragon');
    }
  });

  it('só a técnica da afinidade entra na pool; técnicas sem elemento continuam', () => {
    const pool = learnableTechniques(createPlayer(lightning, gameData), gameData);
    expect(pool.filter((id) => elemental.includes(id))).toEqual(['lightningSpear']);
    expect(pool).toEqual(expect.arrayContaining(['leafWhirlwind', 'crowIllusion', 'medicalNinjutsu']));
  });

  it('elemento secundário libera as técnicas dele', () => {
    const p = { ...createPlayer(lightning, gameData), secondaryElements: ['water' as const] };
    expect(learnableTechniques(p, gameData).filter((id) => elemental.includes(id))).toEqual([
      'lightningSpear',
      'waterDragon',
    ]);
  });

  it('learnTechnique recusa técnica de elemento que o jogador não domina', () => {
    expect(() => learnTechnique(createPlayer(lightning, gameData), 'waterDragon', gameData)).toThrow();
  });
});

describe('nível e XP', () => {
  /** Jogador com XP suficiente para subir 1 nível. */
  const ready = (o: Origin = common) => ({ ...createPlayer(o, gameData), xp: 100 });

  it('começa no nível 1, sem XP', () => {
    const p = createPlayer(common, gameData);
    expect([p.level, p.xp]).toEqual([1, 0]);
  });

  it('o XP para o próximo nível cresce a cada nível; no teto não há próximo', () => {
    expect(xpToNextLevel(1, gameData)).toBe(100);
    expect(xpToNextLevel(2, gameData)).toBe(125);
    expect(xpToNextLevel(9, gameData)).toBe(300);
    expect(xpToNextLevel(10, gameData)).toBeNull();
  });

  it('ganhar XP não sobe de nível sozinho; subir gasta o XP do nível e guarda a sobra', () => {
    const p = gainXp(createPlayer(common, gameData), 130, gameData);
    expect([p.level, p.xp]).toEqual([1, 130]);
    expect(canLevelUp(p, gameData)).toBe(true);
    const up = applyLevelUp(p, gameData);
    expect([up.level, up.xp]).toEqual([2, 30]);
    expect(canLevelUp(up, gameData)).toBe(false);
  });

  it('sem XP suficiente, não sobe', () => {
    const p = gainXp(createPlayer(common, gameData), 99, gameData);
    expect(canLevelUp(p, gameData)).toBe(false);
    expect(() => applyLevelUp(p, gameData)).toThrow();
  });

  it('nível máximo 10: o XP deixa de acumular', () => {
    const p = { ...createPlayer(common, gameData), level: 9, xp: 300 };
    const top = applyLevelUp(p, gameData);
    expect([top.level, top.xp]).toEqual([10, 0]);
    expect(gainXp(top, 500, gameData).xp).toBe(0);
    expect(canLevelUp(gainXp(top, 500, gameData), gameData)).toBe(false);
  });

  it('nos blocos de várias lutas não sobe de nível a cada mini vilão', () => {
    // Quarteto do Som chegando no nível 7 com o XP zerado: 4 lutas, só 1 nível.
    let p = { ...createPlayer(common, gameData), level: 7 };
    let levelUps = 0;
    for (const id of ['jirobo', 'kidomaru', 'tayuya', 'sakon']) {
      p = gainXp(p, villainsById[id]!.xp, gameData);
      while (canLevelUp(p, gameData)) {
        p = applyLevelUp(p, gameData);
        levelUps++;
      }
    }
    expect(levelUps).toBe(1);
  });

  it('cada nível aumenta HP e chakra máximos (sem roleta) e restaura HP e chakra', () => {
    const p = { ...ready(), hp: 50, chakra: 1 };
    const up = applyLevelUp(p, gameData);
    expect(up.level).toBe(2);
    expect([up.maxHp, up.hp]).toEqual([108, 108]);
    expect([up.maxChakra, up.chakra]).toEqual([11, 11]);
    expect(up.offense).toEqual(p.offense);
    expect([up.speed, up.resistanceBonus]).toEqual([p.speed, p.resistanceBonus]);
  });

  it('o ganho por nível depende da dificuldade; o chakra nunca sobe menos de 1', () => {
    const gain = (d: 'easy' | 'normal' | 'hard' | 'hardcore') => {
      const p = { ...createPlayer(common, gameData, d), xp: 100 };
      const up = applyLevelUp(p, gameData);
      return [up.maxHp - p.maxHp, up.maxChakra - p.maxChakra];
    };
    expect(gain('easy')).toEqual([10, 2]);
    expect(gain('normal')).toEqual([8, 1]);
    expect(gain('hard')).toEqual([6, 1]);
    expect(gain('hardcore')).toEqual([6, 1]);
    // Trocar a dificuldade na tela de origem troca o ganho.
    expect(withDifficulty(createPlayer(common, gameData), 'easy', gameData).growth).toEqual({ hp: 10, chakra: 2 });
  });

  it('levelUp descreve o efeito para a UI', () => {
    const step = levelUp(ready(), gameData);
    expect(step.effect).toEqual({ kind: 'levelUp', level: 2, hp: 8, chakra: 1, learned: [] });
  });

  it('Haku (1º do bloco) dá nível antes do Zabuza: há restauração entre as duas lutas', () => {
    // Mizuki leva ao nível 2 com o XP zerado; o Haku completa o nível 3.
    const p = { ...createPlayer(common, gameData), level: 2 };
    expect(canLevelUp(gainXp(p, villainsById.haku!.xp, gameData), gameData)).toBe(true);
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
    expect(hard.defense).toEqual({ taijutsu: 11, ninjutsu: 9, genjutsu: 6 });
    expect(hard.techniques[0]!.baseDamage).toBe(11);
    const hardcore = scaleVillain(v, 'hardcore', gameData);
    expect(hardcore.hp).toBe(125);
    expect(hardcore.techniques[0]!.baseDamage).toBe(12);
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

describe('recompensas', () => {
  it('a camada multiplica a quantidade', () => {
    const p = createPlayer(common, gameData);
    expect(applyReward(p, 'stages', 3, seq(0.5), gameData).player.speed).toBe(13);
    expect(applyReward(p, 'resistance', 2, seq(0.5), gameData).player.resistanceBonus).toBe(3);
    expect(applyReward(p, 'critBonus', 1, seq(0.5), gameData).player.critBonus).toBeCloseTo(0.03);
  });

  it('nova técnica respeita a origem: o prodígio só aprende taijutsu', () => {
    const rng = createRng(7);
    let p = createPlayer(prodigy, gameData);
    for (let i = 0; i < 20 && rewardPool(p, gameData).some((r) => r.id === 'newTechnique'); i++) {
      const step = applyReward(p, 'newTechnique', 1, rng, gameData);
      expect(step.effect).toMatchObject({ kind: 'newTechnique' });
      expect(['leafWhirlwind', 'empoweredTaijutsu']).toContain((step.effect as { techniqueId: string }).techniqueId);
      p = step.player;
    }
    expect(p.techniques.sort()).toEqual(['empoweredTaijutsu', 'leafWhirlwind']);
    // Já sabe as técnicas de taijutsu: a fatia "nova técnica" some da roleta.
    expect(rewardPool(p, gameData).map((r) => r.id)).not.toContain('newTechnique');
  });
});
