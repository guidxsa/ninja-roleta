// Protótipo jogável: interface mínima sobre o core real. Toda regra vem de src/core; aqui só há fluxo e animação.
import {
  actionItemId,
  actionTechniqueId,
  attackPreview,
  attackTechniques,
  availableActions,
  activeUses,
  canCopyIncoming,
  canFreeActive,
  copyTarget,
  forcedGate,
  sealTarget,
  FREE_ACTIVES,
  possessionOptions,
  freeActiveCost,
  previewExtras,
  devourPreview,
  shadowStrangleDamage,
  techniqueCost,
  type FreeActive,
  canFocus,
  canGenius,
  restChakra,
  canUseTechnique,
  elementalStateOf,
  gatesHpCost,
  gatesToOpen,
  geniusUses,
  isIllusion,
  itemAction,
  playerMedical,
  playerTechnique,
  playRound,
  reactionPreview,
  reactionTechniqueId,
  resumeRound,
  sharinganStage,
  techAction,
  startBattle,
  villainResistance,
  type BattleOptions,
  type BattleState,
  type PendingReaction,
  type PlayerAction,
  type ReactionChoice,
  type RoundExtras,
} from '../src/core/combat';
import { critChance, hitSlices } from '../src/core/hit';
import { lineageOf, rollOrigin, type OriginStep } from '../src/core/origin';
import { scaleVillain, type Difficulty } from '../src/core/difficulty';
import {
  canLevelUp,
  canUseType,
  createPlayer,
  equipTrainingWeights,
  fullRestore,
  recoverAfterWin,
  knownTechniques,
  gainXp,
  gatesStage,
  medicalHealPct,
  removeTrainingWeights,
  techniqueLevel,
  techniqueSlot,
  trainingWeightsWin,
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
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  applyTraining,
  chooseUpgrade,
  examRecover,
  forfeitUpgrade,
  HANDS,
  levelUp,
  playJokenpo,
  rewardItemSpins,
  rollAkatsuki,
  rollGuru,
  rollItem,
  rollPremiumChoices,
  rollReward,
  rollRewardChoices,
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
} from '../src/core/progression';
import type { Rng } from '../src/core/rng';
import type { AttackType, ConsumableId, Element, LineageTier, Origin, SummonAnimal } from '../src/core/types';
import { CONSUMABLES, type RewardId } from '../src/data/events';
import { campaign, type Stage } from '../src/data/campaign';
import { gameData as data } from '../src/data/index';
import { ptBR as S } from '../src/data/strings/ptBR';
import { villainsById } from '../src/data/villains';
import {
  isHardcoreUnlocked,
  loadRuns,
  markAbandonedRuns,
  startRun,
  updateRun,
  type KeyValueStorage,
  type RunStatus,
} from '../src/state/runHistory';
import { clanSymbol, icon, ninjaPortrait, villainPortrait } from './art';
import { defeat, installAudio, mood, setMusic, setSfx, victory, type Mood } from './audio';
import {
  lines,
  conditionChip,
  ELEMENT_COLORS,
  ELEMENT_ICON,
  elementChip,
  fxConditions,
  playerTechTip,
  techIconName,
  villainTechElement,
  villainTechTip,
  type Condition,
} from './tips';
import { installTooltips, tip } from './tooltip';
import { createWheel, stripRoulette, type WheelSlice } from './wheel';

// ---------------------------------------------------------------------------
// Infra

/** Versão do jogo (package.json), embutida pelo build. */
declare const __VERSION__: string;
const VERSION = typeof __VERSION__ === 'undefined' ? 'dev' : __VERSION__;

const rng: Rng = () => Math.random();

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
  /** Tema escolhido no botão; sem escolha, segue o aparelho. */
  theme?: Theme;
}
const settings: Settings = (() => {
  try {
    const saved = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>;
    const difficulty = saved.difficulty && DIFFICULTIES.includes(saved.difficulty) ? saved.difficulty : DEFAULT_DIFFICULTY;
    const theme = saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : undefined;
    return { instant: Boolean(saved.instant), difficulty, sfx: saved.sfx !== false, music: Boolean(saved.music), theme };
  } catch {
    return { instant: false, difficulty: DEFAULT_DIFFICULTY, sfx: true, music: false };
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function h(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

/** Botão desligado. As células de ação usam `aria-disabled` (e não `disabled`) para a dica abrir mesmo assim. */
const isOff = (btn: HTMLElement) => (btn as HTMLButtonElement).disabled || btn.getAttribute('aria-disabled') === 'true';

/** Espera um clique em qualquer `[data-choice]` dentro de `root` e devolve o valor. */
function choose<T extends string>(root: HTMLElement): Promise<T> {
  return new Promise((resolve) => {
    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-choice]');
      if (!btn || !root.contains(btn) || isOff(btn)) return;
      root.removeEventListener('click', onClick);
      resolve(btn.dataset.choice as T);
    };
    root.addEventListener('click', onClick);
  });
}

const screen = document.getElementById('screen')!;
function show(el: HTMLElement): HTMLElement {
  screen.replaceChildren(el);
  window.scrollTo({ top: 0 });
  return el;
}

// ---------------------------------------------------------------------------
// Textos e cores

/** Fatias das roletas: laranja, verde do colete, azul do chakra, vermelho, areia, roxo, verde-água e marinho. */
const PALETTE = ['#f28c28', '#6f9a3e', '#2f80dc', '#c62828', '#d4a253', '#8e5bb5', '#2a9d8f', '#3d4f8a'];
const TIER_COLORS: Record<LineageTier, string> = { common: '#6b6f80', clan: '#2f80dc', rare: '#e8a21c' };
const SIDE_COLORS = { player: '#2f80dc', villain: '#c62828', miss: '#6b6f80', hit: '#3fae6a', crit: '#e6b91e', foeHit: '#e8742c' };

const villainName = (id: string) => S.villains[id] ?? id;
const techName = (id: string): string => {
  // Cópia (Uchiha): `copy:<vilão>.<técnica>`.
  if (id.startsWith('copy:')) return `${techName(id.slice(id.indexOf('.') + 1))} (cópia)`;
  return S.techniques[id] ?? id;
};
const ACTIVE_ICON: Record<string, string> = {
  gates: 'gates',
  expansion: 'expansion',
  effort: 'weights',
  beast: 'beast',
  plague: 'poison',
  transmission: 'intent',
  seal: 'scroll',
};
/** Chip de elemento com ícone; `withTip` = false dentro de botões (o botão já tem a própria dica). */
const elChip = (el: Element | null, withTip = true) => elementChip(el, withTip);
/** Nível de técnica em algarismos romanos (I, II, III...). */
const roman = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] ?? String(n);

/** Elemento da técnica de um lado (para o ícone e a cor no log). */
function techElement(s: BattleState, side: 'player' | 'villain', id: string): Element | null {
  if (side === 'player') return data.techniquesById[id] ? playerTechnique(s.player, id, data).element : null;
  const tech = s.villain.def.techniques.find((t) => t.id === id);
  if (!tech || tech.type === 'taijutsu') return null;
  return tech.element === undefined ? s.villain.def.element : tech.element;
}

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
  container.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(e)}</div>`);
  mood(effectMood(e));
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
    case 'secondaryElement':
      return e.techniqueId
        ? E.secondaryElementTech(S.elements[e.element], techName(e.techniqueId))
        : E.secondaryElement(S.elements[e.element]);
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
  stageIndex: number;
  mods: NextFightMods;
}

let camp: Campaign | null = null;
const NO_MODS: NextFightMods = { villainStartsFirst: false, playerStartsFirst: false };

function track(patch: { status?: RunStatus; furthestStage?: number; difficulty?: Difficulty }) {
  if (!camp) return;
  updateRun(storage, camp.runId, { ...patch, revivesUsed: camp.player.revivesUsed }, new Date(), data.balance.history.maxRuns);
}

function applyStep(step: Step) {
  if (!camp) return;
  camp.player = step.player;
  camp.mods = { ...camp.mods, ...step.mods };
}

// ---------------------------------------------------------------------------
// Componentes

function bar(kind: 'hp' | 'ck', cur: number, max: number): string {
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  const low = kind === 'hp' && pct <= 30 ? ' low' : kind === 'hp' && pct <= 60 ? ' mid' : '';
  const name = S.stats[kind === 'hp' ? 'hp' : 'chakra'];
  return `<div class="bar bar-${kind}${low}" data-bar="${kind}"${tip(name, S.tips.stats[kind === 'hp' ? 'hp' : 'chakra'])}><div class="fill" style="width:${pct}%"></div><span>${name} ${cur}/${max}</span></div>`;
}

function setBar(root: HTMLElement, kind: 'hp' | 'ck', cur: number, max: number) {
  const el = root.querySelector<HTMLElement>(`[data-bar="${kind}"]`);
  if (el) el.outerHTML = bar(kind, Math.max(0, Math.round(cur)), max);
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

/** Ícone da técnica do jogador: elemento, ou o tipo (taijutsu, genjutsu, médico, barreira). */
function techIcon(p: PlayerState, id: string): string {
  const t = playerTechnique(p, id, data);
  return icon(techIconName(t.type, t.element, { medical: techniqueSlot(t) === 'medical', barrier: t.barrier !== undefined }));
}

/** Classes e cor de uma célula de técnica (tipo + elemento). */
function techLook(type: string, element: Element | null): { cls: string; style: string } {
  return {
    cls: `type-${type}${element ? ` el-${element}` : ''}`,
    style: element ? ` style="--c:${ELEMENT_COLORS[element]}"` : '',
  };
}

function techniqueRows(p: PlayerState): string {
  return knownTechniques(p, data)
    .map((t) => {
      const slot = techniqueSlot(t);
      const tech = playerTechnique(p, t.id, data);
      let info: string;
      if (slot === 'medical') info = S.ui.heal;
      else if (t.mental) info = S.ui.mentalStrength(t.mentalStrength ?? 1);
      else if (tech.barrier !== undefined) info = S.ui.barrierHint(tech.barrier, Boolean(t.reflectPct));
      else if (t.state) info = S.ui.armorHint;
      else if (t.devour) info = S.ui.devourInfo;
      else if (t.shadowStrangle) info = S.ui.strangleInfo;
      else info = S.ui.techLine(tech.baseDamage, t.hits ?? 1, Math.round((t.accuracy ?? data.balance.hit.defaultAccuracy) * 100));
      if (t.chakraDrain) info += ` · ${S.ui.drain(t.chakraDrain)}`;
      if (t.requiresDojutsu) info += ` · ${S.ui.requires(S.dojutsu[t.requiresDojutsu]!.name)}`;
      const lvl = ` <span class="lvl">${roman(techniqueLevel(p, t.id, data))}</span>`;
      const look = techLook(slot, tech.element);
      return `<li class="tech-card ${look.cls}"${look.style}${playerTechTip(p, t.id)}><span class="tc-ico">${techIcon(p, t.id)}</span><span class="tc-txt"><b>${esc(techName(t.id))}${lvl}</b><small>${S.actions[slot]} · ${info} · ${S.ui.cost(tech.chakraCost)}</small></span></li>`;
    })
    .join('');
}

interface PassiveEntry {
  ico: string;
  name: string;
  desc: string;
}

/** Passiva da origem (uma entrada por mecânica, quando ela junta várias) e as do jinchuuriki. */
function passiveTraitEntries(p: PlayerState): PassiveEntry[] {
  const passive = S.passives[p.passive];
  const traits = S.passiveTraits[p.passive] ?? (passive ? [passive] : []);
  const out: PassiveEntry[] = traits.map((t) => ({ ico: clanSymbol(p.origin.lineageId), ...t }));
  if (p.jinchuuriki) {
    out.push({ ico: clanSymbol('jinchuuriki'), ...S.passives.jinchuuriki! });
    out.push({ ico: icon('genjutsuImmune'), ...S.passives.innerDemon! });
  }
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

function passiveEntries(p: PlayerState): PassiveEntry[] {
  const out: PassiveEntry[] = passiveTraitEntries(p);
  const item = (ico: string, name: string, desc: string) => out.push({ ico, name, desc });
  const active = p.active ? S.actives[p.active] : null;
  if (active) {
    const stage = gatesStage(p, data);
    const next = data.balance.gates.stages[stage];
    const gates = p.active === 'gates' ? ` (${stage ? S.gatesStage(stage) : '—'}${next ? ` · ${S.ui.gatesLocked(next.minTaijutsu)}` : ''})` : '';
    const ico = ACTIVE_ICON[p.active!] ?? 'ninjutsu';
    item(icon(ico), active.name + gates, active.desc);
  }
  if (p.dojutsu) {
    const d = S.dojutsu[p.dojutsu]!;
    const stage = sharinganStage(p, data);
    item(icon(p.dojutsu), stage ? `${d.name} (${S.sharinganStage(stage)})` : d.name, d.desc);
  }
  // Ativas extras do kit: Pílulas do clã (Akimichi) e Cópia (Uchiha).
  if (p.active === 'expansion') item(icon('pill'), S.actives.pills!.name, S.actives.pills!.desc);
  if (p.dojutsu === 'sharingan') item(icon('sharingan'), S.actives.copy!.name, S.actives.copy!.desc);
  // Despertar já alcançado (níveis 4 e 7).
  const awakening = S.awakening[p.origin.lineageId ?? 'common'] ?? {};
  for (const level of [4, 7]) {
    if (p.level >= level && awakening[level]) item(clanSymbol(p.origin.lineageId), S.ui.awakeningTitle(level), awakening[level]!);
  }
  if (p.focusUses > 0) item(icon('focus'), S.talents.focus.name, S.talents.focus.desc(p.focusUses));
  if (p.substitutionBonus > 0) item(icon('substitution'), S.talents.substitution.name, S.talents.substitution.desc(p.substitutionBonus));
  if (p.shadowClonesLevel > 0) item(icon('clones'), S.talents.shadowClones.name, S.talents.shadowClones.desc(p.shadowClonesLevel));
  if (p.glimmerLevel > 0) item(icon('amuletSpeed'), S.talents.glimmer.name, S.talents.glimmer.desc(p.glimmerLevel));
  if (p.pendingUpgrades > 0) item(icon('scroll'), S.ui.upgradeTitle, S.ui.upgradesPending(p.pendingUpgrades));
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

function playerPanel(p: PlayerState, mods: NextFightMods = NO_MODS): string {
  const passives = passiveItems(p, 'p').join('');
  return `
  <section class="card player-panel">
    <div class="panel-head">
      ${avatar(p)}
      <div class="panel-id">
        <b class="name"${lineageTip(p)}>${originLabel(p.origin)}</b>
        <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(p.level)}</span>${p.affinity ? elChip(p.affinity) : `<span class="chip"${tip(S.ui.noAffinity, S.tips.noElement)}>${S.ui.noAffinity}</span>`}${jinChip(p)}${camp ? diffChip(camp.difficulty) : ''}</div>
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
    ${mods.villainStartsFirst || mods.playerStartsFirst ? `<div class="mods"><small>${S.ui.nextFight}</small> ${modChips(mods)}</div>` : ''}
  </section>`;
}

// ---------------------------------------------------------------------------
// Ficha ninja (janela à parte): retrato, atributos, técnicas, bolsa e passivas

const SUMMON_ICONS: Record<SummonAnimal, string> = { toad: 'toad', snake: 'snake', slug: 'slug' };

function bagSlots(p: PlayerState): string {
  const B = S.bag;
  const slot = (ico: string, name: string, desc: string, qty: string) =>
    `<li class="slot slot-${ico}"${tip(name, desc)}><i>${icon(ico)}</i><b>${name}</b>${qty ? `<em>${qty}</em>` : ''}<small>${desc}</small></li>`;
  const filled: string[] = [];
  if (p.revives > 0) filled.push(slot('willOfFire', B.revive.name, B.revive.desc, `×${p.revives}`));
  const icons: Record<ConsumableId, string> = { soldierPill: 'pill', medKit: 'kit', explosiveTag: 'tag', smokeBomb: 'smoke' };
  for (const id of CONSUMABLES) {
    if (p.bag[id] > 0) filled.push(slot(icons[id], S.consumables[id]!.name, S.consumables[id]!.desc, `×${p.bag[id]}`));
  }
  if (p.coins > 0) filled.push(slot('coin', B.coin.name, B.coin.desc, `×${p.coins}`));
  if (p.trainingWeights !== 'none') filled.push(slot('weights', B.weights.name, B.weights.desc[p.trainingWeights] ?? '', ''));
  if (p.ninjaToolLevel > 0) {
    const dmg = p.ninjaToolLevel * data.balance.ninjaTool.baseDamagePerLevel;
    filled.push(slot('blade', B.ninjaTool.name, B.ninjaTool.desc(dmg), `${S.ui.level}${p.ninjaToolLevel}`));
  }
  if (p.amulets.speed > 0) {
    filled.push(slot('amuletSpeed', B.speedAmulet.name, B.speedAmulet.desc(p.amulets.speed), `×${p.amulets.speed}`));
  }
  if (p.amulets.resistance > 0) {
    const n = p.amulets.resistance;
    filled.push(slot('amuletRes', B.resistanceAmulet.name, B.resistanceAmulet.desc(n), `×${n}`));
  }
  if (p.summon) {
    const name = S.summons[p.summon.animal]!.name;
    filled.push(slot(SUMMON_ICONS[p.summon.animal], B.summon.name, `${B.summon.desc(name)} ${summonEffect(p)}`, `${S.ui.level}${p.summon.level}`));
  }
  const scrolls = Object.values(p.techniqueLevels).reduce((a, b) => a + (b ?? 0), 0);
  if (scrolls > 0) filled.push(slot('scroll', B.scrolls.name, B.scrolls.desc(scrolls), `×${scrolls}`));
  const empty = Math.max(0, 6 - filled.length);
  return filled.join('') + `<li class="slot empty"><span>${S.ui.bagEmpty}</span></li>`.repeat(empty);
}

/** Durante a luta, o jogador "vivo" está no estado da batalha, não na campanha. */
let battlePlayer: (() => PlayerState) | null = null;

function sheetHtml(c: Campaign): string {
  const p = battlePlayer?.() ?? c.player;
  const crit = critChance(p.critBonus, data.balance.crit);
  const passives = [
    ...passiveItems(p, 'li'),
    p.summon
      ? `<li><span class="pi-ico">${icon(SUMMON_ICONS[p.summon.animal])}</span><span><b>${S.summons[p.summon.animal]!.name}</b> · ${S.summons[p.summon.animal]!.desc}</span></li>`
      : '',
  ].join('');
  const elements = [p.affinity, ...p.secondaryElements].filter((e): e is Element => Boolean(e));
  const nextFight = c.mods.villainStartsFirst || c.mods.playerStartsFirst;
  return `
    <div class="scroll-paper">
      <span class="hanko" aria-hidden="true">${clanSymbol(p.origin.lineageId)}</span>
      <header class="sheet-head">
        ${avatar(p, 'lg')}
        <div class="sheet-id">
          <h2 class="sheet-name">${originLabel(p.origin)}</h2>
          <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(p.level)}</span>${elements.length ? elements.map((e) => elChip(e)).join('') : `<span class="chip">${S.ui.noAffinity}</span>`}${jinChip(p)}${diffChip(c.difficulty)}</div>
          ${xpBar(p)}
        </div>
      </header>
      ${bar('hp', p.hp, p.maxHp)}
      ${bar('ck', p.chakra, p.maxChakra)}
      <h3 class="sheet-title">${S.ui.attributes}</h3>
      <div class="attrs">
        ${statBox('taijutsu', p.offense.taijutsu)}${statBox('ninjutsu', p.offense.ninjutsu)}${statBox('genjutsu', p.offense.genjutsu)}${statBox('speed', p.speed)}
        ${statBox('physical', p.resistance.physical)}${statBox('mental', p.resistance.mental)}${statBox('crit', S.ui.critTier(crit))}${statBox('hp', p.maxHp)}${statBox('chakra', p.maxChakra)}
      </div>
      <h3 class="sheet-title">${S.ui.bag}</h3>
      <ul class="bag">${bagSlots(p)}</ul>
      <h3 class="sheet-title">${S.ui.techniques}</h3>
      <ul class="techs">${techniqueRows(p)}</ul>
      <p class="tip-hint">${icon('info')} ${S.tips.hint}</p>
      ${passives ? `<h3 class="sheet-title">${S.ui.passives}</h3><ul class="sheet-passives">${passives}</ul>` : ''}
      ${nextFight ? `<h3 class="sheet-title">${S.ui.nextFight}</h3><div class="mods">${modChips(c.mods)}</div>` : ''}
    </div>`;
}

/** Abre a ficha como uma janela à parte, sobre qualquer tela (inclusive no meio da luta). */
function openSheet() {
  if (!camp || document.querySelector('.sheet-wrap')) return;
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

function stageTrail(current: number): string {
  return `<ol class="trail">${campaign
    .map((st, i) => {
      const state = i < current ? 'done' : i === current ? 'current' : 'todo';
      const sub =
        st.kind === 'exam'
          ? `${st.villains.length} lutas`
          : st.villains.length > 1
            ? `${st.villains.length} lutas seguidas`
            : '1 luta';
      const best = st.kind === 'fight' ? Math.max(0, ...st.rewardTiers.map((t) => t ?? 0)) : 0;
      const tier = best > 0 ? ` · ${S.ui.rewardTier(S.rewardTiers[best] ?? '')}` : '';
      const faces = st.kind === 'exam'
        ? `<span class="trail-ico">${icon('scroll')}</span>`
        : `<span class="trail-faces">${st.villains.map((v) => villainPortrait(v, 'sm')).join('')}</span>`;
      return `<li class="${state}"><i>${i < current ? '✓' : i + 1}</i>${faces}<div><b>${stageName(st)}</b><small>${sub}${tier}</small></div></li>`;
    })
    .join('')}</ol>`;
}

function progressDots(current: number) {
  const el = document.getElementById('dots')!;
  el.innerHTML = campaign
    .map((_, i) => `<i class="${i < current ? 'done' : i === current ? 'current' : ''}"></i>`)
    .join('');
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
      <button class="btn" data-choice="reroll">${S.ui.coinReroll(c.player.coins)}</button>
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

function originStepSlices(step: OriginStep): WheelSlice[] {
  const L = S.sliceLabels;
  return step.slices.map((s) => {
    switch (step.kind) {
      case 'jinchuuriki':
        return {
          label: L[s.value]!,
          weight: s.weight,
          color: s.value === 'yes' ? '#e2482f' : TIER_COLORS.common,
          icon: s.value === 'yes' ? clanSymbol('jinchuuriki') : undefined,
        };
      case 'affinity': {
        const el = s.value as Element;
        return { label: S.elements[el], weight: s.weight, color: ELEMENT_COLORS[el], icon: icon(ELEMENT_ICON[el]) };
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
    case 'affinity':
      return `${icon(ELEMENT_ICON[v as Element])}${S.elements[v as Element]}`;
    case 'jinchuuriki':
      return v === 'yes' ? `${clanSymbol('jinchuuriki')}${S.origin.jinchuuriki}` : `${S.origin.jinchuuriki}: ${S.sliceLabels.no}`;
  }
}

async function originScreen(): Promise<void> {
  progressDots(-1);
  for (;;) {
    const roll = rollOrigin(rng, data);
    const runId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    // Hardcore bloqueado (ainda não venceu no Difícil): cai para a dificuldade padrão.
    const hardcoreOk = isHardcoreUnlocked(loadRuns(storage), data.balance.difficulty.hardcoreUnlockedBy);
    if (settings.difficulty === 'hardcore' && !hardcoreOk) settings.difficulty = DEFAULT_DIFFICULTY;
    let player = createPlayer(roll.origin, data, settings.difficulty);
    camp = {
      runId,
      origin: roll.origin,
      player,
      difficulty: settings.difficulty,
      stageIndex: 0,
      mods: { ...NO_MODS },
    };

    const root = show(
      h(`<div class="screen"><h2>${S.ui.title}</h2><div class="chips-line" id="origin-chips"></div><div id="slot"></div><div id="after"></div></div>`),
    );
    const chips = root.querySelector<HTMLElement>('#origin-chips')!;
    const slot = root.querySelector<HTMLElement>('#slot')!;
    for (const step of roll.steps) {
      await bigWheel(slot, S.roulettes[step.kind], originStepSlices(step), step.index);
      chips.insertAdjacentHTML('beforeend', `<span class="chip origin-chip pop">${stepResultText(step)}</span>`);
      await sleep(settings.instant ? 0 : 500);
    }
    // Só registra depois das roletas: o histórico não pode revelar a origem antes da animação.
    startRun(storage, { id: runId, origin: roll.origin, now: new Date() }, data.balance.history.maxRuns);
    slot.innerHTML = playerPanel(player);
    const after = root.querySelector<HTMLElement>('#after')!;
    after.innerHTML = `<div class="difficulty-box">
      <h3>${S.ui.difficulty}</h3>
      <div class="segmented">${DIFFICULTIES.map(
        (d) => `<button class="btn seg diff-${d}" data-diff="${d}" aria-pressed="${d === settings.difficulty}" ${d === 'hardcore' && !hardcoreOk ? 'disabled' : ''}>${d === 'hardcore' && !hardcoreOk ? '🔒 ' : ''}${S.difficulty[d].name}</button>`,
      ).join('')}</div>
      <p class="muted center small" id="diff-desc">${S.difficulty[settings.difficulty].desc}</p>
      ${hardcoreOk ? '' : `<p class="muted center small">${S.ui.hardcoreLocked}</p>`}
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
      saveSettings();
      after.querySelectorAll('[data-diff]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      after.querySelector('#diff-desc')!.textContent = S.difficulty[d].desc;
      slot.innerHTML = playerPanel(player);
    });
    const choice = await choose<'reroll' | 'start'>(after);
    if (choice === 'start') {
      track({ difficulty: camp.difficulty });
      return;
    }
    track({ status: 'reroll', difficulty: camp.difficulty });
  }
}

// ---------------------------------------------------------------------------
// Tela: mapa da campanha

async function mapScreen(): Promise<void> {
  const c = camp!;
  progressDots(c.stageIndex);
  const stage = campaign[c.stageIndex]!;
  const root = show(
    h(`<div class="screen">
      <h2>${S.ui.campaign}</h2>
      ${stageTrail(c.stageIndex)}
      ${stage.kind === 'fight' ? `<div class="foes">${stage.villains.map((v) => villainCard(v)).join('')}</div>` : ''}
      ${playerPanel(c.player, c.mods)}
      <p class="muted small center">${S.ui.carryHint}</p>
      ${c.player.trainingWeights === 'equipped' ? `<button class="btn" data-choice="weights">${icon('weights')} ${S.ui.weightsRemove}</button>` : ''}
      ${c.player.trainingWeights === 'stored' ? `<button class="btn" data-choice="weights">${icon('weights')} ${S.ui.weightsEquip}</button>` : ''}
      <div class="sticky-cta"><button class="btn primary big" data-choice="go">${icon(stage.kind === 'exam' ? 'scroll' : 'swords')} ${stageName(stage)}</button></div>
    </div>`),
  );
  // Os pesos só são equipados ou tirados fora de combate.
  if ((await choose<'go' | 'weights'>(root)) === 'weights') {
    c.player =
      c.player.trainingWeights === 'stored' ? equipTrainingWeights(c.player, data) : removeTrainingWeights(c.player, data);
    return mapScreen();
  }
}

// ---------------------------------------------------------------------------
// Tela: evento pré-vilão

async function eventScreen(stage: Stage): Promise<void> {
  const c = camp!;
  const root = show(
    h(`<div class="screen">
      <h2>${S.ui.towards(stageName(stage))}</h2>
      <div id="slot"></div><div id="detail"></div><div id="hud"></div><div id="cta"></div>
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
  detail.innerHTML = `<div class="result-card"><h3>${ev.name}</h3><p>${ev.desc}</p></div>`;
  await sleep(settings.instant ? 0 : 400);

  let step: Step;
  switch (roll.value) {
    case 'oldLady':
    case 'ramen':
      step = applySimpleEvent(c.player, roll.value);
      break;
    case 'training': {
      // XP garantido; a roleta escolhe o status em destaque (pesos = os próprios status).
      const out = rollTraining(c.player, rng);
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
  showEffect(detail, step.effect);
  refreshHud(true);
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="go">${icon('swords')} ${S.ui.fight}</button></div>`;
  await choose(cta);
  await levelUps();
}

async function jokenpoFlow(slot: HTMLElement): Promise<Step> {
  const c = camp!;
  const box = h(`<div class="wheel-box"><h3>${S.roulettes.jokenpo}</h3><p class="muted center">${S.ui.chooseHand}</p>
    <div class="hands">${HANDS.map((hand) => `<button class="btn hand" data-choice="${hand}">${S.handIcons[hand]}<small>${S.hands[hand]}</small></button>`).join('')}</div>
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
    duel.innerHTML = `<div><small>${S.ui.you}</small><b>${S.handIcons[choice]}</b></div><span>vs</span><div><small>${S.ui.companion}</small><b>${S.handIcons[HANDS[i % 3]!]}</b></div>`;
    await sleep(90 + i * 15);
  }
  duel.innerHTML = `<div><small>${S.ui.you}</small><b>${S.handIcons[choice]}</b></div><span>vs</span><div><small>${S.ui.companion}</small><b>${S.handIcons[result.roll.value]}</b></div>`;
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
  return applySummonEncounter(c.player, animal.value);
}

// ---------------------------------------------------------------------------
// Tela: combate

interface BattleSetup {
  villainId: string;
  options: Partial<BattleOptions>;
  label: string;
  exam: boolean;
}

type VillainDefT = BattleState['villain']['def'];

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
function villainKit(v: VillainDefT): string {
  return v.techniques
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
function villainCard(id: string): string {
  const v = scaleVillain(villainsById[id]!, camp!.difficulty, data);
  return `<section class="card villain-card">
    <div class="foe-head">${villainPortrait(id, 'lg')}
      <div class="foe-id"><b class="name">${villainName(id)}</b>
        <div class="chips-left">${elChip(v.element)}<span class="chip">${S.stats.hp} ${v.hp}</span><span class="chip">${S.stats.chakra} ${v.chakra}</span></div>
        ${villainStats(Math.floor(v.resistance.physical), Math.floor(v.resistance.mental), v.speed)}
      </div></div>
    <div class="passive-row">${villainPassiveChips(v)}</div>
    <div class="kit">${villainKit(v)}</div>
  </section>`;
}

function villainPanel(s: BattleState): string {
  const v = s.villain.def;
  return `<section class="card villain-panel" id="vcard">
    <div class="foe-head">${villainPortrait(v.id, 'md')}
      <div class="foe-id">
        <div class="row between"><b class="name">${villainName(v.id)}</b>${elChip(v.element)}</div>
        ${bar('hp', s.villain.hp, v.hp)}
        ${bar('ck', s.villain.chakra, v.chakra)}
        <div id="vstats">${villainLiveStats(s)}</div>
      </div>
    </div>
    <div class="passive-row" id="vpassives">${villainPassiveChips(v)}</div>
    <div class="kit" id="vkit">${villainKit(v)}</div>
    <div class="badges" id="vbadges"></div>
  </section>`;
}

/** Atributos do vilão na luta (resistências com manto, névoa etc.). */
function villainLiveStats(s: BattleState): string {
  const res = (kind: 'physical' | 'mental') => Math.floor(villainResistance(s, kind, data));
  return villainStats(res('physical'), res('mental'), s.villain.def.speed);
}

function badgesHtml(s: BattleState, side: 'player' | 'villain'): string {
  const St = S.tips.status;
  const out: Condition[] = [];
  const add = (ico: string, label: string, tone: Condition['tone'], t: { name: string; desc: string }) =>
    out.push({ icon: ico, label, tone, ...t });
  if (side === 'villain') {
    const v = s.villain;
    out.push(...fxConditions(v.fx, 'good'));
    const state = elementalStateOf(s, 'villain', data);
    if (state) add(ELEMENT_ICON[state], S.ui.stateChip(S.elements[state]), '', St.elementalState(S.elements[state]));
    if (v.mistTurns > 0) add('mist', S.ui.mistOn(v.mistTurns), 'bad', St.mist);
    if (v.insaneTimer > 0) add('timer', S.ui.insaneTimer(v.insaneTimer), 'good', St.insaneTimer);
    if (v.lastStand) add('heartbreak', S.ui.lastStand, 'bad', St.lastStand);
    if (v.monster) add('claw', S.ui.monster, 'bad', St.monster);
    if (v.insects > 0) add('poison', S.ui.insects(v.insects), 'good', St.insects);
    if (v.sealed) add('scroll', S.ui.sealedChip(techName(v.sealed.techniqueId), v.sealed.turns), 'good', St.sealed);
    // Golpe carregado: aviso para todos. Gênio (Nara): vê a próxima ação.
    if (v.charging) add('warning', S.ui.charging(techName(v.charging)), 'bad', St.charging);
    else if (s.player.passive === 'genius' && v.intent) {
      const what = v.intent.kind === 'rest' ? S.ui.intentRest : techName(v.intent.id);
      add('intent', S.ui.intent(what), '', St.intent);
    }
    return out.map(conditionChip).join('');
  }
  const fx = s.playerFx;
  out.push(...fxConditions(fx, 'bad'));
  if (fx.dojutsuActive && s.player.dojutsu) {
    const d = S.dojutsu[s.player.dojutsu]!;
    add(s.player.dojutsu, S.ui.dojutsuOn(d.name, fx.dojutsuTurns), 'good', { name: d.name, desc: d.desc });
  }
  if (fx.gatesTurns > 0) add('gates', S.ui.gatesOn(S.gatesStage(fx.gatesStage), fx.gatesTurns), 'good', St.gates);
  if (fx.expansionTurns > 0) add('expansion', S.ui.expansionOn(fx.expansionTurns), 'good', St.expansion);
  if (fx.effortTurns > 0) add('weights', S.ui.effortOn(fx.effortTurns), 'good', St.effort);
  if (fx.beastTurns > 0) add('beast', S.ui.beastOn(fx.beastTurns), 'good', St.beast);
  if (fx.plagueTurns > 0) add('poison', S.ui.plagueOn(fx.plagueTurns), 'good', St.plague);
  if (fx.pillTurns > 0 && fx.pill) add('pill', S.ui.pillOn(S.pills[fx.pill] ?? fx.pill, fx.pillTurns), 'good', St.pill);
  if (fx.exhaustedTurns > 0) add('heartbreak', S.ui.exhausted(fx.exhaustedTurns), 'bad', St.exhausted);
  if (fx.copied) add('sharingan', S.ui.copiedChip(techName(fx.copied)), 'good', St.copied);
  if (fx.clonesArmed) add('clones', S.ui.clonesArmed, 'good', St.clones);
  if (fx.armorTurns > 0) add('armor', S.ui.armorOn(fx.armorTurns), 'good', St.armor);
  if (fx.stance) add('stance', S.ui.stanceOn, 'good', St.stance);
  if (fx.dodge) add('dodge', S.ui.dodge, 'good', St.dodge);
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
    <span class="act-ico">${o.ico}</span><span class="act-txt"><b>${o.title}</b>${o.sub ? `<span>${o.sub}</span>` : ''}<small>${o.extra}</small></span></button>`;
}

const ITEM_ICONS: Record<ConsumableId, string> = { soldierPill: 'pill', medKit: 'kit', explosiveTag: 'tag', smokeBomb: 'smoke' };

function actionButton(s: BattleState, action: PlayerAction, enabled: boolean): string {
  const p = s.player;
  const A = S.tips.actions;
  let title = S.actions[action] ?? action;
  let sub = '';
  let extra = '';
  let cls = `act-${action}`;
  let style = '';
  let ico = icon(action);
  let tipAttr = '';
  const techId = actionTechniqueId(action);
  const itemId = actionItemId(action);
  if (techId) {
    const tech = playerTechnique(p, techId, data);
    const look = techLook(tech.type, tech.element);
    title = esc(techName(techId));
    cls = `act-${tech.type} ${look.cls}`;
    style = look.style;
    ico = techIcon(p, techId);
    tipAttr = playerTechTip(p, techId);
    if (tech.devour) {
      const prev = devourPreview(s, data);
      extra = `${S.ui.devourHint(prev.insects, Math.round(prev.pct * 1000) / 10, prev.damage)} · ${S.ui.cost(techniqueCost(s, tech, data))}`;
    } else if (tech.shadowStrangle) {
      extra = `${S.ui.strangleHint(shadowStrangleDamage(s, data))} · ${S.ui.cost(tech.chakraCost)}`;
    } else if (isIllusion(tech)) {
      extra = `${S.ui.techLine(tech.baseDamage, 1, null)} · ${S.ui.cost(tech.chakraCost)}`;
      if (tech.mental) sub = S.ui.mentalStrength(tech.mentalStrength ?? 1);
    } else if (tech.mental) {
      extra = `${S.ui.mentalStrength(tech.mentalStrength ?? 1)} · ${S.ui.cost(tech.chakraCost)}`;
    } else if (tech.barrier !== undefined) {
      extra = `${S.ui.barrierHint(tech.barrier, Boolean(tech.reflectPct))} · ${S.ui.cost(tech.chakraCost)}`;
    } else if (tech.state) {
      extra = `${S.ui.armorHint} · ${S.ui.cost(tech.chakraCost)}`;
    } else {
      // Dano base e precisão base da técnica; a vantagem elemental aparece só como seta.
      const prev = attackPreview(s, techId, data);
      const elMark = prev.elementMult > 1 ? ` <span class="adv">${S.ui.advantage}</span>` : prev.elementMult < 1 ? ` <span class="dis">${S.ui.disadvantage}</span>` : '';
      const accuracy = Math.round((tech.accuracy ?? data.balance.hit.defaultAccuracy) * 100);
      extra = `${S.ui.techLine(tech.baseDamage, prev.hits, accuracy)}${elMark} · ${S.ui.cost(tech.chakraCost)}`;
    }
    if (tech.chakraDrain) sub = S.ui.drain(tech.chakraDrain);
  } else if (itemId) {
    const it = S.consumables[itemId]!;
    title = `${it.name} ×${p.bag[itemId]}`;
    extra = it.desc;
    cls = 'act-item';
    ico = icon(ITEM_ICONS[itemId]);
    tipAttr = tip(it.name, it.desc);
  } else if (action === 'stance') {
    extra = S.ui.stanceHint;
    tipAttr = tip(title, A.stance);
  } else if (action === 'pass') {
    extra = S.ui.passHint;
    tipAttr = tip(title, A.pass);
  } else if (action === 'medical') {
    const tech = playerMedical(p, data);
    if (tech) {
      const heal = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * medicalHealPct(p, data)));
      sub = esc(techName(tech.id));
      extra = `+${heal} HP · ${S.ui.cost(tech.chakraCost)}`;
      tipAttr = playerTechTip(p, tech.id);
    }
  } else if (action === 'rest') {
    const n = restChakra(p, data);
    extra = `+${n} ck`;
    tipAttr = tip(title, A.rest(n));
  }
  return actionCell({ choice: action, cls, style, ico, title, sub, extra, tip: tipAttr, enabled });
}

type ActionTab = AttackType | 'special' | 'items';

/** Abas de categoria que o jogador usa (taijutsu, ninjutsu, genjutsu), a de ações especiais e a da bolsa. */
function actionTabs(s: BattleState): ActionTab[] {
  const copiedType = s.playerFx.copied ? data.techniquesById[s.playerFx.copied]?.type : undefined;
  const types = (['taijutsu', 'ninjutsu', 'genjutsu'] as AttackType[]).filter((t) => canUseType(s.player, t, data) || t === copiedType);
  const items = CONSUMABLES.some((id) => s.player.bag[id] > 0);
  return [...types, 'special', ...(items ? (['items'] as const) : [])];
}

/** Botões da aba: técnicas da categoria (as que exigem dōjutsu só aparecem com ele ativo) ou as especiais. */
function actionList(s: BattleState, tab: ActionTab): PlayerAction[] {
  const p = s.player;
  if (tab === 'items') return CONSUMABLES.filter((id) => p.bag[id] > 0).map(itemAction);
  if (tab !== 'special') {
    const list = attackTechniques(p, data)
      .filter((t) => t.type === tab && (!t.requiresDojutsu || canUseTechnique(s, { ...t, chakraCost: 0 })))
      .map((t) => techAction(t.id));
    // Técnica copiada pelo Sharingan: fica na aba do tipo dela até o fim da luta.
    const copied = s.playerFx.copied ? data.techniquesById[s.playerFx.copied] : undefined;
    if (copied?.type === tab) list.push(techAction(copied.id));
    return list;
  }
  const list: PlayerAction[] = [];
  if (playerMedical(p, data)) list.push('medical');
  list.push('rest', 'stance');
  return list;
}

/** Painel de reação: Resistir em destaque, com as chances de cada outra opção. */
function reactionButton(s: BattleState, pending: PendingReaction, choice: ReactionChoice): string {
  const prev = reactionPreview(s, pending.incoming, choice, data);
  const A = S.tips.actions;
  switch (prev.kind) {
    case 'resist':
      return actionCell({
        choice,
        cls: 'react',
        primary: true,
        ico: icon('stance'),
        title: S.ui.reactResist,
        extra: S.ui.reactResistHint,
        tip: tip(S.ui.reactResist, A.resist),
      });
    case 'substitution':
      return actionCell({
        choice,
        cls: 'react act-substitution',
        ico: icon('substitution'),
        title: S.ui.reactSubstitution,
        extra: S.ui.reactSubstitutionHint(prev.usesLeft, prev.decoy),
        tip: tip(S.ui.reactSubstitution, A.substitution),
      });
    case 'clash': {
      const id = reactionTechniqueId(choice)!;
      const tech = playerTechnique(s.player, id, data);
      const look = techLook(tech.type, tech.element);
      const title = S.ui.reactClash(esc(techName(id)));
      const [lose, , win] = prev.odds;
      return actionCell({
        choice,
        cls: `react ${look.cls}`,
        style: look.style,
        ico: techIcon(s.player, id),
        title,
        extra: `${S.ui.reactClashHint(win > lose + 0.1 ? 'good' : lose > win + 0.1 ? 'bad' : 'even')} · ${S.ui.cost(tech.chakraCost)}`,
        tip: tip(title, A.clash),
      });
    }
  }
}

function floatNumber(card: HTMLElement | null, text: string, cls: string) {
  if (!card) return;
  const f = h(`<div class="float ${cls}">${text}</div>`);
  card.appendChild(f);
  card.classList.remove('shake');
  if (cls === 'dmg' || cls === 'crit') {
    void card.offsetWidth;
    card.classList.add('shake');
  }
  setTimeout(() => f.remove(), 1100);
}

async function battleScreen(setup: BattleSetup): Promise<BattleState> {
  const c = camp!;
  const villain = scaleVillain(villainsById[setup.villainId]!, c.difficulty, data);
  // A interface escolhe a reação do jogador: a rodada para quando há mais de uma opção.
  let state = startBattle(c.player, villain, { ...setup.options, interactive: true }, data, rng);
  battlePlayer = () => state.player;

  const root = show(
    h(`<div class="screen battle">
      <div class="battle-head"><span>${icon('swords')} ${setup.label}</span><span id="round">${S.ui.round(0)}</span></div>
      <div id="vslot">${villainPanel(state)}</div>
      <div id="dice" class="dice"></div>
      <ol id="log" class="log"></ol>
      <section class="card player-mini" id="pcard">
        <div class="panel-head">${avatar(c.player)}<div class="panel-id"><b class="name"${lineageTip(c.player)}>${S.ui.you} · ${originLabel(c.origin)}</b>
          <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(c.player.level)}</span>${elChip(c.player.affinity)}${jinChip(c.player)}</div></div>
          <button class="btn small sheet-btn" data-sheet aria-label="${S.ui.sheet}">${icon('scroll')}</button></div>
        ${bar('hp', state.player.hp, state.player.maxHp)}
        ${bar('ck', state.player.chakra, state.player.maxChakra)}
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

  const log = (text: string, cls = '') => {
    logEl.insertAdjacentHTML('afterbegin', `<li class="${cls}">${text}</li>`);
    while (logEl.children.length > 30) logEl.lastElementChild!.remove();
  };
  let kitOf: BattleState['villain']['def'] | null = state.villain.def;
  const renderBadges = (s: BattleState) => {
    root.querySelector('#vbadges')!.innerHTML = badgesHtml(s, 'villain');
    root.querySelector('#pbadges')!.innerHTML = badgesHtml(s, 'player');
    root.querySelector('#vstats')!.innerHTML = villainLiveStats(s);
    // O vilão pode trocar de ficha no meio da luta (Shukaku): refaz técnicas e passivas.
    if (s.villain.def !== kitOf) {
      kitOf = s.villain.def;
      root.querySelector('#vkit')!.innerHTML = villainKit(s.villain.def);
      root.querySelector('#vpassives')!.innerHTML = villainPassiveChips(s.villain.def);
    }
  };
  let tab: ActionTab = 'taijutsu';
  let current = state;
  let enabledNow = false;
  /** Escolhas grátis armadas para a próxima jogada (foco, clones, pavor). */
  let extras: RoundExtras = {};
  const renderActions = (s: BattleState, enabled: boolean) => {
    current = s;
    enabledNow = enabled;
    // Ações e números como ficam com as escolhas grátis já marcadas (ex.: Sharingan aceso libera o Tsukuyomi).
    const view = previewExtras(s, extras, data);
    // A Cópia só depende do Sharingan: vale com ele aceso nesta mesma rodada.
    const lit = extras.dojutsu ? previewExtras(s, { dojutsu: true }, data) : s;
    const avail = availableActions(view, data);
    // A ação já foi gasta numa reação: só o botão de passar a vez.
    if (avail.length === 1 && avail[0] === 'pass') {
      actionsEl.innerHTML = `<div class="act-grid">${actionButton(s, 'pass', enabled)}</div>`;
      return;
    }
    const tabs = actionTabs(view);
    if (!tabs.includes(tab)) tab = tabs[0]!;
    const tabLabel = (t: ActionTab) => (t === 'special' ? S.ui.special : t === 'items' ? S.ui.bag : S.actions[t]);
    const tabIcon = (t: ActionTab) => icon(t === 'special' ? 'swords' : t === 'items' ? 'item' : t);
    const tabTip = (t: ActionTab) => {
      const info = S.tips.types[t];
      return info ? tip(info.name, info.desc) : '';
    };
    const tabsHtml = `<div class="act-tabs" role="tablist">${tabs
      .map((t) => `<button class="act-tab tab-${t}${t === tab ? ' on' : ''}" role="tab" aria-selected="${t === tab}" data-tab="${t}"${tabTip(t)}>${tabIcon(t)}<span>${tabLabel(t)}</span></button>`)
      .join('')}</div>`;
    const buttons = actionList(view, tab)
      .map((a) => actionButton(view, a, enabled && avail.includes(a)))
      .join('');
    const toggle = (key: keyof RoundExtras, ico: string, label: string, armedLabel: string, hint: string) =>
      `<button class="btn focus-btn${extras[key] ? ' on' : ''}" data-extra="${key}" aria-pressed="${Boolean(extras[key])}" ${enabled ? '' : 'aria-disabled="true"'}${tip(label, hint)}>${icon(ico)}<span>${extras[key] ? armedLabel : label}<small>${hint}</small></span></button>`;
    /** Dōjutsu, portões e expansão: ativas grátis (não gastam o turno). */
    /** A ativa aparece se há chakra para ela junto com as outras já marcadas (ou se já está marcada). */
    const affordable = (st: BattleState, kind: FreeActive): boolean => Boolean(extras[kind]) || canFreeActive(st, kind, 'pass', data, extras);
    const freeActiveToggle = (st: BattleState, kind: 'dojutsu' | 'gates' | 'expansion'): string => {
      const p = st.player;
      const cost = freeActiveCost(st, kind, data);
      if (cost === null || !affordable(st, kind)) return '';
      if (kind === 'dojutsu' && p.dojutsu) {
        const stage = sharinganStage(p, data);
        const name = S.dojutsu[p.dojutsu]!.name;
        const label = S.ui.activeFree(stage ? `${name} (${S.sharinganStage(stage)})` : name, cost);
        return toggle('dojutsu', p.dojutsu, label, `${name} ✓`, S.ui.activeFreeHint);
      }
      if (kind === 'gates') {
        const gates = gatesToOpen(p, data)!;
        const hint = `−${gatesHpCost(p, gates.hpCostPct)} HP · ${S.ui.activeFreeHint}`;
        return toggle('gates', 'gates', S.ui.activeFree(S.gatesStage(gates.stage), cost), `${S.gatesStage(gates.stage)} ✓`, hint);
      }
      const hint = `${S.ui.expansionHint} · ${S.ui.activeFreeHint}`;
      return toggle('expansion', 'expansion', S.ui.activeFree(S.actives.expansion!.name, cost), `${S.actives.expansion!.name} ✓`, hint);
    };
    /** Ativas de linhagem com botão próprio (Esforço, Fera, Praga, Transmissão, Cópia, Selamento, Pílulas). */
    const lineageActiveToggle = (
      st: BattleState,
      kind: 'effort' | 'beast' | 'plague' | 'transmission' | 'copy' | 'seal' | 'pills',
    ): string => {
      const p = st.player;
      const cost = freeActiveCost(st, kind, data);
      if (cost === null || !affordable(st, kind)) return '';
      if (kind === 'copy') {
        const label = S.ui.copyFree(cost);
        return toggle('copy', 'sharingan', label, `${S.actives.copy!.name} ✓`, S.ui.copyHint(techName(copyTarget(st)!)));
      }
      if (kind === 'seal') {
        const left = activeUses(p, 'seal', data) - st.playerFx.sealUsed;
        const target = sealTarget(st)!;
        // O alvo só aparece para quem vê a intenção (Gênio) ou quando é um golpe carregado.
        const hint = st.villain.charging ? S.ui.sealHint(techName(target)) : S.ui.sealHintHidden;
        return toggle('seal', 'scroll', S.ui.sealFree(cost, left), `${S.actives.seal!.name} ✓`, hint);
      }
      if (kind === 'pills') return toggle('pills', 'pill', S.ui.pillsFree, `${S.ui.pillsFree} ✓`, S.ui.pillsHint);
      const name = S.actives[kind]!.name;
      if (kind === 'effort') {
        const left = activeUses(p, 'effort', data) - st.playerFx.effortUsed;
        return toggle('effort', 'weights', S.ui.effortFree(left), `${name} ✓`, S.ui.activeFreeHint);
      }
      if (kind === 'plague') return toggle('plague', 'poison', S.ui.activeFree(name, cost), `${name} ✓`, S.actives.plague!.desc);
      if (kind === 'transmission') {
        const left = activeUses(p, 'transmission', data) - st.playerFx.transmissionUsed;
        const label = S.ui.transmissionFree(cost, left);
        return toggle('transmission', 'intent', label, `${name} ✓`, S.ui.transmissionHint(techName(st.villain.charging!)));
      }
      return toggle('beast', 'beast', S.ui.activeFree(name, cost), `${name} ✓`, S.actives.beast!.desc);
    };
    /** Forçar os portões (prodígio): só junto com a abertura, se há um portão além do liberado. */
    const forceGatesToggle = (st: BattleState): string => {
      if (!extras.gates || !forcedGate(st.player, data)) return '';
      const next = forcedGate(st.player, data)!;
      const hint = S.ui.forceGatesHint(S.gatesStage(next.stage));
      const label = S.ui.forceGates;
      return toggle('forceGates', 'gates', label, `${label} ✓`, hint);
    };
    const free = [
      canFocus(s) ? toggle('focus', 'focus', S.ui.focus, S.ui.focusArmed, S.ui.focusHint) : '',
      freeActiveCost(s, 'clones', data) !== null && affordable(s, 'clones')
        ? toggle('clones', 'clones', `${S.ui.clones} · ${S.ui.cost(data.balance.shadowClones.chakraCost)}`, S.ui.clonesArmed, S.ui.clonesHint)
        : '',
      freeActiveToggle(s, 'dojutsu'),
      freeActiveToggle(s, 'gates'),
      freeActiveToggle(s, 'expansion'),
      lineageActiveToggle(s, 'effort'),
      lineageActiveToggle(s, 'beast'),
      lineageActiveToggle(s, 'plague'),
      lineageActiveToggle(s, 'transmission'),
      lineageActiveToggle(lit, 'copy'),
      lineageActiveToggle(s, 'seal'),
      lineageActiveToggle(s, 'pills'),
      forceGatesToggle(s),
      canGenius(s, data)
        ? toggle('genius', 'intent', S.ui.genius, S.ui.geniusArmed, S.ui.geniusHint(geniusUses(s.player, data) - s.playerFx.geniusUsed))
        : '',
    ].join('');
    // Mente no controle (Yamanaka): com o vilão possuído, escolhe a técnica que ele usa em si mesmo.
    const possess =
      s.player.passive === 'mindReading' && s.villain.fx.possessed
        ? possessionOptions(s)
            .map((t) => {
              const on = extras.possession === t.id;
              const label = S.ui.possessionOption(techName(t.id), t.baseDamage * (t.hits ?? 1), t.chakraCost);
              return `<button class="btn focus-btn${on ? ' on' : ''}" data-possess="${t.id}" aria-pressed="${on}" ${enabled ? '' : 'aria-disabled="true"'}${tip(S.passives.mindReading!.name, S.ui.possessionPick)}>${icon('genjutsu')}<span>${label}</span></button>`;
            })
            .join('')
        : '';
    actionsEl.innerHTML = `${tabsHtml}${free || possess ? `<div class="free-row">${free}${possess}</div>` : ''}<div class="act-grid">${buttons}</div>`;
  };
  actionsEl.addEventListener('click', (e) => {
    const possess = (e.target as HTMLElement).closest<HTMLElement>('[data-possess]');
    if (possess && enabledNow && !isOff(possess)) {
      const id = possess.dataset.possess!;
      const { possession: _, ...rest } = extras;
      extras = extras.possession === id ? rest : { ...rest, possession: id };
      renderActions(current, enabledNow);
      return;
    }
    const extra = (e.target as HTMLElement).closest<HTMLElement>('[data-extra]');
    if (extra && enabledNow && !isOff(extra)) {
      const key = extra.dataset.extra as keyof RoundExtras;
      extras = { ...extras, [key]: !extras[key] };
      // Sem o Sharingan, a Cópia marcada nesta rodada cai junto.
      if (key === 'dojutsu' && !extras.dojutsu && !freeActiveCost(current, 'copy', data)) extras.copy = false;
      renderActions(current, enabledNow);
      return;
    }
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
    if (!t) return;
    tab = t.dataset.tab as ActionTab;
    renderActions(current, enabledNow);
  });
  renderBadges(state);
  if (setup.options.villainStartsFirst) log(S.ui.villainFirst, 'sys');
  if (setup.options.playerStartsFirst) log(S.ui.playerFirst, 'sys');

  /** O vilão atacou e há escolha: Resistir em destaque, Substituição, disputa ou barreira. */
  const chooseReaction = async (s: BattleState, pending: PendingReaction): Promise<{ choice: ReactionChoice; copy: boolean }> => {
    const tech = techName(pending.incoming.techniqueId);
    const charged = pending.incoming.charged ? ` <span class="chip bad">${S.ui.charged}</span>` : '';
    const def = s.villain.def.techniques.find((t) => t.id === pending.incoming.techniqueId);
    const techTip = def ? villainTechTip(s.villain.def, def) : '';
    // Cópia (Uchiha): escolha grátis junto com a reação.
    let copy = false;
    const copyBtn = canCopyIncoming(s, data)
      ? `<div class="free-row"><button class="btn focus-btn" data-copy aria-pressed="false"${tip(S.actives.copy!.name, S.ui.copyReactHint)}>${icon('sharingan')}<span>${S.ui.copyReact(data.balance.copy.chakraCost)}</span></button></div>`
      : '';
    actionsEl.innerHTML = `<div class="react-box"><div class="react-head">${villainPortrait(s.villain.def.id, 'sm')}<h3><span class="react-tech"${techTip}>${S.ui.reactTitle(villainName(s.villain.def.id), esc(tech))}</span> ${elChip(pending.incoming.element)}${charged}</h3></div>
      ${copyBtn}<div class="act-grid">${pending.options.map((o) => reactionButton(s, pending, o)).join('')}</div></div>`;
    const btn = actionsEl.querySelector<HTMLElement>('[data-copy]');
    btn?.addEventListener('click', () => {
      copy = !copy;
      btn.classList.toggle('on', copy);
      btn.setAttribute('aria-pressed', String(copy));
    });
    const choice = await choose<ReactionChoice>(actionsEl);
    return { choice, copy };
  };

  while (state.status === 'ongoing') {
    renderActions(state, true);
    const action = await choose<PlayerAction>(actionsEl);
    renderActions(state, false);
    // Só valem as escolhas grátis que combinam com a ação: cada ativa precisa de chakra para ela, para a
    // ação e para as que já entraram (na ordem do dōjutsu, portões, expansão e clones).
    const chosen: RoundExtras = {
      focus: Boolean(extras.focus) && canFocus(state),
      genius: Boolean(extras.genius) && canGenius(state, data),
    };
    if (extras.possession) chosen.possession = extras.possession;
    chosen.forceGates = Boolean(extras.forceGates);
    for (const k of FREE_ACTIVES) {
      const base = k === 'copy' && chosen.dojutsu ? previewExtras(state, { dojutsu: true }, data) : state;
      chosen[k] = Boolean(extras[k]) && canFreeActive(base, k, action, data, chosen);
    }
    chosen.forceGates = Boolean(chosen.gates && chosen.forceGates);
    let next = playRound(state, action, rng, data, chosen);
    // O foco vale só para a jogada; os clones armados ficam no estado da luta.
    extras = {};
    await animateRound(state, next);
    state = next;
    // A rodada parou esperando a reação do jogador: escolhe e continua (pode parar de novo, ex.: Espelhos).
    while (state.pending) {
      renderBadges(state);
      const { choice, copy } = await chooseReaction(state, state.pending);
      renderActions(state, false);
      next = resumeRound(state, choice, rng, data, undefined, { copy });
      await animateRound(state, next);
      state = next;
    }
    renderBadges(state);
  }

  // Resultado
  battlePlayer = null;
  const overlay = root.querySelector<HTMLElement>('#overlay')!;
  const won = state.status === 'won';
  const msg = won ? S.ui.battleWon : setup.exam ? S.ui.examLost : S.ui.battleLost;
  const xpLine = won ? `<p class="xp-gain pop">${S.ui.xpGained(xpGain(state.player, villainsById[setup.villainId]!.xp, data))}</p>` : '';
  // A vitória devolve parte do HP e do chakra (aplicado no fluxo da campanha).
  const healed = won ? recoverAfterWin(state.player, data) : null;
  const recoverLine = healed
    ? `<p class="muted">${S.ui.recoveredAfterWin(healed.hp - state.player.hp, healed.chakra - state.player.chakra)}</p>`
    : '';
  overlay.innerHTML = `<div class="overlay ${won ? 'win' : 'lose'}"><div><h2>${msg}</h2>${xpLine}${recoverLine}
    <p class="muted">${S.ui.round(state.round)}</p>
    <button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div></div>`;
  mood(won ? 'good' : 'bad');
  await choose(overlay);
  return state;

  async function animateRound(prev: BattleState, next: BattleState) {
    const events = next.log.slice(prev.log.length);
    const p0 = prev.player;
    const disp = { php: p0.hp, pck: p0.chakra, vhp: prev.villain.hp, vck: prev.villain.chakra };
    const sync = () => {
      setBar(pcard, 'hp', disp.php, next.player.maxHp);
      setBar(pcard, 'ck', disp.pck, next.player.maxChakra);
      const vc = vcard();
      if (vc) {
        setBar(vc, 'hp', disp.vhp, next.villain.def.hp);
        setBar(vc, 'ck', disp.vck, next.villain.def.chakra);
      }
    };
    const who = (side: 'player' | 'villain') => (side === 'player' ? S.log.you : villainName(next.villain.def.id));
    let critForced = false;
    let villainCritForced = false;

    for (const ev of events) {
      switch (ev.type) {
        case 'round':
          root.querySelector('#round')!.textContent = S.ui.round(ev.round);
          log(`— ${S.ui.round(ev.round)} —`, 'round');
          continue;
        case 'ambush':
          log(S.log.ambush, 'good');
          break;
        case 'late':
          log(S.log.late, 'bad');
          break;
        case 'initiative': {
          const slices = [{ weight: ev.playerChance }, { weight: 1 - ev.playerChance }];
          await stripRoulette(
            dice,
            S.roulettes.initiative,
            [
              { label: S.sliceLabels.player!, weight: slices[0]!.weight, color: SIDE_COLORS.player },
              { label: villainName(prev.villain.def.id), weight: slices[1]!.weight, color: SIDE_COLORS.villain },
            ],
            ev.first === 'player' ? 0 : 1,
            pace.strip(),
          );
          log(S.log.initiative(who(ev.first)));
          break;
        }
        case 'skip':
          log(S.log.skip[ev.reason]!(who(ev.side)), 'sys');
          break;
        case 'priority':
          log(S.log.priority, 'good');
          break;
        case 'charge':
          disp.vck -= ev.chakra;
          floatNumber(vcard(), '⚠', 'crit');
          log(S.log.charge(who('villain'), techName(ev.techniqueId)), 'bad');
          break;
        case 'chargeRelease':
          log(S.log.chargeRelease(who('villain'), techName(ev.techniqueId)), 'bad');
          break;
        case 'wake':
          log(S.log.wake(who(ev.side)), 'sys');
          break;
        case 'confusionFail':
          if (ev.side === 'villain') disp.vhp -= ev.selfHit;
          else disp.php -= ev.selfHit;
          if (ev.selfHit > 0) floatNumber(ev.side === 'villain' ? vcard() : pcard, `−${ev.selfHit} 🌀`, 'dmg');
          log(S.log.confusionFail(who(ev.side), ev.selfHit), ev.side === 'villain' ? 'good' : 'bad');
          break;
        case 'torment':
          if (ev.side === 'villain') disp.vck -= ev.chakra;
          else disp.pck -= ev.chakra;
          log(S.log.torment(who(ev.side), ev.chakra), ev.side === 'villain' ? 'good' : 'bad');
          break;
        case 'mental':
          log(S.log.mental[ev.effect]!(who(ev.target)), ev.target === 'villain' ? 'good' : 'bad');
          break;
        case 'mentalBroken':
          log(S.log.mentalBroken[ev.effect]!(who(ev.side)), ev.side === 'villain' ? 'bad' : 'good');
          break;
        case 'dodge':
          floatNumber(pcard, '💨', 'miss');
          log(S.log.dodge[ev.source]!, 'good');
          break;
        case 'declare':
          // O ataque anunciado aparece no log do acerto; aqui só gasta o chakra do vilão.
          if (ev.side === 'villain') disp.vck -= ev.chakra;
          else disp.pck -= ev.chakra;
          continue;
        case 'reaction': {
          const mine = ev.side === 'player';
          if (mine) disp.pck -= ev.chakra;
          else disp.vck -= ev.chakra;
          if (ev.kind === 'resist') continue;
          const R = S.log.reaction;
          const text =
            ev.kind === 'passive'
              ? R.passive(who(ev.side))
              : ev.kind === 'substitution'
                ? R.substitution(who(ev.side))
                : R[ev.kind](who(ev.side), techName(ev.techniqueId ?? ''));
          log(text, mine ? 'good' : 'bad');
          break;
        }
        case 'substitutionRoll': {
          const mine = ev.side === 'player';
          await stripRoulette(
            dice,
            `${S.roulettes.substitution} · ${who(ev.side)}`,
            [
              { label: S.sliceLabels.dodged!, weight: ev.chance, color: SIDE_COLORS.hit },
              { label: S.sliceLabels.failed!, weight: 1 - ev.chance, color: SIDE_COLORS.miss },
            ],
            ev.success ? 0 : 1,
            pace.strip(),
          );
          if (ev.success) floatNumber(mine ? pcard : vcard(), '💨', 'miss');
          log(S.log.substitutionRoll(who(ev.side), ev.success), ev.success === mine ? 'good' : 'bad');
          break;
        }
        case 'clash': {
          // Cabo de guerra: a cor do elemento de cada lado e a anulação no meio.
          const defender = ev.attacker === 'player' ? 'villain' : 'player';
          const color = (side: 'player' | 'villain', id: string, fallback: string) => {
            const el = techElement(next, side, id);
            return el ? ELEMENT_COLORS[el] : fallback;
          };
          await stripRoulette(
            dice,
            S.roulettes.clash,
            [
              { label: techName(ev.attackTechnique), weight: ev.odds[0], color: color(ev.attacker, ev.attackTechnique, '#ff8a5a') },
              { label: S.sliceLabels.cancel!, weight: ev.odds[1], color: SIDE_COLORS.miss },
              { label: techName(ev.defenseTechnique), weight: ev.odds[2], color: color(defender, ev.defenseTechnique, '#4aa3ff') },
            ],
            ev.result === 'attacker' ? 0 : ev.result === 'cancel' ? 1 : 2,
            pace.strip(),
          );
          const winnerSide = ev.result === 'attacker' ? ev.attacker : defender;
          const text =
            ev.result === 'cancel'
              ? S.log.clash.cancel
              : S.log.clash[ev.result](techName(ev.result === 'attacker' ? ev.attackTechnique : ev.defenseTechnique)) +
                (ev.crushed ? S.log.clash.crushed : '');
          log(text, ev.result === 'cancel' ? 'sys' : winnerSide === 'player' ? 'good' : 'bad');
          break;
        }
        case 'clashHit':
          if (ev.target === 'villain') disp.vhp -= ev.damage;
          else disp.php -= ev.damage;
          floatNumber(ev.target === 'villain' ? vcard() : pcard, `−${ev.damage}`, 'dmg');
          log(S.log.clashHit(who(ev.target), ev.damage), ev.target === 'villain' ? 'mine' : 'theirs');
          break;
        case 'shield':
          if (ev.side === 'player') disp.pck -= ev.chakra;
          else disp.vck -= ev.chakra;
          floatNumber(ev.side === 'player' ? pcard : vcard(), `🛡 ${ev.points}`, 'heal');
          log(S.log.shield(who(ev.side), techName(ev.techniqueId), ev.points), ev.side === 'player' ? 'good' : 'bad');
          break;
        case 'shieldHit': {
          // O dano do golpe já saiu do HP na animação: devolve a parte que o escudo segurou.
          const blocked = Math.round(ev.absorbed / ev.elementMult);
          if (ev.side === 'player') disp.php += blocked;
          else disp.vhp += blocked;
          log(S.log.shieldHit(who(ev.side), ev.absorbed, ev.left, ev.elementMult > 1), ev.side === 'player' ? 'good' : 'bad');
          break;
        }
        case 'shieldBreak':
          log(S.log.shieldBreak(who(ev.side)), ev.side === 'player' ? 'bad' : 'good');
          break;
        case 'shieldEnd':
          log(S.log.shieldEnd(who(ev.side)), 'sys');
          break;
        case 'shieldReflect': {
          const attacker = ev.side === 'player' ? 'villain' : 'player';
          if (attacker === 'villain') disp.vhp -= ev.damage;
          else disp.php -= ev.damage;
          floatNumber(attacker === 'villain' ? vcard() : pcard, `−${ev.damage}`, 'dmg');
          log(S.log.shieldReflect(ev.damage), ev.side === 'player' ? 'good' : 'bad');
          break;
        }
        case 'possessed':
          if (ev.side === 'villain') disp.vhp -= ev.damage;
          else disp.php -= ev.damage;
          floatNumber(ev.side === 'villain' ? vcard() : pcard, `−${ev.damage}`, 'dmg');
          log(S.log.possessed(who(ev.side), techName(ev.techniqueId), ev.damage), ev.side === 'villain' ? 'good' : 'bad');
          break;
        case 'geniusArmed':
          log(S.log.geniusArmed, 'good');
          break;
        case 'genius':
          log(S.log.genius(S.sliceLabels[ev.kept] ?? S.sliceLabels[ev.kept === 'true' ? 'yes' : ev.kept === 'false' ? 'no' : ev.kept] ?? ev.kept), 'good');
          break;
        case 'extinguish':
          log(S.log.extinguish(who(ev.side)), ev.side === 'player' ? 'good' : 'bad');
          break;
        case 'stance':
          log(S.log.stance, 'good');
          break;
        case 'armor':
          disp.pck -= ev.chakra;
          floatNumber(pcard, '⚡', 'heal');
          log(S.log.armor, 'good');
          break;
        case 'armorEnd':
          log(S.log.armorEnd, 'sys');
          break;
        case 'item':
          if (ev.item === 'soldierPill') disp.pck += ev.amount;
          if (ev.item === 'explosiveTag') {
            disp.vhp -= ev.amount;
            floatNumber(vcard(), `−${ev.amount} 💥`, 'crit');
          }
          log(S.log.item[ev.item]!(ev.amount), 'good');
          break;
        case 'expansion':
          disp.pck -= ev.chakra;
          log(S.log.expansion, 'good');
          break;
        case 'expansionEnd':
          log(S.log.expansionEnd, 'sys');
          break;
        case 'effort':
          log(S.log.effort, 'good');
          break;
        case 'effortEnd':
          log(S.log.effortEnd, 'sys');
          break;
        case 'beast':
          disp.pck -= ev.chakra;
          log(S.log.beast, 'good');
          break;
        case 'beastEnd':
          log(S.log.beastEnd, 'sys');
          break;
        case 'plague':
          disp.pck -= ev.chakra;
          log(S.log.plague, 'good');
          break;
        case 'plagueEnd':
          log(S.log.plagueEnd, 'sys');
          break;
        case 'devour':
          disp.vhp -= ev.damage;
          if (ev.damage > 0) floatNumber(vcard(), `−${ev.damage}`, 'dmg');
          log(S.log.devour(ev.insects, ev.damage), 'good');
          break;
        case 'copy':
          disp.pck -= data.balance.copy.chakraCost;
          log(S.log.copy(techName(ev.techniqueId), ev.success), ev.success ? 'good' : 'bad');
          break;
        case 'seal':
          disp.pck -= data.balance.seal.chakraCost;
          log(S.log.seal(techName(ev.techniqueId), ev.turns, ev.charged), 'good');
          break;
        case 'sealEnd':
          log(S.log.sealEnd(techName(ev.techniqueId)), 'sys');
          break;
        case 'toad':
          disp.vhp -= ev.damage;
          floatNumber(vcard(), `−${ev.damage}`, 'dmg');
          log(S.log.toad(ev.damage), 'good');
          break;
        case 'glimmer':
          log(S.log.glimmer, 'good');
          break;
        case 'strangle':
          disp.vhp -= ev.damage;
          floatNumber(vcard(), `−${ev.damage}`, 'dmg');
          log(S.log.strangle(ev.damage), 'good');
          break;
        case 'pill':
          disp.php -= ev.hpLost;
          log(S.log.pill(S.pills[ev.pill] ?? ev.pill, ev.hpLost), 'good');
          break;
        case 'pillEnd':
          log(S.log.pillEnd(S.pills[ev.pill] ?? ev.pill, ev.exhausted), ev.exhausted ? 'bad' : 'sys');
          break;
        case 'exhaustedEnd':
          log(S.log.exhaustedEnd, 'sys');
          break;
        case 'comeback':
          disp.php += ev.healed;
          log(S.log.comeback(ev.healed), 'good');
          break;
        case 'gatesForce':
          disp.php -= ev.hpLost;
          log(S.log.gatesForce(ev.success, ev.hpLost), ev.success ? 'good' : 'bad');
          break;
        case 'transmission':
          disp.pck -= data.balance.transmission.chakraCost;
          log(S.log.transmission(techName(ev.techniqueId), ev.success), ev.success ? 'good' : 'bad');
          break;
        case 'clones':
          disp.pck -= ev.chakra;
          log(S.log.clones, 'good');
          break;
        case 'cloakCost':
          if (ev.side === 'player') disp.pck -= ev.chakra;
          else disp.vck -= ev.chakra;
          log(S.log.cloakCost(who(ev.side), ev.chakra), 'sys');
          break;
        case 'cloakFade':
          log(S.log.cloakFade(who(ev.side)), ev.side === 'villain' ? 'good' : 'bad');
          break;
        case 'villainHeal':
          disp.vhp += ev.healed;
          floatNumber(vcard(), `+${ev.healed}`, 'heal');
          log(S.log.villainHeal(who('villain'), techName(ev.techniqueId), ev.healed), 'bad');
          break;
        case 'poisonUp':
          log(S.log.poisonUp(who(ev.target)), ev.target === 'villain' ? 'good' : 'bad');
          break;
        case 'rest':
          disp.pck += ev.chakra;
          floatNumber(pcard, `+${ev.chakra} ck`, 'ck');
          log(S.log.rest(ev.chakra));
          break;
        case 'gates':
          disp.php -= ev.hpLost;
          disp.pck -= ev.chakra;
          floatNumber(pcard, `−${ev.hpLost}`, 'dmg');
          log(S.log.gates(S.gatesStage(ev.stage), ev.hpLost, ev.chakra), 'good');
          break;
        case 'focus':
          log(S.log.focus, 'good');
          break;
        case 'guaranteedCrit':
          if (ev.side === 'player') critForced = true;
          else villainCritForced = true;
          log(S.log.guaranteedCrit(who(ev.side)), ev.side === 'player' ? 'good' : 'bad');
          break;
        case 'movementReading':
          log(S.log.movementReading(ev.damageBefore, ev.damage), 'good');
          break;
        case 'attack': {
          // O chakra do ataque já saiu no anúncio ('declare').
          const mine = ev.side === 'player';
          if (!(mine ? critForced : villainCritForced)) {
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
          if (mine) critForced = false;
          else villainCritForced = false;
          const el = ev.elementMult > 1 ? S.log.elementAdv : ev.elementMult < 1 ? S.log.elementDis : '';
          const tech = techName(ev.techniqueId);
          if (ev.outcome === 'miss') {
            log(S.log.attackMiss(who(ev.side), tech), 'muted');
            floatNumber(mine ? vcard() : pcard, 'errou', 'miss');
          } else if ((ev.attackType === 'genjutsu' || data.techniquesById[ev.techniqueId]?.mental) && ev.damage === 0) {
            log(S.log.genjutsuHit(who(ev.side), tech), mine ? 'mine' : 'theirs');
          } else {
            if (mine) disp.vhp -= ev.damage;
            else disp.php -= ev.damage;
            log(S.log.attackHit(who(ev.side), tech, ev.damage, ev.outcome === 'crit', el), mine ? 'mine' : 'theirs');
            floatNumber(mine ? vcard() : pcard, `−${ev.damage}`, ev.outcome === 'crit' ? 'crit' : 'dmg');
          }
          break;
        }
        case 'debilitate':
          log(S.log.debilitate[ev.kind]!(who(ev.target), ev.turns ?? 0), ev.target === 'villain' ? 'good' : 'bad');
          break;
        case 'genjutsuImmune':
          log(S.log.genjutsuImmune(who(ev.target)), 'sys');
          break;
        case 'status':
          log(S.log.status[ev.kind]!(who(ev.target)), ev.target === 'villain' ? 'good' : 'bad');
          break;
        case 'burnExtend':
          log(S.log.burnExtend(who(ev.target), ev.turns), ev.target === 'villain' ? 'good' : 'bad');
          break;
        case 'burnTick':
        case 'poisonTick': {
          const icon = ev.type === 'burnTick' ? '🔥' : '🐍';
          if (ev.target === 'villain') disp.vhp -= ev.damage;
          else disp.php -= ev.damage;
          floatNumber(ev.target === 'villain' ? vcard() : pcard, `−${ev.damage} ${icon}`, 'dmg');
          const text = ev.type === 'burnTick' ? S.log.burnTick : S.log.poisonTick;
          log(text(who(ev.target), ev.damage), ev.target === 'villain' ? 'good' : 'bad');
          break;
        }
        case 'burnOut':
          log(S.log.burnOut(who(ev.target)), 'sys');
          break;
        case 'poisonCured':
          log(S.log.poisonCured(who(ev.target)), 'sys');
          break;
        case 'cloak':
          if (ev.side === 'player') log(S.log.cloak.player, 'jin');
          else {
            const passive = next.villain.def.passive;
            const variant = passive?.kind === 'cloak' ? passive.variant : 'beast';
            log(S.log.cloak[variant](who('villain')), 'bad');
          }
          floatNumber(ev.side === 'player' ? pcard : vcard(), '🔥 manto', 'heal');
          break;
        case 'cloakRegen':
          if (ev.side === 'player') disp.php += ev.hp;
          else disp.vhp += ev.hp;
          floatNumber(ev.side === 'player' ? pcard : vcard(), `+${ev.hp}`, 'heal');
          log(S.log.cloakRegen(who(ev.side), ev.hp), ev.side === 'player' ? 'good' : 'bad');
          break;
        case 'mist':
          log(S.log.mist(ev.turns), 'bad');
          break;
        case 'mistEnd':
          log(S.log.mistEnd, 'sys');
          break;
        case 'trickster':
          disp.vhp = 1;
          log(S.log.trickster(who('villain'), ev.counterCrit), 'bad');
          break;
        case 'lastStand':
          disp.vhp = ev.healed;
          floatNumber(vcard(), `+${ev.healed}`, 'heal');
          log(S.log.lastStand(ev.healed, ev.chakra), 'bad');
          break;
        case 'insaneTimer':
          log(S.log.insaneTimer(who('villain'), ev.rounds), 'bad');
          break;
        case 'monster':
          disp.vhp = ev.hp;
          floatNumber(vcard(), `+${ev.hp}`, 'heal');
          log(S.log.monster(ev.hp, ev.chakra), 'bad');
          break;
        case 'insaneRevive':
          disp.vhp = ev.hp;
          floatNumber(vcard(), `🐍 ${ev.hp}`, 'heal');
          log(S.log.insaneRevive(who('villain'), ev.hp, ev.chakra), 'bad');
          break;
        case 'debilitateResisted':
          log(S.log.debilitateResisted(who(ev.target)), 'sys');
          break;
        case 'regen':
          disp.php += ev.hp;
          disp.pck += ev.chakra;
          log(S.log.regen(ev.hp, ev.chakra), 'good');
          break;
        case 'revive':
          disp.php = next.player.maxHp;
          disp.pck = next.player.maxChakra;
          floatNumber(pcard, '❤ retorno', 'heal');
          log(S.log.revive(ev.revivesLeft), 'good');
          break;
        case 'medical':
          disp.pck -= ev.chakra;
          disp.php += ev.healed;
          floatNumber(pcard, `+${ev.healed}`, 'heal');
          log(S.log.medical(ev.healed), 'good');
          break;
        case 'villainRest':
          disp.vck += ev.chakra;
          floatNumber(vcard(), `+${ev.chakra} ck`, 'ck');
          log(S.log.villainRest(who('villain'), ev.chakra), 'sys');
          break;
        case 'summonRegen':
          disp.php += ev.hp;
          floatNumber(pcard, `+${ev.hp}`, 'heal');
          log(S.log.summonRegen(ev.hp), 'good');
          break;
        case 'dojutsu': {
          const name = S.dojutsu[ev.dojutsu]!.name;
          disp.pck -= ev.chakra;
          floatNumber(pcard, `👁 ${name}`, 'heal');
          log(S.log.dojutsu(ev.stage ? `${name} (${S.sharinganStage(ev.stage)})` : name), 'good');
          break;
        }
        case 'dojutsuEnd':
          log(S.log.dojutsuEnd[ev.reason]!(S.dojutsu[ev.dojutsu]!.name), 'sys');
          break;
        case 'chakraDrain':
          disp.vck -= ev.amount;
          floatNumber(vcard(), `−${ev.amount} ck`, 'ck');
          log(S.log.chakraDrain[ev.source]!(ev.amount), 'good');
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
    sync();
  }
}

// ---------------------------------------------------------------------------
// Tela: recompensa

/** Roleta de recompensa na raridade `tier`. A lendária gira 3 vezes e o jogador escolhe 1. */
async function rewardScreen(title: string, tier: number): Promise<void> {
  const c = camp!;
  const tierName = S.rewardTiers[tier] ?? '';
  const root = show(
    h(`<div class="screen"><h2>${title}</h2><p class="center"><span class="chip tier tier-${tier}">${S.ui.rewardTier(tierName)}</span></p>
      <div id="slot"></div><div id="results"></div><div id="hud"></div><div id="cta"></div></div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const results = root.querySelector<HTMLElement>('#results')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  const refreshHud = () => {
    hud.innerHTML = playerPanel(c.player, c.mods);
    hud.firstElementChild?.classList.add('pulse');
  };
  hud.innerHTML = playerPanel(c.player, c.mods);
  const label = (id: RewardId) => S.rewards[id]!;

  let reward: RewardId;
  if (tier >= 3) {
    const choices = rollRewardChoices(c.player, rng, data);
    for (let i = 0; i < choices.length; i++) {
      const r = choices[i]!;
      await bigWheel(slot, `${S.roulettes.reward} · ${S.ui.spinOf(i + 1, choices.length)}`, rollSlices(r, label), r.index);
      await sleep(settings.instant ? 0 : 300);
    }
    const box = h(`<div class="wheel-box"><h3>${S.ui.chooseReward}</h3><div class="act-grid">${choices
      .map((r, i) => `<button class="btn" data-choice="${i}">${label(r.value)}</button>`)
      .join('')}</div></div>`);
    slot.replaceChildren(box);
    reward = choices[Number(await choose(box))]!.value;
  } else {
    reward = (await spinRoll(slot, S.roulettes.reward, () => rollReward(c.player, rng, data), label)).value;
  }

  const steps: Step[] = [];
  if (reward === 'item') {
    const spins = rewardItemSpins(tier, data);
    for (let i = 0; i < spins; i++) {
      await sleep(settings.instant ? 0 : 400);
      const step = await itemFlow(slot);
      applyStep(step);
      steps.push(step);
      showEffect(results, step.effect);
      refreshHud();
    }
  } else {
    const step = applyReward(c.player, reward, tier, rng, data);
    applyStep(step);
    steps.push(step);
    showEffect(results, step.effect);
    refreshHud();
  }
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
  await levelUps();
}

// ---------------------------------------------------------------------------
// XP e subida de nível

/** Ganha o XP do vilão derrotado; cada nível completado mostra a tela de subida. */
async function awardXp(villainId: string): Promise<void> {
  const c = camp!;
  c.player = gainXp(c.player, villainsById[villainId]!.xp, data);
  await levelUps();
}

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
    h(`<div class="screen"><h2>${S.ui.upgradeTitle}</h2><div id="slot"></div><div id="results"></div><div id="hud"></div><div id="cta"></div></div>`),
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
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
}

async function levelUpScreen(): Promise<void> {
  const c = camp!;
  const root = show(
    h(`<div class="screen"><h2>${S.ui.levelUpTitle}</h2><p class="center"><span class="chip tier tier-2">${S.ui.levelLabel(c.player.level + 1)}</span></p>
      <div id="slot"></div><div id="results"></div><div id="hud"></div><div id="cta"></div></div>`),
  );
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods);

  await sleep(settings.instant ? 0 : 300);
  const step = levelUp(c.player, data);
  applyStep(step);
  showEffect(root.querySelector<HTMLElement>('#results')!, step.effect);
  // Despertar da linhagem nos níveis 4 e 7.
  const awakening = S.awakening[c.player.origin.lineageId ?? 'common']?.[c.player.level];
  if (awakening) {
    root
      .querySelector<HTMLElement>('#results')!
      .insertAdjacentHTML('beforeend', `<div class="result-card pop"><h3>${clanSymbol(c.player.origin.lineageId)} ${S.ui.awakeningTitle(c.player.level)}</h3><p>${awakening}</p></div>`);
  }
  hud.innerHTML = playerPanel(c.player, c.mods);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
}

/** Aviso simples entre telas (ex.: restauração do fim do exame). */
async function noticeScreen(title: string, text: string): Promise<void> {
  const c = camp!;
  const root = show(
    h(`<div class="screen"><h2>${title}</h2><div class="effect pop">${text}</div><div id="hud">${playerPanel(c.player, c.mods)}</div>
      <div class="sticky-cta"><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div></div>`),
  );
  await choose(root);
}

// ---------------------------------------------------------------------------
// Fim de run e histórico

async function endScreen(won: boolean, stoppedAt: string | null): Promise<void> {
  const c = camp!;
  progressDots(won ? campaign.length : c.stageIndex);
  (won ? victory : defeat)();
  const root = show(
    h(`<div class="screen end ${won ? 'win' : 'lose'}">
      <div class="end-seal">${won ? clanSymbol(c.player.origin.lineageId) : villainPortrait(campaign[c.stageIndex]!.villains[0]!, 'lg')}</div>
      <h2>${won ? S.ui.victoryTitle : S.ui.defeatTitle}</h2>
      ${stoppedAt ? `<p class="center">${S.ui.defeatBy(stoppedAt)}</p>` : ''}
      <p class="center muted">${S.ui.revivesUsed(c.player.revivesUsed)}</p>
      ${stageTrail(won ? campaign.length : c.stageIndex)}
      ${playerPanel(c.player)}
      <div class="sticky-cta"><button class="btn primary big" data-choice="new">${icon('dice')} ${S.ui.newRun}</button></div>
    </div>`),
  );
  await choose(root);
}

function openHistory() {
  const runs = loadRuns(storage);
  const overlay = h(`<div class="modal"><div class="modal-body">
    <div class="row between"><h2>${S.ui.history}</h2><button class="btn small" data-close>✕</button></div>
    <label class="toggle"><input type="checkbox" id="show-rerolls"> ${S.ui.showRerolls}</label>
    <ul class="history"></ul></div></div>`);
  const list = overlay.querySelector<HTMLElement>('.history')!;
  const render = (withRerolls: boolean) => {
    const shown = runs.filter((r) => withRerolls || r.status !== 'reroll');
    list.innerHTML = shown.length
      ? shown
          .map((r) => {
            const date = new Date(r.startedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const o = r.origin;
            const origin = `${originLabel(o)}${o.affinity ? ` · ${S.elements[o.affinity]}` : ''}${o.jinchuuriki ? ` · ${S.origin.jinchuuriki}` : ''}`;
            const stage = campaign[r.furthestStage];
            const reached = r.status !== 'victory' && r.status !== 'reroll' && stage ? ` · ${S.ui.reachedStage(stageName(stage))}` : '';
            const diff = r.difficulty ? ` ${diffChip(r.difficulty)}` : '';
            return `<li><div class="row between"><b>${origin}</b><span>${diff} <span class="chip st-${r.status}">${S.ui.runStatus[r.status]}</span></span></div>
              <small class="muted">${date}${reached} · ${S.ui.revivesUsed(r.revivesUsed)}</small></li>`;
          })
          .join('')
      : `<li class="muted">${S.ui.historyEmpty}</li>`;
  };
  render(false);
  overlay.querySelector<HTMLInputElement>('#show-rerolls')!.addEventListener('change', (e) => {
    render((e.target as HTMLInputElement).checked);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('[data-close]')) overlay.remove();
  });
  document.body.appendChild(overlay);
}

// ---------------------------------------------------------------------------
// Fluxo da campanha

async function runCampaign(): Promise<void> {
  const c = camp!;
  for (let i = 0; i < campaign.length; i++) {
    const stage = campaign[i]!;
    c.stageIndex = i;
    track({ furthestStage: i });
    await mapScreen();

    if (stage.kind === 'exam') {
      // HP e chakra seguem entre as lutas; perder não gasta a Vontade do Fogo nem encerra a run
      // (os médicos devolvem metade do HP e do chakra). No fim, restaura tudo.
      let wins = 0;
      for (let j = 0; j < stage.villains.length; j++) {
        const result = await battleScreen({
          villainId: stage.villains[j]!,
          options: { allowRevive: false },
          label: `${S.stages.exam} · ${S.ui.fightOf(j + 1, stage.villains.length)}`,
          exam: true,
        });
        c.player = result.player;
        if (result.status === 'won') {
          wins++;
          c.player = recoverAfterWin(c.player, data);
          await awardXp(stage.villains[j]!);
        } else {
          c.player = examRecover(c.player, data);
          await noticeScreen(S.stages.exam, S.ui.examRecovered);
        }
      }
      c.player = fullRestore(c.player);
      await noticeScreen(S.ui.examResult(wins, stage.villains.length), S.ui.examRestored);
      const tier = data.balance.exam.rewardTierByWins[wins] ?? 0;
      if (tier > 0) await rewardScreen(S.ui.examResult(wins, stage.villains.length), tier);
      continue;
    }

    await eventScreen(stage);
    for (let j = 0; j < stage.villains.length; j++) {
      const first = j === 0;
      // A luta não começa restaurada: HP e chakra seguem, inclusive dentro dos blocos.
      const options: Partial<BattleOptions> = first
        ? { villainStartsFirst: c.mods.villainStartsFirst, playerStartsFirst: c.mods.playerStartsFirst }
        : {};
      const result = await battleScreen({
        villainId: stage.villains[j]!,
        options,
        label: `${i + 1}. ${stageName(stage)}${stage.villains.length > 1 ? ` · ${S.ui.fightOf(j + 1, stage.villains.length)}` : ''}`,
        exam: false,
      });
      if (first) c.mods = { ...NO_MODS };
      c.player = result.player;
      if (result.status !== 'won') {
        track({ status: 'defeat' });
        await endScreen(false, villainName(stage.villains[j]!));
        return;
      }
      c.player = trainingWeightsWin(recoverAfterWin(c.player, data), data);
      const finalFight = i === campaign.length - 1 && j === stage.villains.length - 1;
      if (finalFight) break;
      await awardXp(stage.villains[j]!);
      const tier = stage.rewardTiers[j];
      if (tier) await rewardScreen(S.ui.battleWon, tier);
    }
  }
  track({ status: 'victory', furthestStage: campaign.length - 1 });
  await endScreen(true, null);
}

/** Tema aplicado: o escolhido no botão ou o do aparelho. */
const deviceTheme = window.matchMedia?.('(prefers-color-scheme: light)');
const currentTheme = (): Theme => settings.theme ?? (deviceTheme?.matches ? 'light' : 'dark');
const THEME_COLORS: Record<Theme, string> = { dark: '#10121b', light: '#fbf4e3' };

function applyTheme() {
  const theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLORS[theme]));
  const btn = document.getElementById('theme-btn')!;
  // O botão mostra para onde vai: sol à noite, lua de dia.
  const next = theme === 'dark' ? S.ui.themeDay : S.ui.themeNight;
  btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  btn.title = next;
  btn.setAttribute('aria-label', next);
}

/** Botões do cabeçalho: instantâneo, dia/noite, efeitos sonoros e música. */
function installHeaderToggles() {
  applyTheme();
  deviceTheme?.addEventListener?.('change', applyTheme);
  document.getElementById('theme-btn')!.addEventListener('click', () => {
    settings.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    saveSettings();
    applyTheme();
  });

  const toggles = [
    { id: 'instant-btn', key: 'instant', on: 'lightning', off: 'lightning', label: S.ui.instant, apply: () => {} },
    { id: 'sfx-btn', key: 'sfx', on: 'soundOn', off: 'soundOff', label: S.ui.sfx, apply: setSfx },
    { id: 'music-btn', key: 'music', on: 'music', off: 'musicOff', label: S.ui.music, apply: setMusic },
  ] as const;
  for (const t of toggles) {
    const btn = document.getElementById(t.id)!;
    const render = () => {
      const on = settings[t.key];
      btn.innerHTML = icon(on ? t.on : t.off);
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

async function main() {
  markAbandonedRuns(storage, new Date(), data.balance.history.maxRuns);

  installAudio(settings);
  installHeaderToggles();
  document.getElementById('history-btn')!.addEventListener('click', openHistory);
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
  document.getElementById('sheet-btn')!.innerHTML = icon('scroll');
  document.getElementById('history-btn')!.innerHTML = icon('timer');
  installTooltips();

  for (;;) {
    await originScreen();
    await runCampaign();
  }
}

void main();
