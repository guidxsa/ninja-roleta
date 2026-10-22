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
  levelUpPool,
  xpToNextLevel,
} from '../src/core/player';
import {
  applyAkatsuki,
  applyItem,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  learnableTechniques,
  levelUp,
  playJokenpo,
  rewardPool,
} from '../src/core/progression';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { gameData } from '../src/data/index';
import { villainsById } from '../src/data/villains';
import { seq, testVillain } from './helpers';

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
    expect([up.maxHp, up.hp]).toEqual([110, 60]);
    expect([up.maxChakra, up.chakra]).toEqual([14, 14]);
  });

  it('prodígio do taijutsu: ninjutsu e genjutsu continuam zerados', () => {
    const up = applyStatStages(createPlayer(prodigy, gameData), 1, gameData);
    expect(up.offense).toEqual({ taijutsu: 16, ninjutsu: 0, genjutsu: 0 });
  });
});

describe('eventos pré-vilão', () => {
  it('velhinha: vilão age primeiro; ramen: crítico garantido; treino: +1 estágio', () => {
    const p = createPlayer(common, gameData);
    expect(applySimpleEvent(p, 'oldLady', gameData).mods).toEqual({ villainStartsFirst: true });
    expect(applySimpleEvent(p, 'ramen', gameData).mods).toEqual({ guaranteedCrit: true });
    expect(applySimpleEvent(p, 'training', gameData).player.speed).toBe(11);
    expect(applySimpleEvent(p, 'nothing', gameData).player).toBe(p);
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
    const lv1 = applyItem(p, 'ninjaTool', seq(0.5)).player;
    const lv2 = applyItem(lv1, 'ninjaTool', seq(0.5)).player;
    expect(lv2.ninjaToolLevel).toBe(2);
    expect(playerTechnique(lv2, 'taijutsu', gameData).baseDamage).toBe(10);
    expect(playerTechnique(lv2, 'ninjutsu', gameData).baseDamage).toBe(12);
  });

  it('pergaminho sem técnicas melhora o taijutsu imbuído', () => {
    const step = applyItem(p, 'techniqueScroll', seq(0.5));
    expect(step.effect).toEqual({ kind: 'techniqueUpgrade', type: 'taijutsu', level: 1 });
    expect(playerTechnique(step.player, 'taijutsu', gameData).baseDamage).toBe(10);
  });

  it('pergaminho sorteia entre as técnicas aprendidas', () => {
    const learned = learnTechnique(p, 'fireball', gameData);
    const step = applyItem(learned, 'techniqueScroll', seq(0.9));
    expect(step.effect).toMatchObject({ type: 'ninjutsu' });
  });

  it('retorno, resistência e velocidade', () => {
    expect(applyItem(p, 'revive', seq(0.5)).player.revives).toBe(2);
    expect(applyItem(p, 'resistanceItem', seq(0.5)).player.resistanceBonus).toBe(2);
    expect(applyItem(p, 'speedItem', seq(0.5)).player.speed).toBe(11);
  });

  it('amuletos de resistência e velocidade ficam guardados na bolsa e acumulam', () => {
    expect(p.amulets).toEqual({ speed: 0, resistance: 0 });
    let q = applyItem(p, 'speedItem', seq(0.5)).player;
    q = applyItem(q, 'speedItem', seq(0.5)).player;
    q = applyItem(q, 'resistanceItem', seq(0.5)).player;
    expect(q.amulets).toEqual({ speed: 2, resistance: 1 });
    expect([q.speed, q.resistanceBonus]).toEqual([12, 2]);
  });
});

describe('encontros misteriosos', () => {
  it('Akatsuki: quem não é jinchuuriki ganha chance de crítico', () => {
    const p = createPlayer(common, gameData);
    const step = applyAkatsuki(p, gameData);
    expect(step.effect).toEqual({ kind: 'akatsukiInsight', amount: 0.05 });
    expect(step.player.critBonus).toBeCloseTo(0.05);
    expect(step.player.revives).toBe(p.revives);
  });

  it('Akatsuki: jinchuuriki perde 1 item de retorno; sem item, começa enfraquecido', () => {
    const jin = createPlayer({ ...common, jinchuuriki: true }, gameData);
    const took = applyAkatsuki(jin, gameData);
    expect(took.player.revives).toBe(0);
    const weak = applyAkatsuki(took.player, gameData);
    expect(weak.effect.kind).toBe('akatsukiWeakened');
    expect([weak.player.hp, weak.player.chakra]).toEqual([50, 10]);
  });

  it('invocação: aprende o animal; se já sabe, sobe de nível sem trocar o animal', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(p.summon).toEqual({ animal: 'toad', level: 1 });
    expect(applySummonEncounter(p, 'slug').player.summon).toEqual({ animal: 'toad', level: 2 });
  });
});

describe('combate: efeitos de eventos', () => {
  it('velhinha: o vilão age primeiro na 1ª rodada, sem rolar iniciativa', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain(), { villainStartsFirst: true });
    const s1 = playRound(s0, 'taijutsu', seq(0.01), gameData);
    expect(ofType(s1.log, 'late')).toHaveLength(1);
    expect(ofType(s1.log, 'initiative')).toHaveLength(0);
    expect(ofType(s1.log, 'attack')[0]!.side).toBe('villain');
  });

  it('ramen: o primeiro ataque é crítico mesmo com um rng que erraria; o segundo volta ao normal', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 200 }), {
      playerStartsFirst: true,
      guaranteedCrit: true,
    });
    const s1 = playRound(s0, 'taijutsu', seq(0.01), gameData);
    // (8 + 10 − 5) × 2 = 26
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'crit', damage: 26 });
    expect(s1.playerFx.guaranteedCrit).toBe(false);
    const s2 = playRound(s1, 'taijutsu', seq(0.01), gameData);
    expect(ofType(s2.log, 'attack').filter((a) => a.side === 'player').at(-1)).toMatchObject({ outcome: 'miss' });
  });

});

describe('invocações (passivas)', () => {
  it('não são uma ação de combate', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(availableActions(startBattle(p, testVillain()), gameData)).toEqual([
      'taijutsu',
      'ninjutsu',
      'genjutsu',
      'rest',
    ]);
  });

  it('sapo: dano base extra em todos os ataques, maior a cada nível', () => {
    const lv1 = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(playerTechnique(lv1, 'taijutsu', gameData).baseDamage).toBe(11); // 8 + 3
    expect(playerTechnique(lv1, 'ninjutsu', gameData).baseDamage).toBe(13); // 10 + 3
    const lv2 = applySummonEncounter(lv1, 'toad').player;
    expect(playerTechnique(lv2, 'taijutsu', gameData).baseDamage).toBe(13); // 8 + 3 + 2
  });

  it('cobra: acerto envenena; o veneno causa seu valor no fim da rodada e cai 1', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = startBattle(p, testVillain({ hp: 100 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'taijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'poison')).toEqual([{ type: 'poison', value: 5 }]);
    expect(ofType(s1.log, 'poisonTick')).toEqual([{ type: 'poisonTick', damage: 5, remaining: 4 }]);
    expect(s1.villain.hp).toBe(100 - 13 - 5);

    // Novo acerto com o alvo já envenenado não reaplica: o veneno segue caindo.
    const s2 = playRound(s1, 'taijutsu', seq(0.1, 0.5), gameData);
    expect(ofType(s2.log, 'poison')).toHaveLength(1);
    expect(s2.villain.poison).toBe(3);
  });

  it('cobra: o veneno some ao chegar a 0 e pode ser reaplicado', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = startBattle(p, testVillain({ hp: 200 }), { playerStartsFirst: true });
    const s1 = playRound({ ...s0, villain: { ...s0.villain, poison: 1 } }, 'rest', seq(0.1, 0.5), gameData);
    expect(s1.villain.poison).toBe(0);
    const s2 = playRound(s1, 'taijutsu', seq(0.1, 0.5), gameData);
    expect(ofType(s2.log, 'poison')).toEqual([{ type: 'poison', value: 5 }]);
  });

  it('cobra: o veneno pode derrotar o vilão', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s0 = startBattle(p, testVillain({ hp: 15 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'taijutsu', seq(0.5), gameData);
    expect(s1.status).toBe('won');
    expect(ofType(s1.log, 'poisonTick')).toEqual([{ type: 'poisonTick', damage: 2, remaining: 4 }]);
  });

  it('lesma: cura uma parte do HP no início de cada rodada', () => {
    const p = { ...applySummonEncounter(createPlayer(common, gameData), 'slug').player, hp: 40 };
    const s1 = playRound(startBattle(p, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    expect(ofType(s1.log, 'summonRegen')).toEqual([{ type: 'summonRegen', hp: 4 }]);
    const lv2 = { ...applySummonEncounter(p, 'slug').player, hp: 40 };
    const s2 = playRound(startBattle(lv2, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    expect(ofType(s2.log, 'summonRegen')).toEqual([{ type: 'summonRegen', hp: 6 }]);
  });
});

describe('ninjutsu médico', () => {
  const medic = () => learnTechnique(createPlayer(common, gameData), 'medicalNinjutsu', gameData);

  it('ocupa um espaço próprio: não substitui o ninjutsu de ataque', () => {
    const p = learnTechnique(medic(), 'fireball', gameData);
    expect(p.techniques).toEqual({ medical: 'medicalNinjutsu', ninjutsu: 'fireball' });
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
    const step = applyItem(medic(), 'techniqueScroll', seq(0.5));
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
      expect(step.player.techniques.ninjutsu ?? 'lightningSpear').toBe('lightningSpear');
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
    const up = applyLevelUp(p, 'speed', gameData);
    expect([up.level, up.xp]).toEqual([2, 30]);
    expect(canLevelUp(up, gameData)).toBe(false);
  });

  it('sem XP suficiente, não sobe', () => {
    const p = gainXp(createPlayer(common, gameData), 99, gameData);
    expect(canLevelUp(p, gameData)).toBe(false);
    expect(() => applyLevelUp(p, 'hp', gameData)).toThrow();
  });

  it('nível máximo 10: o XP deixa de acumular', () => {
    const p = { ...createPlayer(common, gameData), level: 9, xp: 300 };
    const top = applyLevelUp(p, 'hp', gameData);
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
        p = applyLevelUp(p, 'hp', gameData);
        levelUps++;
      }
    }
    expect(levelUps).toBe(1);
  });

  it('cada nível aumenta HP e chakra máximos, mais o status da roleta, e restaura HP e chakra', () => {
    const p = { ...ready(), hp: 50, chakra: 1 };
    const up = applyLevelUp(p, 'taijutsu', gameData);
    expect(up.level).toBe(2);
    expect([up.maxHp, up.hp]).toEqual([112, 112]);
    expect([up.maxChakra, up.chakra]).toEqual([12, 12]);
    expect(up.offense).toEqual({ taijutsu: 13, ninjutsu: 10, genjutsu: 10 });
  });

  it('HP, chakra, speed e resistência na roleta somam ao ganho fixo', () => {
    const p = ready();
    expect(applyLevelUp(p, 'hp', gameData).maxHp).toBe(127);
    expect(applyLevelUp(p, 'chakra', gameData).maxChakra).toBe(16);
    expect(applyLevelUp(p, 'speed', gameData).speed).toBe(11);
    expect(applyLevelUp(p, 'resistance', gameData).resistanceBonus).toBe(2);
  });

  it('a roleta de nível tira os tipos proibidos pela origem', () => {
    const ids = levelUpPool(createPlayer(prodigy, gameData), gameData).map((s) => s.id);
    expect(ids).not.toContain('ninjutsu');
    expect(ids).not.toContain('genjutsu');
    expect(ids).toContain('taijutsu');
  });

  it('levelUp descreve o efeito para a UI', () => {
    const step = levelUp(ready(), 'speed', gameData);
    expect(step.effect).toEqual({ kind: 'levelUp', level: 2, stat: 'speed', amount: 1 });
  });
});

describe('dificuldade', () => {
  const v = testVillain({ hp: 100, defense: { taijutsu: 10, ninjutsu: 8, genjutsu: 6 } });

  it('médio mantém o vilão original', () => {
    expect(scaleVillain(v, 'normal', gameData)).toBe(v);
  });

  it('fácil (75%) e difícil (150%) escalam HP, dano base e defesa', () => {
    const easy = scaleVillain(v, 'easy', gameData);
    expect(easy.hp).toBe(75);
    expect(easy.defense).toEqual({ taijutsu: 7, ninjutsu: 6, genjutsu: 4 });
    expect(easy.techniques[0]!.baseDamage).toBe(7);
    const hard = scaleVillain(v, 'hard', gameData);
    expect(hard.hp).toBe(150);
    expect(hard.defense).toEqual({ taijutsu: 15, ninjutsu: 12, genjutsu: 9 });
    expect(hard.techniques[0]!.baseDamage).toBe(15);
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
      expect(step.effect).toEqual({ kind: 'newTechnique', techniqueId: 'leafWhirlwind' });
      p = step.player;
    }
    // Já sabe a única técnica de taijutsu: a fatia "nova técnica" some da roleta.
    expect(rewardPool(p, gameData).map((r) => r.id)).not.toContain('newTechnique');
  });
});
