// Modo Jornada no protótipo (docs/jornada/): início, trilha da História, paradas, talentos, moveset e
// relíquias. As regras ficam em src/core/jornada; aqui só a interface. A run salva a cada parada.
import type { Difficulty } from '../../src/core/difficulty';
import { eventOptions } from '../../src/core/jornada/events';
import {
  afterWinRecovery,
  battleSetup,
  buy,
  canBuy,
  canContinueCycle,
  chooseBossRelic,
  continueCycle,
  cycleEnemyMult,
  chooseNode,
  choosingNode,
  currentStage,
  currentStop,
  elementOf,
  fightTeam,
  finishFight,
  gainRelic,
  genericStage,
  leaveStop,
  memberSheet,
  memberState,
  newGenericRun,
  newRun,
  nextFightTeam,
  nodeChoices,
  openTreasure,
  resolveEvent,
  rest,
  restHeal,
  openShop,
  shopInflation,
  shopOffer,
  stageCount,
  stageId,
  stageScene,
  journeyProgress,
  stopRng,
  stopScene,
  storyStages,
  syncUnlocks,
  talentTreeComplete,
  xpToNext,
  type ElementChoice,
  type JRun,
  type Purchase,
} from '../../src/core/jornada/run';
import { reachableFrom, type MapNode } from '../../src/core/jornada/map';
import type { Element } from '../../src/core/types';
import { ELEMENT_COLORS } from '../tips';
import { isFight, type StopDef } from '../../src/core/jornada/trail';
import { jornadaData as data } from '../../src/data/jornada';
import { newJornadaAchievements } from '../../src/data/jornada/achievements';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { loadJornada, saveJornada } from '../../src/state/jornadaSave';
import { arcMedia, fighterPortrait, icon, sceneMedia, sceneVars } from '../art';
import { choose, esc, h, openDialog, show, sleep } from '../dom';
import { tip } from '../tooltip';
import { forgetLiveBattle, heroLabel, jornadaBattle, memberLabel } from './battle';
import { movesetScreen } from './moveset';
import { openJornadaSheet } from './sheet';
import type { JornadaHost } from './host';
import { playMinigame } from './minigames';
import { themeOf, themeStyle } from './theme';
import { chestClosed, chestOpen, isEvolution, markRelicsSeen, relicBar, relicCard, relicName, relicSlot, relicsModal, relicTier } from './relics';
import { relicIcon } from './relicIcons';
import { talentTreeScreen } from './talentTree';
import { foldAttrs, foldButton, installFolds } from './fold';
import { WIDE } from '../layout';
import { modeCard } from '../modeCard';

const J = S.jornada;
const U = J.ui;
const G = J.genericStart;
const M = J.map;
const DIFFICULTIES = Object.keys(data.base.difficulty.multipliers) as Difficulty[];

const STOP_ICONS: Record<string, string> = {
  story: 'scroll',
  fight: 'swords',
  elite: 'warning',
  boss: 'intent',
  event: 'focus',
  rest: 'rest',
  treasure: 'item',
};

/** Nome da parada: o da trilha da História, ou (Caminho Ninja) os inimigos da luta / o tipo da parada. */
const stopName = (s: StopDef) =>
  J.stops[s.id] ?? (isFight(s) ? [...new Set(s.enemies.map((e) => J.names[e] ?? e))].join(' e ') : J.stopKinds[s.kind] ?? s.id);
const stageName = (run: JRun) => J.stages[stageId(run, data)] ?? '';
const portraitSpec = (id: string, run?: JRun) =>
  run?.skin && id === run.hero ? `ninja:${run.skin}` : (data.characters[id]?.portrait ?? 'ninja:common');
/** Nome de quem protagoniza, com o nome do jogador no Caminho Ninja. Já escapado: vai direto para o HTML. */
const heroName = (host: JornadaHost, run: JRun) => esc(run.mode === 'generic' ? heroLabel(run.hero, host.playerName()) : (J.names[run.hero] ?? run.hero));
/** Nome com o elemento (Caminho Ninja): "Daichi (Fogo)". Já escapado. */
function memberName(host: JornadaHost, run: JRun, id: string): string {
  const el = run.mode === 'generic' ? elementOf(run, id, data) : null;
  const name = esc(memberLabel(run, id, host.playerName()));
  return el ? J.genericStart.elementOf(name, S.elements[el]) : name;
}
// ---------------------------------------------------------------------------
// Entrada

/** Run em andamento, para a Ficha do cabeçalho e do HUD. */
let live: JRun | null = null;
const keep = (run: JRun): JRun => (live = run);

/** Card "Progresso da Jornada" para o Início do PC ('' sem run salva). O botão (data-choice="continue") continua direto. */
export function jornadaProgressCard(storage: JornadaHost['storage']): string {
  const saved = loadJornada(storage);
  return saved ? progressCard(saved) : '';
}

/** `resume`: atalho do Início, que pula a tela de entrada quando há run salva. */
export async function runJornada(host: JornadaHost, opts: { resume?: boolean } = {}): Promise<void> {
  // Layout próprio (mais largo no PC).
  document.body.classList.add('mode-jornada');
  forgetLiveBattle();
  try {
    await jornadaLoop(host, opts.resume ?? false);
  } finally {
    document.body.classList.remove('mode-jornada');
    host.setSheet(null);
    live = null;
  }
}

/** Ryō de pontos convertidos (árvore completa) já avisado na tela: o resto vira um toast. */
let announcedTalentRyo = 0;

async function jornadaLoop(host: JornadaHost, resume: boolean): Promise<void> {
  installFolds();
  let run = (resume ? loadJornada(host.storage) : null) ?? (await startScreen(host));
  if (!run) return;
  // O retrato das conquistas da árvore acompanha o perfil (save antigo, conquista liberada fora da run).
  run = keep(syncUnlocks(run, host.unlocked(), data));
  announcedTalentRyo = run.stats.talentRyo ?? 0;
  markRelicsSeen(run.relics);
  host.discoverRelics(run.relics);
  host.unlock(newJornadaAchievements(run, host.unlocked()));
  // Um ciclo por volta (o modo infinito do Caminho Ninja segue de ciclo na tela de vitória).
  for (;;) {
    // A Ficha do cabeçalho passa a mostrar a equipe desta run.
    host.setSheet(() => live && openJornadaSheet(host, live));
    let shownStage = run.stageIndex;
    while (run.status === 'inProgress') {
      persist(host, keep(run));
      run = await playStop(host, run);
      host.discoverRelics(run.relics);
      const fresh = newJornadaAchievements(run, host.unlocked());
      if (fresh.length) {
        host.unlock(fresh);
        run = syncUnlocks(run, host.unlocked(), data);
      }
      announceTalentRyo(host, run);
      if (run.status === 'inProgress' && run.stageIndex !== shownStage && !run.bossChoice) {
        const prev = run.mode === 'generic' ? data.generic.stages[shownStage]!.id : storyStages(run, data)[shownStage]!.id;
        shownStage = run.stageIndex;
        await notice(U.stageClear(J.stages[prev] ?? ''), stageName(run));
      }
    }
    const record = host.recordJornada(run);
    host.setSheet(null);
    // Caminho Ninja vencido: a continuação já fica salva (fechar o app ou voltar ao início não perde o ciclo).
    const next = canContinueCycle(run, data) ? continueCycle(run, data, host.unlocked()) : null;
    persist(host, keep(next ?? run));
    if ((await endScreen(host, run, next, record)) !== 'continue' || !next) return;
    run = keep(next);
    host.mood('good');
    await notice(U.cycle(run.cycle + 1), U.cycleStartText(cyclePct(run)));
  }
}

/** Pontos convertidos fora do aviso de vitória (descanso, evento, relíquia, último talento): um toast. */
function announceTalentRyo(host: JornadaHost, run: JRun): void {
  const total = run.stats.talentRyo ?? 0;
  if (total > announcedTalentRyo) host.notify(U.talentRyoToast(total - announcedTalentRyo), 'coin');
  announcedTalentRyo = total;
}

/** Quanto os inimigos do ciclo estão mais fortes que no 1º (em %). */
const cyclePct = (run: JRun) => Math.round((cycleEnemyMult(run, data) - 1) * 100);

/** Chip do ciclo no cabeçalho (só a partir do ciclo 2), com a força dos inimigos na dica. */
const cycleChip = (run: JRun) => (run.cycle > 0 ? `<span class="chip jcycle"${tip(U.cycle(run.cycle + 1), U.cycleTip(cyclePct(run)))}>${icon('cycle')} ${U.cycle(run.cycle + 1)}</span>` : '');

/** Recuperação depois de cada vitória na dificuldade (configuração da run, sem relíquias). */
const recoveryLine = (d: Difficulty) => {
  const r = data.j.run.afterWinRecovery[d]!;
  return `${icon('heart')} ${J.start.recovery(r.hp, r.chakra)}`;
};

/**
 * Entrada da Jornada (docs/visual.md, "Entrada da Jornada"): a mesma composição do Início. Destaque com a arte da
 * Jornada, os dois modos em pergaminho (Modo História e Caminho Ninja) e, ao lado, progresso, dificuldade e conquistas.
 * Cada modo abre a sua tela: a escolha da perspectiva (Naruto ou Sasuke) ou a preparação do Caminho Ninja.
 */
async function startScreen(host: JornadaHost): Promise<JRun | null> {
  for (;;) {
    const saved = loadJornada(host.storage);
    const pick = await entryScreen(host, saved);
    if (pick === 'back') return null;
    if (pick === 'continue' && saved) return saved;
    const run = pick === 'story' ? await campaignScreen(host, saved) : await pathSetupScreen(host, saved);
    if (run) return run;
  }
}

/**
 * Confirma trocar a run salva (o recorde dela conta antes) e libera o começo de uma nova. A salva não é apagada aqui:
 * a nova a substitui quando é salva pela primeira vez, então sair no meio (nome, revelação) não perde as duas.
 */
function replaceSaved(host: JornadaHost, saved: JRun | null): boolean {
  if (!saved) return true;
  if (!window.confirm(J.start.overwrite)) return false;
  if (saved.cycle > 0 || saved.stageIndex > 0 || saved.stopIndex > 0) host.recordJornada(saved);
  return true;
}

/** Salvar falhou (aparelho cheio ou bloqueado): avisa uma vez por sessão, sem interromper. */
let warnedSaveFailed = false;
function persist(host: JornadaHost, run: JRun): void {
  if (saveJornada(host.storage, run) || warnedSaveFailed) return;
  warnedSaveFailed = true;
  host.notify(S.ui.saveFailed, 'warning');
}

async function entryScreen(host: JornadaHost, saved: JRun | null): Promise<'continue' | 'story' | 'path' | 'back'> {
  const hardcoreOk = host.unlocked().has('j_canonHard');
  let diff = host.difficulty();
  if (diff === 'hardcore' && !hardcoreOk) diff = 'normal';
  const hero = sceneMedia('jornada');
  const recent = host.recentAchievements(3, true);
  const quote = J.start.quotes[Math.floor(Math.random() * J.start.quotes.length)]!;
  const root = show(
    h(`<div class="screen gate jgate">
      <div class="gate-main">
        <div class="gate-banner">
          <header class="gate-head">
            <h1 class="logo jlogo"><span class="l1">${J.start.logoTop}</span><span class="l2">${J.start.title}</span></h1>
          </header>
          <div class="gate-hero" aria-hidden="true">${hero ?? ''}</div>
          <blockquote class="parchment gate-quote"><p>${quote.text}</p><cite>${quote.by}</cite></blockquote>
        </div>
        <nav class="gate-modes">
          ${modeCard({ id: 'story', art: arcFan(), artVars: '--ratio:1.25', seal: '史', name: J.start.storyName, desc: J.start.storyDesc, cta: J.start.storyCta })}
          ${modeCard({ id: 'path', art: sceneMedia('modo-caminho') ?? fighterPortrait('commonNinja', 'ninja:common', 'lg'), artVars: sceneVars('modo-caminho'), seal: '道', name: G.title, desc: G.desc, cta: J.start.pathCta })}
        </nav>
        <button class="btn small jstart-back" data-choice="back">${J.start.back}</button>
      </div>
      <aside class="gate-aside">
        ${saved ? progressCard(saved) : ''}
        <div class="difficulty-box parchment"><h3>${J.start.difficulty}</h3>
          <div class="segmented">${DIFFICULTIES.map(
            (d) => `<button class="btn seg diff-${d}" data-diff="${d}" aria-pressed="${d === diff}" ${d === 'hardcore' && !hardcoreOk ? 'disabled' : ''}>${d === 'hardcore' && !hardcoreOk ? `${icon('lock')} ` : ''}${S.difficulty[d].name}</button>`,
          ).join('')}</div>
          <p class="center small" data-recovery>${recoveryLine(diff)}</p>
          <p class="muted center small">${hardcoreOk ? J.start.willOfFireNote : J.start.hardcoreLocked}</p></div>
        ${
          recent.length
            ? `<section class="parchment jrecent"><h3>${J.start.recentTitle}</h3><ul>${recent
                .map((a) => `<li><span class="seal" aria-hidden="true">功</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span><time>${J.start.when(a.days)}</time></li>`)
                .join('')}</ul></section>`
            : ''
        }
      </aside>
    </div>`),
  );
  root.querySelector('.segmented')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-diff]');
    if (!b || b.disabled) return;
    diff = b.dataset.diff as Difficulty;
    host.setDifficulty(diff);
    root.querySelectorAll('[data-diff]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    root.querySelector('[data-recovery]')!.innerHTML = recoveryLine(diff);
  });
  return choose<'continue' | 'story' | 'path' | 'back'>(root);
}

/** Os arcos da História em leque, como arte do card Modo História. */
function arcFan(): string {
  const arts = data.stages.map((s) => arcMedia(s.id)).filter(Boolean);
  if (!arts.length) return fighterPortrait('naruto', 'ninja:uzumaki', 'lg');
  return `<span class="jarc-fan">${arts.map((a, i) => `<span class="jarc-fan-i art-frame" style="--i:${i}">${a}</span>`).join('')}</span>`;
}

/** Perspectivas da História: as campanhas dos dados e a do Sasuke, ainda em design (em breve). */
const PERSPECTIVES = [
  { id: 'naruto', art: 'portao-dia', seal: '陽', time: 'day' },
  { id: 'sasuke', art: 'portao-noite', seal: '影', time: 'night' },
] as const;

/** Modo História: escolher a perspectiva. Dia e noite lado a lado; a do Sasuke fica travada até existir. */
async function campaignScreen(host: JornadaHost, saved: JRun | null): Promise<JRun | null> {
  const C = J.start.campaigns;
  const root = show(
    h(`<div class="screen jcampaigns">
      <header class="jsub-head"><button class="btn small" data-choice="back">${J.start.back}</button><h2>${J.start.storyName}</h2><p class="muted">${C.pick}</p></header>
      <div class="jc-duo">${PERSPECTIVES.map((p) => {
        const open = Boolean(data.campaigns[p.id]);
        const art = sceneMedia(p.art);
        const txt = C[p.id];
        return `<section class="jc-panel jc-${p.time}${open ? '' : ' is-locked'}" data-campaign="${p.id}"${open ? '' : ' aria-disabled="true"'}>
          <span class="jc-art art-frame" aria-hidden="true">${art ?? ''}</span>
          <div class="jc-body parchment">
            <span class="seal jc-seal" aria-hidden="true">${p.seal}</span>
            <h3>${txt.name}</h3><p class="small">${txt.desc}</p>
            ${open ? arcStrip(saved) : `<p class="jc-soon">${icon('lock')} ${C.soon}</p>`}
            ${open ? `<button class="btn primary big" data-choice="${p.id}">${icon('scroll')} ${J.start.startCanon}</button>` : ''}
          </div>
        </section>`;
      }).join('')}</div>
    </div>`),
  );
  scrollToNowArc(root);
  for (;;) {
    const c = await choose<string>(root);
    if (c === 'back') return null;
    if (!data.campaigns[c] || !replaceSaved(host, saved)) continue;
    return newRun(host.nextSeed(), currentDifficulty(host), data, host.unlocked());
  }
}

/** Dificuldade válida para começar (o Hardcore só depois de liberado). */
function currentDifficulty(host: JornadaHost): Difficulty {
  const d = host.difficulty();
  return d === 'hardcore' && !host.unlocked().has('j_canonHard') ? 'normal' : d;
}

/** Caminho Ninja: classe, elemento (só o Comum) e o visual do Sasuke (easter egg), depois a revelação. */
async function pathSetupScreen(host: JornadaHost, saved: JRun | null): Promise<JRun | null> {
  const root = show(
    h(`<div class="screen jpath">
      <header class="jsub-head"><button class="btn small" data-choice="back">${J.start.back}</button><h2>${G.title}</h2><p class="muted">${G.desc}</p></header>
      <section class="jc-panel jpath-poster" aria-hidden="true">
        <span class="jc-art art-frame">${sceneMedia('modo-caminho') ?? sceneMedia('jornada') ?? ''}</span>
        <div class="jc-body parchment"><span class="seal jc-seal">道</span><h3>${J.start.pathStages}</h3>
          <ol class="jpath-stages">${data.generic.stages.map((g, i) => `<li><span class="seal ghost">${ARC_NUMERALS[i] ?? i + 1}</span>${J.stages[g.id] ?? g.id}</li>`).join('')}</ol></div>
      </section>
      <section class="parchment jmode-panel jmode-generic">
        <div class="jmode-card"><div class="jstart-face">${fighterPortrait('commonNinja', 'ninja:common', 'md')}</div>
          <div><h3>${J.start.pathPick}</h3>${bestLine(host)}<p class="muted small">${J.start.infiniteNote}</p></div></div>
        <div class="jclasses">${['common', 'uchiha', 'hyuuga']
          .map((id) => {
            const def = data.generic.classes.find((c) => c.id === id);
            const open = def && (!def.unlock || host.unlocked().has(def.unlock));
            const note = !def ? G.soonClass : open ? G.classes[id]!.desc : G.locked[id]!;
            return `<button class="jclass${open ? '' : ' off'}" data-class="${id}" aria-pressed="${id === 'common'}" ${open ? '' : 'aria-disabled="true"'}>
              <b>${open ? '' : `${icon('lock', 'lock')} `}${G.classes[id]!.name}</b><small>${note}</small></button>`;
          })
          .join('')}</div>
        <div class="jel-pick" data-elements role="group" aria-label="${G.elementTitle}">${ELEMENT_CHOICES.map((c) => elementChoiceButton(c)).join('')}</div>
        ${host.unlocked().has('j_sasukeEgg') ? `<button class="btn small jskin" data-skin aria-pressed="false" hidden>${G.skinSasuke}</button>` : ''}
        <button class="btn primary big" data-choice="generic">${icon('dice')} ${G.start}</button>
      </section>
    </div>`),
  );
  let classId = 'common';
  let skin: string | null = null;
  root.querySelector('[data-skin]')?.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLElement;
    skin = skin ? null : 'sasuke';
    b.setAttribute('aria-pressed', String(Boolean(skin)));
  });
  root.querySelector('.jclasses')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-class]');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    classId = b.dataset.class!;
    root.querySelectorAll('[data-class]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    // Só o Comum escolhe o elemento; só o Uchiha tem o visual do Sasuke.
    root.querySelector<HTMLElement>('[data-elements]')!.hidden = classId !== 'common';
    const skinBtn = root.querySelector<HTMLElement>('[data-skin]');
    if (skinBtn) skinBtn.hidden = classId !== 'uchiha';
  });
  // Elemento do Comum: um elemento, o prodígio (sem elemento) ou sortear (com a relíquia bônus).
  let element: ElementChoice = 'random';
  root.querySelector('[data-elements]')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-element]');
    if (!b) return;
    const v = b.dataset.element!;
    element = v === 'random' ? 'random' : v === 'none' ? null : (v as Element);
    root.querySelectorAll('[data-element]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  for (;;) {
    const c = await choose<'generic' | 'back'>(root);
    if (c === 'back') return null;
    if (!replaceSaved(host, saved)) continue;
    await host.ensurePlayerName();
    const run = newGenericRun(host.nextSeed(), currentDifficulty(host), classId, data, host.unlocked(), classId === 'uchiha' ? skin : null, classId === 'common' ? element : 'random');
    await revealScreen(host, run);
    return run;
  }
}

/** No celular a faixa de arcos rola de lado: abre no arco atual (sem scrollIntoView, que rolaria a página). */
function scrollToNowArc(root: HTMLElement): void {
  const arcs = root.querySelector<HTMLElement>('.jarcs');
  const nowArc = arcs?.querySelector<HTMLElement>('.is-now');
  if (arcs && nowArc) arcs.scrollLeft = nowArc.offsetLeft - arcs.offsetLeft - 8;
}

const ARC_NUMERALS = ['一', '二', '三', '四'];

/**
 * Os arcos da campanha do Naruto em pergaminhos abertos (docs/visual.md, "Arcos da Jornada"): a arte de cada arco
 * (SCENE_ART), o número e o nome. Com uma run da História salva, o arco atual fica em destaque e os de antes, marcados.
 */
function arcStrip(saved: JRun | null): string {
  const stages = storyStages({ campaign: saved?.mode === 'canon' ? saved.campaign : undefined }, data);
  const now = saved?.mode === 'canon' ? saved.stageIndex : -1;
  return `<ol class="jarcs" aria-label="${J.start.arcsTitle}">${stages
    .map((s, i) => {
      const art = arcMedia(s.id);
      const state = i === now ? ' is-now' : i < now ? ' is-done' : '';
      return `<li class="jarc${state}" data-arc="${s.id}"${i === now ? ' aria-current="step"' : ''}>
        <span class="jarc-art art-frame${art ? '' : ` jscene scene-${s.scene}`}" aria-hidden="true">${art ?? ''}</span>
        <span class="seal jarc-n" aria-hidden="true">${ARC_NUMERALS[i] ?? i + 1}</span>
        <b>${J.stages[s.id] ?? s.id}</b>${i === now ? `<small>${J.start.arcNow}</small>` : i < now ? `<small>${icon('check')} ${J.start.arcDone}</small>` : ''}</li>`;
    })
    .join('')}</ol>`;
}

/** Card "Progresso da Jornada" da run salva: capítulo, parada, miniatura, conclusão e o botão Continuar. */
function progressCard(run: JRun): string {
  const pct = Math.round(journeyProgress(run, data) * 100);
  const thumb = arcMedia(stageId(run, data));
  const stop = run.mode === 'canon' ? currentStop(run, data) : null;
  const where = stop ? stopName(stop) : J.start.stageOf(run.stageIndex + 1, stageCount(run, data));
  return `<section class="parchment jprogress">
    <h3>${J.start.progressTitle}</h3>
    <div class="jprogress-row"><div><small>${J.start.chapter}</small><b>${stageName(run)}</b><p class="small">${where}</p></div>
      <span class="jthumb art-frame${thumb ? '' : ` jscene scene-${stageScene(run, data)}`}" aria-hidden="true">${thumb ?? ''}</span></div>
    <div class="jprogress-bar"><span>${J.start.completion[run.mode]}</span><b>${pct}%</b><i><i style="width:${pct}%"></i></i></div>
    <button class="btn primary big" data-choice="continue">${icon('scroll')} ${J.start.continue}${run.cycle > 0 ? ` <span class="chip jcycle">${icon('cycle')} ${U.cycle(run.cycle + 1)}</span>` : ''} <span class="chip diff-${run.difficulty}">${S.difficulty[run.difficulty].name}</span></button>
  </section>`;
}

/** Recorde do modo infinito no cartão do Caminho Ninja (a partir de um ciclo vencido). */
function bestLine(host: JornadaHost): string {
  const best = host.jornadaRecord();
  if (!best || (!best.won && best.cycle < 2)) return '';
  return `<p class="small jbest">${icon('cycle')} ${J.start.best(best.cycle, best.stage, best.won)}</p>`;
}

/** Opções de elemento do Comum na tela de início. */
const ELEMENT_CHOICES = ['random', 'fire', 'wind', 'lightning', 'earth', 'water', 'none'] as const;

function elementChoiceButton(c: (typeof ELEMENT_CHOICES)[number]): string {
  const pressed = `aria-pressed="${c === 'random'}"`;
  if (c === 'random') return `<button type="button" class="jel jel-random" data-element="random" ${pressed}${tip(G.elementRandom, G.elementRandomTip)}>${icon('dice')}<span>${G.elementRandom}</span></button>`;
  if (c === 'none') return `<button type="button" class="jel" data-element="none" ${pressed}${tip(G.elementProdigy, G.elementProdigyTip)}>${icon('taijutsu')}<span>${G.elementProdigy}</span></button>`;
  return `<button type="button" class="jel" data-element="${c}" style="--c:${ELEMENT_COLORS[c]}" ${pressed}${tip(S.elements[c], G.elementChoiceTip(S.elements[c]))}>${icon(c)}<span>${S.elements[c]}</span></button>`;
}

/**
 * Revelação do começo do Caminho Ninja (sem roleta): o elemento (sorteado ou escolhido), o prodígio ou o Hyuuga sem
 * elemento, a relíquia bônus de quem sorteou e os parceiros.
 */
async function revealScreen(host: JornadaHost, run: JRun): Promise<void> {
  const el = elementOf(run, run.hero, data);
  const [a, b] = run.supports.map((id) => memberName(host, run, id));
  const noElement = data.generic.classes.find((c) => c.id === run.classId)?.noElement;
  const line = el ? `${icon(el)} ${G.revealElement(S.elements[el])}` : noElement ? G.revealHyuuga : G.revealProdigy;
  // A relíquia bônus é a que veio além da inicial.
  const bonus = run.elementPick === 'random' ? run.relics.find((id) => data.relics.find((r) => r.id === id)?.tier !== 'starter') : undefined;
  const root = show(
    h(`<div class="screen jreveal"><h2>${run.elementPick === 'random' ? G.revealTitle : G.revealChosen}</h2>
      <div class="jstart-face pop">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'lg')}</div>
      <h3 class="center">${heroName(host, run)}</h3>
      <p class="center">${line}</p>
      ${run.classId === 'uchiha' && run.secondElement ? `<p class="center">${icon(run.secondElement)} ${G.revealSecond(S.elements[run.secondElement])}</p>` : ''}
      ${bonus ? `<h3 class="center">${G.randomBonus}</h3>${relicCard(bonus, '', 'reveal')}` : ''}
      <p class="center muted">${G.revealTeam(a ?? '', b ?? '')}</p>
      <button class="btn primary big" data-choice="ok">${U.continue}</button></div>`),
  );
  host.mood(el || noElement ? 'neutral' : 'good');
  if (bonus) host.discoverRelics([bonus]);
  await choose(root);
}

// ---------------------------------------------------------------------------
// HUD e trilha

function hud(host: JornadaHost, run: JRun): string {
  const need = xpToNext(run.level, data);
  const bag = (['hpKit', 'chakraKit', 'reviveKit'] as const).filter((id) => run.bag[id] > 0).map((id) => `${J.items[id]!.name} ×${run.bag[id]}`);
  return `<section class="card jhud">
    <div class="jhud-top">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'sm')}<b>${heroName(host, run)}</b>
      <span class="chip lvl-chip">${U.level(run.level)}</span><span class="chip">${icon('coin')} ${U.ryo(run.ryo)}</span>
      ${run.willOfFire ? `<span class="chip jin">${icon('willOfFire')} ${run.willOfFire}</span>` : ''}</div>
    <div class="bar bar-xp"><div class="fill" style="width:${Math.min(100, (run.xp / need) * 100)}%"></div><span>${U.xp(run.xp, need)}</span></div>
    <div class="jhud-team">${[run.hero, ...nextFightTeam(run, data)]
      .map((id) => {
        const st = memberState(run, id, data);
        const sh = memberSheet(run, id, data);
        return `<div class="jhud-member">${fighterPortrait(id, portraitSpec(id, run), 'sm')}<div><b>${memberName(host, run, id)}</b>
          <div class="bar bar-hp jbar"><div class="fill" style="width:${(st.hp / sh.maxHp) * 100}%"></div><span>${st.hp}/${sh.maxHp}</span></div>
          <div class="bar bar-ck jbar"><div class="fill" style="width:${(st.chakra / sh.maxChakra) * 100}%"></div></div></div></div>`;
      })
      .join('')}</div>
    <div class="jhud-actions">
      <button class="btn small" data-open="sheet">${icon('book')} ${U.sheetBtn}</button>
      <button class="btn small" data-open="talents">${icon('scroll')} ${U.talentsBtn}${run.talentPoints ? ` <span class="badge">${run.talentPoints}</span>` : ''}</button>
      <button class="btn small" data-open="moveset">${icon('swords')} ${U.movesetBtn}</button>
      <button class="btn small jhud-shop" data-open="shop"${tip(U.shopBtn, U.shopTip)}>${icon('tag')} ${U.shopBtn}</button>
    </div>
    <div class="jhud-extra"${foldAttrs('extras')}>${foldButton('extras')}<h4 class="jfold-title">${U.extrasTitle}</h4>
      ${relicBar(run)}
      ${bag.length ? `<p class="muted small">${U.bagTitle}: ${bag.join(' · ')}</p>` : ''}</div>
  </section>`;
}

function trail(run: JRun): string {
  const stage = currentStage(run, data);
  // História: o painel mostra a arte do arco (SCENE_ART), com o número e o nome; sem arte, o cenário desenhado do local.
  const art = sceneMedia(`arco-${stage.id}`);
  const arc = art
    ? `<figure class="jtrail-art art-frame" data-arc="${stage.id}" aria-hidden="true">${art}<figcaption><span class="seal">${ARC_NUMERALS[run.stageIndex] ?? run.stageIndex + 1}</span>${J.stages[stage.id] ?? ''}</figcaption></figure>`
    : '';
  return `<div class="jtrail-scene ${art ? 'jtrail-arc' : 'jscene'} scene-${stopScene(run, data)}">${arc}<ol class="jtrail">${stage.stops
    .map((s, i) => {
      const state = i < run.stopIndex ? 'done' : i === run.stopIndex ? 'here' : 'next';
      const mark = state === 'here' ? `<span class="jstop-hero">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'sm')}</span>` : `<span class="jstop-ico">${state === 'done' ? icon('check') : icon(STOP_ICONS[s.kind]!)}</span>`;
      return `<li class="jstop ${state} k-${s.kind}">${mark}
        <span class="jstop-txt"><b>${stopName(s)}</b><small>${J.stopKinds[s.kind]}</small></span></li>`;
    })
    .join('')}</ol></div>`;
}

function trailLegend(): string {
  return `<details class="jlegend"><summary>${U.legend}</summary><ul>${Object.keys(J.stopKinds)
    .map((k) => `<li>${icon(STOP_ICONS[k]!)} <b>${J.stopKinds[k]}</b> · ${J.stopKindDesc[k]}</li>`)
    .join('')}</ul></details>`;
}

// ---------------------------------------------------------------------------
// Painéis do widescreen (docs/visual.md, "Celular e desktop"): o que vem pela frente, dicas e a loja ao lado.
// Abaixo da faixa WIDE (../layout) o CSS esconde a próxima parada e a dica; a loja embutida nem é montada.



function hintText(run: JRun, salt: number): string {
  const c = data.j.combat;
  const r = data.j.run;
  const fmt = (n: number) => String(n).replace('.', ',');
  const pct = (n: number) => Math.round(n * 100);
  const H = U.hints;
  const rec = afterWinRecovery(run, data);
  const all = [
    H.elements(fmt(c.elementAdvantage), fmt(c.elementDisadvantage)),
    H.clones(pct(data.base.clones.blockChance)),
    H.guard,
    H.rest(c.restChakra),
    H.bag(r.bagLimit),
    H.revive(pct(c.reviveHpPct)),
    H.downed(pct(r.downedAllyReturnPct)),
    H.recovery(rec.hp, rec.chakra),
    H.elite,
    H.restStop,
    U.shopPriceRule(pct(data.j.shop.perPurchase), pct(data.j.shop.perStage)),
    H.moveset,
    H.tooltips,
  ];
  // Muda a cada parada, sem sortear: estágio e posição escolhem a frase.
  return all[(run.stageIndex * 5 + salt) % all.length]!;
}

function hintCard(run: JRun, salt: number): string {
  return `<section class="card jhint"${foldAttrs('hint')}>${foldButton('hint')}<h3>${icon('scroll')} ${U.hintTitle}</h3><p>${hintText(run, salt)}</p></section>`;
}

/** Próxima parada da História: quem espera na luta (ou o que é a parada) e as seguintes. */
function trailNext(run: JRun, stop: StopDef): string {
  let body: string;
  if (isFight(stop)) {
    const foes = battleSetup(run, data).enemies;
    const goal = goalText(stop);
    body = `<ul class="jnext-foes">${foes
      .map((f) => {
        const id = f.defId!;
        const def = data.enemies[id]!;
        const el = def.element ? `${icon(def.element)} ${S.elements[def.element]}` : '';
        const ai = J.ai[def.ai];
        return `<li>${fighterPortrait(id, def.portrait, 'sm')}<span><b>${J.names[id] ?? id}</b><small>${U.foeLine(el, f.maxHp)}</small>${ai ? `<small class="muted">${ai}</small>` : ''}</span></li>`;
      })
      .join('')}</ul>${goal ? `<p class="jnext-goal">${esc(goal)}</p>` : ''}`;
  } else body = `<p class="muted small">${J.stopKindDesc[stop.kind] ?? ''}</p>`;
  const after = currentStage(run, data).stops.slice(run.stopIndex + 1, run.stopIndex + 4);
  return `<section class="card jnext"${foldAttrs('next')}>${foldButton('next')}
    <h3>${U.nextTitle}</h3>
    <div class="jnext-stop k-${stop.kind}">${icon(STOP_ICONS[stop.kind]!)}<span><b>${stopName(stop)}</b><small>${J.stopKinds[stop.kind]}</small></span></div>
    ${body}
    ${after.length ? `<h4>${U.afterTitle}</h4><ol class="jnext-list">${after.map((s) => `<li class="k-${s.kind}">${icon(STOP_ICONS[s.kind]!)}<span>${stopName(s)}<small>${J.stopKinds[s.kind]}</small></span></li>`).join('')}</ol>` : ''}
  </section>`;
}

/** Caminho Ninja: os tipos de nó que dá para escolher agora. */
function mapNext(run: JRun): string {
  const kinds = [...new Set(nodeChoices(run).map((n) => n.kind))];
  return `<section class="card jnext"${foldAttrs('paths')}>${foldButton('paths')}<h3>${U.openPaths}</h3><ul class="jnext-list">${kinds
    .map((k) => `<li class="k-${k}">${k === 'unknown' ? '<b class="jq">?</b>' : icon(NODE_ICONS[k]!)}<span>${nodeKindName(k)}<small>${nodeKindDesc(k)}</small></span></li>`)
    .join('')}</ul></section>`;
}

/**
 * Miolo da loja: prateleira de relíquias, bolsa, treino e tratamento. Serve à tela cheia (celular, botão Loja)
 * e ao painel fixo do widescreen; as regras são as mesmas (`shopOffer`, `canBuy`, `buy`). Devolve o redesenho.
 */
function shopPanel(el: HTMLElement, host: JornadaHost, get: () => JRun, set: (r: JRun) => void, onBuy: () => void): () => void {
  const first = shopOffer(get(), data);
  host.discoverRelics(first.relics.map((r) => r.id));
  let shelfPick: string | undefined = first.relics.find((r) => !get().relics.includes(r.id))?.id ?? first.relics[0]?.id;
  const render = () => {
    const run = get();
    const offer = shopOffer(run, data);
    const owned = (id: string) => run.relics.includes(id);
    const btn = (p: Purchase, key: string) => {
      const ok = canBuy(run, p, data);
      const label = p.kind === 'relic' && owned(p.id) ? U.owned : p.kind === 'item' && !canBuy({ ...run, ryo: 1e9 }, p, data) ? U.full : `${U.buy} · ${U.ryo(p.price)}`;
      return `<button class="btn small" data-buy="${key}" ${ok ? '' : 'disabled'}>${label}</button>`;
    };
    const picked = offer.relics.find((r) => r.id === shelfPick);
    el.innerHTML = `
      <h3>${U.relicsTitle}</h3>
      <div class="jrshelf">${offer.relics
        .map((r) => `<button type="button" class="jrshelf-item tier-${relicTier(r.id)}${r.id === shelfPick ? ' on' : ''}${owned(r.id) ? ' sold' : ''}" data-shelf="${r.id}">
          <span class="jrslot big tier-${relicTier(r.id)}">${relicIcon(r.id)}</span><span class="jrprice">${owned(r.id) ? U.owned : U.ryo(r.price)}</span></button>`)
        .join('')}</div>
      ${picked ? relicCard(picked.id, btn({ kind: 'relic', ...picked }, `r:${picked.id}`), 'stack') : ''}
      <h3>${U.bagTitle}</h3>${offer.consumables
        .map((c) => `<div class="jrelic"><span class="jrelic-ico">${icon('kit')}</span><span class="jrelic-txt"><b>${J.items[c.id]!.name}</b><small>${J.items[c.id]!.desc}</small></span>${btn({ kind: 'item', ...c }, `i:${c.id}`)}</div>`)
        .join('')}
      ${talentTreeComplete(run, data) ? '' : `<div class="jrelic"><span class="jrelic-ico">${icon('scroll')}</span><span class="jrelic-txt"><b>${U.training}</b></span>${btn({ kind: 'training', price: offer.training }, 't')}</div>`}
      <div class="jrelic"><span class="jrelic-ico">${icon('medical')}</span><span class="jrelic-txt"><b>${U.treatment}</b></span>${btn({ kind: 'treatment', price: offer.treatment }, 'heal')}</div>`;
  };
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const shelf = t.closest<HTMLElement>('[data-shelf]');
    if (shelf) {
      shelfPick = shelf.dataset.shelf;
      return render();
    }
    const b = t.closest<HTMLButtonElement>('[data-buy]');
    if (!b || b.disabled) return;
    const offer = shopOffer(get(), data);
    const [kind, id] = b.dataset.buy!.split(':');
    const p: Purchase =
      kind === 'r'
        ? { kind: 'relic', ...offer.relics.find((r) => r.id === id)! }
        : kind === 'i'
          ? { kind: 'item', ...offer.consumables.find((c) => c.id === id)! }
          : kind === 't'
            ? { kind: 'training', price: offer.training }
            : { kind: 'treatment', price: offer.treatment };
    set(keep(buy(get(), p, data)));
    host.mood('good');
    render();
    onBuy();
  });
  render();
  return render;
}

function inflationChip(el: HTMLElement, run: JRun): void {
  const pct = Math.round(shopInflation(run, data) * 100);
  el.hidden = pct === 0;
  el.textContent = U.shopInflation(pct);
  el.dataset.tip = `<b class="tip-title">${U.shopTitle}</b>${U.shopPriceRule(Math.round(data.j.shop.perPurchase * 100), Math.round(data.j.shop.perStage * 100))}`;
}

/**
 * Loja fixa na coluna da build, só no widescreen. Montar abre a loja (`openShop` grava a prateleira e as relíquias
 * contam como vistas), por isso ela só existe quando aparece de fato e some se a janela estreitar.
 * Devolve a função que redesenha a loja quando a run muda por fora (talentos, moveset).
 */
function dockShop(root: HTMLElement, host: JornadaHost, get: () => JRun, set: (r: JRun) => void, changed: () => void): () => void {
  const dock = root.querySelector<HTMLElement>('[data-shop-dock]');
  if (!dock) return () => {};
  const mq = window.matchMedia(WIDE);
  let redraw: (() => void) | null = null;
  const chip = () => {
    const c = dock.querySelector<HTMLElement>('[data-inflation]');
    if (c) inflationChip(c, get());
  };
  const sync = () => {
    if (!root.isConnected) return mq.removeEventListener('change', sync);
    if (mq.matches && !redraw) {
      set(keep(openShop(get(), data)));
      persist(host, get());
      dock.innerHTML = `${foldButton('shop')}<h3 class="jdock-title">${icon('tag')} ${U.shopTitle} <span class="chip" data-inflation></span></h3><div data-shop></div>`;
      dock.hidden = false;
      redraw = shopPanel(dock.querySelector<HTMLElement>('[data-shop]')!, host, get, set, () => {
        chip();
        changed();
      });
      chip();
    } else if (!mq.matches && redraw) {
      dock.hidden = true;
      dock.innerHTML = '';
      redraw = null;
    }
  };
  mq.addEventListener('change', sync);
  sync();
  return () => {
    redraw?.();
    chip();
  };
}

/** Botões do HUD (talentos, moveset, relíquias) funcionam em qualquer tela que mostre o HUD. */
function wireHud(root: HTMLElement, host: JornadaHost, get: () => JRun, set0: (r: JRun) => void, refresh: () => void) {
  const set = (r: JRun) => set0(keep(r));
  root.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
    if (!b) return;
    const kind = b.dataset.open;
    if (kind === 'sheet') return openJornadaSheet(host, get());
    if (kind === 'talents') set(await talentTreeScreen(host, get(), heroName(host, get())));
    else if (kind === 'moveset') set(await movesetScreen(get()));
    else if (kind === 'shop') set(await shopScreen(host, get()));
    else relicsModal(get(), b.dataset.relic);
    refresh();
  });
}

/** Executa a parada atual (luta, evento, mercador, descanso ou tesouro). */
function runStop(host: JornadaHost, run: JRun, stop: StopDef): Promise<JRun> {
  if (isFight(stop)) return fightStop(host, run, stop);
  if (stop.kind === 'event') return eventStop(host, run);
  if (stop.kind === 'rest') return restStop(host, run);
  return treasureStop(host, run);
}

async function playStop(host: JornadaHost, run: JRun): Promise<JRun> {
  if (run.bossChoice) {
    host.discoverRelics(run.bossChoice);
    return bossChoiceScreen(run);
  }
  if (run.mode === 'generic') {
    if (choosingNode(run)) return mapScreen(host, run);
    const stop = currentStop(run, data)!;
    const node = run.map!.nodes.find((n) => n.id === run.nodeId)!;
    if (node.kind === 'unknown') await notice(M.unknown, M.became(J.stopKinds[stop.kind] ?? stop.kind));
    return runStop(host, run, stop);
  }
  const stop = currentStop(run, data)!;
  let cur = run;
  const team = isFight(stop) ? fightTeam(run, stop, data) : [];
  const teamLine = isFight(stop)
    ? `<p class="jteam">${[run.hero, ...team].map((id) => fighterPortrait(id, portraitSpec(id), 'sm')).join('')}<span class="muted small">${team.length ? team.map((id) => esc(memberLabel(run, id, host.playerName()))).join(', ') : U.solo}</span></p>`
    : '';
  // Colunas: build (HUD e loja) | trilha | o que vem (próxima parada, dica, seguir). No celular as colunas se desfazem.
  const root = show(
    h(`<div class="screen jtrail-screen">
      ${stageTitle(run, 'data-choice="abandon"')}
      <div class="jcol jcol-l"><div data-hud>${hud(host, cur)}</div><section class="card jshop-dock" data-shop-dock hidden${foldAttrs('shop')}></section></div>
      ${trail(cur)}
      <div class="jcol jcol-r">${trailNext(cur, stop)}${hintCard(cur, cur.stopIndex)}${trailLegend()}
        <div class="sticky-cta">${teamLine}<button class="btn primary big" data-choice="go">${icon(STOP_ICONS[stop.kind]!)} ${U.go(stopName(stop))}</button></div></div>
    </div>`),
  );
  const refreshHud = () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(host, cur);
    persist(host, cur);
  };
  const redrawShop = dockShop(root, host, () => cur, (r) => (cur = r), refreshHud);
  wireHud(root, host, () => cur, (r) => (cur = r), () => {
    refreshHud();
    redrawShop();
  });
  for (;;) {
    const c = await choose<'go' | 'abandon'>(root);
    if (c === 'go') break;
    if (window.confirm(U.abandonConfirm)) return { ...cur, status: 'defeat' };
  }
  return runStop(host, cur, stop);
}

/**
 * Título do estágio acima da trilha ou da carta: "Estágio n/t", o nome em destaque, o pedido da tela (no mapa)
 * e, à direita, ciclo, dificuldade e o Abandonar discreto. `abandon` é o atributo do botão em cada tela.
 */
function stageTitle(run: JRun, abandon: string, prompt = ''): string {
  return `<div class="jstage-title">
    <div class="jstage-name"><small>${J.stageOf(run.stageIndex + 1, stageCount(run, data))}</small><h2>${stageName(run)}</h2>${prompt ? `<p class="jb-prompt">${prompt}</p>` : ''}</div>
    <div class="jstage-meta">${cycleChip(run)}<span class="chip diff-${run.difficulty}">${S.difficulty[run.difficulty].name}</span>
      <button class="btn small jgiveup" ${abandon}${tip(U.abandon, J.battle.giveUpDesc)}>${icon('warning')} ${U.abandon}</button></div>
  </div>`;
}

/** Card "Sua run" da coluna do que vem (widescreen): só números que a run já guarda. */
function runCard(run: JRun): string {
  const R = U.runRows;
  const rec = afterWinRecovery(run, data);
  const rows: [string, string][] = [
    [R.progress, `${Math.round(journeyProgress(run, data) * 100)}%`],
    [R.wins, `${run.stats.wins}/${run.stats.fights}`],
    [R.bestHit, String(run.stats.bestHit)],
    [R.alliesLost, String(run.stats.alliesLost)],
    [R.relics, String(run.relics.length)],
    [R.purchases, String(run.shopPurchases ?? 0)],
    [R.recovery, U.recoveryShort(rec.hp, rec.chakra)],
  ];
  if (run.cycle > 0) rows.push([R.cycle, String(run.cycle + 1)]);
  return `<section class="card jnext jrun"${foldAttrs('run')}>${foldButton('run')}<h3>${U.runTitle}</h3><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></section>`;
}

// ---------------------------------------------------------------------------
// Mapa ramificado (Caminho Ninja)

const NODE_ICONS: Record<string, string> = { ...STOP_ICONS };
const nodeKindName = (k: string) => (k === 'unknown' ? M.unknown : (J.stopKinds[k] ?? k));
const nodeKindDesc = (k: string) => (k === 'unknown' ? M.unknownDesc : (J.stopKindDesc[k] ?? ''));

/** Deslocamento fixo de cada nó (pelo id, sem sortear): o mapa não parece uma grade. */
function nodeJitter(id: string): { x: number; y: number } {
  let h = 7;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return { x: ((h & 0xff) / 255 - 0.5) * 7, y: (((h >> 8) & 0xff) / 255 - 0.5) * 16 };
}

/** Mapa do estágio: de baixo para cima, chefe no topo, rota feita em pincelada e o herói na posição atual. */
function mapView(run: JRun, hudHtml: string): string {
  const map = run.map!;
  const choices = new Set(nodeChoices(run).map((n) => n.id));
  const done = new Set(run.path);
  const ahead = reachableFrom(map, [...choices]);
  // Posições em % do campo interno da carta (.jmap-field, com margem para o chefe, a rosa e o herói não tocarem a
  // borda). O tremor de cada nó era em px numa linha de 74px; aqui vira fração da linha.
  const rowPct = 100 / map.rows;
  const pos = (n: MapNode) => {
    const j = n.kind === 'boss' ? { x: 0, y: 0 } : nodeJitter(n.id);
    // O chefe (retrato grande) sobe para a margem de cima, longe da linha de baixo.
    const lift = n.kind === 'boss' ? 0.15 : 0.5;
    return { x: ((n.col + 0.5) / map.cols) * 100 + j.x, y: (map.rows - 1 - n.row + lift + j.y / 74) * rowPct };
  };
  const fmt = (v: number) => v.toFixed(2);
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const last = run.path.at(-1) ?? null;
  const walked = new Set(run.path.slice(1).map((id, i) => `${run.path[i]}>${id}`));
  const paths = map.nodes
    .flatMap((n) =>
      n.next.map((id) => {
        const m = byId.get(id)!;
        const a = pos(n);
        const b = pos(m);
        const midY = (a.y + b.y) / 2;
        const cls = walked.has(`${n.id}>${id}`) ? 'walked' : n.id === last && choices.has(id) ? 'open' : ahead.has(n.id) && ahead.has(id) ? 'ahead' : 'dead';
        return `<path class="${cls}" d="M${fmt(a.x)} ${fmt(a.y)}C${fmt(a.x)} ${fmt(midY)} ${fmt(b.x)} ${fmt(midY)} ${fmt(b.x)} ${fmt(b.y)}"/>`;
      }),
    )
    .join('');
  const boss = genericStage(run, data).bosses[run.bossPlan[run.stageIndex] ?? 0]!;
  const nodes = map.nodes
    .map((n) => {
      const st = done.has(n.id) ? 'done' : choices.has(n.id) ? 'choice' : ahead.has(n.id) ? 'ahead' : 'dead';
      const inner = n.kind === 'boss' ? fighterPortrait(boss[0]!, data.enemies[boss[0]!]!.portrait, 'sm') : done.has(n.id) ? icon('check') : n.kind === 'unknown' ? '<b class="jq">?</b>' : icon(NODE_ICONS[n.kind]!);
      const p = pos(n);
      // O conteúdo é só ícone (ou "?"): o nome do tipo de parada vai no rótulo, com o chefe quando é ele.
      const label = n.kind === 'boss' ? `${nodeKindName(n.kind)}: ${boss.map((id) => J.names[id] ?? id).join(' e ')}` : nodeKindName(n.kind);
      return `<button class="jnode-map k-${n.kind} ${st}" style="left:${fmt(p.x)}%;top:${fmt(p.y)}%" data-node="${n.id}" aria-label="${esc(label)}" ${st === 'choice' ? '' : 'aria-disabled="true"'}${tip(nodeKindName(n.kind), nodeKindDesc(n.kind))}>${inner}</button>`;
    })
    .join('');
  // O herói fica no último nó feito; antes da primeira escolha, embaixo do mapa.
  const here = last ? pos(byId.get(last)!) : { x: 50, y: 100 };
  const legend = ['fight', 'elite', 'unknown', 'rest', 'treasure', 'boss']
    .map((k) => `<span class="jlegend-chip k-${k}"${tip(nodeKindName(k), nodeKindDesc(k))}>${k === 'unknown' ? '<b class="jq">?</b>' : icon(NODE_ICONS[k]!)}${nodeKindName(k)}</span>`)
    .join('');
  // Colunas: build (HUD e loja) | título, carta e legenda | o que vem (chefe, caminhos, sua run, dica).
  // No celular as colunas se desfazem e o CSS refaz a ordem: título, HUD, chefe, carta, legenda.
  return `${stageTitle(run, 'data-abandon', M.choose)}
    <div class="jcol jcol-l"><div data-hud>${hudHtml}</div><section class="card jshop-dock" data-shop-dock hidden${foldAttrs('shop')}></section></div>
    <div class="jcol jcol-r"><div class="jmap-boss">${fighterPortrait(boss[0]!, data.enemies[boss[0]!]!.portrait, 'sm')}<span><small>${M.bossLabel}</small><b>${boss.map((id) => J.names[id] ?? id).join(' e ')}</b></span></div>
      ${mapNext(run)}${runCard(run)}${hintCard(run, run.path.length)}</div>
    <div class="jtrail-map"><div class="jmap jscene scene-${stageScene(run, data)}" style="--rows:${map.rows}"><div class="jmap-field">
      <svg class="jmap-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>${nodes}
      <span class="jmap-hero" style="left:${fmt(here.x)}%;top:${fmt(here.y)}%" aria-hidden="true">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'sm')}</span>
    </div></div></div>
    <div class="jlegend-chips" aria-label="${U.legend}">${legend}</div>`;
}

async function mapScreen(host: JornadaHost, run: JRun): Promise<JRun> {
  let cur = run;
  const root = show(
    h(`<div class="screen jtrail-screen jmap-screen">
      ${mapView(cur, hud(host, cur))}
    </div>`),
  );
  const refreshHud = () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(host, cur);
    persist(host, cur);
  };
  const redrawShop = dockShop(root, host, () => cur, (r) => (cur = r), refreshHud);
  wireHud(root, host, () => cur, (r) => (cur = r), () => {
    refreshHud();
    redrawShop();
  });
  // Rola o mapa até os nós que dá para escolher (no celular o mapa é comprido).
  root.querySelector('.jnode-map.choice')?.scrollIntoView({ block: 'center', behavior: host.instant() ? 'auto' : 'smooth' });
  return new Promise((resolve) => {
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-abandon]')) {
        if (window.confirm(U.abandonConfirm)) resolve({ ...cur, status: 'defeat' });
        return;
      }
      const b = t.closest<HTMLElement>('.jnode-map.choice');
      if (b) resolve(chooseNode(cur, b.dataset.node!));
    });
  });
}

// ---------------------------------------------------------------------------
// Paradas

function goalText(stop: Extract<StopDef, { enemies: string[] }>): string | null {
  const w = stop.win;
  if (!w || w.kind === 'defeatAll') return null;
  if (w.kind === 'hpThreshold') return J.winConditions.hpThreshold(Math.round(w.pct * 100));
  return J.winConditions.survive(w.rounds, Math.round(w.pct * 100));
}

async function fightStop(host: JornadaHost, run0: JRun, stop: Extract<StopDef, { enemies: string[] }>): Promise<JRun> {
  let run = run0;
  for (let attempt = 0; ; attempt++) {
    const res = await jornadaBattle(host, data, run, battleSetup(run, data), stopRng(run, attempt), stopName(stop), stopScene(run, data), goalText(stop));
    run = res.run;
    // Desistir no meio da luta: como o Abandonar da trilha, a run acaba em derrota (sem Vontade do Fogo).
    if (res.abandoned) return { ...run, status: 'defeat' };
    const { run: next, outcome } = finishFight(run, res.battle, data);
    if (outcome.retry) {
      await notice(J.battle.lost, U.retry);
      run = next;
      continue;
    }
    if (outcome.won) {
      const lines = [U.rewards(outcome.ryo, outcome.xp, outcome.talent)];
      if (outcome.talentRyo) lines.push(U.talentRyo(outcome.talentRyo));
      if (next.status === 'inProgress') lines.push(stop.kind === 'boss' ? U.restoredAll : U.recovered(afterWinRecovery(next, data).hp, afterWinRecovery(next, data).chakra));
      if (outcome.levelUps) lines.push(U.levelUp(next.level, outcome.talentRyo > 0));
      announcedTalentRyo = next.stats.talentRyo ?? 0;
      await notice(U.victoryTitle, lines.join('\n'));
      if (outcome.relic) {
        host.mood('good');
        await relicReveal(U.eliteRelic, outcome.relic);
      }
    }
    return next;
  }
}

async function eventStop(host: JornadaHost, run: JRun): Promise<JRun> {
  const stop = currentStop(run, data);
  if (stop?.kind !== 'event') return run;
  const def = data.events[stop.event]!;
  const txt = J.events[def.id]!;
  const root = show(
    h(`<div class="screen"><h2>${txt.title}</h2><section class="card"><p>${txt.text}</p></section>
      <div class="joptions">${eventOptions(def, run.flags)
        .map((o) => `<button class="btn big" data-choice="${o.id}">${o.minigame ? `${icon('card')} ` : ''}${txt.options[o.id] ?? o.id}</button>`)
        .join('')}</div><div data-slot></div></div>`),
  );
  const pick = await choose<string>(root.querySelector('.joptions')!);
  const opt = def.options.find((o) => o.id === pick)!;
  root.querySelector('.joptions')!.remove();
  let won = true;
  if (opt.minigame) won = await playMinigame(opt.minigame, root.querySelector('[data-slot]')!, data, stopRng(run, 11), host.instant());
  const { run: next, relic } = resolveEvent(run, pick, won, data);
  if (relic) await relicReveal(U.gotRelic(relicName(relic)), relic);
  return next;
}

/** Loja sempre aberta: sobreposição como a árvore e o moveset, chamada pelo HUD (docs/jornada/run.md#loja). */
function shopScreen(host: JornadaHost, run0: JRun): Promise<JRun> {
  let run = keep(openShop(run0, data));
  persist(host, run);
  const root = h(`<div class="jtree-screen jshop-screen ${themeOf(run.hero).cls}" role="dialog" aria-label="${U.shopTitle}"${themeStyle(run)}><div class="jt-body">
    <div class="jt-head"><h2>${icon('tag')} ${U.shopTitle}</h2><span class="chip" data-ryo></span><span class="chip" data-inflation></span></div>
    <div data-shop></div>
    <div class="sticky-cta"><button class="btn primary big" data-close>${U.leave}</button></div></div></div>`);
  openDialog(root);
  const chips = () => {
    root.querySelector('[data-ryo]')!.innerHTML = `${icon('coin')} ${U.ryo(run.ryo)}`;
    inflationChip(root.querySelector<HTMLElement>('[data-inflation]')!, run);
  };
  shopPanel(root.querySelector<HTMLElement>('[data-shop]')!, host, () => run, (r) => (run = r), () => {
    chips();
    persist(host, run);
  });
  chips();
  return new Promise((resolve) => {
    root.querySelector('[data-close]')!.addEventListener('click', () => {
      root.remove();
      resolve(run);
    });
  });
}

async function restStop(host: JornadaHost, run0: JRun): Promise<JRun> {
  let run = run0;
  const root = show(h(`<div class="screen"><h2>${stopName(currentStop(run, data)!)}</h2><div data-hud>${hud(host, run)}</div>
    <button class="btn big" data-choice="heal">${icon('rest')} ${U.restHeal(restHeal(run, data).hp, restHeal(run, data).chakra)}</button>
    <span data-train>${restTrainButton(run)}</span></div>`));
  // Talentos e loja continuam à mão: o HUD muda a run (e a árvore pode fechar, trocando o Treinar).
  wireHud(root, host, () => run, (r) => (run = r), () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(host, run);
    root.querySelector('[data-train]')!.innerHTML = restTrainButton(run);
    persist(host, run);
  });
  const c = await choose<'heal' | 'train'>(root);
  host.mood('good');
  return rest(run, c, data);
}

/** Treinar no descanso: +1 ponto de talento, ou o ryō dele com a árvore completa. */
function restTrainButton(run: JRun): string {
  if (!talentTreeComplete(run, data)) return `<button class="btn big" data-choice="train">${icon('scroll')} ${U.restTrain}</button>`;
  const ryo = data.j.talentTree.completeRyoPerPoint;
  return `<button class="btn big" data-choice="train"${tip(U.restTrainRyo(ryo), U.restTrainRyoTip(ryo))}>${icon('coin')} ${U.restTrainRyo(ryo)}</button>`;
}

async function treasureStop(host: JornadaHost, run: JRun): Promise<JRun> {
  const root = show(h(`<div class="screen jrtreasure"><h2>${stopName(currentStop(run, data)!)}</h2>
    <button type="button" class="jrchest" data-choice="open" aria-label="${U.openTreasure}">${chestClosed()}</button>
    <div data-slot></div><button class="btn primary big" data-choice="open">${U.openTreasure}</button></div>`));
  await choose(root);
  const id = openTreasure(run, data);
  const next = id ? gainRelic(run, id, data) : run;
  const box = root.querySelector<HTMLElement>('.jrchest')!;
  box.classList.add('opening');
  root.querySelector('.btn[data-choice]')!.remove();
  await sleep(host.instant() ? 0 : 450);
  box.innerHTML = chestOpen();
  box.removeAttribute('data-choice');
  box.classList.add('open');
  root.querySelector('[data-slot]')!.innerHTML = id ? relicCard(id, '', 'reveal') : `<p class="muted center">${U.treasureEmpty}</p>`;
  if (id) host.mood('good');
  root.insertAdjacentHTML('beforeend', `<button class="btn primary big" data-choice="ok">${U.continue}</button>`);
  await choose(root);
  return leaveStop(next, data);
}

/** Relíquia ganha fora do tesouro (evento): card revelado com brilho da raridade. */
async function relicReveal(title: string, id: string): Promise<void> {
  const root = show(h(`<div class="screen jrtreasure"><h2>${esc(title)}</h2>${relicCard(id, '', 'reveal')}
    <button class="btn primary big" data-choice="ok">${U.continue}</button></div>`));
  await choose(root);
}

/** Escolha do chefe: 3 relíquias lado a lado (uma pode ser a evolução da inicial); tocar destaca, o botão confirma. */
async function bossChoiceScreen(run: JRun): Promise<JRun> {
  const options = run.bossChoice!;
  let pick: string | undefined;
  const root = show(h(`<div class="screen jrboss"><h2>${U.bossChoice}</h2>
    <div class="jrboss-row">${options
      .map((id) => `<button type="button" class="jrboss-opt tier-${relicTier(id)}" data-opt="${id}" aria-label="${relicName(id)}">
        <span class="jrslot huge tier-${relicTier(id)}">${relicIcon(id)}</span><b>${relicName(id)}</b>${isEvolution(id) ? `<small class="jrboss-evo">${J.relics.evolution}</small>` : ''}</button>`)
      .join('')}</div>
    <div data-detail><p class="muted center">${U.relicPick}</p></div>
    <div class="sticky-cta"><button class="btn primary big" data-choice="take" disabled>${U.relicPick}</button></div></div>`));
  const take = root.querySelector<HTMLButtonElement>('[data-choice="take"]')!;
  root.querySelector('.jrboss-row')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-opt]');
    if (!b) return;
    pick = b.dataset.opt!;
    root.querySelectorAll('[data-opt]').forEach((x) => x.classList.toggle('on', x === b));
    root.querySelector('[data-detail]')!.innerHTML = relicCard(pick, '', 'pop');
    take.disabled = false;
    take.textContent = U.relicTake(relicName(pick));
  });
  await choose(root.querySelector('.sticky-cta')!);
  return chooseBossRelic(run, pick!, data);
}

// ---------------------------------------------------------------------------
// Modais

async function notice(title: string, text: string): Promise<void> {
  const root = show(h(`<div class="screen"><h2>${esc(title)}</h2><section class="card"><p class="pre">${esc(text)}</p></section>
    <button class="btn primary big" data-choice="ok">${U.continue}</button></div>`));
  await choose(root);
}

/**
 * Fim da run (ou do ciclo). No Caminho Ninja vencido, `next` é o próximo ciclo (já salvo): "Seguir" continua e "Voltar ao
 * início" guarda para depois. Cair a partir do ciclo 2 não é uma derrota comum: a run já foi vencida.
 */
async function endScreen(host: JornadaHost, run: JRun, next: JRun | null, record: boolean): Promise<'continue' | 'ok'> {
  const won = run.status === 'victory';
  const infinite = run.cycle > 0;
  // Do ciclo 2 em diante, o fim é sempre uma conquista: selo dourado.
  const good = won || infinite;
  const stop = currentStop(run, data);
  host.mood(good ? 'good' : 'bad');
  const title = won ? (infinite ? U.cycleWonTitle(run.cycle + 1) : U.victoryTitle) : infinite ? U.infiniteOverTitle : U.defeatTitle;
  const text = won
    ? run.mode === 'generic'
      ? U.runWonGeneric
      : U.runWon
    : infinite
      ? U.infiniteReached(run.cycle + 1, run.stageIndex + 1, stop ? stopName(stop) : '')
      : U.runLost(stop ? stopName(stop) : '');
  const pct = next ? Math.round((cycleEnemyMult(next, data) - 1) * 100) : 0;
  const buttons = next
    ? `<button class="btn primary big" data-choice="continue"${tip(U.nextCycle(next.cycle + 1), U.nextCycleTip(pct))}>${icon('cycle')} ${U.nextCycle(next.cycle + 1)}</button>
       <button class="btn big" data-choice="ok"${tip(U.home, U.homeSavedTip(next.cycle + 1))}>${U.home}</button>`
    : `<button class="btn primary big" data-choice="ok">${U.home}</button>`;
  const root = show(h(`<div class="screen jend ${good ? 'win' : 'lose'}"><h2>${title}</h2>
    <div class="jstart-face end-seal">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'md')}<span class="seal stamp end-stamp${good ? ' gold' : ''}" aria-hidden="true">${good ? '勝' : '敗'}</span></div>
    <p class="center">${text}${record && (infinite || won) && run.mode === 'generic' ? ` <span class="chip jrecord">${icon('medal')} ${U.record}</span>` : ''}</p>
    <p class="center muted">${U.runStats(run.stats.fights, run.stats.wins, run.level)}</p>
    ${run.relics.length ? `<div class="jrbar jrbar-end">${run.relics.map((id) => relicSlot(id, 'span')).join('')}</div>` : ''}
    ${buttons}</div>`));
  await sleep(host.instant() ? 0 : 300);
  return choose<'continue' | 'ok'>(root);
}
