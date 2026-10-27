// Sons e música do protótipo, sintetizados com Web Audio: sem arquivos, funciona offline.
// A música é uma composição original na escala japonesa "in" (Ré, Mi♭, Sol, Lá, Si♭).
// O navegador só libera o áudio depois de um toque; até lá, as chamadas não fazem nada.

export type Mood = 'good' | 'neutral' | 'bad';

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noise: AudioBuffer | null = null;
let sfxOn = true;
let musicOn = false;

const SFX_VOLUME = 0.5;
const MUSIC_VOLUME = 0.16;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function unlock() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_VOLUME;
    sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = noise.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
  if (musicOn) startMusic();
}

/** Liga o áudio no primeiro toque e pausa tudo com a aba escondida (economiza bateria no celular). */
export function installAudio(prefs: { sfx: boolean; music: boolean }) {
  sfxOn = prefs.sfx;
  musicOn = prefs.music;
  for (const type of ['pointerdown', 'keydown'] as const) document.addEventListener(type, unlock, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

export function setSfx(on: boolean) {
  sfxOn = on;
}

export function setMusic(on: boolean) {
  musicOn = on;
  if (on) unlock();
  else stopMusic();
}

// ---------------------------------------------------------------------------
// Vozes

interface Voice {
  wave?: OscillatorType;
  /** Volume de pico. */
  gain: number;
  attack?: number;
  /** Tempo até o som sumir. */
  decay: number;
  /** Frequência final (desliza até ela). */
  glideTo?: number;
  /** Corte do filtro passa-baixa. */
  cutoff?: number;
  /** Vibrato em centésimos de semitom (flauta). */
  vibrato?: number;
}

function tone(bus: AudioNode, freq: number, at: number, v: Voice) {
  const c = ctx!;
  const osc = c.createOscillator();
  osc.type = v.wave ?? 'sine';
  osc.frequency.setValueAtTime(freq, at);
  if (v.glideTo) osc.frequency.exponentialRampToValueAtTime(v.glideTo, at + v.decay * 0.8);
  if (v.vibrato) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 5.2;
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(v.vibrato, at + Math.min(0.35, v.decay * 0.5));
    lfo.connect(depth).connect(osc.detune);
    lfo.start(at);
    lfo.stop(at + v.decay + 0.05);
  }
  const amp = c.createGain();
  const attack = v.attack ?? 0.004;
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.linearRampToValueAtTime(v.gain, at + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + attack + v.decay);
  let node: AudioNode = osc;
  if (v.cutoff) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = v.cutoff;
    node = node.connect(lp);
  }
  node.connect(amp).connect(bus);
  osc.start(at);
  osc.stop(at + attack + v.decay + 0.05);
}

function hiss(bus: AudioNode, at: number, dur: number, gain: number, from: number, to: number, q = 1.2) {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noise;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = q;
  bp.frequency.setValueAtTime(from, at);
  bp.frequency.exponentialRampToValueAtTime(to, at + dur);
  const amp = c.createGain();
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.linearRampToValueAtTime(gain, at + dur * 0.3);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(bp).connect(amp).connect(bus);
  src.start(at, Math.random() * 0.5);
  src.stop(at + dur + 0.05);
}

const koto = (bus: AudioNode, midi: number, at: number, gain = 0.22, decay = 0.9) =>
  tone(bus, hz(midi), at, { wave: 'triangle', gain, decay, cutoff: 2600 });

const taiko = (bus: AudioNode, at: number, gain = 0.5) => {
  tone(bus, 110, at, { gain, decay: 0.45, glideTo: 48 });
  hiss(bus, at, 0.08, gain * 0.25, 900, 300);
};

// ---------------------------------------------------------------------------
// Efeitos

function sfx(play: (bus: AudioNode, now: number) => void) {
  if (!sfxOn || !ctx || ctx.state !== 'running') return;
  play(sfxBus!, ctx.currentTime + 0.01);
}

let lastTick = 0;
/** Clique de madeira quando uma divisória da roleta passa pelo ponteiro. */
export function tick() {
  const now = performance.now();
  if (now - lastTick < 35) return;
  lastTick = now;
  sfx((bus, t) => tone(bus, 1900 + Math.random() * 300, t, { wave: 'triangle', gain: 0.12, decay: 0.03 }));
}

/** Impulso da roleta grande. */
export const spinStart = () => sfx((bus, t) => hiss(bus, t, 0.45, 0.18, 500, 2400));

/** Faixa de combate: deslizada curta. */
export const swish = () => sfx((bus, t) => hiss(bus, t, 0.22, 0.09, 1800, 700, 2));

/** A roleta parou: batida de bloco de madeira. */
export const land = (soft = false) =>
  sfx((bus, t) => {
    const g = soft ? 0.12 : 0.22;
    tone(bus, 820, t, { gain: g, decay: 0.09 });
    tone(bus, 1260, t, { wave: 'triangle', gain: g * 0.5, decay: 0.06 });
  });

/** Som do resultado: bom (sobe), neutro (dois toques) ou ruim (desce, grave). */
export function mood(m: Mood) {
  sfx((bus, t) => {
    if (m === 'good') {
      [62, 67, 69, 74].forEach((n, i) => koto(bus, n, t + i * 0.07, 0.2, 0.6));
      koto(bus, 81, t + 0.3, 0.12, 0.9);
      hiss(bus, t + 0.28, 0.4, 0.05, 6000, 9000, 3);
    } else if (m === 'neutral') {
      koto(bus, 69, t, 0.18, 0.5);
      koto(bus, 74, t + 0.12, 0.16, 0.7);
    } else {
      [70, 69, 63].forEach((n, i) =>
        tone(bus, hz(n - 12), t + i * 0.16, { wave: 'sawtooth', gain: 0.12, decay: 0.45, cutoff: 900 }),
      );
      taiko(bus, t + 0.32, 0.35);
    }
  });
}

/** Fim da run vencida: tambores e a frase subindo até o Ré agudo. */
export const victory = () =>
  sfx((bus, t) => {
    [0, 0.12, 0.24, 0.48].forEach((d) => taiko(bus, t + d, 0.4));
    [62, 67, 69, 70, 74].forEach((n, i) => koto(bus, n, t + 0.5 + i * 0.1, 0.2, 0.7));
    tone(bus, hz(86), t + 1.05, { gain: 0.1, attack: 0.08, decay: 1.6, vibrato: 18 });
    koto(bus, 50, t + 1.05, 0.25, 1.8);
  });

/** Derrota: frase lenta descendo, com o tambor grave no fim. */
export const defeat = () =>
  sfx((bus, t) => {
    [74, 70, 69, 63, 62].forEach((n, i) =>
      tone(bus, hz(n), t + i * 0.28, { gain: 0.1, attack: 0.05, decay: i === 4 ? 1.4 : 0.5, vibrato: 12 }),
    );
    tone(bus, hz(38), t, { wave: 'sawtooth', gain: 0.08, attack: 0.3, decay: 2.2, cutoff: 400 });
    taiko(bus, t + 1.15, 0.5);
  });

// ---------------------------------------------------------------------------
// Música: 8 compassos em 4/4, grade de colcheias, repetindo.

const BPM = 96;
const EIGHTH = 60 / BPM / 2;
const BAR = 8;
/** Melodia da flauta: [nota MIDI ou null = pausa, duração em colcheias]. */
const MELODY: [number | null, number][] = [
  [69, 2], [70, 1], [69, 1], [67, 2], [62, 2],
  [63, 2], [67, 2], [69, 4],
  [74, 2], [70, 2], [69, 2], [67, 2],
  [69, 6], [null, 2],
  [67, 1], [69, 1], [70, 2], [74, 2], [75, 2],
  [74, 3], [70, 1], [69, 4],
  [67, 2], [63, 2], [62, 2], [63, 2],
  [62, 6], [null, 2],
];
/** Fundamental de cada compasso (baixo e arpejo do koto). */
const ROOTS = [38, 39, 34, 33, 31, 34, 39, 38];
const SCALE = [43, 45, 46, 50, 51, 55, 57, 58, 62, 63, 67];
const ARP = [0, 2, 4, 2, 1, 3, 4, 2];
/** Tambor por colcheia: 2 = forte, 1 = leve. */
const DRUMS = [2, 0, 0, 1, 0, 0, 2, 1];

const NOTES: { step: number; midi: number; len: number }[] = [];
{
  let step = 0;
  for (const [midi, len] of MELODY) {
    if (midi !== null) NOTES.push({ step, midi, len });
    step += len;
  }
}
const LOOP = ROOTS.length * BAR;

let timer: number | undefined;
let nextStep = 0;
let nextTime = 0;

function scheduleStep(step: number, at: number) {
  const bus = musicBus!;
  const bar = Math.floor(step / BAR);
  const inBar = step % BAR;
  const root = ROOTS[bar]!;
  if (inBar === 0) tone(bus, hz(root), at, { wave: 'triangle', gain: 0.3, attack: 0.02, decay: EIGHTH * 7, cutoff: 500 });
  // O koto arpeja a partir da nota da escala mais próxima da fundamental, uma oitava acima.
  const base = SCALE.findIndex((n) => n >= root + 12);
  koto(bus, SCALE[Math.min(SCALE.length - 1, base + ARP[inBar]!)]!, at, inBar % 2 ? 0.08 : 0.11, 0.7);
  if (DRUMS[inBar]) taiko(bus, at, DRUMS[inBar] === 2 ? 0.32 : 0.14);
  for (const n of NOTES) {
    if (n.step === step) tone(bus, hz(n.midi), at, { gain: 0.16, attack: 0.07, decay: n.len * EIGHTH, vibrato: 14 });
  }
}

function startMusic() {
  if (!ctx || timer !== undefined) return;
  const bus = musicBus!;
  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
  bus.gain.linearRampToValueAtTime(MUSIC_VOLUME, ctx.currentTime + 1);
  nextStep = 0;
  nextTime = ctx.currentTime + 0.1;
  // Agenda um pouco à frente; o relógio do áudio garante o ritmo mesmo se o timer atrasar.
  timer = window.setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.25) {
      scheduleStep(nextStep, nextTime);
      nextStep = (nextStep + 1) % LOOP;
      nextTime += EIGHTH;
    }
  }, 50);
}

function stopMusic() {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  if (!ctx || !musicBus) return;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
}
