// Portão da Vila (escolha de modo), barra lateral do PC, avatar, ficha do perfil e nome do jogador.
import { lineageKey } from '../src/core/achievements';
import { avatarCatalog, avatarChoices, currentAvatar, type AvatarEntry } from '../src/core/avatar';
import { achievements } from '../src/data/achievements';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { charactersById } from '../src/data/jornada/characters';
import { enemiesById } from '../src/data/jornada/enemies';
import { roletaVillains } from '../src/data/roleta/villains';
import { ptBR as S } from '../src/data/strings/ptBR';
import { saveProfile, bestRoletaCycle, PLAYER_NAME_MAX, cleanPlayerName } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { achievementIcon } from './achievementIcons';
import { pushLayer } from './back';
import { AVATAR_CUTS, GENERIC_AVATAR_CUT, sceneMedia, sceneFx, emblem, sceneVars, icon, ninjaPortrait } from './art';
import { h, show, goHome, esc, openDialog } from './dom';
import type { JornadaEntry } from './jornada';
import { jornadaHost } from './jornadaHost';
import { modeCard } from './modeCard';
import { askPlayerName } from './playerName';
import { type RegistryPage, type HistoryFilter, registryPages, registryScreen } from './registry';
import { data, syncSheetBtn } from './roleta/common';
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

/** Camadas do voltar (back.ts): a página do Registro aberta e a partida em andamento. */
let releasePage: (() => void) | undefined;
let releaseRun: (() => void) | undefined;

/**
 * Atalhos de dentro de uma partida usam a mesma confirmação do retorno ao Portão. Devolve `false` se o jogador
 * cancelou a saída (o voltar do navegador fica na partida).
 */
export function navigateGate(route: GateRoute): boolean {
  if (activeView?.root.isConnected) {
    activeView.select(route);
    return true;
  }
  const inJornada = document.body.classList.contains('mode-jornada');
  const warning = inJornada && ses.jornadaSheet ? S.ui.homeConfirmJornada : !inJornada && ses.campLive ? S.ui.homeConfirmRoleta : null;
  if (warning && !window.confirm(warning)) return false;
  pending = route;
  goHome();
  return true;
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
  // Voltou ao Portão: a partida acabou, e a entrada dela sai do histórico.
  releaseRun?.();
  releaseRun = undefined;
  while ('page' in route) {
    // Uma entrada só para o Registro inteiro: trocar de aba não empilha, e o voltar leva ao Portão.
    if (route.page !== 'home' && !releasePage) {
      releasePage = pushLayer(() => {
        releasePage = undefined;
        activeView?.select({ page: 'home' });
      });
    } else if (route.page === 'home' && releasePage) {
      const release = releasePage;
      releasePage = undefined;
      release();
    }
    markNav(route.page);
    const root = route.page === 'home' ? gateScreen() : registryScreen(route.page, route.filter, route.historyMode);
    route = await new Promise<GateRoute>(select => { activeView = { root, select }; });
  }
  releasePage?.();
  releasePage = undefined;
  activeView = undefined;
  document.body.classList.remove('at-gate');
  markNav(route.mode);
  // Na partida, o voltar do navegador pede a mesma confirmação do botão do Portão; o Esc não sai da luta.
  releaseRun = pushLayer(() => navigateGate({ page: 'home' }), { esc: false });
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
  wireProfileCard(root);
  return root;
}

/** Liga a Ficha: o avatar abre a escolha e o nome vira campo no lugar. */
export function wireProfileCard(root: HTMLElement): void {
  root.querySelector('[data-avatar]')?.addEventListener('click', openAvatarPicker);
  root.querySelector<HTMLButtonElement>('[data-name-edit]')?.addEventListener('click', (event) => editName(event.currentTarget as HTMLButtonElement));
}

/** Troca o nome da Ficha por um campo no mesmo lugar: Enter ou sair do campo grava, Esc cancela. */
function editName(button: HTMLButtonElement): void {
  const D = S.ui.desk;
  const input = h(`<input type="text" class="name-input" data-desk-name maxlength="${PLAYER_NAME_MAX}" autocomplete="nickname" aria-label="${S.ui.playerName.label}" placeholder="${D.namePlaceholder}" value="${esc(ses.profile.playerName ?? '')}">`) as HTMLInputElement;
  let done = false;
  const finish = (save: boolean) => {
    if (done) return;
    done = true;
    if (save) setPlayerName(input.value);
    button.querySelector('[data-display-name]')!.textContent = ses.profile.playerName || D.namePlaceholder;
    input.remove();
    button.hidden = false;
    button.focus({ preventScroll: true });
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finish(true);
    } else if (e.key === 'Escape') {
      // O Esc do campo só cancela a edição: não chega ao voltar da tela.
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }
  });
  input.addEventListener('blur', () => finish(true));
  button.hidden = true;
  button.after(input);
  input.focus();
  input.select();
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

/** Retrato de cada vilão do Arcade (a chave de imagem dele, que pode ser genérica: thug, mist...). */
const villainPortraitKey = (v: { id: string; portrait?: string }) => v.portrait?.split(':')[1] ?? v.id;

/** Avatares liberados agora (core puro: origens jogadas, conquistas da Jornada e vilões do Livro Bingo). */
export function avatarOptions(): string[] {
  const played = loadRuns(ses.storage).map((r) => lineageKey(r.origin));
  const seenVillains = roletaVillains.filter((v) => (ses.profile.villains[v.id]?.faced ?? 0) > 0).map(villainPortraitKey);
  // Quem lutou na Jornada, pela chave do retrato (a forma base de cada ficha).
  const portraitKey = (p?: string) => p?.split(':')[1];
  const seenJornada = [
    ...(ses.profile.jornadaAllies ?? []).map((id) => portraitKey(charactersById[id]?.portrait)),
    ...Object.keys(ses.profile.jornadaFoes ?? {}).map((id) => portraitKey(enemiesById[id]?.portrait)),
  ].filter((k): k is string => Boolean(k));
  return avatarChoices({ playedLineages: [...new Set(played)], achievements: Object.keys(ses.profile.achievements), seenVillains, seenJornada });
}

/** Todos os avatares do jogo, para a escolha mostrar também os bloqueados. */
export function avatarEntries(): AvatarEntry[] {
  return avatarCatalog({ lineages: data.lineages.map((l) => l.id), arcadeVillains: roletaVillains.map(villainPortraitKey) });
}

/** Dica de um avatar bloqueado: onde ele se libera. */
function unlockHint(entry: AvatarEntry): string {
  const H = S.ui.desk.avatarHow;
  const achName = (id: string) => S.jornada.achievements.list[id]?.name ?? S.achievements.list[id]?.name ?? id;
  return entry.unlock
    .map((u) => (u.kind === 'achievement' ? H.achievement(achName(u.id)) : u.kind === 'villain' ? H.villain : H.lineage))
    .join(' ');
}

/** Desenho do avatar a partir da chave de retrato (`ninja:<chave>`). */
export function avatarArt(spec: string, size: 'sm' | 'md' | 'lg', onPaper = false, locked = false): string {
  const key = spec.split(':')[1] ?? 'common';
  const portrait = ninjaPortrait(key, size);
  // Bloqueado sem recorte próprio: a silhueta genérica, para não virar um quadrado cinza.
  const cut = onPaper && (AVATAR_CUTS[key] ?? (locked ? GENERIC_AVATAR_CUT : undefined));
  return cut ? `<span class="avatar-art" style="--avatar-cut:${cut}">${portrait}</span>` : portrait;
}

/** Nome do avatar na escolha: a origem, ou um nome próprio (visual do Sasuke). */
export function avatarName(spec: string): string {
  const key = spec.split(':')[1] ?? 'common';
  return S.ui.desk.avatarNames[key] ?? S.lineages[key as keyof typeof S.lineages] ?? S.jornada.names[key]
    ?? S.villains[key as keyof typeof S.villains] ?? key;
}

/** Lápis de editar ao lado do avatar e do nome da Ficha (só visual: o botão inteiro edita). */
const editMark = () => `<span class="edit-mark" aria-hidden="true">${icon('pencil')}</span>`;

/** Botão do avatar no topo da Ficha: mostra o atual e abre a escolha. */
export function avatarButton(): string {
  const D = S.ui.desk;
  const spec = currentAvatar(ses.profile.avatar, avatarOptions());
  return `<button type="button" class="avatar-btn" data-avatar aria-label="${D.avatarEdit}"${tip(D.avatarTitle, D.avatarTip)}><span data-avatar-preview>${avatarArt(spec, 'md', true)}</span>${editMark()}</button>`;
}

/** Janela de escolha do avatar, em grupos. Os bloqueados aparecem em silhueta, com a dica de onde se liberam. */
export function openAvatarPicker(): void {
  const D = S.ui.desk;
  const choices = avatarOptions();
  const now = currentAvatar(ses.profile.avatar, choices);
  const entries = avatarEntries();
  const option = (e: AvatarEntry) => choices.includes(e.key)
    ? `<button type="button" class="avatar-opt" data-pick="${esc(e.key)}" aria-pressed="${e.key === now}">${avatarArt(e.key, 'md')}<small>${esc(avatarName(e.key))}</small></button>`
    : `<span class="avatar-opt locked" tabindex="0" role="img" aria-label="${D.avatarLocked}: ${esc(unlockHint(e))}"${tip(D.avatarLocked, unlockHint(e))}>${avatarArt(e.key, 'md', true, true)}<small>${D.avatarLocked}</small></span>`;
  const groups = (['origins', 'allies', 'villains'] as const).map((group) => {
    const list = entries.filter((e) => e.group === group);
    const got = list.filter((e) => choices.includes(e.key)).length;
    return `<section class="avatar-group"><h3 class="ach-cat">${D.avatarGroups[group]} <small class="muted">${S.achievements.progress(got, list.length)}</small></h3>
      <div class="avatar-grid">${list.map(option).join('')}</div></section>`;
  }).join('');
  const overlay = h(`<div class="modal" aria-label="${D.avatarPick}"><div class="modal-body avatar-pick">
    <div class="modal-head"><h2>${D.avatarPick}</h2><button class="btn small close" data-close aria-label="${S.ui.close}" title="${S.ui.close}">${icon('close')}</button></div>
    ${groups}</div></div>`);
  overlay.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const pick = t.closest<HTMLElement>('[data-pick]');
    if (pick) {
      ses.profile = { ...ses.profile, avatar: pick.dataset.pick! };
      saveProfile(ses.storage, ses.profile);
      document.querySelectorAll<HTMLElement>('[data-avatar-preview]').forEach((p) => (p.innerHTML = avatarArt(ses.profile.avatar!, 'md', true)));
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
  return `<section class="parchment desk-profile">
    <h3>${D.profileTitle}</h3>
    <div class="ninja-id">${avatarButton()}
      <span class="record-summary">
        <span class="ninja-name"><button type="button" class="name-btn" data-name-edit aria-label="${D.nameEdit}"${tip(D.nameTitle, D.nameTip)}><strong data-display-name>${esc(ses.profile.playerName || D.namePlaceholder)}</strong>${editMark()}</button></span>
        <span class="record-line"><span>${D.nav.roleta} ·</span> <span>${D.diffLine(runs.length, wins)}</span></span>
        <span class="record-line"><span>${D.campaignRecord} ·</span> <span>${best ? D.campaignResult(best.cycle, best.stage, best.won) : D.none}</span></span>
      </span>
    </div>
    <details class="ninja-record"><summary><b>${D.recordTitle} ${icon('chevron')}</b></summary>
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
