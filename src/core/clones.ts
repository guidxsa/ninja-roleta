// Clones (docs/base/fundamentos.md#clones): a regra única do Bunshin no Jutsu, usada pelo Roleta e pela Jornada.
// Com um clone ativo, cada golpe de alvo único tem uma chance de cair no clone em vez de no ninja; o clone que
// recebe dano se desfaz. Não é defesa garantida: só aumenta a chance de sair ileso.
import type { Rng } from './rng';

export interface CloneRules {
  /** Chance de o clone receber um golpe de alvo único direcionado ao ninja. */
  blockChance: number;
}

/** O golpe cai no clone? (só com clone ativo e golpe de alvo único; gasta um número do rng só nesse caso) */
export function cloneTakesHit(clones: number, singleTarget: boolean, rules: CloneRules, rng: Rng): boolean {
  return clones > 0 && singleTarget && rng() < rules.blockChance;
}
