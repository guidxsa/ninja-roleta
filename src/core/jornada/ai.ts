// Comportamento automático dos suportes e dos inimigos (docs/jornada/personagens.md#comportamento).
// Escolhe pela situação; a sorte só desempata entre as duas melhores opções de dano.
import type { Rng } from '../rng';
import {
  accuracyAgainst,
  alive,
  blockedReason,
  canRaise,
  downed,
  effectTurns,
  gateChoices,
  gateOpenCost,
  gateUpkeepAt,
  hasEffect,
  hitDamage,
  hitsOf,
  opponentSide,
  techniqueCost,
  validTargets,
} from './battle';
import type { JornadaData } from './data';
import type { Fighter, JAction, JBattle, JFreeAction, JTechnique } from './types';

/** Dano esperado da técnica no alvo (acerto × golpes × dano), para comparar opções. */
export function expectedDamage(s: JBattle, user: Fighter, target: Fighter, tech: JTechnique, data: JornadaData): number {
  if (tech.baseDamage <= 0) return 0;
  const per = hitDamage(user, target, tech, data) * accuracyAgainst(user, target, tech, data) * hitsOf(user, tech);
  return tech.target === 'allEnemies' ? per * alive(s, opponentSide(user.side)).length : per;
}

/** Ameaça de um lutador: o maior ataque dele, mais se estiver em fúria. */
const threat = (f: Fighter) =>
  Math.max(f.offense.taijutsu, f.offense.ninjutsu, f.offense.genjutsu) *
  f.mods.damageMult *
  (f.passive?.kind === 'enrage' && f.hp <= f.maxHp * f.passive.atPct ? f.passive.damageMult : 1);

/** O alvo depende de chakra para atacar (bloquear o chakra dele adianta). */
const needsChakra = (t: Fighter, data: JornadaData) => t.techniques.some((id) => (data.techniques[id]?.baseDamage ?? 0) > 0 && data.techniques[id]!.type !== 'taijutsu');

/**
 * Quanto vale o efeito da técnica neste alvo, na mesma escala do dano: controle vale a ameaça do alvo pelos turnos
 * que ele perde; não vale nada em quem já está controlado ou com a trava.
 */
function effectValue(f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData): number {
  const on = tech.onHit;
  if (!on || hasEffect(t, on.effect)) return 0;
  const hits = tech.baseDamage > 0 ? hitsOf(f, tech) : 1;
  const chance = 1 - (1 - Math.min(1, on.chance + f.mods.effectChanceBonus)) ** hits;
  const turns = effectTurns(tech, data);
  if (on.effect === 'stun') return hasEffect(t, 'stunGuard') ? 0 : threat(t) * turns * chance;
  if (on.effect === 'chakraBlock') return needsChakra(t, data) ? threat(t) * turns * chance * 0.5 : 0;
  const pct = on.effect === 'burn' ? data.j.combat.burnPct : data.j.combat.poisonPct;
  return t.maxHp * pct * turns * chance;
}

/**
 * Valor útil da técnica num alvo: o dano que de fato tira HP (golpe forte em quem está quase caindo não vale mais
 * que um fraco), a ameaça que sai de campo se o golpe derruba, e o efeito.
 */
function targetValue(f: Fighter, t: Fighter, tech: JTechnique, data: JornadaData): { value: number; kills: boolean } {
  const acc = accuracyAgainst(f, t, tech, data);
  if (tech.baseDamage <= 0) return { value: effectValue(f, t, tech, data) * acc, kills: false };
  const raw = hitDamage(f, t, tech, data) * hitsOf(f, tech);
  const kills = raw >= t.hp + t.shield;
  return { value: (Math.min(raw, t.hp + t.shield) + (kills ? threat(t) : 0)) * acc + (kills ? 0 : effectValue(f, t, tech, data)), kills };
}

/** Técnicas de ação de turno que dá para usar (as ativas são grátis: `chooseAiActive`). */
const usable = (f: Fighter, data: JornadaData) =>
  f.techniques.map((id) => data.techniques[id]!).filter((t) => t && !t.active && !blockedReason(f, t));

/** Valor de uma técnica (ou de uma variante sorteada) contra um alvo escolhido; em área, soma todos os adversários. */
function techValue(s: JBattle, f: Fighter, tech: JTechnique, t: Fighter, data: JornadaData): { value: number; kills: boolean } {
  const foes = alive(s, opponentSide(f.side));
  if (tech.target === 'allEnemies') {
    const each = foes.map((x) => targetValue(f, x, tech, data));
    return { value: each.reduce((a, x) => a + x.value, 0), kills: each.some((x) => x.kills) };
  }
  if (tech.target === 'self') return { value: tech.shieldPct && f.shield === 0 ? f.maxHp * tech.shieldPct * 0.5 : 0, kills: false };
  return targetValue(f, t, tech, data);
}

/**
 * Melhor ação ofensiva (dano, controle ou técnica sorteada) contra os alvos possíveis. O custo pesa mais com pouco
 * chakra; entre as opções que derrubam o alvo vence a mais barata. A sorte só desempata quando nenhuma derruba.
 */
function bestAttack(s: JBattle, f: Fighter, data: JornadaData, rng: Rng, pick: (opts: Fighter[]) => Fighter[]): JAction | null {
  const options: { action: JAction; value: number; kills: boolean }[] = [];
  const foes = alive(s, opponentSide(f.side));
  // Tático dá mais valor ao controle.
  const taste = (tech: JTechnique) => (f.ai === 'tactician' && tech.baseDamage <= 0 ? 1.5 : 1);
  const scarcity = 0.3 + 0.5 * (1 - f.chakra / Math.max(1, f.maxChakra));
  for (const tech of usable(f, data)) {
    const variants = tech.roll?.map((v) => ({ tech: data.techniques[v.tech]!, w: Math.max(0, v.weight + (f.mods.rollWeights[v.tech] ?? 0)) })).filter((v) => v.tech && v.w > 0);
    const offensive = variants ? variants.length > 0 : (tech.baseDamage > 0 || Boolean(tech.onHit)) && (tech.target === 'enemy' || tech.target === 'allEnemies');
    if (!offensive) continue;
    const targets = tech.target === 'allEnemies' ? foes.slice(0, 1) : pick(validTargets(s, f, tech));
    const cost = techniqueCost(f, tech) * scarcity + (tech.cooldown ?? 0) * 0.5;
    for (const t of targets) {
      let value = 0;
      let kills = false;
      if (variants) {
        const total = variants.reduce((a, v) => a + v.w, 0);
        for (const v of variants) value += (techValue(s, f, v.tech, t, data).value * v.w) / total;
      } else ({ value, kills } = techValue(s, f, tech, t, data));
      if (value <= 0) continue;
      options.push({ action: { kind: 'tech', techId: tech.id, target: t.uid }, value: value * taste(tech) - cost, kills });
    }
  }
  if (!options.length) return null;
  options.sort((a, b) => b.value - a.value);
  if (!options[0]!.kills && options.length > 1 && options[1]!.value >= options[0]!.value * 0.85 && rng() < 0.3) return options[1]!.action;
  return options[0]!.action;
}

/** A ação derruba o último adversário de pé (encerra a luta). */
function endsFight(s: JBattle, f: Fighter, action: JAction | null, data: JornadaData): boolean {
  if (action?.kind !== 'tech') return false;
  const foes = alive(s, opponentSide(f.side));
  const tech = data.techniques[action.techId]!;
  if (tech.baseDamage <= 0) return false;
  return foes.every((t) => (tech.target === 'allEnemies' || t.uid === action.target) && hitDamage(f, t, tech, data) * hitsOf(f, tech) >= t.hp + t.shield);
}

function firstUsable(f: Fighter, data: JornadaData, test: (t: JTechnique) => boolean): JTechnique | null {
  return usable(f, data).find(test) ?? null;
}

export function chooseAiAction(s: JBattle, f: Fighter, data: JornadaData, rng: Rng): JAction {
  const friends = alive(s, f.side);
  const foes = alive(s, opponentSide(f.side));
  const fallen = downed(s, f.side);
  const tech = (pred: (t: JTechnique) => boolean) => firstUsable(f, data, pred);

  // Finalizador (o Rasengan no Kabuto): com o alvo perto de cair, usa a técnica que derruba.
  const w = s.win;
  if (w.kind === 'finisher' && f.side === 'ally') {
    const target = foes.find((x) => x.defId === w.target);
    const finisher = tech((t) => t.id === w.technique);
    if (target && target.hp <= target.maxHp * 0.3) {
      if (finisher) return { kind: 'tech', techId: finisher.id, target: target.uid };
      // Conhece a técnica, mas falta chakra: concentra para fechar no turno seguinte.
      if (f.techniques.includes(w.technique) && !f.cooldowns[w.technique]) return { kind: 'rest' };
    }
  }
  const pick =
    f.ai === 'brute'
      ? (opts: Fighter[]) => [...opts].sort((a, b) => a.hp - b.hp).slice(0, 1)
      : f.ai === 'striker'
        ? (opts: Fighter[]) => [...opts].sort((a, b) => threat(b) - threat(a)).slice(0, 2)
        : (opts: Fighter[]) => opts;
  const attack = bestAttack(s, f, data, rng, pick);
  // Levantar quem caiu vem antes de tudo (o protagonista primeiro), a não ser que um golpe encerre a luta agora.
  // Com a técnica, sempre; com a ação universal (pouco HP), o protagonista sempre e os outros só se quem levanta não está em perigo.
  if (fallen.length && !endsFight(s, f, attack, data)) {
    const target = fallen.find((x) => x.protagonist) ?? fallen[0]!;
    const revive = tech((t) => Boolean(t.reviveHpPct));
    if (revive) return { kind: 'tech', techId: revive.id, target: target.uid };
    if (canRaise(s, f).includes(target) && (target.protagonist || f.hp >= f.maxHp * 0.4)) return { kind: 'raise', target: target.uid };
  }
  if (f.ai === 'healer') {
    const heal = tech((t) => Boolean(t.healHp) && t.target === 'ally');
    const hurt = [...friends].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (heal && hurt && hurt.hp < hurt.maxHp * 0.55) return { kind: 'tech', techId: heal.id, target: hurt.uid };
  }
  if (f.ai === 'tactician') {
    const cleanse = tech((t) => Boolean(t.cleanse));
    const stuck = friends.find((x) => x !== f && (hasEffect(x, 'stun') || hasEffect(x, 'chakraBlock')));
    if (cleanse && stuck) return { kind: 'tech', techId: cleanse.id, target: stuck.uid };
  }
  if (f.ai === 'guardian') {
    const shield = tech((t) => Boolean(t.shieldPct) && t.target === 'ally');
    const exposed = friends
      .filter((x) => x.shield === 0 && x.hp < x.maxHp * 0.7)
      .sort((a, b) => Number(b.protagonist) - Number(a.protagonist) || a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (shield && exposed) return { kind: 'tech', techId: shield.id, target: exposed.uid };
  }
  // Defesa própria: escudo quando está ferido (Agulhas de Jizō, Rotação; os escudos ativos vão em chooseAiActive).
  const selfShield = tech((t) => t.target === 'self' && Boolean(t.shieldPct));
  if (selfShield && f.shield === 0 && f.hp < f.maxHp * 0.6) return { kind: 'tech', techId: selfShield.id, target: f.uid };
  // Inimigo que cura o próprio time (Kabuto) com aliado ferido.
  const allyHeal = tech((t) => Boolean(t.healHp) && t.target === 'ally');
  const hurtFriend = friends.find((x) => x.hp < x.maxHp * 0.45);
  if (allyHeal && hurtFriend && f.ai !== 'healer') return { kind: 'tech', techId: allyHeal.id, target: hurtFriend.uid };

  // Clones que gastam o turno (Bunshin): sem nenhum e já ferido (HP < 70%, a mesma regra do bot do Roleta), às vezes vale criar um.
  const makeClone = tech((t) => t.target === 'self' && t.baseDamage === 0 && Boolean(t.clones));
  if (makeClone && f.clones === 0 && f.hp < f.maxHp * 0.7 && rng() < 0.4) return { kind: 'tech', techId: makeClone.id, target: f.uid };

  // Dano, controle e técnica sorteada disputam pelo valor (`bestAttack`, calculado acima).
  // Sem chakra para nada além do básico e com pouco chakra: concentra.
  if (!attack || (f.chakra < f.maxChakra * 0.15 && f.techniques.some((id) => (data.techniques[id]?.chakraCost ?? 0) > f.chakra) && rng() < 0.35)) {
    return { kind: 'rest' };
  }
  return attack;
}

/**
 * Portão para a IA: com tudo fechado, o maior que dá para abrir e ainda manter por 2 turnos; aberto, deixa fechar
 * sozinho quando faltar chakra.
 */
function aiGate(s: JBattle, f: Fighter, data: JornadaData): number | null {
  const choices = gateChoices(s, f, data);
  if (!choices.length || f.gate) return null;
  const affordable = choices.filter((l) => l > 0 && gateOpenCost(f, l, data) + gateUpkeepAt(l, 1, data) + gateUpkeepAt(l, 2, data) <= f.chakra);
  return affordable.length ? Math.max(...affordable) : null;
}

/**
 * Ativa grátis antes da ação (docs/jornada/personagens.md#comportamento): escudo próprio quando ferido, depois
 * Portões ou fortalecimento quando não tem, depois clones quando não tem. Uma por turno.
 */
export function chooseAiActive(s: JBattle, f: Fighter, data: JornadaData, _rng: Rng): JFreeAction | null {
  if (s.activeUsed || f.down || !alive(s, opponentSide(f.side)).length) return null;
  const actives = f.techniques.map((id) => data.techniques[id]!).filter((t) => t?.active && !t.gates && !blockedReason(f, t));
  const self = (test: (t: JTechnique) => boolean) => actives.find((t) => t.target === 'self' && test(t));
  const shield = self((t) => Boolean(t.shieldPct));
  if (shield && f.shield === 0 && f.hp < f.maxHp * 0.6) return { kind: 'active', techId: shield.id, target: f.uid };
  const gate = aiGate(s, f, data);
  if (gate !== null) return { kind: 'gate', level: gate };
  const boost = self((t) => Boolean(t.boost));
  if (boost && !f.boost) return { kind: 'active', techId: boost.id, target: f.uid };
  const clones = self((t) => Boolean(t.clones));
  if (clones && f.clones === 0) return { kind: 'active', techId: clones.id, target: f.uid };
  return null;
}
