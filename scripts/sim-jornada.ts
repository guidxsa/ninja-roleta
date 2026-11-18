// Simulação da História da Jornada: um bot joga N runs por dificuldade e mostra onde elas param.
// Uso: `npm run sim:jornada -- [runs] [seed] [ciclos]`. Com `ciclos` > 0, os vencedores do Caminho Ninja seguem no modo
// infinito até cair (no máximo esse número de ciclos) e sai a curva de sobrevivência por ciclo. O bot do protagonista
// (fase 2b, src/sim/jornadaBot.ts) segue um plano de talentos, escolhe a ação por valor esperado e compra kits; ainda
// joga pior que um humano. Os números vão para o usuário decidir; nada é ajustado sozinho.
// `--ramos` (v0.71.0): só a História, uma build focada por ramo da árvore do Naruto (e por par de ramos vizinhos, as
// combinações), no Médio e no Difícil. A build segue o plano com esse ramo como principal (e o par como vizinho) e
// monta o moveset com as técnicas dele; sai a vitória de cada uma, a diferença entre a melhor e a pior e os talentos
// mais comprados.
import { chooseAiAction, chooseAiActive } from '../src/core/jornada/ai';
import { awaitingPlayer, current, downed, openBattle, playerAct, startBattle, useFree, useItem } from '../src/core/jornada/battle';
import { auditJornadaFight, relicCategory, Tally, type FightAudit } from '../src/sim/audit';
import { eventOptions } from '../src/core/jornada/events';
import { botWinChance } from '../src/core/jornada/minigames';
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
  refreshShelf,
  refreshPrice,
  spendItem,
  stopRng,
  talentContext,
  type JRun,
} from '../src/core/jornada/run';
import { branchesOf, canBuyTalent, talentState } from '../src/core/jornada/talents';
import { createRng, type Rng } from '../src/core/rng';
import type { Difficulty } from '../src/core/difficulty';
import type { ConsumableId } from '../src/core/jornada/types';
import { jornadaData as data } from '../src/data/jornada';
import { DEFAULT_RELIC_VALUE, relicValues } from '../src/sim/relicValues';
import { heroAction, heroFree, heroItem, nextTalent, planBuild } from '../src/sim/jornadaBot';
import { spendDraft } from '../src/sim/draftBot';

// Comparar com as regras de antes da v0.93.0: `--sem-rascunho` volta à árvore clássica em todas as classes e
// `--por-golpe` soma o dano fixo e o chakra do taijutsu em cada golpe.
if (process.argv.includes('--sem-rascunho')) (data.j.talentDraft as { owners: string[] }).owners = [];
// `--rascunho=capstoneNeeds:4,rerollsPerStage:0`: testar números do rascunho sem mexer no balance.
for (const kv of process.argv.find((a) => a.startsWith('--rascunho='))?.slice(11).split(',') ?? []) {
  const [k, v] = kv.split(':');
  (data.j.talentDraft as Record<string, unknown>)[k!] = v === 'true' ? true : v === 'false' ? false : Number(v);
}
if (process.argv.includes('--por-golpe')) (data.j.combat as { flatPerTechnique: boolean }).flatPerTechnique = false;

const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const BRANCHES = process.argv.includes('--ramos');
/**
 * `--bot-antigo`: o bot de antes da fase 2b (talento mais barato, ação pela IA dos suportes, sem comprar kits), para
 * comparar. Para separar o efeito de cada parte do bot novo: `--sem-plano` (talentos), `--sem-acoes` (luta e itens) e
 * `--sem-kits` (loja).
 */
const OLD_BOT = process.argv.includes('--bot-antigo');
const OLD_TALENTS = OLD_BOT || process.argv.includes('--sem-plano');
const OLD_ACTIONS = OLD_BOT || process.argv.includes('--sem-acoes');
const OLD_SHOP = OLD_BOT || process.argv.includes('--sem-kits');
const RUNS = Number(ARGS[0] ?? 300);
const SEED = Number(ARGS[1] ?? 1);
const CYCLES = Number(ARGS[2] ?? 0);
const DIFFS: Difficulty[] = ['easy', 'normal', 'hard', 'hardcore'];
const unlocked = new Set<string>();

// `--auditoria` (docs/balanceamento/benchmark.md): indicadores por estágio, sem mudar o jogo nem o rng.
const AUDIT = process.argv.includes('--auditoria');
const tally = new Tally();
/** Chave da célula auditada agora ("canon|normal|"); o estágio entra por cima ("s1:"). */
let cell = '';
const stageKey = (run: JRun) => `${cell}s${run.stageIndex + 1}:`;
/** Entrada da última luta (para separar a derrota por desgaste da derrota de frente). */
let lastFight: FightAudit | null = null;

function fight(run: JRun, rng: Rng): JRun {
  for (;;) {
    const setup = battleSetup(run, data);
    const start = AUDIT ? openBattle(setup, data) : null;
    let b = startBattle(setup, data, stopRng(run));
    while (b.status === 'ongoing') {
      if (!awaitingPlayer(b)) throw new Error('luta parada');
      const me = current(b)!;
      if (OLD_ACTIONS) {
        const fallen = downed(b, 'ally');
        if (!b.itemUsed && fallen.length && run.bag.reviveKit > 0) {
          b = useItem(b, 'reviveKit', fallen[0]!.uid, data);
          run = spendItem(run, 'reviveKit');
          if (AUDIT) tally.add(`${stageKey(run)}kits`, 1);
        } else if (!b.itemUsed && me.hp < me.maxHp * 0.35 && run.bag.hpKit > 0) {
          b = useItem(b, 'hpKit', me.uid, data);
          run = spendItem(run, 'hpKit');
          if (AUDIT) tally.add(`${stageKey(run)}kits`, 1);
        }
        // Ativa grátis (ou troca de portão) antes da ação, como a IA dos outros lutadores.
        const free = chooseAiActive(b, me, data, rng);
        if (free) b = useFree(b, free, data, rng);
        b = playerAct(b, chooseAiAction(b, current(b)!, data, rng), data, rng);
        continue;
      }
      // Bot da fase 2b (src/sim/jornadaBot.ts): item, ativa grátis e a ação de maior valor.
      const item = heroItem(b, me, run.bag, data);
      if (item) {
        b = useItem(b, item.item, item.target, data);
        run = spendItem(run, item.item);
        if (AUDIT) tally.add(`${stageKey(run)}kits`, 1);
      }
      const free = heroFree(b, current(b)!, data, rng);
      if (free) b = useFree(b, free, data, rng);
      b = playerAct(b, heroAction(b, current(b)!, data, rng), data, rng);
    }
    if (start) {
      lastFight = auditJornadaFight(start, b);
      tally.addFight(stageKey(run), lastFight);
    }
    const res = finishFight(run, b, data);
    if (AUDIT && res.outcome.retry) tally.add(`${stageKey(run)}willOfFire`, 1);
    run = res.run;
    if (!res.outcome.retry) return run;
  }
}

/** Ryō e pontos de talento que um passo da run deu ou gastou (só com `--auditoria`). */
function auditStep(before: JRun, after: JRun, kind: 'shop' | 'talents' | 'rest' | 'other'): void {
  if (!AUDIT) return;
  const key = stageKey(before);
  const ryo = after.ryo - before.ryo;
  if (ryo > 0) tally.add(`${key}ryoIn`, ryo);
  if (ryo < 0) tally.add(`${key}ryoOut`, -ryo);
  if (kind === 'shop') {
    tally.add(`${key}buys`, after.relics.length - before.relics.length + Math.max(0, bagSize(after) - bagSize(before)));
  }
  const pts = after.talentPoints - before.talentPoints;
  if (kind === 'talents') tally.add(`${key}talents`, after.talents.length - before.talents.length);
  else if (pts > 0) {
    tally.add(`${key}ptsIn`, pts);
    if (kind === 'rest') tally.add(`${key}ptsTraining`, pts);
  }
}
const bagSize = (run: JRun) => Object.values(run.bag).reduce((a, n) => a + n, 0);

/** Valor medido da relíquia (src/sim/relicValues.ts). */
const relicValue = (id: string) => relicValues[id] ?? DEFAULT_RELIC_VALUE;
/** Relíquia abaixo disto não vale o ryō (o bot guarda para a próxima loja). */
const MIN_RELIC_VALUE = 2;

/**
 * Loja a cada parada (v0.82.0, J6): com o protagonista abaixo de 50% do HP, o tratamento (ou o kit de HP, se não der);
 * depois, a relíquia de maior valor medido que couber; se nada na prateleira vale a pena e sobra ryō, atualiza uma vez.
 */
function shopTurn(run0: JRun): JRun {
  let run = openShop(run0, data);
  const hero = memberSheet(run, run.hero, data);
  if ((run.members[run.hero]?.hp ?? hero.maxHp) < hero.maxHp * 0.5) {
    const offer = shopOffer(run, data);
    const treat = { kind: 'treatment' as const, price: offer.treatment };
    const kit = { kind: 'item' as const, ...offer.consumables.find((c) => c.id === 'hpKit')! };
    if (canBuy(run, treat, data)) run = buy(run, treat, data);
    else if (canBuy(run, kit, data)) run = buy(run, kit, data);
  }
  const best = () =>
    shopOffer(run, data)
      .relics.filter((r) => canBuy(run, { kind: 'relic', ...r }, data) && relicValue(r.id) >= MIN_RELIC_VALUE)
      .sort((a, b) => relicValue(b.id) - relicValue(a.id))[0];
  let relic = best();
  const cheapest = Math.min(...Object.values(data.j.relics.price));
  if (!relic && (run.shop?.refreshes ?? 0) === 0 && run.ryo - refreshPrice(run, data) >= cheapest) {
    run = refreshShelf(run, data);
    relic = best();
  }
  if (relic) run = buy(run, { kind: 'relic', ...relic }, data);
  return OLD_SHOP ? run : buyKits(run);
}

/**
 * Kits com o ryō que sobra (fase 2b): reanimação, HP e chakra até uma meta por item, que cresce com os espaços a mais da
 * bolsa (Selo de cliente, Bolsa resistente). Guarda o preço da relíquia mais barata para a próxima loja.
 */
function buyKits(run0: JRun): JRun {
  let run = run0;
  const reserve = Math.min(...Object.values(data.j.relics.price));
  const extra = run.relics.reduce((a, id) => a + (data.relics.find((r) => r.id === id)?.bagBonus ?? 0), 0);
  const want: Record<ConsumableId, number> = { reviveKit: 1 + Math.floor(extra / 3), hpKit: 2 + Math.ceil(extra / 2), chakraKit: 1 + Math.floor(extra / 3) };
  for (const id of ['reviveKit', 'hpKit', 'chakraKit'] as ConsumableId[]) {
    for (;;) {
      const offer = shopOffer(run, data).consumables.find((c) => c.id === id)!;
      const p = { kind: 'item' as const, ...offer };
      if (run.bag[id] >= want[id] || !canBuy(run, p, data) || run.ryo - offer.price < reserve) break;
      run = buy(run, p, data);
    }
  }
  return run;
}

/** Ramos em que a build foca (um, ou dois para medir uma combinação); vazio = o bot de sempre (o mais barato). */
let focus: string[] = [];
/** Quantas runs compraram cada talento (só com `--ramos`). */
const bought = new Map<string, number>();

function spendTalents(run: JRun): JRun {
  if (OLD_TALENTS) return spendTalentsOld(run);
  // Rascunho (v0.93.0): núcleo e oferta por pontuação; a build focada força o núcleo do ramo.
  if (run.draft) {
    const next = spendDraft(run, data, unlocked, focus[0]);
    return focus.length ? tuneMoveset(next, []) : next;
  }
  // Plano de build (src/sim/jornadaBot.ts): um ramo até o final, a junção do vizinho e as combinações; guarda ponto
  // quando o próximo passo do plano só espera ponto.
  for (;;) {
    const ctx = talentContext(run, unlocked);
    const plan = planBuild(run.hero, data.talents, ctx, data, focus);
    const next = nextTalent(run.hero, data.talents, ctx, plan);
    if (!next || next === 'wait') return tuneMoveset(run, plan ? [plan.primary, ...(plan.secondary ? [plan.secondary] : [])] : []);
    run = buyTalent(run, next, unlocked, data);
  }
}

/** O bot de antes (`--bot-antigo`): o talento mais barato, ou o mais barato do ramo focado (`--ramos`). */
function spendTalentsOld(run: JRun): JRun {
  for (;;) {
    const ctx = talentContext(run, unlocked);
    const mine = data.talents.filter((n) => n.owner === run.hero);
    const inFocus = (n: (typeof mine)[number]) => focus.includes(n.branch) || Boolean(n.requiresAll?.length);
    const cheapest = (list: typeof mine) => [...list].sort((a, b) => a.cost - b.cost || a.tier - b.tier).find((n) => canBuyTalent(n, data.talents, ctx));
    let node = focus.length ? cheapest(mine.filter(inFocus)) : cheapest(mine);
    if (!node && focus.length) {
      // Falta só ponto para o próximo nó do ramo: guarda. Sem nada a esperar (ramo fechado ou ainda preso à história), gasta fora.
      if (mine.some((n) => inFocus(n) && talentState(n, data.talents, ctx) === 'noPoints')) return tuneMoveset(run, focus);
      node = cheapest(mine);
    }
    if (!node) return focus.length ? tuneMoveset(run, focus) : run;
    run = buyTalent(run, node.id, unlocked, data);
  }
}

/** Moveset da build: as técnicas dos ramos do plano primeiro, depois as de mais dano. */
function tuneMoveset(run: JRun, branches: string[]): JRun {
  const branchTechs = new Set(data.talents.filter((n) => n.owner === run.hero && (branches.includes(n.branch) || n.requiresAll?.length) && n.learn && run.talents.includes(n.id)).map((n) => n.learn!));
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

/** Remendo no começo da run (auditoria de relíquias): dar uma relíquia, tirar a inicial, dar a evolução. */
let patch: ((run: JRun) => JRun) | null = null;

function newModeRun(seed: number, difficulty: Difficulty, mode: Mode): JRun {
  const cls = mode === 'generic:prodigy' ? 'common' : mode.split(':')[1]!;
  // O Comum sorteia o elemento (e ganha a relíquia do sorteio); o prodígio é escolhido direto (sem elemento).
  const run = mode === 'canon' ? newRun(seed, difficulty, data) : newGenericRun(seed, difficulty, cls, data, UNLOCKED, null, mode === 'generic:prodigy' ? null : 'random');
  return patch ? patch(run) : run;
}

/** Vitória (%) de `runs` runs de um modo e dificuldade, com o remendo de agora. */
function winRate(mode: Mode, d: Difficulty, runs: number): number {
  let wins = 0;
  for (let i = 0; i < runs; i++) if (play(SEED * 100003 + i, d, mode).run.status === 'victory') wins++;
  return (wins / runs) * 100;
}

// `--reliquias` (docs/balanceamento/benchmark.md): valor marginal de cada relíquia (a vitória com ela desde o começo,
// menos a linha de base) na História e no Comum, e quanto cada classe depende da inicial. No Difícil: no Médio a
// vitória fica perto do teto e o efeito some. As mesmas seeds em todas as medidas (comparação pareada).
if (process.argv.includes('--reliquias')) {
  const d: Difficulty = 'hard';
  const modes = ['canon', 'generic:common'];
  patch = null;
  const base = modes.map((m) => winRate(m, d, RUNS));
  console.log(`Valor marginal das relíquias · Difícil · ${RUNS} runs · linha de base: História ${base[0]!.toFixed(1)}% · Comum ${base[1]!.toFixed(1)}%`);
  console.log('relíquia | classificação | categoria | História Δ | Comum Δ | média Δ');
  // `--so=id1,id2`: só essas relíquias (e sem a parte das iniciais).
  const only = process.argv.find((a) => a.startsWith('--so='))?.slice(5).split(',');
  const pool = data.relics.filter((r) => !['starter', 'special'].includes(r.tier) && !r.evolves && !r.storyEvolves && (!only || only.includes(r.id)));
  for (const r of pool) {
    patch = (run) => gainRelic(run, r.id, data);
    const deltas = modes.map((m, i) => winRate(m, d, RUNS) - base[i]!);
    console.log(`${r.id} | ${r.tier} | ${relicCategory(r)} | ${deltas.map((x) => x.toFixed(1)).join(' | ')} | ${((deltas[0]! + deltas[1]!) / 2).toFixed(1)}`);
  }
  if (!only) starterAudit();
  process.exit(0);
}

/** Inicial de cada run (o Comum sem elemento vira prodígio e leva a do prodígio) e a evolução dela. */
function starterOf(run: JRun): { starter?: string; evo?: string } {
  const starter = run.relics.find((id) => data.relics.find((r) => r.id === id)?.tier === 'starter');
  return { starter, evo: data.relics.find((r) => r.evolves === starter)?.id };
}

/** Vitória de cada classe sem a inicial, com ela e com a evolução desde o começo (Médio e Difícil). */
function starterAudit(): void {
  console.log(`\nRelíquias iniciais · ${RUNS} runs (vitória: sem a inicial · com a inicial · com a evolução desde o começo)`);
  for (const mode of ['generic:common', 'generic:prodigy', 'generic:uchiha', 'generic:hyuuga']) {
    for (const diff of ['normal', 'hard'] as Difficulty[]) {
      patch = null;
      const withIt = winRate(mode, diff, RUNS);
      patch = (run) => ({ ...run, relics: run.relics.filter((id) => id !== starterOf(run).starter) });
      const without = winRate(mode, diff, RUNS);
      patch = (run) => {
        const { evo } = starterOf(run);
        return evo ? gainRelic(run, evo, data) : run;
      };
      const evolved = winRate(mode, diff, RUNS);
      patch = null;
      const names = starterOf(newModeRun(SEED * 100003 + 1, diff, mode));
      console.log(`${mode} | ${diff} | ${names.starter} → ${names.evo} | ${without.toFixed(1)} · ${withIt.toFixed(1)} · ${evolved.toFixed(1)}`);
    }
  }
}

if (process.argv.includes('--iniciais')) {
  starterAudit();
  process.exit(0);
}

function play(seed: number, difficulty: Difficulty, mode: Mode): { run: JRun; stop: string; rng: Rng } {
  const rng = createRng(seed);
  return { ...playCycle(newModeRun(seed, difficulty, mode), rng, mode), rng };
}

/** Joga um ciclo (a run inteira, fora do modo infinito) até a vitória ou a derrota. */
function playCycle(run0: JRun, rng: Rng, mode: Mode): { run: JRun; stop: string } {
  let run = run0;
  let guard = 0;
  // Nível ao fim de cada estágio (quando o estágio vira ou a run acaba).
  const closeStage = (from: JRun, to: JRun) => {
    if (AUDIT && (to.stageIndex !== from.stageIndex || to.status !== 'inProgress')) tally.add(`${stageKey(from)}level`, to.level);
  };
  while (run.status === 'inProgress') {
    if (++guard > 400) throw new Error('ciclo sem fim');
    const t0 = run;
    run = spendTalents(run);
    auditStep(t0, run, 'talents');
    const s0 = run;
    run = shopTurn(run);
    auditStep(s0, run, 'shop');
    const before = run;
    if (run.bossChoice) {
      // Baú do chefe pela mesma regra: a de maior valor medido (v0.82.0).
      run = chooseBossRelic(run, [...run.bossChoice].sort((a, b) => relicValue(b) - relicValue(a))[0]!, data);
      auditStep(before, run, 'other');
      closeStage(before, run);
      continue;
    }
    if (choosingNode(run)) {
      run = chooseNode(run, pickNode(run, rng));
      continue;
    }
    const stop = currentStop(run, data)!;
    if (stop.kind === 'event') {
      const opt = eventOptions(currentEvent(run, data)!, run.flags, run.ryo)[0]!;
      run = resolveEvent(run, opt.id, rng() < botWinChance(opt.minigame, run.difficulty, data.j.minigames), data).run;
      auditStep(before, run, 'other');
    } else if (stop.kind === 'rest') {
      const hero = memberSheet(run, run.hero, data);
      run = rest(run, (run.members[run.hero]?.hp ?? hero.maxHp) < hero.maxHp * 0.7 ? 'heal' : 'train', data);
      auditStep(before, run, 'rest');
    } else if (stop.kind === 'treasure') {
      const id = openTreasure(run, data);
      run = leaveStop(id ? gainRelic(run, id, data) : run, data);
      auditStep(before, run, 'other');
    } else {
      run = fight(run, rng);
      auditStep(before, run, 'other');
      if (run.status === 'defeat') {
        if (AUDIT) tally.add(`${stageKey(before)}${lastFight && lastFight.hpPct < 0.5 ? 'lossAttrition' : 'lossHeadOn'}`, 1);
        closeStage(before, run);
        return { run, stop: `${run.stageIndex + 1}:${mode === 'canon' ? stop.id : stop.kind}` };
      }
    }
    closeStage(before, run);
  }
  return { run, stop: 'vitória' };
}

/** Tabela da auditoria de uma célula: uma linha por estágio (médias por run, ou por luta nas colunas de luta). */
function printAudit(prefix: string, runs: number, stages: number): void {
  const cols = 'est | nível | pts (treino) | talentos | ryō +/− | compras | kits | entrada HP/ck | equipe | rodadas | dano dado/recebido por rodada | caídos | Vontade | derrota desgaste/frente';
  console.log(`  ${cols}`);
  const per = (k: string) => (tally.sum(k) / runs).toFixed(1);
  const pct = (k: string) => `${Math.round(tally.mean(k) * 100)}%`;
  for (let s = 1; s <= stages; s++) {
    const k = `${prefix}s${s}:`;
    if (!tally.count(`${k}rounds`)) continue;
    console.log(
      `  ${s} | ${tally.mean(`${k}level`).toFixed(1)} | ${per(`${k}ptsIn`)} (${per(`${k}ptsTraining`)}) | ${per(`${k}talents`)} | ${per(`${k}ryoIn`)}/${per(`${k}ryoOut`)} | ${per(`${k}buys`)} | ${per(`${k}kits`)} | ${pct(`${k}hpPct`)}/${pct(`${k}chakraPct`)} | ${pct(`${k}teamHpPct`)} | ${tally.mean(`${k}rounds`).toFixed(1)} | ${tally.mean(`${k}dealtPerRound`).toFixed(1)}/${tally.mean(`${k}takenPerRound`).toFixed(1)} | ${tally.mean(`${k}downed`).toFixed(2)} | ${per(`${k}willOfFire`)} | ${per(`${k}lossAttrition`)}/${per(`${k}lossHeadOn`)}`,
    );
  }
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
  // `--classe=commonNinja` (ou prodigy, uchihaNinja, hyuugaNinja) mede as builds de uma classe no Caminho Ninja (v0.84.0);
  // sem ela, as do Naruto na História.
  const owner = process.argv.find((a) => a.startsWith('--classe='))?.slice(9) ?? 'naruto';
  const classMode = { commonNinja: 'generic:common', prodigy: 'generic:prodigy', uchihaNinja: 'generic:uchiha', hyuugaNinja: 'generic:hyuuga' } as Record<string, Mode>;
  const buildMode: Mode = owner === 'naruto' ? 'canon' : classMode[owner]!;
  const branches = branchesOf(owner, data.talents);
  // Uma build por ramo e uma por par de ramos que têm talento de combinação.
  const pairs = [...new Map(data.talents.filter((n) => n.owner === owner && n.requiresAll?.length).map((n) => [...new Set(n.requiresAll!.map((id) => data.talents.find((t) => t.id === id)!.branch))]).map((p) => [[...p].sort().join('+'), p] as const)).values()];
  const solo = process.argv.includes('--so-ramos');
  const only = process.argv.find((a) => a.startsWith('--ramo='))?.slice(7);
  const builds: { name: string; focus: string[] }[] = [{ name: OLD_TALENTS ? 'padrão (mais barato)' : 'padrão (plano)', focus: [] }, ...branches.map((b) => ({ name: b, focus: [b] })), ...(solo ? [] : pairs.map((p) => ({ name: p.join('+'), focus: p })))].filter((b) => !only || b.name === only);
  const diffs: Difficulty[] = ['normal', 'hard'];
  const table: { name: string; pct: number[] }[] = [];
  for (const build of builds) {
    focus = build.focus;
    bought.clear();
    const falls = new Map<string, number>();
    const pct = diffs.map((d) => {
      let wins = 0;
      for (let i = 0; i < RUNS; i++) {
        const { run, stop } = play(SEED * 100003 + i, d, buildMode);
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

// `--modo=canon` (ou generic:common...) mede só esse modo; `--dif=normal,hard` só essas dificuldades.
const ONLY_MODE = process.argv.find((a) => a.startsWith('--modo='))?.slice(7);
const ONLY_DIFF = process.argv.find((a) => a.startsWith('--dif='))?.slice(6).split(',');
// `--json`: no fim, uma linha META_JSON com a vitória por modo e dificuldade (scripts/check-meta.ts).
const metaRows: { grupo: string; dif: Difficulty; vitoria: number }[] = [];
for (const mode of ['canon', 'generic:common', 'generic:prodigy', 'generic:uchiha', 'generic:hyuuga'].filter((m) => !ONLY_MODE || m === ONLY_MODE)) for (const d of DIFFS.filter((x) => !ONLY_DIFF || ONLY_DIFF.includes(x))) {
  cell = `${mode}|${d}|`;
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
  metaRows.push({ grupo: mode, dif: d, vitoria: wins / RUNS });
  const top = [...stops.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${Math.round((n / RUNS) * 100)}%`);
  console.log(`${mode.padEnd(15)} ${d.padEnd(8)} vitória ${Math.round((wins / RUNS) * 100)}% · nível médio ${(levels / RUNS).toFixed(1)} · ${top.join(' · ')}`);
  if (AUDIT) printAudit(cell, RUNS, mode === 'canon' ? data.stages.length : data.generic.stages.length);
  if (CYCLES > 0 && curve.some((n) => n > 0)) {
    const avg = curve.reduce((a, n) => a + n, 0) / RUNS;
    const pts = curve.map((n, k) => `C${k + 1} ${Math.round((n / RUNS) * 100)}%`).join(' · ');
    console.log(`${''.padEnd(15)} ${''.padEnd(8)} infinito: ${pts} · ciclos vencidos (média) ${avg.toFixed(2)} · nível final ${(infiniteLevels / RUNS).toFixed(1)}`);
  }
}
if (process.argv.includes('--json')) console.log(`META_JSON ${JSON.stringify(metaRows)}`);
