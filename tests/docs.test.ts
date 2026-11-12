import { readFileSync } from 'node:fs';
import { generatedBlock, replaceGenerated } from '../src/core/docTables';
import { DOC_TABLES } from '../scripts/docTablesList';
import { describe, expect, it } from 'vitest';
import type { VillainTechnique } from '../src/core/types';
import { techniquesById } from '../src/data/techniques';
import { roletaTechniques } from '../src/data/roleta/techniques';
import { roletaRelics } from '../src/data/relics';
import { roletaExtraVillains } from '../src/data/roleta/villains';
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

  it('toda relíquia do Roleta aparece na tabela de modos de docs/jornada/reliquias.md', () => {
    const text = doc('jornada/reliquias.md');
    const modes = text.slice(text.indexOf('## Modos'));
    const name = (id: string) => S.jornada.relics.list[id]?.name ?? S.roleta.relics[id]?.name ?? id;
    expect(roletaRelics.map((r) => name(r.id)).filter((n) => !has(modes, n))).toEqual([]);
  });

  it('todo vilão só do Roleta e as técnicas dele aparecem em docs/roleta/run.md', () => {
    const text = doc('roleta/run.md');
    const missing = roletaExtraVillains.flatMap((v) => [S.villains[v.id] ?? v.id, ...v.techniques.map((t) => S.roleta.techniques[t.id] ?? t.id)]).filter((n) => !has(text, n));
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

describe('tabelas geradas dos docs (v0.64.0)', () => {
  it('estão em dia com os dados (rode `npm run docs:tabelas` depois de mudar números)', () => {
    const stale = DOC_TABLES.filter(({ file, name, table }) => generatedBlock(readFileSync(file, 'utf8'), name) !== table());
    expect(stale.map((t) => `${t.file} (${t.name})`)).toEqual([]);
  });

  it('trocar o trecho gerado mantém o resto do doc', () => {
    const doc = 'antes\n<!-- gerado:x -->\nvelho\n<!-- /gerado -->\ndepois';
    const next = replaceGenerated(doc, 'x', 'novo');
    expect(next).toBe('antes\n<!-- gerado:x -->\nnovo\n<!-- /gerado -->\ndepois');
    expect(generatedBlock(next, 'x')).toBe('novo');
    expect(() => replaceGenerated('sem marcador', 'x', 'novo')).toThrow();
  });

  it('não depende da quebra de linha do arquivo (CRLF no Windows)', () => {
    const doc = 'antes\r\n<!-- gerado:x -->\r\na\r\nb\r\n<!-- /gerado -->\r\ndepois';
    expect(generatedBlock(doc, 'x')).toBe('a\nb');
    expect(replaceGenerated(doc, 'x', 'c\nd')).toBe('antes\r\n<!-- gerado:x -->\r\nc\r\nd\r\n<!-- /gerado -->\r\ndepois');
  });
});
