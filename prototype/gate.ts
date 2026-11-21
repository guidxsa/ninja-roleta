// Portão da Vila (escolha de modo), barra lateral do PC, avatar, ficha do perfil e nome do jogador.
import { lineageKey } from '../src/core/achievements';
import { avatarChoices, currentAvatar } from '../src/core/avatar';
import { achievements } from '../src/data/achievements';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { ptBR as S } from '../src/data/strings/ptBR';
import { saveProfile, bestRoletaCycle, PLAYER_NAME_MAX, cleanPlayerName } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { loadJornada } from '../src/state/jornadaSave';
import { achievementIcon } from './achievementIcons';
import { AVATAR_CUTS, sceneMedia, sceneFx, emblem, sceneVars, cloud, icon, ninjaPortrait } from './art';
import { h, show, choose, goHome, esc, openDialog } from './dom';
import { entryForRun, type JornadaEntry } from './jornada';
import { jornadaHost } from './jornadaHost';
import { modeCard } from './modeCard';
import { askPlayerName } from './playerName';
import { type RegistryPage, openRegistry } from './registry';
import { syncSheetBtn } from './roleta/common';
import { ses, DIFFICULTIES } from './roleta/session';
import { tip } from './tooltip';

type GateMode = 'roleta' | JornadaEntry;
interface GatePick { mode: GateMode; resume?: boolean }

/** Escolha direta do Portão, compartilhada pelos cards e pela navegação. */
export async function modeScreen(): Promise<GatePick> {
  // A barra lateral pediu um modo de dentro de uma run: abre direto nele.
  if (pendingMode) {
    const m = pendingMode;
    pendingMode = null;
    markNav(m);
    return { mode: m };
  }
  const M = S.jornada.modes;
  const D = S.ui.desk;
  // No Portão da Vila não há run: some o botão do menu e o da Ficha.
  ses.camp = null;
  ses.campLive = false;
  syncSheetBtn();
  document.body.classList.add('at-gate');
  document.getElementById('dots')!.innerHTML = '';
  const G = S.ui.gate;
  const hero = sceneMedia('portao');
  const saved = loadJornada(ses.storage);
  const savedMode = saved && entryForRun(saved);
  const quote = G.quotes[Math.floor(Math.random() * G.quotes.length)]!;
  const gateCard = (id: GateMode, artKey: string, seal: string, cta: string) => modeCard({
    id, art: sceneMedia(artKey) ?? emblem(id === 'roleta' ? 'roleta' : 'jornada'), artVars: sceneVars(artKey),
    seal, ...M[id], cta: savedMode === id ? G.newRun : cta,
    resume: savedMode === id ? { choice: 'continue', label: S.ui.continue } : undefined,
  });
  const root = show(
    h(`<div class="screen jmodes gate">
      <div class="gate-main">
        <div class="gate-banner">
          <header class="gate-head">
            <span class="gate-cloud l" aria-hidden="true">${cloud()}</span><span class="gate-cloud r" aria-hidden="true">${cloud()}</span>
            <h1 class="logo">${S.ui.title.split(' ').map((w, i) => `<span class="l${i + 1}">${w}</span>`).join('')}</h1>
          </header>
          <div class="gate-hero" aria-hidden="true">${hero ?? ''}${sceneFx()}</div>
          <blockquote class="parchment gate-quote"><div><p>${quote.text}</p><cite>${quote.by}</cite></div>
            <span class="seal quote-seal" aria-hidden="true">影</span></blockquote>
        </div>
        <p class="gate-sub">${M.title}</p>
        <nav class="gate-modes" aria-label="${M.title}">
          ${gateCard('roleta', 'modo-roleta', '運', D.ctaRoleta)}
          ${gateCard('story', 'modo-jornada', '史', S.jornada.start.storyCta)}
          ${gateCard('path', 'modo-caminho', '道', S.jornada.start.pathCta)}
        </nav>
      </div>
      <aside class="gate-aside">${profileCard()}${recentCard()}</aside>
    </div>`),
  );
  // A barra lateral escolhe o modo pelo mesmo botão do card enquanto o Início está na tela.
  gateApi = { root };
  // A coluna direita (PC) só esmaece o pé quando de fato rola.
  const aside = root.querySelector<HTMLElement>('.gate-aside');
  if (aside) requestAnimationFrame(() => aside.classList.toggle('scrolls', aside.scrollHeight > aside.clientHeight + 1));
  root.querySelector('[data-desk-name]')?.addEventListener('change', (e) => setPlayerName((e.target as HTMLInputElement).value));
  root.querySelector('.desk-id [data-avatar]')?.addEventListener('click', openAvatarPicker);
  markNav('home');
  const pick = await choose<GateMode | 'continue'>(root);
  gateApi = null;
  document.body.classList.remove('at-gate');
  if (pick === 'continue') {
    // Só existe botão de retomada quando o card foi montado com este save.
    if (!savedMode) return modeScreen();
    markNav(savedMode);
    return { mode: savedMode, resume: true };
  }
  markNav(pick);
  return { mode: pick };
}

// ---------------------------------------------------------------------------
// Casca do PC (docs/visual.md, "Celular e desktop"): barra lateral persistente, Início em painéis, Registro em
// popup e a faixa de frases no pé. No celular nada disto aparece (o CSS esconde a partir de 900px).

type NavId = 'home' | GateMode | 'registry';
const destinations: readonly NavId[] = ['home', 'roleta', 'story', 'path', 'registry'];
const navIcons: Record<NavId | RegistryPage, string> = {
  home: 'home', roleta: 'dice', story: 'scroll', path: 'kunai', registry: 'book',
  history: 'book', bingo: 'card', relics: 'sparkle', achievements: 'medal',
};
const registryPages: RegistryPage[] = ['history', 'bingo', 'relics', 'achievements'];

let pendingMode: GateMode | null = null;
let gateApi: { root: HTMLElement } | null = null;
let activeNav: NavId = 'home';

function markNav(id: NavId): void {
  activeNav = id;
  document.querySelectorAll<HTMLElement>('#side-nav [data-nav], #gate-nav [data-nav]').forEach((b) => {
    if (b.dataset.nav === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

/** Escolher uma seção mantém a tela atual por baixo do Registro. */
function openRegistryMenu(): void {
  const D = S.ui.desk;
  const overlay = h(`<div class="modal" aria-label="${S.ui.gate.registry}"><div class="modal-body">
    <div class="modal-head"><h2>${S.ui.gate.registry}</h2><button class="btn small" data-close aria-label="${S.ui.close}">${icon('close')}</button></div>
    <div class="registry-links">${registryPages.map((page) => `<button class="btn" data-page="${page}">${icon(navIcons[page])} ${D.nav[page]}</button>`).join('')}</div>
    </div></div>`);
  overlay.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const page = target.closest<HTMLElement>('[data-page]')?.dataset.page as RegistryPage | undefined;
    if (page || target === overlay || target.closest('[data-close]')) overlay.remove();
    if (page) queueMicrotask(() => openRegistry(page));
  });
  openDialog(overlay);
}

export function installSideNav(): void {
  const D = S.ui.desk;
  const item = (id: NavId) => `<button type="button" data-nav="${id}">${icon(navIcons[id])}<span>${D.nav[id]}</span></button>`;
  for (const key of ['side-nav', 'gate-nav']) {
    const nav = document.getElementById(key)!;
    nav.setAttribute('aria-label', D.navLabel);
    const brand = key === 'side-nav' ? `<span class="side-brand seal brand-seal" aria-hidden="true">${icon('konoha')}</span>` : '';
    nav.innerHTML = brand + destinations.map(item).join('');
    nav.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).closest<HTMLElement>('[data-nav]')?.dataset.nav as NavId | undefined;
      if (!id || id === activeNav) return;
      if (id === 'registry') return openRegistryMenu();
      if (gateApi) {
        gateApi.root.querySelector<HTMLButtonElement>(`[data-choice="${id}"]`)?.click();
        return;
      }
      const inJornada = document.body.classList.contains('mode-jornada');
      const text = inJornada && ses.jornadaSheet ? S.ui.homeConfirmJornada : !inJornada && ses.camp && ses.campLive ? S.ui.homeConfirmRoleta : null;
      if (text && !window.confirm(text)) return;
      pendingMode = id === 'home' ? null : id;
      goHome();
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

/** Botão do avatar (ficha do Início e Registro): mostra o atual e abre a escolha. */
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
    [D.stats.jornada, best ? S.jornada.start.best(best.cycle, best.stage, best.won) : D.none],
    // Só as do catálogo atual: ids antigos no perfil davam 78/64.
    [D.stats.achievements, `${countedIds.filter((id) => id in ses.profile.achievements).length}/${counted}`],
    [D.stats.villains, String(Object.keys(ses.profile.villains).length)],
    [D.stats.relics, String(Object.keys(ses.profile.relics).length)],
  ];
  return `<section class="parchment desk-profile"><span class="desk-pin" aria-hidden="true">${icon('kunai')}</span>
    <h3>${D.profileTitle}</h3>
    <div class="desk-id">${avatarButton('md')}
      <label class="field"><span>${S.ui.playerName.label}</span><input type="text" data-desk-name maxlength="${PLAYER_NAME_MAX}" autocomplete="nickname" placeholder="${D.namePlaceholder}" value="${esc(ses.profile.playerName ?? '')}"></label></div>
    <details class="ninja-record"><summary>Registro do ninja</summary><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>
  </section>`;
}

/** Conquistas recentes (coluna direita do Início), com o atalho para a página. */
export function recentCard(): string {
  const recent = jornadaHost.recentAchievements(3);
  if (!recent.length) return '';
  const J = S.jornada.start;
  return `<section class="parchment jrecent desk-recent"><h3>${J.recentTitle} <button type="button" class="btn small desk-all" data-profile="achievements">${S.ui.desk.seeAll} ${icon('chevron')}</button></h3><ul>${recent
    .map((a) => `<li><span class="seal ach-ico" aria-hidden="true">${achievementIcon(a.id)}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span><time>${J.when(a.days)}</time></li>`)
    .join('')}</ul></section>`;
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
