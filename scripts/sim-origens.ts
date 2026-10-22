// Campanha por origem: `npm run sim:origens -- --runs 300 --seed 1`
// Mede como cada linhagem atravessa a campanha completa (XP e nível; sem eventos nem recompensas).
import type { Difficulty } from '../src/core/difficulty';
import { createPlayer } from '../src/core/player';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
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
const elements = Object.keys(gameData.elementWeights) as Origin['affinity'][];

const origins: { label: string; make: (i: number) => Origin }[] = [
  { label: 'Comum', make: (i) => ({ lineageId: null, affinity: elements[i % 5]!, jinchuuriki: false }) },
  { label: 'Uchiha', make: () => ({ lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false }) },
  { label: 'Hyuuga', make: (i) => ({ lineageId: 'hyuuga', affinity: elements[i % 5]!, jinchuuriki: false }) },
  { label: 'Prodígio tai.', make: () => ({ lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false }) },
  { label: 'Uzumaki', make: (i) => ({ lineageId: 'uzumaki', affinity: elements[i % 5]!, jinchuuriki: false }) },
];
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(5);
const difficulties = Object.keys(gameData.balance.difficulty.multipliers) as Difficulty[];

console.log(`\nCampanha por origem: ${runs} runs por célula (vitória% · onde mais parou)\n`);
console.log(''.padEnd(16) + difficulties.map((d) => ptBR.difficulty[d].name.padEnd(26)).join(''));
for (const o of origins) {
  let line = o.label.padEnd(16);
  for (const d of difficulties) {
    let wins = 0;
    const stops = new Map<string, number>();
    for (let i = 0; i < runs; i++) {
      const r = runCampaign(createPlayer(o.make(i), gameData), campaign, villainsById, rng, gameData, d);
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
