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
  applyJackpot,
  applyRoletaReward,
  rewardTierFor,
  rewardXp,
  canContinueRoleta,
  readyForFight,
  relicRewardWeights,
  rollRelicReward,
} from '../src/core/roleta/run';
import { relicInMode } from '../src/core/jornada/relics';
import { relics as jornadaRelics } from '../src/data/jornada/relics';
import { jornadaData } from '../src/data/jornada';
import { jornadaPtBR } from '../src/data/strings/jornada';
import { RELIC_ICONS } from '../prototype/jornada/relicIcons';
import { xpToNextLevel } from '../src/core/player';
import { rollOrigin } from '../src/core/origin';
import { achievements, winAchievementId } from '../src/data/achievements';
import { gameData } from '../src/data/index';
import { createRng } from '../src/core/rng';
import { gateUpkeep } from '../src/core/gates';
import type { Origin, VillainDef } from '../src/core/types';
import { roletaData as data } from '../src/data/roleta/index';
import { roletaTechniques } from '../src/data/roleta/techniques';
import { roletaPtBR } from '../src/data/strings/roleta';
import { roletaExtraVillains, roletaVillainsById as villainsById } from '../src/data/roleta/villains';
import { ptBR } from '../src/data/strings/ptBR';
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

describe('chakra nos eventos da luta', () => {
  it('o gasto do golpe vem antes da roleta de acerto', () => {
    const b = battle(origin(null, ['fire']));
    const s = playRoletaRound(b, 'tech:rFire', data, fixed(0.5));
    const events = s.log.slice(b.log.length);
    const attack = events.findIndex((e) => e.type === 'attack' && e.side === 'player');
    const spent = events.findIndex((e) => e.type === 'chakra' && e.side === 'player' && e.value === s.player.chakra);
    expect(spent).toBeGreaterThanOrEqual(0);
    expect(spent).toBeLessThan(attack);
  });

  it('golpe sem custo e chakra cheio não geram evento', () => {
    const b = battle(origin(null, ['fire']));
    const s = playRoletaRound(b, 'tech:rBasic', data, fixed(0.5));
    expect(s.log.slice(b.log.length).filter((e) => e.type === 'chakra' && e.side === 'player')).toEqual([]);
  });

  it('regeneração e Pílula de soldado também aparecem', () => {
    const b = battle(origin(null, ['fire']), 'mizuki', { chakra: 0, bag: { ...createRoletaPlayer(origin(null, ['fire']), data).bag, soldierPill: 1 } });
    const s = playRoletaRound(b, 'item:soldierPill', data, fixed(0.5));
    const values = s.log.slice(b.log.length).flatMap((e) => (e.type === 'chakra' && e.side === 'player' ? [e.value] : []));
    expect(values).toHaveLength(2);
    expect(values[0]).toBeGreaterThan(0);
    expect(values[1]).toBe(s.player.chakra);
  });

  it('repassar os eventos dá o chakra final, nos dois lados, em toda rodada', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = createRng(seed);
      let s = startRoletaBattle(createRoletaPlayer(origin(null, ['fire']), data), villain('kabuto'), { playerStartsFirst: true }, data, rng);
      while (s.status === 'ongoing') {
        const before = s;
        s = playRoletaRound(before, 'tech:rFire', data, rng);
        let player = before.player.chakra;
        let foe = before.villain.chakra;
        for (const e of s.log.slice(before.log.length)) {
          if (e.type === 'chakra' && e.side === 'player') player = e.value;
          else if (e.type === 'chakra') foe = e.value;
          else if (e.type === 'rest' && e.side === 'player') player += e.amount;
          else if (e.type === 'rest') foe += e.amount;
          else if (e.type === 'revive' && e.side === 'player') player = s.player.maxChakra;
        }
        expect(player).toBe(s.player.chakra);
        expect(foe).toBe(s.villain.chakra);
      }
    }
  });
});

describe('turno sem chakra para a técnica (v0.60.0)', () => {
  // Os Portões cobram a manutenção no começo da rodada, depois da escolha: a técnica pode ficar sem chakra.
  const broke = (over: Partial<RBattle['player']> = {}) => {
    const b = battle(origin(null, ['fire']), 'mizuki', { chakra: 0, ...over });
    return { ...b, fx: { ...b.fx, effects: [{ kind: 'burn' as const, turns: 3 }] } };
  };

  it('concentra no lugar sem repetir o turno: o efeito dói e perde um turno uma vez só', () => {
    const b = broke();
    const s = playRoletaRound(b, 'tech:rFire', data, fixed(0.5));
    const events = s.log.slice(b.log.length);
    expect(events.filter((e) => e.type === 'damage' && e.side === 'player' && e.source === 'burn')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'rest' && e.side === 'player')).toHaveLength(1);
    expect(s.fx.effects.find((e) => e.kind === 'burn')?.turns).toBe(2);
    expect(events.some((e) => e.type === 'attack' && e.side === 'player')).toBe(false);
  });

  it('o resultado fica no estado de verdade: a queda pelo efeito encerra a luta', () => {
    const b = { ...broke({ hp: 1, revives: 0 }), options: { allowRevive: false } };
    const s = playRoletaRound(b, 'tech:rFire', data, fixed(0.5));
    expect(s.status).toBe('lost');
  });
});

describe('Juventude do Prodígio (v0.60.0)', () => {
  it('+5% de crítico, contado uma vez (antes somava na ficha e de novo na luta)', () => {
    const t = data.techniques.rBasic!;
    const lee = playerAttackOdds(battle(origin('taijutsuProdigy')), t, data);
    const plain = playerAttackOdds(battle(origin(null, ['fire'])), t, data);
    expect(lee.crit - plain.crit).toBeCloseTo(data.base.balance.passives.youth.critBonus, 10);
  });
});

describe('kit do Roleta enxuto', () => {
  it('Taijutsu básico, Bunshin (quem usa ninjutsu), a técnica da natureza (só os elementais) e as da linhagem', () => {
    expect(roletaKit(origin(null, ['fire']), data)).toEqual(['rBasic', 'rBunshin', 'rFire']);
    expect(roletaKit(origin('uchiha', ['fire']), data)).toEqual(['rBasic', 'rBunshin', 'rFire', 'rPainIllusion']);
    // Natureza silenciosa: o Inuzuka tem natureza, mas sem a técnica dela.
    expect(roletaKit(origin('inuzuka', ['fire']), data)).toEqual(['rBasic', 'rBunshin', 'rFangs']);
    // Uzumaki: a natureza no lugar da Etiqueta Explosiva.
    expect(roletaKit(origin('uzumaki', ['water']), data)).toEqual(['rBasic', 'rBunshin', 'rWater']);
    // Prodígio: sem elemento e sem ninjutsu.
    expect(roletaKit(origin('taijutsuProdigy', ['wind']), data)).toEqual(['rBasic', 'rLeafHurricane']);
    // Kekkei genkai toma o lugar dos dois elementos-pai.
    // Mokuton: a Kekkei Genkai é a natureza do Senju.
    expect(roletaKit(origin('senju', [], { kekkeiGenkai: 'wood' }), data)).toEqual(['rBasic', 'rBunshin', 'rWood']);
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
    expect(p.techniques).toEqual(['rBasic', 'rBunshin', 'rFire']);
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

  it('Portões custam chakra (não HP); Selamento tira a próxima ação do vilão', () => {
    const lee = useActive(battle(origin('taijutsuProdigy')), data, fixed(0.5));
    expect([lee.player.hp, lee.player.chakra]).toEqual([lee.player.maxHp, lee.player.maxChakra - data.r.kits.gates.activation]);
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

  it('vitória avança o passo; o chefe abre o baú; o 1º ciclo vencido (no Hardcore) segue mais forte', () => {
    let run = { ...newRoletaRun(p0(), 'hardcore'), villainId: 'mizuki' };
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

  it('modo infinito só no Hardcore: vencer em outra dificuldade encerra a run', () => {
    const won = { ...newRoletaRun(p0(), 'hard'), status: 'victory' as const };
    expect(canContinueRoleta(won)).toBe(false);
    expect(() => continueRoletaCycle(won)).toThrow();
    expect(canContinueRoleta({ ...won, difficulty: 'hardcore' })).toBe(true);
  });

  it('ciclo novo: todo status de um Genin fica acima do último chefe (o kit não muda)', () => {
    let run: ReturnType<typeof newRoletaRun> = { ...newRoletaRun(p0(), 'hardcore'), step: 5, villainId: 'orochimaru' };
    const boss = villainFor(run, villainsById, data);
    const b = { ...startRoletaBattle(run.player, boss, {}, data, fixed(0.5)), status: 'won' as const };
    const res = finishRoletaFight(run, b, data, fixed(0.3));
    run = continueRoletaCycle(chooseChest(res.run, res.run.bossChoice![0]!, data));
    const genin = villainFor({ ...run, villainId: data.categories.genin[0]! }, villainsById, data);
    expect(genin.hp).toBeGreaterThan(boss.hp);
    expect(genin.speed).toBeGreaterThan(boss.speed);
    expect(genin.resistance.physical).toBeGreaterThan(boss.resistance.physical);
    expect(genin.offense.ninjutsu).toBeGreaterThanOrEqual(boss.offense.ninjutsu);
    expect(genin.techniques.map((t) => t.id)).toEqual(villainsById[data.categories.genin[0]!]!.techniques.map((t) => t.id));
  });

  it('cada luta começa com HP e chakra cheios; vencer não recupera mais por conta própria', () => {
    const hurt = { ...p0(), hp: 10, chakra: 1 };
    const ready = readyForFight(hurt);
    expect([ready.hp, ready.chakra]).toEqual([ready.maxHp, ready.maxChakra]);
    const run = { ...newRoletaRun(hurt, 'normal'), villainId: 'mizuki' };
    const b = { ...startRoletaBattle(hurt, villainFor(run, villainsById, data), {}, data, fixed(0.5)), status: 'won' as const };
    expect(finishRoletaFight(run, b, data, fixed(0.3)).run.player.hp).toBe(b.player.hp);
  });

  it('roleta de relíquia pós-luta: pesos da categoria, sobe no infinito e só sorteia relíquia que falta', () => {
    expect(relicRewardWeights('genin', 0, data)).toEqual({ common: 70, uncommon: 25, rare: 5 });
    expect(relicRewardWeights('jounin', 0, data)).toEqual({ common: 20, uncommon: 45, rare: 35 });
    expect(relicRewardWeights('genin', 2, data)).toEqual({ common: 50, uncommon: 25, rare: 25 });
    expect(relicRewardWeights('jounin', 5, data).common).toBe(0);
    const roll = rollRelicReward(p0(), 'genin', 0, data, fixed(0.1));
    expect(roll.tierStep!.slices[roll.tierStep!.index]!.value).toBe('common');
    expect(roll.relic).toBe(roll.relicStep!.slices[roll.relicStep!.index]!.value);
    const def = data.relics.find((r) => r.id === roll.relic)!;
    expect(def.tier).toBe('common');
    const owned = { ...p0(), relics: [...(p0().relics ?? []), roll.relic!] };
    expect(rollRelicReward(owned, 'genin', 0, data, fixed(0.1)).relicStep!.slices.some((s) => s.value === roll.relic)).toBe(false);
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

describe('mais vilões no sorteio (v0.47.0)', () => {
  it('cada categoria tem fichas que existem, com nome e retrato válido, e o ciclo segue sem repetir', () => {
    for (const ids of Object.values(data.categories)) {
      for (const id of ids) {
        expect(villainsById[id]).toBeTruthy();
        expect(ptBR.villains[id]).toBeTruthy();
        const spec = villainsById[id]!.portrait;
        if (spec) expect(spec).toMatch(/^(ninja|villain):[a-zA-Z]+$/);
      }
    }
    expect(data.categories.genin.length).toBeGreaterThanOrEqual(9);
    expect(data.categories.jounin).toEqual(expect.arrayContaining(['kimimaro', 'neji']));
    for (const v of roletaExtraVillains) for (const t of v.techniques) expect(roletaPtBR.techniques[t.id]).toBeTruthy();
  });

  it('os vilões novos lutam no motor enxuto (Irmãos Demônio: 2 golpes numa roleta só)', () => {
    let s = startRoletaBattle(createRoletaPlayer(origin(null, ['fire']), data), villain('demonBrothers'), { villainStartsFirst: true }, data, fixed(0.5));
    s = playRoletaRound(s, 'guard', data, fixed(0.5));
    const attacks = s.log.filter((e) => e.type === 'attack' && e.side === 'villain');
    expect(attacks.length).toBe(1);
    expect(attacks[0]).toMatchObject({ hits: 2 });
  });

  it('Espelhos: uma roleta para os 2 golpes, com o dano dos dois e a fumaça anulando o ataque inteiro', () => {
    const start = () => startRoletaBattle(createRoletaPlayer(origin(null, ['fire']), data), villain('haku'), { villainStartsFirst: true }, data, fixed(0.5));
    const plain = { ...villain('haku'), passive: undefined };
    const hit = playRoletaRound(start(), 'guard', data, fixed(0.5));
    const base = playRoletaRound(startRoletaBattle(createRoletaPlayer(origin(null, ['fire']), data), plain, { villainStartsFirst: true }, data, fixed(0.5)), 'guard', data, fixed(0.5));
    const dmg = (s: typeof hit) => s.log.filter((e) => e.type === 'damage' && e.side === 'player' && e.source === 'attack');
    expect(hit.log.filter((e) => e.type === 'attack' && e.side === 'villain').length).toBe(1);
    expect(dmg(hit).length).toBe(1);
    const total = (dmg(hit)[0] as { amount: number }).amount;
    const full = (dmg(base)[0] as { amount: number }).amount;
    // Cada golpe vale 60%, arredondado para baixo no golpe; os 2 somam perto de 120% do ataque comum.
    expect(total % 2).toBe(0);
    expect(total).toBeGreaterThan(full);
    expect(total).toBeLessThanOrEqual(Math.ceil(full * 1.2));

    const smoke = start();
    smoke.fx.dodgeNext = true;
    const dodged = playRoletaRound(smoke, 'guard', data, fixed(0.5));
    expect(dodged.log.filter((e) => e.type === 'attack' && e.side === 'villain' && e.outcome === 'miss').length).toBe(1);
    expect(dmg(dodged).length).toBe(0);
  });
});

describe('recompensa forte e escalando (v0.52.0)', () => {
  const player = () => createRoletaPlayer({ lineageId: 'common', elements: ['fire'], jinchuuriki: false }, data);

  it('as fatias são Status, Relíquia, XP, Itens e Jackpot', () => {
    expect(data.base.rewards.map((r) => r.id).sort()).toEqual(['item', 'jackpot', 'relic', 'stages', 'xp']);
  });

  it('a raridade sobe com o ciclo, até lendária; o chefe segue com o baú', () => {
    expect(rewardTierFor('genin', 0, data)).toBe(1);
    expect(rewardTierFor('genin', 1, data)).toBe(2);
    expect(rewardTierFor('genin', 2, data)).toBe(3);
    expect(rewardTierFor('genin', 9, data)).toBe(3);
    expect(rewardTierFor('jounin', 0, data)).toBe(2);
    expect(rewardTierFor('jounin', 1, data)).toBe(3);
    expect(rewardTierFor('boss', 5, data)).toBe(0);
  });

  it('a lendária sai de verdade: relíquia rara na fatia', () => {
    const id = rewardRelic(player(), 3, data, fixed(0.1))!;
    expect(data.relics.find((r) => r.id === id)!.tier).toBe('rare');
  });

  it('Status junta estágios, resistência e crítico', () => {
    const p = player();
    const steps = applyRoletaReward(p, 'stages', 2, fixed(0.1), data);
    const after = steps.at(-1)!.player;
    expect(steps.map((s) => s.effect.kind)).toEqual(['stages', 'resistance', 'critBonus']);
    expect(after.critBonus).toBeCloseTo(p.critBonus + data.r.rewards.critBonus[1]!);
    expect(after.maxHp).toBeGreaterThan(p.maxHp);
  });

  it('XP acompanha o custo do nível', () => {
    const low = player();
    const high = { ...low, level: 8 };
    expect(rewardXp(low, 1, data)).toBe(Math.floor(xpToNextLevel(1, data.base) * 0.5));
    expect(rewardXp(high, 1, data)).toBe(Math.floor(xpToNextLevel(8, data.base) * 0.5));
    expect(rewardXp(high, 1, data)).toBeGreaterThan(rewardXp(low, 1, data));
    expect(rewardXp(low, 3, data)).toBe(Math.floor(xpToNextLevel(1, data.base) * 1.5));
  });

  it('Jackpot dá relíquia rara e cura; sem relíquia, XP', () => {
    const hurt = { ...player(), hp: 10 };
    const out = applyJackpot(hurt, fixed(0.1), data);
    expect(data.relics.find((r) => r.id === out.relic)!.tier).toBe('rare');
    expect(out.player.relics).toContain(out.relic);
    expect(out.healed).toBe(Math.floor(hurt.maxHp * data.r.rewards.jackpotHealPct));
    const rares = data.relics.filter((r) => r.tier === 'rare').map((r) => r.id);
    const none = applyJackpot({ ...hurt, relics: rares }, fixed(0.1), data);
    expect(none.relic).toBeNull();
    expect(none.player.xp + none.player.level).toBeGreaterThan(hurt.xp + hurt.level);
  });

  it('o clássico não muda: a recompensa dele segue com os números antigos', () => {
    expect(gameData.rewards.map((r) => r.id)).not.toContain('jackpot');
    expect(gameData.balance.rewards.critBonus).toEqual([0.02, 0.04, 0.06]);
  });
});

describe('linhagens fora do Roleta (v0.52.0)', () => {
  it('Yamanaka, Nara e Aburame saem do sorteio, mas ficam guardadas', () => {
    const ids = data.base.lineages.map((l) => l.id);
    for (const id of ['yamanaka', 'nara', 'aburame']) {
      expect(ids, id).not.toContain(id);
      expect(gameData.lineages.some((l) => l.id === id), id).toBe(true);
      expect(data.kits[id], id).toBeTruthy();
    }
    expect(ids).toHaveLength(8);
    const rng = createRng(4);
    for (let i = 0; i < 300; i++) expect(['yamanaka', 'nara', 'aburame']).not.toContain(rollOrigin(rng, data.base).origin.lineageId);
  });

  it('as conquistas delas viram clássicas; Mestre dos clãs pede só as que saem', () => {
    for (const id of ['win_yamanaka', 'win_nara', 'win_aburame', 'mindGames']) expect(achievements.find((a) => a.id === id)!.legacy, id).toBe(true);
    const master = achievements.find((a) => a.id === 'clanMaster')!;
    const open = data.base.lineages.map((l) => winAchievementId(l.id));
    expect(master.progress!(new Set(open))).toEqual([open.length, open.length]);
    expect(open).toHaveLength(8);
  });
});

describe('Bunshin no Jutsu (src/core/clones.ts, v0.59.0)', () => {
  it('cria o clone sem roleta de acerto; o golpe do vilão cai nele e ele some', () => {
    const b = battle(origin(null, ['fire']));
    // 0,3: o vilão acerta (78%), sem esquiva, e o golpe cai no clone (50%).
    const s = playRoletaRound(b, 'tech:rBunshin', data, fixed(0.3));
    const events = s.log.slice(b.log.length);
    expect(events.some((e) => e.type === 'clone' && e.action === 'create')).toBe(true);
    expect(events.some((e) => e.type === 'clone' && e.action === 'block')).toBe(true);
    expect(events.some((e) => e.type === 'attack' && e.side === 'player')).toBe(false);
    expect([s.fx.clone, s.player.hp]).toEqual([false, b.player.hp]);
  });

  it('com a roleta do clone falhando, o golpe acerta o ninja e o clone fica', () => {
    const b = battle(origin(null, ['fire']));
    const created = playRoletaRound(b, 'tech:rBunshin', data, fixed(0.99));
    expect(created.fx.clone).toBe(true);
    // 0,6: o vilão acerta, mas fica acima da chance do clone (50%).
    const s = playRoletaRound(created, 'tech:rBasic', data, fixed(0.6));
    const events = s.log.slice(created.log.length);
    if (events.some((e) => e.type === 'attack' && e.side === 'villain' && e.outcome !== 'miss')) {
      expect(s.fx.clone).toBe(true);
      expect(s.player.hp).toBeLessThan(created.player.hp);
    }
  });

  it('no kit de toda origem com ninjutsu; o Prodígio fica sem', () => {
    const kit = (o: Origin) => roletaKit(o, data);
    expect(kit(origin(null, ['fire']))).toContain('rBunshin');
    expect(kit(origin('inuzuka', ['earth']))).toContain('rBunshin');
    expect(kit(origin('taijutsuProdigy', ['earth']))).not.toContain('rBunshin');
  });

  it('Jornada: quem tem ninjutsu começa com Bunshin (o Naruto já tem o Kage Bunshin)', () => {
    for (const c of Object.values(jornadaData.characters)) {
      const clone = c.techniques.some((id) => jornadaData.techniques[id]?.clones);
      expect([c.id, clone]).toEqual([c.id, c.offense.ninjutsu > 0]);
    }
  });
});

describe('Portões (src/core/gates.ts, v0.59.0)', () => {
  it('manutenção comum: 2, 3, 5, 7, 11, 16 (com peso de nível, arredonda para cima)', () => {
    const g = data.base.balance.gateCosts;
    expect([1, 2, 3, 4, 5, 6].map((n) => gateUpkeep(n, g))).toEqual([2, 3, 5, 7, 11, 16]);
    expect(gateUpkeep(1, g, 1.25)).toBe(3);
  });

  it('Roleta: abrir custa chakra e não HP; manutenção a cada rodada; fecha sozinho sem chakra e pode reabrir', () => {
    const b = battle(origin('taijutsuProdigy', ['earth']));
    const hp0 = b.player.hp;
    const ck0 = b.player.chakra;
    expect(canUseActive(b, data)).toBe(true);
    let s = useActive(b, data, fixed(0.5));
    expect([s.player.hp, s.player.chakra, s.fx.buff?.kind]).toEqual([hp0, ck0 - data.r.kits.gates.activation, 'gates']);
    // Fechar é grátis e também é a ativa do turno.
    expect(canUseActive(s, data)).toBe(false);
    const ups: number[] = [];
    for (let i = 0; i < 12 && s.status === 'ongoing' && s.fx.buff; i++) {
      s = playRoletaRound(s, 'rest', data, fixed(0.99));
      for (const e of s.log) if (e.type === 'gates' && e.action === 'upkeep') ups.push(e.cost);
    }
    expect([...new Set(ups)].slice(0, 3)).toEqual([2, 3, 5]);
    expect(s.log.some((e) => e.type === 'gates' && e.action === 'close' && e.reason === 'chakra')).toBe(true);
    // Fechado e com chakra: abre de novo.
    if (s.status === 'ongoing') {
      const full = { ...s, activeUsed: false, player: { ...s.player, chakra: s.player.maxChakra } };
      expect(canUseActive(full, data)).toBe(true);
    }
  });
});
