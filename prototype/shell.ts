// Casca comum às telas: tema, botões do cabeçalho, fontes, erro, volta ao Portão, service worker e faixa de frases.
import { ptBR as S } from '../src/data/strings/ptBR';
import { icon, applySceneMode, installSceneRatios, uiTextureVars } from './art';
import { installAudio, setSfx, setMusic, mood } from './audio';
import { installSideNav } from './gate';
import { installFolds } from './jornada/fold';
import { openProfile, type ProfileTab } from './registry';
import { installTooltips } from './tooltip';
import { sleep, h, goHome, show, esc, choose } from './dom';
import { VERSION, openSheet, toast, track, syncSheetBtn } from './roleta/common';
import { ses, saveSettings } from './roleta/session';

/** Nome curto ao lado do ícone da barra: o CSS só mostra no PC (≥ 1280px). */
export function toolLabel(key: keyof typeof S.ui.toolLabels): string {
  return `<span class="tool-label">${S.ui.toolLabels[key]}</span>`;
}

/** O modo instantâneo também encurta as transições da interface (styles/instant.css). */
export function setInstantCss(on: boolean) {
  document.documentElement.toggleAttribute('data-instant', on);
}

/**
 * Modo Animado: vídeo nas vagas que têm (art.ts) e a cena viva do Portão (styles/menu.css, `.gate-fx`), que o CSS só
 * mostra com `data-animated` e sem `data-instant`.
 */
export function setAnimated(on: boolean) {
  applySceneMode(on);
  document.documentElement.toggleAttribute('data-animated', on);
}

/** Botões do cabeçalho: instantâneo, animação, efeitos sonoros e música. */
export function installHeaderToggles() {
  setInstantCss(ses.settings.instant);
  // Modo das cenas antes de qualquer tela.
  setAnimated(ses.settings.animated);
  document.querySelector('.brand-seal')!.innerHTML = icon('konoha');

  const toggles = [
    { id: 'instant-btn', key: 'instant', on: 'lightning', off: 'lightning', label: S.ui.instant, apply: setInstantCss },
    { id: 'anim-btn', key: 'animated', on: 'sparkle', off: 'sparkle', label: S.ui.animated, apply: setAnimated },
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

/** A alça continua focável com o painel recolhido. Os controles só entram no Tab quando visíveis. */
function installHeaderGrip(): void {
  const top = document.querySelector<HTMLElement>('header.top')!;
  const grip = top.querySelector<HTMLButtonElement>('.top-grip')!;
  grip.innerHTML = icon('konoha');
  grip.setAttribute('aria-label', S.ui.gate.tools);
  const setOpen = (open: boolean) => {
    top.classList.toggle('open', open);
    grip.setAttribute('aria-expanded', String(open));
  };
  const fine = matchMedia('(pointer: fine)');
  top.addEventListener('pointerenter', (e) => { if (fine.matches && e.pointerType === 'mouse') setOpen(true); });
  top.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !top.querySelector(':focus-visible')) setOpen(false);
  });
  top.addEventListener('focusin', (e) => {
    if ((e.target as HTMLElement).matches(':focus-visible')) setOpen(true);
  });
  top.addEventListener('focusout', (e) => {
    if (!top.contains(e.relatedTarget as Node | null)) setOpen(false);
  });
  grip.addEventListener('click', () => setOpen(!top.classList.contains('open')));
  top.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      grip.focus();
      setOpen(false);
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!top.contains(e.target as Node)) setOpen(false);
  });
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

/**
 * Casca das telas: som, botões do cabeçalho, atalhos (Registro, Ficha, toque na roleta), textos fixos, barras de navegação,
 * dicas, faixa de frases e fontes. O jogo e o UI Lab chamam a mesma, depois de montar a sessão.
 */
export async function installShell(): Promise<void> {
  installAudio(ses.settings);
  installHeaderToggles();
  installHeaderGrip();
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
  document.getElementById('history-btn')!.innerHTML = `${icon('book')}${toolLabel('history')}`;

  installTooltips();
  for (const [k, v] of Object.entries(uiTextureVars())) document.documentElement.style.setProperty(k, v);
  installSideNav();
  installQuoteStrip();
  installSceneRatios();
  installFolds();
  await loadFonts();
}
