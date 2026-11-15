// Roleta: mapa do ciclo.
import { equipTrainingWeights, removeTrainingWeights } from '../../../src/core/player';
import { currentCategory, cycleMult, villainFor } from '../../../src/core/roleta/run';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { roletaVillainsById as villainsById } from '../../../src/data/roleta/villains';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { icon } from '../../art';
import { show, h, choose } from '../../dom';
import { tip } from '../../tooltip';
import { getRun, progressDots, stageTrail, roletaArt, CATEGORY_SCENE, categoryTip, sheetPanels, playerPanel, data, villainName } from '../common';
import { ses } from '../session';
import { villainCard } from './battle';

// ---------------------------------------------------------------------------
// Tela: mapa da campanha

/** Mapa do ciclo. `eventDone`: o evento pré-luta desta etapa já aconteceu (o botão vira Lutar). */
export async function mapScreen(eventDone: boolean): Promise<'event' | 'fight' | 'abandon'> {
  const c = ses.camp!;
  const run = getRun();
  const RR = S.roleta.run;
  progressDots(run.step);
  const id = run.villainId!;
  const cat = currentCategory(run, rdata);
  ses.logStep = run.step;
  const pct = Math.round((cycleMult(run, rdata) - 1) * 100);
  const cycleChip = run.cycle > 0 ? ` <span class="chip jcycle"${tip(RR.cycle(run.cycle + 1), RR.cycleTip(pct))}>${icon('cycle')} ${RR.cycle(run.cycle + 1)}</span>` : '';
  const root = show(
    h(`<div class="screen rmap">
      <h2>${RR.title} ${run.cycle + 1}${cycleChip}</h2>
      <div class="rmap-trail">${stageTrail(run)}
        <div class="rmap-scene">${roletaArt(`roleta-${cat}`, CATEGORY_SCENE[cat] ?? 'konoha', 'rmap-art')}
          <div class="rmap-foe"><span class="rmap-cap"${categoryTip(cat)}><span class="seal">${cat === 'boss' ? '将' : '戦'}</span>${RR.categories[cat]}</span><div class="foes">${villainCard(id, villainFor(run, villainsById, rdata))}</div></div>
        </div>
      </div>
      <div class="rmap-me">
      <div class="rmap-sheet">${sheetPanels(c)}</div>
      ${playerPanel(c.player, c.mods)}
      <p class="muted small center">${S.ui.carryHint}</p>
      ${c.player.trainingWeights === 'equipped' ? `<button class="btn" data-choice="weights">${icon('weights')} ${S.ui.weightsRemove}</button>` : ''}
      ${c.player.trainingWeights === 'stored' ? `<button class="btn" data-choice="weights">${icon('weights')} ${S.ui.weightsEquip}</button>` : ''}
      </div>
      <div class="sticky-cta">${
        eventDone
          ? `<button class="btn primary big" data-choice="fight">${icon('swords')} ${RR.go(villainName(id))}</button>`
          : `<button class="btn primary big" data-choice="event">${icon('dice')} ${RR.toEvent}</button>`
      }</div>
      <div class="rmap-quit"><button class="btn small jgiveup rabandon" data-choice="abandon">${icon('warning')} ${RR.abandon}</button></div>
    </div>`),
  );
  for (;;) {
    const pick = await choose<'event' | 'fight' | 'weights' | 'abandon'>(root);
    // Os pesos só são equipados ou tirados fora de combate.
    if (pick === 'weights') {
      c.player =
        c.player.trainingWeights === 'stored' ? equipTrainingWeights(c.player, data) : removeTrainingWeights(c.player, data);
      return mapScreen(eventDone);
    }
    if (pick === 'abandon' && !window.confirm(RR.abandonConfirm)) continue;
    return pick;
  }
}
