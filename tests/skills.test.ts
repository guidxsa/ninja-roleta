import { describe, expect, it } from 'vitest';
import {
  availableActions,
  effectiveOffense,
  effectiveSpeed,
  playerGenjutsuHitChance,
  playRound,
  sharinganStage,
  startBattle,
  villainDefense,
  type BattleEvent,
  type BattleState,
} from '../src/core/combat';
import { applyLevelUp, createPlayer, gainXp, learnTechnique, type PlayerState } from '../src/core/player';
import { learnableTechniques, levelUp } from '../src/core/progression';
import type { Origin, VillainPassive } from '../src/core/types';
import { gameData } from '../src/data/index';
import { levelTechniques, lineageTechniques, techniquesById } from '../src/data/techniques';
import { villainsById } from '../src/data/villains';
import { battle, seq, testVillain, withInitiative } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
const uchiha: Origin = { lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false };
const hyuuga: Origin = { lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false };
const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };
const clan = (id: string, affinity: Origin['affinity'] = 'earth'): Origin => ({ lineageId: id, affinity, jinchuuriki: false });

const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);
const ofRound = (prev: BattleState, next: BattleState) => next.log.slice(prev.log.length);

/** Sobe o jogador até `level`. */
function toLevel(p: PlayerState, level: number): PlayerState {
  while (p.level < level) p = applyLevelUp(gainXp(p, 10_000, gameData), gameData);
  return p;
}

const active = (s: BattleState): BattleState => ({
  ...s,
  playerFx: { ...s.playerFx, dojutsuActive: true, dojutsuTurns: gameData.balance.dojutsu.duration },
});

describe('skill set por categoria e técnicas de nível', () => {
  it('técnicas de nível com dano batem mais e custam mais que a básica da categoria', () => {
    for (const t of levelTechniques.filter((t) => t.baseDamage > 0)) {
      const basic =
        t.type === 'taijutsu' ? techniquesById.basicTaijutsu! : Object.values(techniquesById).find((b) => b.elementalBasic && b.element === t.element)!;
      expect(t.baseDamage * (t.hits ?? 1)).toBeGreaterThan(basic.baseDamage * (basic.hits ?? 1));
      expect(t.chakraCost).toBeGreaterThan(basic.chakraCost);
    }
  });

  it('ao chegar no nível 4 o comum aprende o ninjutsu do próprio elemento, sem genjutsu nem combo de taijutsu', () => {
    const lv3 = toLevel(createPlayer(common, gameData), 3);
    const step = levelUp(gainXp(lv3, 10_000, gameData), gameData);
    expect(step.effect).toMatchObject({ kind: 'levelUp', level: 4, learned: ['phoenixFlower'] });
    expect(step.player.techniques).not.toContain('galeBlast');
    expect(step.player.techniques).not.toContain('fearIllusion');
    // As técnicas somam ao skill set: as básicas continuam disponíveis.
    const actions = availableActions(startBattle(step.player, testVillain()), gameData);
    expect(actions).toEqual(expect.arrayContaining(['tech:basicTaijutsu', 'tech:fireSpark', 'tech:phoenixFlower']));
  });

  it('no nível 7 vêm as mais fortes; os combos de taijutsu são do prodígio, Rotação do Hyuuga e Rolo Colossal do Akimichi', () => {
    expect(toLevel(createPlayer(common, gameData), 7).techniques).toEqual(['basicTaijutsu', 'fireSpark', 'phoenixFlower', 'greatBlaze']);
    expect(toLevel(createPlayer(prodigy, gameData), 7).techniques).toEqual(['basicTaijutsu', 'whirlwindCombo', 'hiddenLotus']);
    const hyuuga7 = toLevel(createPlayer(hyuuga, gameData), 7).techniques;
    expect(hyuuga7).toContain('rotation');
    expect(hyuuga7).not.toContain('whirlwindCombo');
    expect(toLevel(createPlayer(clan('akimichi'), gameData), 4).techniques).toContain('humanBoulder');
    expect(() => learnTechnique(createPlayer(hyuuga, gameData), 'hiddenLotus', gameData)).toThrow();
  });

  it('Uchiha recebe genjutsu de nível; quem aprende um genjutsu libera a categoria', () => {
    expect(toLevel(createPlayer(uchiha, gameData), 4).techniques).toContain('fearIllusion');
    const lv4 = toLevel(createPlayer(common, gameData), 4);
    expect(lv4.techniques).not.toContain('fearIllusion');
    expect(learnTechnique(lv4, 'crowIllusion', gameData).techniques).toEqual(expect.arrayContaining(['crowIllusion', 'fearIllusion']));
  });

  it('técnicas de nível e de linhagem não saem na recompensa "nova técnica"', () => {
    const special = [...levelTechniques, ...lineageTechniques].map((t) => t.id);
    for (const o of [common, uchiha, hyuuga, prodigy, clan('nara')]) {
      const pool = learnableTechniques(toLevel(createPlayer(o, gameData), 9), gameData);
      expect(pool.filter((id) => special.includes(id))).toEqual([]);
    }
  });

  it('Impacto Concentrado: ninguém nasce com ele; sai na recompensa e serve a todas as origens', () => {
    for (const o of [common, uchiha, hyuuga, prodigy]) {
      const p = createPlayer(o, gameData);
      expect(p.techniques).not.toContain('empoweredTaijutsu');
      expect(learnableTechniques(p, gameData)).toContain('empoweredTaijutsu');
    }
  });

  it('Impacto Concentrado gasta chakra e bate mais forte que o Punho de Chakra', () => {
    const p = learnTechnique(createPlayer(common, gameData), 'empoweredTaijutsu', gameData);
    const s1 = playRound(startBattle(p, testVillain({ hp: 200 }), { playerStartsFirst: true }), 'tech:empoweredTaijutsu', seq(0.5), gameData);
    // 14 + 10 − 5 = 19, contra 13 do básico
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ techniqueId: 'empoweredTaijutsu', damage: 19 });
    expect(s1.player.chakra).toBe(27);
  });
});

describe('ficha de técnica', () => {
  it('golpes: cada um rola acerto (Enxame do Aburame, 4 golpes; a Colmeia drena 2 por acerto)', () => {
    const p = createPlayer(clan('aburame'), gameData);
    const s1 = playRound(withInitiative(startBattle(p, testVillain())), 'tech:insectSwarm', seq(0.5, 0.01, 0.5, 0.5, 0.5), gameData);
    const hits = ofType(s1.log, 'attack').filter((a) => a.side === 'player');
    expect(hits.map((a) => a.outcome)).toEqual(['hit', 'miss', 'hit', 'hit']);
    // 5 + 12 − 5 = 12 por golpe
    expect(hits.map((a) => a.damage)).toEqual([12, 0, 12, 12]);
    expect(ofType(s1.log, 'chakraDrain')).toHaveLength(3);
    expect(s1.villain.chakra).toBe(20 - 6);
  });

  it('precisão: cada técnica tem a sua (Faísca 80%, Punho de Rocha 95%)', () => {
    const hit = (affinity: Origin['affinity'], id: string) =>
      ofType(playRound(withInitiative(startBattle(createPlayer({ lineageId: null, affinity, jinchuuriki: false }, gameData), testVillain({ hp: 200 }))), `tech:${id}`, seq(0.5), gameData).log, 'attack')[0]!.hitChance;
    expect(hit('lightning', 'spark')).toBeCloseTo(0.8);
    expect(hit('earth', 'rockFist')).toBeCloseTo(0.95);
  });

  it('penetração: a técnica e o sapo ignoram parte da defesa, até 60%', () => {
    const p = createPlayer({ lineageId: null, affinity: 'lightning', jinchuuriki: false }, gameData);
    const v = testVillain({ hp: 200, element: 'water', defense: { taijutsu: 10, ninjutsu: 10, genjutsu: 5 } });
    const dmg = (pl: PlayerState) => ofType(playRound(withInitiative(startBattle(pl, v)), 'tech:spark', seq(0.5), gameData).log, 'attack')[0]!.damage;
    // Faísca: 13 + 10 − 10 × 0.9 = 14
    expect(dmg(p)).toBe(14);
    // Com o sapo (25%): 13 + 10 − 10 × 0.65 = 16
    expect(dmg({ ...p, summon: { animal: 'toad', level: 1 } })).toBe(16);
    // Sapo nível 9 passaria de 60%: fica no teto, 13 + 10 − 4 = 19
    expect(dmg({ ...p, summon: { animal: 'toad', level: 9 } })).toBe(19);
  });

  it('efeito no acerto: Muralha Esmagadora tem 15% de atordoar', () => {
    const p = toLevel(createPlayer({ lineageId: null, affinity: 'earth', jinchuuriki: false }, gameData), 4);
    const s1 = playRound(withInitiative(startBattle(p, testVillain({ hp: 200 }))), 'tech:earthSpear', seq(0.5, 0.0, 0.5), gameData);
    expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'villain', kind: 'stun', turns: 2 }]);
    const s2 = playRound(withInitiative(startBattle(p, testVillain({ hp: 200 }))), 'tech:earthSpear', seq(0.5, 0.99, 0.5), gameData);
    expect(ofType(s2.log, 'status')).toHaveLength(0);
  });

  it('prioridade: Torrente Serpente age antes mesmo sem a iniciativa', () => {
    const p = toLevel(createPlayer({ lineageId: null, affinity: 'water', jinchuuriki: false }, gameData), 4);
    const s1 = playRound(withInitiative(startBattle(p, testVillain({ hp: 200 })), 'villain'), 'tech:waterShark', seq(0.5), gameData);
    expect(ofType(s1.log, 'priority')).toHaveLength(1);
    expect(ofType(s1.log, 'attack')[0]!.side).toBe('player');
  });

  it('piso de resistência: 2 para todos; o Corpo de ferro (prodígio) tem 4 em ninjutsu e genjutsu', () => {
    const nin = testVillain({ techniques: [{ id: 'blast', type: 'ninjutsu', baseDamage: 10, chakraCost: 0, weight: 1 }], element: 'fire' });
    const taken = (p: PlayerState) =>
      ofType(playRound(withInitiative(startBattle(p, nin), 'villain'), 'rest', seq(0.5), gameData).log, 'attack')[0]!.damage;
    // prodígio: max(4, 0/2) + 1 = 5 → 10 − 5 = 5
    expect(taken(createPlayer(prodigy, gameData))).toBe(5);
    // comum com ninjutsu zerado: max(2, 0) + 1 = 3 → 7
    const zero = createPlayer({ lineageId: null, affinity: 'earth', jinchuuriki: false }, gameData);
    expect(taken({ ...zero, offense: { ...zero.offense, ninjutsu: 0 } })).toBe(7);
  });
});

describe('ações universais e itens', () => {
  it('Concentrar chakra recupera 4', () => {
    const s1 = playRound(withInitiative(battle({ ...createPlayer(common, gameData), chakra: 0 }, testVillain())), 'rest', seq(0.5), gameData);
    expect(s1.player.chakra).toBe(4);
  });

  it('Substituição: gasta 2 de chakra e tem 50% de esquivar do próximo ataque', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain()));
    const dodged = playRound(s0, 'substitution', seq(0.5, 0.1), gameData);
    expect(ofType(dodged.log, 'dodge')).toEqual([{ type: 'dodge', source: 'substitution' }]);
    expect(dodged.player.hp).toBe(100);
    expect(dodged.player.chakra).toBe(28);
    const failed = playRound(s0, 'substitution', seq(0.5, 0.9, 0.5), gameData);
    expect(ofType(failed.log, 'dodgeFail')).toHaveLength(1);
    expect(failed.player.hp).toBe(96);
  });

  it('a esquiva dura até o fim da próxima rodada se nenhum ataque vier', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain()));
    const stunned = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, debilitated: 2 } } };
    const s1 = playRound(stunned, 'substitution', seq(0.5), gameData);
    expect(s1.playerFx.dodge).not.toBeNull();
    const s2 = playRound(s1, 'rest', seq(0.5), gameData);
    expect(s2.playerFx.dodge).toBeNull();
  });

  it('Usar item: Bomba de fumaça, Selo explosivo, Pílula de soldado e Kit médico', () => {
    const bag = { soldierPill: 1, medKit: 1, explosiveTag: 1, smokeBomb: 1 };
    const p = { ...createPlayer(common, gameData), bag, chakra: 0 };
    const s0 = withInitiative(battle(p, testVillain()));
    const smoke = playRound(s0, 'item:smokeBomb', seq(0.5, 0.99), gameData);
    expect(ofType(smoke.log, 'dodge')).toEqual([{ type: 'dodge', source: 'smokeBomb' }]);
    expect(smoke.player.bag.smokeBomb).toBe(0);
    const tag = playRound(s0, 'item:explosiveTag', seq(0.5), gameData);
    expect(tag.villain.hp).toBe(35);
    const pill = playRound(s0, 'item:soldierPill', seq(0.5), gameData);
    expect(pill.player.chakra).toBe(15);
    const sick = { ...s0, playerFx: { ...s0.playerFx, poison: { bonus: 1, ticks: 2 }, bleeding: true } };
    const kit = playRound(sick, 'item:medKit', seq(0.5), gameData);
    expect(kit.playerFx).toMatchObject({ poison: null, bleeding: false });
    expect(availableActions(kit, gameData)).not.toContain('item:medKit');
  });
});

describe('efeitos de genjutsu', () => {
  const withTech = (id: string) => {
    const p = createPlayer(common, gameData);
    return { ...p, techniques: [...p.techniques, id] };
  };

  it('Sono: perde a vez com +1 turno, mas acorda ao tomar dano', () => {
    const s0 = withInitiative(startBattle(withTech('sleepSong'), testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:sleepSong', seq(0.5), gameData);
    // 2 turnos base + 1 do sono
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'villain', turns: 3, kind: 'sleep' }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'sleep' }]);
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(ofRound(s1, s2), 'wake')).toEqual([{ type: 'wake', side: 'villain' }]);
    expect(s2.villain.fx.asleep).toBe(0);
  });

  it('Pavor: o alvo causa 25% menos dano', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: 20, chakraCost: 0, weight: 1 }] })), 'villain');
    const feared = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, feared: 2 } } };
    // 20 × 0.75 − 6 = 9 (sem pavor: 14)
    expect(ofType(playRound(feared, 'rest', seq(0.5), gameData).log, 'attack')[0]!.damage).toBe(9);
    expect(ofType(playRound(s0, 'rest', seq(0.5), gameData).log, 'attack')[0]!.damage).toBe(14);
  });

  it('Confusão: 30% de falhar; metade das falhas acerta o próprio lutador', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain()), 'villain');
    const confused = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, confused: 2 } } };
    // técnica, falha (0.0 < 30%), acerta a si mesmo (0.0 < 50%): 10 − 5/2 = 7
    const s1 = playRound(confused, 'rest', seq(0.5, 0.0, 0.0), gameData);
    expect(ofType(s1.log, 'confusionFail')).toEqual([{ type: 'confusionFail', side: 'villain', selfHit: 7 }]);
    expect(s1.villain.hp).toBe(43);
    expect(s1.player.hp).toBe(100);
  });

  it('Tormento: o alvo perde 4 de chakra no início de cada rodada', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain()));
    const tormented = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, tormented: 2 } } };
    const s1 = playRound(tormented, 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'torment')).toEqual([{ type: 'torment', side: 'villain', chakra: 4 }]);
    expect(s1.villain.chakra).toBe(16);
    expect(s1.villain.fx.tormented).toBe(1);
  });

  it('Transferência de Mente (Yamanaka) aplica Confusão', () => {
    const s1 = playRound(withInitiative(startBattle(createPlayer(clan('yamanaka'), gameData), testVillain())), 'tech:mindTransfer', seq(0.5, 0.99), gameData);
    expect(ofType(s1.log, 'mental')[0]).toMatchObject({ target: 'villain', effect: 'confusion' });
  });

  it('Imitação de Sombra (Nara): ninjutsu que aprisiona e funciona em quem é imune a genjutsu', () => {
    const gaara = testVillain({ passive: villainsById.gaara!.passive });
    const s0 = withInitiative(startBattle(createPlayer(clan('nara'), gameData), gaara));
    expect(playerGenjutsuHitChance(s0, gameData, 'shadowImitation')).toBeCloseTo(0.8);
    const s1 = playRound(s0, 'tech:shadowImitation', seq(0.5), gameData);
    // ninjutsu 13 contra ninjutsu 5: 1 + floor(8 / 8) = 2 turnos
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'villain', turns: 2, kind: 'prison' }]);
  });
});

describe('Sharingan (Uchiha)', () => {
  it('evolui com o nível: 1, 2 e 3 tomoe', () => {
    const p = createPlayer(uchiha, gameData);
    expect(sharinganStage(p, gameData)).toBe(1);
    expect(sharinganStage({ ...p, level: 4 }, gameData)).toBe(2);
    expect(sharinganStage({ ...p, level: 7 }, gameData)).toBe(3);
    expect(sharinganStage(createPlayer(common, gameData), gameData)).toBe(0);
  });

  it('ativar gasta o turno e chakra; ativo aumenta os status e custa chakra por rodada', () => {
    const s0 = startBattle(createPlayer(uchiha, gameData), testVillain(), { playerStartsFirst: true });
    expect(availableActions(s0, gameData)).toContain('dojutsu');
    const s1 = playRound(s0, 'dojutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'dojutsu')).toEqual([{ type: 'dojutsu', dojutsu: 'sharingan', stage: 1, chakra: 4 }]);
    expect(s1.playerFx.dojutsuActive).toBe(true);
    expect(s1.playerFx.dojutsuTurns).toBe(5); // a contagem começa na rodada seguinte
    expect(s1.player.chakra).toBe(26 - 4 - 1); // ativação + manutenção
    expect(effectiveOffense(s1, 'taijutsu', gameData)).toBe(7 + 3);
    expect(availableActions(s1, gameData)).not.toContain('dojutsu');
    // Taijutsu efetivo maior também aumenta a resistência: 10 − (10/2 + 1) = 4.
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', damage: 4 });
  });

  it('sem chakra para a manutenção, desliga sozinho', () => {
    const s0 = active(battle({ ...createPlayer(uchiha, gameData), chakra: 0 }, testVillain(), { playerStartsFirst: true }));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'dojutsuEnd')).toEqual([{ type: 'dojutsuEnd', dojutsu: 'sharingan', reason: 'chakra' }]);
    expect(s1.playerFx.dojutsuActive).toBe(false);
  });

  it('desliga sozinho depois de 5 rodadas e pode ser ativado de novo', () => {
    let s = withInitiative(startBattle(createPlayer(uchiha, gameData), testVillain({ hp: 500 })));
    s = playRound(s, 'dojutsu', seq(0.5, 0.01), gameData);
    for (let i = 0; i < 4; i++) s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(s.playerFx.dojutsuActive).toBe(true);
    s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(ofType(s.log, 'dojutsuEnd')).toEqual([{ type: 'dojutsuEnd', dojutsu: 'sharingan', reason: 'time' }]);
    expect(availableActions(s, gameData)).toContain('dojutsu');
  });

  it('ativo, lê o movimento do vilão e reduz o dano à metade', () => {
    const s0 = active(startBattle(createPlayer(uchiha, gameData), testVillain()));
    // vilão primeiro (0.9), técnica, acerto, leitura (0.0)
    const s1 = playRound(s0, 'rest', seq(0.9, 0.5, 0.5, 0.0, 0.5), gameData);
    expect(ofType(s1.log, 'movementReading')).toEqual([{ type: 'movementReading', damageBefore: 4, damage: 2 }]);
    const s2 = playRound(startBattle(createPlayer(uchiha, gameData), testVillain()), 'rest', seq(0.9, 0.5, 0.5, 0.0), gameData);
    expect(ofType(s2.log, 'movementReading')).toHaveLength(0);
  });

  it('ativo, melhora o acerto do genjutsu e pode trocar o efeito por Pavor', () => {
    const s0 = startBattle(createPlayer(uchiha, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    expect(playerGenjutsuHitChance(active(s0), gameData)).toBeGreaterThan(playerGenjutsuHitChance(s0, gameData));
    expect(() => playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData, { fear: true })).toThrow();
    const s1 = playRound(active(s0), 'tech:basicGenjutsu', seq(0.5), gameData, { fear: true });
    expect(ofType(s1.log, 'mental')[0]).toMatchObject({ target: 'villain', effect: 'fear' });
    expect(s1.villain.fx.debilitated).toBe(0);
  });

  it('Olhos treinados: o genjutsu do vilão acerta menos o Uchiha (e Leitura mental tira 10 do Yamanaka)', () => {
    const v = testVillain({
      defense: { taijutsu: 5, ninjutsu: 5, genjutsu: 20 },
      techniques: [{ id: 'illusion', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, mentalTurns: 1 }],
    });
    const chance = (o: Origin) =>
      ofType(playRound(startBattle(createPlayer(o, gameData), v, { villainStartsFirst: true }), 'rest', seq(0.99), gameData).log, 'attack')[0]!
        .hitChance;
    expect(chance(common)).toBeCloseTo(0.8); // 0.6 + (20 − 10) × 0.02
    expect(chance(uchiha)).toBeCloseTo(0.6); // 0.6 + (20 − (14 + 6)) × 0.02
    expect(chance(clan('yamanaka'))).toBeCloseTo(0.6); // 0.6 + (20 − 15) × 0.02 − 0.1
  });
});

describe('Byakugan e Rotação (Hyuuga)', () => {
  it('ativo, o taijutsu não erra e fica mais forte', () => {
    const s0 = startBattle(createPlayer(hyuuga, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    expect(ofType(playRound(s0, 'tech:basicTaijutsu', seq(0.01), gameData).log, 'attack')[0]).toMatchObject({ outcome: 'miss' });
    const s1 = playRound(active(s0), 'tech:basicTaijutsu', seq(0.01), gameData);
    // (8 + 16 − 5 × 0.7) × 1.1 = 22
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ outcome: 'hit', hitChance: 1, damage: 22 });
  });

  it('ativo, o ninjutsu continua podendo errar', () => {
    const s0 = startBattle(createPlayer(hyuuga, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    expect(ofType(playRound(active(s0), 'tech:waterBullet', seq(0.01), gameData).log, 'attack')[0]).toMatchObject({ outcome: 'miss' });
  });

  it('Selo dos Pontos Vitais: só com o Byakugan ativo; não erra e drena o chakra do vilão', () => {
    const s0 = startBattle(createPlayer(hyuuga, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    expect(availableActions(s0, gameData)).not.toContain('tech:chakraBlockStrike');
    expect(() => playRound(s0, 'tech:chakraBlockStrike', seq(0.5), gameData)).toThrow();
    const s1 = playRound(active(s0), 'tech:chakraBlockStrike', seq(0.01), gameData);
    expect(ofType(s1.log, 'chakraDrain')).toEqual([{ type: 'chakraDrain', amount: 6, source: 'seal' }]);
    expect(s1.villain.chakra).toBe(14);
  });

  it('ativar custa 3 de chakra', () => {
    const s1 = playRound(startBattle(createPlayer(hyuuga, gameData), testVillain(), { playerStartsFirst: true }), 'dojutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'dojutsu')).toEqual([{ type: 'dojutsu', dojutsu: 'byakugan', stage: 0, chakra: 3 }]);
    expect(s1.player.chakra).toBe(27 - 3 - 1);
  });

  it('Rotação: age antes, bloqueia o golpe e devolve metade do dano', () => {
    const p = toLevel(createPlayer(hyuuga, gameData), 4);
    const v = testVillain({ hp: 200, techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: 30, chakraCost: 0, weight: 1 }] });
    const s0 = withInitiative(startBattle(p, v), 'villain');
    const s1 = playRound(s0, 'tech:rotation', seq(0.5), gameData);
    // 30 − (16/2 + 1) = 21 bloqueados; devolve 10
    expect(ofType(s1.log, 'rotationBlock')).toEqual([{ type: 'rotationBlock', reflected: 10 }]);
    expect(s1.player.hp).toBe(p.maxHp);
    expect(s1.villain.hp).toBe(190);
  });
});

describe('passivas e ativas de clã', () => {
  it('Determinação (comum): +10% de XP', () => {
    expect(gainXp(createPlayer(common, gameData), 100, gameData).xp).toBe(110);
    expect(gainXp(createPlayer(uchiha, gameData), 100, gameData).xp).toBe(100);
  });

  it('Expansão (Akimichi): gasta o turno; depois, taijutsu ×1,5 e speed −3; Corpo pesado ×1,2 com HP cheio', () => {
    const p = createPlayer(clan('akimichi'), gameData);
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'expansion', seq(0.5), gameData);
    expect(s1.player.chakra).toBe(28);
    expect(effectiveSpeed(s1, gameData)).toBe(6);
    expect(effectiveSpeed({ ...s1, round: s1.round + 1 }, gameData)).toBe(3);
    const s2 = playRound({ ...s1, player: { ...s1.player, hp: s1.player.maxHp } }, 'tech:basicTaijutsu', seq(0.5), gameData);
    // (8 + 15 − 5) × 1.5 × 1.2 = 32
    expect(ofType(ofRound(s1, s2), 'attack')[0]).toMatchObject({ side: 'player', damage: 32 });
  });

  it('Clones das Sombras (Uzumaki): grátis, o próximo ataque vira 3 golpes de 40%', () => {
    const s0 = withInitiative(startBattle(createPlayer(clan('uzumaki', 'wind'), gameData), testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData, { clones: true });
    const hits = ofType(s1.log, 'attack').filter((a) => a.side === 'player');
    // (8 + 10 − 5) × 0.4 = 5, três vezes
    expect(hits.map((a) => a.damage)).toEqual([5, 5, 5]);
    expect(s1.player.chakra).toBe(35 - 6);
  });

  it('Dupla (Inuzuka): depois de um acerto, 30% de o cão atacar também', () => {
    const s0 = withInitiative(startBattle(createPlayer(clan('inuzuka'), gameData), testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.0, 0.5), gameData);
    const hits = ofType(s1.log, 'attack').filter((a) => a.side === 'player');
    // golpe: 8 + 14 − 5 = 17; cão: floor(8 × 0.4) + 14 − 5 = 12
    expect(hits.map((a) => [a.techniqueId, a.damage])).toEqual([
      ['basicTaijutsu', 17],
      ['dogAttack', 12],
    ]);
  });

  it('Estrategista (Nara): a próxima ação do vilão já fica sorteada antes da escolha', () => {
    const s0 = startBattle(createPlayer(clan('nara'), gameData), testVillain(), {}, gameData, seq(0.5));
    expect(s0.villain.intent).toEqual({ kind: 'technique', id: 'punch' });
  });
});

describe('passivas e comportamentos dos vilões', () => {
  it('cada vilão tem a passiva da tabela, e uma versão hardcore', () => {
    expect(villainsById.mizuki!.passive?.kind).toBe('trickster');
    expect(villainsById.haku!.passive).toMatchObject({ kind: 'mirrors', damageMult: 0.6 });
    expect(villainsById.zabuza!.passive?.kind).toBe('mist');
    expect(villainsById.gaara!.passive).toMatchObject({ kind: 'cloak', variant: 'beast', genjutsuImmune: true });
    for (const id of ['jirobo', 'kidomaru', 'tayuya', 'sakon']) {
      expect(villainsById[id]!.passive).toMatchObject({ kind: 'cloak', variant: 'curseMark' });
    }
    expect(villainsById.kabuto!.passive).toEqual({ kind: 'scalpel', critBonus: 0.1 });
    expect(villainsById.orochimaru!.passive).toMatchObject({ kind: 'insane', killWindow: 5, revivePct: 0.5 });
    const charged = Object.values(villainsById).filter((v) => v.behavior?.charged).map((v) => v.id);
    expect(charged).toEqual(['zabuza', 'gaara', 'sakon', 'orochimaru']);
  });

  it('Enganador (Mizuki): sobrevive ao primeiro golpe fatal com 1 de HP e se acovarda', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ hp: 10, passive: { kind: 'trickster' } })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(s1.status).toBe('ongoing');
    expect(s1.villain.hp).toBe(1);
    expect(ofType(s1.log, 'trickster')).toEqual([{ type: 'trickster', counterCrit: false }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'cower' }]);
    expect(playRound(s1, 'tech:basicTaijutsu', seq(0.5), gameData).status).toBe('won');
  });

  it('Enganador no hardcore: no lugar de se acovardar, revida com crítico garantido', () => {
    const v = testVillain({ hp: 10, passive: { kind: 'trickster', counterCrit: true } });
    const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), v)), 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'skip')).toHaveLength(0);
    // 10 × 2 − 6 = 14
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ outcome: 'crit', damage: 14 });
  });

  it('Espelhos (Haku): duas ações por turno com 60% do dano', () => {
    const v = testVillain({
      hp: 200,
      passive: villainsById.haku!.passive,
      techniques: [{ id: 'needle', type: 'taijutsu', baseDamage: 20, chakraCost: 0, weight: 1 }],
    });
    const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), v), 'villain'), 'rest', seq(0.5), gameData);
    // 20 × 0.6 − 6 = 6, duas vezes
    expect(ofType(s1.log, 'attack').map((a) => [a.side, a.damage])).toEqual([
      ['villain', 6],
      ['villain', 6],
    ]);
  });

  it('Névoa oculta (Zabuza): começa na névoa, a chance de erro do jogador cresce 50% por 4 rodadas', () => {
    const v = testVillain({ hp: 500, passive: { kind: 'mist', turns: 4, evasionMult: 1.5 } });
    let s = withInitiative(startBattle(createPlayer(common, gameData), v));
    s = playRound(s, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s.log, 'mist')).toEqual([{ type: 'mist', turns: 4 }]);
    // Punho de Chakra: erro de 10% vira 15%
    expect(ofType(s.log, 'attack')[0]!.hitChance).toBeCloseTo(0.85);
    for (let i = 0; i < 3; i++) s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(ofType(s.log, 'mistEnd')).toHaveLength(1);
    const after = playRound(s, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(ofRound(s, after), 'attack')[0]!.hitChance).toBeCloseTo(0.9);
  });

  it('Zabuza no hardcore: ao cair, Haku se sacrifica; volta com 50% do HP, 10% mais forte e fazendo sangrar', () => {
    const v = testVillain({
      hp: 50,
      passive: { kind: 'mist', turns: 4, evasionMult: 1.5, lastStand: { healPct: 0.5, damageMult: 1.1 } },
    });
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), v));
    const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 10 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'lastStand')).toEqual([{ type: 'lastStand', healed: 25 }]);
    // 10 × 1.1 − 6 = 5
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ damage: 5 });
    expect(s1.playerFx.bleeding).toBe(true);
  });

  it('golpe carregado: gasta a vez anunciando; na seguinte, dano ×2 sem crítico', () => {
    const v = testVillain({ hp: 200, behavior: { charged: 'punch' } });
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), v), 'villain');
    const s1 = playRound(s0, 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'charge')).toEqual([{ type: 'charge', techniqueId: 'punch', chakra: 0 }]);
    expect(ofType(s1.log, 'attack')).toHaveLength(0);
    expect(s1.villain.charging).toBe('punch');
    // 0.99 seria crítico; o golpe carregado não critica: 10 × 2 − 6 = 14
    const s2 = playRound(s1, 'rest', seq(0.99), gameData);
    expect(ofType(ofRound(s1, s2), 'attack')[0]).toMatchObject({ side: 'villain', outcome: 'hit', damage: 14, critChance: 0 });
  });

  describe('manto do vilão (Gaara jinchuuriki, marca da maldição do Quarteto)', () => {
    const gaara = (extra: object = {}) =>
      testVillain({ hp: 100, passive: { ...villainsById.gaara!.passive!, ...extra } as VillainPassive });

    it('abaixo de 50% de HP: dano e defesas ×1,5, sem recoil', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), gaara()));
      const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 55 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      expect(ofType(s1.log, 'cloak')).toEqual([{ type: 'cloak', side: 'villain' }]);
      expect(villainDefense(s1, 'taijutsu')).toBe(7);
      // 10 × 1.5 − 6 = 9
      expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ damage: 9 });
      expect(s1.villain.hp).toBe(55 - 13);
    });

    it('o manto do vilão paga com o chakra dele (10% do máximo por rodada)', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), gaara()));
      const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 55 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      const s2 = playRound(s1, 'rest', seq(0.5), gameData);
      expect(ofType(ofRound(s1, s2), 'cloakCost')).toEqual([{ type: 'cloakCost', side: 'villain', chakra: 2 }]);
    });

    it('jinchuuriki é imune a genjutsu', () => {
      const s0 = withInitiative(startBattle(createPlayer(uchiha, gameData), gaara()));
      expect(playerGenjutsuHitChance(s0, gameData)).toBe(0);
      const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData);
      expect(ofType(s1.log, 'genjutsuImmune')).toEqual([{ type: 'genjutsuImmune', target: 'villain' }]);
      expect(s1.villain.fx.debilitated).toBe(0);
    });

    it('Gaara no hardcore: defesa absoluta dobra só a defesa de taijutsu', () => {
      const s0 = startBattle(createPlayer(common, gameData), gaara(villainsById.gaara!.hardcorePassive!));
      expect(villainDefense(s0, 'taijutsu')).toBe(10);
      expect(villainDefense(s0, 'ninjutsu')).toBe(5);
    });

    it('Punho de Areia: sem chakra, o Gaara bate em vez de concentrar', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), villainsById.gaara!), 'villain');
      const s1 = playRound({ ...s0, villain: { ...s0.villain, chakra: 0 } }, 'rest', seq(0.5), gameData);
      expect(ofType(s1.log, 'villainRest')).toHaveLength(0);
      expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', techniqueId: 'sandFist' });
    });

    it('marca da maldição no hardcore: já começa ativa', () => {
      const curse = testVillain({ hp: 100, passive: villainsById.jirobo!.hardcorePassive });
      const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), curse)), 'rest', seq(0.5), gameData);
      expect(ofType(s1.log, 'cloak')).toEqual([{ type: 'cloak', side: 'villain' }]);
    });
  });

  describe('Kabuto', () => {
    it('Bisturi: +10% de crítico, e o crítico faz sangrar', () => {
      const v = testVillain({ hp: 100, passive: villainsById.kabuto!.passive });
      const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), v), 'villain'), 'rest', seq(0.5, 0.99), gameData);
      expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', outcome: 'crit' });
      expect(ofType(s1.log, 'attack')[0]!.critChance).toBeCloseTo(0.15);
      expect(s1.playerFx.bleeding).toBe(true);
    });

    it('hardcore: golpes fazem sangrar e furam 30% da resistência', () => {
      const v = testVillain({ hp: 100, passive: villainsById.kabuto!.hardcorePassive });
      const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), v), 'villain'), 'rest', seq(0.5), gameData);
      // resistência 6 × 0.7 = 4: 10 − 4 = 6
      expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', damage: 6 });
      expect(s1.playerFx.bleeding).toBe(true);
    });

    it('Palma Mística: só abaixo de 50% de HP; cura 15% sem rolar acerto e gasta 7 de chakra', () => {
      const palm = villainsById.kabuto!.techniques.find((t) => t.id === 'mysticPalm')!;
      const v = testVillain({ hp: 100, techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 1 }, { ...palm, weight: 1000 }] });
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), v), 'villain');
      const healthy = playRound({ ...s0, villain: { ...s0.villain, hp: 60 } }, 'rest', seq(0.99, 0.5), gameData);
      expect(ofType(healthy.log, 'villainHeal')).toHaveLength(0);
      const hurt = playRound({ ...s0, villain: { ...s0.villain, hp: 40 } }, 'rest', seq(0.5), gameData);
      expect(ofType(hurt.log, 'villainHeal')).toEqual([{ type: 'villainHeal', techniqueId: 'mysticPalm', healed: 15 }]);
      expect(hurt.villain.hp).toBe(55);
      expect(hurt.villain.chakra).toBe(13);
    });
  });

  describe('Insano (Orochimaru)', () => {
    const insane = (extra: object = {}) =>
      testVillain({ hp: 100, passive: { ...villainsById.orochimaru!.passive!, ...extra } as VillainPassive });

    it('cobra: acertos envenenam o jogador', () => {
      const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), insane()), 'villain'), 'rest', seq(0.5, 0.5, 0.99), gameData);
      expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'player', kind: 'poison', turns: 0 }]);
      expect(s1.playerFx.poison).toEqual({ bonus: 1, ticks: 1 });
    });

    it('abaixo de 50% de HP, se não for derrotado em 5 rodadas, revive com 50% do HP máximo', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), insane()));
      let s = playRound({ ...s0, villain: { ...s0.villain, hp: 60 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      expect(ofType(s.log, 'insaneTimer')).toEqual([{ type: 'insaneTimer', rounds: 5 }]);
      s = { ...s, villain: { ...s.villain, hp: 20 } };
      for (let i = 0; i < 4; i++) s = playRound(s, 'rest', seq(0.5), gameData);
      expect(ofType(s.log, 'insaneRevive')).toEqual([{ type: 'insaneRevive', hp: 50 }]);
      // A contagem recomeça sempre que ele cair abaixo de 50% de novo.
      s = playRound({ ...s, villain: { ...s.villain, hp: 55 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      expect(ofType(s.log, 'insaneTimer')).toHaveLength(2);
    });

    it('derrotado dentro do prazo, não revive', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), insane()));
      const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 60 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      const s2 = playRound({ ...s1, villain: { ...s1.villain, hp: 10 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      expect(s2.status).toBe('won');
    });

    it('hardcore: 4 rodadas de prazo e revive com o HP cheio', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), insane(villainsById.orochimaru!.hardcorePassive!)));
      let s = playRound({ ...s0, villain: { ...s0.villain, hp: 60 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      for (let i = 0; i < 3; i++) s = playRound(s, 'rest', seq(0.5), gameData);
      expect(ofType(s.log, 'insaneRevive')).toEqual([{ type: 'insaneRevive', hp: 100 }]);
    });
  });
});
