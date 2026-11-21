// Cenários de entrada: Portão da Vila, nome do jogador e avatar.
import { modeScreen, openAvatarPicker } from '../../gate';
import { askPlayerName } from '../../playerName';
import { profiles, seedRunHistory } from '../fixtures/profiles';
import { pathRun, saveRun } from '../fixtures/jornada';
import type { Scenario } from '../types';

export const gate: Scenario[] = [
  { id: 'gate.home', title: 'Portão de Ninshu Roots (primeiro acesso)', group: 'Entrada', mount: () => modeScreen() },
  {
    id: 'gate.home:mid',
    title: 'Portão com perfil médio e Jornada salva',
    group: 'Entrada',
    profile: profiles.mid,
    setup: (s) => {
      seedRunHistory(s, 6);
      saveRun(s, pathRun());
    },
    mount: () => modeScreen(),
  },
  {
    id: 'gate.home:full',
    title: 'Portão com tudo liberado',
    group: 'Entrada',
    profile: profiles.full,
    setup: (s) => seedRunHistory(s, 12),
    mount: () => modeScreen(),
  },
  {
    // Cada quadro é uma página própria: ligar o modo aqui não vaza para os outros cenários. Desmarque o Instantâneo.
    id: 'gate.home:animado',
    title: 'Portão no modo Animado (cena noturna; sem Instantâneo)',
    group: 'Entrada',
    mount: () => {
      document.documentElement.toggleAttribute('data-animated', true);
      return modeScreen();
    },
  },
  { id: 'gate.name', title: 'Pedir o nome do ninja', group: 'Entrada', mount: () => askPlayerName() },
  {
    id: 'gate.avatar',
    title: 'Escolha do avatar (muitos liberados)',
    group: 'Entrada',
    profile: profiles.full,
    setup: (s) => seedRunHistory(s, 12),
    mount: () => {
      const gate = modeScreen();
      openAvatarPicker();
      return gate;
    },
  },
];
