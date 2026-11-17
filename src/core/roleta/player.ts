// Jogador do Roleta enxuto (docs/roleta/combate.md#técnicas): a mesma ficha da base (`PlayerState`), com o kit fixo
// de técnicas que sobem sozinhas com o nível. Sem upgrades à escolha e sem linhas elementais; as exclusivas do
// despertar (níveis 4 e 7) já estão no kit e aparecem quando o nível chega (v0.80.0).
import type { Difficulty } from '../difficulty';
import { hasElementalNinjutsu } from '../nature';
import { lineageOf } from '../origin';
import { createPlayer, type PlayerState } from '../player';
import type { KekkeiGenkaiId, LineageDef, Origin } from '../types';
import { cloneKindFor, type CloneKind } from '../clones';
import type { RoletaData } from './data';
import { BASIC, type RTechniqueDef } from '../../data/roleta/techniques';

/**
 * Tipo de clone da origem (docs/base/fundamentos.md#clones): Kage Bunshin no Uzumaki e no jinchuuriki; o clone da
 * natureza em quem tem ninjutsu elemental (Mizu, Doton, Raiton, Mokuton, Suna); Bunshin nos outros.
 */
export function cloneKindOf(origin: Origin, lineage: LineageDef, kekkeiGenkai: KekkeiGenkaiId | null, data: RoletaData): CloneKind {
  if (origin.lineageId === 'uzumaki' || origin.jinchuuriki) return 'kage';
  if (!hasElementalNinjutsu(lineage)) return 'bunshin';
  return cloneKindFor(kekkeiGenkai ?? origin.elements[0] ?? null, data.base.balance.clones);
}

/**
 * Técnicas da origem (v0.92.0, kits curtos): Taijutsu básico, a técnica de ataque de cada elemento (a kekkei genkai toma o
 * lugar das dos dois elementos-pai) quando o kit usa elemento, e as técnicas-chave da linhagem. Sem clones nem barreiras
 * no Roleta (ficam na Jornada). Origem proibida de ninjutsu fica sem as do elemento.
 */
export function roletaKit(origin: Origin, data: RoletaData): string[] {
  const lineage = lineageOf(origin.lineageId, data.base);
  const kit = data.kits[origin.lineageId ?? 'common'] ?? data.kits.common!;
  const all = Object.values(data.techniques);
  const forbidden = new Set(lineage.forbiddenAttackTypes ?? []);
  const kg = origin.kekkeiGenkai ? data.base.kekkeiGenkai.find((k) => k.id === origin.kekkeiGenkai) : undefined;
  // Só as origens de ninjutsu elemental (Comum, Uzumaki, Senju) ganham a técnica da natureza (src/core/nature.ts).
  const elemental = kit.elementTechniques && hasElementalNinjutsu(lineage);
  const elements = elemental ? origin.elements.filter((el) => !kg?.parents.includes(el)) : [];
  const attack = (t: RTechniqueDef) => !t.clone && !t.barrierPct && !t.lineage && !forbidden.has(t.type);
  const pick = (f: (t: RTechniqueDef) => boolean) => all.filter((t) => f(t) && attack(t)).map((t) => t.id);
  return [
    BASIC,
    ...elements.flatMap((el) => pick((t) => t.element === el && !t.kekkeiGenkai)),
    ...(kg && elemental ? pick((t) => t.kekkeiGenkai === kg.id) : []),
    ...kit.techniques.filter((id) => data.techniques[id] && !forbidden.has(data.techniques[id]!.type)),
  ];
}

/** Ficha do jogador no começo da run (status e Vontades da base; técnicas do kit enxuto). */
export function createRoletaPlayer(origin: Origin, data: RoletaData, difficulty: Difficulty = data.base.balance.difficulty.default): PlayerState {
  const p = createPlayer(origin, data.base, difficulty);
  return {
    ...p,
    techniques: roletaKit(origin, data),
    // Começa a run com 1 Kit médico e 1 Pílula de soldado (v0.81.0).
    bag: { ...p.bag, medKit: p.bag.medKit + data.r.startBag.medKit, soldierPill: p.bag.soldierPill + data.r.startBag.soldierPill },
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

/** Técnicas do jogador já liberadas pelo nível (despertar), na ordem do kit. */
export const playerTechniques = (p: PlayerState, data: RoletaData): RTechniqueDef[] =>
  p.techniques.map((id) => data.techniques[id]).filter((t): t is RTechniqueDef => Boolean(t) && p.level >= (t!.minLevel ?? 1));
