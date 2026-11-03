// Tela de batalha da Jornada (docs/jornada/combate.md#interface): inimigos em cima, equipe embaixo,
// alvo por toque e animação a partir do log de eventos do core. Sem roleta na tela: só o resultado.
import {
  awaitingPlayer,
  blockedReason,
  current,
  downed,
  fighter,
  hitsOf,
  hpCost,
  itemTargets,
  playerAct,
  startBattle,
  techniqueCost,
  useItem,
  validTargets,
} from '../../src/core/jornada/battle';
import type { JornadaData } from '../../src/core/jornada/data';
import { CONSUMABLES, spendItem, type JRun } from '../../src/core/jornada/run';
import type { BattleSetup } from '../../src/core/jornada/battle';
import type { ConsumableId, Fighter, JAction, JBattle, JEvent, JTechnique } from '../../src/core/jornada/types';
import type { Rng } from '../../src/core/rng';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { fighterPortrait, icon } from '../art';
import { barLayers, barPct, barTone, captureTrails, patchBar, restoreTrails } from '../bars';
import { swish, land } from '../audio';
import { esc, h, show, sleep } from '../dom';
import { ELEMENT_COLORS, lines } from '../tips';
import { tip } from '../tooltip';
import { flashRelics, relicStrip, startRelics, winRelics } from './relics';
import type { JornadaHost } from './host';

const J = S.jornada;
const B = J.battle;

/** Ícone de cada efeito de status (dicas, selos do lutador, números flutuantes). */
export const EFFECT_ICONS: Record<string, string> = { stun: 'stun', burn: 'fire', poison: 'poison', chakraBlock: 'block' };
const fxIcon = (kind: string) => icon(EFFECT_ICONS[kind] ?? 'neutral');

export const fighterName = (f: { defId: string }) => J.names[f.defId] ?? f.defId;
export const techName = (id: string) => J.techniques[id] ?? id;

/** Visual do protagonista desta luta (personalização da run). */
let heroSkin: string | null = null;

function portraitOf(f: Fighter, data: JornadaData): string {
  const spec = f.protagonist && heroSkin ? `ninja:${heroSkin}` : (data.characters[f.defId]?.portrait ?? data.enemies[f.defId]?.portrait ?? 'ninja:common');
  return fighterPortrait(f.defId, spec, 'md');
}

function miniBar(kind: 'hp' | 'ck', cur: number, max: number): string {
  const pct = barPct(cur, max);
  const tone = barTone(kind, pct);
  return `<div class="bar bar-${kind} jbar${tone ? ` ${tone}` : ''}" data-bar="${kind}">${barLayers(pct)}<span>${Math.max(0, Math.round(cur))}/${max}</span></div>`;
}

/** Chave de uma barra para o rastro sobreviver ao redesenho dos lutadores (uid + tipo). */
const barKey = (bar: HTMLElement) => {
  const uid = bar.closest<HTMLElement>('.jf')?.dataset.uid;
  return uid ? `${uid}:${bar.dataset.bar}` : null;
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Dica completa de uma técnica (passar o mouse ou segurar o dedo). `f` mostra custo e golpes reais. */
export function techTip(tech: JTechnique, f?: Fighter): string {
  const U = J.ui;
  const hits = f ? hitsOf(f, tech) : (tech.hits ?? 1);
  const cost = f ? techniqueCost(f, tech) : tech.chakraCost;
  const effect = tech.onHit
    ? `${fxIcon(tech.onHit.effect)} ${J.effects[tech.onHit.effect]} ${pct(tech.onHit.chance)}${tech.onHit.turns ? ` (${tech.onHit.turns} t)` : ''}`
    : '';
  const body = lines([
    `${J.types[tech.type]}${tech.element ? ` · ${S.elements[tech.element]}` : ''}${tech.active ? ` · ${U.actives}` : ''}`,
    `${U.tipTarget}: ${J.targets[tech.target]}`,
    tech.baseDamage > 0 ? `${B.damage(tech.baseDamage)}${hits > 1 ? ` · ${B.hits(hits)}` : ''}${tech.hitsPerClone ? ` (+${tech.hitsPerClone}/clone, até +${tech.maxCloneHits})` : ''}` : '',
    tech.baseDamage > 0 || tech.onHit ? `${U.tipAccuracy}: ${pct(tech.accuracy ?? 0.85)}` : '',
    tech.critBonus ? `+${pct(tech.critBonus)} crítico` : '',
    tech.penetration ? `penetração ${pct(tech.penetration)}` : '',
    effect,
    tech.healPct ? `cura ${pct(tech.healPct)} do HP` : '',
    tech.shieldPct ? `${icon('barrier')} escudo ${pct(tech.shieldPct)} do HP de quem usa` : '',
    tech.cleanse ? `tira ${J.effects.stun} e ${J.effects.chakraBlock}` : '',
    tech.clones ? `${icon('clones')} ${tech.clones} clones` : '',
    cost ? B.chakra(cost) : '',
    tech.hpCostPct && f ? B.hpCost(hpCost(f, tech)) : tech.hpCostPct ? `${pct(tech.hpCostPct)} do HP` : '',
    tech.cooldown ? B.cooldown(tech.cooldown) : '',
  ]);
  return tip(techName(tech.id), body);
}

function fighterTip(f: Fighter): string {
  const U = J.ui;
  const effects = f.effects.map((e) => `${fxIcon(e.kind)} ${J.effects[e.kind]} (${e.turns})`);
  const passive =
    f.passive?.kind === 'enrage' ? U.tipPassive(Math.round(f.passive.atPct * 100), f.passive.damageMult) : f.passive?.kind === 'startShieldPct' ? U.tipStartShield(Math.round(f.passive.pct * 100)) : '';
  const body = lines([
    `HP ${f.hp}/${f.maxHp}${f.maxChakra ? ` · chakra ${f.chakra}/${f.maxChakra}` : ''}`,
    f.element ? S.elements[f.element] : '',
    f.protagonist ? '' : J.ai[f.ai] ?? '',
    passive,
    f.shield ? `${icon('barrier')} ${f.shield}` : '',
    f.clones ? `${icon('clones')} ${f.clones}` : '',
    effects.length ? `${U.tipEffects}: ${effects.join(', ')}` : '',
    f.techniques.map((id) => techName(id)).join(' · '),
  ]);
  return tip(fighterName(f), body);
}

function statusChips(f: Fighter): string {
  const chips = f.effects.map((e) => `<span class="jchip bad" title="${J.effects[e.kind]}">${fxIcon(e.kind)}${e.turns}</span>`);
  if (f.shield > 0) chips.push(`<span class="jchip good">${icon('barrier')}${f.shield}</span>`);
  if (f.clones > 0) chips.push(`<span class="jchip good">${icon('clones')}${f.clones}</span>`);
  if (f.guarding) chips.push(`<span class="jchip good">${icon('stance')}</span>`);
  return chips.join('');
}

function fighterCard(f: Fighter, data: JornadaData): string {
  return `<button class="jf ${f.side}${f.down ? ' down' : ''}${f.protagonist ? ' hero' : ''}" data-uid="${f.uid}" type="button"${fighterTip(f)}>
    <span class="jf-art">${portraitOf(f, data)}<span class="jf-floats"></span></span>
    <span class="jf-info"><b class="jf-name">${esc(fighterName(f))}</b>
      ${miniBar('hp', f.hp, f.maxHp)}${f.maxChakra > 0 ? miniBar('ck', f.chakra, f.maxChakra) : ''}
      <span class="jf-chips">${statusChips(f)}</span></span>
  </button>`;
}

function techButton(f: Fighter, tech: JTechnique): string {
  const blocked = blockedReason(f, tech);
  const cost = techniqueCost(f, tech);
  const hp = hpCost(f, tech);
  const hits = hitsOf(f, tech);
  const bits = [
    tech.baseDamage > 0 ? `${B.damage(tech.baseDamage)}${hits > 1 ? ` ${B.hits(hits)}` : ''}` : '',
    cost ? B.chakra(cost) : '',
    hp ? B.hpCost(hp) : '',
    J.targets[tech.target],
    tech.onHit ? `${fxIcon(tech.onHit.effect)} ${Math.round(tech.onHit.chance * 100)}%` : '',
    blocked ? (blocked === 'cooldown' ? B.cooldown(f.cooldowns[tech.id]!) : B.blocked[blocked]) : '',
  ].filter(Boolean);
  const color = tech.element ? ELEMENT_COLORS[tech.element] : `var(--t-${tech.type})`;
  const wait = blocked === 'cooldown' ? f.cooldowns[tech.id]! : 0;
  const cd = wait ? `<span class="cd" style="--p:${Math.min(1, wait / Math.max(wait, tech.cooldown ?? wait))}" aria-hidden="true">${wait}</span>` : '';
  return `<button class="btn jmove${wait ? ' cooling' : ''}" data-tech="${tech.id}" ${blocked ? 'aria-disabled="true"' : ''} style="--c:${color}"${techTip(tech, f)}>
    <span class="jmove-ico">${icon(tech.element ?? tech.type)}${cd}</span>
    <span class="jmove-txt"><b>${techName(tech.id)}</b><small>${bits.join(' · ')}</small></span></button>`;
}

export interface BattleResult {
  battle: JBattle;
  run: JRun;
}

/** Luta completa. Devolve o estado final e a run com a bolsa já descontada. */
export async function jornadaBattle(
  host: JornadaHost,
  data: JornadaData,
  run0: JRun,
  setup: BattleSetup,
  rng: Rng,
  label: string,
  scene: string,
  goal: string | null,
): Promise<BattleResult> {
  let run = run0;
  heroSkin = run0.skin;
  let state = startBattle(setup, data, rng);
  const root = show(
    h(`<div class="screen jbattle scene-${scene}">
      <div class="jb-head"><span>${icon('swords')} ${esc(label)}</span><span data-round></span></div>
      ${run0.relics.length ? `<div class="jb-relics">${relicStrip(run0)}</div>` : ''}
      ${goal ? `<p class="jb-goal">${esc(goal)}</p>` : ''}
      <div class="jb-side jb-enemies" data-side="enemy"></div>
      <div class="jb-banner" aria-live="polite"></div>
      <div class="jb-side jb-allies" data-side="ally"></div>
      <button class="jb-log" type="button" data-log><span></span></button>
      <div class="jb-menu"></div>
      <div class="jb-intro"><div>${esc(label)}</div></div>
      <div class="jb-fx" aria-hidden="true"></div>
    </div>`),
  );
  const enemiesEl = root.querySelector<HTMLElement>('.jb-enemies')!;
  const alliesEl = root.querySelector<HTMLElement>('.jb-allies')!;
  const menu = root.querySelector<HTMLElement>('.jb-menu')!;
  const banner = root.querySelector<HTMLElement>('.jb-banner')!;
  const logBtn = root.querySelector<HTMLElement>('[data-log]')!;
  const logLines: string[] = [];
  logBtn.addEventListener('click', () => logBtn.classList.toggle('open'));
  const beat = () => (host.instant() ? 70 : 420);

  const fxLayer = root.querySelector<HTMLElement>('.jb-fx')!;
  const render = (s: JBattle) => {
    const trails = captureTrails(root, barKey);
    enemiesEl.innerHTML = s.fighters.filter((f) => f.side === 'enemy').map((f) => fighterCard(f, data)).join('');
    alliesEl.innerHTML = s.fighters.filter((f) => f.side === 'ally').map((f) => fighterCard(f, data)).join('');
    restoreTrails(root, barKey, trails);
    root.querySelector('[data-round]')!.textContent = B.round(Math.max(1, s.round));
    const turn = current(s);
    root.querySelectorAll('.jf').forEach((el) => el.classList.toggle('acting', (el as HTMLElement).dataset.uid === turn?.uid && s.status === 'ongoing'));
  };
  const card = (uid: string) => root.querySelector<HTMLElement>(`.jf[data-uid="${uid}"]`);
  const pushLog = (line: string) => {
    logLines.unshift(line);
    if (logLines.length > 30) logLines.pop();
    logBtn.querySelector('span')!.innerHTML = logLines.map((l) => `<span class="jl">${l}</span>`).join('');
  };
  /** Número flutuante sobre o lutador, na camada de efeitos da tela (não some quando os cartões são redesenhados). */
  const float = (uid: string, text: string, cls: string) => {
    const c = card(uid);
    if (!c) return;
    const r = c.getBoundingClientRect();
    const base = root.getBoundingClientRect();
    const el = h(`<span class="jfloat ${cls}">${text}</span>`);
    el.style.left = `${r.left - base.left + r.width / 2}px`;
    el.style.top = `${r.top - base.top + 6}px`;
    fxLayer.appendChild(el);
    if (cls === 'crit') {
      const cut = h('<i class="slash" aria-hidden="true"></i>');
      cut.style.left = `${r.left - base.left - 8}px`;
      cut.style.width = `${r.width + 16}px`;
      cut.style.top = `${r.top - base.top + r.height * 0.4}px`;
      fxLayer.appendChild(cut);
      setTimeout(() => cut.remove(), 600);
    }
    setTimeout(() => el.remove(), host.instant() ? 400 : 1100);
  };
  const pose = (uid: string, cls: string) => {
    const el = card(uid);
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), host.instant() ? 150 : 450);
  };
  const say = (text: string, color = '') => {
    banner.innerHTML = `<span style="${color ? `--c:${color}` : ''}">${text}</span>`;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
  };
  // Barras durante a animação: parte do estado anterior e aplica cada evento.
  const shown = new Map<string, { hp: number; max: number }>();
  const setHp = (uid: string, hp: number) => {
    const v = shown.get(uid);
    if (!v) return;
    v.hp = Math.max(0, Math.min(v.max, hp));
    const el = card(uid)?.querySelector<HTMLElement>('[data-bar="hp"]');
    if (el) patchBar(el, 'hp', v.hp, v.max, `${Math.max(0, Math.round(v.hp))}/${v.max}`);
  };

  async function animate(prev: JBattle, next: JBattle) {
    render(prev);
    shown.clear();
    for (const f of prev.fighters) shown.set(f.uid, { hp: f.hp, max: f.maxHp });
    const name = (uid: string) => esc(fighterName(fighter(next, uid)));
    for (const e of next.log.slice(prev.log.length) as JEvent[]) {
      let wait = beat();
      switch (e.type) {
        case 'round':
          root.querySelector('[data-round]')!.textContent = B.round(e.round);
          wait = 0;
          break;
        case 'turn':
          root.querySelectorAll('.jf').forEach((el) => el.classList.toggle('acting', (el as HTMLElement).dataset.uid === e.uid));
          wait = host.instant() ? 0 : 120;
          break;
        case 'tech': {
          const t = data.techniques[e.techId]!;
          const color = t.element ? ELEMENT_COLORS[t.element] : '';
          pose(e.uid, fighter(next, e.uid).side === 'ally' ? 'lunge-up' : 'lunge-down');
          // Chamada do jutsu: pincelada na cor do elemento (ou do tipo da técnica).
          say(B.logTech(name(e.uid), techName(e.techId)), color || `var(--t-${t.type})`);
          pushLog(B.logTech(name(e.uid), techName(e.techId)));
          for (const target of e.targets) if (color) card(target)?.style.setProperty('--glow', color);
          swish();
          break;
        }
        case 'damage':
          pose(e.target, 'hit');
          float(e.target, `−${e.amount}${e.crit ? '!' : ''}`, e.crit ? 'crit' : 'dmg');
          if (e.absorbed) float(e.target, `${icon('barrier')}${e.absorbed}`, 'shield');
          setHp(e.target, shown.get(e.target)!.hp - e.amount);
          pushLog(B.logDamage(name(e.target), e.amount, e.crit));
          land();
          break;
        case 'miss':
          float(e.target, B.miss, 'miss');
          pushLog(B.logMiss(name(e.uid)));
          break;
        case 'cloneBlock':
          float(e.target, B.clone, 'shield');
          pushLog(B.logClone(name(e.target)));
          break;
        case 'heal':
        case 'regen':
          float(e.target, `+${e.amount}`, 'heal');
          setHp(e.target, shown.get(e.target)!.hp + e.amount);
          pushLog(e.type === 'heal' ? B.logHeal(name(e.target), e.amount) : B.logRegen(name(e.target), e.amount));
          break;
        case 'shield':
          float(e.target, `${icon('barrier')}+${e.amount}`, 'shield');
          pushLog(B.logShield(name(e.target), e.amount));
          break;
        case 'clones':
          float(e.uid, `${icon('clones')}${e.total}`, 'shield');
          pushLog(B.logClones(name(e.uid), e.total));
          break;
        case 'effect':
          float(e.target, `${fxIcon(e.effect)} ${J.effects[e.effect]}`, 'fx');
          pushLog(B.logEffect(name(e.target), J.effects[e.effect]!));
          break;
        case 'cleanse':
          float(e.target, icon('sparkle'), 'heal');
          break;
        case 'tick':
          float(e.target, `−${e.amount} ${fxIcon(e.effect)}`, 'dmg');
          setHp(e.target, shown.get(e.target)!.hp - e.amount);
          pushLog(B.logTick(name(e.target), J.effects[e.effect]!, e.amount));
          break;
        case 'skip':
          float(e.uid, B.stunned, 'fx');
          pushLog(B.logSkip(name(e.uid)));
          break;
        case 'down':
          card(e.target)?.classList.add('down');
          setHp(e.target, 0);
          pushLog(B.logDown(name(e.target)));
          break;
        case 'survive':
          say(B.survive(name(e.target)), 'var(--jin)');
          setHp(e.target, 1);
          break;
        case 'revive':
          card(e.target)?.classList.remove('down');
          setHp(e.target, e.hp);
          float(e.target, B.revived(''), 'heal');
          pushLog(B.logRevive(name(e.target)));
          break;
        case 'item':
          pushLog(B.logItem(name(e.uid), J.items[e.item]?.name ?? e.item));
          break;
        case 'guard':
          float(e.uid, icon('stance'), 'shield');
          pushLog(B.logGuard(name(e.uid)));
          break;
        case 'rest':
          float(e.uid, `+${e.chakra}`, 'ck');
          pushLog(B.logRest(name(e.uid), e.chakra));
          break;
        case 'enrage':
          say(B.enrage(name(e.uid)), 'var(--accent)');
          pushLog(B.enrage(name(e.uid)));
          break;
        case 'end':
          wait = 0;
          break;
      }
      if (wait) await sleep(wait);
    }
    render(next);
  }

  /** Espera o toque num lutador válido (ou no Voltar). */
  function pickTarget(options: Fighter[], prompt: string): Promise<string | null> {
    if (options.length === 1) return Promise.resolve(options[0]!.uid);
    return new Promise((resolve) => {
      const ids = new Set(options.map((f) => f.uid));
      root.querySelectorAll<HTMLElement>('.jf').forEach((el) => el.classList.toggle('targetable', ids.has(el.dataset.uid!)));
      menu.innerHTML = `<p class="jb-prompt">${prompt}</p><button class="btn small" data-cancel>${B.cancel}</button>`;
      const onClick = (ev: Event) => {
        const t = ev.target as HTMLElement;
        if (t.closest('[data-cancel]')) return done(null);
        const c = t.closest<HTMLElement>('.jf');
        if (c && ids.has(c.dataset.uid!)) done(c.dataset.uid!);
      };
      const done = (v: string | null) => {
        root.removeEventListener('click', onClick);
        root.querySelectorAll('.jf.targetable').forEach((el) => el.classList.remove('targetable'));
        resolve(v);
      };
      root.addEventListener('click', onClick);
    });
  }

  /** Menu do turno do protagonista. Itens são aplicados aqui (não gastam o turno). */
  async function playerTurn(): Promise<JAction> {
    for (;;) {
      render(state);
      const me = current(state)!;
      const techs = me.techniques.map((id) => data.techniques[id]!).filter(Boolean);
      const moves = techs.filter((t) => !t.active);
      const actives = techs.filter((t) => t.active);
      const fallen = downed(state, 'ally');
      const items = CONSUMABLES.filter((id) => run.bag[id] > 0 && itemTargets(state, id).length > 0);
      menu.innerHTML = `<p class="jb-prompt">${B.yourTurn}</p>
        <div class="jb-moves">${moves.map((t) => techButton(me, t)).join('')}</div>
        <div class="jb-extra">${actives.map((t) => techButton(me, t)).join('')}
          <button class="btn small jx" data-act="guard" ${tip(B.guard, B.guardDesc)}>${icon('stance')} ${B.guard}</button>
          <button class="btn small jx" data-act="rest" ${tip(B.rest, B.restDesc)}>${icon('rest')} ${B.rest}</button>
          <button class="btn small jx" data-act="revive" ${tip(B.revive, B.reviveDesc)} ${fallen.length ? '' : 'aria-disabled="true"'}>${icon('willOfFire')} ${B.revive}</button>
          <button class="btn small jx" data-act="bag" ${tip(B.bag, B.bagDesc)} ${items.length && !state.itemUsed ? '' : 'aria-disabled="true"'}>${icon('kit')} ${B.bag}</button>
        </div>`;
      const pick = await new Promise<HTMLElement>((resolve) => {
        const onClick = (ev: Event) => {
          const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tech],[data-act]');
          if (!b || !menu.contains(b) || b.getAttribute('aria-disabled') === 'true') return;
          menu.removeEventListener('click', onClick);
          resolve(b);
        };
        menu.addEventListener('click', onClick);
      });
      if (pick.dataset.act === 'guard') return { kind: 'guard' };
      if (pick.dataset.act === 'rest') return { kind: 'rest' };
      if (pick.dataset.act === 'revive') {
        const uid = await pickTarget(fallen, B.pickDowned);
        if (uid) return { kind: 'revive', target: uid };
        continue;
      }
      if (pick.dataset.act === 'bag') {
        const item = await pickItem(items);
        if (!item) continue;
        const uid = await pickTarget(itemTargets(state, item), item === 'reviveKit' ? B.pickDowned : B.pickAlly);
        if (!uid) continue;
        const before = state;
        state = useItem(state, item, uid, data);
        run = spendItem(run, item);
        await animate(before, state);
        continue;
      }
      const tech = data.techniques[pick.dataset.tech!]!;
      if (tech.target === 'allEnemies' || tech.target === 'self') return { kind: 'tech', techId: tech.id, target: me.uid };
      const uid = await pickTarget(validTargets(state, me, tech), tech.target === 'ally' ? B.pickAlly : B.pickTarget);
      if (uid) return { kind: 'tech', techId: tech.id, target: uid };
    }
  }

  function pickItem(items: ConsumableId[]): Promise<ConsumableId | null> {
    menu.innerHTML = `<p class="jb-prompt">${B.bagDesc}</p><div class="jb-moves">${items
      .map((id) => `<button class="btn jmove" data-item="${id}"><span class="jmove-ico">${icon('kit')}</span><span class="jmove-txt"><b>${J.items[id]!.name} ×${run.bag[id]}</b><small>${J.items[id]!.desc}</small></span></button>`)
      .join('')}</div><button class="btn small" data-cancel>${B.cancel}</button>`;
    return new Promise((resolve) => {
      const onClick = (ev: Event) => {
        const t = ev.target as HTMLElement;
        const b = t.closest<HTMLElement>('[data-item]');
        if (!b && !t.closest('[data-cancel]')) return;
        menu.removeEventListener('click', onClick);
        resolve(b ? (b.dataset.item as ConsumableId) : null);
      };
      menu.addEventListener('click', onClick);
    });
  }

  // Entrada: varrida de pergaminho, depois os turnos que vieram antes do protagonista.
  render(state);
  await sleep(host.instant() ? 150 : 900);
  root.querySelector('.jb-intro')?.remove();
  await flashRelics(root, startRelics(run0), host.instant());
  await animate({ ...state, log: [] }, state);
  while (state.status === 'ongoing') {
    if (!awaitingPlayer(state)) break;
    const action = await playerTurn();
    menu.innerHTML = '';
    const before = state;
    state = playerAct(state, action, data, rng);
    await animate(before, state);
  }
  render(state);
  const won = state.status === 'won';
  host.mood(won ? 'good' : 'bad');
  say(`<b class="kanji end-kanji" aria-hidden="true">${won ? '勝' : '敗'}</b>${won ? B.won : B.lost}`, won ? 'var(--gold)' : 'var(--accent-deep)');
  if (won) void flashRelics(root, winRelics(run0), host.instant());
  menu.innerHTML = '';
  await sleep(host.instant() ? 200 : 900);
  return { battle: state, run };
}
