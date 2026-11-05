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
  document.getElementById('screen')!.replaceChildren(el);
  window.scrollTo({ top: 0 });
  return el;
}
