// Rascunho de talentos (docs/jornada/talentos.md#rascunho): núcleo no começo, oferta de 3 (4 com pontos guardados),
// troca por estágio, talento final pelo progresso no ramo e bônus fixo por técnica.
import { describe, expect, it } from 'vitest';
import { emptyMods, mergeMods, playerAct, startBattle, type FighterSeed } from '../src/core/jornada/battle';
import type { JornadaData } from '../src/core/jornada/data';
import { nodeTags, relicTags } from '../src/core/jornada/draft';
import {
  buyTalent,
  chooseCore,
  draftRerollsLeft,
  needsCore,
  newGenericRun,
  rerollTalents,
  runCoreOffer,
  talentContext,
  talentOffer,
  talentTreeComplete,
  type JRun,
} from '../src/core/jornada/run';
import { talentState } from '../src/core/jornada/talents';
import { jornadaData as data } from '../src/data/jornada';

const common = (seed = 3): JRun => newGenericRun(seed, 'normal', 'common', data, new Set(), null, 'water');
const node = (id: string) => data.talents.find((n) => n.id === id)!;

describe('rascunho de talentos', () => {
  it('o Comum começa com o núcleo pendente; o prodígio e as outras classes seguem a árvore clássica', () => {
    const run = common();
    expect(run.draft).toMatchObject({ core: null });
    expect(needsCore(run)).toBe(true);
    expect(talentOffer(run, data)).toEqual([]);
    expect(newGenericRun(3, 'normal', 'common', data, new Set(), null, null).draft).toBeUndefined();
    expect(newGenericRun(3, 'normal', 'uchiha', data).draft).toBeUndefined();
  });

  it('oferece 3 núcleos diferentes, com um de dano e um de apoio, sempre os mesmos para a seed', () => {
    for (let seed = 1; seed < 30; seed++) {
      const offer = runCoreOffer(common(seed), data);
      expect(new Set(offer).size).toBe(3);
      const kinds = offer.map((b) => data.talents.find((n) => n.owner === 'commonNinja' && n.branch === b && n.core)!.core);
      expect(kinds).toContain('dano');
      expect(kinds).toContain('apoio');
      expect(runCoreOffer(common(seed), data)).toEqual(offer);
    }
  });

  it('o núcleo dá de graça o nó de núcleo, a raiz e a técnica do estilo', () => {
    let seed = 1;
    while (!runCoreOffer(common(seed), data).includes('leafStyle')) seed++;
    const run = chooseCore(common(seed), 'leafStyle', data);
    expect(run.draft!.core).toBe('leafStyle');
    // Só o núcleo (v0.93.1: a raiz do ramo deixou de vir de graça); a técnica do estilo vem com ele.
    expect(run.talents).toEqual(['tCoreLeaf']);
    expect(run.learned).toContain('jLeafHurricane');
    expect(run.talentPoints).toBe(0);
    // Os outros núcleos ficam fechados; não dá para escolher de novo.
    expect(talentState(node('tCoreTools'), data.talents, talentContext(run, new Set()))).toBe('excluded');
    expect(() => chooseCore(run, 'tools', data)).toThrow();
  });

  it('o núcleo Elemento traz o Nível II (coreGrants)', () => {
    let seed = 1;
    while (!runCoreOffer(common(seed), data).includes('element')) seed++;
    const run = chooseCore(common(seed), 'element', data);
    expect(run.talents).toEqual(['tCoreElement', 'tElement2']);
    // A Determinação traz o +25% de XP.
    let s2 = 1;
    while (!runCoreOffer(common(s2), data).includes('will')) s2++;
    expect(chooseCore(common(s2), 'will', data).talents).toEqual(['tCoreWill', 'tDetermination']);
    expect(run.learned).toContain('jWaterShark');
  });

  it('todo ramo com núcleo alcança o talento final (respeitando a bifurcação)', () => {
    const owners = data.j.talentDraft.owners;
    for (const owner of owners) {
      for (const core of data.talents.filter((n) => n.owner === owner && n.core)) {
        const own = data.talents.filter((n) => n.owner === owner && n.branch === core.branch && !n.core && !n.capstone && !n.requiresAll);
        // De cada par da bifurcação, só um lado conta.
        const reachable = own.filter((n) => !n.excludes || n.excludes.every((x) => own.findIndex((o) => o.id === x) > own.indexOf(n)));
        expect(reachable.length, core.branch).toBeGreaterThanOrEqual(data.j.talentDraft.capstoneNeeds);
      }
    }
  });

  it('não escolhe um núcleo fora da oferta', () => {
    const run = common();
    const out = ['element', 'tools', 'leafStyle', 'clones', 'team', 'will'].find((b) => !runCoreOffer(run, data).includes(b))!;
    expect(() => chooseCore(run, out, data)).toThrow();
  });

  it('a oferta tem 3 cartões (4 com pontos guardados), o primeiro do ramo do núcleo, e muda depois de cada compra', () => {
    const base = common();
    const core = runCoreOffer(base, data)[0]!;
    const run = { ...chooseCore(base, core, data), talentPoints: 2 };
    const offer = talentOffer(run, data);
    expect(offer).toHaveLength(3);
    expect(new Set(offer).size).toBe(3);
    expect(node(offer[0]!).branch).toBe(core);
    expect(talentOffer(run, data)).toEqual(offer);
    expect(talentOffer({ ...run, talentPoints: 3 }, data)).toHaveLength(4);
    const cheap = offer.find((id) => node(id).cost <= 2)!;
    const next = buyTalent(run, cheap, new Set(), data);
    expect(next.talents).toContain(cheap);
    expect(talentOffer(next, data)).not.toContain(cheap);
  });

  it('só compra o que está na oferta', () => {
    const base = common();
    const run = { ...chooseCore(base, runCoreOffer(base, data)[0]!, data), talentPoints: 10 };
    const offer = talentOffer(run, data);
    const outside = data.talents.find((n) => n.owner === 'commonNinja' && !offer.includes(n.id) && !n.core && !run.talents.includes(n.id) && !n.capstone && !n.requiresAll)!;
    expect(() => buyTalent(run, outside.id, new Set(), data)).toThrow('fora da oferta');
  });

  it('sem a ordem do ramo: um nó do meio do ramo pode sair cedo; a bifurcação ainda fecha o outro lado', () => {
    const base = common();
    const run = { ...chooseCore(base, runCoreOffer(base, data)[0]!, data), talentPoints: 10 };
    const ctx = talentContext(run, new Set());
    expect(talentState(node('tCFightRhythm'), data.talents, ctx)).toBe('available');
    const forked = { ...run, talents: [...run.talents, 'tCHurricane'] };
    expect(talentState(node('tCFirmFist'), data.talents, talentContext(forked, new Set()))).toBe('excluded');
  });

  it('o talento final pede 4 talentos do ramo (fora o núcleo, o final e as combinações)', () => {
    const base = common();
    const run = { ...chooseCore(base, runCoreOffer(base, data)[0]!, data), talentPoints: 10 };
    const with3 = { ...run, talents: [...run.talents, 'tCBasicTraining', 'tCHurricane', 'tCFightRhythm'] };
    expect(talentState(node('tCLeafCombo'), data.talents, talentContext(with3, new Set()))).toBe('locked');
    const with4 = { ...with3, talents: [...with3.talents, 'tCReflexes'] };
    expect(talentState(node('tCLeafCombo'), data.talents, talentContext(with4, new Set()))).toBe('available');
  });

  it('uma troca grátis por estágio, que volta no estágio seguinte', () => {
    const base = common();
    const run = { ...chooseCore(base, runCoreOffer(base, data)[0]!, data), talentPoints: 2 };
    expect(draftRerollsLeft(run, data)).toBe(1);
    const rolled = rerollTalents(run, data);
    expect(rolled.draft!.nonce).toBe(1);
    expect(draftRerollsLeft(rolled, data)).toBe(0);
    expect(() => rerollTalents(rolled, data)).toThrow();
    expect(draftRerollsLeft({ ...rolled, stageIndex: 1 }, data)).toBe(1);
    // Em alguma seed a troca muda a oferta (com o pool grande, quase sempre).
    expect(talentOffer(rolled, data)).not.toEqual(talentOffer(run, data));
  });

  it('a árvore completa no rascunho: sem nada a oferecer, o ponto vira ryō', () => {
    const base = common();
    const run = chooseCore(base, runCoreOffer(base, data)[0]!, data);
    expect(talentTreeComplete(run, data)).toBe(false);
    const all = data.talents.filter((n) => n.owner === 'commonNinja' && !n.core).map((n) => n.id);
    // Com tudo comprado (bifurcações dos dois lados não importam: o fechado conta como "nunca"), fecha.
    const ranks = Object.fromEntries(data.talents.filter((n) => n.owner === 'commonNinja' && n.maxRank).map((n) => [n.id, n.maxRank!]));
    expect(talentTreeComplete({ ...run, talents: [...run.talents, ...all], talentRanks: ranks }, data)).toBe(true);
  });

  it('tags saem dos bônus: talento e relíquia de taijutsu combinam', () => {
    expect(nodeTags(node('tKunaiPro'), data)).toContain('taijutsu');
    expect(nodeTags(node('tCCommand'), data)).toContain('equipe');
    expect(nodeTags(node('tWireTrap'), data)).toContain('controle');
    expect(relicTags(data.relics.find((r) => r.id === 'kunaiPouch')!)).toContain('taijutsu');
  });
});

describe('bônus por técnica, não por golpe (v0.93.0)', () => {
  const seed = (over: Partial<FighterSeed> = {}): FighterSeed => ({
    defId: 'commonNinja',
    protagonist: true,
    maxHp: 1000,
    hp: 1000,
    maxChakra: 60,
    chakra: 30,
    speed: 50,
    offense: { taijutsu: 10, ninjutsu: 10, genjutsu: 5 },
    resistance: { physical: 6, mental: 6 },
    element: null,
    techniques: ['jLeafHurricane'],
    ai: 'striker',
    mods: emptyMods(),
    ...over,
  });
  const foe = seed({ defId: 'gatoThug', protagonist: false, speed: 1, techniques: ['jeClub'], ai: 'brute' });
  const rule = (on: boolean): JornadaData => ({ ...data, j: { ...data.j, combat: { ...data.j.combat, flatPerTechnique: on } } });
  /** Dano do Furacão da Folha (2 golpes que acertam) e o chakra que voltou. */
  const hurricane = (m: Parameters<typeof mergeMods>[1], d: JornadaData) => {
    const b = startBattle({ allies: [seed({ mods: mergeMods(emptyMods(), m) })], enemies: [foe], win: { kind: 'defeatAll' } }, d, () => 0.5);
    const after = playerAct(b, { kind: 'tech', techId: 'jLeafHurricane', target: 'e0' }, d, () => 0.5);
    const e = after.fighters.find((f) => f.side === 'enemy')!;
    const me = after.fighters.find((f) => f.protagonist)!;
    return { dealt: e.maxHp - e.hp, chakra: me.chakra };
  };

  it('o dano fixo do taijutsu entra uma vez por técnica de vários golpes', () => {
    for (const on of [true, false]) {
      const d = rule(on);
      const extra = hurricane({ taijutsuFlat: 6 }, d).dealt - hurricane({}, d).dealt;
      if (on) expect(extra).toBeGreaterThan(0);
      else expect(extra).toBeGreaterThan(hurricane({ taijutsuFlat: 6 }, rule(true)).dealt - hurricane({}, rule(true)).dealt);
    }
  });

  it('o Ritmo de luta devolve chakra uma vez por uso', () => {
    const on = hurricane({ taijutsuHitChakra: 1 }, rule(true)).chakra - hurricane({}, rule(true)).chakra;
    const off = hurricane({ taijutsuHitChakra: 1 }, rule(false)).chakra - hurricane({}, rule(false)).chakra;
    expect(on).toBe(1);
    expect(off).toBe(2);
  });
});
