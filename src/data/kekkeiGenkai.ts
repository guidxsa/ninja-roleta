import type { KekkeiGenkaiDef } from '../core/types';

// Kekkei genkai de natureza (docs/base/fundamentos.md#kekkei-genkai). Saem no sorteio da origem para quem tem
// potencial elemental pleno e os dois elementos-pai; a Madeira é exclusiva do Senju. Textos em strings/ptBR.ts.
export const kekkeiGenkai: KekkeiGenkaiDef[] = [
  { id: 'ice', parents: ['water', 'wind'], chance: 0.25 },
  { id: 'sand', parents: ['earth', 'wind'], chance: 0.25 },
  { id: 'lava', parents: ['fire', 'earth'], chance: 0.25 },
  { id: 'storm', parents: ['lightning', 'water'], chance: 0.25 },
  { id: 'steam', parents: ['fire', 'water'], chance: 0.25 },
  { id: 'explosion', parents: ['earth', 'lightning'], chance: 0.25 },
  { id: 'wood', parents: ['earth', 'water'], chance: 0.3, lineages: ['senju'] },
];

export const kekkeiGenkaiById: Record<string, KekkeiGenkaiDef> = Object.fromEntries(kekkeiGenkai.map((k) => [k.id, k]));
