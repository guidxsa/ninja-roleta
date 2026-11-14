// Protótipo jogável: interface mínima sobre o core real. Toda regra vem de src/core; aqui só há fluxo e animação.
// Inicialização do jogo: monta a sessão a partir do aparelho e abre o Portão (o resto das telas fica nos módulos).
import { parseSeedParam } from '../src/core/lab';
import { ptBR as S } from '../src/data/strings/ptBR';
import { markAbandonedRuns } from '../src/state/runHistory';
import { icon, uiTextureVars, installSceneRatios } from './art';
import { installAudio } from './audio';
import { untilHome, HOME } from './dom';
import { installSideNav, modeScreen, ensurePlayerName } from './gate';
import { runJornada } from './jornada';
import { installFolds } from './jornada/fold';
import { jornadaHost } from './jornadaHost';
import { openProfile, type ProfileTab } from './registry';
import { data, backfillProfile, openSheet, VERSION } from './roleta/common';
import { runCampaign } from './roleta/run';
import { originScreen } from './roleta/screens/origin';
import { initSession, browserStorage, ses } from './roleta/session';
import { installErrorHandlers, registerServiceWorker, installHeaderToggles, toolLabel, installQuoteStrip, loadFonts, askHome, leftToMenu, errorScreen } from './shell';
import { installTooltips } from './tooltip';

async function main() {
  initSession(browserStorage(), parseSeedParam(window.location.search));
  installErrorHandlers();
  registerServiceWorker();
  markAbandonedRuns(ses.storage, new Date(), data.balance.history.maxRuns);
  backfillProfile();


  installAudio(ses.settings);
  installHeaderToggles();
  document.getElementById('history-btn')!.addEventListener('click', () => openProfile());
  // Atalhos do Portão da Vila para o registro ninja.
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-profile]');
    if (el) openProfile(el.dataset.profile as ProfileTab);
  });
  document.getElementById('sheet-btn')!.addEventListener('click', openSheet);
  // Botões "Ficha" dentro das telas (painel do jogador, card da luta).
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-sheet]')) openSheet();
  });
  // Tocar na roleta prossegue: aperta o botão principal dela ("Girar"), o que veio junto do resultado
  // ou o "Continuar" da tela. Nada acontece enquanto ela gira; escolhas de verdade (equipar) não entram.
  document.addEventListener('click', (e) => {
    const block = (e.target as HTMLElement).closest<HTMLElement>('.wheel-block');
    if (!block || block.dataset.spinning) return;
    const box = block.closest('.wheel-box');
    const scopes = [box, box?.parentElement, document.querySelector('#screen .sticky-cta')];
    const pick = ['spin', 'keep', 'ok', 'go', 'start']
      .map((c) => `button.primary[data-choice="${c}"]:not([disabled])`)
      .join(',');
    for (const scope of scopes) {
      const btn = scope?.querySelector<HTMLButtonElement>(pick);
      if (btn) {
        btn.click();
        return;
      }
    }
  });
  document.getElementById('disclaimer')!.textContent = S.ui.disclaimer;
  document.getElementById('version')!.textContent = S.ui.version(VERSION);
  document.getElementById('sheet-btn')!.innerHTML = `${icon('scroll')}${toolLabel('sheet')}`;
  document.getElementById('home-btn')!.innerHTML = `${icon('home')}<span>${S.ui.homeShort}</span>`;
  document.getElementById('home-btn')!.title = S.ui.home;
  document.getElementById('home-btn')!.setAttribute('aria-label', S.ui.home);
  const gateNav = document.getElementById('gate-nav')!;
  gateNav.setAttribute('aria-label', S.ui.gate.registry);
  const navItem = (kanji: string, label: string, attr = '') =>
    `<button type="button" ${attr}><span class="kanji${kanji.length > 1 ? ' two' : ''}" aria-hidden="true">${kanji}</span>${label}</button>`;
  gateNav.innerHTML =
    navItem('忍', S.ui.gate.home, 'aria-current="page"') +
    (
      [
        ['history', '歴'],
        ['bingo', '手配'],
        ['relics', '宝'],
        ['origins', '族'],
      ] as const
    )
      .map(([tab, kanji]) => navItem(kanji, S.profile.tabs[tab], `data-profile="${tab}"`))
      .join('');
  document.getElementById('history-btn')!.innerHTML = `${icon('book')}${toolLabel('history')}`;

  installTooltips();
  for (const [k, v] of Object.entries(uiTextureVars())) document.documentElement.style.setProperty(k, v);
  installSideNav();
  installQuoteStrip();
  installSceneRatios();
  installFolds();
  await loadFonts();

  if (ses.seed !== null) document.getElementById('version')!.textContent += ` · ${S.ui.seedBadge(ses.seed)}`;
  document.getElementById('home-btn')!.addEventListener('click', askHome);
  const round = async () => {
    const pick = await modeScreen();
    if (pick !== 'roleta') return runJornada(jornadaHost, { resume: pick === 'jornada-continue' });
    await ensurePlayerName();
    await originScreen();
    await runCampaign();
  };
  for (;;) {
    try {
      if ((await untilHome(round())) === HOME) leftToMenu();
    } catch (err) {
      leftToMenu();
      // O próprio aviso também pode ser interrompido pelo botão do Portão.
      await untilHome(errorScreen(err));
    }
  }
}

void main();
