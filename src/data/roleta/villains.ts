// Vilões do Roleta por categoria (docs/roleta/run.md#ciclo). Cada luta do ciclo sorteia um vilão da categoria do
// passo, sem repetir no mesmo ciclo. As fichas são as da base (src/data/villains.ts).

export type RCategory = 'genin' | 'chunin' | 'jounin' | 'boss';

export const roletaCategories: Record<RCategory, string[]> = {
  genin: ['mizuki', 'examSand', 'examSound', 'examLeaf'],
  chunin: ['haku', 'jirobo', 'kidomaru', 'tayuya', 'sakon'],
  jounin: ['zabuza', 'gaara', 'kabuto'],
  boss: ['orochimaru'],
};

/** Um ciclo: 2 genin, 2 chunin, 1 jounin e o chefe. Depois do chefe, o próximo ciclo começa (mais forte). */
export const roletaCycle: RCategory[] = ['genin', 'genin', 'chunin', 'chunin', 'jounin', 'boss'];

/** Categoria de cada vilão. */
export const categoryOf: Record<string, RCategory> = Object.fromEntries(
  (Object.entries(roletaCategories) as [RCategory, string[]][]).flatMap(([cat, ids]) => ids.map((id) => [id, cat])),
);
