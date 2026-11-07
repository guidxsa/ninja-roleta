import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  advance,
  awaitingPlayer,
  battlePower,
  current,
  emptyMods,
  enemySeed,
  gateChoices,
  gateTotals,
  hitDamage,
  maxGate,
  mergeMods,
  openBattle,
  playerAct,
  setGate,
  startBattle,
  techPower,
  useActive,
  useItem,
  validTargets,
  type BattleSetup,
  type FighterSeed,
} from '../src/core/jornada/battle';
import { eventOptions } from '../src/core/jornada/events';
import { generateMap, reachable, reachableFrom } from '../src/core/jornada/map';
import { checkSequence, jokenpo, memoryDeck, sealSequence } from '../src/core/jornada/minigames';
import { newJornadaAchievements } from '../src/data/jornada/achievements';
import {
  bagFull,
  afterWinRecovery,
  battleSetup,
  buy,
  buyTalent,
  canBuy,
  canContinueCycle,
  chooseBossRelic,
  continueCycle,
  cycleEnemyMult,
  chooseNode,
  choosingNode,
  currentStop,
  finishFight,
  gainRelic,
  heroActives,
  heroMods,
  heroMovable,
  leaveStop,
  memberSheet,
  supportClass,
  newGenericRun,
  newRun,
  nextFightTeam,
  nodeChoices,
  resolveEvent,
  rest,
  restHeal,
  setMoveset,
  openShop,
  shopOffer,
  stopRng,
  syncUnlocks,
  talentContext,
  talentTreeComplete,
  teamMods,
  xpToNext,
  HERO,
  type JRun,
} from '../src/core/jornada/run';
import { chooseAiAction, chooseAiActive } from '../src/core/jornada/ai';
import { talentMaxRank, talentState, treeComplete, type TalentNode } from '../src/core/jornada/talents';
import { isFight } from '../src/core/jornada/trail';
import type { JBattle } from '../src/core/jornada/types';
import { createRng } from '../src/core/rng';
import { jornadaData as data } from '../src/data/jornada';
import { loadJornada, saveJornada, JORNADA_SAVE_KEY } from '../src/state/jornadaSave';
import {
  cleanPlayerName,
  discoverRelics,
  emptyProfile,
  loadProfile,
  PLAYER_NAME_MAX,
  PROFILE_STORAGE_KEY,
  reachBeats,
  reachOf,
  recordJornadaReach,
  saveProfile,
} from '../src/state/profile';
import { bossChoices, dropRelic, rollRelic } from '../src/core/jornada/relics';
import { RELIC_RENAMES } from '../src/data/jornada/relics';
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
  it('a abertura mostra todos intactos; os turnos antes do protagonista só andam depois', () => {
    const fast = dummy({ speed: 99, hp: 500, maxHp: 500, techniques: ['jeCleaver'] });
    const opening = openBattle(setup({ enemies: [fast] }), data);
    expect(opening.fighters[0]!.hp).toBe(100);
    expect(opening.log).toEqual([]);
    const after = advance(opening, data, fixed(0));
    expect(after.fighters[0]!.hp).toBeLessThan(100);
    // O estado de abertura não muda, e o resultado é igual ao de startBattle com o mesmo sorteio.
    expect(opening.fighters[0]!.hp).toBe(100);
    expect(after).toEqual(startBattle(setup({ enemies: [fast] }), data, fixed(0)));
  });

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
    expect(b.fighters[0]!.hp).toBe(40 + data.j.combat.hpKit);
    expect(awaitingPlayer(b)).toBe(true);
    expect(() => useItem(b, 'chakraKit', 'a0', data)).toThrow();
  });

  describe('reviver é habilidade ou pílula (v0.48.0)', () => {
    const killer = dummy({ speed: 99, techniques: ['jeCleaver'], offense: { taijutsu: 200, ninjutsu: 0, genjutsu: 0 } });
    const support = (over: Partial<FighterSeed> = {}) => ({ ...dummy(), defId: 'sasuke', speed: 2, techniques: ['jKunai'], ai: 'striker' as const, hp: 500, maxHp: 500, ...over });
    /** Só o primeiro golpe do inimigo acerta: ordem da rodada (3 sorteios), golpe que acerta, depois tudo erra. */
    const oneHit = () => {
      const rolls = [0.5, 0.5, 0.5, 0];
      return () => rolls.shift() ?? 0.99;
    };

    it('sem técnica nem pílula, ninguém levanta: o herói fica no chão e os suportes seguem lutando', () => {
      for (const ai of ['striker', 'guardian', 'brute', 'tactician', 'healer'] as const) {
        const b = advance(startBattle(setup({ allies: [hero({ hp: 5 }), support({ ai })], enemies: [dummy({ ...killer, hp: 900, maxHp: 900 })] }), data, oneHit()), data, oneHit());
        expect(b.log.some((e) => e.type === 'revive'), ai).toBe(false);
        expect(b.fighters[0]!.down, ai).toBe(true);
        expect(b.fighters[1]!.down, ai).toBe(false);
      }
    });

    it('quem tem a técnica levanta o protagonista primeiro, pagando o chakra', () => {
      const medic = support({ techniques: ['jKunai', 'jReanimate'], chakra: 30, maxChakra: 30 });
      const b = startBattle(setup({ allies: [hero({ hp: 5 }), medic], enemies: [killer] }), data, oneHit());
      expect(b.log.find((e) => e.type === 'revive')).toMatchObject({ uid: 'a1', target: 'a0', hp: 50 });
      expect(b.fighters[1]!.chakra).toBe(30 - data.techniques.jReanimate!.chakraCost);
      expect(awaitingPlayer(b)).toBe(true);
      expect(current(b)!.uid).toBe('a0');
    });

    it('sem chakra para a técnica, não levanta', () => {
      const medic = support({ techniques: ['jKunai', 'jReanimate'], chakra: 14, maxChakra: 14 });
      const b = startBattle(setup({ allies: [hero({ hp: 5 }), medic], enemies: [killer] }), data, oneHit());
      expect(b.log.some((e) => e.type === 'revive')).toBe(false);
    });

    it('o protagonista com a técnica levanta um suporte caído, gastando o turno', () => {
      const fallen = support({ hp: 0 });
      let b = startBattle(setup({ allies: [hero({ techniques: ['jStrike', 'jReanimate'] }), fallen], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.5));
      expect(validTargets(b, b.fighters[0]!, data.techniques.jReanimate!).map((f) => f.uid)).toEqual(['a1']);
      b = playerAct(b, { kind: 'tech', techId: 'jReanimate', target: 'a1' }, data, fixed(0.5));
      expect(b.log.some((e) => e.type === 'revive' && e.target === 'a1' && e.hp === 250)).toBe(true);
    });

    it('a técnica não acerta quem está de pé', () => {
      const b = startBattle(setup({ allies: [hero({ techniques: ['jStrike', 'jReanimate'] }), support()], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.5));
      expect(validTargets(b, b.fighters[0]!, data.techniques.jReanimate!)).toEqual([]);
      expect(() => playerAct(b, { kind: 'tech', techId: 'jReanimate', target: 'a1' }, data, fixed(0.5))).toThrow();
    });

    it('a pílula na bolsa levanta o protagonista sozinha, até lutando solo, e sai da contagem', () => {
      const b = startBattle(setup({ allies: [hero({ hp: 5 })], enemies: [killer], pills: 2 }), data, oneHit());
      expect(b.status).toBe('ongoing');
      expect(b.log.find((e) => e.type === 'revive')).toMatchObject({ target: 'a0', hp: 50, pill: true });
      expect(b.pills).toBe(1);
      expect(current(b)!.uid).toBe('a0');
    });

    it('sem pílula, sozinho, cair é derrota; a pílula acaba', () => {
      expect(startBattle(setup({ allies: [hero({ hp: 5 })], enemies: [killer] }), data, oneHit()).status).toBe('lost');
      const b = startBattle(setup({ allies: [hero({ hp: 5 })], enemies: [killer], pills: 1 }), data, fixed(0));
      expect(b.log.filter((e) => e.type === 'revive').length).toBe(1);
      expect(b.status).toBe('ongoing');
      expect(playerAct(b, { kind: 'guard' }, data, fixed(0)).status).toBe('lost');
    });

    it('o botão da pílula em aliado desconta da contagem da luta', () => {
      let b = startBattle(setup({ allies: [hero(), support({ hp: 0 })], enemies: [dummy({ hp: 500, maxHp: 500 })], pills: 1 }), data, fixed(0.5));
      b = useItem(b, 'reviveKit', 'a1', data);
      expect(b.pills).toBe(0);
    });

    it('a pílula usada sozinha sai da bolsa da run no fim da luta', () => {
      const run0 = { ...newRun(1, 'normal', data), bag: { hpKit: 0, chakraKit: 0, reviveKit: 2 } };
      const stop = currentStop(run0, data)!;
      expect(isFight(stop)).toBe(true);
      const s = battleSetup(run0, data);
      expect(s.pills).toBe(2);
      const fought = { ...startBattle({ ...s, allies: [{ ...s.allies[0]!, hp: 1 }], enemies: [killer] }, data, oneHit()) };
      fought.status = 'won';
      expect(finishFight(run0, fought, data).run.bag.reviveKit).toBe(1);
    });

    it('inimigo só levanta aliado se tiver a técnica', () => {
      const fallenFoe = dummy({ hp: 0 });
      const plain = startBattle(setup({ allies: [hero({ speed: 1 })], enemies: [dummy({ speed: 9, ai: 'healer', techniques: ['jeClub'] }), fallenFoe] }), data, fixed(0.99));
      expect(plain.log.some((e) => e.type === 'revive')).toBe(false);
      const healer = startBattle(setup({ allies: [hero({ speed: 1 })], enemies: [dummy({ speed: 9, ai: 'healer', techniques: ['jeClub', 'jeReanimate'] }), fallenFoe] }), data, fixed(0.99));
      expect(healer.log.find((e) => e.type === 'revive')).toMatchObject({ uid: 'e0', target: 'e1', hp: 30 });
    });
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

  it('cada classe começa com a sua relíquia inicial, que não recupera (a recuperação é da dificuldade)', () => {
    expect(newRun(1, 'normal', data).relics).toEqual(['irukaHeadband']);
    const unlocked = new Set(['j_unlockUchiha', 'j_unlockHyuuga']);
    expect(newGenericRun(1, 'normal', 'uchiha', data, unlocked).relics[0]).toBe('uchihaFan');
    expect(newGenericRun(1, 'normal', 'hyuuga', data, unlocked).relics[0]).toBe('gentleFistScroll');
    for (let s = 0; s < 40; s++) {
      const r = newGenericRun(s, 'normal', 'common', data);
      expect(r.relics[0]).toBe(r.hero === 'prodigy' ? 'greenJumpsuit' : 'academyManual');
    }
    for (const r of data.relics.filter((x) => x.tier === 'starter' || x.evolves)) {
      if (r.tier === 'starter') expect(r.starterFor?.length, r.id).toBeGreaterThan(0);
      expect(r.afterWin, r.id).toBeUndefined();
    }
  });

  it('evolução: pode aparecer na escolha do chefe, troca a inicial e nunca sai em outro sorteio', () => {
    const relics = data.relics;
    expect(bossChoices(relics, ['irukaHeadband'], 3, 1, createRng(1))).toContain('firstHokageNecklace');
    expect(bossChoices(relics, ['irukaHeadband'], 3, 1, createRng(1))).toHaveLength(3);
    expect(bossChoices(relics, ['irukaHeadband'], 3, 0, createRng(1))).not.toContain('firstHokageNecklace');
    // Já evoluiu: não aparece de novo, e outras classes não veem a evolução do Naruto.
    expect(bossChoices(relics, ['firstHokageNecklace'], 3, 1, createRng(1))).not.toContain('firstHokageNecklace');
    expect(bossChoices(relics, ['academyManual'], 3, 1, createRng(1))).toContain('chuninVest');

    const run = gainRelic({ ...newRun(1, 'normal', data), relics: ['irukaHeadband', 'goggles'] }, 'firstHokageNecklace', data);
    expect(run.relics).toEqual(['firstHokageNecklace', 'goggles']);

    const rng = createRng(5);
    for (let i = 0; i < 400; i++) {
      const id = dropRelic(relics, [], { common: 1, uncommon: 1, rare: 1, boss: 1, shop: 1, event: 1 }, rng)!;
      const def = relics.find((r) => r.id === id)!;
      expect(def.evolves, id).toBeUndefined();
      expect(def.tier, id).not.toBe('starter');
      expect(def.tier, id).not.toBe('special');
    }
  });

  it('save: não enfia a inicial em quem não é da História nem desfaz a evolução', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const evolved = { ...newRun(1, 'normal', data), relics: ['firstHokageNecklace'] };
    saveJornada(storage, evolved);
    expect(loadJornada(storage)!.relics).toEqual(['firstHokageNecklace']);
    saveJornada(storage, { ...newRun(1, 'normal', data), relics: [] });
    expect(loadJornada(storage)!.relics).toEqual(['irukaHeadband']);
  });

  it('save: troca os ids de relíquia antigos (v0.43.0) pelos novos', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    saveJornada(storage, { ...newRun(1, 'normal', data), relics: ['ichirakuDeluxe', 'hokageNecklace', 'goggles'] });
    expect(loadJornada(storage)!.relics).toEqual(['firstHokageNecklace', 'willOfFireCharm', 'goggles']);
    const generic = newGenericRun(1, 'normal', 'common', data);
    saveJornada(storage, { ...generic, relics: ['academyFlask', 'clanIncense', 'mainHouseTea'] });
    expect(loadJornada(storage)!.relics).toEqual(['academyManual', 'uchihaFan', 'eightTrigramsScroll']);
    for (const id of Object.values(RELIC_RENAMES)) expect(data.relics.some((r) => r.id === id), id).toBe(true);
  });

  it('o mercador tem uma vaga de loja; relíquias de loja e evento só saem no lugar delas', () => {
    const run: JRun = newRun(4, 'normal', data);
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
    const cloned = useActive(b, 'jKageBunshin', 'a0', data, fixed(0.5));
    expect(cloned.fighters[0]!.clones).toBe(data.j.combat.maxClones + 2);
    // Dano por clone e contra atordoado.
    const base = startBattle(setup(), data, fixed(0.5)).fighters;
    const strike = data.techniques.jStrike!;
    const plain = hitDamage(base[0]!, base[1]!, strike, data);
    expect(hitDamage({ ...base[0]!, clones: 5, mods: mod({ damagePerClone: 0.2 }) }, base[1]!, strike, data)).toBe(plain * 2);
    const stunned = { ...base[1]!, effects: [{ kind: 'stun' as const, turns: 1 }] };
    expect(hitDamage({ ...base[0]!, mods: mod({ stunnedDamageMult: 2 }) }, stunned, strike, data)).toBe(plain * 2);
    // Chakra: começo da luta e Concentrar.
    const low = startBattle(setup({ allies: [hero({ chakra: 0, mods: mod({ startChakra: 15, restBonus: 7 }) })] }), data, fixed(0.5));
    expect(low.fighters[0]!.chakra).toBe(15);
    const rested = playerAct(low, { kind: 'rest' }, data, fixed(0.5));
    expect(rested.fighters[0]!.chakra).toBe(15 + 15);
    // Defender cura; kit cura mais.
    const hurt = startBattle(setup({ allies: [hero({ hp: 20, mods: mod({ guardHeal: 10, kitBonusPct: 1 }) })] }), data, fixed(0.5));
    expect(useItem(hurt, 'hpKit', 'a0', data).fighters[0]!.hp).toBe(20 + data.j.combat.hpKit * 2);
    expect(playerAct(hurt, { kind: 'guard' }, data, fixed(0.99)).log.some((e) => e.type === 'heal' && e.amount === 10)).toBe(true);
    // Levantar com mais HP.
    const ally = { ...dummy(), defId: 'sasuke', speed: 2, techniques: ['jKunai'], ai: 'striker' as const, hp: 0, mods: mod({ reviveHpBonus: 0.3 }) };
    const rev = playerAct(startBattle(setup({ allies: [hero({ techniques: ['jStrike', 'jReanimate'] }), ally], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.5)), { kind: 'tech', techId: 'jReanimate', target: 'a1' }, data, fixed(0.5));
    expect(rev.log.some((e) => e.type === 'revive' && e.target === 'a1' && e.hp === 80)).toBe(true);
  });

  it('bolsa maior e descanso melhor pelas relíquias', () => {
    const run = { ...newRun(1, 'normal', data), bag: { hpKit: data.j.run.bagLimit, chakraKit: 0, reviveKit: 0 } };
    expect(bagFull(run, data)).toBe(true);
    expect(bagFull(gainRelic(run, 'sturdyBag', data), data)).toBe(false);
    expect(restHeal(gainRelic(run, 'campBlanket', data), data)).toEqual({ hp: data.j.run.restHeal.hp + 10, chakra: data.j.run.restHeal.chakra + 3 });
  });

  it('regen é valor fixo: não cresce com o HP e o chakra máximos', () => {
    // Mesmo valor com 100 e com 1000 de HP máximo.
    for (const maxHp of [100, 1000]) {
      const mods = { ...emptyMods(), regenHp: 3 };
      const b = startBattle(setup({ allies: [hero({ maxHp, hp: 10, mods })], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.99));
      expect(b.log.find((e) => e.type === 'regen')).toMatchObject({ amount: 3 });
      const kit = useItem(startBattle(setup({ allies: [hero({ maxHp, hp: 10 })], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.99)), 'hpKit', 'a0', data);
      expect(kit.fighters[0]!.hp).toBe(10 + data.j.combat.hpKit);
    }
    for (const maxChakra of [30, 300]) {
      const b = startBattle(setup({ allies: [hero({ maxChakra, chakra: 0 })], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.99));
      expect(playerAct(b, { kind: 'rest' }, data, fixed(0.99)).fighters[0]!.chakra).toBe(data.j.combat.restChakra);
      expect(useItem(b, 'chakraKit', 'a0', data).fighters[0]!.chakra).toBe(data.j.combat.chakraKit);
    }
  });

  it('técnica de cura é fixa para aliados e escala com a força no inimigo', () => {
    const ally = { ...dummy(), defId: 'sasuke', hp: 10, maxHp: 500, speed: 2, ai: 'striker' as const };
    const b = startBattle(setup({ allies: [hero({ techniques: ['jStrike', 'jMysticPalm'] }), ally], enemies: [dummy({ hp: 500, maxHp: 500 })] }), data, fixed(0.99));
    const healed = playerAct(b, { kind: 'tech', techId: 'jMysticPalm', target: 'a1' }, data, fixed(0.99));
    expect(healed.log.find((e) => e.type === 'heal')).toMatchObject({ amount: data.techniques.jMysticPalm!.healHp });
    expect(enemySeed('kabuto', 'hard', data).mods.healMult).toBeGreaterThan(1);
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
    expect(teamMods(run, data).regenHp).toBe(1);
    expect(heroMods(run, data).regenHp).toBe(1);
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const old = JSON.parse(JSON.stringify(run));
    delete old.talentRanks;
    mem.set(JORNADA_SAVE_KEY, JSON.stringify(old));
    expect(loadJornada(storage)!.talentRanks).toEqual({});
  });

  it('loja, descanso e evento', () => {
    let run: JRun = { ...newRun(1, 'normal', data), ryo: 500 };
    const offer = shopOffer(run, data);
    expect(offer.relics).toHaveLength(data.j.shop.relics);
    run = buy(run, { kind: 'training', price: offer.training }, data);
    expect(run.talentPoints).toBe(1);
    const restAt = data.stages[0]!.stops.findIndex((s) => s.kind === 'rest');
    const resting = rest({ ...run, stopIndex: restAt }, 'train', data);
    expect(resting.talentPoints).toBe(2);
    const tazuna = resolveEvent({ ...newRun(1, 'normal', data), stopIndex: 4 }, 'protect', false, data).run;
    expect(tazuna.flags).toContain('helpedTazuna');
    expect(shopOffer(tazuna, data).training).toBe(Math.floor(data.j.shop.trainingPrice * 0.8));
  });

  it('a História começa com a Bandana do Iruka, que nunca sai em sorteio', () => {
    const run = newRun(1, 'normal', data);
    expect(run.relics).toEqual(['irukaHeadband']);
    for (let s = 0; s < 40; s++) {
      const r = { ...newRun(s, 'normal', data), ryo: 999 };
      expect(shopOffer(r, data).relics.map((x) => x.id)).not.toContain('irukaHeadband');
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

  describe('loja sempre aberta (v0.50.0)', () => {
    const rich = (over: Partial<JRun> = {}): JRun => ({ ...newRun(1, 'normal', data), ryo: 9999, ...over });
    const training = (r: JRun) => shopOffer(r, data).training;
    const base = data.j.shop.trainingPrice;

    it('saiu do mapa e da História', () => {
      for (const st of data.stages) expect(st.stops.some((s) => (s.kind as string) === 'shop'), st.id).toBe(false);
      const rng = createRng(3);
      for (let i = 0; i < 30; i++) expect(generateMap(rng, data).nodes.some((n) => (n.kind as string) === 'shop')).toBe(false);
    });

    it('cada compra encarece tudo, para a run toda', () => {
      const once = buy(rich(), { kind: 'training', price: training(rich()) }, data);
      expect(once.shopPurchases).toBe(1);
      expect(training(once)).toBe(Math.floor(base * 1.1));
      const twice = buy(once, { kind: 'item', ...shopOffer(once, data).consumables[0]! }, data);
      expect(training(twice)).toBe(Math.floor(base * 1.2));
    });

    it('cada estágio encarece, e os ciclos do infinito contam', () => {
      expect(training(rich({ stageIndex: 1 }))).toBe(Math.floor(base * 1.25));
      expect(training(rich({ stageIndex: 2 }))).toBe(Math.floor(base * 1.5));
      expect(training(rich({ cycle: 1, stageIndex: 0 }))).toBe(Math.floor(base * (1 + 0.25 * data.stages.length)));
    });

    it('compra e estágio somam, e o desconto vem por cima', () => {
      const run = rich({ stageIndex: 1, shopPurchases: 2 });
      expect(training(run)).toBe(Math.floor(base * 1.45));
      expect(training(gainRelic(run, 'merchantToken', data))).toBe(Math.floor(base * 1.45 * 0.85));
    });

    it('o estoque fica salvo: comprar e reabrir não troca a prateleira', () => {
      const open = openShop(rich(), data);
      const ids = open.shop!.relics;
      const after = buy(open, { kind: 'relic', ...shopOffer(open, data).relics[0]! }, data);
      expect(after.shop!.relics).toEqual(ids);
      expect(openShop(after, data).shop!.relics).toEqual(ids);
      expect(shopOffer(after, data).relics.map((r) => r.id)).toEqual(ids);
      // Reabrir sem comprar devolve a mesma run.
      expect(openShop(open, data)).toBe(open);
    });

    it('a compra guarda o estoque mesmo sem abrir antes', () => {
      const run = rich();
      const offer = shopOffer(run, data);
      const after = buy(run, { kind: 'relic', ...offer.relics[1]! }, data);
      expect(after.shop!.relics).toEqual(offer.relics.map((r) => r.id));
    });

    it('o estoque muda a cada estágio', () => {
      const a = openShop(rich(), data);
      const b = openShop({ ...a, stageIndex: 1 }, data);
      expect(b.shop!.key).not.toBe(a.shop!.key);
      expect(b.shop!.relics).not.toEqual(a.shop!.relics);
    });

    it('andar no estágio não troca o estoque', () => {
      const a = openShop(rich(), data);
      expect(openShop({ ...a, stopIndex: 5 }, data).shop).toEqual(a.shop);
    });

    const storage = () => {
      const mem = new Map<string, string>();
      return { mem, getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    };
    /** Save de antes da v0.50.0: sem os campos da loja. */
    const oldSave = (run: JRun) => {
      const s = storage();
      const { shop: _s, shopPurchases: _p, ...old } = run;
      s.mem.set(JORNADA_SAVE_KEY, JSON.stringify(old));
      return loadJornada(s)!;
    };

    it('save antigo da História: o índice perde o mercador que saiu', () => {
      const stops = data.stages[0]!.stops;
      // Depois do mercador (índice antigo 7 era o Zabuza): volta um.
      const after = oldSave({ ...newRun(1, 'normal', data), stopIndex: 7 });
      expect(stops[after.stopIndex]!.id).toBe('zabuza');
      expect(after.shopPurchases).toBe(0);
      // Parado no mercador (6): segue para a parada seguinte.
      expect(stops[oldSave({ ...newRun(1, 'normal', data), stopIndex: 6 }).stopIndex]!.id).toBe('zabuza');
      // Antes do mercador: nada muda.
      expect(oldSave({ ...newRun(1, 'normal', data), stopIndex: 3 }).stopIndex).toBe(3);
      // Estágios 2 e 3.
      expect(data.stages[1]!.stops[oldSave({ ...newRun(1, 'normal', data), stageIndex: 1, stopIndex: 7 }).stopIndex]!.id).toBe(data.stages[1]!.stops[6]!.id);
      expect(oldSave({ ...newRun(1, 'normal', data), stageIndex: 2, stopIndex: 2 }).stopIndex).toBe(2);
      expect(oldSave({ ...newRun(1, 'normal', data), stageIndex: 2, stopIndex: 4 }).stopIndex).toBe(3);
    });

    it('save antigo do mapa: mercador futuro vira luta e quem estava num segue adiante', () => {
      const run = newGenericRun(5, 'normal', 'common', data);
      const nodes = run.map!.nodes.map((n, i) => (i === 3 || i === 5 ? { ...n, kind: 'shop' as never } : n));
      const here = nodes[3]!;
      const loaded = oldSave({ ...run, map: { ...run.map!, nodes }, nodeId: here.id, stopIndex: 2 });
      expect(loaded.map!.nodes.some((n) => (n.kind as string) === 'shop')).toBe(false);
      expect(loaded.map!.nodes[5]!.kind).toBe('fight');
      expect(loaded.nodeId).toBeNull();
      expect(loaded.path).toContain(here.id);
      expect(loaded.stopIndex).toBe(3);
    });

    it('save novo não passa pela migração', () => {
      const s = storage();
      const run = openShop({ ...newRun(1, 'normal', data), stopIndex: 7, shopPurchases: 2 }, data);
      saveJornada(s, run);
      expect(loadJornada(s)).toEqual(run);
    });
  });

  it('desconto do mercador soma relíquias e Tazuna, com teto', () => {
    const run = newRun(1, 'normal', data);
    const price = data.j.shop.trainingPrice;
    expect(shopOffer(gainRelic(run, 'merchantToken', data), data).training).toBe(Math.floor(price * 0.85));
    const both = gainRelic(gainRelic({ ...run, flags: ['helpedTazuna'] }, 'merchantToken', data), 'bottomlessPouch', data);
    expect(shopOffer(both, data).training).toBe(Math.floor(price * (1 - data.j.shop.maxDiscount)));
  });

  it('a recuperação depois da vitória vem da dificuldade, e as relíquias somam', () => {
    const base = newRun(1, 'normal', data);
    expect(afterWinRecovery(base, data)).toEqual({ hp: 25, chakra: 8 });
    expect(afterWinRecovery({ ...base, difficulty: 'easy' }, data)).toEqual({ hp: 35, chakra: 10 });
    expect(afterWinRecovery({ ...base, difficulty: 'hard' }, data)).toEqual({ hp: 20, chakra: 6 });
    expect(afterWinRecovery({ ...base, difficulty: 'hardcore' }, data)).toEqual({ hp: 15, chakra: 5 });
    expect(afterWinRecovery(gainRelic(base, 'ichirakuCoupon', data), data)).toEqual({ hp: 35, chakra: 11 });
    // No Difícil, cada um recupera 20 de HP.
    const hurt: JRun = { ...base, difficulty: 'hard', stopIndex: 3, members: { naruto: { hp: 20, chakra: 5 }, sasuke: { hp: 20, chakra: 5 }, sakura: { hp: 20, chakra: 5 } } };
    const fought = won(startBattle(battleSetup(hurt, data), data, createRng(1)));
    const { run } = finishFight(hurt, fought, data);
    const sasuke = memberSheet(run, 'sasuke', data);
    const before = fought.fighters.find((f) => f.defId === 'sasuke')!;
    expect(run.members.sasuke!.hp).toBe(Math.min(sasuke.maxHp, before.hp + 20));
    expect(run.members.sasuke!.chakra).toBe(before.chakra + 6);
  });

  it('a vitória recupera 25 de HP (Médio) da equipe do estágio, inclusive quem não lutou', () => {
    // Capangas (parada 4): Naruto, Sasuke e Sakura. Depois, o Haku: só Naruto e Sasuke lutam.
    const base = { ...newRun(1, 'normal', data), stopIndex: 3 };
    const hurt: JRun = { ...base, members: { naruto: { hp: 20, chakra: 5 }, sasuke: { hp: 20, chakra: 5 }, sakura: { hp: 20, chakra: 5 } } };
    const b = startBattle(battleSetup(hurt, data), data, createRng(1));
    const { run } = finishFight(hurt, won(b), data);
    const sasuke = memberSheet(run, 'sasuke', data);
    expect(run.members.sasuke!.hp).toBe(Math.min(sasuke.maxHp, 20 + 25));
    // Naruto × Kiba (estágio 2): o Naruto luta sozinho, e a Sakura, fora da luta, também recupera.
    const kiba: JRun = { ...hurt, stageIndex: 1, stopIndex: 5 };
    expect(currentStop(kiba, data)!.id).toBe('kiba');
    const res = finishFight(kiba, won(startBattle(battleSetup(kiba, data), data, createRng(1))), data).run;
    const sakura = memberSheet(res, 'sakura', data);
    expect(res.members.sakura!.hp).toBe(Math.min(sakura.maxHp, 20 + 25));
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
    // Save de antes da relíquia inicial ganha a relíquia ao carregar.
    saveJornada(storage, { ...run, relics: ['goggles'] });
    expect(loadJornada(storage)!.relics).toEqual(['irukaHeadband', 'goggles']);
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

  it('o Comum que sorteia sem elemento vira prodígio; com elemento, aprende o nível I', () => {
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
    const team = setup.allies.slice(1);
    expect(team.map((a) => a.defId).sort()).toEqual([...run.supports].sort());
    const genin = team[0]!;
    expect(genin.element).toBe(run.elements[genin.defId]);
    expect(genin.techniques).toContain(data.elementLines[run.elements[genin.defId]!][0]);
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

  it('Uchiha: fogo fixo e segundo elemento diferente; Hyuuga sem elemento nem técnica elemental', () => {
    const seconds = new Set<string | null>();
    for (let s = 0; s < 60; s++) {
      const u = newGenericRun(s, 'normal', 'uchiha', data);
      expect([u.hero, u.elements[u.hero]]).toEqual(['uchihaNinja', 'fire']);
      expect(u.secondElement).not.toBe('fire');
      seconds.add(u.secondElement);
      if (u.secondElement) expect(heroMovable(u, data)).toContain(data.elementLines[u.secondElement][0]);
      const h = newGenericRun(s, 'normal', 'hyuuga', data);
      expect(h.hero).toBe('hyuugaNinja');
      expect(h.elements[h.hero]).toBeNull();
      const elemental = new Set(Object.values(data.elementLines).flat());
      expect(heroMovable(h, data).filter((id) => elemental.has(id))).toEqual([]);
    }
    expect(seconds.has(null)).toBe(true);
    expect(seconds.has('lightning')).toBe(true);
  });

  it('suportes: classe sorteada entre as liberadas (pode repetir a do protagonista), ficha única e nome da classe', () => {
    const none = new Set<string>();
    const all = new Set(['j_unlockUchiha', 'j_unlockHyuuga']);
    for (let s = 0; s < 20; s++) {
      const r = newGenericRun(s, 'normal', 'common', data, none);
      expect(r.supports).toHaveLength(2);
      for (const id of r.supports) expect(['leafGeninA', 'leafGeninB', 'leafMedic']).toContain(id);
    }
    const seen = new Set<string>();
    for (let s = 0; s < 80; s++) {
      const r = newGenericRun(s, 'normal', 'uchiha', data, all);
      expect(r.supports).toHaveLength(2);
      expect(new Set(r.supports).size).toBe(2);
      r.supports.forEach((id) => seen.add(id));
      const names = r.supports.map((id) => r.names[id]);
      expect(new Set(names).size).toBe(2);
      for (const id of r.supports) {
        const cls = supportClass(id, data)!;
        expect(cls.supportNames).toContain(r.names[id]);
        expect(jornadaPtBR.supportNames[r.names[id]!], r.names[id]).toBeTruthy();
        if (data.characters[id]!.noElement) expect(r.elements[id]).toBeNull();
        else expect(r.elements[id]).not.toBeNull();
      }
    }
    // Todas as fichas aparecem, inclusive as do Uchiha (a classe do protagonista).
    expect([...seen].sort()).toEqual(['hyuugaGenin', 'hyuugaGeninB', 'leafGeninA', 'leafGeninB', 'leafMedic', 'uchihaGenin', 'uchihaGeninB']);
  });

  it('Comum: escolher o elemento (ou o prodígio) ou sortear; o sorteio dá uma relíquia comum e não muda o mapa', () => {
    const fire = newGenericRun(4, 'normal', 'common', data, new Set(), null, 'fire');
    expect([fire.hero, fire.elements.commonNinja, fire.elementPick]).toEqual(['commonNinja', 'fire', 'chosen']);
    expect(fire.moveset).toContain('jFireSpark');
    expect(fire.relics).toEqual(['academyManual']);
    const prodigy = newGenericRun(4, 'normal', 'common', data, new Set(), null, null);
    expect([prodigy.hero, prodigy.elements.prodigy, prodigy.relics]).toEqual(['prodigy', null, ['greenJumpsuit']]);
    for (let s = 0; s < 30; s++) {
      const random = newGenericRun(s, 'normal', 'common', data);
      expect(random.elementPick).toBe('random');
      expect(random.relics).toHaveLength(2);
      expect(data.relics.find((r) => r.id === random.relics[1])!.tier).toBe('common');
      const chosen = newGenericRun(s, 'normal', 'common', data, new Set(), null, 'water');
      expect(chosen.map).toEqual(random.map);
      expect(chosen.supports).toEqual(random.supports);
    }
    // Uchiha e Hyuuga não escolhem: fixo ou sem elemento, sem relíquia de sorteio.
    const u = newGenericRun(4, 'normal', 'uchiha', data, new Set(), null, 'water');
    expect([u.elements.uchihaNinja, u.elementPick, u.relics]).toEqual(['fire', 'fixed', ['uchihaFan']]);
  });

  it('save antigo do Hyuuga perde o elemento e a técnica elemental', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const h = newGenericRun(3, 'normal', 'hyuuga', data, new Set(['j_unlockHyuuga']));
    const old = { ...h, elements: { ...h.elements, hyuugaNinja: 'water' as const }, moveset: ['jWaterBullet', 'jStrike'] };
    const raw = JSON.parse(JSON.stringify(old));
    delete raw.names;
    delete raw.elementPick;
    mem.set(JORNADA_SAVE_KEY, JSON.stringify(raw));
    const loaded = loadJornada(storage)!;
    expect(loaded.elements.hyuugaNinja).toBeNull();
    expect(loaded.moveset).toEqual(['jStrike']);
    expect(loaded.names).toEqual({});
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
});

describe('ativas grátis e Portões (v0.42.0)', () => {
  const big = () => dummy({ hp: 999, maxHp: 999 });
  const prodigy = (over: Partial<FighterSeed> = {}) => hero({ defId: 'prodigy', maxHp: 100, hp: 100, techniques: ['jStrike', 'jPrimaryLotus', 'jGates'], ...over });
  const fight = (me: FighterSeed) => startBattle(setup({ allies: [me], enemies: [big()] }), data, fixed(0.5));
  const me = (b: JBattle) => b.fighters[0]!;

  it('custo de HP de técnica gera evento e o HP cai exatamente o custo', () => {
    const b = fight(prodigy());
    const after = playerAct(b, { kind: 'tech', techId: 'jPrimaryLotus', target: 'e0' }, data, fixed(0.99));
    const cost = after.log.slice(b.log.length).find((e) => e.type === 'hpCost');
    expect(cost).toEqual({ type: 'hpCost', uid: 'a0', amount: 10, source: 'jPrimaryLotus' });
    const hits = after.log.slice(b.log.length).filter((e) => e.type === 'damage' && e.target === 'a0').reduce((a, e) => a + (e.type === 'damage' ? e.amount : 0), 0);
    expect(me(after).hp).toBe(100 - 10 - hits);
  });

  it('ativa não gasta o turno e é uma por turno', () => {
    const b = fight(hero());
    const cloned = useActive(b, 'jKageBunshin', 'a0', data, fixed(0.5));
    expect(awaitingPlayer(cloned)).toBe(true);
    expect(me(cloned).clones).toBe(2);
    expect(() => useActive(cloned, 'jKageBunshin', 'a0', data, fixed(0.5))).toThrow();
    expect(() => playerAct(b, { kind: 'tech', techId: 'jKageBunshin', target: 'a0' }, data, fixed(0.5))).toThrow();
    // Ataca no mesmo turno; no turno seguinte a ativa volta.
    const next = playerAct(cloned, { kind: 'tech', techId: 'jStrike', target: 'e0' }, data, fixed(0.99));
    expect(next.activeUsed).toBe(false);
    expect(() => useActive(next, 'jKageBunshin', 'a0', data, fixed(0.5))).not.toThrow();
  });

  it('fortalecimento conta o turno da ativação', () => {
    let b = fight(hero({ techniques: ['jStrike', 'jSharingan'] }));
    b = useActive(b, 'jSharingan', 'a0', data, fixed(0.5));
    let boosted = 0;
    for (let i = 0; i < 5; i++) {
      if (me(b).boost) boosted++;
      b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    }
    expect(boosted).toBe(data.techniques.jSharingan!.boost!.turns);
  });

  it('portões somam do 1º ao aberto', () => {
    const vida = gateTotals(3, data);
    expect(vida.damageMult).toBeCloseTo(1.15 * 1.1 * 1.1);
    expect(vida.accuracy).toBeCloseTo(0.1);
    expect(vida.drainPct).toBeCloseTo(0.04);
    const limite = gateTotals(5, data);
    expect(limite.damageMult).toBeCloseTo(1.15 * 1.1 ** 4);
    expect(limite.critBonus).toBeCloseTo(0.05);
    expect(limite.drainPct).toBeCloseTo(0.08);
  });

  it('o talento Portão da Vida libera até o 3º e a Lótus Oculta até o 5º', () => {
    const node = (id: string) => data.talents.find((t) => t.id === id)!;
    const b = (mods = emptyMods()) => me(fight(prodigy({ mods })));
    expect(maxGate(b(), data)).toBe(1);
    expect(maxGate(b(mergeMods(emptyMods(), node('tGateOpen').mods!)), data)).toBe(3);
    expect(maxGate(b(mergeMods(mergeMods(emptyMods(), node('tGateOpen').mods!), node('tHiddenLotus').mods!)), data)).toBe(5);
    expect(maxGate(me(fight(hero())), data)).toBe(0);
  });

  it('abrir dá o bônus no mesmo turno; subir e descer não renovam o tempo; uma troca por turno', () => {
    let b = fight(prodigy({ mods: { ...emptyMods(), gateLevels: 4 } }));
    expect(gateChoices(b, me(b), data)).toEqual([1, 2, 3, 4, 5]);
    const plain = hitDamage(me(b), b.fighters[1]!, data.techniques.jStrike!, data);
    b = setGate(b, 1, data, fixed(0.5));
    expect(me(b).gate).toEqual({ level: 1, turns: 4 });
    expect(awaitingPlayer(b)).toBe(true);
    expect(gateChoices(b, me(b), data)).toEqual([]);
    expect(() => setGate(b, 5, data, fixed(0.5))).toThrow();
    expect(hitDamage(me(b), b.fighters[1]!, data.techniques.jStrike!, data)).toBe(Math.floor((8 + 10 - 3) * 1.15));
    expect(plain).toBe(15);
    b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    expect(me(b).gate).toEqual({ level: 1, turns: 3 });
    expect(gateChoices(b, me(b), data)).toEqual([2, 3, 4, 5, 0]);
    b = setGate(b, 5, data, fixed(0.5));
    expect(me(b).gate).toEqual({ level: 5, turns: 3 });
    b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    b = setGate(b, 2, data, fixed(0.5));
    expect(me(b).gate).toEqual({ level: 2, turns: 2 });
  });

  it('desgaste no fim de cada turno aberto, sem derrubar; fecha no tempo e entra em espera', () => {
    let b = fight(prodigy({ mods: { ...emptyMods(), gateLevels: 4 } }));
    b = setGate(b, 5, data, fixed(0.5));
    const hp0 = me(b).hp;
    b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    const drain = b.log.find((e) => e.type === 'hpCost' && e.source === 'gates');
    expect(drain).toEqual({ type: 'hpCost', uid: 'a0', amount: 8, source: 'gates' });
    for (let i = 0; i < 3; i++) b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    expect(me(b).gate).toBeNull();
    expect(b.log.some((e) => e.type === 'gate' && e.level === 0 && e.timeout)).toBe(true);
    const drained = b.log.filter((e) => e.type === 'hpCost' && e.source === 'gates').length;
    expect(drained).toBe(4);
    expect(me(b).hp).toBeLessThan(hp0);
    // Espera de 3 turnos para abrir de novo.
    for (let i = 0; i < 3; i++) {
      expect(gateChoices(b, me(b), data)).toEqual([]);
      b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    }
    expect(gateChoices(b, me(b), data)).toEqual([1, 2, 3, 4, 5]);

    // O desgaste para em 1 de HP.
    let low = fight(prodigy({ hp: 3, mods: { ...emptyMods(), gateLevels: 4 } }));
    low = setGate(low, 5, data, fixed(0.5));
    low = playerAct(low, { kind: 'guard' }, data, fixed(0.99));
    expect(me(low).hp).toBeGreaterThanOrEqual(1);
    expect(me(low).down).toBe(false);
  });

  it('fechar à mão também põe em espera; cair fecha', () => {
    let b = fight(prodigy());
    b = setGate(b, 1, data, fixed(0.5));
    b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    b = setGate(b, 0, data, fixed(0.5));
    expect(me(b).gate).toBeNull();
    b = playerAct(b, { kind: 'guard' }, data, fixed(0.99));
    expect(gateChoices(b, me(b), data)).toEqual([]);

    // Caiu com o portão aberto: fecha sem espera (levantado, pode abrir de novo).
    const ally = hero({ defId: 'sakura', protagonist: false, speed: 1, techniques: ['jKunai'] });
    let d = startBattle(setup({ allies: [prodigy({ hp: 1 }), ally], enemies: [dummy({ offense: { taijutsu: 50, ninjutsu: 0, genjutsu: 0 } })] }), data, fixed(0.5));
    d = setGate(d, 1, data, fixed(0.5));
    const n = d.log.length;
    d = playerAct(d, { kind: 'guard' }, data, fixed(0.1));
    expect(d.log.slice(n).some((e) => e.type === 'down' && e.target === 'a0')).toBe(true);
    expect(d.log.slice(n).some((e) => e.type === 'gate')).toBe(false);
    expect(me(d).gate).toBeNull();
    expect(me(d).cooldowns.jGates).toBeUndefined();
  });

  it('a IA do bot abre o portão mais alto que o HP aguenta', () => {
    const b = fight(prodigy({ mods: { ...emptyMods(), gateLevels: 4 } }));
    // 100% do HP: o 5º (8% × 4 turnos) deixa 68%.
    expect(chooseAiActive(b, me(b), data, fixed(0.5))).toEqual({ kind: 'gate', level: 5 });
    const hurt = fight(prodigy({ hp: 55, mods: { ...emptyMods(), gateLevels: 4 } }));
    // 55%: só o 1º (2% × 4) ou o 2º (3% × 4 = 12%) deixam ≥ 40%.
    expect(chooseAiActive(hurt, me(hurt), data, fixed(0.5))).toEqual({ kind: 'gate', level: 2 });
  });

  it('save com o Quinto portão antigo carrega sem a técnica', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) };
    const run = { ...newGenericRun(1, 'normal', 'common', data), learned: ['jGatesHigh', 'jPrimaryLotus'] };
    store[JORNADA_SAVE_KEY] = JSON.stringify(run);
    expect(loadJornada(storage)!.learned).toEqual(['jPrimaryLotus']);
  });
});

describe('dōjutsu que evolui', () => {
  const uchiha = () => ({ ...newGenericRun(1, 'normal', 'uchiha', data), talentPoints: 10 });
  const heroSeed = (run: JRun) => battleSetup(chooseNode(run, nodeChoices(run)[0]!.id), data).allies.find((a) => a.protagonist)!;

  it('o 3 tomoe substitui o Sharingan: uma ativa só, na lista e na luta', () => {
    expect(heroActives(uchiha(), data)).toEqual(['jSharingan']);
    const run = buyTalent(uchiha(), 'tSharingan3', new Set(), data);
    expect(heroActives(run, data)).toEqual(['jSharingan3']);
    expect(heroSeed(run).techniques).toContain('jSharingan3');
    expect(heroSeed(run).techniques).not.toContain('jSharingan');
  });

  it('o Byakugan desperto substitui o Byakugan', () => {
    const run = { ...newGenericRun(1, 'normal', 'hyuuga', data), learned: ['jByakugan2'] };
    expect(heroActives(run, data)).toEqual(['jByakugan2']);
  });

  it('save antigo com as duas formas carrega com uma ativa', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) };
    store[JORNADA_SAVE_KEY] = JSON.stringify({ ...uchiha(), learned: ['jSharingan3'] });
    expect(heroActives(loadJornada(storage)!, data)).toEqual(['jSharingan3']);
  });

  it('o desconto da relíquia e do talento vale para a forma evoluída', () => {
    const run = buyTalent(uchiha(), 'tSharingan3', new Set(), data);
    expect(run.relics).toContain('uchihaFan');
    expect(heroMods(run, data).techChakraDiscount.jSharingan3).toBe(1);
    const hyuuga = { ...newGenericRun(1, 'normal', 'hyuuga', data), talents: ['tByakuganRange'] };
    expect(heroMods(hyuuga, data).techChakraDiscount.jByakugan2).toBe(2);
  });

  it('a técnica informa o chakra pago, já com desconto', () => {
    const seed = hero({ techniques: ['jStrike', 'jSharingan3'], mods: { ...emptyMods(), techChakraDiscount: { jSharingan3: 1 } } });
    const b = startBattle(setup({ allies: [seed], enemies: [dummy({ hp: 999, maxHp: 999 })] }), data, fixed(0.5));
    const after = useActive(b, 'jSharingan3', 'a0', data, fixed(0.5));
    const ev = after.log.slice(b.log.length).find((e) => e.type === 'tech');
    expect(ev).toMatchObject({ techId: 'jSharingan3', cost: 3 });
    expect(after.fighters[0]!.chakra).toBe(b.fighters[0]!.chakra - 3);
  });

  it('chakra ganho por abate gera evento', () => {
    const seed = hero({ chakra: 10, mods: { ...emptyMods(), onKillChakra: 4 } });
    const b = startBattle(setup({ allies: [seed], enemies: [dummy({ hp: 1, maxHp: 1 }), dummy({ hp: 999, maxHp: 999 })] }), data, fixed(0.5));
    const after = playerAct(b, { kind: 'tech', techId: 'jStrike', target: 'e0' }, data, fixed(0));
    expect(after.log.slice(b.log.length).find((e) => e.type === 'chakraGain')).toEqual({ type: 'chakraGain', uid: 'a0', amount: 4 });
  });
});

describe('dano mostrado acompanha talentos e níveis', () => {
  const rankNodes = data.talents.filter((n) => (n.maxRank ?? 1) > 1 && n.rankMods?.techDamageMult);

  it('existe nó de técnica com nível em todas as classes', () => {
    expect(new Set(rankNodes.map((n) => n.owner))).toEqual(new Set(['naruto', 'commonNinja', 'prodigy', 'uchihaNinja', 'hyuugaNinja']));
  });

  for (const node of rankNodes) {
    it(`${node.owner}: ${node.id} sobe o dano a cada nível`, () => {
      const run0 = node.owner === 'naruto' ? newRun(1, 'normal', data) : { ...newGenericRun(1, 'normal', 'common', data), hero: node.owner };
      const techIds = Object.keys(node.rankMods!.techDamageMult!);
      for (const techId of techIds) {
        const tech = data.techniques[techId]!;
        let prev = -1;
        let prevHit = -1;
        for (let r = 1; r <= node.maxRank!; r++) {
          const run: JRun = { ...run0, talents: [node.id], talentRanks: { [node.id]: r } };
          const mods = heroMods(run, data);
          const power = techPower(tech, mods);
          expect(power, `${techId} nível ${r}`).toBeGreaterThan(prev);
          const b = startBattle(setup({ allies: [hero({ mods, techniques: [techId] })], enemies: [dummy({ hp: 999, maxHp: 999 })] }), data, fixed(0.5));
          const hit = hitDamage(b.fighters[0]!, b.fighters[1]!, tech, data);
          expect(hit, `${techId} dano real nível ${r}`).toBeGreaterThan(prevHit);
          expect(battlePower(b.fighters[0]!, tech, data)).toBe(power);
          prev = power;
          prevHit = hit;
        }
      }
    });
  }

  it('na luta, o dano mostrado sobe com o portão aberto', () => {
    let b = startBattle(setup({ allies: [hero({ techniques: ['jStrike', 'jGates'] })], enemies: [dummy({ hp: 999, maxHp: 999 })] }), data, fixed(0.5));
    const before = battlePower(b.fighters[0]!, data.techniques.jStrike!, data);
    b = setGate(b, 1, data, fixed(0.5));
    expect(battlePower(b.fighters[0]!, data.techniques.jStrike!, data)).toBe(Math.floor(8 * 1.15));
    expect(before).toBe(8);
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

describe('modo infinito do Caminho Ninja e árvore completa (v0.44.0)', () => {
  const memStorage = () => {
    const mem = new Map<string, string>();
    return { mem, storage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) } };
  };

  /** Joga o ciclo inteiro vencendo toda luta (primeira opção em tudo). */
  function playCycle(run0: JRun): JRun {
    let run = run0;
    let guard = 0;
    while (run.status === 'inProgress' && guard++ < 300) {
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
    return run;
  }

  /** Run com toda a árvore do protagonista comprada (no nível máximo), menos `skip`. */
  function withTree(run: JRun, keep: (n: TalentNode) => boolean = () => true): JRun {
    const nodes = data.talents.filter((n) => n.owner === run.hero && keep(n));
    return {
      ...run,
      talents: nodes.map((n) => n.id),
      talentRanks: Object.fromEntries(nodes.filter((n) => talentMaxRank(n) > 1).map((n) => [n.id, talentMaxRank(n)])),
    };
  }

  it('o ciclo 0 sorteia como antes; o ciclo seguinte sorteia outra coisa', () => {
    const run = newGenericRun(4, 'normal', 'common', data);
    const legacy = { ...run, cycle: undefined as unknown as number };
    expect(stopRng(run, 3)()).toBe(stopRng(legacy, 3)());
    expect(stopRng({ ...run, cycle: 1 }, 3)()).not.toBe(stopRng(run, 3)());
  });

  it('a cada ciclo os inimigos multiplicam: dificuldade × 1,5 ^ ciclo', () => {
    const run = chooseNode(newGenericRun(5, 'hardcore', 'common', data), nodeChoices(newGenericRun(5, 'hardcore', 'common', data))[0]!.id);
    const id = (currentStop(run, data) as { enemies: string[] }).enemies[0]!;
    expect(cycleEnemyMult(run, data)).toBe(1);
    expect(battleSetup(run, data).enemies[0]).toEqual(enemySeed(id, 'hardcore', data));
    // No ciclo seguinte o sorteio da parada também muda: o inimigo vem da parada do ciclo 1.
    const next = { ...run, cycle: 1 };
    const id1 = (currentStop(next, data) as { enemies: string[] }).enemies[0]!;
    expect(cycleEnemyMult(next, data)).toBeCloseTo(1.5);
    expect(cycleEnemyMult({ ...run, cycle: 2 }, data)).toBeCloseTo(2.25);
    expect(cycleEnemyMult({ ...run, cycle: 4 }, data)).toBeCloseTo(5.0625);
    const foe = battleSetup(next, data).enemies[0]!;
    expect(foe).toEqual(enemySeed(id1, 'hardcore', data, 1.5));
    expect(foe.maxHp).toBe(Math.max(1, Math.floor(data.enemies[id1]!.hp * data.j.enemyStrength.hardcore * 1.5)));
    // O multiplicador vale uma vez só no dano: entra no ataque, não em `damageMult`.
    expect(foe.mods.damageMult).toBe(1);
  });

  it('só o Caminho Ninja vencido no Hardcore segue de ciclo', () => {
    expect(() => continueCycle({ ...newRun(1, 'hardcore', data), status: 'victory' }, data)).toThrow();
    expect(() => continueCycle(newGenericRun(1, 'hardcore', 'common', data), data)).toThrow();
    expect(canContinueCycle({ ...newRun(1, 'hardcore', data), status: 'victory' }, data)).toBe(false);
    expect(canContinueCycle({ ...newGenericRun(1, 'hardcore', 'common', data), status: 'victory' }, data)).toBe(true);
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const won = { ...newGenericRun(1, d, 'common', data), status: 'victory' as const };
      expect(canContinueCycle(won, data), d).toBe(false);
      expect(() => continueCycle(won, data), d).toThrow();
      // Save antigo já em ciclo 2 nessa dificuldade: termina o ciclo e não segue.
      expect(canContinueCycle({ ...won, cycle: 1 }, data), d).toBe(false);
    }
  });

  it('a força dos inimigos é da Jornada: mudar a do Roleta não muda aqui', () => {
    expect(enemySeed('zabuza', 'normal', data).maxHp).toBe(Math.floor(data.enemies.zabuza!.hp * data.j.enemyStrength.normal));
    const other = { ...data, base: { ...data.base, difficulty: { ...data.base.difficulty, multipliers: { easy: 9, normal: 9, hard: 9, hardcore: 9 } } } };
    expect(enemySeed('zabuza', 'normal', other)).toEqual(enemySeed('zabuza', 'normal', data));
  });

  describe('classe Comum (v0.51.0)', () => {
    const run = newGenericRun(3, 'normal', 'common', data, new Set(), null, 'fire');
    it('Bunshin no Jutsu é técnica de turno com 1 clone; o Kage Bunshin segue ativa com 2', () => {
      expect(data.techniques.jBunshin).toMatchObject({ type: 'ninjutsu', clones: 1, chakraCost: 3 });
      expect(data.techniques.jBunshin!.active).toBeFalsy();
      expect(data.techniques.jKageBunshin).toMatchObject({ clones: 2, active: true });
    });

    it('começa com Golpe, Shuriken, Bunshin e o elemento; o Kunai fica conhecido, fora do moveset', () => {
      expect(run.moveset).toEqual(['jStrike', 'jShuriken', 'jBunshin', data.elementLines.fire[0]]);
      expect(heroMovable(run, data)).toContain('jKunai');
      expect(heroActives(run, data)).toEqual(['jEffort']);
    });

    it('Esforço: grátis, soma nos ataques e o turno continua', () => {
      const s = setup({ allies: [hero({ techniques: ['jStrike', 'jEffort'] })], enemies: [dummy({ hp: 500, maxHp: 500 })] });
      const b = startBattle(s, data, fixed(0.5));
      const plain = hitDamage(b.fighters[0]!, b.fighters[1]!, data.techniques.jStrike!, data);
      const up = useActive(b, 'jEffort', 'a0', data, fixed(0.5));
      expect(awaitingPlayer(up)).toBe(true);
      expect(up.fighters[0]!.chakra).toBe(30 - 3);
      expect(hitDamage(up.fighters[0]!, up.fighters[1]!, data.techniques.jStrike!, data)).toBe(plain + 3);
      expect(up.fighters[0]!.boost!.turns).toBe(3);
      // O botão mostra o bônus.
      expect(battlePower(up.fighters[0]!, data.techniques.jStrike!, data)).toBe(data.techniques.jStrike!.baseDamage + 3);
    });

    it('Bunshin gasta o turno e cria o clone, e a IA usa quando não tem nenhum', () => {
      const s = setup({ allies: [hero({ techniques: ['jStrike', 'jBunshin'] })], enemies: [dummy({ hp: 500, maxHp: 500 })] });
      const b = startBattle(s, data, fixed(0.5));
      expect(playerAct(b, { kind: 'tech', techId: 'jBunshin', target: 'a0' }, data, fixed(0.99)).fighters[0]!.clones).toBe(1);
      expect(chooseAiAction(b, b.fighters[0]!, data, fixed(0.1))).toMatchObject({ techId: 'jBunshin' });
      expect(chooseAiAction({ ...b, fighters: [{ ...b.fighters[0]!, clones: 1 }, b.fighters[1]!] }, { ...b.fighters[0]!, clones: 1 }, data, fixed(0.1))).toMatchObject({ techId: 'jStrike' });
    });
  });

  it('seguir de ciclo volta ao estágio 1 com tudo e sorteia mapa e chefes novos', () => {
    const done = playCycle(newGenericRun(11, 'hardcore', 'common', data));
    expect(done.status).toBe('victory');
    const next = continueCycle(done, data);
    expect(next.cycle).toBe(1);
    expect([next.status, next.stageIndex, next.stopIndex, next.bossChoice, next.path, next.nodeId]).toEqual(['inProgress', 0, 0, null, [], null]);
    expect(choosingNode(next)).toBe(true);
    expect(next.members).toEqual({});
    expect(next.flags).toEqual([]);
    for (const k of ['level', 'xp', 'ryo', 'talents', 'talentRanks', 'learned', 'moveset', 'relics', 'bag', 'supports', 'elements', 'stats'] as const) {
      expect(next[k]).toEqual(done[k]);
    }
    // Mesma seed, mesmo ciclo: mesmo mapa; ciclos diferentes: mapas diferentes.
    expect(continueCycle(done, data).map).toEqual(next.map);
    const third = continueCycle({ ...done, cycle: 1 }, data);
    expect(third.cycle).toBe(2);
    expect(JSON.stringify(third.map)).not.toBe(JSON.stringify(next.map));
    // O ciclo 2 inteiro também chega ao fim.
    expect(playCycle(next).status).toBe('victory');
  });

  it('a Vontade do Fogo volta ao mínimo da dificuldade a cada ciclo, sem tirar as que sobraram', () => {
    const base = { ...newGenericRun(3, 'hardcore', 'common', data), status: 'victory' as const };
    // O Hardcore não tem Vontade do Fogo de graça: só a que sobrou (de relíquia) continua.
    expect(continueCycle({ ...base, willOfFire: 0 }, data).willOfFire).toBe(0);
    expect(continueCycle({ ...base, willOfFire: 2 }, data).willOfFire).toBe(2);
    const withMin = { ...data, j: { ...data.j, run: { ...data.j.run, willOfFire: { ...data.j.run.willOfFire, hardcore: 1 } } } };
    expect(continueCycle({ ...base, willOfFire: 0 }, withMin).willOfFire).toBe(1);
  });

  it('com as relíquias esgotadas, o ciclo ainda termina e segue', () => {
    const all = data.relics.filter((r) => r.tier !== 'starter' && !r.evolves).map((r) => r.id);
    const run = { ...newGenericRun(12, 'easy', 'common', data), relics: all };
    const done = playCycle(run);
    expect(done.status).toBe('victory');
    // O Fácil garante a vitória do bot; quem segue de ciclo é o Hardcore.
    expect(continueCycle({ ...done, difficulty: 'hardcore' }, data).status).toBe('inProgress');
  });

  it('árvore completa: nada a aprender nem a subir; bifurcação, elemento e conquista contam como nunca', () => {
    const common = newGenericRun(6, 'normal', 'common', data);
    expect(talentTreeComplete(common, data)).toBe(false);
    expect(talentTreeComplete(withTree(common), data)).toBe(true);
    // Um nível que ainda dá para subir deixa a árvore aberta.
    const leveled = data.talents.find((n) => n.owner === common.hero && talentMaxRank(n) > 1)!;
    const full = withTree(common);
    expect(talentTreeComplete({ ...full, talentRanks: { ...full.talentRanks, [leveled.id]: 1 } }, data)).toBe(false);
    // Uchiha sem raio e sem o easter egg: as 3 árvores bastam; com o ramo do Sasuke liberado, não.
    const uchiha = { ...newGenericRun(6, 'normal', 'uchiha', data, new Set(['j_unlockUchiha'])), secondElement: 'water' as const };
    const uTree = withTree(uchiha, (n) => !n.account && !n.requiresElement);
    expect(talentTreeComplete(uTree, data)).toBe(true);
    expect(talentTreeComplete(uTree, data, new Set(['j_sasukeEgg']))).toBe(false);
    // Naruto no estágio 1 com tudo o que já abre: os ramos de estágio ainda vêm.
    const naruto = withTree(newRun(6, 'normal', data), (n) => n.fromStage === undefined && !n.account);
    expect(treeComplete('naruto', data.talents, talentContext(naruto, new Set()))).toBe(false);
  });

  it('com a árvore completa, todo ponto de talento vira 30 ryō', () => {
    const run = withTree(chooseNode(newGenericRun(7, 'normal', 'common', data), nodeChoices(newGenericRun(7, 'normal', 'common', data))[0]!.id));
    // Luta comum (sem ponto) que sobe um nível: o ponto do nível vira ryō.
    const leveling = { ...run, xp: xpToNext(run.level, data) - 1 };
    const { run: after, outcome } = finishFight(leveling, won(startBattle(battleSetup(leveling, data), data, createRng(1))), data);
    expect(outcome.levelUps).toBe(1);
    expect(outcome.talentRyo).toBe(30);
    expect(after.talentPoints).toBe(0);
    expect(after.ryo).toBe(run.ryo + outcome.ryo + 30);
    expect(after.stats.talentRyo).toBe(30);
    // Relíquia que dá ponto, descanso e treino.
    expect(gainRelic(run, 'mastersJournal', data).ryo).toBe(run.ryo + 30);
    const rested = rest({ ...run, nodeId: run.nodeId }, 'train', data);
    expect([rested.talentPoints, rested.ryo]).toEqual([0, run.ryo + 30]);
    expect(canBuy({ ...run, ryo: 999 }, { kind: 'training', price: 60 }, data)).toBe(false);
    expect(canBuy({ ...newGenericRun(7, 'normal', 'common', data), ryo: 999 }, { kind: 'training', price: 60 }, data)).toBe(true);
  });

  it('comprar o último talento converte os pontos que sobraram; save antigo com a árvore completa também', () => {
    const run = newGenericRun(8, 'normal', 'common', data);
    const last = data.talents.filter((n) => n.owner === run.hero && talentMaxRank(n) === 1).at(-1)!;
    const almost = { ...withTree(run, (n) => n.id !== last.id), talentPoints: last.cost + 2 };
    const bought = buyTalent(almost, last.id, new Set(), data);
    expect(bought.talentPoints).toBe(0);
    expect(bought.ryo).toBe(run.ryo + 60);
    const old = { ...withTree(run), talentPoints: 3 };
    const synced = syncUnlocks(old, new Set(), data);
    expect([synced.talentPoints, synced.ryo]).toEqual([0, run.ryo + 90]);
    // Sem nada a converter nem conquista nova, a mesma run volta.
    expect(syncUnlocks(run, new Set(['j_unlockUchiha']), data)).toBe(run);
  });

  it('a Ōdama abre no ciclo seguinte com a conquista da História no retrato da run', () => {
    const run = { ...newGenericRun(2, 'hardcore', 'uchiha', data, new Set(['j_unlockUchiha'])), status: 'victory' as const };
    expect(continueCycle(run, data, new Set(['j_sasukeEgg', 'j_unlockUchiha'])).unlocks).toEqual(['j_sasukeEgg']);
    expect(newRun(1, 'normal', data, new Set(['j_canonWin', 'j_bell'])).unlocks).toEqual(['j_canonWin']);
  });

  it('conquistas de ciclo só saem na vitória do ciclo certo, no Caminho Ninja', () => {
    const g = newGenericRun(1, 'normal', 'common', data);
    expect(newJornadaAchievements({ ...g, status: 'victory' }, new Set())).not.toContain('j_cycle2');
    expect(newJornadaAchievements({ ...g, cycle: 1 }, new Set())).not.toContain('j_cycle2');
    expect(newJornadaAchievements({ ...g, cycle: 1, status: 'victory' }, new Set())).toEqual(expect.arrayContaining(['j_cycle2', 'j_genericWin']));
    expect(newJornadaAchievements({ ...g, cycle: 4, status: 'victory' }, new Set())).toEqual(expect.arrayContaining(['j_cycle2', 'j_cycle3', 'j_cycle5']));
    for (const id of ['j_cycle2', 'j_cycle3', 'j_cycle5']) expect(jornadaPtBR.achievements.list[id]).toBeTruthy();
  });

  it('save com ciclo vai e volta; save antigo carrega no ciclo 0', () => {
    const { mem, storage } = memStorage();
    const run = { ...newGenericRun(9, 'normal', 'common', data), cycle: 2, unlocks: ['j_sasukeEgg'] };
    saveJornada(storage, run);
    expect(loadJornada(storage)).toEqual(run);
    const old = JSON.parse(JSON.stringify(run));
    delete old.cycle;
    delete old.unlocks;
    mem.set(JORNADA_SAVE_KEY, JSON.stringify(old));
    const loaded = loadJornada(storage)!;
    expect([loaded.cycle, loaded.unlocks]).toEqual([0, []]);
  });

  it('recorde do infinito: só sobe, e vencer passa qualquer estágio do mesmo ciclo', () => {
    const run = newGenericRun(1, 'normal', 'common', data);
    expect(reachOf({ ...run, cycle: 1, stageIndex: 2 })).toEqual({ cycle: 2, stage: 3, won: false });
    expect(reachBeats({ cycle: 1, stage: 3, won: true }, { cycle: 1, stage: 3, won: false })).toBe(true);
    expect(reachBeats({ cycle: 2, stage: 1, won: false }, { cycle: 1, stage: 3, won: true })).toBe(true);
    expect(reachBeats({ cycle: 2, stage: 1, won: false }, { cycle: 2, stage: 2, won: false })).toBe(false);
    const p1 = recordJornadaReach(emptyProfile(), { cycle: 2, stage: 2, won: false });
    expect(p1.jornada?.generic).toEqual({ cycle: 2, stage: 2, won: false });
    expect(recordJornadaReach(p1, { cycle: 1, stage: 3, won: true })).toBe(p1);
    const { storage } = memStorage();
    saveProfile(storage, p1);
    expect(loadProfile(storage).jornada?.generic).toEqual({ cycle: 2, stage: 2, won: false });
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...p1, jornada: { generic: { cycle: 'x' } } }));
    expect(loadProfile(storage).jornada).toBeUndefined();
    expect(loadProfile(memStorage().storage)).toEqual(emptyProfile());
  });
});
