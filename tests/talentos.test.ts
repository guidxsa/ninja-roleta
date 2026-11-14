// Árvore do Naruto refeita (v0.71.0, docs/jornada/talentos.md): forma dos ramos, talentos de combinação e as regras
// que os talentos finais mudam no combate.
import { describe, expect, it } from 'vitest';
import { emptyMods, mergeMods, playerAct, startBattle, type BattleSetup, type FighterSeed } from '../src/core/jornada/battle';
import type { JornadaData } from '../src/core/jornada/data';
import { buyTalent, heroMods, newRun, talentContext } from '../src/core/jornada/run';
import { branchesOf, canBuyTalent, comboBranches, talentState, type TalentNode } from '../src/core/jornada/talents';
import type { FighterMods, JBattle } from '../src/core/jornada/types';
import { jornadaData as data } from '../src/data/jornada';
import { ptBR } from '../src/data/strings/ptBR';

const fixed = (v: number) => () => v;
/** Rng que devolve os valores da lista, em ordem, e depois 0. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++] ?? 0;
};
const mods = (over: Partial<FighterMods>): FighterMods => mergeMods(emptyMods(), over);
const hero = (over: Partial<FighterSeed> = {}): FighterSeed => ({
  defId: 'naruto',
  protagonist: true,
  maxHp: 100,
  hp: 100,
  maxChakra: 60,
  chakra: 60,
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
const hit = (s: JBattle, techId = 'jStrike', target = 'e0', rng: () => number = fixed(0), d: JornadaData = data) => playerAct(s, { kind: 'tech', techId, target }, d, rng);

const naruto = data.talents.filter((t) => t.owner === 'naruto');
const node = (id: string): TalentNode => naruto.find((t) => t.id === id)!;
const T = ptBR.jornada.talents;

describe('árvore do Naruto: forma (v0.71.0)', () => {
  const branches = branchesOf('naruto', data.talents);
  const own = (b: string) => naruto.filter((t) => t.branch === b && !t.requiresAll);

  it('seis ramos, cada um com raiz, bifurcação, junção e um talento final no fim', () => {
    expect(branches).toEqual(['clones', 'pranks', 'bonds', 'toads', 'kyuubi', 'rasengan']);
    for (const b of branches) {
      const nodes = own(b);
      const tiers = [...new Set(nodes.map((t) => t.tier))].sort((x, y) => x - y);
      expect(tiers[0], b).toBe(1);
      expect(nodes.filter((t) => t.tier === 1), b).toHaveLength(1);
      // Uma bifurcação só: dois nós que se excluem, e a linha seguinte (a junção) aceita qualquer um dos dois.
      const fork = nodes.filter((t) => t.excludes?.length);
      expect(fork, b).toHaveLength(2);
      expect(fork[0]!.tier, b).toBe(fork[1]!.tier);
      expect(fork[0]!.excludes, b).toEqual([fork[1]!.id]);
      const junction = nodes.filter((t) => t.tier === fork[0]!.tier + 1);
      expect(junction, b).toHaveLength(1);
      expect([...junction[0]!.requires!].sort(), b).toEqual(fork.map((t) => t.id).sort());
      // O talento final é o último nó do ramo e é o único.
      const finals = nodes.filter((t) => t.capstone);
      expect(finals, b).toHaveLength(1);
      expect(finals[0]!.tier, b).toBe(Math.max(...tiers));
    }
  });

  it('um ramo focado (um lado da bifurcação, sem níveis) custa de 7 a 10 pontos', () => {
    for (const b of branches) {
      const nodes = own(b);
      const fork = nodes.filter((t) => t.excludes?.length);
      const cost = nodes.filter((t) => t !== fork[1]).reduce((a, t) => a + t.cost, 0);
      expect(cost, b).toBeGreaterThanOrEqual(7);
      expect(cost, b).toBeLessThanOrEqual(10);
    }
  });

  it('cada talento final muda uma regra, e cada regra é de um ramo só', () => {
    const rule = (t: TalentNode) => {
      const m = { ...t.mods, ...t.teamMods };
      return ['cloneShield', 'stunnedAlwaysCrit', 'surviveOnce', 'rollTwice', 'surviveForm', 'techOverflow'].filter((k) => k in m);
    };
    const finals = Object.fromEntries(naruto.filter((t) => t.capstone).map((t) => [t.branch, rule(t)]));
    expect(finals).toEqual({
      clones: ['cloneShield'],
      pranks: ['stunnedAlwaysCrit'],
      bonds: ['surviveOnce'],
      toads: ['rollTwice'],
      kyuubi: ['surviveOnce', 'surviveForm'],
      rasengan: ['techOverflow'],
    });
  });

  it('todo talento do Naruto tem nome, descrição e, se tiver níveis, o texto do nível', () => {
    for (const t of naruto) {
      expect(T.list[t.id]?.name, t.id).toBeTruthy();
      expect(T.list[t.id]?.desc, t.id).toBeTruthy();
      if (t.maxRank) expect(T.list[t.id]?.rank, t.id).toBeTruthy();
    }
  });
});

describe('talentos de combinação (v0.71.0)', () => {
  const combos = naruto.filter((t) => t.requiresAll);
  const branches = branchesOf('naruto', data.talents);

  it('seis combinações em anel: cada ramo participa de duas, com os dois vizinhos', () => {
    expect(combos).toHaveLength(6);
    const pairs = combos.map((t) => comboBranches(t, data.talents));
    for (const [i, b] of branches.entries()) {
      const next = branches[(i + 1) % branches.length]!;
      expect(pairs.some((p) => p.length === 2 && p.includes(b) && p.includes(next)), `${b}+${next}`).toBe(true);
      expect(pairs.filter((p) => p.includes(b)), b).toHaveLength(2);
    }
  });

  it('cada combinação pede a junção dos dois ramos e mora no primeiro deles', () => {
    for (const t of combos) {
      expect(t.requiresAll, t.id).toHaveLength(2);
      for (const id of t.requiresAll!) {
        const req = node(id);
        // A junção é o nó logo depois da bifurcação.
        expect(req.requires?.length, `${t.id} pede ${id}`).toBe(2);
      }
      expect(node(t.requiresAll![0]!).branch, t.id).toBe(t.branch);
      expect(t.capstone, t.id).toBeFalsy();
    }
  });

  it('só abre com as duas junções: uma só não basta', () => {
    const combo = node('tCloneDecoy');
    const ctx = (owned: string[]) => ({ owned, points: 99, stageIndex: 0, unlocked: new Set<string>() });
    expect(talentState(combo, data.talents, ctx([]))).toBe('locked');
    expect(talentState(combo, data.talents, ctx(['tCloneBlast']))).toBe('locked');
    expect(talentState(combo, data.talents, ctx(['tShadowShuriken']))).toBe('locked');
    expect(canBuyTalent(combo, data.talents, ctx(['tCloneBlast', 'tShadowShuriken']))).toBe(true);
  });

  it('na run: comprando as duas junções, a combinação entra e soma os bônus', () => {
    let run = { ...newRun(1, 'normal', data), talentPoints: 30 };
    const unlocked = new Set<string>();
    for (const id of ['tMoreClones', 'tRendan', 'tCloneBlast', 'tPrankKing', 'tHarem']) run = buyTalent(run, id, unlocked, data);
    expect(canBuyTalent(node('tCloneDecoy'), data.talents, talentContext(run, unlocked))).toBe(false);
    run = buyTalent(run, 'tShadowShuriken', unlocked, data);
    expect(run.learned).toContain('jShadowShuriken');
    const before = heroMods(run, data);
    run = buyTalent(run, 'tCloneDecoy', unlocked, data);
    const after = heroMods(run, data);
    expect(after.extraClones).toBe(before.extraClones + 1);
    expect(after.effectChanceBonus).toBeCloseTo(before.effectChanceBonus + 0.1);
  });
});

describe('regras dos talentos finais (v0.71.0)', () => {
  it('Exército de sombras: com clone ativo, o golpe de alvo único cai sempre no clone', () => {
    // Rng 0,7: os golpes acertam (abaixo do acerto), mas o sorteio de bloqueio do clone (50%) falharia.
    const fight = (m: Partial<FighterMods>) => {
      const s0 = startBattle(setup({ allies: [hero({ mods: mods(m), techniques: ['jStrike'] })], enemies: [foe({ maxHp: 999, hp: 999 })] }), data, fixed(0.7));
      s0.fighters[0]!.clones = 2;
      // A ação do jogador fecha a rodada: o inimigo responde com um golpe de alvo único.
      return hit(s0, 'jStrike', 'e0', fixed(0.7));
    };
    const plain = fight({});
    expect(plain.log.some((e) => e.type === 'cloneBlock')).toBe(false);
    expect(plain.fighters[0]!.hp).toBeLessThan(100);
    const withTalent = fight({ cloneShield: true });
    expect(withTalent.log.some((e) => e.type === 'cloneBlock')).toBe(true);
    expect(withTalent.fighters[0]!.hp).toBe(100);
    expect(withTalent.fighters[0]!.clones).toBe(1);
  });

  it('Mestre da trapaça: golpe que acerta um alvo atordoado é sempre crítico', () => {
    const fight = (m: Partial<FighterMods>) => {
      const s0 = startBattle(setup({ allies: [hero({ mods: mods(m) })], enemies: [foe({ maxHp: 999, hp: 999 })] }), data, fixed(0));
      s0.fighters.find((f) => f.uid === 'e0')!.effects = [{ kind: 'stun', turns: 3 }];
      // 0,5: acerta (Golpe tem 90% de acerto) mas fica longe da chance normal de crítico.
      return hit(s0, 'jStrike', 'e0', fixed(0.5));
    };
    const crit = (s: JBattle) => s.log.find((e) => e.type === 'damage' && e.target === 'e0');
    expect(crit(fight({}))).toMatchObject({ crit: false });
    expect(crit(fight({ stunnedAlwaysCrit: true }))).toMatchObject({ crit: true });
  });

  it('Chefe dos sapos: o Kuchiyose gira duas vezes e fica com o sapo que vem depois na lista', () => {
    const roll = (m: Partial<FighterMods>, ...rng: number[]) => {
      const s0 = startBattle(setup({ allies: [hero({ mods: mods(m), techniques: ['jStrike', 'jKuchiyose'] })], enemies: [foe({ maxHp: 999, hp: 999 })] }), data, fixed(0));
      const s1 = hit(s0, 'jKuchiyose', 'e0', seq(...rng));
      const e = s1.log.find((x) => x.type === 'roll');
      return e?.type === 'roll' ? e.variant : null;
    };
    // Pesos 30/35/25/10: 0,05 cai nos girinos e 0,95 no Gamabunta.
    expect(roll({}, 0.05, 0.95)).toBe('jTadpole');
    expect(roll({ rollTwice: true }, 0.05, 0.95)).toBe('jGamabunta');
    expect(roll({ rollTwice: true }, 0.95, 0.05)).toBe('jGamabunta');
  });

  it('Chakra emprestado: com o HP abaixo da metade, o peso do Gamabunta sobe', () => {
    const roll = (hp: number) => {
      const s0 = startBattle(setup({ allies: [hero({ hp, mods: mods({ lowHpRollWeights: { jGamabunta: 30 } }), techniques: ['jStrike', 'jKuchiyose'] })], enemies: [foe({ maxHp: 999, hp: 999 })] }), data, fixed(0));
      const e = hit(s0, 'jKuchiyose', 'e0', seq(0.8)).log.find((x) => x.type === 'roll');
      return e?.type === 'roll' ? e.variant : null;
    };
    // 0,8 de 100 = 80: Gamatatsu (65 a 90). Com +30 no Gamabunta, 0,8 de 130 = 104: Gamabunta (90 a 130).
    expect(roll(100)).toBe('jGamatatsu');
    expect(roll(40)).toBe('jGamabunta');
  });

  it('Fúria da Kyuubi: em vez de cair, fica com 1 de HP e o chakra da Kyuubi toma conta', () => {
    const s0 = startBattle(
      setup({ allies: [hero({ hp: 5, speed: 1, mods: mods({ surviveOnce: true, surviveForm: 'kyuubiBrief' }) })], enemies: [foe({ speed: 50, maxHp: 999, hp: 999, offense: { taijutsu: 60, ninjutsu: 10, genjutsu: 5 } })] }),
      data,
      fixed(0),
    );
    const me = s0.fighters[0]!;
    expect(s0.log.some((e) => e.type === 'survive')).toBe(true);
    expect(me.down).toBe(false);
    expect(me.form).toBe('kyuubiBrief');
    expect(me.techniques).toContain('jKyuubiClaw');
    // A forma cura 15% do HP máximo ao entrar: 1 + 15.
    expect(me.hp).toBe(16);
  });

  it('Futuro Hokage: o talento final dos Laços dá a cada integrante da equipe uma queda evitada', () => {
    const final = node('tFutureHokage');
    expect(final.teamMods).toMatchObject({ surviveOnce: true });
    const ally = hero({ defId: 'sasuke', protagonist: false, hp: 5, speed: 1, mods: mods(final.teamMods!) });
    const s0 = startBattle(
      setup({ allies: [hero({ speed: 2 }), ally], enemies: [foe({ speed: 50, maxHp: 999, hp: 999, ai: 'brute', offense: { taijutsu: 60, ninjutsu: 10, genjutsu: 5 } })] }),
      data,
      fixed(0),
    );
    // O inimigo bate em alguém da equipe; quem tem a queda evitada não cai no primeiro golpe fatal.
    const sasuke = s0.fighters.find((f) => f.defId === 'sasuke')!;
    const survived = s0.log.some((e) => e.type === 'survive' && e.target === sasuke.uid);
    if (survived) expect([sasuke.down, sasuke.hp]).toEqual([false, 1]);
    else expect(sasuke.hp).toBe(5);
  });

  it('Rasengan que atravessa: o dano que sobra do golpe fatal passa para o próximo inimigo', () => {
    const fight = (m: Partial<FighterMods>) => {
      const s0 = startBattle(
        setup({ allies: [hero({ mods: mods(m), techniques: ['jStrike', 'jRasengan'] })], enemies: [foe({ maxHp: 10, hp: 10 }), foe({ maxHp: 200, hp: 200 })] }),
        data,
        fixed(0.5),
      );
      return hit(s0, 'jRasengan', 'e0', fixed(0.5));
    };
    const plain = fight({});
    const pierce = fight({ techOverflow: { jRasengan: 1 } });
    const dealt = plain.log.find((e) => e.type === 'damage' && e.target === 'e0');
    const total = dealt?.type === 'damage' ? dealt.amount : 0;
    expect(total).toBeGreaterThan(10);
    expect(plain.fighters.find((f) => f.uid === 'e1')!.hp).toBe(200);
    expect(pierce.fighters.find((f) => f.uid === 'e0')!.down).toBe(true);
    expect(pierce.fighters.find((f) => f.uid === 'e1')!.hp).toBe(200 - (total - 10));
  });
});
