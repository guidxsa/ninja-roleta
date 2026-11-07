// Ficha da equipe da Jornada (v0.43.0): o mesmo pergaminho da Ficha do Roleta, com uma aba por membro (protagonista e
// os suportes da próxima luta). Status, técnicas com o dano da run, bônus e, no protagonista, relíquias, bolsa e a
// configuração da run. Na luta, HP e chakra são os de agora.
import type { FighterMods, JTechnique } from '../../src/core/jornada/types';
import {
  afterWinRecovery,
  allyTechniques,
  CONSUMABLES,
  elementOf,
  heroActives,
  heroMods,
  memberSheet,
  memberState,
  nextFightTeam,
  supportClass,
  teamMods,
  type JRun,
} from '../../src/core/jornada/run';
import { techPower } from '../../src/core/jornada/battle';
import { jornadaData as data } from '../../src/data/jornada';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { clanSymbol, fighterPortrait, icon } from '../art';
import { esc, h } from '../dom';
import { ELEMENT_COLORS, elementChip } from '../tips';
import { tip } from '../tooltip';
import { liveBattle, liveBattleRun, memberLabel, techName, techTip } from './battle';
import type { JornadaHost } from './host';
import { relicSlot } from './relics';
import { themeOf } from './theme';

const J = S.jornada;
const F = J.sheet;
const pct = (n: number) => Math.round(n * 100);
const fmtMult = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

const portraitSpec = (run: JRun, id: string) => (run.skin && id === run.hero ? `ninja:${run.skin}` : (data.characters[id]?.portrait ?? 'ninja:common'));

/** Brasão do membro: o tema da classe do protagonista; nos suportes, o da classe ou o da ficha. */
function crestOf(run: JRun, id: string): string {
  if (id === run.hero) return themeOf(run.hero).crest;
  const cls = supportClass(id, data);
  if (cls) return cls.id;
  const key = (data.characters[id]?.portrait ?? '').split(':')[1] ?? '';
  return ['uchiha', 'hyuuga', 'nara', 'akimichi', 'inuzuka', 'uzumaki', 'taijutsuProdigy'].includes(key) ? key : 'common';
}

/** Classe por extenso: a do Caminho Ninja (prodígio à parte); na História, o próprio personagem. */
function className(run: JRun, id: string): string {
  if (id === run.hero) {
    if (run.mode !== 'generic') return J.names[id] ?? id;
    return id === 'prodigy' ? (J.names.prodigy ?? id) : (J.genericStart.classes[run.classId]?.name ?? run.classId);
  }
  const cls = supportClass(id, data);
  return cls ? `${J.genericStart.classes[cls.id]?.name ?? cls.id} · ${F.support}` : F.support;
}

/** Bônus resumidos em chips (só o que não é neutro). */
function modChips(m: FighterMods): string[] {
  const M = F.mods;
  const out: string[] = [];
  if (m.damageMult !== 1) out.push(M.damageMult(fmtMult(m.damageMult)));
  for (const [t, x] of Object.entries(m.typeDamageMult)) if (x !== 1) out.push(M.typeDamageMult(J.types[t] ?? t, fmtMult(x)));
  if (m.taijutsuFlat) out.push(M.taijutsuFlat(m.taijutsuFlat));
  if (m.critBonus) out.push(M.critBonus(pct(m.critBonus)));
  if (m.accuracyBonus) out.push(M.accuracyBonus(pct(m.accuracyBonus)));
  if (m.evasion) out.push(M.evasion(pct(m.evasion)));
  if (m.regenHp) out.push(M.regenHp(m.regenHp));
  if (m.lowHpDamageMult !== 1) out.push(M.lowHpDamageMult(fmtMult(m.lowHpDamageMult)));
  if (m.startClones) out.push(M.startClones(m.startClones));
  if (m.extraClones) out.push(M.extraClones(m.extraClones));
  if (m.startShieldPct) out.push(M.startShieldPct(pct(m.startShieldPct)));
  if (m.chakraDiscount) out.push(M.chakraDiscount(m.chakraDiscount));
  if (m.surviveOnce) out.push(M.surviveOnce);
  if (m.reviveHpBonus) out.push(M.reviveHpBonus(pct(m.reviveHpBonus)));
  if (m.startChakra) out.push(M.startChakra(m.startChakra));
  if (m.gateLevels) out.push(M.gateLevels(1 + m.gateLevels));
  if (m.cloneCounter) out.push(M.cloneCounter(m.cloneCounter));
  if (m.damagePerClone) out.push(M.damagePerClone(pct(m.damagePerClone)));
  if (m.stunnedDamageMult !== 1) out.push(M.stunnedDamageMult(fmtMult(m.stunnedDamageMult)));
  if (m.effectChanceBonus) out.push(M.effectChanceBonus(pct(m.effectChanceBonus)));
  for (const [id, x] of Object.entries(m.techDamageMult)) if (x !== 1) out.push(M.techDamageMult(techName(id), fmtMult(x)));
  for (const [id, n] of Object.entries(m.techChakraDiscount)) if (n) out.push(M.techChakraDiscount(techName(id), n));
  return out;
}

/** Linha de técnica: ícone na cor do elemento (ou do tipo), nome e os números principais; o resto na dica. */
function techRow(t: JTechnique, mods: FighterMods): string {
  const power = techPower(t, mods);
  const cost = Math.max(0, t.chakraCost - mods.chakraDiscount - (mods.techChakraDiscount[t.id] ?? 0));
  const bits = [
    t.baseDamage > 0 ? `${J.battle.damage(power)}${(t.hits ?? 1) > 1 ? `×${t.hits}` : ''}` : '',
    t.healHp ? F.heal(t.healHp) : '',
    t.shieldPct ? F.shield(pct(t.shieldPct)) : '',
    t.clones ? `${icon('clones')} +${t.clones + mods.extraClones}` : '',
    cost ? J.battle.chakra(cost) : '',
    t.hpCostPct ? `${pct(t.hpCostPct)}% HP` : '',
  ].filter(Boolean);
  const color = t.element ? ELEMENT_COLORS[t.element] : `var(--t-${t.type})`;
  const ico = t.gates ? 'gates' : t.clones ? 'clones' : t.boost ? 'sparkle' : (t.element ?? t.type);
  return `<li class="tech-card" style="--c:${color}"${techTip(t, undefined, mods)}><span class="tc-ico">${icon(ico)}</span>
    <span class="tc-txt"><b>${techName(t.id)}</b><small>${[J.types[t.type] ?? t.type, ...bits].join(' · ')}</small></span></li>`;
}

function bar(kind: 'hp' | 'ck', cur: number, max: number): string {
  const label = kind === 'hp' ? S.stats.hp : S.stats.chakra;
  return `<div class="bar bar-${kind}"><div class="fill" style="width:${max ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0}%"></div><span>${label} ${Math.max(0, cur)}/${max}</span></div>`;
}

function attrRow(key: 'taijutsu' | 'ninjutsu' | 'genjutsu' | 'speed' | 'physical' | 'mental', value: number, top: number): string {
  const w = top > 0 ? Math.max(6, Math.min(100, (value / top) * 100)) : 0;
  return `<li${tip(S.stats[key], S.tips.stats[key])}><span>${S.stats[key]}</span><b>${value}</b><i style="width:${w}%"></i></li>`;
}

/** Uma aba da Ficha. */
function memberView(host: JornadaHost, run: JRun, id: string): string {
  const hero = id === run.hero;
  const sheet = memberSheet(run, id, data);
  const now = liveBattle?.().fighters.find((f) => f.side === 'ally' && f.defId === id);
  const st = now ? { hp: now.hp, chakra: now.chakra } : memberState(run, id, data);
  const maxHp = now?.maxHp ?? sheet.maxHp;
  const maxChakra = now?.maxChakra ?? sheet.maxChakra;
  const def = data.characters[id]!;
  const el = elementOf(run, id, data);
  const els = [el, hero ? run.secondElement : null].filter((e): e is NonNullable<typeof e> => Boolean(e));
  const mods = hero ? heroMods(run, data) : teamMods(run, data);
  const o = sheet.offense;
  const r = sheet.resistance;
  const top = Math.max(o.taijutsu, o.ninjutsu, o.genjutsu, sheet.speed, r.physical, r.mental);
  const techs = (hero ? run.moveset : allyTechniques(run, id, data)).map((t) => data.techniques[t]).filter((t) => t !== undefined);
  const actives = hero ? heroActives(run, data).map((t) => data.techniques[t]!).filter(Boolean) : [];
  const chips = modChips(mods);
  const recovery = afterWinRecovery(run, data);
  const bag = CONSUMABLES.filter((k) => run.bag[k] > 0).map((k) => `<span class="chip"${tip(J.items[k]!.name, J.items[k]!.desc)}>${icon('kit')} ${J.items[k]!.name} ×${run.bag[k]}</span>`);
  const fields = [
    `<div><dt>${F.fields.class}</dt><dd>${esc(className(run, id))}</dd></div>`,
    `<div><dt>${F.fields.level}</dt><dd><span class="lvl">${run.level}</span></dd></div>`,
    `<div><dt>${F.fields.element}</dt><dd class="chips-left">${els.length ? els.map((e) => elementChip(e)).join('') : `<span class="chip">${F.noElement}</span>`}</dd></div>`,
    hero
      ? `<div><dt>${F.fields.difficulty}</dt><dd><span class="chip diff-${run.difficulty}">${S.difficulty[run.difficulty].name}</span></dd></div>
         <div><dt>${F.fields.recovery}</dt><dd>${F.recovery(recovery.hp, recovery.chakra)}</dd></div>`
      : `<div><dt>${F.fields.role}</dt><dd><small>${J.ai[def.ai] ?? ''}</small></dd></div>`,
  ].join('');
  return `<section class="jsheet-member" data-member="${id}">
    <span class="hanko" aria-hidden="true">${clanSymbol(crestOf(run, id))}</span>
    <header class="sheet-head">
      ${fighterPortrait(id, portraitSpec(run, id), 'lg')}
      <div class="sheet-id">
        <h2 class="sheet-name">${esc(memberLabel(run, id, host.playerName()))}</h2>
        <dl class="sheet-fields">${fields}</dl>
      </div>
    </header>
    ${now ? `<p class="jsheet-live">${icon('swords')} ${F.live}</p>` : ''}
    ${bar('hp', st.hp, maxHp)}
    ${maxChakra > 0 ? bar('ck', st.chakra, maxChakra) : ''}
    <h3 class="sheet-title">${F.attributes}</h3>
    <ul class="attr-list">
      ${attrRow('taijutsu', o.taijutsu, top)}${attrRow('ninjutsu', o.ninjutsu, top)}${attrRow('genjutsu', o.genjutsu, top)}
      ${attrRow('speed', sheet.speed, top)}${attrRow('physical', r.physical, top)}${attrRow('mental', r.mental, top)}
    </ul>
    <h3 class="sheet-title">${hero ? F.moveset : F.techniques}</h3>
    <ul class="techs">${techs.map((t) => techRow(t, mods)).join('')}</ul>
    ${actives.length ? `<h3 class="sheet-title">${F.actives}</h3><ul class="techs">${actives.map((t) => techRow(t, mods)).join('')}</ul>` : ''}
    <p class="tip-hint">${icon('info')} ${S.tips.hint}</p>
    <h3 class="sheet-title">${hero ? F.bonuses : F.teamBonuses}</h3>
    ${chips.length ? `<div class="mods">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>` : `<p class="muted small">${F.noBonus}</p>`}
    ${
      hero
        ? `<h3 class="sheet-title">${F.relics}</h3>${run.relics.length ? `<div class="jrbar">${run.relics.map((rid) => relicSlot(rid, 'span')).join('')}</div>` : ''}
           <h3 class="sheet-title">${F.bag}</h3>${bag.length ? `<div class="mods">${bag.join('')}</div>` : `<p class="muted small">${F.bagEmpty}</p>`}`
        : ''
    }
  </section>`;
}

/** Abre a Ficha da equipe sobre qualquer tela (inclusive no meio da luta). */
export function openJornadaSheet(host: JornadaHost, run0: JRun): void {
  if (document.querySelector('.sheet-wrap')) return;
  // Na luta, a run dela (com a bolsa já descontada).
  const run = liveBattleRun?.() ?? run0;
  const team = [run.hero, ...nextFightTeam(run, data).filter((id) => id !== run.hero)];
  let tab = team[0]!;
  const overlay = h(`<div class="sheet-wrap jsheet" role="dialog" aria-label="${F.title}">
    <div class="scroll">
      <div class="rod"></div>
      <div class="scroll-paper">
        <p class="sheet-kicker"><span class="kanji" aria-hidden="true">忍</span>${F.kicker}</p>
        ${team.length > 1 ? `<nav class="jsheet-tabs" role="tablist">${team.map((id) => `<button type="button" class="jsheet-tab" role="tab" data-tab="${id}">${fighterPortrait(id, portraitSpec(run, id), 'sm')}<span>${esc(memberLabel(run, id, host.playerName()))}<small>${id === run.hero ? F.protagonist : F.support}</small></span></button>`).join('')}</nav>` : ''}
        <div data-member-slot></div>
      </div>
      <div class="rod"></div>
      <button class="btn primary sheet-close" data-close>${S.ui.close}</button>
    </div></div>`);
  const render = () => {
    overlay.querySelector('[data-member-slot]')!.innerHTML = memberView(host, run, tab);
    overlay.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  };
  overlay.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === overlay || t.closest('[data-close]')) return overlay.remove();
    const b = t.closest<HTMLElement>('[data-tab]');
    if (b) {
      tab = b.dataset.tab!;
      render();
    }
  });
  render();
  document.body.appendChild(overlay);
}
