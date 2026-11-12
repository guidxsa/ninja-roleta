// Onde fica cada tabela gerada (o script e o teste usam a mesma lista).
import { heroStatsTable, originStatsTable } from '../src/core/docTables';
import { lineages } from '../src/data/lineages';
import { jornadaBalance } from '../src/data/jornada/balance';
import { ptBR } from '../src/data/strings/ptBR';

const names = ptBR.lineages as Record<string, string>;

export const DOC_TABLES: { file: string; name: string; table: () => string }[] = [
  { file: 'docs/base/origens.md', name: 'status-origens', table: () => originStatsTable(lineages, names) },
  { file: 'docs/jornada/classes.md', name: 'status-protagonistas', table: () => heroStatsTable(lineages, names, jornadaBalance.originScale) },
];
