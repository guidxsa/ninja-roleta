// Campanha por origem: `npm run sim:origens -- --runs 300 --seed 1`
// Mede como cada linhagem atravessa a campanha completa no Roleta enxuto, com eventos e recompensas diretos.
// O combate clássico ficou em `npm run sim:classico`.
// `--bare` simula sem eventos nem recompensas (só XP e nível).
import type { Difficulty } from '../src/core/difficulty';
import { COMMON_LINEAGE, rollElements, rollKekkeiGenkai } from '../src/core/origin';

import { createRoletaPlayer } from '../src/core/roleta/player';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { campaign } from '../src/data/campaign';
import { roletaData } from '../src/data/roleta/index';
import { ptBR } from '../src/data/strings/ptBR';
import { villainsById } from '../src/data/villains';
import { runRoletaCampaign } from '../src/sim/roletaRunner';

const gameData = roletaData.base;

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

const runs = arg('runs', 300);
const rng = createRng(arg('seed', 1));
const progression = !process.argv.includes('--bare');

// Uma linha por origem dos dados (a roleta inteira), com o peso dela.
const totalWeight = gameData.lineages.reduce((a, l) => a + l.weight, 0);
const origins = gameData.lineages.map((l) => ({
  label: `${ptBR.lineages[l.id] ?? l.id} (${Math.round((l.weight / totalWeight) * 100)}%)`,
  make: (): Origin => ({
    lineageId: l.id === COMMON_LINEAGE ? null : l.id,
    // Elementos pela roleta da origem (quantidade e quais), como no jogo.
    ...(() => {
      const elements = rollElements(l, rng, gameData).elements;
      return { elements, kekkeiGenkai: rollKekkeiGenkai(l, elements, rng, gameData).kekkeiGenkai };
    })(),
    jinchuuriki: false,
  }),
}));
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(5);
const difficulties = Object.keys(gameData.balance.difficulty.multipliers) as Difficulty[];

console.log(
  `\nCampanha por origem: ${runs} runs por célula, ${progression ? 'com eventos e recompensas' : 'sem eventos nem recompensas'} (vitória% · rodadas por luta · onde mais parou)\n`,
);
console.log(''.padEnd(28) + difficulties.map((d) => ptBR.difficulty[d].name.padEnd(30)).join(''));
for (const o of origins) {
  let line = o.label.padEnd(28);
  for (const d of difficulties) {
    let wins = 0;
    let rounds = 0;
    let fights = 0;
    const stops = new Map<string, number>();
    for (let i = 0; i < runs; i++) {
      const r = runRoletaCampaign(createRoletaPlayer(o.make(), roletaData, d), campaign, villainsById, rng, roletaData, d, progression);
      rounds += r.rounds.reduce((a, b) => a + b, 0);
      fights += r.rounds.length;
      if (r.won) wins++;
      else stops.set(r.villainReached!, (stops.get(r.villainReached!) ?? 0) + 1);
    }
    const top = [...stops.entries()].sort((a, b) => b[1] - a[1])[0];
    const where = top ? `${ptBR.villains[top[0]] ?? top[0]} ${pct(top[1] / runs).trim()}` : '';
    line += `${pct(wins / runs)} ${(rounds / Math.max(1, fights)).toFixed(1)}r ${where}`.padEnd(30);
  }
  console.log(line);
}
console.log('');
