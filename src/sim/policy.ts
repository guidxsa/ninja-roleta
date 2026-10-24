import {
  actionTechniqueId,
  attackPreview,
  availableActions,
  canClones,
  canFocus,
  dealsDamage,
  incomingDamagePreview,
  itemAction,
  playerGenjutsuHitChance,
  playerGenjutsuTurns,
  reactionPreview,
  reactionTechniqueId,
  type BattleState,
  type IncomingAttack,
  type PlayerAction,
  type ReactionChoice,
  type RoundExtras,
} from '../core/combat';
import type { GameData } from '../core/gameData';
import { upgradeOptions } from '../core/progression';
import type { PlayerState } from '../core/player';

/** Dano esperado do melhor ataque disponível agora (o valor da ação que uma reação gastaria). */
function bestAttackValue(state: BattleState, data: GameData): number {
  let best = 0;
  for (const a of availableActions(state, data)) {
    const id = actionTechniqueId(a);
    const t = id ? data.techniquesById[id] : undefined;
    if (!t || !dealsDamage(t)) continue;
    const prev = attackPreview(state, t.id, data);
    best = Math.max(best, prev.damage * prev.hitChance * prev.hits);
  }
  return best;
}

/** Jogador automático simples, para a simulação de balanceamento. Determinístico dado o estado. */
export function choosePlayerAction(state: BattleState, data: GameData): PlayerAction {
  const actions = availableActions(state, data);
  if (actions.length === 1) return actions[0]!;
  const p = state.player;
  const v = state.villain;
  const fx = state.playerFx;
  const has = (a: PlayerAction) => actions.includes(a);
  const techOf = (a: PlayerAction) => {
    const id = actionTechniqueId(a);
    return id ? data.techniquesById[id]! : null;
  };

  // Golpe carregado anunciado: Bomba de fumaça, ou postura defensiva (as reações ainda ficam livres).
  if (v.charging && !fx.dodge) {
    if (has(itemAction('smokeBomb'))) return itemAction('smokeBomb');
    return 'stance';
  }
  if (has(itemAction('medKit')) && (fx.bleeding || (fx.poison && fx.poison.ticks >= 2) || fx.burn > 1)) {
    return itemAction('medKit');
  }
  // Portões, expansão, armadura e dōjutsu gastam o turno: ativa cedo, para aproveitar as rodadas.
  if (has('gates') && p.hp > p.maxHp * 0.5) return 'gates';
  if (has('medical') && p.hp < p.maxHp * 0.4) return 'medical';
  if (has('expansion') && p.chakra >= data.balance.expansion.chakraCost + 4) return 'expansion';
  if (has('dojutsu') && p.chakra >= data.balance.dojutsu[p.dojutsu!].activationCost + 3) return 'dojutsu';
  const armor = actions.find((a) => techOf(a)?.state);
  if (armor && p.chakra >= techOf(armor)!.chakraCost + 6 && v.hp > v.def.hp * 0.3) return armor;
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

/**
 * Reação automática: compara o dano evitado (e o contra-ataque da disputa) com o valor da ação que a
 * reação gasta. Substituição só contra golpes pesados. Resistir é grátis e é o padrão.
 */
export function chooseReaction(state: BattleState, incoming: IncomingAttack, options: ReactionChoice[], data: GameData): ReactionChoice {
  const incomingDamage = incomingDamagePreview(state, incoming, data);
  const actionValue = bestAttackValue(state, data) * 0.8;
  const heavy = incoming.charged || incomingDamage >= state.player.hp * 0.3;
  let best: ReactionChoice = 'resist';
  let bestScore = 0;
  for (const choice of options) {
    if (choice === 'resist') continue;
    const prev = reactionPreview(state, incoming, choice, data);
    let score: number;
    if (prev.kind === 'substitution') {
      if (!heavy) continue;
      score = prev.chance * incomingDamage - actionValue;
    } else if (prev.kind === 'guard') {
      score = prev.holdChance * incomingDamage - actionValue;
    } else if (prev.kind === 'clash') {
      const [lose, cancel, win] = prev.odds;
      const id = reactionTechniqueId(choice)!;
      const tech = data.techniquesById[id]!;
      const counter = dealsDamage(tech) ? attackPreview(state, id, data).damage * (tech.hits ?? 1) * 0.6 : 0;
      score = (cancel + win) * incomingDamage + win * counter - lose * incomingDamage * 0.3 - actionValue;
    } else {
      continue;
    }
    if (score > bestScore) {
      best = choice;
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

/**
 * Upgrade à escolha automático: a linha de maior nível primeiro (ataque elemental, Rasengan), depois
 * a técnica de dano mais forte; sem dano, a primeira da lista.
 */
export function chooseUpgradeTarget(player: PlayerState, data: GameData): string | null {
  const options = upgradeOptions(player, data);
  if (options.length === 0) return null;
  const score = (id: string) => {
    const t = data.techniquesById[id]!;
    return (t.line ? 100 : 0) + (dealsDamage(t) ? t.baseDamage * (t.hits ?? 1) : 0);
  };
  return options.reduce((a, b) => (score(b) > score(a) ? b : a));
}
