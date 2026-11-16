// Portões (docs/base/fundamentos.md#portões): a regra única de custo, usada pelo Roleta e pela Jornada (v0.59.0).
// Abrir custa chakra; manter custa, a cada rodada, chakra num valor que cresce rápido (não linear) e, desde a v0.79.0,
// também HP (custo misto). Não há limite de rodadas: os Portões fecham sozinhos quando o ninja não consegue pagar.

export interface GateCostRules {
  /** Manutenção da 1ª rodada mantida (o valor cheio, antes da parte em chakra). */
  upkeepBase: number;
  /** Quanto a manutenção multiplica a cada rodada mantida. */
  upkeepGrowth: number;
  /** Fração da manutenção paga em chakra (o resto do peso vai para o HP; v0.79.0). */
  chakraShare: number;
  /** HP pago por rodada mantida: esta fração do HP máximo por nível do portão aberto (v0.79.0). */
  hpPctPerLevel: number;
}

/**
 * Manutenção em chakra da rodada `n` mantida (1 = a primeira depois da abertura):
 * `ceil(base × crescimento^(n−1) × mult × parte em chakra)`. Com base 2, crescimento 1,5 e metade em chakra:
 * 1, 2, 3, 4, 6, 8... `mult` é o peso do nível (Jornada).
 */
export function gateUpkeep(n: number, rules: GateCostRules, mult = 1): number {
  return Math.ceil(rules.upkeepBase * rules.upkeepGrowth ** Math.max(0, n - 1) * mult * rules.chakraShare - 1e-9);
}

/** Manutenção em HP por rodada no portão `level` (pelo menos 1). */
export function gateHpUpkeep(level: number, maxHp: number, rules: GateCostRules): number {
  return Math.max(1, Math.floor(maxHp * rules.hpPctPerLevel * level));
}

/**
 * Paga a manutenção da rodada `n` no portão `level`: o chakra e o HP que sobram, ou null se não dá (os Portões fecham).
 * O HP nunca chega a 0 por causa dos Portões: sem HP para pagar e ficar com 1, fecham.
 */
export function payGateUpkeep(
  pay: { chakra: number; hp: number; maxHp: number },
  n: number,
  level: number,
  rules: GateCostRules,
  mult = 1,
): { chakra: number; hp: number; cost: number; hpCost: number } | null {
  const cost = gateUpkeep(n, rules, mult);
  const hpCost = gateHpUpkeep(level, pay.maxHp, rules);
  if (pay.chakra < cost || pay.hp - hpCost < 1) return null;
  return { chakra: pay.chakra - cost, hp: pay.hp - hpCost, cost, hpCost };
}
