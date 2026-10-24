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
  it('comum: rola afinidade, sem linhagem', () => {
    // 0.2 → comum; 0.0 → fogo; 0.99 → não jinchuuriki
    const { origin, steps } = rollOrigin(seq(0.2, 0.0, 0.99), gameData);
    expect(origin).toEqual({ lineageId: null, affinity: 'fire', jinchuuriki: false });
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'affinity', 'jinchuuriki']);
  });

  it('uma roleta só: comum 30%, clãs 40% e raras 30%', () => {
    const { steps } = rollOrigin(seq(0.2, 0.0, 0.99), gameData);
    const lineage = steps[0]!;
    const total = lineage.slices.reduce((a, s) => a + s.weight, 0);
    const share = (ids: string[]) =>
      lineage.slices.filter((s) => ids.includes(s.value)).reduce((a, s) => a + s.weight, 0) / total;
    expect(share(['common'])).toBeCloseTo(0.3);
    expect(share(['nara', 'akimichi', 'yamanaka', 'aburame', 'inuzuka'])).toBeCloseTo(0.4);
    expect(share(['taijutsuProdigy', 'uchiha', 'hyuuga', 'uzumaki'])).toBeCloseTo(0.3);
    // Os níveis batem com o peso de cada fatia nos dados.
    for (const l of gameData.lineages) {
      const tier = l.id === 'common' ? 'common' : ['taijutsuProdigy', 'uchiha', 'hyuuga', 'uzumaki'].includes(l.id) ? 'rare' : 'clan';
      expect(l.tier).toBe(tier);
    }
  });

  it('Uchiha tem afinidade fixa em fogo e pula a roleta de afinidade', () => {
    const { origin, steps } = rollOrigin(seq(0.8, 0.0), gameData);
    expect(origin).toEqual({ lineageId: 'uchiha', affinity: 'fire', jinchuuriki: true });
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'jinchuuriki']);
  });

  it('Prodígio do taijutsu não tem afinidade', () => {
    const { origin } = rollOrigin(seq(0.75, 0.99), gameData);
    expect(origin.lineageId).toBe('taijutsuProdigy');
    expect(origin.affinity).toBeNull();
  });

  it('clãs e Uzumaki rolam afinidade como as comuns', () => {
    const nara = rollOrigin(seq(0.32, 0.99, 0.99), gameData);
    expect(nara.origin.lineageId).toBe('nara');
    expect(nara.origin.affinity).toBe('water');
    const { origin, steps } = rollOrigin(seq(0.95, 0.99, 0.99), gameData);
    expect(origin.lineageId).toBe('uzumaki');
    expect(steps.map((s) => s.kind)).toEqual(['lineage', 'affinity', 'jinchuuriki']);
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
    expect(common / n).toBeCloseTo(0.3, 1);
    expect(jin / n).toBeCloseTo(0.1, 1);
  });

  it('cada passo guarda o índice da fatia sorteada (para a UI animar)', () => {
    const { steps } = rollOrigin(createRng(5), gameData);
    for (const s of steps) expect(s.slices[s.index]).toBeDefined();
  });
});

describe('criação do jogador', () => {
  /** Orçamento de status: tai/nin/gen 1, speed 1,5, 10 de HP = 1, 2 de chakra = 1. */
  const budget = (s: Stats) => s.taijutsu + s.ninjutsu + s.genjutsu + s.speed * 1.5 + s.hp / 10 + s.chakra / 2;

  it('todas as origens têm o mesmo orçamento de 90 pontos (70 + 20 em resistências)', () => {
    for (const l of gameData.lineages) {
      expect([l.id, budget(l.stats)]).toEqual([l.id, 70]);
      expect([l.id, l.resistance.physical + l.resistance.mental]).toEqual([l.id, 20]);
    }
  });

  it('comum: status absolutos, resistências 10/10, 1 Vontade do Fogo e Determinação', () => {
    const p = createPlayer({ lineageId: null, affinity: 'water', jinchuuriki: false }, gameData);
    expect(p.maxHp).toBe(100);
    expect(p.offense).toEqual({ taijutsu: 10, ninjutsu: 10, genjutsu: 10 });
    expect(p.resistance).toEqual({ physical: 10, mental: 10 });
    expect(p.maxChakra).toBe(30);
    expect(p.speed).toBe(10);
    expect(p.revives).toBe(1);
    expect(p.passive).toBe('determination');
  });

  it('resistências pela lore: clãs de corpo puxam para a física, de mente para a mental', () => {
    const res = (id: string) => createPlayer({ lineageId: id, affinity: id === 'taijutsuProdigy' ? null : 'earth', jinchuuriki: false }, gameData).resistance;
    expect(res('akimichi')).toEqual({ physical: 14, mental: 6 });
    expect(res('yamanaka')).toEqual({ physical: 6, mental: 14 });
    expect(res('taijutsuProdigy')).toEqual({ physical: 14, mental: 6 });
    expect(res('uchiha').mental).toBeGreaterThan(res('uchiha').physical);
  });

  it('comum começa com Punho de Chakra e o ninjutsu básico do elemento, sem genjutsu', () => {
    const p = createPlayer({ lineageId: null, affinity: 'water', jinchuuriki: false }, gameData);
    expect(knownTechniques(p, gameData).map((t) => t.id)).toEqual(['basicTaijutsu', 'waterBullet']);
    expect(canUseType(p, 'genjutsu', gameData)).toBe(false);
    expect(p.dojutsu).toBeNull();
  });

  it('kits de clã: Imitação de Sombra, Transferência de Mente, Enxame e Presas Giratórias', () => {
    const kit = (id: string) =>
      knownTechniques(createPlayer({ lineageId: id, affinity: 'earth', jinchuuriki: false }, gameData), gameData).map((t) => t.id);
    expect(kit('nara')).toEqual(['basicTaijutsu', 'rockFist', 'shadowImitation']);
    expect(kit('akimichi')).toEqual(['basicTaijutsu', 'rockFist']);
    expect(kit('yamanaka')).toEqual(['basicTaijutsu', 'rockFist', 'mindTransfer']);
    expect(kit('aburame')).toEqual(['basicTaijutsu', 'rockFist', 'insectSwarm']);
    expect(kit('inuzuka')).toEqual(['basicTaijutsu', 'fangOverFang', 'rockFist']);
  });

  it('Uchiha: genjutsu inicial (Olhar Hipnótico) e Fagulha do Dragão; junto com o Yamanaka, os únicos com genjutsu', () => {
    const p = createPlayer({ lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 7, ninjutsu: 12, genjutsu: 14 });
    expect(p.maxChakra).toBe(26);
    expect(p.passive).toBe('genjutsuResistance');
    expect(p.dojutsu).toBe('sharingan');
    expect(knownTechniques(p, gameData).map((t) => t.id)).toEqual(['basicTaijutsu', 'fireSpark', 'basicGenjutsu']);
    for (const id of ['hyuuga', 'taijutsuProdigy', 'uzumaki', 'nara', 'akimichi', 'aburame', 'inuzuka']) {
      const other = createPlayer({ lineageId: id, affinity: id === 'taijutsuProdigy' ? null : 'water', jinchuuriki: false }, gameData);
      expect(canUseType(other, 'genjutsu', gameData)).toBe(false);
    }
  });

  it('Hyuuga: foco em taijutsu, Byakugan e Selo dos Pontos Vitais', () => {
    const p = createPlayer({ lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 16, ninjutsu: 6, genjutsu: 8 });
    expect(p.dojutsu).toBe('byakugan');
    expect(p.techniques).toContain('chakraBlockStrike');
  });

  it('Uzumaki: muita vitalidade e chakra, Clones das Sombras', () => {
    const p = createPlayer({ lineageId: 'uzumaki', affinity: 'wind', jinchuuriki: false }, gameData);
    expect(p.maxHp).toBe(120);
    expect(p.maxChakra).toBe(35);
    expect(p.active).toBe('shadowClones');
  });

  it('prodígio do taijutsu: nin/gen zerados e técnicas proibidas', () => {
    const p = createPlayer({ lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 22, ninjutsu: 0, genjutsu: 0 });
    expect(p.maxHp).toBe(130);
    expect(p.maxChakra).toBe(28);
    expect(p.speed).toBe(14);
    expect(p.passive).toBe('ironBody');
    expect(p.active).toBe('gates');
    expect(() => learnTechnique(p, 'fireSpark', gameData)).toThrow();
    expect(() => learnTechnique(p, 'medicalNinjutsu', gameData)).toThrow();
    expect(learnTechnique(p, 'empoweredTaijutsu', gameData).techniques).toEqual(['basicTaijutsu', 'empoweredTaijutsu']);
    expect(knownTechniques(p, gameData).map((t) => t.id)).toEqual(['basicTaijutsu']);
  });

  it('jinchuuriki dobra o chakra e acumula com linhagem', () => {
    const p = createPlayer({ lineageId: 'uzumaki', affinity: 'wind', jinchuuriki: true }, gameData);
    expect(p.maxChakra).toBe(70);
    expect(p.maxHp).toBe(120);
    expect(p.jinchuuriki).toBe(true);
  });
});
