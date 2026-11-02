// Minijogos dos eventos (docs/jornada/run.md#minijogos). A interface conduz; aqui ficam o sorteio e a regra.
import type { Rng } from '../rng';

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
