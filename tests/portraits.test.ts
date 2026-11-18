// Retratos (docs/visual.md, "Personagens"): toda chave de retrato dos dados tem desenho próprio e nenhum personagem
// repete o desenho de outro.
import { describe, expect, it, vi } from 'vitest';
import { images } from '../scripts/page-build';
import { avatarChoices } from '../src/core/avatar';
import { characters } from '../src/data/jornada/characters';
import { enemies } from '../src/data/jornada/enemies';
import { lineages } from '../src/data/lineages';
import { ragePortrait, ragePortraits, scenePortraits } from '../src/data/portraits';
import { roletaVillains } from '../src/data/roleta/villains';
import { villains } from '../src/data/villains';
import { hasPortraitArt, PORTRAIT_KEYS, portraitArt } from '../prototype/portraits/index';

const key = (spec: string) => spec.split(':')[1] ?? '';

describe('retratos', () => {
  const specs = new Map<string, string>();
  for (const c of [...characters, ...enemies]) {
    specs.set(c.id, c.portrait);
    for (const f of c.forms ?? []) if (f.portrait) specs.set(`${c.id}/${f.id}`, f.portrait);
  }
  for (const v of roletaVillains) if (v.portrait) specs.set(`roleta/${v.id}`, v.portrait);
  for (const [id, spec] of Object.entries(ragePortraits)) specs.set(`furia/${id}`, spec);
  for (const [id, spec] of Object.entries(scenePortraits)) specs.set(`cena/${id}`, spec);
  for (const l of lineages) if (l.jornada?.hero.portrait) specs.set(`classe/${l.id}`, l.jornada.hero.portrait);

  it('toda chave de retrato dos dados tem desenho (sem cair na reserva)', () => {
    for (const [who, spec] of specs) {
      expect(spec, who).toMatch(/^(ninja|villain):\w+$/);
      expect(hasPortraitArt(key(spec)), `${who} → ${spec}`).toBe(true);
    }
  });

  it('vilões do Roleta sem chave usam o desenho do próprio id', () => {
    const withSpec = new Set(roletaVillains.filter((v) => v.portrait).map((v) => v.id));
    for (const v of villains) if (!withSpec.has(v.id)) expect(hasPortraitArt(v.id), v.id).toBe(true);
  });

  it('linhagens e avatares têm desenho', () => {
    for (const l of lineages) expect(hasPortraitArt(l.id), l.id).toBe(true);
    const all = avatarChoices({ playedLineages: lineages.map((l) => l.id), achievements: ['j_bell', 'j_unlockUchiha', 'j_unlockHyuuga', 'j_sasukeEgg'] });
    for (const a of all) expect(hasPortraitArt(key(a)), a).toBe(true);
  });

  it('nenhum desenho se repete e os ids de gradiente não colidem', () => {
    const arts = PORTRAIT_KEYS.map((k) => portraitArt(k)!);
    expect(new Set(arts).size).toBe(arts.length);
    const ids = arts.map((a) => a.match(/id="(bg-[\w-]+)"/)?.[1]);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('as marcas do jinchūriki mudam o retrato da linhagem', () => {
    for (const l of lineages) expect(portraitArt(l.id, true), l.id).not.toBe(portraitArt(l.id, false));
  });

  it('carrega as ilustrações no Roleta e na Jornada com o desenho de reserva', async () => {
    const { list, meta } = images();
    vi.stubGlobal('__IMAGES__', list);
    try {
      const { fighterPortrait, hasOwnPortrait, ninjaPortrait, portraitImage, villainPortrait } = await import('../prototype/art');
      for (const id of PORTRAIT_KEYS) {
        const src = portraitImage(id);
        expect(src, id).toMatch(/\.webp$/);
        expect(meta[src!], id).toEqual([256, 256]);
      }
      expect(ninjaPortrait('senju', false)).toContain('src="img/ninja/senju.webp"');
      expect(ninjaPortrait('senju', true)).toContain(portraitArt('senju', true));
      expect(villainPortrait('neji')).toContain('src="img/ninja/neji.webp"');
      expect(fighterPortrait('kimimaro', 'ninja:kimimaro')).toContain('src="img/viloes/kimimaro.webp"');
      expect(fighterPortrait('haku-rage', 'villain:hakuUnmasked')).toContain('<template><svg');
      expect(hasOwnPortrait('hinata', undefined)).toBe(true);
      expect(fighterPortrait('hinata', 'ninja:common')).toContain('src="img/jornada/hinata.webp"');
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });

  it('o retrato de fúria vale com metade do HP ou menos, e só para quem tem um', () => {
    const known = new Set([...characters, ...enemies, ...villains].map((x) => x.id));
    for (const id of Object.keys(ragePortraits)) expect(known, id).toContain(id);
    expect(ragePortrait('haku', 51, 100)).toBeUndefined();
    expect(ragePortrait('haku', 50, 100)).toBe('villain:hakuUnmasked');
    expect(ragePortrait('haku', 0, 100)).toBeUndefined();
    expect(ragePortrait('mizuki', 10, 100)).toBeUndefined();
  });

  it('coordenadas válidas: nenhum NaN ou undefined no SVG', () => {
    for (const k of PORTRAIT_KEYS) expect(portraitArt(k), k).not.toMatch(/NaN|undefined/);
  });
});
