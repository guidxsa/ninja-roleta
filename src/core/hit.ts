import { clamp, type Rng } from './rng';
import { spin, type Slice } from './roulette';

export type HitOutcome = 'miss' | 'hit' | 'crit';

export interface HitConfig {
  defaultAccuracy: number;
  min: number;
  max: number;
}

export interface GenjutsuHitConfig {
  base: number;
  perPoint: number;
  min: number;
  max: number;
}

/** chance_acerto = clamp(precisão_da_técnica + bônus − penalidades, 5%, 100%). */
export function hitChance(accuracy: number | undefined, bonus: number, cfg: HitConfig): number {
  return clamp((accuracy ?? cfg.defaultAccuracy) + bonus, cfg.min, cfg.max);
}

export function genjutsuHitChance(
  attackerGenjutsu: number,
  defenderGenjutsu: number,
  cfg: GenjutsuHitConfig,
): number {
  return clamp(cfg.base + (attackerGenjutsu - defenderGenjutsu) * cfg.perPoint, cfg.min, cfg.max);
}

/** chance_crítico = min(50%, 5% + diferencial_de_dano_% + bônus da técnica, chance de acerto). */
export function critChance(critBonus: number, cfg: { baseChance: number; max: number }, chanceToHit = 1): number {
  return Math.min(clamp(cfg.baseChance + critBonus, 0, cfg.max), chanceToHit);
}

/** Três fatias: erro, acerto e crítico. O crítico fica contido na faixa de acerto. */
export function hitSlices(chanceToHit: number, chanceToCrit: number): Slice<HitOutcome>[] {
  const hit = clamp(chanceToHit, 0, 1);
  const crit = Math.min(clamp(chanceToCrit, 0, 1), hit);
  return [
    { label: 'miss', weight: 1 - hit, value: 'miss' },
    { label: 'hit', weight: hit - crit, value: 'hit' },
    { label: 'crit', weight: crit, value: 'crit' },
  ];
}

export function rollHit(chanceToHit: number, chanceToCrit: number, rng: Rng): HitOutcome {
  return spin(hitSlices(chanceToHit, chanceToCrit), rng).slice.value;
}
