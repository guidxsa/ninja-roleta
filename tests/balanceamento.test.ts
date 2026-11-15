// Balanceamento aprovado pelo usuário (docs/balanceamento/diagnostico.md): regras novas de cada fase.
import { describe, expect, it } from 'vitest';
import { emptyMods, hitDamage, mergeMods, playerAct, startBattle } from '../src/core/jornada/battle';
import { relicFits, relicNeeds } from '../src/core/jornada/relics';
import { gateHpUpkeep, payGateUpkeep } from '../src/core/gates';
import { fitRelics, gainRelic, heroMods, heroNeeds, newGenericRun, newRun } from '../src/core/jornada/run';
import type { FighterSeed } from '../src/core/jornada/types';
import { createRoletaPlayer } from '../src/core/roleta/player';
import { relicEffects, relicPool, gainRoletaRelic } from '../src/core/roleta/run';
import { jornadaData as data } from '../src/data/jornada';
import { roletaData } from '../src/data/roleta/index';

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
  techniques: ['jStrike'],
  ai: 'striker',
  mods: emptyMods(),
  ...over,
});

describe('Fase 1 · dano geral soma (G1)', () => {
  it('Jornada: +25% e +15% de dano geral dão +40%; tipo e técnica seguem multiplicando', () => {
    const m = mergeMods(mergeMods(emptyMods(), { damageMult: 1.25 }), { damageMult: 1.15 });
    expect(m.damageMult).toBeCloseTo(1.4, 10);
    const t = mergeMods(mergeMods(emptyMods(), { typeDamageMult: { ninjutsu: 1.15 } }), { typeDamageMult: { ninjutsu: 1.1 } });
    expect(t.typeDamageMult.ninjutsu).toBeCloseTo(1.265, 10);
  });

  it('Jornada: Lâmina de chakra e Chapéu do Hokage juntos somam', () => {
    const run = gainRelic(gainRelic(newRun(1, 'normal', data), 'chakraBlade', data), 'hokageHat', data);
    expect(heroMods(run, data).damageMult).toBeCloseTo(1.4, 10);
  });

  it('Roleta: os bônus de dano geral das relíquias somam', () => {
    const p0 = createRoletaPlayer({ lineageId: null, elements: ['fire'], jinchuuriki: false }, roletaData);
    const p = gainRoletaRelic(gainRoletaRelic(p0, 'chakraBlade', roletaData), 'masterKunai', roletaData);
    expect(relicEffects(p, roletaData).damageMult).toBeCloseTo(1.23, 10);
  });
});

describe('Fase 1 · filtro de compatibilidade das relíquias (J4)', () => {
  const def = (id: string) => data.relics.find((r) => r.id === id)!;

  it('o que cada relíquia pede sai do próprio efeito', () => {
    expect(relicNeeds(def('toadContract'), 'jornada')).toEqual(['ninjutsu']);
    expect(relicNeeds(def('forbiddenScroll'), 'jornada')).toEqual(['clones']);
    // Começar com clones serve para qualquer um.
    expect(relicNeeds(def('summoningScroll'), 'jornada')).toEqual([]);
    // No Roleta o Contrato dos sapos é a invocação: não pede ninjutsu.
    expect(relicNeeds(def('toadContract'), 'roleta')).toEqual([]);
  });

  it('Jornada: o prodígio não recebe bônus de ninjutsu nem de genjutsu', () => {
    const prodigy = newGenericRun(7, 'normal', 'common', data, new Set(), null, null);
    const has = heroNeeds(prodigy, data);
    expect(has.has('ninjutsu')).toBe(false);
    expect(has.has('genjutsu')).toBe(false);
    const pool = fitRelics(prodigy, data).map((r) => r.id);
    expect(pool).not.toContain('toadContract');
    expect(relicFits(def('toadContract'), 'jornada', has)).toBe(false);
    // O Comum de fogo tem ninjutsu.
    const fire = newGenericRun(7, 'normal', 'common', data, new Set(), null, 'fire');
    expect(fitRelics(fire, data).map((r) => r.id)).toContain('toadContract');
  });

  it('Roleta: o Incenso dos sonhos só sai para quem tem genjutsu de dano', () => {
    const common = createRoletaPlayer({ lineageId: null, elements: ['fire'], jinchuuriki: false }, roletaData);
    const uchiha = createRoletaPlayer({ lineageId: 'uchiha', elements: ['fire'], jinchuuriki: false }, roletaData);
    expect(relicPool(common, roletaData).some((r) => r.id === 'dreamIncense')).toBe(false);
    expect(relicPool(uchiha, roletaData).some((r) => r.id === 'dreamIncense')).toBe(true);
  });
});

describe('Fase 1 · relíquias refeitas e de equipe (J3, J4, R3)', () => {
  it('Armadura samurai: o protagonista começa com 20% de escudo, os suportes com 10%', () => {
    const run = gainRelic(newRun(1, 'normal', data), 'samuraiArmor', data);
    expect(heroMods(run, data).startShieldPct).toBeCloseTo(0.2, 10);
    expect(data.relics.find((r) => r.id === 'samuraiArmor')!.teamMods!.startShieldPct).toBe(0.1);
  });

  it('Linha de sombra vale contra alvo com Medo; Colete acolchoado cura 8% ao Defender', () => {
    const b = startBattle({ allies: [hero({ mods: mergeMods(emptyMods(), { controlledDamageMult: 1.2, guardHealPct: 0.08 }), hp: 50 })], enemies: [{ ...hero(), defId: 'gatoThug', protagonist: false, speed: 1, techniques: ['jeClub'], ai: 'brute' }], win: { kind: 'defeatAll' } }, data, fixed(0.5));
    const me = b.fighters[0]!;
    const foe = b.fighters[1]!;
    const scared = { ...foe, effects: [{ kind: 'fear' as const, turns: 2 }] };
    expect(hitDamage(me, scared, data.techniques.jStrike!, data)).toBe(Math.floor(hitDamage(me, foe, data.techniques.jStrike!, data) * 1.2));
    const guarded = playerAct(b, { kind: 'guard' }, data, fixed(0.5));
    expect(guarded.log.some((e) => e.type === 'heal' && e.target === me.uid && e.amount === 8)).toBe(true);
  });

  it('Diário do mestre dá ponto e XP; Bolsa reforçada dá um kit', () => {
    const run = newRun(1, 'normal', data);
    const journal = gainRelic(run, 'mastersJournal', data);
    expect(journal.talentPoints).toBe(run.talentPoints + 1);
    expect(journal.xp).toBeGreaterThan(run.xp);
    expect(gainRelic(run, 'sturdyBag', data).bag.hpKit).toBe(run.bag.hpKit + 1);
  });

  it('Roleta: Núcleo de chakra recupera 2 por rodada', () => {
    const p0 = createRoletaPlayer({ lineageId: null, elements: ['fire'], jinchuuriki: false }, roletaData);
    expect(relicEffects(gainRoletaRelic(p0, 'chakraCore', roletaData), roletaData).chakraRegen).toBe(2);
  });
});

describe('Fase 2 · Portões com custo misto (C4)', () => {
  const g = { upkeepBase: 2, upkeepGrowth: 1.5, chakraShare: 0.5, hpPctPerLevel: 0.01 };

  it('manter custa metade em chakra e 1% do HP máximo por nível do portão', () => {
    expect(payGateUpkeep({ chakra: 10, hp: 100, maxHp: 100 }, 1, 1, g)).toEqual({ chakra: 9, hp: 99, cost: 1, hpCost: 1 });
    expect(payGateUpkeep({ chakra: 10, hp: 100, maxHp: 120 }, 3, 5, g)).toEqual({ chakra: 7, hp: 94, cost: 3, hpCost: 6 });
    expect(gateHpUpkeep(5, 50, g)).toBe(2);
  });

  it('sem chakra ou sem HP para ficar com 1, os Portões fecham', () => {
    expect(payGateUpkeep({ chakra: 0, hp: 100, maxHp: 100 }, 1, 1, g)).toBeNull();
    expect(payGateUpkeep({ chakra: 10, hp: 1, maxHp: 100 }, 1, 1, g)).toBeNull();
    expect(payGateUpkeep({ chakra: 10, hp: 2, maxHp: 100 }, 1, 1, g)).toEqual({ chakra: 9, hp: 1, cost: 1, hpCost: 1 });
  });

  it('o jogo usa a regra nova nos dois modos', () => {
    expect(data.base.gateCosts).toMatchObject({ chakraShare: 0.5, hpPctPerLevel: 0.01 });
    expect(roletaData.base.balance.gateCosts).toBe(data.base.gateCosts);
  });
});
