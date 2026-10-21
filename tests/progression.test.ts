import { describe, expect, it } from 'vitest';
import { availableActions, playerTechnique, playRound, startBattle, type BattleEvent } from '../src/core/combat';
import { applyStatStages, createPlayer, learnTechnique } from '../src/core/player';
import {
  applyAkatsuki,
  applyItem,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  playJokenpo,
  rewardPool,
} from '../src/core/progression';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { gameData } from '../src/data/index';
import { seq, testVillain } from './helpers';

const common: Origin = { lineageId: null, affinity: 'fire', jinchuuriki: false };
const prodigy: Origin = { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false };
const ofType = <T extends BattleEvent['type']>(log: BattleEvent[], type: T) =>
  log.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === type);

describe('estágios de status', () => {
  it('sobe todos os status; HP e chakra atuais sobem junto', () => {
    const p = { ...createPlayer(common, gameData), hp: 50 };
    const up = applyStatStages(p, 2, gameData);
    expect(up.offense).toEqual({ taijutsu: 12, ninjutsu: 12, genjutsu: 12 });
    expect(up.speed).toBe(12);
    expect([up.maxHp, up.hp]).toEqual([110, 60]);
    expect([up.maxChakra, up.chakra]).toEqual([14, 14]);
  });

  it('prodígio do taijutsu: ninjutsu e genjutsu continuam zerados', () => {
    const up = applyStatStages(createPlayer(prodigy, gameData), 1, gameData);
    expect(up.offense).toEqual({ taijutsu: 16, ninjutsu: 0, genjutsu: 0 });
  });
});

describe('eventos pré-vilão', () => {
  it('velhinha: vilão age primeiro; ramen: crítico garantido; treino: +1 estágio', () => {
    const p = createPlayer(common, gameData);
    expect(applySimpleEvent(p, 'oldLady', gameData).mods).toEqual({ villainStartsFirst: true });
    expect(applySimpleEvent(p, 'ramen', gameData).mods).toEqual({ guaranteedCrit: true });
    expect(applySimpleEvent(p, 'training', gameData).player.speed).toBe(11);
    expect(applySimpleEvent(p, 'nothing', gameData).player).toBe(p);
  });

  it('jokenpô: vitória dá 2 estágios, empate nada, derrota dá desvantagem de ação', () => {
    const p = createPlayer(common, gameData);
    // 0.0 → pedra, 0.5 → papel, 0.9 → tesoura
    const win = playJokenpo(p, 'paper', seq(0.0), gameData);
    expect(win.result).toBe('win');
    expect(win.player.speed).toBe(12);
    expect(playJokenpo(p, 'paper', seq(0.5), gameData)).toMatchObject({ result: 'draw', mods: {} });
    expect(playJokenpo(p, 'paper', seq(0.9), gameData)).toMatchObject({
      result: 'loss',
      mods: { villainStartsFirst: true },
    });
  });
});

describe('itens', () => {
  const p = createPlayer(common, gameData);

  it('ferramenta ninja é única e evolui: +1 de dano base por nível em todos os ataques', () => {
    const lv1 = applyItem(p, 'ninjaTool', seq(0.5)).player;
    const lv2 = applyItem(lv1, 'ninjaTool', seq(0.5)).player;
    expect(lv2.ninjaToolLevel).toBe(2);
    expect(playerTechnique(lv2, 'taijutsu', gameData).baseDamage).toBe(10);
    expect(playerTechnique(lv2, 'ninjutsu', gameData).baseDamage).toBe(12);
  });

  it('pergaminho sem técnicas melhora o taijutsu imbuído', () => {
    const step = applyItem(p, 'techniqueScroll', seq(0.5));
    expect(step.effect).toEqual({ kind: 'techniqueUpgrade', type: 'taijutsu', level: 1 });
    expect(playerTechnique(step.player, 'taijutsu', gameData).baseDamage).toBe(10);
  });

  it('pergaminho sorteia entre as técnicas aprendidas', () => {
    const learned = learnTechnique(p, 'fireball', gameData);
    const step = applyItem(learned, 'techniqueScroll', seq(0.9));
    expect(step.effect).toMatchObject({ type: 'ninjutsu' });
  });

  it('retorno, resistência e velocidade', () => {
    expect(applyItem(p, 'revive', seq(0.5)).player.revives).toBe(2);
    expect(applyItem(p, 'resistanceItem', seq(0.5)).player.resistanceBonus).toBe(2);
    expect(applyItem(p, 'speedItem', seq(0.5)).player.speed).toBe(11);
  });
});

describe('encontros misteriosos', () => {
  it('Akatsuki: ignora quem não é jinchuuriki', () => {
    const p = createPlayer(common, gameData);
    expect(applyAkatsuki(p, gameData)).toMatchObject({ player: p, effect: { kind: 'akatsukiPassed' } });
  });

  it('Akatsuki: jinchuuriki perde 1 item de retorno; sem item, começa enfraquecido', () => {
    const jin = createPlayer({ ...common, jinchuuriki: true }, gameData);
    const took = applyAkatsuki(jin, gameData);
    expect(took.player.revives).toBe(0);
    const weak = applyAkatsuki(took.player, gameData);
    expect(weak.effect.kind).toBe('akatsukiWeakened');
    expect([weak.player.hp, weak.player.chakra]).toEqual([50, 10]);
  });

  it('invocação: aprende o animal; se já sabe, sobe de nível sem trocar o animal', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    expect(p.summon).toEqual({ animal: 'toad', level: 1 });
    expect(applySummonEncounter(p, 'slug').player.summon).toEqual({ animal: 'toad', level: 2 });
  });
});

describe('combate: efeitos de eventos', () => {
  it('velhinha: o vilão age primeiro na 1ª rodada, sem rolar iniciativa', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain(), { villainStartsFirst: true });
    const s1 = playRound(s0, 'taijutsu', seq(0.01), gameData);
    expect(ofType(s1.log, 'late')).toHaveLength(1);
    expect(ofType(s1.log, 'initiative')).toHaveLength(0);
    expect(ofType(s1.log, 'attack')[0]!.side).toBe('villain');
  });

  it('ramen: o primeiro ataque é crítico mesmo com um rng que erraria; o segundo volta ao normal', () => {
    const s0 = startBattle(createPlayer(common, gameData), testVillain({ hp: 200 }), {
      playerStartsFirst: true,
      guaranteedCrit: true,
    });
    const s1 = playRound(s0, 'taijutsu', seq(0.01), gameData);
    // (8 + 10 − 5) × 2 = 26
    expect(ofType(s1.log, 'attack')[0]).toMatchObject({ side: 'player', outcome: 'crit', damage: 26 });
    expect(s1.playerFx.guaranteedCrit).toBe(false);
    const s2 = playRound(s1, 'taijutsu', seq(0.01), gameData);
    expect(ofType(s2.log, 'attack').filter((a) => a.side === 'player').at(-1)).toMatchObject({ outcome: 'miss' });
  });

  it('invocação: uma vez por luta e custa chakra', () => {
    const p = applySummonEncounter(createPlayer(common, gameData), 'toad').player;
    const s0 = startBattle(p, testVillain({ hp: 200 }), { playerStartsFirst: true });
    expect(availableActions(s0, gameData)).toContain('summon');
    const s1 = playRound(s0, 'summon', seq(0.5), gameData);
    // sapo: 18 + 10 − 5 = 23, sem rolagem de acerto
    expect(ofType(s1.log, 'summon')).toEqual([{ type: 'summon', animal: 'toad', damage: 23, healed: 0 }]);
    expect(s1.player.chakra).toBe(5);
    expect(availableActions(s1, gameData)).not.toContain('summon');
  });

  it('invocação da cobra debilita; a da lesma cura', () => {
    const snake = applySummonEncounter(createPlayer(common, gameData), 'snake').player;
    const s1 = playRound(startBattle(snake, testVillain(), { playerStartsFirst: true }), 'summon', seq(0.5), gameData);
    expect(ofType(s1.log, 'debilitate')).toHaveLength(1);
    expect(ofType(s1.log, 'skip')).toEqual([{ type: 'skip', side: 'villain' }]);

    const slug = { ...applySummonEncounter(createPlayer(common, gameData), 'slug').player, hp: 40 };
    const s2 = playRound(startBattle(slug, testVillain(), { playerStartsFirst: true }), 'summon', seq(0.5), gameData);
    expect(ofType(s2.log, 'summon')[0]).toMatchObject({ healed: 30 });
  });
});

describe('recompensas', () => {
  it('a camada multiplica a quantidade', () => {
    const p = createPlayer(common, gameData);
    expect(applyReward(p, 'stages', 3, seq(0.5), gameData).player.speed).toBe(13);
    expect(applyReward(p, 'resistance', 2, seq(0.5), gameData).player.resistanceBonus).toBe(3);
    expect(applyReward(p, 'critBonus', 1, seq(0.5), gameData).player.critBonus).toBeCloseTo(0.03);
  });

  it('nova técnica respeita a origem: o prodígio só aprende taijutsu', () => {
    const rng = createRng(7);
    let p = createPlayer(prodigy, gameData);
    for (let i = 0; i < 20 && rewardPool(p, gameData).some((r) => r.id === 'newTechnique'); i++) {
      const step = applyReward(p, 'newTechnique', 1, rng, gameData);
      expect(step.effect).toEqual({ kind: 'newTechnique', techniqueId: 'leafWhirlwind' });
      p = step.player;
    }
    // Já sabe a única técnica de taijutsu: a fatia "nova técnica" some da roleta.
    expect(rewardPool(p, gameData).map((r) => r.id)).not.toContain('newTechnique');
  });
});
