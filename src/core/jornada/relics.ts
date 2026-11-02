// Relíquias (docs/jornada/reliquias.md): passivas para a run toda ou recursos, com raridade.
import type { Rng } from '../rng';
import type { ConsumableId, FighterMods } from './types';

export type RelicTier = 'common' | 'rare' | 'legendary';

export interface RelicDef {
  id: string;
  tier: RelicTier;
  /** Bônus no protagonista. */
  mods?: Partial<FighterMods>;
  /** Bônus em toda a equipe (protagonista incluído). */
  teamMods?: Partial<FighterMods>;
  /** Status a mais no protagonista. */
  stats?: { hp?: number; chakra?: number; speed?: number };
  /** HP máximo a mais dos suportes (fração). */
  allyHpPct?: number;
  /** Ryō ganho × este valor. */
  ryoMult?: number;
  /** Cura extra da equipe depois de cada vitória (fração do HP máximo). */
  afterWinHealPct?: number;
  /** Dano em todos os inimigos no começo de cada luta. */
  openingDamage?: number;
  /** Recurso ao pegar: consumíveis ou Vontades do Fogo. */
  grant?: { items?: Partial<Record<ConsumableId, number>>; willOfFire?: number };
}

export type Weights = Record<RelicTier, number>;

/** Sorteia uma relíquia que a run ainda não tem, pela raridade (sem roleta na tela). */
export function rollRelic(relics: readonly RelicDef[], owned: readonly string[], weights: Weights, rng: Rng, exclude: readonly string[] = []): string | null {
  const pool = relics.filter((r) => !owned.includes(r.id) && !exclude.includes(r.id));
  if (!pool.length) return null;
  const tiers = (Object.keys(weights) as RelicTier[]).filter((t) => weights[t] > 0 && pool.some((r) => r.tier === t));
  const total = tiers.reduce((a, t) => a + weights[t], 0);
  let x = rng() * total;
  let tier = tiers[tiers.length - 1]!;
  for (const t of tiers) {
    if ((x -= weights[t]) < 0) {
      tier = t;
      break;
    }
  }
  const options = pool.filter((r) => r.tier === tier);
  return options[Math.floor(rng() * options.length)]!.id;
}

/** Várias relíquias diferentes (mercador, escolha do chefe). */
export function rollRelics(relics: readonly RelicDef[], owned: readonly string[], weights: Weights, n: number, rng: Rng): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = rollRelic(relics, owned, weights, rng, out);
    if (!id) break;
    out.push(id);
  }
  return out;
}
