// Utilitários de DOM do protótipo, usados pelo Roleta (main.ts) e pela Jornada (jornada/).

// Sessão das telas: voltar ao menu (goHome) troca a sessão. O fluxo antigo fica órfão: as esperas dele
// (sleep) nunca mais continuam e o choose dele fica numa tela que já saiu, então ele não redesenha nada.
let session = 0;
const homeWaiters = new Set<() => void>();

/** Resultado de `untilHome` quando o jogador voltou ao menu. */
export const HOME = Symbol('home');

/** Espera `ms`. Se o jogador voltar ao menu no meio, nunca resolve (o fluxo que esperava para ali). */
export const sleep = (ms: number) => {
  const s = session;
  return new Promise<void>((r) => setTimeout(() => s === session && r(), ms));
};

/** Espera o fluxo terminar ou o jogador voltar ao menu, o que vier primeiro. */
export async function untilHome<T>(p: Promise<T>): Promise<T | typeof HOME> {
  let done!: () => void;
  const home = new Promise<typeof HOME>((r) => (done = () => r(HOME)));
  homeWaiters.add(done);
  try {
    return await Promise.race([p, home]);
  } finally {
    homeWaiters.delete(done);
  }
}

/** Volta ao menu sem recarregar: troca a sessão, fecha as camadas por cima e solta quem espera em `untilHome`. */
export function goHome(): void {
  session++;
  document.querySelectorAll('.modal, .jtree-screen, .jmoves-screen, .sheet-wrap').forEach((el) => el.remove());
  for (const f of [...homeWaiters]) f();
}
export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function h(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

/** Botão desligado. As células de ação usam `aria-disabled` (e não `disabled`) para a dica abrir mesmo assim. */
export const isOff = (btn: HTMLElement) => (btn as HTMLButtonElement).disabled || btn.getAttribute('aria-disabled') === 'true';

/** Espera um clique em qualquer `[data-choice]` dentro de `root` e devolve o valor. */
export function choose<T extends string>(root: HTMLElement): Promise<T> {
  return new Promise((resolve) => {
    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-choice]');
      if (!btn || !root.contains(btn) || isOff(btn)) return;
      root.removeEventListener('click', onClick);
      resolve(btn.dataset.choice as T);
    };
    root.addEventListener('click', onClick);
  });
}

export function show(el: HTMLElement): HTMLElement {
  const screen = document.getElementById('screen')!;
  screen.replaceChildren(el);
  window.scrollTo({ top: 0 });
  // A tela trocou: o foco ia ficar num botão que saiu do DOM (teclado e leitor de tela se perdiam). Vai para o começo da
  // tela nova, menos quando há uma janela aberta por cima (ela fica com o foco).
  if (!document.querySelector('[aria-modal="true"]')) screen.focus({ preventScroll: true });
  return el;
}

/** Lê um texto em voz alta no leitor de tela (região `aria-live`), sem mostrar nada. */
export function announce(text: string): void {
  let el = document.getElementById('announcer');
  if (!el) {
    el = h('<div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>');
    document.body.appendChild(el);
  }
  // Limpar antes faz o mesmo texto ser lido de novo (duas roletas seguidas com o mesmo resultado).
  el.textContent = '';
  const target = el;
  setTimeout(() => (target.textContent = text), 50);
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Janela por cima da tela (Ficha, Registro, loja, árvore...): marca como diálogo modal, põe o foco nela, mantém o Tab
 * dentro, fecha com Escape (aperta o `[data-close]` dela, o mesmo caminho do botão) e devolve o foco a quem abriu.
 * Os fechamentos de cada janela seguem iguais: ela só percebe que saiu do DOM.
 */
export function openDialog(overlay: HTMLElement): void {
  const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (!overlay.hasAttribute('role')) overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  if (!overlay.hasAttribute('tabindex')) overlay.tabIndex = -1;
  if (!overlay.isConnected) document.body.appendChild(overlay);
  overlay.focus({ preventScroll: true });

  const onKey = (e: KeyboardEvent) => {
    if (!overlay.isConnected) return done();
    if (e.key === 'Escape') {
      // Com uma dica aberta, o Escape fecha só a dica.
      if (document.querySelector('.tip:not([hidden])')) return;
      e.preventDefault();
      overlay.querySelector<HTMLElement>('[data-close]')?.click();
    } else if (e.key === 'Tab') {
      const items = [...overlay.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!items.length) return e.preventDefault();
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === overlay)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (at === last || !overlay.contains(at))) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  const parent = overlay.parentNode!;
  const watch = new MutationObserver(() => !overlay.isConnected && done());
  let closed = false;
  function done() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    watch.disconnect();
    if (back?.isConnected) back.focus({ preventScroll: true });
  }
  // Captura: vê a dica ainda aberta antes de o Escape dela a fechar.
  document.addEventListener('keydown', onKey, true);
  watch.observe(parent, { childList: true });
}
