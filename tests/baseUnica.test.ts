import { describe, expect, it } from 'vitest';
import { jornadaClasses, jornadaHero, jornadaHeroStats } from '../src/core/jornada/classes';
import { lineages } from '../src/data/lineages';
import { jornadaData as data } from '../src/data/jornada';

const scale = data.j.originScale;
const byId = (id: string) => lineages.find((l) => l.id === id)!;

describe('base única de origens e classes (v0.64.0)', () => {
  it('toda classe do Caminho Ninja vem de uma origem com bloco jornada', () => {
    expect(data.generic.classes.map((c) => c.id)).toEqual(['common', 'uchiha', 'hyuuga']);
    for (const c of data.generic.classes) {
      const origin = lineages.find((l) => l.jornada?.class?.id === c.id);
      expect(origin, c.id).toBeDefined();
      expect(c.hero).toBe(origin!.jornada!.hero.id);
    }
    expect(data.generic.classes).toEqual(jornadaClasses(lineages));
  });

  it('a natureza da classe sai da regra da origem', () => {
    const cls = (id: string) => data.generic.classes.find((c) => c.id === id)!;
    expect(cls('uchiha').fixedElement).toBe(byId('uchiha').elements.fixed);
    expect(cls('hyuuga').noElement).toBe(true);
    expect(cls('common').noElement).toBeUndefined();
    // O Comum sem elemento vira o protagonista do Prodígio, como no sorteio do Roleta.
    expect(cls('common').noElementHero).toBe(byId('taijutsuProdigy').jornada!.hero.id);
  });

  it('o protagonista aplica a fórmula sobre os status da origem', () => {
    for (const l of lineages.filter((x) => x.jornada)) {
      const st = jornadaHeroStats(l, scale);
      expect(st.hp, l.id).toBe(Math.floor(l.stats.hp * scale.hp) + (l.jornada!.hero.adjust?.hp ?? 0));
      expect(st.speed, l.id).toBe(l.stats.speed + scale.speedBonus + (l.jornada!.hero.adjust?.speed ?? 0));
      expect(st.offense.taijutsu, l.id).toBe(Math.floor(l.stats.taijutsu * scale.offense) + (l.jornada!.hero.adjust?.offense?.taijutsu ?? 0));
      expect(st.resistance.physical, l.id).toBe(Math.floor(l.resistance.physical * scale.resistance) + (l.jornada!.hero.adjust?.resistance?.physical ?? 0));
      const hero = data.characters[l.jornada!.hero.id]!;
      expect(hero).toEqual(jornadaHero(l, scale));
    }
  });

  it('quem começa forte num status cresce mais nele', () => {
    const hyuuga = data.characters.hyuugaNinja!;
    expect(hyuuga.growth.offense.taijutsu).toBeGreaterThan(hyuuga.growth.offense.genjutsu);
    const prodigy = data.characters.prodigy!;
    expect(prodigy.growth.offense.ninjutsu).toBe(0);
    expect(prodigy.noElement).toBe(true);
    expect(data.characters.uchihaNinja!.element).toBe('fire');
  });

  it('origem sem bloco jornada não vira classe nem personagem', () => {
    const nara = byId('nara');
    expect(nara.jornada).toBeUndefined();
    expect(jornadaHero(nara, scale)).toBeNull();
  });
});
