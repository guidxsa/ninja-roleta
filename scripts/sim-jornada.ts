// Simulação da run canônica da Jornada: um bot joga N runs por dificuldade e mostra onde elas param.
// Uso: `npm run sim:jornada -- [runs] [seed]`. O bot joga pior que um humano (não monta moveset, compra
// sem planejar). Os números vão para o usuário decidir; nada é ajustado sozinho.
import { chooseAiAction } from '../src/core/jornada/ai';
import { awaitingPlayer, current, downed, playerAct, startBattle, useItem } from '../src/core/jornada/battle';
import { eventOptions } from '../src/core/jornada/events';
import {
  battleSetup,
  buy,
  canBuy,
  chooseNode,
  choosingNode,
  newGenericRun,
  nodeChoices,
  buyTalent,
  chooseBossRelic,
  currentStop,
  finishFight,
  gainRelic,
  leaveStop,
  memberSheet,
  newRun,
  openTreasure,
  resolveEvent,
  rest,
  shopOffer,
  spendItem,
  stopRng,
  talentContext,
  type JRun,
} from '../src/core/jornada/run';
import { canBuyTalent } from '../src/core/jornada/talents';
import { createRng, type Rng } from '../src/core/rng';
import type { Difficulty } from '../src/core/difficulty';
import { jornadaData as data } from '../src/data/jornada';

const RUNS = Number(process.argv[2] ?? 300);
const SEED = Number(process.argv[3] ?? 1);
const DIFFS: Difficulty[] = ['easy', 'normal', 'hard', 'hardcore'];
const unlocked = new Set<string>();

function fight(run: JRun, rng: Rng): JRun {
  for (;;) {
    let b = startBattle(battleSetup(run, data), data, stopRng(run));
    while (b.status === 'ongoing') {
      if (!awaitingPlayer(b)) throw new Error('luta parada');
      const me = current(b)!;
      const fallen = downed(b, 'ally');
      if (!b.itemUsed && fallen.length && run.bag.reviveKit > 0) {
        b = useItem(b, 'reviveKit', fallen[0]!.uid, data);
        run = spendItem(run, 'reviveKit');
      } else if (!b.itemUsed && me.hp < me.maxHp * 0.35 && run.bag.hpKit > 0) {
        b = useItem(b, 'hpKit', me.uid, data);
        run = spendItem(run, 'hpKit');
      }
      b = playerAct(b, chooseAiAction(b, me, data, rng), data, rng);
    }
    const res = finishFight(run, b, data);
    run = res.run;
    if (!res.outcome.retry) return run;
  }
}

function spendTalents(run: JRun): JRun {
  for (;;) {
    const ctx = talentContext(run, unlocked);
    const node = [...data.talents].sort((a, b) => a.cost - b.cost).find((n) => n.owner === run.hero && canBuyTalent(n, data.talents, ctx));
    if (!node) return run;
    run = buyTalent(run, node.id, unlocked, data);
  }
}

type Mode = 'canon' | 'generic';

/** Caminho no mapa: descanso quando ferido, elite com HP alto, senão o que vier (luta e desconhecido antes). */
function pickNode(run: JRun, rng: Rng): string {
  const sheet = memberSheet(run, run.hero, data);
  const hp = (run.members[run.hero]?.hp ?? sheet.maxHp) / sheet.maxHp;
  const score = (k: string) => (k === 'rest' ? (hp < 0.6 ? 5 : 0) : k === 'elite' ? (hp > 0.8 ? 3 : -2) : k === 'treasure' ? 4 : k === 'shop' ? (run.ryo >= 60 ? 2 : 0) : 1) + rng();
  return [...nodeChoices(run)].sort((a, b) => score(b.kind) - score(a.kind))[0]!.id;
}

function play(seed: number, difficulty: Difficulty, mode: Mode): { run: JRun; stop: string } {
  const rng = createRng(seed);
  let run = mode === 'canon' ? newRun(seed, difficulty, data) : newGenericRun(seed, difficulty, 'common', data);
  let guard = 0;
  while (run.status === 'inProgress') {
    if (++guard > 400) throw new Error('run sem fim');
    run = spendTalents(run);
    if (run.bossChoice) {
      run = chooseBossRelic(run, run.bossChoice[0]!, data);
      continue;
    }
    if (choosingNode(run)) {
      run = chooseNode(run, pickNode(run, rng));
      continue;
    }
    const stop = currentStop(run, data)!;
    if (stop.kind === 'event') {
      const opt = eventOptions(data.events[stop.event]!, run.flags, run.ryo)[0]!;
      run = resolveEvent(run, opt.id, rng() < 0.6, data).run;
    } else if (stop.kind === 'shop') {
      const offer = shopOffer(run, data);
      for (const r of offer.relics) if (canBuy(run, { kind: 'relic', ...r }, data)) run = buy(run, { kind: 'relic', ...r }, data);
      const kit = offer.consumables[0]!;
      if (canBuy(run, { kind: 'item', ...kit }, data)) run = buy(run, { kind: 'item', ...kit }, data);
      run = leaveStop(run, data);
    } else if (stop.kind === 'rest') {
      const hero = memberSheet(run, run.hero, data);
      run = rest(run, (run.members[run.hero]?.hp ?? hero.maxHp) < hero.maxHp * 0.7 ? 'heal' : 'train', data);
    } else if (stop.kind === 'treasure') {
      const id = openTreasure(run, data);
      run = leaveStop(id ? gainRelic(run, id, data) : run, data);
    } else {
      run = fight(run, rng);
      if (run.status === 'defeat') return { run, stop: `${run.stageIndex + 1}:${mode === 'canon' ? stop.id : stop.kind}` };
    }
  }
  return { run, stop: 'vitória' };
}

for (const mode of ['canon', 'generic'] as Mode[]) for (const d of DIFFS) {
  const stops = new Map<string, number>();
  let wins = 0;
  let levels = 0;
  for (let i = 0; i < RUNS; i++) {
    const { run, stop } = play(SEED * 100003 + i, d, mode);
    if (run.status === 'victory') wins++;
    levels += run.level;
    stops.set(stop, (stops.get(stop) ?? 0) + 1);
  }
  const top = [...stops.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${Math.round((n / RUNS) * 100)}%`);
  console.log(`${mode.padEnd(8)} ${d.padEnd(8)} vitória ${Math.round((wins / RUNS) * 100)}% · nível médio ${(levels / RUNS).toFixed(1)} · ${top.join(' · ')}`);
}
