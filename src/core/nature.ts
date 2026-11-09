// Natureza elemental (docs/base/fundamentos.md#natureza): a fonte única das regras de elemento e Kekkei Genkai, usada
// pelo clássico, pelo Roleta e pela Jornada. Todo ninja tem UMA natureza: um elemento ou uma Kekkei Genkai (que conta
// como uma natureza só, com dois elementos-pai para a vantagem). Ter natureza não dá técnica elemental: isso é da
// origem (`hasElementalNinjutsu`).
import { elementMultiplier, type ElementConfig } from './elements';
import type { Element, KekkeiGenkaiDef, KekkeiGenkaiId, LineageDef } from './types';

export type Nature = Element | KekkeiGenkaiId;

/** A natureza de quem tem `elements` e, talvez, uma Kekkei Genkai: a Kekkei Genkai, senão o primeiro elemento. */
export const natureOf = (o: { elements: readonly Element[]; kekkeiGenkai?: KekkeiGenkaiId | null }): Nature | null =>
  o.kekkeiGenkai ?? o.elements[0] ?? null;

const isKekkeiGenkai = (n: Nature, list: readonly KekkeiGenkaiDef[]) => list.some((k) => k.id === n);

/** Elementos que valem no encontro: os dois pais da Kekkei Genkai, ou o próprio elemento. */
export function natureParents(n: Nature, list: readonly KekkeiGenkaiDef[]): Element[] {
  const kg = list.find((k) => k.id === n);
  return kg ? [...kg.parents] : isKekkeiGenkai(n, list) ? [] : [n as Element];
}

/**
 * Multiplicador do encontro de naturezas. A Kekkei Genkai usa o pai mais favorável para quem a tem: no ataque, o
 * melhor pai do atacante; na defesa, o pai que mais protege o defensor.
 */
export function natureMultiplier(
  attack: Nature | null,
  defense: Nature | null,
  list: readonly KekkeiGenkaiDef[],
  beats: Record<Element, Element>,
  cfg: ElementConfig,
  solid = false,
): number {
  if (!attack || !defense) return cfg.neutral;
  const atk = natureParents(attack, list);
  const def = natureParents(defense, list);
  return Math.max(...atk.map((a) => Math.min(...def.map((d) => elementMultiplier(a, d, beats, cfg, solid)))));
}

/** Só as origens de ninjutsu elemental (Comum, Uzumaki, Senju, Uchiha) ganham técnicas da natureza. */
export const hasElementalNinjutsu = (lineage: LineageDef): boolean =>
  (lineage.elementalPotential === 'full' || lineage.elementalPotential === 'fixedOnly') && !(lineage.forbiddenAttackTypes ?? []).includes('ninjutsu');
