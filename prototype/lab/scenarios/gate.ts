// Cenários de entrada: Portão da Vila, nome do jogador e avatar.
import { AVATAR_CUTS } from '../../art';
import { choose, esc, h, show } from '../../dom';
import { avatarArt, avatarName, modeScreen, openAvatarPicker } from '../../gate';
import { askPlayerName } from '../../playerName';
import { profiles, seedRunHistory } from '../fixtures/profiles';
import { pathRun, saveRun, storyRun } from '../fixtures/jornada';
import type { Scenario } from '../types';

export const gate: Scenario[] = [
  { id: 'gate.home', title: 'Portão de Ninshu Roots (primeiro acesso)', group: 'Entrada', mount: () => modeScreen() },
  {
    id: 'gate.home:mid',
    title: 'Portão com perfil médio e Campanha salva',
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
    id: 'gate.home:empty-story', title: 'Perfil vazio com História salva', group: 'Entrada',
    setup: (s) => saveRun(s, storyRun()), mount: () => modeScreen(),
  },
  {
    id: 'gate.home:mid-new', title: 'Perfil médio sem run salva', group: 'Entrada',
    profile: profiles.mid, setup: (s) => seedRunHistory(s, 6), mount: () => modeScreen(),
  },
  {
    id: 'gate.home:full-story', title: 'Perfil completo com História salva', group: 'Entrada',
    profile: profiles.full, setup: (s) => { seedRunHistory(s, 12); saveRun(s, storyRun()); }, mount: () => modeScreen(),
  },
  {
    // Cada quadro é uma página própria: ligar o modo aqui não vaza para os outros cenários. Desmarque o Instantâneo.
    id: 'gate.home:animado',
    title: 'Portão no modo Animado (vila ao entardecer; sem Instantâneo)',
    group: 'Entrada',
    mount: () => {
      document.documentElement.toggleAttribute('data-animated', true);
      return modeScreen();
    },
  },
  {
    id: 'gate.avatar:paper', title: 'Ficha com cada avatar', group: 'Entrada',
    mount: () => choose(show(h(`<section class="avatar-gallery"><h2>Ficha com cada avatar</h2>${Object.keys(AVATAR_CUTS).map(key => {
      const spec = 'ninja:' + key;
      return `<figure>${avatarArt(spec, 'md', true)}<figcaption>${esc(avatarName(spec))}</figcaption></figure>`;
    }).join('')}</section>`))),
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
