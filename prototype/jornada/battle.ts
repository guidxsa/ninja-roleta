// Tela de batalha da Jornada (docs/jornada/combate.md#interface): inimigos em cima, equipe embaixo,
// alvo por toque e animação a partir do log de eventos do core. Sem roleta na tela: só o resultado.
import {
  awaitingPlayer,
  canRaise,
  effectTurns,
  battlePower,
  blockedReason,
  current,
  fighter,
  gateChoices,
  gateOpenCost,
  nextGateUpkeep,
  gateTotals,
  hitsOf,
  hpCost,
  itemTargets,
  maxGate,
  advance,
  openBattle,
  playerAct,
  setGate,
  techniqueCost,
  techPower,
  useActive,
  useItem,
  validTargets,
} from '../../src/core/jornada/battle';
import type { JornadaData } from '../../src/core/jornada/data';
import { CONSUMABLES, currentStop, spendItem, supportClass, type JRun } from '../../src/core/jornada/run';
import type { BattleSetup } from '../../src/core/jornada/battle';
import type { Boost, ConsumableId, Fighter, FighterMods, JAction, JBattle, JEvent, JTechnique } from '../../src/core/jornada/types';
import type { Rng } from '../../src/core/rng';
import { jornadaData } from '../../src/data/jornada';
import { BEATS } from '../../src/data/elements';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { fighterPortrait, icon } from '../art';
import { barLayers, barPct, barTone, captureTrails, patchBar, restoreTrails } from '../bars';
import { swish, land } from '../audio';
import { esc, h, show, sleep } from '../dom';
import { ELEMENT_COLORS, lines } from '../tips';
import { tip } from '../tooltip';
import { flashRelics, relicStrip, startRelics, winRelics } from './relics';
import { foldAttrs, foldButton } from './fold';
import type { JornadaHost } from './host';

const J = S.jornada;
const B = J.battle;

/** Ícone de cada efeito de status (dicas, selos do lutador, números flutuantes). */
export const EFFECT_ICONS: Record<string, string> = { stun: 'stun', burn: 'fire', poison: 'poison', chakraBlock: 'block', stunGuard: 'immune' };
const fxIcon = (kind: string) => icon(EFFECT_ICONS[kind] ?? 'neutral');

/** Nome do protagonista: o do jogador no Caminho Ninja ("Nome Uchiha"); na História, o Naruto. Sem escapar. */
export function heroLabel(hero: string, playerName: string): string {
  const named = J.heroNamed[hero];
  return named && playerName ? named(playerName) : (J.names[hero] ?? hero);
}

/**
 * Nome de um membro da equipe nesta run: o do jogador (protagonista do Caminho Ninja), o sorteado com o clã
 * (suportes do Caminho Ninja: "Kaede Uchiha") ou o da ficha. Sem escapar.
 */
export function memberLabel(run: JRun, id: string, playerName: string): string {
  if (id === run.hero) return run.mode === 'generic' ? heroLabel(run.hero, playerName) : (J.names[id] ?? id);
  const key = run.names?.[id];
  const cls = key ? supportClass(id, jornadaData) : null;
  if (key && cls) {
    const name = J.supportNames[key] ?? key;
    return J.supportNamed[cls.id]?.(name) ?? name;
  }
  return J.names[id] ?? id;
}

/** Luta em andamento (para a Ficha mostrar o HP e o chakra ao vivo); null fora da luta. */
export let liveBattle: (() => JBattle) | null = null;
/** Run desta luta (a bolsa muda quando um item é usado). */
export let liveBattleRun: (() => JRun) | null = null;
/** Esquece a luta (voltar ao menu no meio dela deixa o fluxo órfão sem chegar ao fim). */
export const forgetLiveBattle = () => {
  liveBattle = null;
  liveBattleRun = null;
};

/** Nome do protagonista desta luta. */
let heroName: string | null = null;
/** Nomes da equipe desta luta (suportes com nome sorteado), por ficha. */
let teamNames: Record<string, string> = {};

export const fighterName = (f: { defId: string; protagonist?: boolean; side?: string }) =>
  f.protagonist && heroName ? heroName : ((f.side !== 'enemy' && teamNames[f.defId]) || (J.names[f.defId] ?? f.defId));
export const techName = (id: string) => J.techniques[id] ?? id;

/** Visual do protagonista desta luta (personalização da run). */
let heroSkin: string | null = null;

const CLONE_PCT = Math.round(jornadaData.base.clones.blockChance * 100);

function portraitOf(f: Fighter, data: JornadaData): string {
  // Forma ligada pelo roteiro (manto, Shukaku) com retrato próprio.
  const formArt = f.form ? (data.characters[f.defId] ?? data.enemies[f.defId])?.forms?.find((x) => x.id === f.form)?.portrait : undefined;
  const spec = formArt ?? (f.protagonist && heroSkin ? `ninja:${heroSkin}` : (data.characters[f.defId]?.portrait ?? data.enemies[f.defId]?.portrait ?? 'ninja:common'));
  // Na forma, o retrato é o dela: a imagem própria do personagem não passa por cima (a da forma seria `<id>-<forma>`).
  return fighterPortrait(formArt ? `${f.defId}-${f.form}` : f.defId, spec, 'md');
}

function miniBar(kind: 'hp' | 'ck', cur: number, max: number): string {
  const pct = barPct(cur, max);
  const tone = barTone(kind, pct);
  return `<div class="bar bar-${kind} jbar${tone ? ` ${tone}` : ''}" data-bar="${kind}">${barLayers(pct)}<span>${Math.max(0, Math.round(cur))}/${max}</span></div>`;
}

/** Chave de uma barra para o rastro sobreviver ao redesenho dos lutadores (uid + tipo). */
const barKey = (bar: HTMLElement) => {
  const uid = bar.closest<HTMLElement>('.jf')?.dataset.uid;
  if (uid) return `${uid}:${bar.dataset.bar}`;
  // Ficha do painel lateral (widescreen): rastro próprio, para não disputar com o do cartão.
  const row = bar.closest<HTMLElement>('[data-row]')?.dataset.row;
  return row ? `row:${row}:${bar.dataset.bar}` : null;
};

const pct = (n: number) => `${Math.round(n * 100)}%`;
const pctN = (n: number) => Math.round(n * 100);
/** Multiplicador com vírgula e até 2 casas (1,15; 1,3). */
const fmtMult = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const G = J.gates;
const gateName = (level: number) => G.names[level - 1] ?? '';

/** Partes de um fortalecimento para a dica ("dano ×1,3, +15% de acerto"). */
function boostParts(b: Boost): string {
  return [
    b.damageMult ? `dano ×${fmtMult(b.damageMult)}` : '',
    b.offense ? `+${b.offense} nos ataques` : '',
    b.accuracy ? (b.accuracy >= 1 ? 'não erra' : `+${pct(b.accuracy)} de acerto`) : '',
    b.evasion ? `+${pct(b.evasion)} de esquiva` : '',
    b.penetration ? `+${pct(b.penetration)} de penetração` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/** Bônus e próxima manutenção de um portão, para as dicas. */
function gateLines(f: Fighter, level: number): string[] {
  const t = gateTotals(level, jornadaData);
  return [G.bonus(fmtMult(t.damageMult), pctN(t.accuracy), pctN(t.critBonus), level > 1), G.upkeep(nextGateUpkeep(f, level, jornadaData))];
}

/** Dica do botão Portões: o que está aberto, o desgaste e as regras. */
function gatesTip(s: JBattle, f: Fighter, tech: JTechnique): string {
  const g = jornadaData.j.gates;
  const wait = f.gate ? 0 : (f.cooldowns[tech.id] ?? 0);
  const body = lines([
    wait ? `<b>${B.cooldown(wait)}</b>` : s.activeUsed ? `<b>${B.activeSpent}</b>` : '',
    f.gate ? `<b>${gateName(f.gate.level)}</b>` : '',
    ...(f.gate ? gateLines(f, f.gate.level) : []),
    G.max(gateName(maxGate(f, jornadaData))),
    G.rule,
    G.open(g.activationPerLevel),
    G.growth,
    G.cooldown(g.cooldown),
  ]);
  return tip(techName(tech.id), body);
}

/** Dica de um portão no submenu. */
function gateOptionTip(f: Fighter, level: number): string {
  const cost = gateOpenCost(f, level, jornadaData);
  const body = lines([G.romaji[level - 1] ?? '', ...gateLines(f, level), cost ? G.open(jornadaData.j.gates.activationPerLevel) : '']);
  return tip(gateName(level), body);
}

/** Clones que a técnica cria, com o bônus de quem usa. */
const clonesMade = (tech: JTechnique, f?: Fighter) => (tech.clones ?? 0) + (f?.mods.extraClones ?? 0);

/**
 * Dica completa de uma técnica (passar o mouse ou segurar o dedo): é onde ficam alvo, efeitos, regras e o motivo de
 * bloqueio. `f` mostra custo, golpes e dano da luta; `mods`, o dano com os bônus de ficha (fora da luta).
 */
export function techTip(tech: JTechnique, f?: Fighter, mods?: FighterMods, s?: JBattle): string {
  const U = J.ui;
  const hits = f ? hitsOf(f, tech) : (tech.hits ?? 1);
  const cost = f ? techniqueCost(f, tech) : tech.chakraCost;
  const power = f ? battlePower(f, tech, jornadaData) : mods ? techPower(tech, mods) : tech.baseDamage;
  const blocked = f ? blockedReason(f, tech) : null;
  const why = blocked ? (blocked === 'cooldown' ? B.cooldown(f!.cooldowns[tech.id]!) : B.blocked[blocked]) : tech.active && s?.activeUsed ? B.activeSpent : '';
  const effect = tech.onHit
    ? `${fxIcon(tech.onHit.effect)} ${J.effects[tech.onHit.effect]} ${pct(tech.onHit.chance)} (${effectTurns(tech, jornadaData)} t)`
    : '';
  const body = lines([
    why ? `<b>${why}</b>` : '',
    `${J.types[tech.type]}${tech.element ? ` · ${S.elements[tech.element]}` : ''}${tech.active ? ' · ativa' : ''}`,
    `${U.tipTarget}: ${J.targets[tech.target]}`,
    tech.baseDamage > 0 ? `${B.damage(power)}${hits > 1 ? ` · ${B.hits(hits)}` : ''}${tech.hitsPerClone ? ` (+${tech.hitsPerClone}/clone, até +${tech.maxCloneHits})` : ''}` : '',
    tech.baseDamage > 0 ? B.powerTip : '',
    tech.baseDamage > 0 || tech.onHit ? `${U.tipAccuracy}: ${pct(tech.accuracy ?? 0.85)}` : '',
    tech.critBonus ? `+${pct(tech.critBonus)} crítico` : '',
    tech.penetration ? `penetração ${pct(tech.penetration)}` : '',
    effect,
    tech.healHp ? `cura ${tech.healHp} de HP` : '',
    tech.shieldPct ? `${icon('barrier')} escudo ${pct(tech.shieldPct)} do HP de quem usa` : '',
    tech.cleanse ? `tira ${J.effects.stun} e ${J.effects.chakraBlock}` : '',
    tech.clones ? `${icon('clones')} ${B.clonesMade(clonesMade(tech, f))}. ${B.cloneRule(CLONE_PCT, jornadaData.j.combat.maxClones)}` : '',
    cost ? B.chakra(cost) : '',
    tech.hpCostPct && f ? B.hpCost(hpCost(f, tech)) : tech.hpCostPct ? `${pct(tech.hpCostPct)} do HP` : '',
    tech.boost ? B.boostLine(tech.boost.turns, boostParts(tech.boost)) : '',
    tech.cooldown ? B.cooldown(tech.cooldown) : '',
    tech.active ? B.activeTip : '',
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
    f.clones ? `${icon('clones')} ${B.clonesActive(f.clones, CLONE_PCT)}` : '',
    f.gate ? `${icon('gates')} ${B.gateTip(gateName(f.gate.level), nextGateUpkeep(f, f.gate.level, jornadaData))}` : '',
    ...(f.gate ? gateLines(f, f.gate.level) : []),
    f.boost ? `${icon('sparkle')} ${B.boostTip(techName(f.boost.techId), f.boost.turns)}: ${boostParts(f.boost)}` : '',
    effects.length ? `${U.tipEffects}: ${effects.join(', ')}` : '',
    f.techniques.map((id) => techName(id)).join(' · '),
  ]);
  return tip(fighterName(f), body);
}

function statusChips(f: Fighter): string {
  // A trava contra atordoamento é a favor de quem a tem.
  const chips = f.effects.map((e) => `<span class="jchip ${e.kind === 'stunGuard' ? 'good' : 'bad'}" title="${J.effects[e.kind]}">${fxIcon(e.kind)}${e.turns}</span>`);
  if (f.shield > 0) chips.push(`<span class="jchip good">${icon('barrier')}${f.shield}</span>`);
  if (f.clones > 0) chips.push(`<span class="jchip good" title="${B.clonesActive(f.clones, CLONE_PCT)}">${icon('clones')}${f.clones}</span>`);
  if (f.guarding) chips.push(`<span class="jchip good">${icon('stance')}</span>`);
  if (f.gate) chips.push(`<span class="jchip gate" title="${B.gateTip(gateName(f.gate.level), nextGateUpkeep(f, f.gate.level, jornadaData))}">${icon('gates')}${G.numeral[f.gate.level - 1]}</span>`);
  if (f.boost) chips.push(`<span class="jchip good" title="${B.boostTip(techName(f.boost.techId), f.boost.turns)}">${icon('sparkle')}${f.boost.turns}</span>`);
  return chips.join('');
}

/** Cópias do retrato atrás do lutador, uma por clone. `fresh`: as cópias a partir daqui entram com animação. */
function cloneGhosts(f: Fighter, data: JornadaData, count: number, fresh = count): string {
  const art = portraitOf(f, data);
  return Array.from({ length: Math.max(0, count) }, (_, i) => `<span class="jf-clone${i >= fresh ? ' fresh' : ''}" aria-hidden="true">${art}</span>`).join('');
}

function fighterCard(f: Fighter, data: JornadaData): string {
  return `<button class="jf ${f.side}${f.down ? ' down' : ''}${f.protagonist ? ' hero' : ''}" data-uid="${f.uid}" type="button"${fighterTip(f)}>
    <span class="jf-art"><span class="jf-clones">${cloneGhosts(f, data, f.clones)}</span>${portraitOf(f, data)}<span class="jf-floats"></span></span>
    <span class="jf-info"><b class="jf-name">${esc(fighterName(f))}</b>
      ${miniBar('hp', f.hp, f.maxHp)}${f.maxChakra > 0 ? miniBar('ck', f.chakra, f.maxChakra) : ''}
      <span class="jf-chips">${statusChips(f)}</span></span>
  </button>`;
}

/** Elemento que vence cada elemento (o inverso do ciclo): é contra ele que o inimigo é fraco. */
const WEAK_TO = Object.fromEntries(Object.entries(BEATS).map(([a, b]) => [b, a])) as Record<string, keyof typeof BEATS>;

/** Faixa da ordem da rodada (widescreen): quem age a partir de agora, o da vez em destaque, sem quem caiu. */
function orderStrip(s: JBattle, data: JornadaData): string {
  const rest = s.order.slice(s.turnIndex).map((uid) => s.fighters.find((f) => f.uid === uid)).filter((f): f is Fighter => Boolean(f) && !f!.down);
  return rest.map((f, i) => `<span class="jb-order-it ${f.side}${i === 0 && s.status === 'ongoing' ? ' now' : ''}"${tip(fighterName(f), '')}>${portraitOf(f, data)}</span>`).join('');
}

/**
 * Ficha de um lutador nos painéis laterais do widescreen: retrato, nome, barras com números, elemento (e, no inimigo,
 * o comportamento e a passiva) e os chips de estado. A dica é a mesma do retrato. Não é alvo: escolher é no campo.
 */
function intelRow(f: Fighter, data: JornadaData): string {
  const U = J.ui;
  const passive =
    f.passive?.kind === 'enrage' ? U.tipPassive(Math.round(f.passive.atPct * 100), f.passive.damageMult) : f.passive?.kind === 'startShieldPct' ? U.tipStartShield(Math.round(f.passive.pct * 100)) : '';
  const enemy = f.side === 'enemy';
  const traits = [f.element ? `${icon(f.element)} ${S.elements[f.element]}` : '', enemy ? (J.ai[f.ai] ?? '') : ''].filter(Boolean).join(' · ');
  // Inimigo: contra o que ele é fraco e forte (ciclo dos elementos), passiva e as técnicas com o dano.
  let matchup = '';
  let techs = '';
  if (enemy) {
    if (f.element) {
      const weak = WEAK_TO[f.element]!;
      const mult = String(data.j.combat.elementAdvantage).replace('.', ',');
      matchup = `<small class="jb-row-traits jb-row-match"><span class="weak">${icon(weak)} ${B.weakTo(S.elements[weak], mult)}</span><span>${icon(BEATS[f.element])} ${B.strongVs(S.elements[BEATS[f.element]])}</span></small>`;
    }
    techs = `<ul class="jb-row-techs">${f.techniques
      .map((id) => data.techniques[id])
      .filter((t): t is JTechnique => Boolean(t))
      .map((t) => `<li style="--c:${t.element ? ELEMENT_COLORS[t.element] : `var(--t-${t.type})`}">${icon(t.element ?? t.type)}<span>${techName(t.id)}</span>${t.baseDamage > 0 ? `<b>${battlePower(f, t, data)}${hitsOf(f, t) > 1 ? `×${hitsOf(f, t)}` : ''}</b>` : ''}</li>`)
      .join('')}</ul>`;
  }
  return `<div class="jb-row ${f.side}${f.down ? ' down' : ''}" data-row="${f.uid}"${fighterTip(f)}>
    ${portraitOf(f, data)}
    <div class="jb-row-info"><b>${esc(fighterName(f))}</b>
      ${miniBar('hp', f.hp, f.maxHp)}${f.maxChakra > 0 ? miniBar('ck', f.chakra, f.maxChakra) : ''}
      ${traits ? `<small class="jb-row-traits">${traits}</small>` : ''}${matchup}${passive && enemy ? `<small class="jb-row-traits">${passive}</small>` : ''}
      <span class="jf-chips">${statusChips(f)}</span>${techs}</div>
  </div>`;
}

/** Botão de técnica: nome e os números principais (dano e custo). O resto fica na dica. */
function techButton(s: JBattle, f: Fighter, tech: JTechnique): string {
  const blocked = blockedReason(f, tech);
  const disabled = Boolean(blocked) || Boolean(tech.active && s.activeUsed) || validTargets(s, f, tech).length === 0;
  const cost = techniqueCost(f, tech);
  const hp = hpCost(f, tech);
  const hits = hitsOf(f, tech);
  const power = battlePower(f, tech, jornadaData);
  const bits = [
    tech.baseDamage > 0 ? `<span${power > tech.baseDamage ? ' class="up"' : ''}>${B.damage(power)}${hits > 1 ? `×${hits}` : ''}</span>` : '',
    tech.clones ? `${icon('clones')} +${clonesMade(tech, f)}` : '',
    cost ? `<span${f.chakra < cost ? ' class="short"' : ''}>${B.chakra(cost)}</span>` : '',
    hp ? `<span${hp >= f.hp ? ' class="short"' : ''}>${B.hpCost(hp)}</span>` : '',
  ].filter(Boolean);
  const color = tech.element ? ELEMENT_COLORS[tech.element] : `var(--t-${tech.type})`;
  const wait = blocked === 'cooldown' ? f.cooldowns[tech.id]! : 0;
  const cd = wait ? `<span class="cd" style="--p:${Math.min(1, wait / Math.max(wait, tech.cooldown ?? wait))}" aria-hidden="true">${wait}</span>` : '';
  return `<button class="btn jmove${wait ? ' cooling' : ''}" data-tech="${tech.id}" ${disabled ? 'aria-disabled="true"' : ''} style="--c:${color}"${techTip(tech, f, undefined, s)}>
    <span class="jmove-ico">${icon(tech.element ?? tech.type)}${cd}</span>
    <span class="jmove-txt"><b>${techName(tech.id)}</b>${bits.length ? `<small>${bits.join(' · ')}</small>` : ''}</span></button>`;
}

/** Botão dos Portões: aberto, mostra o portão e os turnos; em espera, o círculo de espera. */
function gatesButton(s: JBattle, f: Fighter, tech: JTechnique): string {
  const can = gateChoices(s, f, jornadaData).length > 0;
  const wait = f.gate ? 0 : (f.cooldowns[tech.id] ?? 0);
  const cd = wait ? `<span class="cd" style="--p:${Math.min(1, wait / jornadaData.j.gates.cooldown)}" aria-hidden="true">${wait}</span>` : '';
  const small = f.gate ? `${gateName(f.gate.level)} · ${G.perTurn(nextGateUpkeep(f, f.gate.level, jornadaData))}` : '';
  return `<button class="btn jmove${wait ? ' cooling' : ''}${f.gate ? ' on' : ''}" data-gates ${can ? '' : 'aria-disabled="true"'} style="--c:var(--accent)"${gatesTip(s, f, tech)}>
    <span class="jmove-ico">${icon('gates')}${cd}</span>
    <span class="jmove-txt"><b>${techName(tech.id)}</b>${small ? `<small>${small}</small>` : ''}</span></button>`;
}

export interface BattleResult {
  battle: JBattle;
  run: JRun;
  /** O jogador desistiu da jornada no meio da luta (Desistir, no turno do protagonista). */
  abandoned?: boolean;
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
  heroName = run0.mode === 'generic' ? heroLabel(run0.hero, host.playerName()) : null;
  teamNames = Object.fromEntries(setup.allies.map((a) => [a.defId, memberLabel(run0, a.defId, host.playerName())]));
  // Na abertura ninguém agiu ainda: os turnos antes do protagonista só andam depois da intro, para as barras não adiantarem o dano.
  let state = openBattle(setup, data);
  liveBattle = () => state;
  liveBattleRun = () => run;
  const root = show(
    h(`<div class="screen jbattle scene-${scene}">
      <div class="jb-head"><span>${icon('swords')} ${esc(label)}</span><span data-round></span></div>
      ${run0.relics.length ? `<div class="jb-relics">${relicStrip(run0)}</div>` : ''}
      ${goal ? `<p class="jb-goal">${esc(goal)}</p>` : ''}
      <div class="jb-side jb-enemies" data-side="enemy"></div>
      <div class="jb-banner" aria-live="polite"></div>
      <div class="jb-side jb-allies" data-side="ally"></div>
      <div class="jb-left"><div class="jb-order" data-order data-title="${B.orderTitle}"${foldAttrs('order')}></div>
        <aside class="jb-intel jb-foes" data-intel="enemy" data-title="${B.foesTitle}"${foldAttrs('foes')}></aside>
        <button class="jb-log" type="button" data-log data-title="${B.logTitle}"${tip(B.logTitle, B.logTip)}><span></span></button></div>
      <div class="jb-right"><aside class="jb-intel jb-team" data-intel="ally" data-title="${B.teamTitle}"${foldAttrs('team')}></aside>
        <div class="jb-menu"></div></div>
      <div class="jb-intro"><div>${esc(label)}</div></div>
      <div class="jb-fx" aria-hidden="true"></div>
    </div>`),
  );
  const enemiesEl = root.querySelector<HTMLElement>('.jb-enemies')!;
  const alliesEl = root.querySelector<HTMLElement>('.jb-allies')!;
  const menu = root.querySelector<HTMLElement>('.jb-menu')!;
  const banner = root.querySelector<HTMLElement>('.jb-banner')!;
  const logBtn = root.querySelector<HTMLElement>('[data-log]')!;
  const soloFight = setup.allies.length === 1;
  const logLines: string[] = [];
  logBtn.addEventListener('click', () => logBtn.classList.toggle('open'));
  const beat = () => (host.instant() ? 70 : 420);

  const fxLayer = root.querySelector<HTMLElement>('.jb-fx')!;
  const render = (s: JBattle) => {
    const trails = captureTrails(root, barKey);
    enemiesEl.innerHTML = s.fighters.filter((f) => f.side === 'enemy').map((f) => fighterCard(f, data)).join('');
    alliesEl.innerHTML = s.fighters.filter((f) => f.side === 'ally').map((f) => fighterCard(f, data)).join('');
    // Painéis do widescreen (escondidos abaixo de 1280px pelo CSS).
    root.querySelector<HTMLElement>('[data-order]')!.innerHTML = foldButton('order') + orderStrip(s, data);
    for (const side of ['enemy', 'ally'] as const) {
      root.querySelector<HTMLElement>(`[data-intel="${side}"]`)!.innerHTML = foldButton(side === 'enemy' ? 'foes' : 'team') + s.fighters.filter((f) => f.side === side).map((f) => intelRow(f, data)).join('');
    }
    restoreTrails(root, barKey, trails);
    root.querySelector('[data-round]')!.textContent = B.round(Math.max(1, s.round));
    const turn = current(s);
    root.querySelectorAll('.jf').forEach((el) => el.classList.toggle('acting', (el as HTMLElement).dataset.uid === turn?.uid && s.status === 'ongoing'));
    root.querySelectorAll<HTMLElement>('.jb-row').forEach((el) => el.classList.toggle('acting', el.dataset.row === turn?.uid && s.status === 'ongoing'));
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
  // Barras durante a animação: parte do estado anterior e aplica cada evento, no cartão do campo e na ficha do painel.
  const bars = (uid: string, kind: 'hp' | 'ck') => root.querySelectorAll<HTMLElement>(`.jf[data-uid="${uid}"] [data-bar="${kind}"], [data-row="${uid}"] [data-bar="${kind}"]`);
  const shown = new Map<string, { hp: number; max: number; chakra: number; maxChakra: number }>();
  const setChakra = (uid: string, chakra: number) => {
    const v = shown.get(uid);
    if (!v) return;
    v.chakra = Math.max(0, Math.min(v.maxChakra, chakra));
    for (const el of bars(uid, 'ck')) patchBar(el, 'ck', v.chakra, v.maxChakra, `${Math.round(v.chakra)}/${v.maxChakra}`);
  };
  const setHp = (uid: string, hp: number) => {
    const v = shown.get(uid);
    if (!v) return;
    v.hp = Math.max(0, Math.min(v.max, hp));
    for (const el of bars(uid, 'hp')) patchBar(el, 'hp', v.hp, v.max, `${Math.max(0, Math.round(v.hp))}/${v.max}`);
  };

  async function animate(prev: JBattle, next: JBattle) {
    render(prev);
    shown.clear();
    for (const f of prev.fighters) shown.set(f.uid, { hp: f.hp, max: f.maxHp, chakra: f.chakra, maxChakra: f.maxChakra });
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
          if (e.cost) setChakra(e.uid, shown.get(e.uid)!.chakra - e.cost);
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
        case 'cloneBlock': {
          float(e.target, B.clone, 'shield');
          pushLog(B.logClone(name(e.target)));
          // A última cópia atrás do retrato vira fumaça.
          const ghost = [...(card(e.target)?.querySelectorAll<HTMLElement>('.jf-clone:not(.poof)') ?? [])].pop();
          if (ghost) {
            ghost.classList.add('poof');
            setTimeout(() => ghost.remove(), host.instant() ? 120 : 480);
          }
          break;
        }
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
        case 'clones': {
          float(e.uid, `${icon('clones')}${e.total}`, 'shield');
          pushLog(B.logClones(name(e.uid), e.total));
          const layer = card(e.uid)?.querySelector<HTMLElement>('.jf-clones');
          if (layer) layer.innerHTML = cloneGhosts(fighter(next, e.uid), data, e.total, layer.querySelectorAll('.jf-clone:not(.poof)').length);
          break;
        }
        case 'effect':
          float(e.target, `${fxIcon(e.effect)} ${J.effects[e.effect]}`, 'fx');
          pushLog(B.logEffect(name(e.target), J.effects[e.effect]!));
          break;
        case 'resist':
          float(e.target, `${fxIcon('stunGuard')} ${B.resisted}`, 'shield');
          pushLog(B.logResist(name(e.target)));
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
        case 'down': {
          card(e.target)?.classList.add('down');
          card(e.target)?.querySelector('.jf-clones')?.replaceChildren();
          setHp(e.target, 0);
          pushLog(B.logDown(name(e.target)));
          // Protagonista caído com suportes de pé: a luta segue e o jogador precisa saber por quê.
          const t = fighter(next, e.target);
          // Olha quem está de pé neste ponto da animação: `next` já é o fim dos turnos, que sem o jogador pode ser a derrota.
          const backup = next.fighters.some((f) => f.side === 'ally' && f.uid !== e.target && (shown.get(f.uid)?.hp ?? 0) > 0);
          if (t.protagonist && !soloFight && backup) {
            say(B.heroDown(name(e.target)), 'var(--accent-deep)');
            wait = host.instant() ? 200 : 900;
          }
          break;
        }
        case 'survive':
          say(B.survive(name(e.target)), 'var(--jin)');
          setHp(e.target, 1);
          break;
        case 'revive':
          card(e.target)?.classList.remove('down');
          setHp(e.target, e.hp);
          float(e.target, B.revived(''), 'heal');
          pushLog(B.logRevive(name(e.target)));
          if (fighter(next, e.target).protagonist) {
            say(e.pill ? B.heroPill(name(e.target)) : B.heroUp(name(e.target), name(e.uid)), 'var(--good)');
            wait = host.instant() ? 200 : 800;
          }
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
          setChakra(e.uid, shown.get(e.uid)!.chakra + e.chakra);
          pushLog(B.logRest(name(e.uid), e.chakra));
          break;
        case 'chakraGain':
          float(e.uid, `+${e.amount}`, 'ck');
          setChakra(e.uid, shown.get(e.uid)!.chakra + e.amount);
          wait = 0;
          break;
        case 'enrage':
          say(B.enrage(name(e.uid)), 'var(--accent)');
          pushLog(B.enrage(name(e.uid)));
          break;
        case 'hpCost': {
          // Penalidade: a barra cai na hora (custo de técnica ou desgaste dos Portões).
          const gates = e.source === 'gates';
          float(e.uid, `${gates ? icon('gates') : ''}−${e.amount}`, 'cost');
          setHp(e.uid, shown.get(e.uid)!.hp - e.amount);
          pushLog(B.logHpCost(name(e.uid), e.amount, gates ? B.drainLabel : techName(e.source)));
          if (!gates) wait = host.instant() ? 70 : 300;
          break;
        }
        case 'gate':
          if (e.level > 0) {
            pose(e.uid, 'lunge-up');
            say(B.gateOpen(name(e.uid), gateName(e.level)), 'var(--accent-2)');
            float(e.uid, `${icon('gates')}${G.numeral[e.level - 1]}`, 'fx');
            pushLog(B.logGate(name(e.uid), gateName(e.level)));
            swish();
          } else if (e.exhausted) {
            say(B.gateTimeout(name(e.uid)), 'var(--muted)');
            pushLog(B.gateTimeout(name(e.uid)));
          } else {
            pushLog(B.logGateClose(name(e.uid)));
            wait = host.instant() ? 70 : 200;
          }
          break;
        case 'gateUpkeep':
          pushLog(B.logGateUpkeep(name(e.uid), e.amount));
          break;
        case 'boost':
          float(e.uid, icon('sparkle'), 'fx');
          pushLog(B.logBoost(name(e.uid), techName(e.techId), e.turns));
          wait = host.instant() ? 70 : 250;
          break;
        // Roteiro (docs/jornada/roteiro.md): falas, formas e troca de lutadores.
        case 'say': {
          const who = e.uid ? name(e.uid) : esc(J.names[e.who] ?? e.who);
          const line = J.script[e.line] ?? e.line;
          // O narrador fala sem nome.
          const text = e.who === 'narrator' ? line : B.line(who, line);
          say(text, 'var(--ink)');
          pushLog(text);
          wait = host.instant() ? 300 : 1400;
          break;
        }
        case 'form': {
          const f = fighter(next, e.uid);
          const el = card(e.uid);
          if (el) el.outerHTML = fighterCard({ ...f, hp: shown.get(e.uid)?.hp ?? f.hp, chakra: shown.get(e.uid)?.chakra ?? f.chakra }, data);
          shown.set(e.uid, { hp: shown.get(e.uid)?.hp ?? f.hp, max: f.maxHp, chakra: shown.get(e.uid)?.chakra ?? f.chakra, maxChakra: f.maxChakra });
          // Entrada visível: o card pisca na cor da forma enquanto o retrato troca.
          card(e.uid)?.classList.add('form-in');
          say(B.form(name(e.uid), J.forms[e.form] ?? e.form), 'var(--accent)');
          pushLog(B.form(name(e.uid), J.forms[e.form] ?? e.form));
          wait = host.instant() ? 300 : 1100;
          break;
        }
        case 'teach':
          float(e.uid, icon('sparkle'), 'fx');
          say(B.teach(name(e.uid), techName(e.techId)), 'var(--accent-2)');
          pushLog(B.teach(name(e.uid), techName(e.techId)));
          wait = host.instant() ? 300 : 1100;
          break;
        case 'enter':
        case 'leave': {
          // Quem entra ou sai muda a fileira: redesenha e devolve as barras ao ponto da animação.
          render(next);
          for (const f of next.fighters) if (!shown.has(f.uid)) shown.set(f.uid, { hp: f.hp, max: f.maxHp, chakra: f.chakra, maxChakra: f.maxChakra });
          for (const [uid, v] of shown) {
            setHp(uid, v.hp);
            setChakra(uid, v.chakra);
          }
          const msg = e.type === 'enter' ? B.enter(name(e.uid)) : B.leave(name(e.uid));
          say(msg, 'var(--accent-2)');
          pushLog(msg);
          wait = host.instant() ? 300 : 1000;
          break;
        }
        case 'roll':
          say(B.roll(name(e.uid), techName(e.variant)), 'var(--accent-2)');
          pushLog(B.roll(name(e.uid), techName(e.variant)));
          break;
        case 'formEnd': {
          const f = fighter(next, e.uid);
          const el = card(e.uid);
          // Sai só esta forma: o card fica com a que sobrou na pilha (a determinação continua depois da Kyuubi).
          if (el) el.outerHTML = fighterCard({ ...f, hp: shown.get(e.uid)?.hp ?? f.hp, chakra: shown.get(e.uid)?.chakra ?? f.chakra }, data);
          card(e.uid)?.classList.add('form-out');
          say(B.formEnd(name(e.uid), J.forms[e.form] ?? e.form), 'var(--ink)');
          pushLog(B.formEnd(name(e.uid), J.forms[e.form] ?? e.form));
          wait = host.instant() ? 300 : 900;
          break;
        }
        case 'endure':
          setHp(e.target, 1);
          say(B.endure(name(e.target), techName(e.technique)), 'var(--jin)');
          pushLog(B.endure(name(e.target), techName(e.technique)));
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

  /**
   * Menu do turno do protagonista. Itens, ativas e Portões são aplicados aqui (não gastam o turno). Devolve null se a
   * luta acabou no meio do turno.
   */
  async function playerTurn(): Promise<JAction | 'abandon' | null> {
    for (;;) {
      if (!awaitingPlayer(state)) return null;
      render(state);
      const me = current(state)!;
      const techs = me.techniques.map((id) => data.techniques[id]!).filter(Boolean);
      // Com alguém caído, levantar vem primeiro: a ação de qualquer um, a técnica de quem tem e a pílula, num bloco só.
      const fallen = canRaise(state, me);
      const raiseTechs = fallen.length ? techs.filter((t) => !t.active && t.target === 'downedAlly') : [];
      const moves = techs.filter((t) => !t.active && !raiseTechs.includes(t));
      const actives = techs.filter((t) => t.active);
      const pill = fallen.length > 0 && state.pills > 0 && !state.itemUsed;
      const raisePct = Math.round(data.j.combat.raiseHpPct * 100);
      const raiseBlock = fallen.length
        ? `<h4 class="act-title">${B.groups.raise}</h4><div class="jb-extra jb-raise">
          <button class="btn small primary jx" data-act="raise" ${tip(B.raise, B.raiseDesc(raisePct))}>${icon('heart')} ${B.raise} · ${raisePct}%</button>
          ${raiseTechs.map((t) => techButton(state, me, t)).join('')}
          ${pill ? `<button class="btn small jx" data-act="pill" ${tip(J.items.reviveKit!.name, B.pillDesc(Math.round(data.j.combat.reviveHpPct * 100)))}>${icon('pill')} ${J.items.reviveKit!.name}</button>` : ''}
        </div>`
        : '';
      // A pílula usada sozinha só sai da bolsa no fim da luta: aqui vale a contagem da luta.
      const items = CONSUMABLES.filter((id) => (id === 'reviveKit' ? state.pills : run.bag[id]) > 0 && itemTargets(state, id).length > 0);
      menu.innerHTML = `<p class="jb-prompt">${B.yourTurn}</p>
        ${raiseBlock}
        <h4 class="act-title">${B.groups.techniques}</h4>
        <div class="jb-moves${moves.length > 4 ? ' many' : ''}">${moves.map((t) => techButton(state, me, t)).join('')}</div>
        ${actives.length ? `<h4 class="act-title">${B.groups.actives}</h4><div class="jb-extra">${actives.map((t) => (t.gates ? gatesButton(state, me, t) : techButton(state, me, t))).join('')}</div>` : ''}
        <h4 class="act-title">${B.groups.actions}</h4>
        <div class="jb-extra">
          <button class="btn small jx" data-act="guard" ${tip(B.guard, B.guardDesc)}>${icon('stance')} ${B.guard}</button>
          <button class="btn small jx" data-act="rest" ${tip(B.rest, B.restDesc)}>${icon('rest')} ${B.rest}</button>
          <button class="btn small jx" data-act="bag" ${tip(B.bag, B.bagDesc)} ${items.length && !state.itemUsed ? '' : 'aria-disabled="true"'}>${icon('kit')} ${B.bag}</button>
        </div>
        <button class="btn small jgiveup" data-act="abandon" ${tip(B.giveUp, B.giveUpDesc)}>${icon('warning')} ${B.giveUp}</button>`;
      const pick = await new Promise<HTMLElement>((resolve) => {
        const onClick = (ev: Event) => {
          const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tech],[data-act],[data-gates]');
          if (!b || !menu.contains(b) || b.getAttribute('aria-disabled') === 'true') return;
          menu.removeEventListener('click', onClick);
          resolve(b);
        };
        menu.addEventListener('click', onClick);
      });
      if (pick.dataset.act === 'guard') return { kind: 'guard' };
      if (pick.dataset.act === 'rest') return { kind: 'rest' };
      if (pick.dataset.act === 'raise') {
        const uid = await pickTarget(fallen, B.pickDowned);
        if (!uid) continue;
        return { kind: 'raise', target: uid };
      }
      if (pick.dataset.act === 'pill') {
        const uid = await pickTarget(itemTargets(state, 'reviveKit'), B.pickDowned);
        if (!uid) continue;
        const before = state;
        state = useItem(state, 'reviveKit', uid, data);
        run = spendItem(run, 'reviveKit');
        await animate(before, state);
        continue;
      }
      if (pick.dataset.act === 'abandon') {
        if (window.confirm(J.ui.abandonConfirm)) return 'abandon';
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
      if (pick.hasAttribute('data-gates')) {
        const level = await pickGate(me);
        if (level === null) continue;
        const before = state;
        state = setGate(state, level, data, rng);
        await animate(before, state);
        continue;
      }
      const tech = data.techniques[pick.dataset.tech!]!;
      const uid =
        tech.target === 'allEnemies' || tech.target === 'self'
          ? me.uid
          : await pickTarget(validTargets(state, me, tech), tech.target === 'downedAlly' ? B.pickDowned : tech.target === 'ally' ? B.pickAlly : B.pickTarget);
      if (!uid) continue;
      // Ativa: aplica e o turno continua.
      if (tech.active) {
        const before = state;
        state = useActive(state, tech.id, uid, data, rng);
        await animate(before, state);
        continue;
      }
      return { kind: 'tech', techId: tech.id, target: uid };
    }
  }

  /** Escolha do portão: com uma opção só, aplica direto. */
  function pickGate(me: Fighter): Promise<number | null> {
    const choices = gateChoices(state, me, data);
    // Só um portão para abrir: abre direto. Fechar sempre passa pelo submenu (evita fechar sem querer).
    if (choices.length === 1 && choices[0]! > 0) return Promise.resolve(choices[0]!);
    const option = (level: number) =>
      level === 0
        ? `<button class="btn jmove" data-level="0" style="--c:var(--line)"${tip(G.close, G.closeTip)}><span class="jmove-ico">${icon('close')}</span><span class="jmove-txt"><b>${G.close}</b></span></button>`
        : `<button class="btn jmove" data-level="${level}" style="--c:var(--accent)"${gateOptionTip(me, level)}><span class="jmove-ico"><b class="gate-n">${G.numeral[level - 1]}</b></span>
            <span class="jmove-txt"><b>${gateName(level)}</b><small>×${fmtMult(gateTotals(level, data).damageMult)}${gateOpenCost(me, level, data) ? ` · <span class="short">${G.openCost(gateOpenCost(me, level, data))}</span>` : ''}</small></span></button>`;
    menu.innerHTML = `<p class="jb-prompt">${techName('jGates')}</p><div class="jb-moves">${choices.map(option).join('')}</div><button class="btn small" data-cancel>${B.cancel}</button>`;
    return new Promise((resolve) => {
      const onClick = (ev: Event) => {
        const t = ev.target as HTMLElement;
        const b = t.closest<HTMLElement>('[data-level]');
        if (!b && !t.closest('[data-cancel]')) return;
        menu.removeEventListener('click', onClick);
        resolve(b ? Number(b.dataset.level) : null);
      };
      menu.addEventListener('click', onClick);
    });
  }

  function pickItem(items: ConsumableId[]): Promise<ConsumableId | null> {
    menu.innerHTML = `<p class="jb-prompt">${B.bag}</p><div class="jb-moves">${items
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
  const opening = state;
  state = advance(opening, data, rng);
  await animate(opening, state);
  while (state.status === 'ongoing') {
    if (!awaitingPlayer(state)) break;
    const action = await playerTurn();
    if (action === 'abandon') {
      menu.innerHTML = '';
      forgetLiveBattle();
      return { battle: state, run, abandoned: true };
    }
    if (!action) break;
    menu.innerHTML = '';
    const before = state;
    state = playerAct(state, action, data, rng);
    await animate(before, state);
  }
  render(state);
  const won = state.status === 'won';
  // Derrota inevitável (teste do sino): não é derrota, é lição. O kanji 修 (aprender, treinar) já está no recorte.
  const stopNow = currentStop(run0, data);
  const lesson = !won && Boolean(stopNow && 'inevitableLoss' in stopNow && stopNow.inevitableLoss);
  host.mood(won ? 'good' : lesson ? 'neutral' : 'bad');
  if (lesson) say(`<b class="kanji end-kanji" aria-hidden="true">修</b>${B.lesson}`, 'var(--gold)');
  else say(`<b class="kanji end-kanji" aria-hidden="true">${won ? '勝' : '敗'}</b>${won ? B.won : B.lost}`, won ? 'var(--gold)' : 'var(--accent-deep)');
  if (won) void flashRelics(root, winRelics(run0), host.instant());
  menu.innerHTML = '';
  await sleep(host.instant() ? 200 : 900);
  forgetLiveBattle();
  return { battle: state, run };
}
