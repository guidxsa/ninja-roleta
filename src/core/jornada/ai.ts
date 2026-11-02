// Comportamento automático dos suportes e dos inimigos (docs/jornada/personagens.md#comportamento).
// Escolhe pela situação; a sorte só desempata entre as duas melhores opções de dano.
import type { Rng } from '../rng';
import {
  accuracyAgainst,
  alive,
  blockedReason,
  downed,
  hasEffect,
  hitDamage,
  hitsOf,
  opponentSide,
  validTargets,
} from './battle';
import type { JornadaData } from './data';
import type { Fighter, JAction, JBattle, JTechnique } from './types';

/** Dano esperado da técnica no alvo (acerto × golpes × dano), para comparar opções. */
export function expectedDamage(s: JBattle, user: Fighter, target: Fighter, tech: JTechnique, data: JornadaData): number {
  if (tech.baseDamage <= 0) return 0;
  const per = hitDamage(user, target, tech, data) * accuracyAgainst(user, target, tech, data) * hitsOf(user, tech);
  return tech.target === 'allEnemies' ? per * alive(s, opponentSide(user.side)).length : per;
}

/** Ameaça de um lutador: o maior ataque dele, mais se estiver em fúria. */
const threat = (f: Fighter) => Math.max(f.offense.taijutsu, f.offense.ninjutsu, f.offense.genjutsu) * f.mods.damageMult;

const usable = (f: Fighter, data: JornadaData) =>
  f.techniques.map((id) => data.techniques[id]!).filter((t) => t && !blockedReason(f, t));

/** Melhor ataque de dano contra os alvos possíveis (com desempate pela sorte entre os dois melhores). */
function bestAttack(s: JBattle, f: Fighter, data: JornadaData, rng: Rng, pick: (opts: Fighter[]) => Fighter[]): JAction | null {
  const options: { action: JAction; value: number }[] = [];
  for (const tech of usable(f, data)) {
    if (tech.baseDamage <= 0) continue;
    const targets = tech.target === 'allEnemies' ? alive(s, opponentSide(f.side)).slice(0, 1) : pick(validTargets(s, f, tech));
    for (const t of targets) {
      // Técnicas caras valem um pouco menos (guardar chakra).
      const value = expectedDamage(s, f, t, tech, data) - tech.chakraCost * 0.3;
      options.push({ action: { kind: 'tech', techId: tech.id, target: t.uid }, value });
    }
  }
  if (!options.length) return null;
  options.sort((a, b) => b.value - a.value);
  if (options.length > 1 && options[1]!.value >= options[0]!.value * 0.85 && rng() < 0.3) return options[1]!.action;
  return options[0]!.action;
}

function firstUsable(f: Fighter, data: JornadaData, test: (t: JTechnique) => boolean): JTechnique | null {
  return usable(f, data).find(test) ?? null;
}

export function chooseAiAction(s: JBattle, f: Fighter, data: JornadaData, rng: Rng): JAction {
  const friends = alive(s, f.side);
  const foes = alive(s, opponentSide(f.side));
  const fallen = downed(s, f.side);
  const tech = (pred: (t: JTechnique) => boolean) => firstUsable(f, data, pred);

  // Curandeiro e tático levantam quem caiu (o protagonista primeiro).
  if ((f.ai === 'healer' || f.ai === 'tactician') && fallen.length) {
    const target = fallen.find((x) => x.protagonist) ?? fallen[0]!;
    return { kind: 'revive', target: target.uid };
  }
  if (f.ai === 'healer') {
    const heal = tech((t) => Boolean(t.healPct) && t.target === 'ally');
    const hurt = [...friends].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (heal && hurt && hurt.hp < hurt.maxHp * 0.55) return { kind: 'tech', techId: heal.id, target: hurt.uid };
  }
  if (f.ai === 'tactician') {
    const cleanse = tech((t) => Boolean(t.cleanse));
    const stuck = friends.find((x) => x !== f && (hasEffect(x, 'stun') || hasEffect(x, 'chakraBlock')));
    if (cleanse && stuck) return { kind: 'tech', techId: cleanse.id, target: stuck.uid };
    const control = tech((t) => t.onHit?.effect === 'stun' && t.target === 'enemy');
    const free = [...foes].filter((x) => !hasEffect(x, 'stun')).sort((a, b) => threat(b) - threat(a))[0];
    if (control && free && rng() < 0.6) return { kind: 'tech', techId: control.id, target: free.uid };
  }
  if (f.ai === 'guardian') {
    const shield = tech((t) => Boolean(t.shieldPct) && t.target === 'ally');
    const exposed = friends
      .filter((x) => x.shield === 0 && x.hp < x.maxHp * 0.7)
      .sort((a, b) => Number(b.protagonist) - Number(a.protagonist) || a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (shield && exposed) return { kind: 'tech', techId: shield.id, target: exposed.uid };
  }
  // Defesa própria: escudo quando está ferido, clones quando não tem.
  const selfShield = tech((t) => t.target === 'self' && Boolean(t.shieldPct));
  if (selfShield && f.shield === 0 && f.hp < f.maxHp * 0.6) return { kind: 'tech', techId: selfShield.id, target: f.uid };
  const selfClones = tech((t) => t.target === 'self' && Boolean(t.clones));
  if (selfClones && f.clones === 0) return { kind: 'tech', techId: selfClones.id, target: f.uid };
  // Inimigo que cura o próprio time (Kabuto) com aliado ferido.
  const allyHeal = tech((t) => Boolean(t.healPct) && t.target === 'ally');
  const hurtFriend = friends.find((x) => x.hp < x.maxHp * 0.45);
  if (allyHeal && hurtFriend && f.ai !== 'healer') return { kind: 'tech', techId: allyHeal.id, target: hurtFriend.uid };

  // Controle sem dano (Prisão de Água, Bomba de fedor): às vezes, no adversário mais perigoso que está livre.
  const pureControl = tech((t) => t.baseDamage === 0 && t.target === 'enemy' && Boolean(t.onHit));
  const loose = [...foes].filter((x) => !hasEffect(x, 'stun')).sort((a, b) => threat(b) - threat(a))[0];
  if (pureControl && loose && rng() < 0.35) return { kind: 'tech', techId: pureControl.id, target: loose.uid };

  const pick =
    f.ai === 'brute'
      ? (opts: Fighter[]) => [...opts].sort((a, b) => a.hp - b.hp).slice(0, 1)
      : f.ai === 'striker'
        ? (opts: Fighter[]) => [...opts].sort((a, b) => threat(b) - threat(a)).slice(0, 2)
        : (opts: Fighter[]) => opts;
  const attack = bestAttack(s, f, data, rng, pick);
  // Sem chakra para nada além do básico e com pouco chakra: concentra.
  if (!attack || (f.chakra < f.maxChakra * 0.15 && f.techniques.some((id) => (data.techniques[id]?.chakraCost ?? 0) > f.chakra) && rng() < 0.35)) {
    return { kind: 'rest' };
  }
  return attack;
}
