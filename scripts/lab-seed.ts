// Acha a seed de um cenário do UI Lab que depende de sorteio (campo `expect`): a primeira seed em que o resultado bate.
// Uso: `npm run lab:seed -- <id>` ou `npm run lab:seed -- --all` (todos os que falham com a seed atual).
// A seed achada vai para a tabela SEEDS do arquivo do cenário (prototype/lab/scenarios/).
import { createRng } from '../src/core/rng';
import { SCENARIOS } from '../prototype/lab/registry';

const arg = process.argv[2];
const MAX = 20000;
const list = arg === '--all' ? SCENARIOS.filter((s) => s.expect && !s.expect(createRng(s.seed ?? 1))) : SCENARIOS.filter((s) => s.id === arg);
if (!list.length) {
  console.log(arg === '--all' ? 'Todas as seeds batem.' : `Cenário desconhecido: ${arg}`);
  process.exit(arg === '--all' ? 0 : 1);
}
for (const s of list) {
  if (!s.expect) {
    console.log(`${s.id}: não tem expect (não depende de sorteio)`);
    continue;
  }
  let seed = 1;
  while (seed <= MAX && !s.expect(createRng(seed))) seed++;
  console.log(seed <= MAX ? `'${s.id}': ${seed},` : `${s.id}: nenhuma seed até ${MAX}`);
}
