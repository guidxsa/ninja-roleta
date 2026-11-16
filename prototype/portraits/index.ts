// Retratos em SVG (docs/visual.md, "Personagens"): um desenho por personagem, guardado pela chave dos dados.
import type { Art } from './kit';
import { KONOHA } from './konoha';
import { GENERIC } from './generic';
import { VILLAINS } from './villains';

const ALL: Record<string, Art> = { ...GENERIC, ...KONOHA, ...VILLAINS };

/** Chaves com desenho (a galeria do UI Lab e o teste percorrem todas). */
export const PORTRAIT_KEYS: readonly string[] = Object.keys(ALL);
export const hasPortraitArt = (key: string): boolean => key in ALL;

const cache = new Map<string, string>();
/** Conteúdo do SVG (viewBox 0 0 100 100) do retrato, ou `null` se a chave não tem desenho. */
export function portraitArt(key: string, jinchuuriki = false): string | null {
  const draw = ALL[key];
  if (!draw) return null;
  const id = jinchuuriki ? `${key}+j` : key;
  let art = cache.get(id);
  if (art === undefined) cache.set(id, (art = draw(jinchuuriki)));
  return art;
}
