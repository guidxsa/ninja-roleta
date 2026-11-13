import { heroMovable, MOVESET_SIZE, silentNatures, STORY_ARCS, storyStages, syncGrantedTalents, type JRun } from '../core/jornada/run';
import { jornadaData } from '../data/jornada';
import { RELIC_RENAMES } from '../data/jornada/relics';
import { jTechniquesById } from '../data/jornada/techniques';
import type { KeyValueStorage } from './runHistory';

// Run da Jornada salva no aparelho a cada parada (docs/jornada/run.md#salvamento). É a exceção ao
// "F5 reseta": uma Jornada dura mais que uma sessão. Uma luta em andamento não é salva: volta para o
// começo da parada.

export const JORNADA_SAVE_KEY = 'jornada_run_v1';
const STARTER_RELIC = 'irukaHeadband';
const STARTER_EVOLVED = 'firstHokageNecklace';
/** História: em que parada de cada estágio ficava o mercador, antes de a loja ficar sempre aberta (v0.50.0). */
const OLD_SHOP_STOPS = [6, 6, 3];
/** História: as paradas do antigo 3º estágio ("Busca e resgate"), que virou os arcos Sannin e Vale do Fim (v0.58.0). */
const OLD_RETRIEVAL_STOPS = ['rasenganTraining', 'tanzaku', 'kabuto', 'hospital', 'sasukeLeft', 'soundAmbush', 'jirobo', 'treasure3', 'kidomaruTayuya', 'sakon', 'kimimaro', 'rest3', 'valley'];

/**
 * História canônica (v0.67.0): o que custava cada nó que virou "dado pela história" ou saiu, para devolver os pontos.
 * O Contrato com os sapos mudou de lugar e de efeito, então também volta para ser escolhido de novo.
 */
const OLD_TREE_COSTS: Record<string, { cost: number; rankCost?: number }> = {
  tRasengan: { cost: 1 },
  tKyuubiRegen: { cost: 1 },
  tToadContract: { cost: 1 },
  tGamabunta: { cost: 3, rankCost: 2 },
  tOdama: { cost: 3 },
};
/** Técnicas que viraram variantes do Kuchiyose ou saíram (a Ōdama fica guardada para o Shippuden). */
const OLD_TREE_TECHNIQUES = ['jGamakichi', 'jGamatatsu', 'jGamabunta', 'jOdama'];
/** Índice da parada nova do Exame (Orochimaru na Floresta da Morte), para deslocar quem estava depois dela. */
const OROCHIMARU_STOP = 2;

/**
 * Save de antes da História canônica (v0.67.0): desloca o Exame pela parada nova, dá a marca da Kyuubi a quem já passou
 * do Haku, devolve os pontos dos nós que mudaram e carimba os nós dados pela história.
 */
export function withCanonStory(run: JRun): JRun {
  if (run.canonTree === 1) return run;
  const next: JRun = { ...run, canonTree: 1, talents: [...run.talents], talentRanks: { ...run.talentRanks }, flags: [...run.flags] };
  if (next.mode === 'canon') {
    if (next.stageIndex === 1 && next.stopIndex >= OROCHIMARU_STOP) next.stopIndex++;
    if (next.hero === 'naruto' && next.stageIndex >= 1 && !next.flags.includes('kyuubiAwakened')) next.flags.push('kyuubiAwakened');
  }
  for (const [id, old] of Object.entries(OLD_TREE_COSTS)) {
    if (!next.talents.includes(id)) continue;
    const rank = next.talentRanks[id] ?? 1;
    next.talentPoints += old.cost + (old.rankCost ? old.rankCost * (rank - 1) : 0);
    next.talents = next.talents.filter((t) => t !== id);
    // O Rasengan guarda os níveis comprados: o nó volta carimbado com eles.
    if (id !== 'tRasengan') delete next.talentRanks[id];
  }
  next.learned = next.learned.filter((id) => !OLD_TREE_TECHNIQUES.includes(id));
  next.moveset = next.moveset.filter((id) => !OLD_TREE_TECHNIQUES.includes(id));
  syncGrantedTalents(next, jornadaData);
  if (!next.moveset.length) next.moveset = heroMovable(next, jornadaData).slice(0, MOVESET_SIZE);
  return next;
}

/** Troca os ids de relíquia que mudaram (v0.43.0: iniciais novas e o Talismã da Vontade do Fogo). */
export const renameRelicIds = (ids: readonly string[]) => [...new Set(ids.map((id) => RELIC_RENAMES[id] ?? id))];

export function loadJornada(storage: KeyValueStorage): JRun | null {
  try {
    const raw = storage.getItem(JORNADA_SAVE_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as JRun;
    if (run?.version !== 1 || run.status !== 'inProgress' || typeof run.stageIndex !== 'number') return null;
    run.relics = renameRelicIds(run.relics ?? []);
    // Runs da História salvas antes da v0.35.1 não tinham a relíquia inicial (ou a sua evolução).
    const hasStarter = (run.mode ?? 'canon') !== 'canon' || run.relics.includes(STARTER_RELIC) || run.relics.includes(STARTER_EVOLVED);
    const relics = hasStarter ? run.relics : [STARTER_RELIC, ...run.relics];
    // Runs de antes do Caminho Ninja (v0.36.0) são da História.
    const legacy = {
      mode: 'canon' as const,
      hero: 'naruto',
      classId: 'naruto',
      elements: {},
      secondElement: null,
      elementPick: 'fixed' as const,
      skin: null,
      supports: [],
      names: {},
      map: null,
      nodeId: null,
      path: [],
      bossPlan: [],
    };
    // Técnicas que saíram do jogo (o Quinto portão virou os Portões em níveis na v0.42.0) somem da run.
    const known = (ids: string[]) => ids.filter((id) => id in jTechniquesById);
    // Antes do modo infinito (v0.44.0) não havia ciclo nem o retrato das conquistas da árvore.
    const cycle = typeof run.cycle === 'number' ? run.cycle : 0;
    const unlocks = Array.isArray(run.unlocks) ? run.unlocks : [];
    const loaded: JRun = { ...legacy, ...run, cycle, unlocks, learned: known(run.learned ?? []), moveset: known(run.moveset ?? []), cleared: run.cleared ?? [], relics, talentRanks: run.talentRanks ?? {} };
    return withCanonStory(withSilentNatures(inFourArcs(withoutShopStops(loaded, run.shopPurchases === undefined))));
  } catch {
    return null;
  }
}

/**
 * A loja deixou de ser parada (v0.50.0). Na História, o índice perde o mercador que saiu (quem estava nele segue para a
 * parada seguinte, que passa a ter esse índice). No mapa, quem estava num nó de mercador o dá por feito, e os que faltam
 * viram luta.
 */
function withoutShopStops(run: JRun, old: boolean): JRun {
  const next: JRun = { ...run, shop: run.shop ?? null, shopPurchases: run.shopPurchases ?? 0 };
  if (!old) return next;
  if (next.mode !== 'generic') {
    const at = OLD_SHOP_STOPS[next.stageIndex] ?? Infinity;
    return next.stopIndex > at ? { ...next, stopIndex: next.stopIndex - 1 } : next;
  }
  if (!next.map) return next;
  const isShop = (kind: string) => kind === 'shop';
  const current = next.map.nodes.find((n) => n.id === next.nodeId);
  const left = current && isShop(current.kind);
  return {
    ...next,
    map: { ...next.map, nodes: next.map.nodes.map((n) => (isShop(n.kind) ? { ...n, kind: 'fight' as const } : n)) },
    ...(left ? { nodeId: null, path: [...next.path, current.id], stopIndex: next.stopIndex + 1 } : {}),
  };
}

/**
 * O 3º estágio da História virou dois arcos (v0.58.0). Quem estava nele vai para a mesma parada, achada pelo id, no Sannin
 * ou no Vale do Fim.
 */
function inFourArcs(run: JRun): JRun {
  if (run.mode === 'generic' || run.storyArcs === STORY_ARCS) return { ...run, storyArcs: run.mode === 'generic' ? run.storyArcs : STORY_ARCS };
  const next: JRun = { ...run, storyArcs: STORY_ARCS };
  if (run.stageIndex < 2) return next;
  const id = OLD_RETRIEVAL_STOPS[Math.min(run.stopIndex, OLD_RETRIEVAL_STOPS.length - 1)]!;
  const stages = storyStages(run, jornadaData);
  for (let stageIndex = 2; stageIndex < stages.length; stageIndex++) {
    const stopIndex = stages[stageIndex]!.stops.findIndex((s) => s.id === id);
    if (stopIndex >= 0) return { ...next, stageIndex, stopIndex };
  }
  return next;
}

/**
 * Fichas sem ninjutsu elemental (Hyuuga, Prodígio) têm natureza silenciosa (v0.59.0): conta na vantagem, mas não dá
 * técnica. Saves de antes não a tinham, e até a v0.59.1 o carregamento a zerava: quem está sem recebe a da seed, a mesma
 * de uma run nova. O moveset perde a técnica elemental que essas fichas não usam (saves de antes da v0.43.0).
 */
function withSilentNatures(run: JRun): JRun {
  const restored = silentNatures(run, jornadaData);
  const missing = Object.keys(restored).filter((id) => !run.elements[id]);
  const next = missing.length ? { ...run, elements: { ...run.elements, ...Object.fromEntries(missing.map((id) => [id, restored[id]!])) } } : run;
  const movable = heroMovable(next, jornadaData);
  const moveset = next.moveset.filter((id) => movable.includes(id));
  if (moveset.length === next.moveset.length) return next;
  return { ...next, moveset: moveset.length ? moveset : movable.slice(0, MOVESET_SIZE) };
}

/** Grava a run. `false`: o aparelho não guardou (cheio ou bloqueado) e a run segue só na memória: a interface avisa. */
export function saveJornada(storage: KeyValueStorage, run: JRun): boolean {
  try {
    if (run.status === 'inProgress') storage.setItem(JORNADA_SAVE_KEY, JSON.stringify(run));
    else clearJornada(storage);
    return true;
  } catch {
    return false;
  }
}

export function clearJornada(storage: KeyValueStorage): void {
  try {
    storage.setItem(JORNADA_SAVE_KEY, '');
  } catch {
    /* conveniência */
  }
}
