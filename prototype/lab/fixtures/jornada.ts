// Runs da Jornada montadas pelas regras reais (seed fixa). Para chegar a uma parada, a fixture JOGA até ela, como o bot
// da simulação (scripts/sim-jornada.ts): lutas pela IA, primeira opção dos eventos, descanso que cura, tesouro aberto.
// Assim a run chega com a equipe, os flags e o nível que ela teria, sem estado inventado.
import type { Difficulty } from '../../../src/core/difficulty';
import { chooseAiAction, chooseAiActive } from '../../../src/core/jornada/ai';
import { awaitingPlayer, current, downed, openBattle, playerAct, startBattle, useFree, useItem } from '../../../src/core/jornada/battle';
import type { JBattle } from '../../../src/core/jornada/types';
import { eventOptions } from '../../../src/core/jornada/events';
import {
  battleSetup,
  chooseBossRelic,
  chooseCore,
  chooseNode,
  choosingNode,
  currentEvent,
  currentStop,
  finishFight,
  gainRelic,
  leaveStop,
  newGenericRun,
  newRun,
  needsCore,
  nodeChoices,
  openTreasure,
  resolveEvent,
  rest,
  runCoreOffer,
  spendItem,
  stopRng,
  type JRun,
} from '../../../src/core/jornada/run';
import { createRng, type Rng } from '../../../src/core/rng';
import { jornadaData } from '../../../src/data/jornada/index';
import type { JornadaData } from '../../../src/core/jornada/data';
import { saveJornada } from '../../../src/state/jornadaSave';
import type { KeyValueStorage } from '../../../src/state/runHistory';

// As fixtures só levam a run até as telas do laboratório (não medem balanceamento): a força por dificuldade de cada tipo
// de run (v0.95.0) fica neutra, para o jogador simples delas chegar às paradas dos cenários.
const neutral = { easy: 1, normal: 1, hard: 1, hardcore: 1 };
const data: JornadaData = { ...jornadaData, j: { ...jornadaData.j, difficultyMult: { story: neutral, generic: neutral } } };

/** Run nova da História (campanha do Naruto). */
export const storyRun = (seed = 7, difficulty: Difficulty = 'normal'): JRun => newRun(seed, difficulty, data);

/** Run nova do Caminho Ninja. */
/** Run do Caminho Ninja; com rascunho (Comum), já com o primeiro núcleo oferecido (`core: false` deixa a escolha pendente). */
export const pathRun = (seed = 7, difficulty: Difficulty = 'normal', classId = 'common', core = true): JRun => {
  const run = newGenericRun(seed, difficulty, classId, data);
  return core && needsCore(run) ? chooseCore(run, runCoreOffer(run, data)[0]!, data) : run;
};

/** Grava a run como o save da Jornada (no armazenamento em memória do cenário). */
export function saveRun(storage: KeyValueStorage, run: JRun): void {
  if (!saveJornada(storage, run)) throw new Error('fixture: o save da Jornada não gravou');
}

/** Joga a luta da parada atual pela IA até vencer (com nova tentativa quando a parada permite) ou cair. */
function autoFight(run0: JRun, rng: Rng): JRun {
  let run = run0;
  for (;;) {
    let b = startBattle(battleSetup(run, data), data, stopRng(run));
    for (let guard = 0; b.status === 'ongoing'; guard++) {
      if (guard > 500 || !awaitingPlayer(b)) throw new Error('fixture: luta parada');
      const me = current(b)!;
      const fallen = downed(b, 'ally');
      if (!b.itemUsed && fallen.length && run.bag.reviveKit > 0) {
        b = useItem(b, 'reviveKit', fallen[0]!.uid, data);
        run = spendItem(run, 'reviveKit');
      } else if (!b.itemUsed && me.hp < me.maxHp * 0.35 && run.bag.hpKit > 0) {
        b = useItem(b, 'hpKit', me.uid, data);
        run = spendItem(run, 'hpKit');
      }
      const free = chooseAiActive(b, me, data, rng);
      if (free) b = useFree(b, free, data, rng);
      b = playerAct(b, chooseAiAction(b, current(b)!, data, rng), data, rng);
    }
    const res = finishFight(run, b, data);
    run = res.run;
    if (!res.outcome.retry) return run;
  }
}

/** Resolve a parada atual (ou a escolha de nó/relíquia) como o bot. */
function step(run: JRun, rng: Rng): JRun {
  if (needsCore(run)) return chooseCore(run, runCoreOffer(run, data)[0]!, data);
  if (run.bossChoice) return chooseBossRelic(run, run.bossChoice[0]!, data);
  if (choosingNode(run)) {
    const nodes = nodeChoices(run);
    return chooseNode(run, (nodes.find((n) => n.kind === 'fight') ?? nodes[0]!).id);
  }
  const stop = currentStop(run, data)!;
  if (stop.kind === 'event') return resolveEvent(run, eventOptions(currentEvent(run, data)!, run.flags, run.ryo)[0]!.id, true, data).run;
  if (stop.kind === 'rest') return rest(run, 'heal', data);
  if (stop.kind === 'treasure') {
    const id = openTreasure(run, data);
    return leaveStop(id ? gainRelic(run, id, data) : run, data);
  }
  return autoFight(run, rng);
}

/** Até onde jogar: o id de uma parada da História, ou um teste sobre a run. */
export type Until = string | ((run: JRun) => boolean);

/**
 * Joga `run` até a condição valer (para antes de resolver essa parada). Erro se a run cair ou acabar antes: o cenário
 * precisa de outra seed ou dificuldade.
 */
export function playUntil(run0: JRun, until: Until, seed = run0.seed): JRun {
  const rng = createRng(seed ^ 0x51ab);
  const test = typeof until === 'string' ? (r: JRun) => !r.bossChoice && !choosingNode(r) && currentStop(r, data)?.id === until : until;
  let run = run0;
  for (let guard = 0; !test(run); guard++) {
    if (run.status !== 'inProgress') throw new Error(`fixture: a run acabou (${run.status}) antes de chegar ao alvo`);
    if (guard > 400) throw new Error('fixture: alvo não alcançado');
    run = step(run, rng);
  }
  return run;
}

/** Joga a run até o fim (vitória ou derrota) e devolve como ficou. */
export const playToEnd = (run: JRun, seed?: number): JRun => playUntil(run, (r) => r.status !== 'inProgress', seed);

/** Luta da parada atual aberta e com ajustes (aliado caído, HP baixo), para começar no meio. */
export function battleAt(run: JRun, patch: (b: JBattle) => JBattle): JBattle {
  return patch(openBattle(battleSetup(run, data), data));
}

/** Derruba os aliados que não são o protagonista (aba Reerguer). */
export const downAllies = (b: JBattle): JBattle => ({
  ...b,
  fighters: b.fighters.map((f) => (f.side === 'ally' && !f.protagonist ? { ...f, hp: 0, down: true } : f)),
});

/** HP de cada lado numa fração do máximo. */
export const hpAt =
  (ally: number, enemy: number) =>
  (b: JBattle): JBattle => ({
    ...b,
    fighters: b.fighters.map((f) => ({ ...f, hp: Math.max(1, Math.floor(f.maxHp * (f.side === 'ally' ? ally : enemy))) })),
  });

