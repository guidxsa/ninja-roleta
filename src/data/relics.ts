import { relicInMode, type RelicDef } from '../core/jornada/relics';
import { relics as jornadaRelics } from './jornada/relics';
import { roletaEffects, roletaOnlyRelics } from './roleta/relics';

// Catálogo único de relíquias (docs/jornada/reliquias.md#modos): cada uma diz em que modos sai. As da Jornada que
// também saem no Roleta levam o efeito de lá (`roleta`); as exclusivas do Roleta só saem nele.

export const allRelics: RelicDef[] = [
  ...jornadaRelics.map((r) => (roletaEffects[r.id] ? { ...r, modes: ['jornada', 'roleta'] as RelicDef['modes'], roleta: roletaEffects[r.id] } : r)),
  ...roletaOnlyRelics,
];

export const relicsById: Record<string, RelicDef> = Object.fromEntries(allRelics.map((r) => [r.id, r]));

/** Relíquias que saem no Roleta. */
export const roletaRelics = allRelics.filter((r) => relicInMode(r, 'roleta'));
