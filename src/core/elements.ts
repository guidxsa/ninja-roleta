import type { Element } from './types';

export interface ElementConfig {
  advantage: number;
  disadvantage: number;
  neutral: number;
}

/** Multiplicador de dano do elemento atacante contra o defensor. `null` = neutro. */
export function elementMultiplier(
  attack: Element | null,
  defense: Element | null,
  beats: Record<Element, Element>,
  cfg: ElementConfig,
): number {
  if (!attack || !defense) return cfg.neutral;
  if (beats[attack] === defense) return cfg.advantage;
  if (beats[defense] === attack) return cfg.disadvantage;
  return cfg.neutral;
}
