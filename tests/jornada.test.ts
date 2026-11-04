import { readFileSync } from 'node:fs';
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
import { eventOptions } from '../src/core/jornada/events';
import { generateMap, reachable, reachableFrom } from '../src/core/jornada/map';
import { checkSequence, jokenpo, memoryDeck, sealSequence } from '../src/core/jornada/minigames';
import { newJornadaAchievements } from '../src/data/jornada/achievements';
import {
  bagFull,
  battleSetup,
  buy,
  buyTalent,
  chooseBossRelic,
  chooseNode,
  choosingNode,
  currentStop,
  finishFight,
  gainRelic,
  heroMods,
  heroMovable,
  leaveStop,
  memberSheet,
  newGenericRun,
  newRun,
  nextFightTeam,
  nodeChoices,
  resolveEvent,
  rest,
  restHealPct,
  setMoveset,
  shopOffer,
  talentContext,
  teamMods,
  HERO,
  type JRun,
} from '../src/core/jornada/run';
import { talentState } from '../src/core/jornada/talents';
import { isFight } from '../src/core/jornada/trail';
import type { JBattle } from '../src/core/jornada/types';
import { createRng } from '../src/core/rng';
import { jornadaData as data } from '../src/data/jornada';
import { loadJornada, saveJornada, JORNADA_SAVE_KEY } from '../src/state/jornadaSave';
import { cleanPlayerName, discoverRelics, emptyProfile, loadProfile, PLAYER_NAME_MAX, PROFILE_STORAGE_KEY, saveProfile } from '../src/state/profile';
import { bossChoices, dropRelic, rollRelic } from '../src/core/jornada/relics';
import { jornadaPtBR } from '../src/data/strings/jornada';
import { RELIC_ICONS } from '../prototype/jornada/relicIcons';

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

describe('equipe de resgate (estágio 3 da História)', () => {
  const stage = data.stages.find((s) => s.id === 'retrieval')!;
  const team = (id: string) => {
    const stop = stage.stops.find((s) => s.id === id)!;
    return isFight(stop) ? (stop.team ?? stage.team) : [];
  };

  it('o Quarteto do Som é enfrentado por quem estava lá, sem Jiraiya e Sakura', () => {
    expect(team('soundAmbush')).toEqual(['shikamaru', 'kibaAlly']);
    expect(team('jirobo')).toEqual(['choji', 'shikamaru']);
    expect(team('kidomaruTayuya')).toEqual(['nejiAlly', 'shikamaru']);
    expect(team('sakon')).toEqual(['kibaAlly', 'nejiAlly']);
    expect(stage.team).not.toContain('jiraiya');
    expect(stage.team).not.toContain('sakura');
    expect(team('tanzaku')).toEqual(['jiraiya', 'tsunade']);
  });

  it('todos têm ficha, nome e técnicas com nome', () => {
    for (const id of ['shikamaru', 'choji', 'kibaAlly', 'nejiAlly']) {
      const c = data.characters[id]!;
      expect(jornadaPtBR.names[id], id).toBeTruthy();
      for (const t of c.techniques) {
        expect(data.techniques[t], t).toBeTruthy();
        expect(jornadaPtBR.techniques[t], t).toBeTruthy();
      }
    }
  });

  it('o HUD mostra quem luta na próxima parada da História', () => {
    const run = { ...newRun(1, 'normal', data), stageIndex: 2, stopIndex: 0 };
    expect(nextFightTeam(run, data)).toEqual(['jiraiya', 'tsunade']);
    const ambush = stage.stops.findIndex((s) => s.id === 'soundAmbush');
    expect(nextFightTeam({ ...run, stopIndex: ambush }, data)).toEqual(['shikamaru', 'kibaAlly']);
  });
});

describe('nome do jogador', () => {
  it('limpa espaços e caracteres de controle e respeita o limite', () => {
    expect(cleanPlayerName('  Guilherme   Sá\n ')).toBe('Guilherme Sá');
    expect(cleanPlayerName('x'.repeat(40))).toHaveLength(PLAYER_NAME_MAX);
    expect(cleanPlayerName('   ')).toBe('');
  });

  it('perfil antigo não tem nome (ainda vai perguntar); nome vazio conta como já perguntado', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) };
    store[PROFILE_STORAGE_KEY] = JSON.stringify({ achievements: {}, villains: {}, backfilled: true });
    expect(loadProfile(storage).playerName).toBeUndefined();
    saveProfile(storage, { ...loadProfile(storage), playerName: '' });
    expect(loadProfile(storage).playerName).toBe('');
  });
});

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

  it('protagonista caído não é derrota: qualquer suporte de pé usa o turno para levantá-lo', () => {
    for (const ai of ['striker', 'guardian', 'brute', 'tactician', 'healer'] as const) {
      const ally = { ...dummy(), defId: 'sasuke', speed: 2, techniques: ['jKunai'], ai, hp: 500, maxHp: 500 };
      const killer = dummy({ speed: 99, techniques: ['jeCleaver'], offense: { taijutsu: 200, ninjutsu: 0, genjutsu: 0 } });
      // O inimigo mata o herói toda rodada, sempre antes de ele agir: a luta anda sozinha.
      const b = startBattle(setup({ allies: [hero({ hp: 5 }), ally], enemies: [killer] }), data, fixed(0));
      const revives = b.log.filter((e) => e.type === 'revive' && e.uid === 'a1' && e.target === 'a0');
      expect(revives[0], ai).toMatchObject({ hp: 50 });
      // Com limite por luta, a luta não entra em laço: depois disso o herói fica no chão e o suporte luta.
      expect(revives.length, ai).toBe(data.j.combat.supportRevivesPerFight);
      expect(b.status, ai).toBe('lost');
    }
  });

  it('com o herói de pé depois de levantado, o jogador volta a agir', () => {
    const ally = { ...dummy(), defId: 'sasuke', speed: 2, techniques: ['jKunai'], ai: 'striker' as const, hp: 500, maxHp: 500 };
    const killer = dummy({ speed: 99, techniques: ['jeCleaver'], offense: { taijutsu: 200, ninjutsu: 0, genjutsu: 0 } });
    // Sorteio: ordem da rodada 1 (3), golpe que acerta (0), depois tudo erra (0,99).
    const rolls = [0.5, 0.5, 0.5, 0];
    const b = startBattle(setup({ allies: [hero({ hp: 5 }), ally], enemies: [killer] }), data, () => rolls.shift() ?? 0.99);
    expect(b.log.some((e) => e.type === 'revive' && e.target === 'a0')).toBe(true);
    expect(awaitingPlayer(b)).toBe(true);
    expect(current(b)!.uid).toBe('a0');
  });

  it('derrota só quando todos os aliados caem; sozinho, cair é derrota', () => {
    const killer = dummy({ speed: 99, techniques: ['jeCleaver'], offense: { taijutsu: 200, ninjutsu: 0, genjutsu: 0 } });
    expect(startBattle(setup({ allies: [hero({ hp: 5 })], enemies: [killer] }), data, fixed(0)).status).toBe('lost');
    const ally = { ...dummy(), defId: 'sasuke', speed: 2, techniques: ['jKunai'], ai: 'striker' as const, hp: 5 };
    // Dois inimigos rápidos derrubam os dois aliados antes de o suporte agir.
    expect(startBattle(setup({ allies: [hero({ hp: 5 }), ally], enemies: [killer, { ...killer }] }), data, fixed(0)).status).toBe('lost');
  });

  it('golpe em área ignora os clones, mesmo com um inimigo só', () => {
    const b = startBattle(setup({ allies: [hero({ techniques: ['jChakraBurst'] })], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.5));
    const withClones = { ...b, fighters: b.fighters.map((f) => (f.uid === 'e0' ? { ...f, clones: 2 } : f)) } as JBattle;
    const next = playerAct(withClones, { kind: 'tech', techId: 'jChakraBurst', target: 'e0' }, data, fixed(0.1));
    expect(next.log.some((e) => e.type === 'cloneBlock')).toBe(false);
    expect(next.log.some((e) => e.type === 'damage' && e.target === 'e0')).toBe(true);
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

describe('trilha da História', () => {
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

const won = (b: JBattle): JBattle => ({ ...b, status: 'won' });

describe('run da Jornada', () => {
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

  it('o chefe oferece 3 relíquias de chefe e a escolha avança', () => {
    const run = { ...newRun(1, 'normal', data), stopIndex: data.stages[0]!.stops.length - 1 };
    const { run: next } = finishFight(run, won(startBattle(battleSetup(run, data), data, createRng(1))), data);
    expect(next.bossChoice).toHaveLength(3);
    for (const id of next.bossChoice!) expect(data.relics.find((r) => r.id === id)!.tier).toBe('boss');
    const after = chooseBossRelic(next, next.bossChoice![0]!, data);
    expect(after.relics).toContain(next.bossChoice![0]);
    expect([after.stageIndex, after.stopIndex]).toEqual([1, 0]);
  });

  it('elite vencida deixa uma relíquia comum, incomum ou rara; luta comum, não', () => {
    let run = newRun(3, 'normal', data);
    run = { ...run, stopIndex: data.stages[0]!.stops.findIndex((s) => s.id === 'zabuza') };
    const { run: next, outcome } = finishFight(run, won(startBattle(battleSetup(run, data), data, createRng(1))), data);
    expect(outcome.relic).toBeTruthy();
    expect(next.relics).toContain(outcome.relic);
    expect(['common', 'uncommon', 'rare']).toContain(data.relics.find((r) => r.id === outcome.relic)!.tier);

    const thugs = { ...newRun(3, 'normal', data), stopIndex: data.stages[0]!.stops.findIndex((s) => s.id === 'thugs') };
    const plain = finishFight(thugs, won(startBattle(battleSetup(thugs, data), data, createRng(1))), data);
    expect(plain.outcome.relic).toBeNull();
  });

  it('o sorteio da elite segue as chances pedidas: 50/33/17', () => {
    const rng = createRng(11);
    const seen: Record<string, number> = {};
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const id = dropRelic(data.relics, [], data.j.relics.eliteWeights, rng)!;
      const tier = data.relics.find((r) => r.id === id)!.tier;
      seen[tier] = (seen[tier] ?? 0) + 1;
    }
    expect(Object.keys(seen).sort()).toEqual(['common', 'rare', 'uncommon']);
    expect(seen.common! / N).toBeCloseTo(0.5, 1);
    expect(seen.uncommon! / N).toBeCloseTo(0.33, 1);
    expect(seen.rare! / N).toBeCloseTo(0.17, 1);
  });

  it('cada personagem começa com a sua relíquia inicial, sempre com a recuperação', () => {
    expect(newRun(1, 'normal', data).relics).toEqual(['ichirakuBowl']);
    const unlocked = new Set(['j_unlockUchiha', 'j_unlockHyuuga']);
    expect(newGenericRun(1, 'normal', 'uchiha', data, unlocked).relics).toEqual(['clanIncense']);
    expect(newGenericRun(1, 'normal', 'hyuuga', data, unlocked).relics).toEqual(['familyTea']);
    for (let s = 0; s < 40; s++) {
      const r = newGenericRun(s, 'normal', 'common', data);
      expect(r.relics).toEqual([r.hero === 'prodigy' ? 'trainingBento' : 'academyFlask']);
    }
    for (const r of data.relics.filter((x) => x.tier === 'starter')) {
      expect(r.starterFor?.length, r.id).toBeGreaterThan(0);
      expect(r.afterWinHealPct, r.id).toBe(0.25);
    }
  });

  it('evolução: pode aparecer na escolha do chefe, troca a inicial e nunca sai em outro sorteio', () => {
    const relics = data.relics;
    expect(bossChoices(relics, ['ichirakuBowl'], 3, 1, createRng(1))).toContain('ichirakuDeluxe');
    expect(bossChoices(relics, ['ichirakuBowl'], 3, 1, createRng(1))).toHaveLength(3);
    expect(bossChoices(relics, ['ichirakuBowl'], 3, 0, createRng(1))).not.toContain('ichirakuDeluxe');
    // Já evoluiu: não aparece de novo, e outras classes não veem a evolução do Naruto.
    expect(bossChoices(relics, ['ichirakuDeluxe'], 3, 1, createRng(1))).not.toContain('ichirakuDeluxe');
    expect(bossChoices(relics, ['academyFlask'], 3, 1, createRng(1))).toContain('chuninFlask');

    const run = gainRelic({ ...newRun(1, 'normal', data), relics: ['ichirakuBowl', 'goggles'] }, 'ichirakuDeluxe', data);
    expect(run.relics).toEqual(['ichirakuDeluxe', 'goggles']);

    const rng = createRng(5);
    for (let i = 0; i < 400; i++) {
      const id = dropRelic(relics, [], { common: 1, uncommon: 1, rare: 1, boss: 1, shop: 1, event: 1 }, rng)!;
      const def = relics.find((r) => r.id === id)!;
      expect(def.evolves, id).toBeUndefined();
      expect(def.tier, id).not.toBe('starter');
      expect(def.tier, id).not.toBe('special');
    }
  });

  it('save: não enfia a Tigela em quem não é da História nem desfaz a evolução', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const evolved = { ...newRun(1, 'normal', data), relics: ['ichirakuDeluxe'] };
    saveJornada(storage, evolved);
    expect(loadJornada(storage)!.relics).toEqual(['ichirakuDeluxe']);
    saveJornada(storage, { ...newRun(1, 'normal', data), relics: [] });
    expect(loadJornada(storage)!.relics).toEqual(['ichirakuBowl']);
  });

  it('o mercador tem uma vaga de loja; relíquias de loja e evento só saem no lugar delas', () => {
    const run: JRun = { ...newRun(4, 'normal', data), stopIndex: 6 };
    const tiers = shopOffer(run, data).relics.map((r) => data.relics.find((x) => x.id === r.id)!.tier);
    expect(tiers).toHaveLength(data.j.shop.relics);
    expect(tiers.filter((t) => t === 'shop')).toHaveLength(1);
    expect(tiers.every((t) => ['common', 'uncommon', 'rare', 'shop'].includes(t))).toBe(true);
    const rng = createRng(7);
    for (let i = 0; i < 300; i++) {
      for (const weights of [data.j.relics.treasureWeights, data.j.relics.eliteWeights]) {
        const id = dropRelic(data.relics, [], weights, rng);
        expect(['shop', 'event', 'boss']).not.toContain(data.relics.find((r) => r.id === id)!.tier);
      }
    }
  });

  it('sem nada para sortear, cai na relíquia especial; depois dela, nada', () => {
    const everyone = data.relics.filter((r) => r.tier !== 'special').map((r) => r.id);
    const rng = createRng(1);
    expect(dropRelic(data.relics, everyone, data.j.relics.eliteWeights, rng)).toBe('emptyCharm');
    expect(dropRelic(data.relics, [...everyone, 'emptyCharm'], data.j.relics.eliteWeights, rng)).toBeNull();
    expect(rollRelic(data.relics, everyone, data.j.relics.eliteWeights, rng)).toBeNull();
    expect(gainRelic(newRun(1, 'normal', data), 'emptyCharm', data).ryo).toBe(25);
  });

  it('ganchos novos das relíquias', () => {
    const mod = (m: Partial<FighterSeed['mods']>) => ({ ...emptyMods(), ...m });
    // Clones: contra-ataque em quem acerta o clone.
    const withCounter = startBattle(setup({ allies: [hero()], enemies: [dummy({ hp: 500, maxHp: 500, mods: mod({ cloneCounter: 4 }), clones: 0 } as Partial<FighterSeed>)] }), data, fixed(0.5));
    const counter = { ...withCounter, fighters: withCounter.fighters.map((f) => (f.uid === 'e0' ? { ...f, clones: 2 } : f)) } as JBattle;
    const hit = playerAct(counter, { kind: 'tech', techId: 'jStrike', target: 'e0' }, data, fixed(0.1));
    expect(hit.log.some((e) => e.type === 'damage' && e.uid === 'e0' && e.target === 'a0' && e.amount === 4)).toBe(true);
    // Limite de clones.
    const b = startBattle(setup({ allies: [hero({ mods: mod({ maxClonesBonus: 2, startClones: 6 }) })] }), data, fixed(0.5));
    const cloned = playerAct(b, { kind: 'tech', techId: 'jKageBunshin', target: 'a0' }, data, fixed(0.5));
    expect(cloned.fighters[0]!.clones).toBe(data.j.combat.maxClones + 2);
    // Dano por clone e contra atordoado.
    const base = startBattle(setup(), data, fixed(0.5)).fighters;
    const strike = data.techniques.jStrike!;
    const plain = hitDamage(base[0]!, base[1]!, strike, data);
    expect(hitDamage({ ...base[0]!, clones: 5, mods: mod({ damagePerClone: 0.2 }) }, base[1]!, strike, data)).toBe(plain * 2);
    const stunned = { ...base[1]!, effects: [{ kind: 'stun' as const, turns: 1 }] };
    expect(hitDamage({ ...base[0]!, mods: mod({ stunnedDamageMult: 2 }) }, stunned, strike, data)).toBe(plain * 2);
    // Chakra: começo da luta e Concentrar.
    const low = startBattle(setup({ allies: [hero({ chakra: 0, mods: mod({ startChakraPct: 0.5, restBonusPct: 0.25 }) })] }), data, fixed(0.5));
    expect(low.fighters[0]!.chakra).toBe(15);
    const rested = playerAct(low, { kind: 'rest' }, data, fixed(0.5));
    expect(rested.fighters[0]!.chakra).toBe(15 + 15);
    // Defender cura; kit cura mais.
    const hurt = startBattle(setup({ allies: [hero({ hp: 20, mods: mod({ guardHealPct: 0.1, kitBonusPct: 1 }) })] }), data, fixed(0.5));
    expect(useItem(hurt, 'hpKit', 'a0', data).fighters[0]!.hp).toBe(20 + Math.floor(100 * data.j.combat.hpKitPct * 2));
    expect(playerAct(hurt, { kind: 'guard' }, data, fixed(0.99)).log.some((e) => e.type === 'heal' && e.amount === 10)).toBe(true);
    // Levantar com mais HP.
    const ally = { ...dummy(), defId: 'sasuke', speed: 2, techniques: ['jKunai'], ai: 'striker' as const, hp: 0, mods: mod({ reviveHpBonus: 0.3 }) };
    const rev = playerAct(startBattle(setup({ allies: [hero(), ally], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.5)), { kind: 'revive', target: 'a1' }, data, fixed(0.5));
    expect(rev.log.some((e) => e.type === 'revive' && e.target === 'a1' && e.hp === 80)).toBe(true);
  });

  it('bolsa maior e descanso melhor pelas relíquias', () => {
    const run = { ...newRun(1, 'normal', data), bag: { hpKit: data.j.run.bagLimit, chakraKit: 0, reviveKit: 0 } };
    expect(bagFull(run, data)).toBe(true);
    expect(bagFull(gainRelic(run, 'sturdyBag', data), data)).toBe(false);
    expect(restHealPct(gainRelic(run, 'campBlanket', data), data)).toBeCloseTo(data.j.run.restHealPct + 0.1);
  });

  it('coleção: relíquia entra ao aparecer, guarda a primeira data e perfil antigo carrega vazio', () => {
    const first = new Date('2026-01-01T00:00:00Z');
    const later = new Date('2026-02-01T00:00:00Z');
    let p = discoverRelics(emptyProfile(), ['goggles', 'kakashiBell'], first);
    expect(Object.keys(p.relics)).toEqual(['goggles', 'kakashiBell']);
    p = discoverRelics(p, ['goggles', 'warFan'], later);
    expect(p.relics.goggles).toBe(first.toISOString());
    expect(p.relics.warFan).toBe(later.toISOString());
    expect(discoverRelics(p, ['goggles'], later)).toBe(p);
    const store: Record<string, string> = { [PROFILE_STORAGE_KEY]: JSON.stringify({ achievements: {}, villains: {}, backfilled: true }) };
    expect(loadProfile({ getItem: (k: string) => store[k] ?? null, setItem: () => {} }).relics).toEqual({});
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

  it('talentos: a maioria é única; só alguns sobem de nível, com limite', () => {
    const none = new Set<string>();
    const node = (id: string) => data.talents.find((t) => t.id === id)!;
    let run: JRun = { ...newRun(1, 'normal', data), talentPoints: 30 };
    const withRanks = data.talents.filter((t) => (t.maxRank ?? 1) > 1);
    expect(withRanks.length).toBeLessThan(data.talents.length / 3);
    for (const t of withRanks) {
      expect(t.maxRank, t.id).toBeLessThanOrEqual(3);
      expect(t.rankMods, t.id).toBeTruthy();
    }
    // Talento único não sobe: fica 'owned' mesmo com pontos.
    run = buyTalent(run, 'tMoreClones', none, data);
    expect(talentState(node('tMoreClones'), data.talents, talentContext(run, none))).toBe('owned');
    expect(() => buyTalent(run, 'tMoreClones', none, data)).toThrow();
    // Com níveis: sobe até o limite, cobrando o custo do nível.
    run = buyTalent(run, 'tRendan', none, data);
    expect(talentState(node('tRendan'), data.talents, talentContext(run, none))).toBe('upgradable');
    const before = run.talentPoints;
    run = buyTalent(buyTalent(run, 'tRendan', none, data), 'tRendan', none, data);
    expect(run.talentRanks.tRendan).toBe(3);
    expect(run.talentPoints).toBe(before - 2 * node('tRendan').rankCost!);
    expect(talentState(node('tRendan'), data.talents, talentContext(run, none))).toBe('maxed');
    expect(() => buyTalent(run, 'tRendan', none, data)).toThrow();
    // Sem pontos, não sobe: volta a mostrar 'owned'.
    const broke = { ...buyTalent({ ...newRun(1, 'normal', data), talentPoints: 3 }, 'tMoreClones', none, data) };
    const one = buyTalent(broke, 'tRendan', none, data);
    expect(talentState(node('tRendan'), data.talents, talentContext(one, none))).toBe('owned');
  });

  it('liberar o próximo pede só o anterior no nível 1, e dá para voltar e subir depois', () => {
    const none = new Set<string>();
    const node = (id: string) => data.talents.find((t) => t.id === id)!;
    let run: JRun = { ...newRun(1, 'normal', data), talentPoints: 30 };
    run = buyTalent(buyTalent(run, 'tMoreClones', none, data), 'tRendan', none, data);
    expect(talentState(node('tCloneBlast'), data.talents, talentContext(run, none))).toBe('available');
    run = buyTalent(run, 'tCloneBlast', none, data);
    run = buyTalent(run, 'tRendan', none, data);
    expect(run.talentRanks.tRendan).toBe(2);
  });

  it('o nível aumenta o efeito da técnica', () => {
    const none = new Set<string>();
    let run: JRun = { ...newRun(1, 'normal', data), talentPoints: 30, stageIndex: 2 };
    run = buyTalent(run, 'tRasengan', none, data);
    expect(heroMods(run, data).techDamageMult.jRasengan ?? 1).toBe(1);
    run = buyTalent(run, 'tRasengan', none, data);
    expect(heroMods(run, data).techDamageMult.jRasengan).toBeCloseTo(1.15);
    expect(heroMods(run, data).techChakraDiscount.jRasengan).toBe(1);
    run = buyTalent(run, 'tRasengan', none, data);
    expect(heroMods(run, data).techDamageMult.jRasengan).toBeCloseTo(1.15 * 1.15);
    expect(heroMods(run, data).techChakraDiscount.jRasengan).toBe(2);
  });

  it('bifurcação: escolher um caminho fecha o outro, e qualquer um libera o seguinte', () => {
    const none = new Set<string>();
    const node = (id: string) => data.talents.find((t) => t.id === id)!;
    const base: JRun = { ...newRun(1, 'normal', data), talentPoints: 30 };
    const a = buyTalent(buyTalent(base, 'tMoreClones', none, data), 'tRendan', none, data);
    expect(talentState(node('tCloneGuard'), data.talents, talentContext(a, none))).toBe('excluded');
    expect(() => buyTalent(a, 'tCloneGuard', none, data)).toThrow();
    const b = buyTalent(buyTalent(base, 'tMoreClones', none, data), 'tCloneGuard', none, data);
    expect(talentState(node('tRendan'), data.talents, talentContext(b, none))).toBe('excluded');
    expect(talentState(node('tCloneBlast'), data.talents, talentContext(b, none))).toBe('available');
  });

  it('nenhum ponto fica preso: a árvore do Naruto custa mais do que a run rende, com ramos abertos em cada estágio', () => {
    const naruto = data.talents.filter((t) => t.owner === 'naruto');
    expect(new Set(naruto.map((t) => t.branch)).size).toBe(6);
    // Custo para aprender tudo que dá numa run (nas bifurcações, um lado só) sem contar os níveis.
    const cost = (stage: number) => {
      const open = naruto.filter((t) => (t.fromStage ?? 0) <= stage);
      const seen = new Set<string>();
      let sum = 0;
      for (const t of open) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        for (const x of t.excludes ?? []) seen.add(x);
        sum += t.cost;
      }
      return sum;
    };
    // Pontos que dá para ter ao fim de cada estágio (lutas + níveis + eventos), com folga.
    expect(cost(0)).toBeGreaterThan(14);
    expect(cost(1)).toBeGreaterThan(28);
    expect(cost(2)).toBeGreaterThan(40);
  });

  it('nós depois de bifurcação dizem quem libera; toda exclusão é mútua; nós e textos existem', () => {
    for (const t of data.talents) {
      const same = data.talents.filter((n) => n.owner === t.owner && n.branch === t.branch && n.tier === t.tier - 1);
      if (same.length > 1) expect(t.requires, t.id).toBeTruthy();
      for (const r of t.requires ?? []) expect(data.talents.some((n) => n.id === r), r).toBe(true);
      for (const x of t.excludes ?? []) expect(data.talents.find((n) => n.id === x)?.excludes, x).toContain(t.id);
      expect(jornadaPtBR.talents.list[t.id]?.name, t.id).toBeTruthy();
      if ((t.maxRank ?? 1) > 1) expect(jornadaPtBR.talents.list[t.id]?.rank, t.id).toBeTruthy();
      if (t.learn) expect(data.techniques[t.learn], t.learn).toBeTruthy();
      expect(jornadaPtBR.talents.branches[t.branch], t.branch).toBeTruthy();
    }
  });

  it('talento de equipe vale para os suportes; run salva sem níveis carrega', () => {
    const none = new Set<string>();
    let run: JRun = { ...newRun(1, 'normal', data), talentPoints: 30 };
    const hp = memberSheet(run, 'sasuke', data).maxHp;
    run = buyTalent(buyTalent(run, 'tNeverGiveUp', none, data), 'tTeam7', none, data);
    expect(memberSheet(run, 'sasuke', data).maxHp).toBe(Math.floor(hp * 1.15));
    expect(teamMods(run, data).regenPct).toBeCloseTo(0.01);
    expect(heroMods(run, data).regenPct).toBeCloseTo(0.01);
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const old = JSON.parse(JSON.stringify(run));
    delete old.talentRanks;
    mem.set(JORNADA_SAVE_KEY, JSON.stringify(old));
    expect(loadJornada(storage)!.talentRanks).toEqual({});
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

  it('a História começa com a Tigela do Ichiraku, que nunca sai em sorteio', () => {
    const run = newRun(1, 'normal', data);
    expect(run.relics).toEqual(['ichirakuBowl']);
    for (let s = 0; s < 40; s++) {
      const r = { ...newRun(s, 'normal', data), stopIndex: 6, ryo: 999 };
      expect(shopOffer(r, data).relics.map((x) => x.id)).not.toContain('ichirakuBowl');
    }
  });

  it('toda relíquia tem nome, descrição e ícone próprio', () => {
    const icons = new Set<string>();
    for (const r of data.relics) {
      expect(jornadaPtBR.relics.list[r.id]?.name, r.id).toBeTruthy();
      expect(jornadaPtBR.relics.list[r.id]?.desc, r.id).toBeTruthy();
      expect(RELIC_ICONS[r.id], r.id).toBeTruthy();
      icons.add(RELIC_ICONS[r.id]!);
    }
    expect(icons.size).toBe(data.relics.length);
  });

  it('toda relíquia está no doc', () => {
    const doc = readFileSync('docs/jornada/reliquias.md', 'utf8');
    const missing = data.relics.map((r) => jornadaPtBR.relics.list[r.id]!.name).filter((n) => !doc.includes(n));
    expect(missing).toEqual([]);
  });

  it('relíquias que dão ryō e pontos de talento na hora', () => {
    const run = newRun(1, 'normal', data);
    expect(gainRelic(run, 'luckyCoin', data).ryo).toBe(run.ryo + 60);
    expect(gainRelic(run, 'mastersJournal', data).talentPoints).toBe(run.talentPoints + 1);
    expect(gainRelic(run, 'heavenEarthScrolls', data).talentPoints).toBe(run.talentPoints + 2);
  });

  it('Caderno de treino: +15% de XP', () => {
    const run = newRun(1, 'normal', data);
    const plain = finishFight(run, won(startBattle(battleSetup(run, data), data, createRng(1))), data).run;
    const withLog = gainRelic(run, 'trainingLog', data);
    const boosted = finishFight(withLog, won(startBattle(battleSetup(withLog, data), data, createRng(1))), data).run;
    expect(boosted.xp).toBe(Math.floor(plain.xp * 1.15));
  });

  it('desconto do mercador soma relíquias e Tazuna, com teto', () => {
    const run = { ...newRun(1, 'normal', data), stopIndex: 6 };
    const price = data.j.shop.trainingPrice;
    expect(shopOffer(gainRelic(run, 'merchantToken', data), data).training).toBe(Math.floor(price * 0.85));
    const both = gainRelic(gainRelic({ ...run, flags: ['helpedTazuna'] }, 'merchantToken', data), 'bottomlessPouch', data);
    expect(shopOffer(both, data).training).toBe(Math.floor(price * (1 - data.j.shop.maxDiscount)));
  });

  it('a vitória recupera 25% da equipe do estágio, inclusive quem não lutou', () => {
    // Capangas (parada 4): Naruto, Sasuke e Sakura. Depois, o Haku: só Naruto e Sasuke lutam.
    const base = { ...newRun(1, 'normal', data), stopIndex: 3 };
    const hurt: JRun = { ...base, members: { naruto: { hp: 20, chakra: 5 }, sasuke: { hp: 20, chakra: 5 }, sakura: { hp: 20, chakra: 5 } } };
    const b = startBattle(battleSetup(hurt, data), data, createRng(1));
    const { run } = finishFight(hurt, won(b), data);
    const sasuke = memberSheet(run, 'sasuke', data);
    expect(run.members.sasuke!.hp).toBe(Math.min(sasuke.maxHp, 20 + Math.floor(sasuke.maxHp * 0.25)));
    // Naruto × Kiba (estágio 2): o Naruto luta sozinho, e a Sakura, fora da luta, também recupera.
    const kiba: JRun = { ...hurt, stageIndex: 1, stopIndex: 5 };
    expect(currentStop(kiba, data)!.id).toBe('kiba');
    const res = finishFight(kiba, won(startBattle(battleSetup(kiba, data), data, createRng(1))), data).run;
    const sakura = memberSheet(res, 'sakura', data);
    expect(res.members.sakura!.hp).toBe(Math.min(sakura.maxHp, 20 + Math.floor(sakura.maxHp * 0.25)));
  });

  it('vencer o chefe deixa toda a equipe cheia, inclusive quem caiu', () => {
    const run: JRun = { ...newRun(1, 'normal', data), stopIndex: data.stages[0]!.stops.length - 1, members: { naruto: { hp: 3, chakra: 0 }, sakura: { hp: 1, chakra: 0 } } };
    const b = startBattle(battleSetup(run, data), data, createRng(1));
    const fallen = { ...won(b), fighters: b.fighters.map((f) => (f.defId === 'sasuke' ? { ...f, hp: 0, down: true } : f)) };
    const { run: next } = finishFight(run, fallen, data);
    for (const id of ['naruto', 'sasuke', 'sakura']) {
      const sheet = memberSheet(next, id, data);
      expect(next.members[id]).toEqual({ hp: sheet.maxHp, chakra: sheet.maxChakra });
    }
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
    // Save de antes da Tigela ganha a relíquia ao carregar.
    saveJornada(storage, { ...run, relics: ['goggles'] });
    expect(loadJornada(storage)!.relics).toEqual(['ichirakuBowl', 'goggles']);
  });
});

describe('Caminho Ninja', () => {
  it('o mapa tem 3 começos, todo nó é alcançável, tem saída e todo caminho chega ao chefe', () => {
    for (let s = 0; s < 30; s++) {
      const map = generateMap(createRng(s), data);
      const rows = data.j.map.rows;
      expect(map.nodes.filter((n) => n.row === 0)).toHaveLength(3);
      expect(reachable(map).size).toBe(map.nodes.length);
      for (const n of map.nodes) {
        if (n.kind === 'boss') continue;
        expect(n.next.length, n.id).toBeGreaterThan(0);
        for (const id of n.next) expect(map.nodes.find((x) => x.id === id)!.row).toBe(n.row + 1);
      }
      expect(map.nodes.filter((n) => n.kind === 'boss').map((n) => n.row)).toEqual([rows - 1]);
      // Regras de linha.
      for (const n of map.nodes) {
        if (n.row === 0) expect(n.kind).toBe('fight');
        if (n.row === data.j.map.treasureRow) expect(n.kind).toBe('treasure');
        if (n.row === rows - 2) expect(n.kind).toBe('rest');
        if (n.row < data.j.map.eliteFromRow) expect(n.kind).not.toBe('elite');
      }
    }
  });

  it('o Comum sem elemento vira prodígio; com elemento, aprende o nível I', () => {
    const kinds = new Set<string>();
    for (let s = 0; s < 80; s++) {
      const run = newGenericRun(s, 'normal', 'common', data);
      kinds.add(run.hero);
      const el = run.elements[run.hero];
      if (run.hero === 'prodigy') expect(el).toBeNull();
      else expect(run.moveset).toContain(data.elementLines[el!][0]);
      for (const id of run.supports) expect(run.elements[id]).not.toBeNull();
    }
    expect(kinds).toEqual(new Set(['commonNinja', 'prodigy']));
  });

  it('escolher nó, lutar e avançar até o mapa do próximo estágio', () => {
    let run = newGenericRun(3, 'easy', 'common', data);
    expect(choosingNode(run)).toBe(true);
    expect(() => chooseNode(run, 'n5-0')).toThrow();
    let guard = 0;
    while (run.stageIndex === 0 && run.status === 'inProgress' && guard++ < 50) {
      if (run.bossChoice) {
        run = chooseBossRelic(run, run.bossChoice[0]!, data);
        continue;
      }
      if (choosingNode(run)) {
        run = chooseNode(run, nodeChoices(run)[0]!.id);
        continue;
      }
      const stop = currentStop(run, data)!;
      if (isFight(stop)) run = finishFight(run, won(startBattle(battleSetup(run, data), data, createRng(1))), data).run;
      else if (stop.kind === 'event') run = resolveEvent(run, eventOptions(data.events[stop.event]!, run.flags, run.ryo)[0]!.id, true, data).run;
      else if (stop.kind === 'rest') run = rest(run, 'heal', data);
      else run = leaveStop(run, data);
    }
    expect(run.stageIndex).toBe(1);
    expect(run.path).toEqual([]);
    expect(choosingNode(run)).toBe(true);
    expect(run.map!.nodes.some((n) => n.kind === 'boss')).toBe(true);
  });

  it('os suportes genéricos lutam com o elemento sorteado', () => {
    let run = newGenericRun(5, 'normal', 'common', data);
    run = chooseNode(run, nodeChoices(run)[0]!.id);
    const setup = battleSetup(run, data);
    expect(setup.allies[0]!.defId).toBe(run.hero);
    expect(setup.allies.slice(1).map((a) => a.defId).sort()).toEqual(['leafGeninA', 'leafGeninB']);
    const genin = setup.allies.find((a) => a.defId === 'leafGeninA')!;
    expect(genin.element).toBe(run.elements.leafGeninA);
    expect(genin.techniques).toContain(data.elementLines[run.elements.leafGeninA!][0]);
  });

  it('o ramo Elemento ensina a técnica do elemento sorteado', () => {
    const run = { ...newGenericRun(1, 'normal', 'common', data), hero: 'commonNinja', elements: { commonNinja: 'water' as const }, talentPoints: 5 };
    const next = buyTalent(run, 'tElement2', new Set(), data);
    expect(next.learned).toContain('jWaterShark');
  });

  it('a partir de um nó, só o que está à frente segue alcançável; o chefe sempre', () => {
    const map = generateMap(createRng(4), data);
    const start = map.nodes.find((n) => n.row === 0)!;
    const ahead = reachableFrom(map, [start.id]);
    expect(ahead.has(start.id)).toBe(true);
    expect(map.nodes.filter((n) => n.row === 0 && n.id !== start.id).some((n) => ahead.has(n.id))).toBe(false);
    expect(ahead.has(map.nodes.find((n) => n.kind === 'boss')!.id)).toBe(true);
  });

  it('save do Caminho Ninja vai e volta; save antigo carrega como História', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const run = newGenericRun(9, 'normal', 'common', data);
    saveJornada(storage, run);
    expect(loadJornada(storage)).toEqual(run);
    const old = JSON.parse(JSON.stringify(newRun(2, 'normal', data)));
    for (const k of ['mode', 'hero', 'classId', 'elements', 'supports', 'map', 'nodeId', 'path', 'bossPlan']) delete old[k];
    mem.set(JORNADA_SAVE_KEY, JSON.stringify(old));
    const loaded = loadJornada(storage)!;
    expect([loaded.mode, loaded.hero]).toEqual(['canon', 'naruto']);
  });

  it('desbloqueios: Uchiha com Comum de fogo e Hyuuga com prodígio, fora do Fácil', () => {
    const base = { ...newGenericRun(1, 'normal', 'common', data), status: 'victory' as const };
    const fire = { ...base, hero: 'commonNinja', elements: { commonNinja: 'fire' as const } };
    expect(newJornadaAchievements(fire, new Set())).toEqual(expect.arrayContaining(['j_genericWin', 'j_unlockUchiha']));
    expect(newJornadaAchievements({ ...fire, difficulty: 'easy' }, new Set())).not.toContain('j_unlockUchiha');
    const prodigy = { ...base, hero: 'prodigy', elements: { prodigy: null } };
    expect(newJornadaAchievements(prodigy, new Set())).toContain('j_unlockHyuuga');
    expect(newJornadaAchievements(prodigy, new Set())).not.toContain('j_canonWin');
  });

  it('Uchiha: fogo fixo e segundo elemento diferente; Hyuuga sempre com elemento', () => {
    const seconds = new Set<string | null>();
    for (let s = 0; s < 60; s++) {
      const u = newGenericRun(s, 'normal', 'uchiha', data);
      expect([u.hero, u.elements[u.hero]]).toEqual(['uchihaNinja', 'fire']);
      expect(u.secondElement).not.toBe('fire');
      seconds.add(u.secondElement);
      if (u.secondElement) expect(heroMovable(u, data)).toContain(data.elementLines[u.secondElement][0]);
      const h = newGenericRun(s, 'normal', 'hyuuga', data);
      expect(h.hero).toBe('hyuugaNinja');
      expect(h.elements[h.hero]).not.toBeNull();
    }
    expect(seconds.has(null)).toBe(true);
    expect(seconds.has('lightning')).toBe(true);
  });

  it('classes liberadas trazem a versão suporte para o sorteio de parceiros', () => {
    const none = new Set<string>();
    const all = new Set(['j_unlockUchiha', 'j_unlockHyuuga']);
    for (let s = 0; s < 20; s++) expect(newGenericRun(s, 'normal', 'common', data, none).supports.sort()).toEqual(['leafGeninA', 'leafGeninB']);
    const seen = new Set<string>();
    for (let s = 0; s < 60; s++) {
      const r = newGenericRun(s, 'normal', 'uchiha', data, all);
      expect(r.supports).toHaveLength(2);
      expect(r.supports).not.toContain('uchihaGenin');
      r.supports.forEach((id) => seen.add(id));
      if (r.supports.includes('hyuugaGenin')) expect(r.elements.hyuugaGenin).not.toBeNull();
    }
    expect(seen.has('hyuugaGenin')).toBe(true);
  });

  it('easter egg: o ramo Raio só existe com raio, e o Chidori libera o ramo do Sasuke', () => {
    const base = { ...newGenericRun(1, 'normal', 'uchiha', data), talentPoints: 20 };
    const node = (id: string) => data.talents.find((t) => t.id === id)!;
    const noLightning = { ...base, secondElement: 'water' as const };
    expect(talentState(node('tChidoriU'), data.talents, talentContext(noLightning, new Set()))).toBe('hidden');
    const lightning = { ...base, secondElement: 'lightning' as const };
    expect(talentState(node('tChidoriU'), data.talents, talentContext(lightning, new Set()))).toBe('available');
    expect(talentState(node('tLionU'), data.talents, talentContext(lightning, new Set()))).toBe('accountLocked');
    const learned = buyTalent(lightning, 'tChidoriU', new Set(), data);
    expect(newJornadaAchievements(learned, new Set())).toContain('j_sasukeEgg');
    expect(talentState(node('tLionU'), data.talents, talentContext(learned, new Set(['j_sasukeEgg'])))).toBe('available');
  });

  it('o visual escolhido fica na run', () => {
    expect(newGenericRun(1, 'normal', 'uchiha', data, new Set(), 'sasuke').skin).toBe('sasuke');
  });

  it('Portões fortalecem o dano por alguns turnos', () => {
    const me = hero({ techniques: ['jStrike', 'jGates'] });
    let b = startBattle(setup({ allies: [me], enemies: [dummy({ hp: 999, maxHp: 999 })] }), data, fixed(0.5));
    const plain = hitDamage(b.fighters[0]!, b.fighters[1]!, data.techniques.jStrike!, data);
    b = playerAct(b, { kind: 'tech', techId: 'jGates', target: 'a0' }, data, fixed(0.5));
    expect(b.fighters[0]!.boost?.damageMult).toBe(1.3);
    expect(hitDamage(b.fighters[0]!, b.fighters[1]!, data.techniques.jStrike!, data)).toBe(Math.floor((8 + 10 - 3) * 1.3));
    expect(plain).toBe(15);
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
