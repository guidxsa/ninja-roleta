// Minijogos dos eventos (docs/jornada/run.md#minijogos). A interface conduz; aqui ficam o sorteio e a regra.
import type { Difficulty } from '../difficulty';
import type { Rng } from '../rng';
import type { JornadaData } from './data';
import type { Minigame } from './events';
import { memberSheet, type JRun } from './run';

/** Selos de mão usados nos minijogos (índices dos ícones). */
export const SEALS = ['rat', 'ox', 'tiger', 'hare', 'dragon', 'snake', 'horse', 'ram', 'monkey', 'bird', 'dog', 'boar'] as const;
export type Seal = (typeof SEALS)[number];

function shuffle<T>(list: T[], rng: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Jogo da memória: `pairs` pares de selos embaralhados. */
export function memoryDeck(pairs: number, rng: Rng): Seal[] {
  const picks = shuffle([...SEALS], rng).slice(0, pairs);
  return shuffle([...picks, ...picks], rng);
}

/** Sequência de selos: repetir na ordem. Escolhe `length` selos entre os `pool` primeiros de um sorteio. */
export function sealSequence(length: number, pool: number, rng: Rng): { sequence: Seal[]; options: Seal[] } {
  const options = shuffle([...SEALS], rng).slice(0, pool);
  const sequence = Array.from({ length }, () => options[Math.floor(rng() * options.length)]!);
  return { sequence, options };
}

/** Confere a sequência digitada até agora: 'wrong' no primeiro erro, 'done' ao completar. */
export function checkSequence(sequence: readonly Seal[], typed: readonly Seal[]): 'ok' | 'wrong' | 'done' {
  for (let i = 0; i < typed.length; i++) if (typed[i] !== sequence[i]) return 'wrong';
  return typed.length === sequence.length ? 'done' : 'ok';
}

export type Hand = 'rock' | 'paper' | 'scissors';
const BEATS_HAND: Record<Hand, Hand> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

export function jokenpo(choice: Hand, rng: Rng): { other: Hand; result: 'win' | 'lose' | 'tie' } {
  const other = (['rock', 'paper', 'scissors'] as const)[Math.floor(rng() * 3)]!;
  const result = choice === other ? 'tie' : BEATS_HAND[choice] === other ? 'win' : 'lose';
  return { other, result };
}

// ---------------------------------------------------------------------------------------------------------------------
// Minijogos de tempo (v0.91.0): kunai, água, clone e sino. O core sorteia o roteiro inteiro e julga cada jogada; a tela
// só desenha o tick atual e manda os toques. Cada um tem a variante sem pressa (sem reflexo), com o mesmo roteiro.

export type MinigameCfg = JornadaData['j']['minigames'];

/** Ganchos de status: o que a run muda nos minijogos (docs/jornada/run.md#minijogos). */
export interface MinigameBonus {
  /** Kunai: largura a mais do centro. */
  kunaiCenter: number;
  /** Água: largura a mais da faixa. */
  waterBand: number;
  /** Clone: o protagonista vê o fluxo a troca toda (`full`), um aliado dá um brilho no meio (`glimpse`) ou nada. */
  cloneSight: 'full' | 'glimpse' | 'none';
  /** Sino: janela a mais, em ms. */
  bellMs: number;
}

export const NO_BONUS: MinigameBonus = { kunaiCenter: 0, waterBand: 0, cloneSight: 'none', bellMs: 0 };

/** Os ganchos de status da run: relíquias de kunai, chakra máximo, dōjutsu na equipe e speed do protagonista. */
export function minigameBonus(run: JRun, data: JornadaData): MinigameBonus {
  const cfg = data.j.minigames;
  const def = data.characters[run.hero];
  const sheet = memberSheet(run, run.hero, data);
  const kunaiRelics = run.relics.filter((id) => cfg.kunai.relics.includes(id)).length;
  const extraChakra = Math.max(0, sheet.maxChakra - (def?.chakra ?? sheet.maxChakra));
  const team = new Set([...Object.keys(run.members), ...run.supports]);
  team.delete(run.hero);
  const eyes = cfg.clone.eyes;
  const heroEyes = eyes.includes(run.hero) || (run.skin !== null && eyes.includes(run.skin));
  const sight = heroEyes ? 'full' : [...team].some((id) => eyes.includes(id)) ? 'glimpse' : 'none';
  return {
    kunaiCenter: Math.min(cfg.kunai.relicCenterMax, kunaiRelics * cfg.kunai.relicCenter),
    waterBand: Math.min(cfg.water.chakraBandMax, Math.floor(extraChakra / cfg.water.chakraPer) * cfg.water.chakraBand),
    cloneSight: sight,
    bellMs: Math.min(cfg.bell.speedMsMax, Math.max(0, sheet.speed - cfg.bell.speedBase) * cfg.bell.speedMs),
  };
}

const TIMED: readonly Minigame[] = ['kunai', 'water', 'clone', 'bell'];

/** Chance do bot da simulação ganhar o minijogo (os de tempo apertam com a dificuldade). */
export function botWinChance(kind: Minigame | undefined, difficulty: Difficulty, cfg: MinigameCfg): number {
  return kind && TIMED.includes(kind) ? cfg.botWin.timed[difficulty] : cfg.botWin.flat;
}

const between = (lo: number, hi: number, rng: Rng) => lo + Math.floor(rng() * (hi - lo + 1));

// --- Kunai no alvo -----------------------------------------------------------------------------------------------------

export type KunaiZone = 'center' | 'ring' | 'out';

export interface KunaiThrow {
  /** Ticks de uma ida e volta do marcador. */
  period: number;
  /** Onde o ciclo começa (0 a 1). */
  phase: number;
  /** Sem pressa: a ordem das posições (índices de 0 a `calmPositions` − 1). */
  calmOrder: number[];
}

export interface KunaiSetup {
  center: number;
  ring: number;
  throws: KunaiThrow[];
  winPoints: number;
  calmSkips: number;
  calmPositions: number;
}

export function kunaiSetup(cfg: MinigameCfg, difficulty: Difficulty, bonus: MinigameBonus, rng: Rng): KunaiSetup {
  const k = cfg.kunai;
  const idx = Array.from({ length: k.calmPositions }, (_, i) => i);
  return {
    center: k.center[difficulty] + bonus.kunaiCenter,
    ring: k.ring,
    winPoints: k.winPoints,
    calmSkips: k.calmSkips[difficulty],
    calmPositions: k.calmPositions,
    throws: Array.from({ length: k.throws }, (_, i) => ({
      period: Math.max(8, Math.round(k.periodTicks / (1 + k.speedUp) ** i)),
      phase: rng(),
      calmOrder: shuffle(idx, rng),
    })),
  };
}

/** Posição do marcador (0 a 1) no tick: vai e volta, em velocidade constante. */
export function kunaiPos(t: KunaiThrow, tick: number): number {
  const x = (t.phase + tick / t.period) % 1;
  return x < 0.5 ? 2 * x : 2 - 2 * x;
}

/** Posição fixa da variante sem pressa. */
export const kunaiCalmPos = (setup: KunaiSetup, index: number) => (index + 0.5) / setup.calmPositions;

export function kunaiZone(setup: KunaiSetup, pos: number, calm = false): KunaiZone {
  const d = Math.abs(pos - 0.5);
  // Sem pressa, o centro sempre pega as duas posições do meio.
  const half = calm ? Math.max(setup.center / 2, 0.5 / setup.calmPositions + 1e-9) : setup.center / 2;
  if (d <= half) return 'center';
  return d <= half + setup.ring ? 'ring' : 'out';
}

export const kunaiPoints = (z: KunaiZone) => (z === 'center' ? 2 : z === 'ring' ? 1 : 0);

export const kunaiWon = (setup: KunaiSetup, points: number) => points >= setup.winPoints;

// --- Andar sobre a água ------------------------------------------------------------------------------------------------

export interface WaterSetup {
  ticks: number;
  /** Faixa "no ponto": [baixo, alto], centrada. */
  band: [number, number];
  tolerance: number;
  /** Empurrão da onda em cada tick (0 na maioria). */
  waves: number[];
  fall: number;
  tap: number;
  calm: { steps: number; maxOut: number; step: number; waves: number[] };
}

export interface WaterState {
  tick: number;
  pos: number;
  /** Ticks (ou passos, sem pressa) fora da faixa. */
  out: number;
}

export function waterSetup(cfg: MinigameCfg, difficulty: Difficulty, bonus: MinigameBonus, rng: Rng): WaterSetup {
  const w = cfg.water;
  const width = w.band[difficulty] + bonus.waterBand;
  const waves = Array.from({ length: w.ticks }, () => 0);
  for (let t = between(w.waveEvery[0], w.waveEvery[1], rng); t < w.ticks; t += between(w.waveEvery[0], w.waveEvery[1], rng)) {
    waves[t] = rng() < 0.5 ? -w.wave : w.wave;
  }
  const calmWaves = Array.from({ length: w.calmSteps }, () => {
    const r = rng();
    const dir = r < 1 / 3 ? -1 : r < 2 / 3 ? 1 : 0;
    return dir * (w.calmWaveMin + rng() * (w.calmWaveMax - w.calmWaveMin));
  });
  return {
    ticks: w.ticks,
    band: [0.5 - width / 2, 0.5 + width / 2],
    tolerance: w.tolerance[difficulty],
    waves,
    fall: w.fall,
    tap: w.tap,
    calm: { steps: w.calmSteps, maxOut: w.calmMaxOut, step: w.calmStep, waves: calmWaves },
  };
}

export const waterStart = (): WaterState => ({ tick: 0, pos: 0.5, out: 0 });

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const waterInBand = (setup: WaterSetup, pos: number) => pos >= setup.band[0] && pos <= setup.band[1];

/** Um tick: o chakra se dispersa, a onda empurra e cada toque sobe um degrau. */
export function waterStep(setup: WaterSetup, s: WaterState, taps: number): WaterState {
  const pos = clamp01(s.pos - setup.fall + taps * setup.tap + (setup.waves[s.tick] ?? 0));
  return { tick: s.tick + 1, pos, out: s.out + (waterInBand(setup, pos) ? 0 : 1) };
}

/** `null` enquanto o jogo segue. */
export function waterResult(setup: WaterSetup, s: WaterState): boolean | null {
  if (s.out > setup.tolerance) return false;
  return s.tick >= setup.ticks ? true : null;
}

/** Sem pressa: a direção da próxima onda (1 sobe, −1 desce, 0 parada), anunciada antes da escolha. */
export const waterCalmHint = (setup: WaterSetup, s: WaterState): -1 | 0 | 1 => Math.sign(setup.calm.waves[s.tick] ?? 0) as -1 | 0 | 1;

/** Sem pressa: um passo, subindo (1), mantendo (0) ou descendo (−1); a força da onda só aparece depois. */
export function waterCalmStep(setup: WaterSetup, s: WaterState, move: -1 | 0 | 1): WaterState {
  const pos = clamp01(s.pos + move * setup.calm.step + (setup.calm.waves[s.tick] ?? 0));
  return { tick: s.tick + 1, pos, out: s.out + (waterInBand(setup, pos) ? 0 : 1) };
}

export function waterCalmResult(setup: WaterSetup, s: WaterState): boolean | null {
  if (s.out > setup.calm.maxOut) return false;
  return s.tick >= setup.calm.steps ? true : null;
}

// --- O clone verdadeiro ------------------------------------------------------------------------------------------------

export interface CloneScript {
  figures: number;
  /** Posição inicial do verdadeiro. */
  start: number;
  swaps: [number, number][];
  swapTicks: number;
}

export function cloneScript(cfg: MinigameCfg, difficulty: Difficulty, rng: Rng): CloneScript {
  const c = cfg.clone;
  const figures = c.figures[difficulty];
  const swaps: [number, number][] = Array.from({ length: c.swaps[difficulty] }, () => {
    const a = Math.floor(rng() * figures);
    const b = (a + 1 + Math.floor(rng() * (figures - 1))) % figures;
    return [a, b];
  });
  return { figures, start: Math.floor(rng() * figures), swaps, swapTicks: c.swapTicks[difficulty] };
}

/** Onde o verdadeiro está depois das `upTo` primeiras trocas (sem `upTo`, no fim). */
export function clonePosition(s: CloneScript, upTo = s.swaps.length): number {
  let at = s.start;
  for (const [a, b] of s.swaps.slice(0, upTo)) at = at === a ? b : at === b ? a : at;
  return at;
}

export const cloneCheck = (s: CloneScript, choice: number) => choice === clonePosition(s);

// --- Pegar o sino ------------------------------------------------------------------------------------------------------

export type BellJudge = 'early' | 'hit' | 'late';

export interface BellScript {
  /** Tick do sinal em cada rodada. */
  signals: number[];
  /** Janela depois do sinal, em ticks. */
  window: number;
  toWin: number;
  /** Sem pressa: em cada rodada, a página certa e as que só parecem. */
  calm: { pages: number; real: number; decoys: number[] }[];
}

export function bellScript(cfg: MinigameCfg, difficulty: Difficulty, bonus: MinigameBonus, rng: Rng): BellScript {
  const b = cfg.bell;
  const ms = Math.max(b.windowMinMs, b.windowMs[difficulty]) + bonus.bellMs;
  const pages = Array.from({ length: b.calmPages - 1 }, (_, i) => i + 1);
  return {
    signals: Array.from({ length: b.rounds }, () => between(b.signalTicks[0], b.signalTicks[1], rng)),
    window: Math.floor(ms / cfg.tickMs),
    toWin: b.toWin,
    calm: Array.from({ length: b.rounds }, () => {
      // A primeira página nunca é a certa: o mestre começa sempre lendo.
      const [real, ...decoys] = shuffle(pages, rng).slice(0, 1 + b.calmDecoys[difficulty]);
      return { pages: b.calmPages, real: real!, decoys };
    }),
  };
}

/** O toque no tick `tap` da rodada (`null` = não tocou até o fim da janela). */
export function bellJudge(s: BellScript, round: number, tap: number | null): BellJudge {
  const signal = s.signals[round]!;
  if (tap === null) return 'late';
  if (tap < signal) return 'early';
  return tap <= signal + s.window ? 'hit' : 'late';
}

/** Sem pressa: pegar na página `page` (`null` = deixou passar todas). */
export function bellCalmJudge(s: BellScript, round: number, page: number | null): BellJudge {
  const r = s.calm[round]!;
  if (page === null) return 'late';
  return page === r.real ? 'hit' : page > r.real ? 'late' : 'early';
}

/** `null` enquanto ninguém fechou a melhor de N. */
export function bellResult(s: BellScript, results: readonly BellJudge[]): boolean | null {
  const hits = results.filter((r) => r === 'hit').length;
  const misses = results.length - hits;
  if (hits >= s.toWin) return true;
  return misses > s.signals.length - s.toWin ? false : null;
}
