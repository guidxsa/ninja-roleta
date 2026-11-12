// Gera as tabelas numéricas dos docs a partir dos dados (item 10, v0.64.0).
// `npm run docs:tabelas` grava; `npm run docs:tabelas -- --check` só confere (sai com erro se estiver desatualizado).
import { readFileSync, writeFileSync } from 'node:fs';
import { DOC_TABLES } from './docTablesList';
import { replaceGenerated } from '../src/core/docTables';

const check = process.argv.includes('--check');
let stale = 0;
for (const { file, name, table } of DOC_TABLES) {
  const doc = readFileSync(file, 'utf8');
  const next = replaceGenerated(doc, name, table());
  if (next === doc) continue;
  stale++;
  if (check) console.log(`desatualizado: ${file} (${name})`);
  else {
    writeFileSync(file, next);
    console.log(`atualizado: ${file} (${name})`);
  }
}
if (!stale) console.log('tabelas em dia');
if (check && stale) process.exit(1);
