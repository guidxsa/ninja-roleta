// Árvore de talentos da Jornada (docs/jornada/talentos.md#na-tela): tela cheia com o tema da classe, selos ligados
// por traços de pincel e um cartão com o talento escolhido. No celular, um ramo por vez em abas; no PC, todos lado a lado.
import type { JRun } from '../../src/core/jornada/run';
import { buyTalent, heroMods, talentContext, talentLearns, talentTreeComplete } from '../../src/core/jornada/run';
import { techPower } from '../../src/core/jornada/battle';
import {
  branchesOf,
  comboBranches,
  talentMaxRank,
  talentRank,
  talentRankCost,
  talentRequirements,
  talentState,
  type TalentNode,
  type TalentState,
} from '../../src/core/jornada/talents';
import { jornadaData as data } from '../../src/data/jornada';
import { ptBR as S } from '../../src/data/strings/ptBR';
import { clanSymbol, fighterPortrait, icon } from '../art';
import { h, openDialog } from '../dom';
import { tip } from '../tooltip';
import { techName } from './battle';
import type { JornadaHost } from './host';
import { themeOf, themeStyle } from './theme';

const J = S.jornada;
const T = J.talents;

const ROW = 112;
/** Coluna do nó no ramo, em % da largura. */
const colX = (n: TalentNode) => 50 + (n.col ?? 0) * 28;
const rowY = (n: TalentNode, tier = n.tier) => (tier - 1) * ROW + 44;

/** Ícone do selo: o da técnica ensinada, ou pelo tipo do bônus. */
function nodeIcon(run: JRun, n: TalentNode): string {
  const learn = talentLearns(run, n.id, data);
  const tech = learn ? data.techniques[learn] : null;
  if (tech) return icon(tech.clones || tech.hitsPerClone ? 'clones' : tech.shieldPct ? 'barrier' : tech.healHp ? 'medical' : tech.boost ? 'sparkle' : (tech.element ?? tech.type));
  const m = { ...n.mods, ...n.teamMods };
  if (m.gateLevels) return icon('gates');
  if (m.surviveOnce) return icon('willOfFire');
  if (m.startClones || m.extraClones || m.maxClonesBonus || m.cloneCounter || m.damagePerClone) return icon('clones');
  if (m.regenHp) return icon('heart');
  if (m.startShieldPct || m.reviveHpBonus) return icon('barrier');
  if (m.evasion) return icon('dodge');
  if (m.critBonus || m.effectChanceBonus) return icon('crit');
  if (m.chakraDiscount || n.xpMult) return icon('scroll');
  if (n.allyHpPct) return icon('heart');
  return icon('swords');
}

const nodeText = (run: JRun, n: TalentNode) => {
  const base = T.list[n.id] ?? { name: n.id, desc: '' };
  // Nós do ramo Elemento mostram a técnica do elemento sorteado.
  const learns = n.learnByElement ? talentLearns(run, n.id, data) : null;
  return learns ? { ...base, desc: `${base.desc} (${techName(learns)})` } : base;
};

export function talentTreeScreen(host: JornadaHost, run0: JRun, heroTitle: string): Promise<JRun> {
  let run = run0;
  let just: string | null = null;
  const nodes = data.talents.filter((n) => n.owner === run.hero);
  const theme = themeOf(run.hero);
  const ctx = () => talentContext(run, host.unlocked());
  const state = (n: TalentNode): TalentState => talentState(n, data.talents, ctx());
  const visible = () => nodes.filter((n) => state(n) !== 'hidden');
  const branches = () => branchesOf(run.hero, data.talents).filter((b) => visible().some((n) => n.branch === b));
  const startNode = visible().find((n) => ['available', 'upgradable'].includes(state(n))) ?? visible()[0];
  let selected = startNode?.id ?? null;
  let tab = startNode?.branch ?? branches()[0]!;

  const root = h(`<div class="jtree-screen ${theme.cls}" role="dialog" aria-label="${T.title}"${themeStyle(run)}><div class="jt-body"></div></div>`);
  openDialog(root);
  const body = root.querySelector<HTMLElement>('.jt-body')!;

  const branchName = (b: string) => (nodes.filter((n) => n.branch === b).every((n) => state(n) === 'accountLocked') ? T.hiddenName : T.branches[b]!);

  /** Talento de combinação: liga dois ramos (v0.71.0). */
  const isCombo = (n: TalentNode) => Boolean(n.requiresAll);
  /** O outro ramo de uma combinação, visto do ramo `b`. */
  const partner = (n: TalentNode, b: string) => comboBranches(n, data.talents).find((x) => x !== b) ?? b;

  function branchView(b: string): string {
    const own = visible().filter((n) => n.branch === b && !isCombo(n));
    // As combinações aparecem no pé dos dois ramos que ligam, lado a lado quando o ramo tem duas.
    const combos = visible().filter((n) => isCombo(n) && comboBranches(n, data.talents).includes(b));
    const list = [...own, ...combos];
    const rows = Math.max(...own.map((n) => n.tier)) + (combos.length ? 1 : 0);
    // A linha das combinações tem o nome do ramo parceiro embaixo: um pouco mais de altura.
    const height = rows * ROW + (combos.length ? 24 : 4);
    const place = (n: TalentNode): [number, number] => {
      const i = combos.indexOf(n);
      if (i < 0) return [colX(n), rowY(n)];
      return [combos.length > 1 ? 50 + (i === 0 ? -28 : 28) : 50, rowY(n, rows)];
    };
    const byId = new Map(own.map((n) => [n.id, n]));
    const edges = list
      .flatMap((n) =>
        talentRequirements(n, data.talents)
          .filter((r) => byId.has(r))
          .map((r) => {
            const from = byId.get(r)!;
            const fromOwned = ctx().owned.includes(r);
            const toOwned = ctx().owned.includes(n.id);
            const cls = fromOwned && toOwned ? 'on' : fromOwned && state(n) !== 'excluded' ? 'open' : 'off';
            const [x1, y1] = place(from);
            const [x2, y2] = place(n);
            const midY = (y1 + y2) / 2;
            const ink = just === n.id && toOwned ? ' ink' : '';
            // A linha da combinação é tracejada: ela vem de fora da sequência do ramo.
            return `<path class="${cls}${ink}${isCombo(n) ? ' combo' : ''}" pathLength="1" d="M${x1} ${y1}C${x1} ${midY} ${x2} ${midY} ${x2} ${y2}"/>`;
          }),
      )
      .join('');
    const seals = list
      .map((n) => {
        const st = state(n);
        const rank = talentRank(n, ctx());
        const max = talentMaxRank(n);
        const hidden = st === 'accountLocked';
        const pips = max > 1 ? `<span class="jt-pips" aria-label="${T.rank(rank, max)}">${Array.from({ length: max }, (_, i) => `<i class="${i < rank ? 'on' : ''}"></i>`).join('')}</span>` : '';
        // Talento final do ramo (capstone) e nó dado pela história ganham marca própria.
        const marks = `${n.capstone ? ' capstone' : ''}${n.grantedBy ? ' story' : ''}${isCombo(n) ? ' combo' : ''}`;
        const [x, y] = place(n);
        // Talento final aprendido agora: o kanji do ramo acende atrás do selo.
        const kanji = n.capstone && n.id === just ? `<b class="jt-kanji kanji" aria-hidden="true">${T.branchKanji[n.branch] ?? ''}</b>` : '';
        const link = isCombo(n) ? `<small class="jt-link">+ ${T.branches[partner(n, b)] ?? ''}</small>` : '';
        return `<button type="button" class="jt-node st-${st}${marks}${n.id === selected ? ' sel' : ''}${n.id === just ? ' just' : ''}" data-node="${n.id}" style="left:${x}%;top:${y}px">
          ${kanji}<span class="jt-seal"><span>${hidden ? icon('lock') : nodeIcon(run, n)}</span></span>
          <span class="jt-name">${hidden ? T.hiddenName : nodeText(run, n).name}</span>${link}${pips}</button>`;
      })
      .join('');
    // A contagem do ramo é a dos nós dele; a combinação conta no ramo dono.
    const counted = list.filter((n) => n.branch === b);
    const got = counted.filter((n) => ctx().owned.includes(n.id)).length;
    return `<section class="jt-branch${b === tab ? ' on' : ''}" data-branch="${b}">
      <h3>${branchName(b)} <small>${got}/${counted.length}</small></h3>
      <div class="jt-grid" style="height:${height}px"><svg class="jt-lines" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>${seals}</div>
    </section>`;
  }

  /** Dano da técnica que o nó ensina, com os bônus da run: o nível atual e o próximo (o upar aparece no número). */
  function powerLine(n: TalentNode): string {
    const learns = talentLearns(run, n.id, data);
    const tech = learns ? data.techniques[learns] : null;
    if (!tech || tech.baseDamage <= 0) return '';
    const rank = talentRank(n, ctx());
    const at = (r: number) =>
      techPower(tech, heroMods({ ...run, talents: rank ? run.talents : [...run.talents, n.id], talentRanks: { ...run.talentRanks, [n.id]: r } }, data));
    const next = rank >= 1 && rank < talentMaxRank(n) ? at(rank + 1) : null;
    return `<small class="jt-power">${T.power(techName(tech.id), at(Math.max(1, rank)), next, tech.hits ?? 1)}</small>`;
  }

  function detailView(): string {
    const n = nodes.find((x) => x.id === selected);
    if (!n) return `<p class="muted center">${T.pick}</p>`;
    const st = state(n);
    if (st === 'accountLocked') return `<div class="jt-card"><b>${T.hiddenName}</b><small>${T.states.accountLocked}</small></div>`;
    const txt = nodeText(run, n);
    const rank = talentRank(n, ctx());
    const max = talentMaxRank(n);
    const canUp = st === 'upgradable';
    const action =
      st === 'available'
        ? `<button class="btn primary big" data-buy>${T.learn(T.cost(n.cost))}</button>`
        : canUp
          ? `<button class="btn primary big" data-buy>${T.rankUp(rank + 1, T.cost(talentRankCost(n)))}</button>`
          : '';
    // Combinação: de quais ramos é e, se fechada, o que falta aprender em cada um.
    const pair = comboBranches(n, data.talents);
    const missing = (n.requiresAll ?? []).filter((id) => !ctx().owned.includes(id)).map((id) => nodeText(run, nodes.find((x) => x.id === id)!).name);
    const comboLine = isCombo(n) ? `<small class="jt-combo">${T.comboOf(T.branches[pair[0]!] ?? '', T.branches[pair[1]!] ?? '')}${missing.length ? ` · ${T.comboNeeds(missing.join(', '))}` : ''}</small>` : '';
    const status = st === 'locked' && isCombo(n) ? '' : st === 'owned' && max > 1 && rank < max ? T.rankUp(rank + 1, T.cost(talentRankCost(n))) : st === 'owned' || st === 'maxed' ? (max > 1 ? T.states.maxed : T.states.owned) : st === 'noPoints' ? `${T.cost(n.cost)} · ${T.states.noPoints}` : st === 'available' || st === 'upgradable' ? (max > 1 ? '' : T.unique) : T.states[st]!;
    return `<div class="jt-card"><b>${txt.name}</b>
      ${max > 1 ? `<small class="jt-rank">${T.rank(rank, max)}${txt.rank ? ` · ${txt.rank}` : ''}</small>` : ''}
      ${comboLine}${n.capstone ? `<small class="jt-final">${T.final}</small>` : ''}
      <small>${txt.desc}</small>
      ${powerLine(n)}
      ${n.excludes && st === 'available' ? `<small class="jt-choice">${T.choiceHint}</small>` : ''}
      ${status ? `<small class="jt-status st-${st}">${status}</small>` : ''}</div>${action}`;
  }

  const render = () => {
    const hero = fighterPortrait(run.hero, run.skin ? `ninja:${run.skin}` : (data.characters[run.hero]?.portrait ?? 'ninja:common'), 'sm');
    const scroll = root.scrollTop;
    body.innerHTML = `<span class="jt-crest" aria-hidden="true">${clanSymbol(theme.crest)}</span>
      <header class="jt-head">${hero}<div class="jt-title"><h2>${T.title}</h2><small>${heroTitle}</small>${
        talentTreeComplete(run, data, host.unlocked())
          ? `<span class="chip jt-complete"${tip(T.complete, T.completeTip(data.j.talentTree.completeRyoPerPoint))}>${icon('check')} ${T.complete}</span>`
          : ''
      }</div>
        <span class="jt-points${run.talentPoints ? ' has' : ''}${just ? ' spent' : ''}"><b>${run.talentPoints}</b><small>${run.talentPoints === 1 ? T.pointOne : T.pointMany}</small></span>
        <button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></header>
      <nav class="jt-tabs">${branches()
        .map((b) => {
          const list = visible().filter((n) => n.branch === b);
          const got = list.filter((n) => ctx().owned.includes(n.id)).length;
          const canBuy = list.some((n) => ['available', 'upgradable'].includes(state(n)));
          return `<button type="button" class="jt-tab${b === tab ? ' on' : ''}${canBuy ? ' can' : ''}" data-tab="${b}"><b>${branchName(b)}</b><small>${got}/${list.length}</small></button>`;
        })
        .join('')}</nav>
      <div class="jt-branches">${branches().map(branchView).join('')}</div>
      <div class="jt-detail" aria-live="polite">${detailView()}</div>`;
    root.scrollTop = scroll;
    just = null;
  };
  render();

  return new Promise((resolve) => {
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-close]')) {
        root.remove();
        return resolve(run);
      }
      const tabBtn = t.closest<HTMLElement>('[data-tab]');
      if (tabBtn) {
        tab = tabBtn.dataset.tab!;
        const first = visible().filter((n) => n.branch === tab);
        selected = (first.find((n) => ['available', 'upgradable'].includes(state(n))) ?? first[0])?.id ?? null;
        return render();
      }
      const nodeBtn = t.closest<HTMLElement>('[data-node]');
      if (nodeBtn) {
        selected = nodeBtn.dataset.node!;
        // A combinação mora em dois ramos: tocar nela não troca a aba em que o jogador está.
        tab = nodeBtn.closest<HTMLElement>('[data-branch]')?.dataset.branch ?? nodes.find((n) => n.id === selected)!.branch;
        return render();
      }
      if (t.closest('[data-buy]') && selected) {
        run = buyTalent(run, selected, host.unlocked(), data);
        just = selected;
        host.mood('good');
        render();
      }
    });
  });
}
