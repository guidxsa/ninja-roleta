import type { AttackType, Element, KekkeiGenkaiId } from '../../core/types';
import type { EffectKind } from '../../core/effects';
import type { CloneKind } from '../../core/clones';

// Técnicas do Roleta enxuto (docs/roleta/combate.md#técnicas). Nomes visíveis em strings/roleta.ts.
// Cada técnica sobe sozinha com o nível: dano base = `base` + `perLevel` × (nível − 1). Sem multiplicador de elemento:
// o elemento só diz quem tem a técnica. Efeito no acerto com chance (Queimar, Veneno, Atordoar, Medo).

/** Os efeitos comuns aos dois modos (src/core/effects.ts, números em `balance.effects`). */
export type REffectKind = EffectKind;

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
  /**
   * Técnica de clone (src/core/clones.ts): cria um clone deste tipo, sem dano (no máximo 1; um novo substitui). Uma por
   * kit, no lugar do Bunshin: Kage no Uzumaki e no jinchuuriki, o elemental de quem tem a natureza (v0.77.0).
   */
  clone?: CloneKind;
  /** Barreira (src/core/barriers.ts): ergue um escudo do elemento da técnica com esta fração do HP máximo (v0.77.0). */
  barrierPct?: number;
  /** Barreira que devolve ao atacante esta fração do dano que segurou (Rotação). */
  reflectPct?: number;
  /** Nível em que a técnica entra no kit (despertar, v0.80.0). */
  minLevel?: number;
  /** Só com o dōjutsu ligado (Tsukuyomi, Selo dos Pontos Vitais, 64 Palmas). */
  requiresBuff?: 'sharingan' | 'byakugan';
  /** Só com um Portão aberto deste número ou acima (Lótus). */
  requiresGate?: number;
  /** Sem dano: uma roleta de acerto e, se pegar, o efeito (Olhar Hipnótico, Correntes de Chakra). */
  damageless?: boolean;
  /** Chakra que o vilão perde a cada golpe que acerta (ou quando o efeito pega, na técnica sem dano). */
  chakraDrain?: number;
  /** Técnica copiada pelo Sharingan: o id da técnica do vilão (o nome vem dela). */
  copyOf?: string;
}

export const BASIC = 'rBasic';
/** Id da técnica copiada pelo Sharingan na luta (src/core/roleta/battle.ts, `copyTechnique`). */
export const COPY = 'rCopy';
/** Bunshin no Jutsu: no kit inicial de toda origem que pode usar ninjutsu. */
export const BUNSHIN = 'rBunshin';

export const roletaTechniques: RTechniqueDef[] = [
  { id: BASIC, type: 'taijutsu', base: 8, perLevel: 1, chakra: 0, accuracy: 0.9 },
  // Clones (src/core/clones.ts): o Bunshin é ilusão (só distrai); os outros têm o traço do tipo (balance.clones.kinds).
  { id: BUNSHIN, type: 'ninjutsu', base: 0, perLevel: 0, chakra: 5, clone: 'bunshin' },
  { id: 'rKageBunshin', type: 'ninjutsu', base: 0, perLevel: 0, chakra: 8, clone: 'kage' },
  { id: 'rMizuBunshin', type: 'ninjutsu', base: 0, perLevel: 0, chakra: 6, clone: 'mizu' },
  { id: 'rDotonBunshin', type: 'ninjutsu', base: 0, perLevel: 0, chakra: 6, clone: 'doton' },
  { id: 'rMokutonBunshin', type: 'ninjutsu', base: 0, perLevel: 0, chakra: 8, clone: 'mokuton' },
  { id: 'rRaitonBunshin', type: 'ninjutsu', base: 0, perLevel: 0, chakra: 7, clone: 'raiton' },
  { id: 'rSunaBunshin', type: 'ninjutsu', base: 0, perLevel: 0, chakra: 6, clone: 'suna' },
  // Um por elemento.
  { id: 'rFire', type: 'ninjutsu', element: 'fire', base: 12, perLevel: 2, chakra: 6, effect: { kind: 'burn', chance: 0.25 } },
  { id: 'rWind', type: 'ninjutsu', element: 'wind', base: 11, perLevel: 2, chakra: 6, accuracy: 0.9, critBonus: 0.1 },
  { id: 'rLightning', type: 'ninjutsu', element: 'lightning', base: 13, perLevel: 2, chakra: 6, accuracy: 0.8, penetration: 0.25 },
  { id: 'rEarth', type: 'ninjutsu', element: 'earth', base: 11, perLevel: 2, chakra: 6, accuracy: 0.95, effect: { kind: 'stun', chance: 0.1 } },
  { id: 'rWater', type: 'ninjutsu', element: 'water', base: 6, perLevel: 1, hits: 2, chakra: 6, accuracy: 0.9 },
  // Barreiras (v0.77.0): uma por elemento, menos o raio. Ação de turno; o escudo dura 3 turnos de quem ergue.
  { id: 'rEarthWall', type: 'ninjutsu', element: 'earth', base: 0, perLevel: 0, chakra: 6, barrierPct: 0.28 },
  { id: 'rWaterWall', type: 'ninjutsu', element: 'water', base: 0, perLevel: 0, chakra: 6, barrierPct: 0.24 },
  { id: 'rFireWall', type: 'ninjutsu', element: 'fire', base: 0, perLevel: 0, chakra: 5, barrierPct: 0.2 },
  { id: 'rWindShield', type: 'ninjutsu', element: 'wind', base: 0, perLevel: 0, chakra: 5, barrierPct: 0.2 },
  // Linhagens.
  { id: 'rShadowSlash', type: 'ninjutsu', lineage: 'nara', base: 10, perLevel: 2, chakra: 6 },
  { id: 'rExpandedHand', type: 'taijutsu', lineage: 'akimichi', base: 12, perLevel: 2, chakra: 4, effect: { kind: 'stun', chance: 0.1 } },
  { id: 'rPetals', type: 'genjutsu', lineage: 'yamanaka', base: 10, perLevel: 2, chakra: 6, effect: { kind: 'fear', chance: 0.3 } },
  { id: 'rSwarm', type: 'ninjutsu', lineage: 'aburame', base: 5, perLevel: 1, hits: 2, chakra: 8, effect: { kind: 'poison', chance: 0.5 } },
  { id: 'rFangs', type: 'taijutsu', lineage: 'inuzuka', base: 5, perLevel: 1, hits: 2, chakra: 6 },
  // Roleta rápido e explosivo (v0.92.0, decisoes.md item 40): técnicas-chave novas ou adaptadas dos kits curtos.
  { id: 'rKunai', type: 'taijutsu', lineage: 'common', base: 12, perLevel: 3, chakra: 2, accuracy: 0.95 },
  { id: 'rDogClaw', type: 'taijutsu', lineage: 'inuzuka', base: 8, perLevel: 1, chakra: 4, effect: { kind: 'stun', chance: 0.15 } },
  { id: 'rGentleFist', type: 'taijutsu', lineage: 'hyuuga', base: 8, perLevel: 1, chakra: 3, accuracy: 0.95, chakraDrain: 2 },
  { id: 'rFounderFist', type: 'taijutsu', lineage: 'senju', base: 14, perLevel: 2, chakra: 5, accuracy: 0.85 },
  { id: 'rGreatFireball', type: 'ninjutsu', lineage: 'uchiha', element: 'fire', base: 11, perLevel: 2, chakra: 6, effect: { kind: 'burn', chance: 0.3 } },
  // Kits completos do clássico (v0.80.0): as exclusivas voltam, com o nível do despertar e o requisito de dōjutsu ou Portão.
  // Números do clássico na escala do Roleta (dano base parecido com o da técnica do elemento, custo em dobro).
  { id: 'rHumanBoulder', type: 'taijutsu', lineage: 'akimichi', base: 14, perLevel: 3, chakra: 8, accuracy: 0.8, minLevel: 4, effect: { kind: 'stun', chance: 0.2 } },
  // v0.88.2 (R1 do diagnóstico 2, aprovado pelo usuário): 1 golpe de 9 no lugar de 2 de 6; o golpe múltiplo barato fazia o
  // Prodígio bater o dobro das outras origens (Médio 93 → 76%).
  { id: 'rLeafHurricane', type: 'taijutsu', lineage: 'taijutsuProdigy', base: 8, perLevel: 1, chakra: 4, accuracy: 0.9 },
  { id: 'rPrimaryLotus', type: 'taijutsu', lineage: 'taijutsuProdigy', base: 12, perLevel: 2, chakra: 8, minLevel: 4, requiresGate: 1, effect: { kind: 'stun', chance: 0.25 } },
  { id: 'rHiddenLotus', type: 'taijutsu', lineage: 'taijutsuProdigy', base: 5, perLevel: 1, hits: 5, chakra: 12, minLevel: 7, requiresGate: 3 },
  // v0.88.2 (R1, aprovado pelo usuário): 6 → 3 de chakra; o Uchiha gastava o chakra no Sharingan e no Olhar e golpeava menos.
  { id: 'rHypnoticGaze', type: 'genjutsu', lineage: 'uchiha', base: 0, perLevel: 0, chakra: 3, accuracy: 0.8, damageless: true, effect: { kind: 'stun', chance: 1 } },
  { id: 'rPainIllusion', type: 'genjutsu', lineage: 'uchiha', base: 11, perLevel: 2, chakra: 6, effect: { kind: 'fear', chance: 0.2 } },
  { id: 'rTsukuyomi', type: 'genjutsu', lineage: 'uchiha', base: 20, perLevel: 3, chakra: 12, minLevel: 7, requiresBuff: 'sharingan', effect: { kind: 'stun', chance: 0.5 } },
  { id: 'rVitalSeal', type: 'taijutsu', lineage: 'hyuuga', base: 9, perLevel: 2, chakra: 4, accuracy: 1, requiresBuff: 'byakugan', chakraDrain: 3, effect: { kind: 'chakraBlock', chance: 0.25 } },
  { id: 'rRotation', type: 'ninjutsu', lineage: 'hyuuga', base: 0, perLevel: 0, chakra: 6, minLevel: 4, barrierPct: 0.26, reflectPct: 0.5 },
  { id: 'rSixtyFour', type: 'taijutsu', lineage: 'hyuuga', base: 5, perLevel: 1, hits: 4, chakra: 10, accuracy: 1, minLevel: 7, requiresBuff: 'byakugan', chakraDrain: 2 },
  { id: 'rExplosiveSeal', type: 'ninjutsu', lineage: 'uzumaki', base: 12, perLevel: 2, chakra: 6, penetration: 0.5 },
  { id: 'rChakraChains', type: 'ninjutsu', lineage: 'uzumaki', base: 0, perLevel: 0, chakra: 8, accuracy: 0.75, minLevel: 4, damageless: true, chakraDrain: 4, effect: { kind: 'stun', chance: 1 } },
  // Kekkei genkai: no lugar das técnicas dos dois elementos-pai.
  { id: 'rIce', type: 'ninjutsu', kekkeiGenkai: 'ice', base: 5, perLevel: 1, hits: 3, chakra: 6, accuracy: 0.9, effect: { kind: 'stun', chance: 0.15 } },
  { id: 'rSand', type: 'ninjutsu', kekkeiGenkai: 'sand', base: 12, perLevel: 2, chakra: 6, accuracy: 0.95 },
  { id: 'rLava', type: 'ninjutsu', kekkeiGenkai: 'lava', base: 14, perLevel: 2, chakra: 6, effect: { kind: 'burn', chance: 0.3 } },
  { id: 'rStorm', type: 'ninjutsu', kekkeiGenkai: 'storm', base: 7, perLevel: 1, hits: 2, chakra: 6, penetration: 0.2 },
  { id: 'rSteam', type: 'ninjutsu', kekkeiGenkai: 'steam', base: 10, perLevel: 2, chakra: 6, accuracy: 0.9, effect: { kind: 'poison', chance: 0.3 } },
  { id: 'rExplosion', type: 'ninjutsu', kekkeiGenkai: 'explosion', base: 20, perLevel: 3, chakra: 8, accuracy: 0.7 },
  { id: 'rWood', type: 'ninjutsu', kekkeiGenkai: 'wood', base: 10, perLevel: 2, chakra: 7, accuracy: 0.9, lifesteal: 0.5 },
];

export const roletaTechniquesById: Record<string, RTechniqueDef> = Object.fromEntries(roletaTechniques.map((t) => [t.id, t]));
