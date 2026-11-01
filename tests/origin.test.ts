import { describe, expect, it } from 'vitest';
import { rollOrigin } from '../src/core/origin';
import { canUseType, createPlayer, knownTechniques, learnTechnique } from '../src/core/player';
import { createRng } from '../src/core/rng';
import type { Stats } from '../src/core/types';
import { gameData } from '../src/data/index';
import { seq } from './helpers';

describe('rolagem de origem', () => {
  // Roleta de linhagem (uma só): comum 0..0.30, Nara ..0.38, Akimichi ..0.46, Yamanaka ..0.54,
  // Aburame ..0.62, Inuzuka ..0.70, prodígio ..0.79, Uchiha ..0.86, Hyuuga ..0.93, Uzumaki ..1.
  it('comum: roleta da quantidade (1, 2 ou 3) e um giro por elemento, sem repetir', () => {
    // 0.2 → comum; 0.0 → 1 elemento; 0.0 → fogo; 0.99 → não jinchuuriki
    const { origin, steps } = rollOrigin(seq(0.2, 0.0, 0.0, 0.99), gameData);
    expect(origin).toEqual({ lineageId: null, elements: ['fire'], jinchuuriki: false, kekkeiGenkai: null });
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'elementCount', 'element', 'jinchuuriki']);
    expect(steps[1]!.slices.map((s) => [s.value, s.weight])).toEqual([['1', 50], ['2', 35], ['3', 15]]);
    // 0.99 → 3 elementos; cada giro tira o já sorteado da roleta.
    const three = rollOrigin(seq(0.2, 0.99, 0.0, 0.0, 0.0, 0.99), gameData);
    expect(three.origin.elements).toEqual(['fire', 'wind', 'lightning']);
    expect(three.steps.filter((s) => s.kind === 'element').map((s) => s.slices.length)).toEqual([5, 4, 3]);
  });

  it('uma roleta só: comum 30, clãs 40, raras 30 e lendária 3 (de 103)', () => {
    const { steps } = rollOrigin(seq(0.2, 0.0, 0.99), gameData);
    const lineage = steps[0]!;
    const total = lineage.slices.reduce((a, s) => a + s.weight, 0);
    const share = (ids: string[]) =>
      lineage.slices.filter((s) => ids.includes(s.value)).reduce((a, s) => a + s.weight, 0) / total;
    expect(total).toBe(103);
    expect(share(['common'])).toBeCloseTo(30 / 103);
    expect(share(['nara', 'akimichi', 'yamanaka', 'aburame', 'inuzuka'])).toBeCloseTo(40 / 103);
    expect(share(['taijutsuProdigy', 'uchiha', 'hyuuga', 'uzumaki'])).toBeCloseTo(30 / 103);
    expect(share(['senju'])).toBeCloseTo(3 / 103);
    // Os níveis batem com o peso de cada fatia nos dados.
    for (const l of gameData.lineages) {
      const tier =
        l.id === 'common' ? 'common' : l.id === 'senju' ? 'legendary' : ['taijutsuProdigy', 'uchiha', 'hyuuga', 'uzumaki'].includes(l.id) ? 'rare' : 'clan';
      expect(l.tier).toBe(tier);
    }
  });

  it('Uchiha sempre tem fogo (o principal); a roleta só decide se vem um segundo', () => {
    const { origin, steps } = rollOrigin(seq(0.8, 0.0, 0.0), gameData);
    expect(origin).toEqual({ lineageId: 'uchiha', elements: ['fire'], jinchuuriki: true, kekkeiGenkai: null });
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'elementCount', 'jinchuuriki']);
    const two = rollOrigin(seq(0.8, 0.99, 0.0, 0.99), gameData);
    expect(two.origin.elements).toEqual(['fire', 'wind']);
  });

  it('Prodígio do taijutsu nunca tem elemento (sem roleta de quantidade)', () => {
    const { origin, steps } = rollOrigin(seq(0.75, 0.99), gameData);
    expect(origin.lineageId).toBe('taijutsuProdigy');
    expect(origin.elements).toEqual([]);
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'jinchuuriki']);
  });

  it('clãs e raras de kit dedicado: 0, 1 ou 2 elementos (30/55/15)', () => {
    const none = rollOrigin(seq(0.32, 0.0, 0.99), gameData);
    expect(none.origin).toEqual({ lineageId: 'nara', elements: [], jinchuuriki: false, kekkeiGenkai: null });
    expect(none.steps[1]!.slices.map((s) => [s.value, s.weight])).toEqual([['0', 30], ['1', 55], ['2', 15]]);
    const { origin } = rollOrigin(seq(0.95, 0.5, 0.99, 0.99), gameData);
    expect(origin).toEqual({ lineageId: 'uzumaki', elements: ['water'], jinchuuriki: false, kekkeiGenkai: null });
  });

  it('frequências batem com a configuração', () => {
    const rng = createRng(123);
    const n = 50000;
    let common = 0;
    let jin = 0;
    for (let i = 0; i < n; i++) {
      const { origin } = rollOrigin(rng, gameData);
      if (!origin.lineageId) common++;
      if (origin.jinchuuriki) jin++;
    }
    expect(common / n).toBeCloseTo(30 / 103, 1);
    expect(jin / n).toBeCloseTo(0.1, 1);
  });

  it('cada passo guarda o índice da fatia sorteada (para a UI animar)', () => {
    const { steps } = rollOrigin(createRng(5), gameData);
    for (const s of steps) expect(s.slices[s.index]).toBeDefined();
  });
});

describe('criação do jogador', () => {
  /** Orçamento de status: taijutsu/ninjutsu/genjutsu 1, speed 1,5, 10 de HP = 1, 2 de chakra = 1. */
  const budget = (s: Stats) => s.taijutsu + s.ninjutsu + s.genjutsu + s.speed * 1.5 + s.hp / 10 + s.chakra / 2;

  it('status pela lore, com o total perto de 90 (docs/origens.md#status-iniciais)', () => {
    // [pontos dos status, soma das resistências]
    const expected: Record<string, [number, number]> = {
      common: [70, 20],
      nara: [70.5, 21],
      akimichi: [67, 21],
      yamanaka: [74, 23],
      aburame: [69.5, 23],
      inuzuka: [69, 19],
      taijutsuProdigy: [59.5, 20],
      uchiha: [75.5, 20],
      hyuuga: [69, 21],
      uzumaki: [69.5, 21],
      senju: [75.5, 22],
    };
    for (const l of gameData.lineages) {
      expect([l.id, budget(l.stats), l.resistance.physical + l.resistance.mental]).toEqual([l.id, ...expected[l.id]!]);
    }
  });

  it('comum: status absolutos, resistências 10/10, 1 Vontade do Fogo e Determinação', () => {
    const p = createPlayer({ lineageId: null, elements: ['water'], jinchuuriki: false }, gameData);
    expect(p.maxHp).toBe(100);
    expect(p.offense).toEqual({ taijutsu: 10, ninjutsu: 10, genjutsu: 10 });
    expect(p.resistance).toEqual({ physical: 10, mental: 10 });
    expect(p.maxChakra).toBe(30);
    expect(p.speed).toBe(10);
    expect(p.revives).toBe(1);
    expect(p.passive).toBe('determination');
  });

  it('resistências pela lore: clãs de corpo puxam para a física, de mente para a mental', () => {
    const res = (id: string) => createPlayer({ lineageId: id, elements: [], jinchuuriki: false }, gameData).resistance;
    expect(res('akimichi')).toEqual({ physical: 14, mental: 7 });
    expect(res('yamanaka')).toEqual({ physical: 8, mental: 15 });
    expect(res('taijutsuProdigy')).toEqual({ physical: 12, mental: 8 });
    expect(res('yamanaka').mental).toBeGreaterThan(res('yamanaka').physical);
  });

  it('comum começa com Taijutsu básico e o ninjutsu básico do elemento, sem genjutsu', () => {
    const p = createPlayer({ lineageId: null, elements: ['water'], jinchuuriki: false }, gameData);
    expect(knownTechniques(p, gameData).map((t) => t.id)).toEqual(['basicTaijutsu', 'waterBullet']);
    expect(canUseType(p, 'genjutsu', gameData)).toBe(false);
    expect(p.dojutsu).toBeNull();
  });

  it('kits de clã: sem o básico elemental, com ataques próprios de nível 1', () => {
    const kit = (id: string) =>
      knownTechniques(createPlayer({ lineageId: id, elements: ['earth'], jinchuuriki: false }, gameData), gameData).map((t) => t.id).sort();
    expect(kit('nara')).toEqual(['basicTaijutsu', 'shadowImitation', 'shadowSlash', 'shadowStrangle']);
    expect(kit('akimichi')).toEqual(['basicTaijutsu', 'expandedHand']);
    expect(kit('yamanaka')).toEqual(['basicTaijutsu', 'mindTransfer', 'petalIllusion']);
    expect(kit('aburame')).toEqual(['basicTaijutsu', 'insectDevour', 'insectSwarm']);
    expect(kit('inuzuka')).toEqual(['basicTaijutsu', 'fangOverFang']);
    expect(kit('uzumaki')).toEqual(['basicTaijutsu', 'explosiveSeal']);
    expect(kit('hyuuga')).toEqual(['basicTaijutsu', 'chakraBlockStrike']);
  });

  it('Uchiha: genjutsu inicial (Olhar Hipnótico e Ilusão da Dor) e Fagulha do Dragão; junto com o Yamanaka, os únicos com genjutsu', () => {
    const p = createPlayer({ lineageId: 'uchiha', elements: ['fire'], jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 11, ninjutsu: 11, genjutsu: 13 });
    expect(p.maxChakra).toBe(28);
    expect(p.passive).toBe('genjutsuResistance');
    expect(p.dojutsu).toBe('sharingan');
    expect(knownTechniques(p, gameData).map((t) => t.id)).toEqual(['basicTaijutsu', 'fireSpark', 'basicGenjutsu', 'painIllusion']);
    for (const id of ['hyuuga', 'taijutsuProdigy', 'uzumaki', 'nara', 'akimichi', 'aburame', 'inuzuka']) {
      const other = createPlayer({ lineageId: id, elements: id === 'taijutsuProdigy' ? [] : ['water'], jinchuuriki: false }, gameData);
      expect(canUseType(other, 'genjutsu', gameData)).toBe(false);
    }
  });

  it('Hyuuga: foco em taijutsu, Byakugan e Selo dos Pontos Vitais', () => {
    const p = createPlayer({ lineageId: 'hyuuga', elements: ['water'], jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 15, ninjutsu: 6, genjutsu: 6 });
    expect(p.dojutsu).toBe('byakugan');
    expect(p.techniques).toContain('chakraBlockStrike');
  });

  it('Uzumaki: muita vitalidade e chakra, Selamento', () => {
    const p = createPlayer({ lineageId: 'uzumaki', elements: ['wind'], jinchuuriki: false }, gameData);
    expect(p.maxHp).toBe(120);
    expect(p.maxChakra).toBe(38);
    expect(p.active).toBe('seal');
  });

  it('prodígio do taijutsu: ninjutsu/genjutsu zerados e técnicas proibidas', () => {
    const p = createPlayer({ lineageId: 'taijutsuProdigy', elements: [], jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 18, ninjutsu: 0, genjutsu: 0 });
    expect(p.maxHp).toBe(110);
    expect(p.maxChakra).toBe(22);
    expect(p.speed).toBe(13);
    expect(p.passive).toBe('ironBody');
    expect(p.active).toBe('gates');
    expect(() => learnTechnique(p, 'fireSpark', gameData)).toThrow();
    expect(() => learnTechnique(p, 'medicalNinjutsu', gameData)).toThrow();
    expect(learnTechnique(p, 'empoweredTaijutsu', gameData).techniques).toEqual(['basicTaijutsu', 'empoweredTaijutsu']);
    expect(knownTechniques(p, gameData).map((t) => t.id)).toEqual(['basicTaijutsu']);
  });

  it('jinchuuriki dobra o chakra e acumula com linhagem', () => {
    const p = createPlayer({ lineageId: 'uzumaki', elements: ['wind'], jinchuuriki: true }, gameData);
    expect(p.maxChakra).toBe(76);
    expect(p.maxHp).toBe(120);
    expect(p.jinchuuriki).toBe(true);
  });
});
