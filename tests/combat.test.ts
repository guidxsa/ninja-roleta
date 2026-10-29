import { describe, expect, it } from 'vitest';
import {
  availableActions,
  canFreeActive,
  effectiveOffense,
  expectedMentalTurns,
  gatesToOpen,
  mentalEscapeChance,
  mentalStrength,
  playerGenjutsuHitChance,
  playerMentalStrength,
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
import { battle, hold, seq, testVillain, withInitiative } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
/** Comum que usa genjutsu (para testar o aprisionamento sem depender do Uchiha). */
const withGenjutsu = () => {
  const p = createPlayer(common, gameData);
  return { ...p, techniques: [...p.techniques, 'basicGenjutsu'] };
};
const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);
const ofRound = (prev: BattleState, next: BattleState) => next.log.slice(prev.log.length);

describe('rodada básica', () => {
  it('emboscada: jogador age primeiro e pode vencer na hora', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 5 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(s1.status).toBe('won');
    expect(s1.player.chakra).toBe(30); // taijutsu não gasta chakra
    expect(ofType(s1.log, 'ambush')).toHaveLength(1);
    // 8 + 10 − 10 × 0,7 (o vilão resiste) = 11
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'hit', damage: 11 });
  });

  it('é pura: não altera o estado anterior', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    const snapshot = structuredClone(s0);
    playRound(s0, 'tech:basicTaijutsu', createRng(1), gameData);
    expect(s0).toEqual(snapshot);
  });

  it('ninjutsu básico usa a afinidade; o elemento do vilão não dá vantagem por si só', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ element: 'wind' }), {
      playerStartsFirst: true,
    });
    const s1 = playRound(s0, 'tech:fireSpark', seq(0.5), gameData);
    // Fagulha do Dragão: 12 + 10 − 7 = 15, neutro (não há encontro de elementos)
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ elementMult: 1, damage: 15 });
    expect(s1.player.chakra).toBe(28);
  });

  it('contra um estado elemental no corpo (Armadura de Areia), o encontro de elementos conta', () => {
    const lightning = createPlayer({ lineageId: null, affinity: 'lightning', jinchuuriki: false }, gameData);
    const s0 = startBattle(lightning, testVillain({ elementalState: 'earth', hp: 200 }), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:spark', seq(0.5), gameData);
    // Faísca contra terra sólida: raio perfura (×2). (13 + 10 − 7 × 0,9) × 2 = 33
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ elementMult: 2, damage: 33 });
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
    const s0 = battle(p, testVillain());
    expect(availableActions(s0, gameData)).toEqual(['tech:basicTaijutsu', 'rest', 'stance']);
    expect(() => playRound(s0, 'tech:empoweredTaijutsu', seq(0.5), gameData)).toThrow();
    expect(() => playRound(s0, 'tech:fireSpark', seq(0.5), gameData)).toThrow();
    const s1 = playRound(s0, 'rest', seq(0.1, 0.01, 0.01), gameData);
    expect(s1.player.chakra).toBe(Math.floor(p.maxChakra * 0.15));
  });

  it('concentrar chakra recupera 15% do chakra máximo, sem passar do máximo', () => {
    const p = { ...createPlayer(common, gameData), maxChakra: 60, chakra: 0 };
    expect(playRound(battle(p, testVillain()), 'rest', seq(0.5), gameData).player.chakra).toBe(9);
    const full = playRound(battle({ ...p, chakra: 55 }, testVillain()), 'rest', seq(0.5), gameData);
    expect(full.player.chakra).toBe(60);
  });
});

describe('Vontade do Fogo', () => {
  // iniciativa 0.9 → vilão primeiro; técnica; acerto. Dano do vilão: 10 + 0 − 10 × 0,7 = 3.
  const villainFirstHit = () => seq(0.9, 0.5, 0.5);

  it('ao chegar a 0 de HP consome o item e restaura HP e chakra', () => {
    const p = { ...createPlayer(common, gameData), hp: 1, chakra: 2 };
    const s1 = playRound(battle(p, testVillain()), 'tech:basicTaijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('ongoing');
    expect(s1.player.revives).toBe(0);
    expect(s1.player.revivesUsed).toBe(1);
    expect(s1.player.hp).toBe(100);
    expect(s1.player.chakra).toBe(30); // restaurado; taijutsu não gasta
    expect(ofType(s1.log, 'revive')).toHaveLength(1);
  });

  it('sem item: derrota', () => {
    const p = { ...createPlayer(common, gameData), hp: 1, revives: 0 };
    const s1 = playRound(battle(p, testVillain()), 'tech:basicTaijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('lost');
    expect(ofType(s1.log, 'attack')).toHaveLength(1); // o jogador não chega a agir
  });

  it('exame: não consome o item, só perde a luta', () => {
    const p = { ...createPlayer(common, gameData), hp: 1 };
    const s0 = battle(p, testVillain(), { allowRevive: false });
    const s1 = playRound(s0, 'tech:basicTaijutsu', villainFirstHit(), gameData);
    expect(s1.status).toBe('lost');
    expect(s1.player.revives).toBe(1);
  });
});

describe('debilitado', () => {
  it('genjutsu que acerta tira a 1ª ação com certeza; depois o alvo gira para se livrar e fica imune por uma ação', () => {
    const s0 = withInitiative(startBattle(withGenjutsu(), testVillain()));
    // Acerta (0.5) e, depois da vez perdida, a fuga falha (0.99).
    const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5, 0.99), gameData);
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'villain', kind: 'prison', escape: expect.any(Number) }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'prison' }]);
    expect(s1.villain.fx).toMatchObject({ debilitated: { served: 1 }, debilitateImmunity: 0 });
    // Perde a 2ª vez e se livra (0.0).
    const s2 = playRound(s1, 'rest', seq(0.0), gameData);
    expect(ofType(ofRound(s1, s2), 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'prison' }]);
    expect(ofType(ofRound(s1, s2), 'mentalBroken')).toEqual([{ type: 'mentalBroken', side: 'villain', effect: 'prison' }]);
    expect(s2.villain.fx).toMatchObject({ debilitated: null, debilitateImmunity: 1 });

    // Rodada 3: genjutsu acerta mas o vilão resiste; o vilão age e perde a imunidade.
    const s3 = playRound(s2, 'tech:basicGenjutsu', seq(0.9), gameData);
    expect(ofType(s3.log.slice(s2.log.length), 'debilitateResisted')).toHaveLength(1);
    expect(s3.villain.fx.debilitateImmunity).toBe(0);
    expect(ofType(s3.log.slice(s2.log.length), 'attack').filter((a) => a.side === 'villain')).toHaveLength(1);
  });

  it('tenacidade: controle pego dificulta o próximo e volta ao normal aos poucos', () => {
    const s0 = withInitiative(startBattle(withGenjutsu(), testVillain({ hp: 500 })));
    const base = playerGenjutsuHitChance(s0, gameData, 'basicGenjutsu');
    const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.9), gameData);
    // Pegou (+50%); controlado, ainda não cai.
    expect(s1.villain.fx.tenacity).toBeCloseTo(0.5);
    // Na rodada seguinte o alvo se livra (0.0) e a tenacidade cai 15%.
    const s2 = playRound(s1, 'rest', seq(0.0), gameData);
    expect(s2.villain.fx.tenacity).toBeCloseTo(0.35);
    expect(playerGenjutsuHitChance(s2, gameData, 'basicGenjutsu')).toBeCloseTo(base * 0.65);
    let s = s2;
    for (let i = 0; i < 3; i++) s = playRound(s, 'rest', seq(0.5), gameData);
    expect(s.villain.fx.tenacity).toBe(0);
    expect(playerGenjutsuHitChance(s, gameData, 'basicGenjutsu')).toBeCloseTo(base);
  });

  it('tenacidade: renovar um controle que ainda vale não soma de novo', () => {
    const s0 = withInitiative(startBattle(withGenjutsu(), testVillain({ hp: 500 })));
    const jailed = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, debilitated: hold(), tenacity: 0.5 } } };
    const s1 = playRound(jailed, 'tech:basicGenjutsu', seq(0.99), gameData);
    expect(ofType(s1.log, 'debilitate')).toHaveLength(1);
    expect(s1.villain.fx.tenacity).toBe(0.5);
  });

  it('tenacidade também vale para a paralisia do crítico de raio', () => {
    const lightning: Origin = { lineageId: null, affinity: 'lightning', jinchuuriki: false };
    const s0 = withInitiative(startBattle(createPlayer(lightning, gameData), testVillain({ hp: 200 })));
    const tough = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, tenacity: 0.9 } } };
    // Crítico (0.99), e a tenacidade rola 0.5, acima dos 10% que sobram: resiste.
    const s1 = playRound(tough, 'tech:spark', seq(0.99, 0.5), gameData);
    expect(ofType(s1.log, 'debilitateResisted')).toHaveLength(1);
    expect(ofType(s1.log, 'debilitate')).toHaveLength(0);
  });

  it('jogador debilitado perde a ação', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain());
    const s1 = playRound({ ...s0, playerFx: { ...s0.playerFx, debilitated: hold() } }, 'tech:basicTaijutsu', seq(0.9, 0.5, 0.5), gameData);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'player', reason: 'prison' }]);
    expect(s1.player.chakra).toBe(30);
  });
});

describe('passivas', () => {
  const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };

  it('Portões: abrir é grátis (não gasta o turno), custa chakra e HP; taijutsu ×1,3 por 3 rodadas contando a da abertura', () => {
    const p = createPlayer(prodigy, gameData);
    const s0 = withInitiative(startBattle(p, testVillain({ hp: 200 })));
    expect(availableActions(s0, gameData)).toEqual(['tech:basicTaijutsu', 'rest', 'stance']);
    expect(canFreeActive(s0, 'gates', 'tech:basicTaijutsu', gameData)).toBe(true);
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData, { gates: true });
    // 20% de 110 = 22 de HP; 1º portão custa 5 de chakra.
    expect(ofType(s1.log, 'gates')).toEqual([{ type: 'gates', stage: 1, hpLost: 22, chakra: 5 }]);
    // O golpe da mesma rodada já sai com o portão: (8 + 17 − 7) × 1,3 = 23
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', damage: 23 });
    expect(s1.player.chakra).toBe(23);
    expect(s1.playerFx.gatesTurns).toBe(2);
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'attack')[0]).toMatchObject({ side: 'player', damage: 23 });
    expect(s2.playerFx.gatesTurns).toBe(1);
    expect(canFreeActive(s2, 'gates', 'tech:basicTaijutsu', gameData)).toBe(false);
  });

  it('Portões evoluem com o taijutsu: portão maior, mais forte e mais caro', () => {
    const p = createPlayer(prodigy, gameData);
    expect(gatesToOpen(p, gameData)).toMatchObject({ stage: 1, taijutsuMult: 1.3, chakraCost: 5 });
    const strong = { ...p, offense: { ...p.offense, taijutsu: 22 } };
    expect(gatesToOpen(strong, gameData)).toMatchObject({ stage: 2, taijutsuMult: 1.5, chakraCost: 7, hpCostPct: 0.25 });
    expect(gatesToOpen({ ...p, offense: { ...p.offense, taijutsu: 25 } }, gameData)).toMatchObject({ stage: 3, taijutsuMult: 1.7 });
    // Sem chakra para o portão, não abre.
    expect(canFreeActive(battle({ ...strong, chakra: 6 }, testVillain()), 'gates', 'rest', gameData)).toBe(false);
    expect(gatesToOpen(createPlayer(common, gameData), gameData)).toBeNull();
  });

  it('Portões nunca deixam o HP abaixo de 1', () => {
    const p = { ...createPlayer(prodigy, gameData), hp: 5 };
    const s1 = playRound(withInitiative(battle(p, testVillain())), 'rest', seq(0.01), gameData, { gates: true });
    expect(ofType(s1.log, 'gates')).toEqual([{ type: 'gates', stage: 1, hpLost: 4, chakra: 5 }]);
  });

  it('Vitalidade Uzumaki: recupera chakra e HP no início da rodada', () => {
    const p = { ...createPlayer({ lineageId: 'uzumaki', affinity: 'wind', jinchuuriki: false }, gameData), hp: 50, chakra: 5 };
    const s1 = playRound(battle(p, testVillain(), { playerStartsFirst: true }), 'rest', seq(0.01), gameData);
    // 2% de 105 = 2
    expect(ofType(s1.log, 'regen')).toEqual([{ type: 'regen', hp: 2, chakra: 1 }]);
  });


  it('Punho preciso: taijutsu ignora 30% da resistência física do vilão', () => {
    const p = createPlayer({ lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false }, gameData);
    const s1 = playRound(startBattle(p, testVillain(), { playerStartsFirst: true }), 'tech:basicTaijutsu', seq(0.5), gameData);
    // 8 + 16 − 10 × 0,7 × 0,7 = 19
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ damage: 19 });
  });
});

describe('jinchuuriki: manto de chakra e demônio interno', () => {
  const jin: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: true };

  it('abaixo de 50% de HP: status ×1,5 e regenera 5% por rodada, sem recoil', () => {
    const p = { ...createPlayer(jin, gameData), hp: 52 };
    const s0 = withInitiative(battle(p, testVillain({ hp: 200 })), 'villain');
    // O vilão acerta 10 − 7 = 3: 49 de HP (< 50), o manto desperta antes do golpe do jogador.
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'cloak')).toEqual([{ type: 'cloak', side: 'player' }]);
    expect(effectiveOffense(s1, 'taijutsu', gameData)).toBe(15);
    // 8 + 15 − 7 = 16
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'player')).toMatchObject({ damage: 16 });
    expect(s1.player.hp).toBe(49);
    const s2 = playRound(s1, 'rest', seq(0.5, 0.01), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'cloakRegen')).toEqual([{ type: 'cloakRegen', side: 'player', hp: 5 }]);
  });

  it('o manto paga 10% do chakra máximo por rodada, a partir da seguinte à ativação', () => {
    // Chakra máximo 60 (30 × 2): 6 por rodada.
    const p = { ...createPlayer(jin, gameData), hp: 40 };
    const s1 = playRound(withInitiative(battle(p, testVillain({ hp: 500 }))), 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s1.log, 'cloakCost')).toHaveLength(0);
    const s2 = playRound(s1, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s2.log, 'cloakCost')).toEqual([{ type: 'cloakCost', side: 'player', chakra: 6 }]);
    expect(s2.player.chakra).toBe(54);
  });

  it('sem chakra para pagar a rodada, o manto se desfaz', () => {
    const p = { ...createPlayer(jin, gameData), hp: 40 };
    const s0 = withInitiative(battle(p, testVillain({ hp: 500 })));
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    const broke = { ...s1, player: { ...s1.player, chakra: 5 } };
    const s2 = playRound(broke, 'tech:basicTaijutsu', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s2.log, 'cloakFade')).toEqual([{ type: 'cloakFade', side: 'player' }]);
    expect(s2.playerFx.cloakTurns).toBe(0);
  });

  it('desperta também quem já começa a luta abaixo de 50%; dura 5 rodadas e só uma vez por luta', () => {
    const p = { ...createPlayer(jin, gameData), hp: 40 };
    let s = withInitiative(battle(p, testVillain({ hp: 500 })));
    s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(s.playerFx.cloakTurns).toBe(4);
    for (let i = 0; i < 4; i++) s = playRound(s, 'rest', seq(0.5, 0.01), gameData);
    expect(s.playerFx.cloakTurns).toBe(0);
    s = playRound({ ...s, player: { ...s.player, hp: 10 } }, 'rest', seq(0.5, 0.01), gameData);
    expect(ofType(s.log, 'cloak')).toHaveLength(1);
  });

  it('demônio interno: imune a genjutsu', () => {
    const v = testVillain({
      offense: { taijutsu: 0, ninjutsu: 0, genjutsu: 26 },
      techniques: [{ id: 'illusion', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, mentalStrength: 1 }],
    });
    const s1 = playRound(withInitiative(startBattle(createPlayer(jin, gameData), v), 'villain'), 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'genjutsuImmune')).toEqual([{ type: 'genjutsuImmune', target: 'player' }]);
    expect(s1.playerFx.debilitated).toBeNull();
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
    const s0 = withInitiative(startBattle(createPlayer(lightning, gameData), testVillain({ hp: 200 })));
    const s1 = playRound(s0, 'tech:spark', seq(0.99), gameData);
    // 1 turno de paralisia + 1 de todo controle
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'villain', turns: 2, kind: 'paralysis' }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'paralysis' }]);
  });

  it('atordoamento: crítico de água (ou vento, terra) tira 20 de acerto das próximas 2 ações do alvo', () => {
    const s0 = withInitiative(startBattle(createPlayer(water, gameData), testVillain()));
    const s1 = playRound(s0, 'tech:waterBullet', seq(0.99, 0.5, 0.5), gameData);
    expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'villain', kind: 'stun', turns: 2 }]);
    expect(ofType(s1.log, 'attack').find((a) => a.side === 'villain')!.hitChance).toBeCloseTo(0.65);
    expect(s1.villain.fx.stunned).toBe(1);
  });

  it('acerto comum não causa efeito elemental', () => {
    const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ element: 'lightning', hp: 500 })));
    const s1 = playRound(s0, 'tech:fireSpark', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s1.log, 'status')).toHaveLength(0);
  });

  describe('queimadura', () => {
    // Jogador de fogo contra vilão de raio (neutro), 500 de HP: 2% = 10.
    const burning = () => {
      const s0 = withInitiative(startBattle(createPlayer(common, gameData), testVillain({ element: 'lightning', hp: 500 })));
      return playRound(s0, 'tech:fireSpark', seq(0.99, 0.5, 0.01), gameData);
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
      const s2 = playRound(s1, 'tech:fireSpark', seq(0.5, 0.5, 0.01), gameData);
      expect(ofType(s2.log.slice(s1.log.length), 'burnExtend')).toEqual([{ type: 'burnExtend', target: 'villain', turns: 2 }]);
      expect(s2.villain.fx.burn).toBe(1);
    });

    it('depois de apagar, a contagem recomeça e um acerto de fogo comum reacende', () => {
      const s2 = playRound(burning(), 'rest', seq(0.5, 0.01), gameData);
      const s3 = playRound(s2, 'tech:fireSpark', seq(0.5, 0.5, 0.01), gameData);
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
    // crítico: (20 − 7) × 2 = 26
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'villain', outcome: 'crit', damage: 26 });
    expect(ofType(s1.log, 'status')).toEqual([{ type: 'status', target: 'player', kind: 'bleed', turns: 0 }]);
    const s2 = playRound(s1, 'rest', seq(0.5, 0.5), gameData);
    // (20 − 7) × 1,5 = 19
    expect(ofType(s2.log.slice(s1.log.length), 'attack')[0]).toMatchObject({ damage: 19 });
    expect(s2.playerFx.bleeding).toBe(true);
  });

  it('a Vontade do Fogo limpa os efeitos negativos', () => {
    const s0 = withInitiative(battle({ ...createPlayer(common, gameData), hp: 1 }, testVillain()), 'villain');
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

  it('sem chakra para nenhuma técnica, concentra chakra no lugar de atacar (15% do máximo, como o jogador)', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ ...caster(), chakra: 20 }));
    const s1 = playRound({ ...s0, villain: { ...s0.villain, chakra: 1 } }, 'rest', seq(0.9, 0.01, 0.01), gameData);
    expect(ofType(s1.log, 'villainRest')).toEqual([{ type: 'villainRest', chakra: 3 }]);
    expect(s1.villain.chakra).toBe(4);
    expect(ofType(s1.log, 'attack').filter((a) => a.side === 'villain')).toHaveLength(0);
  });

  it('concentrar chakra do vilão recupera no mínimo 1', () => {
    const s0 = startBattle(createPlayer(common, gameData), caster());
    const s1 = playRound({ ...s0, villain: { ...s0.villain, chakra: 1 } }, 'rest', seq(0.9, 0.01, 0.01), gameData);
    expect(ofType(s1.log, 'villainRest')).toEqual([{ type: 'villainRest', chakra: 1 }]);
    expect(s1.villain.chakra).toBe(2);
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
  const escape = (s: ReturnType<typeof playRound>) => ofType(s.log, 'debilitate')[0]?.escape;
  const cfg = gameData.balance.mentalHold;

  it('não causa dano: o vilão só perde a vez', () => {
    const s0 = startBattle(withGen(10), testVillain(), { playerStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData);
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'hit', damage: 0 });
    expect(s1.villain.hp).toBe(50);
  });

  it('a força cresce com a vantagem do genjutsu sobre a resistência mental usada pelo alvo e baixa a fuga, sem teto', () => {
    // O vilão resiste: usa 70% da resistência mental (10 → 7). Força = 1 + vantagem / 8.
    const first = (gen: number, villainMental = 10) =>
      escape(playRound(startBattle(withGen(gen), testVillain({ resistance: { physical: 10, mental: villainMental } }), { playerStartsFirst: true }), 'tech:basicGenjutsu', seq(0.5), gameData));
    const expected = (advantage: number) => Math.max(cfg.escapeMin, cfg.escapeBase - cfg.escapePerStrength * (advantage / 8));
    expect(first(10)).toBeCloseTo(expected(3));
    expect(first(15)).toBeCloseTo(expected(8));
    expect(first(23)).toBeCloseTo(expected(16));
    expect(first(60)).toBeCloseTo(cfg.escapeMin); // piso da fuga
    expect(first(23, 30)).toBeCloseTo(expected(2)); // alvo resistente: 30 × 0,7 = 21
    expect(mentalStrength(23, 7, 1, 'prison', gameData)).toBe(3);
    expect(mentalStrength(60, 7, 1, 'prison', gameData)).toBeCloseTo(1 + 53 / 8);
  });

  it('técnica e upgrade de genjutsu aumentam a força do aprisionamento', () => {
    const crow = learnTechnique(withGen(10), 'crowIllusion', gameData); // 10 + 6 = 16 → vantagem 9
    const strength = (p: ReturnType<typeof withGen>, id: string) => playerMentalStrength(startBattle(p, testVillain()), id, gameData);
    expect(strength(crow, 'crowIllusion')).toBeCloseTo(1 + 9 / 8);
    expect(strength(withGen(12), 'basicGenjutsu')).toBeCloseTo(1 + 5 / 8);
    const upgraded = { ...withGen(12), techniqueLevels: { basicGenjutsu: 1 } }; // 12 + 3 = 15 → vantagem 8
    expect(strength(upgraded, 'basicGenjutsu')).toBeCloseTo(2);
    expect(escape(playRound(startBattle(upgraded, testVillain(), { playerStartsFirst: true }), 'tech:basicGenjutsu', seq(0.5), gameData))).toBeCloseTo(
      mentalEscapeChance(2, 1, gameData),
    );
  });

  it('fuga: a 1ª chance cai com a força e cresce com o quadrado dos turnos, mais devagar quanto mais forte, até 100%', () => {
    const e = (strength: number, served: number) => mentalEscapeChance(strength, served, gameData);
    expect(e(1, 1)).toBeCloseTo(cfg.escapeBase);
    expect(e(2, 1)).toBeCloseTo(cfg.escapeBase - cfg.escapePerStrength);
    expect(e(1, 2) - e(1, 1)).toBeCloseTo(cfg.escapeGrowth);
    expect(e(1, 3) - e(1, 1)).toBeCloseTo(4 * cfg.escapeGrowth);
    expect(e(2, 3) - e(2, 1)).toBeCloseTo((4 * cfg.escapeGrowth) / 2);
    // Sempre chega a 100%, mesmo com força muito alta.
    expect(e(10, 50)).toBe(1);
    expect(expectedMentalTurns(2, gameData)).toBeGreaterThan(expectedMentalTurns(1, gameData));
    expect(expectedMentalTurns(1, gameData)).toBeGreaterThan(1);
  });

  it('sem teto de turnos: um controle forte que não gira a fuga segue valendo', () => {
    const s0 = withInitiative(startBattle(withGen(10), testVillain({ hp: 500 })));
    let s: BattleState = { ...s0, villain: { ...s0.villain, fx: { ...s0.villain.fx, debilitated: hold(3) } } };
    for (let i = 0; i < 5; i++) s = playRound(s, 'rest', seq(0.99), gameData);
    expect(ofType(s.log, 'skip')).toHaveLength(5);
    expect(s.villain.fx.debilitated).toEqual({ strength: 3, served: 5 });
    // Renovar fica com a força maior e recomeça a contagem.
    const s1 = playRound(s, 'tech:basicGenjutsu', seq(0.5, 0.99), gameData);
    expect(s1.villain.fx.debilitated).toEqual({ strength: 3, served: 1 });
  });

  it('não gasta o foco', () => {
    const s0 = withInitiative(startBattle({ ...withGen(10), focusUses: 1 }, testVillain()));
    const s1 = playRound(s0, 'tech:basicGenjutsu', seq(0.5), gameData, true);
    expect(s1.playerFx.focusArmed).toBe(true);
  });

  it('o genjutsu do vilão também não causa dano e aprisiona o jogador conforme o genjutsu dele', () => {
    // Genjutsu 26 contra a resistência mental do jogador resistindo (10 × 0,7 = 7): vantagem 19 → força 3,375, fuga no piso.
    const v = testVillain({
      offense: { taijutsu: 0, ninjutsu: 0, genjutsu: 26 },
      techniques: [{ id: 'illusion', type: 'genjutsu', baseDamage: 0, chakraCost: 4, weight: 1, mentalStrength: 1 }],
    });
    const s0 = startBattle(withGen(10), v, { villainStartsFirst: true });
    const s1 = playRound(s0, 'tech:basicTaijutsu', seq(0.5), gameData);
    expect(s1.player.hp).toBe(s0.player.hp);
    expect(ofType(s1.log, 'debilitate')).toEqual([{ type: 'debilitate', target: 'player', kind: 'prison', escape: cfg.escapeMin }]);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'player', reason: 'prison' }]);
  });
});
