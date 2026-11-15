// Clones (docs/base/fundamentos.md#clones): a regra única dos tipos de clone, usada pelo Roleta e pela Jornada.
// Com clone ativo, cada golpe de alvo único tem uma chance de cair no clone em vez de no ninja. Cada tipo tem a sua
// ficha (`balance.clones.kinds`): quanto segura, quantos golpes aguenta, se bate junto e o que faz ao se desfazer.
import type { Nature } from './nature';
import type { Rng } from './rng';

export type CloneKind = 'bunshin' | 'kage' | 'tajuu' | 'mizu' | 'doton' | 'mokuton' | 'raiton' | 'suna';

export interface CloneKindRules {
  /** Chance de o clone receber um golpe de alvo único direcionado ao ninja. */
  blockChance: number;
  /** Golpes que o clone aguenta antes de se desfazer. */
  durability: number;
  /** Golpe extra de cada clone quando o dono acerta uma técnica de dano de alvo único (fração do dano de um golpe). */
  strikePct: number;
  /** Jornada: o golpe junto vem das técnicas com `hitsPerClone` (Kage e Tajuu), não deste número. */
  jornadaStrikePct?: number;
  /** Acerto a mais do dono enquanto o clone existe (Mokuton: compartilha o que vê). */
  accuracyBonus?: number;
  /** Mostra a próxima ação do inimigo enquanto existe (Mokuton, no Roleta). */
  revealsIntent?: boolean;
  /** Ao se desfazer por um golpe: dano em quem bateu (fração do HP máximo dele) e chance de um efeito. */
  onBreak?: { damagePct?: number; effect?: 'stun' | 'chakraBlock'; chance?: number };
}

export interface CloneRules {
  /** Chance padrão (Bunshin), mantida para quem ainda lê só ela. */
  blockChance: number;
  kinds: Record<CloneKind, CloneKindRules>;
  /** Natureza → tipo de clone elemental. Sem entrada: Bunshin. */
  byNature: Partial<Record<Nature, CloneKind>>;
}

/** O golpe cai no clone? (só com clone ativo e golpe de alvo único; gasta um número do rng só nesse caso) */
export function cloneTakesHit(clones: number, singleTarget: boolean, rules: { blockChance: number }, rng: Rng): boolean {
  return clones > 0 && singleTarget && rng() < rules.blockChance;
}

/** Tipo de clone de quem tem esta natureza (Mizu na água, Doton na terra...). */
export const cloneKindFor = (nature: Nature | null | undefined, rules: CloneRules): CloneKind => (nature ? rules.byNature[nature] : undefined) ?? 'bunshin';

/** O clone segura mais um golpe; devolve se ele se desfez (o desgaste chegou à durabilidade). */
export function wearClone(wear: number, kind: CloneKind, rules: CloneRules): { wear: number; broken: boolean } {
  const next = wear + 1;
  return next >= rules.kinds[kind].durability ? { wear: 0, broken: true } : { wear: next, broken: false };
}
