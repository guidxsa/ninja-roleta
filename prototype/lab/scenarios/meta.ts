// Cenários do Registro ninja (popup sobre o Portão).
import { modeScreen } from '../../gate';
import { openRegistry, type HistoryFilter, type RegistryPage } from '../../registry';
import { profiles, seedRunHistory } from '../fixtures/profiles';
import type { Scenario } from '../types';

/** O Registro abre por cima do Portão, como no jogo. */
const registry = (page: RegistryPage, filter: HistoryFilter = 'general') => () => {
  const gate = modeScreen();
  openRegistry(page, filter);
  return gate;
};

const pages: [RegistryPage, string][] = [
  ['history', 'Histórico'],
  ['bingo', 'Livro Bingo'],
  ['relics', 'Relíquias'],
  ['achievements', 'Conquistas'],
];

export const meta: Scenario[] = [
  ...pages.map(([page, name]): Scenario => ({ id: `meta.registry.${page}`, title: `Registro: ${name} (vazio)`, group: 'Sistemas', mount: registry(page) })),
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
