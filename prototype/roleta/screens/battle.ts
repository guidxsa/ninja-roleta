// Roleta: luta 1×1, com as roletas de iniciativa e acerto.
import { scaleVillain } from '../../../src/core/difficulty';
import { gateUpkeep } from '../../../src/core/gates';
import { hitSlices } from '../../../src/core/hit';
import { xpGain } from '../../../src/core/player';
import { type RBattleOptions, type RBattle, kitOf, playerAttackOdds, playerHitDamage, techCost, canUseTechnique, canUseActive, startRoletaBattle, useActive, playRoletaRound, type RAction, type REvent } from '../../../src/core/roleta/battle';
import { playerTechniques } from '../../../src/core/roleta/player';
import { type VillainDef, type ConsumableId } from '../../../src/core/types';
import { CONSUMABLES } from '../../../src/data/events';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { type RTechniqueDef } from '../../../src/data/roleta/techniques';
import { roletaVillainsById as villainsById } from '../../../src/data/roleta/villains';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { icon } from '../../art';
import { mood } from '../../audio';
import { esc, h, show, isOff, choose, sleep } from '../../dom';
import { DESK } from '../../layout';
import { villainTechElement, techIconName, villainTechTip, type Condition, conditionChip, rTechTip } from '../../tips';
import { tip } from '../../tooltip';
import { stripRoulette } from '../../wheel';
import { techName, techLook, data, foePortrait, villainName, elChip, bar, roletaArt, roletaCategory, CATEGORY_SCENE, avatar, lineageTip, originLabel, jinChip, passiveTraitEntries, passiveChip, setBar, SIDE_COLORS, pace } from '../common';
import { ses } from '../session';
import { elementChips, silentNature } from './origin';

// ---------------------------------------------------------------------------
// Tela: combate

export interface BattleSetup {
  villainId: string;
  options: Partial<RBattleOptions>;
  label: string;
  exam: boolean;
  /** Ficha do vilão já com a dificuldade e o ciclo (sem ela, só a dificuldade). */
  def?: VillainDef;
  /** Luta já em andamento (UI Lab): começa deste estado, sem animar o que já passou. Sem ele, uma luta nova. */
  from?: RBattle;
}

export type VillainDefT = VillainDef;

export const PASSIVE_ICONS: Record<string, string> = {
  trickster: 'trickster',
  mirrors: 'mirrors',
  mist: 'mist',
  beast: 'beast',
  curseMark: 'curseMark',
  scalpel: 'scalpel',
  insane: 'snake',
};

/** Passivas do vilão como selos (na versão da dificuldade: a hardcore já vem trocada por scaleVillain). */
export function villainPassiveChips(v: VillainDefT): string {
  const out: string[] = [];
  const passive = v.passive;
  if (passive) {
    const key = passive.kind === 'cloak' ? passive.variant : passive.kind;
    const t = S.villainPassives[key]!;
    const hardcore = ses.camp?.difficulty === 'hardcore' && v.hardcorePassive !== undefined;
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
export function villainKit(v: VillainDefT, techniques = v.techniques.filter((t) => t.barrier === undefined)): string {
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
export function villainStats(phys: number, mental: number, speed: number): string {
  const pill = (key: 'physical' | 'mental' | 'speed', ico: string, v: number) => {
    const T = S.tips.stats;
    const desc = T[key];
    return `<span class="stat-pill"${tip(S.stats[key], desc)}>${icon(ico)}<small>${S.stats[key]}</small><b>${v}</b></span>`;
  };
  return `<div class="stat-pills">${pill('physical', 'barrier', phys)}${pill('mental', 'genjutsu', mental)}${pill('speed', 'dodge', speed)}</div>`;
}

/** Ficha do próximo vilão no mapa: retrato, atributos, passivas e técnicas. */
export function villainCard(id: string, scaled?: VillainDef): string {
  const v = scaled ?? scaleVillain(villainsById[id]!, ses.camp!.difficulty, data);
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
export function villainPanel(s: RBattle): string {
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
export function villainLiveStats(s: RBattle): string {
  const p = s.villain.def.passive;
  const cloakOn = p?.kind === 'cloak' && (s.villain.cloakTurns > 0 || s.villain.monster);
  const res = (kind: 'physical' | 'mental') => Math.floor(s.villain.def.resistance[kind] * (cloakOn ? p.cloak.resistanceMult : 1));
  return villainStats(res('physical'), res('mental'), s.villain.def.speed);
}

export const R = S.roleta;
export const EFFECT_ICONS: Record<string, string> = { burn: 'fire', poison: 'poison', stun: 'stun', fear: 'fear' };
export const RACTIVE_ICONS: Record<string, string> = {
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

export function effectChips(effects: RBattle['fx']['effects'], tone: 'good' | 'bad'): Condition[] {
  return effects
    .filter((e) => e.turns > 0)
    .map((e) => ({ icon: EFFECT_ICONS[e.kind] ?? 'warning', label: R.ui.effectOn(R.effects[e.kind]!.name, e.turns), tone, ...R.effects[e.kind]! }));
}

export function badgesHtml(s: RBattle, side: 'player' | 'villain'): string {
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
export function actionCell(o: {
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

export const ITEM_ICONS: Record<ConsumableId, string> = { soldierPill: 'pill', medKit: 'kit', explosiveTag: 'tag', smokeBomb: 'smoke' };

/** Custo em chakra da placa; fica vermelho quando o chakra atual não paga. */
export const costTag = (s: RBattle, n: number) => `<span class="cost${n > s.player.chakra ? ' short' : ''}">${S.ui.cost(n)}</span>`;

/** Botão de técnica: ícone, nome, dano×golpes, chance de acerto e custo. Efeitos e regras ficam na dica. */
export function techButton(s: RBattle, t: RTechniqueDef, enabled: boolean): string {
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

export const actionGroup = (title: string, body: string, compact = false) =>
  `<section class="act-group${compact ? ' compact' : ''}"><h4 class="act-title">${title}</h4>${body}</section>`;

/** Ações em seções: técnicas (com a ativa da linhagem), Defender e Concentrar, e os itens da bolsa. */
export function actionGrid(s: RBattle, enabled: boolean): string {
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
export function activeButton(s: RBattle, enabled: boolean): string {
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
export function floatNumber(card: HTMLElement | null, text: string, cls: string, fx?: 'slash' | 'evade') {
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
export async function battleScreen(setup: BattleSetup, abandonable = false): Promise<RBattle | null> {
  const c = ses.camp!;
  const villain = setup.def ?? scaleVillain(villainsById[setup.villainId]!, c.difficulty, data);
  let state = setup.from ?? startRoletaBattle(c.player, villain, setup.options, rdata, ses.rng);
  ses.battlePlayer = () => state.player;

  // Chefe do ciclo: palco próprio (moldura de perigo, retrato maior e o 将 no lugar do 戦; o título já diz "Chefe").
  const boss = roletaCategory() === 'boss';
  const root = show(
    h(`<div class="screen battle${boss ? ' rb-boss' : ''}">
      <div class="battle-head"><span>${icon(boss ? 'intent' : 'swords')} ${setup.label}</span><span id="round">${S.ui.round(0)}</span></div>
      <div id="vslot">${villainPanel(state)}</div>
      <div class="arena">${roletaArt(`roleta-${roletaCategory()}`, CATEGORY_SCENE[roletaCategory()] ?? 'konoha', 'rarena-art')}<span class="arena-mark kanji" aria-hidden="true">${boss ? '将' : '戦'}</span><div id="dice" class="dice"></div></div>
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
  await animate(setup.from ? [] : state.log, state);

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
      ses.battlePlayer = null;
      return null;
    }
    renderActions(state, false);
    let next: RBattle;
    if (btn.hasAttribute('data-active')) next = useActive(state, rdata, ses.rng);
    else next = playRoletaRound(state, btn.dataset.choice as RAction, rdata, ses.rng);
    await animate(next.log.slice(state.log.length), next, state);
    state = next;
    renderBadges(state);
  }

  // Resultado
  ses.battlePlayer = null;
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
export let lastAttack: { side: 'player' | 'villain'; tech: string; crit: boolean } | null = null;
