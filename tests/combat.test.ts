import { describe, expect, it } from 'vitest';
import { availableActions, playRound, startBattle, type BattleEvent } from '../src/core/combat';
import { createPlayer } from '../src/core/player';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { gameData } from '../src/data/index';
import { villains } from '../src/data/villains';
import { runBattle, MAX_ROUNDS } from '../src/sim/runner';
import { seq, testVillain } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);

describe('rodada básica', () => {
  it('emboscada: jogador age primeiro e pode vencer na hora', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 5 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'taijutsu', seq(0.5), gameData);
    expect(s1.status).toBe('won');
    expect(s1.player.chakra).toBe(9); // taijutsu imbuído custa 1
    expect(ofType(s1.log, 'ambush')).toHaveLength(1);
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'hit', damage: 13 });
  });

  it('é pura: não altera o estado anterior', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    const snapshot = structuredClone(s0);
    playRound(s0, 'taijutsu', createRng(1), gameData);
    expect(s0).toEqual(snapshot);
  });

  it('ninjutsu básico usa a afinidade e aplica vantagem elemental', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ element: 'wind' }), {
      playerStartsFirst: true,
    });
    const s1 = playRound(s0, 'ninjutsu', seq(0.5), gameData);
    // (10 + 10 − 5) × 1.5 = 22
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ elementMult: 1.5, damage: 22 });
    expect(s1.player.chakra).toBe(7);
  });

  it('erro causa 0 de dano', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain(), { playerStartsFirst: true });
    const s1 = playRound(s0, 'taijutsu', seq(0.01, 0.5, 0.01), gameData);
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ outcome: 'miss', damage: 0 });
    expect(s1.villain.hp).toBe(50);
  });

  it('ações indisponíveis lançam erro; sem chakra só resta concentrar', () => {
    const p = { ...createPlayer(common, gameData), chakra: 0 };
    const s0 = startBattle(p, testVillain());
    expect(availableActions(s0, gameData)).toEqual(['rest']);
    expect(() => playRound(s0, 'taijutsu', seq(0.5), gameData)).toThrow();
    const s1 = playRound(s0, 'rest', seq(0.1, 0.01, 0.01), gameData);
    expect(s1.player.chakra).toBe(3);
  });
});

describe('item de retorno', () => {
  // iniciativa 0.9 → vilão primeiro; técnica; acerto. Dano do vilão: 10 − 6 = 4.
  const villainFirstHit = () => seq(0.9, 0.5, 0.5);

  it('ao chegar a 0 de HP consome o item e restaura HP e chakra', () => {
    const p = { ...createPlayer(common, gameData), hp: 1, chakra: 2 };
    const s1 = playRound(startBattle(p, testVillain()), 'taijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('ongoing');
    expect(s1.player.revives).toBe(0);
    expect(s1.player.revivesUsed).toBe(1);
    expect(s1.player.hp).toBe(100);
    expect(s1.player.chakra).toBe(9); // restaurado para 10 e gastou 1 no taijutsu
    expect(ofType(s1.log, 'revive')).toHaveLength(1);
  });

  it('sem item: derrota', () => {
    const p = { ...createPlayer(common, gameData), hp: 1, revives: 0 };
    const s1 = playRound(startBattle(p, testVillain()), 'taijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('lost');
    expect(ofType(s1.log, 'attack')).toHaveLength(1); // o jogador não chega a agir
  });

  it('exame: não consome o item, só perde a luta', () => {
    const p = { ...createPlayer(common, gameData), hp: 1 };
    const s0 = startBattle(p, testVillain(), { allowRevive: false });
    const s1 = playRound(s0, 'taijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('lost');
    expect(s1.player.revives).toBe(1);
  });
});

describe('debilitado', () => {
  it('genjutsu que acerta faz o alvo perder a próxima ação, depois ele fica imune por uma ação', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain(), { playerStartsFirst: true });
    const s1 = playRound(s0, 'genjutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'villain', turns: 1 }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain' }]);
    expect(s1.villain.fx).toEqual({ debilitated: 0, debilitateImmunity: 1 });

    // Rodada 2: jogador primeiro (0.1), genjutsu acerta mas o vilão resiste; o vilão age e perde a imunidade.
    const s2 = playRound(s1, 'genjutsu', seq(0.1, 0.5, 0.5, 0.5), gameData);
    expect(ofType(s2.log, 'debilitateResisted')).toHaveLength(1);
    expect(s2.villain.fx.debilitateImmunity).toBe(0);
    expect(ofType(s2.log, 'attack').filter((a) => a.side === 'villain')).toHaveLength(1);
  });

  it('jogador debilitado perde a ação', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    const s1 = playRound({ ...s0, playerFx: { ...s0.playerFx, debilitated: 1 } }, 'taijutsu', seq(0.9, 0.5, 0.5), gameData);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'player' }]);
    expect(s1.player.chakra).toBe(10);
  });
});

describe('passivas', () => {
  it('Portões: perde 25% do HP máximo e taijutsu causa ×1,5 por 3 rodadas', () => {
    const p = createPlayer({ lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false }, gameData);
    const s0 = startBattle(p, testVillain(), { playerStartsFirst: true });
    expect(availableActions(s0, gameData)).toEqual(['taijutsu', 'gates', 'rest']);
    const s1 = playRound(s0, 'gates', seq(0.5), gameData);
    expect(ofType(s1.log, 'gates')).toEqual([{ type: 'gates', hpLost: 27 }]);
    // (8 + 15 − 5) × 1.5 = 27
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', damage: 27 });
    expect(s1.playerFx.gatesTurns).toBe(2);
    expect(availableActions(s1, gameData)).not.toContain('gates');
  });

  it('Portões nunca deixam o HP abaixo de 1', () => {
    const p = { ...createPlayer({ lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false }, gameData), hp: 5 };
    const s1 = playRound(startBattle(p, testVillain(), { playerStartsFirst: true }), 'gates', seq(0.01), gameData);
    expect(ofType(s1.log, 'gates')).toEqual([{ type: 'gates', hpLost: 4 }]);
  });

  it('Vitalidade Uzumaki: recupera chakra e HP no início da rodada', () => {
    const p = { ...createPlayer({ lineageId: 'uzumaki', affinity: 'wind', jinchuuriki: false }, gameData), hp: 50, chakra: 5 };
    const s1 = playRound(startBattle(p, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    expect(ofType(s1.log, 'regen')).toEqual([{ type: 'regen', hp: 3, chakra: 1 }]);
  });

  it('Leitura de movimento: reduz o dano recebido à metade', () => {
    const p = createPlayer({ lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false }, gameData);
    const s1 = playRound(startBattle(p, testVillain()), 'rest', seq(0.9, 0.5, 0.5, 0.0, 0.01), gameData);
    // 10 − (10/2 + 1) = 4 → 2
    expect(ofType(s1.log, 'movementReading')).toEqual([{ type: 'movementReading', damageBefore: 4, damage: 2 }]);
    expect(s1.player.hp).toBe(98);
  });

  it('Punho preciso: taijutsu ignora 30% da defesa do vilão', () => {
    const p = createPlayer({ lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false }, gameData);
    const s1 = playRound(
      startBattle(p, testVillain({ defense: { taijutsu: 10, ninjutsu: 5, genjutsu: 5 } }), { playerStartsFirst: true }),
      'taijutsu',
      seq(0.5),
      gameData,
    );
    // 8 + 13 − 10 × 0.7 = 14
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ damage: 14 });
  });
});

describe('surto da besta (jinchuuriki)', () => {
  const jin: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: true };

  it('controle: cura e aumenta o dano', () => {
    const p = { ...createPlayer(jin, gameData), hp: 33 };
    // vilão primeiro, acerta (4 de dano → 29 < 30), roleta de controle (0.1), jogador acerta
    const s1 = playRound(startBattle(p, testVillain()), 'taijutsu', seq(0.9, 0.5, 0.5, 0.1, 0.5), gameData);
    expect(ofType(s1.log, 'surge')).toEqual([{ type: 'surge', mode: 'control', healed: 25 }]);
    expect(s1.player.hp).toBe(54);
    // 13 × 1.5 = 19
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'player')).toMatchObject({ damage: 19 });
    expect(s1.playerFx.surgeTurns).toBe(2);
  });

  it('descontrole: dano ×2 mas perde 10% do HP máximo por rodada, sem morrer', () => {
    const p = { ...createPlayer(jin, gameData), hp: 33 };
    const s1 = playRound(startBattle(p, testVillain()), 'taijutsu', seq(0.9, 0.5, 0.5, 0.9, 0.5), gameData);
    expect(s1.playerFx.surgeMode).toBe('frenzy');
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'player')).toMatchObject({ damage: 26 });
    expect(s1.player.hp).toBe(19); // 29 − 10

    const low = { ...s1, player: { ...s1.player, hp: 3 } };
    const s2 = playRound(low, 'rest', seq(0.1, 0.01, 0.01), gameData);
    expect(s2.player.hp).toBe(1);
  });

  it('acontece só uma vez por luta', () => {
    const p = { ...createPlayer(jin, gameData), hp: 33 };
    const s1 = playRound(startBattle(p, testVillain()), 'rest', seq(0.9, 0.5, 0.5, 0.1), gameData);
    const s2 = playRound({ ...s1, player: { ...s1.player, hp: 10 } }, 'rest', seq(0.9, 0.5, 0.5, 0.1), gameData);
    expect(ofType(s2.log, 'surge')).toHaveLength(1);
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
