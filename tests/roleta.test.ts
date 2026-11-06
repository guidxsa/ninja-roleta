import { describe, expect, it } from 'vitest';
import { scaleVillain } from '../src/core/difficulty';
import { canLevelUp } from '../src/core/player';
import { levelUp } from '../src/core/progression';
import {
  canUseActive,
  dodgeChance,
  playerAttackOdds,
  playerHitDamage,
  playRoletaRound,
  startRoletaBattle,
  techBase,
  useActive,
  type RBattle,
} from '../src/core/roleta/battle';
import { createRoletaPlayer, roletaKit } from '../src/core/roleta/player';
import { summarizeRoletaFight } from '../src/core/roleta/stats';
import {
  chooseChest,
  continueRoletaCycle,
  contractFor,
  cycleMult,
  drawVillain,
  finishRoletaFight,
  gainRoletaRelic,
  newRoletaRun,
  relicPool,
  rewardRelic,
  villainFor,
} from '../src/core/roleta/run';
import { relicInMode } from '../src/core/jornada/relics';
import { relics as jornadaRelics } from '../src/data/jornada/relics';
import { jornadaData } from '../src/data/jornada';
import { jornadaPtBR } from '../src/data/strings/jornada';
import { RELIC_ICONS } from '../prototype/jornada/relicIcons';
import { createRng } from '../src/core/rng';
import type { Origin, VillainDef } from '../src/core/types';
import { roletaData as data } from '../src/data/roleta/index';
import { roletaTechniques } from '../src/data/roleta/techniques';
import { roletaPtBR } from '../src/data/strings/roleta';
import { villainsById } from '../src/data/villains';
import { runRoletaRun } from '../src/sim/roletaRunner';

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

  it('a run simulada termina, com lutas curtas', () => {
    const r = runRoletaRun(createRoletaPlayer(origin(null, ['fire']), data, 'easy'), villainsById, createRng(3), data, 'easy');
    expect(r.rounds.length).toBeGreaterThan(3);
    expect(r.rounds.every((n) => n < 60)).toBe(true);
  });
});

describe('run do Roleta enxuto e relíquias (v0.46.0)', () => {
  const p0 = () => createRoletaPlayer(origin(null, ['fire']), data);

  it('o ciclo tem 6 lutas por categoria e sorteia sem repetir no ciclo', () => {
    expect(data.cycle).toEqual(['genin', 'genin', 'chunin', 'chunin', 'jounin', 'boss']);
    let run = newRoletaRun(p0(), 'normal');
    run = drawVillain(run, data, fixed(0));
    expect(data.categories.genin).toContain(run.villainId);
    const first = run.villainId!;
    run = { ...run, used: [first], step: 1, villainId: null };
    run = drawVillain(run, data, fixed(0));
    expect(run.villainId).not.toBe(first);
    expect(data.categories.genin).toContain(run.villainId);
  });

  it('vitória avança o passo; o chefe abre o baú; o 1º ciclo vencido segue mais forte', () => {
    let run = { ...newRoletaRun(p0(), 'normal'), villainId: 'mizuki' };
    const win = (r: typeof run) => {
      const b = startRoletaBattle(r.player, villainFor(r, villainsById, data), {}, data, fixed(0.5));
      return { ...b, status: 'won' as const };
    };
    let res = finishRoletaFight(run, win(run), data, fixed(0.3));
    expect(res.run.step).toBe(1);
    expect(res.outcome.tier).toBe(1);
    expect(res.run.player.xp).toBeGreaterThan(0);
    run = { ...res.run, step: 5, villainId: 'orochimaru' };
    res = finishRoletaFight(run, win(run), data, fixed(0.3));
    expect(res.outcome.boss).toBe(true);
    expect(res.run.bossChoice?.length).toBe(3);
    expect(res.run.player.hp).toBe(res.run.player.maxHp);
    const after = chooseChest(res.run, res.run.bossChoice![0]!, data);
    expect(after.status).toBe('victory');
    expect(after.player.relics).toContain(res.run.bossChoice![0]);
    const next = continueRoletaCycle(after);
    expect([next.cycle, next.step, next.used, next.status]).toEqual([1, 0, [], 'inProgress']);
    expect(cycleMult(next, data)).toBeCloseTo(1 + data.r.infinite.perCycle);
    const v0 = villainFor({ ...after, villainId: 'mizuki' }, villainsById, data);
    const v1 = villainFor({ ...next, villainId: 'mizuki' }, villainsById, data);
    expect(v1.hp).toBeGreaterThan(v0.hp);
  });

  it('derrota encerra a run', () => {
    const run = { ...newRoletaRun(p0(), 'normal'), villainId: 'mizuki' };
    const b = { ...startRoletaBattle(run.player, villainFor(run, villainsById, data), {}, data, fixed(0.5)), status: 'lost' as const };
    expect(finishRoletaFight(run, b, data, fixed(0.5)).run.status).toBe('defeat');
  });

  it('catálogo único: a Jornada continua com as mesmas relíquias; o Roleta tem as dele e as exclusivas', () => {
    expect(jornadaRelics.map((r) => r.id)).toEqual(jornadaData.relics.map((r) => r.id));
    expect(data.relics.every((r) => relicInMode(r, 'roleta') && r.roleta)).toBe(true);
    for (const id of ['ninjaTool', 'speedAmulet', 'resistanceAmulet', 'snakeContract', 'slugContract', 'trainingWeights', 'toadContract']) {
      expect(data.relics.some((r) => r.id === id)).toBe(true);
    }
    expect(jornadaData.relics.some((r) => r.id === 'ninjaTool')).toBe(false);
    // Todo nome, efeito no Roleta e ícone existem.
    for (const r of data.relics) {
      expect(jornadaPtBR.relics.list[r.id]?.name ?? roletaPtBR.relics[r.id]?.name).toBeTruthy();
      expect(roletaPtBR.relics[r.id]?.desc).toBeTruthy();
      expect(RELIC_ICONS[r.id]).toBeTruthy();
    }
  });

  it('relíquias no combate: status ao ganhar, crítico, escudo, abertura e Pena de fênix', () => {
    let p = gainRoletaRelic(p0(), 'leafHeadband', data);
    expect(p.maxHp).toBe(p0().maxHp + 10);
    p = gainRoletaRelic(gainRoletaRelic(gainRoletaRelic(p, 'samuraiArmor', data), 'explosiveTags', data), 'phoenixFeather', data);
    const s = startRoletaBattle(p, villain('zabuza'), { playerStartsFirst: true }, data, fixed(0.5));
    expect(s.fx.shield).toBe(Math.floor(p.maxHp * 0.2));
    expect(s.villain.hp).toBe(s.villain.maxHp - 10);
    const low = { ...s, fx: { ...s.fx, shield: 0 }, player: { ...s.player, hp: 1, revives: 0 }, playerFirst: false };
    const next = playRoletaRound(low, 'guard', data, fixed(0.5));
    expect(next.status).toBe('ongoing');
    expect(next.player.hp).toBe(1);
    expect(next.fx.survivedOnce).toBe(true);
    const crit = startRoletaBattle(gainRoletaRelic(p0(), 'kakashiBell', data), villain('mizuki'), {}, data, fixed(0.5));
    const t = data.techniques.rFire!;
    expect(playerAttackOdds(crit, t, data).crit).toBeGreaterThan(playerAttackOdds(startRoletaBattle(p0(), villain('mizuki'), {}, data, fixed(0.5)), t, data).crit);
  });

  it('contratos de invocação e Pesos de treino como relíquias', () => {
    const toad = gainRoletaRelic(p0(), 'toadContract', data);
    expect(toad.summon).toEqual({ animal: 'toad', level: 1 });
    // Com um contrato, os outros não saem mais.
    expect(relicPool(toad, data).some((r) => r.id === 'snakeContract')).toBe(false);
    const weights = gainRoletaRelic(p0(), 'trainingWeights', data);
    expect(weights.trainingWeights).toBe('stored');
    expect(contractFor('slug', data)).toBe('slugContract');
  });

  it('a fatia Relíquia sorteia pela raridade e a roleta de itens não tem mais os permanentes', () => {
    const id = rewardRelic(p0(), 3, data, fixed(0.1))!;
    expect(data.relics.find((r) => r.id === id)?.tier).toBe('rare');
    expect(data.base.rewards.some((r) => r.id === 'relic')).toBe(true);
    expect(data.base.items.some((i) => ['ninjaTool', 'speedItem', 'resistanceItem', 'trainingWeights', 'smokeBomb'].includes(i.id))).toBe(false);
  });
});
