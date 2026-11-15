// Auditoria de balanceamento (src/sim/audit.ts): os indicadores batem com o log da luta.
import { describe, expect, it } from 'vitest';
import { emptyMods, openBattle, playerAct, startBattle } from '../src/core/jornada/battle';
import type { FighterSeed } from '../src/core/jornada/types';
import { scaleVillain } from '../src/core/difficulty';
import { createRoletaPlayer } from '../src/core/roleta/player';
import { playRoletaRound, startRoletaBattle } from '../src/core/roleta/battle';
import { createRng } from '../src/core/rng';
import { jornadaData } from '../src/data/jornada';
import { roletaData } from '../src/data/roleta/index';
import { roletaVillainsById } from '../src/data/roleta/villains';
import { auditJornadaFight, auditRoletaFight, Tally } from '../src/sim/audit';

const hero = (over: Partial<FighterSeed> = {}): FighterSeed => ({
  defId: 'naruto',
  protagonist: true,
  maxHp: 100,
  hp: 60,
  maxChakra: 30,
  chakra: 15,
  speed: 50,
  offense: { taijutsu: 10, ninjutsu: 10, genjutsu: 5 },
  resistance: { physical: 6, mental: 6 },
  element: null,
  techniques: ['jStrike'],
  ai: 'striker',
  mods: emptyMods(),
  ...over,
});

describe('auditoria de luta', () => {
  it('Jornada: entrada, rodadas e dano somados do log', () => {
    const setup = { allies: [hero()], enemies: [{ ...hero(), defId: 'gatoThug', protagonist: false, hp: 100, speed: 1, techniques: ['jeClub'], ai: 'brute' as const }], win: { kind: 'defeatAll' as const } };
    const rng = createRng(3);
    const start = openBattle(setup, jornadaData);
    let b = startBattle(setup, jornadaData, rng);
    for (let i = 0; i < 50 && b.status === 'ongoing'; i++) b = playerAct(b, { kind: 'tech', techId: 'jStrike', target: 'e0' }, jornadaData, rng);
    const a = auditJornadaFight(start, b);
    expect(a.hpPct).toBeCloseTo(0.6, 10);
    expect(a.chakraPct).toBeCloseTo(0.5, 10);
    expect(a.rounds).toBe(b.round);
    const dealt = b.log.reduce((s, e) => s + (e.type === 'damage' && e.target === 'e0' ? e.amount : 0), 0);
    expect(a.dealt).toBe(dealt);
    expect(a.won).toBe(b.status === 'won');
  });

  it('Roleta: entrada e dano dos dois lados', () => {
    const p = createRoletaPlayer({ lineageId: null, elements: ['fire'], jinchuuriki: false }, roletaData);
    const v = scaleVillain(roletaVillainsById.mizuki!, 'normal', roletaData.base);
    const rng = createRng(5);
    const start = startRoletaBattle({ ...p, hp: Math.floor(p.maxHp / 2) }, v, {}, roletaData, rng);
    let s = start;
    for (let i = 0; i < 60 && s.status === 'ongoing'; i++) s = playRoletaRound(s, 'tech:rBasic', roletaData, rng);
    const a = auditRoletaFight(start, s);
    expect(a.hpPct).toBeCloseTo(Math.floor(p.maxHp / 2) / p.maxHp, 10);
    expect(a.rounds).toBe(s.round);
    expect(a.taken).toBe(s.log.reduce((x, e) => x + (e.type === 'damage' && e.side === 'player' ? e.amount : 0), 0));
  });

  it('Tally tira médias e totais', () => {
    const t = new Tally();
    t.add('x', 2);
    t.add('x', 4);
    expect(t.mean('x')).toBe(3);
    expect(t.sum('x')).toBe(6);
    expect(t.count('x')).toBe(2);
    expect(t.mean('nada')).toBe(0);
  });
});
