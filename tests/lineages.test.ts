import { describe, expect, it } from 'vitest';
import {
  activeUses,
  attackPreview,
  availableActions,
  canCopyIncoming,
  copyTechniqueId,
  effectiveOffense,
  forceGatesChance,
  gatesUses,
  playRound,
  previewExtras,
  resumeRound,
  startBattle,
  type BattleEvent,
  type BattleState,
} from '../src/core/combat';
import { createPlayer, type PlayerState } from '../src/core/player';
import { applyClanLesson } from '../src/core/progression';
import type { Origin, VillainTechnique } from '../src/core/types';
import { gameData } from '../src/data/index';
import { battle, seq, testVillain, withInitiative } from './helpers';

const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);
const ofRound = (prev: BattleState, next: BattleState) => next.log.slice(prev.log.length);
const clan = (id: string | null, affinity: Origin['affinity'] = 'earth'): Origin => ({ lineageId: id, affinity, jinchuuriki: false });
const at = (p: PlayerState, level: number): PlayerState => ({ ...p, level });
const withDojutsu = (s: BattleState): BattleState => ({ ...s, playerFx: { ...s.playerFx, dojutsuActive: true, dojutsuTurns: 5 } });
const shuriken: VillainTechnique = { id: 'giantShuriken', type: 'taijutsu', baseDamage: 11, chakraCost: 0, weight: 1 };
const punch: VillainTechnique = { id: 'punch', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 1 };
const kick: VillainTechnique = { id: 'kick', type: 'taijutsu', baseDamage: 6, chakraCost: 0, weight: 1 };

describe('Cópia (Uchiha)', () => {
  const copyId = copyTechniqueId('mizuki', 'giantShuriken');

  it('no turno: com o Sharingan, copia a última técnica de dano do vilão e ela vira uma ação', () => {
    const p = createPlayer(clan('uchiha', 'fire'), gameData);
    const s0 = withDojutsu(withInitiative(startBattle(p, testVillain({ id: 'mizuki', hp: 200, techniques: [shuriken] }))));
    // Sem técnica vista ainda: nada para copiar.
    expect(() => playRound(s0, 'stance', seq(0.0), gameData, { copy: true })).toThrow();
    const seen = { ...s0, villain: { ...s0.villain, lastTechnique: 'giantShuriken' } };
    const s1 = playRound(seen, 'stance', seq(0.0, 0.5), gameData, { copy: true });
    expect(ofType(s1.log, 'copy')).toEqual([{ type: 'copy', chance: 0.5, success: true, techniqueId: copyId }]);
    expect(s1.playerFx.copied).toBe(copyId);
    // 3 da Cópia e 1 da manutenção do Sharingan.
    expect(s1.player.chakra).toBe(seen.player.chakra - 3 - 1);
    expect(availableActions(s1, gameData)).toContain(`tech:${copyId}`);
    // Usa com os próprios status: 11 + (12 + 3 do Sharingan) − 7 = 19.
    const s2 = playRound(s1, `tech:${copyId}`, seq(0.5), gameData);
    expect(ofType(ofRound(s1, s2), 'attack').find((a) => a.side === 'player')).toMatchObject({ techniqueId: copyId, damage: 19 });
  });

  it('na reação: copia a técnica que está vindo sem gastar a reação; a chance sobe com os tomoe', () => {
    const p = createPlayer(clan('uchiha', 'fire'), gameData);
    const s0 = withDojutsu(startBattle(p, testVillain({ id: 'mizuki', techniques: [shuriken] }), { interactive: true, villainStartsFirst: true }));
    const s1 = playRound(s0, 'stance', seq(0.5), gameData);
    expect(s1.pending).not.toBeNull();
    expect(canCopyIncoming(s1, gameData)).toBe(true);
    const s2 = resumeRound(s1, 'resist', seq(0.0, 0.5), gameData, undefined, { copy: true });
    expect(s2.playerFx.copied).toBe(copyId);
    expect(ofType(s2.log, 'reaction').find((r) => r.side === 'player')).toMatchObject({ kind: 'resist' });
    // Falhou: nada copiado.
    const s3 = resumeRound(s1, 'resist', seq(0.99, 0.5), gameData, undefined, { copy: true });
    expect(s3.playerFx.copied).toBeNull();
    const lv7 = withDojutsu(startBattle(at(p, 7), testVillain({ id: 'mizuki' })));
    expect(ofType(playRound({ ...lv7, villain: { ...lv7.villain, lastTechnique: 'giantShuriken' } }, 'stance', seq(0.0, 0.5), gameData, { copy: true }).log, 'copy')[0]).toMatchObject({
      chance: 0.8,
    });
  });
});

describe('Uzumaki: Selamento e Correntes de Chakra', () => {
  it('Selamento: a próxima técnica sai da roleta do vilão por 2 rodadas', () => {
    const p = createPlayer(clan('uzumaki'), gameData);
    expect(p.active).toBe('seal');
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200, techniques: [punch, kick] })));
    const s = { ...s0, villain: { ...s0.villain, intent: { kind: 'technique' as const, id: 'punch' } } };
    const s1 = playRound(s, 'stance', seq(0.0), gameData, { seal: true });
    expect(ofType(s1.log, 'seal')).toEqual([{ type: 'seal', techniqueId: 'punch', turns: 2, charged: false }]);
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ techniqueId: 'kick' });
    expect(s1.villain.sealed).toEqual({ techniqueId: 'punch', turns: 1 });
    const t = playRound(s1, 'stance', seq(0.0), gameData);
    expect(t.villain.sealed).toBeNull();
    expect(ofType(t.log, 'sealEnd')).toHaveLength(1);
    expect(activeUses(p, 'seal', gameData)).toBe(1);
    expect(activeUses(at(p, 7), 'seal', gameData)).toBe(2);
  });

  it('Selamento no golpe carregado: o golpe se perde', () => {
    const s0 = withInitiative(startBattle(createPlayer(clan('uzumaki'), gameData), testVillain({ techniques: [punch, kick], behavior: { charged: 'punch' } })));
    const charging = { ...s0, villain: { ...s0.villain, charging: 'punch', intent: { kind: 'technique' as const, id: 'punch' } } };
    const s1 = playRound(charging, 'stance', seq(0.0), gameData, { seal: true });
    expect(ofType(s1.log, 'seal')[0]).toMatchObject({ charged: true });
    expect(ofType(s1.log, 'chargeRelease')).toHaveLength(0);
  });

  it('Correntes de Chakra (nível 4): prendem com força 2 e o vilão preso perde 3 de chakra por vez', () => {
    const base = createPlayer(clan('uzumaki'), gameData);
    const p = { ...at(base, 4), techniques: [...base.techniques, 'chakraChains'] };
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:chakraChains', seq(0.5, 0.99), gameData);
    expect(s1.villain.fx.debilitated).toMatchObject({ source: 'chakraChains' });
    expect(ofType(s1.log, 'chakraDrain')).toEqual([{ type: 'chakraDrain', amount: 3, source: 'chains' }]);
    expect(s1.villain.chakra).toBe(17);
  });
});

describe('Nara: Sombra costurada', () => {
  it('mantida, a fuga não gira; o custo sobe a cada vez; no nível 7 a sombra estrangula', () => {
    const p = createPlayer(clan('nara'), gameData);
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    const held = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, debilitated: { strength: 1, served: 0, source: 'shadowImitation' } } } };
    // 0.0 libertaria o vilão, mas a sombra mantida não deixa a fuga girar.
    const s1 = playRound(held, 'stance', seq(0.0), gameData, { shadowHold: true });
    expect(ofType(s1.log, 'mentalBroken')).toHaveLength(0);
    expect(s1.villain.fx.debilitated).toMatchObject({ served: 1, maintained: 1, pinned: false });
    expect(s1.player.chakra).toBe(held.player.chakra - 3);
    const s2 = playRound(s1, 'stance', seq(0.0), gameData, { shadowHold: true });
    expect(ofType(ofRound(s1, s2), 'shadowHold')).toEqual([{ type: 'shadowHold', chakra: 4 }]);
    // Nível 7: 5% de 200 = 10 por vez mantida.
    const s7 = withInitiative(startBattle(at(p, 7), testVillain({ hp: 200 })));
    const h7 = { ...s7, villain: { ...s7.villain, fx: { ...s7.villain.fx, debilitated: { strength: 1, served: 0, source: 'shadowImitation' } } } };
    const r7 = playRound(h7, 'stance', seq(0.0), gameData, { shadowHold: true });
    expect(ofType(r7.log, 'strangle')).toEqual([{ type: 'strangle', damage: 10 }]);
    expect(r7.villain.hp).toBe(190);
  });
});

describe('Akimichi: Pílulas do clã', () => {
  it('roleta pura: verde ×1,3; vermelha ×2 e deixa exausto quando acaba', () => {
    const p = createPlayer(clan('akimichi'), gameData);
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 300, techniques: [{ ...punch, baseDamage: 0 }] })));
    const plain = ofType(playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData).log, 'attack')[0]!.damage;
    const green = playRound(s0, 'tech:basicTaijutsu', seq(0.0, 0.5), gameData, { pills: true });
    expect(ofType(green.log, 'pill')).toEqual([{ type: 'pill', pill: 'green', hpLost: Math.floor(p.maxHp * 0.1) }]);
    // (8 + 15 − 7) = 16 (vilão de 300 de HP: mais leve que ele, sem Corpo pesado); com a verde, × 1,3 = 20.
    expect(plain).toBe(16);
    expect(ofType(green.log, 'attack')[0]!.damage).toBe(20);
    expect(() => playRound(green, 'stance', seq(0.5), gameData, { pills: true })).toThrow();
    let red = playRound(s0, 'stance', seq(0.99), gameData, { pills: true });
    expect(red.playerFx.pill).toBe('red');
    for (let i = 0; i < 2; i++) red = playRound(red, 'stance', seq(0.5), gameData);
    expect(red.playerFx.exhaustedTurns).toBe(2);
    expect(ofType(red.log, 'pillEnd')[0]).toMatchObject({ pill: 'red', exhausted: true });
  });
});

describe('Prodígio: forçar os portões', () => {
  it('a roleta de risco abre um portão além do liberado; falhando, abre o liberado e fere', () => {
    const p = createPlayer(clan('taijutsuProdigy', null), gameData);
    // 50% + 3% × (17 − 21) = 38%
    expect(forceGatesChance(p, gameData)).toBeCloseTo(0.38);
    expect(forceGatesChance(at(p, 4), gameData)).toBeCloseTo(0.48);
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 300 })));
    const ok = playRound(s0, 'stance', seq(0.0), gameData, { gates: true, forceGates: true });
    expect(ofType(ok.log, 'gatesForce')[0]).toMatchObject({ success: true, hpLost: 0 });
    expect(ok.playerFx.gatesStage).toBe(2);
    const fail = playRound(s0, 'stance', seq(0.99), gameData, { gates: true, forceGates: true });
    expect(ofType(fail.log, 'gatesForce')[0]).toMatchObject({ success: false, hpLost: Math.floor(p.maxHp * 0.1) });
    expect(fail.playerFx.gatesStage).toBe(1);
    expect(gatesUses(p, gameData)).toBe(1);
    expect(gatesUses(at(p, 7), gameData)).toBe(2);
  });
});

describe('Hyuuga: Byakugan e 64 Palmas', () => {
  it('o Byakugan ignora a névoa e tira 20 do acerto do genjutsu do vilão; dura 7 rodadas no nível 4', () => {
    const p = createPlayer(clan('hyuuga', 'water'), gameData);
    const mist = withInitiative(startBattle(p, testVillain({ hp: 500, passive: { kind: 'mist', turns: 4, evasionMult: 1.5 } })));
    const misty = { ...mist, villain: { ...mist.villain, mistTurns: 4 } };
    const ninjutsu = p.techniques.find((t) => gameData.techniquesById[t]!.type === 'ninjutsu' && gameData.techniquesById[t]!.baseDamage > 0)!;
    const clear = attackPreview(mist, ninjutsu, gameData).hitChance;
    expect(attackPreview(misty, ninjutsu, gameData).hitChance).toBeLessThan(clear);
    expect(attackPreview(withDojutsu(misty), ninjutsu, gameData).hitChance).toBeCloseTo(clear);
    const v = testVillain({ offense: { taijutsu: 0, ninjutsu: 0, genjutsu: 20 }, techniques: [{ id: 'illusion', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1 }] });
    const g0 = startBattle(p, v, { villainStartsFirst: true });
    const hit = (s: BattleState) => ofType(playRound(s, 'stance', seq(0.99), gameData).log, 'attack')[0]!.hitChance;
    expect(hit(withDojutsu(g0))).toBeCloseTo(hit(g0) - 0.2);
    const s4 = playRound(withInitiative(startBattle(at(p, 4), testVillain())), 'stance', seq(0.5), gameData, { dojutsu: true });
    // Conta a partir da rodada seguinte à ativação.
    expect(s4.playerFx.dojutsuTurns).toBe(7);
  });

  it('64 Palmas (nível 7): 4 golpes com o Byakugan, cada acerto drena 3 de chakra', () => {
    const base = createPlayer(clan('hyuuga', 'water'), gameData);
    const p = { ...at(base, 7), techniques: [...base.techniques, 'sixtyFourPalms'] };
    const s0 = withDojutsu(withInitiative(startBattle(p, testVillain({ hp: 500 }))));
    const s1 = playRound(s0, 'tech:sixtyFourPalms', seq(0.5), gameData);
    expect(ofType(s1.log, 'attack').filter((a) => a.side === 'player')).toHaveLength(4);
    expect(s1.villain.chakra).toBe(20 - 12);
  });
});

describe('despertar e Lição do clã', () => {
  it('comum: Nunca desistir (nível 4) e Esforço supremo (nível 7)', () => {
    const p = { ...at(createPlayer(clan(null, 'fire'), gameData), 4), hp: 26 };
    const s0 = withInitiative(battle(p, testVillain()), 'villain');
    // (10 − 7) = 3: 26 → 23, abaixo de 25%: recupera 15.
    const s1 = playRound(s0, 'stance', seq(0.5), gameData);
    expect(ofType(s1.log, 'comeback')).toEqual([{ type: 'comeback', healed: 15 }]);
    expect(s1.playerFx.comebackUsed).toBe(true);
    const lv7 = withInitiative(startBattle(at(createPlayer(clan(null, 'fire'), gameData), 7), testVillain({ hp: 200 })));
    const e = playRound(lv7, 'stance', seq(0.5), gameData, { effort: true });
    expect(effectiveOffense(e, 'genjutsu', gameData)).toBe(lv7.player.offense.genjutsu + 5);
    expect(e.playerFx.effortTurns).toBe(3);
  });

  it('Inuzuka (nível 4): o cão bate com 60% do dano', () => {
    const s0 = withInitiative(startBattle(at(createPlayer(clan('inuzuka'), gameData), 4), testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.0, 0.5), gameData);
    // cão: floor(8 × 0,6) + 14 − 7 = 11
    expect(ofType(s1.log, 'attack').find((a) => a.techniqueId === 'dogAttack')).toMatchObject({ damage: 11 });
  });

  it('Lição do clã: XP e o bônus permanente da linhagem', () => {
    const aki = createPlayer(clan('akimichi'), gameData);
    const step = applyClanLesson(aki, gameData);
    expect(step.player.maxHp).toBe(aki.maxHp + 15);
    expect(step.player.xp).toBe(40);
    expect(step.effect).toMatchObject({ kind: 'clanLesson', lineageId: 'akimichi', xp: 40 });
    const common = createPlayer(clan(null, 'fire'), gameData);
    const c = applyClanLesson(common, gameData);
    expect(c.player.offense.taijutsu + c.player.offense.ninjutsu + c.player.offense.genjutsu).toBe(
      common.offense.taijutsu + common.offense.ninjutsu + common.offense.genjutsu + 2,
    );
    expect(c.player.xp).toBe(50); // +25% da Determinação
  });
});

describe('Correções da v0.22.1', () => {
  it('Tsukuyomi e Cópia valem na mesma rodada em que o Sharingan acende', () => {
    const p = { ...at(createPlayer(clan('uchiha', 'fire'), gameData), 7) };
    const withTsukuyomi = { ...p, techniques: [...p.techniques, 'tsukuyomi'] };
    const s0 = withInitiative(startBattle(withTsukuyomi, testVillain({ id: 'mizuki', hp: 200, techniques: [shuriken] })));
    expect(availableActions(s0, gameData)).not.toContain('tech:tsukuyomi');
    expect(availableActions(previewExtras(s0, { dojutsu: true }, gameData), gameData)).toContain('tech:tsukuyomi');
    expect(() => playRound(s0, 'tech:tsukuyomi', seq(0.5), gameData, { dojutsu: true })).not.toThrow();
    // Cópia junto com a ativação do Sharingan.
    const seen = { ...s0, villain: { ...s0.villain, lastTechnique: 'giantShuriken' } };
    const s1 = playRound(seen, 'stance', seq(0.0, 0.5), gameData, { dojutsu: true, copy: true });
    expect(s1.playerFx.copied).toBe(copyTechniqueId('mizuki', 'giantShuriken'));
  });

  it('a prévia das ativas mostra o dano com o bônus já aplicado', () => {
    const p = createPlayer(clan('akimichi'), gameData);
    const s0 = withInitiative(startBattle(p, testVillain()));
    const before = attackPreview(s0, 'basicTaijutsu', gameData).damage;
    const after = attackPreview(previewExtras(s0, { expansion: true }, gameData), 'basicTaijutsu', gameData).damage;
    expect(after).toBeGreaterThan(before);
  });

  it('reação no turno do vilão não gasta o chakra reservado para a ação; o chakra nunca fica negativo', () => {
    const p = createPlayer(clan('aburame'), gameData);
    const start = (chakra: number) =>
      startBattle({ ...p, chakra }, testVillain({ techniques: [punch] }), { interactive: true, villainStartsFirst: true });
    // Enxame custa 3 e a Substituição 2: com 4 não dá para os dois.
    expect(playRound(start(4), 'tech:insectSwarm', seq(0.5), gameData).pending?.options ?? []).not.toContain('substitution');
    expect(playRound(start(5), 'tech:insectSwarm', seq(0.5), gameData).pending?.options).toContain('substitution');
    // Taijutsu básico (custo 0) sempre disponível, mesmo sem chakra.
    const empty = withInitiative(startBattle({ ...p, chakra: 0 }, testVillain()));
    expect(availableActions(empty, gameData)).toContain('tech:basicTaijutsu');
  });

  it('Fera de quatro patas: 1 uso por luta (2 no nível 7), então a isca não é infinita', () => {
    const p = createPlayer(clan('inuzuka'), gameData);
    expect(activeUses(p, 'beast', gameData)).toBe(1);
    expect(activeUses(at(p, 7), 'beast', gameData)).toBe(2);
    let s = playRound(withInitiative(startBattle(p, testVillain({ hp: 500 }))), 'stance', seq(0.5), gameData, { beast: true });
    while (s.playerFx.beastTurns > 0) s = playRound(s, 'stance', seq(0.5), gameData);
    expect(() => playRound(s, 'stance', seq(0.5), gameData, { beast: true })).toThrow();
  });
});
