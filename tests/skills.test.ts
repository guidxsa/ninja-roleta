import { describe, expect, it } from 'vitest';
import {
  availableActions,
  effectiveOffense,
  playerGenjutsuHitChance,
  playRound,
  sharinganStage,
  startBattle,
  type BattleEvent,
  type BattleState,
} from '../src/core/combat';
import { applyLevelUp, createPlayer, gainXp, learnTechnique, type PlayerState } from '../src/core/player';
import { learnableTechniques, levelUp } from '../src/core/progression';
import type { Origin, VillainPassive } from '../src/core/types';
import { gameData } from '../src/data/index';
import { levelTechniques, lineageTechniques, techniquesById } from '../src/data/techniques';
import { villainsById } from '../src/data/villains';
import { seq, testVillain } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
const uchiha: Origin = { lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false };
const hyuuga: Origin = { lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false };
const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };

const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);

/** Sobe o jogador até `level` (bônus da roleta sempre em HP). */
function toLevel(p: PlayerState, level: number): PlayerState {
  while (p.level < level) p = applyLevelUp(gainXp(p, 10_000, gameData), 'hp', gameData);
  return p;
}

const active = (s: BattleState): BattleState => ({ ...s, playerFx: { ...s.playerFx, dojutsuActive: true } });

describe('skill set por categoria e técnicas de nível', () => {
  it('técnicas de nível são mais fortes e mais caras que a básica da categoria', () => {
    const basic = { taijutsu: 'basicTaijutsu', ninjutsu: 'basicNinjutsu' } as const;
    for (const t of levelTechniques.filter((t) => t.type !== 'genjutsu')) {
      const b = techniquesById[basic[t.type as 'taijutsu' | 'ninjutsu']]!;
      expect(t.baseDamage).toBeGreaterThan(b.baseDamage);
      expect(t.chakraCost).toBeGreaterThan(b.chakraCost);
    }
  });

  it('ao chegar no nível 4 o comum aprende o taijutsu e o ninjutsu do próprio elemento, sem genjutsu', () => {
    const lv3 = toLevel(createPlayer(common, gameData), 3);
    const step = levelUp(gainXp(lv3, 10_000, gameData), 'hp', gameData);
    expect(step.effect).toMatchObject({ kind: 'levelUp', level: 4, learned: ['whirlwindCombo', 'phoenixFlower'] });
    expect(step.player.techniques).not.toContain('galeBlast');
    expect(step.player.techniques).not.toContain('fearIllusion');
    // As técnicas somam ao skill set: as básicas continuam disponíveis.
    const actions = availableActions(startBattle(step.player, testVillain()), gameData);
    expect(actions).toEqual(
      expect.arrayContaining(['tech:basicTaijutsu', 'tech:empoweredTaijutsu', 'tech:whirlwindCombo', 'tech:basicNinjutsu', 'tech:phoenixFlower']),
    );
  });

  it('no nível 7 vêm as mais fortes; o prodígio do taijutsu só recebe as de taijutsu', () => {
    expect(toLevel(createPlayer(common, gameData), 7).techniques).toEqual([
      'whirlwindCombo',
      'phoenixFlower',
      'hiddenLotus',
      'greatBlaze',
    ]);
    expect(toLevel(createPlayer(prodigy, gameData), 7).techniques).toEqual(['whirlwindCombo', 'hiddenLotus']);
  });

  it('Uchiha recebe genjutsu de nível; quem aprende um genjutsu libera a categoria', () => {
    expect(toLevel(createPlayer(uchiha, gameData), 4).techniques).toContain('fearIllusion');
    const lv4 = toLevel(createPlayer(common, gameData), 4);
    expect(lv4.techniques).not.toContain('fearIllusion');
    expect(learnTechnique(lv4, 'crowIllusion', gameData).techniques).toEqual(
      expect.arrayContaining(['crowIllusion', 'fearIllusion']),
    );
  });

  it('técnicas de nível e de linhagem não saem na recompensa "nova técnica"', () => {
    const special = [...levelTechniques, ...lineageTechniques].map((t) => t.id);
    for (const o of [common, uchiha, hyuuga, prodigy]) {
      const pool = learnableTechniques(toLevel(createPlayer(o, gameData), 9), gameData);
      expect(pool.filter((id) => special.includes(id))).toEqual([]);
    }
  });

  it('taijutsu fortalecido gasta chakra e bate mais forte que o básico', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:empoweredTaijutsu', seq(0.5), gameData);
    // (14 + 10 − 5) = 19, contra 13 do básico
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ techniqueId: 'empoweredTaijutsu', damage: 19 });
    expect(s1.player.chakra).toBe(7);
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
    expect(ofType(s1.log, 'dojutsu')).toEqual([{ type: 'dojutsu', dojutsu: 'sharingan', stage: 1 }]);
    expect(s1.playerFx.dojutsuActive).toBe(true);
    expect(s1.player.chakra).toBe(18 - 4 - 1); // ativação + manutenção
    expect(effectiveOffense(s1, 'taijutsu', gameData)).toBe(9 + 3);
    expect(availableActions(s1, gameData)).not.toContain('dojutsu');
    // Taijutsu efetivo maior também aumenta a resistência: 10 − (12/2 + 1) = 3.
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', damage: 3 });
  });

  it('sem chakra para a manutenção, desliga sozinho', () => {
    const s0 = active(startBattle({ ...createPlayer(uchiha, gameData), chakra: 0 }, testVillain(), { playerStartsFirst: true }));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'dojutsuEnd')).toHaveLength(1);
    expect(s1.playerFx.dojutsuActive).toBe(false);
  });

  it('ativo, lê o movimento do vilão e reduz o dano à metade', () => {
    const s0 = active(startBattle(createPlayer(uchiha, gameData), testVillain()));
    // vilão primeiro (0.9), técnica, acerto, leitura (0.0)
    const s1 = playRound(s0, 'rest', seq(0.9, 0.5, 0.5, 0.0, 0.5), gameData);
    expect(ofType(s1.log, 'movementReading')).toEqual([{ type: 'movementReading', damageBefore: 3, damage: 1 }]);
    // Desativado: não há leitura.
    const s2 = playRound(startBattle(createPlayer(uchiha, gameData), testVillain()), 'rest', seq(0.9, 0.5, 0.5, 0.0), gameData);
    expect(ofType(s2.log, 'movementReading')).toHaveLength(0);
  });

  it('ativo, melhora o acerto do genjutsu', () => {
    const s0 = startBattle(createPlayer(uchiha, gameData), testVillain());
    expect(playerGenjutsuHitChance(active(s0), gameData)).toBeGreaterThan(playerGenjutsuHitChance(s0, gameData));
  });

  it('resistência passiva a genjutsu: o genjutsu do vilão acerta menos o Uchiha', () => {
    const v = testVillain({
      defense: { taijutsu: 5, ninjutsu: 5, genjutsu: 20 },
      techniques: [{ id: 'illusion', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, debilitateTurns: 1 }],
    });
    const chance = (o: Origin) =>
      ofType(playRound(startBattle(createPlayer(o, gameData), v, { villainStartsFirst: true }), 'rest', seq(0.99), gameData).log, 'attack')[0]!
        .hitChance;
    expect(chance(common)).toBeCloseTo(0.8); // 0.6 + (20 − 10) × 0.02
    expect(chance(uchiha)).toBeCloseTo(0.58); // 0.6 + (20 − (15 + 6)) × 0.02
  });
});

describe('Byakugan (Hyuuga)', () => {
  it('ativo, os golpes não erram e o taijutsu fica mais forte', () => {
    const s0 = startBattle(createPlayer(hyuuga, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    // 0.01 erraria sem o Byakugan
    expect(ofType(playRound(s0, 'tech:basicTaijutsu', seq(0.01), gameData).log, 'attack')[0]).toMatchObject({ outcome: 'miss' });
    const s1 = playRound(active(s0), 'tech:basicTaijutsu', seq(0.01), gameData);
    // (8 + 13 − 5 × 0.7) × 1.1 = 19
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ outcome: 'hit', hitChance: 1, damage: 19 });
  });

  it('golpe inibidor: só com o Byakugan ativo; drena o chakra do vilão', () => {
    const s0 = startBattle(createPlayer(hyuuga, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    expect(availableActions(s0, gameData)).not.toContain('tech:chakraBlockStrike');
    expect(() => playRound(s0, 'tech:chakraBlockStrike', seq(0.5), gameData)).toThrow();
    const s1 = playRound(active(s0), 'tech:chakraBlockStrike', seq(0.5), gameData);
    expect(ofType(s1.log, 'chakraDrain')).toEqual([{ type: 'chakraDrain', amount: 6 }]);
    expect(s1.villain.chakra).toBe(14);
  });

  it('ativar custa 3 de chakra', () => {
    const s1 = playRound(startBattle(createPlayer(hyuuga, gameData), testVillain(), { playerStartsFirst: true }), 'dojutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'dojutsu')).toEqual([{ type: 'dojutsu', dojutsu: 'byakugan', stage: 0 }]);
    expect(s1.player.chakra).toBe(11 - 3 - 1);
  });
});

describe('passivas únicas dos vilões', () => {
  it('Gaara é jinchuuriki, Orochimaru invoca cobras e Kabuto usa ninjutsu médico', () => {
    expect(villainsById.gaara!.passive?.kind).toBe('beastSurge');
    expect(villainsById.orochimaru!.passive?.kind).toBe('snakeSummon');
    expect(villainsById.kabuto!.passive?.kind).toBe('medical');
  });

  it('surto da besta: abaixo do limiar, cura e bate mais forte por alguns turnos, uma vez por luta', () => {
    const passive: VillainPassive = { kind: 'beastSurge', hpThresholdPct: 0.3, healPct: 0.15, damageMult: 1.4, turns: 3 };
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 100, passive }), { playerStartsFirst: true });
    const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 35 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
    // 35 − 13 = 22 (< 30) → cura 15
    expect(ofType(s1.log, 'villainSurge')).toEqual([{ type: 'villainSurge', healed: 15 }]);
    expect(s1.villain.hp).toBe(37);
    // 10 × 1.4 − 6 = 8
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ damage: 8 });
    const s2 = playRound({ ...s1, villain: { ...s1.villain, hp: 20 } }, 'tech:basicTaijutsu', seq(0.1, 0.5), gameData);
    expect(ofType(s2.log, 'villainSurge')).toHaveLength(1);
  });

  it('cobras: golpe do vilão envenena o jogador, que perde HP no fim da rodada', () => {
    const v = testVillain({ passive: { kind: 'snakeSummon', poison: 5 } });
    const s1 = playRound(startBattle(createPlayer(common, gameData), v, { villainStartsFirst: true }), 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'playerPoisoned')).toEqual([{ type: 'playerPoisoned', value: 5 }]);
    expect(ofType(s1.log, 'playerPoisonTick')).toEqual([{ type: 'playerPoisonTick', damage: 5, remaining: 4 }]);
    expect(s1.player.hp).toBe(100 - 4 - 5);
  });

  it('veneno que zera o HP usa o item de retorno (e some)', () => {
    const v = testVillain({ passive: { kind: 'snakeSummon', poison: 5 } });
    const s0 = startBattle({ ...createPlayer(common, gameData), hp: 3 }, v);
    const s1 = playRound({ ...s0, playerFx: { ...s0.playerFx, poison: 5 } }, 'rest', seq(0.1, 0.5, 0.01), gameData);
    expect(ofType(s1.log, 'revive')).toHaveLength(1);
    expect(s1.playerFx.poison).toBe(0);
    expect(s1.status).toBe('ongoing');
  });

  it('ninjutsu médico do vilão: abaixo da metade do HP se cura no lugar de atacar, com limite de usos', () => {
    const passive: VillainPassive = { kind: 'medical', hpThresholdPct: 0.5, healPct: 0.2, chakraCost: 6, maxUses: 2 };
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 100, passive }), { villainStartsFirst: true });
    const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 40 } }, 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'villainMedical')).toEqual([{ type: 'villainMedical', healed: 20 }]);
    expect(s1.villain).toMatchObject({ hp: 60, chakra: 14, passiveUses: 1 });
    expect(ofType(s1.log, 'attack').filter((a) => a.side === 'villain')).toHaveLength(0);
    const used = { ...s0, villain: { ...s0.villain, hp: 40, passiveUses: 2 } };
    expect(ofType(playRound(used, 'rest', seq(0.5), gameData).log, 'villainMedical')).toHaveLength(0);
  });
});
