import {
  availableActions,
  playerGenjutsuTurns,
  playerTechnique,
  type BattleState,
  type PlayerAction,
} from '../core/combat';
import { elementMultiplier } from '../core/elements';
import type { GameData } from '../core/gameData';
import { genjutsuHitChance, hitChance } from '../core/hit';
import type { AttackType } from '../core/types';

/** Dano esperado aproximado de um tipo de ataque (sem crítico nem passivas aleatórias). */
function expectedDamage(state: BattleState, type: Exclude<AttackType, 'genjutsu'>, data: GameData): number {
  const { player: p, villain: v } = state;
  const tech = playerTechnique(p, type, data);
  const pierce = type === 'taijutsu' && p.passive?.kind === 'preciseFist' ? p.passive.defensePierce : 0;
  const gates =
    type === 'taijutsu' && state.playerFx.gatesTurns > 0 && p.passive?.kind === 'gates'
      ? p.passive.taijutsuMult
      : 1;
  const raw = tech.baseDamage + p.offense[type] - v.def.defense[type] * (1 - pierce);
  const mult = elementMultiplier(tech.element, v.def.element, data.beats, data.balance.elements);
  const hit = hitChance(p.speed, v.def.speed, data.balance.hit);
  return Math.max(1, raw * mult * gates) * hit;
}

/** Jogador automático simples, para a simulação de balanceamento. Determinística dado o estado. */
export function choosePlayerAction(state: BattleState, data: GameData): PlayerAction {
  const actions = availableActions(state, data);
  const p = state.player;
  const vfx = state.villain.fx;

  if (actions.includes('gates') && p.hp > p.maxHp * 0.5) return 'gates';
  if (actions.includes('medical') && p.hp < p.maxHp * 0.4) return 'medical';

  // Genjutsu não causa dano: vale a pena quando aprisiona por 2+ turnos, ou para respirar com HP baixo.
  const canDebilitate = vfx.debilitated === 0 && vfx.debilitateImmunity === 0;
  if (actions.includes('genjutsu') && canDebilitate) {
    const hit = genjutsuHitChance(p.offense.genjutsu, state.villain.def.defense.genjutsu, data.balance.genjutsuHit);
    const turns = playerGenjutsuTurns(p, state.villain.def, data);
    if (hit * turns >= 1.2 || p.hp < p.maxHp * 0.6) return 'genjutsu';
  }

  let best: PlayerAction = 'rest';
  let bestDamage = 0;
  for (const type of ['taijutsu', 'ninjutsu'] as const) {
    if (!actions.includes(type)) continue;
    const dmg = expectedDamage(state, type, data);
    if (dmg > bestDamage) {
      best = type;
      bestDamage = dmg;
    }
  }
  return best;
}
