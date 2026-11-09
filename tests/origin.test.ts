import { describe, expect, it } from 'vitest';
import { rollOrigin } from '../src/core/origin';
import { canUseType, createPlayer, knownTechniques, learnTechnique } from '../src/core/player';
import { createRng } from '../src/core/rng';
import type { Stats } from '../src/core/types';
import { gameData } from '../src/data/index';
import { seq } from './helpers';

describe('rolagem de origem', () => {
  // Roleta de linhagem (uma só, de 103): comum 0..0.379, Nara ..0.456, Akimichi ..0.534, Yamanaka ..0.612,
  // Aburame ..0.689, Inuzuka ..0.767, Uchiha ..0.835, Hyuuga ..0.903, Uzumaki ..0.971, Senju ..1.
  it('comum: roleta de proficiência (sem → Prodígio; com → uma natureza)', () => {
    // 0.2 → comum; 0.5 → com proficiência; 0.0 → fogo; 0.99 → não jinchuuriki
    const { origin, steps } = rollOrigin(seq(0.2, 0.5, 0.0, 0.99), gameData);
    expect(origin).toEqual({ lineageId: null, elements: ['fire'], jinchuuriki: false, kekkeiGenkai: null });
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'elementCount', 'element', 'jinchuuriki']);
    expect(steps[1]!.slices.map((s) => [s.value, s.weight])).toEqual([['0', 18], ['1', 60]]);
  });

  it('cada ninja tem uma natureza só (v0.59.0)', () => {
    for (const l of gameData.lineages) expect(l.elements.countWeights.length, l.id).toBeLessThanOrEqual(2);
    const rng = createRng(77);
    for (let i = 0; i < 2000; i++) {
      const { origin } = rollOrigin(rng, gameData);
      expect(origin.elements.length + (origin.kekkeiGenkai ? 1 : 0)).toBe(1);
    }
  });

  it('uma roleta só: comum 39 (o Prodígio sai dele), clãs 40, raras 21 e lendária 3 (de 103)', () => {
    const { steps } = rollOrigin(seq(0.2, 0.0, 0.99), gameData);
    const lineage = steps[0]!;
    const total = lineage.slices.reduce((a, s) => a + s.weight, 0);
    const share = (ids: string[]) =>
      lineage.slices.filter((s) => ids.includes(s.value)).reduce((a, s) => a + s.weight, 0) / total;
    expect(total).toBe(103);
    expect(share(['common'])).toBeCloseTo(39 / 103);
    expect(share(['nara', 'akimichi', 'yamanaka', 'aburame', 'inuzuka'])).toBeCloseTo(40 / 103);
    expect(share(['uchiha', 'hyuuga', 'uzumaki'])).toBeCloseTo(21 / 103);
    expect(lineage.slices.some((s) => s.value === 'taijutsuProdigy')).toBe(false);
    expect(share(['senju'])).toBeCloseTo(3 / 103);
    // Os níveis batem com o peso de cada fatia nos dados.
    for (const l of gameData.lineages) {
      const tier =
        l.id === 'common' ? 'common' : l.id === 'senju' ? 'legendary' : ['taijutsuProdigy', 'uchiha', 'hyuuga', 'uzumaki'].includes(l.id) ? 'rare' : 'clan';
      expect(l.tier).toBe(tier);
    }
  });

  it('Uchiha: sempre e só Fogo, sem roleta de natureza', () => {
    const { origin, steps } = rollOrigin(seq(0.8, 0.0), gameData);
    expect(origin).toEqual({ lineageId: 'uchiha', elements: ['fire'], jinchuuriki: true, kekkeiGenkai: null });
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'jinchuuriki']);
    const rng = createRng(9);
    for (let i = 0; i < 3000; i++) {
      const { origin: o } = rollOrigin(rng, gameData);
      if (o.lineageId === 'uchiha') expect(o.elements).toEqual(['fire']);
    }
  });

  it('Senju: uma natureza e a rolagem especial do Mokuton (raríssima), que vira a natureza', () => {
    // 0.99 → Senju; 0.0 → fogo; 0.01 → Mokuton (3%); 0.99 → não jinchuuriki
    const wood = rollOrigin(seq(0.99, 0.0, 0.01, 0.99), gameData);
    expect(wood.origin).toEqual({ lineageId: 'senju', elements: [], jinchuuriki: false, kekkeiGenkai: 'wood' });
    expect(wood.steps.map((s) => s.kind)).toEqual(['lineage', 'element', 'kekkeiGenkai', 'jinchuuriki']);
    const kgStep = wood.steps[2]!;
    expect(kgStep.slices.map((s) => [s.value, Number(s.weight.toFixed(2))])).toEqual([['wood', 0.03], ['none', 0.97]]);
    const plain = rollOrigin(seq(0.99, 0.0, 0.5, 0.99), gameData);
    expect(plain.origin).toEqual({ lineageId: 'senju', elements: ['fire'], jinchuuriki: false, kekkeiGenkai: null });
  });

  it('as outras Kekkei Genkai não saem mais para o jogador', () => {
    const rng = createRng(31);
    for (let i = 0; i < 5000; i++) {
      const { origin } = rollOrigin(rng, gameData);
      if (origin.kekkeiGenkai) expect([origin.lineageId, origin.kekkeiGenkai]).toEqual(['senju', 'wood']);
    }
  });

  it('o Comum sem proficiência vira o Prodígio do taijutsu (9% no total, como antes), com natureza silenciosa', () => {
    // 0.2 → comum; 0.0 → sem proficiência → Prodígio; 0.0 → natureza silenciosa (fogo); 0.99 → não jinchuuriki
    const { origin, steps } = rollOrigin(seq(0.2, 0.0, 0.0, 0.99), gameData);
    expect(origin).toEqual({ lineageId: 'taijutsuProdigy', elements: ['fire'], jinchuuriki: false, kekkeiGenkai: null });
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'elementCount', 'jinchuuriki']);
    const common = gameData.lineages.find((l) => l.id === 'common')!;
    const w = common.elements.countWeights;
    expect((common.weight * w[0]!) / w.reduce((a, b) => a + b, 0)).toBe(9);
  });

  it('clãs sem ninjutsu elemental: natureza sorteada em silêncio (sem roleta); Uzumaki gira a roleta de natureza', () => {
    const nara = rollOrigin(seq(0.4, 0.0, 0.99), gameData);
    expect(nara.origin).toEqual({ lineageId: 'nara', elements: ['fire'], jinchuuriki: false, kekkeiGenkai: null });
    expect(nara.steps.map((s) => s.kind)).toEqual(['lineage', 'jinchuuriki']);
    const uzu = rollOrigin(seq(0.95, 0.5, 0.99), gameData);
    expect(uzu.origin.lineageId).toBe('uzumaki');
    expect(uzu.origin.elements).toHaveLength(1);
    expect(uzu.steps.map((s) => s.kind)).toEqual(['lineage', 'element', 'jinchuuriki']);
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

  it('status pela lore, com o total perto de 90 (docs/base/origens.md#status-iniciais)', () => {
    // [pontos dos status, soma das resistências]
    const expected: Record<string, [number, number]> = {
      common: [71, 19],
      nara: [70.5, 21],
      akimichi: [67, 21],
      yamanaka: [74, 23],
      aburame: [69.5, 23],
      inuzuka: [70, 20],
      taijutsuProdigy: [59.5, 20],
      uchiha: [75.5, 21],
      hyuuga: [69, 21],
      uzumaki: [74.5, 21],
      senju: [80.5, 22],
    };
    for (const l of gameData.lineages) {
      expect([l.id, budget(l.stats), l.resistance.physical + l.resistance.mental]).toEqual([l.id, ...expected[l.id]!]);
    }
  });

  it('comum: status absolutos (ninjutsu de base, genjutsu baixo), resistências 10/9, 1 Vontade do Fogo e Determinação', () => {
    const p = createPlayer({ lineageId: null, elements: ['water'], jinchuuriki: false }, gameData);
    expect(p.maxHp).toBe(100);
    expect(p.offense).toEqual({ taijutsu: 12, ninjutsu: 13, genjutsu: 5 });
    expect(p.resistance).toEqual({ physical: 10, mental: 9 });
    expect(p.maxChakra).toBe(32);
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
    // O Uzumaki usa ninjutsu elemental: o básico da natureza no lugar da Etiqueta Explosiva (v0.59.0).
    expect(kit('uzumaki')).toEqual(['basicTaijutsu', 'rockFist']);
    expect(kit('hyuuga')).toEqual(['basicTaijutsu', 'chakraBlockStrike']);
  });

  it('Uchiha: genjutsu inicial (Olhar Hipnótico e Ilusão da Dor) e Fagulha do Dragão; junto com o Yamanaka, os únicos com genjutsu', () => {
    const p = createPlayer({ lineageId: 'uchiha', elements: ['fire'], jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 10, ninjutsu: 12, genjutsu: 13 });
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
    expect(p.passive).toBe('youth');
    expect(p.critBonus).toBeCloseTo(0.05);
    expect(p.active).toBe('gates');
    expect(() => learnTechnique(p, 'fireSpark', gameData)).toThrow();
    expect(() => learnTechnique(p, 'medicalNinjutsu', gameData)).toThrow();
    expect(learnTechnique(p, 'empoweredTaijutsu', gameData).techniques).toEqual(['basicTaijutsu', 'leafHurricane', 'empoweredTaijutsu']);
    expect(knownTechniques(p, gameData).map((t) => t.id)).toEqual(['basicTaijutsu', 'leafHurricane']);
  });

  it('jinchuuriki dobra o chakra e acumula com linhagem', () => {
    const p = createPlayer({ lineageId: 'uzumaki', elements: ['wind'], jinchuuriki: true }, gameData);
    expect(p.maxChakra).toBe(76);
    expect(p.maxHp).toBe(120);
    expect(p.jinchuuriki).toBe(true);
  });
});
