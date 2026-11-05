// Modo Jornada no protótipo (docs/jornada/): início, trilha da História, paradas, talentos, moveset e
// relíquias. As regras ficam em src/core/jornada; aqui só a interface. A run salva a cada parada.
import type { Difficulty } from '../../src/core/difficulty';
import { eventOptions } from '../../src/core/jornada/events';
import {
  afterWinRecovery,
  battleSetup,
  buy,
  canBuy,
  chooseBossRelic,
  chooseNode,
  choosingNode,
  currentStage,
  currentStop,
  elementOf,
  fightTeam,
  finishFight,
  gainRelic,
  genericStage,
  heroActives,
  heroMods,
  heroMovable,
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
  restHealPct,
  setMoveset,
  shopOffer,
  stageCount,
  stageId,
  stageScene,
  stopRng,
  xpToNext,
  MOVESET_SIZE,
  type ElementChoice,
  type JRun,
  type Purchase,
} from '../../src/core/jornada/run';
import { techPower } from '../../src/core/jornada/battle';
import { reachableFrom, type MapNode } from '../../src/core/jornada/map';
import type { Element } from '../../src/core/types';
import { ELEMENT_COLORS } from '../tips';
import { isFight, type StopDef } from '../../src/core/jornada/trail';
import { jornadaData as data } from '../../src/data/jornada';
import { newJornadaAchievements } from '../../src/data/jornada/achievements';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { clearJornada, loadJornada, saveJornada } from '../../src/state/jornadaSave';
import { fighterPortrait, icon } from '../art';
import { choose, esc, h, show, sleep } from '../dom';
import { tip } from '../tooltip';
import { heroLabel, jornadaBattle, memberLabel, techName, techTip } from './battle';
import type { JornadaHost } from './host';
import { playMinigame } from './minigames';
import { chestClosed, chestOpen, isEvolution, markRelicsSeen, relicBar, relicCard, relicName, relicSlot, relicsModal, relicTier } from './relics';
import { relicIcon } from './relicIcons';
import { talentTreeScreen } from './talentTree';

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
  shop: 'tag',
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

export async function runJornada(host: JornadaHost): Promise<void> {
  // Layout próprio (mais largo no PC) e sem o botão Ficha, que é do Roleta.
  document.body.classList.add('mode-jornada');
  try {
    await jornadaLoop(host);
  } finally {
    document.body.classList.remove('mode-jornada');
  }
}

async function jornadaLoop(host: JornadaHost): Promise<void> {
  let run = await startScreen(host);
  if (!run) return;
  markRelicsSeen(run.relics);
  host.discoverRelics(run.relics);
  host.unlock(newJornadaAchievements(run, host.unlocked()));
  let shownStage = run.stageIndex;
  while (run.status === 'inProgress') {
    saveJornada(host.storage, run);
    run = await playStop(host, run);
    host.discoverRelics(run.relics);
    const fresh = newJornadaAchievements(run, host.unlocked());
    if (fresh.length) host.unlock(fresh);
    if (run.status === 'inProgress' && run.stageIndex !== shownStage && !run.bossChoice) {
      const prev = run.mode === 'generic' ? data.generic.stages[shownStage]!.id : data.stages[shownStage]!.id;
      shownStage = run.stageIndex;
      await notice(U.stageClear(J.stages[prev] ?? ''), stageName(run));
    }
  }
  saveJornada(host.storage, run);
  await endScreen(host, run);
}

/** Recuperação depois de cada vitória na dificuldade (configuração da run, sem relíquias). */
const recoveryLine = (d: Difficulty) => `${icon('heart')} ${J.start.recovery(Math.round((data.j.run.afterWinRecovery[d] ?? 0) * 100))}`;

async function startScreen(host: JornadaHost): Promise<JRun | null> {
  const saved = loadJornada(host.storage);
  const hardcoreOk = host.unlocked().has('j_canonHard');
  let diff = host.difficulty();
  if (diff === 'hardcore' && !hardcoreOk) diff = 'normal';
  const root = show(
    h(`<div class="screen jstart">
      <h2>${J.start.title}</h2>
      ${
        saved
          ? `<button class="btn primary big" data-choice="continue">${icon('scroll')} ${J.start.continue(stageName(saved), saved.stageIndex + 1, stageCount(saved, data))} <span class="chip diff-${saved.difficulty}">${S.difficulty[saved.difficulty].name}</span></button>`
          : ''
      }
      <div class="difficulty-box"><h3>${J.start.difficulty}</h3>
        <div class="segmented">${DIFFICULTIES.map(
          (d) => `<button class="btn seg diff-${d}" data-diff="${d}" aria-pressed="${d === diff}" ${d === 'hardcore' && !hardcoreOk ? 'disabled' : ''}>${d === 'hardcore' && !hardcoreOk ? `${icon('lock')} ` : ''}${S.difficulty[d].name}</button>`,
        ).join('')}</div>
        <p class="center small jdiff-both">${J.start.difficultyBoth}</p>
        <p class="center small" data-recovery>${recoveryLine(diff)}</p>
        <p class="muted center small">${hardcoreOk ? J.start.willOfFireNote : J.start.hardcoreLocked}</p></div>
      <section class="card jmode-panel">
        <div class="jmode-card"><div class="jstart-face">${fighterPortrait('naruto', 'ninja:uzumaki', 'md')}</div>
          <div><h3>${J.start.canon}</h3><p class="muted small">${J.start.canonDesc}</p></div></div>
        <button class="btn ${saved ? '' : 'primary '}big" data-choice="new">${J.start.startCanon}</button>
      </section>
      <section class="card jmode-panel">
        <div class="jmode-card"><div class="jstart-face">${fighterPortrait('commonNinja', 'ninja:common', 'md')}</div>
          <div><h3>${G.title}</h3><p class="muted small">${G.desc}</p></div></div>
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
        ${host.unlocked().has('j_sasukeEgg') ? `<button class="btn small jskin" data-skin aria-pressed="false">${G.skinSasuke}</button>` : ''}
        <button class="btn ${saved ? '' : 'primary '}big" data-choice="generic">${icon('dice')} ${G.start}</button>
      </section>
      <button class="btn small" data-choice="back">${J.start.back}</button>
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
    // Só o Comum escolhe o elemento.
    root.querySelector<HTMLElement>('[data-elements]')!.hidden = classId !== 'common';
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
    const c = await choose<'continue' | 'new' | 'generic' | 'back'>(root);
    if (c === 'back') return null;
    if (c === 'continue' && saved) return saved;
    if (c === 'new' || c === 'generic') {
      if (saved && !window.confirm(J.start.overwrite)) continue;
      clearJornada(host.storage);
      if (c === 'new') return newRun(host.nextSeed(), diff, data);
      await host.ensurePlayerName();
      const run = newGenericRun(host.nextSeed(), diff, classId, data, host.unlocked(), classId === 'uchiha' ? skin : null, classId === 'common' ? element : 'random');
      await revealScreen(host, run);
      return run;
    }
  }
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
      ${run.classId === 'uchiha' ? `<p class="center">${run.secondElement ? `${icon(run.secondElement)} ${G.revealSecond(S.elements[run.secondElement])}` : G.revealNoSecond}</p>` : ''}
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
      <button class="btn small" data-open="talents">${icon('scroll')} ${U.talentsBtn}${run.talentPoints ? ` <span class="badge">${run.talentPoints}</span>` : ''}</button>
      <button class="btn small" data-open="moveset">${icon('swords')} ${U.movesetBtn}</button>
    </div>
    ${relicBar(run)}
    ${bag.length ? `<p class="muted small">${U.bagTitle}: ${bag.join(' · ')}</p>` : ''}
  </section>`;
}

function trail(run: JRun): string {
  const stage = currentStage(run, data);
  return `<div class="jtrail-scene jscene scene-${stage.scene}"><ol class="jtrail">${stage.stops
    .map((s, i) => {
      const state = i < run.stopIndex ? 'done' : i === run.stopIndex ? 'here' : 'next';
      const mark = state === 'here' ? `<span class="jstop-hero">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'sm')}</span>` : `<span class="jstop-ico">${state === 'done' ? icon('check') : icon(STOP_ICONS[s.kind]!)}</span>`;
      return `<li class="jstop ${state} k-${s.kind}">${mark}
        <span class="jstop-txt"><b>${stopName(s)}</b><small>${J.stopKinds[s.kind]}</small></span></li>`;
    })
    .join('')}</ol></div>
    <details class="jlegend"><summary>${U.legend}</summary><ul>${Object.keys(J.stopKinds)
      .map((k) => `<li>${icon(STOP_ICONS[k]!)} <b>${J.stopKinds[k]}</b> · ${J.stopKindDesc[k]}</li>`)
      .join('')}</ul></details>`;
}

/** Botões do HUD (talentos, moveset, relíquias) funcionam em qualquer tela que mostre o HUD. */
function wireHud(root: HTMLElement, host: JornadaHost, get: () => JRun, set: (r: JRun) => void, refresh: () => void) {
  root.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
    if (!b) return;
    const kind = b.dataset.open;
    if (kind === 'talents') set(await talentTreeScreen(host, get(), heroName(host, get())));
    else if (kind === 'moveset') set(await movesetModal(get()));
    else relicsModal(get(), b.dataset.relic);
    refresh();
  });
}

/** Executa a parada atual (luta, evento, mercador, descanso ou tesouro). */
function runStop(host: JornadaHost, run: JRun, stop: StopDef): Promise<JRun> {
  if (isFight(stop)) return fightStop(host, run, stop);
  if (stop.kind === 'event') return eventStop(host, run);
  if (stop.kind === 'shop') return shopStop(host, run);
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
  const root = show(
    h(`<div class="screen jtrail-screen">
      <div class="jb-head"><span>${J.stageLabel(run.stageIndex + 1, stageCount(run, data), stageName(run))}</span><span class="chip diff-${run.difficulty}">${S.difficulty[run.difficulty].name}</span></div>
      <div data-hud>${hud(host, cur)}</div>
      ${trail(cur)}
      <div class="sticky-cta">${teamLine}<button class="btn primary big" data-choice="go">${icon(STOP_ICONS[stop.kind]!)} ${U.go(stopName(stop))}</button>
        <button class="btn small jabandon" data-choice="abandon">${U.abandon}</button></div>
    </div>`),
  );
  wireHud(root, host, () => cur, (r) => (cur = r), () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(host, cur);
    saveJornada(host.storage, cur);
  });
  for (;;) {
    const c = await choose<'go' | 'abandon'>(root);
    if (c === 'go') break;
    if (window.confirm(U.abandonConfirm)) return { ...cur, status: 'defeat' };
  }
  return runStop(host, cur, stop);
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
function mapView(run: JRun): string {
  const map = run.map!;
  const choices = new Set(nodeChoices(run).map((n) => n.id));
  const done = new Set(run.path);
  const ahead = reachableFrom(map, [...choices]);
  const rowH = 74;
  const pad = 40;
  const height = map.rows * rowH + pad;
  const pos = (n: MapNode) => {
    const j = n.kind === 'boss' ? { x: 0, y: 0 } : nodeJitter(n.id);
    return { x: ((n.col + 0.5) / map.cols) * 100 + j.x, y: (map.rows - 1 - n.row) * rowH + rowH / 2 + j.y };
  };
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
        return `<path class="${cls}" d="M${a.x} ${a.y}C${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}"/>`;
      }),
    )
    .join('');
  const boss = genericStage(run, data).bosses[run.bossPlan[run.stageIndex] ?? 0]!;
  const nodes = map.nodes
    .map((n) => {
      const st = done.has(n.id) ? 'done' : choices.has(n.id) ? 'choice' : ahead.has(n.id) ? 'ahead' : 'dead';
      const inner = n.kind === 'boss' ? fighterPortrait(boss[0]!, data.enemies[boss[0]!]!.portrait, 'sm') : done.has(n.id) ? icon('check') : n.kind === 'unknown' ? '<b class="jq">?</b>' : icon(NODE_ICONS[n.kind]!);
      const p = pos(n);
      return `<button class="jnode-map k-${n.kind} ${st}" style="left:${p.x}%;top:${p.y}px" data-node="${n.id}" ${st === 'choice' ? '' : 'aria-disabled="true"'}${tip(nodeKindName(n.kind), nodeKindDesc(n.kind))}>${inner}</button>`;
    })
    .join('');
  // O herói fica no último nó feito; antes da primeira escolha, embaixo do mapa.
  const here = last ? pos(byId.get(last)!) : { x: 50, y: height - 22 };
  const legend = ['fight', 'elite', 'unknown', 'shop', 'rest', 'treasure', 'boss']
    .map((k) => `<span class="jlegend-chip k-${k}"${tip(nodeKindName(k), nodeKindDesc(k))}>${k === 'unknown' ? '<b class="jq">?</b>' : icon(NODE_ICONS[k]!)}${nodeKindName(k)}</span>`)
    .join('');
  return `<div class="jmap-wrap">
    <div class="jmap-boss">${fighterPortrait(boss[0]!, data.enemies[boss[0]!]!.portrait, 'sm')}<span><small>${M.bossLabel}</small><b>${boss.map((id) => J.names[id] ?? id).join(' e ')}</b></span></div>
    <div class="jmap jscene scene-${stageScene(run, data)}" style="height:${height}px">
      <svg class="jmap-lines" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>${nodes}
      <span class="jmap-hero" style="left:${here.x}%;top:${here.y}px" aria-hidden="true">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'sm')}</span>
    </div>
    <div class="jlegend-chips" aria-label="${U.legend}">${legend}</div></div>`;
}

async function mapScreen(host: JornadaHost, run: JRun): Promise<JRun> {
  let cur = run;
  const root = show(
    h(`<div class="screen jtrail-screen jmap-screen">
      <div class="jb-head"><span>${J.stageLabel(run.stageIndex + 1, stageCount(run, data), stageName(run))}</span><span class="chip diff-${run.difficulty}">${S.difficulty[run.difficulty].name}</span></div>
      <div class="jmap-side"><div data-hud>${hud(host, cur)}</div>
        <p class="jb-prompt">${M.choose}</p><button class="btn small jabandon" data-abandon>${U.abandon}</button></div>
      <div class="jtrail-map">${mapView(cur)}</div>
    </div>`),
  );
  wireHud(root, host, () => cur, (r) => (cur = r), () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(host, cur);
    saveJornada(host.storage, cur);
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
    const res = await jornadaBattle(host, data, run, battleSetup(run, data), stopRng(run, attempt), stopName(stop), stageScene(run, data), goalText(stop));
    run = res.run;
    const { run: next, outcome } = finishFight(run, res.battle, data);
    if (outcome.retry) {
      await notice(J.battle.lost, U.retry);
      run = next;
      continue;
    }
    if (outcome.won) {
      const lines = [U.rewards(outcome.ryo, outcome.xp, outcome.talent)];
      if (next.status === 'inProgress') lines.push(stop.kind === 'boss' ? U.restoredAll : U.recovered(Math.round(afterWinRecovery(next, data) * 100)));
      if (outcome.levelUps) lines.push(U.levelUp(next.level));
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

async function shopStop(host: JornadaHost, run0: JRun): Promise<JRun> {
  let run = run0;
  const offer = shopOffer(run, data);
  host.discoverRelics(offer.relics.map((r) => r.id));
  const bought = new Set<string>();
  let shelfPick: string | undefined = offer.relics[0]?.id;
  const root = show(h(`<div class="screen"><h2>${stopName(currentStop(run, data)!)}</h2><div data-hud></div><div data-shop></div>
    <div class="sticky-cta"><button class="btn primary big" data-choice="leave">${U.leave}</button></div></div>`));
  const render = () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(host, run);
    const btn = (p: Purchase, key: string) => {
      const ok = canBuy(run, p, data) && !bought.has(key);
      const label = bought.has(key) ? U.owned : p.kind === 'item' && !canBuy({ ...run, ryo: 1e9 }, p, data) ? U.full : `${U.buy} · ${U.ryo(p.price)}`;
      return `<button class="btn small" data-buy="${key}" ${ok ? '' : 'disabled'}>${label}</button>`;
    };
    root.querySelector('[data-shop]')!.innerHTML = `
      <h3>${U.relicsTitle}</h3>
      <div class="jrshelf">${offer.relics
        .map((r) => `<button type="button" class="jrshelf-item tier-${relicTier(r.id)}${r.id === shelfPick ? ' on' : ''}${bought.has(`r:${r.id}`) ? ' sold' : ''}" data-shelf="${r.id}">
          <span class="jrslot big tier-${relicTier(r.id)}">${relicIcon(r.id)}</span><span class="jrprice">${bought.has(`r:${r.id}`) ? U.owned : U.ryo(r.price)}</span></button>`)
        .join('')}</div>
      ${shelfPick ? relicCard(shelfPick, btn({ kind: 'relic', ...offer.relics.find((r) => r.id === shelfPick)! }, `r:${shelfPick}`), 'stack') : ''}
      <h3>${U.bagTitle}</h3>${offer.consumables
        .map((c) => `<div class="jrelic"><span class="jrelic-ico">${icon('kit')}</span><span class="jrelic-txt"><b>${J.items[c.id]!.name}</b><small>${J.items[c.id]!.desc}</small></span>${btn({ kind: 'item', ...c }, `i:${c.id}:${run.bag[c.id]}`)}</div>`)
        .join('')}
      <div class="jrelic"><span class="jrelic-ico">${icon('scroll')}</span><span class="jrelic-txt"><b>${U.training}</b></span>${btn({ kind: 'training', price: offer.training }, `t:${run.talentPoints}`)}</div>
      <div class="jrelic"><span class="jrelic-ico">${icon('medical')}</span><span class="jrelic-txt"><b>${U.treatment}</b></span>${btn({ kind: 'treatment', price: offer.treatment }, 'heal')}</div>`;
  };
  render();
  wireHud(root, host, () => run, (r) => (run = r), render);
  root.addEventListener('click', (e) => {
    const shelf = (e.target as HTMLElement).closest<HTMLElement>('[data-shelf]');
    if (shelf) {
      shelfPick = shelf.dataset.shelf;
      return render();
    }
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-buy]');
    if (!b || b.disabled) return;
    const key = b.dataset.buy!;
    const [kind, id] = key.split(':');
    const p: Purchase =
      kind === 'r'
        ? { kind: 'relic', ...offer.relics.find((r) => r.id === id)! }
        : kind === 'i'
          ? { kind: 'item', ...offer.consumables.find((c) => c.id === id)! }
          : kind === 't'
            ? { kind: 'training', price: offer.training }
            : { kind: 'treatment', price: offer.treatment };
    run = buy(run, p, data);
    if (kind === 'r' || kind === 'heal') bought.add(key);
    host.mood('good');
    render();
    saveJornada(host.storage, run);
  });
  await choose(root.querySelector('.sticky-cta')!);
  return leaveStop(run, data);
}

async function restStop(host: JornadaHost, run: JRun): Promise<JRun> {
  const root = show(h(`<div class="screen"><h2>${stopName(currentStop(run, data)!)}</h2><div data-hud>${hud(host, run)}</div>
    <button class="btn big" data-choice="heal">${icon('rest')} ${U.restHeal(Math.round(restHealPct(run, data) * 100))}</button>
    <button class="btn big" data-choice="train">${icon('scroll')} ${U.restTrain}</button></div>`));
  const c = await choose<'heal' | 'train'>(root);
  host.mood('good');
  return rest(run, c, data);
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

function modal(inner: string): HTMLElement {
  const el = h(`<div class="modal"><div class="modal-body jmodal">${inner}</div></div>`);
  document.body.appendChild(el);
  return el;
}

function movesetModal(run: JRun): Promise<JRun> {
  const known = heroMovable(run, data);
  const picked = new Set(run.moveset);
  const mods = heroMods(run, data);
  const el = modal('');
  const render = () => {
    el.querySelector('.jmodal')!.innerHTML = `<div class="modal-head"><h2>${U.movesetTitle(picked.size, MOVESET_SIZE)}</h2><button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></div>
      <p class="muted small">${U.movesetHelp}</p>
      <div class="jmoves-pick">${known
        .map((id) => {
          const t = data.techniques[id]!;
          const power = techPower(t, mods);
          const cost = Math.max(0, t.chakraCost - mods.chakraDiscount - (mods.techChakraDiscount[id] ?? 0));
          const bits = [power ? `<span${power > t.baseDamage ? ' class="up"' : ''}>${J.battle.damage(power)}${(t.hits ?? 1) > 1 ? `×${t.hits}` : ''}</span>` : '', cost ? J.battle.chakra(cost) : ''].filter(Boolean);
          return `<button class="btn jmove${picked.has(id) ? ' on' : ''}" data-move="${id}" aria-pressed="${picked.has(id)}"${techTip(t, undefined, mods)}><span class="jmove-ico">${icon(t.element ?? t.type)}</span>
            <span class="jmove-txt"><b>${techName(id)}</b>${bits.length ? `<small>${bits.join(' · ')}</small>` : ''}</span></button>`;
        })
        .join('')}</div>
      <h3>${U.actives}</h3><p class="muted small">${heroActives(run, data).map(techName).join(' · ')}</p>
      <button class="btn primary big" data-save ${picked.size ? '' : 'disabled'}>${U.save}</button>`;
  };
  render();
  return new Promise((resolve) => {
    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t === el || t.closest('[data-close]')) {
        el.remove();
        return resolve(run);
      }
      if (t.closest('[data-save]') && picked.size) {
        el.remove();
        return resolve(setMoveset(run, [...picked], data));
      }
      const b = t.closest<HTMLElement>('[data-move]');
      if (!b) return;
      const id = b.dataset.move!;
      if (picked.has(id)) picked.delete(id);
      else if (picked.size < MOVESET_SIZE) picked.add(id);
      render();
    });
  });
}

async function notice(title: string, text: string): Promise<void> {
  const root = show(h(`<div class="screen"><h2>${esc(title)}</h2><section class="card"><p class="pre">${esc(text)}</p></section>
    <button class="btn primary big" data-choice="ok">${U.continue}</button></div>`));
  await choose(root);
}

async function endScreen(host: JornadaHost, run: JRun): Promise<void> {
  const won = run.status === 'victory';
  const stop = currentStop(run, data);
  host.mood(won ? 'good' : 'bad');
  const root = show(h(`<div class="screen jend ${won ? 'win' : 'lose'}"><h2>${won ? U.victoryTitle : U.defeatTitle}</h2>
    <div class="jstart-face end-seal">${fighterPortrait(run.hero, portraitSpec(run.hero, run), 'md')}<span class="seal stamp end-stamp${won ? ' gold' : ''}" aria-hidden="true">${won ? '勝' : '敗'}</span></div>
    <p class="center">${won ? U.runWon : U.runLost(stop ? stopName(stop) : '')}</p>
    <p class="center muted">${U.runStats(run.stats.fights, run.stats.wins, run.level)}</p>
    ${run.relics.length ? `<div class="jrbar jrbar-end">${run.relics.map((id) => relicSlot(id, 'span')).join('')}</div>` : ''}
    <button class="btn primary big" data-choice="ok">${U.home}</button></div>`));
  await sleep(host.instant() ? 0 : 300);
  await choose(root);
}
