// Textos das dicas: monta a descrição de técnicas, elementos, condições e passivas a partir dos dados.
import { playerTechnique, type BattleState } from '../src/core/combat';
import { techniqueLevel, techniqueSlot, type PlayerState } from '../src/core/player';
import type { Element, TechniqueDef, VillainDef, VillainTechnique } from '../src/core/types';
import { BEATS } from '../src/data/elements';
import { gameData as data } from '../src/data/index';
import { ptBR as S } from '../src/data/strings/ptBR';
import { icon } from './art';
import { tip } from './tooltip';

const T = S.tips;
const B = data.balance;
const pct = (x: number) => Math.round(x * 100);
const roman = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] ?? String(n);
const BEATEN_BY = Object.fromEntries(Object.entries(BEATS).map(([a, b]) => [b, a])) as Record<Element, Element>;

/** Cores dos elementos (fatias, chips e células de técnica). */
export const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#e8452c',
  wind: '#3fae6a',
  lightning: '#e6b91e',
  earth: '#a5723f',
  water: '#2f80dc',
};

export const ELEMENT_ICON: Record<Element, string> = {
  fire: 'fire',
  wind: 'wind',
  lightning: 'lightning',
  earth: 'earth',
  water: 'water',
};

/** Corpo de dica com uma linha por parte (partes vazias ou falsas somem). */
export const lines = (parts: unknown[]) =>
  parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .map((p) => `<span class="tip-line">${p}</span>`)
    .join('');

export function elementTip(el: Element | null): string {
  if (!el) return tip(S.ui.noAffinity, T.noElement);
  return tip(S.elements[el], T.element(S.elements[el], S.elements[BEATS[el]], S.elements[BEATEN_BY[el]], T.critEffect[el]!));
}

/** Chip de elemento com ícone e a dica do ciclo. `withTip` = false dentro de botões. */
export function elementChip(el: Element | null, withTip = true): string {
  if (!el) return '';
  return `<span class="chip el el-${el}" style="--c:${ELEMENT_COLORS[el]}"${withTip ? elementTip(el) : ''}>${icon(ELEMENT_ICON[el])}${S.elements[el]}</span>`;
}

function kindLine(type: string, slot: string, element: Element | null): string {
  const name = T.types[slot]?.name ?? T.types[type]?.name ?? type;
  return T.techKind(name, element ? S.elements[element] : '');
}

function elementLine(el: Element | null, deals: boolean): string | null {
  if (!el || !deals) return null;
  return `${S.elements[el]}: ${T.critEffect[el]} no crítico; vence ${S.elements[BEATS[el]]}.`;
}

/** Ficha da técnica do jogador, com nível, upgrades e ferramenta ninja aplicados. */
export function playerTechTip(p: PlayerState, id: string): string {
  const t: TechniqueDef & { element: Element | null } = playerTechnique(p, id, data);
  const slot = techniqueSlot(t);
  const deals = t.baseDamage > 0;
  const body = lines([
    `<i>${kindLine(t.type, slot, t.element)} · ${T.level(roman(techniqueLevel(p, id, data)))}</i>`,
    deals && T.damage(t.baseDamage, t.hits ?? 1),
    (deals || t.mental) && !t.mentalStat && t.type !== 'genjutsu' && T.accuracy(pct(t.accuracy ?? B.hit.defaultAccuracy)),
    t.mentalStat && T.accuracy(pct(t.accuracy ?? B.hit.defaultAccuracy)),
    t.critBonus && T.critBonus,
    t.penetration && T.penetration,
    t.onHit && T.onHit(T.onHitEffect[t.onHit.effect]!),
    t.priority && T.priority,
    t.blade && T.blade[t.blade],
    t.type === 'genjutsu' && deals && T.illusion,
    t.mental && T.mental(T.mentalNames[t.mental]!, t.mentalStrength ?? 1),
    t.mentalStat && T.shadow,
    t.barrier !== undefined && T.barrier(t.barrier),
    t.reflectPct && T.reflect,
    t.burnOnBreakAttempt && T.burnOnBreak,
    t.multiHitBonus && T.multiHitBonus,
    t.clashBonus && T.clashBonus,
    t.state && S.ui.armorHint,
    slot === 'medical' && t.healPct !== undefined && T.heal,
    t.requiresDojutsu && T.requires(S.dojutsu[t.requiresDojutsu]!.name),
    t.chakraDrain && T.drain(t.chakraDrain),
    elementLine(t.element, deals),
    T.cost(t.chakraCost),
  ]);
  return tip(S.techniques[id] ?? id, body);
}

/** Ficha da técnica do vilão (elemento: o da técnica ou o do vilão). */
export function villainTechElement(def: VillainDef, t: VillainTechnique): Element | null {
  return t.type === 'taijutsu' ? null : t.element === undefined ? def.element : t.element;
}

export function villainTechTip(def: VillainDef, t: VillainTechnique): string {
  const el = villainTechElement(def, t);
  const deals = t.baseDamage > 0 && t.type !== 'genjutsu' && t.healPct === undefined && t.barrier === undefined;
  const charged = def.behavior?.charged === t.id;
  const body = lines([
    `<i>${kindLine(t.type, t.healPct !== undefined ? 'medical' : t.type, el)}</i>`,
    deals && T.damage(t.baseDamage, t.hits ?? 1),
    deals && T.accuracy(pct(t.accuracy ?? B.hit.defaultAccuracy)),
    t.type === 'genjutsu' && T.mental(T.mentalNames.prison!, t.mentalStrength ?? 1),
    t.blade && T.blade[t.blade],
    t.barrier !== undefined && T.barrier(t.barrier),
    t.healPct !== undefined && T.villainHeal,
    t.useBelowHpPct !== undefined && T.useBelow,
    charged && T.charged,
    elementLine(el, deals),
    T.cost(t.chakraCost),
  ]);
  return tip(S.techniques[t.id] ?? t.id, body);
}

/** Ícone que representa a técnica: elemento, ou o tipo (taijutsu, genjutsu, médico, barreira). */
export function techIconName(type: string, element: Element | null, extra: { barrier?: boolean; medical?: boolean; blade?: boolean } = {}): string {
  if (extra.medical) return 'medical';
  if (extra.barrier) return 'barrier';
  if (element) return ELEMENT_ICON[element];
  if (extra.blade) return 'blade';
  return type;
}

// ---------------------------------------------------------------------------
// Condições de batalha

export interface Condition {
  icon: string;
  label: string;
  /** 'bad' / 'good' do ponto de vista do lado afetado; '' neutro. */
  tone: 'good' | 'bad' | '' | 'jin';
  name: string;
  desc: string;
}

export function conditionChip(c: Condition): string {
  return `<span class="chip cond ${c.tone}"${tip(c.name, c.desc)}>${icon(c.icon)}${c.label}</span>`;
}

type Fx = BattleState['playerFx'] | BattleState['villain']['fx'];

/** Condições comuns aos dois lados. `bad` = tom para quem sofre o efeito. */
export function fxConditions(fx: Fx, bad: 'good' | 'bad'): Condition[] {
  const St = T.status;
  const good = bad === 'bad' ? 'good' : 'bad';
  const out: Condition[] = [];
  const add = (iconName: string, label: string, tone: Condition['tone'], t: { name: string; desc: string }) =>
    out.push({ icon: iconName, label, tone, ...t });
  if (fx.debilitated) add('prison', S.ui.debilitated, bad, St.prison);
  if (fx.paralyzed > 0) add('lightning', S.ui.paralyzed, bad, St.paralyzed);
  if (fx.possessed) add('genjutsu', S.ui.possessed, bad, St.possessed);
  if (fx.asleep) add('sleep', S.ui.asleep, bad, St.asleep);
  if (fx.stunned > 0) add('stun', S.ui.stunned, bad, St.stunned);
  if (fx.feared) add('fear', S.ui.feared, bad, St.feared);
  if (fx.confused) add('confusion', S.ui.confused, bad, St.confused);
  if (fx.tormented) add('torment', S.ui.tormented, bad, St.tormented);
  if (fx.debilitateImmunity > 0) add('immune', S.ui.immune, '', St.immune);
  else if (fx.tenacity > 0) add('immune', S.ui.tenacity, '', St.tenacity);
  if (fx.shield) {
    const el = fx.shield.element ? S.elements[fx.shield.element] : '';
    add('barrier', S.ui.shieldOn(fx.shield.points, fx.shield.turns), good, St.shield(el));
  }
  if (fx.burn > 0) add('fire', S.ui.burning(fx.burn), bad, St.burning);
  if (fx.poison) add('poison', S.ui.poisoned, bad, St.poisoned);
  if (fx.bleeding) add('bleed', S.ui.bleeding, bad, St.bleeding);
  if (fx.cloakTurns > 0) add('cloak', S.ui.cloakOn(fx.cloakTurns), 'jin', St.cloak);
  if (fx.guaranteedCrit) add('crit', S.ui.guaranteedCrit, good, St.guaranteedCrit);
  if (fx.owesAction) add('owes', S.ui.owesAction, bad, St.owesAction);
  return out;
}
