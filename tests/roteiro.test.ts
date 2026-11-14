import { describe, expect, it } from 'vitest';
import { downed, emptyMods, openBattle, playerAct, startBattle, type BattleSetup, type FighterSeed } from '../src/core/jornada/battle';
import type { JornadaData } from '../src/core/jornada/data';
import { battleSetup, currentEvent, finishFight, grantedTechniques, heroKnown, newRun, resolveEvent } from '../src/core/jornada/run';
import type { ScriptRule } from '../src/core/jornada/script';
import type { JBattle } from '../src/core/jornada/types';
import { jornadaData as data } from '../src/data/jornada';
import { eventOptions } from '../src/core/jornada/events';
import { ptBR } from '../src/data/strings/ptBR';
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
    const run = { ...newRun(1, 'normal', data), stopIndex: data.stages[0]!.stops.findIndex((s) => s.id === 'mizuki') };
    const b = startBattle(battleSetup(run, data), data, fixed(0));
    const next = finishFight(run, { ...b, status: 'won', flags: ['viuOMomento'] }, data).run;
    expect(next.flags).toContain('viuOMomento');
  });
});

describe('marcos da história (v0.66.0)', () => {
  it('o Sasuke desperta o Sharingan na ponte e aprende o Chidori no mês de treino, sem a árvore', () => {
    const run = newRun(1, 'normal', data);
    const at = (stage: number, id: string) => ({ ...run, stageIndex: stage, stopIndex: data.stages[stage]!.stops.findIndex((s) => s.id === id) });
    expect(grantedTechniques(run, 'sasuke', data)).toEqual([]);
    expect(grantedTechniques(at(0, 'hakuFarewell'), 'sasuke', data)).toEqual(['jSharingan']);
    // O mês de treino é uma parada só desde a v0.70.0 (Ebisu ou hospital, depois o Jiraiya): o Chidori vem ao passar dela.
    expect(grantedTechniques(at(1, 'toadSummon'), 'sasuke', data)).toEqual(['jSharingan']);
    expect(grantedTechniques(at(1, 'treasure2'), 'sasuke', data)).toEqual(['jSharingan', 'jChidori']);
    expect(grantedTechniques({ ...at(1, 'treasure2'), mode: 'generic' }, 'sasuke', data)).toEqual([]);
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

  it('pilha de formas (v0.70.0): a temporária acaba e a permanente continua, com a fala de saída', () => {
    const d: JornadaData = {
      ...data,
      characters: {
        ...data.characters,
        naruto: {
          ...data.characters.naruto!,
          forms: [
            { id: 'resolve', mods: { damageMult: 1.1, surviveOnce: true } },
            { id: 'kyuubiBrief', statMult: 2, addTechniques: ['jRasengan'], turns: 1, exitLine: 'acabou' },
          ],
        },
      },
    };
    const script = [rule({ on: 'start' }, { do: 'form', who: 'naruto', form: 'resolve' }, { do: 'form', who: 'naruto', form: 'kyuubiBrief' })];
    const s0 = startBattle(setup({ enemies: [foe({ hp: 999, maxHp: 999 })], script }), d, fixed(0));
    const me0 = s0.fighters[0]!;
    expect(me0.form).toBe('kyuubiBrief');
    expect(me0.offense.taijutsu).toBe(20);
    expect(me0.mods.surviveOnce).toBe(true);
    const s1 = hit(s0, 'jStrike', 'e0', d);
    const me1 = s1.fighters[0]!;
    // A Kyuubi saiu: os status e as técnicas voltam, a determinação fica (e volta a ser a forma à mostra).
    expect(me1.form).toBe('resolve');
    expect(me1.offense.taijutsu).toBe(10);
    expect(me1.techniques).not.toContain('jRasengan');
    expect(me1.mods.surviveOnce).toBe(true);
    expect(me1.mods.damageMult).toBeCloseTo(1.1);
    expect(says(s1)).toContain('acabou');
    // A forma que acabou pode voltar; a que está ligada não liga de novo.
    expect(s1.log.filter((e) => e.type === 'form')).toHaveLength(2);
  });

  it('ações novas (v0.70.0): estado e fortalecimento pelo roteiro; a regra some com a marca contrária', () => {
    const script: ScriptRule[] = [
      rule({ on: 'start' }, { do: 'effect', who: 'gatoThug', effect: 'stun', turns: 2 }, { do: 'boost', who: 'naruto', tech: 'jSharingan' }),
      { when: { on: 'start' }, ifNot: { flag: 'valleyForce' }, do: [{ do: 'say', who: 'naruto', line: 'so-sem-a-marca' }] },
    ];
    const s = openBattle(setup({ script }), data);
    expect(s.fighters.find((f) => f.uid === 'e0')!.effects).toEqual([{ kind: 'stun', turns: 2 }]);
    expect(s.fighters[0]!.boost).toMatchObject({ techId: 'jSharingan' });
    expect(says(s)).toEqual(['so-sem-a-marca']);
    expect(says(openBattle(setup({ script, runFlags: ['valleyForce'] }), data))).toEqual([]);
  });

  it('evento em etapas (v0.70.0): a parada só avança na última etapa, e a escolha devolve o que deu', () => {
    const stages = structuredClone(data.campaigns.naruto!.stages);
    stages[0]!.stops[0] = { kind: 'event', id: 'duo', event: 'graduation', then: ['team7'] };
    const d: JornadaData = { ...data, stages, campaigns: { naruto: { ...data.campaigns.naruto!, stages } } };
    const run = newRun(1, 'normal', d);
    expect(currentEvent(run, d)!.id).toBe('graduation');
    const first = resolveEvent(run, 'train', true, d);
    expect([first.done, first.run.stopIndex, first.run.beat]).toEqual([false, 0, 1]);
    expect(first.gains).toContainEqual({ kind: 'talent', n: 1 });
    expect(first.gains).toContainEqual({ kind: 'storyRelic', id: 'irukaHeadband' });
    expect(currentEvent(first.run, d)!.id).toBe('team7');
    const second = resolveEvent(first.run, d.events.team7!.options[0]!.id, true, d);
    expect([second.done, second.run.stopIndex, second.run.beat]).toEqual([true, 1, undefined]);
    expect(second.run.flags).toEqual(expect.arrayContaining(['ev:graduation', 'ev:team7']));
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
    const mizuki = stages[0]!.stops.find((s) => s.id === 'mizuki')!;
    if (mizuki.kind !== 'story') throw new Error('a primeira parada mudou');
    mizuki.win = { kind: 'finisher', target: 'mizuki', technique: 'jRasengan' };
    const d: JornadaData = { ...data, stages, campaigns: { naruto: { ...data.campaigns.naruto!, stages } } };
    const run = { ...newRun(1, 'normal', d), stopIndex: stages[0]!.stops.indexOf(mizuki), learned: ['jRasengan'], moveset: ['jStrike', 'jShuriken', 'jSexyJutsu'] };
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
    expect(end.status).toBe('won');
    {
      const next = finishFight(run, end, data).run;
      expect(next.members.sakura?.hp ?? 1).toBeGreaterThan(0);
      expect(next.members.kakashiAlly).toBeUndefined();
    }
  });

  it('Haku: Sharingan do Sasuke, o Sasuke cai, a Kyuubi; o Haku sai e os mercenários do Gatō entram', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('waves', 'haku'), level: 5 };
    // A primeira seed vencida (determinístico): a luta inteira, com as três fases.
    const end = [1, 2, 3, 4, 5].map((seed) => playOut(startBattle(battleSetup(run, data), data, createRng(seed)), data, createRng(seed))).find((b) => b.status === 'won')!;
    expect(end).toBeDefined();
    const forms = end.log.filter((e) => e.type === 'form').map((e) => (e.type === 'form' ? e.form : ''));
    expect(forms).toEqual(['sharingan', 'kyuubi']);
    expect(end.fighters.find((f) => f.defId === 'sasuke')!.down).toBe(true);
    expect(end.fighters.find((f) => f.defId === 'haku')!.gone).toBe(true);
    expect(end.fighters.filter((f) => f.defId === 'gatoMerc')).toHaveLength(3);
    expect(end.fighters.find((f) => f.protagonist)!.form).toBe('kyuubi');
    expect(finishFight(run, end, data).run.flags).toContain('kyuubiAwakened');
  });

  it('teste do sino: a derrota avança a run, não gasta Vontade e carimba a raiz dos Laços', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('waves', 'bells') };
    const willOfFire = run.willOfFire;
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(1)), data, createRng(1));
    expect(end.status).toBe('lost');
    const { run: next, outcome } = finishFight(run, end, data);
    expect(outcome.inevitable).toBe(true);
    expect(next.status).toBe('inProgress');
    expect(next.willOfFire).toBe(willOfFire);
    expect(next.stopIndex).toBe(run.stopIndex + 1);
    expect(next.talents).toContain('tNeverGiveUp');
  });

  it('cena presenciada: o Naruto escolhe como reage (só a promessa à Hinata deixa a marca)', () => {
    // As preliminares são uma parada de duas etapas (v0.70.0): a pomada e, depois, Hinata × Neji.
    const at = { ...newRun(3, 'normal', data), ...stopAt('exam', 'hinataNeji'), beat: 1 };
    const def = currentEvent(at, data)!;
    expect([def.id, def.category]).toEqual(['hinataNeji', 'witness']);
    expect(def.options.map((o) => o.id)).toEqual(['promise', 'carry']);
    expect(resolveEvent(at, 'promise', true, data).run.flags).toContain('promessaNeji');
    const carried = resolveEvent(at, 'carry', true, data);
    expect(carried.run.flags).not.toContain('promessaNeji');
    expect(carried.done).toBe(true);
  });
});

describe('História canônica: Exame (v0.67.0)', () => {
  it('Orochimaru na Floresta: resistir vence, e o Sasuke sai com a marca do selo', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('exam', 'orochimaruForest') };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(2)), data, createRng(2));
    expect(says(end)).toContain('orochiStart');
    expect(end.status).toBe('won');
    expect(finishFight(run, end, data).run.flags).toContain('curseMark');
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

  it('Gaara em três fases: Shukaku com o Gamabunta e a Kyuubi, depois o Gaara exausto e os laços', () => {
    // Depois da Formatura o Naruto já tem a Bandana do Iruka no lugar dos óculos.
    const run = { ...newRun(3, 'easy', data), ...stopAt('exam', 'gaara'), level: 8, relics: ['irukaHeadband'] };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(26)), data, createRng(26));
    expect(end.status).toBe('won');
    expect(end.fighters.find((f) => f.defId === 'gaara')!.gone).toBe(true);
    expect(end.fighters.find((f) => f.defId === 'shukaku')!.gone).toBe(true);
    expect(end.fighters.find((f) => f.defId === 'gamabuntaAlly')!.gone).toBe(true);
    expect(end.fighters.find((f) => f.defId === 'gaaraWeak')!.down).toBe(true);
    expect(end.fighters.find((f) => f.protagonist)!.form).toBe('kyuubi');
    expect(says(end)).toContain('gaaraBonds');
  });

  it('o contrato com os sapos dá o Kuchiyose no Jutsu, qualquer que seja a escolha', () => {
    // Segunda etapa do mês de treino (a primeira é o Ebisu ou o hospital).
    const at = { ...newRun(3, 'normal', data), ...stopAt('exam', 'toadSummon'), beat: 1 };
    expect(heroKnown(at, data)).not.toContain('jKuchiyose');
    for (const [opt, won] of [['summon', false], ['peek', true]] as const) {
      const next = resolveEvent(at, opt, won, data).run;
      expect(heroKnown(next, data)).toContain('jKuchiyose');
    }
  });
});

describe('História canônica: Sannin e Resgate (v0.67.0)', () => {
  it('o treino com o Jiraiya dá o Rasengan', () => {
    const at = { ...newRun(3, 'normal', data), ...stopAt('sannin', 'rasenganTraining') };
    expect(heroKnown(at, data)).not.toContain('jRasengan');
    expect(heroKnown(resolveEvent(at, 'ball', false, data).run, data)).toContain('jRasengan');
  });

  it('Kabuto: aguenta com 1 de HP até o Rasengan, e a IA usa o Rasengan para fechar', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('sannin', 'kabuto'), level: 10 };
    const s = battleSetup(run, data);
    expect(s.allies[0]!.techniques).toContain('jRasengan');
    // A primeira seed vencida (determinístico).
    const end = [9, 1, 2, 3, 4, 5, 6, 7, 8].map((seed) => playOut(startBattle(s, data, createRng(seed)), data, createRng(seed))).find((b) => b.status === 'won')!;
    expect(end).toBeDefined();
    {
      const kabutoDown = end.log.findIndex((e) => e.type === 'down' && end.fighters.find((f) => f.uid === e.target)?.defId === 'kabuto');
      const lastTech = [...end.log.slice(0, kabutoDown)].reverse().find((e) => e.type === 'tech');
      expect(lastTech).toMatchObject({ techId: 'jRasengan' });
    }
  });

  it('Kimimaro: o Naruto luta sozinho até o Lee chegar e mandá-lo seguir (a luta termina como vitória)', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('retrieval', 'kimimaro'), level: 9 };
    const s0 = startBattle(battleSetup(run, data), data, createRng(1));
    expect(s0.fighters.filter((f) => f.side === 'ally').map((f) => f.defId)).toEqual(['naruto']);
    const end = playOut(s0, data, createRng(1));
    expect(end.status).toBe('won');
    expect(end.log.at(-1)).toMatchObject({ type: 'end', scripted: true });
    expect(says(end).filter((l) => l === 'kimimaroLee')).toHaveLength(1);
    expect(end.round).toBeLessThanOrEqual(4);
  });

  it('Mizuki: o Iruka entra, cai protegendo o Naruto, e vem o Kage Bunshin em massa', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('waves', 'mizuki') };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(2)), data, createRng(2));
    expect(end.status).toBe('won');
    const iruka = end.fighters.find((f) => f.defId === 'iruka')!;
    expect([iruka.guest, iruka.down]).toEqual([true, true]);
    expect(end.log.some((e) => e.type === 'form' && e.form === 'massClones')).toBe(true);
    // O Iruka é convidado: não entra na equipe da run.
    expect(finishFight(run, end, data).run.members.iruka).toBeUndefined();
  });

  it('Neji: a promessa à Hinata liga a determinação desde o começo', () => {
    const at = { ...newRun(3, 'normal', data), ...stopAt('exam', 'neji') };
    const plain = openBattle(battleSetup(at, data), data);
    expect(plain.fighters[0]!.form).toBeUndefined();
    const promised = openBattle(battleSetup({ ...at, flags: ['promessaNeji'] }, data), data);
    expect(promised.fighters[0]!.form).toBe('resolve');
    expect(promised.fighters[0]!.mods.surviveOnce).toBe(true);
    expect(promised.fighters[0]!.mods.damageMult).toBeCloseTo(plain.fighters[0]!.mods.damageMult * 1.1);
  });

  it('Vale do Fim: selo nível 2 e manto de uma cauda; a 20% o Sasuke parte e a run vence', () => {
    // No jogo, o Naruto chega ao Vale já com o Rasengan (marco dos Sannin).
    const run = { ...newRun(3, 'easy', data), ...stopAt('retrieval', 'valley'), level: 10, learned: ['jRasengan'] };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(1)), data, createRng(1));
    expect(end.status).toBe('won');
    {
      expect(end.fighters.find((f) => f.defId === 'sasukeFinal')!.form).toBe('curseMark2');
      expect(end.log.at(-1)).toMatchObject({ type: 'end', scripted: true });
      expect(says(end)).toContain('valleyEnd');
    }
  });
});

describe('revisão da História, parte 2 (v0.70.0)', () => {
  const J = ptBR.jornada;
  const scripts = data.stages.flatMap((st) => st.stops).flatMap((stop) => ('script' in stop ? (stop.script ?? []) : []));

  it('Kage Bunshin: o Naruto começa sem ele e aprende no pergaminho proibido, qualquer que seja a escolha', () => {
    const run = newRun(1, 'normal', data);
    expect(heroKnown(run, data)).not.toContain('jKageBunshin');
    for (const [opt, won] of [['scroll', true], ['scroll', false], ['stubborn', true]] as const) {
      expect(heroKnown(resolveEvent(run, opt, won, data).run, data), opt).toContain('jKageBunshin');
    }
  });

  it('Mil Clones: depois do Mizuki fica no kit e entra no moveset; o talento só deixa a técnica mais forte', () => {
    const at = { ...newRun(3, 'easy', data), ...stopAt('waves', 'mizuki') };
    expect(heroKnown(at, data)).not.toContain('jTajuuBunshin');
    const end = playOut(startBattle(battleSetup(at, data), data, createRng(2)), data, createRng(2));
    const next = finishFight(at, end, data).run;
    expect(heroKnown(next, data)).toContain('jTajuuBunshin');
    expect(next.moveset).toContain('jTajuuBunshin');
    const talent = data.talents.find((t) => t.id === 'tTajuu')!;
    expect(talent.learn).toBeUndefined();
    expect(talent.mods?.techDamageMult).toEqual({ jTajuuBunshin: 1.2 });
  });

  it('Neji: a Kyuubi de 3 turnos acaba e a determinação da promessa continua', () => {
    const at = { ...newRun(3, 'normal', data), ...stopAt('exam', 'neji'), flags: ['promessaNeji'] };
    const b = openBattle(battleSetup(at, data), data);
    const me = b.fighters[0]!;
    const naruto = data.characters.naruto!;
    const brief = naruto.forms!.find((f) => f.id === 'kyuubiBrief')!;
    expect(me.forms!.map((f) => f.def.id)).toEqual(['resolve']);
    const plain = openBattle(battleSetup({ ...at, flags: [] }, data), data).fighters[0]!.mods.damageMult;
    // Liga a Kyuubi por cima (como o roteiro faz a 40% do HP) e deixa os turnos dela passarem.
    let s = hit(startBattle({ ...battleSetup(at, data), script: [rule({ on: 'start' }, { do: 'form', who: 'naruto', form: 'resolve' }, { do: 'form', who: 'naruto', form: 'kyuubiBrief' })], enemies: [foe({ hp: 9999, maxHp: 9999 })] }, data, fixed(0)));
    for (let i = 1; i < brief.turns!; i++) s = hit(s);
    const after = s.fighters[0]!;
    expect(after.form).toBe('resolve');
    expect(after.mods.surviveOnce).toBe(true);
    expect(after.mods.damageMult).toBeCloseTo(plain * 1.1);
    expect(says(s)).toContain('kyuubiEnd');
  });

  it('teste do sino: o Kakashi derruba a equipe por etapas e a luta acaba como lição', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('waves', 'bells') };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(1)), data, createRng(1));
    expect(end.status).toBe('lost');
    expect(end.log.at(-1)).toMatchObject({ type: 'end', status: 'lost', scripted: true });
    // Ninguém cai por dano antes da cena: cada queda da equipe vem do roteiro, na ordem Sakura, Sasuke, Naruto.
    const knocked = end.log.flatMap((e) => (e.type === 'down' && e.scripted ? [end.fighters.find((f) => f.uid === e.target)!.defId] : []));
    expect(['sakura', 'sasuke', 'naruto'].slice(0, knocked.length)).toEqual(knocked);
    const lines = says(end);
    expect(lines[0]).toBe('bellsStart');
    expect(lines.some((l) => l === 'bellsNaruto' || l === 'bellsTime')).toBe(true);
    expect(J.inevitableLesson.bells).toBeTruthy();
  });

  it('Gaara: o Gamabunta vira raposa, segura o Shukaku, e a cabeçada do jogador acorda o Gaara', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('exam', 'gaara'), level: 8, relics: ['irukaHeadband'] };
    const rng = createRng(26);
    let b = startBattle(battleSetup(run, data), data, createRng(26));
    const naruto = () => b.fighters.find((f) => f.protagonist)!;
    for (let i = 0; i < 300 && b.status === 'ongoing' && !naruto().techniques.includes('jHeadbutt'); i++) b = playerAct(b, chooseAiAction(b, naruto(), data, rng), data, rng);
    expect(b.status).toBe('ongoing');
    const toad = b.fighters.find((f) => f.defId === 'gamabuntaAlly')!;
    expect(toad.form).toBe('foxHenge');
    expect(toad.techniques).toContain('jbFoxFang');
    expect(says(b)).toContain('gaaraHenge');
    const shukaku = b.fighters.find((f) => f.defId === 'shukaku' && !f.gone)!;
    expect(shukaku.effects.some((e) => e.kind === 'stun')).toBe(true);
    // A cabeçada é do jogador: usar a técnica troca o Shukaku pelo Gaara acordado e manda o Gamabunta embora.
    b = playerAct(b, { kind: 'tech', techId: 'jHeadbutt', target: shukaku.uid }, data, fixed(0));
    expect(says(b)).toContain('gaaraWake');
    expect(says(b)).not.toContain('gaaraHeadbutt');
    expect(b.fighters.find((f) => f.defId === 'shukaku')!.gone).toBe(true);
    expect(b.fighters.find((f) => f.defId === 'gamabuntaAlly')!.gone).toBe(true);
    expect(b.fighters.filter((f) => f.defId === 'gaaraWeak')).toHaveLength(1);
  });

  it('Gaara sem a cabeçada: a 15% do Shukaku a cena acontece sozinha, uma vez só', () => {
    const run = { ...newRun(3, 'easy', data), ...stopAt('exam', 'gaara'), level: 8, relics: ['irukaHeadband'] };
    const end = playOut(startBattle(battleSetup(run, data), data, createRng(26)), data, createRng(26));
    expect(end.status).toBe('won');
    expect(end.fighters.filter((f) => f.defId === 'gaaraWeak')).toHaveLength(1);
    expect(says(end).filter((l) => l === 'gaaraHeadbutt' || l === 'gaaraWake')).toHaveLength(1);
  });

  it('quem guardou os movimentos da areia entra na luta do Gaara com esquiva', () => {
    const at = { ...newRun(3, 'normal', data), ...stopAt('exam', 'gaara') };
    expect(openBattle(battleSetup(at, data), data).fighters[0]!.boost).toBeNull();
    expect(openBattle(battleSetup({ ...at, flags: ['viuGaara'] }, data), data).fighters[0]!.boost).toMatchObject({ techId: 'jReadSand', evasion: 0.2 });
  });

  it('roteiros: toda interrupção no meio da luta muda algo (só a abertura e o fim podem ser só fala)', () => {
    const onlyTalk = scripts.filter((r) => r.do.every((a) => a.do === 'say') && r.when.on !== 'start' && r.when.on !== 'down');
    expect(onlyTalk).toEqual([]);
    // Fala depois de uma queda só vale como fecho da luta (o último inimigo caiu), nunca no meio.
    const afterDown = scripts.filter((r) => r.when.on === 'down' && r.do.every((a) => a.do === 'say')).map((r) => (r.when.on === 'down' ? r.when.who : ''));
    expect(afterDown.sort()).toEqual(['gaaraWeak', 'kabuto']);
  });

  it('textos: toda fala e toda forma do roteiro têm texto', () => {
    const lines = scripts.flatMap((r) => r.do).flatMap((a) => (a.do === 'say' ? [a.line] : []));
    const defs = [...Object.values(data.characters), ...Object.values(data.enemies)];
    const forms = defs.flatMap((d) => d.forms ?? []);
    const exits = forms.flatMap((f) => (f.exitLine ? [f.exitLine] : []));
    expect([...lines, ...exits].filter((l) => !J.script[l])).toEqual([]);
    expect(forms.map((f) => f.id).filter((id) => !J.forms[id])).toEqual([]);
    // Nenhuma fala sobrando nos textos.
    expect(Object.keys(J.script).filter((k) => !lines.includes(k) && !exits.includes(k))).toEqual([]);
  });

  it('escolhas: pelo menos duas opções em todo evento, com qualquer marca e sem ryō, e nenhuma pista entre parênteses', () => {
    const flags = [...new Set(Object.values(data.events).flatMap((e) => e.options).flatMap((o) => [o.requires, o.hiddenBy]).filter((f): f is string => Boolean(f)))];
    for (const def of Object.values(data.events)) {
      // Cada marca que mexe nas opções, ligada ou desligada.
      for (let mask = 0; mask < 1 << flags.length; mask++) {
        const on = flags.filter((_, i) => mask & (1 << i));
        expect(eventOptions(def, on, 0).length, `${def.id} com [${on.join(', ')}]`).toBeGreaterThanOrEqual(2);
      }
      const txt = J.events[def.id]!;
      expect(txt, def.id).toBeDefined();
      for (const o of def.options) {
        expect(txt.options[o.id], `${def.id}.${o.id}`).toBeTruthy();
        expect(txt.options[o.id], `${def.id}.${o.id}`).not.toMatch(/[()]/);
      }
    }
  });

  it('paradas juntadas: cada sequência virou uma parada de etapas, e todo evento da História ainda acontece', () => {
    const stops = data.stages.flatMap((st) => st.stops);
    const merged = Object.fromEntries(stops.flatMap((s) => (s.kind === 'event' && s.then ? [[s.id, [s.event, ...s.then]]] : [])));
    expect(merged).toEqual({
      hinataNeji: ['hinataOintment', 'hinataNeji'],
      toadSummon: ['preliminaries', 'toadSummon'],
      itachiKisame: ['jiraiyaJourney', 'itachiKisame'],
      rasengan2: ['rasengan1', 'rasengan2'],
      kibaStays: ['nejiStays', 'shikamaruStays', 'kibaStays'],
    });
    expect(stops).toHaveLength(48);
    const played = stops.flatMap((s) => (s.kind === 'event' ? [s.event, ...(s.then ?? [])] : []));
    expect(new Set(played).size).toBe(played.length);
    for (const id of played) expect(data.events[id], id).toBeDefined();
    for (const s of stops) expect(J.stops[s.id], s.id).toBeTruthy();
  });
});
