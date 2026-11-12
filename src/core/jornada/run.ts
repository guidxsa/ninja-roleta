// Estado da run da Jornada (docs/jornada/run.md): trilha ou mapa, equipe, ryō, relíquias, talentos, XP e
// bolsa. Funções puras; a interface salva o estado no aparelho a cada parada (state/jornadaSave.ts).
// Dois modos: História (trilha linear do Naruto) e Caminho Ninja (mapa ramificado, classe, elemento sorteado).
import type { Difficulty } from '../difficulty';
import { createRng, type Rng } from '../rng';
import type { Element } from '../types';
import { allyResults, emptyMods, enemySeed, mergeMods, type BattleSetup, type FighterSeed } from './battle';
import type { JornadaData } from './data';
import { eventOptions, SHOP_CURSE, type EventEffect } from './events';
import { generateMap, mapNode, nextNodes, type StageMap } from './map';
import { bossChoices, dropRelic, rollRelic, rollRelics, type RelicDef } from './relics';
import { canBuyTalent, talentRankCost, treeComplete, type TalentContext } from './talents';
import { isFight, teamFor, type FightKind, type StopDef } from './trail';
import type { ConsumableId, FighterMods, JBattle } from './types';

/** Protagonista da História. */
export const HERO = 'naruto';
export const MOVESET_SIZE = 4;
export const CONSUMABLES: ConsumableId[] = ['hpKit', 'chakraKit', 'reviveKit'];

export interface MemberState {
  hp: number;
  chakra: number;
}

export interface JRun {
  version: 1;
  /** História (trilha linear do Naruto) ou Caminho Ninja (mapa ramificado com classe). */
  mode: 'canon' | 'generic';
  /** Personagem protagonista (naruto, commonNinja, prodigy...). */
  hero: string;
  /** Classe escolhida (História: 'naruto'). */
  classId: string;
  /** Elemento sorteado por personagem (Caminho Ninja: protagonista e suportes). */
  elements: Record<string, Element | null>;
  /** Caminho Ninja: segundo elemento do protagonista (Uchiha). */
  secondElement: Element | null;
  /**
   * Como saiu o elemento do protagonista: escolhido na tela de início (Comum), sorteado (Comum que preferiu sortear:
   * ganha uma relíquia comum) ou fixo pela classe (História, Uchiha, Hyuuga).
   */
  elementPick: ElementPick;
  /** Visual do protagonista (personalização liberada por easter egg, ex.: "sasuke"). */
  skin: string | null;
  /** Caminho Ninja: suportes das lutas comuns. */
  supports: string[];
  /** Caminho Ninja: nome sorteado de cada suporte (id da ficha → chave do nome em strings/jornada.ts). */
  names: Record<string, string>;
  /** Caminho Ninja: mapa do estágio atual. */
  map: StageMap | null;
  /** Caminho Ninja: nó em que está (null = escolhendo o próximo). */
  nodeId: string | null;
  /** Caminho Ninja: nós já feitos no estágio. */
  path: string[];
  /** Caminho Ninja: chefe sorteado de cada estágio (índice em `bosses`). */
  bossPlan: number[];
  seed: number;
  difficulty: Difficulty;
  /** História: campanha (perspectiva) da run; ausente = a do Naruto. */
  campaign?: string;
  /** História: 4 = trilha em quatro arcos (v0.58.0). Ausente = save de quando Sannin e Vale do Fim eram um estágio só. */
  storyArcs?: number;
  stageIndex: number;
  /** História: parada da trilha. Caminho Ninja: quantos nós já fez no estágio. */
  stopIndex: number;
  ryo: number;
  xp: number;
  level: number;
  talentPoints: number;
  talents: string[];
  /** Nível dos talentos que sobem (sem entrada: nível 1). */
  talentRanks: Record<string, number>;
  /** Técnicas do protagonista além do kit inicial (talentos). */
  learned: string[];
  /** As 4 técnicas equipadas (sem as ativas de classe). */
  moveset: string[];
  relics: string[];
  bag: Record<ConsumableId, number>;
  willOfFire: number;
  /** HP e chakra atuais de quem já lutou (quem nunca lutou entra cheio). */
  members: Record<string, MemberState>;
  /** Status a mais por personagem (eventos). */
  bonus: Record<string, { hp: number; chakra: number }>;
  flags: string[];
  status: 'inProgress' | 'victory' | 'defeat';
  /**
   * Modo infinito do Caminho Ninja (docs/jornada/run.md#modo-infinito): ciclo atual, contando do 0 (a tela mostra
   * "Ciclo N" com N = cycle + 1). A cada ciclo os inimigos ficam mais fortes.
   */
  cycle: number;
  /**
   * Conquistas da conta que liberam nós da árvore (retrato renovado pela interface quando sai conquista e ao seguir de
   * ciclo). O core usa para saber se a árvore está completa sem receber o perfil.
   */
  unlocks: string[];
  /** Escolha de lendária pendente (depois de um chefe). */
  bossChoice: string[] | null;
  /** `talentRyo`: ryō que veio de pontos de talento convertidos (árvore completa), na run toda. */
  stats: { fights: number; wins: number; alliesLost: number; bestHit: number; talentRyo?: number };
  /** Lutas vencidas (ids das paradas), para as conquistas. */
  cleared: string[];
  /** Prateleira de relíquias da loja no estágio atual: salva, para fechar e abrir não trocar o estoque. */
  shop: ShopStock | null;
  /** Compras na loja na run toda (estatística; desde a v0.62.0 só encarecem com a maldição). */
  shopPurchases: number;
  /** Compras desde a maldição do mercador (zera quando ela sai). Sem o campo: 0. */
  cursedPurchases?: number;
}

export interface ShopStock {
  /** Ciclo e estágio do estoque. */
  key: string;
  relics: string[];
  /** Vezes que a prateleira foi atualizada neste estágio. Sem o campo: 0. */
  refreshes?: number;
}

export type ElementPick = 'chosen' | 'random' | 'fixed';

const clone = (run: JRun): JRun => structuredClone(run);

function baseRun(seed: number, difficulty: Difficulty, hero: string, data: JornadaData): JRun {
  const bag = { hpKit: 0, chakraKit: 0, reviveKit: 0 } as Record<ConsumableId, number>;
  for (const [k, n] of Object.entries(data.j.run.startConsumables)) bag[k as ConsumableId] = n;
  return {
    version: 1,
    mode: 'canon',
    hero,
    classId: hero,
    elements: {},
    secondElement: null,
    elementPick: 'fixed',
    skin: null,
    supports: [],
    names: {},
    map: null,
    nodeId: null,
    path: [],
    bossPlan: [],
    seed,
    difficulty,
    campaign: 'naruto',
    storyArcs: STORY_ARCS,
    stageIndex: 0,
    stopIndex: 0,
    ryo: 0,
    xp: 0,
    level: 1,
    talentPoints: 0,
    talents: [],
    talentRanks: {},
    learned: [],
    moveset: data.characters[hero]!.techniques.filter((id) => !data.techniques[id]?.active).slice(0, MOVESET_SIZE),
    relics: data.relics.filter((r) => r.starterFor?.includes(hero)).map((r) => r.id),
    bag,
    willOfFire: data.j.run.willOfFire[difficulty] ?? 0,
    members: {},
    bonus: {},
    flags: [],
    status: 'inProgress',
    cycle: 0,
    unlocks: [],
    bossChoice: null,
    stats: { fights: 0, wins: 0, alliesLost: 0, bestHit: 0 },
    cleared: [],
    shop: null,
    shopPurchases: 0,
  };
}

/** História do Naruto (docs/jornada/historia.md). `unlocked`: conquistas do perfil (nós da conta na árvore). */
export function newRun(seed: number, difficulty: Difficulty, data: JornadaData, unlocked: ReadonlySet<string> = new Set()): JRun {
  const run = baseRun(seed, difficulty, HERO, data);
  run.unlocks = talentUnlocks(unlocked, data);
  return run;
}

const ELEMENTS: Element[] = ['fire', 'wind', 'lightning', 'earth', 'water'];

/** Sorteio do elemento: cada elemento com o mesmo peso, mais "nenhum" quando permitido. */
export function drawElement(rng: Rng, data: JornadaData, allowNone: boolean): Element | null {
  const w = data.j.elementDraw;
  const total = w.element * ELEMENTS.length + (allowNone ? w.none : 0);
  const i = Math.floor((rng() * total) / w.element);
  return i < ELEMENTS.length ? ELEMENTS[i]! : null;
}

/** Escolha do elemento na tela de início: um elemento, `null` (sem elemento: prodígio) ou sortear. */
export type ElementChoice = Element | null | 'random';

/**
 * Run do Caminho Ninja (docs/jornada/caminho-ninja.md). O Comum escolhe o elemento ou sorteia (sorteando, sem
 * elemento vira prodígio e ganha uma relíquia comum); o Uchiha tem fogo fixo e sorteia o segundo; o Hyuuga não tem
 * elemento. Depois: os 2 suportes (classe entre as liberadas, ficha e nome), o chefe de cada estágio e o mapa.
 * `unlocked`: conquistas do perfil (liberam classes para os suportes). `skin`: visual escolhido (só quando liberado).
 */
export function newGenericRun(
  seed: number,
  difficulty: Difficulty,
  classId: string,
  data: JornadaData,
  unlocked: ReadonlySet<string> = new Set(),
  skin: string | null = null,
  choice: ElementChoice = 'random',
): JRun {
  const cls = data.generic.classes.find((c) => c.id === classId);
  if (!cls) throw new Error(`classe desconhecida: ${classId}`);
  const rng = createRng(seed ^ 0x5bd1e995);
  // Natureza silenciosa (sem ninjutsu elemental: Hyuuga, Prodígio, suportes assim): sorteio à parte, para não mudar o
  // mapa e os suportes da seed (v0.59.0).
  const natureRng = createRng(seed ^ 0x9e3779b9);
  // O sorteio sempre acontece (mesmo com escolha ou sem elemento): a seed dá o mesmo mapa e os mesmos suportes.
  const drawn = cls.fixedElement ?? drawElement(rng, data, Boolean(cls.noElementHero));
  const canChoose = !cls.fixedElement && !cls.noElement;
  const choiceEl = cls.noElement ? null : canChoose && choice !== 'random' ? choice : drawn;
  const hero = choiceEl === null && cls.noElementHero ? cls.noElementHero : cls.hero;
  // Todo ninja tem natureza: quem não tem ninjutsu elemental a recebe em silêncio (só na ficha e na vantagem).
  const element = choiceEl ?? drawElement(natureRng, data, false);
  let run = baseRun(seed, difficulty, hero, data);
  run.mode = 'generic';
  run.classId = classId;
  run.elementPick = !canChoose ? 'fixed' : choice === 'random' ? 'random' : 'chosen';
  if (cls.secondElement) {
    let second = drawElement(rng, data, true);
    while (second === element) second = drawElement(rng, data, true);
    run.secondElement = second;
  }
  run.skin = skin;
  run.unlocks = talentUnlocks(unlocked, data);
  run.elements = { [hero]: element };
  drawSupports(run, rng, data, unlocked, natureRng);
  run.bossPlan = data.generic.stages.map((s) => Math.floor(rng() * s.bosses.length));
  run.map = generateMap(rng, data);
  // O nível I do elemento entra no moveset.
  run.moveset = heroMovable(run, data).slice(0, MOVESET_SIZE);
  if (run.elementPick === 'random') {
    const bonus = rollRelic(data.relics, run.relics, data.j.elementDraw.randomBonus, rng);
    if (bonus) run = gainRelic(run, bonus, data);
  }
  return run;
}

/**
 * Os 2 suportes: cada um sorteia a classe entre as liberadas (a do protagonista também), depois uma ficha ainda não
 * usada dela (ids únicos) e um nome que o outro não tem. O elemento vem da ficha ou do sorteio (nunca "nenhum"), e
 * ficha sem elemento de propósito (Hyuuga) fica sem.
 */
function drawSupports(run: JRun, rng: Rng, data: JornadaData, unlocked: ReadonlySet<string>, natureRng: Rng = rng): void {
  const open = data.generic.classes.filter((c) => !c.unlock || unlocked.has(c.unlock));
  const taken = new Set<string>();
  run.supports = [];
  run.names = {};
  while (run.supports.length < 2) {
    const avail = open.filter((c) => c.supports.some((id) => !run.supports.includes(id)));
    if (!avail.length) break;
    const c = pickFrom(avail, rng);
    const id = pickFrom(
      c.supports.filter((x) => !run.supports.includes(x)),
      rng,
    );
    run.supports.push(id);
    const names = c.supportNames.filter((n) => !taken.has(n));
    if (names.length) {
      const name = pickFrom(names, rng);
      taken.add(name);
      run.names[id] = name;
    }
    const def = data.characters[id]!;
    // Sem ninjutsu elemental (Hyuuga): natureza silenciosa, do sorteio à parte.
    run.elements[id] = def.element ?? (def.noElement ? drawElement(natureRng, data, false) : drawElement(rng, data, false));
  }
}

/**
 * Naturezas silenciosas de uma run do Caminho Ninja, refeitas da seed: o mesmo sorteio à parte de `newGenericRun`, na
 * mesma ordem (o protagonista sem ninjutsu elemental, depois os suportes assim). Serve para recuperar saves que as
 * perderam (até a v0.59.1 o carregamento zerava o elemento de quem tem `noElement`).
 */
export function silentNatures(run: Pick<JRun, 'mode' | 'seed' | 'hero' | 'supports'>, data: JornadaData): Record<string, Element> {
  if (run.mode !== 'generic') return {};
  const natureRng = createRng(run.seed ^ 0x9e3779b9);
  const out: Record<string, Element> = {};
  const draw = (id: string) => {
    const el = drawElement(natureRng, data, false);
    if (el) out[id] = el;
  };
  if (data.characters[run.hero]?.noElement) draw(run.hero);
  for (const id of run.supports) {
    const def = data.characters[id];
    if (def && !def.element && def.noElement) draw(id);
  }
  return out;
}

/** Classe de uma ficha de suporte do Caminho Ninja (para o nome e a Ficha). */
export const supportClass = (id: string, data: JornadaData) => data.generic.classes.find((c) => c.supports.includes(id)) ?? null;

function mix(a: number): Rng {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rng de uma parada: derivada da seed da run (repetir a parada repete os sorteios). O ciclo 0 dá os mesmos valores de antes. */
export function stopRng(run: JRun, salt = 0): Rng {
  const at = (run.cycle ?? 0) * 1000 + run.stageIndex * 100 + run.stopIndex + 1;
  return mix((run.seed ^ Math.imul(at, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0);
}

/** Força dos inimigos no ciclo atual (multiplica por cima da dificuldade): multiplicador ^ ciclo. */
export const cycleEnemyMult = (run: JRun, data: JornadaData) => data.j.infinite.enemyCycleMult ** (run.cycle ?? 0);

/** Força dos inimigos da run por cima da dificuldade: o ciclo do infinito e, na História, `storyStrength` (v0.65.0). */
export const runEnemyMult = (run: JRun, data: JornadaData) => cycleEnemyMult(run, data) * (run.mode === 'canon' ? data.j.storyStrength : 1);

// ---------------------------------------------------------------------------
// Estágio e parada

/** Versão da trilha da História: Ondas, Exame, Sannin e Vale do Fim (v0.58.0). */
export const STORY_ARCS = 4;

/** Estágio da História (no Caminho Ninja, `genericStage`). */
export const storyStages = (run: Pick<JRun, 'campaign'>, data: JornadaData) => data.campaigns[run.campaign ?? 'naruto']?.stages ?? data.stages;
export const currentStage = (run: JRun, data: JornadaData) => storyStages(run, data)[run.stageIndex]!;
export const genericStage = (run: JRun, data: JornadaData) => data.generic.stages[run.stageIndex]!;
export const stageCount = (run: JRun, data: JornadaData) => (run.mode === 'generic' ? data.generic.stages.length : storyStages(run, data).length);
export const stageId = (run: JRun, data: JornadaData) => (run.mode === 'generic' ? genericStage(run, data).id : currentStage(run, data).id);
export const stageScene = (run: JRun, data: JornadaData) => (run.mode === 'generic' ? genericStage(run, data).scene : currentStage(run, data).scene);
/** Suportes das lutas comuns do estágio. */
export const stageTeam = (run: JRun, data: JornadaData): string[] => (run.mode === 'generic' ? run.supports : currentStage(run, data).team);

export function currentStop(run: JRun, data: JornadaData): StopDef | null {
  if (run.mode === 'generic') return run.nodeId ? stopFromNode(run, data) : null;
  return currentStage(run, data).stops[run.stopIndex] ?? null;
}

/**
 * Quanto da run já foi feito, de 0 a 1 (card de progresso). História: paradas feitas sobre todas as paradas.
 * Caminho Ninja: estágios vencidos mais a fração de linhas andadas no mapa do estágio atual.
 */
export function journeyProgress(run: JRun, data: JornadaData): number {
  if (run.mode === 'generic') {
    const rows = run.map?.rows ?? 1;
    return Math.min(1, (run.stageIndex + Math.min(run.path.length, rows) / rows) / stageCount(run, data));
  }
  const stages = storyStages(run, data);
  const total = stages.reduce((n, s) => n + s.stops.length, 0);
  const done = stages.slice(0, run.stageIndex).reduce((n, s) => n + s.stops.length, 0) + run.stopIndex;
  return Math.min(1, done / total);
}

/** Cenário da parada atual: o local dela ou, sem local próprio, o do estágio. */
export const stopScene = (run: JRun, data: JornadaData): string => currentStop(run, data)?.scene ?? stageScene(run, data);

/** No Caminho Ninja: a run espera o jogador escolher o próximo nó do mapa. */
export const choosingNode = (run: JRun) => run.mode === 'generic' && run.status === 'inProgress' && !run.nodeId && !run.bossChoice;

/** Nós que dá para escolher agora. */
export const nodeChoices = (run: JRun) => (run.map ? nextNodes(run.map, run.path.at(-1) ?? null) : []);

export function chooseNode(prev: JRun, nodeId: string): JRun {
  if (!choosingNode(prev) || !nodeChoices(prev).some((n) => n.id === nodeId)) throw new Error('nó fora do alcance');
  return { ...clone(prev), nodeId };
}

function pickFrom<T>(list: readonly T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length)]!;
}

/** Parada do nó atual do Caminho Ninja. O desconhecido vira evento, luta ou tesouro. */
function stopFromNode(run: JRun, data: JornadaData): StopDef {
  const node = mapNode(run.map!, run.nodeId!);
  const stage = genericStage(run, data);
  const rng = stopRng(run, 21);
  let kind: string = node.kind;
  if (kind === 'unknown') {
    const entries = Object.entries(data.j.map.unknown);
    let x = rng() * entries.reduce((a, [, v]) => a + v, 0);
    kind = entries.find(([, v]) => (x -= v) < 0)?.[0] ?? 'event';
  }
  const id = node.id;
  if (kind === 'fight') return { kind: 'fight', id, enemies: pickFrom(node.row < data.j.map.easyRows ? stage.easyFights : stage.fights, rng) };
  if (kind === 'elite') return { kind: 'elite', id, enemies: pickFrom(stage.elites, rng) };
  if (kind === 'boss') return { kind: 'boss', id, enemies: stage.bosses[run.bossPlan[run.stageIndex] ?? 0]! };
  if (kind === 'event') {
    const fresh = stage.events.filter((e) => !run.flags.includes(`ev:${e}`));
    return { kind: 'event', id, event: pickFrom(fresh.length ? fresh : stage.events, rng) };
  }
  return { kind: kind as 'rest' | 'treasure', id };
}

const relicDefs = (run: JRun, data: JornadaData): RelicDef[] => run.relics.map((id) => data.relics.find((r) => r.id === id)!).filter(Boolean);

// ---------------------------------------------------------------------------
// Ficha dos personagens

export interface MemberSheet {
  maxHp: number;
  maxChakra: number;
  speed: number;
  offense: FighterSeed['offense'];
  resistance: FighterSeed['resistance'];
}

/** Status de um personagem no nível da run, com bônus de eventos e relíquias. */
export function memberSheet(run: JRun, id: string, data: JornadaData): MemberSheet {
  const def = data.characters[id]!;
  const n = run.level - 1;
  const gr = def.growth;
  const up = (base: number, per: number) => Math.floor(base + per * n);
  const bonus = run.bonus[id] ?? { hp: 0, chakra: 0 };
  const relics = relicDefs(run, data);
  const isHero = id === run.hero;
  const heroStat = (k: 'hp' | 'chakra' | 'speed') => (isHero ? relics.reduce((a, r) => a + (r.stats?.[k] ?? 0), 0) : 0);
  const allyHpPct = isHero ? 0 : relics.reduce((a, r) => a + (r.allyHpPct ?? 0), 0) + ownedTalents(run, data).reduce((a, t) => a + (t.allyHpPct ?? 0), 0);
  return {
    maxHp: Math.floor((up(def.hp, gr.hp) + bonus.hp + heroStat('hp')) * (1 + allyHpPct)),
    maxChakra: up(def.chakra, gr.chakra) + bonus.chakra + heroStat('chakra'),
    speed: up(def.speed, gr.speed) + heroStat('speed'),
    offense: {
      taijutsu: up(def.offense.taijutsu, gr.offense.taijutsu),
      ninjutsu: up(def.offense.ninjutsu, gr.offense.ninjutsu),
      genjutsu: up(def.offense.genjutsu, gr.offense.genjutsu),
    },
    resistance: { physical: up(def.resistance.physical, gr.resistance.physical), mental: up(def.resistance.mental, gr.resistance.mental) },
  };
}

export function memberState(run: JRun, id: string, data: JornadaData): MemberState {
  const sheet = memberSheet(run, id, data);
  const m = run.members[id];
  return m ? { hp: Math.min(m.hp, sheet.maxHp), chakra: Math.min(m.chakra, sheet.maxChakra) } : { hp: sheet.maxHp, chakra: sheet.maxChakra };
}

/** Elemento de um personagem nesta run (o sorteado, ou o da ficha). */
export const elementOf = (run: JRun, id: string, data: JornadaData): Element | null =>
  id in run.elements ? (run.elements[id] ?? null) : (data.characters[id]?.element ?? null);

/** Técnica de nível I do elemento sorteado (Caminho Ninja). */
function elementBasic(run: JRun, id: string, data: JornadaData): string[] {
  // Natureza silenciosa (sem ninjutsu elemental) não dá técnica.
  if (data.characters[id]?.noElement) return [];
  const el = run.elements[id];
  return el ? [data.elementLines[el][0]] : [];
}

/** Técnicas que o protagonista conhece (kit inicial + elemento + segundo elemento + talentos). */
export function heroKnown(run: JRun, data: JornadaData): string[] {
  const second = run.secondElement ? [data.elementLines[run.secondElement][0]] : [];
  const def = data.characters[run.hero]!;
  const known = [...new Set([...def.techniques, ...elementBasic(run, run.hero, data), ...second, ...(def.spareTechniques ?? []), ...run.learned])];
  // A forma evoluída toma o lugar da anterior (3 tomoe no lugar do Sharingan).
  const replaced = new Set(known.map((id) => data.techniques[id]?.evolves));
  return known.filter((id) => !replaced.has(id));
}

/** Ativas de classe do protagonista (área separada do moveset). */
export const heroActives = (run: JRun, data: JornadaData) => heroKnown(run, data).filter((id) => data.techniques[id]?.active);
/** Técnicas que podem entrar no moveset. */
export const heroMovable = (run: JRun, data: JornadaData) => heroKnown(run, data).filter((id) => !data.techniques[id]?.active);

/** Técnicas de um aliado até o estágio atual. */
export function allyTechniques(run: JRun, id: string, data: JornadaData): string[] {
  const extra = Object.entries(data.stageTechniques[id] ?? {})
    .filter(([stage]) => Number(stage) <= run.stageIndex)
    .flatMap(([, list]) => list);
  return [...data.characters[id]!.techniques, ...elementBasic(run, id, data), ...extra];
}

const ownedTalents = (run: JRun, data: JornadaData) => run.talents.map((id) => data.talents.find((t) => t.id === id)).filter((t) => t !== undefined);

/** Bônus de talentos e relíquias no protagonista e na equipe. */
export function heroMods(run: JRun, data: JornadaData): FighterMods {
  let mods = emptyMods();
  for (const node of ownedTalents(run, data)) {
    if (node.mods) mods = mergeMods(mods, node.mods);
    if (node.teamMods) mods = mergeMods(mods, node.teamMods);
    if (node.rankMods) for (let r = 1; r < (run.talentRanks?.[node.id] ?? 1); r++) mods = mergeMods(mods, node.rankMods);
  }
  for (const r of relicDefs(run, data)) {
    if (r.mods) mods = mergeMods(mods, r.mods);
    if (r.teamMods) mods = mergeMods(mods, r.teamMods);
  }
  return mods;
}

export function teamMods(run: JRun, data: JornadaData): FighterMods {
  let mods = emptyMods();
  for (const node of ownedTalents(run, data)) if (node.teamMods) mods = mergeMods(mods, node.teamMods);
  for (const r of relicDefs(run, data)) if (r.teamMods) mods = mergeMods(mods, r.teamMods);
  return mods;
}

function memberSeed(run: JRun, id: string, data: JornadaData): FighterSeed {
  const def = data.characters[id]!;
  const sheet = memberSheet(run, id, data);
  const st = memberState(run, id, data);
  const hero = id === run.hero;
  return {
    defId: id,
    protagonist: hero,
    maxHp: sheet.maxHp,
    hp: hero ? Math.max(1, st.hp) : st.hp,
    maxChakra: sheet.maxChakra,
    chakra: st.chakra,
    speed: sheet.speed,
    offense: sheet.offense,
    resistance: sheet.resistance,
    element: elementOf(run, id, data),
    ...(def.kekkeiGenkai ? { kekkeiGenkai: def.kekkeiGenkai } : {}),
    techniques: hero ? [...run.moveset, ...heroActives(run, data)] : allyTechniques(run, id, data),
    ai: def.ai,
    mods: hero ? heroMods(run, data) : teamMods(run, data),
  };
}

/** Suportes de uma luta: na História, os da parada ou do estágio; no Caminho Ninja, os da run. */
export function fightTeam(run: JRun, stop: StopDef, data: JornadaData): string[] {
  return run.mode === 'generic' ? run.supports : teamFor(currentStage(run, data), stop);
}

/** Quem vai lutar na próxima luta do estágio (para o HUD): na História muda de parada em parada. */
export function nextFightTeam(run: JRun, data: JornadaData): string[] {
  if (run.mode === 'generic') return run.supports;
  const stage = currentStage(run, data);
  const next = stage.stops.slice(run.stopIndex).find(isFight);
  return next ? fightTeam(run, next, data) : stage.team;
}

/** Monta a luta da parada atual. Suportes caídos entram com o HP que têm (pelo menos 1). */
export function battleSetup(run: JRun, data: JornadaData): BattleSetup {
  const stop = currentStop(run, data);
  if (!stop || !isFight(stop)) throw new Error('a parada atual não é uma luta');
  const allies = [run.hero, ...fightTeam(run, stop, data)].map((id) => {
    const seed = memberSeed(run, id, data);
    return { ...seed, hp: Math.max(1, seed.hp) };
  });
  const opening = relicDefs(run, data).reduce((a, r) => a + (r.openingDamage ?? 0), 0);
  const foes = stop.enemies.map((id) => {
    const seed = enemySeed(id, run.difficulty, data, runEnemyMult(run, data));
    return opening ? { ...seed, hp: Math.max(1, seed.hp - opening) } : seed;
  });
  return { allies, enemies: foes, win: stop.win ?? { kind: 'defeatAll' }, pills: run.bag.reviveKit };
}

// ---------------------------------------------------------------------------
// Progresso

/** XP para passar do nível atual. */
export const xpToNext = (level: number, data: JornadaData) => data.j.xp.base + data.j.xp.perLevel * (level - 1);

/**
 * Sobe de nível com o XP ganho (com os bônus de talentos e relíquias). Devolve o XP de verdade, os níveis e o ryō dos
 * pontos convertidos (árvore completa).
 */
function gainXp(run: JRun, xp: number, data: JornadaData): { gained: number; ups: number; ryo: number } {
  const mult = ownedTalents(run, data).reduce((a, t) => a * (t.xpMult ?? 1), 1) * relicDefs(run, data).reduce((a, r) => a * (r.xpMult ?? 1), 1);
  const gained = Math.floor(xp * mult);
  run.xp += gained;
  let ups = 0;
  let ryo = 0;
  while (run.xp >= xpToNext(run.level, data)) {
    run.xp -= xpToNext(run.level, data);
    run.level++;
    ryo += addTalentPoints(run, data.j.xp.talentPerLevel, data);
    ups++;
  }
  return { gained, ups, ryo };
}

// ---------------------------------------------------------------------------
// Árvore completa (docs/jornada/talentos.md#árvore-completa)

/** Só as conquistas que algum nó da árvore usa (o retrato que a run guarda). */
export function talentUnlocks(unlocked: ReadonlySet<string>, data: JornadaData): string[] {
  const used = new Set(data.talents.map((t) => t.account).filter((a): a is string => Boolean(a)));
  return [...unlocked].filter((id) => used.has(id)).sort();
}

/** Nada mais a aprender ou subir na árvore do protagonista (com as conquistas guardadas na run, ou as dadas). */
export function talentTreeComplete(run: JRun, data: JornadaData, unlocked: ReadonlySet<string> = new Set(run.unlocks ?? [])): boolean {
  return treeComplete(run.hero, data.talents, talentContext(run, unlocked));
}

/** Ganha pontos de talento; com a árvore completa, viram ryō na hora (sem o multiplicador). Devolve o ryō convertido. */
function addTalentPoints(run: JRun, n: number, data: JornadaData): number {
  if (n <= 0) return 0;
  if (!talentTreeComplete(run, data)) {
    run.talentPoints += n;
    return 0;
  }
  return convertTalentPoints(run, n, data);
}

function convertTalentPoints(run: JRun, n: number, data: JornadaData): number {
  const ryo = n * data.j.talentTree.completeRyoPerPoint;
  run.ryo += ryo;
  run.stats = { ...run.stats, talentRyo: (run.stats.talentRyo ?? 0) + ryo };
  return ryo;
}

/** Pontos guardados viram ryō quando a árvore fecha (último nó comprado, save antigo). */
function settleTalentPoints(run: JRun, data: JornadaData): number {
  if (run.talentPoints <= 0 || !talentTreeComplete(run, data)) return 0;
  const n = run.talentPoints;
  run.talentPoints = 0;
  return convertTalentPoints(run, n, data);
}

/**
 * Renova o retrato das conquistas da conta (interface: ao abrir a run e quando sai conquista). Uma conquista nova pode
 * abrir um nó (ex.: o ramo do Sasuke); com a árvore completa, os pontos guardados viram ryō.
 */
export function syncUnlocks(prev: JRun, unlocked: ReadonlySet<string>, data: JornadaData): JRun {
  const unlocks = talentUnlocks(unlocked, data);
  const same = unlocks.length === (prev.unlocks ?? []).length && unlocks.every((id, i) => id === prev.unlocks[i]);
  if (same && (prev.talentPoints <= 0 || !talentTreeComplete(prev, data))) return prev;
  const run = { ...clone(prev), unlocks };
  settleTalentPoints(run, data);
  return run;
}

const ryoGain = (run: JRun, n: number, data: JornadaData) =>
  Math.floor(n * relicDefs(run, data).reduce((a, r) => a * (r.ryoMult ?? 1), 1));

export interface Heal {
  hp: number;
  chakra: number;
}

/** O que cada membro da equipe recupera depois de cada vitória: o valor da dificuldade mais o das relíquias. */
export function afterWinRecovery(run: JRun, data: JornadaData): Heal {
  const base = data.j.run.afterWinRecovery[run.difficulty] ?? { hp: 0, chakra: 0 };
  return relicDefs(run, data).reduce((a, r) => ({ hp: a.hp + (r.afterWin?.hp ?? 0), chakra: a.chakra + (r.afterWin?.chakra ?? 0) }), base);
}

function healAll(run: JRun, heal: Heal, data: JornadaData, ids: string[]): void {
  for (const id of ids) {
    const sheet = memberSheet(run, id, data);
    const st = memberState(run, id, data);
    run.members[id] = { hp: Math.min(sheet.maxHp, st.hp + heal.hp), chakra: Math.min(sheet.maxChakra, st.chakra + heal.chakra) };
  }
}

/** Cura total (chefe vencido, ramen da formatura). */
function healFull(run: JRun, data: JornadaData, ids: string[]): void {
  for (const id of ids) {
    const sheet = memberSheet(run, id, data);
    run.members[id] = { hp: sheet.maxHp, chakra: sheet.maxChakra };
  }
}

export interface FightOutcome {
  won: boolean;
  ryo: number;
  /** Pontos de talento que ficaram (com a árvore completa, 0: viraram `talentRyo`). */
  talent: number;
  /** Ryō dos pontos convertidos nesta luta (recompensa e níveis). */
  talentRyo: number;
  xp: number;
  levelUps: number;
  /** Gastou uma Vontade do Fogo: a luta recomeça. */
  retry: boolean;
  /** Relíquia deixada pela elite vencida. */
  relic: string | null;
}

/** Fecha a luta da parada atual: HP da equipe, recompensas e avanço (ou fim da run). */
export function finishFight(prev: JRun, battle: JBattle, data: JornadaData): { run: JRun; outcome: FightOutcome } {
  let run = clone(prev);
  const stop = currentStop(run, data)!;
  if (!isFight(stop)) throw new Error('a parada atual não é uma luta');
  run.stats.fights++;
  for (const e of battle.log) if (e.type === 'damage' && e.uid.startsWith('a') && e.amount > run.stats.bestHit) run.stats.bestHit = e.amount;
  // Pílulas usadas sozinhas pelo protagonista saem da bolsa aqui; as usadas pelo botão, a tela já descontou.
  const autoPills = battle.log.filter((e) => e.type === 'revive' && e.pill).length;
  run.bag.reviveKit = Math.max(0, run.bag.reviveKit - autoPills);
  const won = battle.status === 'won';
  const results = allyResults(battle);
  if (!won) {
    if (run.willOfFire > 0) {
      run.willOfFire--;
      const pct = data.j.combat.willOfFireHpPct;
      for (const r of results) {
        const sheet = memberSheet(run, r.defId, data);
        run.members[r.defId] = { hp: Math.max(r.hp, Math.floor(sheet.maxHp * pct)), chakra: Math.max(r.chakra, Math.floor(sheet.maxChakra * pct)) };
      }
      return { run, outcome: { won: false, ryo: 0, talent: 0, talentRyo: 0, xp: 0, levelUps: 0, retry: true, relic: null } };
    }
    run.status = 'defeat';
    for (const r of results) run.members[r.defId] = { hp: r.hp, chakra: r.chakra };
    return { run, outcome: { won: false, ryo: 0, talent: 0, talentRyo: 0, xp: 0, levelUps: 0, retry: false, relic: null } };
  }
  run.stats.wins++;
  run.cleared.push(stop.id);
  // A recuperação vem da dificuldade (mais as relíquias que somam) e vale para a equipe do estágio inteira:
  // quem lutou e terminou de pé e quem ficou de fora desta luta.
  const rec = afterWinRecovery(run, data);
  const fought = new Set(results.map((r) => r.defId));
  healAll(run, rec, data, membersSeen(run, data).filter((id) => !fought.has(id)));
  for (const r of results) {
    const sheet = memberSheet(run, r.defId, data);
    if (r.down) {
      run.stats.alliesLost++;
      run.members[r.defId] = { hp: Math.floor(sheet.maxHp * data.j.run.downedAllyReturnPct), chakra: r.chakra };
    } else {
      run.members[r.defId] = {
        hp: Math.min(sheet.maxHp, r.hp + rec.hp),
        chakra: Math.min(sheet.maxChakra, r.chakra + rec.chakra),
      };
    }
  }
  const reward = data.j.rewards[stop.kind as FightKind];
  const ryo = ryoGain(run, reward.ryo, data);
  run.ryo += ryo;
  const rewardRyo = addTalentPoints(run, reward.talent, data);
  const { gained: xpGained, ups: levelUps, ryo: levelRyo } = gainXp(run, reward.xp, data);
  if (stop.kind === 'boss') {
    // Estágio vencido: toda a equipe volta cheia, inclusive quem caiu.
    healFull(run, data, membersSeen(run, data));
    run.bossChoice = bossChoices(data.relics, run.relics, data.j.relics.bossChoices, data.j.relics.starterEvolveChance, stopRng(run, 7));
    if (!run.bossChoice.length) run.bossChoice = null;
  }
  // Elite vencida deixa uma relíquia (o sorteio vem antes de avançar: a seed é a da parada).
  const relic = stop.kind === 'elite' ? dropRelic(data.relics, run.relics, data.j.relics.eliteWeights, stopRng(run, 13)) : null;
  if (relic) run = gainRelic(run, relic, data);
  if (!run.bossChoice) advanceStop(run, data);
  const talentRyo = rewardRyo + levelRyo;
  return { run, outcome: { won: true, ryo, talent: rewardRyo ? 0 : reward.talent, talentRyo, xp: xpGained, levelUps, retry: false, relic } };
}

/** Vai para a próxima parada (ou o próximo estágio, ou a vitória). */
function advanceStop(run: JRun, data: JornadaData): void {
  if (run.mode === 'generic') return advanceNode(run, data);
  run.stopIndex++;
  if (run.stopIndex < currentStage(run, data).stops.length) return;
  run.stageIndex++;
  run.stopIndex = 0;
  if (run.stageIndex >= storyStages(run, data).length) {
    run.stageIndex = storyStages(run, data).length - 1;
    run.stopIndex = currentStage(run, data).stops.length - 1;
    run.status = 'victory';
  }
}

/** Caminho Ninja: fecha o nó atual; depois do chefe, gera o mapa do próximo estágio (ou é vitória). */
function advanceNode(run: JRun, data: JornadaData): void {
  const node = mapNode(run.map!, run.nodeId!);
  run.stopIndex++;
  if (node.kind !== 'boss') {
    run.path.push(node.id);
    run.nodeId = null;
    return;
  }
  if (run.stageIndex + 1 >= data.generic.stages.length) {
    run.status = 'victory';
    return;
  }
  run.stageIndex++;
  run.stopIndex = 0;
  run.path = [];
  run.nodeId = null;
  run.map = generateMap(stopRng(run, 31), data);
}

/** O modo infinito existe só no Caminho Ninja e no Hardcore: a run vencida pode seguir para o próximo ciclo. */
export const canContinueCycle = (run: JRun, data: JornadaData) => run.mode === 'generic' && run.status === 'victory' && run.difficulty === data.j.infinite.difficulty;

/**
 * Modo infinito (docs/jornada/run.md#modo-infinito): o Caminho Ninja vencido volta ao estágio 1 com os inimigos mais
 * fortes. Mantém nível, XP, talentos, relíquias, ryō, bolsa, moveset, suportes e as contas da run; sorteia chefes e mapa
 * novos (da seed e do ciclo), limpa as marcas dos eventos, volta com a equipe cheia e repõe a Vontade do Fogo da
 * dificuldade (sem tirar as que sobraram).
 */
export function continueCycle(prev: JRun, data: JornadaData, unlocked: ReadonlySet<string> = new Set(prev.unlocks ?? [])): JRun {
  if (!canContinueCycle(prev, data)) throw new Error('só o Caminho Ninja vencido segue de ciclo');
  const run = clone(prev);
  run.cycle = (run.cycle ?? 0) + 1;
  run.status = 'inProgress';
  run.stageIndex = 0;
  run.stopIndex = 0;
  run.bossChoice = null;
  run.members = {};
  // A maldição do mercador dura a run toda, inclusive os ciclos do infinito.
  run.flags = run.flags.filter((f) => f === SHOP_CURSE);
  run.cleared = [...new Set(run.cleared)];
  run.willOfFire = Math.max(run.willOfFire, data.j.run.willOfFire[run.difficulty] ?? 0);
  const rng = createRng((run.seed ^ Math.imul(run.cycle, 0x27d4eb2f)) >>> 0);
  run.bossPlan = data.generic.stages.map((s) => Math.floor(rng() * s.bosses.length));
  run.map = generateMap(rng, data);
  run.path = [];
  run.nodeId = null;
  return syncUnlocks(run, unlocked, data);
}

/** Pula a parada atual sem efeito (sair do mercador, do tesouro já aberto...). */
export function leaveStop(prev: JRun, data: JornadaData): JRun {
  const run = clone(prev);
  advanceStop(run, data);
  return run;
}

export function chooseBossRelic(prev: JRun, relicId: string, data: JornadaData): JRun {
  if (!prev.bossChoice?.includes(relicId)) throw new Error('relíquia fora da escolha');
  const run = gainRelic(prev, relicId, data);
  run.bossChoice = null;
  advanceStop(run, data);
  return run;
}

/** Ganha a relíquia, com os recursos que ela dá na hora. */
export function gainRelic(prev: JRun, relicId: string, data: JornadaData): JRun {
  const run = clone(prev);
  const def = data.relics.find((r) => r.id === relicId);
  if (!def || run.relics.includes(relicId)) return run;
  // Evolução: toma o lugar da relíquia inicial.
  const replaced = def.evolves ? run.relics.indexOf(def.evolves) : -1;
  if (replaced >= 0) run.relics[replaced] = relicId;
  else run.relics.push(relicId);
  for (const [k, n] of Object.entries(def.grant?.items ?? {})) run.bag[k as ConsumableId] = (run.bag[k as ConsumableId] ?? 0) + (n ?? 0);
  run.willOfFire += def.grant?.willOfFire ?? 0;
  run.ryo += def.grant?.ryo ?? 0;
  addTalentPoints(run, def.grant?.talentPoints ?? 0, data);
  // HP a mais (bandana) entra cheio.
  if (def.stats?.hp && run.members[run.hero]) run.members[run.hero]!.hp += def.stats.hp;
  return run;
}

/** Tesouro: relíquia sorteada pela classificação. */
export function openTreasure(run: JRun, data: JornadaData): string | null {
  return dropRelic(data.relics, run.relics, data.j.relics.treasureWeights, stopRng(run, 3));
}

// ---------------------------------------------------------------------------
// Loja e descanso

export interface ShopOffer {
  relics: { id: string; price: number }[];
  consumables: { id: ConsumableId; price: number }[];
  training: number;
  treatment: number;
}

/** Desconto da loja: relíquias e, na História, ajudar o Tazuna (só no País das Ondas). Tem teto. */
export function shopDiscount(run: JRun, data: JornadaData): number {
  const tazuna = run.mode === 'canon' && run.stageIndex === 0 && run.flags.includes('helpedTazuna') ? 0.2 : 0;
  const relics = relicDefs(run, data).reduce((a, r) => a + (r.shopDiscount ?? 0), 0);
  return Math.min(data.j.shop.maxDiscount, tazuna + relics);
}

const shopKey = (run: JRun) => `${run.cycle ?? 0}:${run.stageIndex}`;

/** Estágios já passados na run, somando os ciclos do modo infinito. */
const stagesPassed = (run: JRun, data: JornadaData) => (run.cycle ?? 0) * stageCount(run, data) + run.stageIndex;

export const isCursed = (run: JRun) => run.flags.includes(SHOP_CURSE);

/** Quanto a loja está mais cara que no começo da run: cada estágio soma, e com a maldição cada compra também. */
export const shopInflation = (run: JRun, data: JornadaData) =>
  data.j.shop.perStage * stagesPassed(run, data) + (isCursed(run) ? data.j.shop.perPurchase * (run.cursedPurchases ?? 0) : 0);

/** Pesos da prateleira: melhoram a cada estágio passado; o último vale para os seguintes. */
export function shopWeights(run: JRun, data: JornadaData): Record<string, number> {
  const table = data.j.relics.shopWeights;
  return table[Math.min(stagesPassed(run, data), table.length - 1)]!;
}

/**
 * Sorteia a prateleira do estágio (depende só da seed, do ciclo, do estágio e de quantas vezes foi atualizada).
 * `avoid`: relíquias da prateleira anterior, que não voltam se houver outras para pôr no lugar.
 */
function rollShelf(run: JRun, data: JornadaData, refreshes = 0, avoid: readonly string[] = []): string[] {
  const rng = stopRng({ ...run, stopIndex: 0 }, refreshes ? 40 + refreshes : 5);
  const roll = (skip: readonly string[]) => {
    const owned = [...run.relics, ...skip];
    // Uma vaga fixa de relíquia de loja; se acabarem, a vaga volta para o sorteio comum.
    const exclusive = rollRelic(data.relics, owned, { shop: 1 }, rng);
    return [...rollRelics(data.relics, exclusive ? [...owned, exclusive] : owned, shopWeights(run, data), data.j.shop.relics - (exclusive ? 1 : 0), rng), ...(exclusive ? [exclusive] : [])];
  };
  const fresh = roll(avoid);
  return fresh.length >= data.j.shop.relics || !avoid.length ? fresh : roll([]);
}

/** Abre a loja: no primeiro acesso do estágio, sorteia e guarda o estoque. */
export function openShop(prev: JRun, data: JornadaData): JRun {
  if (prev.shop?.key === shopKey(prev)) return prev;
  return { ...clone(prev), shop: { key: shopKey(prev), relics: rollShelf(prev, data) } };
}

/** Preço de atualizar a prateleira agora: sobe a cada uso no estágio, com as grátis das relíquias e o desconto. */
export function refreshPrice(run: JRun, data: JornadaData): number {
  const used = run.shop?.key === shopKey(run) ? (run.shop.refreshes ?? 0) : 0;
  const free = relicDefs(run, data).reduce((a, r) => a + (r.freeRefresh ?? 0), 0);
  if (used < free) return 0;
  const { base, step } = data.j.shop.refresh;
  return Math.floor((base + step * (used - free)) * (1 - shopDiscount(run, data)));
}

export const canRefreshShelf = (run: JRun, data: JornadaData) => run.ryo >= refreshPrice(run, data);

/** Atualiza a prateleira: paga e sorteia relíquias novas (as da prateleira anterior não voltam, se houver outras). */
export function refreshShelf(prev: JRun, data: JornadaData): JRun {
  if (!canRefreshShelf(prev, data)) throw new Error('ryō insuficiente para atualizar');
  const run = clone(openShop(prev, data));
  run.ryo -= refreshPrice(run, data);
  const refreshes = (run.shop!.refreshes ?? 0) + 1;
  run.shop = { key: run.shop!.key, relics: rollShelf(run, data, refreshes, run.shop!.relics), refreshes };
  return run;
}

/** Preço do amuleto que tira a maldição (null sem maldição: o item não aparece). */
export const cleansePrice = (run: JRun, data: JornadaData): number | null =>
  isCursed(run) ? Math.floor(data.j.shop.cleansePrice * (1 - shopDiscount(run, data))) : null;

/** Tira a maldição do mercador (evento ou amuleto da loja): os preços voltam ao normal. */
function liftCurse(run: JRun): void {
  run.flags = run.flags.filter((f) => f !== SHOP_CURSE);
  run.cursedPurchases = 0;
}

export function buyCleanse(prev: JRun, data: JornadaData): JRun {
  const price = cleansePrice(prev, data);
  if (price === null || prev.ryo < price) throw new Error('amuleto indisponível');
  const run = clone(prev);
  run.ryo -= price;
  liftCurse(run);
  return run;
}

export function shopOffer(run: JRun, data: JornadaData): ShopOffer {
  const s = data.j.shop;
  const off = (1 + shopInflation(run, data)) * (1 - shopDiscount(run, data));
  const price = (n: number) => Math.floor(n * off);
  const ids = run.shop?.key === shopKey(run) ? run.shop.relics : rollShelf(run, data);
  return {
    relics: ids.map((id) => ({ id, price: price(data.j.relics.price[data.relics.find((r) => r.id === id)!.tier]!) })),
    consumables: CONSUMABLES.map((id) => ({ id, price: price(s.consumablePrice[id]!) })),
    training: price(s.trainingPrice),
    treatment: price(s.treatmentPrice),
  };
}

const bagCount = (run: JRun) => CONSUMABLES.reduce((a, id) => a + run.bag[id], 0);
/** Espaços da bolsa, com as relíquias. */
const bagLimit = (run: JRun, data: JornadaData) => data.j.run.bagLimit + relicDefs(run, data).reduce((a, r) => a + (r.bagBonus ?? 0), 0);
export const bagFull = (run: JRun, data: JornadaData) => bagCount(run) >= bagLimit(run, data);

export type Purchase = { kind: 'relic'; id: string; price: number } | { kind: 'item'; id: ConsumableId; price: number } | { kind: 'training'; price: number } | { kind: 'treatment'; price: number };

export function canBuy(run: JRun, p: Purchase, data: JornadaData): boolean {
  if (run.ryo < p.price) return false;
  if (p.kind === 'relic') return !run.relics.includes(p.id);
  if (p.kind === 'item') return !bagFull(run, data);
  // Com a árvore completa, o Treino some da loja (o ponto viraria ryō).
  if (p.kind === 'training') return !talentTreeComplete(run, data);
  return true;
}

export function buy(prev: JRun, p: Purchase, data: JornadaData): JRun {
  if (!canBuy(prev, p, data)) throw new Error('compra indisponível');
  // O estoque fica guardado antes da compra: a relíquia comprada não pode mudar a prateleira.
  let run = clone(openShop(prev, data));
  run.ryo -= p.price;
  run.shopPurchases = (run.shopPurchases ?? 0) + 1;
  if (isCursed(run)) run.cursedPurchases = (run.cursedPurchases ?? 0) + 1;
  if (p.kind === 'relic') run = gainRelic(run, p.id, data);
  else if (p.kind === 'item') run.bag[p.id]++;
  else if (p.kind === 'training') addTalentPoints(run, 1, data);
  else healAll(run, data.j.shop.treatmentHeal, data, membersSeen(run, data));
  return run;
}

/** Quem está na equipe do estágio atual (para curas fora de luta). */
export function membersSeen(run: JRun, data: JornadaData): string[] {
  return [...new Set([run.hero, ...stageTeam(run, data), ...Object.keys(run.members)])];
}

export type RestChoice = 'heal' | 'train';

/** O que o descanso cura em cada membro, com as relíquias. */
export function restHeal(run: JRun, data: JornadaData): Heal {
  return relicDefs(run, data).reduce((a, r) => ({ hp: a.hp + (r.restBonus?.hp ?? 0), chakra: a.chakra + (r.restBonus?.chakra ?? 0) }), data.j.run.restHeal);
}

export function rest(prev: JRun, choice: RestChoice, data: JornadaData): JRun {
  const run = clone(prev);
  if (choice === 'heal') healAll(run, restHeal(run, data), data, membersSeen(run, data));
  else addTalentPoints(run, 1, data);
  advanceStop(run, data);
  return run;
}

// ---------------------------------------------------------------------------
// Eventos

/** Aplica uma escolha de evento (com o resultado do minijogo, se houver) e avança. */
export function resolveEvent(prev: JRun, optionId: string, wonMinigame: boolean, data: JornadaData): { run: JRun; relic: string | null } {
  const stop = currentStop(prev, data);
  if (stop?.kind !== 'event') throw new Error('a parada atual não é um evento');
  const def = data.events[stop.event]!;
  const opt = eventOptions(def, prev.flags, prev.ryo).find((o) => o.id === optionId);
  if (!opt) throw new Error(`opção indisponível: ${optionId}`);
  let run = clone(prev);
  let relic: string | null = null;
  run.ryo -= opt.cost ?? 0;
  run.flags = [...new Set([...run.flags, `ev:${def.id}`])];
  const effects: EventEffect[] = opt.minigame && !wonMinigame ? (opt.onLose ?? []) : opt.effects;
  for (const e of effects) {
    if (e.kind === 'ryo') run.ryo += ryoGain(run, e.n, data);
    else if (e.kind === 'talent') addTalentPoints(run, e.n, data);
    else if (e.kind === 'xp') gainXp(run, e.n, data);
    else if (e.kind === 'healTeam') healAll(run, e, data, membersSeen(run, data));
    else if (e.kind === 'healFull') healFull(run, data, membersSeen(run, data));
    else if (e.kind === 'hurtTeam') {
      for (const id of membersSeen(run, data)) {
        const st = memberState(run, id, data);
        run.members[id] = { ...st, hp: Math.max(1, st.hp - Math.floor(st.hp * e.pct)) };
      }
    } else if (e.kind === 'item') run.bag[e.id] = Math.min(run.bag[e.id] + e.n, run.bag[e.id] + Math.max(0, bagLimit(run, data) - bagCount(run)));
    else if (e.kind === 'flag') run.flags = [...new Set([...run.flags, e.id])];
    else if (e.kind === 'curse') {
      if (!isCursed(run)) run.cursedPurchases = 0;
      run.flags = [...new Set([...run.flags, SHOP_CURSE])];
    } else if (e.kind === 'cleanse') liftCurse(run);
    else if (e.kind === 'relic') {
      relic = dropRelic(data.relics, run.relics, { [e.tier]: 1 }, stopRng(run, 9));
      if (relic) run = gainRelic(run, relic, data);
    } else if (e.kind === 'maxStat') {
      for (const id of e.who === 'hero' ? [run.hero] : membersSeen(run, data)) {
        const b = run.bonus[id] ?? { hp: 0, chakra: 0 };
        run.bonus[id] = { ...b, [e.stat]: b[e.stat] + e.n };
        if (run.members[id]) run.members[id] = { ...run.members[id], [e.stat]: run.members[id][e.stat] + e.n };
      }
    }
  }
  advanceStop(run, data);
  return { run, relic };
}

// ---------------------------------------------------------------------------
// Talentos e moveset

export function talentContext(run: JRun, unlocked: ReadonlySet<string>): TalentContext {
  return { owned: run.talents, ranks: run.talentRanks, points: run.talentPoints, stageIndex: run.stageIndex, unlocked, elements: [run.elements[run.hero] ?? null, run.secondElement] };
}

/** Técnica que o nó ensina nesta run (fixa ou pelo elemento do protagonista). */
export function talentLearns(run: JRun, nodeId: string, data: JornadaData): string | null {
  const node = data.talents.find((t) => t.id === nodeId);
  if (!node) return null;
  if (node.learnByElement) {
    const el = run.elements[run.hero];
    return el ? (node.learnByElement[el] ?? null) : null;
  }
  return node.learn ?? null;
}

export function buyTalent(prev: JRun, nodeId: string, unlocked: ReadonlySet<string>, data: JornadaData): JRun {
  const node = data.talents.find((t) => t.id === nodeId);
  if (!node || node.owner !== prev.hero || !canBuyTalent(node, data.talents, talentContext(prev, unlocked))) throw new Error('talento indisponível');
  const run = clone(prev);
  run.unlocks = talentUnlocks(unlocked, data);
  // Já aprendido: sobe um nível (a técnica não muda; os bônus vêm de `rankMods`).
  if (run.talents.includes(node.id)) {
    run.talentPoints -= talentRankCost(node);
    run.talentRanks = { ...run.talentRanks, [node.id]: (run.talentRanks?.[node.id] ?? 1) + 1 };
    settleTalentPoints(run, data);
    return run;
  }
  run.talentPoints -= node.cost;
  run.talents.push(node.id);
  const learn = talentLearns(run, node.id, data);
  if (learn && !run.learned.includes(learn)) {
    run.learned.push(learn);
    // Técnica nova entra no moveset se houver espaço.
    if (!data.techniques[learn]?.active && run.moveset.length < MOVESET_SIZE) run.moveset.push(learn);
  }
  // A árvore fechou: o que sobrou vira ryō.
  settleTalentPoints(run, data);
  return run;
}

export function setMoveset(prev: JRun, moveset: string[], data: JornadaData): JRun {
  const known = heroMovable(prev, data);
  const unique = [...new Set(moveset)];
  if (unique.length === 0 || unique.length > MOVESET_SIZE || unique.some((id) => !known.includes(id))) throw new Error('moveset inválido');
  return { ...clone(prev), moveset: unique };
}

/** Desconta da bolsa o item usado na luta. */
export function spendItem(prev: JRun, item: ConsumableId): JRun {
  if (prev.bag[item] <= 0) throw new Error('item acabou');
  const run = clone(prev);
  run.bag[item]--;
  return run;
}
