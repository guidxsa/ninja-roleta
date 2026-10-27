import {
  actionTechniqueId,
  attackPreview,
  availableActions,
  canClones,
  canDojutsuExtra,
  canGenius,
  canFocus,
  dealsDamage,
  illusionDamage,
  isBarrier,
  isIllusion,
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
import { leveledTechnique, type PlayerState } from '../core/player';

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

/** Dano que a próxima ação anunciada do vilão causaria (golpe carregado já ×2), se o jogador só Resistir. */
function villainIntentDamage(state: BattleState, data: GameData): number {
  const v = state.villain;
  const id = v.charging ?? (v.intent?.kind === 'technique' ? v.intent.id : null);
  const tech = id ? v.def.techniques.find((t) => t.id === id) : undefined;
  if (!tech || tech.type === 'genjutsu' || tech.baseDamage <= 0) return 0;
  const element = tech.type === 'taijutsu' ? null : tech.element === undefined ? v.def.element : tech.element;
  const incoming: IncomingAttack = { attacker: 'villain', techniqueId: tech.id, type: tech.type, element, hits: tech.hits ?? 1, charged: Boolean(v.charging) };
  return incomingDamagePreview(state, incoming, data);
}

/** Dano esperado de uma ilusão de dano (Uchiha): dano × chance do genjutsu. */
function illusionValue(state: BattleState, id: string, data: GameData): number {
  return illusionDamage(state, id, data) * playerGenjutsuHitChance(state, data, id);
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

  // Barreira: escudo contra o golpe carregado ou quando o próximo golpe vale mais que o ataque do turno.
  const barrier = fx.shield ? undefined : actions.find((a) => techOf(a) && isBarrier(techOf(a)!));
  if (barrier) {
    const points = leveledTechnique(p, actionTechniqueId(barrier)!, data).barrier ?? 0;
    const incoming = villainIntentDamage(state, data);
    if (v.charging && !fx.dodge && points >= incoming * 0.5) return barrier;
    if (!v.charging && Math.min(points, incoming * 2.5) > bestAttackValue(state, data) * 1.5 && p.hp < p.maxHp * 0.8) return barrier;
  }
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

  // Efeitos mentais: valor em dano equivalente (o dano do vilão evitado, o que ele se fere e o bônus
  // no próximo golpe contra quem perdeu a vez), comparado com o dano do melhor ataque deste turno.
  const canDebilitate = v.fx.debilitated === 0 && v.fx.asleep === 0 && v.fx.possessed === 0 && v.fx.debilitateImmunity === 0;
  const villainHit = Math.max(villainIntentDamage(state, data), 6);
  const attackNow = bestAttackValue(state, data);
  const st = data.balance.status;
  let bestMental: PlayerAction | null = null;
  let bestMentalScore = 0;
  for (const a of actions) {
    const t = techOf(a);
    if (!t?.mental || isIllusion(t)) continue;
    const losesTurn = t.mental === 'prison' || t.mental === 'sleep' || t.mental === 'possession';
    if (losesTurn && !canDebilitate) continue;
    if (t.mental === 'fear' && v.fx.feared > 0) continue;
    if (t.mental === 'confusion' && v.fx.confused > 0) continue;
    if (t.mental === 'torment' && v.fx.tormented > 0) continue;
    const turns = playerGenjutsuTurns(state, t.id, data) + (t.mental === 'sleep' ? 1 : 0);
    const vulnerable = (data.balance.control.vulnerableDamageMult - 1) * attackNow;
    const perTurn =
      t.mental === 'possession'
        ? 2 * villainHit + vulnerable
        : losesTurn
          ? villainHit + vulnerable
          : t.mental === 'fear'
            ? villainHit * (1 - st.fear.damageMult)
            : t.mental === 'confusion'
              ? villainHit * st.confusion.failChance * 1.25
              : 1;
    const score = playerGenjutsuHitChance(state, data, t.id) * turns * perTurn;
    if (score > bestMentalScore) {
      bestMental = a;
      bestMentalScore = score;
    }
  }
  if (bestMental && bestMentalScore > attackNow) return bestMental;

  // Melhor ataque pelo dano esperado; o Selo dos Pontos Vitais vale mais se o vilão depende de chakra.
  const villainNeedsChakra = v.def.techniques.some((t) => t.chakraCost > 0);
  let best: PlayerAction = 'rest';
  let bestScore = 0;
  for (const a of actions) {
    const t = techOf(a);
    if (!t || (!dealsDamage(t) && !isIllusion(t))) continue;
    let score: number;
    if (isIllusion(t)) {
      score = illusionValue(state, t.id, data);
      // Ilusão que também controla (Tsukuyomi) vale mais se o vilão ainda pode perder a vez.
      if (t.mental && canDebilitate) score *= 1.3;
    } else {
      const prev = attackPreview(state, t.id, data);
      score = prev.damage * prev.hitChance * prev.hits;
    }
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
 * reação gasta. Substituição não gasta ação, mas tem poucos usos: só contra golpes pesados. Resistir é grátis e é o padrão.
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
      score = prev.chance * incomingDamage;
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

/** Escolhas grátis: foco no primeiro ataque com dano; clones quando sobra chakra; Sharingan cedo. */
export function chooseExtras(state: BattleState, action: PlayerAction, data: GameData): RoundExtras {
  const id = actionTechniqueId(action);
  const tech = id ? data.techniquesById[id] : undefined;
  const attack = tech !== undefined && dealsDamage(tech);
  const p = state.player;
  // Gênio: guarda para golpes e controles que podem errar.
  let geniusHit = 1;
  if (tech && (tech.mental || isIllusion(tech))) geniusHit = playerGenjutsuHitChance(state, data, tech.id);
  else if (attack) geniusHit = attackPreview(state, tech.id, data).hitChance;
  return {
    genius: canGenius(state, data) && geniusHit < 0.9,
    focus: attack && canFocus(state),
    clones: attack && canClones(state, action, data) && p.chakra >= p.maxChakra * 0.5,
    dojutsu: canDojutsuExtra(state, action, data) && p.chakra >= (p.dojutsu ? data.balance.dojutsu[p.dojutsu].activationCost : 0) + 6,
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
