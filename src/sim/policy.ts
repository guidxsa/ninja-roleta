import {
  actionTechniqueId,
  attackPreview,
  availableActions,
  playerGenjutsuHitChance,
  playerGenjutsuTurns,
  type BattleState,
  type PlayerAction,
} from '../core/combat';
import type { GameData } from '../core/gameData';

/** Jogador automático simples, para a simulação de balanceamento. Determinística dado o estado. */
export function choosePlayerAction(state: BattleState, data: GameData): PlayerAction {
  const actions = availableActions(state, data);
  const p = state.player;
  const v = state.villain;
  const techOf = (a: PlayerAction) => {
    const id = actionTechniqueId(a);
    return id ? data.techniquesById[id]! : null;
  };

  if (actions.includes('gates') && p.hp > p.maxHp * 0.5) return 'gates';
  if (actions.includes('medical') && p.hp < p.maxHp * 0.4) return 'medical';
  // Dōjutsu: ativa logo, se sobrar chakra para lutar depois.
  if (actions.includes('dojutsu') && p.chakra >= data.balance.dojutsu[p.dojutsu!].activationCost + 3) return 'dojutsu';

  // Genjutsu não causa dano: vale a pena quando aprisiona por 2+ turnos, ou para respirar com HP baixo.
  const canDebilitate = v.fx.debilitated === 0 && v.fx.debilitateImmunity === 0;
  if (canDebilitate) {
    const hit = playerGenjutsuHitChance(state, data);
    let bestGen: PlayerAction | null = null;
    let bestTurns = 0;
    for (const a of actions) {
      const t = techOf(a);
      if (t?.type !== 'genjutsu') continue;
      const turns = playerGenjutsuTurns(state, t.id, data);
      if (turns > bestTurns) {
        bestGen = a;
        bestTurns = turns;
      }
    }
    if (bestGen && (hit * bestTurns >= 1.2 || p.hp < p.maxHp * 0.6)) return bestGen;
  }

  // Golpe inibidor: vale quando o vilão ainda tem chakra para técnicas caras.
  const villainNeedsChakra = v.def.techniques.some((t) => t.chakraCost > 0);
  let best: PlayerAction = 'rest';
  let bestScore = 0;
  for (const a of actions) {
    const t = techOf(a);
    if (!t || t.type === 'genjutsu') continue;
    const prev = attackPreview(state, t.id, data);
    let score = prev.damage * prev.hitChance;
    if (t.chakraDrain && villainNeedsChakra && v.chakra > 0) score *= 1.5;
    // Guarda um pouco de chakra: técnicas caras só se valerem a mais.
    score -= t.chakraCost * 0.5;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}
