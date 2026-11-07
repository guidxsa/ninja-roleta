// Painéis minimizáveis do widescreen (docs/visual.md, "Celular e desktop"): loja, relíquias e bolsa, próxima parada,
// dica, sua run e, na luta, ordem da rodada e fichas. As ações nunca dobram. Abaixo de 1280px o CSS ignora tudo isto.
// A escolha fica no navegador (conveniência de quem joga): sem localStorage, os painéis só começam abertos.
import { ptBR as S } from '../../src/data/strings/ptBR';
import { tip } from '../tooltip';

const KEY = 'jornada_folds_v1';
const U = S.jornada.ui;

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const folded = load();

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...folded]));
  } catch {
    /* sem armazenamento: a escolha vale só nesta tela */
  }
}

/** Atributos do painel que dobra: `data-fold` e, se estiver minimizado, `data-folded`. */
export const foldAttrs = (key: string): string => ` data-fold="${key}"${folded.has(key) ? ' data-folded' : ''}`;

/** Botão de minimizar e expandir do painel (canto de cima, só no widescreen). */
export const foldButton = (key: string): string =>
  `<button type="button" class="jfold" data-fold-toggle="${key}" aria-expanded="${!folded.has(key)}" aria-label="${U.foldTitle}"${tip(U.foldTitle, U.foldTip)}></button>`;

let installed = false;

/** Um ouvinte só, no documento: serve a todas as telas que tiverem painéis. */
export function installFolds(): void {
  if (installed) return;
  installed = true;
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-fold-toggle]');
    if (!b) return;
    e.stopPropagation();
    const key = b.dataset.foldToggle!;
    const now = !folded.has(key);
    if (now) folded.add(key);
    else folded.delete(key);
    save();
    document.querySelectorAll<HTMLElement>(`[data-fold="${key}"]`).forEach((el) => el.toggleAttribute('data-folded', now));
    document.querySelectorAll<HTMLElement>(`[data-fold-toggle="${key}"]`).forEach((el) => el.setAttribute('aria-expanded', String(!now)));
  }, true);
}
