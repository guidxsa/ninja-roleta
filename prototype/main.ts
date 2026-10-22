// Protótipo jogável: interface mínima sobre o core real. Toda regra vem de src/core; aqui só há fluxo e animação.
import {
  availableActions,
  playerGenjutsuTurns,
  playerMedical,
  playerTechnique,
  playRound,
  slugHealPct,
  snakePoison,
  startBattle,
  toadDamageBonus,
  type BattleOptions,
  type BattleState,
  type PlayerAction,
} from '../src/core/combat';
import { playerDamage } from '../src/core/damage';
import { elementMultiplier } from '../src/core/elements';
import { critChance, genjutsuHitChance, hitChance, hitSlices } from '../src/core/hit';
import { initiativeSlices } from '../src/core/initiative';
import { rollOrigin, type OriginStep } from '../src/core/origin';
import { scaleVillain, type Difficulty } from '../src/core/difficulty';
import {
  canLevelUp,
  createPlayer,
  fullRestore,
  gainXp,
  medicalHealPct,
  xpToNextLevel,
  type PlayerState,
} from '../src/core/player';
import {
  applyAkatsuki,
  applyItem,
  applyReward,
  applySimpleEvent,
  applySummonEncounter,
  HANDS,
  levelUp,
  playJokenpo,
  rollEncounter,
  rollItem,
  rollLevelUp,
  rollReward,
  rollSummonAnimal,
  rollWeighted,
  type Hand,
  type NextFightMods,
  type ProgressEffect,
  type Roll,
  type Step,
} from '../src/core/progression';
import type { Rng } from '../src/core/rng';
import type { AttackType, Element, Origin, SummonAnimal } from '../src/core/types';
import { campaign, type Stage } from '../src/data/campaign';
import { gameData as data } from '../src/data/index';
import { ptBR as S } from '../src/data/strings/ptBR';
import { villainsById } from '../src/data/villains';
import {
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

const villainName = (id: string) => S.villains[id] ?? id;
const techName = (id: string) => S.techniques[id] ?? id;
const elChip = (el: Element | null) =>
  el ? `<span class="chip el" style="--c:${ELEMENT_COLORS[el]}">${S.elements[el]}</span>` : '';

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
    case 'guaranteedCrit':
      return E.guaranteedCrit;
    case 'stages':
      return E.stages(e.n);
    case 'revive':
      return E.revive;
    case 'ninjaTool':
      return E.ninjaTool(e.level);
    case 'techniqueUpgrade':
      return E.techniqueUpgrade(S.actions[e.type], e.level);
    case 'resistance':
      return E.resistance(e.amount);
    case 'speed':
      return E.speed(e.amount);
    case 'critBonus':
      return E.critBonus(Math.round(e.amount * 100));
    case 'newTechnique':
      return E.newTechnique(techName(e.techniqueId));
    case 'akatsukiTookRevive':
      return E.akatsukiTookRevive;
    case 'akatsukiWeakened':
      return E.akatsukiWeakened;
    case 'akatsukiInsight':
      return E.akatsukiInsight(Math.round(e.amount * 100));
    case 'levelUp': {
      const L = data.balance.level;
      const hp = L.hpPerLevel + (e.stat === 'hp' ? e.amount : 0);
      const ck = L.chakraPerLevel + (e.stat === 'chakra' ? e.amount : 0);
      return E.levelUp(e.level, hp, ck, S.levelStats[e.stat] ?? e.stat, e.amount);
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
  weakened: boolean;
}

let camp: Campaign | null = null;
const NO_MODS: NextFightMods = { villainStartsFirst: false, guaranteedCrit: false };

function track(patch: { status?: RunStatus; furthestStage?: number; difficulty?: Difficulty }) {
  if (!camp) return;
  updateRun(storage, camp.runId, { ...patch, revivesUsed: camp.player.revivesUsed }, new Date(), data.balance.history.maxRuns);
}

function applyStep(step: Step) {
  if (!camp) return;
  camp.player = step.player;
  camp.mods = { ...camp.mods, ...step.mods };
  if (step.effect.kind === 'akatsukiWeakened') camp.weakened = true;
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

function modChips(mods: NextFightMods, weakened: boolean): string {
  const chips = [];
  if (mods.villainStartsFirst) chips.push(`<span class="chip bad">${S.ui.villainFirst}</span>`);
  if (mods.guaranteedCrit) chips.push(`<span class="chip good">${S.ui.guaranteedCrit}</span>`);
  if (weakened) chips.push(`<span class="chip bad">${S.ui.halfStart}</span>`);
  return chips.join('');
}

function techniqueRows(p: PlayerState): string {
  const lvl = (n: number | undefined) => (n ? ` <span class="lvl">+${n}</span>` : '');
  const rows = (['taijutsu', 'ninjutsu', 'genjutsu'] as const)
    .filter((t) => !p.forbiddenAttackTypes.includes(t))
    .map((t) => {
      const tech = playerTechnique(p, t, data);
      return `<li><span class="muted">${S.actions[t]}</span> ${esc(techName(tech.id))}${lvl(p.techniqueLevels[t])} ${elChip(tech.element)}<span class="muted small"> · ${tech.baseDamage} dano · ${S.ui.cost(tech.chakraCost)}</span></li>`;
    });
  const medical = playerMedical(p, data);
  if (medical) {
    const pct = Math.round(medicalHealPct(p, data) * 100);
    rows.push(
      `<li><span class="muted">${S.actions.medical}</span> ${esc(techName(medical.id))}${lvl(p.techniqueLevels.medical)}<span class="muted small"> · ${S.ui.heal(pct)} · ${S.ui.cost(medical.chakraCost)}</span></li>`,
    );
  }
  return rows.join('');
}

/** Valor atual do efeito passivo da invocação (para o inventário). */
function summonEffect(p: PlayerState): string {
  if (!p.summon) return '';
  const fx = S.summonEffects[p.summon.animal]!;
  if (p.summon.animal === 'toad') return fx(toadDamageBonus(p, data));
  if (p.summon.animal === 'snake') return fx(snakePoison(p, data));
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
  const pct = need ? Math.min(100, (p.xp / need) * 100) : 100;
  const label = need ? S.ui.xp(p.xp, need) : S.ui.xpMax;
  return `<div class="bar bar-xp${need ? '' : ' max'}"><div class="fill" style="width:${pct}%"></div><span>${label}</span></div>`;
}

function diffChip(d: Difficulty): string {
  return `<span class="chip diff diff-${d}">${S.difficulty[d].name}</span>`;
}

function playerPanel(p: PlayerState, mods: NextFightMods = NO_MODS, weakened = false): string {
  const crit = critChance(p.critBonus, data.balance.crit.baseChance);
  const passive = p.passive ? S.passives[p.passive.kind] : null;
  const stat = (label: string, v: string | number) => `<div><small>${label}</small><b>${v}</b></div>`;
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
      ${stat(S.stats.speed, p.speed)}${stat(S.stats.resistance, `+${p.resistanceBonus}`)}${stat(S.stats.crit, formatPct(crit))}
    </div>
    ${passive ? `<p class="passive"><b>${passive.name}</b> · ${passive.desc}</p>` : ''}
    ${p.jinchuuriki ? `<p class="passive"><b>${S.passives.jinchuuriki!.name}</b> · ${S.passives.jinchuuriki!.desc}</p>` : ''}
    ${mods.villainStartsFirst || mods.guaranteedCrit || weakened ? `<div class="mods"><small>${S.ui.nextFight}</small> ${modChips(mods, weakened)}</div>` : ''}
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
  const crit = critChance(p.critBonus, data.balance.crit.baseChance);
  const passive = p.passive ? S.passives[p.passive.kind] : null;
  const attr = (label: string, v: string | number) => `<div><small>${label}</small><b>${v}</b></div>`;
  const passives = [
    passive ? `<li><b>${passive.name}</b> · ${passive.desc}</li>` : '',
    p.jinchuuriki ? `<li><b>${S.passives.jinchuuriki!.name}</b> · ${S.passives.jinchuuriki!.desc}</li>` : '',
    p.summon ? `<li><b>${S.summons[p.summon.animal]!.name}</b> · ${S.summons[p.summon.animal]!.desc}</li>` : '',
  ].join('');
  const elements = [p.affinity, ...p.secondaryElements].filter((e): e is Element => Boolean(e));
  const nextFight = c.mods.villainStartsFirst || c.mods.guaranteedCrit || c.weakened;
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
        ${attr(S.stats.resistance, `+${p.resistanceBonus}`)}${attr(S.stats.crit, formatPct(crit))}${attr(S.stats.hp, p.maxHp)}${attr(S.stats.chakra, p.maxChakra)}
      </div>
      <h3 class="sheet-title">${S.ui.bag}</h3>
      <ul class="bag">${bagSlots(p)}</ul>
      <h3 class="sheet-title">${S.ui.techniques}</h3>
      <ul class="techs">${techniqueRows(p)}</ul>
      ${passives ? `<h3 class="sheet-title">${S.ui.passives}</h3><ul class="sheet-passives">${passives}</ul>` : ''}
      ${nextFight ? `<h3 class="sheet-title">${S.ui.nextFight}</h3><div class="mods">${modChips(c.mods, c.weakened)}</div>` : ''}
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
      const tier = st.kind === 'fight' ? ` · ${S.ui.rewardTier(S.rewardTiers[st.rewardTier] ?? '')}` : '';
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
  return step.slices.map((s, i) => {
    switch (step.kind) {
      case 'lineageTier':
        return { label: L[s.value]!, weight: s.weight, color: s.value === 'special' ? '#f5c542' : '#5b6578' };
      case 'jinchuuriki':
        return { label: L[s.value]!, weight: s.weight, color: s.value === 'yes' ? '#ff5a3c' : '#5b6578' };
      case 'affinity':
        return { label: S.elements[s.value as Element], weight: s.weight, color: ELEMENT_COLORS[s.value as Element] };
      case 'lineage':
        return { label: S.lineages[s.value] ?? s.value, weight: s.weight, color: PALETTE[i % PALETTE.length]! };
    }
  });
}

function stepResultText(step: OriginStep): string {
  const v = step.slices[step.index]!.value;
  switch (step.kind) {
    case 'lineageTier':
      return v === 'special' ? S.origin.special : S.origin.common;
    case 'lineage':
      return S.lineages[v] ?? v;
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
    startRun(storage, { id: runId, origin: roll.origin, now: new Date() }, data.balance.history.maxRuns);
    const player = createPlayer(roll.origin, data);
    camp = {
      runId,
      origin: roll.origin,
      player,
      difficulty: settings.difficulty,
      stageIndex: 0,
      mods: { ...NO_MODS },
      weakened: false,
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
    slot.innerHTML = playerPanel(player);
    const after = root.querySelector<HTMLElement>('#after')!;
    after.innerHTML = `<div class="difficulty-box">
      <h3>${S.ui.difficulty}</h3>
      <div class="segmented">${DIFFICULTIES.map(
        (d) => `<button class="btn seg diff-${d}" data-diff="${d}" aria-pressed="${d === settings.difficulty}">${S.difficulty[d].name}</button>`,
      ).join('')}</div>
      <p class="muted center small" id="diff-desc">${S.difficulty[settings.difficulty].desc}</p>
    </div>
    <div class="actions-row">
      <button class="btn" data-choice="reroll">🎲 ${S.ui.reroll}</button>
      <button class="btn primary" data-choice="start">${S.ui.startCampaign}</button></div>`;
    // A dificuldade só pode mudar antes de começar a campanha.
    after.querySelector('.segmented')!.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-diff]');
      if (!btn || !camp) return;
      const d = btn.dataset.diff as Difficulty;
      settings.difficulty = d;
      camp.difficulty = d;
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
      ${playerPanel(c.player, c.mods, c.weakened)}
      <div class="sticky-cta"><button class="btn primary big" data-choice="go">${stage.kind === 'exam' ? '📜' : '⚔️'} ${stageName(stage)}</button></div>
    </div>`),
  );
  await choose(root);
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
    hud.innerHTML = playerPanel(c.player, c.mods, c.weakened);
    if (pulse) hud.firstElementChild?.classList.add('pulse');
  };
  refreshHud();

  const roll = rollWeighted(data.preFightEvents, rng);
  await bigWheel(slot, S.roulettes.event, rollSlices(roll, (id) => S.events[id]!.name), roll.index);
  const ev = S.events[roll.value]!;
  detail.innerHTML = `<div class="result-card"><h3>${ev.name}</h3><p>${ev.desc}</p></div>`;
  await sleep(settings.instant ? 0 : 400);

  let step: Step;
  switch (roll.value) {
    case 'nothing':
    case 'oldLady':
    case 'ramen':
    case 'training':
      step = applySimpleEvent(c.player, roll.value, data);
      break;
    case 'jokenpo':
      step = await jokenpoFlow(slot);
      break;
    case 'foundItem': {
      const item = rollItem(rng, data);
      await bigWheel(slot, S.roulettes.item, rollSlices(item, (id) => S.items[id]!), item.index);
      step = applyItem(c.player, item.value, rng);
      break;
    }
    case 'mysteriousEncounter':
      step = await encounterFlow(slot);
      break;
  }
  applyStep(step);
  detail.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
  refreshHud(true);
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="go">⚔️ ${S.ui.fight}</button></div>`;
  await choose(cta);
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

async function encounterFlow(slot: HTMLElement): Promise<Step> {
  const c = camp!;
  const enc = rollEncounter(rng, data);
  await bigWheel(slot, S.roulettes.encounter, rollSlices(enc, (id) => S.encounters[id]!), enc.index);
  await sleep(settings.instant ? 0 : 400);
  if (enc.value === 'akatsuki') return applyAkatsuki(c.player, data);
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
  const d = v.defense;
  return `<section class="card villain-panel" id="vcard">
    <div class="row between"><b class="name">${villainName(v.id)}</b><span>${elChip(v.element)}</span></div>
    ${bar('hp', s.villain.hp, v.hp)}
    ${bar('ck', s.villain.chakra, v.chakra)}
    <div class="row between small muted"><span>Def ${S.stats.taijutsu} ${d.taijutsu} · ${S.stats.ninjutsu} ${d.ninjutsu} · ${S.stats.genjutsu} ${d.genjutsu}</span><span>${S.stats.speed} ${v.speed}</span></div>
    <div class="badges" id="vbadges"></div>
  </section>`;
}

function badgesHtml(s: BattleState, side: 'player' | 'villain'): string {
  const out: string[] = [];
  if (side === 'villain') {
    if (s.villain.fx.debilitated > 0) out.push(`<span class="chip bad">${S.ui.debilitated}</span>`);
    if (s.villain.fx.debilitateImmunity > 0) out.push(`<span class="chip">${S.ui.immune}</span>`);
    if (s.villain.poison > 0) out.push(`<span class="chip good">🐍 ${S.ui.poisoned(s.villain.poison)}</span>`);
    return out.join('');
  }
  const fx = s.playerFx;
  if (fx.debilitated > 0) out.push(`<span class="chip bad">${S.ui.debilitated}</span>`);
  if (fx.guaranteedCrit) out.push(`<span class="chip good">${S.ui.guaranteedCrit}</span>`);
  if (fx.gatesTurns > 0) out.push(`<span class="chip good">${S.ui.gatesOn(fx.gatesTurns)}</span>`);
  if (fx.surgeTurns > 0 && fx.surgeMode)
    out.push(`<span class="chip jin">${S.ui.surgeOn(S.ui.surgeModes[fx.surgeMode]!, fx.surgeTurns)}</span>`);
  out.push(`<span class="chip">❤ ×${s.player.revives}</span>`);
  return out.join('');
}

function actionButton(s: BattleState, action: PlayerAction, enabled: boolean): string {
  const p = s.player;
  const v = s.villain.def;
  const B = data.balance;
  let sub = '';
  let extra = '';
  if (action === 'genjutsu') {
    const tech = playerTechnique(p, action, data);
    const hit = genjutsuHitChance(p.offense.genjutsu, v.defense.genjutsu, B.genjutsuHit);
    sub = esc(techName(tech.id));
    extra = `${S.ui.prisonTurns(playerGenjutsuTurns(p, v, data))} · ${formatPct(hit)} · ${S.ui.cost(tech.chakraCost)}`;
  } else if (action === 'taijutsu' || action === 'ninjutsu') {
    const tech = playerTechnique(p, action, data);
    const hit = hitChance(p.speed, v.speed, B.hit);
    const mult = elementMultiplier(tech.element, v.element, data.beats, B.elements);
    const gates = action === 'taijutsu' && s.playerFx.gatesTurns > 0 && p.passive?.kind === 'gates' ? p.passive.taijutsuMult : 1;
    const surge = s.playerFx.surgeTurns > 0 && s.playerFx.surgeMode ? B.jinchuuriki.surge[s.playerFx.surgeMode].damageMult : 1;
    const dmg = playerDamage({
      baseDamage: tech.baseDamage,
      offense: p.offense[action],
      defense: v.defense[action],
      defensePierce: action === 'taijutsu' && p.passive?.kind === 'preciseFist' ? p.passive.defensePierce : 0,
      elementMult: mult,
      critMult: 1,
      extraMult: gates * surge,
    });
    const elMark = mult > 1 ? ` <span class="adv">${S.ui.advantage}</span>` : mult < 1 ? ` <span class="dis">${S.ui.disadvantage}</span>` : '';
    sub = `${esc(techName(tech.id))}`;
    extra = `≈${dmg}${elMark} · ${formatPct(hit)} · ${S.ui.cost(tech.chakraCost)}`;
  } else if (action === 'gates') {
    const tech = playerTechnique(p, 'taijutsu', data);
    sub = S.passives.gates!.name;
    extra = `−25% HP · ${S.ui.cost(tech.chakraCost)}`;
  } else if (action === 'medical') {
    const tech = playerMedical(p, data);
    if (tech) {
      const heal = Math.min(p.maxHp - p.hp, Math.floor(p.maxHp * medicalHealPct(p, data)));
      sub = esc(techName(tech.id));
      extra = `+${heal} HP · ${S.ui.cost(tech.chakraCost)}`;
    }
  } else if (action === 'rest') {
    sub = '';
    extra = `+${B.rest.chakraRecovered} ck`;
  }
  return `<button class="btn act act-${action}" data-choice="${action}" ${enabled ? '' : 'disabled'}>
    <b>${S.actions[action]}</b>${sub ? `<span>${sub}</span>` : ''}<small>${extra}</small></button>`;
}

function actionList(s: BattleState): PlayerAction[] {
  const p = s.player;
  const list: PlayerAction[] = (['taijutsu', 'ninjutsu', 'genjutsu'] as AttackType[]).filter(
    (t) => !p.forbiddenAttackTypes.includes(t),
  );
  if (p.passive?.kind === 'gates') list.push('gates');
  if (playerMedical(p, data)) list.push('medical');
  list.push('rest');
  return list;
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
  let state = startBattle(c.player, villain, setup.options);
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
  const renderActions = (s: BattleState, enabled: boolean) => {
    const avail = availableActions(s, data);
    actionsEl.innerHTML = actionList(s)
      .map((a) => actionButton(s, a, enabled && avail.includes(a)))
      .join('');
  };
  renderBadges(state);
  if (setup.options.villainStartsFirst) log(S.ui.villainFirst, 'sys');
  if (c.weakened) {
    log(S.ui.halfStart, 'sys');
    c.weakened = false;
  }

  while (state.status === 'ongoing') {
    renderActions(state, true);
    const action = await choose<PlayerAction>(actionsEl);
    renderActions(state, false);
    const next = playRound(state, action, rng, data);
    await animateRound(state, next);
    state = next;
    renderBadges(state);
  }

  // Resultado
  battlePlayer = null;
  const overlay = root.querySelector<HTMLElement>('#overlay')!;
  const won = state.status === 'won';
  const msg = won ? S.ui.battleWon : setup.exam ? S.ui.examLost : S.ui.battleLost;
  const atCap = xpToNextLevel(state.player.level, data) === null;
  const xpLine = won && !atCap ? `<p class="xp-gain pop">${S.ui.xpGained(villainsById[setup.villainId]!.xp)}</p>` : '';
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
          const slices = initiativeSlices(p0.speed, prev.villain.def.speed);
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
          log(S.log.skip(who(ev.side)), 'sys');
          break;
        case 'rest':
          disp.pck += ev.chakra;
          floatNumber(pcard, `+${ev.chakra} ck`, 'ck');
          log(S.log.rest(ev.chakra));
          break;
        case 'gates':
          disp.php -= ev.hpLost;
          floatNumber(pcard, `−${ev.hpLost}`, 'dmg');
          log(S.log.gates(ev.hpLost), 'good');
          break;
        case 'guaranteedCrit':
          critForced = true;
          log(S.log.guaranteedCrit, 'good');
          break;
        case 'movementReading':
          log(S.log.movementReading(ev.damageBefore, ev.damage), 'good');
          break;
        case 'attack': {
          const mine = ev.side === 'player';
          if (mine) disp.pck -= playerTechnique(p0, ev.attackType, data).chakraCost;
          else disp.vck -= prev.villain.def.techniques.find((t) => t.id === ev.techniqueId)?.chakraCost ?? 0;
          if (!(mine && critForced)) {
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
          const el = ev.elementMult > 1 ? S.log.elementAdv : ev.elementMult < 1 ? S.log.elementDis : '';
          const tech = techName(ev.techniqueId);
          if (ev.outcome === 'miss') {
            log(S.log.attackMiss(who(ev.side), tech), 'muted');
            floatNumber(mine ? vcard() : pcard, 'errou', 'miss');
          } else if (ev.attackType === 'genjutsu') {
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
          log(S.log.debilitate(who(ev.target), ev.turns), ev.target === 'villain' ? 'good' : 'bad');
          break;
        case 'debilitateResisted':
          log(S.log.debilitateResisted(who(ev.target)), 'sys');
          break;
        case 'regen':
          disp.php += ev.hp;
          disp.pck += ev.chakra;
          log(S.log.regen(ev.hp, ev.chakra), 'good');
          break;
        case 'surge': {
          const cfg = data.balance.jinchuuriki.surge;
          await stripRoulette(
            dice,
            S.passives.jinchuuriki!.name,
            [
              { label: S.ui.surgeModes.control!, weight: cfg.controlChance, color: '#4cd07d' },
              { label: S.ui.surgeModes.frenzy!, weight: 1 - cfg.controlChance, color: '#ff5a3c' },
            ],
            ev.mode === 'control' ? 0 : 1,
            pace.strip() * 1.5,
          );
          disp.php += ev.healed;
          log(S.log.surge(S.ui.surgeModes[ev.mode]!, ev.healed), 'jin');
          break;
        }
        case 'surgeDrain':
          disp.php -= ev.hpLost;
          floatNumber(pcard, `−${ev.hpLost}`, 'dmg');
          log(S.log.surgeDrain(ev.hpLost), 'bad');
          break;
        case 'revive':
          disp.php = next.player.maxHp;
          disp.pck = next.player.maxChakra;
          floatNumber(pcard, '❤ retorno', 'heal');
          log(S.log.revive(ev.revivesLeft), 'good');
          break;
        case 'medical':
          disp.pck -= playerMedical(p0, data)?.chakraCost ?? 0;
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
        case 'poison':
          log(S.log.poison(ev.value), 'good');
          break;
        case 'poisonTick':
          disp.vhp -= ev.damage;
          floatNumber(vcard(), `−${ev.damage} 🐍`, 'dmg');
          log(S.log.poisonTick(ev.damage), 'good');
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

async function rewardScreen(title: string, tier: number, spins: number): Promise<void> {
  const c = camp!;
  const tierName = S.rewardTiers[tier] ?? '';
  const root = show(
    h(`<div class="screen"><h2>${title}</h2><p class="center"><span class="chip tier tier-${tier}">${S.ui.rewardTier(tierName)}</span></p>
      <div id="slot"></div><div id="results"></div><div id="hud"></div><div id="cta"></div></div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const results = root.querySelector<HTMLElement>('#results')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods, c.weakened);

  for (let i = 0; i < spins; i++) {
    const roll = rollReward(c.player, rng, data);
    const label = spins > 1 ? `${S.roulettes.reward} · ${S.ui.spinOf(i + 1, spins)}` : S.roulettes.reward;
    await bigWheel(slot, label, rollSlices(roll, (id) => S.rewards[id]!), roll.index);
    let step: Step;
    if (roll.value === 'item') {
      await sleep(settings.instant ? 0 : 400);
      const item = rollItem(rng, data);
      await bigWheel(slot, S.roulettes.item, rollSlices(item, (id) => S.items[id]!), item.index);
      step = applyItem(c.player, item.value, rng);
    } else {
      step = applyReward(c.player, roll.value, tier, rng, data);
    }
    applyStep(step);
    results.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
    hud.innerHTML = playerPanel(c.player, c.mods, c.weakened);
    hud.firstElementChild?.classList.add('pulse');
    if (i < spins - 1) await sleep(settings.instant ? 100 : 900);
  }
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
}

// ---------------------------------------------------------------------------
// XP e subida de nível

/** Ganha o XP do vilão derrotado; a roleta de nível só gira quando o XP do nível se completa. */
async function awardXp(villainId: string): Promise<void> {
  const c = camp!;
  c.player = gainXp(c.player, villainsById[villainId]!.xp, data);
  while (canLevelUp(c.player, data)) await levelUpScreen();
}

async function levelUpScreen(): Promise<void> {
  const c = camp!;
  const root = show(
    h(`<div class="screen"><h2>${S.ui.levelUpTitle}</h2><p class="center"><span class="chip tier tier-2">${S.ui.levelLabel(c.player.level + 1)}</span></p>
      <div id="slot"></div><div id="results"></div><div id="hud"></div><div id="cta"></div></div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods, c.weakened);

  const roll = rollLevelUp(c.player, rng, data);
  await bigWheel(slot, S.roulettes.levelUp, rollSlices(roll, (id) => S.levelStats[id] ?? id), roll.index);
  const step = levelUp(c.player, roll.value, data);
  applyStep(step);
  root
    .querySelector('#results')!
    .insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(step.effect)}</div>`);
  hud.innerHTML = playerPanel(c.player, c.mods, c.weakened);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
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
      let wins = 0;
      for (let j = 0; j < stage.villains.length; j++) {
        if (data.balance.exam.restoreBetweenFights) c.player = fullRestore(c.player);
        const result = await battleScreen({
          villainId: stage.villains[j]!,
          options: { allowRevive: false },
          label: `${S.stages.exam} · ${S.ui.fightOf(j + 1, stage.villains.length)}`,
          exam: true,
        });
        // Perder no exame não mata: nunca sai dele com 0 de HP.
        c.player = { ...result.player, hp: Math.max(1, result.player.hp) };
        if (result.status === 'won') {
          wins++;
          await awardXp(stage.villains[j]!);
        }
      }
      if (data.balance.campaign.restoreBetweenStages) c.player = fullRestore(c.player);
      const reward = data.balance.exam.rewardByWins[wins] ?? data.balance.exam.rewardByWins[0]!;
      await rewardScreen(S.ui.examResult(wins, stage.villains.length), reward.tier, reward.spins);
      continue;
    }

    await eventScreen(stage);
    for (let j = 0; j < stage.villains.length; j++) {
      const first = j === 0;
      const result = await battleScreen({
        villainId: stage.villains[j]!,
        options: first ? { villainStartsFirst: c.mods.villainStartsFirst, guaranteedCrit: c.mods.guaranteedCrit } : {},
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
      const finalFight = i === campaign.length - 1 && j === stage.villains.length - 1;
      if (!finalFight) await awardXp(stage.villains[j]!);
    }
    if (i === campaign.length - 1) break;
    if (data.balance.campaign.restoreBetweenStages) c.player = fullRestore(c.player);
    await rewardScreen(S.ui.battleWon, stage.rewardTier, 1);
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
