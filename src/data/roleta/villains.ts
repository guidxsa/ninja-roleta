import type { VillainDef } from '../../core/types';
import { balance } from '../balance';
import { villains as baseVillains } from '../villains';

// Vilões do Roleta por categoria (docs/roleta/run.md#ciclo). Cada luta do ciclo sorteia um vilão da categoria do
// passo, sem repetir no mesmo ciclo. As fichas são as da base (src/data/villains.ts) mais as do Roleta abaixo,
// vindas dos inimigos da Jornada (v0.47.0), no formato enxuto (sem reações, barreiras nem golpe carregado).

const curseMark = { kind: 'cloak', variant: 'curseMark', cloak: { ...balance.jinchuuriki.cloak }, genjutsuImmune: false } as const;

/** Fichas só do Roleta. `portrait`: o retrato da Jornada (ninja:... ou villain:...). */
export const roletaExtraVillains: VillainDef[] = [
  // Genin
  { id: 'bandit', element: 'earth', hp: 70, chakra: 0, speed: 9, offense: { taijutsu: 8, ninjutsu: 0, genjutsu: 0 }, resistance: { physical: 7, mental: 6 }, critBonus: 0.02, xp: 70, portrait: 'ninja:thug',
    techniques: [{ id: 'rvClub', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 3 }, { id: 'rvAmbush', type: 'taijutsu', baseDamage: 5, chakraCost: 0, weight: 2, hits: 2, accuracy: 0.8 }] },
  { id: 'gatoThug', element: 'earth', hp: 65, chakra: 0, speed: 8, offense: { taijutsu: 9, ninjutsu: 0, genjutsu: 0 }, resistance: { physical: 6, mental: 6 }, critBonus: 0.03, xp: 70, portrait: 'ninja:thug',
    techniques: [{ id: 'rvClub', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 3 }, { id: 'rvKatana', type: 'taijutsu', baseDamage: 11, chakraCost: 0, weight: 2, accuracy: 0.75 }] },
  { id: 'mistRogue', element: 'water', hp: 80, chakra: 14, speed: 11, offense: { taijutsu: 7, ninjutsu: 9, genjutsu: 3 }, resistance: { physical: 8, mental: 8 }, critBonus: 0.02, xp: 70, portrait: 'ninja:mist',
    techniques: [{ id: 'rvKunai', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 3 }, { id: 'rvWaterBullet', type: 'ninjutsu', baseDamage: 10, chakraCost: 4, weight: 2 }] },
  { id: 'grassNinja', element: 'earth', hp: 85, chakra: 14, speed: 11, offense: { taijutsu: 9, ninjutsu: 8, genjutsu: 4 }, resistance: { physical: 9, mental: 8 }, critBonus: 0.02, xp: 70, portrait: 'ninja:grass',
    techniques: [{ id: 'rvKunai', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 3 }, { id: 'rvGrassBlade', type: 'ninjutsu', baseDamage: 10, chakraCost: 4, weight: 2 }] },
  { id: 'rainNinja', element: 'water', hp: 80, chakra: 16, speed: 11, offense: { taijutsu: 8, ninjutsu: 7, genjutsu: 9 }, resistance: { physical: 8, mental: 9 }, critBonus: 0.02, xp: 70, portrait: 'ninja:rain',
    techniques: [{ id: 'rvUmbrella', type: 'taijutsu', baseDamage: 5, chakraCost: 0, weight: 2, hits: 2, accuracy: 0.8 }, { id: 'rvRainClone', type: 'genjutsu', baseDamage: 9, chakraCost: 4, weight: 2 }] },
  // Chunin
  { id: 'demonBrothers', element: 'water', hp: 100, chakra: 10, speed: 12, offense: { taijutsu: 10, ninjutsu: 4, genjutsu: 0 }, resistance: { physical: 11, mental: 9 }, critBonus: 0.02, xp: 100, portrait: 'ninja:mist',
    techniques: [{ id: 'rvChainClaw', type: 'taijutsu', baseDamage: 9, chakraCost: 0, weight: 3 }],
    // Dois irmãos: cada ataque vale por 2 golpes, numa roleta só, cada um com 60% do dano.
    passive: { kind: 'mirrors', actions: 2, damageMult: 0.6 } },
  { id: 'dosu', element: 'wind', hp: 95, chakra: 18, speed: 10, offense: { taijutsu: 9, ninjutsu: 11, genjutsu: 5 }, resistance: { physical: 10, mental: 10 }, critBonus: 0.03, xp: 100, portrait: 'villain:examSound',
    techniques: [{ id: 'rvKunai', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 2 }, { id: 'rvSoundWave', type: 'ninjutsu', baseDamage: 11, chakraCost: 5, weight: 2 }] },
  { id: 'zaku', element: 'wind', hp: 90, chakra: 18, speed: 11, offense: { taijutsu: 7, ninjutsu: 12, genjutsu: 4 }, resistance: { physical: 9, mental: 9 }, critBonus: 0.03, xp: 100, portrait: 'villain:examSound',
    techniques: [{ id: 'rvKunai', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 2 }, { id: 'rvAirBlast', type: 'ninjutsu', baseDamage: 12, chakraCost: 5, weight: 2 }] },
  { id: 'kin', element: 'wind', hp: 85, chakra: 18, speed: 12, offense: { taijutsu: 7, ninjutsu: 6, genjutsu: 12 }, resistance: { physical: 9, mental: 12 }, critBonus: 0.03, xp: 100, portrait: 'villain:examSound',
    techniques: [{ id: 'rvKunai', type: 'taijutsu', baseDamage: 8, chakraCost: 0, weight: 2 }, { id: 'rvBellGenjutsu', type: 'genjutsu', baseDamage: 9, chakraCost: 4, weight: 2 }] },
  // Jounin
  { id: 'kimimaro', element: 'earth', hp: 190, chakra: 30, speed: 14, offense: { taijutsu: 14, ninjutsu: 6, genjutsu: 4 }, resistance: { physical: 16, mental: 12 }, critBonus: 0.05, xp: 220, portrait: 'ninja:kimimaro',
    techniques: [{ id: 'rvBoneDance', type: 'taijutsu', baseDamage: 7, chakraCost: 3, weight: 2, hits: 3, accuracy: 0.85 }, { id: 'rvBoneDrill', type: 'taijutsu', baseDamage: 15, chakraCost: 4, weight: 2 }],
    passive: curseMark },
  { id: 'neji', element: 'earth', hp: 160, chakra: 28, speed: 14, offense: { taijutsu: 14, ninjutsu: 6, genjutsu: 4 }, resistance: { physical: 14, mental: 13 }, critBonus: 0.04, xp: 200, portrait: 'ninja:hyuuga',
    techniques: [{ id: 'rvGentleFist', type: 'taijutsu', baseDamage: 11, chakraCost: 0, weight: 3, accuracy: 0.95 }, { id: 'rvSixtyFour', type: 'taijutsu', baseDamage: 4, chakraCost: 8, weight: 1, hits: 4, accuracy: 0.95 }] },
];

/** Todas as fichas que o Roleta usa (as da base e as dele). */
export const roletaVillains: VillainDef[] = [...baseVillains, ...roletaExtraVillains];
export const roletaVillainsById: Record<string, VillainDef> = Object.fromEntries(roletaVillains.map((v) => [v.id, v]));

export type RCategory = 'genin' | 'chunin' | 'jounin' | 'boss';

export const roletaCategories: Record<RCategory, string[]> = {
  genin: ['mizuki', 'examSand', 'examSound', 'examLeaf', 'bandit', 'gatoThug', 'mistRogue', 'grassNinja', 'rainNinja'],
  chunin: ['haku', 'jirobo', 'kidomaru', 'tayuya', 'sakon', 'demonBrothers', 'dosu', 'zaku', 'kin'],
  jounin: ['zabuza', 'gaara', 'kabuto', 'kimimaro', 'neji'],
  boss: ['orochimaru'],
};

/** Um ciclo: 2 genin, 2 chunin, 1 jounin e o chefe. Depois do chefe, o próximo ciclo começa (mais forte). */
export const roletaCycle: RCategory[] = ['genin', 'genin', 'chunin', 'chunin', 'jounin', 'boss'];

/** Categoria de cada vilão. */
export const categoryOf: Record<string, RCategory> = Object.fromEntries(
  (Object.entries(roletaCategories) as [RCategory, string[]][]).flatMap(([cat, ids]) => ids.map((id) => [id, cat])),
);
