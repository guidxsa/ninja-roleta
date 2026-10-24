import {
  actionTechniqueId,
  attackPreview,
  availableActions,
  canClones,
  canFocus,
  dealsDamage,
  itemAction,
  playerGenjutsuHitChance,
  playerGenjutsuTurns,
  type BattleState,
  type PlayerAction,
  type RoundExtras,
} from '../core/combat';
import type { GameData } from '../core/gameData';

/** Jogador automático simples, para a simulação de balanceamento. Determinístico dado o estado. */
export function choosePlayerAction(state: BattleState, data: GameData): PlayerAction {
  const actions = availableActions(state, data);
  const p = state.player;
  const v = state.villain;
  const fx = state.playerFx;
  const has = (a: PlayerAction) => actions.includes(a);
  const techOf = (a: PlayerAction) => {
    const id = actionTechniqueId(a);
    return id ? data.techniquesById[id]! : null;
  };

  // Golpe carregado anunciado: defende (Rotação, Bomba de fumaça ou Substituição).
  if (v.charging && !fx.dodge) {
    const rotation = actions.find((a) => techOf(a)?.defensive === 'rotation');
    if (rotation) return rotation;
    if (has(itemAction('smokeBomb'))) return itemAction('smokeBomb');
    if (has('substitution')) return 'substitution';
  }
  if (has(itemAction('medKit')) && (fx.bleeding || (fx.poison && fx.poison.ticks >= 2) || fx.burn > 1)) {
    return itemAction('medKit');
  }
  // Portões, expansão e dōjutsu gastam o turno: ativa cedo, para aproveitar as rodadas.
  if (has('gates') && p.hp > p.maxHp * 0.5) return 'gates';
  if (has('medical') && p.hp < p.maxHp * 0.4) return 'medical';
  if (has('expansion') && p.chakra >= data.balance.expansion.chakraCost + 4) return 'expansion';
  if (has('dojutsu') && p.chakra >= data.balance.dojutsu[p.dojutsu!].activationCost + 3) return 'dojutsu';
  if (has(itemAction('soldierPill')) && p.chakra < p.maxChakra * 0.2) return itemAction('soldierPill');
  if (has(itemAction('explosiveTag')) && v.hp <= data.balance.items.explosiveTag.damage) return itemAction('explosiveTag');

  // Efeitos mentais: valem quando o vilão ainda pode ser afetado e a chance compensa.
  const canDebilitate = v.fx.debilitated === 0 && v.fx.asleep === 0 && v.fx.debilitateImmunity === 0;
  let bestMental: PlayerAction | null = null;
  let bestMentalScore = 0;
  for (const a of actions) {
    const t = techOf(a);
    if (!t?.mental) continue;
    const losesTurn = t.mental === 'prison' || t.mental === 'sleep';
    if (losesTurn && !canDebilitate) continue;
    if (t.mental === 'fear' && v.fx.feared > 0) continue;
    if (t.mental === 'confusion' && v.fx.confused > 0) continue;
    if (t.mental === 'torment' && v.fx.tormented > 0) continue;
    const turns = playerGenjutsuTurns(state, t.id, data) + (t.mental === 'sleep' ? 1 : 0);
    const weight = losesTurn ? 1 : 0.5;
    const score = playerGenjutsuHitChance(state, data, t.id) * turns * weight;
    if (score > bestMentalScore) {
      bestMental = a;
      bestMentalScore = score;
    }
  }
  if (bestMental && (bestMentalScore >= 1.2 || p.hp < p.maxHp * 0.6)) return bestMental;

  // Melhor ataque pelo dano esperado; o Selo dos Pontos Vitais vale mais se o vilão depende de chakra.
  const villainNeedsChakra = v.def.techniques.some((t) => t.chakraCost > 0);
  let best: PlayerAction = 'rest';
  let bestScore = 0;
  for (const a of actions) {
    const t = techOf(a);
    if (!t || !dealsDamage(t)) continue;
    const prev = attackPreview(state, t.id, data);
    let score = prev.damage * prev.hitChance * prev.hits;
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

/** Escolhas grátis: foco no primeiro ataque com dano; clones quando sobra chakra. */
export function chooseExtras(state: BattleState, action: PlayerAction, data: GameData): RoundExtras {
  const id = actionTechniqueId(action);
  const tech = id ? data.techniquesById[id] : undefined;
  const attack = tech !== undefined && dealsDamage(tech);
  return {
    focus: attack && canFocus(state),
    clones: attack && canClones(state, action, data) && state.player.chakra >= state.player.maxChakra * 0.5,
  };
}

/** Compatibilidade: só o foco. */
export function shouldFocus(state: BattleState, action: PlayerAction, data: GameData): boolean {
  return Boolean(chooseExtras(state, action, data).focus);
}
