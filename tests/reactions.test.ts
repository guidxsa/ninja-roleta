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
import { villainsById } from '../src/data/villains';
import { hold, seq, testVillain, withInitiative } from './helpers';

const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);
const origin = (affinity: Origin['affinity'], lineageId: string | null = null): Origin => ({ lineageId, affinity, jinchuuriki: false });
const player = (affinity: Origin['affinity'] = 'water') => createPlayer(origin(affinity), gameData);
const always = (choice: ReactionChoice) => () => choice;
const ofRound = (before: BattleState, after: BattleState) => after.log.slice(before.log.length);

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

describe('barreiras (escudo)', () => {
  const earthWall: VillainTechnique = { id: 'earthWall', type: 'ninjutsu', baseDamage: 0, chakraCost: 5, weight: 1, barrier: 28, element: 'earth' };
  const puncher = (base: number) => testVillain({ hp: 200, techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: base, chakraCost: 0, weight: 1 }] });
  const walledPlayer = () => learnTechnique(player('earth'), 'earthWall', gameData);

  it('ação de turno: o escudo absorve o dano antes do HP até quebrar', () => {
    const s0 = withInitiative(startBattle(walledPlayer(), puncher(20)));
    expect(availableActions(s0, gameData)).toContain('tech:earthWall');
    const s1 = playRound(s0, 'tech:earthWall', seq(0.5), gameData);
    expect(ofType(s1.log, 'shield')).toEqual([{ type: 'shield', side: 'player', techniqueId: 'earthWall', points: 28, chakra: 5 }]);
    // Soco: 20 − 10 × 0,7 = 13, todo no escudo.
    expect(ofType(s1.log, 'shieldHit')).toEqual([{ type: 'shieldHit', side: 'player', absorbed: 13, left: 15, elementMult: 1 }]);
    expect(s1.player.hp).toBe(100);
    expect(availableActions(s1, gameData)).not.toContain('tech:earthWall');
    const s2 = playRound(s1, 'rest', seq(0.5), gameData);
    const s3 = playRound(s2, 'rest', seq(0.5), gameData);
    // 3º soco: o escudo (2) quebra e 11 passam.
    expect(ofType(ofRound(s2, s3), 'shieldBreak')).toEqual([{ type: 'shieldBreak', side: 'player' }]);
    expect(s3.player.hp).toBe(89);
    expect(s3.playerFx.shield).toBeNull();
  });

  it('dura 3 rodadas a partir da seguinte', () => {
    let s = playRound(withInitiative(startBattle(walledPlayer(), puncher(1))), 'tech:earthWall', seq(0.5), gameData);
    for (let i = 0; i < 2; i++) s = playRound(s, 'rest', seq(0.5), gameData);
    expect(s.playerFx.shield).not.toBeNull();
    const end = playRound(s, 'rest', seq(0.5), gameData);
    expect(ofType(ofRound(s, end), 'shieldEnd')).toEqual([{ type: 'shieldEnd', side: 'player' }]);
    expect(end.playerFx.shield).toBeNull();
  });

  it('elemento conta no escudo: raio contra terra ×2; fogo contra terra é neutro', () => {
    const walled = testVillain({ hp: 200, element: 'earth', startingShield: 'earthWall', techniques: [{ id: 'punch', type: 'taijutsu', baseDamage: 1, chakraCost: 0, weight: 1 }, earthWall] });
    const spark = playRound(withInitiative(startBattle(player('lightning'), walled)), 'tech:spark', seq(0.5), gameData);
    // Faísca: 13 + 10 − 10 × 0,9 (penetração 10%) × 0,7 = 16; no escudo vale 32: quebra os 28 e passam 2.
    expect(ofType(spark.log, 'shieldHit')[0]).toMatchObject({ side: 'villain', absorbed: 28, left: 0, elementMult: 2 });
    expect(spark.villain.hp).toBe(198);
    const fire = playRound(withInitiative(startBattle(player('fire'), walled)), 'tech:fireSpark', seq(0.5), gameData);
    expect(ofType(fire.log, 'shieldHit')[0]).toMatchObject({ side: 'villain', absorbed: 15, left: 13, elementMult: 1 });
    expect(fire.villain.hp).toBe(200);
  });

  it('o vilão ergue a barreira como ação, só sem escudo ativo; o Gaara já começa com a areia', () => {
    const builder = testVillain({ hp: 200, techniques: [earthWall] });
    const s1 = playRound(withInitiative(startBattle(player(), builder), 'villain'), 'rest', seq(0.5), gameData);
    expect(ofType(s1.log, 'shield')).toEqual([{ type: 'shield', side: 'villain', techniqueId: 'earthWall', points: 28, chakra: 5 }]);
    // Com o escudo de pé, a barreira sai do sorteio: sem outra técnica, concentra chakra.
    const s2 = playRound(s1, 'rest', seq(0.5), gameData);
    expect(ofType(ofRound(s1, s2), 'villainRest')).toHaveLength(1);
    const gaara = playRound(withInitiative(startBattle(player(), villainsById.gaara!)), 'rest', seq(0.5), gameData);
    expect(ofType(gaara.log, 'shield')[0]).toMatchObject({ side: 'villain', techniqueId: 'sandShield', points: 30, chakra: 0 });
  });
});

describe('Substituição', () => {
  it('roleta pela speed: 50% com speeds iguais; sucesso esquiva de tudo', () => {
    const s1 = villainAttacks(player(), fireVillain(), 'substitution', [0.5, 0.4]);
    expect(ofType(s1.log, 'substitutionRoll')).toEqual([{ type: 'substitutionRoll', side: 'player', chance: 0.5, success: true }]);
    expect(s1.player.hp).toBe(100);
    // 30 − 2, e a concentração da mesma rodada (não perdida) devolve ao máximo.
    expect(s1.player.chakra).toBe(30);
    expect(s1.playerFx.substitutionsUsed).toBe(1);
  });

  it('não gasta ação: quem se substitui ainda age na rodada', () => {
    const s1 = villainAttacks(player(), fireVillain(), 'substitution', [0.5, 0.4]);
    expect(s1.playerFx.owesAction).toBe(false);
    expect(ofType(s1.log, 'rest')).toHaveLength(1);
    expect(ofType(s1.log, 'skip')).toHaveLength(0);
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
    // Devendo a ação, só pode Resistir ou usar a Substituição (que não gasta ação).
    const incoming = { attacker: 'villain' as const, techniqueId: 'blaze', type: 'ninjutsu' as const, element: 'fire' as const, hits: 1, charged: false };
    expect(playerReactionOptions(s1, incoming, gameData)).toEqual(['resist', 'substitution']);
    const s2 = playRound(s1, 'pass', seq(0.5, 0.5, 0.01), gameData);
    expect(ofType(s2.log.slice(s1.log.length), 'skip')).toEqual([{ type: 'skip', side: 'player', reason: 'reacted' }]);
    expect(s2.playerFx.owesAction).toBe(false);
  });

  it('aprisionado não reage: recebe com a resistência passiva', () => {
    const s0 = withInitiative(startBattle(player(), testVillain()), 'villain');
    const jailed = { ...s0, playerFx: { ...s0.playerFx, debilitated: hold() } };
    const s1 = playRound(jailed, 'rest', seq(0.5, 0.5), gameData, {}, always('substitution'));
    expect(ofType(s1.log, 'reaction')[0]).toMatchObject({ side: 'player', kind: 'passive' });
    // (10 − 10 × 0,4) × 1,25 (perdeu a vez: vulnerável) = 7 (resistindo seriam 3)
    expect(s1.player.hp).toBe(93);
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
