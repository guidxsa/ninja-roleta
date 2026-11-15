// Run do Roleta montada pelas regras reais: origem escolhida (labOrigin), jogador do Roleta enxuto subindo de nível pelo
// `levelUp` de verdade, e a run posicionada num passo e ciclo. Deixa a sessão com a run (como a origem deixaria).
import type { Difficulty } from '../../../src/core/difficulty';
import { labOrigin } from '../../../src/core/lab';
import { xpToNextLevel, type PlayerState } from '../../../src/core/player';
import { levelUp } from '../../../src/core/progression';
import { createRng } from '../../../src/core/rng';
import { createRoletaPlayer } from '../../../src/core/roleta/player';
import { drawVillain, gainRoletaRelic, newRoletaRun, type RRun } from '../../../src/core/roleta/run';
import { emptyRunStats } from '../../../src/core/runStats';
import type { Element } from '../../../src/core/types';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { NO_MODS } from '../../roleta/common';
import { ses, type Campaign } from '../../roleta/session';

export interface RoletaFixture {
  lineage?: string;
  elements?: Element[];
  jinchuuriki?: boolean;
  difficulty?: Difficulty;
  level?: number;
  /** Passo do ciclo (0 a 5; 5 é o chefe). */
  step?: number;
  /** Ciclo, contando do 0. */
  cycle?: number;
  /** Relíquias do Roleta já ganhas. */
  relics?: string[];
  /** Ajustes finais no jogador (moedas, pesos de treino, XP, upgrades pendentes). Estado, nunca regra. */
  player?: Partial<PlayerState>;
  /** Ajustes finais na run (status, baú do chefe, vitórias). */
  run?: Partial<RRun>;
}

/** Jogador do Roleta da origem e nível pedidos. */
export function roletaPlayer(f: RoletaFixture = {}): PlayerState {
  const data = rdata.base;
  const difficulty = f.difficulty ?? data.balance.difficulty.default;
  const origin = labOrigin({ lineageId: f.lineage ?? 'common', elements: f.elements ?? ['fire'], jinchuuriki: f.jinchuuriki ?? false, difficulty, level: 1, techniques: [], bag: {} }, data);
  let p = createRoletaPlayer(origin, rdata, difficulty);
  while (p.level < (f.level ?? 1)) p = levelUp({ ...p, xp: xpToNextLevel(p.level, data) }, data).player;
  for (const id of f.relics ?? []) p = gainRoletaRelic(p, id, rdata);
  return { ...p, ...f.player };
}

/** Monta a run, coloca na sessão e devolve. O vilão do passo sai de uma seed própria (não gasta o RNG do cenário). */
export function roletaCamp(f: RoletaFixture = {}): Campaign {
  const player = roletaPlayer(f);
  const difficulty = f.difficulty ?? rdata.base.balance.difficulty.default;
  const step = f.step ?? 0;
  let run: RRun = { ...newRoletaRun(player, difficulty), cycle: f.cycle ?? 0, wins: step + (f.cycle ?? 0) * rdata.cycle.length };
  // Passos já vencidos: os vilões de cada um (a trilha mostra o rosto), sem repetir.
  for (let i = 0; i < step; i++) {
    const drawn = drawVillain({ ...run, step: i }, rdata, createRng(9001 + i));
    run = { ...run, used: [...run.used, drawn.villainId!] };
  }
  run = { ...drawVillain({ ...run, step }, rdata, createRng(9001 + step)), ...f.run };
  // Ciclo vencido: o chefe já entrou nos vencidos, como no jogo (`winRoletaFight`); senão a trilha o mostrava anônimo.
  if (run.status === 'victory' && run.villainId) run = { ...run, used: [...run.used, run.villainId], villainId: null };
  const camp: Campaign = {
    runId: 'lab',
    origin: player.origin,
    player: run.player,
    difficulty,
    run,
    mods: { ...NO_MODS },
    seed: ses.seed,
    trail: [],
    log: {},
    stats: emptyRunStats(),
  };
  ses.camp = camp;
  ses.campLive = true;
  return camp;
}
