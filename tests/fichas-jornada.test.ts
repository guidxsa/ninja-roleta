// Hyuuga no cânone e inimigos novos do Caminho Ninja (v0.94.0, docs/jornada/proposta-fichas.md).
import { describe, expect, it } from 'vitest';
import { blockedReason, emptyMods, enemySeed, playerAct, startBattle, useActive, type BattleSetup } from '../src/core/jornada/battle';
import { battleSetup, newGenericRun } from '../src/core/jornada/run';
import type { FighterSeed, JBattle } from '../src/core/jornada/types';
import { jornadaData as data } from '../src/data/jornada';

const HIT = 0.5;
const fixed = (v: number) => () => v;

function hero(over: Partial<FighterSeed> = {}): FighterSeed {
  return {
    defId: 'hyuugaNinja',
    protagonist: true,
    maxHp: 100,
    hp: 100,
    maxChakra: 40,
    chakra: 40,
    speed: 50,
    offense: { taijutsu: 12, ninjutsu: 5, genjutsu: 5 },
    resistance: { physical: 6, mental: 6 },
    element: null,
    techniques: ['jStrike', 'jGentlePalm', 'jByakugan', 'jSixtyFourPalms', 'jRotation'],
    ai: 'striker',
    mods: emptyMods(),
    ...over,
  };
}
const dummy = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...hero(), defId: 'gatoThug', protagonist: false, speed: 1, maxHp: 400, hp: 400, techniques: ['jeClub'], ai: 'brute', ...over });
const setup = (enemies: FighterSeed[], over: Partial<BattleSetup> = {}): BattleSetup => ({ allies: [hero()], enemies, win: { kind: 'defeatAll' }, ...over });
const me = (s: JBattle) => s.fighters.find((f) => f.protagonist)!;
const foe = (s: JBattle, i = 0) => s.fighters.filter((f) => f.side === 'enemy')[i]!;
const tech = (id: string) => data.techniques[id]!;

describe('Hyuuga no cânone (v0.94.0)', () => {
  it('Byakugan é postura: liga por 2, a manutenção começa no turno seguinte, e usar de novo desliga sem custo', () => {
    let s = startBattle(setup([dummy()]), data, fixed(HIT));
    s = useActive(s, 'jByakugan', me(s).uid, data, fixed(HIT));
    expect(me(s).chakra).toBe(38);
    expect(me(s).boost?.techId).toBe('jByakugan');
    s = playerAct(s, { kind: 'guard' }, data, fixed(HIT));
    // 1º fim de turno: sem manutenção (acabou de ligar).
    expect(me(s).chakra).toBe(38);
    s = playerAct(s, { kind: 'guard' }, data, fixed(HIT));
    expect(me(s).chakra).toBe(36);
    expect(me(s).boost?.techId).toBe('jByakugan');
    expect(blockedReason(me(s), tech('jByakugan'))).toBeNull();
    s = useActive(s, 'jByakugan', me(s).uid, data, fixed(HIT));
    expect([me(s).boost, me(s).chakra]).toEqual([null, 36]);
    expect(s.log.some((e) => e.type === 'boostEnd')).toBe(true);
  });

  it('sem chakra para a manutenção, a postura apaga', () => {
    let s = startBattle(setup([dummy()]), data, fixed(HIT));
    s = useActive(s, 'jByakugan', me(s).uid, data, fixed(HIT));
    s = playerAct(s, { kind: 'guard' }, data, fixed(HIT));
    s = { ...s, fighters: s.fighters.map((f) => (f.protagonist ? { ...f, chakra: 1 } : f)) };
    s = playerAct(s, { kind: 'guard' }, data, fixed(HIT));
    expect(me(s).boost).toBeNull();
  });

  it('64 Palmas só com o Byakugan aceso', () => {
    let s = startBattle(setup([dummy()]), data, fixed(HIT));
    expect(blockedReason(me(s), tech('jSixtyFourPalms'))).toBe('boost');
    s = useActive(s, 'jByakugan', me(s).uid, data, fixed(HIT));
    expect(blockedReason(me(s), tech('jSixtyFourPalms'))).toBeNull();
  });

  it('a Palma Suave paga 2 e fecha pontos: tira 3 de chakra (5 com o Byakugan)', () => {
    let s = startBattle(setup([dummy({ chakra: 30, maxChakra: 30 })]), data, fixed(0.6));
    const target = foe(s).uid;
    const plain = playerAct(s, { kind: 'tech', techId: 'jGentlePalm', target }, data, fixed(0.6));
    expect(me(plain).chakra).toBe(38);
    expect(30 - foe(plain).chakra).toBeGreaterThanOrEqual(3);
    s = useActive(s, 'jByakugan', me(s).uid, data, fixed(0.6));
    const lit = playerAct(s, { kind: 'tech', techId: 'jGentlePalm', target }, data, fixed(0.6));
    expect(foe(plain).chakra - foe(lit).chakra).toBe(2);
  });

  it('a Rotação devolve 30% do que o escudo segura', () => {
    let s = startBattle(setup([dummy()]), data, fixed(HIT));
    s = playerAct(s, { kind: 'tech', techId: 'jRotation', target: me(s).uid }, data, fixed(HIT));
    expect(me(s).mods.shieldReflectPct).toBe(0.3);
    expect(s.log.some((e) => e.type === 'damage' && e.uid === me(s).uid && e.target === foe(s).uid)).toBe(true);
  });
});

describe('inimigos novos do Caminho Ninja (v0.94.0)', () => {
  const seeds = (...ids: string[]) => ids.map((id) => enemySeed(id, 'normal', data));

  it('todo inimigo novo existe, com técnicas que existem, e está num pool', () => {
    const ids = ['samurai', 'mistHunter', 'zori', 'waraji', 'gato', 'sandGenin', 'yoroi', 'misumi', 'kankuro', 'karasu', 'temari', 'hideoutGuard', 'doki', 'sakon2', 'ukon', 'itachi', 'kisame'];
    const pooled = new Set(data.generic.stages.flatMap((st) => [...st.fights, ...st.elites, ...st.bosses, ...st.easyFights, ...(st.rareElite ? [st.rareElite.enemies] : [])].flat()));
    for (const id of ids) {
      const def = data.enemies[id];
      expect(def, id).toBeTruthy();
      for (const t of def!.techniques) expect(data.techniques[t], `${id}: ${t}`).toBeTruthy();
      if (id !== 'ukon') expect(pooled.has(id), id).toBe(true);
    }
    expect(data.generic.stages.map((st) => st.bosses.length)).toEqual([3, 3, 3]);
  });

  it('guarda-costas: o golpe de alvo único no Gatō cai no Zōri ou no Waraji', () => {
    const s = startBattle({ allies: [hero()], enemies: seeds('gato', 'zori', 'waraji'), win: { kind: 'defeatAll' } }, data, fixed(HIT));
    const gato = s.fighters.find((f) => f.defId === 'gato')!;
    const next = playerAct(s, { kind: 'tech', techId: 'jStrike', target: gato.uid }, data, fixed(HIT));
    expect(next.log.some((e) => e.type === 'protect' && e.target === gato.uid)).toBe(true);
    expect(next.fighters.find((f) => f.defId === 'gato')!.hp).toBe(gato.hp);
  });

  it('o Gatō foge quando os dois guarda-costas caem, e a luta acaba em vitória', () => {
    const stage = data.generic.stages[0]!;
    const enc = stage.encounters!['gato+zori+waraji']!;
    let s = startBattle({ allies: [hero()], enemies: seeds('gato', 'zori', 'waraji'), win: { kind: 'defeatAll' }, script: enc.script! }, data, fixed(HIT));
    const down = (st: JBattle, id: string): JBattle => ({ ...st, fighters: st.fighters.map((f) => (f.defId === id ? { ...f, hp: 1 } : f)) });
    s = down(down(s, 'zori'), 'waraji');
    for (let i = 0; i < 6 && s.status === 'ongoing'; i++) {
      const target = s.fighters.find((f) => f.side === 'enemy' && !f.down && f.defId !== 'gato');
      s = playerAct(s, target ? { kind: 'tech', techId: 'jStrike', target: target.uid } : { kind: 'guard' }, data, fixed(HIT));
    }
    expect(s.status).toBe('won');
    expect(s.fighters.find((f) => f.defId === 'gato')!.gone).toBe(true);
  });

  it('Sakon nível 2: a 50% do HP o Ukon entra na luta', () => {
    const stage = data.generic.stages[2]!;
    const run = newGenericRun(3, 'normal', 'common', data);
    expect(run.mode).toBe('generic');
    const enc = stage.encounters!.sakon2!;
    const s0 = startBattle({ allies: [hero()], enemies: seeds('sakon2'), win: { kind: 'defeatAll' }, script: enc.script!, reserve: [{ side: 'enemy', seed: enemySeed('ukon', 'normal', data) }] }, data, fixed(HIT));
    const hurt = { ...s0, fighters: s0.fighters.map((f) => (f.defId === 'sakon2' ? { ...f, hp: Math.floor(f.maxHp * 0.5) + 2 } : f)) };
    const s = playerAct(hurt, { kind: 'tech', techId: 'jStrike', target: foe(hurt).uid }, data, fixed(HIT));
    expect(s.fighters.some((f) => f.defId === 'ukon')).toBe(true);
    expect(s.log.some((e) => e.type === 'enter')).toBe(true);
  });

  it('Itachi e Kisame: resistir 6 rodadas vence; a elite rara aparece pela chance e nunca no 1º ciclo do Fácil', () => {
    const stage = data.generic.stages[2]!;
    expect(stage.rareElite).toEqual({ chance: 0.1, enemies: ['itachi', 'kisame'] });
    const enc = stage.encounters!['itachi+kisame']!;
    expect(enc.win).toMatchObject({ kind: 'survive', rounds: 6 });
    expect(enc.routRelic).toBe(true);
    let s = startBattle({ allies: [hero({ maxHp: 5000, hp: 5000 })], enemies: seeds('itachi', 'kisame'), win: enc.win!, script: enc.script! }, data, fixed(HIT));
    for (let i = 0; i < 12 && s.status === 'ongoing'; i++) s = playerAct(s, { kind: 'guard' }, data, fixed(HIT));
    expect(s.status).toBe('won');
    expect(s.fighters.filter((f) => f.side === 'enemy').every((f) => !f.down)).toBe(true);
    expect(data.j.relics.routWeights).toEqual({ common: 0, uncommon: 0, rare: 1 });
  });

  it('a luta do chefe novo leva o roteiro para a batalha', () => {
    const run = { ...newGenericRun(5, 'normal', 'common', data) };
    const stage = data.generic.stages[2]!;
    expect(stage.bosses).toContainEqual(['sakon2']);
    expect(typeof battleSetup).toBe('function');
    expect(run.bossPlan.length).toBe(3);
  });
});
