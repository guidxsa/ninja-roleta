// Modo quadro: monta o contexto de um cenário e chama a tela real do jogo dentro da casca real.
import { untilHome, HOME } from '../dom';
import { installErrorHandlers, installShell } from '../shell';
import { freezeGameData, labContext, makeDeterministic } from './context';
import { byId, SCENARIOS } from './registry';
import type { LabPrefs } from './types';

/** O que o quadro conta ao catálogo (quando está dentro dele). */
export interface FrameStatus {
  id: string;
  state: 'running' | 'done' | 'home' | 'error';
  detail?: string;
}

const embedded = window.parent !== window;

function report(status: FrameStatus): void {
  if (embedded) window.parent.postMessage({ uilab: status }, window.location.origin);
  const bar = document.getElementById('uilab-bar');
  if (!bar || embedded) return;
  const text = { running: 'em andamento', done: `fim do cenário${status.detail ? ` · ${status.detail}` : ''}`, home: 'interrompido (Portão)', error: `erro · ${status.detail ?? ''}` }[status.state];
  bar.querySelector('[data-status]')!.textContent = text;
  bar.dataset.state = status.state;
}

export function prefsFrom(params: URLSearchParams): LabPrefs {
  return { instant: params.get('instant') === '1' };
}

export async function runFrame(id: string, params: URLSearchParams): Promise<void> {
  const scenario = byId.get(id);
  if (!scenario) {
    const near = SCENARIOS.filter((s) => s.id.startsWith(id.split(':')[0]!.split('.').slice(0, 2).join('.')));
    document.getElementById('screen')!.innerHTML = `<div class="screen"><h2>Cenário desconhecido</h2><p class="center">${id.replace(/</g, '&lt;')}</p>
      <ul>${(near.length ? near : SCENARIOS).map((s) => `<li><a href="?s=${encodeURIComponent(s.id)}&frame=1">${s.id}</a></li>`).join('')}</ul></div>`;
    return;
  }
  const seedParam = Number(params.get('seed'));
  const seed = Number.isInteger(seedParam) && seedParam > 0 ? seedParam : (scenario.seed ?? 1);
  makeDeterministic(seed);
  freezeGameData();
  const ctx = labContext(scenario, prefsFrom(params), seed);
  installErrorHandlers();
  await installShell();
  document.getElementById('version')!.textContent = `UI Lab · ${scenario.id} · seed ${seed}`;
  // No lab, o Portão do cabeçalho remonta o cenário do zero.
  document.getElementById('home-btn')!.addEventListener('click', () => window.location.reload());
  if (!embedded) {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<aside id="uilab-bar" class="uilab-bar"><b>${scenario.id}</b><span data-status></span>
        <button type="button" class="btn small" data-again>Repetir</button>
        <a class="btn small" href="?s=${encodeURIComponent(scenario.id)}">Catálogo</a></aside>`,
    );
    document.querySelector('#uilab-bar [data-again]')!.addEventListener('click', () => window.location.reload());
  }
  report({ id, state: 'running' });
  try {
    const result = await untilHome(scenario.mount(ctx));
    report(result === HOME ? { id, state: 'home' } : { id, state: 'done', ...(typeof result === 'string' ? { detail: result } : {}) });
  } catch (err) {
    console.error(err);
    report({ id, state: 'error', detail: err instanceof Error ? err.message : String(err) });
  }
}
