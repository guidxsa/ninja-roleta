// Simulação da História da Jornada: um bot joga N runs por dificuldade e mostra onde elas param.
// Uso: `npm run sim:jornada -- [runs] [seed] [ciclos]`. Com `ciclos` > 0, os vencedores do Caminho Ninja seguem no modo
// infinito até cair (no máximo esse número de ciclos) e sai a curva de sobrevivência por ciclo. O bot joga pior que um humano (não monta moveset, compra
// sem planejar). Os números vão para o usuário decidir; nada é ajustado sozinho.
// `--ramos` (v0.71.0): só a História, uma build focada por ramo da árvore do Naruto (e por par de ramos vizinhos, as
// combinações), no Médio e no Difícil. A build gasta primeiro no ramo, guarda pontos para ele e monta o moveset com as
// técnicas dele; sai a vitória de cada uma, a diferença entre a melhor e a pior e os talentos mais comprados.
import { chooseAiAction, chooseAiActive } from '../src/core/jornada/ai';
import { awaitingPlayer, current, downed, playerAct, startBattle, useFree, useItem } from '../src/core/jornada/battle';
import { eventOptions } from '../src/core/jornada/events';
import {
  battleSetup,
  buy,
  canBuy,
  canContinueCycle,
  chooseNode,
  choosingNode,
  newGenericRun,
  nodeChoices,
  buyTalent,
  heroMovable,
  MOVESET_SIZE,
  setMoveset,
  chooseBossRelic,
  continueCycle,
  currentEvent,
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
import { branchesOf, canBuyTalent, talentState } from '../src/core/jornada/talents';
import { createRng, type Rng } from '../src/core/rng';
import type { Difficulty } from '../src/core/difficulty';
import { jornadaData as data } from '../src/data/jornada';

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const BRANCHES = process.argv.includes('--ramos');
const RUNS = Number(ARGS[0] ?? 300);
const SEED = Number(ARGS[1] ?? 1);
const CYCLES = Number(ARGS[2] ?? 0);
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

/** Ramos em que a build foca (um, ou dois para medir uma combinação); vazio = o bot de sempre (o mais barato). */
let focus: string[] = [];
/** Quantas runs compraram cada talento (só com `--ramos`). */
const bought = new Map<string, number>();

function spendTalents(run: JRun): JRun {
  for (;;) {
    const ctx = talentContext(run, unlocked);
    const mine = data.talents.filter((n) => n.owner === run.hero);
    const inFocus = (n: (typeof mine)[number]) => focus.includes(n.branch) || Boolean(n.requiresAll?.length);
    const cheapest = (list: typeof mine) => [...list].sort((a, b) => a.cost - b.cost || a.tier - b.tier).find((n) => canBuyTalent(n, data.talents, ctx));
    let node = focus.length ? cheapest(mine.filter(inFocus)) : cheapest(mine);
    if (!node && focus.length) {
      // Falta só ponto para o próximo nó do ramo: guarda. Sem nada a esperar (ramo fechado ou ainda preso à história), gasta fora.
      if (mine.some((n) => inFocus(n) && talentState(n, data.talents, ctx) === 'noPoints')) return tuneMoveset(run);
      node = cheapest(mine);
    }
    if (!node) return focus.length ? tuneMoveset(run) : run;
    run = buyTalent(run, node.id, unlocked, data);
  }
}

/** Moveset da build focada: as técnicas do ramo primeiro, depois as de mais dano (o bot padrão não monta moveset). */
function tuneMoveset(run: JRun): JRun {
  const branchTechs = new Set(data.talents.filter((n) => n.owner === run.hero && (focus.includes(n.branch) || n.requiresAll?.length) && n.learn && run.talents.includes(n.id)).map((n) => n.learn!));
  const score = (id: string) => {
    const t = data.techniques[id]!;
    const dmg = t.roll ? 14 : t.baseDamage * (t.hits ?? 1) * (t.target === 'allEnemies' ? 1.6 : 1);
    return (branchTechs.has(id) ? 100 : 0) + (id === 'jStrike' ? 60 : 0) + dmg + (t.onHit ? 6 : 0) + (t.healHp ? 8 : 0);
  };
  const pick = [...heroMovable(run, data)].sort((a, b) => score(b) - score(a)).slice(0, MOVESET_SIZE);
  return pick.length ? setMoveset(run, pick, data) : run;
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
      const opt = eventOptions(currentEvent(run, data)!, run.flags, run.ryo)[0]!;
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

if (BRANCHES) {
  const branches = branchesOf('naruto', data.talents);
  // Uma build por ramo e uma por par de ramos que têm talento de combinação.
  const pairs = data.talents.filter((n) => n.owner === 'naruto' && n.requiresAll?.length).map((n) => [...new Set(n.requiresAll!.map((id) => data.talents.find((t) => t.id === id)!.branch))]);
  const solo = process.argv.includes('--so-ramos');
  const only = process.argv.find((a) => a.startsWith('--ramo='))?.slice(7);
  const builds: { name: string; focus: string[] }[] = [{ name: 'padrão (mais barato)', focus: [] }, ...branches.map((b) => ({ name: b, focus: [b] })), ...(solo ? [] : pairs.map((p) => ({ name: p.join('+'), focus: p })))].filter((b) => !only || b.name === only);
  const diffs: Difficulty[] = ['normal', 'hard'];
  const table: { name: string; pct: number[] }[] = [];
  for (const build of builds) {
    focus = build.focus;
    bought.clear();
    const falls = new Map<string, number>();
    const pct = diffs.map((d) => {
      let wins = 0;
      for (let i = 0; i < RUNS; i++) {
        const { run, stop } = play(SEED * 100003 + i, d, 'canon');
        if (run.status === 'victory') wins++;
        else falls.set(stop, (falls.get(stop) ?? 0) + 1);
        for (const id of run.talents) bought.set(id, (bought.get(id) ?? 0) + 1);
      }
      return Math.round((wins / RUNS) * 1000) / 10;
    });
    table.push({ name: build.name, pct });
    const top = [...bought.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => `${id} ${Math.round((n / (RUNS * diffs.length)) * 100)}%`);
    const where = [...falls.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} ${n}`);
    console.log(`${build.name.padEnd(22)} Médio ${String(pct[0]).padStart(5)}% · Difícil ${String(pct[1]).padStart(5)}% · cai em: ${where.join(', ')}`);
    if (process.argv.includes('--talentos')) console.log(`${''.padEnd(22)} ${top.join(' · ')}`);
  }
  for (const [i, d] of diffs.entries()) {
    const solo = table.filter((t) => branches.includes(t.name)).map((t) => t.pct[i]!);
    console.log(`${d}: diferença entre a melhor e a pior build de um ramo: ${(Math.max(...solo) - Math.min(...solo)).toFixed(1)} pontos`);
  }
  process.exit(0);
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
    if (CYCLES > 0 && canContinueCycle({ ...run, status: 'victory' }, data)) {
      const inf = run.status === 'victory' ? playInfinite(run, rng, mode) : { cyclesWon: 0, level: run.level };
      for (let k = 0; k < inf.cyclesWon; k++) curve[k]!++;
      infiniteLevels += inf.level;
    }
  }
  const top = [...stops.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${Math.round((n / RUNS) * 100)}%`);
  console.log(`${mode.padEnd(15)} ${d.padEnd(8)} vitória ${Math.round((wins / RUNS) * 100)}% · nível médio ${(levels / RUNS).toFixed(1)} · ${top.join(' · ')}`);
  if (CYCLES > 0 && curve.some((n) => n > 0)) {
    const avg = curve.reduce((a, n) => a + n, 0) / RUNS;
    const pts = curve.map((n, k) => `C${k + 1} ${Math.round((n / RUNS) * 100)}%`).join(' · ');
    console.log(`${''.padEnd(15)} ${''.padEnd(8)} infinito: ${pts} · ciclos vencidos (média) ${avg.toFixed(2)} · nível final ${(infiniteLevels / RUNS).toFixed(1)}`);
  }
}
