// Cartão canônico de técnica (docs/visual.md#cartões, v0.75.0): o mesmo desenho no moveset e na ficha, no lugar de dois.
// Ícone na cor do elemento (ou do tipo), nome e os números principais (dano, cura, escudo, clones, custo); o resto fica
// na dica. O botão de luta (`.jmove`) continua à parte: ele carrega estado (espera, bloqueio, vantagem).
import { techPower } from '../../src/core/jornada/battle';
import type { FighterMods, JTechnique } from '../../src/core/jornada/types';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { icon } from '../art';
import { ELEMENT_COLORS } from '../tips';
import { techName, techTip } from './battle';

const J = S.jornada;

/** Ícone da técnica: clones, fortalecimento, portões, escudo, cura, ou o elemento/tipo. */
export function techIcon(t: JTechnique): string {
  return icon(t.gates ? 'gates' : t.clones || t.hitsPerClone ? 'clones' : t.boost ? 'sparkle' : t.shieldPct ? 'barrier' : t.healHp ? 'medical' : (t.element ?? t.type));
}

export const techColor = (t: JTechnique) => (t.element ? ELEMENT_COLORS[t.element] : `var(--t-${t.type})`);

/** Números principais, já com os bônus da run: dano (dourado se acima do base), cura, escudo, clones, custo. */
export function techBits(t: JTechnique, mods: FighterMods): string {
  const power = techPower(t, mods);
  const cost = Math.max(0, t.chakraCost - mods.chakraDiscount - (mods.techChakraDiscount[t.id] ?? 0));
  return [
    t.baseDamage > 0 ? `<span${power > t.baseDamage ? ' class="up"' : ''}>${J.battle.damage(power)}${(t.hits ?? 1) > 1 ? `×${t.hits}` : ''}</span>` : '',
    t.healHp ? J.sheet.heal(t.healHp) : '',
    t.shieldPct ? J.sheet.shield(Math.round(t.shieldPct * 100)) : '',
    t.clones ? `${icon('clones')} +${t.clones + mods.extraClones}` : '',
    cost ? J.battle.chakra(cost) : '',
    t.hpCostPct ? `${Math.round(t.hpCostPct * 100)}% HP` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export interface TechCardOpts {
  /** `button` escolhe (moveset); `li` só mostra (ficha). */
  tag?: 'li' | 'button';
  /** Equipada: ganha o realce e o número da vaga. */
  slot?: number;
  /** Mostra o tipo (taijutsu, ninjutsu...) antes dos números. */
  showType?: boolean;
  /** Atributos a mais no elemento (`data-move`, `aria-pressed`). */
  attrs?: string;
}

/** O cartão. A dica é a mesma da luta: `techTip`. */
export function techCard(t: JTechnique, mods: FighterMods, o: TechCardOpts = {}): string {
  const tag = o.tag ?? 'li';
  const on = o.slot !== undefined;
  const bits = techBits(t, mods);
  const type = o.showType ? `${J.types[t.type] ?? t.type}${bits ? ' · ' : ''}` : '';
  return `<${tag}${tag === 'button' ? ' type="button"' : ''} class="tcard${on ? ' on' : ''}" ${o.attrs ?? ''} style="--c:${techColor(t)}"${techTip(t, undefined, mods)}>
    <span class="tc-ico">${techIcon(t)}</span>
    <span class="tc-txt"><b>${techName(t.id)}</b><small>${type}${bits}</small></span>
    ${on ? `<span class="tc-mark" aria-hidden="true">${o.slot! + 1}</span>` : ''}</${tag}>`;
}
