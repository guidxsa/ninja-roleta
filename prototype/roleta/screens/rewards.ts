// Roleta: nível, upgrade, aviso entre ciclos, relíquia da vitória e baú do chefe.
import { canLevelUp, upgradeTechnique, techniqueLevel } from '../../../src/core/player';
import { upgradeOptions, type Step, forfeitUpgrade, chooseUpgrade, levelUp, xpStep } from '../../../src/core/progression';
import { rollRelicReward, gainRoletaRelic, rewardXp } from '../../../src/core/roleta/run';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { type RCategory } from '../../../src/data/roleta/villains';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { icon, clanSymbol } from '../../art';
import { mood } from '../../audio';
import { show, h, esc, choose, sleep } from '../../dom';
import { relicIcon } from '../../jornada/relicIcons';
import { relicName, relicCard, relicTier } from '../../jornada/relics';
import { data, rstage, playerPanel, techName, roman, applyStep, showEffect, bigWheel, PALETTE, discoverRoletaRelics, stepLog } from '../common';
import { ses } from '../session';

// ---------------------------------------------------------------------------
// Tela: recompensa

/**
 * Mostra uma tela por nível completado (XP de vilões, roletas e pergaminhos) e resolve os upgrades
 * à escolha pendentes (marcos, pergaminho, recompensa). O XP de um upgrade sem alvo pode subir de nível.
 */
export async function levelUps(): Promise<void> {
  while (ses.camp && (canLevelUp(ses.camp.player, data) || ses.camp.player.pendingUpgrades > 0)) {
    if (canLevelUp(ses.camp.player, data)) await levelUpScreen();
    else await upgradeScreen();
  }
}

/** Gasta um upgrade pendente: o jogador escolhe a técnica (sem alvo, vira XP). */
export async function upgradeScreen(): Promise<void> {
  const c = ses.camp!;
  const root = show(
    h(`<div class="screen rwheel"><h2>${S.ui.upgradeTitle}</h2><div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="results"></div><div id="hud"></div><div id="cta"></div></div></div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods);
  const options = upgradeOptions(c.player, data);
  let step: Step;
  if (options.length === 0) {
    slot.innerHTML = `<p class="center muted">${S.ui.upgradeNone}</p>`;
    step = forfeitUpgrade(c.player, data);
  } else {
    const label = (id: string) => {
      const after = upgradeTechnique(c.player, id, data);
      const to = after.techniques.find((t) => !c.player.techniques.includes(t)) ?? id;
      return S.ui.upgradeTo(esc(techName(id)), esc(techName(to)), roman(techniqueLevel(after, to, data)));
    };
    slot.innerHTML = `<div class="wheel-box"><p class="center">${S.ui.upgradeChoose(c.player.pendingUpgrades)}</p>
      <div class="act-grid">${options.map((id) => `<button class="btn" data-choice="${id}">${label(id)}</button>`).join('')}</div></div>`;
    step = chooseUpgrade(c.player, await choose<string>(slot), data);
    slot.innerHTML = '';
  }
  applyStep(step);
  showEffect(root.querySelector<HTMLElement>('#results')!, step.effect);
  hud.innerHTML = playerPanel(c.player, c.mods);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
}

export async function levelUpScreen(): Promise<void> {
  const c = ses.camp!;
  const root = show(
    h(`<div class="screen rwheel"><h2>${S.ui.levelUpTitle}</h2><p class="center"><span class="chip tier tier-2">${S.ui.levelLabel(c.player.level + 1)}</span></p>
      <div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="results"></div><div id="hud"></div><div id="cta"></div></div></div>`),
  );
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods);

  await sleep(ses.settings.instant ? 0 : 300);
  const step = levelUp(c.player, data);
  applyStep(step);
  showEffect(root.querySelector<HTMLElement>('#results')!, step.effect);
  // Despertar da linhagem nos níveis 4 e 7.
  // Sem despertar no Roleta enxuto: as técnicas sobem sozinhas com o nível.
  const awakening = undefined as string | undefined;
  if (awakening) {
    root
      .querySelector<HTMLElement>('#results')!
      .insertAdjacentHTML('beforeend', `<div class="result-card pop"><h3>${clanSymbol(c.player.origin.lineageId)} ${S.ui.awakeningTitle(c.player.level)}</h3><p>${awakening}</p></div>`);
  }
  hud.innerHTML = playerPanel(c.player, c.mods);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
}

/** Aviso simples entre telas (ex.: restauração do fim do exame). */
export async function noticeScreen(title: string, text: string): Promise<void> {
  const c = ses.camp!;
  const root = show(
    h(`<div class="screen rwheel"><h2>${title}</h2><div class="rstage-box">${rstage()}</div>
      <div class="rside"><div class="effect pop">${text}</div><div id="hud">${playerPanel(c.player, c.mods)}</div>
      <div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div></div></div>`),
  );
  await choose(root);
}

/** Cores da roleta de raridade da relíquia. */
export const RELIC_TIER_COLORS: Record<string, string> = { common: '#5d6168', uncommon: '#4e8a68', rare: '#3f5f9e' };

/**
 * Relíquia da vitória (docs/roleta/run.md#recompensa): a roleta da raridade, com os pesos da categoria do vilão, e a
 * da relíquia (as que faltam). Sem escolha. Sem nenhuma para sortear, vale o XP de uma recompensa rara.
 */
export async function relicRewardScreen(cat: RCategory): Promise<void> {
  const c = ses.camp!;
  const RR = S.roleta.run;
  const root = show(
    h(`<div class="screen rwheel"><h2>${RR.relicRewardTitle}</h2><p class="center"><span class="chip">${RR.categories[cat]}</span></p>
      <div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="results"></div><div id="hud"></div><div id="cta"></div></div></div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const results = root.querySelector<HTMLElement>('#results')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  hud.innerHTML = playerPanel(c.player, c.mods);
  const roll = rollRelicReward(c.player, cat, c.run.cycle, rdata, ses.rng);
  const tiers = S.jornada.relics.tiers;
  if (roll.tierStep) {
    await bigWheel(slot, S.roulettes.relicTier, roll.tierStep.slices.map((s) => ({ label: tiers[s.value] ?? s.value, weight: s.weight, color: RELIC_TIER_COLORS[s.value] ?? PALETTE[0]! })), roll.tierStep.index);
  }
  if (roll.relicStep) {
    await bigWheel(
      slot,
      S.roulettes.relic,
      roll.relicStep.slices.map((s, i) => ({ label: relicName(s.value), weight: s.weight, color: PALETTE[i % PALETTE.length]!, icon: relicIcon(s.value) })),
      roll.relicStep.index,
    );
  }
  if (roll.relic) {
    c.player = gainRoletaRelic(c.player, roll.relic, rdata);
    discoverRoletaRelics([roll.relic]);
    results.innerHTML = relicCard(roll.relic, '', 'pop', 'roleta');
    stepLog()?.items.push(`${icon('sparkle')} ${relicName(roll.relic)}`);
    mood('good');
  } else {
    const step = xpStep(c.player, rewardXp(c.player, 2, rdata), data);
    applyStep(step);
    showEffect(results, step.effect);
  }
  hud.innerHTML = playerPanel(c.player, c.mods);
  hud.firstElementChild?.classList.add('pulse');
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn primary big" data-choice="ok">${S.ui.continue}</button></div>`;
  await choose(cta);
  await levelUps();
}

/** Baú do chefe: 3 relíquias lado a lado; tocar destaca, o botão confirma. */
export async function chestScreen(options: string[]): Promise<string> {
  const RR = S.roleta.run;
  discoverRoletaRelics(options);
  let pick: string | undefined;
  const root = show(h(`<div class="screen jrboss"><h2>${RR.chestTitle}</h2>
    <div class="jrboss-row">${options
      .map((id) => `<button type="button" class="jrboss-opt tier-${relicTier(id)}" data-opt="${id}" aria-label="${relicName(id)}">
        <span class="jrslot huge tier-${relicTier(id)}">${relicIcon(id)}</span><b>${relicName(id)}</b></button>`)
      .join('')}</div>
    <div data-detail><p class="muted center">${RR.chestPick}</p></div>
    <div class="sticky-cta"><button class="btn primary big" data-choice="take" disabled>${RR.chestTakeIdle}</button></div></div>`));
  const take = root.querySelector<HTMLButtonElement>('[data-choice="take"]')!;
  root.querySelector('.jrboss-row')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-opt]');
    if (!b) return;
    pick = b.dataset.opt!;
    root.querySelectorAll('[data-opt]').forEach((x) => x.classList.toggle('on', x === b));
    root.querySelector('[data-detail]')!.innerHTML = relicCard(pick, '', 'pop', 'roleta');
    take.disabled = false;
    take.textContent = RR.chestTake(relicName(pick));
  });
  await choose(root.querySelector('.sticky-cta')!);
  mood('good');
  return pick!;
}
