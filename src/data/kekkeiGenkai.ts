import type { KekkeiGenkaiDef } from '../core/types';

// Kekkei genkai de natureza (docs/base/fundamentos.md#kekkei-genkai): cada uma é UMA natureza (src/core/nature.ts), com
// dois elementos-pai para a vantagem. Desde a v0.59.0 o jogador só a tem pela rolagem especial da origem (`lineages`):
// hoje, o Mokuton do Senju. Gelo e Areia são as naturezas do Haku e do Gaara; as outras ficam guardadas (o clássico
// ainda as sorteia pelos pais). Textos em strings/ptBR.ts.
export const kekkeiGenkai: KekkeiGenkaiDef[] = [
  { id: 'ice', parents: ['water', 'wind'], chance: 0.25 },
  { id: 'sand', parents: ['earth', 'wind'], chance: 0.25 },
  { id: 'lava', parents: ['fire', 'earth'], chance: 0.25 },
  { id: 'storm', parents: ['lightning', 'water'], chance: 0.25 },
  { id: 'steam', parents: ['fire', 'water'], chance: 0.25 },
  { id: 'explosion', parents: ['earth', 'lightning'], chance: 0.25 },
  // Mokuton: rolagem especial do Senju, raríssima (3% dos Senju; o Senju é 3% das origens).
  { id: 'wood', parents: ['earth', 'water'], chance: 0.03, lineages: ['senju'] },
];

export const kekkeiGenkaiById: Record<string, KekkeiGenkaiDef> = Object.fromEntries(kekkeiGenkai.map((k) => [k.id, k]));
