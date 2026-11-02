// Utilitários de DOM do protótipo, usados pelo Roleta (main.ts) e pela Jornada (jornada/).

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
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
  document.getElementById('screen')!.replaceChildren(el);
  window.scrollTo({ top: 0 });
  return el;
}
