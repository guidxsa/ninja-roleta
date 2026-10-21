import { clamp, type Rng } from './rng';
import { spin, type Slice } from './roulette';

export type HitOutcome = 'miss' | 'hit' | 'crit';

export interface HitConfig {
  base: number;
  perSpeedPoint: number;
  min: number;
  max: number;
}

export interface GenjutsuHitConfig {
  base: number;
  perPoint: number;
  min: number;
  max: number;
}

export function hitChance(attackerSpeed: number, defenderSpeed: number, cfg: HitConfig): number {
  return clamp(cfg.base + (attackerSpeed - defenderSpeed) * cfg.perSpeedPoint, cfg.min, cfg.max);
}

export function genjutsuHitChance(
  attackerGenjutsu: number,
  defenderGenjutsu: number,
  cfg: GenjutsuHitConfig,
): number {
  return clamp(cfg.base + (attackerGenjutsu - defenderGenjutsu) * cfg.perPoint, cfg.min, cfg.max);
}

/** chance_crítico = base (5%) + diferencial_de_dano_% */
export function critChance(critBonus: number, baseChance: number): number {
  return clamp(baseChance + critBonus, 0, 1);
}

/**
 * Fatias do dado de acerto. O crítico é o topo do dado, portanto fica contido
 * na faixa de acerto: nunca passa da chance de acertar.
 */
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
