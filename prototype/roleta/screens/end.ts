// Roleta: fim da run e Compartilhar.
import { canContinueRoleta } from '../../../src/core/roleta/run';
import { buildShareText, replayUrl } from '../../../src/core/share';
import { type Origin } from '../../../src/core/types';
import { roletaData as rdata } from '../../../src/data/roleta/index';
import { ptBR as S } from '../../../src/data/strings/ptBR';
import { icon, clanSymbol } from '../../art';
import { victory, defeat } from '../../audio';
import { show, h, choose } from '../../dom';
import { tip } from '../../tooltip';
import { progressDots, getRun, foePortrait, stageTrail, playerPanel, VERSION, toast, originLabel } from '../common';
import { ses, type Campaign } from '../session';

// ---------------------------------------------------------------------------
// Fim de run e histórico

/**
 * Fim da run. Vitória (o chefe do 1º ciclo caiu): "Seguir para o ciclo 2" ou nova run. Cair a partir do ciclo 2 não é
 * uma derrota comum: a run já foi vencida.
 */
export async function endScreen(won: boolean, stoppedAt: string | null, record = false, abandoned = false): Promise<'continue' | 'new'> {
  const c = ses.camp!;
  const RR = S.roleta.run;
  const infinite = c.run.cycle > 0;
  const good = won || infinite;
  progressDots(won ? rdata.cycle.length : c.run.step);
  (good ? victory : defeat)();
  const title = abandoned ? RR.abandoned : won ? S.ui.victoryTitle : infinite ? RR.infiniteOver : S.ui.defeatTitle;
  const pct = Math.round(rdata.r.infinite.perCycle * (c.run.cycle + 1) * 100);
  // O modo infinito existe só no Hardcore: nas outras dificuldades, a vitória encerra a run.
  const canGo = won && canContinueRoleta(getRun());
  const cont = canGo
    ? `<button class="btn primary big" data-choice="continue"${tip(RR.nextCycle(c.run.cycle + 2), RR.nextCycleTip(pct))}>${icon('cycle')} ${RR.nextCycle(c.run.cycle + 2)}</button>`
    : '';
  if (!canGo) ses.campLive = false;
  const face = good ? clanSymbol(c.player.origin.lineageId) : foePortrait(c.run.villainId ?? rdata.categories.genin[0]!, 'lg');
  const root = show(
    h(`<div class="screen end rend ${good ? 'win' : 'lose'}">
      <div class="rend-l">
      <div class="end-seal">${face}<span class="seal stamp end-stamp${good ? ' gold' : ''}" aria-hidden="true">${good ? '勝' : '敗'}</span></div>
      <h2>${title}</h2>
      ${stoppedAt ? `<p class="center">${S.ui.defeatBy(stoppedAt)}</p>` : ''}
      <p class="center">${RR.reached(c.run.cycle + 1, c.run.wins)}${record ? ` <span class="chip jrecord">${icon('medal')} ${RR.record}</span>` : ''}</p>
      ${c.player.revivesUsed > 0 ? `<p class="center muted">${S.ui.revivesUsed(c.player.revivesUsed)}</p>` : ''}
      ${won && !canGo ? `<p class="center muted small">${icon('lock')} ${RR.infiniteHardcoreOnly}</p>` : ''}
      </div>
      <div class="rend-r">
      ${stageTrail(c.run)}
      ${playerPanel(c.player)}
      </div>
      <div class="sticky-cta actions-row">
        <button class="btn big" data-share>${icon('share')} ${S.share.button}</button>
        ${cont}
        <button class="btn ${canGo ? '' : 'primary '}big" data-choice="new">${icon('dice')} ${S.ui.newRun}</button>
      </div>
    </div>`),
  );
  root.querySelector('[data-share]')!.addEventListener('click', () => void shareRun(c, good, stoppedAt));
  const choice = await choose<'continue' | 'new'>(root);
  if (choice === 'new') ses.campLive = false;
  return choice;
}

/** Compartilha o resumo da run (menu do celular) ou copia para colar no grupo. */
export async function shareRun(c: Campaign, won: boolean, stoppedAt: string | null) {
  const text = buildShareText(
    {
      version: VERSION,
      difficulty: S.difficulty[c.difficulty].name,
      origin: originText(c.origin),
      level: c.player.level,
      trail: c.trail,
      won,
      fallenTo: stoppedAt,
      cycle: c.run.cycle + 1,
      revivesUsed: c.player.revivesUsed,
      seed: c.seed,
      replayUrl: replayUrl(window.location, c.seed),
    },
    S.share,
  );
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      // Cancelado pelo jogador: não faz nada. Outro erro: cai para copiar.
      if ((e as Error).name === 'AbortError') return;
    }
  }
  toast((await copyText(text)) ? S.share.copied : S.share.failed);
}

/** Origem por extenso: linhagem, afinidade e jinchuuriki. */
export function originText(o: Origin): string {
  const kg = o.kekkeiGenkai ? ` · ${S.kekkeiGenkai[o.kekkeiGenkai]?.name}` : '';
  return `${originLabel(o)}${o.elements.length ? ` (${o.elements.map((e) => S.elements[e]).join(', ')})` : ''}${kg}${o.jinchuuriki ? ` · ${S.origin.jinchuuriki}` : ''}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
