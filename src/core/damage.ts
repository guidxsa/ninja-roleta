export interface PlayerDamageInput {
  /** Dano base da técnica, já com upgrades e ferramenta ninja (bônus de dano). */
  baseDamage: number;
  /** Atributo ofensivo do jogador no tipo do ataque. */
  offense: number;
  /** Atributo defensivo do vilão no tipo do ataque. */
  defense: number;
  /** Fração da defesa ignorada (técnica, sapo, Punho preciso), já com o teto aplicado. */
  penetration?: number;
  elementMult: number;
  critMult: number;
  /** Multiplicadores extras (portões, Byakugan, manto, expansão, pavor...). */
  extraMult?: number;
}

/**
 * defesa = defesa_do_vilão × (1 − penetração)
 * dano = max(1, (base + ofensivo − defesa) × elemento × crítico × outros)
 */
export function playerDamage(i: PlayerDamageInput): number {
  const effectiveDefense = i.defense * (1 - (i.penetration ?? 0));
  const raw = i.baseDamage + (i.offense - effectiveDefense);
  return Math.max(1, Math.floor(raw * i.elementMult * i.critMult * (i.extraMult ?? 1)));
}

export interface VillainDamageInput {
  baseDamage: number;
  /** Atributo do jogador no tipo do ataque recebido (base da resistência). */
  playerOffense: number;
  resistanceBonus: number;
  offenseDivisor: number;
  /** Piso de resistência (2; o Corpo de ferro tem 4 em nin e gen). */
  floor: number;
  /** Fração da resistência do jogador ignorada (ex.: Kabuto no hardcore). */
  resistancePierce?: number;
  elementMult: number;
  critMult: number;
  extraMult?: number;
}

/** resistência = max(piso, ofensivo / 2) + diferencial_de_resistência */
export function playerResistance(offense: number, resistanceBonus: number, offenseDivisor: number, floor = 0): number {
  return Math.floor(Math.max(floor, offense / offenseDivisor) + resistanceBonus);
}

/** dano = max(1, base × elemento × crítico × outros − resistência) */
export function villainDamage(i: VillainDamageInput): number {
  const full = playerResistance(i.playerOffense, i.resistanceBonus, i.offenseDivisor, i.floor);
  const resistance = Math.floor(full * (1 - (i.resistancePierce ?? 0)));
  return Math.max(1, Math.floor(i.baseDamage * i.elementMult * i.critMult * (i.extraMult ?? 1) - resistance));
}
