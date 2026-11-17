// Bot da simulação da Jornada (src/sim/jornadaBot.ts, fase 2b): plano de talentos, ação por valor e itens.
import { describe, expect, it } from 'vitest';
import { current, emptyMods, mergeMods, startBattle, type BattleSetup, type FighterSeed } from '../src/core/jornada/battle';
import type { TalentContext } from '../src/core/jornada/talents';
import type { JBattle } from '../src/core/jornada/types';
import { jornadaData as data } from '../src/data/jornada';
import { BRANCH_PREFS, guardValue, heroAction, heroFree, heroItem, nextTalent, planBuild, techOptions } from '../src/sim/jornadaBot';

const fixed = (v: number) => () => v;

function hero(over: Partial<FighterSeed> = {}): FighterSeed {
  return {
    defId: 'hyuugaNinja',
    protagonist: true,
    maxHp: 100,
    hp: 100,
    maxChakra: 30,
    chakra: 30,
    speed: 50,
    offense: { taijutsu: 10, ninjutsu: 10, genjutsu: 10 },
    resistance: { physical: 6, mental: 6 },
    element: null,
    techniques: ['jStrike'],
    ai: 'striker',
    mods: emptyMods(),
    ...over,
  };
}

const dummy = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...hero(), defId: 'gatoThug', protagonist: false, speed: 1, techniques: ['jeClub'], ai: 'brute', hp: 500, maxHp: 500, ...over });
const ally = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...dummy(), defId: 'sasuke', speed: 2, techniques: ['jStrike'], ai: 'striker', ...over });
const battle = (over: Partial<BattleSetup>): JBattle => startBattle({ allies: [hero()], enemies: [dummy()], win: { kind: 'defeatAll' }, ...over }, data, fixed(0.5));
const ctx = (over: Partial<TalentContext> = {}): TalentContext => ({ owned: [], points: 0, stageIndex: 99, unlocked: new Set(), elements: [], ...over });

describe('plano de talentos', () => {
  it('segue o ramo preferido até o talento final, depois a junção do vizinho e as combinações dos dois', () => {
    const plan = planBuild('hyuugaNinja', data.talents, ctx(), data)!;
    expect(plan.primary).toBe(BRANCH_PREFS.hyuugaNinja![0]);
    const node = (id: string) => data.talents.find((n) => n.id === id)!;
    const main = data.talents.filter((n) => n.owner === 'hyuugaNinja' && n.branch === plan.primary && !n.requiresAll);
    const tiers = new Set(main.map((n) => n.tier));
    // Os primeiros passos: um nó por linha do ramo principal, até o final.
    const first = plan.steps.slice(0, tiers.size).map((s) => node(s.id));
    expect(first.every((n) => n.branch === plan.primary)).toBe(true);
    expect(first.at(-1)!.capstone).toBe(true);
    // Há uma combinação do par no plano, e ela vem depois de todos os nós que ela pede.
    const combo = plan.steps.findIndex((s) => node(s.id).requiresAll?.length);
    expect(combo).toBeGreaterThan(0);
    for (const id of node(plan.steps[combo]!.id).requiresAll!) expect(plan.steps.findIndex((s) => s.id === id)).toBeLessThan(combo);
    expect(plan.secondary).not.toBeNull();
  });

  it('compra a raiz do plano e guarda ponto quando o próximo passo é caro (não gasta fora do plano)', () => {
    const plan = planBuild('hyuugaNinja', data.talents, ctx(), data)!;
    const root = plan.steps[0]!.id;
    expect(nextTalent('hyuugaNinja', data.talents, ctx({ points: 1 }), plan)).toBe(root);
    // Com a raiz e 1 ponto: o 2º nível custa 2, então espera em vez de comprar a raiz barata de outro ramo.
    expect(nextTalent('hyuugaNinja', data.talents, ctx({ owned: [root], points: 1 }), plan)).toBe('wait');
  });

  it('o foco do `--ramos` força os ramos do plano', () => {
    const plan = planBuild('hyuugaNinja', data.talents, ctx(), data, ['rotation', 'gentleFist'])!;
    expect([plan.primary, plan.secondary]).toEqual(['rotation', 'gentleFist']);
  });
});

describe('ação por valor', () => {
  it('o controle vai no inimigo mais perigoso', () => {
    const weak = dummy({ offense: { taijutsu: 2, ninjutsu: 2, genjutsu: 2 } });
    const strong = dummy({ defId: 'zabuza', offense: { taijutsu: 30, ninjutsu: 30, genjutsu: 30 } });
    const b = battle({ allies: [hero({ techniques: ['jStrike', 'jShadowBind'] })], enemies: [weak, strong] });
    const bind = techOptions(b, current(b)!, data).filter((o) => o.action.kind === 'tech' && o.action.techId === 'jShadowBind');
    const zabuza = b.fighters.find((f) => f.defId === 'zabuza')!.uid;
    expect(bind[0]!.action).toMatchObject({ target: zabuza });
  });

  it('com o chakra cheio gasta na técnica forte; quase sem chakra, segura', () => {
    const full = battle({ allies: [hero({ techniques: ['jStrike', 'jRasengan'] })] });
    expect(heroAction(full, current(full)!, data, fixed(0.5))).toMatchObject({ techId: 'jRasengan' });
    const opts = techOptions(full, current(full)!, data);
    const low = battle({ allies: [hero({ techniques: ['jStrike', 'jRasengan'], chakra: 10 })] });
    const lowOpts = techOptions(low, current(low)!, data);
    const cost = (o: typeof opts, id: string) => o.find((x) => x.action.kind === 'tech' && x.action.techId === id)!.value;
    // O mesmo Rasengan vale menos com o chakra no fim (o custo pesa).
    expect(cost(lowOpts, 'jRasengan')).toBeLessThan(cost(opts, 'jRasengan'));
  });

  it('Defender (Guarda-costas) só com um aliado abaixo do limiar', () => {
    const mods = mergeMods(emptyMods(), { guardProtect: true });
    const brute = dummy({ offense: { taijutsu: 40, ninjutsu: 40, genjutsu: 40 } });
    const hurt = battle({ allies: [hero({ mods }), ally({ hp: 15, maxHp: 500 })], enemies: [brute] });
    expect(heroAction(hurt, current(hurt)!, data, fixed(0.5))).toEqual({ kind: 'guard' });
    const fine = battle({ allies: [hero({ mods }), ally({ hp: 400, maxHp: 500 })], enemies: [brute] });
    expect(guardValue(fine, current(fine)!, data)).toBe(0);
    expect(heroAction(fine, current(fine)!, data, fixed(0.5)).kind).not.toBe('guard');
  });

  it('Colete acolchoado: Defender só com o próprio HP baixo', () => {
    const mods = mergeMods(emptyMods(), { guardHealPct: 0.08 });
    const fine = battle({ allies: [hero({ mods })] });
    expect(guardValue(fine, current(fine)!, data)).toBe(0);
    const low = battle({ allies: [hero({ mods, hp: 30 })] });
    expect(guardValue(low, current(low)!, data)).toBeGreaterThan(0);
  });
});

describe('itens e ativas', () => {
  it('kit de chakra quando falta chakra para a técnica forte; kit de HP abaixo de 35%', () => {
    const b = battle({ allies: [hero({ techniques: ['jStrike', 'jRasengan'], chakra: 4 })] });
    expect(heroItem(b, current(b)!, { hpKit: 1, chakraKit: 1, reviveKit: 0 }, data)).toMatchObject({ item: 'chakraKit' });
    const hurt = battle({ allies: [hero({ hp: 20 })] });
    expect(heroItem(hurt, current(hurt)!, { hpKit: 1, chakraKit: 1, reviveKit: 0 }, data)).toMatchObject({ item: 'hpKit' });
    const fine = battle({});
    expect(heroItem(fine, current(fine)!, { hpKit: 1, chakraKit: 1, reviveKit: 0 }, data)).toBeNull();
  });

  it('Pergaminho dos mil: refaz clones acima do limite comum', () => {
    const mods = mergeMods(emptyMods(), { maxClonesBonus: 2, damagePerClone: 0.02 });
    const b = battle({ allies: [hero({ techniques: ['jStrike', 'jKageBunshin'], mods })] });
    const withClones: JBattle = { ...b, fighters: b.fighters.map((f) => (f.protagonist ? { ...f, clones: data.j.combat.maxClones } : f)) };
    expect(heroFree(withClones, current(withClones)!, data, fixed(0.5))).toMatchObject({ techId: 'jKageBunshin' });
    // Sem o bônus, com o limite cheio, não refaz.
    const plain = { ...withClones, fighters: withClones.fighters.map((f) => (f.protagonist ? { ...f, mods: emptyMods() } : f)) };
    expect(heroFree(plain, current(plain)!, data, fixed(0.5))).toBeNull();
  });
});
