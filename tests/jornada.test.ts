import { describe, expect, it } from 'vitest';
import {
  advance,
  awaitingPlayer,
  current,
  emptyMods,
  enemySeed,
  hitDamage,
  playerAct,
  startBattle,
  useItem,
  type BattleSetup,
  type FighterSeed,
} from '../src/core/jornada/battle';
import { checkSequence, jokenpo, memoryDeck, sealSequence } from '../src/core/jornada/minigames';
import {
  battleSetup,
  buy,
  buyTalent,
  chooseBossRelic,
  currentStop,
  finishFight,
  heroMovable,
  leaveStop,
  memberSheet,
  newRun,
  resolveEvent,
  rest,
  setMoveset,
  shopOffer,
  HERO,
  type JRun,
} from '../src/core/jornada/run';
import { talentState } from '../src/core/jornada/talents';
import { isFight } from '../src/core/jornada/trail';
import type { JBattle } from '../src/core/jornada/types';
import { createRng } from '../src/core/rng';
import { jornadaData as data } from '../src/data/jornada';
import { loadJornada, saveJornada, JORNADA_SAVE_KEY } from '../src/state/jornadaSave';

/** Rng que devolve sempre o mesmo valor (0 = acerta tudo e dispara todo efeito; 0,99 = erra). */
const fixed = (v: number) => () => v;

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
    techniques: ['jStrike', 'jShuriken', 'jKageBunshin'],
    ai: 'striker',
    mods: emptyMods(),
    ...over,
  };
}

function dummy(over: Partial<FighterSeed> = {}): FighterSeed {
  return { ...hero(), defId: 'gatoThug', protagonist: false, speed: 1, techniques: ['jeClub'], ai: 'brute', ...over };
}

const setup = (over: Partial<BattleSetup> = {}): BattleSetup => ({ allies: [hero()], enemies: [dummy()], win: { kind: 'defeatAll' }, ...over });

describe('combate de equipe da Jornada', () => {
  it('para na vez do protagonista e o mais rápido age primeiro', () => {
    const b = startBattle(setup(), data, fixed(0.5));
    expect(awaitingPlayer(b)).toBe(true);
    expect(current(b)!.uid).toBe('a0');
    expect(b.order).toEqual(['a0', 'e0']);
  });

  it('o dano segue a fórmula base: base + ataque − resistência × fração', () => {
    const b = startBattle(setup(), data, fixed(0.5));
    const me = b.fighters[0]!;
    const foe = b.fighters[1]!;
    // 8 + 10 − 6 × 0,5 = 15
    expect(hitDamage(me, foe, data.techniques.jStrike!, data)).toBe(15);
    const next = playerAct(b, { kind: 'tech', techId: 'jStrike', target: 'e0' }, data, fixed(0.5));
    expect(next.log.some((e) => e.type === 'damage' && e.target === 'e0' && e.amount === 15)).toBe(true);
  });

  it('elemento da técnica contra o elemento do alvo muda o dano', () => {
    const b = startBattle(setup({ allies: [hero({ techniques: ['jFireball'] })], enemies: [dummy({ element: 'wind' })] }), data, fixed(0.5));
    const base = hitDamage(b.fighters[0]!, { ...b.fighters[1]!, element: null }, data.techniques.jFireball!, data);
    const strong = hitDamage(b.fighters[0]!, b.fighters[1]!, data.techniques.jFireball!, data);
    expect(strong).toBe(Math.floor((16 + 10 - 3) * data.j.combat.elementAdvantage));
    expect(strong).toBeGreaterThan(base);
  });

  it('postura defensiva usa a resistência inteira', () => {
    const b = startBattle(setup(), data, fixed(0.5));
    const foe = { ...b.fighters[1]!, guarding: true };
    expect(hitDamage(b.fighters[0]!, foe, data.techniques.jStrike!, data)).toBe(8 + 10 - 6);
  });

  it('clones podem receber o golpe no lugar de quem os criou', () => {
    const b = startBattle(setup({ enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.5));
    const withClones = { ...b, fighters: b.fighters.map((f) => (f.uid === 'e0' ? { ...f, clones: 2 } : f)) } as JBattle;
    const next = playerAct(withClones, { kind: 'tech', techId: 'jStrike', target: 'e0' }, data, fixed(0.1));
    expect(next.log.some((e) => e.type === 'cloneBlock')).toBe(true);
  });

  it('item não gasta o turno, mas é um por turno', () => {
    let b = startBattle(setup({ allies: [hero({ hp: 40 })] }), data, fixed(0.5));
    b = useItem(b, 'hpKit', 'a0', data);
    expect(b.fighters[0]!.hp).toBe(40 + Math.floor(100 * data.j.combat.hpKitPct));
    expect(awaitingPlayer(b)).toBe(true);
    expect(() => useItem(b, 'chakraKit', 'a0', data)).toThrow();
  });

  it('levantar um aliado caído gasta o turno e devolve metade do HP', () => {
    const ally = { ...dummy(), defId: 'sakura', speed: 2, techniques: ['jKunai'], ai: 'tactician' as const, hp: 0 };
    let b = startBattle(setup({ allies: [hero(), ally], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.5));
    expect(b.fighters[1]!.down).toBe(true);
    b = playerAct(b, { kind: 'revive', target: 'a1' }, data, fixed(0.5));
    expect(b.log.some((e) => e.type === 'revive' && e.target === 'a1' && e.hp === 50)).toBe(true);
  });

  it('o protagonista caído é derrota, mesmo com aliados de pé', () => {
    const ally = { ...dummy(), defId: 'sakura', speed: 2, techniques: ['jKunai'], ai: 'tactician' as const };
    const killer = dummy({ speed: 99, techniques: ['jeCleaver'], offense: { taijutsu: 200, ninjutsu: 0, genjutsu: 0 } });
    const b = startBattle(setup({ allies: [hero({ hp: 5 }), ally], enemies: [killer] }), data, fixed(0));
    expect(b.status).toBe('lost');
  });

  it('atordoado perde a vez', () => {
    const stunner = dummy({ speed: 99, techniques: ['jeWaterPrison'], chakra: 30, maxChakra: 30 });
    const b = startBattle(setup({ enemies: [stunner] }), data, fixed(0));
    // A prisão de água acerta (rng 0) e atordoa por 2 turnos: o protagonista não age nesta rodada.
    expect(b.log.some((e) => e.type === 'effect' && e.effect === 'stun' && e.target === 'a0')).toBe(true);
    expect(b.log.some((e) => e.type === 'skip' && e.uid === 'a0')).toBe(true);
  });

  it('o sino do Kakashi: levar o HP dele à metade vence a luta', () => {
    const kakashi = { ...enemySeed('kakashi', 'normal', data), hp: 60 };
    const b0 = startBattle(
      setup({ allies: [hero({ offense: { taijutsu: 40, ninjutsu: 10, genjutsu: 5 } })], enemies: [kakashi], win: { kind: 'hpThreshold', target: 'kakashi', pct: 0.5 } }),
      data,
      fixed(0.5),
    );
    const b = playerAct(b0, { kind: 'tech', techId: 'jStrike', target: 'e0' }, data, fixed(0.5));
    expect(b.status).toBe('won');
  });

  it('aguentar as rodadas vence a luta do hospital', () => {
    let b = startBattle(setup({ enemies: [dummy({ hp: 9999, maxHp: 9999 })], win: { kind: 'survive', rounds: 2, target: 'gatoThug', pct: 0.1 } }), data, fixed(0.99));
    for (let i = 0; i < 5 && b.status === 'ongoing'; i++) b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    expect(b.status).toBe('won');
    expect(b.round).toBe(3);
  });

  it('a mesma seed dá a mesma luta', () => {
    const run = newRun(42, 'normal', data);
    const a = advance(startBattle(battleSetup(run, data), data, createRng(5)), data, createRng(5));
    const b = advance(startBattle(battleSetup(run, data), data, createRng(5)), data, createRng(5));
    expect(a.log).toEqual(b.log);
  });
});

describe('trilha da run canônica', () => {
  it('três estágios, cada um termina no chefe, com os confrontos do mangá na ordem', () => {
    expect(data.stages.map((s) => s.stops.at(-1)!.kind)).toEqual(['boss', 'boss', 'boss']);
    const story = data.stages.map((s) => s.stops.filter((x) => x.kind === 'story' || x.kind === 'boss').map((x) => x.id));
    expect(story).toEqual([
      ['mizuki', 'bells', 'haku'],
      ['forest', 'kiba', 'neji', 'gaara'],
      ['tanzaku', 'kabuto', 'hospital', 'kimimaro', 'valley'],
    ]);
  });

  it('toda parada aponta para dados que existem', () => {
    for (const stage of data.stages) {
      for (const id of stage.team) expect(data.characters[id], id).toBeDefined();
      for (const stop of stage.stops) {
        if (isFight(stop)) {
          for (const e of stop.enemies) expect(data.enemies[e], e).toBeDefined();
          for (const t of stop.team ?? []) expect(data.characters[t], t).toBeDefined();
        }
        if (stop.kind === 'event') expect(data.events[stop.event], stop.event).toBeDefined();
      }
    }
    for (const c of Object.values(data.characters)) for (const t of c.techniques) expect(data.techniques[t], t).toBeDefined();
    for (const e of Object.values(data.enemies)) for (const t of e.techniques) expect(data.techniques[t], t).toBeDefined();
    for (const n of data.talents) if (n.learn) expect(data.techniques[n.learn], n.learn).toBeDefined();
  });

  it('o Naruto enfrenta o Mizuki sozinho e o Kakashi com a Equipe 7', () => {
    const run = newRun(1, 'normal', data);
    expect(battleSetup(run, data).allies.map((a) => a.defId)).toEqual(['naruto']);
    const bells = { ...run, stopIndex: 2 };
    expect(battleSetup(bells, data).allies.map((a) => a.defId)).toEqual(['naruto', 'sasuke', 'sakura']);
  });
});

describe('run da Jornada', () => {
  const won = (b: JBattle): JBattle => ({ ...b, status: 'won' });
  const lost = (b: JBattle): JBattle => ({ ...b, status: 'lost' });

  it('vencer dá ryō, XP e avança a parada', () => {
    const run = newRun(1, 'normal', data);
    const b = startBattle(battleSetup(run, data), data, createRng(1));
    const { run: next, outcome } = finishFight(run, won(b), data);
    expect(outcome.ryo).toBe(data.j.rewards.story.ryo);
    expect(next.ryo).toBe(data.j.rewards.story.ryo);
    expect(next.stopIndex).toBe(1);
    expect(next.cleared).toEqual(['mizuki']);
  });

  it('perder acaba a run; no Fácil a Vontade do Fogo recomeça a luta', () => {
    const normal = newRun(1, 'normal', data);
    expect(finishFight(normal, lost(startBattle(battleSetup(normal, data), data, createRng(1))), data).run.status).toBe('defeat');
    const easy = newRun(1, 'easy', data);
    const res = finishFight(easy, lost(startBattle(battleSetup(easy, data), data, createRng(1))), data);
    expect(res.outcome.retry).toBe(true);
    expect(res.run.status).toBe('inProgress');
    expect(res.run.willOfFire).toBe(0);
    expect(res.run.stopIndex).toBe(0);
  });

  it('subir de nível dá ponto de talento', () => {
    const run = { ...newRun(1, 'normal', data), xp: data.j.xp.base - 1 };
    const { run: next, outcome } = finishFight(run, won(startBattle(battleSetup(run, data), data, createRng(1))), data);
    expect(outcome.levelUps).toBe(1);
    expect(next.level).toBe(2);
    expect(next.talentPoints).toBe(data.j.rewards.story.talent + 1);
    expect(memberSheet(next, HERO, data).maxHp).toBeGreaterThan(memberSheet(run, HERO, data).maxHp);
  });

  it('o chefe oferece 3 lendárias e a escolha avança', () => {
    const run = { ...newRun(1, 'normal', data), stopIndex: data.stages[0]!.stops.length - 1 };
    const { run: next } = finishFight(run, won(startBattle(battleSetup(run, data), data, createRng(1))), data);
    expect(next.bossChoice).toHaveLength(3);
    for (const id of next.bossChoice!) expect(data.relics.find((r) => r.id === id)!.tier).toBe('legendary');
    const after = chooseBossRelic(next, next.bossChoice![0]!, data);
    expect(after.relics).toContain(next.bossChoice![0]);
    expect([after.stageIndex, after.stopIndex]).toEqual([1, 0]);
  });

  it('a árvore pede o nó anterior, o estágio e, na Ōdama, a conquista da conta', () => {
    const run = { ...newRun(1, 'normal', data), talentPoints: 20 };
    const node = (id: string) => data.talents.find((t) => t.id === id)!;
    const none = new Set<string>();
    const ctx = { owned: run.talents, points: 20, stageIndex: 0, unlocked: none };
    expect(talentState(node('tMoreClones'), data.talents, ctx)).toBe('available');
    expect(talentState(node('tRendan'), data.talents, ctx)).toBe('locked');
    expect(talentState(node('tKyuubiRegen'), data.talents, ctx)).toBe('stageLocked');
    expect(talentState(node('tOdama'), data.talents, { ...ctx, stageIndex: 2 })).toBe('accountLocked');
    const bought = buyTalent(buyTalent(run, 'tMoreClones', none, data), 'tRendan', none, data);
    expect(bought.learned).toContain('jRendan');
    expect(bought.talentPoints).toBe(17);
  });

  it('moveset de até 4 técnicas, só com as que o Naruto conhece', () => {
    const run = newRun(1, 'normal', data);
    expect(heroMovable(run, data)).not.toContain('jKageBunshin');
    expect(() => setMoveset(run, ['jStrike', 'jRasengan'], data)).toThrow();
    expect(setMoveset(run, ['jStrike'], data).moveset).toEqual(['jStrike']);
  });

  it('mercador, descanso e evento', () => {
    let run: JRun = { ...newRun(1, 'normal', data), ryo: 500, stopIndex: 6 };
    expect(currentStop(run, data)!.kind).toBe('shop');
    const offer = shopOffer(run, data);
    expect(offer.relics).toHaveLength(data.j.shop.relics);
    run = buy(run, { kind: 'training', price: offer.training }, data);
    expect(run.talentPoints).toBe(1);
    run = leaveStop(run, data);
    expect(currentStop(run, data)!.id).toBe('zabuza');
    const resting = rest({ ...run, stopIndex: 11 }, 'train', data);
    expect(resting.talentPoints).toBe(2);
    const tazuna = resolveEvent({ ...newRun(1, 'normal', data), stopIndex: 4 }, 'protect', false, data).run;
    expect(tazuna.flags).toContain('helpedTazuna');
    expect(shopOffer({ ...tazuna, stopIndex: 6 }, data).training).toBe(Math.floor(data.j.shop.trainingPrice * 0.8));
  });

  it('salva e carrega a run', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const run = { ...newRun(7, 'hard', data), ryo: 33 };
    saveJornada(storage, run);
    expect(loadJornada(storage)).toEqual(run);
    saveJornada(storage, { ...run, status: 'victory' });
    expect(mem.get(JORNADA_SAVE_KEY)).toBe('');
    expect(loadJornada(storage)).toBeNull();
  });
});

describe('minijogos', () => {
  it('memória tem cada selo duas vezes', () => {
    const deck = memoryDeck(6, createRng(1));
    expect(deck).toHaveLength(12);
    for (const s of new Set(deck)) expect(deck.filter((x) => x === s)).toHaveLength(2);
  });

  it('sequência de selos confere erro e fim', () => {
    const { sequence } = sealSequence(4, 6, createRng(2));
    expect(checkSequence(sequence, sequence.slice(0, 2))).toBe('ok');
    expect(checkSequence(sequence, sequence)).toBe('done');
    const wrong = sequence[0] === 'rat' ? 'ox' : 'rat';
    expect(checkSequence(sequence, [wrong])).toBe('wrong');
  });

  it('jokenpô', () => {
    expect(jokenpo('rock', fixed(0)).result).toBe('tie');
    expect(jokenpo('paper', fixed(0)).result).toBe('win');
    expect(jokenpo('scissors', fixed(0)).result).toBe('lose');
  });
});
