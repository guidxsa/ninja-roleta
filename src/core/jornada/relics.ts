// Relíquias (docs/jornada/reliquias.md): passivas para a run toda ou recursos, com classificação.
import type { Rng } from '../rng';
import type { ConsumableId, FighterMods } from './types';

/**
 * `starter`: começa com o personagem e nunca sai em sorteio. `boss`: escolha depois do chefe (e as evoluções).
 * `shop`: só no mercador. `event`: só em eventos. `special`: só quando não sobra nada para sortear.
 */
export type RelicTier = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'shop' | 'event' | 'special';

export interface RelicDef {
  id: string;
  tier: RelicTier;
  /** Inicial: personagens que começam com ela. */
  starterFor?: string[];
  /** Evolução: substitui esta relíquia inicial. Só aparece na escolha depois do chefe. */
  evolves?: string;
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
  /** XP ganho × este valor. */
  xpMult?: number;
  /** Desconto no mercador (fração; soma com os outros, com teto em `balance`). */
  shopDiscount?: number;
  /** Cura extra da equipe depois de cada vitória (fração do HP máximo). */
  afterWinHealPct?: number;
  /** Dano em todos os inimigos no começo de cada luta. */
  openingDamage?: number;
  /** Espaços a mais na bolsa. */
  bagBonus?: number;
  /** Descanso cura esta fração a mais. */
  restHealBonus?: number;
  /** Recurso ao pegar: consumíveis, Vontades do Fogo, ryō ou pontos de talento. */
  grant?: { items?: Partial<Record<ConsumableId, number>>; willOfFire?: number; ryo?: number; talentPoints?: number };
}

export type Weights = Partial<Record<RelicTier, number>>;

/** Sorteia uma relíquia que a run ainda não tem, pela classificação (sem roleta na tela). Evoluções ficam de fora. */
export function rollRelic(relics: readonly RelicDef[], owned: readonly string[], weights: Weights, rng: Rng, exclude: readonly string[] = []): string | null {
  const pool = relics.filter((r) => r.tier !== 'starter' && !r.evolves && !owned.includes(r.id) && !exclude.includes(r.id));
  const tiers = (Object.keys(weights) as RelicTier[]).filter((t) => (weights[t] ?? 0) > 0 && pool.some((r) => r.tier === t));
  if (!tiers.length) return null;
  const total = tiers.reduce((a, t) => a + weights[t]!, 0);
  let x = rng() * total;
  let tier = tiers[tiers.length - 1]!;
  for (const t of tiers) {
    if ((x -= weights[t]!) < 0) {
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

/** Relíquia de drop (elite, tesouro, evento): sem nada para sortear, cai na especial que a run ainda não tem. */
export function dropRelic(relics: readonly RelicDef[], owned: readonly string[], weights: Weights, rng: Rng): string | null {
  return rollRelic(relics, owned, weights, rng) ?? relics.find((r) => r.tier === 'special' && !owned.includes(r.id))?.id ?? null;
}

/** Evolução disponível: a da relíquia inicial que a run ainda tem. */
export function evolutionFor(relics: readonly RelicDef[], owned: readonly string[]): string | null {
  return relics.find((r) => r.evolves && owned.includes(r.evolves))?.id ?? null;
}

/** Escolha depois do chefe: relíquias de chefe; com a inicial ainda não evoluída, uma das vagas pode ser a evolução. */
export function bossChoices(relics: readonly RelicDef[], owned: readonly string[], n: number, evolveChance: number, rng: Rng): string[] {
  const out = rollRelics(relics, owned, { boss: 1 }, n, rng);
  const evo = evolutionFor(relics, owned);
  if (evo && rng() < evolveChance) out[Math.min(out.length, n - 1)] = evo;
  return out;
}
