import { describe, expect, it } from 'vitest';
import { scaleVillain } from '../src/core/difficulty';
import { canLevelUp } from '../src/core/player';
import { levelUp } from '../src/core/progression';
import {
  canUseActive,
  dodgeChance,
  playerHitDamage,
  playRoletaRound,
  startRoletaBattle,
  techBase,
  useActive,
  type RBattle,
} from '../src/core/roleta/battle';
import { createRoletaPlayer, roletaKit } from '../src/core/roleta/player';
import { summarizeRoletaFight } from '../src/core/roleta/stats';
import { createRng } from '../src/core/rng';
import type { Origin, VillainDef } from '../src/core/types';
import { campaign } from '../src/data/campaign';
import { roletaData as data } from '../src/data/roleta/index';
import { roletaTechniques } from '../src/data/roleta/techniques';
import { roletaPtBR } from '../src/data/strings/roleta';
import { villainsById } from '../src/data/villains';
import { runRoletaCampaign } from '../src/sim/roletaRunner';

/** Rng que devolve sempre o mesmo valor (0 = acerta e dispara tudo; 0,99 = erra). */
const fixed = (v: number) => () => v;
const origin = (lineageId: string | null, elements: Origin['elements'] = [], extra: Partial<Origin> = {}): Origin => ({ lineageId, elements, jinchuuriki: false, ...extra });
const villain = (id: string): VillainDef => scaleVillain(villainsById[id]!, 'normal', data.base);
/** Luta com o jogador agindo primeiro e o vilão sem chakra nem crítico, para isolar o que se testa. */
function battle(o: Origin, villainId = 'mizuki', over: Partial<RBattle['player']> = {}): RBattle {
  const p = { ...createRoletaPlayer(o, data), ...over };
  return startRoletaBattle(p, villain(villainId), { playerStartsFirst: true }, data, fixed(0.5));
}

describe('kit do Roleta enxuto', () => {
  it('Taijutsu básico, 1 técnica por elemento e as da linhagem', () => {
    expect(roletaKit(origin(null, ['fire']), data)).toEqual(['rBasic', 'rFire']);
    expect(roletaKit(origin('uchiha', ['fire', 'lightning']), data)).toEqual(['rBasic', 'rFire', 'rLightning', 'rPainIllusion']);
    // Prodígio: sem elemento e sem ninjutsu.
    expect(roletaKit(origin('taijutsuProdigy', ['wind']), data)).toEqual(['rBasic', 'rLeafHurricane']);
    // Kekkei genkai toma o lugar dos dois elementos-pai.
    expect(roletaKit(origin(null, ['water', 'wind', 'fire'], { kekkeiGenkai: 'ice' }), data)).toEqual(['rBasic', 'rFire', 'rIce']);
  });

  it('toda técnica do Roleta e todo kit têm nome', () => {
    for (const t of roletaTechniques) expect(roletaPtBR.techniques[t.id]).toBeTruthy();
    for (const kit of Object.values(data.kits)) {
      expect(roletaPtBR.passives[kit.passive]).toBeTruthy();
      if (kit.active) expect(roletaPtBR.actives[kit.active]).toBeTruthy();
    }
  });

  it('subir de nível não dá upgrade nem técnica nova; a técnica sobe sozinha', () => {
    let p = createRoletaPlayer(origin(null, ['fire']), data);
    const fire = data.techniques.rFire!;
    const before = techBase(p, fire, data);
    p = { ...p, xp: 9999 };
    while (canLevelUp(p, data.base) && p.level < 7) p = levelUp(p, data.base).player;
    expect(p.pendingUpgrades).toBe(0);
    expect(p.techniques).toEqual(['rBasic', 'rFire']);
    expect(techBase(p, fire, data)).toBe(before + fire.perLevel * 6);
  });

  it('eventos, itens e recompensa diretos: sem guru, Lição do clã, Pergaminho de técnica nem Nova técnica', () => {
    expect(data.base.preFightEvents.map((e) => e.id)).not.toEqual(expect.arrayContaining(['guru']));
    expect(data.base.preFightEvents.some((e) => e.id === 'clanLesson')).toBe(false);
    expect(data.base.items.some((e) => e.id === 'techniqueScroll')).toBe(false);
    expect(data.base.rewards.some((e) => e.id === 'newTechnique')).toBe(false);
  });
});

describe('combate do Roleta enxuto', () => {
  it('o dano não tem multiplicador de elemento: base + ataque − resistência × 0,4', () => {
    const s = battle(origin(null, ['water']), 'mizuki');
    const t = data.techniques.rWater!;
    const res = s.villain.def.resistance.physical;
    expect(playerHitDamage(s, t, data)).toBe(Math.max(1, Math.floor(techBase(s.player, t, data) + s.player.offense.ninjutsu - res * 0.4)));
  });

  it('esquiva pela diferença de speed, com teto', () => {
    expect(dodgeChance(10, 10, data)).toBeCloseTo(0.05);
    expect(dodgeChance(15, 10, data)).toBeCloseTo(0.15);
    expect(dodgeChance(40, 10, data)).toBe(data.r.dodge.max);
    expect(dodgeChance(5, 30, data)).toBe(0);
  });

  it('um toque por turno: o golpe gasta chakra, rola o acerto e fere o vilão', () => {
    const s = battle(origin(null, ['fire']));
    const next = playRoletaRound(s, 'tech:rFire', data, fixed(0.3));
    expect(next.villain.hp).toBeLessThan(s.villain.hp);
    expect(next.log.some((e) => e.type === 'attack' && e.side === 'player' && e.techId === 'rFire')).toBe(true);
    // Sem painel de reação: a rodada sempre fecha.
    expect(next.status === 'ongoing' || next.status === 'won' || next.status === 'lost').toBe(true);
  });

  it('Atordoar faz perder a vez; Queimar dói no começo do turno', () => {
    let s = battle(origin(null, ['fire']));
    s = { ...s, villain: { ...s.villain, effects: [{ kind: 'stun', turns: 1 }, { kind: 'burn', turns: 2 }] } };
    const next = playRoletaRound(s, 'guard', data, fixed(0.5));
    expect(next.log.some((e) => e.type === 'skip' && e.side === 'villain' && e.reason === 'stun')).toBe(true);
    const burn = Math.floor(s.villain.maxHp * data.r.effects.burn.pct);
    expect(next.log.some((e) => e.type === 'damage' && e.side === 'villain' && e.source === 'burn' && e.amount === burn)).toBe(true);
    expect(next.villain.effects.find((e) => e.kind === 'burn')?.turns).toBe(1);
  });

  it('Medo reduz o dano de quem sofre', () => {
    const s = battle(origin(null, ['fire']));
    const t = data.techniques.rFire!;
    const scared = { ...s, fx: { ...s.fx, effects: [{ kind: 'fear' as const, turns: 2 }] } };
    expect(playerHitDamage(scared, t, data)).toBeLessThan(playerHitDamage(s, t, data));
  });

  it('a ativa é grátis, uma por turno, com usos por luta', () => {
    let s = battle(origin(null, ['fire']));
    expect(canUseActive(s, data)).toBe(true);
    const off = s.player.offense.ninjutsu;
    s = useActive(s, data, fixed(0.5));
    expect(s.fx.buff).toEqual({ kind: 'effort', turns: 3 });
    expect(canUseActive(s, data)).toBe(false);
    expect(() => useActive(s, data, fixed(0.5))).toThrow();
    // O Esforço soma +3 nos ataques enquanto dura.
    const t = data.techniques.rFire!;
    expect(playerHitDamage(s, t, data)).toBeGreaterThan(playerHitDamage({ ...s, fx: { ...s.fx, buff: null } }, t, data));
    expect(s.player.offense.ninjutsu).toBe(off);
    // Dura 3 rodadas contando a da ativação.
    for (let i = 0; i < 3; i++) s = playRoletaRound(s, 'guard', data, fixed(0.99));
    expect(s.fx.buff).toBeNull();
  });

  it('Portões custam HP; Selamento tira a próxima ação do vilão', () => {
    const lee = useActive(battle(origin('taijutsuProdigy')), data, fixed(0.5));
    expect(lee.player.hp).toBe(lee.player.maxHp - Math.floor(lee.player.maxHp * data.r.kits.gates.hpCostPct));
    const uzu = useActive(battle(origin('uzumaki', ['wind'])), data, fixed(0.5));
    const next = playRoletaRound(uzu, 'guard', data, fixed(0.5));
    expect(next.log.some((e) => e.type === 'skip' && e.side === 'villain' && e.reason === 'seal')).toBe(true);
  });

  it('Enganador (Mizuki) escapa uma vez com 1 de HP', () => {
    let s = battle(origin(null, ['fire']));
    s = { ...s, villain: { ...s.villain, hp: 1 } };
    const next = playRoletaRound(s, 'tech:rFire', data, fixed(0.3));
    expect(next.villain.hp).toBe(1);
    expect(next.villain.survived).toBe(true);
    expect(next.status).toBe('ongoing');
  });

  it('Vontade do Fogo levanta o jogador inteiro', () => {
    let s = battle(origin(null, ['fire']), 'zabuza');
    s = { ...s, player: { ...s.player, hp: 1, revives: 1 }, playerFirst: false };
    const next = playRoletaRound(s, 'guard', data, fixed(0.5));
    expect(next.log.some((e) => e.type === 'revive' && e.side === 'player')).toBe(true);
    expect(next.player.revives).toBe(0);
    expect(next.status).toBe('ongoing');
  });

  it('o resumo da luta conta dano, itens e Vontades', () => {
    const s = playRoletaRound(battle(origin(null, ['fire'])), 'tech:rFire', data, fixed(0.3));
    const sum = summarizeRoletaFight('mizuki', false, s);
    expect(sum.bestHit).toBeGreaterThan(0);
    expect(sum.villainId).toBe('mizuki');
  });

  it('a campanha simulada termina, com lutas curtas', () => {
    const r = runRoletaCampaign(createRoletaPlayer(origin(null, ['fire']), data, 'easy'), campaign, villainsById, createRng(3), data, 'easy');
    expect(r.rounds.length).toBeGreaterThan(3);
    expect(r.rounds.every((n) => n < 60)).toBe(true);
  });
});
