import { describe, expect, it } from 'vitest';
import { downed, emptyMods, openBattle, playerAct, startBattle, type BattleSetup, type FighterSeed } from '../src/core/jornada/battle';
import type { JornadaData } from '../src/core/jornada/data';
import { battleSetup, finishFight, grantedTechniques, heroKnown, newRun, resolveEvent } from '../src/core/jornada/run';
import type { ScriptRule } from '../src/core/jornada/script';
import type { JBattle } from '../src/core/jornada/types';
import { jornadaData as data } from '../src/data/jornada';
import { chooseAiAction } from '../src/core/jornada/ai';
import { createRng } from '../src/core/rng';

/** Rng fixo: 0 acerta tudo. */
const fixed = (v: number) => () => v;

const hero = (over: Partial<FighterSeed> = {}): FighterSeed => ({
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
  techniques: ['jStrike', 'jShuriken'],
  ai: 'striker',
  mods: emptyMods(),
  ...over,
});
const foe = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...hero(), defId: 'gatoThug', protagonist: false, speed: 1, techniques: ['jeClub'], ai: 'brute', ...over });
const setup = (over: Partial<BattleSetup> = {}): BattleSetup => ({ allies: [hero()], enemies: [foe()], win: { kind: 'defeatAll' }, ...over });
const hit = (s: JBattle, techId = 'jStrike', target = 'e0', d: JornadaData = data) => playerAct(s, { kind: 'tech', techId, target }, d, fixed(0));
const says = (s: JBattle) => s.log.filter((e) => e.type === 'say').map((e) => (e.type === 'say' ? e.line : ''));
const rule = (when: ScriptRule['when'], ...actions: ScriptRule['do']): ScriptRule => ({ when, do: actions });

describe('roteiro de luta (v0.66.0)', () => {
  it('abertura: a fala sai antes de qualquer turno', () => {
    const s = openBattle(setup({ script: [rule({ on: 'start' }, { do: 'say', who: 'gatoThug', line: 'oi' })] }), data);
    expect(says(s)).toEqual(['oi']);
    expect(s.log.find((e) => e.type === 'say')).toMatchObject({ uid: 'e0', who: 'gatoThug' });
  });

  it('HP abaixo de X%: liga a forma uma vez só (status, HP máximo e técnicas)', () => {
    const d: JornadaData = {
      ...data,
      enemies: { ...data.enemies, gatoThug: { ...data.enemies.gatoThug!, forms: [{ id: 'rage', statMult: 2, maxHpMult: 2, techniques: ['jeClub'] }] } },
    };
    const s0 = startBattle(setup({ script: [rule({ on: 'hpBelow', who: 'gatoThug', pct: 0.99 }, { do: 'form', who: 'gatoThug', form: 'rage' })] }), d, fixed(0));
    const s1 = hit(s0, 'jStrike', 'e0', d);
    const f = s1.fighters.find((x) => x.uid === 'e0')!;
    expect(f.form).toBe('rage');
    expect(f.maxHp).toBe(200);
    expect(f.offense.taijutsu).toBe(20);
    const s2 = hit(s1, 'jStrike', 'e0', d);
    expect(s2.fighters.find((x) => x.uid === 'e0')!.offense.taijutsu).toBe(20);
    expect(s2.log.filter((e) => e.type === 'form')).toHaveLength(1);
  });

  it('troca de fase: quem sai não conta para a vitória nem volta; quem entra vem da reserva', () => {
    const s0 = startBattle(
      setup({
        script: [rule({ on: 'hpBelow', who: 'gatoThug', pct: 0.99 }, { do: 'replace', who: 'gatoThug', with: 'kakashi' })],
        reserve: [{ side: 'enemy', seed: foe({ defId: 'kakashi', hp: 50, maxHp: 50 }) }],
      }),
      data,
      fixed(0),
    );
    const s1 = hit(s0);
    const out = s1.fighters.find((x) => x.uid === 'e0')!;
    expect([out.gone, out.down]).toEqual([true, true]);
    expect(s1.fighters.find((x) => x.defId === 'kakashi')).toMatchObject({ uid: 'e1', guest: true, down: false });
    expect(s1.status).toBe('ongoing');
    expect(downed(s1, 'enemy')).toEqual([]);
  });

  it('fim roteirizado: a luta acaba com o resultado declarado', () => {
    const s = hit(startBattle(setup({ script: [rule({ on: 'hpBelow', who: 'gatoThug', pct: 0.99 }, { do: 'end', status: 'won' })] }), data, fixed(0)));
    expect(s.status).toBe('won');
    expect(s.log.at(-1)).toMatchObject({ type: 'end', status: 'won', scripted: true });
  });

  it('técnica usada e rodada: disparam pelo gatilho certo', () => {
    const script = [rule({ on: 'tech', tech: 'jShuriken' }, { do: 'say', who: 'naruto', line: 'shuriken' }), rule({ on: 'round', round: 2 }, { do: 'say', who: 'naruto', line: 'r2' })];
    const s0 = startBattle(setup({ enemies: [foe({ hp: 999, maxHp: 999 })], script }), data, fixed(0));
    const s1 = hit(s0, 'jStrike');
    expect(says(s1)).toEqual(['r2']);
    expect(says(hit(s1, 'jShuriken'))).toEqual(['r2', 'shuriken']);
  });

  it('alguém caiu: dispara depois do golpe que derrubou', () => {
    const s = hit(startBattle(setup({ enemies: [foe({ hp: 1 }), foe({ hp: 999, maxHp: 999 })], script: [rule({ on: 'down', who: 'gatoThug' }, { do: 'say', who: 'naruto', line: 'caiu' })] }), data, fixed(0)));
    expect(says(s)).toEqual(['caiu']);
  });

  it('finalizador: o alvo aguenta com 1 de HP e só cai com a técnica certa', () => {
    const win = { kind: 'finisher' as const, target: 'gatoThug', technique: 'jShuriken' };
    const s1 = hit(startBattle(setup({ enemies: [foe({ hp: 1 })], win }), data, fixed(0)), 'jStrike');
    expect(s1.fighters.find((x) => x.uid === 'e0')!.hp).toBe(1);
    expect(s1.log.some((e) => e.type === 'endure')).toBe(true);
    expect(s1.status).toBe('ongoing');
    expect(hit(s1, 'jShuriken').status).toBe('won');
  });

  it('marca do roteiro vai para a run no fim da luta', () => {
    const run = newRun(1, 'normal', data);
    const b = startBattle(battleSetup(run, data), data, fixed(0));
    const next = finishFight(run, { ...b, status: 'won', flags: ['viuOMomento'] }, data).run;
    expect(next.flags).toContain('viuOMomento');
  });
});

describe('marcos da história (v0.66.0)', () => {
  it('o Sasuke aprende o Chidori no exame (estágio 1), sem a árvore', () => {
    const run = newRun(1, 'normal', data);
    expect(grantedTechniques(run, 'sasuke', data)).toEqual([]);
    expect(grantedTechniques({ ...run, stageIndex: 1 }, 'sasuke', data)).toEqual(['jChidori']);
    expect(grantedTechniques({ ...run, mode: 'generic', stageIndex: 1 }, 'sasuke', data)).toEqual([]);
  });

  it('marco do protagonista por parada: entra no que ele conhece e no moveset ao passar da parada', () => {
    const d: JornadaData = { ...data, campaigns: { naruto: { ...data.campaigns.naruto!, grants: [{ who: 'naruto', learn: 'jRasengan', at: { stop: 'bells' } }] } } };
    const bells = data.stages[0]!.stops.findIndex((s) => s.id === 'bells');
    const at = { ...newRun(1, 'normal', d), stopIndex: bells };
    expect(heroKnown(at, d)).not.toContain('jRasengan');
    const b = startBattle(battleSetup(at, d), d, fixed(0));
    const after = finishFight(at, { ...b, status: 'won' }, d).run;
    expect(heroKnown(after, d)).toContain('jRasengan');
    expect(after.moveset).toContain('jRasengan');
  });

  it('efeito de evento "learn": o protagonista aprende a técnica', () => {
    const d: JornadaData = { ...data, events: { ...data.events, graduation: { id: 'graduation', options: [{ id: 'ramen', effects: [{ kind: 'learn', technique: 'jRasengan' }] }] } } };
    const grad = data.stages[0]!.stops.findIndex((s) => s.id === 'graduation');
    const run = { ...newRun(1, 'normal', d), stopIndex: grad };
    const next = resolveEvent(run, 'ramen', true, d).run;
    expect(next.learned).toContain('jRasengan');
    expect(heroKnown(next, d)).toContain('jRasengan');
  });

  it('os sinos do Kakashi usam o roteiro (fala de abertura)', () => {
    const bells = data.stages[0]!.stops.findIndex((s) => s.id === 'bells');
    const s = openBattle(battleSetup({ ...newRun(1, 'normal', data), stopIndex: bells }, data), data);
    expect(says(s)).toEqual(['bellsStart']);
  });
});

describe('acréscimos do roteiro (v0.67.0)', () => {
  it('knock: o aliado cai pelo roteiro e o gatilho de queda dispara na mesma checagem', () => {
    const sasuke = hero({ defId: 'sasuke', protagonist: false, speed: 40 });
    const script = [
      rule({ on: 'hpBelow', who: 'gatoThug', pct: 0.99 }, { do: 'knock', who: 'sasuke' }),
      rule({ on: 'down', who: 'sasuke' }, { do: 'say', who: 'naruto', line: 'sasuke' }),
    ];
    const s = hit(startBattle(setup({ allies: [hero(), sasuke], enemies: [foe({ hp: 999, maxHp: 999 })], script }), data, fixed(0)));
    expect(s.fighters.find((f) => f.defId === 'sasuke')!.down).toBe(true);
    expect(s.log.some((e) => e.type === 'down' && e.scripted)).toBe(true);
    expect(says(s)).toEqual(['sasuke']);
    expect(s.status).toBe('ongoing');
  });

  it('condição de marca: a regra só vale com a marca na run', () => {
    const script = [{ when: { on: 'start' as const }, if: { flag: 'curseMark' }, do: [{ do: 'say' as const, who: 'naruto', line: 'selo' }] }];
    expect(says(openBattle(setup({ script }), data))).toEqual([]);
    expect(says(openBattle(setup({ script, runFlags: ['curseMark'] }), data))).toEqual(['selo']);
  });

  it('forma temporária: técnicas a mais enquanto dura, e volta à ficha no fim', () => {
    const d: JornadaData = {
      ...data,
      characters: { ...data.characters, naruto: { ...data.characters.naruto!, forms: [{ id: 'kyuubi', statMult: 2, addTechniques: ['jRasengan'], turns: 1 }] } },
    };
    const s0 = startBattle(setup({ enemies: [foe({ hp: 999, maxHp: 999 })], script: [rule({ on: 'start' }, { do: 'form', who: 'naruto', form: 'kyuubi' })] }), d, fixed(0));
    const me0 = s0.fighters[0]!;
    expect(me0.form).toBe('kyuubi');
    expect(me0.techniques).toContain('jRasengan');
    expect(me0.offense.taijutsu).toBe(20);
    const s1 = hit(s0, 'jStrike', 'e0', d);
    const me1 = s1.fighters[0]!;
    expect(me1.form).toBeUndefined();
    expect(me1.techniques).not.toContain('jRasengan');
    expect(me1.offense.taijutsu).toBe(10);
    expect(s1.log.some((e) => e.type === 'formEnd')).toBe(true);
  });

  it('técnica sorteada: paga uma vez e resolve a variante; os pesos dos talentos mudam o sorteio', () => {
    const roll = { ...data.techniques.jShuriken!, id: 'jTestRoll', baseDamage: 0, chakraCost: 3, roll: [{ tech: 'jStrike', weight: 1 }, { tech: 'jShuriken', weight: 0 }] };
    const d: JornadaData = { ...data, techniques: { ...data.techniques, jTestRoll: roll } };
    const me = hero({ techniques: ['jStrike', 'jTestRoll'] });
    const s1 = hit(startBattle(setup({ allies: [me], enemies: [foe({ hp: 999, maxHp: 999 })] }), d, fixed(0)), 'jTestRoll', 'e0', d);
    expect(s1.log.find((e) => e.type === 'roll')).toMatchObject({ techId: 'jTestRoll', variant: 'jStrike' });
    expect(s1.log.find((e) => e.type === 'tech' && e.techId === 'jTestRoll')).toMatchObject({ cost: 3 });
    const tuned = hero({ techniques: ['jStrike', 'jTestRoll'], mods: { ...emptyMods(), rollWeights: { jStrike: -1, jShuriken: 2 } } });
    const s2 = hit(startBattle(setup({ allies: [tuned], enemies: [foe({ hp: 999, maxHp: 999 })] }), d, fixed(0)), 'jTestRoll', 'e0', d);
    expect(s2.log.find((e) => e.type === 'roll')).toMatchObject({ variant: 'jShuriken' });
  });

  it('finalizador: a técnica entra na luta mesmo fora do moveset, e a IA a usa com o alvo perto de cair', () => {
    const stages = structuredClone(data.campaigns.naruto!.stages);
    const mizuki = stages[0]!.stops[0]!;
    if (mizuki.kind !== 'story') throw new Error('a primeira parada mudou');
    mizuki.win = { kind: 'finisher', target: 'mizuki', technique: 'jRasengan' };
    const d: JornadaData = { ...data, stages, campaigns: { naruto: { ...data.campaigns.naruto!, stages } } };
    const run = { ...newRun(1, 'normal', d), learned: ['jRasengan'], moveset: ['jStrike', 'jShuriken', 'jSexyJutsu'] };
    const setupK = battleSetup(run, d);
    expect(setupK.allies[0]!.techniques).toContain('jRasengan');
    const b = openBattle({ ...setupK, enemies: [{ ...setupK.enemies[0]!, hp: 5 }] }, d);
    const act = chooseAiAction(b, b.fighters[0]!, d, fixed(0.5));
    expect(act).toMatchObject({ kind: 'tech', techId: 'jRasengan' });
  });
});

/** Joga a luta até o fim com a IA no lugar do jogador (como a simulação). */
function playOut(b0: JBattle, d: JornadaData, rng: () => number): JBattle {
  let b = b0;
  for (let i = 0; i < 300 && b.status === 'ongoing'; i++) {
    const me = b.fighters.find((f) => f.protagonist)!;
    b = playerAct(b, chooseAiAction(b, me, d, rng), d, rng);
  }
  return b;
}
const stopAt = (stageId: string, stopId: string) => {
  const si = data.stages.findIndex((s) => s.id === stageId);
  return { stageIndex: si, stopIndex: data.stages[si]!.stops.findIndex((s) => s.id === stopId) };
};

describe('História canônica: Ondas (v0.67.0)', () => {
  it('Zabuza: a Sakura sai para proteger o Tazuna e o Kakashi entra; ela volta de pé para a run', () => {
    const run = { ...newRun(3, 'normal', data), ...stopAt('waves', 'zabuza') };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(5)), data, createRng(5));
    expect(end.fighters.some((f) => f.defId === 'kakashiAlly' && f.guest)).toBe(true);
    expect(end.fighters.find((f) => f.defId === 'sakura')!.gone).toBe(true);
    if (end.status === 'won') {
      const next = finishFight(run, end, data).run;
      expect(next.members.sakura?.hp ?? 1).toBeGreaterThan(0);
      expect(next.members.kakashiAlly).toBeUndefined();
    }
  });

  it('Haku: o Sasuke cai, a Kyuubi desperta antes do fim, e a vitória deixa a marca', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('waves', 'haku') };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(7)), data, createRng(7));
    expect(end.status).toBe('won');
    const kinds = end.log.map((e) => e.type);
    expect(kinds.indexOf('form')).toBeGreaterThan(-1);
    expect(kinds.indexOf('form')).toBeLessThan(kinds.lastIndexOf('end'));
    expect(end.fighters.find((f) => f.defId === 'sasuke')!.down).toBe(true);
    expect(end.fighters.find((f) => f.protagonist)!.form).toBe('kyuubi');
    expect(finishFight(run, end, data).run.flags).toContain('kyuubiAwakened');
  });
});

describe('História canônica: Exame (v0.67.0)', () => {
  it('Orochimaru na Floresta: resistir vence, e o Sasuke sai com a marca do selo', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('exam', 'orochimaruForest') };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(2)), data, createRng(2));
    expect(says(end)).toContain('orochiStart');
    if (end.status === 'won') expect(finishFight(run, end, data).run.flags).toContain('curseMark');
  });

  it('Trio do Som: o selo do Sasuke só desperta com a marca', () => {
    const at = { ...newRun(3, 'normal', data), ...stopAt('exam', 'forest') };
    // O roteiro confere todas as regras já na abertura: basta abrir a luta com o Sasuke ferido.
    const open = (flags: string[]) => {
      const setupF = battleSetup({ ...at, flags }, data);
      return openBattle({ ...setupF, allies: setupF.allies.map((a) => (a.defId === 'sasuke' ? { ...a, hp: 10 } : a)) }, data);
    };
    expect(open([]).fighters.find((f) => f.defId === 'sasuke')!.form).toBeUndefined();
    expect(open(['curseMark']).fighters.find((f) => f.defId === 'sasuke')!.form).toBe('curseMark');
  });

  it('Gaara: a 40% vira Shukaku e o Gamabunta entra; a vitória vem com o Shukaku caído', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('exam', 'gaara'), level: 8 };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(4)), data, createRng(4));
    const shukaku = end.fighters.find((f) => f.defId === 'shukaku');
    expect(shukaku).toBeDefined();
    expect(end.fighters.find((f) => f.defId === 'gaara')!.gone).toBe(true);
    expect(end.fighters.some((f) => f.defId === 'gamabuntaAlly' && f.side === 'ally')).toBe(true);
    if (end.status === 'won') expect(shukaku!.down).toBe(true);
  });

  it('o contrato com os sapos dá o Kuchiyose no Jutsu, qualquer que seja a escolha', () => {
    const at = { ...newRun(3, 'normal', data), ...stopAt('exam', 'toadSummon') };
    expect(heroKnown(at, data)).not.toContain('jKuchiyose');
    for (const [opt, won] of [['summon', false], ['peek', true]] as const) {
      const next = resolveEvent(at, opt, won, data).run;
      expect(heroKnown(next, data)).toContain('jKuchiyose');
    }
  });
});
