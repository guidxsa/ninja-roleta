// Protótipo jogável: interface mínima sobre o core real. Toda regra vem de src/core; aqui só há fluxo e animação.
import {
  canUseActive,
  canUseTechnique,
  kitOf,
  techBase,
  techCost,
  playerAttackOdds,
  playerHitDamage,
  playRoletaRound,
  startRoletaBattle,
  useActive,
  type RAction,
  type RBattle,
  type RBattleOptions,
  type REvent,
} from '../src/core/roleta/battle';
import { createRoletaPlayer, playerTechniques, roletaKit } from '../src/core/roleta/player';
import { roletaData as rdata } from '../src/data/roleta/index';
import { hasElementalNinjutsu } from '../src/core/nature';
import { gateUpkeep } from '../src/core/gates';
import {
  chooseChest,
  contractFor,
  continueRoletaCycle,
  canContinueRoleta,
  readyForFight,
  rollRelicReward,
  currentCategory,
  cycleMult,
  drawVillain,
  finishRoletaFight,
  gainRoletaRelic,
  rewardTierFor,
  rewardXp,
  newRoletaRun,
  villainFor,
  type RRun,
} from '../src/core/roleta/run';
import type { RTechniqueDef } from '../src/data/roleta/techniques';
import { critChance, hitSlices } from '../src/core/hit';
import { choose, esc, goHome, h, HOME, isOff, show, sleep, untilHome } from './dom';
import { lineageOf, rollOrigin, type OriginStep } from '../src/core/origin';
import { scaleVillain, type Difficulty } from '../src/core/difficulty';
import {
  canLevelUp,
  equipTrainingWeights,
  removeTrainingWeights,
  techniqueLevel,
  upgradeTechnique,
  withDifficulty,
  xpGain,
  xpToNextLevel,
  type PlayerState,
} from '../src/core/player';
import {
  applyAkatsuki,
  applyClanLesson,
  applyGuru,
  applyItem,
  applyPremium,
  applySimpleEvent,
  applySummonEncounter,
  applyTraining,
  applyTrainingFocus,
  chooseUpgrade,
  forfeitUpgrade,
  HANDS,
  levelUp,
  playJokenpo,
  rollAkatsuki,
  rollGuru,
  rollItem,
  rollPremiumChoices,
  rollSummonAnimal,
  rollTraining,
  rollWeighted,
  spendCoin,
  upgradeOptions,
  type Hand,
  type NextFightMods,
  type ProgressEffect,
  type Roll,
  type Step,
  xpStep,
} from '../src/core/progression';
import { buildLabPlayer, LAB_STAT_KEYS, labLearnable, labOrigin, labStatsOf, parseLabParams, type LabConfig } from '../src/core/lab';
import { newAchievements, type AchievementCategory } from '../src/core/achievements';
import { addEffect, addFight, addJokenpo, addPreEvent, emptyRunStats, type RunStats } from '../src/core/runStats';
import { summarizeRoletaFight } from '../src/core/roleta/stats';
import { createRng, type Rng } from '../src/core/rng';
import { buildShareText, type TrailEntry } from '../src/core/share';

import type { ConsumableId, Element, LineageTier, Origin, SummonAnimal, VillainDef } from '../src/core/types';
import { CONSUMABLES } from '../src/data/events';
import { campaign, type Stage } from '../src/data/campaign';
import { ptBR as S } from '../src/data/strings/ptBR';
import { roletaVillains as villains, roletaVillainsById as villainsById, type RCategory } from '../src/data/roleta/villains';
import { achievements } from '../src/data/achievements';
import {
  achievementsFromHistory,
  bestRoletaCycle,
  cleanPlayerName,
  discoverRelics,
  killedByCounts,
  loadProfile,
  originRecords,
  PLAYER_NAME_MAX,
  reachOf,
  recordFight,
  recordJornadaReach,
  recordRoletaReach,
  saveProfile,
  syncHardcoreUnlock,
  unlockAchievements,
  type Profile,
} from '../src/state/profile';
import { relicCard, relicCollection, relicName, relicSlot, relicTier } from './jornada/relics';
import { foldAttrs, foldButton, installFolds } from './jornada/fold';
import { relicIcon } from './jornada/relicIcons';
import { lineages as allLineages } from '../src/data/lineages';
import { askPlayerName } from './playerName';
import {
  loadRuns,
  markAbandonedRuns,
  startRun,
  updateRun,
  type KeyValueStorage,
  type RunStatus,
} from '../src/state/runHistory';
import { applySceneMode, installSceneRatios, clanSymbol, cloud, emblem, fighterPortrait, hasSceneVideos, icon, ninjaPortrait, sceneMedia, sceneVars, uiTextureVars, villainPortrait } from './art';
import { barLayers, barPct, barTone, patchBar } from './bars';
import { defeat, installAudio, mood, setMusic, setSfx, victory, type Mood } from './audio';
import {
  lines,
  conditionChip,
  ELEMENT_COLORS,
  ELEMENT_ICON,
  elementChip,
  rTechTip,
  techIconName,
  villainTechElement,
  villainTechTip,
  type Condition,
} from './tips';
import { installTooltips, tip } from './tooltip';
import { jornadaProgressCard, runJornada } from './jornada';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import type { JornadaHost } from './jornada/host';
import { createWheel, stripRoulette, type WheelSlice } from './wheel';
import { DESK } from './layout';
import { modeCard } from './modeCard';

// ---------------------------------------------------------------------------
// Infra

/** Base do Roleta enxuto: linhagens, níveis, eventos, itens e recompensas (sem pool de técnicas nem upgrades). */
const data = rdata.base;

/** Versão do jogo (package.json), embutida pelo build. */
declare const __VERSION__: string;
const VERSION = typeof __VERSION__ === 'undefined' ? 'dev' : __VERSION__;

/** `?teste` abre o laboratório; `?seed=N` fixa as roletas (reproduz uma run ou um bug). */
const LAB = parseLabParams(window.location.search);
/** Sem `?seed=`, cada run sorteia a própria seed (`nextRunSeed`), para o Compartilhar. */
let rng: Rng = LAB.seed !== null ? createRng(LAB.seed) : () => Math.random();
let labSeedUsed = false;

/** Seed da run que começa agora. Com `?seed=`, só a primeira run da página repete a seed. */
function nextRunSeed(): number | null {
  if (LAB.seed !== null) {
    const seed = labSeedUsed ? null : LAB.seed;
    labSeedUsed = true;
    return seed;
  }
  const seed = Math.floor(Math.random() * 2 ** 31);
  rng = createRng(seed);
  return seed;
}

const storage: KeyValueStorage = (() => {
  try {
    const ls = window.localStorage;
    ls.getItem('probe');
    return ls;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
})();

const SETTINGS_KEY = 'proto_settings_v1';
const DIFFICULTIES = Object.keys(data.balance.difficulty.multipliers) as Difficulty[];
const DEFAULT_DIFFICULTY: Difficulty = data.balance.difficulty.default;
/** Preferências do aparelho (não é estado de campanha). A dificuldade é a última escolhida. */
type Theme = 'light' | 'dark';
interface Settings {
  instant: boolean;
  difficulty: Difficulty;
  /** Efeitos sonoros (ligados por padrão). */
  sfx: boolean;
  /** Música de fundo (desligada por padrão). */
  music: boolean;
  /** Cenas animadas (vídeo nas vagas de ilustração); desligado é o modo Leve, o padrão. */
  animated: boolean;
  /** Tema escolhido no botão; sem escolha, segue o aparelho. */
  theme?: Theme;
}
const settings: Settings = (() => {
  try {
    const saved = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>;
    const difficulty = saved.difficulty && DIFFICULTIES.includes(saved.difficulty) ? saved.difficulty : DEFAULT_DIFFICULTY;
    const theme = saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : undefined;
    return { instant: Boolean(saved.instant), difficulty, sfx: saved.sfx !== false, music: Boolean(saved.music), animated: Boolean(saved.animated), theme };
  } catch {
    return { instant: false, difficulty: DEFAULT_DIFFICULTY, sfx: true, music: false, animated: false };
  }
})();
const saveSettings = () => {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* conveniência */
  }
};

const pace = {
  wheel: () => (settings.instant ? 0 : 3000),
  strip: () => (settings.instant ? 0 : 600),
  beat: () => (settings.instant ? 140 : 480),
};


// ---------------------------------------------------------------------------
// Textos e cores

/** Fatias das roletas: laranja, verde do colete, azul do chakra, vermelho, areia, roxo, verde-água e marinho. */
const PALETTE = ['#a8332b', '#b8892f', '#3f5f9e', '#4e8a68', '#7d4d8f', '#5d6b78', '#a65a2e', '#6f7a3a'];
const TIER_COLORS: Record<LineageTier, string> = { common: '#5d6168', clan: '#3f5f9e', rare: '#b8892f', legendary: '#a8332b' };
const SIDE_COLORS = { player: '#3f5f9e', villain: '#a8332b', miss: '#55585e', hit: '#4e8a5c', crit: '#c49a3a', foeHit: '#b5562c' };

const villainName = (id: string) => S.villains[id] ?? id;
/** Retrato do vilão: o desenho próprio ou, nos vindos da Jornada, o retrato emprestado de lá. */
const foePortrait = (id: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const spec = villainsById[id]?.portrait;
  return spec ? fighterPortrait(id, spec, size) : villainPortrait(id, size);
};
const techName = (id: string): string => {
  // Cópia (Uchiha): `copy:<vilão>.<técnica>`.
  if (id.startsWith('copy:')) return `${techName(id.slice(id.indexOf('.') + 1))} (cópia)`;
  return S.roleta.techniques[id] ?? S.techniques[id] ?? id;
};
/** Chip de elemento com ícone; `withTip` = false dentro de botões (o botão já tem a própria dica). */
const elChip = (el: Element | null, withTip = true) => elementChip(el, withTip);
/** Nível de técnica em algarismos romanos (I, II, III...). */
const roman = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] ?? String(n);

function originLabel(o: Origin): string {
  return o.lineageId ? S.lineages[o.lineageId] ?? o.lineageId : S.origin.common;
}

function stageName(stage: Stage): string {
  if (stage.kind === 'exam') return S.stages.exam;
  const names = stage.villains.map(villainName);
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`;
}

/** Som do resultado: perdas e azares soam mal; o que só vira XP ou não muda nada soa neutro. */
function effectMood(e: ProgressEffect): Mood {
  switch (e.kind) {
    case 'villainFirst':
    case 'akatsukiTookRevive':
    case 'guruCharlatan':
      return 'bad';
    case 'none':
    case 'akatsukiUnnoticed':
    case 'upgradeForfeit':
    case 'trainingWeights':
    case 'xp':
      return 'neutral';
    case 'bagItem':
      return e.overflowXp > 0 ? 'neutral' : 'good';
    default:
      return 'good';
  }
}

/** Mostra o efeito de um passo no fim de `container`, com o som do resultado. */
function showEffect(container: HTMLElement, e: ProgressEffect) {
  container.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(e)}${effectCompare(e)}</div>`);
  mood(effectMood(e));
}

/** Melhoria de equipamento, invocação ou técnica: o atual ao lado do novo. */
function effectCompare(e: ProgressEffect): string {
  const row = (was: string, now: string) =>
    `<div class="compare"><span class="was">${was}</span>${icon('chevron')}<span class="now">${now}</span></div>`;
  const L = S.ui.level;
  switch (e.kind) {
    case 'ninjaTool': {
      const per = data.balance.ninjaTool.baseDamagePerLevel;
      const was = e.level > 1 ? `${L}${e.level - 1} · +${(e.level - 1) * per}` : S.ui.bagEmpty;
      return row(was, `${L}${e.level} · +${e.level * per}`);
    }
    case 'summonLevel':
      return row(`${L}${e.level - 1}`, `${L}${e.level}`);
    case 'techniqueUpgrade':
      return row(`${esc(techName(e.from))}${e.from === e.techniqueId && e.level > 1 ? ` ${roman(e.level - 1)}` : ''}`, `${esc(techName(e.techniqueId))} ${roman(e.level)}`);
    default:
      return '';
  }
}

function effectText(e: ProgressEffect): string {
  const E = S.effects;
  switch (e.kind) {
    case 'none':
      return E.none;
    case 'villainFirst':
      return E.villainFirst;
    case 'playerFirst':
      return E.playerFirst;
    case 'stages':
      return E.stages(e.n);
    case 'revive':
      return E.revive;
    case 'ninjaTool':
      return E.ninjaTool(e.level);
    case 'techniqueUpgrade':
      return E.techniqueUpgrade(techName(e.from), techName(e.techniqueId), roman(e.level));
    case 'upgradeGranted':
      return E.upgradeGranted(e.n);
    case 'upgradeForfeit':
      return E.upgradeForfeit(e.xp);
    case 'resistance':
      return E.resistance(e.physical, e.mental);
    case 'training':
      return E.training(S.trainingStats[e.stat] ?? e.stat, e.amount, e.xp);
    case 'speed':
      return E.speed(e.amount);
    case 'critBonus':
      return E.critBonus;
    case 'newTechnique': {
      const head = e.techniqueId ? E.newTechnique(techName(e.techniqueId)) : E.newTechniqueUpgradesOnly;
      return head + (e.upgrades > 0 ? E.upgrades(e.upgrades) : '');
    }
    case 'xp':
      return E.xp(e.amount);
    case 'bagItem':
      return e.overflowXp > 0 ? E.bagFull(S.items[e.item]!, e.overflowXp) : E.bagItem(S.items[e.item]!);
    case 'coin':
      return E.coin(e.coins);
    case 'trainingWeights':
      return E.trainingWeights;
    case 'trainingFocus':
      return e.from
        ? E.trainingFocusUp(S.elements[e.element], techName(e.techniqueId), e.xp)
        : E.trainingFocusLearn(S.elements[e.element], techName(e.techniqueId), e.xp);
    case 'akatsukiTookRevive':
      return E.akatsukiTookRevive[e.reason]!;
    case 'akatsukiWeakened':
      return E.akatsukiWeakened[e.reason]!;
    case 'akatsukiInsight':
      return E.akatsukiInsight;
    case 'clanLesson': {
      const lesson = S.clanLessons[e.lineageId];
      return E.clanLesson(lesson?.title ?? '', lesson?.bonus ?? '', e.xp);
    }
    case 'akatsukiUnnoticed':
      return E.akatsukiUnnoticed;
    case 'guruCharlatan':
      return E.guruCharlatan;
    case 'guruPremium': {
      const name = e.techniqueId ? techName(e.techniqueId) : S.premiums[e.premium] ?? e.premium;
      return E.guruPremium(name, e.techniqueId ? roman(e.level) : '');
    }
    case 'levelUp': {
      const lines = [E.levelUp(e.level, e.hp, e.chakra)];
      if (e.learned.length) lines.push(E.learnedAtLevel(e.learned.map(techName).join(', ')));
      if (e.upgrades > 0) lines.push(E.levelUpgrade);
      const stages = data.balance.dojutsu.sharingan.stages;
      const evolved = stages.findIndex((st) => st.minLevel === e.level);
      if (camp?.player.dojutsu === 'sharingan' && evolved > 0) lines.push(E.sharinganEvolved(evolved + 1));
      return lines.join(' ');
    }
    case 'summonLearned':
      return E.summonLearned(S.summons[e.animal]!.name);
    case 'summonLevel':
      return E.summonLevel(S.summons[e.animal]!.name, e.level);
  }
}

// ---------------------------------------------------------------------------
// Estado da campanha (só em memória)

interface Campaign {
  runId: string;
  origin: Origin;
  player: PlayerState;
  difficulty: Difficulty;
  /** Run do Roleta enxuto (ciclo, passo, vilão sorteado, baú). `player` e `mods` vivem aqui ao lado. */
  run: RRun;
  mods: NextFightMods;
  /** Seed das roletas (null quando não dá para repetir). */
  seed: number | null;
  /** Resultado de cada etapa jogada, para o Compartilhar. */
  trail: TrailEntry[];
  /** Estatísticas da run, para as conquistas. */
  stats: RunStats;
  /** O que aconteceu em cada etapa (chave `ciclo:etapa`): o evento e os textos das mudanças. A trilha mostra ao expandir. */
  log: Record<string, StepLog>;
}

interface StepLog {
  event?: string;
  items: string[];
}

/** Etapa em andamento (a do mapa), para o registro; -1 fora de uma etapa. */
let logStep = -1;
const stepKey = (cycle: number, step: number) => `${cycle}:${step}`;
/** Registro da etapa atual (criado na primeira vez). */
function stepLog(): StepLog | null {
  if (!camp || logStep < 0) return null;
  const key = stepKey(camp.run.cycle, logStep);
  return (camp.log[key] ??= { items: [] });
}

let camp: Campaign | null = null;
/** A run do Roleta ainda está em andamento (a tela de fim já apareceu = false). */
let campLive = false;
/** Ficha da Jornada: abre a da run em andamento (null = sem run da Jornada). */
let jornadaSheet: (() => void) | null = null;

/** O botão Ficha do cabeçalho só aparece quando há o que mostrar: run do Roleta ou da Jornada. */
function syncSheetBtn() {
  document.body.classList.toggle('has-sheet', Boolean(camp) || Boolean(jornadaSheet));
}
const NO_MODS: NextFightMods = { villainStartsFirst: false, playerStartsFirst: false };
/** A run com o jogador e os modificadores atuais (que as telas mexem direto em `camp`). */
const getRun = (): RRun => ({ ...camp!.run, player: camp!.player, mods: camp!.mods });
const setRun = (r: RRun) => {
  camp!.run = r;
  camp!.player = r.player;
  camp!.mods = r.mods;
};

// ---------------------------------------------------------------------------
// Perfil: conquistas e Livro Bingo (localStorage)

let profile: Profile = loadProfile(storage);

/** Na primeira vez, libera os marcos que o histórico já prova (sem aviso). */
function backfillProfile() {
  if (profile.backfilled) return;
  profile = { ...unlockAchievements(profile, achievementsFromHistory(loadRuns(storage)), new Date()), backfilled: true };
  saveProfile(storage, profile);
}

/**
 * Hardcore liberado: guardado no perfil (o histórico tem só as últimas runs). Toda run passa pela tela da origem, então
 * a vitória que libera é vista aqui enquanto ainda está no histórico.
 */
function hardcoreUnlocked(): boolean {
  const next = syncHardcoreUnlock(profile, loadRuns(storage), data.balance.difficulty.hardcoreUnlockedBy);
  if (next !== profile) {
    profile = next;
    saveProfile(storage, profile);
  }
  return Boolean(profile.hardcoreUnlocked);
}

/** Uma luta da campanha: entra nas estatísticas da run e no Livro Bingo. */
function noteFight(villainId: string, exam: boolean, battle: RBattle) {
  if (!camp || LAB.lab) return;
  const fight = summarizeRoletaFight(villainId, exam, battle);
  camp.stats = addFight(camp.stats, fight);
  profile = recordFight(profile, fight);
  saveProfile(storage, profile);
  checkAchievements('inProgress', null);
}

/** Libera as conquistas novas e avisa cada uma. O laboratório não conta. */
function checkAchievements(result: 'inProgress' | 'victory' | 'defeat', fallenTo: string | null) {
  if (!camp || LAB.lab) return;
  const ids = newAchievements(achievements, {
    stats: camp.stats,
    origin: camp.origin,
    difficulty: camp.difficulty,
    level: camp.player.level,
    summon: camp.player.summon,
    result,
    fallenTo,
    killedBy: killedByCounts(profile),
    unlocked: new Set(Object.keys(profile.achievements)),
    // Ciclos vencidos: no fim do 1º a run fica em `victory`; dos seguintes, o ciclo já avançou.
    cyclesWon: camp.run.status === 'victory' ? camp.run.cycle + 1 : camp.run.cycle,
  });
  if (ids.length === 0) return;
  profile = unlockAchievements(profile, ids, new Date());
  saveProfile(storage, profile);
  ids.forEach((id, i) => setTimeout(() => toast(S.achievements.unlocked(S.achievements.list[id]?.name ?? id), 'medal'), i * 2800));
}

function track(patch: { status?: RunStatus; furthestStage?: number; difficulty?: Difficulty; cycle?: number; fights?: number }) {

  // Runs do laboratório não entram no histórico.
  if (!camp || LAB.lab) return;
  updateRun(storage, camp.runId, { ...patch, revivesUsed: camp.player.revivesUsed }, new Date(), data.balance.history.maxRuns);
}

function applyStep(step: Step) {
  if (!camp) return;
  camp.player = step.player;
  camp.mods = { ...camp.mods, ...step.mods };
  // A trilha guarda o que cada etapa deu (evento, recompensa, nível, melhoria).
  if (step.effect.kind !== 'none') stepLog()?.items.push(effectText(step.effect));
}

// ---------------------------------------------------------------------------
// Componentes

function bar(kind: 'hp' | 'ck', cur: number, max: number): string {
  const pct = barPct(cur, max);
  const tone = barTone(kind, pct);
  const name = S.stats[kind === 'hp' ? 'hp' : 'chakra'];
  return `<div class="bar bar-${kind}${tone ? ` ${tone}` : ''}" data-bar="${kind}"${tip(name, S.tips.stats[kind === 'hp' ? 'hp' : 'chakra'])}>${barLayers(pct)}<span>${name} ${cur}/${max}</span></div>`;
}

/** Atualiza a barra no lugar (com o rastro de dano), sem trocar o elemento. */
function setBar(root: HTMLElement, kind: 'hp' | 'ck', cur: number, max: number) {
  const el = root.querySelector<HTMLElement>(`[data-bar="${kind}"]`);
  const v = Math.max(0, Math.round(cur));
  if (el) patchBar(el, kind, v, max, `${S.stats[kind === 'hp' ? 'hp' : 'chakra']} ${v}/${max}`);
}

function modChips(mods: NextFightMods): string {
  const chips = [];
  if (mods.villainStartsFirst) chips.push(`<span class="chip bad">${icon('timer')}${S.ui.villainFirst}</span>`);
  if (mods.playerStartsFirst) chips.push(`<span class="chip good">${icon('dodge')}${S.ui.playerFirst}</span>`);
  return chips.join('');
}

/** Caixa de status com a dica do que ele faz. */
function statBox(key: keyof typeof S.stats, value: string | number): string {
  const T = S.tips.stats;
  const desc = T[key];
  return `<div${tip(S.stats[key], desc)}><small>${S.stats[key]}</small><b>${value}</b></div>`;
}

/** Selo redondo da linhagem (ou da folha), com o nome do clã na dica. */
function clanSeal(p: PlayerState): string {
  const id = p.origin.lineageId;
  const tier = id ? lineageOf(id, data).tier : 'common';
  const name = id ? S.lineages[id] ?? id : S.origin.common;
  const tierName = S.lineageTiers[tier] ?? '';
  return `<span class="clan-seal clan-${id ?? 'common'}"${tip(name, tierName)}>${clanSymbol(id)}</span>`;
}

/** Ícone da técnica do jogador: elemento, ou o tipo (taijutsu, ninjutsu, genjutsu). */
function techIcon(t: RTechniqueDef): string {
  return icon(techIconName(t.type, t.element ?? null));
}

/** Classes e cor de uma célula de técnica (tipo + elemento). */
function techLook(type: string, element: Element | null): { cls: string; style: string } {
  return {
    cls: `type-${type}${element ? ` el-${element}` : ''}`,
    style: element ? ` style="--c:${ELEMENT_COLORS[element]}"` : '',
  };
}

/** Técnicas do kit enxuto na ficha: dano no nível atual, golpes, precisão e custo (efeitos na dica). */
function techniqueRows(p: PlayerState): string {
  return playerTechniques(p, rdata)
    .map((t) => {
      const look = techLook(t.type, t.element ?? null);
      const dmg = techBase(p, t, rdata);
      const info = S.roleta.ui.techLine(dmg, t.hits ?? 1, Math.round((t.accuracy ?? data.balance.hit.defaultAccuracy) * 100));
      return `<li class="tech-card ${look.cls}"${look.style}${rTechTip(p, t)}><span class="tc-ico">${techIcon(t)}</span><span class="tc-txt"><b>${esc(techName(t.id))}</b><small>${S.actions[t.type]} · ${info} · ${S.ui.cost(t.chakra)}</small></span></li>`;
    })
    .join('');
}

interface PassiveEntry {
  ico: string;
  name: string;
  desc: string;
}

/** Passiva do kit enxuto da linhagem e a do jinchuuriki. */
function passiveTraitEntries(p: PlayerState): PassiveEntry[] {
  const R = S.roleta;
  const kit = kitOf(p, rdata);
  const out: PassiveEntry[] = [{ ico: clanSymbol(p.origin.lineageId), ...R.passives[kit.passive]! }];
  if (p.jinchuuriki) out.push({ ico: clanSymbol('jinchuuriki'), ...R.passives.jinchuuriki! });
  return out;
}

/** Selo compacto de passiva, com a descrição na dica. */
function passiveChip(e: PassiveEntry): string {
  return `<span class="chip passive-chip"${tip(e.name, e.desc)}>${e.ico}${e.name}</span>`;
}

/** Dica do nome da linhagem: passivas, ativas, dōjutsu, despertar e talentos, um por linha. */
function lineageTip(p: PlayerState): string {
  return tip(originLabel(p.origin), lines(passiveEntries(p).map((e) => `<b>${e.name}</b> · ${e.desc}`)));
}

/**
 * Passivas e dōjutsu do jogador. `li`: linha completa (ficha); `p`: selo compacto com a descrição na dica (painéis).
 */
function passiveItems(p: PlayerState, tag: 'li' | 'p'): string[] {
  return passiveEntries(p).map((e) =>
    tag === 'li' ? `<li${tip(e.name, e.desc)}><span class="pi-ico">${e.ico}</span><span><b>${e.name}</b> · ${e.desc}</span></li>` : passiveChip(e),
  );
}

/** Passiva e ativa do kit enxuto (mais a do jinchuuriki). */
function passiveEntries(p: PlayerState): PassiveEntry[] {
  const out: PassiveEntry[] = passiveTraitEntries(p);
  const active = kitOf(p, rdata).active;
  if (active) out.push({ ico: icon(RACTIVE_ICONS[active] ?? 'ninjutsu'), ...S.roleta.actives[active]! });
  return out;
}

/** Valor atual do efeito passivo da invocação (para o inventário). */
function summonEffect(p: PlayerState): string {
  if (!p.summon) return '';
  return S.summonEffects[p.summon.animal]!(p.summon.level);
}

/** Retrato do ninja (desenho da linhagem ou imagem própria em img/ninja/) com o selo do clã. */
function avatar(p: PlayerState, size: 'sm' | 'lg' = 'sm'): string {
  return `<span class="avatar avatar-${size}">${ninjaPortrait(p.origin.lineageId, p.jinchuuriki, size === 'lg' ? 'lg' : 'sm')}${clanSeal(p)}</span>`;
}

function xpBar(p: PlayerState): string {
  const need = xpToNextLevel(p.level, data);
  const pct = Math.min(100, (p.xp / need) * 100);
  return `<div class="bar bar-xp"${tip('XP', S.tips.stats.xp)}><div class="fill" style="width:${pct}%"></div><span>${S.ui.xp(p.xp, need)}</span></div>`;
}

function diffChip(d: Difficulty): string {
  return `<span class="chip diff diff-${d}"${tip(S.difficulty[d].name, S.difficulty[d].desc)}>${S.difficulty[d].name}</span>`;
}

function jinChip(p: PlayerState): string {
  if (!p.jinchuuriki) return '';
  const body = lines([S.passives.jinchuuriki!, S.passives.innerDemon!].map((t) => `<b>${t.name}</b> · ${t.desc}`));
  return `<span class="chip jin"${tip(S.origin.jinchuuriki, body)}>${clanSymbol('jinchuuriki')}${S.origin.jinchuuriki}</span>`;
}

/** Relíquias do Roleta: fileira de ícones com o efeito de lá na dica. */
function roletaRelicBar(p: PlayerState): string {
  const ids = p.relics ?? [];
  return ids.length ? `<div class="jrbar" role="list" aria-label="${S.roleta.run.relicsTitle}">${ids.map((id) => relicSlot(id, 'span', '', 'roleta')).join('')}</div>` : '';
}

/** Relíquias que apareceram no Roleta entram na coleção do perfil. */
function discoverRoletaRelics(ids: readonly string[]) {
  if (LAB.lab || !ids.length) return;
  const next = discoverRelics(profile, ids, new Date());
  if (next === profile) return;
  profile = next;
  saveProfile(storage, profile);
}

function playerPanel(p: PlayerState, mods: NextFightMods = NO_MODS): string {
  const passives = passiveItems(p, 'p').join('');
  return `
  <section class="card player-panel">
    <div class="panel-head">
      ${avatar(p)}
      <div class="panel-id">
        ${profile.playerName ? `<b class="name player-name">${esc(profile.playerName)}</b>` : ''}
        <b class="name${profile.playerName ? ' name-sub' : ''}"${lineageTip(p)}>${originLabel(p.origin)}</b>
        <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(p.level)}</span>${elementChips(p.elements, p.kekkeiGenkai, silentNature(p))}${jinChip(p)}${camp ? diffChip(camp.difficulty) : ''}</div>
      </div>
      <button class="btn small sheet-btn" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button>
    </div>
    ${xpBar(p)}
    ${bar('hp', p.hp, p.maxHp)}
    ${bar('ck', p.chakra, p.maxChakra)}
    <div class="stats">
      ${statBox('taijutsu', p.offense.taijutsu)}${statBox('ninjutsu', p.offense.ninjutsu)}${statBox('genjutsu', p.offense.genjutsu)}
      ${statBox('physical', p.resistance.physical)}${statBox('mental', p.resistance.mental)}${statBox('speed', p.speed)}
    </div>
    ${passives ? `<div class="passive-row">${passives}</div>` : ''}
    ${roletaRelicBar(p)}
    ${mods.villainStartsFirst || mods.playerStartsFirst ? `<div class="mods"><small>${S.ui.nextFight}</small> ${modChips(mods)}</div>` : ''}
  </section>`;
}

// ---------------------------------------------------------------------------
// Ficha ninja (janela à parte): retrato, atributos, técnicas, bolsa e passivas

const SUMMON_ICONS: Record<SummonAnimal, string> = { toad: 'toad', snake: 'snake', slug: 'slug' };

/** Bolsa ninja agrupada por categoria (só agrupa o que já existe): equipamento, consumíveis, pergaminhos e moedas. */
function bagSlots(p: PlayerState): string {
  const B = S.bag;
  const slot = (ico: string, name: string, desc: string, qty: string) =>
    `<li class="slot slot-${ico}"${tip(name, desc)}><i>${icon(ico)}</i><b>${name}</b>${qty ? `<em>${qty}</em>` : ''}<small>${desc}</small></li>`;
  const gear: string[] = [];
  const consumables: string[] = [];
  const scrolls: string[] = [];
  const coins: string[] = [];
  if (p.ninjaToolLevel > 0) {
    const dmg = p.ninjaToolLevel * data.balance.ninjaTool.baseDamagePerLevel;
    gear.push(slot('blade', B.ninjaTool.name, B.ninjaTool.desc(dmg), `${S.ui.level}${p.ninjaToolLevel}`));
  }
  if (p.trainingWeights !== 'none') gear.push(slot('weights', B.weights.name, B.weights.desc[p.trainingWeights] ?? '', ''));
  if (p.amulets.speed > 0) gear.push(slot('amuletSpeed', B.speedAmulet.name, B.speedAmulet.desc(p.amulets.speed), `×${p.amulets.speed}`));
  if (p.amulets.resistance > 0) {
    const n = p.amulets.resistance;
    gear.push(slot('amuletRes', B.resistanceAmulet.name, B.resistanceAmulet.desc(n), `×${n}`));
  }
  if (p.revives > 0) consumables.push(slot('willOfFire', B.revive.name, B.revive.desc, `×${p.revives}`));
  const icons: Record<ConsumableId, string> = { soldierPill: 'pill', medKit: 'kit', explosiveTag: 'tag', smokeBomb: 'smoke' };
  for (const id of CONSUMABLES) {
    if (p.bag[id] > 0) consumables.push(slot(icons[id], S.consumables[id]!.name, S.consumables[id]!.desc, `×${p.bag[id]}`));
  }
  const nScrolls = Object.values(p.techniqueLevels).reduce((a, b) => a + (b ?? 0), 0);
  if (nScrolls > 0) scrolls.push(slot('scroll', B.scrolls.name, B.scrolls.desc(nScrolls), `×${nScrolls}`));
  if (p.summon) {
    const name = S.summons[p.summon.animal]!.name;
    scrolls.push(slot(SUMMON_ICONS[p.summon.animal], B.summon.name, `${B.summon.desc(name)} ${summonEffect(p)}`, `${S.ui.level}${p.summon.level}`));
  }
  if (p.coins > 0) coins.push(slot('coin', B.coin.name, B.coin.desc, `×${p.coins}`));
  const C = S.ui.bagCategories;
  const groups = [
    { kanji: '装', name: C.gear, items: gear },
    { kanji: '薬', name: C.consumables, items: consumables },
    { kanji: '巻', name: C.scrolls, items: scrolls },
    { kanji: '金', name: C.coins, items: coins },
  ].filter((g) => g.items.length);
  if (!groups.length) return `<ul class="bag"><li class="slot empty"><span>${S.ui.bagEmpty}</span></li></ul>`;
  return groups
    .map((g) => `<div class="bag-group"><h4 class="bag-cat"><span class="kanji" aria-hidden="true">${g.kanji}</span>${g.name}<small>${g.items.length}</small></h4><ul class="bag">${g.items.join('')}</ul></div>`)
    .join('');
}

/** Durante a luta, o jogador "vivo" está no estado da batalha, não na campanha. */
let battlePlayer: (() => PlayerState) | null = null;


/** Atributo com régua: o número e uma barra relativa ao maior atributo de combate do ninja. */
function attrRow(key: keyof typeof S.stats, value: number, top: number): string {
  const pct = top > 0 ? Math.max(6, Math.min(100, (value / top) * 100)) : 0;
  return `<li${tip(S.stats[key], S.tips.stats[key])}><span>${S.stats[key]}</span><b>${value}</b><i style="width:${pct}%"></i></li>`;
}

/** Pedaços da ficha (janela e painéis do mapa no PC): cabeçalho com atributos, relíquias e bolsa, técnicas, passivas. */
function sheetParts(c: Campaign) {
  const p = battlePlayer?.() ?? c.player;
  const crit = critChance(p.critBonus, data.balance.crit);
  const F = S.ui.sheetFields;
  const passives = [
    ...passiveItems(p, 'li'),
    p.summon
      ? `<li><span class="pi-ico">${icon(SUMMON_ICONS[p.summon.animal])}</span><span><b>${S.summons[p.summon.animal]!.name}</b> · ${S.summons[p.summon.animal]!.desc}</span></li>`
      : '',
  ].join('');
  const elements = p.elements;
  const nextFight = c.mods.villainStartsFirst || c.mods.playerStartsFirst;
  const combat = [p.offense.taijutsu, p.offense.ninjutsu, p.offense.genjutsu, p.speed, p.resistance.physical, p.resistance.mental];
  const top = Math.max(...combat);
  const clan = p.origin.lineageId ? S.lineages[p.origin.lineageId] ?? p.origin.lineageId : S.origin.common;
  const head = `
      <header class="sheet-head">
        ${avatar(p, 'lg')}
        <div class="sheet-id">
          <h2 class="sheet-name">${profile.playerName ? esc(profile.playerName) : originLabel(p.origin)}</h2>
          <dl class="sheet-fields">
            <div><dt>${F.clan}</dt><dd>${clan}</dd></div>
            <div><dt>${F.level}</dt><dd><span class="lvl">${p.level}</span></dd></div>
            <div><dt>${F.affinity}</dt><dd class="chips-left">${elements.length ? elements.map((e) => elChip(e)).join('') : `<span class="chip">${S.ui.noAffinity}</span>`}${jinChip(p)}</dd></div>
            <div><dt>${F.difficulty}</dt><dd>${diffChip(c.difficulty)}</dd></div>
          </dl>
        </div>
      </header>
      ${xpBar(p)}
      ${bar('hp', p.hp, p.maxHp)}
      ${bar('ck', p.chakra, p.maxChakra)}`;
  const attrs = `
      <ul class="attr-list">
        ${attrRow('taijutsu', p.offense.taijutsu, top)}${attrRow('ninjutsu', p.offense.ninjutsu, top)}${attrRow('genjutsu', p.offense.genjutsu, top)}
        ${attrRow('speed', p.speed, top)}${attrRow('physical', p.resistance.physical, top)}${attrRow('mental', p.resistance.mental, top)}
      </ul>
      <div class="attrs">${statBox('crit', S.ui.critTier(crit))}${statBox('hp', p.maxHp)}${statBox('chakra', p.maxChakra)}</div>`;
  const relics = (p.relics ?? []).length ? `<h3 class="sheet-title">${S.roleta.run.relicsTitle}</h3>${roletaRelicBar(p)}` : '';
  const bag = `<h3 class="sheet-title">${S.ui.bag}</h3>${bagSlots(p)}`;
  const techs = `<ul class="techs">${techniqueRows(p)}</ul>`;
  const extra = `${passives ? `<h3 class="sheet-title">${S.ui.passives}</h3><ul class="sheet-passives">${passives}</ul>` : ''}${nextFight ? `<h3 class="sheet-title">${S.ui.nextFight}</h3><div class="mods">${modChips(c.mods)}</div>` : ''}`;
  return { p, head, attrs, relics, bag, techs, extra };
}

function sheetHtml(c: Campaign): string {
  const { p, head, attrs, relics, bag, techs, extra } = sheetParts(c);
  return `
    <div class="scroll-paper">
      <span class="hanko" aria-hidden="true">${clanSymbol(p.origin.lineageId)}</span>
      <p class="sheet-kicker"><span class="kanji" aria-hidden="true">忍</span>${S.ui.sheetFields.kicker}</p>
      ${head}
      <h3 class="sheet-title">${S.ui.attributes}</h3>
      ${attrs}
      ${relics}
      ${bag}
      <h3 class="sheet-title">${S.ui.techniques}</h3>
      ${techs}
      <p class="tip-hint">${icon('info')} ${S.tips.hint}</p>
      ${extra}
    </div>`;
}

/** A ficha aberta no mapa do PC: painéis minimizáveis como os da Jornada (a escolha fica salva no navegador). */
function sheetPanels(c: Campaign): string {
  const { head, attrs, relics, bag, techs, extra } = sheetParts(c);
  const panel = (key: string, title: string, body: string) =>
    `<section class="card rsheet-panel"${foldAttrs(key)}>${foldButton(key)}<h3>${title}</h3><div class="rsheet-body">${body}</div></section>`;
  return [
    panel('r-sheet', S.ui.sheet, `${head}${attrs}`),
    panel('r-bag', `${S.roleta.run.relicsTitle} · ${S.ui.bag}`, `${relics}${bag}`),
    panel('r-tech', S.ui.techniques, techs),
    extra ? panel('r-pass', S.ui.passives, extra) : '',
  ].join('');
}

/** Abre a ficha como uma janela à parte, sobre qualquer tela (inclusive no meio da luta). */
function openSheet() {
  if (document.querySelector('.sheet-wrap')) return;
  if (jornadaSheet) return jornadaSheet();
  if (!camp) return;
  const overlay = h(`<div class="sheet-wrap" role="dialog" aria-label="${S.ui.sheet}">
    <div class="scroll">
      <div class="rod"></div>
      ${sheetHtml(camp)}
      <div class="rod"></div>
      <button class="btn primary sheet-close" data-close>${S.ui.close}</button>
    </div></div>`);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('[data-close]')) overlay.remove();
  });
  document.body.appendChild(overlay);
}

/**
 * Trilha do ciclo: cada etapa tem duas linhas, o **Evento** pré-luta e o **Confronto** (categoria e vilão). Etapa vencida
 * expande e mostra o evento e o que ela deu (registro em `camp.log`).
 */
function stageTrail(run: RRun, log: Record<string, StepLog> = camp?.log ?? {}): string {
  const RR = S.roleta.run;
  const done = run.status === 'victory' ? rdata.cycle.length : run.step;
  return `<ol class="trail rtrail">${rdata.cycle
    .map((cat, i) => {
      const state = i < done ? 'done' : i === done ? 'current' : 'todo';
      const id = i < done ? run.used[i] : i === done ? run.villainId : null;
      const entry = log[stepKey(run.cycle, i)];
      const faces = id ? `<span class="trail-faces">${foePortrait(id, 'sm')}</span>` : `<span class="trail-ico">${icon(cat === 'boss' ? 'intent' : 'swords')}</span>`;
      const tier = rewardTierFor(cat, run.cycle, rdata);
      const sub = cat === 'boss' ? RR.chestTitle : S.ui.rewardTier(S.rewardTiers[tier] ?? '');
      const ev = `<div class="rrow ev"><span class="rrow-ico">${icon('dice')}</span><div><small class="rtag">${RR.eventRow}</small><span>${entry?.event ?? RR.eventPending}</span></div></div>`;
      const fight = `<div class="rrow fight"><i><span>${i < done ? icon('check') : i + 1}</span></i>${faces}<div><small class="rtag">${RR.fightRow}</small><b><span class="rcat"${categoryTip(cat, run.cycle)}>${RR.categories[cat]}</span>${id ? ` · ${villainName(id)}` : ''}</b><small>${sub}</small></div></div>`;
      if (state === 'done' && entry) {
        const items = entry.items.length ? entry.items.map((t) => `<li>${t}</li>`).join('') : `<li class="muted">${RR.noRewards}</li>`;
        return `<li class="rstep done"><details><summary>${ev}${fight}<span class="rstep-more" aria-hidden="true">${icon('chevron')}</span></summary>
          <div class="rstep-log"><h4>${RR.rewardsTitle}</h4><ul>${items}</ul></div></details></li>`;
      }
      return `<li class="rstep ${state}">${ev}${fight}</li>`;
    })
    .join('')}</ol>`;
}

function progressDots(current: number) {
  const el = document.getElementById('dots')!;
  el.innerHTML = rdata.cycle.map((_, i) => `<i class="${i < current ? 'done' : i === current ? 'current' : ''}"></i>`).join('');
}

/** Gira uma roleta grande dentro de `slot`: botão "Girar" (ou automático no modo instantâneo). */
async function bigWheel(slot: HTMLElement, title: string, slices: WheelSlice[], index: number): Promise<void> {
  const wheel = createWheel(slices);
  const box = h(`<div class="wheel-box"><h3>${title}</h3></div>`);
  box.appendChild(wheel.el);
  slot.replaceChildren(box);
  if (!settings.instant) {
    const btn = h(`<button class="btn primary spin" data-choice="spin">${S.ui.spin}</button>`);
    box.insertBefore(btn, wheel.el.nextSibling);
    await choose(box);
    btn.remove();
  }
  await wheel.spinTo(index, pace.wheel());
  // Carimbo do resultado por cima da roda; não muda o tempo do giro e não bloqueia o toque.
  if (!settings.instant) {
    const stamp = document.createElement('span');
    stamp.className = 'wheel-stamp';
    stamp.setAttribute('aria-hidden', 'true');
    stamp.textContent = slices[index]!.label;
    wheel.el.querySelector('.wheel-wrap')!.appendChild(stamp);
  }
}

/**
 * Gira uma roleta fora do combate. Com Moeda viciada, o jogador pode girar de novo, uma vez.
 * `roll` sorteia de novo a cada chamada.
 */
async function spinRoll<T extends string>(
  slot: HTMLElement,
  title: string,
  roll: () => Roll<T>,
  label: (id: T) => string,
): Promise<Roll<T>> {
  const c = camp!;
  let r = roll();
  await bigWheel(slot, title, rollSlices(r, label), r.index);
  if (c.player.coins > 0) {
    const box = h(`<div><p class="center"><b>${esc(label(r.value))}</b></p><div class="actions-row">
      <button class="btn" data-choice="reroll">${icon('coin')} ${S.ui.coinReroll(c.player.coins)}</button>
      <button class="btn primary" data-choice="keep">${S.ui.keepResult}</button></div></div>`);
    slot.appendChild(box);
    const choice = await choose<'reroll' | 'keep'>(box);
    box.remove();
    if (choice === 'reroll') {
      c.player = spendCoin(c.player);
      r = roll();
      await bigWheel(slot, title, rollSlices(r, label), r.index);
    }
  }
  return r;
}

/** Item da roleta de itens; os Pesos de treino perguntam se equipa. */
async function itemFlow(slot: HTMLElement): Promise<Step> {
  const c = camp!;
  const item = await spinRoll(slot, S.roulettes.item, () => rollItem(c.player, rng, data), (id) => S.items[id]!);
  const step = applyItem(c.player, item.value, rng, data);
  if (step.effect.kind !== 'trainingWeights') return step;
  const box = h(`<div class="result-card"><p>${S.ui.weightsAsk}</p><div class="actions-row">
    <button class="btn" data-choice="keep">${S.ui.weightsKeep}</button>
    <button class="btn primary" data-choice="equip">${S.ui.weightsEquip}</button></div></div>`);
  slot.appendChild(box);
  const choice = await choose<'keep' | 'equip'>(box);
  box.remove();
  return choice === 'equip' ? { ...step, player: equipTrainingWeights(step.player, data) } : step;
}

function rollSlices<T extends string>(roll: Roll<T>, label: (id: T) => string, color?: (id: T, i: number) => string) {
  return roll.slices.map((s, i) => ({
    label: label(s.value),
    weight: s.weight,
    color: color ? color(s.value, i) : PALETTE[i % PALETTE.length]!,
  }));
}

// ---------------------------------------------------------------------------
// Tela: origem

/** Cores da roleta de quantidade de elementos (0 a 3). */
const COUNT_COLORS = ['#5d6168', '#3f5f9e', '#7d4d8f', '#b8892f'];

/**
 * Chip da natureza (src/core/nature.ts): a Kekkei Genkai, que é uma natureza só, ou o elemento. Quem não usa ninjutsu
 * elemental tem a natureza "silenciosa": o chip mostra, com a dica de que ela não dá técnica.
 */
function elementChips(elements: Element[], kg: string | null = null, silent = false): string {
  const k = kg ? S.kekkeiGenkai[kg] : null;
  if (k) return `<span class="chip kg-chip"${tip(k.name, k.desc)}>${icon('sparkle')} ${k.name}</span>`;
  if (!elements.length) return `<span class="chip"${tip(S.ui.noAffinity, S.tips.noElement)}>${S.ui.noAffinity}</span>`;
  if (silent) return elements.map((e) => `<span class="chip el silent" style="--c:${ELEMENT_COLORS[e]}"${tip(S.elements[e], S.tips.silentNature)}>${icon(ELEMENT_ICON[e])} ${S.elements[e]}</span>`).join('');
  return elements.map((e) => elChip(e)).join('');
}

/** A natureza do jogador é silenciosa (origem sem ninjutsu elemental). */
const silentNature = (p: PlayerState) => !hasElementalNinjutsu(lineageOf(p.origin.lineageId, data));

function originStepSlices(step: OriginStep): WheelSlice[] {
  const L = S.sliceLabels;
  return step.slices.map((s) => {
    switch (step.kind) {
      case 'jinchuuriki':
        return {
          label: L[s.value]!,
          weight: s.weight,
          color: s.value === 'yes' ? '#c4501f' : TIER_COLORS.common,
          icon: s.value === 'yes' ? clanSymbol('jinchuuriki') : undefined,
        };
      case 'element': {
        const el = s.value as Element;
        return { label: S.elements[el], weight: s.weight, color: ELEMENT_COLORS[el], icon: icon(ELEMENT_ICON[el]) };
      }
      case 'kekkeiGenkai':
        return { label: S.kekkeiGenkai[s.value]?.name ?? s.value, weight: s.weight, color: s.value === 'none' ? TIER_COLORS.common : TIER_COLORS.legendary };
      case 'elementCount': {
        const n = Number(s.value);
        // Roleta de proficiência do Comum: sem proficiência vira o Prodígio; com, uma natureza (v0.59.0).
        return { label: n === 0 ? S.sliceLabels.prodigy! : S.sliceLabels.proficient!, weight: s.weight, color: COUNT_COLORS[n] ?? TIER_COLORS.common };
      }
      case 'lineage': {
        // A cor da fatia indica o nível: comum, clã ou rara.
        const tier = lineageOf(s.value, data).tier;
        return { label: S.lineages[s.value] ?? s.value, weight: s.weight, color: TIER_COLORS[tier], icon: clanSymbol(s.value) };
      }
    }
  });
}

function stepResultText(step: OriginStep): string {
  const v = step.slices[step.index]!.value;
  switch (step.kind) {
    case 'lineage': {
      const tier = lineageOf(v, data).tier;
      return `${clanSymbol(v)}${S.lineages[v] ?? v}${tier === 'common' ? '' : ` · ${S.lineageTiers[tier]}`}`;
    }
    case 'element':
      return `${icon(ELEMENT_ICON[v as Element])}${S.elements[v as Element]}`;
    case 'elementCount':
      return Number(v) === 0 ? `${clanSymbol('taijutsuProdigy')}${S.origin.noElementProdigy}` : S.origin.proficient;
    case 'kekkeiGenkai':
      return v === 'none' ? `${S.roulettes.kekkeiGenkai} ${S.kekkeiGenkai.none!.name}` : `${icon('sparkle')}${S.kekkeiGenkai[v]?.name ?? v}`;
    case 'jinchuuriki':
      return v === 'yes' ? `${clanSymbol('jinchuuriki')}${S.origin.jinchuuriki}` : `${S.origin.jinchuuriki}: ${S.sliceLabels.no}`;
  }
}

async function originScreen(): Promise<void> {
  progressDots(-1);
  for (;;) {
    const seed = nextRunSeed();
    const roll = rollOrigin(rng, data);
    const runId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    // Hardcore bloqueado (ainda não venceu no Difícil): cai para a dificuldade padrão.
    const hardcoreOk = hardcoreUnlocked();
    if (settings.difficulty === 'hardcore' && !hardcoreOk) settings.difficulty = DEFAULT_DIFFICULTY;
    let player = createRoletaPlayer(roll.origin, rdata, settings.difficulty);
    camp = {
      runId,
      origin: roll.origin,
      player,
      difficulty: settings.difficulty,
      run: newRoletaRun(player, settings.difficulty),
      mods: { ...NO_MODS },
      seed,
      trail: [],
      log: {},
      stats: emptyRunStats(),
    };
    campLive = true;
    // A Ficha da barra só aparece depois das roletas: antes, entregaria a classe sorteada.
    document.body.classList.remove('has-sheet');

    const root = show(
      h(`<div class="screen rwheel rorigin"><h2>${S.ui.title}</h2><div class="chips-line" id="origin-chips"></div>
        <div class="rstage-box">${rstage('roleta', 'konoha')}<div id="slot"></div></div>
        <div class="rside"><div id="ohud"></div><div id="after"></div></div></div>`),
    );
    const chips = root.querySelector<HTMLElement>('#origin-chips')!;
    const slot = root.querySelector<HTMLElement>('#slot')!;
    for (const step of roll.steps) {
      await bigWheel(slot, S.roulettes[step.kind], originStepSlices(step), step.index);
      chips.insertAdjacentHTML('beforeend', `<span class="chip origin-chip pop">${stepResultText(step)}</span>`);
      await sleep(settings.instant ? 0 : 500);
    }
    syncSheetBtn();
    root.classList.add('rolled');
    // A ficha vai para a coluna da direita; no PC a última roleta fica no palco (no celular o CSS a esconde).
    const ohud = root.querySelector<HTMLElement>('#ohud')!;
    ohud.innerHTML = playerPanel(player);
    slot.classList.add('done');
    const after = root.querySelector<HTMLElement>('#after')!;
    after.innerHTML = `<div class="difficulty-box">
      <h3>${S.ui.difficulty}</h3>
      <div class="segmented">${DIFFICULTIES.map(
        (d) => `<button class="btn seg diff-${d}" data-diff="${d}" aria-pressed="${d === settings.difficulty}" ${d === 'hardcore' && !hardcoreOk ? 'disabled' : ''}>${d === 'hardcore' && !hardcoreOk ? `${icon('lock')} ` : ''}${S.difficulty[d].name}</button>`,
      ).join('')}</div>
      <p class="muted center small" id="diff-desc">${S.difficulty[settings.difficulty].desc}</p>
      ${hardcoreOk ? '' : `<p class="muted center small">${icon('lock')} ${S.ui.hardcoreLocked}</p>`}
    </div>
    <div class="actions-row">
      <button class="btn" data-choice="reroll">${icon('dice')} ${S.ui.reroll}</button>
      <button class="btn primary" data-choice="start">${S.ui.startCampaign}</button></div>`;
    // A dificuldade só pode mudar antes de começar a campanha.
    after.querySelector('.segmented')!.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-diff]');
      if (!btn || !camp || (btn as HTMLButtonElement).disabled) return;
      const d = btn.dataset.diff as Difficulty;
      settings.difficulty = d;
      camp.difficulty = d;
      player = withDifficulty(player, d, data);
      camp.player = player;
      camp.run = newRoletaRun(player, d);
      saveSettings();
      after.querySelectorAll('[data-diff]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      after.querySelector('#diff-desc')!.textContent = S.difficulty[d].desc;
      ohud.innerHTML = playerPanel(player);
    });
    const choice = await choose<'reroll' | 'start'>(after);
    if (choice === 'start') {
      // A run só entra no histórico quando começa: re-rolar ou sair durante o sorteio não deixa registro.
      startRun(storage, { id: runId, origin: roll.origin, now: new Date(), ...(seed !== null ? { seed } : {}) }, data.balance.history.maxRuns);
      track({ difficulty: camp.difficulty });
      checkAchievements('inProgress', null);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Roleta no PC (docs/visual.md, "Roleta no PC"): palco com arte atrás das roletas e arte da categoria no mapa e na
// luta. Sem imagem na vaga, o cenário desenhado da categoria (nunca um aviso de imagem faltando). No celular, some.

const CATEGORY_SCENE: Record<string, string> = { genin: 'konoha', chunin: 'arena', jounin: 'forest', boss: 'valleyEnd' };

/** Categoria da luta atual (ou a primeira, antes da run). */
const roletaCategory = (): string => (camp ? currentCategory(getRun(), rdata) : 'genin');

/**
 * Dica da categoria (mapa e trilha): a recompensa, a escala do ciclo e os vilões dela. Os que estão no Livro Bingo
 * aparecem com retrato e nome; os ainda não encontrados ficam como incógnita.
 */
function categoryTip(cat: string, cycle: number): string {
  const RR = S.roleta.run;
  const ids = rdata.categories[cat as keyof typeof rdata.categories] ?? [];
  const known = ids.filter((id) => (profile.villains[id]?.faced ?? 0) > 0);
  const tier = rewardTierFor(cat as RCategory, cycle, rdata);
  const reward = cat === 'boss' ? RR.chestTitle : S.ui.rewardTier(S.rewardTiers[tier] ?? '');
  const faces = ids
    .map((id) => (known.includes(id) ? `<span class="ctip-v">${foePortrait(id, 'sm')}<small>${villainName(id)}</small></span>` : `<span class="ctip-v unknown"><span class="ctip-q">?</span><small>${RR.catUnknown}</small></span>`))
    .join('');
  return tip(RR.categories[cat] ?? cat, `<p class="ctip-sum">${RR.catTipBody(reward)} ${RR.catKnown(known.length, ids.length)}</p><div class="ctip-grid">${faces}</div>`);
}

/** Arte de uma vaga do Roleta num contêiner `cls`; sem imagem, o cenário desenhado `scene`. */
function roletaArt(key: string, scene: string, cls: string, inner = ''): string {
  const art = sceneMedia(key);
  return `<div class="${cls}${art ? '' : ` jscene scene-${scene}`}" aria-hidden="true">${art ?? ''}${inner}</div>`;
}

/** Palco das roletas: a arte (da entrada ou da categoria) atrás do `#slot`. */
function rstage(key = `roleta-${roletaCategory()}`, scene = CATEGORY_SCENE[roletaCategory()] ?? 'konoha'): string {
  return roletaArt(key, scene, 'rstage');
}

// ---------------------------------------------------------------------------
// Tela: mapa da campanha

/** Mapa do ciclo. `eventDone`: o evento pré-luta desta etapa já aconteceu (o botão vira Lutar). */
async function mapScreen(eventDone: boolean): Promise<'event' | 'fight' | 'abandon'> {
  const c = camp!;
  const run = getRun();
  const RR = S.roleta.run;
  progressDots(run.step);
  const id = run.villainId!;
  const cat = currentCategory(run, rdata);
  logStep = run.step;
  const pct = Math.round((cycleMult(run, rdata) - 1) * 100);
  const cycleChip = run.cycle > 0 ? ` <span class="chip jcycle"${tip(RR.cycle(run.cycle + 1), RR.cycleTip(pct))}>${icon('cycle')} ${RR.cycle(run.cycle + 1)}</span>` : '';
  const root = show(
    h(`<div class="screen rmap">
      <h2>${RR.title} ${run.cycle + 1}${cycleChip}</h2>
      <div class="rmap-trail">${stageTrail(run)}
        <div class="rmap-scene">${roletaArt(`roleta-${cat}`, CATEGORY_SCENE[cat] ?? 'konoha', 'rmap-art')}
          <div class="rmap-foe"><span class="rmap-cap"${categoryTip(cat, run.cycle)}><span class="seal">${cat === 'boss' ? '将' : '戦'}</span>${RR.categories[cat]}</span><div class="foes">${villainCard(id, villainFor(run, villainsById, rdata))}</div></div>
        </div>
      </div>
      <div class="rmap-me">
      <div class="rmap-sheet">${sheetPanels(c)}</div>
      ${playerPanel(c.player, c.mods)}
      <p class="muted small center">${S.ui.carryHint}</p>
      ${c.player.trainingWeights === 'equipped' ? `<button class="btn" data-choice="weights">${icon('weights')} ${S.ui.weightsRemove}</button>` : ''}
      ${c.player.trainingWeights === 'stored' ? `<button class="btn" data-choice="weights">${icon('weights')} ${S.ui.weightsEquip}</button>` : ''}
      </div>
      <div class="sticky-cta">${
        eventDone
          ? `<button class="btn primary big" data-choice="fight">${icon('swords')} ${RR.go(villainName(id))}</button>`
          : `<button class="btn primary big" data-choice="event">${icon('dice')} ${RR.toEvent}</button>`
      }<button class="btn small jgiveup rabandon" data-choice="abandon">${icon('warning')} ${RR.abandon}</button></div>
    </div>`),
  );
  for (;;) {
    const pick = await choose<'event' | 'fight' | 'weights' | 'abandon'>(root);
    // Os pesos só são equipados ou tirados fora de combate.
    if (pick === 'weights') {
      c.player =
        c.player.trainingWeights === 'stored' ? equipTrainingWeights(c.player, data) : removeTrainingWeights(c.player, data);
      return mapScreen(eventDone);
    }
    if (pick === 'abandon' && !window.confirm(RR.abandonConfirm)) continue;
    return pick;
  }
}

// ---------------------------------------------------------------------------
// Tela: evento pré-vilão

/** Evento pré-luta; no fim, Voltar ao mapa ou Lutar. */
async function eventScreen(name: string): Promise<'back' | 'fight'> {
  const c = camp!;
  const root = show(
    h(`<div class="screen rwheel">
      <h2>${S.ui.towards(name)}</h2>
      <div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="detail"></div><div id="hud"></div><div id="cta"></div></div>
    </div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const detail = root.querySelector<HTMLElement>('#detail')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  const refreshHud = (pulse = false) => {
    hud.innerHTML = playerPanel(c.player, c.mods);
    if (pulse) hud.firstElementChild?.classList.add('pulse');
  };
  refreshHud();

  const roll = await spinRoll(slot, S.roulettes.event, () => rollWeighted(data.preFightEvents, rng), (id) => S.events[id]!.name);
  const ev = S.events[roll.value]!;
  const slog = stepLog();
  if (slog) slog.event = ev.name;
  detail.innerHTML = `<div class="result-card"><h3>${ev.name}</h3><p>${ev.desc}</p></div>`;
  await sleep(settings.instant ? 0 : 400);

  let step: Step;
  switch (roll.value) {
    case 'oldLady':
    case 'ramen':
      step = applySimpleEvent(c.player, roll.value);
      break;
    case 'training': {
      // XP garantido e o destaque de status (o foco elemental saiu no Roleta enxuto).
      const focus: Element[] = [];
      let pick = 'highlight';
      if (focus.length > 0) {
        const box = h(`<div class="wheel-box"><h3>${S.ui.trainingChoice}</h3><div class="act-grid">
          <button class="btn" data-choice="highlight">${S.ui.trainingHighlight}</button>
          ${focus.map((el) => `<button class="btn" data-choice="${el}">${icon(ELEMENT_ICON[el])} ${S.ui.trainingFocus(S.elements[el])}</button>`).join('')}
        </div></div>`);
        slot.replaceChildren(box);
        pick = await choose<string>(box);
      }
      if (pick !== 'highlight') {
        step = applyTrainingFocus(c.player, pick as Element, data);
        break;
      }
      // A roleta escolhe o status em destaque (pesos = os próprios status).
      const out = rollTraining(c.player, rng, data);
      await bigWheel(slot, S.roulettes.training, rollSlices(out, (id) => S.trainingStats[id] ?? id), out.index);
      step = applyTraining(c.player, out.value, data);
      break;
    }
    case 'jokenpo':
      step = await jokenpoFlow(slot);
      break;
    case 'foundItem':
      step = await itemFlow(slot);
      break;
    case 'summon':
      step = await summonFlow(slot);
      break;
    case 'akatsuki': {
      const out = rollAkatsuki(c.player, rng, data);
      await bigWheel(slot, S.roulettes.akatsuki, rollSlices(out, (id) => S.akatsuki[id]!), out.index);
      step = applyAkatsuki(c.player, out.value, data);
      break;
    }
    case 'guru': {
      const out = rollGuru(c.player, rng, data);
      await bigWheel(slot, S.roulettes.guru, rollSlices(out, (id) => S.guru[id]!), out.index);
      if (out.value === 'charlatan') {
        step = applyGuru(c.player, out.value, null, data);
        break;
      }
      // Premium: o guru gira a roleta do perfil algumas vezes (sem repetir) e o jogador escolhe 1.
      const choices = rollPremiumChoices(c.player, rng, data);
      for (let i = 0; i < choices.length; i++) {
        const r = choices[i]!;
        await sleep(settings.instant ? 0 : 300);
        await bigWheel(slot, `${S.roulettes.premium} · ${S.ui.spinOf(i + 1, choices.length)}`, rollSlices(r, (id) => S.premiums[id] ?? id), r.index);
      }
      let premium = choices[0]!.value;
      if (choices.length > 1) {
        await sleep(settings.instant ? 0 : 300);
        const box = h(`<div class="wheel-box"><h3>${S.ui.choosePremium}</h3><div class="act-grid">${choices
          .map((r, i) => `<button class="btn" data-choice="${i}">${S.premiums[r.value] ?? r.value}</button>`)
          .join('')}</div></div>`);
        slot.replaceChildren(box);
        premium = choices[Number(await choose(box))]!.value;
      }
      step = applyPremium(c.player, premium, data);
      break;
    }
    case 'clanLesson':
      step = applyClanLesson(c.player, data);
      break;
  }
  applyStep(step);
  c.stats = addEffect(addPreEvent(c.stats, roll.value), step.effect);
  if ('result' in step) c.stats = addJokenpo(c.stats, (step as { result: 'win' | 'draw' | 'loss' }).result);
  checkAchievements('inProgress', null);
  showEffect(detail, step.effect);
  refreshHud(true);
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn" data-choice="back">${S.roleta.run.backToMap}</button><button class="btn primary big" data-choice="go">${icon('swords')} ${S.ui.fight}</button></div>`;
  const next = await choose<'back' | 'go'>(cta);
  await levelUps();
  return next === 'go' ? 'fight' : 'back';
}

async function jokenpoFlow(slot: HTMLElement): Promise<Step> {
  const c = camp!;
  const box = h(`<div class="wheel-box"><h3>${S.roulettes.jokenpo}</h3><p class="muted center">${S.ui.chooseHand}</p>
    <div class="hands">${HANDS.map((hand) => `<button class="btn hand" data-choice="${hand}">${icon(hand)}<small>${S.hands[hand]}</small></button>`).join('')}</div>
    <div class="duel"></div></div>`);
  slot.replaceChildren(box);
  const choice = await choose<Hand>(box);
  box.querySelectorAll('button').forEach((b) => (b.disabled = true));
  box.querySelector(`[data-choice="${choice}"]`)!.classList.add('picked');
  const result = playJokenpo(c.player, choice, rng, data);
  const duel = box.querySelector<HTMLElement>('.duel')!;
  // Suspense: o companheiro "embaralha" as mãos antes de revelar.
  const shuffles = settings.instant ? 0 : 9;
  for (let i = 0; i < shuffles; i++) {
    duel.innerHTML = `<div><small>${S.ui.you}</small><b>${icon(choice)}</b></div><span>vs</span><div><small>${S.ui.companion}</small><b>${icon(HANDS[i % 3]!)}</b></div>`;
    await sleep(90 + i * 15);
  }
  duel.innerHTML = `<div><small>${S.ui.you}</small><b>${icon(choice)}</b></div><span>vs</span><div><small>${S.ui.companion}</small><b>${icon(result.roll.value)}</b></div>`;
  const text = { win: S.ui.jokenpoWin, draw: S.ui.jokenpoDraw, loss: S.ui.jokenpoLoss }[result.result];
  duel.insertAdjacentHTML('afterend', `<p class="center result-${result.result}"><b>${text}</b></p>`);
  return result;
}

/** Encontro com invocações: aprende a invocar (roleta do animal) ou a invocação atual sobe de nível. */
async function summonFlow(slot: HTMLElement): Promise<Step> {
  const c = camp!;
  if (c.player.summon) return applySummonEncounter(c.player, c.player.summon.animal);
  const animal = rollSummonAnimal(rng, data);
  await bigWheel(slot, S.roulettes.summonAnimal, rollSlices(animal, (id) => S.summons[id]!.name), animal.index);
  // Roleta enxuto: a invocação é uma relíquia (o contrato do animal).
  const step = applySummonEncounter(c.player, animal.value);
  const contract = contractFor(animal.value, rdata);
  return contract ? { ...step, player: gainRoletaRelic(step.player, contract, rdata) } : step;
}

// ---------------------------------------------------------------------------
// Tela: combate

interface BattleSetup {
  villainId: string;
  options: Partial<RBattleOptions>;
  label: string;
  exam: boolean;
  /** Ficha do vilão já com a dificuldade e o ciclo (sem ela, só a dificuldade). */
  def?: VillainDef;
}

type VillainDefT = VillainDef;

const PASSIVE_ICONS: Record<string, string> = {
  trickster: 'trickster',
  mirrors: 'mirrors',
  mist: 'mist',
  beast: 'beast',
  curseMark: 'curseMark',
  scalpel: 'scalpel',
  insane: 'snake',
};

/** Passivas do vilão como selos (na versão da dificuldade: a hardcore já vem trocada por scaleVillain). */
function villainPassiveChips(v: VillainDefT): string {
  const out: string[] = [];
  const passive = v.passive;
  if (passive) {
    const key = passive.kind === 'cloak' ? passive.variant : passive.kind;
    const t = S.villainPassives[key]!;
    const hardcore = camp?.difficulty === 'hardcore' && v.hardcorePassive !== undefined;
    out.push(`<span class="chip passive-chip foe"${tip(t.name, hardcore ? t.hardcore : t.desc)}>${icon(PASSIVE_ICONS[key] ?? 'warning')}${t.name}</span>`);
    if (passive.kind === 'cloak' && passive.genjutsuImmune) {
      const g = S.tips.status.genjutsuImmune;
      out.push(`<span class="chip passive-chip"${tip(g.name, g.desc)}>${icon('genjutsuImmune')}${S.ui.genjutsuImmune}</span>`);
    }
  }
  if (v.behavior?.charged) {
    const c = S.tips.status.charging;
    const name = esc(techName(v.behavior.charged));
    out.push(`<span class="chip passive-chip"${tip(`${c.name}: ${name}`, S.tips.charged)}>${icon('warning')}${name}</span>`);
  }
  return out.join('');
}

/** Técnicas do vilão, cada uma com a cor do elemento e a ficha na dica. */
function villainKit(v: VillainDefT, techniques = v.techniques.filter((t) => t.barrier === undefined)): string {
  return techniques
    .map((t) => {
      const el = villainTechElement(v, t);
      const look = techLook(t.healPct !== undefined ? 'medical' : t.type, el);
      const ico = icon(techIconName(t.type, el, { barrier: t.barrier !== undefined, medical: t.healPct !== undefined, blade: Boolean(t.blade) }));
      return `<span class="kit-chip ${look.cls}"${look.style}${villainTechTip(v, t)}>${ico}<span>${esc(techName(t.id))}</span></span>`;
    })
    .join('');
}

/** Selos de atributo do vilão (resistências e speed), com a dica do que cada um faz. */
function villainStats(phys: number, mental: number, speed: number): string {
  const pill = (key: 'physical' | 'mental' | 'speed', ico: string, v: number) => {
    const T = S.tips.stats;
    const desc = T[key];
    return `<span class="stat-pill"${tip(S.stats[key], desc)}>${icon(ico)}<small>${S.stats[key]}</small><b>${v}</b></span>`;
  };
  return `<div class="stat-pills">${pill('physical', 'barrier', phys)}${pill('mental', 'genjutsu', mental)}${pill('speed', 'dodge', speed)}</div>`;
}

/** Ficha do próximo vilão no mapa: retrato, atributos, passivas e técnicas. */
function villainCard(id: string, scaled?: VillainDef): string {
  const v = scaled ?? scaleVillain(villainsById[id]!, camp!.difficulty, data);
  return `<section class="card villain-card">
    <div class="foe-head">${foePortrait(id, 'lg')}
      <div class="foe-id"><b class="name">${villainName(id)}</b>
        <div class="chips-left">${elChip(v.element)}<span class="chip">${S.stats.hp} ${v.hp}</span><span class="chip">${S.stats.chakra} ${v.chakra}</span></div>
        ${villainStats(Math.floor(v.resistance.physical), Math.floor(v.resistance.mental), v.speed)}
      </div></div>
    <div class="passive-row">${villainPassiveChips(v)}</div>
    <div class="kit">${villainKit(v)}</div>
  </section>`;
}

/** HUD do inimigo na luta: placa com o nome, barras que esvaziam na direção do retrato, atributos, kit e efeitos. */
function villainPanel(s: RBattle): string {
  const v = s.villain.def;
  return `<section class="hud foe-hud villain-panel" id="vcard">
    <div class="hud-main">
      <div class="hud-id">
        <div class="hud-plate"><b class="name">${villainName(v.id)}</b></div>
        ${bar('hp', s.villain.hp, s.villain.maxHp)}
        ${bar('ck', s.villain.chakra, v.chakra)}
        <div id="vstats">${villainLiveStats(s)}</div>
      </div>
      <div class="hud-face">${foePortrait(v.id, 'md')}</div>
    </div>
    <div class="hud-extra"><div class="passive-row" id="vpassives">${villainPassiveChips(v)}</div><div class="kit" id="vkit">${villainKit(v, s.villain.techniques)}</div></div>
    <div class="badges" id="vbadges"></div>
  </section>`;
}

/** Atributos do vilão na luta (resistências com manto). */
function villainLiveStats(s: RBattle): string {
  const p = s.villain.def.passive;
  const cloakOn = p?.kind === 'cloak' && (s.villain.cloakTurns > 0 || s.villain.monster);
  const res = (kind: 'physical' | 'mental') => Math.floor(s.villain.def.resistance[kind] * (cloakOn ? p.cloak.resistanceMult : 1));
  return villainStats(res('physical'), res('mental'), s.villain.def.speed);
}

const R = S.roleta;
const EFFECT_ICONS: Record<string, string> = { burn: 'fire', poison: 'poison', stun: 'stun', fear: 'fear' };
const RACTIVE_ICONS: Record<string, string> = {
  effort: 'weights',
  shadow: 'prison',
  expansion: 'expansion',
  mindTransfer: 'mind',
  plague: 'poison',
  beast: 'beast',
  gates: 'gates',
  sharingan: 'sharingan',
  byakugan: 'byakugan',
  seal: 'scroll',
};

function effectChips(effects: RBattle['fx']['effects'], tone: 'good' | 'bad'): Condition[] {
  return effects
    .filter((e) => e.turns > 0)
    .map((e) => ({ icon: EFFECT_ICONS[e.kind] ?? 'warning', label: R.ui.effectOn(R.effects[e.kind]!.name, e.turns), tone, ...R.effects[e.kind]! }));
}

function badgesHtml(s: RBattle, side: 'player' | 'villain'): string {
  const St = S.tips.status;
  const out: Condition[] = [];
  const add = (ico: string, label: string, tone: Condition['tone'], t: { name: string; desc: string }) => out.push({ icon: ico, label, tone, ...t });
  if (side === 'villain') {
    const v = s.villain;
    out.push(...effectChips(v.effects, 'good'));
    if (v.mistTurns > 0) add('mist', S.ui.mistOn(v.mistTurns), 'bad', St.mist);
    if (v.lastStand) add('heartbreak', S.ui.lastStand, 'bad', St.lastStand);
    if (v.monster) add('claw', S.ui.monster, 'bad', St.monster);
    if (v.skipNext === 'seal') add('scroll', R.actives.seal!.name, 'good', R.actives.seal!);
    // Gênio (Nara): vê a próxima ação do vilão.
    if (kitOf(s.player, rdata).passive === 'genius' && v.intent) {
      const what = v.intent.kind === 'rest' ? R.ui.intentRest : techName(v.intent.id);
      add('intent', R.ui.intent(what), '', St.intent);
    }
    return out.map(conditionChip).join('');
  }
  const fx = s.fx;
  out.push(...effectChips(fx.effects, 'bad'));
  if (fx.buff?.kind === 'gates') {
    // Portões: sem contagem de rodadas; o selo mostra a próxima manutenção.
    const a = R.actives.gates!;
    const next = gateUpkeep(fx.gateRounds + 1, rdata.base.balance.gateCosts);
    add('gates', R.ui.gatesOn(a.name, next), 'good', { name: a.name, desc: `${a.desc} ${R.ui.gatesNext(next)}` });
  } else if (fx.buff) {
    const a = R.actives[fx.buff.kind]!;
    add(RACTIVE_ICONS[fx.buff.kind] ?? 'ninjutsu', R.ui.buffOn(a.name, fx.buff.turns), 'good', a);
  }
  if (fx.cloakTurns > 0) add('cloak', R.ui.buffOn(R.passives.jinchuuriki!.name, fx.cloakTurns), 'good', R.passives.jinchuuriki!);
  if (fx.vitalTurns > 0) add('heart', R.ui.buffOn(R.passives.vitalForce!.name, fx.vitalTurns), 'good', R.passives.vitalForce!);
  if (fx.guarding) add('stance', R.ui.guard, 'good', { name: R.ui.guard, desc: R.ui.guardTip });
  if (fx.dodgeNext) add('dodge', S.ui.dodge, 'good', St.dodge);
  if (fx.clone) add('clones', R.ui.cloneOn, 'good', { name: techName('rBunshin'), desc: R.ui.cloneTip(Math.round(rdata.base.balance.clones.blockChance * 100)) });
  if (fx.shield > 0) add('sandArmor', `${fx.shield}`, 'good', R.ui.shieldTip);
  add('willOfFire', `×${s.player.revives}`, '', St.revives);
  return out.map(conditionChip).join('');
}

/** Célula de ação: ícone, nome, valores e a cor do tipo/elemento. A ficha completa fica na dica. */
function actionCell(o: {
  choice: string;
  cls: string;
  style?: string;
  ico: string;
  title: string;
  sub?: string;
  extra: string;
  tip: string;
  enabled?: boolean;
  primary?: boolean;
}): string {
  const off = o.enabled === false ? ' aria-disabled="true"' : '';
  return `<button class="btn act ${o.cls}${o.primary ? ' primary' : ''}"${o.style ?? ''} data-choice="${o.choice}"${off}${o.tip}>
    <span class="act-ico">${o.ico}</span><span class="act-txt"><b>${o.title}</b>${o.sub ? `<span>${o.sub}</span>` : ''}${o.extra ? `<small>${o.extra}</small>` : ''}</span></button>`;
}

const ITEM_ICONS: Record<ConsumableId, string> = { soldierPill: 'pill', medKit: 'kit', explosiveTag: 'tag', smokeBomb: 'smoke' };

/** Custo em chakra da placa; fica vermelho quando o chakra atual não paga. */
const costTag = (s: RBattle, n: number) => `<span class="cost${n > s.player.chakra ? ' short' : ''}">${S.ui.cost(n)}</span>`;

/** Botão de técnica: ícone, nome, dano×golpes, chance de acerto e custo. Efeitos e regras ficam na dica. */
function techButton(s: RBattle, t: RTechniqueDef, enabled: boolean): string {
  const odds = playerAttackOdds(s, t, rdata);
  const dmg = playerHitDamage(s, t, rdata);
  const look = techLook(t.type, t.element ?? null);
  return actionCell({
    choice: `tech:${t.id}`,
    cls: `act-${t.type} ${look.cls}`,
    style: look.style,
    ico: icon(techIconName(t.type, t.element ?? null)),
    title: esc(techName(t.id)),
    // Bunshin: sem dano nem roleta de acerto; mostra o clone e o custo.
    extra: t.clone ? `${R.ui.cloneLine} · ${costTag(s, techCost(s, t, rdata))}` : `${R.ui.techLine(dmg, t.hits ?? 1, Math.round(odds.hit * 100))} · ${costTag(s, techCost(s, t, rdata))}`,
    tip: t.clone ? tip(techName(t.id), R.ui.cloneTip(Math.round(rdata.base.balance.clones.blockChance * 100))) : rTechTip(s.player, t),
    enabled: enabled && canUseTechnique(s, t, rdata) && !(t.clone && s.fx.clone),
  });
}

const actionGroup = (title: string, body: string, compact = false) =>
  `<section class="act-group${compact ? ' compact' : ''}"><h4 class="act-title">${title}</h4>${body}</section>`;

/** Ações em seções: técnicas (com a ativa da linhagem), Defender e Concentrar, e os itens da bolsa. */
function actionGrid(s: RBattle, enabled: boolean): string {
  const p = s.player;
  const techs = playerTechniques(p, rdata).map((t) => techButton(s, t, enabled));
  const restN = Math.min(p.maxChakra - p.chakra, Math.max(1, Math.floor(p.maxChakra * rdata.r.rest.chakraPct)));
  const guard = actionCell({ choice: 'guard', cls: 'act-stance', ico: icon('stance'), title: R.ui.guard, extra: '', tip: tip(R.ui.guard, R.ui.guardTip), enabled });
  const rest = actionCell({ choice: 'rest', cls: 'act-rest', ico: icon('rest'), title: R.ui.rest, extra: `+${restN} ck`, tip: tip(R.ui.rest, R.ui.restTip(restN)), enabled });
  const items = CONSUMABLES.filter((id) => p.bag[id] > 0).map((id) => {
    const it = S.consumables[id]!;
    return actionCell({ choice: `item:${id}`, cls: 'act-item', ico: icon(ITEM_ICONS[id]), title: `${it.name} ×${p.bag[id]}`, extra: '', tip: tip(it.name, it.desc), enabled });
  });
  const grid = (cells: string[]) => `<div class="act-grid">${cells.join('')}</div>`;
  const G = R.ui.actionGroups;
  return [
    actionGroup(G.techniques, `${activeButton(s, enabled)}${grid(techs)}`),
    actionGroup(G.actions, grid([guard, rest]), true),
    items.length ? actionGroup(G.items, grid(items), true) : '',
  ].join('');
}

/** Ativa da linhagem (grátis): botão próprio acima das técnicas, com os usos que sobram. */
function activeButton(s: RBattle, enabled: boolean): string {
  const kind = kitOf(s.player, rdata).active;
  if (!kind || s.fx.activeUses <= 0) return '';
  const a = R.actives[kind]!;
  const ok = enabled && canUseActive(s, rdata);
  if (kind === 'gates') {
    // Portões: abrir (custo da abertura) ou fechar; a dica traz a próxima manutenção.
    const open = s.fx.buff?.kind === 'gates';
    const label = open ? R.ui.gatesCloseLabel(a.name) : R.ui.gatesOpen(a.name, rdata.r.kits.gates.activation);
    const next = gateUpkeep(open ? s.fx.gateRounds + 1 : 1, rdata.base.balance.gateCosts);
    return `<div class="free-row"><button class="btn focus-btn" data-active ${ok ? '' : 'aria-disabled="true"'}${tip(a.name, `${a.desc} ${R.ui.gatesNext(next)}`)}>${icon('gates')}<span>${label}</span></button></div>`;
  }
  return `<div class="free-row"><button class="btn focus-btn" data-active ${ok ? '' : 'aria-disabled="true"'}${tip(a.name, `${a.desc} ${R.ui.activeTip}`)}>${icon(RACTIVE_ICONS[kind] ?? 'ninjutsu')}<span>${R.ui.activeLabel(a.name, s.fx.activeUses)}</span></button></div>`;
}

/** Número/ícone que sobe sobre o HUD. `fx`: corte diagonal (crítico) ou imagem residual (esquiva). */
function floatNumber(card: HTMLElement | null, text: string, cls: string, fx?: 'slash' | 'evade') {
  if (!card) return;
  const f = h(`<div class="float ${cls}">${text}</div>`);
  card.appendChild(f);
  card.classList.remove('shake', 'evade');
  if (cls === 'dmg' || cls === 'crit' || fx) void card.offsetWidth;
  if (cls === 'dmg' || cls === 'crit') card.classList.add('shake');
  if (fx === 'evade') card.classList.add('evade');
  if (fx === 'slash') {
    const cut = h('<i class="slash" aria-hidden="true"></i>');
    card.appendChild(cut);
    setTimeout(() => cut.remove(), 600);
  }
  setTimeout(() => f.remove(), 1100);
}

/** Luta do Roleta. Devolve `null` se o jogador abandonar a run no meio. */
async function battleScreen(setup: BattleSetup, abandonable = false): Promise<RBattle | null> {
  const c = camp!;
  const villain = setup.def ?? scaleVillain(villainsById[setup.villainId]!, c.difficulty, data);
  let state = startRoletaBattle(c.player, villain, setup.options, rdata, rng);
  battlePlayer = () => state.player;

  const root = show(
    h(`<div class="screen battle">
      <div class="battle-head"><span>${icon('swords')} ${setup.label}</span><span id="round">${S.ui.round(0)}</span></div>
      <div id="vslot">${villainPanel(state)}</div>
      <div class="arena">${roletaArt(`roleta-${roletaCategory()}`, CATEGORY_SCENE[roletaCategory()] ?? 'konoha', 'rarena-art')}<span class="arena-mark kanji" aria-hidden="true">戦</span><div id="dice" class="dice"></div></div>
      <ol id="log" class="log" title="${S.ui.logToggle}"></ol>
      <section class="hud ally-hud player-mini" id="pcard">
        <div class="hud-main">
          <div class="hud-face">${avatar(c.player)}</div>
          <div class="hud-id">
            <div class="hud-plate"><b class="name"${lineageTip(c.player)}>${S.ui.you} · ${originLabel(c.origin)}</b><button class="btn small sheet-btn" data-sheet aria-label="${S.ui.sheet}" title="${S.ui.sheet}">${icon('scroll')}</button></div>
            <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(c.player.level)}</span>${elementChips(c.player.elements, c.player.kekkeiGenkai, silentNature(c.player))}${jinChip(c.player)}</div>
            ${bar('hp', state.player.hp, state.player.maxHp)}
            ${bar('ck', state.player.chakra, state.player.maxChakra)}
          </div>
        </div>
        <div class="passive-row">${passiveTraitEntries(c.player).map(passiveChip).join('')}</div>
        <div class="badges" id="pbadges"></div>
      </section>
      <div id="actions" class="actions"></div>
      <div id="overlay"></div>
    </div>`),
  );
  const vcard = () => root.querySelector<HTMLElement>('#vcard');
  const pcard = root.querySelector<HTMLElement>('#pcard')!;
  const dice = root.querySelector<HTMLElement>('#dice')!;
  const logEl = root.querySelector<HTMLElement>('#log')!;
  const actionsEl = root.querySelector<HTMLElement>('#actions')!;
  // PC (docs/visual.md, "Roleta no PC"): layout da luta da Jornada. O campo fica com os dois cards e a arena; a ficha
  // do vilão (atributos, passivas, técnicas) e o registro vão para o painel da esquerda. São os mesmos nós, com os mesmos
  // ids, então as atualizações seguem funcionando. No celular nada se move.
  if (window.matchMedia?.(DESK).matches) {
    root.classList.add('rb-desk');
    const intel = h(`<aside class="rb-intel"><section class="rb-foe"><h3>${S.jornada.battle.foesTitle}</h3></section><section class="rb-log"><h3>${S.jornada.battle.logTitle}</h3></section></aside>`);
    const foe = intel.querySelector<HTMLElement>('.rb-foe')!;
    for (const sel of ['#vstats', '#vpassives', '#vkit']) {
      const el = root.querySelector<HTMLElement>(sel);
      if (el) foe.appendChild(el);
    }
    intel.querySelector('.rb-log')!.appendChild(logEl);
    root.querySelector('.battle-head')!.after(intel);
  }
  // Log curto (3 linhas); tocar abre o histórico da luta.
  logEl.addEventListener('click', () => logEl.classList.toggle('open'));

  /** Linha do log; `ico` (opcional) é um ícone do art.ts antes do texto. */
  const log = (text: string, cls = '', ico?: string) => {
    logEl.insertAdjacentHTML('afterbegin', `<li class="${cls}">${ico ? icon(ico) : ''}${text}</li>`);
    while (logEl.children.length > 30) logEl.lastElementChild!.remove();
  };
  let kitShown = state.villain.techniques;
  const renderBadges = (s: RBattle) => {
    root.querySelector('#vbadges')!.innerHTML = badgesHtml(s, 'villain');
    root.querySelector('#pbadges')!.innerHTML = badgesHtml(s, 'player');
    root.querySelector('#vstats')!.innerHTML = villainLiveStats(s);
    // O vilão pode trocar de técnicas no meio da luta (Shukaku): refaz o kit.
    if (s.villain.techniques !== kitShown) {
      kitShown = s.villain.techniques;
      root.querySelector('#vkit')!.innerHTML = villainKit(s.villain.def, s.villain.techniques);
    }
  };
  const renderActions = (s: RBattle, enabled: boolean) => {
    actionsEl.innerHTML =
      actionGrid(s, enabled) +
      (abandonable ? `<button class="btn small jgiveup rabandon" data-abandon ${enabled ? '' : 'aria-disabled="true"'}>${icon('warning')} ${R.run.abandon}</button>` : '');
  };
  renderBadges(state);
  if (setup.options.villainStartsFirst) log(S.ui.villainFirst, 'sys');
  if (setup.options.playerStartsFirst) log(S.ui.playerFirst, 'sys');
  // A iniciativa sai no começo da luta (uma roleta só).
  await animate(state.log, state);

  while (state.status === 'ongoing') {
    renderActions(state, true);
    const btn = await new Promise<HTMLElement>((resolve) => {
      const onClick = (e: Event) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('[data-choice],[data-active],[data-abandon]');
        if (!b || isOff(b)) return;
        if (b.hasAttribute('data-abandon') && !window.confirm(R.run.abandonConfirm)) return;
        actionsEl.removeEventListener('click', onClick);
        resolve(b);
      };
      actionsEl.addEventListener('click', onClick);
    });
    if (btn.hasAttribute('data-abandon')) {
      battlePlayer = null;
      return null;
    }
    renderActions(state, false);
    let next: RBattle;
    if (btn.hasAttribute('data-active')) next = useActive(state, rdata, rng);
    else next = playRoletaRound(state, btn.dataset.choice as RAction, rdata, rng);
    await animate(next.log.slice(state.log.length), next, state);
    state = next;
    renderBadges(state);
  }

  // Resultado
  battlePlayer = null;
  const overlay = root.querySelector<HTMLElement>('#overlay')!;
  const won = state.status === 'won';
  const msg = won ? S.ui.battleWon : setup.exam ? S.ui.examLost : S.ui.battleLost;
  const xpLine = won ? `<p class="xp-gain pop">${S.ui.xpGained(xpGain(state.player, villainsById[setup.villainId]!.xp, data))}</p>` : '';
  // Sem recuperação parcial: a próxima luta começa com HP e chakra cheios (v0.59.0).
  overlay.innerHTML = `<div class="overlay ${won ? 'win' : 'lose'}"><div><span class="seal stamp end-mark${won ? ' gold' : ''}" aria-hidden="true">${won ? '勝' : '敗'}</span><h2>${msg}</h2>${xpLine}
    <p class="muted">${S.ui.round(state.round)}</p>
    <button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div></div>`;
  mood(won ? 'good' : 'bad');
  await choose(overlay);
  return state;

  /** Anima os eventos novos, mostrando as barras a partir do estado anterior. */
  async function animate(events: REvent[], next: RBattle, prev: RBattle = next) {
    const disp = { php: prev === next ? next.player.hp : prev.player.hp, pck: prev.player.chakra, vhp: prev.villain.hp, vck: prev.villain.chakra };
    const sync = () => {
      setBar(pcard, 'hp', disp.php, next.player.maxHp);
      setBar(pcard, 'ck', disp.pck, next.player.maxChakra);
      const vc = vcard();
      if (vc) {
        setBar(vc, 'hp', disp.vhp, next.villain.maxHp);
        setBar(vc, 'ck', disp.vck, next.villain.def.chakra);
      }
    };
    const who = (side: 'player' | 'villain') => (side === 'player' ? S.log.you : villainName(next.villain.def.id));
    const card = (side: 'player' | 'villain') => (side === 'player' ? pcard : vcard());
    const RL = R.log;
    for (const ev of events) {
      switch (ev.type) {
        case 'round':
          root.querySelector('#round')!.textContent = S.ui.round(ev.round);
          log(`— ${S.ui.round(ev.round)} —`, 'round');
          continue;
        case 'initiative':
          if (!ev.forced) {
            await stripRoulette(
              dice,
              S.roulettes.initiative,
              [
                { label: S.sliceLabels.player!, weight: ev.chance, color: SIDE_COLORS.player },
                { label: villainName(next.villain.def.id), weight: 1 - ev.chance, color: SIDE_COLORS.villain },
              ],
              ev.playerFirst ? 0 : 1,
              pace.strip(),
            );
          }
          log(S.log.initiative(who(ev.playerFirst ? 'player' : 'villain')));
          break;
        case 'attack': {
          const mine = ev.side === 'player';
          // Golpe que não erra (Byakugan) ou fumaça: sem roleta de acerto.
          if (!ev.auto && ev.hitChance > 0) {
            const hs = hitSlices(ev.hitChance, ev.critChance);
            await stripRoulette(
              dice,
              `${S.roulettes.hit} · ${who(ev.side)}`,
              [
                { label: S.sliceLabels.miss!, weight: hs[0]!.weight, color: SIDE_COLORS.miss },
                { label: S.sliceLabels.hit!, weight: hs[1]!.weight, color: mine ? SIDE_COLORS.hit : SIDE_COLORS.foeHit },
                { label: S.sliceLabels.crit!, weight: hs[2]!.weight, color: SIDE_COLORS.crit },
              ],
              ev.outcome === 'miss' ? 0 : ev.outcome === 'hit' ? 1 : 2,
              pace.strip(),
            );
          }
          const tech = techName(ev.techId);
          if (ev.outcome === 'miss') {
            log(RL.attackMiss(who(ev.side), tech), 'muted');
            floatNumber(mine ? vcard() : pcard, S.ui.floats.miss, 'miss', 'evade');
          }
          // O dano vem no evento 'damage' logo depois; ilusão sem dano só registra o acerto.
          else if (!mine && (next.villain.techniques.find((t) => t.id === ev.techId)?.baseDamage ?? 1) <= 0) log(RL.genjutsuHit(who(ev.side), tech), 'theirs');
          lastAttack = { side: ev.side, tech, crit: ev.outcome === 'crit' };
          break;
        }
        case 'damage': {
          const target = ev.side;
          if (target === 'villain') disp.vhp -= ev.amount;
          else disp.php -= ev.amount;
          const crit = ev.crit === true;
          if (ev.source === 'attack' && lastAttack) {
            log(RL.attackHit(who(lastAttack.side), lastAttack.tech, ev.amount, crit), lastAttack.side === 'player' ? 'mine' : 'theirs');
            lastAttack = null;
          } else if (ev.source === 'burn' || ev.source === 'poison') log(RL.tick[ev.source]!(who(target), ev.amount), target === 'villain' ? 'good' : 'bad', EFFECT_ICONS[ev.source]);
          else if (ev.source === 'toad') log(RL.toad(ev.amount), 'good', 'toad');
          else if (ev.source === 'dog') log(RL.dog(ev.amount), 'good', 'beast');
          else if (ev.source === 'tag') log(RL.tag(ev.amount), 'good', 'tag');
          else if (ev.source === 'self') log(RL.selfHit(who(target), ev.amount), 'good', 'mind');
          if (crit) floatNumber(card(target), `−${ev.amount}<small>${S.ui.floats.crit}</small>`, 'crit', 'slash');
          else floatNumber(card(target), `−${ev.amount}`, 'dmg');
          break;
        }
        case 'shield':
          // Escudo de areia: o do jogador é bom para ele; o do vilão (Gaara), ruim.
          log(ev.side === 'villain' ? RL.shieldFoe(ev.absorbed) : RL.shield(ev.absorbed), ev.side === 'villain' ? 'bad' : 'good', 'sandArmor');
          break;
        case 'heal':
          if (ev.side === 'villain') disp.vhp += ev.amount;
          else disp.php += ev.amount;
          floatNumber(card(ev.side), `+${ev.amount}`, 'heal');
          log(RL.heal(who(ev.side), ev.amount), ev.side === 'player' ? 'good' : 'bad');
          break;
        case 'effect':
          log(RL.effect[ev.kind]!(who(ev.side)), ev.side === 'villain' ? 'good' : 'bad', EFFECT_ICONS[ev.kind]);
          break;
        case 'skip':
          log(RL.skip[ev.reason]!(who(ev.side)), 'sys', ev.reason === 'stun' ? 'stun' : ev.reason === 'seal' ? 'scroll' : 'mind');
          break;
        case 'dodge':
          floatNumber(pcard, icon('dodge'), 'miss', 'evade');
          log(RL.dodge, 'good');
          break;
        case 'gates':
          if (ev.action === 'upkeep') log(RL.gatesUpkeep(ev.cost), 'muted', 'gates');
          else log(ev.reason === 'chakra' ? RL.gatesExhausted : RL.gatesClose, 'muted', 'gates');
          break;
        case 'clone':
          // Bunshin: o clone aparece, ou recebe o golpe e some.
          if (ev.action === 'block') floatNumber(pcard, icon('clones'), 'miss', 'evade');
          log(ev.action === 'block' ? RL.cloneBlock : RL.cloneCreate, 'good', 'clones');
          break;
        case 'rest':
          if (ev.side === 'player') disp.pck += ev.amount;
          else disp.vck += ev.amount;
          log(RL.rest(who(ev.side), ev.amount), 'sys');
          break;
        case 'chakra':
          // Só a barra muda: sem pausa, para não atrasar a roleta que vem depois.
          if (ev.side === 'player') disp.pck = ev.value;
          else disp.vck = ev.value;
          sync();
          continue;
        case 'guard':
          log(RL.guard, 'good', 'stance');
          break;
        case 'item':
          log(RL.item[ev.id]!, 'good', ITEM_ICONS[ev.id]);
          break;
        case 'active': {
          const kind = kitOf(next.player, rdata).active;
          const name = R.actives[ev.kind]?.name ?? ev.kind;
          if (kind) floatNumber(pcard, icon(RACTIVE_ICONS[ev.kind] ?? 'ninjutsu'), 'ck');
          log(RL.active(name, ev.success), ev.success ? 'good' : 'muted', RACTIVE_ICONS[ev.kind]);
          break;
        }
        case 'passive':
          log(RL.passive[ev.kind] ?? ev.kind, ev.side === 'player' ? 'good' : 'bad');
          break;
        case 'revive':
          if (ev.side === 'player') {
            disp.php = next.player.maxHp;
            disp.pck = next.player.maxChakra;
            log(RL.revive, 'good', 'willOfFire');
          } else log(RL.villainRevive, 'bad', 'snake');
          break;
        case 'end':
          log(ev.status === 'won' ? S.log.won : S.log.lost, ev.status === 'won' ? 'good' : 'bad');
          break;
      }
      sync();
      await sleep(pace.beat());
    }
    disp.php = next.player.hp;
    disp.pck = next.player.chakra;
    disp.vhp = next.villain.hp;
    disp.vck = next.villain.chakra;
    sync();
  }
}

/** Último ataque animado: o dano chega no evento seguinte e o log junta os dois. */
let lastAttack: { side: 'player' | 'villain'; tech: string; crit: boolean } | null = null;


// ---------------------------------------------------------------------------
// Tela: recompensa

/**
 * Mostra uma tela por nível completado (XP de vilões, roletas e pergaminhos) e resolve os upgrades
 * à escolha pendentes (marcos, pergaminho, recompensa). O XP de um upgrade sem alvo pode subir de nível.
 */
async function levelUps(): Promise<void> {
  while (camp && (canLevelUp(camp.player, data) || camp.player.pendingUpgrades > 0)) {
    if (canLevelUp(camp.player, data)) await levelUpScreen();
    else await upgradeScreen();
  }
}

/** Gasta um upgrade pendente: o jogador escolhe a técnica (sem alvo, vira XP). */
async function upgradeScreen(): Promise<void> {
  const c = camp!;
  const root = show(
    h(`<div class="screen rwheel"><h2>${S.ui.upgradeTitle}</h2><div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="results"></div><div id="hud"></div><div id="cta"></div></div></div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods);
  const options = upgradeOptions(c.player, data);
  let step: Step;
  if (options.length === 0) {
    slot.innerHTML = `<p class="center muted">${S.ui.upgradeNone}</p>`;
    step = forfeitUpgrade(c.player, data);
  } else {
    const label = (id: string) => {
      const after = upgradeTechnique(c.player, id, data);
      const to = after.techniques.find((t) => !c.player.techniques.includes(t)) ?? id;
      return S.ui.upgradeTo(esc(techName(id)), esc(techName(to)), roman(techniqueLevel(after, to, data)));
    };
    slot.innerHTML = `<div class="wheel-box"><p class="center">${S.ui.upgradeChoose(c.player.pendingUpgrades)}</p>
      <div class="act-grid">${options.map((id) => `<button class="btn" data-choice="${id}">${label(id)}</button>`).join('')}</div></div>`;
    step = chooseUpgrade(c.player, await choose<string>(slot), data);
    slot.innerHTML = '';
  }
  applyStep(step);
  showEffect(root.querySelector<HTMLElement>('#results')!, step.effect);
  hud.innerHTML = playerPanel(c.player, c.mods);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
}

async function levelUpScreen(): Promise<void> {
  const c = camp!;
  const root = show(
    h(`<div class="screen rwheel"><h2>${S.ui.levelUpTitle}</h2><p class="center"><span class="chip tier tier-2">${S.ui.levelLabel(c.player.level + 1)}</span></p>
      <div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="results"></div><div id="hud"></div><div id="cta"></div></div></div>`),
  );
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods);

  await sleep(settings.instant ? 0 : 300);
  const step = levelUp(c.player, data);
  applyStep(step);
  showEffect(root.querySelector<HTMLElement>('#results')!, step.effect);
  // Despertar da linhagem nos níveis 4 e 7.
  // Sem despertar no Roleta enxuto: as técnicas sobem sozinhas com o nível.
  const awakening = undefined as string | undefined;
  if (awakening) {
    root
      .querySelector<HTMLElement>('#results')!
      .insertAdjacentHTML('beforeend', `<div class="result-card pop"><h3>${clanSymbol(c.player.origin.lineageId)} ${S.ui.awakeningTitle(c.player.level)}</h3><p>${awakening}</p></div>`);
  }
  hud.innerHTML = playerPanel(c.player, c.mods);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
}

/** Aviso simples entre telas (ex.: restauração do fim do exame). */
async function noticeScreen(title: string, text: string): Promise<void> {
  const c = camp!;
  const root = show(
    h(`<div class="screen rwheel"><h2>${title}</h2><div class="rstage-box">${rstage()}</div>
      <div class="rside"><div class="effect pop">${text}</div><div id="hud">${playerPanel(c.player, c.mods)}</div>
      <div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div></div></div>`),
  );
  await choose(root);
}

// ---------------------------------------------------------------------------
// Fim de run e histórico

/**
 * Fim da run. Vitória (o chefe do 1º ciclo caiu): "Seguir para o ciclo 2" ou nova run. Cair a partir do ciclo 2 não é
 * uma derrota comum: a run já foi vencida.
 */
async function endScreen(won: boolean, stoppedAt: string | null, record = false, abandoned = false): Promise<'continue' | 'new'> {
  const c = camp!;
  const RR = S.roleta.run;
  const infinite = c.run.cycle > 0;
  const good = won || infinite;
  progressDots(won ? rdata.cycle.length : c.run.step);
  (good ? victory : defeat)();
  const title = abandoned ? RR.abandoned : won ? S.ui.victoryTitle : infinite ? RR.infiniteOver : S.ui.defeatTitle;
  const pct = Math.round(rdata.r.infinite.perCycle * (c.run.cycle + 1) * 100);
  // O modo infinito existe só no Hardcore: nas outras dificuldades, a vitória encerra a run.
  const canGo = won && canContinueRoleta(getRun());
  const cont = canGo
    ? `<button class="btn primary big" data-choice="continue"${tip(RR.nextCycle(c.run.cycle + 2), RR.nextCycleTip(pct))}>${icon('cycle')} ${RR.nextCycle(c.run.cycle + 2)}</button>`
    : '';
  if (!canGo) campLive = false;
  const face = good ? clanSymbol(c.player.origin.lineageId) : foePortrait(c.run.villainId ?? rdata.categories.genin[0]!, 'lg');
  const root = show(
    h(`<div class="screen end rend ${good ? 'win' : 'lose'}">
      <div class="rend-l">
      <div class="end-seal">${face}<span class="seal stamp end-stamp${good ? ' gold' : ''}" aria-hidden="true">${good ? '勝' : '敗'}</span></div>
      <h2>${title}</h2>
      ${stoppedAt ? `<p class="center">${S.ui.defeatBy(stoppedAt)}</p>` : ''}
      <p class="center">${RR.reached(c.run.cycle + 1, c.run.wins)}${record ? ` <span class="chip jrecord">${icon('medal')} ${RR.record}</span>` : ''}</p>
      <p class="center muted">${S.ui.revivesUsed(c.player.revivesUsed)}</p>
      ${won && !canGo ? `<p class="center muted small">${icon('lock')} ${RR.infiniteHardcoreOnly}</p>` : ''}
      </div>
      <div class="rend-r">
      ${stageTrail(c.run)}
      ${playerPanel(c.player)}
      </div>
      <div class="sticky-cta actions-row">
        <button class="btn big" data-share>${icon('share')} ${S.share.button}</button>
        ${cont}
        <button class="btn ${canGo ? '' : 'primary '}big" data-choice="new">${icon('dice')} ${S.ui.newRun}</button>
      </div>
    </div>`),
  );
  root.querySelector('[data-share]')!.addEventListener('click', () => void shareRun(c, good, stoppedAt));
  const choice = await choose<'continue' | 'new'>(root);
  if (choice === 'new') campLive = false;
  return choice;
}

/** Cores da roleta de raridade da relíquia. */
const RELIC_TIER_COLORS: Record<string, string> = { common: '#5d6168', uncommon: '#4e8a68', rare: '#3f5f9e' };

/**
 * Relíquia da vitória (docs/roleta/run.md#recompensa): a roleta da raridade, com os pesos da categoria do vilão, e a
 * da relíquia (as que faltam). Sem escolha. Sem nenhuma para sortear, vale o XP de uma recompensa rara.
 */
async function relicRewardScreen(cat: RCategory): Promise<void> {
  const c = camp!;
  const RR = S.roleta.run;
  const root = show(
    h(`<div class="screen rwheel"><h2>${RR.relicRewardTitle}</h2><p class="center"><span class="chip">${RR.categories[cat]}</span></p>
      <div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="results"></div><div id="hud"></div><div id="cta"></div></div></div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const results = root.querySelector<HTMLElement>('#results')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods);
  const roll = rollRelicReward(c.player, cat, c.run.cycle, rdata, rng);
  const tiers = S.jornada.relics.tiers;
  if (roll.tierStep) {
    await bigWheel(slot, S.roulettes.relicTier, roll.tierStep.slices.map((s) => ({ label: tiers[s.value] ?? s.value, weight: s.weight, color: RELIC_TIER_COLORS[s.value] ?? PALETTE[0]! })), roll.tierStep.index);
  }
  if (roll.relicStep) {
    await bigWheel(
      slot,
      S.roulettes.relic,
      roll.relicStep.slices.map((s, i) => ({ label: relicName(s.value), weight: s.weight, color: PALETTE[i % PALETTE.length]!, icon: relicIcon(s.value) })),
      roll.relicStep.index,
    );
  }
  if (roll.relic) {
    c.player = gainRoletaRelic(c.player, roll.relic, rdata);
    discoverRoletaRelics([roll.relic]);
    results.innerHTML = relicCard(roll.relic, '', 'pop', 'roleta');
    stepLog()?.items.push(`${icon('sparkle')} ${relicName(roll.relic)}`);
    mood('good');
  } else {
    const step = xpStep(c.player, rewardXp(c.player, 2, rdata), data);
    applyStep(step);
    showEffect(results, step.effect);
  }
  hud.innerHTML = playerPanel(c.player, c.mods);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
  await levelUps();
}

/** Baú do chefe: 3 relíquias lado a lado; tocar destaca, o botão confirma. */
async function chestScreen(options: string[]): Promise<string> {
  const RR = S.roleta.run;
  discoverRoletaRelics(options);
  let pick: string | undefined;
  const root = show(h(`<div class="screen jrboss"><h2>${RR.chestTitle}</h2>
    <div class="jrboss-row">${options
      .map((id) => `<button type="button" class="jrboss-opt tier-${relicTier(id)}" data-opt="${id}" aria-label="${relicName(id)}">
        <span class="jrslot huge tier-${relicTier(id)}">${relicIcon(id)}</span><b>${relicName(id)}</b></button>`)
      .join('')}</div>
    <div data-detail><p class="muted center">${RR.chestPick}</p></div>
    <div class="sticky-cta"><button class="btn primary big" data-choice="take" disabled>${RR.chestPick}</button></div></div>`));
  const take = root.querySelector<HTMLButtonElement>('[data-choice="take"]')!;
  root.querySelector('.jrboss-row')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-opt]');
    if (!b) return;
    pick = b.dataset.opt!;
    root.querySelectorAll('[data-opt]').forEach((x) => x.classList.toggle('on', x === b));
    root.querySelector('[data-detail]')!.innerHTML = relicCard(pick, '', 'pop', 'roleta');
    take.disabled = false;
    take.textContent = RR.chestTake(relicName(pick));
  });
  await choose(root.querySelector('.sticky-cta')!);
  mood('good');
  return pick!;
}

/** Compartilha o resumo da run (menu do celular) ou copia para colar no grupo. */
async function shareRun(c: Campaign, won: boolean, stoppedAt: string | null) {
  const text = buildShareText(
    {
      version: VERSION,
      difficulty: S.difficulty[c.difficulty].name,
      origin: originText(c.origin),
      level: c.player.level,
      trail: c.trail,
      won,
      fallenTo: stoppedAt,
      revivesUsed: c.player.revivesUsed,
      seed: c.seed,
    },
    S.share,
  );
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      // Cancelado pelo jogador: não faz nada. Outro erro: cai para copiar.
      if ((e as Error).name === 'AbortError') return;
    }
  }
  toast((await copyText(text)) ? S.share.copied : S.share.failed);
}

/** Origem por extenso: linhagem, afinidade e jinchuuriki. */
function originText(o: Origin): string {
  const kg = o.kekkeiGenkai ? ` · ${S.kekkeiGenkai[o.kekkeiGenkai]?.name}` : '';
  return `${originLabel(o)}${o.elements.length ? ` (${o.elements.map((e) => S.elements[e]).join(', ')})` : ''}${kg}${o.jinchuuriki ? ` · ${S.origin.jinchuuriki}` : ''}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Aviso curto sobre a tela, que some sozinho. */
function toast(text: string, ico = '') {
  const el = h(`<div class="toast" role="status">${ico ? icon(ico) : ''}<span>${esc(text)}</span></div>`);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

type ProfileTab = 'history' | 'achievements' | 'bingo' | 'origins' | 'relics';
type RegistryPage = 'history' | 'bingo' | 'relics' | 'achievements';
type HistoryFilter = 'general' | 'origins' | 'difficulty';
/** Selo de cada seção do Registro: 歴 histórico, 功 conquistas, 手配 Livro Bingo (procurados), 宝 relíquias. */
const REGISTRY_KANJI: Record<RegistryPage, string> = { history: '歴', achievements: '功', bingo: '手配', relics: '宝' };

/** Entradas antigas (barra superior, barra do Portão, faixa de Conquistas): Origens vira o filtro do Histórico. */
function openProfile(tab: ProfileTab = 'history') {
  if (tab === 'origins') openRegistry('history', 'origins');
  else openRegistry(tab);
}

/**
 * Registro em popup (um padrão só, em todo lugar): uma seção por vez, num pergaminho com rolos. O Histórico filtra por
 * Geral, Origens e Dificuldade. O nome do jogador aparece no topo só no celular (no PC ele fica na Ficha do Início).
 */
function openRegistry(page: RegistryPage, filter: HistoryFilter = 'general') {
  const D = S.ui.desk;
  const k = REGISTRY_KANJI[page];
  const overlay = h(`<div class="modal"><div class="modal-body profile registry">
    <span class="scroll-roll t" aria-hidden="true"></span><span class="scroll-roll b" aria-hidden="true"></span>
    <div class="modal-head"><span class="seal${k.length > 1 ? ' two' : ''}" aria-hidden="true">${k}</span><h2>${D.nav[page]}</h2><button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></div>
    <label class="field profile-name reg-name"><span>${S.ui.playerName.label}</span><input type="text" data-player-name maxlength="${PLAYER_NAME_MAX}" autocomplete="nickname" placeholder="${S.ui.playerName.placeholder}" value="${esc(profile.playerName ?? '')}"></label>
    ${page === 'history' ? `<div class="segmented desk-filters">${(['general', 'origins', 'difficulty'] as const).map((f) => `<button class="btn seg" data-filter="${f}" aria-pressed="${f === filter}">${D.filters[f]}</button>`).join('')}</div>` : ''}
    <div class="profile-body"></div></div></div>`);
  const body = overlay.querySelector<HTMLElement>('.profile-body')!;
  overlay.querySelector('[data-player-name]')!.addEventListener('change', (e) => setPlayerName((e.target as HTMLInputElement).value));
  const fill = (f: HistoryFilter) => {
    body.replaceChildren();
    if (page === 'history') {
      if (f === 'general') historyTab(body);
      else body.innerHTML = f === 'origins' ? originsTab() : difficultyStats();
    } else if (page === 'relics') relicCollection(body, profile.relics);
    else body.innerHTML = page === 'bingo' ? bingoTab() : achievementsTab();
  };
  overlay.querySelector('.desk-filters')?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-filter]');
    if (!b) return;
    overlay.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    fill(b.dataset.filter as HistoryFilter);
  });
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  fill(filter);
  document.body.appendChild(overlay);
}

/** Selo da conquista: 功 dourado quando liberada; contorno com cadeado quando não. */
const achSeal = (on: boolean) => (on ? '<span class="ach-ico seal gold" aria-hidden="true">功</span>' : `<span class="ach-ico seal ghost" aria-hidden="true">${icon('lock')}</span>`);

function achievementsTab(): string {
  const A = S.achievements;
  const unlocked = new Set(Object.keys(profile.achievements));
  const cats: AchievementCategory[] = ['milestone', 'luck', 'style', 'secret'];
  // Clássicas (mecânica que saiu do Roleta) só aparecem para quem já tem, e não contam no total.
  const shown = achievements.filter((a) => !a.legacy || unlocked.has(a.id));
  const counted = achievements.filter((a) => !a.legacy);
  const got = counted.filter((a) => unlocked.has(a.id)).length;
  return `<p class="muted small center">${A.count(got, counted.length)}</p>${cats
    .map((cat) => {
      const list = shown.filter((a) => a.category === cat);
      const n = list.filter((a) => unlocked.has(a.id)).length;
      return `<h3 class="ach-cat">${A.categories[cat]} <small class="muted">${A.progress(n, list.length)}</small></h3><ul class="ach-list">${list
        .map((a) => {
          const on = unlocked.has(a.id);
          const txt = !on && a.hidden ? { name: A.hiddenName, desc: A.hiddenDesc } : A.list[a.id] ?? { name: a.id, desc: '' };
          const prog = !on && a.progress ? ` <small class="muted">${A.progress(...a.progress(unlocked))}</small>` : '';
          return `<li class="ach ${on ? 'on' : 'off'}">${achSeal(on)}<span><b>${txt.name}</b>${prog}<small>${txt.desc}</small></span></li>`;
        })
        .join('')}</ul>`;
    })
    .join('')}${jornadaAchievementsSection(unlocked)}`;
}

/** Conquistas da Jornada: mesma aba, categoria própria (docs/base/perfil.md#categorias). */
function jornadaAchievementsSection(unlocked: ReadonlySet<string>): string {
  const A = S.achievements;
  const JA = S.jornada.achievements;
  const n = jornadaAchievements.filter((a) => unlocked.has(a.id)).length;
  return `<h3 class="ach-cat">${JA.category} <small class="muted">${A.progress(n, jornadaAchievements.length)}</small></h3><ul class="ach-list">${jornadaAchievements
    .map((a) => {
      const on = unlocked.has(a.id);
      const txt = !on && a.hidden ? { name: A.hiddenName, desc: A.hiddenDesc } : JA.list[a.id] ?? { name: a.id, desc: '' };
      return `<li class="ach ${on ? 'on' : 'off'}">${achSeal(on)}<span><b>${txt.name}</b><small>${txt.desc}</small></span></li>`;
    })
    .join('')}</ul>`;
}

function bingoTab(): string {
  const P = S.profile;
  return `<p class="muted small">${P.bingoIntro}</p><ul class="bingo">${villains
    .map((v) => {
      const r = profile.villains[v.id];
      if (!r || r.faced === 0) {
        return `<li class="bingo-card unknown">${foePortrait(v.id, 'sm')}<span><b>${P.unknownVillain}</b></span><span class="bingo-stamp kanji" aria-hidden="true">謎</span></li>`;
      }
      const lines = [P.faced(r.faced), P.defeated(r.defeated), r.killedYou ? P.killedYou(r.killedYou) : '']
        .filter(Boolean)
        .join(' · ');
      const stamp = r.defeated > 0 ? '<span class="bingo-stamp kanji" aria-hidden="true">勝</span>' : '';
      return `<li class="bingo-card${r.defeated > 0 ? ' beaten' : ''}">${foePortrait(v.id, 'sm')}<span><b>${villainName(v.id)}</b><small>${lines}</small>
        <small class="muted">${P.bestHit(r.bestHit)} · ${P.worstHit(r.worstHit)}</small></span>${stamp}</li>`;
    })
    .join('')}</ul>`;
}

function originsTab(): string {
  const P = S.profile;
  const rec = originRecords(loadRuns(storage));
  // Linhagem fora do sorteio só aparece para quem jogou com ela.
  const lineages = allLineages.filter((l) => data.lineages.some((x) => x.id === l.id) || rec[l.id]);
  return `<p class="muted small">${P.originsIntro}</p><ul class="history">${lineages
    .map((l) => {
      const r = rec[l.id];
      const name = l.id === 'common' ? S.origin.common : S.lineages[l.id] ?? l.id;
      if (!r) return `<li><div class="row between"><b>${name}</b><small class="muted">${P.neverPlayed}</small></div></li>`;
      const pct = Math.round((r.wins / r.runs) * 100);
      const stage = campaign[r.furthestStage];
      const far = r.wins > 0 ? S.ui.runStatus.victory : r.bestFights >= 0 ? S.roleta.run.reached(1, r.bestFights) : stage ? P.furthest(stageName(stage)) : '';
      return `<li><div class="row between"><b>${name}</b><b>${P.winRate(pct)}</b></div>
        <small class="muted">${P.originLine(r.runs, r.wins)} · ${far}</small></li>`;
    })
    .join('')}</ul>`;
}

function historyTab(container: HTMLElement) {
  const runs = loadRuns(storage);
  container.innerHTML = `<label class="toggle"><input type="checkbox" id="show-rerolls"> ${S.ui.showRerolls}</label>
    <ul class="history"></ul>`;
  const list = container.querySelector<HTMLElement>('.history')!;

  const render = (withRerolls: boolean) => {
    const shown = runs.filter((r) => withRerolls || r.status !== 'reroll');
    list.innerHTML = shown.length
      ? shown
          .map((r) => {
            const date = new Date(r.startedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const o = r.origin;
            const origin = `${originLabel(o)}${o.elements.map((e) => ` · ${S.elements[e]}`).join('')}${o.jinchuuriki ? ` · ${S.origin.jinchuuriki}` : ''}`;

            const stage = campaign[r.furthestStage];
            // Roleta enxuto: ciclo e lutas; registros antigos: a etapa da campanha.
            const reached =
              r.status === 'reroll'
                ? ''
                : r.fights !== undefined
                  ? ` · ${S.roleta.run.reached((r.cycle ?? 0) + 1, r.fights)}`
                  : r.status !== 'victory' && stage
                    ? ` · ${S.ui.reachedStage(stageName(stage))}`
                    : '';
            const diff = r.difficulty ? ` ${diffChip(r.difficulty)}` : '';
            return `<li><div class="row between"><b>${origin}</b><span>${diff} <span class="chip st-${r.status}">${S.ui.runStatus[r.status]}</span></span></div>
              <small class="muted">${date}${reached} · ${S.ui.revivesUsed(r.revivesUsed)}</small></li>`;
          })
          .join('')
      : `<li class="muted">${S.ui.historyEmpty}</li>`;
  };
  render(false);
  container.querySelector<HTMLInputElement>('#show-rerolls')!.addEventListener('change', (e) => {
    render((e.target as HTMLInputElement).checked);
  });
}

// ---------------------------------------------------------------------------
// Fluxo da campanha

// ---------------------------------------------------------------------------
// Tela: laboratório (modo de teste, `?teste`)

const LAB_KEY = 'proto_lab_v1';
type LabTarget = { kind: 'fight'; villainId: string } | { kind: 'campaign'; from: number };
/** Última montagem do laboratório (preferência do aparelho, não é campanha). */
interface LabSaved {
  config: LabConfig;
  villainId: string;
  stage: number;
}

function loadLab(): LabSaved {
  const fallback: LabSaved = {
    config: { lineageId: 'common', elements: ['fire'], jinchuuriki: false, difficulty: DEFAULT_DIFFICULTY, level: 1, techniques: [], bag: {} },
    villainId: villains[0]!.id,
    stage: 0,
  };
  try {
    const raw = storage.getItem(LAB_KEY);
    const saved = (raw ? JSON.parse(raw) : {}) as Partial<LabSaved>;
    const merged = { ...fallback, ...saved, config: { ...fallback.config, ...saved.config } };
    // Montagens de antes da v0.30 guardam `affinity` no lugar de `elements`.
    const old = saved.config as { affinity?: Element | null } | undefined;
    if (!Array.isArray(merged.config.elements)) merged.config.elements = old?.affinity ? [old.affinity] : [];
    // Dados que mudaram de versão (linhagem ou vilão removido) voltam ao padrão.
    if (!data.lineages.some((l) => l.id === merged.config.lineageId)) merged.config.lineageId = fallback.config.lineageId;
    if (!villainsById[merged.villainId]) merged.villainId = fallback.villainId;
    if (!campaign[merged.stage]) merged.stage = 0;
    return merged;
  } catch {
    return fallback;
  }
}

function saveLab(saved: LabSaved) {
  try {
    storage.setItem(LAB_KEY, JSON.stringify(saved));
  } catch {
    /* conveniência */
  }
}

const ALL_ELEMENTS = Object.keys(data.elementWeights) as Element[];

/** Monta a ficha à mão e escolhe o destino. Deixa `camp` com a ficha montada (a Ficha funciona). */

async function labScreen(): Promise<LabTarget> {
  const saved = loadLab();
  const cfg = saved.config;
  const opt = (value: string, label: string, selected: boolean) =>
    `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(label)}</option>`;
  const root = show(
    h(`<div class="screen lab">
      <h2>${S.lab.title}</h2>
      <p class="muted small center">${S.lab.intro}</p>
      <section class="lab-box"><h3>${S.lab.origin}</h3>
        <label>${S.lab.lineage}<select name="lineage">${data.lineages.map((l) => opt(l.id, S.lineages[l.id] ?? l.id, l.id === cfg.lineageId)).join('')}</select></label>
        <label>${S.lab.primary}<select name="primary">${opt('', S.lab.noElement, cfg.elements.length === 0)}${ALL_ELEMENTS.map((e) => opt(e, S.elements[e], e === cfg.elements[0])).join('')}</select></label>
        <div class="lab-elements"><span>${S.lab.elements}</span>${ALL_ELEMENTS.map((e) => `<label class="lab-check"><input type="checkbox" name="extra-el" value="${e}"${cfg.elements.slice(1).includes(e) ? ' checked' : ''}> ${S.elements[e]}</label>`).join('')}</div>
        <p class="muted small">${S.lab.elementsHint}</p>
        <label>${S.lab.difficulty}<select name="difficulty">${DIFFICULTIES.map((d) => opt(d, S.difficulty[d].name, d === cfg.difficulty)).join('')}</select></label>
        <label>${S.lab.level}<input type="number" name="level" min="1" max="20" inputmode="numeric" value="${cfg.level}"></label>
        <label class="lab-check"><input type="checkbox" name="jin"${cfg.jinchuuriki ? ' checked' : ''}> ${S.lab.jinchuuriki}</label>
      </section>
      <section class="lab-box"><h3>${S.lab.stats}</h3>
        <p class="muted small">${S.lab.statsHint}</p>
        ${LAB_STAT_KEYS.map((k) => `<label>${S.stats[k]}<input type="number" name="stat-${k}" min="0" inputmode="numeric" value="${cfg.stats?.[k] ?? ''}"></label>`).join('')}
        <button class="btn" data-stats-reset>${S.lab.statsReset}</button>
      </section>
      <div id="lab-preview"></div>
      <section class="lab-box"><h3>${S.lab.techniques}</h3><div id="lab-techs" class="lab-techs"></div></section>
      <section class="lab-box"><h3>${S.lab.bag}</h3>
        ${CONSUMABLES.map((id) => `<label>${S.consumables[id]!.name}<input type="number" name="bag-${id}" min="0" max="${data.balance.items.bagMax}" inputmode="numeric" value="${cfg.bag[id] ?? 0}"></label>`).join('')}
      </section>
      <section class="lab-box"><h3>${S.lab.destination}</h3>
        <label>${S.lab.villain}<select name="villain">${villains.map((v) => opt(v.id, villainName(v.id), v.id === saved.villainId)).join('')}</select></label>
        <button class="btn primary" data-go="fight">${icon('swords')} ${S.lab.fight}</button>
        <label>${S.lab.stage}<select name="stage">${campaign.map((st, i) => opt(String(i), `${i + 1}. ${stageName(st)}`, i === saved.stage)).join('')}</select></label>
        <button class="btn" data-go="campaign">${S.lab.campaign}</button>
      </section>
    </div>`),
  );
  const field = (name: string) => root.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  const read = (): LabSaved => ({
    config: {
      lineageId: field('lineage').value,
      elements: [
        ...(field('primary').value ? [field('primary').value as Element] : []),
        ...[...root.querySelectorAll<HTMLInputElement>('[name="extra-el"]:checked')].map((i) => i.value as Element),
      ],
      jinchuuriki: field('jin').checked,
      difficulty: field('difficulty').value as Difficulty,
      level: Math.max(1, Math.floor(Number(field('level').value)) || 1),
      techniques: [...root.querySelectorAll<HTMLInputElement>('[name="tech"]:checked')].map((i) => i.value),
      bag: Object.fromEntries(CONSUMABLES.map((id) => [id, Number(field(`bag-${id}`).value) || 0])),
      // Só os status escritos; em branco segue a ficha montada.
      stats: Object.fromEntries(LAB_STAT_KEYS.filter((k) => field(`stat-${k}`).value.trim() !== '').map((k) => [k, Number(field(`stat-${k}`).value)])),
    },
    villainId: field('villain').value,
    stage: Number(field('stage').value),
  });
  const render = () => {
    const current = read();
    const c = current.config;
    const elementRule = lineageOf(c.lineageId, data).elements;
    const noChoice = elementRule.countWeights.length <= 1 || (elementRule.fixed !== undefined && elementRule.countWeights.length <= 2);
    field('primary').disabled = noChoice || elementRule.fixed !== undefined;
    root.querySelectorAll<HTMLInputElement>('[name="extra-el"]').forEach((i) => (i.disabled = noChoice));
    // Roleta enxuto: o kit é fixo pela origem (as técnicas sobem sozinhas com o nível).
    const enxuto = (p: PlayerState): PlayerState => ({ ...p, techniques: roletaKit(p.origin, rdata), techniqueLevels: {}, pendingUpgrades: 0 });
    const player = enxuto(buildLabPlayer({ ...c, techniques: [] }, data));
    const auto = labStatsOf(buildLabPlayer({ ...c, stats: {} }, data));
    for (const k of LAB_STAT_KEYS) field(`stat-${k}`).placeholder = String(auto[k]);
    // As opções de técnica dependem da origem e do nível, não das extras já marcadas.
    const learnable: ReturnType<typeof labLearnable> = [];
    root.querySelector<HTMLElement>('#lab-techs')!.innerHTML = learnable.length
      ? learnable
          .map(
            (t) =>
              `<label class="lab-check"><input type="checkbox" name="tech" value="${t.id}"${c.techniques.includes(t.id) ? ' checked' : ''}> ${esc(techName(t.id))}${elChip(t.element === 'affinity' ? (player.elements[0] ?? null) : t.element, false)}</label>`,
          )
          .join('')
      : `<p class="muted small">${S.lab.noTechniques}</p>`;
    camp = {
      runId: 'lab',
      origin: labOrigin(c, data),
      player,
      difficulty: c.difficulty,
      run: newRoletaRun(player, c.difficulty),
      mods: { ...NO_MODS },
      seed: LAB.seed,
      trail: [],
      log: {},
      stats: emptyRunStats(),
    };
    campLive = true;
    syncSheetBtn();
    root.querySelector<HTMLElement>('#lab-preview')!.innerHTML = playerPanel(player);
    saveLab(current);
  };
  render();
  root.addEventListener('change', render);
  return new Promise((resolve) => {
    root.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-stats-reset]')) {
        for (const k of LAB_STAT_KEYS) field(`stat-${k}`).value = '';
        render();
        return;
      }
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-go]');
      if (!btn) return;
      render();
      const s = read();
      resolve(btn.dataset.go === 'fight' ? { kind: 'fight', villainId: s.villainId } : { kind: 'campaign', from: s.stage });
    });
  });
}

/** Uma volta do laboratório: monta, resolve os upgrades de marco, luta ou joga a campanha e volta. */
async function labFlow(): Promise<void> {
  progressDots(-1);
  const target = await labScreen();
  await levelUps();
  if (target.kind === 'fight') {
    const name = villainName(target.villainId);
    await battleScreen({ villainId: target.villainId, options: {}, label: S.lab.fightLabel(esc(name)), exam: false });
    return;
  }
  await runCampaign();
}

/**
 * Run do Roleta enxuto (docs/roleta/run.md): a cada passo, sorteia o vilão da categoria, gira o evento, luta, ganha o
 * XP e a recompensa. Depois do chefe: baú e o próximo ciclo (no 1º, a tela de vitória pergunta se segue).
 */
async function runCampaign(): Promise<void> {
  const c = camp!;
  const RR = S.roleta.run;
  for (;;) {
    if (!c.run.villainId) setRun(drawVillain(getRun(), rdata, rng));
    const run = getRun();
    const id = run.villainId!;
    track({ furthestStage: run.step, cycle: run.cycle, fights: run.wins });
    const entry: TrailEntry = { name: villainName(id), exam: false, results: [] };
    c.trail.push(entry);
    // Mapa → evento pré-luta (uma vez) → luta. Do evento dá para voltar ao mapa; aí o botão vira Lutar.
    let eventDone = false;
    let go: 'event' | 'fight' | 'abandon';
    for (;;) {
      go = await mapScreen(eventDone);
      if (go !== 'event') break;
      eventDone = true;
      if ((await eventScreen(villainName(id))) === 'fight') {
        go = 'fight';
        break;
      }
    }
    if (go === 'abandon') return abandonRun();
    // Toda luta começa com HP e chakra cheios (v0.59.0).
    c.player = readyForFight(c.player);
    const fightCat = currentCategory(getRun(), rdata);
    const cat = RR.categories[fightCat]!;
    const result = await battleScreen(
      {
        villainId: id,
        options: { villainStartsFirst: c.mods.villainStartsFirst, playerStartsFirst: c.mods.playerStartsFirst },
        label: RR.fightLabel(c.run.cycle + 1, cat, villainName(id)),
        exam: false,
        def: villainFor(getRun(), villainsById, rdata),
      },
      true,
    );
    if (!result) return abandonRun();
    entry.results.push(result.status === 'won' ? 'win' : 'loss');
    noteFight(id, false, result);
    const { run: next, outcome } = finishRoletaFight(getRun(), result, rdata, rng);
    setRun(next);
    if (!outcome.won) {
      // A partir do ciclo 2 a run já foi vencida: o registro continua como vitória.
      if (c.run.cycle === 0) track({ status: 'defeat', cycle: 0, fights: c.run.wins });
      else track({ cycle: c.run.cycle, fights: c.run.wins });
      const record = recordRoleta();
      checkAchievements('defeat', id);
      await endScreen(false, villainName(id), record);
      return;
    }
    await levelUps();
    // Depois da luta (fora o chefe): a roleta de relíquia, com a raridade pela categoria do vilão.
    if (!outcome.boss) await relicRewardScreen(fightCat);
    if (c.run.bossChoice) {
      const relic = await chestScreen(c.run.bossChoice);
      setRun(chooseChest(getRun(), relic, rdata));
      stepLog()?.items.push(`${icon('sparkle')} ${relicName(relic)}`);
    }
    if (!outcome.boss) continue;
    // Fim de ciclo.
    const record = recordRoleta();
    if (c.run.status === 'victory') {
      track({ status: 'victory', cycle: 0, fights: c.run.wins });
      checkAchievements('victory', null);
      if ((await endScreen(true, null, record)) !== 'continue') return;
      setRun(continueRoletaCycle(getRun()));
    } else {
      // Do 2º ciclo em diante, o próximo emenda sozinho.
      track({ cycle: c.run.cycle, fights: c.run.wins });
      checkAchievements('victory', null);
    }
    await noticeScreen(RR.cycle(c.run.cycle + 1), RR.cycleStart(Math.round((cycleMult(getRun(), rdata) - 1) * 100)));
  }
}

/** Abandonar a run (mapa ou luta): conta como abandonada e mostra o fim da run. */
async function abandonRun(): Promise<void> {
  const c = camp!;
  track({ status: 'abandoned', cycle: c.run.cycle, fights: c.run.wins });
  const record = recordRoleta();
  campLive = false;
  await endScreen(false, null, record, true);
}

/** Recorde do Roleta (ciclo alcançado e lutas vencidas); devolve se bateu. */
function recordRoleta(): boolean {
  if (!camp || LAB.lab) return false;
  const next = recordRoletaReach(profile, { cycle: camp.run.cycle + 1, fights: camp.run.wins });
  if (next === profile) return false;
  profile = next;
  saveProfile(storage, profile);
  return true;
}

/** Tema aplicado: o escolhido no botão ou o do aparelho. */
const deviceTheme = window.matchMedia?.('(prefers-color-scheme: light)');
const currentTheme = (): Theme => settings.theme ?? (deviceTheme?.matches ? 'light' : 'dark');
const THEME_COLORS: Record<Theme, string> = { dark: '#0d0c0b', light: '#e6dac0' };

function applyTheme() {
  const theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLORS[theme]));
  const btn = document.getElementById('theme-btn')!;
  // O botão mostra para onde vai: sol à noite, lua de dia.
  const next = theme === 'dark' ? S.ui.themeDay : S.ui.themeNight;
  btn.innerHTML = `${icon(theme === 'dark' ? 'sun' : 'moon')}${toolLabel('theme')}`;
  btn.title = next;
  btn.setAttribute('aria-label', next);
}

/** Nome curto ao lado do ícone da barra: o CSS só mostra no PC (≥ 1280px). */
function toolLabel(key: keyof typeof S.ui.toolLabels): string {
  return `<span class="tool-label">${S.ui.toolLabels[key]}</span>`;
}

/** O modo instantâneo também encurta as transições da interface (styles/instant.css). */
function setInstantCss(on: boolean) {
  document.documentElement.toggleAttribute('data-instant', on);
}

/** Botões do cabeçalho: instantâneo, dia/noite, efeitos sonoros e música. */
function installHeaderToggles() {
  setInstantCss(settings.instant);
  // Modo das cenas antes de qualquer tela; o botão só aparece quando alguma vaga tem vídeo.
  applySceneMode(settings.animated);
  document.getElementById('anim-btn')!.hidden = !hasSceneVideos();
  applyTheme();
  deviceTheme?.addEventListener?.('change', applyTheme);
  document.getElementById('theme-btn')!.addEventListener('click', () => {
    settings.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    saveSettings();
    applyTheme();
  });

  const toggles = [
    { id: 'instant-btn', key: 'instant', on: 'lightning', off: 'lightning', label: S.ui.instant, apply: setInstantCss },
    { id: 'anim-btn', key: 'animated', on: 'sparkle', off: 'sparkle', label: S.ui.animated, apply: applySceneMode },
    { id: 'sfx-btn', key: 'sfx', on: 'soundOn', off: 'soundOff', label: S.ui.sfx, apply: setSfx },
    { id: 'music-btn', key: 'music', on: 'music', off: 'musicOff', label: S.ui.music, apply: setMusic },
  ] as const;
  for (const t of toggles) {
    const btn = document.getElementById(t.id)!;
    const render = () => {
      const on = settings[t.key];
      btn.innerHTML = `${icon(on ? t.on : t.off)}${toolLabel(t.key)}`;
      btn.setAttribute('aria-pressed', String(on));
      btn.title = t.label(on);
      btn.setAttribute('aria-label', t.label(on));
    };
    render();
    btn.addEventListener('click', () => {
      settings[t.key] = !settings[t.key];
      saveSettings();
      t.apply(settings[t.key]);
      render();
    });
  }
}

/** Garante as fontes embutidas antes de medir texto (rótulos da roleta). Sem suporte, segue sem esperar. */
async function loadFonts(): Promise<void> {
  const faces = ['700 16px "Zen Kaku Gothic New"', '400 16px "Zen Kaku Gothic New"', '700 16px "Barlow Condensed"', '600 16px "Barlow Condensed"', '16px Shojumaru', '16px "Yuji Boku"'];
  try {
    await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f, f.includes('Yuji') ? '忍' : 'Aa'))), sleep(1500)]);
  } catch {
    /* fontes do sistema */
  }
}

async function main() {
  installErrorHandlers();
  markAbandonedRuns(storage, new Date(), data.balance.history.maxRuns);
  backfillProfile();


  installAudio(settings);
  installHeaderToggles();
  document.getElementById('history-btn')!.addEventListener('click', () => openProfile());
  // Atalhos do Portão da Vila para o registro ninja.
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-profile]');
    if (el) openProfile(el.dataset.profile as ProfileTab);
  });
  document.getElementById('sheet-btn')!.addEventListener('click', openSheet);
  // Botões "Ficha" dentro das telas (painel do jogador, card da luta).
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-sheet]')) openSheet();
  });
  // Tocar na roleta prossegue: aperta o botão principal dela ("Girar"), o que veio junto do resultado
  // ou o "Continuar" da tela. Nada acontece enquanto ela gira; escolhas de verdade (equipar) não entram.
  document.addEventListener('click', (e) => {
    const block = (e.target as HTMLElement).closest<HTMLElement>('.wheel-block');
    if (!block || block.dataset.spinning) return;
    const box = block.closest('.wheel-box');
    const scopes = [box, box?.parentElement, document.querySelector('#screen .sticky-cta')];
    const pick = ['spin', 'keep', 'ok', 'go', 'start']
      .map((c) => `button.primary[data-choice="${c}"]:not([disabled])`)
      .join(',');
    for (const scope of scopes) {
      const btn = scope?.querySelector<HTMLButtonElement>(pick);
      if (btn) {
        btn.click();
        return;
      }
    }
  });
  document.getElementById('disclaimer')!.textContent = S.ui.disclaimer;
  document.getElementById('version')!.textContent = S.ui.version(VERSION);
  document.getElementById('sheet-btn')!.innerHTML = `${icon('scroll')}${toolLabel('sheet')}`;
  document.getElementById('home-btn')!.innerHTML = `${icon('home')}<span>${S.ui.homeShort}</span>`;
  document.getElementById('home-btn')!.title = S.ui.home;
  document.getElementById('home-btn')!.setAttribute('aria-label', S.ui.home);
  const gateNav = document.getElementById('gate-nav')!;
  gateNav.setAttribute('aria-label', S.ui.gate.registry);
  const navItem = (kanji: string, label: string, attr = '') =>
    `<button type="button" ${attr}><span class="kanji${kanji.length > 1 ? ' two' : ''}" aria-hidden="true">${kanji}</span>${label}</button>`;
  gateNav.innerHTML =
    navItem('忍', S.ui.gate.home, 'aria-current="page"') +
    (
      [
        ['history', '歴'],
        ['bingo', '手配'],
        ['relics', '宝'],
        ['origins', '族'],
      ] as const
    )
      .map(([tab, kanji]) => navItem(kanji, S.profile.tabs[tab], `data-profile="${tab}"`))
      .join('');
  document.getElementById('history-btn')!.innerHTML = `${icon('book')}${toolLabel('history')}`;

  installTooltips();
  for (const [k, v] of Object.entries(uiTextureVars())) document.documentElement.style.setProperty(k, v);
  installSideNav();
  installQuoteStrip();
  installSceneRatios();
  installFolds();
  await loadFonts();

  if (LAB.lab) document.getElementById('version')!.textContent += ` · ${S.lab.badge}`;
  if (LAB.seed !== null) document.getElementById('version')!.textContent += ` · ${S.lab.seed(LAB.seed)}`;
  document.getElementById('home-btn')!.addEventListener('click', askHome);
  const round = async () => {
    if (LAB.lab) return labFlow();
    const pick = await modeScreen();
    if (pick !== 'roleta') return runJornada(jornadaHost, { resume: pick === 'jornada-continue' });
    await ensurePlayerName();
    await originScreen();
    await runCampaign();
  };
  for (;;) {
    try {
      if ((await untilHome(round())) === HOME) leftToMenu();
    } catch (err) {
      leftToMenu();
      // O próprio aviso também pode ser interrompido pelo botão do Portão.
      await untilHome(errorScreen(err));
    }
  }
}

/** Botão do Portão da Vila: confirma quando há run em andamento e volta ao menu sem recarregar a página. */
function askHome() {
  const jornada = document.body.classList.contains('mode-jornada');
  const text = jornada && jornadaSheet ? S.ui.homeConfirmJornada : !jornada && camp && campLive ? S.ui.homeConfirmRoleta : null;
  if (text && !window.confirm(text)) return;
  goHome();
}

/**
 * Uma tela quebrou no meio do fluxo (exceção). Antes, o laço principal parava e a interface congelava sem aviso. Agora:
 * fecha as camadas por cima, mostra o que houve e volta ao Portão. A Jornada salva fica como estava (é salva por parada).
 */
async function errorScreen(err: unknown): Promise<void> {
  console.error(err);
  goHome();
  const E = S.ui.error;
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const root = show(
    h(`<div class="screen" role="alert"><h2>${E.title}</h2><section class="card"><p>${E.text}</p>
      <details><summary class="small muted">${E.detail}</summary><p class="pre small muted">${esc(`${detail} · ${S.ui.version(VERSION)}`)}</p></details></section>
      <button class="btn primary big" data-choice="ok">${icon('home')} ${E.home}</button></div>`),
  );
  await choose(root);
}

/** Erro fora do fluxo das telas (um clique, uma animação): a tela segue; avisa uma vez a cada tanto, sem travar. */
let lastErrorToast = 0;
function installErrorHandlers(): void {
  const warn = (err: unknown) => {
    console.error(err);
    if (Date.now() - lastErrorToast < 10_000) return;
    lastErrorToast = Date.now();
    toast(S.ui.error.title, 'warning');
  };
  window.addEventListener('error', (e) => warn(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => warn(e.reason));
}

/** Arruma o estado deixado pelo fluxo interrompido: a run do Roleta conta como abandonada; a da Jornada já está salva. */
function leftToMenu() {
  if (camp && campLive) track({ status: 'abandoned' });
  camp = null;
  campLive = false;
  battlePlayer = null;
  jornadaSheet = null;
  document.body.classList.remove('mode-jornada');
  mood('neutral');
  syncSheetBtn();
}

/** Tela inicial: Roleta (rápido, tudo na sorte) ou Jornada (lento, com controle). */
async function modeScreen(): Promise<'roleta' | 'jornada' | 'jornada-continue'> {
  // A barra lateral pediu um modo de dentro de uma run: abre direto nele.
  if (pendingMode) {
    const m = pendingMode;
    pendingMode = null;
    markNav(m);
    return m;
  }
  const M = S.jornada.modes;
  const D = S.ui.desk;
  // No Portão da Vila não há run: some o botão do menu e o da Ficha.
  camp = null;
  campLive = false;
  syncSheetBtn();
  document.body.classList.add('at-gate');
  document.getElementById('dots')!.innerHTML = '';
  const G = S.ui.gate;
  // Portão da Vila (docs/visual.md): destaque com citação, os modos em pergaminho com arte e a faixa de Conquistas.
  // A faixa usa data-profile (não data-choice): só abre a janela, não escolhe modo. O Registro fica na barra inferior.
  // Dualidade (docs/visual.md): de dia o Naruto observa Konoha, à noite o Sasuke. As duas cenas, frases e selos ficam
  // montados; o CSS mostra a do tema atual (data-theme) e troca devagar, como um amanhecer.
  const DU = G.duality;
  const pickQuote = (list: readonly { text: string; by: string }[]) => list[Math.floor(Math.random() * list.length)]!;
  const day = sceneMedia('portao-dia') ?? sceneMedia('portao');
  const night = sceneMedia('portao-noite') ?? day;
  const hero = day || night ? `<span class="duo-layer duo-day">${day ?? ''}</span><span class="duo-layer duo-night">${night ?? ''}</span>` : null;
  const duoQuote = (t: 'day' | 'night') => {
    const q = pickQuote(DU[t].quotes);
    return `<div class="duo-q duo-${t}"><p>${q.text}</p><cite>${q.by}</cite></div>`;
  };
  const gateCard = (id: 'jornada' | 'roleta') =>
    modeCard({
      id, art: sceneMedia(`modo-${id}`) ?? emblem(id), artVars: sceneVars(`modo-${id}`), seal: id === 'jornada' ? '道' : '運',
      name: M[id].name, desc: M[id].desc, cta: id === 'jornada' ? D.ctaJornadaNew : D.ctaRoleta,
    });
  const root = show(
    h(`<div class="screen jmodes gate">
      <div class="gate-main">
        <div class="gate-banner">
          <header class="gate-head">
            <span class="gate-cloud l" aria-hidden="true">${cloud()}</span><span class="gate-cloud r" aria-hidden="true">${cloud()}</span>
            <h1 class="logo">${S.ui.title.split(' ').map((w, i) => `<span class="l${i + 1}">${w}</span>`).join('')}</h1>
            <p class="duo-tags"><span class="duo-tag duo-day">${DU.day.tag}</span><span class="duo-tag duo-night">${DU.night.tag}</span></p>
          </header>
          <div class="gate-hero duo" aria-hidden="true">${hero ?? ''}</div>
          <blockquote class="parchment gate-quote">${duoQuote('day')}${duoQuote('night')}
            <span class="seal duo-seal duo-day" aria-hidden="true">${DU.day.seal}</span><span class="seal duo-seal duo-night" aria-hidden="true">${DU.night.seal}</span></blockquote>
        </div>
        <p class="gate-sub">${M.title}</p>
        <nav class="gate-modes">${gateCard('jornada')}${gateCard('roleta')}</nav>
        <button class="scroll-banner" data-profile="achievements"><span class="seal gold" aria-hidden="true">功</span>
          <span><b>${G.achievements}</b><small>${G.achievementsDesc}</small></span>${icon('chevron')}</button>
      </div>
      <aside class="gate-aside">${profileCard()}${progressSlot()}${recentCard()}</aside>
    </div>`),
  );
  // A barra lateral escolhe o modo pelo mesmo botão do card enquanto o Início está na tela.
  gateApi = { root };
  root.querySelector('[data-desk-name]')?.addEventListener('change', (e) => setPlayerName((e.target as HTMLInputElement).value));
  markNav('home');
  const pick = await choose<'roleta' | 'jornada' | 'continue'>(root);
  gateApi = null;
  document.body.classList.remove('at-gate');
  markNav(pick === 'roleta' ? 'roleta' : 'jornada');
  return pick === 'continue' ? 'jornada-continue' : pick;
}

// ---------------------------------------------------------------------------
// Casca do PC (docs/visual.md, "Celular e desktop"): barra lateral persistente, Início em painéis, Registro em
// popup e a faixa de frases no pé. No celular nada disto aparece (o CSS esconde a partir de 900px).

type NavId = 'home' | 'jornada' | 'roleta' | RegistryPage;
const NAV_ICONS: Record<NavId, string> = { home: 'home', jornada: 'scroll', roleta: 'dice', history: 'book', bingo: 'card', relics: 'sparkle', achievements: 'medal' };
const REGISTRY_PAGES: RegistryPage[] = ['history', 'bingo', 'relics', 'achievements'];

/** Modo pedido pela barra lateral de dentro de uma run: o próximo Portão abre direto nele. */
let pendingMode: 'roleta' | 'jornada' | null = null;
/** Início aberto (só existe enquanto o Portão está na tela). */
let gateApi: { root: HTMLElement } | null = null;

function markNav(id: NavId): void {
  document.querySelectorAll<HTMLElement>('#side-nav [data-nav]').forEach((b) => {
    if (b.dataset.nav === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

function installSideNav(): void {
  const D = S.ui.desk;
  const nav = document.getElementById('side-nav')!;
  nav.setAttribute('aria-label', D.navLabel);
  const item = (id: NavId) => `<button type="button" data-nav="${id}">${icon(NAV_ICONS[id])}<span>${D.nav[id]}</span></button>`;
  nav.innerHTML = `<span class="side-brand seal" aria-hidden="true">忍</span>${(['home', 'jornada', 'roleta'] as const).map(item).join('')}<hr>${REGISTRY_PAGES.map(item).join('')}`;
  nav.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-nav]');
    if (!b) return;
    const id = b.dataset.nav as NavId;
    // O Registro abre em popup em qualquer tela (a de trás fica intacta).
    if (id !== 'home' && id !== 'jornada' && id !== 'roleta') return openRegistry(id);
    // No Início: o modo é escolhido pelo mesmo botão do card.
    if (gateApi) {
      if (id !== 'home') gateApi.root.querySelector<HTMLElement>(`[data-choice="${id}"]`)?.click();
      return;
    }
    const inJornada = document.body.classList.contains('mode-jornada');
    if ((id === 'jornada' && inJornada) || (id === 'roleta' && !inJornada)) return;
    const text = inJornada && jornadaSheet ? S.ui.homeConfirmJornada : !inJornada && camp && campLive ? S.ui.homeConfirmRoleta : null;
    if (text && !window.confirm(text)) return;
    pendingMode = id === 'home' ? null : id;
    goHome();
  });
}

/** Faixa de frases no pé (PC): uma frase sorteada, trocando a cada 20 s. */
function installQuoteStrip(): void {
  const el = document.getElementById('quote-strip')!;
  const quotes = S.ui.gate.quotes;
  let last = -1;
  const next = () => {
    let i = Math.floor(Math.random() * quotes.length);
    if (quotes.length > 1 && i === last) i = (i + 1) % quotes.length;
    last = i;
    el.classList.remove('in');
    void el.offsetWidth;
    el.innerHTML = `“${quotes[i]!.text}” <cite>${quotes[i]!.by}</cite>`;
    el.classList.add('in');
  };
  next();
  setInterval(next, 20_000);
}

/** Ficha do perfil (coluna direita do Início): nome, avatar padrão e números do perfil. */
function profileCard(): string {
  const D = S.ui.desk;
  const runs = loadRuns(storage).filter((r) => r.status !== 'reroll');
  const wins = runs.filter((r) => r.status === 'victory').length;
  const bestCycle = bestRoletaCycle(profile, runs);
  const best = profile.jornada?.generic ?? null;
  const counted = achievements.filter((a) => !a.legacy).length + jornadaAchievements.length;
  const rows: [string, string][] = [
    [D.stats.roletaRuns, String(runs.length)],
    [D.stats.roletaWins, String(wins)],
    [D.stats.bestCycle, bestCycle !== null ? String(bestCycle) : D.none],
    [D.stats.jornada, best ? S.jornada.start.best(best.cycle, best.stage, best.won) : D.none],
    [D.stats.achievements, `${Object.keys(profile.achievements).length}/${counted}`],
    [D.stats.villains, String(Object.keys(profile.villains).length)],
    [D.stats.relics, String(Object.keys(profile.relics).length)],
  ];
  return `<section class="parchment desk-profile"><span class="desk-pin" aria-hidden="true">${icon('kunai')}</span>
    <h3>${D.profileTitle}</h3>
    <div class="desk-id"><span${tip(D.profileTitle, D.avatarSoon)}>${ninjaPortrait('common', false, 'md')}</span>
      <label class="field"><span>${S.ui.playerName.label}</span><input type="text" data-desk-name maxlength="${PLAYER_NAME_MAX}" autocomplete="nickname" placeholder="${D.namePlaceholder}" value="${esc(profile.playerName ?? '')}"></label></div>
    <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
  </section>`;
}

/** Progresso da Jornada na coluna direita, com o selo carimbado no canto ('' sem run salva). */
function progressSlot(): string {
  const card = jornadaProgressCard(storage);
  return card ? `<div class="desk-prog">${card}<span class="seal desk-seal" aria-hidden="true">巻</span></div>` : '';
}

/** Conquistas recentes (coluna direita do Início), com o atalho para a página. */
function recentCard(): string {
  const recent = jornadaHost.recentAchievements(3);
  if (!recent.length) return '';
  const J = S.jornada.start;
  return `<section class="parchment jrecent desk-recent"><h3>${J.recentTitle} <button type="button" class="btn small desk-all" data-profile="achievements">${S.ui.desk.seeAll} ${icon('chevron')}</button></h3><ul>${recent
    .map((a) => `<li><span class="seal" aria-hidden="true">功</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span><time>${J.when(a.days)}</time></li>`)
    .join('')}</ul></section>`;
}

/** Estatística por dificuldade (filtro do Histórico): runs, vitórias, % e o melhor ciclo do Roleta. */
function difficultyStats(): string {
  const D = S.ui.desk;
  const runs = loadRuns(storage).filter((r) => r.status !== 'reroll');
  return `<ul class="history">${DIFFICULTIES.map((d) => {
    const mine = runs.filter((r) => r.difficulty === d);
    if (!mine.length) return `<li><div class="row between"><b>${S.difficulty[d].name}</b><small class="muted">${D.diffEmpty}</small></div></li>`;
    const wins = mine.filter((r) => r.status === 'victory').length;
    const cycles = mine.filter((r) => r.fights !== undefined).map((r) => (r.cycle ?? 0) + 1);
    return `<li><div class="row between"><b>${S.difficulty[d].name}</b><b>${S.profile.winRate(Math.round((wins / mine.length) * 100))}</b></div>
      <small class="muted">${D.diffLine(mine.length, wins)}${cycles.length ? ` · ${D.diffBest(Math.max(...cycles))}` : ''}</small></li>`;
  }).join('')}</ul>`;
}

function setPlayerName(raw: string): void {
  profile = { ...profile, playerName: cleanPlayerName(raw) };
  saveProfile(storage, profile);
}

/** Pergunta o nome uma vez, na primeira entrada no Roleta ou no Caminho Ninja. O Laboratório não pergunta. */
async function ensurePlayerName(): Promise<void> {
  if (profile.playerName !== undefined || LAB.lab) return;
  setPlayerName(await askPlayerName());
}

/** O que a Jornada usa do protótipo: armazenamento, preferências, perfil e som. */
const jornadaHost: JornadaHost = {
  storage,
  instant: () => settings.instant,
  nextSeed: () => nextRunSeed() ?? Math.floor(Math.random() * 2 ** 31),
  unlocked: () => new Set(Object.keys(profile.achievements)),
  unlock: (ids) => {
    if (!ids.length || LAB.lab) return;
    profile = unlockAchievements(profile, ids, new Date());
    saveProfile(storage, profile);
    const name = (id: string) => S.jornada.achievements.list[id]?.name ?? S.achievements.list[id]?.name ?? id;
    ids.forEach((id, i) => setTimeout(() => toast(S.achievements.unlocked(name(id)), 'medal'), i * 2800));
  },
  difficulty: () => settings.difficulty,
  setDifficulty: (d) => {
    settings.difficulty = d;
    saveSettings();
  },
  mood,
  ensurePlayerName,
  playerName: () => profile.playerName ?? '',
  setSheet: (open) => {
    jornadaSheet = open;
    syncSheetBtn();
  },
  discoverRelics: (ids) => {
    if (LAB.lab) return;
    const next = discoverRelics(profile, ids, new Date());
    if (next === profile) return;
    profile = next;
    saveProfile(storage, profile);
  },
  jornadaRecord: () => profile.jornada?.generic ?? null,
  recordJornada: (run) => {
    if (LAB.lab || run.mode !== 'generic') return false;
    const next = recordJornadaReach(profile, reachOf(run));
    if (next === profile) return false;
    profile = next;
    saveProfile(storage, profile);
    return true;
  },
  recentAchievements: (limit, onlyJornada = false) =>
    Object.entries(profile.achievements)
      .filter(([id]) => !onlyJornada || id in S.jornada.achievements.list)
      .sort((x, y) => y[1].localeCompare(x[1]))
      .slice(0, limit)
      .map(([id, at]) => {
        const t = S.jornada.achievements.list[id] ?? S.achievements.list[id];
        return { name: t?.name ?? id, desc: t?.desc ?? '', days: Math.max(0, Math.floor((Date.now() - Date.parse(at)) / 86_400_000)) };
      }),
  notify: (text, ico = 'sparkle') => toast(text, ico),
};

void main();
