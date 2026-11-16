// Cenários da Jornada que não precisam de run em andamento: entrada e as duas telas de início.
import { campaignScreen, entryScreen, pathSetupScreen } from '../../jornada';
import { profiles } from '../fixtures/profiles';
import { pathRun, saveRun, storyRun } from '../fixtures/jornada';
import { loadJornada } from '../../../src/state/jornadaSave';
import type { LabContext, Scenario } from '../types';

/** As telas da Jornada esperam o corpo no modo Jornada (como `runJornada` deixa). */
const jornada =
  (screen: (ctx: LabContext) => Promise<unknown>) =>
  (ctx: LabContext): Promise<unknown> => {
    document.body.classList.add('mode-jornada');
    return screen(ctx);
  };

export const jornadaScenarios: Scenario[] = [
  {
    id: 'jornada.entry',
    title: 'Entrada da Jornada (sem save, Hardcore travado)',
    group: 'Jornada',
    mount: jornada((ctx) => entryScreen(ctx.jornadaHost, null)),
  },
  {
    // Modo Animado (cena viva): cada quadro é uma página própria, então ligar aqui não vaza. Desmarque o Instantâneo.
    id: 'jornada.entry:animado',
    title: 'Entrada da Jornada no modo Animado (cena viva)',
    group: 'Jornada',
    mount: jornada((ctx) => {
      document.documentElement.toggleAttribute('data-animated', true);
      return entryScreen(ctx.jornadaHost, null);
    }),
  },
  {
    id: 'jornada.entry:saved',
    title: 'Entrada com Caminho Ninja salvo e conquistas recentes',
    group: 'Jornada',
    profile: profiles.mid,
    setup: (s) => saveRun(s, pathRun()),
    mount: jornada((ctx) => entryScreen(ctx.jornadaHost, loadJornada(ctx.storage))),
  },
  {
    id: 'jornada.entry:full',
    title: 'Entrada com tudo liberado (Hardcore aberto)',
    group: 'Jornada',
    profile: profiles.full,
    setup: (s) => saveRun(s, storyRun()),
    mount: jornada((ctx) => entryScreen(ctx.jornadaHost, loadJornada(ctx.storage))),
  },
  {
    id: 'jornada.story.pick',
    title: 'Modo História: escolher a perspectiva',
    group: 'Jornada',
    mount: jornada((ctx) => campaignScreen(ctx.jornadaHost, null)),
  },
  {
    id: 'jornada.story.pick:saved',
    title: 'Perspectiva com a História salva (arco atual marcado)',
    group: 'Jornada',
    setup: (s) => saveRun(s, storyRun()),
    mount: jornada((ctx) => campaignScreen(ctx.jornadaHost, loadJornada(ctx.storage))),
  },
  {
    id: 'jornada.path.setup',
    title: 'Caminho Ninja: preparação (classes travadas)',
    group: 'Jornada',
    mount: jornada((ctx) => pathSetupScreen(ctx.jornadaHost, null)),
  },
  {
    id: 'jornada.path.setup:full',
    title: 'Caminho Ninja com todas as classes e o visual do Sasuke',
    group: 'Jornada',
    profile: profiles.full,
    mount: jornada((ctx) => pathSetupScreen(ctx.jornadaHost, null)),
  },
];
