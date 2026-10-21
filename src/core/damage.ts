export interface PlayerDamageInput {
  baseDamage: number;
  /** Atributo ofensivo do jogador no tipo do ataque. */
  offense: number;
  /** Atributo defensivo do vilão no tipo do ataque. */
  defense: number;
  /** Fração da defesa ignorada (ex.: passiva Punho preciso). */
  defensePierce?: number;
  elementMult: number;
  critMult: number;
  /** Multiplicadores extras (portões, surto da besta). */
  extraMult?: number;
}

/**
 * dif_status = ofensivo − defensivo
 * dano = max(1, (base + dif_status) × elemento × crítico)
 */
export function playerDamage(i: PlayerDamageInput): number {
  const effectiveDefense = i.defense * (1 - (i.defensePierce ?? 0));
  const raw = i.baseDamage + (i.offense - effectiveDefense);
  return Math.max(1, Math.floor(raw * i.elementMult * i.critMult * (i.extraMult ?? 1)));
}

export interface VillainDamageInput {
  baseDamage: number;
  /** Atributo ofensivo do jogador no tipo do ataque recebido (base da resistência). */
  playerOffense: number;
  resistanceBonus: number;
  offenseDivisor: number;
  elementMult: number;
  critMult: number;
  extraMult?: number;
}

/** resistência = ofensivo / 2 + diferencial_de_resistência */
export function playerResistance(offense: number, resistanceBonus: number, offenseDivisor: number): number {
  return Math.floor(offense / offenseDivisor + resistanceBonus);
}

/** dano = max(1, base × elemento × crítico − resistência) */
export function villainDamage(i: VillainDamageInput): number {
  const resistance = playerResistance(i.playerOffense, i.resistanceBonus, i.offenseDivisor);
  return Math.max(
    1,
    Math.floor(i.baseDamage * i.elementMult * i.critMult * (i.extraMult ?? 1) - resistance),
  );
}
