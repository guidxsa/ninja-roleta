// Modo Jornada no protótipo (docs/jornada/): início, trilha da run canônica, paradas, talentos, moveset e
// relíquias. As regras ficam em src/core/jornada; aqui só a interface. A run salva a cada parada.
import type { Difficulty } from '../../src/core/difficulty';
import { eventOptions } from '../../src/core/jornada/events';
import {
  battleSetup,
  buy,
  buyTalent,
  canBuy,
  chooseBossRelic,
  currentStage,
  currentStop,
  finishFight,
  gainRelic,
  heroActives,
  heroMovable,
  leaveStop,
  memberSheet,
  memberState,
  newRun,
  openTreasure,
  resolveEvent,
  rest,
  setMoveset,
  shopOffer,
  stopRng,
  talentContext,
  xpToNext,
  HERO,
  MOVESET_SIZE,
  type JRun,
  type Purchase,
} from '../../src/core/jornada/run';
import { branchesOf, talentState } from '../../src/core/jornada/talents';
import { isFight, teamFor, type StopDef } from '../../src/core/jornada/trail';
import { jornadaData as data } from '../../src/data/jornada';
import { newJornadaAchievements } from '../../src/data/jornada/achievements';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { clearJornada, loadJornada, saveJornada } from '../../src/state/jornadaSave';
import { fighterPortrait, icon } from '../art';
import { choose, esc, h, show, sleep } from '../dom';
import { jornadaBattle, techName } from './battle';
import type { JornadaHost } from './host';
import { playMinigame } from './minigames';

const J = S.jornada;
const U = J.ui;
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

const stopName = (s: StopDef) => J.stops[s.id] ?? s.id;
const relicName = (id: string) => J.relics.list[id]?.name ?? id;
const relicTier = (id: string) => data.relics.find((r) => r.id === id)?.tier ?? 'common';

function relicCard(id: string, extra = ''): string {
  const r = J.relics.list[id] ?? { name: id, desc: '' };
  const tier = relicTier(id);
  return `<div class="jrelic tier-${tier}"><span class="jrelic-ico">${icon(tier === 'legendary' ? 'willOfFire' : tier === 'rare' ? 'scroll' : 'item')}</span>
    <span class="jrelic-txt"><b>${r.name}</b> <small class="muted">${J.relics.tiers[tier]}</small><small>${r.desc}</small></span>${extra}</div>`;
}

// ---------------------------------------------------------------------------
// Entrada

export async function runJornada(host: JornadaHost): Promise<void> {
  let run = await startScreen(host);
  if (!run) return;
  host.unlock(newJornadaAchievements(run, host.unlocked()));
  while (run.status === 'inProgress') {
    saveJornada(host.storage, run);
    run = await playStop(host, run);
    const fresh = newJornadaAchievements(run, host.unlocked());
    if (fresh.length) host.unlock(fresh);
    if (run.status === 'inProgress' && run.stopIndex === 0 && run.stageIndex > 0 && !run.bossChoice) {
      await notice(U.stageClear(J.stages[data.stages[run.stageIndex - 1]!.id] ?? ''), J.stages[currentStage(run, data).id] ?? '');
    }
  }
  saveJornada(host.storage, run);
  await endScreen(host, run);
}

async function startScreen(host: JornadaHost): Promise<JRun | null> {
  const saved = loadJornada(host.storage);
  const hardcoreOk = host.unlocked().has('j_canonHard');
  let diff = host.difficulty();
  if (diff === 'hardcore' && !hardcoreOk) diff = 'normal';
  const root = show(
    h(`<div class="screen jstart">
      <h2>${J.start.title}</h2>
      <section class="card jmode-card"><div class="jstart-face">${fighterPortrait('naruto', 'ninja:uzumaki', 'md')}</div>
        <div><h3>${J.start.canon}</h3><p class="muted small">${J.start.canonDesc}</p></div></section>
      ${
        saved
          ? `<button class="btn primary big" data-choice="continue">${icon('scroll')} ${J.start.continue(J.stages[data.stages[saved.stageIndex]!.id] ?? '', saved.stopIndex + 1, data.stages[saved.stageIndex]!.stops.length)}</button>`
          : ''
      }
      <div class="difficulty-box"><h3>${J.start.difficulty}</h3>
        <div class="segmented">${DIFFICULTIES.map(
          (d) => `<button class="btn seg diff-${d}" data-diff="${d}" aria-pressed="${d === diff}" ${d === 'hardcore' && !hardcoreOk ? 'disabled' : ''}>${d === 'hardcore' && !hardcoreOk ? '🔒 ' : ''}${S.difficulty[d].name}</button>`,
        ).join('')}</div>
        <p class="muted center small">${hardcoreOk ? J.start.willOfFireNote : J.start.hardcoreLocked}</p></div>
      <button class="btn ${saved ? '' : 'primary '}big" data-choice="new">${J.start.newRun}</button>
      <section class="card jmode-card off"><div><h3>${J.start.generic} <span class="chip">${J.start.soon}</span></h3><p class="muted small">${J.start.genericDesc}</p></div></section>
      <button class="btn small" data-choice="back">${J.start.back}</button>
    </div>`),
  );
  root.querySelector('.segmented')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-diff]');
    if (!b || b.disabled) return;
    diff = b.dataset.diff as Difficulty;
    host.setDifficulty(diff);
    root.querySelectorAll('[data-diff]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  for (;;) {
    const c = await choose<'continue' | 'new' | 'back'>(root);
    if (c === 'back') return null;
    if (c === 'continue' && saved) return saved;
    if (c === 'new') {
      if (saved && !window.confirm(J.start.overwrite)) continue;
      clearJornada(host.storage);
      return newRun(host.nextSeed(), diff, data);
    }
  }
}

// ---------------------------------------------------------------------------
// HUD e trilha

function hud(run: JRun): string {
  const need = xpToNext(run.level, data);
  const hero = memberState(run, HERO, data);
  const sheet = memberSheet(run, HERO, data);
  const bag = (['hpKit', 'chakraKit', 'reviveKit'] as const).filter((id) => run.bag[id] > 0).map((id) => `${J.items[id]!.name} ×${run.bag[id]}`);
  return `<section class="card jhud">
    <div class="jhud-top">${fighterPortrait('naruto', 'ninja:uzumaki', 'sm')}<b>${J.names.naruto}</b>
      <span class="chip lvl-chip">${U.level(run.level)}</span><span class="chip">${icon('coin')} ${U.ryo(run.ryo)}</span>
      ${run.willOfFire ? `<span class="chip jin">${icon('willOfFire')} ${run.willOfFire}</span>` : ''}</div>
    <div class="bar bar-xp"><div class="fill" style="width:${Math.min(100, (run.xp / need) * 100)}%"></div><span>${U.xp(run.xp, need)}</span></div>
    <div class="bar bar-hp jbar"><div class="fill" style="width:${(hero.hp / sheet.maxHp) * 100}%"></div><span>${hero.hp}/${sheet.maxHp}</span></div>
    <div class="jhud-actions">
      <button class="btn small" data-open="talents">${icon('scroll')} ${U.talentsBtn}${run.talentPoints ? ` <span class="badge">${run.talentPoints}</span>` : ''}</button>
      <button class="btn small" data-open="moveset">${icon('swords')} ${U.movesetBtn}</button>
      <button class="btn small" data-open="relics">${icon('item')} ${run.relics.length}</button>
    </div>
    ${bag.length ? `<p class="muted small">${U.bagTitle}: ${bag.join(' · ')}</p>` : ''}
  </section>`;
}

function trail(run: JRun): string {
  const stage = currentStage(run, data);
  return `<ol class="jtrail">${stage.stops
    .map((s, i) => {
      const state = i < run.stopIndex ? 'done' : i === run.stopIndex ? 'here' : 'next';
      return `<li class="jstop ${state} k-${s.kind}"><span class="jstop-ico">${state === 'done' ? '✓' : icon(STOP_ICONS[s.kind]!)}</span>
        <span class="jstop-txt"><b>${stopName(s)}</b><small>${J.stopKinds[s.kind]}</small></span></li>`;
    })
    .join('')}</ol>
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
    if (kind === 'talents') set(await talentsModal(host, get()));
    else if (kind === 'moveset') set(await movesetModal(get()));
    else relicsModal(get());
    refresh();
  });
}

async function playStop(host: JornadaHost, run: JRun): Promise<JRun> {
  if (run.bossChoice) return bossChoiceScreen(run);
  const stage = currentStage(run, data);
  const stop = currentStop(run, data)!;
  let cur = run;
  const team = isFight(stop) ? teamFor(stage, stop) : [];
  const teamLine = isFight(stop)
    ? `<p class="jteam">${[HERO, ...team].map((id) => fighterPortrait(id, data.characters[id]!.portrait, 'sm')).join('')}<span class="muted small">${team.length ? team.map((id) => J.names[id]).join(', ') : U.solo}</span></p>`
    : '';
  const root = show(
    h(`<div class="screen jtrail-screen">
      <div class="jb-head"><span>${J.stageLabel(run.stageIndex + 1, data.stages.length, J.stages[stage.id] ?? '')}</span><span class="chip diff-${run.difficulty}">${S.difficulty[run.difficulty].name}</span></div>
      <div data-hud>${hud(cur)}</div>
      ${trail(cur)}
      <div class="sticky-cta">${teamLine}<button class="btn primary big" data-choice="go">${icon(STOP_ICONS[stop.kind]!)} ${U.go(stopName(stop))}</button>
        <button class="btn small jabandon" data-choice="abandon">${U.abandon}</button></div>
    </div>`),
  );
  wireHud(root, host, () => cur, (r) => (cur = r), () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(cur);
    saveJornada(host.storage, cur);
  });
  for (;;) {
    const c = await choose<'go' | 'abandon'>(root);
    if (c === 'go') break;
    if (window.confirm(U.abandonConfirm)) return { ...cur, status: 'defeat' };
  }
  if (isFight(stop)) return fightStop(host, cur, stop);
  if (stop.kind === 'event') return eventStop(host, cur);
  if (stop.kind === 'shop') return shopStop(host, cur);
  if (stop.kind === 'rest') return restStop(host, cur);
  return treasureStop(cur);
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
    const res = await jornadaBattle(host, data, run, battleSetup(run, data), stopRng(run, attempt), stopName(stop), currentStage(run, data).scene, goalText(stop));
    run = res.run;
    const { run: next, outcome } = finishFight(run, res.battle, data);
    if (outcome.retry) {
      await notice(J.battle.lost, U.retry);
      run = next;
      continue;
    }
    if (outcome.won) {
      const lines = [U.rewards(outcome.ryo, outcome.xp, outcome.talent)];
      if (outcome.levelUps) lines.push(U.levelUp(next.level));
      await notice(U.victoryTitle, lines.join('\n'));
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
        .map((o) => `<button class="btn big" data-choice="${o.id}">${o.minigame ? '🎴 ' : ''}${txt.options[o.id] ?? o.id}</button>`)
        .join('')}</div><div data-slot></div></div>`),
  );
  const pick = await choose<string>(root.querySelector('.joptions')!);
  const opt = def.options.find((o) => o.id === pick)!;
  root.querySelector('.joptions')!.remove();
  let won = true;
  if (opt.minigame) won = await playMinigame(opt.minigame, root.querySelector('[data-slot]')!, data, stopRng(run, 11), host.instant());
  const { run: next, relic } = resolveEvent(run, pick, won, data);
  if (relic) await notice(U.gotRelic(relicName(relic)), J.relics.list[relic]?.desc ?? '');
  return next;
}

async function shopStop(host: JornadaHost, run0: JRun): Promise<JRun> {
  let run = run0;
  const offer = shopOffer(run, data);
  const bought = new Set<string>();
  const root = show(h(`<div class="screen"><h2>${stopName(currentStop(run, data)!)}</h2><div data-hud></div><div data-shop></div>
    <div class="sticky-cta"><button class="btn primary big" data-choice="leave">${U.leave}</button></div></div>`));
  const render = () => {
    root.querySelector('[data-hud]')!.innerHTML = hud(run);
    const btn = (p: Purchase, key: string) => {
      const ok = canBuy(run, p, data) && !bought.has(key);
      const label = bought.has(key) ? U.owned : p.kind === 'item' && !canBuy({ ...run, ryo: 1e9 }, p, data) ? U.full : `${U.buy} · ${U.ryo(p.price)}`;
      return `<button class="btn small" data-buy="${key}" ${ok ? '' : 'disabled'}>${label}</button>`;
    };
    root.querySelector('[data-shop]')!.innerHTML = `
      <h3>${U.relicsTitle}</h3>${offer.relics.map((r) => relicCard(r.id, btn({ kind: 'relic', ...r }, `r:${r.id}`))).join('')}
      <h3>${U.bagTitle}</h3>${offer.consumables
        .map((c) => `<div class="jrelic"><span class="jrelic-ico">${icon('kit')}</span><span class="jrelic-txt"><b>${J.items[c.id]!.name}</b><small>${J.items[c.id]!.desc}</small></span>${btn({ kind: 'item', ...c }, `i:${c.id}:${run.bag[c.id]}`)}</div>`)
        .join('')}
      <div class="jrelic"><span class="jrelic-ico">${icon('scroll')}</span><span class="jrelic-txt"><b>${U.training}</b></span>${btn({ kind: 'training', price: offer.training }, `t:${run.talentPoints}`)}</div>
      <div class="jrelic"><span class="jrelic-ico">${icon('medical')}</span><span class="jrelic-txt"><b>${U.treatment}</b></span>${btn({ kind: 'treatment', price: offer.treatment }, 'heal')}</div>`;
  };
  render();
  wireHud(root, host, () => run, (r) => (run = r), render);
  root.addEventListener('click', (e) => {
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
  const root = show(h(`<div class="screen"><h2>${stopName(currentStop(run, data)!)}</h2><div data-hud>${hud(run)}</div>
    <button class="btn big" data-choice="heal">${icon('rest')} ${U.restHeal(Math.round(data.j.run.restHealPct * 100))}</button>
    <button class="btn big" data-choice="train">${icon('scroll')} ${U.restTrain}</button></div>`));
  const c = await choose<'heal' | 'train'>(root);
  host.mood('good');
  return rest(run, c, data);
}

async function treasureStop(run: JRun): Promise<JRun> {
  const root = show(h(`<div class="screen"><h2>${stopName(currentStop(run, data)!)}</h2>
    <div class="jchest">${icon('item')}</div><button class="btn primary big" data-choice="open">${U.openTreasure}</button></div>`));
  await choose(root);
  const id = openTreasure(run, data);
  const next = id ? gainRelic(run, id, data) : run;
  root.querySelector('[data-choice]')!.remove();
  root.insertAdjacentHTML('beforeend', `${id ? relicCard(id) : `<p class="muted center">${U.treasureEmpty}</p>`}<button class="btn primary big" data-choice="ok">${U.continue}</button>`);
  await choose(root);
  return leaveStop(next, data);
}

async function bossChoiceScreen(run: JRun): Promise<JRun> {
  const root = show(h(`<div class="screen"><h2>${U.bossChoice}</h2>${run.bossChoice!
    .map((id) => `<button class="jpick" data-choice="${id}">${relicCard(id)}</button>`)
    .join('')}</div>`));
  const id = await choose<string>(root);
  return chooseBossRelic(run, id, data);
}

// ---------------------------------------------------------------------------
// Modais

function modal(inner: string): HTMLElement {
  const el = h(`<div class="modal"><div class="modal-body jmodal">${inner}</div></div>`);
  document.body.appendChild(el);
  return el;
}

function talentsModal(host: JornadaHost, run0: JRun): Promise<JRun> {
  let run = run0;
  const T = J.talents;
  const el = modal('');
  const render = () => {
    const ctx = talentContext(run, host.unlocked());
    el.querySelector('.jmodal')!.innerHTML = `<div class="row between"><h2>${T.title}</h2><button class="btn small" data-close>✕</button></div>
      <p class="center"><span class="chip lvl-chip">${T.points(run.talentPoints)}</span></p>
      <div class="jtree">${branchesOf(HERO, data.talents)
        .map(
          (br) => `<div class="jbranch"><h3>${T.branches[br]}</h3>${data.talents
            .filter((n) => n.owner === HERO && n.branch === br)
            .map((n) => {
              const st = talentState(n, data.talents, ctx);
              const txt = T.list[n.id] ?? { name: n.id, desc: '' };
              const hidden = st === 'accountLocked';
              return `<button class="jnode st-${st}" data-node="${n.id}" ${st === 'available' ? '' : 'aria-disabled="true"'}>
                <b>${hidden ? '???' : txt.name}</b><small>${hidden ? T.states.accountLocked : txt.desc}</small>
                <small class="jnode-state">${st === 'owned' ? `✓ ${T.states.owned}` : `${T.cost(n.cost)} · ${T.states[st]}`}</small></button>`;
            })
            .join('')}</div>`,
        )
        .join('')}</div>`;
  };
  render();
  return new Promise((resolve) => {
    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t === el || t.closest('[data-close]')) {
        el.remove();
        return resolve(run);
      }
      const b = t.closest<HTMLElement>('[data-node]');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      run = buyTalent(run, b.dataset.node!, host.unlocked(), data);
      host.mood('good');
      render();
    });
  });
}

function movesetModal(run: JRun): Promise<JRun> {
  const known = heroMovable(run, data);
  const picked = new Set(run.moveset);
  const el = modal('');
  const render = () => {
    el.querySelector('.jmodal')!.innerHTML = `<div class="row between"><h2>${U.movesetTitle(picked.size, MOVESET_SIZE)}</h2><button class="btn small" data-close>✕</button></div>
      <p class="muted small">${U.movesetHelp}</p>
      <div class="jmoves-pick">${known
        .map((id) => {
          const t = data.techniques[id]!;
          return `<button class="btn jmove${picked.has(id) ? ' on' : ''}" data-move="${id}" aria-pressed="${picked.has(id)}"><span class="jmove-ico">${icon(t.element ?? t.type)}</span>
            <span class="jmove-txt"><b>${techName(id)}</b><small>${t.baseDamage ? J.battle.damage(t.baseDamage) : ''}${t.chakraCost ? ` · ${J.battle.chakra(t.chakraCost)}` : ''} · ${J.targets[t.target]}</small></span></button>`;
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

function relicsModal(run: JRun) {
  const el = modal(`<div class="row between"><h2>${U.relicsTitle}</h2><button class="btn small" data-close>✕</button></div>
    ${run.relics.length ? run.relics.map((id) => relicCard(id)).join('') : `<p class="muted">${U.noRelics}</p>`}
    ${run.willOfFire ? `<p>${icon('willOfFire')} ${U.willOfFire(run.willOfFire)}</p>` : ''}`);
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === el || t.closest('[data-close]')) el.remove();
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
    <div class="jstart-face">${fighterPortrait('naruto', 'ninja:uzumaki', 'md')}</div>
    <p class="center">${won ? U.runWon : U.runLost(stop ? stopName(stop) : '')}</p>
    <p class="center muted">${U.runStats(run.stats.fights, run.stats.wins, run.level)}</p>
    ${run.relics.length ? run.relics.map((id) => relicCard(id)).join('') : ''}
    <button class="btn primary big" data-choice="ok">${U.home}</button></div>`));
  await sleep(host.instant() ? 0 : 300);
  await choose(root);
}
