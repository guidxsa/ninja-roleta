// Tela de moveset da Jornada (v0.43.0): tela cheia com o tema da classe, como a árvore de talentos. As 4 vagas em
// cima, as ativas de classe (sempre disponíveis) e as técnicas conhecidas agrupadas por origem. Só interface: as
// regras são as de setMoveset/heroMovable/heroActives.
import { techPower } from '../../src/core/jornada/battle';
import { heroActives, heroMods, heroMovable, MOVESET_SIZE, setMoveset, type JRun } from '../../src/core/jornada/run';
import type { FighterMods, JTechnique } from '../../src/core/jornada/types';
import { jornadaData as data } from '../../src/data/jornada';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { clanSymbol, fighterPortrait, icon } from '../art';
import { h } from '../dom';
import { ELEMENT_COLORS } from '../tips';
import { techName, techTip } from './battle';
import { themeOf, themeStyle } from './theme';

const J = S.jornada;
const U = J.ui;

/** Ícone da técnica: clones, fortalecimento, portões, escudo, cura, ou o elemento/tipo. */
function techIcon(t: JTechnique): string {
  return icon(t.gates ? 'gates' : t.clones || t.hitsPerClone ? 'clones' : t.boost ? 'sparkle' : t.shieldPct ? 'barrier' : t.healHp ? 'medical' : (t.element ?? t.type));
}

const techColor = (t: JTechnique) => (t.element ? ELEMENT_COLORS[t.element] : `var(--t-${t.type})`);

/** Números principais: dano (com os bônus da run), golpes, clones e custo. */
function techBits(t: JTechnique, mods: FighterMods): string {
  const power = techPower(t, mods);
  const cost = Math.max(0, t.chakraCost - mods.chakraDiscount - (mods.techChakraDiscount[t.id] ?? 0));
  return [
    t.baseDamage > 0 ? `<span${power > t.baseDamage ? ' class="up"' : ''}>${J.battle.damage(power)}${(t.hits ?? 1) > 1 ? `×${t.hits}` : ''}</span>` : '',
    t.clones ? `${icon('clones')} +${t.clones + mods.extraClones}` : '',
    cost ? J.battle.chakra(cost) : '',
    t.hpCostPct ? `${Math.round(t.hpCostPct * 100)}% HP` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** De onde a técnica veio: kit da ficha, elemento ou talentos/eventos. */
function groupOf(run: JRun, id: string): 'kit' | 'element' | 'talents' {
  if (run.learned.includes(id)) return 'talents';
  const def = data.characters[run.hero]!;
  if (def.techniques.includes(id) || def.spareTechniques?.includes(id)) return 'kit';
  return 'element';
}

export function movesetScreen(run: JRun): Promise<JRun> {
  const known = heroMovable(run, data);
  const actives = heroActives(run, data).map((id) => data.techniques[id]!).filter(Boolean);
  const mods = heroMods(run, data);
  const theme = themeOf(run.hero);
  const el = run.elements[run.hero];
  const subtitle = (U.movesetThemes[run.hero] ?? U.movesetThemes.commonNinja!)(el ? S.elements[el] : '');
  const picked: string[] = run.moveset.filter((id) => known.includes(id));
  let fullFlash = false;

  const root = h(`<div class="jtree-screen jmoves-screen ${theme.cls}" role="dialog" aria-label="${U.movesetName}"${themeStyle(run)}><div class="jt-body"></div></div>`);
  document.body.appendChild(root);
  const body = root.querySelector<HTMLElement>('.jt-body')!;
  const hero = fighterPortrait(run.hero, run.skin ? `ninja:${run.skin}` : (data.characters[run.hero]?.portrait ?? 'ninja:common'), 'sm');

  const slot = (i: number) => {
    const id = picked[i];
    const t = id ? data.techniques[id] : undefined;
    if (!t) return `<div class="jm-slot empty"><span class="jm-seal"><span>${i + 1}</span></span><b>${U.movesetEmpty}</b></div>`;
    return `<button type="button" class="jm-slot" data-move="${t.id}" style="--c:${techColor(t)}"${techTip(t, undefined, mods)}>
      <span class="jm-seal"><span>${techIcon(t)}</span></span><b>${techName(t.id)}</b><small>${techBits(t, mods)}</small></button>`;
  };
  const card = (t: JTechnique) => {
    const on = picked.includes(t.id);
    return `<button type="button" class="jm-card${on ? ' on' : ''}" data-move="${t.id}" aria-pressed="${on}" style="--c:${techColor(t)}"${techTip(t, undefined, mods)}>
      <span class="jm-ico">${techIcon(t)}</span><span class="jm-txt"><b>${techName(t.id)}</b><small>${techBits(t, mods)}</small></span>
      ${on ? `<span class="jm-mark" aria-hidden="true">${picked.indexOf(t.id) + 1}</span>` : ''}</button>`;
  };

  const render = () => {
    const groups = (['kit', 'element', 'talents'] as const)
      .map((g) => ({ g, list: known.filter((id) => groupOf(run, id) === g).map((id) => data.techniques[id]!) }))
      .filter((x) => x.list.length);
    const scroll = root.scrollTop;
    body.innerHTML = `<span class="jt-crest" aria-hidden="true">${clanSymbol(theme.crest)}</span>
      <header class="jt-head">${hero}<div class="jt-title"><h2>${U.movesetName}</h2><small>${subtitle}</small></div>
        <span class="jt-points${picked.length === MOVESET_SIZE ? ' has' : ''}"><b>${picked.length}/${MOVESET_SIZE}</b><small>${U.movesetEquipped}</small></span>
        <button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></header>
      <h3 class="jm-title">${U.movesetSlots}</h3>
      <div class="jm-slots${fullFlash ? ' full' : ''}">${Array.from({ length: MOVESET_SIZE }, (_, i) => slot(i)).join('')}</div>
      ${fullFlash ? `<p class="jm-warn" role="status">${U.movesetFull}</p>` : ''}
      ${actives.length ? `<h3 class="jm-title">${U.actives}</h3><div class="jm-actives">${actives.map((t) => `<span class="jm-active" style="--c:${techColor(t)}"${techTip(t, undefined, mods)}><span class="jm-seal"><span>${techIcon(t)}</span></span><b>${techName(t.id)}</b><small>${techBits(t, mods)}</small></span>`).join('')}</div>` : ''}
      <h3 class="jm-title">${U.movesetKnown}</h3>
      ${groups.map(({ g, list }) => `<section class="jm-group"><h4>${U.movesetGroups[g]}</h4><div class="jm-list">${list.map(card).join('')}</div></section>`).join('')}
      <div class="jt-detail jm-foot"><small class="muted">${U.movesetHelp}</small><button class="btn primary big" data-save ${picked.length ? '' : 'disabled'}>${U.save}</button></div>`;
    root.scrollTop = scroll;
    fullFlash = false;
  };
  render();

  return new Promise((resolve) => {
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-close]')) {
        root.remove();
        return resolve(run);
      }
      if (t.closest('[data-save]') && picked.length) {
        root.remove();
        return resolve(setMoveset(run, picked, data));
      }
      const b = t.closest<HTMLElement>('[data-move]');
      if (!b) return;
      const id = b.dataset.move!;
      const at = picked.indexOf(id);
      if (at >= 0) picked.splice(at, 1);
      else if (picked.length < MOVESET_SIZE) picked.push(id);
      else fullFlash = true;
      render();
    });
  });
}
