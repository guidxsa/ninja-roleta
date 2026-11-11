// Card de modo (Início e entrada da Jornada): pergaminho com a arte numa moldura (.art-frame, styles/art.css) e o
// texto ao lado ou embaixo, conforme a largura do próprio card. `data-choice` e as classes são contrato com o TS.
import { icon } from './art';

export interface ModeCardSpec {
  id: string;
  /** HTML da arte (sceneMedia, leque de arcos, emblema ou retrato). */
  art: string;
  /** Variáveis de forma da arte (`sceneVars`), para o card calcular a coluna dela. */
  artVars?: string;
  seal: string;
  name: string;
  desc: string;
  cta: string;
}

export function modeCard(c: ModeCardSpec): string {
  return `<button class="parchment mode-card" data-choice="${c.id}"${c.artVars ? ` style="${c.artVars}"` : ''}><span class="mode-body">
      <span class="mode-art art-frame art-ink" aria-hidden="true">${c.art}</span>
      <span class="mode-txt"><b>${c.name}</b><small>${c.desc}</small><span class="mode-cta">${c.cta} ${icon('chevron')}</span></span>${icon('chevron')}</span>
      <span class="scroll-roll l" aria-hidden="true"></span><span class="scroll-roll r" aria-hidden="true"></span><span class="seal mode-seal" aria-hidden="true">${c.seal}</span></button>`;
}
