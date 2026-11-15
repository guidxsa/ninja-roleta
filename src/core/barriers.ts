// Barreiras elementais (docs/base/fundamentos.md#escudos), a regra única do Roleta e da Jornada (v0.77.0).
// Barreira é uma ação de turno que ergue um escudo com elemento por `balance.barrier.turns` turnos de quem a ergueu.
// O elemento só pesa aqui: o golpe de elemento contra o escudo de elemento multiplica o dano NO ESCUDO (vantagem ×1,5,
// desvantagem ×0,75, raio contra terra ×2); no HP, nunca. Taijutsu é neutro; genjutsu passa direto. Funções puras.
import type { ElementConfig } from './elements';
import { natureMultiplier, type Nature } from './nature';
import type { AttackType, Element, KekkeiGenkaiDef } from './types';

/** Como a técnica ergue a barreira: fração do HP máximo de quem ergue, e as especiais. */
export interface BarrierSpec {
  /** Pontos = HP máximo × pct (arredondado para baixo). */
  pct: number;
  /** Escudo de Vento: técnicas de vários golpes causam esta fração a menos no escudo. */
  multiHitResist?: number;
  /** Muralha de Chamas: chance de queimar quem bate nela com taijutsu. */
  burnOnTouch?: number;
}

export interface BarrierState {
  points: number;
  max: number;
  nature: Nature | null;
  /** Turnos de quem ergueu que ainda restam. */
  turns: number;
  /** Técnica que ergueu (para a interface). */
  techId: string;
  multiHitResist?: number;
  burnOnTouch?: number;
}

export interface BarrierContext {
  kekkeiGenkai: readonly KekkeiGenkaiDef[];
  beats: Record<Element, Element>;
  elements: ElementConfig;
}

export function raiseBarrier(techId: string, spec: BarrierSpec | { points: number }, maxHp: number, nature: Nature | null, turns: number): BarrierState {
  const points = 'points' in spec ? spec.points : Math.max(1, Math.floor(maxHp * spec.pct));
  const extra: Partial<BarrierSpec> = 'pct' in spec ? spec : {};
  return {
    points,
    max: points,
    nature,
    turns,
    techId,
    ...(extra.multiHitResist ? { multiHitResist: extra.multiHitResist } : {}),
    ...(extra.burnOnTouch ? { burnOnTouch: extra.burnOnTouch } : {}),
  };
}

/** O golpe que bate na barreira: tipo, natureza do golpe (null = neutro) e quantos golpes tem a técnica. */
export interface BarrierAttack {
  type: AttackType;
  nature: Nature | null;
  hits: number;
}

export interface BarrierHit {
  /** Pontos que o escudo perdeu. */
  absorbed: number;
  /** Dano que passa para o HP. */
  passes: number;
  /** Encontro de elementos no escudo (1 = neutro). */
  mult: number;
  broken: boolean;
  /** Parede d'Água que absorveu fogo: apaga a queimadura de quem ergueu. */
  douse: boolean;
  /** Muralha de Chamas tocada por taijutsu: quem chama rola `burnOnTouch` para queimar o atacante. */
  touched: boolean;
}

/** Multiplicador do golpe no escudo (para a interface mostrar e para o golpe). */
export function barrierMult(b: BarrierState, atk: BarrierAttack, ctx: BarrierContext): number {
  if (atk.type === 'genjutsu') return 1;
  const nature = atk.type === 'taijutsu' ? null : atk.nature;
  let mult = natureMultiplier(nature, b.nature, ctx.kekkeiGenkai, ctx.beats, ctx.elements, true);
  if (b.multiHitResist && atk.hits > 1) mult *= 1 - b.multiHitResist;
  return mult;
}

/**
 * A barreira recebe um golpe (muda `b.points`). Dano no escudo = dano × encontro; o que o escudo não segura volta à
 * escala do HP (÷ encontro). Genjutsu não toca o escudo.
 */
export function absorbIntoBarrier(b: BarrierState, damage: number, atk: BarrierAttack, ctx: BarrierContext): BarrierHit {
  if (damage <= 0 || b.points <= 0 || atk.type === 'genjutsu') return { absorbed: 0, passes: damage, mult: 1, broken: false, douse: false, touched: false };
  const mult = barrierMult(b, atk, ctx);
  const load = damage * mult;
  const absorbed = Math.min(b.points, Math.ceil(load));
  b.points -= absorbed;
  const passes = Math.max(0, Math.floor((load - absorbed) / mult));
  return {
    absorbed,
    passes,
    mult,
    broken: b.points <= 0,
    douse: b.nature === 'water' && atk.type !== 'taijutsu' && atk.nature === 'fire',
    touched: Boolean(b.burnOnTouch) && atk.type === 'taijutsu',
  };
}
