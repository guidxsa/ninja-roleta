// Roleta: evento pré-luta (e os subfluxos de jokenpô e invocação).
import { rollWeighted, type Step, applySimpleEvent, applyTrainingFocus, rollTraining, applyTraining, rollAkatsuki, applyAkatsuki, rollGuru, applyGuru, rollPremiumChoices, applyPremium, applyClanLesson, HANDS, type Hand, playJokenpo, applySummonEncounter, rollSummonAnimal } from '../../../src/core/progression';
import { contractFor, gainRoletaRelic } from '../../../src/core/roleta/run';
import { addEffect, addPreEvent, addJokenpo } from '../../../src/core/runStats';
import { type Element } from '../../../src/core/types';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { icon } from '../../art';
import { show, h, sleep, choose } from '../../dom';
import { ELEMENT_ICON } from '../../tips';
import { rstage, playerPanel, spinRoll, data, stepLog, bigWheel, rollSlices, itemFlow, applyStep, checkAchievements, showEffect } from '../common';
import { ses } from '../session';
import { levelUps } from './rewards';

// ---------------------------------------------------------------------------
// Tela: evento pré-vilão

/** Evento pré-luta; no fim, Voltar ao mapa ou Lutar. */
export async function eventScreen(name: string): Promise<'back' | 'fight'> {
  const c = ses.camp!;
  const root = show(
    h(`<div class="screen rwheel">
      <h2>${S.ui.towards(name)}</h2>
      <div class="rstage-box">${rstage()}<div id="slot"></div></div><div class="rside"><div id="detail"></div><div id="hud"></div><div id="cta"></div></div>
    </div>`),
  );
  const slot = root.querySelector<HTMLElement>('#slot')!;
  const detail = root.querySelector<HTMLElement>('#detail')!;
  const hud = root.querySelector<HTMLElement>('#hud')!;
  const refreshHud = (pulse = false) => {
    hud.innerHTML = playerPanel(c.player, c.mods);
    if (pulse) hud.firstElementChild?.classList.add('pulse');
  };
  refreshHud();

  const roll = await spinRoll(slot, S.roulettes.event, () => rollWeighted(data.preFightEvents, ses.rng), (id) => S.events[id]!.name);
  const ev = S.events[roll.value]!;
  const slog = stepLog();
  if (slog) slog.event = ev.name;
  detail.innerHTML = `<div class="result-card"><h3>${ev.name}</h3><p>${ev.desc}</p></div>`;
  await sleep(ses.settings.instant ? 0 : 400);

  let step: Step;
  switch (roll.value) {
    case 'oldLady':
    case 'ramen':
      step = applySimpleEvent(c.player, roll.value);
      break;
    case 'training': {
      // XP garantido e o destaque de status (o foco elemental saiu no Roleta enxuto).
      const focus: Element[] = [];
      let pick = 'highlight';
      if (focus.length > 0) {
        const box = h(`<div class="wheel-box"><h3>${S.ui.trainingChoice}</h3><div class="act-grid">
          <button class="btn" data-choice="highlight">${S.ui.trainingHighlight}</button>
          ${focus.map((el) => `<button class="btn" data-choice="${el}">${icon(ELEMENT_ICON[el])} ${S.ui.trainingFocus(S.elements[el])}</button>`).join('')}
        </div></div>`);
        slot.replaceChildren(box);
        pick = await choose<string>(box);
      }
      if (pick !== 'highlight') {
        step = applyTrainingFocus(c.player, pick as Element, data);
        break;
      }
      // A roleta escolhe o status em destaque (pesos = os próprios status).
      const out = rollTraining(c.player, ses.rng, data);
      await bigWheel(slot, S.roulettes.training, rollSlices(out, (id) => S.trainingStats[id] ?? id), out.index);
      step = applyTraining(c.player, out.value, data);
      break;
    }
    case 'jokenpo':
      step = await jokenpoFlow(slot);
      break;
    case 'foundItem':
      step = await itemFlow(slot);
      break;
    case 'summon':
      step = await summonFlow(slot);
      break;
    case 'akatsuki': {
      const out = rollAkatsuki(c.player, ses.rng, data);
      await bigWheel(slot, S.roulettes.akatsuki, rollSlices(out, (id) => S.akatsuki[id]!), out.index);
      step = applyAkatsuki(c.player, out.value, data);
      break;
    }
    case 'guru': {
      const out = rollGuru(c.player, ses.rng, data);
      await bigWheel(slot, S.roulettes.guru, rollSlices(out, (id) => S.guru[id]!), out.index);
      if (out.value === 'charlatan') {
        step = applyGuru(c.player, out.value, null, data);
        break;
      }
      // Premium: o guru gira a roleta do perfil algumas vezes (sem repetir) e o jogador escolhe 1.
      const choices = rollPremiumChoices(c.player, ses.rng, data);
      for (let i = 0; i < choices.length; i++) {
        const r = choices[i]!;
        await sleep(ses.settings.instant ? 0 : 300);
        await bigWheel(slot, `${S.roulettes.premium} · ${S.ui.spinOf(i + 1, choices.length)}`, rollSlices(r, (id) => S.premiums[id] ?? id), r.index);
      }
      let premium = choices[0]!.value;
      if (choices.length > 1) {
        await sleep(ses.settings.instant ? 0 : 300);
        const box = h(`<div class="wheel-box"><h3>${S.ui.choosePremium}</h3><div class="act-grid">${choices
          .map((r, i) => `<button class="btn" data-choice="${i}">${S.premiums[r.value] ?? r.value}</button>`)
          .join('')}</div></div>`);
        slot.replaceChildren(box);
        premium = choices[Number(await choose(box))]!.value;
      }
      step = applyPremium(c.player, premium, data);
      break;
    }
    case 'clanLesson':
      step = applyClanLesson(c.player, data);
      break;
  }
  applyStep(step);
  c.stats = addEffect(addPreEvent(c.stats, roll.value), step.effect);
  if ('result' in step) c.stats = addJokenpo(c.stats, (step as { result: 'win' | 'draw' | 'loss' }).result);
  checkAchievements('inProgress', null);
  showEffect(detail, step.effect);
  refreshHud(true);
  const cta = root.querySelector<HTMLElement>('#cta')!;
  cta.innerHTML = `<div class="sticky-cta"><button class="btn rsheet-open" data-sheet>${icon('scroll')} ${S.ui.openSheet}</button><button class="btn" data-choice="back">${S.roleta.run.backToMap}</button><button class="btn primary big" data-choice="go">${icon('swords')} ${S.ui.fight}</button></div>`;
  const next = await choose<'back' | 'go'>(cta);
  await levelUps();
  return next === 'go' ? 'fight' : 'back';
}

export async function jokenpoFlow(slot: HTMLElement): Promise<Step> {
  const c = ses.camp!;
  const box = h(`<div class="wheel-box"><h3>${S.roulettes.jokenpo}</h3><p class="muted center">${S.ui.chooseHand}</p>
    <div class="hands">${HANDS.map((hand) => `<button class="btn hand" data-choice="${hand}">${icon(hand)}<small>${S.hands[hand]}</small></button>`).join('')}</div>
    <div class="duel"></div></div>`);
  slot.replaceChildren(box);
  const choice = await choose<Hand>(box);
  box.querySelectorAll('button').forEach((b) => (b.disabled = true));
  box.querySelector(`[data-choice="${choice}"]`)!.classList.add('picked');
  const result = playJokenpo(c.player, choice, ses.rng, data);
  const duel = box.querySelector<HTMLElement>('.duel')!;
  // Suspense: o companheiro "embaralha" as mãos antes de revelar.
  const shuffles = ses.settings.instant ? 0 : 9;
  for (let i = 0; i < shuffles; i++) {
    duel.innerHTML = `<div><small>${S.ui.you}</small><b>${icon(choice)}</b></div><span>vs</span><div><small>${S.ui.companion}</small><b>${icon(HANDS[i % 3]!)}</b></div>`;
    await sleep(90 + i * 15);
  }
  duel.innerHTML = `<div><small>${S.ui.you}</small><b>${icon(choice)}</b></div><span>vs</span><div><small>${S.ui.companion}</small><b>${icon(result.roll.value)}</b></div>`;
  const text = { win: S.ui.jokenpoWin, draw: S.ui.jokenpoDraw, loss: S.ui.jokenpoLoss }[result.result];
  duel.insertAdjacentHTML('afterend', `<p class="center result-${result.result}"><b>${text}</b></p>`);
  return result;
}

/** Encontro com invocações: aprende a invocar (roleta do animal) ou a invocação atual sobe de nível. */
export async function summonFlow(slot: HTMLElement): Promise<Step> {
  const c = ses.camp!;
  if (c.player.summon) return applySummonEncounter(c.player, c.player.summon.animal);
  const animal = rollSummonAnimal(ses.rng, data);
  await bigWheel(slot, S.roulettes.summonAnimal, rollSlices(animal, (id) => S.summons[id]!.name), animal.index);
  // Roleta enxuto: a invocação é uma relíquia (o contrato do animal).
  const step = applySummonEncounter(c.player, animal.value);
  const contract = contractFor(animal.value, rdata);
  return contract ? { ...step, player: gainRoletaRelic(step.player, contract, rdata) } : step;
}
