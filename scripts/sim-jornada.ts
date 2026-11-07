// Simulação da História da Jornada: um bot joga N runs por dificuldade e mostra onde elas param.
// Uso: `npm run sim:jornada -- [runs] [seed] [ciclos]`. Com `ciclos` > 0, os vencedores do Caminho Ninja seguem no modo
// infinito até cair (no máximo esse número de ciclos) e sai a curva de sobrevivência por ciclo. O bot joga pior que um humano (não monta moveset, compra
// sem planejar). Os números vão para o usuário decidir; nada é ajustado sozinho.
import { chooseAiAction, chooseAiActive } from '../src/core/jornada/ai';
import { awaitingPlayer, current, downed, playerAct, startBattle, useFree, useItem } from '../src/core/jornada/battle';
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
  continueCycle,
  currentStop,
  finishFight,
  gainRelic,
  leaveStop,
  memberSheet,
  newRun,
  openShop,
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
const CYCLES = Number(process.argv[4] ?? 0);
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
      // Ativa grátis (ou troca de portão) antes da ação, como a IA dos outros lutadores.
      const free = chooseAiActive(b, me, data, rng);
      if (free) b = useFree(b, free, data, rng);
      b = playerAct(b, chooseAiAction(b, current(b)!, data, rng), data, rng);
    }
    const res = finishFight(run, b, data);
    run = res.run;
    if (!res.outcome.retry) return run;
  }
}

/** Loja a cada parada: kit de HP se a vida está abaixo da metade; senão, a relíquia mais barata que couber. */
function shopTurn(run0: JRun): JRun {
  let run = openShop(run0, data);
  const hero = memberSheet(run, run.hero, data);
  const kit = shopOffer(run, data).consumables.find((c) => c.id === 'hpKit')!;
  if ((run.members[run.hero]?.hp ?? hero.maxHp) < hero.maxHp * 0.5 && canBuy(run, { kind: 'item', ...kit }, data)) run = buy(run, { kind: 'item', ...kit }, data);
  const relic = shopOffer(run, data).relics.filter((r) => canBuy(run, { kind: 'relic', ...r }, data)).sort((a, b) => a.price - b.price)[0];
  return relic ? buy(run, { kind: 'relic', ...relic }, data) : run;
}

function spendTalents(run: JRun): JRun {
  for (;;) {
    const ctx = talentContext(run, unlocked);
    const node = [...data.talents].sort((a, b) => a.cost - b.cost).find((n) => n.owner === run.hero && canBuyTalent(n, data.talents, ctx));
    if (!node) return run;
    run = buyTalent(run, node.id, unlocked, data);
  }
}

/** História ou Caminho Ninja com a classe ('generic:uchiha'). */
type Mode = string;
const UNLOCKED = new Set(['j_unlockUchiha', 'j_unlockHyuuga']);

/** Caminho no mapa: descanso quando ferido, elite com HP alto, senão o que vier (luta e desconhecido antes). */
function pickNode(run: JRun, rng: Rng): string {
  const sheet = memberSheet(run, run.hero, data);
  const hp = (run.members[run.hero]?.hp ?? sheet.maxHp) / sheet.maxHp;
  const score = (k: string) => (k === 'rest' ? (hp < 0.6 ? 5 : 0) : k === 'elite' ? (hp > 0.8 ? 3 : -2) : k === 'treasure' ? 4 : 1) + rng();
  return [...nodeChoices(run)].sort((a, b) => score(b.kind) - score(a.kind))[0]!.id;
}

function newModeRun(seed: number, difficulty: Difficulty, mode: Mode): JRun {
  const cls = mode === 'generic:prodigy' ? 'common' : mode.split(':')[1]!;
  // O Comum sorteia o elemento (e ganha a relíquia do sorteio); o prodígio é escolhido direto (sem elemento).
  return mode === 'canon' ? newRun(seed, difficulty, data) : newGenericRun(seed, difficulty, cls, data, UNLOCKED, null, mode === 'generic:prodigy' ? null : 'random');
}

function play(seed: number, difficulty: Difficulty, mode: Mode): { run: JRun; stop: string; rng: Rng } {
  const rng = createRng(seed);
  return { ...playCycle(newModeRun(seed, difficulty, mode), rng, mode), rng };
}

/** Joga um ciclo (a run inteira, fora do modo infinito) até a vitória ou a derrota. */
function playCycle(run0: JRun, rng: Rng, mode: Mode): { run: JRun; stop: string } {
  let run = run0;
  let guard = 0;
  while (run.status === 'inProgress') {
    if (++guard > 400) throw new Error('ciclo sem fim');
    run = shopTurn(spendTalents(run));
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

/** Modo infinito: o vencedor segue de ciclo até cair ou chegar ao teto. Devolve quantos ciclos venceu e o nível final. */
function playInfinite(first: JRun, rng: Rng, mode: Mode): { cyclesWon: number; level: number } {
  let run = first;
  let cyclesWon = 1;
  while (cyclesWon < CYCLES) {
    run = playCycle(continueCycle(run, data, unlocked), rng, mode).run;
    if (run.status !== 'victory') break;
    cyclesWon++;
  }
  return { cyclesWon, level: run.level };
}

for (const mode of ['canon', 'generic:common', 'generic:prodigy', 'generic:uchiha', 'generic:hyuuga']) for (const d of DIFFS) {
  const stops = new Map<string, number>();
  let wins = 0;
  let levels = 0;
  // Curva do infinito: quantas runs venceram o ciclo k (k = 1..CYCLES).
  const curve = Array.from({ length: CYCLES }, () => 0);
  let infiniteLevels = 0;
  for (let i = 0; i < RUNS; i++) {
    const { run, stop, rng } = play(SEED * 100003 + i, d, mode);
    if (run.status === 'victory') wins++;
    levels += run.level;
    stops.set(stop, (stops.get(stop) ?? 0) + 1);
    if (CYCLES > 0 && mode !== 'canon') {
      const inf = run.status === 'victory' ? playInfinite(run, rng, mode) : { cyclesWon: 0, level: run.level };
      for (let k = 0; k < inf.cyclesWon; k++) curve[k]!++;
      infiniteLevels += inf.level;
    }
  }
  const top = [...stops.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${Math.round((n / RUNS) * 100)}%`);
  console.log(`${mode.padEnd(15)} ${d.padEnd(8)} vitória ${Math.round((wins / RUNS) * 100)}% · nível médio ${(levels / RUNS).toFixed(1)} · ${top.join(' · ')}`);
  if (CYCLES > 0 && mode !== 'canon') {
    const avg = curve.reduce((a, n) => a + n, 0) / RUNS;
    const pts = curve.map((n, k) => `C${k + 1} ${Math.round((n / RUNS) * 100)}%`).join(' · ');
    console.log(`${''.padEnd(15)} ${''.padEnd(8)} infinito: ${pts} · ciclos vencidos (média) ${avg.toFixed(2)} · nível final ${(infiniteLevels / RUNS).toFixed(1)}`);
  }
}
