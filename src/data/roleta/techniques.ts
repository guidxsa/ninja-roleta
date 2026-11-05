import type { AttackType, Element, KekkeiGenkaiId } from '../../core/types';

// Técnicas do Roleta enxuto (docs/roleta/combate.md#técnicas). Nomes visíveis em strings/roleta.ts.
// Cada técnica sobe sozinha com o nível: dano base = `base` + `perLevel` × (nível − 1). Sem multiplicador de elemento:
// o elemento só diz quem tem a técnica. Efeito no acerto com chance (Queimar, Veneno, Atordoar, Medo).

export type REffectKind = 'burn' | 'poison' | 'stun' | 'fear';

export interface RTechniqueDef {
  id: string;
  type: AttackType;
  base: number;
  perLevel: number;
  /** Golpes: uma roleta só resolve todos (acerto, erro ou crítico vale para a técnica inteira). */
  hits?: number;
  chakra: number;
  /** Omitido = `balance.hit.defaultAccuracy` (85%). */
  accuracy?: number;
  critBonus?: number;
  penetration?: number;
  effect?: { kind: REffectKind; chance: number };
  /** Fração do dano causado que volta como HP. */
  lifesteal?: number;
  /** Quem tem: o elemento da origem, a kekkei genkai ou a linhagem. Sem nenhum: todo mundo. */
  element?: Element;
  kekkeiGenkai?: KekkeiGenkaiId;
  lineage?: string;
}

export const BASIC = 'rBasic';

export const roletaTechniques: RTechniqueDef[] = [
  { id: BASIC, type: 'taijutsu', base: 8, perLevel: 1, chakra: 0, accuracy: 0.9 },
  // Um por elemento.
  { id: 'rFire', type: 'ninjutsu', element: 'fire', base: 12, perLevel: 2, chakra: 3, effect: { kind: 'burn', chance: 0.25 } },
  { id: 'rWind', type: 'ninjutsu', element: 'wind', base: 11, perLevel: 2, chakra: 3, accuracy: 0.9, critBonus: 0.1 },
  { id: 'rLightning', type: 'ninjutsu', element: 'lightning', base: 13, perLevel: 2, chakra: 3, accuracy: 0.8, penetration: 0.25 },
  { id: 'rEarth', type: 'ninjutsu', element: 'earth', base: 11, perLevel: 2, chakra: 3, accuracy: 0.95, effect: { kind: 'stun', chance: 0.1 } },
  { id: 'rWater', type: 'ninjutsu', element: 'water', base: 6, perLevel: 1, hits: 2, chakra: 3, accuracy: 0.9 },
  // Linhagens.
  { id: 'rShadowSlash', type: 'ninjutsu', lineage: 'nara', base: 10, perLevel: 2, chakra: 3 },
  { id: 'rExpandedHand', type: 'taijutsu', lineage: 'akimichi', base: 11, perLevel: 2, chakra: 2, effect: { kind: 'stun', chance: 0.1 } },
  { id: 'rPetals', type: 'genjutsu', lineage: 'yamanaka', base: 10, perLevel: 2, chakra: 3, effect: { kind: 'fear', chance: 0.3 } },
  { id: 'rSwarm', type: 'ninjutsu', lineage: 'aburame', base: 5, perLevel: 1, hits: 2, chakra: 4, effect: { kind: 'poison', chance: 0.5 } },
  { id: 'rFangs', type: 'taijutsu', lineage: 'inuzuka', base: 6, perLevel: 1, hits: 2, chakra: 3 },
  { id: 'rLeafHurricane', type: 'taijutsu', lineage: 'taijutsuProdigy', base: 6, perLevel: 1, hits: 2, chakra: 2, accuracy: 0.9 },
  { id: 'rPainIllusion', type: 'genjutsu', lineage: 'uchiha', base: 13, perLevel: 2, chakra: 3, effect: { kind: 'fear', chance: 0.2 } },
  { id: 'rVitalSeal', type: 'taijutsu', lineage: 'hyuuga', base: 9, perLevel: 2, chakra: 2, effect: { kind: 'stun', chance: 0.2 } },
  { id: 'rExplosiveSeal', type: 'ninjutsu', lineage: 'uzumaki', base: 12, perLevel: 2, chakra: 3, penetration: 0.5 },
  // Kekkei genkai: no lugar das técnicas dos dois elementos-pai.
  { id: 'rIce', type: 'ninjutsu', kekkeiGenkai: 'ice', base: 5, perLevel: 1, hits: 3, chakra: 3, accuracy: 0.9, effect: { kind: 'stun', chance: 0.15 } },
  { id: 'rSand', type: 'ninjutsu', kekkeiGenkai: 'sand', base: 12, perLevel: 2, chakra: 3, accuracy: 0.95 },
  { id: 'rLava', type: 'ninjutsu', kekkeiGenkai: 'lava', base: 14, perLevel: 2, chakra: 3, effect: { kind: 'burn', chance: 0.3 } },
  { id: 'rStorm', type: 'ninjutsu', kekkeiGenkai: 'storm', base: 7, perLevel: 1, hits: 2, chakra: 3, penetration: 0.2 },
  { id: 'rSteam', type: 'ninjutsu', kekkeiGenkai: 'steam', base: 10, perLevel: 2, chakra: 3, accuracy: 0.9, effect: { kind: 'poison', chance: 0.3 } },
  { id: 'rExplosion', type: 'ninjutsu', kekkeiGenkai: 'explosion', base: 20, perLevel: 3, chakra: 4, accuracy: 0.7 },
  { id: 'rWood', type: 'ninjutsu', kekkeiGenkai: 'wood', base: 10, perLevel: 2, chakra: 3, accuracy: 0.9, lifesteal: 0.5 },
];

export const roletaTechniquesById: Record<string, RTechniqueDef> = Object.fromEntries(roletaTechniques.map((t) => [t.id, t]));
