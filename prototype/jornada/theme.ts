// Tema de cada protagonista da Jornada (árvore de talentos, moveset e Ficha): classe de cor e brasão de fundo.
import type { JRun } from '../../src/core/jornada/run';
import { ELEMENT_COLORS } from '../tips';

export const THEMES: Record<string, { cls: string; crest: string }> = {
  naruto: { cls: 'jt-naruto', crest: 'uzumaki' },
  commonNinja: { cls: 'jt-common', crest: 'common' },
  prodigy: { cls: 'jt-prodigy', crest: 'taijutsuProdigy' },
  uchihaNinja: { cls: 'jt-uchiha', crest: 'uchiha' },
  hyuugaNinja: { cls: 'jt-hyuuga', crest: 'hyuuga' },
};

export const themeOf = (hero: string) => THEMES[hero] ?? THEMES.commonNinja!;

/** No Comum, a cor do tema é a do elemento (variável `--tree`). Atributo `style` pronto, ou vazio. */
export function themeStyle(run: JRun): string {
  const el = run.elements[run.hero];
  return run.hero === 'commonNinja' && el ? ` style="--tree:${ELEMENT_COLORS[el]}"` : '';
}
