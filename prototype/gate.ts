// Portão da Vila (escolha de modo), barra lateral do PC, avatar, ficha do perfil e nome do jogador.
import { lineageKey } from '../src/core/achievements';
import { avatarChoices, currentAvatar } from '../src/core/avatar';
import { achievements } from '../src/data/achievements';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { ptBR as S } from '../src/data/strings/ptBR';
import { saveProfile, bestRoletaCycle, PLAYER_NAME_MAX, cleanPlayerName } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { achievementIcon } from './achievementIcons';
import { AVATAR_CUTS, sceneMedia, sceneFx, emblem, sceneVars, icon, ninjaPortrait } from './art';
import { h, show, goHome, esc, openDialog } from './dom';
import type { JornadaEntry } from './jornada';
import { jornadaHost } from './jornadaHost';
import { modeCard } from './modeCard';
import { askPlayerName } from './playerName';
import { type RegistryPage, type HistoryFilter, registryPages, registryScreen } from './registry';
import { syncSheetBtn } from './roleta/common';
import { ses, DIFFICULTIES } from './roleta/session';
import { tip } from './tooltip';

type GateMode = 'roleta' | JornadaEntry;
interface GatePick { mode: GateMode; resume?: boolean }

type GateRoute = { page: 'home' } | { page: RegistryPage; filter?: HistoryFilter; historyMode?: GateMode } | GatePick;
type NavId = GateMode | RegistryPage | 'home' | 'registry';
const modes = ['roleta', 'story', 'path'] as const;
const navIcons: Record<NavId, string> = {
  home: 'house', roleta: 'fortuneWheel', story: 'navScroll', path: 'navRoute', registry: 'navBook',
  history: 'clock', bingo: 'navBook', relics: 'navChest', achievements: 'trophy',
};

let pending: GateRoute | undefined;
let activeView: { root: HTMLElement; select: (route: GateRoute) => void } | undefined;
let activeNav: NavId = 'home';

/** Atalhos de dentro de uma partida usam a mesma confirmação do retorno ao Portão. */
export function navigateGate(route: GateRoute): void {
  if (activeView?.root.isConnected) {
    activeView.select(route);
    return;
  }
  const inJornada = document.body.classList.contains('mode-jornada');
  const warning = inJornada && ses.jornadaSheet ? S.ui.homeConfirmJornada : !inJornada && ses.campLive ? S.ui.homeConfirmRoleta : null;
  if (warning && !window.confirm(warning)) return;
  pending = route;
  goHome();
}

function markNav(id: NavId): void {
  activeNav = id;
  for (const key of ['side-nav', 'gate-nav']) {
    const active = key === 'gate-nav' && registryPages.some(page => page === id) ? 'registry' : id;
    document.querySelectorAll<HTMLElement>(`#${key} [data-nav]`).forEach(button => {
      if (button.dataset.nav === active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }
}

export async function modeScreen(): Promise<GatePick> {
  let route: GateRoute = pending ?? { page: 'home' };
  pending = undefined;
  ses.camp = null;
  ses.campLive = false;
  syncSheetBtn();
  document.getElementById('dots')!.replaceChildren();
  document.body.classList.add('at-gate');
  while ('page' in route) {
    markNav(route.page);
    const root = route.page === 'home' ? gateScreen() : registryScreen(route.page, route.filter, route.historyMode);
    route = await new Promise<GateRoute>(select => { activeView = { root, select }; });
  }
  activeView = undefined;
  document.body.classList.remove('at-gate');
  markNav(route.mode);
  return route;
}

function gateScreen(): HTMLElement {
  const M = S.jornada.modes;
  const artKeys = { roleta: 'modo-roleta', story: 'modo-jornada', path: 'modo-caminho' };
  const gateCard = (id: GateMode) => modeCard({
    id, art: sceneMedia(artKeys[id]) ?? emblem(id === 'roleta' ? 'roleta' : 'jornada'),
    artVars: sceneVars(artKeys[id]), ...M[id],
  });
  const root = show(h(`<div class="screen jmodes gate">
    <div class="gate-banner">
      <div class="gate-hero" aria-hidden="true">${sceneMedia('portao') ?? ''}${sceneFx()}</div>
      <header class="gate-head"><h1 class="logo">${S.ui.title.split(' ').map((word, i) => `<span class="l${i + 1}">${word}</span>`).join(' ')}</h1></header>
    </div>
    <aside class="gate-aside">${profileCard()}${recentCard()}</aside>
    <nav class="gate-modes" aria-label="${M.title}">${modes.map(gateCard).join('')}</nav>
  </div>`));
  root.addEventListener('error', event => {
    const media = event.target;
    if (!(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)) return;
    const art = media.closest('.mode-art');
    if (art) art.innerHTML = emblem(art.closest('[data-choice="roleta"]') ? 'roleta' : 'jornada');
  }, true);
  root.querySelectorAll<HTMLButtonElement>('.mode-card').forEach(button =>
    button.addEventListener('click', () => navigateGate({ mode: button.dataset.choice as GateMode })));
  root.querySelector('[data-desk-name]')?.addEventListener('change', (event) => {
    setPlayerName((event.target as HTMLInputElement).value);
    root.querySelector('[data-display-name]')!.textContent = ses.profile.playerName || S.ui.desk.namePlaceholder;
  });
  root.querySelector('[data-avatar]')?.addEventListener('click', openAvatarPicker);
  return root;
}

export function installSideNav(): void {
  const D = S.ui.desk;
  const item = (id: NavId) => `<button type="button" data-nav="${id}">${icon(navIcons[id])}<span>${D.nav[id]}</span></button>`;
  for (const key of ['side-nav', 'gate-nav']) {
    const nav = document.getElementById(key)!;
    nav.setAttribute('aria-label', D.navLabel);
    const main = (['home', ...modes] as const).map(item).join('');
    nav.innerHTML = key === 'side-nav'
      ? `<span class="side-brand seal brand-seal" aria-hidden="true">${icon('konoha')}</span>${main}<hr>${registryPages.map(item).join('')}`
      : main + item('registry');
    nav.addEventListener('click', (event) => {
      const id = (event.target as HTMLElement).closest<HTMLElement>('[data-nav]')?.dataset.nav as NavId | undefined;
      if (!id || id === activeNav) return;
      if (id === 'roleta' || id === 'story' || id === 'path') navigateGate({ mode: id });
      else navigateGate({ page: id === 'registry' ? 'history' : id });
    });
  }
}

/** Avatares liberados agora (core puro: origens jogadas no Roleta e conquistas da Jornada). */
export function avatarOptions(): string[] {
  const played = loadRuns(ses.storage).map((r) => lineageKey(r.origin));
  return avatarChoices({ playedLineages: [...new Set(played)], achievements: Object.keys(ses.profile.achievements) });
}

/** Desenho do avatar a partir da chave de retrato (`ninja:<chave>`). */
export function avatarArt(spec: string, size: 'sm' | 'md' | 'lg', onPaper = false): string {
  const key = spec.split(':')[1] ?? 'common';
  const portrait = ninjaPortrait(key, size);
  const cut = onPaper && AVATAR_CUTS[key];
  return cut ? `<span class="avatar-art" style="--avatar-cut:${cut}">${portrait}</span>` : portrait;
}

/** Nome do avatar na escolha: a origem, ou um nome próprio (visual do Sasuke). */
export function avatarName(spec: string): string {
  const key = spec.split(':')[1] ?? 'common';
  return S.ui.desk.avatarNames[key] ?? S.lineages[key as keyof typeof S.lineages] ?? key;
}

/** Botão do avatar na Ficha expandida: mostra o atual e abre a escolha. */
export function avatarButton(size: 'sm' | 'md'): string {
  const D = S.ui.desk;
  const spec = currentAvatar(ses.profile.avatar, avatarOptions());
  return `<button type="button" class="avatar-btn" data-avatar aria-label="${D.avatarEdit}"${tip(D.avatarTitle, D.avatarTip)}>${avatarArt(spec, size, size === 'md')}</button>`;
}

/** Janela de escolha do avatar. Escolher grava no perfil e redesenha os botões abertos. */
export function openAvatarPicker(): void {
  const D = S.ui.desk;
  const choices = avatarOptions();
  const now = currentAvatar(ses.profile.avatar, choices);
  const overlay = h(`<div class="modal" aria-label="${D.avatarPick}"><div class="modal-body avatar-pick">
    <div class="modal-head"><h2>${D.avatarPick}</h2><button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></div>
    <div class="avatar-grid">${choices
      .map((spec) => `<button type="button" class="avatar-opt" data-pick="${esc(spec)}" aria-pressed="${spec === now}">${avatarArt(spec, 'md')}<small>${esc(avatarName(spec))}</small></button>`)
      .join('')}</div></div></div>`);
  overlay.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const pick = t.closest<HTMLElement>('[data-pick]');
    if (pick) {
      ses.profile = { ...ses.profile, avatar: pick.dataset.pick! };
      saveProfile(ses.storage, ses.profile);
      document.querySelectorAll<HTMLElement>('[data-avatar]').forEach((b) => {
        const onPaper = Boolean(b.closest('.desk-id'));
        b.innerHTML = avatarArt(ses.profile.avatar!, onPaper ? 'md' : 'sm', onPaper);
      });
      const preview = document.querySelector('[data-avatar-preview]');
      if (preview) preview.innerHTML = avatarArt(ses.profile.avatar!, 'md', true);
      overlay.remove();
      return;
    }
    if (e.target === overlay || t.closest('[data-close]')) overlay.remove();
  });
  openDialog(overlay);
}

/** Ficha do perfil (coluna direita do Início): nome, avatar e números do perfil. */
export function profileCard(): string {
  const D = S.ui.desk;
  const runs = loadRuns(ses.storage).filter((r) => r.status !== 'reroll');
  const wins = runs.filter((r) => r.status === 'victory').length;
  const bestCycle = bestRoletaCycle(ses.profile, runs);
  const best = ses.profile.jornada?.generic ?? null;
  const countedIds = [...achievements.filter((a) => !a.legacy), ...jornadaAchievements].map((a) => a.id);
  const counted = countedIds.length;
  const rows: [string, string][] = [
    [D.stats.roletaRuns, String(runs.length)],
    [D.stats.roletaWins, String(wins)],
    [D.stats.bestCycle, bestCycle !== null ? String(bestCycle) : D.none],
    [D.stats.jornada, best ? D.campaignResult(best.cycle, best.stage, best.won) : D.none],
    // Só as do catálogo atual: ids antigos no perfil davam 78/64.
    [D.stats.achievements, `${countedIds.filter((id) => id in ses.profile.achievements).length}/${counted}`],
    [D.stats.villains, String(Object.keys(ses.profile.villains).length)],
    [D.stats.relics, String(Object.keys(ses.profile.relics).length)],
  ];
  const spec = currentAvatar(ses.profile.avatar, avatarOptions());
  return `<section class="parchment desk-profile">
    <h3>${D.profileTitle}</h3>
    <details class="ninja-record"><summary>
      <span data-avatar-preview>${avatarArt(spec, 'md', true)}</span>
      <span class="record-summary"><strong data-display-name>${esc(ses.profile.playerName || D.namePlaceholder)}</strong>
        <span>${D.nav.roleta} · ${D.diffLine(runs.length, wins)}</span>
        <span>${D.campaignRecord} · ${best ? D.campaignResult(best.cycle, best.stage, best.won) : D.none}</span>
        <b>${D.recordTitle} ${icon('chevron')}</b></span>
    </summary>
    <div class="desk-id">${avatarButton('md')}
      <label class="field"><span>${S.ui.playerName.label}</span><input type="text" data-desk-name maxlength="${PLAYER_NAME_MAX}" autocomplete="nickname" placeholder="${D.namePlaceholder}" value="${esc(ses.profile.playerName ?? '')}"></label></div>
    <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>
  </section>`;
}

/** Conquistas recentes (coluna direita do Início), com o atalho para a página. */
export function recentCard(): string {
  const recent = jornadaHost.recentAchievements(3);
  const J = S.jornada.start;
  return `<section class="parchment jrecent desk-recent"><h3>${J.recentTitle} <button type="button" class="btn small desk-all" data-profile="achievements">${S.ui.desk.seeAll} ${icon('chevron')}</button></h3>${recent.length ? `<ul>${recent
    .map((a) => `<li><span class="seal ach-ico" aria-hidden="true">${achievementIcon(a.id)}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span><time>${J.when(a.days)}</time></li>`)
    .join('')}</ul>` : `<p class="small">${S.ui.desk.emptyAchievements}</p>`}</section>`;
}

/** Estatística por dificuldade (filtro do Histórico): runs, vitórias, % e o melhor ciclo do Roleta. */
export function difficultyStats(): string {
  const D = S.ui.desk;
  const runs = loadRuns(ses.storage).filter((r) => r.status !== 'reroll');
  return `<ul class="history">${DIFFICULTIES.map((d) => {
    const mine = runs.filter((r) => r.difficulty === d);
    if (!mine.length) return `<li><div class="row between"><b>${S.difficulty[d].name}</b><small class="muted">${D.diffEmpty}</small></div></li>`;
    const wins = mine.filter((r) => r.status === 'victory').length;
    const cycles = mine.filter((r) => r.fights !== undefined).map((r) => (r.cycle ?? 0) + 1);
    return `<li><div class="row between"><b>${S.difficulty[d].name}</b><b>${S.profile.winRate(Math.round((wins / mine.length) * 100))}</b></div>
      <small class="muted">${D.diffLine(mine.length, wins)}${cycles.length ? ` · ${D.diffBest(Math.max(...cycles))}` : ''}</small></li>`;
  }).join('')}</ul>`;
}

export function setPlayerName(raw: string): void {
  ses.profile = { ...ses.profile, playerName: cleanPlayerName(raw) };
  saveProfile(ses.storage, ses.profile);
}

/** Pergunta o nome uma vez, na primeira entrada no Roleta ou no Caminho Ninja. */
export async function ensurePlayerName(): Promise<void> {
  if (ses.profile.playerName !== undefined) return;
  setPlayerName(await askPlayerName());
}
