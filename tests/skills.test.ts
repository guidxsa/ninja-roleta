import { describe, expect, it } from 'vitest';
import {
  availableActions,
  effectiveOffense,
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
import { seq, testVillain, withInitiative } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
const uchiha: Origin = { lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false };
const hyuuga: Origin = { lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false };
const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };

const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);

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
  it('técnicas de nível são mais fortes e mais caras que a básica da categoria', () => {
    const basic = { taijutsu: 'basicTaijutsu', ninjutsu: 'basicNinjutsu' } as const;
    for (const t of levelTechniques.filter((t) => t.type !== 'genjutsu')) {
      const b = techniquesById[basic[t.type as 'taijutsu' | 'ninjutsu']]!;
      expect(t.baseDamage).toBeGreaterThan(b.baseDamage);
      expect(t.chakraCost).toBeGreaterThan(b.chakraCost);
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
    expect(actions).toEqual(expect.arrayContaining(['tech:basicTaijutsu', 'tech:basicNinjutsu', 'tech:phoenixFlower']));
  });

  it('no nível 7 vêm as mais fortes; os combos avançados de taijutsu são só do prodígio', () => {
    expect(toLevel(createPlayer(common, gameData), 7).techniques).toEqual(['phoenixFlower', 'greatBlaze']);
    expect(toLevel(createPlayer(prodigy, gameData), 7).techniques).toEqual(['whirlwindCombo', 'hiddenLotus']);
    const hyuuga7 = toLevel(createPlayer(hyuuga, gameData), 7).techniques;
    expect(hyuuga7).not.toContain('whirlwindCombo');
    expect(hyuuga7).not.toContain('hiddenLotus');
    expect(() => learnTechnique(createPlayer(hyuuga, gameData), 'hiddenLotus', gameData)).toThrow();
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

  it('taijutsu fortalecido: ninguém nasce com ele; sai na recompensa e serve a todas as origens', () => {
    for (const o of [common, uchiha, hyuuga, prodigy]) {
      const p = createPlayer(o, gameData);
      expect(p.techniques).not.toContain('empoweredTaijutsu');
      expect(learnableTechniques(p, gameData)).toContain('empoweredTaijutsu');
    }
  });

  it('taijutsu fortalecido gasta chakra e bate mais forte que o básico', () => {
    const p = learnTechnique(createPlayer(common, gameData), 'empoweredTaijutsu', gameData);
    const s0 = startBattle(p, testVillain({ hp: 200 }), { playerStartsFirst: true });
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
    expect(s1.playerFx.dojutsuTurns).toBe(5); // a contagem começa na rodada seguinte
    expect(s1.player.chakra).toBe(18 - 4 - 1); // ativação + manutenção
    expect(effectiveOffense(s1, 'taijutsu', gameData)).toBe(9 + 3);
    expect(availableActions(s1, gameData)).not.toContain('dojutsu');
    // Taijutsu efetivo maior também aumenta a resistência: 10 − (12/2 + 1) = 3.
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', damage: 3 });
  });

  it('sem chakra para a manutenção, desliga sozinho', () => {
    const s0 = active(startBattle({ ...createPlayer(uchiha, gameData), chakra: 0 }, testVillain(), { playerStartsFirst: true }));
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
  it('ativo, o taijutsu não erra e fica mais forte', () => {
    const s0 = startBattle(createPlayer(hyuuga, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    // 0.01 erraria sem o Byakugan
    expect(ofType(playRound(s0, 'tech:basicTaijutsu', seq(0.01), gameData).log, 'attack')[0]).toMatchObject({ outcome: 'miss' });
    const s1 = playRound(active(s0), 'tech:basicTaijutsu', seq(0.01), gameData);
    // (8 + 16 − 5 × 0.7) × 1.1 = 22
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ outcome: 'hit', hitChance: 1, damage: 22 });
  });

  it('ativo, o ninjutsu continua podendo errar', () => {
    const s0 = startBattle(createPlayer(hyuuga, gameData), testVillain({ hp: 200 }), { playerStartsFirst: true });
    expect(ofType(playRound(active(s0), 'tech:basicNinjutsu', seq(0.01), gameData).log, 'attack')[0]).toMatchObject({ outcome: 'miss' });
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
  const ofRound = (prev: BattleState, next: BattleState) => next.log.slice(prev.log.length);

  it('cada vilão tem a passiva da tabela, e uma versão hardcore', () => {
    expect(villainsById.mizuki!.passive?.kind).toBe('trickster');
    expect(villainsById.haku!.passive?.kind).toBe('mirrors');
    expect(villainsById.zabuza!.passive?.kind).toBe('mist');
    expect(villainsById.gaara!.passive).toMatchObject({ kind: 'cloak', variant: 'beast', genjutsuImmune: true });
    for (const id of ['jirobo', 'kidomaru', 'tayuya', 'sakon']) {
      expect(villainsById[id]!.passive).toMatchObject({ kind: 'cloak', variant: 'curseMark' });
    }
    expect(villainsById.kabuto!.passive?.kind).toBe('scalpel');
    expect(villainsById.orochimaru!.passive?.kind).toBe('insane');
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

  it('Espelhos (Haku): duas ações por turno com 80% do dano', () => {
    const v = testVillain({
      hp: 200,
      passive: { kind: 'mirrors', actions: 2, damageMult: 0.8 },
      techniques: [{ id: 'needle', type: 'taijutsu', baseDamage: 20, chakraCost: 0, weight: 1 }],
    });
    const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), v), 'villain'), 'rest', seq(0.5), gameData);
    // 20 × 0.8 − 6 = 10, duas vezes
    expect(ofType(s1.log, 'attack').map((a) => [a.side, a.damage])).toEqual([
      ['villain', 10],
      ['villain', 10],
    ]);
  });

  it('Névoa oculta (Zabuza): começa na névoa, a chance de erro do jogador cresce 50% por 4 rodadas', () => {
    const v = testVillain({ hp: 500, passive: { kind: 'mist', turns: 4, evasionMult: 1.5 } });
    let s = withInitiative(startBattle(createPlayer(common, gameData), v));
    s = playRound(s, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s.log, 'mist')).toEqual([{ type: 'mist', turns: 4 }]);
    // erro de 15% vira 22,5%
    expect(ofType(s.log, 'attack')[0]!.hitChance).toBeCloseTo(0.775);
    for (let i = 0; i < 3; i++) s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(ofType(s.log, 'mistEnd')).toHaveLength(1);
    const after = playRound(s, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(ofRound(s, after), 'attack')[0]!.hitChance).toBeCloseTo(0.85);
  });

  it('Zabuza no hardcore: ao cair, Haku se sacrifica; volta com 50% do HP, 10% mais forte e fazendo sangrar', () => {
    const v = testVillain({
      hp: 50,
      passive: { kind: 'mist', turns: 4, evasionMult: 1.5, lastStand: { healPct: 0.5, damageMult: 1.1 } },
    });
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), v));
    const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 10 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'lastStand')).toEqual([{ type: 'lastStand', healed: 25 }]);
    expect(s1.villain.hp).toBe(25);
    // 10 × 1.1 − 6 = 5
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ damage: 5 });
    expect(s1.playerFx.bleeding).toBe(true);
  });

  describe('manto do vilão (Gaara jinchuuriki, marca da maldição do Quarteto)', () => {
    const gaara = (extra: object = {}) =>
      testVillain({ hp: 100, passive: { ...villainsById.gaara!.passive!, ...extra } as VillainPassive });

    it('abaixo de 50% de HP: dano e defesas ×1,5 e recoil de metade do dano que causa', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), gaara()));
      const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 55 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      expect(ofType(s1.log, 'cloak')).toEqual([{ type: 'cloak', side: 'villain' }]);
      expect(villainDefense(s1, 'taijutsu')).toBe(7);
      // 10 × 1.5 − 6 = 9; recoil de 4
      expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ damage: 9 });
      expect(ofType(s1.log, 'recoil')).toEqual([{ type: 'recoil', side: 'villain', damage: 4 }]);
      expect(s1.villain.hp).toBe(55 - 13 - 4);
    });

    it('jinchuuriki é imune a genjutsu', () => {
      const s0 = withInitiative(startBattle(createPlayer(uchiha, gameData), gaara()));
      expect(playerGenjutsuHitChance(s0, gameData)).toBe(0);
      const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData);
      expect(ofType(s1.log, 'genjutsuImmune')).toEqual([{ type: 'genjutsuImmune', target: 'villain' }]);
      expect(s1.villain.fx.debilitated).toBe(0);
    });

    it('Gaara no hardcore: defesa absoluta dobra as defesas a luta toda', () => {
      const s0 = startBattle(createPlayer(common, gameData), gaara({ defenseMult: 2 }));
      expect(villainDefense(s0, 'taijutsu')).toBe(10);
    });

    it('marca da maldição no hardcore: já começa ativa', () => {
      const curse = testVillain({ hp: 100, passive: villainsById.jirobo!.hardcorePassive });
      const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), curse)), 'rest', seq(0.5), gameData);
      expect(ofType(s1.log, 'cloak')).toEqual([{ type: 'cloak', side: 'villain' }]);
    });
  });

  it('Bisturi (Kabuto): cura 6% do HP máximo por rodada', () => {
    const v = testVillain({ hp: 100, passive: { kind: 'scalpel', regenPct: 0.06 } });
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), v));
    const s1 = playRound({ ...s0, villain: { ...s0.villain, hp: 50 } }, 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'villainRegen')).toEqual([{ type: 'villainRegen', hp: 6 }]);
  });

  it('Kabuto no hardcore: golpes fazem sangrar e furam 30% da resistência', () => {
    const v = testVillain({ hp: 100, passive: { kind: 'scalpel', regenPct: 0.06, bleedOnHit: true, resistancePierce: 0.3 } });
    const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), v), 'villain'), 'rest', seq(0.5), gameData);
    // resistência 6 × 0.7 = 4: 10 − 4 = 6
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', damage: 6 });
    expect(s1.playerFx.bleeding).toBe(true);
  });

  describe('Insano (Orochimaru)', () => {
    const insane = (extra: object = {}) =>
      testVillain({ hp: 100, passive: { ...villainsById.orochimaru!.passive!, ...extra } as VillainPassive });

    it('cobra: acertos envenenam o jogador', () => {
      const s1 = playRound(withInitiative(startBattle(createPlayer(common, gameData), insane()), 'villain'), 'rest', seq(0.5, 0.5, 0.99), gameData);
      expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'player', kind: 'poison', turns: 0 }]);
      expect(s1.playerFx.poison).toEqual({ bonus: 1, ticks: 1 });
    });

    it('abaixo de 50% de HP, se não for derrotado em 3 rodadas, revive com o dobro do HP (mínimo 50%)', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), insane()));
      let s = playRound({ ...s0, villain: { ...s0.villain, hp: 60 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      expect(ofType(s.log, 'insaneTimer')).toEqual([{ type: 'insaneTimer', rounds: 3 }]);
      expect(s.villain.hp).toBe(47);
      s = playRound(s, 'rest', seq(0.5), gameData);
      s = playRound(s, 'rest', seq(0.5), gameData);
      expect(ofType(s.log, 'insaneRevive')).toEqual([{ type: 'insaneRevive', hp: 94 }]);
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

    it('hardcore: 2 rodadas de prazo e revive com o HP cheio', () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), insane(villainsById.orochimaru!.hardcorePassive!)));
      let s = playRound({ ...s0, villain: { ...s0.villain, hp: 60 } }, 'tech:basicTaijutsu', seq(0.5), gameData);
      s = playRound(s, 'rest', seq(0.5), gameData);
      expect(ofType(s.log, 'insaneRevive')).toEqual([{ type: 'insaneRevive', hp: 100 }]);
    });
  });
});
