// Movimento das interações da Jornada (docs/visual.md#movimento, v0.70.0). O desenho fica no CSS
// (`styles/jornada-motion.css`); aqui só se liga a classe e se espera o tempo do gesto. Nada disto muda regra.
import { sleep } from '../dom';

/** Quem pediu menos movimento não espera por animação. */
const calm = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A escolha feita leva o carimbo (hanko 道, "o caminho") e as outras opções esmaecem, antes de a tela seguir. É o
 * momento de autoria do evento: quem decide é o jogador, e o carimbo é como o mundo shinobi firma uma decisão.
 */
export async function stampChoice(options: HTMLElement, pick: string, instant: boolean): Promise<void> {
  for (const b of options.querySelectorAll<HTMLButtonElement>('[data-choice]')) {
    const chosen = b.dataset.choice === pick;
    b.classList.add(chosen ? 'chosen' : 'passed');
    // O toque já foi dado: os botões deixam de responder, sem o desbotado de "desativado" no escolhido.
    b.setAttribute('aria-disabled', 'true');
    if (chosen) b.insertAdjacentHTML('beforeend', '<span class="seal stamp choice-seal" aria-hidden="true">道</span>');
  }
  await sleep(instant || calm() ? 0 : 480);
}

/** Um evento emendado no outro entra como uma pincelada de tinta, da esquerda para a direita. */
export function inkWipe(root: HTMLElement, instant: boolean): void {
  if (instant || calm()) return;
  root.classList.add('ink-in');
  root.addEventListener('animationend', () => root.classList.remove('ink-in'), { once: true });
}
