// Casca comum às telas: tema, botões do cabeçalho, fontes, erro, volta ao Portão, service worker e faixa de frases.
import { ptBR as S } from '../src/data/strings/ptBR';
import { icon, applySceneMode, hasSceneVideos } from './art';
import { setSfx, setMusic, mood } from './audio';
import { sleep, h, goHome, show, esc, choose } from './dom';
import { VERSION, toast, track, syncSheetBtn } from './roleta/common';
import { type Theme, ses, saveSettings } from './roleta/session';

/** Tema aplicado: o escolhido no botão ou o do aparelho. */
export const deviceTheme = window.matchMedia?.('(prefers-color-scheme: light)');
export const currentTheme = (): Theme => ses.settings.theme ?? (deviceTheme?.matches ? 'light' : 'dark');
export const THEME_COLORS: Record<Theme, string> = { dark: '#0d0c0b', light: '#e6dac0' };

export function applyTheme() {
  const theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLORS[theme]));
  const btn = document.getElementById('theme-btn')!;
  // O botão mostra para onde vai: sol à noite, lua de dia.
  const next = theme === 'dark' ? S.ui.themeDay : S.ui.themeNight;
  btn.innerHTML = `${icon(theme === 'dark' ? 'sun' : 'moon')}${toolLabel('theme')}`;
  btn.title = next;
  btn.setAttribute('aria-label', next);
}

/** Nome curto ao lado do ícone da barra: o CSS só mostra no PC (≥ 1280px). */
export function toolLabel(key: keyof typeof S.ui.toolLabels): string {
  return `<span class="tool-label">${S.ui.toolLabels[key]}</span>`;
}

/** O modo instantâneo também encurta as transições da interface (styles/instant.css). */
export function setInstantCss(on: boolean) {
  document.documentElement.toggleAttribute('data-instant', on);
}

/** Botões do cabeçalho: instantâneo, dia/noite, efeitos sonoros e música. */
export function installHeaderToggles() {
  setInstantCss(ses.settings.instant);
  // Modo das cenas antes de qualquer tela; o botão só aparece quando alguma vaga tem vídeo.
  applySceneMode(ses.settings.animated);
  document.getElementById('anim-btn')!.hidden = !hasSceneVideos();
  applyTheme();
  deviceTheme?.addEventListener?.('change', applyTheme);
  document.getElementById('theme-btn')!.addEventListener('click', () => {
    ses.settings.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    saveSettings();
    applyTheme();
  });

  const toggles = [
    { id: 'instant-btn', key: 'instant', on: 'lightning', off: 'lightning', label: S.ui.instant, apply: setInstantCss },
    { id: 'anim-btn', key: 'animated', on: 'sparkle', off: 'sparkle', label: S.ui.animated, apply: applySceneMode },
    { id: 'sfx-btn', key: 'sfx', on: 'soundOn', off: 'soundOff', label: S.ui.sfx, apply: setSfx },
    { id: 'music-btn', key: 'music', on: 'music', off: 'musicOff', label: S.ui.music, apply: setMusic },
  ] as const;
  for (const t of toggles) {
    const btn = document.getElementById(t.id)!;
    const render = () => {
      const on = ses.settings[t.key];
      btn.innerHTML = `${icon(on ? t.on : t.off)}${toolLabel(t.key)}`;
      btn.setAttribute('aria-pressed', String(on));
      btn.title = t.label(on);
      btn.setAttribute('aria-label', t.label(on));
    };
    render();
    btn.addEventListener('click', () => {
      ses.settings[t.key] = !ses.settings[t.key];
      saveSettings();
      t.apply(ses.settings[t.key]);
      render();
    });
  }
}

/** Garante as fontes embutidas antes de medir texto (rótulos da roleta). Sem suporte, segue sem esperar. */
export async function loadFonts(): Promise<void> {
  const faces = ['700 16px "Zen Kaku Gothic New"', '400 16px "Zen Kaku Gothic New"', '700 16px "Barlow Condensed"', '600 16px "Barlow Condensed"', '16px Shojumaru', '16px "Yuji Boku"'];
  try {
    await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f, f.includes('Yuji') ? '忍' : 'Aa'))), sleep(1500)]);
  } catch {
    /* fontes do sistema */
  }
}

/** Botão do Portão da Vila: confirma quando há run em andamento e volta ao menu sem recarregar a página. */
export function askHome() {
  const jornada = document.body.classList.contains('mode-jornada');
  const text = jornada && ses.jornadaSheet ? S.ui.homeConfirmJornada : !jornada && ses.camp && ses.campLive ? S.ui.homeConfirmRoleta : null;
  if (text && !window.confirm(text)) return;
  goHome();
}

/**
 * Uma tela quebrou no meio do fluxo (exceção). Antes, o laço principal parava e a interface congelava sem aviso. Agora:
 * fecha as camadas por cima, mostra o que houve e volta ao Portão. A Jornada salva fica como estava (é salva por parada).
 */
export async function errorScreen(err: unknown): Promise<void> {
  console.error(err);
  goHome();
  const E = S.ui.error;
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const root = show(
    h(`<div class="screen" role="alert"><h2>${E.title}</h2><section class="card"><p>${E.text}</p>
      <details><summary class="small muted">${E.detail}</summary><p class="pre small muted">${esc(`${detail} · ${S.ui.version(VERSION)}`)}</p></details></section>
      <button class="btn primary big" data-choice="ok">${icon('home')} ${E.home}</button></div>`),
  );
  await choose(root);
}

/** Erro fora do fluxo das telas (um clique, uma animação): a tela segue; avisa uma vez a cada tanto, sem travar. */
export let lastErrorToast = 0;
export function installErrorHandlers(): void {
  const warn = (err: unknown) => {
    console.error(err);
    if (Date.now() - lastErrorToast < 10_000) return;
    lastErrorToast = Date.now();
    toast(S.ui.error.title, 'warning');
  };
  window.addEventListener('error', (e) => warn(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => warn(e.reason));
}

/** Arruma o estado deixado pelo fluxo interrompido: a run do Roleta conta como abandonada; a da Jornada já está salva. */
export function leftToMenu() {
  if (ses.camp && ses.campLive) track({ status: 'abandoned' });
  ses.camp = null;
  ses.campLive = false;
  ses.battlePlayer = null;
  ses.jornadaSheet = null;
  document.body.classList.remove('mode-jornada');
  mood('neutral');
  syncSheetBtn();
}

/** Faixa de frases no pé (PC): uma frase sorteada, trocando a cada 20 s. */
/**
 * Jogo instalável e offline (prototype/sw.ts). Só num endereço web: aberto como arquivo (`file:`), o navegador não aceita
 * service worker, e o arquivo único já funciona sem rede.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(window.location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch((err: unknown) => console.warn('service worker', err));
}

export function installQuoteStrip(): void {
  const el = document.getElementById('quote-strip')!;
  const quotes = S.ui.gate.quotes;
  let last = -1;
  const next = () => {
    let i = Math.floor(Math.random() * quotes.length);
    if (quotes.length > 1 && i === last) i = (i + 1) % quotes.length;
    last = i;
    el.classList.remove('in');
    void el.offsetWidth;
    el.innerHTML = `“${quotes[i]!.text}” <cite>${quotes[i]!.by}</cite>`;
    el.classList.add('in');
  };
  next();
  setInterval(next, 20_000);
}
