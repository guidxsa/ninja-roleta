// Dicas sobre qualquer elemento com `data-tip` (HTML escapado no atributo).
// Mouse: passar por cima mostra. Toque: um toque mostra nos elementos informativos (selos, condições, passivas);
// nos botões, segurar mostra e o toque rápido continua valendo como clique.

const LONG_PRESS_MS = 420;
const MOVE_TOLERANCE = 10;
const HOVER_DELAY_MS = 220;

const escAttr = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Atributo de dica para colar num elemento: título e corpo (HTML confiável, vindo dos textos do jogo). */
export function tip(title: string, body: string): string {
  const html = `${title ? `<b class="tip-title">${title}</b>` : ''}${body}`;
  return ` data-tip="${escAttr(html)}"`;
}

const INTERACTIVE = 'button, a, input, label, [data-choice]';
const isInteractive = (el: Element) => Boolean(el.closest(INTERACTIVE));
/** Botão bloqueado (`aria-disabled`): o toque não aciona nada, então mostra a dica, que diz o motivo do bloqueio. */
const isBlocked = (el: Element) => el.closest(INTERACTIVE)?.getAttribute('aria-disabled') === 'true';

/**
 * Elementos informativos com dica (chips, selos, linhas da ficha) recebem foco, para a dica abrir também pelo teclado.
 * Os que ficam dentro de um botão ficam de fora: o próprio botão já recebe o foco.
 */
function makeTipsFocusable(root: Element | Document): void {
  const own = root instanceof HTMLElement && root.matches('[data-tip]:not([tabindex])') ? [root] : [];
  for (const el of [...own, ...root.querySelectorAll<HTMLElement>('[data-tip]:not([tabindex])')]) {
    if (!isInteractive(el)) el.tabIndex = 0;
  }
}

export function installTooltips(): void {
  const box = document.createElement('div');
  box.className = 'tip';
  box.id = 'tip-box';
  box.setAttribute('role', 'tooltip');
  box.hidden = true;
  document.body.appendChild(box);

  let anchor: HTMLElement | null = null;
  let hoverTimer = 0;
  let pressTimer = 0;
  let pressStart: { x: number; y: number } | null = null;
  /** O toque longo abriu a dica: o clique que vem em seguida não pode acionar o botão. */
  let swallowClick = false;
  let lastPointer = 'mouse';

  const release = (el: HTMLElement | null) => {
    el?.classList.remove('tip-on');
    el?.removeAttribute('aria-describedby');
  };
  const hide = () => {
    release(anchor);
    anchor = null;
    box.hidden = true;
  };

  const show = (el: HTMLElement) => {
    const html = el.dataset.tip;
    if (!html) return;
    release(anchor);
    anchor = el;
    el.classList.add('tip-on');
    // O leitor de tela lê a dica junto com o elemento.
    el.setAttribute('aria-describedby', box.id);
    box.innerHTML = html;
    box.hidden = false;
    place();
  };

  /** Acima do elemento quando cabe; senão, abaixo. Sempre dentro da tela. */
  const place = () => {
    if (!anchor) return;
    if (!anchor.isConnected) return hide();
    const r = anchor.getBoundingClientRect();
    const margin = 8;
    box.style.maxWidth = `${Math.min(320, window.innerWidth - margin * 2)}px`;
    const w = box.offsetWidth;
    const hgt = box.offsetHeight;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
    const above = r.top - hgt - 10;
    const below = r.bottom + 10;
    const top = above >= margin ? above : Math.min(below, window.innerHeight - hgt - margin);
    box.style.left = `${left}px`;
    box.style.top = `${Math.max(margin, top)}px`;
    box.classList.toggle('below', above < margin);
    box.style.setProperty('--arrow', `${r.left + r.width / 2 - left}px`);
  };

  const target = (e: Event) => (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-tip]') ?? null;

  // Mouse: passar por cima.
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = target(e);
    clearTimeout(hoverTimer);
    if (!el) return;
    if (el === anchor) return;
    hoverTimer = window.setTimeout(() => show(el), HOVER_DELAY_MS);
  });
  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = target(e);
    const to = (e.relatedTarget as HTMLElement | null)?.closest?.('[data-tip]');
    if (el && to !== el) {
      clearTimeout(hoverTimer);
      if (anchor === el) hide();
    }
  });

  // Toque: segurar abre a dica (em qualquer elemento com dica).
  document.addEventListener('pointerdown', (e) => {
    lastPointer = e.pointerType;
    if (e.pointerType === 'mouse') return;
    const el = target(e);
    clearTimeout(pressTimer);
    if (!el) return;
    pressStart = { x: e.clientX, y: e.clientY };
    pressTimer = window.setTimeout(() => {
      show(el);
      swallowClick = true;
      navigator.vibrate?.(12);
    }, LONG_PRESS_MS);
  });
  const cancelPress = () => {
    clearTimeout(pressTimer);
    pressStart = null;
  };
  document.addEventListener('pointermove', (e) => {
    if (!pressStart) return;
    if (Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > MOVE_TOLERANCE) cancelPress();
  });
  document.addEventListener('pointerup', cancelPress);
  document.addEventListener('pointercancel', cancelPress);
  // Segurar não abre o menu do sistema sobre elementos com dica.
  document.addEventListener('contextmenu', (e) => {
    if (target(e)) e.preventDefault();
  });

  // Cliques: engole o do toque longo; toque simples em elemento informativo alterna a dica.
  document.addEventListener(
    'click',
    (e) => {
      if (swallowClick) {
        swallowClick = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const el = target(e);
      if (el && (!isInteractive(el) || isBlocked(el))) {
        // No toque, alterna; no mouse a passagem já abriu, então o clique só garante que fique aberta.
        if (anchor === el && lastPointer !== 'mouse') hide();
        else if (anchor !== el) show(el);
        return;
      }
      if (!box.contains(e.target as Node)) hide();
    },
    true,
  );

  // Teclado: o foco visível (Tab) abre a dica; o foco do clique ou do toque não (aí valem as regras acima).
  document.addEventListener('focusin', (e) => {
    const el = target(e);
    if (el && el.matches(':focus-visible')) show(el);
  });
  document.addEventListener('focusout', (e) => {
    if (anchor && target(e) === anchor && lastPointer === 'keyboard') hide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') lastPointer = 'keyboard';
  });

  window.addEventListener('scroll', () => anchor && place(), { passive: true, capture: true });
  window.addEventListener('resize', hide);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && hide());
  // A tela trocou e o elemento sumiu: fecha. Dicas novas na tela ficam focáveis.
  makeTipsFocusable(document);
  new MutationObserver((records) => {
    if (anchor && !anchor.isConnected) hide();
    for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && makeTipsFocusable(n));
  }).observe(document.body, { childList: true, subtree: true });
}
