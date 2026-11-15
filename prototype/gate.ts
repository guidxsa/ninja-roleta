// Portão da Vila (escolha de modo), barra lateral do PC, avatar, ficha do perfil e nome do jogador.
import { lineageKey } from '../src/core/achievements';
import { avatarChoices, currentAvatar } from '../src/core/avatar';
import { achievements } from '../src/data/achievements';
import { jornadaAchievements } from '../src/data/jornada/achievements';
import { ptBR as S } from '../src/data/strings/ptBR';
import { saveProfile, bestRoletaCycle, PLAYER_NAME_MAX, cleanPlayerName } from '../src/state/profile';
import { loadRuns } from '../src/state/runHistory';
import { achievementIcon } from './achievementIcons';
import { sceneMedia, emblem, sceneVars, cloud, icon, ninjaPortrait } from './art';
import { h, show, choose, goHome, esc, openDialog } from './dom';
import { jornadaProgressCard } from './jornada';
import { jornadaHost } from './jornadaHost';
import { modeCard } from './modeCard';
import { askPlayerName } from './playerName';
import { type RegistryPage, openRegistry } from './registry';
import { syncSheetBtn } from './roleta/common';
import { ses, DIFFICULTIES } from './roleta/session';
import { tip } from './tooltip';

/** Tela inicial: Roleta (rápido, tudo na sorte) ou Jornada (lento, com controle). */
export async function modeScreen(): Promise<'roleta' | 'jornada' | 'jornada-continue'> {
  // A barra lateral pediu um modo de dentro de uma run: abre direto nele.
  if (pendingMode) {
    const m = pendingMode;
    pendingMode = null;
    markNav(m);
    return m;
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
  // Portão da Vila (docs/visual.md): destaque com citação, os modos em pergaminho com arte e a faixa de Conquistas.
  // A faixa usa data-profile (não data-choice): só abre a janela, não escolhe modo. O Registro fica na barra inferior.
  // Dualidade (docs/visual.md): de dia o Naruto observa Konoha, à noite o Sasuke. As duas cenas, frases e selos ficam
  // montados; o CSS mostra a do tema atual (data-theme) e troca devagar, como um amanhecer.
  const DU = G.duality;
  const pickQuote = (list: readonly { text: string; by: string }[]) => list[Math.floor(Math.random() * list.length)]!;
  const day = sceneMedia('portao-dia') ?? sceneMedia('portao');
  const night = sceneMedia('portao-noite') ?? day;
  const hero = day || night ? `<span class="duo-layer duo-day">${day ?? ''}</span><span class="duo-layer duo-night">${night ?? ''}</span>` : null;
  const duoQuote = (t: 'day' | 'night') => {
    const q = pickQuote(DU[t].quotes);
    return `<div class="duo-q duo-${t}"><p>${q.text}</p><cite>${q.by}</cite></div>`;
  };
  const gateCard = (id: 'jornada' | 'roleta') =>
    modeCard({
      id, art: sceneMedia(`modo-${id}`) ?? emblem(id), artVars: sceneVars(`modo-${id}`), seal: id === 'jornada' ? '道' : '運',
      name: M[id].name, desc: M[id].desc, cta: id === 'jornada' ? D.ctaJornadaNew : D.ctaRoleta,
    });
  // Run da Jornada salva: no PC o progresso fica na coluna da direita; no celular, onde a coluna some, o mesmo card
  // entra acima dos modos (o CSS mostra um ou outro).
  const resume = progressSlot();
  const root = show(
    h(`<div class="screen jmodes gate">
      <div class="gate-main">
        <div class="gate-banner">
          <header class="gate-head">
            <span class="gate-cloud l" aria-hidden="true">${cloud()}</span><span class="gate-cloud r" aria-hidden="true">${cloud()}</span>
            <h1 class="logo">${S.ui.title.split(' ').map((w, i) => `<span class="l${i + 1}">${w}</span>`).join('')}</h1>
            <p class="duo-tags"><span class="duo-tag duo-day">${DU.day.tag}</span><span class="duo-tag duo-night">${DU.night.tag}</span></p>
          </header>
          <div class="gate-hero duo" aria-hidden="true">${hero ?? ''}</div>
          <blockquote class="parchment gate-quote">${duoQuote('day')}${duoQuote('night')}
            <span class="seal duo-seal duo-day" aria-hidden="true">${DU.day.seal}</span><span class="seal duo-seal duo-night" aria-hidden="true">${DU.night.seal}</span></blockquote>
        </div>
        <p class="gate-sub">${M.title}</p>
        ${resume ? `<div class="gate-resume">${resume}</div>` : ''}
        <nav class="gate-modes">${gateCard('jornada')}${gateCard('roleta')}</nav>
        <button class="scroll-banner" data-profile="achievements"><span class="seal gold" aria-hidden="true">功</span>
          <span><b>${G.achievements}</b><small>${G.achievementsDesc}</small></span>${icon('chevron')}</button>
      </div>
      <aside class="gate-aside">${profileCard()}${progressSlot()}${recentCard()}</aside>
    </div>`),
  );
  // A barra lateral escolhe o modo pelo mesmo botão do card enquanto o Início está na tela.
  gateApi = { root };
  root.querySelector('[data-desk-name]')?.addEventListener('change', (e) => setPlayerName((e.target as HTMLInputElement).value));
  root.querySelector('.desk-id [data-avatar]')?.addEventListener('click', openAvatarPicker);
  markNav('home');
  const pick = await choose<'roleta' | 'jornada' | 'continue'>(root);
  gateApi = null;
  document.body.classList.remove('at-gate');
  markNav(pick === 'roleta' ? 'roleta' : 'jornada');
  return pick === 'continue' ? 'jornada-continue' : pick;
}

// ---------------------------------------------------------------------------
// Casca do PC (docs/visual.md, "Celular e desktop"): barra lateral persistente, Início em painéis, Registro em
// popup e a faixa de frases no pé. No celular nada disto aparece (o CSS esconde a partir de 900px).

export type NavId = 'home' | 'jornada' | 'roleta' | RegistryPage;
export const NAV_ICONS: Record<NavId, string> = { home: 'home', jornada: 'scroll', roleta: 'dice', history: 'book', bingo: 'card', relics: 'sparkle', achievements: 'medal' };
export const REGISTRY_PAGES: RegistryPage[] = ['history', 'bingo', 'relics', 'achievements'];

/** Modo pedido pela barra lateral de dentro de uma run: o próximo Portão abre direto nele. */
export let pendingMode: 'roleta' | 'jornada' | null = null;
/** Início aberto (só existe enquanto o Portão está na tela). */
export let gateApi: { root: HTMLElement } | null = null;

export function markNav(id: NavId): void {
  document.querySelectorAll<HTMLElement>('#side-nav [data-nav]').forEach((b) => {
    if (b.dataset.nav === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

export function installSideNav(): void {
  const D = S.ui.desk;
  const nav = document.getElementById('side-nav')!;
  nav.setAttribute('aria-label', D.navLabel);
  const item = (id: NavId) => `<button type="button" data-nav="${id}">${icon(NAV_ICONS[id])}<span>${D.nav[id]}</span></button>`;
  nav.innerHTML = `<span class="side-brand seal" aria-hidden="true">忍</span>${(['home', 'jornada', 'roleta'] as const).map(item).join('')}<hr>${REGISTRY_PAGES.map(item).join('')}`;
  nav.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-nav]');
    if (!b) return;
    const id = b.dataset.nav as NavId;
    // O Registro abre em popup em qualquer tela (a de trás fica intacta).
    if (id !== 'home' && id !== 'jornada' && id !== 'roleta') return openRegistry(id);
    // No Início: o modo é escolhido pelo mesmo botão do card.
    if (gateApi) {
      if (id !== 'home') gateApi.root.querySelector<HTMLElement>(`[data-choice="${id}"]`)?.click();
      return;
    }
    const inJornada = document.body.classList.contains('mode-jornada');
    if ((id === 'jornada' && inJornada) || (id === 'roleta' && !inJornada)) return;
    const text = inJornada && ses.jornadaSheet ? S.ui.homeConfirmJornada : !inJornada && ses.camp && ses.campLive ? S.ui.homeConfirmRoleta : null;
    if (text && !window.confirm(text)) return;
    pendingMode = id === 'home' ? null : id;
    goHome();
  });
}

/** Avatares liberados agora (core puro: origens jogadas no Roleta e conquistas da Jornada). */
export function avatarOptions(): string[] {
  const played = loadRuns(ses.storage).map((r) => lineageKey(r.origin));
  return avatarChoices({ playedLineages: [...new Set(played)], achievements: Object.keys(ses.profile.achievements) });
}

/** Desenho do avatar a partir da chave de retrato (`ninja:<chave>`). */
export function avatarArt(spec: string, size: 'sm' | 'md' | 'lg'): string {
  const key = spec.split(':')[1] ?? 'common';
  return ninjaPortrait(key, false, size);
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
  return `<button type="button" class="avatar-btn" data-avatar aria-label="${D.avatarEdit}"${tip(D.avatarTitle, D.avatarTip)}>${avatarArt(spec, size)}</button>`;
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
      document.querySelectorAll<HTMLElement>('[data-avatar]').forEach((b) => (b.innerHTML = avatarArt(ses.profile.avatar!, b.closest('.desk-id') ? 'md' : 'sm')));
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
    <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
  </section>`;
}

/** Progresso da Jornada na coluna direita, com o selo carimbado no canto ('' sem run salva). */
export function progressSlot(): string {
  const card = jornadaProgressCard(ses.storage);
  return card ? `<div class="desk-prog">${card}<span class="seal desk-seal" aria-hidden="true">巻</span></div>` : '';
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
