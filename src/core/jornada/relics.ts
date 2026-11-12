// Relíquias (docs/jornada/reliquias.md): passivas para a run toda ou recursos, com classificação.
import type { Rng } from '../rng';
import type { ConsumableId, FighterMods } from './types';

/**
 * `starter`: começa com o personagem e nunca sai em sorteio. `boss`: escolha depois do chefe (e as evoluções).
 * `shop`: só no mercador. `event`: só em eventos. `special`: só quando não sobra nada para sortear.
 */
export type RelicTier = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'shop' | 'event' | 'special';

/** Modo de jogo em que a relíquia sai (catálogo único, docs/jornada/reliquias.md#modos). */
export type RelicMode = 'jornada' | 'roleta';

/**
 * Efeito da relíquia no Roleta enxuto (docs/roleta/run.md#relíquias). Números próprios: o Roleta tem menos lutas,
 * um lutador só e dano menor. Status entram na ficha ao ganhar; o resto vale nas lutas.
 */
export interface RoletaRelicEffect {
  damageMult?: number;
  typeDamageMult?: Partial<Record<'taijutsu' | 'ninjutsu' | 'genjutsu', number>>;
  /** Dano base a mais em todas as técnicas. */
  flatDamage?: number;
  critBonus?: number;
  accuracyBonus?: number;
  /** Esquiva a mais (soma na chance de o vilão errar). */
  dodgeBonus?: number;
  /** Cura no começo de cada rodada (fração do HP máximo). */
  regenPct?: number;
  startShieldPct?: number;
  startChakraPct?: number;
  /** Dano no vilão no começo da luta. */
  openingDamage?: number;
  /** Começa cada luta com HP e chakra acima do máximo (fração do máximo; o excedente só se gasta, não volta). */
  startOverPct?: number;
  /** Técnicas custam isto de chakra a menos (nunca abaixo de 0). */
  chakraDiscount?: number;
  /** Abaixo de 50% do HP, dano × isto. */
  lowHpDamageMult?: number;
  /** Uma vez por luta, ao cair, fica com 1 de HP. */
  surviveOnce?: boolean;
  /** XP das lutas × isto. */
  xpMult?: number;
  stats?: { hp?: number; chakra?: number; speed?: number; physical?: number; mental?: number };
  grant?: { revives?: number };
  /** Contrato de invocação: o animal passa a acompanhar (o evento Invocação sobe o nível). */
  summon?: 'toad' | 'snake' | 'slug';
  /** Pesos de treino: a mecânica de equipar e tirar (−2 de speed, +1 de taijutsu por vitória; tirar dá +3). */
  weights?: boolean;
}

export interface RelicDef {
  id: string;
  tier: RelicTier;
  /** Modos em que sai. Sem o campo: só a Jornada. */
  modes?: RelicMode[];
  /** Efeito no Roleta (quando sai lá); os campos abaixo são os da Jornada. */
  roleta?: RoletaRelicEffect;
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
  /** Cura extra de cada membro da equipe depois de cada vitória (valor fixo). */
  afterWin?: { hp: number; chakra: number };
  /** Dano em todos os inimigos no começo de cada luta. */
  openingDamage?: number;
  /** Espaços a mais na bolsa. */
  bagBonus?: number;
  /** Descanso cura este valor a mais. */
  restBonus?: { hp: number; chakra: number };
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

/** A relíquia sai neste modo. */
export const relicInMode = (r: RelicDef, mode: RelicMode) => (r.modes ?? ['jornada']).includes(mode);

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
