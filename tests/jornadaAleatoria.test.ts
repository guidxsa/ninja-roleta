import { describe, expect, it } from 'vitest';
import { drewRandomly, newGenericRun, newRandomGenericRun, openGenericClasses } from '../src/core/jornada/run';
import { jornadaData as data } from '../src/data/jornada';

// Card "Classe aleatória" da Campanha (docs/jornada/classes.md#classe-aleatória): a classe sai entre as liberadas e a
// run sempre ganha a relíquia do sorteio, também nas classes de elemento fixo.
const ALL = new Set(['j_unlockUchiha', 'j_unlockHyuuga']);
const nonStarter = (relics: readonly string[]) => relics.filter((id) => data.relics.find((r) => r.id === id)?.tier !== 'starter');

describe('classe aleatória (newRandomGenericRun)', () => {
  it('sem classes liberadas, sai sempre o Comum', () => {
    for (let seed = 1; seed <= 40; seed++) expect(newRandomGenericRun(seed, 'normal', data).classId).toBe('common');
  });

  it('com tudo liberado, cada classe aparece e nenhuma trancada sai', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) seen.add(newRandomGenericRun(seed, 'normal', data, ALL).classId);
    expect([...seen].sort()).toEqual(openGenericClasses(data, ALL).map((c) => c.id).sort());
    const onlyUchiha = new Set(['j_unlockUchiha']);
    for (let seed = 1; seed <= 100; seed++) expect(newRandomGenericRun(seed, 'normal', data, onlyUchiha).classId).not.toBe('hyuuga');
  });

  it('a mesma seed dá a mesma run (classe, herói e relíquias)', () => {
    const a = newRandomGenericRun(77, 'hard', data, ALL);
    const b = newRandomGenericRun(77, 'hard', data, ALL);
    expect([a.classId, a.hero, a.relics]).toEqual([b.classId, b.hero, b.relics]);
  });

  it('Uchiha e Hyuuga sorteados ganham a relíquia extra; escolhidos, não', () => {
    for (const classId of ['uchiha', 'hyuuga']) {
      const seed = Array.from({ length: 300 }, (_, i) => i + 1).find((s) => newRandomGenericRun(s, 'normal', data, ALL).classId === classId)!;
      const random = newRandomGenericRun(seed, 'normal', data, ALL);
      const chosen = newGenericRun(seed, 'normal', classId, data, ALL);
      expect(random.classPick).toBe('random');
      expect(drewRandomly(random)).toBe(true);
      expect(nonStarter(random.relics)).toHaveLength(1);
      expect(drewRandomly(chosen)).toBe(false);
      expect(nonStarter(chosen.relics)).toHaveLength(0);
      // Mesmo mapa, suportes e chefes da classe escolhida com a mesma seed: só a relíquia muda.
      expect([random.map, random.supports, random.bossPlan]).toEqual([chosen.map, chosen.supports, chosen.bossPlan]);
    }
  });

  it('o Comum sorteado continua com a relíquia; com o elemento escolhido no cardápio, sem', () => {
    const seed = Array.from({ length: 300 }, (_, i) => i + 1).find((s) => newRandomGenericRun(s, 'normal', data, ALL).classId === 'common')!;
    const random = newRandomGenericRun(seed, 'normal', data, ALL);
    expect(drewRandomly(random)).toBe(true);
    expect(nonStarter(random.relics)).toHaveLength(1);
    const chosen = newGenericRun(seed, 'normal', 'common', data, ALL, null, 'fire');
    expect(drewRandomly(chosen)).toBe(false);
    expect(nonStarter(chosen.relics)).toHaveLength(0);
  });
});
