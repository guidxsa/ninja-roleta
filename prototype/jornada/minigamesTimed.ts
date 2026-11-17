// Minijogos de tempo da Jornada (v0.91.0): kunai no alvo, andar sobre a água, o clone verdadeiro e pegar o sino
// (docs/jornada/run.md#minijogos). O core (src/core/jornada/minigames.ts) sorteia o roteiro e julga; aqui só se desenha
// o tick atual e se mandam os toques. Cada jogo tem a variante sem pressa, por escolha e sem reflexo.
import type { Difficulty } from '../../src/core/difficulty';
import type { JornadaData } from '../../src/core/jornada/data';
import type { MinigameSkin } from '../../src/core/jornada/events';
import {
  bellCalmJudge,
  bellJudge,
  bellResult,
  bellScript,
  cloneCheck,
  clonePosition,
  cloneScript,
  kunaiCalmPos,
  kunaiPoints,
  kunaiPos,
  kunaiSetup,
  kunaiWon,
  kunaiZone,
  waterCalmHint,
  waterCalmResult,
  waterCalmStep,
  waterInBand,
  waterResult,
  waterSetup,
  waterStart,
  waterStep,
  type BellJudge,
  type MinigameBonus,
  type WaterState,
} from '../../src/core/jornada/minigames';
import type { Rng } from '../../src/core/rng';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { icon } from '../art';
import { h, sleep } from '../dom';
import { tip } from '../tooltip';

const M = S.jornada.minigames;

export interface TimedOpts {
  difficulty: Difficulty;
  bonus: MinigameBonus;
  skin?: MinigameSkin;
  instant: boolean;
  /** Começa na variante sem pressa (menos movimento pedido, ou escolhida antes). */
  calm: boolean;
  /** Guarda a escolha do botão Sem pressa. */
  setCalm?: (on: boolean) => void;
}

/** Cabeçalho comum: título, ajuda de uma linha, a dica com as regras e o par Sem pressa / Começar. */
function frame(slot: HTMLElement, title: string, help: string, rules: string, calmRules: string, opts: TimedOpts) {
  const box = h(`<div class="mg mg-timed" role="group" aria-label="${M.board(title)}">
    <h3>${title} <button type="button" class="mg-info" aria-label="${M.rulesTip}"${tip(title, rules)}>${icon('info')}</button></h3>
    <p class="muted small mg-help">${help}</p>
    <p class="mg-status" aria-live="polite"></p>
    <div class="mg-board"></div>
    <div class="mg-actions row center-row"></div></div>`);
  slot.replaceChildren(box);
  const status = box.querySelector<HTMLElement>('.mg-status')!;
  const board = box.querySelector<HTMLElement>('.mg-board')!;
  const actions = box.querySelector<HTMLElement>('.mg-actions')!;
  const helpEl = box.querySelector<HTMLElement>('.mg-help')!;
  /** Espera o Começar; o botão Sem pressa troca a variante antes. Devolve se joga sem pressa. */
  const start = (): Promise<boolean> =>
    new Promise((resolve) => {
      let calm = opts.calm;
      const render = () => {
        actions.innerHTML = `<button type="button" class="btn mg-calm" aria-pressed="${calm}"${tip(M.calmToggle, M.calmTip)}>${icon('timer')} ${M.calmToggle}</button>
          <button type="button" class="btn primary big mg-start">${M.start}</button>`;
        helpEl.textContent = calm ? calmRules : help;
      };
      render();
      actions.addEventListener('click', function onClick(ev) {
        const b = (ev.target as HTMLElement).closest('button');
        if (!b) return;
        if (b.classList.contains('mg-calm')) {
          calm = !calm;
          opts.setCalm?.(calm);
          render();
          return;
        }
        if (!b.classList.contains('mg-start')) return;
        actions.removeEventListener('click', onClick);
        actions.innerHTML = '';
        resolve(calm);
      });
      actions.querySelector<HTMLElement>('.mg-start')?.focus();
    });
  /** Botões de escolha da variante sem pressa; devolve o `data-act` tocado. */
  const ask = <T extends string>(buttons: { act: T; label: string; off?: boolean }[]): Promise<T> =>
    new Promise((resolve) => {
      actions.innerHTML = buttons
        .map((b) => `<button type="button" class="btn big" data-act="${b.act}"${b.off ? ' disabled' : ''}>${b.label}</button>`)
        .join('');
      actions.querySelector<HTMLElement>('button:not([disabled])')?.focus();
      actions.addEventListener('click', function onClick(ev) {
        const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
        if (!b || b.disabled) return;
        actions.removeEventListener('click', onClick);
        actions.innerHTML = '';
        resolve(b.dataset.act as T);
      });
    });
  return { box, status, board, actions, start, ask };
}

/**
 * Laço de tempo: chama `onTick(tick, toques desde o último tick)` a cada tick passado e para quando ele devolve
 * `true`. Os toques vêm do botão grande do tabuleiro (ponteiro, ou Espaço / Enter com o foco nele).
 */
function runTicks(hit: HTMLElement, tickMs: number, onTick: (tick: number, taps: number) => boolean): Promise<void> {
  return new Promise((resolve) => {
    let taps = 0;
    let done = false;
    const tap = (ev: Event) => {
      ev.preventDefault();
      taps++;
    };
    const key = (ev: KeyboardEvent) => {
      if (ev.key === ' ' || ev.key === 'Enter') tap(ev);
    };
    hit.addEventListener('pointerdown', tap);
    hit.addEventListener('keydown', key);
    hit.focus();
    const t0 = performance.now();
    let last = -1;
    const frameFn = (now: number) => {
      if (done) return;
      const tick = Math.floor((now - t0) / tickMs);
      while (last < tick && !done) {
        last++;
        const n = taps;
        taps = 0;
        done = onTick(last, n);
      }
      if (done) {
        hit.removeEventListener('pointerdown', tap);
        hit.removeEventListener('keydown', key);
        resolve();
        return;
      }
      requestAnimationFrame(frameFn);
    };
    requestAnimationFrame(frameFn);
  });
}

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

// --- Kunai no alvo -----------------------------------------------------------------------------------------------------

export async function kunaiGame(slot: HTMLElement, data: JornadaData, rng: Rng, opts: TimedOpts): Promise<boolean> {
  const cfg = data.j.minigames;
  const setup = kunaiSetup(cfg, opts.difficulty, opts.bonus, rng);
  const power = opts.skin === 'power';
  const title = power ? M.kunaiPowerTitle : M.kunaiTitle;
  const rules = power ? M.kunaiPowerTip(setup.winPoints) : M.kunaiTip(setup.winPoints);
  const f = frame(slot, title, power ? M.kunaiPowerHelp : M.kunaiHelp, rules, M.kunaiCalmTip(setup.calmSkips, power), opts);
  f.board.innerHTML = `<button type="button" class="mgk ${power ? 'power' : ''}" aria-label="${M.release}" style="--c:${pct(setup.center)};--r:${pct(setup.ring)}">
      <span class="mgk-ring" aria-hidden="true"></span><span class="mgk-center" aria-hidden="true"></span>
      <span class="mgk-marker" aria-hidden="true">${icon(power ? 'sparkle' : 'kunai')}</span></button>
    <p class="mgk-score small"></p>`;
  const hit = f.board.querySelector<HTMLButtonElement>('.mgk')!;
  const marker = f.board.querySelector<HTMLElement>('.mgk-marker')!;
  const score = f.board.querySelector<HTMLElement>('.mgk-score')!;
  const calm = await f.start();
  let points = 0;
  const total = setup.throws.length;
  const showScore = (i: number) => (score.textContent = `${M.kunaiThrow(Math.min(i + 1, total), total, power)} · ${M.kunaiPoints(points, setup.winPoints)}`);
  const stick = (pos: number) => hit.insertAdjacentHTML('beforeend', `<span class="mgk-stuck" style="left:${pct(pos)}" aria-hidden="true">${icon(power ? 'sparkle' : 'kunai')}</span>`);
  if (calm) {
    hit.disabled = true;
    hit.setAttribute('aria-hidden', 'true');
  }
  for (let i = 0; i < total; i++) {
    showScore(i);
    const t = setup.throws[i]!;
    let pos: number;
    if (calm) {
      let skips = setup.calmSkips;
      let k = 0;
      for (;;) {
        pos = kunaiCalmPos(setup, t.calmOrder[k]!);
        marker.style.left = pct(pos);
        const zone = kunaiZone(setup, pos, true);
        f.status.textContent = `${M.kunaiAt[zone]}${zone === 'center' ? '' : `, ${M.kunaiSide(pos < 0.5)}`}. ${M.skipsLeft(skips)}`;
        const act = await f.ask([
          { act: 'release', label: M.release },
          { act: 'next', label: M.next, off: skips === 0 || k === t.calmOrder.length - 1 },
        ]);
        if (act === 'release') break;
        skips--;
        k++;
      }
    } else {
      f.status.textContent = '';
      let at = 0;
      await runTicks(hit, cfg.tickMs, (tick, taps) => {
        at = kunaiPos(t, tick);
        marker.style.left = pct(at);
        return taps > 0;
      });
      pos = at;
    }
    const zone = kunaiZone(setup, pos, calm);
    points += kunaiPoints(zone);
    stick(pos);
    f.status.textContent = M.kunaiZone[zone];
    showScore(i);
    await sleep(opts.instant ? 250 : 600);
    const left = total - i - 1;
    if (kunaiWon(setup, points) || points + 2 * left < setup.winPoints) break;
  }
  hit.disabled = true;
  return kunaiWon(setup, points);
}

// --- Andar sobre a água ------------------------------------------------------------------------------------------------

export async function waterGame(slot: HTMLElement, data: JornadaData, rng: Rng, opts: TimedOpts): Promise<boolean> {
  const cfg = data.j.minigames;
  const setup = waterSetup(cfg, opts.difficulty, opts.bonus, rng);
  const title = opts.skin === 'tree' ? M.waterTreeTitle : opts.skin === 'balloon' ? M.waterBalloonTitle : M.waterTitle;
  const seconds = Math.round((setup.ticks * cfg.tickMs) / 1000);
  const f = frame(slot, title, M.waterHelp, M.waterTip(seconds), M.waterCalmTip(setup.calm.steps, setup.calm.maxOut), opts);
  const art = opts.skin === 'tree' ? 'tree' : 'water';
  f.board.innerHTML = `<button type="button" class="mgw ${opts.skin ?? ''}" aria-label="${M.waterUp}" style="--lo:${pct(setup.band[0])};--hi:${pct(setup.band[1])}">
      <span class="mgw-band" aria-hidden="true"></span><span class="mgw-level" aria-hidden="true">${icon(art)}</span></button>
    <div class="mgw-meta small"><span class="mgw-time"></span><span class="mgw-lost" aria-hidden="true"><i></i></span></div>`;
  const hit = f.board.querySelector<HTMLButtonElement>('.mgw')!;
  const level = f.board.querySelector<HTMLElement>('.mgw-level')!;
  const time = f.board.querySelector<HTMLElement>('.mgw-time')!;
  const lost = f.board.querySelector<HTMLElement>('.mgw-lost i')!;
  const calm = await f.start();
  const stateOf = (s: WaterState) => (waterInBand(setup, s.pos) ? 'ok' : s.pos < setup.band[0] ? 'low' : 'high');
  const draw = (s: WaterState, maxOut: number) => {
    level.style.bottom = pct(s.pos);
    hit.dataset.state = stateOf(s);
    lost.style.width = pct(Math.min(1, s.out / (maxOut + 1)));
  };
  let s = waterStart();
  draw(s, setup.tolerance);
  if (calm) {
    hit.disabled = true;
    hit.setAttribute('aria-hidden', 'true');
    let result: boolean | null = null;
    let last = '';
    while (result === null) {
      time.textContent = `${M.waterSteps(s.tick + 1, setup.calm.steps)} · ${M.waterOut(s.out, setup.calm.maxOut)}`;
      const hint = waterCalmHint(setup, s);
      f.status.textContent = `${last}${M.waterState[stateOf(s)]}. ${M.waterHint[hint > 0 ? 'up' : hint < 0 ? 'down' : 'none']}`;
      const act = await f.ask([
        { act: 'up', label: M.waterUp },
        { act: 'hold', label: M.waterHold },
        { act: 'down', label: M.waterDown },
      ]);
      const wave = setup.calm.waves[s.tick] ?? 0;
      s = waterCalmStep(setup, s, act === 'up' ? 1 : act === 'down' ? -1 : 0);
      draw(s, setup.calm.maxOut);
      last = `${wave > 0 ? M.waterWave.up : wave < 0 ? M.waterWave.down : M.waterWave.none} `;
      result = waterCalmResult(setup, s);
    }
    f.status.textContent = `${last}${M.waterState[stateOf(s)]}.`;
    time.textContent = M.waterOut(s.out, setup.calm.maxOut);
    return result;
  }
  let said = '';
  await runTicks(hit, cfg.tickMs, (_tick, taps) => {
    s = waterStep(setup, s, taps);
    draw(s, setup.tolerance);
    time.textContent = M.waterTime(Math.max(0, Math.ceil(((setup.ticks - s.tick) * cfg.tickMs) / 1000)));
    // Só as mudanças de estado vão para o leitor de tela.
    const st = M.waterState[stateOf(s)];
    if (st !== said) f.status.textContent = said = st;
    return waterResult(setup, s) !== null;
  });
  hit.disabled = true;
  return waterResult(setup, s) === true;
}

// --- O clone verdadeiro ------------------------------------------------------------------------------------------------

export async function cloneGame(slot: HTMLElement, data: JornadaData, rng: Rng, opts: TimedOpts): Promise<boolean> {
  const cfg = data.j.minigames;
  const script = cloneScript(cfg, opts.difficulty, rng);
  const f = frame(slot, M.cloneTitle, M.cloneHelp, M.cloneTip, M.cloneTip, opts);
  const n = script.figures;
  // Cada figura é um botão; a posição na fila é `--x` (as trocas animam a mudança de `--x`).
  f.board.innerHTML = `<div class="mgc" style="--n:${n};--swap:${script.swapTicks * cfg.tickMs}ms">${Array.from(
    { length: n },
    (_, i) => `<button type="button" class="mgc-fig" data-fig="${i}" style="--x:${i}" disabled aria-label="${M.cloneFigure(i + 1)}">${icon('shinobi')}<small>${i + 1}</small></button>`,
  ).join('')}</div>`;
  const figs = [...f.board.querySelectorAll<HTMLButtonElement>('.mgc-fig')];
  const slotOf = figs.map((_, i) => i);
  const real = figs[script.start]!;
  const calm = await f.start();
  const place = () => figs.forEach((b, i) => {
    b.style.setProperty('--x', String(slotOf[i]));
    b.setAttribute('aria-label', M.cloneFigure(slotOf[i]! + 1));
    b.querySelector('small')!.textContent = String(slotOf[i]! + 1);
  });
  f.status.textContent = `${M.cloneStart(script.start + 1)} ${M.cloneSight[opts.bonus.cloneSight]}`.trim();
  real.classList.add('glow');
  if (calm) await f.ask([{ act: 'go', label: M.next }]);
  else await sleep(1100);
  real.classList.remove('glow');
  if (opts.bonus.cloneSight === 'full') real.classList.add('flow');
  const glimpseAt = opts.bonus.cloneSight === 'glimpse' ? Math.floor(script.swaps.length / 2) : -1;
  f.box.classList.toggle('calm', calm);
  for (let k = 0; k < script.swaps.length; k++) {
    const [a, b] = script.swaps[k]!;
    const fa = slotOf.indexOf(a);
    const fb = slotOf.indexOf(b);
    slotOf[fa] = b;
    slotOf[fb] = a;
    place();
    if (k === glimpseAt) real.classList.add('glow');
    if (calm) {
      f.status.textContent = M.cloneSwap(a + 1, b + 1);
      await f.ask([{ act: 'go', label: M.next }]);
    } else await sleep(script.swapTicks * cfg.tickMs + 60);
    real.classList.remove('glow');
  }
  real.classList.remove('flow');
  f.status.textContent = M.cloneChoose;
  figs.forEach((b) => (b.disabled = false));
  const choice = await new Promise<number>((resolve) => {
    f.board.addEventListener('click', function onClick(ev) {
      const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('.mgc-fig');
      if (!b || b.disabled) return;
      f.board.removeEventListener('click', onClick);
      figs.forEach((x) => (x.disabled = true));
      resolve(slotOf[Number(b.dataset.fig)]!);
    });
  });
  const won = cloneCheck(script, choice);
  real.classList.add('real');
  if (!won) figs[slotOf.indexOf(choice)]!.classList.add('poof');
  f.status.textContent = M.cloneStart(clonePosition(script) + 1);
  await sleep(opts.instant ? 300 : 800);
  return won;
}

// --- Pegar o sino ------------------------------------------------------------------------------------------------------

export async function bellGame(slot: HTMLElement, data: JornadaData, rng: Rng, opts: TimedOpts): Promise<boolean> {
  const cfg = data.j.minigames;
  const script = bellScript(cfg, opts.difficulty, opts.bonus, rng);
  const rounds = script.signals.length;
  const f = frame(slot, M.bellTitle, M.bellHelp, M.bellTip(rounds, script.toWin), M.bellCalmTip, opts);
  f.board.innerHTML = `<button type="button" class="mgb" aria-label="${M.bellGrab}">
      <span class="mgb-book" aria-hidden="true">${icon('book')}</span><span class="mgb-bell" aria-hidden="true">${icon('bell')}</span>
      <span class="mgb-say"></span></button><p class="mgb-score small"></p>`;
  const hit = f.board.querySelector<HTMLButtonElement>('.mgb')!;
  const say = f.board.querySelector<HTMLElement>('.mgb-say')!;
  const score = f.board.querySelector<HTMLElement>('.mgb-score')!;
  const calm = await f.start();
  // O tabuleiro já escreve o estado grande; a linha de estado fica só para o leitor de tela.
  if (!calm) f.status.classList.add('sr-only');
  const results: BellJudge[] = [];
  const hits = () => results.filter((r) => r === 'hit').length;
  if (calm) {
    hit.disabled = true;
    hit.setAttribute('aria-hidden', 'true');
  }
  for (let r = 0; r < rounds && bellResult(script, results) === null; r++) {
    score.textContent = `${M.bellRound(r + 1, rounds)} · ${M.bellScore(hits(), script.toWin)}`;
    hit.dataset.state = 'wait';
    let judge: BellJudge;
    if (calm) {
      const c = script.calm[r]!;
      let grabbed: number | null = null;
      for (let p = 0; p < c.pages; p++) {
        const distracted = p === c.real || c.decoys.includes(p);
        hit.dataset.state = distracted ? 'now' : 'wait';
        say.textContent = M.bellPage(p + 1, c.pages);
        f.status.textContent = distracted ? M.bellPageText.distracted : M.bellPageText.reading;
        const act = await f.ask([
          { act: 'hold', label: M.bellHold },
          { act: 'grab', label: M.bellGrab },
        ]);
        if (act === 'grab') {
          grabbed = p;
          break;
        }
      }
      judge = bellCalmJudge(script, r, grabbed);
    } else {
      say.textContent = M.bellWait;
      f.status.textContent = M.bellWait;
      const signal = script.signals[r]!;
      let tap: number | null = null;
      await runTicks(hit, cfg.tickMs, (tick, taps) => {
        if (tick === signal) {
          hit.dataset.state = 'now';
          say.textContent = M.bellNow;
          f.status.textContent = M.bellNow;
          navigator.vibrate?.(40);
        }
        if (taps > 0) {
          tap = tick;
          return true;
        }
        return tick > signal + script.window;
      });
      judge = bellJudge(script, r, tap);
    }
    results.push(judge);
    hit.dataset.state = judge;
    say.textContent = M.bellJudge[judge];
    f.status.textContent = M.bellJudge[judge];
    score.textContent = `${M.bellRound(r + 1, rounds)} · ${M.bellScore(hits(), script.toWin)}`;
    await sleep(opts.instant ? 400 : 900);
  }
  hit.disabled = true;
  return bellResult(script, results) === true;
}
