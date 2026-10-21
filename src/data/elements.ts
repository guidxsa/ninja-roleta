import type { Element } from '../core/types';

export const ELEMENTS: readonly Element[] = ['fire', 'wind', 'lightning', 'earth', 'water'];

// Ciclo: fogo > vento > raio > terra > água > fogo.
export const BEATS: Record<Element, Element> = {
  fire: 'wind',
  wind: 'lightning',
  lightning: 'earth',
  earth: 'water',
  water: 'fire',
};

/** Pesos da roleta de afinidade (iguais por padrão). */
export const elementWeights: Record<Element, number> = {
  fire: 1,
  wind: 1,
  lightning: 1,
  earth: 1,
  water: 1,
};
