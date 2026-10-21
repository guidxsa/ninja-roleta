import type { Rng } from './rng';

export interface Slice<T> {
  /** Chave de texto (resolvida pela UI nos arquivos de strings). */
  label: string;
  weight: number;
  value: T;
}

export interface SpinResult<T> {
  index: number;
  slice: Slice<T>;
}

/** Sorteia uma fatia proporcionalmente ao peso. Fatias com peso 0 nunca saem. */
export function spin<T>(slices: readonly Slice<T>[], rng: Rng): SpinResult<T> {
  let total = 0;
  for (const s of slices) {
    if (!(s.weight >= 0)) throw new Error(`Peso inválido na fatia "${s.label}": ${s.weight}`);
    total += s.weight;
  }
  if (total <= 0) throw new Error('A roleta precisa de ao menos uma fatia com peso positivo');

  let r = rng() * total;
  let lastPositive = -1;
  for (let i = 0; i < slices.length; i++) {
    const s = slices[i]!;
    if (s.weight <= 0) continue;
    lastPositive = i;
    if (r < s.weight) return { index: i, slice: s };
    r -= s.weight;
  }
  // Só alcançado por erro de ponto flutuante.
  return { index: lastPositive, slice: slices[lastPositive]! };
}

/** Roleta de duas fatias: `chance` de sair `yes`. */
export function chanceSlices<T>(
  chance: number,
  yes: { label: string; value: T },
  no: { label: string; value: T },
): Slice<T>[] {
  return [
    { ...yes, weight: chance },
    { ...no, weight: 1 - chance },
  ];
}
