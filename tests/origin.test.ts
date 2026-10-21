import { describe, expect, it } from 'vitest';
import { rollOrigin } from '../src/core/origin';
import { createPlayer, learnTechnique } from '../src/core/player';
import { createRng } from '../src/core/rng';
import { gameData } from '../src/data/index';
import { seq } from './helpers';

describe('rolagem de origem', () => {
  it('comum: rola afinidade, sem linhagem', () => {
    // 0.5 → comum (especial é 0..0.1); 0.0 → fogo; 0.99 → não jinchuuriki
    const { origin, steps } = rollOrigin(seq(0.5, 0.0, 0.99), gameData);
    expect(origin).toEqual({ lineageId: null, affinity: 'fire', jinchuuriki: false });
    expect(steps.map((s) => s.kind)).toEqual(['lineageTier', 'affinity', 'jinchuuriki']);
  });

  it('Uchiha tem afinidade fixa em fogo e pula a roleta de afinidade', () => {
    // 0.05 → especial; 0.1 → Uchiha (peso 30 de 100); 0.0 → jinchuuriki
    const { origin, steps } = rollOrigin(seq(0.05, 0.1, 0.0), gameData);
    expect(origin).toEqual({ lineageId: 'uchiha', affinity: 'fire', jinchuuriki: true });
    expect(steps.map((s) => s.kind)).toEqual(['lineageTier', 'lineage', 'jinchuuriki']);
  });

  it('Prodígio do taijutsu não tem afinidade', () => {
    // 0.7 → prodígio (60..85)
    const { origin } = rollOrigin(seq(0.05, 0.7, 0.99), gameData);
    expect(origin.lineageId).toBe('taijutsuProdigy');
    expect(origin.affinity).toBeNull();
  });

  it('Uzumaki rola afinidade como as comuns', () => {
    const { origin, steps } = rollOrigin(seq(0.05, 0.9, 0.99, 0.99), gameData);
    expect(origin.lineageId).toBe('uzumaki');
    expect(steps.map((s) => s.kind)).toEqual(['lineageTier', 'lineage', 'affinity', 'jinchuuriki']);
    expect(origin.affinity).toBe('water');
  });

  it('frequências batem com a configuração', () => {
    const rng = createRng(123);
    const n = 50000;
    let special = 0;
    let jin = 0;
    for (let i = 0; i < n; i++) {
      const { origin } = rollOrigin(rng, gameData);
      if (origin.lineageId) special++;
      if (origin.jinchuuriki) jin++;
    }
    expect(special / n).toBeCloseTo(0.1, 1);
    expect(jin / n).toBeCloseTo(0.05, 1);
  });

  it('cada passo guarda o índice da fatia sorteada (para a UI animar)', () => {
    const { steps } = rollOrigin(createRng(5), gameData);
    for (const s of steps) expect(s.slices[s.index]).toBeDefined();
  });
});

describe('criação do jogador', () => {
  it('comum usa status base, 1 item de retorno e diferencial de resistência 1', () => {
    const p = createPlayer({ lineageId: null, affinity: 'water', jinchuuriki: false }, gameData);
    expect(p.maxHp).toBe(100);
    expect(p.offense).toEqual({ taijutsu: 10, ninjutsu: 10, genjutsu: 10 });
    expect(p.maxChakra).toBe(10);
    expect(p.speed).toBe(10);
    expect(p.revives).toBe(1);
    expect(p.resistanceBonus).toBe(1);
    expect(p.passive).toBeNull();
  });

  it('aplica modificadores da linhagem', () => {
    const p = createPlayer({ lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 10, ninjutsu: 12, genjutsu: 12 });
    expect(p.speed).toBe(11);
    expect(p.passive?.kind).toBe('movementReading');
  });

  it('prodígio do taijutsu: nin/gen zerados e técnicas proibidas', () => {
    const p = createPlayer({ lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false }, gameData);
    expect(p.offense).toEqual({ taijutsu: 15, ninjutsu: 0, genjutsu: 0 });
    expect(p.maxHp).toBe(110);
    expect(p.maxChakra).toBe(7);
    expect(p.speed).toBe(13);
    expect(() => learnTechnique(p, 'fireball', gameData)).toThrow();
    expect(learnTechnique(p, 'leafWhirlwind', gameData).techniques.taijutsu).toBe('leafWhirlwind');
  });

  it('jinchuuriki dobra o chakra e acumula com linhagem', () => {
    const p = createPlayer({ lineageId: 'uzumaki', affinity: 'wind', jinchuuriki: true }, gameData);
    expect(p.maxChakra).toBe(30); // 10 × 1.5 × 2
    expect(p.maxHp).toBe(120);
    expect(p.jinchuuriki).toBe(true);
  });
});
