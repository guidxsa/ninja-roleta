// Jogador do Roleta enxuto (docs/roleta/combate.md#técnicas): a mesma ficha da base (`PlayerState`), com o kit fixo
// de técnicas que sobem sozinhas com o nível. Sem upgrades à escolha, sem linhas elementais, sem despertar.
import type { Difficulty } from '../difficulty';
import { lineageOf } from '../origin';
import { createPlayer, type PlayerState } from '../player';
import type { Origin } from '../types';
import type { RoletaData } from './data';
import { BASIC, type RTechniqueDef } from '../../data/roleta/techniques';

/**
 * Técnicas da origem: Taijutsu básico, 1 técnica por elemento (a kekkei genkai toma o lugar das dos dois elementos-pai)
 * e as da linhagem. Origem sem potencial elemental (prodígio) ou proibida de ninjutsu fica sem as do elemento.
 */
export function roletaKit(origin: Origin, data: RoletaData): string[] {
  const lineage = lineageOf(origin.lineageId, data.base);
  const all = Object.values(data.techniques);
  const forbidden = new Set(lineage.forbiddenAttackTypes ?? []);
  const kg = origin.kekkeiGenkai ? data.base.kekkeiGenkai.find((k) => k.id === origin.kekkeiGenkai) : undefined;
  const elements = lineage.elementalPotential === 'none' || forbidden.has('ninjutsu') ? [] : origin.elements.filter((el) => !kg?.parents.includes(el));
  const pick = (f: (t: RTechniqueDef) => boolean) => all.filter((t) => f(t) && !forbidden.has(t.type)).map((t) => t.id);
  return [
    BASIC,
    ...elements.flatMap((el) => pick((t) => t.element === el)),
    ...(kg && !forbidden.has('ninjutsu') ? pick((t) => t.kekkeiGenkai === kg.id) : []),
    ...(origin.lineageId ? pick((t) => t.lineage === origin.lineageId) : []),
  ];
}

/** Ficha do jogador no começo da run (status e Vontades da base; técnicas do kit enxuto). */
export function createRoletaPlayer(origin: Origin, data: RoletaData, difficulty: Difficulty = data.base.balance.difficulty.default): PlayerState {
  const p = createPlayer(origin, data.base, difficulty);
  return {
    ...p,
    techniques: roletaKit(origin, data),
    techniqueLevels: {},
    pendingUpgrades: 0,
    dojutsu: null,
    active: null,
    focusUses: 0,
    substitutionBonus: 0,
    shadowClonesLevel: 0,
    glimmerLevel: 0,
  };
}

/** Técnicas do jogador, na ordem do kit. */
export const playerTechniques = (p: PlayerState, data: RoletaData): RTechniqueDef[] =>
  p.techniques.map((id) => data.techniques[id]).filter((t): t is RTechniqueDef => Boolean(t));
