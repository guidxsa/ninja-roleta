// Campanha por origem: `npm run sim:origens -- --runs 300 --seed 1`
// Mede como cada linhagem atravessa a campanha completa no Roleta enxuto, com eventos e recompensas diretos.
// O combate clássico ficou em `npm run sim:classico`.
// `--bare` simula sem eventos nem recompensas (só XP e nível).
import type { Difficulty } from '../src/core/difficulty';
import { COMMON_LINEAGE, rollElements, rollKekkeiGenkai } from '../src/core/origin';

import { createRoletaPlayer } from '../src/core/roleta/player';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { roletaData } from '../src/data/roleta/index';
import { ptBR } from '../src/data/strings/ptBR';
import { roletaVillainsById as villainsById } from '../src/data/roleta/villains';
import { runRoletaRun } from '../src/sim/roletaRunner';

const gameData = roletaData.base;

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

const runs = arg('runs', 300);
const rng = createRng(arg('seed', 1));
const progression = !process.argv.includes('--bare');
// Ciclos do modo infinito que o bot tenta (o 1º é a vitória da run).
const cycles = Math.max(1, arg('ciclos', 3));

// Uma linha por origem dos dados (a roleta inteira), com o peso dela.
// O Prodígio do taijutsu sai do Comum que tira 0 elementos (v0.59.0): a fatia dele é a do Comum × a chance de 0.
const totalWeight = gameData.lineages.reduce((a, l) => a + l.weight, 0);
const commonDef = gameData.lineages.find((l) => l.id === COMMON_LINEAGE)!;
const zeroShare = (commonDef.elements.countWeights[0] ?? 0) / commonDef.elements.countWeights.reduce((a, b) => a + b, 0);
const share = (id: string, weight: number) =>
  id === COMMON_LINEAGE ? weight * (1 - zeroShare) : id === 'taijutsuProdigy' ? commonDef.weight * zeroShare : weight;
const origins = gameData.lineages.map((l) => ({
  label: `${ptBR.lineages[l.id] ?? l.id} (${Math.round((share(l.id, l.weight) / totalWeight) * 100)}%)`,
  make: (): Origin => ({
    lineageId: l.id === COMMON_LINEAGE ? null : l.id,
    // Elementos pela roleta da origem (quantidade e quais), como no jogo. O Comum com 0 é o Prodígio (linha própria):
    // aqui o Comum sorteia de novo até ter elemento.
    ...(() => {
      let elements = rollElements(l, rng, gameData).elements;
      while (l.id === COMMON_LINEAGE && elements.length === 0) elements = rollElements(l, rng, gameData).elements;
      return { elements, kekkeiGenkai: rollKekkeiGenkai(l, elements, rng, gameData).kekkeiGenkai };
    })(),
    jinchuuriki: false,
  }),
}));
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(5);
const difficulties = Object.keys(gameData.balance.difficulty.multipliers) as Difficulty[];

console.log(
  `\nRun do Roleta por origem: ${runs} runs por célula, ${progression ? 'com eventos e recompensas' : 'sem eventos nem recompensas'} (vence o 1º ciclo · rodadas por luta · onde mais parou · vence os ciclos 2..${cycles})\n`,
);
console.log(''.padEnd(28) + difficulties.map((d) => ptBR.difficulty[d].name.padEnd(38)).join(''));
for (const o of origins) {
  let line = o.label.padEnd(28);
  for (const d of difficulties) {
    let rounds = 0;
    let fights = 0;
    const won = Array.from({ length: cycles }, () => 0);
    const stops = new Map<string, number>();
    for (let i = 0; i < runs; i++) {
      const r = runRoletaRun(createRoletaPlayer(o.make(), roletaData, d), villainsById, rng, roletaData, d, cycles, progression);
      rounds += r.rounds.reduce((a, b) => a + b, 0);
      fights += r.rounds.length;
      for (let k = 0; k < r.cyclesWon; k++) won[k]!++;
      if (!r.won) stops.set(r.villainReached!, (stops.get(r.villainReached!) ?? 0) + 1);
    }
    const top = [...stops.entries()].sort((a, b) => b[1] - a[1])[0];
    const where = top ? `${ptBR.villains[top[0]] ?? top[0]} ${pct(top[1] / runs).trim()}` : '';
    const curve = won.slice(1).map((n) => pct(n / runs).trim()).join('/');
    line += `${pct(won[0]! / runs)} ${(rounds / Math.max(1, fights)).toFixed(1)}r ${where} ${curve}`.padEnd(38);
  }
  console.log(line);
}
console.log('');
