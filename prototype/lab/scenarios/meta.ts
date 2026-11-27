// Cenários do Registro ninja.
import { modeScreen, navigateGate } from '../../gate';
import { type HistoryMode, type HistoryFilter, type RegistryPage } from '../../registry';
import { profiles, seedJornadaHistory, seedRunHistory } from '../fixtures/profiles';
import { pathRun, saveRun, storyRun } from '../fixtures/jornada';
import { portraitGallery } from '../portraitGallery';
import type { Scenario } from '../types';

/** Os atalhos montam a página real pela navegação do Portão. */
const registry = (page: RegistryPage, filter: HistoryFilter = 'general', historyMode: HistoryMode = 'roleta') => () => {
  const gate = modeScreen();
  navigateGate({ page, filter, historyMode });
  return gate;
};

/** Espera o elemento aparecer (a página do Registro monta depois da navegação) e toca nele. */
async function tap(sel: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el.click();
    await new Promise((r) => setTimeout(r, 25));
  }
}

/** Depois de montar a página, toca nos botões dados, em ordem (aba do Livro Bingo, linha do Histórico, inimigo). */
const tapping = (open: () => Promise<unknown>, ...selectors: string[]) => async () => {
  const gate = open();
  for (const sel of selectors) await tap(sel);
  return gate;
};

/** Fichas do Livro Bingo: uma por tema (fundo do arco) e grau (moldura). */
const sheets: { id: string; title: string; mode: 'roleta' | 'story' | 'path'; foe: string }[] = [
  { id: 'arcade-common', title: 'Arcade, genin', mode: 'roleta', foe: 'bandit' },
  { id: 'arcade-elite', title: 'Arcade, jounin', mode: 'roleta', foe: 'zabuza' },
  { id: 'arcade-boss', title: 'Arcade, chefe', mode: 'roleta', foe: 'orochimaru' },
  { id: 'ondas-common', title: 'Ondas, comum', mode: 'story', foe: 'gatoThug' },
  { id: 'ondas-elite', title: 'Ondas, elite', mode: 'story', foe: 'zabuza' },
  { id: 'ondas-boss', title: 'Ondas, chefe', mode: 'story', foe: 'haku' },
  { id: 'exame-boss', title: 'Exame, chefe', mode: 'story', foe: 'gaara' },
  { id: 'sannin-boss', title: 'Sannin, chefe', mode: 'story', foe: 'kabuto' },
  { id: 'resgate-boss', title: 'Vale do Fim, chefe', mode: 'story', foe: 'sasukeFinal' },
  { id: 'campanha-elite', title: 'Campanha, elite rara', mode: 'path', foe: 'itachi' },
];

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
    setup: full ? storage => { saveRun(storage, mode === 'story' ? storyRun() : pathRun()); seedJornadaHistory(storage, 4); } : undefined,
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
    id: 'meta.registry.history:open',
    title: 'Histórico do Arcade com uma run aberta (e uma antiga)',
    group: 'Sistemas',
    profile: profiles.full,
    setup: (s) => seedRunHistory(s, 12),
    mount: tapping(registry('history'), '.run-row:nth-child(2) .run-head', '.run-row:nth-child(4) .run-head'),
  },
  ...(['story', 'path'] as const).map((mode): Scenario => ({
    id: `meta.registry.history:${mode}-open`,
    title: `Histórico de ${mode === 'story' ? 'História' : 'Campanha'} com uma run aberta`,
    group: 'Sistemas',
    profile: profiles.full,
    setup: (s) => seedJornadaHistory(s, 4),
    mount: tapping(registry('history', 'general', mode), '.run-head'),
  })),
  ...(['story', 'path'] as const).flatMap((mode) => [profiles.mid, profiles.full].map((profile, i): Scenario => ({
    id: `meta.registry.bingo:${mode}${i ? '-full' : ''}`,
    title: `Livro Bingo da ${mode === 'story' ? 'História' : 'Campanha'} (${i ? 'completo' : 'parcial'})`,
    group: 'Sistemas',
    profile,
    mount: tapping(registry('bingo'), `[data-bingo-mode="${mode}"]`),
  }))),
  ...sheets.map((x): Scenario => ({
    id: `meta.registry.bingo:sheet-${x.id}`,
    title: `Ficha do Livro Bingo: ${x.title}`,
    group: 'Sistemas',
    profile: profiles.full,
    mount: tapping(registry('bingo'), `[data-bingo-mode="${x.mode}"]`, `.bingo-open[data-foe="${x.foe}"]`),
  })),
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
