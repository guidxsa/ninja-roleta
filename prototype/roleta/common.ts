// Roleta: textos, componentes (painel do jogador, Ficha, trilha), roletas e o registro da etapa. Usado pelas telas.
import { ragePortraits } from '../../src/data/portraits';
import { newAchievements } from '../../src/core/achievements';
import { type Difficulty } from '../../src/core/difficulty';
import { critChance } from '../../src/core/hit';
import { lineageOf } from '../../src/core/origin';
import { type PlayerState, xpToNextLevel, equipTrainingWeights } from '../../src/core/player';
import { type ProgressEffect, type NextFightMods, type Step, type Roll, spendCoin, rollItem, applyItem } from '../../src/core/progression';
import { createRng } from '../../src/core/rng';
import { type RBattle, techBase, kitOf, kitActives } from '../../src/core/roleta/battle';
import { playerTechniques } from '../../src/core/roleta/player';
import { type RRun, currentCategory } from '../../src/core/roleta/run';
import { summarizeRoletaFight } from '../../src/core/roleta/stats';
import { addFight } from '../../src/core/runStats';
import { type LineageTier, type Element, type Origin, type SummonAnimal, type ConsumableId } from '../../src/core/types';
import { achievements } from '../../src/data/achievements';
import { type Stage } from '../../src/data/campaign';
import { CONSUMABLES } from '../../src/data/events';
import { roletaData as rdata } from '../../src/data/roleta/index';
import { type RTechniqueDef } from '../../src/data/roleta/techniques';
import { roletaVillainsById as villainsById } from '../../src/data/roleta/villains';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { achievementsFromHistory, saveProfile, syncHardcoreUnlock, recordFight, killedByCounts, unlockAchievements, discoverRelics } from '../../src/state/profile';
import { loadRuns, type RunStatus, updateRun } from '../../src/state/runHistory';
import { fighterPortrait, villainPortrait, icon, clanSymbol, ninjaPortrait, sceneMedia } from '../art';
import { type Mood, mood } from '../audio';
import { barPct, barTone, barLayers, patchBar } from '../bars';
import { esc, h, openDialog, choose } from '../dom';
import { foldAttrs, foldButton } from '../jornada/fold';
import { relicSlot } from '../jornada/relics';
import { prefersStill } from '../layout';
import { elementChip, lines, techIconName, ELEMENT_COLORS, rTechTip } from '../tips';
import { tip } from '../tooltip';
import { type WheelSlice, createWheel } from '../wheel';
import { RACTIVE_ICONS } from './screens/battle';
import { elementChips, silentNature } from './screens/origin';
import { ses, type StepLog, type Campaign } from './session';

// ---------------------------------------------------------------------------
// Infra

/** Base do Roleta enxuto: linhagens, níveis, eventos, itens e recompensas (sem pool de técnicas nem upgrades). */
export const data = rdata.base;

/** Versão do jogo (package.json), embutida pelo build. */
declare const __VERSION__: string;
export const VERSION = typeof __VERSION__ === 'undefined' ? 'dev' : __VERSION__;

/** Seed da run que começa agora. Com `?seed=`, só a primeira run da página repete a seed. */
export function nextRunSeed(): number | null {
  if (ses.seed !== null) {
    const seed = ses.seedUsed ? null : ses.seed;
    ses.seedUsed = true;
    return seed;
  }
  const seed = Math.floor(Math.random() * 2 ** 31);
  ses.rng = createRng(seed);
  return seed;
}

/**
 * Ritmo das animações. Com menos movimento pedido pelo aparelho, as roletas param direto no resultado: o CSS já zera a
 * transição, e esperar o giro deixaria a tela parada 3 s.
 */
export const pace = {
  wheel: () => (ses.settings.instant || prefersStill() ? 0 : 3000),
  strip: () => (ses.settings.instant || prefersStill() ? 0 : 600),
  beat: () => (ses.settings.instant ? 140 : 480),
};


// ---------------------------------------------------------------------------
// Textos e cores

/** Fatias das roletas: laranja, verde do colete, azul do chakra, vermelho, areia, roxo, verde-água e marinho. */
export const PALETTE = ['#a8332b', '#b8892f', '#3f5f9e', '#4e8a68', '#7d4d8f', '#5d6b78', '#a65a2e', '#6f7a3a'];
export const TIER_COLORS: Record<LineageTier, string> = { common: '#5d6168', clan: '#3f5f9e', rare: '#b8892f', legendary: '#a8332b' };
export const SIDE_COLORS = { player: '#3f5f9e', villain: '#a8332b', miss: '#55585e', hit: '#4e8a5c', crit: '#c49a3a', foeHit: '#b5562c' };

export const villainName = (id: string) => S.villains[id] ?? id;
/** Retrato do vilão: o desenho próprio ou, nos vindos da Jornada, o retrato emprestado de lá. */
export const foePortrait = (id: string, size: 'sm' | 'md' | 'lg' = 'md', rage = false) => {
  // Retrato de fúria (só visual, src/data/portraits.ts): a outra face do vilão quando o HP cai à metade.
  const spec = (rage ? ragePortraits[id] : undefined) ?? villainsById[id]?.portrait;
  return spec ? fighterPortrait(rage && ragePortraits[id] ? `${id}-rage` : id, spec, size) : villainPortrait(id, size);
};
export const techName = (id: string): string => {
  // Cópia (Uchiha): `copy:<vilão>.<técnica>`.
  if (id.startsWith('copy:')) return `${techName(id.slice(id.indexOf('.') + 1))} (cópia)`;
  // Cópia do Sharingan no Roleta: `rCopy:<técnica do vilão>`.
  if (id.startsWith('rCopy:')) return S.roleta.ui.copied(techName(id.slice(6)));
  return S.roleta.techniques[id] ?? S.techniques[id] ?? id;
};
/** Chip de elemento com ícone; `withTip` = false dentro de botões (o botão já tem a própria dica). */
export const elChip = (el: Element | null, withTip = true) => elementChip(el, withTip);
/** Nível de técnica em algarismos romanos (I, II, III...). */
export const roman = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] ?? String(n);

export function originLabel(o: Origin): string {
  return o.lineageId ? S.lineages[o.lineageId] ?? o.lineageId : S.origin.common;
}

export function stageName(stage: Stage): string {
  if (stage.kind === 'exam') return S.stages.exam;
  const names = stage.villains.map(villainName);
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`;
}

/** Som do resultado: perdas e azares soam mal; o que só vira XP ou não muda nada soa neutro. */
export function effectMood(e: ProgressEffect): Mood {
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
export function showEffect(container: HTMLElement, e: ProgressEffect) {
  container.insertAdjacentHTML('beforeend', `<div class="effect pop">${effectText(e)}${effectCompare(e)}</div>`);
  mood(effectMood(e));
  revealAboveCta(container);
}

/**
 * Celular: depois do giro, rola até o resultado ficar acima da faixa presa no pé (Voltar ao mapa | Lutar). Sem isso o
 * que se ganhou ficava escondido atrás do botão, e o "Lutar" convidava a pular. No PC o resultado já abre num popup.
 */
function revealAboveCta(el: HTMLElement): void {
  if (matchMedia('(min-width: 900px) and (min-height: 560px)').matches) return;
  // Dois quadros: a faixa do CTA entra logo depois do efeito, e a altura dela entra na conta.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const cta = document.querySelector<HTMLElement>('#screen .sticky-cta');
      const ctaH = cta ? cta.getBoundingClientRect().height : 0;
      const overflow = el.getBoundingClientRect().bottom - (innerHeight - ctaH - 8);
      if (overflow <= 0) return;
      const still = ses.settings.instant || matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: overflow, behavior: still ? 'auto' : 'smooth' });
    }),
  );
}

/** Melhoria de equipamento, invocação ou técnica: o atual ao lado do novo. */
export function effectCompare(e: ProgressEffect): string {
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

export function effectText(e: ProgressEffect): string {
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
      if (ses.camp?.player.dojutsu === 'sharingan' && evolved > 0) lines.push(E.sharinganEvolved(evolved + 1));
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

export const stepKey = (cycle: number, step: number) => `${cycle}:${step}`;
/** Registro da etapa atual (criado na primeira vez). */
export function stepLog(): StepLog | null {
  if (!ses.camp || ses.logStep < 0) return null;
  const key = stepKey(ses.camp.run.cycle, ses.logStep);
  return (ses.camp.log[key] ??= { items: [] });
}

/** O botão Ficha do cabeçalho só aparece quando há o que mostrar: run do Roleta ou da Jornada. */
export function syncSheetBtn() {
  document.body.classList.toggle('has-sheet', Boolean(ses.camp) || Boolean(ses.jornadaSheet));
}
export const NO_MODS: NextFightMods = { villainStartsFirst: false, playerStartsFirst: false };
/** A run com o jogador e os modificadores atuais (que as telas mexem direto em `camp`). */
export const getRun = (): RRun => ({ ...ses.camp!.run, player: ses.camp!.player, mods: ses.camp!.mods });
export const setRun = (r: RRun) => {
  ses.camp!.run = r;
  ses.camp!.player = r.player;
  ses.camp!.mods = r.mods;
};

// ---------------------------------------------------------------------------
// Perfil: conquistas e Livro Bingo (localStorage)

/** Na primeira vez, libera os marcos que o histórico já prova (sem aviso). */
export function backfillProfile() {
  if (ses.profile.backfilled) return;
  ses.profile = { ...unlockAchievements(ses.profile, achievementsFromHistory(loadRuns(ses.storage)), new Date()), backfilled: true };
  saveProfile(ses.storage, ses.profile);
}

/**
 * Hardcore liberado: guardado no perfil (o histórico tem só as últimas runs). Toda run passa pela tela da origem, então
 * a vitória que libera é vista aqui enquanto ainda está no histórico.
 */
export function hardcoreUnlocked(): boolean {
  const next = syncHardcoreUnlock(ses.profile, loadRuns(ses.storage), data.balance.difficulty.hardcoreUnlockedBy);
  if (next !== ses.profile) {
    ses.profile = next;
    saveProfile(ses.storage, ses.profile);
  }
  return Boolean(ses.profile.hardcoreUnlocked);
}

/** Uma luta da campanha: entra nas estatísticas da run e no Livro Bingo. */
export function noteFight(villainId: string, exam: boolean, battle: RBattle) {
  if (!ses.camp) return;
  const fight = summarizeRoletaFight(villainId, exam, battle);
  ses.camp.stats = addFight(ses.camp.stats, fight);
  ses.profile = recordFight(ses.profile, fight);
  saveProfile(ses.storage, ses.profile);
  checkAchievements('inProgress', null);
}

/** Libera as conquistas novas e avisa cada uma. O laboratório não conta. */
export function checkAchievements(result: 'inProgress' | 'victory' | 'defeat', fallenTo: string | null) {
  if (!ses.camp) return;
  const ids = newAchievements(achievements, {
    stats: ses.camp.stats,
    origin: ses.camp.origin,
    difficulty: ses.camp.difficulty,
    level: ses.camp.player.level,
    summon: ses.camp.player.summon,
    result,
    fallenTo,
    killedBy: killedByCounts(ses.profile),
    unlocked: new Set(Object.keys(ses.profile.achievements)),
    // Ciclos vencidos: no fim do 1º a run fica em `victory`; dos seguintes, o ciclo já avançou.
    cyclesWon: ses.camp.run.status === 'victory' ? ses.camp.run.cycle + 1 : ses.camp.run.cycle,
  });
  if (ids.length === 0) return;
  ses.profile = unlockAchievements(ses.profile, ids, new Date());
  saveProfile(ses.storage, ses.profile);
  ids.forEach((id, i) => setTimeout(() => toast(S.achievements.unlocked(S.achievements.list[id]?.name ?? id), 'medal'), i * 2800));
}

export function track(patch: { status?: RunStatus; furthestStage?: number; difficulty?: Difficulty; cycle?: number; fights?: number }) {

  // Runs do laboratório não entram no histórico.
  if (!ses.camp) return;
  updateRun(ses.storage, ses.camp.runId, { ...patch, revivesUsed: ses.camp.player.revivesUsed }, new Date(), data.balance.history.maxRuns);
}

export function applyStep(step: Step) {
  if (!ses.camp) return;
  ses.camp.player = step.player;
  ses.camp.mods = { ...ses.camp.mods, ...step.mods };
  // A trilha guarda o que cada etapa deu (evento, recompensa, nível, melhoria).
  if (step.effect.kind !== 'none') stepLog()?.items.push(effectText(step.effect));
}

// ---------------------------------------------------------------------------
// Componentes

export function bar(kind: 'hp' | 'ck', cur: number, max: number): string {
  const pct = barPct(cur, max);
  const tone = barTone(kind, pct);
  const name = S.stats[kind === 'hp' ? 'hp' : 'chakra'];
  return `<div class="bar bar-${kind}${tone ? ` ${tone}` : ''}" data-bar="${kind}"${tip(name, S.tips.stats[kind === 'hp' ? 'hp' : 'chakra'])}>${barLayers(pct)}<span>${name} ${cur}/${max}</span></div>`;
}

/** Atualiza a barra no lugar (com o rastro de dano), sem trocar o elemento. */
export function setBar(root: HTMLElement, kind: 'hp' | 'ck', cur: number, max: number) {
  const el = root.querySelector<HTMLElement>(`[data-bar="${kind}"]`);
  const v = Math.max(0, Math.round(cur));
  if (el) patchBar(el, kind, v, max, `${S.stats[kind === 'hp' ? 'hp' : 'chakra']} ${v}/${max}`);
}

export function modChips(mods: NextFightMods): string {
  const chips = [];
  if (mods.villainStartsFirst) chips.push(`<span class="chip bad">${icon('timer')}${S.ui.villainFirst}</span>`);
  if (mods.playerStartsFirst) chips.push(`<span class="chip good">${icon('dodge')}${S.ui.playerFirst}</span>`);
  return chips.join('');
}

/** Caixa de status com a dica do que ele faz. */
export function statBox(key: keyof typeof S.stats, value: string | number): string {
  const T = S.tips.stats;
  const desc = T[key];
  // Na caixa estreita, o rótulo curto ("Res. mental" virava "RES. MEN…" a 390px); o nome inteiro fica na dica.
  const label = (S.statsShort as Partial<Record<string, string>>)[key] ?? S.stats[key];
  return `<div${tip(S.stats[key], desc)}><small>${label}</small><b>${value}</b></div>`;
}

/** Selo redondo da linhagem (ou da folha), com o nome do clã na dica. */
export function clanSeal(p: PlayerState): string {
  const id = p.origin.lineageId;
  const tier = id ? lineageOf(id, data).tier : 'common';
  const name = id ? S.lineages[id] ?? id : S.origin.common;
  const tierName = S.lineageTiers[tier] ?? '';
  return `<span class="clan-seal clan-${id ?? 'common'}"${tip(name, tierName)}>${clanSymbol(id)}</span>`;
}

/** Ícone da técnica do jogador: elemento, ou o tipo (taijutsu, ninjutsu, genjutsu). */
export function techIcon(t: RTechniqueDef): string {
  return icon(techIconName(t.type, t.element ?? null));
}

/** Classes e cor de uma célula de técnica (tipo + elemento). */
export function techLook(type: string, element: Element | null): { cls: string; style: string } {
  return {
    cls: `type-${type}${element ? ` el-${element}` : ''}`,
    style: element ? ` style="--c:${ELEMENT_COLORS[element]}"` : '',
  };
}

/** Técnicas do kit enxuto na ficha: dano no nível atual, golpes, precisão e custo (efeitos na dica). */
export function techniqueRows(p: PlayerState): string {
  return playerTechniques(p, rdata)
    .map((t) => {
      const look = techLook(t.type, t.element ?? null);
      const dmg = techBase(p, t, rdata);
      const info = S.roleta.ui.techLine(dmg, t.hits ?? 1, Math.round((t.accuracy ?? data.balance.hit.defaultAccuracy) * 100));
      return `<li class="tech-card ${look.cls}"${look.style}${rTechTip(p, t)}><span class="tc-ico">${techIcon(t)}</span><span class="tc-txt"><b>${esc(techName(t.id))}</b><small>${S.actions[t.type]} · ${info} · ${S.ui.cost(t.chakra)}</small></span></li>`;
    })
    .join('');
}

export interface PassiveEntry {
  ico: string;
  name: string;
  desc: string;
}

/** Passiva do kit enxuto da linhagem e a do jinchuuriki. */
export function passiveTraitEntries(p: PlayerState): PassiveEntry[] {
  const R = S.roleta;
  const kit = kitOf(p, rdata);
  const out: PassiveEntry[] = [{ ico: clanSymbol(p.origin.lineageId), ...R.passives[kit.passive]! }];
  if (p.jinchuuriki) out.push({ ico: clanSymbol('jinchuuriki'), ...R.passives.jinchuuriki! });
  return out;
}

/** Selo compacto de passiva, com a descrição na dica. */
export function passiveChip(e: PassiveEntry): string {
  return `<span class="chip passive-chip"${tip(e.name, e.desc)}>${e.ico}${e.name}</span>`;
}

/** Dica do nome da linhagem: passivas, ativas, dōjutsu, despertar e talentos, um por linha. */
export function lineageTip(p: PlayerState): string {
  return tip(originLabel(p.origin), lines(passiveEntries(p).map((e) => `<b>${e.name}</b> · ${e.desc}`)));
}

/**
 * Passivas e dōjutsu do jogador. `li`: linha completa (ficha); `p`: selo compacto com a descrição na dica (painéis).
 */
export function passiveItems(p: PlayerState, tag: 'li' | 'p'): string[] {
  return passiveEntries(p).map((e) =>
    tag === 'li' ? `<li${tip(e.name, e.desc)}><span class="pi-ico">${e.ico}</span><span><b>${e.name}</b> · ${e.desc}</span></li>` : passiveChip(e),
  );
}

/** Passiva, ativas já liberadas pelo nível (mais a do jinchuuriki) e o despertar alcançado. */
export function passiveEntries(p: PlayerState): PassiveEntry[] {
  const out: PassiveEntry[] = passiveTraitEntries(p);
  for (const active of kitActives(p, rdata)) out.push({ ico: icon(RACTIVE_ICONS[active] ?? 'ninjutsu'), ...S.roleta.actives[active]! });
  const aw = S.awakening[p.origin.lineageId ?? 'common'];
  for (const level of [4, 7]) if (aw?.[level] && p.level >= level) out.push({ ico: clanSymbol(p.origin.lineageId), name: S.ui.awakeningTitle(level), desc: aw[level]! });
  return out;
}

/** Valor atual do efeito passivo da invocação (para o inventário). */
export function summonEffect(p: PlayerState): string {
  if (!p.summon) return '';
  return S.summonEffects[p.summon.animal]!(p.summon.level);
}

/** Retrato do ninja (desenho da linhagem ou imagem própria em img/ninja/) com o selo do clã. */
export function avatar(p: PlayerState, size: 'sm' | 'lg' = 'sm'): string {
  return `<span class="avatar avatar-${size}">${ninjaPortrait(p.origin.lineageId, p.jinchuuriki, size === 'lg' ? 'lg' : 'sm')}${clanSeal(p)}</span>`;
}

export function xpBar(p: PlayerState): string {
  const need = xpToNextLevel(p.level, data);
  const pct = Math.min(100, (p.xp / need) * 100);
  return `<div class="bar bar-xp"${tip('XP', S.tips.stats.xp)}><div class="fill" style="width:${pct}%"></div><span>${S.ui.xp(p.xp, need)}</span></div>`;
}

export function diffChip(d: Difficulty): string {
  return `<span class="chip diff diff-${d}"${tip(S.difficulty[d].name, S.difficulty[d].desc)}>${S.difficulty[d].name}</span>`;
}

export function jinChip(p: PlayerState): string {
  if (!p.jinchuuriki) return '';
  const body = lines([S.passives.jinchuuriki!, S.passives.innerDemon!].map((t) => `<b>${t.name}</b> · ${t.desc}`));
  return `<span class="chip jin"${tip(S.origin.jinchuuriki, body)}>${clanSymbol('jinchuuriki')}${S.origin.jinchuuriki}</span>`;
}

/** Relíquias do Roleta: fileira de ícones com o efeito de lá na dica. */
export function roletaRelicBar(p: PlayerState): string {
  const ids = p.relics ?? [];
  return ids.length ? `<div class="jrbar" role="list" aria-label="${S.roleta.run.relicsTitle}">${ids.map((id) => relicSlot(id, 'span', '', 'roleta')).join('')}</div>` : '';
}

/** Relíquias que apareceram no Roleta entram na coleção do perfil. */
export function discoverRoletaRelics(ids: readonly string[]) {
  if (!ids.length) return;
  const next = discoverRelics(ses.profile, ids, new Date());
  if (next === ses.profile) return;
  ses.profile = next;
  saveProfile(ses.storage, ses.profile);
}

export function playerPanel(p: PlayerState, mods: NextFightMods = NO_MODS): string {
  const passives = passiveItems(p, 'p').join('');
  return `
  <section class="card player-panel">
    <div class="panel-head">
      ${avatar(p)}
      <div class="panel-id">
        ${ses.profile.playerName ? `<b class="name player-name">${esc(ses.profile.playerName)}</b>` : ''}
        <b class="name${ses.profile.playerName ? ' name-sub' : ''}"${lineageTip(p)}>${originLabel(p.origin)}</b>
        <div class="chips-left"><span class="chip lvl-chip">${S.ui.levelLabel(p.level)}</span>${elementChips(p.elements, p.kekkeiGenkai, silentNature(p))}${jinChip(p)}${ses.camp ? diffChip(ses.camp.difficulty) : ''}</div>
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

export const SUMMON_ICONS: Record<SummonAnimal, string> = { toad: 'toad', snake: 'snake', slug: 'slug' };

/** Bolsa ninja agrupada por categoria (só agrupa o que já existe): equipamento, consumíveis, pergaminhos e moedas. */
export function bagSlots(p: PlayerState): string {
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


/** Atributo com régua: o número e uma barra relativa ao maior atributo de combate do ninja. */
export function attrRow(key: keyof typeof S.stats, value: number, top: number): string {
  const pct = top > 0 ? Math.max(6, Math.min(100, (value / top) * 100)) : 0;
  return `<li${tip(S.stats[key], S.tips.stats[key])}><span>${S.stats[key]}</span><b>${value}</b><i style="width:${pct}%"></i></li>`;
}

/** Pedaços da ficha (janela e painéis do mapa no PC): cabeçalho com atributos, relíquias e bolsa, técnicas, passivas. */
export function sheetParts(c: Campaign) {
  const p = ses.battlePlayer?.() ?? c.player;
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
          <h2 class="sheet-name">${ses.profile.playerName ? esc(ses.profile.playerName) : originLabel(p.origin)}</h2>
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

export function sheetHtml(c: Campaign): string {
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
export function sheetPanels(c: Campaign): string {
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
export function openSheet() {
  if (document.querySelector('.sheet-wrap')) return;
  if (ses.jornadaSheet) return ses.jornadaSheet();
  if (!ses.camp) return;
  const overlay = h(`<div class="sheet-wrap" role="dialog" aria-label="${S.ui.sheet}">
    <div class="scroll">
      <div class="rod"></div>
      ${sheetHtml(ses.camp)}
      <div class="rod"></div>
      <button class="btn primary sheet-close" data-close>${S.ui.close}</button>
    </div></div>`);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('[data-close]')) overlay.remove();
  });
  openDialog(overlay);
}

/**
 * Trilha do ciclo: cada etapa tem duas linhas, o **Evento** pré-luta e o **Confronto** (categoria e vilão). Etapa vencida
 * expande e mostra o evento e o que ela deu (registro em `camp.log`).
 */
export function stageTrail(run: RRun, log: Record<string, StepLog> = ses.camp?.log ?? {}): string {
  const RR = S.roleta.run;
  const done = run.status === 'victory' ? rdata.cycle.length : run.step;
  return `<ol class="trail rtrail">${rdata.cycle
    .map((cat, i) => {
      const state = i < done ? 'done' : i === done ? 'current' : 'todo';
      const id = i < done ? run.used[i] : i === done ? run.villainId : null;
      const entry = log[stepKey(run.cycle, i)];
      const faces = id ? `<span class="trail-faces">${foePortrait(id, 'sm')}</span>` : `<span class="trail-ico">${icon(cat === 'boss' ? 'intent' : 'swords')}</span>`;
      const sub = cat === 'boss' ? RR.chestTitle : RR.relicRewardTitle;
      const ev = `<div class="rrow ev"><span class="rrow-ico">${icon('dice')}</span><div><small class="rtag">${RR.eventRow}</small><span>${entry?.event ?? RR.eventPending}</span></div></div>`;
      const fight = `<div class="rrow fight"><i><span>${i < done ? icon('check') : i + 1}</span></i>${faces}<div><small class="rtag">${RR.fightRow}</small><b><span class="rcat"${categoryTip(cat)}>${RR.categories[cat]}</span>${id ? ` · ${villainName(id)}` : ''}</b><small>${sub}</small></div></div>`;
      if (state === 'done' && entry) {
        const items = entry.items.length ? entry.items.map((t) => `<li>${t}</li>`).join('') : `<li class="muted">${RR.noRewards}</li>`;
        return `<li class="rstep done"><details><summary>${ev}${fight}<span class="rstep-more" aria-hidden="true">${icon('chevron')}</span></summary>
          <div class="rstep-log"><h4>${RR.rewardsTitle}</h4><ul>${items}</ul></div></details></li>`;
      }
      return `<li class="rstep ${state}">${ev}${fight}</li>`;
    })
    .join('')}</ol>`;
}

export function progressDots(current: number) {
  const el = document.getElementById('dots')!;
  el.innerHTML = rdata.cycle.map((_, i) => `<i class="${i < current ? 'done' : i === current ? 'current' : ''}"></i>`).join('');
}

/** Gira uma roleta grande dentro de `slot`: botão "Girar" (ou automático no modo instantâneo). */
export async function bigWheel(slot: HTMLElement, title: string, slices: WheelSlice[], index: number): Promise<void> {
  const wheel = createWheel(slices);
  const box = h(`<div class="wheel-box"><h3>${title}</h3></div>`);
  box.appendChild(wheel.el);
  slot.replaceChildren(box);
  if (!ses.settings.instant) {
    const btn = h(`<button class="btn primary spin" data-choice="spin">${S.ui.spin}</button>`) as HTMLButtonElement;
    box.insertBefore(btn, wheel.el.nextSibling);
    await choose(box);
    // Some sem tirar o espaço: com a caixa encolhendo, a roda (centrada no palco) mudava de lugar ao girar.
    btn.disabled = true;
    btn.classList.add('spent');
  }
  await wheel.spinTo(index, pace.wheel());
  // Carimbo do resultado por cima da roda; não muda o tempo do giro e não bloqueia o toque.
  if (!ses.settings.instant) {
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
export async function spinRoll<T extends string>(
  slot: HTMLElement,
  title: string,
  roll: () => Roll<T>,
  label: (id: T) => string,
): Promise<Roll<T>> {
  const c = ses.camp!;
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
export async function itemFlow(slot: HTMLElement): Promise<Step> {
  const c = ses.camp!;
  const item = await spinRoll(slot, S.roulettes.item, () => rollItem(c.player, ses.rng, data), (id) => S.items[id]!);
  const step = applyItem(c.player, item.value, ses.rng, data);
  if (step.effect.kind !== 'trainingWeights') return step;
  const box = h(`<div class="result-card"><p>${S.ui.weightsAsk}</p><div class="actions-row">
    <button class="btn" data-choice="keep">${S.ui.weightsKeep}</button>
    <button class="btn primary" data-choice="equip">${S.ui.weightsEquip}</button></div></div>`);
  slot.appendChild(box);
  const choice = await choose<'keep' | 'equip'>(box);
  box.remove();
  return choice === 'equip' ? { ...step, player: equipTrainingWeights(step.player, data) } : step;
}

export function rollSlices<T extends string>(roll: Roll<T>, label: (id: T) => string, color?: (id: T, i: number) => string) {
  return roll.slices.map((s, i) => ({
    label: label(s.value),
    weight: s.weight,
    color: color ? color(s.value, i) : PALETTE[i % PALETTE.length]!,
  }));
}

// ---------------------------------------------------------------------------
// Roleta no PC (docs/visual.md, "Roleta no PC"): palco com arte atrás das roletas e arte da categoria no mapa e na
// luta. Sem imagem na vaga, o cenário desenhado da categoria (nunca um aviso de imagem faltando). No celular, some.

export const CATEGORY_SCENE: Record<string, string> = { genin: 'konoha', chunin: 'arena', jounin: 'forest', boss: 'valleyEnd' };

/** Categoria da luta atual (ou a primeira, antes da run). */
export const roletaCategory = (): string => (ses.camp ? currentCategory(getRun(), rdata) : 'genin');

/**
 * Dica da categoria (mapa e trilha): a recompensa e os vilões dela. Os que estão no Livro Bingo
 * aparecem com retrato e nome; os ainda não encontrados ficam como incógnita.
 */
export function categoryTip(cat: string): string {
  const RR = S.roleta.run;
  const ids = rdata.categories[cat as keyof typeof rdata.categories] ?? [];
  const known = ids.filter((id) => (ses.profile.villains[id]?.faced ?? 0) > 0);
  const reward = cat === 'boss' ? RR.chestTitle : RR.relicRewardTitle;
  const faces = ids
    .map((id) => (known.includes(id) ? `<span class="ctip-v">${foePortrait(id, 'sm')}<small>${villainName(id)}</small></span>` : `<span class="ctip-v unknown"><span class="ctip-q">?</span><small>${RR.catUnknown}</small></span>`))
    .join('');
  return tip(RR.categories[cat] ?? cat, `<p class="ctip-sum">${RR.catTipBody(reward)} ${RR.catKnown(known.length, ids.length)}</p><div class="ctip-grid">${faces}</div>`);
}

/** Arte de uma vaga do Roleta num contêiner `cls`; sem imagem, o cenário desenhado `scene`. */
export function roletaArt(key: string, scene: string, cls: string, inner = ''): string {
  const art = sceneMedia(key);
  return `<div class="${cls}${art ? '' : ` jscene scene-${scene}`}" aria-hidden="true">${art ?? ''}${inner}</div>`;
}

/** Palco das roletas: a arte (da entrada ou da categoria) atrás do `#slot`. */
export function rstage(key = `roleta-${roletaCategory()}`, scene = CATEGORY_SCENE[roletaCategory()] ?? 'konoha'): string {
  return roletaArt(key, scene, 'rstage');
}

/** Aviso curto sobre a tela, que some sozinho. */
export function toast(text: string, ico = '') {
  const el = h(`<div class="toast" role="status">${ico ? icon(ico) : ''}<span>${esc(text)}</span></div>`);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
