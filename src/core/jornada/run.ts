// Estado da run da Jornada (docs/jornada/run.md): trilha ou mapa, equipe, ryō, relíquias, talentos, XP e
// bolsa. Funções puras; a interface salva o estado no aparelho a cada parada (state/jornadaSave.ts).
// Dois modos: canônica (trilha linear do Naruto) e genérica (mapa ramificado, classe, elemento sorteado).
import type { Difficulty } from '../difficulty';
import { createRng, type Rng } from '../rng';
import type { Element } from '../types';
import { allyResults, emptyMods, enemySeed, mergeMods, type BattleSetup, type FighterSeed } from './battle';
import type { JornadaData } from './data';
import { eventOptions, type EventEffect } from './events';
import { generateMap, mapNode, nextNodes, type StageMap } from './map';
import { rollRelic, rollRelics, type RelicDef, type RelicTier } from './relics';
import { canBuyTalent, type TalentContext } from './talents';
import { isFight, teamFor, type FightKind, type StopDef } from './trail';
import type { ConsumableId, FighterMods, JBattle } from './types';

/** Protagonista da run canônica. */
export const HERO = 'naruto';
export const MOVESET_SIZE = 4;
export const CONSUMABLES: ConsumableId[] = ['hpKit', 'chakraKit', 'reviveKit'];

export interface MemberState {
  hp: number;
  chakra: number;
}

export interface JRun {
  version: 1;
  /** Canônica (trilha linear do Naruto) ou genérica (mapa ramificado com classe). */
  mode: 'canon' | 'generic';
  /** Personagem protagonista (naruto, commonNinja, prodigy...). */
  hero: string;
  /** Classe escolhida (canônica: 'naruto'). */
  classId: string;
  /** Elemento sorteado por personagem (genérica: protagonista e suportes). */
  elements: Record<string, Element | null>;
  /** Genérica: suportes das lutas comuns. */
  supports: string[];
  /** Genérica: mapa do estágio atual. */
  map: StageMap | null;
  /** Genérica: nó em que está (null = escolhendo o próximo). */
  nodeId: string | null;
  /** Genérica: nós já feitos no estágio. */
  path: string[];
  /** Genérica: chefe sorteado de cada estágio (índice em `bosses`). */
  bossPlan: number[];
  seed: number;
  difficulty: Difficulty;
  stageIndex: number;
  /** Canônica: parada da trilha. Genérica: quantos nós já fez no estágio. */
  stopIndex: number;
  ryo: number;
  xp: number;
  level: number;
  talentPoints: number;
  talents: string[];
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
  /** Escolha de lendária pendente (depois de um chefe). */
  bossChoice: string[] | null;
  stats: { fights: number; wins: number; alliesLost: number; bestHit: number };
  /** Lutas vencidas (ids das paradas), para as conquistas. */
  cleared: string[];
}

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
    supports: [],
    map: null,
    nodeId: null,
    path: [],
    bossPlan: [],
    seed,
    difficulty,
    stageIndex: 0,
    stopIndex: 0,
    ryo: 0,
    xp: 0,
    level: 1,
    talentPoints: 0,
    talents: [],
    learned: [],
    moveset: data.characters[hero]!.techniques.filter((id) => !data.techniques[id]?.active).slice(0, MOVESET_SIZE),
    relics: data.relics.filter((r) => r.tier === 'starter').map((r) => r.id),
    bag,
    willOfFire: data.j.run.willOfFire[difficulty] ?? 0,
    members: {},
    bonus: {},
    flags: [],
    status: 'inProgress',
    bossChoice: null,
    stats: { fights: 0, wins: 0, alliesLost: 0, bestHit: 0 },
    cleared: [],
  };
}

/** Run canônica do Naruto (docs/jornada/canonica.md). */
export function newRun(seed: number, difficulty: Difficulty, data: JornadaData): JRun {
  return baseRun(seed, difficulty, HERO, data);
}

const ELEMENTS: Element[] = ['fire', 'wind', 'lightning', 'earth', 'water'];

/** Sorteio do elemento: cada elemento com o mesmo peso, mais "nenhum" quando permitido. */
export function drawElement(rng: Rng, data: JornadaData, allowNone: boolean): Element | null {
  const w = data.j.elementDraw;
  const total = w.element * ELEMENTS.length + (allowNone ? w.none : 0);
  const i = Math.floor((rng() * total) / w.element);
  return i < ELEMENTS.length ? ELEMENTS[i]! : null;
}

/**
 * Run genérica (docs/jornada/generica.md): sorteia o elemento do protagonista (o Comum sem elemento vira
 * prodígio) e o dos suportes, o chefe de cada estágio e o mapa do estágio 1.
 */
export function newGenericRun(seed: number, difficulty: Difficulty, classId: string, data: JornadaData): JRun {
  const cls = data.generic.classes.find((c) => c.id === classId);
  if (!cls) throw new Error(`classe desconhecida: ${classId}`);
  const rng = createRng(seed ^ 0x5bd1e995);
  const element = cls.fixedElement ?? drawElement(rng, data, Boolean(cls.noElementHero));
  const hero = element === null && cls.noElementHero ? cls.noElementHero : cls.hero;
  const run = baseRun(seed, difficulty, hero, data);
  run.mode = 'generic';
  run.classId = classId;
  run.supports = [...data.generic.supports];
  run.elements = { [hero]: element };
  for (const id of run.supports) run.elements[id] = drawElement(rng, data, false);
  run.bossPlan = data.generic.stages.map((s) => Math.floor(rng() * s.bosses.length));
  run.map = generateMap(rng, data);
  // O nível I do elemento entra no moveset.
  run.moveset = heroMovable(run, data).slice(0, MOVESET_SIZE);
  return run;
}

function mix(a: number): Rng {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rng de uma parada: derivada da seed da run (repetir a parada repete os sorteios). */
export function stopRng(run: JRun, salt = 0): Rng {
  return mix((run.seed ^ Math.imul(run.stageIndex * 100 + run.stopIndex + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0);
}

// ---------------------------------------------------------------------------
// Estágio e parada

/** Estágio da run canônica (na genérica, `genericStage`). */
export const currentStage = (run: JRun, data: JornadaData) => data.stages[run.stageIndex]!;
export const genericStage = (run: JRun, data: JornadaData) => data.generic.stages[run.stageIndex]!;
export const stageCount = (run: JRun, data: JornadaData) => (run.mode === 'generic' ? data.generic.stages.length : data.stages.length);
export const stageId = (run: JRun, data: JornadaData) => (run.mode === 'generic' ? genericStage(run, data).id : currentStage(run, data).id);
export const stageScene = (run: JRun, data: JornadaData) => (run.mode === 'generic' ? genericStage(run, data).scene : currentStage(run, data).scene);
/** Suportes das lutas comuns do estágio. */
export const stageTeam = (run: JRun, data: JornadaData): string[] => (run.mode === 'generic' ? run.supports : currentStage(run, data).team);

export function currentStop(run: JRun, data: JornadaData): StopDef | null {
  if (run.mode === 'generic') return run.nodeId ? stopFromNode(run, data) : null;
  return currentStage(run, data).stops[run.stopIndex] ?? null;
}

/** Na genérica: a run espera o jogador escolher o próximo nó do mapa. */
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

/** Parada do nó atual da genérica. O desconhecido vira evento, luta, mercador ou tesouro. */
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
  return { kind: kind as 'shop' | 'rest' | 'treasure', id };
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
  const allyHpPct = isHero ? 0 : relics.reduce((a, r) => a + (r.allyHpPct ?? 0), 0);
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

/** Técnica de nível I do elemento sorteado (genérica). */
function elementBasic(run: JRun, id: string, data: JornadaData): string[] {
  const el = run.elements[id];
  return el ? [data.elementLines[el][0]] : [];
}

/** Técnicas que o protagonista conhece (kit inicial + elemento + talentos). */
export function heroKnown(run: JRun, data: JornadaData): string[] {
  return [...new Set([...data.characters[run.hero]!.techniques, ...elementBasic(run, run.hero, data), ...run.learned])];
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
  for (const node of ownedTalents(run, data)) if (node.mods) mods = mergeMods(mods, node.mods);
  for (const r of relicDefs(run, data)) {
    if (r.mods) mods = mergeMods(mods, r.mods);
    if (r.teamMods) mods = mergeMods(mods, r.teamMods);
  }
  return mods;
}

export function teamMods(run: JRun, data: JornadaData): FighterMods {
  let mods = emptyMods();
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
    techniques: hero ? [...run.moveset, ...heroActives(run, data)] : allyTechniques(run, id, data),
    ai: def.ai,
    mods: hero ? heroMods(run, data) : teamMods(run, data),
  };
}

/** Suportes de uma luta: na canônica, os da parada ou do estágio; na genérica, os da run. */
export function fightTeam(run: JRun, stop: StopDef, data: JornadaData): string[] {
  return run.mode === 'generic' ? run.supports : teamFor(currentStage(run, data), stop);
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
    const seed = enemySeed(id, run.difficulty, data);
    return opening ? { ...seed, hp: Math.max(1, seed.hp - opening) } : seed;
  });
  return { allies, enemies: foes, win: stop.win ?? { kind: 'defeatAll' } };
}

// ---------------------------------------------------------------------------
// Progresso

/** XP para passar do nível atual. */
export const xpToNext = (level: number, data: JornadaData) => data.j.xp.base + data.j.xp.perLevel * (level - 1);

function gainXp(run: JRun, xp: number, data: JornadaData): number {
  const mult = ownedTalents(run, data).reduce((a, t) => a * (t.xpMult ?? 1), 1);
  run.xp += Math.floor(xp * mult);
  let ups = 0;
  while (run.xp >= xpToNext(run.level, data)) {
    run.xp -= xpToNext(run.level, data);
    run.level++;
    run.talentPoints += data.j.xp.talentPerLevel;
    ups++;
  }
  return ups;
}

const ryoGain = (run: JRun, n: number, data: JornadaData) =>
  Math.floor(n * relicDefs(run, data).reduce((a, r) => a * (r.ryoMult ?? 1), 1));

function healAll(run: JRun, pct: number, data: JornadaData, ids?: string[]): void {
  for (const id of ids ?? Object.keys(run.members)) {
    const sheet = memberSheet(run, id, data);
    const st = memberState(run, id, data);
    run.members[id] = { hp: Math.min(sheet.maxHp, st.hp + Math.floor(sheet.maxHp * pct)), chakra: Math.min(sheet.maxChakra, st.chakra + Math.floor(sheet.maxChakra * pct)) };
  }
}

export interface FightOutcome {
  won: boolean;
  ryo: number;
  talent: number;
  xp: number;
  levelUps: number;
  /** Gastou uma Vontade do Fogo: a luta recomeça. */
  retry: boolean;
}

/** Fecha a luta da parada atual: HP da equipe, recompensas e avanço (ou fim da run). */
export function finishFight(prev: JRun, battle: JBattle, data: JornadaData): { run: JRun; outcome: FightOutcome } {
  const run = clone(prev);
  const stop = currentStop(run, data)!;
  if (!isFight(stop)) throw new Error('a parada atual não é uma luta');
  run.stats.fights++;
  for (const e of battle.log) if (e.type === 'damage' && e.uid.startsWith('a') && e.amount > run.stats.bestHit) run.stats.bestHit = e.amount;
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
      return { run, outcome: { won: false, ryo: 0, talent: 0, xp: 0, levelUps: 0, retry: true } };
    }
    run.status = 'defeat';
    for (const r of results) run.members[r.defId] = { hp: r.hp, chakra: r.chakra };
    return { run, outcome: { won: false, ryo: 0, talent: 0, xp: 0, levelUps: 0, retry: false } };
  }
  run.stats.wins++;
  run.cleared.push(stop.id);
  // A recuperação vem das relíquias (a Tigela do Ichiraku, inicial, e o Cupom) e vale para a equipe do
  // estágio inteira: quem lutou e terminou de pé e quem ficou de fora desta luta.
  const rec = relicDefs(run, data).reduce((a, r) => a + (r.afterWinHealPct ?? 0), 0);
  const fought = new Set(results.map((r) => r.defId));
  healAll(run, rec, data, membersSeen(run, data).filter((id) => !fought.has(id)));
  for (const r of results) {
    const sheet = memberSheet(run, r.defId, data);
    if (r.down) {
      run.stats.alliesLost++;
      run.members[r.defId] = { hp: Math.floor(sheet.maxHp * data.j.run.downedAllyReturnPct), chakra: r.chakra };
    } else {
      run.members[r.defId] = {
        hp: Math.min(sheet.maxHp, r.hp + Math.floor(sheet.maxHp * rec)),
        chakra: Math.min(sheet.maxChakra, r.chakra + Math.floor(sheet.maxChakra * rec)),
      };
    }
  }
  const reward = data.j.rewards[stop.kind as FightKind];
  const ryo = ryoGain(run, reward.ryo, data);
  run.ryo += ryo;
  run.talentPoints += reward.talent;
  const levelUps = gainXp(run, reward.xp, data);
  if (stop.kind === 'boss') {
    // Estágio vencido: toda a equipe volta cheia, inclusive quem caiu.
    healAll(run, 1, data, membersSeen(run, data));
    run.bossChoice = rollRelics(data.relics.filter((r) => r.tier === 'legendary'), run.relics, { common: 0, rare: 0, legendary: 1 }, data.j.relics.bossChoices, stopRng(run, 7));
    if (!run.bossChoice.length) run.bossChoice = null;
  }
  if (!run.bossChoice) advanceStop(run, data);
  return { run, outcome: { won: true, ryo, talent: reward.talent, xp: reward.xp, levelUps, retry: false } };
}

/** Vai para a próxima parada (ou o próximo estágio, ou a vitória). */
function advanceStop(run: JRun, data: JornadaData): void {
  if (run.mode === 'generic') return advanceNode(run, data);
  run.stopIndex++;
  if (run.stopIndex < currentStage(run, data).stops.length) return;
  run.stageIndex++;
  run.stopIndex = 0;
  if (run.stageIndex >= data.stages.length) {
    run.stageIndex = data.stages.length - 1;
    run.stopIndex = currentStage(run, data).stops.length - 1;
    run.status = 'victory';
  }
}

/** Genérica: fecha o nó atual; depois do chefe, gera o mapa do próximo estágio (ou é vitória). */
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
  run.relics.push(relicId);
  for (const [k, n] of Object.entries(def.grant?.items ?? {})) run.bag[k as ConsumableId] = (run.bag[k as ConsumableId] ?? 0) + (n ?? 0);
  run.willOfFire += def.grant?.willOfFire ?? 0;
  // HP a mais (bandana) entra cheio.
  if (def.stats?.hp && run.members[run.hero]) run.members[run.hero]!.hp += def.stats.hp;
  return run;
}

/** Tesouro: relíquia sorteada pela raridade. */
export function openTreasure(run: JRun, data: JornadaData): string | null {
  return rollRelic(data.relics, run.relics, data.j.relics.treasureWeights, stopRng(run, 3));
}

// ---------------------------------------------------------------------------
// Mercador e descanso

export interface ShopOffer {
  relics: { id: string; price: number }[];
  consumables: { id: ConsumableId; price: number }[];
  training: number;
  treatment: number;
}

/** Desconto do mercador: ajudar o Tazuna barateia o mercador do País das Ondas (canônica). */
export function shopDiscount(run: JRun): number {
  return run.mode === 'canon' && run.stageIndex === 0 && run.flags.includes('helpedTazuna') ? 0.2 : 0;
}

export function shopOffer(run: JRun, data: JornadaData): ShopOffer {
  const s = data.j.shop;
  const off = 1 - shopDiscount(run);
  const price = (n: number) => Math.floor(n * off);
  const ids = rollRelics(data.relics, run.relics, data.j.relics.shopWeights, s.relics, stopRng(run, 5));
  return {
    relics: ids.map((id) => ({ id, price: price(data.j.relics.price[data.relics.find((r) => r.id === id)!.tier as Exclude<RelicTier, 'starter'>]) })),
    consumables: CONSUMABLES.map((id) => ({ id, price: price(s.consumablePrice[id]!) })),
    training: price(s.trainingPrice),
    treatment: price(s.treatmentPrice),
  };
}

const bagCount = (run: JRun) => CONSUMABLES.reduce((a, id) => a + run.bag[id], 0);
export const bagFull = (run: JRun, data: JornadaData) => bagCount(run) >= data.j.run.bagLimit;

export type Purchase = { kind: 'relic'; id: string; price: number } | { kind: 'item'; id: ConsumableId; price: number } | { kind: 'training'; price: number } | { kind: 'treatment'; price: number };

export function canBuy(run: JRun, p: Purchase, data: JornadaData): boolean {
  if (run.ryo < p.price) return false;
  if (p.kind === 'relic') return !run.relics.includes(p.id);
  if (p.kind === 'item') return !bagFull(run, data);
  return true;
}

export function buy(prev: JRun, p: Purchase, data: JornadaData): JRun {
  if (!canBuy(prev, p, data)) throw new Error('compra indisponível');
  let run = clone(prev);
  run.ryo -= p.price;
  if (p.kind === 'relic') run = gainRelic(run, p.id, data);
  else if (p.kind === 'item') run.bag[p.id]++;
  else if (p.kind === 'training') run.talentPoints++;
  else healAll(run, data.j.shop.treatmentHealPct, data, membersSeen(run, data));
  return run;
}

/** Quem está na equipe do estágio atual (para curas fora de luta). */
export function membersSeen(run: JRun, data: JornadaData): string[] {
  return [...new Set([run.hero, ...stageTeam(run, data), ...Object.keys(run.members)])];
}

export type RestChoice = 'heal' | 'train';

export function rest(prev: JRun, choice: RestChoice, data: JornadaData): JRun {
  const run = clone(prev);
  if (choice === 'heal') healAll(run, data.j.run.restHealPct, data, membersSeen(run, data));
  else run.talentPoints++;
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
    else if (e.kind === 'talent') run.talentPoints += e.n;
    else if (e.kind === 'xp') gainXp(run, e.n, data);
    else if (e.kind === 'healTeam') healAll(run, e.pct, data, membersSeen(run, data));
    else if (e.kind === 'hurtTeam') {
      for (const id of membersSeen(run, data)) {
        const st = memberState(run, id, data);
        run.members[id] = { ...st, hp: Math.max(1, st.hp - Math.floor(st.hp * e.pct)) };
      }
    } else if (e.kind === 'item') run.bag[e.id] = Math.min(run.bag[e.id] + e.n, run.bag[e.id] + Math.max(0, data.j.run.bagLimit - bagCount(run)));
    else if (e.kind === 'flag') run.flags = [...new Set([...run.flags, e.id])];
    else if (e.kind === 'relic') {
      relic = rollRelic(data.relics.filter((r) => r.tier === e.tier), run.relics, { common: 1, rare: 1, legendary: 1 }, stopRng(run, 9));
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
  return { owned: run.talents, points: run.talentPoints, stageIndex: run.stageIndex, unlocked };
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
  run.talentPoints -= node.cost;
  run.talents.push(node.id);
  const learn = talentLearns(run, node.id, data);
  if (learn && !run.learned.includes(learn)) {
    run.learned.push(learn);
    // Técnica nova entra no moveset se houver espaço.
    if (!data.techniques[learn]?.active && run.moveset.length < MOVESET_SIZE) run.moveset.push(learn);
  }
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
