// Catálogo do UI Lab: lista de cenários, larguras de tela, instantâneo, e o quadro num iframe do tamanho certo
// (só o iframe dispara as mesmas media queries do aparelho). A única coisa gravada é a última escolha do catálogo.
import { esc } from '../dom';
import type { FrameStatus } from './frame';
import { SCENARIOS } from './registry';
import type { Group } from './types';

const PREFS_KEY = 'uilab_prefs_v1';
const SIZES = [
  { id: '360', w: 360, h: 780, label: '360 · celular estreito' },
  { id: '390', w: 390, h: 844, label: '390 · celular' },
  { id: '768', w: 768, h: 1024, label: '768 · tablet' },
  { id: '1024', w: 1024, h: 720, label: '1024 · PC' },
  { id: '1440', w: 1440, h: 900, label: '1440 · widescreen' },
] as const;
const GROUPS: Group[] = ['Entrada', 'Roleta', 'Jornada', 'Narrativa', 'Combate', 'Progressão', 'Recompensas', 'Loja', 'Fim da run', 'Sistemas'];

interface CatalogPrefs {
  id: string;
  size: string;
  instant: boolean;
}

function loadPrefs(): Partial<CatalogPrefs> {
  try {
    return JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<CatalogPrefs>;
  } catch {
    return {};
  }
}

function savePrefs(p: CatalogPrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* conveniência */
  }
}

export function runCatalog(params: URLSearchParams): void {
  const saved = loadPrefs();
  const first = SCENARIOS[0]!.id;
  const state: CatalogPrefs = {
    id: params.get('s') ?? saved.id ?? first,
    size: params.get('w') ?? saved.size ?? '390',
    instant: params.has('instant') ? params.get('instant') === '1' : Boolean(saved.instant),
  };
  if (!SCENARIOS.some((s) => s.id === state.id)) state.id = first;
  document.body.classList.add('uilab-catalog');

  const list = GROUPS.map((g) => {
    const items = SCENARIOS.filter((s) => s.group === g);
    if (!items.length) return '';
    return `<section class="uilab-group"><h2>${g} <small>${items.length}</small></h2><ul>${items
      .map((s) => `<li><button type="button" data-id="${esc(s.id)}"><b>${esc(s.title)}</b><code>${esc(s.id)}</code></button></li>`)
      .join('')}</ul></section>`;
  }).join('');
  const root = document.createElement('div');
  root.className = 'uilab';
  root.innerHTML = `
    <aside class="uilab-side">
      <header><span class="seal" aria-hidden="true">試</span><div><h1>UI Lab</h1><p>${SCENARIOS.length} cenários · só local</p></div></header>
      <input type="search" class="uilab-search" placeholder="Buscar cenário ou id" aria-label="Buscar cenário">
      <nav class="uilab-list">${list}</nav>
    </aside>
    <main class="uilab-stage">
      <div class="uilab-tools">
        <div class="segmented" role="group" aria-label="Largura">${SIZES.map((z) => `<button type="button" class="btn seg" data-size="${z.id}" title="${z.label}">${z.id}</button>`).join('')}</div>
        <label class="uilab-check"><input type="checkbox" data-instant> Instantâneo</label>
        <span class="uilab-status" data-status></span>
        <button type="button" class="btn small" data-reload>Repetir</button>
        <a class="btn small" data-alone target="_blank" rel="noopener">Abrir sozinho</a>
      </div>
      <div class="uilab-viewport"><div class="uilab-device"><iframe title="Cenário"></iframe></div></div>
    </main>`;
  document.body.appendChild(root);

  const iframe = root.querySelector('iframe')!;
  const device = root.querySelector<HTMLElement>('.uilab-device')!;
  const viewport = root.querySelector<HTMLElement>('.uilab-viewport')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const frameUrl = () => `?s=${encodeURIComponent(state.id)}&frame=1${state.instant ? '&instant=1' : ''}`;

  /** Escala o aparelho para caber na área, sem mudar a largura que o iframe enxerga. */
  const fit = () => {
    const z = SIZES.find((x) => x.id === state.size) ?? SIZES[1];
    const scale = Math.min(1, (viewport.clientWidth - 24) / z.w, (viewport.clientHeight - 24) / z.h);
    iframe.style.width = `${z.w}px`;
    iframe.style.height = `${z.h}px`;
    iframe.style.transform = `scale(${scale})`;
    device.style.width = `${z.w * scale}px`;
    device.style.height = `${z.h * scale}px`;
  };
  const sync = (reload = true) => {
    root.querySelectorAll<HTMLElement>('[data-id]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === state.id)));
    root.querySelectorAll<HTMLElement>('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === state.size)));
    root.querySelector<HTMLInputElement>('[data-instant]')!.checked = state.instant;
    root.querySelector<HTMLAnchorElement>('[data-alone]')!.href = frameUrl();
    savePrefs(state);
    window.history.replaceState(null, '', `?s=${encodeURIComponent(state.id)}&w=${state.size}${state.instant ? '&instant=1' : ''}`);
    fit();
    if (reload) {
      status.textContent = '';
      iframe.src = frameUrl();
    }
  };

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const pick = t.closest<HTMLElement>('[data-id]');
    if (pick) return ((state.id = pick.dataset.id!), sync());
    const size = t.closest<HTMLElement>('[data-size]');
    if (size) return ((state.size = size.dataset.size!), sync());
    if (t.closest('[data-reload]')) sync();
  });
  root.querySelector('[data-instant]')!.addEventListener('change', (e) => {
    state.instant = (e.target as HTMLInputElement).checked;
    sync();
  });
  root.querySelector<HTMLInputElement>('.uilab-search')!.addEventListener('input', (e) => {
    const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
    root.querySelectorAll<HTMLElement>('.uilab-list li').forEach((li) => (li.hidden = Boolean(q) && !li.textContent!.toLowerCase().includes(q)));
  });
  window.addEventListener('resize', fit);
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin || e.source !== iframe.contentWindow) return;
    const s = (e.data as { uilab?: FrameStatus }).uilab;
    if (!s) return;
    status.dataset.state = s.state;
    status.textContent = { running: 'em andamento', done: `fim${s.detail ? ` · ${s.detail}` : ''}`, home: 'interrompido (Portão)', error: `erro · ${s.detail ?? ''}` }[s.state];
  });
  sync();
}
