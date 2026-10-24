export interface DamageInput {
  /** Dano base da técnica, já com upgrades e ferramenta ninja (bônus de dano). */
  baseDamage: number;
  /** Ataque de quem bate, no tipo do golpe. */
  offense: number;
  /** Resistência física total de quem recebe (já com mantos e estados). */
  resistance: number;
  /** Fração da resistência usada: passiva, Resistir ou postura (fundamentos.md). */
  fraction: number;
  /** Fração da resistência ignorada (técnica, sapo, Punho preciso), já com o teto aplicado. */
  penetration?: number;
  elementMult: number;
  critMult: number;
  /** Multiplicadores extras (portões, Byakugan, manto, expansão, pavor, disputa...). */
  extraMult?: number;
}

/** Resistência que o golpe enfrenta: total × fração da situação × (1 − penetração). */
export function usedResistance(resistance: number, fraction: number, penetration = 0): number {
  return resistance * fraction * (1 - penetration);
}

/**
 * Fórmula única para jogador e vilão:
 * dano = max(1, (base + ataque − resistência_usada) × elemento × crítico × outros)
 */
export function damage(i: DamageInput): number {
  const raw = i.baseDamage + i.offense - usedResistance(i.resistance, i.fraction, i.penetration);
  return Math.max(1, Math.floor(raw * i.elementMult * i.critMult * (i.extraMult ?? 1)));
}
