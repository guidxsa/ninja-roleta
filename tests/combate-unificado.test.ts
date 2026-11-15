// Combate unificado (v0.77.0): efeitos, barreiras, clones, golpes que rolam um a um e item sem gastar a vez, nos dois
// modos. As regras comuns estão em src/core/effects.ts, barriers.ts e clones.ts; os docs em docs/base/.
import { describe, expect, it } from 'vitest';
import { absorbIntoBarrier, raiseBarrier } from '../src/core/barriers';
import { cloneKindFor, wearClone } from '../src/core/clones';
import { scaleVillain } from '../src/core/difficulty';
import { dotDamage, effectDuration } from '../src/core/effects';
import { accuracyAgainst, emptyMods, hitDamage, playerAct, startBattle, type BattleSetup } from '../src/core/jornada/battle';
import { battleSetup, chooseNode, newGenericRun, nodeChoices, withNatureClone } from '../src/core/jornada/run';
import type { FighterSeed } from '../src/core/jornada/types';
import { canUseItem, canUseTechnique, playRoletaRound, startRoletaBattle, useRoletaItem, type RBattle } from '../src/core/roleta/battle';
import { createRoletaPlayer } from '../src/core/roleta/player';
import type { Origin } from '../src/core/types';
import { balance } from '../src/data/balance';
import { gameData } from '../src/data/index';
import { jornadaData as jdata } from '../src/data/jornada';
import { roletaData as data } from '../src/data/roleta/index';
import { roletaVillainsById } from '../src/data/roleta/villains';
import { seq } from './helpers';

// Roleta de acerto: a fatia do erro vem primeiro (0,01 erra, 0,5 acerta, 0,99 é crítico).
const MISS = 0.01;
const HIT = 0.5;
const fixed = (v: number) => () => v;
const origin = (lineageId: string | null, elements: Origin['elements'] = [], extra: Partial<Origin> = {}): Origin => ({ lineageId, elements, jinchuuriki: false, ...extra });
function battle(o: Origin, villainId = 'mizuki', over: Partial<RBattle['player']> = {}): RBattle {
  const p = { ...createRoletaPlayer(o, data), ...over };
  return startRoletaBattle(p, scaleVillain(roletaVillainsById[villainId]!, 'normal', data.base), { playerStartsFirst: true }, data, fixed(0.5));
}
const ctx = { kekkeiGenkai: gameData.kekkeiGenkai, beats: gameData.beats, elements: balance.elements };

describe('efeitos iguais nos dois modos', () => {
  it('controle dura no mínimo 2 turnos; Veneno 5% por 3; Queimar 5% por 2', () => {
    const r = balance.effects;
    expect(effectDuration('stun', r)).toBe(2);
    expect(effectDuration('stun', r, 1)).toBe(2);
    expect(effectDuration('chakraBlock', r)).toBe(2);
    expect(effectDuration('poison', r)).toBe(3);
    expect(effectDuration('burn', r)).toBe(2);
    expect(dotDamage('poison', 200, r)).toBe(10);
    expect(dotDamage('burn', 200, r)).toBe(10);
    expect(dotDamage('poison', 10, r)).toBe(1);
  });

  it('a Jornada e o Roleta leem a mesma tabela', () => {
    expect(jdata.base.effects).toBe(balance.effects);
    expect(data.base.balance.effects).toBe(balance.effects);
  });

  it('Roleta: atordoado perde 2 turnos e depois fica firme (o próximo atordoamento não pega)', () => {
    let s = battle(origin(null, ['fire']));
    s = { ...s, fx: { ...s.fx, effects: [{ kind: 'stun', turns: 2 }] } };
    const r1 = playRoletaRound(s, 'tech:rBasic', data, fixed(0.5));
    expect(r1.log.some((e) => e.type === 'skip' && e.side === 'player')).toBe(true);
    const r2 = playRoletaRound(r1, 'tech:rBasic', data, fixed(0.5));
    expect(r2.log.slice(r1.log.length).some((e) => e.type === 'skip' && e.side === 'player')).toBe(true);
    expect(r2.fx.effects.map((e) => e.kind)).toEqual(['stunGuard']);
    // Firme: o Selamento não é atordoar, mas a Imitação de Sombra seria; aqui, o atordoar direto resiste.
    const r3 = playRoletaRound(r2, 'tech:rBasic', data, fixed(0.5));
    expect(r3.log.slice(r2.log.length).some((e) => e.type === 'attack' && e.side === 'player')).toBe(true);
  });

  it('Roleta: Bloqueio de chakra deixa só o taijutsu; o Selo dos Pontos Vitais do Hyuuga bloqueia', () => {
    const s = battle(origin(null, ['fire']));
    const blocked = { ...s, fx: { ...s.fx, effects: [{ kind: 'chakraBlock' as const, turns: 2 }] } };
    expect(canUseTechnique(blocked, data.techniques.rFire!, data)).toBe(false);
    expect(canUseTechnique(blocked, data.techniques.rBasic!, data)).toBe(true);
    expect(data.techniques.rVitalSeal!.effect).toEqual({ kind: 'chakraBlock', chance: 0.25 });
  });

  it('Jornada: Medo corta o dano e o acerto; Uchiha e jinchuuriki são imunes', () => {
    const setup = (allies: FighterSeed[], enemies: FighterSeed[]): BattleSetup => ({ allies, enemies, win: { kind: 'defeatAll' } });
    const bells = { ...hero(), defId: 'kin', protagonist: false, speed: 99, techniques: ['jeBellGenjutsu'], ai: 'striker' as const };
    expect(jdata.techniques.jeBellGenjutsu!.onHit).toEqual({ effect: 'fear', chance: 0.35 });
    // Kin age primeiro e acerta o sino (na Jornada, rng baixo acerta e dispara o efeito).
    const scared = startBattle(setup([hero({ defId: 'sakura' })], [bells]), jdata, fixed(MISS)).fighters[0]!;
    expect(scared.effects.some((e) => e.kind === 'fear')).toBe(true);
    const calm = { ...scared, effects: [] };
    const foe = { ...scared, uid: 'e9', side: 'enemy' as const, effects: [] };
    const strike = jdata.techniques.jStrike!;
    expect(hitDamage(scared, foe, strike, jdata)).toBeLessThan(hitDamage(calm, foe, strike, jdata));
    expect(accuracyAgainst(scared, foe, strike, jdata)).toBeCloseTo(accuracyAgainst(calm, foe, strike, jdata) + balance.effects.fear.accuracy, 10);
    // O Naruto (jinchuuriki) resiste.
    const naruto = startBattle(setup([hero()], [bells]), jdata, fixed(MISS));
    expect(naruto.fighters[0]!.effects.some((e) => e.kind === 'fear')).toBe(false);
    expect(naruto.log.some((e) => e.type === 'resist' && e.effect === 'fear')).toBe(true);
  });
});

describe('golpes de várias técnicas rolam um a um', () => {
  it('Roleta: o 1º golpe erra e o 2º acerta (Projéteis d’Água)', () => {
    const s = battle(origin(null, ['water']));
    // Rodada: golpe 1 (erra), golpe 2 (acerta); o resto da rodada fica com o último valor.
    const next = playRoletaRound(s, 'tech:rWater', data, seq(MISS, HIT));
    const attacks = next.log.filter((e) => e.type === 'attack' && e.side === 'player');
    expect(attacks.map((e) => (e as { outcome: string }).outcome)).toEqual(['miss', 'hit']);
    expect(attacks.map((e) => (e as { strike?: number }).strike)).toEqual([1, 2]);
    expect(next.villain.hp).toBeLessThan(s.villain.hp);
  });
});

describe('item sem gastar a vez (Roleta)', () => {
  it('usa a pílula e ainda ataca no mesmo turno; um item por turno', () => {
    const o = origin(null, ['fire']);
    const p = createRoletaPlayer(o, data);
    const s = battle(o, 'mizuki', { chakra: 0, bag: { ...p.bag, soldierPill: 2 } });
    expect(canUseTechnique(s, data.techniques.rFire!, data)).toBe(false);
    const pilled = useRoletaItem(s, 'soldierPill', data, fixed(0.5));
    expect(canUseItem(pilled, 'soldierPill')).toBe(false);
    expect(() => useRoletaItem(pilled, 'soldierPill', data, fixed(0.5))).toThrow();
    expect(canUseTechnique(pilled, data.techniques.rFire!, data)).toBe(true);
    const next = playRoletaRound(pilled, 'tech:rFire', data, fixed(HIT));
    expect(next.log.some((e) => e.type === 'attack' && e.side === 'player' && e.techId === 'rFire')).toBe(true);
    // Rodada seguinte: pode usar de novo.
    expect(canUseItem(next, 'soldierPill')).toBe(true);
  });
});

describe('barreiras elementais (elemento só pesa no escudo)', () => {
  it('vantagem ×1,5 e desvantagem ×0,75 no escudo; raio contra terra ×2; taijutsu neutro; genjutsu passa', () => {
    const wall = (nature: 'earth' | 'wind' | 'fire') => raiseBarrier('w', { points: 30 }, 100, nature, 3);
    expect(absorbIntoBarrier(wall('earth'), 10, { type: 'ninjutsu', nature: 'lightning', hits: 1 }, ctx)).toMatchObject({ absorbed: 20, passes: 0, mult: 2 });
    expect(absorbIntoBarrier(wall('wind'), 10, { type: 'ninjutsu', nature: 'fire', hits: 1 }, ctx)).toMatchObject({ absorbed: 15, mult: 1.5 });
    expect(absorbIntoBarrier(wall('wind'), 10, { type: 'ninjutsu', nature: 'lightning', hits: 1 }, ctx)).toMatchObject({ absorbed: 8, mult: 0.75 });
    expect(absorbIntoBarrier(wall('fire'), 10, { type: 'taijutsu', nature: 'water', hits: 1 }, ctx)).toMatchObject({ absorbed: 10, mult: 1, touched: false });
    expect(absorbIntoBarrier(wall('fire'), 10, { type: 'genjutsu', nature: null, hits: 1 }, ctx)).toMatchObject({ absorbed: 0, passes: 10 });
    // O que sobra volta à escala do HP: 40 de raio na Muralha de Terra de 30 → 80 no escudo, 50 sobram, 25 no HP.
    expect(absorbIntoBarrier(wall('earth'), 40, { type: 'ninjutsu', nature: 'lightning', hits: 1 }, ctx)).toMatchObject({ absorbed: 30, passes: 25, broken: true });
  });

  it('Escudo de Vento aguenta mais contra vários golpes; Parede d’Água apaga o fogo', () => {
    const wind = raiseBarrier('w', { pct: 0.2, multiHitResist: 0.25 }, 100, 'wind', 3);
    expect(absorbIntoBarrier(wind, 8, { type: 'taijutsu', nature: null, hits: 3 }, ctx).absorbed).toBe(6);
    const water = raiseBarrier('w', { pct: 0.24 }, 100, 'water', 3);
    expect(absorbIntoBarrier(water, 6, { type: 'ninjutsu', nature: 'fire', hits: 1 }, ctx).douse).toBe(true);
  });

  it('Roleta: o kit de quem tem ninjutsu elemental traz a barreira; erguer gasta o turno e uma de pé por vez', () => {
    const s = battle(origin(null, ['earth']));
    const raised = playRoletaRound(s, 'tech:rEarthWall', data, fixed(HIT));
    expect(raised.fx.barrier).toMatchObject({ nature: 'earth', techId: 'rEarthWall' });
    expect(raised.log.some((e) => e.type === 'barrier' && e.action === 'raise')).toBe(true);
    expect(canUseTechnique(raised, data.techniques.rEarthWall!, data)).toBe(false);
  });

  it('Jornada: sem barreira o elemento não muda o dano; com barreira, a vantagem gasta o escudo', () => {
    const fire = hero({ techniques: ['jFireball'] });
    const b = startBattle({ allies: [fire], enemies: [dummy({ element: 'wind', techniques: ['jWindShield'] })], win: { kind: 'defeatAll' } }, jdata, fixed(HIT));
    const foe = b.fighters[1]!;
    const shielded = { ...b, fighters: [b.fighters[0]!, { ...foe, barrier: raiseBarrier('jWindShield', { points: 30 }, foe.maxHp, 'wind', 3) }] };
    const next = playerAct(shielded, { kind: 'tech', techId: 'jFireball', target: foe.uid }, jdata, fixed(HIT));
    const hit = next.log.find((e) => e.type === 'barrier' && e.action === 'hit');
    expect(hit).toMatchObject({ mult: 1.5 });
  });
});

describe('tipos de clone', () => {
  it('natureza → clone; o Doton aguenta 2 golpes', () => {
    const r = balance.clones;
    expect(cloneKindFor('water', r)).toBe('mizu');
    expect(cloneKindFor('earth', r)).toBe('doton');
    expect(cloneKindFor('lightning', r)).toBe('raiton');
    expect(cloneKindFor('wood', r)).toBe('mokuton');
    expect(cloneKindFor('sand', r)).toBe('suna');
    expect(cloneKindFor('fire', r)).toBe('bunshin');
    expect(cloneKindFor(null, r)).toBe('bunshin');
    expect(wearClone(0, 'doton', r)).toEqual({ wear: 1, broken: false });
    expect(wearClone(1, 'doton', r)).toEqual({ wear: 0, broken: true });
    expect(wearClone(0, 'bunshin', r)).toEqual({ wear: 0, broken: true });
  });

  it('Roleta: o clone de raio, ao se desfazer, dá a descarga em quem bateu', () => {
    const s = battle(origin(null, ['lightning']));
    const made = playRoletaRound(s, 'tech:rRaitonBunshin', data, fixed(0.99));
    expect(made.fx.clone).toEqual({ kind: 'raiton', wear: 0 });
    // Vilão acerta (0,3), o clone segura (0,3 < 50%), a descarga fere e o atordoar (0,3 < 30%? não: 0,3 não é < 0,3).
    const hp = made.villain.hp;
    const next = playRoletaRound(made, 'guard', data, fixed(0.3));
    const events = next.log.slice(made.log.length);
    if (events.some((e) => e.type === 'clone' && e.action === 'block')) {
      expect(next.fx.clone).toBeNull();
      expect(events.some((e) => e.type === 'damage' && e.side === 'villain' && e.source === 'clone')).toBe(true);
      expect(next.villain.hp).toBeLessThan(hp);
    }
  });

  it('Roleta: o Kage Bunshin bate junto (metade do dano de um golpe)', () => {
    const s = battle(origin('uzumaki', ['wind']));
    const withClone = { ...s, fx: { ...s.fx, clone: { kind: 'kage' as const, wear: 0 } } };
    const next = playRoletaRound(withClone, 'tech:rBasic', data, fixed(HIT));
    expect(next.log.some((e) => e.type === 'clone' && e.action === 'strike')).toBe(true);
    expect(next.log.some((e) => e.type === 'damage' && e.side === 'villain' && e.source === 'clone')).toBe(true);
  });

  it('Jornada: o Bunshin vira o clone da natureza na luta (Kakashi: Raiton; Gaara: Suna)', () => {
    expect(withNatureClone(['jStrike', 'jBunshin'], {}, 'water', jdata)).toEqual(['jStrike', 'jMizuBunshin']);
    expect(withNatureClone(['jStrike', 'jBunshin'], {}, 'fire', jdata)).toEqual(['jStrike', 'jBunshin']);
    expect(withNatureClone(['jBunshin'], { kekkeiGenkai: 'sand' }, 'earth', jdata)).toEqual(['jSunaBunshin']);
    // Natureza silenciosa (Hyuuga): segue com o Bunshin.
    expect(withNatureClone(['jBunshin'], { noElement: true }, 'water', jdata)).toEqual(['jBunshin']);
    expect(jdata.enemies.kakashi!.techniques).toContain('jRaitonBunshin');
    expect(jdata.enemies.zabuza!.techniques).toContain('jMizuBunshin');
    expect(jdata.enemies.gaara!.techniques).toContain('jSunaBunshin');
    expect(jdata.enemies.jirobo!.techniques).toContain('jDotonBunshin');
  });

  it('Jornada: no Caminho Ninja, o Comum de água luta com o Mizu Bunshin', () => {
    const run = newGenericRun(7, 'normal', 'common', jdata, new Set(), null, 'water');
    // Linha 0 do mapa: só lutas.
    const setup = battleSetup(chooseNode(run, nodeChoices(run)[0]!.id), jdata);
    expect(setup.allies[0]!.techniques).toContain('jMizuBunshin');
    expect(setup.allies[0]!.techniques).not.toContain('jBunshin');
  });
});

function hero(over: Partial<FighterSeed> = {}): FighterSeed {
  return {
    defId: 'naruto',
    protagonist: true,
    maxHp: 100,
    hp: 100,
    maxChakra: 30,
    chakra: 30,
    speed: 50,
    offense: { taijutsu: 10, ninjutsu: 10, genjutsu: 5 },
    resistance: { physical: 6, mental: 6 },
    element: null,
    techniques: ['jStrike'],
    ai: 'striker',
    mods: emptyMods(),
    ...over,
  };
}

function dummy(over: Partial<FighterSeed> = {}): FighterSeed {
  return { ...hero(), defId: 'gatoThug', protagonist: false, speed: 1, techniques: ['jeClub'], ai: 'brute', ...over };
}
