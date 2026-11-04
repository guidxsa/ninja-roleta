// Tela que pergunta o nome do jogador (uma vez, guardado no perfil). Usada pelo Roleta e pelo Caminho Ninja.
import { ptBR as S } from '../src/data/strings/ptBR';
import { PLAYER_NAME_MAX, cleanPlayerName } from '../src/state/profile';
import { choose, h, show } from './dom';

/** Devolve o nome limpo; '' se o jogador preferiu não dizer. */
export async function askPlayerName(): Promise<string> {
  const N = S.ui.playerName;
  const root = show(
    h(`<div class="screen jname"><h2>${N.title}</h2>
      <section class="card"><form data-form>
        <label class="field"><span>${N.label}</span>
          <input type="text" data-input maxlength="${PLAYER_NAME_MAX}" autocomplete="nickname" enterkeyhint="done" placeholder="${N.placeholder}"></label>
      </form><p class="muted small">${N.hint}</p></section>
      <button class="btn primary big" data-choice="ok">${N.confirm}</button>
      <button class="btn small jname-skip" data-choice="skip">${N.skip}</button></div>`),
  );
  const input = root.querySelector<HTMLInputElement>('[data-input]')!;
  root.querySelector('[data-form]')!.addEventListener('submit', (e) => {
    e.preventDefault();
    root.querySelector<HTMLElement>('[data-choice="ok"]')!.click();
  });
  input.focus();
  const c = await choose<'ok' | 'skip'>(root);
  return c === 'ok' ? cleanPlayerName(input.value) : '';
}
