import type { Element } from './types';

export interface ElementConfig {
  advantage: number;
  disadvantage: number;
  neutral: number;
  /** Raio contra terra (barreira ou estado): perfura. */
  pierce: number;
}

/**
 * Multiplicador de um encontro de elementos (disputa, barreira ou estado elemental).
 * `null` = neutro. `solid`: a defesa é uma barreira ou um estado no corpo; raio contra terra sólida
 * perfura (×2 no lugar de ×1,5).
 */
export function elementMultiplier(
  attack: Element | null,
  defense: Element | null,
  beats: Record<Element, Element>,
  cfg: ElementConfig,
  solid = false,
): number {
  if (!attack || !defense) return cfg.neutral;
  if (solid && attack === 'lightning' && defense === 'earth') return cfg.pierce;
  if (beats[attack] === defense) return cfg.advantage;
  if (beats[defense] === attack) return cfg.disadvantage;
  return cfg.neutral;
}
