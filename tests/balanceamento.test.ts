// Balanceamento aprovado pelo usuário (docs/balanceamento/diagnostico.md): regras novas de cada fase.
import { describe, expect, it } from 'vitest';
import { accuracyAgainst, emptyMods, enemySeed, gateOpenCost, hitDamage, hitsOf, hpCost, mergeMods, playerAct, startBattle } from '../src/core/jornada/battle';
import { branchesOf, talentState } from '../src/core/jornada/talents';
import { ptBR } from '../src/data/strings/ptBR';
import { evolutionFor, relicFits, relicNeeds } from '../src/core/jornada/relics';
import { pathRun, playUntil } from '../prototype/lab/fixtures/jornada';
import { gateHpUpkeep, payGateUpkeep } from '../src/core/gates';
import { buyTalent, talentContext, fitRelics, gainRelic, heroMods, heroNeeds, newGenericRun, newRun, resolveEvent, runEnemyMult, runEnemyShape } from '../src/core/jornada/run';
import type { FighterSeed } from '../src/core/jornada/types';
import { createRoletaPlayer, playerTechniques } from '../src/core/roleta/player';
import { battleTechniques, gateForceChance, heavyBodyMult, kitActives, playerAttackOdds, playRoletaRound, sharinganStage, startRoletaBattle, techBlock, useActive, type RBattle } from '../src/core/roleta/battle';
import { scaleVillain } from '../src/core/difficulty';
import { roletaVillainsById } from '../src/data/roleta/villains';
import type { Origin } from '../src/core/types';
import { relicEffects, relicPool, gainRoletaRelic, newRoletaRun, villainFor } from '../src/core/roleta/run';
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

describe('Fase 5 · Jornada e História (H1, H2, H3, J5)', () => {
  it('a força da História muda por estágio (H1); o Caminho Ninja não', () => {
    const run = newRun(1, 'normal', data);
    expect([0, 1, 2, 3].map((i) => runEnemyMult({ ...run, stageIndex: i }, data))).toEqual(data.j.storyStageStrength.map((m) => data.j.storyStrength * m));
    expect(runEnemyMult({ ...newGenericRun(7, 'normal', 'common', data, new Set(), null, 'fire'), stageIndex: 2 }, data)).toBe(data.j.genericStageStrength[2]);
  });

  it('J1 e J2: força por estágio própria da dificuldade e perfil HP/ataque por estágio', () => {
    const run = { ...newRun(1, 'hard', data), stageIndex: 1 };
    const by = { ...data, j: { ...data.j, storyStageStrengthBy: { hard: [1, 0.5, 1, 1] } } };
    expect(runEnemyMult(run, by)).toBeCloseTo(data.j.storyStrength * 0.5);
    expect(runEnemyMult({ ...run, difficulty: 'normal' }, by)).toBeCloseTo(data.j.storyStrength * data.j.storyStageStrength[1]!);
    const shaped = { ...data, j: { ...data.j, storyStageShape: [{ hp: 1, offense: 1 }, { hp: 0.5, offense: 2 }] } };
    expect(runEnemyShape(run, shaped)).toEqual({ hp: 0.5, offense: 2 });
    expect(runEnemyShape({ ...newGenericRun(7, 'normal', 'common', data, new Set(), null, 'fire'), stageIndex: 1 }, shaped)).toEqual({ hp: 1, offense: 1 });
    const flat = enemySeed('zabuza', 'normal', data, 1);
    const split = enemySeed('zabuza', 'normal', data, 1, { hp: 0.5, offense: 2 });
    const def = data.enemies.zabuza!;
    const k = data.j.enemyStrength.normal;
    expect(split.maxHp).toBe(Math.floor(def.hp * k * 0.5));
    expect(split.offense.taijutsu).toBe(Math.floor(def.offense.taijutsu * k * 2));
    expect(split.resistance.physical).toBe(Math.max(1, Math.floor(def.resistance.physical * k * 0.5)));
    expect(enemySeed('zabuza', 'normal', data, 1, { hp: 1, offense: 1 })).toEqual(flat);
  });

  it('J3: o Caminho Ninja tem força por estágio própria (a História não usa)', () => {
    const gen = { ...newGenericRun(7, 'normal', 'common', data, new Set(), null, 'fire'), stageIndex: 2 };
    const with3 = { ...data, j: { ...data.j, genericStageStrength: [1, 1, 1.5] } };
    expect(runEnemyMult(gen, with3)).toBeCloseTo(1.5);
    const canon = { ...newRun(1, 'normal', data), stageIndex: 2 };
    expect(runEnemyMult(canon, with3)).toBeCloseTo(runEnemyMult(canon, data));
  });

  it('XP 100 + 30 por nível (J5); Harem atordoa 60% e a Shuriken das sombras +25% por nível (H2)', () => {
    expect(data.j.xp).toMatchObject({ base: 100, perLevel: 30 });
    expect(data.techniques.jHarem!.onHit).toEqual({ effect: 'stun', chance: 0.6 });
    const t = data.talents.find((x) => x.id === 'tShadowShuriken')!;
    expect(t.rankMods?.techDamageMult?.jShadowShuriken).toBe(1.25);
  });

  it('cena presenciada do estágio 3 da História dá +20 ryō (H3)', () => {
    const stages = data.stages;
    const si = 2;
    const pi = stages[si]!.stops.findIndex((s) => s.kind === 'event' && data.events[(s as { event: string }).event]?.category === 'witness');
    expect(pi).toBeGreaterThanOrEqual(0);
    const run = { ...newRun(1, 'normal', data), stageIndex: si, stopIndex: pi };
    const def = data.events[(stages[si]!.stops[pi] as { event: string }).event]!;
    const opt = def.options.find((o) => !o.minigame && !o.cost)!;
    const out = resolveEvent(run, opt.id, true, data);
    const own = opt.effects.filter((e) => e.kind === 'ryo').reduce((a, e) => a + (e as { n: number }).n, 0);
    expect(out.run.ryo - run.ryo).toBeGreaterThanOrEqual(own + 20);
  });
});

describe('Fase 6 · árvore do Comum (C2, v0.84.0)', () => {
  const tree = data.talents.filter((t) => t.owner === 'commonNinja');
  const foe = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...hero(), defId: 'gatoThug', protagonist: false, techniques: ['jeClub'], ai: 'brute', ...over });

  it('seis ramos em anel, cada um com bifurcação e talento final; seis combinações e três assinaturas', () => {
    expect(branchesOf('commonNinja', data.talents)).toEqual(['element', 'tools', 'leafStyle', 'clones', 'team', 'will']);
    for (const b of branchesOf('commonNinja', data.talents)) {
      const nodes = tree.filter((t) => t.branch === b && !t.requiresAll);
      expect(nodes.filter((t) => t.capstone), b).toHaveLength(1);
      expect(nodes.filter((t) => t.excludes?.length), b).toHaveLength(2);
    }
    const combos = tree.filter((t) => t.requiresAll);
    expect(combos).toHaveLength(9);
    for (const c of combos) for (const id of c.requiresAll!) expect(tree.some((t) => t.id === id), `${c.id} → ${id}`).toBe(true);
    for (const t of tree) expect(ptBR.jornada.talents.list[t.id], t.id).toBeTruthy();
  });

  it('Combo da Folha e Mil golpes: golpes a mais no taijutsu (até +2 pelos clones); o ninjutsu não ganha', () => {
    const f = startBattle({ allies: [hero({ mods: mergeMods(emptyMods(), { taijutsuExtraHits: 1, taijutsuHitsPerClone: 1 }) })], enemies: [foe()], win: { kind: 'defeatAll' } }, data, fixed(0.5)).fighters[0]!;
    const hurricane = data.techniques.jLeafHurricane!;
    expect(hitsOf({ ...f, clones: 0 }, hurricane)).toBe(3);
    expect(hitsOf({ ...f, clones: 5 }, hurricane)).toBe(5);
    expect(hitsOf({ ...f, clones: 5 }, data.techniques.jFireball!)).toBe(1);
  });

  it('penetração por tipo e Ilusão perfeita (acerto menor com clone de pé)', () => {
    const b = startBattle({ allies: [hero()], enemies: [foe({ resistance: { physical: 20, mental: 20 } })], win: { kind: 'defeatAll' } }, data, fixed(0.5));
    const me = b.fighters[0]!;
    const them = b.fighters[1]!;
    const pen = { ...me, mods: mergeMods(me.mods, { typePen: { taijutsu: 0.2 } }) };
    expect(hitDamage(pen, them, data.techniques.jStrike!, data)).toBeGreaterThan(hitDamage(me, them, data.techniques.jStrike!, data));
    const shy = { ...me, mods: mergeMods(me.mods, { cloneEnemyAccuracy: 0.2 }) };
    expect(accuracyAgainst(them, { ...shy, clones: 1 }, data.techniques.jeClub!, data)).toBeLessThan(accuracyAgainst(them, { ...shy, clones: 0 }, data.techniques.jeClub!, data));
  });

  it('Vontade do Fogo: fica de pé com 1 de HP, recupera 25% e fica firme', () => {
    const mods = mergeMods(emptyMods(), { surviveOnce: true, surviveHealPct: 0.25 });
    const b = startBattle({ allies: [hero({ hp: 1, speed: 1, mods })], enemies: [foe({ speed: 99, offense: { taijutsu: 60, ninjutsu: 0, genjutsu: 0 } })], win: { kind: 'defeatAll' } }, data, fixed(0.3));
    const me = b.fighters[0]!;
    expect(b.log.some((e) => e.type === 'survive')).toBe(true);
    expect(me.hp).toBe(1 + Math.floor(me.maxHp * 0.25));
    expect(me.effects.some((e) => e.kind === 'stunGuard')).toBe(true);
  });
});

describe('Fase 6 · árvore do prodígio (C2, v0.85.0)', () => {
  const tree = data.talents.filter((t) => t.owner === 'prodigy');
  const foe = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...hero(), defId: 'gatoThug', protagonist: false, techniques: ['jeClub'], ai: 'brute', ...over });
  const duo = (me: Partial<FighterSeed>, them: Partial<FighterSeed> = {}) => {
    const b = startBattle({ allies: [hero(me)], enemies: [foe(them)], win: { kind: 'defeatAll' } }, data, fixed(0.5));
    return [b.fighters[0]!, b.fighters[1]!] as const;
  };

  it('seis ramos em anel, com bifurcação e talento final; seis combinações e três assinaturas; sem nomes de personagens', () => {
    expect(branchesOf('prodigy', data.talents)).toEqual(['gates', 'youth', 'drunken', 'training', 'rivalry', 'mentor']);
    for (const b of branchesOf('prodigy', data.talents)) {
      const nodes = tree.filter((t) => t.branch === b && !t.requiresAll);
      expect(nodes.filter((t) => t.capstone), b).toHaveLength(1);
      expect(nodes.filter((t) => t.excludes?.length), b).toHaveLength(2);
    }
    expect(tree.filter((t) => t.requiresAll)).toHaveLength(9);
    const names = tree.map((t) => `${ptBR.jornada.talents.list[t.id]!.name} ${ptBR.jornada.talents.list[t.id]!.desc}`).join(' ');
    for (const who of ['Gai', 'Lee', 'Kakashi', 'Neji']) expect(names).not.toContain(who);
  });

  it('Abertura rápida barateia o portão; com o 5º portão e a Lótus perfeita, a técnica não cobra HP', () => {
    const [me] = duo({ mods: mergeMods(emptyMods(), { gateOpenDiscount: 1, hpCostFreeAtGate: 5 }) });
    const [plain] = duo({});
    expect(gateOpenCost(me, 2, data)).toBe(2 * (data.j.gates.activationPerLevel - 1));
    expect(gateOpenCost(plain, 2, data)).toBe(2 * data.j.gates.activationPerLevel);
    const lotus = data.techniques.jHiddenLotus!;
    expect(hpCost({ ...me, gate: { level: 4, rounds: 0 } }, lotus)).toBeGreaterThan(0);
    expect(hpCost({ ...me, gate: { level: 5, rounds: 0 } }, lotus)).toBe(0);
  });

  it('Chama da juventude, Duelo e Desafio no dano; Bêbado de verdade dá golpes ao Punho Bêbado', () => {
    const strike = data.techniques.jStrike!;
    const [base, foeBig] = duo({}, { maxHp: 300, hp: 300 });
    const flame = { ...base, mods: mergeMods(base.mods, { critMultBonus: 0.5 }) };
    expect(hitDamage(flame, foeBig, strike, data, true)).toBeGreaterThan(hitDamage(base, foeBig, strike, data, true));
    const duel = { ...base, mods: mergeMods(base.mods, { duelDamageMult: 1.25, duelAccuracy: 0.1 }) };
    expect(hitDamage(duel, foeBig, strike, data)).toBeGreaterThan(hitDamage(base, foeBig, strike, data));
    expect(accuracyAgainst(duel, foeBig, strike, data)).toBeGreaterThan(accuracyAgainst(base, foeBig, strike, data));
    const challenge = { ...base, mods: mergeMods(base.mods, { healthyTargetMult: 1.15 }) };
    expect(hitDamage(challenge, { ...foeBig, hp: 100 }, strike, data)).toBe(hitDamage(base, { ...foeBig, hp: 100 }, strike, data));
    expect(hitsOf({ ...base, mods: mergeMods(base.mods, { techExtraHits: { jDrunkenFist: 2 } }) }, data.techniques.jDrunkenFist!)).toBe(5);
  });

  it('Lição do mestre: quando alguém da equipe cai, os de pé ganham dano por 3 turnos', () => {
    const b = startBattle(
      { allies: [hero({ mods: mergeMods(emptyMods(), { fallenRally: 0.2 }) }), { ...hero(), defId: 'sakura', protagonist: false, hp: 1, speed: 1, ai: 'striker' }], enemies: [foe({ speed: 99, offense: { taijutsu: 40, ninjutsu: 0, genjutsu: 0 } })], win: { kind: 'defeatAll' } },
      data,
      fixed(0.3),
    );
    if (b.fighters[1]!.down) expect(b.fighters[0]!.boost).toMatchObject({ damageMult: 1.2, techId: 'masterLesson' });
    else expect(b.fighters[0]!.rallied).toBeFalsy();
  });
});

describe('Fase 6 · árvore do Uchiha (C2, v0.86.0)', () => {
  const tree = data.talents.filter((t) => t.owner === 'uchihaNinja');
  const foe = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...hero(), defId: 'gatoThug', protagonist: false, techniques: ['jeClub'], ai: 'brute', ...over });
  const duo = (me: Partial<FighterSeed>, them: Partial<FighterSeed> = {}) => {
    const b = startBattle({ allies: [hero(me)], enemies: [foe(them)], win: { kind: 'defeatAll' } }, data, fixed(0.5));
    return [b.fighters[0]!, b.fighters[1]!] as const;
  };

  it('seis ramos em anel, sem o ramo do Sasuke; seis combinações e três assinaturas', () => {
    expect(branchesOf('uchihaNinja', data.talents)).toEqual(['sharingan', 'fire', 'illusions', 'weapons', 'pride', 'police']);
    for (const b of branchesOf('uchihaNinja', data.talents)) {
      const nodes = tree.filter((t) => t.branch === b && !t.requiresAll);
      expect(nodes.filter((t) => t.capstone), b).toHaveLength(1);
      expect(nodes.filter((t) => t.excludes?.length), b).toHaveLength(2);
    }
    expect(tree.filter((t) => t.requiresAll)).toHaveLength(9);
    for (const t of tree) expect(ptBR.jornada.talents.list[t.id], t.id).toBeTruthy();
  });

  it('Vingança no aperto; Inferno ilusório contra quem queima; Mundo da ilusão não erra em alvo controlado', () => {
    const strike = data.techniques.jStrike!;
    const [me, them] = duo({ mods: mergeMods(emptyMods(), { vengeanceMult: 1.4, burningDamageMult: 1.3, illusionSureHit: true }) });
    const [plain] = duo({});
    expect(hitDamage({ ...me, hp: 10 }, them, strike, data)).toBeGreaterThan(hitDamage({ ...plain, hp: 10 }, them, strike, data));
    expect(hitDamage(me, them, strike, data)).toBe(hitDamage(plain, them, strike, data));
    expect(hitDamage(me, { ...them, effects: [{ kind: 'burn', turns: 2 }] }, strike, data)).toBeGreaterThan(hitDamage(me, them, strike, data));
    const crow = data.techniques.jCrowIllusion!;
    expect(accuracyAgainst(me, { ...them, effects: [{ kind: 'stun', turns: 1 }] }, crow, data)).toBe(1);
    expect(accuracyAgainst(me, them, crow, data)).toBeLessThan(1);
  });

  it('Leitura total: com o Sharingan ligado, o golpe recebido pode ser anulado', () => {
    const mods = mergeMods(emptyMods(), { readNullChance: 1, readCounterDamage: 8 });
    const b = startBattle({ allies: [hero({ mods, speed: 1 })], enemies: [foe({ speed: 99 })], win: { kind: 'defeatAll' } }, data, fixed(0.3));
    // Sem o Sharingan ligado, a leitura não vale.
    expect(b.fighters[0]!.hp).toBeLessThan(b.fighters[0]!.maxHp);
  });
});

describe('Fase 6 · árvore do Hyuuga (C2 e C4, v0.87.0)', () => {
  const tree = data.talents.filter((t) => t.owner === 'hyuugaNinja');
  const foe = (over: Partial<FighterSeed> = {}): FighterSeed => ({ ...hero(), defId: 'gatoThug', protagonist: false, techniques: ['jeClub'], ai: 'brute', ...over });

  it('seis ramos, com as duas casas se excluindo pela raiz; sete combinações e três assinaturas', () => {
    expect(branchesOf('hyuugaNinja', data.talents)).toEqual(['byakugan', 'gentleFist', 'rotation', 'trigrams', 'mainHouse', 'branchHouse']);
    for (const b of branchesOf('hyuugaNinja', data.talents)) expect(tree.filter((t) => t.branch === b && t.capstone), b).toHaveLength(1);
    expect(tree.filter((t) => t.requiresAll)).toHaveLength(10);
    const run = { ...newGenericRun(3, 'normal', 'hyuuga', data, new Set(['j_unlockHyuuga'])), talentPoints: 10 };
    const main = buyTalent(run, 'tHMainHeritage', new Set(), data);
    expect(talentState(tree.find((t) => t.id === 'tHBranchDuty')!, data.talents, talentContext(main, new Set()))).toBe('excluded');
    const branch = buyTalent(run, 'tHBranchDuty', new Set(), data);
    expect(talentState(tree.find((t) => t.id === 'tHMainHeritage')!, data.talents, talentContext(branch, new Set()))).toBe('excluded');
  });

  it('Guardião: o golpe de alvo único contra o aliado cai em quem protege', () => {
    const b = startBattle(
      {
        allies: [hero({ speed: 1, mods: mergeMods(emptyMods(), { protectChance: 1 }) }), { ...hero(), defId: 'sakura', protagonist: false, speed: 1, ai: 'striker' }],
        enemies: [foe({ speed: 99 })],
        win: { kind: 'defeatAll' },
      },
      data,
      fixed(0.3),
    );
    const [guard, ally] = [b.fighters[0]!, b.fighters[1]!];
    // Quem quer que o inimigo mire, o golpe cai no Guardião.
    expect(ally.hp).toBe(ally.maxHp);
    if (b.log.some((e) => e.type === 'protect')) expect(guard.hp).toBeLessThan(guard.maxHp);
  });

  it('Visão de 360° ignora a esquiva; Defesa absoluta devolve o que o escudo segura', () => {
    const b = startBattle({ allies: [hero({ mods: mergeMods(emptyMods(), { ignoreEvasion: true }) })], enemies: [foe({ mods: mergeMods(emptyMods(), { evasion: 0.3 }) })], win: { kind: 'defeatAll' } }, data, fixed(0.5));
    const [me, them] = [b.fighters[0]!, b.fighters[1]!];
    const plain = { ...me, mods: emptyMods() };
    expect(accuracyAgainst(me, them, data.techniques.jStrike!, data)).toBeGreaterThan(accuracyAgainst(plain, them, data.techniques.jStrike!, data));
    const wall = startBattle(
      { allies: [hero({ speed: 1, mods: mergeMods(emptyMods(), { shieldReflectPct: 0.5, startShieldPct: 0.5 }) })], enemies: [foe({ speed: 99 })], win: { kind: 'defeatAll' } },
      data,
      fixed(0.3),
    );
    const hitsMe = wall.log.some((e) => e.type === 'damage' && e.target === wall.fighters[0]!.uid && e.absorbed > 0);
    if (hitsMe) expect(wall.fighters[1]!.hp).toBeLessThan(wall.fighters[1]!.maxHp);
  });
});

describe('Fase 6 · Caminho Ninja (C3)', () => {
  it('no 1º chefe, a evolução da relíquia inicial vem entre as opções', () => {
    for (const seed of [3, 7, 11]) {
      const run = playUntil(pathRun(seed, 'easy'), (r) => Boolean(r.bossChoice));
      expect(run.stageIndex).toBe(0);
      const evo = evolutionFor(data.relics, run.relics);
      expect(evo, `seed ${seed}`).toBeTruthy();
      expect(run.bossChoice, `seed ${seed}`).toContain(evo);
    }
  });
});

describe('Fase 3 · Roleta com os kits completos do clássico (R1)', () => {
  const org = (lineageId: string | null, elements: Origin['elements'] = [], extra: Partial<Origin> = {}): Origin => ({ lineageId, elements, jinchuuriki: false, ...extra });
  const rbattle = (o: Origin, level = 1, over: Partial<RBattle['player']> = {}): RBattle => {
    const p = { ...createRoletaPlayer(o, roletaData), level, ...over };
    return startRoletaBattle(p, scaleVillain(roletaVillainsById.mizuki!, 'normal', roletaData.base), { playerStartsFirst: true }, roletaData, fixed(0.5));
  };

  it('as exclusivas do despertar aparecem nos níveis 4 e 7', () => {
    const lee = (level: number) => playerTechniques({ ...createRoletaPlayer(org('taijutsuProdigy'), roletaData), level }, roletaData).map((t) => t.id);
    expect(lee(1)).toEqual(['rBasic', 'rLeafHurricane']);
    expect(lee(4)).toEqual(['rBasic', 'rLeafHurricane', 'rPrimaryLotus']);
    expect(lee(7)).toEqual(['rBasic', 'rLeafHurricane', 'rPrimaryLotus', 'rHiddenLotus']);
    expect(kitActives({ ...createRoletaPlayer(org('akimichi'), roletaData), level: 6 }, roletaData)).toEqual(['expansion']);
    expect(kitActives({ ...createRoletaPlayer(org('akimichi'), roletaData), level: 7 }, roletaData)).toEqual(['expansion', 'pills']);
  });

  it('usos por luta crescem com o despertar (Esforço 1/2/3, Portões 1/2, Selamento 1/2)', () => {
    expect([1, 4, 7].map((lv) => rbattle(org(null, ['fire']), lv).fx.uses.effort)).toEqual([1, 2, 3]);
    expect([1, 7].map((lv) => rbattle(org('taijutsuProdigy'), lv).fx.uses.gates)).toEqual([1, 2]);
    expect([1, 7].map((lv) => rbattle(org('uzumaki', ['wind']), lv).fx.uses.seal)).toEqual([1, 2]);
    // Sharingan e Byakugan: só o chakra limita.
    expect(rbattle(org('uchiha', ['fire'])).fx.uses.sharingan).toBeUndefined();
  });

  it('Lótus Primária só com um Portão aberto; Forçar abre o portão de cima', () => {
    let s = rbattle(org('taijutsuProdigy'), 4);
    const lotus = roletaData.techniques.rPrimaryLotus!;
    expect(techBlock(s, lotus, roletaData)).toBe('gate');
    expect(gateForceChance(s, roletaData)).toBeCloseTo(Math.max(0.2, 0.5 + 0.03 * (s.player.offense.taijutsu - 21)) + 0.1, 10);
    s = useActive(s, roletaData, fixed(0), 'gates', { force: true });
    expect(s.fx.gate?.stage).toBe(1);
    expect(techBlock(s, lotus, roletaData)).toBeNull();
    // Falhou: abre o liberado e fere mais 10% do HP máximo.
    const fail = useActive(rbattle(org('taijutsuProdigy'), 4), roletaData, fixed(0.99), 'gates', { force: true });
    expect(fail.fx.gate?.stage).toBe(0);
    expect(fail.player.hp).toBe(fail.player.maxHp - Math.floor(fail.player.maxHp * 0.1));
  });

  it('Sharingan: estágio pelo nível, manutenção a partir da rodada seguinte, e a Cópia pega a técnica do vilão', () => {
    expect(sharinganStage({ ...createRoletaPlayer(org('uchiha', ['fire']), roletaData), level: 7 }, roletaData).copyChance).toBe(0.8);
    let s = useActive(rbattle(org('uchiha', ['fire'])), roletaData, fixed(0.5), 'sharingan');
    s = playRoletaRound(s, 'guard', roletaData, fixed(0.99));
    expect(s.log.some((e) => e.type === 'upkeep')).toBe(false);
    s = playRoletaRound(s, 'guard', roletaData, fixed(0.99));
    expect(s.log.some((e) => e.type === 'upkeep' && e.kind === 'sharingan' && e.cost === 2)).toBe(true);
    // Cópia: precisa do Sharingan e de uma técnica de dano já usada pelo vilão.
    const v = s.villain.techniques.find((t) => t.baseDamage > 0 && t.type !== 'genjutsu')!;
    const ready = { ...s, activeUsed: false, villain: { ...s.villain, lastTech: v.id }, player: { ...s.player, chakra: 20 } };
    const copied = useActive(ready, roletaData, fixed(0), 'copy');
    expect(copied.fx.copied?.copyOf).toBe(v.id);
    expect(battleTechniques(copied, roletaData).some((t) => t.copyOf === v.id)).toBe(true);
    // A técnica copiada sai como ação.
    expect(() => playRoletaRound(copied, `tech:${copied.fx.copied!.id}`, roletaData, fixed(0.5))).not.toThrow();
  });

  it('Byakugan: taijutsu não erra e libera o Selo dos Pontos Vitais, que drena chakra', () => {
    let s = rbattle(org('hyuuga', ['wind']));
    const seal = roletaData.techniques.rVitalSeal!;
    expect(techBlock(s, seal, roletaData)).toBe('buff');
    s = useActive(s, roletaData, fixed(0.5), 'byakugan');
    expect(playerAttackOdds(s, seal, roletaData).auto).toBe(true);
    s = { ...s, villain: { ...s.villain, chakra: 9 } };
    const after = playRoletaRound(s, 'tech:rVitalSeal', roletaData, fixed(0.99));
    expect(after.log.some((e) => e.type === 'chakra' && e.side === 'villain' && e.value < 9)).toBe(true);
  });

  it('Corpo pesado pela razão de peso; a Expansão libera os degraus de cima', () => {
    const s = rbattle(org('akimichi', ['earth']));
    const ratio = s.player.maxHp / s.villain.maxHp;
    const step = ratio >= 2 ? 1.3 : ratio >= 1.5 ? 1.2 : ratio >= 1.25 ? 1.1 : ratio >= 1 ? 1.05 : 1;
    expect(heavyBodyMult(s, roletaData)).toBe(step);
    expect(heavyBodyMult(useActive(s, roletaData, fixed(0.5), 'expansion'), roletaData)).toBeGreaterThan(step);
  });

  it('Pílulas do clã (nível 7): a vermelha deixa exausto quando acaba', () => {
    let s = useActive(rbattle(org('akimichi', ['earth']), 7), roletaData, fixed(0.99), 'pills');
    expect(s.fx.buffs.find((b) => b.kind === 'pill')?.pill).toBe('red');
    expect(s.player.hp).toBe(s.player.maxHp - Math.floor(s.player.maxHp * 0.3));
    for (let i = 0; i < 3; i++) s = playRoletaRound(s, 'guard', roletaData, fixed(0.99));
    expect(s.fx.buffs.map((b) => b.kind)).toEqual(['exhausted']);
  });

  it('Correntes de Chakra atordoam e drenam; a Rotação ergue a barreira que devolve metade', () => {
    const b = rbattle(org('uzumaki', ['wind']), 4);
    const chained = playRoletaRound({ ...b, villain: { ...b.villain, chakra: 9 } }, 'tech:rChakraChains', roletaData, fixed(0.5));
    expect(chained.log.some((e) => e.type === 'effect' && e.side === 'villain' && e.kind === 'stun')).toBe(true);
    const vck = chained.log.filter((e): e is Extract<typeof e, { type: 'chakra' }> => e.type === 'chakra' && e.side === 'villain').map((e) => e.value);
    expect(vck.at(-2)! - vck.at(-1)!).toBe(4);
    const hy = playRoletaRound(rbattle(org('hyuuga', ['wind']), 4), 'tech:rRotation', roletaData, fixed(0.99));
    expect(hy.fx.barrier?.reflectPct).toBe(0.5);
  });

  it('Senju: curas rendem +25%', () => {
    expect(rbattle(org('senju', ['fire'])).fx.healMult).toBe(1.25);
    expect(rbattle(org(null, ['fire'])).fx.healMult).toBe(1);
  });

  it('Fase 4 · chefe com 15% menos HP e 10% mais ataque (R2); bolsa com Kit médico e Pílula (R4)', () => {
    const p = createRoletaPlayer(org(null, ['fire']), roletaData);
    expect([p.bag.medKit, p.bag.soldierPill]).toEqual([1, 1]);
    const run = { ...newRoletaRun(p, 'normal'), step: 5, villainId: 'orochimaru' };
    const base = scaleVillain(roletaVillainsById.orochimaru!, 'normal', roletaData.base);
    const boss = villainFor(run, roletaVillainsById, roletaData);
    expect(boss.hp).toBe(Math.floor(base.hp * 0.9 * 0.85));
    expect(boss.offense.ninjutsu).toBe(Math.floor(base.offense.ninjutsu * 0.9 * 1.1));
  });

  it('Yamanaka, Aburame e Nara seguem fora do sorteio do Roleta', () => {
    for (const id of ['nara', 'yamanaka', 'aburame']) expect(roletaData.base.lineages.some((l) => l.id === id)).toBe(false);
  });
});
