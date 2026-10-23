import { describe, expect, it } from 'vitest';
import {
  availableActions,
  effectiveOffense,
  gatesToOpen,
  playRound,
  startBattle,
  type BattleEvent,
  type BattleState,
} from '../src/core/combat';
import { createPlayer, learnTechnique } from '../src/core/player';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { gameData } from '../src/data/index';
import { villains } from '../src/data/villains';
import { runBattle, MAX_ROUNDS } from '../src/sim/runner';
import { seq, testVillain, withInitiative } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
/** Comum que usa genjutsu (para testar o aprisionamento sem depender do Uchiha). */
const withGenjutsu = () => {
  const p = createPlayer(common, gameData);
  return { ...p, basicTypes: [...p.basicTypes, 'genjutsu' as const] };
};
const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);

describe('rodada básica', () => {
  it('emboscada: jogador age primeiro e pode vencer na hora', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 5 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(s1.status).toBe('won');
    expect(s1.player.chakra).toBe(10); // taijutsu não gasta chakra
    expect(ofType(s1.log, 'ambush')).toHaveLength(1);
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'hit', damage: 13 });
  });

  it('é pura: não altera o estado anterior', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    const snapshot = structuredClone(s0);
    playRound(s0, 'tech:basicTaijutsu', createRng(1), gameData);
    expect(s0).toEqual(snapshot);
  });

  it('ninjutsu básico usa a afinidade e aplica vantagem elemental', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ element: 'wind' }), {
      playerStartsFirst: true,
    });
    const s1 = playRound(s0, 'tech:basicNinjutsu', seq(0.5), gameData);
    // (10 + 10 − 5) × 1.5 = 22
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ elementMult: 1.5, damage: 22 });
    expect(s1.player.chakra).toBe(7);
  });

  it('erro causa 0 de dano', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain(), { playerStartsFirst: true });
    // iniciativa, acerto do jogador (erro), técnica do vilão, acerto do vilão
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.01, 0.01, 0.5, 0.01), gameData);
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ outcome: 'miss', damage: 0 });
    expect(s1.villain.hp).toBe(50);
  });

  it('ações indisponíveis lançam erro; sem chakra sobram o taijutsu básico e concentrar', () => {
    const p = { ...createPlayer(common, gameData), chakra: 0 };
    const s0 = startBattle(p, testVillain());
    expect(availableActions(s0, gameData)).toEqual(['tech:basicTaijutsu', 'rest']);
    expect(() => playRound(s0, 'tech:empoweredTaijutsu', seq(0.5), gameData)).toThrow();
    expect(() => playRound(s0, 'tech:basicNinjutsu', seq(0.5), gameData)).toThrow();
    const s1 = playRound(s0, 'rest', seq(0.1, 0.01, 0.01), gameData);
    expect(s1.player.chakra).toBe(3);
  });
});

describe('Vontade do Fogo', () => {
  // iniciativa 0.9 → vilão primeiro; técnica; acerto. Dano do vilão: 10 − 6 = 4.
  const villainFirstHit = () => seq(0.9, 0.5, 0.5);

  it('ao chegar a 0 de HP consome o item e restaura HP e chakra', () => {
    const p = { ...createPlayer(common, gameData), hp: 1, chakra: 2 };
    const s1 = playRound(startBattle(p, testVillain()), 'tech:basicTaijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('ongoing');
    expect(s1.player.revives).toBe(0);
    expect(s1.player.revivesUsed).toBe(1);
    expect(s1.player.hp).toBe(100);
    expect(s1.player.chakra).toBe(10); // restaurado para 10; taijutsu não gasta
    expect(ofType(s1.log, 'revive')).toHaveLength(1);
  });

  it('sem item: derrota', () => {
    const p = { ...createPlayer(common, gameData), hp: 1, revives: 0 };
    const s1 = playRound(startBattle(p, testVillain()), 'tech:basicTaijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('lost');
    expect(ofType(s1.log, 'attack')).toHaveLength(1); // o jogador não chega a agir
  });

  it('exame: não consome o item, só perde a luta', () => {
    const p = { ...createPlayer(common, gameData), hp: 1 };
    const s0 = startBattle(p, testVillain(), { allowRevive: false });
    const s1 = playRound(s0, 'tech:basicTaijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('lost');
    expect(s1.player.revives).toBe(1);
  });
});

describe('debilitado', () => {
  it('genjutsu que acerta faz o alvo perder a próxima ação, depois ele fica imune por uma ação', () => {
    const s0 = withInitiative(startBattle(withGenjutsu(), testVillain()));
    const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'villain', turns: 1, kind: 'prison' }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'prison' }]);
    expect(s1.villain.fx).toMatchObject({ debilitated: 0, debilitateImmunity: 1 });

    // Rodada 2: genjutsu acerta mas o vilão resiste; o vilão age e perde a imunidade.
    const s2 = playRound(s1, 'tech:basicGenjutsu', seq(0.5), gameData);
    expect(ofType(s2.log, 'debilitateResisted')).toHaveLength(1);
    expect(s2.villain.fx.debilitateImmunity).toBe(0);
    expect(ofType(s2.log, 'attack').filter((a) => a.side === 'villain')).toHaveLength(1);
  });

  it('jogador debilitado perde a ação', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    const s1 = playRound({ ...s0, playerFx: { ...s0.playerFx, debilitated: 1 } }, 'tech:basicTaijutsu', seq(0.9, 0.5, 0.5), gameData);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'player', reason: 'prison' }]);
    expect(s1.player.chakra).toBe(10);
  });
});

describe('passivas', () => {
  const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };

  it('Portões: abrir gasta o turno (sem golpe), chakra e HP; taijutsu ×1,5 por 5 rodadas a partir da seguinte', () => {
    const p = createPlayer(prodigy, gameData);
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    expect(availableActions(s0, gameData)).toEqual(['tech:basicTaijutsu', 'gates', 'rest']);
    const s1 = playRound(s0, 'gates', seq(0.5), gameData);
    // 15% de 110 = 16 de HP; 1º portão custa 5 de chakra.
    expect(ofType(s1.log, 'gates')).toEqual([{ type: 'gates', stage: 1, hpLost: 16, chakra: 5 }]);
    expect(ofType(s1.log, 'attack').filter((a) => a.side === 'player')).toHaveLength(0);
    expect(s1.player.chakra).toBe(2);
    expect(s1.playerFx.gatesTurns).toBe(5);
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5), gameData);
    // (8 + 18 − 5) × 1.5 = 31
    expect(ofType(s2.log.slice(s1.log.length), 'attack')[0]).toMatchObject({ side: 'player', damage: 31 });
    expect(s2.playerFx.gatesTurns).toBe(4);
    expect(availableActions(s2, gameData)).not.toContain('gates');
  });

  it('Portões evoluem com o taijutsu: portão maior, mais forte e mais caro', () => {
    const p = createPlayer(prodigy, gameData);
    expect(gatesToOpen(p, gameData)).toMatchObject({ stage: 1, taijutsuMult: 1.5, chakraCost: 5 });
    const strong = { ...p, offense: { ...p.offense, taijutsu: 22 } };
    expect(gatesToOpen(strong, gameData)).toMatchObject({ stage: 2, taijutsuMult: 1.75, chakraCost: 7, hpCostPct: 0.2 });
    expect(gatesToOpen({ ...p, offense: { ...p.offense, taijutsu: 26 } }, gameData)).toMatchObject({ stage: 3, taijutsuMult: 2 });
    // Sem chakra para o portão, não abre.
    expect(availableActions(startBattle({ ...strong, chakra: 6 }, testVillain()), gameData)).not.toContain('gates');
    expect(gatesToOpen(createPlayer(common, gameData), gameData)).toBeNull();
  });

  it('Portões nunca deixam o HP abaixo de 1', () => {
    const p = { ...createPlayer(prodigy, gameData), hp: 5 };
    const s1 = playRound(withInitiative(startBattle(p, testVillain())), 'gates', seq(0.01), gameData);
    expect(ofType(s1.log, 'gates')).toEqual([{ type: 'gates', stage: 1, hpLost: 4, chakra: 5 }]);
  });

  it('Vitalidade Uzumaki: recupera chakra e HP no início da rodada', () => {
    const p = { ...createPlayer({ lineageId: 'uzumaki', affinity: 'wind', jinchuuriki: false }, gameData), hp: 50, chakra: 5 };
    const s1 = playRound(startBattle(p, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    // 3% de 150 = 4
    expect(ofType(s1.log, 'regen')).toEqual([{ type: 'regen', hp: 4, chakra: 1 }]);
  });


  it('Punho preciso: taijutsu ignora 30% da defesa do vilão', () => {
    const p = createPlayer({ lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false }, gameData);
    const s1 = playRound(
      startBattle(p, testVillain({ defense: { taijutsu: 10, ninjutsu: 5, genjutsu: 5 } }), { playerStartsFirst: true }),
      'tech:basicTaijutsu',
      seq(0.5),
      gameData,
    );
    // 8 + 16 − 10 × 0.7 = 17
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ damage: 17 });
  });
});

describe('jinchuuriki: manto de chakra e demônio interno', () => {
  const jin: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: true };

  it('abaixo de 50% de HP: status ×1,5, regenera 5% por rodada e metade do dano causado volta como recoil', () => {
    const p = { ...createPlayer(jin, gameData), hp: 53 };
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })), 'villain');
    // O vilão acerta 10 − 6 = 4: 49 de HP (< 50), o manto desperta antes do golpe do jogador.
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'cloak')).toEqual([{ type: 'cloak', side: 'player' }]);
    expect(effectiveOffense(s1, 'taijutsu', gameData)).toBe(15);
    // 8 + 15 − 5 = 18; recoil de 9
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'player')).toMatchObject({ damage: 18 });
    expect(ofType(s1.log, 'recoil')).toEqual([{ type: 'recoil', side: 'player', damage: 9 }]);
    expect(s1.player.hp).toBe(40);
    const s2 = playRound(s1, 'rest', seq(0.5, 0.01), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'cloakRegen')).toEqual([{ type: 'cloakRegen', side: 'player', hp: 5 }]);
  });

  it('desperta também quem já começa a luta abaixo de 50%; dura 5 rodadas e só uma vez por luta', () => {
    const p = { ...createPlayer(jin, gameData), hp: 40 };
    let s = withInitiative(startBattle(p, testVillain({ hp: 500 })));
    s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(s.playerFx.cloakTurns).toBe(4);
    for (let i = 0; i < 4; i++) s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(s.playerFx.cloakTurns).toBe(0);
    s = playRound({ ...s, player: { ...s.player, hp: 10 } }, 'rest', seq(0.5, 0.01), gameData);
    expect(ofType(s.log, 'cloak')).toHaveLength(1);
  });

  it('o recoil nunca derruba', () => {
    const s0 = withInitiative(startBattle({ ...createPlayer(jin, gameData), hp: 2 }, testVillain({ hp: 200 })));
    const cloaked: BattleState = { ...s0, playerFx: { ...s0.playerFx, cloakTurns: 5, cloakUsed: true } };
    const s1 = playRound(cloaked, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    // Regenera 5 no início da rodada (7 de HP); o recoil de 9 para em 6 e deixa 1.
    expect(ofType(s1.log, 'recoil')).toEqual([{ type: 'recoil', side: 'player', damage: 6 }]);
    expect(s1.player.hp).toBe(1);
  });

  it('demônio interno: imune a genjutsu', () => {
    const v = testVillain({
      defense: { taijutsu: 5, ninjutsu: 5, genjutsu: 26 },
      techniques: [{ id: 'illusion', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, debilitateTurns: 1 }],
    });
    const s1 = playRound(withInitiative(startBattle(createPlayer(jin, gameData), v), 'villain'), 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'genjutsuImmune')).toEqual([{ type: 'genjutsuImmune', target: 'player' }]);
    expect(s1.playerFx.debilitated).toBe(0);
  });
});

describe('iniciativa', () => {
  it('é rolada só no início da luta e vale para a luta toda', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 500 }));
    const s1 = playRound(s0, 'rest', seq(0.01, 0.5, 0.01), gameData);
    expect(s1.initiative).toBe('player');
    // O rng que daria a iniciativa ao vilão não é mais usado para isso.
    const s2 = playRound(s1, 'rest', seq(0.99, 0.01), gameData);
    expect(ofType(s2.log, 'initiative')).toHaveLength(1);
    const round2 = s2.log.slice(s1.log.length).filter((e) => e.type === 'rest' || e.type === 'attack');
    expect(round2[0]!.type).toBe('rest');
  });
});

describe('efeitos negativos', () => {
  const lightning: Origin = { lineageId: null, affinity: 'lightning', jinchuuriki: false };
  const water: Origin = { lineageId: null, affinity: 'water', jinchuuriki: false };

  it('paralisia: crítico de raio faz o alvo perder a vez', () => {
    const s0 = withInitiative(startBattle(createPlayer(lightning, gameData), testVillain()));
    const s1 = playRound(s0, 'tech:basicNinjutsu', seq(0.99), gameData);
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'villain', turns: 1, kind: 'paralysis' }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'paralysis' }]);
  });

  it('atordoamento: crítico de água (ou vento, terra) reduz a chance de acerto das próximas 2 ações do alvo', () => {
    const s0 = withInitiative(startBattle(createPlayer(water, gameData), testVillain()));
    const s1 = playRound(s0, 'tech:basicNinjutsu', seq(0.99, 0.5, 0.5), gameData);
    expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'villain', kind: 'stun', turns: 2 }]);
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')!.hitChance).toBeCloseTo(0.75);
    expect(s1.villain.fx.stunned).toBe(1);
  });

  it('acerto comum não causa efeito elemental', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ element: 'lightning', hp: 500 })));
    const s1 = playRound(s0, 'tech:basicNinjutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s1.log, 'status')).toHaveLength(0);
  });

  describe('queimadura', () => {
    // Jogador de fogo contra vilão de raio (neutro), 500 de HP: 2% = 10.
    const burning = () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ element: 'lightning', hp: 500 })));
      return playRound(s0, 'tech:basicNinjutsu', seq(0.99, 0.5, 0.01), gameData);
    };

    it('crítico de fogo queima por 2 rodadas: 2% e depois 4% do HP máximo', () => {
      const s1 = burning();
      expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'villain', kind: 'burn', turns: 2 }]);
      expect(ofType(s1.log, 'burnTick')).toEqual([{ type: 'burnTick', target: 'villain', damage: 10 }]);
      const s2 = playRound(s1, 'rest', seq(0.5, 0.01), gameData);
      expect(ofType(s2.log.slice(s1.log.length), 'burnTick')).toEqual([{ type: 'burnTick', target: 'villain', damage: 20 }]);
      expect(ofType(s2.log, 'burnOut')).toHaveLength(1);
    });

    it('queimando, cada acerto de fogo prolonga 1 rodada', () => {
      const s1 = burning();
      const s2 = playRound(s1, 'tech:basicNinjutsu', seq(0.5, 0.5, 0.01), gameData);
      expect(ofType(s2.log.slice(s1.log.length), 'burnExtend')).toEqual([{ type: 'burnExtend', target: 'villain', turns: 2 }]);
      expect(s2.villain.fx.burn).toBe(1);
    });

    it('depois de apagar, a contagem recomeça e um acerto de fogo comum reacende', () => {
      const s2 = playRound(burning(), 'rest', seq(0.5, 0.01), gameData);
      const s3 = playRound(s2, 'tech:basicNinjutsu', seq(0.5, 0.5, 0.01), gameData);
      const round3 = s3.log.slice(s2.log.length);
      expect(ofType(round3, 'status')).toEqual([{ type: 'status', target: 'villain', kind: 'burn', turns: 1 }]);
      expect(ofType(round3, 'burnTick')).toEqual([{ type: 'burnTick', target: 'villain', damage: 10 }]);
    });

    it('o tique não passa de 16% do HP máximo', () => {
      const s1 = burning();
      const hot = { ...s1, villain: { ...s1.villain, fx: { ...s1.villain.fx, burn: 3, burnTicks: 4 } } };
      const s2 = playRound(hot, 'rest', seq(0.5, 0.01), gameData);
      expect(ofType(s2.log.slice(s1.log.length), 'burnTick')).toEqual([{ type: 'burnTick', target: 'villain', damage: 80 }]);
    });
  });

  it('sangramento: crítico de espada faz sangrar a luta toda; quem sangra toma ×1,5 de lâminas', () => {
    const sword = testVillain({
      techniques: [{ id: 'slash', type: 'taijutsu', baseDamage: 20, chakraCost: 0, weight: 1, blade: 'sword' }],
    });
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), sword), 'villain');
    const s1 = playRound(s0, 'rest', seq(0.5, 0.99), gameData);
    // crítico: 20 × 2 − 6 = 34
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', outcome: 'crit', damage: 34 });
    expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'player', kind: 'bleed', turns: 0 }]);
    const s2 = playRound(s1, 'rest', seq(0.5, 0.5), gameData);
    // 20 × 1.5 − 6 = 24
    expect(ofType(s2.log.slice(s1.log.length), 'attack')[0]).toMatchObject({ damage: 24 });
    expect(s2.playerFx.bleeding).toBe(true);
  });

  it('a Vontade do Fogo limpa os efeitos negativos', () => {
    const s0 = withInitiative(startBattle({ ...createPlayer(common, gameData), hp: 1 }, testVillain()), 'villain');
    const hurt: BattleState = { ...s0, playerFx: { ...s0.playerFx, bleeding: true, burn: 2, poison: { bonus: 1, ticks: 3 } } };
    const s1 = playRound(hurt, 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'revive')).toHaveLength(1);
    expect(s1.playerFx).toMatchObject({ bleeding: false, burn: 0, poison: null });
  });
});

describe('chakra dos vilões', () => {
  const caster = () =>
    testVillain({
      chakra: 6,
      techniques: [{ id: 'blast', type: 'ninjutsu', baseDamage: 10, chakraCost: 5, weight: 1 }],
    });

  it('gasta chakra ao usar técnica', () => {
    // vilão primeiro (0.9), técnica, acerto
    const s1 = playRound(startBattle(createPlayer(common, gameData), caster()), 'rest', seq(0.9, 0.5, 0.5), gameData);
    expect(s1.villain.chakra).toBe(1);
    expect(ofType(s1.log, 'attack').filter((a) => a.side === 'villain')).toHaveLength(1);
  });

  it('sem chakra para nenhuma técnica, concentra chakra no lugar de atacar', () => {
    const s0 = startBattle(createPlayer(common, gameData), caster());
    const s1 = playRound({ ...s0, villain: { ...s0.villain, chakra: 1 } }, 'rest', seq(0.9, 0.01, 0.01), gameData);
    expect(ofType(s1.log, 'villainRest')).toEqual([{ type: 'villainRest', chakra: 4 }]);
    expect(s1.villain.chakra).toBe(5);
    expect(ofType(s1.log, 'attack').filter((a) => a.side === 'villain')).toHaveLength(0);
  });

  it('só sorteia entre as técnicas que pode pagar', () => {
    const v = testVillain({
      chakra: 3,
      techniques: [
        { id: 'blast', type: 'ninjutsu', baseDamage: 30, chakraCost: 5, weight: 100 },
        { id: 'punch', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 1 },
      ],
    });
    const s1 = playRound(startBattle(createPlayer(common, gameData), v), 'rest', seq(0.9, 0.0, 0.5), gameData);
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')).toMatchObject({ techniqueId: 'punch' });
  });
});

describe('lutas completas', () => {
  it('toda luta automática termina, contra todos os vilões', () => {
    const rng = createRng(99);
    for (const v of villains) {
      for (let i = 0; i < 30; i++) {
        const r = runBattle(createPlayer(common, gameData), v, rng, gameData);
        expect(r.status).not.toBe('ongoing');
        expect(r.round).toBeLessThan(MAX_ROUNDS);
      }
    }
  });
});

describe('genjutsu: aprisionamento sem dano', () => {
  const withGen = (genjutsu: number) => {
    const p = withGenjutsu();
    return { ...p, offense: { ...p.offense, genjutsu } };
  };
  const prison = (s: ReturnType<typeof playRound>) => ofType(s.log, 'debilitate')[0]?.turns;

  it('não causa dano: o vilão só perde a vez', () => {
    const s0 = startBattle(withGen(10), testVillain(), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'hit', damage: 0 });
    expect(s1.villain.hp).toBe(50);
  });

  it('os turnos crescem com a proficiência do usuário contra o genjutsu do alvo, até 3', () => {
    const turns = (gen: number, villainGen = 5) =>
      prison(playRound(startBattle(withGen(gen), testVillain({ defense: { taijutsu: 5, ninjutsu: 5, genjutsu: villainGen } }), { playerStartsFirst: true }), 'tech:basicGenjutsu', seq(0.5), gameData));
    expect(turns(10)).toBe(1); // vantagem 5
    expect(turns(13)).toBe(2); // vantagem 8
    expect(turns(21)).toBe(3); // vantagem 16
    expect(turns(60)).toBe(3); // teto
    expect(turns(21, 20)).toBe(1); // alvo resistente
  });

  it('técnica e pergaminho de genjutsu aumentam o poder de aprisionamento', () => {
    const crow = learnTechnique(withGen(10), 'crowIllusion', gameData); // 10 + 6 = 16 → vantagem 11
    expect(prison(playRound(startBattle(crow, testVillain(), { playerStartsFirst: true }), 'tech:crowIllusion', seq(0.5), gameData))).toBe(2);
    const scroll = { ...withGen(10), techniqueLevels: { genjutsu: 1 } }; // 10 + 3 = 13 → vantagem 8
    expect(prison(playRound(startBattle(scroll, testVillain(), { playerStartsFirst: true }), 'tech:basicGenjutsu', seq(0.5), gameData))).toBe(2);
  });

  it('não gasta o crítico garantido do foco', () => {
    const s0 = withInitiative(startBattle({ ...withGen(10), focusCrit: true }, testVillain()));
    const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData, true);
    expect(s1.playerFx.guaranteedCrit).toBe(true);
    expect(ofType(s1.log, 'guaranteedCrit')).toHaveLength(0);
  });

  it('o genjutsu do vilão também não causa dano e aprisiona o jogador conforme o genjutsu dele', () => {
    const v = testVillain({
      defense: { taijutsu: 5, ninjutsu: 5, genjutsu: 26 },
      techniques: [{ id: 'illusion', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, debilitateTurns: 1 }],
    });
    const s0 = startBattle(withGen(10), v, { villainStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(s1.player.hp).toBe(s0.player.hp);
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'player', turns: 3, kind: 'prison' }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'player', reason: 'prison' }]);
  });
});
