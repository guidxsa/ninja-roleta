// Protótipo jogável: interface mínima sobre o core real. Toda regra vem de src/core; aqui só há fluxo e animação.
// Inicialização do jogo: monta a sessão a partir do aparelho e abre o Portão (o resto das telas fica nos módulos).
import { parseSeedParam } from '../src/core/lab';
import { ptBR as S } from '../src/data/strings/ptBR';
import { markAbandonedRuns } from '../src/state/runHistory';
import { untilHome, HOME } from './dom';
import { modeScreen } from './gate';
import { runJornada } from './jornada';
import { jornadaHost } from './jornadaHost';
import { data, backfillProfile } from './roleta/common';
import { playArcade } from './roleta/run';
import { initSession, browserStorage, ses } from './roleta/session';
import { installErrorHandlers, registerServiceWorker, installShell, askHome, leftToMenu, errorScreen } from './shell';

async function main() {
  initSession(browserStorage(), parseSeedParam(window.location.search));
  installErrorHandlers();
  registerServiceWorker();
  markAbandonedRuns(ses.storage, new Date(), data.balance.history.maxRuns);
  backfillProfile();
  await installShell();

  if (ses.seed !== null) document.getElementById('version')!.textContent += ` · ${S.ui.seedBadge(ses.seed)}`;
  document.getElementById('home-btn')!.addEventListener('click', askHome);
  const round = async () => {
    const pick = await modeScreen();
    if (pick.mode !== 'roleta') return runJornada(jornadaHost, { entry: pick.mode, resume: pick.resume });
    await playArcade();
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
