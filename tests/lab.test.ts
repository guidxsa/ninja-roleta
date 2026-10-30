import { describe, expect, it } from 'vitest';
import { buildLabPlayer, labLearnable, labOrigin, parseLabParams, type LabConfig } from '../src/core/lab';
import { createPlayer } from '../src/core/player';
import { gameData as data } from '../src/data/index';

const base: LabConfig = {
  lineageId: 'common',
  affinity: 'water',
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
    expect(labOrigin({ ...base, lineageId: 'uchiha' }, data).affinity).toBe('fire');
    expect(labOrigin({ ...base, lineageId: 'taijutsuProdigy' }, data).affinity).toBeNull();
    expect(labOrigin({ ...base, lineageId: 'nara' }, data)).toEqual({ lineageId: 'nara', affinity: 'water', jinchuuriki: false });
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
