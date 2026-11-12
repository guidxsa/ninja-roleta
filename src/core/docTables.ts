// Tabelas geradas dos docs (item 10, v0.64.0): o markdown sai dos dados, entre os marcadores
// `<!-- gerado:<nome> -->` e `<!-- /gerado -->`. Funções puras; `scripts/doc-tables.ts` grava os arquivos e
// `tests/docs.test.ts` confere que estão em dia.
import { jornadaHeroStats, type OriginScale } from './jornada/classes';
import type { LineageDef } from './types';

/** Pontos da origem no orçamento de referência: ataques e resistências 1; speed 1,5; 10 de HP 1; 2 de chakra 1. */
export function originPoints(l: LineageDef): number {
  const s = l.stats;
  return s.taijutsu + s.ninjutsu + s.genjutsu + l.resistance.physical + l.resistance.mental + s.speed * 1.5 + s.hp / 10 + s.chakra / 2;
}

/** Número no padrão dos docs: vírgula decimal, sem zeros sobrando. */
const num = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

const row = (cells: (string | number)[]) => `| ${cells.map((c) => (typeof c === 'number' ? num(c) : c)).join(' | ')} |`;

/** Status iniciais das origens (docs/base/origens.md#status-iniciais). */
export function originStatsTable(lineages: readonly LineageDef[], names: Record<string, string>): string {
  const head = ['Origem', 'Taijutsu', 'Ninjutsu', 'Genjutsu', 'Res. física', 'Res. mental', 'Speed', 'HP', 'Chakra', 'Pontos'];
  return [
    row(head),
    row(head.map(() => '---')),
    ...lineages.map((l) => {
      const s = l.stats;
      return row([names[l.id] ?? l.id, s.taijutsu, s.ninjutsu, s.genjutsu, l.resistance.physical, l.resistance.mental, s.speed, s.hp, s.chakra, originPoints(l)]);
    }),
  ].join('\n');
}

/** Protagonistas do Caminho Ninja calculados das origens (docs/jornada/classes.md#status-derivados). */
export function heroStatsTable(lineages: readonly LineageDef[], names: Record<string, string>, scale: OriginScale): string {
  const head = ['Origem', 'Protagonista', 'HP', 'Chakra', 'Speed', 'Taijutsu', 'Ninjutsu', 'Genjutsu', 'Res. física', 'Res. mental'];
  return [
    row(head),
    row(head.map(() => '---')),
    ...lineages
      .filter((l) => l.jornada)
      .map((l) => {
        const st = jornadaHeroStats(l, scale);
        return row([names[l.id] ?? l.id, `\`${l.jornada!.hero.id}\``, st.hp, st.chakra, st.speed, st.offense.taijutsu, st.offense.ninjutsu, st.offense.genjutsu, st.resistance.physical, st.resistance.mental]);
      }),
  ].join('\n');
}

const open = (name: string) => `<!-- gerado:${name} -->`;
const CLOSE = '<!-- /gerado -->';

/** Trecho gerado do doc (null sem os marcadores). */
export function generatedBlock(doc: string, name: string): string | null {
  const a = doc.indexOf(open(name));
  if (a < 0) return null;
  const b = doc.indexOf(CLOSE, a);
  if (b < 0) return null;
  // Sem depender da quebra de linha do arquivo (o Git no Windows devolve CRLF).
  return doc.slice(a + open(name).length, b).replace(/\r\n/g, '\n').replace(/^\n/, '').replace(/\n$/, '');
}

/** Doc com o trecho gerado trocado. Sem os marcadores, lança erro (o doc precisa dizer onde a tabela fica). */
export function replaceGenerated(doc: string, name: string, table: string): string {
  const a = doc.indexOf(open(name));
  const b = a < 0 ? -1 : doc.indexOf(CLOSE, a);
  if (a < 0 || b < 0) throw new Error(`marcadores de "${name}" ausentes`);
  // Mantém a quebra de linha que o arquivo já usa.
  const eol = doc.includes('\r\n') ? '\r\n' : '\n';
  return `${doc.slice(0, a)}${open(name)}${eol}${table.replace(/\n/g, eol)}${eol}${doc.slice(b)}`;
}
