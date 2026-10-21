// Simulação de balanceamento: `npm run sim -- --fights 2000 --seed 42`
import { rollOrigin } from '../src/core/origin';
import { createPlayer } from '../src/core/player';
import { createRng } from '../src/core/rng';
import type { Origin } from '../src/core/types';
import { campaign } from '../src/data/campaign';
import { gameData } from '../src/data/index';
import { ptBR } from '../src/data/strings/ptBR';
import { villains, villainsById } from '../src/data/villains';
import { runBattle, runCampaign } from '../src/sim/runner';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

const fights = arg('fights', 2000);
const seed = arg('seed', 1);
const rng = createRng(seed);

const archetypes: { label: string; origin: Origin }[] = [
  { label: 'Comum (Fogo)', origin: { lineageId: null, affinity: 'fire', jinchuuriki: false } },
  { label: 'Comum + Jinch.', origin: { lineageId: null, affinity: 'fire', jinchuuriki: true } },
  { label: 'Uchiha', origin: { lineageId: 'uchiha', affinity: 'fire', jinchuuriki: false } },
  { label: 'Hyuuga (Água)', origin: { lineageId: 'hyuuga', affinity: 'water', jinchuuriki: false } },
  { label: 'Prodígio tai.', origin: { lineageId: 'taijutsuProdigy', affinity: null, jinchuuriki: false } },
  { label: 'Uzumaki (Vento)', origin: { lineageId: 'uzumaki', affinity: 'wind', jinchuuriki: false } },
];

const pad = (s: string, n: number) => s.padEnd(n);
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);

console.log(`\nSimulação: ${fights} lutas por célula, seed ${seed}`);
console.log('Cada luta com jogador recém-criado (1 item de retorno), sem recompensas.\n');
console.log('Célula = vitória% / rodadas médias / itens de retorno usados por luta\n');

const colWidth = 18;
console.log(pad('', 16) + villains.map((v) => pad(ptBR.villains[v.id] ?? v.id, colWidth)).join(''));
for (const a of archetypes) {
  const player = createPlayer(a.origin, gameData);
  let line = pad(a.label, 16);
  for (const v of villains) {
    let wins = 0;
    let rounds = 0;
    let revives = 0;
    for (let i = 0; i < fights; i++) {
      const r = runBattle(player, v, rng, gameData);
      if (r.status === 'won') wins++;
      rounds += r.round;
      revives += r.player.revivesUsed;
    }
    line += pad(`${pct(wins / fights)} ${(rounds / fights).toFixed(1).padStart(4)} ${(revives / fights).toFixed(2)}`, colWidth);
  }
  console.log(line);
}

// Campanha completa com origens sorteadas (exame pulado, sem recompensas).
const runs = Math.max(1, Math.floor(fights / 2));
const stopCount = new Map<string, number>();
let victories = 0;
let allRounds = 0;
let fightCount = 0;
for (let i = 0; i < runs; i++) {
  const { origin } = rollOrigin(rng, gameData);
  const result = runCampaign(createPlayer(origin, gameData), campaign, villainsById, rng, gameData);
  allRounds += result.rounds.reduce((a, b) => a + b, 0);
  fightCount += result.rounds.length;
  if (result.won) victories++;
  else stopCount.set(result.villainReached!, (stopCount.get(result.villainReached!) ?? 0) + 1);
}

console.log(`\nCampanha completa: ${runs} runs com origem sorteada (sem recompensas, exame pulado)`);
console.log(`  Vitórias: ${pct(victories / runs)}   Rodadas médias por luta: ${(allRounds / fightCount).toFixed(1)}`);
console.log('  Onde as runs terminaram:');
for (const v of villains) {
  const n = stopCount.get(v.id) ?? 0;
  if (n > 0) console.log(`    ${pad(ptBR.villains[v.id] ?? v.id, 12)} ${pct(n / runs)}`);
}
console.log('');
