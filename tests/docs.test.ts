import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { VillainTechnique } from '../src/core/types';
import { techniquesById } from '../src/data/techniques';
import { roletaTechniques } from '../src/data/roleta/techniques';
import { ptBR as S } from '../src/data/strings/ptBR';
import { villains } from '../src/data/villains';
import { enemies } from '../src/data/jornada/enemies';
import { allyTechniques, classTechniques, elementalTechniques, enemyTechniques } from '../src/data/jornada/techniques';

/** Os docs são o design: toda técnica dos dados precisa estar no catálogo certo (CLAUDE.md). */
const doc = (name: string) => readFileSync(new URL(`../docs/${name}`, import.meta.url), 'utf8');
const nameOf = (id: string) => (S.techniques as Record<string, string>)[id] ?? id;
/** Os nomes são de trabalho: a comparação ignora maiúsculas. */
const has = (text: string, name: string) => text.toLowerCase().includes(name.toLowerCase());

describe('docs batem com os dados', () => {
  it('toda técnica do jogador aparece em docs/base/tecnicas.md', () => {
    const text = doc('base/tecnicas.md');
    const missing = Object.keys(techniquesById).map(nameOf).filter((n) => !has(text, n));
    expect(missing).toEqual([]);
  });

  it('toda técnica do Roleta enxuto aparece em docs/roleta/combate.md', () => {
    const text = doc('roleta/combate.md');
    const missing = roletaTechniques.map((t) => S.roleta.techniques[t.id] ?? t.id).filter((n) => !has(text, n));
    expect(missing).toEqual([]);
  });

  it('toda técnica de vilão aparece em docs/base/viloes.md', () => {
    const text = doc('base/viloes.md');
    const techs: VillainTechnique[] = villains.flatMap((v) => [
      ...v.techniques,
      ...(v.passive && 'monster' in v.passive ? (v.passive.monster?.techniques ?? []) : []),
    ]);
    const missing = [...new Set(techs.map((t) => nameOf(t.id)))].filter((n) => !has(text, n));

    expect(missing).toEqual([]);
  });

  it('toda técnica e inimigo da Jornada aparecem nos docs da Jornada', () => {
    const J = S.jornada;
    const allies = doc('jornada/personagens.md');
    const foes = doc('jornada/inimigos.md');
    const missing = [
      ...[...allyTechniques, ...elementalTechniques, ...classTechniques].map((t) => J.techniques[t.id] ?? t.id).filter((n) => !has(allies, n)),
      ...enemyTechniques.map((t) => J.techniques[t.id] ?? t.id).filter((n) => !has(foes, n)),
      ...enemies.map((e) => J.names[e.id] ?? e.id).filter((n) => !has(foes, n)),
    ];
    expect(missing).toEqual([]);
  });
});
