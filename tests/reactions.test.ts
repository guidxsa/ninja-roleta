import { describe, expect, it } from 'vitest';
import {
  availableActions,
  effectiveOffense,
  playerReactionOptions,
  playRound,
  reactionPreview,
  resumeRound,
  startBattle,
  type BattleEvent,
  type BattleState,
  type ReactionChoice,
} from '../src/core/combat';
import { createPlayer, learnTechnique, type PlayerState } from '../src/core/player';
import type { Origin, VillainTechnique } from '../src/core/types';
import { gameData } from '../src/data/index';
import { seq, testVillain, withInitiative } from './helpers';

const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);
const origin = (affinity: Origin['affinity'], lineageId: string | null = null): Origin => ({ lineageId, affinity, jinchuuriki: false });
const player = (affinity: Origin['affinity'] = 'water') => createPlayer(origin(affinity), gameData);
const always = (choice: ReactionChoice) => () => choice;

/** Vilão de fogo com uma técnica grande de fogo e ninjutsu 10. */
const blaze: VillainTechnique = { id: 'blaze', type: 'ninjutsu', baseDamage: 34, chakraCost: 10, weight: 1 };
const fireVillain = (extra: object = {}) =>
  testVillain({ element: 'fire', hp: 200, chakra: 40, offense: { taijutsu: 0, ninjutsu: 10, genjutsu: 0 }, techniques: [blaze], ...extra });

/** Vilão primeiro, jogador concentra chakra e reage com `choice`. */
function villainAttacks(p: PlayerState, villain = fireVillain(), choice: ReactionChoice, rng: number[]): BattleState {
  return playRound(withInitiative(startBattle(p, villain), 'villain'), 'rest', seq(...rng), gameData, {}, always(choice));
}

describe('disputa de ninjutsu', () => {
  it('uma água básica com vantagem não anula um fogo grande: só a vantagem multiplica', () => {
    const s0 = withInitiative(startBattle(player('water'), fireVillain()), 'villain');
    const incoming = { attacker: 'villain' as const, techniqueId: 'blaze', type: 'ninjutsu' as const, element: 'fire' as const, hits: 1, charged: false };
    const prev = reactionPreview(s0, incoming, 'clash:waterBullet', gameData);
    // Fogo: 34 + 10 × 0,5 = 39. Água: (11 + 5) × 1,5 = 24. Roleta 39² | 0,5 × 39 × 24 | 24².
    expect(prev).toMatchObject({ kind: 'clash', attackPower: 39, defensePower: 24 });
    if (prev.kind !== 'clash') throw new Error();
    expect(prev.odds[0]).toBeCloseTo(0.593, 3); // fogo vence
    expect(prev.odds[1]).toBeCloseTo(0.182, 3); // anulam
    expect(prev.odds[2]).toBeCloseTo(0.225, 3); // água vence
  });

  it('defensor vence: o jutsu dele contra-ataca com parte do dano, contra a resistência passiva', () => {
    // técnica do vilão (0.5), disputa (0.99 → defensor)
    const s1 = villainAttacks(player('water'), fireVillain(), 'clash:waterBullet', [0.5, 0.99]);
    expect(ofType(s1.log, 'clash')[0]).toMatchObject({ result: 'defender', crushed: false });
    // (11 + 10 − 10 × 0,4) × max(25%, 1 − 39/24) = 17 × 0,25 = 4
    expect(ofType(s1.log, 'clashHit')).toEqual([{ type: 'clashHit', target: 'villain', techniqueId: 'waterBullet', damage: 4, passPct: 0.25 }]);
    expect(s1.villain.hp).toBe(196);
    expect(s1.player.hp).toBe(100);
    // A disputa custa o chakra da técnica e a próxima ação (o vilão agiu antes: perde esta).
    expect(s1.player.chakra).toBe(28);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'player', reason: 'reacted' }]);
  });

  it('anulam: ninguém leva dano, os dois gastaram o chakra', () => {
    const s1 = villainAttacks(player('water'), fireVillain(), 'clash:waterBullet', [0.5, 0.7]);
    expect(ofType(s1.log, 'clash')[0]!.result).toBe('cancel');
    expect([s1.player.hp, s1.villain.hp, s1.player.chakra, s1.villain.chakra]).toEqual([100, 200, 28, 30]);
  });

  it('atacante vence: passa só a parte do dano que sobra', () => {
    const s1 = villainAttacks(player('water'), fireVillain(), 'clash:waterBullet', [0.5, 0.1]);
    // (34 + 10 − 10 × 0,4) × (1 − 24/39) = 40 × 0,385 = 15
    expect(ofType(s1.log, 'clashHit')[0]).toMatchObject({ target: 'player', damage: 15 });
    expect(s1.player.hp).toBe(85);
  });

  it('esmagadora: com o dobro do poder, o dano passa inteiro', () => {
    const tiny: VillainTechnique = { id: 'spit', type: 'ninjutsu', baseDamage: 2, chakraCost: 1, weight: 1 };
    const p = learnTechnique(player('fire'), 'rasengan', gameData);
    const s1 = villainAttacks(p, fireVillain({ techniques: [tiny] }), 'clash:rasengan', [0.5, 0.99]);
    expect(ofType(s1.log, 'clash')[0]).toMatchObject({ result: 'defender', crushed: true });
    // Rasengan: (26 + 10 − 4) × 1 = 32
    expect(ofType(s1.log, 'clashHit')[0]).toMatchObject({ damage: 32, passPct: 1 });
  });

  it('Rasengan tem +25% de poder na disputa', () => {
    const p = learnTechnique(player('fire'), 'rasengan', gameData);
    const s0 = withInitiative(startBattle(p, fireVillain()), 'villain');
    const incoming = { attacker: 'villain' as const, techniqueId: 'blaze', type: 'ninjutsu' as const, element: 'fire' as const, hits: 1, charged: false };
    // (26 + 5) × 1,25 = 38,75
    expect(reactionPreview(s0, incoming, 'clash:rasengan', gameData)).toMatchObject({ defensePower: 38.75 });
  });

  it('fogo que vence vento absorve o vento: +25% de dano', () => {
    const gust: VillainTechnique = { id: 'gust', type: 'ninjutsu', baseDamage: 10, chakraCost: 2, weight: 1 };
    const s1 = villainAttacks(player('fire'), fireVillain({ element: 'wind', techniques: [gust] }), 'clash:fireSpark', [0.5, 0.99]);
    // Vento 10 + 5 = 15; fogo (12 + 5) × 1,5 = 25,5. (12 + 10 − 4) × (1 − 15/25,5) × 1,25 = 9
    expect(ofType(s1.log, 'clashHit')[0]).toMatchObject({ target: 'villain', damage: 9 });
  });

  it('água que não perde para fogo apaga a queimadura de quem a usou', () => {
    const s0 = withInitiative(startBattle(player('water'), fireVillain()), 'villain');
    const burning = { ...s0, playerFx: { ...s0.playerFx, burn: 2, burnTicks: 1 } };
    const s1 = playRound(burning, 'rest', seq(0.5, 0.7), gameData, {}, always('clash:waterBullet'));
    expect(ofType(s1.log, 'extinguish')).toEqual([{ type: 'extinguish', side: 'player' }]);
    expect(s1.playerFx.burn).toBe(0);
  });

  it('o vilão também disputa: gasta a ação dele', () => {
    const v = testVillain({
      hp: 200,
      offense: { taijutsu: 0, ninjutsu: 10, genjutsu: 0 },
      reactions: { resist: 0, clash: 1 },
      techniques: [{ id: 'blast', type: 'ninjutsu', baseDamage: 20, chakraCost: 5, weight: 1 }],
    });
    // jogador primeiro; reação do vilão (0.5), disputa (0.7 → anulam)
    const s1 = playRound(withInitiative(startBattle(player('fire'), v)), 'tech:fireSpark', seq(0.5, 0.7), gameData);
    expect(ofType(s1.log, 'reaction')[0]).toMatchObject({ side: 'villain', kind: 'clash', techniqueId: 'blast', chakra: 5 });
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain', reason: 'reacted' }]);
    expect(s1.villain.chakra).toBe(15);
  });
});

describe('barreiras e quebra de guarda', () => {
  const earthWall: VillainTechnique = { id: 'earthWall', type: 'ninjutsu', baseDamage: 0, chakraCost: 5, weight: 1, barrier: 28, element: 'earth' };
  const walled = () => testVillain({ hp: 200, element: 'earth', reactions: { resist: 0, barrier: 1 }, techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: 10, chakraCost: 0, weight: 1 }, earthWall] });

  it('raio perfura a barreira de terra: ×2 no poder', () => {
    const s1 = playRound(withInitiative(startBattle(player('lightning'), walled())), 'tech:spark', seq(0.5, 0.0), gameData);
    // Faísca: (13 + 5) × 2 = 36 contra a barreira 28
    expect(ofType(s1.log, 'clash')[0]).toMatchObject({ attackPower: 36, defensePower: 28, result: 'attacker' });
    const fire = playRound(withInitiative(startBattle(player('fire'), walled())), 'tech:fireSpark', seq(0.5, 0.0), gameData);
    expect(ofType(fire.log, 'clash')[0]).toMatchObject({ attackPower: 17, defensePower: 28 });
  });

  it('barreira que vence só bloqueia', () => {
    const s1 = playRound(withInitiative(startBattle(player('fire'), walled())), 'tech:fireSpark', seq(0.5, 0.99), gameData);
    expect(ofType(s1.log, 'barrierHold')).toEqual([{ type: 'barrierHold', side: 'villain', techniqueId: 'earthWall', reflected: 0 }]);
    expect(s1.villain.hp).toBe(200);
  });

  it('taijutsu rola a quebra de guarda: quebrou, o golpe passa contra a resistência passiva', () => {
    const s0 = withInitiative(startBattle(player('fire'), walled()));
    // (8 + 10 × 0,5)² contra 28²: 18%
    const held = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.99), gameData);
    expect(ofType(held.log, 'guardBreak')[0]).toMatchObject({ broken: false });
    expect(ofType(held.log, 'guardBreak')[0]!.breakChance).toBeCloseTo(169 / (169 + 784));
    expect(held.villain.hp).toBe(200);
    const broke = playRound(s0, 'tech:basicTaijutsu', seq(0.5, 0.0, 0.5), gameData);
    expect(ofType(broke.log, 'guardBreak')[0]).toMatchObject({ broken: true });
    // 8 + 10 − 10 × 0,4 = 14
    expect(ofType(broke.log, 'attack')[0]).toMatchObject({ side: 'player', damage: 14 });
  });

  it('o prodígio quebra guarda com mais facilidade (taijutsu alto)', () => {
    const lee = createPlayer(origin(null, 'taijutsuProdigy'), gameData);
    const s1 = playRound(withInitiative(startBattle(lee, walled())), 'tech:basicTaijutsu', seq(0.5, 0.99), gameData);
    // (8 + 22 × 0,5)² = 361 contra 784
    expect(ofType(s1.log, 'guardBreak')[0]!.breakChance).toBeCloseTo(361 / (361 + 784));
  });
});

describe('Substituição', () => {
  it('roleta pela speed: 50% com speeds iguais; sucesso esquiva de tudo', () => {
    const s1 = villainAttacks(player(), fireVillain(), 'substitution', [0.5, 0.4]);
    expect(ofType(s1.log, 'substitutionRoll')).toEqual([{ type: 'substitutionRoll', side: 'player', chance: 0.5, success: true }]);
    expect(s1.player.hp).toBe(100);
    expect(s1.player.chakra).toBe(28);
    expect(s1.playerFx.substitutionsUsed).toBe(1);
  });

  it('falhou: recebe o golpe com a resistência passiva', () => {
    const s1 = villainAttacks(player(), fireVillain(), 'substitution', [0.5, 0.6, 0.5]);
    expect(ofType(s1.log, 'substitutionRoll')[0]!.success).toBe(false);
    // 34 + 10 − 10 × 0,4 = 40
    expect(s1.player.hp).toBe(60);
  });

  it('+3% por ponto de speed a favor, entre 25% e 85%; 2 usos por luta', () => {
    const s0 = withInitiative(startBattle({ ...player(), speed: 20 }, fireVillain()), 'villain');
    const incoming = { attacker: 'villain' as const, techniqueId: 'blaze', type: 'ninjutsu' as const, element: 'fire' as const, hits: 1, charged: false };
    expect(reactionPreview(s0, incoming, 'substitution', gameData)).toEqual({ kind: 'substitution', chance: 0.8, usesLeft: 2 });
    const fast = withInitiative(startBattle({ ...player(), speed: 40 }, fireVillain()), 'villain');
    expect(reactionPreview(fast, incoming, 'substitution', gameData)).toMatchObject({ chance: 0.85 });
    const used = { ...s0, playerFx: { ...s0.playerFx, substitutionsUsed: 2 } };
    expect(playerReactionOptions(used, incoming, gameData)).not.toContain('substitution');
    // Mestre da Substituição: +1 uso.
    expect(playerReactionOptions({ ...used, player: { ...used.player, substitutionBonus: 1 } }, incoming, gameData)).toContain('substitution');
  });
});

describe('economia das reações', () => {
  it('Resistir é grátis e não gasta o turno', () => {
    const s1 = villainAttacks(player(), fireVillain(), 'resist', [0.5, 0.5]);
    // 34 + 10 − 7 = 37
    expect(s1.player.hp).toBe(63);
    expect(ofType(s1.log, 'rest')).toHaveLength(1);
  });

  it('reagir depois de agir gasta a ação da rodada seguinte: só sobra passar a vez', () => {
    // jogador primeiro (concentra), o vilão ataca, o jogador disputa
    const s1 = playRound(withInitiative(startBattle(player('water'), fireVillain())), 'rest', seq(0.5, 0.7, 0.01), gameData, {}, always('clash:waterBullet'));
    expect(s1.playerFx.owesAction).toBe(true);
    expect(availableActions(s1, gameData)).toEqual(['pass']);
    // Devendo a ação, só pode Resistir.
    const incoming = { attacker: 'villain' as const, techniqueId: 'blaze', type: 'ninjutsu' as const, element: 'fire' as const, hits: 1, charged: false };
    expect(playerReactionOptions(s1, incoming, gameData)).toEqual(['resist']);
    const s2 = playRound(s1, 'pass', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'skip')).toEqual([{ type: 'skip', side: 'player', reason: 'reacted' }]);
    expect(s2.playerFx.owesAction).toBe(false);
  });

  it('aprisionado não reage: recebe com a resistência passiva', () => {
    const s0 = withInitiative(startBattle(player(), testVillain()), 'villain');
    const jailed = { ...s0, playerFx: { ...s0.playerFx, debilitated: 1 } };
    const s1 = playRound(jailed, 'rest', seq(0.5, 0.5), gameData, {}, always('substitution'));
    expect(ofType(s1.log, 'reaction')[0]).toMatchObject({ side: 'player', kind: 'passive' });
    // 10 − 10 × 0,4 = 6 (resistindo seriam 3)
    expect(s1.player.hp).toBe(94);
  });

  it('contra genjutsu, só Resistir', () => {
    const s0 = withInitiative(startBattle(player('fire'), testVillain()), 'villain');
    const incoming = { attacker: 'villain' as const, techniqueId: 'x', type: 'genjutsu' as const, element: null, hits: 1, charged: false };
    expect(playerReactionOptions(s0, incoming, gameData)).toEqual(['resist']);
  });

  it('golpe carregado: pode ser disputado, com o poder dele ×2', () => {
    const v = fireVillain({ behavior: { charged: 'blaze' } });
    const s0 = withInitiative(startBattle(player('water'), v), 'villain');
    const s1 = playRound(s0, 'rest', seq(0.5), gameData);
    const incoming = { attacker: 'villain' as const, techniqueId: 'blaze', type: 'ninjutsu' as const, element: 'fire' as const, hits: 1, charged: true };
    expect(reactionPreview(s1, incoming, 'clash:waterBullet', gameData)).toMatchObject({ attackPower: 78 });
  });
});

describe('reação interativa (a interface escolhe)', () => {
  it('a rodada para esperando a reação e continua com resumeRound', () => {
    const s0 = startBattle(player('water'), fireVillain(), { interactive: true, villainStartsFirst: true });
    const s1 = playRound(s0, 'rest', seq(0.5), gameData);
    expect(s1.pending).toMatchObject({ incoming: { attacker: 'villain', techniqueId: 'blaze', type: 'ninjutsu', element: 'fire' } });
    expect(s1.pending!.options).toEqual(['resist', 'substitution', 'clash:waterBullet']);
    expect(ofType(s1.log, 'declare')).toHaveLength(1);
    expect(() => playRound(s1, 'rest', seq(0.5), gameData)).toThrow();
    const s2 = resumeRound(s1, 'resist', seq(0.5, 0.5), gameData);
    expect(s2.pending).toBeNull();
    expect(s2.plan).toBeNull();
    expect(s2.player.hp).toBe(63);
    expect(ofType(s2.log, 'rest')).toHaveLength(1);
  });

  it('sem escolha de verdade (só Resistir), não para', () => {
    const s0 = startBattle({ ...player('water'), chakra: 0 }, testVillain(), { interactive: true, villainStartsFirst: true });
    const s1 = playRound(s0, 'rest', seq(0.5, 0.5), gameData);
    expect(s1.pending).toBeNull();
    expect(ofType(s1.log, 'reaction')[0]).toMatchObject({ side: 'player', kind: 'resist' });
  });
});

describe('Armadura de Raio (estado elemental)', () => {
  const armored = () => {
    const p = learnTechnique({ ...player('lightning'), level: 7 }, 'lightningArmor', gameData);
    return playRound(withInitiative(startBattle(p, testVillain({ hp: 300, techniques: [] as VillainTechnique[] })), 'player'), 'tech:lightningArmor', seq(0.5), gameData);
  };

  it('ativar gasta o turno e 8 de chakra; vale a partir da rodada seguinte: ataque ×1,25 e speed +2', () => {
    const s1 = armored();
    expect(ofType(s1.log, 'armor')).toEqual([{ type: 'armor', techniqueId: 'lightningArmor', chakra: 8 }]);
    expect(s1.player.chakra).toBe(22);
    expect(effectiveOffense({ ...s1, round: s1.round + 1 }, 'taijutsu', gameData)).toBe(12);
  });

  it('vento é muito efetivo contra ela (×1,5 e ignora o bônus de resistência); terra, pouco', () => {
    const s1 = armored();
    const hit = (element: 'wind' | 'earth') => {
      const tech: VillainTechnique = { id: 'hit', type: 'ninjutsu', baseDamage: 20, chakraCost: 0, weight: 1, element };
      const s = { ...s1, initiative: 'villain' as const, villain: { ...s1.villain, def: { ...s1.villain.def, techniques: [tech] } } };
      return ofType(playRound(s, 'rest', seq(0.5, 0.5), gameData).log.slice(s1.log.length), 'attack')[0]!;
    };
    // Vento: (20 − 10 × 0,7) × 1,5 = 19
    expect(hit('wind')).toMatchObject({ elementMult: 1.5, damage: 19 });
    // Terra: (20 − 10 × 1,3 × 0,7) × 0,75 = 8
    expect(hit('earth')).toMatchObject({ elementMult: 0.75, damage: 8 });
  });
});
