import { describe, expect, it } from 'vitest';
import { applyLabStats, buildLabPlayer, labLearnable, labStatsOf, labOrigin, parseLabParams, type LabConfig } from '../src/core/lab';
import { createPlayer } from '../src/core/player';
import { gameData as data } from '../src/data/index';

const base: LabConfig = {
  lineageId: 'common',
  elements: ['water'],
  jinchuuriki: false,
  difficulty: 'normal',
  level: 1,
  techniques: [],
  bag: {},
};

describe('parseLabParams', () => {
  it('lê ?teste e ?seed', () => {
    expect(parseLabParams('?teste&seed=42')).toEqual({ lab: true, seed: 42 });
    expect(parseLabParams('?seed=7')).toEqual({ lab: false, seed: 7 });
    expect(parseLabParams('')).toEqual({ lab: false, seed: null });
  });

  it('ignora seed inválida', () => {
    expect(parseLabParams('?seed=abc').seed).toBeNull();
    expect(parseLabParams('?seed=-3').seed).toBeNull();
  });
});

describe('labOrigin', () => {
  it('afinidade fixa e nenhuma vencem a escolhida', () => {
    expect(labOrigin({ ...base, lineageId: 'uchiha' }, data).elements).toEqual(['fire', 'water']);
    expect(labOrigin({ ...base, lineageId: 'taijutsuProdigy' }, data).elements).toEqual([]);
    // Corta na quantidade máxima da origem e não repete; o comum nunca fica sem elemento.
    expect(labOrigin({ ...base, lineageId: 'nara', elements: ['fire', 'water', 'earth'] }, data).elements).toEqual(['fire', 'water']);
    expect(labOrigin({ ...base, elements: [] }, data).elements).toEqual(['fire']);
    expect(labOrigin({ ...base, lineageId: 'nara', elements: [] }, data).elements).toEqual([]);
    expect(labOrigin({ ...base, lineageId: 'nara' }, data)).toEqual({ lineageId: 'nara', elements: ['water'], jinchuuriki: false });
  });

  it('comum vira lineageId null', () => {
    expect(labOrigin(base, data).lineageId).toBeNull();
  });
});

describe('buildLabPlayer', () => {
  it('nível 1 sem extras é a ficha da campanha', () => {
    expect(buildLabPlayer(base, data)).toEqual(createPlayer(labOrigin(base, data), data, 'normal'));
  });

  it('sobe os níveis com HP cheio, XP zerado e upgrades de marco pendentes', () => {
    const p = buildLabPlayer({ ...base, level: 7 }, data);
    const start = createPlayer(labOrigin(base, data), data, 'normal');
    expect(p.level).toBe(7);
    expect(p.xp).toBe(0);
    expect(p.maxHp).toBe(start.maxHp + 6 * start.growth.hp);
    expect(p.hp).toBe(p.maxHp);
    expect(p.pendingUpgrades).toBe(2);
  });

  it('ensina as técnicas permitidas e ignora as proibidas', () => {
    const p = buildLabPlayer({ ...base, lineageId: 'taijutsuProdigy', techniques: ['empoweredTaijutsu', 'crowIllusion', 'rasengan'] }, data);
    expect(p.techniques).toContain('empoweredTaijutsu');
    expect(p.techniques).not.toContain('crowIllusion');
    expect(p.techniques).not.toContain('rasengan');
  });

  it('enche a bolsa até o limite', () => {
    const p = buildLabPlayer({ ...base, bag: { soldierPill: 2, medKit: 99, smokeBomb: -1 } }, data);
    expect(p.bag).toEqual({ soldierPill: 2, medKit: data.balance.items.bagMax, explosiveTag: 0, smokeBomb: 0 });
  });
});

describe('status à mão', () => {
  it('sobrescreve só o que foi escrito, com HP e chakra cheios', () => {
    const auto = buildLabPlayer({ ...base, level: 4 }, data);
    const p = buildLabPlayer({ ...base, level: 4, stats: { hp: 300, chakra: 80, ninjutsu: 25, speed: 12, mental: 9 } }, data);
    expect(labStatsOf(p)).toEqual({ ...labStatsOf(auto), hp: 300, chakra: 80, ninjutsu: 25, speed: 12, mental: 9 });
    expect(p.hp).toBe(300);
    expect(p.chakra).toBe(80);
    expect(p.level).toBe(4);
  });

  it('arredonda para baixo e respeita os mínimos', () => {
    const p = applyLabStats(createPlayer(labOrigin(base, data), data), { hp: 0, chakra: -5, taijutsu: 7.9, physical: -2, speed: NaN });
    expect(p.maxHp).toBe(1);
    expect(p.maxChakra).toBe(1);
    expect(p.offense.taijutsu).toBe(7);
    expect(p.resistance.physical).toBe(0);
    expect(p.speed).toBe(createPlayer(labOrigin(base, data), data).speed);
  });
});

describe('labLearnable', () => {
  it('inclui premium, tira as já sabidas, as de outro elemento e as cópias', () => {
    const p = createPlayer(labOrigin(base, data), data);
    const ids = labLearnable(p, data).map((t) => t.id);
    expect(ids).toContain('rasengan');
    expect(ids).toContain('waterWall');
    expect(ids).not.toContain('flameWall');
    expect(ids.some((id) => p.techniques.includes(id))).toBe(false);
    expect(labLearnable(createPlayer(labOrigin({ ...base, lineageId: 'uchiha' }, data), data), data).some((t) => t.copied)).toBe(false);
  });
});
