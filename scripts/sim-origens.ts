// Campanha por origem: `npm run sim:origens -- --runs 300 --seed 1`
// Mede como cada linhagem atravessa a campanha completa, com eventos e recompensas automáticos.
// `--bare` simula sem eventos nem recompensas (só XP e nível).
import type { Difficulty } from '../src/core/difficulty';
import { COMMON_LINEAGE } from '../src/core/origin';
import { createPlayer } from '../src/core/player';
import { createRng } from '../src/core/rng';
import type { Element, Origin } from '../src/core/types';
import { campaign } from '../src/data/campaign';
import { gameData } from '../src/data/index';
import { ptBR } from '../src/data/strings/ptBR';
import { villainsById } from '../src/data/villains';
import { runCampaign } from '../src/sim/runner';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

const runs = arg('runs', 300);
const rng = createRng(arg('seed', 1));
const progression = !process.argv.includes('--bare');
const elements = Object.keys(gameData.elementWeights) as Element[];

// Uma linha por origem dos dados (a roleta inteira), com o peso dela.
const totalWeight = gameData.lineages.reduce((a, l) => a + l.weight, 0);
const origins = gameData.lineages.map((l) => ({
  label: `${ptBR.lineages[l.id] ?? l.id} (${Math.round((l.weight / totalWeight) * 100)}%)`,
  make: (i: number): Origin => ({
    lineageId: l.id === COMMON_LINEAGE ? null : l.id,
    affinity: l.affinity.kind === 'fixed' ? l.affinity.element : l.affinity.kind === 'none' ? null : elements[i % 5]!,
    jinchuuriki: false,
  }),
}));
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(5);
const difficulties = Object.keys(gameData.balance.difficulty.multipliers) as Difficulty[];

console.log(
  `\nCampanha por origem: ${runs} runs por célula, ${progression ? 'com eventos e recompensas' : 'sem eventos nem recompensas'} (vitória% · onde mais parou)\n`,
);
console.log(''.padEnd(28) + difficulties.map((d) => ptBR.difficulty[d].name.padEnd(26)).join(''));
for (const o of origins) {
  let line = o.label.padEnd(28);
  for (const d of difficulties) {
    let wins = 0;
    const stops = new Map<string, number>();
    for (let i = 0; i < runs; i++) {
      const r = runCampaign(createPlayer(o.make(i), gameData, d), campaign, villainsById, rng, gameData, d, { progression });
      if (r.won) wins++;
      else stops.set(r.villainReached!, (stops.get(r.villainReached!) ?? 0) + 1);
    }
    const top = [...stops.entries()].sort((a, b) => b[1] - a[1])[0];
    const where = top ? `${ptBR.villains[top[0]] ?? top[0]} ${pct(top[1] / runs).trim()}` : '';
    line += `${pct(wins / runs)} ${where}`.padEnd(26);
  }
  console.log(line);
}
console.log('');
