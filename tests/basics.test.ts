import { describe, expect, it } from 'vitest';
import { playerDamage, playerResistance, villainDamage } from '../src/core/damage';
import { elementMultiplier } from '../src/core/elements';
import { critChance, genjutsuHitChance, hitChance, hitSlices, rollHit } from '../src/core/hit';
import { initiativeChance, rollInitiative } from '../src/core/initiative';
import { createRng } from '../src/core/rng';
import { spin } from '../src/core/roulette';
import { balance } from '../src/data/balance';
import { BEATS } from '../src/data/elements';
import { seq } from './helpers';

describe('rng', () => {
  it('é determinístico pela seed e fica em [0, 1)', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('roleta', () => {
  const slices = [
    { label: 'a', weight: 1, value: 'a' },
    { label: 'zero', weight: 0, value: 'zero' },
    { label: 'b', weight: 3, value: 'b' },
  ];

  it('sorteia proporcionalmente ao peso', () => {
    expect(spin(slices, seq(0)).slice.value).toBe('a');
    expect(spin(slices, seq(0.24)).slice.value).toBe('a');
    expect(spin(slices, seq(0.25)).slice.value).toBe('b');
    expect(spin(slices, seq(0.999)).index).toBe(2);
  });

  it('nunca sorteia fatia de peso 0', () => {
    const rng = createRng(7);
    for (let i = 0; i < 2000; i++) expect(spin(slices, rng).slice.value).not.toBe('zero');
  });

  it('distribuição aproximada com muitos giros', () => {
    const rng = createRng(1);
    let b = 0;
    for (let i = 0; i < 20000; i++) if (spin(slices, rng).slice.value === 'b') b++;
    expect(b / 20000).toBeCloseTo(0.75, 1);
  });

  it('rejeita roleta sem peso positivo ou com peso inválido', () => {
    expect(() => spin([{ label: 'x', weight: 0, value: 1 }], seq(0))).toThrow();
    expect(() => spin([{ label: 'x', weight: -1, value: 1 }], seq(0))).toThrow();
    expect(() => spin([], seq(0))).toThrow();
  });
});

describe('elementos', () => {
  const cfg = balance.elements;
  it('segue o ciclo fogo > vento > raio > terra > água > fogo', () => {
    expect(elementMultiplier('fire', 'wind', BEATS, cfg)).toBe(1.5);
    expect(elementMultiplier('wind', 'lightning', BEATS, cfg)).toBe(1.5);
    expect(elementMultiplier('lightning', 'earth', BEATS, cfg)).toBe(1.5);
    expect(elementMultiplier('earth', 'water', BEATS, cfg)).toBe(1.5);
    expect(elementMultiplier('water', 'fire', BEATS, cfg)).toBe(1.5);
    expect(elementMultiplier('wind', 'fire', BEATS, cfg)).toBe(0.75);
    expect(elementMultiplier('fire', 'earth', BEATS, cfg)).toBe(1);
    expect(elementMultiplier('fire', 'fire', BEATS, cfg)).toBe(1);
  });

  it('sem elemento é neutro', () => {
    expect(elementMultiplier(null, 'wind', BEATS, cfg)).toBe(1);
    expect(elementMultiplier('fire', null, BEATS, cfg)).toBe(1);
  });
});

describe('iniciativa quadrática', () => {
  it('5 vs 3 ≈ 74%', () => {
    expect(initiativeChance(5, 3)).toBeCloseTo(25 / 34);
    expect(initiativeChance(5, 3)).toBeCloseTo(0.735, 2);
  });
  it('empate é 50% e speed 0 vs 0 também', () => {
    expect(initiativeChance(7, 7)).toBe(0.5);
    expect(initiativeChance(0, 0)).toBe(0.5);
  });
  it('sorteia A abaixo da chance e B acima', () => {
    expect(rollInitiative(5, 3, seq(0.7))).toBe('a');
    expect(rollInitiative(5, 3, seq(0.75))).toBe('b');
  });
});

describe('acerto e crítico', () => {
  it('chance de acerto usa a diferença de speed, com limites', () => {
    expect(hitChance(10, 10, balance.hit)).toBeCloseTo(0.85);
    expect(hitChance(15, 10, balance.hit)).toBeCloseTo(0.9);
    expect(hitChance(100, 0, balance.hit)).toBe(balance.hit.max);
    expect(hitChance(0, 100, balance.hit)).toBe(balance.hit.min);
  });

  it('genjutsu compara genjutsu do atacante com o do defensor', () => {
    expect(genjutsuHitChance(10, 10, balance.genjutsuHit)).toBeCloseTo(0.6);
    expect(genjutsuHitChance(15, 10, balance.genjutsuHit)).toBeCloseTo(0.7);
  });

  it('crítico = 5% + diferencial', () => {
    expect(critChance(0, 0.05)).toBeCloseTo(0.05);
    expect(critChance(0.1, 0.05)).toBeCloseTo(0.15);
  });

  it('fatias: erro | acerto | crítico (topo do dado)', () => {
    const s = hitSlices(0.85, 0.05);
    expect(s.map((x) => x.value)).toEqual(['miss', 'hit', 'crit']);
    expect(s[0]!.weight).toBeCloseTo(0.15);
    expect(s[1]!.weight).toBeCloseTo(0.8);
    expect(s[2]!.weight).toBeCloseTo(0.05);
    expect(rollHit(0.85, 0.05, seq(0.1))).toBe('miss');
    expect(rollHit(0.85, 0.05, seq(0.5))).toBe('hit');
    expect(rollHit(0.85, 0.05, seq(0.97))).toBe('crit');
  });

  it('crítico nunca passa da chance de acertar', () => {
    const s = hitSlices(0.3, 0.9);
    expect(s[2]!.weight).toBeCloseTo(0.3);
    expect(s[1]!.weight).toBeCloseTo(0);
  });
});

describe('dano', () => {
  it('jogador: (base + ofensivo − defensivo) × elemento × crítico, arredondado pra baixo', () => {
    expect(playerDamage({ baseDamage: 8, offense: 10, defense: 7, elementMult: 1, critMult: 1 })).toBe(11);
    expect(playerDamage({ baseDamage: 10, offense: 10, defense: 7, elementMult: 1.5, critMult: 2 })).toBe(39);
    expect(playerDamage({ baseDamage: 10, offense: 10, defense: 7, elementMult: 0.75, critMult: 1 })).toBe(9);
  });

  it('jogador: dano mínimo de quem acerta é 1', () => {
    expect(playerDamage({ baseDamage: 1, offense: 0, defense: 50, elementMult: 1, critMult: 1 })).toBe(1);
  });

  it('jogador: perfuração ignora parte da defesa', () => {
    // 8 + 13 − 10 × 0.7 = 14
    expect(
      playerDamage({ baseDamage: 8, offense: 13, defense: 10, defensePierce: 0.3, elementMult: 1, critMult: 1 }),
    ).toBe(14);
  });

  it('resistência do jogador = ofensivo / 2 + diferencial', () => {
    expect(playerResistance(10, 1, 2)).toBe(6);
    expect(playerResistance(15, 1, 2)).toBe(8);
    expect(playerResistance(0, 1, 2)).toBe(1);
  });

  it('vilão: base × elemento × crítico − resistência, mínimo 1', () => {
    const base = { playerOffense: 10, resistanceBonus: 1, offenseDivisor: 2, elementMult: 1, critMult: 1 };
    expect(villainDamage({ ...base, baseDamage: 14 })).toBe(8);
    expect(villainDamage({ ...base, baseDamage: 14, critMult: 2 })).toBe(22);
    expect(villainDamage({ ...base, baseDamage: 14, elementMult: 1.5 })).toBe(15);
    expect(villainDamage({ ...base, baseDamage: 3 })).toBe(1);
  });
});
