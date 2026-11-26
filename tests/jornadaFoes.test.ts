import { describe, expect, it } from 'vitest';
import { pathFoeGroups, storyFoeGroups } from '../src/core/jornada/foes';
import { jornadaData } from '../src/data/jornada';
import { enemies, enemiesById } from '../src/data/jornada/enemies';
import { roletaCategories } from '../src/data/roleta/villains';
import { foeDescs } from '../src/data/strings/bingo';

const isEnemy = (id: string) => Boolean(enemiesById[id]);

describe('Livro Bingo da Jornada: seções', () => {
  const story = storyFoeGroups(jornadaData.stages, isEnemy);
  const path = pathFoeGroups(jornadaData.generic, isEnemy);

  it('um grupo por arco da História e por estágio do Caminho Ninja, sem repetir inimigo no grupo', () => {
    expect(story.map((g) => g.id)).toEqual(jornadaData.stages.map((s) => s.id));
    expect(path.map((g) => g.id)).toEqual(['g1', 'g2', 'g3']);
    for (const g of [...story, ...path]) expect(new Set(g.foes.map((f) => f.id)).size).toBe(g.foes.length);
  });

  it('o grau vem da parada: o Haku é chefe e o Zabuza elite nas Ondas e o capanga é luta comum', () => {
    const waves = story.find((g) => g.id === 'waves')!;
    expect(waves.foes.find((f) => f.id === 'haku')?.tier).toBe('boss');
    expect(waves.foes.find((f) => f.id === 'zabuza')?.tier).toBe('elite');
    expect(waves.foes.find((f) => f.id === 'gatoThug')?.tier).toBe('common');
    expect(waves.foes.some((f) => f.id === 'gatoMerc')).toBe(true);
    const g3 = path.find((g) => g.id === 'g3')!;
    expect(g3.foes.find((f) => f.id === 'itachi')?.tier).toBe('elite');
  });

  it('só entram inimigos (os aliados que o roteiro traz ficam de fora)', () => {
    const ids = [...story, ...path].flatMap((g) => g.foes.map((f) => f.id));
    expect(ids.every(isEnemy)).toBe(true);
    expect(ids).not.toContain('iruka');
  });

  it('todo inimigo da Jornada aparece em alguma seção', () => {
    const shown = new Set([...story, ...path].flatMap((g) => g.foes.map((f) => f.id)));
    expect(enemies.filter((e) => !shown.has(e.id)).map((e) => e.id)).toEqual([]);
  });
});

describe('Livro Bingo: descrições', () => {
  it('todo inimigo do Arcade e da Jornada tem uma descrição curta, e nenhuma sobra', () => {
    const ids = new Set([...Object.values(roletaCategories).flat(), ...enemies.map((e) => e.id)]);
    expect([...ids].filter((id) => !foeDescs[id])).toEqual([]);
    expect(Object.keys(foeDescs).filter((id) => !ids.has(id))).toEqual([]);
    expect(Object.values(foeDescs).filter((d) => d.length > 140)).toEqual([]);
  });
});
