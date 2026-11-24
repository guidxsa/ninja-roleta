// Cenários do Registro ninja.
import { modeScreen, navigateGate } from '../../gate';
import { type HistoryMode, type HistoryFilter, type RegistryPage } from '../../registry';
import { profiles, seedRunHistory } from '../fixtures/profiles';
import { pathRun, saveRun, storyRun } from '../fixtures/jornada';
import { portraitGallery } from '../portraitGallery';
import type { Scenario } from '../types';

/** Os atalhos montam a página real pela navegação do Portão. */
const registry = (page: RegistryPage, filter: HistoryFilter = 'general', historyMode: HistoryMode = 'roleta') => () => {
  const gate = modeScreen();
  navigateGate({ page, filter, historyMode });
  return gate;
};

const pages: [RegistryPage, string][] = [
  ['history', 'Histórico'],
  ['bingo', 'Livro Bingo'],
  ['relics', 'Relíquias'],
  ['achievements', 'Conquistas'],
];

export const meta: Scenario[] = [
  { id: 'meta.portraits', title: 'Galeria de retratos (todos os desenhos)', group: 'Sistemas', mount: () => portraitGallery() },
  ...pages.map(([page, name]): Scenario => ({ id: `meta.registry.${page}`, title: `Registro: ${name} (vazio)`, group: 'Sistemas', mount: registry(page) })),
  ...(['story', 'path'] as const).flatMap(mode => [false, true].map((full): Scenario => ({
    id: `meta.registry.history:${mode}${full ? '-full' : ''}`,
    title: `Histórico de ${mode === 'story' ? 'História' : 'Campanha'} (${full ? 'completo' : 'vazio'})`,
    group: 'Sistemas', profile: full ? profiles.full : undefined,
    setup: full ? storage => saveRun(storage, mode === 'story' ? storyRun() : pathRun()) : undefined,
    mount: registry('history', 'general', mode),
  }))),
  ...pages.map(
    ([page, name]): Scenario => ({
      id: `meta.registry.${page}:full`,
      title: `Registro: ${name} (completo)`,
      group: 'Sistemas',
      profile: profiles.full,
      setup: (s) => seedRunHistory(s, 12),
      mount: registry(page),
    }),
  ),
  {
    id: 'meta.registry.history:origins',
    title: 'Registro: Histórico filtrado por origens',
    group: 'Sistemas',
    profile: profiles.mid,
    setup: (s) => seedRunHistory(s, 12),
    mount: registry('history', 'origins'),
  },
  {
    id: 'meta.registry.history:difficulty',
    title: 'Registro: Histórico filtrado por dificuldade',
    group: 'Sistemas',
    profile: profiles.mid,
    setup: (s) => seedRunHistory(s, 12),
    mount: registry('history', 'difficulty'),
  },
];
