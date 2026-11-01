import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { VillainTechnique } from '../src/core/types';
import { gameData } from '../src/data/index';
import { ptBR as S } from '../src/data/strings/ptBR';
import { villains } from '../src/data/villains';

/** Os docs são o design: toda técnica dos dados precisa estar no catálogo certo (CLAUDE.md). */
const doc = (name: string) => readFileSync(new URL(`../docs/${name}`, import.meta.url), 'utf8');
const nameOf = (id: string) => (S.techniques as Record<string, string>)[id] ?? id;
/** Os nomes são de trabalho: a comparação ignora maiúsculas. */
const has = (text: string, name: string) => text.toLowerCase().includes(name.toLowerCase());

describe('docs batem com os dados', () => {
  it('toda técnica do jogador aparece em docs/tecnicas.md', () => {
    const text = doc('tecnicas.md');
    const missing = gameData.techniques.map((t) => nameOf(t.id)).filter((n) => !has(text, n));
    expect(missing).toEqual([]);
  });

  it('toda técnica de vilão aparece em docs/viloes.md', () => {
    const text = doc('viloes.md');
    const techs: VillainTechnique[] = villains.flatMap((v) => [
      ...v.techniques,
      ...(v.passive && 'monster' in v.passive ? (v.passive.monster?.techniques ?? []) : []),
    ]);
    const missing = [...new Set(techs.map((t) => nameOf(t.id)))].filter((n) => !has(text, n));

    expect(missing).toEqual([]);
  });
});
