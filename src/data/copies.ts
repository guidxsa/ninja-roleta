import { copyTechniqueId } from '../core/combat';
import type { Element, TechniqueDef, VillainDef, VillainTechnique } from '../core/types';
import { villains } from './villains';

// Cópia (Uchiha): as fichas das técnicas de taijutsu e ninjutsu de dano dos vilões, prontas para o jogador
// usar com os próprios status (origens.md#uchiha). Geradas dos dados dos vilões, inclusive as da 2ª fase.

function copyOf(def: VillainDef, t: VillainTechnique): TechniqueDef {
  const element: Element | null = t.type === 'taijutsu' ? null : t.element === undefined ? def.element : t.element;
  return {
    id: copyTechniqueId(def.id, t.id),
    type: t.type,
    element,
    baseDamage: t.baseDamage,
    chakraCost: t.chakraCost,
    ...(t.hits ? { hits: t.hits } : {}),
    ...(t.accuracy !== undefined ? { accuracy: t.accuracy } : {}),
    ...(t.blade ? { blade: t.blade } : {}),
    lineages: ['uchiha'],
    copied: true,
  };
}

/** Técnica que a Cópia aceita: taijutsu ou ninjutsu que causa dano (sem barreiras nem curas). */
export function copyable(t: VillainTechnique): boolean {
  return (t.type === 'taijutsu' || t.type === 'ninjutsu') && t.baseDamage > 0 && t.barrier === undefined && !t.healPct;
}

export const copyTechniques: Record<string, TechniqueDef> = {};
for (const def of villains) {
  const monsters = [def.passive, def.hardcorePassive].flatMap((p) => (p?.kind === 'cloak' && p.monster ? p.monster.techniques : []));
  for (const t of [...def.techniques, ...monsters]) {
    if (copyable(t)) copyTechniques[copyTechniqueId(def.id, t.id)] = copyOf(def, t);
  }
}
