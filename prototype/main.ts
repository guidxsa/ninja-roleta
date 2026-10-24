// Protótipo jogável: interface mínima sobre o core real. Toda regra vem de src/core; aqui só há fluxo e animação.
import {
  actionItemId,
  actionTechniqueId,
  attackPreview,
  attackTechniques,
  availableActions,
  canClones,
  canFearVariant,
  canFocus,
  canUseTechnique,
  dojutsuActivationCost,
  elementalStateOf,
  gatesHpCost,
  gatesToOpen,
  incomingDamagePreview,
  itemAction,
  playerGenjutsuHitChance,
  playerGenjutsuTurns,
  playerMedical,
  playerTechnique,
  playRound,
  reactionPreview,
  reactionTechniqueId,
  resumeRound,
  sharinganActive,
  sharinganStage,
  techAction,
  slugHealPct,
  snakePoisonBonus,
  startBattle,
  toadPenetration,
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
  rollPremium,
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
import { createWheel, formatPct, stripRoulette, type WheelSlice } from './wheel';

// ---------------------------------------------------------------------------
// Infra

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
interface Settings {
  instant: boolean;
  difficulty: Difficulty;
}
const settings: Settings = (() => {
  try {
    const saved = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>;
    const difficulty = saved.difficulty && DIFFICULTIES.includes(saved.difficulty) ? saved.difficulty : DEFAULT_DIFFICULTY;
    return { instant: Boolean(saved.instant), difficulty };
  } catch {
    return { instant: false, difficulty: DEFAULT_DIFFICULTY };
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

/** Espera um clique em qualquer `[data-choice]` dentro de `root` e devolve o valor. */
function choose<T extends string>(root: HTMLElement): Promise<T> {
  return new Promise((resolve) => {
    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-choice]');
      if (!btn || !root.contains(btn) || (btn as HTMLButtonElement).disabled) return;
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

const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#ef5a3c',
  wind: '#52c47a',
  lightning: '#e8c23a',
  earth: '#a87b4f',
  water: '#3f8ee8',
};
const PALETTE = ['#ff8a1f', '#4aa3ff', '#4cd07d', '#c070f5', '#f5c542', '#ff5a7a', '#36cfc4', '#8f9bff'];
const TIER_COLORS: Record<LineageTier, string> = { common: '#5b6578', clan: '#4aa3ff', rare: '#f5a524' };

const villainName = (id: string) => S.villains[id] ?? id;
const techName = (id: string) => S.techniques[id] ?? id;
const elChip = (el: Element | null) =>
  el ? `<span class="chip el" style="--c:${ELEMENT_COLORS[el]}">${S.elements[el]}</span>` : '';
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
      return E.critBonus(Math.round(e.amount * 100));
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
      return E.akatsukiInsight(Math.round(e.amount * 100));
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
  return `<div class="bar bar-${kind}${low}" data-bar="${kind}"><div class="fill" style="width:${pct}%"></div><span>${S.stats[kind === 'hp' ? 'hp' : 'chakra']} ${cur}/${max}</span></div>`;
}

function setBar(root: HTMLElement, kind: 'hp' | 'ck', cur: number, max: number) {
  const el = root.querySelector<HTMLElement>(`[data-bar="${kind}"]`);
  if (el) el.outerHTML = bar(kind, Math.max(0, Math.round(cur)), max);
}

function modChips(mods: NextFightMods): string {
  const chips = [];
  if (mods.villainStartsFirst) chips.push(`<span class="chip bad">${S.ui.villainFirst}</span>`);
  if (mods.playerStartsFirst) chips.push(`<span class="chip good">${S.ui.playerFirst}</span>`);
  return chips.join('');
}

function techniqueRows(p: PlayerState): string {
  return knownTechniques(p, data)
    .map((t) => {
      const slot = techniqueSlot(t);
      const tech = playerTechnique(p, t.id, data);
      let info: string;
      if (slot === 'medical') info = S.ui.heal(Math.round(medicalHealPct(p, data) * 100));
      else if (t.mental) info = S.ui.prisonTurns(t.mentalTurns ?? 1);
      else if (tech.barrier !== undefined) info = S.ui.barrierHint(tech.barrier, Boolean(t.reflectPct));
      else if (t.state) info = S.ui.armorHint;
      else info = `${tech.baseDamage}${(t.hits ?? 1) > 1 ? `×${t.hits}` : ''} dano · ${Math.round((t.accuracy ?? data.balance.hit.defaultAccuracy) * 100)}%`;
      if (t.chakraDrain) info += ` · ${S.ui.drain(t.chakraDrain)}`;
      if (t.requiresDojutsu) info += ` · ${S.ui.requires(S.dojutsu[t.requiresDojutsu]!.name)}`;
      const lvl = ` <span class="lvl">${roman(techniqueLevel(p, t.id, data))}</span>`;
      return `<li><span class="muted">${S.actions[slot]}</span> ${esc(techName(t.id))}${lvl} ${elChip(tech.element)}<span class="muted small"> · ${info} · ${S.ui.cost(tech.chakraCost)}</span></li>`;
    })
    .join('');
}

/** Passivas e dōjutsu do jogador, como itens de lista (`tag` = li ou p). */
function passiveItems(p: PlayerState, tag: 'li' | 'p'): string[] {
  const item = (name: string, desc: string) =>
    tag === 'li' ? `<li><b>${name}</b> · ${desc}</li>` : `<p class="passive"><b>${name}</b> · ${desc}</p>`;
  const out: string[] = [];
  const passive = S.passives[p.passive];
  if (passive) out.push(item(passive.name, passive.desc));
  const active = p.active ? S.actives[p.active] : null;
  if (active) {
    const stage = gatesStage(p, data);
    const next = data.balance.gates.stages[stage];
    const gates = p.active === 'gates' ? ` (${stage ? S.gatesStage(stage) : '—'}${next ? ` · ${S.ui.gatesLocked(next.minTaijutsu)}` : ''})` : '';
    out.push(item(active.name + gates, active.desc));
  }
  if (p.dojutsu) {
    const d = S.dojutsu[p.dojutsu]!;
    const stage = sharinganStage(p, data);
    out.push(item(stage ? `${d.name} (${S.sharinganStage(stage)})` : d.name, d.desc));
  }
  if (p.jinchuuriki) {
    out.push(item(S.passives.jinchuuriki!.name, S.passives.jinchuuriki!.desc));
    out.push(item(S.passives.innerDemon!.name, S.passives.innerDemon!.desc));
  }
  if (p.focusUses > 0) out.push(item(S.talents.focus.name, S.talents.focus.desc(p.focusUses)));
  if (p.substitutionBonus > 0) out.push(item(S.talents.substitution.name, S.talents.substitution.desc(p.substitutionBonus)));
  if (p.pendingUpgrades > 0) out.push(item('📜', S.ui.upgradesPending(p.pendingUpgrades)));
  return out;
}

/** Valor atual do efeito passivo da invocação (para o inventário). */
function summonEffect(p: PlayerState): string {
  if (!p.summon) return '';
  const fx = S.summonEffects[p.summon.animal]!;
  if (p.summon.animal === 'toad') return fx(Math.round(toadPenetration(p, data) * 100));
  if (p.summon.animal === 'snake') return fx(snakePoisonBonus(p, data) ?? 0);
  return fx(Math.round(slugHealPct(p, data) * 100));
}

/**
 * Retrato do ninja. Sem foto, uma silhueta padrão com bandana.
 * Aberto a personalização: basta passar a URL de uma imagem.
 */
function avatar(size: 'sm' | 'lg' = 'sm', src: string | null = null): string {
  const img = src
    ? `<img src="${esc(src)}" alt="">`
    : `<svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="27" r="13" fill="#0b0f1c"/>
        <path d="M8 64c2-14 12-21 24-21s22 7 24 21z" fill="#0b0f1c"/>
        <path d="M17 22c4-3 26-3 30 0v6c-4-2-26-2-30 0z" fill="#3a4568"/>
        <rect x="25" y="20.5" width="14" height="7.5" rx="1.5" fill="#c9d1e6"/>
        <path d="M29 22.5l6 3.5m0-3.5l-6 3.5" stroke="#3a4568" stroke-width="1.4"/>
        <path d="M47 23l10 4-9 1.5z" fill="#3a4568"/>
        <path d="M24 33h16" stroke="#ff7a1a" stroke-width="2" stroke-linecap="round" opacity=".85"/>
      </svg>`;
  return `<span class="avatar avatar-${size}">${img}</span>`;
}

function xpBar(p: PlayerState): string {
  const need = xpToNextLevel(p.level, data);
  const pct = Math.min(100, (p.xp / need) * 100);
  return `<div class="bar bar-xp"><div class="fill" style="width:${pct}%"></div><span>${S.ui.xp(p.xp, need)}</span></div>`;
}

function diffChip(d: Difficulty): string {
  return `<span class="chip diff diff-${d}">${S.difficulty[d].name}</span>`;
}

function playerPanel(p: PlayerState, mods: NextFightMods = NO_MODS): string {
  const stat =(label: string, v: string | number) => `<div><small>${label}</small><b>${v}</b></div>`;
  return `
  <section class="card player-panel">
    <div class="panel-head">
      ${avatar('sm')}
      <div class="panel-id">
        <b class="name">${originLabel(p.origin)}</b>
        <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(p.level)}</span>${p.affinity ? elChip(p.affinity) : `<span class="chip">${S.ui.noAffinity}</span>`}${p.jinchuuriki ? `<span class="chip jin">${S.origin.jinchuuriki}</span>` : ''}${camp ? diffChip(camp.difficulty) : ''}</div>
      </div>
      <button class="btn small sheet-btn" data-sheet>🎒 ${S.ui.openSheet}</button>
    </div>
    ${xpBar(p)}
    ${bar('hp', p.hp, p.maxHp)}
    ${bar('ck', p.chakra, p.maxChakra)}
    <div class="stats">
      ${stat(S.stats.taijutsu, p.offense.taijutsu)}${stat(S.stats.ninjutsu, p.offense.ninjutsu)}${stat(S.stats.genjutsu, p.offense.genjutsu)}
      ${stat(S.stats.physical, p.resistance.physical)}${stat(S.stats.mental, p.resistance.mental)}${stat(S.stats.speed, p.speed)}
    </div>
    ${passiveItems(p, 'p').join('')}
    ${mods.villainStartsFirst || mods.playerStartsFirst ? `<div class="mods"><small>${S.ui.nextFight}</small> ${modChips(mods)}</div>` : ''}
  </section>`;
}

// ---------------------------------------------------------------------------
// Ficha ninja (janela à parte): retrato, atributos, técnicas, bolsa e passivas

const SUMMON_ICONS: Record<SummonAnimal, string> = { toad: '🐸', snake: '🐍', slug: '🐌' };

function bagSlots(p: PlayerState): string {
  const B = S.bag;
  const slot = (icon: string, name: string, desc: string, qty: string) =>
    `<li class="slot"><i>${icon}</i><b>${name}</b>${qty ? `<em>${qty}</em>` : ''}<small>${desc}</small></li>`;
  const filled: string[] = [];
  if (p.revives > 0) filled.push(slot('🍶', B.revive.name, B.revive.desc, `×${p.revives}`));
  const icons: Record<ConsumableId, string> = { soldierPill: '💊', medKit: '🩹', explosiveTag: '💥', smokeBomb: '💨' };
  for (const id of CONSUMABLES) {
    if (p.bag[id] > 0) filled.push(slot(icons[id], S.consumables[id]!.name, S.consumables[id]!.desc, `×${p.bag[id]}`));
  }
  if (p.coins > 0) filled.push(slot('🪙', B.coin.name, B.coin.desc, `×${p.coins}`));
  if (p.trainingWeights !== 'none') filled.push(slot('🏋️', B.weights.name, B.weights.desc[p.trainingWeights] ?? '', ''));
  if (p.ninjaToolLevel > 0) {
    const dmg = p.ninjaToolLevel * data.balance.ninjaTool.baseDamagePerLevel;
    filled.push(slot('🗡️', B.ninjaTool.name, B.ninjaTool.desc(dmg), `${S.ui.level}${p.ninjaToolLevel}`));
  }
  if (p.amulets.speed > 0) {
    filled.push(slot('🪶', B.speedAmulet.name, B.speedAmulet.desc(p.amulets.speed), `×${p.amulets.speed}`));
  }
  if (p.amulets.resistance > 0) {
    const n = p.amulets.resistance;
    filled.push(slot('🧿', B.resistanceAmulet.name, B.resistanceAmulet.desc(n), `×${n}`));
  }
  if (p.summon) {
    const name = S.summons[p.summon.animal]!.name;
    filled.push(slot(SUMMON_ICONS[p.summon.animal], B.summon.name, `${B.summon.desc(name)} ${summonEffect(p)}`, `${S.ui.level}${p.summon.level}`));
  }
  const scrolls = Object.values(p.techniqueLevels).reduce((a, b) => a + (b ?? 0), 0);
  if (scrolls > 0) filled.push(slot('📜', B.scrolls.name, B.scrolls.desc(scrolls), `×${scrolls}`));
  const empty = Math.max(0, 6 - filled.length);
  return filled.join('') + `<li class="slot empty"><span>${S.ui.bagEmpty}</span></li>`.repeat(empty);
}

/** Durante a luta, o jogador "vivo" está no estado da batalha, não na campanha. */
let battlePlayer: (() => PlayerState) | null = null;

function sheetHtml(c: Campaign): string {
  const p = battlePlayer?.() ?? c.player;
  const crit = critChance(p.critBonus, data.balance.crit);
  const attr = (label: string, v: string | number) => `<div><small>${label}</small><b>${v}</b></div>`;
  const passives = [
    ...passiveItems(p, 'li'),
    p.summon ? `<li><b>${S.summons[p.summon.animal]!.name}</b> · ${S.summons[p.summon.animal]!.desc}</li>` : '',
  ].join('');
  const elements = [p.affinity, ...p.secondaryElements].filter((e): e is Element => Boolean(e));
  const nextFight = c.mods.villainStartsFirst || c.mods.playerStartsFirst;
  return `
    <div class="scroll-paper">
      <span class="hanko" aria-hidden="true">忍</span>
      <header class="sheet-head">
        ${avatar('lg')}
        <div class="sheet-id">
          <h2 class="sheet-name">${originLabel(p.origin)}</h2>
          <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(p.level)}</span>${elements.length ? elements.map(elChip).join('') : `<span class="chip">${S.ui.noAffinity}</span>`}${p.jinchuuriki ? `<span class="chip jin">${S.origin.jinchuuriki}</span>` : ''}${diffChip(c.difficulty)}</div>
          ${xpBar(p)}
        </div>
      </header>
      ${bar('hp', p.hp, p.maxHp)}
      ${bar('ck', p.chakra, p.maxChakra)}
      <h3 class="sheet-title">${S.ui.attributes}</h3>
      <div class="attrs">
        ${attr(S.stats.taijutsu, p.offense.taijutsu)}${attr(S.stats.ninjutsu, p.offense.ninjutsu)}${attr(S.stats.genjutsu, p.offense.genjutsu)}${attr(S.stats.speed, p.speed)}
        ${attr(S.stats.physical, p.resistance.physical)}${attr(S.stats.mental, p.resistance.mental)}${attr(S.stats.crit, formatPct(crit))}${attr(S.stats.hp, p.maxHp)}${attr(S.stats.chakra, p.maxChakra)}
      </div>
      <h3 class="sheet-title">${S.ui.bag}</h3>
      <ul class="bag">${bagSlots(p)}</ul>
      <h3 class="sheet-title">${S.ui.techniques}</h3>
      <ul class="techs">${techniqueRows(p)}</ul>
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
      return `<li class="${state}"><i>${i < current ? '✓' : i + 1}</i><div><b>${stageName(st)}</b><small>${sub}${tier}</small></div></li>`;
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
        return { label: L[s.value]!, weight: s.weight, color: s.value === 'yes' ? '#ff5a3c' : '#5b6578' };
      case 'affinity':
        return { label: S.elements[s.value as Element], weight: s.weight, color: ELEMENT_COLORS[s.value as Element] };
      case 'lineage': {
        // A cor da fatia indica o nível: comum, clã ou rara.
        const tier = lineageOf(s.value, data).tier;
        return { label: S.lineages[s.value] ?? s.value, weight: s.weight, color: TIER_COLORS[tier] };
      }
    }
  });
}

function stepResultText(step: OriginStep): string {
  const v = step.slices[step.index]!.value;
  switch (step.kind) {
    case 'lineage': {
      const tier = lineageOf(v, data).tier;
      return `${S.lineages[v] ?? v}${tier === 'common' ? '' : ` · ${S.lineageTiers[tier]}`}`;
    }
    case 'affinity':
      return S.elements[v as Element];
    case 'jinchuuriki':
      return v === 'yes' ? S.origin.jinchuuriki : `${S.origin.jinchuuriki}: ${S.sliceLabels.no}`;
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
      chips.insertAdjacentHTML('beforeend', `<span class="chip pop">${stepResultText(step)}</span>`);
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
      <button class="btn" data-choice="reroll">🎲 ${S.ui.reroll}</button>
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
      ${playerPanel(c.player, c.mods)}
      <p class="muted small center">${S.ui.carryHint}</p>
      ${c.player.trainingWeights === 'equipped' ? `<button class="btn" data-choice="weights">🏋️ ${S.ui.weightsRemove}</button>` : ''}
      ${c.player.trainingWeights === 'stored' ? `<button class="btn" data-choice="weights">🏋️ ${S.ui.weightsEquip}</button>` : ''}
      <div class="sticky-cta"><button class="btn primary big" data-choice="go">${stage.kind === 'exam' ? '📜' : '⚔️'} ${stageName(stage)}</button></div>
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
        step = applyGuru(c.player, out.value, rng, data);
        break;
      }
      // Premium: segunda roleta, ponderada pelo perfil do jogador.
      await sleep(settings.instant ? 0 : 300);
      const premium = rollPremium(c.player, rng, data);
      await bigWheel(slot, S.roulettes.premium, rollSlices(premium, (id) => S.premiums[id] ?? id), premium.index);
      step = applyPremium(c.player, premium.value, data);
      break;
    }
  }
  applyStep(step);
  detail.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
  refreshHud(true);
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="go">⚔️ ${S.ui.fight}</button></div>`;
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

function villainPanel(s: BattleState): string {
  const v = s.villain.def;
  const state = elementalStateOf(s, 'villain', data);
  const res = (kind: 'physical' | 'mental') => Math.floor(villainResistance(s, kind));
  return `<section class="card villain-panel" id="vcard">
    <div class="row between"><b class="name">${villainName(v.id)}</b><span>${elChip(v.element)}</span></div>
    ${bar('hp', s.villain.hp, v.hp)}
    ${bar('ck', s.villain.chakra, v.chakra)}
    <div class="row between small muted"><span>${S.ui.resistShort(res('physical'), res('mental'))}</span><span>${S.stats.speed} ${v.speed}</span></div>
    ${state ? `<div class="small">${elChip(state)} <span class="muted">${S.ui.stateChip(S.elements[state])}</span></div>` : ''}
    ${villainPassiveLine(v)}
    <div class="badges" id="vbadges"></div>
  </section>`;
}

/** Passiva do vilão (na versão da dificuldade: a hardcore já vem trocada por scaleVillain). */
function villainPassiveLine(v: BattleState['villain']['def']): string {
  const passive = v.passive;
  if (!passive) return '';
  const t = S.villainPassives[passive.kind === 'cloak' ? passive.variant : passive.kind]!;
  const hardcore = camp?.difficulty === 'hardcore' && v.hardcorePassive !== undefined;
  return `<p class="passive small"><b>${t.name}</b> · ${hardcore ? t.hardcore : t.desc}</p>`;
}

/** Efeitos negativos e de luta comuns aos dois lados. `bad` = cor para o lado afetado. */
function statusChips(fx: BattleState['playerFx'] | BattleState['villain']['fx'], bad: string): string[] {
  const out: string[] = [];
  if (fx.debilitated > 0) out.push(`<span class="chip ${bad}">${S.ui.debilitated}</span>`);
  if (fx.paralyzed > 0) out.push(`<span class="chip ${bad}">⚡ ${S.ui.paralyzed}</span>`);
  if (fx.asleep > 0) out.push(`<span class="chip ${bad}">💤 ${S.ui.asleep}</span>`);
  if (fx.stunned > 0) out.push(`<span class="chip ${bad}">💫 ${S.ui.stunned}</span>`);
  if (fx.feared > 0) out.push(`<span class="chip ${bad}">${S.ui.feared(fx.feared)}</span>`);
  if (fx.confused > 0) out.push(`<span class="chip ${bad}">${S.ui.confused(fx.confused)}</span>`);
  if (fx.tormented > 0) out.push(`<span class="chip ${bad}">${S.ui.tormented(fx.tormented)}</span>`);
  if (fx.debilitateImmunity > 0) out.push(`<span class="chip">${S.ui.immune}</span>`);
  if (fx.burn > 0) out.push(`<span class="chip ${bad}">${S.ui.burning(fx.burn)}</span>`);
  if (fx.poison) out.push(`<span class="chip ${bad}">${S.ui.poisoned}</span>`);
  if (fx.bleeding) out.push(`<span class="chip ${bad}">${S.ui.bleeding}</span>`);
  if (fx.cloakTurns > 0) out.push(`<span class="chip jin">${S.ui.cloakOn(fx.cloakTurns)}</span>`);
  if (fx.guaranteedCrit) out.push(`<span class="chip ${bad === 'bad' ? 'good' : 'bad'}">${S.ui.guaranteedCrit}</span>`);
  if (fx.owesAction) out.push(`<span class="chip ${bad}">${S.ui.owesAction}</span>`);
  return out;
}

function badgesHtml(s: BattleState, side: 'player' | 'villain'): string {
  if (side === 'villain') {
    const v = s.villain;
    const out = statusChips(v.fx, 'good');
    if (v.mistTurns > 0) out.push(`<span class="chip bad">${S.ui.mistOn(v.mistTurns)}</span>`);
    if (v.insaneTimer > 0) out.push(`<span class="chip good">${S.ui.insaneTimer(v.insaneTimer)}</span>`);
    if (v.lastStand) out.push(`<span class="chip bad">${S.ui.lastStand}</span>`);
    // Golpe carregado: aviso para todos. Estrategista (Nara): vê a próxima ação.
    if (v.charging) out.push(`<span class="chip bad">${S.ui.charging(techName(v.charging))}</span>`);
    else if (s.player.passive === 'strategist' && v.intent) {
      const what = v.intent.kind === 'rest' ? S.ui.intentRest : techName(v.intent.id);
      out.push(`<span class="chip">${S.ui.intent(what)}</span>`);
    }
    return out.join('');
  }
  const fx = s.playerFx;
  const out = statusChips(fx, 'bad');
  if (fx.dojutsuActive && s.player.dojutsu) out.push(`<span class="chip eye">👁 ${S.ui.dojutsuOn(S.dojutsu[s.player.dojutsu]!.name, fx.dojutsuTurns)}</span>`);
  if (fx.gatesTurns > 0) out.push(`<span class="chip good">${S.ui.gatesOn(S.gatesStage(fx.gatesStage), fx.gatesTurns)}</span>`);
  if (fx.expansionTurns > 0) out.push(`<span class="chip good">${S.ui.expansionOn(fx.expansionTurns)}</span>`);
  if (fx.clonesArmed) out.push(`<span class="chip good">${S.ui.clonesArmed}</span>`);
  if (fx.armorTurns > 0) out.push(`<span class="chip good">${S.ui.armorOn(fx.armorTurns)}</span>`);
  if (fx.stance) out.push(`<span class="chip good">${S.ui.stanceOn}</span>`);
  if (fx.dodge) out.push(`<span class="chip good">${S.ui.dodge(Math.round(fx.dodge.chance * 100))}</span>`);
  out.push(`<span class="chip">❤ ×${s.player.revives}</span>`);
  return out.join('');
}

function actionButton(s: BattleState, action: PlayerAction, enabled: boolean): string {
  const p = s.player;
  const B = data.balance;
  let title = S.actions[action] ?? action;
  let sub = '';
  let extra = '';
  let cls: string = action;
  const techId = actionTechniqueId(action);
  const itemId = actionItemId(action);
  if (techId) {
    const tech = playerTechnique(p, techId, data);
    title = esc(techName(techId));
    cls = tech.type;
    if (tech.mental) {
      extra = `${S.ui.prisonTurns(playerGenjutsuTurns(s, techId, data))} · ${formatPct(playerGenjutsuHitChance(s, data, techId))} · ${S.ui.cost(tech.chakraCost)}`;
    } else if (tech.state) {
      extra = `${S.ui.armorHint} · ${S.ui.cost(tech.chakraCost)}`;
    } else {
      const prev = attackPreview(s, techId, data);
      const elMark = prev.elementMult > 1 ? ` <span class="adv">${S.ui.advantage}</span>` : prev.elementMult < 1 ? ` <span class="dis">${S.ui.disadvantage}</span>` : '';
      const hits = prev.hits > 1 ? `×${prev.hits}` : '';
      extra = `≈${prev.damage}${hits}${elMark} · ${formatPct(prev.hitChance)} · ${S.ui.cost(tech.chakraCost)}`;
    }
    if (tech.chakraDrain) sub = S.ui.drain(tech.chakraDrain);
  } else if (itemId) {
    const it = S.consumables[itemId]!;
    title = `${it.name} ×${p.bag[itemId]}`;
    extra = it.desc;
    cls = 'item';
  } else if (action === 'expansion') {
    extra = `${S.ui.cost(B.expansion.chakraCost)} · ×${String(B.expansion.taijutsuMult).replace('.', ',')} tai`;
  } else if (action === 'stance') {
    extra = S.ui.stanceHint;
  } else if (action === 'pass') {
    extra = S.ui.passHint;
  } else if (action === 'dojutsu' && p.dojutsu) {
    const stage = sharinganStage(p, data);
    title = S.dojutsu[p.dojutsu]!.name;
    sub = stage ? S.sharinganStage(stage) : '';
    extra = `${S.ui.cost(dojutsuActivationCost(p, data) ?? 0)} · −${B.dojutsu[p.dojutsu].upkeep}/rodada`;
  } else if (action === 'gates') {
    const gates = gatesToOpen(p, data);
    if (gates) {
      sub = S.gatesStage(gates.stage);
      extra = `−${gatesHpCost(p, gates.hpCostPct)} HP · ${S.ui.cost(gates.chakraCost)} · ×${String(gates.taijutsuMult).replace('.', ',')} tai`;
    }
  } else if (action === 'medical') {
    const tech = playerMedical(p, data);
    if (tech) {
      const heal = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * medicalHealPct(p, data)));
      sub = esc(techName(tech.id));
      extra = `+${heal} HP · ${S.ui.cost(tech.chakraCost)}`;
    }
  } else if (action === 'rest') {
    extra = `+${B.rest.chakraRecovered} ck`;
  }
  return `<button class="btn act act-${cls}" data-choice="${action}" ${enabled ? '' : 'disabled'}>
    <b>${title}</b>${sub ? `<span>${sub}</span>` : ''}<small>${extra}</small></button>`;
}

type ActionTab = AttackType | 'special' | 'items';

/** Abas de categoria que o jogador usa (tai, nin, gen), a de ações especiais e a da bolsa. */
function actionTabs(s: BattleState): ActionTab[] {
  const types = (['taijutsu', 'ninjutsu', 'genjutsu'] as AttackType[]).filter((t) => canUseType(s.player, t, data));
  const items = CONSUMABLES.some((id) => s.player.bag[id] > 0);
  return [...types, 'special', ...(items ? (['items'] as const) : [])];
}

/** Botões da aba: técnicas da categoria (as que exigem dōjutsu só aparecem com ele ativo) ou as especiais. */
function actionList(s: BattleState, tab: ActionTab): PlayerAction[] {
  const p = s.player;
  if (tab === 'items') return CONSUMABLES.filter((id) => p.bag[id] > 0).map(itemAction);
  if (tab !== 'special') {
    return attackTechniques(p, data)
      .filter((t) => t.type === tab && (!t.requiresDojutsu || canUseTechnique(s, { ...t, chakraCost: 0 })))
      .map((t) => techAction(t.id));
  }
  const list: PlayerAction[] = [];
  if (p.dojutsu && !s.playerFx.dojutsuActive) list.push('dojutsu');
  if (p.active === 'gates') list.push('gates');
  if (p.active === 'expansion' && s.playerFx.expansionTurns === 0) list.push('expansion');
  if (playerMedical(p, data)) list.push('medical');
  list.push('rest', 'stance');
  return list;
}

/** Painel de reação: Resistir em destaque, com as chances de cada outra opção. */
function reactionButton(s: BattleState, pending: PendingReaction, choice: ReactionChoice): string {
  const prev = reactionPreview(s, pending.incoming, choice, data);
  const pct = (x: number) => Math.round(x * 100);
  let title: string;
  let hint: string;
  let cls = 'react';
  switch (prev.kind) {
    case 'resist':
      title = S.ui.reactResist;
      hint = S.ui.reactResistHint(pct(prev.fraction), incomingDamagePreview(s, pending.incoming, data));
      cls += ' primary';
      break;
    case 'substitution':
      title = S.ui.reactSubstitution;
      hint = S.ui.reactSubstitutionHint(pct(prev.chance), prev.usesLeft);
      break;
    case 'guard': {
      const id = reactionTechniqueId(choice)!;
      title = S.ui.reactBarrier(esc(techName(id)));
      hint = `${S.ui.reactGuardHint(pct(prev.holdChance))} · ${S.ui.cost(playerTechnique(s.player, id, data).chakraCost)}`;
      break;
    }
    case 'clash': {
      const id = reactionTechniqueId(choice)!;
      const tech = playerTechnique(s.player, id, data);
      title = tech.barrier !== undefined ? S.ui.reactBarrier(esc(techName(id))) : S.ui.reactClash(esc(techName(id)));
      const [lose, cancel, win] = prev.odds;
      hint = `${S.ui.reactClashHint(pct(win), pct(cancel), pct(lose))} · ${S.ui.cost(tech.chakraCost)}`;
      title += ` ${elChip(tech.element)}`;
      break;
    }
  }
  return `<button class="btn act ${cls}" data-choice="${choice}"><b>${title}</b><small>${hint}</small></button>`;
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
      <div class="battle-head"><span>${setup.label}</span><span id="round">${S.ui.round(0)}</span></div>
      <div id="vslot">${villainPanel(state)}</div>
      <div id="dice" class="dice"></div>
      <ol id="log" class="log"></ol>
      <section class="card player-mini" id="pcard">
        <div class="panel-head">${avatar('sm')}<div class="panel-id"><b class="name">${S.ui.you} · ${originLabel(c.origin)}</b>
          <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(c.player.level)}</span>${elChip(c.player.affinity)}</div></div>
          <button class="btn small sheet-btn" data-sheet>🎒</button></div>
        ${bar('hp', state.player.hp, state.player.maxHp)}
        ${bar('ck', state.player.chakra, state.player.maxChakra)}
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
  const renderBadges = (s: BattleState) => {
    root.querySelector('#vbadges')!.innerHTML = badgesHtml(s, 'villain');
    root.querySelector('#pbadges')!.innerHTML = badgesHtml(s, 'player');
  };
  let tab: ActionTab = 'taijutsu';
  let current = state;
  let enabledNow = false;
  /** Escolhas grátis armadas para a próxima jogada (foco, clones, pavor). */
  let extras: RoundExtras = {};
  const renderActions = (s: BattleState, enabled: boolean) => {
    current = s;
    enabledNow = enabled;
    const avail = availableActions(s, data);
    // A ação já foi gasta numa reação: só o botão de passar a vez.
    if (avail.length === 1 && avail[0] === 'pass') {
      actionsEl.innerHTML = `<div class="act-grid">${actionButton(s, 'pass', enabled)}</div>`;
      return;
    }
    const tabs = actionTabs(s);
    if (!tabs.includes(tab)) tab = tabs[0]!;
    const tabLabel = (t: ActionTab) => (t === 'special' ? S.ui.special : t === 'items' ? S.ui.bag : S.actions[t]);
    const tabsHtml = `<div class="act-tabs" role="tablist">${tabs
      .map((t) => `<button class="act-tab tab-${t}${t === tab ? ' on' : ''}" role="tab" aria-selected="${t === tab}" data-tab="${t}">${tabLabel(t)}</button>`)
      .join('')}</div>`;
    const buttons = actionList(s, tab)
      .map((a) => actionButton(s, a, enabled && avail.includes(a)))
      .join('');
    const toggle = (key: keyof RoundExtras, label: string, armedLabel: string, hint: string) =>
      `<button class="btn focus-btn${extras[key] ? ' on' : ''}" data-extra="${key}" aria-pressed="${Boolean(extras[key])}" ${enabled ? '' : 'disabled'}>${extras[key] ? armedLabel : label}<small>${hint}</small></button>`;
    const free = [
      canFocus(s) ? toggle('focus', S.ui.focus, S.ui.focusArmed, S.ui.focusHint) : '',
      s.player.active === 'shadowClones' && !s.playerFx.clonesArmed && s.player.chakra >= data.balance.shadowClones.chakraCost
        ? toggle('clones', `${S.ui.clones} · ${S.ui.cost(data.balance.shadowClones.chakraCost)}`, S.ui.clonesArmed, S.ui.clonesHint)
        : '',
      sharinganActive(s) ? toggle('fear', S.ui.fearVariant, `${S.ui.fearVariant} ✓`, S.ui.fearHint) : '',
    ].join('');
    actionsEl.innerHTML = `${tabsHtml}${free}<div class="act-grid">${buttons}</div>`;
  };
  actionsEl.addEventListener('click', (e) => {
    const extra = (e.target as HTMLElement).closest<HTMLElement>('[data-extra]');
    if (extra && enabledNow) {
      const key = extra.dataset.extra as keyof RoundExtras;
      extras = { ...extras, [key]: !extras[key] };
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
  const chooseReaction = async (s: BattleState, pending: PendingReaction): Promise<ReactionChoice> => {
    const tech = techName(pending.incoming.techniqueId);
    const charged = pending.incoming.charged ? ` <span class="chip bad">${S.ui.charged}</span>` : '';
    actionsEl.innerHTML = `<div class="react-box"><h3>${S.ui.reactTitle(villainName(s.villain.def.id), esc(tech))} ${elChip(pending.incoming.element)}${charged}</h3>
      <div class="act-grid">${pending.options.map((o) => reactionButton(s, pending, o)).join('')}</div></div>`;
    return choose<ReactionChoice>(actionsEl);
  };

  while (state.status === 'ongoing') {
    renderActions(state, true);
    const action = await choose<PlayerAction>(actionsEl);
    renderActions(state, false);
    // Só valem as escolhas grátis que combinam com a ação (ex.: clones precisam de chakra para os dois).
    const chosen: RoundExtras = {
      focus: Boolean(extras.focus) && canFocus(state),
      clones: Boolean(extras.clones) && canClones(state, action, data),
      fear: Boolean(extras.fear) && canFearVariant(state, action, data),
    };
    let next = playRound(state, action, rng, data, chosen);
    // O foco e o pavor valem só para a jogada; os clones armados ficam no estado da luta.
    extras = {};
    await animateRound(state, next);
    state = next;
    // A rodada parou esperando a reação do jogador: escolhe e continua (pode parar de novo, ex.: Espelhos).
    while (state.pending) {
      renderBadges(state);
      const choice = await chooseReaction(state, state.pending);
      renderActions(state, false);
      next = resumeRound(state, choice, rng, data);
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
  overlay.innerHTML = `<div class="overlay ${won ? 'win' : 'lose'}"><div><h2>${msg}</h2>${xpLine}
    <p class="muted">${S.ui.round(state.round)}</p>
    <button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div></div>`;
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
              { label: S.sliceLabels.player!, weight: slices[0]!.weight, color: '#4aa3ff' },
              { label: villainName(prev.villain.def.id), weight: slices[1]!.weight, color: '#ff5a5a' },
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
          log(S.log.mental[ev.effect]!(who(ev.target), ev.turns), ev.target === 'villain' ? 'good' : 'bad');
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
              { label: S.sliceLabels.dodged!, weight: ev.chance, color: '#4cd07d' },
              { label: S.sliceLabels.failed!, weight: 1 - ev.chance, color: '#5b6578' },
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
              { label: S.sliceLabels.cancel!, weight: ev.odds[1], color: '#5b6578' },
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
        case 'guardBreak':
          await stripRoulette(
            dice,
            `${S.roulettes.guardBreak} · ${who(ev.attacker)}`,
            [
              { label: S.sliceLabels.broken!, weight: ev.breakChance, color: '#ff8a5a' },
              { label: S.sliceLabels.held!, weight: 1 - ev.breakChance, color: '#a87b4f' },
            ],
            ev.broken ? 0 : 1,
            pace.strip(),
          );
          log(S.log.guardBreak(who(ev.attacker), ev.broken), (ev.attacker === 'player') === ev.broken ? 'good' : 'bad');
          break;
        case 'barrierHold': {
          const attacker = ev.side === 'player' ? 'villain' : 'player';
          if (ev.reflected > 0) {
            if (attacker === 'villain') disp.vhp -= ev.reflected;
            else disp.php -= ev.reflected;
            floatNumber(attacker === 'villain' ? vcard() : pcard, `−${ev.reflected}`, 'dmg');
          }
          log(S.log.barrierHold(techName(ev.techniqueId), ev.reflected), ev.side === 'player' ? 'good' : 'bad');
          break;
        }
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
                { label: S.sliceLabels.miss!, weight: hs[0]!.weight, color: '#5b6578' },
                { label: S.sliceLabels.hit!, weight: hs[1]!.weight, color: mine ? '#4cd07d' : '#ff8a5a' },
                { label: S.sliceLabels.crit!, weight: hs[2]!.weight, color: '#f5c542' },
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
          } else if (ev.attackType === 'genjutsu' || data.techniquesById[ev.techniqueId]?.mental) {
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
          log(S.log.debilitate[ev.kind]!(who(ev.target), ev.turns), ev.target === 'villain' ? 'good' : 'bad');
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
          log(S.log.lastStand(ev.healed), 'bad');
          break;
        case 'insaneTimer':
          log(S.log.insaneTimer(who('villain'), ev.rounds), 'bad');
          break;
        case 'insaneRevive':
          disp.vhp = ev.hp;
          floatNumber(vcard(), `🐍 ${ev.hp}`, 'heal');
          log(S.log.insaneRevive(who('villain'), ev.hp), 'bad');
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
      results.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
      refreshHud();
    }
  } else {
    const step = applyReward(c.player, reward, tier, rng, data);
    applyStep(step);
    steps.push(step);
    results.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
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
  root.querySelector('#results')!.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
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
  root
    .querySelector('#results')!
    .insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
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
  const root = show(
    h(`<div class="screen end ${won ? 'win' : 'lose'}">
      <h1>${won ? '🏆' : '💀'}</h1>
      <h2>${won ? S.ui.victoryTitle : S.ui.defeatTitle}</h2>
      ${stoppedAt ? `<p class="center">${S.ui.defeatBy(stoppedAt)}</p>` : ''}
      <p class="center muted">${S.ui.revivesUsed(c.player.revivesUsed)}</p>
      ${stageTrail(won ? campaign.length : c.stageIndex)}
      ${playerPanel(c.player)}
      <div class="sticky-cta"><button class="btn primary big" data-choice="new">🎲 ${S.ui.newRun}</button></div>
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
      c.player = trainingWeightsWin(c.player, data);
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

async function main() {
  markAbandonedRuns(storage, new Date(), data.balance.history.maxRuns);

  const instant = document.getElementById('instant') as HTMLInputElement;
  instant.checked = settings.instant;
  instant.addEventListener('change', () => {
    settings.instant = instant.checked;
    saveSettings();
  });
  document.getElementById('history-btn')!.addEventListener('click', openHistory);
  document.getElementById('sheet-btn')!.addEventListener('click', openSheet);
  // Botões "Ficha" dentro das telas (painel do jogador, card da luta).
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-sheet]')) openSheet();
  });
  document.getElementById('disclaimer')!.textContent = S.ui.disclaimer;
  document.getElementById('instant-label')!.textContent = S.ui.instant;

  for (;;) {
    await originScreen();
    await runCampaign();
  }
}

void main();
