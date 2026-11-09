// Portões (docs/base/fundamentos.md#portões): a regra única de custo, usada pelo Roleta e pela Jornada (v0.59.0).
// Abrir custa chakra; manter custa chakra a cada rodada, num valor que cresce rápido (não linear). Não há limite de
// rodadas: os Portões fecham sozinhos quando o ninja não consegue pagar a manutenção.

export interface GateCostRules {
  /** Manutenção da 1ª rodada mantida. */
  upkeepBase: number;
  /** Quanto a manutenção multiplica a cada rodada mantida. */
  upkeepGrowth: number;
}

/**
 * Manutenção da rodada `n` mantida (1 = a primeira depois da abertura): `ceil(base × crescimento^(n−1) × mult)`.
 * Com base 2 e crescimento 1,5: 2, 3, 5, 7, 11, 16... `mult` é o peso do nível (Jornada).
 */
export function gateUpkeep(n: number, rules: GateCostRules, mult = 1): number {
  return Math.ceil(rules.upkeepBase * rules.upkeepGrowth ** Math.max(0, n - 1) * mult - 1e-9);
}

/** Paga a manutenção da rodada `n`: o chakra que sobra, ou null se não dá (os Portões fecham). */
export function payGateUpkeep(chakra: number, n: number, rules: GateCostRules, mult = 1): { chakra: number; cost: number } | null {
  const cost = gateUpkeep(n, rules, mult);
  return chakra >= cost ? { chakra: chakra - cost, cost } : null;
}
